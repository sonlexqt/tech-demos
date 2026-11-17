import { describe, expect, test } from "bun:test";
import { HttpAgent } from "@ag-ui/client";
import { EventType, type BaseEvent } from "@ag-ui/core";
import { createApp } from "../src/server/app";
import { defaultApprovalPayload } from "../src/shared/interrupt-schema";
import type { EnvelopeState } from "../src/shared/types";

async function listen(): Promise<{ url: string; stop: () => void }> {
  const app = createApp();
  const server = Bun.serve({
    port: 0,
    fetch: (req) => app.fetch(req),
  });
  return {
    url: `http://127.0.0.1:${server.port}/agui`,
    stop: () => server.stop(true),
  };
}

describe("mock AG-UI smoke", () => {
  test("streams placements, interrupts with a schema, then finishes on resume", async () => {
    const { url, stop } = await listen();
    try {
      const events: BaseEvent[] = [];
      const agent = new HttpAgent({
        url,
        threadId: "thread_test",
        initialState: {},
      });
      agent.subscribe({
        onEvent: ({ event }) => {
          events.push(event);
        },
      });
      agent.messages = [{ id: "u1", role: "user", content: "Prepare this envelope for me" }];

      await agent.runAgent({ forwardedProps: { mode: "mock", delayMs: 0 } });

      const types = events.map((e) => e.type);
      expect(types[0]).toBe(EventType.RUN_STARTED);
      expect(types).toContain(EventType.STATE_SNAPSHOT);
      expect(types).toContain(EventType.STATE_DELTA);
      expect(types).toContain(EventType.TOOL_CALL_START);
      expect(types).toContain(EventType.TEXT_MESSAGE_CONTENT);
      expect(agent.pendingInterrupts).toHaveLength(1);
      const interrupt = agent.pendingInterrupts[0];
      expect(interrupt.responseSchema).toBeDefined();
      expect((interrupt.responseSchema as { properties?: { approved?: unknown } }).properties?.approved).toBeDefined();

      const state = agent.state as EnvelopeState;
      expect(state.fields.length).toBe(8);
      expect(state.fields.some((f) => f.id === "priya-initials" && f.page === 5)).toBe(true);
      expect(state.fields.some((f) => f.id === "jordan-date" && f.confidence < 0.5)).toBe(true);

      const moved = {
        ...state,
        fields: state.fields.map((f) =>
          f.id === "priya-initials" ? { ...f, page: 6, source: "human" as const } : f,
        ),
      };
      agent.setState(moved);

      await agent.runAgent({
        resume: [
          {
            interruptId: interrupt.id,
            status: "resolved",
            payload: defaultApprovalPayload(moved),
          },
        ],
      });

      const finished = events.filter((e) => e.type === EventType.RUN_FINISHED);
      expect(finished.length).toBe(2);
      const last = finished[1] as { outcome?: { type?: string }; result?: { ready?: boolean } };
      expect(last.outcome?.type ?? "success").toBe("success");
      expect(last.result?.ready).toBe(true);
      expect((agent.state as EnvelopeState).status).toBe("ready");
      expect((agent.state as EnvelopeState).summary).toContain("Ready to send");
    } finally {
      stop();
    }
  }, 20000);
});
