import type { EnvelopeField, EnvelopeState } from "./types";
import { lowestConfidenceFields } from "./envelope";

/** JSON Schema carried on the AG-UI interrupt so the UI can render a form. */
export function approvalResponseSchema() {
  return {
    type: "object",
    title: "Confirm envelope before send",
    description:
      "Review recipients, signing order, and the two placements the agent is least confident about.",
    required: ["approved", "recipients", "signingOrder", "reviewFields"],
    additionalProperties: false,
    properties: {
      approved: {
        type: "boolean",
        title: "Ready to send",
        description: "No document is actually sent. This only finishes the demo run.",
      },
      recipients: {
        type: "array",
        title: "Recipients",
        items: {
          type: "object",
          required: ["id", "name", "email", "order"],
          properties: {
            id: { type: "string", title: "Id" },
            name: { type: "string", title: "Name" },
            email: { type: "string", title: "Email", format: "email" },
            title: { type: "string", title: "Title" },
            company: { type: "string", title: "Company" },
            order: { type: "integer", title: "Sign order", minimum: 1 },
          },
        },
      },
      signingOrder: {
        type: "array",
        title: "Signing order (recipient ids)",
        items: { type: "string" },
      },
      reviewFields: {
        type: "array",
        title: "Lowest-confidence fields",
        description:
          "These two boxes scored lowest. Fix them here or drag them on the PDF.",
        items: {
          type: "object",
          required: ["fieldId", "page", "keep"],
          properties: {
            fieldId: { type: "string", title: "Field id" },
            label: { type: "string", title: "Label" },
            type: { type: "string", title: "Type" },
            confidence: { type: "number", title: "Confidence", minimum: 0, maximum: 1 },
            page: { type: "integer", title: "Page", minimum: 1, maximum: 6 },
            keep: { type: "boolean", title: "Keep this field" },
          },
        },
      },
    },
  } as const;
}

export interface ApprovalPayload {
  approved: boolean;
  recipients: EnvelopeState["recipients"];
  signingOrder: string[];
  reviewFields: Array<{
    fieldId: string;
    label?: string;
    type?: string;
    confidence?: number;
    page: number;
    keep: boolean;
  }>;
}

export function defaultApprovalPayload(state: EnvelopeState): ApprovalPayload {
  const review = lowestConfidenceFields(state, 2);
  return {
    approved: true,
    recipients: state.recipients.map((r) => ({ ...r })),
    signingOrder: [...state.signingOrder],
    reviewFields: review.map((f: EnvelopeField) => ({
      fieldId: f.id,
      label: f.label,
      type: f.type,
      confidence: f.confidence,
      page: f.page,
      keep: true,
    })),
  };
}

export function applyApprovalPayload(
  state: EnvelopeState,
  payload: ApprovalPayload,
): EnvelopeState {
  const next: EnvelopeState = {
    ...state,
    recipients: payload.recipients,
    signingOrder: payload.signingOrder.length
      ? payload.signingOrder
      : [...payload.recipients].sort((a, b) => a.order - b.order).map((r) => r.id),
  };
  for (const review of payload.reviewFields) {
    if (!review.keep) {
      next.fields = next.fields.filter((f) => f.id !== review.fieldId);
      continue;
    }
    next.fields = next.fields.map((f) =>
      f.id === review.fieldId ? { ...f, page: review.page, source: "human" as const } : f,
    );
  }
  next.status = payload.approved ? "ready" : "cancelled";
  return next;
}
