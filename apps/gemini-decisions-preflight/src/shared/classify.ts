import { CHECKS, CHECK_BY_ID, CONFIDENCE_THRESHOLD } from "./questions.ts";
import type {
  Answer,
  ChoiceAnswer,
  ClassifiedCheck,
  ExpectedAnswer,
  GroundTruth,
  NoulAnswer,
  ScoreAnswer,
  Verdict,
} from "./types.ts";

export type ClassifyOptions = {
  confidenceThreshold?: number;
  expected?: GroundTruth["expected"];
};

function noulYes(answer: NoulAnswer): boolean {
  return answer.noul >= 0.5;
}

function discreteScoreLevel(answer: ScoreAnswer): number {
  let best = "0";
  let bestP = -1;
  for (const [k, p] of Object.entries(answer.probabilities)) {
    if (p > bestP) {
      bestP = p;
      best = k;
    }
  }
  return Number(best);
}

export function documentTypeFromAnswers(
  answers: Record<string, Answer>,
): "msa" | "nda" | "other" {
  const a = answers.document_type;
  if (a?.type === "choice") {
    if (a.choice === "msa" || a.choice === "nda") return a.choice;
  }
  return "other";
}

function documentTypeConfident(
  answers: Record<string, Answer>,
  threshold: number,
): boolean {
  const a = answers.document_type;
  return a?.type === "choice" && a.confidence >= threshold;
}

export function classifyAnswers(
  answers: Record<string, Answer>,
  options: ClassifyOptions = {},
): ClassifiedCheck[] {
  const threshold = options.confidenceThreshold ?? CONFIDENCE_THRESHOLD;
  const doc = documentTypeFromAnswers(answers);
  const typeOk = documentTypeConfident(answers, threshold);
  const rows: ClassifiedCheck[] = [];

  for (const check of CHECKS) {
    const answer = answers[check.id];
    if (!answer) continue;

    let verdict: Verdict = "human";
    const needsType = check.appliesTo !== "all";
    const applicable =
      check.appliesTo === "all" ||
      (check.appliesTo === "msa" && doc === "msa") ||
      (check.appliesTo === "nda" && doc === "nda");

    if (needsType && !typeOk) {
      verdict = "human";
    } else if (!applicable) {
      verdict = "na";
    } else if (answer.confidence < threshold) {
      verdict = "human";
    } else if (check.ui.kind === "noul_info" && answer.type === "noul") {
      verdict = "pass";
    } else if (check.ui.kind === "noul_issue" && answer.type === "noul") {
      verdict = noulYes(answer) ? "fail" : "pass";
    } else if (check.ui.kind === "noul_requirement" && answer.type === "noul") {
      verdict = noulYes(answer) ? "pass" : "fail";
    } else if (check.ui.kind === "choice" && answer.type === "choice") {
      if (check.ui.failValues.includes(answer.choice)) verdict = "fail";
      else if (check.ui.humanValues?.includes(answer.choice)) verdict = "human";
      else verdict = "pass";
    } else if (check.ui.kind === "score" && answer.type === "score") {
      if (check.ui.failAbove != null && answer.score > check.ui.failAbove) {
        verdict = "fail";
      } else if (check.ui.failBelow != null && answer.score < check.ui.failBelow) {
        verdict = "fail";
      } else {
        verdict = "pass";
      }
    }

    rows.push({
      id: check.id,
      label: check.label,
      group: check.group,
      hint: check.hint,
      verdict,
      answer,
      expected: options.expected?.[check.id],
    });
  }

  return rows;
}

export function predictedProblem(checkId: string, answer: Answer): boolean {
  const check = CHECK_BY_ID[checkId];
  if (!check) return false;
  if (check.ui.kind === "noul_issue" && answer.type === "noul") {
    return noulYes(answer);
  }
  if (check.ui.kind === "noul_requirement" && answer.type === "noul") {
    return !noulYes(answer);
  }
  if (check.ui.kind === "choice" && answer.type === "choice") {
    return check.ui.failValues.includes(answer.choice);
  }
  if (check.ui.kind === "score" && answer.type === "score") {
    if (check.ui.failAbove != null && answer.score > check.ui.failAbove) return true;
    if (check.ui.failBelow != null && answer.score < check.ui.failBelow) return true;
  }
  return false;
}

export function expectedProblem(
  checkId: string,
  expected: ExpectedAnswer,
): boolean {
  const check = CHECK_BY_ID[checkId];
  if (!check) return false;
  if (expected.type === "noul") {
    if (check.ui.kind === "noul_issue") return expected.yes;
    if (check.ui.kind === "noul_requirement") return !expected.yes;
  }
  if (expected.type === "choice" && check.ui.kind === "choice") {
    return check.ui.failValues.includes(expected.choice);
  }
  if (expected.type === "score" && check.ui.kind === "score") {
    if (check.ui.failAbove != null && expected.level > check.ui.failAbove) return true;
    if (check.ui.failBelow != null && expected.level < check.ui.failBelow) return true;
  }
  return false;
}

export function answersMatchExpected(
  answer: Answer,
  expected: ExpectedAnswer,
): boolean {
  if (expected.type === "noul" && answer.type === "noul") {
    return noulYes(answer) === expected.yes;
  }
  if (expected.type === "choice" && answer.type === "choice") {
    return answer.choice === expected.choice;
  }
  if (expected.type === "score" && answer.type === "score") {
    return discreteScoreLevel(answer) === expected.level;
  }
  return false;
}

export function counts(rows: ClassifiedCheck[]): {
  pass: number;
  fail: number;
  human: number;
  na: number;
} {
  const out = { pass: 0, fail: 0, human: 0, na: 0 };
  for (const row of rows) out[row.verdict] += 1;
  return out;
}

export function asChoice(answer: Answer): ChoiceAnswer | null {
  return answer.type === "choice" ? answer : null;
}
