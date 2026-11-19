import { ENVELOPE_ID, SIGNER_NAME } from "../contract";
import { freezeWorkbookReadOnly } from "../protection";
import { readSheetValues, waitForFormulas, type UniverFacade } from "../sheet-io";
import type { AuditEntry, SignedRecord } from "../types";
import { bytesToBase64, hashBinding } from "./hash";
import { appendAuditPage, renderContentPdf } from "./pdf";

export async function signEnvelope(
  api: UniverFacade,
  auditLog: AuditEntry[],
): Promise<SignedRecord> {
  await waitForFormulas(api, 5000);
  const workbook = api.getActiveWorkbook();
  if (!workbook) throw new Error("No workbook to sign");
  const displayed = readSheetValues(workbook.getActiveSheet());
  const snapshot = workbook.save();
  const contentPdf = await renderContentPdf(displayed);
  const hashes = await hashBinding(snapshot, contentPdf);
  const signedAt = new Date().toISOString();
  const signedPdf = await appendAuditPage(contentPdf, {
    auditLog,
    snapshotSha256: hashes.snapshotSha256,
    contentPdfSha256: hashes.contentPdfSha256,
    bindingSha256: hashes.bindingSha256,
    signedAt,
  });
  await freezeWorkbookReadOnly(api);

  return {
    envelopeId: ENVELOPE_ID,
    signedAt,
    signerName: SIGNER_NAME,
    snapshot,
    displayed,
    auditLog: auditLog.map((e) => ({ ...e })),
    contentPdfBase64: bytesToBase64(contentPdf),
    signedPdfBase64: bytesToBase64(signedPdf),
    snapshotSha256: hashes.snapshotSha256,
    contentPdfSha256: hashes.contentPdfSha256,
    bindingSha256: hashes.bindingSha256,
  };
}
