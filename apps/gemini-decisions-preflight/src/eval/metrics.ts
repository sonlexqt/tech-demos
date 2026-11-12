import { CHECKS } from "../shared/questions.ts";
import { answersMatchExpected, expectedProblem, predictedProblem } from "../shared/classify.ts";
import type { Answer, GroundTruth } from "../shared/types.ts";

export type CheckScore = {
  id: string;
  correct: number;
  total: number;
  accuracy: number;
};

export type FixtureScore = {
  fixtureId: string;
  correct: number;
  total: number;
  planted: string[];
  tp: number;
  fp: number;
  fn: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  usd: number;
};

export type SuiteScore = {
  perCheck: CheckScore[];
  overallAccuracy: number;
  precision: number;
  recall: number;
  f1: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalUsd: number;
  fixtures: FixtureScore[];
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function scoreFixture(
  truth: GroundTruth,
  answers: Record<string, Answer>,
  meta: { latencyMs: number; inputTokens: number; outputTokens: number; usd: number },
): { perCheck: Record<string, boolean>; fixture: FixtureScore } {
  const perCheck: Record<string, boolean> = {};
  let correct = 0;
  let total = 0;
  for (const check of CHECKS) {
    const expected = truth.expected[check.id];
    if (!expected) continue;
    const answer = answers[check.id];
    total += 1;
    const ok = Boolean(answer) && answersMatchExpected(answer, expected);
    perCheck[check.id] = ok;
    if (ok) correct += 1;
  }

  const planted = new Set(truth.plantedIssues);
  let tp = 0;
  let fp = 0;
  let fn = 0;
  for (const check of CHECKS) {
    const expected = truth.expected[check.id];
    if (!expected) continue;
    const answer = answers[check.id];
    const pred = answer ? predictedProblem(check.id, answer) : false;
    const isPlanted = planted.has(check.id);
    if (isPlanted && !answer) fn += 1;
    else if (isPlanted && pred) tp += 1;
    else if (isPlanted && !pred) fn += 1;
    else if (!isPlanted && pred && expectedProblem(check.id, expected)) {
      // expected problem that is not in plantedIssues (e.g. auto-renewal on clean MSA) — not an FP
    } else if (!isPlanted && pred && !expectedProblem(check.id, expected)) {
      fp += 1;
    }
  }

  return {
    perCheck,
    fixture: {
      fixtureId: truth.id,
      correct,
      total,
      planted: truth.plantedIssues,
      tp,
      fp,
      fn,
      latencyMs: meta.latencyMs,
      inputTokens: meta.inputTokens,
      outputTokens: meta.outputTokens,
      usd: meta.usd,
    },
  };
}

export function aggregate(
  fixtures: FixtureScore[],
  perCheckHits: Record<string, { correct: number; total: number }>,
): SuiteScore {
  const perCheck: CheckScore[] = CHECKS.map((c) => {
    const h = perCheckHits[c.id] ?? { correct: 0, total: 0 };
    return {
      id: c.id,
      correct: h.correct,
      total: h.total,
      accuracy: h.total ? h.correct / h.total : 0,
    };
  });
  const totCorrect = perCheck.reduce((n, r) => n + r.correct, 0);
  const tot = perCheck.reduce((n, r) => n + r.total, 0);
  const tp = fixtures.reduce((n, f) => n + f.tp, 0);
  const fp = fixtures.reduce((n, f) => n + f.fp, 0);
  const fn = fixtures.reduce((n, f) => n + f.fn, 0);
  const precision = tp + fp ? tp / (tp + fp) : 1;
  const recall = tp + fn ? tp / (tp + fn) : 1;
  const lat = fixtures.map((f) => f.latencyMs).sort((a, b) => a - b);
  return {
    perCheck,
    overallAccuracy: tot ? totCorrect / tot : 0,
    precision,
    recall,
    f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    p50LatencyMs: percentile(lat, 50),
    p95LatencyMs: percentile(lat, 95),
    totalInputTokens: fixtures.reduce((n, f) => n + f.inputTokens, 0),
    totalOutputTokens: fixtures.reduce((n, f) => n + f.outputTokens, 0),
    totalUsd: fixtures.reduce((n, f) => n + f.usd, 0),
    fixtures,
  };
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
