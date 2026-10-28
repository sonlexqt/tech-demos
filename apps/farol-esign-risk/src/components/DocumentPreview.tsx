import type { Envelope } from "../types";

export function DocumentPreview({ envelope }: { envelope: Envelope }) {
  return (
    <article className="paper" aria-label="Document preview">
      <p className="paper-kind">{envelope.documentKind}</p>
      <h2>{envelope.title}</h2>
      <p className="paper-meta">
        Envelope <code>{envelope.id}</code>
      </p>
      {envelope.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <footer className="paper-signers">
        {envelope.parties.map((party) => (
          <div key={party.id} className="sign-block">
            <span className="sign-role">{party.role}</span>
            <strong className={party.status === "signed" ? "sign-applied" : ""}>
              {party.status === "signed" ? party.name : "________________"}
            </strong>
            <span>{party.email}</span>
          </div>
        ))}
      </footer>
    </article>
  );
}
