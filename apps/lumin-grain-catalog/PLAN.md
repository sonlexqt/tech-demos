# Lumin Grain Catalog

## Source
- Bookmark: none (direct owner request; not an X bookmark)
- Slug: `lumin-grain-catalog`

## Goal (single-user MVP)
A self-contained cinematic dark catalog a reviewer can open in under two minutes: scan a grain-textured Lumin showcase grid, hover cards to reveal meta, and click through a wipe/reveal into a detail view (Sign request, MSA countersign, redaction, Lumin ID, clause search, plus a few sibling studies). Everything is original markup/CSS/JS themed for Lumin — studying motion and typographic rhythm, not mirroring any third-party portfolio.

## Out of scope
- Fetching, scraping, or copying HTML/CSS/JS/fonts/images from any live portfolio (including a24.raviklaassens.com)
- A24 branding, film titles, posters, or third-party assets
- Commercial fonts (PP Neue Montreal, PP Eiko, etc.)
- Auth, multi-user, real Lumin APIs, or production deploy
- Theme toggle (optional; skipped to keep the dark editorial look intact)
- Barba.js or any cloned transition library

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (vanilla DOM, single-page History API)
- Key libraries: none beyond Vite + TypeScript
- Fonts: Google Fonts — Outfit (sans) + Cormorant Garamond (serif), both OFL

## Information architecture
- `/` — catalog hero + cinematic card grid
- `/about` — short note that this is an inspired internal study (not a site mirror)
- `/item/:slug` — detail still + Lumin-flavored copy
- Catalog items (fictional, Lumin-flavored): Sign Request, MSA Countersign, Quiet Redaction, Lumin ID, Clause Search, Markup Chamber, Audit Ribbon, Form Lattice

## Techniques (MVP)
- Near-black canvas, warm paper type, muted teal/gold accents (Lumin-adjacent, not a brand-kit dump)
- Film grain: self-generated canvas noise tile + CSS overlay; paused when `prefers-reduced-motion`
- Card hover: caption reveal + restrained scale (disabled under reduced motion)
- Page change: original shutter/wipe written in CSS + a few dozen lines of TS; View Transitions API used only as a progressive enhancement
- Geometric SVG stills (gradients + shapes) — no scraped imagery

## Manual testing / README
`apps/lumin-grain-catalog/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- What to click / try (hover grid, open an item, return, open About, reduced-motion)
- No WebMCP / Agent panel (not relevant)
- Pass/fail checklist for grain visibility, wipe, hover, and reduced-motion

## Acceptance criteria
- [ ] `cd apps/lumin-grain-catalog && bun install && bun run dev` works
- [ ] `apps/lumin-grain-catalog/README.md` is present with run steps and a manual test checklist
- [ ] `apps/lumin-grain-catalog/HOW_IT_WORKS.md` explains grain, transitions, layout rhythm, reduced-motion, with a diagram
- [ ] Demo PR includes at least one screenshot of the running app
- [ ] Demo PR includes at least one video of the running app (grain + a transition + grid hover)
- [ ] Look is a dark cinematic catalog without cloning a specific third-party site’s markup/CSS
- [ ] All content is Lumin-themed and original; no A24/Ravi assets or commercial fonts
- [ ] `prefers-reduced-motion` disables grain animation, wipes, and hover motion

## Validation (PR)
- Screenshot: catalog hero + grain + card grid on the dark canvas
- Video: open app → notice grain → hover a card → click through a wipe into a detail → return
- README: run steps + manual test notes matching the checklist above
- PR body: state this is an inspired Lumin-themed rebuild, not a site mirror
