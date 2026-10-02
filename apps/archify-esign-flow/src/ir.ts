import type { Relation, SequenceIR, SequenceMessage, WorkflowIR } from "./types";

export function workflowRelations(ir: WorkflowIR): Relation[] {
  return ir.edges.map((edge, i) => ({
    id: edge.id ?? `edge-${i}`,
    from: edge.from,
    to: edge.to,
    label: edge.label,
    variant: edge.variant,
  }));
}

export function sequenceRelations(ir: SequenceIR): Relation[] {
  return ir.messages.map((msg, i) => ({
    id: msg.id ?? `msg-${i}`,
    from: msg.from,
    to: msg.to,
    label: msg.label,
    variant: msg.variant,
  }));
}

export function findMessage(ir: SequenceIR, id: string): SequenceMessage | undefined {
  return ir.messages.find((m) => m.id === id);
}
