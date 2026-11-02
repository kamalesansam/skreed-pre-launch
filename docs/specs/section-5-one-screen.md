# Section 5 on one screen: the relayout (spec amendment)

Slug `section-5-one-screen`. Written 2026-11-02 from Sam's brief of the same day (below) and the two designs made for it that morning, while the build ran, on branch `claude/section-5-signup-glass-jar-9d74d2` at 78eae8f with the liquid of `docs/specs/section-5-liquid.md` in the working tree (uncommitted, built and unit-tested). Every figure marked as the prototype's is read from the chosen design's measurements (its CSS and markup injected into the live page on the dev server, the 3D path, Chrome on this machine at 1x on laptops and 2x on phones, the dev toolbar hidden); the build's own figures replace them after the measure (section 14). It amends `docs/specs/section-5-liquid.md` (and through it `docs/specs/section-5-sand.md` 2, whose layout the liquid kept) and `docs/specs/section-5.md`: the sections below replace the parts of them they name and leave the rest standing. This round keeps no review log and no build record (the process, below).

**Sam's brief, verbatim (2026-11-02).** "ok now here's the thing , we need to make sure that if the user is in this section, all the content of this section should fit inside the screen, there shouldnt be more scrolling involved for the same section again and again, so relayout the text in a way where everything is under the same screen, for both phone and laptop ratio"

**The process, his words of the same day.** "i'll do the review part, so we'll refduce time, u dont have to review, i'll review it on the localhost port on the browser visually and tell u if i like it or not, so cut down the time to only building". So this round has no `review` step and no grading against `docs/CHECKLIST.md`: what is built goes to Sam on the dev server (http://127.0.0.1:4321, his review server), after a measuring agent has checked it by the numbers of section 7. CLAUDE.md's loop of plan, build and review is set aside for this round at his word; the loop itself is unchanged.

**What this changes in section-5-liquid.md.** Its section 2's layout paragraph (the sand's layout, as built in `signup.css` and `Signup.astro`: one column, the slot `clamp(176px, 56vw, 240px)` wide at 4 : 5, 218 x 273 at 390 x 844, the count line under it, the three follow rows below; from 720 px the follows left of the 240 x 300 slot) and the slot of its laptop paragraph. Every size on screen that follows from the slot scales with the new slots (the jar's box, 245.7 px tall at 390 and 270 at 1280 before; the surface's ellipse; the stream's widths; the dimple, the rings and the seam in px); the maths in jar units stands. AC2's slot sizes and its "the count line sits under the slot ... from 720 px the follows list stands in the column left of the jar" give way to section 7 here. AC1's `scroll` frame is now taken 120 px back up (the body is one screen, so a scroll down from the rest runs the exit), and its `form` frame is the rest frame. Everything else of the liquid stands: the jar, the glass, the dye, the bands, the stream, the schedule, the stills, the hooks, the events, the states.

**What this changes in section-5.md.** Its section 2's "At rest, top to bottom" (one column in reading order) gives way to the compositions of section 2 here. Its section 5's scroll map sets `.su-body` to `min-height: 100svh`; the body is now at least the dynamic viewport tall with the difference in its bottom padding (section 2 here, "The body and the rest place"). Its section 2's "The exit seam (the loop)" runs the seam on any crossing of exitY downward; the crossing now runs it only once the page has rested at the section (G4). `exitY` and `restY` keep their definitions; with the body one screen tall they are both the section's top.

**What stays.** Every string (`SIGNUP_COPY` unchanged), every id and class, every data attribute but one new one (`data-leads`, section 3 here), the follows and their states, the form's behaviour and states, the lock with section 4, the fourth wipe and its glue span, the wrap and its landing at restY, the exit seam's cloud and jump once it runs, the poster tier's idiom and the no-JavaScript path, the 64 stills, the quiz's two type tokens, the decode.

**The designs (2026-11-02).** Two independent designs, each prototyped on the dev server by DOM and CSS injection and measured on the 3D path: 'compose' at nine sizes (the follows beside the jar on a phone; the head, the jar group and the save column on a laptop) and 'stack' at fourteen (one column in reading order on a phone, the follows beside the jar; two columns on a laptop, the jar at the right; the type set by the height). Compose was chosen for the build. Four grafts are taken onto it (section 5 here): one idea of stack's (G1) and three guards both designs found (G2 to G4). Where this spec and the design's files differ, this spec decides; where it is silent, compose decides.

## 1. Goal

The whole of section 5, from the headline to the credit, inside one screen at the section's rest place, on a phone and on a laptop, with the form on and off, so a visitor at the sign-up never scrolls within it: no line dropped, no word changed, every control still 44 px, no line under 13 px, the jar still drawn exactly in its slot. Brand goals as section-5-liquid.md 1 (3 and 4, with 1).

## 2. The composition, phone first

Every composition centres its content in the small viewport under the logotype's band, so at rest the body fills the screen from the section's top. The figures are the prototype's, but for the short phone with the form (G1), whose figures are the build's own reckoning before the measure.

### Phones (under 720 px)

One column, 358 px at 390 inside the 16 px insets. The top padding is the inset plus 44 px: Back to top's 44 px row, centred on the logotype's, ends at the inset plus 33.6 px, so the headline clears it by 10 px. The bottom padding is the inset, with the safe area. Four blocks, 16 px apart (12 px on a phone under 800 px tall):

1. **The head** (`.su-head`). "You’ve made it this far." on one line at `--su-fs-h` (24.52 px at 390; the type, section 4 here), 8 px, then the sub-line in four balanced lines at 15 px.
2. **The jar block** (`.su-jar`). "Every follow fills the jar" across the column, 8 px, then two columns 16 px apart. The left column is 21 glyphs wide plus 1 px (190 px at 390; "Nothing collected yet" is its longest line). It holds the three follow rows, 8 px apart, each one 44 px hit row: the underlined word on its first line and its state ("Not yet", "Collected") on the line under it, inside the same row (the state lets a press through to the word). The count line sits at the column's foot, level with the slot's foot. The slot (`.su-slot`) takes the rest of the width at 4 : 5: 152 x 190 at 390, 137 x 171.3 at 375, 122 x 152.5 at 360; the jar's box is 0.9 of its height (121.6 x 171 at 390). The slot is bound by the width, so it does not grow with the height.
3. **The save block** (`.su-save`). "Got your colours?" on one line at `--su-fs-h`, 12 px (8 under 800 px tall), its sub-line in three lines, 12 px, then the form. "Email" stays above the field. Under it one row holds the field (207 x 44 at 390, its Pearl Whisper line) and "Save my colours" (135 x 44), 16 px apart, the send word's underline level with the field's line: Sam's picture puts the field and the button side by side. Then the consent row (44 px, two lines, "[ ]" on the first); one reserved message line that the three messages share, the first with words showing (the email's before the consent's before the send's), at `--su-fs-s`; the fine print in two lines. The fields and the done line stand in one grid cell, the hidden one kept by `visibility` as the quiz's cards are, so a send never changes the body's height.
4. **The foot** (`.su-foot`). "Keep following to keep your colours." over the credit, one line each, the credit at `--su-fs-s`.

At 390 x 844 with the form the content runs from the headline's box at y 79 to the credit's foot at 808; at 360 x 780 from 67 to 755.5, 17 px to spare. Without the form (production today, `PUBLIC_LEADS` off) the save block is the heading and its sub-line (108 px at 390) and the same composition centres lower: 172 to 715 at 390 x 844.

**The short phone with the form on (G1).** At 390 x 664 and 375 x 667 the composition above runs over with the form, by 122.5 and 102.9 px in the prototype, with every line at 15 px. So on a phone 700 px tall or less with the form rendered (the section's `data-leads`), the composition closes up by stack's measures, as built: every line set by the height (the type, section 4 here; 13 px at 667, never under), the headings in proportion (about 21.3 px at 667, never under 20), the credit and the message line no larger than the lines, the field staying 16 px; the follows' rows touching, each still 44 px, the state flush under its word; the slot as tall as the follows and the count line, at the column's right edge (about 127 x 159 with 13 px lines); "Email", the field and "Save my colours" on one row; the top padding the inset plus 34 px (Back to top's row ends there) and the bottom padding 8 px. Without the form none of it applies, and those two screens fit at the sizes above (617 of 664 and 610.5 of 667).

### Tablets (720 to 1179 px)

The body is at most 760 px wide plus the insets, its top padding the inset plus 56 px, the blocks 24 px apart. The head; then the jar block as one group, the follows column at its content's width centred against the slot 32 px to its right. The column holds "Every follow fills the jar", 12 px, the three 44 px rows, each the word and its state on one line, the state's box nine glyphs wide so "Collected" never widens the column or moves the slot, 12 px, then the count line. The slot is `--su-slot-h` tall, `clamp(240px, 36svh, 400px)`, and four fifths of it wide (294.9 x 368.6 at 768 x 1024). The save block stands under the group, the form at most 34em wide; then the foot, the closing line over the credit. The last line ends at 983 of 1024 with the form.

### Laptops (from 1180 px)

The body is centred and at most 1440 px wide plus the insets, its top padding the inset plus 56 px; three rows 24 px apart, centred in the screen.

- **Row 1, the head**, across both columns: the headline on one line at the quiz's `--su-fs-q` (32.85 px at 1366 x 657, 36.5 at 1536 x 730, 40 at 1280 x 800, 48.5 at 1920 x 970), 8 px, the sub-line in two lines within 64ch.
- **Row 2**, two columns spread to the body's edges, at least 32 px apart. The jar group: the follows column as the tablet's, 32 px left of the slot and centred against it, the slot `clamp(240px, min(48svh, 27.5vw), 520px)` tall at 4 : 5. The save column, `min(32em, what is left)` wide (547 px at 1366, 607 at 1536, 466 at 1280, 604 at 1920), centred against the jar group: "Got your colours?", 12 px, its sub-line (two lines; three at 1280), 12 px, the form as the phone's (the label, the field and "Save my colours" on one row, the consent row, the shared message line, the fine print; the consent and the fine print take two lines each at 1280).
- **Row 3, the foot**: the closing line at the left and the credit at the right, on one baseline.

The head and the foot carry `contain: inline-size`, so their long lines never widen the jar's column. At 1366 and 1536 the jar group is taller than the save column, so the form adds no height there.

| Viewport | Slot | Jar box | The last line's foot (form on) |
|---|---|---|---|
| 1366 x 657 | 252.3 x 315.3 | 201.7 x 283.8 | 598 |
| 1536 x 730 | 280.3 x 350.4 | 224.2 x 315.4 | 657.8 |
| 1280 x 800 | 281.6 x 352 (bound by the width) | 225.2 x 316.8 | 718.7 |
| 1920 x 970 | 372.5 x 465.6 | 297.9 x 419 | 850 |

On a laptop the jar is larger than before: 283.8 to 419 px tall, against 270.

### The body and the rest place

- `.su-body` is a grid at least the dynamic viewport tall (`min-height: 100dvh`, `100vh` where `dvh` is unknown), and the difference between the dynamic and the small viewport goes into its bottom padding (`100dvh - 100svh` added), so the content keeps its place in the small viewport whether Safari's bars are shown or collapsed and the body's bottom is the viewport's bottom at rest. It never has a fixed height: a screen under the design's floor grows the body and the page scrolls by the difference; nothing is clipped.
- So `exitY` (the body's document bottom less the viewport's height) and `restY` (the larger of the section's top and exitY) are both the section's top: the rest place is the section's top with the body filling the screen. The wrap lands there as before (section-5.md 2). A scroll down from it crosses exitY at once, which is why the exit waits for a rest (G4).
- `.su-loopend`, the empty screen under the body that gives the exit's trigger its room, stays.

### The poster tier and no JavaScript

The same compositions, the text on `--night` and the slot's still (`picture.su-still`, placed inside the slot as built); the `sizes` hint of its two sources follows the new slots (section 3 here). Neither design measured this tier, and section 7 does not grade it.

## 3. Content and markup

No string, id or class changes, and no element goes: the copy test, the hooks and the DOM script read the same names. One data attribute is new: `data-leads` on `section#signup` when the build renders the form (`PUBLIC_LEADS` on), the marker the short phone's rule reads (G1). In `Signup.astro`, inside `div.su-body#suBody`, as the design has it and as built:

1. The headline and the sub-line are wrapped in `div.su-head`.
2. `.su-jar` gains a first child, `div.su-collect`, holding "Every follow fills the jar" (`p.su-jars-h`, moved in from before `.su-jar`), the follows list (`ol.su-follows`, unchanged) and the count line (`p.su-count`, now after the list). The slot (`div.su-slot`, unchanged with its picture) is `.su-jar`'s second and last child. The reading order is now the label, the follows, the count and the jar's description, the visual order on every layout; it was the label, the jar, the count, the follows.
3. "Got your colours?", its sub-line and the form are wrapped in `div.su-save`.
4. The closing line and the credit are wrapped in `div.su-foot`.
5. The live region and the `noscript` stay the body's last children.
6. The two `source` elements of `picture.su-still` take `sizes="(min-width: 1180px) 22vw, (min-width: 720px) 320px, calc(100vw - 238px)"` in place of `(min-width: 720px) 240px, 56vw`. On a phone the slot is the column less the 21-glyph column and the gap (152 px at 390, 122 at 360); it is at most 320 px from 720 and at most 22vw from 1180. A 2x phone still takes the 320w file.

In `signup.css` the rules for the body, the jar block, the follows' rows and the form's layout are replaced, and the header comment describes the three compositions. `.signup` and its tokens, the focus rings, `.su-still`, the tabular numerals, the links, the field, the consent row, autofill, the loop end, the fade, the poster tier, no-JS and the gate's rule stay as built. Nothing animates, and hover is the links' underline alone, as before.

## 4. The type

- **The quiz's two tokens stay** on `.signup`, equal to `quiz.css` (the unit test holds them): `--su-fs`, `clamp(15px, min(calc(0.6rem + 0.95vw), 2.6vh), 22px)`, for every body line, and `--su-fs-q`, `clamp(24px, min(calc(1rem + 2.3vw), 5vh), 52px)`, for the headings where they fit.
- **Two derived tokens on `.su-body`**, a decision to record, because on a phone these lines leave the quiz's sizes (E-S5-font, section 11):
  - `--su-fs-h`, `min(var(--su-fs-q), calc((100vw - 2 * var(--inset)) / 14.6))`, for the two headings. It holds the headline's 24 glyphs (0.6 em each in Plex Mono) to one line of the column, so "You’ve made it this far." costs one line and not two, the line a phone's screen does not have. It bites only under about 400 px wide: 24.52 px at 390, 23.49 at 375, 22.47 at 360, against the quiz's 24.97, 24.62 and 24.28.
  - `--su-fs-s`, `max(13px, min(var(--su-fs), calc((100vw - 2 * var(--inset)) / 24.6)))`, for the credit and the shared message line. It holds 40 glyphs ("That doesn’t look like an email address." and the credit) to one line, so the reserved message line is one line tall and the credit never wraps; it is never under 13 px and bites only under about 400 px wide: 14.55 px at 390, 13.94 at 375, 13.33 at 360.
- **The short phone with the form on (G1)**, under 720 px wide and 700 px tall or less, with `data-leads`: a third derived token, `--su-fs-l` = `clamp(13px, 1.95svh, var(--su-fs))`, sets every line by the height (stack's `--su-fit`: the quiz's size capped by a share of the small viewport's height; 13 px at 664 and 667, never under); `--su-fs-h` becomes `clamp(20px, 3.2svh, ...)` with its phone value as the ceiling (about 21.3 px at 667, never under 20); `--su-fs-s` takes `--su-fs-l` in place of `--su-fs`, so the credit and the message line are never larger than the lines.
- **The field** stays 16 px, so iOS never zooms. The headings stay at a line height of 1.25 and the lines at 1.45; the count and the state lines keep their tabular numerals.

| Viewport | Body | Headings (the quiz's) | Credit and message line |
|---|---|---|---|
| 390 x 844 | 15 | 24.52 (24.97) | 14.55 |
| 390 x 664 | 15 | 24.52 (24.97) | 14.55 |
| 375 x 667 | 15 | 23.49 (24.62) | 13.94 |
| 360 x 780 | 15 | 22.47 (24.28) | 13.33 |
| 768 x 1024 | 16.9 | 33.66 | 16.9 |
| 1280 x 800 | 20.8 | 40 | 20.8 |
| 1366 x 657 | 17.08 | 32.85 | 17.08 |
| 1536 x 730 | 18.98 | 36.5 | 18.98 |
| 1920 x 970 | 22 | 48.5 | 22 |

The prototype's sizes, before G1. With the form on at 390 x 664 and 375 x 667, G1's sizes replace those two rows; stack's prototype read 13 px lines, 20 px headings and a 13 px credit there, in its own composition.

## 5. The four grafts

Each with what it fixes, why it is taken and the builder who takes it.

- **G1, the short phones with the form on fit too** (the layout builder; stack's idea). Compose held every line at the quiz's 15 px floor on a phone, so it could not fit 390 x 664 and 375 x 667 with the form: 122.5 and 102.9 px over in its prototype. It reckoned the least its content can take at 13 px at about 695 px, and that only dropping copy would close the gap. Stack fitted both screens with the form by setting its type by the height (`clamp(13px, var(--su-k), var(--su-fs))`, `--su-k` a share of the small viewport's height, smaller with the form on) and closing its gaps there, to 13 px lines and 20 px headings. The idea is taken onto compose: on a phone 700 px tall or less with the form on, the type follows the height down to 13 px, the follows' rows touch, the slot narrows to the follows' height, "Email" joins the field's row and the paddings close (section 2 here). Why: Sam's brief asks it "for both phone and laptop ratio", with no phone left out, and the form will be on in production once its Worker exists; production today, with no form, keeps the sizes of the type's table (section 4 here).
- **G2, the jar scene resized with the window** (the guard builder; a bug both designs found). `src/scripts/hero/stage/resize.ts` resizes the renderer, the fog, section 2's scene and section 4's (`ctx.room`) on a window resize, but never section 5's jar scene (`ctx.signup`). After a phone's rotation, a laptop window's drag or Safari's bars changing the height, the jar chunk keeps its old target and view size and draws the jar off its slot until a reload: about 110 px right of its slot at 1536 x 730 after a load at 1280 x 800 in compose's prototype, and off at 1536 x 730 and 1366 x 657 in stack's. The jar scene is resized with the others, as built: `ctx.signup?.resize(...)` beside section 4's line in `resize.ts`, so the jar's two targets, its view size and the slot are read afresh. Why now: the new slots are sized from `svh` and `vw`, so a resize moves and sizes them where the 240 px slot stood still.
- **G3, the slot re-read on any change of its box** (the guard builder; both designs). The island re-reads the slot's rect when the section, the body, `#find`, `#room` or the root change size, when the root's class changes, or when the window resizes (`jars.ts`, `watchLayout`'s list). With the body a screen tall and its content centred in it, a block that changes size without changing the body's (a late web-font swap, the decode's glyph split changing a wrap at mount) moves or sizes the slot unseen. The slot, its block (`.su-jar`) and the body's own blocks (its children) join the watch, as built, so any change of a box that places the slot re-reads it. The layout itself holds every block's height after load (the form's one cell, the shared message line, the nine-glyph state box, the 21-glyph phone column, the count's one-line strings), so no press and no form state moves the slot (AC7); G3 covers what the layout cannot promise.
- **G4, the exit armed only after the page has rested at section 5** (the guard builder; both designs). With the body one screen tall, exitY is the section's top, the rest place itself. A wheel burst or a touch's momentum still running as the section's top reaches the viewport's top crosses exitY and runs the exit seam at once, so a fling from section 4 would carry through the sign-up into the loop and the visitor would never rest on it. Before, the body was 300 to 600 px taller than a screen, so the page always passed through the section. Now the exit is armed only once the page has rested at restY; until then a scroll that would cross the rest is held at it; once armed, a scroll down from the rest runs the exit as before (a crossing, never an arrival: the cloud, the jump to 0). As built, the rule is a pure module, `src/scripts/hero/section4/exit-guard.ts` (`EXIT_GUARD`: `restMs` 300, `near` 1, `leave` 0.5; unit-tested by `tests/unit/exit-guard.test.ts`), fed a frame at a time by the director. It arms once the page has been within 1 px of restY with no wheel, touch or key input and no movement for 300 ms and no finger on the glass (after a wrap from the top, the same rest once the wrap's lock has ended). It disarms when the page goes more than half a screen above the rest, on any frame outside the hall and the scenes (a seam, the entry, the way back), on a refusal and by the exit itself. The page past the rest while not armed is held at it by an instant `scrollTo` each frame, as the exit's cover-in holds the scroll, with no cloud; the exit's own hold now holds at restY. Where the page's seams refuse (a field that takes typing focused, the on-screen keyboard up, the page zoomed) the guard neither holds nor exits, and disarms. Its listeners are passive, so no gesture is cancelled; `__s4.state().exitArmed` reports it. The hold is a pending exception, E-S5-hold (section 11). Compose's other remedy, a fourth glue span at the section's top, is not taken: the glue settles a scroll that stops inside its span and does nothing to one that runs on.

## 6. Motion, the seams and the budget

Nothing new moves. The rows of section-5-liquid.md 5 stand, with one change: the raw scroll crossing the rest place (exitY) runs the exit only once the exit is armed (G4), and a scroll that reaches the rest place from above before a rest is held there until the page has rested; from then the next scroll down runs the exit (E-S5-hold). The hold moves nothing on screen: the page stops at the rest place. A scroll up from the rest runs the fourth wipe back onto scene 5, as before.

No budget line changes: the lines of section-5-liquid.md 7 stand, and `npm run build`'s budget step holds them. The stylesheet's growth counts against the first view's 4.0 KB gz (2.7 on the production build of the morning of 2026-11-02, with the liquid), and the guards against the jar chunk's 9.5 KB (9.0 that morning), section 4's script line (29.5 KB of Sam's pending 30.0 that morning; the build stops only past the spec's 38) and the total's 250 KB (247.9).

## 7. Acceptance criteria

Each is measured on the dev server (`?tier=hero3d&glue=0&room=open`, the hooks `__s4` and `__s5`, headless Chrome as `scripts/signup/frames.mjs` launches it) at the section's rest place (restY), with the form on (the dev and test builds render it) and off (the page as production renders it, with no `#suForm`). The expected values are the prototype's (section 8).

1. **The fit.** Every visible box of `.su-body`, from the headline's top to the credit's foot, lies between 0 and the viewport's height at 390 x 844, 360 x 780, 390 x 664, 375 x 667, 1280 x 800, 1536 x 730 and 1366 x 657 with the form on and off, and at 768 x 1024 and 1920 x 970 with the form on.
2. **Nothing under the logotype's band.** No line or control of the body overlaps the logotype or Back to top (`#toTop`) at any size of AC1.
3. **No horizontal scroll** at any size of AC1: the document's scroll width equals its client width.
4. **Every control 44 px tall**: the three follow words, the field, "Save my colours", the consent row and "Not you? Use another email."; the credit's two links keep their 44 px hit boxes.
5. **Every line 13 px or more**, and the email field 16 px, at every size of AC1.
6. **The jar in its slot.** `__s5.state().placed.box` lies inside `state().slot` with its height 0.9 of the slot's within 3 px at every size of AC1, and again after a window resize with no reload: 1280 x 800 to 1536 x 730 and to 1366 x 657, and 390 x 844 to 390 x 664 (G2).
7. **The slot unmoved.** The slot's rect stays within 0.5 px of where it was through a press on each follow word and through every form state (an email error, both errors, the send's error, "Sending...", the done line with a long address, "Not you?" pressed) at 390 x 844 and 1536 x 730, and the island's `state().slot` equals the slot's rect after each (G3).
8. **A fling stops at the sign-up.** A fling from scene 5 (a fast wheel burst, and a touch fling where the browser can synthesise one), carried through the fourth wipe with momentum to spare, leaves the page at restY within 1 px with no seam running (`__s4.state().seam` null), at 390 x 844 and 1280 x 800 (G4).
9. **A deliberate scroll after a rest runs the exit.** With the page rested at restY, one wheel step or one swipe down runs the exit seam (the cloud, the jump to scroll 0, the hero), as before.

## 8. The prototype's figures

Compose's prototype, on the 3D path: at every size the jar's box was 0.90 of its slot's height and inside it, nothing scrolled sideways, nothing overlapped the band and every control was 44 px. The build's figures replace this table after the measure (section 14).

| Viewport | Form | The last line's foot | Smallest line (px) | Slot at (x, y) | Fits |
|---|---|---|---|---|---|
| 390 x 844 | on | 808.1 | 14.55 | 152 x 190 at (222, 250.1) | yes |
| 390 x 844 | off | 715 | 14.55 | 152 x 190 at (222, 343.3) | yes |
| 360 x 780 | on | 755.5 | 13.33 | 122 x 152.5 at (222, 232) | yes, 17 px to spare |
| 360 x 780 | off | 665.2 | 13.33 | 122 x 152.5 at (222, 322.3) | yes |
| 390 x 664 | on | 769.4 | 14.55 | 152 x 190 at (222, 227.4) | no, 122.5 px over; G1 closes it |
| 390 x 664 | off | 617 | 14.55 | 152 x 190 at (222, 257.3) | yes |
| 375 x 667 | on | 752.7 | 13.94 | 137 x 171.3 at (222, 226.1) | no, 102.9 px over; G1 closes it |
| 375 x 667 | off | 610.5 | 13.94 | 137 x 171.3 at (222, 265.4) | yes |
| 768 x 1024 | on | 983.3 | 16.9 | 294.9 x 368.6 at (369.9, 242.7) | yes |
| 768 x 1024 | off | 896.6 | 16.9 | 294.9 x 368.6 at (369.9, 329.4) | yes |
| 1280 x 800 | on | 718.7 | 20.8 | 281.6 x 352 at (455.8, 296.1) | yes |
| 1280 x 800 | off | 700.1 | 20.8 | 281.6 x 352 at (455.8, 296.1) | yes |
| 1366 x 657 | on | 598 | 17.08 | 252.3 x 315.3 at (394, 235.7) | yes |
| 1366 x 657 | off | 598 | 17.08 | 252.3 x 315.3 at (394, 235.7) | yes |
| 1536 x 730 | on | 657.8 | 18.98 | 280.3 x 350.4 at (433, 258.4) | yes |
| 1536 x 730 | off | 657.8 | 18.98 | 280.3 x 350.4 at (433, 258.4) | yes |
| 1920 x 970 | on | 850 | 22 | 372.5 x 465.6 at (671.9, 330.5) | yes |
| 1920 x 970 | off | 850 | 22 | 372.5 x 465.6 at (671.9, 330.5) | yes |

At 1536 x 730 with three follows saved and the form on, the slot stood where it stands empty (no shift from the states), the jar at level 1. The slot did not move on a follow press, an email error, both errors, the send's error or the done line with a long address. For the two short phones with the form on, stack's prototype, in its own composition, ended its last line at 656 of 664 and 661 of 667 with 13 px lines and slots of 117 x 146 and 106 x 132: an indication of what G1 buys, not compose's figures.

## 9. Out of scope

Dropping or shortening any line (compose's only other way to fit the short phones). A fourth glue span at section 5's top (G4 instead). The poster tier's and the no-JavaScript fit, which share the layout and were not measured, and the poster tier's loop end (the fade to `--night` and the jump to the top as `.su-loopend` comes in) under a fling. New stills for the larger laptop slots (the 2x stills are 320 x 400 px, and on the poster tier a laptop's slot is up to 372.5 x 465.6 CSS px). Any change to the liquid, the copy, the form's behaviour or the seams beyond G4.

## 10. Decisions taken

The design's own trade-offs, kept; the alternative named where there is one.

1. **D1 The states inside the rows on a phone.** Each state sits under its word inside the word's 44 px row, so the pair reads as one row and the column stays 21 glyphs wide; a press on "Not yet" or "Collected" opens that follow, as the word does, and the keyboard's focus ring encloses the word and its state. Alternative: the state in a column of its own (stack's nine-glyph column), which narrows the jar.
2. **D2 The three messages share one line.** With both errors the email's shows first and the consent's once the email's clears; each is still announced through `aria-describedby`. Without `:has()` each message keeps a line of its own after the fine print. Alternative: three reserved lines, two lines of height a phone cannot spare.
3. **D3 The fields and the done line share one cell.** The body never changes height on a send, at the price of fog under the done block (about 117 px in the fields' 174 px cell on a phone). Alternative: the done line in place of the fields, which moves the foot and, through the centring, the slot.
4. **D4 The label above the field.** Sam's picture puts the field and the button side by side, not the label; keeping "Email" above costs one line on a phone and keeps the field 177 to 207 px wide there. Only on the short phone with the form does the label join the field's row (G1), as stack's does everywhere (the field 135 to 143 px wide there in stack's prototype).
5. **D5 Centred in the screen.** The content centres in the small viewport under the logotype's band, so without the form a tall phone shows fog above and below it (section 12, item 6). Alternative: the content from the top, the fog below.
6. **D6 Tablets weighted to the left.** From 720 to 1179 px the jar group sits left of centre with the form full width under it.
7. **D7 The laptop's sub-line within 64ch.** Two long lines (up to 730 px) in place of three. Alternative: the quiz's 60ch.
8. **D8 The save column at 1280 x 800.** It narrows to 466 px, so the consent and the fine print take two lines each; it is the tallest column there and still fits, with 81 px to spare.

## 11. Exceptions

Each with its default if Sam declines it.

- **E-S5-hold** (pending; new): the scroll held at section 5's rest until the page has rested there, so a fling cannot carry through the sign-up into the loop. It holds the scroll as E-S4-scroll does, against the references' fixed decision ("no wheel hijacking that blocks native scroll", `docs/references/README.md`) and the world spec's "Never a hold" (`docs/specs/section-4-world.md`, from D13 of `docs/specs/section-4.md`). Scope, as built (G4, section 5 here): at section 5's rest place only, for a scroll that reaches it from above before the page has rested there (300 ms with no input and no movement, no finger down), and only until it has; the hold an instant `scrollTo` each frame, no CSS property animated (CHECKLIST C3 holds as for E-S4-snap), its listeners passive; never with a field that takes typing focused, the on-screen keyboard up or the page zoomed; a scroll down after the rest runs the exit as before. *Default if declined:* the exit on any crossing as before, so a fling may pass the section.
- **E-S5-font** (pending): its scope gains the section's own sizes on a phone, the two headings at `--su-fs-h`, the credit and the message line at `--su-fs-s`, and the short phone with the form set by the height down to 13 px (the type, section 4 here); its default, the brand faces, is unchanged.
- **E-S5-contrast** (pending): the lines have moved and some sizes changed; `docs/specs/evidence/section-5-contrast.md` is the sand layout's measure of 2026-10-29 and is not re-measured this round.
- **E-S5-bg, E-S5-wipe and E-S5-liquid** (approved) and **E-S5-motion, E-S5-model and E-S5-tilt** (pending) stand as section-5.md 10 and section-5-liquid.md 11 have them.

## 12. For Sam

Each with the default taken until he answers.

1. **The jar on a phone.** To fit the form, the jar stands beside the three follow words and is smaller: its slot is 152 x 190 at 390 (the jar 171 px tall, against 246 before) and 122 x 152.5 at 360. Stack measured the plain stack, the jar above the follows, and it cannot fit even a 120 px jar on four of the five phone cases. On a laptop the jar is larger than before (284 to 419 px tall, against 270). Default: beside, smaller. Alternative: the jar above the follows, the section scrolling on a phone.
2. **The phone headings and the credit off the quiz's sizes.** On a phone the two headings are 22.5 to 24.5 px, a little under the quiz's 24.3 to 25, so "You’ve made it this far." holds one line; the credit and the message line are 13.3 to 14.6 px, so each holds one line. No other line shrinks. Default: as built, recorded with E-S5-font. Alternative: the quiz's sizes, the headline on two lines, which the short phones cannot afford.
3. **The short phones with the form.** At 390 x 664 and 375 x 667 with the form on, the type follows the height down to 13 px so everything fits (G1). Default: set by the height. Alternative: the quiz's sizes always, those two screens scrolling by about 123 and 103 px with the form on (compose's prototype); production today has no form and fits at the quiz's sizes.
4. **The hold (E-S5-hold).** A fast scroll from the scenes stops at the sign-up, and the next scroll down after a rest runs the loop to the hero. Default: the hold. Alternative: the exit on any crossing, as before, so a fast scroll can carry straight through the sign-up into the loop.
5. **The iPhone's bars.** The body is at least the dynamic viewport tall with the difference in its bottom padding, so Safari's bars never move the content and the loop starts from the section's top. It is untested on a real iPhone, since Chrome's emulation has no dynamic bars; with a plain 100svh the exit would fire about 80 px early with the bars collapsed. Default: as built, until a look on a real iPhone.
6. **The fog round the content without the form.** The content is centred in the screen, so production today, with no form, shows fog above and below it on a tall phone: at 390 x 844 the headline starts at y 172 and the credit ends at 715. Default: centred. Alternative: the content from the top under the logotype's band, the fog below it.
7. **The rest, by reference**: section-5-liquid.md 12 (the four shades, Instagram's order, the sheen and the highlight, the view from above, the pace, the stream's source, "verifies", and section-5.md 11 by reference). Its item 3, the liquid's strength, was answered on 2026-11-02: "yes keep it opaque".

## 13. Documents this amendment changes

- `docs/specs/section-5.md`: its pointer line near the top names this file.
- `docs/specs/section-5-liquid.md`: section 12, item 3 answered; section 14's entry of 2026-11-02 points here.
- `CLAUDE.md`: the section 5 paragraph's sentence for the one screen; E-S5-hold in the pending list, and E-S5-font's scope.
- `docs/CHECKLIST.md`: A3 (E-S5-font's sizes on a phone) and E3 (E-S5-hold pending; the contrast record's date).
- `DESIGN.md`: section 5's type, layout, follow word, form, credit and motion entries; a section 5 line under Responsive Behavior; the pending E-S5 ids.
- `docs/HANDOFF.md` (section 5's line), `docs/00-IDEATION.md` (the spine row) and `docs/02-THE-SITE-IN-WORDS.md` (section 5's words).
- The build's (section 14 records what each builder touched in the end): `src/components/signup/Signup.astro` (the wrappers, the move, the `sizes`, `data-leads`), `src/styles/signup.css` (the compositions and G1), `src/scripts/hero/stage/resize.ts` (G2), `src/scripts/hero/section5/jars.ts` (G3), `src/scripts/hero/section4/director.ts` and the new `src/scripts/hero/section4/exit-guard.ts` with `tests/unit/exit-guard.test.ts`, and the exit's lines in `tests/unit/room.test.ts` and `tests/e2e/room.spec.ts` (G4); as the designs name them, `tests/unit/signup.test.ts` (the CSS assertions that pin the old layout, and the markup's `sizes`), `tests/e2e/signup.spec.ts` (AC2's slot at 390 x 844, and its scroll of 120 px now upward); `scripts/signup/frames.mjs` (the `scroll` frame 120 px up; the `form` frame now the rest frame). The unit tests' placement and stream figures "at 390" are maths on the old 218 x 273 and 240 x 300 slots: they still pass and no longer describe the page.
- Not made this round, at Sam's word: the evidence record, the contrast's re-measure, Lighthouse, the record of the e2e suites, the review log.

## 14. Built

Built on 2026-11-02, the day of the brief, by two builders at the same time on the working tree that holds the liquid (uncommitted): the layout builder (the markup's wrappers, the move and the `sizes`; the stylesheet's three compositions; G1) and the guard builder (G2, G3 and G4). This round has no checklist review (Sam's words above). When this record was written, the code of all four grafts stood in the tree (sections 2 to 5 and 13 name it) and the measure had not run. A measuring agent checks the build by the numbers of section 7 before it goes to Sam on the dev server, and the measure fills this section: its figures replace the prototype's of section 8, any constant it changes replaces the one recorded in sections 2, 4 and 5, and it names what each builder touched in the end.
