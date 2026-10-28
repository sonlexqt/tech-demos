import { Link } from "react-router-dom";
import { StatusPill } from "../components/StatusPill";
import { useEnvelopes } from "../hooks/useEnvelopes";
import { formatWhen } from "../lib/format";

export function EnvelopeList() {
  const { envelopes, error, loading, reset } = useEnvelopes();

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Inbox</p>
          <h2>Recieved for signature</h2>
          <p className="lede">
            Four local envelopes. Start with the mutual NDA — the first party already signed, so
            countersign is the live step.
          </p>
        </div>
        <button type="button" className="ghost" onClick={() => void reset()}>
          Reset fixture
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading envelopes…</p> : null}
      <table className="inbox">
        <thead>
          <tr>
            <th>Envelope</th>
            <th>Kind</th>
            <th>Status</th>
            <th>Waiting on</th>
            <th>Updated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {envelopes.map((envelope) => (
            <tr key={envelope.id}>
              <td>
                <Link to={`/envelopes/${envelope.id}`}>{envelope.title}</Link>
              </td>
              <td>{envelope.documentKind}</td>
              <td>
                <StatusPill status={envelope.status} />
              </td>
              <td>{envelope.waitingOn}</td>
              <td>{formatWhen(envelope.updatedAt)}</td>
              <td className="actions">
                <Link to={`/envelopes/${envelope.id}`}>Review</Link>
                <Link to={`/envelopes/${envelope.id}/countersign`}>Countersign</Link>
                <Link to={`/envelopes/${envelope.id}/audit`}>Audit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
