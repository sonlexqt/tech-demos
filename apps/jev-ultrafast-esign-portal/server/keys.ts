export type JevProvider = {
  key: string;
  url: string;
  model: string;
  label: "typesafe" | "ai-gateway";
};

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * Key order from the demo brief: JEV_API_KEY, then JEV_AI_GATEWAY_API_KEY, then AI_GATEWAY_API_KEY.
 * Direct TypeSafe uses the same System One body as jev-ultrafast/model.py.
 * Gateway keys use Vercel's TypeSafe-compatible /typesafe/v1/systemone path.
 */
export function resolveJevProvider(): JevProvider | null {
  const jevKey = firstEnv("JEV_API_KEY");
  if (jevKey) {
    return {
      key: jevKey,
      url: firstEnv("JEV_BASE_URL") || "https://api.typesafe.ai/v1/systemone",
      model: firstEnv("JEV_MODEL", "TYPESAFE_MODEL") || "jev-latest",
      label: "typesafe",
    };
  }

  const gatewayKey = firstEnv("JEV_AI_GATEWAY_API_KEY", "AI_GATEWAY_API_KEY");
  if (gatewayKey) {
    return {
      key: gatewayKey,
      url: firstEnv("JEV_BASE_URL") || "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
      model: firstEnv("JEV_MODEL") || "typesafe-ai/jev",
      label: "ai-gateway",
    };
  }

  return null;
}

export function resolveTextModel() {
  const key = firstEnv("TEXT_MODEL_API_KEY");
  if (!key) return null;
  return {
    key,
    base: (firstEnv("TEXT_MODEL_BASE_URL") || "https://api.deepseek.com/v1").replace(/\/$/, ""),
    model: firstEnv("TEXT_MODEL") || "deepseek-chat",
    reasoning: firstEnv("TEXT_MODEL_REASONING"),
  };
}
