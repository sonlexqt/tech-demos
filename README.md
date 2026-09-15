# tech-demos

Sticky monorepo for **daily X-bookmark tech demos**. One approved pick becomes one self-contained app under `apps/<kebab-slug>/`.

## Flow

1. **Weekday scout** — surface interesting tech bookmarks from X.
2. **Approve** — pick what to build; record state in `tracking/seen-bookmarks.json`.
3. **PR** — a cloud agent plans (`apps/<slug>/PLAN.md`), implements the app, and opens a PR with screenshot **and** video of the running demo.

This repo is the only home for demos; do not spin up per-demo GitHub repositories.

## Run a demo

```bash
cd apps/<slug>
bun install
bun run dev
```

See `apps/README.md` for layout conventions.

## For cloud agents

Read **`AGENTS.md`** and use **`skills/project-planning/SKILL.md`** before building.

## Tracking

Bookmark pipeline fields are documented in **`tracking/README.md`**.
