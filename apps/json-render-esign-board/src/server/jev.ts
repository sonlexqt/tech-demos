import {
  experimental_composeSpec,
  experimental_createEvaluator,
  type Spec,
} from "@json-render/core";
import type { Connect } from "vite";
import { catalog } from "../catalog";
import { buildEsignCandidates, JEV_INSTRUCTIONS, jevContext } from "../generate/candidates";

/** Documented aliases. Prefer JEV_API_KEY; never use a VITE_ prefix. */
export const JEV_KEY_NAMES = [
  "JEV_API_KEY",
  "JEV_AI_GATEWAY_API_KEY",
  "AI_GATEWAY_API_KEY",
] as const;

export const JEV_MODEL = "typesafe-ai/jev";

export function resolveJevApiKey(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  for (const name of JEV_KEY_NAMES) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function jevStatus(env: Record<string, string | undefined> = process.env) {
  const available = Boolean(resolveJevApiKey(env));
  return {
    available,
    engine: available ? ("jev" as const) : ("fixture" as const),
    model: available ? JEV_MODEL : null,
  };
}

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => {
      chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk));
    });
    req.on("end", () => {
      const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const raw = new TextDecoder().decode(merged);
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function pathnameOf(url: string | undefined): string {
  if (!url) return "";
  return url.split("?")[0] ?? "";
}

export function createJevMiddleware(
  env: Record<string, string | undefined> = process.env,
): Connect.NextHandleFunction {
  return (req, res, next) => {
    const path = pathnameOf(req.url);
    if (path !== "/api/compose" && path !== "/api/compose/status") {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-store");

    if (path === "/api/compose/status" && req.method === "GET") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(jevStatus(env)));
      return;
    }

    if (path === "/api/compose" && req.method === "POST") {
      void (async () => {
        const apiKey = resolveJevApiKey(env);
        if (!apiKey) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Jev is not configured. Set JEV_API_KEY on the server.",
              engine: "fixture",
            }),
          );
          return;
        }

        const body = (await readJsonBody(req)) as { prompt?: unknown };
        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
        if (!prompt) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "prompt is required" }));
          return;
        }

        const evaluate = experimental_createEvaluator({
          apiKey,
          model: JEV_MODEL,
          timeoutMs: 15_000,
        });

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");

        const controller = new AbortController();
        req.on("close", () => controller.abort());

        try {
          for await (const event of experimental_composeSpec({
            catalog,
            candidates: buildEsignCandidates(),
            prompt,
            evaluate,
            initialState: {},
            context: jevContext(),
            instructions: JEV_INSTRUCTIONS,
            strategy: "batch",
            maxElements: 24,
            maxSteps: 8,
            maxDepth: 6,
            signal: controller.signal,
          })) {
            const payload =
              event.type === "step"
                ? { type: "step", spec: event.spec as Spec, step: event.step }
                : {
                    type: "complete",
                    spec: event.spec,
                    stopReason: event.stopReason,
                    elapsedMs: event.elapsedMs,
                  };
            res.write(`${JSON.stringify(payload)}\n`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Jev compose failed";
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: message, engine: "jev" }));
            return;
          }
          res.write(`${JSON.stringify({ type: "error", error: message })}\n`);
        } finally {
          res.end();
        }
      })().catch((error: unknown) => {
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Compose failed",
            }),
          );
        }
      });
      return;
    }

    next();
  };
}
