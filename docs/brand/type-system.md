# Skreed site type system

Decided 2026-10-05 from five verified proposals and three judges' rankings. Winner: "Poster and Letter" (Poppins 700 / Source Serif 4 / Open Sans) with the grafts the judges agreed on. Every number in this file was measured in this repo's sandbox with fontTools 4.66.1 on the google/fonts source files. Where a number is a starting value that the build must regenerate, it says so.

Read with `docs/brand/brand-guidelines-extract.md` (the guide) and `CLAUDE.md` rules 4, 18, 19, 24 and 30, which are rewritten before the first build (see "Before the first build"). The specimen Sam can look at is `docs/brand/type-specimen.html`; it loads the four shipped files from `docs/brand/fonts/` through the same `@font-face` rules as the site, so what it shows is what ships.

## Decision

| Family | Job | Weights on the site | Where it appears | Where it never appears |
|---|---|---|---|---|
| Poppins | The voice. Headlines and the moments that are headlines in disguise. | 700 only, sentence case | Hero headline, eight section headlines, manifesto words, quiz question, enlarged tile shade name, "You are #212", share-card shade name, 404 headline, legal page titles and clause headings | Any live number, any label, any line under 24 px, any weight but 700 |
| Source Serif 4 | The letter. The face Skreed speaks first person in. | 400 (variable, optical size 8 to 60) and 600 (static, optical size 20), roman only | Hero sub-line, standfirsts, founders' note, Diwali story lines, confirmation sentence, 404 sentence, share-card caption | Headlines, controls, labels, tables, counters, legal pages, anything above 28 px in the DOM, anything under 17 px, italic |
| Open Sans | The fittings and the documentation face. | 400 to 600 (one variable file) | Form labels, inputs, validation, buttons, family names, tile captions, every live numeral, countdown, eyebrow, footer, privacy and terms prose, share-card footer | Headlines, first-person prose |

Three families. Four self-hosted files. 97.9 KB measured. No italic of any face is shipped, and `font-synthesis: none` makes sure none is faked.

**The one departure from the brand guide, and why.** The guide names Open Sans as the body face. It keeps that role here for everything that is documentation: privacy, terms, labels, footer. The serif takes only the moments where the brand writes in the first person ("We believe in the power of color", the founders' note, the five Diwali stories, the hero sub-line and the standfirsts). A transitional text serif reads as a person writing to you; a sans at the same size reads as a landing page. Those are the only places a second visible face earns its payload, and they are the places Sam looks at when he says one face is boring. Three neutral sans faces, a width axis or a mono caption are differences a typographer sees and a founder does not; a serif under a bold geometric is a difference everyone sees at 390 px. This needs Sam's written yes (open question 1).

## Why this pairing

Principles, named, each with the measurement behind it.

1. **Contrast of classification.** Geometric sans (Poppins, Indian Type Foundry, 2014), transitional text serif (Source Serif by Frank Griesshammer for Adobe, 2014, version 4 in 2021), humanist sans (Open Sans, Steve Matteson, 2011). Three different skeletons, so no two faces can be mistaken for a wrong version of each other. The rejected proposals paired Poppins with a second or third neutral sans (Hanken Grotesk, Mona Sans) or a monospace (Red Hat Mono, Sono); at text sizes those read as one grey sans with inconsistencies, or as a code comment under the headline.
2. **Shared cap line, size-compensated x-height.** Cap heights are 0.705 / 0.670 / 0.714 em, one band, so a Poppins headline, a serif sub-line and an Open Sans label align in a lockup. x-heights are 0.558 / 0.475 / 0.535 em, so the serif is set one pixel larger than the sans it sits beside (17 px prose against 16 px legal prose) and never below 17 px.
3. **Role clarity.** One job per family, one family per job. "Anything that ticks is Open Sans" is enforced by one token: `--font-num` is an alias of `--font-ui`, and the review skill greps for digits inside h1, h2 and the manifesto. One allowlisted exception: `.h404`, the 404 headline, which carries the static "404" on purpose (role 16). `.position` ("You are #212") is not an h1 and is not grepped.
4. **Family limit.** Three families, four files, roman only, one weight of Poppins. Adding Poppins 500 for sub-lines or a serif italic would collapse the roles; the file list is the guard, because a weight that is not shipped cannot be used by accident.
5. **Harmony of era and mood.** All three are screen-first open-source releases from the last fifteen years: warm, open-apertured, un-nostalgic. Nothing Didone, nothing grotesk-cold, nothing dev-tool.
6. **Legibility at size.** Open Sans carries every string under 17 px because it has the highest x-height of the three and the best small-size hinting. The serif engages its 8 to 20 optical master below 20 px (sturdier hairlines, looser fit). Inputs stay at 16 px so iOS never zooms. Nothing on the site is under 12 px.
7. **Distinctiveness against the AI-default set.** None of the faces listed under "What is banned and why" appears, and no name from that list appears in any shipped file, so a grep guard for them passes. Two guards keep Poppins plus a serif from drifting toward the Canva "Poppins plus Playfair" look: the serif is never a headline, never above 28 px in the DOM and never italic; Poppins is never a live number and never a label.
8. **Numeral handling.** Open Sans's ten digits share one advance (1171 of 2048 units, measured on the shipped file) and the build keeps `tnum` and `pnum`, so counters never jitter and no mono is needed. Poppins has proportional digits only (376 to 677 units, no `tnum`), so it carries only static numbers ("#212", "404"). Source Serif 4 defaults to tabular (one advance per file: 500 units in the 400 file, 520 in the 600 opsz-20 file), so prose declares `proportional-nums`.
9. **Two families per phone screen.** Hero, manifesto and founders' note: Poppins plus serif, with Open Sans only on the button. Wall, quiz and reserve form: Poppins plus Open Sans, no serif. Legal pages: Poppins titles plus Open Sans prose. The three faces meet on one screen only in the hero (headline, sub-line, button), which is where the system is taught.
10. **Palette discipline.** Type is Urban Slate on Pearl Whisper or Pearl Whisper on Urban Slate (9.9:1 measured). Button text is Urban Slate on Ember Luxe (5.0:1, AA at 16 px 600). The 240 shades touch type nowhere unless Sam signs the manifesto exception (open question 2). No invented greys: the eyebrow is full-strength Urban Slate de-emphasised by size, and the only derived neutral is `--skeleton`.

## Roles

Phone is 390 px and every size also holds at 360 px. Laptop is 1280 px. Every size is a token from the next section; the px pair is what the clamp resolves to.

| # | Role | Family | Weight | Phone | Laptop | Leading | Tracking | Case | Numerals |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Hero headline "Go beyond basic." | Poppins | 700 | 36 px | 80 px | 1.0 | -0.015em | Sentence | none |
| 2 | Hero sub-line "240 shades. One of them is yours." | Source Serif 4 | 400, opsz auto | 20 px | 28 px | 1.3 | 0 | Sentence | proportional lining |
| 3 | Section headlines (8) | Poppins | 700 | 32 px | 56 px | 1.05 | -0.015em | Sentence | none |
| 4 | Standfirsts and sub-headlines | Source Serif 4 | 400 on Pearl Whisper, 600 on Urban Slate | 19 px | 26 px | 1.35 | 0 | Sentence | proportional lining |
| 5a | First-person prose: founders' note, Diwali stories, confirmation sentence | Source Serif 4 | 400, strong 600 | 17 px | 18 px | 1.45 | 0 | Sentence | proportional lining |
| 5b | Documentation prose: privacy, terms | Open Sans | 400, defined terms 600 | 16 px | 17 px | 1.45 | 0 | Sentence | tabular for dates and amounts |
| 6 | Form labels / inputs / validation | Open Sans | 600 / 400 / 400 with a 600 lead word | 14 / 16 / 14 px | same | 1.4 / 1.3 / 1.4 | 0 | Sentence | tabular on the tel input |
| 7 | Buttons "Reserve my shade" | Open Sans | 600 | 16 px | 16 px | 1 | 0 | Sentence | none |
| 8 | Shade names: phone tile / laptop tile caption / caption line / enlarged tile | swatch only / Open Sans / Open Sans / Poppins | none / 400 / 400 / 700 | none / hidden / 14 px / 28 px | none / 13 px / 14 px / 36 px | 1.2 / 1.4 / 1.05 | 0 / 0 / -0.01em | As in shades-240.json | none |
| 9 | Family names (10) | Open Sans | 400, 600 when selected | 14 px | 15 px | 1.3 | 0 | Title case as the data spells it | index "07 / 24" tabular |
| 10a | Live counters "1,204 reserved" | Open Sans | 600, unit word 400 | 16 px | 18 px | 1.2 | 0 | n/a | tabular lining |
| 10b | Countdown "34 : 11 : 09 : 58" | Open Sans | 600 | 32 px | 48 px | 1.0 | 0 | n/a | tabular lining |
| 10c | Position "You are #212" | Poppins | 700 | 40 px | 64 px | 1.0 | -0.01em | Sentence | proportional, rendered once |
| 11 | Eyebrow and section index "01 / 08  The Wall" | Open Sans | 600 | 12 px | 13 px | 1.2 | 0.02em on the digits, 0 on the word | Sentence | tabular |
| 12 | Manifesto "Smart. Sleek. Skreed." | Poppins | 700 | 56 px | 128 px | 1.0 | -0.02em | Sentence, one word per line | none |
| 13 | Quiz question "Beige or Rouge?" | Poppins | 700 | 28 px | 40 px | 1.1 | -0.01em | Sentence; shade names keep catalog case | progress "3 of 6" in role 11 |
| 14 | Share card, canvas px at 1080 x 1920 | Poppins / Source Serif 4 / Open Sans | 700 / 600 / 600 | 136 / 64 / 40 px | same | 1.0 / 1.2 / 1.2 | -0.02em / 0 / 0 | Sentence | "#212" tabular |
| 15 | Footer and legal small text | Open Sans | 400, links 600 | 13 px | 14 px | 1.5 | 0 | Sentence | tabular for the Nov 4 date |
| 16 | 404 "This shade does not exist." | Poppins / Source Serif 4 / Open Sans | 700 / 400 / 600 | 40 / 17 / 16 px | 72 / 18 / 16 px | 1.0 / 1.45 / 1 | -0.015em / 0 / 0 | Sentence | "404" inside the headline, proportional |

Role notes, the things a table cannot hold.

1. **Hero.** One face and one weight through the splitter swap from "Basic." to "Beyond basic.". Measured on the shipped file with kerning: "Go beyond basic." at 36 px with -0.015em is 310 px, against 328 px available at 360 px and 358 px at 390 px, so it holds one line on every Indian phone width and the swap never changes line count. At 40 px it is 345 px and wraps at 360 px; that is why the floor is 36. Leading is 1.0 and not 0.95 because Poppins 700's ink span is 1.005 em (b top at 0.740, y bottom at 0.265), so a two-line headline at 0.95 would collide.
2. **Hero sub-line.** `font-optical-sizing: auto` picks opsz 20 to 28, slightly higher contrast than prose. Measure 22ch, so the line breaks after the first full stop at every width ("240 shades." over "One of them is yours."); the whole sentence is 297 px at 20 px and 416 px at 28 px, and a 28ch measure was tested on the specimen and breaks it mid-sentence. `proportional-nums` is declared because the font defaults to tabular.
3. **Section headlines.** Two to five words, max 18ch, `text-wrap: balance`. Never a digit.
4. **Standfirsts.** Two sentences at most, max-width 34rem. Reversed on Urban Slate (Diwali stories, manifesto standfirst) the serif sets in the static 600 because 400 hairlines thin under irradiation on a dark ground.
5. **Prose.** Founders' note at 17 px on phone and 18 on laptop, measure 34rem, paragraph gap from the spacing token, no indent. `<strong>` and `<em>` both map to the serif 600; never a sans word inside a serif sentence, never an italic. Legal pages use Open Sans at 16 to 17 px with Poppins 700 page titles at the h2 token and clause headings at `--fs-clause` (24 to 28 px).
6. **Forms.** Labels 600 at 14 px with tracking 0, which is the guide's "600 for buttons and labels"; the form never shares a screen with serif prose, so nothing is out-shouted. Inputs 400 at 16 px on every breakpoint. Validation 400 at 14 px with the lead word in 600 ("Needs ten digits. You typed nine."), state carried by the field border (1 px to 2 px Urban Slate) and the words, never a colour from the shades. The +91 prefix is 400 tabular.
7. **Buttons.** Fixed 16 px, min height 48 px, padding from the spacing scale. Primary: Ember Luxe fill, Urban Slate text (5.0:1), and the text colour is the literal hex, not the page foreground token, because Pearl Whisper on Ember Luxe is 2.0:1. Hover `translateY(-1px)`, press `scale(0.98)`, both `cubic-bezier(0.2, 0, 0, 1)` over 150 ms; no opacity change and no darker orange until the Ember ramp hex comes from the full deck. Focus ring 2 px Ember Luxe, offset 2 px.
8. **Wall.** At 390 px with 16 px gutters and 8 px gaps a 6-column tile is 53 px; "Aquamarine" in Open Sans at 13 px is 75 px and 79 of the 240 names are longer than 7 characters, so phone tiles are swatch-only with `aria-label="Mauve, Vivid Violets, 3 of 24"`. On tap the name appears in one caption line under the grid (Open Sans 400, 14 px) and on the enlarged tile in Poppins 700 with the family in Open Sans 400 under it, so the tile never stacks two bolds. Laptop tiles (80 to 96 px) may carry a 13 px Open Sans 400 caption; "Classic Violet" and "Dark Chocolate" wrap to two lines there, which is acceptable. Names are Urban Slate or Pearl Whisper by swatch luminance, never the shade.
9. **Family names.** The data's title case ("Go Green", "Roaring Reds"), never all caps even though the catalog prints them in caps. The longest is "Blushing Corals".
10. **Numerals.** Everything that ticks is Open Sans 600 with `font-variant-numeric: tabular-nums` through `--font-num`. Each counter sits on a same-box skeleton holding the same character count ("0,000", "34 : 11 : 09 : 58") in `--skeleton` until Supabase answers, so the swap moves nothing (rule 41). Counters show only real counts and only once a shade passes 10. "You are #212" is a Poppins headline because it renders once; proportional digits are fine there. The confirmation sentence ("Mauve is yours. First dibs Nov 4.", Source Serif 4 400 at `--fs-prose`) loads on a two-line `--skeleton` block sized to `2 * --fs-prose * --lh-prose` with the 34rem measure, so the sentence replaces the block without a shift (rule 41). Error, offline, slow-network and permission-denied messages use the validation style: Open Sans 400 at 14 px with a 600 lead word, state carried by the words and the field border, never a colour from the shades. One shared sentence pattern: "Could not reach the server. Try again." (offline: "You are offline. Try again when you are back."; permission: "Sharing is blocked on this phone. Save the card instead.").
11. **Eyebrow.** Plain text in the gutter, aligned to the headline's left edge, full-strength Urban Slate (or Pearl Whisper on charcoal). Never a pill, never a border, never above the hero h1 (rule 9). Tracking 0.02em on the two digits only; lowercase is never tracked.
12. **Manifesto.** SplitText by word, one word per line; the words are 189 / 165 / 209 px wide at 56 px, so the phone column holds them. The per-word family-colour fill in the spine conflicts with CLAUDE.md rule 24 as written. Rule-compliant default until Sam decides: each word fills from `--skeleton` to full Urban Slate (or Pearl Whisper on charcoal) with a real circle swatch of that family beside it. shades-240.json has no family-level hex, so the swatch is index 12 of the family (Royal, Orchid, Tangerine and so on). If Sam says yes, the fill is a flat `color` on the word, no `background-clip`, no gradient, and reduced motion renders the word already filled. Otherwise reduced motion renders the words at rest in slate.
13. **Quiz.** Both shade names in the question are the same face and weight, one face per headline. The two halves of the card are the swatches themselves; the labels under them are Open Sans 400 at 14 px in the page colour, not on the swatch, because Urban Slate on Rouge is 3.3:1.
14. **Share card.** The canvas is 1080 x 1920 and displays at about 360 x 640 CSS px, so 64 canvas px is about 21 px on screen and the serif's opsz 20 static 600 is the right optical master; no separate opsz 60 file is needed. The shade name starts at 136 px: "Aquamarine" is 862 px and "Classic Violet" 909 px inside the 920 px safe box, "Dark Chocolate" is 1049 px, so the 8 px `measureText` shrink loop is expected to fire for the widest names (it lands at 112 px). Family and "skreed.in" in Open Sans 600 at 40 px, "#212" tabular. Almond Silk, Steel Twilight and Rust Ember are allowed here only.
15. **Footer.** On Urban Slate in Pearl Whisper, the four link labels at 600. Nothing on the site is under 12 px.
16. **404.** "This shade does not exist." is 510 px at 40 px, so two lines on phone and one on laptop; "404" sits inside the headline line, not as a decorative numeral. One serif sentence, one Open Sans button back to the Wall, one real swatch from the data (the hero shade, or a fixed one such as Mauve), no illustration (rule 38). The page sets the headline in `.h404`, the one selector principle 3 allowlists for a digit.

## Fluid scale tokens

All on `:root`. Fluid sizes interpolate between 390 px and 1280 px and clamp outside that range; generated by the formula `slope = (max - min) / 890`, `intercept = min - slope * 390`, not typed by hand.

```css
:root {
  /* families: voice, letter, fittings; anything that ticks uses the fittings face */
  --font-display: "Poppins", "Poppins Fallback", Arial, sans-serif;
  --font-text: "Source Serif 4", "Source Serif 4 Fallback", "Times New Roman", serif;
  --font-ui: "Open Sans", "Open Sans Fallback", Arial, sans-serif;
  --font-num: var(--font-ui);

  /* weights: one per job */
  --w-display: 700; --w-text: 400; --w-text-strong: 600; --w-ui: 400; --w-ui-strong: 600;

  /* fluid sizes, 390 to 1280 px */
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

  /* fixed sizes */
  --fs-label: 0.875rem; --fs-input: 1rem; --fs-button: 1rem; --fs-caption: 0.875rem; --fs-tile-caption: 0.8125rem;

  /* leading: larger type tighter */
  --lh-display: 1; --lh-h2: 1.05; --lh-tile: 1.05; --lh-quiz: 1.1; --lh-sub: 1.3; --lh-standfirst: 1.35;
  --lh-prose: 1.45; --lh-ui: 1.4; --lh-input: 1.3; --lh-small: 1.5; --lh-solid: 1;

  /* tracking */
  --ls-hero: -0.015em; --ls-h2: -0.015em; --ls-manifesto: -0.02em; --ls-tile: -0.01em; --ls-quiz: -0.01em; --ls-digits: 0.02em;

  /* measure */
  --measure-prose: 34rem; --measure-sub: 22ch; --measure-h2: 18ch;

  /* colour: the two neutrals, the one accent, one derived neutral */
  --pearl-whisper: #F7F6F3; --urban-slate: #383F43; --ember-luxe: #FF9900;
  --skeleton: color-mix(in srgb, var(--urban-slate) 12%, var(--pearl-whisper));
  /* share card and stories only, never UI chrome */
  --almond-silk: #E9D9CA; --steel-twilight: #577095; --rust-ember: #CD754E;
}
html { font-synthesis: none; -webkit-text-size-adjust: 100%; }
```

The element rules follow from the tokens and have this shape:

```css
h1, h2, .manifesto, .quiz-q, .tile-name, .position, .h404 { font-family: var(--font-display); font-weight: 700; text-transform: none; }
.hero-sub, .standfirst, .prose { font-family: var(--font-text); font-weight: 400; font-optical-sizing: auto; font-variant-numeric: proportional-nums; }
.prose strong, .prose em, .on-slate .standfirst, .on-slate .prose { font-weight: 600; font-style: normal; }
body, label, input, button, .legal, .caption, .family, .footer { font-family: var(--font-ui); font-weight: 400; }
button, label, .footer a { font-weight: 600; }
.counter, .countdown, .eyebrow, .idx, input[type="tel"] { font-family: var(--font-num); font-weight: 600; font-variant-numeric: tabular-nums; }
```

Every rule that uses a variable file declares `font-weight`, because a missing weight on a variable face renders at the file's default axis position.

## Loading

### Files

Built from the google/fonts source TTFs with fontTools 4.66.1: `instancer` first (pin or restrict axes), then `pyftsubset --flavor=woff2 --no-hinting --desubroutinize --layout-features=kern,liga,locl,ccmp,mark,mkmk,tnum,pnum,lnum,calt,case` with Google's Latin unicode range (`U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`). The feature list matters twice: keeping every GSUB feature inflates Source Serif 4 to about 76 KB, and pyftsubset's default set drops `tnum` and `pnum`. The build script is `scripts/fonts/build.py`: it fetches the three source TTFs from google/fonts at commit `9710da1eacb3be272583c3224dcb70f9da6eadbb` (refs/heads/main on 2026-10-05), checks their sha256, builds with `recalcTimestamp=False` so two runs give identical bytes, writes the four files to `public/fonts/` (served at `/fonts/`) and a byte-identical copy to `docs/brand/fonts/` (for the specimen), and prints the byte table, metrics and fallback overrides into `scripts/fonts/manifest.txt`, which the review skill diffs. `python3 scripts/fonts/build.py` from the repo root, fontTools 4.66.

| File | Source | Instancing | Bytes | KB |
|---|---|---|---|---|
| `poppins-700-latin.woff2` | ofl/poppins/Poppins-Bold.ttf | static | 8,000 | 8.0 |
| `open-sans-400-600-latin.woff2` | ofl/opensans/OpenSans[wdth,wght].ttf | wdth pinned 100, wght 400..600 kept | 19,712 | 19.7 |
| `source-serif-4-400-opsz-latin.woff2` | ofl/sourceserif4/SourceSerif4[opsz,wght].ttf | wght pinned 400, opsz 8..60 kept | 48,932 | 48.9 |
| `source-serif-4-600-opsz20-latin.woff2` | same | wght 600, opsz 20, static | 21,252 | 21.3 |
| Total | | | 97,896 | 97.9 (95.6 KiB) |

The cap is 120 KB. Nothing else is loaded: no italic, no Poppins Devanagari, no fifth file for the share card. Glyph counts after subsetting: 223, 260, 323, 323.

### @font-face

```css
@font-face { font-family: "Poppins"; font-weight: 700; font-style: normal; font-display: swap;
  src: url(/fonts/poppins-700-latin.woff2) format("woff2"); unicode-range: /* the Latin range above */; }
@font-face { font-family: "Open Sans"; font-weight: 400 600; font-style: normal; font-display: swap;
  src: url(/fonts/open-sans-400-600-latin.woff2) format("woff2") tech("variations"),
       url(/fonts/open-sans-400-600-latin.woff2) format("woff2"); unicode-range: /* same */; }
@font-face { font-family: "Source Serif 4"; font-weight: 400; font-style: normal; font-display: swap;
  src: url(/fonts/source-serif-4-400-opsz-latin.woff2) format("woff2") tech("variations"),
       url(/fonts/source-serif-4-400-opsz-latin.woff2) format("woff2"); unicode-range: /* same */; }
@font-face { font-family: "Source Serif 4"; font-weight: 600; font-style: normal; font-display: swap;
  src: url(/fonts/source-serif-4-600-opsz20-latin.woff2) format("woff2"); unicode-range: /* same */; }
```

Never `format("woff2-variations")`; the keyword is obsolete.

### Fallbacks

Metric-matched local fallbacks hold the box during the swap. CSS Fonts 5 scales every override by `size-adjust`, so each override is the font's own metric divided by the size-adjust. Measured here on the shipped files with the fontpie convention (typo metrics, since all four files set USE_TYPO_METRICS) and a width ratio taken on the site's own copy against the Liberation clones of Arial and Times New Roman:

| Fallback face | src | size-adjust | ascent-override | descent-override | line-gap-override |
|---|---|---|---|---|---|
| Poppins Fallback, 700 | local("Arial Bold"), local("Arial-BoldMT") | 106.70% | 98.41% | 32.80% | 9.37% |
| Open Sans Fallback, 400 | local("Arial"), local("ArialMT") | 104.30% | 102.47% | 28.09% | 0% |
| Open Sans Fallback, 600 | local("Arial Bold"), local("Arial-BoldMT") | 100.92% | 105.91% | 29.03% | 0% |
| Source Serif 4 Fallback, 400 | local("Times New Roman"), local("TimesNewRomanPSMT") | 110.69% | 93.59% | 30.26% | 0% |
| Source Serif 4 Fallback, 600 | local("Times New Roman Bold"), local("TimesNewRomanPS-BoldMT") | 106.14% | 97.61% | 31.56% | 0% |

As `@font-face` blocks, which ship in the site stylesheet and in the specimen:

```css
@font-face { font-family: "Poppins Fallback"; font-weight: 700; font-style: normal;
  src: local("Arial Bold"), local("Arial-BoldMT");
  size-adjust: 106.70%; ascent-override: 98.41%; descent-override: 32.80%; line-gap-override: 9.37%; }
@font-face { font-family: "Open Sans Fallback"; font-weight: 400; font-style: normal;
  src: local("Arial"), local("ArialMT");
  size-adjust: 104.30%; ascent-override: 102.47%; descent-override: 28.09%; line-gap-override: 0%; }
@font-face { font-family: "Open Sans Fallback"; font-weight: 600; font-style: normal;
  src: local("Arial Bold"), local("Arial-BoldMT");
  size-adjust: 100.92%; ascent-override: 105.91%; descent-override: 29.03%; line-gap-override: 0%; }
@font-face { font-family: "Source Serif 4 Fallback"; font-weight: 400; font-style: normal;
  src: local("Times New Roman"), local("TimesNewRomanPSMT");
  size-adjust: 110.69%; ascent-override: 93.59%; descent-override: 30.26%; line-gap-override: 0%; }
@font-face { font-family: "Source Serif 4 Fallback"; font-weight: 600; font-style: normal;
  src: local("Times New Roman Bold"), local("TimesNewRomanPS-BoldMT");
  size-adjust: 106.14%; ascent-override: 97.61%; descent-override: 31.56%; line-gap-override: 0%; }
```

`scripts/fonts/build.py` prints these five lines into `scripts/fonts/manifest.txt` on every run; DESIGN.md quotes that file, never these numbers by hand. Android has no Arial or Times, so every local() falls through to Roboto and Noto Serif without a size-adjust and a one-line shift on swap remains possible there. Day 2 re-measures against Roboto and decides whether to accept it.

### Preload

One preload, the hero face:

```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-700-latin.woff2">
```

Poppins is the LCP text and costs 8 KB. The serif and Open Sans are discovered from the stylesheet, swap in behind the matched fallbacks, and do not compete with the hero image (120 KB budget) for the first round trips on 4G. If the Lighthouse run on the hero section shows CLS from the serif swap, promote `source-serif-4-400-opsz-latin.woff2` to a second preload and re-measure; never preload the 600 serif.

### Share card, Canvas 2D at 1080 x 1920

The DOM and the canvas share one font cache because the card loads against the same `@font-face` rules; there is no second set of URLs. Draw only after every exact font string resolves:

```js
const faces = ['700 136px Poppins', '600 64px "Source Serif 4"', '600 40px "Open Sans"'];
await Promise.all(faces.map(f => document.fonts.load(f)));
if (!faces.every(f => document.fonts.check(f))) {
  // keep the skeleton card up, retry once, then draw with the fallback faces rather than never drawing
}
let size = 136;
const setName = () => {
  ctx.font = `700 ${size}px Poppins`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${-0.02 * size}px`; // the -0.02em of role 14; Chrome 99+, Safari 17.4+
};
setName();
while (ctx.measureText(shadeName).width > 920 && size > 88) { size -= 8; setName(); }
```

`ctx.font` carries no tracking, so the -0.02em comes from `ctx.letterSpacing`, set again after every size change because it is in px. On an older WebView without `letterSpacing` the name draws untracked, which is acceptable; the shrink loop still measures the untracked width, so the name still fits.

Canvas cannot set `font-optical-sizing` or `font-variation-settings`; every face the card uses is a static instance or a pinned weight, so `ctx.font` needs nothing else. If an older Android WebView resolves `600 40px "Open Sans"` to the 400 end of the variable file, the remedy is a static Open Sans 600 Latin file (about 12 KB) registered with `new FontFace` for the card only; test on the day-14 device matrix before adding it.

### Skeletons

`--skeleton` is the one derived neutral. Counter, countdown and position skeletons are the same element with the same character count and `color: transparent; background: var(--skeleton)`, square corners, so the live number replaces the placeholder without moving anything. The confirmation sentence skeleton is a two-line block at the prose size and measure (role note 10).

## Devanagari and Indian-language note

Only Poppins ships a Devanagari subset (google/fonts METADATA.pb: subsets devanagari, latin, latin-ext; primary script Deva). Open Sans and Source Serif 4 have none, and neither does Literata. The four Latin files here carry no Devanagari glyph.

The teaser is English only. If a Hindi line appears before Nov 4 it goes in a Poppins Devanagari subset (about 39 KB, a separate `@font-face` with `unicode-range: U+0900-097F` so Latin-only pages never fetch it) for headlines, and running Hindi text falls to the system Devanagari face (Noto Sans Devanagari on Android, Devanagari Sangam MN on iOS) through the same unicode-range mechanism, declared before any build touches copy. The rupee sign U+20B9 exists in the Poppins and Source Serif 4 source files but sits outside the Latin range, and is absent from Open Sans; the teaser shows no prices (rule 37), and any future price string adds U+20B9 to the Poppins subset explicitly.

## Licence

| Family | Licence | Copyright line in OFL.txt | Source | Checked from this sandbox |
|---|---|---|---|---|
| Poppins | SIL Open Font License 1.1 | Copyright 2020 The Poppins Project Authors (github.com/itfoundry/Poppins) | https://github.com/google/fonts/tree/main/ofl/poppins | OFL.txt 200; METADATA.pb license "OFL"; CSS API 200 for wght@700 |
| Source Serif 4 | SIL Open Font License 1.1 | Copyright 2014 The Source Serif 4 Project Authors (github.com/adobe-fonts/source-serif) | https://github.com/google/fonts/tree/main/ofl/sourceserif4 | OFL.txt 200; axes opsz 8..60 and wght 200..900; CSS API 200 for opsz,wght@8..60,400;8..60,600 |
| Open Sans | SIL Open Font License 1.1 | Copyright 2020 The Open Sans Project Authors (github.com/googlefonts/opensans) | https://github.com/google/fonts/tree/main/ofl/opensans | OFL.txt 200; axes wdth 75..100 and wght 300..800; CSS API 200 for wght@400..600 |
| Literata (pre-cleared alternate, not shipped) | SIL Open Font License 1.1 | TypeTogether | https://github.com/google/fonts/tree/main/ofl/literata | OFL.txt 200; axes opsz 7..72 and wght 200..900 |

The OFL permits self-hosting, subsetting and instancing for commercial use; a modified file keeps the licence notice and is never sold on its own. Neue Montreal, the catalog PDF's face, is not proposed: nothing in this system needs a sans doing the serif's job, and its commercial web licence is paid.

## What is banned and why

- **Inter.** Sam's decision, reaffirmed 2026-10-05: banned in every role, including the sub-headline slot the guide gave it. The slot is filled by Source Serif 4 400, a different classification, not a look-alike sans.
- **The campaign-only alternates** from the guide: Century Gothic, Aghita, Lato, Playfair, League Spartan, Montserrat. Theme creatives only, never on the site.
- **The AI-default list** (CLAUDE.md rules 18, 19, 30): Space Grotesk, Instrument Serif, Satoshi, Geist and Geist Mono, Manrope, DM Sans, Plus Jakarta Sans, Outfit, Urbanist, Montserrat, Lato, Playfair. These are the faces a template generator reaches for; one of them on the page makes the site read as built rather than designed.
- **Serif italic accents of any face.** No italic file is shipped and `font-synthesis: none` prevents a faux slant, so the "one italic word in the headline" cliche cannot occur even by accident. The serif here is upright, text-size, and never a headline.
- **Monospace in any role.** Open Sans's tabular digits already solve counter jitter; a mono eyebrow or counter is the 2023 launch-page signature and reads as console output beside a lifestyle headline.
- **A second or third neutral sans** beside Poppins and Open Sans (Hanken Grotesk, Mona Sans, Archivo, Schibsted Grotesk, Figtree, Red Hat Text, Nunito Sans, Work Sans): at text sizes they read as one grey sans with inconsistencies, which is the boredom Sam named.
- **Poppins in any weight but 700, or as a label or live number.** Only the 700 file exists, so this cannot happen silently.
- **Lora, Merriweather, Fraunces and Newsreader** as the serif: Lora drifts toward the Playfair mood, Merriweather reads as 2014 web, Fraunces is a trend face, and Newsreader's x-height (0.426 em) is too low for a phone.

## Before the first build

The review loop grades against these files, so they change before `/ship-section` runs:

- `CLAUDE.md`: the brand-facts typography line (line 11), rules 4, 18, 19 and 30, and setup items 3 and 6, to read "Poppins 700 headlines in sentence case; Source Serif 4 400 and 600 roman for first-person prose only (hero sub-line, standfirsts, founders' note, stories); Open Sans 400 to 600 for UI, numerals, legal prose and small text; the guide's sub-headline face stays banned; no italic of any face."
- `docs/brand/brand-guidelines-extract.md`: line 9 (the sub-headline row), line 16 (the file list and payload) and line 39 (the bullet that allowed the sub-headline face).
- `docs/00-IDEATION.md`: line 29 and the fonts row at line 78.
- `docs/CHECKLIST.md` A3, which still grades against "Urbanist, thin + black pairing" and would fail every build.
- `DESIGN.md` (day 2) takes its type tokens from the block above and its fallback metrics from the generated file, not from this document.

Verified on `docs/brand/type-specimen.html` in headless Chromium, served over HTTP from the repo so it loads `docs/brand/fonts/` through its own `@font-face` rules, at 360, 390 and 1280 px: every shipped face reports `loaded`, no request leaves the origin, no element is wider than the viewport, the hero is one line at 36 px (308 px rendered against 310 px estimated from the font tables), the countdown is 219 px at 32 px, and the three manifesto words fit the 358 px column with their swatches. `document.fonts.check()` is not evidence of loading because it returns true when no `@font-face` matches; the check reads each FontFace's `status`.

Playwright checks on the first hero build, at 360, 390 and 1280 px: "Go beyond basic." is one line at every width; Poppins and serif caps sit on one baseline at equal px; the founders' note holds its colour on a 1x Android screenshot. If the serif reads thin there, the one approved swap is Literata 400 and 600 with opsz 7..72 kept (x-height 0.507 em, cap 0.700 em, OFL, about 42 KB for the 400 file measured here) in the same tokens, body back to 16 px, nothing else changes.

## Open questions for Sam

1. **The serif.** Yes or no to Source Serif 4 taking the first-person reading moments (hero sub-line, standfirsts, founders' note, Diwali stories, confirmation sentence). This is the only departure from the brand guide. If no, the site collapses to Poppins 700 plus Open Sans (500 for sub-lines, 400 prose at 16 px), and no mono or third sans comes back.
2. **The manifesto fill.** The spine wants each word of "Smart. Sleek. Skreed." filled with a family colour; CLAUDE.md rule 24 says shades never colour headings. Yes writes the single exception into rule 24 (flat colour on the word, reduced motion renders it filled). No keeps the words in Urban Slate with a real circle swatch beside each. Needed before section 7 is built.
3. **The ramps.** The Urban Slate light-ramp and Ember Luxe dark-ramp hexes from the full guideline deck (shade set 3.3), so the button hover and the skeleton tint can be named tokens instead of a position change and a color-mix.
4. **The hero string.** "Go beyond basic." throughout, or the resolving "Basic." to "Beyond basic." from the spine. Both hold one line at 36 px; the tokens do not change.
5. **Hindi.** Confirmation that no Hindi copy appears before Nov 4. Only Poppins has a Devanagari subset, and it would be a separate 39 KB file.
6. **Royal and Midnight.** Vivid Violets 19 and 20 still share one hex in shades-240.json; the enlarged tile and the share card will show two names on one colour until the real Royal value arrives.
