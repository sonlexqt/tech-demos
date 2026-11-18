import { getMode, listFiles, mintOpenWith, resetDemo } from "./api";
import type { BoxFileFull } from "../shared/types";

const tbody = document.querySelector<HTMLTableSectionElement>("#files-body")!;
const menu = document.querySelector<HTMLDivElement>("#context-menu")!;
const hint = document.querySelector<HTMLParagraphElement>("#hint")!;
const modeBadge = document.querySelector<HTMLSpanElement>("#mode-badge")!;
const userName = document.querySelector<HTMLSpanElement>("#user-name")!;
const resetBtn = document.querySelector<HTMLButtonElement>("#reset")!;

let files: BoxFileFull[] = [];
let selected: BoxFileFull | null = null;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function hideMenu(): void {
  menu.classList.remove("open");
}

function showMenu(x: number, y: number, file: BoxFileFull): void {
  selected = file;
  menu.style.left = `${Math.min(x, window.innerWidth - 240)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - 160)}px`;
  menu.classList.add("open");
  for (const row of tbody.querySelectorAll("tr")) {
    row.classList.toggle("selected", row.dataset.id === file.id);
  }
}

async function openWithLumin(file: BoxFileFull): Promise<void> {
  const minted = await mintOpenWith(file.id);
  window.location.href = minted.callback_path;
}

function render(): void {
  tbody.innerHTML = "";
  for (const file of files) {
    const tr = document.createElement("tr");
    tr.dataset.id = file.id;
    tr.innerHTML = `
      <td>
        <div class="file-name">
          <span class="pdf-icon">PDF</span>
          <div>
            ${file.name}
            <div style="font-size:12px;color:var(--muted);font-weight:400">${file.description ?? ""}</div>
          </div>
        </div>
      </td>
      <td>v${Number(file.etag) + 1}</td>
      <td>${formatWhen(file.modified_at)}</td>
      <td>${formatBytes(file.size)}</td>
      <td>
        <div class="row-actions">
          <button class="primary open-lumin" type="button">Open with Lumin</button>
        </div>
      </td>`;
    tr.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      showMenu(event.clientX, event.clientY, file);
    });
    tr.querySelector<HTMLButtonElement>(".open-lumin")!.addEventListener("click", () => {
      void openWithLumin(file);
    });
    tbody.append(tr);
  }
}

menu.addEventListener("click", (event) => {
  const btn = (event.target as HTMLElement).closest("button");
  if (!btn || !selected) return;
  const action = btn.dataset.action;
  hideMenu();
  if (action === "open-lumin") void openWithLumin(selected);
});

document.addEventListener("click", hideMenu);

resetBtn.addEventListener("click", async () => {
  await resetDemo();
  files = (await listFiles()).entries;
  render();
});

const mode = await getMode();
modeBadge.textContent = `${mode.mode.toUpperCase()} MODE`;
modeBadge.classList.toggle("live", mode.mode === "live");
userName.textContent = mode.user?.name ?? "Box user";
hint.innerHTML =
  mode.mode === "mock"
    ? `<strong>MOCK MODE</strong> — right-click a PDF and choose <strong>Open with Lumin</strong>. No Box credentials needed. Save writes a new version of the same file.`
    : `<strong>LIVE MODE</strong> — this session talks to the real Box API. Open a PDF via the Web App Integration callback or mint a live token.`;

files = (await listFiles()).entries;
render();
