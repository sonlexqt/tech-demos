import { TYPE_COLOR } from "./theme";
import type { WorkflowIR, WorkflowNode } from "./types";

const PAD_X = 168;
const PAD_Y = 58;
const COL_W = 178;
const LANE_H = 116;
const NODE_W = 148;
const NODE_H = 56;

export type WorkflowLayout = {
  ir: WorkflowIR;
  width: number;
  height: number;
  nodeBox: Map<string, { x: number; y: number; w: number; h: number }>;
};

export function layoutWorkflow(ir: WorkflowIR): WorkflowLayout {
  const nodeBox = new Map<string, { x: number; y: number; w: number; h: number }>();
  const laneIndex = new Map(ir.lanes.map((lane, i) => [lane.id, i]));
  for (const node of ir.nodes) {
    const li = laneIndex.get(node.lane) ?? 0;
    const w = node.width ?? NODE_W;
    const x = PAD_X + node.col * COL_W + (COL_W - w) / 2;
    const y = PAD_Y + li * LANE_H + 30;
    nodeBox.set(node.id, { x, y, w, h: NODE_H });
  }
  const width = PAD_X + 6 * COL_W + 36;
  const height = PAD_Y + ir.lanes.length * LANE_H + 28;
  return { ir, width, height, nodeBox };
}

export function renderWorkflow(layout: WorkflowLayout): string {
  const { ir, width, height, nodeBox } = layout;
  const laneIndex = new Map(ir.lanes.map((lane, i) => [lane.id, i]));
  const parts: string[] = [];

  parts.push(
    `<svg class="diagram" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ir.meta.title)}">`,
  );
  parts.push(`<defs>
    <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.2 L 10 5 L 0 8.8 z" fill="#8aa0c4"/>
    </marker>
    <marker id="wf-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.2 L 10 5 L 0 8.8 z" fill="#5ce1e6"/>
    </marker>
    <filter id="wf-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`);

  for (const phase of ir.phases ?? []) {
    const x = PAD_X + phase.fromCol * COL_W + 8;
    const w = (phase.toCol - phase.fromCol + 1) * COL_W - 16;
    parts.push(
      `<rect class="phase phase-${phase.variant ?? "default"}" x="${x}" y="10" width="${w}" height="${height - 22}" rx="16"/>`,
    );
    parts.push(
      `<text class="phase-label" x="${x + 14}" y="28">${escapeXml(phase.label)}</text>`,
    );
  }

  ir.lanes.forEach((lane, i) => {
    const y = PAD_Y + i * LANE_H;
    const exception = lane.variant === "exception";
    parts.push(
      `<rect class="lane-band${exception ? " is-exception" : ""}" x="12" y="${y}" width="${width - 24}" height="${LANE_H - 10}" rx="14"/>`,
    );
    parts.push(
      `<text class="lane-label" x="24" y="${y + 28}">${escapeXml(lane.label)}</text>`,
    );
  });

  for (const group of ir.groups ?? []) {
    const li = laneIndex.get(group.lane);
    if (li == null) continue;
    const x = PAD_X + group.fromCol * COL_W + 6;
    const y = PAD_Y + li * LANE_H + 8;
    const w = (group.toCol - group.fromCol + 1) * COL_W - 12;
    parts.push(
      `<rect class="group group-${group.variant ?? "default"}" x="${x}" y="${y}" width="${w}" height="${LANE_H - 26}" rx="12"/>`,
    );
    parts.push(
      `<text class="group-label" x="${x + 10}" y="${y + 16}">${escapeXml(group.label)}</text>`,
    );
  }

  for (const edge of ir.edges) {
    const a = nodeBox.get(edge.from);
    const b = nodeBox.get(edge.to);
    if (!a || !b) continue;
    const path = edgePath(a, b, edge.route);
    const variant = edge.variant ?? "default";
    parts.push(
      `<g class="edge" data-edge-id="${escapeAttr(edge.id ?? `${edge.from}-${edge.to}`)}" data-from="${escapeAttr(edge.from)}" data-to="${escapeAttr(edge.to)}">
        <path class="edge-hit" d="${path}"/>
        <path class="edge-line variant-${variant}" d="${path}" marker-end="url(#wf-arrow)"/>
        ${edge.label ? edgeLabel(a, b, edge.label) : ""}
      </g>`,
    );
  }

  for (const node of ir.nodes) {
    parts.push(nodeSvg(node, nodeBox.get(node.id)!));
  }

  parts.push("</svg>");
  return parts.join("\n");
}

function nodeSvg(node: WorkflowNode, box: { x: number; y: number; w: number; h: number }): string {
  const color = TYPE_COLOR[node.type];
  return `<g class="node" data-node-id="${escapeAttr(node.id)}" tabindex="0" role="button" aria-label="${escapeAttr(node.label)}">
    <rect class="node-shell" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="12"/>
    <rect class="node-accent" x="${box.x}" y="${box.y}" width="5" height="${box.h}" rx="2.5" fill="${color}"/>
    <text class="node-label" x="${box.x + 16}" y="${box.y + 23}">${escapeXml(node.label)}</text>
    <text class="node-sub" x="${box.x + 16}" y="${box.y + 41}">${escapeXml(node.sublabel ?? node.type)}</text>
    ${node.tag ? `<text class="node-tag" x="${box.x + box.w - 10}" y="${box.y + 16}">${escapeXml(node.tag)}</text>` : ""}
  </g>`;
}

function edgePath(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  route?: string,
): string {
  const ax = a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = b.x;
  const by = b.y + b.h / 2;
  const sameRow = Math.abs(ay - by) < 8;

  if (route === "return-left") {
    const midY = Math.max(a.y + a.h, b.y + b.h) + 22;
    const left = Math.min(a.x, b.x) - 18;
    return `M ${a.x} ${ay} H ${left} V ${midY} H ${b.x + b.w / 2} V ${b.y + b.h}`;
  }

  if (sameRow && bx > ax) {
    return `M ${ax} ${ay} H ${bx}`;
  }

  const midX = (ax + bx) / 2;
  if (bx >= ax - 8) {
    return `M ${ax} ${ay} H ${midX} V ${by} H ${bx}`;
  }

  const drop = Math.max(a.y + a.h, b.y + b.h) + 18;
  return `M ${ax} ${ay} H ${ax + 16} V ${drop} H ${bx - 16} V ${by} H ${bx}`;
}

function edgeLabel(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  label: string,
): string {
  const x = (a.x + a.w + b.x) / 2;
  const y = (a.y + a.h / 2 + b.y + b.h / 2) / 2 - 8;
  return `<text class="edge-label" x="${x}" y="${y}">${escapeXml(label)}</text>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeXml(value).replaceAll('"', "&quot;");
}
