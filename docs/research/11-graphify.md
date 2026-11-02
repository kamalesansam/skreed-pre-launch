# Graphify: the repository's knowledge graph

Written 2026-10-29. Graphify (Graphify-Labs/graphify, Apache-2.0) turns the repository into a queryable graph of files, symbols, spec headings and the edges between them, parsed locally with tree-sitter and nothing sent anywhere. `CLAUDE.md`'s day-1 list asked for it (item 8) once the repository had more than a handful of files; it has 1054 tracked files and 471,000 words of Markdown, so a session that greps and reads its way to an answer spends far more than one that asks the graph first. This note records what was installed, what the graph holds, how to keep it current, and what was left off and why.

## 1. What is where

| Piece | Location | Committed |
|---|---|---|
| The CLI (`graphify`), version 0.9.97 | Python 3.12's `Scripts` folder on this machine (`pip install`, built from the clone at commit `0a8cd4e`) | no (per machine) |
| The Claude Code skill `/graphify` and its `references/` | `.claude/skills/graphify/` | yes |
| The skill's registration line and the always-on rules | `CLAUDE.md`, section "graphify" | yes |
| What the graph leaves out | `.graphifyignore` | yes |
| The build and refresh commands | `package.json`: `npm run graph`, `npm run graph:force` | yes |
| The loop's use of the graph | `.claude/commands/ship-section.md`, `.claude/skills/{plan,build,review}/SKILL.md` | yes |
| The graph itself | `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, `graph.html`, `cache/`) | no (`.gitignore`) |

The graph is not committed because it is rewritten whole on every build and the repository works on eight branches in parallel worktrees: a committed `graph.json` would conflict on every merge. Each checkout builds its own.

`graphify install --project --platform claude` also writes a two-line `.claude/CLAUDE.md` that registers the skill. Claude Code's memory page lists `./.claude/CLAUDE.md` as an alternative to `./CLAUDE.md`, not as an addition, so that file was removed and its line lives in the root `CLAUDE.md` instead, where the rest of the rules are. If a reinstall recreates it, delete it again.

## 2. Install on another machine

The graph needs the CLI. Python 3.10 or newer, then one of:

```bash
uv tool install graphifyy
```

```bash
pipx install graphifyy
```

```bash
pip install graphifyy
```

The PyPI name is `graphifyy` (two y's); the command is `graphify`. On Windows plain `pip install` is the one whose launcher lands on PATH without a shell change. The skill, the rules and the ignore file are already in the repository; nothing else to register. Check with `graphify --version`, then build the graph with `npm run graph`.

## 3. Build and refresh

```bash
npm run graph
```

That runs `graphify update .`: a full build when `graphify-out/graph.json` is missing, an incremental one after that (changed files only, their nodes replaced). No LLM, no key, no network. Run it in a fresh checkout or worktree, after changing code or specs, and after a `git pull` or branch switch. The ship loop runs it inside the build skill and again after the commit on PASS.

```bash
npm run graph:force
```

The same with `--force`, for a refactor that deletes code: without it graphify refuses to write a graph smaller than the one on disk.

The builds on the Windows machine, 2026-10-29:

| Measure | Value |
|---|---|
| Files read | 363 |
| Nodes | 3660 |
| Edges | 6700 (92% read straight from the source, 8% inferred) |
| Communities | 208 |
| First build, or a clean rebuild | 38 to 52 s (12 workers) |
| Rebuild after a one-file code change | 35 s (every `.ts`, `.mjs` and `.astro` file is re-read for cross-file resolution; the rest come from the AST cache) |
| Rebuild after a large Markdown edit (`CLAUDE.md`, this note) | 158 to 168 s (every code-span mention is resolved against the symbols again) |
| Run with nothing changed | 11 s |
| `graph.json` | 2.9 MB |

## 4. What the graph holds

| Source | What becomes a node | Nodes in the first build |
|---|---|---|
| `.ts`, `.mjs`, `.js`, `.astro`, `.py`, `.sh` | the file, every function, class, constant and method; edges for imports, calls, re-exports, inheritance | 2556 |
| `.md` (specs, research, brand, `DESIGN.md`, `CLAUDE.md`) | the file and every heading; edges from a heading to the symbols it names in code spans (509 `references` edges) and to the files it links | 969 |
| `package.json`, `tsconfig.json` and other config `.json` | keys as nodes | 56 |

Left out by `.graphifyignore`: `prototypes/` (earlier experiments, not the site), `tests/fixtures/`, `src/assets/hero/pieces.json` and the flux job files (data), and every image, video, font, model and binary. Left out by graphify itself: `.css` (no extractor), `.txt` and `.html` (documents without a structural extractor; they need the semantic pass in section 9), `package-lock.json`, and everything `.gitignore` ignores. Data arrays such as `shades-240.json` yield no nodes, so they need no rule.

Community names are the name of each community's hub ("quiz-decode.test.ts", "Hero on the real stack: architecture") because no LLM named them; section 9 says how to name them if wanted.

## 5. Asking the graph

```bash
graphify explain "decode.ts"
```

One file or symbol and all of its connections, each with the file and line it was read from. For `decode.ts` it lists the four files that import it and the eleven symbols it contains.

```bash
graphify affected "decode.ts" --depth 1
```

Everything that depends on a symbol or file: the importers, the callers, the dynamic imports. The build skill runs it on every symbol it changes; the review skill runs it to check the blast radius.

```bash
graphify query "quiz decode labels animation" --budget 3400
```

A scoped subgraph for a plain question, breadth first from the best-matching nodes. The default budget of 2000 tokens truncates a wide question; the output says what budget shows everything. `--dfs` traces one chain instead. Matching is by substring on node labels, so use the words the code and specs use (`decode`, `gate`, `carousel`), not synonyms.

```bash
graphify path "labels.ts" "decode.ts" --undirected
```

The shortest path between two things. Edges are directed (imports point from importer to imported), so a plain `path` answers "does A reach B"; `--undirected` answers "how are A and B related".

```bash
graphify god-nodes --top 12
```

The most connected symbols: `three`, `startHero()`, `createGems()`, `createRoomDirector()`, `createCarousel()`, `HeroContext`, `mountRoom()`, `toPoster()`.

`graphify-out/GRAPH_REPORT.md` is the broad view: communities, hubs, surprising connections, suggested questions. `graphify-out/graph.html` is the same graph to click through in a browser. Both are for orientation; a scoped query is the cheaper answer to a specific question.

## 6. Inside the loop

- `/ship-section` runs `graphify update .` before the plan skill (step 0) and after the commit on PASS (step 6).
- The plan skill asks the graph (`query`, `explain`, `path`) before it reads files, and writes a ninth spec item, "Touches": the files and symbols the graph surfaced for the section.
- The build skill finds the code through the graph, runs `graphify affected` on every symbol it will change, rebuilds the graph after the change, and hands the dependents to the review.
- The review skill checks the blast radius with `graphify affected` and `graphify path`, and treats the graph as a map, never as evidence: the screenshots and the diff decide.

## 7. The sessions' rules

The "graphify" section of `CLAUDE.md` is read at the start of every session: ask the graph before the first grep or read, put that rule into subagent prompts, read the report only for broad review, rebuild after changes, build first in a fresh checkout, and ask before running anything that costs tokens.

## 8. The per-call hooks, off by default

`graphify claude install --project` also registers two Claude Code PreToolUse hooks in `.claude/settings.json`: before every `Bash` or `Grep` call and before every `Read` or `Glob` call, it runs `graphify hook-guard`, which injects a reminder to query the graph and lists what the graph already knows about the file or pattern. They were installed on 2026-10-29, measured, and taken out of the committed settings:

| Call | Time added by the guard (Windows machine) | Output |
|---|---|---|
| `Grep` for `decode` | 1.0 to 1.2 s | the nudge, with five matching symbols |
| `Bash` running `npm run test:unit` | 1.7 s | none |
| `Bash` running `git status` | 1.4 s | none |
| `Read` of `docs/specs/quiz.md` | 1.8 s | none |
| `Read` of a file outside the repository | 2.3 s | none |
| `Glob` | 1.9 s | none |

Python starts in 0.4 s on this machine and the graphify import takes 0.7 s more, so the floor is paid on every one of the four most frequent tools, most often for no output. A committed bare `graphify` command would also fail on every tool call on a machine without the CLI (a cloud session, a new laptop): Claude Code lets the call go ahead but prints a hook error notice in the transcript each time. The `CLAUDE.md` rules and the loop's explicit steps give the same steering without the per-call cost.

To turn the hooks on for one machine, put this in `.claude/settings.local.json` (git-ignored):

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Grep", "hooks": [{ "type": "command", "command": "graphify hook-guard search", "timeout": 10 }] },
      { "matcher": "Read|Glob", "hooks": [{ "type": "command", "command": "graphify hook-guard read", "timeout": 10 }] }
    ]
  }
}
```

Claude Code watches its settings files, so the hooks take effect in a running session. On Windows a command hook runs in Git Bash when it is installed and in PowerShell otherwise; the bare `graphify` command works in both. `graphify claude install --project` writes the same into `.claude/settings.json`; move it to the local file rather than committing it. `graphify claude uninstall --project` removes it from either.

Git hooks (`graphify hook install`: post-commit, post-checkout, post-merge, post-rewrite, plus a merge driver line in `.gitattributes`) were not installed either. The hooks folder is shared by every worktree of this repository, so each commit on any branch would start a rebuild, and the merge driver only matters for a committed `graph.json`. The loop and the rules rebuild at the right moments instead.

## 9. Opt-in extras, each with a cost

- **The semantic pass over the docs.** `/graphify . --update` in a Claude Code session splits the Markdown, `.txt` and `.html` files into chunks and dispatches subagents to extract concepts and relations from them (the structural pass above reads only headings, links and code spans). The docs are 471,000 words, so the first pass is on the order of a million tokens; later passes re-read only changed files. Ask before running it.
- **Community names.** `graphify label .` names the communities with an LLM. It needs a backend: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `--backend claude-cli` with the `claude` CLI on PATH (not on this machine). About 50,000 tokens for the first pass; `--missing-only` afterwards.
- **A wiki.** `graphify . --wiki` writes `graphify-out/wiki/index.md` and one page per community, which the rules then prefer for broad navigation.
- **An MCP server.** `pip install "graphifyy[mcp]"` and `graphify-mcp`, for clients that cannot run the CLI. Not needed here: Claude Code runs the CLI.

## 10. What was read before installing

`CLAUDE.md` item 8 asks that a third-party skill's files be read for `curl`, `wget`, `eval`, `base64` and outbound requests before it is installed. The clone (commit `0a8cd4e`, 2026-10-29) was read with that grep over the Claude skill (`skill.md`), the always-on blocks, the `references/` files, `install.py` and `hooks.py`:

- None of the skill or instruction files contains `curl`, `wget`, `eval`, `base64` or a network call. The skill's step 1 runs `pip install graphifyy` (or `uv tool install`) if the import fails, which is the only install it performs.
- Network code in the package: `security.py` fetches a URL only for `graphify add <url>` (http and https only, redirects to `file:` refused, an SSRF guard on the address, size and time capped); `llm.py` calls an LLM backend only when a key or `--backend` is set; `ingest.py` serves `add`. The query log (`querylog.py`) is off unless `GRAPHIFY_QUERY_LOG_ENABLE` is set, and it writes a local file. There is no telemetry.
- `install.py` writes files under `.claude/`, `CLAUDE.md` and the settings file, with a backup of a settings file it changes; `hooks.py` writes git hooks only on `graphify hook install`.

## 11. Removal

```bash
graphify uninstall --project --purge
```

removes the skill, the `CLAUDE.md` section, any hooks and `graphify-out/`. `pip uninstall graphifyy` removes the CLI. The ignore file, the npm scripts and the loop's steps are ordinary repository files; take them out by hand.
