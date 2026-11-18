export type Tool = "highlight" | "text" | "draw" | "sign" | "select";

export type Annotation =
  | { id: string; type: "highlight"; page: number; x: number; y: number; w: number; h: number }
  | { id: string; type: "text"; page: number; x: number; y: number; text: string; fontSize: number }
  | { id: string; type: "ink"; page: number; points: Array<{ x: number; y: number }> }
  | { id: string; type: "signature"; page: number; x: number; y: number; w: number; h: number; dataUrl: string };

const imageCache = new Map<string, HTMLImageElement>();

export function uid(): string {
  return crypto.randomUUID();
}

export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  page: number,
  items: Annotation[],
  onImageLoad?: () => void,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const a of items) {
    if (a.page !== page) continue;
    if (a.type === "highlight") {
      ctx.fillStyle = "rgba(250, 204, 21, 0.38)";
      ctx.fillRect(a.x * width, a.y * height, a.w * width, a.h * height);
    } else if (a.type === "text") {
      ctx.fillStyle = "#0f172a";
      ctx.font = `${Math.max(12, a.fontSize * height)}px "IBM Plex Sans", sans-serif`;
      ctx.fillText(a.text, a.x * width, a.y * height);
    } else if (a.type === "ink") {
      if (a.points.length < 2) continue;
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = Math.max(1.5, height * 0.004);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.points[0].x * width, a.points[0].y * height);
      for (const p of a.points.slice(1)) ctx.lineTo(p.x * width, p.y * height);
      ctx.stroke();
    } else if (a.type === "signature") {
      const img = imageCache.get(a.dataUrl);
      if (img) {
        ctx.drawImage(img, a.x * width, a.y * height, a.w * width, a.h * height);
      } else {
        const image = new Image();
        image.onload = () => {
          imageCache.set(a.dataUrl, image);
          onImageLoad?.();
        };
        image.src = a.dataUrl;
      }
    }
  }
}
