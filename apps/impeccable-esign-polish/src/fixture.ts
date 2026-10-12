export function renderFixture(): string {
  return `
    <div class="sign-app" id="signer" data-slop="all">
      <header class="sign-top">
        <div class="brand-lockup">
          <span class="mark" aria-hidden="true">LS</span>
          <div>
            <p class="product">Lumin Sign</p>
            <p class="env-id">MSA-2026-4412 · Countersign</p>
          </div>
        </div>
        <div class="signer-chip">
          <img class="avatar-img" alt="Signer avatar" data-rule="broken-image" />
          <span class="avatar-fallback" aria-hidden="true">AC</span>
          <div>
            <strong>Ada Chen</strong>
            <span>Countersigner · Lumin Software</span>
          </div>
        </div>
      </header>

      <div class="sign-body">
        <section class="doc-pane" aria-label="Agreement preview">
          <div class="hero">
            <span class="eyebrow" data-rule="marketing-buzzword">AI-powered closing</span>
            <h1 class="hero-title" data-rule="gradient-text">Review &amp; Sign</h1>
            <p class="pitch" data-rule="marketing-buzzword">
              Supercharge your agreements with world-class legal velocity — enterprise-grade
              countersign in minutes — not a workflow. A platform.
            </p>
            <p class="pitch-fixed">
              Countersign the Master Service Agreement between Northwind Robotics and Lumin Software.
              Review the instrument, complete the remaining fields, then adopt your signature.
            </p>
          </div>

          <div class="glass-card" data-rule="nested-cards dark-glow">
            <div class="nested-inner">
              <article class="doc-card" data-rule="side-tab">
                <p class="kicker">Envelope</p>
                <h3 class="msa-heading" data-rule="skipped-heading">Master Service Agreement — Countersign</h3>
                <h2 class="msa-heading-fixed">Master Service Agreement</h2>
                <p class="fine-print" data-rule="low-contrast tiny-text tight-leading">
                  Envelope MSA-2026-4412 · Northwind Robotics ↔ Lumin Software · you are the
                  countersigner — click every field — then adopt your signature. This is not theater —
                  it is mission-critical closing infrastructure — built to future-proof your stack.
                </p>
                <p class="fine-print-fixed">
                  You are countersigning as Ada Chen for Lumin Software. Fields still open: signature,
                  date, and title. Adopting the signature binds Lumin to the MSA as written.
                </p>

                <ol class="clauses">
                  <li><strong>Parties.</strong> Northwind Robotics, Inc. (“Customer”) and Lumin Software, Inc. (“Provider”).</li>
                  <li><strong>Term.</strong> Twelve months from the last signature date, renewing annually unless either party gives 30 days’ notice.</li>
                  <li><strong>Fees.</strong> Platform fees per Order Form. Countersignature does not change previously quoted amounts.</li>
                  <li><strong>Signatures.</strong> Electronic adoption of the signature block below has the same effect as wet ink.</li>
                </ol>

                <div class="sign-field" id="signature-field">
                  <span class="field-label">Signature · Ada Chen</span>
                  <button type="button" class="sign-here">Click to sign</button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <aside class="rail" aria-label="Signer actions">
          <div class="metric-block" data-rule="gradient-text">
            <div class="metric">99.9%</div>
            <p class="metric-label">uptime</p>
            <p class="metric-fixed-note">Envelope progress, not a landing-page metric.</p>
          </div>
          <div class="progress-fixed">
            <p class="progress-kicker">Remaining</p>
            <strong>3 fields</strong>
            <p>Signature, date, title</p>
          </div>

          <button type="button" class="sign-btn" data-rule="gray-on-color low-contrast dark-glow">
            Sign all remaining
          </button>
          <button type="button" class="decline" data-rule="low-contrast tiny-text">Decline</button>

          <div class="feature-grid" data-rule="side-tab">
            <article class="feature-card">
              <div class="icon-tile" aria-hidden="true"></div>
              <h3>Secure</h3>
              <p>Bank-grade encryption for every packet.</p>
            </article>
            <article class="feature-card">
              <div class="icon-tile" aria-hidden="true"></div>
              <h3>Audit trail</h3>
              <p>Bank-grade encryption for every packet.</p>
            </article>
            <article class="feature-card">
              <div class="icon-tile" aria-hidden="true"></div>
              <h3>Instant</h3>
              <p>Bank-grade encryption for every packet.</p>
            </article>
          </div>
          <p class="rail-fixed-copy">
            Certificate of completion will list IP, timestamp, and the adopted mark. No marketing tiles on this step.
          </p>
        </aside>
      </div>
    </div>
  `;
}

export function applyFixtureFixes(root: HTMLElement, fixed: Set<string>, highlight: string | null): void {
  root.dataset.fixed = [...fixed].join(" ");
  for (const node of root.querySelectorAll<HTMLElement>("[data-rule]")) {
    const rules = (node.dataset.rule ?? "").split(/\s+/);
    node.classList.toggle("is-highlighted", highlight !== null && rules.includes(highlight));
  }
}
