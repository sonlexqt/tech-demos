import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { signEnvelope } from "../api/client";
import { DocumentPreview } from "../components/DocumentPreview";
import { SignaturePad } from "../components/SignaturePad";
import { StatusPill } from "../components/StatusPill";
import { useSignatureStatus } from "../hooks/useSignatureStatus";

export function Countersign() {
  const { id } = useParams();
  const { envelope, error, loading, canSign, party, headline, detail, setEnvelope } =
    useSignatureStatus(id, "countersigner");
  const [busy, setBusy] = useState(false);

  async function onApply(signatureName: string) {
    if (!id || !party) return;
    setBusy(true);
    try {
      setEnvelope(await signEnvelope(id, party.id, signatureName));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page split">
      <section>
        <p className="eyebrow">Countersign</p>
        <h2>{envelope?.title ?? "Envelope"}</h2>
        {envelope ? <StatusPill status={envelope.status} /> : null}
        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {envelope ? <DocumentPreview envelope={envelope} /> : null}
      </section>
      <aside className="side">
        <h3>Second signature</h3>
        <p className="lede">{headline}</p>
        <p className="muted">{detail}</p>
        <p className="hook-note">
          Same shared <code>useSignatureStatus</code> hook, role: countersigner. A one-line
          change there reaches this page.
        </p>
        <SignaturePad
          defaultName={party?.name ?? ""}
          disabled={!canSign}
          busy={busy}
          actionLabel="Apply countersignature"
          onApply={onApply}
        />
        {id ? (
          <p className="side-links">
            <Link to={`/envelopes/${id}`}>Back to review</Link>
            <Link to={`/envelopes/${id}/audit`}>Audit trail</Link>
          </p>
        ) : null}
      </aside>
    </main>
  );
}
