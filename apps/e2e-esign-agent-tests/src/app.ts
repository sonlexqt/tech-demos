import { COPY, ENVELOPE, SIGNERS, type Variant } from "./copy";
import { renderPdfPage } from "./pdf";
import { renderResults } from "./results";
import {
  envelopeHeading,
  loadEnvelope,
  readVariantFromLocation,
  resetEnvelope,
  saveEnvelope,
  setVariant,
  statusLabel,
  type EnvelopeState,
  type PlacedField,
} from "./state";

export type Route =
  | { name: "home" }
  | { name: "prepare" }
  | { name: "sign"; signer: 1 | 2 }
  | { name: "envelope" }
  | { name: "results" };

export function parsePath(pathname: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/prepare") return { name: "prepare" };
  if (path === "/sign/1") return { name: "sign", signer: 1 };
  if (path === "/sign/2") return { name: "sign", signer: 2 };
  if (path === "/envelope") return { name: "envelope" };
  if (path === "/results") return { name: "results" };
  return { name: "home" };
}

function go(path: string): void {
  history.pushState({}, "", path + location.hash);
  void render();
}

function variant(): Variant {
  return readVariantFromLocation();
}

function bugOn(): boolean {
  return variant() === "drift";
}

function copy() {
  return COPY[variant()];
}

function markNav(): void {
  const path = location.pathname;
  for (const a of document.querySelectorAll<HTMLAnchorElement>(".nav a")) {
    const href = a.getAttribute("href") ?? "";
    a.setAttribute("aria-current", href === path ? "page" : "false");
  }
}

export async function render(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) return;
  markNav();
  const route = parsePath(location.pathname);
  const state = loadEnvelope();
  if (route.name === "results") {
    renderResults(root);
    return;
  }
  if (route.name === "prepare") {
    await renderPrepare(root, state);
    return;
  }
  if (route.name === "sign") {
    renderSign(root, state, route.signer);
    return;
  }
  if (route.name === "envelope") {
    renderEnvelope(root, state);
    return;
  }
  renderHome(root, state);
}

function statusEl(state: EnvelopeState): string {
  const shown = statusLabel(state.status, bugOn());
  const dataState = shown === "Completed" ? "completed" : state.status;
  return `<span class="status" role="status" data-testid="envelope-status" data-state="${dataState}">${shown}</span>`;
}

function renderHome(root: HTMLElement, state: EnvelopeState): void {
  const v = variant();
  root.innerHTML = `
    <section class="lede">
      <h2>Two-signer desk</h2>
      <p class="muted">
        Place a field on the sample MSA, type Ada’s signature, then let Bob
        countersign. Cached e2e agent steps replay that path with no model.
      </p>
    </section>
    <article class="card" aria-labelledby="env-title">
      <p class="muted">${ENVELOPE.id}</p>
      <h2 id="env-title">${ENVELOPE.title}</h2>
      <p>${statusEl(state)}</p>
      <div class="signers">
        <div class="signer">
          <strong>${SIGNERS[1].name}</strong>
          <span class="muted">${SIGNERS[1].role}</span>
        </div>
        <div class="signer">
          <strong>${SIGNERS[2].name}</strong>
          <span class="muted">${SIGNERS[2].role}</span>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="primary" data-go="/prepare">Open envelope</button>
        <button type="button" class="ghost" data-go="/results">Compare run results</button>
        <button type="button" class="ghost" id="reset-demo">Reset demo</button>
      </div>
    </article>
    <p class="toggle" style="margin-top:1rem">
      <input type="checkbox" id="drift-toggle" ${v === "drift" ? "checked" : ""} />
      <label for="drift-toggle">Simulate UI drift (renamed buttons, moved panel, Completed bug)</label>
    </p>
  `;
  bindGo(root);
  root.querySelector("#reset-demo")?.addEventListener("click", () => {
    resetEnvelope();
    void render();
  });
  root.querySelector("#drift-toggle")?.addEventListener("change", (ev) => {
    const on = (ev.target as HTMLInputElement).checked;
    setVariant(on ? "drift" : "stable");
    location.hash = on ? "#drift" : "";
    void render();
  });
}

async function renderPrepare(root: HTMLElement, state: EnvelopeState): Promise<void> {
  const c = copy();
  root.innerHTML = `
    <div class="desk ${c.panelSide === "left" ? "panel-left" : ""}">
      <section aria-label="Document page">
        <div class="page-wrap" data-testid="pdf-page">
          <canvas id="pdf-canvas"></canvas>
          <div class="drop-layer" id="drop-layer" data-testid="drop-layer"></div>
        </div>
      </section>
      <aside class="panel" data-testid="field-panel" aria-label="${c.fieldPanel}">
        <h2>${c.fieldPanel}</h2>
        <p class="muted">Drag the chip onto the page, or add it at the default mark.</p>
        <ol>
          <li>Place Ada’s signature field</li>
          <li>${c.send}</li>
          <li>Ada types her name, then Bob countersigns</li>
        </ol>
        <div class="actions">
          <button type="button" class="chip" id="field-chip" draggable="true">${c.fieldChip}</button>
          <button type="button" class="ghost" id="add-field">${c.addField}</button>
        </div>
        <div class="actions" style="margin-top:0.8rem">
          <button type="button" class="primary" id="send-btn">${c.send}</button>
        </div>
        <p style="margin-top:0.8rem">${statusEl(state)}</p>
        <p id="prepare-alert" class="muted" role="alert" hidden></p>
      </aside>
    </div>
  `;
  paintFields(root, state);
  wirePrepare(root, state);
  const canvas = root.querySelector<HTMLCanvasElement>("#pdf-canvas");
  if (canvas) {
    try {
      await renderPdfPage(ENVELOPE.file, canvas);
    } catch (err) {
      const layer = root.querySelector("#drop-layer");
      if (layer) {
        layer.insertAdjacentHTML(
          "afterbegin",
          `<p class="muted" style="padding:1rem">Could not render PDF: ${String(err)}</p>`,
        );
      }
    }
  }
}

function nextFieldSigner(state: EnvelopeState): 1 | 2 {
  return state.fields.some((f) => f.signer === 1) ? 2 : 1;
}

function placeField(state: EnvelopeState, x: number, y: number): EnvelopeState {
  const signer = nextFieldSigner(state);
  const field: PlacedField = {
    id: `field-${signer}`,
    signer,
    x,
    y,
    value: "",
  };
  const fields = [...state.fields.filter((f) => f.signer !== signer), field];
  const next = { ...state, fields };
  saveEnvelope(next);
  return next;
}

function paintFields(root: HTMLElement, state: EnvelopeState): void {
  const layer = root.querySelector("#drop-layer");
  if (!layer) return;
  layer.querySelectorAll(".field").forEach((n) => n.remove());
  for (const field of state.fields) {
    const el = document.createElement("div");
    el.className = "field";
    el.setAttribute("data-testid", "signature-field");
    el.dataset.signer = String(field.signer);
    el.style.left = `${field.x * 100}%`;
    el.style.top = `${field.y * 100}%`;
    el.innerHTML = `
      <span class="who">${SIGNERS[field.signer].name}</span>
      <div class="ink">${field.value || "Sign here"}</div>
    `;
    layer.appendChild(el);
  }
}

function wirePrepare(root: HTMLElement, state: EnvelopeState): void {
  const layer = root.querySelector<HTMLElement>("#drop-layer");
  const chip = root.querySelector<HTMLButtonElement>("#field-chip");
  const add = root.querySelector<HTMLButtonElement>("#add-field");
  const send = root.querySelector<HTMLButtonElement>("#send-btn");
  const alert = root.querySelector<HTMLElement>("#prepare-alert");
  let armed = false;

  const dropAt = (clientX: number, clientY: number) => {
    if (!layer) return;
    const box = layer.getBoundingClientRect();
    const x = Math.min(0.88, Math.max(0.12, (clientX - box.left) / box.width));
    const y = Math.min(0.88, Math.max(0.12, (clientY - box.top) / box.height));
    const next = placeField(loadEnvelope(), x, y);
    paintFields(root, next);
    layer.classList.remove("ready");
    armed = false;
  };

  chip?.addEventListener("dragstart", (ev) => {
    ev.dataTransfer?.setData("text/plain", "signature");
    ev.dataTransfer?.setDragImage(chip, 20, 12);
  });
  layer?.addEventListener("dragover", (ev) => {
    ev.preventDefault();
    layer.classList.add("ready");
  });
  layer?.addEventListener("dragleave", () => layer.classList.remove("ready"));
  layer?.addEventListener("drop", (ev) => {
    ev.preventDefault();
    dropAt(ev.clientX, ev.clientY);
  });
  chip?.addEventListener("click", () => {
    armed = true;
    layer?.classList.add("ready");
  });
  layer?.addEventListener("click", (ev) => {
    if (!armed) return;
    dropAt(ev.clientX, ev.clientY);
  });
  add?.addEventListener("click", () => {
    const current = loadEnvelope();
    const signer = nextFieldSigner(current);
    const y = signer === 1 ? 0.46 : 0.63;
    const next = placeField(current, 0.32, y);
    paintFields(root, next);
  });
  send?.addEventListener("click", () => {
    let current = loadEnvelope();
    if (!current.fields.some((f) => f.signer === 1)) {
      if (alert) {
        alert.hidden = false;
        alert.textContent = "Place Ada’s signature field before sending.";
      }
      return;
    }
    if (!current.fields.some((f) => f.signer === 2)) {
      current = placeField(current, 0.32, 0.63);
    }
    current = { ...current, status: "awaiting_signer1" };
    saveEnvelope(current);
    go("/sign/1");
  });
}

function renderSign(root: HTMLElement, state: EnvelopeState, signer: 1 | 2): void {
  const c = copy();
  const who = SIGNERS[signer];
  const verb = signer === 1 ? "Sign" : "Countersign";
  root.innerHTML = `
    <section class="sign-card">
      <p class="muted">${envelopeHeading()}</p>
      <h2>${verb} as ${who.name}</h2>
      <p>${statusEl(state)}</p>
      <label class="field-label" for="sig-input">${c.signatureLabel}</label>
      <input id="sig-input" type="text" autocomplete="off" aria-label="${c.signatureLabel}" value="${state.fields.find((f) => f.signer === signer)?.value ?? ""}" />
      <div class="actions">
        <button type="button" class="primary" id="finish-btn">${c.finish}</button>
        <button type="button" class="ghost" data-go="/envelope">Back to envelope</button>
      </div>
      <p id="sign-alert" class="muted" role="alert" hidden></p>
    </section>
  `;
  bindGo(root);
  root.querySelector("#finish-btn")?.addEventListener("click", () => {
    const input = root.querySelector<HTMLInputElement>("#sig-input");
    const value = input?.value.trim() ?? "";
    const alert = root.querySelector<HTMLElement>("#sign-alert");
    if (!value) {
      if (alert) {
        alert.hidden = false;
        alert.textContent = "Type a signature first.";
      }
      return;
    }
    const current = loadEnvelope();
    const fields = current.fields.map((f) =>
      f.signer === signer ? { ...f, value } : f,
    );
    if (!fields.some((f) => f.signer === signer)) {
      fields.push({ id: `field-${signer}`, signer, x: 0.32, y: signer === 1 ? 0.46 : 0.63, value });
    }
    let status = current.status;
    if (signer === 1) status = "awaiting_signer2";
    if (signer === 2) status = "completed";
    saveEnvelope({ status, fields });
    go("/envelope");
  });
}

function renderEnvelope(root: HTMLElement, state: EnvelopeState): void {
  const shown = statusLabel(state.status, bugOn());
  const done = shown === "Completed";
  const next =
    state.status === "awaiting_signer1"
      ? { href: "/sign/1", label: `Sign as ${SIGNERS[1].name}` }
      : state.status === "awaiting_signer2" || (state.status === "completed" && bugOn())
        ? { href: "/sign/2", label: `Countersign as ${SIGNERS[2].name}` }
        : null;
  root.innerHTML = `
    <article class="card">
      <p class="muted">${ENVELOPE.id}</p>
      <h2>${ENVELOPE.title}</h2>
      <p>${statusEl(state)} ${done ? '<span class="stamp-done">Signed</span>' : ""}</p>
      <ul class="muted">
        <li>${SIGNERS[1].name}: ${state.fields.find((f) => f.signer === 1)?.value || "—"}</li>
        <li>${SIGNERS[2].name}: ${state.fields.find((f) => f.signer === 2)?.value || "—"}</li>
      </ul>
      <div class="actions">
        ${next ? `<button type="button" class="primary" data-go="${next.href}">${next.label}</button>` : ""}
        <button type="button" class="ghost" data-go="/prepare">Back to document</button>
        <button type="button" class="ghost" data-go="/">Home</button>
      </div>
    </article>
  `;
  bindGo(root);
}

function bindGo(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => go(btn.dataset.go ?? "/"));
  });
}

export function boot(): void {
  readVariantFromLocation();
  window.addEventListener("popstate", () => void render());
  window.addEventListener("hashchange", () => void render());
  void render();
}
