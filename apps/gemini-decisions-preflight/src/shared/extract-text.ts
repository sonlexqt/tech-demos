/** Pull Latin text from simple pdf-lib streams plus the LUMIN_FIXTURE marker. */

export function extractPdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  const chunks: string[] = [];
  const tj = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tj.exec(raw))) {
    chunks.push(unescapePdf(m[1]));
  }
  const tj2 = /\[((?:[^\]]|\\])*)\]\s*TJ/g;
  while ((m = tj2.exec(raw))) {
    const inner = m[1];
    const parts = inner.match(/\(((?:\\.|[^\\)])*)\)/g) ?? [];
    for (const p of parts) chunks.push(unescapePdf(p.slice(1, -1)));
  }
  return chunks.join("\n");
}

function unescapePdf(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

export function fixtureIdFromText(text: string): string | null {
  const m = text.match(/LUMIN_FIXTURE:([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : null;
}
