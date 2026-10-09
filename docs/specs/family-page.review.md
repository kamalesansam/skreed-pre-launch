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
