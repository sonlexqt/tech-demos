import { describe, expect, test } from "bun:test";
import { TASKS } from "./fixtures";
import { trimInput } from "./proxy";
import { checkFacts, compareTask, runFixture } from "./replay";
import { estimateCostUsd, estimateTokens } from "./tokens";
import { MODES } from "./types";

describe("token estimator", () => {
  test("is deterministic and positive", () => {
    const sample = "Priya Raman declined ENV-MSA-7F2C91.";
    expect(estimateTokens(sample)).toBe(estimateTokens(sample));
    expect(estimateTokens(sample)).toBeGreaterThan(0);
  });

  test("cost uses illustrative $3 / $15 per million", () => {
    expect(estimateCostUsd(1_000_000, 0)).toBe(3);
    expect(estimateCostUsd(0, 1_000_000)).toBe(15);
  });
});

describe("proxy trim", () => {
  test("shrinks every fixture dump and keeps required facts", () => {
    for (const task of TASKS) {
      const trimmed = trimInput(task.rawInput);
      expect(trimmed.length).toBeLessThan(task.rawInput.length);
      expect(trimmed).toContain("ccr_demo_");
      for (const fact of task.facts) {
        for (const needle of fact.needles) {
          expect(trimmed.toLowerCase()).toContain(needle.toLowerCase());
        }
      }
      expect(trimmed.toLowerCase()).not.toContain("ja3");
    }
  });
});

describe("offline replay", () => {
  test("caveman output is shorter; proxy input is smaller", async () => {
    const result = await compareTask("decline-msa", false);
    expect(result.modes.normal.source).toBe("fixture");
    expect(result.modes.caveman.tokens.output).toBeLessThan(result.modes.normal.tokens.output);
    expect(result.modes.proxy.tokens.input).toBeLessThan(result.modes.normal.tokens.input);
    expect(result.modes.both.tokens.input).toBeLessThan(result.modes.normal.tokens.input);
    expect(result.modes.both.tokens.output).toBeLessThan(result.modes.normal.tokens.output);
    expect(result.modes.caveman.tokens.skillOverhead).toBeGreaterThan(0);
    expect(result.modes.normal.tokens.skillOverhead).toBe(0);
  });

  test("all facts survive input and output in every mode", async () => {
    for (const task of TASKS) {
      const result = await compareTask(task.id, false);
      const facts = checkFacts(task, result.modes);
      for (const fact of facts) {
        for (const mode of MODES) {
          expect(fact.inInput[mode], `${task.id} ${fact.id} missing from ${mode} input`).toBe(true);
          expect(fact.inOutput[mode], `${task.id} ${fact.id} missing from ${mode} output`).toBe(true);
        }
      }
    }
  });

  test("fixture answers keep envelope IDs verbatim", () => {
    const run = runFixture(TASKS[0], "caveman");
    expect(run.output).toContain("ENV-MSA-7F2C91");
    expect(run.output).toContain("Priya Raman");
    expect(run.output).toContain("Clause 8.4");
  });
});
