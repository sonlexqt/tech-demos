import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_MAP } from "../shared/questions.ts";
import { resolveMode } from "../shared/mode.ts";
import type { AdapterMode, DecisionsResponse, GroundTruth } from "../shared/types.ts";
import { createDecision, pdfInput } from "./decisions-client.ts";
import { createGenerativeDecisions } from "./generative-client.ts";
import { mockDecide } from "./mock-adapter.ts";
import { TRUTH_BY_ID } from "../fixtures/truth.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const FIXTURES_DIR = path.join(ROOT, "fixtures");

export function fixturesDir(): string {
  return FIXTURES_DIR;
}

export async function loadFixturePdf(id: string): Promise<Uint8Array> {
  if (!TRUTH_BY_ID[id]) throw new Error(`Unknown fixture ${id}`);
  return await readFile(path.join(FIXTURES_DIR, `${id}.pdf`));
}

export type TimedDecision = {
  mode: AdapterMode;
  kind: "decisions" | "generative";
  response: DecisionsResponse;
  latencyMs: number;
  truth?: GroundTruth;
  model: string;
  fixtureId?: string;
};

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export async function runDecisions(opts: {
  pdfBytes: Uint8Array;
  fixtureId?: string;
  note?: string;
}): Promise<TimedDecision> {
  const mode = resolveMode();
  if (mode === "mock") {
    const t0 = Date.now();
    const mock = mockDecide({ pdfBytes: opts.pdfBytes, fixtureId: opts.fixtureId, kind: "decisions" });
    const elapsed = Date.now() - t0;
    const wait = Math.max(0, mock.latencyMs - elapsed);
    if (wait) await new Promise((r) => setTimeout(r, wait));
    return {
      mode,
      kind: "decisions",
      response: mock.response,
      latencyMs: mock.latencyMs,
      truth: mock.truth,
      model: "gemini-decision-1 (mock)",
      fixtureId: mock.truth.id,
    };
  }
  const apiKey = process.env.GEMINI_API_KEY!;
  const t0 = Date.now();
  const response = await createDecision({
    apiKey,
    input: pdfInput(toBase64(opts.pdfBytes), opts.note),
    questions: QUESTION_MAP,
  });
  return {
    mode,
    kind: "decisions",
    response,
    latencyMs: Date.now() - t0,
    truth: opts.fixtureId ? TRUTH_BY_ID[opts.fixtureId] : undefined,
    model: "gemini-decision-1",
    fixtureId: opts.fixtureId,
  };
}

export async function runGenerative(opts: {
  pdfBytes: Uint8Array;
  fixtureId?: string;
}): Promise<TimedDecision> {
  const mode = resolveMode();
  if (mode === "mock") {
    const t0 = Date.now();
    const mock = mockDecide({ pdfBytes: opts.pdfBytes, fixtureId: opts.fixtureId, kind: "generative" });
    const elapsed = Date.now() - t0;
    const wait = Math.max(0, mock.latencyMs - elapsed);
    if (wait) await new Promise((r) => setTimeout(r, wait));
    return {
      mode,
      kind: "generative",
      response: mock.response,
      latencyMs: mock.latencyMs,
      truth: mock.truth,
      model: "gemini-3.5-flash (mock)",
      fixtureId: mock.truth.id,
    };
  }
  const apiKey = process.env.GEMINI_API_KEY!;
  const t0 = Date.now();
  const result = await createGenerativeDecisions({
    apiKey,
    pdfBase64: toBase64(opts.pdfBytes),
    questions: QUESTION_MAP,
  });
  return {
    mode,
    kind: "generative",
    response: result.response,
    latencyMs: Date.now() - t0,
    truth: opts.fixtureId ? TRUTH_BY_ID[opts.fixtureId] : undefined,
    model: result.model,
    fixtureId: opts.fixtureId,
  };
}
