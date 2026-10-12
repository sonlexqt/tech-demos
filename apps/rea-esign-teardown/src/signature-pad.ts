/**
 * Standalone signature capture rebuilt from REA findings on the minified
 * bundle — not copied from the readable fixture as a module import.
 *
 * Parent analysis: ev_291adc3d042aab029eed33ac17e1f3ef324c552edbecacc3d1fb3476e24f2263
 * Observed literals: pointerdown, pointermove, pointerup, image/png,
 * lumin-sign-capture-empty.
 * Observed methods: attach, detach, clear, exportPng, isEmpty, getStrokes.
 * Observed expressions: read:/canvas/addEventListener, read:/canvas/toDataURL.
 */

export const REBUILT_FROM = {
  analyze_evidence_id: "ev_291adc3d042aab029eed33ac17e1f3ef324c552edbecacc3d1fb3476e24f2263",
  events: ["pointerdown", "pointermove", "pointerup"] as const,
  mime: "image/png",
  emptyError: "lumin-sign-capture-empty",
  methods: ["attach", "detach", "clear", "exportPng", "isEmpty"] as const,
};

type Point = { x: number; y: number };
type Stroke = Point[];

export class RebuiltSignaturePad {
  private readonly strokes: Stroke[] = [];
  private active: Stroke | null = null;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("lumin-sign-capture-no-2d");
    }
    this.ctx = context;
    this.ctx.lineWidth = 2.4;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "#1b140c";
  }

  attach(): void {
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointerleave", this.onUp);
  }

  detach(): void {
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
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

  exportPng(): string {
    if (this.isEmpty()) {
      throw new Error(REBUILT_FROM.emptyError);
    }
    return this.canvas.toDataURL(REBUILT_FROM.mime);
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

  private point(event: PointerEvent): Point {
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
