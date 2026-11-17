# Envelope prep eval (mock)

- Started: 2026-11-17T08:19:46.586Z
- Latency: 5 ms
- Events: RUN_STARTED=1, STEP_STARTED=2, STATE_SNAPSHOT=2, TEXT_MESSAGE_START=10, TEXT_MESSAGE_CONTENT=27, TEXT_MESSAGE_END=10, STATE_DELTA=9, STEP_FINISHED=2, TOOL_CALL_START=8, TOOL_CALL_ARGS=26, TOOL_CALL_END=8, TOOL_CALL_RESULT=8, RUN_FINISHED=1

## Placement vs ground truth

| Metric | Value |
| --- | --- |
| Correct (page + IoU ≥ 0.5) | 6 / 8 |
| Precision | 75% |
| Recall | 75% |
| F1 | 0.75 |

## Per field type

| Type | Truth | Predicted | Correct | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| signature | 2 | 2 | 2 | 100% | 100% |
| initials | 2 | 2 | 1 | 50% | 50% |
| date | 2 | 2 | 1 | 50% | 50% |
| name | 2 | 2 | 2 | 100% | 100% |

## Low-confidence flags vs actual errors

| Flagged | True positives (flagged & wrong) | False positives (flagged & right) | False negatives (unflagged & wrong) |
| ---: | ---: | ---: | ---: |
| 2 | 2 | 0 | 0 |

## Tokens / cost estimate

Mock mode: no model calls.

## After scripted human corrections (mock)

Correct 8/8 · precision 100% · recall 100%

## Notes

- Mock agent intentionally misplaces jordan-date (offset bbox, confidence 0.42) and priya-initials (page 5 instead of 6, confidence 0.36).
- Scripted human corrections move those two fields onto ground truth; resume scoring is recorded separately.

