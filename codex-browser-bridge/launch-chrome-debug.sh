#!/usr/bin/env bash
set -euo pipefail

resolve_chrome_path() {
  if [ -n "${BROWSER_MCP_CHROME_PATH:-}" ]; then
    echo "$BROWSER_MCP_CHROME_PATH"
    return 0
  fi

  local candidates=(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
    "/usr/bin/google-chrome"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done

  if command -v google-chrome >/dev/null 2>&1; then
    command -v google-chrome
    return 0
  fi

  if command -v google-chrome-stable >/dev/null 2>&1; then
    command -v google-chrome-stable
    return 0
  fi

  if command -v chromium-browser >/dev/null 2>&1; then
    command -v chromium-browser
    return 0
  fi

  if command -v chromium >/dev/null 2>&1; then
    command -v chromium
    return 0
  fi

  return 1
}

CHROME_PATH="$(resolve_chrome_path || true)"
PROFILE_DIR="${BROWSER_MCP_CHROME_PROFILE:-/tmp/browser-mcp-chrome}"

if [ -z "$CHROME_PATH" ]; then
  echo "Could not find a Chrome/Chromium executable." >&2
  echo "Set BROWSER_MCP_CHROME_PATH to your browser binary and retry." >&2
  exit 1
fi

exec "$CHROME_PATH" \
  --remote-debugging-port=9222 \
  --user-data-dir="$PROFILE_DIR"
