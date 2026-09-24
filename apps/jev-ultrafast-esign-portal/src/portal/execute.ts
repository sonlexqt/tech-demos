import type { Decision, JevElement, PortalState } from "../types";
import { initialPortal } from "./state";

function findElement(elements: JevElement[], target: string | null): JevElement | undefined {
  if (!target) return undefined;
  const indexPart = target.split(":")[0];
  return (
    elements.find((el) => String(el.index) === target) ??
    elements.find((el) => String(el.index) === indexPart) ??
    elements.find((el) => el.id === target)
  );
}

function findOptionValue(el: JevElement, target: string): string | undefined {
  const byIndex = el.options?.find((opt) => opt.index === target);
  if (byIndex) return byIndex.value;
  return el.options?.find((opt) => opt.value === target)?.value;
}

export function applyDecision(
  state: PortalState,
  decision: Decision,
  elements: JevElement[],
): { state: PortalState; page_changed: boolean; action: string } {
  if (decision.error) {
    return { state, page_changed: false, action: `ERROR ${decision.error}` };
  }

  if (decision.operation === "DONE") {
    return { state, page_changed: false, action: "DONE" };
  }

  if (decision.operation === "WAIT") {
    return {
      state: { ...state, awaitingPreview: false },
      page_changed: false,
      action: "WAIT (preview ready)",
    };
  }

  const el = findElement(elements, decision.target);
  if (!el) {
    return { state, page_changed: false, action: `${decision.operation} missed target` };
  }

  if (decision.operation === "TYPE_TEXT") {
    const text = decision.text ?? "";
    const next = { ...state };
    if (el.id === "title") next.title = text;
    if (el.id === "message") next.message = text;
    if (el.id === "draft-name") next.draftName = text;
    if (el.id === "draft-email") next.draftEmail = text;
    return {
      state: next,
      page_changed: false,
      action: `TYPE_TEXT [${el.index}] ${el.label} → "${text}"`,
    };
  }

  if (decision.operation === "SELECT") {
    const value = findOptionValue(el, decision.target ?? "") ?? decision.text;
    if (!value) {
      return { state, page_changed: false, action: `SELECT [${el.index}] no option` };
    }
    const next = { ...state };
    if (el.id === "signing-order" && (value === "sequential" || value === "parallel")) {
      next.signingOrder = value;
    }
    if (el.id === "draft-role" && (value === "signer" || value === "cc")) {
      next.draftRole = value;
    }
    return {
      state: next,
      page_changed: false,
      action: `SELECT [${el.index}] ${el.label} → ${value}`,
    };
  }

  return applyClick(state, el);
}

export function applyClick(
  state: PortalState,
  el: JevElement,
): { state: PortalState; page_changed: boolean; action: string } {
  if (el.disabled) {
    return { state, page_changed: false, action: `CLICK [${el.index}] ${el.label} (disabled)` };
  }

  if (el.id === "continue-signers") {
    return {
      state: { ...state, step: "signers" },
      page_changed: true,
      action: `CLICK [${el.index}] ${el.label}`,
    };
  }
  if (el.id === "back-request") {
    return {
      state: { ...state, step: "request" },
      page_changed: true,
      action: `CLICK [${el.index}] ${el.label}`,
    };
  }
  if (el.id === "add-signer") {
    if (!state.draftName.trim() || !state.draftEmail.includes("@")) {
      return { state, page_changed: false, action: `CLICK [${el.index}] Add signer (invalid)` };
    }
    const signer = {
      id: `s${state.signers.length + 1}`,
      name: state.draftName.trim(),
      email: state.draftEmail.trim(),
      role: state.draftRole,
    };
    return {
      state: {
        ...state,
        signers: [...state.signers, signer],
        draftName: "",
        draftEmail: "",
        draftRole: "signer",
        awaitingPreview: true,
      },
      page_changed: false,
      action: `CLICK [${el.index}] Add signer (${signer.name})`,
    };
  }
  if (el.id === "continue-fields") {
    if (state.signers.length === 0) {
      return { state, page_changed: false, action: `CLICK [${el.index}] Continue (no signers)` };
    }
    return {
      state: { ...state, step: "fields" },
      page_changed: true,
      action: `CLICK [${el.index}] ${el.label}`,
    };
  }
  if (el.id === "back-signers") {
    return {
      state: { ...state, step: "signers" },
      page_changed: true,
      action: `CLICK [${el.index}] ${el.label}`,
    };
  }
  if (el.id === "place-signature" || el.id === "place-date" || el.id === "place-initials") {
    const kind = el.id === "place-signature" ? "signature" : el.id === "place-date" ? "date" : "initials";
    const zone =
      kind === "signature" ? "signature-block" : kind === "date" ? "date-line" : "initials-box";
    if (state.fields.some((f) => f.kind === kind)) {
      return { state, page_changed: false, action: `CLICK [${el.index}] ${kind} already placed` };
    }
    const signerId = state.signers[0]?.id ?? "s1";
    return {
      state: {
        ...state,
        fields: [...state.fields, { id: `f-${kind}`, kind, zone, signerId }],
      },
      page_changed: false,
      action: `CLICK [${el.index}] Place ${kind}`,
    };
  }
  if (el.id === "continue-review") {
    if (state.fields.length === 0) {
      return { state, page_changed: false, action: `CLICK [${el.index}] Continue (no fields)` };
    }
    return {
      state: { ...state, step: "review" },
      page_changed: true,
      action: `CLICK [${el.index}] ${el.label}`,
    };
  }
  if (el.id === "back-fields") {
    return {
      state: { ...state, step: "fields" },
      page_changed: true,
      action: `CLICK [${el.index}] ${el.label}`,
    };
  }
  if (el.id === "send-request") {
    return {
      state: { ...state, step: "sent", sentAt: new Date().toISOString() },
      page_changed: true,
      action: `CLICK [${el.index}] Send signature request`,
    };
  }
  if (el.id === "start-another") {
    return {
      state: initialPortal(),
      page_changed: true,
      action: `CLICK [${el.index}] Start another request`,
    };
  }

  return { state, page_changed: false, action: `CLICK [${el.index}] ${el.label}` };
}
