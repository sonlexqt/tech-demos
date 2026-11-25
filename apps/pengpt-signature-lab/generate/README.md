# PenGPT generation (laptop, not CI)

PenGPT ([greydanus/pengpt](https://github.com/greydanus/pengpt), Apache-2.0) is a
~6M-parameter transformer. Packed weights (`hand.npz`, ~6 MB) download from the
GitHub release `models-2026-11-16` the first time they are needed. Inference is
**numpy only** (`inference/pen.py`).

CI does **not** run this script. The web app replays JSON already in
`public/fixtures/`.

## This cloud run

Real inference **did run**. `generate_strokes.py --fixtures` loaded `hand.npz`
and wrote `vol-*-generated.json` / `.svg` plus notes files. `manifest.json`
has `"generatedWithPengpt": true`.

## Setup

```bash
# numpy is enough for named writers
python3 -m pip install numpy

# optional: full clone, only required for photo→style (hand.py) or stroke-file fit
git clone https://github.com/greydanus/pengpt ~/src/pengpt
```

Copy `.env.example` to `.env` if you will use a photo (never commit the key).

## Named writer (matches `python inference/pen.py write`)

```bash
cd apps/pengpt-signature-lab
python3 generate/generate_strokes.py \
  --text "Alex Rivera" \
  --writer sam \
  --out public/fixtures/custom-alex
```

`--writer sam` is a trained hand. `python inference/pen.py write --writers`
lists the others. The wrapper fetches `pen.py` + `hand.npz` into
`generate/.cache/` if `--pengpt-dir` is omitted.

Output: `custom-alex.json` (pad schema, `synthetic: true`) and `custom-alex.svg`
(visible **SYNTHETIC** watermark), plus `custom-alex.pengpt.svg` from upstream.

## Style vector from `hand.py` (photo)

Needs torch, InkSight weights (~0.7 GB), and `ANTHROPIC_API_KEY` (Claude reads
the words). This is the upstream path:

```bash
export PENGPT_DIR=~/src/pengpt
export ANTHROPIC_API_KEY=...          # from .env, not committed
pip install -e "$PENGPT_DIR[photo]"
python3 generate/generate_strokes.py \
  --pengpt-dir "$PENGPT_DIR" \
  --sample ~/scans/volunteer.jpg \
  --text "More text in that hand" \
  --out public/fixtures/vol-e.generated
```

The wrapper delegates to `inference/hand.py`, which writes `*.npy` as
`np.r_[style, temperature]`. `pen.py` then uses that vector as `writer`
(`top_k` defaults to 5, temperature from the file). That is the real
style-conditioning path.

## Stroke file sample

If you already have a pad JSON capture:

```bash
python3 generate/generate_strokes.py \
  --pengpt-dir "$PENGPT_DIR" \
  --sample path/to/volunteer.json \
  --fit-style \
  --text "Alex Rivera" \
  --out public/fixtures/from-strokes
```

`--fit-style` calls `hand.fit_style` (torch + `pengpt.py`). Without torch it
prints a warning and falls back to `--writer`.

A `.npy` saved by `hand.py` can be passed as `--sample me.npy` with no torch.

## Rebuild demo fixtures

```bash
python3 generate/generate_strokes.py --fixtures --out public/fixtures
```

Four volunteers, each with `*-real.json` (minimum-jerk pad stand-in,
`synthetic: false`) and `*-generated.json` (PenGPT, `synthetic: true`).
