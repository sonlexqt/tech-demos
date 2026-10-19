import type { VideoProject } from "./scenes";

type GsapTimeline = {
  duration: () => number;
  pause: () => void;
  seek: (t: number, suppressEvents?: boolean) => void;
};

type HfWindow = Window & {
  gsap?: { timeline: (opts: { paused: boolean }) => GsapTimeline };
  __timelines?: Record<string, GsapTimeline>;
};

function applyClipVisibility(root: Element, localT: number): void {
  root.querySelectorAll<HTMLElement>("[data-start][data-duration]").forEach((el) => {
    if (el.id === "root" || el.hasAttribute("data-composition-src")) return;
    const start = Number(el.dataset.start);
    const dur = Number(el.dataset.duration);
    if (!Number.isFinite(start) || !Number.isFinite(dur)) return;
    const on = localT + 1e-6 >= start && localT < start + dur;
    el.style.visibility = on ? "visible" : "hidden";
  });
}

async function mountSubComps(iframe: HTMLIFrameElement, baseUrl: string): Promise<void> {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow as HfWindow | null;
  if (!doc || !win) throw new Error("preview iframe has no document");

  const hosts = [...doc.querySelectorAll<HTMLElement>("[data-composition-src]")];
  for (const host of hosts) {
    const src = host.getAttribute("data-composition-src");
    if (!src) continue;
    const url = new URL(src, baseUrl).href;
    const html = await fetch(url).then((r) => {
      if (!r.ok) throw new Error(`failed to load ${url}`);
      return r.text();
    });
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const template = parsed.querySelector("template") ?? parsed.body;
    const frag = template instanceof HTMLTemplateElement ? template.content.cloneNode(true) : template.cloneNode(true);
    host.replaceChildren();
    host.appendChild(frag);

    host.querySelectorAll("script").forEach((old) => {
      const script = doc.createElement("script");
      if (old.src) script.src = old.src;
      else script.textContent = `(function(){\n${old.textContent ?? ""}\n})();`;
      old.replaceWith(script);
    });
  }

  const ids = hosts
    .map((h) => h.getAttribute("data-composition-id"))
    .filter((id): id is string => Boolean(id));
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const tls = win.__timelines ?? {};
    if (ids.every((id) => tls[id])) break;
    await new Promise((r) => setTimeout(r, 20));
  }
}

export async function loadPreview(iframe: HTMLIFrameElement, project: VideoProject): Promise<() => void> {
  const indexUrl = new URL(project.indexUrl, window.location.origin).href;
  const html = await fetch(indexUrl).then((r) => {
    if (!r.ok) throw new Error(`failed to load ${indexUrl}`);
    return r.text();
  });
  const patched = html
    .replace(
      /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^"]+"><\/script>/,
      `<script src="/vendor/gsap.min.js"><\/script>`,
    )
    .replace(
      /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^"]+" integrity="[^"]+" crossorigin="anonymous"><\/script>/,
      `<script src="/vendor/gsap.min.js"><\/script>`,
    )
    .replace("<head>", `<head><base href="${indexUrl}">`);

  iframe.srcdoc = patched;
  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error("preview iframe failed"));
  });
  await mountSubComps(iframe, indexUrl);
  const parent = iframe.parentElement;
  const fit = () => {
    if (!parent) return;
    const w = parent.clientWidth || project.width;
    iframe.style.width = `${project.width}px`;
    iframe.style.height = `${project.height}px`;
    iframe.style.transform = `scale(${w / project.width})`;
  };
  fit();
  const ro = parent ? new ResizeObserver(fit) : null;
  if (parent && ro) ro.observe(parent);
  return () => {
    ro?.disconnect();
    iframe.srcdoc = "";
  };
}

export function seekPreview(iframe: HTMLIFrameElement, project: VideoProject, time: number): void {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow as HfWindow | null;
  if (!doc || !win?.__timelines) return;
  const t = Math.min(Math.max(0, time), project.duration);

  doc.querySelectorAll<HTMLElement>("[data-composition-src]").forEach((host) => {
    const start = Number(host.dataset.start);
    const dur = Number(host.dataset.duration);
    const on = t + 1e-6 >= start && t < start + dur;
    host.style.visibility = on ? "visible" : "hidden";
    const id = host.getAttribute("data-composition-id");
    const tl = id ? win.__timelines?.[id] : undefined;
    if (on && tl) {
      const local = Math.max(0, t - start);
      tl.pause();
      tl.seek(local, false);
      const innerRoot = host.querySelector("#root") ?? host;
      applyClipVisibility(innerRoot, local);
    }
  });

  const main = win.__timelines?.main;
  if (main) {
    main.pause();
    main.seek(t, false);
  }
}
