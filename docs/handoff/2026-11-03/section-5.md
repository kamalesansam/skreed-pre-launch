# Section 5, the sign-up: hand-off of 2026-11-03

Branch `claude/section-5-signup-glass-jar-9d74d2`, worked on this Mac in the worktree `.claude/worktrees/affectionate-faraday-24a066` (session "Section 5 sign-up: the four glass jars"). Sam asked on 2026-11-03 for everything to go to the default branch for his move to another computer ("push everything to the default branch and write a handoff to continue in a different computer"), so the branch lands **before his verdict on localhost**, which is still awaited for the last round below. Nothing in it is licensed or from his uploads.

## What the branch does

- **Section 5 as Sam's picture of 2026-11-02** (`docs/specs/section-5-picture.md`, the spec of record; CLAUDE.md's section 5 bullet and exceptions E-S5-bg, E-S5-wipe, E-S5-fill and E-S5-picture). The section is a DOM page over the hero island's flat ground (#F2EAE1, `SIGNUP_GROUND`): the headline and sub-line, "EVERY FOLLOW FILLS THE JAR" over four pre-rendered glass jars with our own marks and their worth, each platform's column one link to the store's page in a new tab, jar 4 filling in press order (the reveal, E-S5-fill), the email form behind `PUBLIC_LEADS`, Inter and Jost. One column under 720 px, two columns across the whole width on landscape screens from 900 px.
- **The end of the page** (spec section 18): no empty screen after the body, no loop from section 5's end on either tier; the page ends at the section. The wrap from the top (the hero scrolled up) still lands on section 5, as section 4 built it.
- **Section 4's track** is 4.8 screens (`ROOM_HEIGHT`, `.room .rm-track` 480svh): the stage unpins as the fourth wipe begins, so section 5 rises under the cut with no screen of empty cream after it (Sam: "there's a lot of free white space"). The glue's fourth span runs from the room's top plus 3.8 to plus 4.8 screens.
- **The last round, 2026-11-03** (Sam: "the space is gone but the transition and the glue stick scroll has to work properly, the glue stick is not working, and the transition is not done properly, i could see that box"), commits 6220799, 935e8c4 and 53244d9:
  - *No box under the cut.* While the fourth wipe runs on the 3D path the section leaves its ground to the canvas (`data-cut`) and masks its lines in behind the cut's clear line (`src/scripts/signup/cut.ts`, applied from the island's frame by `src/scripts/signup/signup.ts`), the line below which every pixel of the shader's cut is the ground whatever its texels (held to both copies of `wipe()` by `tests/unit/signup-cut.test.ts`).
  - *The glue settles forward again.* Its rule against settling a focused element out of view read the fixed navbar's document rect, and a clicked link keeps the focus in Chrome, so a stop past the cut's middle stayed mid-cut. The rule now holds only for a visible (`:focus-visible`) focus on an element the scroll moves (`src/scripts/hero/section4/scroll.ts`; `docs/specs/section-4-flux.md` 2 words it).
  - *The cut is done at its end.* Within 2 px of its end the cut is whole, section 4's frame and loops go off under section 5, the island's ground is marked, the logotype is set Urban Slate over it (`director.ts`, `loop.ts`); on a phone whose toolbar has hidden, the cut ends at the page's last position, which comes before the section's top (`section5/ground.ts` `restOf`).
  - *A teardown clears the page's cut.* The island tells the page when it goes (`hero.ts`).
- **Merged:** the default branch up to 693c0eb (the family pages round 6), at 5074c6d; one conflict, `docs/CHECKLIST.md`'s A1 and A2 lists, both sides kept, the landed lines first.

## Done and verified

At the merge 5074c6d, on this Mac:

| Check | Command | Result |
|---|---|---|
| Unit | `npm run test:unit` | 259 of 259 |
| Family unit | `npm run test:family` | 75 of 75 |
| Types | `npm run check` | 0 errors, 0 warnings |
| Production build and budgets | `npm run build` (run into `dist-verify` with the same variables, the three post-build scripts given that folder) | exit 0, every line holds |
| Landing check | `git merge-tree --write-tree origin/claude/youthful-planck-objwf5 HEAD` | a tree only |

The budget lines that matter here, from that build: section 5's page script 6.6 of 7.0 KB, the first view's section 5 line 4.9 of 5.5 KB, total JS with sections 4 and 5 239.2 of 250 KB, section 4's script 20.6 of 30 KB, the scroll chunk 3.0 of 4.0 KB, the section 4 guard (the ten loops, `media-src 'self'`).

Live, in Chrome at 1512 by 827 on the dev server (`http://127.0.0.1:4321/?room=open`), on 2026-11-03: the cut at a quarter, nine twentieths, thirteen twentieths and seventeen twentieths with no edge of the section's own (the shards rise over the cream and the section's lines come up behind them); with the navbar's "Products" link focused, a stop 41% into the cut settles back to its start and one at 61% settles on to section 5's rest (10999 px, the page's end), where the cut reads 1, `data-ground="island"` is set, no loop plays and the logotype is Urban Slate.

Browser suites: on c798436 signup 5 of 5 and the room suite 11 of 11; on 207621f signup 5 of 5 and room 10 of 11 (the rest's `data-ground` step, fixed by 6220799). At the hand-off the room and signup suites were running on 6220799's hooks build (`npm run build:test`, then `SKREED_GL=gpu SKREED_PORT=8796 CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx playwright test tests/e2e/room.spec.ts tests/e2e/signup.spec.ts --project=e2e`), with the room suite's new case at 390 by 844 (the section transparent and masked mid-cut, the glue both ways with the navbar's menu button focused, the rest's state). Their result is added here if it comes before the landing, and goes to the hand-off session otherwise.

An independent adversarial review of the last round (fbb332a to 53244d9) was also running at the hand-off; its findings follow the same way.

## Unfinished

- **Sam's verdict on localhost** for the last round (the cut and the glue). Nothing in the section changes until he answers.
- **The phone's own look of the cut** was not seen: the app's browser pane was hidden and this Mac's Chrome window is full screen. The room suite's new case at 390 by 844 holds the states (the section transparent and masked mid-cut, the glue both ways, the rest), and the unit test holds the geometry at phone ratios (390 by 844, 360 by 780, 844 by 390).
- **1280 by 500** measured 9 px over one screen before the short-screen allowance was raised to 152 px; not measured since.
- **The second fill's pop** at the old layer's seam came down (its worst from 60 to 27 levels) but not much in area (pixels over 8 levels from 819 to about 695); not pursued further.

## Sam's open questions

- The thirteen items of `docs/specs/section-5-picture.md` section 14, each with what ships until he answers: the discounts as a promise to honour; "We’ll verify your follows" (the site collects an email only); Meta's and YouTube's rules on rewarded follows; no consent box under the DPDP Act; Inter, banned by rules 4, 19 and 30, standing in for the picture's Helvetica (with Jost for its Avenir); the picture's paid originals; the marks as our own drawings; the contrast below AA; the marks centred on the jars; the curly apostrophe in "that’s"; the glossy floor and the falloff; the fill's motion; the pellets in the picture's colours, not catalog shades.
- **The wrap from the top** still lands on section 5. His words of 2026-11-03, "remove the loop, i dont want the sign up page to scroll back to section 1", took away the way from section 5 to the top; the way from the top to section 5 is section 4's and stays until he says.
- **Two Inter files on the site:** the About page's (`inter-400-700-latin.woff2`, 29,912 B) and section 5's (`inter-opsz-wght-latin.woff2`, 72,920 B). The About page could load section 5's file and drop its own (its `@font-face`, preload, fallback lines and manifest entry); his call.
- **The glue's focus rule as now read** (a visible keyboard focus on an element the scroll moves), recorded in `docs/specs/section-4-flux.md` 2; say if a mouse's focus should still hold the glue.

## Files outside git

Nothing of section 5 is licensed. What the branch does not carry:

- **Sam's picture of 2026-11-02** (1019 by 1543 px), every measurement's source: the carry folder's `sam-sources/references/section-5-four-jars-picture.webp`. The carry folder (`skreed-handoff-carry-2026-11-02`, 673 MB) never reached this Mac; it is on the Windows machine at `C:\Users\skree\Documents\skreed-handoff-carry-2026-11-02`. His first picture, of 2026-10-26, is in git at `docs/specs/screenshots/section-5-reference.webp`.
- **The jar masters and the Blender intermediates:** the carry folder's `section-5-jar-work/` (the same Windows machine): the traced profile's full lists, the Blender scenes and the masters the shipped pictures were composed from. The 64 shipped jar pictures are in git (`src/assets/signup/jars/`) with their scripts and README (`scripts/signup/jars/`); a re-render needs the masters.
- **On this Mac:** `/Users/apple/skreed-handoff-carry-2026-11-02` is a partial rebuild of the carry folder holding the quiz's result reference only, nothing of section 5. Blender is at `/Applications/Blender.app`.

## Servers running on this Mac (left running)

- `astro dev` from this worktree, `astro-dev-mac` in `.claude/launch.json`: `http://127.0.0.1:4321` (the hooks and the form on); the page Sam reviews is `/?room=open`.
- The e2e run's `wrangler dev` on `127.0.0.1:8796`, started by Playwright's web server for the run and ended with it.

## Start prompt for a session on the other computer

> Resume section 5, the sign-up (Sam's four-jar picture), on the default branch `claude/youthful-planck-objwf5`, where it landed on 2026-11-03 awaiting Sam's verdict. Read `docs/handoff/2026-11-03/section-5.md`, `docs/specs/section-5-picture.md` (sections 14, 16 and 18) and CLAUDE.md's section 5 bullet and exceptions first. In a new worktree run `npm ci`, then `npm run graph`, then `npm run dev`, and open `http://127.0.0.1:4321/?room=open`; scroll from scene 5 into section 5, stop mid-cut on both sides of its middle, and check that the cut shows no edge of the section's own and that the glue settles to the nearer end. Ask Sam for his verdict on the transition and the glue, and on the open questions in the hand-off file; change nothing else until he answers. Verify any change with `npm run test:unit`, `npm run check`, `npm run build` and the browser suites (`SKREED_GL=gpu SKREED_PORT=8796 CHROME_PATH=<the installed Chrome> npx playwright test tests/e2e/room.spec.ts tests/e2e/signup.spec.ts --project=e2e`, after `npm run build:test`). Sam's process rules hold: a worktree per change, landed by `git merge --no-ff` after a clean `git merge-tree`, no pull requests unless he asks, no deploy without his word, nothing licensed in git.
