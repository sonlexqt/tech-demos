# Univer quote-to-sign

Fake **Lumin Sign** envelope: a fictional MSA with a live [Univer](https://github.com/dream-num/univer) pricing sheet (Apache-2.0 OSS only), an agent panel that edits cells through the Facade API, an audit log, and a sign/verify path that freezes a workbook snapshot, renders a PDF with **pdf-lib** (not Univer’s commercial PDF export), and SHA-256-binds snapshot + PDF.

## Run

```bash
cd apps/univer-quote-to-sign
bun install
bun run dev
```

Open `http://localhost:5173/`.

```bash
bun test          # formula / agent / hash / tamper tests
bun run build     # static dist/ (Cloudflare Pages-friendly, base: ./)
```

No API keys are required. Mock agent is the default.

Optional Gemini tool-calling: copy `.env.example` to `.env`, set `GEMINI_API_KEY`, restart `bun run dev`. Optional `GEMINI_MODEL` (default `gemini-2.5-flash`). The key stays on the Vite dev server (`/api/gemini`) and is never committed.

## Manual test checklist

1. **Envelope** — Contract sections render; Exhibit A shows a Univer sheet with 25 seats, 1-year term, add-ons `0`. HUD total ≈ **$2,929.50**.
2. **Signer edit** — Change **B6** (seats) to `30`. Discount stays 10%; total updates. Locked cells (prices, formulas, TOTAL) reject edits.
3. **Agent** — Run `make it 40 seats, 2-year term`. Seats=40, term=2, total ≈ **$9,374.40**. Audit log shows `agent` and the cell diffs.
4. **Undo** — Click **Undo last** (or type `undo`). Values return to the previous seats/term. That undo is the same Univer command stack as a human Ctrl/Cmd+Z.
5. **Sign** — **Sign** freezes the sheet *before* snapshot/PDF capture (edits and undo are blocked), shows snapshot + content-PDF + signed-PDF + binding SHA-256, and a signed PDF (contract, Exhibit A numbers, audit-trail page).
6. **Verify** — **Verify (reload snapshot)** → PASS (“what you signed = what you saw”).
7. **Tamper** — **Tamper seats in snapshot** → FAIL (binding hash mismatch).

## Notes

- Univer packages are OSS **1.5.x** (`@univerjs/presets`, `@univerjs/preset-sheets-core`, headless `@univerjs/sheets` + formula engine). No Office import/export, no Univer PDF export, no Server SDK, no AI SDK.
- See `HOW_IT_WORKS.md` for architecture, the OSS/commercial split, and the freeze/hash pipeline.
- Demo capture: `media/envelope-pricing.png` and `media/quote-to-sign-full-flow.mp4` (signer edit → agent `40 seats, 2-year term` → undo → sign → verify pass → tamper fail).
- This is a fixture. It is not Lumin, not a production e-sign product, and not legal advice.
