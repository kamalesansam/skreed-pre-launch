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
- **The hero.** The one exception to the flat pages, on purpose. Night (#050506) over a moonlit, igloo-style snowfield with a faint Milky Way and low fog. The SKRD mark stands as ten matte black blocks, each holding one family's shade as a glow inside its cut faces. The chrome is a corner logotype, a countdown to 19 November 2026 and a scroll cue. Scrolling pulls the camera back, then an ice-shard wipe opens the next section.
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
- They never colour headings, buttons, borders, backgrounds, icons or UI chrome (rule 24). Two approved exceptions: the logotype glitch (E-24), and since 2026-10-29 the fog's soft patches of shade hue in section 2 and under the quiz (E-fog-hue, CLAUDE.md "The fog's hues": the gems' key shades without the neutrals, at the fog's own lightness and a quarter of their chroma).
- Neon shades (the four Neons, Gumball, Psychedelic) and pastel shades (Chiffon, Ballerina, Pale Violet) appear only as swatches (rules 49 and 50).

### Shades the hero uses (by id)

| Use | Ids |
|---|---|
| Block glows, 'cool' order, blocks 0 to 9 | blushing-coral-04 Mango #ff9f40; stormy-grey-05 Silver #acacac; frosty-white-07 Snow #f0f4f5; blissful-blue-08 Sky #08bcf4; basic-brown-07 Cinnamon #ba7237; vivid-violet-07 Amethyst #8554d1; mellow-yellow-01 Sunbeam #fff164; playful-pink-14 Rouge #f2638f; go-green-12 Lawn #4aa325; roaring-red-07 Crimson #d20000 |
| Sky galaxy wash (exception E-1/21/40) | blissful-blue-23 Space #15284f; vivid-violet-24 Eggplant #4a154d; go-green-22 Forest #084f3d; roaring-red-23 Wine #4b0923 |
| Logotype glitch pairs (one per burst; exception E-24) | Sky and Crimson (also the intro burst); Amethyst and Sunbeam; Lawn and Rouge; Sky and Mango. Lightness weights: Sky .74, Mango .78, Amethyst .56, Sunbeam .94, Crimson .54, Lawn .64, Rouge .69 |
| The fog's hues (E-fog-hue, 2026-10-29; `src/config/fog-hues.ts`, the block shades without Snow and Silver, as OKLab a and b at the fog's lightness) | blissful-blue-08 Sky; playful-pink-14 Rouge; vivid-violet-07 Amethyst; mellow-yellow-01 Sunbeam; basic-brown-07 Cinnamon; blushing-coral-04 Mango; go-green-12 Lawn; roaring-red-07 Crimson. Three at a time, never one twice, never Amethyst beside Sky |
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
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;   /* the later sections' face and, since 2026-11-02, the chrome's small words in capitals (E-chrome-font) */

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
  --fs-hero-label: 0.875rem;                       /* countdown eyebrow and unit labels: IBM Plex Mono 500 in capitals since 2026-11-02 (E-chrome-font), Pearl Whisper */
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
- **Sizes.** Since 2026-10-20 they scale with the screen (Sam: "the text is soo small, look at the screen size and look at how much area the text is covering, it doesnt make any sense"): `--qz-fs` `clamp(15px, min(0.6rem + 0.95vw, 2.6vh), 22px)`, `--qz-fs-q` `clamp(24px, min(1rem + 2.3vw, 5vh), 52px)` (and, until 2026-11-02, `--qz-fs-big` `clamp(36px, min(1rem + 4.6vw, 10vh), 88px)` for the shade's name, now gone: the result has its own faces, The quiz result's type, below); the width term grows them, the height term holds them down on a short screen. Measured: the answers 15 px and the questions 24.97 px at 390 x 844, 20.8 and 40 px at 1280 x 800, 17.08 and 32.85 px at 1366 x 657 (every size in `docs/specs/quiz.md` section 2). Line heights 1.45 and 1.25. Nothing under 15 px outside the result. The portrait step of section 2's labels (13 to 12 px) no longer applies to the quiz, and its old sizes (13, 22 and 36 px; 12, 18 and 28 px in portrait) are gone.
- **Capitals.** The quiz's headline and questions are drawn in capitals, which rule 4's sentence case forbids for a headline; that is part of E-S3-font. Sam's sentence case stays in the DOM, in the decode's visually hidden copy, which sets `text-transform: none` (`.quiz .sr-only`) so that assistive technology reads it as written: Chrome names an element from its rendered text, and a copy left in the section's capitals is named "BACK" (Quiz decode, under Component Stylings). The intro's heading, sub-line and Begin, and the no-JS line, are split at build into the same pair (a sentence-case `span.sr-only` beside an `aria-hidden` span drawn in capitals), the no-JS link is named "ten families" by its `aria-label`, though Chrome still lists its drawn capitals as the link's text, and the loader writes "Loading..." the same way, so before the chunk has mounted and without JavaScript the accessibility tree carries Sam's case too, that link's text aside (`docs/specs/quiz.md` section 2).
- **Section 4** (`.room`, `src/styles/room.css`). The same setting on the section's root: `font: 500 var(--rm-fs) / 1.45 "IBM Plex Mono", ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0; font-synthesis: none; color: var(--pearl-whisper)`. Its two sizes are the quiz's own, `--rm-fs` equal to `--qz-fs` (15 to 22 px) and `--rm-fs-q` to `--qz-fs-q` (24 to 52 px), which `tests/unit/room.test.ts` holds equal: a scene's name (`h3.rm-scene-name`) at `--rm-fs-q` / 1.25, balanced, and every other line, the hint, the loading lines and the words at `--rm-fs` / 1.45; the count with tabular numerals. Nothing under 15 px. Sentence case stays in the DOM, in the decode's visually hidden copy (`.room .sr-only { text-transform: none }`), as in the quiz.

### The quiz result's type (exception E-S3-result in CLAUDE.md and `docs/specs/quiz.md` section 10, item 20)

The quiz's result and its offer are set in Sam's Canva design's faces as he named them on 2026-11-02 ("use the exact same font from this picture for the results page"), not in the label type above. It is an exception to rules 4, 18 and 19, the type system and E-S3-font's one face, for the result and the offer only.

| Family | Job | Weight | Files (served at `/fonts/`) | Bytes |
|---|---|---|---|---|
| Anton | the shade's name, in capitals, drawn at 80% of its width | 400 | `anton-400-latin.woff2` | 18,612 |
| Poppins | the profile, the colour profile, the offer's line, the fine print; in italic, the chips' names | 400, roman and italic (the offer's bold is the brand's 700) | `poppins-400-latin.woff2`, `poppins-400-italic-latin.woff2` | 7,884 and 8,668 |
| Work Sans | the labels (the eyebrow, the family line, the finish, the personality, the links), the field, Send, the consent | 300 | `work-sans-300-latin.woff2` | 20,616 |

- **Files.** The latin subsets Google Fonts serves (SIL Open Font License), self-hosted with `font-display: swap` and the latin unicode-range (`src/styles/fonts.css`): 55.8 KB together, outside the 120 KB cap of the three brand faces and never in the first view (`deck.ts` asks for them when the quiz's chunk mounts, so the name is measured in Anton).
- **Sizes** (set on `.quiz`, each times `--qz-rs`, the result's fit). `--qz-fs-label`, `clamp(16px, min(1.85vw, 3.3vh), 37px)`: the eyebrow at the full step, the personality at 0.72 of it, the other labels at 0.6, the band's at 0.5. `--qz-fs-rt`, `clamp(15px, min(1.5vw, 2.7vh), 30px)`: the words at line height 1.35, the chips' names at 0.9 of it. `--qz-fs-offer`, `clamp(15px, min(1.8vw, 3.2vh), 36px)`: the offer's line at 1.3, the field and Send. The name: `--qz-name-fs`, set by `fitResult()`. Nothing under 12 px (CHECKLIST A3): the field 16 px at the least (iOS zooms under 16), Send 14, the offer 13, the fine print 12.
- **Case.** The name, the labels and Send are drawn in capitals; the words, the chips' names, the offer and the fine print keep Sam's sentence case (`text-transform: none`).
- **Italic.** The chips' names are the one italic on the site, from Poppins's own italic file (`font-synthesis: none` still holds; rule 18 waived for them by E-S3-result).

### About page type (`/about/`; exception E-About-font in `docs/specs/about.md` section 11)

The About page is set in Inter, the face skreed.com sets its text in (the brief of 2026-11-02: "use the font from skreed.com as well"; its answer in chat: "Inter, like skreed.com"), not in the three faces above. It is an exception to rules 4, 19 and 30, the banned list above and `type-system.md`'s family limit, for the About page only.

| Family | Job | Weights | File (served at `/fonts/`) | Bytes |
|---|---|---|---|---|
| Inter | the About page, every line | 400 to 700: 700 the title and the sign-off, 400 the text and the date line, 600 the emphasis | `inter-400-700-latin.woff2` | 29,912 |

- **File.** Built by `scripts/fonts/build-inter.py` (never by `build.py`, whose `main()` rewrites the manifest) from google/fonts@9710da1's `ofl/inter/Inter[opsz,wght].ttf`, its sha256 pinned: `wght` 400 to 700 kept, `opsz` pinned at 14 (the text optical size), cut to `build.py`'s LATIN range and FEATS list with every name record. Byte-identical in `public/fonts/` and `docs/brand/fonts/`, with the OFL beside the docs copy (`docs/brand/fonts/inter-OFL.txt`). Recorded in `scripts/fonts/manifest.txt` (ABOUT PAGE), outside the 120 KB cap of the three brand faces, as IBM Plex Mono is.
- **Loading.** The `@font-face` rules and the token `--font-about: "Inter", "Inter Fallback", Arial, sans-serif` live in `src/styles/about.css`, which the build inlines into `/about/` alone, so no other page carries them or fetches the file. The page's one preload is the Inter file; `font-display: swap`. The fallback overrides, quoted from the manifest (never typed by hand):

```
Inter Fallback 400: size-adjust 106.62%; ascent-override 90.86%; descent-override 22.62%; line-gap-override 0.00%
Inter Fallback 600: size-adjust 101.48%; ascent-override 95.47%; descent-override 23.77%; line-gap-override 0.00%
Inter Fallback 700: size-adjust 102.44%; ascent-override 94.57%; descent-override 23.55%; line-gap-override 0.00%
```

- **Setting** (since 2026-11-03 the owner's reference, exception E-About-look in `docs/specs/about.md` section 11). The title (`h1`) 700 at `--ab-fs-title` (`clamp(2.75rem, 1.545rem + 4.944vw, 5.5rem)`, 44 to 88 px) on 0.95, tracking -0.02em, in uppercase by `text-transform` in three lines, "A message / from our / founder" (the DOM keeps the sentence case); the closing quotation mark ornament 700 at `clamp(8.5rem, 36vw, 22rem)` (136 to 352 px; 96 px under 360 px, where the title steps down to 2.5rem) on 1; the five paragraphs and the date line 400 at `--ab-fs-text` (`clamp(1.125rem, 1.015rem + 0.449vw, 1.375rem)`, 18 to 22 px) on 1.6, pretty; the sign-off 700 at `clamp(1.25rem, 1.140rem + 0.449vw, 1.5rem)` (20 to 24 px) on 1.2; the `em` upright at 600 (`font-style: normal`), never italic; proportional figures. Nothing under 16 px; no digit in the `h1`. The first build set skreed.com's measured sizes (32 to 44 px on 1.05 with 0.005em; 16 to 17 px).

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

### Back to top (`a.to-top`, every family page)

Sam, 2026-10-19: "add a back to top button throughout the site which navigates back to main section 1, without reloading". `src/components/shell/BackToTop.astro`, `src/scripts/shell/to-top.ts`, `src/styles/to-top.css`. On the landing page the section index's Home makes the same jump from the top right where this control sat (2026-11-02, Section index below), so the landing page draws no Back to top; `BackToTop.astro` stays mounted there for the veil (`src/scripts/shell/veil.ts`) and for the way back from a family page.

- **Element.** A link to `/` (so it works without JavaScript) reading "Back to top", which is its accessible name (no `aria-label`, no `title`), then the scroll cue's five-dot chevron (`ScrollCue.astro`) turned to point up, at the cue's own size (17.5 x 9 px, the outer dots at 0.3 and the next at 0.6 as on the cue), static (rule 45: never animated).
- **Look.** No box. Sam, 2026-10-20, of the 44 px Pearl Whisper square it was: "fix that and make it look a part of the site". It is set as "All families" is on a family page: IBM Plex Mono Medium in capitals at `--fs-label` since 2026-11-02 (E-chrome-font; Open Sans 600 before), line height 1, no fill, no border, no shadow, in a 44 px tall hit row padded `var(--s2)` at each side, the chevron `var(--s1)` after the words. Pearl Whisper on the family page's dark ground (on the landing page, until 2026-11-02, it took the logotype's colour, as the section index now does).
- **Contrast.** 18.9:1, Pearl Whisper on the family page's dark ground (measured on 2026-10-20). Its landing-page figures of that day (the fog and the hall, below AA) went with the control on 2026-11-02; the section index's are under its own entry.
- **Placement.** The chevron's right edge on `--inset` (the hit row is set out past it by its padding), as the logotype's left edge is. In the family page's bar's free right end on phones (`z-index: 6`, over the bar), and under "All families" on the family page's wide layout (`(min-width: 900px) and (min-height: 600px)`), clear of the Matte and Gloss switch.
- **When.** Always.
- **Press** (since 2026-11-04, `docs/specs/family-page.md` 27). It scrolls the family page to its own top, the carousel of its cases, smoothly (at once under reduced motion), a keyboard press moving the focus to the family's name; the link is `#`, the page's top, without JavaScript; it tells the case types' steps the scroll is a jump (the event `skreed:jump`) so their arrival hold lets it pass. Until then: It steps back through the history to the landing page (the Navigation API's entries, else the referrer and `history.back()`); the browser restores the landing page from its back-forward cache without a reload, and a `sessionStorage` flag makes it jump to section 1 under the veil (the `--night` veil on at once, opaque, so the restored page never shows where it was; the page jumps to section 1 in place by the hero's own jump, `window.__skreedTop`: scroll 0, the scroll followers snapped, section 4 reset for its next lap, a plain instant scroll on the poster tier, and the veil lifts once the hero has drawn its rest frame). With no landing page behind it, the link navigates to `/`, its files from the cache (`public/_headers`).
- **States.** As "All families" (`.press`): hover (`hover: hover`) `translateY(-1px)`, press `scale(0.98)`, both over `--dur-press` on `--ease-standard`; the chevron never moves by itself (rule 45). The two-tone focus ring (Ember Luxe at 2 px, Urban Slate inside).
- **Reduced motion.** The cut with no veil; no hover lift and no press scale.
- **Analytics.** `to_top { from }` through section 3's `track()`.

### Section index (`nav.snav`, the landing page; `docs/specs/navbar.md`)

2026-11-02: "we need to add a navbar, which is locked, so it's easier for ppl to navigate", then "instead of countdown name it as home, instead of universe, name it as products, and flex it throughout the navbar and stick it more from thecenter to the top right"; of the phone's menu, "bright grey or something, not black" and "make it come from the side, and just 75 % OF THE SCREEN from the side"; of Products, "its okay add products as well no problem". `src/components/shell/SiteNav.astro`, `src/scripts/shell/site-nav.ts` (with `nav-map.ts`, the rest positions and the section on screen, and `veil.ts`), `src/styles/site-nav.css`.

- **Element.** A `nav` labelled "Sections" with an ordered list of four fragment links, "Home" (`#top`), "Families" (`#families`), "Quiz" (`#find`) and "Products" (`#room`), then "About", a plain link to `/about/` (the About page; `docs/specs/navbar.md` D7), last in the bar and in the drawer, never current and never veiled; under 768 px one button, "Menu", that opens the drawer (`popovertarget`); the drawer inside the same `nav`, so the index is one landmark. Words only; no icon, no number.
- **Look.** No box: Work Sans Light (300) in capitals at 16 px, letter-spacing 0, the quiz result's label face, since 2026-11-04 (E-NAV-font; Medium at 16 px and Light at `--fs-label` on 2026-11-03, Open Sans 600 before), line height 1, no fill, no border, no shadow, each word in a 44 px tall hit row padded `var(--s2)` at each side, `var(--s4)` between the hits up to about 1040 px, then `clamp(var(--s4), 10vw - 80px, 96px)`, so from 1280 the row starts near 54 percent of the width (2026-11-03: "flex the navbar more till the center, it's too much too the right"). Its colour is the logotype's: Pearl Whisper, and Urban Slate while the logotype is Urban Slate (`site-nav.ts` copies its `data-tone`). The section on screen is underlined, 2 px at a 3 px offset, with `aria-current="location"`.
- **Contrast.** Pending (E-NAV-contrast, `docs/specs/navbar.md` section 10; default if declined: the bar on an Urban Slate ground with Pearl Whisper words, 9.9:1). Measured on 2026-11-02 (the 3D path, the bar hidden and the ground under each word sampled): 18.5:1 on the night sky; at 1280 x 800, Urban Slate 2.2 to 4.1:1 on section 2's fog and 3.0 to 4.1:1 on the quiz's, Pearl Whisper 2.8 to 4.3:1 over the lit hall and 2.6 to 4.2:1 over the palace scene; at 390 x 844, Menu 3.8 to 4.5:1 on section 2's fog and 3.1 to 3.9:1 on the quiz's. On the poster tier, Pearl Whisper on the night sky and `--night`. The drawer's words are 9.9:1.
- **Placement.** Fixed at the top right, centred on the logotype's row, the last word's text on `--inset` (the hit row is set out past it by its padding), `z-index: 4` (the logotype's layer), under the veil (5) and the loader. From 768 px the five words; under 768 px Menu alone.
- **Drawer (phones).** A transparent full-screen layer (the popover) with a panel at its right edge, 75 percent of the screen wide and its full height, on Pearl Whisper with a 1 px Urban Slate hairline on its left edge (the layer takes no pan, `touch-action: none`; the panel a vertical one): the family switcher's layout, a 56 px head row with "Sections" (1rem) and "Close" (`--fs-button`, where Menu was), then 56 px rows at `--fs-button` between 1 px Urban Slate hairlines, the current one underlined, every word in Work Sans Light capitals as the bar (since 2026-11-03, E-NAV-font; Open Sans, the head and the current row at 600, before), Urban Slate words; a row presses as the bar's words do (its words scale to 0.98). The panel slides in and out over `--dur-card` on `--ease-standard` (a `transform`), at once under reduced motion; the scene stays in view beside it, and a tap there lands on the layer and only closes the drawer, never pressing what is under it; wheel and touch on the drawer stay out of the page's gestures; Escape closes it, focus back to Menu; it closes when the window widens past 768 px, and as the page leaves for About (`pagehide`), so a landing page restored from the back-forward cache comes back without it.
- **Press.** A `--night` veil fades in over 250 ms (`veil.ts`), the page jumps in place to the section's rest position (the hero's `__skreedTop` for Home; `__skreedJump(y)` for the rest, the scroll followers snapped and section 4 reset; a plain instant scroll on the poster tier), and the veil lifts once the hero has drawn two frames. No reload and no smooth scroll through the sections between. A press during a jump runs after it, never lost. Products while the quiz gate holds section 4 opens it as Skip quiz does (`data-open="nav"`, the visit's flag, `room_unlock { by: nav }`, `skreed:quiz-unlock`) and, on the 3D path, waits under the veil for the hall, at most 1.5 s. Keyboard focus moves into the section two frames after the jump: the logotype; the first family link; the quiz's live question (read out as the deck reads it), else the result's shade name, else Begin; the hall's pad (the prompt where the hall is not drawn, or the first scene's name once the stills' scenes are in). A press during Skip quiz's ride runs once the ride has landed or been ended.
- **States.** Hover (`hover: hover`) `translateY(-1px)`, press `scale(0.98)`, both over `--dur-press` on `--ease-standard`; the drawer's rows underline on hover; the two-tone focus ring (Ember Luxe at 2 px, Urban Slate inside). Hidden with the logotype while the intro runs (`html.uh1`).
- **No JavaScript.** The four section words plain fragment links over the poster layout and About a plain page link; under 768 px the five words in a second row under the logotype's row, right-aligned, and no Menu.
- **Reduced motion.** The cut with no veil, the drawer at once; no hover lift and no press scale.
- **Without the popover API** (inside the build's target: Safari 16.4 to 16.6, Chrome 111 to 113, Firefox 114 to 124): the five words in a row as without JavaScript, and the script never touches the popover API, so every section word jumps and About leaves for its page.
- **During Skip quiz's ride** (its wait for the scenes included, at most 2.7 s, `#room[data-ride]`): a press runs once the ride has landed or been ended (a touch on the index ends it), so it is neither lost nor undone by the ride.
- **Analytics.** `nav { to }` through section 3's `track()`, About's plain press included (`to: about`; a modifier press, which opens a new tab, is untracked as the sections' are); `room_unlock { by: nav }` when Products opens section 4.

### Countdown (hero)

- **Placement.** Bottom left at `--inset`. Below 1100 px it would reach the middle, so it sits 106 px higher (84 until the cue's words of 2026-11-02, which took 22 more) and the cue sits under it, the words between them. On the poster path it sits in the first screen and scrolls away with it.
- **Eyebrow.** "Launch in", IBM Plex Mono Medium in capitals at 14 px (E-chrome-font since 2026-11-02; Open Sans 600 before).
- **Groups.** Four columns (days, hours, minutes, seconds) with gap `clamp(var(--s3), 4vw, 44px)`. Each holds a pair of dot-matrix numerals (hero spec E-CD-font, 2026-10-26): one SVG, 17.5 by 13 dots, `clamp(2.5rem, 10.5vw, 4rem)` tall, always two digits so nothing jumps, the digits our own beaded dot bitmaps from `src/config/countdown-digits.ts` (8 by 13 dots a digit, strokes two dots thick, corners rounded by a dot, every dot a circle that touches its neighbours), drawn by the countdown script and never a font file; the digits as text in a visually hidden span. A unit label under it in the eyebrow's Plex capitals at 14 px (E-chrome-font), `gap: var(--s1)`. All Pearl Whisper.
- **Glitch.** The countdown carries the logotype's glitch (E-CD-glitch): slabs kicked sideways with shade-pair ghosts, 0.25 s a burst, all four pairs at once. Both the logotype and the countdown twitch on their own every 3 to 7 s (Sam, 2026-10-26); the countdown has no hover or press burst, since it is not a control.
- **Semantics.** `role="timer"`, `aria-label="Time until launch"`.
- **First tick.** The numerals stay hidden until the first tick, which runs in the same task.
- **At zero.** The eyebrow reads "Skreed is live. skreed.com", with "skreed.com" a real link: Pearl Whisper, underlined, `pointer-events: auto`, a hit box at least 44 px tall, the two-tone focus ring. The numerals are not displayed (`.count[hidden]{display:none}`).
- **No JavaScript.** One line, "Launching 19 November 2026", with the date in a `<time>`; the eyebrow and the numerals are not displayed.
- **Reduced motion.** The seconds group is hidden and the glitch never runs.

### Scroll cue (hero)

- **One cue, in the middle.** Sam, 2026-10-20: "put only one in the middle"; the two side cues clashed with the countdown. Bottom centre, its bottom edge on `--inset`. From 1100 px it sits on the countdown's row, right of the numerals. Below 1100 px it sits under the lifted countdown (106 px in all), the words a `--s1` over it.
- **Parts.** ciao's side icon re-created (docs/specs/hero.md 12.3): one 17.5 x 73 px column of three five-dot chevrons, our own SVG, in Pearl Whisper. No text in the column; its words stand a `--s1` over it on phones and in the bottom right corner from 1100 px (The cue's words, below).
- **Words** (docs/specs/scroll-cue.md, E-cue-text; the brief of 2026-11-02: "add some text like "Scroll to see more" wherever one has to scroll"). "Scroll to see more", IBM Plex Mono Medium in capitals at `--fs-label` (E-chrome-font), line height 1, Pearl Whisper, no box, `aria-hidden`; `p#cueText`, the column's next sibling. Placed the same day by "place it in the bottom corner maybe, for desktop, figure it out to place it properly for phone ratio as well": above 1100 px in the bottom right corner on `--inset`, the edge the section index's last word ends on at the top right (Back to top left the landing on 2026-11-02), at the top and in the pin alike (the countdown holds the bottom left); up to 1100 px, at the top, centred a `--s1` over the column, so the words and the arrows read as one cue, the countdown lifted 22 px more for them (106 px in all). At the top of the page they show and hide with the column. In the pin (3D path) they come back alone once the page has rested 1.5 s (`CUE.stillMs`, `src/config/cue.ts`) in the pull-back, at either end of the first wipe, in the cascade or at the gems' rest, and go at the next scroll; never while the first wipe crosses, from the second wipe on, while section 2 builds, with the quiz's section in view, or while the loader, the intro or a soft poster lock the page (`html.loading`, `html.intro`, `html.poster`: the rule is off there, reads no layout and counts its rest from the lock's end, since a read kept from under the lock would say nothing is below). Up to 1100 px, alone in the pin, they take the bottom left corner on `--inset`, under the countdown's left edge and level with the logotype, clear of the last gem (`data-at="pin"`, set while they are hidden and dropped at the top only once they have finished hiding, so they never move while shown); above 1100 px they keep the bottom right corner. Where the column stays hidden at the top after a jump the camera reaches late, the words come back there alone after the same rest. They never copy the column's forced show over the loader's poster state. Over the fog they take the logotype's tone, Urban Slate (2.25 to 6.07:1 at the median over three runs of 24 drawn reads, 12, 18 and 17 of them under AA: E-cue-text's contrast clause, pending Sam).
- **Animation.** Each chevron is drawn top down, held and wiped top down on a 2.5 s linear cycle (`cue-top`, `cue-mid`, `cue-bottom`). It cycles for as long as it is shown (E-cue-motion).
- **Hiding.** It fades out in 0.5 s once `scrollY` passes 8 px, during the wipe and while the loader and the intro run. It is hidden when there is nothing below to scroll to, and without JavaScript. Its words fade with it on the same curve, a show fading in at once rather than after the half second.
- **Reduced motion.** It is still, the three chevrons shown; its words fade in and out as the column does.
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
- **A return visit.** Back from a family page, or `/#families`, on the 3D path shows the same loader with the same rules (`family-page.md` 23); its exit also waits for section 2's gems to be built and lifts onto them at `S2T.LAND` (4.8 screens since 2026-11-03; 4.55 on 2026-11-02; 14.5 before).

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

- **No boxes.** Sam, 2026-10-19: "first remove that white box, it looks like an amozon page, with the orange button and everything ... just plain text on the fog backround with the same animation, no boxes or anything". No panel, no fill, no border round anything, no shadow and no Ember Luxe button: plain text straight on the hero's fog (E-S3-bg), the controls words. The section has no background of its own; on the poster tier and under reduced motion (no island) the text stands on the page's `--night`. The shade swatches are its one colour in the DOM; since 2026-10-29 the fog under it carries E-fog-hue's soft shade hues. The result's screen is the exception since 2026-11-02 (Sam's reference; E-S3-result): the drawn shade's deep ground over the fog, the offer's band, his paint, a Pearl Whisper field and an Urban Slate Send (Result and Offer, below). `box-sizing: border-box` on everything in it. A tap draws no box either: `-webkit-tap-highlight-color: transparent` on the links, the answers, the consent row, Send and the no-JS link. `tests/unit/quiz-decode.test.ts` fails on any fill in `quiz.css` but the result's ground, the band, the paint's colour layer, the field and Send, on any shadow but the name's layer (and the roll's copy of it), on any filter, and on any border but the dark chips' hairline, the invalid field's line and the focus ring.
- **Type** (E-S3-font; Section 3 type, under Typography Rules). Every line is section 2's label type, set once on `.quiz`: IBM Plex Mono 500 in capitals, no letter-spacing, Pearl Whisper. `--qz-fs` (15 to 22 px) for the body, the answers, the controls and the count; `--qz-fs-q` (24 to 52 px) for the headline and the questions; each a clamp on the viewport's width and height (Section 3 type, under Typography Rules). Line height 1.45 for the body, 1.25 for the heading step (balanced). The answers pad 0.4 em above and below, so they grow with the type. Tabular numerals on the count and the family line. Since 2026-11-02 the result and the offer are set in Sam's design's faces instead (The quiz result's type, under Typography Rules; E-S3-result). The text is below AA on the fog (E-S3-contrast; the measured ratios are in `docs/specs/quiz.md` section 6).
- **Width.** The intro, the questions (`.qz-cards`), the results and the gift's column are at most 560 px wide on phones held upright, and at most 960 px on a phone held sideways (640 px wide or more and under 600 px tall; since 2026-10-29: 784 px at 844 x 390, the width between the gutters). On laptops (900 px wide and 600 px tall or more) the intro is `min(78vw, 1040px)` and the questions `min(90vw, 1240px)` (they hold the picture frame beside the words): 998.4 and 1152 px at 1280; the result takes the whole width between the gutters, in Sam's reference's columns, and the offer's column `min(94vw, 1840px)` (Result and Offer, below). All are centred in the stage (the offer's column in its own band after the stage, by `margin: 0 auto`).
- **Stage** (`.qz-stage`). `min-height: 100svh`, a grid with `align-content: end` on phones held upright and `center` on laptops and on a phone held sideways, padded by `--inset` plus the safe areas (the side ones since 2026-11-02, as the logotype and Back to top take them; until then a notched phone held sideways put the two columns under the notch), and on laptops 64 px more at the top, so the centred text clears the fixed logotype's band; on a phone held sideways 56 px more at the top in every state (since 2026-10-29: the count stood beside the logotype there), so the first line clears the band and the page scrolls through what the 390 px do not hold. In the result state it drops the minimum height and pads 56 px more at the top, so at the section's top the result starts under the fixed logotype's band.
- **Focus.** The two-tone ring on keyboard focus only (`:focus-visible`): the Ember Luxe outline at 2 px with a 2 px offset, and a 2 px Urban Slate ring drawn by `::before` at `inset: -2px` on the links and the answers (`.quiz :is(.qz-link, .qz-opt):focus-visible::before`). The question on screen, the shade's name, the offer's line and the done line take focus from script only (`tabindex="-1"`) and draw no outline and no ring (`.quiz :is(.qz-card, .qz-shade, .qz-done-text, .qz-offer):focus { outline: none }`): they are no controls. The email field, a Pearl Whisper box since 2026-11-02, shows focus as the Ember Luxe outline at 2 px with a 2 px offset (an input is focus-visible on every focus, a click included); an invalid field keeps its 3 px line under the words. The consent row carries both rings round "[ ]" and its words (`.qz-check:has(input:focus-visible)`); where `:has()` is unsupported (`@supports not selector(:has(*))`) the Ember Luxe outline goes round "[ ]" alone (`input:focus-visible + .qz-tick`), since the box it stands for is unseen.
- **Without JavaScript.** The intro reads as drawn, "Click to begin" is hidden (`html:not(.js)`), and the no-JS line links to `/#families`. Its lines, like the intro's, carry a sentence-case copy for assistive technology beside the drawn capitals, and the link is named "ten families" by its `aria-label`. Its link's hit box is an `::after` at `inset: -15px -8px` round the link, so it is at least 44 px tall (CHECKLIST B2) where the link sits on one line: 49.5 px at 360 x 780, 390 x 844 and 844 x 390, 52.5 px at 768 x 1024, 55.5 px at 1024 x 768, 57.5 px at 1280 x 800 and 53.5 px at 1366 x 657 (measured by hit testing with JavaScript off, 2026-10-20). At 430 x 932 the link wraps after "ten", and "families", on the second line, takes a tap only on its own 20 px line, under 44 px (an open defect, `docs/specs/quiz.md` AC4).

### Quiz link (`.qz-link`: "Click to begin", "Skip quiz", Back, "See it on the case", "Not quite? Try again", "Get an exclusive launch discount", "Back to your shade", "Not you? Use another email.")

- **Element.** A `<button>`, or an `<a>` for "See it on the case", drawn as words: no fill, no border, square, the section's type and colour, left aligned.
- **Size.** `display: inline-flex`, minimum height and minimum width 44 px, no padding, so each is 44 px tall and as wide as its words, never under 44 px. Back, four letters of 0.6 em, takes the 44 x 44 px minimum wherever the body is under 18.3 px (every phone, 768 x 1024, 1366 x 657) and is as wide as its word above that (46.4 px at 1024 x 768, 49.9 px at 1280 x 800; measured 2026-10-20); the others are wider by their words.
- **States.** Underlined as links are, 1 px at a 0.4 em offset, written as the longhands `text-decoration-line` and `text-decoration-thickness` (as every underline `quiz.css` sets is: Safari before 26.2 drops a `text-decoration` shorthand that carries a thickness, underline and all); on hover (`hover: hover` only) the line thickens to 2 px at once, with no transition (no transition anywhere in the quiz; CHECKLIST C3). While the chunk loads or the form sends the control is `aria-disabled` (never the `disabled` attribute) and reads "Loading...", "Sending..." or "Still trying...", and its line does not thicken.
- **Uses.** "Click to begin" on the intro, and under it, since 2026-10-26, "Skip quiz" as the intro's fourth row (the quiz gate, `docs/specs/quiz-gate.md` D3: a press opens section 4 and rides the page to scene 1, the hall's place until 2026-11-02; while the scenes are awaited on the 3D path it reads "Loading..." with `aria-disabled`, as Begin does while its chunk loads); Back at the left of the footer of questions 2 to 10 and "Skip quiz" at the right of every question's footer, alone on question 1 (`.qz-foot`, a 44 px grid of two columns spread to the column's ends); "See it on the case" (to the drawn shade on its family page, `/shades/<family>/?shade=<nnn>`) and "Not quite? Try again" side by side under the result (`.qz-actions`, wrapping, `gap: 0 var(--s4)`), in the result's Work Sans Light capitals; "Get an exclusive launch discount" and "Back to your shade" where the result and the offer take the screen in turn (Offer, below); "Not you? Use another email." in the offer, whose Send is a button (Offer, below).
- **Focus.** The two-tone ring (Quiz, above).

### Quiz question (`.qz-card`)

- **One on screen.** Ten questions, one per `.qz-card` in `.qz-cards`, all in one grid cell (`display: grid` on the deck, `grid-area: 1 / 1` on every card), so the deck is as tall as its tallest question on every screen and nothing under it moves from one question to the next. A `hidden` card keeps its place in the cell (`.qz-card[hidden] { display: grid; visibility: hidden; }`). Only the question on screen shows (`.is-top`); every card keeps `tabindex="-1"`, and the one on screen is focused from script, with no ring, so it is announced and Down or Tab reaches its answers. The rest are `hidden` and `inert`, and no card is stacked behind it. A hidden card renders no picture frame, so at 1366 x 657, where a visual question's frame is taller than every question's words, the deck grows 5.4 px while a visual question is on screen (an open defect). Each card is `role="group"` named "Question n of 10".
- **Footer** (`.qz-foot`). Since 2026-10-26 a grid of two `auto` columns spread to the column's ends (`justify-content: space-between`), 44 px tall: Back in the first column on questions 2 to 10, "Skip quiz" in the second (`grid-column: 2`, so it stays at the right on question 1, where the first column is empty), its last letter at the text column's right edge. Both decode in with the question, Skip quiz last, and wipe out with it (`docs/specs/quiz-gate.md` D3). On a phone held sideways (since 2026-10-29) the footer is the last row of the card's left column, under the question and the picture frame, Back at that column's left and Skip quiz at its right edge, 300 px wide at 844 x 390. Before the quiz gate the footer was a flex row holding Back alone.
- **Rows.** A grid of four rows, `auto auto 1fr auto` (the count, the question, the seven answers, the footer), `gap: var(--s3)`, `align-content: start`, everything left aligned, `user-select: none`. On laptops every card has a second column for the picture frame, `clamp(260px, 30vw, 440px)` wide after a `clamp(32px, 4vw, 80px)` gap; the word-only questions keep it empty, so every question's words take the same width (716.8 px at 1280). On a phone held sideways (640 px wide or more and under 600 px tall; since 2026-10-29, Sam: the quiz laid out "properly for the mobile aspect ratio size") the card is two columns, `minmax(0, 2fr) minmax(0, 3fr)` with a `clamp(32px, 4vw, 64px)` gap: the count, the question, the picture frame (the `1fr` row) and the footer down the left column (300 px at 844 x 390) and the seven answers down the right, spanning the four rows (450 px), so no screen that short has to hold a question in one column; the deck is 354 px tall there, against 493.3 px in one column.
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
- **On a phone held upright.** Above the question, in the space the bottom-aligned stage leaves under the logotype's band: the column's width, from the logotype's band, 72 px, measured for the stage where it comes to rest with the page scrolled as far toward the quiz as it goes, so the room is the same at every scroll (`bandEnd()` in `deck.ts`, since 2026-11-02): while the page goes on below the quiz that is 72 px under the stage's top, the room the pinned section gives, retry's measure included; where the page ends at the locked quiz's foot with a phone's bars hidden the stage rests lower, and the frame then starts 72 px under the viewport's top and may stand above the section's top, over the fog on the 3D tier, but never above the section's top on the poster tier and under reduced motion, where the family links end there; the card's frame is fitted again just before each picture comes (from 2026-10-29 to 2026-11-02 the measure took whichever was higher, the viewport's top or the stage's top, wherever the page was, and a scroll could leave it stale) to 24 px over the card (its count line), at most 40% of the screen's height (`--qz-pic-h`, set by `deck.ts`), and not drawn with under 96 px of room: 358 x 139 px at 390 x 844, 380 x 230 px at 412 x 915, 398 x 255 px at 430 x 932, 560 x 308 px at 768 x 1024; none at 360 x 780, 412 x 780 or 390 x 664 (a phone with its browser's bars shown).
- **On a phone held sideways** (since 2026-10-29). The left column's third row, between the question and the footer, `position: relative` with no height of its own: the grid gives it the room the answers' column leaves, and `deck.ts` marks it `data-none` under 96 px. 300 x 180 px at 844 x 390 on question 1 (150 px on question 9, whose question takes three lines).
- **On a laptop.** The card's second column, beside the words: `clamp(260px, 30vw, 440px)` wide, `aspect-ratio: 4 / 5`, its top level with the count (384 x 480 px at 1280 x 800).
- **Reveal.** The text's decode on a photograph (timings in section 10, Motion): the frame is cut into twelve vertical strips, each drawing the picture as a background sized as `object-fit: cover` (through the CSSOM); the strips fade in left to right over 0.4 s while each rolls through its neighbours' slices to its own, settled at 0.75 s, and the picture settles from 1.03 to 1 in scale. It goes as a right-to-left wipe over 0.2 s, a scale not yet settled easing to 1 over it. Reduced motion: a 0.2 s fade, no roll, no scale. Built on 2026-10-20 at Sam's request; his approval of E-S3-motion covered the text's decode only, so the slice swap (a `background-position`, outside CHECKLIST C3) and the scale wait for his confirmation (`docs/specs/quiz.md` section 10, item 17).
- **Files.** Not in git: the repository is public and the licence does not allow the files to be shared. They are built on the build machine by `scripts/quiz/prepare-pictures.py` and `scripts/quiz/encode-pictures.mjs` into `src/assets/quiz/pics/`; without them the visual questions are words only. Every build folder carries them too, encoded under `_astro/`, so `.gitignore` keeps every build folder at the root out as well (`/dist*/`), and the review frames that show a picture (`docs/specs/screenshots/licensed/`; `docs/specs/quiz.md` D41 and section 10, item 16).

### Quiz decode (`src/scripts/quiz/decode.ts`; E-S3-motion)

- **What it is.** Section 2's label animation (`src/scripts/hero/section2/labels.ts`) on the quiz's text, on every change of screen (timings in section 10, Motion). Every element marked `data-dc` in `Quiz.astro` takes part; the gift's error, status and done lines and "Not you? Use another email." are split too, but never decoded (Markup, below).
- **Markup.** The text of each is split once into a visually hidden span holding Sam's sentence-case text (the accessible name; `.quiz .sr-only { text-transform: none }`, since Chrome names an element from its rendered text) and an `aria-hidden` row (`.dc`) of one span per character, upper-cased as section 2 prints its labels, spaces included (a link's underline is drawn per span, so no bare space shows its piece of line early). The result's and the offer's lines, in proportional faces since 2026-11-02, are marked `data-dc="prop"`: each span keeps its own case (the style sheet draws the capitals), the rolled glyph is drawn over the face's own (`data-r` and `::after`, `quiz.css`), which keeps its place unseen, so no line changes width while the glyphs count down, and once a reveal has settled its row is joined back into one text node, so the face keeps its kerning at rest; it is split again when the next wipe starts. Only the markup's ASCII whitespace is collapsed, so the no-break space in "11 p.m." survives. Markup the server split already (the intro's heading and sub-line; Section 3 type, above) gives its text from its `.sr-only` copy; Begin is given `QUIZ_COPY.begin`, since its copy may read "Loading..." at mount. The gift's error lines, its status line and its done line, and the send words' "Sending..." and "Still trying...", are split the same way as they are written, at once with no animation (`set()`); "Not you? Use another email." is split at mount, visible. Only printable ASCII rolls: Plex Mono has no U+201B or U+201F, so the curly quotes, the no-break space and the ellipsis fade in without rolling and no glyph falls back to another face mid-roll.
- **Order.** The elements of a screen decode in 0.05 s apart (the step shrinking so the last starts within 0.6 s); the wipe out starts them all together. A start in the same direction while an element's run is under way joins that run instead of restarting it, as `labels.ts`'s `setOn()` does, so no glyph flashes back. `#find` carries `data-decoding` while any text moves. A hidden document draws no frames, so there every run jumps to its end state.
- **Flow.** The intro is visible at rest, split into glyphs as it stands (rule 12's visible-at-rest clause; its motion list is waived for the decode by E-S3-motion). Begin wipes it out and question 1 decodes in. An answer: it is underlined, the rest of its question wipes out, it holds 120 ms and goes, then the next question (or the result) decodes in. Back: the question wipes out and the previous one decodes in. The result and the offer are first put straight to hidden (`conceal()`), so a label written at once earlier ("Send my code", written back whenever a send ends) decodes in with the rest, then they decode in while the ground, the paint and the chips fade in on opacity. "Not quite? Try again": a send under way is abandoned (aborted, and its answer, should one still come, writes no error line, announcement or done state; Send's label is left to the wipe and "Send my code" is put back before the next offer decodes in), the offer's error and status lines are cleared, the result and the offer wipe out with the ground, question 1 decodes in and the page scrolls back to the section's top. Each new question takes no press for its first 350 ms (Quiz question, above). Nothing in the quiz's text uses a transform (the one transform is a picture's settle, Quiz picture, above); the card fly-off is gone.

### Quiz reveal (`.qz-reveal`; D50, since 2026-11-03)

Between the last answer and the result (Sam, 2026-11-03: "a little loading animation or like, a progress bar filling or something to make the user excited, for like 3-4 seconds ... appearing one by one"). In the deck's place, the deck hidden: four lines in the quiz's type at the question's size (`--qz-fs-q`), "Reading your answers.", "Weighing all 240 shades.", "Picking your colour.", "Are you excited?" (`QUIZ_COPY.reveal`), each decoding in 0.85 s after the one before (`QUIZ_REVEAL_MS.step`), `gap: var(--s3)`; under them a 1 px Urban Slate hairline (`.qz-bar`, a `--s2` above) that a 3 px Pearl Whisper line (`.qz-bar-fill`) fills from the left by `scaleX` over 3.5 s on `cubic-bezier(0.3, 0, 0.4, 1)`; 0.3 s after it is full the lines wipe out together and the result comes, about four seconds after the answer. No number or percentage: the bar paces, it measures nothing. The lines are `aria-hidden`; the live region says "Picking your colour. Your shade is on its way." once. Under reduced motion the lines fade on the same clock and the full line brightens a quarter at a time by opacity, with no transform.

### Result (`.qz-result`; `src/config/quiz-tones.ts`, `scripts/quiz/prepare-rub.mjs`, `scripts/quiz/make-smear.py`; E-S3-result since 2026-11-02)

Sam's reference of 2026-11-02 ("it should fit inside one screen, after the results, there should be no scrolling ... dynamic to all the colors that we got"), his answers of that day (the ground "Shade's deep tone, flat", the offer "Reference look and words", phones "Shrink to fit") and his later words: "use the exact same font from this picture for the results page, as well as the placement of the elements, but have the text animation of the site intact, and the paint rub on the page should look exactly how it looks on the image". The full description is `docs/specs/quiz.md` section 2, "The result screen", D45 to D49.

- **One screen.** In the result state `#find` is a grid one screen tall (`min-height: 100svh`): the stage, padded 56 px over `--inset` at the top for the logotype's band, then the offer's band. `fitResult()` in `deck.ts` steps `--qz-rs` from 1 down to 0.7 by 0.03 until the section is no taller than the small viewport (`div.qz-vh`, `100svh`); `--qz-rs` scales the result's and the band's type and gaps, never a line under 12 px, the 44 px targets or the 48 px field and Send. Where even 0.7 does not hold both, and on every phone held sideways, `data-swap` gives the result and the offer the screen in turn. With a phone browser's bars gone the ground and the band's fill run on to the screen's foot (`calc(100lvh - 100svh)` below the section).
- **Ground and tones.** `div.qz-ground` fills the screen in the drawn shade's deep tone (`--qz-deep`), shown in the result state only, fixed to the screen (the section is a stacking context, so it lies under the result's text and over the fog) and leaving with the scroll: `groundBand()` in `deck.ts` sets its opacity to 1 at the result's rest and within 3% of a screen of it, then falling linearly to 0 by half a screen as `#find` moves off it, either way, and `data-qz-ground` (the logotype's and the section index's Pearl Whisper) while it is 0.5 or more (D53, since 2026-11-03; it rises from the foot of the screen over 0.7 s on the standard ease as the result comes, D51). Every tone is the drawn shade's own, computed at build in OKLab (`resultTones`): the ground at lightness 0.27 (0.14 under a darker shade's, 0.11 at the least) and chroma at most 0.06, the band (`--qz-band`) 0.045 lighter, the name's layer (`--qz-mid`) at 0.42 to 0.55, chroma eased into sRGB, never clipped. Pearl Whisper on them: 13.6:1 or better on every ground, 11.6:1 on every band.
- **Type.** Sam's design's faces (The quiz result's type, under Typography Rules): Anton for the name, Poppins for the words and, in italic, the chips' names, Work Sans Light for the labels (the eyebrow, the family line, the finish, the personality, the links).
- **Name** (`h3.qz-shade`). Anton in capitals, drawn at 80% of its width (`transform: scaleX(0.8)`, static, as Sam's design draws it), `letter-spacing: 0`, `line-height: 0.92`, one line, over one hard offset of itself in `--qz-mid` (`text-shadow: 0.065em 0.052em 0`, the reference's darker copy). `fitResult()` sizes it to its column as drawn (`--qz-name-fs`, through the CSSOM): at most 34.4% of the screen's height and 420 px on a laptop, 26% and 140 px on a phone held sideways, 16% and 150 px on one held upright, times `--qz-rs`. No full stop. Over it "Your shade is", under it the family line and "Best in matte." or "Best in gloss.".
- **Paint** (`div.qz-smear.qz-rub`). Sam's swatch from his Canva design, taken by `scripts/quiz/prepare-rub.mjs` into the git-ignored `src/assets/quiz/rub/` (256 x 624, 14 KB): its outline as alpha, its relief as grey. A fill of `--qz-shade` masked by the image (`.qz-rub-col`, the mask pointed at the image by `deck.ts`) with the image over it in `mix-blend-mode: hard-light` (`.qz-rub-img`), isolated, so every shade is the same paint, with its rim, highlights and thinning tip. Where a build has no copy (until Sam confirms Canva's licence, every build from the repository, production included), our own relief in the same format stands in, with the same markup and the same recolouring (since 2026-11-03, D52; the flat SVG stroke before it): `scripts/quiz/make-smear.py` models it from measurements of his swatch (its outline at 25 heights; a matte body, a rolled lip along the upper right with a dark slot inside it, a raised rim down the lower right, a lit ridge along the left, the tail a torn wedge) as a height field lit from the upper right, nothing of his pixels, into the committed `src/assets/quiz/smear/smear.webp` (256 x 624, 6.9 KB); `PUBLIC_PAINT=own` takes ours where both exist. Width `clamp(56px, 18vw, 120px)` on a phone held upright, `clamp(44px, 8vw, 80px)` held sideways, each times `--qz-rs`; on a laptop its column's width up to the reference's height, 55.5% of the screen (`min(100%, calc(55.5svh * var(--qz-paint-ar) * var(--qz-rs)))`, centred in its column; `--qz-paint-ar` is the paint's width over its height, 0.41026, written by `deck.ts` from the image's own size, the same for both reliefs, so a build without the swatch fits where one with it does), so a screen wider than 16:9 such as 1366 x 657 keeps the offer on the screen.
- **Words.** The personality's name in Work Sans Light capitals; the profile and the colour profile, with "We also recommend:" run on, in Poppins 400, Sam's sentence case, at most 62ch.
- **Chips** (`li.qz-mini`). The rest of the group, in their shades (painted through the CSSOM), rounded (`border-radius: var(--s1)` times `--qz-rs`): 24 by 64 px on a phone held upright, 32 by 88 px from 640 px wide, `clamp(32px, 2.6vw, 56px)` by `clamp(88px, 8vw, 180px)` on a laptop, all times `--qz-rs` (since 2026-11-04, D54), 4 px apart; a chip grows to its name and the row to its tallest. The name on the chip, read upward (`writing-mode: sideways-lr`, top to bottom where a browser lacks it; no transform), in Poppins italic at 12 px at the least, in `--night` or Pearl Whisper, whichever reads better (`data-ink`, from `chipInk`: 4.4:1 or better; Fuchsia 4.43 and Teal 4.40 the two under 4.5); the nine darkest chips carry a 1 px Pearl Whisper hairline (`data-rim`).
- **Layout.** One row on every screen since 2026-11-04 (quiz.md D54): four columns, `minmax(0, 0.95fr) auto minmax(0, 1.3fr) minmax(0, 0.85fr)` (the words' block taken apart with `display: contents`): the name, the paint, the words, the chips with the links stacked; within 960 px from 640 px wide and `max(960px, 80vw)` on a laptop, the paint 10vw (32 to 56 px) on a phone held upright, 8vw (44 to 80 px) from 640 px and 6.5vw (64 to 150 px) on a laptop; on a phone held upright the words at `clamp(12px, 3.3vw, 15px)`. The offer's band under the row wherever both fit, in its own turn where they do not (Sideways, and the swap). Until then a laptop had Sam's reference's columns, `34fr 5fr 13fr 8fr 40fr`, and a phone held upright the name and the paint over the words, the chips and the links.
- **Decode.** Every line keeps the site's decode with its roll (Quiz decode, above): `data-dc="prop"`, one span per character in its own case, the rolled glyph drawn over the face's own (`span[data-r]::after`, the name's layer with it), so no line changes width; plain kerned text again once settled.
- **Logotype.** Over the result's ground the fixed logotype and Back to top stay Pearl Whisper (`html[data-qz-ground]`, set by `deck.ts` while the ground lies under their band), where the fog would turn them Urban Slate.

### Offer (`.qz-gift`, the email form; rendered only with `PUBLIC_LEADS` on)

- **Place.** A band along the bottom of the result's screen in `--qz-band`, padded `var(--s4)` over and `var(--s3)` under, times `--qz-rs` (3.4vh and 2.6vh on a laptop), plus the bottom safe area, and `--inset` plus the side safe areas at the sides; its column (`.qz-gift-in`) centred, at most 960 px (`min(94vw, 1840px)` on a laptop), its rows `var(--s3)` apart times `--qz-rs` (3.6vh on a laptop), every line centred. The band's own lines (the consent, the messages) are Work Sans Light capitals.
- **Line.** Sam's reference word for word, "Get an **exclusive launch discount** on any Skreed product in your signature shade or any other shade you love!", Poppins 400 with the middle at 700, `--qz-fs-offer` times `--qz-rs` (13 px at the least), line height 1.3, balanced, at most 66ch; on one line on a laptop where it fits.
- **Field and Send** (`.qz-row`, a grid `minmax(0, 1fr) auto`, at most 640 px; on a laptop 58vw, `44fr 14fr`, `clamp(48px, 9vh, 101px)` tall with `9vh` times `--qz-rs`). The field: a Pearl Whisper box, square, `padding: 0 var(--s3)` (2.3vw on a laptop), Urban Slate words and caret in Work Sans Light at `--qz-fs-offer` times `--qz-rs` and 16 px at the least, the address in the case it is typed in, placeholder "Your email address" in Urban Slate at 0.75, labelled "Email" for assistive technology only; focus is the Ember Luxe ring; invalid, a 3 px Urban Slate line under the words. Autofill held off in Urban Slate. Send: "Send my code" in Work Sans Light capitals (14 px at the least), Pearl Whisper on Urban Slate, square, `padding: 0 var(--s4)` (1vw on a laptop); under a mouse its fill turns `--night` over `--dur-press` on `--ease-standard` (none under reduced motion).
- **Consent** (`label.qz-check`). A 44 px row, `grid-template-columns: auto auto`, `align-items: baseline`, `align-content: center`: the tick on the words' first line and the row centred in its 44 px. "[ ]", or "[X]" once ticked, then the words.
- **Messages.** One line is always reserved under the field and under the consent (`min-height: 1.45em`), so a message appearing or clearing never moves the controls below it; the status line, then the fine print in Poppins 400 at 12 px, at most 72ch, the rows of the fields' grid with no gap between them.
- **Sideways, and the swap.** On a phone held sideways (640 px wide or more, under 600 px tall), and wherever the smallest type does not hold the result and the band together (`#find[data-swap]`), the band is hidden in the result state until "Get an exclusive launch discount" (`button.qz-togift`, with the result's links) is pressed: the result wipes out and the band decodes in as the whole screen (`#find[data-gift="open"]`, centred, padded for the logotype's band), focus on its line; "Back to your shade" (`button.qz-toresult`) returns, focus on the name.

### Text button (`.txtbtn`)

- **Type.** Open Sans 600 at `--fs-button` / `--lh-solid`, the panel's text colour, no fill, no border.
- **Size.** A hit area of at least 44 x 44 px (Tap targets, section 8; CHECKLIST B2): minimum height 44 px, padding `var(--s2) 0`.
- **States.** An underline at a 3 px offset, transparent at rest and coloured in on hover and on `:focus-visible` only at once (no transition: nothing but transform and opacity animates, CHECKLIST C3). No transform.
- **Uses.** None. The quiz stopped using it on 2026-10-19 (its controls are quiz links, above) and section 4 on 2026-10-20 (its words are section 4 links, below); no element of the site carries `.txtbtn`. The pattern stays here for a later section that needs it.
- **Focus.** The two-tone ring (Focus ring, above).

### Section 4 stage (`section#room`; `src/styles/room.css`, `src/components/room/Room.astro`, `src/scripts/room/walk.ts`)

- **No boxes.** Sam, 2026-10-19, of the quiz: "just plain text on the fog backround with the same animation, no boxes or anything", and of section 4 on 2026-10-20: "Yes, all of it". Every element of the section is plain text on the scene: no panel, no fill, no border but the focus ring's, no shadow, no blur and no Ember Luxe button, on any tier. The controls are words, underlined as the quiz's links are. `box-sizing: border-box` on everything in it. `tests/unit/room.test.ts` fails on any background but `none`, `--night` or `--skeleton`, any border outside the focus ring, any `box-shadow`, `backdrop-filter` or `filter`, any gradient, a radius other than 0, a style attribute, and the classes `rm-pill`, `btn` and `txtbtn` (`docs/specs/section-4-flux.md` AC10).
- **Ground.** On the 3D path the section has no background of its own. A track of 680svh in every state (`.room .rm-track`, `ROOM_HEIGHT` 6.8 screens in `src/config/room.ts`) holds a sticky 100svh stage (`.rm-stage`, `overflow: clip`) over the hero's canvas, which draws the third wipe from the quiz's fog straight to scene 1 and the five scenes (`docs/specs/section-4-flux.md`, `docs/specs/section-4-no-hall.md`; the hall and its bubble left on 2026-11-02 and are kept on the branch `archive/section-4-grey-room`). The scenes' bottom shade, which keeps their lines legible, is drawn into the video frame by the carousel's shader (45 percent of black, solid to 0.45 of the height, clear by 0.72), never in the DOM. On the poster tier (`html:not(.hero3d)`, `html.poster`, or the section's own `data-tier="poster"` after a failed asset) and without JavaScript the track collapses and the stage is a grid on `--night`: the scenes' column from the section's top (Scenes, below), each picture on a `--skeleton` box of its aspect ratio until it decodes.
- **Type.** Section 4's type (Section 3 type, under Typography Rules): IBM Plex Mono Medium in capitals, Pearl Whisper, at the quiz's sizes, set once on `.room`. The text stands straight on the scene, never boxed to pass: every line of the scenes measures 6.0:1 or better at the median over the ten loops at 390 x 844 and 1280 x 800 (E-S4-contrast, pending Sam; `docs/specs/evidence/section-4-flux-contrast.md`).
- **Stacking.** The section at `z-index: 2` in the page. Inside the stage: the scene on screen at 2, the words that are controls and the lines at 3, and the poster tier's loop fade at 5 (fixed).
- **Focus.** `.room :focus-visible` is the Ember Luxe outline at 2 px with a 2 px offset, and on the words that are controls a `::before` at `inset: -2px` with a 2 px Urban Slate border is the inner ring (the two-tone ring above). The pad's ring is drawn inside the stage (Pad, below). A scene's name takes focus from script only and draws no ring.
- **Positions.** No style attributes (the CSP has no `style-src-attr`). `walk.ts` sets the stage's opacity through the CSSOM while a seam's cloud covers the section; nothing in the section moves by a transform.
- **Decode.** Every line decodes in and wipes out by section 3's decode (Section 4 decode, below), and every control whose wipe ends takes `hidden`, its focus moved first and then `inert`. The scenes' lines are clipped instead, so all five scenes stay in the accessibility tree.
- **The logotype over it.** Pearl Whisper over every scene (`ROOM_SCENES` `toneDark`, measured on each scene's still under the logotype's box by `scripts/room/scene-tone.mjs`: every scene's top is dark); Urban Slate while a seam's cloud covers half the frame or more, whatever is under it, the hero after the exit's jump included. Back to top follows it.

### Section 4 link (`.rm-link`: the previous and next words, "Pause motion")

- **Element.** A `<button type="button">` drawn as words, the quiz's link pattern (`.qz-link`): no fill, no border, square, the section's type and colour, `white-space: nowrap`, `display: inline-flex` with `gap: 0.6em`, `position: absolute`, `z-index: 3`. The user agent's fill, border, radius and appearance are taken off.
- **Size.** Minimum height and minimum width 44 px, no padding, so each is 44 px tall and as wide as its words.
- **States.** Underlined, 1 px at a 0.4 em offset, written as the longhands. On hover (`hover: hover` only) the line thickens to 2 px at once, with no transition and no transform. `aria-disabled="true"` drops the underline and the pointer. Never the `disabled` attribute, so focus stays on it.
- **Focus.** The two-tone ring (Section 4 stage, above).

### Section 4 line (`p.rm-line`: the loading line)

- **Place.** Bottom centre: `left: 50%`, `bottom: calc(var(--inset) + env(safe-area-inset-bottom, 0px))`, `transform: translateX(-50%)`; `width: max-content` up to `calc(100% - 2 * var(--inset))`; minimum height 44 px, the line centred.
- **Text.** Plain words in the section's type. Every string comes from `src/config/room.ts` `ROOM_COPY`.

### Loading line (`p.rm-line.rm-loading`, `role="status"`)

- **Text.** "Loading the scenes..." while the section is in view and scene 1 cannot be drawn yet (the fog stands meanwhile; the arrival waits for it). It also shows while the section's own chunk is on its way: its top has reached the viewport's top and no frame has come for 500 ms. "Still loading..." from 8 s. It decodes in, and wipes out once scene 1 is drawn and on the poster tier.
- **Place.** The line above, local to the section (CHECKLIST H1). Never a spinner (rule 41). A scene's wait for its loop shows under the scene's lines (Scenes, below).
- **Gone with the hall (2026-11-02).** The hall's hint ("Scroll to walk to the door."), the prompt `[E] ENTER SKREED UNIVERSE` at the door and Skip over the bubble; their entries stand on the branch `archive/section-4-grey-room`.

### Pad (`div.rm-pad`, `#rmPad`)

- **Element.** The stage's focusable surface: `tabindex="0"`, `role="group"`, `position: absolute; inset: 0`, the section's first tab stop; no outline at rest, `-webkit-tap-highlight-color: transparent`. Its `aria-label` is "The five scenes. Use Down and Up to move between them."
- **Keyboard focus.** A visitor's keyboard focus on it during the approach (a Tab from the quiz, `:focus-visible`) puts the page on scene 1, and the arrival moves that focus on to scene 1's name. A click or a tap on the stage focuses it without `:focus-visible` and moves nothing.
- **Keys.** The keys of the scenes belong to the page scroll (`src/scripts/hero/section4/scroll.ts`), whatever has focus but a button or a typing control: ArrowDown, PageDown and Space step forward, ArrowUp, PageUp and Shift+Space back, one step per keydown, a held key never repeating (E-S4-scroll); at scene 1 a backward key and at scene 5 a forward key are the page's own. The pad has no key of its own (the hall's walk keys left with it).
- **Pointer.** In the scenes a pressed pointer or a finger turns the product (plus or minus 0.3 rad), and so does a mouse as it hovers (E-S4-hover).
- **Focus, inset two-tone ring.** The stage clips, so the ring is drawn inside the pad: a `::before` at `inset: 0` with a 2 px Urban Slate border and a 2 px Ember Luxe outline at `outline-offset: -4px`, and an `::after` at `inset: 4px` with a 2 px Urban Slate border. From the stage's edge inward it reads 2 px Urban Slate, 2 px Ember Luxe and 2 px Urban Slate, so it holds on every scene. No `box-shadow`.

### Scenes (`ol.rm-scenes`, `#rmScenes`)

- **Element.** `h2.sr-only` "The five scenes", then the list, `aria-label` "Our products, in five rooms": one `li.rm-scene[data-id][data-i]` per scene of `ROOM_SCENES`, in the carousel's order (cove, grove, ember, palace, dawn). Each holds:
  - the still, `picture.rm-scene-pic`: the portrait AVIF and WebP under `(orientation: portrait)`, then the wide AVIF and WebP, and an `<img>` with its `alt` (one sentence describing the room, no product), `width` and `height`, lazy. Its sources stay in `data-srcset` and `data-src` until the poster tier asks for them, so the 3D path, where the carousel draws the same stills, never fetches them;
  - the lines, `div.rm-scene-text`, a grid with `gap: var(--s1)`: `h3.rm-scene-name` (`tabindex="-1"`), `p.rm-scene-shade`, `p.rm-scene-line`, on scene 1 `p.rm-scene-hint` (`hidden`), `p.rm-scene-count`, then `p.rm-scene-more` (`aria-hidden`, `hidden`);
  - `p.sr-only.rm-scene-alt`, the name's `aria-describedby` on the 3D path.
- **The lines** (section-4-flux.md 3). The product's catalog name ("Phone case"); its shade and family, "Lilac, vivid violet"; the product's catalog line with rule 17's words dropped; the count, "1 / 5", with tabular numerals. The name at `--rm-fs-q` / 1.25, balanced; the rest at `--rm-fs` / 1.45.
- **Shown.** Only the scene on screen (`.is-on`): its lines bottom left, `left: var(--inset)`, their bottom at `--inset` above the safe area, `width: calc(100% - 2 * var(--inset))` up to 520 px, Pearl Whisper straight on the scene, over the bottom shade the carousel draws. The product is placed clear of them: on a phone it sits higher (its centre at 0.60 of the view's height), on a laptop it moves right by what the 520 px column needs (89 px at 1280 x 800), and a unit test holds every product's box to zero overlap with the lines' (the column, the bottom 34 percent). The other scenes are clipped by the clip pattern (1 px, `clip-path: inset(50%)`), never `hidden`, so all five stay in the accessibility tree. On the 3D path the list is `inert` during the approach until the arrival or the wrap; never inert on the poster tier or without JavaScript.
- **Arrival.** The four lines decode in, one after another, 0.12 s apart. A keyboard user's focus (on the pad, a word or a scene's name, or anywhere in the section after a key) moves to the scene's name, which speaks with its room's description. Otherwise `#rmLive` announces "1 of 5. Phone case. Lilac, vivid violet." once, never twice; after the wrap, "Round to the five scenes. 5 of 5. ...".
- **A step.** At its start the lines wipe out in 0.2 s and are clipped again; the next scene's lines decode in at its end.
- **The hint.** On scene 1, as a row of its lines above the count (a row under the count would share the previous and next words' row at 390), once its lines have settled and only on its first visit: "Swipe to the next scene" on `hover: none`, "Scroll to the next scene" with a pointer, "Scroll or press Down to the next scene" when a key was used in the last 15 s. It wipes out on the first step and on any arrival at another scene.
- **Loading.** While the scene's loop is expected and not in, "Loading..." under the count in `p.rm-scene-more`, "Still loading..." at 8 s; the scene shows its still meanwhile. Never on the still paths (reduced motion, Save-Data, 2g, `deviceMemory` 2 or less) nor after a refusal. On a Tune build a refused loop shows "Clip blocked" there.
- **Poster tier and no JavaScript.** The scenes stand one per screen in a column on `--night` (`min-height: 100svh`), each its still over its lines: the still full width, `aspect-ratio: 9 / 16` (1280 / 666 in landscape) up to 76svh, `object-fit: cover`, on a `--skeleton` box until it decodes; the lines under it, padded `--inset`, within 520 px. No video, no carousel, no glue. The column shows at once from the section's top (the hall's still and the press before it left on 2026-11-02); without JavaScript the noscript copy of the column, with no line over it.

### Previous and next words (`div.rm-nav` > `button.rm-prev.rm-link`, `button.rm-next.rm-link`)

- **Text.** "Previous scene" and "Next scene", two underlined words (Section 4 link, above).
- **Place.** Bottom right: `right: var(--inset)`, their bottom at `--inset` above the safe area, `gap: var(--s3)`. Shown in the scenes only (`data-state="world"`), decoded in with the first arrival; hidden in every other state.
- **What they do.** One whole step each, the same as a swipe or a key. "Previous scene" at scene 1 and "Next scene" at scene 5 are `aria-disabled` (the page scrolls on past either edge; the way back into the hall left with it). They give a tap, a screen reader and a keyboard a single-pointer way to step (WCAG 2.5.1).

### Pause motion (`button.rm-pause.rm-link`, `#rmPause`; WCAG 2.2.2, the default of E-S4-loops if Sam declines it)

- **Text.** "Pause motion", swapping to "Play motion" once the loops are paused: a plain button whose text swaps, no `aria-pressed`.
- **Place.** Bottom right, one row above the previous and next words (`bottom: calc(var(--inset) + env(safe-area-inset-bottom, 0px) + 44px + var(--s2))`).
- **When.** Only while the director sets `data-pause="1"`, which it does only once Sam declines E-S4-loops; while it is pending the control is never shown. Then: in the scenes and under a seam, never in the approach, absent on the poster tier.
- **What it does.** Every loop pauses and the cloud's time holds, while steps, seams and the glue still work. Remembered for the visit only (a variable, nothing stored).

### Live region (`p.sr-only#rmLive`, `aria-live="polite"`)

- One announcement per arrival, only when focus does not move to the scene's name; the wrap's own line after the wrap.

### Section 4 decode (`src/scripts/quiz/decode.ts` from `walk.ts`; E-S4-font, and E-S4-motion pending)

- **What it is.** Section 3's decode on section 4's text, with the same markup (a visually hidden sentence-case copy beside an `aria-hidden` row of glyphs) and the same timings (Motion, section 10). Every line of the loading line, the words and each scene's four lines and hint is split once when the walk script mounts, and hidden until its part decodes in.
- **Never a transform on the text.** Each glyph's opacity, and its character while it rolls.
- **Reduced motion.** A 0.2 s fade, no roll. The decode reads the setting live.

### Section 5, the sign-up (`section#signup`; `src/styles/signup.css`, `src/components/signup/`, `src/scripts/signup/`, the jar images in `src/assets/signup/jars/`; `docs/specs/section-5-picture.md`, Sam's picture of 2026-11-02, which supersedes `docs/specs/section-5.md` and `docs/specs/section-5-sand.md` for what the section shows)

- **The picture's page** (E-S5-picture; Sam: "just make this exact same page with the same logic, same font, same space, same backround, same everything from that picture"). Its own ground, type, colours and marks, for this section only; none of it spreads to another section, and nothing of this block changes the tokens above.
- **Ground.** Flat #F2EAE1 (`--su-ground`, equal to `SIGNUP_GROUND` in `src/config/signup-ground.ts`): drawn by the hero island under the section on the 3D path (`data-ground="island"`, E-S5-bg), painted by the page everywhere else. Behind the jar row only, the picture's soft falloff, darker towards the right (#EFE8DF at the left, #E7E0D5 at the right, at the jars' middle), with no visible edge, never behind text.
- **Type** (two Google Fonts files in `src/styles/fonts.css`, SIL Open Font License, section 5 only). Inter (`inter-opsz-wght-latin.woff2`, wght 100 to 900, opsz 14 to 32, `font-optical-sizing: auto`) and Jost (`jost-wght-latin.woff2`, wght 100 to 900). The headline Inter 300 at -0.021 em, line-height 0.82, #000000; the sub-line Inter 400 at -0.010 em, line-height 1.44, #5A544D, its bold run Inter 700 at +0.010 em, #3F3935; "EVERY FOLLOW FILLS THE JAR" Jost 400 at -0.046 em, #27211F; the worth labels Inter 300 at +0.004 em, line-height 0.96, #49443F, one size for all four; "GOT YOUR COLOURS?" Inter 300 at -0.003 em, #000000; the grey lines Inter 400 at -0.035 em, line-height about 1.15, #77706A; the placeholder Jost 400 at -0.019 em, #AFA9A5 (typed text #27211F); the button Jost 400 at -0.011 em, #FFFFFF; the footer Jost 400 at -0.006 em, #AEA8A3. Sizes in the picture's proportions (the headline 0.106 of its width, the label over the jars 0.031, "GOT YOUR COLOURS?" 0.047, the labels 0.026, the body lines about 0.020), each from `clamp()` with viewport units; the body lines at least 15 px on a laptop and 13 px on a phone, the worth labels at least 13 and 11.
- **Layout.** One screen (Sam: "Fit one screen"): `.su-body` is one screen tall below the logotype's band (`--inset` plus 56 px plus the safe area). The headline and the sub-line left-aligned, the sub-line indented 0.0255 of the column; everything from "EVERY FOLLOW FILLS THE JAR" down centred. Laptop in portrait: the picture's proportions, the vertical gaps tightened first, then the headline and the jars smaller. Laptop in landscape, from 900 px wide (Sam, 2026-11-02: "relayouted to fit properly across the entire screen, not just in the center like a mobile screen"): two columns across the whole width between the insets, the headline and the sub-line on the left (two fifths of the frame) centred on the band beside them, the label and the jar row on the right (56 percent, the axes 220 picture px apart, the falloff behind that band alone), then the heading, the grey lines, the form and the footer centred under both; the picture's unit from the jar column's width and the height, never over 1.15, so the jars grow with the screen. Phone (under 720 px): one column with 16 px insets, the four jars still in a row (each about 0.18 of the column across), shorter hairlines, the form still one joined pill. One spacing scale, `gap`, no per-element margins.
- **Jars** (`src/assets/signup/jars/`, laid out by `jars.json`). Four pre-rendered images in the picture's look (our own lathe traced from it: clear glass, satin plastic pellets in the picture's colours, a soft shadow to the right, a faint glossy floor), 1x 200 x 240 and 2x 400 x 480, AVIF and WebP, transparent; the row placed by the jar's box, the frames overlapping their neighbours. Jars 1 to 3 at `f`, `y` and `i`; jar 4 at the visit's state, one of sixteen keys in press order.
- **Marks.** Inline SVG of our own drawing: Facebook's 2023 mark (a #0866FF disc), YouTube's (a #FF0000 rounded rectangle), Instagram's (the app icon's radial gradient, #F9CF7C at the bottom left to #5F5ECB at the top left, a white outline camera), the star (#FA841A, its star cut to the ground). One height, YouTube wider; each centred on its jar's axis, its worth label centred under it. Presentation attributes only, never a `style` attribute (the CSP).
- **Platform column** (one `a` each for Facebook, YouTube and Instagram). The jar, the mark and the worth together: an https link to a new tab with `rel="noopener"`, named "Follow Skreed on Facebook, 5% off (opens in a new tab)" and the like, the jar image and the mark inside it decorative. Hover (`hover: hover`): the mark scales to 1.06 on `--ease-standard`, no change of opacity. Focus: the two-tone ring round the whole column (the Urban Slate ring carries it on the cream). The star's column is no link.
- **Form** (`PUBLIC_LEADS` on). A full pill field (a 1.4 px #A49B99 outline, no fill, radius half its height) under the black pill button (#000000, its Jost label white), which overlaps the field's right end flush top and bottom and takes 45.6 percent of the joined width; at least 44 px tall on a phone. One message line under it, its space reserved. The gift form's states: validation on blur and submit, "Sending...", "Still trying..." at 8 s, the error line with the address kept, the offline queue sent on `online`, a 409 read as success, the done line with "Not you? Use another email." No consent box. Off (production): no heading, no hairlines, no grey lines, no form; the footer stays.
- **Hairlines.** Either side of "GOT YOUR COLOURS?": #5C5650 at the heading's end, fading to the ground along their length; shorter on a phone.
- **Motion** (E-S5-wipe, E-S5-fill). The fourth wipe onto the flat ground, as built. Jar 4's fill: the next state's image over the current one, revealed upward by `clip-path: inset(<top>% 0 0 0)` from the current surface to the new, 900 ms a quarter and 1400 ms a half, ease-out, 500 ms after the press while the page is in front (else 300 ms after it is in front again), queued while one runs, at once under reduced motion. The mark's hover scale. Nothing moves at rest. The exit seam and the wrap as section 4's, with the exit guard.

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
  --s0: 4px; --s1: 8px; --s2: 12px; --s3: 16px; --s4: 24px; --s5: 32px;   /* --s0: the quiz result's chips' gap, Sam's reference's measure (8 px at its 2000 px), set on .quiz in quiz.css (2026-11-03); --s4: the quiz result's row gap and the gap between its two links; --s5: the gift's top padding (section 3, 2026-10-19; on laptops the result's column gap and the gift's indent were --s5 until 2026-10-20, now clamp(32px, 4vw, 72px)) */
  --inset: clamp(16px, 3.5vw, 56px);  /* corner inset: 16 px at 390, 44.8 px at 1280, 56 px at 1700 (measured) */
}
```

- A new step is added here, with its use, before any component uses it.
- The hero's other lengths are component dimensions, not spacing:
  - the cue (64, 26, 22 and 9 px);
  - the countdown lift (106 px since the cue's words of 2026-11-02; 84 px before);
  - the countdown group gap cap (44 px);
  - the label offset (-1.5, -6) px;
  - the hit-area insets of the logotype (-11, -8) and of the countdown link (-13, -8), which exist to reach 44 px;
  - the focus ring offsets (2 px; 6 px on the logotype).

### Grid and gutters

- Phone first at 390 px, and everything holds at 360 px. Side gutters are at least 16 px. There is no horizontal scroll.
- Widths tested: 360, 390, 430, 768, 1024, 1280 (CHECKLIST G10).

### The hero's layout

- A fixed full-screen canvas over a 750svh scroll track (`TRACK_SVH`, since 2026-11-03: the pull-back 2.5 screens over half the camera's road at its old speed, the first wipe one screen, the ten blocks leaving together at 3.0 and landing at 4.8, the rest to 5.5, the second wipe to 6.5, then section 3 rising over the fog; 675svh on 2026-11-02, with the whole road over the halved scroll and half-screen wipes; 1720svh with a 5-screen pull-back and one block every 0.8 screens before that, `docs/specs/section-2.md` section 14).
- DOM riders (countdown, cue, logotype) are fixed and move only by transform and clip-path.
- On the poster path the track is 100svh, and the poster and the countdown sit in that first screen.
- Slots follow the track: section 2's riders, then `<main>` with section 3, the quiz (`section#find`; the Wall is a later section).

### The family pages' layout (`/shades/<family>/`, `docs/specs/family-page.md` 2.3, 2.4, 2.8)

- **Spacing steps added for the family pages** (defined in `src/styles/family.css`, used through `gap` and padding): `--s4: 24px` (title offset over the stage, the HUD band's top padding, the switcher's bottom padding), `--s5: 32px` (the swatch grid's height allowance in the stage), `--s6: 48px` (section padding: "The whole family.", the family navigation row, the footer).
- **Component dimensions, not spacing:** the header (56 px phone, 72 px wide, `--fh`), the HUD band (224 px, `--band`, 3D mode), the tap minimum (44 px, `--hit`), the wide layout's grid circle (80 px, `--sw-wide`, spec 2.6) and grid column (112 px, `--cell-w`), its finish and Reserve column (190 px, `--side-w`), its HUD and scrubber column (at most 664 px, `--scrub-w`) and the shade name between Prev and Next (318 px, `--name-w`), the sticky bar (72 px plus the safe area), the scrubber marker (24 px), the switcher rows (56 px), the Prev and Next chevron (16 px in a 44 px box), the grid swatch's selected ring (2 px at a 3 px offset) and focus outline (6 px offset), and Back to top's bottom offset on a family page (14 px, `--to-top-bottom` in `to-top.css`, the row "Back to main page" shares on the phone layout).
- **One breakpoint:** the wide layout at 900 px wide and 600 px tall or more; everything else is the phone layout.
- **The beats' framing on the wide layout** (round 6, family-page.md 24 D12; Sam, 2026-11-03: the whole case visible at every case type): the beats' camera stands back by 1.6 (`CFG.wideBack`, as `phoneBack` 1.75 does on phones) and ciao's per-beat vertical drift is damped to 0.4 of itself (`CFG.wideDrift`), so each beat's case sits inside the screen with room above and below (at 1280 x 800, from 94 to 145 px down to 562 to 643 px); the argument screen is unchanged.
- **The beats' light on every case type** (round 6, family-page.md 24 D13; Sam, 2026-11-03: "it should be the same as tough case for all other case types"): ciao's profile light and its target ride with the zoomed case (`pose.ts` `profileLightOffset`), held where ciao's were through the zoom and lifted with the case from beat 1 on, so the MagTough, Snap and Armor stand in its pool as the Tough does, at both sizes.
- **Wide layout, swatch grid mode:** title, the 80 px grid and the controls stack in flow and the page scrolls, so a short laptop screen (1280 x 609, 1366 x 657, 1024 x 600, 900 x 600) never shrinks the circles or lays the grid over the controls. Only 3D mode pins the controls into the stage's bottom band.
- **The argument screen's way out** (round 4, `family-page.md` 22, exception E-F5; its place on phones, round 5, section 23): "Back to main page", a fixed link set as "All families" is (IBM Plex Mono Medium in capitals at `--fs-label` since 2026-11-02, E-chrome-font, Open Sans 600 before; a 44 px hit row, no box). On the phone layout it is on Back to top's row with Back to top's offsets (its bottom `--to-top-bottom` plus the safe area, its left `--inset` plus the side safe area less `--s2`), so its words start at `--inset` on the left as the wordmark does and Back to top keeps the right (hit row y 786 to 830 at 390 x 844, the boxes 73.3 px apart since the Plex capitals of 2026-11-02, 107.7 in Open Sans); on the wide layout it is centred under the letters by its margins, its bottom one `--inset` above the safe area (y 711.2 to 755.2 at 1280 x 800). Its layer is `z-index: 4`, level with the beat nav and the HUD and under the corners, Back to top (6) and the loader (40); it exists in 3D mode only and is `hidden` until 2.5 s after the argument screen comes on.
- **The cue's words** (docs/specs/family-page.md 25, docs/specs/scroll-cue.md, E-cue-text): "Scroll to see more", set as "All families" is (IBM Plex Mono Medium in capitals since 2026-11-02, E-chrome-font, as "All families", "Back to main page" and Back to top), `aria-hidden`, at `z-index: 2` with the side columns, 3D mode only. The first screen's line stands centred between the two columns on their bottom line (`204px` plus the safe area above the bottom on the phone layout, so y 626 to 640 at 390 x 844, between the front case and the scrubber), under the controls row on the wide layout (its bottom a `--s3` above the safe area, ciao's place for its own line). The story's line stands at the bottom right, right-aligned on `--inset`, in two lines on the phone layout ("SCROLL TO" over "SEE MORE", `max-width: 9ch`, so it keeps to the dark corner): on the phone layout just above Back to top's hit row (its bottom `--to-top-bottom` plus `--hit` plus `--s0` plus the safe area, y 747.4 to 782.2 at 390 x 844, the two lines), on the wide layout one `--inset` above the safe area. The bottom right is where the per-shade wash is darkest: in two lines Pearl Whisper's worst median is 6.64:1 at 360 x 780 over the 240 shades (one line of the capitals fails 44 of them there; the bottom left fails 95 even in Open Sans; `scripts/scroll-cue/wash-contrast.mjs`). Where the page's own fit brings the front case within `--s0` of that line on a phone (a short screen: a 375 x 553 Safari viewport, or 390 x 750 with a 34 px home-indicator inset), `html.cue-tight` stands the line down and the columns stand alone (`src/scripts/family/cue.ts` over `solve()`, read on every resize with the line's own bottom, so the safe area counts); under 500 px tall it never shows. In swatch grid mode, a single screen, the side columns hide too.

### The About page's layout (`/about/`, `docs/specs/about.md` section 2)

- **Ground.** Pearl Whisper edge to edge (skreed.com's own background, measured), with no panel, card, rule, image or texture; text only (exception E-About-38 in `docs/specs/about.md` section 11). The title and the wordmark in Urban Slate (9.9:1); the letter, its emphasis, the sign-off and the date line in Coffee, `--shade-basic-brown-13` (5.9:1; the owner's reference of 2026-11-03, exception E-About-look); Ember Luxe in the ring around "colour is personal." and the wordmark's focus outline.
- **The ornament.** A closing quotation mark (U+201D) at the top right, Inter's own glyph at `clamp(8.5rem, 36vw, 22rem)` (96 px under 360 px), Urban Slate at a quarter opacity, its box on the right gutter and its glyph's top on the title's first row; decorative only: `aria-hidden`, no pointer events, no selection (E-About-look).
- **The ring.** A drawn ellipse around "colour is personal." in the first paragraph: an inline SVG path in Ember Luxe, a 2.75 px stroke kept at every size (`vector-effect: non-scaling-stroke`), reaching 0.56em above and 0.49em below the words' line box and 0.45em past each end, with the pen's second pass along its top; the words are an inline block on one line (`white-space: nowrap`) with 0.6em of room above, so the ring clears the line before (E-About-look; the owner's crop of 2026-11-03).
- **The wordmark.** The corner logotype's artwork, inset, sizes (96 px, 136 px from 1024 px), hit area and two-tone ring, in Urban Slate, as the one way home (a link to `/`). It is `position: absolute`, so it scrolls away with the page instead of sitting over the text. In place of the glitch it takes the site's press idiom (a 1 px lift on hover, a 0.98 scale on press, `--dur-press` on `--ease-standard`, none under reduced motion), and the page carries no script.
- **The column.** One reading column of `--ab-measure` (44rem, 704 px), its text flush left, at the left gutter (`--inset` plus the side safe area) as the reference sets its text; the column fills the width on a phone and stops at 704 px once the page is wider than it and its gutters (about 794 px), the page's right left to the ornament. The first build centred a 34rem column.
- **Spacing.** `--s6: 48px`, defined in `src/styles/about.css` as `family.css` defines it, for the room under the wordmark (the page's top padding is `--inset`, the top safe area, the wordmark's height and `--s6`), the gap before the sign-off and the foot (with the bottom safe area). `--s5` from the title to the text, `--s4` between paragraphs, `--s1` from the sign-off to the date line, all through `gap`. The wordmark's height is a component dimension, `--ab-mark-h` (23.25 px; 32.94 px from 1024 px), as the family pages' `--mark-h`.
- **Breakpoints.** None but the wordmark's 1024 px; the type follows its clamps from 390 to 1280 px.

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
- E-S3-result (Sam, 2026-11-02, with his reference; full wording in CLAUDE.md and `docs/specs/quiz.md` section 10, item 20): the result as one screen on the drawn shade's deep tone, in his design's faces (Anton, Poppins and its italic, Work Sans Light) and placement, the name in capitals with a hard offset layer, his Canva paint swatch recoloured (out of the repository until he confirms Canva's licence), rounded chips with italic names on them (Fuchsia and Teal at 4.4:1), a Pearl Whisper field and an Urban Slate Send, discount language in the offer, type under the 15 px floor on a phone (12 px at the least), and the result and the offer in turn where one screen cannot hold both.

### Approved section 4 exceptions

Sam's own words cover these, so they are recorded as approved with them. The full wording, with each default if withdrawn, is `docs/specs/section-4-flux.md` section 10 (`docs/specs/section-4-world.md` section 10 for E-S4-font; `docs/specs/section-4-no-hall.md` section 10 for what the hall's removal changed), and they are in `CLAUDE.md` ("Section 4 (Sam, 2026-10-19 and 2026-10-22)"). For section 4 (`section#room`) only:
- E-S4-scroll: inside the carousel's range in the scenes (q 1 to 3 since the hall left) the wheel, one finger and the keys of a step are captured for whole steps, a gesture at either edge left to the page, and at scroll 0 after the intro a touch or a wheel burst runs the wrap; and the arrival's hold, a page carried from the quiz past scene 1 by its own scroll put back on it (section-4-no-hall.md D3); never Ctrl+wheel, more than one finger, a zoomed viewport or a typing control. Against section-4.md D13 ("The section does not hold the scroll"), section-4-world.md's "Never a hold" and the references' fixed decision against wheel hijacking on phones. "sure", to a wrapped virtual scroll replacing native scroll, and the brief's "each section has an elastic sticky glue" (2026-10-22).
- E-S4-snap: the glue over the page's three seams, on touch too, instant under reduced motion. Against section-2.md's auto-settle ("never on touch or under reduced motion") and the references' "no snap on the hero". "page sections only, same on touch" (2026-10-22).
- E-S4-video, amended: `media-src 'self'` in production for the ten scene loops, muted with no audio track, `playsinline`; never under reduced motion, Save-Data, 2g or slow-2g, or at `deviceMemory` 2 or less, where the stills stand in; every loop passes the flash rule (AC5). The backgrounds are videos, "phones as well" (2026-10-22).
- E-S4-colour, amended: the five scenes keep their own palettes with their gradients, glows and fog (rules 1, 21, 24 and 42; A2), the cloud's shadow tone (0.80, 0.84, 0.93) and the carousel's black clear colour; the products wear catalog shades by id, and the cloud's light and the text are Pearl Whisper. "use the same colors what they use for all 5 scenes" and "the fog, the water, the gradient, everything" (2026-10-22).
- E-S4-font stands as section-4-world.md has it: section 2's label type for every line of the section (rules 4 and 19, type-system.md, CHECKLIST A3), "Yes, all of it" (2026-10-20).
- E-S4-38 (the hall with no product) and E-S4-portal (the wavy circle over the hall) have nothing left to cover since 2026-11-02: the hall and the bubble left together, and both stand on the branch `archive/section-4-grey-room`.

### Approved quiz gate exceptions

Sam's own words of 2026-10-26 cover these, so they are recorded as approved with them. The full wording, with each default if withdrawn, is `docs/specs/quiz-gate.md` section 10, and they are in `CLAUDE.md` ("Quiz gate (Sam, 2026-10-26)"). For section 4's lock behind the quiz and the ride from "Skip quiz" only:
- E-QG-lock: `section#room` rendered `hidden` with `data-locked` until the quiz's result shows, Skip quiz is pressed or the section index's Products is pressed (2026-11-02), then open for the rest of the visit; while locked no wrap from the top and no glue span at its seam; never without JavaScript. Against rule 12's "Sections are visible at rest" for section 4, the loop both ways at the top, quiz.md's "the page goes on below the quiz in every phase" and CHECKLIST G21 (no dead end: the result's flow and Skip quiz lead on). "it shouldnt scroll past the quiz untill someone takes the quiz, section 4 should be locked".
- E-S5-bg, amended (section 5, by Sam's words of 2026-10-26, "the same transition animation as section 1 to section 2", and of 2026-11-02, "same backround ... from that picture"): the hero island draws the picture's flat ground (#F2EAE1) under section 5, once and held, and no jar; the fourth wipe is the composite's cut onto it. E-S5-wipe: the cut outside rule 12's list. E-S5-fill (his words of 2026-11-02, "the fourth jar should fill up 25% with blue"): jar 4's new layer revealed upward, 0.9 s a quarter and 1.4 s a half, on a press only, at once under reduced motion. E-S5-picture (his words of 2026-11-02, "just make this exact same page with the same logic, same font, same space, same backround, same everything from that picture"): the picture's type (Inter and Jost), its colours (the cream ground, the warm greys, the platforms' marks, the orange star, the black pill button, the pellets), its contrast below AA, its discount words and its falloff, each with its default in `docs/specs/section-5-picture.md` section 13. E-S5-pour was withdrawn on 2026-11-02; E-S5-font, E-S5-contrast, E-S5-motion, E-S5-model, E-S5-tilt and E-S5-dust-alpha were superseded by the picture.
- E-QG-ride: one ride per press of Skip quiz, 1.2 s on `--ease-standard` to section 4's q 1, scene 1 (its top on the poster tier), through the third wipe as built, after a wait for the scenes (scene 1 and products.bin) of at most 1.5 s on the 3D path, by an instant `scrollTo` each frame with no CSS property animated (CHECKLIST C3, as E-S4-snap); ended by any wheel, touch or key from 350 ms after the press or by a scroll it did not write; instant under reduced motion. Against rule 12's reserved-motion list and `docs/references/README.md`'s line on a soft scroll takeover. "the moment they click on skip quiz, it should go to section 4 automatically, with the transition included".

### Pending section 4 exceptions

Not approved yet; the build ships each as the spec says and flags it, and `docs/specs/section-4-flux.md` section 10 gives each one's default if Sam declines:
- E-S4-loops (WCAG 2.2.2): the five loops run while a scene is front, with no way to stop them. Default: the "Pause motion" control (Pause motion, under Component Stylings).
- E-S4-webgl, amended: the island draws the carousel's planes, products and cloud, against "No WebGL from section 3 on" and CHECKLIST C3. Default: the poster column for everyone.
- E-S4-motion, amended: every motion of section 4 in section 10 below, the decodes and the loops included (rule 12's reserved-motion list, C3's transform-and-opacity rule for the decode's character swap); rule 12's three sentences stand as the world spec had them: nothing fades in on scroll, nothing moves that the visitor did not start except what this list names, and every named motion has its cut under reduced motion. Default: cuts with the 300 ms cross-fade for every one, and the decode as a 0.2 s fade.
- E-S4-contrast, amended: Pearl Whisper text straight on the five loops (`docs/specs/evidence/section-4-flux-contrast.md`: every scene line 6.0:1 or better at the median). Default: the bottom shade darkened until every median reads 4.5:1, and the step's text hidden until the lights are up.
- E-S4-glow, amended: the gloss and metallic products' highlights under the key light (rules 13 and 42). Default: matte for every product.
- E-S4-grain and E-S4-light were the hall's and the bubble's, and left with them on 2026-11-02.

## 8. Responsive Behavior

- **Phone first.** It must look as strong on a phone as on a laptop. Most visitors arrive from Instagram's in-app browser on mid-range Android over 4G.
- **Breakpoints in use:**
  - 1024 px: the logotype goes from 96 to 136 px;
  - 1100 px: the countdown lift is removed;
  - aspect 0.9: portrait framing in the hero (camera zoom `min(1, aspect * 1.25)`, sky crop class, poster class, section 2 swatch columns 24 to 12). In CSS, wide is `(min-aspect-ratio: 9/10)` and portrait is its complement, which matches the scene's `aspect < 0.9` exactly.
- **The quiz (section 3).** Phone first: the stage is `min-height: 100svh` with its text bottom-aligned on phones and centred on laptops (900 px wide and 600 px tall or more, the family pages' breakpoint), where the stage pads 64 px more at the top, the intro widens from 560 px to `min(78vw, 1040px)`, the questions to `min(90vw, 1240px)` with the picture frame beside the words, the results and the gift's column to `min(84vw, 1120px)`, and the result takes two columns. The type scales with the viewport's width and is held down by its height (15 to 22 px, 24 to 52 px, 36 to 88 px); there is no portrait step since 2026-10-20. On a phone a visual question's picture stands above it, in the space under the logotype's band, and is left out where under 96 px are free. The deck holds the tallest question's height from the first question to the last (at 1366 x 657 a visual question's frame adds 5.4 px, an open defect); on a landscape phone the deck is taller than the screen, and at 1024 x 768 and 1366 x 657 the stage is, with the laptop's 64 px of extra top padding (797 px of 768; 666.4 px of 657, 671.8 px on a visual question), so the page scrolls through it there.
- **Section 4.** Phone first, on the quiz's type scale. The loading line sits bottom centre inside the gutters above the safe area, a scene's lines bottom left within 520 px, the previous and next words bottom right. The loops come in two sets, portrait (720 x 1280) where the stage is taller than wide and wide (1328 x 692) elsewhere, chosen once a visit when the first loop starts to load and cover-fitted every frame after; the arc of a step is 22 degrees on a portrait stage and 80 on a wide one. The product sits higher on a phone and to the right on a laptop, clear of the lines.
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

Motion is reserved for the hero canvas, the Wall, the tilt card and the manifesto, each choreographed once, plus section 3's decode (E-S3-motion) and its answer pictures' reveal (built at Sam's request on 2026-10-20, pending his confirmation under E-S3-motion), and section 4's (below, pending as E-S4-motion). Everything honours `prefers-reduced-motion`. Sections are visible at rest. Nothing moves on its own for more than 5 s without a way to stop it, except what E-2.2.2 lists while it is pending, the fog under section 3 (E-S3-bg, approved 2026-10-19), and section 4's loops while E-S4-loops is pending. Every other motion of section 4 is under 5 s and started by the visitor: the step 0.77 s, the seams 640 ms plus the 400 ms lock, the arrival's hold at most 1.2 s after the input that carried the page in, the glue 0.5 s.

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
  --dur-card: 300ms;                              /* the section index's drawer sliding in and out (2026-11-02); no quiz card moves since the quiz became plain text (2026-10-19) */
}
```

### Hero choreography (constants live in `src/config/hero.ts` and `params.ts`; full tables in `docs/specs/hero-architecture.md` section 5.5)

| Moment | Duration or rate | Curve |
|---|---|---|
| Loader light band | every 1.6 s after 0.2 s, runs 0.7 s | measured from ciao frame by frame |
| Loader fill | from 1.64 s to 4.96 s at full progress; held at real progress; twice the pace to catch up | measured table |
| Loader exit | dim 1.24 s, outline 0.24 s, percent fade 400 ms after 300 ms, lift 600 ms; 8.2 s first paint to hero on a fast load | `--ease-in` |
| Loader slow text | after 4 s without progress | |
| Loader on a return visit | as the first visit's; the exit also waits for the island's `ready()` once the gems are built; 8.2 s to the gems on a fast load | `--ease-in` |
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

Tokens in `src/styles/family.css`; the script twins in `src/scripts/family/timing.ts` (a unit test keeps them equal). No GSAP on these pages: CSS transitions, the Web Animations API and the lineup's own loop, which also draws the case-type takeover as a function of the stage's own scroll (round 6, `src/scripts/family/three/takeover.ts`; its constants in `src/config/takeover.ts`, each beside its measured value).

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
| The cue's words (docs/specs/family-page.md 25, docs/specs/scroll-cue.md, E-cue-text) | the first screen's with the side columns at the top; both again 1.5 s after the scroll position last changed (`CUE_STILL_MS` in timing.ts, equal to the landing's `CUE.stillMs`; one timer, `html[data-still]`); in, opacity 0 to 1 over 0.5 s at once; out, 1 to 0 over 0.5 s, then hidden | `cubic-bezier(0.333, 0, 0.667, 1)` (the columns') |
| Between family pages and back to `/` | the browser's cross-document view transition (root cross-fade) | browser default |
| The case-type hand-over's takeover (round 6, family-page.md 24, E-F6) | over the turn's second half, from the edge-on frame (2.85, 3.85 and 4.85 screens) to the beat's rest 0.15 screens later, the incoming case takes the outgoing one over in a sweep from the screen's right to its left, its progress the stage's own scroll (Sam, 2026-11-03: with the rotation, not after it); the boundary runs from -0.12 to 1.12 of the case's width on the screen, roughened by two layers of value-noise fBm (2.4 and 8 per unit of the case's height) and lined with an icy band 0.03 wide either side with a bump relief, every pixel showing one case; the half turn plays under it; scrolled up it plays back, left to right | an in-out cubic of the scroll's share, 4t^3 below a half and 1 - (2 - 2t)^3 / 2 above |

Reduced motion: swatch grid mode by default (no island; `REDUCED_MOTION_TIER`), every DOM move instant, the view transition off; under `still3d` the lineup jumps, with no entrance, tilt or turn, and "Back to main page" is shown at full opacity at 2.5 s and hidden at once. The cue's words, turned on after load, show and hide at once, and the case type changes in one frame at the edge-on frame with no sweep and no band (round 6).

### Section 3, the quiz (`src/scripts/quiz/decode.ts` and `deck.ts`; E-S3-motion)

Section 2's label animation on the quiz's text (`src/scripts/hero/section2/labels.ts`; `tests/unit/quiz-decode.test.ts` keeps the constants and the roll equal). No library: the decode sets each glyph's opacity on `requestAnimationFrame` and, while a glyph rolls, swaps its character (one Plex Mono glyph for another of the same width, so no line changes width; in the result's proportional faces, since 2026-11-02, the rolled glyph is drawn over the face's own, which keeps its place), and the swatches fade by the Web Animations API. No transforms on the text: nothing in the quiz's text moves. Since 2026-10-20 the answer pictures (`src/scripts/quiz/picture.ts`) take the same decode on twelve strips of a photograph, whose layer settles in scale, the section's one transform. CHECKLIST C3's "transform/opacity only" holds for the text's movement, and the character swap is part of E-S3-motion, as section 2's labels swap theirs. In the pictures each strip's slice is a `background-position`, outside C3, and the scale a transform, inside C3 but outside E-S3-motion's "no transform" as Sam approved it; built at his request on 2026-10-20, both wait for his confirmation (`docs/specs/quiz.md` section 10, item 17).

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
| Result ground, paint and chips | opacity 0 to 1, 400 ms (the ground out over 200 ms at Try again; 200 ms under reduced motion) | linear |
| "Not quite? Try again" | the page scrolls back to the section's top | the browser's smooth scroll |
| "Skip quiz" (the quiz gate, E-QG-ride; `docs/specs/quiz-gate.md` 4) | section 4 opens in place (nothing moves), then one frame later the page rides from where it is to section 4's q 1, scene 1 fully in (its top on the poster tier), over 1.2 s, one instant `scrollTo` a frame, the target clamped to the page's range each frame; on the 3D path the ride first waits for the scenes (scene 1 and products.bin), at most 1.5 s, the words reading "Loading..." meanwhile; ended at once by any wheel, touch or key from 350 ms after the press, or by a scroll it did not write; at the landing focus moves to the section's pad (scene 1's name on the poster tier) after a keyboard press, and the destination's name is announced once after a pointer press | `--ease-standard` |

### Section 4, the five scenes (`src/scripts/hero/section4/`, `src/scripts/room/walk.ts`; E-S4-motion and E-S4-loops pending)

No library. The island's own loop drives the shaders and the carousel: the third wipe from the fog by the section's own scroll and the arrival's hold (`director.ts`), one tween per step and one cloud per seam (`carousel.ts`); `scroll.ts` settles the glue; section 3's decode moves the text; the Web Animations API runs the poster tier's fade. Everything in the DOM changes by opacity only, the decode swapping characters as E-S3-motion does. The constants live in `config/room.ts` (`ROOM_PARAMS` and Tune's `ROOM_RANGES`), `director.ts` (`HOLD`), `carousel-math.ts` (`STEP`, `LIGHT`), `scroll-math.ts` (`GLUE`, `BURST`, `TOUCH`) and `video.ts` (`VIDEO`). The hall's walk, door, prompt, Skip, bubble and way back left on 2026-11-02 (`docs/specs/section-4-no-hall.md`).

| Moment | Duration or rate | Curve |
|---|---|---|
| The third wipe (q 0 to 1) | the section's own scroll: the quiz's fog cut away to scene 1 by the composite's ice-shard wipe, the same as section 1's to section 2 (Tune `handoff` 1 a cut at half, 2 a fade); if scene 1 becomes drawable with the section on screen, the wipe plays in over 1 s on its own clock | the scroll followers |
| Arrival at scene 1 (q 1) | once scene 1 can be drawn; always at scene 1: a page carried past it by its own scroll is put back on it and held there until 150 ms without running past it, at most 1.2 s after its start or the carrying wheel's latest event (`HOLD`), ended by a touch, a press, a key or an upward wheel; a finger still down defers it to the release; the wheel input that carried the page in never steps, swallowed until 0.7 s of silence (`BURST.carriedMs`), and a forward wheel the page cannot cancel (a trackpad gesture the browser latched before the capture) never steps and holds the page on its scene while it comes | instant `scrollTo` |
| A scene's lines | decode in on arrival, one after another, 0.12 s apart; wipe out in 0.2 s at a step's start | the decode |
| Scene 1's hint | decodes in once the lines have settled, on the first visit; wipes out at the first step | the decode |
| A scene at rest | its loop plays (5 s, looping, while E-S4-loops is pending); the product turns after a mouse as it hovers (E-S4-hover) and after a pressed pointer or a finger, up to 0.3 rad, the last place held; no idle sway | the look smoothed by `1 - 0.9^(60 dt)` |
| A step (a wheel tick, a swipe of 12 px, a key, or a word) | `stepMs` 770 ms (Tune 400 to 1200): the leaving room swings out and the arriving one in on an arc of 80 degrees on laptops (`sweepDeg`, Tune 40 to 120) and 22 when the stage is taller than wide (`sweepDegPortrait`, Tune 12 to 80); the view pinches from 45 to 42 degrees by eased 0.65 and relaxes by the end; the front scene switches at eased 0.75 (285 ms); the product turns half a turn and is swapped edge-on at eased 0.5, its scale easing over 0.35 to 0.65; every gesture swallowed until 150 ms after; the page snapped to the scene's q at the end | power2.out, `1 - (1 - t)^3`; the pinch a cubic smoothstep |
| The lights over a step | each room's light-up follows its proximity: the leaving room stays lit until the step's half, then both change over its second half, the arriving room coming up from its brightest areas (threshold 0.5, softness 0.64, boost 0.17, floor 0.01; Tune `lightStart`, `lightSoft`, `lightBoost`), moving at 1 over 0.68 s a second, dt capped at 0.1 s. Mid-step most of the frame is dark (For Sam, item 13) | linear toward a smoothstep target |
| The key light | its tint cross-fades to the arriving scene's over `keyLightMs` 1100 ms from the front switch | cubic smoothstep |
| The loops over a step | a loop plays while its proximity is above 0.3 or falling, and is paused and reset to its first frame at 0.02 or less; at most two play | |
| A late loop | its still holds the plane, then cross-fades to the loop when it arrives | 300 ms, linear |
| The exit seam (the raw scroll crossing q 3.8 downward from the scenes) | the cloud covers the frame in 280 ms with the scroll held; under full cover the page jumps to scroll 0 and the section resets; the cloud thins over the hero's rest pose in 360 ms; every gesture swallowed for 400 ms more | in `1 - (1 - e)^2`; out linear to 0.78 over the first 120 ms, then a smoothstep |
| The wrap (with the intro over, a touch from scroll 0 moving 16 px down, or a wheel burst at scroll 0 after 200 ms of silence) | the cloud covers the hero in 280 ms (after a wait of at most 1.5 s if its pass is not compiled); under full cover the page is set to scene 5, held until dawn's still is in (at most 1.5 s); the cloud thins over dawn in 360 ms; the 400 ms lock | as the exit |
| A backward gesture at scene 1 | the page's own scroll, up through the third wipe into the quiz; the scene's lines and the words wipe out once the page is above scene 1 | the browser's |
| The glue (a scroll the visitor started stopping inside one of the page's three seam spans) | after 150 ms still with no finger or button down, the page settles to the nearer end of the span over 0.5 s (`snapMs`, Tune 200 to 900), once per run, cancelled by any input | `--ease-standard` |
| The scrollbar | in the scenes' range the scene follows the page's position at once, with no tween (a move from above the scenes lands on scene 1, the arrival's hold); above them, scene 1 at once under the wipe | |
| Poster tier: the loop | a `--night` veil in, the jump to the top, the veil out | 300 ms each, linear |

### Reduced motion

- **Hero.** It renders the poster: no loader, no canvas. The scene, when Sam picks the `still3d` option, reads the setting once at start.
- **Cue.** It holds still. Its words fade in and out with it (docs/specs/scroll-cue.md).
- **Countdown.** It hides the seconds.
- **Glitch.** Off. It reads the setting live before every burst, so turning it on after load stops new bursts.
- **Smooth scroll** becomes instant.
- **Option.** Sam may choose the prototype's still-3D variant instead (`REDUCED_MOTION_TIER`).
- **Quiz.** The decode is a 0.2 s fade with no roll; an answer picture fades in or out over 0.2 s with no roll and no scale; the answer taken does not hold, a finger's answer on a visual question included; the guard on a new question is 150 ms; the swatches fade in over 200 ms; "Not quite? Try again" scrolls back at once; "Skip quiz" rides in one instant jump to its target a frame after the press (`docs/specs/quiz-gate.md` 4).
- **Section 4.** Reduced motion sends the visitor to the poster tier by default (`REDUCED_MOTION_TIER` `poster`): the column of the five scenes at once, no video, no carousel, no glue; the loop the 300 ms fade through `--night`. Under `still3d` (a test and Tune tier) the island reads the setting once at boot: the third wipe by the scroll with no late reveal clock, the arrival at once, no video (each plane its still), a step a cut with a 300 ms cross-fade between the two stills (the field of view and the lights untouched, the product swapped and the key light set at once), no look; the seams, the wrap, the hold and the glue instant, the cloud's time held at 0. The text fades over 0.2 s with no roll; the decode reads the setting live.
- **Later sections** wrap all GSAP in `gsap.matchMedia()`, and `src/scripts/motion.ts` stays the one source of the flag.
