# How it works

The browser posts a fixture ID to a loopback Bun server. A strict allowlist maps that ID to a committed synthetic PDF. The server reads its bytes once and runs two sequential native Xberg extractions with no application cache and `useCache:false`. Elapsed milliseconds measure each extraction call plus local result inspection; they are individual observations, not benchmarks or comparable hardware claims.

The baseline sets `disableOcr:true`. Merely omitting `ocr` or setting it to null would not establish a no-OCR baseline: Xberg can automatically route empty scans to OCR. The other pass sets `disableOcr:false`, `forceOcr:false` and explicitly supplies Tesseract, `language:['eng']`, the local tessdata path and `vlmFallback:{mode:'disabled'}`. Automatic page selection remains Xberg's decision. No VLM config, remote input, layout model, embeddings, language model or other optional model feature is enabled; there is no model-download route selected. The OS-blocked test verifies the installed extraction path works without network sockets.

## Evidence boundaries

- **Production-available telemetry:** unedited extracted text, warnings, extraction method, page OCR confidence when present, engine metadata, qualityScore, elapsed time and configuration.
- **Evaluation-only information:** seven known answers from `fixtures/truth.json`, parsed labeled values, exact matches and missing/incorrect counts. `evaluation.ts` runs after extraction; ground truth is never provided to Xberg or the review rules.
- **Demo review rules:** suggest review for no text, fewer than 80 characters, engine warnings or page OCR confidence being present. No rule is a reliability guarantee. “No heuristic triggered” does not certify correctness.

qualityScore measures cleanliness of retained text, not completeness or accuracy probability. The Bates-only baseline illustrates the distinction: a clean stamp can earn 1.0 while six fields are missing. Engine extractionConfidence is displayed raw and uncalibrated; even combined=1 is not a validated probability. A page's present ocrConfidence supports the label “OCR observed.” Without it the UI says unknown, even if other metadata suggests a method. The app never fabricates confidence.

## Fixture design and measured limits

The native invoice has seven labeled values. The clean fixture contains a rasterized visual counterpart without native text. The degraded fixture downsamples and blurs that image, masks part of the total, and adds a crisp native Bates stamp. Its truth retains the original intended value so the loss is measurable. This is a compound failure example, not evidence that confidence reliably tracks blur, nor a representative document benchmark. Only one page, language, layout and seven fields are tested. Reading order differs between native text and OCR; exact labeled field parsing is intentionally narrow.

The tested results are native 7/7 in both modes, clean 0/7 → 7/7, degraded 1/7 → 6/7. OCR scores remain fairly high despite the damaged total. Use `evidence/results.json` for actual outputs, warnings, timings and diagnostics; do not generalize this small fixture suite to production accuracy.

## Publication and configuration sources

The npm registry confirmed `@xberg-io/xberg` **1.3.5**, published **2026-10-06T19:10:28.172Z**, as latest on 2026-10-07. It is pinned exactly with the lockfile; configuration was checked against its installed TypeScript declarations and smoke-tested against the native binary. Bun 1.4.2 was used.

- [Installation](https://docs.xberg.io/getting-started/installation/)
- [TypeScript API](https://docs.xberg.io/reference/api-typescript/)
- [Configuration](https://docs.xberg.io/reference/configuration/)
- [OCR guide](https://docs.xberg.io/guides/ocr/)
- [Changelog](https://docs.xberg.io/changelog/)

Documentation can advance independently of the pinned package; the installed declarations are the configuration contract used here. No deployment, merge or production readiness claim is part of this PoC.
