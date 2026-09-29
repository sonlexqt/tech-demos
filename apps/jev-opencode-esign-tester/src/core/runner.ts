import { chooseFixture, findAction, scorePasses } from "./chooser";
import { applyAction, assertionHolds } from "./sign-state";
import type {
  Decision,
  PlanStep,
  SignState,
  StepLog,
  TargetId,
} from "./types";

export type DecideFn = (
  step: PlanStep,
  state: SignState,
) => Decision | Promise<Decision>;

export function fixtureDecide(step: PlanStep, state: SignState): Decision {
  return chooseFixture(step, state);
}

export function evaluateStep(
  step: PlanStep,
  state: SignState,
  decision: Decision,
): { state: SignState; log: StepLog } {
  const expected = findAction(step, step.expectedActionId);
  const chosen = findAction(step, decision.chosenActionId);
  const highlight: TargetId | null = chosen?.target ?? expected?.target ?? null;
  const chosenLabel = chosen?.label ?? `(unknown: ${decision.chosenActionId})`;
  const expectedLabel = expected?.label ?? step.expectedActionId;

  if (step.primitive === "choice") {
    const next = chosen ? applyAction(state, chosen) : state;
    const passed = Boolean(chosen) && decision.chosenActionId === step.expectedActionId;
    return {
      state: next,
      log: {
        stepId: step.id,
        stepTitle: step.title,
        chosenActionId: decision.chosenActionId,
        expectedActionId: step.expectedActionId,
        chosenLabel,
        passed,
        message: passed
          ? `Choice picked ${chosenLabel}`
          : `Choice picked ${chosenLabel}; expected ${expectedLabel}`,
        decision,
        highlight,
      },
    };
  }

  const pickedExpected = decision.chosenActionId === step.expectedActionId;
  const holds = expected ? assertionHolds(state, expected) : false;
  const scoredOk = scorePasses(decision);
  const passed = pickedExpected && holds && scoredOk;
  const scoreText =
    decision.score === undefined ? "n/a" : decision.score.toFixed(2);

  let message: string;
  if (passed) {
    message = `Score ${scoreText} — ${chosenLabel} holds`;
  } else if (!pickedExpected) {
    message = `Score picked ${chosenLabel}; expected ${expectedLabel}`;
  } else if (!holds) {
    message = `Assertion does not hold on the fixture (${chosenLabel})`;
  } else {
    message = `Assertion holds but Jev Score ${scoreText} is below threshold`;
  }

  return {
    state,
    log: {
      stepId: step.id,
      stepTitle: step.title,
      chosenActionId: decision.chosenActionId,
      expectedActionId: step.expectedActionId,
      chosenLabel,
      passed,
      message,
      decision,
      highlight,
    },
  };
}

export async function runStep(
  step: PlanStep,
  state: SignState,
  decide: DecideFn = fixtureDecide,
): Promise<{ state: SignState; log: StepLog }> {
  const decision = await decide(step, state);
  return evaluateStep(step, state, decision);
}

export async function runPlan(
  steps: PlanStep[],
  initial: SignState,
  decide: DecideFn = fixtureDecide,
): Promise<{ state: SignState; logs: StepLog[]; passed: boolean }> {
  let state = initial;
  const logs: StepLog[] = [];
  for (const step of steps) {
    const result = await runStep(step, state, decide);
    state = result.state;
    logs.push(result.log);
    if (!result.log.passed) {
      break;
    }
  }
  return {
    state,
    logs,
    passed: logs.length === steps.length && logs.every((log) => log.passed),
  };
}
