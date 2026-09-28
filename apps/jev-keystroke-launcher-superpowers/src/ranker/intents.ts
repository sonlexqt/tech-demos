import type { LauncherIntent } from "../catalog/types";

function normalize(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectIntent(query: string): LauncherIntent {
  const text = normalize(query);

  if (
    text.includes("pdf") &&
    (text.includes("just downloaded") ||
      text.includes("downloaded") ||
      text.includes("newest") ||
      text.includes("latest download"))
  ) {
    return "newest_download";
  }

  if (text.includes("waiting") && (text.includes("legal") || text.includes("sign"))) {
    return "waiting_legal";
  }

  if (
    text.includes("msa") &&
    (text.includes("countersign") ||
      text.includes("counter sign") ||
      text.includes("counter-sign"))
  ) {
    return "msa_countersign";
  }

  if (text.includes("expired") && (text.includes("sign") || text.includes("signature"))) {
    return "expired_signature";
  }

  return "generic";
}
