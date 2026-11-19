import type { IWorkbookData } from "@univerjs/core";
import { BooleanNumber, LocaleType } from "@univerjs/core";
import { CELLS, DEFAULT_INPUT, SHEET_ID, SHEET_NAME, WORKBOOK_ID } from "./cells";
import { SSO_PRICE, SUPPORT_PRICE, UNIT_PRICE } from "./quote-math";

const MONEY = "$#,##0.00";
const PCT = "0%";
const INT = "0";

const LOCKED_BG = "#F3EEE4";
const INPUT_BG = "#D8F3EC";
const HEADER_BG = "#0F6B5C";
const TITLE_BG = "#143D36";
const TOTAL_BG = "#0F6B5C";

function s(partial: Record<string, unknown>): Record<string, unknown> {
  return partial;
}

function text(v: string, style?: Record<string, unknown>) {
  return { v, t: 1, s: style };
}

function num(v: number, pattern: string, style?: Record<string, unknown>) {
  return {
    v,
    t: 2,
    s: { n: { pattern }, ...style },
  };
}

function formula(f: string, pattern: string, style?: Record<string, unknown>) {
  return {
    f,
    t: 2,
    s: { n: { pattern }, ...style },
  };
}

const locked = (extra: Record<string, unknown> = {}) =>
  s({ bg: { rgb: LOCKED_BG }, ...extra });
const input = (extra: Record<string, unknown> = {}) =>
  s({ bg: { rgb: INPUT_BG }, bl: 1, bd: { b: { s: 1, cl: { rgb: "#0F6B5C" } } }, ...extra });
const head = s({ bg: { rgb: HEADER_BG }, cl: { rgb: "#FFFFFF" }, bl: 1, ht: 2 });
const title = s({ bg: { rgb: TITLE_BG }, cl: { rgb: "#FFFFFF" }, bl: 1, fs: 14 });
const totalStyle = s({ bg: { rgb: TOTAL_BG }, cl: { rgb: "#FFFFFF" }, bl: 1 });

/**
 * Snapshot for Exhibit A. Formulas (not precomputed totals) are the source of truth.
 * Nested IF implements the documented 20 / 50 / 100 seat discount tiers.
 */
export function createPricingWorkbookData(): IWorkbookData {
  const { seats, termYears, premiumSupport, sso } = DEFAULT_INPUT;

  const cellData: Record<number, Record<number, unknown>> = {
    0: {
      0: text("Exhibit A — Platform pricing (live workbook)", title),
    },
    1: {
      0: text("Vendor", locked()),
      1: text("Northwind Labs, Inc.", locked()),
    },
    2: {
      0: text("Customer", locked()),
      1: text("Contoso Analytics LLC", locked()),
    },
    3: {
      0: text("Green cells are signer inputs. All other cells are locked formulas / rates.", locked({ fs: 9, it: 1 })),
    },
    4: {
      0: text("Line item", head),
      1: text("Qty / seats", head),
      2: text("Unit price", head),
      3: text("Term (years)", head),
      4: text("Line total", head),
    },
    5: {
      0: text("Platform seats", locked({ bl: 1 })),
      1: num(seats, INT, input()),
      2: num(UNIT_PRICE, MONEY, locked()),
      3: num(termYears, INT, input()),
      4: formula("=B6*C6*D6", MONEY, locked({ bl: 1 })),
    },
    6: {
      0: text("Premium support (0/1)", locked()),
      1: num(premiumSupport ? 1 : 0, INT, input()),
      2: num(SUPPORT_PRICE, MONEY, locked()),
      3: text("uses D6", locked({ it: 1, fs: 9 })),
      4: formula("=B7*C7*$D$6", MONEY, locked()),
    },
    7: {
      0: text("SSO add-on (0/1)", locked()),
      1: num(sso ? 1 : 0, INT, input()),
      2: num(SSO_PRICE, MONEY, locked()),
      3: text("uses D6", locked({ it: 1, fs: 9 })),
      4: formula("=B8*C8*$D$6", MONEY, locked()),
    },
    9: {
      0: text("Volume discount tiers (documentation)", locked({ bl: 1 })),
    },
    10: {
      0: text("Seats ≥", locked({ bl: 1 })),
      1: text("Discount", locked({ bl: 1 })),
    },
    11: {
      0: num(1, INT, locked()),
      1: num(0, PCT, locked()),
    },
    12: {
      0: num(20, INT, locked()),
      1: num(0.1, PCT, locked()),
    },
    13: {
      0: num(50, INT, locked()),
      1: num(0.18, PCT, locked()),
    },
    14: {
      0: num(100, INT, locked()),
      1: num(0.25, PCT, locked()),
    },
    16: {
      0: text("Subtotal", locked({ bl: 1 })),
      1: formula("=E6+E7+E8", MONEY, locked({ bl: 1 })),
    },
    17: {
      0: text("Discount rate", locked()),
      1: formula("=IF(B6>=100,0.25,IF(B6>=50,0.18,IF(B6>=20,0.1,0)))", PCT, locked()),
    },
    18: {
      0: text("Discount amount", locked()),
      1: formula("=B17*B18", MONEY, locked()),
    },
    19: {
      0: text("After discount", locked()),
      1: formula("=B17-B19", MONEY, locked()),
    },
    20: {
      0: text("Tax (8.5%)", locked()),
      1: formula("=B20*0.085", MONEY, locked()),
    },
    21: {
      0: text("TOTAL DUE", totalStyle),
      1: formula("=B20+B21", MONEY, totalStyle),
    },
  };

  return {
    id: WORKBOOK_ID,
    name: "MSA Exhibit A",
    appVersion: "1.5.2",
    locale: LocaleType.EN_US,
    sheetOrder: [SHEET_ID],
    styles: {},
    sheets: {
      [SHEET_ID]: {
        id: SHEET_ID,
        name: SHEET_NAME,
        hidden: BooleanNumber.FALSE,
        rowCount: 40,
        columnCount: 8,
        zoomRatio: 1,
        freeze: { startRow: -1, startColumn: -1, ySplit: 0, xSplit: 0 },
        scrollTop: 0,
        scrollLeft: 0,
        defaultColumnWidth: 112,
        defaultRowHeight: 26,
        mergeData: [{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 4 }],
        cellData: cellData as IWorkbookData["sheets"][string]["cellData"],
        rowData: {
          0: { h: 32 },
          3: { h: 32 },
        },
        columnData: {
          0: { w: 240 },
          1: { w: 128 },
          2: { w: 120 },
          3: { w: 128 },
          4: { w: 132 },
        },
        showGridlines: 1,
        rowHeader: { width: 36, hidden: 0 },
        columnHeader: { height: 22, hidden: 0 },
        rightToLeft: 0,
      },
    },
  };
}

export { CELLS };
