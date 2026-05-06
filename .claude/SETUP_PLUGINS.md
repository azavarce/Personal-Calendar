# Claude Code Plugin Setup

This project uses several Claude Code skills and plugins. Some travel with the repo (vendored into `.claude/`); others are runtime plugins that must be installed once per device.

## Already vendored (no install needed)

These live in `.claude/skills/` and load automatically in any Claude Code session that opens this repo, anywhere — desktop CLI, web, future devices:

| Skill | Source | Purpose |
|---|---|---|
| **impeccable** | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Frontend design discipline (typography, color, motion, layout, audit, polish, etc.) |
| **frontend-design** | [anthropics/claude-code](https://github.com/anthropics/claude-code) | Anti-AI-slop aesthetic direction |
| **react-native-design** | (custom) | Mobile-first patterns, Expo conventions |
| **mobile-ui-review** | (custom) | Pre-ship punch-list for screens |
| **superpowers** (14 skills) | [obra/superpowers](https://github.com/obra/superpowers) | TDD, systematic debugging, brainstorming, subagent-driven dev, writing plans, writing skills, code review (giving + receiving), verification-before-completion, parallel agent dispatch, finishing branches, git worktrees |

## Runtime plugins (install on each device)

The four below can't be vendored because they include MCP servers, hooks, or runtime code that needs to live in your global Claude Code config. Install them once per machine you use.

### get-shit-done-cc

A meta-prompting and spec-driven development system: 86 skills + 33 subagents that drive a project from idea to ship. Core loop is `discuss → plan → execute`.

```bash
npx get-shit-done-cc --claude --global
```

Use `--minimal` flag if you only want the 6 core skills (lower token overhead):

```bash
npx get-shit-done-cc --claude --global --minimal
```

After install, restart Claude Code. Then from any project: `/gsd-new-project`, or ask Claude to run `gsd-help`.

Source: [glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done)

### superpowers (the plugin form, optional — we already vendored the skills)

We've already vendored the **skills** portion of superpowers into `.claude/skills/`. The plugin form additionally registers slash commands and gets you Anthropic's official update channel. If you'd like that, install it via the Claude Code marketplace:

```
/plugin install superpowers@claude-plugins-official
```

If you do install both, the plugin's skills will take precedence over the vendored copies. That's fine — they're the same content.

### context-mode

Sandboxes tool output to reduce context window consumption (claims ~98% reduction). Adds 6 sandbox-executor MCP tools, session continuity (SQLite + full-text search), and slash commands like `/context-mode:ctx-stats`, `/context-mode:ctx-doctor`. Recommended for long sessions on large codebases.

```
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode
```

Source: [mksglu/context-mode](https://github.com/mksglu/context-mode) (Elastic License 2.0)

### claude-mem

Persistent memory across Claude Code sessions. Hooks into the session lifecycle, captures tool usage, generates semantic summaries via Claude's agent SDK, stores in SQLite + vector search. Claims ~95% token reduction over time as it learns your project.

```bash
npx claude-mem install
```

After install, future sessions automatically restore relevant context. Source: [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)

## Order of operations (fresh machine)

If you're setting up a new desktop:

1. Clone this repo and `git checkout claude/personal-calendar-goals-jHzLE`.
2. Run `npx get-shit-done-cc --claude --global` (or `--minimal`).
3. Run `npx claude-mem install`.
4. In Claude Code, run `/plugin marketplace add mksglu/context-mode` then `/plugin install context-mode@context-mode`.
5. Optionally `/plugin install superpowers@claude-plugins-official` to also get the plugin form.
6. Restart Claude Code.
7. Open this repo in Claude Code — the vendored skills load automatically.
