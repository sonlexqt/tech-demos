import { appendAudit } from "../audit/trail";
import type { SignatureRequest } from "../types";
import { emitWebhook } from "../webhooks/dispatch";

/** Day offsets after send. Change this list to alter reminder cadence. */
export const REMINDER_CADENCE_DAYS = [1, 3, 7] as const;

export class ReminderScheduler {
  constructor(private readonly cadenceDays: readonly number[] = REMINDER_CADENCE_DAYS) {}

  dueAt(request: SignatureRequest, now = Date.now()): number[] {
    return this.cadenceDays.map((day) => request.createdAt + day * 86_400_000).filter((at) => at <= now);
  }

  dueReminders(request: SignatureRequest, now = Date.now()): number[] {
    if (request.status === "completed" || request.status === "declined") return [];
    return this.dueAt(request, now);
  }
}

const scheduler = new ReminderScheduler();

export function scheduleReminders(request: SignatureRequest): number[] {
  appendAudit(request.id, "reminder.scheduled", "system", {
    cadenceDays: [...REMINDER_CADENCE_DAYS],
  });
  return [...REMINDER_CADENCE_DAYS];
}

export function dueReminders(request: SignatureRequest, now = Date.now()): number[] {
  return scheduler.dueReminders(request, now);
}

export function sendDueReminders(request: SignatureRequest, now = Date.now()): number {
  const due = dueReminders(request, now);
  for (const at of due) {
    appendAudit(request.id, "reminder.sent", "system", { scheduledFor: at });
    emitWebhook(request, "signature_request.reminder.sent");
  }
  if (due.length > 0) request.lastActivityAt = now;
  return due.length;
}
