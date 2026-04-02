#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIDGE_DIR="$ROOT_DIR/codex-browser-bridge"
MCP_DIR="$BRIDGE_DIR/mcp/browser-mcp"
RUNTIME_DIR="$ROOT_DIR/.runtime/codex-claude-bridge"
OPEN_DIR="$RUNTIME_DIR/codex-inbox/open"
DONE_DIR="$RUNTIME_DIR/codex-inbox/done"
RUN_DIR="$ROOT_DIR/.codex-browser-bridge-run"
LOG_DIR="$RUN_DIR/logs"

echo "[browser-setup] root: $ROOT_DIR"

mkdir -p "$RUNTIME_DIR" "$OPEN_DIR" "$DONE_DIR" "$LOG_DIR"

echo "[browser-setup] installing root dependencies"
bun install

echo "[browser-setup] installing browser-mcp dependencies"
npm --prefix "$MCP_DIR" install

echo "[browser-setup] building browser-mcp"
npm --prefix "$MCP_DIR" run build

cat > "$ROOT_DIR/.mcp.json" <<EOF
{
  "mcpServers": {
    "browser-mcp": {
      "command": "npm",
      "args": ["start"],
      "cwd": "$MCP_DIR",
      "env": {
        "BROWSER_MCP_CDP_URL": "http://127.0.0.1:9222",
        "CODEX_CLAUDE_BRIDGE_DIR": "$RUNTIME_DIR"
      }
    }
  }
}
EOF

echo "[browser-setup] wrote $ROOT_DIR/.mcp.json"
echo
echo "Browser stack is prepared."
echo "Next:"
echo "1. bun run browser:oneclick"
echo "2. Load unpacked Chrome extension from:"
echo "   $BRIDGE_DIR/chrome-extension"
