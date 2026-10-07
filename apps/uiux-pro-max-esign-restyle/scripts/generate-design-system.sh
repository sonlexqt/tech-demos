#!/usr/bin/env bash
# Re-run the UI/UX Pro Max Python generator and overwrite
# design-system/lumin-sign/MASTER.md.
#
# Offline. No API keys. search.py uses Python's standard library and the
# skill's committed CSV catalog. Do not set or commit GOOGLE_FONTS_API_KEY —
# that secret is only for the upstream catalog-refresh workflow.
#
# Usage:
#   bun run generate:design-system
#   UIUX_PRO_MAX_SKILL_DIR=/path/to/ui-ux-pro-max-skill bun run generate:design-system
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QUERY="${UIUX_PRO_MAX_QUERY:-e-signature legal SaaS contract signing review and sign}"
PROJECT="${UIUX_PRO_MAX_PROJECT:-Lumin Sign}"
SKILL_DIR="${UIUX_PRO_MAX_SKILL_DIR:-}"
CLEANUP=""

if [[ -z "$SKILL_DIR" ]]; then
  SKILL_DIR="$(mktemp -d)"
  CLEANUP="$SKILL_DIR"
  git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git "$SKILL_DIR"
fi

SEARCH="$SKILL_DIR/src/ui-ux-pro-max/scripts/search.py"
if [[ ! -f "$SEARCH" ]]; then
  echo "search.py not found at $SEARCH" >&2
  echo "Point UIUX_PRO_MAX_SKILL_DIR at a ui-ux-pro-max-skill checkout." >&2
  exit 1
fi

if ! command -v python3 >/dev/null; then
  echo "python3 is required to regenerate MASTER.md." >&2
  exit 1
fi

python3 "$SEARCH" \
  "$QUERY" \
  --design-system \
  -f markdown \
  -p "$PROJECT" \
  --persist \
  --force \
  --output-dir "$ROOT"

if [[ -n "$CLEANUP" ]]; then
  rm -rf "$CLEANUP"
fi

echo "Wrote $ROOT/design-system/lumin-sign/MASTER.md"
echo "The running demo reads this fixture. Restart bun run dev if it is already up."
