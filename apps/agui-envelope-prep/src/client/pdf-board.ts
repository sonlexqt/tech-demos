import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { BBox, EnvelopeField, EnvelopeState } from "../shared/types";
import { clampBBox, removeField, updateField } from "../shared/envelope";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

export type FieldEditHandler = (state: EnvelopeState) => void;

interface DragState {
  fieldId: string;
  kind: "move" | "resize";
  startX: number;
  startY: number;
  orig: BBox;
}

export class PdfBoard {
  private host: HTMLElement;
  private doc: PDFDocumentProxy | null = null;
  private state: EnvelopeState | null = null;
  private editable = false;
  private onEdit: FieldEditHandler | null = null;
  private drag: DragState | null = null;
  private selectedId: string | null = null;
  private pageWraps: HTMLElement[] = [];

  constructor(host: HTMLElement) {
    this.host = host;
    window.addEventListener("pointermove", (e) => this.onPointerMove(e));
    window.addEventListener("pointerup", () => this.onPointerUp());
  }

  setEditHandler(handler: FieldEditHandler): void {
    this.onEdit = handler;
  }

  setEditable(editable: boolean): void {
    this.editable = editable;
    this.host.classList.toggle("is-editable", editable);
  }

  async load(url: string): Promise<void> {
    this.doc = await pdfjsLib.getDocument(url).promise;
    this.host.innerHTML = "";
    this.pageWraps = [];
    for (let n = 1; n <= this.doc.numPages; n++) {
      const wrap = document.createElement("div");
      wrap.className = "page-wrap";
      wrap.dataset.page = String(n);
      const label = document.createElement("div");
      label.className = "page-label";
      label.textContent = `Page ${n}`;
      const canvas = document.createElement("canvas");
      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.dataset.page = String(n);
      wrap.append(label, canvas, overlay);
      this.host.append(wrap);
      this.pageWraps.push(wrap);
      await this.renderPage(n, canvas, wrap);
    }
  }

  private async renderPage(pageNumber: number, canvas: HTMLCanvasElement, wrap: HTMLElement): Promise<void> {
    if (!this.doc) return;
    const page = await this.doc.getPage(pageNumber);
    const unscaled = page.getViewport({ scale: 1 });
    const targetWidth = Math.min(760, this.host.clientWidth || 760);
    const scale = targetWidth / unscaled.width;
    const viewport = page.getViewport({ scale });
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    wrap.style.width = `${viewport.width}px`;
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  setState(state: EnvelopeState): void {
    this.state = state;
    this.drawFields();
  }

  scrollToPage(page: number): void {
    const wrap = this.pageWraps[page - 1];
    wrap?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }

  private drawFields(): void {
    if (!this.state) return;
    for (const wrap of this.pageWraps) {
      const overlay = wrap.querySelector(".overlay");
      if (!overlay) continue;
      overlay.innerHTML = "";
      const page = Number(wrap.dataset.page);
      const fields = this.state.fields.filter((f) => f.page === page);
      for (const field of fields) overlay.append(this.boxEl(field));
    }
  }

  private boxEl(field: EnvelopeField): HTMLElement {
    const el = document.createElement("div");
    el.className = "field-box";
    if (field.confidence < 0.55) el.classList.add("is-low");
    if (this.selectedId === field.id) el.classList.add("is-selected");
    el.dataset.fieldId = field.id;
    el.dataset.type = field.type;
    el.style.left = `${field.bbox.x * 100}%`;
    el.style.top = `${field.bbox.y * 100}%`;
    el.style.width = `${field.bbox.width * 100}%`;
    el.style.height = `${field.bbox.height * 100}%`;

    const cap = document.createElement("div");
    cap.className = "cap";
    cap.textContent = `${field.type} · ${Math.round(field.confidence * 100)}%`;
    el.append(cap);

    if (this.editable) {
      const del = document.createElement("button");
      del.className = "del";
      del.type = "button";
      del.textContent = "×";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteField(field.id);
      });
      const handle = document.createElement("div");
      handle.className = "handle";
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.beginDrag(field, "resize", e);
      });
      el.append(del, handle);
      el.addEventListener("pointerdown", (e) => {
        if ((e.target as HTMLElement).classList.contains("handle")) return;
        e.preventDefault();
        this.beginDrag(field, "move", e);
      });
    }
    return el;
  }

  private beginDrag(field: EnvelopeField, kind: "move" | "resize", event: PointerEvent): void {
    this.selectedId = field.id;
    this.drag = {
      fieldId: field.id,
      kind,
      startX: event.clientX,
      startY: event.clientY,
      orig: { ...field.bbox },
    };
  }

  private pageAtPoint(clientX: number, clientY: number): number | null {
    for (const wrap of this.pageWraps) {
      const r = wrap.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return Number(wrap.dataset.page);
      }
    }
    return null;
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.drag || !this.state) return;
    const field = this.state.fields.find((f) => f.id === this.drag?.fieldId);
    if (!field) return;
    const overPage = this.pageAtPoint(event.clientX, event.clientY);
    const page = overPage ?? field.page;
    const wrap = this.pageWraps[page - 1];
    const rect = wrap?.getBoundingClientRect();
    if (!rect) return;
    let bbox = { ...this.drag.orig };
    if (this.drag.kind === "move") {
      bbox = clampBBox({
        x: (event.clientX - rect.left) / rect.width - this.drag.orig.width / 2,
        y: (event.clientY - rect.top) / rect.height - this.drag.orig.height / 2,
        width: this.drag.orig.width,
        height: this.drag.orig.height,
      });
    } else {
      const origin = this.pageWraps[field.page - 1]?.getBoundingClientRect();
      if (!origin) return;
      const dx = (event.clientX - this.drag.startX) / origin.width;
      const dy = (event.clientY - this.drag.startY) / origin.height;
      bbox = clampBBox({
        ...this.drag.orig,
        width: this.drag.orig.width + dx,
        height: this.drag.orig.height + dy,
      });
    }
    this.state = updateField(this.state, this.drag.fieldId, { bbox, page, source: "human" });
    this.drawFields();
    const box = this.host.querySelector(`[data-field-id="${this.drag.fieldId}"]`);
    box?.classList.add("is-editing");
  }

  private onPointerUp(): void {
    if (!this.drag || !this.state) {
      this.drag = null;
      return;
    }
    const next = this.state;
    this.drag = null;
    this.onEdit?.(next);
  }

  private deleteField(id: string): void {
    if (!this.state) return;
    this.state = removeField(this.state, id);
    this.onEdit?.(this.state);
    this.drawFields();
  }
}
