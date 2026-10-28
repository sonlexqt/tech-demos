# Lumin Grain Catalog

Self-contained **inspired-from-scratch** demo: a cinematic dark catalog themed for Lumin (PDF editing, Lumin Sign, Lumin ID). Built to study grain, type contrast, card hover reveals, and page wipes — not to mirror any third-party portfolio.

No A24 branding, no film posters, no scraped assets. Stills are original SVG geometry. Fonts are Outfit + Cormorant Garamond (Google Fonts, OFL).

## Run

```bash
cd apps/lumin-grain-catalog
bun install
bun run dev
```

Open the Vite URL (default `http://localhost:5173/`).

## What to try

1. **Catalog** — large “Lumin” display title, index strip, 8-card grid.
2. **Grain** — a faint film-grain overlay on the near-black canvas. It should feel like texture, not dirt.
3. **Hover a card** — the still eases slightly and a caption (title + dek) reveals from the bottom.
4. **Open a study** — click **Sign Request**, **MSA Countersign**, **Quiet Redaction**, **Lumin ID**, or **Clause Search** (or the three sibling cards). A shutter wipe covers, then reveals the detail.
5. **Return / About** — use **Return to catalog**, the wordmark, or **About** (notes that this is an original internal study).
6. **Reduced motion** — in OS/browser, enable “reduce motion”. Grain should sit still, wipes should skip, card captions should stay visible without the lift/scale.

This demo has no WebMCP tools and no Agent panel.

## Manual test checklist

- [ ] `bun install && bun run dev` serves the catalog at `http://localhost:5173/`
- [ ] Hero + eight Lumin-flavored cards render (no film titles, no third-party posters)
- [ ] Film grain is visible on the dark background
- [ ] Card hover (or keyboard focus) reveals title/dek
- [ ] Clicking a card plays a top/bottom shutter wipe, then shows the detail still + copy
- [ ] About page explains this is an inspired rebuild, not a site mirror
- [ ] Deep links work: `/item/lumin-id`, `/about`
- [ ] `prefers-reduced-motion: reduce` removes wipe + hover motion and stills the grain
- [ ] Layout holds on a narrow viewport (single-column grid)

## Build (optional)

```bash
bun run build
bun run preview
```
