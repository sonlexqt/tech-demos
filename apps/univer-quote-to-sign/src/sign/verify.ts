import { a1ToRowCol, CELLS } from "../cells";
import { computeQuote, roundMoney, type QuoteTotals } from "../quote-math";
import type { SheetValues, SignedRecord, VerifyResult } from "../types";
import { bytesFromBase64, hashBinding, sha256Hex } from "./hash";
import { readSheetValues, waitForFormulas, type UniverFacade } from "../sheet-io";

const EPS = 0.02;

type SnapshotCell = { v?: unknown };
type SnapshotSheet = { cellData?: { [row: string]: { [col: string]: SnapshotCell } } };
type SnapshotLike = { sheets?: { [sheetId: string]: SnapshotSheet } };

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/[$,%\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function snapshotCellValue(snapshot: unknown, a1: string): unknown {
  const clone = snapshot as SnapshotLike;
  const { row, col } = a1ToRowCol(a1);
  for (const sheet of Object.values(clone.sheets ?? {})) {
    const cell = sheet.cellData?.[String(row)]?.[String(col)];
    if (cell) return cell.v;
  }
  return undefined;
}

export function readSnapshotInputs(snapshot: unknown): {
  seats: number;
  termYears: number;
  premiumSupport: boolean;
  sso: boolean;
} {
  return {
    seats: asNumber(snapshotCellValue(snapshot, CELLS.seats)),
    termYears: asNumber(snapshotCellValue(snapshot, CELLS.term)),
    premiumSupport: asNumber(snapshotCellValue(snapshot, CELLS.supportQty)) !== 0,
    sso: asNumber(snapshotCellValue(snapshot, CELLS.ssoQty)) !== 0,
  };
}

export function tamperSeats(snapshot: unknown, seats: number): unknown {
  const clone = structuredClone(snapshot) as SnapshotLike;
  const { row, col } = a1ToRowCol("B6");
  const sheets = clone.sheets ?? {};
  for (const sheet of Object.values(sheets)) {
    const cell = sheet.cellData?.[String(row)]?.[String(col)];
    if (cell) {
      cell.v = seats;
      return clone;
    }
  }
  throw new Error("Could not find seats cell B6 in snapshot");
}

function compareTotals(label: string, actual: QuoteTotals, expected: QuoteTotals, reasons: string[]): void {
  const keys: (keyof QuoteTotals)[] = [
    "platform",
    "support",
    "sso",
    "subtotal",
    "discountRate",
    "discount",
    "taxable",
    "tax",
    "total",
  ];
  for (const key of keys) {
    if (Math.abs(Number(actual[key]) - Number(expected[key])) > EPS) {
      reasons.push(`${label} ${key} ${roundMoney(Number(actual[key]))} ≠ signed ${roundMoney(Number(expected[key]))}`);
    }
  }
}

function compareInputs(actual: SheetValues, expected: SheetValues, reasons: string[], prefix: string): void {
  if (actual.seats !== expected.seats) reasons.push(`${prefix}seats ${actual.seats} ≠ signed ${expected.seats}`);
  if (actual.termYears !== expected.termYears) {
    reasons.push(`${prefix}term ${actual.termYears} ≠ signed ${expected.termYears}`);
  }
  if (actual.premiumSupport !== expected.premiumSupport) {
    reasons.push(`${prefix}premium support mismatch`);
  }
  if (actual.sso !== expected.sso) reasons.push(`${prefix}SSO mismatch`);
  compareTotals(prefix.replace(/:\s*$/, ""), actual.totals, expected.totals, reasons);
}

export async function verifyRecord(
  record: SignedRecord,
  loadedSnapshot: unknown,
  api?: UniverFacade | null,
): Promise<VerifyResult> {
  const reasons: string[] = [];
  const contentPdf = bytesFromBase64(record.contentPdfBase64);
  const hashes = await hashBinding(loadedSnapshot, contentPdf);

  if (hashes.bindingSha256 !== record.bindingSha256) {
    reasons.push(
      `Binding hash mismatch (got ${hashes.bindingSha256.slice(0, 12)}… expected ${record.bindingSha256.slice(0, 12)}…)`,
    );
  }
  if (hashes.snapshotSha256 !== record.snapshotSha256) {
    reasons.push("Snapshot SHA-256 does not match the signed snapshot.");
  }
  if (record.signedPdfSha256) {
    const signedPdf = bytesFromBase64(record.signedPdfBase64);
    const signedHex = await sha256Hex(signedPdf);
    if (signedHex !== record.signedPdfSha256) {
      reasons.push("Signed PDF SHA-256 does not match the downloadable PDF.");
    }
  }

  const fromSnapshot = readSnapshotInputs(loadedSnapshot);
  if (fromSnapshot.seats !== record.displayed.seats) {
    reasons.push(`Snapshot seats ${fromSnapshot.seats} ≠ signed seats ${record.displayed.seats}`);
  }
  if (fromSnapshot.termYears !== record.displayed.termYears) {
    reasons.push(`Snapshot term ${fromSnapshot.termYears} ≠ signed term ${record.displayed.termYears}`);
  }
  if (fromSnapshot.premiumSupport !== record.displayed.premiumSupport) {
    reasons.push("Snapshot premium-support flag does not match the signed display.");
  }
  if (fromSnapshot.sso !== record.displayed.sso) {
    reasons.push("Snapshot SSO flag does not match the signed display.");
  }

  let recomputedTotal: number | null = null;
  if (api) {
    await waitForFormulas(api, 8000, { required: true });
    const workbook = api.getActiveWorkbook();
    if (workbook) {
      const values = readSheetValues(workbook.getActiveSheet());
      recomputedTotal = values.totals.total;
      compareInputs(values, record.displayed, reasons, "Recomputed ");
    }
  } else {
    const expected = computeQuote(fromSnapshot);
    recomputedTotal = expected.total;
    compareTotals("Snapshot formula", expected, record.displayed.totals, reasons);
  }

  return {
    ok: reasons.length === 0,
    reasons,
    recomputedTotal,
    bindingSha256: hashes.bindingSha256,
    expectedBindingSha256: record.bindingSha256,
  };
}
