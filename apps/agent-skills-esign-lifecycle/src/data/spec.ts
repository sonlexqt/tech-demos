export const specMarkdown = `# Spec: Configurable signer reminder cadence

## Objective
Workspace admins on Lumin Sign configure how often unsigned recipients are reminded.
Success: a request using the 48h preset sends the first reminder at +48h, then every 48h,
and never after signed / declined / expired / voided. Custom hours are allowed (1–168).

User: Legal ops admin sending the Northwind Q3 MSA countersign.

## Tech Stack
TypeScript, existing envelope scheduler (\`scheduleReminders\`), Postgres reminder jobs,
transactional mail via the current provider. No new cron library.

## Commands
\`\`\`
Dev:   bun run dev
Test:  bun test src/reminders
Lint:  bun run lint
Build: bun run build
\`\`\`

## Project Structure
\`\`\`
src/reminders/cadence.ts     → parse + normalize cadence
src/reminders/schedule.ts    → nextFireAt / shouldRemind (reuse helper)
src/reminders/presets.ts     → 24h / 48h / 72h / custom
src/ui/ReminderCadenceField  → admin field on send-request
tests/reminders/             → unit + schedule fakes
\`\`\`

## Code Style
Prefer named exports, DAMP tests, no \`any\`. Cadence is a typed object, not a
free-form cron string.

\`\`\`ts
export type ReminderCadence = {
  firstDelayHours: number; // 1–168
  repeatEveryHours: number; // 1–168
  maxReminders: number;     // 1–10
};
\`\`\`

## Testing Strategy
80/15/5 pyramid. Small tests own parse + nextFireAt. One medium test walks a
fake clock through signed-then-silent. No E2E for mail provider.

## Boundaries
- Always: validate hours at the API boundary; stop mail on terminal status.
- Ask first: changing default workspace cadence; adding SMS.
- Never: ship a cron-expression builder; log signer emails in reminder traces.

## Success Criteria
- [ ] Presets 24 / 48 / 72 apply firstDelay = repeatEvery = that value, maxReminders = 5
- [ ] Custom rejects 0, 169, and maxReminders 0 or 11
- [ ] Terminal statuses never enqueue another job
- [ ] Existing \`scheduleReminders\` is called; no new scheduler package
- [ ] Feature flag \`reminder_cadence_v1\` defaults OFF

## Open Questions
- Quiet hours: out of scope for this ticket (follow-up SIGN-1902).
- Per-recipient override: no — envelope-level only.
`;

export const specAssumptions = [
  "Web app (existing Lumin Sign send-request form), not a new mobile surface",
  "Reuse scheduleReminders + job table — do not add a cron builder",
  "Hours, not crontab expressions; 1–168 range",
  "Feature flag reminder_cadence_v1 defaults OFF",
];
