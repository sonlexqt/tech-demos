#!/usr/bin/env bash
# Re-run the real Impeccable CLI against the slop fixture.
# Exit 2 from `impeccable detect` means the scan completed with primary findings.
set -u
cd "$(dirname "$0")/.."

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Install Node 22.18+ and retry." >&2
  exit 1
fi

tmp="$(mktemp)"
set +e
npx --yes impeccable detect --json fixtures/signer-slop.html >"$tmp"
code=$?
set -e

if [ "$code" -ne 0 ] && [ "$code" -ne 2 ]; then
  echo "impeccable detect failed (exit $code)" >&2
  cat "$tmp" >&2
  rm -f "$tmp"
  exit "$code"
fi

python3 - "$tmp" "$code" <<'PY'
import json, sys, pathlib
raw_path, exit_code = sys.argv[1], int(sys.argv[2])
data = json.loads(pathlib.Path(raw_path).read_text())
for f in data:
    if isinstance(f, dict) and "file" in f:
        f["file"] = "fixtures/signer-slop.html"
out = {
    "source": "npx impeccable detect --json fixtures/signer-slop.html",
    "cli": "impeccable",
    "captured": __import__("datetime").date.today().isoformat(),
    "exit": exit_code,
    "findings": data,
}
pathlib.Path("fixtures/findings.cli.json").write_text(json.dumps(out, indent=2) + "\n")
print(f"Wrote fixtures/findings.cli.json ({len(data)} findings, exit {exit_code})")
PY
rm -f "$tmp"

echo
echo "Human-readable scan (stderr):"
npx --yes impeccable detect fixtures/signer-slop.html || true
