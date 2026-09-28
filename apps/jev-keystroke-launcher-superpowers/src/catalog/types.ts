export type ItemKind = "pdf" | "doc" | "signature_request" | "folder" | "template";

export type SignatureStatus =
  | "waiting"
  | "countersign"
  | "expired"
  | "completed"
  | "draft";

export type LauncherIntent =
  | "newest_download"
  | "waiting_legal"
  | "msa_countersign"
  | "expired_signature"
  | "generic";

export interface SignatureMeta {
  status: SignatureStatus;
  waitingOn?: string;
  documentType?: string;
  expiresAt?: string;
}

export interface WorkspaceItem {
  id: string;
  title: string;
  kind: ItemKind;
  subtitle: string;
  tags: string[];
  modifiedAt: string;
  downloadedAt?: string;
  signature?: SignatureMeta;
}

export interface RankedHit {
  item: WorkspaceItem;
  score: number;
  reasons: string[];
  intent: LauncherIntent;
}
