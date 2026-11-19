const VOLATILE_KEYS = new Set([
  "rev",
  "lastModified",
  "lastModifiedBy",
  "scrollTop",
  "scrollLeft",
  "selections",
  "timestamp",
]);

export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      if (VOLATILE_KEYS.has(key)) continue;
      out[key] = sortKeys(obj[key]);
    }
    return out;
  }
  return value;
}

export function canonicalizeSnapshot(snapshot: unknown): string {
  return JSON.stringify(sortKeys(snapshot));
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashSnapshot(snapshot: unknown): Promise<{ canonical: string; sha256: string }> {
  const canonical = canonicalizeSnapshot(snapshot);
  const sha256 = await sha256Hex(new TextEncoder().encode(canonical));
  return { canonical, sha256 };
}

export async function hashBinding(snapshot: unknown, contentPdf: Uint8Array): Promise<{
  canonical: string;
  snapshotSha256: string;
  contentPdfSha256: string;
  bindingSha256: string;
}> {
  const { canonical, sha256: snapshotSha256 } = await hashSnapshot(snapshot);
  const jsonBytes = new TextEncoder().encode(canonical);
  const contentPdfSha256 = await sha256Hex(contentPdf);
  const bindingSha256 = await sha256Hex(concatBytes(jsonBytes, contentPdf));
  return { canonical, snapshotSha256, contentPdfSha256, bindingSha256 };
}

export function bytesFromBase64(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}
