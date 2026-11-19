import { CELL_LABELS, type EditableA1 } from "./cells";
import type { AuditEntry, Actor } from "./types";
import {
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
  private last: Record<string, number> = {};
  onChange: ((entries: AuditEntry[]) => void) | null = null;

  snapshotInputs(values: { seats: number; termYears: number; premiumSupport: boolean; sso: boolean; totals: { total: number } }) {
    this.last = {
      B6: values.seats,
      D6: values.termYears,
      B7: values.premiumSupport ? 1 : 0,
      B8: values.sso ? 1 : 0,
    };
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
      const entry: AuditEntry = {
        id: this.seq,
        at: new Date().toISOString(),
        actor: this.actor,
        source: this.source,
        cell,
        label: CELL_LABELS[cell],
        oldValue: this.last[cell] ?? null,
        newValue: next[cell],
        total: values.totals.total,
      };
      this.seq += 1;
      this.entries.push(entry);
      added.push(entry);
    }
    this.last = next;
    if (added.length) this.onChange?.(this.entries);
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
    void (async () => {
      await waitForFormulas(api, 2500);
      const workbook = api.getActiveWorkbook();
      if (!workbook) return;
      const values = readSheetValues(workbook.getActiveSheet());
      if (id.includes("undo")) {
        log.source = "undo";
      } else if (id.includes("redo")) {
        log.source = "redo";
      } else if (log.actor === "agent") {
        log.source = "agent";
      } else {
        log.source = "sheet";
      }
      log.recordDiff(values);
    })();
  });
  return disposable;
}
