import { classifyFixtures, scoreStrokeFile } from "../lib/forensics";
import { loadAllLabeled, loadManifest, loadStroke } from "../lib/fixtures";
import { parseStrokeFile } from "../lib/strokes";
import type { StrokeFile } from "../lib/types";

function featureRows(file: StrokeFile): string {
  const s = scoreStrokeFile(file);
  const f = s.features;
  const rows: [string, string][] = [
    ["Looks human", `${Math.round(s.looksHuman * 100)} / 100  →  ${s.predicted}`],
    ["Points / strokes / pen-ups", `${f.pointCount} / ${f.strokeCount} / ${f.penUpCount}`],
    ["Duration", `${(f.durationMs / 1000).toFixed(2)} s`],
    ["Mean Δt (ms)", f.meanDt.toFixed(2)],
    ["Δt CV / regularity", `${f.dtCv.toFixed(3)} / ${f.dtRegularity.toFixed(3)}`],
    ["Speed mean / CV", `${f.speedMean.toFixed(3)} px/ms / ${f.speedCv.toFixed(3)}`],
    ["|accel| / |jerk|", `${f.accelMeanAbs.toFixed(4)} / ${f.jerkMeanAbs.toFixed(4)}`],
    ["Pauses (n, mean, CV)", `${f.pauseCount}, ${f.pauseMean.toFixed(0)} ms, ${f.pauseCv.toFixed(3)}`],
    ["Sampling jitter", f.samplingJitter.toFixed(3)],
    ["Grid snap", f.gridSnap.toFixed(3)],
    ["Time-grid snap (12 ms)", f.timeGridSnap.toFixed(3)],
    ["Start–end slowdown", f.startEndSlowdown.toFixed(3)],
    ["Turning roughness", f.turningRoughness.toFixed(3)],
  ];
  return `
    <p class="score-num">${Math.round(s.looksHuman * 100)}</p>
    <div class="meter" aria-label="looks human"><span style="width:${Math.round(s.looksHuman * 100)}%"></span></div>
    <p class="muted">${s.reasons.map((r) => r).join(" ")}</p>
    <table><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>
  `;
}

export async function renderForensics(root: HTMLElement): Promise<void> {
  const manifest = await loadManifest();
  const options = manifest.volunteers
    .flatMap((v) => [
      `<option value="${v.realId}">${v.displayName} · real</option>`,
      `<option value="${v.generatedId}">${v.displayName} · generated</option>`,
    ])
    .join("");

  root.innerHTML = `
    <section>
      <h2>Stroke forensics</h2>
      <p class="muted">Speed, acceleration, jerk, pauses, pen-up count, sampling jitter, grid snap, timing regularity. A single “looks human” score, then a real-vs-generated report over the fixtures.</p>
      <div class="toolbar">
        <select id="pick">${options}</select>
        <label class="file-btn">Load JSON<input id="load" class="hidden-input" type="file" accept="application/json,.json" /></label>
        <button type="button" class="primary" id="report">Classifier report on fixtures</button>
      </div>
      <div class="grid-2">
        <div class="card" id="one"><p class="muted">Pick a file.</p></div>
        <div class="card" id="all"><p class="muted">Run the report to score every volunteer pair.</p></div>
      </div>
      <div class="callout danger">
        <strong>What this cannot detect.</strong>
        A forger who traces generated ink slowly, or who rewrites PenGPT geometry with a human clock, will look “human” on several of these features.
        PenGPT does not emit time; our wrapper invents it — so will an attacker.
        Letter shape is not scored. Four volunteers are not a population.
        Drawn-signature telemetry is a weak audit signal next to Lumin ID.
      </div>
    </section>
  `;

  const one = root.querySelector("#one") as HTMLElement;
  const all = root.querySelector("#all") as HTMLElement;

  const show = (file: StrokeFile) => {
    const mark = file.synthetic
      ? `<span class="badge-synth">SYNTHETIC</span>`
      : `<span class="badge-human">FIXTURE REAL</span>`;
    one.innerHTML = `<h3>${file.displayName} ${mark}</h3>${featureRows(file)}`;
  };

  const first = await loadStroke(manifest.volunteers[0].realId);
  show(first);

  root.querySelector("#pick")!.addEventListener("change", async (e) => {
    show(await loadStroke((e.target as HTMLSelectElement).value));
  });
  root.querySelector("#load")!.addEventListener("change", async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    show(parseStrokeFile(await f.text()));
  });
  root.querySelector("#report")!.addEventListener("click", async () => {
    const files = await loadAllLabeled(manifest);
    const report = classifyFixtures(files);
    const rows = report.trials
      .map(
        (t) => `<tr>
          <td>${t.id}</td>
          <td>${t.synthetic ? "generated" : "human"}</td>
          <td>${t.predicted}</td>
          <td>${Math.round(t.looksHuman * 100)}</td>
          <td class="${t.correct ? "ok" : "bad"}">${t.correct ? "yes" : "no"}</td>
        </tr>`,
      )
      .join("");
    all.innerHTML = `
      <h3>Fixture classifier</h3>
      <p>Accuracy <strong>${Math.round(report.accuracy * 100)}%</strong>
      · TP ${report.truePositives} TN ${report.trueNegatives}
      · FP ${report.falsePositives} FN ${report.falseNegatives}
      · threshold ${report.threshold}</p>
      <table>
        <thead><tr><th>File</th><th>Label</th><th>Pred</th><th>Score</th><th>OK</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="muted">${report.notes.join(" ")}</p>
    `;
  });
}
