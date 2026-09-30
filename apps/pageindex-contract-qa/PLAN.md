# PageIndex contract Q&A (Lumin Sign)

## Source
- Bookmark: https://x.com/oliviscusAI/status/2104534255636513268
- Upstream: https://github.com/VectifyAI/PageIndex (MIT)
- Slug: `pageindex-contract-qa`

## Goal (single-user MVP)
A signer/ops person opens a long fixture MSA in a Lumin Sign–flavored review surface, sees a hierarchical PageIndex-style tree beside the contract, and asks clause questions (typed or via canned chips). The demo walks the tree like a TOC (not vector search), highlights the cited node, and returns a short answer with a tree-path citation (e.g. Article 10 → 10.2.1 Cap on Damages → p.14). Happy path is **offline fixtures** — no API keys.

## Out of scope
- Real PageIndex Cloud / LLM calls on the happy path
- Auth, multi-user, persistence, e-sign execution
- Production OCR/PDF parsing or a live PDF renderer
- Deploy / shared monorepo packages

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (vanilla DOM)
- Key libraries: none at runtime (fixtures + deterministic walk)
- Optional env (documented, never required): `VITE_PAGEINDEX_API_KEY`, `VITE_OPENAI_API_KEY` — Live toggle stays disabled/placeholder unless present

## Manual testing / README
`apps/pageindex-contract-qa/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) with **no API keys**
- Link to VectifyAI/PageIndex and explain fixture tree + deterministic walk vs optional Live
- What to click: each canned chip (liability cap, confidentiality term, termination notice, data/subprocessors/security, IP ownership, governing law)
- Expected: Fixture badge, animated tree walk, path citation, excerpt highlight on the page
- Pass/fail checklist for those six clause hunts

## Acceptance criteria
- [ ] `cd apps/pageindex-contract-qa && bun install && bun run dev` works offline
- [ ] `apps/pageindex-contract-qa/README.md` present with run steps + manual test checklist
- [ ] Long fixture MSA (~15–25 page-equivalent) + prebuilt JSON tree with stable ids, titles, page anchors, excerpts
- [ ] Three-pane layout: tree | document | Q&A; Fixture mode badge visible
- [ ] ≥6 canned questions produce tree-path highlight + excerpt + short answer
- [ ] Tree walk is visible (step/animate selected nodes)
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app (multiple canned queries)

## Validation (PR)
- Screenshot: After a canned question (liability cap), tree-path citation highlighted, excerpt on the page, Fixture badge
- Video: Click several canned chips in sequence; show walk animation, answers, and citations at varied tree depths
- README: Run steps + manual test notes match the checklist above
