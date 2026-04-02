#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export BROWSER_MCP_CDP_URL="${BROWSER_MCP_CDP_URL:-http://127.0.0.1:9222}"
export CODEX_CLAUDE_BRIDGE_DIR="${CODEX_CLAUDE_BRIDGE_DIR:-$ROOT_DIR/../.runtime/codex-claude-bridge}"
export EXTENSION_BRIDGE_URL="${EXTENSION_BRIDGE_URL:-http://127.0.0.1:8876}"

cd "$ROOT_DIR/mcp/browser-mcp"
npm run build >/dev/null
npm run worker -- "$@"
