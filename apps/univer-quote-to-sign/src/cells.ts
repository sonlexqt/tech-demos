/** A1 map for the Exhibit A pricing sheet. Rows are 1-indexed here. */

export const SHEET_NAME = "Quote";
export const SHEET_ID = "quote-sheet";
export const WORKBOOK_ID = "msa-quote-workbook";

export const CELLS = {
  seats: "B6",
  unitPrice: "C6",
  term: "D6",
  linePlatform: "E6",
  supportQty: "B7",
  supportPrice: "C7",
  lineSupport: "E7",
  ssoQty: "B8",
  ssoPrice: "C8",
  lineSso: "E8",
  subtotal: "B17",
  discountRate: "B18",
  discountAmt: "B19",
  taxable: "B20",
  tax: "B21",
  total: "B22",
} as const;

export type EditableA1 = "B6" | "D6" | "B7" | "B8";

export const EDITABLE_CELLS: readonly EditableA1[] = ["B6", "D6", "B7", "B8"];
export const EDITABLE_SET = new Set<string>(EDITABLE_CELLS);

export const DEFAULT_INPUT = {
  seats: 25,
  termYears: 1,
  premiumSupport: false,
  sso: false,
} as const;

export const CELL_LABELS: Record<EditableA1, string> = {
  B6: "seats",
  D6: "term (years)",
  B7: "premium support (0/1)",
  B8: "SSO add-on (0/1)",
};

export function a1ToRowCol(a1: string): { row: number; col: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(a1.toUpperCase());
  if (!match) throw new Error(`Invalid A1: ${a1}`);
  const letters = match[1];
  const row = Number(match[2]) - 1;
  let col = 0;
  for (let i = 0; i < letters.length; i += 1) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { row, col: col - 1 };
}

export function rowColToA1(row: number, col: number): string {
  let n = col + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return `${letters}${row + 1}`;
}

export function isEditableA1(a1: string): a1 is EditableA1 {
  return EDITABLE_SET.has(a1.toUpperCase());
}
