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

async function render(): Promise<void> {
  const view = document.getElementById("view");
  if (!view) return;
  const path = route();
  for (const a of document.querySelectorAll<HTMLAnchorElement>(".tabs a")) {
    a.classList.toggle("active", a.dataset.route === path);
  }
  view.innerHTML = `<p class="muted">Loading…</p>`;
  try {
    if (path === "/pad") await renderPad(view);
    else if (path === "/blind") await renderBlind(view);
    else if (path === "/forensics") await renderForensics(view);
    else if (path === "/notes") await renderNotes(view);
    else renderBrief(view);
  } catch (err) {
    view.innerHTML = `<p class="bad">${String(err)}</p>`;
  }
}

window.addEventListener("hashchange", () => void render());
void render();
