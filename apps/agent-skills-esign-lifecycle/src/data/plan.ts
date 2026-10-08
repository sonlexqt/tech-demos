export const planTasks = [
  {
    id: "T1",
    title: "Cadence type + parse",
    size: "S",
    files: 2,
    deps: "None",
    acceptance: [
      "ReminderCadence type exported",
      "parseCadence accepts presets and custom hours",
      "Rejects 0, 169, maxReminders outside 1–10",
    ],
    verify: "bun test src/reminders/parse.test.ts",
  },
  {
    id: "T2",
    title: "nextFireAt on fake clock",
    size: "S",
    files: 2,
    deps: "T1",
    acceptance: [
      "First fire = sentAt + firstDelayHours",
      "Nth fire = first + (n-1)*repeatEveryHours",
      "Returns null after maxReminders",
    ],
    verify: "bun test src/reminders/schedule.test.ts",
  },
  {
    id: "T3",
    title: "shouldRemind respects terminal status",
    size: "M",
    files: 3,
    deps: "T2",
    acceptance: [
      "signed / declined / expired / voided → false",
      "pending + remaining budget → true",
      "Calls existing scheduleReminders, no new package",
    ],
    verify: "bun test src/reminders && bun run build",
  },
  {
    id: "T4",
    title: "Admin field behind flag",
    size: "M",
    files: 3,
    deps: "T3",
    acceptance: [
      "Send-request form shows presets + custom when flag ON",
      "Flag OFF hides field; server keeps workspace default",
      "Keyboard + label associated with the control",
    ],
    verify: "Manual: flag on/off on the send-request fixture",
  },
];

export const planCheckpoints = [
  {
    after: "T1–T2",
    checks: ["Parse + schedule unit tests green", "No UI yet"],
  },
  {
    after: "T3",
    checks: ["Terminal-status matrix green", "scheduleReminders is the only scheduler"],
  },
  {
    after: "T4",
    checks: ["Flag off is invisible", "Ready for five-axis review"],
  },
];

export const planRisks = [
  {
    risk: "Quiet hours sneak into this ticket",
    impact: "Med",
    mitigation: "Parked as SIGN-1902 in Open Questions",
  },
  {
    risk: "Agent adds a cron library",
    impact: "High",
    mitigation: "Spec Boundaries Never + T3 acceptance",
  },
];
