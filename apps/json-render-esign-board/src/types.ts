export const REQUEST_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "declined",
  "completed",
  "void",
  "overdue",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type SignerRole =
  | "signer"
  | "countersigner"
  | "external-counsel"
  | "internal-legal";

export type Region = "APAC" | "EMEA" | "AMER";

export interface Signer {
  name: string;
  role: SignerRole;
  region?: Region;
  status: RequestStatus;
}

export interface SignatureRequest {
  id: string;
  title: string;
  documentName: string;
  status: RequestStatus;
  dueHint: string;
  region: Region;
  party: string;
  lastAction: string;
  week: "this-week" | "earlier";
  declinedThenResent: boolean;
  needsRemind: boolean;
  waitingOnCountersign: boolean;
  signers: Signer[];
}

export interface ActionLogEntry {
  id: string;
  at: string;
  requestId: string;
  label: string | null;
  note: string;
}
