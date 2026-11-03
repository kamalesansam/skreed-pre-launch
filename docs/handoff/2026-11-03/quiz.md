# Hand-off 2026-11-03: the quiz's paint, reveal and scroll-out

- **Session:** the quiz session (`local_35d56cc3-49dc-4c0a-9ed0-eb5f73da410a`), worktree `.claude/worktrees/quiz-result`.
- **Branch:** `claude/quiz-paint-relief`, cut from the default on 2026-11-03 after the quiz result redesign landed (3959d89). It contains the default up to 693c0eb (the family pages' round 6).
- **Spec:** `docs/specs/quiz.md` D50 to D53, AC15, section 10 items 21 and 22. `CLAUDE.md` (the Section 3 bullet, E-S3-result, E-S3-motion) and `DESIGN.md` (Quiz reveal; Result: Ground and tones, Paint) follow.

## What Sam asked (verbatim, 2026-11-03, after testing the live site)

1. Of the result's paint, with the live site's red SVG stroke beside his reference's white swatch: "i just tested it, this doesnt look right, it's supposed to look similar to the white one".
2. Of the offer band (email field and "Send my code"), with a screenshot of it: "and why is this part not coming? i can see only this".
3. With two frames of the live site taken mid-scroll, the result's deep ground showing as a box with its edge over the fog: "and after getting the results, the transition is not coming, only that box, make sure the transition works well, and also after giving the quiz, it should give a little loading animation or like, a progress bar filling or something to make the user excited, for like 3-4 seconds, where while the loading animation is playing, it says a few things like, picking ur right color, are u excited? something more of that, appearing one by one".

## What the branch does

- **Our own paint (D52).** `scripts/quiz/make-smear.py` models a paint smear from measurements of Sam's swatch (its outline at 25 heights, the places of its rolled lip, rims and ridge) as a lit height field, nothing of the swatch's pixels, and writes `src/assets/quiz/smear/smear.webp` (256 x 624, 6.9 KB, committed). It is recoloured to the drawn shade exactly as the swatch is (`.qz-rub`, hard-light over the shade). `Quiz.astro` draws one markup for either paint: the licensed swatch where a build has it, ours otherwise; `PUBLIC_PAINT=own` puts ours first. The SVG stroke (`Smear.astro`), its CSS, `data-sm-rim` and its two tones (`--qz-sd`, `--qz-sl`, `resultTones().dark` and `.light`) are gone. The look's parameters came from a judged sweep: three readers on Sonnet, one lens each, then an Opus skeptic who measured each region against the swatch; the adopted set's mean absolute error over the stroke is 0.039 of the grey (the first sweep's defaults 0.104). Vercel's build has no swatch, so production draws ours.
- **The reveal (D50).** Between the tenth answer and the result: a new state, `reveal`. Four lines in the quiz's type, "Reading your answers.", "Weighing all 240 shades.", "Picking your colour.", "Are you excited?" (Sam's two in his words, ours for the first two), each decoding in 0.85 s after the one before, over a hairline whose Pearl Whisper line fills by `scaleX` across 3.5 s; 0.3 s after it is full they wipe out and the result comes. The lines are `aria-hidden`; the live region says one sentence. Reduced motion: the lines fade on the same clock and the line brightens a quarter at a time by opacity, no transform. `src/config/quiz.ts` holds the words (`QUIZ_COPY.reveal`, `revealAria`) and the clock (`QUIZ_REVEAL_MS`).
- **The entrance (D51).** The ground rises from the foot of the screen over 0.7 s on the standard ease; the paint and the chips fade in as it settles; the lines decode in one after another from 0.35 s (`decode.ts` `showAll(..., after)`, so the section reads as decoding from the result's first frame).
- **The scroll-out (D53).** In the result state the ground is fixed to the screen and fades as the section moves off its rest, either way: full within 3% of a screen, gone by half a screen; the offer band's fill fades with it through a layer behind its words (opacity only, CHECKLIST C3). The logotype's Pearl Whisper (`data-qz-ground`) follows the fade at 0.5. So the result dissolves into the fog and the wipes instead of sliding off as a box.

## Done and verified (on this Mac, 2026-11-03)

- `npm run test:unit`: 231 of 231 pass (last run on the tip with the fade's hold).
- `npm run check`: 0 errors.
- `npm run build` (production, with the CSP, budget and guard steps): exit 0, every enforced budget line ok; total JS 236.1 of 250 KB gz, the quiz's lazy chunk 12.7 KB. Taken before the last two commits (the adopted paint's asset and the fade's hold), which change no budgeted figure beyond a 0.9 KB smaller image.
- Visual checks on the dev server (`astro dev` on 4332, Chrome on the GPU, a probe script in the session's scratchpad): at 1440 x 900 and 390 x 844 the reveal's lines come one by one over the filling line, the ground rises and the result decodes in, and scrolling away a tenth of a screen at a time the ground and the band dissolve with no edge sliding past.
- A control run of the suspect quiz e2e rows on the default's own build (7444d38): the logotype-band row (it looks for `#toTop`, which the landing page has not drawn since the section index) and the six skip-ride rows (QG AC3, AC4, AC5: the ride's timing on this machine) fail there too, so they are inherited; the double-click and the four picture-timing rows pass there.

## Unfinished or unverified

- **The quiz e2e suite on the final build has not passed yet.** The last full run (on the build before the fade's hold) was stopped at row 15 of 85: its rows 1 to 4 failed on the result's look because the section rested a pixel off the screen's top and started the fade; the hold of 3% of a screen fixes that, and the spec's rows were updated for the reveal, the scroll-out, the gone stroke and the reveal's type role. Rerun it on a test build with our paint first:
  ```bash
  PUBLIC_PAINT=own npm run build:test
  npx wrangler dev --port 8840 --ip 127.0.0.1
  SKREED_GL=gpu BASE_URL=http://127.0.0.1:8840 SKREED_DIST=dist npx playwright test tests/e2e/quiz.spec.ts --project e2e --reporter=line
  ```
  Expect the seven inherited failures above; anything else is this branch's to fix.
- **The frames are not shot.** `scripts/quiz/frames.mjs` now takes `quiz-390x844-reveal.png`, `quiz-1280x800-reveal.png` and `quiz-<size>-result-leaving.png` in its result pass (`node scripts/quiz/frames.mjs http://127.0.0.1:8840 --result-only` with `SKREED_GL=gpu`, on the `PUBLIC_PAINT=own` build so the frames show our paint and go beside the others, not to `licensed/`). The committed result frames under `docs/specs/screenshots/` still show the old SVG stroke.
- **The independent review** (four lenses on Sonnet, an Opus skeptic) was running when the hand-off came; its findings are not applied. Its workflow log is on this Mac only.

## For Sam (his decisions)

- The reveal's four lines, their timing, the entrance and the scroll-out (quiz.md section 10, item 21). Until he answers, the build ships them as described.
- Our own paint's look (item 22). And still: whether Canva's licence lets the site ship his swatch (item 20); until then every build from the repository, production included, draws ours.
- The offer band on the live site: it is off in production on purpose (`PUBLIC_LEADS` unset, so `Quiz.astro` renders no band) because nothing receives the email yet (`/api/quiz-lead` does not exist, on Vercel or Cloudflare); shown as it is, every send would fail. To show it: set `PUBLIC_LEADS=on` in Vercel's production environment and build an endpoint (the stack's plan is Supabase behind one function with Turnstile).
- The live site's security headers: Vercel does not read `public/_headers` (Cloudflare's format), so skreed-pre-launch.vercel.app ships with no Content-Security-Policy, X-Frame-Options, Referrer-Policy or Permissions-Policy. A `vercel.json` `headers` block would carry them.

## Files outside git the other computer needs

- `src/assets/quiz/rub/` (git-ignored; `rub.webp`, `rub.png`, `index.json`): Sam's Canva swatch, regenerated on this Mac from his pasted reference by `scripts/quiz/prepare-rub.mjs`. Copies: `/Users/apple/skreed-pre-launch/.claude/worktrees/quiz-result/src/assets/quiz/rub/` and `/Users/apple/skreed-handoff-carry-2026-11-02/licensed/quiz-rub/`. Needed only to draw his swatch locally or to re-measure ours; never commit it.
- His reference image of the result: `/Users/apple/skreed-handoff-carry-2026-11-02/sam-sources/references/quiz-result-reference-1.webp` (2000 x 1125). `prepare-rub.mjs` takes the swatch from it (`node scripts/quiz/prepare-rub.mjs <image>`).
- The quiz's licensed Envato pictures are tracked in the repository (177 files under `src/assets/quiz/pics/`, on Sam's word of 2026-10-23), so a clone has them.

## Servers left running on this Mac

- `wrangler dev` on 127.0.0.1:8840, serving this worktree's `dist` (a `PUBLIC_PAINT=own` test build from before the last two commits; rebuild before testing).

## The prompt to resume from

> Resume the quiz's paint, reveal and scroll-out from docs/handoff/2026-11-03/quiz.md, on the branch claude/quiz-paint-relief in its own git worktree. Merge the current default branch in first (never rebase). Rerun the quiz e2e suite on a PUBLIC_PAINT=own test build on the GPU (SKREED_GL=gpu) and fix every failure that is not one of the seven inherited ones the note lists; then shoot the result frames with scripts/quiz/frames.mjs --result-only, look at every frame, and commit them (our paint only; the Canva swatch never enters the repository). Apply the confirmed findings of an independent review against docs/CHECKLIST.md and quiz.md AC15, on lighter models. Ask me before landing: landing deploys to Vercel.
