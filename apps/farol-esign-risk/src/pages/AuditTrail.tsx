import { Link, useParams } from "react-router-dom";
import { AuditTimeline } from "../components/AuditTimeline";
import { StatusPill } from "../components/StatusPill";
import { useEnvelope } from "../hooks/useEnvelope";

export function AuditTrail() {
  const { id } = useParams();
  const { envelope, error, loading } = useEnvelope(id);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h2>{envelope?.title ?? "Envelope"}</h2>
          {envelope ? <StatusPill status={envelope.status} /> : null}
        </div>
        {id ? (
          <p className="side-links">
            <Link to={`/envelopes/${id}`}>Review</Link>
            <Link to={`/envelopes/${id}/countersign`}>Countersign</Link>
          </p>
        ) : null}
      </div>
      {loading ? <p className="muted">Loading audit…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {envelope ? <AuditTimeline events={envelope.audit} /> : null}
    </main>
  );
}
