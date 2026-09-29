import { canSend } from "../core/sign-state";
import type { SignState, TargetId } from "../core/types";

const STATUS_LABEL: Record<SignState["status"], string> = {
  draft: "Draft",
  ready: "Ready",
  sent: "Sent",
  declined: "Declined",
  blocked: "Blocked",
};

type Props = {
  state: SignState;
  highlight: TargetId | null;
  onChange: (patch: Partial<SignState>) => void;
  onSend: () => void;
  onDecline: () => void;
};

function hot(highlight: TargetId | null, id: TargetId) {
  return highlight === id ? "is-hot" : "";
}

export function SignSurface({
  state,
  highlight,
  onChange,
  onSend,
  onDecline,
}: Props) {
  const ready = canSend(state);

  return (
    <section className="sign-surface" aria-label="Lumin Sign fixture">
      <header className="sign-topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⌘
          </span>
          <div>
            <p className="brand-kicker">Lumin Sign fixture</p>
            <h1>Signature request</h1>
          </div>
        </div>
        <div className={`pin-wrap ${hot(highlight, "status")}`} data-target="status">
          <span className="pin">2</span>
          <span className={`status-badge status-${state.status}`}>
            {STATUS_LABEL[state.status]}
          </span>
        </div>
      </header>

      <div className="sign-body">
        <label className={`field ${hot(highlight, "title")}`} data-target="title">
          <span className="pin">1</span>
          <span className="field-label">Document title</span>
          <input
            value={state.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="e.g. Q3 Vendor MSA"
            autoComplete="off"
          />
        </label>

        <div className="signer-card">
          <p className="card-kicker">Signer</p>
          <label
            className={`field ${hot(highlight, "signer-name")}`}
            data-target="signer-name"
          >
            <span className="pin">3</span>
            <span className="field-label">Name</span>
            <input
              value={state.signerName}
              onChange={(event) => onChange({ signerName: event.target.value })}
              placeholder="Ada Lovelace"
              autoComplete="off"
            />
          </label>
          <label
            className={`field ${hot(highlight, "signer-email")}`}
            data-target="signer-email"
          >
            <span className="pin">4</span>
            <span className="field-label">Email</span>
            <input
              value={state.signerEmail}
              onChange={(event) => onChange({ signerEmail: event.target.value })}
              placeholder="ada@lumin.example"
              autoComplete="off"
            />
          </label>
        </div>

        <label className={`field ${hot(highlight, "message")}`} data-target="message">
          <span className="pin">5</span>
          <span className="field-label">Request note</span>
          <textarea
            rows={2}
            value={state.message}
            onChange={(event) => onChange({ message: event.target.value })}
            placeholder="Optional context for the signer"
          />
        </label>

        <article className="paper" aria-label="Document preview">
          <p className="paper-watermark">FIXTURE</p>
          <h2>{state.title.trim() || "Untitled request"}</h2>
          <p>
            This is a local Lumin Sign surface used to exercise Jev Choice/Score
            — not the production signing API. The runner clicks and types the
            numbered targets.
          </p>
          <div
            className={`sig-field ${hot(highlight, "sig-field")}`}
            data-target="sig-field"
          >
            <span className="pin">6</span>
            <span className="sig-line">
              {state.signerName.trim() || "Signer"}
            </span>
            <span className="sig-meta">
              {state.signerEmail.trim() || "email pending"}
            </span>
          </div>
          {state.status === "sent" ? (
            <p className="stamp stamp-sent">Request sent</p>
          ) : null}
          {state.status === "declined" ? (
            <p className="stamp stamp-declined">Declined</p>
          ) : null}
        </article>

        {state.error ? (
          <p
            className={`error-banner ${hot(highlight, "error-banner")}`}
            data-target="error-banner"
            role="alert"
          >
            <span className="pin">9</span>
            {state.error}
          </p>
        ) : null}
      </div>

      <footer className="sign-actions">
        <button
          type="button"
          className={`ghost ${hot(highlight, "decline")}`}
          data-target="decline"
          onClick={onDecline}
        >
          <span className="pin">7</span>
          Decline
        </button>
        <button
          type="button"
          className={`primary ${hot(highlight, "send")}`}
          data-target="send"
          onClick={onSend}
          disabled={state.status === "sent"}
        >
          <span className="pin">8</span>
          Send request
          {ready && state.status !== "sent" ? <em>ready</em> : null}
        </button>
      </footer>
    </section>
  );
}
