# One gesture, one step: the wrap's removal, the family pages' case types and the landing's keys

Sam, 2026-11-04, on the scroll in the products section as described to him:

> "dont do that, i cant go to the bottom of the site from the top section, remove that trick"

of the wrap from the top, and:

> "One gesture moves you one whole scene. That gesture can be a mouse-wheel flick, a one-finger swipe, or a key (Down arrow, Page Down or Space go forward; Up arrow, Page Up or Shift+Space go back). While a change is playing, plus a short pause after it, any more scrolling is ignored. You can't skip two scenes at once by scrolling hard. A long trackpad swipe still counts as one step, not several. now apply this exact same concept on the family pages for the case types, same for the phone swipe as well"

> "and on the main page, all the sections will follow this same rule only for one gesture : One gesture moves you one whole scene. That only gesture is a key (Down arrow, Page Down or Space go forward; Up arrow, Page Up or Shift+Space go back)., the swipe or scroll with the mouse or trackpad or touch screen stays the same"

## 1. Goal

Three changes, each its own commit so one `git revert` takes any of them back alone:

1. No wrap from the top of the landing page onto section 5.
2. On a family page, section 4's rule for the four case types: one gesture, one type, the phone's swipe included.
3. On the landing page, the step keys move one section at a time; the wheel, the trackpad and the touch screen stay the page's own.

## 2. No wrap from the top

At scroll 0 a wheel burst up, a swipe down the glass and ArrowUp are the page's own: nothing happens (the browser's rubber band where it has one). The reverse seam that covered the hero in fluxtheory's cloud, set the page at section 5's rest with the scenes at scene 5 under it and announced "Round to the sign-up." is gone, with everything only it used:

- `section4/scroll.ts` and `scroll-math.ts`: the wrap's wheel and touch verdicts, the capture set at scroll 0, the adapter's `wrap`, `canWrap` and `lock`, and `TOUCH.wrapPx`.
- `section4/director.ts`: `wrap()`, the landing, the seam's phases, the cloud's warm-up (`warmCloud`) and the `seam` state; `RoomState` is `approach` or `world`; the plan's cover is always 0 and its cloud null.
- `room/walk.ts` and `signup/signup.ts`: the wrap's event, its two live lines (`wrapLive` in both configs) and `room_wrap`.
- `hero.ts`: the adapter's wrap, `__s4.wrap`, the director's `snapHero`; the director chunk still comes at idle after the intro (no cloud with it).

Left in place, unused: the carousel's cloud pass (`carousel.ts`), the composite's cloud blend (`COMPOSITE_FRAG_V11_COVER`, `loop.ts`) and `RoomFrame.cover` and `under`. A later clean-up can take them out; nothing draws them now.

## 3. The family pages: one gesture, one case type

`src/scripts/family/steps.ts`, on the 3D tier only (`html.m3d`, read at each decision, so a page that loads in swatch grid mode steps once "Show in 3D" brings the 3D; never in swatch grid mode), with section 4's own gesture module (`section4/scroll.ts`, its burst filter, touch rule and key table) driven through its adapter with `twoWay` on.

- The rests: Tough, MagTough, Snap and Armor at screens 2, 3, 4 and 5 (`pose.ts` `CASE_REST`), where each type faces the camera with its sweep done.
- Between them one wheel burst (a trackpad's whole swipe with its momentum), one one-finger swipe (decided on the first 12 px) or one step key rides the page a whole screen to the next type: a 0.5 s lead to the hand-over (`CASE_LEAD_MS`), where the page rests a moment with the case facing the camera, then the wave, the takeover's sweep over the last fifth of the screen, over 1.5 s (`CASE_SWEEP_MS`), each on `--ease-turn` (the stage lags the scroll as before). Section 3a has the day's changes to the step.
- During the ride and 150 ms after it (`CASE_STEP_COOLDOWN_MS`) every wheel, swipe and step key is swallowed, a held key's repeat too.
- At Tough a gesture back, and at Armor a gesture on, is the page's own: up into the zoom, on to the argument screen.
- The arrival: a page that its own scroll carries into the types (a fling from the zoom, a key's smooth scroll, the argument screen scrolled up) is put back on the type it entered at (Tough from below, Armor from above) and held there against the momentum until it has been still for 150 ms, at most 1.2 s, as section 4's arrival hold does for scene 1; a finger still down defers the hold to its release. Only a scroll the visitor began is held: a wheel or a scrolling key in the last 300 ms, or a finger down or lifted in the last 3 s (a phone's momentum runs on after the release); a link, the beat nav, Home, End and the scrollbar pass. A step key during a hold lets it go and steps at once.
- A wheel event the browser will not let the page cancel (a trackpad gesture latched before the capture attached) holds the page on the rest it stands at or last passed, both ways.
- The beat nav's four buttons ride to their type (more than one screen at 1.4 s a screen, at most 2.8 s, `CASE_STEP_MS`); in swatch grid mode they scroll the beat in as before.
- Under reduced motion a step is an instant cut.
- Never captured: Ctrl+wheel, two fingers, a zoomed viewport, a key in a typing control, on a button or one a control already took (the scrubber, the swatch grid).

## 3a. The step, the case's height and the Armor, revised the same day (2026-11-04)

After the first deploy Sam watched the steps on localhost:

- "the transition effect we have on the case types, it's running too fast, reduce the speed of the transition": a 2.4 s step, slowing the turn and the wave alike; then "no the rotation speed will stay the same, only the wave effect will slow down"; then "just remove the rotation animation for case types, just keep the wave". So no case turns any more (`pose.ts` `beatPose`'s yaw is 0 throughout; section 24 D15's whole turn and round 3's turn into Tough end here), the hand-overs keep their places (2.8, 3.8, 4.8), and a step is the lead and the wave above (`steps.ts` `stepPath`). With no turn the case's inside never shows, so the Tough's back-only LOD1 on a low tier (the break he saw mid-turn in the browser pane, which measured itself low while hidden) no longer shows anything broken.
- "after going to each case type, the model is moving upwards to the top of the screen, make sure it stays in the center": every type rests at beat 1's height (`pose.ts` `CY`, -0.96 for beats 1 to 4; ciao's rise to -0.58, 0.02 and 0.6 until then), so the case holds one place through the four types; the profile light no longer lifts with it.
- "the armour case is supposed to look like how it is in the attached image": his render shows the Armor's camera plate charcoal; on the site the plate, the model's trim, read light silver, the trim's dark grey lifted by the profile light square on the broad flat plate. The Armor's trim alone now takes 0.15 of the accent's colour and the matte's specular (`stage.ts` `TRIM_OF`); the Tough's ring and the MagTough's liner keep theirs. The Armor model's own parts are as Sam's file gave them (its shell a flat back of 170 triangles, the rest trim).

## 4. The landing page: one key, one section

`section4/scroll.ts` (the page scroll, from the intro's end, the 3D path only) takes the step keys everywhere on the page, not only in the scenes:

- ArrowDown, PageDown and Space ride the page to the next rest, ArrowUp, PageUp and Shift+Space to the one before. The rests (`hero.ts` `stops`): the hero at the top; the gems at rest with their labels (`S2T.LAND`, the first glue span's end); the quiz (the second span's end); scene 1 (the room's q 1); scene 5 (q 3); and section 5 (the fourth span's end). A rest whose section has no box reads NaN and is skipped (the quiz gate's lock until it left the same day).
- In the scenes the keys stay the carousel's (one scene a keydown); at scene 1 back they ride to the quiz, at scene 5 on to section 5.
- The ride runs on `--ease-standard` over a length that grows with the distance, 450 ms a screen between 0.7 and 2.4 s (`KEY_RIDE`): the hero to the gems, 4.8 screens, takes 2.2 s, so the pull-back, the wipe and the cascade play at a pace a visitor can follow.
- During the ride and 150 ms after it the step keys are swallowed; a wheel, a touch, a press or another scrolling key ends the ride where it is; a modifier's press (the Shift of Shift+Space) or any key that does not scroll lets it run on.
- With no rest that way (the top, the page's end) the key is the browser's. Home, End and Tab stay the browser's.
- Never: a key in a typing control or on a button, one a control already took (the quiz's answers take the arrows), with a modifier, while zoomed, or while the section index's drawer (a popover) or a dialog is open.
- The wheel, the trackpad and the touch screen are unchanged: native scroll with the glue at the seams.

## 5. Numbers

| Name | Value | Where |
|---|---|---|
| KEY_RIDE.msPerScreen, minMs, maxMs | 450, 700, 2400 ms | section4/scroll-math.ts |
| KEY_RIDE.cooldownMs | 150 ms | section4/scroll-math.ts |
| CASE_LEAD_MS, CASE_SWEEP_MS | 500, 1500 ms | family/timing.ts |
| CASE_STEP_MS, CASE_STEP_MAX_MS (the beat nav's longer rides) | 1400, 2800 ms | family/timing.ts |
| CASE_STEP_COOLDOWN_MS | 150 ms | family/timing.ts |
| CASE_HOLD_STILL_MS, CASE_HOLD_MAX_MS | 150, 1200 ms | family/timing.ts |
| TOUCH.stepPx | 12 px | section4/scroll-math.ts (section 4's) |

## 6. Exceptions

His words above cover these, so they are recorded as approved with them:

- **E-F7 (the family pages' steps):** between Tough and Armor the wheel, one finger and the step keys are captured for whole steps, and a page carried into the types is held on Tough or Armor; against the references' fixed decision against wheel hijacking on phones, rule 12's reserved-motion list (the ride is the page's own motion) and CHECKLIST C3's transform/opacity only (an instant scrollTo a frame, as E-QG-ride and E-S4-snap). Default if withdrawn: the page's native scroll over the types as before.
- **E-keys (the landing's keys):** the step keys ride the page between its rests, outside the scenes too; against rule 12's reserved-motion list and the references' line on a soft scroll takeover, as E-QG-ride. Default if withdrawn: the keys native outside the scenes, as before.

The wrap's removal takes motion away and needs no exception; E-S4-scroll's "at scroll 0 after the intro a touch or a wheel burst runs the wrap onto the fifth scene" no longer holds.

## 7. Decisions taken (defaults, for Sam to change)

- D1. The landing's rests are one a section: the hero, the gems, the quiz, scene 1, scene 5, section 5. The pull-back's end (where the first glue span starts) is not a rest: ArrowDown on the hero rides straight to the gems.
- D2. The landing's ride is 450 ms a screen (0.7 to 2.4 s) on --ease-standard; the family's step a 0.5 s lead and a 1.5 s wave on --ease-turn (section 3a), slower than a scene's 0.77 s because each carries a whole turn of the case and its sweep.
- D3. The family pages' carousel and zoom (screens 0 to 2) and the argument screen keep the native scroll; only the four types step, as asked.
- D4. On the poster tier and under reduced motion on the landing (no island, no page scroll module) the keys stay the browser's.

## 8. For Sam

1. Is a key from the hero meant to go straight to the gems (D1), or stop first where the pull-back ends?
2. The ride lengths (D2): does the hero-to-gems ride (2.2 s at a laptop's height) and the family's 0.5 s lead and 1.5 s wave feel right?
3. Should the carousel and the zoom on a family page step too (D3)?
4. The cloud's code left unused (section 2): take it out in a clean-up?
