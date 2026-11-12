# Live evaluation — Gemini Decisions vs generative Flash

> Produced with `GEMINI_API_KEY`. Decisions model `gemini-decision-1`; generative model as recorded below.

Output directory: `results`

## Head-to-head

| | Decisions API | Generative Flash |
| --- | --- | --- |
| Mode | live | live |
| Model | gemini-decision-1 | gemini-3.5-flash-lite |
| Overall accuracy vs ground truth | **98.1%** | **96.8%** |
| Precision (planted issues) | 100.0% | 100.0% |
| Recall (planted issues) | 100.0% | 96.9% |
| F1 (planted issues) | 1.000 | 0.984 |
| Latency p50 | 560 ms | 6109 ms |
| Latency p95 | 720 ms | 18656 ms |
| Input tokens (sum) | 16993 | 10364 |
| Output tokens (sum) | 0 (always 0 when live) | 8190 |
| Estimated token cost | $0.0017 | $0.02 |

## Per fixture

### Decisions

| Fixture | Accuracy | TP | FP | FN | Latency | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| msa-clean | 39/39 | 0 | 0 | 0 | 560 ms | $0.0005 |
| msa-planted | 39/39 | 37 | 0 | 0 | 640 ms | $0.0004 |
| nda-clean | 39/39 | 0 | 0 | 0 | 548 ms | $0.0004 |
| nda-planted | 36/39 | 27 | 0 | 0 | 720 ms | $0.0004 |

### Generative

| Fixture | Accuracy | TP | FP | FN | Latency | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| msa-clean | 39/39 | 0 | 0 | 0 | 5238 ms | $0.0060 |
| msa-planted | 37/39 | 35 | 0 | 2 | 6109 ms | $0.0059 |
| nda-clean | 39/39 | 0 | 0 | 0 | 13862 ms | $0.0059 |
| nda-planted | 36/39 | 27 | 0 | 0 | 18656 ms | $0.0058 |

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
| `empty_initial_fields` | Empty initial fields | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_effective_date` | Missing effective date | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_term_duration` | Missing term duration | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_counterparty_name` | Missing counterparty legal name | 4/4 (100.0%) | 4/4 (100.0%) |
| `missing_notice_addresses` | Missing notice addresses | 4/4 (100.0%) | 4/4 (100.0%) |
| `parties_both_named` | Both parties named in the preamble | 4/4 (100.0%) | 4/4 (100.0%) |
| `payment_terms_present` | Payment terms present | 4/4 (100.0%) | 3/4 (75.0%) |
| `late_fee_terms` | Late fee terms | 4/4 (100.0%) | 4/4 (100.0%) |
| `insurance_requirements` | Insurance requirements | 4/4 (100.0%) | 4/4 (100.0%) |
| `auto_renewal_clause` | Auto-renewal clause present | 4/4 (100.0%) | 4/4 (100.0%) |
| `confidentiality_clause` | Confidentiality clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `indemnity_clause` | Indemnity clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `limitation_of_liability` | Limitation of liability | 4/4 (100.0%) | 4/4 (100.0%) |
| `assignment_without_consent` | Assignment without consent | 4/4 (100.0%) | 4/4 (100.0%) |
| `ip_ownership_clause` | IP ownership clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `force_majeure` | Force majeure | 4/4 (100.0%) | 4/4 (100.0%) |
| `entire_agreement` | Entire agreement | 4/4 (100.0%) | 4/4 (100.0%) |
| `amendment_in_writing` | Amendments in writing | 4/4 (100.0%) | 4/4 (100.0%) |
| `severability` | Severability | 4/4 (100.0%) | 4/4 (100.0%) |
| `termination_clause` | Termination clause | 4/4 (100.0%) | 4/4 (100.0%) |
| `referenced_exhibits_missing` | Referenced exhibits missing | 4/4 (100.0%) | 4/4 (100.0%) |
| `governing_law_specified` | Governing law specified | 4/4 (100.0%) | 3/4 (75.0%) |
| `venue_specified` | Venue / forum specified | 4/4 (100.0%) | 4/4 (100.0%) |
| `defined_terms_undefined` | Undefined defined terms | 4/4 (100.0%) | 4/4 (100.0%) |
| `conflicting_dates` | Conflicting dates | 4/4 (100.0%) | 4/4 (100.0%) |
| `governing_law` | Governing law | 4/4 (100.0%) | 4/4 (100.0%) |
| `document_type` | Document type | 4/4 (100.0%) | 4/4 (100.0%) |
| `renewal_type` | Renewal type | 4/4 (100.0%) | 4/4 (100.0%) |
| `overall_risk` | Overall send risk | 3/4 (75.0%) | 3/4 (75.0%) |
| `sign_readiness` | Sign-readiness | 3/4 (75.0%) | 3/4 (75.0%) |
| `completeness` | Completeness | 3/4 (75.0%) | 3/4 (75.0%) |

## Scoring notes

- **noul**: predicted yes if `noul >= 0.5`, compared to ground-truth `yes`.
- **choice**: predicted `choice` vs ground-truth option id.
- **score**: argmax of `probabilities` vs ground-truth discrete level.
- **Planted issues**: check ids listed in each fixture’s `*.truth.json` `plantedIssues`. Precision/recall treat a “problem fire” using the same green/red polarity as the UI (issue-yes, requirement-no, fail-valued choice, fail-band score).
- Clean fixtures have empty `plantedIssues`. Auto-renewal on the clean MSA is expected and is not counted as a planted defect.
- Generative baseline uses structured JSON (`responseMimeType: application/json`) with the same question set, not the Decisions endpoint.
