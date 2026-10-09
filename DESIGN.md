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
- **The hero.** The one exception to the flat pages, on purpose. Night (#050506) over a moonlit, igloo-style snowfield with a faint Milky Way and low fog. The SKRD mark stands as ten matte black blocks, each holding one family's shade as a glow inside its cut faces. The chrome is a corner logotype, a countdown to 1 November 2026 and a scroll cue. Scrolling pulls the camera back, then an ice-shard wipe opens the next section.
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
| `--night` | #050506 | Scene only: the loader background, the hero's WebGL background and fog, and the `/` page background under the hero. Never UI chrome on a Pearl page. Approved with the v9.9 hero; Sam has to confirm it as a token (exception E-A2 in `docs/specs/hero.md`). |

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
- **CSS tokens.** `scripts/hero/gen-shades.mjs` generates `src/styles/shades.gen.css`: one token per shade, `--shade-<id>`, in catalog order, on `:root`, for example `--shade-frosty-whites-01: #f7f7f7;` and `--shade-blissful-blues-08: #08bcf4;`. All 240 are 7,855 B raw, 1,288 B brotli. The file is generated, never edited by hand, and `Base.astro` imports it on every page. Any DOM use of a shade (swatches, the glitch ghosts) is `var(--shade-<id>)`.
- **JS constants.** The same script writes `src/config/shades.gen.ts` for the WebGL scene, where shades are render parameters (block glows, the galaxy wash, the interim swatch field).
- **Keys.** Always key by `id`, never by name. Names repeat across families: Pastel six times, Neon four times, and Royal, Indigo, Classic, Teal, Stone, Midnight, Orchid, Wine and Persian twice each.
- **Known issue.** Vivid Violets Royal (`vivid-violets-19`) and Midnight (`vivid-violets-20`) share #492376 until the real Royal value arrives.

| # | Family (display name) | Id prefix | First | Index 12 | Last |
|---|---|---|---|---|---|
| 1 | Frosty Whites | `frosty-whites-` | Pearl | Parchment #edeee6 | Oatmeal |
| 2 | Blissful Blues | `blissful-blues-` | Electric | Royal #0040c1 | Midnight |
| 3 | Playful Pinks | `playful-pinks-` | Light Pink | Salmon Pink #ff6a64 | Fuchsia |
| 4 | Vivid Violets | `vivid-violets-` | Light Violet | Orchid #911489 | Eggplant |
| 5 | Mellow Yellows | `mellow-yellows-` | Sunbeam | Dandelion #f5d71d | Dijon |
| 6 | Earthy Browns | `earthy-browns-` | Almond | Cocoa #81553a | Umber |
| 7 | Blushing Corals | `blushing-corals-` | Bellini | Tangerine #ea821a | Rust |
| 8 | Stormy Greys | `stormy-greys-` | Pale Grey | Fog #797474 | Charcoal |
| 9 | Go Green | `go-green-` | Light Green | Lawn #4aa325 | Army |
| 10 | Roaring Reds | `roaring-reds-` | Pastel | Mars #b84533 | Mahogany |

Index 12 is the family's representative swatch when one is needed: type-system role note 12, the manifesto's default.

**Rules for the shades.**
- They may appear together as swatches, and as the product, in catalog order.
- They never colour headings, buttons, borders, backgrounds, icons or UI chrome (rule 24). The logotype glitch is the one approved exception (E-24).
- Neon shades (the four Neons, Gumball, Psychedelic) and pastel shades (Chiffon, Ballerina, Pale Violet) appear only as swatches (rules 49 and 50).

### Shades the hero uses (by id)

| Use | Ids |
|---|---|
| Block glows, 'cool' order, blocks 0 to 9 | blushing-corals-04 Mango #ff9f40; stormy-greys-05 Silver #acacac; frosty-whites-07 Snow #f0f4f5; blissful-blues-08 Sky #08bcf4; earthy-browns-07 Cinnamon #ba7237; vivid-violets-07 Amethyst #8554d1; mellow-yellows-01 Sunbeam #fff164; playful-pinks-14 Rouge #f2638f; go-green-12 Lawn #4aa325; roaring-reds-07 Crimson #d20000 |
| Sky galaxy wash (exception E-1/21/40) | blissful-blues-23 Space #15284f; vivid-violets-24 Eggplant #4a154d; go-green-22 Forest #084f3d; roaring-reds-23 Wine #4b0923 |
| Logotype glitch pairs (one per burst; exception E-24) | Sky and Crimson (also the intro burst); Amethyst and Sunbeam; Lawn and Rouge; Sky and Mango. Lightness weights: Sky .74, Mango .78, Amethyst .56, Sunbeam .94, Crimson .54, Lawn .64, Rouge .69 |
| Section 2's interim frame | all 240, frosty-whites-01 to roaring-reds-24 |

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
| Poppins | the voice: headlines in sentence case, manifesto, quiz question, enlarged tile name, "You are #212", 404 | 700 only | `poppins-700-latin.woff2` | 8,000 |
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

### Element rules (from type-system.md)

```css
h1, h2, .manifesto, .quiz-q, .tile-name, .position, .h404 { font-family: var(--font-display); font-weight: 700; text-transform: none; }
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

- **Default.** `outline: 2px solid var(--ember-luxe); outline-offset: 2px` on `:focus-visible` (CHECKLIST E3).
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

### Countdown (hero)

- **Placement.** Bottom left at `--inset`. Below 1100 px it sits 84 px higher, so the cue has its own row. On the poster path it sits in the first screen and scrolls away with it.
- **Eyebrow.** "Launch in", Open Sans 600 at 14 px.
- **Groups.** Four columns (days, hours, minutes, seconds) with gap `clamp(var(--s3), 4vw, 44px)`. Each holds a numeral at `--fs-hero-countdown`, 600, tabular, always two digits, `min-width: 2ch`, with a unit label 600 at 14 px under it, `gap: var(--s1)`. All Pearl Whisper.
- **Semantics.** `role="timer"`, `aria-label="Time until launch"`.
- **First tick.** The numerals stay hidden until the first tick, which runs in the same task.
- **At zero.** The eyebrow reads "Skreed is live. skreed.com", with "skreed.com" a real link: Pearl Whisper, underlined, `pointer-events: auto`, a hit box at least 44 px tall, the two-tone focus ring. The numerals are not displayed (`.count[hidden]{display:none}`).
- **No JavaScript.** One line, "Launching 1 November 2026", with the date in a `<time>`; the eyebrow and the numerals are not displayed.
- **Reduced motion.** The seconds group is hidden.

### Scroll cue (hero)

- **Placement.** Bottom centre at `--inset`, 64 px wide.
- **Parts.** "Scroll" in Open Sans 600 at 12 px, 22 px above a 9 px Pearl Whisper ball, over a 26 x 1 px line at opacity 0.6.
- **Animation.** Three bounces, then rest. Each 1.5 s cycle: the ball drops 22 px on `--ease-gravity`, squashes to 1.38 x 0.62 on landing, stretches to 0.9 x 1.14 on the rebound, and returns; the line widens to 1.12 and dips 1 px under it. The animation runs 2.44 cycles (3.66 s) and ends on a landing, so the ball rests on its line. It starts when the cue becomes visible, and again each time it returns.
- **Hiding.** It fades out in 0.4 s (`--ease-standard`) once `scrollY` passes 8 px, during the wipe and while loading. It is hidden when there is nothing below to scroll to, and without JavaScript.
- **Reduced motion.** It is still.
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
  --s1: 8px; --s2: 12px; --s3: 16px;
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

- A fixed full-screen canvas over a 460svh scroll track (pull-back 1.5 screens, wipe 1 screen).
- DOM riders (countdown, cue, logotype) are fixed and move only by transform and clip-path.
- On the poster path the track is 100svh, and the poster and the countdown sit in that first screen.
- Slots follow the track: section 2's riders, then `<main>` with section 3, the Wall.

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
- Give anything that moves on its own for more than 5 s a way to stop, or keep it under 5 s (WCAG 2.2.2). The hero's scene and countdown are pending Sam's exception E-2.2.2.
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

The full list, with ids, rules and reasons, is `docs/specs/hero.md` section 10. In brief:
- E-H1: the full-screen loader on the 3D path, and its status line over the poster;
- E-G2: no CTA on the fold;
- E-C3: the WebGL island in sections 1 and 2;
- E-C3b: the countdown's clip-path ride and the glitch's SVG attribute animation;
- E-12: the hero canvas, the loader, the cue's three bounces and the logotype's bursts;
- E-13/42: the block glow and bloom;
- E-1/21/40: the sky's faint galaxy wash (pending);
- E-24: the logotype colour split and the loader outline;
- E-A2: `--night` and the Pearl alpha light;
- E-A2b: the scene's light colours as render parameters (pending);
- E-A3: the hero type sizes;
- E-GSAP: reduced motion through `matchMedia` while the hero loads no GSAP (pending);
- E-C4: Lighthouse graded on the poster tier, the 3D path traced on a real phone (pending);
- E-2.2.2: the scene's ambient motion and the ticking countdown without a pause control (pending).

Anything not on that list is not excepted.

## 8. Responsive Behavior

- **Phone first.** It must look as strong on a phone as on a laptop. Most visitors arrive from Instagram's in-app browser on mid-range Android over 4G.
- **Breakpoints in use:**
  - 1024 px: the logotype goes from 96 to 136 px;
  - 1100 px: the countdown lift is removed;
  - aspect 0.9: portrait framing in the hero (camera zoom `min(1, aspect * 1.25)`, sky crop class, poster class, section 2 swatch columns 24 to 12). In CSS, wide is `(min-aspect-ratio: 9/10)` and portrait is its complement, which matches the scene's `aspect < 0.9` exactly.
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

Motion is reserved for the hero canvas, the Wall, the tilt card and the manifesto, each choreographed once. Everything honours `prefers-reduced-motion`. Sections are visible at rest. Nothing moves on its own for more than 5 s without a way to stop it, except what E-2.2.2 lists while it is pending.

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

### Reduced motion

- **Hero.** It renders the poster: no loader, no canvas. The scene, when Sam picks the `still3d` option, reads the setting once at start.
- **Cue.** It holds still.
- **Countdown.** It hides the seconds.
- **Glitch.** Off. It reads the setting live before every burst, so turning it on after load stops new bursts.
- **Smooth scroll** becomes instant.
- **Option.** Sam may choose the prototype's still-3D variant instead (`REDUCED_MOTION_TIER`).
- **Later sections** wrap all GSAP in `gsap.matchMedia()`, and `src/scripts/motion.ts` stays the one source of the flag.
