# DESIGN.md: Skreed teaser (skreed.in)

This file is the design system the coding agent reads before every UI change (CLAUDE.md, day-1 item 6). It follows the Stitch DESIGN.md format that awesome-design-md uses: nine sections, plus a tenth, Motion, because the teaser's motion is part of its identity.

Sources of truth, in order:
1. `CLAUDE.md`, the 50 rules.
2. `docs/brand/type-system.md`, decided 2026-10-05.
3. `docs/data/shades-240.json`, the 240 shades.
4. `docs/brand/brand-guidelines-extract.md`.
5. The approved hero, `prototypes/hero-v9/` (v9.9), and its port spec `docs/specs/hero.md` (revision 2, 2026-10-09).

If this file and a source disagree, the source wins and this file is fixed.

## 1. Visual Theme & Atmosphere

- **The idea.** Skreed reads like a paint brand that happens to make phone cases. The product is the colour: 240 shades, 24 per family, ten families. The site's own chrome stays quiet: off-white and charcoal, one orange accent, three typefaces with one job each. The colour on screen comes from the shades themselves, shown as real swatches and real product, never as decoration.
- **Pages.** Pearl Whisper (#F7F6F3) pages alternate with Urban Slate (#383F43) bands, as in the 2026-27 catalog. Circle swatches sit in a 6 x 4 grid per family. Photography is soft lifestyle on neutral backdrops.
- **The hero.** The one exception to the flat pages, on purpose. Night (#050506) over a moonlit, igloo-style snowfield with a faint Milky Way and low fog. The SKRD mark stands as ten matte black blocks, each holding one family's shade as a glow inside its cut faces. The chrome is a corner logotype, a countdown to 15 November 2026 and a scroll cue. Scrolling pulls the camera back, then an ice-shard wipe opens the next section.
- **Density.** Low. One idea per screen. Short sentences, first person, active voice, sensory colour words. Tagline: "Tech Essentials That Go Beyond Basic." Line: "colour is personal."
- **Mood words.** Confident, minimal, design-led, quiet, precise. Never hype, never discount.

## 2. Color Palette & Roles

### Brand neutrals and the accent (the only UI colours)

| Token | Hex | Role |
|---|---|---|
| `--pearl-whisper` | #F7F6F3 | Page neutral. Text on Urban Slate and on the night scene. Fog colour in the hero. Never pure white (#fff is banned as a page background). |
| `--urban-slate` | #383F43 | Charcoal bands. Text on Pearl Whisper. The corner logotype once the wipe passes half way. The inner ring of the two-tone focus ring. |
| `--ember-luxe` | #FF9900 | The one accent: primary button fill and focus rings. Nothing else. |
| `--skeleton` | `color-mix(in srgb, var(--urban-slate) 12%, var(--pearl-whisper))` | The only derived neutral: skeleton blocks while data loads. |
| `--night` | #050506 | Scene only: the loader background, the hero's WebGL background and fog, and the `/` page background under the hero. Never UI chrome on a Pearl page. Its use is approved (exception E-A2, 2026-10-09); the token name is pending Sam (`docs/specs/hero.md` section 11, P5). |

**Measured contrast** (type-system.md and the v9.1 hero):
- Pearl Whisper on Urban Slate: 9.9:1.
- Urban Slate on Ember Luxe: 5.0:1, so button text uses the literal Urban Slate hex, and the two rings of the focus ring separate.
- Pearl Whisper on Ember Luxe: 2.0:1. Never used for text. It is also why an Ember Luxe ring alone fails on Pearl Whisper (WCAG 1.4.11 needs 3:1), hence the two-tone ring in section 4.
- Hero countdown on the snow: 5.9:1 numerals, 5.2:1 labels, 6.0:1 eyebrow at 1280 px, on the v9.1 floor. It is re-measured on the locked terrain (`hero.md` AC4.6).

**Pearl Whisper at alpha** is allowed only as light and falloff in the hero, never as a fill or a text colour. The uses, all part of the approved hero (exception E-A2):
- loader wordmark rest: `#F7F6F341`, that is 65/255 or 25.5 percent;
- the loader's light band and fill-edge stops: the prototype's literal 8-digit Pearl hex values, kept byte for byte so the loader's frames stay identical (hero spec D31);
- the loader's hairline outline: `stroke-opacity: 0.42`;
- the cue's base line: `opacity: 0.6`;
- the hero label links, drawn in the canvas at opacity 0.35.

The prototype's Tune-panel greys (`--panel` #2b3134, `--line` #4a5257, `--muted` at 70 percent, and `#5f676c`) never ship.

### Creative-only colours (share card and stories, never UI chrome)

| Token | Hex |
|---|---|
| `--almond-silk` | #E9D9CA |
| `--steel-twilight` | #577095 |
| `--rust-ember` | #CD754E |

### The 240 shades

- **Source.** `docs/data/shades-240.json` is the single source. It holds 240 shades in catalog order, 24 per family, each with `id`, `index`, `name`, `shopifyName`, `hex` and `renderStem`. This file references it rather than repeating 240 rows.
- **CSS tokens.** `scripts/hero/gen-shades.mjs` generates `src/styles/shades.gen.css`: one token per shade, `--shade-<id>`, in catalog order, on `:root`, for example `--shade-frosty-white-01: #f7f7f7;` and `--shade-blissful-blue-08: #08bcf4;`. All 240 are 7,855 B raw, 1,288 B brotli. The file is generated, never edited by hand, and `Base.astro` imports it on every page. Any DOM use of a shade (swatches, the glitch ghosts) is `var(--shade-<id>)`.
- **JS constants.** The same script writes `src/config/shades.gen.ts` for the WebGL scene, where shades are render parameters (block glows, the galaxy wash, the interim swatch field).
- **Keys.** Always key by `id`, never by name. Names repeat across families: Pastel six times, Neon four times, and Royal, Indigo, Classic, Teal, Stone, Midnight, Orchid, Wine and Persian twice each.
- **Known issue.** Vivid Violet Royal (`vivid-violet-19`) and Midnight (`vivid-violet-20`) share #492376 until the real Royal value arrives.

| # | Family (display name) | Id prefix | First | Index 12 | Last |
|---|---|---|---|---|---|
| 1 | Frosty White | `frosty-white-` | Pearl | Parchment #edeee6 | Oatmeal |
| 2 | Blissful Blue | `blissful-blue-` | Electric | Royal #0040c1 | Midnight |
| 3 | Playful Pink | `playful-pink-` | Light Pink | Salmon Pink #ff6a64 | Fuchsia |
| 4 | Vivid Violet | `vivid-violet-` | Light Violet | Orchid #911489 | Eggplant |
| 5 | Mellow Yellow | `mellow-yellow-` | Sunbeam | Dandelion #f5d71d | Dijon |
| 6 | Basic Brown | `basic-brown-` | Almond | Cocoa #81553a | Umber |
| 7 | Blushing Coral | `blushing-coral-` | Bellini | Tangerine #ea821a | Rust |
| 8 | Stormy Grey | `stormy-grey-` | Pale Grey | Fog #797474 | Charcoal |
| 9 | Go Green | `go-green-` | Light Green | Lawn #4aa325 | Army |
| 10 | Roaring Red | `roaring-red-` | Pastel | Mars #b84533 | Mahogany |

Index 12 is the family's representative swatch when one is needed: type-system role note 12, the manifesto's default.

**Rules for the shades.**
- They may appear together as swatches, and as the product, in catalog order.
- They never colour headings, buttons, borders, backgrounds, icons or UI chrome (rule 24). The logotype glitch is the one approved exception (E-24).
- Neon shades (the four Neons, Gumball, Psychedelic) and pastel shades (Chiffon, Ballerina, Pale Violet) appear only as swatches (rules 49 and 50).

### Shades the hero uses (by id)

| Use | Ids |
|---|---|
| Block glows, 'cool' order, blocks 0 to 9 | blushing-coral-04 Mango #ff9f40; stormy-grey-05 Silver #acacac; frosty-white-07 Snow #f0f4f5; blissful-blue-08 Sky #08bcf4; basic-brown-07 Cinnamon #ba7237; vivid-violet-07 Amethyst #8554d1; mellow-yellow-01 Sunbeam #fff164; playful-pink-14 Rouge #f2638f; go-green-12 Lawn #4aa325; roaring-red-07 Crimson #d20000 |
| Sky galaxy wash (exception E-1/21/40) | blissful-blue-23 Space #15284f; vivid-violet-24 Eggplant #4a154d; go-green-22 Forest #084f3d; roaring-red-23 Wine #4b0923 |
| Logotype glitch pairs (one per burst; exception E-24) | Sky and Crimson (also the intro burst); Amethyst and Sunbeam; Lawn and Rouge; Sky and Mango. Lightness weights: Sky .74, Mango .78, Amethyst .56, Sunbeam .94, Crimson .54, Lawn .64, Rouge .69 |
| Section 2's interim frame | all 240, frosty-white-01 to roaring-red-24 |

The scene's light colours (key light, kicker, environment floor, horizon and sky) are render parameters, not palette colours (exception E-A2b).

### Token block

```css
:root {
  /* colour: two neutrals, one accent, one derived neutral, one scene-only colour */
  --pearl-whisper: #F7F6F3;
  --urban-slate: #383F43;
  --ember-luxe: #FF9900;
  --skeleton: color-mix(in srgb, var(--urban-slate) 12%, var(--pearl-whisper));
  --night: #050506;                      /* loader, WebGL scene, and the / page background under the hero (E-A2) */
  /* share card and stories only, never UI chrome */
  --almond-silk: #E9D9CA; --steel-twilight: #577095; --rust-ember: #CD754E;
  /* the 240 shades: src/styles/shades.gen.css, --shade-<id> */
}
```

There is no page-wide `color-scheme`. The prototype's `:root{color-scheme:dark}` is dropped, so later Pearl sections get light scrollbars and form controls (hero spec D24).

## 3. Typography Rules

### Families and files

| Family | Job | Weights | File (served at `/fonts/`) | Bytes |
|---|---|---|---|---|
| Poppins | the voice: headlines in sentence case, manifesto, enlarged tile name, "You are #212", 404 (the quiz's question is in section 3's type, below) | 700 only | `poppins-700-latin.woff2` | 8,000 |
| Source Serif 4 | the letter: first-person prose only (hero sub-line, standfirsts, founders' note, stories, confirmation sentence) | 400 (opsz 8 to 60), 600 (opsz 20) | `source-serif-4-400-opsz-latin.woff2`, `source-serif-4-600-opsz20-latin.woff2` | 48,932 and 21,252 |
| Open Sans | the fittings: labels, inputs, buttons, family names, every live numeral (tabular), eyebrow, footer, legal prose | 400 to 600 | `open-sans-400-600-latin.woff2` | 19,712 |

Total 97,896 B against a 120 KB cap. There is no italic of any face: `font-synthesis: none`. A weight that is not shipped cannot be used.

**Banned in every role:** Inter, Space Grotesk, Instrument Serif, Satoshi, Geist, Geist Mono, Manrope, DM Sans, Plus Jakarta Sans, Outfit, Urbanist, Montserrat, Lato, Playfair, League Spartan, Century Gothic, Aghita, and any monospace.

### Scale tokens (verbatim from `docs/brand/type-system.md`)

```css
:root {
  --font-display: "Poppins", "Poppins Fallback", Arial, sans-serif;
  --font-text: "Source Serif 4", "Source Serif 4 Fallback", "Times New Roman", serif;
  --font-ui: "Open Sans", "Open Sans Fallback", Arial, sans-serif;
  --font-num: var(--font-ui);

  --w-display: 700; --w-text: 400; --w-text-strong: 600; --w-ui: 400; --w-ui-strong: 600;

  --fs-hero:       clamp(2.25rem, 1.045rem + 4.944vw, 5rem);       /* 36 to 80 */
  --fs-hero-sub:   clamp(1.25rem, 1.031rem + 0.899vw, 1.75rem);    /* 20 to 28 */
  --fs-h2:         clamp(2rem, 1.343rem + 2.697vw, 3.5rem);        /* 32 to 56 */
  --fs-standfirst: clamp(1.188rem, 0.996rem + 0.787vw, 1.625rem);  /* 19 to 26 */
  --fs-prose:      clamp(1.0625rem, 1.035rem + 0.112vw, 1.125rem); /* 17 to 18, serif */
  --fs-legal:      clamp(1rem, 0.973rem + 0.112vw, 1.0625rem);     /* 16 to 17, Open Sans */
  --fs-clause:     clamp(1.5rem, 1.390rem + 0.449vw, 1.75rem);     /* 24 to 28 */
  --fs-tile-name:  clamp(1.75rem, 1.531rem + 0.899vw, 2.25rem);    /* 28 to 36 */
  --fs-family:     clamp(0.875rem, 0.848rem + 0.112vw, 0.9375rem); /* 14 to 15 */
  --fs-counter:    clamp(1rem, 0.945rem + 0.225vw, 1.125rem);      /* 16 to 18 */
  --fs-countdown:  clamp(2rem, 1.562rem + 1.798vw, 3rem);          /* 32 to 48 */
  --fs-position:   clamp(2.5rem, 1.843rem + 2.697vw, 4rem);        /* 40 to 64 */
  --fs-eyebrow:    clamp(0.75rem, 0.723rem + 0.112vw, 0.8125rem);  /* 12 to 13 */
  --fs-manifesto:  clamp(3.5rem, 1.528rem + 8.090vw, 8rem);        /* 56 to 128 */
  --fs-quiz:       clamp(1.75rem, 1.421rem + 1.348vw, 2.5rem);     /* 28 to 40 */
  --fs-small:      clamp(0.8125rem, 0.785rem + 0.112vw, 0.875rem); /* 13 to 14 */
  --fs-404:        clamp(2.5rem, 1.624rem + 3.596vw, 4.5rem);      /* 40 to 72 */

  --fs-label: 0.875rem; --fs-input: 1rem; --fs-button: 1rem; --fs-caption: 0.875rem; --fs-tile-caption: 0.8125rem;

  --lh-display: 1; --lh-h2: 1.05; --lh-tile: 1.05; --lh-quiz: 1.1; --lh-sub: 1.3; --lh-standfirst: 1.35;
  --lh-prose: 1.45; --lh-ui: 1.4; --lh-input: 1.3; --lh-small: 1.5; --lh-solid: 1;

  --ls-hero: -0.015em; --ls-h2: -0.015em; --ls-manifesto: -0.02em; --ls-tile: -0.01em; --ls-quiz: -0.01em; --ls-digits: 0.02em;

  --measure-prose: 34rem; --measure-sub: 22ch; --measure-h2: 18ch;
}
html { font-synthesis: none; -webkit-text-size-adjust: 100%; }
```

### Hero type (the approved v9.9 values; exception E-A3 in `docs/specs/hero.md`)

```css
:root {
  --fs-hero-countdown: clamp(2.3rem, 7vw, 4.8rem); /* about 37 to 77 px; Open Sans 600, tabular, line-height 1, min-width 2ch */
  --fs-hero-label: 0.875rem;                       /* countdown eyebrow and unit labels: Open Sans 600, Pearl Whisper */
  --fs-hero-cue: 0.75rem;                          /* "Scroll": Open Sans 600 */
  --fs-hero-readout: 12px;                         /* block labels: Open Sans 600, tabular, tracking 0.04em */
  --fs-loader-pct: 0.875rem;                       /* loader percent: Open Sans 400, tabular, tracking 1.1em */
  --fs-loader-status: 0.75rem;                     /* "Slow connection": Open Sans 400, Pearl Whisper */
}
```

### Section 3 type (the quiz, and section 4; exceptions E-S3-font in `docs/specs/hero.md` section 10 and E-S4-font in `docs/specs/section-4-world.md` section 10)

The quiz is set in section 2's label type, not in the three faces above (Sam, 2026-10-19: "keep the same font color and typography as well"), and so is every line of section 4, plain text on the scene with section 2's decode (Sam, 2026-10-20: "Yes, all of it"). It is an exception to rule 4, rule 19, type-system principle 9 and the monospace ban above, for the quiz, section 4 (E-S4-font) and section 2's gem labels (E-S2-font) only.

| Family | Job | Weights | Files (served at `/fonts/`) | Bytes |
|---|---|---|---|---|
| IBM Plex Mono | section 3, the quiz, every line; section 4, every line; section 2's gem labels | 500 only | `ibm-plex-mono-500-caps.woff2` (U+0020, the digits, A to Z; section 2's file) and `ibm-plex-mono-500-rest.woff2` (the rest of Basic Latin, U+00A0, U+2018 to U+201E less U+201B, U+2026) | 2,184 and 3,176 |

- **Files.** One family in two `@font-face` rules split by unicode-range (`src/styles/fonts.css`), both cut from IBMPlexMono-Medium.ttf at google/fonts@9710da1 with the same metrics (units per em 1000, ascent 1025, descent -275, every advance 600), so the two share one line box. Section 2's labels need only the capitals file; the quiz's text adds the second. The recipe and the checksums are in `scripts/fonts/manifest.txt` (SECTION 3). Outside the 120 KB cap of the three brand faces.
- **Setting** (`.quiz`). `font: 500 var(--qz-fs) / 1.45 "IBM Plex Mono", ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0; font-synthesis: none; color: var(--pearl-whisper)`, as section 2's `.s2lab`.
- **Sizes.** Since 2026-10-20 they scale with the screen (Sam: "the text is soo small, look at the screen size and look at how much area the text is covering, it doesnt make any sense"): `--qz-fs` `clamp(15px, min(0.6rem + 0.95vw, 2.6vh), 22px)`, `--qz-fs-q` `clamp(24px, min(1rem + 2.3vw, 5vh), 52px)` and `--qz-fs-big` `clamp(36px, min(1rem + 4.6vw, 10vh), 88px)`; the width term grows them, the height term holds them down on a short screen. Measured: the answers 15 px and the questions 24.97 px at 390 x 844, 20.8 and 40 px at 1280 x 800, 17.08 and 32.85 px at 1366 x 657 (every size in `docs/specs/quiz.md` section 2). Line heights 1.45, 1.25 and 1.1. Nothing under 15 px. The portrait step of section 2's labels (13 to 12 px) no longer applies to the quiz, and its old sizes (13, 22 and 36 px; 12, 18 and 28 px in portrait) are gone.
- **Capitals.** The quiz's headline and questions are drawn in capitals, which rule 4's sentence case forbids for a headline; that is part of E-S3-font. Sam's sentence case stays in the DOM, in the decode's visually hidden copy, which sets `text-transform: none` (`.quiz .sr-only`) so that assistive technology reads it as written: Chrome names an element from its rendered text, and a copy left in the section's capitals is named "BACK" (Quiz decode, under Component Stylings). The intro's heading, sub-line and Begin, and the no-JS line, are split at build into the same pair (a sentence-case `span.sr-only` beside an `aria-hidden` span drawn in capitals), the no-JS link is named "ten families" by its `aria-label`, though Chrome still lists its drawn capitals as the link's text, and the loader writes "Loading..." the same way, so before the chunk has mounted and without JavaScript the accessibility tree carries Sam's case too, that link's text aside (`docs/specs/quiz.md` section 2).
- **Section 4** (`.room`, `src/styles/room.css`). The same setting on the section's root: `font: 500 var(--rm-fs) / 1.45 "IBM Plex Mono", ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0; font-synthesis: none; color: var(--pearl-whisper)`. Its two sizes are the quiz's own, `--rm-fs` equal to `--qz-fs` (15 to 22 px) and `--rm-fs-q` to `--qz-fs-q` (24 to 52 px), which `tests/unit/room.test.ts` holds equal: a scene's name (`h3.rm-scene-name`) at `--rm-fs-q` / 1.25, balanced, and every other line, the prompt, Skip, the hints, the loading lines and the words at `--rm-fs` / 1.45; the count with tabular numerals. Nothing under 15 px. Sentence case stays in the DOM, in the decode's visually hidden copy (`.room .sr-only { text-transform: none }`), as in the quiz.

### Element rules (from type-system.md)

```css
h1, h2, .manifesto, .quiz-q, .tile-name, .position, .h404 { font-family: var(--font-display); font-weight: 700; text-transform: none; }   /* .quiz-q is type-system.md's quiz question; the quiz's own h2 (.qz-h) and questions (.qz-q) are in section 3's type instead (E-S3-font, above) */
.hero-sub, .standfirst, .prose { font-family: var(--font-text); font-weight: 400; font-optical-sizing: auto; font-variant-numeric: proportional-nums; }
.prose strong, .prose em, .on-slate .standfirst, .on-slate .prose { font-weight: 600; font-style: normal; }
body, label, input, button, .legal, .caption, .family, .footer { font-family: var(--font-ui); font-weight: 400; }
button, label, .footer a { font-weight: 600; }
.counter, .countdown, .eyebrow, .idx, input[type="tel"] { font-family: var(--font-num); font-weight: 600; font-variant-numeric: tabular-nums; }
```

The hero's visually hidden `h1` uses `--font-ui`, so `/` downloads no Poppins.

### Loading

- The `@font-face` rules and the five fallback faces are copied verbatim from `type-system.md`. Never `format("woff2-variations")`.
- `font-display: swap` for every face.
- On `/` the one preload is `open-sans-400-600-latin.woff2`, because the hero shows no Poppins (hero spec D14). Pages with a Poppins headline preload `poppins-700-latin.woff2` instead.
- The fallback overrides, quoted from `scripts/fonts/manifest.txt` (never typed by hand):

```
Poppins Fallback 700: size-adjust 106.70%; ascent-override 98.41%; descent-override 32.80%; line-gap-override 9.37%
Open Sans Fallback 400: size-adjust 104.30%; ascent-override 102.47%; descent-override 28.09%; line-gap-override 0.00%
Open Sans Fallback 600: size-adjust 100.92%; ascent-override 105.91%; descent-override 29.03%; line-gap-override 0.00%
Source Serif 4 Fallback 400: size-adjust 110.69%; ascent-override 93.59%; descent-override 30.26%; line-gap-override 0.00%
Source Serif 4 Fallback 600: size-adjust 106.14%; ascent-override 97.61%; descent-override 31.56%; line-gap-override 0.00%
```

### Hard rules

- Headlines are sentence case, never all caps.
- No digit inside an h1, an h2 or the manifesto. The one exception is `.h404`.
- No live number in Poppins.
- Source Serif 4 is never above 28 px in the DOM, never below 17 px, never a headline, never UI.
- Nothing on the site is under 12 px.

## 4. Component Stylings

### Focus ring (every focusable element)

- **Default.** `outline: 2px solid var(--ember-luxe); outline-offset: 2px` on `:focus-visible` (CHECKLIST E3), except on the quiz's three script-focused elements, which are no controls and draw no ring (Quiz, below).
- **Two-tone where the background can be light.** A 2 px Urban Slate ring drawn by `::before` (`position: absolute; border: 2px solid var(--urban-slate)`) inside the Ember Luxe outline. Ember Luxe carries the ring on dark grounds, Urban Slate carries it on Pearl Whisper (9.9:1), and the two rings differ by 5.0:1. No `box-shadow` (rule 25). The hero uses it on the logotype and on the countdown's link (hero spec D21); every Pearl section uses it on every control.

### Corner logotype (`a.site-logo`, every page)

- **Placement.** Fixed top left at `--inset` (plus `env(safe-area-inset-top)`).
- **Artwork.** The SKREED wordmark from `docs/brand/logo/skreed-logotype.svg` (viewBox 1209.46 x 292.9), drawn in `currentColor`. It is never re-set.
- **Size.** 96 px wide; 136 px from 1024 px.
- **Hit area.** An `::after` with `inset: -11px -8px` gives 112 x 45 px at 96 px.
- **Colour.** Pearl Whisper. `data-tone="light"` switches it to Urban Slate (the hero sets this once the wipe passes half way).
- **Focus.** The two-tone ring: Ember Luxe outline at a 6 px offset, Urban Slate ring 2 to 4 px outside the box.
- **States.** It is a control, so it has hover and press states: the glitch burst, 0.25 s on pointer enter, touch press and `:focus-visible`. The intro burst is 0.5 s: at the loader's cut on the 3D path, 0.75 s after install on the poster path, never after a failure. There is no idle twitch in production (WCAG 2.2.2, hero spec D20). There are 48 clip slabs (8 rows by 6 segments). The colour split uses the shade pairs in section 2, filled with `var(--shade-<id>)`.
- **Reduced motion.** The glitch is off. It checks the setting live before every burst.
- **Link.** `href="/"`, `aria-label="Skreed, home"`.

### Back to top (`a.to-top`, every page)

Sam, 2026-10-19: "add a back to top button throughout the site which navigates back to main section 1, without reloading". `src/components/shell/BackToTop.astro`, `src/scripts/shell/to-top.ts`, `src/styles/to-top.css`.

- **Element.** A link to `/` (so it works without JavaScript) reading "Back to top", which is its accessible name (no `aria-label`, no `title`), then the scroll cue's five-dot chevron (`ScrollCue.astro`) turned to point up, at the cue's own size (17.5 x 9 px, the outer dots at 0.3 and the next at 0.6 as on the cue), static (rule 45: never animated).
- **Look.** No box. Sam, 2026-10-20, of the 44 px Pearl Whisper square it was: "fix that and make it look a part of the site". It is set as "All families" is on a family page: Open Sans 600 at `--fs-label`, line height 1, no fill, no border, no shadow, in a 44 px tall hit row padded `var(--s2)` at each side, the chevron `var(--s1)` after the words. Its colour is the logotype's: Pearl Whisper, and Urban Slate while the logotype is Urban Slate over the light fog (`to-top.ts` copies the logotype's `data-tone`); on a family page, Pearl Whisper.
- **Contrast.** Measured on 2026-10-20 (a hooks build, the words against the ground beside them): 18.7 to 19.4:1 on the stars and 18.9:1 on a family page. On the fog, Urban Slate is 4.3 to 4.4:1 at 1280 x 800 and 2.5 to 3.4:1 at 390 x 844; over section 4's light hall, where the logotype stays Pearl Whisper, it is 1.9:1 at 1280 x 800 and 4.0:1 at 390 x 844. Below AA on the fog, the same open item as the quiz's text.
- **Placement.** The chevron's right edge on `--inset` (the hit row is set out past it by its padding), as the logotype's left edge is. The landing page: fixed top right, centred on the logotype's row, `z-index: 4` (the logotype's layer). A family page: in the bar's free right end on phones (`z-index: 6`, over the bar), and under "All families" on the family page's wide layout (`(min-width: 900px) and (min-height: 600px)`), clear of the Matte and Gloss switch.
- **When.** The landing page: hidden in its first screen (section 1 is where it leads), shown past it. A family page: always.
- **Press.** The landing page: a `--night` veil fades in over 250 ms, the page jumps to section 1 in place (the hero's own jump, `window.__skreedTop`: scroll 0, the scroll followers snapped, section 4 reset for its next lap; a plain instant scroll on the poster tier), and the veil lifts once the hero has drawn its rest frame. No reload and no smooth scroll back through the sections. Keyboard focus moves to the logotype. A family page: it steps back through the history to the landing page (the Navigation API's entries, else the referrer and `history.back()`); the browser restores the landing page from its back-forward cache without a reload, and a `sessionStorage` flag makes it jump to section 1 under the veil. With no landing page behind it, the link navigates to `/`, its files from the cache (`public/_headers`).
- **States.** As "All families" (`.press`): hover (`hover: hover`) `translateY(-1px)`, press `scale(0.98)`, both over `--dur-press` on `--ease-standard`; the chevron never moves by itself (rule 45). The two-tone focus ring (Ember Luxe at 2 px, Urban Slate inside).
- **Reduced motion.** The cut with no veil; no hover lift and no press scale.
- **Analytics.** `to_top { from }` through section 3's `track()`.

### Countdown (hero)

- **Placement.** Bottom left at `--inset`. Below 1100 px it would reach the middle, so it sits 84 px higher and the cue sits under it. On the poster path it sits in the first screen and scrolls away with it.
- **Eyebrow.** "Launch in", Open Sans 600 at 14 px.
- **Groups.** Four columns (days, hours, minutes, seconds) with gap `clamp(var(--s3), 4vw, 44px)`. Each holds a numeral at `--fs-hero-countdown`, 600, tabular, always two digits, `min-width: 2ch`, with a unit label 600 at 14 px under it, `gap: var(--s1)`. All Pearl Whisper.
- **Semantics.** `role="timer"`, `aria-label="Time until launch"`.
- **First tick.** The numerals stay hidden until the first tick, which runs in the same task.
- **At zero.** The eyebrow reads "Skreed is live. skreed.com", with "skreed.com" a real link: Pearl Whisper, underlined, `pointer-events: auto`, a hit box at least 44 px tall, the two-tone focus ring. The numerals are not displayed (`.count[hidden]{display:none}`).
- **No JavaScript.** One line, "Launching 15 November 2026", with the date in a `<time>`; the eyebrow and the numerals are not displayed.
- **Reduced motion.** The seconds group is hidden.

### Scroll cue (hero)

- **One cue, in the middle.** Sam, 2026-10-20: "put only one in the middle"; the two side cues clashed with the countdown. Bottom centre, its bottom edge on `--inset`. From 1100 px it sits on the countdown's row, right of the numerals. Below 1100 px it sits under the lifted countdown, 11 px clear of it.
- **Parts.** ciao's side icon re-created (docs/specs/hero.md 12.3): one 17.5 x 73 px column of three five-dot chevrons, our own SVG, in Pearl Whisper. No text.
- **Animation.** Each chevron is drawn top down, held and wiped top down on a 2.5 s linear cycle (`cue-top`, `cue-mid`, `cue-bottom`). It cycles for as long as it is shown (E-cue-motion).
- **Hiding.** It fades out in 0.5 s once `scrollY` passes 8 px, during the wipe and while the loader and the intro run. It is hidden when there is nothing below to scroll to, and without JavaScript.
- **Reduced motion.** It is still, the three chevrons shown.
- **Not an arrow.** Rule 45 bans animated arrows.

### Loader (hero, 3D path only; exception E-H1)

- **Layout.** Full screen on `--night`, with the wordmark centred at `min(47.6svh, 72vw, 600px)`.
- **Layers.** A CSS mask over three layers:
  - the rest, Pearl Whisper `#F7F6F341` (25.5 percent);
  - the fill, Pearl Whisper behind a soft edge 0.22 of the width;
  - the light band, about 0.3 of the width, tilted 5 degrees.
- **Exit.** A hairline outline (stroke Pearl Whisper at 0.42) appears.
- **Percent.** Bottom centre at `clamp(40px, 9svh, 88px)`, `--fs-loader-pct`.
- **Status line.** Above the percent, `--fs-loader-status`, Pearl Whisper.
- **Poster state.** On a stall or offline the loader becomes a transparent overlay over the poster image, showing only the status line ("You are offline. The countdown still runs." when offline, nothing on a stall).
- **Semantics.** `role="progressbar"` with `aria-valuenow`, removed in its poster state. Everything behind it is `inert` while it shows.
- **Compositor only.** Everything moves by transform and opacity through Web Animations.

### Block labels (hero canvas overlay)

- **Parts.** A 3 px square Pearl Whisper pip and a two-digit readout, `--fs-hero-readout`, 6 px gap.
- **Placement.** By transform only. Up to five at once.
- **Links.** Pearl Whisper at 35 percent, drawn in the canvas.

### Poster (hero)

- **Markup.** One `<picture>` with four `<source>` elements (wide AVIF and WebP for `(min-aspect-ratio: 9/10)`, portrait AVIF and WebP for the rest), each with `width` and `height`, and one `<img>`. One request per page view.
- **Classes.** Phone 488 x 1056, desktop 1920 x 1200. Each is at most 120 KB.
- **Layout.** On the 3D path, fixed at inset 0 with `object-fit: cover` under the canvas, hidden from the lift on. On the poster path, positioned in the first 100svh, so it scrolls away with the first screen.
- **Loading.** `fetchpriority="high"`, never lazy, AVIF preloaded per class with the same media strings.
- **Alt.** A short description of the mark on the snowfield.

### Primary button (later sections; type-system note 7)

- **Fill and text.** Ember Luxe fill, Urban Slate text, using the literal hex.
- **Type.** Open Sans 600 at 16 px.
- **Size.** Minimum height 48 px, padding from the spacing scale, square corners.
- **States.** Hover `translateY(-1px)`; press `scale(0.98)`; both 150 ms on `--ease-standard`. No opacity change, no darker orange.
- **Focus.** The two-tone ring, because the Ember Luxe outline sits on the page around the button, and on Pearl Whisper it alone measures 2.0:1.

### Quiz (section 3, `section#find`; `src/styles/quiz.css`, `src/components/quiz/Quiz.astro`)

- **No boxes.** Sam, 2026-10-19: "first remove that white box, it looks like an amozon page, with the orange button and everything ... just plain text on the fog backround with the same animation, no boxes or anything". No panel, no fill, no border round anything, no shadow and no Ember Luxe button: plain text straight on the hero's fog (E-S3-bg), the controls words. The section has no background of its own; on the poster tier and under reduced motion (no island) the text stands on the page's `--night`. The shade swatches are its one colour. `box-sizing: border-box` on everything in it. A tap draws no box either: `-webkit-tap-highlight-color: transparent` on the links, the answers, the consent row and the no-JS link. `tests/unit/quiz-decode.test.ts` fails on any fill, shadow or filter in `quiz.css`, and on any border but the swatch hairline, the email field's line and the focus ring.
- **Type** (E-S3-font; Section 3 type, under Typography Rules). Every line is section 2's label type, set once on `.quiz`: IBM Plex Mono 500 in capitals, no letter-spacing, Pearl Whisper. `--qz-fs` (15 to 22 px) for the body, the answers, the controls and the count; `--qz-fs-q` (24 to 52 px) for the headline, the questions, the gift's heading and "Found the perfect shade? Make it yours!"; `--qz-fs-big` (36 to 88 px) for the shade's name; each a clamp on the viewport's width and height (Section 3 type, under Typography Rules). Line height 1.45 for the body, 1.25 for the heading step (balanced), 1.1 for the shade's name. The answers pad 0.4 em above and below and the small swatches are 1.1 em, so they grow with the type. Tabular numerals on the count and the family line. The text is below AA on the fog (E-S3-contrast; the measured ratios are in `docs/specs/quiz.md` section 6).
- **Width.** The intro, the questions (`.qz-cards`), the results and the gift's column are at most 560 px wide on phones. On laptops (900 px wide and 600 px tall or more) the intro is `min(78vw, 1040px)`, the questions `min(90vw, 1240px)` (they hold the picture frame beside the words) and the results and the gift's column `min(84vw, 1120px)`: 998.4, 1152 and 1075.2 px at 1280. All are centred in the stage (the gift's column in its own block after the stage, by `margin: 0 auto`).
- **Stage** (`.qz-stage`). `min-height: 100svh`, a grid with `align-content: end` on phones and `center` on laptops, padded by `--inset` plus the safe areas, and on laptops 64 px more at the top, so the centred text clears the fixed logotype's band. In the result state it drops the minimum height and pads 56 px more at the top, so at the section's top the result starts under the fixed logotype's band.
- **Focus.** The two-tone ring on keyboard focus only (`:focus-visible`): the Ember Luxe outline at 2 px with a 2 px offset, and a 2 px Urban Slate ring drawn by `::before` at `inset: -2px` on the links and the answers (`.quiz :is(.qz-link, .qz-opt):focus-visible::before`). The question on screen, the shade's name and the done line take focus from script only (`tabindex="-1"`) and draw no outline and no ring (`.quiz :is(.qz-card, .qz-shade, .qz-done-text):focus { outline: none }`): they are no controls. The email field shows focus as its line at 3 px, with no outline box (2 px marks an error, so focus still shows on an invalid field). The consent row carries both rings round "[ ]" and its words (`.qz-check:has(input:focus-visible)`); where `:has()` is unsupported (`@supports not selector(:has(*))`) the Ember Luxe outline goes round "[ ]" alone (`input:focus-visible + .qz-tick`), since the box it stands for is unseen.
- **Without JavaScript.** The intro reads as drawn, "Swipe to begin" is hidden (`html:not(.js)`), and the no-JS line links to `/#families`. Its lines, like the intro's, carry a sentence-case copy for assistive technology beside the drawn capitals, and the link is named "ten families" by its `aria-label`. Its link's hit box is an `::after` at `inset: -15px -8px` round the link, so it is at least 44 px tall (CHECKLIST B2) where the link sits on one line: 49.5 px at 360 x 780, 390 x 844 and 844 x 390, 52.5 px at 768 x 1024, 55.5 px at 1024 x 768, 57.5 px at 1280 x 800 and 53.5 px at 1366 x 657 (measured by hit testing with JavaScript off, 2026-10-20). At 430 x 932 the link wraps after "ten", and "families", on the second line, takes a tap only on its own 20 px line, under 44 px (an open defect, `docs/specs/quiz.md` AC4).

### Quiz link (`.qz-link`: "Swipe to begin", Back, "See it on the case", "Not quite? Try again", "Send my gift", "Not you? Use another email.")

- **Element.** A `<button>`, or an `<a>` for "See it on the case", drawn as words: no fill, no border, square, the section's type and colour, left aligned.
- **Size.** `display: inline-flex`, minimum height and minimum width 44 px, no padding, so each is 44 px tall and as wide as its words, never under 44 px. Back, four letters of 0.6 em, takes the 44 x 44 px minimum wherever the body is under 18.3 px (every phone, 768 x 1024, 1366 x 657) and is as wide as its word above that (46.4 px at 1024 x 768, 49.9 px at 1280 x 800; measured 2026-10-20); the others are wider by their words.
- **States.** Underlined as links are, 1 px at a 0.4 em offset, written as the longhands `text-decoration-line` and `text-decoration-thickness` (as every underline `quiz.css` sets is: Safari before 26.2 drops a `text-decoration` shorthand that carries a thickness, underline and all); on hover (`hover: hover` only) the line thickens to 2 px at once, with no transition (no transition anywhere in the quiz; CHECKLIST C3). While the chunk loads or the form sends the control is `aria-disabled` (never the `disabled` attribute) and reads "Loading...", "Sending..." or "Still trying...", and its line does not thicken.
- **Uses.** "Swipe to begin" on the intro; Back in the footer of questions 2 to 10 (`.qz-foot`, a 44 px row); "See it on the case" (to the drawn shade on its family page, `/shades/<family>/?shade=<nnn>`) and "Not quite? Try again" side by side under the result (`.qz-actions`, wrapping, `gap: 0 var(--s4)`); "Send my gift" and "Not you? Use another email." in the gift.
- **Focus.** The two-tone ring (Quiz, above).

### Quiz question (`.qz-card`)

- **One on screen.** Ten questions, one per `.qz-card` in `.qz-cards`, all in one grid cell (`display: grid` on the deck, `grid-area: 1 / 1` on every card), so the deck is as tall as its tallest question on every screen and nothing under it moves from one question to the next. A `hidden` card keeps its place in the cell (`.qz-card[hidden] { display: grid; visibility: hidden; }`). Only the question on screen shows (`.is-top`); every card keeps `tabindex="-1"`, and the one on screen is focused from script, with no ring, so it is announced and Down or Tab reaches its answers. The rest are `hidden` and `inert`, and no card is stacked behind it. A hidden card renders no picture frame, so at 1366 x 657, where a visual question's frame is taller than every question's words, the deck grows 5.4 px while a visual question is on screen (an open defect). Each card is `role="group"` named "Question n of 10".
- **Rows.** A grid of four rows, `auto auto 1fr auto` (the count, the question, the seven answers, the footer), `gap: var(--s3)`, `align-content: start`, everything left aligned, `user-select: none`. On laptops every card has a second column for the picture frame, `clamp(260px, 30vw, 440px)` wide after a `clamp(32px, 4vw, 80px)` gap; the word-only questions keep it empty, so every question's words take the same width (716.8 px at 1280).
- **Count** (`.qz-count`). "01 / 10" over the question (`QUIZ_COPY.count`), `aria-hidden` (the group's name says it in words). It replaces the ten-dot stepper, which is gone.
- **Question** (`.qz-q`). At `--qz-fs-q` / 1.25, balanced. No digit in it.
- **Visual questions.** The five Sam marked VISUAL (the Sunday, the dream trip, the desk, the room and the outfit; `visual: true` in `src/config/quiz.ts`) carry `data-visual` on the card and, where the pictures are on the build, `data-pics` and a picture frame: one stock photograph per answer (Quiz picture, below). Without the files they are words only, laid out exactly as the other five.
- **Input.** An answer is taken by a tap, a click, Enter or Space on it. Up and Down move focus among the seven answers of the question on screen; from the card itself Down goes to the first answer and Up to the last. No drag and no swipe: there is no `grab` cursor and no `touch-action` rule, so the page scrolls over a question as over any text. A press on an answer or on Back within 350 ms of the question being put on screen (150 ms under reduced motion) is dropped, so the second click of a double click on Begin, an answer or Back cannot act on a question whose words are still at opacity 0.

### Quiz answer (`.qz-opt`)

- **Element.** A real `<button type="button">` carrying `data-persona`, text only, no `aria-label`: its name is its own words, kept in sentence case in the decode's visually hidden copy (Quiz decode, below). Seven per question, one per personality, in one column (`.qz-opts`, a grid with no gap, `align-content: start`), in a fixed shuffle per question (`SHOWN` in `src/config/quiz.ts`), so an answer's position never gives its personality away.
- **Line.** Plain words: full width (`display: block; width: 100%`), no fill, no border, minimum height 44 px, padding 0.4 em 0 (one line is 44 px tall up to 19.3 px type, 46.8 px at 20.8 px), left aligned; a long answer wraps and its line grows.
- **States.** Hover (`hover: hover` only): a 1 px underline at a 0.4 em offset, at once. The answer taken (`aria-pressed="true"`): a 2 px underline; it stays while the rest of its question wipes out, holds 120 ms (none under reduced motion) and then goes. Every question shown clears the attribute, so an answer seen again through Back is not underlined. On a visual card the answer under a mouse or pen, in keyboard focus or pressed by a finger also shows its picture (Quiz picture, below).
- **Focus.** The two-tone ring (Quiz, above).

### Quiz picture (`.qz-pics`, `src/scripts/quiz/picture.ts`; the five visual questions)

- **What it is.** Sam, 2026-10-20: "for any question that is visual, open envato and pick pictures relating to that specific option, get it and put it next to the question, and that image should appear only when u hover over that option". One Envato Elements stock photograph per answer of the five visual questions, 35 in all, licensed to Sam's account, costing nothing beyond the paid Elements subscription he already has (not free stock), and listed with their Envato items in `src/config/quiz-pictures.ts`; none is generated ("no like dont generate anything, use the stock images which are available for free"). One frame per visual card (`div.qz-pics`, `aria-hidden`) holds one `picture.qz-pic[data-persona]` per answer: AVIF and WebP at two widths with `sizes`, `alt=""`, lazy. The photograph stands on the fog with square corners and no border, fill or shadow.
- **When it shows.** The answer under a mouse or pen (`pointerenter`; `pointerleave` hides it unless it is the answer taken), in keyboard focus (`:focus-visible`; blur hides it), or pressed by a finger, after which the answer, taken, waits until its picture has settled (at most 0.9 s) before it goes, where the frame is drawn and not under reduced motion; a press that turns into a scroll (`pointercancel`), or a tap the guard drops, takes its picture off. One at a time: the outgoing picture wipes out while the incoming one decodes in over it. A new question opens with none. A picture still loading shows when its file arrives only if it is still the one last asked for and its frame is still drawn, so one whose answer was left meanwhile never comes on (`show()` in `picture.ts`). Only the question on screen loads its pictures (a hidden card renders no frame), its seven at the one width `sizes` picks.
- **On a phone.** Above the question, in the space the bottom-aligned stage leaves under the logotype's band: the column's width, from 72 px under the stage's top to 24 px over the card (its count line), at most 40% of the screen's height (`--qz-pic-h`, set by `deck.ts`), and not drawn with under 96 px of room: 358 x 139 px at 390 x 844, 398 x 255 px at 430 x 932, 560 x 308 px at 768 x 1024; none at 360 x 780 or on a landscape phone (measured 2026-10-20).
- **On a laptop.** The card's second column, beside the words: `clamp(260px, 30vw, 440px)` wide, `aspect-ratio: 4 / 5`, its top level with the count (384 x 480 px at 1280 x 800).
- **Reveal.** The text's decode on a photograph (timings in section 10, Motion): the frame is cut into twelve vertical strips, each drawing the picture as a background sized as `object-fit: cover` (through the CSSOM); the strips fade in left to right over 0.4 s while each rolls through its neighbours' slices to its own, settled at 0.75 s, and the picture settles from 1.03 to 1 in scale. It goes as a right-to-left wipe over 0.2 s, a scale not yet settled easing to 1 over it. Reduced motion: a 0.2 s fade, no roll, no scale. Built on 2026-10-20 at Sam's request; his approval of E-S3-motion covered the text's decode only, so the slice swap (a `background-position`, outside CHECKLIST C3) and the scale wait for his confirmation (`docs/specs/quiz.md` section 10, item 17).
- **Files.** Not in git: the repository is public and the licence does not allow the files to be shared. They are built on the build machine by `scripts/quiz/prepare-pictures.py` and `scripts/quiz/encode-pictures.mjs` into `src/assets/quiz/pics/`; without them the visual questions are words only. Every build folder carries them too, encoded under `_astro/`, so `.gitignore` keeps every build folder at the root out as well (`/dist*/`), and the review frames that show a picture (`docs/specs/screenshots/licensed/`; `docs/specs/quiz.md` D41 and section 10, item 16).

### Quiz decode (`src/scripts/quiz/decode.ts`; E-S3-motion)

- **What it is.** Section 2's label animation (`src/scripts/hero/section2/labels.ts`) on the quiz's text, on every change of screen (timings in section 10, Motion). Every element marked `data-dc` in `Quiz.astro` takes part; the gift's error, status and done lines and "Not you? Use another email." are split too, but never decoded (Markup, below).
- **Markup.** The text of each is split once into a visually hidden span holding Sam's sentence-case text (the accessible name; `.quiz .sr-only { text-transform: none }`, since Chrome names an element from its rendered text) and an `aria-hidden` row (`.dc`) of one span per character, upper-cased as section 2 prints its labels, spaces included (a link's underline is drawn per span, so no bare space shows its piece of line early). Only the markup's ASCII whitespace is collapsed, so the no-break space in "11 p.m." survives. Markup the server split already (the intro's heading and sub-line; Section 3 type, above) gives its text from its `.sr-only` copy; Begin is given `QUIZ_COPY.begin`, since its copy may read "Loading..." at mount. The gift's error lines, its status line and its done line, and the send words' "Sending..." and "Still trying...", are split the same way as they are written, at once with no animation (`set()`); "Not you? Use another email." is split at mount, visible. Only printable ASCII rolls: Plex Mono has no U+201B or U+201F, so the curly quotes, the no-break space and the ellipsis fade in without rolling and no glyph falls back to another face mid-roll.
- **Order.** The elements of a screen decode in 0.05 s apart (the step shrinking so the last starts within 0.6 s); the wipe out starts them all together. A start in the same direction while an element's run is under way joins that run instead of restarting it, as `labels.ts`'s `setOn()` does, so no glyph flashes back. `#find` carries `data-decoding` while any text moves. A hidden document draws no frames, so there every run jumps to its end state.
- **Flow.** The intro is visible at rest, split into glyphs as it stands (rule 12's visible-at-rest clause; its motion list is waived for the decode by E-S3-motion). Begin wipes it out and question 1 decodes in. An answer: it is underlined, the rest of its question wipes out, it holds 120 ms and goes, then the next question (or the result) decodes in. Back: the question wipes out and the previous one decodes in. The result and the gift are first put straight to hidden (`conceal()`), so a label written at once earlier ("Send my gift", written back whenever a send ends) decodes in with the rest, then they decode in while the swatches fade in on opacity. "Not quite? Try again": a send under way is abandoned (aborted, and its answer, should one still come, writes no error line, announcement or done state; Send's label is left to the wipe and "Send my gift" is put back before the next gift decodes in), the gift's error and status lines are cleared, the result and the gift wipe out, question 1 decodes in and the page scrolls back to the section's top. Each new question takes no press for its first 350 ms (Quiz question, above). Nothing in the quiz's text uses a transform (the one transform is a picture's settle, Quiz picture, above); the card fly-off is gone.

### Result swatch (`.qz-big`) and the compatible list (`.qz-also`)

- **Shape.** A 120 px circle (`--radius-round`), `clamp(160px, 18vw, 260px)` on laptops (230.4 px at 1280), first in the result. On phones the result is one column, `gap: var(--s4)`, left aligned; on laptops it is two, `clamp(160px, 18vw, 260px) 1fr`, `align-items: start`, `column-gap: clamp(32px, 4vw, 72px)`.
- **Fill.** The drawn shade: `pickShade` draws one shade of the personality's group at random (Sam, 2026-10-16), and `deck.ts` sets the big swatch's `data-shade` and paints `background: var(--shade-<id>)` through the CSSOM, as it paints every swatch in the section (the CSP has no `style-src-attr`, so no style attributes and no per-shade CSS rules). The markup carries the group's first shade, Sam's recommendation, until the draw replaces it. The swatches fade in on opacity as the result decodes (section 10, Motion).
- **Hairline.** Unchanged by the plain-text build: `data-ring`, a 1 px Urban Slate ring on any shade under 1.5:1 on Pearl Whisper (`needsRing` in `src/config/quiz.ts`), computed at build from the catalog hex and set on every compatible swatch; `deck.ts` copies the drawn shade's flag to the big swatch. In the seven groups that is nine shades: Porcelain, Almond, Powder, Linen, Sunflower, Mimosa, Bumblebee, Daffodil and Pale Violet. It is the family page's `--swr` precedent (`src/styles/family.css`). On the night ground (`html:not(.hero3d)`: the poster tier, reduced motion, no JavaScript) the ring is decided against `--night` instead: the Urban Slate ring is off (`border: 0`), and `data-ring-night` (`needsRingNight`, a shade under 3:1 against #050506, WCAG 1.4.11's ratio for a graphic) draws a 1 px Pearl Whisper ring on ten shades: Burgundy, Claret, Wine, Midnight, Sapphire, Chestnut, Fig, Pine, Navy and Prussian. `deck.ts` copies both flags to the big swatch. No other swatch has a border.
- **Beside it** (`.qz-rtext`, a grid with `gap: var(--s2)`, left aligned), in order, all in the section's type: "Your shade"; the drawn shade's name and a full stop at `--qz-fs-big` / 1.1 (`tabindex="-1"`, focused when the result shows, with no ring); the family line ("Blissful Blue, shade 15 of 24") with tabular numerals; "Best in gloss." or "Best in matte."; the personality's name alone, no tagline; the personality profile and the colour profile, each within 60ch; "Also compatible with"; the compatible list; "Found the perfect shade? Make it yours!" at `--qz-fs-q` / 1.25, balanced; then the two links (Quiz link, above). The personality's name, "Also compatible with" and the closing line each take a `margin-top: var(--s2)` over the gap.
- **Compatible list** (`ul.qz-also`). The rest of the group in Sam's order, five or six shades (the drawn shade's own item is `hidden`; The Spark's group has six shades, the others seven), as a legend in columns: `repeat(auto-fill, minmax(min(100%, 12em), 1fr))` with `gap: var(--s1) var(--s3)`: one column at 360 and 390 px, two from 430 px to 1024 x 768, three at 1280 and 1366 (measured 2026-10-20). Each `li.qz-mini` is a row (`display: flex`, `gap: var(--s1)`, minimum height 24 px): a circle 1.1 em across (`.qz-mini-sw`, painted and ringed as the big swatch), then the shade's name in the section's type and colour, never in the shade. The items are not links.

### Gift (`.qz-gift`, the email form; rendered only with `PUBLIC_LEADS` on)

- **Place.** Right after the result, padded `var(--s5)` at the top, `var(--inset)` at the sides, and `var(--inset)` plus the safe area at the bottom. Its column (`.qz-gift-in`, a grid with `gap: var(--s3)`) is at most 560 px wide, `min(84vw, 1120px)` on laptops, centred; on laptops it is indented by the swatch column and its gap (`padding-left: calc(clamp(160px, 18vw, 260px) + clamp(32px, 4vw, 72px))`), so its words start on the result's text column.
- **Text.** "And here’s a little something extra." at `--qz-fs-q` / 1.25, balanced, then the sub-line within 60ch. The form's parts (`.qz-form`, `.qz-fields`, `.qz-done`) are grids with `gap: var(--s2)`, left aligned.
- **Email field** (`.qz-input`). A line to write on: `width: 100%` of the fields' block, which is as wide as the form's widest line, so the field takes the column's width where a line of the form wraps (358 px at 390 x 844, 793.6 px at 1280 x 800) and the fine print's width where that fits on one line (707.3 px in the 819.5 px column at 1366 x 657; measured 2026-10-20); minimum height 44 px, no padding and no box, a 1 px Pearl Whisper bottom border only, a transparent ground, Pearl Whisper text and caret, the section's mono at 16 px at every size rather than the body size (15 px on a phone), because iOS Safari zooms the page on focusing a smaller field (section 8); the address keeps the case it is typed in (`text-transform: none`). `aria-invalid="true"` doubles the line to 2 px; nothing turns red. On focus the line is 3 px, a pixel more than an error's so focus still shows on an invalid field, and there is no outline (an input is focus-visible on every focus, a click included). Autofill is held off: the browsers' fill is `!important` in their own sheets, so `:-webkit-autofill` and `:autofill`, in two rules (a list with one unknown selector drops both), keep the text and caret Pearl Whisper and delay the fill's transition by 86400 s. Its label, "Email", sits above it.
- **Consent** (`label.qz-check`). A 44 px row, a grid of `auto 1fr` with `gap: var(--s2)`: "[ ]", or "[X]" once ticked (`.qz-tick::before`), then the words. The native checkbox stays in the tree for the keyboard and assistive technology, 1 px and transparent. Focus: the two-tone ring round the row, or the outline round "[ ]" alone where `:has()` is unsupported (Quiz, above).
- **Messages.** One line is always reserved under each field (`min-height: 1.45em`), so a message appearing or clearing never moves the controls below it; then the status line under "Send my gift" and the fine print, all in the section's type. An error line is not a live region: when focus does not move to its field (the field has it already, as after Enter in it), the message is announced through the section's live region, and on a 422 focus moves to the email field. Once sent, the done line (`tabindex="-1"`, focused, with no ring) and "Not you? Use another email."; the done line breaks anywhere (`overflow-wrap: anywhere`), since the address in it is one long word, so it never runs past the gutter. The messages, the status and the done line are written at once, not decoded, each split into its sentence-case copy and its row of capitals (Quiz decode, above), so the field's description and the status are read as written.

### Text button (`.txtbtn`)

- **Type.** Open Sans 600 at `--fs-button` / `--lh-solid`, the panel's text colour, no fill, no border.
- **Size.** A hit area of at least 44 x 44 px (Tap targets, section 8; CHECKLIST B2): minimum height 44 px, padding `var(--s2) 0`.
- **States.** An underline at a 3 px offset, transparent at rest and coloured in on hover and on `:focus-visible` only at once (no transition: nothing but transform and opacity animates, CHECKLIST C3). No transform.
- **Uses.** None. The quiz stopped using it on 2026-10-19 (its controls are quiz links, above) and section 4 on 2026-10-20 (Skip is a section 4 link, below); no element of the site carries `.txtbtn`. The pattern stays here for a later section that needs it.
- **Focus.** The two-tone ring (Focus ring, above).

### Section 4 stage (`section#room`; `src/styles/room.css`, `src/components/room/Room.astro`, `src/scripts/room/walk.ts`)

- **No boxes.** Sam, 2026-10-19, of the quiz: "just plain text on the fog backround with the same animation, no boxes or anything", and of section 4 on 2026-10-20: "Yes, all of it". Every element of the section is plain text on the scene: no panel, no fill, no border but the focus ring's, no shadow, no blur and no Ember Luxe button, on any tier. The controls are words, underlined as the quiz's links are. `box-sizing: border-box` on everything in it. `tests/unit/room.test.ts` fails on any background but `none`, `--night` or `--skeleton`, any border outside the focus ring, any `box-shadow`, `backdrop-filter` or `filter`, any gradient, a radius other than 0, a style attribute, and the classes `rm-pill`, `btn` and `txtbtn` (`docs/specs/section-4-flux.md` AC10).
- **Ground.** On the 3D path the section has no background of its own. A track of 1580svh in every state (`.room .rm-track`, `ROOM_HEIGHT` 15.8 screens in `src/config/room.ts`) holds a sticky 100svh stage (`.rm-stage`, `overflow: clip`) over the hero's canvas, which draws the hall, the bubble and the five scenes (`docs/specs/section-4-flux.md`). The scenes' bottom shade, which keeps their lines legible, is drawn into the video frame by the carousel's shader (45 percent of black, solid to 0.45 of the height, clear by 0.72), never in the DOM. On the poster tier (`html:not(.hero3d)`, `html.poster`, or the section's own `data-tier="poster"` after a failed asset) and without JavaScript the track collapses and the stage is a grid on `--night`: the hall's still, then the scenes' column (Scenes, below), each picture on a `--skeleton` box of its aspect ratio until it decodes.
- **Type.** Section 4's type (Section 3 type, under Typography Rules): IBM Plex Mono Medium in capitals, Pearl Whisper, at the quiz's sizes, set once on `.room`. The text stands straight on the scene, never boxed to pass: every line of the scenes measures 6.0:1 or better at the median over the ten loops at 390 x 844 and 1280 x 800; the prompt over the hall's lit door 2.36:1 at 390 x 844 and 2.85:1 at 1280 x 800 (E-S4-contrast, pending Sam; `docs/specs/evidence/section-4-flux-contrast.md`).
- **Stacking.** The section at `z-index: 2` in the page. Inside the stage: the scene on screen at 2, the words that are controls and the lines at 3, and the poster tier's loop fade at 5 (fixed).
- **Focus.** `.room :focus-visible` is the Ember Luxe outline at 2 px with a 2 px offset, and on the words that are controls a `::before` at `inset: -2px` with a 2 px Urban Slate border is the inner ring (the two-tone ring above). The pad's ring is drawn inside the stage (Pad, below). A scene's name takes focus from script only and draws no ring.
- **Positions.** No style attributes (the CSP has no `style-src-attr`). `walk.ts` places the prompt by a `transform` through the CSSOM, and sets the stage's opacity while a seam's cloud covers the section.
- **Decode.** Every line decodes in and wipes out by section 3's decode (Section 4 decode, below), and every control whose wipe ends takes `hidden`, its focus moved first and then `inert`. The scenes' lines are clipped instead, so all five scenes stay in the accessibility tree.
- **The logotype over it.** Pearl Whisper over the hall and over every scene (`ROOM_SCENES` `toneDark`, measured on each scene's still under the logotype's box by `scripts/room/scene-tone.mjs`: every scene's top is dark); Urban Slate while a seam's cloud covers half the frame or more, whatever is under it, the hero after the exit's jump included. Back to top follows it.

### Section 4 link (`.rm-link`: the prompt, Skip, the previous and next words, "Pause motion")

- **Element.** A `<button type="button">` drawn as words, the quiz's link pattern (`.qz-link`): no fill, no border, square, the section's type and colour, `white-space: nowrap`, `display: inline-flex` with `gap: 0.6em`, `position: absolute`, `z-index: 3`. The user agent's fill, border, radius and appearance are taken off.
- **Size.** Minimum height and minimum width 44 px, no padding, so each is 44 px tall and as wide as its words.
- **States.** Underlined, 1 px at a 0.4 em offset, written as the longhands. On hover (`hover: hover` only) the line thickens to 2 px at once, with no transition and no transform. `aria-disabled="true"` drops the underline and the pointer (the prompt keeps its underline and shows `cursor: progress` while busy). Never the `disabled` attribute, so focus stays on it.
- **Focus.** The two-tone ring (Section 4 stage, above).

### Section 4 line (`p.rm-line`: the hint, the loading line)

- **Place.** Bottom centre: `left: 50%`, `bottom: calc(var(--inset) + env(safe-area-inset-bottom, 0px))`, `transform: translateX(-50%)`; `width: max-content` up to `calc(100% - 2 * var(--inset))`; minimum height 44 px, the line centred.
- **Text.** Plain words in the section's type. Every string comes from `src/config/room.ts` `ROOM_COPY`.

### Hint (`p.rm-line.rm-hint`)

- **Text.** "Scroll or use the arrow keys to walk to the door." on a device that can hover, "Scroll to walk to the door." on `hover: none` (read once when the walk script mounts).
- **Shown** once the hall's first frame is drawn and the section is in view: it decodes in.
- **Leaving.** After the visitor has walked 1 m, or at the press, it wipes out and takes `hidden`; once per lap.

### Loading line (`p.rm-line.rm-loading`, `role="status"`)

- **Text.** "Loading the entrance..." while the section is in view and the hall has not drawn its first frame. It also shows while the section's own chunk is on its way: its top has reached the viewport's top and no frame has come for 500 ms. "Still loading..." from 8 s. It decodes in, and wipes out with the first frame and on the poster tier.
- **Place.** The line above, local to the section (CHECKLIST H1). Never a spinner (rule 41). The scenes' wait after a press shows on the prompt instead (Prompt, below), and a scene's wait for its loop under the scene's lines (Scenes, below).

### Prompt (`button.rm-enter.rm-link`, `#rmEnter`)

- **Text.** `[E]` (`span.rm-key`) then "Enter Skreed universe" (`span.rm-enter-text`), drawn as `[E] ENTER SKREED UNIVERSE`, `aria-keyshortcuts="E"`. `[E]` is `display: none` on `hover: none` and with Tune's `promptChip` at 0 (`.room.rm-nochip`), so a phone reads `ENTER SKREED UNIVERSE`.
- **Anchored to the door.** Every frame the walk script places it at the door's handle as the island projects it, through the camera without the pointer's sway, so it does not chase the pointer. It is moved by a `transform` from its size, cached when it comes on and again after a resize, so no frame reads layout (CHECKLIST C3). Its left edge sits at the handle; it is clamped inside the `--inset` gutters and 44 px clear of the bottom gutter.
- **Hidden until near, never `hidden` in the hall.** It is always in the Tab order there, the section's first tabbable element. Until the visitor is within 2.8 m of the door (`HALL.promptFrom`; the door station is 2.0 m) it is visually hidden by `clip-path: inset(50%)`. `.is-near` lifts the clip, and `[E]` and the words decode in. On leaving they wipe out first, and it is clipped once the wipe ends.
- **Focus.** It takes focus as it appears, unless a text field has it. A visitor's own focus on it while it is clipped (a Tab from the quiz) snaps the page to the door station, so it shows with its ring. When it clips away holding focus, a keyboard user's focus goes to the pad and anyone else's is dropped.
- **Busy.** A press before products.bin and scene 1's loop are in (or have failed) makes it busy: `aria-disabled="true"` and `aria-busy="true"`. It reads "Loading..." and "Still loading..." from 8 s, and "Loading..." is announced through `#rmLive`. It enters by itself once they are in, and gives up if the visitor walks away.
- **Input.** A click or a tap, Enter or Space on it, and a single, non-repeating E while the pad or a control of the section has focus.
- **At the entry** its two spans wipe out (never the button whole, so the spans survive for the way back) and it takes `hidden`. After the way back it is in the Tab order again, decodes in at the station, and a keyboard user's focus returns to it. After the wrap it stays hidden while the scenes stand.
- **Poster tier.** Shown at once over the hall's still (`top: 50svh`, centred, no clip). A press cross-fades the still to scene 1's over 300 ms (a cut under reduced motion), shows the scenes' column and moves focus to scene 1's name. It is gone once entered.

### Pad (`div.rm-pad`, `#rmPad`)

- **Element.** The stage's focusable surface: `tabindex="0"`, `role="group"`, `position: absolute; inset: 0`, after the prompt in the DOM so it comes second in the Tab order; no outline at rest, `-webkit-tap-highlight-color: transparent`. Its `aria-label` is "The entrance. Use the arrow keys to walk to the door." in the hall and "The five scenes. Use Down and Up to move between them." in the scenes.
- **Keys.** They act only while the pad or a control of the section has focus; without it the keys do what they always do (WCAG 2.1.4), and the browser's own shortcuts pass through.
  - **In the hall.** Up or W and Down or S walk (the page scrolls at Tune's `keySpeed`, 0.5 m per second, and stops at the door station: the pad never carries the page into the scenes), Left and Right turn the head 25 degrees for as long as they are held, E enters, and Escape blurs it (no trap).
  - **Entering.** Escape, or Enter or Space on the pad, skips.
  - **In the scenes** the keys belong to the page scroll (`src/scripts/hero/section4/scroll.ts`), whatever has focus but a button or a typing control: ArrowDown, PageDown and Space step forward, ArrowUp, PageUp and Shift+Space back, one step per keydown, a held key never repeating (E-S4-scroll).
- **Pointer.** It takes focus on a pointerdown. A tap never skips. With Tune's `mouseLook` a mouse drag turns the head in the hall. In the scenes a pressed pointer or a finger turns the product (plus or minus 0.3 rad), never a hover.
- **Focus, inset two-tone ring.** The stage clips, so the ring is drawn inside the pad: a `::before` at `inset: 0` with a 2 px Urban Slate border and a 2 px Ember Luxe outline at `outline-offset: -4px`, and an `::after` at `inset: 4px` with a 2 px Urban Slate border. From the stage's edge inward it reads 2 px Urban Slate, 2 px Ember Luxe and 2 px Urban Slate, so it holds on the hall and on every scene. No `box-shadow`.

### Skip (`button.rm-skip.rm-link`, `#rmSkip`)

- **Place.** Bottom centre, as the lines are (Section 4 line, above).
- **When.** `hidden` except from the press to scene 1's arrival: it decodes in at the press and wipes out when scene 1 arrives, its focus going to the scene's name first, never to `body`. It takes focus at the press when focus was in the section or the press came from the keyboard.
- **What it does.** Skip, Escape, or Enter or Space on the pad end the bubble at once: scene 1 at rest with its lines, the page at its position.
- **Guards.** An activation within 350 ms of Skip appearing is dropped, and a held key activates it once. A tap on the stage does not skip.

### Scenes (`ol.rm-scenes`, `#rmScenes`)

- **Element.** `h2.sr-only` "The five scenes", then the list, `aria-label` "Our products, in five rooms": one `li.rm-scene[data-id][data-i]` per scene of `ROOM_SCENES`, in the carousel's order (cove, grove, ember, palace, dawn). Each holds:
  - the still, `picture.rm-scene-pic`: the portrait AVIF and WebP under `(orientation: portrait)`, then the wide AVIF and WebP, and an `<img>` with its `alt` (one sentence describing the room, no product), `width` and `height`, lazy. Its sources stay in `data-srcset` and `data-src` until the poster tier asks for them, so the 3D path, where the carousel draws the same stills, never fetches them;
  - the lines, `div.rm-scene-text`, a grid with `gap: var(--s1)`: `h3.rm-scene-name` (`tabindex="-1"`), `p.rm-scene-shade`, `p.rm-scene-line`, on scene 1 `p.rm-scene-hint` (`hidden`), `p.rm-scene-count`, then `p.rm-scene-more` (`aria-hidden`, `hidden`);
  - `p.sr-only.rm-scene-alt`, the name's `aria-describedby` on the 3D path.
- **The lines** (section-4-flux.md 3). The product's catalog name ("Phone case"); its shade and family, "Lilac, vivid violet"; the product's catalog line with rule 17's words dropped; the count, "1 / 5", with tabular numerals. The name at `--rm-fs-q` / 1.25, balanced; the rest at `--rm-fs` / 1.45.
- **Shown.** Only the scene on screen (`.is-on`): its lines bottom left, `left: var(--inset)`, their bottom at `--inset` above the safe area, `width: calc(100% - 2 * var(--inset))` up to 520 px, Pearl Whisper straight on the scene, over the bottom shade the carousel draws. The product is placed clear of them: on a phone it sits higher (its centre at 0.60 of the view's height), on a laptop it moves right by what the 520 px column needs (89 px at 1280 x 800), and a unit test holds every product's box to zero overlap with the lines' (the column, the bottom 34 percent). The other scenes are clipped by the clip pattern (1 px, `clip-path: inset(50%)`), never `hidden`, so all five stay in the accessibility tree. On the 3D path the list is `inert` in the hall until the entry or the wrap; never inert on the poster tier or without JavaScript.
- **Arrival.** The four lines decode in, one after another, 0.12 s apart. A keyboard user's focus (on the pad, Skip, a word or a scene's name, or anywhere in the section after a key) moves to the scene's name, which speaks with its room's description. Otherwise `#rmLive` announces "1 of 5. Phone case. Lilac, vivid violet." once, never twice; after the wrap, "Round to the five scenes. 5 of 5. ...".
- **A step.** At its start the lines wipe out in 0.2 s and are clipped again; the next scene's lines decode in at its end.
- **The hint.** On scene 1, as a row of its lines above the count (a row under the count would share the previous and next words' row at 390), once its lines have settled and only on its first visit: "Swipe to the next scene" on `hover: none`, "Scroll to the next scene" with a pointer, "Scroll or press Down to the next scene" when a key was used in the last 15 s. It wipes out on the first step and on any arrival at another scene.
- **Loading.** While the scene's loop is expected and not in, "Loading..." under the count in `p.rm-scene-more`, "Still loading..." at 8 s; the scene shows its still meanwhile. Never on the still paths (reduced motion, Save-Data, 2g, `deviceMemory` 2 or less) nor after a refusal. On a Tune build a refused loop shows "Clip blocked" there.
- **Poster tier and no JavaScript.** The scenes stand one per screen in a column on `--night` (`min-height: 100svh`), each its still over its lines: the still full width, `aspect-ratio: 9 / 16` (1280 / 666 in landscape) up to 76svh, `object-fit: cover`, on a `--skeleton` box until it decodes; the lines under it, padded `--inset`, within 520 px. No video, no carousel, no glue. Without JavaScript the noscript line reads "The entrance needs JavaScript. The scenes are below." over the column.

### Previous and next words (`div.rm-nav` > `button.rm-prev.rm-link`, `button.rm-next.rm-link`)

- **Text.** "Previous scene" and "Next scene", two underlined words (Section 4 link, above).
- **Place.** Bottom right: `right: var(--inset)`, their bottom at `--inset` above the safe area, `gap: var(--s3)`. Shown in the scenes only (`data-state="world"`), decoded in with the first arrival; hidden in every other state.
- **What they do.** One whole step each, the same as a swipe or a key. "Previous scene" at scene 1 is the way back into the hall; "Next scene" at scene 5 is `aria-disabled`. They give a tap, a screen reader and a keyboard a single-pointer way to step (WCAG 2.5.1).

### Pause motion (`button.rm-pause.rm-link`, `#rmPause`; WCAG 2.2.2, the default of E-S4-loops if Sam declines it)

- **Text.** "Pause motion", swapping to "Play motion" once the loops are paused: a plain button whose text swaps, no `aria-pressed`.
- **Place.** Bottom right, one row above the previous and next words (`bottom: calc(var(--inset) + env(safe-area-inset-bottom, 0px) + 44px + var(--s2))`).
- **When.** Only while the director sets `data-pause="1"`, which it does only once Sam declines E-S4-loops; while it is pending the control is never shown. Then: while entering, in the scenes, on the way back and under a seam, never in the hall, absent on the poster tier.
- **What it does.** Every loop pauses and the cloud's time holds, while steps, seams and the glue still work. Remembered for the visit only (a variable, nothing stored).

### Live region (`p.sr-only#rmLive`, `aria-live="polite"`)

- One announcement per arrival, only when focus does not move to the scene's name; the wrap's own line after the wrap; and the prompt's "Loading..." while the scenes load.

### Section 4 decode (`src/scripts/quiz/decode.ts` from `walk.ts`; E-S4-font, and E-S4-motion pending)

- **What it is.** Section 3's decode on section 4's text, with the same markup (a visually hidden sentence-case copy beside an `aria-hidden` row of glyphs) and the same timings (Motion, section 10). Every line of the prompt, Skip, the hint, the loading line, the words and each scene's four lines and hint is split once when the walk script mounts, and hidden until its part decodes in.
- **Never a transform on the text.** Each glyph's opacity, and its character while it rolls. The prompt alone moves, placed by a transform at the door's handle.
- **Reduced motion.** A 0.2 s fade, no roll. The decode reads the setting live.

### Skeleton (later sections)

- **Box.** The same element and the same character count as the value it waits for, with `color: transparent; background: var(--skeleton)` and square corners. The swap moves nothing.
- **Never** a spinner or a blank (rule 41).

### Swatches

- **Shape.** Circles, in a 6 x 4 grid per family (the catalog's language), or flat squares where the Wall spec says so.
- **Fill.** `var(--shade-<id>)`.
- **Labels.** Names sit outside the swatch, in Urban Slate or Pearl Whisper by swatch luminance, never in the shade.

## 5. Layout Principles

### Spacing

One scale, used through `gap` on flex and grid, not per-element margins (rule 15).

```css
:root {
  --s1: 8px; --s2: 12px; --s3: 16px; --s4: 24px; --s5: 32px;   /* --s4: the quiz result's row gap and the gap between its two links; --s5: the gift's top padding (section 3, 2026-10-19; on laptops the result's column gap and the gift's indent were --s5 until 2026-10-20, now clamp(32px, 4vw, 72px)) */
  --inset: clamp(16px, 3.5vw, 56px);  /* corner inset: 16 px at 390, 44.8 px at 1280, 56 px at 1700 (measured) */
}
```

- A new step is added here, with its use, before any component uses it.
- The hero's other lengths are component dimensions, not spacing:
  - the cue (64, 26, 22 and 9 px);
  - the countdown lift (84 px);
  - the countdown group gap cap (44 px);
  - the label offset (-1.5, -6) px;
  - the hit-area insets of the logotype (-11, -8) and of the countdown link (-13, -8), which exist to reach 44 px;
  - the focus ring offsets (2 px; 6 px on the logotype).

### Grid and gutters

- Phone first at 390 px, and everything holds at 360 px. Side gutters are at least 16 px. There is no horizontal scroll.
- Widths tested: 360, 390, 430, 768, 1024, 1280 (CHECKLIST G10).

### The hero's layout

- A fixed full-screen canvas over a 1720svh scroll track (`TRACK_SVH`: the pull-back 5 screens, the first wipe 1 screen, section 2's cascade and rest to 15.2, the second wipe to 16.2, then section 3 rising over the fog).
- DOM riders (countdown, cue, logotype) are fixed and move only by transform and clip-path.
- On the poster path the track is 100svh, and the poster and the countdown sit in that first screen.
- Slots follow the track: section 2's riders, then `<main>` with section 3, the quiz (`section#find`; the Wall is a later section).

### The family pages' layout (`/shades/<family>/`, `docs/specs/family-page.md` 2.3, 2.4, 2.8)

- **Spacing steps added for the family pages** (defined in `src/styles/family.css`, used through `gap` and padding): `--s4: 24px` (title offset over the stage, the HUD band's top padding, the switcher's bottom padding), `--s5: 32px` (the swatch grid's height allowance in the stage), `--s6: 48px` (section padding: "The whole family.", the family navigation row, the footer).
- **Component dimensions, not spacing:** the header (56 px phone, 72 px wide, `--fh`), the HUD band (224 px, `--band`, 3D mode), the tap minimum (44 px, `--hit`), the wide layout's grid circle (80 px, `--sw-wide`, spec 2.6) and grid column (112 px, `--cell-w`), its finish and Reserve column (190 px, `--side-w`), its HUD and scrubber column (at most 664 px, `--scrub-w`) and the shade name between Prev and Next (318 px, `--name-w`), the sticky bar (72 px plus the safe area), the scrubber marker (24 px), the switcher rows (56 px), the Prev and Next chevron (16 px in a 44 px box), the grid swatch's selected ring (2 px at a 3 px offset) and focus outline (6 px offset), and Back to top's bottom offset on a family page (14 px, `--to-top-bottom` in `to-top.css`, which "Back to main page" stands one row above).
- **One breakpoint:** the wide layout at 900 px wide and 600 px tall or more; everything else is the phone layout.
- **Wide layout, swatch grid mode:** title, the 80 px grid and the controls stack in flow and the page scrolls, so a short laptop screen (1280 x 609, 1366 x 657, 1024 x 600, 900 x 600) never shrinks the circles or lays the grid over the controls. Only 3D mode pins the controls into the stage's bottom band.
- **The argument screen's way out** (round 4, `family-page.md` 22, exception E-F5): "Back to main page", a fixed link set as "All families" is (Open Sans 600 at `--fs-label`, a 44 px hit row, no box), centred under the letters by its margins. On the phone layout its row stands one `--s1` above Back to top's row, so its bottom is 66 px plus the safe area above the bottom edge (hit row y 734 to 778 at 390 x 844); on the wide layout its bottom is one `--inset` above the safe area (y 711.2 to 755.2 at 1280 x 800). Its layer is `z-index: 4`, level with the beat nav and the HUD and under the corners, Back to top (6) and the loader (40); it exists in 3D mode only and is `hidden` until 2.5 s after the argument screen comes on.

### Whitespace

One idea per screen. No feature grids, no bento, no three-up cards, no badge above a headline.

## 6. Depth & Elevation

- **No `box-shadow` anywhere** (rule 25). No glass, no `backdrop-filter`, no blur panels (rules 6 and 28). No glow blobs or orbs, no dot grids, no grain over gradients.
- **Depth** comes from the renders and from colour. In the hero it comes from the WebGL scene: lighting, fog and bloom are part of the approved canvas, judged visually under the hero exceptions (E-13/42, E-1/21/40, E-A2b).
- **Hero z-order:**

  | Layer | z-index |
  |---|---|
  | poster | under the stage |
  | stage | 0 |
  | labels | 1 |
  | cue | 2 |
  | Tune, dev only | 3 |
  | section 3, the quiz (`section#find`, in flow after the track) | 3, after the riders in DOM order, so it paints over section 2's labels |
  | section 4 (`section#room`, in flow after the quiz; its own layers inside, Section 4 stage) | 2 |
  | logotype | 4 |
  | loader | 6 |

  The loader's poster state drops to 0.

**Radius tokens** (rule 39):

```css
:root {
  --radius-none: 0;     /* the default: square */
  --radius-round: 50%;  /* circles only: swatches, the cue ball */
  /* --radius-panel: the catalog's large card radius, for one hero panel. Not yet measured from
     docs/brand/Skreed_Catalog_2026-27.pdf. No shipped element uses it; the first section that needs it measures it here first. */
}
```

## 7. Do's and Don'ts

### Do

- Take colours only from this file: the neutrals, the accent, the shades by id through `--shade-<id>`, and `--night` in the scene.
- Use one family per job, sentence case, tabular numerals for anything that ticks.
- Show the real product (case renders, swatches, shades) in every section.
- Design every state: empty, loading (skeleton), error, offline, slow network, no results, permission denied, validation, success.
- Build and screenshot at 390 px before 1280 px.
- Honour reduced motion everywhere.
- Give anything that moves on its own for more than 5 s a way to stop, or keep it under 5 s (WCAG 2.2.2). The hero's scene and countdown are pending Sam's exception E-2.2.2, and section 4's loops E-S4-loops (its default is the "Pause motion" control).
- Use the two-tone focus ring wherever the background can be light.
- Write short, specific sentences in the first person.

### Don't (CLAUDE.md rules, in brief)

- **Colour.**
  - No gradients as a brand device, no gradient text, no harsh gradients (1, 2, 21).
  - No purple-to-blue, no purple and black (1, 40).
  - No pure white page (23).
  - No rainbow UI (24). No neon or pastel UI (49, 50).
  - No coloured-border cards, no coloured left stripes (5, 31).
- **Type.**
  - No face outside the three, no italic, no Inter in any role (4, 18, 19, 30).
  - No all-caps headlines.
- **Surfaces.** No glass, no shadows, no radial orbs, no dot grids, no grain on gradients (6, 20, 25, 28, 42, 43).
- **Layouts.**
  - No three-icon rows, no three feature cards, no bento (8, 26, 33).
  - No badge above a headline (9). No terminal mockups (34). No pricing (37).
  - No section without the real product (38).
  - No default radius everywhere, no untouched shadcn defaults (11, 39).
- **Motion.**
  - No fade-in on scroll by default (12).
  - No cursor beams or spotlights (13).
  - No opacity-fade hover on buttons (14).
  - No gratuitous hover (48). No animated arrows (45).
- **Icons.** Only where a control needs one. No Lucide, no sparkles (10, 22, 44).
- **Copy.**
  - No emojis (3, 27). No em dashes (16, 29).
  - No buzzwords (17). No "it's not X, it's Y" (35).
  - No fake testimonials (32). No invented names, counts or facts.
- **States.** Skeletons, never spinners (41).
- **Pages.** Privacy and terms are required (46, 47).

### Approved hero exceptions

The full list, with ids, rules and reasons, is `docs/specs/hero.md` section 10; the approved ones are also in `CLAUDE.md` ("Approved exceptions", 2026-10-09). In brief:
- E-H1: the full-screen loader on the 3D path, and its status line over the poster;
- E-G2: no CTA on the fold;
- E-C3: the WebGL island in sections 1 and 2;
- E-C3b: the countdown's clip-path ride and the glitch's SVG attribute animation;
- E-12: the hero canvas, the loader, the cue's three bounces and the logotype's bursts;
- E-13/42: the block glow and bloom;
- E-1/21/40: the sky's faint galaxy wash;
- E-24: the logotype colour split and the loader outline;
- E-A2: `--night` and the Pearl alpha light;
- E-A2b: the scene's light colours as render parameters;
- E-A3: the hero type sizes;
- E-GSAP: reduced motion through `matchMedia` while the hero loads no GSAP;
- E-C4: Lighthouse graded on the poster tier, the 3D path traced on a real phone (pending, `hero.md` section 11);
- E-2.2.2: the scene's ambient motion and the ticking countdown without a pause control (pending, `hero.md` section 11).

Anything not on that list is not excepted.

### Approved section 3 exceptions

Sam, 2026-10-19. The full wording is in `docs/specs/hero.md` section 10 and `docs/specs/quiz.md` section 10, and they are in `CLAUDE.md` ("Section 3 (Sam, 2026-10-19)"). For section 3 (`section#find`, the quiz) only:
- E-S3-bg: the hero island rendering section 2's fog under the quiz;
- E-S3-font: the quiz in section 2's label type, IBM Plex Mono Medium in capitals;
- E-S3-contrast: Pearl Whisper text straight on the fog, below AA;
- E-S3-motion: the decode on every change of screen, outside rule 12's motion list; no transform on the text (each glyph's opacity, and its character while it rolls). Sam's approval covers the text's decode only. The answer pictures of the visual questions decode in the same way, strip by strip (each strip's slice swapped as a `background-position`, as a glyph's character is), and settle in scale from 1.03 to 1, built on 2026-10-20 at his request ("have some sort of animation when the text is appearing dont just straight up blankly slap the image on the screen on hover") and not yet confirmed as part of the exception (`docs/specs/quiz.md` section 10, item 17).

### Approved section 4 exceptions

Sam's own words cover these, so they are recorded as approved with them. The full wording, with each default if withdrawn, is `docs/specs/section-4-flux.md` section 10 (`docs/specs/section-4-world.md` section 10 for E-S4-portal and E-S4-font), and they are in `CLAUDE.md` ("Section 4 (Sam, 2026-10-19 and 2026-10-22)"). For section 4 (`section#room`) only:
- E-S4-scroll: inside the carousel's range in the scenes (q 10 to 12) the wheel, one finger and the keys of a step are captured for whole steps, and at scroll 0 after the intro a touch or a wheel burst runs the wrap; never Ctrl+wheel, more than one finger, a zoomed viewport or a typing control. Against section-4.md D13 ("The section does not hold the scroll"), section-4-world.md's "Never a hold" and the references' fixed decision against wheel hijacking on phones. "sure", to a wrapped virtual scroll replacing native scroll, and the brief's "each section has an elastic sticky glue" (2026-10-22).
- E-S4-snap: the glue over the page's three seams, on touch too, instant under reduced motion. Against section-2.md's auto-settle ("never on touch or under reduced motion") and the references' "no snap on the hero". "page sections only, same on touch" (2026-10-22).
- E-S4-video, amended: `media-src 'self'` in production for the ten scene loops, muted with no audio track, `playsinline`; never under reduced motion, Save-Data, 2g or slow-2g, or at `deviceMemory` 2 or less, where the stills stand in; every loop passes the flash rule (AC5). The backgrounds are videos, "phones as well" (2026-10-22).
- E-S4-colour, amended: the five scenes keep their own palettes with their gradients, glows and fog (rules 1, 21, 24 and 42; A2), the cloud's shadow tone (0.80, 0.84, 0.93) and the carousel's black clear colour; the products wear catalog shades by id, and the cloud's light and the text are Pearl Whisper. "use the same colors what they use for all 5 scenes" and "the fog, the water, the gradient, everything" (2026-10-22).
- E-S4-38, amended: the hall shows no product, and the bubble's inside is scene 1 with its product (rule 38). "instead of the shampoo product... we will have our 3d model" (2026-10-22).
- E-S4-portal and E-S4-font stand as section-4-world.md has them: the wavy circle that opens over the hall (rules 12, 21 and 42), "have a wavy circle zooming from centre to the end of the screen" (2026-10-19); section 2's label type for every line of the section (rules 4 and 19, type-system.md, CHECKLIST A3), "Yes, all of it" (2026-10-20).

### Pending section 4 exceptions

Not approved yet; the build ships each as the spec says and flags it, and `docs/specs/section-4-flux.md` section 10 gives each one's default if Sam declines:
- E-S4-loops (WCAG 2.2.2): the five loops run while a scene is front, with no way to stop them. Default: the "Pause motion" control (Pause motion, under Component Stylings).
- E-S4-webgl, amended: the island draws the hall, the door, the bubble, and the carousel's planes, products and cloud, against "No WebGL from section 3 on" and CHECKLIST C3. Default: the poster column for everyone.
- E-S4-motion, amended: every motion of section 4 in section 10 below, the decodes and the loops included (rule 12's reserved-motion list, C3's transform-and-opacity rule for the decode's character swap); rule 12's three sentences stand as the world spec had them: nothing fades in on scroll, nothing moves that the visitor did not start except what this list names, and every named motion has its cut under reduced motion. Default: cuts with the 300 ms cross-fade for every one, and the decode as a 0.2 s fade.
- E-S4-contrast, amended: Pearl Whisper text straight on the hall, the bubble and the five loops (`docs/specs/evidence/section-4-flux-contrast.md`: every scene line 6.0:1 or better at the median; the prompt over the hall's lit door 2.36:1 at 390 x 844 and 2.85:1 at 1280 x 800). Default: the bottom shade darkened until every median reads 4.5:1, and the step's text hidden until the lights are up.
- E-S4-glow, amended: the hall's seam glow, fixture halos and laptop bloom, and the gloss and metallic products' highlights under the key light (rules 13 and 42). Default: matte for every product, the hall as built.
- E-S4-grain (the hall only) and E-S4-light (the hall's Urban Slate clear colour from the press, the bubble's Pearl Whisper outline) stand pending as section-4-world.md section 10 has them.

## 8. Responsive Behavior

- **Phone first.** It must look as strong on a phone as on a laptop. Most visitors arrive from Instagram's in-app browser on mid-range Android over 4G.
- **Breakpoints in use:**
  - 1024 px: the logotype goes from 96 to 136 px;
  - 1100 px: the countdown lift is removed;
  - aspect 0.9: portrait framing in the hero (camera zoom `min(1, aspect * 1.25)`, sky crop class, poster class, section 2 swatch columns 24 to 12). In CSS, wide is `(min-aspect-ratio: 9/10)` and portrait is its complement, which matches the scene's `aspect < 0.9` exactly.
- **The quiz (section 3).** Phone first: the stage is `min-height: 100svh` with its text bottom-aligned on phones and centred on laptops (900 px wide and 600 px tall or more, the family pages' breakpoint), where the stage pads 64 px more at the top, the intro widens from 560 px to `min(78vw, 1040px)`, the questions to `min(90vw, 1240px)` with the picture frame beside the words, the results and the gift's column to `min(84vw, 1120px)`, and the result takes two columns. The type scales with the viewport's width and is held down by its height (15 to 22 px, 24 to 52 px, 36 to 88 px); there is no portrait step since 2026-10-20. On a phone a visual question's picture stands above it, in the space under the logotype's band, and is left out where under 96 px are free. The deck holds the tallest question's height from the first question to the last (at 1366 x 657 a visual question's frame adds 5.4 px, an open defect); on a landscape phone the deck is taller than the screen, and at 1024 x 768 and 1366 x 657 the stage is, with the laptop's 64 px of extra top padding (797 px of 768; 666.4 px of 657, 671.8 px on a visual question), so the page scrolls through it there.
- **Section 4.** Phone first, on the quiz's type scale. The hall's hint, its loading line and Skip sit bottom centre inside the gutters above the safe area, a scene's lines bottom left within 520 px, the previous and next words bottom right. The loops come in two sets, portrait (720 x 1280) where the stage is taller than wide and wide (1328 x 692) elsewhere, chosen once a visit when the first loop starts to load and cover-fitted every frame after; the arc of a step is 22 degrees on a portrait stage and 80 on a wide one. The product sits higher on a phone and to the right on a laptop, clear of the lines.
- **Viewport units.** `svh` for layout heights. Nothing is animated in `dvh`. Safe areas use `env(safe-area-inset-*)`.
- **Tap targets.** At least 44 px. Inputs are 16 px so iOS never zooms.
- **Canvas pixel ratio.** Capped at 1.25 on touch and 1.5 elsewhere.
- **Hero tiers:**
  - poster for no WebGL2, no hardware WebGL2 (software renderers such as SwiftShader), no `DecompressionStream`, Save-Data, 2g, `deviceMemory` 2 or less, reduced motion (default) and no JavaScript;
  - WebGL otherwise;
  - any failure falls back to the poster.
- **No reliance on `localStorage`** (Instagram's in-app browser).

## 9. Agent Prompt Guide

### Quick reference

```
Page:            --pearl-whisper #F7F6F3   (text on it: --urban-slate #383F43)
Charcoal band:   --urban-slate #383F43     (text on it: --pearl-whisper)
Accent:          --ember-luxe #FF9900      (primary button fill and focus rings only)
Focus:           Ember Luxe 2 px outline, plus a 2 px Urban Slate ring wherever the ground can be light
Skeleton:        --skeleton                (the only derived neutral)
Hero scene only: --night #050506
Shades:          --shade-<id> from src/styles/shades.gen.css (source docs/data/shades-240.json), swatches and product only
Type:            Poppins 700 voice / Source Serif 4 400-600 letter (first person) / Open Sans 400-600 fittings and numerals
Spacing:         --s1 8, --s2 12, --s3 16, --inset clamp(16px, 3.5vw, 56px)
Radius:          0, or 50% for circles
Ease:            --ease-standard cubic-bezier(0.2, 0, 0, 1), 150 ms for press, 400 ms for fades
```

### Prompts that work

- "Build the section at 390 px first with the tokens in DESIGN.md. Pearl Whisper ground, Urban Slate text, Poppins 700 sentence-case headline, Open Sans for every label and number. Swatches are circles filled with var(--shade-<id>). No shadows, no radius except circles, gaps from --s1 to --s3."
- "Add the loading state as a skeleton of the same size in --skeleton. Add the error state as one Open Sans 400 line at 14 px with a 600 lead word, keeping the user's input."
- "Hover and press only on controls: translateY(-1px) and scale(0.98) over 150 ms on --ease-standard. No opacity change. Focus is the two-tone ring."

### Before handing off

- Screenshots at 390 px and 1280 px.
- Grep for banned faces, em dashes and emojis.
- Check that every colour resolves to a token in this file.
- Run `/web-design-guidelines`.
- Then the review skill against `docs/CHECKLIST.md`.

## 10. Motion

Motion is reserved for the hero canvas, the Wall, the tilt card and the manifesto, each choreographed once, plus section 3's decode (E-S3-motion) and its answer pictures' reveal (built at Sam's request on 2026-10-20, pending his confirmation under E-S3-motion), and section 4's (below: the bubble approved as E-S4-portal, the rest pending as E-S4-motion). Everything honours `prefers-reduced-motion`. Sections are visible at rest. Nothing moves on its own for more than 5 s without a way to stop it, except what E-2.2.2 lists while it is pending, the fog under section 3 (E-S3-bg, approved 2026-10-19), and section 4's loops while E-S4-loops is pending. Every other motion of section 4 is under 5 s and started by the visitor: the step 0.77 s, the bubble 2.35 s from the press with Skip, the seams 640 ms plus the 400 ms lock, the way back 1 s, the glue 0.5 s.

### UI tokens

```css
:root {
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);    /* buttons, cue fade */
  --ease-in: cubic-bezier(.55, .085, .68, .53);   /* loader percent fade and lift */
  --ease-gravity: cubic-bezier(.55, 0, 1, .6);    /* cue ball falling */
  --ease-land: cubic-bezier(.2, .6, .4, 1);       /* cue ball landing */
  --ease-rebound: cubic-bezier(0, .3, .5, 1);     /* cue ball springing back */
  --dur-press: 150ms;                             /* button hover and press */
  --dur-fade: 400ms;                              /* cue fade; loader percent fade; loader lift under reduced motion */
  --dur-lift: 600ms;                              /* loader lift */
  --dur-cue: 1.5s;                                /* one cue cycle */
  --cue-cycles: 2.44;                             /* three bounces, ending on a landing (3.66 s) */
  --dur-out: 200ms;                               /* the family pages' "Back to main page" fading out (family-page.md 22); unused on the landing since the quiz (2026-10-19) and section 4 (2026-10-20) became plain text */
  --dur-card: 300ms;                              /* unused since the quiz became plain text (2026-10-19): no card moves */
}
```

### Hero choreography (constants live in `src/config/hero.ts` and `params.ts`; full tables in `docs/specs/hero-architecture.md` section 5.5)

| Moment | Duration or rate | Curve |
|---|---|---|
| Loader light band | every 1.6 s after 0.2 s, runs 0.7 s | measured from ciao frame by frame |
| Loader fill | from 1.64 s to 4.96 s at full progress; held at real progress; twice the pace to catch up | measured table |
| Loader exit | dim 1.24 s, outline 0.24 s, percent fade 400 ms after 300 ms, lift 600 ms; 8.2 s first paint to hero on a fast load | `--ease-in` |
| Loader slow text | after 4 s without progress | |
| Hero life ramp | 2 s after the lift | cubic out |
| Bob | `sin(0.7t) * 0.07` units | sine |
| Camera shake | 0.01 rad scale, sine noise | |
| Breath | `0.4 x (two sines) x (0.5 + 1.5 rand) x 0.5 x 0.3` | sine |
| Hover push | full within 1 unit, none beyond 3; followers 0.06; pointer 0.05 | frame-rate independent damping `a + (b - a)(1 - (1 - k)^ratio)` |
| Camera parallax | toward any active pointer, touch included while down; eased at 0.035 | damping |
| Labels | in 0.1 s, out 0.06 s | linear |
| Ghost sweep | touch only; once the life ramp is complete, and 2.5 s after the last input | `sin(0.45t), sin(0.31t + 1)` |
| Scroll followers | 0.075 then 0.15 | damping |
| Pull-back | 1.5 screens | ease-in-out cubic |
| Wipe | 1 screen | diagonal ice-shard mask; DOM copy rides `0.4 tp^3` |
| Logotype glitch | 0.25 s bursts on hover, tap and focus; 0.5 s intro; no idle twitch in production; 3 patterns per burst | flicker `0.85 + 0.15 sin(30p)` |
| Cue | 2.44 cycles of 1.5 s, 22 px drop, then rest | gravity, land, rebound |

### Family pages (`/shades/<family>/`; `docs/specs/family-page.md` 4, R5, R13)

Tokens in `src/styles/family.css`; the script twins in `src/scripts/family/timing.ts` (a unit test keeps them equal). No GSAP on these pages: CSS transitions, the Web Animations API and the lineup's own loop.

```css
:root {
  --dur-swap: 400ms;                              /* name and number swap, scrubber marker */
  --ease-swap: cubic-bezier(0.25, 1, 0.5, 1);     /* power3.out in CSS form */
  --dur-shade: 600ms;                             /* the sticky bar swatch's cross-fade: the old swatch fades out by opacity over the new */
  --dur-turn: 600ms;                              /* the front case's turn */
  --ease-turn: cubic-bezier(0.45, 0, 0.55, 1);
  --dur-canvas: 200ms;                            /* poster to canvas */
}
```

| Moment | Duration or rate | Curve |
|---|---|---|
| Lineup selection, drag release, entrance converge | exponential approach at 10.94 per second, frame-rate independent (50% at 63 ms, 90% at 210 ms, 99% at 421 ms); drag 1:1; fling carries 0.2 s of velocity; 35% rubber band past the ends | `1 - e^(-10.94 dt)` |
| Front-case pointer tilt (fine pointers) | up to 5 degrees of yaw and 3 of tilt, at the lineup's rate | as above |
| Front-case turn (finish press, tap on the front case) | 10 degrees toward the tapped side and back, 600 ms | `--ease-turn` |
| Name and number swap | old and new lines together, 400 ms, never an empty slot | `--ease-swap` |
| Scrubber marker | to its slot, 400 ms | `--ease-swap` |
| Sticky bar swatch | cross-fade by opacity (the new shade under, a copy of the old one fading out on top), 600 ms; no colour is animated (C3) | linear |
| Poster to canvas | opacity, 200 ms | linear |
| Buttons and swatches | hover `translateY(-1px)`, press `scale(0.98)`, 150 ms | `--ease-standard` |
| "Back to main page" arrives (round 4, family-page.md 22, E-F5) | 2.5 s after the argument screen comes on (one timer): `hidden` dropped, then opacity 0 to 1 over 400 ms (`--dur-fade`) by the Web Animations API; nothing moves | `--ease-standard` |
| "Back to main page" leaves | the argument screen goes off after it showed: opacity 1 to 0 over 200 ms (`--dur-out`), then `hidden`; leaving before 2.5 s drops the timer and shows nothing | `--ease-in` |
| Between family pages and back to `/` | the browser's cross-document view transition (root cross-fade) | browser default |

Reduced motion: swatch grid mode by default (no island; `REDUCED_MOTION_TIER`), every DOM move instant, the view transition off; under `still3d` the lineup jumps, with no entrance, tilt or turn, and "Back to main page" is shown at full opacity at 2.5 s and hidden at once.

### Section 3, the quiz (`src/scripts/quiz/decode.ts` and `deck.ts`; E-S3-motion)

Section 2's label animation on the quiz's text (`src/scripts/hero/section2/labels.ts`; `tests/unit/quiz-decode.test.ts` keeps the constants and the roll equal). No library: the decode sets each glyph's opacity on `requestAnimationFrame` and, while a glyph rolls, swaps its character (one Plex Mono glyph for another of the same width, so no line changes width), and the swatches fade by the Web Animations API. No transforms on the text: nothing in the quiz's text moves. Since 2026-10-20 the answer pictures (`src/scripts/quiz/picture.ts`) take the same decode on twelve strips of a photograph, whose layer settles in scale, the section's one transform. CHECKLIST C3's "transform/opacity only" holds for the text's movement, and the character swap is part of E-S3-motion, as section 2's labels swap theirs. In the pictures each strip's slice is a `background-position`, outside C3, and the scale a transform, inside C3 but outside E-S3-motion's "no transform" as Sam approved it; built at his request on 2026-10-20, both wait for his confirmation (`docs/specs/quiz.md` section 10, item 17).

| Moment | Duration or rate | Curve |
|---|---|---|
| Decode in (each element) | a left-to-right alpha wipe over 0.4 s while each glyph rolls through the five glyphs after it in its block of eight; settled at 0.75 s | linear, as `labels.ts` |
| Decode out (each element) | a right-to-left alpha wipe over 0.2 s | linear |
| The elements of a screen | decode in 0.05 s apart, the step shrinking so the last starts within 0.6 s; the wipe out starts them all together | |
| The answer taken | holds 120 ms after the rest of its question has wiped out, then wipes out | |
| A question just put on screen | takes no press on an answer or Back for 350 ms (`GUARD`), so a double click acts once | |
| Answer picture in (a visual question) | twelve strips fade in left to right over 0.4 s while each rolls through the slices of up to five strips to its right (counted modulo 12, wrapping round) to its own; settled at 0.75 s; the layer scales from 1.03 to 1 over 0.75 s | linear, as the decode; the scale eased out (cubic) |
| Answer picture out | a right-to-left wipe over 0.2 s, a scale not yet settled easing to 1 over it; on switching answers the outgoing wipes out under the incoming | linear |
| An answer taken by a finger on a visual question | holds until its picture has settled, at most 0.9 s, then wipes out with it; no hold where the frame is not drawn (a phone with under 96 px above the question) or under reduced motion | |
| Result swatches | opacity 0 to 1, 400 ms | linear |
| "Not quite? Try again" | the page scrolls back to the section's top | the browser's smooth scroll |

### Section 4, the entrance and the five scenes (`src/scripts/hero/section4/`, `src/scripts/room/walk.ts`; E-S4-portal approved, E-S4-motion and E-S4-loops pending)

No library. The island's own loop drives the camera, the shaders and the carousel: one clock from the press for the door and the bubble (`director.ts`), one tween per step and one cloud per seam (`carousel.ts`); `scroll.ts` settles the glue; section 3's decode moves the text; the Web Animations API runs the poster tier's fades. Everything in the DOM changes by opacity only, the decode swapping characters as E-S3-motion does; the prompt alone is placed by a transform. The constants live in `config/room.ts` (`PRESS`, `ROOM_PARAMS`, and Tune's `ROOM_RANGES`), `transition.ts` (`BUBBLE`), `carousel-math.ts` (`STEP`, `LIGHT`), `scroll-math.ts` (`GLUE`, `BURST`, `TOUCH`) and `video.ts` (`VIDEO`). Times are seconds after the press at the defaults.

| Moment | Duration or rate | Curve |
|---|---|---|
| The hall's hint | decodes in on the hall's first frame; wipes out after 1 m walked, or at the press | the decode |
| The walk | the scroll, clamped at 1.0 m per second except across a snap; the keys at 0.5 m per second, stopping at the door station; Left and Right turn the head 25 degrees while held | linear; the turn eased at 6 per second |
| The prompt | decodes in at 2.8 m from the door; wipes out on leaving | the decode |
| The leaves | 0 to 0.9 s | cubic out |
| The dolly into the doorway | 1.6 m, from 0.3 s over 0.9 s; the hall then freezes at 1.2 s and its last frame is the bubble's outside | cubic in-out |
| Skip | decodes in at the press; wipes out when scene 1 arrives | the decode |
| The bubble (E-S4-portal) | from 0.35 s for `bubbleMs` (2000 ms; Tune 1200 to 3200), over scene 1 at rest with cove's loop playing. The radius rises to 8 percent of the short side over the first 12 percent of the time, then grows at a constant zoom rate until the edge is 4 device px past the farthest corner; it only ever grows, so every pixel crosses once (WCAG 2.3.1). The wobble: five modes of 2, 3, 5, 8 and 13 lobes at 1.3 to 6.8 rad per second, its amplitude easing from 0.12 to 0.025 of the radius. The lens pull at the edge, 6 device px over 24, fades out over the last tenth | eased, then a constant zoom |
| Arrival at scene 1 | 2.35 s; the page set to q 10 by one instant `scrollTo` | |
| A scene's lines | decode in on arrival, one after another, 0.12 s apart; wipe out in 0.2 s at a step's start | the decode |
| Scene 1's hint | decodes in once the lines have settled, on the first visit; wipes out at the first step | the decode |
| A scene at rest | its loop plays (5 s, looping, while E-S4-loops is pending); the product still, unless a pressed pointer or a finger turns it, up to 0.3 rad, back to rest on release; no idle sway and nothing on hover | the look smoothed by `1 - 0.9^(60 dt)` |
| A step (a wheel tick, a swipe of 12 px, a key, or a word) | `stepMs` 770 ms (Tune 400 to 1200): the leaving room swings out and the arriving one in on an arc of 80 degrees on laptops (`sweepDeg`, Tune 40 to 120) and 22 when the stage is taller than wide (`sweepDegPortrait`, Tune 12 to 80); the view pinches from 45 to 42 degrees by eased 0.65 and relaxes by the end; the front scene switches at eased 0.75 (285 ms); the product turns half a turn and is swapped edge-on at eased 0.5, its scale easing over 0.35 to 0.65; every gesture swallowed until 150 ms after; the page snapped to the scene's q at the end | power2.out, `1 - (1 - t)^3`; the pinch a cubic smoothstep |
| The lights over a step | each room's light-up follows its proximity: the leaving room stays lit until the step's half, then both change over its second half, the arriving room coming up from its brightest areas (threshold 0.5, softness 0.64, boost 0.17, floor 0.01; Tune `lightStart`, `lightSoft`, `lightBoost`), moving at 1 over 0.68 s a second, dt capped at 0.1 s. Mid-step most of the frame is dark (For Sam, item 13) | linear toward a smoothstep target |
| The key light | its tint cross-fades to the arriving scene's over `keyLightMs` 1100 ms from the front switch | cubic smoothstep |
| The loops over a step | a loop plays while its proximity is above 0.3 or falling, and is paused and reset to its first frame at 0.02 or less; at most two play | |
| A late loop | its still holds the plane, then cross-fades to the loop when it arrives | 300 ms, linear |
| The exit seam (the raw scroll crossing q 12.8 downward, over scene 5 or the hall) | the cloud covers the frame in 280 ms with the scroll held; under full cover the page jumps to scroll 0 and the section resets; the cloud thins over the hero's rest pose in 360 ms; every gesture swallowed for 400 ms more | in `1 - (1 - e)^2`; out linear to 0.78 over the first 120 ms, then a smoothstep |
| The wrap (with the intro over, a touch from scroll 0 moving 16 px down, or a wheel burst at scroll 0 after 200 ms of silence) | the cloud covers the hero in 280 ms (after a wait of at most 1.5 s if its pass is not compiled); under full cover the page is set to scene 5, held until dawn's still is in (at most 1.5 s); the cloud thins over dawn in 360 ms; the 400 ms lock | as the exit |
| The way back (a backward gesture, or "Previous scene", at scene 1) | the bubble in reverse over half of `bubbleMs` (1 s) while the hall renders live: the dolly back, the leaves shut, the outside's grey and dark fading with the circle; then the hall at the station | the bubble's own curve, run down |
| The glue (a scroll the visitor started stopping inside one of the page's three seam spans) | after 150 ms still with no finger or button down, the page settles to the nearer end of the span over 0.5 s (`snapMs`, Tune 200 to 900), once per run, cancelled by any input | `--ease-standard` |
| The scrollbar | in the scenes' range the scene follows the page's position at once, with no tween; below it, the hall at once | |
| Poster tier: the press | the hall's still fades out over scene 1's | 300 ms, linear |
| Poster tier: the loop | a `--night` veil in, the jump to the top, the veil out | 300 ms each, linear |

### Reduced motion

- **Hero.** It renders the poster: no loader, no canvas. The scene, when Sam picks the `still3d` option, reads the setting once at start.
- **Cue.** It holds still.
- **Countdown.** It hides the seconds.
- **Glitch.** Off. It reads the setting live before every burst, so turning it on after load stops new bursts.
- **Smooth scroll** becomes instant.
- **Option.** Sam may choose the prototype's still-3D variant instead (`REDUCED_MOTION_TIER`).
- **Quiz.** The decode is a 0.2 s fade with no roll; an answer picture fades in or out over 0.2 s with no roll and no scale; the answer taken does not hold, a finger's answer on a visual question included; the guard on a new question is 150 ms; the swatches fade in over 200 ms; "Not quite? Try again" scrolls back at once.
- **Section 4.** Reduced motion sends the visitor to the poster tier by default (`REDUCED_MOTION_TIER` `poster`): the hall's still, the press a cut to scene 1's still and the column of the five scenes, no video, no carousel, no glue; the loop the 300 ms fade through `--night`. Under `still3d` (a test and Tune tier) the island reads the setting once at boot: the walk in four cuts, no door swing and no dolly, the bubble a 600 ms dissolve from the hall to scene 1 at rest, no video (each plane its still), a step a cut with a 300 ms cross-fade between the two stills (the field of view and the lights untouched, the product swapped and the key light set at once), no look; the seams, the way back, the wrap and the glue instant, the cloud's time held at 0. The text fades over 0.2 s with no roll; the decode reads the setting live.
- **Later sections** wrap all GSAP in `gsap.matchMedia()`, and `src/scripts/motion.ts` stays the one source of the flag.
