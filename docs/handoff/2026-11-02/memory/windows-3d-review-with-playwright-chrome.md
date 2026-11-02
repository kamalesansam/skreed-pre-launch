---
name: windows-3d-review-with-playwright-chrome
description: "On the Windows machine the 3D path is reviewed through headless Playwright with the installed Chrome (real GPU), never through the app's browser pane while the window is away; worktrees need their own npm ci"
metadata:
  node_type: memory
  type: project
  originSessionId: 191081c7-ac45-489f-b5f1-8ca721f44806
  modified: 2026-10-26T12:38:18.441Z
---

On the Windows machine (since 2026-10-26) the hero's 3D path renders in headless Playwright launched with `channel: 'chrome'` (Intel UHD via ANGLE D3D11): `scripts/signup/frames.mjs`, `render-stills.mjs` and `contrast.mjs` drive the dev server that way and the whole page sequence (the hall, the scenes, the fourth wipe, section 5, the seams) runs at real speed. The app's built-in browser pane cannot finish the hero's loader while the app window is not in view: the island waits on `frame1`, which needs animation frames, and a hidden pane gets none (the loader stalls at 98 percent for good). Each git worktree of the repo has no `node_modules` of its own: run `npm ci` there first (about a minute), and give every `npm run` Git's bash as the script shell (`npm --script-shell="C:/Program Files/Git/usr/bin/bash.exe" run build`). Writing a file into a globbed `src/assets/` folder while the dev server is up reloads every open page, which kills a Playwright `evaluate` mid-call: render in memory and write at the end. An `astro build --outDir` run in the same checkout reloads the dev server's open pages too (2026-10-29: a Playwright measurement on 4322 died mid-run with "navigated to" while a test build was written), so build before or after a capture, never during; the same dev server page can then be driven at real speed with `channel`/`executablePath` Chrome and `--ignore-gpu-blocklist` (section 2 ready in 16 to 23 s at every phone size).

**Why:** A whole hour went to the hidden pane and to a stills script that crashed on its own file writes before these were understood.

**How to apply:** For any frame, still or contrast measurement of the 3D path, start the dev server (the astro-dev-win launch entry) and run the scripts under Playwright; do not wait on the app's pane. Related: [[windows-machine-no-blender]].
