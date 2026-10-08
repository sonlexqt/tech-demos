export const shipChecklist = [
  {
    section: "Code quality",
    items: [
      { label: "Unit + schedule suite green (12)", done: true },
      { label: "Build and typecheck clean", done: true },
      { label: "Review Required items resolved (API parse)", done: true },
      { label: "No leftover console.log in the field", done: true },
    ],
  },
  {
    section: "Security",
    items: [
      { label: "Cadence validated at the API boundary", done: true },
      { label: "No secrets in reminder jobs", done: true },
      { label: "Recipient email not logged", done: true },
    ],
  },
  {
    section: "Launch",
    items: [
      { label: "Flag reminder_cadence_v1 deployed OFF", done: true },
      { label: "Internal legal-ops workspace on canary", done: false },
      { label: "Rollback plan reviewed in this PR", done: true },
    ],
  },
];

export const rollbackPlan = {
  title: "Rollback plan — SIGN-1847 reminder cadence",
  triggers: [
    "Error rate on POST /envelopes > 2× baseline",
    "P95 schedule job latency > 50% above baseline",
    "Any reminder sent after signed / declined / expired / voided",
  ],
  steps: [
    "Disable reminder_cadence_v1 (kill switch, < 1 min). Server falls back to workspace default 48h.",
    "If jobs already enqueued with bad cadence: run replayReminders --status=pending --use-workspace-default.",
    "Verify: health 200, no new reminder.error events, one MSA request stays silent after sign.",
    "Notify #sign-launch. File the follow-up before re-enabling.",
  ],
  times: [
    { path: "Feature flag", time: "< 1 minute" },
    { path: "Replay pending jobs", time: "< 5 minutes" },
    { path: "Revert deploy (if flag is not enough)", time: "< 10 minutes" },
  ],
  flagLifecycle: [
    "Deploy flag OFF",
    "Enable for legal-ops",
    "Canary 5%",
    "25 → 50 → 100",
    "Remove flag after 2 weeks",
  ],
};
