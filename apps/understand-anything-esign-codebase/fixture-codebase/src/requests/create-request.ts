import { appendAudit } from "../audit/trail";
import { placeFields } from "../fields/prep";
import { scheduleReminders } from "../reminders/scheduler";
import { resolveSigningOrder } from "../signers/routing";
import { insertRequest } from "../store";
import type { CreateRequestInput, SignatureRequest, Signer } from "../types";
import { emitWebhook } from "../webhooks/dispatch";

export function validatePayload(input: CreateRequestInput): string[] {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push("title is required");
  if (input.signers.length === 0) errors.push("at least one signer is required");
  if (input.expiresAt <= Date.now()) errors.push("expiresAt must be in the future");
  if (input.signingType === "ORDER") {
    const groups = input.signers.map((signer) => signer.group);
    if (groups.some((group) => group < 1)) errors.push("ORDER groups must be >= 1");
  }
  return errors;
}

export function createSignatureRequest(input: CreateRequestInput): SignatureRequest {
  const errors = validatePayload(input);
  if (errors.length > 0) {
    throw new Error(`invalid signature request: ${errors.join("; ")}`);
  }

  const now = Date.now();
  const signers: Signer[] = input.signers.map((signer, index) => ({
    id: `signer_${index + 1}`,
    email: signer.email,
    name: signer.name,
    group: input.signingType === "ORDER" ? signer.group : 1,
    status: "pending",
  }));

  const request: SignatureRequest = {
    id: `sr_${now.toString(36)}`,
    title: input.title,
    signingType: input.signingType,
    status: "sent",
    signers,
    fields: [],
    expiresAt: input.expiresAt,
    createdAt: now,
    lastActivityAt: now,
  };

  resolveSigningOrder(request);
  placeFields(request);
  insertRequest(request);
  scheduleReminders(request);
  appendAudit(request.id, "request.created", "requester", {
    title: request.title,
    signingType: request.signingType,
    signerCount: request.signers.length,
  });
  emitWebhook(request, "signature_request.sent");
  return request;
}
