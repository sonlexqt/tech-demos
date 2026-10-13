import { readFileSync } from "node:fs";
import type { RunFixture } from "../src/results";

interface Step {
  api?: string;
  label?: string;
  durationMs?: number;
  metrics?: { modelCalls?: number };
  cache?: { mode?: string };
}

interface Result {
  titlePath?: string[];
  title?: string;
  status?: string;
  selected?: boolean;
  durationMs?: number;
  attempts?: Array<{
    durationMs?: number;
    status?: string;
    steps?: Step[];
  }>;
}

interface ReportFile {
  run?: {
    startedAt?: string;
    finishedAt?: string;
    status?: string;
    results?: Result[];
    usage?: { modelTokens?: number };
  };
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function elapsedMs(run: ReportFile["run"]): number {
  if (!run?.startedAt || !run.finishedAt) return 0;
  const a = Date.parse(run.startedAt);
  const b = Date.parse(run.finishedAt);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, b - a);
}

export function summarizeReport(
  reportPath: string,
  extras: Pick<RunFixture, "label" | "command" | "notes">,
): RunFixture {
  const file = JSON.parse(readFileSync(reportPath, "utf8")) as ReportFile;
  const run = file.run ?? {};
  const tests = (run.results ?? [])
    .filter((result) => result.selected !== false && (result.attempts?.length ?? 0) > 0)
    .map((result) => {
      const attempt = result.attempts?.[0];
      const steps = attempt?.steps ?? [];
      const modelCalls = steps.reduce(
        (sum, step) => sum + num(step.metrics?.modelCalls),
        0,
      );
      const cacheStep = [...steps].reverse().find((step) => step.cache?.mode);
      return {
        title: result.titlePath?.join(" / ") ?? result.title ?? "untitled",
        status: result.status ?? attempt?.status ?? "unknown",
        durationMs: num(result.durationMs ?? attempt?.durationMs),
        modelCalls,
        cacheMode: cacheStep?.cache?.mode,
      };
    });

  let replayed = 0;
  let handedOff = 0;
  let missed = 0;
  let modelCalls = 0;
  for (const result of run.results ?? []) {
    if (result.selected === false) continue;
    for (const step of result.attempts?.[0]?.steps ?? []) {
      modelCalls += num(step.metrics?.modelCalls);
      if (step.cache?.mode === "self-finalized") replayed += 1;
      else if (step.cache?.mode === "agent-concluded") handedOff += 1;
      else if (step.cache?.mode === "missed") missed += 1;
    }
  }

  return {
    label: extras.label,
    capturedAt: run.startedAt ?? new Date().toISOString(),
    command: extras.command,
    durationMs: elapsedMs(run),
    modelCalls,
    tokens: num(run.usage?.modelTokens),
    cache: { replayed, handedOff, missed },
    tests,
    notes: extras.notes,
  };
}
