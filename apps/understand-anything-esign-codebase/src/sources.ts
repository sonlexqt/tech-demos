const raw = import.meta.glob("../fixture-codebase/**/*.{ts,md}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const fixtureSources: Record<string, string> = {};

for (const [abs, text] of Object.entries(raw)) {
  const marker = "fixture-codebase/";
  const idx = abs.lastIndexOf(marker);
  const rel = idx >= 0 ? abs.slice(idx + marker.length) : abs;
  fixtureSources[rel] = text;
}
