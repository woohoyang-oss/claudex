# Claudex

### OpenClaude + Codex = **Claudex**

> Claude Code's powerful agentic tools, powered by **GPT-5.4 (Codex)**, Ollama, or any LLM.

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ┌──────────────┐         ┌──────────────┐                  ║
║   │  OpenClaude   │    +    │    Codex     │   =   Claudex   ║
║   │ (Claude Code  │         │  (GPT-5.4)  │                  ║
║   │   tool system)│         │             │                  ║
║   └──────────────┘         └──────────────┘                  ║
║                                                              ║
║   All of Claude Code's tools — Bash, Read, Write, Edit,      ║
║   Grep, Glob, Agent, MCP — powered by the model you choose.  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Claudex is a fork of [OpenClaude](https://github.com/Gitlawb/openclaude) with patches for:
- **Codex API strict schema compatibility** — GPT-5.4 via ChatGPT subscription ($20/mo)
- **Reasoning model support** — qwen3, DeepSeek-R1, and other thinking models

---

## How It Works

```
┌─────────────────────────────────────────────┐
│         Claude Code Tool System             │
│  Bash · Read · Write · Edit · Grep · Glob   │
│  Agent · MCP · LSP · Tasks · Memory         │
└──────────────────┬──────────────────────────┘
                   │
            ┌──────▼──────┐
            │  openaiShim  │   ← Anthropic ↔ OpenAI format translation
            │  codexShim   │   ← Codex Responses API adapter
            └──────┬──────┘
                   │
       ┌───────────┼───────────────┐
       ▼           ▼               ▼
   Codex API    Ollama        OpenAI API
   (GPT-5.4)   (qwen3,       (gpt-4o,
               llama, etc)    etc)
```

Claude Code doesn't know it's talking to a different model.

---

## Quick Start — Terminal

### 1. Install

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Clone and build
git clone https://github.com/woohoyang-oss/claudex.git
cd claudex
bun install
bun run build
```

### 2. Set Up Codex Auth (one-time)

```bash
# Install Codex CLI
npm install -g @openai/codex

# Login with your ChatGPT account (opens browser)
codex login
```

> Requires ChatGPT Plus ($20/mo) or Pro ($200/mo) subscription.

### 3. Run

```bash
# Codex (GPT-5.4) — recommended
CLAUDE_CODE_USE_OPENAI=1 OPENAI_MODEL=codexplan node dist/cli.mjs
```

That's it. All tools, streaming, multi-step reasoning — everything works.

### Shell Alias (optional)

```bash
# Add to ~/.zshrc or ~/.bashrc
alias claudex='CLAUDE_CODE_USE_OPENAI=1 OPENAI_MODEL=codexplan node ~/claudex/dist/cli.mjs'
```

---

## Quick Start — VS Code

Use Claudex inside VS Code, just like Claude Code — same UI, same shortcuts, but powered by GPT-5.4.

### Step 1: Install Prerequisites

```bash
# Install VS Code (if not installed)
brew install --cask visual-studio-code

# Install Claude Code extension
code --install-extension anthropic.claude-code
```

### Step 2: Build Claudex

```bash
# Skip if you already did this in the Terminal setup above
git clone https://github.com/woohoyang-oss/claudex.git
cd claudex
bun install
bun run build
```

### Step 3: Set Up Codex Auth

```bash
# Skip if you already did this in the Terminal setup above
npm install -g @openai/codex
codex login
```

### Step 4: Configure VS Code

Open VS Code Settings JSON (**Cmd+Shift+P** → "Preferences: Open User Settings (JSON)") and add:

```json
{
  "claudeCode.claudeProcessWrapper": "/absolute/path/to/claudex/bin/claudex",
  "claudeCode.environmentVariables": [
    { "name": "CLAUDE_CODE_USE_OPENAI", "value": "1" },
    { "name": "OPENAI_MODEL", "value": "codexplan" }
  ]
}
```

> Replace `/absolute/path/to/claudex` with your actual clone path.
> For example: `/Users/yourname/claudex/bin/claudex`

### Step 5: Use It

1. Open VS Code: `code ~/your-project`
2. **Cmd+Shift+P** → **"Claude: New Conversation"**
3. Start coding with GPT-5.4!

Everything works exactly like Claude Code — file editing, terminal commands, multi-step agents — just powered by Codex.

### Switching Models in VS Code

Change the `OPENAI_MODEL` value in your VS Code settings:

| Value | Model | Speed |
|---|---|---|
| `codexplan` | GPT-5.4 (best quality) | Medium |
| `codexspark` | GPT-5.3 Codex Spark | Fast |

---

## Other Providers

### Ollama (local, free)

```bash
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://localhost:11434/v1 \
OPENAI_MODEL=qwen3:14b \
OPENAI_API_KEY=ollama \
node dist/cli.mjs
```

### OpenAI API

```bash
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_API_KEY=sk-... \
OPENAI_MODEL=gpt-4o \
node dist/cli.mjs
```

### DeepSeek / Groq / Together / Mistral / OpenRouter

```bash
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_API_KEY=... \
OPENAI_BASE_URL=https://api.deepseek.com/v1 \
OPENAI_MODEL=deepseek-chat \
node dist/cli.mjs
```

Any OpenAI-compatible API endpoint works.

---

## What's Included

| Feature | Status |
|---|---|
| All tools (Bash, Read, Write, Edit, Grep, Glob, Agent, MCP) | ✅ |
| Streaming | ✅ |
| Multi-step tool chains | ✅ |
| Sub-agents | ✅ |
| Slash commands (/commit, /review, /diff, etc.) | ✅ |
| Memory system | ✅ |
| Images (base64/URL) | ✅ |
| **VS Code integration** | ✅ **NEW** |
| **Codex API (GPT-5.4, GPT-5.3)** | ✅ **NEW** |
| **Reasoning models (qwen3, etc.)** | ✅ **NEW** |

---

## Available Models

| `OPENAI_MODEL` | Model | Auth | Cost |
|---|---|---|---|
| `codexplan` | GPT-5.4 (reasoning: high) | ChatGPT Plus/Pro | $20/mo included |
| `codexspark` | GPT-5.3 Codex Spark | ChatGPT Plus/Pro | $20/mo included |
| `gpt-4o` | GPT-4o | OpenAI API key | Pay-per-token |
| `qwen3:14b` | Qwen3 14B | Ollama | Free |
| `llama3.3:70b` | Llama 3.3 70B | Ollama | Free |
| `deepseek-chat` | DeepSeek V3 | DeepSeek API | Pay-per-token |

---

## Pricing

No separate billing for Codex — it's included in your ChatGPT subscription.

| Plan | Price | Codex Usage |
|---|---|---|
| ChatGPT Plus | $20/mo | 30–150 messages per 5 hours |
| ChatGPT Pro | $200/mo | 300–1,500 messages per 5 hours |
| Ollama | Free | Unlimited (local) |

---

## What Changed from OpenClaude

Only **2 source files** modified + 1 wrapper script added:

| File | Change |
|---|---|
| `src/services/api/openaiShim.ts` | Handle `reasoning` field from thinking models (qwen3, DeepSeek-R1) |
| `src/services/api/codexShim.ts` | `enforceStrictSchema()` — fix tool schemas for Codex strict mode |
| `bin/claudex` | Wrapper script for VS Code integration |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `CLAUDE_CODE_USE_OPENAI` | Yes | Set to `1` to enable |
| `OPENAI_MODEL` | Yes | `codexplan`, `codexspark`, `gpt-4o`, etc. |
| `OPENAI_API_KEY` | Varies | Not needed for Codex or Ollama |
| `OPENAI_BASE_URL` | No | API endpoint (auto-detected for Codex) |
| `CODEX_API_KEY` | No | Override Codex auth token |

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Codex 400 schema error | Already patched in this fork |
| Empty output (qwen3) | Already patched — reasoning field handled |
| `OPENAI_API_KEY required` | Set `OPENAI_API_KEY=ollama` for remote Ollama |
| Codex auth expired | Run `codex login` again |
| VS Code shows "Claude not found" | Check `claudeCode.claudeProcessWrapper` path is correct and absolute |
| VS Code extension not responding | Restart VS Code after changing settings |

---

## Credits

- [OpenClaude](https://github.com/Gitlawb/openclaude) — OpenAI-compatible shim for Claude Code
- [Claude Code](https://claude.ai/code) — Anthropic's agentic coding CLI
- [Codex CLI](https://github.com/openai/codex) — OpenAI's coding agent

## License

Educational and research purposes. Original Claude Code source is property of Anthropic.
OpenAI shim and Codex patches are public domain.
