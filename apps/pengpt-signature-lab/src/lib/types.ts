export const STROKE_SCHEMA = "pengpt-signature-lab/v1" as const;

export type StrokePoint = {
  /** Canvas CSS pixels, origin top-left. */
  x: number;
  y: number;
  /** Milliseconds from the start of the recording. */
  t: number;
  /** True while the pen is inking. A false point marks a lift. */
  down: boolean;
};

export type StrokeCanvas = {
  width: number;
  height: number;
};

export type StrokeSource =
  | "pad"
  | "pengpt"
  | "fixture-human"
  | "fixture-generated";

export type StrokeGeneratorMeta = {
  model: string;
  writer: string;
  seed: number;
  temperature: number;
  weightsDownloaded: boolean;
  timing: "model-regular" | "human-minimum-jerk";
};

export type StrokeFile = {
  schema: typeof STROKE_SCHEMA;
  id: string;
  volunteerId: string;
  displayName: string;
  text: string;
  /** True for PenGPT (or other model) output. Fixture pad-captures are false. */
  synthetic: boolean;
  source: StrokeSource;
  canvas: StrokeCanvas;
  createdAt: string;
  consentId?: string;
  generator?: StrokeGeneratorMeta;
  points: StrokePoint[];
};

export type Volunteer = {
  id: string;
  displayName: string;
  text: string;
  notesText?: string;
  consentId: string;
  realId: string;
  generatedId: string;
  notesId?: string;
};

export type FixtureManifest = {
  generatedWithPengpt: boolean;
  model: string;
  volunteers: Volunteer[];
};

export const DEFAULT_CANVAS: StrokeCanvas = { width: 900, height: 280 };
