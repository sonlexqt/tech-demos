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
      endpoint: "POST /v1/signature_request/send",
      dto: "SignatureRequestDTO: title, signers[], expires_at (ms), optional viewers[], signing_type, custom_email, use_text_tags, file_url",
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
    viewer_email: answers.viewer_email ? asChoice(answers.viewer_email) : undefined,
    title_span: answers.title_span ? asChoice(answers.title_span) : undefined,
    expire_span: answers.expire_span ? asChoice(answers.expire_span) : undefined,
    signing_type: answers.signing_type ? asChoice(answers.signing_type) : undefined,
    subject_span: answers.subject_span ? asChoice(answers.subject_span) : undefined,
  };

  return {
    model: result.model ?? provider.model,
    judgment,
    proposals: composeProposals(clipboard, candidates, judgment),
    latency_ms: Date.now() - started,
  };
}
