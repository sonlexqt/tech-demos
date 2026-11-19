import { CELLS } from "../cells";
import type { AgentToolCall } from "./tools";

/** Deterministic NL → tools. No network. Default agent mode. */
export function parseMockCommand(input: string): AgentToolCall[] {
  const text = input.trim().toLowerCase();
  if (!text) return [];
  if (/^undo\b/.test(text) || text === "undo that" || text.includes("undo the last")) {
    return [{ name: "undo", args: {} }];
  }
  if (
    /\b(total|totals|what.?s the (price|total)|grand total)\b/.test(text) &&
    !/\b(seat|term|year|support|sso)\b/.test(text)
  ) {
    return [{ name: "get_totals", args: {} }];
  }

  const calls: AgentToolCall[] = [];

  const seats = text.match(/(\d+)\s*seats?\b/) ?? text.match(/\bseats?\s*(?:to|=|:)?\s*(\d+)/);
  if (seats) {
    calls.push({ name: "set_cell", args: { cell: CELLS.seats, value: Number(seats[1]) } });
  }

  const term =
    text.match(/(\d+)\s*[- ]?\s*(?:year|yr)s?\b/) ??
    text.match(/\bterm\s*(?:to|=|:)?\s*(\d+)/);
  if (term) {
    calls.push({ name: "set_cell", args: { cell: CELLS.term, value: Number(term[1]) } });
  }

  const on = /\b(enable|add|turn on|include|with)\b/.test(text);
  const off = /\b(disable|remove|turn off|without|exclude)\b/.test(text);

  if (/\b(premium\s*support|support add-?on)\b/.test(text)) {
    if (off) calls.push({ name: "set_cell", args: { cell: CELLS.supportQty, value: 0 } });
    else if (on || /\bsupport\b/.test(text)) {
      calls.push({ name: "set_cell", args: { cell: CELLS.supportQty, value: 1 } });
    }
  }

  if (/\bsso\b/.test(text)) {
    if (off) calls.push({ name: "set_cell", args: { cell: CELLS.ssoQty, value: 0 } });
    else if (on) calls.push({ name: "set_cell", args: { cell: CELLS.ssoQty, value: 1 } });
  }

  return calls;
}
