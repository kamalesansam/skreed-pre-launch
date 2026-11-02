# Family pages, round 6: hand-off of 2026-11-03

Branch `claude/case-3d-model-transitions-a08c64` (worktree `.claude/worktrees/agitated-ellis-54d854` on Sam's Mac), landed on the default as cab2d6d on 2026-11-03 by the hand-off session (the review of iteration 3 followed it as one more commit). Spec: `docs/specs/family-page.md` section 24 (decisions D1 to D13, acceptance criteria 1 to 14, 24.7 for Sam, 24.8 the build record of iterations 1 to 3). Review log: `docs/specs/family-page.review.md`.

## What the branch does

- **The case types' own models.** Sam's MagTough, Snap and Armor files, packed into `public/models/` (`magtough`, `snap`, `armor` in `src/data/case-model.json`), each beat showing its own case and the argument screen the Armor; the Cobalt stays the Tough and the carousel's 24 (D1 to D3). The type models load once the scroll first passes 0.5 screens, never with the first view (D2).
- **depth.fyi's material takeover between case types**, re-created by measurement (D4 to D10, exception E-F6): from each hand-over's edge-on frame the incoming case takes the outgoing one over in a sweep from the screen's right to its left, riding the turn's second half so it ends as the case faces the camera, the boundary roughened by two layers of noise and lined with a narrow icy band; played back on the way up; a one-frame change under reduced motion. The split is computed per pixel on the screen, so nothing is see-through along the band. Code: `src/scripts/family/three/takeover.ts` (the scroll's mapping), `takeover-material.ts` (the spliced material), `stage.ts`; constants in `src/config/takeover.ts`.
- **The whole case at every beat on laptops** (D12): the beats' camera stands back by `CFG.wideBack` 1.6 and the beats' vertical drift is damped to `CFG.wideDrift` 0.4 (`pose.ts`).
- **The beats' light on every type** (D13): ciao's profile light rides with the case (`pose.ts` `profileLightOffset`), so the MagTough, Snap and Armor stand in it as the Tough does.
- **Measurement scripts** for the GPU in `scripts/case-model/gpu/` (seam count, band brightness, beat fit, the light, the held and real-speed frames), named in 24.8.

## Done and verified on this Mac (2026-11-03)

| Command | Result |
|---|---|
| `npm run test:unit` | 231 of 231 |
| `npm run test:family` | 75 of 75 |
| `npx astro check` | 0 errors, 0 warnings |
| `npm run build` | every budget line holds: critical JS 18.6 KB, total JS 235.7 of 250 KB |
| `node scripts/case-model/budget.mjs dist` | lazy 3D island 162,840 of 170,000 B; total JS on the page 175,044 of 250,000 B; every model's LOD1 and LOD0 inside its cap; "Show in 3D, 0.6 MB" equal to the measured |
| `git merge-tree --write-tree origin/claude/youthful-planck-objwf5 HEAD` | a tree only |

On the Mac's GPU (Apple M3 Pro, ANGLE Metal), against the test build below, `BASE_URL=http://127.0.0.1:8795/ npx playwright test -c tests/family/playwright.gpu.config.ts takeover case3d supplier3d --workers 1`: `takeover.spec.ts` 8 of 8; `case3d.spec.ts` 6 passed and 1 skipped (the software-renderer row skips itself on a GPU); `supplier3d.spec.ts` 6 passed and 7 skipped (rows that test what round 3 removed, each skip naming it). While other sessions held the machine at a load average of 29, two frame-timed takeover rows failed; run alone they passed. The test build:

```
PUBLIC_HERO_HOOKS=1 PUBLIC_TUNE=0 PUBLIC_STAGING=0 PUBLIC_FAMILY_3D=on npx astro build --outDir dist-r6t && node scripts/csp.mjs --dist dist-r6t
npx wrangler dev --ip 127.0.0.1 --port 8795 --inspector-port 9293 --assets ./dist-r6t --persist-to .wrangler/state-r6t
```

Measured with `scripts/case-model/gpu/` (figures in 24.8): nothing see-through under the band at raw 0.4 to 0.6 in all three hand-overs at both sizes; the band's brightest 1 percent 210 to 246 against the recording's 216; every beat's case inside an 800 px screen; every type within 4 levels of the Tough at the same points up its back. The frames in `docs/specs/screenshots/family-r6-*.png` were re-shot after the last change and looked at.

## Unfinished

- **The review of iteration 3 finished FAIL** (the last entry of `docs/specs/family-page.review.md`): all ten of iteration 2's findings fixed and D13 doing what it says, with two corrections to the record standing, neither changing the product. They are iteration 4's work, for the other computer (the loop has used 3 of its 5 iterations):
  1. Criterion 7 and D9's parenthesis still promise round 5's colour at beat 1 at 1280 x 800, which D12's camera and D13's light change there by design. Limit the comparison with the base build to the carousel at both sizes and to beat 1 at 390 x 844 (where the light's lift is 0 and D12 does not apply), read the 1280 x 800 beat 1 against this round's own build with the takeover off at the same pose, and name D12 and D13 as the reason. Re-measure on a GPU with `scripts/case-model/gpu/sample-compare.mjs`, matte and gloss, against a build of the default before round 6 (7444d38) served on a second port, and record the figures in 24.8. Optionally let `sample()` project the zoomed case at the beats, as `project()` does.
  2. `DESIGN.md`'s bullet "The beats' light on every case type" says the light is held where ciao's were through the zoom at both sizes; on the wide layout it is lifted by what the damped drift took (0.58 units at beat 1, D13). Reword it to follow D13.
  Then run the review for iteration 4.
- **Not verified:** a real phone; Sam's FBX files beside the shipped models; E1 and E2 (the `web-design-guidelines` and `visual-critique` skills are not installed on the Mac, so the review grades them BLOCKED); Lighthouse was not re-run in round 6 (no file of the first view changed).

## Sam's open questions

His words that shaped the round: "make the exact same transition" (2026-11-02); "it should come simultaneously after the rotation, not after the rotation" and "make sure that the entire phone case is fully visible for all 4 case types, not keep going down the case" (2026-11-03); "look at the spolight going away slowly for magtough snap and armor, it should be the same as tough case for all other case types" (2026-11-03). The build ships the first option of each question below until he answers (24.7):

1. The Armor's two tones: its bumper keeps the file's dark grey and its back takes the shade. All in the shade instead?
2. The half turn before the sweep (D6): keep it, or let the case face the camera and only sweep?
3. The band's ice colour on every shade (depth.fyi's), or a light tint of the shade?
4. The argument screen shows the Armor, the last case type. Or the Tough again?
5. Scrolling back up plays the sweep back, so the band runs left to right (D5). Or right to left both ways, as depth.fyi's code does for every new change?

## Files outside git the other computer needs

| What | Where on the Mac | Needed for |
|---|---|---|
| depth.fyi's scraped site, `depth.fyi.zip` | the hand-off carry folder, `/Users/apple/skreed-handoff-carry-2026-11-03/sam-sources/references/` | reference only; nothing of depth.fyi ships |
| Sam's recording of the transition, `depth-fyi-transition-recording-2026-10-26.mov` | the same folder | the recording's row of the held sheets: extract its frames into a folder of your own, outside the repository, and name it in `REC_FRAMES` for `scripts/case-model/gpu/frames-takeover.mjs` (command below) |
| The two held sheets with the recording's row, `family-r6-takeover-sheet-390-matte.png` and `-1280-matte.png` | `/Users/apple/skreed-pre-launch/.claude/worktrees/agitated-ellis-54d854/docs/specs/screenshots/licensed/` (git-ignored) | review only; remade by the script above |
| Sam's `magsafe case.fbx`, `snap 3 (1).fbx` and `Armor 5.fbx` | not on this Mac (they came from his Downloads on the Windows machine; `docs/HANDOFF-2026-11-02.md` section 3) | only to re-run the model intake (`scripts/case-model/intake-fbx.py`); the packed models are committed |

```
for t in 2.00 2.33 2.47 2.60 2.73 2.87 3.33; do ffmpeg -loglevel error -ss "$t" -i depth-fyi-transition-recording-2026-10-26.mov -frames:v 1 "rec-$t.png"; done
```

## Servers left running on this Mac

| Port | What | Started from |
|---|---|---|
| 127.0.0.1:8795 | the test build (`dist-r6t`, hooks on), inspector 9293, state `.wrangler/state-r6t` | the worktree above |
| 127.0.0.1:8801 | the production build (`dist`), inspector 9299, state `.wrangler/state-prod` | the worktree above |

## The prompt for a new session on the other computer

```
Resume the Skreed family pages, round 6 (the case types' own models, depth.fyi's material takeover between case types,
the whole case at every beat, the beats' light on every type). Read CLAUDE.md, docs/specs/family-page.md section 24
(D1 to D13, criteria 1 to 14, 24.7 and 24.8), the last entry of docs/specs/family-page.review.md and
docs/handoff/2026-11-03/family-pages.md. The review of iteration 3 (the log's last entry) is FAIL on two corrections
to the record, listed under Unfinished in the hand-off file: make them as iteration 4, re-measure criterion 7 on a GPU
(scripts/case-model/gpu/ and tests/family/playwright.gpu.config.ts), run the review skill for iteration 4 against
docs/CHECKLIST.md and section 24's criteria (3 of 5 iterations used), then send Sam the frames and the five questions
of 24.7. Work in a new git worktree on a new branch; land only
with Sam's word, by git merge --no-ff after a git merge-tree --write-tree check, then push; no pull requests unless he
asks; never a bare git stash; nothing licensed or from his uploads in the repository; no deploy without his word; no
em dashes, no emoji, British spelling, no AI product names in files.
```
