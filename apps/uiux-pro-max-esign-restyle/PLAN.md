# UI/UX Pro Max · Lumin Sign review-and-sign restyle

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (item #3, Top 10 OpenCode Skill Repos)
- Upstream: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT)
- Slug: `uiux-pro-max-esign-restyle`

## Goal (single-user MVP)
In under two minutes a reviewer compares the same Lumin Sign MSA **countersign / review-and-sign** page twice, side by side. The left pane is a deliberately generic AI-slop treatment (purple-pink gradients, emoji icons, hidden consent, no audit trail). The right pane is restyled from a committed UI/UX Pro Max `MASTER.md` generated for **e-signature / legal SaaS**. A third panel prints that design system (page pattern, palette, fonts, industry-filtered anti-patterns such as “no AI purple/pink gradients” for legal/finance) and a **checklist audit**: toggling each pre-delivery rule makes the restyled page pass or fail that rule in place.

## Out of scope
- Live Python search against a vendored copy of the full catalog at runtime
- Calling production Lumin Sign / identity APIs
- Real PDF rendering, certificate-grade signatures, or persistence
- Multi-user auth, deploy, or WebMCP / in-page LLM agent
- Committing API keys (the optional generator script is offline/docs-only)

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript + vanilla DOM (no React)
- Key libraries: none beyond Vite/TypeScript
- Fixture: `design-system/lumin-sign/MASTER.md` from the skill’s `search.py --design-system --persist` (query: e-signature / legal SaaS). Offline `bun install && bun run dev` reads this file; no network required except optional Google Fonts.
- Optional: `scripts/generate-design-system.sh` clones the skill (or uses `UIUX_PRO_MAX_SKILL_DIR`) and re-runs the Python generator. Search is stdlib-only; do not commit keys.

## Manual testing / README
What `apps/uiux-pro-max-esign-restyle/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open `http://localhost:5173/`
- What to click: compare left vs right, read the design-system panel, toggle checklist rules, type a signature and countersign on the restyled page, flip breakpoint chips (375 / 768 / 1024 / 1440)
- No WebMCP flags; Agent panel N/A
- Pass/fail checklist for slop vs restyle contrast, panel contents, checklist audit, and offline fixture

## Acceptance criteria
- [ ] `cd apps/uiux-pro-max-esign-restyle && bun install && bun run dev` works
- [ ] `apps/uiux-pro-max-esign-restyle/README.md` has run steps and a manual test checklist
- [ ] `apps/uiux-pro-max-esign-restyle/HOW_IT_WORKS.md` explains catalog → design system → restyle, plus a mermaid diagram and the checklist audit
- [ ] `apps/uiux-pro-max-esign-restyle/PLAN.md` is present
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] Same MSA countersign page is shown twice (generic slop | skill restyle)
- [ ] Panel shows pattern, palette, fonts, and filtered anti-patterns (including legal/finance “no purple gradients”)
- [ ] Checklist toggles visibly pass/fail the restyled page
- [ ] `MASTER.md` is committed so the demo runs offline
- [ ] Optional generator script is documented and never requires committed secrets
- [ ] Tracking entry `2104895659157684597-uiux-pro-max` is added under both `proposed` and `built` without wiping existing arrays

## Validation (PR)
- Screenshot: Full three-pane layout (slop | restyle | design system + checklist), restyle showing navy/green legal treatment and a visible audit trail
- Video: Open app → pan slop vs restyle → toggle several checklist rules (contrast, focus, emoji icons, purple-gradient anti-pattern) → type a signature and countersign → flip a breakpoint chip
- README: Confirm run steps + manual test notes match the checklist above
