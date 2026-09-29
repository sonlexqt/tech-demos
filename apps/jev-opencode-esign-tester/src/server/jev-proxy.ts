import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const LIVE_ENDPOINT = "https://jevtypesafeai.com/api/v1/decide";
const SYSTEMONE_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function resolveUpstream(apiKey: string): { url: string; model?: string } {
  if (apiKey.startsWith("jv_live_")) {
    return { url: LIVE_ENDPOINT };
  }
  if (apiKey.startsWith("sk-or-")) {
    return { url: OPENROUTER_ENDPOINT, model: "typesafe/jev-latest" };
  }
  return { url: SYSTEMONE_ENDPOINT, model: "jev-latest" };
}

export function jevProxyPlugin(apiKey: string): Plugin {
  return {
    name: "jev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (url === "/api/jev/mode" && req.method === "GET") {
          sendJson(res, 200, {
            mode: apiKey ? "live" : "fixture",
            hasKey: Boolean(apiKey),
          });
          return;
        }

        if (url === "/api/jev/decide" && req.method === "POST") {
          if (!apiKey) {
            sendJson(res, 503, {
              error: "JEV_API_KEY is not set; use the fixture chooser.",
              mode: "fixture",
            });
            return;
          }

          try {
            const raw = await readBody(req);
            const incoming = raw ? JSON.parse(raw) : {};
            const upstream = resolveUpstream(apiKey);
            const payload = {
              model: incoming.model ?? upstream.model,
              state: incoming.state,
              questions: incoming.questions,
            };

            const response = await fetch(upstream.url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            const text = await response.text();
            let data: unknown = text;
            try {
              data = text ? JSON.parse(text) : {};
            } catch {
              data = { error: text || "Live Jev returned a non-JSON body" };
            }
            sendJson(res, response.ok ? 200 : response.status, data);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Proxy failed";
            sendJson(res, 502, { error: message });
          }
          return;
        }

        next();
      });
    },
  };
}
