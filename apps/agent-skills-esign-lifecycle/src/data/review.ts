import type { ReviewComment } from "../types";

export const reviewSummary = {
  verdict: "REQUEST CHANGES",
  overview:
    "Cadence logic matches SPEC.md and the terminal-status matrix is tested. One Required: custom hours must be validated on the API, not only in the UI. Remaining notes are Nit / Optional / FYI.",
  axes: [
    { name: "Correctness", score: "Mostly", note: "Happy path + terminal statuses covered; API boundary missing." },
    { name: "Readability", score: "Good", note: "Named types, DAMP tests, no nested ternaries." },
    { name: "Architecture", score: "Good", note: "Reuses scheduleReminders; no new scheduler." },
    { name: "Security", score: "Gap", note: "Trust the form and you skip the hours clamp." },
    { name: "Performance", score: "OK", note: "Potential: previewing 10 ticks on input. Not measured." },
  ],
};

export const reviewComments: ReviewComment[] = [
  {
    id: "r1",
    persona: "security",
    personaLabel: "Security engineer",
    axis: "Security",
    severity: "Required",
    location: "src/api/envelopes.ts:118",
    body: "Custom hours are clamped in the React field only. A crafted POST can set firstDelayHours=8760.",
    fix: "Validate ReminderCadence with the same parser at the API boundary. Reject, do not clamp-and-continue.",
  },
  {
    id: "r2",
    persona: "qa",
    personaLabel: "QA specialist",
    axis: "Correctness",
    severity: "Required",
    location: "tests/reminders/parse.test.ts",
    body: "No test that a direct API payload with hours=0 is rejected. UI tests would stay green.",
    fix: "Add a medium test that POSTs invalid cadence and expects 422.",
  },
  {
    id: "r3",
    persona: "staff",
    personaLabel: "Staff engineer",
    axis: "Architecture",
    severity: "Optional",
    location: "src/reminders/cadence.ts",
    body: "parseCadence and assertCadence are near-duplicates. Fine at two call sites; extract on the third.",
  },
  {
    id: "r4",
    persona: "staff",
    personaLabel: "Staff engineer",
    axis: "Readability",
    severity: "Nit",
    location: "src/ui/ReminderCadenceField.tsx:44",
    body: "Preset button copy \"2d\" vs \"48h\" — pick hours everywhere to match the spec.",
  },
  {
    id: "r5",
    persona: "webperf",
    personaLabel: "Web performance",
    axis: "Performance",
    severity: "FYI",
    location: "src/ui/ReminderCadenceField.tsx:71",
    body: "Previewing the next 10 fire times on every keystroke is potential impact only — scorecard not measured. Debounce if the field ever grows.",
  },
  {
    id: "r6",
    persona: "qa",
    personaLabel: "QA specialist",
    axis: "Correctness",
    severity: "FYI",
    location: "tests/reminders/schedule.test.ts",
    body: "Prove-It on signed envelopes is the right shape. Keep the failing RED log in the PR body.",
  },
  {
    id: "r7",
    persona: "security",
    personaLabel: "Security engineer",
    axis: "Security",
    severity: "Nit",
    location: "src/reminders/schedule.ts:22",
    body: "Reminder traces currently log envelopeId only — good. Do not add recipient email later.",
  },
  {
    id: "r8",
    persona: "staff",
    personaLabel: "Staff engineer",
    axis: "Correctness",
    severity: "Optional",
    location: "src/reminders/schedule.ts",
    body: "Consider treating \"viewed\" as still pending (it is). A comment would stop the next agent from \"fixing\" it.",
  },
];

export const personas = [
  {
    id: "all" as const,
    label: "All personas",
    hint: "Merged view — /ship fans out staff + QA + security; /webperf is separate",
  },
  { id: "staff" as const, label: "Staff engineer", hint: "code-reviewer · five-axis, staff bar" },
  { id: "qa" as const, label: "QA specialist", hint: "test-engineer · Prove-It + coverage" },
  { id: "security" as const, label: "Security", hint: "security-auditor · trust boundaries" },
  { id: "webperf" as const, label: "Web performance", hint: "web-performance-auditor · /webperf" },
];
