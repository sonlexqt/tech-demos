# Box Open with Lumin

Self-contained demo of a **Box Web App Integration** (popup / Open-with). A user right-clicks a PDF in Box, chooses **Open with Lumin**, annotates or stamps a signature in a Lumin-like editor, and **Save to Box** writes a **new file version** of the same `file_id` (`POST /files/{id}/content` + `If-Match` etag). Version history then shows v1 → v2.

**MOCK MODE is the default** and needs no Box credentials. LIVE MODE turns on when `BOX_CLIENT_ID` and `BOX_CLIENT_SECRET` are set.

## Run

```bash
cd apps/box-open-with-lumin
bun install
bun run dev
```

`pnpm install && pnpm dev` runs the same scripts if you prefer pnpm.

Open [http://localhost:5173/](http://localhost:5173/). Vite serves the UI on **5173** and proxies Box-shaped API routes to the Hono server on **8787**.

There is no WebMCP flag and no in-page LLM Agent panel.

## What to click / try (mock)

1. You should see a Box-like **All Files** page with three seeded PDFs (NDA, SOW, invoice) and a **MOCK MODE** badge.
2. **Right-click** `Acme-Northwind-NDA.pdf` and choose **Open with Lumin** (or use the row button). That hits the real callback shape: `/open-with?file_id=&auth_code=&user_id=`.
3. The Lumin editor exchanges the auth code at `POST /oauth2/token`, downloads `GET /files/{id}/content`, and renders with PDF.js.
4. Highlight a clause, add text, draw, or **Sign** (draw a stamp, then click the signature line).
5. Click **Save to Box**. The editor flattens with pdf-lib and uploads `POST /files/{id}/content` with `If-Match` set to the file etag.
6. The right-hand **Version history** should list **v2 current** and **v1**.
7. Optional: **Simulate concurrent edit**, then Save — you should see **412 Precondition Failed** and a retry prompt.

**Reset demo** on the Box page restores the seeded files and etags.

## Manual test checklist (mock)

- [ ] `bun install && bun run dev` serves `http://localhost:5173/`
- [ ] Badge says **MOCK MODE**; no Box developer login required
- [ ] Right-click → **Open with Lumin** lands on the editor with `file_id`, `auth_code`, `user_id` shown
- [ ] PDF renders; highlight / text / draw / sign all leave marks on the page
- [ ] **Save to Box** succeeds; version history shows v1 → v2 (same file id, new etag)
- [ ] **Simulate concurrent edit** then Save shows 412 and names the stale etag
- [ ] `bun test` passes (version increment + 412 + save-back flow)
- [ ] No `.env` and no client secrets in the tree

## Tests

```bash
cd apps/box-open-with-lumin
bun test
```

## LIVE MODE (optional)

Live mode activates only when **both** `BOX_CLIENT_ID` and `BOX_CLIENT_SECRET` are present. Copy `.env.example` to `.env` (gitignored).

### Create a Box developer app

1. Sign up for a [free Box developer account](https://account.box.com/signup/n/developer).
2. Open the [Developer Console](https://app.box.com/developers/console) → **Create App** → **Platform App** with **OAuth 2.0** (User Authentication).
3. On **Configuration**:
   - Redirect URI: `http://localhost:5173/api/auth/callback` (exact match).
   - Scopes: at least **Read and write all files and folders** (`root_readwrite`) for this demo.
   - CORS origin: `http://localhost:5173` if you ever call Box from the browser (this demo keeps secrets on the server).
4. Copy **Client ID** and **Client Secret** into `.env`:

```
BOX_CLIENT_ID=
BOX_CLIENT_SECRET=
BOX_REDIRECT_URI=http://localhost:5173/api/auth/callback
```

Fill the first two from the Developer Console. Do not commit `.env`.

Restart `bun run dev`. The badge should read **LIVE MODE**.

### Enable the Web App Integration (Open with)

1. In the same app, open the **Integrations** tab → **Create a Web App Integration**.
2. Name it `Open with Lumin`. File extensions: `pdf`. Permissions: **Full permissions** (download + update). Integration type: **Files**.
3. **Client Callback URL**: `http://localhost:5173/open-with` (or your Pages URL + `/open-with`).
4. User experience: open in a **new window**.
5. **Callback parameters** (GET — Box substitutes the `#placeholders#`):

| Parameter name | Method | Parameter value |
| --- | --- | --- |
| `file_id` | GET | `#file_id#` |
| `auth_code` | GET | `#auth_code#` |
| `user_id` | GET | `#user_id#` |
| `file_extension` | GET | `#file_extension#` |

6. Leave status **Development**. Add your Box user as a collaborator on the app if the menu item does not appear.
7. Upload a PDF to Box → right-click → **Integrations** → **Open with Lumin**. Box should open `/open-with?file_id=…&auth_code=…&user_id=…`, which redirects to the editor. Save still uses `If-Match` against the live etag.

Standard OAuth (without the integration menu) is also available at `/api/auth/login?file_id=<id>`.

## Cloudflare Pages

The Hono app is Workers-shaped. After `bun run build`:

```bash
bun run pages:dev      # wrangler pages dev dist
bun run pages:deploy   # wrangler pages deploy dist
```

Set `BOX_CLIENT_ID` / `BOX_CLIENT_SECRET` / `BOX_REDIRECT_URI` as Pages environment variables for live mode. Mock mode needs none. Point the Box integration callback at `https://<project>.pages.dev/open-with`.

## Notes for reviewers

- Save-back is **versioned**, not a copy: `POST /files/{id}/content` (Box `uploads.uploadFileVersion`).
- Optimistic concurrency: `If-Match: <etag>` → HTTP **412** when someone else wrote first.
- Live file calls go through **`box-node-sdk` v10** (Box’s generated TypeScript SDK; successor to `box-typescript-sdk-gen`). Mock mode never talks to `api.box.com`.
- See [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) for Open-with vs Drive, OAuth scoping, and sequence diagrams.
