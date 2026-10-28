const COVER_MS = 420;
const REVEAL_MS = 520;

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function shutter(): HTMLElement | null {
  return document.querySelector("[data-shutter]");
}

export async function playWipe(swap: () => void): Promise<void> {
  const el = shutter();

  if (!el || prefersReducedMotion()) {
    swap();
    window.scrollTo(0, 0);
    return;
  }

  el.classList.remove("is-revealing");
  el.classList.add("is-covering");
  await wait(COVER_MS);
  swap();
  window.scrollTo(0, 0);
  el.classList.remove("is-covering");
  el.classList.add("is-revealing");
  await wait(REVEAL_MS);
  el.classList.remove("is-revealing");
}
