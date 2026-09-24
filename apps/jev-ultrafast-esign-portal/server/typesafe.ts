import type { Decision, DecideRequest, JevElement, Operation } from "../src/types";
import { resolveJevProvider } from "./keys";
import { NEXT_ACTION, OPERATION_LABELS, TARGET } from "./questions";
import { fieldText } from "./text";

type ChoiceAnswer = {
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
};

function validateChoice(answer: ChoiceAnswer | undefined, ids: string[]): Required<ChoiceAnswer> {
  const probabilities = answer?.probabilities ?? {};
  const numbers = [...Object.values(probabilities), answer?.confidence ?? NaN];
  const valid =
    !!answer?.choice &&
    ids.includes(answer.choice) &&
    Object.keys(probabilities).length === ids.length &&
    ids.every((id) => id in probabilities) &&
    numbers.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1) &&
    Math.abs(Object.values(probabilities).reduce((a, b) => a + b, 0) - 1) < 0.02 &&
    probabilities[answer.choice] >= Math.max(...Object.values(probabilities)) - 1e-6;

  if (!valid || !answer?.choice || answer.confidence === undefined) {
    throw new Error("Invalid TypeSafe response; no action executed.");
  }
  return {
    choice: answer.choice,
    probabilities,
    confidence: answer.confidence,
  };
}

function buildQuestions(elements: JevElement[], goal: string) {
  const clickTargets: Record<string, object> = {};
  const typeTargets: Record<string, object> = {};
  const selectTargets: Record<string, object> = {};

  for (const el of elements) {
    if (el.disabled) continue;
    const row = {
      element: `[${el.index}] ${el.label}`,
      current_value: el.value,
      role: el.role,
    };
    if (el.operations.includes("CLICK")) clickTargets[String(el.index)] = row;
    if (el.operations.includes("TYPE_TEXT")) typeTargets[String(el.index)] = row;
    if (el.operations.includes("SELECT")) {
      for (const opt of el.options ?? []) {
        selectTargets[opt.index] = {
          ...row,
          option: opt.label,
          option_value: opt.value,
        };
      }
    }
  }

  const operations: Record<string, string> = {};
  if (Object.keys(clickTargets).length) operations.CLICK = OPERATION_LABELS.CLICK;
  if (Object.keys(typeTargets).length) operations.TYPE_TEXT = OPERATION_LABELS.TYPE_TEXT;
  if (Object.keys(selectTargets).length) operations.SELECT = OPERATION_LABELS.SELECT;
  operations.WAIT = OPERATION_LABELS.WAIT;
  operations.DONE = OPERATION_LABELS.DONE;

  const questions: Record<string, object> = {
    operation: {
      type: "choice",
      criteria: operations,
      instructions: { goal, rules: NEXT_ACTION },
    },
  };

  const heads: { key: string; operation: string; targets: Record<string, object> }[] = [
    { key: "click_target", operation: "CLICK", targets: clickTargets },
    { key: "type_text_target", operation: "TYPE_TEXT", targets: typeTargets },
    { key: "select_target", operation: "SELECT", targets: selectTargets },
  ];

  for (const head of heads) {
    if (!Object.keys(head.targets).length) continue;
    questions[head.key] = {
      type: "choice",
      criteria: head.targets,
      instructions: { goal, operation: head.operation, rules: [NEXT_ACTION, TARGET] },
    };
  }

  return { operations, questions, clickTargets, typeTargets, selectTargets };
}

export async function liveDecide(req: DecideRequest): Promise<Decision> {
  const provider = resolveJevProvider();
  if (!provider) {
    throw new Error("No Jev API key configured");
  }

  const { operations, questions, clickTargets, typeTargets, selectTargets } = buildQuestions(
    req.elements,
    req.goal,
  );

  const body = {
    model: provider.model,
    state: {
      page: req.page,
      elements: req.elements,
      recent_actions: req.history.slice(-10).map((h) => ({
        action: h.action,
        kind: h.kind,
        text: h.text,
        page_changed: h.page_changed,
      })),
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
    throw new Error(`Model provider returned HTTP ${response.status}; no action executed.`);
  }

  const result = (await response.json()) as {
    model?: string;
    answers?: Record<string, ChoiceAnswer>;
  };

  const operationAnswer = validateChoice(result.answers?.operation, Object.keys(operations));
  const operation = operationAnswer.choice as Operation;
  let target: string | null = null;
  let target_probabilities: Record<string, number> = {};

  if (operation === "CLICK") {
    const answer = validateChoice(result.answers?.click_target, Object.keys(clickTargets));
    target = answer.choice;
    target_probabilities = answer.probabilities;
  } else if (operation === "TYPE_TEXT") {
    const answer = validateChoice(result.answers?.type_text_target, Object.keys(typeTargets));
    target = answer.choice;
    target_probabilities = answer.probabilities;
  } else if (operation === "SELECT") {
    const answer = validateChoice(result.answers?.select_target, Object.keys(selectTargets));
    target = answer.choice;
    target_probabilities = answer.probabilities;
  }

  let text: string | undefined;
  if (operation === "TYPE_TEXT" && target) {
    const element = req.elements.find((el) => String(el.index) === target);
    if (element) {
      text = await fieldText(req.goal, element, req.page.text, req.history);
    }
  }

  return {
    operation,
    target,
    text,
    confidence: operationAnswer.confidence,
    operation_probabilities: operationAnswer.probabilities,
    target_probabilities,
    latency_ms: Date.now() - started,
    source: "live",
    model: result.model ?? provider.model,
  };
}
