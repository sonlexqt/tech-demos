export type JevProvider = {
  key: string;
  url: string;
  model: string;
  label: "typesafe";
};

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * Live Jev only when JEV_API_KEY is set. No VITE_ prefix — this never reaches the client bundle.
 * Documented TypeSafe endpoint: POST https://api.typesafe.ai/v1/systemone
 */
export function resolveJevProvider(): JevProvider | null {
  const key = firstEnv("JEV_API_KEY");
  if (!key) return null;
  return {
    key,
    url: firstEnv("JEV_BASE_URL") || "https://api.typesafe.ai/v1/systemone",
    model: firstEnv("JEV_MODEL") || "jev-latest",
    label: "typesafe",
  };
}
