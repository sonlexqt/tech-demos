# OpenCode × Jev e-sign tester

## Source
- Bookmark: https://x.com/Neriousy/status/2100287208166969746
- Slug: `jev-opencode-esign-tester`

## Goal (single-user MVP)
Open a self-contained Lumin Sign **fixture** plus a test-plan runner. In under two minutes a reviewer picks a preset (happy-path send, missing-signer fail, decline recovery), then **Run** or **Step** through it. On each step a Jev **Choice** or **Score** picks the next click/type/assertion from a small action space, the chosen target highlights on the form, and a pass/fail log updates. Without `JEV_API_KEY` the chooser is a deterministic fixture so `bun install && bun run dev` always works. The README points at the real [OpenCode + TypeSafe Jev](https://jevtypesafeai.com/integrations/opencode) harness; this demo does not embed OpenCode.

## Out of scope
- Production Lumin Sign / Lumin API
- Installing or embedding OpenCode in the app
- Copying other `apps/*` demos
- Auth, multi-user, deploy
- Committing secrets or exposing the key via `VITE_*`

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + React + TypeScript
- Key libraries: Vite middleware proxy for optional live Jev (`JEV_API_KEY` → `POST https://jevtypesafeai.com/api/v1/decide`); no client-side key

## Manual testing / README
What `apps/jev-opencode-esign-tester/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- What to click / try (presets, Run / Step / Reset, keyboard)
- Optional `JEV_API_KEY` (server/Vite only); Fixture badge without a key, Live Jev with one
- Link to OpenCode + TypeSafe Jev for the real coding-agent harness
- Pass/fail checklist for the three plans and highlight + log behavior

## Acceptance criteria
- [ ] `cd apps/jev-opencode-esign-tester && bun install && bun run dev` works
- [ ] `apps/jev-opencode-esign-tester/README.md` has run steps and a manual test checklist
- [ ] Left: mock Lumin Sign surface with numbered interactive targets
- [ ] Right: ordered test-plan runner (click, type, assert status, expect error)
- [ ] Presets: happy-path send, missing-signer fail, decline recovery
- [ ] Each step: Jev Choice/Score picks from a small action space; target highlights; pass/fail log
- [ ] Run / Step / Reset plus keyboard step-through
- [ ] Badge shows Fixture vs Live Jev; live only when `JEV_API_KEY` is set on the server
- [ ] Deterministic fixture chooser; bun tests cover chooser + runner
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] `tracking/seen-bookmarks.json` updated (merge, not wipe) for this bookmark/slug

## Validation (PR)
- Screenshot: split layout — Lumin Sign fixture + runner, Fixture badge, a mid-plan highlight
- Video: open app → pick a plan → Step/Run through it → show highlight + pass/fail log
- README: run steps + manual test notes match the checklist above
