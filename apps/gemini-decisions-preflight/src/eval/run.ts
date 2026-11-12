import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import { GROUND_TRUTHS } from "../fixtures/truth.ts";
import { CHECKS } from "../shared/questions.ts";
import { resolveMode } from "../shared/mode.ts";
import { decisionsUsd, flashUsd, formatUsd } from "../shared/cost.ts";
import { loadFixturePdf, runDecisions, runGenerative } from "../api/adapter.ts";
import { aggregate, pct, scoreFixture, type SuiteScore } from "./metrics.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

try {
  loadEnvFile(path.join(ROOT, ".env"));
} catch {
  // .env is optional
}

type Side = {
  label: string;
  model: string;
  mode: string;
  suite: SuiteScore;
  raw: unknown[];
};

function renderSummary(decisions: Side, generative: Side, outDir: string): string {
  const mock = decisions.mode === "mock";
  const banner = mock
    ? [
        "# MOCK evaluation — not a live Gemini run",
        "",
        "> These numbers were produced by the **recorded/mock adapter**. They are not calibrated model quality, not real latency, and not a real cost. Do not cite them as Decisions vs Flash results. Re-run with `GEMINI_API_KEY` set (and `DECISIONS_MODE=auto` or `live`) to write live files under `results/`.",
        "",
      ]
    : [
        "# Live evaluation — Gemini Decisions vs generative Flash",
        "",
        "> Produced with `GEMINI_API_KEY`. Decisions model `gemini-decision-1`; generative model as recorded below.",
        "",
      ];

  const rows = CHECKS.map((c) => {
    const d = decisions.suite.perCheck.find((x) => x.id === c.id)!;
    const g = generative.suite.perCheck.find((x) => x.id === c.id)!;
    return `| \`${c.id}\` | ${c.label} | ${d.correct}/${d.total} (${pct(d.accuracy)}) | ${g.correct}/${g.total} (${pct(g.accuracy)}) |`;
  });

  const d = decisions.suite;
  const g = generative.suite;

  return [
    ...banner,
    `Output directory: \`${path.relative(ROOT, outDir)}\``,
    "",
    "## Head-to-head",
    "",
    "| | Decisions API | Generative Flash |",
    "| --- | --- | --- |",
    `| Mode | ${decisions.mode}${mock ? " (MOCK)" : ""} | ${generative.mode}${mock ? " (MOCK)" : ""} |`,
    `| Model | ${decisions.model} | ${generative.model} |`,
    `| Overall accuracy vs ground truth | **${pct(d.overallAccuracy)}** | **${pct(g.overallAccuracy)}** |`,
    `| Precision (planted issues) | ${pct(d.precision)} | ${pct(g.precision)} |`,
    `| Recall (planted issues) | ${pct(d.recall)} | ${pct(g.recall)} |`,
    `| F1 (planted issues) | ${d.f1.toFixed(3)} | ${g.f1.toFixed(3)} |`,
    `| Latency p50 | ${d.p50LatencyMs} ms | ${g.p50LatencyMs} ms |`,
    `| Latency p95 | ${d.p95LatencyMs} ms | ${g.p95LatencyMs} ms |`,
    `| Input tokens (sum) | ${d.totalInputTokens} | ${g.totalInputTokens} |`,
    `| Output tokens (sum) | ${d.totalOutputTokens} (always 0 when live) | ${g.totalOutputTokens} |`,
    `| Estimated token cost | ${formatUsd(d.totalUsd)} | ${formatUsd(g.totalUsd)} |`,
    "",
    "## Per fixture",
    "",
    "### Decisions",
    "",
    "| Fixture | Accuracy | TP | FP | FN | Latency | Cost |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...d.fixtures.map(
      (f) =>
        `| ${f.fixtureId} | ${f.correct}/${f.total} | ${f.tp} | ${f.fp} | ${f.fn} | ${f.latencyMs} ms | ${formatUsd(f.usd)} |`,
    ),
    "",
    "### Generative",
    "",
    "| Fixture | Accuracy | TP | FP | FN | Latency | Cost |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...g.fixtures.map(
      (f) =>
        `| ${f.fixtureId} | ${f.correct}/${f.total} | ${f.tp} | ${f.fp} | ${f.fn} | ${f.latencyMs} ms | ${formatUsd(f.usd)} |`,
    ),
    "",
    "## Per-check accuracy vs ground truth",
    "",
    "| Check | Label | Decisions | Generative |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    "## Scoring notes",
    "",
    "- **noul**: predicted yes if `noul >= 0.5`, compared to ground-truth `yes`.",
    "- **choice**: predicted `choice` vs ground-truth option id.",
    "- **score**: argmax of `probabilities` vs ground-truth discrete level.",
    "- **Planted issues**: check ids listed in each fixture’s `*.truth.json` `plantedIssues`. Precision/recall treat a “problem fire” using the same green/red polarity as the UI (issue-yes, requirement-no, fail-valued choice, fail-band score).",
    "- Clean fixtures have empty `plantedIssues`. Auto-renewal on the clean MSA is expected and is not counted as a planted defect.",
    mock
      ? "- Mock generative deliberately flips a couple of planted checks so this table is structurally non-identical. That is fixture wiring, not a model result."
      : "- Generative baseline uses structured JSON (`responseMimeType: application/json`) with the same question set, not the Decisions endpoint.",
    "",
  ].join("\n");
}

async function main() {
  const mode = resolveMode();
  const outDir = mode === "mock" ? path.join(ROOT, "results/mock") : path.join(ROOT, "results");
  await mkdir(outDir, { recursive: true });

  const dHits: Record<string, { correct: number; total: number }> = {};
  const gHits: Record<string, { correct: number; total: number }> = {};
  const dFix = [];
  const gFix = [];
  const dRaw = [];
  const gRaw = [];
  let dModel = "";
  let gModel = "";

  for (const truth of GROUND_TRUTHS) {
    const pdf = await loadFixturePdf(truth.id);
    const d = await runDecisions({ pdfBytes: pdf, fixtureId: truth.id });
    const g = await runGenerative({ pdfBytes: pdf, fixtureId: truth.id });
    dModel = d.model;
    gModel = g.model;

    const ds = scoreFixture(truth, d.response.answers, {
      latencyMs: d.latencyMs,
      inputTokens: d.response.usage.total_input_tokens,
      outputTokens: d.response.usage.total_output_tokens,
      usd: decisionsUsd(d.response.usage),
    });
    const gs = scoreFixture(truth, g.response.answers, {
      latencyMs: g.latencyMs,
      inputTokens: g.response.usage.total_input_tokens,
      outputTokens: g.response.usage.total_output_tokens,
      usd: flashUsd(g.response.usage),
    });
    dFix.push(ds.fixture);
    gFix.push(gs.fixture);
    for (const [id, ok] of Object.entries(ds.perCheck)) {
      dHits[id] ??= { correct: 0, total: 0 };
      dHits[id].total += 1;
      if (ok) dHits[id].correct += 1;
    }
    for (const [id, ok] of Object.entries(gs.perCheck)) {
      gHits[id] ??= { correct: 0, total: 0 };
      gHits[id].total += 1;
      if (ok) gHits[id].correct += 1;
    }
    dRaw.push({
      fixtureId: truth.id,
      mode: d.mode,
      model: d.model,
      latencyMs: d.latencyMs,
      usage: d.response.usage,
      answers: d.response.answers,
    });
    gRaw.push({
      fixtureId: truth.id,
      mode: g.mode,
      model: g.model,
      latencyMs: g.latencyMs,
      usage: g.response.usage,
      answers: g.response.answers,
    });
    console.log(
      `${truth.id}: decisions ${ds.fixture.correct}/${ds.fixture.total} in ${d.latencyMs}ms · generative ${gs.fixture.correct}/${gs.fixture.total} in ${g.latencyMs}ms`,
    );
  }

  const dSuite = aggregate(dFix, dHits);
  const gSuite = aggregate(gFix, gHits);
  const decisionsSide: Side = {
    label: "decisions",
    model: dModel,
    mode,
    suite: dSuite,
    raw: dRaw,
  };
  const generativeSide: Side = {
    label: "generative",
    model: gModel,
    mode,
    suite: gSuite,
    raw: gRaw,
  };

  await writeFile(
    path.join(outDir, "decisions.json"),
    JSON.stringify({ mock: mode === "mock", generatedAt: new Date().toISOString(), runs: dRaw, suite: dSuite }, null, 2) +
      "\n",
  );
  await writeFile(
    path.join(outDir, "generative.json"),
    JSON.stringify({ mock: mode === "mock", generatedAt: new Date().toISOString(), runs: gRaw, suite: gSuite }, null, 2) +
      "\n",
  );
  const summary = renderSummary(decisionsSide, generativeSide, outDir);
  await writeFile(path.join(outDir, "SUMMARY.md"), summary);
  console.log(`Wrote ${path.relative(ROOT, outDir)}/decisions.json, generative.json, SUMMARY.md`);
  if (mode === "mock") {
    console.log("MOCK run complete. Live numbers require GEMINI_API_KEY.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
