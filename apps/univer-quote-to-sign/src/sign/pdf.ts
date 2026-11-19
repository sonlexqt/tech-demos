import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CONTRACT_SECTIONS, CUSTOMER, ENVELOPE_ID, SIGNER_NAME, VENDOR } from "../contract";
import { roundMoney } from "../quote-math";
import type { AuditEntry, SheetValues } from "../types";

const INK = rgb(0.08, 0.14, 0.16);
const MUTED = rgb(0.35, 0.4, 0.42);
const TEAL = rgb(0.06, 0.42, 0.36);
const RULE = rgb(0.82, 0.84, 0.83);

function winAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "--")
    .replace(/\u2013/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u00d7/g, "x")
    .replace(/[^\t\n\r\x20-\x7E]/g, "?");
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = winAnsi(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function write(
  page: PDFPage,
  text: string,
  opts: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> },
): void {
  page.drawText(winAnsi(text), opts);
}

function drawHeader(page: PDFPage, font: PDFFont, bold: PDFFont, title: string, y: number): number {
  write(page, "LUMIN SIGN  |  fixture envelope", {
    x: 48,
    y,
    size: 9,
    font,
    color: TEAL,
  });
  write(page, title, { x: 48, y: y - 18, size: 16, font: bold, color: INK });
  write(page, ENVELOPE_ID, { x: 48, y: y - 34, size: 10, font, color: MUTED });
  page.drawLine({ start: { x: 48, y: y - 44 }, end: { x: 564, y: y - 44 }, thickness: 0.8, color: TEAL });
  return y - 62;
}

export async function renderContentPdf(values: SheetValues): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([612, 792]);
  let y = drawHeader(page, font, bold, "Master Services Agreement", 748);

  const meta = [
    `Vendor: ${VENDOR}`,
    `Customer: ${CUSTOMER}`,
    `Signer: ${SIGNER_NAME}`,
  ];
  for (const line of meta) {
    write(page, line, { x: 48, y, size: 10, font, color: INK });
    y -= 14;
  }
  y -= 8;

  for (const section of CONTRACT_SECTIONS) {
    if (y < 120) {
      page = doc.addPage([612, 792]);
      y = 748;
    }
    write(page, section.heading, { x: 48, y, size: 11, font: bold, color: INK });
    y -= 16;
    for (const line of wrap(font, section.body, 10, 516)) {
      if (y < 72) {
        page = doc.addPage([612, 792]);
        y = 748;
      }
      write(page, line, { x: 48, y, size: 10, font, color: INK });
      y -= 13;
    }
    y -= 10;
  }

  page = doc.addPage([612, 792]);
  y = drawHeader(page, font, bold, "Exhibit A -- Pricing (as displayed)", 748);
  write(page, "Computed by Univer formula engine at signature. Rendered with pdf-lib, not Univer PDF export.", {
    x: 48,
    y,
    size: 8,
    font,
    color: MUTED,
  });
  y -= 22;

  const rows: [string, string][] = [
    ["Platform seats", String(values.seats)],
    ["Term (years)", String(values.termYears)],
    ["Premium support", values.premiumSupport ? "Yes" : "No"],
    ["SSO add-on", values.sso ? "Yes" : "No"],
    ["Platform line", money(values.totals.platform)],
    ["Support line", money(values.totals.support)],
    ["SSO line", money(values.totals.sso)],
    ["Subtotal", money(values.totals.subtotal)],
    ["Volume discount", `${pct(values.totals.discountRate)}  (${money(values.totals.discount)})`],
    ["After discount", money(values.totals.taxable)],
    ["Tax 8.5%", money(values.totals.tax)],
    ["TOTAL DUE", money(values.totals.total)],
  ];

  for (const [label, value] of rows) {
    page.drawLine({ start: { x: 48, y: y + 12 }, end: { x: 564, y: y + 12 }, thickness: 0.4, color: RULE });
    write(page, label, { x: 56, y, size: 10, font: label === "TOTAL DUE" ? bold : font, color: INK });
    write(page, value, { x: 360, y, size: 10, font: label === "TOTAL DUE" ? bold : font, color: INK });
    y -= 20;
  }

  y -= 12;
  write(page, "Signature", { x: 48, y, size: 11, font: bold, color: INK });
  y -= 18;
  write(page, SIGNER_NAME, { x: 48, y, size: 12, font: bold, color: TEAL });
  y -= 16;
  write(page, "Signed electronically in this demo envelope (no PKI / TSA).", {
    x: 48,
    y,
    size: 9,
    font,
    color: MUTED,
  });

  return doc.save();
}

export async function appendAuditPage(
  contentPdf: Uint8Array,
  args: {
    auditLog: AuditEntry[];
    snapshotSha256: string;
    contentPdfSha256: string;
    bindingSha256: string;
    signedAt: string;
  },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(contentPdf);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([612, 792]);
  let y = drawHeader(page, font, bold, "Audit trail & cryptographic binding", 748);

  write(page, `Signed at ${args.signedAt}`, { x: 48, y, size: 10, font, color: INK });
  y -= 18;
  const hashes = [
    ["Snapshot SHA-256", args.snapshotSha256],
    ["Content PDF SHA-256", args.contentPdfSha256],
    ["Binding SHA-256 (canonical snapshot JSON || content PDF bytes)", args.bindingSha256],
  ];
  for (const [label, hash] of hashes) {
    write(page, label, { x: 48, y, size: 9, font: bold, color: TEAL });
    y -= 12;
    for (const line of wrap(font, hash, 8, 516)) {
      write(page, line, { x: 48, y, size: 8, font, color: INK });
      y -= 11;
    }
    y -= 6;
  }

  write(page, "Edit log (actor, cell, old -> new, resulting total)", {
    x: 48,
    y,
    size: 10,
    font: bold,
    color: INK,
  });
  y -= 16;

  if (args.auditLog.length === 0) {
    write(page, "No input-cell edits before signature (defaults used).", {
      x: 48,
      y,
      size: 9,
      font,
      color: MUTED,
    });
  } else {
    for (const entry of args.auditLog) {
      if (y < 72) {
        page = doc.addPage([612, 792]);
        y = 748;
      }
      const line = `#${entry.id} ${entry.at}  ${entry.actor}/${entry.source}  ${entry.cell} ${entry.oldValue} -> ${entry.newValue}  total=${money(Number(entry.total))}`;
      for (const wrapped of wrap(font, line, 8, 516)) {
        write(page, wrapped, { x: 48, y, size: 8, font, color: INK });
        y -= 11;
      }
      y -= 4;
    }
  }

  return doc.save();
}

function money(n: number): string {
  return `$${roundMoney(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number): string {
  return `${roundMoney(n * 100)}%`;
}
