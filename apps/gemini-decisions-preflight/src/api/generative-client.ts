import { CHECKS } from "../shared/questions.ts";
import { generativeModel } from "../shared/mode.ts";
import type { Answer, DecisionsResponse, Question, Usage } from "../shared/types.ts";

const GENERATE_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const RETRYABLE = /high demand|try again later|resource exhausted|unavailable|overloaded|429|500|503/i;

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export type GenerativeCallResult = {
  response: DecisionsResponse;
  rawText: string;
  model: string;
};

function responseSchema() {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const check of CHECKS) {
    required.push(check.id);
    if (check.question.type === "noul") {
      properties[check.id] = {
        type: "object",
        properties: {
          type: { type: "string", enum: ["noul"] },
          noul: { type: "number", description: "Probability that the answer is yes, 0.01-0.99" },
          confidence: { type: "number" },
        },
        required: ["type", "noul", "confidence"],
      };
    } else if (check.question.type === "choice") {
      const optionKeys = Object.keys(check.question.criteria);
      properties[check.id] = {
        type: "object",
        properties: {
          type: { type: "string", enum: ["choice"] },
          choice: { type: "string", enum: optionKeys },
          confidence: { type: "number" },
          probabilities: {
            type: "object",
            properties: Object.fromEntries(optionKeys.map((k) => [k, { type: "number" }])),
            required: optionKeys,
          },
        },
        required: ["type", "choice", "confidence", "probabilities"],
      };
    } else {
      const levelKeys = check.question.criteria.map((_, i) => String(i));
      properties[check.id] = {
        type: "object",
        properties: {
          type: { type: "string", enum: ["score"] },
          score: { type: "number" },
          confidence: { type: "number" },
          probabilities: {
            type: "object",
            properties: Object.fromEntries(levelKeys.map((k) => [k, { type: "number" }])),
            required: levelKeys,
          },
        },
        required: ["type", "score", "confidence", "probabilities"],
      };
    }
  }
  return {
    type: "object",
    properties,
    required,
  };
}

function questionsPrompt(questions: Record<string, Question>): string {
  const lines = [
    "Classify this contract. For each question return a JSON object under the same key.",
    "noul: probability the statement is YES (0.01-0.99) plus confidence = max(noul, 1-noul).",
    "choice: pick exactly one option id from criteria, plus a probability map over ALL option ids summing to 1.",
    "score: probability-weighted expected level (0-based index) plus per-level probabilities summing to 1, plus confidence of the top level.",
    "Do not write explanations. Return only the JSON object of answers.",
    "",
    "Questions:",
  ];
  for (const [id, q] of Object.entries(questions)) {
    lines.push(`- ${id} [${q.type}] ${q.instructions}`);
    if (q.type === "noul" && q.criteria) {
      lines.push(`    yes: ${q.criteria.true_description}`);
      lines.push(`    no: ${q.criteria.false_description}`);
    }
    if (q.type === "choice") {
      for (const [k, v] of Object.entries(q.criteria)) lines.push(`    ${k}: ${v}`);
    }
    if (q.type === "score") {
      q.criteria.forEach((v, i) => lines.push(`    ${i}: ${v}`));
    }
  }
  return lines.join("\n");
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.min(0.99, Math.max(0.01, n));
}

function normalizeAnswers(raw: Record<string, unknown>): Record<string, Answer> {
  const answers: Record<string, Answer> = {};
  for (const check of CHECKS) {
    const item = (raw[check.id] ?? {}) as Record<string, unknown>;
    if (check.question.type === "noul") {
      const noul = clamp01(Number(item.noul));
      answers[check.id] = {
        type: "noul",
        noul,
        confidence: clamp01(Number(item.confidence ?? Math.max(noul, 1 - noul))),
      };
    } else if (check.question.type === "choice") {
      const keys = Object.keys(check.question.criteria);
      const probsIn = (item.probabilities ?? {}) as Record<string, number>;
      const probabilities: Record<string, number> = {};
      let sum = 0;
      for (const k of keys) {
        const p = Math.max(0, Number(probsIn[k] ?? 0));
        probabilities[k] = p;
        sum += p;
      }
      if (sum <= 0) {
        const pick = String(item.choice ?? keys[0]);
        for (const k of keys) probabilities[k] = k === pick ? 1 : 0;
        sum = 1;
      }
      for (const k of keys) probabilities[k] = probabilities[k] / sum;
      const choice =
        typeof item.choice === "string" && keys.includes(item.choice)
          ? item.choice
          : keys.reduce((a, b) => (probabilities[a] >= probabilities[b] ? a : b));
      answers[check.id] = {
        type: "choice",
        choice,
        probabilities,
        confidence: clamp01(Number(item.confidence ?? probabilities[choice])),
      };
    } else {
      const levels = check.question.criteria.map((_, i) => String(i));
      const probsIn = (item.probabilities ?? {}) as Record<string, number>;
      const probabilities: Record<string, number> = {};
      let sum = 0;
      for (const k of levels) {
        const p = Math.max(0, Number(probsIn[k] ?? 0));
        probabilities[k] = p;
        sum += p;
      }
      if (sum <= 0) {
        const rounded = Math.min(
          levels.length - 1,
          Math.max(0, Math.round(Number(item.score ?? 0))),
        );
        for (const k of levels) probabilities[k] = Number(k) === rounded ? 1 : 0;
        sum = 1;
      }
      for (const k of levels) probabilities[k] = probabilities[k] / sum;
      let score = Number(item.score);
      if (Number.isNaN(score)) {
        score = 0;
        for (const k of levels) score += Number(k) * probabilities[k];
      }
      const legend: Record<string, string> = {};
      check.question.criteria.forEach((v, i) => {
        legend[String(i)] = v;
      });
      const top = levels.reduce((a, b) => (probabilities[a] >= probabilities[b] ? a : b));
      answers[check.id] = {
        type: "score",
        score,
        legend,
        probabilities,
        confidence: clamp01(Number(item.confidence ?? probabilities[top])),
      };
    }
  }
  return answers;
}

export async function createGenerativeDecisions(opts: {
  apiKey: string;
  pdfBase64: string;
  questions: Record<string, Question>;
  model?: string;
}): Promise<GenerativeCallResult> {
  const model = opts.model ?? generativeModel();
  const url = `${GENERATE_BASE}/${encodeURIComponent(model)}:generateContent`;
  const prompt = questionsPrompt(opts.questions);
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: opts.pdfBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema(),
      temperature: 0,
    },
  };

  const maxAttempts = 8;
  let res: Response | undefined;
  let text = "";
  let json: Record<string, unknown> = {};
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": opts.apiKey,
      },
      body: JSON.stringify(payload),
    });
    text = await res.text();
    json = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      if (attempt < maxAttempts && RETRYABLE.test(text)) {
        const wait = Math.min(60_000, 2000 * 2 ** (attempt - 1));
        console.warn(`Generative API non-JSON HTTP ${res.status}, retry ${attempt}/${maxAttempts} in ${wait}ms`);
        await sleep(wait);
        continue;
      }
      throw new Error(`Generative API returned non-JSON (${res.status}): ${text.slice(0, 400)}`);
    }
    if (res.ok) break;
    const err = json.error as { message?: string } | undefined;
    const msg = err?.message ?? `Generative API HTTP ${res.status}`;
    if (attempt < maxAttempts && (res.status === 429 || res.status === 500 || res.status === 503 || RETRYABLE.test(msg))) {
      const wait = Math.min(60_000, 2000 * 2 ** (attempt - 1));
      console.warn(`Generative API ${res.status}: ${msg}; retry ${attempt}/${maxAttempts} in ${wait}ms`);
      await sleep(wait);
      continue;
    }
    throw new Error(msg);
  }
  if (!res || !res.ok) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `Generative API HTTP ${res?.status ?? "unknown"}`);
  }
  const candidates = json.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
  const rawText = candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!rawText) throw new Error("Generative API returned empty text");
  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  const usageMeta = (json.usageMetadata ?? {}) as {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  const usage: Usage = {
    total_input_tokens: usageMeta.promptTokenCount ?? 0,
    input_tokens_by_modality: [{ modality: "mixed", tokens: usageMeta.promptTokenCount ?? 0 }],
    total_output_tokens: usageMeta.candidatesTokenCount ?? 0,
    total_tokens: usageMeta.totalTokenCount ?? (usageMeta.promptTokenCount ?? 0) + (usageMeta.candidatesTokenCount ?? 0),
  };
  return {
    model,
    rawText,
    response: { answers: normalizeAnswers(parsed), usage },
  };
}
