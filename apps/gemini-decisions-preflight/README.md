# Lumin Sign · Gemini Decisions preflight

Send-ready checks for a contract PDF using Google’s [Gemini Decisions API](https://aistudio.google.com/docs/decisions-api) (`gemini-decision-1`): one shared PDF input, ~40 typed questions (`noul` / `choice` / `score`), calibrated probabilities, **zero generated text**.

This is a demo of the API, not production Lumin Sign.

Live eval numbers (owner-run, `mock: false`) are in [`results/SUMMARY.md`](./results/SUMMARY.md). **Screenshots, the screen recording, and `results/mock/` are still mock-mode UI evidence** — do not cite mock JSON as the bake-off.

| | Decisions `gemini-decision-1` | Generative `gemini-3.5-flash-lite` |
| --- | --- | --- |
| Accuracy (156 checks / 4 fixtures) | **98.1%** | **96.8%** |
| Planted-issue precision | 100% | 100% |
| Planted-issue recall | **100%** | **96.9%** |
| Latency p50 | **560 ms** | **6109 ms** |
| Latency p95 | **720 ms** | **18656 ms** |
| Est. cost per document | **~$0.0004** | **~$0.006** |

Caveats: baseline is Flash-Lite because `gemini-3.5-flash` and newer Flash models returned 503 high-demand for this key; generative latencies include 503 retry waits on two NDA fixtures; both models missed the 3 rubric scores on `nda-planted`; only 4 synthetic fixtures, so this is directional. More in [HOW_IT_WORKS.md](./HOW_IT_WORKS.md#what-our-eval-found).

Mock walkthrough (UI only, not live eval evidence):

- `media/preflight_planted_msa_mock.png`
- `media/preflight_mock_walkthrough.mp4`

## Run

```bash
cd apps/gemini-decisions-preflight
bun install
bun run dev
```

(`npm install && npm run dev` also works. Eval is specified as Node-only below.)

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). The API key stays on the tiny Node server; the browser never sees it.

Without a key the UI badge is **MOCK**. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to use the real client automatically (`DECISIONS_MODE=auto`). Force mock with `DECISIONS_MODE=mock`.

## What to click / try

1. Confirm the **MOCK** (or **LIVE**) badge in the header.
2. Select **NDA — clean**. Run preflight. Expect mostly **green**, ~200 ms-scale latency in mock, estimated cost, **output tokens = 0**.
3. Select **MSA — planted problems**. Run again. Expect **red** rows (missing counterparty, empty dates, missing Exhibit B, unspecified law, auto-renew without notice, high overall risk) and any low-confidence rows as **needs a human**.
4. Expand a row to see per-option probabilities (or `P(no)` for yes/no).
5. **Send** stays disabled while any check is red. It does not actually send an envelope.
6. Optionally upload one of the PDFs from `fixtures/` (they embed `LUMIN_FIXTURE:…` so mock still identifies them).

No WebMCP flag. No in-page LLM agent panel.

## Eval (the point of the demo)

Same checks through Decisions **and** a generative Gemini Flash structured-JSON call, scored against fixture ground truth.

```bash
cd apps/gemini-decisions-preflight
npm install
npm run eval
```

Requires **Node** (no Docker). `bun run eval` is equivalent after install.

| Mode | How | Output |
| --- | --- | --- |
| Mock (default here) | no key, or `DECISIONS_MODE=mock` | `results/mock/decisions.json`, `results/mock/generative.json`, `results/mock/SUMMARY.md` |
| Live | `GEMINI_API_KEY` set, `DECISIONS_MODE` unset/`auto`/`live` | `results/decisions.json`, `results/generative.json`, `results/SUMMARY.md` |

`SUMMARY.md` includes per-check accuracy vs ground truth, precision/recall on planted issues, p50/p95 latency, and token cost, side by side. Mock summaries open with an explicit **MOCK** banner. Committed live files are already in `results/`; re-running live eval overwrites them.

Generative baseline model is **`GENERATIVE_MODEL`** (default `gemini-3.5-flash-lite`, matching the committed live run). Example:

```bash
GENERATIVE_MODEL=gemini-3.5-flash-lite npm run eval
```

Optional cost-rate overrides: `FLASH_INPUT_USD_PER_M`, `FLASH_OUTPUT_USD_PER_M`.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://127.0.0.1:5173/`
- [ ] Header shows **MOCK** when `GEMINI_API_KEY` is unset
- [ ] Clean NDA preflight: mostly green, latency and cost visible, output tokens 0
- [ ] Planted MSA: multiple red checks aligned with `fixtures/msa-planted.truth.json`
- [ ] Expanding a choice/score row shows a probability map
- [ ] Send is demo-only and blocked when any row is red
- [ ] `npm run eval` without a key writes `results/mock/*` and does not overwrite live `results/*.json`
- [ ] `.env.example` has a placeholder only; no secrets in git
- [ ] `results/SUMMARY.md` is the live owner eval (`mock: false`); `results/mock/SUMMARY.md` stays mocked

## Fixtures

Synthetic PDFs only (no customer data), regenerated with `npm run fixtures`:

| File | What |
| --- | --- |
| `fixtures/msa-clean.pdf` | Complete MSA, Delaware law, auto-renew **with** 60-day notice |
| `fixtures/msa-planted.pdf` | Missing party/signature architecture, blanks, missing exhibits, unspecified law |
| `fixtures/nda-clean.pdf` | Mutual NDA, California, no auto-renew |
| `fixtures/nda-planted.pdf` | Blank disclosing party, missing witness, Schedule 1 absent, auto-renew without notice |

Each has a sibling `*.truth.json` listing expected answers and `plantedIssues`.

## Docs

- [PLAN.md](./PLAN.md) — MVP scope
- [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) — calibrated classification vs generation
- Official API: https://aistudio.google.com/docs/decisions-api
- Launch post: https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/
