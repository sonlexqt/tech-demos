import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import type { Intent } from "../src/types";
import { extractCandidates } from "./extract";
import { fixtureClassify } from "./fixture";
import { resolveJevProvider } from "./keys";
import { emptyClassify } from "./proposals";
import { liveClassify } from "./typesafe";

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

export function jevClipboardPlugin(): Plugin {
  return {
    name: "jev-jaste-clipboard",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url === "/api/mode" && req.method === "GET") {
          const provider = resolveJevProvider();
          send(res, 200, {
            mode: provider ? "live" : "fixture",
            provider: provider?.label ?? null,
          });
          return;
        }

        if (url === "/api/classify" && req.method === "POST") {
          try {
            const body = await readJson(req);
            const clipboard = typeof body.clipboard === "string" ? body.clipboard.trim() : "";
            if (!clipboard) {
              send(res, 400, emptyClassify({ error: "Paste some clipboard text first." }));
              return;
            }

            const candidates = extractCandidates(clipboard);
            const provider = resolveJevProvider();
            if (provider) {
              const live = await liveClassify(clipboard, candidates);
              send(
                res,
                200,
                emptyClassify({
                  mode: "live",
                  provider: provider.label,
                  model: live.model,
                  latency_ms: live.latency_ms,
                  intent: (live.judgment.intent.choice ?? "junk") as Intent,
                  intent_probabilities: live.judgment.intent.probabilities ?? {},
                  intent_confidence: live.judgment.intent.confidence ?? 0,
                  fit_score: live.judgment.paste_fit.score ?? 0,
                  fit_confidence: live.judgment.paste_fit.confidence ?? 0,
                  proposals: live.proposals,
                }),
              );
              return;
            }

            const fixture = fixtureClassify(clipboard, candidates);
            send(
              res,
              200,
              emptyClassify({
                mode: "fixture",
                provider: null,
                model: "fixture",
                latency_ms: fixture.latency_ms,
                intent: (fixture.judgment.intent.choice ?? "junk") as Intent,
                intent_probabilities: fixture.judgment.intent.probabilities ?? {},
                intent_confidence: fixture.judgment.intent.confidence ?? 0,
                fit_score: fixture.judgment.paste_fit.score ?? 0,
                fit_confidence: fixture.judgment.paste_fit.confidence ?? 0,
                proposals: fixture.proposals,
              }),
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : "Classify failed";
            send(
              res,
              502,
              emptyClassify({
                mode: resolveJevProvider() ? "live" : "fixture",
                provider: resolveJevProvider()?.label ?? null,
                error: message,
              }),
            );
          }
          return;
        }

        next();
      });
    },
  };
}
