import { describe, expect, test } from "bun:test";
import { groundTruthFromLayout, pdfBoxToNorm, PDF_FIELDS } from "../src/shared/layout";
import { boxIou, scoreEnvelope } from "../src/shared/scoring";
import { initialEnvelope, setRecipients, upsertField } from "../src/shared/envelope";
import type { EnvelopeField } from "../src/shared/types";

const truth = groundTruthFromLayout();

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

  test("unmatched truth fields have null dx/dy", () => {
    const state = setRecipients(initialEnvelope(), truth.recipients);
    const report = scoreEnvelope(state, truth);
    expect(report.offset.meanDx).toBe(0);
    expect(report.offset.meanDy).toBe(0);
    expect(report.offset.pageMatchRate).toBe(0);
    expect(report.fields.every((f) => f.dx === null && f.dy === null)).toBe(true);
  });

  test("offset diagnostics capture a systematic vertical miss", () => {
    let state = setRecipients(initialEnvelope(), truth.recipients);
    const predicted = [
      field("acme-name", "name", "jordan-hale", 0.088, 0.395, 0.35, 0.035, "Printed name"),
      field("acme-sig", "signature", "jordan-hale", 0.088, 0.445, 0.35, 0.05, "Signature"),
      field("acme-date", "date", "jordan-hale", 0.088, 0.52, 0.35, 0.035, "Date"),
      field("acme-init", "initials", "jordan-hale", 0.088, 0.57, 0.12, 0.035, "Initials"),
      field("northwind-name", "name", "priya-shah", 0.529, 0.395, 0.35, 0.035, "Printed name"),
      field("northwind-sig", "signature", "priya-shah", 0.529, 0.445, 0.35, 0.05, "Signature"),
      field("northwind-date", "date", "priya-shah", 0.529, 0.52, 0.35, 0.035, "Date"),
      field("northwind-init", "initials", "priya-shah", 0.529, 0.57, 0.12, 0.035, "Initials"),
    ];
    for (const f of predicted) state = upsertField(state, f);
    const report = scoreEnvelope(state, truth);
    expect(report.correct).toBe(0);
    expect(report.offset.pageMatchRate).toBe(1);
    expect(report.offset.typeMatchRate).toBe(1);
    expect(report.offset.signerMatchRate).toBe(1);
    expect(report.offset.meanDx).toBeCloseTo(-0.00032, 4);
    expect(report.offset.meanDy).toBeCloseTo(-0.03391, 4);
    for (const row of report.fields) {
      expect(row.pageMatch).toBe(true);
      expect(row.dx).not.toBeNull();
      expect(row.dy).not.toBeNull();
      expect(Math.abs(row.dx ?? 0)).toBeLessThan(0.001);
      expect(row.dy ?? 0).toBeLessThan(-0.03);
      expect(row.dy ?? 0).toBeGreaterThan(-0.04);
    }
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
