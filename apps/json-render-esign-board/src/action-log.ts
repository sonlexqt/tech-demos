import type { ActionLogEntry } from "./types";

type Listener = (entries: ActionLogEntry[]) => void;

const listeners = new Set<Listener>();
let entries: ActionLogEntry[] = [];

export function getActionLog(): ActionLogEntry[] {
  return entries;
}

export function subscribeActionLog(listener: Listener): () => void {
  listeners.add(listener);
  listener(entries);
  return () => {
    listeners.delete(listener);
  };
}

export function recordRemind(requestId: string, label: string | null): ActionLogEntry {
  const entry: ActionLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toLocaleTimeString(),
    requestId,
    label,
    note: `remind_signer queued for ${requestId} (no email sent)`,
  };
  entries = [entry, ...entries].slice(0, 12);
  for (const listener of listeners) listener(entries);
  return entry;
}

export function clearActionLog(): void {
  entries = [];
  for (const listener of listeners) listener(entries);
}
