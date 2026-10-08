export const buildSlices = [
  {
    id: "S1",
    task: "T1",
    title: "Cadence type + parse",
    commit: "feat(reminders): parse 24/48/72 and custom hours",
    lines: 84,
    status: "committed",
    note: "Additive. Compiles. Flag unused.",
  },
  {
    id: "S2",
    task: "T2",
    title: "Fake-clock nextFireAt",
    commit: "feat(reminders): nextFireAt on injected clock",
    lines: 61,
    status: "committed",
    note: "Clock injected — no Date.now() in the unit.",
  },
  {
    id: "S3",
    task: "T3",
    title: "Wire scheduleReminders",
    commit: "feat(reminders): stop on terminal envelope status",
    lines: 97,
    status: "committed",
    note: "Calls existing helper. No new dependency.",
  },
  {
    id: "S4",
    task: "T4",
    title: "Admin field + flag",
    commit: "feat(send-request): cadence field behind reminder_cadence_v1",
    lines: 112,
    status: "committed",
    note: "Default OFF. Rollback = flip the flag.",
  },
];

export const incrementCycle = ["Implement", "Test", "Verify", "Commit"];
