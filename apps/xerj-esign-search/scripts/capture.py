#!/usr/bin/env python3
"""Capture grep baseline + live XERJ search/gain into fixtures/ (no secrets)."""

from __future__ import annotations

import json
import os
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "corpus"
FIXTURES = ROOT / "fixtures"
XERJ = os.environ.get("XERJ_BIN", str(Path.home() / ".local/bin/xerj"))
URL = os.environ.get("XERJ_URL", "http://127.0.0.1:19200")
PREFIX = "esign"


def run(cmd: list[str], timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def grep_hits(patterns: list[str]) -> dict:
    hits = []
    files_scanned = 0
    bytes_scanned = 0
    matched_files: set[str] = set()
    for path in sorted(CORPUS.rglob("*")):
        if not path.is_file():
            continue
        files_scanned += 1
        raw = path.read_bytes()
        bytes_scanned += len(raw)
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            # PDFs: extract printable strings so grep has a fair text baseline
            text = "".join(chr(b) if 32 <= b < 127 else "\n" for b in raw)
        rel = str(path.relative_to(CORPUS))
        file_bytes = path.stat().st_size
        for i, line in enumerate(text.splitlines(), start=1):
            if any(p.lower() in line.lower() for p in patterns):
                matched_files.add(rel)
                snippet = line.strip()
                if len(snippet) > 280:
                    snippet = snippet[:277] + "..."
                hits.append(
                    {
                        "path": rel,
                        "line": i,
                        "text": snippet,
                    }
                )
    # Token model used for the demo: grep-driven agent reads whole matching files
    # (XERJ README: "a grep hit is a line, and judging that line means opening the whole file").
    retrieved_bytes = 0
    for rel in matched_files:
        retrieved_bytes += (CORPUS / rel).stat().st_size
    return {
        "hits": hits[:40],
        "hitCount": len(hits),
        "matchedFiles": sorted(matched_files),
        "filesScanned": files_scanned,
        "bytesScanned": bytes_scanned,
        "retrievedBytes": retrieved_bytes,
        "retrievedTokensEst": retrieved_bytes // 4,
        "note": "Grep baseline is a case-insensitive substring scan of the corpus. Token/byte cost assumes a grep-driven agent then opens every matching file (XERJ README).",
    }


def xerj_search(query: str) -> dict:
    # `xerj search` is the definition-first code client (match_phrase on `defs`).
    # Document/PDF indices created by autoindex do not have `defs`, so the CLI
    # 400s under strict_unknown_fields. Capture that honestly; ranked passages
    # for this corpus come from the documented ES `_search` + `_passage` path.
    cmd = [
        XERJ,
        "search",
        "--url",
        URL,
        "--prefix",
        PREFIX,
        "-k",
        "5",
        "--full",
        "800",
        "--json",
        query,
    ]
    proc = run(cmd)
    raw_out = proc.stdout
    raw_err = proc.stderr
    parsed = None
    if raw_out.strip():
        try:
            parsed = json.loads(raw_out)
        except json.JSONDecodeError:
            parsed = None
    return {
        "command": cmd,
        "exitCode": proc.returncode,
        "stdout": raw_out,
        "stderr": raw_err,
        "parsed": parsed,
        "note": "xerj search targets defs/name (code). This docs/PDF corpus has body/title/text only, so the CLI returns HTTP 400. See xerj-es-passages.json for the working ES _search + _passage capture.",
    }


def es_passage_search(query: str) -> dict:
    import urllib.request

    body = {
        "size": 5,
        "query": {
            "bool": {
                "should": [
                    {
                        "multi_match": {
                            "query": query,
                            "fields": ["body", "title", "text"],
                            "type": "best_fields",
                        }
                    },
                    {"match_phrase": {"body": {"query": query, "boost": 2}}},
                ]
            }
        },
        "_source": ["ax_path", "title", "page", "ax_format"],
        "fields": ["_passage"],
        "highlight": {"fields": {"body": {"fragment_size": 240, "number_of_fragments": 1}}},
    }
    req = urllib.request.Request(
        f"{URL}/{PREFIX}-*/_search",
        data=json.dumps(body).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    hits = []
    retrieved_bytes = 0
    for h in payload.get("hits", {}).get("hits", []):
        src = h.get("_source") or {}
        passage = None
        fields = h.get("fields") or {}
        p_field = fields.get("_passage")
        if isinstance(p_field, list) and p_field:
            passage = p_field[0]
        elif isinstance(p_field, dict):
            passage = p_field
        text = ""
        if isinstance(passage, dict):
            text = passage.get("text") or ""
        if not text:
            hl = h.get("highlight", {}).get("body") or []
            text = hl[0] if hl else ""
        retrieved_bytes += len(text.encode("utf-8"))
        hits.append(
            {
                "index": h.get("_index"),
                "score": h.get("_score"),
                "path": src.get("ax_path"),
                "title": src.get("title"),
                "page": src.get("page"),
                "format": src.get("ax_format"),
                "passage": passage,
                "text": text,
                "highlight": (h.get("highlight") or {}).get("body"),
            }
        )
    savings = payload.get("_savings")
    return {
        "request": body,
        "took": payload.get("took"),
        "total": payload.get("hits", {}).get("total"),
        "hits": hits,
        "retrievedBytes": retrieved_bytes,
        "retrievedTokensEst": retrieved_bytes // 4,
        "savings": savings,
        "hints": payload.get("_xerj"),
    }


def xerj_gain() -> dict:
    proc = run([XERJ, "gain", "--url", URL, "--json"])
    parsed = None
    if proc.stdout.strip():
        try:
            parsed = json.loads(proc.stdout)
        except json.JSONDecodeError:
            parsed = None
    text = run([XERJ, "gain", "--url", URL])
    return {
        "json": parsed,
        "jsonStdout": proc.stdout,
        "jsonStderr": proc.stderr,
        "textStdout": text.stdout,
        "textStderr": text.stderr,
    }


def init_dry_run() -> dict:
    proc = run([XERJ, "init", "--url", URL, "--dry-run"], timeout=20)
    return {"stdout": proc.stdout, "stderr": proc.stderr, "exitCode": proc.returncode}


def main() -> None:
    questions = json.loads((FIXTURES / "questions.json").read_text())
    answers = json.loads((FIXTURES / "answers.json").read_text())
    grep_out = {}
    xerj_cli = {}
    xerj_es = {}
    for q in questions["queries"]:
        print("query", q["id"])
        grep_out[q["id"]] = grep_hits(q["grepPatterns"])
        xerj_cli[q["id"]] = xerj_search(q["xerjSearch"])
        xerj_es[q["id"]] = es_passage_search(q["xerjSearch"])
        time.sleep(0.05)

    gain = xerj_gain()
    init = init_dry_run()

    (FIXTURES / "grep-results.json").write_text(json.dumps(grep_out, indent=2) + "\n")
    (FIXTURES / "xerj-search.json").write_text(json.dumps(xerj_cli, indent=2) + "\n")
    (FIXTURES / "xerj-es-passages.json").write_text(json.dumps(xerj_es, indent=2) + "\n")
    (FIXTURES / "xerj-gain.json").write_text(json.dumps(gain.get("json"), indent=2) + "\n")
    (FIXTURES / "xerj-gain.txt").write_text(gain.get("textStdout") or gain.get("jsonStdout") or "")
    (FIXTURES / "xerj-init-dry-run.txt").write_text((init.get("stdout") or "") + (init.get("stderr") or ""))
    meta = {
        "capturedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "xerjVersion": run([XERJ, "-V"]).stdout.strip(),
        "url": URL,
        "prefix": PREFIX,
        "autoindex": {
            "files": 11,
            "records": 44,
            "datasets": ["esign-docs", "esign-ops"],
            "embedder": "lexical (default, offline)",
        },
        "commands": {
            "node": "xerj --insecure --data-dir <outside-corpus> --port 19200 --disable-feedback",
            "index": "xerj autoindex ./corpus --url http://127.0.0.1:19200 --prefix esign --state-dir <outside> --progress plain --disable-feedback --json",
            "search": 'xerj search --url … --prefix esign -k 5 --full 800 --json --disable-feedback "<q>"',
            "gain": "xerj gain --url … --json --disable-feedback",
            "es": 'POST /esign-*/_search with _source projection + fields:["_passage"]',
        },
        "note": "No API keys. Node started with --insecure. Token estimates are bytes/4. xerj gain counts searches/hit rate/latency from the audit log — it does not print a token-savings dollar figure on this build. xerj search CLI is the code/defs client and 400s on this docs corpus; ranked passages are from POST /esign-*/_search with fields:['_passage'].",
        "answerKeyIds": list(answers.keys()),
    }
    (FIXTURES / "capture-meta.json").write_text(json.dumps(meta, indent=2) + "\n")
    print("wrote fixtures")
    print(gain.get("textStdout", "")[:2000])


if __name__ == "__main__":
    main()
