import { CELLS, isEditableA1, type EditableA1 } from "../cells";
import type { AgentToolResult } from "../types";
import { assertEditableValue, readSheetValues, setEditableCell, waitForFormulas, type UniverFacade } from "../sheet-io";
import { isEnvelopeFrozen } from "../protection";
import type { AuditLog } from "../audit";
import { roundMoney } from "../quote-math";

export interface AgentToolCall {
  name: "set_cell" | "get_totals" | "undo";
  args: { cell?: string; value?: number };
}

export async function executeTool(
  api: UniverFacade,
  log: AuditLog,
  call: AgentToolCall,
): Promise<AgentToolResult> {
  if (call.name === "get_totals") {
    await waitForFormulas(api, 2500);
    const workbook = api.getActiveWorkbook();
    if (!workbook) return { name: call.name, ok: false, detail: "No workbook" };
    const values = readSheetValues(workbook.getActiveSheet());
    const t = values.totals;
    return {
      name: call.name,
      ok: true,
      detail: `seats=${values.seats} term=${values.termYears}y support=${values.premiumSupport ? 1 : 0} sso=${values.sso ? 1 : 0} subtotal=${roundMoney(t.subtotal)} discount=${roundMoney(t.discount)} tax=${roundMoney(t.tax)} total=${roundMoney(t.total)}`,
    };
  }

  if (isEnvelopeFrozen()) {
    return { name: call.name, ok: false, detail: "Envelope is frozen (signed)" };
  }

  if (call.name === "undo") {
    log.actor = "agent";
    log.source = "undo";
    const workbook = api.getActiveWorkbook();
    if (!workbook) return { name: "undo", ok: false, detail: "No workbook" };
    const count = Math.max(1, lastAgentSetCount);
    for (let i = 0; i < count; i += 1) workbook.undo();
    lastAgentSetCount = 0;
    await waitForFormulas(api, 2500);
    return { name: "undo", ok: true, detail: "Undo dispatched through Univer command stack (FWorkbook.undo)" };
  }

  const cell = String(call.args.cell ?? "").toUpperCase();
  const value = Number(call.args.value);
  if (!isEditableA1(cell)) {
    return {
      name: "set_cell",
      ok: false,
      detail: `Refused ${cell || "(empty)"} — only ${CELLS.seats}, ${CELLS.term}, ${CELLS.supportQty}, ${CELLS.ssoQty} are writable`,
    };
  }
  try {
    assertEditableValue(cell as EditableA1, value);
  } catch (error) {
    return { name: "set_cell", ok: false, detail: String(error) };
  }
  log.actor = "agent";
  log.source = "agent";
  await setEditableCell(api, cell as EditableA1, value);
  return { name: "set_cell", ok: true, detail: `${cell} → ${value}` };
}

/** How many Facade setValue commands the last agent turn pushed (one undo each). */
let lastAgentSetCount = 0;

export async function executeTools(
  api: UniverFacade,
  log: AuditLog,
  calls: AgentToolCall[],
): Promise<AgentToolResult[]> {
  const results: AgentToolResult[] = [];
  try {
    const setCount = calls.filter((c) => c.name === "set_cell").length;
    if (setCount > 0) lastAgentSetCount = setCount;
    for (const call of calls) {
      results.push(await executeTool(api, log, call));
    }
    if (!calls.some((c) => c.name === "get_totals") && calls.length > 0) {
      results.push(await executeTool(api, log, { name: "get_totals", args: {} }));
    }
  } finally {
    log.actor = "signer";
    log.source = "sheet";
  }
  return results;
}
