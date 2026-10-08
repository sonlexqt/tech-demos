export const verifyLog = [
  {
    phase: "RED",
    command: "bun test src/reminders/schedule.test.ts -t \"skips signed envelopes\"",
    result: "FAIL",
    detail:
      "Expected shouldRemind({ status: \"signed\" }) to be false. Received true — bug confirmed before the fix.",
  },
  {
    phase: "GREEN",
    command: "same test after shouldRemind checks terminal statuses",
    result: "PASS",
    detail: "signed / declined / expired / voided all return false. pending + budget remains true.",
  },
  {
    phase: "REFACTOR",
    command: "bun test src/reminders",
    result: "PASS",
    detail: "Extracted TERMINAL_STATUSES set. 11 small tests, 1 medium fake-clock walk. 12 pass.",
  },
];

export const verifyPyramid = {
  unit: "11 · parse, nextFireAt, shouldRemind",
  integration: "1 · fake clock through 48h preset then sign",
  e2e: "0 · mail provider not in this ticket",
};

export const beyonce =
  "If you liked it, you should have put a test on it — unsigned reminder budget is now a test, not a hope.";
