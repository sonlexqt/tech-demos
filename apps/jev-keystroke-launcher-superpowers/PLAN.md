# Jev keystroke launcher (Superpowers twin)

## Source
- Bookmark: https://x.com/dabit3/status/2100756930054504776 (same idea as [PR #9](https://github.com/sonlexqt/tech-demos/pull/9); this app does **not** re-record that URL in `tracking/`)
- Slug: `jev-keystroke-launcher-superpowers`
- Methodology: obra/superpowers (`using-superpowers` → brainstorming → writing-plans → TDD → executing-plans)
- Spec: `docs/superpowers/specs/2026-09-28-jev-keystroke-launcher-design.md`
- Implementation plan: `docs/superpowers/plans/2026-09-28-jev-keystroke-launcher.md`

## Goal (single-user MVP)
Open a Lumin-flavored command palette, type or click a natural-language workspace query, and watch a 16-item fixture catalog re-rank by **intent** after a 100ms debounce. Classic check: “the pdf I just downloaded” puts `Q3 Board Deck.pdf` first. Keyboard opens a mock detail pane. Works with no API key; live TypeSafe Jev is optional behind a server proxy.

## Out of scope
- Production Lumin APIs or real file open
- Copying or cherry-picking `apps/jev-keystroke-launcher/` / PR #9
- Committing secrets or `VITE_`-prefixed Jev keys
- Editing `tracking/seen-bookmarks.json`
- Deploy, auth, multi-user

## Stack
- Runtime/tooling: Bun (`bun install`, `bun run dev`, `bun test`)
- UI/framework: Vite + React + TypeScript
- Key libraries: React, Vite; no Jev client SDK required (raw `fetch` on the server)

## Manual testing / README
`apps/jev-keystroke-launcher-superpowers/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Palette always visible; Cmd/Ctrl+K focuses search
- Click each preset chip; expected #1 ids
- Type the classic phrase; ↑/↓/Enter; Open is mock
- Badge is **Fixture mode** without a key
- Companion note linking PR #9; Superpowers methodology named
- Optional live Jev via `JEV_API_KEY` (server only)

## Acceptance criteria
- [ ] `cd apps/jev-keystroke-launcher-superpowers && bun install && bun run dev` works
- [ ] `apps/jev-keystroke-launcher-superpowers/README.md` has run steps + manual test checklist
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app
- [ ] `bun test` covers fixture ranker (TDD); classic query → `q3-board-deck` #1
- [ ] Four preset chips re-rank as specified in the spec
- [ ] Mock detail pane; no real file open
- [ ] Fixture vs Live Jev badge; key never `VITE_` or committed
- [ ] Superpowers spec + plan committed under this app
- [ ] Does not modify `apps/jev-keystroke-launcher/` or wipe tracking

## Validation (PR)
- Screenshot: palette after “the pdf I just downloaded” with Q3 Board Deck #1 and Fixture mode badge
- Video: open app → click each chip → type classic phrase → keyboard select → mock Open
- README: run steps + checklist match the criteria above
