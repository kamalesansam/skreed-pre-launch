# Family pages prototype (2026-10-09 to 2026-10-15)

## Round 3 (2026-10-15)

The round 3 page (the Desert stand-in for MagTough, Snap and Armor; one case per frame with the half turn at every transition; the argument screen GO / BEYOND BASIC; the wordmark with the hero's glitch and "All families" in place of the header; no Reserve, no "Show swatches", only the family name on landing) is now the real `/shades/<family>/` route on the Astro build. What was built, checked and not done: `docs/specs/family-page.md` section 21.

## Round 2 after ciao (2026-10-14, hero link version 33)

Sam's brief of 2026-10-14 (verbatim below) and what was built: `docs/specs/family-page.md` section 20. In short: singular family names everywhere; ciao's side scroll cue (our own SVG and keyframes, `ciao-measure/scrollicon.md`) on this page and the landing page, the ball cue gone; the previous matte and gloss back under ciao's light (studio turned -40 degrees, base specular a fifth, top spot forward; calibration re-measured with `tools/ciaocal.mjs`); the 0-100 wordmark loader (our own copy of the hero's) on every family load and switch, counting over the real work; after the carousel, ciao's zoom, four case types (Tough on the Cobalt model, MagTough, Snap and Armor on the MagTough model from `Umber.fbx`, `tools/intake-magtough.py`, until Snap and Armor's files come) with text beside the case, the background tinted by the selected shade (E-F2), the carousel again as the last screen; the self-made sections below the carousel removed. Build: `python3 -I build.py` from `page.src.html` (the LOD GLBs and the MagTough GLBs embedded; the MagTough GLBs are not in the repo yet, intake from Sam's FBX). Harness: `tools/beats.mjs` (frames per scroll screen), `tools/ciaocal.mjs` (calibration and check), `tools/loadertest.mjs`, `tools/smoke3.mjs`. `shot-ciao-sections.png`, `shot-ciao-beat-1280.png`.

# Brief: family pages after ciao, round 2 (Sam, 2026-10-14)

Paths: `SC` = `/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad`. Repo = `/home/user/skreed-pre-launch` (branch `claude/youthful-planck-objwf5`). Read the repo's `CLAUDE.md` (you have it) and `docs/specs/family-page.md` section 19 (what was built on 2026-10-11) before anything else.

## Sam's words (verbatim, 2026-10-14)

> for the families pages add that same scroll effect gif which is in the side of the ciao energy site, and put the same in the skreed landing page as well, remove the previous scroll gif that we had, this looks clean, and also, the lighting direction is good in the family pages, but it adds a metallic effect on the case, so let's add the effect on the phone case which the previous version had, it's matte and gloss, but rest of the lighting keep it the same, the direction, intensity, everything stays the same, only the finish look on the phone cases are the previous one. and after that, inspect the next sections of the ciao energy site while we scroll down, look how the can get zoomed in and has like features text, i want the same, but no content on the phone cases, just beside will work, like each feature will be like, one is tough cases, the other one is magtough cases, snap cases, and armor cases, we need those as the features, and the small description would be taken from the description document is given for each, and also inspect how the last section looks like, the effect and everything, and also inspect how the background changes dynamically according to the phone color while scrolling to the next section, remove the rest of the sections that u made by yourself, only first section is fine, rest we will have similar to the ciao energy. and for magtough, 3d model i have uploaded here, for snap and armor also use the same magtough 3d model, i will give u the snap and armor 3d model separately tomorrow, so u can replace them. for tough we have the current models, those are only tough, so while scrolling down to each feature, the 3d model will transition into these tough, magtough, snap and armour 3d models, make the transition smooth, and also while clicking on the stones from the second section in the main page, add a dynamic loader which syncs with the network layer and has a progress bar which has the same effect of the pre-loader which comes before the landing page, not the animation, just the 0-100 loader screen with the skreed logo metallic effect, put that while clicking on the stone and between the families page, or while switching to a different family page while navigation from inside the family page as well, so the 3d renders have enough time to load, and they dont have an ugly scene before loading, it will be wrapped by the loader screen, if it takes 2 seconds to load, then the pre loader will count from 0-100 in 2 seconds itself, if it takes 5 seconds to load the page, it will count from 0-100 in 5 seconds, so make it dynamic to the speed of the page loading.

Also from Sam, same message: the singular family names (Basic Brown etc.) replace the catalog family names everywhere ("yes"). Section 2's still-image and reduced-motion tiers: "no need". The photo he attached is ciao's scroll icon: three downward chevrons of five dots each, stacked, with a short dash under them, at the side of the screen.

## Standing rules

- Match ciao by measurement, in our own code and assets. Never copy a ciao file, SVG, texture, model or string into our pages or the repo. Ciao's own screenshots stay out of the repo (scratch only).
- No em dashes anywhere (code comments and docs included). No emojis. No buzzwords ("seamless", "elevate"...). Copy in short sentences.
- The family page build guard (`SC/proto-shades/tools/build.py`) refuses `gradient`, `box-shadow`, `backdrop-filter`, `italic`, `blur(` and em dashes in the page source except lines marked `/*E-F1*/` (the two backdrop lines). A new exception line for the per-shade background must be marked `/*E-F2*/` and the guard extended for exactly that marker (and the assert count updated).
- Fonts: Poppins 700 (headlines, sentence case), Open Sans 400 to 600 (UI, numerals, small text), Source Serif 4 400/600 roman only (first-person prose). IBM Plex Mono is allowed only for the section 2 gem labels on the landing page.
- Phone first: build and check at 390 x 844 before 1280 x 800.
- Every page must run under the artifact CSP: `default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'`. No fetch, no eval, no WebAssembly, no other hosts. Three r165 from the jsdelivr importmap only.
- Test harnesses (Playwright + SwiftShader, slow: a 3D page takes 1 to 5 minutes to go live; set generous timeouts, run long things in the background and poll): family page `SC/proto-shades/tools/lib.mjs` (`launch`, `open`, `waitLive`, `settle`, `shot`), `tools/ciaoshot.mjs`, `tools/ciaocal.mjs`; hero `SC/proto/s2/shots11.mjs`. Fonts for the harness: `SC/gf-poppins-latin.woff2`, `SC/gf-opensans-latin.woff2`; three at `SC/proto-shades/node_modules/three` and `SC/proto/node_modules/three`.
- Do not run `npm install` anywhere. Python for scripts: `python3 -I`; Blender's python (bpy 4.x) at `SC/bl/bin/python` (add `-I`; pass file paths as arguments after `--`).
- Never push to any branch. Commits are made by the orchestrator, not by agents (do not run `git commit`); do edit repo files where your task says so.

## Files and ownership (one owner per file at a time)

| Owner | Files |
|---|---|
| hero agent | `SC/proto/s2/patch_v11.py` (the hero page patches: cue, gem links, family overlay), `SC/proto/s2/s2int.js`, `SC/show/s2gems/tail.js` (section 2 `FAM_ID` and `NAME`: the gem links are `#/shades/${FAM_ID[j]}/`), `SC/proto/s2/build_chunk.py` (builds `s2chunk.js` from the gem page and `tail.js`; re-run it after editing `tail.js` or `s2int.js`). Build: `cd SC/proto && python3 s2/build_chunk.py && python3 s2/patch_v11.py && SC/bl/bin/python build_v11.py ../land/moon_igloo template_v11.html skreed-hero-v11.html` (test build; add `SHIP=1` and the name `skreed-hero-v11-ship.html` for the ship build) then `SC/bl/bin/python -I s2/embed_family.py <built page> SC/proto-shades/skreed-shades.html` (embeds the family page; the test `FAMTEST=1 node s2/shots11.mjs <page> 1280 800 0 <outdir> 14.5` clicks the Blissful Blue gem: update its selector to the new id). |
| family agent (part 1, then part 2) | `SC/proto-shades/src/page.html`, `SC/proto-shades/tools/build.py`, new tools under `SC/proto-shades/tools/`. Build: `cd SC/proto-shades && python3 -I tools/build.py` writes `skreed-shades.html`. |
| model agent | `SC/proto-shades/assets/` new files only (`magtough-lod0.glb`, `magtough-lod1.glb`), a new `SC/proto-shades/tools/intake-magtough.py`. |
| rename agent | repo: `docs/data/shades-240.json`, `src/**`, `tests/**`, `docs/**`, `CLAUDE.md`, `prototypes/**` README text; scratch: nothing in `SC/proto` or `SC/proto-shades` (the hero and family agents apply the mapping in their own files). |
| research agents | write only under `SC/ciaofam/research/`. |

## The rename (Sam: yes)

Ids and names change everywhere (URLs, titles, eyebrows, switcher, data, Astro routes, sitemap, the gem links, the hero's section 2 `NAME` list stays as is because it already uses these names):

| old id | new id | old name | new name |
|---|---|---|---|
| frosty-whites | frosty-white | Frosty Whites | Frosty White |
| blissful-blues | blissful-blue | Blissful Blues | Blissful Blue |
| playful-pinks | playful-pink | Playful Pinks | Playful Pink |
| vivid-violets | vivid-violet | Vivid Violets | Vivid Violet |
| mellow-yellows | mellow-yellow | Mellow Yellows | Mellow Yellow |
| earthy-browns | basic-brown | Earthy Browns | Basic Brown |
| blushing-corals | blushing-coral | Blushing Corals | Blushing Coral |
| stormy-greys | stormy-grey | Stormy Greys | Stormy Grey |
| go-green | go-green | Go Green | Go Green |
| roaring-reds | roaring-red | Roaring Reds | Roaring Red |

Keep the catalog name in the data as `catalogName` (the 2026-27 catalog still prints it) and say so in `CLAUDE.md`'s brand facts.

## The real build (Astro) as of 2026-10-14

`npm run build` in the repo succeeds (11.8 s) but builds 2 pages only (`/` and `/404`): the family routes are gated off by a flag; the last Astro commit is effdac0 (2026-10-09, "Family pages 3D: the Cobalt case on the Astro family pages (pre-review snapshot)"). The hero in the Astro build is the v9.10 parity port (loader, logo, scene); the igloo intro (v10), section 2 (the gems, v11) and the ciao-look family pages (2026-10-11) exist only in the prototypes (`prototypes/hero-v9/index.html`, `prototypes/family-pages/index.html`). `wrangler.jsonc` has no routes yet (nameservers not on Cloudflare); nothing is deployed.

## Ciao facts already measured (reuse, do not re-derive)

- `SC/research/ciao-landing/source/ciao-3d-params.json`: renderer, camera, lights, materials, carousel pose maths, measured layouts.
- `SC/research/ciao-landing/source/runs/keyframes-desk.json`: the GSAP scroll timeline per section (sections: gamme 0-1000 px, profile 1000-2000, benefits x4 2000-6000, argument 6000-7000, full-gamme 7000-8000, faq 8000-10999, last-copy 10999-11999, last 11999-12999; `rows` give camera, can pose, spacing, wave, swirl, lights, spotY, tintStrength per section).
- `SC/research/ciao-landing/source/extracted/patched.L1877-L3358.js` (the module, annotated with line numbers), `SC/refsites/src/ciao/{markup.html,webflow.css,inline-styles.css,ui-gsap.js}` (the page, the stylesheet, the UI code). The local mirror of the site: `SC/refsites/ciao/www.ciaoenergy.com/index.patched.html` with assets beside it; `SC/refsites/work/drive-ciao.mjs` drives it in Playwright (read it for the serving trick).
- The scroll icon (`ui-gsap.js` lines 445-500, `markup.html` lines 1770-1800): `.icon-scroll_wrapper` (1.25rem wide, `inset: auto auto 10rem 50%`, in `.hud_left-bottom` and `.hud_right-bottom`) holds an SVG viewBox 0 0 35 146 of three `<g>` chevrons of five dots (r 2.4; outer dots fill-opacity 0.6, centre dot 1). Timeline: all three set opacity 0, scale 0 (origin centre), first y +100, last y -100; first to opacity 1, scale 1, y 0 over 0.6 s power2.out; middle the same starting 0.4 s before the first ends; last the same, 0.4 s overlap; then all three fade to 0 over 0.4 s power2.in with a 0.25 s stagger, starting 0.3 s after; repeat forever with a 0.3 s delay. We re-create this with our own SVG and CSS or JS, never their file.
- Backdrop and fade: `webflow.css` 4661 (`.gradient_overlay`), inline styles 609-632 (`body::before`, `body::after`: `radial-gradient(88.85% 121.19% at 43.49% 112.49%, secondary 4.96%, primary 54.38%, #000 93.49%)`, opacity 1 while `body.is-profile-active`, which is set on profile enter and cleared on full-gamme enter). Flavour colours (primary, secondary): Double Litchi #3D2B68 #9089D3, Coco #27326B #00A6E2, Kiwi #024A44 #71BD96, Peche #BA5200 #EFB36B, Pomme #9B0984 #E6A0E8, Abricot #800035 #FF659D.
- Our studio map, spots, calibration: `docs/specs/family-page.md` 19 and `SC/proto-shades/src/page.html` (search `studioMap`, `spots`, `CALV`, `albedoFit`, `calibrate()`).
- The previous finish (what Sam wants back on the case): `SC/proto-shades/src/page.r5pre.html` (`makeStudio`, `GLOSS` strips, `CAL` with environmentIntensity 0.575, matte MeshStandardMaterial roughness 0.62 metalness 0, gloss MeshPhysicalMaterial roughness 0.62 clearcoat 1 clearcoatRoughness 0.03 with its own strips PMREM).
- The hero loader (the 0-100 screen with the metallic wordmark; Sam wants the same for the family pages): `SC/proto/template_v11.html`: CSS `.ld-w`, `.ld-m`, `.ld-g`, `.ld-s`, `.ld-line`, `.ld-p` (lines 76-100), markup `#intro` (line 103, the `#skreed-wordmark` symbol it references), the inline script `window.__skreedLoader` (from line 167: `setProgress(p)`, `ready()`, milestone weights). Lift it into the family page as our own copy (it is ours), bound to the page's real milestones: three import, LOD1 parse, environment, compile, LOD0, first frame, each weighted by its measured share, smoothed so the number never runs ahead of the work and reaches 100 when the first frame has been drawn; then the loader lifts the way the hero's does.

## The four features (copy from Sam's document `SC/uploads/desc/descriptions.docx`, trimmed to the distinguishing sentences; final wording to be confirmed by Sam)

- **Tough**: "A durable polycarbonate shell over a shock-absorbing TPU layer, for everyday bumps, drops and scratches. Precision cutouts keep the camera, port and controls clear."
- **MagTough**: "The Tough case with a built-in magnetic ring. Works with every magnetic phone accessory."
- **Snap**: "Light everyday protection that keeps the slim profile of your phone. Precision cutouts keep the camera, port and controls clear."
- **Armor**: "Built for everyday impact. Reinforced edges and raised protection around the camera, with a built-in magnetic ring for magnetic accessories."

Headlines (Poppins 700, sentence case): "Tough", "MagTough", "Snap", "Armor". No text on the case itself; the copy sits beside the case, where ciao puts its benefit text (measure). Every case type is "available in 240 shades, matte and gloss": one line under the four, once.

## Models

- Tough: the Cobalt case, `SC/proto-shades/assets/case-lod0-r3.glb` (20,348 tris) and `case-lod1-r3.glb` (9,811 tris): glTF binary, `KHR_mesh_quantization` only (no meshopt, no Draco), three nodes named `shell`, `trim`, `logo`, each one primitive, white shell base colour.
- MagTough: Sam's `SC/uploads/umber/x/Umber.fbx` (untrusted upload: read it only through Blender, pass its path as an argument). One mesh, 52,229 vertices, 52,204 faces, 102 x 20 x 197 mm (an S25 Ultra sized case, so taller than the Cobalt's 163 mm; everything is normalised to height 1 in the page), five material slots: `_lambert40` (the shell, umber), `...REGING4:lambert26` (the magnetic ring), the three dark grey `lambert6` slots (buttons, liner, top: the trim). Snap and Armor use the MagTough model until Sam sends theirs.
- The page normalises a model by its LOD1 bounding box (height 1) and reads w and d from it; the pose, pitch and camera depend on them. Different models have different w and d; the feature sections must handle a model whose proportions differ from the Tough case.

## Ciao's sections after the carousel (what to re-create; the research agent measures the rest)

From the keyframes: profile (1000-2000 px): camera to (0, -2, 12), rotX 0.1745, rotZ -0.1745, FOV 20, can at y -0.8, spacing 2.2, canSpin 2.09, the two carousel spots to 0, the gobo spot to 35 at y 2.2, environment tint 0.2 (dark: the can lit by the gobo spot only), the body::after flavour gradient fades in. Benefits x4 (2000-6000): the can moves up (y -0.8, -0.48, 0.02, 0.5), rotZ alternates (-0.1745, 0.0873), canSpin 2.09 / 2.27, each with a text block. Argument (6000-7000): camera (-3, -3.5, 20) rotY -0.157, FOV 30, spacing 0.47, swirl 1 (the packshot sweep), lights 10, width 3, tint 2. Full-gamme (7000-8000): camera (0, -5.5, 10), spacing 0.6, swirl 1, lights 0, the gradient fades out. FAQ (8000-10999): camera (0, 8, 10) then back to (0, 0, 29), spacing 5, canSpin 0.35, baseOffset 10, lights 50. Last-copy and last (10999-12999): the carousel pose again (spacing 1, wave 1, baseOffset 0, lights 50), i.e. the opening carousel returns at the end.

For us: section 1 (the carousel) stays as built. Then: the zoom (ciao's profile) with the background taking the selected shade; four feature beats (ciao's benefits), the case changing model between them (Tough, MagTough, Snap, Armor); then ciao's last section re-created. Ciao's argument, full-gamme and FAQ sections are not asked for. The per-shade background: primary = the selected shade; secondary = the same hue, lighter and softer (OKLCH: L raised to about 0.72 or by 0.3, whichever is higher, chroma x 0.9); mark its CSS lines `/*E-F2*/` (an exception to rule 24; Sam asked for it). The model transition: smooth, scroll-driven, no pop: one case morphing is not possible between different meshes, so cross-fade with a scale and a turn (the outgoing case turns away and shrinks as the incoming one turns in and grows; both lit the same), or whatever reads smoothest; measure that nothing pops.

## What a build hand-off must contain

Files changed; how to build; screenshots at 390 x 844 and 1280 x 800 (paths under `SC/...`); console errors and CSP reports (must be none); the numbers the task asked for; a line per acceptance point saying how it is met; what is not done and why. Never mark your own work as passing.


## Ciao's look (2026-10-11, hero link version 32)
Sam: "it's not anywhere close to the ciao energy site, check out exactly how the background is, how the lighting is in the ciao energy site, and just replace the 3d can with the 3d phone case, rest everything looks the same." The page is now ciao's opening carousel with the case in place of the can. Full notes: `docs/specs/family-page.md` 19.
- **Backdrop:** ciao's fixed grey-to-night ramp (9.02 degrees, light at -30%, #959492 at 15%, black at 65%; ours with Pearl Whisper, `--studio` and `--night`) and its fade over the bottom of the first screen. Exception E-F1.
- **Scene:** ciao's carousel at rest (3.5 units a slot, the sine wave, the V in depth, tipped 20 degrees back, turned, leaned 11.25 degrees; camera at z 29, FOV 20), the case scaled to the can's height; ciao's two spotlights on the front case; ciao's studio HDRI measured and re-created as our own map (`ciao-measure/`: `hdrmeasure.py` measures, `fitmap.py` fits; irradiance within 15% on nine normals). The front case is lit, the others sit in the dark, as ciao's cans do.
- **Colour:** the case's albedo is fitted per shade so the front case reads the catalog colour (`tools/ciaocal.mjs` measures a and b; `ciao-measure/sim.cjs` simulates all 240). Two departures from ciao's renderer, each measured: the base-layer specular is cut to 0.2 (ciao's spots laid a grey sheen over the matte back), and the tone mapping is Neutral, not ACES (through ACES no albedo makes Sky read better than 123, 188, 244; Neutral leaves 227 of 240 shades under dE00 2). `?tm=1` shows ACES.
- **Layout:** the first screen, as ciao's: arrows either side of the front case, the name under it, the scrubber under the name; finish and Reserve bottom right on laptops, above the fixed bar on phones.
- Shots: `shot-ciao-look-1280.png`, `shot-ciao-look-390.png` (ciao's own frames are not kept in the repo). `ciao-measure/` holds measurements and fitting code only; ciao's HDRI and the arrays read from it are not in the repo.
- Not yet reviewed independently (no agents in use).

The ten family pages (`/shades/<family>/`): 24 cases of one family in a ciao-style line, one Cobalt case model recoloured per shade, case only (no phone). Spec: `docs/specs/family-page.md`. In the full page it opens from a gem in section 2 (hero link, v11.1).

- `index.html`: the built single file (the case LODs embedded); `page.src.html` its source; `build.py` the builder (expects the session's asset paths).
- Review: round 3, engineering PASS, fidelity FAIL on a drag past either end freezing the line and a stale name while a drag is held. Round 4 fixes (clamped front slot, a trailing name update, a route race guard, a fixed-width view toggle, the copy now says gems) were checked by the builder against the reviewer's own harnesses (drag past both ends at 390 and 1280, held drags) but not yet re-reviewed independently.
- Family names are the catalog's (Blissful Blue); the gem labels use Sam's singular names. Whether the singular names replace these is pending Sam.
