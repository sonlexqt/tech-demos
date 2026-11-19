import type { QuoteInput, QuoteTotals } from "./quote-math";

export type Actor = "signer" | "agent";

export interface AuditEntry {
  id: number;
  at: string;
  actor: Actor;
  source: string;
  cell: string;
  label: string;
  oldValue: number | string | null;
  newValue: number | string | null;
  total: number;
}

export interface SheetValues extends QuoteInput {
  totals: QuoteTotals;
}

export interface SignedRecord {
  envelopeId: string;
  signedAt: string;
  signerName: string;
  snapshot: unknown;
  displayed: SheetValues;
  auditLog: AuditEntry[];
  contentPdfBase64: string;
  signedPdfBase64: string;
  snapshotSha256: string;
  contentPdfSha256: string;
  signedPdfSha256: string;
  bindingSha256: string;
}

export interface VerifyResult {
  ok: boolean;
  reasons: string[];
  recomputedTotal: number | null;
  bindingSha256: string | null;
  expectedBindingSha256: string;
}

export interface AgentToolResult {
  name: string;
  ok: boolean;
  detail: string;
}
