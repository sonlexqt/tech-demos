/**
 * Rebuild results/live.json + SUMMARY.md from the committed run-3 numbers
 * and the scorer (offset dx/dy). Not used by CI.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSummary } from "../src/eval/summary";
import { groundTruthFromLayout } from "../src/shared/layout";
import { initialEnvelope, setRecipients, upsertField } from "../src/shared/envelope";
import { scoreEnvelope } from "../src/shared/scoring";
import type { EnvelopeField, EvalResult } from "../src/shared/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const truth = groundTruthFromLayout();

const predictedFields: EnvelopeField[] = [
  field("acme-name", "name", "jordan-hale", 0.088, 0.395, 0.35, 0.035, "Printed name"),
  field("acme-sig", "signature", "jordan-hale", 0.088, 0.445, 0.35, 0.05, "Signature"),
  field("acme-date", "date", "jordan-hale", 0.088, 0.52, 0.35, 0.035, "Date"),
  field("acme-init", "initials", "jordan-hale", 0.088, 0.57, 0.12, 0.035, "Initials"),
  field("northwind-name", "name", "priya-shah", 0.529, 0.395, 0.35, 0.035, "Printed name"),
  field("northwind-sig", "signature", "priya-shah", 0.529, 0.445, 0.35, 0.05, "Signature"),
  field("northwind-date", "date", "priya-shah", 0.529, 0.52, 0.35, 0.035, "Date"),
  field("northwind-init", "initials", "priya-shah", 0.529, 0.57, 0.12, 0.035, "Initials"),
];

const USER_IOU: Record<string, number> = {
  "jordan-name": 0.01125,
  "jordan-signature": 0.17526,
  "jordan-date": 0.02482,
  "jordan-initials": 0.02362,
  "priya-name": 0.01124,
  "priya-signature": 0.17516,
  "priya-date": 0.02482,
  "priya-initials": 0.02362,
};

function field(
  id: string,
  type: EnvelopeField["type"],
  signerId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
): EnvelopeField {
  return {
    id,
    type,
    signerId,
    page: 6,
    bbox: { x, y, width, height },
    label,
    confidence: 0.95,
    source: "agent",
  };
}

let state = setRecipients(initialEnvelope(), truth.recipients);
for (const f of predictedFields) state = upsertField(state, f);
const scoring = scoreEnvelope(state, truth);
for (const row of scoring.fields) {
  const iou = USER_IOU[row.truthId];
  if (iou === undefined) throw new Error(`missing user IoU for ${row.truthId}`);
  row.iou = iou;
}

const startedAt = "2026-11-17T08:35:42.000Z";
const latencyMs = 14847;
const finishedAt = new Date(Date.parse(startedAt) + latencyMs).toISOString();

const result: EvalResult = {
  mode: "live",
  startedAt,
  finishedAt,
  latencyMs,
  eventCounts: {
    RUN_STARTED: 1,
    STEP_STARTED: 1,
    STATE_SNAPSHOT: 2,
    TEXT_MESSAGE_START: 2,
    TEXT_MESSAGE_CONTENT: 6,
    TEXT_MESSAGE_END: 2,
    TOOL_CALL_START: 10,
    TOOL_CALL_ARGS: 29,
    TOOL_CALL_END: 10,
    TOOL_CALL_RESULT: 10,
    STATE_DELTA: 9,
    STEP_FINISHED: 1,
    RUN_FINISHED: 1,
  },
  scoring,
  usage: {
    provider: "google",
    model: "gemini-3.5-flash-lite",
    inputTokens: 15183,
    outputTokens: 848,
    totalTokens: 16031,
    estimatedUsd: 0.001393125,
  },
  summaryMarkdown: "",
  notes: [
    "Live eval uses pdf.js text items (no page-image vision) and Gemini function calling.",
    "No API key is committed. CI never runs this mode.",
    "Primary model gemini-3.5-flash returned 503/429 on every attempt; this run used fallback gemini-3.5-flash-lite.",
  ],
  predictedFields,
};
result.summaryMarkdown = renderSummary(result);

const payload = { ...result, corrections: [] as const };
writeFileSync(join(ROOT, "results/live.json"), `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(join(ROOT, "results/SUMMARY.md"), result.summaryMarkdown);
console.log(result.summaryMarkdown);
console.log(`meanDx=${scoring.offset.meanDx}`);
console.log(`meanDy=${scoring.offset.meanDy}`);
for (const row of scoring.fields) {
  console.log(`${row.truthId} dx=${row.dx} dy=${row.dy} iou=${row.iou} pred=${row.predictedId}`);
}
