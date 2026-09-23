# json-render e-sign ops board

Lumin-style **signature-request ops board**. You type a natural-language prompt; the UI that streams in is a **json-render Spec** constrained to a typed catalog — not free-form HTML.

## What json-render is doing here

- **`defineCatalog`** (`@json-render/core` + `@json-render/react/schema`) declares the only components and actions the generator may emit.
- Custom e-sign types are the star: `RequestCard`, `SignerChip`, `StatusBadge`, `RemindButton`.
- A few layout primitives come from **`@json-render/shadcn`**: `Stack`, `Heading`, `Card`, `Button`, `Text`.
- **`defineRegistry`** maps those names to React implementations. `RemindButton` emits `press`; the catalog action `remind_signer` writes an in-page log (no email).
- **Default / offline:** SpecStream (`createSpecStreamCompiler` + RFC 6902 JSONL patches) applies a fixture or keyword mock so the board paints progressively. **No API key required.**
- **Optional live Jev:** when a server key is present, Vite middleware runs json-render’s experimental composer (`experimental_composeSpec` + `experimental_createEvaluator` with model `typesafe-ai/jev`) against the same e-sign catalog and atomic candidates. Jev only *selects and places* prepared elements — it cannot invent HTML or extra component types.
- `catalog.validate` checks the finished Spec against the catalog.

The prompt bar shows a badge: **Fixture SpecStream** (default) or **Live Jev**.

## Run

```bash
cd apps/json-render-esign-board
bun install
bun run dev
```

Open the Vite URL (default `http://localhost:5173/`).

## Manual test

1. Load the page. Confirm the catalog pills (`RequestCard`, `SignerChip`, `StatusBadge`, `RemindButton`, plus shadcn layout types), the 10-row seed ledger, and the **Fixture SpecStream** badge (unless you set a Jev key).
2. Click **Overdue counsel** (or paste `Show overdue external-counsel requests needing a remind`) and **Generate / stream**. Request cards should appear progressively. SpecStream patch counts increment on the fixture path.
3. Click **APAC countersign**, then **Declined → re-sent**. Each board should stay on catalog types only.
4. Click a gold **Remind** control. A toast and the Action log should record `remind_signer` for that request id. Nothing is emailed.
5. Expand **Spec JSON peek**. Every `type` should be a catalog name. `catalog.validate: success` should show. There is no raw HTML string in the Spec.
6. Optional: type a looser prompt such as `void` or `EMEA counsel`. The local mock still emits only catalog components.

## Optional live Jev (TypeSafe)

`bun run dev` never needs secrets. This environment records evidence on the fixture path.

To flip to live composition locally (do **not** commit the key, do **not** use a `VITE_` prefix):

```bash
# apps/json-render-esign-board/.env.local  — gitignored
JEV_API_KEY=your-typesafe-jev-or-ai-gateway-key
```

Accepted aliases (same server resolver, matching [json-render Jev docs](https://json-render.dev/docs/jev) / playground):

- `JEV_AI_GATEWAY_API_KEY`
- `AI_GATEWAY_API_KEY`

Restart `bun run dev`. The badge should read **Live Jev**. Generate then streams `experimental_composeSpec` snapshots from `/api/compose` (server-only evaluator, model `typesafe-ai/jev`). The key stays on the Vite server and is never sent to the browser.

See `.env.example` for the blank template.
