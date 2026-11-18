import * as pdfjsLib from "pdfjs-dist";
import {
  downloadFile,
  exchangeCode,
  getFile,
  getMode,
  listVersions,
  simulateConflict,
  uploadVersion,
} from "./api";
import {
  type Annotation,
  type Tool,
  drawAnnotations,
  uid,
} from "./annotations";
import { flattenAnnotations } from "./flatten";
import type { BoxFileFull, BoxFileVersion } from "../shared/types";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

const params = new URLSearchParams(window.location.search);
const fileId = params.get("file_id") ?? "";
const authCode = params.get("auth_code") ?? "";
const userId = params.get("user_id") ?? "";

const fileLabel = document.querySelector<HTMLSpanElement>("#file-label")!;
const modeBadge = document.querySelector<HTMLSpanElement>("#mode-badge")!;
const metaEl = document.querySelector<HTMLDivElement>("#meta")!;
const versionsEl = document.querySelector<HTMLDivElement>("#versions")!;
const banner = document.querySelector<HTMLDivElement>("#banner")!;
const canvas = document.querySelector<HTMLCanvasElement>("#pdf-canvas")!;
const overlay = document.querySelector<HTMLCanvasElement>("#overlay")!;
const stage = document.querySelector<HTMLDivElement>("#page-stack")!;
const saveBtn = document.querySelector<HTMLButtonElement>("#save")!;
const conflictBtn = document.querySelector<HTMLButtonElement>("#simulate-conflict")!;
const undoBtn = document.querySelector<HTMLButtonElement>("#undo")!;
const pageLabel = document.querySelector<HTMLSpanElement>("#page-label")!;
const modal = document.querySelector<HTMLDivElement>("#sig-modal")!;
const sigCanvas = document.querySelector<HTMLCanvasElement>("#sig-canvas")!;
const paramsEl = document.querySelector<HTMLDivElement>("#callback-params")!;

let token = "";
let file: BoxFileFull | null = null;
let originalBytes: ArrayBuffer | null = null;
let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
let page = 1;
let tool: Tool = "highlight";
let annotations: Annotation[] = [];
let drag: { x: number; y: number } | null = null;
let ink: Annotation | null = null;
let pendingSignature: string | null = null;
let scale = 1.35;

function showBanner(kind: "ok" | "warn" | "danger", text: string): void {
  banner.className = `banner show ${kind}`;
  banner.textContent = text;
}

function setTool(next: Tool): void {
  tool = next;
  document.querySelectorAll<HTMLButtonElement>(".tool[data-tool]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tool === next);
  });
}

function normPoint(event: PointerEvent): { x: number; y: number } {
  const rect = overlay.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

function paintOverlay(): void {
  const ctx = overlay.getContext("2d");
  if (!ctx) return;
  drawAnnotations(ctx, overlay.width, overlay.height, page, annotations, paintOverlay);
}

async function renderPage(): Promise<void> {
  if (!pdfDoc) return;
  const pdfPage = await pdfDoc.getPage(page);
  const viewport = pdfPage.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  overlay.width = viewport.width;
  overlay.height = viewport.height;
  stage.style.width = `${viewport.width}px`;
  stage.style.height = `${viewport.height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  paintOverlay();
  pageLabel.textContent = `Page ${page} / ${pdfDoc.numPages}`;
}

function renderMeta(): void {
  if (!file) return;
  fileLabel.textContent = file.name;
  const version = Number(file.etag) + 1;
  metaEl.innerHTML = `
    <div><span>file_id</span><strong>${file.id}</strong></div>
    <div><span>etag</span><strong>${file.etag}</strong></div>
    <div><span>current version</span><strong>v${version}</strong></div>
    <div><span>sha1</span><strong>${file.sha1.slice(0, 10)}…</strong></div>
    <div><span>user_id</span><strong>${userId || "—"}</strong></div>
  `;
}

function renderVersions(previous: BoxFileVersion[], current: BoxFileFull): void {
  const currentN = Number(current.etag) + 1;
  const rows = [
    `<div class="version-row current"><span>v${currentN} current</span><span>${new Date(current.modified_at).toLocaleTimeString()}</span></div>`,
    ...previous.map((v) => {
      const n = v.version_number ?? "?";
      return `<div class="version-row"><span>v${n}</span><span>${new Date(v.modified_at).toLocaleTimeString()}</span></div>`;
    }),
  ];
  versionsEl.innerHTML = rows.join("") || "<div>No previous versions yet.</div>";
}

async function refreshVersions(): Promise<void> {
  if (!file) return;
  const versions = await listVersions(token, file.id);
  renderVersions(versions.entries, file);
}

async function openDocument(): Promise<void> {
  if (!fileId || !authCode) {
    showBanner("danger", "Missing Open-with callback params. Expected file_id and auth_code.");
    return;
  }
  paramsEl.textContent = `callback: file_id=${fileId}  auth_code=${authCode.slice(0, 18)}…  user_id=${userId || "—"}`;
  const tok = await exchangeCode(authCode);
  token = tok.access_token;
  file = await getFile(token, fileId);
  const downloaded = await downloadFile(token, fileId);
  originalBytes = downloaded.slice(0);
  pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(originalBytes.slice(0)) }).promise;
  page = 1;
  renderMeta();
  await renderPage();
  await refreshVersions();
  showBanner("ok", "Opened from Box. Annotate, then Save to Box as a new file version.");
}

overlay.addEventListener("pointerdown", (event) => {
  if (!pdfDoc) return;
  overlay.setPointerCapture(event.pointerId);
  const p = normPoint(event);
  if (pendingSignature) {
    annotations.push({
      id: uid(),
      type: "signature",
      page,
      x: p.x - 0.12,
      y: p.y - 0.04,
      w: 0.24,
      h: 0.08,
      dataUrl: pendingSignature,
    });
    pendingSignature = null;
    setTool("select");
    paintOverlay();
    return;
  }
  if (tool === "highlight") {
    drag = p;
  } else if (tool === "text") {
    const text = window.prompt("Text annotation", "Approved");
    if (text) {
      annotations.push({ id: uid(), type: "text", page, x: p.x, y: p.y, text, fontSize: 0.018 });
      paintOverlay();
    }
  } else if (tool === "draw") {
    ink = { id: uid(), type: "ink", page, points: [p] };
    annotations.push(ink);
  } else if (tool === "sign") {
    modal.classList.add("open");
  }
});

overlay.addEventListener("pointermove", (event) => {
  const p = normPoint(event);
  if (tool === "highlight" && drag) {
    paintOverlay();
    const ctx = overlay.getContext("2d")!;
    ctx.fillStyle = "rgba(250, 204, 21, 0.28)";
    const x = Math.min(drag.x, p.x) * overlay.width;
    const y = Math.min(drag.y, p.y) * overlay.height;
    const w = Math.abs(p.x - drag.x) * overlay.width;
    const h = Math.abs(p.y - drag.y) * overlay.height;
    ctx.fillRect(x, y, w, h);
  } else if (tool === "draw" && ink && ink.type === "ink") {
    ink.points.push(p);
    paintOverlay();
  }
});

overlay.addEventListener("pointerup", (event) => {
  const p = normPoint(event);
  if (tool === "highlight" && drag) {
    const x = Math.min(drag.x, p.x);
    const y = Math.min(drag.y, p.y);
    const w = Math.abs(p.x - drag.x);
    const h = Math.abs(p.y - drag.y);
    if (w > 0.01 && h > 0.008) {
      annotations.push({ id: uid(), type: "highlight", page, x, y, w, h });
    }
    drag = null;
    paintOverlay();
  }
  ink = null;
});

document.querySelectorAll<HTMLButtonElement>(".tool[data-tool]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.tool as Tool;
    setTool(next);
    if (next === "sign") modal.classList.add("open");
  });
});

document.querySelector<HTMLButtonElement>("#prev")!.addEventListener("click", async () => {
  if (!pdfDoc || page <= 1) return;
  page -= 1;
  await renderPage();
});
document.querySelector<HTMLButtonElement>("#next")!.addEventListener("click", async () => {
  if (!pdfDoc || page >= pdfDoc.numPages) return;
  page += 1;
  await renderPage();
});

undoBtn.addEventListener("click", () => {
  annotations.pop();
  paintOverlay();
});

conflictBtn.addEventListener("click", async () => {
  if (!file) return;
  const updated = await simulateConflict(token, file.id);
  showBanner(
    "warn",
    `Simulated a concurrent Box save. Server etag is now ${updated.etag}; this editor still holds etag ${file.etag}. Save should return 412.`,
  );
});

saveBtn.addEventListener("click", async () => {
  if (!file || !originalBytes) return;
  saveBtn.disabled = true;
  try {
    const flattened = await flattenAnnotations(originalBytes.slice(0), annotations);
    const result = await uploadVersion(token, file.id, file.name, flattened, file.etag);
    if (result.conflict) {
      showBanner(
        "danger",
        `412 Precondition Failed — If-Match etag ${file.etag} no longer matches Box. Reload metadata to overwrite, or reset the demo.`,
      );
      const latest = await getFile(token, file.id);
      const retry = window.confirm(
        `Box rejected the save (412). Latest etag is ${latest.etag} (you had ${file.etag}). Overwrite with the latest etag?`,
      );
      if (retry) {
        const again = await uploadVersion(token, file.id, file.name, flattened, latest.etag);
        if (again.file) {
          file = again.file;
          originalBytes = flattened.slice().buffer as ArrayBuffer;
          annotations = [];
          pdfDoc = await pdfjsLib.getDocument({ data: flattened.slice() }).promise;
          renderMeta();
          await renderPage();
          await refreshVersions();
          showBanner("ok", `Saved as v${Number(file.etag) + 1} after resolving the 412.`);
        }
      }
      return;
    }
    if (result.file) {
      file = result.file;
      originalBytes = flattened.slice().buffer as ArrayBuffer;
      annotations = [];
      pdfDoc = await pdfjsLib.getDocument({ data: flattened.slice() }).promise;
      renderMeta();
      await renderPage();
      await refreshVersions();
      showBanner("ok", `Saved to Box as a new version. History now includes v${Number(file.etag) + 1}.`);
    }
  } catch (err) {
    showBanner("danger", err instanceof Error ? err.message : "Save failed");
  } finally {
    saveBtn.disabled = false;
  }
});

let sigDrawing = false;
const sigCtx = sigCanvas.getContext("2d")!;
function resizeSig(): void {
  const rect = sigCanvas.getBoundingClientRect();
  sigCanvas.width = rect.width * 2;
  sigCanvas.height = rect.height * 2;
  sigCtx.scale(2, 2);
  sigCtx.strokeStyle = "#0f172a";
  sigCtx.lineWidth = 2;
  sigCtx.lineCap = "round";
}
modal.addEventListener("transitionend", () => undefined);
document.querySelector<HTMLButtonElement>("#sig-clear")!.addEventListener("click", () => {
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
});
document.querySelector<HTMLButtonElement>("#sig-cancel")!.addEventListener("click", () => {
  modal.classList.remove("open");
});
document.querySelector<HTMLButtonElement>("#sig-use")!.addEventListener("click", () => {
  pendingSignature = sigCanvas.toDataURL("image/png");
  modal.classList.remove("open");
  setTool("sign");
  showBanner("ok", "Click the PDF to place your signature stamp.");
});
sigCanvas.addEventListener("pointerdown", (event) => {
  sigDrawing = true;
  const r = sigCanvas.getBoundingClientRect();
  sigCtx.beginPath();
  sigCtx.moveTo(event.clientX - r.left, event.clientY - r.top);
});
sigCanvas.addEventListener("pointermove", (event) => {
  if (!sigDrawing) return;
  const r = sigCanvas.getBoundingClientRect();
  sigCtx.lineTo(event.clientX - r.left, event.clientY - r.top);
  sigCtx.stroke();
});
window.addEventListener("pointerup", () => {
  sigDrawing = false;
});

const observer = new MutationObserver(() => {
  if (modal.classList.contains("open")) resizeSig();
});
observer.observe(modal, { attributes: true, attributeFilter: ["class"] });

const mode = await getMode();
modeBadge.textContent = `${mode.mode.toUpperCase()} MODE`;
modeBadge.classList.toggle("live", mode.mode === "live");
setTool("highlight");
await openDocument();
