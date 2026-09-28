import { CATALOG, slimCatalog, WORKSPACE_NOW } from "../src/catalog";
import type { RankedItem } from "../src/types";
import { parseIntent, scoreItem } from "./fixtureRanker";
import { resolveJevProvider } from "./keys";

type ChoiceAnswer = {
  type?: string;
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
};

function choiceCriteria(): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const item of CATALOG) {
    const parts = [
      item.title,
      `kind=${item.kind}`,
      item.status ? `status=${item.status}` : null,
      item.parties?.length ? `parties=${item.parties.join(", ")}` : null,
      item.downloaded_at ? `downloaded_at=${item.downloaded_at}` : null,
      `modified_at=${item.modified_at}`,
      item.subtitle,
    ];
    criteria[item.id] = parts.filter(Boolean).join(" · ");
  }
  return criteria;
}

export async function liveRank(query: string): Promise<{
  items: RankedItem[];
  model: string;
  latency_ms: number;
}> {
  const provider = resolveJevProvider();
  if (!provider) throw new Error("No Jev API key configured");

  const body = {
    model: provider.model,
    state: {
      query,
      now: WORKSPACE_NOW,
      hint: "Rank by typed INTENT (recency, type, signature status, parties) — not alias/fuzzy title match alone. 'the pdf I just downloaded' means the PDF with the latest downloaded_at.",
      catalog: slimCatalog(),
    },
    questions: {
      pick: {
        type: "choice",
        instructions:
          "Which Lumin workspace item is the user looking for? Prefer semantic intent over literal alias match. Use downloaded_at for 'just downloaded', status+parties for waiting/expired/legal, and kind for pdf/doc/signature/folder/template.",
        criteria: choiceCriteria(),
      },
    },
  };

  const started = Date.now();
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Jev returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`,
    );
  }

  const result = (await response.json()) as {
    model?: string;
    answers?: { pick?: ChoiceAnswer };
  };

  const probabilities = result.answers?.pick?.probabilities ?? {};
  const nowMs = Date.parse(WORKSPACE_NOW);
  const intent = parseIntent(query);

  const items: RankedItem[] = CATALOG.map((item) => {
    const local = scoreItem(item, intent, nowMs);
    const p = probabilities[item.id] ?? 0;
    const reasons = [...local.reasons];
    if (p >= 0.2) reasons.unshift(`Jev p=${p.toFixed(2)}`);
    return { ...item, score: p, reasons: reasons.slice(0, 3) };
  });

  items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return {
    items,
    model: result.model ?? provider.model,
    latency_ms: Date.now() - started,
  };
}
