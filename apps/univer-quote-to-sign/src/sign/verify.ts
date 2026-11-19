import { a1ToRowCol } from "../cells";
import { computeQuote, roundMoney } from "../quote-math";
import type { SignedRecord, VerifyResult } from "../types";
import { bytesFromBase64, hashBinding } from "./hash";
import { readSheetValues, waitForFormulas, type UniverFacade } from "../sheet-io";

const EPS = 0.02;

type SnapshotCell = { v?: unknown };
type SnapshotSheet = { cellData?: Record<string, Record<string, SnapshotCell>> };
type SnapshotLike = { sheets?: Record<string, SnapshotSheet> };

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

  let recomputedTotal: number | null = null;
  if (api) {
    await waitForFormulas(api, 5000);
    const workbook = api.getActiveWorkbook();
    if (workbook) {
      const values = readSheetValues(workbook.getActiveSheet());
      recomputedTotal = values.totals.total;
      if (Math.abs(values.totals.total - record.displayed.totals.total) > EPS) {
        reasons.push(
          `Recomputed total ${roundMoney(values.totals.total)} ≠ signed total ${roundMoney(record.displayed.totals.total)}`,
        );
      }
      if (values.seats !== record.displayed.seats) {
        reasons.push(`Recomputed seats ${values.seats} ≠ signed seats ${record.displayed.seats}`);
      }
    }
  } else {
    const expected = computeQuote(record.displayed);
    recomputedTotal = expected.total;
    if (Math.abs(expected.total - record.displayed.totals.total) > EPS) {
      reasons.push("Displayed totals do not match the quote formula.");
    }
  }

  return {
    ok: reasons.length === 0,
    reasons,
    recomputedTotal,
    bindingSha256: hashes.bindingSha256,
    expectedBindingSha256: record.bindingSha256,
  };
}
