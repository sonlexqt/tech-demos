import type { Rationalization } from "../types";

export const rationalizations: Rationalization[] = [
  {
    id: "too-small-spec",
    stage: "define",
    excuse: "Too small for a spec — I'll just code it",
    skill: "spec-driven-development",
    rebuttal:
      "Simple tasks don't need long specs, but they still need acceptance criteria. A two-line spec is fine. This ticket has hours ranges, terminal statuses, and a reuse constraint — that is not a one-liner.",
    evidence: [
      "SPEC.md covers the six core areas",
      "Success criteria are testable",
      "Human approved the spec in a later turn",
    ],
  },
  {
    id: "spec-after",
    stage: "define",
    excuse: "I'll write the spec after the code",
    skill: "spec-driven-development",
    rebuttal:
      "That's documentation, not specification. The spec's value is forcing clarity before code — including \"reuse scheduleReminders, never a cron builder.\"",
    evidence: ["Spec saved before Phase 2", "Turn stopped after SPEC.md", "Open questions listed"],
  },
  {
    id: "figure-it-out",
    stage: "plan",
    excuse: "I'll figure the tasks out as I go",
    skill: "planning-and-task-breakdown",
    rebuttal:
      "That's how you get a tangled mess. Ten minutes of planning surfaces the terminal-status slice and the flag slice as separate, reviewable units.",
    evidence: [
      "Every task has acceptance criteria",
      "Every task has a verification command",
      "No task is XL / >5 files",
    ],
  },
  {
    id: "tasks-obvious",
    stage: "plan",
    excuse: "The tasks are obvious",
    skill: "planning-and-task-breakdown",
    rebuttal:
      "Write them down anyway. Explicit tasks catch hidden dependencies — nextFireAt before the UI field, flag before exposing custom hours.",
    evidence: ["tasks/todo.md written", "Checkpoints after T2 and T3", "Human reviewed the plan"],
  },
  {
    id: "all-at-once",
    stage: "build",
    excuse: "Faster to implement the whole feature at once",
    skill: "incremental-implementation",
    rebuttal:
      "It feels faster until something breaks and you cannot find which of 500 lines caused it. Four slices, four commits, each compilable.",
    evidence: [
      "Each slice tested before the next",
      "Each increment committed",
      "Flag on before the field is user-visible",
    ],
  },
  {
    id: "test-later",
    stage: "verify",
    excuse: "I'll add tests later",
    skill: "test-driven-development",
    rebuttal:
      "You won't. And tests written after the fact test implementation, not behavior. The signed-envelope case had to fail first (Prove-It).",
    evidence: [
      "RED log exists for shouldRemind(signed)",
      "Full reminders suite green",
      "No skipped tests",
    ],
  },
  {
    id: "too-simple-test",
    stage: "verify",
    excuse: "This is too simple to test",
    skill: "test-driven-development",
    rebuttal:
      "Simple code gets complicated. Hours clamping and terminal statuses are the whole ticket. The test is the spec.",
    evidence: ["Every new behavior has a test", "Test names read like specifications"],
  },
  {
    id: "works-enough",
    stage: "review",
    excuse: "It works, that's good enough",
    skill: "code-review-and-quality",
    rebuttal:
      "Working code that skips the API boundary creates debt. Tests passing is necessary, not sufficient — they missed the crafted POST until the security persona looked.",
    evidence: [
      "Five axes scored",
      "Every comment has a severity label",
      "Critical / Required resolved or deferred in writing",
    ],
  },
  {
    id: "clean-later",
    stage: "review",
    excuse: "We'll clean it up later",
    skill: "code-review-and-quality",
    rebuttal:
      "Later never comes. The review is the quality gate. Required: validate cadence on the server before merge.",
    evidence: ["Required items addressed", "Verification story in the review"],
  },
  {
    id: "no-flag",
    stage: "ship",
    excuse: "We don't need a feature flag for this",
    skill: "shipping-and-launch",
    rebuttal:
      "Every feature benefits from a kill switch. A bad cadence in production is a mail-storm; flipping reminder_cadence_v1 is the one-minute rollback.",
    evidence: [
      "Flag configured, default OFF",
      "Rollback plan written",
      "Trigger conditions named",
    ],
  },
  {
    id: "staging-is-prod",
    stage: "ship",
    excuse: "It works in staging, ship it",
    skill: "shipping-and-launch",
    rebuttal:
      "Production has different volume and leftover pending jobs. Monitor after deploy; canary legal-ops first.",
    evidence: ["Pre-launch checklist", "Staged rollout named", "First-hour verification listed"],
  },
  {
    id: "skip-skill",
    stage: "any",
    excuse: "This is too small for a skill — I'll just implement",
    skill: "using-agent-skills",
    rebuttal:
      "Incorrect. If a task matches a skill, invoke it. \"Too small\" and \"I'll gather context first\" are the exact anti-rationalizations the pack tells agents to ignore.",
    evidence: ["Intent mapped to a skill", "Workflow followed, not partially applied"],
  },
];
