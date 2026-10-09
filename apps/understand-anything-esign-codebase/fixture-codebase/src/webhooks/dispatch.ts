import { appendAudit } from "../audit/trail";
import { appendWebhookRow, listWebhookRows } from "../store";
import type { SignatureRequest, WebhookDelivery, WebhookEvent } from "../types";

const MAX_ATTEMPTS = 3;

export class WebhookDispatcher {
  emit(request: SignatureRequest, event: WebhookEvent): WebhookDelivery {
    const delivery: WebhookDelivery = {
      id: `wh_${request.id}_${event}_${Date.now().toString(36)}`,
      requestId: request.id,
      event,
      attempts: 1,
      status: "delivered",
    };
    appendWebhookRow(delivery);
    appendAudit(request.id, "webhook.delivered", "system", {
      event,
      deliveryId: delivery.id,
    });
    return delivery;
  }

  retryFailed(requestId: string): WebhookDelivery[] {
    const retried: WebhookDelivery[] = [];
    for (const delivery of listWebhookRows(requestId)) {
      if (delivery.status !== "failed") continue;
      if (delivery.attempts >= MAX_ATTEMPTS) continue;
      delivery.attempts += 1;
      delivery.status = "delivered";
      delivery.lastError = undefined;
      appendAudit(requestId, "webhook.retried", "system", {
        event: delivery.event,
        deliveryId: delivery.id,
        attempts: delivery.attempts,
      });
      retried.push(delivery);
    }
    return retried;
  }
}

const dispatcher = new WebhookDispatcher();

export function emitWebhook(request: SignatureRequest, event: WebhookEvent): WebhookDelivery {
  return dispatcher.emit(request, event);
}

export function retryFailed(requestId: string): WebhookDelivery[] {
  return dispatcher.retryFailed(requestId);
}

export function handleInboundWebhook(
  request: SignatureRequest,
  event: "signature_request.viewed" | "signature_request.signed" | "signature_request.declined",
): WebhookDelivery {
  request.lastActivityAt = Date.now();
  if (event === "signature_request.viewed" && request.status === "sent") {
    request.status = "in_progress";
  }
  if (event === "signature_request.declined") {
    request.status = "declined";
  }
  appendAudit(request.id, event, "signer", { event });
  return emitWebhook(request, event);
}
