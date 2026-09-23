# json-render e-sign ops board

Lumin-style **signature-request ops board**. You type a natural-language prompt; the UI that streams in is a **json-render Spec** constrained to a typed catalog — not free-form HTML.

## What json-render is doing here

- **`defineCatalog`** (`@json-render/core` + `@json-render/react/schema`) declares the only components and actions the generator may emit.
- Custom e-sign types are the star: `RequestCard`, `SignerChip`, `StatusBadge`, `RemindButton`.
- A few layout primitives come from **`@json-render/shadcn`**: `Stack`, `Heading`, `Card`, `Button`, `Text`.
- **`defineRegistry`** maps those names to React implementations. `RemindButton` emits `press`; the catalog action `remind_signer` writes an in-page log (no email).
- **SpecStream** (`createSpecStreamCompiler` + RFC 6902 JSONL patches via `diffToPatches`) applies the Spec progressively so the board paints as patches arrive.
- `catalog.validate` checks the finished Spec against the catalog.

Default path is **offline**: preset fixtures plus a keyword mock over 10 seed rows. No API key required.

## Run

```bash
cd apps/json-render-esign-board
bun install
bun run dev
```

Open the Vite URL (default `http://localhost:5173/`).

## Manual test

1. Load the page. Confirm the catalog pills (`RequestCard`, `SignerChip`, `StatusBadge`, `RemindButton`, plus shadcn layout types) and the 10-row seed ledger.
2. Click **Overdue counsel** (or paste `Show overdue external-counsel requests needing a remind`) and **Generate / stream**. Request cards should appear progressively. SpecStream patch counts increment.
3. Click **APAC countersign**, then **Declined → re-sent**. Each board should stay on catalog types only.
4. Click a gold **Remind** control. A toast and the Action log should record `remind_signer` for that request id. Nothing is emailed.
5. Expand **Spec JSON peek**. Every `type` should be a catalog name. `catalog.validate: success` should show. There is no raw HTML string in the Spec.
6. Optional: type a looser prompt such as `void` or `EMEA counsel`. The local mock still emits only catalog components.

## Optional live LLM

`bun run dev` never needs secrets.

If you already have an endpoint that streams SpecStream JSONL (the format `useUIStream` expects), set:

```bash
# .env.local — not committed
VITE_JSON_RENDER_API=https://your-generate-endpoint
```

Then Generate will POST `{ prompt }` to that URL and compile the stream with the same SpecStream compiler. Leave the variable unset to keep the offline mock.

See `.env.example`.
