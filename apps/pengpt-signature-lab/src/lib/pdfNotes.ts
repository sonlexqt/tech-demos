import { LineCapStyle, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { splitStrokes } from "./strokes";
import type { StrokeFile } from "./types";

/**
 * Build a one-page notes PDF and paint generated strokes as ink (pdf-lib paths).
 * This is the "write my notes in my own handwriting" bonus: the appearance is
 * an annotation-like overlay on a dummy agreement page, always watermarked.
 */
export async function notesPdf(strokes: StrokeFile): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.97, 0.94),
  });

  page.drawText("SYNTHETIC", {
    x: 36,
    y: height - 36,
    size: 11,
    font: sans,
    color: rgb(0.77, 0.27, 0.21),
  });
  page.drawText("PenGPT Signature Lab · not a customer document", {
    x: 130,
    y: height - 36,
    size: 10,
    font: sans,
    color: rgb(0.35, 0.32, 0.28),
  });

  page.drawText("Harbor Notes — volunteer scribble overlay", {
    x: 36,
    y: height - 72,
    size: 18,
    font: serifBold,
    color: rgb(0.1, 0.15, 0.26),
  });
  page.drawText("Demo only. Fixtures, not a live signing ceremony.", {
    x: 36,
    y: height - 92,
    size: 10,
    font: serif,
    color: rgb(0.3, 0.3, 0.3),
  });

  const body = [
    "Please initial the margin and sign the acknowledgment below.",
    "Drawn ink on this page was generated from a short handwriting sample",
    `(volunteer stand-in: ${strokes.displayName}; text: “${strokes.text}”).`,
    "If this looks close at a glance, that is the point: stroke generators",
    "are cheap. Identity proof (Lumin ID) should carry more audit weight",
    "than a draw-to-sign pad alone.",
  ];
  body.forEach((line, i) => {
    page.drawText(line, {
      x: 36,
      y: height - 130 - i * 16,
      size: 11,
      font: serif,
      color: rgb(0.12, 0.12, 0.12),
    });
  });

  const boxY = 340;
  page.drawRectangle({
    x: 36,
    y: boxY,
    width: width - 72,
    height: 220,
    borderColor: rgb(0.75, 0.7, 0.62),
    borderWidth: 1,
    color: rgb(1, 0.99, 0.96),
  });
  page.drawText("Handwritten notes (generated strokes)", {
    x: 48,
    y: boxY + 200,
    size: 9,
    font: sans,
    color: rgb(0.4, 0.35, 0.3),
  });

  const sx = (width - 96) / strokes.canvas.width;
  const sy = 170 / strokes.canvas.height;
  const scale = Math.min(sx, sy);
  const ox = 48;
  const oy = boxY + 24;
  const ink = rgb(0.48, 0.12, 0.16);

  for (const stroke of splitStrokes(strokes.points)) {
    if (stroke.length < 2) {
      if (stroke[0]) {
        page.drawCircle({
          x: ox + stroke[0].x * scale,
          y: oy + (strokes.canvas.height - stroke[0].y) * scale,
          size: 1.1,
          color: ink,
        });
      }
      continue;
    }
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1];
      const b = stroke[i];
      page.drawLine({
        start: {
          x: ox + a.x * scale,
          y: oy + (strokes.canvas.height - a.y) * scale,
        },
        end: {
          x: ox + b.x * scale,
          y: oy + (strokes.canvas.height - b.y) * scale,
        },
        thickness: 1.35,
        color: ink,
        lineCap: LineCapStyle.Round,
      });
    }
  }

  page.drawText("SYNTHETIC HANDWRITING — do not treat as a signature", {
    x: 48,
    y: boxY + 8,
    size: 8,
    font: sans,
    color: rgb(0.77, 0.27, 0.21),
  });

  page.drawText(
    "pdf-lib overlay. No Cloudflare deploy: this lab stays on localhost.",
    {
      x: 36,
      y: 48,
      size: 8,
      font: sans,
      color: rgb(0.4, 0.4, 0.4),
    },
  );

  return pdf.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
