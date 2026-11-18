import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Annotation } from "./annotations";

export async function flattenAnnotations(pdfBytes: ArrayBuffer, items: Annotation[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const imageCache = new Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>();

  for (const a of items) {
    const page = pdf.getPage(a.page - 1);
    if (!page) continue;
    const { width, height } = page.getSize();
    if (a.type === "highlight") {
      page.drawRectangle({
        x: a.x * width,
        y: height - (a.y + a.h) * height,
        width: a.w * width,
        height: a.h * height,
        color: rgb(0.98, 0.8, 0.08),
        opacity: 0.38,
        borderWidth: 0,
      });
    } else if (a.type === "text") {
      const size = Math.max(9, a.fontSize * height);
      page.drawText(a.text, {
        x: a.x * width,
        y: height - a.y * height - size,
        size,
        font,
        color: rgb(0.06, 0.09, 0.16),
      });
    } else if (a.type === "ink") {
      if (a.points.length < 2) continue;
      const start = a.points[0];
      const rest = a.points.slice(1).map((p) => ({
        x: (p.x - start.x) * width,
        y: (start.y - p.y) * height,
      }));
      page.drawSvgPath(
        `M 0 0 ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")}`,
        {
          x: start.x * width,
          y: height - start.y * height,
          borderColor: rgb(0.06, 0.09, 0.16),
          borderWidth: Math.max(1.2, height * 0.004),
          borderOpacity: 1,
        },
      );
    } else if (a.type === "signature") {
      let image = imageCache.get(a.dataUrl);
      if (!image) {
        const raw = dataUrlToBytes(a.dataUrl);
        image = await pdf.embedPng(raw);
        imageCache.set(a.dataUrl, image);
      }
      const w = a.w * width;
      const h = a.h * height;
      page.drawImage(image, {
        x: a.x * width,
        y: height - (a.y + a.h) * height,
        width: w,
        height: h,
      });
    }
  }

  return pdf.save();
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
