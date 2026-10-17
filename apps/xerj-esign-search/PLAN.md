# XERJ e-sign corpus search (Lumin Sign)

## Source
- Bookmark: https://github.com/xerj-org/xerj
- Slug: `xerj-esign-search`
- Tracking id: `gh-xerj-org-xerj` (GitHub trending; Apache-2.0)

## Goal (single-user MVP)
A reviewer opens a Lumin Sign–framed desk, picks a canned question about a messy local envelope corpus (MSA PDFs, countersign PDF, markdown notes, audit/webhook logs, a small config), and sees **grep-based retrieval vs XERJ ranked passages** side by side. Each question shows hit passages, correctness against a committed answer key, and token/byte counts. Offline fixtures (committed corpus + captured `xerj search` / ES `_search` + `xerj gain`) make the UI work with no binary or keys. Live re-index/re-query is optional and env-gated.

## Out of scope
- Production Lumin Sign / Lumin PDF APIs
- Neural embeddings, Jev rerank, or any third-party key
- Editing `apps/pageindex-*` or other apps
- A real in-page LLM / WebMCP agent
- Invented XERJ features or unpublished token-savings numbers

## Stack
- Runtime/tooling: Bun
- UI/framework: Bun.serve + static HTML/CSS/JS (no React)
- Key libraries: none required at runtime. Optional live path shells out to a local `xerj` binary. PDF fixtures generated with a small stdlib script.

## Corpus (own fixtures only)
Messy mixed folder under `corpus/`:
- Multi-page MSA v1 + v2 PDFs (Harbor Robotics countersign deal; deliberate clause diffs)
- Multi-page countersign / certificate of completion PDF
- Envelope markdown notes
- Audit + webhook log files (one reminder failure is the needle)
- Small reminder/config file
- One long PageIndex-style MSA (Lumin Sign, Inc. × Acme Holdings LLC, 25-page article structure) used only for the comparison question — do not modify `apps/pageindex-*`

## Questions
Ask each two ways (grep walk vs XERJ ranked passages):
1. Where is the countersign block?
2. Who are the parties?
3. When does the envelope expire?
4. Which envelope’s reminder failed?
5. What changed between MSA v1 and v2?
6. What is the liability cap? (same long-MSA style as PR #12 / `apps/pageindex-contract-qa`)

## Manual testing / README
`apps/xerj-esign-search/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- What to click (each chip; Fixture badge; side-by-side hits; correctness; bytes/tokens; `xerj gain` panel)
- Live mode is off unless `XERJ_LIVE=1` and a `xerj` binary is on PATH — never required, never commit keys
- Honest XERJ caveat: retrieval wins on private / niche / post-cutoff docs; neutral-to-harmful on memorized public libraries
- Brief PageIndex comparison note (tree walk vs ranked passages) without loading that app
- Pass/fail checklist for the six questions

## Acceptance criteria
- [ ] `cd apps/xerj-esign-search && bun install && bun run dev` works
- [ ] `PLAN.md`, `README.md` (run + manual test), and `HOW_IT_WORKS.md` (indexing, ranking, MCP wiring, why passages save tokens vs grep; mermaid diagrams) are present
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app
- [ ] UI works offline from committed corpus + captured XERJ query/gain fixtures
- [ ] Each canned question shows grep vs XERJ hits, ground-truth correctness, and token/byte counts
- [ ] Real `xerj` CLI/API used for capture (no invented commands or numbers); `xerj gain` shown when the capture produced it
- [ ] Live re-index/re-query is env-gated (`XERJ_LIVE=1`); keys never committed
- [ ] `tracking/seen-bookmarks.json` marks `gh-xerj-org-xerj` proposed **and** built (existing rows kept)
- [ ] One question uses the same long MSA style as `apps/pageindex-*` (PR #12) with an honest README comparison note; that app is not modified

## Validation (PR)
- Screenshot: side-by-side hits after a canned question, Fixture badge, ground-truth correctness, token/byte counts
- Video: open app → click several chips (including reminder-failed and liability-cap) → show grep vs XERJ, correctness, gain panel
- README: run steps + manual test notes match the checklist above
