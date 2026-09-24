import type { JevElement, PortalState } from "../types";

function option(elementIndex: number, optionIndex: number, label: string, value: string) {
  return { index: `${elementIndex}:${optionIndex}`, label, value };
}

export function listElements(state: PortalState): JevElement[] {
  const raw: Omit<JevElement, "index">[] = [];

  if (state.step === "request") {
    raw.push({
      id: "title",
      role: "textbox",
      label: "Document title",
      value: state.title,
      operations: ["TYPE_TEXT"],
    });
    raw.push({
      id: "message",
      role: "textbox",
      label: "Message to signers",
      value: state.message,
      operations: ["TYPE_TEXT"],
    });
    raw.push({
      id: "signing-order",
      role: "combobox",
      label: "Signing order",
      value: state.signingOrder,
      operations: ["SELECT"],
      options: [],
    });
    raw.push({
      id: "continue-signers",
      role: "button",
      label: "Continue to signers",
      value: "",
      operations: ["CLICK"],
    });
  }

  if (state.step === "signers") {
    raw.push({
      id: "draft-name",
      role: "textbox",
      label: "Signer name",
      value: state.draftName,
      operations: ["TYPE_TEXT"],
    });
    raw.push({
      id: "draft-email",
      role: "textbox",
      label: "Signer email",
      value: state.draftEmail,
      operations: ["TYPE_TEXT"],
    });
    raw.push({
      id: "draft-role",
      role: "combobox",
      label: "Role",
      value: state.draftRole,
      operations: ["SELECT"],
      options: [],
    });
    raw.push({
      id: "add-signer",
      role: "button",
      label: "Add signer",
      value: "",
      operations: ["CLICK"],
      disabled: !state.draftName.trim() || !state.draftEmail.includes("@"),
    });
    raw.push({
      id: "back-request",
      role: "button",
      label: "Back to request",
      value: "",
      operations: ["CLICK"],
    });
    raw.push({
      id: "continue-fields",
      role: "button",
      label: "Continue to fields",
      value: "",
      operations: ["CLICK"],
      disabled: state.signers.length === 0,
    });
  }

  if (state.step === "fields") {
    raw.push({
      id: "place-signature",
      role: "button",
      label: "Place signature field on the signature block",
      value: state.fields.some((f) => f.kind === "signature") ? "placed" : "",
      operations: ["CLICK"],
    });
    raw.push({
      id: "place-date",
      role: "button",
      label: "Place date field on the date line",
      value: state.fields.some((f) => f.kind === "date") ? "placed" : "",
      operations: ["CLICK"],
    });
    raw.push({
      id: "place-initials",
      role: "button",
      label: "Place initials field on the initials box",
      value: state.fields.some((f) => f.kind === "initials") ? "placed" : "",
      operations: ["CLICK"],
    });
    raw.push({
      id: "back-signers",
      role: "button",
      label: "Back to signers",
      value: "",
      operations: ["CLICK"],
    });
    raw.push({
      id: "continue-review",
      role: "button",
      label: "Continue to review",
      value: "",
      operations: ["CLICK"],
      disabled: state.fields.length === 0,
    });
  }

  if (state.step === "review") {
    raw.push({
      id: "back-fields",
      role: "button",
      label: "Back to fields",
      value: "",
      operations: ["CLICK"],
    });
    raw.push({
      id: "send-request",
      role: "button",
      label: "Send signature request",
      value: "",
      operations: ["CLICK"],
    });
  }

  if (state.step === "sent") {
    raw.push({
      id: "start-another",
      role: "button",
      label: "Start another request",
      value: "",
      operations: ["CLICK"],
    });
  }

  const elements = raw.map((el, i) => ({ ...el, index: i + 1 }));

  for (const el of elements) {
    if (el.id === "signing-order") {
      el.options = [
        option(el.index, 1, "Sequential — one after another", "sequential"),
        option(el.index, 2, "Parallel — all at once", "parallel"),
      ];
    }
    if (el.id === "draft-role") {
      el.options = [
        option(el.index, 1, "Needs to sign", "signer"),
        option(el.index, 2, "Receives a copy", "cc"),
      ];
    }
  }

  return elements;
}

export function formatElementRow(el: JevElement): string {
  const value = el.value ? ` · ${el.value}` : el.value === "" && el.role !== "button" ? " · empty" : "";
  return `[${el.index}] ${el.role.padEnd(8)} ${el.label}${value}`;
}
