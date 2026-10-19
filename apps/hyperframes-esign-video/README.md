# HyperFrames e-sign feature-reveal

Self-contained demo of [HyperFrames](https://github.com/heygen-com/hyperframes) **0.8.174** (Apache-2.0): a fake **Lumin Sign** desk, a ~30s HTML→MP4 product-launch video of that desk, a short **PR-to-video** of [tech-demos#24](https://github.com/sonlexqt/tech-demos/pull/24), a live seekable HTML preview, and an honest determinism report.

This is **not** the real Lumin Sign product. Fixtures are invented Harbor/Northwind envelopes only.

## Run

```bash
cd apps/hyperframes-esign-video
bun install
bun run dev
```

Open the Vite URL (default [http://localhost:5173/](http://localhost:5173/)).

No WebMCP flags. No in-page Agent panel. No API keys.

The committed MP4s in `public/renders/` make the UI work **offline without FFmpeg**. Optional re-render needs Node 22+, FFmpeg, and Chrome (see below).

## What to click / try

1. **Fixture desk (left)** — click **Use Harbor MSA v2.pdf**, then **Next** (Next stays disabled until the step is done). Place the signature field, adopt Avery Chen’s signature, countersign as Jordan Hale, and read the audit trail. **Reset desk** returns to upload.
2. Confirm the **Fixture — not the real Lumin app** badge stays visible.
3. **Launch video (right)** — play `lumin-sign-launch.mp4` (~30s). Click scene chips (Hook → Audit). The HTML source under **Scene HTML source** should match the clip.
4. Drag **Seekable HTML preview**. The composition (not just the MP4) should jump to that time. The MP4 playhead follows.
5. Switch to **PR #24 walkthrough**. Play the shorter MP4. Open the Diff hunk scene; the source should show the real `public/app.js` `renderHits` lines from the committed `capture/diff.patch`.
6. **Determinism** — click **Load last report**. You should see `public/renders/determinism.json` from `bun run check:determinism` (container hashes vs PNG frame hashes, with an honest skip/mismatch note if live re-render was not identical).

## Optional re-render

Pinned CLI: `hyperframes@0.8.174`. Skills used: `/product-launch-video`, `/pr-to-video`.

```bash
# Node 22+, FFmpeg, Chrome/Chromium
npx --yes hyperframes@0.8.174 doctor
bun run render              # writes videos/*/renders/video.mp4 and copies to public/renders/
bun run check:determinism   # re-renders to a temp file, hashes MP4 + sampled frames
```

HeyGen sign-in is **not** required. This demo’s videos are silent (`music: none`) because local Kokoro/MusicGen were not installed and no keys are committed.

PR ingest: live `gh` was used once; `videos/pr-24-walkthrough/capture/` is the committed snapshot. See `videos/pr-24-walkthrough/SNAPSHOT.md`.

## Manual test checklist

- [ ] `bun install && bun run dev` serves the app
- [ ] Fixture walks upload → place field → sign → countersign → audit trail
- [ ] Badge states this is a fixture, not real Lumin
- [ ] Launch MP4 plays (~30s) and scene HTML is visible
- [ ] Seekable preview moves with the range input
- [ ] PR #24 MP4 plays; snapshot note is honest (live `gh` + committed capture)
- [ ] Determinism JSON loads; result is not faked to “always match”
- [ ] No `.env` or HeyGen keys in the tree

## Pin

| Piece | Version |
| --- | --- |
| HyperFrames CLI | **0.8.174** |
| GSAP | 3.14.2 (vendored at `public/vendor/gsap.min.js`) |
| Canvas | 1280×720 @ 24 fps |
| License | Apache-2.0 |
