---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Lumin Sign records every stroke on the envelope — upload, place, sign, countersign, audit."
destination: docs
aspect: landscape
language: en
length: 30s
angle: feature-reveal
audience: reviewers of this tech-demos fixture (not the real Lumin product)
style_preset: blue-professional
mode: autonomous
---

## Intent

Silent ~30s feature-reveal of a **fake Lumin Sign desk** (Harbor MSA v2, envelope
ENV-MSA-7F2C91). Own fixtures only — never the real Lumin app. Cream/cobalt
Blue Professional look. No narration, no BGM, no SFX (`music: none`).

## Assets

None captured. Visuals are HTML/CSS reconstructions of the in-repo fixture UI.

## Customizations

- Canvas 1280×720 @ 24 fps so committed MP4s stay small.
- Offline/autonomous: HeyGen auth is signed out; local Kokoro/MusicGen are not installed.

## Notes

- Pin: HyperFrames CLI 0.8.174.
- Do not scrape lumin.com or any production e-sign product.
