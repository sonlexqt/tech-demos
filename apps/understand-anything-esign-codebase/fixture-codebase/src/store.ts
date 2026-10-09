import type { AuditEvent, SignatureRequest, WebhookDelivery } from "./types";

const requests = new Map<string, SignatureRequest>();
const audit = new Map<string, AuditEvent[]>();
const webhooks = new Map<string, WebhookDelivery[]>();

export function insertRequest(request: SignatureRequest): SignatureRequest {
  requests.set(request.id, request);
  return request;
}

export function getRequest(id: string): SignatureRequest | undefined {
  return requests.get(id);
}

export function updateRequest(request: SignatureRequest): SignatureRequest {
  requests.set(request.id, request);
  return request;
}

export function listRequests(): SignatureRequest[] {
  return [...requests.values()];
}

export function appendAuditRow(event: AuditEvent): AuditEvent {
  const rows = audit.get(event.requestId) ?? [];
  rows.push(event);
  audit.set(event.requestId, rows);
  return event;
}

export function listAuditRows(requestId: string): AuditEvent[] {
  return [...(audit.get(requestId) ?? [])];
}

export function appendWebhookRow(delivery: WebhookDelivery): WebhookDelivery {
  const rows = webhooks.get(delivery.requestId) ?? [];
  rows.push(delivery);
  webhooks.set(delivery.requestId, rows);
  return delivery;
}

export function listWebhookRows(requestId: string): WebhookDelivery[] {
  return [...(webhooks.get(requestId) ?? [])];
}

export function resetStore(): void {
  requests.clear();
  audit.clear();
  webhooks.clear();
}
