import { EventType, type RunAgentInput } from "@ag-ui/core";
import type { EnvelopeField, Recipient } from "../shared/types";
import {
  cloneEnvelope,
  clampBBox,
  initialEnvelope,
  lowestConfidenceFields,
  setRecipients,
  upsertField,
} from "../shared/envelope";
import { uid } from "../shared/ids";
import { diffState } from "../shared/json-patch";
import { approvalResponseSchema } from "../shared/interrupt-schema";
import { RECIPIENTS } from "../shared/layout";
import { emitText, emitToolCall, type EventSink } from "./stream";
import { extractPdfText, formatTextForPrompt, loadFixturePdf } from "./extract-pdf";
import { generateTurn, liveConfigured, systemPrompt, toUsage } from "./gemini";
import { finishAfterApproval } from "./mock-agent";
import { rememberAgentPlaced, saveThread } from "./threads";

export { liveConfigured };

function asField(args: Record<string, unknown>): EnvelopeField {
  const bboxRaw = (args.bbox ?? {}) as Record<string, number>;
  return {
    id: String(args.id ?? uid("field")),
    type: args.type as EnvelopeField["type"],
    signerId: String(args.signerId),
    page: Number(args.page) || 1,
    bbox: clampBBox({
      x: Number(bboxRaw.x) || 0,
      y: Number(bboxRaw.y) || 0,
      width: Number(bboxRaw.width) || 0.1,
      height: Number(bboxRaw.height) || 0.04,
    }),
    label: String(args.label ?? args.id ?? "field"),
    confidence: Math.min(1, Math.max(0, Number(args.confidence) ?? 0.5)),
    source: "agent",
  };
}

function asRecipients(args: Record<string, unknown>): Recipient[] {
  const list = args.recipients;
  if (!Array.isArray(list) || list.length === 0) return RECIPIENTS;
  return list.map((raw, i) => {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r.id ?? `signer-${i}`),
      name: String(r.name ?? "Unknown"),
      email: String(r.email ?? "unknown@example.test"),
      title: String(r.title ?? ""),
      company: String(r.company ?? ""),
      role: "signer" as const,
      order: Number(r.order) || i + 1,
    };
  });
}

export async function runLiveAgent(input: RunAgentInput, send: EventSink): Promise<void> {
  const threadId = input.threadId;
  const runId = input.runId;

  await send({ type: EventType.RUN_STARTED, threadId, runId });

  if (input.resume && input.resume.length > 0) {
    await finishAfterApproval(input, send, 40);
    return;
  }

  if (!liveConfigured()) {
    await send({
      type: EventType.RUN_ERROR,
      message: "LIVE mode needs GEMINI_API_KEY. Use MOCK mode or set the key.",
      code: "missing_api_key",
    });
    return;
  }

  await send({ type: EventType.STEP_STARTED, stepName: "inspect_document" });

  let state = initialEnvelope({ status: "preparing" });
  await send({ type: EventType.STATE_SNAPSHOT, snapshot: state });
  saveThread({ threadId, state, agentPlaced: null, lastRunId: runId, startedAt: Date.now() });

  const pdf = await loadFixturePdf();
  const items = await extractPdfText(pdf);
  const dump = formatTextForPrompt(items);

  await emitText(
    send,
    "Reading the MSA with pdf.js text positions, then placing signature-block fields via tools.",
    { delayMs: 20 },
  );

  const contents: Array<Record<string, unknown>> = [
    { role: "user", parts: [{ text: systemPrompt(dump) }] },
  ];

  let inputTokens = 0;
  let outputTokens = 0;
  let modelUsed = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  let finished = false;
  const maxTurns = 8;

  for (let turn = 0; turn < maxTurns && !finished; turn++) {
    const result = await generateTurn(contents);
    modelUsed = result.model;
    inputTokens += result.usage.inputTokens;
    outputTokens += result.usage.outputTokens;

    if (result.text.trim()) {
      await emitText(send, result.text.trim(), { delayMs: 15 });
    }

    if (result.calls.length === 0) {
      finished = true;
      break;
    }

    const modelParts =
      result.modelParts.length > 0
        ? result.modelParts
        : result.calls.map((call) => ({
            functionCall: { name: call.name, args: call.args, ...(call.id ? { id: call.id } : {}) },
            ...(call.thoughtSignature ? { thoughtSignature: call.thoughtSignature } : {}),
          }));
    contents.push({ role: "model", parts: modelParts });

    const fnResponses: unknown[] = [];
    for (const call of result.calls) {
      if (call.name === "set_recipients") {
        const before = cloneEnvelope(state);
        const recipients = asRecipients(call.args);
        await emitToolCall(send, "set_recipients", call.args, { ok: true, count: recipients.length });
        state = setRecipients(state, recipients);
        await send({ type: EventType.STATE_DELTA, delta: diffState(before, state) });
        fnResponses.push({
          functionResponse: { name: call.name, response: { ok: true, count: recipients.length } },
        });
      } else if (call.name === "place_field") {
        const field = asField(call.args);
        const before = cloneEnvelope(state);
        await emitToolCall(send, "place_field", call.args, { ok: true, fieldId: field.id });
        state = upsertField(state, field);
        await send({ type: EventType.STATE_DELTA, delta: diffState(before, state) });
        fnResponses.push({
          functionResponse: { name: call.name, response: { ok: true, fieldId: field.id } },
        });
      } else if (call.name === "finish_draft") {
        await emitToolCall(send, "finish_draft", call.args, { ok: true });
        finished = true;
        fnResponses.push({
          functionResponse: { name: call.name, response: { ok: true } },
        });
      } else {
        fnResponses.push({
          functionResponse: { name: call.name, response: { ok: false, error: "unknown tool" } },
        });
      }
    }
    contents.push({ role: "user", parts: fnResponses });
  }

  if (state.recipients.length === 0) {
    const before = cloneEnvelope(state);
    state = setRecipients(state, RECIPIENTS);
    await send({ type: EventType.STATE_DELTA, delta: diffState(before, state) });
  }

  state = { ...state, status: "awaiting_approval" };
  await send({ type: EventType.STATE_SNAPSHOT, snapshot: state });
  rememberAgentPlaced(threadId, state);
  saveThread({
    threadId,
    state,
    agentPlaced: cloneEnvelope(state),
    lastRunId: runId,
    startedAt: Date.now(),
  });
  await send({ type: EventType.STEP_FINISHED, stepName: "inspect_document" });

  const unsure = lowestConfidenceFields(state, 2);
  await emitText(
    send,
    unsure.length
      ? `Draft ready. Least confident: ${unsure.map((f) => f.label).join(" and ")}. Please confirm recipients and those boxes.`
      : "Draft ready. Please confirm recipients and signing order.",
    { delayMs: 20 },
  );

  await send({
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    usage: [toUsage(modelUsed, inputTokens, outputTokens)],
    outcome: {
      type: "interrupt",
      interrupts: [
        {
          id: "int_confirm_envelope",
          reason: "confirmation",
          message:
            "Confirm recipients, signing order, and the two lowest-confidence field placements.",
          responseSchema: approvalResponseSchema(),
        },
      ],
    },
  });
}

