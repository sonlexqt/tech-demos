# Lumin Sign · AG-UI envelope prep

Self-contained demo of the [AG-UI protocol](https://github.com/ag-ui-protocol/ag-ui) (MIT): an agent prepares a signing envelope while the UI shares state over JSON Patch and pauses on an **interrupt that carries a response schema**.

Scenario: *“Prepare this envelope for me.”* A synthetic 6-page MSA (no real customer data) is rendered with PDF.js. Click **Prepare envelope**. Field boxes appear live. Drag one to correct it. Approve the interrupt form. The run log scores the agent against committed ground truth.

Nothing is actually sent for signature.

## Run

```bash
cd apps/agui-envelope-prep
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/). The Vite app proxies `/agui` and `/api` to the Hono server on port `8787`.

### Mock vs live

| Mode | How | Needs `GEMINI_API_KEY`? |
| --- | --- | --- |
| **MOCK** (default) | Scripted event sequence, including two deliberate mistakes | No |
| **LIVE** | Gemini Flash places fields from pdf.js text items | Yes |

```bash
# optional live
export GEMINI_API_KEY=...
export GEMINI_MODEL=gemini-3.5-flash          # default
export GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
AGUI_MODE=live bun run dev
```

CI and screenshots always use MOCK. The server never requires a key.

Copy `.env.example` if you want a local file; `.env` is gitignored.

## What to click / try

1. Leave mode on **MOCK**.
2. Click **Prepare envelope**.
3. Watch the agent narrate, emit `place_field` tool calls, and paint boxes as `STATE_DELTA` patches arrive. Jordan Hale’s **date** is offset; Priya Shah’s **initials** land on page 5 (wrong).
4. When the interrupt form appears, drag Priya’s initials onto the signature page (page 6) and/or resize a box. Delete is available on hover.
5. Confirm recipients + signing order. The two lowest-confidence fields are listed from the interrupt `responseSchema`.
6. **Approve & finish**. The agent acknowledges your edits and shows a ready-to-send summary (demo only).
7. Read the **Run log**: event timeline, page+IoU vs ground truth, human corrections, duration.

Live mode (if you have a key): switch the dropdown to LIVE and repeat. Placements will vary; the interrupt + correction loop is the same.

## Manual test checklist

- [ ] `bun install && bun run dev` serves the UI at `http://localhost:5173/`
- [ ] Sample MSA (`public/fixture-msa.pdf`) renders all 6 pages
- [ ] MOCK prepare streams narration + field boxes without an API key
- [ ] At least one box is clearly wrong / low-confidence (date offset, initials on page 5)
- [ ] Drag / resize / delete updates the overlay
- [ ] Interrupt form is built from the event’s `responseSchema` (not a hardcoded HTML-only form)
- [ ] Approve yields a ready-to-send summary and **does not** call any send API
- [ ] Run log shows timeline, GT scoring, human corrections, elapsed time
- [ ] LIVE option explains that it needs `GEMINI_API_KEY` when the key is absent
- [ ] `bun test` passes
- [ ] `bun run eval:mock` writes `results/mock/live.json` + `results/mock/SUMMARY.md`

## Eval

Live (you run this; this environment has no key):

```bash
cd apps/agui-envelope-prep
export GEMINI_API_KEY=...
# optional:
# export GEMINI_MODEL=gemini-3.5-flash
# export GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
bun run eval
```

Writes `results/live.json` and `results/SUMMARY.md` (placement accuracy vs ground truth, per-type precision/recall, low-confidence calibration, latency, token/cost estimate).

Mock (what CI and this PR commit):

```bash
bun run eval:mock
```

## Tests & CI

```bash
bun test
bun run typecheck
bun run build
```

GitHub Actions: `.github/workflows/agui-envelope-prep.yml` (plain `ubuntu-latest`, no Blacksmith, no secrets).

## Notes

- Protocol explainer: [HOW_IT_WORKS.md](./HOW_IT_WORKS.md)
- Plan: [PLAN.md](./PLAN.md)
- Ground truth: [fixture/ground-truth.json](./fixture/ground-truth.json)
- Media (MOCK walkthrough): [media/prepare-envelope.png](./media/prepare-envelope.png), [media/run-log.png](./media/run-log.png), [media/prepare-envelope.mp4](./media/prepare-envelope.mp4)
