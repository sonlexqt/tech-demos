import { describe, expect, test } from "bun:test";
import {
  buildDecideRequest,
  chooseFixture,
  parseLiveDecision,
  scorePasses,
} from "../src/core/chooser";
import { planById } from "../src/core/plans";
import { applyAction, createInitialState } from "../src/core/sign-state";

const happy = planById("happy-path-send");

describe("fixture chooser", () => {
  test("Choice always selects the planned action", () => {
    const step = happy.steps[0];
    const decision = chooseFixture(step, createInitialState());
    expect(decision.mode).toBe("fixture");
    expect(decision.primitive).toBe("choice");
    expect(decision.chosenActionId).toBe(step.expectedActionId);
    expect(decision.confidence).toBe(1);
    expect(decision.probabilities?.[step.expectedActionId]).toBe(1);
  });

  test("Score is high when the assertion holds", () => {
    const send = happy.steps.find((step) => step.id === "hp-send");
    const assert = happy.steps.find((step) => step.id === "hp-assert");
    if (!send || !assert) throw new Error("missing steps");
    let state = createInitialState();
    for (const step of happy.steps.slice(0, 4)) {
      const action = step.actionSpace.find((item) => item.id === step.expectedActionId);
      if (!action) throw new Error("missing action");
      state = applyAction(state, action);
    }
    const decision = chooseFixture(assert, state);
    expect(decision.chosenActionId).toBe("assert-sent");
    expect(decision.score).toBe(3);
    expect(scorePasses(decision)).toBe(true);
  });

  test("Score is low when the assertion does not hold", () => {
    const assert = happy.steps.find((step) => step.id === "hp-assert");
    if (!assert) throw new Error("missing assert");
    const decision = chooseFixture(assert, createInitialState());
    expect(decision.score).toBe(0);
    expect(scorePasses(decision)).toBe(false);
  });
});

describe("decide request + live parse", () => {
  test("choice steps emit a next Choice question", () => {
    const request = buildDecideRequest(happy.steps[0], createInitialState());
    expect(request.questions.next?.type).toBe("choice");
    expect(request.questions.next && "criteria" in request.questions.next).toBe(
      true,
    );
    expect(request.state.actionSpace.length).toBeGreaterThan(1);
  });

  test("score steps emit assertion Choice plus hold Score", () => {
    const assert = happy.steps.find((step) => step.id === "hp-assert");
    if (!assert) throw new Error("missing assert");
    const request = buildDecideRequest(assert, createInitialState());
    expect(request.questions.assertion?.type).toBe("choice");
    expect(request.questions.hold?.type).toBe("score");
  });

  test("parseLiveDecision reads Choice answers", () => {
    const step = happy.steps[0];
    const decision = parseLiveDecision(step, {
      answers: {
        next: {
          type: "choice",
          choice: "type-title",
          confidence: 0.91,
          probabilities: { "type-title": 0.91, "click-send-early": 0.09 },
        },
      },
    });
    expect(decision.mode).toBe("live");
    expect(decision.chosenActionId).toBe("type-title");
    expect(decision.confidence).toBe(0.91);
  });
});
