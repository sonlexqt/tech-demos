import { inflateRawSync, inflateSync } from "node:zlib";

/** Pull Latin text from pdf-lib streams, including FlateDecode payloads. */

function decodeHexPdf(hex: string): string {
  const clean = hex.replace(/\s+/g, "");
  if (!clean || clean.length % 2 !== 0) return "";
  return Buffer.from(clean, "hex").toString("latin1");
}

function collectTj(haystack: string): string[] {
  const chunks: string[] = [];
  const tj = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tj.exec(haystack))) {
    chunks.push(unescapePdf(m[1]));
  }
  const hexTj = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
  while ((m = hexTj.exec(haystack))) {
    chunks.push(decodeHexPdf(m[1]));
  }
  const tj2 = /\[((?:[^\]]|\\])*)\]\s*TJ/g;
  while ((m = tj2.exec(haystack))) {
    const inner = m[1];
    const paren = inner.match(/\(((?:\\.|[^\\)])*)\)/g) ?? [];
    for (const p of paren) chunks.push(unescapePdf(p.slice(1, -1)));
    const hex = inner.match(/<([0-9A-Fa-f\s]+)>/g) ?? [];
    for (const h of hex) chunks.push(decodeHexPdf(h.slice(1, -1)));
  }
  return chunks;
}

function inflatePdfStreams(raw: Buffer): string {
  const latin = raw.toString("latin1");
  const pieces: string[] = [latin];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(latin))) {
    const payload = Buffer.from(m[1], "latin1");
    for (const fn of [inflateSync, inflateRawSync]) {
      try {
        pieces.push(fn(payload).toString("latin1"));
        break;
      } catch {
        // try the other inflater
      }
    }
  }
  return pieces.join("\n");
}

export function extractPdfText(bytes: Uint8Array): string {
  const decoded = inflatePdfStreams(Buffer.from(bytes));
  return collectTj(decoded).join("\n");
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
