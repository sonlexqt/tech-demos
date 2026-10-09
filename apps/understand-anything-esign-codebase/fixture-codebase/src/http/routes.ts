import { listAudit } from "../audit/trail";
import { createSignatureRequest } from "../requests/create-request";
import { getRequest } from "../store";
import type { CreateRequestInput, SignatureRequest } from "../types";
import { handleInboundWebhook } from "../webhooks/dispatch";

export function sendSignatureRequest(input: CreateRequestInput): SignatureRequest {
  return createSignatureRequest(input);
}

export function getAuditTrail(requestId: string) {
  const request = getRequest(requestId);
  if (!request) throw new Error(`unknown request ${requestId}`);
  return { requestId, events: listAudit(requestId) };
}

export function receiveInboundWebhook(
  requestId: string,
  event: "signature_request.viewed" | "signature_request.signed" | "signature_request.declined",
) {
  const request = getRequest(requestId);
  if (!request) throw new Error(`unknown request ${requestId}`);
  return handleInboundWebhook(request, event);
}
