# Impeccable detector-first e-sign polish

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (item #10, Top 10 OpenCode Skill Repos)
- Upstream: https://github.com/pbakaus/impeccable (Apache-2.0; CLI `npx impeccable detect`)
- Slug: `impeccable-esign-polish`

## Goal (single-user MVP)
In under two minutes a reviewer opens a **Lumin Sign signer review-and-sign fixture** (MSA countersign) that is visibly full of AI-slop tells. They **run the detector** (real `npx impeccable detect --json` when the engine binary works offline; otherwise a labeled fixture of the same findings plus a script to re-run the real CLI). A findings panel lists each hit with detector id, severity, element/line, and why it matters on a legal/e-sign surface. Clicking a finding highlights the element and **applies its fix** (the change `/impeccable` would make). The page updates live, that finding clears, and the running count drops toward zero. A small command-vocabulary strip maps the 24 `/impeccable` commands to the findings they address. **No LLM keys.**

This is **not** a before/after restyle showcase. The detector, findings, and fix loop are the product.

## Out of scope
- Real Lumin Sign APIs, envelopes, or signing
- Live `/impeccable` harness / browser-iteration server
- LLM critique, `/impeccable craft`, or any model call
- Shipping all 59 detectors as interactive fixes (fixture bakes a representative, source-detectable subset)
- Auth, multi-user, persistence, production deploy
- Side-by-side pretty restyle as the hero

## Stack
- Runtime/tooling: Bun (`bun install && bun run dev`)
- UI/framework: Vite + TypeScript (vanilla DOM)
- Key libraries: Vite only. Detector IDs/commands copied from pbakaus/impeccable v4.5.2 (`npx impeccable detect`, 24 commands, 59 deterministic rules). Optional local `impeccable` CLI for the re-run script.

## Manual testing / README
What `apps/impeccable-esign-polish/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open the Vite URL (default `http://localhost:5173/`)
- Click **Run detector** → findings appear with real Impeccable rule ids
- Click several findings → apply fix → fixture updates, finding clears, count drops
- Open the command-vocabulary reference and confirm mappings
- Optional: `bun run detect` to invoke the real CLI (or see the labeled fixture fallback)
- No WebMCP flags; no Agent panel / LLM
- Pass/fail checklist for detect → highlight → fix → count → reset

## Acceptance criteria
- [ ] `cd apps/impeccable-esign-polish && bun install && bun run dev` works
- [ ] `apps/impeccable-esign-polish/README.md` has run steps + manual test checklist
- [ ] `apps/impeccable-esign-polish/HOW_IT_WORKS.md` explains deterministic detectors vs LLM critique, the detect → findings → fix loop, and how the demo maps (with mermaid)
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app (run detector, walk findings, apply fixes, count drops)
- [ ] Fixture is a Lumin Sign MSA countersign review-and-sign page with baked-in AI-slop issues
- [ ] Findings use real Impeccable detector ids (e.g. `overused-font`, `gradient-text`, `side-tab`, `gray-on-color`)
- [ ] Detector source is labeled: live CLI output **or** fixture of CLI-shaped findings
- [ ] Apply-fix updates the page live and clears that finding; count decreases
- [ ] Command vocabulary shows which of the 24 commands map to which findings
- [ ] No LLM API keys required
- [ ] Tracking entry added under both `proposed` and `built` in the same PR

## Validation (PR)
- Screenshot: Detector panel open with findings listed, fixture visible, count > 0
- Video: Run detector → inspect 3+ findings (id, severity, e-sign why) → apply fixes → count drops → reset
- README: Run steps + manual test notes match the checklist above
