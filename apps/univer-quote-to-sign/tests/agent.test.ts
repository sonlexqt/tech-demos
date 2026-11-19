import { afterEach, describe, expect, test } from "bun:test";
import { AuditLog } from "../src/audit";
import { parseMockCommand } from "../src/agent/mock-parser";
import { executeTool, executeTools } from "../src/agent/tools";
import { CELLS } from "../src/cells";
import { bootHeadlessUniver } from "../src/headless-univer";
import { extractEditableWrites, readSheetValues, waitForFormulas } from "../src/sheet-io";
import { installProtection, setEnvelopeFrozen } from "../src/protection";

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
  afterEach(() => setEnvelopeFrozen(false));

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

  test("rejects add-on values other than 0 or 1", async () => {
    const api = bootHeadlessUniver();
    await waitForFormulas(api, 8000);
    const log = new AuditLog();
    const result = await executeTool(api, log, { name: "set_cell", args: { cell: "B7", value: 2 } });
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("0 or 1");
  }, 30_000);

  test("frozen envelope refuses agent writes", async () => {
    const api = bootHeadlessUniver();
    await waitForFormulas(api, 8000);
    const log = new AuditLog();
    setEnvelopeFrozen(true);
    const result = await executeTool(api, log, { name: "set_cell", args: { cell: "B6", value: 40 } });
    expect(result.ok).toBe(false);
    expect(result.detail.toLowerCase()).toContain("frozen");
    const seats = readSheetValues(api.getActiveWorkbook()!.getActiveSheet()).seats;
    expect(seats).toBe(25);
  }, 30_000);
});

describe("command interceptor", () => {
  afterEach(() => setEnvelopeFrozen(false));

  test("extractEditableWrites reads set-range params", () => {
    const writes = extractEditableWrites({
      range: { startRow: 5, startColumn: 1, endRow: 5, endColumn: 1 },
      value: 40,
    });
    expect(writes).toEqual([{ cell: "B6", value: 40 }]);
  });

  test("frozen interceptor blocks live setValue", async () => {
    const api = bootHeadlessUniver();
    await waitForFormulas(api, 8000);
    installProtection(api);
    setEnvelopeFrozen(true);
    api.getActiveWorkbook()!.getActiveSheet().getRange("B6").setValue(99);
    await waitForFormulas(api, 4000);
    expect(readSheetValues(api.getActiveWorkbook()!.getActiveSheet()).seats).toBe(25);
  }, 30_000);
});
