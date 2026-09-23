# json-render e-sign ops board

## Source
- Bookmark: https://x.com/Pluvio9yte/status/2101831273224311035
- Slug: `json-render-esign-board`
- Library: Vercel Labs json-render (`@json-render/core` + `@json-render/react`, optionally `@json-render/shadcn`)
- Docs: https://json-render.dev

## Goal (single-user MVP)
A Lumin-style signature-request ops board: the user types (or clicks) a natural-language prompt, and a **catalog-guardrailed** json-render Spec is streamed onto the page. Custom e-sign components — `RequestCard`, `SignerChip`, `StatusBadge`, `RemindButton` — are the only domain vocabulary the generator can emit. Clicking Remind fires the catalog action `remind_signer` (inline log / toast, no email). Default path: offline fixtures + SpecStream (no API key). When `JEV_API_KEY` (or documented Gateway aliases) is set on the **server**, generation uses `experimental_composeSpec` / `experimental_createEvaluator` (`typesafe-ai/jev`) against the same catalog and atomic candidates. The UI badge shows Fixture SpecStream vs Live Jev.

## Out of scope
- Real email, DocuSign/Lumin APIs, or identity
- Auth, multi-user, persistence, deploy
- Unbounded HTML / markdown generation
- Required live Jev (optional server env key only; never `VITE_`)

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + React 19 + TypeScript + Tailwind CSS 4
- Key libraries: `@json-render/core@0.21`, `@json-render/react@0.21`, `@json-render/shadcn@0.21` (Stack / Heading / Card / Button / Text), Zod 4

## Catalog (guardrails)
Custom (required):
- **RequestCard** — title, document name, status, due/expiry hint, children
- **SignerChip** — name, role, optional region, status
- **StatusBadge** — `draft | sent | viewed | declined | completed | void | overdue`
- **RemindButton** — request id + label; emits `press` → action `remind_signer`

Layout primitives from `@json-render/shadcn` (optional helpers, not the star): Stack, Heading, Card, Button, Text.

Seed 8–10 fake signature-request rows as background context the generated Spec can reference.

## Offline generate path
1. Match one of three fixture prompts when the text is close enough, else run a keyword mock that filters seed rows and builds a Spec using **only** catalog types.
2. Validate with `catalog.validate`.
3. Apply via `createSpecStreamCompiler` (one RFC 6902 patch per element) so the board paints progressively.

## Optional live Jev path
1. Vite middleware `GET /api/compose/status` and `POST /api/compose` (server-only).
2. Read `JEV_API_KEY`, else `JEV_AI_GATEWAY_API_KEY`, else `AI_GATEWAY_API_KEY`. Never `VITE_*`.
3. `experimental_createEvaluator({ model: "typesafe-ai/jev", apiKey })` + `experimental_composeSpec` with catalog-constrained candidates built from the seed ledger.
4. Client applies full spec snapshots from the NDJSON stream. Badge: **Live Jev**.
5. If the key is missing, status reports fixture and Generate stays on SpecStream. Never required for `bun run dev`.

## Manual testing / README
`apps/json-render-esign-board/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- What json-render is doing (catalog guardrails + SpecStream)
- Try 2–3 prompts: overdue external-counsel remind, APAC countersign, declined-then-resent this week
- Click Remind → action log, no real email
- Spec JSON peek shows only catalog component types (no raw HTML)
- Optional live Jev env note (`JEV_API_KEY`, no `VITE_` prefix, do not commit keys)

## Acceptance criteria
- [ ] `cd apps/json-render-esign-board && bun install && bun run dev` works
- [ ] `apps/json-render-esign-board/README.md` is present with run steps and a manual test checklist
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app
- [ ] Prompt box + generate/stream + live board + spec peek are visible
- [ ] Custom e-sign catalog components render; Remind fires `remind_signer` safely
- [ ] Offline default (no API key); optional Jev gated on the server and documented
- [ ] UI badge distinguishes Live Jev vs Fixture SpecStream
- [ ] Tracking updated in the same PR for bookmark `2101831273224311035` (and optional skipped `2100679300756435135`)

## Validation (PR)
- Screenshot: generated board after an overdue-counsel prompt, with RequestCards / StatusBadges / Remind visible
- Video: open app → run two prompts → stream in → click Remind → expand spec JSON
- README: run steps + manual test notes match the checklist above
