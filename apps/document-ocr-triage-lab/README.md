# Document extraction-check lab

A local, synthetic Xberg experiment comparing native-only PDF extraction with automatic Tesseract English OCR. No paid services, private data or remote models.

## Run

Prerequisites: Bun 1.4.2 (tested), Linux x64 native package support, Tesseract with English data. On Debian/Ubuntu install `tesseract-ocr tesseract-ocr-eng`. The tested data directory is `/usr/share/tesseract-ocr/5/tessdata`; set `TESSDATA_PREFIX` to your installed directory on other systems. The native Xberg binding uses the local Tesseract library, not a subprocess invocation of its CLI.

```sh
cd apps/document-ocr-triage-lab
bun install --frozen-lockfile
bun run dev
# http://127.0.0.1:3000
```

Three PDFs are committed; Python is not required to run. No browser feature flags or Agent panel are involved. The server binds to loopback and accepts only named fixtures, not arbitrary paths or uploads.

## Manual test

1. Select **Native text invoice**, click **Run comparison**: both sides recover 7/7 known fields.
2. Select **Clean image-only scan**, run: native-only is empty (0/7); automatic OCR recovers 7/7 with page OCR confidence present.
3. Select **Degraded scan + native Bates stamp**, run: native-only retains the Bates stamp (1/7), despite cleanliness 1.00. OCR recovers 6/7 in the tested environment; the partly masked total remains incorrect. Different OCR builds may vary.
4. Expand warnings and diagnostics. Observe the prose-check warning, exact configuration, nullable page OCR confidence and raw uncalibrated engine confidence. Missing confidence is unknown.
5. Inspect the purple known-answer table. It compares exact labeled values; wrong values count as missing. This is fixture evaluation, not production telemetry.
6. Open each source PDF to inspect image/text degradation. The third fixture combines downsampling, blur and an intentionally obscured total; it is not a controlled blur-only benchmark.
7. Invalid fixture requests return HTTP 400; malformed PDFs are tested directly and throw explicit extraction errors. Example: `curl -i -H 'Content-Type: application/json' -d '{"fixture":"bad"}' http://127.0.0.1:3000/api/compare`.

## Automated checks

```sh
bun run lint
bun run typecheck
bun test
bun scripts/evidence.ts
# Linux + libseccomp.so.2: blocks IPv4/IPv6 socket creation before Bun starts.
python3 scripts/offline.py bun test
```

`offline.py` permits Unix sockets required by Tokio, blocks network sockets in the process and descendants, and verifies an actual EPERM before running tests. Dependencies must already be installed. No proxy-only simulation is used.

## Reproduce fixtures

Install Python Pillow and reportlab, and the DejaVu Sans font. Run `bun run fixtures`. See `evidence/versions.txt` for tested versions. PDF timestamps are invariant, geometry fixed, and no randomness is used. `fixtures/truth.json` is a separately maintained answer key; the generator does not import it and the extractor never reads it.

## Browser QA and recording

Requires local Chromium and FFmpeg. Run the server in another terminal, then:

```sh
# Playwright normally provides its FFmpeg helper via this command:
bunx playwright install ffmpeg
bun scripts/browser.ts
ffmpeg -i evidence/walkthrough.webm -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart evidence/walkthrough.mp4
```

Chromium defaults to `/usr/bin/chromium`. In this cloud environment Playwright's CDN was blocked, so its expected FFmpeg helper location (`$PLAYWRIGHT_BROWSERS_PATH/ffmpeg-1011/ffmpeg-linux`) was linked to installed `/usr/bin/ffmpeg`. This uses system FFmpeg, not a simulated recording. The script records the actual browser with 5.5-second caption pauses, visible cursor/click highlighting and keyboard indicators; it also checks desktop/mobile layout, API errors and page errors. The walkthrough is silent with captions. It does not include uploads or private data.

See [HOW_IT_WORKS.md](HOW_IT_WORKS.md), [measured results](evidence/results.json), [screenshots](evidence/clean-scan.png), and [walkthrough](evidence/walkthrough.mp4).
