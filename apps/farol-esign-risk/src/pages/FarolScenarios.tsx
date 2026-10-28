export function FarolScenarios() {
  return (
    <main className="page farol-page">
      <p className="eyebrow">Compiler analysis · not an LLM</p>
      <h2>Two PRs farol should contrast</h2>
      <p className="lede">
        This fixture is a Lumin Sign–shaped envelope app.{" "}
        <a href="https://github.com/winnin/farol">farol</a> scores merge risk from the TypeScript
        compiler: reach maps, contract breaks, untested changed lines. Reproduce both diffs with{" "}
        <code>bun run farol:scenarios</code>.
      </p>
      <div className="scenario-grid">
        <article className="card">
          <p className="eyebrow">Scenario A</p>
          <h3>Harmless copy tweak</h3>
          <p>
            Fixes the planted typo <code>Recieved for signature</code> on the envelope list. No
            shared hook, no API field.
          </p>
          <p className="muted">
            Recorded: 16/100, quick review, reach = list page only. farol will not fast-track an
            existing function, even for a typo.
          </p>
          <p className="side-links">
            <a href="/farol-reports/scenario-a/frontend.html">Frontend report</a>
          </p>
        </article>
        <article className="card">
          <p className="eyebrow">Scenario B</p>
          <h3>Quiet blast radius</h3>
          <p>
            One line in the shared signature-status helper (used by review <em>and</em>{" "}
            countersign), plus a renamed <code>status</code> field on the envelope contract.
          </p>
          <p className="muted">
            Recorded: frontend 30/100 quick review with countersign + review in the reach map
            (line 70 untested); backend 66/100 careful review, <code>Envelope.status</code> removed.
          </p>
          <p className="side-links">
            <a href="/farol-reports/scenario-b/frontend.html">Frontend report</a>
            <a href="/farol-reports/scenario-b/backend.html">Backend report</a>
          </p>
        </article>
      </div>
    </main>
  );
}
