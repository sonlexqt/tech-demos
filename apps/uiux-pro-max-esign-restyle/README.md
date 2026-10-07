# UI/UX Pro Max · Lumin Sign restyle

Side-by-side demo of [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): the same Lumin Sign **MSA countersign / review-and-sign** page, once as generic AI slop and once restyled from a committed design-system fixture.

There is no WebMCP flag and no in-page Agent panel. The right-hand column *is* the skill output: pattern, palette, fonts, filtered anti-patterns, and a live checklist audit.

## Run

```bash
cd apps/uiux-pro-max-esign-restyle
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/). Vite serves the app. `design-system/lumin-sign/MASTER.md` is imported at build time, so the demo works offline (Google Fonts are optional; Georgia / system-ui are the fallbacks).

## What to click / try

1. Compare the **left** page (purple-pink gradients, emoji chrome, blurred contract, hidden consent, no audit trail) with the **right** page (navy + signature green, EB Garamond / Lato, stepper, document preview, explicit consent, audit trail).
2. Read the **Design system** panel: Enterprise Gateway pattern, palette swatches, font pairing, and anti-patterns filtered for e-sign plus legal/finance (including “AI purple/pink gradients”).
3. In **Checklist audit**, turn individual rules off. The restyled page should fail that rule in place (emoji icons, washed-out contrast, missing focus rings, purple wash, clipped 375 layout, and so on). **Pass all** restores the fixture.
4. Tab through the restyle with a rule on vs off to confirm focus rings.
5. Click **Click to sign**, type a name, apply it, check consent, then **Countersign MSA**. The audit trail should gain a countersign row.
6. Use the **375 / 768 / 1024 / 1440** chips. With the responsive rule on, the page scales; with it off, the inner layout stays wide and clips.

Optional regenerate (not required to run the demo):

```bash
bun run generate:design-system
# or: UIUX_PRO_MAX_SKILL_DIR=/path/to/ui-ux-pro-max-skill bun run generate:design-system
```

`search.py` is Python stdlib only. Do **not** commit `GOOGLE_FONTS_API_KEY` — that secret is only for the upstream catalog-refresh workflow. See `.env.example` and `design-system/lumin-sign/QUERY.md`.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Left page is obviously generic AI slop (gradients, emoji, hidden consent)
- [ ] Right page is the same MSA countersign flow with navy/green legal treatment and a visible audit trail
- [ ] Panel lists pattern, palette, fonts, and filtered anti-patterns (purple gradients called out for legal/finance)
- [ ] Toggling **Light mode text contrast** washes out the restyle; toggling it back restores contrast
- [ ] Toggling **Visible keyboard focus** removes rings; Tab shows rings when the rule is on
- [ ] Toggling **No emojis used as icons** swaps SVGs for emoji
- [ ] Toggling **No AI purple/pink gradients** paints the restyle with the slop palette
- [ ] Breakpoint chips resize the restyle frame (375 through 1440)
- [ ] Signature + consent + **Countersign MSA** updates the audit trail
- [ ] Slop **Start the magic** signs without consent and does not write an audit row
- [ ] Demo still renders if Google Fonts are blocked (system fallbacks)

## Notes for reviewers

- Concepts and the catalog → design system → restyle diagram: [HOW_IT_WORKS.md](./HOW_IT_WORKS.md)
- Plan: [PLAN.md](./PLAN.md)
- Source bookmark: [item #3 of Top 10 OpenCode Skill Repos](https://x.com/neerajjj6785/status/2104895659157684597)
- This is a visual restyle of a **mock** Lumin Sign ceremony. No production signing APIs.
