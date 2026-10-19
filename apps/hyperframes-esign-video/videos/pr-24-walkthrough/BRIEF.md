---
workflow: pr-to-video
flow: automation
storyboard: no
message: "Same envelope questions, two retrievals: grep vs XERJ ranked passages."
destination: docs
aspect: landscape
language: en
length: 16s
angle: feature-reveal
audience: engineers reviewing tech-demos PR #24
style_preset: code-editorial
mode: autonomous
pr: https://github.com/sonlexqt/tech-demos/pull/24
---

## Intent

Silent short walkthrough of sonlexqt/tech-demos#24 (XERJ e-sign corpus search).
Code-editorial look. No narration / BGM / SFX.

## Assets

- capture/pr.json — written by the real `/pr-to-video` `fetch-pr.mjs` (`gh pr view` + paginated files)
- capture/diff.patch — full unified diff from `gh pr diff`
- capture/extracted/* — offline `ingest.mjs` transform
- assets/sonlexqt.png, assets/cursoragent.png — GitHub avatars

## Notes

Live `gh` worked in this environment. The capture folder is committed so the
demo stays honest offline later. See SNAPSHOT.md.
