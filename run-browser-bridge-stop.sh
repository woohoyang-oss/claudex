#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$ROOT_DIR/.codex-browser-bridge-run/pids"

stop_service() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  if [ ! -f "$pid_file" ]; then
    echo "[browser-stop] $name not running"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "[browser-stop] stopped $name (pid $pid)"
  else
    echo "[browser-stop] stale pid for $name (pid $pid)"
  fi

  rm -f "$pid_file"
}

stop_service worker
stop_service relay
stop_service bridge
