import { describe, expect, test } from "bun:test";
import { applyStatePatch, diffState } from "../src/shared/json-patch";
import { initialEnvelope, setRecipients, upsertField } from "../src/shared/envelope";
import { RECIPIENTS, groundTruthFromLayout } from "../src/shared/layout";

describe("envelope JSON Patch", () => {
  test("round-trips a field add", () => {
    const before = setRecipients(initialEnvelope({ status: "preparing" }), RECIPIENTS);
    const truth = groundTruthFromLayout().fields[0];
    const after = upsertField(before, { ...truth, confidence: 0.9, source: "agent" });
    const delta = diffState(before, after);
    expect(delta.length).toBeGreaterThan(0);
    expect(delta.some((op) => op.path.includes("/fields"))).toBe(true);
    const applied = applyStatePatch(before, delta);
    expect(applied.fields).toHaveLength(1);
    expect(applied.fields[0].id).toBe(truth.id);
    expect(applied.recipients).toEqual(before.recipients);
  });

  test("replace bbox is a patch the client can apply", () => {
    const truth = groundTruthFromLayout().fields[0];
    const before = upsertField(initialEnvelope(), { ...truth, confidence: 0.4, source: "agent" });
    const after = upsertField(before, {
      ...before.fields[0],
      bbox: { ...before.fields[0].bbox, x: 0.2 },
      source: "human",
    });
    const delta = diffState(before, after);
    const applied = applyStatePatch(before, delta);
    expect(applied.fields[0].bbox.x).toBeCloseTo(0.2);
    expect(applied.fields[0].source).toBe("human");
  });
});
