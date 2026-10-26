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
