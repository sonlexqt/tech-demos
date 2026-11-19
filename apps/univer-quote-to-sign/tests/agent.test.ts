import { describe, expect, test } from "bun:test";
import { AuditLog } from "../src/audit";
import { parseMockCommand } from "../src/agent/mock-parser";
import { executeTools } from "../src/agent/tools";
import { CELLS } from "../src/cells";
import { bootHeadlessUniver } from "../src/headless-univer";
import { readSheetValues, waitForFormulas } from "../src/sheet-io";

describe("mock parser", () => {
  test("parses 40 seats, 2-year term", () => {
    const calls = parseMockCommand("make it 40 seats, 2-year term");
    expect(calls).toEqual([
      { name: "set_cell", args: { cell: CELLS.seats, value: 40 } },
      { name: "set_cell", args: { cell: CELLS.term, value: 2 } },
    ]);
  });

  test("parses undo", () => {
    expect(parseMockCommand("undo")).toEqual([{ name: "undo", args: {} }]);
  });

  test("refuses empty", () => {
    expect(parseMockCommand("   ")).toEqual([]);
  });
});

describe("agent edit + undo via Univer commands", () => {
  test("round trip", async () => {
    const api = bootHeadlessUniver();
    await waitForFormulas(api, 8000);
    const log = new AuditLog();
    const before = readSheetValues(api.getActiveWorkbook()!.getActiveSheet());
    expect(before.seats).toBe(25);
    expect(before.termYears).toBe(1);

    const calls = parseMockCommand("make it 40 seats, 2-year term");
    const results = await executeTools(api, log, calls);
    expect(results.every((r) => r.ok)).toBe(true);
    api.getFormula().executeCalculation();
    await waitForFormulas(api, 8000);
    const edited = readSheetValues(api.getActiveWorkbook()!.getActiveSheet());
    expect(edited.seats).toBe(40);
    expect(edited.termYears).toBe(2);

    await executeTools(api, log, [{ name: "undo", args: {} }]);
    api.getFormula().executeCalculation();
    await waitForFormulas(api, 8000);
    let undone = readSheetValues(api.getActiveWorkbook()!.getActiveSheet());
    if (undone.seats === 40 && undone.termYears === 2) {
      await executeTools(api, log, [{ name: "undo", args: {} }]);
      api.getFormula().executeCalculation();
      await waitForFormulas(api, 8000);
      undone = readSheetValues(api.getActiveWorkbook()!.getActiveSheet());
    }
    expect(undone.seats).toBe(25);
    expect(undone.termYears).toBe(1);
  }, 60_000);
});
