# Understand Anything — Lumin Sign codebase explorer

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (item #7)
- Upstream: https://github.com/Egonex-AI/Understand-Anything (MIT)
- Slug: `understand-anything-esign-codebase`

## Goal (single-user MVP)
In under two minutes a reviewer can explore a **committed Lumin Sign e-sign codebase knowledge graph** (files / modules / functions / edges), step a **guided tour** through create-request → signer order → field prep → reminders → webhooks → audit, **search + explain** a selected node, and pick a **sample change** to see `/understand-diff`-style blast radius (affected nodes + tests). Offline fixture, no API keys.

This is a **code** knowledge graph. It is not Graphify (contract/docs KG in `apps/graphify-contract-kg`).

## Out of scope
- Running the real multi-agent `/understand` pipeline or any LLM
- Live git-diff overlay against this monorepo
- Domain graph (`/understand-domain`) and wiki graph (`/understand-knowledge`)
- Persona-adaptive layouts, embeddings, Figma mode
- Auth, deploy, WebMCP / in-page Agent panel

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (no SPA framework)
- Key libraries: Vite + TypeScript only — SVG graph, committed `.ua`-shaped JSON

## Manual testing / README
What `apps/understand-anything-esign-codebase/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`)
- Open `http://localhost:5173/`
- What to click: pan/zoom the graph, click a node, run search chips, step the tour, pick a sample diff
- No WebMCP flags; Agent panel N/A
- How to regenerate with the real plugin (optional; not required to run the demo)
- Pass/fail checklist for graph, tour, explain, and diff-impact

## Acceptance criteria
- [ ] `cd apps/understand-anything-esign-codebase && bun install && bun run dev` works
- [ ] `apps/understand-anything-esign-codebase/README.md` has run steps and a manual test checklist
- [ ] `apps/understand-anything-esign-codebase/HOW_IT_WORKS.md` covers pipeline → graph → tour/explain/diff-impact (mermaid) and how the demo maps
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] Committed fixture mini Lumin Sign codebase (create request, signer routing/order, field prep, reminders, webhooks, audit)
- [ ] Committed graph in Understand-Anything `knowledge-graph.json` shape (`version`, `project`, `nodes`, `edges`, `layers`, `tour`)
- [ ] Interactive graph: click node, see neighbors/edges, layer colors
- [ ] Guided tour walks authored `tour[]` steps and highlights those nodes
- [ ] Search finds nodes by name/summary/tags; Explain panel shows summary, edges, source
- [ ] Diff-impact: pick a sample change → changed + 1-hop affected nodes + tests + layers
- [ ] No API keys required
- [ ] Tracking id `2104895659157684597-understand-anything` added under `proposed` and `built` without wiping existing rows

## Validation (PR)
- Screenshot: graph with a selected node, Explain open, Fixture badge visible
- Video: explore graph → search/explain → tour steps → pick a sample diff and show blast radius
- README: run steps + manual test notes match the checklist above
