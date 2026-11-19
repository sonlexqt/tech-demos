import { CELLS, a1ToRowCol, isEditableA1, rowColToA1, type EditableA1 } from "./cells";
import { computeQuote, type QuoteTotals } from "./quote-math";
import type { SheetValues } from "./types";

export interface UniverFacade {
  getActiveWorkbook(): WorkbookFacade | null;
  getFormula(): { onCalculationResultApplied(timeout?: number): Promise<void>; executeCalculation(): void };
  addEvent(event: unknown, callback: (payload: CommandEvent) => void): { dispose(): void };
  Event: { BeforeCommandExecute: unknown; CommandExecuted: unknown };
  undo(): Promise<unknown> | unknown;
  executeCommand?(id: string, params: unknown): unknown;
}

export interface WorkbookFacade {
  getActiveSheet(): WorksheetFacade;
  getSheetByName(name: string): WorksheetFacade | null;
  save(): unknown;
  undo(): WorkbookFacade;
  redo(): WorkbookFacade;
  getWorkbookPermission?: () => {
    setMode(mode: string): Promise<unknown>;
    setPoint(point: unknown, value: boolean): Promise<unknown>;
  };
}

export interface WorksheetFacade {
  getRange(a1: string): RangeFacade;
  getRange(row: number, col: number): RangeFacade;
}

export interface RangeFacade {
  getValue(): unknown;
  getRawValue(): unknown;
  getDisplayValue(): unknown;
  getCellData(): { v?: unknown; f?: string; t?: number } | null;
  setValue(value: unknown): unknown;
  getRangePermission?: () => {
    protect(options: Record<string, unknown>): Promise<unknown>;
  };
}

export interface CommandEvent {
  id?: string;
  type?: number;
  params?: unknown;
  cancel?: boolean;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/[$,%\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function readCellNumber(sheet: WorksheetFacade, a1: string): number {
  const range = sheet.getRange(a1);
  if (typeof range.getRawValue === "function") {
    const raw = range.getRawValue();
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const parsed = asNumber(raw);
    if (raw !== undefined && raw !== null && raw !== "") return parsed;
  }
  const data = range.getCellData?.();
  if (data && data.v !== undefined && data.v !== null) return asNumber(data.v);
  return asNumber(range.getValue());
}

export function readSheetValues(sheet: WorksheetFacade): SheetValues {
  const seats = readCellNumber(sheet, CELLS.seats);
  const termYears = readCellNumber(sheet, CELLS.term);
  const premiumSupport = readCellNumber(sheet, CELLS.supportQty) !== 0;
  const sso = readCellNumber(sheet, CELLS.ssoQty) !== 0;
  const totals: QuoteTotals = {
    platform: readCellNumber(sheet, CELLS.linePlatform),
    support: readCellNumber(sheet, CELLS.lineSupport),
    sso: readCellNumber(sheet, CELLS.lineSso),
    subtotal: readCellNumber(sheet, CELLS.subtotal),
    discountRate: readCellNumber(sheet, CELLS.discountRate),
    discount: readCellNumber(sheet, CELLS.discountAmt),
    taxable: readCellNumber(sheet, CELLS.taxable),
    tax: readCellNumber(sheet, CELLS.tax),
    total: readCellNumber(sheet, CELLS.total),
  };
  return { seats, termYears, premiumSupport, sso, totals };
}

export function expectedTotalsFromSheet(values: Pick<SheetValues, "seats" | "termYears" | "premiumSupport" | "sso">) {
  return computeQuote(values);
}

export async function waitForFormulas(
  api: UniverFacade,
  timeoutMs = 4000,
  opts: { required?: boolean } = {},
): Promise<void> {
  try {
    api.getFormula().executeCalculation();
  } catch {
    // Headless or already running.
  }
  try {
    await api.getFormula().onCalculationResultApplied(timeoutMs);
  } catch (error) {
    if (opts.required) {
      throw new Error(`Formula calculation did not finish: ${String(error)}`);
    }
  }
}

export function assertEditableValue(cell: EditableA1, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`${cell} value must be a number`);
  if ((cell === "B7" || cell === "B8") && value !== 0 && value !== 1) {
    throw new Error(`${cell} must be 0 or 1`);
  }
  if ((cell === "B6" || cell === "D6") && (!Number.isInteger(value) || value < 0)) {
    throw new Error(`${cell} must be a non-negative integer`);
  }
}

export async function setEditableCell(
  api: UniverFacade,
  cell: EditableA1,
  value: number,
): Promise<void> {
  assertEditableValue(cell, value);
  const workbook = api.getActiveWorkbook();
  if (!workbook) throw new Error("No active workbook");
  const sheet = workbook.getActiveSheet();
  const pending = waitForFormulas(api);
  sheet.getRange(cell).setValue(value);
  await pending;
}

function numericFromCellPatch(patch: unknown): number | null {
  if (patch === null || patch === undefined) return null;
  if (typeof patch === "number" || typeof patch === "string" || typeof patch === "boolean") {
    return asNumber(patch);
  }
  if (typeof patch === "object" && "v" in (patch as object)) {
    return asNumber((patch as { v?: unknown }).v);
  }
  return null;
}

export function extractEditableWrites(params: unknown): { cell: EditableA1; value: number }[] {
  const out: { cell: EditableA1; value: number }[] = [];
  if (!params || typeof params !== "object") return out;
  const p = params as Record<string, unknown>;
  const cells = commandWritesCells(params);
  const value = p.value;
  const cellValue = p.cellValue;
  for (const { row, col } of cells) {
    const a1 = rowColToA1(row, col);
    if (!isEditableA1(a1)) continue;
    let n: number | null = null;
    if (cellValue && typeof cellValue === "object" && !Array.isArray(cellValue)) {
      const grid = cellValue as { [rowKey: string]: { [colKey: string]: unknown } };
      n = numericFromCellPatch(grid[String(row)]?.[String(col)]);
    } else if (Array.isArray(value) && p.range && typeof p.range === "object") {
      const r = p.range as { startRow?: number; startColumn?: number };
      const rr = row - (r.startRow ?? row);
      const cc = col - (r.startColumn ?? col);
      n = numericFromCellPatch((value as unknown[][])[rr]?.[cc]);
    } else {
      n = numericFromCellPatch(value);
    }
    if (n === null) continue;
    out.push({ cell: a1, value: n });
  }
  return out;
}

export function commandWritesCells(params: unknown): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  if (!params || typeof params !== "object") return cells;
  const p = params as Record<string, unknown>;

  const pushRange = (range: unknown) => {
    if (!range || typeof range !== "object") return;
    const r = range as {
      startRow?: number;
      startColumn?: number;
      endRow?: number;
      endColumn?: number;
    };
    if (r.startRow == null || r.startColumn == null) return;
    const endRow = r.endRow ?? r.startRow;
    const endCol = r.endColumn ?? r.startColumn;
    for (let row = r.startRow; row <= endRow; row += 1) {
      for (let col = r.startColumn; col <= endCol; col += 1) {
        cells.push({ row, col });
      }
    }
  };

  pushRange(p.range);
  if (Array.isArray(p.ranges)) p.ranges.forEach(pushRange);

  const cellValue = p.cellValue ?? p.value;
  if (cellValue && typeof cellValue === "object" && !Array.isArray(cellValue)) {
    for (const [rowKey, cols] of Object.entries(cellValue as Record<string, unknown>)) {
      const row = Number(rowKey);
      if (!Number.isFinite(row) || !cols || typeof cols !== "object") continue;
      for (const colKey of Object.keys(cols as Record<string, unknown>)) {
        const col = Number(colKey);
        if (Number.isFinite(col)) cells.push({ row, col });
      }
    }
  }

  return cells;
}

export function rangeTouchesLocked(params: unknown): boolean {
  const cells = commandWritesCells(params);
  if (cells.length === 0) {
    // Unknown shape — do not block undo/redo; callers decide.
    return false;
  }
  return cells.some(({ row, col }) => {
    const a1 = `${String.fromCharCode(65 + col)}${row + 1}`;
    // Only A-Z single letters are used on this sheet.
    void a1ToRowCol;
    const editable = a1 === "B6" || a1 === "D6" || a1 === "B7" || a1 === "B8";
    return !editable;
  });
}
