# Graphify contract knowledge graph (Lumin Sign)

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597
- Upstream: https://github.com/Graphify-Labs/graphify (Apache-2.0)
- Slug: `graphify-contract-kg`

## Goal (single-user MVP)
A reviewer opens a Lumin Sign–flavored **pre-signature** explorer for a fixture MSA + mutual NDA, sees a **knowledge graph** of parties, clauses, obligations, defined terms, and exhibits, and clicks canned query chips that **walk a path** through the graph. Every highlighted edge shows a plain-English **why** plus Graphify confidence (`EXTRACTED` / `INFERRED` / `AMBIGUOUS`). Happy path is **offline fixtures** — no API keys and no `graphify` CLI.

Distinct from PageIndex (`apps/pageindex-contract-qa/`): this is a **graph with explained edges**, not a TOC tree walk.

## Out of scope
- Real Graphify CLI / Claude extraction on the happy path
- Vector database, embeddings, or live PDF OCR
- Auth, multi-user, persistence, e-sign execution
- Production legal review or counsel substitute
- Deploy / shared monorepo packages

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (vanilla DOM, custom SVG graph)
- Key libraries: none at runtime (fixtures + deterministic path walk)
- Optional: Vite middleware probes `graphify --version` so a Live toggle can light up if the CLI is on PATH (still answers from fixture `graph.json` unless documented otherwise)

## Manual testing / README
What `apps/graphify-contract-kg/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) with **no API keys** and **no graphify CLI**
- Link to Graphify-Labs/graphify and to `HOW_IT_WORKS.md` (graph vs vector RAG vs PageIndex tree)
- What to click: ≥6 canned chips (who owes what, liability ↔ indemnification, defined term Confidential Information, termination → notice, Lumin ↔ Acme, Customer Data / Exhibit E)
- Expected: Fixture mode badge, path highlight, every edge’s why, node/edge inspector
- Optional Live: CLI detection only; never required
- Pass/fail checklist for those path walks

## Acceptance criteria
- [ ] `cd apps/graphify-contract-kg && bun install && bun run dev` works offline
- [ ] `apps/graphify-contract-kg/README.md` present with run steps + manual test checklist
- [ ] `apps/graphify-contract-kg/HOW_IT_WORKS.md` explains Graphify vs vector RAG vs PageIndex; mermaid/ASCII diagrams; how this demo maps
- [ ] Fixture MSA + NDA package + prebuilt JSON graph (Graphify-shaped nodes/edges + `why` on every edge)
- [ ] Interactive graph: parties, clauses, obligations, defined terms, exhibits
- [ ] Click node or edge → inspector; **every edge** has a plain-English why + confidence
- [ ] ≥6 canned chips walk/highlight a path and show edge explanations
- [ ] Fixture mode badge visible; Live is optional/placeholder
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] `tracking/seen-bookmarks.json` records id `2104895659157684597` in proposed + built (merge, do not wipe)

## Validation (PR)
- Screenshot: Graph visible with Fixture badge, a canned path highlighted, inspector showing an edge **why**
- Video: Click several chips in sequence; show path highlights and edge explanations
- README: Run steps + manual test notes match the checklist above
