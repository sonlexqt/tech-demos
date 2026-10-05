export const MODES = ["normal", "caveman", "proxy", "both"] as const;
export type Mode = (typeof MODES)[number];

export type TaskId = "decline-msa" | "audit-trail" | "stalled-reminders";

export interface FactSpec {
  id: string;
  label: string;
  needles: string[];
}

export interface TaskDef {
  id: TaskId;
  title: string;
  question: string;
  blurb: string;
  rawInput: string;
  facts: FactSpec[];
  answers: {
    normal: string;
    caveman: string;
  };
}

export interface TokenBreak {
  input: number;
  output: number;
  rawInput: number;
  sentInput: number;
  skillOverhead: number;
}

export interface RunResult {
  mode: Mode;
  inputRaw: string;
  inputSent: string;
  output: string;
  tokens: TokenBreak;
  costUsd: number;
  source: "fixture" | "live";
}

export interface FactCheck {
  id: string;
  label: string;
  needles: string[];
  inInput: Record<Mode, boolean>;
  inOutput: Record<Mode, boolean>;
}

export interface CompareResult {
  task: Pick<TaskDef, "id" | "title" | "question" | "blurb" | "facts">;
  modes: Record<Mode, RunResult>;
  facts: FactCheck[];
}

export interface Meta {
  liveAvailable: boolean;
  provider: "fixture" | "anthropic" | "openai";
  rates: { inputPerMTok: number; outputPerMTok: number; label: string };
  notes: string;
}
