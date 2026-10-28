const TILE = 180;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function makeNoiseDataUrl(): string {
  const canvas = document.createElement("canvas");
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) return "";

  const image = ctx.createImageData(TILE, TILE);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() > 0.5 ? 20 + Math.random() * 60 : 180 + Math.random() * 75;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export function mountGrain(root: HTMLElement): () => void {
  const tile = makeNoiseDataUrl();
  if (tile) {
    root.style.setProperty("--grain-tile", `url("${tile}")`);
  }

  if (prefersReducedMotion()) {
    root.classList.add("grain--still");
    return () => undefined;
  }

  root.classList.add("grain--live");
  let frame = 0;
  let raf = 0;

  const tick = () => {
    frame += 1;
    if (frame % 3 === 0) {
      const x = (frame * 0.37) % TILE;
      const y = (frame * 0.21) % TILE;
      root.style.backgroundPosition = `${x}px ${y}px`;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = () => {
    if (media.matches) {
      cancelAnimationFrame(raf);
      root.classList.remove("grain--live");
      root.classList.add("grain--still");
    }
  };
  media.addEventListener("change", onChange);

  return () => {
    cancelAnimationFrame(raf);
    media.removeEventListener("change", onChange);
  };
}
