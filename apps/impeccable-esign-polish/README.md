# Impeccable · Lumin Sign detector

Detector-first demo of [Impeccable](https://github.com/pbakaus/impeccable): 59 deterministic anti-slop rules and 24 `/impeccable` commands, pointed at a **Lumin Sign signer review-and-sign** fixture (MSA countersign). The page is baked with AI-slop tells. The findings panel is the product — not a pretty before/after restyle.

No LLM keys. The scan is `npx impeccable detect --json` when the CLI engine is available, otherwise a labeled capture of that same run.

## Run

```bash
cd apps/impeccable-esign-polish
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

There is no WebMCP flag and no in-page Agent panel. This demo is the detector, the findings list, and the fix loop.

## What to click / try

1. The detector runs on load. Confirm the source line: **Live CLI** (this machine ran `npx impeccable detect`) or **Captured fixture** (bundled JSON from that command).
2. Read a finding: detector id (`overused-font`, `side-tab`, `gray-on-color`, …), severity, element, and why it matters on a legal/e-sign surface.
3. Click a finding — the fixture outlines the matching element.
4. Click **Apply** (the fix, or the `/impeccable` command that would address it). The signer page updates live, that finding moves to Cleared, and **open rules** drops.
5. Repeat for several findings. The 24-command strip highlights which commands still map to open hits.
6. **Reset fixture** restores the slop. **Run detector** scans again.
7. Optional CLI re-run from the app folder:

```bash
bun run detect
```

That writes `fixtures/findings.cli.json` from the real CLI (exit `2` means the scan completed with primary findings — expected on the slop file).

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Fixture is a Lumin Sign MSA countersign review-and-sign page (envelope id, document, Sign / Decline)
- [ ] Findings use real Impeccable ids (`side-tab`, `gradient-text`, `overused-font`, `ai-color-palette`, `marketing-buzzword`, …)
- [ ] Source line labels live CLI vs captured fixture
- [ ] Clicking a finding highlights an element on the fixture
- [ ] Applying a fix updates the page and clears that finding
- [ ] Open-rule count decreases; Reset restores slop and the count
- [ ] Command vocabulary lists all 24 `/impeccable` commands and highlights those mapped to open findings
- [ ] No API keys or model calls required
- [ ] `bun run detect` either refreshes the CLI JSON or fails clearly if `npx` / the engine cannot run

## Notes for reviewers

- Upstream: [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0). CLI: `npx impeccable detect [file|dir|url]` and `npx impeccable detect --json`.
- The live fixture mirrors `fixtures/signer-slop.html`, which is what the CLI scans. Applying a fix updates the on-screen page; it does not rewrite the HTML file. Re-run the CLI to confirm the source fixture still fails until you edit that file.
- Some catalog rules (bounce easing, glassmorphism, icon-tile) are browser-only or need a denser match. This fixture’s list is whatever the source scan actually emitted.
- Concepts: see [HOW_IT_WORKS.md](./HOW_IT_WORKS.md).
