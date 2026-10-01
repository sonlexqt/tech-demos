# Graphify contract knowledge graph (Lumin Sign)

Lumin Sign–flavored **pre-signature** explorer for [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) (Apache-2.0): local parse of docs/PDFs/code into a **queryable knowledge graph** with **explained edges**. No vector database.

This app ships a **fixture MSA + mutual NDA** (Lumin Sign, Inc. × Acme Holdings LLC) plus a **prebuilt Graphify-shaped `graph.json`**. The happy path is a **deterministic path walk**, so `bun install && bun run dev` works **offline with no API keys and no `graphify` CLI**.

How a graph with explained edges differs from vector RAG and from PageIndex’s tree walk: **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)**.

## Run

```bash
cd apps/graphify-contract-kg
bun install
bun run dev
```

Open the Vite URL (default [http://localhost:5173/](http://localhost:5173/)).

Optional Live: if the `graphify` CLI is on `PATH`, the header **Live** control enables (detection only). Answers still come from `public/fixtures/graph.json`. A real integration would run `graphify query` / `graphify path`. The CLI is **never required**. Do not commit secrets.

## What you should see

- Header: Lumin Sign · Review before send, parties, envelope id, **Fixture mode** badge. Live stays disabled unless the CLI probe succeeds.
- Three panes: **Ask the graph** (chips) | **interactive graph** | **Why this edge**.
- Nodes colored by kind: parties, documents, defined terms, clauses, obligations, exhibits.
- Six canned chips that walk a path and show each edge’s plain-English **why** plus `EXTRACTED` / `INFERRED` / `AMBIGUOUS`.

## Manual test (canned path walks)

Click each chip. Expect the path to highlight, the inspector to show the current **edge why**, and a short path answer.

| Chip | Should walk | What the why must say |
| --- | --- | --- |
| Who owes what | Lumin → perform Services / IP indemnity; Acme → Fees / Customer Data indemnity | `owes` edges are EXTRACTED from shall-sentences |
| Liability ↔ indemnification | §8 → Indemnified Claim → IP indemnity → §9 `carves_out` | Cap is 12-month fees; IP indemnity is carved out |
| “Confidential Information” | term-ci → MSA §1 and NDA §2 → §6 / NDA §5 | Two definitions; NDA broader; MSA §6.3 defers |
| Termination → notice | §10 → §10.2 → 90-day notice → return/destroy CI | Convenience after Initial Term; CI return trigger |
| Lumin ↔ Acme | counterpart + MSA + NDA loop | Same two parties; MSA incorporates NDA |
| Customer Data / Exhibit E | Customer Data → Exhibit E DPA → §8.2 indemnity | DPA governs processing; `fuels` is INFERRED |

Also try:

- Click a node: inspector shows excerpt, incident edges, optional source document.
- Click any edge (not only canned): **Why** block is never empty.
- Type a paraphrase (e.g. “twelve month liability cap”) — should match the liability chip.
- Type something unrelated — “No confident path”.
- Toggle a **Node kinds** checkbox — those nodes hide; paths still work for remaining kinds.
- Click a **God node** (highest degree).
- **Clear** resets highlight, walk log, and chips.
- Fixture badge remains visible. Live does not change answers.

## Fixtures

| File | Role |
| --- | --- |
| `public/fixtures/lumin-acme-msa.md` | Fixture MSA |
| `public/fixtures/lumin-acme-nda.md` | Fixture mutual NDA |
| `public/fixtures/graph.json` | Graphify-shaped node-link graph (`why` on every edge) |
| `public/fixtures/canned-queries.json` | Scripted path walks |

Regenerate after editing `src/data/`:

```bash
bun run fixtures
```

## Notes

- Not legal advice. The package is a demo fixture.
- WebMCP / Agent panel: not used in this demo.
- Distinct from `apps/pageindex-contract-qa/` (tree-RAG TOC walk).
