# Lumen Sign · Jev Ultrafast playground

Mock **signature-request portal** that exercises the [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) decision loop: TypeSafe Jev (or a fixture) picks an operation **and** a numbered DOM element in one round trip.

This is **not** the real Chrome agent. The full Browser Use path still lives upstream:

```bash
git clone https://github.com/browser-use/jev-ultrafast.git
cd jev-ultrafast
uv sync
cp .env.example .env   # TYPESAFE_API_KEY + TEXT_MODEL_API_KEY
uv run jev
```

That inspector talks to Chrome through [Browser Harness](https://github.com/browser-use/browser-harness) at `http://127.0.0.1:8766`. This demo only replays the **choose operation + element index** loop against a Lumin-style e-sign wizard.

## Run

```bash
cd apps/jev-ultrafast-esign-portal
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

There is no WebMCP flag. The right-hand **Jev inspector** *is* the agent panel.

## What you should see

- **Lumen Sign** requester flow: start request → add signers → place fields → review → send
- Coral **index badges** on every interactive control (inputs, selects, buttons, drop zones)
- An **element table** in the same `[n] role label · value` shape as jev-ultrafast
- Inspector: action probabilities, target probabilities, chosen action, executed steps
- Mode badge: **Fixture** (no key) or **Live Jev** (server-side key)

## Manual test — fixture (default, offline)

1. Confirm the top-right badge says **Fixture**.
2. Leave the default goal (Q3 Vendor Agreement → Alex Rivera).
3. Click **Run automatically**.
4. Watch the fixture stream: `TYPE_TEXT` title + message, `SELECT` sequential, continue, fill signer, `SELECT` role, add signer, **WAIT**, place signature + date, review, send, **DONE**.
5. The portal should land on **Request sent**. The last inspector row should be `DONE`.
6. Click **Reset**, then **Step once** a few times to see one decision per click.
7. Optionally drive the portal yourself (type a title, add a signer). The table updates; the fixture skips already-satisfied fields.

Pass if: numbered table matches on-page badges, inspector shows peaked probabilities, and Run reaches **sent** without an API key.

## Manual test — live Jev (optional)

Keys are **server-side only**. Copy `.env.example` to `.env` in this app folder. First non-empty wins:

1. `JEV_API_KEY` → TypeSafe `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest` (same body as [`jev_ultrafast/model.py`](https://github.com/browser-use/jev-ultrafast/blob/main/jev_ultrafast/model.py))
2. `JEV_AI_GATEWAY_API_KEY` or `AI_GATEWAY_API_KEY` → `https://ai-gateway.vercel.sh/typesafe/v1/systemone`, model `typesafe-ai/jev`

Do **not** use a `VITE_` prefix. Restart `bun run dev` after editing `.env`.

Optional `TEXT_MODEL_*` vars call an OpenAI-compatible helper for `TYPE_TEXT`. If those are unset, the server infers field strings from the goal (playground convenience — upstream jev-ultrafast refuses to guess).

Pass if: badge reads **Live Jev**, Step/Run posts `/api/decide`, and the inspector shows a real model id + latency. A 502 leaves the portal unchanged and prints the error in **Chosen action**.

## Env notes

| Variable | Where | Purpose |
| --- | --- | --- |
| `JEV_API_KEY` | server | Direct TypeSafe / Jev key |
| `JEV_AI_GATEWAY_API_KEY` | server | Vercel AI Gateway (TypeSafe-compatible) |
| `AI_GATEWAY_API_KEY` | server | Same gateway, last fallback |
| `JEV_MODEL` / `JEV_BASE_URL` | server | Optional overrides |
| `TEXT_MODEL_*` | server | Optional TYPE_TEXT helper |

Never commit `.env`. `.env.example` ships with a blank `JEV_API_KEY=`.

## Checklist

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Badge is **Fixture** when no key is set
- [ ] Element table lists every numbered control on the current step
- [ ] **Run automatically** walks the wizard to **Request sent** and logs `DONE`
- [ ] Inspector shows operation + target probabilities and the executed step list
- [ ] README points at the real Chrome `uv run jev` harness
- [ ] Optional: `.env` with `JEV_API_KEY` flips the badge to **Live Jev**
