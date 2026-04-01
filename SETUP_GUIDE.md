# Claudex Setup Guide

**Claudex = Claude Code + Codex** — Run Claude Code's full tool system with GPT-5.4 (Codex), Ollama, or any OpenAI-compatible LLM.

---

## What is Claudex?

Claude Code is Anthropic's agentic coding CLI with powerful built-in tools (Bash, file read/write/edit, grep, glob, agents, MCP, etc.). **Claudex patches OpenClaude to work with OpenAI's Codex API (GPT-5.4)**, giving you Claude Code's UX powered by GPT-5.4 — at no extra cost beyond your ChatGPT subscription.

```
┌─────────────────────────────────────────┐
│          Claude Code Tool System        │
│  (Bash, Read, Write, Edit, Grep, ...)   │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │  openaiShim  │  ← format translation layer
        └──────┬──────┘
               │
     ┌─────────┼─────────────┐
     ▼         ▼             ▼
  Codex     Ollama      OpenAI API
 (GPT-5.4) (qwen3,etc)  (gpt-4o)
```

---

## Prerequisites

- macOS (Apple Silicon recommended)
- Node.js v22+
- [Bun](https://bun.sh) runtime
- ChatGPT Plus ($20/mo) or Pro ($200/mo) subscription — for Codex

---

## Quick Start

### 1. Clone & Build

```bash
git clone https://github.com/woohoyang-oss/claudex.git
cd claudex
bun install
bun run build
```

### 2. Set Up Codex Auth

```bash
npm install -g @openai/codex
codex login    # Opens browser → sign in with ChatGPT account
               # Creates ~/.codex/auth.json automatically
```

### 3. Run

```bash
# Codex (GPT-5.4) — recommended
CLAUDE_CODE_USE_OPENAI=1 OPENAI_MODEL=codexplan node dist/cli.mjs

# Codex Spark (GPT-5.3, faster)
CLAUDE_CODE_USE_OPENAI=1 OPENAI_MODEL=codexspark node dist/cli.mjs

# Ollama (local/remote, free)
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://localhost:11434/v1 \
OPENAI_MODEL=qwen3:14b \
OPENAI_API_KEY=ollama \
node dist/cli.mjs
```

### 4. (Optional) Shell Aliases

Add to `~/.zshrc`:

```bash
alias claudex='CLAUDE_CODE_USE_OPENAI=1 OPENAI_MODEL=codexplan node ~/claudex/dist/cli.mjs'
alias claudex-spark='CLAUDE_CODE_USE_OPENAI=1 OPENAI_MODEL=codexspark node ~/claudex/dist/cli.mjs'
```

---

## What Changed (2 files)

### `src/services/api/openaiShim.ts` — Reasoning model support

Models like qwen3 return responses in `reasoning` field instead of `content` when tools are present. This patch handles both fields in streaming and non-streaming modes.

### `src/services/api/codexShim.ts` — Codex strict schema compatibility

Codex API enforces strict JSON Schema validation on tool definitions. This patch adds `enforceStrictSchema()` which:
- Puts all properties in `required` array
- Sets `additionalProperties: false`
- Removes disallowed keywords (`format`, `pattern`, `propertyNames`, etc.)
- Wraps optional fields as nullable (`anyOf: [type, {type: "null"}]`)
- Recursively processes nested schemas

---

## Available Models

| `OPENAI_MODEL` | Actual Model | Auth | Notes |
|---|---|---|---|
| `codexplan` | GPT-5.4 (reasoning: high) | ChatGPT subscription | Best quality |
| `codexspark` | GPT-5.3-codex-spark | ChatGPT subscription | Faster |
| `gpt-4o` | GPT-4o | OpenAI API key | Standard API billing |
| `qwen3:14b` | Qwen3 14B | None (Ollama) | Free, local |

---

## Pricing

| Plan | Monthly | Codex Included |
|---|---|---|
| ChatGPT Plus | $20 | Yes (30-150 msgs/5hr) |
| ChatGPT Pro | $200 | Yes (300-1500 msgs/5hr) |
| Ollama | Free | N/A |

No separate API billing needed for Codex — it's included in your ChatGPT subscription.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Empty output (qwen3) | Reasoning field patch already applied |
| Codex 400 schema error | Strict schema patch already applied |
| `OPENAI_API_KEY required` (remote Ollama) | Set `OPENAI_API_KEY=ollama` as dummy |
| Codex auth expired | Run `codex login` again |
| Slow response (qwen3 + tools) | qwen3 thinking is verbose with tools; try `qwen3-nothink:14b` |

---

## Credits

- [OpenClaude](https://github.com/Gitlawb/openclaude) — OpenAI-compatible provider shim for Claude Code
- [Claude Code](https://claude.ai/code) — Anthropic's agentic coding CLI
- [Codex CLI](https://github.com/openai/codex) — OpenAI's coding agent
