import type { ReactNode } from "react";
import type { RequestStatus, SignerRole } from "../types";

const STATUS_CLASS: Record<RequestStatus, string> = {
  draft: "badge-draft",
  sent: "badge-sent",
  viewed: "badge-viewed",
  declined: "badge-declined",
  completed: "badge-completed",
  void: "badge-void",
  overdue: "badge-overdue",
};

const ROLE_LABEL: Record<SignerRole, string> = {
  signer: "Signer",
  countersigner: "Countersign",
  "external-counsel": "Ext. counsel",
  "internal-legal": "Internal legal",
};

export function StatusBadgeView({ status }: { status: RequestStatus }) {
  return <span className={`status-badge ${STATUS_CLASS[status]}`}>{status}</span>;
}

export function RequestCardView({
  title,
  documentName,
  status,
  dueHint,
  children,
}: {
  title: string;
  documentName: string;
  status: RequestStatus;
  dueHint: string | null;
  children?: ReactNode;
}) {
  return (
    <article className="request-card">
      <header className="request-card-head">
        <div>
          <h3 className="request-card-title">{title}</h3>
          <p className="request-card-doc">{documentName}</p>
        </div>
        <StatusBadgeView status={status} />
      </header>
      {dueHint ? <p className="request-card-due">{dueHint}</p> : null}
      <div className="request-card-body">{children}</div>
    </article>
  );
}

export function SignerChipView({
  name,
  role,
  region,
  status,
}: {
  name: string;
  role: SignerRole;
  region: "APAC" | "EMEA" | "AMER" | null;
  status: RequestStatus;
}) {
  return (
    <span className="signer-chip">
      <span className="signer-chip-avatar" aria-hidden>
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </span>
      <span className="signer-chip-meta">
        <strong>{name}</strong>
        <em>
          {ROLE_LABEL[role]}
          {region ? ` · ${region}` : ""}
        </em>
      </span>
      <StatusBadgeView status={status} />
    </span>
  );
}

export function RemindButtonView({
  label,
  requestId,
  onPress,
}: {
  label: string;
  requestId: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      className="remind-button"
      data-request-id={requestId}
      onClick={onPress}
    >
      {label}
    </button>
  );
}
