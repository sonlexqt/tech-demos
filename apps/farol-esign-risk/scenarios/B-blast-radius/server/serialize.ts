import type { Envelope, EnvelopeSummary } from "./types";

/** REST response shape. Scenario B renames `status` → `envelopeStatus`. */
export function toApiEnvelope(envelope: Envelope) {
  return {
    id: envelope.id,
    title: envelope.title,
    documentKind: envelope.documentKind,
    envelopeStatus: envelope.status,
    createdAt: envelope.createdAt,
    updatedAt: envelope.updatedAt,
    parties: envelope.parties,
    body: envelope.body,
    audit: envelope.audit,
  };
}

export function toApiSummary(summary: EnvelopeSummary) {
  return {
    id: summary.id,
    title: summary.title,
    documentKind: summary.documentKind,
    envelopeStatus: summary.status,
    updatedAt: summary.updatedAt,
    waitingOn: summary.waitingOn,
  };
}
