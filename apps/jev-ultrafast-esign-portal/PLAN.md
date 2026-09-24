# Jev Ultrafast e-sign portal playground

## Source
- Bookmark: https://x.com/Pluvio9yte/status/2101831273224311035 (Jev list item #1; same tweet as json-render)
- Library: https://github.com/browser-use/jev-ultrafast (~19k★)
- TypeSafe Jev: https://docs.typesafe.ai/introduction · speculative fan-out https://docs.typesafe.ai/patterns/fan-out
- Slug: `jev-ultrafast-esign-portal`
- Tracking id: `2101831273224311035-jev-ultrafast` (distinct from json-render-esign-board / PR #6)

## Goal (single-user MVP)
A mock **Lumen Sign** requester portal (start request → add signers → place fields → review → send) plus a Jev-style inspector. Each step, the decision loop chooses among `CLICK` / `TYPE_TEXT` / `SELECT` / `WAIT` / `DONE` and a numbered element index — one TypeSafe-shaped round trip, same speculative heads as upstream `choose()` (`operation` + `click_target` / `type_text_target` / `select_target`). With no API key, a deterministic fixture walks the wizard to **sent**. With a server-side key, the same request body goes to TypeSafe System One (or Vercel AI Gateway's TypeSafe-compatible path). This is a playground of the decision loop, not a Chrome Browser Harness.

## Out of scope
- Real Chrome / [Browser Harness](https://github.com/browser-use/browser-harness) / CDP
- Full `jev-ultrafast` snapshot.js occlusion / freshness guards
- Production e-sign, auth, persistence, email delivery
- `SCROLL_*` / `BLOCKED` (upstream has them; this MVP uses the five operations in the approved pick)
- Client-side API keys (`VITE_*`) or committed secrets
- Multi-user, deploy, WebMCP

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + React + TypeScript
- Key libraries: React 19, Vite 8, `@vitejs/plugin-react` — no TypeSafe SDK (raw `fetch` matching `jev_ultrafast/model.py`)

## Decision API (investigated, not invented)
Upstream `jev_ultrafast/model.py` posts to `https://api.typesafe.ai/v1/systemone` with `model: jev-latest` (or `TYPESAFE_MODEL`), `state: { page, elements, recent_actions }`, and speculative `choice` questions. Answers are `{ choice, probabilities, confidence }`. `TYPE_TEXT` values come from an optional OpenAI-compatible helper (`TEXT_MODEL_*`); this demo also infers field text from the goal when that helper is unset.

Server-side key resolution (first non-empty wins):
1. `JEV_API_KEY` → TypeSafe `POST /v1/systemone`, model `jev-latest`
2. `JEV_AI_GATEWAY_API_KEY` then `AI_GATEWAY_API_KEY` → `https://ai-gateway.vercel.sh/typesafe/v1/systemone`, model `typesafe-ai/jev`

No `VITE_` prefix. Vite middleware only; the browser never sees the key.

## Manual testing / README
What `apps/jev-ultrafast-esign-portal/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) and open `http://localhost:5173/`
- This playground vs the real Chrome harness (`uv run jev` in browser-use/jev-ultrafast)
- Fixture path: badge **Fixture**, Run automatically, watch numbered table + inspector through send
- Optional live Jev: `.env` with `JEV_API_KEY=` (or gateway keys), badge **Live Jev**
- No WebMCP; the inspector *is* the agent panel
- Pass/fail checklist for fixture walk, element table, ops, and env notes

## Acceptance criteria
- [ ] `cd apps/jev-ultrafast-esign-portal && bun install && bun run dev` works
- [ ] `apps/jev-ultrafast-esign-portal/README.md` has run steps + manual test checklist
- [ ] `apps/jev-ultrafast-esign-portal/PLAN.md` and `.env.example` (`JEV_API_KEY=`) present
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] Numbered interactive elements appear on the portal and in an element table
- [ ] Inspector shows action probabilities, chosen action, and executed steps
- [ ] Fixture (no key) streams a deterministic sequence to **sent**; badge **Fixture**
- [ ] Live path is server-side only when a key is set; badge **Live Jev**
- [ ] Tracking: proposed + built entry with distinct id; notes distinguish json-render / PR #6
- [ ] No unrelated `apps/*` or scaffold churn

## Validation (PR)
- Screenshot: Portal mid-flow (or sent) with numbered badges, element table, inspector probs, Live/Fixture badge
- Video: Open app → confirm Fixture badge → Run automatically → walk start → signers → fields → review → sent → inspector log
- README: Run steps + fixture/live checklist + pointer to real Chrome harness
