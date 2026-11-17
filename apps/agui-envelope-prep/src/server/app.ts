import { Hono } from "hono";
import { cors } from "hono/cors";
import type { RunAgentInput } from "@ag-ui/core";
import { groundTruthFromLayout } from "../shared/layout";
import { liveConfigured } from "./gemini";
import { runLiveAgent } from "./live-agent";
import { runMockAgent } from "./mock-agent";
import { createEncoder, sseResponse } from "./stream";
import { getThread } from "./threads";

export type AgentMode = "mock" | "live";

function resolveMode(input: RunAgentInput): AgentMode {
  const forwarded = (input.forwardedProps ?? {}) as { mode?: string };
  const requested = forwarded.mode ?? process.env.AGUI_MODE ?? "mock";
  return requested === "live" ? "live" : "mock";
}

function delayMs(input: RunAgentInput): number {
  const forwarded = (input.forwardedProps ?? {}) as { delayMs?: number };
  if (typeof forwarded.delayMs === "number") return Math.max(0, forwarded.delayMs);
  const env = Number(process.env.AGUI_MOCK_DELAY_MS ?? 90);
  return Number.isFinite(env) ? Math.max(0, env) : 90;
}

export function createApp() {
  const app = new Hono();
  app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Accept"] }));

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      service: "agui-envelope-prep",
      liveConfigured: liveConfigured(),
      defaultMode: process.env.AGUI_MODE === "live" && liveConfigured() ? "live" : "mock",
    }),
  );

  app.get("/api/ground-truth", (c) => c.json(groundTruthFromLayout()));

  app.get("/api/thread/:id", (c) => {
    const thread = getThread(c.req.param("id"));
    if (!thread) return c.json({ error: "not_found" }, 404);
    return c.json(thread);
  });

  app.post("/agui", async (c) => {
    const accept = c.req.header("accept") ?? undefined;
    const encoder = createEncoder(accept);
    let input: RunAgentInput;
    try {
      input = (await c.req.json()) as RunAgentInput;
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (!input.threadId || !input.runId) {
      return c.json({ error: "threadId and runId are required" }, 400);
    }
    const mode = resolveMode(input);
    return sseResponse(encoder, async (send) => {
      if (mode === "live") {
        await runLiveAgent(input, send);
      } else {
        await runMockAgent(input, send, { delayMs: delayMs(input) });
      }
    });
  });

  return app;
}
