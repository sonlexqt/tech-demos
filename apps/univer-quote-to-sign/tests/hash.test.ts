import { describe, expect, test } from "bun:test";
import { createPricingWorkbookData } from "../src/workbook-data";
import { canonicalizeSnapshot, hashBinding, hashSnapshot } from "../src/sign/hash";
import { renderContentPdf } from "../src/sign/pdf";
import { computeQuote } from "../src/quote-math";
import { tamperSeats, verifyRecord } from "../src/sign/verify";
import { bytesToBase64 } from "../src/sign/hash";
import type { SignedRecord } from "../src/types";
import { DEFAULT_INPUT } from "../src/cells";

describe("snapshot hash stability", () => {
  test("canonical JSON is stable", async () => {
    const snap = createPricingWorkbookData();
    const a = canonicalizeSnapshot(snap);
    const b = canonicalizeSnapshot(structuredClone(snap));
    expect(a).toBe(b);
    const ha = await hashSnapshot(snap);
    const hb = await hashSnapshot(structuredClone(snap));
    expect(ha.sha256).toBe(hb.sha256);
    expect(ha.sha256).toHaveLength(64);
  });

  test("binding hash is stable for the same snapshot + PDF", async () => {
    const snap = createPricingWorkbookData();
    const displayed = {
      ...DEFAULT_INPUT,
      premiumSupport: false,
      sso: false,
      totals: computeQuote({ seats: 25, termYears: 1, premiumSupport: false, sso: false }),
    };
    const pdf = await renderContentPdf(displayed);
    const first = await hashBinding(snap, pdf);
    const second = await hashBinding(structuredClone(snap), pdf);
    expect(first.bindingSha256).toBe(second.bindingSha256);
    expect(first.snapshotSha256).toBe(second.snapshotSha256);
    expect(first.contentPdfSha256).toBe(second.contentPdfSha256);
  });
});

describe("tamper detection", () => {
  test("changing seats in the snapshot breaks the binding hash", async () => {
    const snap = createPricingWorkbookData();
    const displayed = {
      seats: 25,
      termYears: 1,
      premiumSupport: false,
      sso: false,
      totals: computeQuote({ seats: 25, termYears: 1, premiumSupport: false, sso: false }),
    };
    const pdf = await renderContentPdf(displayed);
    const hashes = await hashBinding(snap, pdf);
    const record: SignedRecord = {
      envelopeId: "t",
      signedAt: "2026-01-01T00:00:00.000Z",
      signerName: "test",
      snapshot: snap,
      displayed,
      auditLog: [],
      contentPdfBase64: bytesToBase64(pdf),
      signedPdfBase64: bytesToBase64(pdf),
      snapshotSha256: hashes.snapshotSha256,
      contentPdfSha256: hashes.contentPdfSha256,
      bindingSha256: hashes.bindingSha256,
    };

    const ok = await verifyRecord(record, snap, null);
    expect(ok.ok).toBe(true);

    const tampered = tamperSeats(snap, 999);
    const bad = await verifyRecord(record, tampered, null);
    expect(bad.ok).toBe(false);
    expect(bad.reasons.some((r) => r.toLowerCase().includes("hash"))).toBe(true);
  });
});
