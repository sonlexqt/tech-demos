export type Variant = "stable" | "drift";

export interface Copy {
  fieldPanel: string;
  fieldChip: string;
  addField: string;
  send: string;
  finish: string;
  signatureLabel: string;
  panelSide: "left" | "right";
}

export const COPY: Record<Variant, Copy> = {
  stable: {
    fieldPanel: "Fields",
    fieldChip: "Signature",
    addField: "Add signature field",
    send: "Send for signing",
    finish: "Finish",
    signatureLabel: "Type your signature",
    panelSide: "right",
  },
  drift: {
    fieldPanel: "Marks",
    fieldChip: "Ink stamp",
    addField: "Drop an ink stamp",
    send: "Dispatch envelope",
    finish: "Apply signature",
    signatureLabel: "Write the adopted name",
    panelSide: "left",
  },
};

export const SIGNERS = {
  1: { name: "Ada Lovelace", role: "First signer", short: "Ada" },
  2: { name: "Bob Signer", role: "Countersigner", short: "Bob" },
} as const;

export const ENVELOPE = {
  id: "ENV-1001",
  title: "Acme × Harbor MSA",
  file: "/contract.pdf",
};
