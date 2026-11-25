import { loadManifest, loadStroke } from "../lib/fixtures";
import { SignaturePad } from "../lib/pad";
import { playStrokes, replayDuration } from "../lib/replay";
import {
  durationMs,
  downloadText,
  emptyStrokeFile,
  penUpCount,
  splitStrokes,
  strokeFileToSvg,
  parseStrokeFile,
} from "../lib/strokes";
import type { StrokeFile } from "../lib/types";

function stats(file: StrokeFile): string {
  const dur = durationMs(file.points);
  return `
    <div class="stats">
      <div class="stat"><b>points</b>${file.points.length}</div>
      <div class="stat"><b>strokes</b>${splitStrokes(file.points).length}</div>
      <div class="stat"><b>pen-ups</b>${penUpCount(file.points)}</div>
      <div class="stat"><b>duration</b>${(dur / 1000).toFixed(2)}s</div>
    </div>
  `;
}

export async function renderPad(root: HTMLElement): Promise<void> {
  const manifest = await loadManifest();
  const options = manifest.volunteers
    .flatMap((v) => [
      `<option value="${v.realId}">${v.displayName} · fixture real</option>`,
      `<option value="${v.generatedId}">${v.displayName} · generated</option>`,
    ])
    .join("");

  root.innerHTML = `
    <section>
      <h2>Draw-to-sign pad</h2>
      <p class="muted">Same capture a Lumin Sign draw step would keep: timestamped points with pen up/down. Replay uses the recorded clock, not a constant plotter speed.</p>
      <div class="toolbar">
        <button type="button" id="clear">Clear</button>
        <button type="button" id="undo">Undo stroke</button>
        <button type="button" id="replay">Replay at pen speed</button>
        <button type="button" id="stop">Stop</button>
        <button type="button" id="json">Download JSON</button>
        <button type="button" id="svg">Download SVG</button>
        <label class="file-btn">Load JSON<input id="load" class="hidden-input" type="file" accept="application/json,.json" /></label>
        <select id="fixture" aria-label="Load fixture">
          <option value="">Load fixture…</option>
          ${options}
        </select>
      </div>
      <div class="pad-wrap"><canvas id="pad" width="900" height="280"></canvas></div>
      <div id="stats"></div>
      <p class="muted" id="meta"></p>
    </section>
  `;

  const canvas = root.querySelector("#pad") as HTMLCanvasElement;
  const pad = new SignaturePad(canvas, emptyStrokeFile({ displayName: "Local pad" }));
  const statsEl = root.querySelector("#stats") as HTMLElement;
  const meta = root.querySelector("#meta") as HTMLElement;
  let abort: AbortController | null = null;

  const refresh = () => {
    statsEl.innerHTML = stats(pad.file);
    const mark = pad.file.synthetic
      ? `<span class="badge-synth">SYNTHETIC</span>`
      : `<span class="badge-human">PAD / FIXTURE</span>`;
    meta.innerHTML = `${mark} ${pad.file.id} · ${pad.file.source} · ${pad.file.displayName}`;
  };
  pad.onChange(refresh);
  refresh();

  const stopReplay = () => {
    abort?.abort();
    abort = null;
    pad.redraw();
  };

  root.querySelector("#clear")!.addEventListener("click", () => {
    stopReplay();
    pad.clear();
  });
  root.querySelector("#undo")!.addEventListener("click", () => {
    stopReplay();
    pad.undo();
  });
  root.querySelector("#stop")!.addEventListener("click", stopReplay);
  root.querySelector("#replay")!.addEventListener("click", () => {
    stopReplay();
    abort = new AbortController();
    const pts = pad.file.points;
    playStrokes(
      pts,
      (frame) => {
        pad.replacePoints(frame.visible, { live: true });
        if (frame.done) pad.replacePoints(pts);
      },
      { signal: abort.signal },
    );
    meta.textContent = `Replaying ${(replayDuration(pts) / 1000).toFixed(2)}s at 1× pen speed`;
  });
  root.querySelector("#json")!.addEventListener("click", () => {
    downloadText(
      `${pad.file.id}.json`,
      JSON.stringify(pad.file, null, 2),
      "application/json",
    );
  });
  root.querySelector("#svg")!.addEventListener("click", () => {
    downloadText(`${pad.file.id}.svg`, strokeFileToSvg(pad.file), "image/svg+xml");
  });
  root.querySelector("#load")!.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      pad.setFile(parseStrokeFile(await file.text()));
    } catch (err) {
      meta.textContent = String(err);
    }
  });
  root.querySelector("#fixture")!.addEventListener("change", async (e) => {
    const id = (e.target as HTMLSelectElement).value;
    if (!id) return;
    stopReplay();
    pad.setFile(await loadStroke(id));
  });
}
