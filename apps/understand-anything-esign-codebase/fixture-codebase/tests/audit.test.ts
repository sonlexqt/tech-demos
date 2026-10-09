import { appendAudit, findAudit, listAudit } from "../src/audit/trail";
import { resetStore } from "../src/store";

export function runAuditTests(): void {
  resetStore();
  appendAudit("sr_aud", "request.created", "requester", { title: "MSA" });
  appendAudit("sr_aud", "reminder.sent", "system", {});
  const all = listAudit("sr_aud");
  if (all.length !== 2) throw new Error("audit is append-only");
  if (findAudit("sr_aud", "reminder.sent").length !== 1) {
    throw new Error("findAudit filters by action");
  }
}
