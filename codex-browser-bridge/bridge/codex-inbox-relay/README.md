# Codex Inbox Relay

Local relay that converts extension bridge inbox items into file-based Codex inbox packets.

## Purpose

- watch `<repo-root>/.runtime/codex-claude-bridge/inbox.json`
- export each unseen handoff or action-request as a packet under `codex-inbox/open/`
- move completed items from `codex-inbox/open/` to `codex-inbox/done/`
- generate both `.json` and `.md` variants for easy inspection or downstream automation

## Run

`bun run browser:relay`

Default output directory:

`<repo-root>/.runtime/codex-claude-bridge/codex-inbox/open`

Completed packets are archived under:

`<repo-root>/.runtime/codex-claude-bridge/codex-inbox/done`

## Environment

- `CODEX_CLAUDE_BRIDGE_DIR`
- `CODEX_INBOX_RELAY_INTERVAL_MS`
