import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import type { DecideRequest } from "../src/types";
import { fixtureDecide } from "./fixture";
import { resolveJevProvider } from "./keys";
import { liveDecide } from "./typesafe";

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw));
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

export function jevDecidePlugin(): Plugin {
  return {
    name: "jev-decide",
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

        if (url === "/api/decide" && req.method === "POST") {
          try {
            const body = (await readJson(req)) as DecideRequest;
            if (!body?.goal || !Array.isArray(body.elements) || !body.portal) {
              send(res, 400, { error: "Invalid decide payload" });
              return;
            }
            const provider = resolveJevProvider();
            if (provider) {
              const decision = await liveDecide(body);
              send(res, 200, decision);
              return;
            }
            send(res, 200, fixtureDecide(body));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Decide failed";
            send(res, 502, {
              operation: "WAIT",
              target: null,
              confidence: 0,
              operation_probabilities: {},
              target_probabilities: {},
              latency_ms: 0,
              source: resolveJevProvider() ? "live" : "fixture",
              error: message,
            });
          }
          return;
        }

        next();
      });
    },
  };
}
