# Jev × OpenCode e-sign tester

Self-contained **Lumin Sign fixture** plus a test-plan runner. Inspired by [Testing apps with TypeSafe Jev & OpenCode](https://x.com/Neriousy/status/2100287208166969746).

This demo shows how Jev **Choice** / **Score** can pick the next UI action or assertion from a small action space. It does **not** embed OpenCode. For the real coding-agent harness, use [Jev in OpenCode](https://jevtypesafeai.com/integrations/opencode) (MCP + `JEV_API_KEY`) and the [TypeSafe Jev docs](https://jevtypesafeai.com/docs).

No production Lumin API.

## Run

```bash
cd apps/jev-opencode-esign-tester
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

Optional tests:

```bash
bun test
```

### Optional live Jev

Without a key the runner stays in **Fixture mode** (deterministic Choice/Score). To try live Jev, set a server-side key — never a `VITE_` prefix, never commit the secret:

```bash
export JEV_API_KEY=jv_live_…
# or copy .env.example to .env
bun run dev
```

The Vite middleware proxies `POST /api/jev/decide`. `jv_live_` keys go to `https://jevtypesafeai.com/api/v1/decide`. The badge should switch to **Live Jev**.

## What to click / try

1. Confirm the badge says **Fixture mode** (unless you set `JEV_API_KEY`).
2. Leave **Happy-path send** selected. Click **Step** a few times (or press <kbd>Enter</kbd> / <kbd>Space</kbd>). The numbered target on the Lumin Sign fixture should highlight; the log should show PASS.
3. Click **Reset** (or <kbd>Esc</kbd>), then **Run** (or <kbd>R</kbd>) to play the full plan. Status should become **Sent**.
4. Switch to **Missing-signer fail**. Run it. Send without a signer should surface the error banner and **Blocked**.
5. Switch to **Decline recovery**. Run it. The form declines, then a later Send recovers to **Sent**.
6. Optionally click the fixture yourself (title, signer, Send/Decline) — it is a real form, not a screenshot.

There is no WebMCP flag and no in-page OpenCode agent. The right panel *is* the Jev-driven runner.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Split layout: Lumin Sign fixture (left) + test plan runner (right)
- [ ] Numbered targets: title, status, signer name/email, note, signature field, Decline, Send, error banner
- [ ] Badge is **Fixture mode** when `JEV_API_KEY` is unset
- [ ] **Happy-path send** Run: all PASS, status Sent, send target highlighted on the send step
- [ ] **Missing-signer fail** Run: error mentions signer, status Blocked, PASS on expect-error + assert blocked
- [ ] **Decline recovery** Run: Declined then Sent
- [ ] **Step** advances one decision; **Reset** clears the form, log, and highlight
- [ ] Keyboard: <kbd>R</kbd> run, <kbd>Enter</kbd>/<kbd>Space</kbd> step, <kbd>Esc</kbd> reset (when focus is not in an input)
- [ ] `bun test` covers fixture chooser + plan runner
- [ ] README still points at OpenCode + TypeSafe Jev for the real harness

## Notes for reviewers

- Fixture Choice always picks the planned action; fixture Score is `3` when the assertion holds and `0` otherwise.
- Live Jev is optional and server-only. A missing or invalid key leaves (or errors out of) the live path — the demo is meant to work without credentials.
- In-memory only: reload or Reset wipes the fixture.
