import type {
  DiffOverlay,
  ExplainReport,
  GraphEdge,
  GraphNode,
  ImpactReport,
  KnowledgeGraph,
  Layer,
  SampleDiff,
} from "./ua-types";

export function nodeById(graph: KnowledgeGraph, id: string): GraphNode | undefined {
  return graph.nodes.find((node) => node.id === id);
}

export function layerFor(graph: KnowledgeGraph, nodeId: string): Layer | undefined {
  return graph.layers.find((layer) => layer.nodeIds.includes(nodeId));
}

export function neighbors(graph: KnowledgeGraph, nodeId: string): { incoming: GraphEdge[]; outgoing: GraphEdge[] } {
  return {
    incoming: graph.edges.filter((edge) => edge.target === nodeId),
    outgoing: graph.edges.filter((edge) => edge.source === nodeId),
  };
}

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "does",
  "for",
  "handle",
  "how",
  "of",
  "or",
  "parts",
  "the",
  "to",
  "what",
  "which",
  "who",
]);

export function searchNodes(graph: KnowledgeGraph, query: string, limit = 12): GraphNode[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const tokens = trimmed.split(/\s+/).filter((token) => token && !STOPWORDS.has(token));
  const usable = tokens.length > 0 ? tokens : trimmed.split(/\s+/);

  const scored = graph.nodes
    .map((node) => {
      const hay = [node.name, node.id, node.filePath ?? "", node.summary, node.tags.join(" "), node.type]
        .join(" ")
        .toLowerCase();
      let score = 0;
      let hits = 0;
      for (const token of usable) {
        if (node.name.toLowerCase() === token) {
          score += 8;
          hits += 1;
        } else if (node.name.toLowerCase().includes(token) || (node.filePath ?? "").toLowerCase().includes(token)) {
          score += 5;
          hits += 1;
        } else if (node.tags.some((tag) => tag.toLowerCase().includes(token))) {
          score += 4;
          hits += 1;
        } else if (hay.includes(token)) {
          score += 2;
          hits += 1;
        }
      }
      if (hits === 0) return { node, score: 0 };
      if (node.type === "module") score -= 0.5;
      return { node, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.node.name.localeCompare(b.node.name));

  return scored.slice(0, limit).map((row) => row.node);
}

export function explainNode(
  graph: KnowledgeGraph,
  nodeId: string,
  sources: Record<string, string>,
): ExplainReport | null {
  const node = nodeById(graph, nodeId);
  if (!node) return null;
  const { incoming, outgoing } = neighbors(graph, nodeId);
  const resolve = (id: string) => nodeById(graph, id);
  const contained = outgoing
    .filter((edge) => edge.type === "contains")
    .map((edge) => resolve(edge.target))
    .filter((item): item is GraphNode => Boolean(item));

  const path = node.filePath;
  const text = path ? sources[path] : undefined;
  let source: ExplainReport["source"];
  if (path && text) {
    const start = node.lineRange?.[0] ?? 1;
    const end = Math.min(node.lineRange?.[1] ?? start + 16, text.split("\n").length);
    source = { path, text, start, end };
  }

  return {
    node,
    layer: layerFor(graph, nodeId),
    incoming: incoming
      .map((edge) => {
        const other = resolve(edge.source);
        return other ? { edge, node: other } : null;
      })
      .filter((row): row is { edge: GraphEdge; node: GraphNode } => Boolean(row)),
    outgoing: outgoing
      .map((edge) => {
        const other = resolve(edge.target);
        return other ? { edge, node: other } : null;
      })
      .filter((row): row is { edge: GraphEdge; node: GraphNode } => Boolean(row)),
    contained,
    source,
  };
}

export function impactForDiff(graph: KnowledgeGraph, sample: SampleDiff): ImpactReport {
  const changed = graph.nodes.filter((node) => node.filePath && sample.changedFiles.includes(node.filePath));
  const changedIds = new Set(changed.map((node) => node.id));
  const affectedIds = new Set<string>();

  for (const node of changed) {
    for (const edge of graph.edges) {
      if (edge.source === node.id && !changedIds.has(edge.target)) affectedIds.add(edge.target);
      if (edge.target === node.id && !changedIds.has(edge.source)) affectedIds.add(edge.source);
    }
  }

  const affected = [...affectedIds]
    .map((id) => nodeById(graph, id))
    .filter((node): node is GraphNode => Boolean(node));

  const uniqueTests = [...changed, ...affected].filter(
    (node, index, all) =>
      ((node.type === "file" && node.filePath?.startsWith("tests/")) || node.id.includes("tests/")) &&
      all.findIndex((item) => item.id === node.id) === index,
  );

  const alsoTests = graph.edges
    .filter((edge) => edge.type === "tested_by" && (changedIds.has(edge.source) || affectedIds.has(edge.source)))
    .map((edge) => nodeById(graph, edge.target))
    .filter((node): node is GraphNode => Boolean(node));

  const testNodes = [...uniqueTests, ...alsoTests].filter(
    (node, index, all) => all.findIndex((item) => item.id === node.id) === index,
  );

  const touchedIds = new Set([...changedIds, ...affectedIds]);
  const layers = graph.layers.filter((layer) => layer.nodeIds.some((id) => touchedIds.has(id)));

  const complexChanged = changed.filter((node) => node.complexity === "complex").length;
  const crossLayer = layers.length >= 3;
  const blast = affected.length;
  let risk: ImpactReport["risk"] = "low";
  if (blast >= 8 || complexChanged > 0 || crossLayer) risk = "medium";
  if (blast >= 14 || (complexChanged > 0 && crossLayer)) risk = "high";

  const reasons = [
    `${changed.length} changed node${changed.length === 1 ? "" : "s"} in ${sample.changedFiles.join(", ")}`,
    `${affected.length} 1-hop affected node${affected.length === 1 ? "" : "s"} (imports / calls / tested_by / contains)`,
    `${layers.length} architectural layer${layers.length === 1 ? "" : "s"}: ${layers.map((layer) => layer.name).join(", ") || "none"}`,
    `${testNodes.length} test target${testNodes.length === 1 ? "" : "s"} to re-run`,
  ];

  return {
    overlay: {
      version: "1.0.0",
      baseBranch: sample.baseBranch,
      generatedAt: "2026-10-09T00:00:00.000Z",
      changedFiles: sample.changedFiles,
      changedNodeIds: [...changedIds],
      affectedNodeIds: [...affectedIds],
    },
    changed,
    affected,
    tests: testNodes,
    layers,
    risk,
    reasons,
  };
}

export function snippet(text: string, start: number, end: number): string {
  return text
    .split("\n")
    .slice(start - 1, end)
    .map((line, index) => `${String(start + index).padStart(3, " ")}  ${line}`)
    .join("\n");
}
