import {
  DECISIONS_ENDPOINT,
  DECISIONS_MODEL,
  type DecisionsInput,
  type DecisionsRequest,
  type DecisionsResponse,
  type Question,
} from "../shared/types.ts";

export class DecisionsApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function createDecision(opts: {
  apiKey: string;
  input: DecisionsInput;
  questions: Record<string, Question>;
}): Promise<DecisionsResponse> {
  const payload: DecisionsRequest = {
    model: DECISIONS_MODEL,
    input: opts.input,
    questions: opts.questions,
  };
  const res = await fetch(DECISIONS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": opts.apiKey,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const errObj = json as { error?: { message?: string; code?: string } };
    const msg =
      errObj?.error?.message ??
      `Decisions API HTTP ${res.status}${errObj?.error?.code ? ` (${errObj.error.code})` : ""}`;
    throw new DecisionsApiError(msg, res.status, json);
  }
  const body = json as DecisionsResponse;
  if (!body?.answers || !body.usage) {
    throw new DecisionsApiError("Decisions API returned an unexpected body", res.status, json);
  }
  return body;
}

export function pdfInput(pdfBase64: string, note?: string): DecisionsInput {
  const doc = {
    type: "document" as const,
    data: pdfBase64,
    mime_type: "application/pdf" as const,
  };
  if (!note) return [doc];
  return [{ type: "text", text: note.endsWith("\n") ? note : `${note}\n` }, doc];
}
