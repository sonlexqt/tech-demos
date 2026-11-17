export type FieldType = "signature" | "initials" | "date" | "name";

export type FieldSource = "agent" | "human";

export interface BBox {
  /** Normalized 0–1, origin top-left of the page. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  role: "signer";
  order: number;
}

export interface EnvelopeField {
  id: string;
  type: FieldType;
  signerId: string;
  page: number;
  bbox: BBox;
  label: string;
  confidence: number;
  source: FieldSource;
}

export type EnvelopeStatus =
  | "idle"
  | "preparing"
  | "awaiting_approval"
  | "ready"
  | "cancelled";

export interface EnvelopeState {
  document: {
    id: string;
    title: string;
    pageCount: number;
    fileUrl: string;
  };
  recipients: Recipient[];
  signingOrder: string[];
  fields: EnvelopeField[];
  status: EnvelopeStatus;
  summary?: string;
  agentNotes?: string[];
}

export interface GroundTruthField {
  id: string;
  type: FieldType;
  signerId: string;
  page: number;
  bbox: BBox;
  label: string;
}

export interface GroundTruth {
  document: {
    id: string;
    title: string;
    pageCount: number;
    pageSize: { width: number; height: number; unit: "pt" };
  };
  recipients: Recipient[];
  fields: GroundTruthField[];
}

export interface FieldScore {
  truthId: string;
  predictedId: string | null;
  type: FieldType;
  signerId: string;
  pageMatch: boolean;
  iou: number;
  correct: boolean;
  predictedConfidence: number | null;
  predictedPage: number | null;
  humanCorrected: boolean;
}

export interface ScoringReport {
  iouThreshold: number;
  totalTruth: number;
  totalPredicted: number;
  correct: number;
  precision: number;
  recall: number;
  f1: number;
  perType: Record<
    FieldType,
    { truth: number; predicted: number; correct: number; precision: number; recall: number }
  >;
  fields: FieldScore[];
  lowConfidence: {
    threshold: number;
    flagged: number;
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
  };
  humanCorrections: HumanCorrection[];
}

export interface HumanCorrection {
  fieldId: string;
  kind: "moved" | "resized" | "deleted" | "added" | "page-changed";
  detail: string;
}

export interface TokenUsageEstimate {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedUsd: number;
}

export interface EvalResult {
  mode: "mock" | "live";
  startedAt: string;
  finishedAt: string;
  latencyMs: number;
  eventCounts: Record<string, number>;
  scoring: ScoringReport;
  usage: TokenUsageEstimate | null;
  summaryMarkdown: string;
  notes: string[];
}

export interface PdfTextItem {
  page: number;
  text: string;
  bbox: BBox;
}

export const FIELD_TYPES: FieldType[] = ["signature", "initials", "date", "name"];

export const EMPTY_ENVELOPE: EnvelopeState = {
  document: {
    id: "msa-northwind-acme-2026",
    title: "Master Services Agreement — Northwind Labs × Acme Dynamics",
    pageCount: 6,
    fileUrl: "/fixture-msa.pdf",
  },
  recipients: [],
  signingOrder: [],
  fields: [],
  status: "idle",
};
