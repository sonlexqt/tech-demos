# PageIndex contract Q&A (Lumin Sign)

Lumin Sign–flavored **contract Q&A** demo of [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex) (MIT): vectorless, reasoning-based RAG that walks a **hierarchical tree index** like a table of contents instead of chunk → embed → vector search.

This app ships a **long fixture MSA** (Lumin Sign, Inc. × Acme Holdings LLC, 25 pages) plus a **prebuilt PageIndex-style JSON tree**. The happy path is a **deterministic tree walk** so `bun install && bun run dev` works **offline with no API keys**.

## Run

```bash
cd apps/pageindex-contract-qa
bun install
bun run dev
```

Open the Vite URL (default `http://localhost:5173/`).

Optional Live keys (`VITE_PAGEINDEX_API_KEY`, `VITE_OPENAI_API_KEY` — see `.env.example`) only flip a **placeholder**. They are **never required**. Do not commit secrets. A real integration would call [PageIndex](https://github.com/VectifyAI/PageIndex) / an LLM; this demo does not send traffic on the happy path.

## What you should see

- Header: document title, parties, effective date, 25 pages, **Fixture mode** badge. Live stays disabled unless both optional env keys are set (still a placeholder).
- Three panes: **PageIndex tree** | **contract pages** | **Ask the tree**.
- Six canned chips that hunt clauses at different tree depths.

## Manual test (canned Q&A)

Click each chip. Expect an animated walk (nodes pulse, reasoning lines appear), a **tree-path citation**, the clause highlighted on the page, and a short answer.

| Chip | Should land on | Citation includes |
| --- | --- | --- |
| Liability cap | 10.2.1 Cap on Damages | Article 10 → 10.2 → 10.2.1 → p.14 · 12-month fees cap |
| Confidentiality term | 6.4 Duration | Article 6 → 6.4 → p.9 · five years; trade secrets longer |
| Termination notice | 13.2.2 For Convenience | Article 13 → 13.2 → 13.2.2 → p.17 · 90 days after Initial Term |
| Data & subprocessors | 7.3 Subprocessors | Article 7 → 7.3 → p.11 · 30-day notice; Exhibit E names AWS etc. |
| IP ownership | 5.2 Customer Data and Deliverables | Article 5 → 5.2 → p.8 · Customer owns Custom Deliverables |
| Governing law | 14.2 Exclusive Venue | Article 14 → 14.1/14.2 → p.18 · Delaware / Wilmington |

Also try:

- Click a tree row: the document scrolls to that clause.
- Type a close paraphrase (e.g. “twelve month liability cap”) — should still match the canned walk.
- Type something unrelated — “No confident node” empty state.
- **Clear** resets highlight, walk log, and chips.

## Fixtures

| File | Role |
| --- | --- |
| `public/fixtures/lumin-acme-msa.md` | Full long-form MSA (markdown) |
| `public/fixtures/pageindex-tree.json` | PageIndex-shaped tree (`node_id`, `title`, `start_index`/`end_index`, `summary`, `excerpt`, `text`, `nodes`) |
| `public/fixtures/canned-qa.json` | Scripted questions, walk steps, answers |

Regenerate after editing `src/data/`:

```bash
bun run fixtures
```

## Notes

- Not legal advice. The MSA is a demo fixture.
- WebMCP / Agent panel: not used in this demo.
