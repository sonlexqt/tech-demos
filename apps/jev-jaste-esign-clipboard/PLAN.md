# Jaste-inspired e-sign smart clipboard

## Source
- Bookmark: https://x.com/marcus_lowe/status/2101476399488160013
- Tracking id: `2101476399488160013`
- Slug: `jev-jaste-esign-clipboard`
- Real product: Marcus Lowe’s **Jaste** (beta) — OS-level TypeSafe Jev smart copy/paste. This playground is **not** Jaste.

## Goal (single-user MVP)
In under two minutes, a reviewer pastes messy clipboard text into a mock **Lumin Sign** document workspace, clicks **Classify**, and sees TypeSafe-shaped **Choice + Score** proposals (signer chip, company, address, notice email, clause) with confidence. **Apply** fills the matching fields. With no API key the path is a deterministic fixture; with a server-side key the same question body goes to TypeSafe System One (or Vercel’s TypeSafe-compatible gateway). A **Live Jev** / **Fixture** badge shows which path ran.

## Out of scope
- The real Jaste OS clipboard / global paste hook
- Production e-sign, auth, persistence, or sending envelopes
- Client-side keys (`VITE_*`) or committed secrets
- WebMCP / in-browser LLM agent
- Multi-user, deploy, or a real Lumin Sign integration

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + React + TypeScript
- Key libraries: React 19, Vite, `@vitejs/plugin-react`
- Jev: raw `fetch` to documented System One HTTP (`POST /v1/systemone`), not an invented chat endpoint

## Decision API (investigated, not invented)
Official contract: [TypeSafe HTTP API](https://docs.typesafe.ai/api.md) — `POST https://api.typesafe.ai/v1/systemone` with `model: "jev-latest"`, `state`, and typed `questions` (`choice`, `score`, `noul`). Choice returns `{ choice, probabilities, confidence }`; Score returns `{ score, legend, probabilities, confidence }`.

Documented composition:
- [Pre-parsed value extraction](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md) — code finds candidate spans; Choice picks among them (plus `none`).
- [Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out.md) — one request asks intent + fit + target picks; code keeps the relevant answers.

Server-side key resolution (first non-empty wins):
1. `JEV_API_KEY` → TypeSafe `POST /v1/systemone`, model `jev-latest`
2. `JEV_AI_GATEWAY_API_KEY` then `AI_GATEWAY_API_KEY` → `https://ai-gateway.vercel.sh/typesafe/v1/systemone`, model `typesafe-ai/jev`

No `VITE_` prefix. Vite middleware only; the browser never sees the key.

Classify questions (one round trip):
- `intent` **Choice** — `signer_list` | `address_block` | `email_field` | `clause` | `mixed` | `junk`
- `paste_fit` **Score** — ordered rubric from unrelated junk → ready to apply
- Speculative **Choice** heads over pre-parsed candidates (`signer_email`, `notice_email`, `company_span`, `address_span`, `clause_span`) when candidates exist

## Manual testing / README
What `apps/jev-jaste-esign-clipboard/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) and open `http://localhost:5173/`
- This playground vs real Jaste (Marcus Lowe / TypeSafe Jev OS copy-paste)
- Fixture path: badge **Fixture**, load 3–5 presets, Classify → proposals → Apply fills workspace
- Optional live Jev: `.env` with `JEV_API_KEY=` (or gateway keys), badge **Live Jev**
- No WebMCP / Agent panel
- Pass/fail checklist for presets, classify/propose/apply, and env notes

## Acceptance criteria
- [ ] `cd apps/jev-jaste-esign-clipboard && bun install && bun run dev` works
- [ ] `apps/jev-jaste-esign-clipboard/README.md` has run steps + manual test checklist
- [ ] `PLAN.md` and `.env.example` (`JEV_API_KEY=`) present
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] Mock Lumin Sign workspace + smart-clipboard pane
- [ ] 3–5 one-click messy clipboard presets
- [ ] Classify → propose (targets + confidence) → Apply fills fields
- [ ] No key → deterministic fixture; badge **Fixture**
- [ ] Key present → server-side System One; badge **Live Jev**
- [ ] Tracking proposed + built for `2101476399488160013`; existing webmcp / auth.md entries kept
- [ ] No unrelated `apps/*` or scaffold churn

## Validation (PR)
- Screenshot: Workspace after apply, proposals with confidence, Live/Fixture badge
- Video: Open app → Fixture badge → load signer preset → Classify → Apply → load mixed junk → Classify → Apply remaining targets
- README: Run steps + fixture/live checklist + pointer to real Jaste / Marcus Lowe post
