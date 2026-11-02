# Session 3: section 5, the sign-up, rebuilt as Sam's four-jar picture

- **Old session:** "Section 5 signup page with glass jar" (`local_a3664742`).
- **Branch:** `claude/section-5-signup-glass-jar-9d74d2`, four commits on `2d0d319` (an old default):
  - `14183d8`: the first section 5, glass jars that the follows fill.
  - `78eae8f`: a checkpoint of one jar of sand.
  - `f722ac3`: the WIP handoff of the picture rebuild.
  - `3e4673a`: the final jar renders. The Blender job the session had started kept running after the pause, finished at 17:51 IST ("ALL DONE 1445.1s") and installed all 16 states. `jars.json` is no longer provisional.
- **Set aside:** `wip/section-5-liquid-2026-11-02` (`728e0fd`), the liquid version stopped when the picture arrived.
- **Spec:** `docs/specs/section-5-picture.md`. Section 14 is the For Sam list; section 16 is the measuring checklist, still to fill. The older `section-5.md`, `section-5-sand.md` and `section-5-liquid` docs are superseded.
- **The picture:** in the carry folder, `sam-sources/references/section-5-four-jars-picture.webp`. It is the spec.

## What Sam asked (verbatim, latest first)

1. "If someone clicks on the Facebook symbol, it should take them to our Facebook page. If they follow it, the fourth jar should fill up 25% with blue (which is same as Jar 1). After that if they click on the YouTube symbol, it should take them to our YouTube page. If they subscribe to it, the fourth jar should fill up 25% with red (on top of the 25% blue). just make this exact same page with the same logic, same font, same space, same backround, same everything from that picture, just relayout it for phone as well, use the exact same font for each and every line from that picture".
2. "Background, font, placement - everything should be like this. The pink-purple of Instagram is a mix of the two colours, not pink then purple. It's one mixed lot."
3. "the sand should look exactly the same as the picture": pellets, not liquid.
4. Layout choice: "Fit one screen (Recommended)". The picture's placement with tighter spacing, fitting one screen on a laptop and most phones.
5. **No review loop for this section:** "i'll do the review part, so we'll refduce time, u dont have to review, i'll review it on the localhost port on the browser visually and tell u if i like it or not, so cut down the time to only building". Build, measure by numbers, then show Sam on localhost. **Do not commit a final version until Sam has seen it and says he likes it.**

## The design, as decided

- **The page:**
  - An off-white ground and the headline "YOU'VE MADE IT THIS FAR.", then a sub-line with a bold part and "EVERY FOLLOW FILLS THE JAR".
  - Four tall glass jars: 1 blue pellets (Facebook, "5% OFF"), 2 red (YouTube, "5% OFF"), 3 a pink and purple mix (Instagram, "10% OFF"), 4 empty with an orange star ("UP TO 20% OFF").
  - "GOT YOUR COLOURS?" between hairlines, a grey line, an email field joined to a black pill "SAVE MY DISCOUNTS", and "Pssst...keep following to keep your savings!".
  - Copy verbatim from the picture. No consent box.
- **Jar 4's fill:**
  - Facebook adds 25% blue, YouTube 25% red, Instagram 50% as one mixed lot (about 2 pink to 3 purple).
  - The 16 states by press order: `0 f y i fy fi yf yi if iy fyi fiy yfi yif ify iyf`.
  - A bottom-up clip-path reveals the next state: 0.9 s a quarter, 1.4 s a half, 0.5 s after the press. Instant under reduced motion.
- **Links:** facebook.com/skreedofficial, youtube.com/@skreedofficial, and Instagram as `src/config/signup.ts` has it.
- **Renders:**
  - Pre-rendered in Blender 5.2 headless (Cycles on the CPU) by `scripts/signup/jars/` (`pack.py`, `render.py`, `compose.mjs`, `run.sh`, `README.md`).
  - The files are `src/assets/signup/jars/jar-<state>-<1x|2x>.<avif|webp>`, plus `jars.json`.
  - **The committed images are the final renders** (`3e4673a`, with a `seam` per state in `jars.json`). They have not yet been checked against the picture or section 16's measures. The carry folder's `section-5-jar-work/` holds the Blender intermediates (`pile.json`, `raw/`, `render.log`), needed only to re-render. The full run took 24 minutes on the old machine.
- **The island:**
  - The jar chunk, `jar.bin` and its stills are removed (deleted on the branch).
  - The island draws a flat cream ground for the fourth wipe and while section 5 is in view (`src/scripts/hero/section5/ground.ts`, `src/config/signup-ground.ts`). The DOM is transparent when `data-ground="island"`, cream on the poster tier.
  - `signupDom()` is the only source of `exitY` and `restY`. `data-ready` is set when the images and fonts are decoded.
  - The G4 exit guard (`src/scripts/hero/section4/exit-guard.ts`, 18 of 18 unit tests) arms the exit only after the page rests at `restY`.
- **Fonts:** Inter (`public/fonts/inter-opsz-wght-latin.woff2`) as the free match for the picture's Helvetica, and Jost (`jost-wght-latin.woff2`) for its Avenir. Inter is banned by `CLAUDE.md` rules 4, 19 and 30. It is used on Sam's words, and Albert Sans is the one-line swap if he declines.

## Interrupted

The build workflow, started at 16:15 IST on 2026-11-02. It ran four agents in parallel: A the page, B the island, C the renders, D the records. The measuring pass and fix rounds would have followed. Its partial output is in the WIP commit. Whether each agent finished is unknown, so treat every part as unverified.

## Next steps

1. Set up a worktree on the branch, run `npm ci`, and copy `section-5-jar-work/` into `scripts/signup/jars/work/`.
2. Run `npm run test:unit`, `npm run check` and `npm run build`. Read the diff against `section-5-picture.md`, to find which of A to D finished.
3. Finish what is missing. Check the final jars against the picture (re-render with `bash scripts/signup/jars/run.sh` only if they are off), and fill section 16's measurements: the fit at the nine sizes, form on and off.
4. **First land session 2 (the hall's removal),** then merge it in here. Section 5's entry follows scene 5's exit, and this branch was built on the hall's map. Expect conflicts in the shared docs and `tests/e2e/room.spec.ts`.
5. Start the dev server (`astro-dev-win` on 4321, or `npm run dev`). Open it for Sam and send phone (390 x 844) and laptop (1280 x 800) screenshots. Wait for his verdict.
6. On his yes: run the e2e, regenerate the frames, finish the docs, commit, then land after his word.

## For Sam

The full list is `section-5-picture.md` section 14. The ones that matter before launch:

- The discounts ("up to 20% off your first order", 5 + 5 + 10) are a promise the store must honour: what the code is, when it ends, and what happens on an unfollow.
- "We'll verify your follows" cannot be done by the site. A press on a mark is counted as the follow.
- Meta's and YouTube's rules on rewarding follows and subscriptions.
- There is no consent box under the DPDP Act: add a one-line notice, or bring the box back. The form is off in production (`PUBLIC_LEADS`).
- Inter is in use against the ban (Albert Sans is the alternative). The picture's paid fonts are not used.
- The marks are our own drawings. The grey lines, the footer and the placeholder are below AA, as in the picture.
- The pellets wear the picture's colours, not catalog shades (rule 38).
