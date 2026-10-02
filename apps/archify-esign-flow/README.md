# Archify e-sign flow (Lumin Sign)

Lumin Sign–flavored **MSA countersign / signature-request** explorer for [tt-a1i/archify](https://github.com/tt-a1i/archify) (MIT): an agent skill that turns a description or repo into **verifiable architecture / workflow / sequence / data-flow / lifecycle diagrams** as self-contained interactive HTML.

This app ships **fixture typed JSON IR** (workflow + sequence) and a **self-contained viewer** with path highlight, node cards, and **path-probe**. The happy path is offline: `bun install && bun run dev` needs **no API keys** and does **not** run the Archify CLI.

To generate new diagrams from a real repo or prompt, use upstream Archify (`npx skills add tt-a1i/archify -g`, then ask an agent to *use archify*). This demo only **explores** a frozen IR.

Concepts, diagrams vs Mermaid-only, and vs Graphify KG: **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)**.

## Run

```bash
cd apps/archify-esign-flow
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

No WebMCP flag. There is no in-page LLM Agent panel.

## What you should see

- Header: Lumin Sign · MSA countersign explorer, envelope id, **Fixture IR · offline** badge, **IR valid** after the JSON loads.
- Diagram toggle: **Workflow** (lanes / columns / mainPath) and **Sequence** (participants / messages / activations).
- Canned scenarios: **Send → view → sign order → complete** and **Decline → recover**.
- Path-probe: two endpoints, hop list or a fail-closed miss.
- Node card: typed IR facts + authored upstream / downstream.
- Drawer: the fixture JSON IR.

## What to click / try

1. Leave **Workflow** selected. The complete countersign `mainPath` should already be highlighted.
2. Click **Play scenario**. The story bar walks draft → fields → send → Acme view/sign → unlock Vendor → countersign → complete. The node card updates each step.
3. Click **Acme views** (or any node). The card shows `type`, lane, tag, and incident edges.
4. Under Path-probe, click **send → complete**. Expect a hop list along the authored happy path.
5. Click **signVendor → draft (miss)**. Expect **No authored route** — geometry is not a path.
6. Switch to **Decline → recover** and **Play scenario**. Decline does not invent a hop to Vendor; revise returns to fields.
7. Probe **decline → complete**. Recovery is authored, so the route exists.
8. Switch to **Sequence**. Play both scenarios. Messages and participants highlight instead of workflow nodes.
9. Sequence probe: **sender → vendor** succeeds via the API; **store → acme** misses (audit store has no outbound messages).
10. Open **Show fixture JSON IR** and confirm `schema_version`, `diagram_type`, and structural arrays.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/` with no API keys
- [ ] Fixture IR badge stays visible; validate badge reads **IR valid**
- [ ] Workflow canvas shows lanes (Sender, Signature request, Acme, Vendor, Decline & recover) and phase bands
- [ ] Play **complete** walks send → view → sign order → complete
- [ ] Play **decline** walks view → decline → revise → fields
- [ ] Clicking a node fills the node card (id, type, upstream/downstream)
- [ ] Path-probe **send → complete** lists authored hops
- [ ] Path-probe **signVendor → draft** fails closed
- [ ] Path-probe **decline → complete** succeeds via revise → fields
- [ ] Sequence toggle renders participants and timed messages; play still works
- [ ] Sequence probe **store → acme** fails closed
- [ ] IR drawer shows both JSON fixtures
- [ ] No WebMCP / Agent panel is required

## Notes for reviewers

- Distinct from `apps/graphify-contract-kg/` (same X post, pick #4): Graphify is a **knowledge graph** of contract entities. This demo is **diagrams + path-probe + typed JSON IR**.
- Tracking id: `2104895659157684597-archify`.
- The viewer is a demo renderer. Real Archify `finalize` / `deliver` / browser-check is not shipped.
- Not a live e-sign product and not legal advice. The MSA packet is a fixture story.
