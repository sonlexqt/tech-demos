import { describe, expect, test } from "bun:test";
import { CELLS } from "../src/cells";
import { bootHeadlessUniver } from "../src/headless-univer";
import { computeQuote, roundMoney } from "../src/quote-math";
import { readSheetValues, setEditableCell, waitForFormulas } from "../src/sheet-io";

const combos = [
  { seats: 25, termYears: 1, premiumSupport: false, sso: false },
  { seats: 40, termYears: 2, premiumSupport: false, sso: false },
  { seats: 50, termYears: 1, premiumSupport: true, sso: true },
  { seats: 10, termYears: 3, premiumSupport: false, sso: true },
  { seats: 100, termYears: 1, premiumSupport: false, sso: false },
];

describe("quote math reference", () => {
  test("25 seats / 1 year / no add-ons", () => {
    const t = computeQuote({ seats: 25, termYears: 1, premiumSupport: false, sso: false });
    expect(t.subtotal).toBe(3000);
    expect(t.discountRate).toBe(0.1);
    expect(roundMoney(t.total)).toBe(2929.5);
  });

  test("40 seats / 2 years", () => {
    const t = computeQuote({ seats: 40, termYears: 2, premiumSupport: false, sso: false });
    expect(t.subtotal).toBe(9600);
    expect(t.discountRate).toBe(0.1);
    expect(roundMoney(t.total)).toBe(9374.4);
  });
});

describe("Univer formula engine", () => {
  test("recalculates seat/term combos", async () => {
    const api = bootHeadlessUniver();
    await waitForFormulas(api, 8000);
    for (const combo of combos) {
      await setEditableCell(api, CELLS.seats, combo.seats);
      await setEditableCell(api, CELLS.term, combo.termYears);
      await setEditableCell(api, CELLS.supportQty, combo.premiumSupport ? 1 : 0);
      await setEditableCell(api, CELLS.ssoQty, combo.sso ? 1 : 0);
      api.getFormula().executeCalculation();
      await waitForFormulas(api, 8000);
      const values = readSheetValues(api.getActiveWorkbook()!.getActiveSheet());
      const expected = computeQuote(combo);
      expect(values.seats).toBe(combo.seats);
      expect(values.termYears).toBe(combo.termYears);
      expect(Math.abs(values.totals.subtotal - expected.subtotal)).toBeLessThan(0.02);
      expect(Math.abs(values.totals.discountRate - expected.discountRate)).toBeLessThan(0.001);
      expect(Math.abs(values.totals.total - expected.total)).toBeLessThan(0.05);
    }
  }, 60_000);
});
