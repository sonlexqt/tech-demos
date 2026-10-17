#!/usr/bin/env python3
"""Assemble fixtures/demo.json — the offline view model the UI renders."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
F = ROOT / "fixtures"


def score(hit_texts: list[str], hit_paths: list[str], key: dict) -> dict:
    blob = "\n".join(hit_texts).lower()
    needles = key["mustIncludeAny"]
    needles_found = [n for n in needles if n.lower() in blob]
    preferred = key.get("preferredFiles") or []
    top = (hit_paths[0] if hit_paths else "") or ""
    top_preferred = any(p.lower() in top.lower() for p in preferred)
    any_preferred = any(any(p.lower() in (hp or "").lower() for p in preferred) for hp in hit_paths)
    return {
        "needlesFound": needles_found,
        "needlesMissed": [n for n in needles if n not in needles_found],
        "containsAnswer": bool(needles_found),
        "topHitPreferred": top_preferred,
        "anyPreferredFile": any_preferred,
    }


def rel_path(value: str | None) -> str:
    if not value:
        return ""
    # ax_path may be absolute
    marker = "/corpus/"
    if marker in value:
        return value.split(marker, 1)[1]
    return value


def main() -> None:
    questions = json.loads((F / "questions.json").read_text())
    answers = json.loads((F / "answers.json").read_text())
    grep = json.loads((F / "grep-results.json").read_text())
    es = json.loads((F / "xerj-es-passages.json").read_text())
    cli = json.loads((F / "xerj-search.json").read_text())
    gain = json.loads((F / "xerj-gain.json").read_text())
    gain_text = (F / "xerj-gain.txt").read_text()
    meta = json.loads((F / "capture-meta.json").read_text())

    items = []
    for q in questions["queries"]:
        qid = q["id"]
        g = grep[qid]
        x = es[qid]
        key = answers[qid]
        g_paths = g["matchedFiles"]
        g_texts = [h["text"] for h in g["hits"]] + g_paths
        x_paths = [rel_path(h.get("path")) or (h.get("title") or "") for h in x["hits"]]
        x_texts = [(h.get("text") or "") for h in x["hits"]]
        g_score = score(g_texts, g_paths, key)
        x_score = score(x_texts, x_paths, key)
        ratio = None
        if x["retrievedBytes"] and g["retrievedBytes"]:
            ratio = round(g["retrievedBytes"] / x["retrievedBytes"], 2)
        items.append(
            {
                "id": qid,
                "label": q["label"],
                "question": q["question"],
                "groundTruth": key["answer"],
                "preferredFiles": key.get("preferredFiles") or [],
                "grep": {
                    "hits": g["hits"][:12],
                    "hitCount": g["hitCount"],
                    "matchedFiles": g["matchedFiles"],
                    "retrievedBytes": g["retrievedBytes"],
                    "retrievedTokensEst": g["retrievedTokensEst"],
                    "filesScanned": g["filesScanned"],
                    "bytesScanned": g["bytesScanned"],
                    "note": g.get("note"),
                    "correctness": g_score,
                },
                "xerj": {
                    "hits": [
                        {
                            "path": rel_path(h.get("path")),
                            "title": h.get("title"),
                            "page": h.get("page"),
                            "score": h.get("score"),
                            "index": h.get("index"),
                            "format": h.get("format"),
                            "text": h.get("text"),
                            "passage": h.get("passage"),
                        }
                        for h in x["hits"]
                    ],
                    "tookMs": x.get("took"),
                    "total": x.get("total"),
                    "retrievedBytes": x["retrievedBytes"],
                    "retrievedTokensEst": x["retrievedTokensEst"],
                    "savings": x.get("savings"),
                    "hints": x.get("hints"),
                    "correctness": x_score,
                    "cli": {
                        "exitCode": cli[qid]["exitCode"],
                        "stderr": (cli[qid].get("stderr") or "")[:500],
                        "note": cli[qid].get("note"),
                    },
                },
                "byteRatioGrepOverXerj": ratio,
            }
        )

    demo = {
        "mode": "fixture",
        "title": "Lumin Sign · corpus search desk",
        "library": {
            "name": "XERJ",
            "url": "https://github.com/xerj-org/xerj",
            "license": "Apache-2.0",
            "version": meta.get("xerjVersion"),
        },
        "meta": meta,
        "gain": {"json": gain, "text": gain_text},
        "questions": items,
        "caveat": "XERJ's own case study: retrieval wins on private, internal, niche, or post-cutoff material, and is neutral to harmful on popular public libraries the model already knows. This desk is a private fixture corpus.",
        "pageindexNote": "Question “Liability cap (long MSA)” uses the same Lumin Sign × Acme Holdings article style as apps/pageindex-contract-qa (PR #12). PageIndex walks a TOC tree to Article 10 → 10.2.1. XERJ ranks passages across the mixed corpus; Harbor MSA liability pages can outrank 10.2.1 because they also say “cap”. That is a real ranking result, not a gamed one.",
    }
    (F / "demo.json").write_text(json.dumps(demo, indent=2) + "\n")
    print("wrote", F / "demo.json")


if __name__ == "__main__":
    main()
