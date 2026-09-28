# Jev keystroke launcher (Superpowers twin)

Lumin-flavored command palette that re-ranks a 16-item workspace catalog by **intent** as you type. Classic check: **the pdf I just downloaded** puts `Q3 Board Deck.pdf` first.

This is a **quality twin** of [PR #9](https://github.com/sonlexqt/tech-demos/pull/9) (`apps/jev-keystroke-launcher/`). It was rebuilt independently — do not treat the two trees as copies.

**Built with obra/superpowers:** `@using-superpowers` → brainstorming → writing-plans → TDD → executing-plans.

- Spec: `docs/superpowers/specs/2026-09-28-jev-keystroke-launcher-design.md`
- Plan: `docs/superpowers/plans/2026-09-28-jev-keystroke-launcher.md`

The source bookmark ([Nader Dabit, keystroke oracle](https://x.com/dabit3/status/2100756930054504776)) is already recorded by PR #9. This app does **not** add that URL again to `tracking/seen-bookmarks.json`.

## Run

```bash
cd apps/jev-keystroke-launcher-superpowers
bun install && bun run dev
```

Open http://localhost:5173/. No API key required.

```bash
bun test
```

## What to try

- Palette is always visible. `Cmd/Ctrl+K` focuses search.
- Badge should read **Fixture mode** unless a local `JEV_API_KEY` is set (server-only; never `VITE_`, never committed).
- Click each preset chip. Expected #1:

  | Chip | #1 title |
  | --- | --- |
  | the pdf I just downloaded | Q3 Board Deck.pdf |
  | waiting on legal to sign | SOW — Contoso |
  | MSA countersign | MSA — Northwind |
  | expired signature requests | NDA — Expired countersign |

- Type `the pdf I just downloaded` yourself. After ~100ms the newest downloaded PDF should rise to #1 with a “downloaded most recently” hint.
- `↑` / `↓` / `Enter` moves the highlight and opens the mock detail pane. **Open** shows `Opened in mock viewer (no file)` — no real file is opened.

## Optional live Jev

Copy `.env.example` and set `JEV_API_KEY` in the Vite **server** environment (not a `VITE_` variable). The proxy calls TypeSafe `POST https://api.typesafe.ai/v1/systemone`. If Jev is unreachable, ranking falls back to the fixture ranker and a note appears; the badge stays **Live Jev**.

## Manual test checklist

- [ ] `bun install && bun run dev` serves http://localhost:5173/
- [ ] Badge is **Fixture mode** with no key
- [ ] Chip “the pdf I just downloaded” → Q3 Board Deck.pdf is #1; detail matches
- [ ] Other three chips re-rank as in the table
- [ ] Typing the classic phrase re-ranks after debounce
- [ ] Keyboard highlight + Enter updates the detail pane
- [ ] Open is mock only
- [ ] `bun test` passes (fixture ranker + helpers)
