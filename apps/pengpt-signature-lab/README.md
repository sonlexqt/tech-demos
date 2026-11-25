# PenGPT Signature Lab

Local research bench: record a draw-to-sign pad, replay PenGPT-generated ink at
pen speed, run a blind real-vs-generated test, and score stroke telemetry.
Goal: see how cheap it is to fake a **drawn** signature, and how little a
forensics scorer can promise — so Lumin Sign can judge pad audit trails against
identity proof (Lumin ID).

**Fixtures only.** No customer signatures. Volunteer stand-ins, not live people.
Generated files have `synthetic: true` and a visible **SYNTHETIC** mark.

## Run

```bash
cd apps/pengpt-signature-lab
bun install
bun run dev
```

Open http://localhost:5173/ (Vite, port 5173). No WebMCP flags. No Agent panel.

Tests (also what CI runs):

```bash
bun test
bun run build
```

## Why there is no Cloudflare Pages (or any) deploy

This app is **local-only**. A public Pages URL would host drawn signatures and
the tooling to replay forgeries. The whole point of the lab is that those
strokes are easy to fake; they must not become a public gallery. There is no
`wrangler.toml`, no Pages workflow, and no production host in this folder.

## Manual test checklist

### Pad
- [ ] Draw with mouse or pen; stats (points, strokes, pen-ups, duration) update.
- [ ] **Undo stroke** and **Clear** work.
- [ ] **Download JSON** is `pengpt-signature-lab/v1` with `{x,y,t,down}`.
- [ ] Load fixture **Alex Rivera · generated** — **SYNTHETIC** appears on the pad.
- [ ] **Replay at pen speed** inks the signature over the recorded duration (not instantly).

### Blind test
- [ ] **Deal a pair** for each of the four volunteers (Alex, Blair, Casey, Devon).
- [ ] Left/right order is shuffled; labels stay **hidden** until you guess.
- [ ] **Replay both at pen speed**, guess **A is real** or **B is real**.
- [ ] Scoreboard increments; refresh the page — counts persist (localStorage).
- [ ] **Export JSON** downloads the scoreboard; **Reset** clears it.

### Forensics
- [ ] Open a real fixture: looks-human score is clearly higher than its generated pair.
- [ ] **Classifier report on fixtures** runs on all eight files and shows accuracy.
- [ ] The red callout still says what the scorer **cannot** detect.

### Notes PDF (bonus)
- [ ] Pick a volunteer notes file; pad shows **SYNTHETIC**.
- [ ] **Download annotated PDF** — page is watermarked SYNTHETIC; ink is the generated strokes.

Pass: all of the above without a backend. Fail: missing SYNTHETIC on generated
ink, replay that ignores timestamps, or any deploy config.

## PenGPT generation (optional, laptop)

Shipped fixtures were produced **in this cloud run** with real `hand.npz`
weights (`manifest.json` → `"generatedWithPengpt": true`). To regenerate or
condition on a new sample, see **`generate/README.md`**. Short version:

```bash
python3 generate/generate_strokes.py --text "Alex Rivera" --writer sam --out public/fixtures/custom-alex
```

Photo → style needs the full [pengpt](https://github.com/greydanus/pengpt) clone,
torch, InkSight, and `ANTHROPIC_API_KEY` (see `.env.example`; never commit it).

## Consent

Real volunteers must sign **`CONSENT.md`** before you capture their hand. Do not
commit customer ink.

## Layout

| Path | Role |
| --- | --- |
| `src/lib/pad.ts` | Draw-to-sign capture |
| `src/lib/replay.ts` | Pen-speed replay |
| `src/lib/forensics.ts` | Features + looks-human score |
| `generate/generate_strokes.py` | PenGPT wrapper |
| `public/fixtures/` | Four volunteer pairs + notes |
| `HOW_IT_WORKS.md` | Tokens, style, replay, limits |
