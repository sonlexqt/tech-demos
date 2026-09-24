import type { PortalState } from "../types";

export function initialPortal(): PortalState {
  return {
    step: "request",
    title: "",
    message: "",
    signingOrder: "parallel",
    draftName: "",
    draftEmail: "",
    draftRole: "cc",
    signers: [],
    fields: [],
    awaitingPreview: false,
    sentAt: null,
  };
}

export function pageSnapshot(state: PortalState): { url: string; title: string; text: string } {
  const bits = [
    `Step: ${state.step}`,
    `Document: ${state.title || "(empty)"}`,
    `Message: ${state.message || "(empty)"}`,
    `Signing order: ${state.signingOrder}`,
    `Signers: ${
      state.signers.length
        ? state.signers.map((s) => `${s.name} <${s.email}> (${s.role})`).join("; ")
        : "(none)"
    }`,
    `Fields: ${
      state.fields.length
        ? state.fields.map((f) => `${f.kind} on ${f.zone}`).join("; ")
        : "(none)"
    }`,
    state.awaitingPreview ? "Document preview is still preparing." : "Preview ready.",
    state.sentAt ? `Sent at ${state.sentAt}` : "Not sent.",
  ];
  return {
    url: `https://lumen.sign/requests/new#${state.step}`,
    title: state.step === "sent" ? "Request sent · Lumen Sign" : "New signature request · Lumen Sign",
    text: bits.join("\n"),
  };
}

export const STEP_LABELS: Record<PortalState["step"], string> = {
  request: "Start request",
  signers: "Add signers",
  fields: "Place fields",
  review: "Review",
  sent: "Sent",
};

export const STEP_ORDER: PortalState["step"][] = [
  "request",
  "signers",
  "fields",
  "review",
  "sent",
];
