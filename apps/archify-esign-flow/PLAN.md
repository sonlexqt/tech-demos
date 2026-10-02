# Archify e-sign flow explorer (Lumin Sign)

## Source
- Bookmark: https://x.com/neerajjj6785/status/2104895659157684597 (#9 Archify)
- Upstream: https://github.com/tt-a1i/archify (MIT, ~75.9k★)
- Slug: `archify-esign-flow`
- Tracking id: `2104895659157684597-archify` (same source post as Graphify #4; distinct pick)

## Goal (single-user MVP)
A reviewer opens a Lumin Sign **MSA countersign / signature-request** explorer driven by **fixture Archify-shaped typed JSON IR**. They switch **workflow** vs **sequence**, click nodes for **node cards**, highlight authored paths, and run **path-probe** between two endpoints (fail-closed: only authored directed edges). Canned scenarios play **send → view → sign order → complete** and **decline → recover**. Offline: `bun install && bun run dev`, no API keys. README points at real Archify for agent generation.

Distinct from Graphify (`apps/graphify-contract-kg/`): this is **diagrams + path-probe + typed JSON IR**, not a knowledge graph of contract entities.

## Out of scope
- Shipping or invoking the real Archify CLI / skill (`finalize`, `deliver`, browser-check)
- Agent generation of new IR at runtime
- Architecture / dataflow / lifecycle renderers (IR mentions them; explorer is workflow + sequence)
- Live e-sign APIs, auth, persistence, legal execution
- Mermaid compile path, PNG/WebM export, Share Cards
- WebMCP / in-page LLM agent
- Deploy / shared monorepo packages

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (vanilla DOM, custom SVG viewer)
- Key libraries: none at runtime (fixtures + deterministic path-probe)

## Manual testing / README
What `apps/archify-esign-flow/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) with **no API keys**
- Link to tt-a1i/archify and to `HOW_IT_WORKS.md` (IR vs Mermaid-only vs Graphify KG)
- What to click: diagram toggle, canned scenarios (complete / decline recovery), node cards, path-probe (including a no-route case)
- No WebMCP flag; Agent panel N/A
- Pass/fail checklist for IR load, highlights, probe fail-closed, both scenarios

## Acceptance criteria
- [ ] `cd apps/archify-esign-flow && bun install && bun run dev` works offline
- [ ] `apps/archify-esign-flow/README.md` present with run steps + manual test checklist
- [ ] `apps/archify-esign-flow/HOW_IT_WORKS.md` explains Archify concepts, diagrams vs Mermaid-only, vs Graphify
- [ ] Fixture workflow + sequence JSON IR (Archify-shaped: schema_version, diagram_type, meta, structural arrays)
- [ ] Self-contained viewer: path highlight, node cards, path-probe on authored edges only
- [ ] Canned scenarios: complete countersign and decline recovery
- [ ] Fixture / offline badge visible; no API keys
- [ ] Demo PR includes at least one screenshot and one video of the running app
- [ ] `tracking/seen-bookmarks.json` records id `2104895659157684597-archify` in proposed + built (merge, do not wipe)

## Validation (PR)
- Screenshot: Workflow canvas with Fixture IR badge, a highlighted complete path, node card or probe hops visible
- Video: Play complete scenario → switch to sequence → play decline recovery → path-probe a happy route and a no-route miss
- README: Run steps + manual test notes match the checklist above
