export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function loc(files: { code: string }[]): number {
  return files.reduce(
    (n, file) => n + file.code.split("\n").filter((line) => line.trim()).length,
    0,
  );
}
