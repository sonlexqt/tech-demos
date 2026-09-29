import {
  buildDecideRequest,
  chooseFixture,
  parseLiveDecision,
} from "../core/chooser";
import type { Decision, JevMode, PlanStep, SignState } from "../core/types";

export type ModeResponse = {
  mode: JevMode;
  hasKey: boolean;
};

export async function fetchJevMode(): Promise<ModeResponse> {
  try {
    const response = await fetch("/api/jev/mode");
    if (!response.ok) {
      return { mode: "fixture", hasKey: false };
    }
    const data = (await response.json()) as ModeResponse;
    return {
      mode: data.mode === "live" ? "live" : "fixture",
      hasKey: Boolean(data.hasKey),
    };
  } catch {
    return { mode: "fixture", hasKey: false };
  }
}

export async function decideForStep(
  step: PlanStep,
  state: SignState,
  mode: JevMode,
): Promise<Decision> {
  if (mode !== "live") {
    return chooseFixture(step, state);
  }

  const body = buildDecideRequest(step, state);
  const response = await fetch("/api/jev/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as {
    error?: string;
    answers?: Record<
      string,
      {
        type?: string;
        choice?: string;
        score?: number;
        confidence?: number;
        probabilities?: Record<string, number>;
      }
    >;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Live Jev failed (${response.status})`);
  }

  return parseLiveDecision(step, payload);
}
