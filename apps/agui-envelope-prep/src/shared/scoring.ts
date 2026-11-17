import type {
  BBox,
  EnvelopeField,
  EnvelopeState,
  FieldScore,
  FieldType,
  GroundTruth,
  HumanCorrection,
  ScoringReport,
} from "./types";
import { FIELD_TYPES } from "./types";

export const DEFAULT_IOU_THRESHOLD = 0.5;
export const DEFAULT_LOW_CONFIDENCE = 0.55;

export function boxIou(a: BBox, b: BBox): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.width * a.height + b.width * b.height - inter;
  if (union <= 0) return 0;
  return inter / union;
}

function keyOf(type: FieldType, signerId: string): string {
  return `${signerId}::${type}`;
}

export function scoreEnvelope(
  predicted: EnvelopeState,
  truth: GroundTruth,
  options?: {
    iouThreshold?: number;
    lowConfidenceThreshold?: number;
    humanCorrections?: HumanCorrection[];
  },
): ScoringReport {
  const iouThreshold = options?.iouThreshold ?? DEFAULT_IOU_THRESHOLD;
  const lowConfidenceThreshold = options?.lowConfidenceThreshold ?? DEFAULT_LOW_CONFIDENCE;
  const humanCorrections = options?.humanCorrections ?? [];
  const correctedIds = new Set(humanCorrections.map((c) => c.fieldId));

  const predByKey = new Map<string, EnvelopeField>();
  for (const field of predicted.fields) {
    predByKey.set(keyOf(field.type, field.signerId), field);
  }

  const fields: FieldScore[] = [];
  for (const t of truth.fields) {
    const pred = predByKey.get(keyOf(t.type, t.signerId)) ?? null;
    const iou = pred && pred.page === t.page ? boxIou(pred.bbox, t.bbox) : 0;
    const pageMatch = pred ? pred.page === t.page : false;
    const correct = Boolean(pred && pageMatch && iou >= iouThreshold);
    fields.push({
      truthId: t.id,
      predictedId: pred?.id ?? null,
      type: t.type,
      signerId: t.signerId,
      pageMatch,
      iou,
      correct,
      predictedConfidence: pred?.confidence ?? null,
      predictedPage: pred?.page ?? null,
      humanCorrected: pred ? correctedIds.has(pred.id) : correctedIds.has(t.id),
    });
  }

  const unmatchedPredicted = predicted.fields.filter(
    (p) => !truth.fields.some((t) => t.type === p.type && t.signerId === p.signerId),
  );

  const correct = fields.filter((f) => f.correct).length;
  const totalTruth = truth.fields.length;
  const totalPredicted = predicted.fields.length;
  const precision = totalPredicted === 0 ? 0 : correct / totalPredicted;
  const recall = totalTruth === 0 ? 0 : correct / totalTruth;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  const perType = {} as ScoringReport["perType"];
  for (const type of FIELD_TYPES) {
    const tFields = fields.filter((f) => f.type === type);
    const predictedCount =
      predicted.fields.filter((f) => f.type === type).length;
    const correctCount = tFields.filter((f) => f.correct).length;
    perType[type] = {
      truth: tFields.length,
      predicted: predictedCount,
      correct: correctCount,
      precision: predictedCount === 0 ? 0 : correctCount / predictedCount,
      recall: tFields.length === 0 ? 0 : correctCount / tFields.length,
    };
  }

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let flagged = 0;
  for (const f of fields) {
    const conf = f.predictedConfidence;
    const isLow = conf !== null && conf < lowConfidenceThreshold;
    if (isLow) flagged += 1;
    if (isLow && !f.correct) truePositives += 1;
    if (isLow && f.correct) falsePositives += 1;
    if (!isLow && f.predictedId && !f.correct) falseNegatives += 1;
  }
  // Extra predicted fields with no GT match count as errors; flag if low conf.
  for (const extra of unmatchedPredicted) {
    if (extra.confidence < lowConfidenceThreshold) {
      flagged += 1;
      truePositives += 1;
    } else {
      falseNegatives += 1;
    }
  }

  return {
    iouThreshold,
    totalTruth,
    totalPredicted,
    correct,
    precision,
    recall,
    f1,
    perType,
    fields,
    lowConfidence: {
      threshold: lowConfidenceThreshold,
      flagged,
      truePositives,
      falsePositives,
      falseNegatives,
    },
    humanCorrections,
  };
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}
