import { icon } from "./icons";

const MSA_BODY = `
  <h3>Master Service Agreement</h3>
  <p class="msa-meta">MSA-2026-441 · Effective 1 October 2026 · Countersign required</p>
  <p>This Master Service Agreement (“Agreement”) is entered into by <strong>Northwind Legal PLLC</strong> (“Provider”) and <strong>Harbor Notes, Inc.</strong> (“Client”).</p>
  <p><strong>1. Services.</strong> Provider will deliver document-workflow and e-signature implementation services as described in each Statement of Work. Work is accepted when Client countersigns the applicable SOW.</p>
  <p><strong>2. Term.</strong> The initial term is twelve (12) months and renews annually unless either party gives thirty (30) days’ written notice.</p>
  <p><strong>3. Confidentiality.</strong> Each party shall protect the other’s non-public information with at least reasonable care and limit disclosure to personnel with a need to know.</p>
  <p><strong>4. Electronic signatures.</strong> The parties agree that electronic signatures on this Agreement have the same legal effect as wet-ink signatures, and that an audit trail of signing events is part of the official record.</p>
`;

export function slopPage(): string {
  return `
    <article class="slop" aria-label="Generic AI-slop review and sign page">
      <header class="slop-top">
        <div class="slop-brand">✨ LumiSign AI</div>
        <div class="slop-top-actions">
          <span>🔔</span>
          <span>🌈</span>
          <span>👤</span>
        </div>
      </header>
      <section class="slop-hero">
        <p class="slop-kicker">AI-POWERED MAGIC 🚀</p>
        <h2>Let’s get this signed!!</h2>
        <p class="slop-sub">Your beautiful document is ready. One tap. Instant joy. We hid the boring legal bits so you can vibe.</p>
      </section>
      <div class="slop-card">
        <div class="slop-file">
          <span class="slop-emoji-lg">📄</span>
          <div>
            <strong>msa_final_FINAL(2).pdf</strong>
            <p>Looks good to us 💜</p>
          </div>
        </div>
        <p class="slop-blur">Parties, dates, and liability language are summarized by AI. You probably don’t need to read this.</p>
        <div class="slop-actions">
          <button type="button" class="slop-btn slop-primary" data-slop-action="magic">Start the magic ✨</button>
          <button type="button" class="slop-btn" data-slop-action="later">Maybe later</button>
          <button type="button" class="slop-btn" data-slop-action="skip">Skip →</button>
        </div>
        <p class="slop-hidden">By continuing you agree to everything, forever. We didn’t show a checkbox on purpose.</p>
        <p class="slop-toast" data-slop-toast hidden></p>
      </div>
      <footer class="slop-foot">No audit trail · Consent inferred · Powered by gradients</footer>
    </article>
  `;
}

export function restylePage(): string {
  return `
    <article class="restyle" id="restyle-root" aria-label="Restyled Lumin Sign review and sign page">
      <header class="rs-top">
        <div class="rs-brand">
          <span class="rs-mark" aria-hidden="true">${icon("pen", "✒️")}</span>
          <div>
            <strong>Lumin Sign</strong>
            <p>Review and sign</p>
          </div>
        </div>
        <a class="rs-help" href="#panel" data-help>Need help</a>
      </header>

      <div class="rs-body">
        <div class="rs-intro">
          <p class="rs-kicker">Countersign · MSA-2026-441</p>
          <h2>Master Service Agreement</h2>
          <p class="rs-lead">Northwind Legal already signed. Harbor Notes must countersign to execute the agreement. Review the document, complete your fields, then give explicit consent.</p>
        </div>

        <ol class="rs-steps" aria-label="Signing flow">
          <li class="is-done"><span>${icon("check", "✅")}</span> Review</li>
          <li class="is-now"><span>2</span> Fields</li>
          <li><span>3</span> Consent</li>
          <li><span>4</span> Sign</li>
        </ol>

        <div class="rs-grid">
          <section class="rs-doc" aria-labelledby="msa-title">
            <div class="msa-toolbar">
              <span>${icon("doc", "📄")} MSA-2026-441.pdf</span>
              <span class="msa-page">Page 1 of 1</span>
            </div>
            <div class="msa-doc" id="msa-title">
              ${MSA_BODY}
              <div class="msa-sign-row">
                <div class="msa-sign-block">
                  <p class="msa-role">Provider — already signed</p>
                  <p class="msa-sig done">Helena Voss</p>
                  <p class="msa-line">General Counsel, Northwind Legal PLLC</p>
                  <p class="msa-line">1 October 2026</p>
                </div>
                <div class="msa-sign-block yours">
                  <p class="msa-role">Client — your countersignature</p>
                  <button type="button" class="sig-field" id="sig-open" aria-describedby="sig-hint">
                    <span id="sig-preview" class="sig-placeholder">Click to sign</span>
                  </button>
                  <label class="field-label" for="sig-title">Title</label>
                  <input class="rs-input" id="sig-title" value="Head of Operations, Harbor Notes" />
                  <label class="field-label" for="sig-date">Date</label>
                  <input class="rs-input" id="sig-date" value="7 October 2026" />
                  <p id="sig-hint" class="field-hint">Required field · typed signature</p>
                </div>
              </div>
            </div>
          </section>

          <aside class="rs-rail">
            <section class="rs-card">
              <h3>${icon("user", "👤")} Signing details</h3>
              <dl>
                <div><dt>Signer</dt><dd>Ada Chen</dd></div>
                <div><dt>Email</dt><dd>ada@harbor.local</dd></div>
                <div><dt>Role</dt><dd>Countersign</dd></div>
                <div><dt>Due</dt><dd>14 October 2026</dd></div>
              </dl>
            </section>
            <section class="rs-card audit" data-audit>
              <h3>${icon("clock", "🕒")} Audit trail</h3>
              <ol class="audit-list" id="audit-list">
                <li>
                  <span class="audit-time">09:12</span>
                  <span>Sent by Helena Voss · Northwind Legal</span>
                </li>
                <li>
                  <span class="audit-time">09:14</span>
                  <span>Signed by Helena Voss (Provider)</span>
                </li>
                <li class="pending pulse" data-audit-pending>
                  <span class="audit-time">—</span>
                  <span>Waiting on Ada Chen (Client countersign)</span>
                </li>
              </ol>
            </section>
            <section class="rs-card trust">
              <h3>${icon("shield", "🛡️")} Record</h3>
              <p>ESIGN / UETA-style consent is captured with this ceremony. The audit trail is part of the official record.</p>
            </section>
          </aside>
        </div>

        <div class="rs-consent" data-consent>
          <label class="consent-row">
            <input type="checkbox" id="consent-box" />
            <span>I agree to Lumin Sign’s Terms of Service and Privacy Policy, and I consent to transact electronically. This is my electronic signature on MSA-2026-441.</span>
          </label>
        </div>

        <div class="rs-actions">
          <button type="button" class="rs-btn rs-secondary" id="btn-decline">Decline</button>
          <button type="button" class="rs-btn rs-primary" id="btn-sign" disabled>Countersign MSA</button>
        </div>
        <p class="rs-status" id="rs-status" role="status"></p>
      </div>
    </article>
  `;
}

export function signatureDialog(): string {
  return `
    <div class="sig-dialog" id="sig-dialog" hidden>
      <div class="sig-dialog-card" role="dialog" aria-modal="true" aria-labelledby="sig-dialog-title">
        <h3 id="sig-dialog-title">Create your signature</h3>
        <p>Type your legal name. It will be applied in EB Garamond italic — the heading face from this design system. Draw / Image are omitted in this demo.</p>
        <label class="field-label" for="sig-name">Full legal name</label>
        <input class="rs-input" id="sig-name" value="Ada Chen" autocomplete="name" />
        <p class="sig-live" id="sig-live">Ada Chen</p>
        <div class="sig-dialog-actions">
          <button type="button" class="rs-btn rs-secondary" id="sig-cancel">Cancel</button>
          <button type="button" class="rs-btn rs-primary" id="sig-apply">Apply signature</button>
        </div>
      </div>
    </div>
  `;
}
