# Farol e-sign PR risk (Lumin Sign fixture)

## Source
- Pick: [winnin/farol](https://github.com/winnin/farol) (MIT; CLI/GitHub Action `@winninjs/farol`)
- Approval: owner Son Le — Approve
- Slug: `farol-esign-risk`
- Bookmark id: none in `tracking/seen-bookmarks.json` — record as a short built note, no invented X id

## Goal (single-user MVP)
In under two minutes a reviewer can click through a **local Lumin Sign–shaped envelope fixture** (list → review & sign → countersign → audit trail) and then contrast **two committed farol scenarios**: a copy-only tweak that should stay low-risk, versus a one-line change to the shared `useSignatureStatus` hook plus a renamed envelope API field that should light up reach (countersign), untested lines, and a contract-break. farol is compiler analysis, not an LLM. If the CLI cannot score this tiny app the way the pitch hopes, the README keeps the recorded output and says so — no fake glowing report.

## Out of scope
- Real Lumin / production e-sign APIs, credentials, or legal signing
- GitHub Action CI wiring, Datadog usage, or farol commenting on this monorepo’s PRs
- Auth, persistence, multi-tenant storage, deploy
- LLM review agents or WebMCP
- A full replica of Lumin Sign’s product UI

## Stack
- Runtime/tooling: Bun (`bun install && bun run dev`)
- UI/framework: Vite + React + TypeScript + React Router (`createBrowserRouter` so farol’s frontend adapter can read pages)
- Local API: tiny Express-style REST (in-memory envelopes / signature status) plus a GraphQL SDL file farol’s backend surface can use for contract comparison
- Key libraries: `react`, `react-router-dom`, `express`, Vite; farol invoked via `npx @winninjs/farol` in a reproducible script (not required to run the UI)

## Fixture shape
- Pages: envelope list, review & sign, countersign, audit trail
- Shared hook: `useSignatureStatus` used by **countersign** and **review & sign**
- In-memory envelopes only (offer letter, NDA, etc.)

## Farol scenarios (reproducible)
Documented patches + `bun run farol:scenarios` that copies the app into a throwaway git repo, applies each patch, and runs `@winninjs/farol`:

| | Change | What we hope farol shows |
|---|---|---|
| **A — Harmless** | Copy/typo tweak only (planted misspelling on the list page) | Fast track or otherwise low risk; no countersign reach, no contract break |
| **B — Quiet blast radius** | One-line change to `useSignatureStatus` **and** rename a field on the envelope API/schema | Careful review (or honest actual verdict); reach map includes countersign; contract-break on the renamed field; changed hook line untested |

Committed JSON / Markdown / HTML reports live under `fixtures/reports/`. The script can regenerate them.

## Manual testing / README
What `apps/farol-esign-risk/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) and open the Vite URL
- What to click: open an envelope, sign, countersign, read the audit trail
- How to reproduce scenarios A and B (`bun run farol:scenarios`) and where the committed reports are
- No WebMCP flags; Agent panel N/A
- Pass/fail: app runs locally; both scenarios are visible and honest; farol is named as compiler-based PR risk

## Acceptance criteria
- [ ] `cd apps/farol-esign-risk && bun install && bun run dev` works
- [ ] `apps/farol-esign-risk/README.md` has run steps + manual test checklist
- [ ] `PLAN.md` and `HOW_IT_WORKS.md` are present
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app
- [ ] Four pages exist; countersign and review & sign share `useSignatureStatus`
- [ ] Local API/mock only — no production Lumin calls
- [ ] Two farol scenarios are documented and reproducible; reports are committed (or recorded CLI output)
- [ ] README is honest if farol’s verdict/reach/contracts differ from the pitch
- [ ] Tracking gets a short built note (no fake bookmark id)

## Validation (PR)
- Screenshot: envelope list or review & sign of the running fixture; preferably also farol’s scenario B report (HTML or CLI)
- Video: open app → list → review & sign → countersign → audit; then open/show scenario B report
- README: run steps + both farol scenario recipes + checklist
