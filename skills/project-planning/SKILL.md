# Project planning for a tech demo

Use this skill when turning an **approved** X-bookmark tech pick into a build plan under `apps/<kebab-slug>/`.

## Inputs

- Bookmark id, title, URL, and any scout/approval notes
- Target slug: **kebab-case** directory name under `apps/`

## Output

Create **`apps/<slug>/PLAN.md`** before writing application code. Keep the plan to one or two pages.

## PLAN.md template

```markdown
# <Human-readable demo title>

## Source
- Bookmark: <url>
- Slug: `<slug>`

## Goal (single-user MVP)
One paragraph: what the user can do in the demo in under 2 minutes.

## Out of scope
Bullet list of what you are **not** building (auth, multi-user, deploy, etc.).

## Stack
- Runtime/tooling: Bun
- UI/framework: <e.g. Vite + React, or plain HTML>
- Key libraries: <only what the MVP needs>

## Acceptance criteria
- [ ] `cd apps/<slug> && bun install && bun run dev` works
- [ ] <specific behavior 1>
- [ ] <specific behavior 2>
- [ ] ...

## Validation (PR)
- Screenshot: <what frame/state to capture>
- Video: <short script: open app, perform main action, show result>
```

## Planning rules

1. **Tight MVP** — one core flow; no production hardening unless the pick demands it.
2. **Self-contained** — no shared packages across apps unless the monorepo already has them.
3. **Runnable** — plan must end in a working `bun run dev`, not a stub.
4. **Evidence** — acceptance criteria should map directly to screenshot and video checks for the demo PR.

## After planning

Implement only what is in `PLAN.md`. If scope grows, update the plan in the same PR before adding code.
