# Lumin Sign · AG-UI envelope prep

## Source
- Bookmark: https://github.com/ag-ui-protocol/ag-ui (MIT)
- Slug: `agui-envelope-prep`

## Goal (single-user MVP)
Open the app, load a synthetic 6-page MSA, click **Prepare envelope**. An AG-UI agent streams narration, `place_field` tool calls, and envelope JSON via `STATE_SNAPSHOT` + JSON Patch `STATE_DELTA` so signature/initials/date/name boxes appear live on the PDF. The user can drag, resize, or delete a box (edits write back into shared state). Before send, the agent raises an **interrupt with a response schema**; the UI renders that form (recipients, signing order, two lowest-confidence fields). Approve → run finishes with a ready-to-send summary and a run log (timeline, accuracy vs ground truth, human corrections, duration). No real sending.

Default **MOCK** mode is deterministic (includes 1–2 wrong/low-confidence placements). **LIVE** mode uses Gemini when `GEMINI_API_KEY` is set; CI never requires the key.

## Out of scope
- Real e-sign sending, identity, or legally binding signatures
- Multi-user / auth / persistence
- Production Cloudflare deploy (the Hono app is Workers-shaped, not shipped)
- Vision over PDF page images (live mode uses pdf.js text content + positions)
- CopilotKit / LangGraph hosting — this demo speaks AG-UI directly

## Stack
- Runtime/tooling: Bun
- UI: Vite + TypeScript (vanilla DOM) + PDF.js
- Server: Hono (Web `Request`/`Response`, SSE) emitting AG-UI via `@ag-ui/encoder`
- Client protocol: `@ag-ui/client` `HttpAgent` + `@ag-ui/core`
- Shared state patches: `fast-json-patch` (RFC 6902)
- Live LLM: `@google/genai` (`GEMINI_MODEL`, default a current Flash model, fallback + 429/503 backoff)
- Fixture PDF: `pdf-lib` generator committed with ground-truth JSON

## Manual testing / README
`apps/agui-envelope-prep/README.md` must tell a reviewer:
- `bun install && bun run dev`
- Mock vs live (`AGUI_MODE`, `GEMINI_API_KEY`)
- Click Prepare envelope → watch boxes appear → drag one → fill interrupt form → approve
- Run log: events, GT vs agent vs human, time
- `bun run eval` for live (needs key); `bun run eval:mock` for committed mock results
- Pass/fail checklist for the main flow

## Acceptance criteria
- [ ] `cd apps/agui-envelope-prep && bun install && bun run dev` works
- [ ] `README.md` with run steps + manual test checklist; `HOW_IT_WORKS.md` with AG-UI mermaid + trust lesson
- [ ] Official `@ag-ui/*` packages (not a hand-rolled event encoder)
- [ ] Fixture 6-page MSA + ground-truth field placements committed
- [ ] Mock agent streams text, tool calls, snapshot/delta state, interrupt-with-schema
- [ ] Human drag/resize/delete updates shared state; resume acknowledges the edit
- [ ] Approve → ready-to-send summary (no send)
- [ ] Run log: timeline, GT scoring, human corrections, duration
- [ ] Unit tests (patch + scoring) and mock-mode e2e/smoke
- [ ] `bun run eval` live path writes `results/live.json` + `results/SUMMARY.md`; mock results committed under `results/mock/`
- [ ] GitHub Actions CI for this app (no Blacksmith, no API key)
- [ ] Demo PR includes screenshot **and** video under `media/`
- [ ] `tracking/seen-bookmarks.json` marks `ag-ui-protocol/ag-ui` built in the same PR

## Validation (PR)
- Screenshot: PDF with live field boxes, interrupt form, and run log visible
- Video: Prepare envelope → boxes appear → drag a correction → interrupt form → approve → run log
- README: run steps + mock/live + manual checklist match the criteria above
