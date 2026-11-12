# MOCK evaluation — not a live Gemini run

> These numbers were produced by the **recorded/mock adapter**. They are not calibrated model quality, not real latency, and not a real cost. Do not cite them as Decisions vs Flash results. Re-run with `GEMINI_API_KEY` set (and `DECISIONS_MODE=auto` or `live`) to write live files under `results/`.

Output directory: `results/mock`

## Head-to-head

| | Decisions API | Generative Flash |
| --- | --- | --- |
| Mode | mock (MOCK) | mock (MOCK) |
| Model | gemini-decision-1 (mock) | gemini-3.5-flash (mock) |
| Overall accuracy vs ground truth | **100.0%** | **98.1%** |
| Precision (planted issues) | 100.0% | 100.0% |
| Recall (planted issues) | 100.0% | 95.3% |
| F1 (planted issues) | 1.000 | 0.976 |
| Latency p50 | 179 ms | 953 ms |
| Latency p95 | 203 ms | 999 ms |
| Input tokens (sum) | 4424 | 4424 |
| Output tokens (sum) | 0 (always 0 when live) | 4017 |
| Estimated token cost | $0.0004 | $0.04 |

## Per fixture

### Decisions

| Fixture | Accuracy | TP | FP | FN | Latency | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| msa-clean | 39/39 | 0 | 0 | 0 | 179 ms | $0.0001 |
| msa-planted | 39/39 | 37 | 0 | 0 | 179 ms | $0.0001 |
| nda-clean | 39/39 | 0 | 0 | 0 | 191 ms | $0.0001 |
| nda-planted | 39/39 | 27 | 0 | 0 | 203 ms | $0.0001 |

### Generative

| Fixture | Accuracy | TP | FP | FN | Latency | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| msa-clean | 39/39 | 0 | 0 | 0 | 952 ms | $0.01 |
| msa-planted | 37/39 | 35 | 0 | 2 | 999 ms | $0.01 |
| nda-clean | 39/39 | 0 | 0 | 0 | 968 ms | $0.01 |
| nda-planted | 38/39 | 26 | 0 | 1 | 953 ms | $0.01 |

## Per-check accuracy vs ground truth

| Check | Label | Decisions | Generative |
| --- | --- | --- | --- |
| `every_party_has_sig_block` | Every party has a signature block | 4/4 (100.0%) | 4/4 (100.0%) |
| `sig_printed_name_lines` | Printed name lines | 4/4 (100.0%) | 4/4 (100.0%) |
| `sig_title_lines` | Title / capacity lines | 4/4 (100.0%) | 4/4 (100.0%) |
| `sig_date_lines` | Date lines next to signatures | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_witness_block` | Witness required but missing | 4/4 (100.0%) | 4/4 (100.0%) |
| `e_sign_permitted` | Electronic signatures permitted | 4/4 (100.0%) | 4/4 (100.0%) |
| `counterparts_clause` | Counterparts clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `empty_date_fields` | Empty date fields | 4/4 (100.0%) | 4/4 (100.0%) |
| `empty_initial_fields` | Empty initial fields | 4/4 (100.0%) | 3/4 (75.0%) |
| `missing_effective_date` | Missing effective date | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_term_duration` | Missing term duration | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_counterparty_name` | Missing counterparty legal name | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_notice_addresses` | Missing notice addresses | 4/4 (100.0%) | 4/4 (100.0%) |
| `parties_both_named` | Both parties named in the preamble | 4/4 (100.0%) | 4/4 (100.0%) |
| `payment_terms_present` | Payment terms present | 4/4 (100.0%) | 4/4 (100.0%) |
| `late_fee_terms` | Late fee terms | 4/4 (100.0%) | 4/4 (100.0%) |
| `insurance_requirements` | Insurance requirements | 4/4 (100.0%) | 4/4 (100.0%) |
| `auto_renewal_clause` | Auto-renewal clause present | 4/4 (100.0%) | 4/4 (100.0%) |
| `confidentiality_clause` | Confidentiality clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `indemnity_clause` | Indemnity clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `limitation_of_liability` | Limitation of liability | 4/4 (100.0%) | 4/4 (100.0%) |
| `assignment_without_consent` | Assignment without consent | 4/4 (100.0%) | 3/4 (75.0%) |
| `ip_ownership_clause` | IP ownership clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `force_majeure` | Force majeure | 4/4 (100.0%) | 3/4 (75.0%) |
| `entire_agreement` | Entire agreement | 4/4 (100.0%) | 4/4 (100.0%) |
| `amendment_in_writing` | Amendments in writing | 4/4 (100.0%) | 4/4 (100.0%) |
| `severability` | Severability | 4/4 (100.0%) | 4/4 (100.0%) |
| `termination_clause` | Termination clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `referenced_exhibits_missing` | Referenced exhibits missing | 4/4 (100.0%) | 4/4 (100.0%) |
| `governing_law_specified` | Governing law specified | 4/4 (100.0%) | 4/4 (100.0%) |
| `venue_specified` | Venue / forum specified | 4/4 (100.0%) | 4/4 (100.0%) |
| `defined_terms_undefined` | Undefined defined terms | 4/4 (100.0%) | 4/4 (100.0%) |
| `conflicting_dates` | Conflicting dates | 4/4 (100.0%) | 4/4 (100.0%) |
| `governing_law` | Governing law | 4/4 (100.0%) | 4/4 (100.0%) |
| `document_type` | Document type | 4/4 (100.0%) | 4/4 (100.0%) |
| `renewal_type` | Renewal type | 4/4 (100.0%) | 4/4 (100.0%) |
| `overall_risk` | Overall send risk | 4/4 (100.0%) | 4/4 (100.0%) |
| `sign_readiness` | Sign-readiness | 4/4 (100.0%) | 4/4 (100.0%) |
| `completeness` | Completeness | 4/4 (100.0%) | 4/4 (100.0%) |

## Scoring notes

- **noul**: predicted yes if `noul >= 0.5`, compared to ground-truth `yes`.
- **choice**: predicted `choice` vs ground-truth option id.
- **score**: argmax of `probabilities` vs ground-truth discrete level.
- **Planted issues**: check ids listed in each fixture’s `*.truth.json` `plantedIssues`. Precision/recall treat a “problem fire” using the same green/red polarity as the UI (issue-yes, requirement-no, fail-valued choice, fail-band score).
- Clean fixtures have empty `plantedIssues`. Auto-renewal on the clean MSA is expected and is not counted as a planted defect.
- Mock generative deliberately flips a couple of planted checks so this table is structurally non-identical. That is fixture wiring, not a model result.
