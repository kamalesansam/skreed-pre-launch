# The cue's words: review log

Graded against `docs/CHECKLIST.md` and `docs/specs/scroll-cue.md` section 7 (AC1 to AC8). Each round runs three independent reviewers, one lens each (the checklist and CLAUDE.md rules 1 to 50; the code and its tests; the spec's acceptance criteria and the records), and a skeptic per lens who tries to refute every FAIL; a FAIL stands only if its skeptic confirms it.

## Round 1, 2026-11-02: FAIL

### How it was checked

- The 20 frames read first, then the diff and the untracked files; the graph asked before the source (`graphify affected` on `rideCopy`, `cueWordsOn`, `resetRiders`, `FamilyCue`).
- Run by the reviewers: `node --test tests/unit/scroll-cue.test.ts` (8 of 8) and `npm run test:family` (64 of 64). Pixel reads of the committed frames with sharp, in memory. `solve()` and `skeletonPolys()` run over phone sizes for the family line.
- Not run by the reviewers: builds, browsers, Playwright, Lighthouse; E1 and E2 are not installed here.

### Checklist (the checklist lens)

| Item | Verdict | Evidence |
|---|---|---|
| A1 | PASS | I checked rules 1 to 50 against the 24 changed files and the 7 new ones. Nothing adds a gradient, emoji (grep found 0), em dash in copy, buzzword, italic, shadow, icon or arrow glyph. The words use Pearl Whisper or Urban Slate only (rule 24) and Open Sans 600 at --fs-label (rule 4). Rule 12 (words that fade in at rest, outside the reserved list), CLAUDE.md's section 2 line 'No copy text in the section' and family-page D9 and 21 are all covered by E-cue-text (CLAUDE.md 100-101), whose wording agrees with CHECKLIST D1 line 53 and scroll-cue.md 10. Rule 7's AA for Pearl Whisper on the family wash is graded under E3. |
| A2 | PASS | The only colours are var(--pearl-whisper) and var(--urban-slate) (shell.css 37 and 39, family.css 108). No new colour, no derived grey. |
| A3 | PASS | Open Sans 600 at --fs-label (0.875rem, 14 px), line height 1 (shell.css 37, family.css 108). It is a shipped weight (open-sans-400-600) already on both pages. No italic, no uppercase, no face under 12 px. The frames show it at the same size as 'All families' and 'Back to top'. |
| A4 | PASS | 'Scroll to see more' is the brief's own wording, in sentence case with no end stop (copy.ts 26, family copy.ts 16). No dash, emoji or buzzword (scroll-cue.test.ts 62-68; data.test.ts 101-111). No invented fact or count. |
| A5 | PASS | n/a: the change adds one line of chrome to pages that already show the gems and the case (all frames). No section is added. |
| B1 | PASS | Twenty Playwright frames, 10 states at 390 and 10 at 1280 (scripts/scroll-cue/frames.mjs), all read. One of them, scroll-cue-1280-gems.png, does not show the state it is named for; that is graded under AC4. |
| B2 | PASS | The words are fixed and nowrap. At 390 the landing line runs x 53-174, the family first-screen line x 134.5-255.5 and the story line x 253-374 (16 px from the right edge), so the gutters are 16 px or more. By the CSS, the landing line at 360 starts near x 38. The words are not tap targets (pointer-events none). The e2e checks scrollWidth at every size. |
| B3 | PASS | No storage and no links. The rest clock is module state (ride.ts 14) and one in-memory timer (page.ts 308-312). |
| B4 | PASS | The words are placed with px, tokens and env(safe-area-inset-*) only. Nothing is sized or animated in dvh or svh. |
| C1 | PASS | From the build record (scroll-cue.md 144), not re-measured because builds are not allowed here. Island +304 B gz against the plan's about 0.4 KB; family module +58 B against 0.1 KB; critical JS 16.6 KB, unchanged at 0.1 KB precision (boot.ts and reset.ts gain only a few bytes); total JS 208.3 of 250 KB. |
| C2 | PASS | n/a: no image, font or media added. |
| C3 | PASS | No WebGL added. The words transition opacity and visibility only (the unit test at scroll-cue.test.ts 85-88 checks every .cuetext rule). The single layout read, #find's rect, happens once per rest and only when every other condition holds (ride.ts 15 and 18; unit test 50-60). The family timer only toggles one attribute. |
| C4 | FAIL (confirmed) | Lighthouse was not run. The record says so: 'Not done here. Lighthouse' (scroll-cue.md 148). No score is pasted. |
| D1 | PASS | At the top of each page the words are visible at rest with the chevrons (top and family-top frames). Mid-page they wait at opacity 0 for a timer that the scroll restarts, not for an observer (ride.ts 16-20, page.ts 309-313). The new CHECKLIST D1 line 53 (E-cue-text) covers this. |
| D2 | PASS | Landing: reduced motion gets the poster tier, where the words stand with the still chevrons and use the same 0.5 s opacity fade (shell.css 46 keeps the chevrons still). Family page: reduced motion at load gives grid mode with no words; turned on after load, .cuetext joins the 'transition: none' list (family.css 298). |
| D3 | PASS | n/a as a data state: the words carry no data or input. Loading, no-JS and poster states are handled by the hide rules (shell.css 40 and 102, family.css 108-111). The misapplied 'nothing below' state is graded under code-1. |
| D4 | PASS | No hover or press state was added. Both lines are pointer-events none and aria-hidden. |
| E1 | BLOCKED (refuted as a FAIL) | BLOCKED. web-design-guidelines is not installed in this environment (it is not in the skill list), and the build record does not mention a run. The checklist says never PASS in this case. |
| E2 | BLOCKED (refuted as a FAIL) | BLOCKED. visual-critique:critique-screen is not installed. I read the 390 frames by eye; my findings are in notes. |
| E3 | FAIL (confirmed) | Both lines are aria-hidden <p> elements with no control, which is acceptable. The contrast record is wrong in three ways, measured on the committed frames with sharp. (1) Fog: the 1280 wipe1-end frame has rgb(132,137,148) behind the words, so Urban Slate reads about 3.05:1 at the median and 2.74:1 at the darkest twentieth. The record gives 4.1:1 and 3.9:1 from gem-rest frames only (scroll-cue.md 120, CLAUDE.md 103, CHECKLIST 71, DESIGN.md 282). (2) The builder's own D6 figure of 4.49:1 for Pearl Whisper at 360 x 780 (scroll-cue.md 129) is under AA and is not listed under any exception. (3) D9's first-screen 'about 4.4 to 4.6:1' (scroll-cue.md 130) was never measured on a drawn page except at 390 x 844 for blissful-blue, where I read about 4.6:1; 430 x 932 sits lower on the gradient and is likely under 4.5:1. |
| E4 | PASS | n/a: nothing writes data. |
| E5 | PASS | n/a: no schema or query. |
| G1 | PASS | n/a: /404 is not touched (spec 8). |
| G2 | PASS | n/a: no CTA change; E-G2 stands. |
| G3 | PASS | n/a: no title change. |
| G4 | PASS | n/a: no meta description change. |
| G5 | PASS | n/a: no Open Graph change. |
| G6 | PASS | n/a: no icons touched. |
| G7 | PASS | n/a: robots.txt not touched. |
| G8 | PASS | n/a: sitemap not touched. |
| G9 | PASS | n/a: no image added. |
| G10 | FAIL (confirmed) | The landing's top rows exist for 360 to 1280 (tests/e2e/scroll-cue.spec.ts 31), but no run is recorded. The pin's lines and both family lines were measured at 390 and 1280 only (scroll-cue.md 140), and the family spec runs only PHONE and WIDE (tests/family/specs/scroll-cue.spec.ts 35). The family words are untested at 360, 430, 768 x 1024 (phone layout with a larger stage, words at 204 px) and 1024. |
| G11 | PASS | n/a: no sticky CTA touched. |
| G12 | PASS | n/a: the words load no data. |
| G13 | PASS | n/a: no form. |
| G14 | PASS | n/a: no reserve flow. |
| G15 | PASS | n/a: privacy page not touched. |
| G16 | PASS | n/a: terms page not touched. |
| G17 | PASS | n/a: no cookie or storage added. |
| G18 | PASS | n/a: no analytics event added. |
| G19 | PASS | n/a: footer not touched. |
| G20 | PASS | n/a: cutover not touched. |
| G21 | PASS | The words are not links and create no dead end. The argument screen keeps 'Back to main page' and hides the words (390 and 1280 family-argument frames; family.css 111 :not(.arg-on)). |
| G22 | PASS | n/a: no breadcrumbs. |
| G23 | PASS | n/a: FAQs not touched. |
| G24 | PASS | n/a: contact line not touched. |
| G25 | PASS | n/a: no team photo. |
| G26 | PASS | n/a: no JSON-LD change. |
| G27 | PASS | n/a: no reviews or counts. |
| F1 | FAIL (confirmed) | AC2, AC4, AC5, AC6 and AC8 are not met or not evidenced; see their rows. AC1, AC3 and AC7 hold by code and the unit tests. |
| F2 | PASS | I grepped the 720 added lines: no TODO, FIXME, placeholder or lorem, and no commented-out code (the 2 heuristic hits are prose comments). |

### Acceptance criteria (the spec lens)

| AC | Verdict | Evidence |
|---|---|---|
| AC4 | FAIL (confirmed) | docs/specs/screenshots/scroll-cue-1280-gems.png (14.8 screens) shows no words. Inside the words' box (x 660-782, y 738-758) the darkest pixel is 165, which is the fog's own range (160-182 just above it). In scroll-cue-1280-cascade.png the same box goes down to 62 (Urban Slate). Yet docs/specs/scroll-cue.md:140 records the words as shown at 14.8, with no width given. The frame was written 5.6 s after the cascade frame (12:58:02 to 12:58:07); the cascade frame itself took 19.5 s under SwiftShader. Cause: scripts/scroll-cue/frames.mjs:91-97 moves from one shown place to the next and then waits for 'shown'. A poll that runs before the island's next frame drops is-on passes on the previous place's state, and the capture then catches the fade-out. tests/e2e/scroll-cue.spec.ts:82-85 has the same pattern ([6], [10] and [14.8] in a row), so those rows can pass without the words ever coming back. AC4's '1.5 s (±0.3 s)' is measured nowhere. The browser rows cover only 2.5, 6, 10 and 14.8; 1, 3, 5.0 and 15.2 are covered only by the pure rule's unit test (cue-words.ts:24-31, 8/8 here). The code path otherwise matches section 4 (ride.ts:14-23 and 35). |
| AC6 | FAIL (confirmed) | Measured on the committed frames as the median of the fog in a ring 8-20 px around each line's box. Pearl on the night: 11.0 to 13.8:1 (pass). Urban Slate on the fog: 4.45:1 (390, 6 screens), 4.36:1 (390, gems) and 5.2 to 5.7:1 (cascade). At 1280 x 800, 6 screens (scroll-cue-1280-wipe1-end.png, fog #82838d to #8e949f behind the words) it is 3.06:1, and 2.77:1 at the darkest twentieth; Pearl Whisper measures 3.24:1 there. The pending clause records 'about 4.1:1 ... 3.9:1' from gem-rest frames only (scroll-cue.md:120, CLAUDE.md:103, CHECKLIST.md:71, DESIGN.md:282). D5 (scroll-cue.md:128) calls Urban Slate the better colour. Neither holds at the first wipe's end on a laptop. The family words were not measured on the drawn page for frosty-white or mellow-yellow: only Blissful Blue frames exist, although D9 (:130) promised a drawn measure. That first screen samples 4.6-4.8:1 at 390. D6's computed 4.49:1 at 360 x 780 is not listed under section 10, as AC6 requires. The fog contrast itself is pending (graded against its default); what fails is the record. |
| AC5 | FAIL (confirmed) | Evidence exists only at 390 and 1280, and it holds there. On the first screen at 390 the words share the columns' bottom line (both calc(204px + var(--sab)), family.css:98 and :109; measured y 623-642 against the columns' bottom at 640). They sit 12 px above the scrubber by construction (--scrub-top 192 px, family.css:25). The story words show at the bottom right clear of Back to top, the beat text and the beat nav (frames). Nothing shows on the argument screen (frames, :not(.arg-on)). Grid mode is gated by html.m3d. But AC5 names 360 x 780 and 430 x 932, and tests/family/specs/scroll-cue.spec.ts:35 runs only PHONE (390) and WIDE (1280). No frame or measure exists at those sizes. D9's claim that the line clears the front case at 360 x 780 and 375 x 667 is unmeasured. The story's 'clear of the case's box' is in no check: the clearance list at :29 has no case box. The rows have not run yet. |
| AC2 | FAIL (confirmed) | At exactly 1100 px wide the code puts the words left of the column: shell.css:38 uses @media (max-width:1100px), the same breakpoint as the countdown's lift at shell.css:23, which is the right design. tests/e2e/scroll-cue.spec.ts:44 also expects left at 1100 (w > 1100). AC2 (scroll-cue.md:82) requires 'right of it from 1100 px' at 1100 x 800, as do D1 (:124), DESIGN.md:282 and hero.md:578, so the AC and its own test disagree. Everything else in AC2 holds by construction and in the frames. At 390 the words span x 53.3-174.3 with the column from 186.3 (a 12 px gap). At 1280 they start at 660.8, 12 px after the column's 648.8. The bottoms come from the same calc, inside the gutters. The seven-size rows run on the poster tier only and have not run yet. |
| AC8 | FAIL (confirmed) | Section 12 records the budget: island +304 B gz, family module +58 B, critical JS 16.6 KB unchanged, total 241.0 of 250 KB, CSP line unchanged. The unit tests pass: scroll-cue.test.ts 8/8 and npm run test:family 64/64, both re-run here. But Lighthouse was not run (scroll-cue.md:148 'Not done here. Lighthouse'), and AC8 requires it. |
| AC1 | PASS | Landing: shell.css:37 sets font:600 var(--fs-label)/1 var(--font-ui), letter-spacing 0, margin 0 and Pearl Whisper, with Urban Slate via [data-tone=light] (:39). Family: family.css:108 sets 600 at --fs-label, line-height 1 and Pearl Whisper, and the words inherit Open Sans from body (family.css:37) with p margin 0 (:43). No text-transform, shadow, border, background or arrow glyph. Every frame that shows the line reads exactly 'Scroll to see more'. data.test.ts covers FAM_COPY.scrollMore (test:family 64/64). scroll-cue.test.ts covers COPY.cue.label. |
| AC3 | PASS | Graded on code; the browser rows have not run. The landing chevrons' rules and keyframes (shell.css:28-31, 42-45) and countdown.inline.js are unchanged, and ride.ts:34 is untouched. The only test changes add the words to hide lists: overlay.spec.ts:21, v11-cue.spec.ts:17, countdown.spec.ts:89 and :150, harness/canvas.ts:4. |
| AC7 | PASS | Graded on code. Transitions are on opacity and visibility only (shell.css:37 and :40, family.css:108), and the unit test asserts this for shell.css. The family words are in the reduced-motion transition:none list (family.css:298), and the show rule sets only transition-delay. The landing words keep the chevrons' 0.5 s fade. The .chev reduced-motion rules are unchanged. Nothing loops or moves; the static translateX(-50%) is not animated. |

### Confirmed failures, most important first, and what iteration 2 changed

1. The family first screen's line meets the front case on short phone screens (code lens code-1; drawn overlap below about 605 px tall). **Iteration 2:** The line asks the page's own fit on every resize (`src/scripts/family/cue.ts` `landClear` over `solve()`, the line's computed bottom so the safe area counts) and stands down where the case's box comes within 4 px (`html.cue-tight`); unit rows over `solve()` at ten sizes, browser rows at 360 x 780, 375 x 667, 430 x 932 (clear) and 375 x 553 (stood down).
2. `.intro.po~.cuetext` pinned the words over the whole offline soft poster (code lens code-2, spec lens code-1). **Iteration 2:** The rule is gone; the words follow is-off there. A browser row raises the offline soft poster and checks the words hide from 8 px and at the page's end.
3. After a jump to the top the camera reaches late, the chevrons stay off and the words with them (checklist lens code-2; the code lens refuted the same point as older behaviour). **Iteration 2:** At the top the words come back alone after the rest when the chevrons are off and the document goes on below (`cue-words.ts`, the countdown script's own test, read once per rest); unit rows; a browser row.
4. The contrast record understated the fog (about 3.05:1 at the first wipe's end at 1280 against the recorded 4.1:1), left two Pearl figures under 4.5:1 unlisted, and measured no family on the drawn page (E3, AC6). **Iteration 2:** Contrast read on the drawn page with the line hidden: three reads per place on the fog at 390 and 1280, the family lines for three families at four sizes. Section 10, CLAUDE.md, the checklist and DESIGN.md carry the drawn figures; D5 restated.
5. The 1280 gems frame had no words: the frames script and the spec could pass on the place before (AC4). **Iteration 2:** Every move now waits for the words to hide before looking for them; the return is stamped by a MutationObserver and held to no sooner than 1.2 s; 1, 3, 5.0 and 15.2 added; frames recaptured.
6. The family rows ran at 390 and 1280 only (AC5, G10). **Iteration 2:** Rows at 360 x 780, 375 x 667, 430 x 932 and 375 x 553 against the front case's box.
7. AC2 said "from 1100 px" where the CSS and the test place the words left at 1100 (AC2, code-6). **Iteration 2:** "Above 1100 px" in AC2, section 2, D1, DESIGN.md, hero.md and the CSS comment.
8. Lighthouse not run (C4, AC8). **Iteration 2:** Run on the production build's poster tier against a build of the base commit, three runs each, alternated (section 12).
9. F1 follows the above. **Iteration 2:** Section 12 quotes each criterion with its evidence.

### Refuted by the skeptics

- checklist E1: Not a FAIL. CHECKLIST 61 sets E1's own pending default: 'if the skill cannot be installed in the build environment, the review records E1 as blocked with the reason, never PASS'. I confirmed web-design-guidelines is not installed: there is no user skills directory, the project's .claude/skills has only build, graphify, plan and review, and no plugin holds it. So E1 is BLOCKED (not PASS) by the checklist's own rule. It is an environment limit that no change to this diff can fix. Every earlier review recorded it as BLOCKED, not FAIL (family-page.review.md 360, quiz.review.md 37, quiz-gate.review.md 39).
- checklist E2: Not a FAIL, for the same reason as E1. CHECKLIST 62-63 says 'Pending: as E1'. visual-critique and critique-screen are not installed anywhere on this machine, so E2 is BLOCKED (never PASS) by the checklist's pending default, not a defect of the change. Earlier reviews recorded it as BLOCKED (family-page.review.md 361, quiz.review.md 38, quiz-gate.review.md 40). The other reviewer's by-eye reading is the accepted stand-in.
- checklist code-1: The premise is wrong. .grid-slot sits inside .fp-stage (FamilyPage.astro 41-43), which is position: fixed; inset: 0; overflow: hidden (family.css 120, unchanged since 6af5ad9). Making the slot static under 500 px tall (family.css 293) only moves the swatches inside that fixed, clipped box: a fixed box adds nothing to the document's scroll height. In grid mode, .beats, .beatnav, #tint, .arg and .fam-back are display: none (family.css 233), and Back to top, the logo and the HUD are fixed. The only in-flow content is section.lineup at height 100svh (family.css 86). So the page is one screen at 844 x 390 too, not about 520 px, and a scroll cue there would point at nothing. D8, family-page.md 1110, the unit test at line 95 and the hide at family.css 102 are right. The 'the page scrolls to them' comment at family.css 292 does not match the layout, but that comment is older than this change.
- code code-3: The mechanism is accurate. ride.ts:34 re-adds is-off while the lagged tp > 0, countdown.inline.js:22-24 re-checks only on scroll, resize and html class changes, and nothing toggles an html class as the followers settle. But this is not a defect of this change. (a) The chevrons staying off at the top after an unsnapped jump is pre-existing behaviour of unchanged lines, and spec section 9 says the chevrons' hide rules must not move. (b) The words do exactly what the spec says: section 2, row 1 ('shown and hidden with them' at the top) and section 4's first condition ('scrollY above 8 px (at 8 or under they stand with the chevrons)'), implemented at cue-words.ts:25. (c) No AC covers a return to the top. AC2 is scroll 0 after the intro, which works. (d) The proposed fix shows the words alone at the top while the chevrons are off, which contradicts row 1. That is a spec change, not a correction. The cases are rare (Home key, scrollbar drag, iOS status-bar tap from past 5 screens), and that visitor has already scrolled. Worth a note to Sam about the chevrons' stuck state, not a FAIL here.
- spec code-2: E-cue-text (scroll-cue.md:115) names section-2.md sections 2 and 3 as what it goes against, not as amended. The repo's practice is to keep the original lines and record the exception beside them, as rule 12 stands next to E-F5. The spec's record list (:108) asks only for section-2.md section 3 and AC7, and both are done (the bullet at :36 and the rewritten AC7). The A1 premise is false: E-F5 (rule 12 and D1) and E-CD-glitch (rules 12 and 48) appear nowhere in CHECKLIST.md, and no document asks for an A1 line per exception. settle.ts appears only in section 9's plan. Section 12's build record lists the files actually changed, and settle.ts needs no change: pauseCue (settle.ts:15-19) pauses only .cue and .scrollcue animations, the words have none, and they are in the parity HIDE lists. What remains is a nit: section-2.md:32's 'Copy: none' opener reads oddly next to its new bullet. It breaks no requirement.

### Design notes the reviewers left (not failures)

- Alone in the pin, the words kept the hidden column's side offset and lined up with nothing (two reviewers). Iteration 2 places them on the page's edge (D10).
- On a family page's story the line sits right above Back to top in the same type, so the pair can read as a two-item menu. Kept: the bottom right is the only place on a phone where the wash keeps Pearl Whisper at AA (D6).
- Back at the top the words fade in at once while the chevrons appear after their 0.5 s visibility delay. Kept: both are complete at 0.5 s.
- The scope stops short of the quiz's result into section 4 (another session is reworking those files), so the brief is not covered there yet.

## Round 2, 2026-11-02 to 03: FAIL, then iteration 5

### How it was checked

- Four independent reviewers, one lens each, on the lighter models (Opus): the checklist, the code and its tests, the spec's criteria and records, and the frames read by eye as the stand-in for E2. Graded at the branch's tip of the night (4249bf3 to abe953a; the records moved under them, the code did not). Each asked the graph first, re-ran `node --test tests/unit/scroll-cue.test.ts` (11 of 11) and `npm run test:family` (64 of 64), read the logs of iteration 4, and ran no build or browser.
- The skeptics (three per failure on Sonnet) were started on the 28 findings and stopped at Sam's word ("wrap it up real quick"); each finding was checked by hand instead, against the file and line it cites, and the verdict is recorded below.
- Not run: builds, browsers, Lighthouse; E1 and E2 are not installed here (BLOCKED, the checklist's own default).

### Checklist (the checklist lens)

| Item | Verdict | Evidence |
|---|---|---|
| A1 to A5, B1 to B4, C1, C3, C4, D1 to D4, E3, G21, F2 | PASS | 57 items graded; the rules checked against every changed file, the frames and the logs; C4 from lh-summary.log (100 against 100, three runs each) |
| C2, E4, E5, G1 to G9, G11 to G20, G22 to G27, H1 to H4 | NA | no image, media, data, form, copy section or launch state in this change |
| E1, E2 | BLOCKED | neither skill installed; the frames lens stands in for E2 |
| G10 | FAIL (held) | the pin's words and the family's words untested at 768 x 1024 and 1024 x 768 |
| F1 | FAIL (held) | section 12 graded every criterion PASS while back.spec.ts's Plex rows, grid.spec.ts's faces row and the v11-cue parity test had no run, and AC7 was broken by code-1 |
| record-1 | FAIL (held) | DESIGN.md's fog figures over "two runs", section 6's "no font", "adds nothing to the critical path", and unit figures from a log older than the lock commit |

### Acceptance criteria (the spec lens)

| AC | Verdict | Evidence |
|---|---|---|
| 1, 2, 4, 5, 6, 7 | PASS as graded | with AC4 and AC7 then broken by code-1 (the held place), fixed in iteration 5 |
| 3 | FAIL (held) | the v11-cue parity test named by the criterion had no run in any iteration |
| 8 | FAIL (held) | no browser row read the countdown's eyebrow or labels' face; back.spec.ts and grid.spec.ts had no run on this branch |
| record-1 to record-8 | FAIL (held) | the records against the code: the jump to the top (as code-1), Back to top named on the landing, D5's counts, DESIGN.md's figures, section 9's lists, iteration 4's dated figures, D6's figures with no committed script, D13's section number |

### Confirmed failures, most important first, and what iteration 5 changed

1. **code-1 / spec record-1 / checklist F1 (severity 3; three lenses).** Up to 1100 px a jump to the top from the pin moved the shown words from the corner to the column while visible (trace-4.log: `at=pin op=1` then `at= op=1 visible`), against section 4, D10 and AC7. Confirmed by reading ride.ts 27 to 28 and shell.css 45. Fixed: the pin place keyed on `data-at` alone, hidden while held without `is-on`, and dropped at the top only after the 0.5 s fade (`CUE.fadeMs`); a unit row and a browser row; verified on the real GPU (spec section 12, iteration 5).
2. **G10 (3).** The tablet sizes added to the landing's pin rows (one place of each kind) and the family rows.
3. **F1 / AC8 / AC3 (3).** A face row for the eyebrow and labels and the 106 px lift; the family and parity runs named in the record as not run here (stopped at Sam's word) and left as the follow-up after the landing; the overlay test's whole-countdown hide explained in AC3.
4. **code-2 (2).** The lock's wiring was in no test and the stuck-top row could not tell the fix from its own wait: a unit file over ride.ts with a stub document covers the three locks, the rest from the lock's end and the held place; iteration 4's unit and check figures marked as older than the lock commit.
5. **code-3 (2).** The pin rows' move check ran from a hidden place: moved to the 15.2 place (the spec and frames.mjs); the bottom inset asserted; AC4's quiz clause recorded as the unit rule's.
6. **code-4 (2).** The overlay parity test hides the countdown whole: the face row pins the eyebrow's and labels' face and lift instead; AC3 says so.
7. **spec record-2 to record-8, checklist record-1, frames record-1 to record-4 (1 to 3).** Every one confirmed against the file and fixed (the list in section 12, iteration 5); D6's figures re-computed by a committed script (`scripts/scroll-cue/wash-contrast.mjs`).
8. **code-5 (1).** The family clearance read on every shade change: read once per size now.
9. **code-6 (1).** The soft poster's page under a still loading island: `html.poster` is the lock to the rule; the offline row waits past the rest.
10. **code-8 (1).** family.css's transitions walked by the unit test; the front case measured at 390; the story's show time stamped.
11. **code-9 (1).** Section 9's touch list completed, the countdown's lift struck from "Must not move".

### Held without a change, with the reason

- **code-7 (1).** After section 2 has failed to build the words stay off past the pull-back's end. Kept: the wipe opens on black there (the composite's black stands in for section 2's output), where neither tone of the words reads; the states table now carries the row and the unit row's message says so.
- **frames-23 (1, design).** On phones the words can read as a fifth line of the countdown rather than the arrows' caption (17 rows under the labels, 10 over the chevrons' faint arms). A design call for Sam (section 12, iteration 5, For Sam); the reviewer's fix, a further 12 px lift of the countdown, is recorded there.

### Design notes the reviewers left (not failures)

- The section index's four words stay Open Sans beside the Plex chrome; the family bottom bar mixes faces on one row (E-chrome-font's own clause); the phone story's two lines sit 4 px over BACK TO TOP in the same face. For Sam.
- The 1280 landing's words sit 2 px lower than the countdown's labels on the same bottom row (line-height 1 against normal); invisible at 600 px apart.
- The phone drawer of the section index sits in the top layer, so words pinned at the bottom left show cut by its edge in the strip it leaves.
- The two lines of the phone story depend on `max-width: 9ch` being exactly SCROLL TO's width; no row covers another engine.
- Lighthouse's LCP element is the eyebrow, now in Plex; a quiet-machine rerun would show whether the font swap moves LCP (100 throughout).
- cueWords reads scrollY and innerHeight after the ride's style writes in the same frame; passing the loop's own values would save a style flush during the first wipe.
