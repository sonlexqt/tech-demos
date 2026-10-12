import {
  SIGN_CAPTURE_MIME,
  SIGN_EMPTY_ERROR,
  SIGN_FLOW_CAPTURE,
  SIGN_POINTER_DOWN,
  SIGN_POINTER_MOVE,
  SIGN_POINTER_UP,
} from "./constants";

export type StrokePoint = { x: number; y: number };
export type Stroke = StrokePoint[];

/**
 * Canvas signature pad. Pointer events are registered with the literal names
 * REA later traces (`pointerdown` / `pointermove` / `pointerup`).
 */
export class SignatureCapture {
  private readonly strokes: Stroke[] = [];
  private active: Stroke | null = null;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("lumin-sign-capture-no-2d");
    }
    this.ctx = context;
    this.ctx.lineWidth = 2.25;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "#111827";
  }

  attach(): void {
    this.canvas.dataset.luminSignFlow = SIGN_FLOW_CAPTURE;
    this.canvas.addEventListener(SIGN_POINTER_DOWN, this.onDown);
    this.canvas.addEventListener(SIGN_POINTER_MOVE, this.onMove);
    this.canvas.addEventListener(SIGN_POINTER_UP, this.onUp);
    this.canvas.addEventListener("pointerleave", this.onUp);
  }

  detach(): void {
    this.canvas.removeEventListener(SIGN_POINTER_DOWN, this.onDown);
    this.canvas.removeEventListener(SIGN_POINTER_MOVE, this.onMove);
    this.canvas.removeEventListener(SIGN_POINTER_UP, this.onUp);
    this.canvas.removeEventListener("pointerleave", this.onUp);
  }

  clear(): void {
    this.strokes.length = 0;
    this.active = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  isEmpty(): boolean {
    return this.strokes.every((stroke) => stroke.length < 2);
  }

  getStrokes(): Stroke[] {
    return this.strokes.map((stroke) => stroke.map((point) => ({ ...point })));
  }

  exportPng(): string {
    if (this.isEmpty()) {
      throw new Error(SIGN_EMPTY_ERROR);
    }
    return this.canvas.toDataURL(SIGN_CAPTURE_MIME);
  }

  private readonly onDown = (event: PointerEvent): void => {
    this.canvas.setPointerCapture(event.pointerId);
    this.active = [this.point(event)];
    this.strokes.push(this.active);
  };

  private readonly onMove = (event: PointerEvent): void => {
    if (!this.active) {
      return;
    }
    this.active.push(this.point(event));
    this.redraw();
  };

  private readonly onUp = (): void => {
    this.active = null;
  };

  private point(event: PointerEvent): StrokePoint {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * this.canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * this.canvas.height,
    };
  }

  private redraw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const stroke of this.strokes) {
      if (stroke.length < 2) {
        continue;
      }
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let index = 1; index < stroke.length; index += 1) {
        this.ctx.lineTo(stroke[index].x, stroke[index].y);
      }
      this.ctx.stroke();
    }
  }
}
