# Ponytail · Lumin Sign YAGNI replay

Side-by-side replay of five **Lumin Sign** feature tickets: what a default coding agent ships versus what [Ponytail](https://github.com/DietrichGebert/ponytail) ships after climbing the YAGNI ladder. Offline fixtures by default.

Ponytail is a skill that makes an agent act like a lazy senior — skip, reuse, stdlib, native — then write the smallest thing that works. Validation, security, and accessibility never get cut. **Caveman** cuts what the agent *says*; **Ponytail** cuts what it *builds*.

Published figures (~54% less code, ~20% lower cost, ~27% faster) are from the authors’ 12-task Claude Code suite (Haiku 4.5, n=4, FastAPI + React). They are not a guarantee for this demo.

## Run

```bash
cd apps/ponytail-esign-yagni
bun install
bun run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

There is no WebMCP flag and no in-page Agent panel. The comparison is fixture-driven.

## What to click / try

1. Stay on **Tickets**. Ticket 01 (signing-date) should show the ladder stopped on **Native**, with a custom calendar on the left and `<input type="date">` on the right.
2. Click a day in the Normal calendar and change the Ponytail date field. Line and dependency counts should sit above the panes.
3. Open **Signer initials + color**. Use the native color input and initials field. The contrast note is intentional (a11y is not cut).
4. Open **Reminder schedule**. The repo shelf should highlight `lib/reminders.ts`. Click **Enable standard reminders**.
5. Open **CC list**. Add `legal@acme.test`. Ponytail reuses `RecipientList role="cc"`; Normal invents chips + a validator package.
6. Open **Expiry countdown**. Normal is a flip-clock; Ponytail is `Intl.RelativeTimeFormat`.
7. Switch to **Review**. Click **Run Ponytail review**. Read the tagged delete-list and `net: -N lines possible`.
8. Confirm the source pill says **offline fixture** unless you set a local API key.

### Optional live review

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Restart `bun run dev`. The Review tab can call the model; if the call fails it falls back to the fixture. **Never commit `.env`.**

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://127.0.0.1:5173/`
- [ ] Five tickets in the rail; each shows Normal vs Ponytail, a highlighted ladder rung, LOC, and dependency counts
- [ ] Signing-date: Normal calendar vs native date; future days disabled / `max` set
- [ ] Initials + color: native `input type="color"`; initials max 4
- [ ] Reminders: Ponytail calls out existing `scheduleReminders` + `REMINDER_PRESETS.standard`
- [ ] CC: adding an email updates both lists; non-emails are ignored
- [ ] Expiry: Ponytail shows a relative “in N days” label
- [ ] Review: Run shows findings tagged `native` / `yagni` / `delete` / `stdlib` and a net-lines line
- [ ] No API key → source stays **offline fixture**
- [ ] Footer links to https://github.com/DietrichGebert/ponytail
- [ ] Published suite table is labeled as the authors’ suite, not a guarantee
- [ ] Banner mentions Caveman (says) vs Ponytail (builds)

## Notes for reviewers

- Real skill: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT). This app does not install the plugin; it replays the ladder.
- Ticket diffs are condensed stand-ins of the over-build shape from the published writeup (date picker / color picker traps), mapped onto Lumin Sign tickets.
- Concepts and mermaid maps: [HOW_IT_WORKS.md](./HOW_IT_WORKS.md).
