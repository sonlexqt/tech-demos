# Jaste-inspired SignatureRequestDTO clipboard

## Source
- Bookmark: https://x.com/marcus_lowe/status/2101476399488160013
- Tracking id: `2101476399488160013`
- Slug: `jev-jaste-esign-clipboard`
- Real product: Marcus Lowe’s **Jaste** (beta) — OS-level TypeSafe Jev smart copy/paste. This playground is **not** Jaste.
- Lumin API: [Send Signature Request](https://developers.luminpdf.com/tabs/api-reference/api/signature-requests/send-signature-request) — `POST /v1/signature_request/send`, schema `SignatureRequestDTO`

## Goal (single-user MVP)
An ops/legal coordinator pastes messy Slack/email dumps while preparing an **MSA countersign**. Classify → propose → apply fills a `SignatureRequestDTO` (title, ordered `signers[]` with `group`, `viewers[]`, `expires_at` ms, `signing_type`, `custom_email`, `use_text_tags`, fixed `file_url`). A live **Outgoing JSON preview** shows the body that would be POSTed. Fixture when no key; Live Jev when a server-side key is set. This playground **shapes** the payload and never calls `api.luminpdf.com`.

## Scenario
- Title: `Acme Robotics — Master Services Agreement (FY26)`
- `signing_type: ORDER` — counsel `group: 1`, customer `group: 2`, internal VP `group: 3`
- One viewer (deal desk / finance)
- `expires_at` ~30 days or “end of October” (unix epoch **milliseconds**)
- `custom_email.subject_name` / `title` when the thread mentions them
- Sample public `file_url` (no upload)

## Out of scope
- Calling production `api.luminpdf.com`
- Real Jaste OS clipboard
- Invented fields (company, notice address, clause) that are **not** on `SignatureRequestDTO`
- Client-side keys (`VITE_*`), WebMCP, multi-user, deploy

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + React + TypeScript
- Jev: raw `fetch` to documented `POST https://api.typesafe.ai/v1/systemone`

## Decision API
Same key order as before (`JEV_API_KEY` → `JEV_AI_GATEWAY_API_KEY` → `AI_GATEWAY_API_KEY`). Code pre-parses people, titles, expiry hints; Choice/Score classify intent and pick spans ([extraction cookbook](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md), [fan-out](https://docs.typesafe.ai/patterns/fan-out.md)).

Classify questions:
- `intent` **Choice** — `signer_list` | `request_meta` | `viewer_list` | `mixed` | `junk`
- `paste_fit` **Score** — junk → ready to apply onto the DTO
- Speculative Choice heads: signer/viewer emails, title, expiry, signing type, email subject

Optional `signers[].verification` (`method: vc`) only when paste mentions ID/VC; README notes Digital Trust license.

## Manual testing / README
- `bun install && bun run dev` → http://localhost:5173/
- Link Send Signature Request docs + Jaste disclaimer
- Fixture presets: ordered signers, thread meta, mixed junk, viewer-only
- Apply updates editor **and** outgoing JSON
- Optional live Jev via `.env`

## Acceptance criteria
- [ ] Bun-runnable; PLAN + README + `.env.example`
- [ ] Workspace fields are `SignatureRequestDTO` properties (no fake clause/address)
- [ ] JSON preview matches the DTO that would be POSTed
- [ ] 4 messy presets for the MSA ordered-sign story
- [ ] Fixture + Live Jev badge; no production API call
- [ ] Screenshot + video on PR #8

## Validation (PR)
- Screenshot: editor + JSON preview after applies, Fixture badge
- Video: signer-order preset → classify → apply → thread meta → apply → viewer → apply → JSON shows ORDER groups
- README: MSA scenario + API docs URL
