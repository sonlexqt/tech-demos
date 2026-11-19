# Univer quote-to-sign (Lumin Sign fixture)

## Source
- Bookmark: https://github.com/dream-num/univer
- Slug: `univer-quote-to-sign`

## Goal (single-user MVP)
Open a fake Lumin Sign envelope for a fictional MSA. The document contains contract sections plus an embedded live Univer pricing sheet (seats, term, add-on toggles, volume discount, tax, total) with real formulas. The signer edits only unlocked input cells; everything else is protected. A rule-based Agent panel (optional Gemini behind `GEMINI_API_KEY`) edits those cells through Univer’s Facade API so agent and human edits share one undo/redo stack. Signing freezes a workbook snapshot, renders a signed PDF with pdf-lib (not Univer’s commercial PDF export), hashes snapshot+PDF, and a Verify view reloads the snapshot, recomputes, and detects tampering.

## Out of scope
- Real Lumin / PandaDoc / DocuSign services, auth, or multi-signer workflows
- Univer commercial add-ons: Office import/export, PDF export, Server SDK, AI SDK
- Production e-sign legality (certificates, identity proofing, timestamp authorities)
- Collaboration / multiplayer
- Deploy (static `bun run build` is enough; Cloudflare Pages-friendly)

## Stack
- Runtime/tooling: Bun, Vite, TypeScript
- UI: vanilla DOM around an embedded Univer Sheets editor
- Key libraries (Apache-2.0 OSS Univer 1.5.x only):
  - `@univerjs/presets`, `@univerjs/preset-sheets-core` (browser editor + formula engine + Facade)
  - `@univerjs/core`, `@univerjs/engine-formula`, `@univerjs/sheets`, `@univerjs/sheets-formula`, `@univerjs/sheets-numfmt` (headless Node for tests / verify)
- PDF: `pdf-lib` (our rendering)
- Tests: `bun test`
- CI: GitHub Actions running install / test / build for this app

## Envelope fixture
- Parties: Northwind Labs, Inc. (vendor) and Contoso Analytics LLC (customer)
- Live sheet inputs (editable): seats (`B6`), term years (`D6`), Premium Support toggle (`B7`), SSO toggle (`B8`)
- Locked: unit prices, discount tier table, all formulas, labels
- Formulas: line totals, `IF`-based volume discount (20/50/100 seat tiers), 8.5% tax, grand total
- Agent mock phrases: `make it 40 seats, 2-year term`, plus undo
- Optional LLM tools: `set_cell`, `get_totals`, `undo`

## Manual testing / README
What `apps/univer-quote-to-sign/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Edit seats in the sheet; formulas recalc
- Agent command `40 seats, 2-year term`; totals update; Undo restores prior state
- Audit log records signer vs agent, cell, old → new, resulting total
- Sign → PDF with contract, computed pricing, audit-trail page, SHA-256
- Verify passes; Tamper (mutate snapshot) fails
- Mock agent needs no API key; Gemini is optional via `.env.example`

## Acceptance criteria
- [ ] `cd apps/univer-quote-to-sign && bun install && bun run dev` works
- [ ] `apps/univer-quote-to-sign/README.md` has run steps and a manual test checklist
- [ ] `apps/univer-quote-to-sign/HOW_IT_WORKS.md` covers Univer architecture, OSS vs commercial, freeze/hash, mermaid diagrams
- [ ] Only Apache-2.0 Univer packages; no commercial PDF/Office/Server/AI SDK
- [ ] Live formulas + protected non-input cells
- [ ] Agent edits go through Facade/command system; undo of an agent edit works
- [ ] Sign produces snapshot + pdf-lib PDF + SHA-256; Verify pass / tamper fail
- [ ] Tests: formula combos, agent edit+undo, hash stability, tamper detection
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] `tracking/seen-bookmarks.json` marks dream-num/univer as built

## Validation (PR)
- Screenshot: envelope with contract, live pricing sheet, agent panel, audit log
- Video: edit seats → agent `40 seats, 2-year term` → undo → sign → PDF/audit → verify pass → tamper fail
- README: run steps + checklist match the flow above
