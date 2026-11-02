---
name: family-grid-shared-chunk
description: "A module imported by both the landing's hero island and the family page module becomes its own tiny Rollup chunk, which family grid mode then fetches and the family specs' islandRequests allowlist flags"
metadata:
  node_type: memory
  type: project
  originSessionId: 05defdf2-816a-48c7-8ee3-559f1122e54a
  modified: 2026-11-02T07:54:42.879Z
---

Seen 2026-11-02 (the cue's words, `docs/specs/scroll-cue.md`): `src/config/cue.ts`, imported by the hero island (`scroll/ride.ts` through `cue-words.ts`) and by `src/scripts/family/page.ts`, was split by the production build into its own 0.1 KB chunk (`/_astro/cue.<hash>.js`). The family page module loads in swatch grid mode too, so grid mode would fetch it, and `islandRequests` in `tests/family/specs/util.ts` counts any `/_astro/*.js` outside its grid-mode allowlist as a 3D-island request. The fix kept the landing's constant in `src/config/cue.ts` and gave the family page its own twin in `src/scripts/family/timing.ts`, held equal by a unit test.

**Why:** the build passes and the budget barely moves, so the split chunk is easy to miss until a family grid spec fails.

**How to apply:** after sharing a module between the landing island and the family page, grep the build log's `island js` / `critical js` lines for a new small chunk; keep family imports to `src/scripts/family/*` and leaf configs the grid already loads. Related: [[windows-lighthouse-and-e2e]].
