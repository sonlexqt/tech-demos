# WebMCP + PDF.js viewer

Self-contained demo: PDF.js renders a bundled sample PDF and exposes the same navigation/search tools to Chrome WebMCP and to the in-page **Agent panel**.

## Run

```bash
cd apps/webmcp-pdf-viewer
bun install
bun run dev
```

Open the Vite URL (default `http://localhost:5173/`). A sample PDF loads from `public/sample.pdf`.

The Agent panel on the right calls the same handlers as the WebMCP tools (`go_to_page`, `search_text`, and so on). Use it even when WebMCP is off.

## Manual verification

### 1. Turn on WebMCP (Chrome 146+, ideally current Beta/Canary)

- `chrome://flags/#enable-webmcp-testing` → **Enabled** → relaunch
- or launch with `--enable-features=WebMCP,WebMCPTesting`

Reload the app. Badge should be **WebMCP active**.

### 2. Call the tools yourself (no LLM)

DevTools → **Application** → **WebMCP**. You should see `go_to_page`, `search_text`, etc. Click a tool, fill args, **Run tool**. Same effect as the Agent panel.

### 3. Talk to an actual agent

Install [WebMCP - Model Context Tool Inspector](https://chromewebstore.google.com/detail/gbpdfapgefenggkahomfgkhfehlcenpd) (Chrome **150.0.7861.0+**). Open the app, click the extension, and prompt something like:

- “Go to page 3”
- “Search the PDF for Trace and list matching pages”

That chat uses Gemini (`gemini-3-flash-preview` by default) and, if it works, invokes the registered WebMCP tools. That is the real in-tab agent. It is separate from Gemini in Chrome.

If you are on Chrome 148, you can still use the Agent panel + DevTools WebMCP pane. The inspector/chat path is what needs the newer Chrome + extension.
