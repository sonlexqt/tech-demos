import { emptyStrokeFile } from "./strokes";
import type { StrokeFile, StrokePoint } from "./types";

export type PadListener = () => void;

/**
 * Draw-to-sign surface. Records pointer samples as {x,y,t,down} in CSS pixels.
 */
export class SignaturePad {
  readonly canvas: HTMLCanvasElement;
  file: StrokeFile;
  private ctx: CanvasRenderingContext2D;
  private drawing = false;
  private t0 = 0;
  private listeners = new Set<PadListener>();
  private dpr = 1;
  private watermark: string | null = null;
  private ink = "#1a2744";

  constructor(canvas: HTMLCanvasElement, file?: StrokeFile) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d canvas unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.file = file ?? emptyStrokeFile();
    this.watermark = this.file.synthetic ? "SYNTHETIC" : null;
    this.bind();
    this.resize();
    this.redraw();
  }

  onChange(fn: PadListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  setFile(file: StrokeFile): void {
    this.file = file;
    this.watermark = file.synthetic ? "SYNTHETIC" : null;
    this.ink = file.synthetic ? "#7a1f2b" : "#1a2744";
    this.resize();
    this.redraw();
    this.emit();
  }

  setWatermark(text: string | null): void {
    this.watermark = text;
    this.redraw();
  }

  /** Override ink without changing the recorded file (blind test, pre-reveal). */
  setInk(color: string): void {
    this.ink = color;
    this.redraw();
  }

  /**
   * Paint a frame without replacing recorded points. Replay and cancel must not
   * truncate the file used for export / later playback.
   */
  preview(points: StrokePoint[]): void {
    this.redraw(points);
  }

  clear(): void {
    this.file = {
      ...this.file,
      points: [],
      synthetic: false,
      source: "pad",
      createdAt: new Date().toISOString(),
      generator: undefined,
    };
    this.watermark = null;
    this.ink = "#1a2744";
    this.redraw();
    this.emit();
  }

  undo(): void {
    const pts = this.file.points;
    if (!pts.length) return;
    let i = pts.length - 1;
    while (i >= 0 && !pts[i].down) i -= 1;
    while (i >= 0 && pts[i].down) i -= 1;
    this.file = { ...this.file, points: pts.slice(0, i + 1) };
    this.redraw();
    this.emit();
  }

  resize(): void {
    const { width, height } = this.file.canvas;
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.redraw();
  }

  private bind(): void {
    const el = this.canvas;
    el.addEventListener("pointerdown", (e) => this.onDown(e));
    el.addEventListener("pointermove", (e) => this.onMove(e));
    el.addEventListener("pointerup", (e) => this.onUp(e));
    el.addEventListener("pointercancel", (e) => this.onUp(e));
  }

  private local(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    const { width, height } = this.file.canvas;
    return {
      x: ((e.clientX - r.left) / r.width) * width,
      y: ((e.clientY - r.top) / r.height) * height,
    };
  }

  private stamp(e: PointerEvent, down: boolean): StrokePoint {
    if (!this.t0) this.t0 = performance.now();
    const { x, y } = this.local(e);
    return { x, y, t: performance.now() - this.t0, down };
  }

  private onDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this.drawing = true;
    if (!this.file.points.length) this.t0 = performance.now();
    this.file.points.push(this.stamp(e, true));
    this.redraw();
    this.emit();
  }

  private onMove(e: PointerEvent): void {
    if (!this.drawing) return;
    this.file.points.push(this.stamp(e, true));
    this.redraw();
  }

  private onUp(e: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    this.file.points.push(this.stamp(e, false));
    this.redraw();
    this.emit();
  }

  redraw(override?: StrokePoint[]): void {
    const { width, height } = this.file.canvas;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    this.paintPaper(ctx, width, height);
    this.paintWatermark(ctx, width);
    this.paintInk(ctx, override ?? this.file.points);
  }

  private paintPaper(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(26, 39, 68, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 40; y < height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(width - 16, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(26, 39, 68, 0.28)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("draw-to-sign pad · x,y,t,down", 16, 18);
  }

  private paintWatermark(ctx: CanvasRenderingContext2D, width: number): void {
    if (!this.watermark) return;
    ctx.save();
    ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "rgba(196, 69, 54, 0.92)";
    ctx.textAlign = "right";
    ctx.fillText(this.watermark, width - 16, 18);
    ctx.restore();
  }

  private paintInk(ctx: CanvasRenderingContext2D, points: StrokePoint[]): void {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = this.ink;
    ctx.fillStyle = this.ink;
    ctx.lineWidth = 2.4;
    let drawing = false;
    ctx.beginPath();
    for (const p of points) {
      if (p.down) {
        if (!drawing) {
          ctx.moveTo(p.x, p.y);
          drawing = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      } else if (drawing) {
        ctx.stroke();
        ctx.beginPath();
        drawing = false;
      }
    }
    if (drawing) ctx.stroke();
    const last = points[points.length - 1];
    if (last?.down) {
      ctx.beginPath();
      ctx.arc(last.x, last.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
