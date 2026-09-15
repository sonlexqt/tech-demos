# WebMCP + PDF.js viewer

## Source
- Bookmark: https://mozilla.github.io/pdf.js/
- Slug: `webmcp-pdf-viewer`

## Goal (single-user MVP)
Open a local dev server, load a bundled sample PDF in the browser, read it with PDF.js, and drive the viewer either through WebMCP tools (when Chrome’s early-preview API is enabled) or through a built-in **Agent panel** that calls the same functions. In under two minutes you can flip pages, zoom, search text, and inspect document metadata without a backend.

## Out of scope
- Authentication and multi-user sessions
- Annotation persistence or collaborative editing
- Cloudflare or other production deploy
- Standalone MCP server or real in-browser agent beyond tool registration
- Full PDF.js feature parity (forms, annotations UI, printing)

## Stack
- Runtime/tooling: Bun
- UI/framework: Vite + TypeScript (vanilla DOM)
- Key libraries: `pdfjs-dist` (Mozilla PDF.js), WebMCP via `document.modelContext.registerTool` (feature-detected)

## Acceptance criteria
- [ ] `cd apps/webmcp-pdf-viewer && bun install && bun run dev` works
- [ ] Sample PDF in `public/` loads and renders in the viewer
- [ ] Agent panel can invoke `go_to_page`, `next_page`, `prev_page`, `set_zoom`, `search_text`, `get_page_text`, `get_document_info`
- [ ] When WebMCP is available, tools register and UI shows green “WebMCP active”; otherwise “WebMCP unavailable — Agent panel still works”
- [ ] Search returns matches with page numbers; page text and document info return structured JSON

## Validation (PR)
- Screenshot: Full layout with PDF rendered, Agent panel visible, and WebMCP badge state
- Video: Open app → show PDF rendered → use Agent panel for `go_to_page` and `search_text` → show WebMCP badge state
