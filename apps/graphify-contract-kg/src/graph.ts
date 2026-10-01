import type {
  CannedQuery,
  GraphEdge,
  GraphNode,
  GraphPackage,
  LaidOutNode,
  NodeKind,
} from "./types";

const LAYOUT: Record<string, { x: number; y: number }> = {
  "party-lumin": { x: 108, y: 248 },
  "party-acme": { x: 108, y: 368 },
  "party-affiliates": { x: 108, y: 488 },
  "doc-msa": { x: 338, y: 88 },
  "doc-nda": { x: 502, y: 88 },
  "term-ci": { x: 700, y: 68 },
  "term-services": { x: 848, y: 68 },
  "term-cdata": { x: 700, y: 152 },
  "term-deliverables": { x: 848, y: 152 },
  "term-indemnified": { x: 990, y: 108 },
  "clause-msa-1": { x: 300, y: 248 },
  "clause-msa-2": { x: 430, y: 248 },
  "clause-msa-5": { x: 560, y: 248 },
  "clause-msa-6": { x: 690, y: 248 },
  "clause-msa-8": { x: 360, y: 352 },
  "clause-msa-9": { x: 510, y: 352 },
  "clause-msa-10": { x: 650, y: 352 },
  "clause-msa-10-2": { x: 790, y: 352 },
  "clause-nda-2": { x: 360, y: 456 },
  "clause-nda-4": { x: 510, y: 456 },
  "clause-nda-5": { x: 650, y: 456 },
  "obl-lumin-services": { x: 1048, y: 220 },
  "obl-acme-fees": { x: 1048, y: 292 },
  "obl-both-ci": { x: 1048, y: 364 },
  "obl-lumin-ip-indem": { x: 1048, y: 436 },
  "obl-acme-data-indem": { x: 1048, y: 508 },
  "obl-acme-notice": { x: 1048, y: 580 },
  "obl-return-ci": { x: 900, y: 620 },
  "obl-lumin-insurance": { x: 760, y: 620 },
  "exh-a": { x: 300, y: 588 },
  "exh-b": { x: 450, y: 588 },
  "exh-e": { x: 600, y: 588 },
};

export const KIND_ORDER: NodeKind[] = [
  "party",
  "document",
  "term",
  "clause",
  "obligation",
  "exhibit",
];

export function layoutNodes(nodes: GraphNode[]): LaidOutNode[] {
  return nodes.map((node) => {
    const pos = LAYOUT[node.id] ?? { x: 600, y: 360 };
    return { ...node, ...pos };
  });
}

export function indexGraph(pkg: GraphPackage) {
  const nodeById = new Map(pkg.nodes.map((n) => [n.id, n]));
  const edgeById = new Map(pkg.edges.map((e) => [e.id, e]));
  const degree = new Map<string, number>();
  for (const node of pkg.nodes) degree.set(node.id, 0);
  for (const edge of pkg.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  const godNodes = [...pkg.nodes]
    .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    .slice(0, 4);
  return { nodeById, edgeById, degree, godNodes };
}

export function edgesForNode(pkg: GraphPackage, nodeId: string): GraphEdge[] {
  return pkg.edges.filter((e) => e.source === nodeId || e.target === nodeId);
}

export function pathSets(query: CannedQuery) {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  for (const step of query.steps) {
    if (step.nodeId) nodeIds.add(step.nodeId);
    if (step.edgeId) edgeIds.add(step.edgeId);
  }
  return { nodeIds, edgeIds };
}

const STOP = new Set(["the", "a", "an", "of", "and", "to", "for", "in", "on", "is", "what", "how", "who"]);

export function matchQuery(text: string, queries: CannedQuery[]): CannedQuery | null {
  const raw = text.trim().toLowerCase();
  if (!raw) return null;
  const exact = queries.find(
    (q) => q.question.toLowerCase() === raw || q.chip.toLowerCase() === raw,
  );
  if (exact) return exact;
  const tokens = raw.split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t));
  if (!tokens.length) return null;
  let best: CannedQuery | null = null;
  let bestScore = 0;
  for (const q of queries) {
    const hay = `${q.chip} ${q.question} ${q.answer}`.toLowerCase();
    const score = tokens.filter((t) => hay.includes(t)).length;
    if (score > bestScore) {
      best = q;
      bestScore = score;
    }
  }
  return bestScore >= Math.min(2, tokens.length) ? best : null;
}

export function validatePackage(pkg: GraphPackage, queries: CannedQuery[]): string[] {
  const ids = new Set(pkg.nodes.map((n) => n.id));
  const edgeIds = new Set(pkg.edges.map((e) => e.id));
  const errors: string[] = [];
  for (const edge of pkg.edges) {
    if (!ids.has(edge.source)) errors.push(`edge ${edge.id} missing source ${edge.source}`);
    if (!ids.has(edge.target)) errors.push(`edge ${edge.id} missing target ${edge.target}`);
    if (!edge.why.trim()) errors.push(`edge ${edge.id} missing why`);
  }
  for (const q of queries) {
    for (const step of q.steps) {
      if (step.nodeId && !ids.has(step.nodeId)) {
        errors.push(`query ${q.id} missing node ${step.nodeId}`);
      }
      if (step.edgeId && !edgeIds.has(step.edgeId)) {
        errors.push(`query ${q.id} missing edge ${step.edgeId}`);
      }
    }
  }
  return errors;
}
