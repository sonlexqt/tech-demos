import evidenceIndex from "../fixtures/rea-output/evidence-index.json";
import report from "../fixtures/rea-output/how-signing-works.json";
import { scoreAccuracy, tally } from "./accuracy";
import { REBUILT_FROM, RebuiltSignaturePad } from "./signature-pad";
import { SOURCE_FILES } from "./source-files";
import type { AccuracyCheck, EvidenceIndex, SigningReport } from "./types";
import "./style.css";

const typedReport = report as SigningReport;
const typedIndex = evidenceIndex as EvidenceIndex;
const checks = scoreAccuracy(typedIndex);
const counts = tally(checks);

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("missing #app");
}

app.innerHTML = `
  <header class="top">
    <div>
      <p class="eyebrow">REA · JS-bundle path · owned fixture</p>
      <h1>Lumin Sign teardown</h1>
      <p class="lede">${escapeHtml(typedReport.subtitle)}</p>
    </div>
    <div class="badges">
      <span class="badge offline">offline fixture</span>
      <span class="badge">${escapeHtml(typedReport.rea.package)}</span>
      <span class="badge">no keys</span>
    </div>
  </header>

  <p class="disclaimer">${escapeHtml(typedReport.disclaimer)}</p>

  <section class="split">
    <article class="panel report">
      <header>
        <h2>How signing really works</h2>
        <p class="meta">
          ${escapeHtml(String(typedReport.rea.provider))} ·
          ${escapeHtml(String(typedReport.rea.authority))} ·
          ${escapeHtml(String(typedReport.rea.confidence))}
        </p>
      </header>
      <dl class="ids">
        <div><dt>analyze</dt><dd><code>${escapeHtml(typedReport.rea.analyze_evidence_id)}</code></dd></div>
        <div><dt>inspect</dt><dd><code>${escapeHtml(typedReport.rea.inspect_evidence_id)}</code></dd></div>
        <div><dt>graph</dt><dd><code>${escapeHtml(typedReport.rea.graph_id)}</code></dd></div>
      </dl>
      <ol class="flow">
        ${typedReport.flow
          .map(
            (step) => `
          <li>
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.claim)}</p>
            <ul>${step.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            <p class="src">${escapeHtml(step.source_file)}</p>
          </li>`,
          )
          .join("")}
      </ol>
      <h3>REA limitations (quoted)</h3>
      <ul class="limits">
        ${typedReport.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>

    <article class="panel source">
      <header>
        <h2>Original source</h2>
        <p class="meta">Readable fixture vs the minified bundle REA actually read</p>
      </header>
      <div class="tabs" role="tablist">
        ${SOURCE_FILES.map(
          (file, index) =>
            `<button type="button" class="tab${index === 2 ? " active" : ""}" data-file="${file.id}">${escapeHtml(file.label)}</button>`,
        ).join("")}
      </div>
      ${SOURCE_FILES.map(
        (file, index) => `
        <div class="code-wrap${index === 2 ? " active" : ""}" data-pane="${file.id}">
          <p class="path">${escapeHtml(file.path)}</p>
          <pre><code>${escapeHtml(file.code)}</code></pre>
        </div>`,
      ).join("")}
    </article>
  </section>

  <section class="panel accuracy">
    <header>
      <h2>Accuracy check</h2>
      <p class="counts">
        <span class="match">${counts.match} match</span>
        <span class="miss">${counts.miss} miss</span>
        <span class="unknown">${counts.unknown} unknown</span>
      </p>
    </header>
    <table>
      <thead>
        <tr><th>Verdict</th><th>Claim vs source</th><th>REA evidence</th></tr>
      </thead>
      <tbody>
        ${checks.map((row) => renderCheck(row)).join("")}
      </tbody>
    </table>
  </section>

  <section class="panel pad">
    <header>
      <h2>Rebuilt signature capture</h2>
      <p class="meta">
        Live pad reconstructed from REA findings
        <code>${escapeHtml(REBUILT_FROM.analyze_evidence_id)}</code>
      </p>
    </header>
    <div class="pad-grid">
      <div>
        <canvas id="sign-pad" width="720" height="220" aria-label="Draw a signature"></canvas>
        <div class="pad-actions">
          <button type="button" id="clear-pad">Clear</button>
          <button type="button" id="export-pad" class="primary">Export PNG</button>
          <p id="pad-status" class="status" role="status">Draw with the pointer, then export.</p>
        </div>
      </div>
      <div class="preview">
        <p>Exported <code>image/png</code></p>
        <img id="sign-preview" alt="Exported signature preview" hidden />
        <p class="from">
          Events ${REBUILT_FROM.events.join(" → ")}. Methods
          ${REBUILT_FROM.methods.join(", ")}. Empty ink throws
          <code>${escapeHtml(REBUILT_FROM.emptyError)}</code>.
        </p>
      </div>
    </div>
  </section>
`;

for (const tab of app.querySelectorAll<HTMLButtonElement>(".tab")) {
  tab.addEventListener("click", () => {
    const id = tab.dataset.file;
    app.querySelectorAll(".tab").forEach((node) => node.classList.toggle("active", node === tab));
    app.querySelectorAll(".code-wrap").forEach((node) => {
      node.classList.toggle("active", node instanceof HTMLElement && node.dataset.pane === id);
    });
  });
}

const canvas = app.querySelector<HTMLCanvasElement>("#sign-pad");
const status = app.querySelector<HTMLParagraphElement>("#pad-status");
const preview = app.querySelector<HTMLImageElement>("#sign-preview");
if (!canvas || !status || !preview) {
  throw new Error("missing pad nodes");
}

const pad = new RebuiltSignaturePad(canvas);
pad.attach();

app.querySelector("#clear-pad")?.addEventListener("click", () => {
  pad.clear();
  preview.hidden = true;
  preview.removeAttribute("src");
  status.textContent = "Pad cleared.";
});

app.querySelector("#export-pad")?.addEventListener("click", () => {
  try {
    const png = pad.exportPng();
    preview.src = png;
    preview.hidden = false;
    status.textContent = `Exported ${REBUILT_FROM.mime} (${Math.round(png.length / 1024)} KB data URL).`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "export failed";
    status.textContent = message;
  }
});

function renderCheck(row: AccuracyCheck): string {
  return `
    <tr class="${row.verdict}">
      <td><span class="pill ${row.verdict}">${row.verdict}</span></td>
      <td>
        <strong>${escapeHtml(row.claim)}</strong>
        <span class="src">${escapeHtml(row.source)}</span>
      </td>
      <td>${escapeHtml(row.rea)}</td>
    </tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
