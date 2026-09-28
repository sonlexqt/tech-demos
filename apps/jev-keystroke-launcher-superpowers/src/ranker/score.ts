import { FIXTURE_ITEMS, NOW } from "../catalog/fixtures";
import type { LauncherIntent, RankedHit, WorkspaceItem } from "../catalog/types";
import { detectIntent } from "./intents";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3);
}

function lexicalScore(query: string, item: WorkspaceItem): number {
  const haystack = `${item.title} ${item.tags.join(" ")}`.toLowerCase();
  let score = 0;
  for (const token of queryTokens(query)) {
    if (haystack.includes(token)) {
      score += 8;
    }
  }
  return score;
}

function recencyScore(item: WorkspaceItem, now: Date): number {
  const ageDays =
    (now.getTime() - new Date(item.modifiedAt).getTime()) / MS_PER_DAY;
  return Math.max(0, 6 - ageDays / 7);
}

function newestDownloadedAt(items: readonly WorkspaceItem[]): string | undefined {
  return items
    .filter((item) => item.kind === "pdf" && item.downloadedAt)
    .map((item) => item.downloadedAt!)
    .sort()
    .at(-1);
}

function intentBonus(
  item: WorkspaceItem,
  intent: LauncherIntent,
  newestDownload: string | undefined,
): { bonus: number; reasons: string[] } {
  const reasons: string[] = [];
  let bonus = 0;

  if (intent === "newest_download") {
    if (item.kind === "pdf" && item.downloadedAt) {
      bonus += 40;
      if (item.downloadedAt === newestDownload) {
        bonus += 30;
        reasons.push("downloaded most recently");
      }
      reasons.push("newest download");
    } else if (item.kind === "pdf") {
      bonus += 8;
      reasons.push("pdf");
    }
  }

  if (intent === "waiting_legal") {
    if (item.signature?.status === "waiting" && item.signature.waitingOn === "legal") {
      bonus += 50;
      reasons.push("waiting on legal");
    } else if (item.signature?.status === "waiting") {
      bonus += 20;
      reasons.push("awaiting signature");
    }
  }

  if (intent === "msa_countersign") {
    if (
      item.signature?.documentType === "MSA" &&
      item.signature.status === "countersign"
    ) {
      bonus += 55;
      reasons.push("MSA awaiting countersign");
    } else if (item.signature?.documentType === "MSA") {
      bonus += 18;
      reasons.push("MSA");
    } else if (item.kind === "template" && item.tags.includes("msa")) {
      bonus += 6;
    }
  }

  if (intent === "expired_signature" && item.signature?.status === "expired") {
    bonus += 50;
    reasons.push("expired signature request");
  }

  return { bonus, reasons };
}

function uniqueReasons(reasons: string[]): string[] {
  return [...new Set(reasons)].slice(0, 3);
}

export function rankWorkspace(
  query: string,
  items: readonly WorkspaceItem[] = FIXTURE_ITEMS,
  now: Date = NOW,
): RankedHit[] {
  const intent = detectIntent(query);
  const newestDownload = newestDownloadedAt(items);

  const hits: RankedHit[] = items.map((item) => {
    const lexical = lexicalScore(query, item);
    const recency = recencyScore(item, now);
    const { bonus, reasons } = intentBonus(item, intent, newestDownload);
    const score = lexical + recency + bonus;

    if (intent === "generic") {
      if (lexical > 0) {
        reasons.push("title match");
      } else {
        reasons.push("recent activity");
      }
    } else if (lexical > 0) {
      reasons.push("title match");
    }

    return {
      item,
      score,
      reasons: uniqueReasons(reasons),
      intent,
    };
  });

  return hits.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.item.modifiedAt !== b.item.modifiedAt) {
      return a.item.modifiedAt < b.item.modifiedAt ? 1 : -1;
    }
    return a.item.id.localeCompare(b.item.id);
  });
}
