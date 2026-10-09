import { emitWebhook, handleInboundWebhook, retryFailed } from "../src/webhooks/dispatch";
import { listWebhookRows, resetStore } from "../src/store";
import type { SignatureRequest } from "../src/types";

export function runWebhookTests(): void {
  resetStore();
  const request: SignatureRequest = {
    id: "sr_wh",
    title: "MSA",
    signingType: "ORDER",
    status: "sent",
    signers: [{ id: "signer_1", email: "a@x.test", name: "A", group: 1, status: "awaiting" }],
    fields: [],
    expiresAt: Date.now() + 1_000,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  emitWebhook(request, "signature_request.sent");
  handleInboundWebhook(request, "signature_request.viewed");
  if (request.status !== "in_progress") throw new Error("viewed inbound webhook starts in_progress");
  const failed = listWebhookRows(request.id)[0];
  if (!failed) throw new Error("expected a delivery row");
  failed.status = "failed";
  failed.lastError = "timeout";
  const retried = retryFailed(request.id);
  if (retried.length !== 1) throw new Error("failed delivery should retry");
}
