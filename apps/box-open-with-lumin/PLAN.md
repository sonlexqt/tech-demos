# Box Open with Lumin

## Source
- Bookmark: https://developer.box.com/guides/applications/web-app-integrations/
- Product context: Lumin (luminpdf.com) PDF editor + Lumin Sign; ~26% of tagged entries already come from Google Drive “Open with”; zero from Box
- Slug: `box-open-with-lumin`

## Goal (single-user MVP)
In under two minutes, a reviewer right-clicks a seeded PDF in a mock Box file browser, chooses **Open with Lumin**, annotates or stamps a signature in a Lumin-like editor, and **Save to Box** writes a **new file version** (same `file_id`, not a new file) via `POST /files/{id}/content` with `If-Match` on the file etag. Version history then shows v1 → v2. A **Simulate concurrent edit** control proves the 412 conflict path. Default **MOCK MODE** needs no credentials.

## Out of scope
- Publishing a real Box App Center listing or production Lumin tenant
- Full Lumin Sign envelopes, legally binding signatures, or collaboration
- Box webhooks, comments, metadata, or folder-level integrations
- Google Drive Open-with (documented as comparison only)
- Multi-user auth beyond one OAuth code → token exchange

## Stack
- Runtime/tooling: Bun (`bun install && bun run dev`); `pnpm dev` works on the same scripts
- UI: Vite MPA (vanilla TypeScript) — Box-like browser + Lumin-like editor
- API: Hono (Workers-shaped `Request`/`Response`) — mock Box API + live adapter
- Key libraries: `pdfjs-dist`, `pdf-lib`, `box-node-sdk` v10 (live OAuth + file APIs; generated SDK, formerly `box-typescript-sdk-gen`)
- Deploy: Cloudflare Pages (static MPA) + Pages Functions wrapping the same Hono app
- CI: GitHub Actions running `bun test`, typecheck, and build (mock only)

## Manual testing / README
What `apps/box-open-with-lumin/README.md` must tell a reviewer:
- How to run (`bun install && bun run dev`) and optional `pnpm install && pnpm dev`
- Open `http://localhost:5173/` — mock Box All Files
- Right-click a PDF → **Open with Lumin** → highlight / text / draw / sign → **Save to Box** → version history shows v2
- **Simulate concurrent edit** then Save → 412 UI
- Live mode: create a Box developer app, enable Web App Integration, map `#file_id#` / `#auth_code#` / `#user_id#`, set `BOX_CLIENT_ID` / `BOX_CLIENT_SECRET` / `BOX_REDIRECT_URI` in `.env` (never commit secrets)
- Pass/fail checklist for mock and live

## Acceptance criteria
- [ ] `cd apps/box-open-with-lumin && bun install && bun run dev` works
- [ ] `apps/box-open-with-lumin/README.md` has run steps and a manual test checklist
- [ ] `PLAN.md` and `HOW_IT_WORKS.md` present (Open-with, OAuth, etag/If-Match, Drive comparison, mermaid sequence)
- [ ] Mock Box server implements Box-shaped routes: `/oauth2/token`, `/files/:id`, `/files/:id/content`, `/files/:id/versions` with If-Match and 412
- [ ] Open-with callback accepts `file_id` + `auth_code` + `user_id` (documents `#file_id#` mapping)
- [ ] Editor downloads via Box API, annotates (highlight, text, freehand/signature), flattens with pdf-lib, uploads a **new version**
- [ ] Version history UI shows v1 → v2 after save
- [ ] 412 conflict path is visible in the UI
- [ ] MOCK MODE is default and fully works with no credentials; LIVE MODE when Box env vars are set
- [ ] `.env.example` only; no secrets committed
- [ ] Tests cover mock contract (version increment, etag 412) and save-back flow
- [ ] Demo PR includes at least one screenshot **and** one video of the mock flow
- [ ] `tracking/seen-bookmarks.json` marks this demo built

## Validation (PR)
- Screenshot: Editor after Save to Box, version history showing v2 (and Box browser context if possible)
- Video: Box file browser → right-click Open with Lumin → annotate/sign → Save to Box → version history v2
- README: Confirm run steps + mock/live checklist match the criteria above
