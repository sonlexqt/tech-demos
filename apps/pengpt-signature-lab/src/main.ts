import "./style.css";
import { renderBrief } from "./views/brief";
import { renderBlind } from "./views/blind";
import { renderForensics } from "./views/forensics";
import { renderNotes } from "./views/notes";
import { renderPad } from "./views/pad";

function route(): string {
  const h = location.hash.replace(/^#/, "") || "/";
  return h.startsWith("/") ? h : `/${h}`;
}

let nav = 0;

async function render(): Promise<void> {
  const view = document.getElementById("view");
  if (!view) return;
  const path = route();
  const my = ++nav;
  for (const a of document.querySelectorAll<HTMLAnchorElement>(".tabs a")) {
    a.classList.toggle("active", a.dataset.route === path);
  }
  view.innerHTML = `<p class="muted">Loading…</p>`;
  const host = document.createElement("div");
  try {
    if (path === "/pad") await renderPad(host);
    else if (path === "/blind") await renderBlind(host);
    else if (path === "/forensics") await renderForensics(host);
    else if (path === "/notes") await renderNotes(host);
    else renderBrief(host);
    if (my !== nav) return;
    view.replaceChildren(...Array.from(host.childNodes));
  } catch (err) {
    if (my !== nav) return;
    const p = document.createElement("p");
    p.className = "bad";
    p.textContent = String(err);
    view.replaceChildren(p);
  }
}

window.addEventListener("hashchange", () => void render());
void render();
