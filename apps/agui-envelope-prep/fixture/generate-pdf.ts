/**
 * Generates the synthetic 6-page MSA fixture and ground-truth JSON.
 * No real customer data — names, companies, and addresses are invented.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { groundTruthFromLayout, PAGE_HEIGHT, PAGE_WIDTH, PDF_FIELDS } from "../src/shared/layout";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INK = rgb(0.09, 0.11, 0.16);
const MUTED = rgb(0.35, 0.38, 0.45);
const RULE = rgb(0.55, 0.58, 0.64);
const ACCENT = rgb(0.42, 0.31, 0.92);
const BANNER = rgb(0.95, 0.93, 1);

async function main() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontSans = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pages = Array.from({ length: 6 }, () => pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]));
  for (let i = 0; i < pages.length; i++) {
    drawChrome(pages[i], fontSans, fontSansBold, i + 1);
  }

  drawCover(pages[0], font, fontBold);
  drawDefinitions(pages[1], font, fontBold);
  drawServices(pages[2], font, fontBold);
  drawFees(pages[3], font, fontBold);
  drawConfidentiality(pages[4], font, fontBold);
  drawSignatures(pages[5], font, fontBold, fontSans);

  const pdfBytes = await pdf.save();
  const publicDir = join(ROOT, "public");
  const fixtureDir = join(ROOT, "fixture");
  mkdirSync(publicDir, { recursive: true });
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(join(publicDir, "fixture-msa.pdf"), pdfBytes);
  writeFileSync(
    join(fixtureDir, "ground-truth.json"),
    `${JSON.stringify(groundTruthFromLayout(), null, 2)}\n`,
  );
  console.log("Wrote public/fixture-msa.pdf and fixture/ground-truth.json");
}

function drawChrome(page: PDFPage, font: PDFFont, fontBold: PDFFont, pageNumber: number) {
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 36,
    width: PAGE_WIDTH,
    height: 36,
    color: BANNER,
  });
  page.drawText("LUMIN SIGN  ·  SYNTHETIC DEMO DOCUMENT  ·  NO REAL CUSTOMER DATA", {
    x: 36,
    y: PAGE_HEIGHT - 22,
    size: 8,
    font: fontBold,
    color: ACCENT,
  });
  page.drawLine({
    start: { x: 36, y: 48 },
    end: { x: PAGE_WIDTH - 36, y: 48 },
    thickness: 0.5,
    color: RULE,
  });
  page.drawText(`Master Services Agreement  ·  Page ${pageNumber} of 6`, {
    x: 36,
    y: 32,
    size: 8,
    font,
    color: MUTED,
  });
  page.drawText("Fixture MSA-NW-ACME-2026", {
    x: PAGE_WIDTH - 160,
    y: 32,
    size: 8,
    font,
    color: MUTED,
  });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawParagraph(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size = 11,
  width = PAGE_WIDTH - 72,
  leading = 15,
): number {
  const lines = wrap(text, font, size, width);
  let cursor = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursor, size, font, color: INK });
    cursor -= leading;
  }
  return cursor;
}

function drawCover(page: PDFPage, font: PDFFont, fontBold: PDFFont) {
  page.drawText("MASTER SERVICES AGREEMENT", {
    x: 72,
    y: 700,
    size: 20,
    font: fontBold,
    color: INK,
  });
  page.drawText("Northwind Labs Inc.  ×  Acme Dynamics LLC", {
    x: 72,
    y: 676,
    size: 12,
    font,
    color: MUTED,
  });
  page.drawText("Effective Date: 1 March 2026    ·    Agreement No. MSA-NW-ACME-2026", {
    x: 72,
    y: 656,
    size: 10,
    font,
    color: MUTED,
  });

  let y = 620;
  y = drawParagraph(
    page,
    font,
    "This Master Services Agreement (the “Agreement”) is entered into as of 1 March 2026 (the “Effective Date”) by and between Northwind Labs Inc., a Delaware corporation with a principal place of business at 100 Harbor Loop, Suite 4, Fiction City, CA 94100 (“Northwind”), and Acme Dynamics LLC, a Delaware limited liability company with a principal place of business at 88 Gadget Avenue, Invented Park, NY 10000 (“Acme”). Northwind and Acme may be referred to individually as a “Party” and collectively as the “Parties.”",
    54,
    y,
  );
  y -= 12;
  y = drawParagraph(
    page,
    font,
    "This document is a synthetic fixture created for the Lumin Sign AG-UI envelope-prep demo. It contains no real customer, employee, or contract data. Signature, initials, date, and printed-name blocks appear only on the last page so an agent can place fields against a known ground truth.",
    54,
    y,
  );
  y -= 18;
  page.drawText("1. Purpose", { x: 54, y, size: 13, font: fontBold, color: INK });
  y -= 20;
  drawParagraph(
    page,
    font,
    "Northwind wishes to obtain, and Acme wishes to provide, professional services relating to product design, software implementation, and related advisory work, as described in one or more Statements of Work (“SOW”) executed under this Agreement. Each SOW is incorporated by reference. In the event of a conflict, the SOW controls for that engagement’s commercial terms, and this Agreement controls for all other terms.",
    54,
    y,
  );
}

function drawDefinitions(page: PDFPage, font: PDFFont, fontBold: PDFFont) {
  page.drawText("2. Definitions", { x: 54, y: 720, size: 13, font: fontBold, color: INK });
  const items = [
    "“Confidential Information” means non-public information disclosed by a Party, including product plans, customer lists that are synthetic in this fixture, pricing, and source code, whether marked confidential or that a reasonable person would understand to be confidential.",
    "“Deliverable” means work product identified as such in an SOW.",
    "“Fees” means amounts payable by Northwind to Acme under an SOW.",
    "“Services” means the work Acme performs under this Agreement and any SOW.",
    "“Signature Page” means page 6 of this Agreement, titled IN WITNESS WHEREOF, which contains the only signature, initials, date, and printed-name blocks.",
  ];
  let y = 698;
  for (const item of items) {
    y = drawParagraph(page, font, item, 54, y);
    y -= 10;
  }
  page.drawText("3. Term", { x: 54, y, size: 13, font: fontBold, color: INK });
  y -= 20;
  drawParagraph(
    page,
    font,
    "This Agreement begins on the Effective Date and continues until terminated under Section 11. Each SOW has its own start and end dates. Survival: confidentiality, payment, limitation of liability, and the signature formalities on the Signature Page survive termination.",
    54,
    y,
  );
}

function drawServices(page: PDFPage, font: PDFFont, fontBold: PDFFont) {
  page.drawText("4. Services", { x: 54, y: 720, size: 13, font: fontBold, color: INK });
  let y = 698;
  y = drawParagraph(
    page,
    font,
    "Acme shall perform the Services in a professional manner consistent with industry standards for comparable work. Northwind shall provide timely access to personnel, systems, and information reasonably required. Neither Party is obligated to issue or accept any SOW. Change requests are written and signed (or e-signed) by both Parties.",
    54,
    y,
  );
  y -= 16;
  page.drawText("5. Personnel and subcontractors", {
    x: 54,
    y,
    size: 13,
    font: fontBold,
    color: INK,
  });
  y -= 20;
  drawParagraph(
    page,
    font,
    "Acme remains responsible for the acts of its employees and permitted subcontractors. Named key personnel in an SOW may not be replaced without Northwind’s prior written consent, not to be unreasonably withheld. This fixture names no real people other than the invented signers Jordan Hale (Acme) and Priya Shah (Northwind).",
    54,
    y,
  );
}

function drawFees(page: PDFPage, font: PDFFont, fontBold: PDFFont) {
  page.drawText("6. Fees and payment", { x: 54, y: 720, size: 13, font: fontBold, color: INK });
  let y = 698;
  y = drawParagraph(
    page,
    font,
    "Northwind shall pay Fees as set out in each SOW. Unless an SOW says otherwise, Acme invoices monthly, and invoices are due net thirty (30) days. Late amounts accrue interest at 1% per month or the maximum allowed by law, whichever is less. Taxes: Fees exclude applicable taxes, which Northwind pays except taxes on Acme’s net income.",
    54,
    y,
  );
  y -= 16;
  page.drawText("7. Intellectual property", { x: 54, y, size: 13, font: fontBold, color: INK });
  y -= 20;
  drawParagraph(
    page,
    font,
    "Upon full payment, Northwind owns Deliverables, excluding Acme’s pre-existing materials and generic frameworks (“Acme IP”). Acme grants Northwind a perpetual, worldwide, non-exclusive license to use Acme IP solely as embedded in the Deliverables. Open source components are governed by their licenses, listed in the relevant SOW.",
    54,
    y,
  );
}

function drawConfidentiality(page: PDFPage, font: PDFFont, fontBold: PDFFont) {
  page.drawText("8. Confidentiality", { x: 54, y: 720, size: 13, font: fontBold, color: INK });
  let y = 698;
  y = drawParagraph(
    page,
    font,
    "Each Party shall protect the other’s Confidential Information with at least reasonable care and use it only to perform this Agreement. Exceptions: information that is public, independently developed, or rightfully received from a third party. Compelled disclosure: the receiving Party gives prompt notice where legally permitted.",
    54,
    y,
  );
  y -= 16;
  page.drawText("9. Limitation of liability", { x: 54, y, size: 13, font: fontBold, color: INK });
  y -= 20;
  y = drawParagraph(
    page,
    font,
    "Except for confidentiality breaches, willful misconduct, or payment obligations, neither Party is liable for indirect, incidental, or consequential damages. Aggregate liability under this Agreement is limited to the Fees paid or payable under the applicable SOW in the twelve months before the claim.",
    54,
    y,
  );
  y -= 16;
  page.drawText("10. Governing law", { x: 54, y, size: 13, font: fontBold, color: INK });
  y -= 20;
  drawParagraph(
    page,
    font,
    "This Agreement is governed by the laws of the State of Delaware, excluding conflict-of-law rules. The Parties may use electronic signatures. Counterpart execution is permitted. The Signature Page that follows is the only page that contains signature, initials, date, and printed-name capture areas for Jordan Hale and Priya Shah.",
    54,
    y,
  );
}

function drawUnderlineBox(
  page: PDFPage,
  box: { x: number; y: number; width: number; height: number },
) {
  page.drawRectangle({
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    borderColor: RULE,
    borderWidth: 0.9,
  });
}

function drawSignatures(page: PDFPage, font: PDFFont, fontBold: PDFFont, fontSans: PDFFont) {
  page.drawText("IN WITNESS WHEREOF", {
    x: 54,
    y: 720,
    size: 14,
    font: fontBold,
    color: INK,
  });
  let y = 698;
  y = drawParagraph(
    page,
    font,
    "the Parties have executed this Master Services Agreement as of the Effective Date. Each signer should print their name, sign, date, and initial in the labeled boxes below. These boxes are the ground-truth field placements for the demo.",
    54,
    y,
  );

  page.drawText("Acme Dynamics LLC", { x: 54, y: 500, size: 12, font: fontBold, color: INK });
  page.drawText("Authorized Signatory: Jordan Hale, CEO", {
    x: 54,
    y: 484,
    size: 9,
    font: fontSans,
    color: MUTED,
  });
  page.drawText("Northwind Labs Inc.", { x: 324, y: 500, size: 12, font: fontBold, color: INK });
  page.drawText("Authorized Signatory: Priya Shah, General Counsel", {
    x: 324,
    y: 484,
    size: 9,
    font: fontSans,
    color: MUTED,
  });

  const labels: Array<[keyof typeof PDF_FIELDS, string, number, number]> = [
    ["jordan-name", "Printed name", 54, 456],
    ["jordan-signature", "Signature", 54, 418],
    ["jordan-date", "Date", 54, 358],
    ["jordan-initials", "Initials", 54, 318],
    ["priya-name", "Printed name", 324, 456],
    ["priya-signature", "Signature", 324, 418],
    ["priya-date", "Date", 324, 358],
    ["priya-initials", "Initials", 324, 318],
  ];
  for (const [id, label, lx, ly] of labels) {
    page.drawText(label, { x: lx, y: ly, size: 8, font: fontSans, color: MUTED });
    drawUnderlineBox(page, PDF_FIELDS[id]);
  }
}

await main();
