# The merge map and the no-conflict landing protocol (2026-11-02)

Sam, 2026-11-02: "make sure each and every session that is running here is talking to each other. So while after finishing everything, while merging everything into one single branch, in the default branch or the origin branch, none of them should have any conflict and everything should merge without any conflict."

This file is the shared contract between the sessions in flight. The measurements below were taken on 2026-11-02 by the hub session with `scripts/git/merge-map.py` on snapshots of every worktree (each branch's tip plus its uncommitted work) against the default branch `origin/claude/youthful-planck-objwf5` at `7e256a4`, and were unchanged an hour later. Since then the default has moved four times, each a landing by section 4's recipe: the reservation of section 7 as `9e6c907`, this map as `21f1480`, the hero as `ec7d5a3`, the cue as `b2d629e`, the hero's follow-up (its review log and re-taken frames, no file shared with anyone) as `95efdc5` (all 2026-11-03); the first's effect is measured in section 2, and after the third the remaining branches conflict with the default in: section 5 `tests/unit/page-scroll.test.ts`; the family pages and the cue `CLAUDE.md`; About nothing; the quiz its five files plus `tests/e2e/quiz.spec.ts`; the hall eleven files, among them `layout.ts` and the section 4 specs the hero also changed. Re-measure before trusting the rest: the tips move.

## 1. The branches in flight

| # | Piece | Branch | Worktree (`.claude/worktrees/`) | Against the default on 2026-11-02 |
|---|---|---|---|---|
| 1 | The quiz result redesign | `claude/quiz-result-redesign` | `quiz-result` | 12 behind, 1 ahead; conflicts in `CLAUDE.md`, `DESIGN.md`, `docs/specs/quiz.md`, `src/components/quiz/Quiz.astro`, `src/styles/quiz.css` |
| 2 | Section 4 without the hall | `claude/remove-grey-room-section-4-471c96` | `eloquent-driscoll-695753` | 9 behind, 2 ahead; conflicts in `CLAUDE.md`, `DESIGN.md`, `docs/CHECKLIST.md`, `scripts/room/contrast.mjs`, `scripts/room/render-stills.mjs`, `src/env.d.ts`, `src/scripts/hero/section4/director.ts`, `tests/e2e/room.spec.ts` |
| 3 | Section 5, the four-jar sign-up | `claude/section-5-signup-glass-jar-9d74d2` | `affectionate-faraday-24a066` | 29 behind, 5 ahead; conflicts in `CLAUDE.md`, `DESIGN.md`, `docs/CHECKLIST.md`, `docs/HANDOFF.md`, `tests/e2e/room.spec.ts` |
| 4 | Family pages round 6, the case models | `claude/case-3d-model-transitions-a08c64` | `agitated-ellis-54d854` | contains the default; clean |
| 5 | The scroll cue's words | `claude/scroll-affordance-text-8e0a5f` | `festive-colden-092906` | landed as `b2d629e` on 2026-11-03 (65 files) |
| 6 | The About page | `claude/skreed-about-page-477c0e` | `peaceful-kalam-531877` | contains the default; clean |
| 7 | The hero's halved scroll and the blocks' alignment | `claude/hero-scroll-half` | `hero-scroll-half` | landed as `ec7d5a3` on 2026-11-03 (36 files) |
| 8 | This map and its script | `claude/merge-map-tooling` | `merge-map` | landed as `21f1480` on 2026-11-03 |

Parked: `claude/deployment-setup-92703f` (`5f0ba38`, the deploy workflow) conflicts with the default in `package.json`; it stays unmerged until Sam sets up Cloudflare, and whoever lands it resolves that file then.

## 2. The measured collisions

**Against the default.** Pieces 1, 2 and 3 were cut from older defaults and must take the current default in before anything else; the files above are theirs to resolve. The other five already contain the default.

**Session to session**, with each side first merged onto the default, so only the two sessions' own changes collide:

| Pair | Conflicting files | What it is |
|---|---|---|
| 2 x 3 (hall, section 5) | 18 files: `CLAUDE.md`, `docs/00-IDEATION.md`, `docs/CHECKLIST.md`, `docs/HANDOFF.md`, `scripts/hero/budget.mjs`, `scripts/room/render-stills.mjs`, `src/config/room.ts`, `src/env.d.ts`, `src/scripts/hero/hero.ts`, `loop.ts`, `section4/director.ts`, `stage/resize.ts`, `src/scripts/quiz/gate.ts`, `src/scripts/room/walk.ts`, `src/styles/room.css`, `tests/e2e/room.spec.ts`, `tests/unit/quiz-gate.test.ts`, `tests/unit/room.test.ts` | By design: section 5 was built on the hall the removal deletes. Section 5's edits to the hall's files are void once the hall is gone; 2 lands first and 3 re-fixes its entry seam on the hall-less page. |
| 4 x 5 (family, cue) | nine binary frames `docs/specs/screenshots/family-r5-*.png`, `docs/specs/family-page.md` (both append a section numbered 24 after line 1101), `DESIGN.md` (both add a row to the family tokens table at lines 824 to 827), `CLAUDE.md` | The cue committed rewritten round 5 frames in `46e4a7f`; the family session has rewritten the same frames uncommitted while its own frames are `family-r6-*`. |
| 1 x 3 (quiz, section 5) | `src/styles/fonts.css` (both insert `@font-face` blocks after line 21), `tests/e2e/quiz.spec.ts` (both edit lines 567, 588, 630, 936 and 1307 to 1310), `CLAUDE.md` | `tests/harness/browser.ts` carries the same `SKREED_GL=gpu` change on both sides and merges clean. |
| 3 x 5 (section 5, cue) | `.claude/launch.json` (both insert an entry at line 3: section 5's `astro-dev-mac`, `npm run dev` on 4321; the cue's, renamed `astro-dev-mac-hooks` on 2026-11-03, the hooks build on 4325), `CLAUDE.md`, `docs/CHECKLIST.md` | The rename removes the clash of names; git still conflicts because both insert after the same line, so the second to merge keeps both entries. |
| 3 x 7 (section 5, hero) | `tests/unit/page-scroll.test.ts` (section 5 adds the fourth span at lines 12 to 26; the hero rewrites the expected spans at line 31 for the halved track), `CLAUDE.md` | |
| 2 x 7 (hall, hero) | `src/scripts/hero/section4/layout.ts` (both reword the comment at lines 5 to 7), `CLAUDE.md` | |
| 3 x 6 x 2 (section 5, About, the hall) | `src/scripts/shell/site-nav.ts` (the navbar's script, on the default since the navbar landed): section 5 adds three lines after line 98, opening `section#signup` with the room (2026-11-03); About edits lines 10 and 30 (its link); the hall's base predates the navbar, so its rebase onto the default adapts the unlock region (the wait on the hall, the focus targets moved to the scenes) | Section 5 and About are clean with each other. The hall lands first, so both meet its lines at their merge-in: keep the hall's, put their own back after. |
| 1 x 7 (quiz, hero) | `tests/e2e/quiz.spec.ts` (the quiz rewrites the header and much of the file; the hero adds an `S2T` import at line 63 and one wheel-run test near line 3425), `CLAUDE.md` | |
| every other pair | `CLAUDE.md` alone, plus `DESIGN.md` for 1 x 2, 1 x 6 and 2 x 6, and `docs/CHECKLIST.md` for 2 x 5, 3 x 4, 3 x 6 and 4 x 6 | 5 x 6 and 6 x 7 are clean today (they overlap without conflict in `src/config/copy.ts`, `tests/family/specs/grid.spec.ts` and `tests/unit/site-nav.test.ts`). |

**The hot lines in the shared docs** (the default's line numbers):

- `CLAUDE.md` lines 15 to 19, the section bullets of "Brand facts" (15 section 2, 16 the family pages, 17 section 3, 18 section 4, 19 the section index): the hero and the cue both edit 15; the family session and the cue both edit 16; the quiz and the hero both edit 17; the hall edits 18 and section 5 inserts its own bullet after it; About edits 19 and section 5 inserts after it. Lines 100 to 127, the approved exceptions: the quiz after 104, the hall at 107 to 126, section 5 after 119, 120 and 127, the cue after 100, About after 125.
- `DESIGN.md`: lines 195 to 196 (section 3's type: quiz, hall, About), 355 (the quiz link: quiz, hall), 566 to 567 (the family pages' layout: cue, About), 687 to 689 (the quiz gate exceptions: hall, section 5), 823 to 827 (the family tokens: family, cue).
- `docs/CHECKLIST.md`: section A lines 10 to 24 (hall, section 5, family, cue, About), section D lines 51 to 53 (hall, section 5, cue), section E lines 69 to 71 (hall, section 5, cue).
- `docs/HANDOFF.md` line 18 (the page section by section: hall, section 5); `docs/00-IDEATION.md` line 48 (hall, section 5).

A git fact, tested on 2026-11-02: two edits to adjacent lines conflict; one unchanged line between them is enough to merge clean; two insertions after the same line always conflict. So the shared docs will conflict between branches whatever the discipline; the protocol makes sure those conflicts are resolved inside the branches, one landing at a time, and never reach the default.

**The reservation (landed as `9e6c907`, 2026-11-03, Sam's word "Yes, make it").** `CLAUDE.md` now carries one blank line between the five section bullets (lines 15, 17, 19, 21 and 25), a reserved "Section 5, the sign-up" line at 23 for the section 5 branch to replace, and a reserved "The About page" block at 132 for the About branch to replace; everything from the old line 100 moved down six lines, and eight after 132. Simulated with every branch merged onto it and its bullets re-applied, `CLAUDE.md` conflicts in 6 pairs instead of 21, all same-line edits that no spacing can separate: 2 x 3 (the Section 4 bullet), 4 x 5 (the family pages bullet), 2 x 7, 1 x 2 and 1 x 7 (the Section 3 bullet), 5 x 7 (the Section 2 bullet). Seven pairs are then clean in every file: 4 x 2, 4 x 7, 4 x 1, 2 x 6, 5 x 6, 7 x 6 and 5 x 1. Each branch pays once: its next merge-in conflicts in `CLAUDE.md` beside the inserted blank lines, resolved by keeping its own text on its own line and the blank lines around it (section 5 and About replace their reserved lines).

## 3. The landing queue

One landing at a time, each with Sam's word, on the default branch (`main` once the hall session has made it; see section 5).

1. **The hall removal (2)** first: the hero's scroll work and section 5 both build on the scroll map it changes, and `main` is cut right after it.
2. **The family pages (4), the cue (5), About (6) and this map (8)**, in the order they become ready (reviewed, approved, clean). None of them touches the scroll map. The map landed as `21f1480` and the cue as `b2d629e`; About is ready and waits on Sam's word; the family pages wait on his call about a seam.
3. ~~**The hero (7)** after the hall~~: landed first, as `ec7d5a3` on 2026-11-03, on Sam's direct word ("push and commit to main") with the review loop's verdict not yet in; verified by the hub as the recipe's merge of `21f1480` and `ef5a88d`. The hall's rebase therefore meets the halved scroll map (`TRACK_SVH` 675, the second wipe at 5.25 screens) and re-derives its own numbers on it.
4. **Section 5 (3)** after the hall, once Sam has approved it on localhost and its entry seam is re-fixed onto the hall-less page.
5. **The quiz result (1)** once it has taken the default in; it touches no scroll map, so it may go before 3 or 4 if it is ready first. Ready since 2026-11-03 at `bfab729` (clean against `95efdc5`); the Canva swatch stays Sam's open answer and does not hold the landing, since production draws the branch's own stroke.

The dependency that remains: 3 never before 2.

## 4. The protocol

**Before asking Sam to land** (the landing session, in its own worktree, with everything committed):

```
git fetch origin
git merge-base --is-ancestor origin/claude/youthful-planck-objwf5 HEAD && echo contains the default
git merge-tree --write-tree origin/claude/youthful-planck-objwf5 HEAD
python3 -I scripts/git/merge-map.py --mine <branch>
```

The branch must contain the current default, `merge-tree` must print only a tree (no conflicted path), the unit tests and the build must pass on the branch, and the merge map's session-to-session lines for the branch are what the landing will leave to the others. Then message the hub (so two sessions never land in the same minute), then ask Sam.

**The landing** (with Sam's word) is the merge commit `git merge --no-ff` would make, built without touching the main checkout, which is dirty and whose local default is behind:

```
git fetch origin
tree=$(git merge-tree --write-tree origin/claude/youthful-planck-objwf5 HEAD)
sha=$(git commit-tree "$tree" -p origin/claude/youthful-planck-objwf5 -p HEAD -m "Merge branch '<branch>': <what landed>" -m "<the attribution line>")
git push origin "$sha":refs/heads/claude/youthful-planck-objwf5
```

The push refuses to move a default that moved in the meantime (non fast-forward), which is the point: fetch, re-check and build the commit again. Then message every other session and the hub: "LANDED `<branch>` at `<sha>`; the default is now `<sha>`; merge it in before your next edit; it changes `<the files from the map>`."

**After every landing** (every other session, at its next turn, before any further edit): commit what is in hand (a WIP commit is fine), `git fetch origin`, `git merge origin/claude/youthful-planck-objwf5` into its own branch (a merge, never a rebase, because every branch is pushed; the one exception is below), resolve, run the unit tests and the build, commit, push.

**The hall's exception (2026-11-03).** Sam's words to the hall session were a rebase onto the current default with the removal kept as one commit, so that one revert brings the hall back; a merge commit would carry the navbar's move to the scenes and leave a lone revert of the removal with a navbar that no longer waits for the hall. So `claude/remove-grey-room-section-4-471c96` alone rebases, once its review's fixes are in: the removal stays one commit and the tooling commit separate; the branch is pushed with `--force-with-lease`, never plain `--force`; nobody takes its tip in before the hall session announces the rebased tip and the new removal SHA to the hub, section 5 and the hero and writes that SHA into the memory file in place of `65642df`; and the landing is the recipe above unchanged, then `main`.

**The shared docs** (`CLAUDE.md`, `DESIGN.md`, `docs/CHECKLIST.md`, `docs/HANDOFF.md`, `docs/00-IDEATION.md`): each session edits only its own lines (section 2 names them), adds new lines inside its own section rather than at the end of a shared list, and never reflows, renumbers or rewords another session's lines. A line another session owns is asked for by message, never edited. When a merge-in conflicts in one of these lists the rule is fixed: keep both sides' lines, the landed session's first, yours after, and drop nothing.

**Shared code and tests** (`tests/e2e/quiz.spec.ts`, `tests/e2e/room.spec.ts`, `tests/unit/page-scroll.test.ts`, `tests/unit/site-nav.test.ts`, `src/config/copy.ts`, `src/scripts/hero/section4/layout.ts`, `src/styles/fonts.css`, `.claude/launch.json`): the owner is the session whose feature the file serves. Another session that must change it adds a separate block (a new test, a new config entry under its own name, its own `@font-face` group) rather than editing the owner's lines, and tells the owner.

**Binary frames:** a review frame is owned by the round that names it. Family round 6 writes `family-r6-*.png` and puts `family-r5-*.png` back to the default's; the cue session keeps its own `scroll-cue-*.png` and puts the `family-r5-*.png` it committed back to the default's; whoever lands second re-renders its own frames on the merged build.

**Never:** never merge or push another session's branch; never force-push; never a bare `git stash`; never land without Sam's word; never stop another session's servers, and never bind or kill a port without `lsof -nP -iTCP:<port> -sTCP:LISTEN` first and a look at which worktree owns it (on 2026-11-03 a hall-session script killed the family session's server on 8795, taking it for its own); never `git add -A` in the main checkout (it holds untracked review frames and an A3 lifestyle picture that must never be committed).

## 5. `main`

Until the hall lands, the target is `claude/youthful-planck-objwf5`. Right after it lands, the hall session, with Sam's word, cuts `main` from the default's tip at that moment (the same commit, so nothing diverges), pushes it, Sam switches GitHub's default branch to `main`, and the hall session messages every session: "main exists at `<sha>`; land on `origin/main` from now on; the old default is frozen". From then on every command above reads `origin/main`, and `scripts/git/merge-map.py` follows `origin/main` by itself once it exists.

## 6. The hub and the script

The hub session ("Conflict-free session merging") re-measures the map after every landing and on request and posts the result to all; a session messages it with the output of `--mine` before asking Sam to land. Any session can run the same measurement itself: `python3 -I scripts/git/merge-map.py` (the whole map), `--mine <branch>` (one branch; exits 1 while it conflicts with the default or does not contain it), `--exclude a,b` (leave branches out). The script is read-only for every worktree and ref: it writes unreferenced snapshot commits and a JSON file in a temporary folder. Until this branch lands, run it from this worktree: `python3 -I /Users/apple/skreed-pre-launch/.claude/worktrees/merge-map/scripts/git/merge-map.py`.

## 7. Open with Sam

- The main checkout (`/Users/apple/skreed-pre-launch`) carries a stray one-line uncommitted edit to `docs/specs/section-4.md` from the old docs session of 2026-10-23 (the third wipe's hand-off wording), plus untracked review frames and an A3 lifestyle picture at the root. The landing route above never touches that checkout, so nothing blocks; the stray line is still Sam's to keep (a tagged stash or a branch) or drop.
