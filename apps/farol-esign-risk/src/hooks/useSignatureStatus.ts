import type { PartyRole } from "../types";
import { deriveSignatureStatus } from "./signatureStatus";
import { useEnvelope } from "./useEnvelope";

/** Shared by Review & sign and Countersign — this is the quiet blast-radius hook. */
export function useSignatureStatus(envelopeId: string | undefined, role: PartyRole) {
  const query = useEnvelope(envelopeId);
  const gate = deriveSignatureStatus(query.envelope, role);
  return { ...query, ...gate };
}
