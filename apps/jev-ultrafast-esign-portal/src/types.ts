export type Operation = "CLICK" | "TYPE_TEXT" | "SELECT" | "WAIT" | "DONE";

export type WizardStep = "request" | "signers" | "fields" | "review" | "sent";

export type SignerRole = "signer" | "cc";

export type FieldKind = "signature" | "date" | "initials";

export type FieldZone = "signature-block" | "date-line" | "initials-box";

export type JevOption = {
  index: string;
  label: string;
  value: string;
};

export type JevElement = {
  index: number;
  id: string;
  role: "button" | "textbox" | "combobox";
  label: string;
  value: string;
  operations: Operation[];
  options?: JevOption[];
  disabled?: boolean;
};

export type Signer = {
  id: string;
  name: string;
  email: string;
  role: SignerRole;
};

export type PlacedField = {
  id: string;
  kind: FieldKind;
  zone: FieldZone;
  signerId: string;
};

export type PortalState = {
  step: WizardStep;
  title: string;
  message: string;
  signingOrder: "sequential" | "parallel";
  draftName: string;
  draftEmail: string;
  draftRole: SignerRole;
  signers: Signer[];
  fields: PlacedField[];
  awaitingPreview: boolean;
  sentAt: string | null;
};

export type HistoryItem = {
  action: string;
  kind: Operation;
  text?: string;
  target?: string | null;
  page_changed?: boolean;
};

export type PageSnapshot = {
  url: string;
  title: string;
  text: string;
};

export type Decision = {
  operation: Operation;
  target: string | null;
  text?: string;
  confidence: number;
  operation_probabilities: Record<string, number>;
  target_probabilities: Record<string, number>;
  latency_ms: number;
  source: "live" | "fixture";
  model?: string;
  error?: string;
};

export type DecideRequest = {
  goal: string;
  page: PageSnapshot;
  elements: JevElement[];
  history: HistoryItem[];
  portal: PortalState;
};

export type ModeInfo = {
  mode: "live" | "fixture";
  provider: string | null;
};

export const OPERATIONS: Operation[] = ["CLICK", "TYPE_TEXT", "SELECT", "WAIT", "DONE"];

export const DEFAULT_GOAL =
  "Send a signature request for Q3 Vendor Agreement to Alex Rivera (alex@acme.example) as a signer, with sequential signing order and a short message asking them to sign by Friday. Place a signature field and a date field. Stop when the request is sent.";
