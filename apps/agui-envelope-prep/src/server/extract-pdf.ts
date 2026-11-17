import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BBox, PdfTextItem } from "../shared/types";
import { PAGE_HEIGHT, PAGE_WIDTH } from "../shared/layout";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export function fixturePdfPath(): string {
  return join(ROOT, "public/fixture-msa.pdf");
}

export async function loadFixturePdf(): Promise<Uint8Array> {
  const buf = await readFile(fixturePdfPath());
  return new Uint8Array(buf);
}

/**
 * Extract pdf.js text items with page-relative bounding boxes (top-left, 0–1).
 * Worker is disabled so this runs in Bun/Node and is closer to a Workers port
 * (bytes in, items out).
 */
export async function extractPdfText(data: Uint8Array): Promise<PdfTextItem[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = import.meta.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
  );
  const loadingTask = pdfjs.getDocument({
    data: data.slice(),
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;
  const items: PdfTextItem[] = [];
  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      for (const raw of content.items) {
        if (!("str" in raw) || !raw.str?.trim()) continue;
        const item = raw as {
          str: string;
          transform: number[];
          width: number;
          height: number;
        };
        const [, , , , x, y] = item.transform;
        const width = item.width || 0;
        const height = item.height || Math.abs(item.transform[3]) || 10;
        const bbox: BBox = {
          x: x / viewport.width,
          y: (viewport.height - y - height) / viewport.height,
          width: width / viewport.width,
          height: height / viewport.height,
        };
        items.push({ page: pageNum, text: item.str.trim(), bbox });
      }
    }
  } finally {
    await doc.destroy();
  }
  return items;
}

export function formatTextForPrompt(items: PdfTextItem[], maxItems = 400): string {
  const clipped = items.slice(0, maxItems);
  return clipped
    .map((it) => {
      const x = it.bbox.x.toFixed(3);
      const y = it.bbox.y.toFixed(3);
      const w = it.bbox.width.toFixed(3);
      const h = it.bbox.height.toFixed(3);
      return `p${it.page} [${x},${y},${w},${h}] ${JSON.stringify(it.text)}`;
    })
    .join("\n");
}

export { PAGE_HEIGHT, PAGE_WIDTH };
