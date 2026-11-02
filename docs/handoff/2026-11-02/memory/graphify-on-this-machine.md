---
name: graphify-on-this-machine
description: "Graphify CLI is installed in the system Python 3.12 on the Windows machine; the graph is per checkout (npm run graph), never committed; per-call hooks are off because they cost 1.4 to 2.3 s per tool call here"
metadata:
  node_type: memory
  type: project
  originSessionId: 5d7d3927-c78d-4a5e-b7cc-cb60fb173bc4
  modified: 2026-10-29T07:50:43.559Z
---

Graphify 0.9.97 was installed on 2026-10-29 with `pip install` from a clone of Graphify-Labs/graphify (commit 0a8cd4e) into `C:\Users\skree\AppData\Local\Programs\Python\Python312`, whose `Scripts` folder is on PATH, so `graphify` works in Git Bash and PowerShell. No `uv`, `pipx` or agent CLI on this machine, and no LLM API keys, so community labels stay hub-derived and the semantic pass over docs is off.

**Why:** `CLAUDE.md` day-1 item 8 asked for Graphify; the repository has 1054 files and 471k words of specs. `graphify-out/` is git-ignored because eight parallel worktrees would conflict on a committed `graph.json`; each worktree builds its own in 40 to 60 s (11 s idle, a few minutes after a large Markdown edit because code-span mentions are re-resolved). The PreToolUse hooks that `graphify claude install --project` writes were measured at 1.4 to 2.3 s on every Bash, Read, Grep and Glob call (Python starts in 0.4 s here, the graphify import adds 0.7 s), so they were left out of the committed settings.

**How to apply:** in a new worktree run `npm run graph` before exploring (the plan, build and review skills expect `graphify-out/graph.json`); query with `graphify explain`, `affected`, `query --budget 3400`, `path --undirected`. Rebuild after code or spec changes with `npm run graph`, or `npm run graph:force` after deletions. Runbook: `docs/research/11-graphify.md`. Do not install the per-call hooks or git hooks here without asking; see [[windows-machine-no-blender]] for the rest of the machine's quirks and [[windows-3d-review-with-playwright-chrome]] for why worktrees also need `npm ci`.
