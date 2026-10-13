# e2e agent tests on a Lumin Sign fixture

## Source
- Bookmark: https://github.com/tester-army/e2e
- Id: `gh-tester-army-e2e`
- Slug: `e2e-esign-agent-tests`
- Via: GitHub trending / Show HN
- Library: [e2e](https://github.com/tester-army/e2e) by TesterArmy (Apache-2.0, npm `e2e`, pre-1.0)

## Goal (single-user MVP)
Open a **fake Lumin Sign fixture** (never the real Lumin app). In under two minutes: render a sample contract with PDF.js, drag a signature field onto the page, type a signature, send a two-signer envelope (Ada signs, Bob countersigns), and see **Completed**. A results page compares a committed **cold** run vs a **cached replay** (duration + model-call counts). A **UI drift** toggle renames buttons and moves the field panel so replay detects the change and re-plans, while a hard assertion still catches an injected bug (envelope never reaches Completed). Offline by default: committed replay caches + captured run fixtures; live model runs are optional and env-gated.

## Out of scope
- The real Lumin Sign / Lumin PDF product or any production API
- Real PDF signing, certificates, or legal validity
- Auth, multi-user, email delivery, or cloud deploy
- `agent.assert` / `waitFor` / `extract` in the default suite (those always call a model)
- Invented e2e APIs — only documented `agent.act`, locators, `expect`, cache, custom `StepExecutor`

## Stack
- Runtime/tooling: Bun (`bun install && bun run dev`)
- UI/framework: Vite + TypeScript (vanilla DOM)
- Key libraries: `pdfjs-dist`, `e2e`, `@e2e-dev/web` (Playwright Chromium)
- Telemetry: `E2E_TELEMETRY_DISABLED=1` on every script, local CI note, and doc command

## Manual testing / README
What `apps/e2e-esign-agent-tests/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- What to click: place field, sign as Ada, countersign as Bob, Completed
- Toggle **Simulate UI drift** (renamed buttons, panel moves; envelope never Completes)
- Open **Results** for cold vs replay comparison
- `bun run test:e2e` uses committed caches (no API key)
- Live agent: `E2E_LIVE_AGENT=1` plus a provider key (never committed)
- Pass/fail checklist for the main flow, drift, and results

## Acceptance criteria
- [x] `cd apps/e2e-esign-agent-tests && bun install && bun run dev` works
- [x] `apps/e2e-esign-agent-tests/README.md` has run steps and a manual test checklist
- [x] `PLAN.md` and `HOW_IT_WORKS.md` (concepts + mermaid: act → verify → record → replay / handoff)
- [x] Fixture app: PDF.js page, drag/drop signature field, type signature, two-signer envelope → Completed
- [x] e2e suite mixes `agent.act('…')` with locator `expect` hard assertions
- [x] UI drift variant: replay detects renamed/moved UI and re-plans; hard assertion catches the Completed bug
- [x] Results view: cold vs cached replay, duration and model-call counts side by side
- [x] Replay caches + captured run results committed under `fixtures/`; no API key required
- [x] `E2E_TELEMETRY_DISABLED=1` everywhere; keys never committed
- [x] `tracking/seen-bookmarks.json` marks `gh-tester-army-e2e` proposed **and** built
- [x] Demo PR includes at least one screenshot **and** one video of the running app

## Validation (PR)
- Screenshot: fixture with PDF rendered, signature field placed, envelope status visible; plus Results comparison
- Video: open app → place field → Ada signs → Bob countersigns → Completed; flip drift; open Results
- README: run steps + manual test notes match the checklist above
