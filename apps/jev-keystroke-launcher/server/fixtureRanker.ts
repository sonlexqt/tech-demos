import { CATALOG, WORKSPACE_NOW } from "../src/catalog";
import { tokenize } from "../src/text";
import type { CatalogItem, RankedItem } from "../src/types";

export { tokenize };

function hoursAgo(iso: string | undefined, nowMs: number): number | null {
  if (!iso) return null;
  return (nowMs - Date.parse(iso)) / 3_600_000;
}

function recencyBoost(hours: number | null, halfLifeHours: number): number {
  if (hours === null || hours < 0) return 0;
  return Math.exp(-hours / halfLifeHours);
}

export function parseIntent(query: string) {
  const q = query.toLowerCase();
  return {
    tokens: tokenize(query),
    wantsPdf: /\bpdfs?\b|\.pdf\b/.test(q),
    wantsDoc: /\bdocs?\b|\bnotes?\b|\bwiki\b/.test(q),
    wantsSignature: /\bsign(?:ature|ing)?s?\b|\bcountersign\b|\be-?sign\b/.test(q),
    wantsFolder: /\bfolders?\b|\bdirector(?:y|ies)\b/.test(q),
    wantsTemplate: /\btemplates?\b/.test(q),
    wantsExpired: /\bexpired\b|\blapsed\b|\boverdue\b/.test(q),
    wantsWaiting: /\bwaiting\b|\bpending\b|\bawaiting\b|\bneeds?\s+sign/.test(q),
    wantsCompleted: /\bcompleted\b|\bsigned\b|\bfully executed\b/.test(q),
    wantsLegal: /\blegal\b|\bcounsel\b|\bgc\b/.test(q),
    wantsRecentDownload: /just downloaded|newest (pdf|download)|latest download|i just/.test(q),
    wantsRecent: /\bjust\b|\brecent\b|\blatest\b|\bnewest\b|\btoday\b/.test(q),
    wantsMsa: /\bmsa\b|master service/.test(q),
    wantsCountersign: /\bcountersign/.test(q),
  };
}

export type Intent = ReturnType<typeof parseIntent>;

function textBlob(item: CatalogItem): string {
  return [item.title, item.subtitle, ...item.aliases, ...item.tags, ...(item.parties ?? [])]
    .join(" ")
    .toLowerCase();
}

export function scoreItem(item: CatalogItem, intent: Intent, nowMs: number): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 4;

  const blob = textBlob(item);
  let lexical = 0;
  for (const token of intent.tokens) {
    if (item.title.toLowerCase().includes(token)) lexical += 8;
    else if (item.aliases.some((alias) => alias.toLowerCase().includes(token))) lexical += 5;
    else if (blob.includes(token)) lexical += 2;
  }
  if (lexical > 0) {
    score += lexical;
    if (lexical >= 8) reasons.push("Title / alias overlap");
  }

  if (intent.wantsPdf) {
    if (item.kind === "pdf") {
      score += 36;
      reasons.push("PDF");
    } else {
      score -= 18;
    }
  }
  if (intent.wantsDoc) {
    if (item.kind === "doc") {
      score += 28;
      reasons.push("Workspace doc");
    } else score -= 8;
  }
  if (intent.wantsSignature) {
    if (item.kind === "signature") {
      score += 36;
      reasons.push("Signature request");
    } else score -= 14;
  }
  if (intent.wantsFolder) {
    if (item.kind === "folder") {
      score += 30;
      reasons.push("Folder");
    } else score -= 10;
  }
  if (intent.wantsTemplate) {
    if (item.kind === "template") {
      score += 30;
      reasons.push("Template");
    } else if (item.kind !== "folder") score -= 8;
  }

  if (intent.wantsExpired) {
    if (item.status === "expired") {
      score += 48;
      reasons.push("Expired");
    } else score -= 16;
  }
  if (intent.wantsWaiting) {
    if (item.status === "waiting") {
      score += 34;
      reasons.push("Waiting on a signer");
    } else if (item.kind === "signature") score -= 10;
  }
  if (intent.wantsCompleted && item.status === "completed") {
    score += 22;
    reasons.push("Completed");
  }

  const parties = (item.parties ?? []).join(" ").toLowerCase();
  if (intent.wantsLegal) {
    if (parties.includes("legal") || parties.includes("counsel") || item.tags.includes("legal")) {
      score += 28;
      reasons.push("Legal party");
    } else if (intent.wantsWaiting) {
      score -= 12;
    }
  }

  if (intent.wantsMsa && (blob.includes("msa") || blob.includes("master service"))) {
    score += 26;
    reasons.push("MSA");
  }
  if (intent.wantsCountersign) {
    if (blob.includes("countersign") || item.tags.includes("countersign")) {
      score += 30;
      reasons.push("Countersign");
    } else if (item.kind === "template") {
      score -= 12;
    }
  }

  if (intent.wantsRecentDownload && item.kind === "pdf") {
    const hours = hoursAgo(item.downloaded_at, nowMs);
    const boost = recencyBoost(hours, 8) * 56;
    score += boost;
    if (hours !== null && hours < 1) reasons.push("Newest download");
    else if (hours !== null && hours < 24) reasons.push("Downloaded recently");
  } else if (intent.wantsRecent) {
    const hours = hoursAgo(item.downloaded_at ?? item.modified_at, nowMs);
    score += recencyBoost(hours, 18) * 18;
    if (hours !== null && hours < 12) reasons.push("Touched recently");
  }

  if (intent.tokens.length === 0) {
    const hours = hoursAgo(item.modified_at, nowMs);
    score += recencyBoost(hours, 36) * 12;
  }

  return { score, reasons: reasons.slice(0, 3) };
}

export function rankCatalog(query: string, nowIso = WORKSPACE_NOW): RankedItem[] {
  const nowMs = Date.parse(nowIso);
  const intent = parseIntent(query);
  const scored = CATALOG.map((item) => {
    const { score, reasons } = scoreItem(item, intent, nowMs);
    return { ...item, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const max = scored[0]?.score ?? 1;
  return scored.map((item) => ({
    ...item,
    score: max > 0 ? Math.round((item.score / max) * 1000) / 1000 : 0,
  }));
}
