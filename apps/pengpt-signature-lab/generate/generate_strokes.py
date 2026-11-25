#!/usr/bin/env python3
"""Wrap PenGPT handwriting inference and emit pad-compatible stroke JSON + SVG.

Real API (greydanus/pengpt, Apache-2.0), studied 2026-11:

  from inference.pen import Pen, layout, svg
  Pen("hand.npz")                         # downloads release models-2026-11-16
  pen.write(text, writer, temperature, top_k, seed)  -> list of (N,3) arrays
                                          # columns: x, y, down; y increases down
  writer: known id (pen.writers) OR a style vector ndarray
          (hand.py saves np.r_[style, temperature] as me.npy)
  Photo → style: inference/hand.py (torch + InkSight + ANTHROPIC_API_KEY)
  Stroke-file style: fit_style in hand.py (needs full repo + torch)

This wrapper:
  --sample photo.jpg     delegates to hand.py if PENGPT_DIR is set
  --sample me.npy        uses the style vector exactly as pen.py --writer me.npy
  --sample file.json     optional --fit-style (torch); else --writer fallback
  --writer sam           named hand from the packed model (numpy only)

Timestamps: PenGPT does not emit time. Generated files use a *regular* clock
(the forensic tell). Fixture "real" captures use minimum-jerk human timing.

Run on a laptop (not CI):

  python generate/generate_strokes.py --pengpt-dir ~/src/pengpt \\
      --text "Alex Rivera" --writer sam --out public/fixtures/vol-a.generated
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

SCHEMA = "pengpt-signature-lab/v1"
CANVAS = {"width": 900, "height": 280}
RELEASE = "https://github.com/greydanus/pengpt/releases/download/models-2026-11-16/hand.npz"
PEN_PY = "https://raw.githubusercontent.com/greydanus/pengpt/main/inference/pen.py"

VOLUNTEERS = [
    {
        "id": "vol-a",
        "displayName": "Alex Rivera",
        "text": "Alex Rivera",
        "notes": "Ship the NDA by Friday",
        "writer": "sam",
        "seed": 0,
        "temperature": 0.35,
        "consentId": "fixture-stand-in-vol-a",
        "human_style": "loopy",
    },
    {
        "id": "vol-b",
        "displayName": "Blair Chen",
        "text": "Blair Chen",
        "notes": "Need wet ink on page two",
        "writer": "mfuya",
        "seed": 1,
        "temperature": 0.5,
        "consentId": "fixture-stand-in-vol-b",
        "human_style": "print",
    },
    {
        "id": "vol-c",
        "displayName": "Casey Okonkwo",
        "text": "Casey Okonkwo",
        "notes": "Countersign after lunch",
        "writer": "epzbg",
        "seed": 2,
        "temperature": 0.4,
        "consentId": "fixture-stand-in-vol-c",
        "human_style": "fast",
    },
    {
        "id": "vol-d",
        "displayName": "Devon Patel",
        "text": "Devon Patel",
        "notes": "Leave the annex unsigned",
        "writer": "crmbu",
        "seed": 3,
        "temperature": 0.55,
        "consentId": "fixture-stand-in-vol-d",
        "human_style": "mixed",
    },
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def cache_dir() -> Path:
    d = Path(__file__).resolve().parent / ".cache"
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_pen_module(pengpt_dir: str | None):
    """Import inference.pen.Pen without requiring the rest of the repo."""
    if pengpt_dir:
        inf = Path(pengpt_dir) / "inference"
        if (inf / "pen.py").exists():
            sys.path.insert(0, str(inf))
            import pen as mini  # type: ignore

            return mini
    cached = cache_dir() / "pen.py"
    if not cached.exists():
        print(f"fetching pen.py -> {cached}")
        urllib.request.urlretrieve(PEN_PY, cached)
    sys.path.insert(0, str(cache_dir()))
    import pen as mini  # type: ignore

    return mini


def ensure_model(path: str) -> str:
    p = Path(path)
    if p.exists():
        return str(p)
    dest = cache_dir() / "hand.npz"
    if dest.exists():
        return str(dest)
    print(f"downloading {RELEASE} -> {dest}")
    urllib.request.urlretrieve(RELEASE, dest)
    return str(dest)


def place_on_canvas(mini, words, canvas=CANVAS, pad=48.0):
    placed = mini.layout(words)
    if not placed:
        return []
    pts = np.concatenate(placed)
    lo, hi = pts[:, :2].min(0), pts[:, :2].max(0)
    size = np.maximum(hi - lo, 1e-6)
    sx = (canvas["width"] - 2 * pad) / size[0]
    sy = (canvas["height"] - 2 * pad) / size[1]
    scale = float(min(sx, sy))
    origin = np.array(
        [
            (canvas["width"] - size[0] * scale) / 2.0,
            (canvas["height"] - size[1] * scale) / 2.0,
        ]
    )
    triples = []
    for p in placed:
        xy = (p[:, :2] - lo) * scale + origin
        for (x, y), d in zip(xy, p[:, 2]):
            triples.append((float(x), float(y), int(d) == 1))
    return triples


def model_timing(triples, rng):
    """Regular clock: the generated-file tell. ~12 ms grid, nearly constant speed."""
    t = 0.0
    out = []
    prev = None
    for x, y, down in triples:
        if prev is None:
            dt = 0.0
        else:
            dist = math.hypot(x - prev[0], y - prev[1])
            speed = max(0.11, 0.19 + rng.normal(0, 0.006))  # px / ms
            raw = dist / speed if speed else 12.0
            if prev[2] and not down:
                raw += 36
            if (not prev[2]) and down:
                raw += 80 + rng.normal(0, 3)
            dt = max(8.0, round(raw / 12.0) * 12.0 + rng.normal(0, 0.35))
        t += dt
        out.append({"x": round(x, 3), "y": round(y, 3), "t": round(t, 3), "down": bool(down)})
        prev = (x, y, down)
    return out


def cubic(p0, p1, p2, p3, n=28):
    ts = np.linspace(0, 1, n)
    pts = []
    for t in ts:
        u = 1 - t
        pts.append(
            u**3 * np.array(p0)
            + 3 * u**2 * t * np.array(p1)
            + 3 * u * t**2 * np.array(p2)
            + t**3 * np.array(p3)
        )
    return pts


def human_paths(style: str) -> list[list[tuple[float, float]]]:
    """Hand-authored pad signatures (fixture volunteers, not customers)."""
    # Coordinates in the 900×280 pad, cream-paper margins already inside.
    if style == "loopy":
        s1 = []
        s1 += cubic((70, 160), (90, 40), (150, 40), (155, 170))
        s1 += cubic((155, 170), (170, 250), (210, 70), (250, 150))
        s1 += cubic((250, 150), (280, 210), (320, 90), (360, 155))
        s1 += cubic((360, 155), (410, 230), (470, 60), (530, 150))
        s1 += cubic((530, 150), (590, 230), (650, 80), (720, 165))
        s1 += cubic((720, 165), (760, 210), (800, 130), (830, 150))
        return [
            [(p[0], p[1]) for p in s1],
            [(248, 92), (252, 88), (256, 92)],
            [(80, 210), (200, 222), (420, 218), (700, 226), (840, 214)],
        ]
    if style == "print":
        letters = [
            [(90, 80), (90, 190), (140, 190)],  # L-like B stem + belly as separate
            [(90, 80), (150, 90), (150, 125), (90, 130)],
            [(90, 130), (155, 140), (150, 185), (90, 190)],
            [(175, 190), (175, 110), (185, 100)],  # l
            [(210, 155), (230, 100), (255, 155), (230, 145), (215, 145)],  # a
            [(275, 100), (275, 160), (278, 190)],  # i
            [(274, 88), (278, 84)],
            [(300, 190), (305, 110), (350, 190), (355, 110)],  # r
            [(390, 80), (390, 190), (450, 80), (450, 190)],  # C
            [(390, 80), (430, 70), (470, 110)],
            [(480, 190), (500, 100), (540, 190)],  # h
            [(500, 145), (535, 145)],
            [(560, 155), (580, 100), (610, 190), (590, 140)],  # e
            [(630, 190), (640, 100), (680, 110), (675, 190)],  # n
        ]
        return [[(float(x), float(y)) for x, y in stroke] for stroke in letters]
    if style == "fast":
        s = []
        s += cubic((60, 170), (80, 60), (140, 50), (160, 180))
        s += cubic((160, 180), (200, 250), (280, 40), (340, 160))
        s += cubic((340, 160), (400, 250), (500, 40), (560, 155))
        s += cubic((560, 155), (640, 240), (760, 70), (840, 150))
        tail = cubic((840, 150), (860, 170), (850, 200), (800, 210))
        return [[(p[0], p[1]) for p in s + tail]]
    # mixed
    d = cubic((80, 70), (180, 50), (190, 200), (85, 200))
    rest = cubic((200, 170), (280, 80), (420, 210), (560, 120))
    rest += cubic((560, 120), (650, 70), (760, 190), (840, 140))
    dots = [(270, 88), (274, 84), (278, 88)]
    bar = [(90, 220), (400, 228), (820, 218)]
    return [
        [(p[0], p[1]) for p in d],
        [(p[0], p[1]) for p in rest],
        dots,
        bar,
    ]


def min_jerk(u: np.ndarray) -> np.ndarray:
    # Flash & Hogan 1985, normalized 0–1
    return 10 * u**3 - 15 * u**4 + 6 * u**5


def resample_human(strokes, rng, style: str):
    """Irregular clock + minimum-jerk speed + tremor. Distinct from model_timing."""
    speed = {"loopy": 0.13, "print": 0.10, "fast": 0.22, "mixed": 0.15}[style]
    tremor = {"loopy": 0.55, "print": 0.35, "fast": 0.7, "mixed": 0.5}[style]
    t = 0.0
    points = []
    for si, stroke in enumerate(strokes):
        if si:
            gap = float(rng.lognormal(math.log(160), 0.45))
            if style == "print":
                gap *= 1.25
            if style == "fast":
                gap *= 0.55
            t += gap
        arr = np.array(stroke, float)
        if len(arr) == 1:
            arr = np.vstack([arr, arr + rng.normal(0, 0.4, size=(1, 2))])
        seg = np.sqrt(((arr[1:] - arr[:-1]) ** 2).sum(1))
        cum = np.concatenate([[0], np.cumsum(seg)])
        length = float(cum[-1]) or 1.0
        duration = max(80.0, length / max(speed, 0.05) * rng.uniform(0.85, 1.2))
        samples = []
        u = 0.0
        while u < 1.0:
            dt = float(max(4.0, rng.gamma(3.2, 3.4)))  # messy ~10–14 ms
            u = min(1.0, u + dt / duration)
            s = float(min_jerk(np.array([u]))[0]) * length
            s = min(s, length)
            k = int(np.searchsorted(cum, s, side="right") - 1)
            k = min(max(k, 0), len(arr) - 2)
            span = cum[k + 1] - cum[k]
            a = 0 if span <= 0 else (s - cum[k]) / span
            xy = arr[k] + a * (arr[k + 1] - arr[k])
            nrm = arr[k + 1] - arr[k]
            if np.hypot(*nrm) > 1e-6:
                perp = np.array([-nrm[1], nrm[0]]) / np.hypot(*nrm)
                xy = xy + perp * rng.normal(0, tremor)
            samples.append((float(xy[0]), float(xy[1]), dt))
        for i, (x, y, dt) in enumerate(samples):
            if i:
                t += dt
            points.append({"x": round(x, 3), "y": round(y, 3), "t": round(t, 3), "down": True})
        t += float(rng.uniform(8, 22))
        last = points[-1]
        points.append({"x": last["x"], "y": last["y"], "t": round(t, 3), "down": False})
    return points


def stroke_doc(**kwargs):
    doc = {
        "schema": SCHEMA,
        "canvas": dict(CANVAS),
        "createdAt": utc_now(),
        **kwargs,
    }
    return doc


def write_json(path: Path, doc: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=2) + "\n")
    print(f"-> {path}")


def write_svg(path: Path, doc: dict, watermark: str):
    w, h = doc["canvas"]["width"], doc["canvas"]["height"]
    color = "#7a1f2b" if doc["synthetic"] else "#1a2744"
    parts = []
    d = []
    drawing = False
    for p in doc["points"]:
        if p["down"]:
            cmd = f"{'M' if not drawing else 'L'}{p['x']:.2f} {p['y']:.2f}"
            d.append(cmd)
            drawing = True
        elif drawing:
            parts.append(" ".join(d))
            d = []
            drawing = False
    if d:
        parts.append(" ".join(d))
    paths = "".join(
        f'<path d="{seg}" fill="none" stroke="{color}" stroke-width="2.4" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
        for seg in parts
    )
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <rect width="100%" height="100%" fill="#f4efe6"/>
  <text x="50%" y="22" text-anchor="middle" fill="#c44536" font-size="13"
        font-family="ui-sans-serif, system-ui, sans-serif" letter-spacing="0.18em">{watermark}</text>
  {paths}
</svg>
'''
    path.write_text(svg)
    print(f"-> {path}")


def resolve_writer(pen, writer: str, sample: str | None):
    if sample and sample.endswith(".npy"):
        style = np.load(sample)
        # hand.py: np.r_[style, temperature]
        return style[:-1], float(style[-1])
    if writer in pen.writers:
        return writer, None
    print(f"writer {writer!r} not in model; falling back to sam", file=sys.stderr)
    return "sam", None


def generate_pengpt(mini, pen, text, writer, temperature, seed, top_k=None):
    if isinstance(writer, np.ndarray):
        words = pen.write(text, writer, temperature, top_k or 5, seed)
    else:
        words = pen.write(text, writer, temperature, top_k, seed)
    triples = place_on_canvas(mini, words)
    rng = np.random.default_rng(seed + 17)
    return model_timing(triples, rng), words


def maybe_fit_style(pengpt_dir, sample_json, pen, text_hint):
    """Best-effort stroke-file style fit. Requires torch + pengpt.py."""
    try:
        import torch  # noqa: F401
    except ImportError:
        print("torch missing: cannot fit style from a stroke file; use --writer")
        return None
    if not pengpt_dir:
        print("PENGPT_DIR / --pengpt-dir required to fit style from a stroke file")
        return None
    sys.path[:0] = [str(Path(pengpt_dir) / "inference"), pengpt_dir]
    try:
        import hand as handmod  # type: ignore
    except Exception as exc:
        print(f"could not import hand.py: {exc}")
        return None
    doc = json.loads(Path(sample_json).read_text())
    pts = np.array([[p["x"], p["y"], 1 if p["down"] else 0] for p in doc["points"]], float)
    # rescale pad pixels into PenGPT's ~x-height world
    pts[:, :2] -= pts[:, :2].min(0)
    span = max(pts[:, 1].max(), 1e-6)
    pts[:, :2] *= 0.123 / span
    try:
        style, temp = handmod.fit_style(pen, [text_hint or "hello"], [pts])
    except Exception as exc:
        print(f"fit_style failed: {exc}")
        return None
    return style, temp


def build_fixtures(args):
    mini = load_pen_module(args.pengpt_dir)
    model_path = ensure_model(args.model)
    t0 = time.time()
    pen = mini.Pen(model_path)
    print(f"loaded {model_path} in {time.time() - t0:.2f}s, {len(pen.writers)} writers")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    volunteers = []
    used_model = True

    for v in VOLUNTEERS:
        writer, style_temp = resolve_writer(pen, v["writer"], None)
        temp = v["temperature"] if style_temp is None else style_temp
        pengpt_ok = True
        try:
            points, _words = generate_pengpt(
                mini, pen, v["text"], writer, temp, v["seed"]
            )
        except Exception as exc:
            print(f"PenGPT write failed for {v['id']}: {exc}; using kinematic stand-in")
            used_model = False
            pengpt_ok = False
            points = model_timing(
                [
                    (x, y, True)
                    for stroke in human_paths(v["human_style"])
                    for (x, y) in stroke
                ],
                np.random.default_rng(v["seed"]),
            )

        gen_id = f"{v['id']}-generated"
        gen = stroke_doc(
            id=gen_id,
            volunteerId=v["id"],
            displayName=v["displayName"],
            text=v["text"],
            synthetic=True,
            source="pengpt" if pengpt_ok else "fixture-generated",
            consentId=v["consentId"],
            generator={
                "model": "pengpt-hand.npz",
                "writer": writer if isinstance(writer, str) else "style-vector",
                "seed": v["seed"],
                "temperature": temp,
                "weightsDownloaded": True,
                "timing": "model-regular",
            },
            points=points,
        )
        write_json(out_dir / f"{gen_id}.json", gen)
        write_svg(out_dir / f"{gen_id}.svg", gen, "SYNTHETIC")

        real_id = f"{v['id']}-real"
        rng = np.random.default_rng(100 + v["seed"])
        human_pts = resample_human(human_paths(v["human_style"]), rng, v["human_style"])
        real = stroke_doc(
            id=real_id,
            volunteerId=v["id"],
            displayName=v["displayName"],
            text=v["text"],
            synthetic=False,
            source="fixture-human",
            consentId=v["consentId"],
            generator={
                "model": "fixture-minimum-jerk",
                "writer": v["human_style"],
                "seed": 100 + v["seed"],
                "temperature": 0,
                "weightsDownloaded": False,
                "timing": "human-minimum-jerk",
            },
            points=human_pts,
        )
        write_json(out_dir / f"{real_id}.json", real)
        write_svg(out_dir / f"{real_id}.svg", real, "FIXTURE · NOT A CUSTOMER SIGNATURE")

        notes_id = f"{v['id']}-notes"
        try:
            npoints, _ = generate_pengpt(
                mini, pen, v["notes"], writer, temp, v["seed"] + 9
            )
            notes_ok = True
        except Exception:
            notes_ok = False
            npoints = human_pts
        notes = stroke_doc(
            id=notes_id,
            volunteerId=v["id"],
            displayName=v["displayName"],
            text=v["notes"],
            synthetic=True,
            source="pengpt" if notes_ok else "fixture-generated",
            consentId=v["consentId"],
            generator={
                "model": "pengpt-hand.npz",
                "writer": writer if isinstance(writer, str) else "style-vector",
                "seed": v["seed"] + 9,
                "temperature": temp,
                "weightsDownloaded": notes_ok,
                "timing": "model-regular",
            },
            points=npoints,
        )
        write_json(out_dir / f"{notes_id}.json", notes)
        write_svg(out_dir / f"{notes_id}.svg", notes, "SYNTHETIC")

        volunteers.append(
            {
                "id": v["id"],
                "displayName": v["displayName"],
                "text": v["text"],
                "consentId": v["consentId"],
                "realId": real_id,
                "generatedId": gen_id,
                "notesId": notes_id,
                "notesText": v["notes"],
            }
        )

    manifest = {
        "generatedWithPengpt": used_model,
        "model": "hand.npz (greydanus/pengpt release models-2026-11-16)",
        "volunteers": volunteers,
    }
    write_json(out_dir / "manifest.json", manifest)
    write_json(out_dir / "volunteers.json", {"volunteers": volunteers})
    return used_model


def one_shot(args):
    mini = load_pen_module(args.pengpt_dir)
    model_path = ensure_model(args.model)
    pen = mini.Pen(model_path)
    writer, style_temp = resolve_writer(pen, args.writer, args.sample)
    temp = args.temperature if args.temperature is not None else (style_temp or 0.0)

    if args.sample and args.sample.endswith((".json", ".jpg", ".jpeg", ".png", ".webp")):
        if args.sample.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            if not args.pengpt_dir:
                sys.exit("photo samples need --pengpt-dir pointing at greydanus/pengpt (hand.py)")
            import subprocess

            out_stem = str(Path(args.out).with_suffix(""))
            cmd = [
                sys.executable,
                str(Path(args.pengpt_dir) / "inference" / "hand.py"),
                args.sample,
                args.text,
                "--model",
                model_path,
                "--out",
                out_stem,
            ]
            print("delegating to", " ".join(cmd))
            subprocess.check_call(cmd)
            npy = out_stem + ".npy"
            writer, style_temp = resolve_writer(pen, args.writer, npy)
            temp = args.temperature if args.temperature is not None else style_temp
        elif args.fit_style:
            fitted = maybe_fit_style(args.pengpt_dir, args.sample, pen, args.text)
            if fitted:
                writer, temp = fitted[0], (args.temperature if args.temperature is not None else fitted[1])

    points, words = generate_pengpt(mini, pen, args.text, writer, temp, args.seed, args.top_k)
    stem = Path(args.out)
    if stem.suffix:
        stem = stem.with_suffix("")
    doc = stroke_doc(
        id=stem.name,
        volunteerId=args.volunteer_id,
        displayName=args.display_name or args.text,
        text=args.text,
        synthetic=True,
        source="pengpt",
        consentId=args.consent_id,
        generator={
            "model": "pengpt-hand.npz",
            "writer": writer if isinstance(writer, str) else "style-vector",
            "seed": args.seed,
            "temperature": temp,
            "weightsDownloaded": True,
            "timing": "model-regular",
        },
        points=points,
    )
    write_json(Path(str(stem) + ".json"), doc)
    write_svg(Path(str(stem) + ".svg"), doc, "SYNTHETIC")
    # also dump native SVG via pen.py for comparison
    native = Path(str(stem) + ".pengpt.svg")
    mini.svg(mini.layout(words), str(native))
    print(f"-> {native} (native PenGPT svg, add SYNTHETIC in UI)")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--pengpt-dir", default=os.environ.get("PENGPT_DIR") or "")
    p.add_argument("--model", default=os.environ.get("PENGPT_MODEL") or "hand.npz")
    p.add_argument("--text", default="Alex Rivera")
    p.add_argument("--writer", default="sam")
    p.add_argument("--sample", default="", help="photo, .npy style vector, or stroke JSON")
    p.add_argument("--fit-style", action="store_true", help="fit a style vector from --sample JSON (torch)")
    p.add_argument("--temperature", type=float, default=None)
    p.add_argument("--top-k", dest="top_k", type=int, default=None)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--out", default="public/fixtures/custom")
    p.add_argument("--volunteer-id", default="local")
    p.add_argument("--display-name", default="")
    p.add_argument("--consent-id", default="")
    p.add_argument("--fixtures", action="store_true", help="rebuild the four volunteer pairs")
    args = p.parse_args()
    if args.fixtures or args.out.endswith("fixtures") or args.out.endswith("fixtures/"):
        build_fixtures(args)
    else:
        one_shot(args)


if __name__ == "__main__":
    main()
