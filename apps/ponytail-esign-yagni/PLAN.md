# Ponytail · Lumin Sign YAGNI replay

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (item #2, Top 10 OpenCode Skill Repos)
- Upstream: https://github.com/DietrichGebert/ponytail (MIT)
- Slug: `ponytail-esign-yagni`

## Goal (single-user MVP)
In under two minutes a reviewer can replay five **Lumin Sign** feature tickets and see, side by side, what a default coding agent ships versus what **Ponytail** ships. Each ticket highlights the YAGNI-ladder rung Ponytail stopped on, plus line and dependency counts. A Review tab runs a Ponytail-style `/ponytail-review` on an over-built change and lists what to delete. Offline fixtures are the default; an optional env-provided LLM key can regenerate the review. Numbers from the authors’ published 12-task suite are labeled as that suite, not a guarantee.

## Out of scope
- Installing or invoking the real Ponytail plugin inside this page
- Live Claude Code / OpenCode sessions against a real repo
- Production e-sign (certificates, legal signature validity, persistence)
- Auth, multi-user, deploy
- Pairing Caveman as a live skill (call out the split only)
- New npm dependencies in the *Ponytail* ticket outcomes (the Normal side may *depict* extra libs; the demo app itself stays lean)

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (vanilla DOM)
- Key libraries: Vite + TypeScript only. Optional live review uses `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` on the Vite middleware (never committed).

## Tickets (fixtures)

| Ticket | Normal over-build | Ponytail stop | Keep (never cut) |
| --- | --- | --- | --- |
| Signing-date field | Date-picker lib + wrapper | **4 · native** `<input type="date">` | required + not-in-future |
| Signer initials + color | Custom HSV wheel + color lib | **4 · native** initials + `<input type="color">` | required initials, contrast |
| Reminder schedule | Cron builder + scheduler lib | **2 · already in repo** `scheduleReminders` + presets | — |
| CC list | Chip widget + email-validator | **2 · already in repo** `RecipientList` `role="cc"` | email check |
| Expiry countdown | Countdown / moment lib | **3 · stdlib** `Intl.RelativeTimeFormat` | `aria-live` |

Review fixture: an over-built “envelope insights + signing date” diff (factory, moment for one format, unused wheel, one-impl repository). Findings use Ponytail-review tags (`delete`, `stdlib`, `native`, `yagni`, `shrink`).

## Manual testing / README
`apps/ponytail-esign-yagni/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open the Vite URL (default `http://localhost:5173/`)
- Click each of the five tickets; compare Normal vs Ponytail panes, ladder highlight, LOC/deps
- Interact with both live widgets (date, color, reminders, CC, expiry)
- Open Review, run the fixture review, read the delete-list
- Optional: set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in a local `.env` (gitignored) and re-run Review
- No WebMCP flag; no in-page Agent panel
- Link to the real skill: https://github.com/DietrichGebert/ponytail
- Pass/fail checklist for tickets, review, offline default, published-suite disclaimer

## Acceptance criteria
- [ ] `cd apps/ponytail-esign-yagni && bun install && bun run dev` works
- [ ] `apps/ponytail-esign-yagni/README.md` has run steps and a manual test checklist
- [ ] `apps/ponytail-esign-yagni/HOW_IT_WORKS.md` explains the ladder, Normal vs Ponytail paths, and how this demo maps (with mermaid)
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video (several tickets + Review tab)
- [ ] Five Lumin Sign tickets, each with side-by-side Normal vs Ponytail, stop-rung, LOC, dependency counts
- [ ] Review tab lists what to delete on the over-built fixture
- [ ] Offline fixtures work with no API key; optional LLM is env-only and never committed
- [ ] Published ~54% / ~20% / ~27% figures are attributed to the authors’ 12-task suite
- [ ] `tracking/seen-bookmarks.json` adds `2104895659157684597-ponytail` under proposed and built without wiping existing rows

## Validation (PR)
- Screenshot: Ticket 1 (signing-date) with both panes, native date vs picker lib, ladder stopped on **native**, LOC/deps visible
- Video: Open app → walk signing-date, initials/color, reminders (or CC/expiry) → switch to Review → run review → show delete-list + net lines
- README: Confirm run steps + manual test notes match the checklist above
