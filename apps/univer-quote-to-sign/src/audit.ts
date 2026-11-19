import { CELL_LABELS, type EditableA1 } from "./cells";
import type { AuditEntry, Actor } from "./types";
import {
  extractEditableWrites,
  readSheetValues,
  waitForFormulas,
  type CommandEvent,
  type UniverFacade,
} from "./sheet-io";

export class AuditLog {
  readonly entries: AuditEntry[] = [];
  private seq = 1;
  actor: Actor = "signer";
  source = "sheet";
  last: Record<string, number> = {};
  onChange: ((entries: AuditEntry[]) => void) | null = null;

  snapshotInputs(values: {
    seats: number;
    termYears: number;
    premiumSupport: boolean;
    sso: boolean;
    totals: { total: number };
  }) {
    this.last = {
      B6: values.seats,
      D6: values.termYears,
      B7: values.premiumSupport ? 1 : 0,
      B8: values.sso ? 1 : 0,
    };
  }

  noteImmediate(cell: EditableA1, value: number): { oldValue: number | null; newValue: number } {
    const oldValue = this.last[cell] ?? null;
    this.last[cell] = value;
    return { oldValue, newValue: value };
  }

  push(entry: Omit<AuditEntry, "id" | "at">): AuditEntry {
    const full: AuditEntry = {
      id: this.seq,
      at: new Date().toISOString(),
      ...entry,
    };
    this.seq += 1;
    this.entries.push(full);
    this.onChange?.(this.entries);
    return full;
  }

  recordDiff(values: {
    seats: number;
    termYears: number;
    premiumSupport: boolean;
    sso: boolean;
    totals: { total: number };
  }): AuditEntry[] {
    const next: Record<string, number> = {
      B6: values.seats,
      D6: values.termYears,
      B7: values.premiumSupport ? 1 : 0,
      B8: values.sso ? 1 : 0,
    };
    const added: AuditEntry[] = [];
    for (const cell of Object.keys(next) as EditableA1[]) {
      if (this.last[cell] === next[cell]) continue;
      added.push(
        this.push({
          actor: this.actor,
          source: this.source,
          cell,
          label: CELL_LABELS[cell],
          oldValue: this.last[cell] ?? null,
          newValue: next[cell],
          total: values.totals.total,
        }),
      );
    }
    this.last = next;
    return added;
  }
}

export function installAudit(api: UniverFacade, log: AuditLog): { dispose(): void } {
  const disposable = api.addEvent(api.Event.CommandExecuted, (event: CommandEvent) => {
    const id = event.id ?? "";
    const interesting =
      id.includes("set-range") ||
      id.includes("undo") ||
      id.includes("redo") ||
      id.includes("paste") ||
      id.includes("clear");
    if (!interesting) return;

    const source = id.includes("undo")
      ? "undo"
      : id.includes("redo")
        ? "redo"
        : log.actor === "agent"
          ? "agent"
          : "sheet";
    const actor = log.actor;
    const writes = extractEditableWrites(event.params);
    const captured = writes
      .filter((w) => w.value !== log.last[w.cell])
      .map((w) => {
        const { oldValue, newValue } = log.noteImmediate(w.cell, w.value);
        return { cell: w.cell, oldValue, newValue };
      });

    void (async () => {
      await waitForFormulas(api, 2500);
      const workbook = api.getActiveWorkbook();
      if (!workbook) return;
      const values = readSheetValues(workbook.getActiveSheet());
      log.source = source;
      log.actor = actor;
      if (captured.length === 0) {
        log.recordDiff(values);
        return;
      }
      for (const item of captured) {
        log.push({
          actor,
          source,
          cell: item.cell,
          label: CELL_LABELS[item.cell],
          oldValue: item.oldValue,
          newValue: item.newValue,
          total: values.totals.total,
        });
      }
    })();
  });
  return disposable;
}
