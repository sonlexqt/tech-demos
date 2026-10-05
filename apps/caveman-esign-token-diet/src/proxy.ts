import { createHash } from "node:crypto";

const NOISE_KEYS = new Set([
  "x-signature",
  "x_signature",
  "user-agent",
  "user_agent",
  "tls",
  "ja3",
  "cf-ray",
  "cf_ray",
  "x-request-id",
  "x_request_id",
  "x-amzn-trace-id",
  "x_amzn_trace_id",
  "retry_count",
  "delivery_attempt",
  "webhook_signature",
  "raw_headers",
  "debug",
  "geoip",
  "stack",
  "health",
  "heartbeat",
  "ping",
  "accept_language",
  "sec-ch-ua",
  "sec_ch_ua",
  "cdn",
  "forwarded",
  "cookie",
  "authorization",
  "empty_probe",
  "tls_fingerprint",
  "edge_pop",
  "bytes_in",
  "bytes_out",
  "http",
  "delivery",
]);

const KEEP_KEYS = new Set([
  "event",
  "event_type",
  "event_time",
  "signature_request",
  "signature_request_id",
  "envelope_id",
  "title",
  "status",
  "signers",
  "name",
  "email",
  "email_address",
  "decline_reason",
  "reason",
  "declined_at",
  "created_at",
  "updated_at",
  "expires_at",
  "viewed_at",
  "signed_at",
  "sent_at",
  "last_reminder_at",
  "reminder_count",
  "days_stalled",
  "action",
  "actor",
  "timestamp",
  "document",
  "signing_type",
  "group",
  "is_approved",
  "details",
]);

function handleFor(text: string): string {
  return `ccr_demo_${createHash("sha256").update(text).digest("hex").slice(0, 10)}`;
}

function isNoiseKey(key: string): boolean {
  const k = key.toLowerCase();
  if (NOISE_KEYS.has(k)) return true;
  if (k.startsWith("x-") || k.startsWith("cf-") || k.startsWith("sec-")) return true;
  return false;
}

function slim(value: unknown, keyHint = ""): unknown {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const items = value.map((item) => slim(item, keyHint)).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (isNoiseKey(key)) continue;
      if (key === "event_metadata") continue;
      const keep = KEEP_KEYS.has(key) || KEEP_KEYS.has(keyHint);
      if (!keep && (typeof child === "string" || typeof child === "number" || typeof child === "boolean")) {
        continue;
      }
      const slimmed = slim(child, key);
      if (slimmed !== undefined) out[key] = slimmed;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

function tryParseJson(block: string): unknown | undefined {
  try {
    return JSON.parse(block);
  } catch {
    return undefined;
  }
}

function collapseLogLines(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let lastKeep = "";
  let repeat = 0;
  let dropped = 0;

  const flush = () => {
    if (repeat > 1) out.push(`  … ×${repeat} identical`);
    repeat = 0;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const upper = trimmed.toUpperCase();
    const noisy =
      /\b(DEBUG|TRACE|HEALTH|HEARTBEAT|PING|HMAC OK|BYTES_IN|EDGE_POP|JA3|TLS1\.3)\b/.test(upper) &&
      !/\b(ENV-|DECLIN|REMIND|SIGNED|VIEWED|STALL|REASON|CLAUSE)\b/.test(upper);
    if (noisy) {
      dropped += 1;
      continue;
    }
    if (trimmed === lastKeep) {
      repeat += 1;
      continue;
    }
    flush();
    out.push(line);
    lastKeep = trimmed;
  }
  flush();
  if (dropped) out.push(`# proxy dropped ${dropped} debug/health lines`);
  return out.join("\n");
}

/**
 * Demo stand-in for Caveman's local input proxy.
 * Drops webhook/log noise, keeps envelope IDs, names, and decline text.
 * Original bytes are not stored (this is a demo); a handle is shown anyway.
 */
export function trimInput(raw: string): string {
  const handle = handleFor(raw);
  const parts = raw.split(/\n(?=\{)/);
  const jsonish: unknown[] = [];
  const leftover: string[] = [];

  for (const part of parts) {
    const parsed = tryParseJson(part.trim());
    if (parsed !== undefined) jsonish.push(parsed);
    else leftover.push(part);
  }

  const slims = jsonish
    .map((item) => slim(item))
    .filter((item) => item !== undefined);

  const unique = new Map<string, unknown>();
  for (const item of slims) {
    unique.set(JSON.stringify(item), item);
  }

  const logs = leftover.join("\n").trim();
  const collapsed = logs ? collapseLogLines(logs) : "";

  const body = [
    unique.size ? JSON.stringify([...unique.values()], null, 2) : "",
    collapsed,
  ]
    .filter(Boolean)
    .join("\n\n");

  const trimmed = body.trim();
  const payload = trimmed && trimmed.length < raw.length ? trimmed : raw;

  return [
    `[caveman-proxy demo] original ${raw.length} bytes → ${handle}`,
    `[recover] empty query would return the raw dump; this demo does not persist it`,
    "",
    payload,
  ].join("\n");
}

export function usesProxy(mode: "normal" | "caveman" | "proxy" | "both"): boolean {
  return mode === "proxy" || mode === "both";
}
