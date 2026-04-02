#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_MODEL="${OPENAI_MODEL:-codexplan}"

exec node dist/cli.mjs "$@"
