# REA e-sign bundle teardown

## Source
- Bookmark: https://github.com/morluto/rea
- Id: `gh-morluto-rea` (GitHub trending)
- Slug: `rea-esign-teardown`
- Library: REA (`rea-agents` npm, MIT) — MCP server + agent skills for reverse-engineering shipped artifacts. This demo uses the **JavaScript application path only** (`analyze-javascript-application`, `inspect-analysis-view`, `trace-application-feature`). No Ghidra, Hopper, or IDA.

## Goal (single-user MVP)
In under two minutes a reviewer can open a local Bun/Vite app and see how our own Lumin Sign–framed signer fixture really works: REA’s evidence-backed report of the minified JS bundle side-by-side with the readable original source, an accuracy ledger of which findings match or miss that source, and a live signature-capture pad rebuilt from those findings. Default mode is offline (committed REA CLI output). Live `rea-agents` re-analysis is optional and env-gated.

## Out of scope
- Native binary analysis (Ghidra / Hopper / IDA) and Android / .NET / firmware / browser-CDP paths
- Targeting any third-party or competitor e-sign product
- Production signing, certificates, identity, legal enforceability
- Multi-user auth, deploy, or a real MCP chat panel
- Committing API keys or requiring a network LLM to view the demo
- Wakaru source recovery (optional later; not required for the JS graph path)

## Stack
- Runtime/tooling: Bun (`bun install && bun run dev`)
- UI/framework: Vite + TypeScript (vanilla DOM)
- Key libraries: `pdf-lib` (fixture PDF write only), `rea-agents` invoked via CLI for capture / optional live re-run
- Fixture: readable TypeScript in `fixtures/signer-src/`, minified with `bun build --minify` into `fixtures/signer-bundle/`

## Manual testing / README
What `apps/rea-esign-teardown/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open the Vite URL and read the REA report vs original source
- Confirm the accuracy ledger marks string/import matches and identifier misses
- Draw on the rebuilt signature pad and export a PNG
- Optional live path: `REA_LIVE=1 bun run capture:rea` (needs Node.js ≥22.19; no keys committed)
- No WebMCP flags; Agent panel N/A
- Pass/fail checklist for the main flow

## Acceptance criteria
- [ ] `cd apps/rea-esign-teardown && bun install && bun run dev` works
- [ ] `apps/rea-esign-teardown/PLAN.md` present before implementation
- [ ] `apps/rea-esign-teardown/README.md` present with run steps and a manual test checklist
- [ ] `apps/rea-esign-teardown/HOW_IT_WORKS.md` explains REA’s JS-bundle MCP/skills path with concepts + mermaid diagrams
- [ ] Own signer fixture source in `fixtures/signer-src/` (field placement → canvas capture → pdf-lib write)
- [ ] Minified bundle in `fixtures/signer-bundle/` produced by `bun build --minify`
- [ ] Captured REA CLI output committed under `fixtures/rea-output/` so the demo runs with no keys/network
- [ ] Live REA re-run is env-gated (`REA_LIVE=1`); keys never committed
- [ ] UI shows REA report side-by-side with original source plus a match/miss accuracy check
- [ ] Rebuilt signature-capture component is live and usable
- [ ] `tracking/seen-bookmarks.json` marks `gh-morluto-rea` as both proposed and built
- [ ] Demo PR includes at least one screenshot and one video of the running app

## Validation (PR)
- Screenshot: Full layout with REA report, original source, accuracy ledger (match + miss), and the live signature pad
- Video: Open app → scroll report/source → show a match and a miss → draw a signature → export PNG preview
- README: Confirm run steps + manual test notes match the checklist above
