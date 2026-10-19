import { mountFixture } from "./fixture";
import { loadPreview, seekPreview } from "./preview";
import { LAUNCH, PROJECTS, type VideoProject } from "./scenes";
import type { DeterminismReport } from "./types";

const shell = document.querySelector<HTMLDivElement>("#app")!;

let project: VideoProject = LAUNCH;
let sceneId = LAUNCH.scenes[0]!.id;
let playhead = 1.2;
let unloadPreview: (() => void) | null = null;
let detBusy = false;
let ignoreVideoClock = false;

shell.innerHTML = `
  <header class="top">
    <div>
      <p class="kicker">HyperFrames 0.8.174 · Apache-2.0</p>
      <h1>Lumin Sign, authored as HTML, rendered as MP4</h1>
    </div>
    <p class="pin">Pinned CLI <code>hyperframes@0.8.174</code> · GSAP 3.14.2 · silent cut (no keys)</p>
  </header>
  <main class="grid">
    <section class="panel fixture-panel">
      <h2>Fixture desk</h2>
      <p class="lede">Own fixtures only. Upload → place → sign → countersign → audit.</p>
      <div id="fixture"></div>
    </section>
    <section class="panel studio-panel">
      <div class="tabs">
        ${PROJECTS.map((p) => `<button type="button" data-proj="${p.id}">${p.title}</button>`).join("")}
      </div>
      <p class="skill" id="skill"></p>
      <div class="studio-media">
        <div>
          <p class="media-label">Rendered MP4</p>
          <video id="mp4" controls playsinline preload="auto"></video>
        </div>
        <div>
          <p class="media-label">Seekable HTML preview</p>
          <div class="preview-frame">
            <iframe id="preview" title="HyperFrames composition preview"></iframe>
          </div>
        </div>
      </div>
      <div class="scene-row" id="scenes"></div>
      <label class="seek">
        Playhead
        <input id="playhead" type="range" min="0" max="30" step="0.05" value="0" />
        <span id="clock">0.00s</span>
      </label>
      <details class="source" open>
        <summary>Scene HTML source</summary>
        <pre id="source"></pre>
      </details>
      <div class="det">
        <div class="det-head">
          <h2>Determinism</h2>
          <button type="button" id="det-btn">Load last report</button>
        </div>
        <pre id="det-out">Click to load <code>public/renders/determinism.json</code> (written by <code>bun run check:determinism</code>).</pre>
      </div>
    </section>
  </main>
`;

const fixtureEl = shell.querySelector<HTMLElement>("#fixture")!;
const mp4 = shell.querySelector<HTMLVideoElement>("#mp4")!;
const scenesEl = shell.querySelector<HTMLElement>("#scenes")!;
const skillEl = shell.querySelector<HTMLElement>("#skill")!;
const sourceEl = shell.querySelector<HTMLElement>("#source")!;
const playheadEl = shell.querySelector<HTMLInputElement>("#playhead")!;
const clockEl = shell.querySelector<HTMLElement>("#clock")!;
const preview = shell.querySelector<HTMLIFrameElement>("#preview")!;
const detOut = shell.querySelector<HTMLElement>("#det-out")!;
const detBtn = shell.querySelector<HTMLButtonElement>("#det-btn")!;

mountFixture(fixtureEl);

function fmt(t: number): string {
  return `${t.toFixed(2)}s`;
}

function setClock(t: number): void {
  playhead = t;
  playheadEl.value = String(t);
  clockEl.textContent = fmt(t);
}

function syncMp4(t: number): void {
  ignoreVideoClock = true;
  const apply = () => {
    if (Math.abs(mp4.currentTime - t) > 0.04) mp4.currentTime = t;
    ignoreVideoClock = false;
  };
  if (mp4.readyState >= 1) apply();
  else mp4.addEventListener("loadedmetadata", apply, { once: true });
}

async function showSource(): Promise<void> {
  const scene = project.scenes.find((s) => s.id === sceneId) ?? project.scenes[0]!;
  sourceEl.textContent = await fetch(scene.src).then((r) => r.text());
}

async function showProject(next: VideoProject): Promise<void> {
  project = next;
  sceneId = next.scenes[0]!.id;
  skillEl.textContent = `${next.skill} · ${next.width}×${next.height} · ${next.duration}s · 24 fps`;
  playheadEl.max = String(next.duration);
  setClock(1.2);
  mp4.src = next.mp4Url;
  syncMp4(playhead);
  shell.querySelectorAll("[data-proj]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.getAttribute("data-proj") === next.id);
  });
  scenesEl.innerHTML = next.scenes
    .map(
      (s) =>
        `<button type="button" data-scene="${s.id}">${s.title} <span>${s.start}–${s.start + s.duration}s</span></button>`,
    )
    .join("");
  scenesEl.querySelectorAll("[data-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sceneId = btn.getAttribute("data-scene") ?? sceneId;
      const scene = next.scenes.find((s) => s.id === sceneId);
      if (scene) {
        setClock(scene.start + 1.2);
        seekPreview(preview, project, playhead);
        syncMp4(playhead);
      }
      scenesEl.querySelectorAll("[data-scene]").forEach((b) =>
        b.classList.toggle("is-on", b.getAttribute("data-scene") === sceneId),
      );
      void showSource();
    });
  });
  scenesEl.querySelector("[data-scene]")?.classList.add("is-on");
  await showSource();
  unloadPreview?.();
  unloadPreview = await loadPreview(preview, next);
  seekPreview(preview, next, playhead);
  syncMp4(playhead);
}

playheadEl.addEventListener("input", () => {
  setClock(Number(playheadEl.value));
  seekPreview(preview, project, playhead);
  syncMp4(playhead);
  const hit = [...project.scenes].reverse().find((s) => playhead >= s.start);
  if (hit && hit.id !== sceneId) {
    sceneId = hit.id;
    scenesEl.querySelectorAll("[data-scene]").forEach((b) =>
      b.classList.toggle("is-on", b.getAttribute("data-scene") === sceneId),
    );
    void showSource();
  }
});

mp4.addEventListener("timeupdate", () => {
  if (ignoreVideoClock || document.activeElement === playheadEl) return;
  setClock(mp4.currentTime);
  seekPreview(preview, project, playhead);
});

shell.querySelectorAll("[data-proj]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-proj");
    const next = PROJECTS.find((p) => p.id === id);
    if (next) void showProject(next);
  });
});

function paintDet(report: DeterminismReport): void {
  detOut.textContent = JSON.stringify(report, null, 2);
}

detBtn.addEventListener("click", async () => {
  if (detBusy) return;
  detBusy = true;
  detBtn.disabled = true;
  try {
    const report = (await fetch("/renders/determinism.json").then((r) => {
      if (!r.ok) throw new Error("determinism.json missing — run bun run check:determinism");
      return r.json();
    })) as DeterminismReport;
    paintDet(report);
    detBtn.textContent = "Reload report";
  } catch (err) {
    detOut.textContent = String(err);
  } finally {
    detBusy = false;
    detBtn.disabled = false;
  }
});

void showProject(LAUNCH);
