# Fixture provenance

This folder is a **committed output** of the UI/UX Pro Max design-system generator so `bun install && bun run dev` works offline.

- Skill: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT)
- Recorded skill version at generation: `2.13.0` (`skill.json`)
- Command (also wrapped by `scripts/generate-design-system.sh`):

```bash
python3 src/ui-ux-pro-max/scripts/search.py \
  "e-signature legal SaaS contract signing review and sign" \
  --design-system -f markdown -p "Lumin Sign" \
  --persist --force --output-dir <app-root>
```

`search.py` is Python stdlib only and reads the skill’s local CSV catalog. It does **not** need `GOOGLE_FONTS_API_KEY`. That key is used only by the upstream catalog-refresh workflow — never commit it.

`industry-filters.json` excerpts adjacent **Legal Services** and **Banking/Traditional Finance** anti-patterns (including “AI purple/pink gradients”) so the demo can show industry filtering next to the e-sign `MASTER.md` row.
