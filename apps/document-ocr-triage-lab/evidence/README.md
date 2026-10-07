# Evidence

All documents, images and video show synthetic data only.

- `results.json`: actual sequential extraction results and separate known-answer evaluation, including configuration, warnings, elapsed times and diagnostics.
- `smoke.txt`: initial real native-package/Tesseract smoke output (before enabling quality processing explicitly).
- `tests.txt`, `offline-tests.txt`, `lint.txt`, `typecheck.txt`: final checks. Offline test denies both IPv4 and IPv6 socket creation with seccomp, while permitting local IPC.
- `fixture-hashes.json`: generator rerun produced identical PDF/PNG SHA-256 hashes.
- `browser-qa.json`: desktop/mobile browser assertions, no uncaught page errors.
- `clean-scan.png`, `degraded-scan.png`: running app screenshots.
- `walkthrough.mp4`: actual cloud Chromium session, captioned with 5.5-second pauses and interaction overlays; no fabricated outputs.
- `video-validation.json`, `playback.json`, `visual-validation.json`, `decode-errors.txt`: codec, duration, real Chromium playback, frame/indicator checks and full decoding (empty error log means no decode errors).
- `versions.txt`: exact runtime and system tool versions.

No GitHub Actions workflow exists in this repository; local checks are not represented as hosted CI. Tests cover a tiny fixed fixture suite, not production document accuracy. Timings vary by run and are not benchmark claims.
