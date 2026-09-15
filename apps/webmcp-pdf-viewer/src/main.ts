import { createAgentApi } from "./agent-api";
import { PdfViewer } from "./pdf-viewer";
import { isWebMCPAvailable, registerWebMCPTools } from "./webmcp";

const canvas = document.getElementById("pdf-canvas") as HTMLCanvasElement;
const wrap = document.getElementById("viewer-wrap") as HTMLElement;
const statusLine = document.getElementById("status-line") as HTMLParagraphElement;
const pageInput = document.getElementById("page-input") as HTMLInputElement;
const pageCountEl = document.getElementById("page-count") as HTMLSpanElement;
const btnPrev = document.getElementById("btn-prev") as HTMLButtonElement;
const btnNext = document.getElementById("btn-next") as HTMLButtonElement;
const zoomSelect = document.getElementById("zoom-select") as HTMLSelectElement;
const badge = document.getElementById("webmcp-badge") as HTMLSpanElement;
const toolSelect = document.getElementById("agent-tool") as HTMLSelectElement;
const argsTextarea = document.getElementById("agent-args") as HTMLTextAreaElement;
const runBtn = document.getElementById("agent-run") as HTMLButtonElement;
const output = document.getElementById("agent-output") as HTMLPreElement;

const viewer = new PdfViewer(canvas, wrap);
const api = createAgentApi(viewer);

function syncChrome(): void {
  const count = viewer.getPageCount();
  pageInput.max = String(count || 1);
  pageInput.value = String(viewer.getCurrentPage());
  pageCountEl.textContent = `/ ${count || "—"}`;
  const zoom = viewer.getZoom();
  if (zoom === "fit-width" || zoom === "fit-page") {
    zoomSelect.value = zoom;
  } else {
    const opt = zoomSelect.querySelector(`option[value="${zoom}"]`);
    zoomSelect.value = opt ? String(zoom) : "1";
  }
}

viewer.onChange(syncChrome);

function setBadge(active: boolean, detail?: string): void {
  if (active) {
    badge.textContent = "WebMCP active";
    badge.className = "badge badge--ok";
  } else {
    badge.textContent =
      detail ?? "WebMCP unavailable — Agent panel still works";
    badge.className = "badge badge--warn";
  }
}

for (const tool of api.tools) {
  const opt = document.createElement("option");
  opt.value = tool.name;
  opt.textContent = tool.name;
  toolSelect.appendChild(opt);
}

function loadDefaultArgs(): void {
  const def = api.tools.find((t) => t.name === toolSelect.value);
  argsTextarea.value = JSON.stringify(def?.defaultArgs ?? {}, null, 2);
}

toolSelect.addEventListener("change", loadDefaultArgs);
loadDefaultArgs();

async function runAgentTool(): Promise<void> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsTextarea.value || "{}") as Record<string, unknown>;
  } catch {
    output.textContent = JSON.stringify(
      { error: "Invalid JSON in arguments" },
      null,
      2,
    );
    return;
  }
  try {
    const result = await api.run(toolSelect.value, args);
    output.textContent = JSON.stringify(result, null, 2);
    syncChrome();
  } catch (err) {
    output.textContent = JSON.stringify(
      { error: err instanceof Error ? err.message : String(err) },
      null,
      2,
    );
  }
}

runBtn.addEventListener("click", () => void runAgentTool());

btnPrev.addEventListener("click", () => void viewer.prevPage().then(syncChrome));
btnNext.addEventListener("click", () => void viewer.nextPage().then(syncChrome));
pageInput.addEventListener("change", () => {
  void viewer.goToPage(Number(pageInput.value)).then(syncChrome);
});
zoomSelect.addEventListener("change", () => {
  const v = zoomSelect.value;
  const scale =
    v === "fit-width" || v === "fit-page" ? v : Number.parseFloat(v);
  void viewer.setZoom(scale).then(syncChrome);
});

window.addEventListener("resize", () => {
  void viewer.setZoom(viewer.getZoom()).then(syncChrome);
});

async function bootstrap(): Promise<void> {
  try {
    await viewer.loadFromUrl("/sample.pdf");
    const info = await viewer.getDocumentInfo();
    statusLine.textContent = info.title
      ? `Loaded: ${info.title} (${info.pageCount} pages)`
      : `Loaded sample PDF (${info.pageCount} pages)`;
    syncChrome();

    if (isWebMCPAvailable()) {
      const names = await registerWebMCPTools(api.tools, api.run);
      setBadge(names.length > 0, undefined);
      if (names.length === 0) {
        setBadge(false, "WebMCP present but registration failed");
      }
    } else {
      setBadge(false);
    }
  } catch (err) {
    statusLine.textContent = `Failed to load PDF: ${
      err instanceof Error ? err.message : String(err)
    }`;
    setBadge(false);
  }
}

void bootstrap();
