import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type {
  DocumentInfo,
  PageTextResult,
  SearchMatch,
  SearchResult,
  ZoomMode,
} from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

export type ViewerListener = () => void;

export class PdfViewer {
  private doc: PDFDocumentProxy | null = null;
  private currentPage = 1;
  private zoom: ZoomMode = 1;
  private canvas: HTMLCanvasElement;
  private wrap: HTMLElement;
  private renderTask: ReturnType<
    pdfjsLib.PDFPageProxy["render"]
  > | null = null;
  private listeners = new Set<ViewerListener>();

  constructor(canvas: HTMLCanvasElement, wrap: HTMLElement) {
    this.canvas = canvas;
    this.wrap = wrap;
  }

  onChange(listener: ViewerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  async loadFromUrl(url: string): Promise<void> {
    const loading = pdfjsLib.getDocument(url);
    this.doc = await loading.promise;
    this.currentPage = 1;
    await this.renderCurrentPage();
    this.notify();
  }

  getPageCount(): number {
    return this.doc?.numPages ?? 0;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getZoom(): ZoomMode {
    return this.zoom;
  }

  async goToPage(page: number): Promise<{ page: number }> {
    if (!this.doc) throw new Error("No document loaded");
    const n = Math.min(Math.max(1, Math.floor(page)), this.doc.numPages);
    this.currentPage = n;
    await this.renderCurrentPage();
    this.notify();
    return { page: this.currentPage };
  }

  async nextPage(): Promise<{ page: number }> {
    return this.goToPage(this.currentPage + 1);
  }

  async prevPage(): Promise<{ page: number }> {
    return this.goToPage(this.currentPage - 1);
  }

  async setZoom(scale: ZoomMode): Promise<{ zoom: ZoomMode }> {
    this.zoom = scale;
    await this.renderCurrentPage();
    this.notify();
    return { zoom: this.zoom };
  }

  async getDocumentInfo(): Promise<DocumentInfo> {
    if (!this.doc) throw new Error("No document loaded");
    const meta = await this.doc.getMetadata().catch(() => null);
    const info = meta?.info as { Title?: string } | undefined;
    return {
      pageCount: this.doc.numPages,
      title: info?.Title?.trim() ? info.Title : null,
      currentPage: this.currentPage,
      zoom: this.zoom,
    };
  }

  async getPageText(page?: number): Promise<PageTextResult> {
    if (!this.doc) throw new Error("No document loaded");
    const pageNum =
      page !== undefined
        ? Math.min(Math.max(1, Math.floor(page)), this.doc.numPages)
        : this.currentPage;
    const pdfPage = await this.doc.getPage(pageNum);
    const content = await pdfPage.getTextContent();
    const text = content.items
      .map((item) => {
        if (typeof item === "object" && item !== null && "str" in item) {
          return String((item as { str: string }).str);
        }
        return "";
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return { page: pageNum, text };
  }

  async searchText(query: string): Promise<SearchResult> {
    if (!this.doc) throw new Error("No document loaded");
    const q = query.trim();
    if (!q) {
      return { query: q, matchCount: 0, matches: [] };
    }
    const lower = q.toLowerCase();
    const matches: SearchMatch[] = [];
    const maxMatches = 40;

    for (let p = 1; p <= this.doc.numPages; p++) {
      const { text } = await this.getPageText(p);
      if (!text.toLowerCase().includes(lower)) continue;
      let idx = 0;
      const textLower = text.toLowerCase();
      while (matches.length < maxMatches) {
        const found = textLower.indexOf(lower, idx);
        if (found === -1) break;
        const start = Math.max(0, found - 40);
        const end = Math.min(text.length, found + q.length + 40);
        matches.push({
          page: p,
          snippet: text.slice(start, end).trim(),
        });
        idx = found + q.length;
      }
      if (matches.length >= maxMatches) break;
    }

    return { query: q, matchCount: matches.length, matches };
  }

  private async resolveScale(
    page: pdfjsLib.PDFPageProxy,
  ): Promise<number> {
    const viewport1 = page.getViewport({ scale: 1 });
    const padding = 32;
    if (this.zoom === "fit-width") {
      const w = Math.max(this.wrap.clientWidth - padding, 200);
      return w / viewport1.width;
    }
    if (this.zoom === "fit-page") {
      const w = Math.max(this.wrap.clientWidth - padding, 200);
      const h = Math.max(this.wrap.clientHeight - padding, 200);
      return Math.min(w / viewport1.width, h / viewport1.height);
    }
    return this.zoom;
  }

  private async renderCurrentPage(): Promise<void> {
    if (!this.doc) return;
    const page = await this.doc.getPage(this.currentPage);
    const scale = await this.resolveScale(page);
    const viewport = page.getViewport({ scale });
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    this.canvas.width = Math.floor(viewport.width);
    this.canvas.height = Math.floor(viewport.height);

    if (this.renderTask) {
      try {
        await this.renderTask.promise;
      } catch {
        /* cancelled */
      }
    }

    this.renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });
    await this.renderTask.promise;
  }
}
