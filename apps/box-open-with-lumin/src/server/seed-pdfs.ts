import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const PAGE = { width: 612, height: 792 };
const INK = rgb(0.12, 0.16, 0.22);
const MUTED = rgb(0.35, 0.4, 0.48);
const RULE = rgb(0.82, 0.85, 0.9);
const TEAL = rgb(0.05, 0.55, 0.52);
const BOX_BLUE = rgb(0, 0.38, 0.84);

type Line = { text: string; size?: number; color?: ReturnType<typeof rgb>; gap?: number };

async function pagesFromLines(title: string, accent: ReturnType<typeof rgb>, blocks: Line[][]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  for (let i = 0; i < blocks.length; i++) {
    const page = pdf.addPage([PAGE.width, PAGE.height]);
    let y = PAGE.height - 56;
    page.drawRectangle({ x: 0, y: PAGE.height - 8, width: PAGE.width, height: 8, color: accent });
    page.drawText("LUMIN  ·  DEMO DOCUMENT", {
      x: 48,
      y: PAGE.height - 36,
      size: 9,
      font: bold,
      color: accent,
    });
    page.drawText(`Page ${i + 1} of ${blocks.length}`, {
      x: PAGE.width - 110,
      y: PAGE.height - 36,
      size: 9,
      font,
      color: MUTED,
    });
    page.drawLine({
      start: { x: 48, y: PAGE.height - 44 },
      end: { x: PAGE.width - 48, y: PAGE.height - 44 },
      thickness: 0.6,
      color: RULE,
    });

    if (i === 0) {
      page.drawText(title, { x: 48, y: y - 28, size: 20, font: bold, color: INK });
      y -= 52;
    }

    for (const line of blocks[i]) {
      const size = line.size ?? 11;
      const used = line.text.startsWith("Section ") || line.text === title ? bold : font;
      const wrapped = wrap(line.text, 92);
      for (const w of wrapped) {
        page.drawText(w, {
          x: 48,
          y,
          size,
          font: used,
          color: line.color ?? INK,
        });
        y -= line.gap ?? size + 6;
      }
    }

    if (i === blocks.length - 1) {
      y -= 12;
      page.drawText("Signature", { x: 48, y, size: 11, font: bold, color: INK });
      y -= 36;
      page.drawLine({
        start: { x: 48, y },
        end: { x: 280, y },
        thickness: 0.8,
        color: INK,
      });
      page.drawText("Authorized signatory", {
        x: 48,
        y: y - 14,
        size: 9,
        font: italic,
        color: MUTED,
      });
      page.drawText("Date", { x: 320, y: y + 36, size: 11, font: bold, color: INK });
      page.drawLine({
        start: { x: 320, y },
        end: { x: 520, y },
        thickness: 0.8,
        color: INK,
      });
    }

    page.drawText("Generated for the Box Open-with Lumin demo. Not a legal instrument.", {
      x: 48,
      y: 28,
      size: 8,
      font: italic,
      color: MUTED,
    });
  }

  return pdf.save();
}

function wrap(text: string, width: number): string[] {
  if (text.length <= width) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > width) {
      if (cur) lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildNdaPdf(): Promise<Uint8Array> {
  return pagesFromLines("Mutual Non-Disclosure Agreement", TEAL, [
    [
      { text: "Effective date: 18 November 2026    ·    Parties: Acme Labs Inc. and Northwind Partners LLC", size: 10, color: MUTED, gap: 18 },
      { text: "Section 1. Purpose", size: 13, gap: 16 },
      {
        text: "The parties wish to explore a joint product integration in which a PDF editor (Lumin) is launched from Box via a Web App Integration (Open with). In connection with that discussion they may disclose confidential information.",
        gap: 14,
      },
      { text: "Section 2. Confidential Information", size: 13, gap: 16 },
      {
        text: "Confidential Information means all non-public information disclosed by either party, including product roadmaps, customer counts, OAuth client configuration, and any file contents accessed through Box APIs. Information that is public, independently developed, or rightfully received from a third party is excluded.",
        gap: 14,
      },
      { text: "Section 3. Non-use and non-disclosure", size: 13, gap: 16 },
      {
        text: "The receiving party will use Confidential Information solely to evaluate the Open-with integration and will not disclose it to third parties except to employees and contractors bound by equivalent obligations. The receiving party will protect the information with at least reasonable care.",
        gap: 14,
      },
      { text: "Section 4. Term", size: 13, gap: 16 },
      {
        text: "This Agreement remains in effect for two (2) years from the Effective Date. Surviving obligations last three (3) years after disclosure.",
        gap: 14,
      },
    ],
    [
      { text: "Section 5. No license", size: 13, gap: 16 },
      {
        text: "Nothing in this Agreement grants a license under any intellectual property. File versions saved back to Box remain owned by the disclosing party.",
        gap: 14,
      },
      { text: "Section 6. Signatures", size: 13, gap: 16 },
      {
        text: "The parties execute this Agreement as of the Effective Date. Open this PDF with Lumin, stamp a signature on the line below, and save back to Box as a new file version (same file id, new etag).",
        gap: 18,
      },
      { text: "For Acme Labs Inc.", size: 11, gap: 48 },
      { text: "For Northwind Partners LLC", size: 11, gap: 16 },
    ],
  ]);
}

export async function buildSowPdf(): Promise<Uint8Array> {
  return pagesFromLines("Statement of Work  ·  Box Open-with channel", BOX_BLUE, [
    [
      { text: "SOW-2026-014    ·    Customer: Lumin    ·    Vendor: Internal platform", size: 10, color: MUTED, gap: 18 },
      { text: "Section 1. Scope", size: 13, gap: 16 },
      {
        text: "Stand up a Box Web App Integration so a Box user can right-click a PDF, choose Open with Lumin, annotate or sign, and write a new version of the same file. Google Drive already contributes about 26% of tagged Open-with entries; Box today contributes none.",
        gap: 14,
      },
      { text: "Section 2. Deliverables", size: 13, gap: 16 },
      { text: "1. Popup / Open-with callback that receives file_id, auth_code, and user_id.", gap: 12 },
      { text: "2. OAuth 2.0 authorization-code exchange scoped to the file.", gap: 12 },
      { text: "3. Download, in-browser annotate, flatten, upload via POST /files/{id}/content.", gap: 12 },
      { text: "4. If-Match / etag optimistic concurrency with a visible 412 path.", gap: 12 },
      { text: "5. Version history (GET /files/{id}/versions) showing v1 -> v2.", gap: 16 },
      { text: "Section 3. Acceptance", size: 13, gap: 16 },
      {
        text: "Mock mode must complete the flow with no credentials. Live mode activates only when BOX_CLIENT_ID and BOX_CLIENT_SECRET are present.",
        gap: 14,
      },
    ],
  ]);
}

export async function buildInvoicePdf(): Promise<Uint8Array> {
  return pagesFromLines("Invoice  INV-1042", rgb(0.55, 0.25, 0.08), [
    [
      { text: "Bill to: Northwind Partners LLC    ·    Due: Net 15    ·    Currency: USD", size: 10, color: MUTED, gap: 18 },
      { text: "Description                                              Qty        Amount", size: 11, gap: 16 },
      { text: "Box Open-with integration spike (demo)                     1     4,800.00", gap: 12 },
      { text: "PDF annotation + versioned save-back                       1     2,400.00", gap: 12 },
      { text: "Concurrency / etag conflict handling                       1       900.00", gap: 18 },
      { text: "Subtotal                                                           8,100.00", gap: 12 },
      { text: "Tax (exempt - internal)                                                0.00", gap: 12 },
      { text: "Total due                                                          8,100.00", size: 13, gap: 20 },
      {
        text: "Please annotate approved / paid on this PDF in Lumin and save the signed copy back to the same Box file as version 2.",
        gap: 14,
      },
    ],
  ]);
}
