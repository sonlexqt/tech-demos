# Envelope prep eval (live)

- Started: 2026-11-17T08:35:42.000Z
- Latency: 14847 ms
- Events: RUN_STARTED=1, STEP_STARTED=1, STATE_SNAPSHOT=2, TEXT_MESSAGE_START=2, TEXT_MESSAGE_CONTENT=6, TEXT_MESSAGE_END=2, TOOL_CALL_START=10, TOOL_CALL_ARGS=29, TOOL_CALL_END=10, TOOL_CALL_RESULT=10, STATE_DELTA=9, STEP_FINISHED=1, RUN_FINISHED=1

## Placement vs ground truth

| Metric | Value |
| --- | --- |
| Correct (page + IoU ≥ 0.5) | 0 / 8 |
| Precision | 0% |
| Recall | 0% |
| F1 | 0.00 |
| Mean dx (page widths) | -0.00032 |
| Mean dy (page heights) | -0.03391 |
| Page / type / signer match | 100% / 100% / 100% |

## Per field type

| Type | Truth | Predicted | Correct | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| signature | 2 | 2 | 0 | 0% | 0% |
| initials | 2 | 2 | 0 | 0% | 0% |
| date | 2 | 2 | 0 | 0% | 0% |
| name | 2 | 2 | 0 | 0% | 0% |

## Low-confidence flags vs actual errors

| Flagged | True positives (flagged & wrong) | False positives (flagged & right) | False negatives (unflagged & wrong) |
| ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 8 |

## Tokens / cost estimate

| Model | Input | Output | Est. USD |
| --- | ---: | ---: | ---: |
| gemini-3.5-flash-lite | 15183 | 848 | $0.0014 |

## Notes

- Live eval uses pdf.js text items (no page-image vision) and Gemini function calling.
- No API key is committed. CI never runs this mode.
- Primary model gemini-3.5-flash returned 503/429 on every attempt; this run used fallback gemini-3.5-flash-lite.

