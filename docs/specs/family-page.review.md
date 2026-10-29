# Family pages: review log

Graded by the review skill (`.claude/skills/review/SKILL.md`) against `docs/CHECKLIST.md` and `docs/specs/family-page.md` section 7. Run 1, "Family pages: grid mode", is graded on acceptance 1, 2 (links, Wall route, AT, return path on the poster path), 6, 8 (Lighthouse, grid mode), 9 (grid-mode rows) and 10 (spec section 11).

## Iteration 1, 2026-10-09: FAIL

### How it was checked

- Screenshots read first: `screenshots/family-390.png`, `family-1280.png`, the Frosty Whites and Vivid Violets pairs, the switchers and the full page.
- Independent build in a scratch mirror (`scratchpad/famreview`, own Vite cache, `wrangler dev` on 8795; the hero's `dist/` and 8787 untouched). `npm run build` with the default `PUBLIC_FAMILY_3D` (off): 11 pages, CSP line 1,188 characters, no island chunk, no "standin" in `dist/`.
- `npm run test:family`: 40/40 pass. The builder's `grid.spec.ts` against the review build: 29/29 pass (1.2 min).
- The reviewer's own Playwright probe (`scratchpad/famreview/_review/probe.mjs`): computed type and colour on both neutrals at 390 and 1280, CSP on all ten pages at both layouts (0 violations), a deep link with the page module held back, cross-family and junk parameters, tab order, scrubber and grid keys, live region, focus rings on Pearl and Slate, JavaScript off, reduced motion, and a viewport sweep including short laptop heights.
- A 23-shade Vivid Violets in the mirror's data fails `astro build` with "family pages: vivid-violets has 23 shades, not 24".
- Lighthouse 13.5 mobile on `/shades/blissful-blues/`, **grid mode**: performance 100, accessibility 100, best practices 96 (console error from the `/favicon.ico` 404), SEO 100. LCP 1.1 s, TBT 0 ms, CLS 0, 53 KiB.

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | Rule 12: the pages add motion outside rule 12's list (name and number swap, scrubber marker, sticky-bar colour cross-fade, view transitions); R5 is unanswered. Rule 24: the shades appear together outside the Wall (grid, scrubber, switcher); R2 is unanswered. Spec section 11 makes both a gate. Rule 15 (minor): off-scale `gap: 2px` (`.famnav a`), `gap: 6px` (`.gsw`, wide) and raw offsets 140, 134 and 186 px in the wide layout. Rules 1 to 11, 13, 14, 16 to 23, 25 to 45, 48 to 50: no violation found in `src/components/family`, `src/scripts/family`, `src/styles/family*.css` or the built pages. Rules 46 and 47: no terms or privacy page on the site (see G15, G16) |
| A2 | PASS | Every colour in `family.css` is a token; shades only through `--sw` and `--shade` on swatches; Ember only on Reserve and focus. Slate pages redefine `--skeleton` as the mirrored mix (R7, pending Sam) |
| A3 | PASS | Measured: h1 Poppins 700 32 px (390) and 56 px (1280); name Poppins 700 28 and 36 px; family Open Sans 400 14 and 15 px; counter Open Sans 600 16 and 18 px, tabular; sticky-bar name Open Sans 600 14 px; smallest face 12.0 px (eyebrow); no Poppins under 24 px; no italic; no digit in h1. R3 (family name as an h1 in Poppins) pending Sam |
| A4 | PASS | Copy matches section 3; no em dash, emoji or buzzword in sources or built pages; real shade names |
| A5 | PASS | The real 24 swatches per family (but see FAIL 2: on short laptops they shrink to dots) |
| B1 | PASS | 390 and 1280 screenshots attached for three families, plus eight more sizes |
| B2 | PASS | No horizontal scroll at 360, 375, 390, 430, 768, 844, 1024, 1366, 1920; 16 px gutters; every control 44 px or more (the logo link's hit area is its 112 x 45 `::after`) |
| B3 | PASS | https links only, no storage; the finish lives in the URL |
| B4 | PASS | Stage height in `svh`; nothing animates in `dvh` |
| C1 | PASS | Head script 1,451 B raw, 833 B gzip, identical bytes on all ten pages; page module 3,710 B gzip plus motion 176 B |
| C2 | PASS | No image in the off build |
| C3 | FAIL | No WebGL in the off build. But the sticky-bar swatch animates colour, not transform or opacity: `.bar-sw { transition: --shade 600ms }` (see FAIL 6). Finish segment colours on press are rule 14 press states |
| C4 | PASS | Lighthouse mobile performance 100, grid mode (numbers above) |
| D1 | PASS | Everything visible at rest; 0 running animations at idle |
| D2 | PASS | Reduced motion: grid mode, swaps instant (`getAnimations()` empty after Next), view transitions `none`. R16 (no `gsap.matchMedia()` on these pages) pending Sam |
| D3 | PASS for run 1 | Deep link: skeletons with the module held back, never the key shade's text; `?shade=999` and `?shade=32` cleaned to the key shade; `?shade=032` on Vivid Violets lands on Blissful Blues with Sky and keeps `finish=gloss`; JavaScript off works. The 3D states are run 2 |
| D4 | PASS | Hover and press only on buttons, links and swatches; translateY and scale, no opacity |
| E1 | BLOCKED | `/web-design-guidelines` is not installed here; the builder applied the fetched rules by hand. Recorded as blocked per the checklist, never PASS |
| E2 | BLOCKED | `visual-critique:critique-screen` is not installed. The reviewer's own critique is folded into FAIL 2 and the notes |
| E3 | PASS | Semantic landmarks; labelled controls; slider with min, max and value text; radio group with roving tabindex; live region speaks once for Prev and Next and stays quiet for the focused slider and grid; focus visible on both neutrals; no text under 4.5:1 on either neutral. Note: the grid swatch's focus is the Ember outline alone (2.0:1 on Pearl), carried by the slate selected ring beside it (R8 pending) |
| E4 | PASS | Writes no data |
| E5 | n/a | No database on these pages |
| G1 | FAIL | `/shades/blue/` returns status 404 with an empty body; no branded 404 page |
| G2 | PASS | Reserve in the sticky bar at 390 |
| G3, G4 | PASS | Ten unique titles and descriptions, as in section 3 |
| G5 | FAIL | No Open Graph tags on the pages (Base.astro defers them) |
| G6, G7, G8 | FAIL | No favicon set, no robots.txt, no sitemap.xml in `dist/` |
| G9 | PASS | Swatches named "{Shade}, {Family}, {n} of 24" |
| G10 | FAIL | Fine at 360, 390, 430, 768, 1024 x 768, 1280 x 800; broken at common short laptop viewports (FAIL 2) |
| G11 | PASS | Sticky bar with `env(safe-area-inset-bottom)` |
| G12 | PASS | Deep-link skeletons |
| G13, G14, G17, G20, G25 | n/a | No form, no thanks state, no cookies, no cutover, no founders' note on these pages |
| G15, G16 | FAIL | No privacy or terms page, so no footer links |
| G18 | FAIL | No analytics on the site; events are only dispatched as `skreed:track` |
| G19 | PASS | collab@skreed.in, Hyderabad, Telangana, @skreedofficial |
| G21 | FAIL | Dead ends: Reserve goes to `/?shade=NNN&finish=...#reserve` and "All 240 shades" to `/?family={slug}#wall`, but the production landing renders the hero alone (no `#reserve`, no `#wall`); and nothing on the landing links to `/shades/` |
| G22 | Pending | The eyebrow and switcher as breadcrumbs (R9) |
| G23, G26 | FAIL | No FAQ block, no JSON-LD |
| G24 | PASS | The reply line is beside the contact line (it promises WhatsApp, but no WhatsApp contact is on the page; see notes) |
| G27 | PASS | Nothing fabricated |
| H | PASS for run 1 | Section 5 rows that apply to grid mode hold; the family column (R15) is not yet in CHECKLIST H |
| F1 | FAIL | Acceptance below |
| F2 | PASS | No TODO, placeholder or commented-out code in the family sources |

### Acceptance criteria (run 1)

| # | Verdict | Evidence |
|---|---|---|
| 1 | FAIL | Ten URLs, own titles and descriptions, switcher works with JavaScript off, neighbours in catalog order, 23 shades fails the build: all hold. Fails on: no sitemap; `/shades/blue/` is an empty 404, not the site 404; the "Wall" link lands on a landing with no Wall |
| 2 | FAIL | Not wired. `FamilyLinks.astro` is mounted nowhere, `rock-links.ts` is imported by nothing outside its own folder, and the built `index.html` contains no `/shades/` link, no `#families` and no return path. No way into the ten pages from the landing exists, by click, tap, keyboard or poster grid |
| 6 | PASS | Sizes and faces measured above; name centred on x 640 under the stage at 1280; no `style` attribute in `dist/`; Reserve carries `?shade=032&finish=gloss#reserve` after Gloss; a deep link shows skeletons, never the key shade, until the module writes the text |
| 8 | PASS | Lighthouse 100 (grid mode); head 833 B gzip of 1.5 KB; module 3.7 KB of 12 KB; shade tokens plus page rules 1,847 + 792 B gzip of 3 KB |
| 9 | FAIL | Grid rows hold where tested (`?shade=999`, cross-family, reduced motion, data saver, no WebGL2, zero CSP violations). Missing: the 2G and `deviceMemory` 2 rows exist only in the head-script unit test, not in Playwright; and no state screenshot is attached, while the criterion says "Each screenshot is attached" |
| 10 | PASS | Slider keys measured (End 24, Home 1, Page Up 7 then 13, Page Down 7, arrows by one); grid one tab stop with arrows; live region once; focus visible on both neutrals; AA text; grep guards clean on sources and built CSS; nothing moves while idle |

### Verdict: FAIL

1. **Wire the ten family links into the landing (acceptance 2, G21, F1; Sam's explicit ask: the gems are clickable and open the family pages).** Today nothing on `/` links to `/shades/`. In the hero port, with the hero owner: mount `<FamilyLinks slot="riders" />` in `src/pages/index.astro`; in the section 2 island call `installRockNav({ canvas, pick, nav, active, onFocusGem, setCursor })` and, from the frame that places the gem labels, `placeLinkBoxes(nav, boxes)`; call `isReturnVisit()` in the loader's skip path and skip `scrollTo(0, 0)`; add `installViewTransitionScope()` and `@view-transition { navigation: auto; }` on the landing. Do the mount and `placeLinkBoxes` in the same change: mounted alone on the 3D path, the ten transparent 44 px boxes stack at the top left. Then add the acceptance 2 Playwright checks (click at 1280, a 600 ms tap at 390, `?blockColors=warm`, tab order and focus ring, the poster-path grid, Back with and without the back-forward cache).
2. **Swatch grid mode collapses on short laptop screens (spec 2.6 and 2.7, G10, F1).** The wide-layout circle size is `min((100cqh - 3 x 12 - 4 x 24) / 4, 80px)` inside a stage of `100svh - 72 - 140 - 240` with no floor, and `.gsw`'s 44 px minimum then pushes the grid out of the stage. Measured on Blissful Blues and Earthy Browns: 1280 x 609 (a 1280 x 720 laptop): 6 px circles, captions over the HUD; 1366 x 657 (the most common Windows laptop): 18 px; 1024 x 600: 4 px, captions over the HUD and the finish control; 900 x 600: 4 px, "Midnight" under "Matte" and "Sky" across the fourth row. Evidence: `screenshots/family-review-i1-blissful-blues-1280x609.png`, `family-review-i1-earthy-browns-1366x657.png`, `family-review-i1-blissful-blues-900x600.png`. Production ships grid mode, so this is what those visitors get. Change: in grid mode on the wide layout, never size circles below the spec's 80 px (or at worst 44 px); let the block grow instead (title, grid, then the HUD band in flow, page scrolls) rather than pinning the band to a viewport-high box. Add 1280 x 609, 1366 x 657, 1536 x 753, 1024 x 600 and 900 x 600 to the Playwright sweep, asserting the circle size and that no `.gsw` box intersects `#hud`, `#finish`, `#reserve` or `#scrub`.
3. **Site essentials that acceptance 1 and G name (acceptance 1, G1, G5 to G8, G15, G16, G18, G23, G26, rules 46 and 47).** `dist/` has no `sitemap.xml` (acceptance 1: "the sitemap lists all ten"), no branded 404 (`/shades/blue/` is an empty 404), no favicon set, no robots.txt, no OG tags, no privacy or terms page, no analytics, no FAQ block, no JSON-LD. If these belong to the site-essentials pass, schedule it before the next review of this section; acceptance 1 cannot pass without the sitemap and the 404.
4. **Dead ends (G21).** "Reserve my shade" and "All 240 shades" land on a landing that renders the hero alone. Per spec section 11 the pages do not ship to production until the Reserve section reads `?shade=` and `finish=` and the Wall exists; keep `/shades/` out of any deploy until then, and re-grade G21 when they land.
5. **Sam's written answers to the rule conflicts (A1 rules 12 and 24; spec section 11 gate).** R1, R2, R5, R7, R9 and R11 to R16 are still open, and CLAUDE.md (rules 12 and 24, the one-WebGL-island line) and CHECKLIST.md (the H column, the B2 landscape exception, G3, G4, G8, G22, C3) are not amended. Without them A1 fails on every iteration. Not a code change: ask Sam, then amend the two files.
6. **C3: animate the sticky-bar swatch with opacity, or get it approved.** `.bar-sw { transition: --shade var(--dur-shade) linear }` is a 600 ms colour animation. Either stack two swatch layers and cross-fade by opacity, or add it to R5 for Sam to approve as a C3 exception (as the hero's E-C3b).
7. **Acceptance 9: complete the grid-mode state rows.** On a `PUBLIC_FAMILY_3D=dev` build, add Playwright rows for `effectiveType` `2g` and `slow-2g` and for `deviceMemory` 2 (grid mode, the right line and "Show in 3D" where the spec gives one, no island request), and save one screenshot per state row (data saver line, slow connection line, `?shade=999`, cross-family landing, reduced motion, no WebGL2) as `screenshots/family-state-<row>-390x844.png`.
8. **E1 and E2 are blocked.** Install `web-design-guidelines` and the `visual-critique` plugin (CLAUDE.md day-1 items 2 and 3) where the loop runs, or have Sam accept the hand-applied pass. Until then both stay BLOCKED.
9. **Rule 15, minor.** Replace `gap: 2px` (`.famnav a`) and `gap: 6px` (`.gsw` at the wide layout) with scale steps, and express the wide layout's 140, 134 and 186 px offsets from tokens (or register them in DESIGN.md as component dimensions, as `--band` is).

### Notes (not graded as FAIL)

- **Visual critique at 390 (folded in for E2).** The page reads clean and on brand: one title, the 24 circles, the name, then the controls, with Reserve always in reach. The weak point is the 107 px of empty stage above and below the grid: the 450 px stage is sized for the 3D lineup that the off build never shows, so the grid floats between two blank bands. Spec 2.7 asks for exactly this, so it is not failed here; since production is grid-only until the model lands, the spec owner may want the off build to size the phone stage to the grid. The scrubber repeats the grid's 24 swatches on the same screen in grid mode; also per spec.
- At 1280 x 800 the switcher panel scrolls and its Close button sits below the panel's edge; Escape and light dismiss still close it.
- The footer promises "We reply on WhatsApp within one working day." with no WhatsApp number or link on the page.
- The hand-off's "6.8 KB gzip shared inline CSS" is not a budget breach: the 3 KB line covers the shade tokens and the page's selection rules (1,847 + 792 B gzip); the rest is layout, tokens and faces.
- Spec 14 item 6 says the wide grid circles are 58 px at 1280 x 800; measured 54 px.

## Iteration 2, 2026-10-09: FAIL

### How it was checked

- Screenshots read first: `family-blissful-blues-390x844.png`, `-1280x800.png`, `-1280x609.png`, `-900x600.png`, `family-frosty-whites-390x844.png` and `-1280x800.png`, `family-state-data-saver-390x844.png`, `site-404-390x844.png`, and the builder's mounted-landing shot (`scratchpad/fam2/shots/landing-poster-390.png`).
- Independent mirror (`scratchpad/famrev2`, own Astro and Vite caches, `wrangler dev` on 8796, stopped afterwards; the repo's `dist/`, `src/pages/index.astro` and the other workflows' servers untouched). Three builds:
  - `npm run build` (production default): 2 pages (`/` and `/404.html`), no `/shades/`, sitemap lists only `/`, robots.txt names it, the favicon set and manifest in `dist/`, CSP line 594 characters.
  - `PUBLIC_FAMILY_PAGES=on npm run build` (graded): 12 pages, CSP line 1,242 characters, 0 `/shades/` links in `index.html`.
  - `PUBLIC_FAMILY_3D=dev npm run build:test` with the builder's mirror-only mount patch (`scratchpad/fam2/mount-patch.sh`) for the state rows and the poster-path entry rows. A fourth build, production plus the mount, checked what the landing gets with the pages off (item 3).
- Tests: `npm run test:family` 47/47; `tests/unit` 48/48; `astro check` 0 errors, 0 warnings, 4 hints. `grid.spec.ts` on the graded build: 39/39 (2.9 min). On the dev build: `states.spec.ts` 9/9, and the four poster-path rows of `entry.spec.ts` 4/4, **in the mirror only**; the repo's landing does not mount the links.
- The reviewer's probe (`scratchpad/famrev2tools/probe.mjs`, `state-rest.mjs`):
  - Wide and short sizes on Blissful Blues and Earthy Browns: 900x600, 900x1000, 1024x600, 1024x768, 1280x609, 1280x800, 1366x657, 1440x700, 1536x753, 1920x1080 and 2560x1080 give 80 px circles at every size, no swatch box over `#hud`, `#finish`, `#reserve`, `#scrub` or the title, no horizontal scroll, and grid, HUD and name centred on the same x.
  - The phone layout on wide, short screens (1280x577, 1366x590, 1024x560): 66 px circles, no overlap (see notes).
  - Zero CSP violations on all ten pages at 390 and 1280, after a Next press.
  - The 404 at `/shades/blue/`: status 404, branded body, `noindex`; Poppins 700 at 40 and 72 px, Source Serif 4 400 at 17 and 18 px roman, Open Sans 600 button 48 px tall; Ember ring plus the Slate inner ring on focus; zero violations.
  - The sticky-bar swatch on Next: the new shade at once, one copy of the old shade fading by opacity over 600 ms; the other animations are transform only; 5 copies under 8 quick presses, 0 after 900 ms.
  - JSON-LD parses (Organization, BreadcrumbList). OG text tags present. Head script 1,451 B (833 B gzip), identical bytes on all ten pages.
- Lighthouse 13.5 mobile on `/shades/blissful-blues/`, **grid mode**: performance 100 (99 on a rerun, TBT 110 ms), accessibility 100, best practices 100, SEO 100. LCP 1.2 s, TBT 0 ms, CLS 0, 57 KiB.
- Grep guards: on the family sources, `404.astro`, the route, sitemap, robots, `scripts/site` and the built pages, no `box-shadow`, `backdrop-filter`, `gradient`, `blur(`, italic, em dash, `style=`, `standin`, TODO or placeholder. The only non-token gap is `column-gap: 0`.

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | Rule 12 (the pages' motion) and rule 24 (shades together outside the Wall: grid, scrubber, switcher, the landing's link grid) still wait on R5 and R2; spec 11 makes both a gate. Rules 46 and 47: still no terms or privacy page. Rule 15 is fixed (no off-scale gap; the wide widths are registered tokens). No violation of rules 1 to 11, 13, 14, 16 to 23, 25 to 45 or 48 to 50 in the family sources, the 404, the route or the built pages |
| A2 | PASS | Tokens only. Shades only in swatches, the sticky-bar swatch and its fading copy. Ember only on Reserve, the 404 button and focus rings. The 404 swatch is Mauve from the data (R7 still pending) |
| A3 | PASS | As in iteration 1. The 404 follows type-system role 16: `.h404` is the allowlisted digit, the serif sentence is 17 to 18 px roman, the button is Open Sans 600. The link-grid captions are Open Sans 600 at 13 px |
| A4 | PASS | No em dash, emoji or buzzword. The 404 strings are proposed copy, flagged for Sam |
| A5 | PASS | The real 24 swatches per family, 80 px on every wide size |
| B1 | PASS | 390 and 1280 for three families, plus the short-laptop sizes |
| B2 | PASS | No horizontal scroll from 360 to 2560; 44 px targets |
| B3, B4 | PASS | Unchanged |
| C1 | PASS | Head 833 B gzip. Page module 3,841 B gzip plus motion 176 B. `links.ts` 1,375 B plus track 132 B once mounted |
| C2 | PASS | No image in the off build; icons 3.5 to 18 KB |
| C3 | PASS | The sticky-bar swatch animates opacity only (measured with `getAnimations()`). No WebGL in the off build |
| C4 | PASS | Lighthouse mobile 100 (99 on a rerun), grid mode |
| D1, D2, D4 | PASS | Unchanged; R16 still pending Sam |
| D3 | FAIL | The data saver and slow-connection lines and their "Show in 3D" button render behind the fixed sticky bar at rest on every portrait phone (item 2) |
| E1, E2 | BLOCKED | `web-design-guidelines` and `visual-critique` are still not installed. The reviewer's own critique is in the notes |
| E3 | PASS | Unchanged. R8 (Ember ring at 2.0:1 on Pearl) is still pending |
| E4 | PASS | Writes no data |
| E5 | n/a | No database |
| G1 | PASS | Branded 404 for every unknown path. It links to `/`, because the Wall does not exist yet |
| G2 | PASS | Reserve in the sticky bar at 390 |
| G3, G4 | PASS | Ten unique titles and descriptions, plus the 404's own |
| G5 | FAIL | Open Graph text tags only. The default 1200 x 630 image is not designed yet (blocked on the asset) |
| G6 | PASS for these pages | `favicon.ico` (16, 32, 48), `icon.svg`, `apple-touch-icon` 180, 192, 512 and the manifest are served and linked from the family pages and the 404. The landing's head (Base.astro) belongs to the hero owner |
| G7, G8 | PASS | robots.txt names the sitemap (`Disallow: /` on staging). sitemap.xml lists `/` plus the ten pages whenever they are built |
| G9 | PASS | Unchanged |
| G10 | PASS | Swept 360 to 2560 including 1280x609, 1366x657 and 1024x600: no shrinking, no overlap |
| G11, G12 | PASS | Unchanged |
| G13, G14, G17, G20, G25 | n/a | As in iteration 1 |
| G15, G16 | FAIL | No privacy or terms page (blocked on the legal facts) |
| G18 | FAIL | No analytics (blocked on the PostHog key and the Web Analytics token) |
| G19, G24, G27 | PASS | Unchanged |
| G21 | PASS (gated) | `PUBLIC_FAMILY_PAGES` is off in the production build, so no page whose Reserve or "All 240 shades" link dead-ends can ship. In the graded build those two links still land on a hero-only landing. Re-grade when Reserve and the Wall exist |
| G22 | Pending | R9 |
| G23 | FAIL | No FAQ block (blocked on the copy) |
| G26 | FAIL | Organization (Hyderabad, email, Instagram `sameAs`) and BreadcrumbList on the family pages. No LocalBusiness and none on the landing (blocked: Base.astro and the footer belong to the hero owner and section 8) |
| H | FAIL | Every grid-mode row reproduces, but the data saver and 2G rows show their message off screen at rest (item 2) |
| F1 | FAIL | Acceptance 2 and 9 below |
| F2 | PASS | No TODO, placeholder or commented-out code |

### Acceptance criteria (run 1)

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | The graded build emits exactly the ten URLs. The sitemap lists all ten. `/shades/blue/` serves the branded 404 with status 404. 23 shades fails the build (unit test). The switcher works with JavaScript off, and neighbours come in catalog order. The Wall link's target is gated with G21 |
| 2 | FAIL | `src/pages/index.astro` does not mount `FamilyLinks`, and the port's section 2 has no gems. So on `/` nothing links to `/shades/` by click, tap, keyboard or poster grid. The graded build has 0 `/shades/` links on the landing. The family side is ready: with the two-line mount in the mirror, the four poster-path rows pass (visible grid at 390 and 1280, Tab order with the Ember ring, click with `family_open` from `rock_grid`, Back with and without the back-forward cache). The 3D rows fail at "the section 2 island does not place the link boxes" |
| 6 | PASS | `grid.spec.ts` type, placement, no-`style`, Reserve-link and deep-link rows pass on the graded build |
| 8 | PASS | Lighthouse 100 or 99 in grid mode. Head 833 B of 1.5 KB; module 3.8 KB of 12 KB |
| 9 | FAIL | All 9 rows of `states.spec.ts` pass and their screenshots are attached. But the data saver and 2G screenshots are taken scrolled. At rest the state line and "Show in 3D" sit behind the sticky bar: at 360x780 the button spans y 733 to 777 under a bar from 707; at 390x844, 797 to 841 under 771; at 375x667, 667 to 711 under 594; at 430x932 the line sits under the bar's top edge. Only 768x1024 shows it. Evidence: `screenshots/family-review-i2-state-data-saver-rest-390x844.png` |
| 10 | PASS | Slider keys, grid roving tabindex, live region, focus rings, AA text and grep guards, as in iteration 1; re-run in `grid.spec.ts` |

### Verdict: FAIL

1. **Mount the family links on the landing (acceptance 2, G21, F1; Sam's CLAUDE.md line 15: every gem links to its family page by click, tap and keyboard).** The family side is done and verified. The hero owner still has to do the three steps in spec section 13:
   - Step 1: add the two-line mount in `src/pages/index.astro`.
   - Step 2: in the section 2 island, call `installRockNav`, call `placeLinkBoxes` from the label frame, and call `offNav()` plus `clearLinkBoxes` in dispose and `toPoster`. This needs the gems in the port (`placeholderWall.ts` today).
   - Step 3: in the loader's skip path, handle `back_forward` or `#families`, and check for a lost context on `pageshow` with `persisted`.
   - Then add `?blockColors=` support and run every row of `tests/family/specs/entry.spec.ts` on a test build.

   Also ask Sam one product question. With the production default (`PUBLIC_FAMILY_PAGES` off), the mounted component renders nothing, so production gems link nowhere until Reserve and the Wall exist. Sam either accepts that or ships the pages in grid mode with Reserve landing on the hero.
2. **Show the state line on screen at rest on phones (acceptance 9, D3, H; spec 3: state lines "sit under the HUD"; spec 2.3: every control above the sticky bar).**
   - The problem: `#state` comes after `.fp-side` in the phone column, so the line and its "Show in 3D" button render under the finish control, behind the fixed bar. A data-saver visitor never sees why they get swatches, or the way to the 3D, unless they scroll.
   - The fix: on the phone layout, place `#state` directly under `#hud` (grid order or DOM order; keep the reading order HUD, state, scrubber, finish), or use the grid-mode stage's empty band.
   - Then retake `family-state-{data-saver,2g,slow-2g}-390x844.png` unscrolled. Add an assertion that `#state`'s box ends above `.bar`'s top at 360x780, 390x844, 430x932 and 375x667.
3. **Do not ship the link component's CSS and script when the pages are off (rule 12 via R14, C1).** A production build with the mount and `PUBLIC_FAMILY_PAGES` off renders no `nav#families`. But it still puts `@view-transition{navigation:auto}` on the landing and loads the `FamilyLinks` script chunk. Because `installFamilyLinks` never runs, the `pageswap` scope handler is never installed. Every same-origin link from the landing (privacy, terms, the 404's way back) then cross-fades, against R14, and 1.5 KB of dead JS loads. Gate the CSS and the script the way `Island3D` is gated: a build-time-folded conditional import, so an off build carries neither.
4. **Sam's written answers (A1 rules 12 and 24, 46 and 47 via G15 and G16; spec 11 gate).**
   - R1, R2, R3, R5, R7, R8, R9 and R11 to R16, then the CLAUDE.md and CHECKLIST.md amendments.
   - His yes on the 404 copy: "404. This shade does not exist." / "These 240 do." / "Back to skreed.in".
   - Not a code change.
5. **Site essentials still blocked on inputs (G5, G15, G16, G18, G23, G26).**
   - G5: the default OG image (a designed asset).
   - G15, G16: privacy and terms (the legal facts).
   - G18: analytics (the PostHog key and the Web Analytics token).
   - G23: the five FAQ answers.
   - G26: LocalBusiness and the landing's JSON-LD and icon links (hero owner and section 8).
   - Schedule the site-essentials pass before launch. These cannot pass from the family pages alone.
6. **E1 and E2 stay BLOCKED.** Install `web-design-guidelines` and the `visual-critique` plugin where the loop runs (CLAUDE.md day-1 items 2 and 3), or have Sam accept the hand-applied pass.

### Notes (not graded as FAIL)

- **Visual critique at 390 (folded in for E2).** The page is calm and on brand. One title, the 24 circles, the name, the controls, and Reserve always in reach. The grid still floats in a 450 px stage sized for the 3D lineup, with about 100 px of empty Pearl above and below (iteration 1 note); item 2's state line could use that space. At 1280 the circles carry their names and the controls sit under the grid; the page reads as a swatch book, which suits grid mode.
- **Very wide screens.** At 2560x1080 the finish control and Reserve sit at the far right edge, about 850 px from the HUD they belong to (720 px from the scrubber) (`family-review-i2-blissful-blues-2560x1080.png`). This follows spec 2.4 ("at the right end of the band"). If the spec owner revisits it, capping `.fp-ctl` at a max width would keep the group together.
- **Wide but short screens below 600 px tall** (1280x577: a 1280x720 laptop with a bookmarks bar; 1366x590; 1024x560) get the phone layout, as spec 2.8 defines. The result is 66 px circles without names, a sticky bar, and the name line resting on the bar with the meta, scrubber and finish below the fold (`family-review-i2-blissful-blues-1280x577.png`). Nothing overlaps and the page scrolls. Now that grid mode's wide layout flows and scrolls, the 600 px height floor could apply to 3D mode only. Spec owner's call.
- The 404 carries `noindex` and a canonical to `/404.html`. That is harmless, but a noindex page needs no canonical.
- The production build still emits the `FamilyPage` script chunk into `_astro/` with no page referencing it (Astro bundles the scripts of imported components). It is never downloaded.
- Builder open issue 6 (the state line under the finish) is graded as item 2 above. Iteration 1 missed it.

## Iteration 3, 2026-10-09: FAIL

### How it was checked

- Screenshots read first: `family-blissful-blues-390x844.png` and `-1280x800.png`, the retaken `family-state-data-saver-390x844.png`, `family-state-data-saver-rest-{360x780,375x667}.png` and `family-state-3d-slow-390x844.png`.
- Independent mirror (`scratchpad/famrev3`, own Astro and Vite caches, `wrangler dev` on 8797, stopped afterwards). The repo's `dist/`, `src/pages/index.astro` and the other workflows' servers were not touched. The step 1 mount was applied in the mirror only, with `scratchpad/fam2/mount-patch.sh`. Four builds:
  - `npm run build` plus the mount (production): 2 pages, CSP line 594 characters. `index.html` has 0 `nav#families`, 0 `@view-transition` and 0 `/shades/` links. `_astro/` has no FamilyLinks chunk, only the unreferenced `FamilyPage` chunk noted in iteration 2. The sitemap lists 1 URL.
  - `PUBLIC_FAMILY_PAGES=on npm run build` plus the mount: 12 pages, CSP line 1,242 characters. The nav, the 10 links and both `@view-transition` rules are inline. The `FamilyLinksNav` chunk (2,726 B, 1,378 B gzip) is referenced. The sitemap lists 11 URLs.
  - `PUBLIC_FAMILY_PAGES=on npm run build` (graded, no mount): `grid.spec.ts` 39/39 (2.0 min).
  - `PUBLIC_FAMILY_3D=dev npm run build:test` plus the mount: `states.spec.ts` 22/22 (1.6 min). `entry.spec.ts`: the 4 poster-path rows pass. The 6 3D rows fail at "the section 2 island does not place the link boxes".
- `npm run test:family` 48/48. `tests/unit` 48/48 (run read-only in the repo, because the mirror leaves out `prototypes/`). `astro check`: 0 errors, 0 warnings, 4 hints.
- Lighthouse 13.5 mobile on `/shades/blissful-blues/`, **grid mode**: performance 100, accessibility 100, best practices 100, SEO 100. LCP 1.5 s, TBT 0 ms, CLS 0, 57 KiB.
- The reviewer's probes (`scratchpad/famrev3tools/probe3.mjs`, `cls3.mjs`, `firstpaint.mjs`, `slow3d.mjs`), all on the dev build:
  - A data saver sweep at 12 sizes.
  - Layout shifts at load for every grid-mode row, at 390x844, 1280x800, 1366x768 and 1920x1080, unthrottled and on a 3G profile, with the same rows repeated on the graded build.
  - The first paint of grid mode with the page module held back.
  - "Show in 3D" by keyboard.
  - The 3D slow line at 1280x800 and 375x667.
- Grep: no em or en dash, `box-shadow`, `backdrop-filter`, `gradient`, `blur(` or italic in the family sources, the spec or `states.spec.ts`. No `style=` and no `standin` in `dist/`. No TODO or placeholder. The page module is 3,841 B gzip, unchanged.

### Iteration 2 items, re-checked

- **Item 2 (state line behind the bar): fixed at the sizes it named.**
  - `#state` follows `#hud` in the DOM and on screen at every size.
  - In my sweep, unscrolled, "Show in 3D" is the element under its own centre and ends above the bar:

    | Size | Button y | Bar top |
    |---|---|---|
    | 360x640 | 467 to 511 | 567 |
    | 412x915 | 675 to 719 | 842 |
    | 768x1024 | 743 to 787 | 951 |
    | 820x1180 | 745 to 789 | 1107 |

  - The grid circles stay 44 px or larger, and there is no horizontal scroll at any size.
  - At 360x640 the finish row sits under the bar, as it does at rest there (stage 320 px, 2.3).
  - In landscape (844x390, 667x375) the line sits below the fold together with the whole HUD, as 2.8 defines.
  - On the wide layout the line takes the row under the HUD, centred with it. At 1280x800 this pushes the scrubber to y 806 to 850, below the fold, which the in-flow layout allows.
- **Item 3 (link CSS and script with the pages off): fixed.** See the production build above. The unit test guards the source shape.

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | Unchanged: rule 12 (R5) and rule 24 (R2) wait on Sam, and rules 46 and 47 have no terms or privacy page. The iteration 3 diff adds no motion, colour, face, shadow, gradient or copy. No violation of rules 1 to 11, 13 to 23, 25 to 45 or 48 to 50 |
| A2, A3, A4, A5 | PASS | The state line is Open Sans 400 14 px with a 600 lead word, in `--fg` on the neutral. Letter spacing is normal (measured). No new colour |
| B1 | PASS | 390 and 1280 for three families, plus the state shots |
| B2 | PASS | No horizontal scroll at the 12 data-saver sizes. "Show in 3D" is 100 x 44 |
| B3, B4 | PASS | Unchanged. The new rule uses `100svh` in a `min-height` and animates nothing |
| C1 | PASS | Page module 3,841 B gzip. `FamilyLinksNav` 1,378 B gzip, loaded only when the pages are on |
| C2, C3 | PASS | Unchanged. The stage resize is not animated |
| C4 | PASS | Lighthouse mobile 100, grid mode, on the graded build |
| D1, D2, D4 | PASS | Unchanged. R16 is still pending Sam |
| D3 | FAIL | On a 3D build, grid mode is not grid mode at first paint (item 2) |
| E1, E2 | BLOCKED | `web-design-guidelines` and `visual-critique` are still not installed. The reviewer's critique is in the notes |
| E3 | PASS | Reading order: HUD, state line ("Show in 3D"), scrubber, finish. Focus visible. See the note on focus after "Show in 3D" |
| E4 | PASS | Writes no data |
| E5 | n/a | No database |
| G1, G2, G3, G4, G6, G7, G8, G9, G10, G11, G12 | PASS | Unchanged from iteration 2 |
| G5, G15, G16, G18, G23, G26 | FAIL | Each is still blocked on its input (iteration 2, item 5) |
| G13, G14, G17, G20, G25 | n/a | As before |
| G19, G24, G27 | PASS | Unchanged |
| G21 | PASS (gated) | Production builds no `/shades/` page and, with the mount, renders and loads nothing |
| G22 | Pending | R9 |
| H | FAIL | Every grid-mode row reaches its designed end state. But the slow-connection row moves the controls after first paint, and so does every grid-mode row on the wide layout of a 3D build (item 2). H asks for no layout shift on slow networks, and acceptance 9 applies H by analogy |
| F1 | FAIL | Acceptance 2 below |
| F2 | PASS | No TODO, placeholder or commented-out code |

### Acceptance criteria (run 1)

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | Unchanged: ten URLs, the sitemap, the branded 404 and the 23-shade build failure |
| 2 | FAIL | `src/pages/index.astro` still does not mount `FamilyLinks`, and the port's section 2 is still `section2/placeholderWall.ts` with no gems. The repo's landing has 0 links to `/shades/`. In the mirror with the mount, the poster-path rows pass 4/4 and the 3D rows fail 6/6 at "the section 2 island does not place the link boxes" |
| 6 | PASS | `grid.spec.ts` on the graded build |
| 8 | PASS | Lighthouse 100, grid mode. Head 833 B and module 3.8 KB gzip, within budget |
| 9 | PASS | `states.spec.ts` 22/22 on the dev build. Every grid-mode row shows the right mode and line, has no island request and zero CSP violations, and its screenshot is attached unscrolled. Its first paint is graded under D3 and H (item 2) |
| 10 | PASS | `grid.spec.ts` accessibility rows. Guards clean |

### Verdict: FAIL

1. **Mount the family links on the landing (acceptance 2, G21, F1; CLAUDE.md: every gem links to its family page by click, tap and keyboard).** Nothing has changed since iteration 2, item 1. The hero owner's three steps in spec section 13 are still to do:
   - The two-line mount in `src/pages/index.astro`.
   - The gems in the port's section 2, with `installRockNav`, `placeLinkBoxes`, `offNav()` and `clearLinkBoxes`.
   - The loader's return path and the lost-context check on `pageshow`.

   Then add `?blockColors=` and run all 10 rows of `entry.spec.ts`. The family side is verified: the poster rows pass with the gated component. Sam's product question still stands: production gems link nowhere while `PUBLIC_FAMILY_PAGES` is off.
2. **Make grid mode right at first paint on a 3D build (D3, H, spec 2.7 and 5 "First paint").** The head script sets `html.grid` and `data-why` before first paint. The rest of grid mode arrives only when the page module runs.
   - **Wide layout.** The grid sits under "The whole family." until `page.ts` moves it into the stage. Until then the grid-mode stage (`height: auto`) is 0 px tall, so the HUD, scrubber, finish and Reserve sit right under the title. When the module runs they jump 449 px down (`.fp-ctl` from y 213 to 662). Measured CLS on Blissful Blues:

     | Size | Reduced motion, no WebGL2, `deviceMemory` 2 | Data saver |
     |---|---|---|
     | 1280x800 | 0.257 | 0.289 |
     | 1366x768 | 0.237 | 0.267 |
     | 1920x1080 | 0.188 | 0.211 |

     The same rows on the off build score 0.000 to 0.001. 0.25 and above is "poor", and reduced motion and no WebGL2 are common on laptops. Evidence: `screenshots/family-review-i3-grid-firstpaint-1280x800.png`, taken with the module held back.
   - **Phone layout.** The stage is a blank 450 px box until the grid pops in (`family-review-i3-grid-firstpaint-390x844.png`). Then the data saver and 2G lines, which the module writes after first paint, shrink the stage. The HUD, scrubber and finish jump 81 px up (`.fp-ctl` from y 564 to 483). That is CLS 0.032 at 390x844 on a throttled 2G profile, arriving 1.2 s after first paint, in the very row the line exists for, and while the visitor may be reaching for Prev, Next or the scrubber.
   - **Change.**
     - (a) Put the grid in the stage in the HTML on every build, as the off build does. The existing `html.m3d .fp-stage > .sgrid { display: none }` hides it in 3D mode. Move it under "The whole family." only on the 3D path, where that section is below the fold. Alternatively, render a second copy and show one per mode in CSS: `display: none` keeps the hidden copy out of the tab order and the accessibility tree.
     - (b) Render the data saver and slow-connection lines in the HTML: static copy, with `page.ts` wiring the button. On `has3d` builds, show them in CSS under `html[data-why="savedata"]` and `html[data-why="slow"]`, so the stage gives up the line's height from the first frame.
     - Then add a Playwright row that delays the page module by 1 s and asserts a layout-shift total under 0.01 for every grid-mode row, at 390x844 and 1280x800, on the dev build.
   - **Scope.** Production today (`FAMILY_3D` off) is not affected. Every 3D build is, and run 1 grades the grid-mode rows on that build.
3. **Sam's written answers (A1 rules 12, 24, 46 and 47; spec 11 gate).** Still open: R1, R2, R3, R5, R7, R8, R9 and R11 to R16, then the CLAUDE.md and CHECKLIST.md amendments. Also his yes on the 404 copy. Not a code change.
4. **Site essentials blocked on inputs (G5, G15, G16, G18, G23, G26).** Still blocked: the OG image, the legal facts, the PostHog key and Web Analytics token, the FAQ answers, and Base.astro and the footer (hero owner and section 8). Schedule the site-essentials pass before launch.
5. **E1 and E2 stay BLOCKED.** Install `web-design-guidelines` and the `visual-critique` plugin where the loop runs, or have Sam accept the hand-applied pass.

### Notes (not graded as FAIL)

- **Visual critique at 390 (folded in for E2).** With data saver the page reads well. The line explains the swatches in one sentence, and "Show in 3D" sits where the eye goes after the shade name. The stage keeps a band of empty Pearl above and below the grid, smaller than in iteration 2. At 375x667 the grid tucks under the h1 with little air (builder note 6). It still reads, and nothing overlaps.
- **Focus after "Show in 3D".** Activating it removes the button, so focus falls to `body`. Chrome then tabs on to the scrubber, because it keeps the sequential focus starting point. Other engines may restart from the top. Moving focus to the stage or the scrubber when the line clears would make this robust.
- **Run 2, the 3D slow line.** At 375x667 the stage keeps its 320 px floor, so the scrubber moves from 528-572 to 559-603, under the bar at 594 (at rest only the finish row is under it). At 390x844 the HUD moves 29 px up when the line shows and back when it clears (builder note 6). Both belong to the 3D grading in run 2. A line that arrives after 8 s cannot be reserved at first paint, so run 2 should decide whether that line may move the HUD or should take space elsewhere.
- **Rule 15, minor.** The new phone rule subtracts a raw `72px` for the bar height, the same value `scroll-padding-bottom` already uses. Registering it as a component dimension (for example `--bar-h`) would keep the two in step. The unit test covers gaps only.
- **Spec edits by the builder.** Section 3 (state lines) and section 13 (step 1) were amended to match the code. Both are consistent with the iteration 2 fix list.

## Round 4, iteration 1, 2026-10-26: FAIL

Round 4 is "Back to main page" on the argument screen (`family-page.md` section 22: criteria 1 to 6, D1 to D7, E-F5 and the builder's Built, Checked and Not done), with section 13 step 3, the landing's return path, which this build carries. Branch `family/back-to-families`: three commits on 24564a3 (93772c6, 3163b36, 3bbcb7a), 23 files.

### How it was checked

- Frames read first, before any code: `screenshots/family-r4-390-arg-before.jpg` and `-after.jpg`, `family-r4-1280-arg-before.jpg` and `-after.jpg`, `family-r4-390-landing-after-press.jpg` and `family-r4-1280-landing-after-press.jpg`. They are the owner's, taken in a Chromium pane with a hardware GPU against the branch's staging build under `wrangler` on 127.0.0.1:8791. They are JPEG, not the PNG the spec names. The 390 frames are 488 x 1055 (scale 1.25) and the 1280 frames 800 x 500 (scale 0.625). The family is a blue one, by eye Blissful Blue.
- The owner's live measurements in that pane are used as evidence, under the criteria they support: the control's box, type and colour at both sizes; `#toTop`, `#famBtn` and `#arg-box`; `scrollWidth`; the `back()` hook through arrival, exit and re-arrival; and the press at both sizes, with `html.className`, `__skreedDead`, the loader's state, the network and the console.
- The diff (`git diff claude/youthful-planck-objwf5...HEAD`): `src/` and the tests read in full; the docs read where they make claims (CLAUDE.md, DESIGN.md, CHECKLIST.md G21, HANDOFF.md, hero-architecture.md 4.3, hero.md 12.7 and the spec).
- The code around it, read: `src/scripts/boot.ts` (the rejection guard), `src/scripts/family/rock-links.ts` and `links.ts` (the transition scope and the poster path's return), `src/scripts/shell/to-top.ts` (Back to top's way home), `src/scripts/hero/section2/gems.ts` (the gems' `ready`) and `src/components/shell/Loader.astro` (what the veil hides).
- Tests, run by the reviewer: `test:family` 58 of 58 pass; `test:unit` 187, with 186 passing and 1 skipped. The worktree was unchanged afterwards.
- The builder's staging `dist/`, read only:
  - one `a#famBack` in each of the ten family pages and none in `index.html`;
  - it is the body's last element, after `a#toTop`;
  - the page module is 16,866 B, 7,138 B gzip (level 9), as the hand-off says;
  - the landing's `@view-transition` rules are inline in its `<head>`.
- Contrast, the reviewer's estimate. Pearl Whisper against the pixels of the control's box in the four argument frames, decoded with `jpeg-js` from the repository's `node_modules`: the whole box at 2.3 s, and the bands above and below the glyphs at 3 s. Median background luminance 0.0000 to 0.0023, brightest pixel 0.0006 to 0.0052: 17.6:1 to 19.4:1. That is one family and one frame per size, from JPEGs.
- Grep of every added line: no em or en dash, emoji, TODO, FIXME or lorem.
- Not done: no Playwright browser exists here and none was installed, so `tests/family/specs/back.spec.ts` did not run. No Lighthouse. `/web-design-guidelines` and `visual-critique` are not installed.

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | The diff against rules 1 to 50. One violation, rule 15: `.fam-back`'s `bottom: calc(14px + ...)` (family.css line 77) repeats Back to top's raw 14 px (to-top.css line 24), a value off the spacing scale now kept in two places. Rule 12's visible-at-rest clause: the 2.5 s wait and the fades are E-F5 (Sam, 2026-10-26), recorded in CLAUDE.md. Rule 7 for the light families is unmeasured (E3). Nothing else: no colour but Pearl Whisper (24, 49, 50); Open Sans 600 (4, 18, 19, 30); no shadow, border, fill, gradient, blur or radius (1, 2, 5, 6, 20, 21, 25, 28, 31, 39, 42, 43); no icon or arrow (10, 22, 44, 45); no opacity on hover (14); hover and press on the link only (48); copy with no dash, emoji or buzzword (3, 16, 17, 27, 29, 35); the case on screen (38). Site level, outside the diff: no terms or privacy page in `dist/` (46, 47) |
| A2 | PASS | `--pearl-whisper` only; the veil is the loader's `--night` (E-A2) |
| A3 | PASS | Measured: Open Sans 600, 14 px, no italic. `line-height: 1` is in the rule, not measured |
| A4 | PASS | "Back to main page", Sam's words in sentence case; no dash, emoji or buzzword (the copy test). Pending his word in the frames (spec 12 item 6) |
| A5 | PASS | The argument screen shows the case; the control adds no stand-in |
| B1 | FAIL | Frames exist at both widths for the argument screen and the press, but they are the owner's JPEGs from a pane, not Playwright's PNGs. `family-r4-{390,1280}-landing-3d` cannot exist while the 3D landing falls to the poster (item 1) |
| B2 | PASS | At 390 x 844: `scrollWidth` 390; the box at x 121.1 to 269.4, 121 px inside both edges; 148.3 x 44 px. Other sizes: criterion 3 |
| B3 | PASS | A same-origin link (`/#families`); no storage in the diff |
| B4 | PASS | Nothing in the diff uses or animates `svh` or `dvh`; the offsets are tokens and `env()`. See the iPhone note |
| C1 | PASS | Page module 7,138 B gzip, measured in `dist/`. Before it was 6,719 B (the builder's figure), so +419 B of the 1,000 B allowed. Total JS on the page 168,972 B of 250,000 B |
| C2 | n/a | No image |
| C3 | PASS | The fade is opacity alone, by the Web Animations API; `.press` owns the transform; the C3 guard (`data.test.ts`) passes; the veil lifts by the loader's existing fade |
| C4 | FAIL | Lighthouse was not run on either page this round. E-C4 is still pending for the hero |
| D1 | PASS | The 2.5 s wait is E-F5. The landing's veil is the 3D path's loader (E-H1); its look is pending Sam (spec 12 item 10) |
| D2 | PASS | By source and unit test: `backFade(dir, true)` is `null`; `reduced()` is read at each show and hide; the default reduced-motion tier is grid mode, where the control is `display: none`; the landing's `@view-transition` is `none` under reduced motion. Criterion 6's browser row did not run |
| D3 | FAIL | The "Pressed" row of section 22's states table (the landing at section 2) fails on the 3D path, because a skipped cross-fade is handled as a hard failure (item 1). Back to top's way home now ends on section 2 when the back-forward cache misses (item 2) |
| D4 | PASS | `.press` on the link only: `translateY(-1px)` on hover, `scale(0.98)` on press, no opacity |
| E1 | BLOCKED | `/web-design-guidelines` is not installed here. Recorded as blocked, never PASS |
| E2 | BLOCKED | `visual-critique` is not installed. The reviewer's critique of the 390 frame is in the notes |
| E3 | FAIL | It is a real link named by its text, `hidden` (out of the tab order and the tree) until shown, with the two-tone ring from `.ring2`. Not proven: the contrast that criterion 6 asks for (Frosty White, Mellow Yellow and Blissful Blue, both sizes, median of 10 frames at 2.9 s, written in this log). The reviewer's estimate covers Blissful Blue only (17.6:1 to 19.4:1, single JPEG frames); the light families' smoke is the risk the spec names. The keyboard rows did not run |
| E4 | PASS | Writes no data; `family_back` is a local `skreed:track` event |
| E5 | n/a | No database |
| G1, G3, G4, G6, G7, G8 | PASS | Not touched by this round. `dist/` has the branded 404, unique titles and descriptions, the icon set and manifest, `robots.txt` and `sitemap.xml` |
| G2, G11 | n/a | E-G2 for the landing; the family pages have had no Reserve since round 3 (Sam, 2026-10-15) |
| G5, G15, G16, G18, G19, G23, G24, G26 | FAIL | Not touched by this round and still missing in `dist/`: no `og:image`; no privacy or terms page; no PostHog or Web Analytics; no visible contact line or reply promise on either page (the email is only in the family pages' Organization JSON-LD); no FAQ; no LocalBusiness JSON-LD |
| G9, G12 | PASS | This round adds no image and loads no data |
| G10 | FAIL | The control was measured at 390 and 1280 only (criterion 3, item 4) |
| G13, G14, G17, G20, G22, G25 | n/a | No form, thanks state, cookies, cutover or founders' note here; breadcrumbs n/a on the teaser (R9) |
| G21 | FAIL | The link exists and goes to `/#families`. But the line this round added to G21 says it "links back to the landing's section 2", and on the 3D path, the only place the control exists, the press lands on the poster page instead (item 1). The poster page's family grid is not a dead end, but the gems, the quiz's fog and section 4 in 3D are gone for the rest of the visit |
| G27 | PASS | Nothing fabricated |
| H | FAIL | As D3: the "Pressed" row on the 3D path, and Back to top on a cache miss. H1: the landing's veil is the 3D path's loader under E-H1 |
| F1 | FAIL | Criteria 3, 5 and 6 and section 13 step 3 below |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the added lines |

### Acceptance criteria (round 4, section 22)

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | `back.test.ts` reads the route: one element with its classes, `href`, `hidden` and copy id, directly after `<BackToTop page="family" />`, the body's last, and only under `has3d` (`mode !== 'off'`). The copy test runs "Back to main page". In `dist/`: exactly one on each of the ten pages, after `a#toTop` and last in the body; none on `/`. Its name is its text (no `aria-label`). Shown, at both sizes, the owner measured: Open Sans 600 14 px, Pearl Whisper, no underline, transparent, no border, no shadow, 44 px tall. No off build was made here; the condition folds at build time |
| 2 | PASS | `backTimer` by unit test: off at 5.6 screens and on above; `show` false at 2,499 ms and true at 2,500; the cancel; the re-arrival; `dueMs`. Seen live by the owner at 390 x 844 through the `back()` hook: `since` set on arrival; `shown` true after 2.5 s; `since` null and `hidden` on the way up to 5.5 screens; a new 2.5 s on the way back down; opacity 1 at 3 s. The frames agree at both sizes: no control at 2.3 s, the control at 3 s. The held-clock rows are by source only, because `back.spec.ts` did not run: opacity 1 by 2.9 s; the 1.0 s, 2.0 s and 4.5 s sequence; `hidden` 200 ms after the exit |
| 3 | FAIL | Measured by the owner at two of the eight sizes. At 390 x 844: hit row y 734 to 778, centre x 195.2; clear of `#toTop` (y 786 to 830) and `#arg-box` (y 390.3 to 453.7); 121 px inside both edges; `scrollWidth` 390. At 1280 x 800: y 711.2 to 755.2, centre x 632.4 (see the notes); clear of `#famBtn`, `#toTop` and `#arg-box` (y 297.3 to 502.8). Unmeasured: 360 x 780, 375 x 667, 430 x 932, 768 x 1024, 844 x 390 and 900 x 600 (item 4) |
| 4 | PASS | By source and unit test. Outside 3D mode `backTimer` gets 0 screens and never drops `hidden`. `html:not(.m3d) .fam-back` is `display: none`, and `[hidden]` is `display: none !important`, so the control is never focusable and never in the tree. Without JavaScript the `hidden` markup stays. `fam:grid` calls `backReset()`, which sets `hidden` at once. The grid rows of `back.spec.ts` did not run |
| 5 | FAIL | A real click went to `http://127.0.0.1:8791/#families` at both sizes. By source and unit test: one `family_back {from: 'argument'}`, dispatched synchronously in the click listener; no `preventDefault`; no `family_open` (the switcher's listener matches `/shades/` only); a real link for the modified click; `.press` for hover and press. **The landing on the 3D path fails: it falls to the poster tier (item 1).** The poster path proper (the Gate's poster tier) was not tried. The fallen landing shows the families in view with no loader, but at 1280 the row lies under the wordmark and Back to top (item 5). The browser rows did not run |
| 6 | FAIL | The contrast row is not met. It asks for medians for three families at both sizes, written in this log. There is only the reviewer's single-frame estimate for Blissful Blue (17.6:1 to 19.4:1), and nothing for Frosty White or Mellow Yellow (item 3). The rest holds by source and unit test: it is the body's last element after `a#toTop` (`dist/`); the `.ring2` ring; no script moves focus or writes `#live`; no Escape handler; the `arg` beat's heading comes earlier in the DOM; opacity only, by the Web Animations API; the C3 guard; `backFade(dir, true)` is `null` and `reduced()` is read live. The keyboard and reduced-motion rows did not run |
| 13, step 3 | FAIL | Never ran in a browser: the landing falls to the poster before the hero chunk loads (item 1). Read from the files: the veil hides `.ld-w` (the whole wordmark, its fill, band and outline) and `#ldPct`; no exit is scheduled at `FULL`; the snap to `S2T.LAND` at step 18; the lift through `skip()` once frame2 and the gems are in. On a back-forward cache restore with a lost context it goes to the poster, not the rebuild that 13 asks for, because boot.ts handles every lost context that way (recorded in Built). Back to top regresses on a cache miss (item 2) |

### Verdict: FAIL

1. **Keep the landing on the 3D path when the cross-fade into it is skipped (criterion 5, G21, D3, H, F1; section 13 step 3).**
   - **What happens.** The press follows the link, and the browser's root cross-fade into `/#families` is skipped. The inbound transition's `ready` promise rejects with `AbortError: Transition was skipped` and nothing handles it, so it reaches `src/scripts/boot.ts` line 75. That `onRejection` treats every unhandled rejection before the hero starts as fatal and calls `toPoster`, which is terminal for the visit.
   - **What the owner saw.** At both sizes, twice in the console, and again on a plain navigation to `/#families` from another page of the same build: `html` "js poster", `__skreedDead` true, the hero chunk never fetched, and the loader done with `ready` false. So step 3 never runs (no veil, no snap, no lift). The visitor gets the poster page's family links, and the gems, the quiz's fog and section 4 in 3D are gone for the visit.
   - **Where it fails.** Criterion 5's 3D row; G21's new sentence ("links back to the landing's section 2"); and D3 and H, because a skipped cross-fade, an ordinary browser outcome, is handled as a hard failure.
   - **What skips it.** Nothing in the repository:
     - the one `skipTransition()` (`rock-links.ts` line 183) runs in the landing's own `pageswap`, for links leaving it;
     - both pages opt in from inline `<head>` rules;
     - nothing starts a second transition.

     So the skip is the browser's own. Chromium gives this same AbortError when, for example, the document is hidden during the reveal, so it can happen on any phone. The fix is to absorb it, in two lines:
     - `src/scripts/boot.ts` line 75: return early from `onRejection` when `e.reason` is a `DOMException` named `AbortError`, so only the island's own failures send the 3D path to the poster.
     - The landing's Gate (`src/inline/gate.inline.js`, inline in its head): a `pagereveal` listener that, when the event has a `viewTransition`, attaches `.catch(() => {})` to its `ready` and `finished`. A skipped cross-fade then never becomes an unhandled rejection.
   - **Then.** Press the control again at 390 x 844 and 1280 x 800 on the staging build. Record the veil, the snap to 14.5 screens and `nav#families[data-placed]`, and take `family-r4-{390,1280}-landing-3d`.
   - **Also covered.** The same guard sits under the family page's wordmark link to `/` and under Back to top when the cache misses; this change covers them too.
2. **Do not send Back to top's way home to section 2 (D3, H; section 13 step 3; read from the files, not run).**
   - **The cause.** `RET` (`loader.inline.js` line 12) and `ret` (`hero.ts` line 65) are true for every `back_forward` entry. On a family page, Back to top traverses back to `/`. When the back-forward cache misses, it relies on "a fresh load starts at the top anyway (loader.inline.js)" (`to-top.ts` lines 90 to 92).
   - **The result.** With this build that fresh load is the night veil lifting onto section 2. Take a visitor who goes from the quiz's "See it on the case" to a family page and presses Back to top: before this round the landing came up at section 1, and now it comes up at the gems.
   - **Change.**
     - In `loader.inline.js`, set `RET` false and scroll to 0 when sessionStorage's `skreed:to-top` is `'1'` (read inside a try, as `to-top.ts` does).
     - In `hero.ts`, take the loader's decision (`#intro.ret`) instead of calling `isReturnVisit()` again after `to-top.ts` has cleared the flag.
     - Assert both in `return-path.test.ts`.
3. **Measure the words' contrast for the three families criterion 6 names (E3, criterion 6, A1 rule 7).** Frosty White (Snow), Mellow Yellow (Sunbeam) and Blissful Blue (Sky), at 390 x 844 and 1280 x 800, at 2.9 s, the median of 10 frames each. Write the six figures in this log. `back.spec.ts` already has the row. A median under 4.5:1 keeps E3 failing.
4. **Run `back.spec.ts` on a machine with Playwright's Chromium and attach its frames (criterion 3, B1, G10).** Use the `PUBLIC_FAMILY_3D=on npm run build:test` build. It should cover:
   - the boxes at criterion 3's eight sizes (844 x 390 is the one where the letters' box and the control share the least height);
   - the held-clock rows of criteria 2 and 6 and the grid rows of criterion 4;
   - the four frames as PNG, with `-landing-3d` once item 1 is in.
5. **Centre the families on a return visit that falls to the poster (criterion 5's poster row, D3).**
   - **What the frame shows.** In the 1280 landing frame, Frosty White's circle sits on the wordmark and Roaring Red's under Back to top, with the quiz's intro below.
   - **The cause.** `links.ts` line 12 skips its centring while `html.hero3d` is set. `toPoster`'s scroll keep (`boot.ts` lines 43 to 45) then leaves `nav#families` at the top edge, under the fixed corners.
   - **Change.** In `toPoster`, when `location.hash === '#families'`, scroll `nav#families` to the centre (`scrollIntoView({ block: 'center', behavior: 'instant' })`, as `links.ts` does) instead of keeping the offset.
   - **After item 1,** this is only the late-failure case: a lost context, or a failed import or data fetch.
6. **Run Lighthouse mobile (C4)** on a family page of the 3D build and on `/#families`, and paste the numbers here.
7. **Rule 15 (A1).** Register Back to top's 14 px bottom offset as one token, used by `to-top.css` line 24 and by `.fam-back` (family.css line 77), and list it among DESIGN.md's component dimensions.
8. **E1 and E2 stay BLOCKED.** Install `/web-design-guidelines` and `visual-critique` where the loop runs, or have Sam accept the hand-applied pass.
9. **Site essentials, carried and not this round's (A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26).** Still missing in `dist/`:
   - `og:image`;
   - the privacy and terms pages;
   - analytics;
   - a visible contact line with the reply promise;
   - the FAQ;
   - LocalBusiness JSON-LD.

   They belong to the site-essentials pass.

### Notes (not graded as FAIL)

- **Visual critique at 390 (folded in for E2).**
  - **Before.** The round 3 argument screen as built: the letters partly under the case, then a dark band of about 280 px down to Back to top.
  - **After.** "Back to main page" sits low in that band, centred, with Back to top 8 px under it at the right. It reads as calm chrome, the size and weight of "All families", and is clearly legible on this family.
  - **Two weaknesses.**
    - The two bottom controls do not line up. One is centred and one is right-aligned with its icon, 8 px apart, so they read as a crowded pair rather than a deliberate ending. The new one also sits far nearer Back to top than the letters it follows.
    - Both say "Back to" and both lead to the landing (on a family page, Back to top steps back to the landing's top). A visitor sees two ways back with different words and no difference they can guess.

    Both belong to D1, which is pending Sam's word on the words and the place.
  - **At 1280,** the control stands alone at the bottom centre, Back to top sits at the top right, and nothing competes.
- **An interrupted arrival flashes.** If the visitor scrolls up during the 400 ms fade in, `backHide()` cancels it and starts the exit from opacity 1 (`page.ts` lines 278 to 284), so the words jump to full before fading. Starting the exit from the current computed opacity fixes it. No checklist line fails on it.
- **Spec 13 step 3's condition.** `isReturnVisit()` is true for every `back_forward` entry. So a Back from any page on a cache miss (a future privacy or terms page, or Instagram) also comes up at section 2 under the veil, with the igloo shot skipped. That is the spec's own test, and the spec owner may want `#families` alone, which the gems' click already leaves behind (`followRock`). Item 2 covers Back to top only.
- **iPhone.**
  - `onScroll` divides by `innerHeight` while the screens are `100svh` (section 22, "Not checked"). With Safari's toolbar collapsed, the last scroll position may stay under 5.6 screens, so the argument screen and this control would never come on there, and G21 on iPhones depends on it.
  - This is older than this round. A check in Safari settles it.
- **Criterion 3 at 1280.** The centre was measured at x 632.4: the centre of the 1265 px layout viewport beside the pane's 15 px classic scrollbar, where the letters' box (80% of the same width) is centred too. The criterion's "x 640" holds only with overlay scrollbars, as in Playwright. This is graded as meeting the intent; the criterion should say "the layout viewport's centre".
- **Step 3 is still untested in a browser.** Once item 1 is in, step 3 runs for the first time. Two things are still read from the files only: the race between frame2 and the gems' build (`hero.ts` lines 211 to 222), and Chrome's fragment anchor after `scrollTo`.
- **Whether the fall predates this round is unknown.**
  - The owner's baseline on the default build (8790) was a fresh `/#families` arrival, which has no transition.
  - A transition into the landing on the default build (the family page's wordmark link to `/`) was not tried.
  - So it is not known whether the guard already dropped those visits to the poster before this round. Item 1 covers both cases.
- **The frames.** The "before" frames are at about 2.3 s, not the 2.4 s the spec names. The 1280 frames are 800 x 500, which supports layout checks but not pixel checks.
- **Stale comment.** `src/styles/tokens.css` keeps the stale `--dur-out` comment that DESIGN.md now corrects.
- **Pending Sam.** Spec 12 items 6 to 10 (the words, the wait, the place, Armor, and the veil with no count). Graded as built until he answers.

## Round 4, iteration 3, 2026-10-26: FAIL

Round 4's iterations 2 and 3 graded together against the iteration 1 verdict above (`family-page.md` section 22, criteria 1 to 6, and section 13 step 3). Branch `family/back-to-families`: c3583e2 (iteration 2) and 123ee42 (iteration 3) on 3bbcb7a, then beefc96 (the owner's frames). `git diff 3bbcb7a...HEAD`: 21 files, 102 lines in and 27 out.

### How it was checked

- **Verdicts.** PASS, FAIL, BLOCKED and n/a as before, plus UNPROVEN: a row that needs a browser run this machine cannot make. UNPROVEN is not PASS.
- **Frames.** The owner's JPEGs, read again by eye: `family-r4-390-arg-before.jpg` and `-after.jpg`, `family-r4-1280-arg-after.jpg` and both `-landing-after-press.jpg`. They show iteration 1's build. The control has not moved since, and the landing frames show the poster fall that iteration 2 fixed. The 390 landing frame is 780 x 1688 (scale 2); the argument frames are 488 x 1055.
- **The owner's browser evidence since iteration 1.** A Chromium pane with a hardware GPU, the branch's staging build on 127.0.0.1:8793, on a heavily loaded machine (60 s hero loads):
  - On iteration 2's build, a press at 390 x 844 reached `/#families` and the landing stayed on the 3D path: `html` "js hero3d loading", `#intro` "intro ret", `__skreedDead` false, the loader at phase load. One "Uncaught (in promise) AbortError: Transition was skipped" was still in the console, no longer a hero failure.
  - About 60 s later, with no progress, the loader went to its soft poster. The page sat at 17.2 screens (the fragment's scroll), so `boot.ts`'s soft-then-scrolled rule made it the hard poster, centred on `nav#families` (sv 0.67). Iteration 3 changes that path.
  - On iteration 3's build the pane showed no 3D page at all (the family page stopped at 82 percent, as the default build's did in the same pane), so nothing of iteration 3 was seen in a browser.
- **The diff, read in full:** `boot.ts`, `life.ts`, `hero.ts`, `gate.inline.js`, `loader.inline.js`, `page.ts`, `family.css`, `to-top.css`, the tests, DESIGN.md, `hero-architecture.md` 4.3 and 7.3, and the spec's section 22.
- **The code around it, read:**
  - the loader's `poster()`, its recovery branch (`loader.inline.js` line 64) and its stall and gap rules (lines 66 and 60);
  - `shell.css` lines 81 and 90 (the poster layout, and the soft poster's transparent loader);
  - `hero.ts` step 18 (lines 202 to 222);
  - `links.ts`, `to-top.ts`, and `bridge/loader.ts` (`__introDone` runs `life.recover()`).
- **Tests, run by the reviewer:** `test:family` 61 of 61 pass; `test:unit` 187, with 186 passing and 1 skipped. Nothing in the worktree changed except this log.
- **The builder's `dist/`,** iteration 3's staging build (13:49, hooks on), read only:
  - one `a#famBack` on each of the ten family pages, the body's last element, and none on `/`;
  - the Gate's `pagereveal` listener with all three catches, the loader's `TT` and `RET`, and the boot chunk's early return on `#intro.ret`;
  - every inline script on `/` (3) and on `/shades/blissful-blue/` (2) has its sha256 in `_headers`;
  - `node scripts/case-model/budget.mjs dist blissful-blue`: the page module 7,161 B gzip, total JS on the page 168,995 B. `node scripts/hero/budget.mjs dist --mode staging`: every line holds (48 enforced).
- **Grep** of the 118 added lines: no em or en dash, emoji, TODO, FIXME or lorem.
- **Not done.** No Playwright browser exists here and none was installed, so `back.spec.ts` did not run. No Lighthouse. `/web-design-guidelines` and `visual-critique` are not installed. The reviewer pressed nothing in a browser.
- **Iteration 1's nine items:**
  - fixed: 1 (seen live), 2 (by source and unit test) and 7;
  - 5: fixed for the hard poster (seen live), but iteration 3 bypasses it when a return visit stalls (item 1 below);
  - the fade note and criterion 3's wording: fixed;
  - 3, 4 and 6: open; 8: blocked; 9: carried.

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | The iteration 2 and 3 diff against rules 1 to 50: no violation. Rule 15 is fixed: Back to top's 14 px is one token, `--to-top-bottom` (to-top.css line 12), used by `.to-top[data-page="family"]` (line 25) and `.fam-back` (family.css line 77), and listed in DESIGN.md's component dimensions; `back.test.ts` finds the number written once. The exit now fades from the current opacity: opacity only, under E-F5 (12, 14). The new comments and spec lines carry no dash, emoji or buzzword (3, 16, 17, 29). Still failing, outside the diff: rules 46 and 47, with no terms or privacy page in `dist/` (item 7). Rule 7 for the light families is unmeasured (item 4) |
| A2 | PASS | Pearl Whisper only; the veil and the soft poster are the loader's `--night` (E-A2) |
| A3 | PASS | Unchanged since iteration 1's measurement: Open Sans 600, 14 px, no italic |
| A4 | PASS | "Back to main page", unchanged; pending Sam's word (spec 12 item 6) |
| A5 | PASS | Unchanged |
| B1 | UNPROVEN | The frames are the owner's JPEGs of iteration 1's build, and the spec now says so (section 22, acceptance criteria). The Playwright PNGs, and `-landing-3d` and `-landing-poster` of the landing as built now, need the browser run (item 3) |
| B2 | PASS | At 390 x 844 as measured in iteration 1: `scrollWidth` 390, 121 px inside both edges, 44 px tall. The token keeps the computed 14 px, so the box has not moved |
| B3 | PASS | A same-origin link. The loader's new sessionStorage read is inside a try; without storage, Back to top's way home on a cache miss is taken for a return visit, nothing worse. No localStorage |
| B4 | PASS | Nothing in the diff uses or animates `svh` or `dvh` |
| C1 | PASS | Measured on iteration 3's `dist/`: the page module 7,161 B gzip, +442 B of the 1,000 B allowed (6,719 B before). Total JS on the family page 168,995 B of 250,000 B. The landing's budget holds every line |
| C2 | n/a | No image |
| C3 | PASS | The exit is opacity alone, from its current value, by the Web Animations API (`page.ts` lines 278 to 284); the C3 guard passes |
| C4 | UNPROVEN | Lighthouse not run (item 5) |
| D1 | PASS | E-F5 for the wait and the fades. The return veil comes under E-H1 and is pending Sam (spec 12 item 10), whose question understates the wait (item 2) |
| D2 | PASS | Unchanged: `backFade(dir, true)` is `null` and `reduced()` is read live; the landing's `@view-transition` is `none` under reduced motion |
| D3 | FAIL | Iteration 1's two failures are fixed. A skipped cross-fade no longer ends the 3D path: seen live on iteration 2's build (`hero3d loading`, `#intro.ret`, `__skreedDead` false). Back to top's way home is not a return visit, by source and unit test. New with iteration 3: a return visit that stalls lands on the soft poster with nothing centred, and the island then scrolls it (item 1) |
| D4 | PASS | Unchanged: `.press` on the link only |
| E1 | BLOCKED | `/web-design-guidelines` is not installed (item 6) |
| E2 | BLOCKED | `visual-critique` is not installed (item 6). The reviewer's critique by eye is in the notes |
| E3 | UNPROVEN | A real link named by its text, `hidden` until shown, with the `.ring2` ring. The contrast criterion 6 asks for (three families, both sizes, median of 10 frames at 2.9 s) and the keyboard rows need the browser (items 3 and 4). The reviewer's estimate covers Blissful Blue only (17.6:1 to 19.4:1, iteration 1) |
| E4 | PASS | Writes no data; `family_back` is a local `skreed:track` event |
| E5 | n/a | No database |
| G1, G3, G4, G6, G7, G8 | PASS | Not touched. `dist/` has the branded 404, unique titles and descriptions, the icon set and manifest, `robots.txt` and `sitemap.xml` |
| G2, G11 | n/a | E-G2 for the landing; no Reserve on the family pages since round 3 |
| G5, G15, G16, G18, G19, G23, G24, G26 | FAIL | Carried, not this round's. Missing in `dist/`: an `og:image`, the privacy and terms pages, analytics, a visible contact line with the reply promise, the FAQ, and LocalBusiness JSON-LD (item 7) |
| G9, G12 | PASS | No image added; no data loaded |
| G10 | UNPROVEN | The control was measured at 390 and 1280 only (item 3) |
| G13, G14, G17, G20, G22, G25 | n/a | No form, thanks state, cookies, cutover or founders' note here; breadcrumbs n/a on the teaser |
| G21 | UNPROVEN | The link goes to `/#families`, and since iteration 2 the landing stays on the 3D path (seen live). That it ends at section 2 with the gems live (the snap to 14.5 screens and the lift) is shown by source tests and the built files only; the owner's pane could show no 3D page on iteration 3's build (item 3). On every path the landing carries the families' links, so it is never a dead end |
| G27 | PASS | Nothing fabricated |
| H | FAIL | As D3: a return visit's loading and slow-network rows (item 1). H1: the veil is E-H1 |
| F1 | FAIL | Criterion 5 and step 3 fail on item 1, and section 22 understates the wait to Sam (item 2). Criteria 3 and 6 are unproven |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the 118 added lines |

### Acceptance criteria (round 4, section 22)

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | Unchanged since iteration 1. In iteration 3's `dist/`: exactly one `a#famBack.fam-back.ring2.press` on each of the ten pages, with `href="/#families"`, `hidden` and "Back to main page", the body's last element after `a#toTop`; none on `/`. The owner's computed styles from iteration 1 stand: iterations 2 and 3 change only how the bottom offset is written |
| 2 | PASS | `backTimer` by unit test, and the owner's live run through the `back()` hook on iteration 1's build. Iteration 2 changed only where the exit starts: the computed opacity, read before the cancel (`back.test.ts`). For a control that is fully shown that is 1, as before. The held-clock rows are by source, since `back.spec.ts` did not run |
| 3 | UNPROVEN | The wording now reads the layout viewport's centre, so the owner's 1280 measurement (x 632.4 beside a 15 px classic scrollbar) meets it, and `back.spec.ts` measures against `clientWidth / 2`. Measured at two of the eight sizes (iteration 1). 360 x 780, 375 x 667, 430 x 932, 768 x 1024, 844 x 390 and 900 x 600 need the browser run (item 3) |
| 4 | PASS | By source and unit test, unchanged: `html:not(.m3d) .fam-back` and `[hidden]` are `display: none`, and `fam:grid` calls `backReset()`. The grid rows of `back.spec.ts` did not run |
| 5 | FAIL | **The press:** a real click reached `/#families` (live, iterations 1 and 2). One `family_back`, no `preventDefault`, no `family_open`: by source and unit test. **The landing:** on the 3D path it now stays 3D (live, iteration 2); section 2 at rest with the gems live is unproven (item 3). A return that falls to the hard poster centres `nav#families` (live, iteration 2, sv 0.67). **Where it fails:** a return visit that stalls lands on the soft poster with nothing centred, and the island then scrolls it (item 1). The poster tier proper (`links.ts`) was not tried |
| 6 | UNPROVEN | The contrast row needs medians for Frosty White, Mellow Yellow and Blissful Blue at both sizes (item 4); the keyboard and reduced-motion rows need the browser (item 3). By source, as in iteration 1: last in the body, the `.ring2` ring, focus never moved, no Escape handler, `#live` untouched, opacity only |
| 13, step 3 | FAIL | The arrival is fixed: the landing stays on the 3D path under the veil (live, iteration 2). The snap to 14.5 screens and the lift onto the gems are shown by source tests and the built files only. A stall under the veil fails, by source (item 1). Back to top's way home is not a return visit, by source and unit test |

### Verdict: FAIL

Items 1 and 2 are code and document changes that can be made on this machine. Items 3 to 7 are open records: each needs a browser, a tool or an input this machine does not have.

1. **A return visit that stalls must land on the families, and only the visitor may move it (D3, H, criterion 5, section 13 step 3, F1; read from the files, not run).**
   - **What happens now.** This is the case the owner hit on iteration 2's build. With iteration 3:
     - **The poster page shows.** The loader's `poster('', 'stall')` swaps `hero3d` for `poster`, so the track collapses to one screen (`shell.css` line 81) under a page that sat at 17.2 screens, or at 14.5. The soft poster's loader is transparent (line 90), so the visitor sees the poster page.
     - **Nothing centres the families.** `onSoftPoster` returns at `boot.ts` line 60. `links.ts` centres `nav#families` only at load, off the 3D path, and `toPoster`'s centring (line 44, iteration 2) is no longer reached. So the browser decides where the families end up. With scroll anchoring they stay at the top edge, under the wordmark and Back to top, as in iteration 1's landing frames; without it, the shorter page clamps somewhere else.
     - **The island scrolls the poster page.** The island keeps loading. `hero.ts` step 18 (lines 212 to 214) calls `snapTo(S2T.LAND)` with no check for the poster. In the owner's case, a stall before any progress, that scrolls the poster page to 14.5 screens (or its end): away from the families, under a visitor who may be reading.
     - **The recovery does not wait for the gems.** On frame2 the loader's recovery branch (`loader.inline.js` line 64) swaps back to `hero3d` and lifts at once. So the 3D page can show at the poster page's scroll before `settle` snaps it to section 2. `hero-architecture.md` 7.3 step 3 still says the recovery happens "while `scrollY` is at most 8, so nothing jumps", which no longer holds here.
     - **What it replaced.** On iteration 2's build the same stall ended on the hard poster with the families centred, the fallback the owner saw work. Iteration 3 replaces it with a recovery that moves the page twice.
   - **Change.**
     - `boot.ts` `onSoftPoster`, on a return visit: do not return with no rule.
       - Centre `nav#families` as `toPoster` does (`scrollIntoView({ block: 'center', behavior: 'instant' })`), then read `scrollY`.
       - Keep the scroll rule, measured from that position: a scroll of more than 8 px from it calls `toPoster('soft-then-scrolled')`.
       - Then neither the collapse nor the centring is taken for the visitor's own scroll.
     - `boot.ts` `toPoster`: centre the families only when the loader was not already on its soft poster (`s.mode !== 'poster'`, read before the abort). From a soft poster, keep the visitor's place, as every soft poster does.
     - `hero.ts`:
       - `snapTo` does not scroll while `html.poster` is set (step 18 and `settle`);
       - on a return visit, register `life.onRecover(() => snapTo(S2T.LAND))`, so a recovery puts section 2 in place as the lift starts.
     - Amend `hero-architecture.md` 4.3 item 8 and 7.3 (steps 2 and 3) and the spec's Iteration 3 paragraph to match. Assert the three changes by source in `return-path.test.ts`.
2. **Tell Sam how long the plain screen can last (F1; spec 12 item 10, which D1 grades as built until he answers).**
   - **What the spec says.** For Sam item 5 (`family-page.md` line 703) says the way back shows a plain night screen for "about 2 to 6 s".
   - **What the code does.** The loader's stall rule (`loader.inline.js` line 66) holds that screen for up to 20 s with no progress, or 12 s once the scene is in.
     - On a slow device it can hold longer: a gap of more than 500 ms between frames is not counted (line 60), and the owner's stall came after about 60 s.
     - From 4 s without progress it shows "Still loading" or "Slow connection" (line 65).
     - After item 1, a stall then shows the poster page centred on the families, and the gems once the 3D arrives, unless the visitor has scrolled.
   - **Change.** Add these points to item 5, so his answer covers the slow case as well as the usual one.
3. **Run the browser rows on a machine with Playwright's Chromium (B1, G10, G21, criteria 3, 5 and 6, section 13 step 3; open record).** Use the `PUBLIC_FAMILY_3D=on npm run build:test` build. It should cover:
   - `back.spec.ts` in full: the eight sizes of criterion 3, the held-clock rows of criteria 2 and 6, the grid rows of criterion 4, and the press on both landing paths;
   - the landing after the press at 390 x 844 and 1280 x 800: the veil, the snap to 14.5 screens, `nav#families[data-placed]` and no loader. Take `family-r4-{390,1280}-landing-3d.png` and `-landing-poster.png`;
   - the console at the press, to record whether the "Transition was skipped" line is gone (see the notes);
   - once item 1 is in, a stall under the veil, with the island held at a milestone (`__skreedStall`) or its data held back by route.
4. **Measure the words' contrast for the three families (E3, criterion 6, A1 rule 7; open record).**
   - Measure Frosty White (Snow), Mellow Yellow (Sunbeam) and Blissful Blue (Sky) at 390 x 844 and 1280 x 800, at 2.9 s, taking the median of 10 frames for each.
   - Write the six figures in this log. A median under 4.5:1 keeps E3 failing.
5. **Run Lighthouse mobile (C4; open record)** on a family page of the 3D build and on `/#families`, and paste the numbers here.
6. **E1 and E2 stay BLOCKED (open record).** Install `/web-design-guidelines` and `visual-critique` where the loop runs, or have Sam accept the hand-applied pass.
7. **The site essentials, carried and not this round's (A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26; open record).** Still missing in `dist/`:
   - the `og:image`;
   - the privacy and terms pages;
   - analytics;
   - a visible contact line with the reply promise;
   - the FAQ;
   - LocalBusiness JSON-LD.

   They belong to the site-essentials pass.

### Notes (not graded as FAIL)

- **The console line on arrival.**
  - **What is handled.** A `ViewTransition` has three promises: `ready`, `finished` and `updateCallbackDone`. The Gate now catches all three on the landing's inbound transition, in the head, before the first render (`gate.inline.js` line 15). So, by source, any rejection from that object is handled.
  - **What is not proven.** That the line the owner saw on iteration 2's build came from that object. The pane's console may keep the family page's lines across the navigation, and the landing cannot reach the family page's outgoing transition.
  - **Either way,** the line cannot reach the hero again, because `boot.ts` lets every `AbortError` pass, and no checklist line asks for a clean console. The next press records it (item 3).
- **`isAbortError` is broad.** Every `AbortError` passes the guard, not only a skipped transition. Before the hero's first frame (`__heroStarted`, `loop.ts` line 45) the island has no abort of its own that could go unhandled: its data promises are caught in `boot.ts`, and section 4 loads after the first frame. So nothing is lost today.
- **Back to top on the poster tier.**
  - `links.ts` (since 2026-10-09) centres the families on any `back_forward` entry. On the poster tier the loader returns before its `TT` rule (no `html.loading`).
  - So on that tier, Back to top's way home on a cache miss comes up at the families, not at section 1.
  - This is older than this round, and not graded.
- **Back to top's dropped hash.** Iteration 2 drops the fragment with `replaceState` during the load. Whether Chrome's fragment scroll then stays at the top is read from the files, not seen.
- **Visual critique by eye (folded in for E2).** The frames have not changed, so iteration 1's critique holds:
  - at 390 the two bottom controls are out of line, one centred and one right-aligned, 8 px apart;
  - both read "Back to", and both lead to the landing.

  Both points are pending Sam under D1. Two new readings:
  - At 1280 the cases cover most of GO BEYOND BASIC in the after frame. That is round 3's argument screen, not this control.
  - The landing frames, iteration 1's poster fall, show what a stalled return can show again under item 1:
    - at 1280, Frosty White's circle on the wordmark and Roaring Red's under Back to top;
    - at 390, the first row tight under the wordmark, with the rest of the screen empty night.
- **Unchanged from iteration 1:**
  - spec 13 step 3's condition: any `back_forward` entry is a return visit;
  - the iPhone question: `innerHeight` against `100svh`;
  - the race between frame2 and the gems, read from the files only;
  - the stale `--dur-out` comment in `tokens.css`;
  - spec 12 items 6 to 10, pending Sam, graded as built until he answers.

## Round 4, iteration 4, 2026-10-26: FAIL

Iteration 4 (8437569, five files, 34 lines in and 18 out) answers items 1 and 2 of the iteration 3 verdict above. This entry grades those two items again, then restates the open records and the items pending Sam. Every other row stands as graded in iteration 3.

### How it was checked

- **The commit, read in full:**
  - `boot.ts`: `toPoster`'s `fresh` flag (lines 33, 36 and 46), and `onSoftPoster`'s centring and base (lines 65 and 66);
  - `hero.ts`: the `snapTo` guard (line 203) and the `life.onRecover` hook (line 216);
  - `return-path.test.ts`;
  - `hero-architecture.md` 4.3 item 8 and 7.3 steps 2, 3 and 6;
  - `family-page.md` For Sam item 5 (line 703) and the Iteration 4 paragraph.
- **The paths through it, read in the files:**
  - the loader's `poster()`, `fail()` and `state()`, and its recovery branch (`loader.inline.js` line 64);
  - the Gate's module load-error catch (`gate.inline.js` line 17);
  - `bridge/loader.ts`, whose `__introDone` runs `life.recover()` before the hero's own work;
  - `scrollMap.ts`: the followers' `snap` sets two numbers and writes no style.
- **Tests, run by the reviewer:** `test:family` 61 of 61 pass; `test:unit` 187, with 186 passing and 1 skipped.
- **The builder's `dist/`** (rebuilt at 14:15, staging, hooks on), read only:
  - the boot chunk carries the centring, the base and `fresh`, and the hero chunk carries the `snapTo` guard;
  - every inline script on `/` (3) and on `/shades/blissful-blue/` (2) still has its sha256 in `_headers`.
- **Grep of the 40 added lines:** no em or en dash, emoji, TODO, FIXME or lorem.
- **Not done:** no browser here, as before. Nothing in this entry was seen running.

### Items re-graded

| Iteration 3 item | Verdict | Evidence |
|---|---|---|
| 1. A return visit that stalls lands on the families, and only the visitor moves it | FAIL | **Done as asked, by source.** A stall or offline soft poster on a return visit centres `nav#families`, reads `scrollY` after it, and turns hard only on a scroll of more than 8 px from there; from the top the rule is `scrollY > 8` as before. `snapTo` never scrolls while `html.poster` is set, at step 18 and in `settle` alike. A recovery runs `life.onRecover(() => snapTo(S2T.LAND))` as the lift starts; `__introDone` runs `life.recover()`, which also removes the scroll listener in the same task as the snap, so the snap's scroll event finds no listener. A hard turn from that soft poster keeps the visitor's place. **New gap, from the reviewer's own wording in iteration 3.** `fresh = s.mode !== 'poster'` takes every loader poster for a soft poster that `onSoftPoster` has centred, but the `fail` kind never reaches that centring. On a return visit, a module script that fails to load before the hero's first frame trips the Gate's catch (`gate.inline.js` line 17). Its `fail('')` makes the loader's `poster(..., 'fail')` set its mode to `poster` and collapse the track. Then `onSoftPoster('fail')` (`boot.ts` line 56) calls `toPoster('module-load-error')`, where `fresh` is false: `nav#families` is not centred, and the page stays wherever the collapse left it. With scroll anchoring that is the top edge, under the wordmark and Back to top, as in iteration 1's landing frames (iteration 1's item 5). Iterations 2 and 3 centred this case; iteration 4 does not. `hero-architecture.md` 7.3 step 6 says "from a soft poster `onSoftPoster` centred the families already", which is not true for `fail` |
| 2. Tell Sam how long the plain screen can last | PASS | For Sam item 5 (line 703) now gives: about 2 to 6 s on a warm cache; the stall rule's 20 s with no progress, or 12 s once the scene is in; gaps of more than 500 ms between frames, which are not counted; "Still loading" or "Slow connection" from 4 s without progress; and what a stall shows, the poster page centred on the families, then the gems once the 3D arrives unless the visitor has scrolled. Each point matches `loader.inline.js` lines 60, 65 and 66 and `boot.ts` as built |

### Rows these items touch

| Row | Verdict | Evidence |
|---|---|---|
| D3, H | FAIL | The stalled return now holds by source. A module load failure on a return visit is not centred (item 1) |
| Criterion 5 | FAIL | The poster row on that same path (item 1). The 3D row is still unproven (item 2) |
| 13, step 3 | UNPROVEN | By source, the arrival, the stall, the recovery and Back to top's way home now hold; none of them has been seen in a browser (item 2) |
| F1 | FAIL | Criterion 5 (item 1). Criteria 3 and 6 are unproven (items 2 and 3). The spec's account of what ships is now accurate for the wait (item 2 of iteration 3) |

### Verdict: FAIL

Item 1 is a code and document change that can be made on this machine. Items 2 to 6 are open records.

1. **Centre the families on a return visit that falls through the module load-error catch (D3, H, criterion 5, F1; read from the files, not run).**
   - **Change in `boot.ts`.** Replace `fresh` with a flag that records what happened: whether `onSoftPoster` centred the families.
     - Declare `let softCentred = false;` at module level.
     - Set it to true where `onSoftPoster` centres (line 65, on a return visit).
     - In `toPoster`, write `const fam = !softCentred && location.hash === '#families' ? $('families') : null;`.
     - Drop lines 33 and 36.
   - **The result.** A stall or offline soft poster still keeps the visitor's place on a hard turn, and a `fail` on a return visit is centred again, as in iterations 2 and 3.
   - **Documents and tests.** Amend `hero-architecture.md` 7.3 step 6 and 4.3 item 8, and the spec's Iteration 4 paragraph, to say this. Assert it by source in `return-path.test.ts`:
     - the flag is set beside the centring;
     - `toPoster` reads it, and nothing reads `s.mode` for the centring.
2. **The browser rows (B1, G10, G21, criteria 3, 5 and 6, section 13 step 3; open record).** Run on a machine with Playwright's Chromium and the `PUBLIC_FAMILY_3D=on npm run build:test` build:
   - `back.spec.ts` in full: criterion 3's eight sizes, the held-clock rows of criteria 2 and 6, the grid rows of criterion 4, and the press on both landing paths;
   - the landing after the press at 390 x 844 and 1280 x 800: the veil, the snap to 14.5 screens, `nav#families[data-placed]` and no loader, with `family-r4-{390,1280}-landing-3d.png` and `-landing-poster.png`;
   - the console at the press, to see whether the "Transition was skipped" line is gone;
   - a stall under the veil, with the island held at a milestone (`__skreedStall`) or its data held back by route: the families centred on the poster page, then section 2 on recovery;
   - after item 1, a module script refused by route on `/#families`: the families centred.
3. **The words' contrast for the three families (E3, criterion 6, A1 rule 7; open record).**
   - Measure Frosty White (Snow), Mellow Yellow (Sunbeam) and Blissful Blue (Sky) at 390 x 844 and 1280 x 800, at 2.9 s, taking the median of 10 frames for each.
   - Write the six figures in this log; a median under 4.5:1 keeps E3 failing.
4. **Lighthouse mobile (C4; open record)** on a family page of the 3D build and on `/#families`, with the numbers pasted here.
5. **E1 and E2, BLOCKED (open record).** `/web-design-guidelines` and `visual-critique` are not installed where the loop runs. Install them there, or have Sam accept the hand-applied pass.
6. **The site essentials, carried and not this round's (A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26; open record).** Still missing in `dist/`:
   - the `og:image`;
   - the privacy and terms pages;
   - analytics;
   - a visible contact line with the reply promise;
   - the FAQ;
   - LocalBusiness JSON-LD.

### Pending Sam (graded as built until he answers)

Spec 12 items 6 to 10, that is the spec's "For Sam" 1 to 5:

- the words, "Back to main page" or "Back to the families";
- the wait, 2.5 s;
- the place: centred under the letters, one row above Back to top on phones;
- whether the control also comes on the fourth case type (Armor);
- the way back's plain night screen with no count, now with its slow case stated.

The two weaknesses of the critique by eye (the bottom controls out of line, and both reading "Back to") belong to his answer on the place and the words.

**Runnable on this machine:** item 1 only (two lines of `boot.ts`, the two document paragraphs and the test). Everything else needs a browser, a tool or an input this machine does not have.

### Notes (not graded as FAIL)

- **A recovery does not wait for the gems.** On a soft poster's recovery the loader lifts on frame2 alone, and the snap puts section 2 in place as the lift starts. Unlike a return visit with no stall, nothing waits for `section2.ready`, so the 600 ms fade can open on gems still being built. The reviewer asked for this in iteration 3, and frame2 still gates the lift (hero.md 12.7).
- **A scroll the visitor did not make.** On the centred poster page, a later layout shift above `nav#families` that scroll anchoring corrects by more than 8 px would count as the visitor's scroll. The result is the hard poster, keeping the place, with the families still in view. Nothing above the families is known to change height there.
- **Followers.** `snapTo` still sets the scroll followers on the poster page. `scrollMap.ts` shows they are two numbers with no style written, so nothing on the poster page moves.

## Round 4, iteration 5, 2026-10-26: FAIL

Iteration 5 (0941e13; 4 files, 16 lines in and 11 out) answers item 1 of the iteration 4 verdict above. It is the loop's last iteration. Item 1 now passes. The round still fails, but only on open records: rows that need a browser (UNPROVEN), tools that are not installed (BLOCKED) and carried site essentials (FAIL). No code or document change is outstanding.

### How it was checked

- **The commit, read in full:**
  - `boot.ts`: `softCentred` declared at line 19, read in `toPoster` at line 47, and set beside the return-visit centring in `onSoftPoster` at line 66;
  - `return-path.test.ts`;
  - `hero-architecture.md` 4.3 item 8 and 7.3 step 6;
  - the spec's Iteration 5 paragraph in section 22.
- **Tests, run by the reviewer:** `test:family` 61 of 61 pass; `test:unit` 187, with 186 passing and 1 skipped.
- **The builder's `dist/`,** rebuilt at 14:22, read only:
  - the boot chunk declares the flag false, sets it beside the centring and reads it in `toPoster`;
  - every inline script on `/` (3) and on `/shades/blissful-blue/` (2) still has its sha256 in `_headers`.
- **Grep of the 21 added lines:** no em or en dash, emoji, TODO, FIXME or lorem.
- **Not done:** no browser here. Nothing in this entry was seen running.

### Item re-graded

| Iteration 4 item | Verdict | Evidence |
|---|---|---|
| 1. Centre the families on a return visit that falls through the module load-error catch | PASS | By source and by the built files. `softCentred` is set only where `onSoftPoster` centres, on a stall or offline soft poster on a return visit; `toPoster` centres when `!softCentred && location.hash === '#families'`; the `fresh` and `s.mode` lines are gone. A `fail` returns at `boot.ts` line 57 before that branch, so the Gate's module load-error fall now centres the families again, as do a lost context and a failed fetch. A hard turn after a centred soft poster keeps the visitor's place. `return-path.test.ts` asserts the flag beside the centring, `toPoster` reading it, no `fresh` or `s.mode` read for the centring, and three occurrences of the flag. `hero-architecture.md` 4.3 item 8 and 7.3 step 6 now say the same |

With item 1 in, D3, H, criterion 5 and section 13 step 3 hold by source. They move from FAIL to UNPROVEN until the browser run, and F1 is UNPROVEN with them.

### Open records

- The browser run (B1, G10, G21, D3, H, criteria 3, 5 and 6, step 3), needing Playwright's Chromium on the `build:test` build. It should cover:
  - `back.spec.ts` in full;
  - the landing after the press at both sizes, with the `-landing-3d` and `-landing-poster` PNGs;
  - the console at the press;
  - a stall under the veil;
  - a module script refused on `/#families`.
- The words' contrast for Frosty White, Mellow Yellow and Blissful Blue at both sizes, as the median of 10 frames (E3, criterion 6, A1 rule 7).
- Lighthouse mobile on a family page and on `/#families` (C4).
- E1 and E2: BLOCKED, since `/web-design-guidelines` and `visual-critique` are not installed.
- The carried site essentials: the `og:image`, privacy and terms, analytics, the contact line with the reply promise, the FAQ, and LocalBusiness JSON-LD (A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26).

### Pending Sam (graded as built until he answers; spec 12 items 6 to 10)

- The words: "Back to main page" or "Back to the families".
- The wait: 2.5 s.
- The place, centred under the letters and one row above Back to top on phones. The critique's two points go with this item and the words: the bottom controls are out of line, and both read "Back to".
- Armor: whether the fourth case type gets the control too.
- The way back's plain night screen with no count, its slow case now stated.

**Runnable on this machine:** nothing is outstanding. Every remaining item needs a browser, a tool or an input this machine does not have.

### Notes (not graded as FAIL)

- **The flag outlives a recovery.** After a centred soft poster recovers on frame2, `softCentred` stays true. A later hard failure in the 3D page then keeps the visitor's place, as on any visit, instead of centring the families again. That suits a visitor who has been reading.

## Round 5, iteration 1, 2026-10-26: FAIL

Round 5 is the landing's 0 to 100 wordmark loader on the way back and "Back to main page" on Back to top's row on phones (`family-page.md` section 23: criteria 1 to 8, D1 to D9, and the builder's Built, Checked and Not done), with Armor unchanged (Sam: "no"). Branch `family/round-5-return-loader`, cut from 7241c50; the build is uncommitted: 17 files, 684 lines in and 115 out (`git diff`), and nine untracked PNGs under `screenshots/`.

The product does what Sam asked. Every failure below is in the evidence: one browser row asserts a bound the loader never promised, four round 4 rows fail on the harness, two ways in and the poster path's centring have no run, and three document points are left.

### How it was checked

- **Verdicts.** PASS, FAIL, BLOCKED, UNPROVEN and n/a as in round 4. UNPROVEN means a row that needs a browser run nobody has made; it is not PASS.
- **Frames, read first, before any code.** All are PNGs written by `back.spec.ts` in the installed Chrome under the harness's SwiftShader flags.
  - The argument screen 3.0 s after it came on: `family-r5-390-arg-after.png` (780 x 1688), `-360-` (720 x 1560), `-844-` (1688 x 780) and `-1280-` (1280 x 800).
  - The landing about 2.5 s after the arrival: `family-r5-{390,1280}-return-loader.png`.
  - The landing 1 s after the loader has gone: `family-r5-{390,1280}-return-gems.png`.
  - The poster path: `family-r5-390-landing-poster.png`.
  - Round 4's `family-r4-390-arg-after.jpg`, `-1280-arg-after.jpg` and `-390-landing-after-press.jpg` for comparison. The family is Blissful Blue.
- **The diff, read in full:**
  - `loader.inline.js` (all 88 lines, not only the changed one), `hero.ts`, `family.css`, `shell.css`, `to-top.css` and `rock-links.ts`;
  - the four test files and `entry.spec.ts`;
  - CLAUDE.md, DESIGN.md, HANDOFF.md, hero.md, hero-architecture.md, and the spec's 2.2, 7, 12, 13, 22 and 23.
- **The code around it, read:**
  - `page.ts`: the control's controller and `onScroll`, a plain scroll listener with no throttle of its own;
  - `back.ts`, `links.ts` and `section2/gems.ts`, whose `build()` always ends in `ready` or `failed`;
  - `warmup.ts`, the c1 to c9 milestones;
  - `loader-weights.json`;
  - Playwright's clock (`node_modules/playwright-core/lib/generated/clockSource.js`): `pauseAt`, and the faked `requestAnimationFrame` and `performance`.
- **Tests, run by the reviewer:**
  - `test:family`: 62 of 62 pass;
  - `test:unit`: 192, with 191 passing and 1 skipped (ffprobe);
  - both run with `--script-shell` set to Git's bash.
- **The browser run.** The reviewer read the owner's logs and started no browser and no server.
  - `back.spec.ts` against `PUBLIC_FAMILY_3D=on npm run build:test` on 127.0.0.1:8793: 40 rows, 33 passed and 7 failed in 12.2 minutes (`scratchpad/r5-back-spec.log`).
  - Rows 1, 2, 3, 6 and 7 again with a 300 s timeout (`r5-back-rerun.log`): mellow-yellow passed at both sizes, and the other four failed again (the reduced-motion row, the second time, in `hold()`).
  - So 34 of the 40 rows pass. The six that fail are criterion 2's two landing rows and four rows from round 4.
- **The owner's sampler.** Two runs of rows 4 and 5's assertions outside the suite, with the same init scripts in the same Chrome (`tasks/b4wefnh1m.output`, `tasks/b9bey7zui.output`). Read in full, with the samples around each jump.
- **The worktree's `dist/`** (the `build:test` build of 16:33), read only:
  - the landing's loader carries `g&&l.classList.add(\`ret\`)` and the exit line `R&&(!g||z)&&W>=E-.001&&ue(e)`;
  - no `!RET&&` form and no `.intro.ret` rule are left;
  - the hero chunk has one `.ready()` call and no `.cut()`. Its two `.skip()` calls are the hooks' (the room's and the intro hook's), not the loader's;
  - each family page has one `#famBack` and three `.fam-back` rules: the phone base with the new `left` and `bottom`, the grid mode's `display: none`, and the wide block's centring;
  - `node scripts/case-model/budget.mjs dist blissful-blue` on this test build: page module 7,161 B gzip and total JS 168,937 B, both PASS.
- **The builder's production budget logs** (`scratchpad/build-before.log` and `build-after.log`):
  - "inline scripts (4)" 4.7 to 4.8 KB gzip, 9.7 KB raw both;
  - "inline styles (1)" 39.4 to 39.3 KB raw;
  - the hero chunk 54.5 KB gzip and 151.8 KB raw both;
  - "every enforced line of section-4-flux.md 6 holds (49 enforced)", and the section 4 build guard passes.
  - The family page's after-run is the builder's figure; no after-log was kept.
- **Grep of the 684 added lines and of every changed file:** no em or en dash and no emoji. The only AI product name is the file name `CLAUDE.md`. No TODO, FIXME or lorem. Every changed file is LF.
- **Not available here:** `/web-design-guidelines` and `visual-critique` are not installed, so the reviewer's own critique of the 390 frame stands in for E2 (Notes). No Lighthouse run. No real phone.

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | The diff against rules 1 to 50: no violation. Rule 15: the phone rule's offsets are tokens and Back to top's own expressions (`--inset`, `--s2`, `--to-top-bottom`, `--sab`), with no raw number (`back.test.ts`). The control's place changes with no motion, icon or colour: rules 10, 12 (with E-F5), 14, 22, 24, 45 and 48 hold. No dash, emoji or buzzword in any comment or document line (3, 16, 17, 27, 29). The loader shown on a return visit is E-H1's (rule 38 and the loader's motion, as on a first visit). Still failing, outside the diff and carried: rules 46 and 47, with no privacy or terms page in `dist/` |
| A2 | PASS | Pearl Whisper only; the loader's `--night` and its light are E-A2 |
| A3 | PASS | Computed in the browser at 390 and 1280: Open Sans 600, 14 px, line height 14 px (rows "shown at", both pass). The loader's type is E-A3's |
| A4 | PASS | No copy changed. "Back to main page" stays pending Sam (spec 12 item 6) |
| A5 | PASS | The argument screen shows the case. The loader screen is the hero's own, under E-H1 |
| B1 | PASS | Playwright PNGs at 390 and 1280 of the argument screen, the return loader and the gems. The poster frame was caught mid cross-fade (item 3) |
| B2 | PASS | No horizontal scroll at 360 x 780, 375 x 667, 390 x 844, 430 x 932, 768 x 1024, 780 x 360 and 844 x 390, nor at the four wide sizes. The words start at `--inset` (16 px at 390); both controls are 44 px tall (criterion 5's rows, all pass) |
| B3 | PASS | A same-origin link; no storage added |
| B4 | PASS | Nothing in the diff uses or animates `svh` or `dvh` |
| C1 | PASS | Production: critical JS 15.3 KB, unchanged. The landing's inline scripts grow 1 B gzip (4,861 to 4,862 B, the builder's exact figure; 4.7 to 4.8 KB at the log's precision), inside the plan's 20 B gzip and 50 B raw. The hero chunk changes 1 B raw. The family page module is unchanged at 7,070 B gzip, the same chunk |
| C2 | n/a | No image |
| C3 | PASS | No animation added. The control's fade is opacity alone by the Web Animations API, unchanged, and the C3 guard (`data.test.ts`) passes in `test:family`. The loader's animations are the prototype's, byte for byte (`inline-loader.test.ts`) |
| C4 | UNPROVEN | Lighthouse not run (open record) |
| D1 | PASS | The loader on the way back is E-H1's; the control's wait is E-F5's |
| D2 | UNPROVEN | By source, `backFade(dir, true)` is `null` and `reduced()` is read live, and the landing's reduced-motion tier is the poster. In the browser, the first half of the reduced-motion row passed in the first run: at 2.5 s, not hidden, opacity 1, no animation. Its "gone at once" half failed on the harness (item 2) |
| D3 | UNPROVEN | The way back's Loading state was seen: the wordmark, the count and its exit. The stall, offline, error and gems-failed rows of section 23's states table are by source only (open record) |
| D4 | PASS | `.press` on the link only, unchanged since round 4. The browser's hover row failed before its first hover, on the harness (item 2) |
| E1 | BLOCKED | `/web-design-guidelines` is not installed |
| E2 | BLOCKED | `visual-critique` is not installed. The reviewer's critique by eye is in the notes |
| E3 | PASS | A real link named by its text; Tab order and the `.ring2` ring pass in the browser (the keyboard row). Contrast where the words now stand, median of 10 frames at 2.9 s. At 390: Frosty White 19.43:1, Blissful Blue 19.43:1, Mellow Yellow 19.43:1 (rerun). At 1280: Frosty White 15.46:1, Mellow Yellow 15.29:1 (15.33:1 rerun), Blissful Blue 15.73:1. Lowest single frame 12.5:1. This closes round 4's open contrast record |
| E4 | PASS | Writes no data |
| E5 | n/a | No database |
| G1, G3, G4, G6, G7, G8 | PASS | Not touched; present in `dist/` |
| G2, G11 | n/a | E-G2; no Reserve on the family pages since round 3 |
| G5, G15, G16, G18, G19, G23, G24, G26 | FAIL | Carried, not this round's. Missing in `dist/`: an `og:image` (0 on `/` and on the family page), the privacy and terms pages, analytics, a visible contact line with the reply promise, the FAQ and LocalBusiness JSON-LD |
| G9, G12 | PASS | No image added; no data loaded |
| G10 | PASS | The control was measured in the browser at 360, 375, 390, 430, 768, 900, 1024, 1280 and 1366 px wide, and in landscape at 780 x 360 and 844 x 390 (criteria 5 and 6) |
| G13, G14, G17, G20, G22, G25 | n/a | No form, thanks state, cookies, cutover or founders' note here; breadcrumbs n/a on the teaser |
| G21 | PASS | Seen for the first time in the browser on the 3D path, by the owner's sampler at both sizes and by the frames. The press lands at 14.5 screens (12,238 px at 844 tall; 11,600 px at 800 tall), with section 2 ready, `nav#families[data-placed]` and ten links, and the gems in `-return-gems` |
| G27 | PASS | Nothing fabricated |
| H | UNPROVEN | As D3. H1: the loader on the way back is E-H1's |
| F1 | FAIL | Criteria 2 and 7 fail and criteria 1 and 4 are unproven (below); the spec's "Not done" no longer matches what was run (item 4) |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the added lines |

### Acceptance criteria (round 5, section 23)

| # | Verdict | Evidence |
|---|---|---|
| 1 | UNPROVEN | **Source.** `shell.css` has no `.intro.ret` rule (`return-path.test.ts`, and the built stylesheet). Line 69 reads `if(ready&&(!RET||manual)&&tl>=FULL-.001)sched(now)`; line 13's `RET` is round 4's. **The press, both sizes.** In the spec, the assertions before line 417 passed: `#intro.ret`, `.ld-w` and `#ldPct` not `display: none` from the first sample to the lift, and the count past 30. The sampler agrees: zero frames with either hidden, and 30 passed at 3.2 to 3.8 s. The `-return-loader` frames show the wordmark filling ("sk" lit) and the count at 44 on the night. **Not run:** a direct load of `/#families`, and the browser's Back from a family page with the back-forward cache missed (item 3). The second is the one way in that exercises `RET`'s `back_forward` condition |
| 2 | FAIL | **The prototype's rules hold.** `inline-loader.test.ts` passes: undoing the deviations gives the prototype byte for byte. On the way back, `html.loading` is removed at 12.5 s (390) and 16.9 to 18.0 s (1280) after the time origin. `n` never falls. The phases run load, exit, enter, lift, and the lift sample reads `n` 100. The family page keeps `cut()`; `RET` needs `html.hero3d`. **The row fails** at `S[k].n - S[k-1].n <= 5`: 9 (390) and 8 (1280) in the spec, 17 to 23 in the sampler. **The test is at fault, not the product.** At 390 the samples read `tl` 2.306 at 3,365 ms, then nothing for 1,218 ms; `tl` read 2.312 and 2.319 for two more samples, then 3.528 at 4,586 ms. At 1280: 2.875 at 4,099 ms, then 4.437 at 5,663 ms. In both, `next` read c3 before the jump and c4 after it, and `p` rose by c3's 0.13. The long task is the hero's own warm-up compile, milestone c3 (`warmup.ts` line 32: `compileAsync` and a render of the scene), which runs under the loader on every visit, the first included. While the main thread is blocked, the fill keeps running on the compositor; when it resumes, `fA.currentTime` catches up in one frame. The catch-up equals the block at playback rate 1 (1.222 s of fill over 1.221 s; 1.562 s over 1.564 s), so the fill never ran faster than the prototype allows (rate 2 at most), and nothing cut it. **Also:** the row's `done` check (lines 421 and 422) asserts nothing. The sampler stops once `#intro` is gone, and `done()` sets `ph='done'` and removes `#intro` in the same task, so no sample is ever `done` (the sampler's own `"done": null`). Fix: item 1 |
| 3 | PASS | **Source** (`return-path.test.ts`): the settle condition, then `snapTo(S2T.LAND); L.ready();`; no `L.skip()` or `L.cut()`; the `life.onRecover` hook; `__introDone` runs `life.recover()` first; `lift()` calls `__introDone`. **Browser** (the owner's sampler, the same init scripts and Chrome as the spec): `scrollY` is 14.5 times `innerHeight` at the lift and 1 s after (12,238 at 844; 11,600 at 800), and 0 px off over every sample after the lift; section 2's hook reports `ready` with all ten gems at L 1 and their labels placed before the lift; `nav#families` has `data-placed` and ten links; `html` stays `hero3d`. **Frames:** `-return-gems` shows the ten gems at rest with their labels at both sizes. **The fragment scroll,** which section 23 left as "Not checked": the first samples read 14,517 (390) and 13,760 (1280), the browser's own jump to `#families`. The island's snap then read 12,238 and 11,600 under the loader, and nothing moved the page again. The spec's own row stopped at item 1's line before these assertions, so it must reach them after item 1 |
| 4 | UNPROVEN | **The poster path's row passes "in view, no loader"** (`html.poster`, `#intro` hidden). **Criterion 4 says "the families centred".** The row does not assert it, and its frame contradicts it at the moment it was taken. `family-r5-390-landing-poster.png` was captured during the root cross-fade: the family page's case, its letters and both bottom controls show through. The ten swatches sit at the top edge (about y 48 to 235 of 844), under the wordmark and Back to top, with the quiz's heading cut by the bottom edge (item 3). **The stall, the refused module, the lost context, the failed fetch and Back to top's way home on a cache miss** are round 4's code, untouched, by source and `return-path.test.ts` only; no browser row (open record) |
| 5 | PASS | All seven phone rows pass in the browser: the same top and bottom as `#toTop` within 0.5 px; both 44 px; 14 px above the bottom; the words at `--inset` within 1 px; the chevron at the width less `--inset`; one baseline within 0.5 px; 48 px or more apart; clear of `#toTop`, `#famBtn` and `#arg-box`; no horizontal scroll. At 390 x 844 the row is y 786 to 830, with the boxes at the planned x within 2 px. `back.test.ts`: the phone rule's `bottom` is Back to top's family expression with `var(--sab)`, its `left` the mirror of Back to top's `right`, and `margin-inline: auto` appears once, in the wide block. The frames at 360, 390 and 844 show the row by eye: the words at x 16.5 (390, css px), Back to top's chevron ending near x 374, one line near y 808 |
| 6 | PASS | All four wide rows pass in the browser at 900 x 600, 1024 x 768, 1280 x 800 and 1366 x 768. The control is centred within 1 px with its bottom one `--inset` above the edge (711.2 to 755.2 at 1280 x 800), and Back to top sits at 91.3 to 135.3 under "All families". The 1280 frame puts the control where round 4's did |
| 7 | FAIL | **These hold:** the DOM and Tab order are section 22's (the keyboard row passes); `backTimer` is off at 5.6 screens and below (`back.test.ts`); the 2.5 s, 400 ms and 200 ms and the words are unchanged (unit tests); Armor is untouched. **Not met:** "Section 22's criteria 1, 2, 4, 5 and 6 still pass". Four of their browser rows are red on the harness (item 2); see the next table. Criterion 6's contrast is now measured where the words stand and passes (E3) |
| 8 | PASS | Production build: every enforced line holds (49), and both post-build guards pass. The inline scripts grow 1 B gzip and the hero chunk 1 B raw; the page module is unchanged and its inline stylesheet goes 9,332 to 9,324 B gzip (the builder's run). `test:family` (the C3 guard among them) passes. No em or en dash in any changed file |

### Section 22's criteria under round 5

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | In the browser: the built HTML row (one control on each of three families, after `#toTop`, named by its text), and the computed style rows at 390 and 1280 |
| 2 | FAIL | Its two frame rows pass at both sizes (no control at 2.4 s; the control in at 3.0 s), and `backTimer`'s unit tests pass. Its two held-clock rows are red on the harness (item 2), so the cancel, the re-arrival at 4.5 s and the 200 ms exit have never passed in a browser |
| 3 | PASS | Replaced on the phone layout by round 5's criterion 5, and held on the wide layout by criterion 6 |
| 4 | PASS | All seven grid rows (data saver, 2G, `deviceMemory` 2, reduced motion, no WebGL2, `?mode=grid`, JavaScript off) and the `fam:grid` row pass |
| 5 | FAIL | **These pass:** the plain click row (one `family_back {from: 'argument'}`, no `family_open`, `defaultPrevented` false, the modified click opens a new tab and leaves the page) and the poster row ("in view, no loader"). **Red:** the hover row, on the harness (item 2). The 3D landing row is round 5's criteria 1 to 3 |
| 6 | FAIL | **These pass:** the keyboard row, the six contrast medians (E3) and zero CSP violations. **Red:** the reduced-motion row, on the harness (item 2) |

### Verdict: FAIL

Items 1 to 4 can all be done on this machine: test code and document lines, no product code. The owner's rerun of `back.spec.ts` then grades them.

1. **Criterion 2's landing row asserts a bound the loader never promised; fix the row and the criterion's wording, not the loader (criterion 2; section 22 criterion 5's 3D half; F1).**
   - **The product is not at fault.** The jumps are the prototype loader's catch-up after a long main-thread task, the hero's c3 warm-up compile, which a first visit runs under the same loader. `inline-loader.test.ts` proves the loader is byte-identical apart from the recorded deviations, so the loader must not change.
   - **In `tests/family/specs/back.spec.ts` lines 417 to 422:**
     - keep "`n` never falls";
     - replace the per-frame `<= 5` with a rate bound against every earlier loading sample, not only the previous one: for every k and every j before it, `tl[k] - tl[j] <= 2 * (t[k] - t[j]) / 1000 + 0.02`, which is a running minimum of `tl - 2t/1000`. The fill never runs faster than twice real time. The bound must look further back than one frame, because `currentTime` read the pre-block value for two more samples after the 1,218 ms gap at 390 before it caught up, so a window of "the frame right after a gap" misses it. The two catch-ups measured (1.222 s of fill over 1.221 s, and 1.562 s over 1.564 s) pass it; a `cut()` from a fill under 4.96 s fails it;
     - prove "no cut" directly. The init script wraps `__skreedLoader`'s `cut` and `skip` when the loader defines the object, and the row asserts that neither is called on the landing and that `ready` is called exactly once;
     - read `__skreedLoader.state()` once after `#intro` is gone, and assert phase `done`, `n` 100 and `tl` 7.05. The current `if (done.length)` can never be true.
   - **In section 23, criterion 2's second bullet:** say the same: never falling; never faster than twice real time measured from any earlier frame, so a long task's catch-up is allowed and a cut is not; no `cut()` or `skip()` call on the landing.
   - **Then** the row reaches its remaining assertions for criteria 1 and 3 (section 2 ready before the lift, 14.5 screens at the lift and after), which the sampler already shows passing.
2. **Fix the four round 4 rows that fail on the harness (criterion 7; section 22 criteria 2, 5 and 6; D2).** Each failed again on the rerun (the reduced-motion row the second time in `hold()`), so each is a deterministic fault of the test in this environment, not of the product.
   - **`hold()` (lines 47 to 50).**
     - **Cause.** `page.clock.pauseAt(now + 1)` races Playwright's fake clock, which runs in real time until `pauseAt` stops it. Under load the round trip from the `Date.now()` read to `pauseAt` takes more than 1 ms, so the target is already past: "Cannot fast-forward to the past". This failed the 1280 "when it shows" row on both runs and the reduced-motion row on the rerun.
     - **Fix.** Pause with a margin longer than any round trip, for instance `now + 500`. Every timer the rows measure starts at the next `toEnd()`, after the pause, so the margin moves nothing.
   - **"When it shows" (line 133, and the waits at lines 149 and 156).**
     - **Cause.** The fade is a Web Animations API animation on the document timeline, which the fake clock does not drive. `runFor(2499)` fires the island's held animation frames back to back, about 150 of them, each a SwiftShader draw. 500 ms after `animate()`, the computed opacity still read "0", the animation's first keyframe, while its timing object was right.
     - **Fix.** Keep the timing-object assertion, then await the fade's own end (`Promise.all(el.getAnimations().map((a) => a.finished))`) before reading opacity "1" and no animation left. Do the same before the exit check, and await the exit's `finished` before asserting `hidden`.
   - **"Hover lifts it 1 px" (lines 328 to 330).**
     - **Cause.** The arrival started late under slow frames: opacity 0.970735 at 3,100 ms after the argument came on.
     - **Fix.** Wait for the arrival's `finished`, or poll the opacity to "1", before the first read. This row is about hover and press, not timing.
   - **"Reduced motion turned on after the page went 3D" (lines 478 to 480) and `toScreen()` (lines 41 to 44).**
     - **Cause.** `page.ts` listens to `scroll` directly, but the browser dispatches the event in its next rendering step. Frames here are 142 to 251 ms apart at the 90th percentile, so the 80 ms wait is too short.
     - **Fix in `toScreen()`.** Await the page's own `scroll` event: a one-shot listener added before the `scrollTo`, which runs after `page.ts`'s earlier listener. Return at once when the position does not change.
     - **Fix in the row.** Assert `hidden` with an auto-retrying `toHaveAttribute('hidden', '')`, and assert "no animation" by a count of `animate()` calls on `#famBack`, kept by an init script, that stays 0.
3. **Run the ways in that criterion 1 names, and make the poster row prove the centring (criteria 1 and 4, B1).**
   - **Criterion 1's other two ways in.** Add to the landing row:
     - a direct `page.goto('/#families')`, with the tier pin;
     - the browser's Back from a family page with the back-forward cache missed. For instance, serve the landing with `Cache-Control: no-store` through `page.route`, assert the navigation entry's type is `back_forward`, and confirm `pageshow` was not `persisted`.
     - Each asserts `#intro.ret`, the wordmark and the count shown, and the lift at 14.5 screens. The Back is the only run that exercises `RET`'s `back_forward` condition.
   - **The poster row (lines 343 to 356).**
     - Wait for the cross-fade to end, for instance until no `::view-transition` animation is left on `document.documentElement`.
     - Then assert that `nav#families`'s centre is within a few px of the layout viewport's centre, or at the page end's clamp. Retake `family-r5-390-landing-poster.png`.
     - If the families are still at the top edge once the cross-fade is over, the browser's fragment scroll is winning over `links.ts` line 12. That is a product fault of the poster path (older than this round, but in this round's criterion 4), to fix in `links.ts`.
4. **Documents (F1; section 23's documents list).**
   - **`src/scripts/family/links.ts` line 11** still says "isReturnVisit in the loader's skip path"; the list missed it. Reword it as `rock-links.ts` line 32 now reads: on the 3D path the loader runs in full and lifts onto section 2.
   - **The four narrow sizes' gaps.** Section 23's phone-row table ("Apart (boxes)") and criterion 5 read 77.8, 92.8, 107.8 and 147.8 px. The edges give 77.7, 92.7, 107.7 and 147.7, which `back.test.ts` and DESIGN.md use. Make the spec agree.
   - **Section 23's "Not done"** says no browser ran and no frame was taken. Record the owner's run: the two logs, 34 of 40 rows passing, the six failures and their causes as graded here, the sampler's figures and the frames' names. Then the spec's account matches what was verified.

### Open records

These are not FAIL in the builder's hands. Each needs a machine, a tool or an input the loop does not have.

- **The rerun of `back.spec.ts`** after items 1 to 3, on the owner's machine (Chrome with `CHROME_PATH`, the `build:test` build on 8793).
- **The way back's failure paths in a browser** (criterion 4; D3, H):
  - a stall under the loader, the island held at a milestone by `__skreedStall` or by route;
  - a module script refused on `/#families`;
  - a lost context and a failed fetch;
  - Back to top's way home on a cache miss.
- **A real phone:**
  - the loader's count catch-up on a real GPU (on SwiftShader the c3 block was 1.2 to 1.6 s and the count jumped 17 to 23);
  - the row's safe areas (the home indicator and the landscape side insets);
  - round 4's `innerHeight` against `100svh` question on iPhone.
- **Lighthouse mobile (C4),** on a family page of the 3D build and on `/#families`.
- **E1 and E2: BLOCKED.** `/web-design-guidelines` and `visual-critique` are not installed.
- **The carried site essentials** (A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26).

### Pending Sam (graded as built until he answers; spec 12 items 6, 7, 11 and 12)

- **The words:** "Back to main page" or "Back to the families". On phones both bottom controls now read "Back to" on one line.
- **The wait:** 2.5 s.
- **The way back's length:** the landing's full loader, or the family pages' faster finish (`L.cut()` for `L.ready()`, one word).
  - On a warm cache on a real device, the plan's arithmetic is 8.2 s to the gems.
  - In this harness the lift came 12.5 to 18 s after the time origin, because SwiftShader's frames are slow. Judge it on a phone.
- **The phone row:** one row as built, stacked at the right, or under the letters.

### Notes (not graded as FAIL)

- **Visual critique by eye of the 390 frame (in place of E2).**
  - **What Sam asked for is there.** "Back to main page" now starts at x 16, where the wordmark starts. Back to top's chevron ends at x 374, where "All families" ends. The two controls share one baseline near y 808. So the bottom row mirrors the top row, and round 4's fault is gone: centred, 8 px above Back to top and overlapping its columns. The 360 frame keeps 102 px between the words, and the 844 x 390 frame keeps the row about 68 px under the letters' bottom. That reads as "follows and alligns".
  - **What a designer would still send back.**
    - Two "Back to" labels on one line read as near twins, and only one carries an icon. On a family page both go to the landing, since Back to top steps back to its top. This is the words question, pending Sam.
    - The control now reads as page chrome rather than the next step after GO / BEYOND BASIC, with about 330 px of empty night between the letters (bottom near y 455) and the row. That is D4's reading (1) against reading (3), also Sam's to choose.
  - **Older, not this round's.**
    - The case covers "BEYOND" at 390.
    - At 844 x 390 three cases stand over the letters, the left one over the G of GO, and the right case's top comes within a few px of "All families".
    - The same build draws one case at 360, 390 and 1280, three at 844 x 390, and five in round 4's 1280 pane frame. So which lineup the argument screen shows is not settled by the frames. This is round 3's argument screen (section 21, E-F3), worth Sam's look.
- **The return frames.** `-return-loader` at both sizes shows the first visit's loader: the wordmark half filled, the count reading 44 with its 1.1 em spacing (E-A3), no status line. `-return-gems` shows the ten gems at rest with their labels and Back to top top right, as the landing's section 2 is built.
- **Why the gems are ready before the lift.** `gems.ts` `build()` always ends in `ready` or `failed` (try and catch around `compileAsync`), so the loader can never be held at 69 by a build that neither ends nor fails. A gem build that is merely slow holds the count at 69 with the passes running and no status line, as the states table says.
- **The unit test's arithmetic.** `back.test.ts`'s new test recomputes the plan's table from the stylesheets' constants and the plan's word widths. That checks the plan's arithmetic, not the page; the browser rows of criterion 5 measure the page, and they pass.
- **The builder's budget figures** for the family page after the change come from the builder's run; only the before-log was kept. On this machine's test build the page module is 7,161 B gzip, as in round 4's staging build.

## Round 5, iteration 2, 2026-10-28: FAIL

Iteration 2 answers the four items of the iteration 1 verdict above. It is test code in `back.spec.ts`, section 23's wording, and one product fix in `src/scripts/family/links.ts`: on the poster path the families are now centred again at the load event. The whole round is still uncommitted on `family/round-5-return-loader`: 19 files, 1,060 lines in and 144 out (`git diff`, iterations 1 and 2 together, this log included), and the nine PNGs.

Items 1, 2 and 4 are closed. Item 3's runs are done: all 42 browser rows pass, the three ways in run the full loader at both sizes, and the poster row now proves the centring. The round fails on the `links.ts` fix itself. Its new centring at the load event runs whatever happened before it:
- it undoes a scroll the visitor made while the load was still running;
- on Back to top's way home it centres the families after a fall to the poster, where `toPoster` had kept the top.

The reviewer reproduced both against the 8793 server. On a held load the families also still sit at the top edge until the load event, and then jump.

### How it was checked

- **Verdicts.** PASS, FAIL, BLOCKED, UNPROVEN and n/a as in round 4. CLOSED for an iteration 1 item now met.
- **Frames first, before any code.** The nine PNGs the last full run rewrote (11:21 to 11:27 on 2026-10-28). They were compared with iteration 1's reads in the entry above and with round 4's `family-r4-{390,1280}-arg-after.jpg`.
- **The diff, read in full where iteration 2 touched it:**
  - `back.spec.ts`, all 679 lines, and `links.ts`;
  - section 23's criteria 1, 2, 4 and 5, the phone-row table, "Checked", "Not done" and the "Iteration 2" paragraph.
- **The code around it, read:**
  - `loader.inline.js`, all 88 lines: the fill's clock, and what `cut()` and `skip()` do;
  - `rock-links.ts` (`isReturnVisit`), `to-top.ts`, and `boot.ts` (`toPoster`, `onSoftPoster`);
  - `gate.inline.js` line 11, and the module order in the built `dist/index.html`.
- **The logs, read in full:**
  - `test-results/r5-it2b-back-spec.log`: 42 of 42 in 13.5 min;
  - `r5-it2b-back-spec-run1.log`: 41 of 42;
  - `r5-it2b-landing.log`: 4 of 4;
  - `r5-it2b-frames-poster.log`: 6 of 6;
  - `r5-it2b-poster-1.log` and `r5-it2b-poster-trace.log`;
  - the previous builder's `r5-it2-back-spec.log`: 40 of 42.
- **The logs' line numbers.** The test locations in the logs (133, 659, 899, 914 and so on) are not this file's source lines: the file has 679 lines, and the poster row starts at line 399. The reviewer's own run printed the same numbers against the current file, and a failure's code frame prints the real source lines (`r5-it2-back-spec.log`, "380 |"). So the logs are of this file, and the numbers are the runner's.
- **Tests, run by the reviewer:**
  - `test:unit`: 192, with 191 passing and 1 skipped (ffprobe);
  - `test:family`: 62 of 62;
  - `npx tsc --noEmit`: clean.
- **Rows run by the reviewer** against 8793, one worker, 300 s timeout: 3 of 3 in 1.9 min.
  - The poster row: centre 421.8 of 844 at `scrollY` 564.
  - "The landing at 390, 3D path, the other two ways in": lifts at 15.53 s and 18.55 s, the count's largest one-frame rise 25 and 24, the fill 0.000 s ahead of twice the frame clock, calls `{cut: 0, skip: 0, ready: 1}`.
  - "Reduced motion turned on after the page went 3D".
  - The poster row rewrote `family-r5-390-landing-poster.png` at 12:14. It is the same frame, the families centred; only the countdown changed.
- **Diagnostics of the `links.ts` fix.** Two short scripts of the reviewer's, outside the repository, drove the installed Chrome with the harness's SwiftShader flags against 8793. Runs A to D are in "The `links.ts` fix" below.
- **The worktree's `dist/`** (the `build:test` build of 10:44 on 2026-10-28), read only:
  - the landing's `FamilyLinksNav` module carries the load-time centring (307 B raw);
  - the modules load in this order: SiteLogo, FamilyLinksNav, BackToTop, Quiz, Room, HeroStage;
  - `node scripts/hero/budget.mjs dist --mode test`: critical JS 15.6 KB, total JS 205.9 KB, and 238.7 of 250 KB with section 4 and `scroll.ts`. Every enforced line of section-4-flux.md 6 holds (49).
- **Grep of the 1,060 added lines:** no em or en dash and no emoji. No TODO, FIXME or lorem, outside this log's own words. Every changed file is LF.
- **Not available here:**
  - `/web-design-guidelines` and `visual-critique` are not installed;
  - no Lighthouse run and no real phone;
  - no production build since iteration 2's `links.ts` change.

### The frames

- **The argument screen 3.0 s after it came on** (`-390-`, `-360-`, `-844-`).
  - As iteration 1 read them. "Back to main page" starts at x 16.5, under the wordmark. Back to top's chevron ends near x 374, under "All families". The two share one line near y 808 at 390.
  - The 360 frame keeps the same row. At 844 x 390 the row stands about 68 px under the letters.
  - The frames are now taken at the page's own 3.0 s, once the fade has ended.
- **`-1280-arg-after`.** The control is centred under the letters near y 733, with Back to top under "All families", where `family-r4-1280-arg-after.jpg` has them.
- **`-390-return-loader` and `-1280-`.** The first visit's wordmark loader on the night: "skr" lit and "eed" filling with the count at 57 (390), and the wordmark under a light pass at 30 (1280).
- **`-return-gems`.** The ten gems at rest with their labels at both sizes, and Back to top top right.
- **`-390-landing-poster`.** Now taken after the cross-fade, with nothing of the family page showing through.
  - The countdown is on the poster at the top. The ten swatches stand in two rows, centred: about y 325 to 515 of 844, centre 421.8 by the row's own log.
  - Back to top is not shown, as built: the landing shows it past 0.9 of a screen, and the page stands at 564 px.
  - Under the swatches is about 330 px of night before the quiz. That is the poster tier's track as built.

### Iteration 1 items, re-graded

| # | Verdict | Evidence |
|---|---|---|
| 1 | CLOSED | **The form.** The fill's own `currentTime` is read against the frame's `requestAnimationFrame` timestamp, in the same callback. The row keeps a running minimum of `fill - 2f` over every earlier loading frame, with 0.02 s of tolerance. Both values come from the same frame clock, so a catch-up after a long task (both jump together, at rate 1) passes, and so do a hold and the rate-2 catch-up. **A cut.** `cut()` is `fA.finish()` (loader line 77): the fill jumps to 4.96 s in one frame while the clock moves one frame, so the bound fails for any cut from a fill below 4.94 s less two frames. The init script turns `__skreedLoader` into an accessor, so it wraps `cut`, `skip` and `ready` on the object the loader assigns before any other script can read it; any cut or skip is counted, whatever the fill. `skip()` (line 78) also leaves no exit phase and `tl` short of 7.05, which the end-state read catches. So the row catches a cut two ways and a skip three. `fA` has `fill: 'forwards'`, so it stays `getAnimations()[0]` on `#ldFill` through the exit, and the samples read the right animation. **The reviewer's iteration 1 form was wrong.** `tl` against `performance.now()` mixes two clocks: it stood 1.05 to 2.08 s over its bound in all 19 landings that logged it (run 1, the landing-only run, the last full run and the reviewer's), against at most 0.000 s for the asserted form. The builder was right to log it and not assert it. **Results.** Every landing passes: in the last full run, the landing-only run and the reviewer's run, and the five of run 1 that passed. The count never falls; calls `{cut: 0, skip: 0, ready: 1}`; the end state is `done`, 100 and 7.05. The phases pass `exit` then `enter`. Run 1's 390 press row failed at the phases: a gap of more than 500 ms between frames hid `enter`. The sampler now also reads the phase at each change of the count, and `enter` is seen in 0 to 9 frames and at the count's 100 in every landing since. **The wording** of criterion 2's bullets matches the row, except the 20 ms (item 3) |
| 2 | CLOSED | **`hold()`** pauses 2 s ahead. `pauseAt` fires each due timer at most once, and the control's timer starts at the next `toEnd()`, after the pause, so nothing measured moves. **"When it shows"** asserts the timing objects, then awaits `finished` before reading opacity and `hidden`. The exit is read inside the scroll event that starts it: 200 ms on `cubic-bezier(0.55, 0.085, 0.68, 0.53)`, fill forwards. **The hover row** waits for the arrival's end and polls the 150 ms transitions. **The reduced-motion row** awaits the page's own scroll event and checks `hidden` with a retrying assertion; its `Element.prototype.animate` spy counts 0 calls on `#famBack`. All four rows pass in both full runs, and the reduced-motion row in the reviewer's run. **The frames row** now reads the page's clock: `hidden` dropped 2,515 to 2,693 ms after the argument came on, over eight readings. That closes the previous builder's 1280 failure |
| 3 | CLOSED, with a new fault | **Criterion 1's other two ways in** are a new row at each size, and both pass in all three logged runs and in the reviewer's 390 run. The Back is asserted as `back_forward`, with `pageshow` not persisted and no hash, so `RET` holds by the navigation type alone. **The poster row** waits for the load event and the end of the cross-fade, then asserts the nav's centre within 4 px of the layout viewport's. It passes five times in the builder's runs and once in the reviewer's, and the frame is retaken. **The cause the builder found is right.** The browser's fragment scroll ran after the module's centring: the trace has iteration 1 ending at 844 (centre 141.8), and as built at 564 (centre 421.8) to 1.5 s after the load event. **But the fix's load-time call is unconditional** (items 1 and 2 of the verdict) |
| 4 | CLOSED | **The gaps.** The table and criterion 5 read 77.7, 92.7, 107.7 and 147.7 px, as `back.test.ts` does. The one 77.8 left is in "Checked", recording the correction. **"Not done"** records the owner's run: 34 of 40, the six failures and their causes, the sampler's figures and the frames. **`links.ts`'s comment** no longer names the loader's skip path |

### The `links.ts` fix

`centre()` scrolls `nav#families` to the middle when `isReturnVisit()` is true and `html.hero3d` is not set. Since iteration 2 it runs when the module runs and again at the load event, once. `isReturnVisit()` is true for the hash `#families` and for any `back_forward` load (`rock-links.ts` line 37).

| Case | Result | Evidence |
|---|---|---|
| The 3D path | PASS: nothing while `html.hero3d` stands | The gate sets the class before any module runs (`gate.inline.js` line 11). The six landings hold 14.5 screens at the lift and after |
| A plain first visit | PASS: nothing | Run D, the poster tier at `/`: `navigate`, no hash, `scrollY` 0 after the load event |
| Back to top's way home, 3D path, cache missed | PASS without a fall; FAIL after a fall to the poster before the load event | Run C at 1280 x 800: the landing pinned to `hero3d` and served `no-store`, the hero chunk refused and the fonts held 6 s. `toPoster` ran at 401 ms and kept `scrollY` 0 (no hash, since the loader's `TT` dropped it). The load event came at 6,414 ms, still at 0. At 6,620 ms the page stood at 482, the nav's centre at 400.4 of 800: `links.ts`, by `back_forward`. The control, with no refusal and no hold, stayed at 0 with the loader up (`html.loading`), `back_forward`, not persisted. New in iteration 2: at module time the class was `hero3d`, so the old single call did nothing |
| The visitor's scroll before the load event, poster path | FAIL | Run A at 390 x 844 on `/#families`, the images and fonts held 4 s. 600 ms after `DOMContentLoaded` (`interactive`), the page stood at 844 with the nav at the top edge (centre 141.8), because the browser's fragment scroll repeats until the load event. A 600 px wheel took the page to its end (1,128). At the load event it was pulled back to 564. The browser's own fragment scroll stops at the visitor's first scroll; `centre()` does not |
| Back to top's way home, poster tier, cache missed | Older, not this round's | Run B: a click on Blissful Blue's swatch (history entry `/#families`), then Back to top. The landing loaded `back_forward`, not persisted, and stood at 564, the families centred. `links.ts` has centred on this load since round 4 (the same condition at module time), and the poster tier keeps the browser's own scroll restoration, because the loader that sets `manual` returns before line 10 there. So the press never reached the top on this tier; the load-time call now makes it certain. `to-top.ts` line 90's "a fresh load starts at the top anyway (loader.inline.js)" holds on the 3D path only. The landing's URL read without its hash after the routed reload |

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | The diff against rules 1 to 50: no violation. Iteration 2 adds test code and one instant scroll in `links.ts`, with no motion, colour, type or copy. No dash, emoji or buzzword in any added line (rules 3, 16, 17, 27, 29). Still failing, outside the diff and carried: rules 46 and 47, with no privacy or terms page in `dist/` |
| A2 | PASS | Pearl Whisper only; the loader's `--night` and light are E-A2 |
| A3 | PASS | The rows "shown at" pass at 390 and 1280 in both full runs: Open Sans 600, 14 px, line height 14 px. The loader's type is E-A3's |
| A4 | PASS | No copy changed |
| A5 | PASS | The argument screen shows the case; the loader screen is the hero's own, under E-H1 |
| B1 | PASS | Playwright PNGs at 390 and 1280 of the argument screen, the return loader and the gems. The poster frame is now taken after the cross-fade |
| B2 | PASS | Criterion 5's seven rows and criterion 6's four pass in both full runs: no horizontal scroll, the words at `--inset`, both controls 44 px tall |
| B3 | PASS | Same-origin links. The `sessionStorage` flag is Back to top's, unchanged |
| B4 | PASS | Nothing uses or animates `svh` or `dvh` |
| C1 | PASS | Test build: critical JS 15.6 KB (production 15.3 KB at iteration 1). `links.ts` adds about 90 B raw to a module of 0.2 KB gzip. Item 3 asks for the production run |
| C2 | n/a | No image |
| C3 | PASS | `links.ts` scrolls instantly and animates nothing. The C3 guard passes in `test:family` |
| C4 | UNPROVEN | Lighthouse not run (open record) |
| D1 | PASS | The loader on the way back is E-H1's; the control's wait is E-F5's |
| D2 | PASS | The reduced-motion row passes in both full runs and the reviewer's: shown at 2.5 s with opacity 1 and no animation, hidden at once, `animate()` never called on the control. The landing's reduced-motion tier is the poster (criterion 4) |
| D3 | FAIL | Items 1 and 2: Back to top's way home after a fall, and the slow network on the poster path's way back |
| D4 | PASS | The hover row passes: the lift to `matrix(1, 0, 0, 1, 0, -1)`, the press to 0.98, opacity 1 throughout |
| E1 | BLOCKED | `/web-design-guidelines` is not installed |
| E2 | BLOCKED | `visual-critique` is not installed; the reviewer's critique by eye is in the notes |
| E3 | PASS | The keyboard row passes. Contrast medians: 19.43:1 for the three families at 390; 15.50, 15.50 and 16.16:1 at 1280; the lowest single frame 12.6:1 in the last full run. Zero CSP violations. The new rows test nothing that E3 does not already cover |
| E4 | PASS | Writes no data |
| E5 | n/a | No database |
| G1, G3, G4, G6, G7, G8 | PASS | Not touched; present in `dist/` |
| G2, G11 | n/a | E-G2; no Reserve on the family pages |
| G5, G15, G16, G18, G19, G23, G24, G26 | FAIL | Carried, not this round's: no `og:image` on `/`, no privacy or terms pages, no analytics, contact line, FAQ or LocalBusiness JSON-LD |
| G9, G12 | PASS | No image added; no data loaded |
| G10 | PASS | Criteria 5 and 6 at 360, 375, 390, 430, 768, 900, 1024, 1280 and 1366 px wide, and at 780 x 360 and 844 x 390 |
| G13, G14, G17, G20, G22, G25 | n/a | No form, thanks state, cookies, cutover or founders' note here; breadcrumbs n/a on the teaser |
| G21 | PASS | The press, the direct load and the Back each land at 14.5 screens with `nav#families[data-placed]` and ten links, in both full runs |
| G27 | PASS | Nothing fabricated |
| H | FAIL | As D3: the slow network and the error path of Back to top's way home |
| F1 | FAIL | Criterion 4 (below) |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the added lines |

### Acceptance criteria (round 5, section 23)

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | All three ways in, at both sizes: the press, a direct load of `/#families`, and the Back with the cache missed (`back_forward`, not persisted, no hash). They pass in run 1, the landing-only run, the last full run and the reviewer's 390 run. In every one: `#intro.ret`, the wordmark and the count not `display: none` from the first sample to the lift, and the count past 30. The frames show the wordmark filling and the count (57 at 390, 30 at 1280) |
| 2 | PASS | **The parity test passes.** **In the browser,** over every logged landing: the lift came 11.2 to 18.55 s after the time origin, all past 7.5 s; the count never falls; the fill is at most 0.000 s ahead of twice the frame clock (the bound is 0.02 s); calls `{cut: 0, skip: 0, ready: 1}`; `exit` then `enter`; and once `#intro` is gone, `done`, 100 and 7.05. The count's largest one-frame rise was 31: the c3 catch-up allowed by the bullet. **The form** is judged in item 1 above. **The wording** lacks only the 20 ms (item 3) |
| 3 | PASS | In all landings: `scrollY` is 14.5 times `innerHeight` within 2 px at the lift, on every sample after it and 1 s later; section 2 is ready on the last loading sample; ten placed links. The frames show the gems at rest |
| 4 | FAIL | **The poster row** passes after the load event: centre 421.8 of 844, five builder runs and the reviewer's. **Items 1 and 2:** the load-time centring moves the families onto Back to top's way home after a fall (run C), and undoes the visitor's scroll on a held load (run A), where the families sat at the top edge until the load event. **Still with no browser row** (open record): the stall, the refused module on `/#families`, the lost context and the failed fetch |
| 5 | PASS | All seven phone rows pass in both full runs (the row, the baseline, the gaps, the 390 x 844 figures within 2 px), and `back.test.ts` passes |
| 6 | PASS | All four wide rows pass in both full runs: centred within 1 px, 711.2 to 755.2 at 1280 x 800, Back to top at 91.3 to 135.3 |
| 7 | PASS | The DOM and Tab order (the keyboard row), `backTimer` off at 5.6 screens and below (`back.test.ts`), and the timings and words (unit tests). Section 22's criteria 1, 2, 4, 5 and 6 pass in the browser (next table), and criterion 6's contrast is measured where the words stand (E3) |
| 8 | PASS | On the test build every enforced line holds (49), and the C3 guard passes. No em or en dash in any changed file. Iteration 1's production figures stand for the loader, the hero chunk and the stylesheets, which iteration 2 left alone; `links.ts` adds about 90 B raw. The production run after the next fix is item 3 |

### Section 22's criteria under round 5

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | The built HTML row (one control on each of three families, after `#toTop`, named by its text) and the computed-style rows at 390 and 1280 |
| 2 | PASS | **The held-clock rows** pass at both sizes in both full runs: hidden at 2,499 ms and shown at 2,500 ms; the 400 ms arrival on `cubic-bezier(0.2, 0, 0, 1)`, awaited to its end; up at 1.0 s and down at 2.0 s shows it at 4.5 s; up after it showed, the 200 ms exit on `--ease-in`, then hidden. **The frames rows** read the page's clock: every frame before 2.4 s hidden, and the first at or after 3.0 s shown |
| 3 | PASS | Replaced on phones by round 5's criterion 5; held on the wide layout by criterion 6 |
| 4 | PASS | The seven grid rows and the `fam:grid` row pass in both full runs |
| 5 | PASS | The plain-click row; the hover row; the poster row, now with the centring; and the 3D landing rows (round 5's criteria 1 to 3) |
| 6 | PASS | The keyboard row, the reduced-motion row, the six contrast medians and zero CSP violations |

### Verdict: FAIL

All three items can be done on this machine: one product file, its tests and the record. The owner's rerun of `back.spec.ts` then grades them.

1. **`links.ts`: never centre on Back to top's way home (criterion 4; D3; H; section 23's states rows "Back to top's way home" and "Error").**
   - **The fault, new in iteration 2.**
     - `centre()` asks `isReturnVisit()`, which is true for any `back_forward` load. Back to top's way home on a cache miss is one, with the hash dropped by the loader's `TT`.
     - On the 3D path, the call at module time does nothing (`hero3d`). A hard fall before the load event then replaces the class with `poster`, and `toPoster` keeps the top, since there is no hash. The load-time call then centres the families.
     - Reproduced in run C: `scrollY` 0 from the fall at 401 ms to the load event at 6,414 ms, then 482, the nav's centre at 400.4 of 800.
   - **Change.**
     - Treat a load that carries Back to top's flag as no return, as the loader's `TT` does, at both calls.
     - `FamilyLinksNav`'s module runs before `BackToTop`'s, which clears the flag (`to-top.ts` line 92; the module order in `dist/index.html`). So `links.ts` can read `sessionStorage['skreed:to-top']` when its module runs. Pin that order with a test, or carry the decision on the document from an inline script.
   - **Prove it.**
     - A browser row as run C: the landing pinned to `hero3d` and served `no-store`, Back to top pressed on a family page, the hero chunk refused and the fonts held so that the fall comes first. Assert `scrollY` 0 one second after the load event.
     - A source test in `return-path.test.ts`.
2. **`links.ts`: keep the families centred while the load runs, and never move the page after the visitor's own scroll (criterion 4; D3 and H, slow network).**
   - **The fault.** Run A, the poster path at 390 x 844 on `/#families`, with the images and fonts held 4 s:
     - 600 ms after `DOMContentLoaded` the nav sat at the top edge (`scrollY` 844, centre 141.8);
     - a 600 px wheel took the page to its end (1,128);
     - at the load event `centre()` pulled it back to 564.
     - With no scroll of the visitor's, the families sit at the top edge for the whole held load, then jump 280 px under the finger.
     - The poster tier is the slow tier (data saver, 2G, low memory), so a long load is its normal case. The same call also re-centres a soft poster that came before the load event after the visitor has moved it, which resets `onSoftPoster`'s 8 px measure.
   - **Change.** Hold the families centred from the module's call to the load event, and stop at the visitor's first `wheel`, `touchstart`, `keydown` or `pointerdown`, as the browser's own fragment scroll does. For instance:
     - re-centre on each `scroll` event until the load event or that first input, in place of the unconditional load-time call;
     - or, off the 3D path, give `nav#families` an inline `scroll-margin-top` of half the layout viewport less half its height, so that the browser's own fragment scroll lands it centred.
   - **Prove it.**
     - The poster row again, with the images and fonts held 4 s: the nav's centre within 4 px of the layout viewport's at 1 s, at 3 s and 1 s after the load event.
     - A variant with a 600 px wheel at 1 s whose `scrollY` still stands 1 s after the load event.
3. **The record (F1; criterion 8).**
   - **Section 23.** The poster-path line, the iteration paragraph and `links.ts`'s comment say what the fixed code does, and record runs A to D.
   - **Criterion 2's second bullet.** Add the 20 ms the row allows ("never more than 20 ms ahead of twice the frame clock"). The row and the "Iteration 2" paragraph say 0.02 s; the criterion does not.
   - **"Built".** Run a production `npm run build` after the change, and record the landing's critical JS and the links module's size. The last production figures are iteration 1's, from before `links.ts` changed. On the test build every line holds: 15.6 KB critical, 238.7 of 250 KB.

### Open records

These are not FAIL in the builder's hands. Each needs a machine, a tool or an input the loop does not have.

- **The rerun of `back.spec.ts`** after items 1 to 3, on the owner's machine.
- **The way back's failure paths as browser rows** (criterion 4; D3, H):
  - a stall (`__skreedStall`);
  - a module script refused on `/#families`;
  - a lost context;
  - a failed fetch.
  - Run C exercised one refused chunk on Back to top's way home, not as a spec row.
- **Back to top's way home on a cache miss, 3D path.** Seen once in the reviewer's control: `scrollY` 0, the loader up, `back_forward`, not persisted. Item 1's row can carry it.
- **The poster tier's Back to top on a cache miss lands on the families** (run B, older than this round).
  - Item 1 takes `links.ts` out of it. The browser's own scroll restoration would then still keep the visitor's old place, because the loader that sets `manual` does not run on that tier.
  - This is for the owner, outside this round's criteria. `to-top.ts` line 90's "a fresh load starts at the top anyway (loader.inline.js)" is true on the 3D path only.
- **A real phone:** the loader's count catch-up on a real GPU (the c3 block was 1.2 to 1.6 s on SwiftShader), the row's safe areas, and round 4's `innerHeight` against `100svh` question on iPhone.
- **Lighthouse mobile (C4).**
- **E1 and E2: BLOCKED.**
- **The carried site essentials:** A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26.
- **The Workers runtime's crash during a short run** is the hand-off's account. There is no log of it here, and neither full run met it.

### Pending Sam (graded as built until he answers; spec 12 items 6, 7, 11 and 12)

- **The words:** "Back to main page" or "Back to the families". On phones both bottom controls read "Back to" on one line.
- **The wait:** 2.5 s.
- **The way back's length:** the landing's full loader, or the family pages' faster finish. In this harness the lift came 11.2 to 18.6 s after the time origin, on SwiftShader; judge it on a phone.
- **The phone row:** one row as built, stacked at the right, or under the letters.

### Notes (not graded as FAIL)

- **Visual critique by eye of the 390 frame (in place of E2).**
  - **As iteration 1 read it.** The bottom row mirrors the top row. Two "Back to" labels sit on one line, only one with an icon (the words question). About 330 px of night lies between the letters and the row (D4's reading).
  - **Older, not this round's.**
    - The case covers "BEYOND" at 390.
    - At 844 x 390 three cases stand over the letters, the left one over the G, and the right case's top comes within a few px of "All families".
    - 1280 shows one case where round 4's frame showed five.
  - **New this iteration.** The poster frame reads well: the countdown, then the families centred with their names. The night under the families is the poster tier's track, as built.
- **The loader's frames** differ from iteration 1's only in the count at capture (57 and 30, against 44), since the capture is a wall-clock wait into a load of varying length.
- **`r5-it2b-poster-trace.log`** and the reviewer's run A agree on the fast case: the browser's fragment scroll lands the nav at the top edge (844) on or just after the load event, and the load-time call wins by running after it. So the fix's end state is right whenever the visitor has not moved first.

## Round 5, iteration 3, 2026-10-28: FAIL

Iteration 3 answers the three items of the iteration 2 verdict above. It is one product file, `src/scripts/family/links.ts` (27 lines in, 9 out), its source test in `return-path.test.ts` (31 in, 3 out), three browser rows in `back.spec.ts` (139 in, 1 out) and section 23's record (10 lines in, 7 out). The whole round is still uncommitted on `family/round-5-return-loader`: 19 files, 1,468 lines in and 146 out before this entry, and the nine PNGs.

All three iteration 2 items are closed. Back to top's way home now keeps the top after a fall, and the held load keeps the families centred to the load event and lets go at the visitor's first input. The reviewer's own runs confirm both, and listener hygiene holds on every path tried.

The round still fails, on three things the reviewer found in this iteration:
- **The poster tier's Back.** On the poster tier proper (reduced motion, so the loader never runs and the browser keeps its own scroll restoration), the browser's Back from a family page with the cache missed does not end centred. The browser restores the visitor's old place 3 to 19 ms after the load event, after `links.ts` has let go.
- **The poster frame.** The poster row's frame was caught mid cross-fade again.
- **The record.** It calls the harness's fall path "the poster tier", and section 23's budget paragraph no longer matches the build.

### How it was checked

- **Verdicts.** PASS, FAIL, BLOCKED, UNPROVEN, n/a and CLOSED, as in iteration 2.
- **Frames first, before any code.** The nine PNGs the full run rewrote (12:44 to 12:51 on 2026-10-28), compared with iteration 2's reading above.
- **Iteration 3's own change, isolated.**
  - The reviewer's snapshot of the iteration 2 diff (taken at 12:12, before iteration 3) was applied to `HEAD` outside the repository and compared with the worktree. Only `links.ts`, `return-path.test.ts`, `back.spec.ts`, section 23 and this log changed since iteration 2.
  - The other 15 changed files are byte for byte as iteration 2 left them.
- **Read in full:**
  - `links.ts`, and its built module in `dist/_astro/` (643 B);
  - the new test and the three new rows;
  - section 23's poster-path line, criterion 2's second bullet, criterion 4, the states table, the budget paragraph, "Checked", "Not done" and the "Iteration 3" paragraph;
  - `to-top.ts` lines 60 to 100, `loader.inline.js` lines 1 to 20, and `rock-links.ts`'s `isReturnVisit` and `installViewTransitionScope`.
- **The logs, read in full:** `test-results/r5-it3-back-spec.log` (45 of 45), `r5-it3-new-rows.log`, the four `r5-it3-diag-*.log`, `r5-it3-build-prod.log`, `r5-it3-family-budget-prod.log`, `r5-it3-unit.log` and `r5-it3-family.log`.
- **Tests, run by the reviewer:**
  - `npx tsc --noEmit`: clean;
  - `test:family`: 63 of 63;
  - `test:unit`: 192, with 191 passing and 1 skipped (ffprobe).
- **The three new rows**, run by the reviewer against 8793 (one worker, 300 s timeout): 3 of 3 in 34.2 s.
  - The held load: centred at 421.8 of 844 at 1 s, at 3 s and 1 s after the load event; `DOMContentLoaded` at 487 ms, the load at 4,347 ms, 694 frames.
  - The wheel: 564 to 1,128 by 2,048 ms, and 1,128 1 s after the load event (4,210 ms).
  - Back to top's way home: the fall at 391 ms, the load at 6,327 ms, 952 frames none off the top. The control at 0 with the loader up.
  - These rows take no frames, so no repository file was rewritten.
- **The server.** 8793 serves the 13:00 test build. Its landing's links module is `FamilyLinksNav...DHUWdoxD.js`, the same chunk as the production log's, and its module scripts come in the order SiteLogo, FamilyLinksNav, BackToTop, Quiz, Room, HeroStage.
- **Diagnostics.** The reviewer's own scripts, outside the repository, drove the installed Chrome with the harness's SwiftShader flags against 8793:
  - `diag-totop3d.cjs` and `diag-links.cjs` from iteration 2;
  - four new ones: painted frames, listener hygiene, the poster row's wait, and the poster tier's Back.
  - **Painted frames** were read from the browser's screencast, whose metadata gives each composited frame's scroll offset. That is a capture of what was painted, not a sample taken before layout.
  - **Listeners** were read by wrapping `addEventListener` and `removeEventListener` on `window` in an init script and keeping the calls whose stack is the links module's.
  - Results are in the tables below.
- **Grep of every changed file and of the added lines:** no em or en dash, no emoji, no AI product name; every changed file is LF. No TODO, FIXME or lorem outside this log's own words.
- **Not available here:**
  - `/web-design-guidelines` and `visual-critique` are not installed;
  - no Lighthouse run and no real phone;
  - the headless harness hides scrollbars, so a scrollbar drag was not tried.

### The frames

- **The argument screen 3.0 s after it came on** (`-390-`, `-360-`, `-844-`, `-1280-`). As iteration 2 read them.
  - At 390, "Back to main page" starts at x 16.5 and Back to top's chevron ends near x 374, on one line near y 808.
  - At 360 the row is near y 744. At 844 x 390 it is about y 354, under the letters.
  - At 1280 the control is centred under the letters near y 733, with Back to top under "All families".
  - Only the case's pose differs from iteration 2's frames.
- **`-390-return-loader` and `-1280-`.** The wordmark under a light pass on the night, the count at 30 (390) and 29 (1280). Iteration 2's frames read 57 and 30; the capture is a wall-clock wait into a load of varying length.
- **`-return-gems`.** The ten gems at rest with their labels at both sizes, and Back to top top right. As before.
- **`-390-landing-poster`: regressed.** It was caught mid cross-fade again, as in iteration 1. The family page shows through the landing:
  - its case and GO / BEYOND BASIC across the swatches;
  - "All families" top right;
  - "Back to main page" and Back to top at the bottom.

  The swatches themselves stand about y 328 to 515 of 844, centred, as the row's log says (421.8). Item 2 below.

### Iteration 2 items, re-graded

| # | Verdict | Evidence |
|---|---|---|
| 1 | CLOSED | **The code.** `links.ts` reads `sessionStorage['skreed:to-top']` inside a try before `isReturnVisit()` and does nothing when it is set; it never writes the flag. **The order** it relies on holds three ways: `index.astro` mounts `FamilyLinks` before `BackToTop`, the served landing's module scripts come in that order, and module scripts run in document order. `return-path.test.ts` pins the first two. **Run C again, without the spec:** the fall to the poster at 276 ms, the load at 6,090 ms, and `scrollY` 0 at every change and 1.5 s after (`back_forward`, not persisted, no hash). The control stood at 0 with the loader up. **The new row** passes in the full run and in the reviewer's (above). **Run B** (no pin; the harness's own fall, at 189 ms) now ends at 0 with the hash dropped, where iteration 2 read 564 |
| 2 | CLOSED | **The hold.** The page is centred at the module, re-centred on each scroll before the load event, centred once more at the load event, and left alone from the visitor's first `wheel`, `touchstart`, `keydown` or `pointerdown`. **The rows** pass in the full run and the reviewer's. **On the poster tier proper, the reviewer's runs:** reduced motion, `html.poster` from the first class stamp, the browser's restoration left on `auto`: the fragment's scroll to 844 was re-centred 2 to 7 ms later, and the page stood at 564 through the held load and after it. **In painted frames** (the screencast, seven held loads, four on the harness's fall path and three on the poster tier proper): every frame stood at 0 (the blank page before the navigation, or the landing's top before the module ran) or at 564, never at 844. The two wheel runs moved only with the wheel and kept 1,128 through the load event. **A key** (End at 1280, held 3 s): the listeners went at 974 ms and the page kept 965 through the load event at 3,117 ms. The fault found under this iteration's code is a scroll after the load event, a different one (verdict item 1) |
| 3 | CLOSED | **Section 23 carries the fixed code.** The poster-path line, criterion 4, two new states rows and the iteration 3 paragraph describe it, and `links.ts`'s comment says what the code does. **The 20 ms.** Criterion 2's second bullet now reads "never more than 20 ms ahead of twice the frame clock", as the row allows. **The production build** is recorded with its log: critical JS 15.5 KB, total JS 204.8 KB, 237.2 of 250 KB with section 4 and `scroll.ts`, the hero chunk `hero.CKiDk_2_.js` at 54.5 KB gzip (55,826 B), and the family page unchanged. The record's new faults are verdict item 3 |

### `links.ts`, path by path

| Case | Result | Evidence |
|---|---|---|
| The 3D path, `/#families` | PASS: nothing while `html.hero3d` stands | The landing pinned to `hero3d`: the six listeners were added at 165 ms and removed at the load event (172 ms) with no centring. The loader's snap took the page to 11,600, 14.5 times 800. The six landings of the full run held 14.5 screens at the lift and after |
| A plain first visit | PASS: no centring, no listener | `navigate`, no hash. No listener of the links module's was added (only `installFamilyLinks`'s `pageswap`, round 4's), no scroll event, `scrollY` 0 |
| Reduced motion, `/#families`, not held | PASS | Centred at 421.8 of 844 (564). The listeners were added at 146 ms and all removed at the load event (149 ms) |
| The harness's "poster path" (the fall at about `DOMContentLoaded`), `/#families`, held 4 s | PASS | Rows and the reviewer's runs as in item 2 |
| The poster tier proper, `/#families`, held 4 s, with and without a wheel | PASS | Item 2 |
| Back to top's way home, 3D path, cache missed, a fall before the load event | PASS | Item 1 |
| Back to top's way home, poster tier proper, cache missed | Older, not this round's (open record) | Reduced motion. The visitor left the landing at 513. The landing loaded `back_forward` with `#families` kept, and the browser restored 513 at 67 ms. `links.ts` did nothing (the flag), and the page stood at 513 after the load event (centre 472.8). Back to top does not reach the top on this tier; iteration 2 read 564, so the press missed the top there too |
| **The browser's Back, poster tier proper, cache missed** | **FAIL** | **Four runs.** Reduced motion; the landing at `/`, the families brought into view, a click on Blissful Blue, the landing served `no-store`, then Back. Each was `back_forward`, not persisted, `#families` kept, `history.scrollRestoration` `auto`. **Left at the swatches (513), nothing held:** the browser restored 513 at 52 ms; `links.ts` had centred it (564) by `DOMContentLoaded` at 162 ms; the load event came at 163 ms; and at 166 ms the browser restored 513 again. It stood there 1.5 s later, the nav's centre at 472.8 of 844. **The same with the images and fonts held 3 s:** 564 from 126 ms through the load event at 3,085 ms, then 513 at 3,104 ms. **Left 300 px lower (813):** the same at 150 ms and 3,100 ms, ending at 813 with the nav's centre at 172.8. **The cause, confirmed.** With `history.scrollRestoration` set to `manual` at `DOMContentLoaded` by the reviewer's init script, the same two runs from 813 ended at 564, centre 421.8. **Older code.** The load-time centring of iteration 2, and round 4's module-time one, would lose to the same restoration. But the case is this round's criterion 4 ("reduced motion's default tier show[s] ... the families centred"), section 23's reduced-motion paragraph and its states row "Reduced motion, poster path". `links.ts`'s comment premise, "the landing keeps manual scroll restoration (the loader)", holds only where the loader runs: it returns at line 6 on the poster tier, before line 10 sets `manual` |
| Listener hygiene | PASS | Six listeners: `scroll` and the four inputs passive, `load` plain. All six are removed by one `stop`, at the load event or the first input, in every run above, and never added on a first visit or once the document is complete. Nothing calls `preventDefault`, in the source and in the built module |

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | The diff against rules 1 to 50: no violation. Iteration 3 adds one instant scroll held to the load event, with no motion, colour, type or copy (rules 12, 14 and 48 untouched). No dash, emoji or buzzword in any added line (rules 3, 16, 17, 27, 29). Still failing, outside the diff and carried: rules 46 and 47, with no privacy or terms page in `dist/` |
| A2 | PASS | Pearl Whisper only; the loader's `--night` and light are E-A2 |
| A3 | PASS | The "shown at" rows pass at 390 and 1280 in the full run |
| A4 | PASS | No copy changed |
| A5 | PASS | The argument screen shows the case; the loader screen is the hero's own, under E-H1 |
| B1 | FAIL | Item 2: `family-r5-390-landing-poster.png` was taken mid cross-fade, with the family page showing through the landing. The other eight frames are as graded |
| B2 | PASS | Criterion 5's seven rows and criterion 6's four pass in the full run |
| B3 | PASS | Same-origin links; `links.ts` only reads the flag, inside a try |
| B4 | PASS | Nothing uses or animates `svh` or `dvh` |
| C1 | PASS | Production: critical JS 15.5 KB of the 60 KB line (15.3 KB at iteration 1); total JS 204.8 KB, 237.2 of 250 KB with section 4 and `scroll.ts`. The links module is 643 B raw and 387 B gzip, against about 204 B gzip at round 4 by the reviewer's esbuild check of the two sources. Section 23's own budget paragraph no longer matches: item 3 |
| C2 | n/a | No image |
| C3 | PASS | `links.ts` scrolls instantly and animates nothing; the C3 guard passes in `test:family` |
| C4 | UNPROVEN | Lighthouse not run (open record) |
| D1 | PASS | The loader on the way back is E-H1's; the control's wait is E-F5's |
| D2 | PASS | The reduced-motion row passes; `links.ts`'s centring is instant |
| D3 | FAIL | Item 1: the poster tier's Back with the cache missed ends at the restored place |
| D4 | PASS | The hover row passes |
| E1 | BLOCKED | `/web-design-guidelines` is not installed |
| E2 | BLOCKED | `visual-critique` is not installed; the reviewer's critique by eye is in the notes |
| E3 | PASS | The keyboard row passes; contrast medians 19.43:1 for the three families at 390 and 16.14, 15.46 and 15.99:1 at 1280, the lowest single frame 12.7:1; zero CSP violations |
| E4 | PASS | Writes no data |
| E5 | n/a | No database |
| G1, G3, G4, G6, G7, G8 | PASS | Not touched; present in `dist/` |
| G2, G11 | n/a | E-G2; no Reserve on the family pages |
| G5, G15, G16, G18, G19, G23, G24, G26 | FAIL | Carried, not this round's: no `og:image` on `/`, no privacy or terms pages, no analytics, contact line, FAQ or LocalBusiness JSON-LD |
| G9, G12 | PASS | No image added; no data loaded |
| G10 | PASS | Criteria 5 and 6 at every listed size |
| G13, G14, G17, G20, G22, G25 | n/a | No form, thanks state, cookies, cutover or founders' note here; breadcrumbs n/a on the teaser |
| G21 | PASS | The press, the direct load and the Back land at 14.5 screens with ten placed links in the full run |
| G27 | PASS | Nothing fabricated |
| H | FAIL | As D3: the slow tier's Back with the cache missed |
| F1 | FAIL | Criterion 4 (item 1) and the record (item 3) |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the added lines |

### Acceptance criteria (round 5, section 23)

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | All three ways in at both sizes in the full run: `ret`, the wordmark and the count from the first sample to the lift, the count past 30. The frames show the wordmark and the count (30 and 29) |
| 2 | PASS | The parity test passes. The six landings: the lift 9.75 to 19.83 s after the time origin; the count never falls and rose at most 28 in one frame; the fill at most 0.000 s ahead of twice the frame clock; calls `{cut: 0, skip: 0, ready: 1}`; `enter` in 1 to 8 frames and at the count's 100; `done`, 100 and 7.05 at the end. The wording now carries the 20 ms |
| 3 | PASS | 14.5 screens within 2 px at the lift and after, section 2 ready first, ten placed links, in all six landings; the frames show the gems at rest |
| 4 | FAIL | **Item 1:** reduced motion's default tier does not end centred after the browser's Back with the cache missed. **Item 2:** the poster row's frame contradicts the row's own caption, "once the cross-fade is over". **PASS within it:** the held load and the wheel on both the fall path and the poster tier proper; Back to top's way home after a fall. **Still with no browser row** (open record): the stall, the refused module on `/#families`, the lost context and the failed fetch |
| 5 | PASS | All seven phone rows pass in the full run, and `back.test.ts` passes |
| 6 | PASS | All four wide rows pass in the full run |
| 7 | PASS | The keyboard row, `backTimer` off at 5.6 screens and below, the timings and words, and section 22's criteria below |
| 8 | PASS | Production build, every enforced line holds (49) and both guards pass. The inline scripts row is as iteration 1 left it (4.8 KB). The hero chunk is iteration 1's. The family page module is unchanged (7,070 B gzip, `BInCOMKE`). The C3 guard passes, and no changed file carries an em or en dash. The budget paragraph above the criteria is item 3 |

### Section 22's criteria under round 5

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | The built HTML row and the computed-style rows at 390 and 1280 |
| 2 | PASS | The held-clock rows at both sizes; the frames rows dropped `hidden` at 2,520.5 ms (390) and 2,511.6 ms (1280) after the argument came on |
| 3 | PASS | Replaced on phones by round 5's criterion 5; held on the wide layout by criterion 6 |
| 4 | PASS | The seven grid rows and the `fam:grid` row |
| 5 | PASS | The plain-click row, the hover row, the poster row's centring assertion and the 3D landing rows. The poster row's frame is B1 |
| 6 | PASS | The keyboard row, the reduced-motion row, the six contrast medians and zero CSP violations |

### Verdict: FAIL

All three items can be done on this machine: one line of product code, test code, a frame and the record. The owner's rerun of `back.spec.ts` then grades them.

1. **`links.ts`: keep the families centred after the load event on the poster tier's Back (criterion 4; section 23's reduced-motion paragraph and its states row "Reduced motion, poster path"; D3; H).**
   - **The fault.** The poster tier proper, the reduced-motion default and by the same code Save-Data, 2g and low memory, keeps `history.scrollRestoration` on `auto`, because the loader returns before its line 10 there.
     - The browser's Back from a family page with the landing's cache missed is a return visit. `links.ts` centres it and holds the centring to the load event.
     - The browser then restores the visitor's old place 3 to 19 ms after the load event, once `links.ts` has let go.
     - Left at the swatches: 513, centre 472.8 of 844. Left 300 px lower: 813, centre 172.8. Held 3 s or not.
   - **Change.**
     - When `links.ts` decides to centre (a return visit, no Back to top flag), set `history.scrollRestoration = 'manual'` before the load event, as the loader does on the 3D path. The reviewer's init script doing this at `DOMContentLoaded` brought both runs from 813 to 564, centre 421.8.
     - Correct the comment's "the landing keeps manual scroll restoration (the loader)": the loader sets it only on the 3D path.
     - Leave Back to top's way home on that tier as it is; it is an open record, outside this round.
   - **Prove it.**
     - A browser row under `reducedMotion: 'reduce'`, the poster tier from the start: assert `html.poster` at the first class stamp and `scrollRestoration` `auto` before the module.
     - Visit `/`, bring the families into view, then 300 px lower. Open a family page by its link, serve the landing `no-store`, and go Back.
     - Assert `back_forward`, not persisted, the nav's centre within 4 px of the layout viewport's 1 s after the load event, and no frame after the load event elsewhere. Run it with the images and fonts held 3 s and without.
     - Extend `return-path.test.ts`'s iteration 3 test to the new line.
2. **The poster row's frame: take it once the cross-fade has ended on screen (B1; criterion 4's frame; section 22's criterion 5).**
   - **The fault.** The row waits until `readyState` is `complete` and no `::view-transition` animation is left, then takes the frame. In this harness that wait ends while the cross-fade is still painted, so the frame shows the family page through the landing.
   - **The reviewer's evidence.**
     - The row's own sequence, run four times: the wait ended 14 to 19 ms after the URL changed, at 696 to 798 ms on the page's clock. `document.activeViewTransition` was still set at that moment in all four.
     - Every frame taken there showed the family page.
     - A frame 0.5 s later was clean (the reviewer's `poster-frame-t300.png` in the scratchpad).
     - The screencast of the press painted the cross-fade for a few hundred ms after the page's own transition had resolved `finished`.
     - Iteration 2's frame was clean by timing.
   - **Change.**
     - Wait for the transition the landing's `pagereveal` reports to resolve `finished`, captured by an init script, and for `document.activeViewTransition` to be null. Then wait a fixed 1 s before the frame.
     - Retake `family-r5-390-landing-poster.png`, and look at it before recording it.
3. **The record (F1).**
   - **Name the harness's "poster path".** The iteration 3 paragraph's runs, the held-load and wheel rows, and the "poster tier's Back" run all begin on `hero3d loading` and fall to the poster at about `DOMContentLoaded`.
     - The builder's own logs show it: `r5-it3-diag-held.log`, "66ms class ... js hero3d loading" then "528ms ... js poster"; `r5-it3-diag-back.log`, 78 ms and 271 ms.
     - So the loader had already set `scrollRestoration` to `manual`.
     - "The browser's own restoration on this tier ... the restoration did not fight the hold" therefore describes a run in which there was no restoration.
     - Say what was run, and record item 1's reduced-motion row as the poster tier proper.
     - The poster row's name and comment ("the harness has no hardware WebGL2, so / is the poster page") should say the same.
   - **Section 23's budget paragraph** still reads "At most 70 B gzip in all".
     - The round now also grows the landing's links module, on the critical path, from about 204 B to 387 B gzip (643 B raw), for iterations 2 and 3. Critical JS went from 15.3 to 15.5 KB.
     - Add the links module's line and its measured figure to the paragraph, and to criterion 8's bullets, so the stated budget matches the build. It is far under the project's 60 KB line.
   - **The poster-path line and the "Slow network, poster path" row:** add item 1's change once made, since the hold alone does not cover a restoration after the load event.

### Open records

These are not FAIL in the builder's hands. Each needs a machine, a tool or an input the loop does not have, or is outside this round.

- **The rerun of `back.spec.ts`** after items 1 to 3, on the owner's machine.
- **The way back's failure paths as browser rows** (criterion 4; D3, H): a stall (`__skreedStall`), a module script refused on `/#families`, a lost context and a failed fetch.
- **Back to top on the poster tier proper with the cache missed** does not reach the top.
  - Reduced motion: it ends at the visitor's old place (513, `#families` kept), by the browser's restoration; iteration 2 read 564 by `links.ts`.
  - `to-top.ts` line 90's "a fresh load starts at the top anyway (loader.inline.js)" is true where the loader runs only.
  - For the owner, outside this round's criteria.
- **The builder's "one reading, not a capture".**
  - The reviewer's screencast saw no painted frame at the top edge in seven held loads (6 to 53 frames each).
  - A screencast can drop a frame while it waits for its acknowledgement, so a single frame is not ruled out; a real phone is the check. The rows' samplers read before layout, as the builder says.
  - Frames at 0 came first in every run, at least partly the blank page before the navigation. Whether the landing itself paints at its top before the module runs is not settled by this capture; round 4's module-time centring had the same timing.
- **Scrolls without a wheel, touch, key or pointer during a held load are re-centred until the load event.** For example: the find bar opened from the browser's menu, or a screen reader moving focus. The criterion names only the four inputs. A scrollbar drag should send `pointerdown`, but the headless harness hides scrollbars, so it was not tried.
- **A real phone:** the loader's count catch-up on a real GPU, the row's safe areas, and round 4's `innerHeight` against `100svh` question on iPhone.
- **Lighthouse mobile (C4).**
- **E1 and E2: BLOCKED.**
- **The carried site essentials:** A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26.

### Pending Sam (graded as built until he answers; spec 12 items 6, 7, 11 and 12)

- **The words:** "Back to main page" or "Back to the families". On phones both bottom controls read "Back to" on one line.
- **The wait:** 2.5 s.
- **The way back's length:** the landing's full loader, or the family pages' faster finish. In this harness the lift came 9.75 to 19.83 s after the time origin, on SwiftShader; judge it on a phone.
- **The phone row:** one row as built, stacked at the right, or under the letters.

### Notes (not graded as FAIL)

- **Visual critique by eye of the 390 frame (in place of E2).**
  - **As iteration 2 read it.** The bottom row mirrors the top row. Two "Back to" labels sit on one line, only one with an icon (the words question). About 330 px of night lies between the letters and the row.
  - **Older, not this round's:**
    - the case covers "OND B" at 390;
    - three cases stand over the letters at 844 x 390;
    - 1280 shows one case where round 4's frame showed five.
- **The poster frame as it should read.** The reviewer's clean frame, taken 0.5 s after the row's wait, shows the countdown on the poster at the top and the ten swatches in two rows centred, with night below.
- **The harness's landing** chooses `hero3d` and falls to the poster at about `DOMContentLoaded` (the class stamps above), unless the poster tier is chosen up front, as it is under emulated reduced motion (seen here). Rows that need the poster tier proper must emulate such a condition.

## Round 5, iteration 4, 2026-10-28: FAIL

Iteration 4 answers the three items of the iteration 3 verdict above. It is:
- one line of product code in `src/scripts/family/links.ts`, with its comment (10 lines in, 2 out);
- one source test in `return-path.test.ts` (21 in, 1 out);
- one browser row and the poster row's wait in `back.spec.ts` (86 in, 12 out);
- section 23's record (12 lines in, 8 out).

The whole round is still uncommitted on `family/round-5-return-loader`: 19 files, 1,799 lines in and 146 out before this entry, and the nine PNGs.

All three iteration 3 items are closed. The poster tier's Back now ends centred, in the reviewer's own runs as well as the builder's row. The poster frame is clean, by eye and by its pixels.

The round still fails:
- **One record fault, found in this iteration (verdict item 1).** `history.scrollRestoration` belongs to the history entry. So the `manual` that `links.ts` sets on a return stays on the landing's entry for every later load of it. The record says the opposite for Back to top's way home ("it does not reach that load"). On an entry an earlier return has set, that way home now ends at the top, not at the old place. The product is right; the record is not.
- **The open records,** as at round 4's last iteration: C4 not run, E1 and E2 blocked, the carried site essentials, and the checks that need a real phone.

### How it was checked

- **Verdicts.** PASS, FAIL, BLOCKED, UNPROVEN, n/a and CLOSED, as in iterations 2 and 3.
- **Frames first, before any code.** The nine PNGs the full run rewrote (13:59 to 14:05 on 2026-10-28), against iteration 3's reading above. The poster frame was also read by its pixels.
- **Iteration 4's own change, isolated.**
  - The reviewer's snapshot of the iteration 3 diff (13:06, before the iteration 3 review) was applied to `HEAD` outside the repository and compared with the worktree.
  - Only `links.ts`, `return-path.test.ts`, `back.spec.ts`, section 23 and this log changed since then. This log's change is the iteration 3 entry alone: 225 lines appended, nothing above it touched.
  - The other 14 changed files are byte for byte as iteration 3 left them.
- **Read in full:**
  - `links.ts`, and its built module in `dist/_astro/` (`FamilyLinksNav...BSRgQS44.js`, 735 B raw and 411 B gzip at level 9, the production log's chunk);
  - the new source test, the new row, the poster row's wait, the two renamed rows and their sampler;
  - section 23's 12 changed lines, word by word against iteration 3's text, and the iteration 4 paragraph;
  - `loader.inline.js` lines 1 to 14, `gate.inline.js` line 11, `rock-links.ts`'s `isReturnVisit` and `to-top.ts`'s `backHome`.
- **The logs, read in full:**
  - `test-results/r5-it4-back-spec.log` (46 of 46);
  - `r5-it4-new-rows.log`, with the new row's first form failing on its exact href after 10.0 min;
  - `r5-it4-poster-back.log`, `r5-it4-build-prod.log`, `r5-it4-family-budget-prod.log` and both `r5-it4-build-test-*.log`;
  - `r5-it4-unit.log` and `r5-it4-family.log`.
- **Tests, run by the reviewer:**
  - `npx tsc --noEmit`: clean;
  - `test:unit`: 192, with 191 passing and 1 skipped (ffprobe);
  - `test:family`: 64 of 64, the iteration 4 test among them.
- **Three rows, run by the reviewer** against 8793 (one worker, 300 s timeout): the poster tier row, the held-load row and the wheel row, 3 of 3 in 20.7 s.
  - **The poster tier row.** Left at 864, with `auto` before the module and `manual` after. Both times the centre stood at 421.8 of 844 (`scrollY` 564), with no frame off centre:
    - nothing held: `DOMContentLoaded` at 231 ms, the load at 232 ms, 145 frames after it;
    - held 3 s: 147 ms and 3,100 ms, 145 frames after it.
  - **The held load:** 421.8 at 1 s, at 3 s and 1 s after the load event (`DOMContentLoaded` at 547 ms, the load at 4,375 ms, 691 frames).
  - **The wheel:** 564 to 1,128 by 2,040 ms, and 1,128 1 s after the load event.
  - These rows take no frames. No repository file was rewritten; the poster frame still reads 14:03:05.
- **The server.** 8793 serves the 14:11 test build (`dist/index.html` at 14:11:35).
  - Its landing's links module is the production log's chunk.
  - Its module scripts come in the order SiteLogo, FamilyLinksNav, BackToTop, Quiz, Room, HeroStage.
- **Diagnostics.** The reviewer's own scripts, outside the repository, drove the installed Chrome with the harness's SwiftShader flags against 8793. Each spy was installed before any page script:
  - **A setter spy** on `History.prototype.scrollRestoration`. It names each caller by its stack (the links module, another module, or the inline loader). It also stamps the entry's mode at init, at `DOMContentLoaded` and at the load event.
  - **The links module's listener calls** on `window`, as in iteration 3.
  - **Painted frames,** from the screencast's metadata, as in iteration 3.
  - **The runs:**
    - run B again;
    - the first visits;
    - the 3D path pinned;
    - later loads of an entry the links module has set;
    - the poster tier's other causes (Save-Data, 2g, 2 GB of memory).
  - Results are in the tables below.
- **Grep of every changed file and of the added lines:**
  - no em or en dash, no emoji, and no AI product name outside a file name;
  - every changed file is LF;
  - no TODO, FIXME or lorem outside this log's own words.
- **Not available here:**
  - `/web-design-guidelines` and `visual-critique` are not installed;
  - no Lighthouse run and no real phone;
  - the headless harness hides scrollbars, so a scrollbar drag was not tried.

### The frames

- **The argument screen 3.0 s after it came on** (`-390-`, `-360-`, `-844-`, `-1280-`). As iteration 3 read them:
  - at 390, "Back to main page" starts at x 16.5 and Back to top's chevron ends near x 374, on one line near y 808;
  - at 360 the row is near y 744; at 844 x 390 it is about y 354, under the letters;
  - at 1280 the control is centred under the letters near y 733, with Back to top under "All families";
  - only the case's pose differs.
- **`-390-return-loader` and `-1280-`.** The wordmark under a light pass on the night, the count at 32 (390) and 27 (1280). As before, the capture is a wall-clock wait into a load of varying length.
- **`-return-gems`.** The ten gems at rest with their labels at both sizes, and Back to top top right. As before.
- **`-390-landing-poster`: clean.** The countdown on the poster at the top, the ten swatches in two rows centred, and night below. Nothing of the family page shows: no case, no letters, no "All families" and neither bottom control.
  - **By its pixels:** every sampled pixel of the bottom row's band (y 786 to 830) and of the night from y 550 to 785 reads 5 or 6 in each channel. That is the night itself.
  - The swatch circles span y 328 to 473.5 and the last light label ends at y 514.5, so the nav is centred near y 421.

### Iteration 3 items, re-graded

| # | Verdict | Evidence |
|---|---|---|
| 1 | CLOSED | **The code.** `links.ts` sets `history.scrollRestoration = 'manual'` as the first line inside `if (!toTop && isReturnVisit())`. It is under `!html.hero3d`, before the first `centre()`, and nowhere else; the built module carries the same guarded assignment. The comment's premise is now right: the loader returns at line 7 without `loading`, before its line 10, and the gate adds `loading` on the `hero3d` tiers only. **Run B again,** in iteration 3's four forms: reduced motion, `/`, the families brought into view, Blissful Blue by its link, the landing `no-store`, then Back. All four were `back_forward`, not persisted, with `#families` kept. The mode was `auto` at init and set `manual` once, by the links module, at the module (68 to 137 ms). **Left at the swatches (513):** 564 and centre 421.8 of 844 1.5 s after the load event, nothing held and held 3 s; iteration 3 read 513 and 472.8. **Left 300 px lower (813):** 564 and 421.8 in both; iteration 3 read 813 and 172.8. No scroll after the load event moved the page. **The tier's other causes,** which the builder lists as not verified: under Save-Data, 2g and 2 GB of memory the first visit kept `auto`, so no loader ran. The Back from 813 ended at 564, centre 421.8, with `manual` set. **The row** passes in the full run and in the reviewer's. **The source test** pins the line, its guard and its place, the loader's order and the gate |
| 2 | CLOSED | **The wait.** The row catches the transition at `pagereveal` and awaits its `finished`; the log reads "finished". It then waits for `readyState` `complete`, for `document.activeViewTransition` to be null and for 1 s more, and asserts it is still null before the frame. **The frame** is clean by eye and by its pixels (above). The centring assertion (421.8 of 844) passed in the full run |
| 3 | CLOSED; a new fault in the same record is verdict item 1 | **The fall path named.** The iteration 3 paragraph's run A and its Back run now name the harness's fall path, with their class stamps (66 and 528 ms; 78 and 271 ms). They say the loader had already set manual restoration. A note keeps the earlier wording and points to iteration 4's row for the poster tier proper. The poster row's name and the held-load and wheel rows' names say the same. **The budget.** The paragraph and criterion 8 carry the links module: about 204 B gzip at round 4, 387 B and 643 B after iteration 3, and 411 B and 735 B after iteration 4. The budget's line reads 0.4 KB and 0.7 KB, and critical JS went from 15.3 to 15.5 KB. The reviewer's measure of the served module agrees (735 B, 411 B). **The changed lines.** The poster-path line, criterion 4's third bullet and both states rows carry item 1's change. **The rest of the record.** Section 23's plan "Checked", iteration 1's "Built", "Checked" and "Not done", and the iteration 2 and 3 paragraphs are unchanged but for the corrections above. They stay true as history. This log's history is whole |

### `links.ts`, path by path

| Case | Result | Evidence |
|---|---|---|
| The 3D path, `/#families` typed | PASS: the loader's setting only | `hero3d` pinned. The mode was set once, by the inline loader at 11 ms, and never by the links module. Its six listeners were added at 117 ms and removed at the load event (120 ms) with no centring. The page stood at 12,238, 14.5 times 844 |
| The 3D path, Back with the cache missed | PASS | `back_forward`. The mode was already `manual` at init: the loader's, from the first visit, kept on the entry. The loader set it again at 4 ms, and the links module never did. The page stood at 12,238 |
| A plain first visit, the poster tier proper | PASS: `auto` kept | Reduced motion, `/`: no setter call, `auto` at the end, `scrollY` 0, and only round 4's `pageswap` listener |
| A plain first visit, the harness's default | PASS | The loader's `manual` at 12 ms, then the fall to the poster; nothing from the links module |
| `/#families` typed, the poster tier proper | PASS | A return visit by its hash: `manual` set by the links module at 106 ms, centred at 421.8 of 844. The listeners were added at 110 ms and removed at the load event (116 ms) |
| The browser's Back, the poster tier proper, cache missed | PASS | Item 1 |
| The same under Save-Data, 2g and 2 GB of memory | PASS | Item 1 |
| The harness's fall path, held 4 s, with and without a wheel | PASS | The rows, in the full run and the reviewer's |
| Back to top's way home, 3D path, a fall before the load event | PASS | The row in the full run: the fall at 459 ms, the load at 6,209 ms, `scrollY` 0 through 946 frames. The control stood at 0 with the loader up |
| **Later loads of an entry the links module has set** | **The product: PASS. The record: FAIL (item 1)** | **Set-up:** reduced motion and one return first (centred, `manual`), then four runs, each run twice. **A reload** of `/#families` (`reload`): `manual` at init, the first frames at the top, then centred at 421.8 by the module. **A second trip and Back:** `manual` at init, the first frames at the top instead of the old place, then centred at the module. **A second trip and Back to top's way home,** the landing `no-store`: `manual` at init. The links module does nothing (the flag), and the page ends at the top, 0, with `#families` kept. **The same way home on a fresh entry** (`auto`): it ends at the visitor's old place (813, centre 172.8), as iteration 3's open record reads |
| Listener hygiene | PASS | Six listeners, as in iteration 3. They are added at the module on a return visit only, and all removed by one `stop` at the load event in every run above; none on a first visit. Nothing calls `preventDefault` |

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | **The diff against rules 1 to 50:** no violation. Iteration 4 adds one assignment of the entry's scroll restoration, with no motion, colour, type or copy (rules 12, 14 and 48 untouched). No dash, emoji or buzzword in any added line (rules 3, 16, 17, 27, 29). **Still failing, outside the diff and carried:** rules 46 and 47, with no privacy or terms page in `dist/` |
| A2 | PASS | Pearl Whisper only; the loader's `--night` and light are E-A2 |
| A3 | PASS | The "shown at" rows pass at 390 and 1280 in the full run |
| A4 | PASS | No copy changed |
| A5 | PASS | The argument screen shows the case; the loader screen is the hero's own, under E-H1 |
| B1 | PASS | The nine frames, 390 and 1280 among them, as graded above. The poster frame is clean |
| B2 | PASS | Criterion 5's seven rows and criterion 6's four pass in the full run |
| B3 | PASS | Same-origin links. `links.ts` reads the flag inside a try and sets only the entry's restoration mode; it writes no storage |
| B4 | PASS | Nothing uses or animates `svh` or `dvh` |
| C1 | PASS | **Production:** critical JS 15.5 KB of the 60 KB line; total JS 204.8 KB, and 237.2 of 250 KB with section 4 and `scroll.ts`. **The links module:** 735 B raw and 411 B gzip, as section 23's budget paragraph and criterion 8 now say |
| C2 | n/a | No image |
| C3 | PASS | `links.ts` scrolls instantly and animates nothing; the C3 guard passes in `test:family` |
| C4 | UNPROVEN | Lighthouse not run (open record) |
| D1 | PASS | The loader on the way back is E-H1's; the control's wait is E-F5's |
| D2 | PASS | The poster tier row runs under reduced motion; `links.ts`'s centring is instant |
| D3 | PASS | The poster tier's Back with the cache missed now ends centred (item 1). The failure paths still have no browser rows (open record) |
| D4 | PASS | The hover row passes |
| E1 | BLOCKED | `/web-design-guidelines` is not installed |
| E2 | BLOCKED | `visual-critique` is not installed; the reviewer's critique by eye is in the notes |
| E3 | PASS | The keyboard row passes. Contrast medians: 19.43:1 for the three families at 390, and 15.84, 15.46 and 15.33:1 at 1280; the lowest single frame 12.8:1. Zero CSP violations |
| E4 | PASS | Writes no data |
| E5 | n/a | No database |
| G1, G3, G4, G6, G7, G8 | PASS | Not touched; present in `dist/` |
| G2, G11 | n/a | E-G2; no Reserve on the family pages |
| G5, G15, G16, G18, G19, G23, G24, G26 | FAIL | Carried, not this round's: no `og:image` on `/`, no privacy or terms pages, no analytics, contact line, FAQ or LocalBusiness JSON-LD |
| G9, G12 | PASS | No image added; no data loaded |
| G10 | PASS | Criteria 5 and 6 at every listed size |
| G13, G14, G17, G20, G22, G25 | n/a | No form, thanks state, cookies, cutover or founders' note here; breadcrumbs n/a on the teaser |
| G21 | PASS | The press, the direct load and the Back land at 14.5 screens with ten placed links in the full run |
| G27 | PASS | Nothing fabricated |
| H | PASS | As D3: the slow tier's Back now ends centred, on every cause of the poster tier the reviewer tried |
| F1 | FAIL | Item 1: the record misstates what the manual mode does on later loads of the landing's entry |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the added lines |

### Acceptance criteria (round 5, section 23)

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | All three ways in at both sizes in the full run: `ret`, and the wordmark and the count from the first sample to the lift, with the count past 30. The frames show the wordmark and the count (32 and 27) |
| 2 | PASS | **The parity test** passes. **The six landings:** the lift 11.28 to 14.19 s after the time origin; the count never falls and rose at most 26 in one frame; the fill at most 0.000 s ahead of twice the frame clock; calls `{cut: 0, skip: 0, ready: 1}`; `enter` in 1 to 7 frames and at the count's 100 in every one |
| 3 | PASS | 14.5 screens within 2 px at the lift and after, section 2 ready first, and ten placed links, in all six landings. The frames show the gems at rest |
| 4 | PASS | **Closed:** the poster tier proper's Back under reduced motion, Save-Data, 2g and 2 GB of memory (item 1), and the poster row's frame (item 2). **Held from iteration 3:** the held load and the wheel on the fall path, and Back to top's way home after a fall. **Still without a browser row** (open records, as the criterion's own evidence line says): the stall, the refused module on `/#families`, the lost context and the failed fetch |
| 5 | PASS | All seven phone rows pass in the full run, and `back.test.ts` passes |
| 6 | PASS | All four wide rows pass in the full run |
| 7 | PASS | The keyboard row, `backTimer` off at 5.6 screens and below, the timings and the words, and section 22's criteria below |
| 8 | PASS | **The production build:** every enforced line holds (49) and both guards pass. **Unchanged since iteration 1:** the inline scripts row (4.8 KB gzip, 9.7 KB raw) and the hero chunk, byte for byte (`hero.CKiDk_2_.js`, 55,826 B gzip). **The links module** is as the paragraph says. **The family page module** is unchanged (7,070 B gzip, `BInCOMKE`). The C3 guard passes, and no changed file carries an em or en dash |

### Section 22's criteria under round 5

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | The built HTML row and the computed-style rows at 390 and 1280 |
| 2 | PASS | The held-clock rows at both sizes. The frames rows dropped `hidden` 2,504.1 ms (390) and 2,522.2 ms (1280) after the argument came on |
| 3 | PASS | Replaced on phones by round 5's criterion 5, and held on the wide layout by criterion 6 |
| 4 | PASS | The seven grid rows and the `fam:grid` row |
| 5 | PASS | The plain-click row, the hover row, the poster row's centring and its clean frame, and the 3D landing rows |
| 6 | PASS | The keyboard row, the reduced-motion row, the six contrast medians and zero CSP violations |

### Verdict: FAIL

The one item is the record. It needs no product change and no browser rerun. Running `test:family` after it is enough, since the source test reads `links.ts`'s comment.

1. **The record: say that the manual mode stays on the landing's history entry (F1; section 23's poster-path line and the iteration 4 paragraph).**
   - **The fault.** `history.scrollRestoration` is the history entry's, not the load's. Once `links.ts` sets `manual` on a return, the landing's entry keeps it for every later load of that entry. The record says otherwise in one place and is silent in the others:
     - the iteration 4 paragraph's "Not verified" says Back to top's way home on the poster tier proper "ends at the visitor's old place by the browser's restoration", and that "item 1's assignment is inside the centring block, so it does not reach that load";
     - `links.ts`'s comment ends "Never on a plain first visit, never on Back to top's way home, never on the 3D path". That is true of the assignment, not of its effect.
   - **The reviewer's runs** (reduced motion, one return first, the landing `no-store`, each run twice):
     - Back to top's way home on that entry ends at the top, `scrollY` 0, with `#families` kept and the mode `manual` at init. On a fresh entry it ends at the old place (813, centre 172.8).
     - A later Back shows the top before the module, where the first Back paints the old place. Both end centred.
     - A reload of `/#families` starts `manual` and is centred by the module.
   - **Change.**
     - Correct the "Not verified" sentence. The way home ends at the old place on an entry no return has set. On one a return has set, it ends at the top, with `#families` kept.
     - Add one clause to the poster-path line under "After the press", and to `links.ts`'s comment: the setting is the landing entry's, so it holds for later loads of that entry (a reload, a later Back, Back to top's way home).
     - The header of `return-path.test.ts` calls the iteration 3 and 4 tests "the last two tests"; they are the third and fourth of seven. Name them, or say where they are. Iteration 3's "the last test" was already wrong, and the reviewer missed it then.
   - **No product change is asked.** Each outcome above is as good as before or better. On such an entry the way home now reaches the top, which is what Back to top is for.

### Open records

These are not FAIL in the builder's hands. Each needs a machine, a tool or an input the loop does not have, or is outside this round.

- **The way back's failure paths as browser rows** (criterion 4; D3, H): a stall (`__skreedStall`), a module script refused on `/#families`, a lost context and a failed fetch.
- **The poster tier proper's first Back paints the old place before the module runs.**
  - The screencast shows 1 to 3 painted frames at the old place before the centre, a jump of 51 or 249 px: 513 for about 70 ms, 813 for about 90 ms, and one frame at 813 when held.
  - A later Back to the same entry starts at the top instead.
  - The spec centres "when its module runs", so this is as designed. How it reads on a phone is for a real phone.
  - This settles iteration 3's question about frames before the module on this tier.
- **Back to top on the poster tier proper with the cache missed** reaches the top only on an entry a return has set (item 1's runs). On a fresh entry it ends at the old place. `to-top.ts` line 90's "a fresh load starts at the top anyway (loader.inline.js)" is true only where the loader runs. For the owner, outside this round's criteria.
- **Scrolls without a wheel, touch, key or pointer during a held load are re-centred until the load event.** For example: the find bar opened from the browser's menu, or a screen reader moving focus. A scrollbar drag was not tried.
- **The builder's "one reading, not a capture"** for the fall path stands as iteration 3 read it.
- **A real phone:** the loader's count on a real GPU, the row's safe areas, round 4's `innerHeight` against `100svh` question, and the first Back's frames above.
- **Lighthouse mobile (C4).**
- **E1 and E2: BLOCKED.**
- **The carried site essentials:** A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24, G26.

### Pending Sam (graded as built until he answers; spec 12 items 6, 7, 11 and 12)

- **The words:** "Back to main page" or "Back to the families". On phones both bottom controls read "Back to" on one line.
- **The wait:** 2.5 s.
- **The way back's length:** the landing's full loader, or the family pages' faster finish. In this run the lift came 11.28 to 14.19 s after the time origin, on SwiftShader; judge it on a phone.
- **The phone row:** one row as built, stacked at the right, or under the letters.

### Notes (not graded as FAIL)

- **Visual critique by eye of the 390 frame (in place of E2).**
  - **As iteration 3 read it.** The bottom row mirrors the top row. Two "Back to" labels sit on one line, only one with an icon (the words question). About 330 px of night lies between the letters and the row.
  - **Older, not this round's:**
    - the case covers "OND B" at 390;
    - three cases stand over the letters at 844 x 390;
    - 1280 shows one case where round 4's frame showed five.
- **The poster frame** now reads as the reviewer's clean frame of iteration 3 did: the countdown on the poster, the ten swatches centred in two rows, night below.
- **Line numbers in the runner's logs** do not match the source. The new row is "back.spec.ts:973" in a file of 891 lines, and iteration 3's log ran to 1,365 in 817. The rows are found by name.
- **The scratch folder is shared.** The builder's scripts sit beside the reviewer's in the same scratch folder. The reviewer ran only its own.

## Round 5, iteration 5, 2026-10-28: FAIL

Iteration 5 answers the one item of the iteration 4 verdict above. It is the loop's last iteration. It is documents only:
- section 23's record in `docs/specs/family-page.md` (4 lines in, 2 out): the poster-path line and the iteration 4 paragraph rewritten, and the iteration 5 paragraph added;
- the comment in `src/scripts/family/links.ts` (3 lines in, 1 out);
- the header of `tests/family/return-path.test.ts` (2 lines in, 1 out).

Item 1 is closed. Every passage it named now says what the reviewer measured in iteration 4, and nothing else changed since iteration 4.

The round still fails, but only on open records, as round 4's last iteration did:
- C4 not run (UNPROVEN);
- E1 and E2, with their tools not installed (BLOCKED);
- the carried site essentials: A1 rules 46 and 47, and G5, G15, G16, G18, G19, G23, G24 and G26.

No code or document change is outstanding in the builder's hands. The round was committed while this review ran (see the notes).

### How it was checked

- **Verdicts.** PASS, FAIL, BLOCKED, UNPROVEN, n/a and CLOSED, as in iterations 2 to 4.
- **Frames first.** The nine PNGs are iteration 4's: written 13:59:13 to 14:05:12 on 2026-10-28 and not rewritten since. The 390 and 1280 argument frames and the poster frame were looked at again. They read as iteration 4 read them.
- **Iteration 5's change, isolated.**
  - The reviewer's snapshot of the whole diff at 14:14 was applied to 7241c50 outside the repository: all 19 files, no reject. The snapshot was taken after iteration 4's last build (14:11) and before the iteration 4 review.
  - Against it, only section 23, `links.ts` and `return-path.test.ts` differ, and this log.
  - This log's difference is the iteration 4 entry alone. It is byte for byte the reviewer's own draft of that entry, and nothing above it is touched.
  - The other 15 changed files are byte for byte as iteration 4 left them, and the frames are not rewritten.
  - The builder's two scripts for this iteration (`it5_edits.py` and `it5_append.py`, in the shared scratch folder) were read. Their four replacements and one append are exactly the diff.
- **The product, unchanged.** The `links.ts` change is three comment lines in place of one. Both versions were minified by the project's own esbuild (0.28.2), as a proxy for the build. They give the same 764 B, byte for byte.
  - So the served module (`FamilyLinksNav...BSRgQS44.js`, 735 B raw and 411 B gzip) and every iteration 4 figure stand.
  - No build, no server change and no browser run were needed. 8793 still serves the 14:11 test build (200 on `/`).
- **The passages, read word by word** against the iteration 4 text and against the reviewer's iteration 4 logs of the later loads (`rv4-later.log` and `rv4-later2.log`, each case run twice).
- **Every other passage of section 23 on the way home and on the restoration** (lines 830, 852, 882 to 884, 942 to 944, and 1095 to 1099), read for any contradiction with the corrected fact.
- **Tests, run by the reviewer:**
  - `test:unit`: 192, with 191 passing and 1 skipped (the ffprobe probe);
  - `test:family`: 64 of 64, with the iteration 3 and 4 source tests among them. The one that counts `scrollRestoration` in `links.ts` passes with the count at one.
- **Grep of the three files and of the added lines:** ASCII only, LF, a final newline. No em or en dash, no emoji, no AI product or model name, no TODO, FIXME or lorem, no buzzword.
- **Not available here:** `/web-design-guidelines` and `visual-critique` are not installed. There was no Lighthouse run and no real phone.

### Iteration 4 item, re-graded

| # | Verdict | Evidence |
|---|---|---|
| 1 | CLOSED | **What was asked:** correct the "Not verified" sentence; add the entry clause to the poster-path line and to the comment in `links.ts`; name the iteration 3 and 4 tests in the header of `return-path.test.ts`. All four are done, and each is true against the reviewer's runs (table below). **Those runs:** reduced motion, one return first (centred, `manual`). **A reload** of `/#families` (`reload`): `manual` at init, the first frame at 0, centred at 421.8 of 844 (`scrollY` 564) by the module. **A later Back** (`back_forward`): the same. **Back to top's way home on that entry:** `manual` at init, no setter call, `scrollY` 0, `#families` kept. **The same way home on a fresh entry:** `auto`, 813, centre 172.8. **The other passages:** no other passage of section 23 contradicts the fact. The states row for the way home (line 884) and criterion 4's second bullet (line 943) describe the loader's tiers and the fall; they say nothing of the poster tier proper, which the poster-path line and the "Not verified" sentence now carry (open record) |

### The passages

| Passage | Truth | Wording |
|---|---|---|
| The poster-path line under "After the press, the landing" (line 830) | TRUE. The setting is the entry's, so it holds for every later load of that entry. A reload and a later Back start at the top and are centred by the module. Back to top's way home ends at the top with `#families` kept. On an entry no return has set, it ends at the visitor's old place | PASS. One sentence after "(iteration 4).", in the record's voice. Its last clause is the poster tier proper's (note 2) |
| Iteration 4's "Not verified" sentence (line 1097) | TRUE. It names the tier and the cache miss, and gives both outcomes and their cause. It keeps the old wording as history: the sentence said that load ends at the old place, and that the assignment does not reach it | PASS. "corrected in iteration 5, where this sentence said" would read more plainly as "before which this sentence said" (note 3) |
| The comment in `links.ts` (lines 30 to 32) | TRUE. "Never set" is the assignment. The effect is the entry's and holds for a reload, a later Back and Back to top's way home, which then ends at the top with #families kept. The reload and the later Back are return visits, so the module sets the mode again; the effect is that they start at the top | PASS. The property's name is left out, so the source test's count stays at one. The new lines are at most 122 characters wide, within the comment's own widths (at most 124) |
| The header of `return-path.test.ts` (lines 14 and 15) | TRUE. The file has seven tests. The third and fourth are named "iteration 3 (round 5): ..." and "iteration 4 (round 5): ...", as the header now says | PASS |
| The iteration 5 paragraph (line 1099) | TRUE. It has three sentences. "No product code, browser row or frame changed" holds by the isolation above. The test counts match the reviewer's runs | PASS. "Four passages now say so" takes in the test header, which names the tests and says nothing of the entry (note 1) |

### Checklist

| Item | Verdict | Evidence |
|---|---|---|
| A1 | FAIL | **The diff against rules 1 to 50:** no violation. Iteration 5 changes record prose, a comment and a test header only, with no motion, colour, type or copy on the site. No dash, emoji or buzzword in any added line (rules 3, 16, 17, 27, 29). **Still failing, outside the diff and carried:** rules 46 and 47, with no privacy or terms page in `dist/` |
| A2 | PASS | Carried from iteration 4: Pearl Whisper only; the loader's `--night` and light are E-A2 |
| A3 | PASS | Carried: the "shown at" rows pass at 390 and 1280 in iteration 4's full run |
| A4 | PASS | No copy changed |
| A5 | PASS | Carried: the argument screen shows the case; the loader screen is the hero's own, under E-H1 |
| B1 | PASS | The nine frames, 390 and 1280 among them, unchanged since iteration 4 and read again. The poster frame is clean |
| B2 | PASS | Carried: criterion 5's seven rows and criterion 6's four pass in iteration 4's full run |
| B3 | PASS | Carried: same-origin links; `links.ts` reads the flag inside a try, sets only the entry's restoration mode and writes no storage |
| B4 | PASS | Nothing uses or animates `svh` or `dvh` |
| C1 | PASS | Carried, since the module compiles identically. **Production:** critical JS 15.5 KB of the 60 KB line; total JS 204.8 KB, and 237.2 of 250 KB with section 4 and `scroll.ts`. **The links module:** 735 B raw and 411 B gzip |
| C2 | n/a | No image |
| C3 | PASS | Carried: `links.ts` scrolls instantly and animates nothing; the C3 guard passes in `test:family` |
| C4 | UNPROVEN | Lighthouse not run (open record) |
| D1 | PASS | Carried: the loader on the way back is E-H1's; the control's wait is E-F5's |
| D2 | PASS | Carried: the poster tier row runs under reduced motion; `links.ts`'s centring is instant |
| D3 | PASS | Carried: the poster tier's Back with the cache missed ends centred. The failure paths still have no browser rows (open record) |
| D4 | PASS | Carried: the hover row passes |
| E1 | BLOCKED | `/web-design-guidelines` is not installed |
| E2 | BLOCKED | `visual-critique` is not installed; the reviewer's critique by eye is in iteration 4's notes, unchanged |
| E3 | PASS | Carried: the keyboard row passes. Contrast medians 19.43:1 for the three families at 390, and 15.84, 15.46 and 15.33:1 at 1280; the lowest single frame 12.8:1. Zero CSP violations |
| E4 | PASS | Writes no data |
| E5 | n/a | No database |
| G1, G3, G4, G6, G7, G8 | PASS | Not touched; present in `dist/` |
| G2, G11 | n/a | E-G2; no Reserve on the family pages |
| G5, G15, G16, G18, G19, G23, G24, G26 | FAIL | Carried, not this round's: no `og:image` on `/`, no privacy or terms pages, no analytics, contact line, FAQ or LocalBusiness JSON-LD |
| G9, G12 | PASS | No image added; no data loaded |
| G10 | PASS | Carried: criteria 5 and 6 at every listed size |
| G13, G14, G17, G20, G22, G25 | n/a | No form, thanks state, cookies, cutover or founders' note here; breadcrumbs n/a on the teaser |
| G21 | PASS | Carried: the press, the direct load and the Back land at 14.5 screens with ten placed links |
| G27 | PASS | Nothing fabricated |
| H | PASS | Carried, as D3 |
| F1 | PASS | **Item 1 is closed.** Section 23 is now the round's whole history: the plan with its "Checked" and "Not checked"; then "Built", "Checked" and "Not done"; then iterations 2, 3, 4 and 5. Each later correction keeps the earlier wording and says where it was wrong. This log has iterations 1 to 5 once this entry is in, with nothing above this entry touched. Three wording notes below change no fact |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the added lines |

### Acceptance criteria (round 5, section 23)

Nothing of the product, the browser rows or the frames changed since iteration 4. Each criterion is carried from iteration 4's entry, as graded there.

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | Carried: all three ways in at both sizes; the wordmark and the count from the first sample to the lift, with the count past 30. The frames show the count at 32 (390) and 27 (1280) |
| 2 | PASS | Carried: the parity test passes again in this run. In the six landings the lift came 11.28 to 14.19 s after the time origin. The count never fell and rose at most 26 in one frame. Calls were `{cut: 0, skip: 0, ready: 1}`, and `enter` came at the count's 100 in every landing |
| 3 | PASS | Carried: 14.5 screens within 2 px at the lift and after, section 2 ready first, and ten placed links |
| 4 | PASS | Carried: the poster tier proper's Back ends centred under reduced motion, Save-Data, 2g and 2 GB of memory, and the poster row's frame is clean. The held load, the wheel and Back to top's way home after a fall hold. Still without a browser row (open records): the stall, the refused module on `/#families`, the lost context and the failed fetch |
| 5 | PASS | Carried: all seven phone rows pass in iteration 4's full run, and `back.test.ts` passes in this run |
| 6 | PASS | Carried: all four wide rows pass in iteration 4's full run |
| 7 | PASS | Carried: the keyboard row, `backTimer` off at 5.6 screens and below, the timings and the words, and section 22's criteria below |
| 8 | PASS | Carried from iteration 4's production build. Every enforced line holds (49) and both guards pass. The inline scripts row (4.8 KB gzip) and the hero chunk (`hero.CKiDk_2_.js`, 55,826 B gzip) are iteration 1's. The links module compiles identically after iteration 5's comment (above). No changed file carries an em or en dash |

### Round 4's criteria (section 22) under round 5

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | Carried: the built HTML row and the computed-style rows at 390 and 1280 |
| 2 | PASS | Carried: the held-clock rows at both sizes; the frames rows dropped `hidden` 2,504.1 ms (390) and 2,522.2 ms (1280) after the argument came on |
| 4 | PASS | Carried: the seven grid rows and the `fam:grid` row; `back.test.ts`'s `fam:grid` test passes again in this run |
| 5 | PASS | Carried: the plain-click row, the hover row, the poster row's centring and its clean frame, and the 3D landing rows |
| 6 | PASS | Carried: the keyboard row, the reduced-motion row, the six contrast medians and zero CSP violations |

Criterion 3 is replaced on phones by round 5's criterion 5. It is held on the wide layout by criterion 6.

### Verdict: FAIL

The fail is on open records only. Iteration 4's one item is closed, and no code or document change is outstanding. This was the loop's fifth iteration, so the loop stops here, and the owner reports what remains. Each item below needs a tool, a run or an input the loop does not have.

1. **E1 and E2 (BLOCKED).** Install `/web-design-guidelines` (vercel-labs/agent-skills) and `visual-critique` (the designer-skills marketplace). Run the first on the round's changed files, and the second on `family-r5-390-arg-after.png`. CLAUDE.md asks for the first, and the security checklist in `docs/research/08-prelaunch-security-checklist.md`, before any push to main. The round is now committed on its branch (notes). Unblocks E1 and E2.
2. **C4 (UNPROVEN).** Run Lighthouse mobile on `/shades/blissful-blue/` and on `/#families` against a production build. E-C4, still pending Sam, grades it on the poster tier. Unblocks C4.
3. **The carried site essentials (FAIL, not this round's).** These are the privacy and terms pages (rules 46 and 47; G15 and G16), the `og:image` on `/` (G5), analytics (G18), the contact line and its reply promise (G19 and G24), the five FAQs (G23), and the LocalBusiness JSON-LD (G26). Each is its own section, built through its own loop. Unblocks A1 and those eight G lines.

### Open records

These are not FAIL in the builder's hands. Each needs a machine, a tool or an input the loop does not have, or is outside this round.

- **The way back's failure paths as browser rows** (criterion 4; D3, H): a stall (`__skreedStall`), a module script refused on `/#families`, a lost context and a failed fetch.
- **The poster tier proper's first Back paints the old place before the module runs.**
  - The screencast shows 1 to 3 painted frames at the old place, then the centre: a jump of 51 or 249 px.
  - A later Back to the same entry starts at the top instead; the record now says so.
  - The spec centres "when its module runs", so this is as designed. How it reads on a phone is for a real phone.
- **Back to top on the poster tier proper with the cache missed.**
  - It ends at the old place on a fresh entry, and at the top, with `#families` kept, on an entry a return has set. The poster-path line and the "Not verified" sentence now say so.
  - `to-top.ts` line 90's "a fresh load starts at the top anyway (loader.inline.js)" is true only where the loader runs.
  - The states row (line 884) and criterion 4's second bullet (line 943) describe the loader's tiers only.
  - For the owner, outside this round's criteria.
- **Scrolls without a wheel, touch, key or pointer during a held load are re-centred until the load event.** Examples are the find bar opened from the browser's menu, or a screen reader moving focus. A scrollbar drag was not tried.
- **The builder's "one reading, not a capture"** for the fall path stands as iteration 3 read it.
- **A real phone:** the loader's count on a real GPU, the row's safe areas, round 4's `innerHeight` against `100svh` question, and the first Back's frames above.
- **Lighthouse mobile (C4).**
- **E1 and E2: BLOCKED.**
- **The carried site essentials:** A1 rules 46 and 47; G5, G15, G16, G18, G19, G23, G24 and G26.

### Pending Sam (graded as built until he answers; spec 12 items 6, 7, 11 and 12)

- **The words:** "Back to main page" or "Back to the families". On phones both bottom controls read "Back to" on one line.
- **The wait:** 2.5 s.
- **The way back's length:** the landing's full loader, or the family pages' faster finish. In iteration 4's run the lift came 11.28 to 14.19 s after the time origin on the software renderer; judge it on a phone.
- **The phone row:** one row as built, stacked at the right, or under the letters.

### For Sam

- **What the round is.** On the way back from a family page to the landing, you now see the full 0 to 100 wordmark loader, as on a first visit. It lifts onto the ten gems at rest.
- **The bottom row on phones.** "Back to main page" now sits on Back to top's row at the bottom left of the argument screen. On the wide layout it stays centred under the letters.
- **The poster version.** On the version without 3D (reduced motion, Save-Data, slow networks and low-memory phones), coming back puts the ten swatches in the middle of the screen.
- **What to look at.**
  - `family-r5-390-arg-after.png`, and the 360, 844 and 1280 frames beside it, for where the two bottom controls sit;
  - `family-r5-390-return-loader.png` and `-1280-return-loader.png` for the loader on the way back, caught mid-count;
  - `family-r5-390-return-gems.png` and `-1280-return-gems.png` for where it lands;
  - `family-r5-390-landing-poster.png` for the poster version.
- **Your four answers:** the words, the 2.5 s wait, the length of the way back (judge it on your phone), and the row's place.

### Notes (not graded as FAIL)

- **The round was committed while this review ran.**
  - The brief described it as uncommitted. At the start of this review `HEAD` was 7241c50, with 19 files changed and the nine PNGs untracked.
  - At 14:36:40 on 2026-10-28 the branch gained e853f7f, under the repository's own identity. It holds 27 files, 1,165 lines in and 146 out: every changed file but this log, and the nine PNGs.
  - Its message says "iterations 1 to 5", though this verdict had not yet returned. This log's round 5 entries, iterations 1 to 4 and this one, are left uncommitted.
  - The three graded files in the commit are the files graded here (`git diff HEAD` shows this log alone). The branch has no upstream, so nothing is pushed.
  - The reviewer ran no git command that writes. Whether this log joins the commit is the owner's call.
- **Wording, changing no fact.**
  1. The iteration 5 paragraph's "Four passages now say so" takes in the test header, which names the tests. Three passages say so, and the fourth names the tests.
  2. The last clause of the poster-path line ("where on an entry no return has set it ends at the visitor's old place") is the poster tier proper's. On the loader's tiers, the fall path included, the way home ends at the top on any entry (line 884; iteration 4's Back to top row). The clause follows that tier's sentence and reads as its own. A reader of the bullet alone could apply it to the fall path.
  3. "corrected in iteration 5, where this sentence said" can read as if iteration 5 were where the sentence said it.
- **The frames,** by eye, as iteration 4's critique read them. The bottom row mirrors the top row. The case covers "OND B" at 390. The poster frame shows the countdown on the poster, the ten swatches centred in two rows, and night below.
- **The scratch folder is shared.** The builder's iteration 5 scripts sit beside the reviewer's. The reviewer read them and ran only its own.
