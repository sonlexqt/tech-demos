import type { AdapterMode } from "./types.ts";

export function resolveMode(env: NodeJS.ProcessEnv = process.env): AdapterMode {
  const flag = (env.DECISIONS_MODE ?? "auto").toLowerCase();
  const hasKey = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() && env.GEMINI_API_KEY !== "your-gemini-api-key-here");
  if (flag === "mock") return "mock";
  if (flag === "live") {
    if (!hasKey) {
      throw new Error("DECISIONS_MODE=live requires GEMINI_API_KEY");
    }
    return "live";
  }
  return hasKey ? "live" : "mock";
}

export function generativeModel(env: NodeJS.ProcessEnv = process.env): string {
  return env.GENERATIVE_MODEL?.trim() || "gemini-3.5-flash";
}
