import { durationMs, splitStrokes } from "./strokes";
import type { StrokeFile, StrokePoint } from "./types";

export type StrokeFeatures = {
  pointCount: number;
  strokeCount: number;
  penUpCount: number;
  durationMs: number;
  meanDt: number;
  dtCv: number;
  /** 1 = almost perfectly regular sampling; 0 = messy human clock. */
  dtRegularity: number;
  speedMean: number;
  speedCv: number;
  accelMeanAbs: number;
  jerkMeanAbs: number;
  pauseCount: number;
  pauseMean: number;
  pauseCv: number;
  samplingJitter: number;
  /** Fraction of points that snap to a coarse grid (PenGPT 0.02-unit heritage). */
  gridSnap: number;
  /** Fraction of Δt values near a 12 ms lattice (our model-timing wrapper). */
  timeGridSnap: number;
  /** Middle-of-stroke speed / start-end speed. Humans usually > 1. */
  startEndSlowdown: number;
  turningRoughness: number;
};

export type HumanScore = {
  /** 0–1; higher looks more like a human pad capture. */
  looksHuman: number;
  predicted: "human" | "generated";
  reasons: string[];
  features: StrokeFeatures;
};

export type TrialResult = {
  id: string;
  volunteerId: string;
  synthetic: boolean;
  predicted: "human" | "generated";
  looksHuman: number;
  correct: boolean;
};

export type ClassifierReport = {
  trials: TrialResult[];
  accuracy: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  threshold: number;
  notes: string[];
};

const HUMAN_THRESHOLD = 0.5;

function hypot(dx: number, dy: number): number {
  return Math.hypot(dx, dy);
}

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function cv(xs: number[]): number {
  const m = mean(xs);
  if (Math.abs(m) < 1e-9) return 0;
  return std(xs) / Math.abs(m);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function extractFeatures(points: StrokePoint[]): StrokeFeatures {
  const strokes = splitStrokes(points);
  const dts: number[] = [];
  const speeds: number[] = [];
  const accels: number[] = [];
  const jerks: number[] = [];
  const pauses: number[] = [];
  const startEnd: number[] = [];
  const middles: number[] = [];
  const turns: number[] = [];

  for (const stroke of strokes) {
    const segSpeeds: number[] = [];
    const segAccels: number[] = [];
    for (let i = 1; i < stroke.length; i++) {
      const dt = stroke[i].t - stroke[i - 1].t;
      if (dt <= 0) continue;
      dts.push(dt);
      const v =
        hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y) / dt;
      speeds.push(v);
      segSpeeds.push(v);
    }
    for (let i = 1; i < segSpeeds.length; i++) {
      const dt = stroke[i + 1].t - stroke[i].t;
      if (dt <= 0) continue;
      const a = Math.abs((segSpeeds[i] - segSpeeds[i - 1]) / dt);
      accels.push(a);
      segAccels.push(a);
    }
    for (let i = 1; i < segAccels.length; i++) {
      jerks.push(Math.abs(segAccels[i] - segAccels[i - 1]));
    }
    if (segSpeeds.length >= 4) {
      const edge = mean([segSpeeds[0], segSpeeds[1], segSpeeds[segSpeeds.length - 1], segSpeeds[segSpeeds.length - 2]]);
      const mid = mean(segSpeeds.slice(2, -2));
      if (edge > 1e-9) {
        startEnd.push(edge);
        middles.push(mid);
      }
    }
    for (let i = 2; i < stroke.length; i++) {
      const ax = stroke[i - 1].x - stroke[i - 2].x;
      const ay = stroke[i - 1].y - stroke[i - 2].y;
      const bx = stroke[i].x - stroke[i - 1].x;
      const by = stroke[i].y - stroke[i - 1].y;
      const la = hypot(ax, ay);
      const lb = hypot(bx, by);
      if (la < 1e-6 || lb < 1e-6) continue;
      const dot = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)));
      turns.push(Math.acos(dot));
    }
  }

  for (let i = 1; i < strokes.length; i++) {
    const prev = strokes[i - 1];
    const next = strokes[i];
    const gap = next[0].t - prev[prev.length - 1].t;
    if (gap > 0) pauses.push(gap);
  }

  const medDt = median(dts);
  const jitter =
    medDt <= 0 ? 0 : mean(dts.map((d) => Math.abs(d - medDt)));

  // PenGPT walks an ~0.02 world-grid, then we scale onto the pad. Residual
  // rounding toward a few tenths of a pixel is a generation tell.
  let snapHits = 0;
  for (const p of points) {
    const rx = Math.abs(p.x * 5 - Math.round(p.x * 5));
    const ry = Math.abs(p.y * 5 - Math.round(p.y * 5));
    if (rx < 0.08 && ry < 0.08) snapHits += 1;
  }
  const timeHits = dts.filter((d) => {
    const m = Math.round(d / 12);
    return m >= 1 && Math.abs(d - m * 12) < 0.9;
  }).length;

  const edge = mean(startEnd);
  const mid = mean(middles);
  const startEndSlowdown = edge > 1e-9 ? mid / edge : 1;

  const dtCv = cv(dts);
  return {
    pointCount: points.length,
    strokeCount: strokes.length,
    penUpCount: strokes.length,
    durationMs: durationMs(points),
    meanDt: mean(dts),
    dtCv,
    dtRegularity: clamp01(1 - dtCv / 0.45),
    speedMean: mean(speeds),
    speedCv: cv(speeds),
    accelMeanAbs: mean(accels),
    jerkMeanAbs: mean(jerks),
    pauseCount: pauses.length,
    pauseMean: mean(pauses),
    pauseCv: cv(pauses),
    samplingJitter: jitter,
    gridSnap: points.length ? snapHits / points.length : 0,
    timeGridSnap: dts.length ? timeHits / dts.length : 0,
    startEndSlowdown,
    turningRoughness: std(turns),
  };
}

/**
 * Linear-logistic mix of kinematics. Tuned to separate fixture-human
 * (minimum-jerk, irregular clock) from PenGPT geometry + regular timing.
 * Not a production detector — see HOW_IT_WORKS.md.
 */
export function looksHumanScore(features: StrokeFeatures): number {
  const z =
    1.6 * clamp01((features.speedCv - 0.18) / 0.4) +
    1.4 * clamp01((features.dtCv - 0.28) / 0.3) +
    1.8 * clamp01((features.startEndSlowdown - 1.15) / 0.8) +
    0.6 * clamp01((features.pauseCv - 0.2) / 0.7) +
    0.5 *
      clamp01((features.samplingJitter - 1.5) / 4) *
      (1 - clamp01(features.timeGridSnap)) +
    0.4 * clamp01(features.turningRoughness / 0.5) +
    0.35 * clamp01((features.jerkMeanAbs - 0.00015) / 0.003) -
    2.2 * clamp01(features.timeGridSnap) -
    1.2 * clamp01(features.gridSnap) -
    1.0 * features.dtRegularity;
  return 1 / (1 + Math.exp(-(z - 0.35)));
}

export function scoreStrokeFile(file: StrokeFile): HumanScore {
  const features = extractFeatures(file.points);
  const looksHuman = looksHumanScore(features);
  const predicted: "human" | "generated" =
    looksHuman >= HUMAN_THRESHOLD ? "human" : "generated";
  const reasons: string[] = [];
  if (features.dtRegularity > 0.75) {
    reasons.push("Sampling clock is unusually regular (plotter-like dt).");
  }
  if (features.gridSnap > 0.35) {
    reasons.push("Many points hug a coarse grid (PenGPT snap leftover).");
  }
  if (features.timeGridSnap > 0.55) {
    reasons.push("Δt clusters on a 12 ms lattice (model-timing wrapper).");
  }
  if (features.speedCv < 0.18) {
    reasons.push("Speed along strokes is too constant.");
  }
  if (features.startEndSlowdown < 1.08) {
    reasons.push("Missing human start/end slowdown (minimum-jerk bump).");
  }
  if (features.pauseCv < 0.25 && features.pauseCount > 1) {
    reasons.push("Pauses between strokes are evenly spaced.");
  }
  if (features.samplingJitter < 0.8) {
    reasons.push("Little jitter around the median sample interval.");
  }
  if (!reasons.length) {
    reasons.push("Kinematics look messy in the ways a pad capture usually does.");
  }
  return { looksHuman, predicted, reasons, features };
}

export function classifyFixtures(
  files: StrokeFile[],
  threshold = HUMAN_THRESHOLD,
): ClassifierReport {
  const trials: TrialResult[] = files.map((file) => {
    const score = scoreStrokeFile(file);
    const predicted =
      score.looksHuman >= threshold ? "human" : "generated";
    const labelGenerated = file.synthetic;
    const predictedGenerated = predicted === "generated";
    return {
      id: file.id,
      volunteerId: file.volunteerId,
      synthetic: file.synthetic,
      predicted,
      looksHuman: score.looksHuman,
      correct: labelGenerated === predictedGenerated,
    };
  });

  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  for (const t of trials) {
    const predGen = t.predicted === "generated";
    if (t.synthetic && predGen) tp += 1;
    else if (!t.synthetic && !predGen) tn += 1;
    else if (!t.synthetic && predGen) fp += 1;
    else fn += 1;
  }
  const accuracy = trials.length ? (tp + tn) / trials.length : 0;
  return {
    trials,
    accuracy,
    truePositives: tp,
    trueNegatives: tn,
    falsePositives: fp,
    falseNegatives: fn,
    threshold,
    notes: [
      "Positive class = generated (synthetic: true).",
      "This is a handful of fixtures, not a trained model.",
      "An attacker who resamples PenGPT ink with human timing can collapse several features.",
      "Drawn-signature telemetry is a weak audit signal next to Lumin ID.",
    ],
  };
}

export const FORENSICS_THRESHOLD = HUMAN_THRESHOLD;
