export type SigningType = "SAME_TIME" | "ORDER";

export type VerificationClaim =
  | "given_name"
  | "family_name"
  | "issuing_country"
  | "issuing_authority"
  | "document_number";

export type SignerVerification = {
  method: "vc";
  payload: {
    doc_type?: "driver_license" | "photo_id" | "nz_business_passport";
    claims: VerificationClaim[];
  };
};

export type ApiSigner = {
  name: string;
  email_address: string;
  group?: number;
  verification?: SignerVerification;
};

export type ApiViewer = {
  name: string;
  email_address: string;
};

export type CustomEmail = {
  sender_email?: string;
  subject_name?: string;
  title?: string;
};

/** Shape of POST /v1/signature_request/send — playground only, never sent. */
export type SignatureRequestDTO = {
  file_url: string;
  title: string;
  signers: ApiSigner[];
  expires_at: number;
  viewers?: ApiViewer[];
  signing_type?: SigningType;
  use_text_tags?: boolean;
  custom_email?: CustomEmail;
};

export type Workspace = {
  file_url: string;
  title: string;
  signers: ApiSigner[];
  viewers: ApiViewer[];
  expires_at: number;
  signing_type: SigningType;
  use_text_tags: boolean;
  custom_email: CustomEmail;
};

export type PasteTarget =
  | "title"
  | "signer"
  | "viewer"
  | "expires_at"
  | "signing_type"
  | "custom_email.subject_name"
  | "custom_email.title"
  | "custom_email.sender_email"
  | "use_text_tags"
  | "verification";

export type Intent = "signer_list" | "request_meta" | "viewer_list" | "mixed" | "junk";

export type PersonKind = "signer" | "viewer" | "cc";

export type PersonCandidate = {
  name: string;
  email: string;
  group?: number;
  kind: PersonKind;
  verify?: boolean;
};

export type ExpireHint = {
  label: string;
  ms: number;
};

export type Candidates = {
  emails: string[];
  people: PersonCandidate[];
  titles: string[];
  expires: ExpireHint[];
  signingTypes: SigningType[];
  subjects: string[];
  emailTitles: string[];
  senderEmails: string[];
  textTags: boolean;
};

export type Proposal = {
  id: string;
  target: PasteTarget;
  path: string;
  label: string;
  value: string;
  name?: string;
  group?: number;
  verification?: SignerVerification;
  confidence: number;
  reason: string;
};

export type ModeInfo = {
  mode: "live" | "fixture";
  provider: "typesafe" | "ai-gateway" | null;
};

export type ClassifyResponse = {
  mode: "live" | "fixture";
  provider: "typesafe" | "ai-gateway" | null;
  model?: string;
  latency_ms: number;
  intent: Intent;
  intent_probabilities: Record<string, number>;
  intent_confidence: number;
  fit_score: number;
  fit_confidence: number;
  proposals: Proposal[];
  error?: string;
};
