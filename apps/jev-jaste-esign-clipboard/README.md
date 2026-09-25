# SignatureRequestDTO · Jev smart-clipboard playground

Self-contained playground: paste messy Slack/email dumps, classify them with TypeSafe Jev **Choice / Score** (or a deterministic fixture), and **apply** writes onto a [Lumin `SignatureRequestDTO`](https://developers.luminpdf.com/tabs/api-reference/api/signature-requests/send-signature-request) — the body of `POST https://api.luminpdf.com/v1/signature_request/send`. A live **Outgoing JSON preview** shows what would be POSTed.

This demo **does not call** `api.luminpdf.com`. It only shapes the payload.

This is **not** [Jaste](https://x.com/marcus_lowe/status/2101476399488160013). Jaste is Marcus Lowe’s OS-level TypeSafe Jev smart copy/paste (beta).

Documented Jev contract: [`POST /v1/systemone`](https://docs.typesafe.ai/api.md). Candidates are found in code first ([pre-parsed extraction](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md)).

## Scenario

Ops / legal is sending an **MSA countersign**:

| DTO field | Demo value |
| --- | --- |
| `title` | `Acme Robotics — Master Services Agreement (FY26)` |
| `signing_type` | `ORDER` |
| `signers[]` | counsel `group: 1` → customer `group: 2` → internal VP `group: 3` |
| `viewers[]` | deal desk / finance (visibility only) |
| `expires_at` | unix epoch **milliseconds** (~30 days, or “end of October”) |
| `custom_email` | subject / title / sender when the thread mentions them |
| `file_url` | fixed public sample PDF (no upload) |
| `use_text_tags` | `true` when the thread says so |

`signers[].verification` (`method: "vc"`) is an **advanced** proposal only if paste mentions ID/VC. In production that field requires a **Digital Trust** workspace license or Lumin returns `403 verification_not_licensed`.

Fields that are **not** on Send Signature Request (company, street address, clause text) are not in this UI or the JSON.

## Run

```bash
cd apps/jev-jaste-esign-clipboard
bun install
bun run dev
```

Open [http://localhost:5173/](http://localhost:5173/). No WebMCP flag. No in-page LLM Agent panel.

## What to click / try

1. Confirm the badge is **Fixture** (no key) or **Live Jev**.
2. Load **Ordered signers** → **Classify paste** → **Apply selected**. `signers[]` should list Marcus (group 1), Priya (group 2), Dana (group 3). `legal@acme.io` is a CC and must not appear. Dana may also get `verification`.
3. Load **Thread + expiry** → classify → apply. `title`, `expires_at` (ms), `signing_type: ORDER`, `custom_email`, and `use_text_tags` update. JSON preview must show milliseconds, not a date string.
4. Load **Viewer only** → classify → apply. `viewers[]` gets Sam Rivera / `finance@acme.io`. Personal gmail is ignored.
5. Load **Mixed junk** → classify. Wifi password and calendar link must not become DTO fields. Priya may be proposed as a signer.
6. Watch **Outgoing JSON** — that object is the would-be POST body. Incomplete required fields (`title`, `signers[]`) are flagged; nothing is sent.

## Manual test checklist

### Fixture (default)

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Badge reads **Fixture**
- [ ] Editor labels use API paths (`title`, `signers[]`, `expires_at`, …)
- [ ] Ordered signers apply with groups 1–3; CC skipped
- [ ] Thread preset sets title + `expires_at` ms + `custom_email` + `use_text_tags`
- [ ] Viewer preset writes `viewers[]` only
- [ ] Mixed junk ignores `hunter2-demo` and the calendar URL
- [ ] JSON preview is a `SignatureRequestDTO` (required `title`, `signers`, `expires_at`)
- [ ] Banner still says playground / not Jaste / not calling production

### Optional live Jev

Copy `.env.example` to `.env` (gitignored). First non-empty key wins:

1. `JEV_API_KEY` → [TypeSafe System One](https://docs.typesafe.ai/api.md) `https://api.typesafe.ai/v1/systemone`, model `jev-latest`
2. else `JEV_AI_GATEWAY_API_KEY` or `AI_GATEWAY_API_KEY` → `https://ai-gateway.vercel.sh/typesafe/v1/systemone`, model `typesafe-ai/jev`

Never use a `VITE_` prefix. Restart `bun run dev` after editing `.env`.

- [ ] Badge reads **Live Jev**
- [ ] Classify still returns Choice + Score + DTO proposals
- [ ] Apply still updates the JSON preview
- [ ] The key never appears in page source

## Notes for reviewers

- Keys stay on Vite middleware (`/api/classify`, `/api/mode`).
- OpenAPI types `signers[].group` as a string; the [official example](https://developers.luminpdf.com/tabs/api-reference/api/signature-requests/send-signature-request) uses numbers (`1`, `2`). This playground emits numbers so the JSON matches that example.
- Fixture path is deterministic so the PR video works offline.
