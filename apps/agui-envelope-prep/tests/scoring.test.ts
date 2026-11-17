import { describe, expect, test } from "bun:test";
import { groundTruthFromLayout, pdfBoxToNorm, PDF_FIELDS } from "../src/shared/layout";
import { boxIou, scoreEnvelope } from "../src/shared/scoring";
import { initialEnvelope, setRecipients, upsertField } from "../src/shared/envelope";
import type { EnvelopeField } from "../src/shared/types";

const truth = groundTruthFromLayout();

function fieldFromTruth(id: keyof typeof PDF_FIELDS, confidence = 0.9): EnvelopeField {
  const t = truth.fields.find((f) => f.id === id);
  if (!t) throw new Error(id);
  return { ...t, confidence, source: "agent" };
}

describe("boxIou", () => {
  test("identical boxes are 1", () => {
    const a = pdfBoxToNorm(PDF_FIELDS["jordan-signature"]);
    expect(boxIou(a, a)).toBeCloseTo(1, 6);
  });
  test("disjoint boxes are 0", () => {
    expect(
      boxIou(
        { x: 0, y: 0, width: 0.1, height: 0.1 },
        { x: 0.5, y: 0.5, width: 0.1, height: 0.1 },
      ),
    ).toBe(0);
  });
});

describe("scoreEnvelope", () => {
  test("perfect placements score 100%", () => {
    let state = setRecipients(initialEnvelope(), truth.recipients);
    for (const f of truth.fields) {
      state = upsertField(state, { ...f, confidence: 0.9, source: "agent" });
    }
    const report = scoreEnvelope(state, truth);
    expect(report.correct).toBe(8);
    expect(report.precision).toBe(1);
    expect(report.recall).toBe(1);
    expect(report.perType.signature.correct).toBe(2);
  });

  test("wrong page is not a match even with high IoU", () => {
    let state = setRecipients(initialEnvelope(), truth.recipients);
    state = upsertField(state, { ...fieldFromTruth("priya-initials"), page: 5 });
    const report = scoreEnvelope(state, truth);
    const row = report.fields.find((f) => f.truthId === "priya-initials");
    expect(row?.pageMatch).toBe(false);
    expect(row?.correct).toBe(false);
  });

  test("low-confidence flags vs actual errors", () => {
    let state = setRecipients(initialEnvelope(), truth.recipients);
    for (const f of truth.fields) {
      const wrong = f.id === "jordan-date";
      state = upsertField(state, {
        ...f,
        confidence: wrong ? 0.4 : 0.92,
        source: "agent",
        bbox: wrong
          ? { x: f.bbox.x + 0.2, y: f.bbox.y, width: f.bbox.width, height: f.bbox.height }
          : f.bbox,
      });
    }
    const report = scoreEnvelope(state, truth);
    expect(report.lowConfidence.truePositives).toBe(1);
    expect(report.lowConfidence.falseNegatives).toBe(0);
    expect(report.correct).toBe(7);
  });
});
