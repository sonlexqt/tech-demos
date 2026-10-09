import type { KnowledgeGraph, Layer } from "./ua-types";

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  r: number;
}

export const LAYER_COLORS: Record<string, string> = {
  "layer:api": "#60a5fa",
  "layer:service": "#34d399",
  "layer:data": "#f59e0b",
  "layer:utility": "#a78bfa",
  "layer:test": "#fb7185",
};

export function colorForLayer(layer?: Layer): string {
  if (!layer) return "#94a3b8";
  return LAYER_COLORS[layer.id] ?? "#94a3b8";
}

const TYPE_RADIUS: Record<string, number> = {
  module: 22,
  file: 16,
  class: 13,
  endpoint: 12,
  function: 9,
  document: 14,
};

export function layoutGraph(graph: KnowledgeGraph): Map<string, LayoutNode> {
  const positions = new Map<string, LayoutNode>();
  const layerOrder = graph.layers.map((layer) => layer.id);
  const colWidth = 300;
  const originX = 150;
  const originY = 80;

  const clusters = graph.layers.map((layer, layerIndex) => {
    const nodes = graph.nodes.filter((node) => layer.nodeIds.includes(node.id) && node.type !== "module");
    const files = nodes.filter((node) => node.type === "file" || node.type === "document");
    const others = nodes.filter((node) => node.type !== "file" && node.type !== "document");
    return { layer, layerIndex, files, others };
  });

  for (const cluster of clusters) {
    const x = originX + cluster.layerIndex * colWidth;
    let yCursor = originY;
    cluster.files.forEach((file) => {
      const kids = cluster.others.filter((node) => node.filePath === file.filePath);
      const y = yCursor;
      positions.set(file.id, {
        id: file.id,
        x,
        y,
        r: TYPE_RADIUS[file.type] ?? 12,
      });
      kids.forEach((kid, kidIndex) => {
        const angle = (-0.85 + (kidIndex / Math.max(kids.length - 1, 1)) * 1.7) * Math.PI;
        const dist = 52 + Math.min(kids.length, 6) * 2;
        positions.set(kid.id, {
          id: kid.id,
          x: x + 42 + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * (28 + kids.length * 2),
          r: TYPE_RADIUS[kid.type] ?? 9,
        });
      });
      yCursor += 118 + Math.min(kids.length, 5) * 10;
    });
  }

  graph.nodes
    .filter((node) => node.type === "module")
    .forEach((mod, index) => {
      const child = graph.nodes.find((node) => node.filePath?.startsWith(`${mod.filePath}/`) && positions.has(node.id));
      const base = child ? positions.get(child.id) : undefined;
      positions.set(mod.id, {
        id: mod.id,
        x: (base?.x ?? originX) - 70,
        y: (base?.y ?? originY + index * 80) - 46,
        r: TYPE_RADIUS.module,
      });
    });

  let orphanIndex = 0;
  for (const node of graph.nodes) {
    if (positions.has(node.id)) continue;
    const layerIndex = Math.max(
      0,
      layerOrder.findIndex((id) => graph.layers.find((layer) => layer.id === id)?.nodeIds.includes(node.id)),
    );
    positions.set(node.id, {
      id: node.id,
      x: originX + layerIndex * colWidth + 40,
      y: originY + 720 + orphanIndex * 36,
      r: TYPE_RADIUS[node.type] ?? 9,
    });
    orphanIndex += 1;
  }

  return positions;
}
