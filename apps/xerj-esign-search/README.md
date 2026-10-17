# XERJ e-sign corpus search (Lumin Sign)

Lumin Sign–framed desk for [XERJ](https://github.com/xerj-org/xerj) (Apache-2.0, `v1.0.0-rc.96` on the committed capture): ask the same envelope questions two ways — **grep** vs **XERJ ranked passages** — over a messy local corpus of MSA PDFs, a countersign certificate, markdown notes, audit/webhook files, and a reminder config.

Offline by default. The corpus and captured `POST /esign-*/_search` + `xerj gain` fixtures are committed. No binary and no keys are required to review the UI.

Concepts, diagrams, MCP wiring: **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)**.

## Run

```bash
cd apps/xerj-esign-search
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/). Badge should read **Fixture**.

There is no WebMCP flag and no in-page Agent panel. This demo compares retrieval, it does not chat.

## What to click / try

1. Confirm the **Fixture** badge and the `xerj gain` strip at the bottom (counted searches / hit rate / latency from the capture — not a dollar estimate).
2. Click each canned chip. For every question you should see:
   - ground-truth answer key
   - grep line hits (left) vs XERJ passages (right)
   - correctness pills against the answer key
   - byte / estimated-token counts (bytes÷4, labeled as estimates)
3. **Where is the countersign block?** — XERJ’s top passage should be `contracts/ENV-MSA-7F2C91-countersign.pdf` page 3 (`sig-countersign-gc`). Grep scatters across notes, logs, and both MSA bodies.
4. **Who are the parties?** — Harbor Robotics LLC + Lumin Sign, Inc. on `ENV-MSA-7F2C91`. Acme Holdings is a *different* document.
5. **When does it expire?** — `2026-11-15T23:59:59Z` (envelope void time). Grep with the timestamp is sharp; XERJ BM25 also surfaces the Contoso draft (“Expires: n/a”) first. That ranking is real.
6. **Which reminder failed?** — `ENV-NDA-NORTHWIND` / SMTP 550. Harbor’s reminder delivered.
7. **MSA v1 vs v2** — term 12→24 months, auto-renew added, convenience notice 30→90 days, cap USD 50k/6 months → USD 250k/12 months.
8. **Liability cap (long MSA)** — read the gold comparison note. This uses the same Lumin Sign × Acme Holdings article style as `apps/pageindex-contract-qa` (PR #12). That app is **not** loaded or modified.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Badge is **Fixture** unless you set `XERJ_LIVE=1` yourself
- [ ] All six chips render side-by-side hits + the answer key
- [ ] Countersign chip: XERJ top hit is the certificate page 3 / `COUNTERSIGN BLOCK`
- [ ] Reminder chip: Northwind / 550 appears in XERJ passages
- [ ] Metrics show grep file-bytes > XERJ passage-bytes on the noisy questions
- [ ] `xerj gain` panel shows the captured counted dashboard (12 searches, 100% hit rate, p50 2ms on this capture)
- [ ] Liability-cap chip shows the PageIndex comparison note
- [ ] No API keys in the repo (`.env` is gitignored; `.env.example` is blank)

## Live mode (optional)

Default path never talks to a node. To re-index and recapture on your machine:

```bash
curl -fsSL https://xerj.org/get | sh
# data dir MUST sit outside the corpus
xerj --insecure --data-dir /tmp/xerj-esign-data --port 19200 &
cd apps/xerj-esign-search
xerj autoindex ./corpus --url http://127.0.0.1:19200 --prefix esign --state-dir /tmp/xerj-esign-state --progress plain
XERJ_URL=http://127.0.0.1:19200 bun run capture   # writes fixtures/
XERJ_LIVE=1 XERJ_URL=http://127.0.0.1:19200 bun run dev
```

`--insecure` is a trust boundary (no TLS, no auth, loopback only). Do not commit `admin.key` or any `XERJ_API_KEY`.

`xerj search "<q>" --prefix esign` is the **code / `defs` client**. On this docs+PDF corpus it returns HTTP 400 (`unknown field defs`) because autoindex wrote `body` / `title` / `text`. The working documented path — and what the UI shows — is Elasticsearch-compatible `_search` with `_source` projection and `fields:["_passage"]`. That CLI 400 is captured in `fixtures/xerj-search.json`.

## Honest numbers and caveats

- **Token/byte counts in the chips** are measured on *this* corpus: grep cost = size of every matching file; XERJ cost = UTF-8 bytes of returned `_passage` text. Tokens are **bytes÷4**, labeled as estimates.
- **`xerj gain`** on v1.0.0-rc.96 reports counted **searches, hit rate, latency, busiest indices** from the node audit log. It does **not** print a dollar token-savings figure. Do not treat the README case-study 2.7× as a result of this desk.
- XERJ’s own caveat (README / case study): retrieval **wins on private, internal, niche, or post-cutoff** material and is **neutral to harmful** on popular public libraries the model already knows. A Lumin Sign envelope folder is the first kind.
- Default embedder is **lexical**, not neural. The capture used BM25 `match` / `match_phrase` on `body`. A `semantic` query on the same node (lexical feature-hash) ranked the Harbor signature page *above* the countersign block; we kept the BM25+_passage capture because it is the documented exact-word path and it ranked page 3 first.

## vs PageIndex (`apps/pageindex-contract-qa`, PR #12)

PageIndex walks a **TOC tree** (Article 10 → 10.2 → 10.2.1 Cap on Damages → p.14) on one long MSA. XERJ **ranks passages across a mixed folder**. On the liability-cap question, Harbor MSA §8 pages outrank Acme 10.2.1 because they also say “cap” / “liability”. The Acme needles are still in the top-5. That is an honest difference, not a knock on either tool: tree walk is better when you already know you are inside one structured contract; passage search is better when the answer might live in a log, a note, or a different PDF.

This PR does not modify `apps/pageindex-*`.

## Fixtures

| Path | Role |
| --- | --- |
| `corpus/` | Mixed envelope folder (committed) |
| `fixtures/demo.json` | Offline view model the UI loads |
| `fixtures/xerj-es-passages.json` | Raw `_search` + `_passage` captures |
| `fixtures/xerj-search.json` | Real `xerj search` CLI (400 on `defs`) |
| `fixtures/xerj-gain.txt` / `.json` | Real `xerj gain` output |
| `fixtures/grep-results.json` | Grep baseline |
| `fixtures/answers.json` | Ground-truth answer key |

Regenerate PDFs: `bun run corpus`. Recapture (needs a node): `bun run capture`.
