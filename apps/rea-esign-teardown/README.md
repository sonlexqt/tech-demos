# REA e-sign bundle teardown

Self-contained demo of [REA](https://github.com/morluto/rea) (`rea-agents` 6.4.0, MIT) on an **owned Lumin Sign–framed signer fixture**. REA statically analyzes the minified JS bundle (no Ghidra / Hopper / IDA). The UI compares that evidence to the readable source, scores match/miss, and hosts a signature pad rebuilt from the findings.

This demo never targets a third-party or competitor app.

## Run

```bash
cd apps/rea-esign-teardown
bun install
bun run dev
```

Open the Vite URL (default `http://localhost:5173/`).

The page reads committed files under `fixtures/rea-output/`. **No API keys and no network LLM** are required.

## What to click / try

1. Read **How signing really works** (left): field placement → canvas capture → pdf-lib write, with REA evidence IDs.
2. Switch source tabs (right): `fields.ts`, `capture.ts`, `pdf-write.ts`, then `signer.min.js` to see what REA actually parsed.
3. Scan the **Accuracy check**: green matches (literals, ESM exports, `pdf-lib` import, `embedPng` / `toDataURL`) and red misses (some `trace_application_feature` string seeds, minified helper names, Electron-role over-classification).
4. Draw on **Rebuilt signature capture**, click **Export PNG**, confirm a preview appears. **Clear** resets the pad. Exporting an empty pad shows `lumin-sign-capture-empty`.

## Optional live REA re-run

Static JS analysis is local. Only do this if you want to refresh the committed fixtures.

```bash
# Node.js ^22.19 || ^24.11 || >=26
REA_LIVE=1 bun run capture:rea
```

`capture:rea` rebuilds `fixtures/signer-bundle/signer.min.js` (`bun build --minify`, `pdf-lib` external) and runs:

- `npx -y rea-agents@latest analyze-javascript-application <bundle-dir> --json`
- `npx -y rea-agents@latest inspect-analysis-view <tmp-input> --json`
- `npx -y rea-agents@latest trace-application-feature <tmp-input> --json` for signing-flow seeds

Keys are never written. Do not commit `.env`. See `.env.example`.

Rebuild the bundle alone:

```bash
bun run build:signer
```

## Manual test checklist

- [ ] `bun install && bun run dev` starts Vite on port 5173
- [ ] Header shows **offline fixture** and `rea-agents@6.4.0`
- [ ] Report cites `analyze_javascript_application` evidence `ev_291adc3d…`
- [ ] Source tabs show readable TypeScript and the minified bundle
- [ ] Accuracy table has both **match** and **miss** rows
- [ ] Drawing + **Export PNG** shows a preview; empty export errors with `lumin-sign-capture-empty`
- [ ] No WebMCP flag required; there is no in-page Agent panel
- [ ] No third-party e-sign product is loaded or named as a target

## Layout

| Path | Role |
| --- | --- |
| `fixtures/signer-src/` | Readable owned signer (place field → capture → pdf-lib write) |
| `fixtures/signer-bundle/` | Minified bundle REA analyzed |
| `fixtures/rea-output/` | Captured REA CLI JSON + compact report |
| `src/signature-pad.ts` | Live pad rebuilt from REA findings |
| `HOW_IT_WORKS.md` | REA JS-bundle MCP / skills explanation |
