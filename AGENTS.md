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

## Pull requests

- Every **demo** PR must include **both**:
  - at least **one screenshot** of the running app, and
  - at least **one video** of the running app.
- Scaffold-only or docs-only PRs are exempt unless the task says otherwise.

## Tracking

- Use `tracking/seen-bookmarks.json` to record proposed, skipped, and built bookmarks when your workflow requires it. See `tracking/README.md` for field definitions.
