# Jev keystroke launcher

Lumin-flavored command palette that re-ranks workspace items by **intent** on every keystroke. Inspired by [Nader Dabit’s TypeSafe Jev keystroke-oracle experiment](https://x.com/dabit3/status/2100756930054504776) and the [TypeSafe Jev Decision API](https://www.jevtypesafeai.com/how-to-use) (`choice` / `score` / `noul`).

Classic demo line: type **the pdf I just downloaded** and the newest PDF is already #1.

This demo always ships a **deterministic fixture ranker**. Live Jev is optional and server-side only.

## Run

```bash
cd apps/jev-keystroke-launcher
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/). No API key required.

There is no WebMCP flag and no in-page Agent panel. Ranking happens through `/api/rank` on the Vite dev server.

### Optional live Jev

Copy `.env.example` to `.env` and set `JEV_API_KEY` (a TypeSafe / hosted Jev key). Restart `bun run dev`. The badge should switch from **Fixture mode** to **Live Jev**.

- The key is read only in the Vite server plugin (`process.env.JEV_API_KEY`).
- Do **not** use a `VITE_` prefix. Do **not** commit `.env` or paste a key into the README.
- If the live call fails, the demo falls back to fixture ranking and shows an error line.

## What to click / try

1. The palette is always visible. `Cmd+K` / `Ctrl+K` focuses the search box.
2. Click the preset chips (or type them):
   - `the pdf I just downloaded` → **Q3 Board Deck.pdf** at #1 (newest `downloaded_at`)
   - `waiting on legal to sign` → **Acme MSA — countersign** (waiting + legal party)
   - `MSA countersign` → the signature request, not the executed PDF or the template
   - `expired signature requests` → expired DPA / partner addendum first
3. Watch the ranked list and the short “why this ranked” line under each title.
4. Use `↑` / `↓` then `Enter` to open the detail pane. **Open** is a mock — no real file.
5. Confirm the badge: **Fixture mode** without a key.

`bun test` (from this folder) checks the four fixture intent queries.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/` without any env vars
- [ ] Badge reads **Fixture mode**
- [ ] Chip **the pdf I just downloaded** puts `Q3 Board Deck.pdf` at #1
- [ ] Chip **waiting on legal to sign** puts `Acme MSA — countersign` at #1
- [ ] Chip **MSA countersign** does not crown the executed MSA PDF or the MSA template
- [ ] Chip **expired signature requests** lists the two expired signature requests first
- [ ] Typing re-ranks after a short debounce (~100ms); latency chip updates
- [ ] Match tokens in titles are highlighted
- [ ] `↑` / `↓` / `Enter` selects a row and shows the detail pane
- [ ] **Open** shows a mock toast, not a real file
- [ ] Optional: with a local `JEV_API_KEY` only, badge reads **Live Jev** (never commit the key)
