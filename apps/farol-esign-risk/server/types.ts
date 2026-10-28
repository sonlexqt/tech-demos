export type EnvelopeStatus = "draft" | "awaiting_signature" | "completed" | "voided";
export type PartyRole = "signer" | "countersigner";
export type PartyStatus = "pending" | "signed" | "declined";

export type Party = {
  id: string;
  name: string;
  email: string;
  role: PartyRole;
  status: PartyStatus;
  signedAt?: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export type Envelope = {
  id: string;
  title: string;
  documentKind: string;
  status: EnvelopeStatus;
  createdAt: string;
  updatedAt: string;
  parties: Party[];
  body: string[];
  audit: AuditEvent[];
};

export type EnvelopeSummary = Pick<
  Envelope,
  "id" | "title" | "documentKind" | "status" | "updatedAt"
> & {
  waitingOn: string;
};
