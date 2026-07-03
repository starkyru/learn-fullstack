# CLAUDE.md

This repo's canonical agent context lives in **[AGENTS.md](./AGENTS.md)** — read it first.
It is agent-agnostic (Claude Code, Cursor, Codex, Copilot all load it) and is the single
source of truth for repo layout, the module map, depth lanes, the shared `packages/*`, run
commands, the **keep-docs-in-sync HARD RULE**, and the exercise-scaffold rules.

Claude Code specifics:

- Slash commands: `/tutor` (learn a topic), `/exam` (knowledge check) — `.claude/commands/`.
- Skills: `check-progress` (`/progress`), `jd-gap-analysis`, `scaffold-module` — `.claude/skills/`.

Do not duplicate guidance here — update AGENTS.md and let this file point to it.
