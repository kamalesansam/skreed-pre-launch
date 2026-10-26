# The quiz gate: the build on quiz/gate-section-4 (evidence for docs/specs/quiz-gate.md)

Built 2026-10-26 on branch `quiz/gate-section-4`, cut from the default branch at 24564a3, in its own worktree on the Windows machine (Node 24.22.0, npm scripts through Git's bash). The spec is `docs/specs/quiz-gate.md` with its Built paragraph (the two amendments: the hall and the director chunk load lock or no lock, and the ride waits for the hall at most 1.5 s). Every figure below is read from the commands named beside it; the "before" column is a build of 24564a3 made with the same flags from `git archive 24564a3`, in a short temporary folder outside the repository with a junction to the main clone's `node_modules` (the session's scratchpad path was too long for Windows to spawn node in).

**In one paragraph.** The unit tests (192, 191 passing and 1 skipped, the 187 of the hand-off plus the gate's 5), the family tests (51), the type check and the production and staging builds pass; every enforced budget line holds and the post-build guard passes. The deck chunk grows by 1.1 KB gz (its allowance 1.5 KB) and stands at 9.8 KB, over quiz.md's 8 KB line as before (quiz.md AC10, the quiz's open item, not this part's); the island chunk grows by 0.1 KB, critical JS by 0.3 KB, section 4's script by 38 B, total JS by 1.6 KB, and the CSP line by 54 characters. No frame was taken and the e2e specs were not run: the build machine has no Playwright browser installed and `npx playwright install` was not run. The reviewer grades the acceptance criteria; nothing here is graded.

## 1. Tests, type check and builds

| Command (in the worktree) | Result |
|---|---|
| `npm run test:unit` | exit 0; the reference guard: "nothing of the references in public/ or src/"; 192 tests, 191 pass, 0 fail, 1 skipped (the known skip), 0 todo; the new `tests/unit/quiz-gate.test.ts` is 5 of them, named (a) to (e) after AC7 |
| `npm run test:family` | exit 0; 51 tests, 51 pass |
| `npx tsc --noEmit -p tsconfig.json` | exit 0 (the tests and scripts are in its include, so the e2e additions type-check) |
| `npm run build` | exit 0; csp.mjs: 12 pages, 6 inline script hashes (5 before: the gate's step is the sixth), 13 style hashes, media-src 'self', the line 1,350 characters (1,296 before); budget.mjs: "every enforced line of section-4-flux.md 6 holds (49 enforced) and AC8's formats check"; the guard: "the ten loops and nothing else, media-src 'self'" |
| `npm run build:staging` | exit 0; the same six hashes and 1,350 characters; budget.mjs: "every enforced line of section-4-flux.md 6 holds (48 enforced) and AC8's formats check; 1 over Sam's figure, pending him: section 4's script at 30.0 KB against his 30.0 KB" (section 2, the staging note); the guard passes; this `dist` is left in place for the frames |
| `npx playwright test tests/e2e/quiz.spec.ts tests/e2e/room.spec.ts` | not run: no Playwright browser on this machine (`npx playwright install` was not run, as the brief said). The quiz spec's 13 gate test blocks (named "QG AC..."; 14 cases at run time, the 3D resident case at two sizes) and its four amended cases (the keyboard, the decode, the no-JS path, the accessibility tree) are written against the spec and unrun; the room spec carries `?room=open` and is unrun |
| `node scripts/quiz/frames.mjs` | not run (the same reason); its gate part is written and writes `docs/specs/screenshots/quiz-gate-<w>x<h>-<state>.png` |

## 2. The budget (production builds, `npm run build`, `scripts/hero/budget.mjs dist --mode build`; scripts at gzip, KB = 1024 B; the exact bytes with `gzip -9` through node's zlib)

| Part (quiz-gate.md section 6) | Before (24564a3) | After | Growth | Allowance | Line |
|---|---|---|---|---|---|
| The quiz chunk, `deck.<hash>.js` (now with `gate.ts`) | 8.7 KB (8,888 B; raw 21,121) | 9.8 KB (10,038 B; raw 24,248) | +1.1 KB (1,150 B) | at most 1.5 KB | quiz.md's 8 KB for the deck and the track, over before and after (quiz.md AC10, the quiz's open item); not enforced. budget.mjs's "quiz JS" line, the deck with `decode.<hash>.js` (1.3 KB, unchanged): 10.0 KB before, 11.1 KB after |
| The island chunk, `hero.<hash>.js` | 54.2 KB (55,466 B) | 54.3 KB (55,578 B) | +0.1 KB (112 B) | at most 0.3 KB | inside the total |
| Section 4's script (director, walk, room) | 29.5 KB (30,255 B) | 29.6 KB (30,293 B; the director 22,053 to 22,089 B) | +38 B | at most 0.1 KB | 38 KB hard, Sam's 30 KB pending: under both on the production build |
| Critical JS (inline scripts, module scripts, static imports) | 14.7 KB | 15.0 KB | +0.3 KB | at most 0.5 KB | 60 KB (CHECKLIST C1). The parts: the inline step 239 B gz (368 characters minified; 281 B and 459 characters with the hooks part on staging); Quiz.astro's loader 729 to 769 B; Room.astro's module script 443 to 483 B |
| Total JS as CLAUDE.md counts it (critical, island, quiz) | 202.4 KB | 204.0 KB | +1.6 KB | at most 2.4 KB (the spec's sum) | 250 KB |
| Total JS with section 4 and scroll.ts (budget.mjs line 161, enforced) | 234.8 KB | 236.4 KB | +1.6 KB | | 250 KB, holds |
| scroll.ts | 2.8 KB (2,870 B) | 2.8 KB (2,870 B) | 0 | unchanged by the spec | 4 KB |
| Section 4 on the poster tier: its script | 8.0 KB | 8.0 KB | 0 | | 8.5 KB |
| Section 4's first view (its markup and room.css) | 3.9 KB (markup 13,702 B, room.css 7,448 B) | 3.9 KB (markup 13,721 B, room.css 7,496 B) | +19 B of markup, +48 B of CSS before gzip | under 0.1 KB | 4 KB, holds; the inline step sits after `</section>`, outside the slice |
| The CSP line | 1,296 characters | 1,350 characters | +54 (one hash and its space) | 54 | 1,900 (csp.mjs) |
| `index.html` (whole, gzip) | 27,486 B | 27,725 B | +239 B | | no line |
| Images, fonts, data | none | none | | | |

**The staging build** (`npm run build:staging`, hooks and Tune on; the lines that differ): critical JS 15.2 to 15.5 KB; quiz JS 10.0 to 11.1 KB; the island chunk 55.2 to 55.3 KB; total JS with section 4 and scroll.ts 237.2 to 238.8 KB; section 4's script 30,702 to 30,740 B gz (+38 B, the director 22,491 to 22,529 B), which is 20 B over Sam's pending 30 KB figure (30,720 B) where the baseline sat 18 B under it, so budget.mjs prints "over, pending Sam" for that line on staging (it stops the build only past 38 KB; the production build stays under at 30,293 B). The reviewer should read this with the spec's section 6 row for section 4's script (growth at most 0.1 KB: 38 B holds) and Sam's pending line (section-4-flux.md section 11, item 1).

**The production page.** `dist/index.html` of `npm run build` contains `room=open` 0 times and `skreed:quiz-done` once (the inline step); `<section class="room" id="room" aria-label="Section 4: the entrance to the Skreed world" data-state="hall" hidden data-locked>`; four inline scripts (three before). The staging page contains `room=open` once, in the step's hooks part.

## 3. What the build is, in short

Code: `src/config/quiz.ts` (`QUIZ_COPY.skip`, `QUIZ_GATE`), `src/scripts/quiz/gate.ts` (new), `src/scripts/quiz/deck.ts`, `src/components/quiz/Quiz.astro`, `src/styles/quiz.css`, `src/components/room/Room.astro`, `src/inline/room-gate.inline.js` and `src/inline/room-gate.hooks.inline.js` (new), `src/styles/room.css`, `src/scripts/hero/hero.ts`, `src/scripts/hero/section4/director.ts`, `src/env.d.ts` (`__skreedHall`). Tests and scripts: `tests/unit/quiz-gate.test.ts` (new), `tests/unit/quiz.test.ts`, `tests/unit/room.test.ts`, `tests/e2e/quiz.spec.ts`, `tests/e2e/room.spec.ts`, `scripts/quiz/frames.mjs`, `scripts/room/render-stills.mjs`, `step-frames.mjs`, `contrast.mjs`, `product-check.mjs`. Documents: `docs/specs/quiz-gate.md` (the Built paragraph and the amendments), `docs/specs/quiz.md`, `docs/specs/section-4-flux.md`, `CLAUDE.md`, `docs/CHECKLIST.md`, `DESIGN.md`, `docs/HANDOFF.md`, `docs/specs/hero-architecture.md`, this record.

## 4. Open for the reviewer

- AC1 to AC6 and the e2e half of AC7 rest on `tests/e2e/quiz.spec.ts` and `tests/e2e/room.spec.ts`, which could not be run here; the unit half of AC7 ran (section 1). The frames of section 7 do not exist yet.
- The deck chunk is over quiz.md's 8 KB line (AC10 there), as before this part; the growth is inside this part's allowance.
- Section 4's script on the staging build is 20 B over Sam's pending 30 KB figure (section 2); the production build is under it.
- `docs/specs/quiz-gate.md`'s section 7 frames and the measurements of its section 2 (the intro's height with the fourth row, about 316.6 px at 390 x 844 and about 326.4 px at 1280 x 800) are to be read from the frames when a browser is available.
