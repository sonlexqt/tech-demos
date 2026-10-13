import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

export async function renderPdfPage(
  url: string,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const loading = pdfjsLib.getDocument(url);
  const doc = await loading.promise;
  const page = await doc.getPage(1);
  const wrap = canvas.parentElement;
  const maxWidth = Math.max((wrap?.clientWidth ?? 640) - 8, 360);
  const viewport1 = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport1.width;
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
}
