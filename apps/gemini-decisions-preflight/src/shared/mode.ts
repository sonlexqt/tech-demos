import type { AdapterMode } from "./types.ts";

export function resolveMode(env: NodeJS.ProcessEnv = process.env): AdapterMode {
  const flag = (env.DECISIONS_MODE ?? "auto").trim().toLowerCase();
  const hasKey = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() && env.GEMINI_API_KEY !== "your-gemini-api-key-here");
  if (flag === "mock") return "mock";
  if (flag === "live") {
    if (!hasKey) {
      throw new Error("DECISIONS_MODE=live requires GEMINI_API_KEY");
    }
    return "live";
  }
  if (flag === "auto" || flag === "") {
    return hasKey ? "live" : "mock";
  }
  throw new Error(`Unknown DECISIONS_MODE="${env.DECISIONS_MODE}". Use mock, live, or auto.`);
}

/** Default matches the committed live eval. Override with GENERATIVE_MODEL. */
export const DEFAULT_GENERATIVE_MODEL = "gemini-3.5-flash-lite";

export function generativeModel(env: NodeJS.ProcessEnv = process.env): string {
  return env.GENERATIVE_MODEL?.trim() || DEFAULT_GENERATIVE_MODEL;
}
