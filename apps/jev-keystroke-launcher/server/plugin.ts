import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import type { RankResponse } from "../src/types";
import { rankCatalog } from "./fixtureRanker";
import { liveRank } from "./jevRank";
import { resolveJevProvider } from "./keys";

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

function fixturePayload(query: string, extra: Partial<RankResponse> = {}): RankResponse {
  const started = Date.now();
  const items = rankCatalog(query);
  return {
    mode: "fixture",
    provider: null,
    model: "fixture",
    query,
    latency_ms: Date.now() - started,
    items,
    ...extra,
  };
}

export function jevRankPlugin(): Plugin {
  return {
    name: "jev-keystroke-rank",
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

        if (url === "/api/rank" && req.method === "POST") {
          try {
            const body = await readJson(req);
            const query = typeof body.query === "string" ? body.query : "";
            const provider = resolveJevProvider();

            if (provider && query.trim()) {
              try {
                const live = await liveRank(query.trim());
                send(res, 200, {
                  mode: "live",
                  provider: provider.label,
                  model: live.model,
                  query,
                  latency_ms: live.latency_ms,
                  items: live.items,
                } satisfies RankResponse);
                return;
              } catch (error) {
                const message = error instanceof Error ? error.message : "Live Jev failed";
                send(res, 200, fixturePayload(query, { error: message }));
                return;
              }
            }

            send(res, 200, fixturePayload(query));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Rank failed";
            send(res, 502, fixturePayload("", { error: message }));
          }
          return;
        }

        next();
      });
    },
  };
}
