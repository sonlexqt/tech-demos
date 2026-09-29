import { describe, expect, test } from "bun:test";
import { planById } from "../src/core/plans";
import { evaluateStep, runPlan } from "../src/core/runner";
import { createInitialState } from "../src/core/sign-state";
import type { Decision } from "../src/core/types";

describe("plan runner", () => {
  test("happy-path send passes under the fixture chooser", async () => {
    const plan = planById("happy-path-send");
    const result = await runPlan(plan.steps, createInitialState());
    expect(result.passed).toBe(true);
    expect(result.logs).toHaveLength(plan.steps.length);
    expect(result.state.status).toBe("sent");
    expect(result.logs.every((log) => log.passed)).toBe(true);
    expect(result.logs.at(-1)?.highlight).toBe("status");
  });

  test("missing-signer fail path expects an error and blocked status", async () => {
    const plan = planById("missing-signer-fail");
    const result = await runPlan(plan.steps, createInitialState());
    expect(result.passed).toBe(true);
    expect(result.state.status).toBe("blocked");
    expect(result.state.error?.toLowerCase()).toContain("signer");
    expect(result.logs.some((log) => log.chosenActionId === "expect-signer-error")).toBe(
      true,
    );
  });

  test("decline recovery sends after a decline", async () => {
    const plan = planById("decline-recovery");
    const result = await runPlan(plan.steps, createInitialState());
    expect(result.passed).toBe(true);
    expect(result.state.status).toBe("sent");
    expect(result.logs.map((log) => log.chosenActionId)).toContain("click-decline");
    expect(result.logs.at(-1)?.chosenActionId).toBe("assert-sent");
  });

  test("a wrong Choice fails the step and still applies the pick", () => {
    const plan = planById("happy-path-send");
    const step = plan.steps[0];
    const wrong: Decision = {
      mode: "fixture",
      primitive: "choice",
      chosenActionId: "click-send-early",
      confidence: 0.4,
    };
    const result = evaluateStep(step, createInitialState(), wrong);
    expect(result.log.passed).toBe(false);
    expect(result.log.highlight).toBe("send");
    expect(result.state.status).toBe("blocked");
  });
});
