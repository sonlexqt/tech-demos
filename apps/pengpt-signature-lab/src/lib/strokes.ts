import {
  DEFAULT_CANVAS,
  STROKE_SCHEMA,
  type StrokeFile,
  type StrokePoint,
} from "./types";

export function isStrokeFile(value: unknown): value is StrokeFile {
  if (!value || typeof value !== "object") return false;
  const v = value as StrokeFile;
  return (
    v.schema === STROKE_SCHEMA &&
    typeof v.id === "string" &&
    typeof v.volunteerId === "string" &&
    typeof v.displayName === "string" &&
    typeof v.synthetic === "boolean" &&
    Array.isArray(v.points) &&
    v.points.every(
      (p) =>
        typeof p.x === "number" &&
        typeof p.y === "number" &&
        typeof p.t === "number" &&
        typeof p.down === "boolean",
    )
  );
}

export function parseStrokeFile(raw: string): StrokeFile {
  const data: unknown = JSON.parse(raw);
  if (!isStrokeFile(data)) {
    throw new Error("Not a pengpt-signature-lab/v1 stroke file");
  }
  return data;
}

/** Split a point stream into inking strokes (runs of down=true). */
export function splitStrokes(points: StrokePoint[]): StrokePoint[][] {
  const strokes: StrokePoint[][] = [];
  let current: StrokePoint[] = [];
  for (const p of points) {
    if (p.down) {
      current.push(p);
    } else if (current.length) {
      strokes.push(current);
      current = [];
    }
  }
  if (current.length) strokes.push(current);
  return strokes;
}

export function durationMs(points: StrokePoint[]): number {
  if (points.length < 2) return 0;
  return points[points.length - 1].t - points[0].t;
}

export function penUpCount(points: StrokePoint[]): number {
  return splitStrokes(points).length;
}

export function emptyStrokeFile(partial: Partial<StrokeFile> = {}): StrokeFile {
  return {
    schema: STROKE_SCHEMA,
    id: partial.id ?? `pad-${Date.now()}`,
    volunteerId: partial.volunteerId ?? "local",
    displayName: partial.displayName ?? "Local pad",
    text: partial.text ?? "",
    synthetic: partial.synthetic ?? false,
    source: partial.source ?? "pad",
    canvas: partial.canvas ?? { ...DEFAULT_CANVAS },
    createdAt: partial.createdAt ?? new Date().toISOString(),
    consentId: partial.consentId,
    generator: partial.generator,
    points: partial.points ?? [],
  };
}

export function toSvgPath(points: StrokePoint[]): string {
  const strokes = splitStrokes(points);
  return strokes
    .map((stroke) => {
      if (!stroke.length) return "";
      const [first, ...rest] = stroke;
      const cmds = [`M${fmt(first.x)} ${fmt(first.y)}`];
      for (const p of rest) cmds.push(`L${fmt(p.x)} ${fmt(p.y)}`);
      if (stroke.length === 1) cmds.push(`l0.01 0.01`);
      return cmds.join(" ");
    })
    .filter(Boolean)
    .join(" ");
}

export function strokeFileToSvg(
  file: StrokeFile,
  opts: { watermark?: string } = {},
): string {
  const { width, height } = file.canvas;
  const watermark =
    opts.watermark ??
    (file.synthetic ? "SYNTHETIC" : "FIXTURE · NOT A CUSTOMER SIGNATURE");
  const path = toSvgPath(file.points);
  const color = file.synthetic ? "#7a1f2b" : "#1a2744";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#f4efe6"/>
  <text x="50%" y="22" text-anchor="middle" fill="${file.synthetic ? "#c44536" : "#6b6256"}" font-size="13" font-family="ui-sans-serif, system-ui, sans-serif" letter-spacing="0.18em">${escapeXml(watermark)}</text>
  <path d="${path}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function downloadText(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
