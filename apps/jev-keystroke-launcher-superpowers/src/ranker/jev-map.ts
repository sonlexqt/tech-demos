import type { RankedHit, WorkspaceItem } from "../catalog/types";

export function mapJevProbabilities(
  items: readonly WorkspaceItem[],
  probabilities: Record<string, number>,
  fixtureHits: RankedHit[],
): RankedHit[] {
  const fixtureById = new Map(fixtureHits.map((hit) => [hit.item.id, hit]));
  const catalogIds = new Set(items.map((item) => item.id));

  let winnerId: string | undefined;
  let winnerP = -1;
  for (const [id, probability] of Object.entries(probabilities)) {
    if (!catalogIds.has(id)) {
      continue;
    }
    if (probability > winnerP) {
      winnerP = probability;
      winnerId = id;
    }
  }

  const hits: RankedHit[] = items.map((item) => {
    const probability = probabilities[item.id] ?? 0;
    let score = Math.round(probability * 1000);
    if (item.id === winnerId) {
      score += 1;
    }

    const reasons: string[] = [];
    if (item.id === winnerId) {
      reasons.push(`Jev choice ${item.id}`);
    }
    if (item.id in probabilities) {
      reasons.push(`p=${probability.toFixed(2)}`);
    }

    return {
      item,
      score,
      reasons,
      intent: fixtureById.get(item.id)?.intent ?? "generic",
    };
  });

  return hits.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const fixtureA = fixtureById.get(a.item.id)?.score ?? 0;
    const fixtureB = fixtureById.get(b.item.id)?.score ?? 0;
    if (fixtureB !== fixtureA) {
      return fixtureB - fixtureA;
    }
    return a.item.id.localeCompare(b.item.id);
  });
}
