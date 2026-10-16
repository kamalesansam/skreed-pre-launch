# Section 3: Find your shade (the quiz)

Slug `quiz`. Planned 2026-10-16 from Sam's brief of the same day, on the real build (Sam: "from now on, we will directly build on the real build itself"). Spine row 3 of `docs/00-IDEATION.md` ("Find your shade"); the quiz tab only, the photo and camera tabs are out of scope (section 8). Review log: `docs/specs/quiz.review.md`.

Sam's words (2026-10-16), verbatim:

> we have to move forward to the 3rd section which is a quiz section, we will have the same backround as the 2nd section, and we will have the transition, from section 2 to section 3 similar to section 1 to section 2, and after the transition, the next will section will scroll up, which has the basic idea like this :
>
> (After the shade section) SPOILT FOR CHOICE? LET'S FIND YOUR SIGNATURE SHADE. or, OVERWHELMED BY 240 SHADES? LET'S FIX THAT. (Subtext) Grab a coffee, sit back and get comfortable, answer a few questions, and we'll match you to your perfect Skreed shade. (Clear CTA: Swipe to Begin) (End the quiz with the result visible right then and there, then add the email signup as a little extra reward for completing the quiz.) [Result: their shade] Found the perfect shade? Make it yours! or, And here's a little something extra... Leave your email and we'll send you a surprise gift inspired by your shade right away, plus an exclusive discount code to shop your signature shade when we launch.

## 1. Goal

After the ten gems, the visitor answers six quick questions by swiping and gets one of the 240 shades as theirs, on the spot, with the way to see it on the case; then leaves an email for the gift. Brand goals: 1 (a brand people connect with) and 3 (lead capture); the concept catalog's highest-converting mechanic (#8).

## 2. Phone-first wireframe in words

### 390 x 844, 3D path

**The hand-off from section 2 (hero scroll 15.2 to 16.2 screens, the second wipe, `S2T.W2`).** The same igloo-style cut that brought section 2 in now cuts the gems away. Both sides of the cut show the same fog (the section 2 background: the drifting noise ramp, the jittered dots, the six wireframe sprites, scrolling with the page); the far side has no gems and no labels. So the cut reads as the gems and their names being wiped off the fog, and the fog stays. The track ends at 17.2 screens, so section 3 starts rising from the bottom edge the moment the cut has crossed the screen, over the fog, which keeps drifting behind it until section 3 has scrolled out.

**The intro (one screen, DOM, over the fog).** Bottom-left, inside the 16 px gutters, above the safe area:
- the headline in Poppins 700, sentence case, `--fs-h2`: "Spoilt for choice? Let's find your signature shade.";
- the sub-line in Source Serif 4 400, `--fs-standfirst`, measure 34rem: "Grab a coffee, sit back and get comfortable. Answer a few questions and we'll match you to your perfect Skreed shade.";
- the primary button (DESIGN.md: Ember Luxe, Urban Slate text, Open Sans 600 16 px, 48 px tall, square): "Swipe to begin".
The text is Pearl Whisper. The fog under the text block is darkened by the island (the same plate the gem labels use: luma 113 or less, feathered 10 px), so Pearl Whisper holds 4.5:1 wherever the text sits. A swipe up anywhere on the intro (60 px or more, touch), a tap or click on the button, Enter or Space on it: all begin.

**The deck (the same screen; nothing scrolls).** The intro text fades out (200 ms) and the deck rises 24 px into place (400 ms, `--ease-standard`). The deck is one Pearl Whisper card, square corners, no border, no shadow, 16 px from each side, between the top safe area plus 56 px and the bottom safe area plus 88 px (the stepper's row). On it:
- the question in Poppins 700, `--fs-quiz`, sentence case, centred: "Loud or quiet?";
- two options side by side, each a real button at least 44 px tall: a swatch circle 112 px across in the shade (`var(--shade-<id>)`), the side's word under it in Open Sans 600 16 px Urban Slate ("Loud"), and the shade's name under that in Open Sans 400 13 px ("Fuchsia");
- under the card, the stepper: six 10 px circles in a row, empty rings in Urban Slate at 35 percent, each filling with the shade the visitor chose on that card (the shades as swatches, the only place they enter the UI, rule 24 kept).
Drag the card left or right: it follows the finger, turns up to 8 degrees, and the option on that side lifts 4 px; past 35 percent of the card's width, or at a flick faster than 0.5 px per ms, letting go sends the card off that side in 300 ms (`--ease-in`) and the next card arrives from 0.96 scale in 300 ms (`--ease-standard`); short of that it springs back (300 ms, `--ease-rebound`). A tap on either option does the same as a swipe toward it. Vertical movement keeps scrolling the page (`touch-action: pan-y`). Six cards, then the result. No "next" button: the card itself is the question and the only way on.

**The result (replaces the deck, same screen).** The chosen shade as a 160 px circle, centred on the Pearl card; under it, an eyebrow "Your shade" (Open Sans 600, `--fs-eyebrow`), the shade's name in Poppins 700 `--fs-tile-name` ("Sunflower."), the family line in Open Sans 400 with tabular figures ("Mellow Yellow, shade 11 of 24"), the personality in Open Sans 600 ("The Spark. Main energy, no permission needed.") and its two sentences in Source Serif 4 400 `--fs-prose`. Then "Found the perfect shade? Make it yours!" in Poppins 700 `--fs-clause`, and two actions: the primary button "See it on the case" (a link to `/shades/mellow-yellow/?shade=107`, the family page with that shade in front) and the plain text button "Not quite? Try again" (Open Sans 600, Urban Slate, underlined on focus and hover), which clears the answers and shows card one. The card is taller than the screen on a phone, so it scrolls with the page.

**The gift (the next block, scrolls up under the result).** On the same Pearl ground: "And here's a little something extra." in Poppins 700 `--fs-clause`; the sentence in Source Serif 4: "Leave your email and we'll send you a surprise gift inspired by your shade right away, plus a code to shop your signature shade when we launch."; the form: label "Email" (Open Sans 600 14 px), one `type=email` input (Open Sans 16 px, 48 px tall, 1 px Urban Slate hairline, square), a required checkbox "I'm happy to hear from Skreed by email." (Open Sans 14 px), the primary button "Send my gift", and under it the small line "One email about your shade, one when we launch. Unsubscribe any time." (Open Sans 13 px). States in section 5.

**Scroll.** The intro is 100svh and pinned while the deck and result are on it (the section is `position: sticky; top: 0` inside its own wrapper whose height is the content's); the gift block follows. Below the gift there is nothing yet (section 4 comes later), so the page ends there.

### 390 x 844, poster path (no WebGL2, data saver, reduced motion, failed boot) and no JavaScript

The fog cannot be drawn, so section 3 stands on a still of it: one AVIF (WebP fallback) of the fog ground rendered from the built page, darkened once overall to luma 113 or less (so Pearl Whisper text passes anywhere on it, no plates), portrait and wide classes, lazy, at most 60 KB each, fixed under the section. The intro, deck, result and gift are the same DOM. Reduced motion: no card slide, no rotation, no lift; cards and the result cross-fade in 150 ms; the still never moves. No JavaScript: the intro shows, the button is replaced by a `<noscript>` line, "The quiz needs JavaScript. Browse the ten families instead.", with "ten families" a link to `/#families`.

### 1280 x 800

Same order, wider. The intro text sits at the left inset with the measure capped (headline 18ch, sub-line 34rem); the button under it. The deck is a 480 px wide card centred in the screen; options are 144 px swatches; the stepper under the card. Keyboard: with the card focused, Left and Right choose that side; each option is a real button, so Tab, Enter and Space work too; the mouse can drag the card exactly as a finger does. The result card is 640 px wide, the swatch to the left, the text to the right in two columns from 900 px up; the gift block is a 480 px form centred. Hover: the primary buttons lift 1 px, the options lift 4 px, the text button underlines; nothing else moves (rule 48).

## 3. Content

Every visible string. Sentence case throughout (rule 4); Sam's capitals are his emphasis, not the setting. No em dashes.

| Id | String | Where |
|---|---|---|
| `q.h` | Spoilt for choice? Let's find your signature shade. | intro h2 (Sam's first option; his alternative "Overwhelmed by 240 shades? Let's fix that." is kept in `copy.ts` as `q.hAlt`, unused) |
| `q.sub` | Grab a coffee, sit back and get comfortable. Answer a few questions and we'll match you to your perfect Skreed shade. | intro sub-line (Sam's words, split into two sentences) |
| `q.begin` | Swipe to begin | intro button |
| `q.noscript` | The quiz needs JavaScript. Browse the ten families instead. | no-JS line; "ten families" links to `/#families` |
| `q.aria` | Find your shade | the section's landmark label |
| `q.cardAria` | Question {n} of 6 | each card's accessible name (digits in an aria label only, never in a heading) |
| `q.eyebrow` | Your shade | result eyebrow |
| `q.fam` | {Family}, shade {n} of 24 | result family line, tabular numerals |
| `q.own` | Found the perfect shade? Make it yours! | result clause |
| `q.see` | See it on the case | result primary link |
| `q.retry` | Not quite? Try again | result text button |
| `q.gift` | And here's a little something extra. | gift clause (Sam's second option; "Found the perfect shade? Make it yours!" is used above it, so both of his lines appear, each once) |
| `q.giftSub` | Leave your email and we'll send you a surprise gift inspired by your shade right away, plus a code to shop your signature shade when we launch. | gift sentence (Sam's words; "an exclusive discount code" is "a code": CLAUDE.md "Never discount language"; see section 9, D3) |
| `q.email` | Email | input label |
| `q.consent` | I'm happy to hear from Skreed by email. | checkbox label |
| `q.send` | Send my gift | form button |
| `q.sending` | Sending... | form button while the request runs |
| `q.fine` | One email about your shade, one when we launch. Unsubscribe any time. | under the form |
| `q.errEmail` | That doesn't look like an email address. | validation, under the field |
| `q.errConsent` | Tick the box so we can email you. | validation, under the checkbox |
| `q.errSend` | That didn't go through. Try again. | request failed (5xx, network) |
| `q.dup` | You're already on the list. Check your inbox. | 409 from the endpoint |
| `q.offline` | You're offline. We'll send it when you're back. | queued while offline |
| `q.done` | Done. Your gift is on its way to {email}. | success |

**The six cards.** Each has a question, two sides, and one shade per side as its swatch (shades by id, names as `shades-240.json` prints them). The side's word is the visible label; the swatch is the product.

| # | Question | Left (bit 1) | Right (bit 0) |
|---|---|---|---|
| 1 | Loud or quiet? | Loud: Fuchsia `playful-pink-24` | Quiet: Dove `stormy-grey-07` |
| 2 | Warm or cool? | Warm: Clementine `blushing-coral-09` | Cool: Sky `blissful-blue-08` |
| 3 | Morning or midnight? | Morning: Golden `mellow-yellow-18` | Midnight: Midnight `blissful-blue-24` |
| 4 | Plan it or wing it? | Plan it: Graphite `stormy-grey-23` | Wing it: Bubblegum `playful-pink-09` |
| 5 | Classic or new? | Classic: Cinnamon `basic-brown-07` | New: Amethyst `vivid-violet-07` |
| 6 | Spotlight or backstage? | Spotlight: Classic `roaring-red-06` | Backstage: Sage `go-green-09` |

Every swatch measures at least 1.5:1 against Pearl Whisper (the near-white shades were not used), so each reads on the card without a border (rule 5).

**The ten results.** The ten personalities of Sam's Shade Diagnosis quiz (`Skreed Shade Diagnosis Quiz.pdf`, as transcribed in his quiz project's `src/data/quiz.ts`), one per family, each with the shade the PDF names, found in the 240 by hex. The signature is the personality's answer to the six questions (section 5 says how it scores).

| Family | Personality | Tagline | Shade (id, n of 240) | Finish | Signature |
|---|---|---|---|---|---|
| Mellow Yellow | The Spark | Main energy, no permission needed. | Sunflower `mellow-yellow-11`, 107 | Gloss | 1 1 1 0 0 1 |
| Roaring Red | The Main Character | Attention just tends to arrive. | Classic `roaring-red-06`, 222 | Gloss | 1 1 0 0 1 1 |
| Blushing Coral | The Warm Optimist | Golden hour, all year round. | Clementine `blushing-coral-09`, 153 | Gloss | 0 1 1 0 1 1 |
| Frosty White | The Quiet Curator | Nothing stays unless it earns its place. | Porcelain `frosty-white-10`, 10 | Matte | 0 0 1 1 1 0 |
| Basic Brown | The Grounded Wanderer | Experience over show. | Cinnamon `basic-brown-07`, 127 | Matte | 0 1 1 1 0 0 |
| Playful Pink | The Romantic Rebel | Feeling first, no regrets. | Bubblegum `playful-pink-09`, 57 | Gloss | 1 1 0 0 0 0 |
| Vivid Violet | The Dreamer | Half here, half somewhere more interesting. | Amethyst `vivid-violet-07`, 79 | Matte | 0 0 0 0 0 0 |
| Blissful Blue | The Calm Strategist | Three steps ahead, quietly. | Navy `blissful-blue-22`, 46 | Matte | 0 0 0 1 0 1 |
| Go Green | The Quiet Architect | Timeless over trendy. | Sage `go-green-09`, 201 | Matte | 0 1 0 1 1 0 |
| Stormy Grey | The Understated Icon | Memorable without the noise. | Graphite `stormy-grey-23`, 191 | Matte | 0 0 0 0 1 1 |

The two sentences under each personality are the PDF's "personality" paragraph, verbatim (for example The Spark: "You're the reason the group chat is active at 11pm. Rooms feel different when you walk in. Brighter, faster, more fun. You don't wait for permission to be the main energy."); the full ten live in `src/config/quiz.ts`. They contain no em dash, no emoji and none of rule 17's words. The finish is shown as one Open Sans line under the family line: "Best in gloss." or "Best in matte." The PDF's "Classic Red" and "Navy Blue" are the catalog's Classic (`roaring-red-06`) and Navy (`blissful-blue-22`), the same hexes.

**Renders and images.** No case render in this section (the real product is the shades, as swatches: A5). The family page link shows the case in the shade. The poster-tier still: `src/assets/quiz/ground-portrait.avif` (and `.webp`, 1080 x 1920 or smaller) and `ground-wide.avif` (`.webp`, 1920 x 1200 or smaller), rendered from the built page's fog ground at the end of the second wipe with the overall darkening, each at most 60 KB.

## 4. Motion plan

**Libraries.** None new. The hand-off is the hero island's existing second wipe (`post/composite.ts`, `uProgress` from `tp2`), with its far side changed from the swatch wall to the fog ground. The DOM motion is CSS transitions and the Web Animations API on transform and opacity only, driven by Pointer Events (one handler for touch, mouse and pen). No GSAP: the deck needs about 2 KB of logic and GSAP with ScrollTrigger would add 42.9 KB gz to the page (decision D5); reduced motion comes from `src/scripts/motion.ts` and CSS, as the hero does.

| Trigger | What moves | Timing |
|---|---|---|
| Scroll 15.2 to 16.2 screens (`S2T.W2`, `WIPE`) | the second wipe: section 2 (gems, labels, fog) to the fog ground | the existing wipe, unchanged |
| Scroll 16.2 to 17.2 | section 3's intro rises from the bottom edge over the fog; the fog keeps drifting (`uTime`) and scrolling (`uScroll` continues the section 2 formula) | native scroll; the island renders the ground alone while any of `#main` is in view |
| Swipe up on the intro (60 px, touch), tap or click "Swipe to begin", Enter or Space | intro text out, deck in | 200 ms fade out; 400 ms rise from 24 px, `--ease-standard` |
| Drag a card | the card follows the pointer (translateX, rotate up to 8 degrees at 35 percent of its width), the option on that side lifts 4 px | per frame |
| Release past 35 percent, or a flick over 0.5 px/ms | the card flies off that side; the next card scales 0.96 to 1; the stepper dot fills | 300 ms `--ease-in`; 300 ms `--ease-standard`; 150 ms |
| Release short of that | the card springs back | 300 ms `--ease-rebound` |
| Tap or click an option; Left or Right arrow on the focused card | the same as a swipe toward it | as above |
| Sixth answer | the deck out, the result card in | 300 ms out, 400 ms in (scale 0.96 to 1, opacity) |
| "Not quite? Try again" | the result out, card one in; the stepper empties | 300 ms, 400 ms |
| Hover and press on the buttons | DESIGN.md's button states: lift 1 px, press 0.98 | 150 ms `--ease-standard` |

**Reduced motion.** The island is not loaded (the poster tier), so the still stands in for the fog and the wipe does not happen (the page is one screen of hero, then the family links, then section 3). The deck and result cross-fade in 150 ms; no drag follow (the card stays put while the pointer moves; release past the threshold still commits), no rotation, no lift, no rise. The stepper still fills.

**WCAG 2.2.2.** Nothing in this section moves on its own. The fog behind it is the hero's (pending E-2.2.2).

## 5. Data and states

**Inputs.** Pointer events on the card and the intro; keyboard; the form fields; `navigator.onLine` and the `online` event; `prefers-reduced-motion` through `motion.ts`.

**Outputs.**
- The result: a family id and a shade id, kept in memory only (no storage, B3). The family page link carries `?shade=NNN` (the family-page contract, `family-page.md` 2.2).
- `POST /api/quiz-lead` with JSON `{ email, shadeId, familyId, finish, answers: "110010", source: "quiz" }`. Responses: 200 `{ ok: true }`; 409 duplicate; 422 invalid; anything else is an error. The Worker and its Supabase table arrive with section 4's lead infrastructure (decision D7); until then every submit reaches the error state on a built site, and the dev server has no endpoint either.
- Analytics events through one `track(name, props)` function in `src/scripts/quiz/track.ts` that queues until an analytics client exists (PostHog arrives with G18): `quiz_start`, `quiz_answer { q, side }`, `quiz_complete { family, shade }`, `quiz_retake`, `lead_submit`, `lead_success`, `lead_error { kind }`.

**Scoring (deterministic, pure, unit tested).** The six answers make a 6-bit word (left = 1). Each personality has the 6-bit signature of section 3. The winner is the personality whose signature is nearest by Hamming distance. On a tie, the earliest question on which the tied personalities differ decides, in the visitor's favour (the one that matches the answer there wins); the signatures were chosen with pairwise distance at least 2, so every one of the 64 paths resolves to exactly one family and every family is reachable (paths per family: Mellow Yellow 10, Frosty White 10, Playful Pink 7, Roaring Red 6, Blushing Coral 6, Basic Brown 6, Blissful Blue 6, Vivid Violet 5, Go Green 5, Stormy Grey 3). The shade is the personality's shade. "No results" cannot happen (H table).

**The hero island (3D path).** `world/wall.ts` (the swatch-wall placeholder) is replaced by `section3/ground.ts`: the section 2 background material rendered on its own (final grade, no stones, no labels, the same `uTime` and `uScroll` as section 2's), into its own target; it is `tB` of the second wipe and the whole frame after it. The stage observer watches `#track` and `#main` together: while either is in view the loop runs; past the track it renders the ground and the composite only (two full-screen passes). Section 3's intro reports the rects of its three text elements to the island (a `skreed:plates` event, re-sent on resize and on scroll while the intro is on screen), which feeds them to the ground's `uLab` plates so the fog under the text is darkened to luma 113 or less. The poster tier and reduced motion never load the island; the still carries the darkening.

**States (CHECKLIST D3 and the H table, column 3).**

| State | Section 3 |
|---|---|
| Empty | A card with nothing picked is the resting state of the deck: the question is the prompt and there is no next button to disable. "Pick one to continue" is therefore not shown; nothing can be submitted without an answer. |
| Loading | The intro is static HTML, visible at first paint. The quiz chunk loads when the section is within one screen of the viewport; if "Swipe to begin" is pressed before it has arrived, the button reads "Loading..." and is disabled until it has (a skeleton would be the wrong shape: the button is the thing waiting). The gift form: the button reads "Sending..." and is disabled while the request runs; the fields keep their values. |
| Error | The request fails (5xx, a network error, a timeout at 8 s): "That didn't go through. Try again." under the button; the fields keep their values; the button is enabled again. 422: the field's validation message. |
| No internet | The quiz works entirely offline (static logic). Submitting offline queues the lead in memory and in `sessionStorage` (an enhancement, not a dependency: without it the queue lives for the page's life), shows "You're offline. We'll send it when you're back.", and retries once on `online`; success then shows as usual. |
| Slow network | Same as loading; the request never times out silently: at 8 s the button reads "Still trying..." and at 20 s the error state. |
| No results | Cannot happen: every path resolves (the unit test over all 64 paths). |
| Permission denied | n/a: nothing asks for a permission. |
| Session expired | n/a: no session; a reload starts the quiz again. |
| Form validation | On blur and on submit, never per keystroke (H4): the email must match a simple address shape; the checkbox must be ticked. Messages under the field in plain words; the field keeps its value; `aria-invalid` and `aria-describedby` set. |
| Success | The result card, with "See it on the case" and "Not quite? Try again". The gift: "Done. Your gift is on its way to {email}." replaces the form (not a 2 s state: it is the end of the form), with the email shown so a typo is visible, and "Not you? Use another email." as a text button that brings the form back with the field cleared. 409: "You're already on the list. Check your inbox." in the same place. |

## 6. Budget

| Item | Budget | Expected |
|---|---|---|
| Critical JS added to `/` | 0.5 KB gz (the chunk loader) | about 0.3 KB gz |
| Section 3 chunk (deck, scoring, form, track), lazy, gz | at most 7 KB | about 5 KB |
| Added to the island chunk (`section3/ground.ts`, the observer change, the plates bridge), gz | at most 1.5 KB; the removed `wall.ts` gives back about 0.6 KB | about 1 KB |
| CSS added to the page, gz | at most 3 KB | about 2 KB |
| Images | the poster-tier still, portrait and wide, AVIF with WebP fallback, each at most 60 KB, lazy, requested only on the poster tier (one class per view) | about 40 KB each |
| Fonts | none new: Poppins, Source Serif 4 and Open Sans already ship on `/` (the first visible Poppins and Source Serif 4 on `/` are in this section, so their files load once the section is near, not before) | 0 |
| Frame cost after the track, 3D path | at most 0.5 times the hero's rest frame (two full-screen passes) | measured under SwiftShader before the review |
| Total page JS after this section | under the 250 KB gz budget (182.8 KB today) | about 190 KB gz |

## 7. Acceptance criteria

Each is PASS or FAIL with evidence. Frames at 390 x 844 and 1280 x 800: the intro, card one, card four mid-drag, the result, the gift form, and the gift form's error and success states.

1. **Copy and type (A1, A3, A4).** Every visible string equals section 3's table, in sentence case; headings carry no digits; no em dash or emoji anywhere in the section; only Poppins 700, Source Serif 4 400 and Open Sans 400 to 600 are used, at the named sizes, nothing under 12 px.
2. **The hand-off (F1, the hero suites).** The frame at 16.2 screens (end of the second wipe) at both sizes shows the fog without gems or labels; the frame at 15.0 screens is unchanged (the existing `v11-frames` parity test passes); `S2T.W2` is still 15.2; the unit, e2e and parity suites pass; the track is 1720svh (`TRACK_SVH`, the shell CSS and the unit test agree).
3. **Rises after the cut (F1).** At 16.2 screens the top of `#main` is at the viewport's bottom edge; at 17.2 the intro fills the screen; the fog keeps drifting behind it (two frames 2 s apart differ), and the loop stops once `#main` has scrolled out.
4. **Phone layout (B2, G10).** At 360, 390, 430, 768, 1024 and 1280 wide: no horizontal scroll; gutters at least 16 px; the button, both options, the text button, the input, the checkbox and the form button at least 44 px tall; the card, the stepper and the text never overlap each other or the chrome.
5. **The deck (D1, D4, F1).** A drag past 35 percent commits and a shorter one springs back; a flick commits; a tap on an option commits; Left and Right commit on the focused card; the stepper fills with the chosen shades; after six answers the result shows; "Not quite? Try again" returns to card one with the stepper empty. Hover and press states exist only on the buttons and options.
6. **Scoring (H "No results", F1).** A unit test proves the ten signatures are pairwise at Hamming distance 2 or more, that all 64 paths resolve, that every family is reachable, and that the tie rule is deterministic; the result card's shade id, family and personality match `src/config/quiz.ts` for three sampled paths driven through the UI.
7. **Contrast (E3, rule 7).** Sampled from the frames: the intro's Pearl Whisper text over the fog measures at least 4.5:1 at every text pixel's background (3D path, plates on; poster path, the darkened still); the card's Urban Slate text on Pearl Whisper is 9.9:1; the button text on Ember Luxe is the literal Urban Slate hex (5.0:1); focus rings are the two-tone ring.
8. **States (D3, H2, H3, H4).** Each row of section 5 is shown or argued: validation on blur and submit with the value kept; the error state after a failed request with the value kept and a retry; the offline queue and its retry on `online` (Playwright `setOffline`); the success and duplicate states; "Loading..." when the chunk is held back.
9. **Tiers (D2, C3).** With reduced motion: no transform animation runs (computed transitions are none), the still is shown, the quiz works end to end. On the poster tier the island requests nothing and the still is the only new request (one class). No new WebGL context is created (one `canvas#stage`); section 3's own animations use transform and opacity only.
10. **Budget and hygiene (C1, F2, G21).** `node scripts/hero/budget.mjs dist` shows the critical JS unchanged within 0.5 KB gz and the section chunk at most 7 KB gz; no TODO, placeholder or commented-out code; the result links to the family page and the no-JS line links to `/#families`.

## 8. Out of scope

- The "From a photo" and camera tabs of spine row 3 (a later pass, if at all).
- The Worker endpoint, the Supabase table, Turnstile and the email that sends the gift (section 4's infrastructure; this section ships the form against the contract above).
- Analytics wiring (the events are emitted to the queueing stub; PostHog with G18).
- A share card for the result (section 5).
- The Wall and Reserve (sections after this one; the page ends after the gift for now).
- Changing the second wipe's look, the gems or anything before 15.2 screens.
- The 3D case on the result (the family page shows it; one WebGL island, E-C3).

## 9. Decisions taken

| # | Decision | Reason |
|---|---|---|
| D1 | Six binary swipe cards, not the twelve ten-option questions of Sam's Shade Diagnosis quiz. The ten personalities, shades, finishes and paragraphs of that quiz are the results. | Sam's brief says "Swipe to begin" and "a few questions"; the site-in-words already specifies six swipe cards that map deterministically to a family; one tap per card is the cheapest thing on a phone (a ten-option list is a screen of scrolling per question). Sam's own quiz content gives each family a real name and voice, so nothing is invented. Sam decides (section 10, 1). |
| D2 | The quiz decides the family; the shade is the personality's shade from the PDF. | The PDF pairs each personality with one shade; a second round of questions per family would double the quiz. |
| D3 | "an exclusive discount code" is written "a code". | CLAUDE.md, brand facts: "Never discount language." Sam decides (section 10, 2). |
| D4 | Sam's two headline options: the first is used; the second is kept in `copy.ts`. Both of his closing lines are used, each once ("Found the perfect shade? Make it yours!" on the result, "And here's a little something extra." on the gift). | They read as two spots, not two alternatives. |
| D5 | No GSAP in this section. | 42.9 KB gz for a 2 KB deck; the hero already set the pattern (E-GSAP). Later sections bring GSAP when ScrollTrigger earns it. |
| D6 | The deck and result sit on a Pearl Whisper card; the intro text sits on the fog under a darkened plate. | AA without inventing a tint: Urban Slate on Pearl is 9.9:1; the plate is the mechanism the gem labels already use; a card is the natural shape of a swipe quiz. Square corners (rule 39), no border, no shadow. |
| D7 | The form ships against the `/api/quiz-lead` contract; the endpoint is section 4's. | The lead infrastructure (Worker, Supabase, Turnstile, email) is one piece of work for both forms; shipping the UI now means Sam can review the whole section. The reviewer sees the error state on a build without the Worker. |
| D8 | The track shortens from 1820svh to 1720svh. | Sam: "after the transition, the next section will scroll up". Section 3's top reaches the bottom edge exactly as the cut completes (16.2 screens); the two screens of drifting swatch wall go. The section 2 timings and the wipes do not move. |
| D9 | The poster tier gets a still of the fog, darkened once overall. | The same background without WebGL; a CSS gradient would be a new gradient (rules 1, 21) and would not match. The darkening makes any text placement pass AA without per-viewport plates. |
| D10 | The result's primary action is the family page with the shade in front. | It is the only place the case renders in that shade; Reserve does not exist yet. With `PUBLIC_FAMILY_PAGES` off the link would 404, so production needs the family pages on (the round 3 report, decision 6). |
| D11 | No storage of answers or results. | B3: nothing relies on storage; `sessionStorage` is used only to carry a queued lead across a reload, with an in-memory fallback. |

## 10. For Sam

1. The quiz format: six swipe cards (D1), or the twelve questions with ten options each from the Shade Diagnosis PDF? The results are the PDF's ten personalities either way.
2. "a code" in place of "an exclusive discount code" (D3), or his wording against the brand rule?
3. The still of the fog on the poster tier and the fog behind section 3 on the 3D path extend the hero's E-S2-bg to section 3 (recorded here as E-S3-bg, pending his yes), and the plates darken the fog under the intro text (E-S3-plate).
4. The gift email: who sends it and what it is (Resend is the stack's email; nothing sends until the Worker exists).
5. `PUBLIC_FAMILY_PAGES` on in production, so the result's link works (round 3 report, decision 6).
6. The ten signatures (section 3) are a first cut; if any personality should answer a question the other way, it is one line in `src/config/quiz.ts`, re-checked by the unit test.
