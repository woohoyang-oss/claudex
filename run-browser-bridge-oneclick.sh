#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.codex-browser-bridge-run"
LOG_DIR="$RUN_DIR/logs"
PID_DIR="$RUN_DIR/pids"
CHROME_PID_FILE="$PID_DIR/chrome.pid"
CHROME_LOG="$LOG_DIR/chrome.log"

mkdir -p "$LOG_DIR" "$PID_DIR"

"$ROOT_DIR/setup-browser-bridge.sh"
"$ROOT_DIR/run-browser-bridge-up.sh"

if [ -f "$CHROME_PID_FILE" ] && kill -0 "$(cat "$CHROME_PID_FILE")" 2>/dev/null; then
  echo "[browser-oneclick] chrome already running (pid $(cat "$CHROME_PID_FILE"))"
else
  echo "[browser-oneclick] launching Chrome with remote debugging"
  nohup "$ROOT_DIR/launch-browser-bridge-chrome.sh" >"$CHROME_LOG" 2>&1 &
  echo $! > "$CHROME_PID_FILE"
  echo "[browser-oneclick] chrome pid $(cat "$CHROME_PID_FILE") log $CHROME_LOG"
fi

echo
echo "One-click browser stack startup completed."
echo "Load unpacked extension from:"
echo "  $ROOT_DIR/codex-browser-bridge/chrome-extension"
echo
echo "If Codex Desktop is opened in this repo, .mcp.json is now ready at:"
echo "  $ROOT_DIR/.mcp.json"
