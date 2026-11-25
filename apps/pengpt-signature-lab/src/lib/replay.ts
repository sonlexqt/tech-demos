import { splitStrokes } from "./strokes";
import type { StrokePoint as Point } from "./types";

export type ReplayHandle = {
  stop: () => void;
  finished: Promise<void>;
};

export type ReplayFrame = {
  /** Points that should be visible at this instant. */
  visible: Point[];
  /** 0–1 progress through the recording clock. */
  progress: number;
  done: boolean;
};

/**
 * Points that exist at media time `elapsedMs` (from the first sample).
 * Interpolates the leading tip so replay is smooth between samples.
 */
export function visibleAt(points: Point[], elapsedMs: number): Point[] {
  if (!points.length) return [];
  const t0 = points[0].t;
  const t = t0 + elapsedMs;
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.t <= t) {
      out.push(p);
      continue;
    }
    if (i > 0 && points[i - 1].down && p.down) {
      const prev = points[i - 1];
      const span = p.t - prev.t;
      const u = span <= 0 ? 1 : Math.min(1, Math.max(0, (t - prev.t) / span));
      if (u > 0) {
        out.push({
          x: prev.x + (p.x - prev.x) * u,
          y: prev.y + (p.y - prev.y) * u,
          t,
          down: true,
        });
      }
    }
    break;
  }
  return out;
}

export function replayDuration(points: Point[]): number {
  if (points.length < 2) return 0;
  return points[points.length - 1].t - points[0].t;
}

/**
 * Drive `onFrame` at display refresh, mapping wall-clock to pen timestamps.
 * `speed` of 1 is real recorded speed.
 */
export function playStrokes(
  points: Point[],
  onFrame: (frame: ReplayFrame) => void,
  opts: { speed?: number; signal?: AbortSignal } = {},
): ReplayHandle {
  const speed = opts.speed ?? 1;
  const duration = replayDuration(points);
  let stopped = false;
  let start = 0;
  let raf = 0;
  let resolve!: () => void;
  const finished = new Promise<void>((r) => {
    resolve = r;
  });

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    resolve();
  };

  opts.signal?.addEventListener("abort", stop, { once: true });

  if (!points.length) {
    onFrame({ visible: [], progress: 1, done: true });
    queueMicrotask(stop);
    return { stop, finished };
  }

  const tick = (now: number) => {
    if (stopped) return;
    if (!start) start = now;
    const elapsed = (now - start) * speed;
    const visible = visibleAt(points, elapsed);
    const progress = duration <= 0 ? 1 : Math.min(1, elapsed / duration);
    const done = elapsed >= duration;
    onFrame({ visible, progress, done });
    if (done) {
      stop();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return { stop, finished };
}

export function strokePolylines(points: Point[]): Point[][] {
  return splitStrokes(points);
}
