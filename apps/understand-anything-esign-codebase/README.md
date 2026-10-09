# Lumin Sign · Understand Anything

Interactive **code** knowledge graph for a committed mini [Lumin Sign](https://www.luminpdf.com/) e-sign codebase, in the shape of [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything) (`.ua/knowledge-graph.json`).

This is **not** Graphify. Graphify (`apps/graphify-contract-kg`) is a contract/docs KG. This demo is files / modules / functions / `tested_by` edges you can tour, search, explain, and diff-impact.

No API keys. Offline fixture graph.

Concept note: [HOW_IT_WORKS.md](./HOW_IT_WORKS.md).

## Run

```bash
cd apps/understand-anything-esign-codebase
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

There is no WebMCP flag and no in-page Agent panel. The right-hand Explain / Diff panels stand in for `/understand-explain` and `/understand-diff`.

## What to click / try

1. Confirm the **Fixture graph** badge and the `/understand*` command chips in the header.
2. **Graph:** drag to pan, wheel to zoom, click `createSignatureRequest` (preselected) — neighbors stay bright, Explain shows summary, edges, and a source snippet.
3. **Search:** click **which parts handle reminders?** (or type `audit`, `signer order`, `webhooks`). Results should jump the graph and Explain panel.
4. **Tour:** click step 1 through 9 (or use Previous / Next on the canvas banner). Each step highlights its `tour[].nodeIds`.
5. **Diff-impact:** pick **Slow reminder cadence to day 2 / 5 / 10**. Changed nodes go rose, 1-hop affected go amber, and the panel lists tests (`tests/reminders.test.ts`) plus layers.
6. Try the other two sample changes (signer order, webhook payload).

Optional regenerate (not required to run the demo):

```bash
bun run generate:graph
```

That walks `fixture-codebase/` with a local extract + authored summaries. To use the **real** plugin instead:

```bash
# install https://github.com/Egonex-AI/Understand-Anything
/plugin marketplace add Egonex-AI/Understand-Anything
/plugin install understand-anything
# with fixture-codebase/ as the project root
/understand
```

Copy `.ua/knowledge-graph.json` over `public/ua/knowledge-graph.json`. The real pipeline needs an LLM; this demo does not.

## Manual test checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Header shows **Fixture graph** (no API key prompt)
- [ ] Graph renders layer columns API / Service / Data / Utility / Test
- [ ] Clicking a node updates Explain (type, layer, summary, edges, source when the file is in `fixture-codebase/`)
- [ ] Search chip **which parts handle reminders?** selects a reminders node
- [ ] Tour steps 1–9 highlight different node sets; banner Previous / Next works
- [ ] Diff **Slow reminder cadence…** marks `src/reminders/scheduler.ts` changed and lists `tests/reminders.test.ts`
- [ ] Signer-order and webhook-payload diffs change the overlay
- [ ] No WebMCP / Agent panel is required

`bun test` covers graph integrity plus search / explain / reminder impact (optional for reviewers).
