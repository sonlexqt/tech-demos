import { appendAuditRow, listAuditRows } from "../store";
import type { AuditEvent } from "../types";

export function appendAudit(
  requestId: string,
  action: string,
  actor: string,
  payload: Record<string, unknown> = {},
): AuditEvent {
  return appendAuditRow({
    id: `aud_${requestId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    requestId,
    action,
    actor,
    at: Date.now(),
    payload,
  });
}

export function listAudit(requestId: string): AuditEvent[] {
  return listAuditRows(requestId);
}

export function findAudit(requestId: string, action: string): AuditEvent[] {
  return listAuditRows(requestId).filter((event) => event.action === action);
}
