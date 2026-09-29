import { assertionHolds } from "./sign-state";
import {
  SCORE_LEVELS,
  SCORE_PASS_THRESHOLD,
  type DecideRequest,
  type Decision,
  type PlanAction,
  type PlanStep,
  type SignState,
} from "./types";

export function findAction(
  step: PlanStep,
  actionId: string,
): PlanAction | undefined {
  return step.actionSpace.find((action) => action.id === actionId);
}

export function buildDecideRequest(
  step: PlanStep,
  state: SignState,
): DecideRequest {
  const snapshot = {
    intent: step.intent,
    primitive: step.primitive,
    ui: {
      title: state.title,
      signerName: state.signerName,
      signerEmail: state.signerEmail,
      message: state.message,
      status: state.status,
      error: state.error,
    },
    actionSpace: step.actionSpace.map((action) => ({
      id: action.id,
      kind: action.kind,
      label: action.label,
    })),
  };

  const criteria = Object.fromEntries(
    step.actionSpace.map((action) => [action.id, action.label]),
  );

  if (step.primitive === "choice") {
    return {
      state: snapshot,
      questions: {
        next: {
          type: "choice",
          instructions: `This is a Lumin Sign fixture test step. Which action should the runner take next to fulfill: ${step.intent} Pick exactly one action id from the criteria.`,
          criteria,
        },
      },
    };
  }

  return {
    state: snapshot,
    questions: {
      assertion: {
        type: "choice",
        instructions: `Which assertion should be evaluated for: ${step.intent} Pick exactly one assertion id.`,
        criteria,
      },
      hold: {
        type: "score",
        instructions: `Given the current Lumin Sign fixture UI in state, how strongly does the expected assertion hold? Expected action id: ${step.expectedActionId}. Intent: ${step.intent}`,
        criteria: [...SCORE_LEVELS],
      },
    },
  };
}

export function chooseFixture(step: PlanStep, state: SignState): Decision {
  const expected = findAction(step, step.expectedActionId);
  if (!expected) {
    throw new Error(`Step ${step.id} is missing expected action`);
  }

  const probabilities = Object.fromEntries(
    step.actionSpace.map((action) => [
      action.id,
      action.id === step.expectedActionId ? 1 : 0,
    ]),
  );

  if (step.primitive === "choice") {
    return {
      mode: "fixture",
      primitive: "choice",
      chosenActionId: step.expectedActionId,
      confidence: 1,
      probabilities,
      note: "Fixture Choice always selects the planned action.",
    };
  }

  const holds = assertionHolds(state, expected);
  const score = holds ? 3 : 0;
  return {
    mode: "fixture",
    primitive: "score",
    chosenActionId: step.expectedActionId,
    confidence: 1,
    score,
    probabilities: {
      ...probabilities,
      [String(score)]: 1,
    },
    note: holds
      ? "Fixture Score: assertion holds clearly."
      : "Fixture Score: assertion does not hold.",
  };
}

export function parseLiveDecision(
  step: PlanStep,
  payload: {
    answers?: Record<
      string,
      {
        type?: string;
        choice?: string;
        score?: number;
        confidence?: number;
        probabilities?: Record<string, number>;
      }
    >;
  },
): Decision {
  const answers = payload.answers ?? {};
  if (step.primitive === "choice") {
    const next = answers.next;
    const chosen =
      typeof next?.choice === "string" && findAction(step, next.choice)
        ? next.choice
        : "";
    return {
      mode: "live",
      primitive: "choice",
      chosenActionId: chosen,
      confidence: next?.confidence ?? 0,
      probabilities: next?.probabilities,
      note: chosen
        ? "Live Jev Choice"
        : "Live Jev Choice returned an unknown action id.",
    };
  }

  const assertion = answers.assertion;
  const hold = answers.hold;
  const chosen =
    typeof assertion?.choice === "string" && findAction(step, assertion.choice)
      ? assertion.choice
      : step.expectedActionId;
  return {
    mode: "live",
    primitive: "score",
    chosenActionId: chosen,
    confidence: assertion?.confidence ?? hold?.confidence ?? 0,
    score: hold?.score,
    probabilities: {
      ...(assertion?.probabilities ?? {}),
      ...(hold?.probabilities ?? {}),
    },
    note: "Live Jev Choice + Score",
  };
}

export function scorePasses(decision: Decision): boolean {
  return (decision.score ?? 0) >= SCORE_PASS_THRESHOLD;
}
