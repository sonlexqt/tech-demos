import { GoogleGenAI } from "@google/genai";
import { sleep } from "./stream";
import type { TokenUsageEstimate } from "../shared/types";

export const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
export const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite";

/** USD per 1M tokens — estimates for the eval cost column; not invoices. */
const RATES: Record<string, { input: number; output: number }> = {
  "gemini-3.5-flash": { input: 0.15, output: 0.6 },
  "gemini-3.5-flash-lite": { input: 0.075, output: 0.3 },
  "gemini-3-flash": { input: 0.15, output: 0.6 },
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = RATES[model] ?? RATES["gemini-3.5-flash"];
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

export function liveConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
}

export interface GeminiTurn {
  text: string;
  calls: GeminiFunctionCall[];
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export const PLACE_FIELD_DECL = {
  name: "place_field",
  description:
    "Place one envelope field on the PDF. Coordinates are normalized 0-1 with origin at the top-left of the page.",
  parametersJsonSchema: {
    type: "object",
    additionalProperties: false,
    required: ["id", "type", "signerId", "page", "bbox", "confidence", "label"],
    properties: {
      id: { type: "string" },
      type: { type: "string", enum: ["signature", "initials", "date", "name"] },
      signerId: { type: "string", description: "jordan-hale or priya-shah" },
      page: { type: "integer", minimum: 1, maximum: 6 },
      bbox: {
        type: "object",
        required: ["x", "y", "width", "height"],
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
        },
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      label: { type: "string" },
    },
  },
};

export const SET_RECIPIENTS_DECL = {
  name: "set_recipients",
  description: "Set the two signers and signing order for this envelope.",
  parametersJsonSchema: {
    type: "object",
    additionalProperties: false,
    required: ["recipients"],
    properties: {
      recipients: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name", "email", "title", "company", "order"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            title: { type: "string" },
            company: { type: "string" },
            order: { type: "integer" },
          },
        },
      },
    },
  },
};

export const FINISH_DRAFT_DECL = {
  name: "finish_draft",
  description:
    "Call when all eight fields are placed (name, signature, date, initials × two signers) and it is time to ask the human to confirm.",
  parametersJsonSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      note: { type: "string" },
    },
  },
};

const TOOLS = [{ functionDeclarations: [PLACE_FIELD_DECL, SET_RECIPIENTS_DECL, FINISH_DRAFT_DECL] }];

function statusOf(error: unknown): number | undefined {
  const e = error as { status?: number; httpStatus?: number; code?: number };
  return e.status ?? e.httpStatus ?? e.code;
}

function isRetryable(error: unknown): boolean {
  const status = statusOf(error);
  const message = error instanceof Error ? error.message : String(error);
  return status === 429 || status === 503 || /429|503|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(message);
}

export async function generateTurn(
  contents: Array<Record<string, unknown>>,
  options?: { models?: string[] },
): Promise<GeminiTurn> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const client = new GoogleGenAI({ apiKey });
  const models = options?.models ?? [DEFAULT_MODEL, FALLBACK_MODEL];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: contents as never,
          config: {
            tools: TOOLS,
            temperature: 0.2,
          },
        });
        const calls: GeminiFunctionCall[] = (response.functionCalls ?? []).map((fc) => ({
          name: fc.name ?? "",
          args: (fc.args as Record<string, unknown>) ?? {},
          id: fc.id,
        }));
        const usageMeta = response.usageMetadata;
        return {
          text: response.text ?? "",
          calls,
          model,
          usage: {
            inputTokens: usageMeta?.promptTokenCount ?? 0,
            outputTokens: usageMeta?.candidatesTokenCount ?? 0,
          },
        };
      } catch (error) {
        lastError = error;
        if (isRetryable(error) && attempt < 4) {
          const wait = Math.min(16_000, 1000 * 2 ** attempt) + Math.random() * 250;
          await sleep(wait);
          continue;
        }
        break;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export function toUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
): TokenUsageEstimate {
  return {
    provider: "google",
    model,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedUsd: estimateCost(model, inputTokens, outputTokens),
  };
}

export function systemPrompt(textDump: string): string {
  return `You are the Lumin Sign envelope-prep agent. Prepare a 6-page synthetic Master Services Agreement (Northwind Labs Inc. × Acme Dynamics LLC) for signing.

Signers:
- jordan-hale — Jordan Hale, CEO, Acme Dynamics LLC, jordan.hale@acme-dynamics.example, order 1
- priya-shah — Priya Shah, General Counsel, Northwind Labs Inc., priya.shah@northwind-labs.example, order 2

Place exactly eight fields, all on the signature page (the page containing "IN WITNESS WHEREOF"): name, signature, date, initials for each signer. Bounding boxes are normalized 0–1, origin top-left. Put each box over the matching labeled underline on that page.

Call set_recipients first, then place_field for each field (with an honest confidence 0–1), then finish_draft.

Extracted pdf.js text items (page, bbox [x,y,w,h], text):
${textDump}`;
}
