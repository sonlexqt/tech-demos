import { EDITABLE_SET, isEditableA1, rowColToA1, type EditableA1 } from "./cells";
import {
  commandWritesCells,
  extractEditableWrites,
  type CommandEvent,
  type UniverFacade,
  type WorkbookFacade,
} from "./sheet-io";

const VALUE_COMMANDS = new Set([
  "sheet.command.set-range-values",
  "sheet.command.set-range-value",
  "sheet.command.clear-selection-content",
]);

const STRUCTURAL_COMMANDS = new Set([
  "sheet.command.clear-selection-all",
  "sheet.command.delete-range-move-left",
  "sheet.command.delete-range-move-up",
  "sheet.command.insert-range-move-right",
  "sheet.command.insert-range-move-down",
  "sheet.command.paste",
  "sheet.command.paste-value",
  "sheet.command.auto-fill",
  "sheet.command.numfmt.set.currency",
]);

const UNDO_REDO = new Set(["univer.command.undo", "univer.command.redo"]);

let frozen = false;

export function setEnvelopeFrozen(value: boolean): void {
  frozen = value;
}

export function isEnvelopeFrozen(): boolean {
  return frozen;
}

function isStructural(id: string): boolean {
  if (STRUCTURAL_COMMANDS.has(id)) return true;
  return (
    id.includes("delete-range") ||
    id.includes("insert-range") ||
    id.includes("move-range") ||
    id.includes("insert-row") ||
    id.includes("insert-col") ||
    id.includes("remove-row") ||
    id.includes("remove-col") ||
    id.includes("paste") ||
    id.includes("auto-fill")
  );
}

export function installProtection(api: UniverFacade): { dispose(): void } {
  const disposable = api.addEvent(api.Event.BeforeCommandExecute, (event: CommandEvent) => {
    const id = event.id ?? "";
    if (id.startsWith("sheet.mutation.")) return;
    if (frozen) {
      if (UNDO_REDO.has(id) || VALUE_COMMANDS.has(id) || isStructural(id) || id.includes("set-range")) {
        event.cancel = true;
      }
      return;
    }
    if (UNDO_REDO.has(id)) return;
    if (isStructural(id)) {
      event.cancel = true;
      return;
    }
    if (!VALUE_COMMANDS.has(id) && !id.includes("set-range") && !id.includes("clear")) return;

    const cells = commandWritesCells(event.params);
    if (cells.length === 0) {
      event.cancel = true;
      return;
    }
    const locked = cells.some(({ row, col }) => !EDITABLE_SET.has(rowColToA1(row, col)));
    if (locked) {
      event.cancel = true;
      return;
    }
    for (const write of extractEditableWrites(event.params)) {
      if ((write.cell === "B7" || write.cell === "B8") && write.value !== 0 && write.value !== 1) {
        event.cancel = true;
        return;
      }
    }
  });
  return disposable;
}

export async function protectLockedRanges(workbook: WorkbookFacade): Promise<void> {
  const sheet = workbook.getActiveSheet();
  const blocks = ["A1:A40", "C1:C40", "E1:E40", "B1:B5", "B9:B40", "D1:D5", "D7:D40", "F1:H40"];
  for (const a1 of blocks) {
    const range = sheet.getRange(a1);
    const permission = range.getRangePermission?.();
    if (!permission) continue;
    try {
      await permission.protect({ name: `locked-${a1}`, allowViewByOthers: true });
    } catch {
      // Range protection may require a permission service; command interceptor still holds.
    }
  }
}

/** Viewer-mode if the permission API exists; the frozen interceptor always blocks edits. */
export async function freezeWorkbookReadOnly(api: UniverFacade): Promise<void> {
  setEnvelopeFrozen(true);
  const workbook = api.getActiveWorkbook();
  if (!workbook) return;
  const permission = workbook.getWorkbookPermission?.();
  if (!permission) return;
  try {
    await permission.setMode("viewer");
  } catch {
    try {
      const editPoint = (api as unknown as { Enum?: { WorkbookPermissionPoint?: { Edit: unknown } } }).Enum
        ?.WorkbookPermissionPoint?.Edit;
      if (editPoint !== undefined) await permission.setPoint(editPoint, false);
    } catch {
      // Interceptor freeze still holds.
    }
  }
}

export function toggleAllowed(cell: EditableA1, value: number): boolean {
  if (!isEditableA1(cell)) return false;
  if (cell === "B7" || cell === "B8") return value === 0 || value === 1;
  return true;
}
