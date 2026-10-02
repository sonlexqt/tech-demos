import type { ProbeResult, Relation } from "./types";

/**
 * Archify Route / path-probe: resolve exactly two endpoints over authored
 * directed relationships. Never infer a hop from geometry or visual overlap.
 */
export function probePath(relations: Relation[], start: string, end: string): ProbeResult {
  if (!start || !end) {
    return { ok: false, reason: "Pick two endpoints. Path-probe does not guess." };
  }
  if (start === end) {
    return { ok: false, reason: "Path-probe needs two distinct endpoints." };
  }

  const adj = new Map<string, Relation[]>();
  for (const rel of relations) {
    const list = adj.get(rel.from) ?? [];
    list.push(rel);
    adj.set(rel.from, list);
  }

  const seen = new Set<string>([start]);
  const prev = new Map<string, { node: string; rel: Relation }>();
  const queue = [start];

  while (queue.length) {
    const cur = queue.shift()!;
    for (const rel of adj.get(cur) ?? []) {
      if (seen.has(rel.to)) continue;
      seen.add(rel.to);
      prev.set(rel.to, { node: cur, rel });
      if (rel.to === end) {
        return reconstruct(start, end, prev);
      }
      queue.push(rel.to);
    }
  }

  return {
    ok: false,
    reason: `No authored route from ${start} to ${end}. Geometry is not a path.`,
  };
}

function reconstruct(
  start: string,
  end: string,
  prev: Map<string, { node: string; rel: Relation }>,
): ProbeResult {
  const hops: Relation[] = [];
  const nodes = [end];
  let cursor = end;
  while (cursor !== start) {
    const step = prev.get(cursor);
    if (!step) {
      return { ok: false, reason: "Probe reconstruction failed — fail closed." };
    }
    hops.unshift(step.rel);
    nodes.unshift(step.node);
    cursor = step.node;
  }
  return { ok: true, hops, nodes };
}

export function neighbors(
  relations: Relation[],
  id: string,
): { upstream: Relation[]; downstream: Relation[] } {
  return {
    upstream: relations.filter((r) => r.to === id),
    downstream: relations.filter((r) => r.from === id),
  };
}
