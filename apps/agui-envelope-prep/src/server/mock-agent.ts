import { EventType, type RunAgentInput } from "@ag-ui/core";
import type { EnvelopeField, EnvelopeState } from "../shared/types";
import {
  cloneEnvelope,
  describeCorrections,
  formatSigningOrder,
  initialEnvelope,
  lowestConfidenceFields,
  setRecipients,
  upsertField,
} from "../shared/envelope";
import { diffState } from "../shared/json-patch";
import {
  applyApprovalPayload,
  approvalResponseSchema,
  defaultApprovalPayload,
  type ApprovalPayload,
} from "../shared/interrupt-schema";
import { RECIPIENTS, groundTruthFromLayout, pdfBoxToNorm, PDF_FIELDS } from "../shared/layout";
import { scoreEnvelope } from "../shared/scoring";
import { uid } from "../shared/ids";
import { emitText, emitToolCall, sleep, type EventSink } from "./stream";
import { getThread, rememberAgentPlaced, saveThread } from "./threads";

const truth = groundTruthFromLayout();

/** Deliberately wrong / low-confidence mock placements. */
function mockFields(): EnvelopeField[] {
  const dateBox = PDF_FIELDS["jordan-date"];
  const wrongDate = pdfBoxToNorm({
    x: dateBox.x + 48,
    y: dateBox.y - 18,
    width: dateBox.width,
    height: dateBox.height,
  });
  const initialsBox = PDF_FIELDS["priya-initials"];
  const wrongInitials = pdfBoxToNorm({
    x: initialsBox.x,
    y: 120,
    width: initialsBox.width,
    height: initialsBox.height,
  });

  const mk = (
    id: keyof typeof PDF_FIELDS,
    type: EnvelopeField["type"],
    signerId: string,
    label: string,
    confidence: number,
    page: number,
    bbox = pdfBoxToNorm(PDF_FIELDS[id]),
  ): EnvelopeField => ({
    id,
    type,
    signerId,
    page,
    bbox,
    label,
    confidence,
    source: "agent",
  });

  return [
    mk("jordan-name", "name", "jordan-hale", "Printed name — Jordan Hale", 0.96, 6),
    mk("jordan-signature", "signature", "jordan-hale", "Signature — Jordan Hale", 0.94, 6),
    mk("jordan-date", "date", "jordan-hale", "Date — Jordan Hale", 0.42, 6, wrongDate),
    mk("jordan-initials", "initials", "jordan-hale", "Initials — Jordan Hale", 0.91, 6),
    mk("priya-name", "name", "priya-shah", "Printed name — Priya Shah", 0.95, 6),
    mk("priya-signature", "signature", "priya-shah", "Signature — Priya Shah", 0.93, 6),
    mk("priya-date", "date", "priya-shah", "Date — Priya Shah", 0.9, 6),
    mk("priya-initials", "initials", "priya-shah", "Initials — Priya Shah", 0.36, 5, wrongInitials),
  ];
}

export interface MockRunOptions {
  delayMs: number;
}

export async function runMockAgent(
  input: RunAgentInput,
  send: EventSink,
  options: MockRunOptions,
): Promise<void> {
  const delayMs = options.delayMs;
  const threadId = input.threadId;
  const runId = input.runId;

  await send({
    type: EventType.RUN_STARTED,
    threadId,
    runId,
  });

  if (input.resume && input.resume.length > 0) {
    await finishAfterApproval(input, send, delayMs);
    return;
  }

  await send({ type: EventType.STEP_STARTED, stepName: "inspect_document" });

  let state = initialEnvelope({
    status: "preparing",
    recipients: [],
    signingOrder: [],
    fields: [],
  });
  await send({ type: EventType.STATE_SNAPSHOT, snapshot: state });
  saveThread({
    threadId,
    state,
    agentPlaced: null,
    lastRunId: runId,
    startedAt: Date.now(),
  });

  await emitText(
    send,
    "I'll prepare this Lumin Sign envelope from the Northwind–Acme MSA. Two signers: Jordan Hale (Acme, CEO) then Priya Shah (Northwind, GC). Fields live on the signature page — I'll place name, signature, date, and initials for each.",
    { delayMs },
  );

  const beforeRecipients = cloneEnvelope(state);
  state = setRecipients(state, RECIPIENTS);
  await send({
    type: EventType.STATE_DELTA,
    delta: diffState(beforeRecipients, state),
  });

  await send({ type: EventType.STEP_FINISHED, stepName: "inspect_document" });
  await send({ type: EventType.STEP_STARTED, stepName: "place_fields" });

  const parentMessageId = uid("msg");
  for (const field of mockFields()) {
    await emitText(send, `Placing ${field.label} (confidence ${(field.confidence * 100).toFixed(0)}%).`, {
      delayMs: Math.min(delayMs, 40),
    });
    const before = cloneEnvelope(state);
    await emitToolCall(
      send,
      "place_field",
      {
        id: field.id,
        type: field.type,
        signerId: field.signerId,
        page: field.page,
        bbox: field.bbox,
        label: field.label,
        confidence: field.confidence,
      },
      { ok: true, fieldId: field.id },
      { delayMs: Math.min(delayMs, 25), parentMessageId },
    );
    state = upsertField(state, field);
    const delta = diffState(before, state);
    if (delta.length) {
      await send({ type: EventType.STATE_DELTA, delta });
    }
    if (delayMs) await sleep(delayMs);
  }

  state = { ...state, status: "awaiting_approval" };
  await send({ type: EventType.STATE_SNAPSHOT, snapshot: state });
  rememberAgentPlaced(threadId, state);
  saveThread({
    threadId,
    state,
    agentPlaced: cloneEnvelope(state),
    lastRunId: runId,
    startedAt: getThread(threadId)?.startedAt ?? Date.now(),
  });

  await send({ type: EventType.STEP_FINISHED, stepName: "place_fields" });

  const unsure = lowestConfidenceFields(state, 2);
  await emitText(
    send,
    `Draft is ready for a human pass. I'm least sure about ${unsure.map((f) => f.label).join(" and ")}. Confirm recipients, signing order, and those two boxes before we mark this ready to send.`,
    { delayMs },
  );

  const interruptId = "int_confirm_envelope";
  await send({
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    outcome: {
      type: "interrupt",
      interrupts: [
        {
          id: interruptId,
          reason: "confirmation",
          message:
            "Confirm recipients, signing order, and the two lowest-confidence field placements.",
          responseSchema: approvalResponseSchema(),
        },
      ],
    },
  });
}

export async function finishAfterApproval(
  input: RunAgentInput,
  send: EventSink,
  delayMs: number,
): Promise<void> {
  const threadId = input.threadId;
  const runId = input.runId;
  const thread = getThread(threadId);
  const incoming = (input.state ?? thread?.state) as EnvelopeState | undefined;
  if (!incoming) {
    await send({
      type: EventType.RUN_ERROR,
      message: "No envelope state on resume",
      code: "missing_state",
    });
    return;
  }

  const entry = input.resume?.find((r) => r.interruptId === "int_confirm_envelope");
  if (!entry) {
    await send({
      type: EventType.RUN_ERROR,
      message: "Resume did not address interrupt int_confirm_envelope",
      code: "uncovered_interrupt",
    });
    return;
  }
  if (entry.status === "cancelled") {
    const cancelled = { ...incoming, status: "cancelled" as const, summary: "Human cancelled send." };
    await send({ type: EventType.STATE_SNAPSHOT, snapshot: cancelled });
    await emitText(send, "Cancelled — envelope was not marked ready to send.", { delayMs });
    await send({
      type: EventType.RUN_FINISHED,
      threadId,
      runId,
      outcome: { type: "success" },
      result: { ready: false, cancelled: true },
    });
    return;
  }

  const payload = (entry.payload ?? defaultApprovalPayload(incoming)) as ApprovalPayload;
  const agentPlaced = thread?.agentPlaced ?? incoming;
  const humanEdits = describeCorrections(agentPlaced, incoming);
  let state = applyApprovalPayload(incoming, payload);
  const postFormEdits = describeCorrections(incoming, state);
  const allEdits = [...humanEdits, ...postFormEdits];

  await send({ type: EventType.STEP_STARTED, stepName: "acknowledge_human" });

  if (allEdits.length) {
    await emitText(
      send,
      `I see the human corrections: ${allEdits.map((e) => e.detail).join("; ")}. I'll keep those and finish the envelope.`,
      { delayMs },
    );
  } else {
    await emitText(
      send,
      "No box edits from the human — using the placements as drafted, with your confirmation of recipients and order.",
      { delayMs },
    );
  }

  const scoring = scoreEnvelope(state, truth, { humanCorrections: allEdits });
  const summary = payload.approved
    ? `Ready to send (demo only — nothing is transmitted). ${state.recipients.length} recipients, ${state.fields.length} fields. Signing order: ${formatSigningOrder(state)}. Agent matched ${scoring.correct}/${scoring.totalTruth} ground-truth fields after review.`
    : "Human did not approve send.";

  state = {
    ...state,
    status: payload.approved ? "ready" : "cancelled",
    summary,
    agentNotes: allEdits.map((e) => e.detail),
  };
  await send({ type: EventType.STATE_SNAPSHOT, snapshot: state });
  saveThread({
    threadId,
    state,
    agentPlaced: thread?.agentPlaced ?? null,
    lastRunId: runId,
    startedAt: thread?.startedAt ?? Date.now(),
  });

  await send({ type: EventType.STEP_FINISHED, stepName: "acknowledge_human" });
  await emitText(send, summary, { delayMs });

  await send({
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    outcome: { type: "success" },
    result: {
      ready: payload.approved,
      summary,
      scoring,
      humanCorrections: allEdits,
      signingOrder: formatSigningOrder(state),
    },
  });
}

export { mockFields };
