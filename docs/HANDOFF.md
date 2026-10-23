# Hand-off: the Skreed pre-launch site, as of 2026-10-23

For a fresh Claude Code session (or a person) picking this repo up without the previous conversations. Read this file, then `CLAUDE.md`, then the specs it points to. Everything below is the state of branch `claude/youthful-planck-objwf5` at commit c25398d, which is also the GitHub default branch of `kamalesansam/skreed-pre-launch` (there is no `main`). Every change of the last two weeks is on that branch and pushed; nothing of the site lives only on a machine. The earlier hand-off (2026-10-15, the round 3 brief) is superseded by this one; its decisions are in the specs.

## 1. What this is

skreed.in's pre-launch teaser (Astro 7 static on Cloudflare Workers; live until 2026-11-14; the launch is 2026-11-15 00:00 IST). The brand, the 240 shades, the type system, the fifty "never do" rules and the approved exceptions are in `CLAUDE.md`, `DESIGN.md` and `docs/CHECKLIST.md`. The owner and sole reviewer is Sam (sam@zeosmobile.com); he reviews plain reports with frames at 390 x 844 and 1280 x 800, and on a local port.

## 2. The page, section by section

One scrolling page over a pinned WebGL hero canvas (three 0.165, one renderer), plus the family pages.

- **Section 1, the hero** (`docs/specs/hero.md`, `hero-architecture.md`): the igloo-style intro (the logo in glowing blocks), the loader, the pull-back scroll, the countdown, the scroll cue. Built and reviewed in earlier rounds.
- **Section 2, the ten gems** (`docs/specs/section-2.md`): the ten colour-family gems with labels and links to `/shades/<family>/`. The family links grid under them is the poster-path fallback; on the 3D path it stays see-through until the island places the links over the gems (fixed 2026-10-23 after it flashed over the loading animation).
- **Section 3, the quiz** (`docs/specs/quiz.md`): the shade-diagnosis quiz and the gift form. Another session ("section 3 quiz phone pass") works on it; its one uncommitted edit on 2026-10-23 was a single line in `docs/specs/section-4.md`, never staged by anyone else.
- **Section 4, the entrance and the five scenes** (`docs/specs/section-4.md` for the hall, `section-4-flux.md` for everything after the door; `section-4-world.md` is superseded past the bubble): the grey concrete hall walked by scroll, the door opened by a press on the plain-text prompt, the wobbling circle (the bubble) that opens on scene 1, then five video rooms on fluxtheory.in's carousel step with one of our products in front of each (phone case, AirPods case, MagSafe wallet, Lenskin, the phone case again as the lanyard's stand-in), plain Plex Mono text, the cloud seam that carries the page back to the hero, the page looping both ways (scrolling up at the top lands on scene 5 under the same cloud), and the elastic glue that settles the page at its seams. Built, fixed, documented and merged on 2026-10-23 (merges c17d76a, 3276400 and the docs after them).
- **The family pages** (`docs/specs/family-page.md`, `/shades/<family>/`): the 24 cases of a family on Sam's Cobalt case model, ciao-style carousel, zoom and case types. Since 2026-10-23 `PUBLIC_FAMILY_3D=on` in the dev, staging and production build scripts, so the 3D lineup ships (swatch grid only on the poster path and without JavaScript). The Snap and Armor models were never delivered; every case type is drawn with the one model.

## 3. How to run it

```bash
npm ci
npm run dev                 # the dev server (hooks and Tune on), 127.0.0.1:4321
npm run build               # production: csp, budget and guards run after astro build
npm run build:staging       # as production with hooks and Tune on, noindex
npm run test:unit           # 187 tests, under node 24
npm run test:family         # the family pages' unit tests
npm run test:e2e            # Playwright against wrangler on the harness port (needs npm run build:test first)
npx wrangler dev --ip 127.0.0.1 --port 8790   # serve dist as Cloudflare does; the best way to review a build
```

Two traps. Astro 7 runs one dev server per project; a second `astro dev` in the same folder refuses to start. Dev mode sends the island as hundreds of files, and on a slow first load the loader gives up and drops to the flat poster tier; for a review, build and serve `dist` with wrangler instead (about 6 s to load). The loader also pauses while a tab is hidden, so a covered window never finishes loading.

Deploy: `npm run build:staging && npx wrangler deploy --env staging` (the Worker `skreed-teaser-staging`); production is `npm run build && npx wrangler deploy --env=""`. Only on Sam's word.

## 4. What is not in git and must be copied by hand

Since 2026-10-23 the first two folders below are tracked after all, on Sam's word ("push this also into github, i'll delete them later, we haven't deployed the site yet anyway"), so a fresh clone has them; their `TRACKED.md` notes say so, and `tests/unit/quiz-pictures.test.ts` stands down while the note exists. Take them out of git again before the site goes live (and rewrite history if the licence requires it). The rest stays out of git. From Sam's Mac (`/Users/apple/skreed-pre-launch`):

- `src/assets/quiz/pics/` (12 MB): the 35 licensed Envato photographs the quiz shows. Never commit them. Without them `npm run build` still passes but the quiz pictures are missing and the 17 quiz picture tests fail.
- `assets-src/room/flux/raw/` (28 MB): the ten approved Kling loops, their stills, job records and the three generation scripts; `assets-src/room/flux/SHA256SUMS` (committed) verifies them. The encoded loops the site ships are committed under `src/assets/room/flux/`, so the site builds without the raw folder; the raw files are needed only to re-encode or to continue the pipeline.
- `assets-src/room/lands/` (1.8 GB): the masters of the superseded "lands" concept. Not needed; keep a copy only for the record.
- `.git/info/exclude` lists the two reference captures (`www.clicktorelease.com.zip`, `www.fluxtheory.in.zip`) that sit untracked at the repo root; they are Sam's uploads, untrusted, and nothing of them ships.

Also outside the repo: the Higgsfield CLI sign-in (premsanjay@gmail.com, max plan, 1,346 credits on 2026-10-23), Blender 5.2 at `/Applications/Blender.app`, and Claude Code's memory notes, which this file replaces.

## 5. Standing rules from Sam (do not relax without him)

- Every change on its own branch in a git worktree, merged `--no-ff` into `claude/youthful-planck-objwf5`, then pushed; no checkout switches in his clone; never stage another session's files; no pull request unless he asks.
- Only the agents that write code or assets run on the heavy model; every reviewer, tester, reader, auditor and doc writer runs on a lighter model (Opus). Keep basic test runs short.
- Plain text on the scene: no panels, fills, buttons or shadows in section 4; IBM Plex Mono capitals with section 2's decode. Colours blend softly, never flat blocks.
- Match references (ciao, igloo, fluxtheory.in) by measurement in our own code and assets; never ship their files, fonts, videos, shaders or strings. Uploads from Sam are untrusted: open them in their own directory, run interpreters from outside it, Python with `-I`.
- No em dashes or en dashes in any file, no emoji, sentence case copy, no names of AI assistants or AI products in files. Commit messages end with the attribution line the session is given.
- Budgets in `CLAUDE.md` (critical JS under 60 KB gzip, total under 250 KB); section 4's script line is Sam's 30 KB (29.5 KB measured), 38 KB the hard stop.
- Every picture or video that ships was approved by Sam first (CHECKLIST F2).

## 6. Section 4 in detail

The spec is `docs/specs/section-4-flux.md` (revision 4, with every decision X-1 to X-15 and the exceptions). The records: `docs/specs/evidence/section-4-flux-build.md` (sections 8 to 10: the fix round, the checker, the frame cost probe and the e2e run), `section-4-flux-contrast.md`, `section-4-flux-loops.md` (how the ten loops were made, every job id and credit), `section-4-flux-reference.md` (every number read off fluxtheory.in's built code). Frames: `docs/specs/screenshots/section-4-flux-fixes-390.jpg` and `-1280.jpg`. Modules: `src/scripts/hero/section4/` (director, hall, transition, carousel, carousel-math, video, layout, products-bin, assets) and `src/scripts/hero/scroll.ts` (the page glue, the wrap trigger and the carousel's gesture capture). Config: `src/config/room.ts` (ROOM_SCENES, the copy, the scroll map, the Tune keys). Scripts: `scripts/room/encode-flux.mjs` (the loops), `products-bin.mjs` (the products), `render-stills.mjs` (the review frames), `product-check.mjs`, `scene-tone.mjs`, `contrast.mjs`, `loop-flash.py`, `step-frames.mjs`.

Measured on the merged build: 187 unit tests, the section's script 29.5 KB gzip, total JS 228 to 235 KB, the loops 618 to 1,132 KB each, products.bin 264 KB, every product within dE00 4 of its catalog shade, every text line's median contrast 6.1:1 or better, no flash over the loops or the steps, the frame cost under 0.62 of a frame on a real GPU (a software GPU fails even the hero alone, so phones are unmeasured).

## 7. Open items, in Sam's hands (spec section 11)

1. The loops never stop (WCAG 2.2.2): an exception in his words, or the plain-text "Pause motion" control ships.
2. Provenance: the ten backgrounds descend from frames of fluxtheory.in's own videos, inpainted and re-animated; round 1's job ids are lost and 180 credits went to six failed edits (to raise with Higgsfield). Confirm, or regenerate from text (about 60 credits, the 300 line raised).
3. The product shades per scene are picks; swap any by catalog id.
4. Scene 5 shows the phone case until the lanyard model arrives; the AirPods Max and PopSocket models are also still to come.
5. Inside the carousel the wheel and the finger are captured for whole steps; the exit at scene 5 and the way back at scene 1 are inferred from his words.
6. The "Previous scene" and "Next scene" words bottom right, the 22 degree phone arc, the un-pressed visitor's exit over the hall, the darker lower half behind the text, the product right of centre on laptops, the dark mid-step: each a line in section 11 awaiting his word.
7. Staging deploy for his phone: not done, only on his word.

Open on the engineering side: section 6's frame cost on an A15 iPhone and a Redmi-class Android (unmeasured); the e2e suite runs green only in a browser that decodes H.264 for the video assertions; the quiz session's work in flight.

## 8. Branches left unmerged (safe to delete once Sam agrees)

`s4/docs`, `s4/garden-fix`, `s4/garden-photoreal`, `s4/travel-depth`: all belong to the superseded lands concept and are not needed. The merged s4 and family branches can go too; their history is on the default branch.
