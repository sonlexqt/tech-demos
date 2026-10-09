export type SigningType = "ORDER" | "PARALLEL";

export type RequestStatus =
  | "draft"
  | "sent"
  | "in_progress"
  | "completed"
  | "declined"
  | "expired";

export type FieldKind = "signature" | "date" | "initials" | "text";

export type WebhookEvent =
  | "signature_request.sent"
  | "signature_request.viewed"
  | "signature_request.signed"
  | "signature_request.reminder.sent"
  | "signature_request.completed"
  | "signature_request.declined";

export interface Signer {
  id: string;
  email: string;
  name: string;
  /** 1-based signing group. Used only when signingType is ORDER. */
  group: number;
  status: "pending" | "awaiting" | "signed" | "declined";
}

export interface Field {
  id: string;
  kind: FieldKind;
  signerId: string;
  page: number;
  x: number;
  y: number;
  required: boolean;
  value?: string;
}

export interface SignatureRequest {
  id: string;
  title: string;
  signingType: SigningType;
  status: RequestStatus;
  signers: Signer[];
  fields: Field[];
  expiresAt: number;
  createdAt: number;
  lastActivityAt: number;
}

export interface AuditEvent {
  id: string;
  requestId: string;
  action: string;
  actor: string;
  at: number;
  payload: Record<string, unknown>;
}

export interface WebhookDelivery {
  id: string;
  requestId: string;
  event: WebhookEvent;
  attempts: number;
  status: "pending" | "delivered" | "failed";
  lastError?: string;
}

export interface CreateRequestInput {
  title: string;
  signingType: SigningType;
  signers: Array<Pick<Signer, "email" | "name" | "group">>;
  expiresAt: number;
}
