import type { Candidates } from "../src/types";
import { resolveJevProvider } from "./keys";
import { INTENT_CRITERIA, buildQuestions } from "./questions";
import { composeProposals, type Judgment } from "./proposals";

type ChoiceAnswer = {
  type?: string;
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
};

type ScoreAnswer = {
  type?: string;
  score?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
};

function asChoice(answer: ChoiceAnswer | undefined, allowed?: string[]): ChoiceAnswer {
  const choice = answer?.choice;
  const probabilities = answer?.probabilities ?? {};
  if (!choice) throw new Error("TypeSafe Choice answer missing `choice`.");
  if (allowed && !allowed.includes(choice) && choice !== "none") {
    throw new Error(`TypeSafe Choice returned unexpected option: ${choice}`);
  }
  return {
    type: "choice",
    choice,
    probabilities,
    confidence: typeof answer?.confidence === "number" ? answer.confidence : undefined,
  };
}

function asScore(answer: ScoreAnswer | undefined): ScoreAnswer {
  if (typeof answer?.score !== "number" || !Number.isFinite(answer.score)) {
    throw new Error("TypeSafe Score answer missing numeric `score`.");
  }
  return {
    type: "score",
    score: answer.score,
    probabilities: answer.probabilities ?? {},
    confidence: typeof answer.confidence === "number" ? answer.confidence : undefined,
  };
}

export async function liveClassify(clipboard: string, candidates: Candidates) {
  const provider = resolveJevProvider();
  if (!provider) throw new Error("No Jev API key configured");

  const questions = buildQuestions(clipboard, candidates);
  const body = {
    model: provider.model,
    state: {
      clipboard,
      workspace:
        "Mock Lumin Sign envelope: signer chips, company, notice address, notice email, clause block.",
      candidates,
    },
    questions,
  };

  const started = Date.now();
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Model provider returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }

  const result = (await response.json()) as {
    model?: string;
    answers?: Record<string, ChoiceAnswer & ScoreAnswer>;
  };

  const answers = result.answers ?? {};
  const judgment: Judgment = {
    intent: asChoice(answers.intent, Object.keys(INTENT_CRITERIA)),
    paste_fit: asScore(answers.paste_fit),
    primary_target: answers.primary_target ? asChoice(answers.primary_target) : undefined,
    signer_email: answers.signer_email ? asChoice(answers.signer_email) : undefined,
    notice_email: answers.notice_email ? asChoice(answers.notice_email) : undefined,
    company_span: answers.company_span ? asChoice(answers.company_span) : undefined,
    address_span: answers.address_span ? asChoice(answers.address_span) : undefined,
    clause_span: answers.clause_span ? asChoice(answers.clause_span) : undefined,
  };

  return {
    model: result.model ?? provider.model,
    judgment,
    proposals: composeProposals(clipboard, candidates, judgment),
    latency_ms: Date.now() - started,
  };
}
