import type { EvalResult, ScoringReport } from "../shared/types";
import { formatPercent } from "../shared/scoring";

export function renderSummary(result: EvalResult, afterFix?: ScoringReport): string {
  const s = result.scoring;
  const lines = [
    `# Envelope prep eval (${result.mode})`,
    "",
    `- Started: ${result.startedAt}`,
    `- Latency: ${result.latencyMs} ms`,
    `- Events: ${Object.entries(result.eventCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`,
    "",
    "## Placement vs ground truth",
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Correct (page + IoU ≥ ${s.iouThreshold}) | ${s.correct} / ${s.totalTruth} |`,
    `| Precision | ${formatPercent(s.precision)} |`,
    `| Recall | ${formatPercent(s.recall)} |`,
    `| F1 | ${s.f1.toFixed(2)} |`,
    `| Mean dx (page widths) | ${s.offset.meanDx.toFixed(5)} |`,
    `| Mean dy (page heights) | ${s.offset.meanDy.toFixed(5)} |`,
    `| Page / type / signer match | ${formatPercent(s.offset.pageMatchRate)} / ${formatPercent(s.offset.typeMatchRate)} / ${formatPercent(s.offset.signerMatchRate)} |`,
    "",
    "## Per field type",
    "",
    `| Type | Truth | Predicted | Correct | Precision | Recall |`,
    `| --- | ---: | ---: | ---: | ---: | ---: |`,
    ...(["signature", "initials", "date", "name"] as const).map((type) => {
      const row = s.perType[type];
      return `| ${type} | ${row.truth} | ${row.predicted} | ${row.correct} | ${formatPercent(row.precision)} | ${formatPercent(row.recall)} |`;
    }),
    "",
    "## Low-confidence flags vs actual errors",
    "",
    `| Flagged | True positives (flagged & wrong) | False positives (flagged & right) | False negatives (unflagged & wrong) |`,
    `| ---: | ---: | ---: | ---: |`,
    `| ${s.lowConfidence.flagged} | ${s.lowConfidence.truePositives} | ${s.lowConfidence.falsePositives} | ${s.lowConfidence.falseNegatives} |`,
    "",
  ];
  if (result.usage) {
    lines.push(
      "## Tokens / cost estimate",
      "",
      `| Model | Input | Output | Est. USD |`,
      `| --- | ---: | ---: | ---: |`,
      `| ${result.usage.model} | ${result.usage.inputTokens} | ${result.usage.outputTokens} | $${result.usage.estimatedUsd.toFixed(4)} |`,
      "",
    );
  } else {
    lines.push("## Tokens / cost estimate", "", "Mock mode: no model calls.", "");
  }
  if (afterFix) {
    lines.push(
      "## After scripted human corrections (mock)",
      "",
      `Correct ${afterFix.correct}/${afterFix.totalTruth} · precision ${formatPercent(afterFix.precision)} · recall ${formatPercent(afterFix.recall)}`,
      "",
    );
  }
  if (result.notes.length) {
    lines.push("## Notes", "", ...result.notes.map((n) => `- ${n}`), "");
  }
  return `${lines.join("\n")}\n`;
}
