import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EventType, type BaseEvent } from "@ag-ui/core";
import type { EnvelopeState, EvalResult, ScoringReport, TokenUsageEstimate } from "../shared/types";
import { cloneEnvelope, describeCorrections, initialEnvelope } from "../shared/envelope";
import { applyStatePatch } from "../shared/json-patch";
import { applyApprovalPayload, defaultApprovalPayload } from "../shared/interrupt-schema";
import { groundTruthFromLayout, pdfBoxToNorm, PDF_FIELDS } from "../shared/layout";
import { formatPercent, scoreEnvelope } from "../shared/scoring";
import { uid } from "../shared/ids";
import { runMockAgent } from "../server/mock-agent";
import { liveConfigured, runLiveAgent } from "../server/live-agent";
import type { RunAgentInput } from "@ag-ui/core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const truth = groundTruthFromLayout();

function parseArgs(argv: string[]): { mode: "mock" | "live" } {
  const idx = argv.indexOf("--mode");
  const value = idx >= 0 ? argv[idx + 1] : argv.find((a) => a.startsWith("--mode="))?.split("=")[1];
  return { mode: value === "live" ? "live" : "mock" };
}

function countEvents(events: BaseEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }
  return counts;
}

function applyStateEvent(state: EnvelopeState, event: BaseEvent): EnvelopeState {
  if (event.type === EventType.STATE_SNAPSHOT) {
    return (event as unknown as { snapshot: EnvelopeState }).snapshot;
  }
  if (event.type === EventType.STATE_DELTA) {
    try {
      return applyStatePatch(
        state,
        (event as unknown as { delta: Parameters<typeof applyStatePatch>[1] }).delta,
      );
    } catch {
      return state;
    }
  }
  return state;
}

function scriptedCorrections(agentState: EnvelopeState): EnvelopeState {
  let next = cloneEnvelope(agentState);
  next.fields = next.fields.map((field) => {
    if (field.id === "priya-initials") {
      return {
        ...field,
        page: 6,
        bbox: pdfBoxToNorm(PDF_FIELDS["priya-initials"]),
        source: "human",
        confidence: 1,
      };
    }
    if (field.id === "jordan-date") {
      return {
        ...field,
        page: 6,
        bbox: pdfBoxToNorm(PDF_FIELDS["jordan-date"]),
        source: "human",
        confidence: 1,
      };
    }
    return field;
  });
  return next;
}

async function collectRun(
  mode: "mock" | "live",
  input: RunAgentInput,
): Promise<{ events: BaseEvent[]; state: EnvelopeState; usage: TokenUsageEstimate | null }> {
  const events: BaseEvent[] = [];
  let state = initialEnvelope();
  const send = (event: BaseEvent) => {
    events.push(event);
    state = applyStateEvent(state, event);
  };
  if (mode === "live") {
    await runLiveAgent(input, send);
  } else {
    await runMockAgent(input, send, { delayMs: 0 });
  }
  const finished = events.find((e) => e.type === EventType.RUN_FINISHED) as
    | { usage?: TokenUsageEstimate[] }
    | undefined;
  const usage = finished?.usage?.[0] ?? null;
  return { events, state, usage };
}

function renderSummary(result: EvalResult, afterFix?: ScoringReport): string {
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

async function main() {
  const { mode } = parseArgs(process.argv.slice(2));
  if (mode === "live" && !liveConfigured()) {
    console.error("LIVE eval requires GEMINI_API_KEY. Run `bun run eval:mock` without a key.");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const input: RunAgentInput = {
    threadId: uid("thread"),
    runId: uid("run"),
    messages: [],
    tools: [],
    context: [],
    forwardedProps: { mode, delayMs: 0 },
  };
  const first = await collectRun(mode, input);
  const agentState = first.state;
  const scoring = scoreEnvelope(agentState, truth);
  let afterFix: ScoringReport | undefined;
  let corrections = describeCorrections(agentState, agentState);

  if (mode === "mock") {
    const corrected = scriptedCorrections(agentState);
    corrections = describeCorrections(agentState, corrected);
    const resumeInput: RunAgentInput = {
      ...input,
      runId: uid("run"),
      state: corrected,
      resume: [
        {
          interruptId: "int_confirm_envelope",
          status: "resolved",
          payload: defaultApprovalPayload(corrected),
        },
      ],
    };
    const second = await collectRun(mode, resumeInput);
    const approved = applyApprovalPayload(corrected, defaultApprovalPayload(corrected));
    afterFix = scoreEnvelope(second.state.fields.length ? second.state : approved, truth, {
      humanCorrections: corrections,
    });
  }

  const finishedAt = new Date().toISOString();
  const result: EvalResult = {
    mode,
    startedAt,
    finishedAt,
    latencyMs: Math.round(performance.now() - t0),
    eventCounts: countEvents(first.events),
    scoring,
    usage: first.usage,
    summaryMarkdown: "",
    notes:
      mode === "mock"
        ? [
            "Mock agent intentionally misplaces jordan-date (offset bbox, confidence 0.42) and priya-initials (page 5 instead of 6, confidence 0.36).",
            "Scripted human corrections move those two fields onto ground truth; resume scoring is recorded separately.",
          ]
        : [
            "Live eval uses pdf.js text items (no page-image vision) and Gemini function calling.",
            "No API key is committed. CI never runs this mode.",
          ],
  };
  result.summaryMarkdown = renderSummary(result, afterFix);

  const outDir = mode === "mock" ? join(ROOT, "results/mock") : join(ROOT, "results");
  mkdirSync(outDir, { recursive: true });
  const jsonName = mode === "mock" ? "live.json" : "live.json";
  writeFileSync(join(outDir, jsonName), `${JSON.stringify({ ...result, afterFix, corrections }, null, 2)}\n`);
  writeFileSync(join(outDir, "SUMMARY.md"), result.summaryMarkdown);
  console.log(result.summaryMarkdown);
  console.log(`Wrote ${join(outDir, jsonName)} and ${join(outDir, "SUMMARY.md")}`);
}

await main();
