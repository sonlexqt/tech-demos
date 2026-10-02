import { TYPE_COLOR } from "./theme";
import type { SequenceIR, SequenceParticipant } from "./types";

export type SequenceLayout = {
  ir: SequenceIR;
  width: number;
  height: number;
  columns: Map<string, number>;
};

export function layoutSequence(ir: SequenceIR): SequenceLayout {
  const width = ir.meta.viewBox?.[0] ?? 1120;
  const height = ir.meta.viewBox?.[1] ?? 820;
  const n = ir.participants.length;
  const left = 88;
  const right = width - 48;
  const gap = n > 1 ? (right - left) / (n - 1) : 0;
  const columns = new Map<string, number>();
  ir.participants.forEach((p, i) => columns.set(p.id, left + i * gap));
  return { ir, width, height, columns };
}

export function renderSequence(layout: SequenceLayout): string {
  const { ir, width, height, columns } = layout;
  const parts: string[] = [];
  parts.push(
    `<svg class="diagram sequence" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ir.meta.title)}">`,
  );
  parts.push(`<defs>
    <marker id="sq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.2 L 10 5 L 0 8.8 z" fill="#8aa0c4"/>
    </marker>
    <marker id="sq-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.2 L 10 5 L 0 8.8 z" fill="#5ce1e6"/>
    </marker>
  </defs>`);

  for (const seg of ir.segments ?? []) {
    parts.push(
      `<rect class="seg-band" x="24" y="${seg.from}" width="${width - 48}" height="${seg.to - seg.from}" rx="12"/>`,
    );
    parts.push(
      `<text class="seg-label" x="36" y="${seg.from + 18}">${escapeXml(seg.label)}</text>`,
    );
  }

  const lifeTop = 118;
  const lifeBot = height - 24;
  for (const p of ir.participants) {
    const x = columns.get(p.id)!;
    parts.push(`<line class="lifeline" x1="${x}" y1="${lifeTop}" x2="${x}" y2="${lifeBot}"/>`);
    parts.push(participantHead(p, x));
  }

  for (const act of ir.activations ?? []) {
    const x = columns.get(act.participant);
    if (x == null) continue;
    const color = TYPE_COLOR[act.type ?? "backend"];
    parts.push(
      `<rect class="activation" data-participant="${escapeAttr(act.participant)}" x="${x - 6}" y="${act.from}" width="12" height="${Math.max(8, act.to - act.from)}" rx="3" fill="${color}"/>`,
    );
  }

  ir.messages.forEach((msg, i) => {
    const x1 = columns.get(msg.from);
    const x2 = columns.get(msg.to);
    if (x1 == null || x2 == null) return;
    const id = msg.id ?? `msg-${i}`;
    const y = msg.y;
    const dir = x2 >= x1 ? 1 : -1;
    const start = x1 + dir * 8;
    const end = x2 - dir * 8;
    const variant = msg.variant ?? "default";
    const labelX = (x1 + x2) / 2;
    parts.push(
      `<g class="message" data-message-id="${escapeAttr(id)}" data-from="${escapeAttr(msg.from)}" data-to="${escapeAttr(msg.to)}" tabindex="0" role="button" aria-label="${escapeAttr(msg.label)}">
        <line class="msg-hit" x1="${start}" y1="${y}" x2="${end}" y2="${y}"/>
        <line class="msg-line variant-${variant}" x1="${start}" y1="${y}" x2="${end}" y2="${y}" marker-end="url(#sq-arrow)"/>
        <text class="msg-label" x="${labelX}" y="${y - 8}">${escapeXml(msg.label)}</text>
      </g>`,
    );
  });

  parts.push("</svg>");
  return parts.join("\n");
}

function participantHead(p: SequenceParticipant, x: number): string {
  const color = TYPE_COLOR[p.type];
  const w = 118;
  return `<g class="node participant" data-node-id="${escapeAttr(p.id)}" tabindex="0" role="button" aria-label="${escapeAttr(p.label)}">
    <rect class="node-shell" x="${x - w / 2}" y="36" width="${w}" height="58" rx="12"/>
    <rect class="node-accent" x="${x - w / 2}" y="36" width="${w}" height="5" rx="2.5" fill="${color}"/>
    <text class="node-label" text-anchor="middle" x="${x}" y="64">${escapeXml(p.label)}</text>
    <text class="node-sub" text-anchor="middle" x="${x}" y="82">${escapeXml(p.sublabel ?? p.type)}</text>
  </g>`;
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
