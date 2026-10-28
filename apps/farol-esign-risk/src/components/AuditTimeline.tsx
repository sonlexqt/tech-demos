import { formatWhen } from "../lib/format";
import type { AuditEvent } from "../types";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="muted">No audit events yet.</p>;
  }

  return (
    <ol className="timeline">
      {[...events].reverse().map((item) => (
        <li key={item.id}>
          <span className="time">{formatWhen(item.at)}</span>
          <strong>{item.action}</strong>
          <span>{item.actor}</span>
          <p>{item.detail}</p>
        </li>
      ))}
    </ol>
  );
}
