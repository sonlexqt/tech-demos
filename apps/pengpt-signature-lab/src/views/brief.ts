export function renderBrief(root: HTMLElement): void {
  root.innerHTML = `
    <section class="brief">
      <p>
        Lumin Sign already stores an audit trail for a drawn signature.
        PenGPT (~6&nbsp;M parameters, numpy, open weights) emits the same kind of
        ink — ordered pen strokes — from a short sample of a hand. This lab asks
        whether that trail still means much.
      </p>
      <p>
        Four fixture volunteers. Each pair is a pad-style capture with human
        kinematics and a PenGPT rendering of the same name, replayed at recorded
        speed. Rate them blind, then inspect the forensics scorer.
      </p>
      <ul>
        <li>Fixtures only. No customer signatures. Consent template in <code>CONSENT.md</code>.</li>
        <li>Every generated file has <code>synthetic: true</code>. The UI stamps <strong>SYNTHETIC</strong>.</li>
        <li>This app is local-only. There is no Cloudflare Pages (or other) deploy: a public URL would be a gallery of forgeable signatures.</li>
        <li>Identity proof (Lumin ID) is out of scope here on purpose — that is the stronger signal this demo is arguing for.</li>
      </ul>
      <div class="callout">
        Cloud run used real PenGPT inference: <code>hand.npz</code> from
        <code>greydanus/pengpt</code> release <code>models-2026-11-16</code>.
        Generated fixtures are model ink with a regular invented clock (PenGPT has no timestamps).
        “Real” fixtures are minimum-jerk stand-ins, not live people.
      </div>
    </section>
  `;
}
