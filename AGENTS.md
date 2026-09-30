# Cloud agent instructions (tech-demos)

This repository is the **single sticky monorepo** for daily X-bookmark tech demos. Follow these rules on every task.

## Repository policy

- **Never** create a new GitHub repository per demo. All demos live here under `apps/<kebab-slug>/`.
- **Only** add or update files under `apps/<kebab-slug>/` for the demo you are building (plus any tracking updates explicitly requested).
- Do **not** modify unrelated `apps/*` directories or rewrite monorepo scaffold files (`AGENTS.md`, `skills/`, root `README.md`, `.gitignore`, `tracking/` layout) unless the user explicitly asks.

## Before you build

1. Plan first using **`skills/project-planning/SKILL.md`**.
2. Write **`apps/<slug>/PLAN.md`** before implementing. The plan should match the approved pick and MVP scope.

## App requirements

- Each demo is **self-contained**: from `apps/<slug>/`, `bun install && bun run dev` must start the app.
- Prefer **Bun** for package management and scripts.
- Keep apps **independently runnable** (own `package.json`, dependencies, and dev script).
- Every demo **must** include **`apps/<slug>/README.md`** with clear instructions and notes for **manual testing**. Cover at least:
  - how to run (`bun install && bun run dev`);
  - what to click / try;
  - WebMCP flag notes if relevant;
  - expected Agent panel behavior if relevant;
  - any other setup a reviewer needs to verify the demo.
- Every demo **must** include a brief **`apps/<slug>/HOW_IT_WORKS.md`** (app root, next to the README) that explains the **underlying technology** in concept terms: what it is, how it differs from the obvious alternative, and how this demo maps to it. Diagrams (mermaid or ASCII) are welcome. Link it from the demo README. This is a standing owner preference.

## Pull requests

**Mandatory for every demo PR:** attach **both** of the following. A screenshot without a video is incomplete; a video without a screenshot is incomplete.

- at least **one screenshot** of the running app, **and**
- at least **one video** of the running app.

Also required on the demo PR:

- `apps/<slug>/README.md` (run steps + manual test notes);
- `apps/<slug>/HOW_IT_WORKS.md` (concepts + optional diagrams), linked from that README.

Scaffold-only or docs-only PRs are exempt from screenshot/video unless the task says otherwise.

## Tracking

- Use `tracking/seen-bookmarks.json` to record proposed, skipped, and built bookmarks when your workflow requires it. See `tracking/README.md` for field definitions.
