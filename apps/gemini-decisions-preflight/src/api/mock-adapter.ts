import { CHECKS, QUESTION_MAP } from "../shared/questions.ts";
import { estimateTokensFromChars } from "../shared/cost.ts";
import { extractPdfText, fixtureIdFromText } from "../shared/extract-text.ts";
import { TRUTH_BY_ID } from "../fixtures/truth.ts";
import type {
  Answer,
  ChoiceAnswer,
  DecisionsResponse,
  ExpectedAnswer,
  GroundTruth,
  NoulAnswer,
  ScoreAnswer,
  Usage,
} from "../shared/types.ts";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clampNoul(n: number): number {
  return Math.min(0.99, Math.max(0.01, n));
}

function noulAnswer(yes: boolean, rng: () => number): NoulAnswer {
  const noul = clampNoul(yes ? 0.93 + rng() * 0.05 : 0.02 + rng() * 0.05);
  return { type: "noul", noul, confidence: Math.max(noul, 1 - noul) };
}

function choiceAnswer(criteria: Record<string, string>, winner: string, rng: () => number): ChoiceAnswer {
  const keys = Object.keys(criteria).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const pick = keys.includes(winner) ? winner : keys[0];
  const rest = 0.04 + rng() * 0.04;
  const winnerP = 1 - rest;
  const others = keys.filter((k) => k !== pick);
  const probabilities: Record<string, number> = { [pick]: winnerP };
  let remaining = rest;
  others.forEach((k, i) => {
    if (i === others.length - 1) probabilities[k] = remaining;
    else {
      const slice = remaining * (0.3 + rng() * 0.4);
      probabilities[k] = slice;
      remaining -= slice;
    }
  });
  return { type: "choice", choice: pick, probabilities, confidence: winnerP };
}

function scoreAnswer(criteria: string[], level: number, rng: () => number): ScoreAnswer {
  const idx = Math.min(criteria.length - 1, Math.max(0, level));
  const rest = 0.06 + rng() * 0.05;
  const top = 1 - rest;
  const probabilities: Record<string, number> = {};
  const legend: Record<string, string> = {};
  let leftover = rest;
  for (let i = 0; i < criteria.length; i++) {
    legend[String(i)] = criteria[i];
    if (i === idx) probabilities[String(i)] = top;
    else if (i === criteria.length - 1 && idx !== i) {
      probabilities[String(i)] = leftover;
    } else if (i !== idx) {
      const slice = leftover / Math.max(1, criteria.length - 1);
      probabilities[String(i)] = slice;
      leftover -= slice;
    }
  }
  let score = 0;
  for (let i = 0; i < criteria.length; i++) score += i * (probabilities[String(i)] ?? 0);
  return { type: "score", score, legend, probabilities, confidence: top };
}

function fromExpected(expected: ExpectedAnswer, question: (typeof CHECKS)[number]["question"], rng: () => number): Answer {
  if (expected.type === "noul" && question.type === "noul") return noulAnswer(expected.yes, rng);
  if (expected.type === "choice" && question.type === "choice") {
    return choiceAnswer(question.criteria, expected.choice, rng);
  }
  if (expected.type === "score" && question.type === "score") {
    return scoreAnswer(question.criteria, expected.level, rng);
  }
  throw new Error("expected/question type mismatch");
}

function heuristicTruth(text: string): GroundTruth {
  const lower = text.toLowerCase();
  const isNda = /\bnon-disclosure\b|\bnda\b/.test(lower);
  const base = isNda ? TRUTH_BY_ID["nda-clean"] : TRUTH_BY_ID["msa-clean"];
  const expected = { ...base.expected };
  const issues: string[] = [];
  const setN = (id: string, yes: boolean, plant = true) => {
    expected[id] = { type: "noul", yes };
    if (plant) issues.push(id);
  };
  if (/the client\b/.test(lower) && !/northwind/.test(lower)) {
    setN("missing_counterparty_name", true);
    setN("parties_both_named", false);
  }
  if (/disclosing party:\s*_+/.test(lower)) {
    setN("missing_counterparty_name", true);
    setN("parties_both_named", false);
  }
  if (/effective date:\s*_+/.test(lower) || /term begins:\s*_+/.test(lower)) {
    setN("empty_date_fields", true);
    setN("missing_effective_date", true);
  }
  if (/initial each page|initial here/.test(lower)) setN("empty_initial_fields", true);
  if (/term:\s*as agreed|term duration is not stated/.test(lower)) setN("missing_term_duration", true);
  if (/must be witnessed|signed before a witness/.test(lower)) setN("missing_witness_block", true);
  if (/wet ink only|electronic signatures are not permitted/.test(lower)) setN("e_sign_permitted", false);
  if (/auto-renews/.test(lower) && /no opt-out notice/.test(lower)) {
    expected.auto_renewal_clause = { type: "noul", yes: true };
    expected.renewal_type = { type: "choice", choice: "without_notice" };
    issues.push("renewal_type");
  }
  if (/exhibit b|schedule 1/.test(lower) && /not attached/.test(lower)) {
    setN("referenced_exhibits_missing", true);
  }
  if (/vendor's principal place|vendor's home/.test(lower)) {
    setN("governing_law_specified", false);
    expected.governing_law = { type: "choice", choice: "unspecified" };
    issues.push("governing_law");
  }
  if (/england and wales/.test(lower)) {
    expected.governing_law = { type: "choice", choice: "england_wales" };
  }
  if (/may assign this agreement freely|assign this agreement without consent/.test(lower)) {
    setN("assignment_without_consent", true);
  }
  const unique = [...new Set(issues)];
  return {
    id: "upload-heuristic",
    title: "Uploaded PDF (heuristic mock)",
    documentType: isNda ? "nda" : "msa",
    planted: unique.length > 0,
    expected,
    plantedIssues: unique,
  };
}

export function identifyFixture(pdfBytes: Uint8Array, hintId?: string): GroundTruth {
  if (hintId && TRUTH_BY_ID[hintId]) return TRUTH_BY_ID[hintId];
  const text = extractPdfText(pdfBytes);
  const fromMark = fixtureIdFromText(text);
  if (fromMark && TRUTH_BY_ID[fromMark]) return TRUTH_BY_ID[fromMark];
  return heuristicTruth(text);
}

function usageFor(pdfBytes: Uint8Array, extraChars: number): Usage {
  const text = extractPdfText(pdfBytes);
  const qChars = extraChars;
  const textTokens = estimateTokensFromChars(text.length + qChars);
  const pageImages = Math.max(1, (text.match(/LUMIN_FIXTURE:/g) ?? []).length) * 258;
  const total = textTokens + pageImages;
  return {
    total_input_tokens: total,
    input_tokens_by_modality: [
      { modality: "text", tokens: textTokens },
      { modality: "image", tokens: pageImages },
    ],
    total_output_tokens: 0,
    total_tokens: total,
  };
}

export type MockKind = "decisions" | "generative";

export function mockDecide(opts: {
  pdfBytes: Uint8Array;
  fixtureId?: string;
  kind?: MockKind;
}): { response: DecisionsResponse; truth: GroundTruth; latencyMs: number } {
  const kind: MockKind = opts.kind ?? "decisions";
  const truth = identifyFixture(opts.pdfBytes, opts.fixtureId);
  const rng = mulberry32(seedFrom(`${kind}:${truth.id}`));
  const answers: Record<string, Answer> = {};
  const flips = new Set<string>();
  if (kind === "generative" && truth.planted) {
    if (truth.id === "msa-planted") {
      flips.add("assignment_without_consent");
      flips.add("empty_initial_fields");
    }
    if (truth.id === "nda-planted") {
      flips.add("force_majeure");
    }
  }
  for (const check of CHECKS) {
    const expected = truth.expected[check.id];
    if (!expected) continue;
    let used = expected;
    if (flips.has(check.id) && expected.type === "noul") {
      used = { type: "noul", yes: !expected.yes };
    }
    answers[check.id] = fromExpected(used, check.question, rng);
    if (kind === "generative" && answers[check.id].type === "noul") {
      const a = answers[check.id] as NoulAnswer;
      a.noul = clampNoul(a.noul + (rng() - 0.5) * 0.08);
      a.confidence = Math.max(a.noul, 1 - a.noul);
    }
  }
  const qChars = Object.values(QUESTION_MAP).reduce((n, q) => n + q.instructions.length, 0);
  const usage = usageFor(opts.pdfBytes, qChars);
  if (kind === "generative") {
    usage.total_output_tokens = 900 + Math.round(rng() * 200);
    usage.total_tokens += usage.total_output_tokens;
  }
  const latencyMs =
    kind === "decisions" ? 168 + Math.round(rng() * 40) : 880 + Math.round(rng() * 180);
  return { response: { answers, usage }, truth, latencyMs };
}
