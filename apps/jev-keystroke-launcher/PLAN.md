# Jev keystroke launcher

## Source
- Bookmark: https://x.com/dabit3/status/2100756930054504776
- Slug: `jev-keystroke-launcher`
- Context: Nader Dabit / TypeSafe Jev “keystroke oracle” — rank a launcher by *intent* in ~100ms, not alias/fuzzy match. Classic line: type “the pdf I just downloaded” and the newest PDF is already #1.

## Goal (single-user MVP)
Open a Lumin-flavored workspace command palette, type (or click a preset chip), and watch the catalog re-rank on each keystroke. Fixture mode proves the intent story without a key; optional live Jev Choice scoring (server-side `JEV_API_KEY` only) re-ranks the same catalog. Keyboard ↑/↓/Enter opens a mock detail pane. Under two minutes a reviewer can hit the four preset queries and see the right item on top.

## Out of scope
- Real Lumin product APIs, file open, or e-sign send
- Baking or committing any API key
- Production auth, deploy, multi-user
- WebMCP / in-browser agent panel
- Full Raycast/Spotlight feature parity

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + React + TypeScript
- Key libraries: React, Vite (`@vitejs/plugin-react`)
- Ranking: deterministic fixture scorer always; live TypeSafe Jev `choice` via a Vite server plugin when `JEV_API_KEY` is set (never `VITE_*`)

## Manual testing / README
What `apps/jev-keystroke-launcher/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open `http://localhost:5173/`
- Palette is always visible; Cmd/Ctrl+K focuses search
- Click preset chips: “the pdf I just downloaded”, “waiting on legal to sign”, “MSA countersign”, “expired signature requests”
- Expected #1 results for each chip (fixture mode)
- Badge reads **Fixture mode** without a key; **Live Jev** only if `JEV_API_KEY` is set locally
- Keyboard ↑/↓/Enter opens the detail pane (mock — no real file)
- Optional live scoring: copy `.env.example` → `.env`, set `JEV_API_KEY` (do not commit)

## Acceptance criteria
- [ ] `cd apps/jev-keystroke-launcher && bun install && bun run dev` works without a key
- [ ] `apps/jev-keystroke-launcher/README.md` has run steps + a manual test checklist
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app
- [ ] Catalog has ~12–20 Lumin workspace items (PDFs with dates, docs, signature requests, folders/templates)
- [ ] Keystrokes debounce ~80–120ms and re-rank the list
- [ ] Fixture path: “the pdf I just downloaded” puts the newest downloaded PDF at #1
- [ ] Preset chips cover waiting-on-legal, MSA countersign, and expired signature requests
- [ ] Mode badge distinguishes fixture vs live Jev
- [ ] No API key in the client bundle, committed files, README, or artifacts
- [ ] `tracking/seen-bookmarks.json` records this bookmark without wiping prior entries

## Validation (PR)
- Screenshot: Palette open, an intent query typed, ranked results with the expected #1 and the mode badge visible
- Video: Open app → click “the pdf I just downloaded” → show newest PDF #1 → try a second chip → arrow/Enter into the detail pane
- README: Run steps + checklist match the criteria above
