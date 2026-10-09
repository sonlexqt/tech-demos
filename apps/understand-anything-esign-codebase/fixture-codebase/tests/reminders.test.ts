import { REMINDER_CADENCE_DAYS, dueReminders, scheduleReminders, sendDueReminders } from "../src/reminders/scheduler";
import { resetStore } from "../src/store";
import type { SignatureRequest } from "../src/types";

export function runReminderTests(): void {
  resetStore();
  if (REMINDER_CADENCE_DAYS.join(",") !== "1,3,7") {
    throw new Error("fixture cadence is day 1 / 3 / 7");
  }
  const createdAt = Date.now() - 4 * 86_400_000;
  const request: SignatureRequest = {
    id: "sr_remind",
    title: "MSA",
    signingType: "ORDER",
    status: "in_progress",
    signers: [{ id: "signer_1", email: "a@x.test", name: "A", group: 1, status: "awaiting" }],
    fields: [],
    expiresAt: Date.now() + 1_000,
    createdAt,
    lastActivityAt: createdAt,
  };
  scheduleReminders(request);
  const due = dueReminders(request, Date.now());
  if (due.length !== 2) throw new Error("day 1 and day 3 should be due after 4 days");
  const sent = sendDueReminders(request, Date.now());
  if (sent !== 2) throw new Error("due reminders should emit webhook + audit");
}
