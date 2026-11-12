# Lumin Sign · Gemini Decisions preflight

## Source
- Bookmark / launch: https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/
- Docs: https://aistudio.google.com/docs/decisions-api
- Slug: `gemini-decisions-preflight`

## Goal (single-user MVP)
A sender about to hit **Send** on a Lumin Sign envelope uploads a contract PDF and runs **one** Gemini Decisions API call (~40 typed checks: yes/no `noul`, single-choice `choice`, 0–3 `score` rubrics). The UI maps each answer to **green / red / needs a human** using confidence thresholds, and shows end-to-end latency plus billed token cost. A bundled eval compares the same checks through Decisions vs a generative Gemini Flash structured-JSON call against fixture ground truth.

No API key is available in this environment. Default `DECISIONS_MODE=mock` (or auto-mock when `GEMINI_API_KEY` is unset) returns realistic shaped responses and labels the UI **MOCK**. The real REST client is implemented per the docs and selected automatically when a key is present. Live eval results are not fabricated.

## Out of scope
- Real Gemini calls from this environment (no key; do not obtain one)
- Production Lumin Sign auth, envelopes, or send
- Multi-user, persistence, deploy
- WebMCP / in-browser agent panel
- Video/audio inputs (PDF + optional text only)
- Committing secrets or presenting mock metrics as live eval

## Stack
- Runtime/tooling: Bun preferred (`bun install && bun run dev`); eval also runs with Node (`npm run eval`) and `GEMINI_API_KEY` only
- UI/framework: Vite + TypeScript (vanilla DOM)
- Server: tiny Node HTTP proxy so the key never reaches the browser
- Key libraries: `pdf-lib` (synthetic fixtures), Vite; Decisions/generative clients are direct REST (`v1beta`), not a required SDK

## Manual testing / README
What `apps/gemini-decisions-preflight/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open `http://localhost:5173/`
- MOCK banner is visible without a key; pick MSA/NDA fixtures (clean vs planted), run preflight, inspect green/red/human, latency, cost
- Upload a bundled PDF; Send is demo-only
- Eval: `npm run eval` (or `bun run eval`) writes `results/mock/` when mocked; live writes `results/` when `GEMINI_API_KEY` is set
- Bundled media and `results/mock/` are from mock mode until the owner runs the real eval
- Pass/fail checklist for mock vs live selection, fixture ground truth, and eval outputs

## Acceptance criteria
- [ ] `cd apps/gemini-decisions-preflight && bun install && bun run dev` works
- [ ] `apps/gemini-decisions-preflight/README.md` has run steps and a manual test checklist
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] `PLAN.md` and `HOW_IT_WORKS.md` present
- [ ] Real Decisions client matches docs: `POST /v1beta/decisions`, model `gemini-decision-1`, `input` content blocks, `questions` map with `noul` | `choice` | `score`, response `answers` + `usage` (`total_output_tokens` always 0)
- [ ] Mock adapter behind `DECISIONS_MODE` / missing key; UI labeled MOCK; live selected when `GEMINI_API_KEY` is set
- [ ] ~40 checks in one call; UI traffic-lights by confidence; latency and cost shown
- [ ] Four synthetic PDFs (MSA/NDA × clean/planted) with ground-truth JSON; no customer data
- [ ] `npm run eval` runs Decisions + generative Flash, writes JSON + `SUMMARY.md` (accuracy, precision/recall on planted issues, p50/p95 latency, cost). Mock writes `results/mock/` only
- [ ] `.env.example` placeholder only; no secrets
- [ ] `tracking/seen-bookmarks.json` marks this pick built

## Validation (PR)
- Screenshot: Preflight results on a planted MSA with MOCK badge, mixed green/red/human rows, latency and cost
- Video: Open app → select clean NDA (mostly green) → switch to planted MSA → run → expand a check (probabilities) → note MOCK + latency/cost
- README: Confirm run, mock/live, eval command, and that bundled media/results are mock until the real eval lands
