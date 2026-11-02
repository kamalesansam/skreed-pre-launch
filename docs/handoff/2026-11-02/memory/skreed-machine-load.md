---
name: skreed-machine-load
description: On Sam's Windows machine other agent sessions share the Skreed repo and its ports; under load the hero's 20 s loader stall window sends deep-scroll arrivals to the poster, so browser checks need a quiet machine
metadata:
  type: project
---

Facts about the machine the Skreed work runs on (seen 2026-10-26):
- Another agent session works in the same repo from `.claude/worktrees/3d-model-rendering-airpods-*` (the AirPods model), with Astro dev servers on 4321 and 4324 and a wrangler dev on port 8791. Do not kill those processes; serve review builds on 8790 (the main clone), 8793 or higher, and check `Get-NetTCPConnection -LocalPort <n>` before choosing a port.
- With two builders, two reviewers and three servers running, free memory fell to about 2 GB of 15.6 and the browser pane's hero took 60 s to boot. The hero's inline loader goes to its soft poster after 20 s without progress, and a page that sits deeper than 8 px (a `/#families` arrival at 17 screens) turns that into the hard poster through "soft-then-scrolled". So the 3D return path cannot be observed under load; wait for agents to finish before pressing controls in the pane.
- The pane's screenshots sometimes come back clipped or scaled after a viewport switch; closing the tab and opening a fresh one with preview_start fixes the capture.
- Subagents in this session could not deliver their reports through SubagentHandback ("the session is not in auto mode"); ask them for the hand-off with SendMessage when a task ends without one.

**Why:** these cost most of an afternoon of false negatives on 2026-10-26.

**How to apply:** check load and ports first; prefer the owner's unit tests and the builder's measurements for timing claims; treat a poster fall in the pane as suspect until reproduced on a quiet machine. See [[skreed-windows-checkout]].

Seen again on 2026-10-28 (family round 5): the default branch moves under a long round, since the other sessions merge their own branches into it and push (four commits landed during round 5), so dry-run the merge with `git merge-tree --write-tree <default> <branch>` before the real one; the other session also takes port 8790 for its own wrangler dev, so serve on 8793 or 8794 and say which. Wrangler's Workers runtime crashes under a Playwright run's load ("The Workers runtime crashed unexpectedly and is being restarted") and the background task then exits with code 127: restart it, and expect a few connection-refused rows to re-run. A model usage limit cut one builder off mid-iteration; the next builder picked up from the worktree's uncommitted state and the test-results logs, so brief builders to leave logs under test-results/.
