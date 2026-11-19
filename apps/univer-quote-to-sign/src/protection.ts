import { EDITABLE_SET, rowColToA1 } from "./cells";
import { commandWritesCells, type CommandEvent, type UniverFacade, type WorkbookFacade } from "./sheet-io";

const WRITE_COMMANDS = new Set([
  "sheet.command.set-range-values",
  "sheet.command.set-range-value",
  "sheet.command.clear-selection-content",
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

const ALWAYS_ALLOW = new Set([
  "univer.command.undo",
  "univer.command.redo",
  "sheet.mutation.set-range-values",
]);

export function installProtection(api: UniverFacade): { dispose(): void } {
  const disposable = api.addEvent(api.Event.BeforeCommandExecute, (event: CommandEvent) => {
    const id = event.id ?? "";
    if (ALWAYS_ALLOW.has(id)) return;
    if (!WRITE_COMMANDS.has(id) && !id.includes("set-range") && !id.includes("paste") && !id.includes("clear")) {
      return;
    }
    const cells = commandWritesCells(event.params);
    if (cells.length === 0) {
      if (WRITE_COMMANDS.has(id)) event.cancel = true;
      return;
    }
    const locked = cells.some(({ row, col }) => !EDITABLE_SET.has(rowColToA1(row, col)));
    if (locked) event.cancel = true;
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

export async function freezeWorkbookReadOnly(api: UniverFacade): Promise<void> {
  const workbook = api.getActiveWorkbook();
  if (!workbook) return;
  const permission = workbook.getWorkbookPermission?.();
  if (permission) {
    try {
      await permission.setMode("viewer");
      return;
    } catch {
      try {
        const editPoint = (api as unknown as { Enum?: { WorkbookPermissionPoint?: { Edit: unknown } } }).Enum
          ?.WorkbookPermissionPoint?.Edit;
        if (editPoint !== undefined) await permission.setPoint(editPoint, false);
      } catch {
        // Fall through to interceptor-only freeze.
      }
    }
  }
}
