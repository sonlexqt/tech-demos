import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import { createServer as createViteServer } from "vite";
import { CHECKS, CONFIDENCE_THRESHOLD, questionCount } from "./shared/questions.ts";
import { classifyAnswers, counts } from "./shared/classify.ts";
import { decisionsUsd, formatUsd } from "./shared/cost.ts";
import { resolveMode } from "./shared/mode.ts";
import { GROUND_TRUTHS, TRUTH_BY_ID } from "./fixtures/truth.ts";
import { loadFixturePdf, runDecisions } from "./api/adapter.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  loadEnvFile(path.join(ROOT, ".env"));
} catch {
  // optional
}

function json(res: ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(data);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const route = url.pathname;

  if (req.method === "GET" && route === "/api/health") {
    let mode: "mock" | "live";
    try {
      mode = resolveMode();
    } catch (err) {
      json(res, 500, { error: String(err) });
      return;
    }
    json(res, 200, {
      mode,
      mock: mode === "mock",
      label: mode === "mock" ? "MOCK" : "LIVE",
      model: "gemini-decision-1",
      questionCount: questionCount(),
      confidenceThreshold: CONFIDENCE_THRESHOLD,
      decisionsPricing: { inputUsdPerMillion: 0.1, outputUsdPerMillion: 0 },
    });
    return;
  }

  if (req.method === "GET" && route === "/api/checks") {
    json(
      res,
      200,
      CHECKS.map((c) => ({
        id: c.id,
        group: c.group,
        label: c.label,
        hint: c.hint,
        appliesTo: c.appliesTo,
        type: c.question.type,
      })),
    );
    return;
  }

  if (req.method === "GET" && route === "/api/fixtures") {
    json(
      res,
      200,
      GROUND_TRUTHS.map((g) => ({
        id: g.id,
        title: g.title,
        documentType: g.documentType,
        planted: g.planted,
        plantedIssueCount: g.plantedIssues.length,
        pdfUrl: `/api/fixtures/${g.id}.pdf`,
      })),
    );
    return;
  }

  const pdfMatch = route.match(/^\/api\/fixtures\/([a-z0-9-]+)\.pdf$/);
  if (req.method === "GET" && pdfMatch) {
    const id = pdfMatch[1];
    if (!TRUTH_BY_ID[id]) {
      json(res, 404, { error: "unknown fixture" });
      return;
    }
    const bytes = await loadFixturePdf(id);
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": bytes.byteLength,
      "Content-Disposition": `inline; filename="${id}.pdf"`,
    });
    res.end(Buffer.from(bytes));
    return;
  }

  if (req.method === "POST" && route === "/api/preflight") {
    const body = await readJson(req);
    let pdfBytes: Uint8Array;
    let fixtureId: string | undefined;
    if (typeof body.fixtureId === "string" && TRUTH_BY_ID[body.fixtureId]) {
      fixtureId = body.fixtureId;
      pdfBytes = await loadFixturePdf(fixtureId);
    } else if (typeof body.pdfBase64 === "string") {
      pdfBytes = Buffer.from(body.pdfBase64, "base64");
      if (pdfBytes.byteLength > 5 * 1024 * 1024) {
        json(res, 413, { error: "PDF too large for this demo (5 MB cap)" });
        return;
      }
    } else {
      json(res, 400, { error: "Provide fixtureId or pdfBase64" });
      return;
    }

    try {
      const result = await runDecisions({
        pdfBytes,
        fixtureId,
        note: "Lumin Sign send-ready preflight. Evaluate the attached contract PDF.",
      });
      const classified = classifyAnswers(result.response.answers, {
        expected: result.truth?.expected,
      });
      json(res, 200, {
        mode: result.mode,
        mock: result.mode === "mock",
        label: result.mode === "mock" ? "MOCK" : "LIVE",
        model: result.model,
        fixtureId: result.fixtureId ?? fixtureId ?? null,
        truthTitle: result.truth?.title ?? null,
        plantedIssues: result.truth?.plantedIssues ?? [],
        latencyMs: result.latencyMs,
        usage: result.response.usage,
        costUsd: decisionsUsd(result.response.usage),
        costLabel: formatUsd(decisionsUsd(result.response.usage)),
        counts: counts(classified),
        checks: classified,
        confidenceThreshold: CONFIDENCE_THRESHOLD,
        outputTokensBilled: result.response.usage.total_output_tokens,
      });
    } catch (err) {
      json(res, 502, { error: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  json(res, 404, { error: "not found" });
}

const port = Number(process.env.PORT ?? 5173);

const vite = await createViteServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: "spa",
});

const server = createServer((req, res) => {
  const url = req.url ?? "/";
  if (url.startsWith("/api/")) {
    handleApi(req, res).catch((err) => {
      json(res, 500, { error: String(err) });
    });
    return;
  }
  vite.middlewares(req, res, async () => {
    try {
      const html = await readFile(path.join(ROOT, "index.html"), "utf8");
      const transformed = await vite.transformIndexHtml(url, html);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(transformed);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(String(err));
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  const mode = (() => {
    try {
      return resolveMode();
    } catch {
      return "unresolved";
    }
  })();
  console.log(`Lumin Sign preflight  http://127.0.0.1:${port}  (${mode})`);
});
