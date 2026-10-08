import type { CompareRow } from "../types";

export const compareIntro = {
  title: "vs Superpowers twin (PR #10)",
  lede:
    "Same class of pack — skills that stop agents skipping process — shaped differently. This tab is fixtures only: it does not load apps/jev-keystroke-launcher-superpowers/.",
  agentSkills:
    "addyosmani/agent-skills organizes the whole product lifecycle (Define → Ship). Every skill has an anti-rationalization table and required evidence. Four review personas. Human checkpoint at each phase.",
  superpowers:
    "obra/superpowers, as used on PR #10, ran using-superpowers → brainstorming → writing-plans → TDD → executing-plans. Deep inner-loop methodology: dated design spec, a plan written for a junior engineer, subagent execution, worktree isolation. Narrower lifecycle — no ship checklist, no four-persona fan-out.",
};

export const compareRows: CompareRow[] = [
  {
    axis: "Organizing idea",
    agentSkills: "SDLC phases behind /spec /plan /build /test /review /ship",
    superpowers: "One disciplined loop: brainstorm → plan → TDD → execute → review",
  },
  {
    axis: "What this ticket would produce",
    agentSkills: "SPEC.md, sliced tasks + AC, increment commits, RED→GREEN log, five-axis review, rollback plan",
    superpowers: "Dated design spec, junior-engineer plan, TDD commits, task-reviewer sign-off",
  },
  {
    axis: "Anti-skip mechanism",
    agentSkills: "Per-skill rationalization table + verification evidence (this catcher)",
    superpowers: "Pipeline + task reviewer; hard to exit mid-loop",
  },
  {
    axis: "Review",
    agentSkills: "Five axes, Nit/Optional/FYI. /ship fans out staff + QA + security; /webperf is separate",
    superpowers: "Single task reviewer (spec + quality), then a whole-branch review",
  },
  {
    axis: "Human gates",
    agentSkills: "Checkpoint each phase (spec stop-the-turn is explicit)",
    superpowers: "Minimize mid-run check-ins; hand off and come back",
  },
  {
    axis: "Best fit",
    agentSkills: "A feature that must hit security, review, and launch — this reminder ticket",
    superpowers: "Long, autonomous, reasoning-heavy work (the keystroke-launcher twin)",
  },
];

export const compareFair =
  "Neither is \"better.\" Om Mishra's one-task experiment (same model, same prompt) gave agent-skills the edge on validation depth and Superpowers the edge on upfront architectural reasoning. Pick the shape of the work. Do not run both as the active router — stacked meta-skills fight over commands.";

export const superpowersPr = {
  number: 10,
  title: "Jev keystroke launcher Superpowers twin",
  url: "https://github.com/sonlexqt/tech-demos/pull/10",
  method: "using-superpowers → brainstorming → writing-plans → TDD → executing-plans",
  artifacts:
    "docs/superpowers/specs/2026-09-28-jev-keystroke-launcher-design.md and docs/superpowers/plans/2026-09-28-jev-keystroke-launcher.md",
};
