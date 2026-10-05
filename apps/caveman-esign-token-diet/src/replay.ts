import { CAVEMAN_SKILL, opsSystemPrompt, usesCaveman } from "./caveman";
import { getTask } from "./fixtures";
import { callLiveModel, liveProvider } from "./llm";
import { trimInput, usesProxy } from "./proxy";
import { estimateCostUsd, estimateTokens } from "./tokens";
import type { CompareResult, FactCheck, Mode, RunResult, TaskDef } from "./types";
import { MODES } from "./types";

function containsAll(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.every((needle) => lower.includes(needle.toLowerCase()));
}

function buildUserPrompt(task: TaskDef, input: string): string {
  return [
    `Task: ${task.question}`,
    "",
    "--- audit trail + webhook dump ---",
    input,
    "--- end dump ---",
  ].join("\n");
}

export function buildSentInput(task: TaskDef, mode: Mode): { raw: string; sent: string; system: string } {
  const raw = task.rawInput;
  const body = usesProxy(mode) ? trimInput(raw) : raw;
  const system = opsSystemPrompt(usesCaveman(mode));
  const sent = [system, "", buildUserPrompt(task, body)].join("\n");
  return { raw, sent, system };
}

function fixtureOutput(task: TaskDef, mode: Mode): string {
  return usesCaveman(mode) ? task.answers.caveman : task.answers.normal;
}

export function runFixture(task: TaskDef, mode: Mode): RunResult {
  const { raw, sent } = buildSentInput(task, mode);
  const output = fixtureOutput(task, mode);
  const skillOverhead = usesCaveman(mode) ? estimateTokens(CAVEMAN_SKILL) : 0;
  const tokens = {
    input: estimateTokens(sent),
    output: estimateTokens(output),
    rawInput: estimateTokens(raw),
    sentInput: estimateTokens(sent),
    skillOverhead,
  };
  return {
    mode,
    inputRaw: raw,
    inputSent: sent,
    output,
    tokens,
    costUsd: estimateCostUsd(tokens.input, tokens.output),
    source: "fixture",
  };
}

export async function runLive(task: TaskDef, mode: Mode): Promise<RunResult> {
  const { raw, sent, system } = buildSentInput(task, mode);
  const body = usesProxy(mode) ? trimInput(raw) : raw;
  const output = await callLiveModel({
    system,
    user: buildUserPrompt(task, body),
  });
  const skillOverhead = usesCaveman(mode) ? estimateTokens(CAVEMAN_SKILL) : 0;
  const tokens = {
    input: estimateTokens(sent),
    output: estimateTokens(output),
    rawInput: estimateTokens(raw),
    sentInput: estimateTokens(sent),
    skillOverhead,
  };
  return {
    mode,
    inputRaw: raw,
    inputSent: sent,
    output,
    tokens,
    costUsd: estimateCostUsd(tokens.input, tokens.output),
    source: "live",
  };
}

export function checkFacts(task: TaskDef, runs: Record<Mode, RunResult>): FactCheck[] {
  return task.facts.map((fact) => {
    const inInput = {} as Record<Mode, boolean>;
    const inOutput = {} as Record<Mode, boolean>;
    for (const mode of MODES) {
      inInput[mode] = containsAll(runs[mode].inputSent, fact.needles);
      inOutput[mode] = containsAll(runs[mode].output, fact.needles);
    }
    return { id: fact.id, label: fact.label, needles: fact.needles, inInput, inOutput };
  });
}

export async function compareTask(taskId: string, live: boolean): Promise<CompareResult> {
  const task = getTask(taskId);
  if (!task) throw new Error(`Unknown task: ${taskId}`);
  const useLive = live && liveProvider() !== "fixture";
  const modes = {} as Record<Mode, RunResult>;
  for (const mode of MODES) {
    modes[mode] = useLive ? await runLive(task, mode) : runFixture(task, mode);
  }
  return {
    task: {
      id: task.id,
      title: task.title,
      question: task.question,
      blurb: task.blurb,
      facts: task.facts,
    },
    modes,
    facts: checkFacts(task, modes),
  };
}
