import { loadManifest, loadPair } from "../lib/fixtures";
import { SignaturePad } from "../lib/pad";
import { playStrokes } from "../lib/replay";
import {
  downloadScoreboard,
  loadScoreboard,
  recordTrial,
  resetScoreboard,
  summarize,
  type Scoreboard,
} from "../lib/scoreboard";
import type { StrokeFile, Volunteer } from "../lib/types";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function renderBoard(el: HTMLElement, board: Scoreboard): void {
  const s = summarize(board);
  const rows = Object.entries(s.byVolunteer)
    .map(
      ([id, v]) =>
        `<tr><td>${id}</td><td>${v.correct}/${v.n}</td></tr>`,
    )
    .join("");
  el.innerHTML = `
    <p class="muted">Blind accuracy ${s.n ? Math.round(s.accuracy * 100) : 0}% (${s.correct}/${s.n}). Chance is 50%.</p>
    <table>
      <thead><tr><th>Volunteer</th><th>Correct</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="2">No trials yet</td></tr>`}</tbody>
    </table>
  `;
}

export async function renderBlind(root: HTMLElement): Promise<void> {
  const manifest = await loadManifest();
  const volunteers = manifest.volunteers;
  root.innerHTML = `
    <section>
      <h2>Blind comparison</h2>
      <p class="muted">Two replays of the same name, randomised left/right. Guess which one was drawn (fixture kinematics), not generated. Results stay in localStorage and can be exported as JSON.</p>
      <div class="toolbar">
        <label class="muted">Volunteer
          <select id="vol">${volunteers.map((v) => `<option value="${v.id}">${v.displayName}</option>`).join("")}</select>
        </label>
        <button type="button" class="primary" id="deal">Deal a pair</button>
        <button type="button" id="play">Replay both at pen speed</button>
      </div>
      <div class="grid-2">
        <div>
          <div class="pair-label"><strong>Sample A</strong><span id="tag-a" class="muted">hidden</span></div>
          <div class="pad-wrap"><canvas id="a" width="900" height="280"></canvas></div>
        </div>
        <div>
          <div class="pair-label"><strong>Sample B</strong><span id="tag-b" class="muted">hidden</span></div>
          <div class="pad-wrap"><canvas id="b" width="900" height="280"></canvas></div>
        </div>
      </div>
      <div class="toolbar">
        <button type="button" class="human" id="guess-a">A is real</button>
        <button type="button" class="human" id="guess-b">B is real</button>
        <button type="button" id="reveal" disabled>Reveal</button>
      </div>
      <p id="result" class="muted"></p>
      <div class="card">
        <h3>Scoreboard</h3>
        <div id="board"></div>
        <div class="toolbar">
          <button type="button" id="export">Export JSON</button>
          <button type="button" id="reset">Reset local scoreboard</button>
        </div>
      </div>
    </section>
  `;

  const padA = new SignaturePad(root.querySelector("#a") as HTMLCanvasElement);
  const padB = new SignaturePad(root.querySelector("#b") as HTMLCanvasElement);
  const boardEl = root.querySelector("#board") as HTMLElement;
  const resultEl = root.querySelector("#result") as HTMLElement;
  const tagA = root.querySelector("#tag-a") as HTMLElement;
  const tagB = root.querySelector("#tag-b") as HTMLElement;
  const revealBtn = root.querySelector("#reveal") as HTMLButtonElement;
  renderBoard(boardEl, loadScoreboard());

  let current:
    | {
        volunteer: Volunteer;
        left: StrokeFile;
        right: StrokeFile;
        leftWasReal: boolean;
        guessed: boolean;
      }
    | undefined;
  let abort: AbortController | null = null;

  const hideTags = () => {
    tagA.textContent = "hidden";
    tagB.textContent = "hidden";
    tagA.className = "muted";
    tagB.className = "muted";
  };

  const deal = async () => {
    abort?.abort();
    const id = (root.querySelector("#vol") as HTMLSelectElement).value;
    const volunteer = volunteers.find((v) => v.id === id)!;
    const { real, generated } = await loadPair(volunteer);
    const nonce = `${Date.now()}-${Math.random()}`;
    const leftWasReal = hashSeed(`${volunteer.id}:${nonce}`) % 2 === 0;
    const left = leftWasReal ? real : generated;
    const right = leftWasReal ? generated : real;
    padA.setFile({ ...left, points: [] });
    padB.setFile({ ...right, points: [] });
    padA.setWatermark(null);
    padB.setWatermark(null);
    hideTags();
    current = { volunteer, left, right, leftWasReal, guessed: false };
    revealBtn.disabled = true;
    resultEl.textContent = "Order is shuffled. Replay, then guess. Do not peek at filenames.";
  };

  const play = () => {
    if (!current) return;
    abort?.abort();
    abort = new AbortController();
    const { left, right } = current;
    padA.setFile({ ...left, points: [] });
    padB.setFile({ ...right, points: [] });
    padA.setWatermark(null);
    padB.setWatermark(null);
    playStrokes(
      left.points,
      (f) => {
        padA.replacePoints(f.visible, { live: true });
        if (f.done) padA.replacePoints(left.points);
      },
      { signal: abort.signal },
    );
    playStrokes(
      right.points,
      (f) => {
        padB.replacePoints(f.visible, { live: true });
        if (f.done) padB.replacePoints(right.points);
      },
      { signal: abort.signal },
    );
  };

  const guess = (leftIsRealGuess: boolean) => {
    if (!current || current.guessed) {
      resultEl.textContent = current?.guessed
        ? "Already scored this deal. Deal again."
        : "Deal a pair first.";
      return;
    }
    const correct = leftIsRealGuess === current.leftWasReal;
    current.guessed = true;
    revealBtn.disabled = false;
    const board = recordTrial({
      volunteerId: current.volunteer.id,
      displayName: current.volunteer.displayName,
      leftWasReal: current.leftWasReal,
      guessLeftIsReal: leftIsRealGuess,
      correct,
      at: new Date().toISOString(),
    });
    renderBoard(boardEl, board);
    resultEl.innerHTML = correct
      ? `<span class="ok">Correct.</span> Reveal to see labels.`
      : `<span class="bad">Wrong.</span> Reveal to see labels.`;
  };

  const reveal = () => {
    if (!current) return;
    const mark = (el: HTMLElement, file: StrokeFile) => {
      el.textContent = file.synthetic ? "SYNTHETIC" : "FIXTURE REAL";
      el.className = file.synthetic ? "badge-synth" : "badge-human";
    };
    mark(tagA, current.left);
    mark(tagB, current.right);
    padA.setFile(current.left);
    padB.setFile(current.right);
  };

  root.querySelector("#deal")!.addEventListener("click", () => void deal());
  root.querySelector("#play")!.addEventListener("click", play);
  root.querySelector("#guess-a")!.addEventListener("click", () => guess(true));
  root.querySelector("#guess-b")!.addEventListener("click", () => guess(false));
  revealBtn.addEventListener("click", reveal);
  root.querySelector("#export")!.addEventListener("click", () => {
    downloadScoreboard(loadScoreboard());
  });
  root.querySelector("#reset")!.addEventListener("click", () => {
    renderBoard(boardEl, resetScoreboard());
  });

  await deal();
}
