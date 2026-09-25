# Lumin Sign · Jev smart-clipboard playground

Self-contained **Lumin Sign** document workspace plus a smart-clipboard pane. Messy clipboard text (signer lists, addresses, clause blobs, mixed junk) is classified with TypeSafe Jev **Choice / Score** — or a deterministic fixture — into paste targets with confidence. **Apply** fills the workspace.

This is **not** [Jaste](https://x.com/marcus_lowe/status/2101476399488160013). Jaste is Marcus Lowe’s OS-level TypeSafe Jev smart copy/paste (beta). This playground only shows the same *idea* inside a mock e-sign envelope.

Documented Jev contract used here: [`POST /v1/systemone`](https://docs.typesafe.ai/api.md) with `choice` + `score` questions. Candidates are found in code first ([pre-parsed extraction](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md)), then one speculative fan-out request classifies intent and picks spans.

## Run

```bash
cd apps/jev-jaste-esign-clipboard
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/). There is no WebMCP flag and no in-page LLM Agent panel. The **Smart clipboard** column is the whole demo.

## What to click / try

1. Confirm the header badge is **Fixture** (no API key) or **Live Jev** (key present).
2. Click a preset: **Signer list**, **Address block**, **Clause paragraph**, **Mixed junk**, or **Notice email**.
3. Click **Classify paste**. You should see an Intent (Choice) card, a fit Score, and proposal cards with confidence bars.
4. Leave high-confidence rows checked and click **Apply selected** (or **Apply this** on one card).
5. The left workspace should fill: signer chips, company, notice address, notice email, and/or the clause block. Applied fields flash purple.
6. Repeat with **Mixed junk** — several targets should appear; leftover chatter (wifi password, gif) should not become a field.
7. **Reset workspace** clears the envelope so you can replay.

## Manual test checklist

### Fixture (default — no key)

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Badge reads **Fixture**
- [ ] **Signer list** → Classify proposes Maya Chen + Jordan Hale as signer chips; `legal@acme.io` is not a signer (cc)
- [ ] Apply selected adds those chips to the envelope
- [ ] **Address block** → company `Acme Robotics, Inc.` + Market Street address
- [ ] **Clause paragraph** → indemnification text lands in the clause block
- [ ] **Notice email** → `contracts+msa@harborlegal.com` (not the personal gmail)
- [ ] **Mixed junk** → signer Priya Nair, Oakland address, limitation-of-liability clause; wifi password is ignored
- [ ] Banner / README still say this is a playground, not Jaste

### Optional live Jev

Copy `.env.example` to `.env` (gitignored) and set the first non-empty key:

1. `JEV_API_KEY` → [TypeSafe System One](https://docs.typesafe.ai/api.md) `https://api.typesafe.ai/v1/systemone`, model `jev-latest`
2. else `JEV_AI_GATEWAY_API_KEY` or `AI_GATEWAY_API_KEY` → `https://ai-gateway.vercel.sh/typesafe/v1/systemone`, model `typesafe-ai/jev`

Never use a `VITE_` prefix. Restart `bun run dev` after editing `.env`.

- [ ] Badge reads **Live Jev**
- [ ] Classify still returns Choice intent + Score fit + proposals
- [ ] Apply still fills the workspace
- [ ] A bad/missing live response shows an error; the key never appears in the page source

## Notes for reviewers

- Keys stay on the Vite middleware. The browser only calls `/api/classify` and `/api/mode`.
- Fixture path is deterministic so the PR video works offline.
- Real Jaste lives on the desktop clipboard; this app never hooks OS copy/paste.
