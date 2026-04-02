#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
TARGET="$ROOT"

cd "$TARGET"
bun install
bun run build

echo
echo "Claudex is ready at $TARGET"
echo "Run: $TARGET/codex-browser-bridge/run-claudex.sh"
