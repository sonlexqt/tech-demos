import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { GROUND_TRUTHS } from "./truth.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "fixtures");

type PageCursor = { page: PDFPage; y: number; font: PDFFont; bold: PDFFont };

const PAGE = { width: 612, height: 792, margin: 54, size: 10, leading: 13 };

async function newDoc(title: string, fixtureId: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor("Lumin Sign preflight fixtures (synthetic)");
  doc.setSubject(`LUMIN_FIXTURE:${fixtureId}`);
  doc.setCreator("gemini-decisions-preflight");
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  return { doc, font, bold };
}

function addPage(doc: PDFDocument, font: PDFFont, bold: PDFFont, fixtureId: string, pageNo: { n: number }): PageCursor {
  const page = doc.addPage([PAGE.width, PAGE.height]);
  pageNo.n += 1;
  page.drawText(`LUMIN_FIXTURE:${fixtureId}`, {
    x: PAGE.margin,
    y: 28,
    size: 7,
    font,
    color: rgb(0.55, 0.55, 0.55),
  });
  page.drawText(`Synthetic demo contract — not customer data  ·  p. ${pageNo.n}`, {
    x: PAGE.margin + 160,
    y: 28,
    size: 7,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  return { page, y: PAGE.height - PAGE.margin, font, bold };
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function ensure(cur: PageCursor, doc: PDFDocument, fixtureId: string, pageNo: { n: number }, need: number): PageCursor {
  if (cur.y - need < 48) return addPage(doc, cur.font, cur.bold, fixtureId, pageNo);
  return cur;
}

function para(cur: PageCursor, doc: PDFDocument, fixtureId: string, pageNo: { n: number }, text: string, opts?: { bold?: boolean; size?: number; gap?: number }): PageCursor {
  const size = opts?.size ?? PAGE.size;
  const font = opts?.bold ? cur.bold : cur.font;
  const width = PAGE.width - PAGE.margin * 2;
  const lines = wrap(font, text, size, width);
  let c = cur;
  for (const line of lines) {
    c = ensure(c, doc, fixtureId, pageNo, PAGE.leading + 2);
    c.page.drawText(line, { x: PAGE.margin, y: c.y, size, font, color: rgb(0.08, 0.08, 0.08) });
    c.y -= PAGE.leading;
  }
  c.y -= opts?.gap ?? 6;
  return c;
}

function heading(cur: PageCursor, doc: PDFDocument, fixtureId: string, pageNo: { n: number }, text: string): PageCursor {
  return para(cur, doc, fixtureId, pageNo, text, { bold: true, size: 12, gap: 8 });
}

function sigBlock(
  cur: PageCursor,
  doc: PDFDocument,
  fixtureId: string,
  pageNo: { n: number },
  party: string,
  opts: { name: boolean; title: boolean; date: boolean },
): PageCursor {
  let c = para(cur, doc, fixtureId, pageNo, party, { bold: true, gap: 4 });
  c = para(c, doc, fixtureId, pageNo, "Signature: ______________________________", { gap: 2 });
  if (opts.name) c = para(c, doc, fixtureId, pageNo, "Printed name: ___________________________", { gap: 2 });
  if (opts.title) c = para(c, doc, fixtureId, pageNo, "Title / capacity: _______________________", { gap: 2 });
  if (opts.date) c = para(c, doc, fixtureId, pageNo, "Date: __________________________________", { gap: 10 });
  if (!opts.name && !opts.title && !opts.date) {
    c = para(c, doc, fixtureId, pageNo, "Sign here: ______", { gap: 10 });
  }
  return c;
}

async function writePdf(id: string, title: string, build: (doc: PDFDocument, font: PDFFont, bold: PDFFont) => void) {
  const { doc, font, bold } = await newDoc(title, id);
  build(doc, font, bold);
  const bytes = await doc.save();
  const pdfPath = path.join(OUT, `${id}.pdf`);
  await writeFile(pdfPath, bytes);
  const truth = GROUND_TRUTHS.find((g) => g.id === id);
  if (!truth) throw new Error(`missing truth ${id}`);
  await writeFile(path.join(OUT, `${id}.truth.json`), JSON.stringify(truth, null, 2) + "\n");
  console.log("wrote", pdfPath);
}

function msaClean(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const id = "msa-clean";
  const pageNo = { n: 0 };
  let c = addPage(doc, font, bold, id, pageNo);
  c = heading(c, doc, id, pageNo, "MASTER SERVICES AGREEMENT");
  c = para(
    c, doc, id, pageNo,
    "This Master Services Agreement (the “Agreement”) is entered into as of 1 November 2026 (the “Effective Date”) by and between Acme Robotics, Inc., a Delaware corporation with notice address 100 Assembly Way, Wilmington, DE 19801, email legal@acme-robotics.example (“Provider”), and Northwind Logistics LLC, a Delaware limited liability company with notice address 40 Harbor Street, Suite 4, Wilmington, DE 19802, email counsel@northwind-logistics.example (“Customer”). Provider and Customer are each a “Party” and together the “Parties.”",
  );
  c = heading(c, doc, id, pageNo, "1. Services and fees");
  c = para(
    c, doc, id, pageNo,
    "Provider shall perform the professional services described in Exhibit A (Fees and Services) (the “Services”). Customer shall pay the fees set out in Exhibit A. Invoices are due Net 30 days from the invoice date. Overdue amounts accrue a late fee of 1.5% per month, or the maximum allowed by law, whichever is less.",
  );
  c = heading(c, doc, id, pageNo, "2. Term and renewal");
  c = para(
    c, doc, id, pageNo,
    "The initial term is twenty-four (24) months beginning on the Effective Date. Thereafter this Agreement automatically renews for successive twelve (12) month periods unless either Party gives written notice of non-renewal at least sixty (60) days before the then-current term ends.",
  );
  c = heading(c, doc, id, pageNo, "3. Confidentiality");
  c = para(
    c, doc, id, pageNo,
    "Each Party shall protect the other Party’s confidential information with at least reasonable care and use it only to perform this Agreement. These duties survive for three (3) years after termination, and indefinitely for trade secrets.",
  );
  c = heading(c, doc, id, pageNo, "4. Intellectual property");
  c = para(
    c, doc, id, pageNo,
    "Each Party retains ownership of its pre-existing intellectual property. Work product created by Provider specifically for Customer under the Services vests in Customer upon payment in full, excluding Provider tools and libraries.",
  );
  c = heading(c, doc, id, pageNo, "5. Indemnity and limitation of liability");
  c = para(
    c, doc, id, pageNo,
    "Provider shall indemnify Customer against third-party claims that the Services infringe a US intellectual property right, subject to prompt notice and control of defense. Except for confidentiality breaches, indemnification, and willful misconduct, each Party’s aggregate liability under this Agreement is limited to the fees paid or payable in the twelve (12) months before the claim. Neither Party is liable for indirect, incidental, or consequential damages.",
  );
  c = heading(c, doc, id, pageNo, "6. Insurance");
  c = para(
    c, doc, id, pageNo,
    "Provider shall maintain commercial general liability insurance with a limit of not less than USD 2,000,000 per occurrence and professional liability insurance of not less than USD 1,000,000.",
  );
  c = heading(c, doc, id, pageNo, "7. Termination");
  c = para(
    c, doc, id, pageNo,
    "Either Party may terminate for convenience on thirty (30) days’ written notice, and immediately for material breach not cured within fifteen (15) days after notice.",
  );
  c = heading(c, doc, id, pageNo, "8. Assignment");
  c = para(
    c, doc, id, pageNo,
    "Neither Party may assign this Agreement without the prior written consent of the other Party, except to a successor to substantially all of its assets. Any other assignment is void.",
  );
  c = heading(c, doc, id, pageNo, "9. Force majeure");
  c = para(
    c, doc, id, pageNo,
    "Neither Party is liable for delay caused by events beyond its reasonable control, including natural disasters, epidemic, war, labor dispute, or failure of utilities, provided it gives prompt notice.",
  );
  c = heading(c, doc, id, pageNo, "10. General");
  c = para(
    c, doc, id, pageNo,
    "This Agreement is the entire agreement between the Parties and supersedes prior proposals relating to the Services. Amendments must be in a writing signed by both Parties. If a provision is unenforceable, the remainder stays in effect. This Agreement may be executed in counterparts, including electronic signatures, each of which is deemed an original. Electronic signatures are permitted and have the same effect as wet-ink signatures.",
  );
  c = heading(c, doc, id, pageNo, "11. Governing law and venue");
  c = para(
    c, doc, id, pageNo,
    "This Agreement is governed by the laws of the State of Delaware, without regard to conflict-of-law rules. The state and federal courts located in Wilmington, Delaware have exclusive venue.",
  );
  c = para(
    c, doc, id, pageNo,
    "IN WITNESS WHEREOF the Parties have executed this Agreement as of the Effective Date.",
    { gap: 14 },
  );
  c = sigBlock(c, doc, id, pageNo, "ACME ROBOTICS, INC.", { name: true, title: true, date: true });
  c = sigBlock(c, doc, id, pageNo, "NORTHWIND LOGISTICS LLC", { name: true, title: true, date: true });
  c = heading(c, doc, id, pageNo, "EXHIBIT A — Fees and Services");
  c = para(
    c, doc, id, pageNo,
    "Provider will supply warehouse robotics integration consulting at USD 12,500 per month, including monthly QBR and a named solution architect. Travel is billed at cost with prior written approval. This Exhibit A is attached to and part of the Agreement.",
  );
}

function msaPlanted(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const id = "msa-planted";
  const pageNo = { n: 0 };
  let c = addPage(doc, font, bold, id, pageNo);
  c = heading(c, doc, id, pageNo, "MASTER SERVICES AGREEMENT");
  c = para(
    c, doc, id, pageNo,
    "Draft dated 12 November 2026. This Master Services Agreement is made as of Effective Date: ________ by Acme Robotics, Inc. (“Provider”) and the Client. Term begins: 1 March 2024. Term: as agreed. Initial each page: ____ / ____.",
  );
  c = heading(c, doc, id, pageNo, "1. Services");
  c = para(
    c, doc, id, pageNo,
    "Provider will perform the Services described in the Fees schedule. The Fees and the Security obligations in Exhibit B (Data Security) and the project in Exhibit C (SOW) apply. Defined Terms such as Services, Fees, and Deliverables are used throughout without a definitions section.",
  );
  c = heading(c, doc, id, pageNo, "2. Renewal");
  c = para(
    c, doc, id, pageNo,
    "This Agreement auto-renews annually. There is no opt-out notice period.",
  );
  c = heading(c, doc, id, pageNo, "3. Assignment");
  c = para(
    c, doc, id, pageNo,
    "The Client may assign this Agreement freely without Provider’s consent.",
  );
  c = heading(c, doc, id, pageNo, "4. Execution");
  c = para(
    c, doc, id, pageNo,
    "This Agreement must be signed in wet ink only. Electronic signatures are not permitted. This Agreement must be witnessed.",
  );
  c = heading(c, doc, id, pageNo, "5. Law");
  c = para(
    c, doc, id, pageNo,
    "This Agreement is governed by the laws of the Vendor's principal place of business.",
  );
  c = para(
    c, doc, id, pageNo,
    "Sign below. Only Provider’s block is provided.",
    { gap: 12 },
  );
  c = sigBlock(c, doc, id, pageNo, "ACME ROBOTICS, INC.", { name: false, title: false, date: false });
  c = heading(c, doc, id, pageNo, "EXHIBIT A");
  c = para(
    c, doc, id, pageNo,
    "(title only — body of fees omitted). Exhibit B (Data Security) and Exhibit C (SOW) are referenced above and are not attached.",
  );
}

function ndaClean(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const id = "nda-clean";
  const pageNo = { n: 0 };
  let c = addPage(doc, font, bold, id, pageNo);
  c = heading(c, doc, id, pageNo, "MUTUAL NON-DISCLOSURE AGREEMENT");
  c = para(
    c, doc, id, pageNo,
    "This Mutual Non-Disclosure Agreement (the “Agreement”) is effective as of 15 October 2026 (the “Effective Date”) between Lumenora Labs, Inc., a California corporation, notice address 88 Mission Street, San Francisco, CA 94105, email legal@lumenora.example (“Lumenora”), and Cedar & Pine Design Co., a California corporation, notice address 12 Grove Court, Oakland, CA 94612, email hello@cedarpine.example (“Cedar”). Each is a “Party.”",
  );
  c = heading(c, doc, id, pageNo, "1. Purpose and confidential information");
  c = para(
    c, doc, id, pageNo,
    "The Parties wish to discuss a possible design collaboration. “Confidential Information” means non-public information disclosed by a Party that is marked confidential or that a reasonable person would understand to be confidential, including product plans, customer lists, and pricing.",
  );
  c = heading(c, doc, id, pageNo, "2. Non-disclosure");
  c = para(
    c, doc, id, pageNo,
    "The receiving Party shall not disclose Confidential Information to third parties and shall use it only for the Purpose. Standard exclusions apply for information that is public, independently developed, or rightfully received from a third party without duty.",
  );
  c = heading(c, doc, id, pageNo, "3. Term");
  c = para(
    c, doc, id, pageNo,
    "This Agreement remains in effect for three (3) years from the Effective Date. Confidentiality obligations survive for three (3) years after termination. Either Party may terminate this Agreement on thirty (30) days’ written notice. Upon termination the receiving Party shall return or destroy Confidential Information on request.",
  );
  c = heading(c, doc, id, pageNo, "4. Assignment");
  c = para(
    c, doc, id, pageNo,
    "Neither Party may assign this Agreement without the prior written consent of the other Party.",
  );
  c = heading(c, doc, id, pageNo, "5. Force majeure; general");
  c = para(
    c, doc, id, pageNo,
    "A Party is excused from delay caused by force majeure events beyond its reasonable control. This Agreement is the entire agreement regarding confidentiality and supersedes prior NDAs on the same subject. Amendments must be in writing and signed. If a provision is unenforceable the remainder continues. This Agreement may be executed in counterparts. Electronic signatures are permitted and have the same effect as wet-ink signatures.",
  );
  c = heading(c, doc, id, pageNo, "6. Governing law and venue");
  c = para(
    c, doc, id, pageNo,
    "This Agreement is governed by the laws of the State of California. The state and federal courts in San Francisco, California have exclusive venue.",
  );
  c = para(c, doc, id, pageNo, "IN WITNESS WHEREOF the Parties have executed this Agreement.", { gap: 14 });
  c = sigBlock(c, doc, id, pageNo, "LUMENORA LABS, INC.", { name: true, title: true, date: true });
  c = sigBlock(c, doc, id, pageNo, "CEDAR & PINE DESIGN CO.", { name: true, title: true, date: true });
}

function ndaPlanted(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const id = "nda-planted";
  const pageNo = { n: 0 };
  let c = addPage(doc, font, bold, id, pageNo);
  c = heading(c, doc, id, pageNo, "NON-DISCLOSURE AGREEMENT");
  c = para(
    c, doc, id, pageNo,
    "Effective on the last date signed. Also effective 1 January 2020. Lumenora Labs, Inc. (“Recipient”) and Disclosing Party: ____________. Term begins: ______. Term duration is not stated. Initial here: ______ . Confidential Information and Purpose are used as Defined Terms without definitions. Excluded information is listed in Schedule 1 (Excluded Information), which is not attached.",
  );
  c = heading(c, doc, id, pageNo, "1. Confidentiality");
  c = para(
    c, doc, id, pageNo,
    "Recipient shall not disclose Confidential Information. Confidentiality auto-renews each year. There is no opt-out notice period.",
  );
  c = heading(c, doc, id, pageNo, "2. Assignment");
  c = para(
    c, doc, id, pageNo,
    "Recipient may assign this Agreement without consent.",
  );
  c = heading(c, doc, id, pageNo, "3. Execution");
  c = para(
    c, doc, id, pageNo,
    "Wet ink only. Electronic signatures are not permitted. This Agreement must be signed before a witness.",
  );
  c = heading(c, doc, id, pageNo, "4. Law");
  c = para(
    c, doc, id, pageNo,
    "This Agreement is governed by the laws of England and Wales.",
  );
  c = para(c, doc, id, pageNo, "Only Recipient’s signature block is provided.", { gap: 12 });
  c = sigBlock(c, doc, id, pageNo, "LUMENORA LABS, INC.", { name: false, title: false, date: false });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await writePdf("msa-clean", "Synthetic MSA (clean)", msaClean);
  await writePdf("msa-planted", "Synthetic MSA (planted problems)", msaPlanted);
  await writePdf("nda-clean", "Synthetic NDA (clean)", ndaClean);
  await writePdf("nda-planted", "Synthetic NDA (planted problems)", ndaPlanted);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
