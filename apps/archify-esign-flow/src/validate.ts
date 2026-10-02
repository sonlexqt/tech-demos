import type { SequenceIR, WorkflowIR } from "./types";

export type IrReport = {
  ok: boolean;
  kind: "workflow" | "sequence" | "unknown";
  title: string;
  schemaVersion: number | null;
  errors: string[];
  counts: string;
};

const ID = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

function uniq(ids: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!ID.test(id)) errors.push(`${label} "${id}" is not a portable Archify id`);
    if (seen.has(id)) errors.push(`duplicate ${label} "${id}"`);
    seen.add(id);
  }
}

export function validateWorkflow(raw: unknown): { ir: WorkflowIR | null; report: IrReport } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return {
      ir: null,
      report: {
        ok: false,
        kind: "unknown",
        title: "",
        schemaVersion: null,
        errors: ["workflow IR is not an object"],
        counts: "",
      },
    };
  }
  const doc = raw as WorkflowIR;
  if (doc.diagram_type !== "workflow") errors.push("diagram_type must be workflow");
  if (doc.schema_version !== 1 && doc.schema_version !== 2) errors.push("schema_version must be 1 or 2");
  if (!doc.meta?.title) errors.push("meta.title is required");
  if (!doc.meta?.output?.endsWith(".html")) errors.push("meta.output must be a portable .html path");
  if (!Array.isArray(doc.lanes) || doc.lanes.length < 1) errors.push("lanes[] is required");
  if (!Array.isArray(doc.nodes) || doc.nodes.length < 1) errors.push("nodes[] is required");
  if (!Array.isArray(doc.edges)) errors.push("edges[] is required");

  const laneIds = (doc.lanes ?? []).map((l) => l.id);
  const nodeIds = (doc.nodes ?? []).map((n) => n.id);
  uniq(laneIds, "lane", errors);
  uniq(nodeIds, "node", errors);
  uniq((doc.edges ?? []).map((e, i) => e.id ?? `edge-${i}`), "edge", errors);

  for (const node of doc.nodes ?? []) {
    if (!laneIds.includes(node.lane)) errors.push(`node ${node.id} references missing lane ${node.lane}`);
    if (node.col < 0 || node.col > 5) errors.push(`node ${node.id} col must be 0–5`);
  }
  for (const edge of doc.edges ?? []) {
    if (!nodeIds.includes(edge.from)) errors.push(`edge ${edge.id ?? "?"} from missing node ${edge.from}`);
    if (!nodeIds.includes(edge.to)) errors.push(`edge ${edge.id ?? "?"} to missing node ${edge.to}`);
  }
  for (const id of doc.mainPath ?? []) {
    if (!nodeIds.includes(id)) errors.push(`mainPath references missing node ${id}`);
  }

  return {
    ir: errors.length ? doc : doc,
    report: {
      ok: errors.length === 0,
      kind: "workflow",
      title: doc.meta?.title ?? "",
      schemaVersion: doc.schema_version ?? null,
      errors,
      counts: `${doc.nodes?.length ?? 0} nodes · ${doc.edges?.length ?? 0} edges · ${doc.lanes?.length ?? 0} lanes`,
    },
  };
}

export function validateSequence(raw: unknown): { ir: SequenceIR | null; report: IrReport } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return {
      ir: null,
      report: {
        ok: false,
        kind: "unknown",
        title: "",
        schemaVersion: null,
        errors: ["sequence IR is not an object"],
        counts: "",
      },
    };
  }
  const doc = raw as SequenceIR;
  if (doc.diagram_type !== "sequence") errors.push("diagram_type must be sequence");
  if (doc.schema_version !== 1) errors.push("schema_version must be 1");
  if (!doc.meta?.title) errors.push("meta.title is required");
  if (!doc.meta?.output?.endsWith(".html")) errors.push("meta.output must be a portable .html path");
  if (!Array.isArray(doc.participants) || doc.participants.length < 2) {
    errors.push("participants[] needs at least two entries");
  }
  if (!Array.isArray(doc.messages) || doc.messages.length < 1) errors.push("messages[] is required");

  const pIds = (doc.participants ?? []).map((p) => p.id);
  uniq(pIds, "participant", errors);
  uniq((doc.messages ?? []).map((m, i) => m.id ?? `msg-${i}`), "message", errors);

  for (const msg of doc.messages ?? []) {
    if (!pIds.includes(msg.from)) errors.push(`message ${msg.id ?? "?"} from missing participant ${msg.from}`);
    if (!pIds.includes(msg.to)) errors.push(`message ${msg.id ?? "?"} to missing participant ${msg.to}`);
    if (typeof msg.y !== "number" || msg.y < 160) errors.push(`message ${msg.id ?? "?"} y must be ≥ 160`);
  }

  return {
    ir: doc,
    report: {
      ok: errors.length === 0,
      kind: "sequence",
      title: doc.meta?.title ?? "",
      schemaVersion: doc.schema_version ?? null,
      errors,
      counts: `${doc.participants?.length ?? 0} participants · ${doc.messages?.length ?? 0} messages`,
    },
  };
}
