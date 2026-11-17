import type { EnvelopeState } from "../shared/types";
import type { ResumeEntry } from "@ag-ui/core";

interface ThreadRecord {
  threadId: string;
  state: EnvelopeState;
  agentPlaced: EnvelopeState | null;
  lastRunId: string | null;
  startedAt: number;
}

const threads = new Map<string, ThreadRecord>();

export function getThread(threadId: string): ThreadRecord | undefined {
  return threads.get(threadId);
}

export function saveThread(record: ThreadRecord): void {
  threads.set(record.threadId, record);
}

export function rememberAgentPlaced(threadId: string, state: EnvelopeState): void {
  const existing = threads.get(threadId);
  if (existing) existing.agentPlaced = structuredClone(state);
}

export type { ResumeEntry };
