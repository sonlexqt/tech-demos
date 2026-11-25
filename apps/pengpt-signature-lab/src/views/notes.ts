import { loadManifest, loadStroke } from "../lib/fixtures";
import { SignaturePad } from "../lib/pad";
import { downloadPdf, notesPdf } from "../lib/pdfNotes";
import { playStrokes } from "../lib/replay";

export async function renderNotes(root: HTMLElement): Promise<void> {
  const manifest = await loadManifest();
  const options = manifest.volunteers
    .map(
      (v) =>
        `<option value="${v.notesId ?? v.generatedId}">${v.displayName} · “${v.notesText ?? v.text}”</option>`,
    )
    .join("");

  root.innerHTML = `
    <section>
      <h2>Write my notes in my own handwriting</h2>
      <p class="muted">Bonus path: PenGPT strokes stamped onto a dummy page with <code>pdf-lib</code>. This is the “annotation” — generated ink on a PDF, always watermarked SYNTHETIC. Not a signing ceremony.</p>
      <div class="toolbar">
        <select id="pick">${options}</select>
        <button type="button" id="replay">Replay ink</button>
        <button type="button" class="primary" id="pdf">Download annotated PDF</button>
      </div>
      <div class="pad-wrap"><canvas id="pad" width="900" height="280"></canvas></div>
      <p class="muted" id="status"></p>
    </section>
  `;

  const pad = new SignaturePad(root.querySelector("#pad") as HTMLCanvasElement);
  const status = root.querySelector("#status") as HTMLElement;
  let abort: AbortController | null = null;

  const load = async () => {
    abort?.abort();
    const id = (root.querySelector("#pick") as HTMLSelectElement).value;
    const file = await loadStroke(id);
    pad.setFile(file);
    status.innerHTML = `<span class="badge-synth">SYNTHETIC</span> ${file.text}`;
    return file;
  };

  await load();

  root.querySelector("#pick")!.addEventListener("change", () => void load());
  root.querySelector("#replay")!.addEventListener("click", async () => {
    const file = pad.file;
    abort?.abort();
    abort = new AbortController();
    pad.replacePoints([]);
    playStrokes(
      file.points,
      (f) => {
        pad.replacePoints(f.visible, { live: true });
        if (f.done) pad.replacePoints(file.points);
      },
      { signal: abort.signal },
    );
  });
  root.querySelector("#pdf")!.addEventListener("click", async () => {
    status.textContent = "Building PDF…";
    const bytes = await notesPdf(pad.file);
    downloadPdf(bytes, `${pad.file.id}-notes.pdf`);
    status.innerHTML = `<span class="badge-synth">SYNTHETIC</span> saved ${pad.file.id}-notes.pdf`;
  });
}
