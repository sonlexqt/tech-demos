import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import type { RankMode, RankResponse } from "../src/api/rank-types";
import { FIXTURE_ITEMS } from "../src/catalog/fixtures";
import { mapJevProbabilities } from "../src/ranker/jev-map";
import { rankWorkspace } from "../src/ranker/score";

const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = "jev-1.13.0";
const JEV_TIMEOUT_MS = 4000;
const UNREACHABLE_NOTE = "Jev unreachable — fixture ranking";

export function resolveRankMode(env: NodeJS.ProcessEnv): RankMode {
  return env.JEV_API_KEY ? "live" : "fixture";
}

function fixtureResponse(query: string, mode: RankMode, note?: string): RankResponse {
  return {
    hits: rankWorkspace(query),
    mode,
    source: "fixture",
    note,
  };
}

function criteriaForCatalog(): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const item of FIXTURE_ITEMS) {
    const facts = [
      item.subtitle,
      item.downloadedAt ? `downloadedAt ${item.downloadedAt}` : null,
      item.signature
        ? `signature ${item.signature.status}${item.signature.waitingOn ? ` ${item.signature.waitingOn}` : ""}${item.signature.documentType ? ` ${item.signature.documentType}` : ""}`
        : null,
    ]
      .filter(Boolean)
      .join("; ");
    criteria[item.id] = `${item.title} — ${item.kind}; ${facts}`;
  }
  return criteria;
}

export async function handleRank(
  query: string,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch,
): Promise<RankResponse> {
  const mode = resolveRankMode(env);
  if (mode === "fixture") {
    return fixtureResponse(query, mode);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JEV_TIMEOUT_MS);

  try {
    const response = await fetchImpl(JEV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.JEV_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: JEV_MODEL,
        state: {
          query,
          catalog: FIXTURE_ITEMS.map((item) => ({
            id: item.id,
            title: item.title,
            kind: item.kind,
            subtitle: item.subtitle,
            tags: item.tags,
            downloadedAt: item.downloadedAt ?? null,
            signature: item.signature ?? null,
          })),
        },
        questions: {
          best_item: {
            type: "choice",
            instructions:
              "Which catalog item best matches the user's launcher intent? Prefer recency for downloads, waiting-on-legal for signature waits, MSA countersign for MSA countersign, expired requests for expired phrasing.",
            criteria: criteriaForCatalog(),
          },
        },
      }),
    });

    if (!response.ok) {
      return fixtureResponse(query, mode, UNREACHABLE_NOTE);
    }

    const payload = (await response.json()) as {
      answers?: {
        best_item?: { probabilities?: Record<string, number> };
      };
    };
    const probabilities = payload.answers?.best_item?.probabilities;
    if (!probabilities) {
      return fixtureResponse(query, mode, UNREACHABLE_NOTE);
    }

    return {
      hits: mapJevProbabilities(FIXTURE_ITEMS, probabilities, rankWorkspace(query)),
      mode,
      source: "jev",
    };
  } catch {
    return fixtureResponse(query, mode, UNREACHABLE_NOTE);
  } finally {
    clearTimeout(timer);
  }
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
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

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function createJevProxyPlugin(): Plugin {
  return {
    name: "jev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (req.method === "GET" && url === "/api/rank-mode") {
          sendJson(res, 200, { mode: resolveRankMode(process.env) });
          return;
        }
        if (req.method === "POST" && url === "/api/rank") {
          try {
            const body = (await readJsonBody(req)) as { query?: unknown };
            if (!body || !("query" in body) || typeof body.query !== "string") {
              sendJson(res, 400, { error: "query required" });
              return;
            }
            const result = await handleRank(body.query, process.env, fetch);
            sendJson(res, 200, result);
          } catch {
            sendJson(res, 400, { error: "query required" });
          }
          return;
        }
        next();
      });
    },
  };
}
