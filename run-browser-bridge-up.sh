#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.codex-browser-bridge-run"
LOG_DIR="$RUN_DIR/logs"
PID_DIR="$RUN_DIR/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

start_service() {
  local name="$1"
  shift
  local pid_file="$PID_DIR/$name.pid"
  local log_file="$LOG_DIR/$name.log"

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "[browser-up] $name already running (pid $(cat "$pid_file"))"
    return
  fi

  echo "[browser-up] starting $name"
  nohup "$@" >"$log_file" 2>&1 &
  echo $! > "$pid_file"
  echo "[browser-up] $name pid $(cat "$pid_file") log $log_file"
}

start_service bridge "$ROOT_DIR/run-browser-bridge-extension.sh"
start_service relay "$ROOT_DIR/run-browser-bridge-relay.sh"
start_service worker "$ROOT_DIR/run-browser-bridge-worker.sh"

echo
echo "Browser bridge services are running in the background."
echo "Use ./run-browser-bridge-stop.sh to stop them."
