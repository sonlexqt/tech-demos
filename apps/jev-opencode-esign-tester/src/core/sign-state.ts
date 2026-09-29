import type { PlanAction, SignState } from "./types";

export const MISSING_SIGNER_ERROR =
  "Add a signer name and a valid email before sending.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createInitialState(): SignState {
  return {
    title: "",
    message: "",
    signerName: "",
    signerEmail: "",
    status: "draft",
    error: null,
  };
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function canSend(state: SignState): boolean {
  return (
    state.title.trim().length > 0 &&
    state.signerName.trim().length > 0 &&
    isValidEmail(state.signerEmail)
  );
}

export function refreshablePatch(state: SignState): SignState {
  return refreshDraftStatus(state);
}

function refreshDraftStatus(state: SignState): SignState {
  if (state.status === "sent" || state.status === "declined") {
    return state;
  }
  return {
    ...state,
    status: canSend(state) ? "ready" : "draft",
    error: null,
  };
}

export function applyAction(state: SignState, action: PlanAction): SignState {
  switch (action.kind) {
    case "type": {
      const next = { ...state };
      if (action.target === "title") next.title = action.value;
      if (action.target === "signer-name") next.signerName = action.value;
      if (action.target === "signer-email") next.signerEmail = action.value;
      if (action.target === "message") next.message = action.value;
      return refreshDraftStatus(next);
    }
    case "click": {
      if (action.target === "send") {
        if (!canSend(state)) {
          return {
            ...state,
            status: "blocked",
            error: MISSING_SIGNER_ERROR,
          };
        }
        return {
          ...state,
          status: "sent",
          error: null,
        };
      }
      if (action.target === "decline") {
        return {
          ...state,
          status: "declined",
          error: null,
        };
      }
      return state;
    }
    case "assert-status":
    case "expect-error":
      return state;
  }
}

export function assertionHolds(state: SignState, action: PlanAction): boolean {
  if (action.kind === "assert-status") {
    return state.status === action.expected;
  }
  if (action.kind === "expect-error") {
    return Boolean(
      state.error &&
        state.error.toLowerCase().includes(action.match.toLowerCase()),
    );
  }
  return false;
}

