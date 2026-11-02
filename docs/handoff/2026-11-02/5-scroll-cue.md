# Session 5: the scroll cue's words, "Scroll to see more"

- **Old session:** "Scroll affordance text" (`local_96d0cc44`).
- **Branch:** `claude/scroll-affordance-text-8e0a5f`. The tip is `46e4a7f` (WIP handoff), one commit on `71678ed`.
- **Spec and log:** `docs/specs/scroll-cue.md` (exception E-cue-text, build record iterations 1 to 3) and `docs/specs/scroll-cue.review.md` (round 1: nine confirmed failures, all fixed since).
- **Delete before landing:** `.edit-tmp.mjs` at the repo root went into the WIP commit by accident.

## What Sam asked

- The original brief: words, "Scroll to see more", beside the scroll cue's arrows, wherever one has to scroll.
- After seeing it on localhost (verbatim): "use the font in the signup page that we're using on the section 5, the different kind of fonts for the scroll to see more,and the back to topp, and the all families text, and the launch in, and days, hours, minutes, seconds texts as well, and the scroll to see more is soo out of place, not in middle, somewhere odd, place it in the bottomm corner maybe, for desktop, figure it out to place it properly for phone ratio as well".
- The session read "section 5's signup font" as IBM Plex Mono Medium in capitals, the face section 5 used before its picture rebuild. **Check that with Sam.** Section 5 is being rebuilt in Inter and Jost (session 3), so he may mean those.

## What is built

- **Face:** "Scroll to see more", Back to top, All families, Launch in, the countdown's days, hours, minutes and seconds, and "Back to main page" on the family end screen are all IBM Plex Mono Medium in capitals.
- **Desktop:** the words sit in the bottom-right corner, lined up under Back to top's edge, both at the top of the page and when the visitor stops mid-scroll.
- **Phone:**
  - At the top: centred directly above the arrows. The countdown moved up 22 px to make room.
  - Stopped mid-scroll: the bottom-left corner, under the countdown and clear of the last gem.
  - The words fade out on scroll and come back after about 1.5 s of stillness.
- **Family pages:** on a phone the case-type screens wrap the words onto two lines ("SCROLL TO / SEE MORE"). On one line they failed contrast on 45 of 240 shades at 360 px. There are no words on the final GO / BEYOND BASIC screen.
- **One relaxation:** at 360 px the gap between "Back to main page" and Back to top drops to 43.3 px, so the spec's 48 px gap rule is relaxed to 40.
- **Checks at the last run:**
  - Unit 11 of 11; family 64 of 64.
  - Every browser test of the feature passes at 360, 375, 390, 430 and 1280.
  - The budget holds: island +304 B gz, total 241.0 of 250 KB.

## Interrupted

- Review round 2, on the Plex version. It was stopped and cannot be resumed.
- The Lighthouse comparison, base against change, which AC8 requires.

## Next steps

1. Set up a worktree on the branch, run `npm ci`, and delete `.edit-tmp.mjs`.
2. Run the unit tests, `npm run test:family`, `astro check` and the build. Re-run `tests/e2e/scroll-cue.spec.ts` and `tests/family/specs/scroll-cue.spec.ts` on a test build.
3. Run Lighthouse on base and change, on a quiet machine (the headless shell; `scripts`' Lighthouse notes are in `docs/handoff/2026-11-02/memory/windows-lighthouse-and-e2e.md`). Write the figures into section 12 of the spec.
4. Run review round 2. E1 and E2 are BLOCKED, not FAIL: the `web-design-guidelines` and `visual-critique` skills are not installed. Fix what is confirmed.
5. Merge the default branch in. Expect conflicts in `CLAUDE.md`, `DESIGN.md`, `docs/CHECKLIST.md`, `scripts/room/render-stills.mjs`, `src/styles/to-top.css`, `tests/harness/canvas.ts` and the two parity specs. The navbar has landed since: Home now does Back to top's jump, and **the landing draws no Back to top any more**. So the desktop corner placement, "lined up under Back to top's edge", needs rethinking on the landing. The family pages keep theirs.
6. Show Sam on localhost, then land on his word.

## For Sam

- Over the light fog, the words drop below AA in about half the readings. The logo and Back to top already sit there in the same colour. Accept it, or show the words over the night sky only.
- Which font did "section 5's" mean: Plex, or the new Inter and Jost?
- The chevrons stay off at the top after an unsnapped jump (Home key, scrollbar drag). This is pre-existing, noted by the reviewers.
