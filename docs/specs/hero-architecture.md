# Hero on the real stack: architecture

Written 2026-10-09 by the architect step for `docs/specs/hero.md`. Revision 2 (same day) answers every critic finding against revision 1.

Binding: `CLAUDE.md`, `docs/CHECKLIST.md`, `docs/00-IDEATION.md`, `docs/brand/type-system.md`, `DESIGN.md`.

Sources:
- `prototypes/hero-v9/template.html` (v9.9). Line numbers below refer to this file.
- The four reader reports of 2026-10-09: the 3D inventory, the shell inventory, the stack facts, and the asset and bundle probe.
- The critics' measurements of 2026-10-09 (long tasks under SwiftShader, `.bin` compression under wrangler dev, `_headers` line limit, workerd date support, `node --test` on Node 22.22.0, Astro's `assetsInlineLimit`).
- Checks run by the architect on 2026-10-09: headless Chromium 141 WebGL context attributes; the `ground_h` delta coding and its sizes; the size of the 240 shade tokens; `node --test` with a glob on `.ts` files; exact package versions on npm.

The scratch work lives in `/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/`, written `SCR/` below. The scratchpad dies with the session, so build step 1 (section 17) copies everything the build needs into the repo before anything else.

## 1. Purpose and principles

1. **Parity first.** The port reproduces v9.9 exactly where the prototype is deterministic. Every shader string, constant, start-up step and per-frame step keeps its order (sections 5.3 and 5.4). Improvements that change pixels or timing are listed separately and each is gated by a pixel diff.
2. **Two stages** (spec D7):
   - **Stage 1** uses the prototype's asset files byte for byte and must give identical frames. It is a test build only and is never deployed: its first view is about 2.6 MB.
   - **Stage 2** swaps in the measured encodes, the sky crops, the packed binaries and the posters, under the shipping thresholds. It is the first deployable build.
3. **Poster first.** A raster poster is the LCP element and the fallback for every tier and failure. The WebGL island loads behind it, only when the device and the user's settings allow.
4. **Clean slots.** The igloo intro (v10), section 2 (the rocks) and section 3 (the Wall) plug into typed interfaces. None of them is ported here.
5. **Nothing dev-only ships.** Tune and the test hooks exist only in dev, test and staging builds.

## 2. Versions (exact pins)

| Package | Version | Why |
|---|---|---|
| `astro` | 7.3.8 | stack decision; needs Node 22.12 or later (environment has 22.22.0); bundles Vite 8 |
| `three` | 0.165.0 | parity with the prototype (section 9) |
| `@types/three` (dev) | 0.165.0 | types matching the pinned three |
| `typescript` (dev) | 5.9.3 | last 5.x on npm (checked 2026-10-09); supports `erasableSyntaxOnly`, so `node --test` runs the `.ts` unit tests directly. 7.0.2 is the native compiler and is not adopted here. |
| `@astrojs/check` (dev) | 0.9.10 | `astro check` for `.astro` files; its peer is TypeScript 5 or 6. If it does not run against Astro 7.3.8 at scaffold, it is dropped and `tsc --noEmit` covers the `.ts` files (recorded in the review). |
| `wrangler` (dev) | 4.149.0 | Workers + Static Assets, `_headers`, `wrangler dev` for local header tests |
| `@playwright/test` (dev) | 1.56.1 | matches the Chromium build already in `/opt/pw-browsers` (chromium-1194, Chromium 141.0.7390.37) |
| `lighthouse` (dev) | 13.5.0 | C4 |
| Python tools (scripts only) | Pillow 12.3.0 (libavif 1.4.2, libwebp 1.6.0), numpy | the texture and poster encodes and the image compare; the same encoder versions produced the measured sizes |

Not installed for this section:
- `gsap` 3.15.0 and `lenis` 1.3.26: the hero uses neither (spec D6). They arrive with section 3.
- `@astrojs/cloudflare` 14.3.4: even for a static site it adds a SESSION KV binding and an IMAGES binding that need provisioning on Sam's account. An assets-only Worker serves `dist/` directly. The adapter, or a hand-written Worker, is added with `/api/*` in the Reserve section.
- `@astrojs/sitemap` 3.7.4: arrives with the site-essentials pass (G8).

Every version is exact in `package.json`, with no caret (security checklist row 18).

## 3. Repository layout

```
/
├─ DESIGN.md                      tokens and rules; read before any UI change
├─ astro.config.mjs               exact config in section 4.1
├─ wrangler.jsonc                 assets-only Worker (section 12)
├─ package.json                   exact pins, scripts (section 14)
├─ tsconfig.json                  extends astro/tsconfigs/strict; erasableSyntaxOnly, allowImportingTsExtensions, noEmit
├─ assets-src/hero/masters/       sky.png and ground_bake.png, the lossless masters (gitignored *.png; SHA256SUMS committed)
├─ public/
│  ├─ fonts/                      the four WOFF2 files (exist; served at /fonts/)
│  └─ _headers                    static security and cache headers; scripts/csp.mjs appends the CSP into dist/_headers
├─ src/
│  ├─ env.d.ts                    typed window globals (prod contract and hooks)
│  ├─ pages/index.astro           the hero page
│  ├─ layouts/Base.astro          <html lang="en-IN">, meta, canonical, preloads, staging noindex; imports the four stylesheets
│  ├─ styles/
│  │  ├─ tokens.css               :root tokens from DESIGN.md
│  │  ├─ shades.gen.css           generated: --shade-<id> for all 240 (7,855 B raw, 1,288 B br)
│  │  ├─ fonts.css                @font-face and fallback faces, verbatim from type-system.md and scripts/fonts/manifest.txt
│  │  └─ shell.css                hero shell, loader, countdown, cue, logotype, poster, tier layout (section 4.4)
│  ├─ config/
│  │  ├─ site.ts                  SITE_URL, LAUNCH_ISO '2026-11-01T00:00:00+05:30'
│  │  ├─ hero.ts                  POSE, MOON_POSE, SCROLL_MAP, TRACK_SVH 460, PORTRAIT_ASPECT 0.9, DPR caps, GATE (tier rules), SOFTWARE_GL, REDUCED_MOTION_TIER
│  │  ├─ copy.ts                  every string of hero.md section 3, by id; the inline scripts receive the ones they need as JSON
│  │  ├─ params.ts                HERO_PARAMS (66 keys, locked values applied, logoIdle 0), heroParams(reduced)
│  │  ├─ loader-weights.json      WT, re-measured on fetched assets (section 7.4)
│  │  ├─ shades.gen.ts            generated from docs/data/shades-240.json by id
│  │  └─ tokens.ts                colour constants the canvas needs (night, slate, pearl), checked against tokens.css by a unit test
│  ├─ assets/hero/                stage 1: the prototype files plus SHA256SUMS; stage 2: the encodes and packed binaries (section 6); imported with ?url, hashed into /_astro/
│  ├─ assets/hero/poster/         the four poster files (section 6.4)
│  ├─ components/
│  │  ├─ shell/Gate.astro         head inline script: html.js, tier choice (section 8), module load-error catch
│  │  ├─ shell/WordmarkSprite.astro   #skreed-wordmark built at build time from docs/brand/logo/skreed-logotype.svg
│  │  ├─ shell/SiteLogo.astro     corner logotype link, empty glitch groups, and the processed script that installs the glitch
│  │  ├─ shell/Loader.astro       #intro markup and the loader script (is:inline, config prepended)
│  │  ├─ hero/HeroPoster.astro    one <picture> with four sources (section 4.5)
│  │  ├─ hero/HeroStage.astro     h1, canvas#stage, #labels, .track, riders slot, after-track slot, boot <script>
│  │  ├─ hero/Countdown.astro     #heroCopy, countdown markup, noscript line with <time>
│  │  ├─ hero/ScrollCue.astro     #cue markup and, last in body, the countdown and cue script
│  │  ├─ dev/Tune.astro           rendered only when PUBLIC_TUNE is '1'
│  │  └─ dev/AfterTrackFiller.astro   a 100svh Pearl Whisper block, rendered only when PUBLIC_HERO_HOOKS is '1'
│  ├─ scripts/
│  │  ├─ boot.ts                  the 3D path's entry: probe, poster wait, prefetch, import, failure routing (sections 7 and 8)
│  │  ├─ motion.ts                reduced-motion and hover flags: read once for the scene, a live MediaQueryList for the glitch
│  │  ├─ logotype/glitch.ts       logotype glitch, no three.js import
│  │  ├─ logotype/install.ts      the SiteLogo script: installs window.__skreedLogo and drains its queue
│  │  ├─ hero/**                  the WebGL island (section 5)
│  │  └─ dev/tune.ts              Tune bindings, dynamic import in dev and staging only
│  └─ inline/
│     ├─ gate.inline.js           the Gate body (section 8)
│     ├─ gate.tier-override.inline.js   ?tier= override; concatenated only into test and staging builds
│     ├─ loader.inline.js         the prototype loader (lines 88 to 163) with the deviations of section 4.3
│     └─ countdown.inline.js      the prototype countdown and cue script (lines 178 to 191) with the changes of section 4.3
├─ scripts/
│  ├─ fonts/                      exists
│  ├─ csp.mjs                     post-build: hash every inline <script> and <style> in dist/**/*.html, write the CSP into dist/_headers (section 12.3)
│  ├─ budget.mjs                  AC9 (from SCR/port/scripts/sizes.mjs)
│  ├─ guards.mjs                  AC10.6 grep guards
│  ├─ lighthouse.mjs              section 16
│  └─ hero/
│     ├─ probes/                  the readers' scratch scripts, copied verbatim in build step 1 (reference; ported below)
│     ├─ gen-shades.mjs           shades.gen.ts and shades.gen.css
│     ├─ copy-stage1-assets.mjs   copies prototypes/hero-v9/assets and pieces.json into src/assets/hero, writes and checks SHA256SUMS
│     ├─ encode-textures.py       stage 2 crops and encodes from the masters (from probes/variants_prop.py and texladder.py)
│     ├─ pack-bins.mjs            stage 2: delta coding and gzip of the binaries, with a round-trip check
│     ├─ render-poster.mjs        canvas-only frozen render of a built page (from probes/render.mjs)
│     ├─ encode-poster.py         AVIF and WebP posters (from probes/poster.py)
│     └─ measure-weights.mjs      loader milestone weights
├─ tests/
│  ├─ harness/                    browser launch, routing, settle and freeze helpers, canvas capture, compare.py (from probes/compare2.py)
│  ├─ parity/                     rest, overlay, wipe, pull-back, loader frames (AC1 to AC3.1)
│  ├─ e2e/                        countdown, cue, logotype, hover and labels, tiers, reduced motion, failures, CSP, accessibility and breakpoints, locked values, sky class
│  └─ unit/                       node --test: maths, scroll map, wipe texture checksum, shades, tokens, weights, bins round trip
├─ docs/specs/evidence/           LOCKED_VALUES.md copied from SCR/port
├─ .github/workflows/ci.yml
└─ .github/dependabot.yml
```

`.gitignore` gains `.wrangler/`, `test-results/`, `playwright-report/` and `assets-src/hero/masters/*.png`. The masters are 26.5 MB; where they live long term (Git LFS in this repo or Dropbox) is Sam's call. Until then they sit in the working tree, outside the scratchpad, with their checksums committed.

## 4. Astro pages, layouts and components

### 4.1 `astro.config.mjs` (exact)

```js
import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://skreed.in',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  vite: { build: { assetsInlineLimit: 0 } },
});
```

`build.assetsInlineLimit` is not an Astro option and is ignored silently (verified in Astro 7.3.8). Only `vite.build.assetsInlineLimit: 0` stops Vite from inlining a small `?url` asset as a `data:application/octet-stream` URI inside a JS chunk. Such a URI would be fetched under `connect-src 'self'`, which blocks it, and the hero would fall to the poster. With the limit at 0, processed scripts are also never inlined into the HTML, so `script-src 'self'` covers them.

### 4.2 `<head>` and `<body>`

**`<head>` order** (`Base.astro`):
1. `meta charset`, `meta viewport` (`width=device-width,initial-scale=1,viewport-fit=cover`).
2. `Gate` (inline script). It sets the tier classes before any CSS applies, so there is no flash.
3. The inline `<style>`: `tokens.css`, `shades.gen.css`, `fonts.css`, `shell.css`, imported in `Base.astro`'s frontmatter so they are global (not scoped with `data-astro-cid`) and inlined by `inlineStylesheets: 'always'`. Cross-component selectors such as `.intro.po ~ .site-logo` and `html.poster .copy` depend on that.
4. `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/open-sans-400-600-latin.woff2">` (spec D14).
5. Two poster preloads, AVIF only, each `<link rel="preload" as="image" type="image/avif" fetchpriority="high">` with `href` and the same `media` string as its `<source>` (section 4.5). Browsers without AVIF skip both and find the WebP through the `<picture>`; a WebP preload would make AVIF browsers download both.
6. `<title>`, meta description, canonical `https://skreed.in/`. No `color-scheme` meta (spec D24). On staging builds only, `robots` noindex.

Slots are left for OG, icons and JSON-LD (site essentials, not this section).

**`<body>`.** The hero elements are flat children of `body` in the prototype's sibling order (spec D17). v10 styles `.intro.po~.site-logo`, `.intro.po~#heroCopy .eyebrow`, `.intro.po~#heroCopy #count`, `.intro.po~.cue .lbl` and `.intro.po~.cue .ball`, so none of these may be wrapped.

| # | Element | Component | Notes |
|---|---|---|---|
| 1 | `h1.sr-only` | HeroStage | copy id `h1`; first in reading order (D13); set in `--font-ui`, so `/` downloads no Poppins |
| 2 | `picture.hero-poster` with `img#posterImg` | HeroPoster | section 4.5; fixed under the canvas on `html.hero3d`, absolute in the first 100svh otherwise |
| 3 | `canvas#stage` | HeroStage | `aria-hidden`, fixed, `touch-action: pan-y`; `display: none` unless `html.hero3d` |
| 4 | `svg.sprite` | WordmarkSprite | a class instead of the prototype's inline `style`, because a style attribute would need CSP `style-src-attr` |
| 5 | `div#intro` and the loader script | Loader | shown only on `html.hero3d`; the prototype's noscript `<style>` is replaced by CSS on `html:not(.js)`, which saves a CSP hash |
| 6 | `a#siteLogo.site-logo` and its processed script | SiteLogo | `href="/"`, `aria-label="Skreed, home"`, an empty `<defs>` and a `.logo-tiles` group for the glitch; the script installs the glitch (D25) |
| 7 | `div#labels` | HeroStage | `aria-hidden` |
| 8 | `div.track#track` | HeroStage | 460svh on `html.hero3d`, 100svh otherwise |
| 9 | `section#heroCopy.copy` | Countdown | `p#cdEyebrow.eyebrow`, `#count`, the noscript line; fixed on `html.hero3d`, absolute otherwise |
| 10 | `div#cue.cue` | ScrollCue | |
| 11 | `<slot name="riders">` | HeroStage | section 2's DOM copy (template7's `#s2Copy`) |
| 12 | `main#main` around `<slot name="after-track">` | HeroStage | rendered only when the slot has content: section 3 in production later, the AfterTrackFiller in test builds now |
| 13 | `Tune` | dev/Tune.astro | only when `import.meta.env.PUBLIC_TUNE === '1'` |
| 14 | `<script>` that imports `boot.ts` | HeroStage | processed by Vite, `type=module`, deferred by nature; runs after the SiteLogo script (document order) |
| 15 | the countdown and cue script | ScrollCue | the last element of `body` (D16, D27) |

### 4.3 Inline scripts

Each inline script is a real `.js` file in `src/inline/`, read with `?raw` in the component's frontmatter, assembled into one string there, and emitted with `<script is:inline set:html={code}>`. Vite never transforms these files, so `import.meta.env` cannot appear in them: every build-time value is prepended as JSON by the component, and test-only code is concatenated by the component only for test and staging builds. `scripts/csp.mjs` hashes the emitted, assembled string after the build, so the hash always matches what ships.

**Gate** (`Gate.astro`): `'var CFG=' + JSON.stringify(GATE) + ';'`, then `gate.tier-override.inline.js` only when `import.meta.env.PUBLIC_HERO_HOOKS === '1'` (evaluated in the frontmatter at build time), then `gate.inline.js`. Contents in section 8.

**Loader** (`Loader.astro`): `POSE`, `WT` and `COPY` (the `ld.*` strings) prepended as JSON from `config/hero.ts`, `config/loader-weights.json` and `config/copy.ts`, so the loader and the module can never drift. Then `loader.inline.js`, which is the prototype's lines 88 to 163 with these deviations, and no others:
1. The `POSE`, `WT` and `OFF` literals are removed; `OFF` reads `COPY.offline`.
2. It returns at once unless `html.loading` is set.
3. `scrollTo(0, 0)` runs only when `location.hash` is empty.
4. New `inertAll(on)`: toggles `inert` on every `body` child that is not `#intro`, `svg.sprite`, `picture.hero-poster`, `canvas#stage` or a `script`. Exposed as `__skreedLoader.inert(on)`. `lift()`, `poster()` and `abort()` call `inertAll(false)`.
5. `poster(msg, kind)`: `kind` is `'stall'`, `'offline'` or `'fail'`. After the prototype's body it adds `HT.classList.replace('hero3d','poster')` and `window.__skreedOnPoster && window.__skreedOnPoster(kind, msg)`. The stall branch passes `''` (the prototype passed the `#fallback` text, which does not ship).
6. The recovery branch in `tick` (`if(mode==='poster'){if(ready){ph='enter';lift()}return}`) adds `HT.classList.replace('poster','hero3d')` before `lift()`.
7. New `abort()`: `ph='done'`, cancels the frame loop, the band, the fill and every exit animation (`XA`), calls `inertAll(false)`, removes `html.loading` and removes `#intro`. Because `lift()` already returns when `ph==='done'`, a pending lift timer becomes a no-op, so `__introDone` is never called after an abort, whatever phase the loader was in.

Everything else, including the measured tables, the timings and the `seek`, `cut`, `skip`, `ready`, `setProgress` and `state` API, is byte-identical. AC3.1 guards the frames.

**Countdown and cue** (`ScrollCue.astro`, last in `body`): `'var LAUNCH=' + JSON.stringify(Date.parse(LAUNCH_ISO)) + ';'` and `COPY.live` prepended, then `countdown.inline.js`, which is the prototype's lines 178 to 191 with these changes:
1. The target is `LAUNCH` (the same instant as `Date.UTC(2026,10,1) - 5.5*3600*1000`).
2. At zero the eyebrow becomes `Skreed is live. ` followed by `<a href="https://skreed.com">skreed.com</a>` (built with DOM methods, no `innerHTML`), and `box.hidden = true` now takes effect through `.count[hidden]{display:none}` (D26).
3. The v10 hooks: no digit write while `box.dataset.hold` is set, and `window.__skreedCountV` holds the four strings after each tick.
4. `cueCheck` becomes `cue.classList.toggle('is-off', scrollY > 8 || document.documentElement.scrollHeight <= innerHeight + 8)` and also runs on `resize` (D27).
5. On its first run, if `html.loading` is set and `__skreedLoader` exists, it calls `__skreedLoader.inert(true)` (D16).

### 4.4 CSS

`tokens.css` carries the `:root` block from `DESIGN.md`. `shades.gen.css` carries the 240 shade tokens. `fonts.css` carries the type-system faces. `shell.css` is the prototype's lines 10 to 83 with exactly these edits (line numbers in `template.html`):

| Lines | Edit |
|---|---|
| 10 | The token definitions move to `tokens.css` and are renamed (`--slate` to `--urban-slate`, `--pearl` to `--pearl-whisper`, `--ember` to `--ember-luxe`; every use below follows). `--panel`, `--line` and `--muted` are dropped. `--s1`, `--s2`, `--s3` and `--inset` stay. `color-scheme:dark` is dropped (D24). |
| 11 | `body`: background `var(--night)` (D24), font-family `var(--font-ui)`; `margin:0` and `font-synthesis:none` stay. `html` gets the same background. |
| 12 to 14 | Kept (`#stage`, `.track`, `.copy`). The track height comes from the tier rules below. |
| 15 to 16 | `.copy h1` and `.copy p` are deleted. `margin:0;max-width:30ch` is added to the `.copy .eyebrow` rule (line 18). The eyebrow and the noscript line keep their computed style, because `.copy .eyebrow` already overrode the font, size, weight and colour that `.copy p` set; no Poppins or Source Serif 4 reference remains. |
| 17 to 25 | Kept. `.count[hidden]{display:none}` is added (D26). Font stacks become `var(--font-ui)`. |
| 26 to 35 | Kept, except the `animation` of `.cue .ball` and `.cue .base`, which becomes `cueBall 1.5s 2.44` and `cueBase 1.5s 2.44` (three bounces, ending on a landing; D20). The keyframes are unchanged. |
| 36 to 40 | Deleted, including `.wallcopy` and its invented grey `#5f676c`. |
| 41 to 43 | Kept; `#F7F6F3` becomes `var(--pearl-whisper)` (the same computed colour). |
| 44 to 50 | Kept. The two-tone focus ring is added (below). |
| 51 to 60 | The Tune rules move into `dev/Tune.astro`, which is never built for production. |
| 61 | `.fallback` is deleted. |
| 62 | Kept: `:focus-visible{outline:2px solid var(--ember-luxe);outline-offset:2px}`. |
| 63 to 83 | Kept byte for byte except: `--night` moves to `tokens.css`; `var(--pearl)` becomes `var(--pearl-whisper)`; `#ldSt` takes `var(--pearl-whisper)` instead of `var(--muted)` (D15). The literal 8-digit Pearl stops (`#F7F6F341`, the nine of `#ldFill` and the fifteen of `#ldBand`) stay as written (D31). |

**New rules** in `shell.css`:

```css
/* tiers: 3D path only on html.hero3d; everything else is the poster layout (no JS, poster tier, failures) */
html:not(.hero3d) .track { height: 100svh; }
html:not(.hero3d) .copy { position: absolute; }
html:not(.hero3d) #stage { display: none; }
html:not(.hero3d) .intro:not(.po) { display: none; }
.hero-poster img { position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; }
html:not(.hero3d) .hero-poster img { position: absolute; height: 100svh; }
html.hero3d:not(.loading) .hero-poster { visibility: hidden; }        /* hidden from the lift on */

/* the loader's poster state over the poster image: only the status line stays */
html.poster .intro.po { background: transparent; pointer-events: none; }
html.poster .intro.po .ld-w { display: none; }

/* the cue's three bounces start when it becomes visible, and again each time it returns */
html.loading .cue .ball, html.loading .cue .base, .cue.is-off .ball, .cue.is-off .base { animation: none; }

/* no JavaScript: one line instead of empty numeral boxes; no cue */
html:not(.js) #cdEyebrow, html:not(.js) #count, html:not(.js) .cue { display: none; }

/* the skreed.com link at zero (D12) */
.copy .eyebrow a { pointer-events: auto; color: inherit; text-decoration: underline; position: relative; }
.copy .eyebrow a::after { content: ""; position: absolute; inset: -13px -8px; }   /* hit box at least 44 px: 14 px text, line box about 19 px, plus 2 x 13 */

/* two-tone focus ring (D21): Urban Slate ring inside the Ember Luxe outline, no box-shadow */
.site-logo:focus-visible::before { content: ""; position: absolute; inset: -4px; border: 2px solid var(--urban-slate); }
.copy .eyebrow a:focus-visible::before { content: ""; position: absolute; inset: -2px; border: 2px solid var(--urban-slate); }

.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; font-family: var(--font-ui); }
```

The logotype keeps the prototype's Ember outline at a 6 px offset (line 48); its Urban Slate ring sits 2 to 4 px outside the box, so a 2 px gap of background separates the two rings. The link's rings are adjacent. AC5.3 and AC4.6 measure both.

### 4.5 Poster markup (exact shape)

```html
<picture class="hero-poster">
  <source type="image/avif" media="(min-aspect-ratio: 9/10)" srcset="{wide.avif}" width="1920" height="1200">
  <source type="image/webp" media="(min-aspect-ratio: 9/10)" srcset="{wide.webp}" width="1920" height="1200">
  <source type="image/avif" media="not all and (min-aspect-ratio: 9/10)" srcset="{portrait.avif}" width="488" height="1056">
  <source type="image/webp" media="not all and (min-aspect-ratio: 9/10)" srcset="{portrait.webp}" width="488" height="1056">
  <img id="posterImg" src="{portrait.webp}" width="488" height="1056" alt="{poster.alt}" fetchpriority="high" decoding="async">
</picture>
```

- Wide is `(min-aspect-ratio: 9/10)`, that is aspect 0.9 or more; portrait is its complement, aspect below 0.9. This matches the scene's JS rule `asp < 0.9` exactly, including at 0.9.
- The two preloads in the head use `media="(min-aspect-ratio: 9/10)"` with `{wide.avif}` and `media="not all and (min-aspect-ratio: 9/10)"` with `{portrait.avif}`.
- One `<img>`, so one request per page view. `boot.ts` decodes `#posterImg` and reads its `currentSrc`.
- The `{...}` URLs are the hashed `?url` imports of `src/assets/hero/poster/`.

## 5. The WebGL island (`src/scripts/hero/`)

### 5.1 Module split

All modules are strict TypeScript. "Lines" refers to `template.html`.

| Module | Exports | Depends on | Lines |
|---|---|---|---|
| `util/math.ts` | `lerpFPS(a, b, k, ratio)`, `smoothstep`, `fit`, `clamp01`, `easeInOutCubic`, `sineNoise`, `hash2`, `vnoise2`, `parkMiller(seed)` | none | 313 to 318, 339 to 394, 1260 |
| `util/time.ts` | `yieldFrame()` (setTimeout 0 promise); THREE.Clock stays in r165 | none | 274 |
| `bridge/life.ts` | `createLife()` returning `{dead, kill(reason), onKill(fn), onRecover(fn), recover(), check()}`; `check()` throws once dead, so `startHero` stops at its next await | none | new |
| `bridge/loader.ts` | `report(m)` (no-op once dead; hooks build also records `__skreedMilestoneTimes`), `onIntroDone(cb)` (installs `window.__introDone`; runs `life.recover()` first; no-op once dead), `markStarted()`; typed `Milestone` union from the weights keys | config, life | 275 to 280, 1239, 1369, 1381 to 1398 |
| `bridge/hooks.ts` | `installHooks(ctx)`, compiled only when `PUBLIC_HERO_HOOKS` is '1' (section 10) | context types | 1238 to 1256, 1276 to 1278 |
| `data/urls.ts` | hashed `?url` strings for every asset and class | none | |
| `data/bins.ts` | `fetchBin(url)` (stage 2: inflate through `DecompressionStream('gzip')`), `undeltaPlanes(bytes, rows, cols)` | none | 593 to 599 |
| `data/assets.ts` | `prefetchHeroData(cls, avif)` returning promises for `pieces`, `groundH`, `stonesP`, `stonesC`, `stonesI`; `loadTexture(url, milestone, opts)` (a load error rejects, which is a hard failure, D19) | bridge, urls, bins | 593 to 599 |
| `gfx/renderer.ts` | `createRenderer(canvas, {touch, forced})` returning `{renderer, dpr}` | three | 320 to 328 |
| `logo/geometry.ts` | `buildLogoGeometry(pieces, pose, step)` returning `{geometry, blocks}`; type `Block` | three, math | 339 to 394 |
| `logo/uniforms.ts` | `createLogoUniforms(params)`, `assignBlockColours(blocks, U)` | three, shades | 282 to 301, 395 to 413 |
| `logo/shaders.ts` | `logoVert(maxb, slots)`, `logoFrag(maxb, slots)`; slots `vertPars`, `vertPos`, `fragPars`, `fragOut`, empty by default | none | 414 to 533 |
| `logo/material.ts` | `createLogoMaterial(U, slots)` | uniforms, shaders | 414 to 533 |
| `logo/motion.ts` | `updateBlocks(f)`: breath, push, followers, rotation, floor clearance | math; samplers passed in | 1297 to 1330 |
| `world/wind.ts` | `bakeWindTexture(renderer)` | three | 712 to 768 |
| `world/fog.ts` | `createFogUniforms(windTex, uTime, params)`, `createFogCards(FOG)`, `placeFogCards(cards, groundAt)`, `updateFogLogoRect(FOG, cam, logoY, renderer)` | three, config | 769 to 878, 1353 to 1362 |
| `world/sky.ts` | `createSkyDome(tex, params, extents, slots)`, `skyGeometry(extents)` | three | 557 to 592 |
| `world/skyClass.ts` | `createSkyClass(ctx)` returning `{onAspect(asp), onFrame2()}` (section 6.5) | sky, assets | new |
| `world/ground.ts` | `createGround({meta, heights, tex, FOG, params, patches})` returning `{mesh, material, groundAt}`; `customProgramCacheKey` 'skreed-ground' | three, fog | 600 to 687 |
| `world/stones.ts` | `createStones({meta, buffers, patches})` returning `{mesh, material, stoneTopAt}` | three | 688 to 710 |
| `world/moon.ts` | `createMoon(...)`, `applyMoonWorld(scene, rig)`: background and fog #050506, near 60, far 430, moon visible | world/* | 879 to 896 (spires branch only) |
| `post/composer.ts` | `makeHeroComposer(renderer, scene, cam)` (Render, Save, Bloom, Restore, Output), `makePlainComposer(...)` | three addons | 918 to 942 |
| `post/wipeTexture.ts` | `makeScrollTexture(512)` returning `{tex, fill(j0, j1)}`; `needsUpdate` after the last fill | three | 944 to 986 |
| `post/composite.ts` | `createComposite(scrollTex, calm, slots)` returning `{scene, camera, C, render(...)}` | three | 987 to 1037 |
| `stage/resize.ts` | `createResize(ctx)` returning `resize()` (section 5.6) | config | 1039 to 1050 |
| `section2/types.ts`, `section2/placeholderWall.ts` | `Section2Scene` (section 11); the v9.9 swatch field | three, shades | 898 to 916 |
| `intro/types.ts`, `intro/none.ts` | `IntroDirector`; `NO_INTRO` (v9.9: live ramps from the loader cut, frames reported by texFrames) | none | 1273 to 1282, 1369 |
| `interaction/pointer.ts` | `createPointer()` returning `{ndc, active, lastInput}`; `ghostTarget(t)` | none | 1073 to 1084 |
| `interaction/labels.ts` | `createLabels(layerEl, sceneA)` returning `{update(...)}` | three | 1090 to 1154 |
| `camera/rig.ts` | `createCameraRig(camA, pose, moonPose)` returning `{update(...), setZoom(aspect)}` | math | 330 to 337, 1335 to 1348 |
| `scroll/scrollMap.ts` | `createScrollFollower()`, `mapScroll(b)` returning `{s, tp, heroOn}`, `clipFor(tp, above, aspect)` | math | 1258 to 1264, 1283 to 1288 |
| `scroll/ride.ts` | `rideCopy(els, tp)`, `resetRiders(els)` (section 7.3) | scrollMap | 1265 to 1271, 1371 to 1379 |
| `warmup.ts` | `warmUp(ctx)`: compile, groups c1 to c5, composer warm c6, then resize; honours `__skreedStall` in hooks builds | bridge | 1381 to 1399 |
| `loop.ts` | `createLoop(ctx)` returning `{start, stop}`; owns `t`, `ratio`, `live`, `tHero0` | everything above | 1273 to 1369 |
| `hero.ts` | `startHero(opts)`: the start-up order of section 5.3; builds `HeroContext`; registers every disposer with `life` | everything above | 260 to 1400 |
| `../boot.ts` | probe, poster wait, data prefetch, `import('./hero/hero.ts')`, soft and hard poster routing (sections 7 and 8) | bridge, data/assets, config, plus the dynamic import | new |
| `../logotype/glitch.ts` | `createLogoGlitch(linkEl, opts)` returning `{burst, intro, setTone}`; ghost fills `var(--shade-<id>)` | shades, motion | 1156 to 1237 |
| `../logotype/install.ts` | installs `window.__skreedLogo`, drains `window.__skreedLogoQ`, runs the poster-tier intro (D25) | glitch | new |

**Import graph.**
- `config/*` and `util/*` are leaves.
- `world`, `logo` and `post` import only leaves and three.
- `logo/motion.ts` receives `groundAt` and `stoneTopAt` as functions, so there is no import cycle.
- `section2` and `intro` are interfaces plugged in through `HeroContext`.
- `boot.ts` imports `bridge/*`, `data/assets.ts` (which has no three import) and config, and loads `hero.ts` dynamically.
- `glitch.ts` and `install.ts` never import three.

Expected chunks:
- the SiteLogo glitch chunk, about 2.5 KB gz (shell inventory);
- the boot chunk, about 1 KB gz (the probe's island gate was 0.9 KB gz) plus the data prefetch code;
- the hero chunk, three and the scene together, 139.8 KB gz in the Astro probe before Tune is removed.

**Port rules that keep pixels identical.**
- GLSL strings are copied byte for byte. `MAXB` (30) stays interpolated as text. The minifier never rewrites string contents.
- Named slots are string concatenation points that are empty by default, so the default shader text equals the prototype's.
- `makeScrollTexture` keeps its integer hash exactly: `(x*374761393 + y*668265263 + s*2147483647)|0`, then `((h^(h>>>13))*1274126177)|0`. Never `Math.imul`, because the double rounding of the 1274126177 product is part of the texture. `x*999|0` keeps its precedence. A unit test compares the texture's checksum with the prototype function's, extracted from `template.html`.
- `buildLogoGeometry` keeps the Park-Miller call order (seed 11, three calls per block), the `Math.sin` hashes and the float maths.
- Every `onBeforeCompile` material gets an explicit `customProgramCacheKey`. three keys programs on `onBeforeCompile.toString()`, and minified closures can collide.
- `setPixelRatio` runs before the composers are built, because EffectComposer copies the pixel ratio at construction.
- `FOG.uTime` is the same object as `U.uTime`, and the fog cards share the FOG uniform objects by reference.
- The one-frame camera lag in the raycast, the labels and the fog logo rect (they read camA's matrices from the last render) is kept.

**Dropped from the prototype.** None of these changes a pixel.
- The canyon and dunes plates, `PLATES` (about 150 KB), `?world`, `[data-world]`.
- The `[data-n]` variant code.
- The orders other than 'cool', `?blockColors`, `[data-order]`.
- `P_DEFAULTS`, the `?key=` overrides and the slider loop. These move to `dev/tune.ts`.
- The unused uniforms `uAnchor`, `uRegion` and `uRimDir`, and the `SOFT_DEPTH` branch.
- The no-op resize lines (`A.b.resolution.set` and the second savePass `setSize`).
- The placeholder `#wallCopy` and its ride lines.

### 5.2 HeroContext

`hero.ts` builds one object and passes it to `warmUp`, `createLoop`, `createResize`, the hooks and the slots:
- `renderer`, `dpr`, `life`;
- `sceneA`, `camA`, `U`, `FOG`, `blocks`, `logo`, `moon` (with `groundAt` and `stoneTopAt`), `sky` (dome, material, class);
- `composerA` (bloom) and `section2` (a `Section2Scene`, the placeholder by default);
- `composite`, `intro` (an `IntroDirector`, `NO_INTRO` by default);
- `params`, `reduced` (OS reduced motion or `html.still3d`), `touch`, `ghost` (`touch && !reduced`), `els` (`heroCopy`, `cue`, `labels`, `siteLogo`).

### 5.3 Start-up order (keep it: the loader milestones and weights depend on it)

1. `boot.ts` has already started the fetches. `startHero` awaits `pieces` (`pieces.json`), then `report('import')`. The `import` milestone therefore covers the hero chunk and `pieces.json`, so a slow `pieces.json` shows "Slow connection" (section 7.4).
2. Params: the frozen `HERO_PARAMS`. `breath` is 0 when reduced.
3. Renderer: `antialias` true (parity), `powerPreference` 'high-performance', `failIfMajorPerformanceCaveat` true unless the test override forced the 3D tier. Then `setPixelRatio(min(devicePixelRatio, touch ? 1.25 : 1.5))`, ACESFilmic, `autoClear` true. A construction failure is a hard failure. `boot.ts` attaches `webglcontextlost` to the canvas.
4. `sceneA` and `camA`: PerspectiveCamera(30, 1, 0.1, 1200).
5. `U`, the logo material, and the logo mesh added to `sceneA` first, so it is warm-up group c1.
6. `makeScrollTexture(512)`.
7. `buildLogoGeometry` per block. For each block: fill the wipe texture rows `round(id * 51.2)` to `round((id + 1) * 51.2)`, `yieldFrame`, `report('b' + (id + 1))`. Then the attributes, `assignBlockColours`, and `uOff`, `uQ` and `uD` reset.
8. The moon group added (invisible). The sky texture starts loading; `sky` is reported on load; a load error is a hard failure. The sky dome is added to the moon group, with the full prototype extents at stage 1 and the class's crop extents at stage 2.
9. `yieldFrame`. The ground texture starts loading (`ground` on load). `await` the `groundH` and stones promises; while they are pending, the pending milestone is `sky` or `ground`, so the loader reads it as network. Ground mesh and `groundAt`. Stones and `stoneTopAt`.
10. Wind texture bake: one synchronous render.
11. FOG uniforms. Four fog cards added to the moon group, then `placeFogCards`.
12. `applyMoonWorld`: poses, fog 60 and 430, background and fog #050506, moon visible.
13. The section 2 scene installed (placeholder: `sceneB` on Pearl Whisper, `camB` (30, 1, 0.1, 100), the 240-instance swatch field).
14. `yieldFrame`. Composer A (bloom) and the section 2 composer.
15. The composite.
16. `resize()` and its `resize` listener (section 5.6).
17. Pointer listeners, state objects. Labels: the links LineSegments added to `sceneA` last, so they are group c5.
18. Hooks (test builds). The `heroCopy`, `cue`, labels and logotype references. The IntersectionObserver of section 7.5.
19. `report('scene')`, `yieldFrame`.
20. Warm-up:
    - `compileAsync(sceneA, camA)` and `compileAsync(screenScene, screenCam)`;
    - groups c1 logo, c2 sky, c3 ground and stones, c4 fog cards, c5 links, each drawn alone into an 8 x 8 target, with a yield and a report between them;
    - sizes to 8 x 8, composer A rendered once: c6;
    - the section 2 composer and the composite drawn once;
    - `resize()`, dispose the warm-up target;
    - errors are warned and swallowed, as in the prototype.
21. `report('compile')`, then the first `requestAnimationFrame`. `frame1` and `frame2` are reported on the two frames after both textures have loaded (or by the intro's own signal, section 11.1).

`life.check()` runs after every `await` and every `yieldFrame`: once a hard failure has killed the island, start-up stops there.

The prototype's invisible plate mesh sat between steps 5 and 8. Removing it saves one compile in `compileAsync`. The warm-up groups count only visible meshes, so c1 to c6 are unchanged.

### 5.4 Per-frame order (keep it exactly)

| Step | What happens |
|---|---|
| F1 | `requestAnimationFrame(frame)` first; hooks build: `__skreedFrame++`; `__heroStarted = true` |
| F2 | `dt = freeze ? (getDelta(), 0) : min(getDelta(), 1/12)`; `t += dt`; `ratio = min(5, dt * 60)` (freeze is read only in hooks builds) |
| F3 | `U.uTime = reduced ? 0 : t` |
| F4 | `live = introDone ? (reduced ? 1 : 1 - (1 - clamp01((t - tHero0) / 2))^3) : 0`. The intro slot may override this. |
| F5 | `logo.position.y = reduced ? 0 : sin(0.7t) * 0.07 * live` |
| F6 | scroll followers 0.075 and 0.15; `s = reduced ? 0 : easeInOutCubic(clamp01(b / 1.5))`; `tp = clamp01((b - 1.5) / 1)`; `heroOn = 1 - smoothstep(0, 0.45, s)` |
| F7 | pointer target (any active pointer, touch included) or ghost sweep (`ghost && live >= 1 && now - lastInput > 2500`, `lastInput` starting at -1e9); raycast through camA onto z = 0; mouse follower |
| F8 | blocks: breath, push, followers, offset, rotation, floor clearance; write `uOff`, `uQ`, `uD` |
| F9 | `logo.updateMatrixWorld()` |
| F10 | labels update; label layer visibility |
| F11 | camera: base pose by `s`, parallax lerps (from any active pointer, times `live`), orbit, position, sky follows the camera, shake, `lookAt`; a pending sky class swap happens here (section 6.5) |
| F12 | section 2 update (placeholder: `camB.y = -clamp01((b - 2.5) / 1.5) * 0.8`) |
| F13 | `FOG.uLogoRect` and `FOG.uResolution` |
| F14 | composer A if `tp < 1`; section 2 composer under NoToneMapping if `tp > 0`; composite to the canvas with `uNoiseOff` random |
| F15 | `ctx.intro.reportFrames ? ctx.intro.reportFrames(f, report) : texFrames` (v9.9: `frame1` and `frame2` on the first two frames with both textures loaded) |
| F16 | DOM ride: `__skreedLogo?.setTone(tp > 0.5)`, `heroCopy` transform, clip and visibility, cue `is-off` |

### 5.5 Constants that must survive

**`HERO_PARAMS`, 66 keys.** The locked values from `hero.md` section 0 are marked with an asterisk; `logoIdle` is changed for WCAG 2.2.2 (D20); every other value is the v9.9 default.

| Group | Key and value |
|---|---|
| Hover | push 0.5, wob 0.3, r0 1, r1 3, follow 0.06, mouse 0.05, breath 0.3 (0 under reduced motion), lift 1.6, clear 0.2 |
| Look | glow 2.4, rest 0.06, tint 0.035, grad 0.7, tex 1.5, relief 0.01, key 2.0 |
| Logo light | rim 2.4, spec 0.8, rough 0.55, bounce 1.0, amb 1, rimAz 35, rimEl 40 (both unused by the GLSL), bevel 0.05, bevelAng 50, alb 0.017, wrap 0.25 |
| Key light | keyX -6, keyY 7, keyZ 10, keyRad 3.5 |
| Kicker and counter kicker | rimX -4, rimY 9, rimZ -3, rimRad 4.5; rim2 0.75, rim2X 9, rim2Y 7, rim2Z -3, rim2Rad 4 |
| Environment | floor 0.24, hz 0.06, sky 0.008, ktemp 1, wear 0.3, occ 0.3, knee 0.55 |
| Post | bloom 0.5 |
| Glitch | logoIdle 0 (v9.9: 1), logoSplit 0.4 |
| Sky | skyGain 1, hue 0.8, hueScale 2.2 |
| Terrain | gExp 0.20\*, gGamma 0.87\*, gNear 0.54\*, gToe 0.02\*, crumb 0.53\*, crumbSize 0.07\*, mist 0.20\*, mistSpeed 0.55\* |
| Fog | fog 1\*, fogBright 0.4\*, fogSpeed 0.15\*, fogSize 1\*, fogHug 1.6\* |

**Logo geometry.**
- Size: MAXB 30 (uniform array size; 10 blocks used). viewBox 1207.63 x 1312.81. Logo width 5.6, scale 0.00463718191830, height 6.0877, depth 0.95. Seam scale 0.992.
- Hash: Park-Miller seed 11, multiplier 16807, modulus 2147483647. hash2 = fract(sin(127.1x + 311.7y) * 43758.5453).
- Relief: boundary vertices -0.55 - 0.35 hash2(9x, 9y); interior vertices 0.15 + 0.5 vnoise2(2.4x + 3, 2.4y) + 0.55 hash2(13x, 13y).

**Camera.**
- Hero pose: camera (0, -2.5, 24), target (0, -1, 0). Pulled-back pose: camera (0, 3.2, 36), target (0, -1.2, -6).
- Zoom `min(1, aspect * 1.25)`. Portrait below aspect 0.9.
- Parallax: theta `0.07 * pi/2 * x`, phi `-0.025 * pi/2 * y`, lerp 0.035, from any active pointer (touch while down), times `live`, 0 under reduced motion.
- Shake: 0.01 times live, with `sineNoise(-2.45, 4.789, 7.343 + 0.5t)` about the right axis and `sineNoise(12.23, 3.44, -3.234 + 0.5t)` about the up axis.
- Live ramp 2 s, cubic out. dt cap 1/12, ratio cap 5.

**Block motion.**
- Breath: `0.4 (sin(-2t + cx) * 0.5 + 0.5)(cos(-t) * 0.5 + 0.5)(0.5 + 1.5 rand.z) * 0.5 * breath * live`.
- Push wobble: `sin(t + rand.x * 12.342) * rand.y`.
- Rotation axes in order Y, Z, X, each by `cos(2d + rand * 30) * d * 0.5`.
- Floor clearance +0.2; when a block is lifted, z also moves by 0.6 times the lift.
- Ghost sweep once `live >= 1` and 2500 ms after the last input (last input starts at -1e9). Mouse rest sentinel 99; it decays toward the sentinel at `mouse * 0.25`.

**Labels.**
- Limits: max 5, links 2, minimum displacement 0.1, near 2, step 0.05, fade in 0.1 s, out 0.06 s.
- Look: link colour #F7F6F3 at opacity 0.35, renderOrder 10. Label offset (-1.5, -6) px. Readout `floor(|off| * 50) % 100`, padded to two digits.

**Sky dome.**
- Prototype shape (stage 1): `SphereGeometry(900, 128, 64, 1.5pi - skyLon/2, skyLon, rad(90 - SKY_TOP), rad(SKY_TOP - SKY_BOT))` with `skyLon` 140 degrees, `SKY_TOP` 60, `SKY_BOT` -10 (line 561). scale.x -1, rotation.x -2.6 degrees, DoubleSide, renderOrder -2.
- Texture: anisotropy 8.
- Galaxy wash: 5 fbm octaves (x2.03 + 11.7, gain 0.5). Taps `d + 3.1`, `d * 1.3 - 7.4`, `d * 0.8 + 19`, `d * 1.7 + 41`, with thresholds (0.38, 0.78), (0.42, 0.8), (0.48, 0.84), (0.5, 0.86). Horizon mask `smoothstep(-0.03, 0.12, dir.y)`. Dark mask `1 - smoothstep(0.02, 0.18, luma709)`.
- The wash uses the view direction, not the UV, so cropping the texture with the dome leaves it unchanged.
- Stage 2 extents: section 6.5.

**Ground.**
- Grid: 400 rows by 320 columns. zmin -3.88707484659952, zmax 38.88389816956722.
- Mapping: row depth `PY = -30 + 450 (1 - r / 399)^2.2`; half width `34 + 1.25 (PY + 30)`.
- Texture: anisotropy at the renderer maximum.
- Tone: `gExp * pow(c, gGamma)`; near falloff `smoothstep(6, 20)`; toe `0.5 (c + sqrt(c^2 + 4 toe^2))`.
- Crumb: weights 0.5, 0.3, 0.2, fading by `smoothstep(6, 45)`.
- Mist: near 6, far 140, lit-only weight 0.6.

**Stones.** 3066 vertices, 5840 triangles, u16 index. lo (-53.78633499, -3.95012641, -54.32771683), hi (54.74985886, 0.28714204, 18.81669998). Top grid: x0 -9, z0 -6, 120 by 100 cells of 0.15, dilated 2 cells.

**Wind bake.** 256 px, RGBA8, repeat, trilinear mips. uPeriod (3, 5), uWarp 0.6, uEmboss 0.3, uHeightMix 0.6, uOctGain 0.45, uSeed 0, uNorm (1.338, -0.176). Output clamped to 0.13 to 0.80.

**FOG uniforms.**
- Tiles and fades: uTileMul 1, uSpeed 0.15, uRise 1, uGain 8, uHaze 0.03, uDensity 1, uMaxAlpha 0.45, uOpacity 1, uEdgeX 0.2, uBottomRamp 0.1, uTopFade 1.6.
- Distances: uNearStart 6, uNearEnd 12, uFarStart 220, uFarEnd 420, uGrazing 0.25.
- Colour: uFogColor #F7F6F3, uFogBright 0.4, uLift 0.35.
- Logo guard: uLogoClear 0.8, uLogoSoft 0.35.
- Ground mist: uGMAmount 0.55 in v9.9 (0.20 with the lock), uGMScale 0.1, uGMVelX 0.25 and uGMVelZ 0.3 (each times mistSpeed), uGMNear 6, uGMFar 140, uGMLitOnly 0.6.
- The wind tile is decoded with pow 2.2 and dithered by `(ign - 0.5) / 255`.

**Fog cards** `[z, width, height, tile, phase, front, yaw]`:
- [9, 44, 1.8, (5.8, 2.9), 0, 1, 4 deg]
- [-10, 90, 3.5, (13.1, 6.5), 0.914, 0, -6 deg]
- [-45, 170, 7.0, (26.5, 13.3), 2.31, 0, 3 deg]
- [-150, 440, 18.0, (67.0, 33.5), 4.07, 0, 0 deg]

Each card sits at y = `groundAt(0, z) - 0.15 h + h / 2`, renderOrder 2.

**Composer and bloom.**
- No MSAA (v9.8: multisampled half-float targets drew stray lines on GPUs).
- Pass order: RenderPass, SavePass (HalfFloat), UnrealBloomPass(256 x 256, strength 0.5, radius 0.22, threshold 0.62), Restore `mix(clean, bloomed, step(0.5, clean.a))`, OutputPass.
- The section 2 composer is RenderPass and OutputPass, rendered under NoToneMapping.

**Wipe texture.**
- Size and channel R: N 512, 7 cells, warp ±0.03, edge x40.
- Channel G: block split depth up to 5, stopping when depth is above 2 and the hash is below 0.3, split ratio `0.3 + 0.4 hash`.
- Channel B: fbm base 2, seed 7.

**Composite.** Slope `-0.2 aspect`, wobble ±0.4. Margins: blur 2.0, disp 0.9, cutDisp 1.0, cutDiag 0.2, cut 2.0. Parallax `0.4 cubicIn`, disp 0.025. Five-tap chromatic aberration with a barrel bend, modulator 12. `uCalm` is set under reduced motion.

**DOM ride.**
- Countdown translate `-0.4 tp^3 * 100vh`.
- `clipFor`: `sl = 0.2 aspect`, `pp = -0.2 + 1.2 tp (1 + sl) + 0.1`.

**Section 2 placeholder.** Circle radius 0.2, 48 segments, gap 0.5. 24 columns, or 12 when aspect is below 0.9. y offset -0.6 (-0.9 in portrait). camB z 19 (26 in portrait). Background #F7F6F3.

**Glitch.**
- Geometry: viewBox 1209.46 x 292.9, AMP 12.69933, 8 rows by 6 segments.
- Slabs: rows `rand(0.05, 0.24)` of the height, segments `rand(0.06, 0.26)` of the width, cuts snapped to device pixels.
- Ghosts: offset `AMP * rand(1.4, 2.6)`, alpha `clamp(0.74 * sqrt(0.72 / L), 0.5, 0.9)`, fill `var(--shade-<id>)`.
- Flicker `0.85 + 0.15 sin(30p + phase)`. 3 patterns per burst.
- Reduced motion is read live before every burst (`reducedMQ.matches`), as in the prototype.

**Loader.** CYC 1.6, DEL 0.2, LEAD 0.04, FULL 4.96, END 7.05. Ease-in `cubic-bezier(.55, .085, .68, .53)`. Lift 600 ms, or 400 ms under reduced motion. Status text after 4 s without progress. Soft poster after 12 s without progress once `scene` is in, 20 s before it.

### 5.6 Resize (`stage/resize.ts`)

`createResize(ctx)` returns the prototype's `resize()` (lines 1039 to 1050) without its two no-op lines:

```ts
function resize() {
  const w = innerWidth, h = innerHeight; if (!w || !h) return; const asp = w / h;
  ctx.renderer.setSize(w, h, false);
  ctx.composerA.setSize(w, h);                         // sizes the SavePass target too
  ctx.camA.aspect = asp; ctx.camA.zoom = Math.min(1, asp * 1.25); ctx.camA.updateProjectionMatrix();   // igloo's portrait rule
  ctx.composite.C.uAspect.value = asp;
  const portrait = asp < PORTRAIT_ASPECT;              // 0.9
  ctx.section2.resize(w, h, asp, portrait);            // placeholder: B composer setSize, camB aspect and projection, layoutWall on a portrait flip or the first call
  ctx.sky.onAspect(asp);                               // stage 2: the one-way portrait to wide upgrade (section 6.5)
}
```

- `hero.ts` calls it at step 16, registers `addEventListener('resize', resize)` (window `resize` only, as in the prototype; no `visualViewport`, no DPR-change handling), and registers the removal with `life`.
- The warm-up keeps its own `setSize(8, 8)` calls (including the SavePass target) verbatim, then calls `resize()`.
- None of these calls reads another's result, so grouping section 2's work into its own `resize` changes no pixel.

## 6. Asset pipeline

### 6.1 Sources

- **Stage 1.** `scripts/hero/copy-stage1-assets.mjs` copies `prototypes/hero-v9/assets/*` and `prototypes/hero-v9/pieces.json` into `src/assets/hero/` and writes `SHA256SUMS`; later runs check it. The asset probe proved these files are byte-identical to the data inlined in the built `index.html`.
- **Stage 2 masters.** `assets-src/hero/masters/sky.png` (4200 x 2100 RGBA, 12,989,807 B) and `ground_bake.png` (4096 x 4096 RGB, 13,485,739 B), copied from `SCR/land/moon_igloo/` in build step 1. Re-encoding them with `build.py`'s settings gives the shipped WebPs byte for byte, which proves they are the v9.9 sources. `encode-textures.py` takes their directory as an argument and commits only the encodes.
- **Shades.** `scripts/hero/gen-shades.mjs` reads `docs/data/shades-240.json` and writes `src/config/shades.gen.ts` (the ten block shades, the four galaxy shades, the glitch pairs and lightness, and the 240 hexes in catalog order) and `src/styles/shades.gen.css` (`--shade-<id>` for all 240). Everything is looked up by id, because names repeat (Pastel six times, Neon four, Wine twice).
- **Wordmark.** `WordmarkSprite.astro` reads `docs/brand/logo/skreed-logotype.svg` at build. It strips the class and fill so the paths draw in `currentColor`. A unit test checks the six path strings against the prototype sprite.

### 6.2 Files per device class (stage 2)

| Class | Chosen when | Sky | Ground | Shared |
|---|---|---|---|---|
| poster | the tiers in section 8 | none | none | poster only |
| portrait | aspect below 0.9 at load | crop 1298 x 1388, AVIF q50 (182,948 B), WebP q84 fallback (326,326 B) | 4096 AVIF q50 (408,036 B) | ground_h, stones, pieces, meta |
| wide | aspect 0.9 or more | crop 3208 x 1388, AVIF q50 (362,639 B), WebP q84 fallback (604,504 B) | 4096 AVIF q50 (408,036 B) | same |
| WebP-only browser | the poster's `currentSrc` is not `.avif` | the class's WebP crop | 2048 WebP q82 (317,324 B), the only use of the 2048 ground (spec D4) | same |

- **Crops.** Taken from the master as `variants_prop.py` does: `sky.crop((2100 - halfw, 2100 - 1388, 2100 + halfw, 2100))` with `halfw` 649 (portrait) or 1604 (wide), so the dome's centre column and the bottom 1388 rows. AVIF at quality 50, speed 6; WebP at quality 84, method 6.
- **Ground.** AVIF quality 50, speed 6, at 4096. The 2048 WebP is a Lanczos resize at quality 82, method 6.
- **Parity.** The encodes reach the measured parity: phone PSNR 42.12 dB and SSIM 0.9766; desktop 41.55 dB and 0.9748; residual is codec grain only. SSIM against the lossless source, AVIF q50 against the shipped WebP:
  - ground: 0.9812 against 0.9826 (WebP q82);
  - sky: portrait crop 0.9470 and wide crop 0.9506 against 0.9489 (full sky, WebP q84).
- **Binaries** (D22): `pack-bins.mjs` writes `ground_h.bin` as the planar-predicted heights (each value minus the one above, minus the one to the left, plus the one above-left, modulo 65536; missing neighbours count as 0) split into a high-byte plane then a low-byte plane, then gzip level 9: 164,503 B. The three stones files are gzip level 9 only: 18,038, 3,996 and 26,564 B. A unit test inflates and decodes each file and compares it byte for byte with the stage 1 original. The names keep `.bin`, so they are served as `application/octet-stream` and never get a `Content-Encoding` header.

### 6.3 Loading and decoding

- **Bundling.** Every asset is imported with `?url` from `src/assets/hero/`, so Vite emits it with a content hash under `/_astro/`. `vite.build.assetsInlineLimit: 0` guarantees that nothing turns into a base64 `data:` URI. `moon_meta.json` (279 B) is imported as a JSON module into the hero chunk. `pieces.json` is fetched as data, not bundled; bundled it would add 39.4 KB gz to the JS budget.
- **Prefetch.** After the poster decodes, `boot.ts` starts `prefetchHeroData(cls, avif)`, which `fetch()`es `pieces.json` and the four binaries at once, and in parallel `import('./hero/hero.ts')`. `hero.ts` awaits those promises where the prototype decoded base64 (steps 1 and 9). A rejected fetch is a hard failure.
- **Inflating** (stage 2): `new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()`, then `undeltaPlanes` for `ground_h`. `DecompressionStream` streams off the parser and needs no CSP change. Browsers without it are on the poster tier (section 8). Typed-array views are little-endian on every target.
- **Textures.** They load through `ImageBitmapLoader` with `{imageOrientation: 'flipY', premultiplyAlpha: 'none'}`, so decode happens off the main thread, and the bitmap is closed after upload. This is kept only if the stage 1 rest frames stay identical to the `TextureLoader` path (spec D8, decided in build step 8); otherwise `TextureLoader`. The `sky` and `ground` milestones fire on load; a load error is a hard failure (D19). The upload happens at the first bind inside the warm-up, as in the prototype.
- **Compression.** HTML, CSS and JS are compressed by Cloudflare (brotli). The `.bin` files are not (`application/octet-stream` is not on the compressible list; under wrangler 4.149 dev `.bin` came back uncompressed), which is why they are packed at build. The first staging deploy checks `curl -sI -H 'Accept-Encoding: br'` on one `.js` and one `.bin`.

### 6.4 Posters

1. **Provisional (stage 1).** `scripts/hero/render-poster.mjs` renders the prototype (`prototypes/hero-v9/index.html`, locked values in the URL) canvas-only with `__skreedFreeze` set before load, at least 3 frames after `ready`, overlays hidden, at 390 x 844 (deviceScaleFactor 1.25) and 1280 x 800 (deviceScaleFactor 1.5). `encode-poster.py` encodes them as below. This gives stage 1 a real poster of the approved hero.
2. **Final (stage 2).** The same render of the built stage 2 test build with `?tier=hero3d`, then the same encode. It replaces the provisional files.
3. `encode-poster.py` writes, from the 488 x 1055 and 1920 x 1200 captures (the phone capture is resized to 488 x 1056 as in the probe):
   - phone: 488 x 1056 AVIF q60 (measured 42,668 B on v9.9 values) and WebP q80 (44,492 B);
   - desktop: 1920 x 1200 AVIF q50 (86,318 B) and WebP q70 (91,548 B). Desktop AVIF q60 would be 123,357 B, over budget.
   AVIF speed 4 and WebP method 6, as in `poster.py`.
4. The poster is re-rendered whenever a parameter, an asset or the pose changes. A test compares it with a fresh canvas render (SSIM at least 0.954 phone, 0.953 desktop).

### 6.5 Sky class upgrade (stage 2, spec D28)

- **Geometry per class.** The prototype's constructor with the crop's extents; segments stay 128 x 64, which is what the measured variant used (`variants_prop.py` changed only `skyLon` and `SKY_TOP`):

  | Class | `skyLon` | `SKY_TOP` | `SKY_BOT` | phiStart | thetaStart | thetaLength |
  |---|---|---|---|---|---|---|
  | prototype (stage 1) | 140 deg | 60 | -10 | 1.5pi - 70 deg | 30 deg | 70 deg |
  | portrait crop | 43.2667 deg | 36.2667 | -10 | 1.5pi - 21.63335 deg | 53.7333 deg | 46.2667 deg |
  | wide crop | 106.9333 deg | 36.2667 | -10 | 1.5pi - 53.46665 deg | 53.7333 deg | 46.2667 deg |

  (4200 px span 140 degrees and 2100 rows span 70 degrees, so 1298 px is 43.2667 degrees, 3208 px is 106.9333 degrees and 1388 rows reach 36.2667 degrees above -10.) scale.x, rotation.x and renderOrder are unchanged.
- **Trigger.** `sky.onAspect(asp)` runs inside `resize()`. When the loaded class is portrait and `asp >= 0.9`, it marks an upgrade. The upgrade starts at once if `frame2` has been reported, otherwise at `frame2` (the loader is never disturbed). It runs at most once per visit; the class never goes back to portrait, because the wide crop covers every portrait view. A desktop window that starts narrow follows the same rule.
- **Interim.** The portrait dome and texture stay until the wide texture has loaded (AVIF or WebP as the poster chose) and has been uploaded with `renderer.initTexture`. Until then, in a landscape frame, the far left and right of the sky show the scene background (#050506) beyond the portrait crop.
- **Swap.** In the next frame's F11, before rendering: the dome's geometry becomes the wide geometry and the sky material's texture uniform becomes the wide texture, in the same frame. Then the old geometry and texture are disposed.
- **Errors.** A failed wide load keeps the portrait dome and logs a warning; it is not a failure of the hero.
- **Test.** AC8.6 (rotation, one request, identical to a fresh wide load under `still3d`).

### 6.6 First view per class (bytes)

Parts, from the readers' measurements (KB of 1024 B) and the architect's packing measurement:

| Part | Bytes | Source |
|---|---|---|
| Shell HTML, brotli | 7,935 | shell probe |
| Shade tokens in the inline CSS, brotli | 1,288 | measured 2026-10-09 |
| boot chunk, brotli | 819 | probe island gate, 0.8 KB |
| Open Sans 400 to 600 | 19,712 | file |
| Glitch chunk, gzip (upper bound) | 2,560 | shell inventory, 2.5 KB |
| three r165 plus scene, brotli | 119,194 | 116.4 KB |
| pieces, shades, meta, brotli | 34,304 | 33.5 KB |
| Binaries, packed | 213,101 | 164,503 + 18,038 + 3,996 + 26,564 |
| Poster | 42,668 / 44,492 / 86,318 / 91,548 | phone AVIF / phone WebP / desktop AVIF / desktop WebP |
| Sky | 182,948 / 326,326 / 362,639 / 604,504 | portrait AVIF / portrait WebP / wide AVIF / wide WebP |
| Ground | 408,036 / 317,324 | 4096 AVIF / 2048 WebP |

| Class | Total | Against 1,500,000 B |
|---|---|---|
| Phone, AVIF | 1,032,565 B | pass |
| Desktop, AVIF | 1,255,906 B | pass |
| Phone, WebP-only | 1,087,055 B | pass |
| Desktop, WebP-only (Safari on macOS 12 and earlier) | 1,412,289 B | pass, 87,711 B headroom |

Without packing the binaries (318,634 B raw) the last row is 1,517,822 B, a fail; with gzip but without the delta coding it is 1,478,535 B. `budget.mjs` recomputes all four rows from the built files.

## 7. Loading sequence

### 7.1 Timeline, 3D path

1. **HTML arrives.** In the head, `Gate` sets `html.js`, the tier classes and `html.loading`. The inline CSS paints night, and the loader script starts its light band (compositor-driven). The poster and Open Sans preloads start at high priority.
2. **Body parse.** The loader builds its mask from the sprite. The countdown and cue script, last in the body, ticks once (revealing the numerals in the same task) and applies `inert` behind the loader.
3. **Modules, in document order.** The SiteLogo script installs the glitch. Then `boot.ts`:
   - runs the context check (section 8); a null context or a software renderer goes to the poster at once, before any island byte;
   - awaits `posterImg.decode()` (failure ignored), so the island never competes with the LCP bytes;
   - reads `currentSrc` for AVIF support and picks the class by aspect;
   - starts the data prefetch and `import('./hero/hero.ts')`.
4. **The chunk evaluates.** `startHero()` awaits `pieces.json`, reports `import`, then runs the order of section 5.3. The milestones feed the loader through `window.__skreedLoaderReport`.
5. **`frame2`.** The loader schedules its exit on the next light pass, then dims, outlines and lifts. The lift removes `html.loading` and `inert` and calls `window.__introDone()`. The hero's life ramps in over 2 s, the poster is hidden, and the logotype's intro burst runs.

Measured and calculated, not yet run end to end on the real stack: on Lighthouse 4G (1.6 Mbps, 150 ms RTT) the 72 KB phone critical set lands in about 1.2 to 1.5 s. The rest of the phone first view (about 960 KB) then takes about 4.7 s more. The loader covers that, and on a fast load it runs its own 8.2 s.

### 7.2 Loader bridge (the prod contract)

| Global | Direction | Purpose |
|---|---|---|
| `SKREED_POSE` | loader writes, module reads | `{cam: [0, -2.5, 24], tgt: [0, -1, 0], fov: 30, lw: 5.6, z: 0.475}` |
| `__skreedLoaderReport(m)` | module to loader | milestone names are the keys of `loader-weights.json` |
| `__skreedLoader` | `{setProgress, ready, cut, skip, fail, seek, state}` plus the port's `abort()` and `inert(on)` | `fail(msg)` puts the loader in its poster state; `abort()` ends it in any phase without a lift |
| `__skreedOnPoster(kind, msg)` | loader to `boot.ts` | the loader went to its poster state on its own (`stall` or `offline`) or through `fail` |
| `__introDone()` | module defines, loader calls at the lift | starts `live` and the logotype intro; no-op once the island is dead |
| `__heroStarted` | module sets on the first frame | ends the window where errors route to the poster |
| `__skreedLogo`, `__skreedLogoQ` | glitch install; hero queues into `__skreedLogoQ` if `__skreedLogo` is missing | `burst`, `intro`, `setTone` |
| `__skreedCountV`, `#count[data-hold]` | countdown | v10 slot |

All of them are typed in `src/env.d.ts`.

### 7.3 Failure model (`boot.ts`, spec D19)

**Soft poster** (the loader's own rules: 12 s without progress after `scene`, 20 s before it, offline before ready).
1. The loader's `poster(msg, kind)` runs: fill out, outline in, percent hidden, status set, `.po`, role removed, `html.loading` removed, `inert` removed, `hero3d` replaced by `poster`, then `__skreedOnPoster(kind, msg)`.
2. `boot.ts` `onSoftPoster(kind)`:
   - `fail` while the island is already dead came from `toPoster` itself and is ignored;
   - `fail` while the island is alive came from the Gate's module load-error catch, and is treated as a hard failure: `toPoster('module-load-error')`;
   - `stall` and `offline`: reset the riders (below) and add a passive `scroll` listener; the first `scrollY > 8` calls `toPoster('soft-then-scrolled')`, which makes it terminal.
3. The island keeps loading. If `frame2` arrives first, the loader's recovery branch replaces `poster` with `hero3d` and lifts; `__introDone` runs `life.recover()`, which removes the scroll listener. The track goes back to 460svh while `scrollY` is at most 8, so nothing jumps.
4. If the loader went to its poster state before `boot.ts` ran (offline at load), `boot.ts` reads `__skreedLoader.state().mode === 'poster'` at start and runs `onSoftPoster` itself.

**Hard poster** `toPoster(reason, err)`, terminal. In order:
1. Return if already dead. `life.kill(reason)` runs every disposer the island registered: loop stopped, IntersectionObserver, `resize`, pointer and scroll listeners removed, `renderer.dispose()` and `renderer.forceContextLoss()`. From here `report` and `__introDone` are no-ops and `startHero` stops at its next `check()`.
2. The loader, in any phase:
   - offline and the loader still in `load`: `__skreedLoader.fail(COPY.offline)` (the status line stays over the poster);
   - already in its poster state with a non-empty status (offline): left as it is;
   - every other case (load, exit, enter, seek, lift, or a soft poster with no status): `__skreedLoader.abort()`. No lift and no `__introDone` follow.
3. Read `y = scrollY` and the track's height, then on `html`: remove `loading`, `still3d`, `intro` and `uh1` to `uh4`; replace `hero3d` with `poster`.
4. Reset the riders (`scroll/ride.ts` `resetRiders`): remove the inline `transform`, `clip-path` and `visibility` of `#heroCopy` (and of any section 2 rider through `section2.dispose()`); remove `data-tone` from `#siteLogo`; empty `#labels` and remove its inline `visibility`; if an intro was installed, call `intro.skip('poster')`.
5. Remove `inert` from every element.
6. Scroll: if `y` was inside the hero's range (`y < trackBefore - innerHeight`), `scrollTo({top: 0, behavior: 'instant'})`; otherwise `scrollTo({top: y - (trackBefore - trackAfter), behavior: 'instant'})`, so the content the visitor was reading stays put.
7. Dispatch a synthetic `scroll` event, so the inline cue check recomputes the cue for the new page.
8. `console.warn('[hero] ' + reason, err)`.

`toPoster` is called on:
- the context check failing (before any island byte);
- an `import()` rejection or a rejected `startHero` (a chunk failure does not fire the window `error` event the prototype's `noHero` listened for);
- a rejected data fetch or a texture load error;
- a window `error` or `unhandledrejection` before `__heroStarted`;
- a renderer construction failure;
- `webglcontextlost` at any time (no restore attempt);
- a soft poster followed by a scroll past 8 px.

The Gate also keeps the prototype's capture-phase listener for a module script's load error (lines 255 to 258, minus the 8 s timer, which the loader's own stall rule replaces): before `__heroStarted` it calls `__skreedLoader.fail('')`. That covers a missing `boot.ts` chunk, when there is no `boot.ts` to route anything; the loader's `poster()` swaps the classes itself, so the page still lands on the poster layout.

### 7.4 Loader weights

The 23 weights in `prototypes/hero-v9/loader_weights.json` were measured with the data inlined as base64. Fetching the data changes the network milestones, so `scripts/hero/measure-weights.mjs` re-measures them on the stage 2 test build:
1. Record `performance.now()` at every report (hooks build: `__skreedMilestoneTimes`) over 5 runs at each viewport, with 4x CPU throttling (Lighthouse's mobile slowdown) through CDP.
2. Weight = mean interval before the milestone divided by the mean total, rounded to 0.01, with a floor of 0.01: the loader ignores a milestone whose weight is falsy (`if(manual||!WT[m]||got[m])return`, line 149), so a weight of 0 would never be marked received and `pend()` would stick on it. The largest weight absorbs the rounding so the sum is 1.
3. Assertions (kept from `build.py`, plus the floor): 23 keys; the first is `import`, the last is `frame2`; every weight is at least 0.01; the sum is 1 within 1e-9. A unit test runs the same assertions on the committed file.
4. Write `src/config/loader-weights.json`. The loader and the module both import it.

**Which pending keys read as network.** The loader shows "Slow connection" when the pending key ends in t, y or d (`/[tyd]$/`: `import`, `sky`, `ground`), otherwise "Still loading". The port keeps that rule and lines the waits up with it: `pieces.json` is awaited before `report('import')` (step 1), and the binaries are awaited at step 9, where `sky` or `ground` is pending. No `b1` to `b10` wait is ever a network wait.

Any later change to the warm-up groups, an extra milestone (v10 adds `intro`) or a change to the null-target `compileAsync` means re-running it.

### 7.5 Stopping the island

- An IntersectionObserver watches `#track`. When the track leaves the viewport (which can only happen once a section follows it), the loop stops and `#stage` is hidden. It restarts when the track returns. This keeps WebGL out of section 3 and beyond. `hero.ts` registers it with `life`.
- `requestAnimationFrame` already pauses in background tabs. The dt cap of 1/12 absorbs the resume.

## 8. Tiers

**Gate** (head, before first paint). The script string is `var CFG=<GATE JSON>;`, then the override file in test and staging builds, then `gate.inline.js`:

```js
// GATE in config/hero.ts: { reducedTier: 'poster', minMemory: 2, slowTypes: ['slow-2g', '2g'] }
(function () {
  var H = document.documentElement, c = H.classList; c.add('js');
  var t = window.__skreedTierOverride ? window.__skreedTierOverride() : '';   // defined only by the test and staging override file
  if (!t) {
    var n = navigator, k = n.connection || {}, rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    t = !('WebGL2RenderingContext' in window) || !('DecompressionStream' in window) || k.saveData === true ||
        CFG.slowTypes.indexOf(k.effectiveType) >= 0 || (n.deviceMemory !== undefined && n.deviceMemory <= CFG.minMemory) ||
        (rm && CFG.reducedTier === 'poster') ? 'poster' : rm ? 'still3d' : 'hero3d';
  }
  if (t === 'poster') c.add('poster'); else { c.add('hero3d', 'loading'); if (t === 'still3d') c.add('still3d'); }
  addEventListener('error', function (e) {           // the prototype's noHero, minus its timer
    var s = e.target; if (s && s.tagName === 'SCRIPT' && s.type === 'module' && !window.__heroStarted && window.__skreedLoader) window.__skreedLoader.fail('');
  }, true);
})();
```

`gate.tier-override.inline.js` (test and staging only) defines `window.__skreedTierOverride` from `?tier=poster|hero3d|still3d`. It is the only file containing `tier=`, which is what the production guard greps for.

Without JavaScript nothing is added, and the default CSS is the poster layout.

**`boot.ts` context check** (before the poster wait and before any island byte):

```ts
function hardwareGL(): boolean {
  const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
  if (!gl) return false;                                       // --disable-3d-apis, blocklisted GPUs, caveat
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return !SOFTWARE_GL.test(name);                              // /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i
}
```

- Checked on 2026-10-09 with the Chromium in `/opt/pw-browsers/chromium-1194`: headless, with or without the SwiftShader flags, returns a context for `failIfMajorPerformanceCaveat: true` whose renderer is "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)...), SwiftShader driver)". With `--disable-3d-apis` the constructor exists but no context is returned. So the attribute alone does not catch software GL here; the renderer string does.
- In test and staging builds, a forced `?tier=hero3d` or `?tier=still3d` skips this check, so the SwiftShader harness still runs the 3D path. The branch is `import.meta.env.PUBLIC_HERO_HOOKS === '1' && ...`, which Vite folds away in production.
- `hardwareConcurrency` is not used (spec D3). A frame-time probe is out of scope.

## 9. three.js version

Pin `three@0.165.0`. The readers measured:
- **Look.** r186's `UnrealBloomPass` changed in three ways:
  - blur kernels: [3, 5, 7, 9, 11] with sigma equal to the kernel, became [6, 10, 14, 18, 22] with sigma a third of it;
  - composite: alpha-weighted, so the added light scaled with strength squared, became `3 * strength * rgb`, premultiplied;
  - high-pass luma: (0.299, 0.587, 0.114) became Rec. 709.

  At strength 0.5 that is roughly twice the glow at the core, with longer tails.
- **Size.** r165 tree-shaken with the six addons is 119.3 KB gz. r186 is 134.1 KB gz, 14.8 KB gz more.
- **Clock.** `THREE.Clock` is deprecated from r183 and warns.

The r186 upgrade is its own task:
1. Vendor r165's `UnrealBloomPass.js` and `LuminosityHighPassShader.js` (MIT, header kept) as `post/UnrealBloomPassR165.ts`.
2. Replace `THREE.Clock` with a `DeltaClock` with the same semantics (lazy start, first delta 0).
3. Pass the AC1 stage 1 diff against the r165 build.

The ShaderChunks the ground and stones patch are compatible between the two versions (3D inventory, parity register).

## 10. Tune panel, test hooks and build flags

| Build | Command | `PUBLIC_HERO_HOOKS` | `PUBLIC_TUNE` | `PUBLIC_STAGING` | Used for |
|---|---|---|---|---|---|
| dev | `astro dev` | 1 | 1 | 0 | local work; Tune opens with `?tune` |
| test | `npm run build:test` | 1 | 0 | 0 | Playwright parity and e2e, poster renders, weights |
| staging | `npm run build:staging` | 1 | 1 | 1 | Sam's review on the staging Worker; noindex |
| production | `npm run build` | 0 | 0 | 0 | skreed.in, Lighthouse, budgets, guards |

- **Processed code** (`boot.ts`, `hero/**`, `logotype/**`) reads the flags as `import.meta.env.PUBLIC_*` inside `if` blocks that Vite folds at build time, so the production bundle contains no Tune code and no hook.
- **Inline scripts** never see `import.meta.env`. Their components assemble them in the frontmatter (section 4.3): config is prepended as JSON, and the `tier=` override is concatenated only when `PUBLIC_HERO_HOOKS` is '1'.
- **Components** (`dev/Tune.astro`, `dev/AfterTrackFiller.astro`) render only under their flag.
- `scripts/guards.mjs` greps `dist/` after the production build and fails on any of: `tuneReset`, `tier=`, `__skreedSolo`, `__skreedState`, `__skreedFreeze`, `__skreedFrame`, `__skreedProject`, `__skreedFloorCheck`, `__skreedParams`, `__skreedStall`, `__skreedLoseContext`, `__skreedSkyClass`, `__skreedIntroDoneCalls`, `__skreedDead`, `__skreedMilestoneTimes`; a base64 `data:` URI (`/data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+\/]{16}/`) in `dist/_astro/*.js`; `cdn.jsdelivr.net`; `fonts.googleapis.com`; the banned font names; emoji; U+2014 in shipped copy; `sk_`, `shpat_`, `service_role`.
- **Tune.** `dev/tune.ts` is the prototype's slider loop, buttons and `apply()` (lines 303 to 311, 1052 to 1071), dynamically imported only when `PUBLIC_TUNE` is '1' and `?tune` is in the URL. Every lookup is null-guarded (the prototype's `$('ghost')`, `$('glitchNow')`, `$('tuneReset')`, `$('glitchSplit')` and `$('glitchIdle')` would throw without the panel). It drives a mutable dev copy of `HERO_PARAMS`, so Sam can tune on staging and hand the numbers back for `params.ts`. It can switch the idle twitch on for comparison.
- **Hooks**, with the prototype names kept for the harness:
  - `__skreedState()`, `__skreedSolo(i)`, `__skreedFloorCheck()`, `__skreedProject(i, px, py, back)`, `__skreedFrame`, `__skreedFreeze` (read in F2);
  - new: `__skreedParams()`, `__skreedMilestoneTimes`, `__skreedLoseContext()` (`WEBGL_lose_context`), `__skreedStall(milestone | null)` (holds the warm-up before that milestone; `null` releases), `__skreedSkyClass()`, `__skreedIntroDoneCalls` (incremented inside `__introDone`), `__skreedDead` (mirrors `life.dead`).

## 11. Slots for work happening elsewhere

### 11.1 The igloo intro (v10, `scratchpad/proto/template_v10.html`)

```ts
// src/scripts/hero/intro/types.ts
export interface IntroDirector {
  readonly milestones: readonly string[];              // v10: ['intro'], appended to the loader weights (re-measure, section 7.4)
  readonly rendererOptions?: Partial<THREE.WebGLRendererParameters>; // v10: {antialias: false, depth: false, stencil: false}
  readonly slots: HeroShaderSlots;                     // logo frag (uPrint, uPrintCol, tTri, print band, alpha 'am'),
                                                       // ground and stones color_fragment patch, sky (uFlat, uSkyP, uSkyB), composite (uIntro)
  readonly ownsIntroDone?: boolean;                    // v10 calls __introDone itself when there is no loader
  install(ctx: HeroContext): void;                     // cage lines, outline, numbers Points; FOG.uOpacity; bloom overrides; sceneA.background;
                                                       // html.intro and uh1..uh4, the touchmove blocker; all registered with ctx.life
  start(t: number): void;                              // at the loader cut, instead of the v9.9 live ramp
  update(t: number, dt: number, ctx: HeroContext): IntroFrame; // {live?, breath?, touch?, camera?, uiPhase?, scrollLocked?}
  reportFrames?(f: FrameCtx, report: (m: 'frame1' | 'frame2') => void): void; // v10: frame1 and frame2 from its GPU fence (clientWaitSync)
                                                       // instead of the default texFrames rule (F15)
  skip(reason: 'reduced' | 'param' | 'hash' | 'poster'): void; // v10 SKIP rule (reduced motion, ?intro=0, location.hash), and the poster
                                                       // hand-over: toPoster calls skip('poster') and removes html.intro and uh1..uh4
}
export const NO_INTRO: IntroDirector;                  // v9.9 behaviour
```

Hooks the shell already leaves for the intro:
- the `html.intro` and `uh1` to `uh4` class names, cleared by `toPoster`;
- `#count[data-hold]` and `__skreedCountV`;
- the prototype's sibling order for the `.intro.po ~ ...` selectors (D17);
- `__skreedOnPoster` and `life`, so the intro sees a soft or hard poster;
- a `patches` list on the ground and stones materials (`onBeforeCompile` chain with explicit cache keys);
- `renderOrder` and `transparent` overridable on both.

### 11.2 Section 2, the rocks (`scratchpad/proto/template7.html`)

```ts
// src/scripts/hero/section2/types.ts
export interface Section2Scene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  readonly composer: PlainComposer;            // v9.9: RenderPass + OutputPass under NoToneMapping
  readonly scrollSegments: ScrollSegment[];    // v9.9: []; rocks: DWELL 1 (phone 1.5), WIPE2 1, then 1
  readonly compositeSlots?: CompositeSlots;    // rocks: modes 0 to 3, tR, uRide, uRockFade, uTopFade
  readonly logoVertexSlot?: string;            // rocks: the logo morph into the rock pose (view-space uOff and uQ)
  install(ctx: HeroContext): void;             // rocks: sceneR rendered through camA into its own linear target; sceneB becomes the fog
  resize(w: number, h: number, aspect: number, portrait: boolean): void;
  update(f: FrameCtx): void;
  pump?(budgetMs: number): void;               // rocks: idle build budget of 4, 12 or unlimited ms by scroll
  dispose(): void;                             // also clears its DOM riders' inline styles (toPoster step 4)
}
```

`SCROLL_MAP` is data: `[PULL 1.5, WIPE 1.0, ...section2.scrollSegments]`. The track height is set from it; it is 460svh in v9.9.

The DOM riders slot takes `#s2Copy` with the copy clip under the logo.

**Sky crop check.** The stage 2 sky crops assume the hero camera's views. Before the rocks ship, the sky UV probe (`scripts/hero/probes/skyuv.mjs`) is re-run with the section 2 and intro cameras. If they see sky outside u 0.127 to 0.871 or v 0 to 0.651, the crops widen.

### 11.3 Section 3, the Wall

- It is DOM, never WebGL (CLAUDE.md).
- It mounts in the `after-track` slot inside `main#main`. The hero exposes `onStageExit(cb)` from the IntersectionObserver for template7's `.wall.is-fixed` hand-off (`margin-top: -100svh`).
- It decides the page's root background below the hero (D24) and whether the poster path keeps the cue (D27 shows it once something follows).
- GSAP, ScrollTrigger and Lenis arrive with it. Lenis must not smooth the hero's track range: either it is disabled until the track ends, or the hero keeps reading native `scrollY`. Otherwise the pull-back gets a third smoother.
- `motion.ts` then wraps `gsap.matchMedia()` so reduced motion has one source.

## 12. Cloudflare Workers + Static Assets

### 12.1 `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "skreed-teaser",
  "compatibility_date": "2026-10-06",
  "assets": { "directory": "./dist", "not_found_handling": "404-page", "html_handling": "auto-trailing-slash" },
  "env": {
    "staging": {
      "name": "skreed-teaser-staging",
      "assets": { "directory": "./dist", "not_found_handling": "404-page", "html_handling": "auto-trailing-slash" }
    }
  }
  // After A1 (nameservers on Cloudflare), production adds:
  // "routes": [ { "pattern": "skreed.in", "custom_domain": true }, { "pattern": "www.skreed.in", "custom_domain": true } ]
  // With /api/* (Reserve section): "main", and "assets.run_worker_first": ["/api/*", "/r/*"]
}
```

- `compatibility_date` is 2026-10-06: the workerd bundled with wrangler 4.149.0 (1.20261006.1) supports dates up to that day.
- There is no adapter, no KV and no Images binding: nothing needs provisioning before the first deploy. `404-page` serves `dist/404.html` once the 404 page exists (G1).
- Production deploys use `npx wrangler deploy --env=""` (the top-level environment, explicitly; without it wrangler warns that no target environment was given). Staging uses `--env staging`.
- Verified by the critics: this config passes `wrangler deploy --dry-run`; Astro 7.3.8 static output without an adapter goes straight to `dist/`; `dist/_headers` is parsed and applied to `/`, `/_astro/*` and `.bin` responses, and is not itself served.

### 12.2 Headers

`public/_headers` holds the static rules. `scripts/csp.mjs` runs after `astro build` and appends the CSP line to the `/*` rule in `dist/_headers`.

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), gyroscope=(), accelerometer=(), magnetometer=()
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: (generated)
/
  Cache-Control: public, max-age=0, s-maxage=60
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=2592000
```

- **HTML** follows `00-IDEATION.md`: `max-age=0, s-maxage=60`. Each later HTML route adds its own exact-path rule, so no two `Cache-Control` rules match one path.
- **Hashed assets** (scripts, textures, packed binaries, posters, `pieces.json`) are immutable.
- **Fonts** keep their fixed `/fonts/` URLs (type-system.md), so they get one month instead of immutable. A changed font file gets a new name.
- **HSTS** is one year, with no `includeSubDomains` and no `preload`, because skreed.in redirects to skreed.com after 31 October.
- **Permissions-Policy** gets `gyroscope=(self)` when the tilt card ships, and `camera=(self)` only if the week-two camera ships.

### 12.3 CSP (what the hero needs and why)

```
default-src 'self';
script-src 'self' 'sha256-<gate>' 'sha256-<loader>' 'sha256-<countdown>' <any other inline script Astro emits>;
style-src 'self' 'sha256-<each inline <style>>';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self';
base-uri 'none'; form-action 'self'; frame-ancestors 'none';
upgrade-insecure-requests
```

**Why each source is allowed.**
- `img-src data:`: the loader builds its wordmark mask as an SVG `data:` URL at runtime.
- `connect-src 'self'`: the binaries, `pieces.json` and `ImageBitmapLoader` all use `fetch`. `DecompressionStream` needs nothing more.
- No `'unsafe-eval'`, no `'wasm-unsafe-eval'` (no Basis or KTX2), no `blob:`, no workers (the OffscreenCanvas lever of section 16 would add `worker-src 'self'`).
- Scripts that set `element.style.*` (loader mask, ride, labels, glitch opacity and ghost colours) are CSSOM writes, which CSP allows. Markup `style` attributes are not allowed, and `csp.mjs` fails the build if one appears. SVG presentation attributes the glitch sets (`opacity`, `transform`, `display`) are not style attributes.
- Verified by the critics under wrangler dev: this CSP with hashes allows three r165 WebGL2, EffectComposer and bloom, `compileAsync`, `ImageBitmapLoader`, `TextureLoader`, the `.bin` fetches, the `data:` SVG mask, CSSOM style writes and Web Animations, with zero violations.

**Why a post-build script and not Astro's CSP.** Astro 7's `security.csp` writes a `<meta>` tag, does not hash `is:inline` scripts, and cannot carry `frame-ancestors` (browsers ignore it in a meta tag). Any byte change to an inline script changes its hash, so `csp.mjs` runs on every build.

**Guards in `csp.mjs`.**
- wrangler 4.149's `_headers` parser drops any line longer than 2000 characters (`MAX_LINE_LENGTH`), silently. `csp.mjs` fails the build when the generated CSP line is longer than 1900 characters.
- `--report-only` writes `Content-Security-Policy-Report-Only` instead. The first production deploy uses it (section 15); every other build enforces.
- `tests/e2e/csp.spec.ts` asserts that the header is present on `/` before it counts violations, so a dropped header cannot pass as "zero violations".

**Zone settings to turn off on skreed.in** (each injects a script that a hash-only CSP blocks; staging on workers.dev cannot show this):
- Rocket Loader;
- Email Address Obfuscation (Scrape Shield);
- Bot Fight Mode's JavaScript detections;
- Web Analytics automatic setup (until the CSP allows `static.cloudflareinsights.com`).

**Later additions, each in its own section:**
- Turnstile: `script-src` and `frame-src https://challenges.cloudflare.com`.
- PostHog: its ingest host in `connect-src`.
- Cloudflare Web Analytics: `static.cloudflareinsights.com` in `script-src` and `cloudflareinsights.com` in `connect-src`.

**Local verification.** `npx wrangler dev` serves `dist/` with `dist/_headers`. `curl -sI http://127.0.0.1:8787/` and a fetch of one `/_astro/` file show every header.

## 13. Test plan and harness

### 13.1 Harness (`tests/harness/`)

The harness is ported from the readers' scratch scripts (copied to `scripts/hero/probes/` in build step 1: `render.mjs`, `compare2.py`, `poster.py`, `sizes.mjs`) and `prototypes/hero-v9/shot.mjs`.

- **`browser.ts`.**
  - Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` here; in CI the browser `npx playwright install chromium` provides. Launch args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
  - Three contexts:
    - phone canvas captures: 390 x 844 at deviceScaleFactor 1.25 (drawing buffer 487 x 1055, screenshot 488 x 1055), as the asset probe measured;
    - phone behaviour: 390 x 844, `isMobile`, `hasTouch`, deviceScaleFactor 2;
    - desktop: 1280 x 800, deviceScaleFactor 1.5, buffer and screenshot 1920 x 1200.
  - `servePrototype(ctx)`:
    - fulfils `https://proto.test/` with `prototypes/hero-v9/index.html` (read-only, tracked in git);
    - routes `cdn.jsdelivr.net/npm/three@0.165.0/*` to the port's own `node_modules/three` (same version);
    - fulfils `fonts.googleapis.com` with a stylesheet whose `@font-face` points at `public/fonts/open-sans-400-600-latin.woff2`, so both pages draw text with the same file;
    - aborts everything else.
  - The prototype URL carries the locked values and `logoIdle=0` (`hero.md` section 0).
  - The port is the test build served by `npx wrangler dev` on `127.0.0.1:8787`, with `?tier=hero3d` or `?tier=still3d` for 3D cases. The production build is used only for AC8.1's production case, the guards, the budgets and Lighthouse.
- **`settle.ts`.**
  - `waitReady(page)`: loader `state().ready` and `__skreedFrame` above 3.
  - `settleScroll(page, screens)`: `scrollTo`, then wait until `__skreedState().sb` equals the target at 4 decimals.
  - `freeze(page)`: set `__skreedFreeze`, then wait 2 frames.
  - `pinRandom(ctx)`: an init script that sets `Math.random = () => 0.5`.
  - `fixDate(page, iso)`: `page.clock.setFixedTime`.
  - `pauseCue(page)`: the cue's animations paused at time 0.
  - `sameBackground(page)`: injects `html, body { background: #000 }` on both pages for the overlay comparison (D24 made the port's body night where the prototype's was Urban Slate).
- **`canvas.ts`.** Hides `#intro, .site-logo, .copy, .cue, .tune, .labels, .fallback, .hero-poster`, then takes a screenshot of `#stage`.
- **`compare.py`.** PSNR and SSIM overall, sky band (top 40 percent) and ground band (bottom 35 percent), as `compare2.py`. It takes thresholds as arguments, exits non-zero on a miss, and writes an x8 difference map next to the frames.
- **Filler.** Test builds render `dev/AfterTrackFiller.astro` in the after-track slot.

### 13.2 Specs

| Spec | Covers | Method |
|---|---|---|
| `tests/unit/**/*.test.ts` (`node --test "tests/unit/**/*.test.ts"`) | maths helpers, `mapScroll`, `clipFor`, wipe texture checksum against the prototype function, shades by id, tokens against `DESIGN.md`, weights (23 keys, order, floor 0.01, sum 1), bins round trip, sprite paths | pure functions |
| `parity/rest.spec.ts` | AC1.2 | freeze before load; canvas frames in normal motion and in reduced motion with `?tier=still3d`; both viewports; stage thresholds |
| `parity/overlay.spec.ts` | AC1.3 | canvas and poster hidden, same background, fixed date, same font, cue paused, random pinned; identical |
| `parity/pullback.spec.ts` | AC2.1 | `__skreedState().cam` at 0, 0.375, 0.75, 1.125 and 1.5 screens |
| `parity/wipe.spec.ts` | AC2.2 and AC2.3 | reduced motion, `still3d`, random pinned, tp 0.5 and 1; ride strings; tone; cue |
| `parity/loader-frames.spec.ts` | AC3.1 | `.ld-w` screenshots at nine `seek(t)` times |
| `e2e/locked-values.spec.ts` | AC1.1 | `__skreedParams()` against `hero.md` section 0 and `logoIdle` 0 |
| `e2e/stopping.spec.ts` | AC2.4 | filler; `__skreedFrame` before and after the track leaves; `#stage` hidden |
| `e2e/loader.spec.ts` | AC3.2, AC3.3, AC3.10, AC3.11 | milestone order and monotonic progress; delayed sky and `pieces.json` routes for "Slow connection"; `__skreedStall('c3')` for "Still loading"; `inert` set and cleared; Tab order while loading; `/#x` keeps its scroll |
| `e2e/failures.spec.ts` | AC3.4 to AC3.9 | `__skreedStall('c1')` past 12 s then release, with and without a 9 px scroll; `context.setOffline(true)` before ready and the three bounding boxes at 360 x 780, 390 x 844 and 1280 x 800; abort of the hero chunk; `__skreedLoseContext()` in the `exit` and `enter` phases and at tp 0.5; `__skreedIntroDoneCalls`, `__skreedDead`, rider styles, `data-tone`, `#labels`, `inert`, scroll position |
| `e2e/countdown.spec.ts` | AC4 | `page.clock` at three instants; computed `display` of `#count` at zero; the link's `pointer-events`, `elementFromPoint`, hit box and navigation; type, roles; JavaScript disabled; WebGL2 removed; chunk blocked; contrast sampled under the eyebrow, labels, cue label and numerals |
| `e2e/cue-logotype.spec.ts` | AC5 | cue keyframes and the 2.44 iterations; cue classes at scroll 9 px, with and without content below, during the wipe and while loading; logotype href, label, hit box; two-tone ring contrast at tone dark and light; click scroll; glitch slab count, ghost fills by `var(--shade-<id>)` and computed colour; no burst in 20 s without input; poster-tier intro at 0.75 s; no burst after failures; reduced motion emulated after load |
| `e2e/hover.spec.ts` | AC6 | the prototype's 40-move routine on both pages; `d` above 0.1; `__skreedFloorCheck()`; label count, readouts and hiding; ghost timing on touch; `th` and `ph` series on both pages for mouse and held touch |
| `e2e/tiers.spec.ts` | AC7, AC8.1 to AC8.5 | init scripts for WebGL2 removed, `DecompressionStream` removed, `saveData`, `effectiveType` 2g, `deviceMemory` 2; `--disable-3d-apis`; the production build in headless Chromium; reduced motion; aborted chunk; `__skreedLoseContext()`; network log asserts no island requests on the tier cases; poster markup, one poster request per viewport, sizes; track 100svh; poster scrolls away with the filler |
| `e2e/sky-class.spec.ts` | AC8.6 | 390 x 844 then 844 x 390 after `ready`; one wide request; `__skreedSkyClass()`; frame against a fresh wide load under `still3d` |
| `e2e/csp.spec.ts` | AC10.5 | header present on `/`; `securitypolicyviolation` listener on every path, under `wrangler dev`; with `BASE_URL` set it runs against a deployed host (section 15) |
| `e2e/a11y-breakpoints.spec.ts` | AC10.3 and AC10.4 | one h1, first in reading order; `aria-hidden` on canvas and labels; no horizontal scroll and 16 px gutters at 360, 390, 430, 768, 1024 and 1280; tap targets; nothing animated in `dvh` |
| `scripts/budget.mjs` | AC9 | gzip level 9 and brotli quality 11 sizes of `dist/` files (method of `sizes.mjs`); the four first-view classes of section 6.6 in bytes; asserts `hero.md` section 6 |
| `scripts/guards.mjs` | AC10.6 | greps `dist/` (section 10) |
| `scripts/lighthouse.mjs` | AC10.1 | section 16 |

**Screenshots** for the reviewer (B1):
- 3D path at rest: `docs/specs/screenshots/hero-390.png` and `hero-1280.png`;
- poster path: `hero-390-poster.png`;
- the prototype at the same moment for side by side: `hero-390-proto.png` and `hero-1280-proto.png`;
- the x8 difference maps: `hero-390-diff.png` and `hero-1280-diff.png`.

**Known limits.** Headless Chromium renders WebGL with SwiftShader. Pixel parity is exact because both pages use the same renderer. Timing numbers from SwiftShader are not representative of phones (section 16).

## 14. CI (`.github/workflows/ci.yml`)

```yaml
name: ci
on:
  pull_request:
  push: { branches: [main] }
  workflow_dispatch:
    inputs:
      deploy: { type: choice, options: [none, staging, production], default: none }
permissions: { contents: read }
jobs:
  verify:
    runs-on: ubuntu-24.04
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@<pinned sha>          # fetch-depth 0 for gitleaks
      - uses: gitleaks/gitleaks-action@<pinned sha>  # security checklist row 4
      - uses: actions/setup-node@<pinned sha>        # node-version 22.22.0, cache npm
      - uses: actions/setup-python@<pinned sha>      # python 3.12
      - run: pip install pillow==12.3.0 numpy
      - run: npm ci
      - run: npm audit --omit=dev                    # row 18
      - run: npx playwright install --with-deps chromium
      - run: npm run test:unit
      - run: npm run build:test
      - run: npm run test:e2e && npm run test:parity # both start wrangler dev as the Playwright webServer
      - run: npm run build                           # production: astro build, then scripts/csp.mjs
      - run: npm run guards && npm run budget
      - run: npm run lighthouse                      # CHROME_PATH from Playwright's chromium; section 16
      - uses: actions/upload-artifact@<pinned sha>   # screenshots, diff maps, Lighthouse JSON, Playwright report
  deploy:
    needs: verify
    if: github.event_name == 'workflow_dispatch' && inputs.deploy != 'none'
    environment: ${{ inputs.deploy }}               # GitHub environments with Sam as required reviewer
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@<pinned sha>
      - uses: actions/setup-node@<pinned sha>
      - run: npm ci
      - run: npm run ${{ inputs.deploy == 'staging' && 'build:staging' || 'build' }}
      - run: npx wrangler deploy ${{ inputs.deploy == 'staging' && '--env staging' || '--env=""' }}
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**`package.json` scripts:**
- `build`: `astro build && node scripts/csp.mjs`.
- `build:test`, `build:staging`: the same, with the env flags of section 10.
- `test:unit`: `node --test "tests/unit/**/*.test.ts"` (Node 22.22.0 treats a bare directory argument as a module path and fails; the quoted glob works, and Node strips the types itself; verified 2026-10-09).
- `test:e2e`, `test:parity`: `playwright test --project ...`.
- `guards`, `budget`, `lighthouse`.
- `ci`: all of the above in the workflow's order, so the same gate runs locally without a push.

**`dependabot.yml`:** weekly npm and GitHub Actions updates.

Deploys are manual dispatches only. Nothing deploys on push until Sam turns it on. Stage 1 builds are never deployed (D7).

**Before any push to main** (CLAUDE.md): `/web-design-guidelines` and the security checklist rows that apply. For a static page these are rows 1, 4 and 18.

## 15. Deployment

There are no Cloudflare credentials in this environment.

**Prerequisites:**
- A1: skreed.in's nameservers on Cloudflare (Prem).
- A2: a Cloudflare API token with Workers deploy rights, and the account id. Stored as GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` and as environment secrets here, never in the repo.

**Steps:**
1. **Locally, before any token.** `npm run build && npx wrangler deploy --env="" --dry-run` validates the config and the assets. `npx wrangler dev` serves the production build with the real headers.
2. **Staging (needs A2).** Dispatch the workflow with `deploy: staging`, or run `npm run build:staging && npx wrangler deploy --env staging` with the two variables set. It is served on the account's `workers.dev` subdomain with noindex. Then check:
   - every header with `curl -sI`, and the CSP line present;
   - brotli on `.js` and no `Content-Encoding` on the packed `.bin` files (section 6.3);
   - a Lighthouse run against staging;
   - the real-device trace of section 16 on Sam's phone; this is also where the v9.8 stray-line check on a real GPU happens;
   - Sam's look on his phone and laptop.
3. **Production (needs A1 and A2).**
   - Turn off the zone settings of section 12.3 on skreed.in.
   - Add the two custom-domain routes to `wrangler.jsonc`, build with `node scripts/csp.mjs --report-only` and dispatch `deploy: production` (`wrangler deploy --env=""`). Workers custom domains create the DNS records and the certificate on the zone. Turn on "Always Use HTTPS".
   - Run `BASE_URL=https://skreed.in npx playwright test e2e/csp.spec.ts`: the report-only header is present and no violation is reported on any path.
   - Deploy again with the enforcing CSP, and run the same spec.
4. **Rollback.** `npx wrangler rollback` to the previous version, or re-dispatch an earlier commit.
5. **Cutover (G20, not this section).** A Single Redirect rule `skreed.in/* -> https://skreed.com/$1`, 302 for about ten minutes of testing, then 301, at 31 October 23:59 IST. It is rehearsed a week early on a staging hostname. The teaser stays deployed for rollback. The exceptions for `/r/<code>` and `/thanks` are still undecided.

## 16. Lighthouse (C4) and the main thread (spec D23)

**What was measured.** On the prototype in Playwright's Chromium 1194 with SwiftShader: long tasks of 348, 366, 1000, 117 and 111 ms, and an unthrottled TBT of about 1.9 s; Lighthouse's 4x CPU slowdown makes it worse. Without the SwiftShader flags every render-loop frame is a task of 0.9 to 1.1 s. A TBT of 1.9 s scores about 0.05, which caps the performance score near 71 even with perfect FCP, LCP, CLS and Speed Index. The 4096 ground upload alone is about 1.1 s CPU on SwiftShader. None of this is a phone number, and there is no GPU here.

**The graded run.** `scripts/lighthouse.mjs`:
1. Starts `npx wrangler dev --port 8787` on the production build and waits for `/` to answer 200.
2. Runs `npx lighthouse http://127.0.0.1:8787/ --only-categories=performance --output=json --chrome-flags="--headless=new --no-sandbox"` three times with `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` here (Playwright's `chromium.executablePath()` in CI). Lighthouse 13.5.0's defaults are the mobile form factor with simulated throttling.
3. Takes the median run by performance score and asserts: performance at least 90, LCP at most 2.5 s, TBT at most 200 ms, Speed Index at most 3.4 s, CLS at most 0.1.
4. Writes all three runs to `docs/specs/screenshots/hero-lighthouse.json`.

In that browser the page takes the poster tier, because `boot.ts` finds a software renderer (section 8); `tests/e2e/tiers.spec.ts` proves that with the same binary and flags. The graded number is therefore the poster tier's. The reviewer grades this number.

**Recorded, not graded.**
- The same three runs against the test build at `?tier=hero3d`, with the SwiftShader flags added, saved under `hero3d_swiftshader` in the same JSON.
- On staging (needs A2): a performance trace of the 3D path on Sam's phone through Chrome remote debugging, recording LCP, the longest main-thread task, the total blocking time from first paint to `frame2`, and the time to `frame2`. Recorded in `hero.review.md`. Under exception E-C4 this trace is the substitute gate; its thresholds are Sam's to set.

**If Sam declines E-C4**, these levers apply in this order, each gated by AC1 and a weights re-measure:
1. D8: `ImageBitmapLoader`, so texture decode leaves the main thread (already planned; this makes it required).
2. Upload the 4096 ground in tiles across frames (`texSubImage2D` per tile with a yield between, mipmaps generated once at the end), so no single task holds the whole upload.
3. Split `buildLogoGeometry` and the ground mesh build into smaller chunks between yields (each block already yields once).
4. Last resort: render the island in a worker through `canvas.transferControlToOffscreen()`, with the DOM ride, the labels and pointer input over `postMessage`, and `worker-src 'self'` in the CSP. It keeps the same GL calls but changes where the one-frame camera lag is read, so it needs its own parity pass.

## 17. Build order

Each step lists its commands and its exit check. A step starts only when the previous exit check passes. Paths are relative to the repo root. `SCR=/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad`. This run does not commit or push (task brief); the ship-section loop's commit on PASS is left to Sam.

**Step 1. Preserve the scratch inputs.** First, because the scratchpad dies with the session.
```sh
mkdir -p assets-src/hero/masters scripts/hero/probes/density docs/specs/evidence
cp "$SCR/land/moon_igloo/sky.png" "$SCR/land/moon_igloo/ground_bake.png" assets-src/hero/masters/
(cd assets-src/hero/masters && sha256sum sky.png ground_bake.png > SHA256SUMS)
cp "$SCR"/port/scripts/{render.mjs,compare2.py,poster.py,sizes.mjs,texladder.py,variants.py,variants_prop.py,verify_src.py,extract.py,decode.mjs,render_missing.sh,shell.py} scripts/hero/probes/
cp "$SCR/port/bundle-probe/three-0.165.0/skyuv.mjs" scripts/hero/probes/
cp "$SCR"/port/tex-probe/density/{run.mjs,page.html} scripts/hero/probes/density/
cp "$SCR/port/LOCKED_VALUES.md" docs/specs/evidence/LOCKED_VALUES.md
printf '%s\n' '.wrangler/' 'test-results/' 'playwright-report/' 'assets-src/hero/masters/*.png' >> .gitignore
```
`verify_src.py` has the scratch paths written in; edit its `L` to `assets-src/hero/masters` and `A` to `prototypes/hero-v9/assets`.
Exit: `(cd assets-src/hero/masters && sha256sum -c SHA256SUMS)` passes; `python3 -I scripts/hero/probes/verify_src.py` prints IDENTICAL for `sky` and `ground_bake`.

**Step 2. Scaffold with exact pins.**
```sh
npm init -y
npm i -E astro@7.3.8 three@0.165.0
npm i -E -D typescript@5.9.3 @types/three@0.165.0 @astrojs/check@0.9.10 wrangler@4.149.0 @playwright/test@1.56.1 lighthouse@13.5.0
```
Then write `package.json` scripts (section 14), `astro.config.mjs` (section 4.1), `tsconfig.json`, `wrangler.jsonc` (section 12.1), `public/_headers` (section 12.2), a one-line `src/pages/index.astro`, and one smoke test in `tests/unit/`.
Exit: `npx astro build` succeeds and writes `dist/index.html`; `npx wrangler deploy --env="" --dry-run` succeeds; `npm run test:unit` passes; `npx astro check` runs (or is dropped and recorded, section 2); `grep -c '"\^' package.json` is 0.

**Step 3. Data and generators.**
- `node scripts/hero/copy-stage1-assets.mjs` (writes `src/assets/hero/` and `SHA256SUMS`).
- `node scripts/hero/gen-shades.mjs` (writes `src/config/shades.gen.ts` and `src/styles/shades.gen.css`).
- `config/hero.ts`, `config/copy.ts`, `config/params.ts`, `config/tokens.ts`; `loader-weights.json` starts as a copy of `prototypes/hero-v9/loader_weights.json`.
Exit: unit tests pass for the manifest, the shades (240, 24 per family; the block, galaxy and glitch shades by id equal `hero.md` section 3), the 240 tokens (7,855 B raw), the params (13 locked values, `logoIdle` 0), the tokens against `DESIGN.md`, and the weights assertions.

**Step 4. Shell (poster path complete).** `tokens.css`, `fonts.css`, `shell.css` with the edit list of section 4.4; `Base.astro`; `Gate`, `WordmarkSprite`, `SiteLogo` with `glitch.ts` and `install.ts`, `HeroPoster`, `HeroStage` (no boot yet), `Countdown`, `ScrollCue`, `AfterTrackFiller`, `Tune`; the inline files with the changes of section 4.3. Provisional posters: `node scripts/hero/render-poster.mjs --prototype` then `python3 -I scripts/hero/encode-poster.py` (section 6.4, item 1). `scripts/csp.mjs`.
Exit: on `npm run build:test` under `wrangler dev` with `?tier=poster`: AC1.3 overlay parity, AC4 (except the contrast sample on the canvas), AC5 (except the 3D tone parts), AC8.2, AC8.4 markup and single request, AC10.3 and AC10.4 pass; zero CSP violations with the header present.

**Step 5. Loader.** `loader.inline.js` with the seven deviations of section 4.3.
Exit: AC3.1 (pixel-identical `.ld-w` at the nine seek times, both viewports); AC3.10 and AC3.11.

**Step 6. Island modules in start-up order.** `util/*`, `bridge/*`, `data/*` (stage 1: raw binaries, no inflate), `gfx/renderer.ts`, `logo/*`, `world/*` (full prototype sky extents), `post/*`, `section2/*`, `intro/*`, `interaction/*`, `camera/rig.ts`, `scroll/*`, `stage/resize.ts`, `warmup.ts`, `loop.ts`, `hero.ts`, then `boot.ts` and the boot `<script>` in `HeroStage`. Unit tests alongside: maths, `mapScroll`, `clipFor`, the wipe texture checksum against the prototype function.
Exit: the test build at `?tier=hero3d` reaches `frame2` and lifts at 390 x 844 and 1280 x 800 with zero console errors; the 23 milestones arrive in order; the unit tests pass.

**Step 7. Harness.** `tests/harness/*` from the probes; `compare.py` from `compare2.py`; `servePrototype` with the locked values and `logoIdle=0`.
Exit: the prototype against itself through the new harness gives PSNR 99 at both viewports (the noise floor).

**Step 8. Stage 1 parity gate.** AC1.1, AC1.2 (stage 1: PSNR 99, normal and `still3d`, both viewports), AC1.3, AC2.1 to AC2.3, AC6. D8 is decided here: run AC1.2 with `ImageBitmapLoader`; if any frame differs, switch to `TextureLoader` and re-run.
Exit: all pass. No stage 2 work starts before this gate.

**Step 9. Tiers and failures.** The `boot.ts` context check, the soft and hard poster paths, the reset list, the IntersectionObserver.
Exit: AC2.4, AC3.2 to AC3.9, AC7, AC8.1 (all cases except the production build, which waits for step 13), AC8.3, AC8.5.

**Step 10. Stage 2 encodes.**
```sh
python3 -I scripts/hero/encode-textures.py assets-src/hero/masters src/assets/hero
node scripts/hero/pack-bins.mjs src/assets/hero
```
Then the class selection, the crop extents (section 6.5), `fetchBin` with `DecompressionStream`, `undeltaPlanes`, and `world/skyClass.ts`.
Exit: the encode sizes equal section 6.2 within 1 percent (same encoder versions); the bins round-trip test passes and the packed sizes equal section 6.2; AC1.2 at the shipping thresholds at both viewports; AC8.6.

**Step 11. Final posters.** `node scripts/hero/render-poster.mjs` on the stage 2 test build, then `python3 -I scripts/hero/encode-poster.py`.
Exit: AC8.4 (each file at most 120 KB, SSIM at least 0.954 phone and 0.953 desktop, one request per viewport).

**Step 12. Loader weights.** `node scripts/hero/measure-weights.mjs` on the stage 2 test build (5 runs per viewport, 4x CPU).
Exit: the weights unit test passes on the new file; AC3.2 and AC3.3 pass again.

**Step 13. Production build and gates.** `npm run build && npm run guards && npm run budget && npm run lighthouse`, plus AC8.1's production-build case.
Exit: AC9, AC10.1 (graded numbers met; the 3D numbers recorded), AC10.5, AC10.6.

**Step 14. Full local run and hand-off.** `npm run ci` under `wrangler dev`; the screenshots of section 13.2 written to `docs/specs/screenshots/`.
Exit: every spec green; hand to the review step with the evidence each AC asks for.

**Step 15. Staging (needs A2; not possible in this environment).** Section 15, step 2, including the real-device trace.

### 17.1 Build notes, steps 1 to 4 (2026-10-09)

Steps 1 to 4 are built and their exit checks pass (evidence in the hand-off). What the build decided or changed against the text above, for the builders of step 5 on and of the family pages:

1. **Inline scripts.** `src/components/shell/inlineScript.ts` assembles each one: the prepended config is declared inside one function scope (so `CFG`, `POSE`, `WT`, `COPY`, `LAUNCH` and `LIVE` never become globals), then the string is minified with Vite's own `minifySync`. The three inline scripts measure 4.2 KB gz minified against 5.4 KB gz as written, which keeps the hero's critical JS line (8 KB gz with the 2.2 KB gz glitch chunk and the boot chunk) inside budget. `csp.mjs` hashes what ships.
2. **Stylesheets.** `Base.astro` imports only `tokens.css`, `shades.gen.css` and `fonts.css`; `src/pages/index.astro` imports `shell.css`. Base is the layout the family pages (`/shades/[family]/`) reuse, without the hero shell. Base has two head slots: `head-first` (inline scripts that must run before CSS, such as the Gate) and `head` (preloads). Astro emits the one inlined `<style>` at the end of `<head>`, after the Gate, the preloads and the title (checked in `dist/index.html`).
3. **Sibling order.** `HeroStage.astro` owns the order of section 4.2 through named slots (`poster`, `sprite`, `loader`, `logo`, `copy`, `cue`, `riders`, `after-track`, `dev`, `last`). `main#main` is rendered only when the after-track slot renders something, because a conditional slot still counts for `Astro.slots.has`.
4. **Dev-only components** are imported in `index.astro` by a build-time conditional dynamic import. Astro bundles the scripts of every imported component, rendered or not; with a static import the production build carried the Tune chunk. The production `dist/_astro/` now holds the SiteLogo chunk and the four posters only.
5. **Loader.** `loader.inline.js` is written in step 4, because the shell's markup and the inert contract (D16) need it. `tests/unit/inline-loader.test.ts` proves it is the prototype's loader plus exactly the seven deviations. Its frame parity (AC3.1) stays step 5's exit.
6. **Glitch.** `install.ts` runs the 0.75 s intro only when the page has no loader (`window.__skreedLoader` undefined, that is the Gate's poster tier), so a page whose loader went to its poster state gets no extra burst. Step 9 decides whether the boot.ts poster (software GL) calls `__skreedLogo.intro(0.75)` itself (AC5.7). `__skreedLogo` also has `configure({split, idle})` for Tune. The click handler intercepts only on `/` and only plain primary clicks.
7. **Tune** is the prototype's panel minus the world and block-colour rows, hidden until `?tune`. `src/scripts/dev/tune.ts` wires the glitch controls now and keeps a mutable dev copy of `HERO_PARAMS` as `window.__skreedTune = { params, subscribe(fn) }`, which the island subscribes to in step 6.
8. **Shades.** `gen-shades.mjs` also writes `src/data/family-keys.json` (the key shade per family with its catalog number; family-page.md 2.1). Open conflict for the family-page build: family-page.md 2.1 names the tokens `--shade-001` to `--shade-240`, while D30 and `DESIGN.md` name them `--shade-<id>`. The build ships `--shade-<id>` (7,855 B, unit-tested). `shades.gen.ts` carries each shade's catalog number `n`, so a family page can write `[data-s="032"]{--sw:var(--shade-blissful-blues-08)}` without a second token set.
9. **Overlay parity (AC1.3)** runs in a browser with `--disable-gpu-rasterization`. Under SwiftShader's GPU raster the logotype's edge pixels vary by 1/255 with the raster cache state (the port against itself differed on up to 346 pixels depending on what drew first), while Skia's CPU raster is deterministic; the two pages then compare pixel-identical at 390 and 1280. The prototype's `#wallCopy` is hidden in the comparison (dropped by D9). Test pages that inject styles into the port need `bypassCSP: true`; `tests/e2e/csp.spec.ts` never bypasses.
10. **Timing tests** for the glitch run on Playwright's fake clock (it drives `performance.now()` and `requestAnimationFrame`), because headless frames here arrive with gaps of up to 600 ms. CSS animations do not follow the fake clock, so the cue is measured in real time.
11. **Provisional posters** (step 4): rendered from the prototype in 18 s (phone) and 74 s (desktop) under SwiftShader. Portrait AVIF q60 34,166 B (SSIM 0.9611), WebP q80 33,140 B; wide AVIF q50 79,945 B (SSIM 0.9598), WebP q70 81,108 B. The locked terrain is darker than the v9.9 probe's, so the files are smaller than section 6.4's measurements. The renders are gitignored (`assets-src/hero/poster/*.png`); `node scripts/hero/render-poster.mjs --prototype` recreates them.
12. **Tooling.** `@types/node` (26.6.4) arrives through Vite and is not pinned in `package.json`; `tsconfig.json` lists it in `types`. The `guards`, `budget`, `lighthouse` and `ci` scripts of section 14 are added with their files in step 13; `deploy:dry` runs the dry-run deploy.
13. **Known gap for section 3.** On the poster path the corner logotype stays fixed in Pearl Whisper. Over a Pearl section below the hero it would vanish: the 3D path sets `data-tone` from the wipe, and the poster path has no wipe. Section 3 (or step 9) sets the tone when the logotype leaves the poster.
14. **Web interface guidelines (E1), applied by hand** from the fetched rules (the skill is a rules fetch; it is not installed here). Fixed: the logotype's `-webkit-tap-highlight-color` is transparent (its press state is the glitch); the logotype and the countdown add `env(safe-area-inset-left/right)` like the prototype already did for top and bottom (0 off notched landscape phones, so parity holds); `Base.astro` writes `<meta name="theme-color">` (`--night` on `/`, Pearl Whisper by default); `#ldSt` is `aria-live="polite"`. Justified, not changed: Title Case and second-person copy (the brand is sentence case and first person); "Still loading" without an ellipsis (approved copy); no skip link (nothing follows the hero in production; the h1 reads first); no `color-scheme` (D24); the hardcoded "1 November 2026" (static approved copy, English only); no hover state on the live link beyond its underline (DESIGN.md defines none; Sam's call when the link ships at zero).

### 17.2 Build notes, steps 5 to 8 (2026-10-09)

What steps 5 to 8 decided or changed against the text above (evidence in the hand-off):

1. **Texture milestones in key order.** Section 5.3 had `sky` and `ground` reported on load. Fetched over the network and decoded off the main thread, the textures arrived after `compile` at 390 x 844 (measured: `sky` at 5.3 s, `ground` at 5.9 s, after `compile` at 4.1 s), so the 23 milestones were out of key order and both 4096 uploads landed in one 27 s first frame under SwiftShader instead of in the warm-up. `hero.ts` now loads both at steps 8 and 9 as before, but reports `sky` then `ground` from awaited promises just before `scene` (step 19). The order is fixed (import, b1 to b10, sky, ground, scene, c1 to c6, compile, frame1, frame2), the pending key while a texture is in flight ends in y or d (so the loader shows "Slow connection", section 7.4), and the warm-up's c2 and c3 draws upload them as the prototype's did. No pixel changes. Measured after the change: frame2 at 8.4 s (390) and 12 to 15 s (1280) under SwiftShader on a loaded machine.
2. **Fog uniforms at compile time.** `createGround` takes `FOG` as a getter, read in `onBeforeCompile` at the warm-up, because the fog uniforms are made at step 11, after the ground (step 9), in the prototype's order.
3. **GLSL.** `scripts/hero/gen-glsl.mjs` writes `logo/shaders.ts`, `world/shaders.ts` and `post/shaders.ts` from the raw literals of `template.html`, with the slots of section 11 spliced in as empty interpolations. `tests/unit/glsl.test.ts` evaluates all 16 prototype literals and asserts the port's default strings equal them.
4. **D8 texture path: `bitmap`, decided.** `tests/parity/rest.spec.ts` with `PORT_TEXPATHS=bitmap,image` gave PSNR 99 and zero differing pixels against the prototype on both paths, at both viewports, in normal and reduced motion (8 frames). `config/hero.ts` `TEXTURE_PATH` is `'bitmap'`; production takes it as a build-time constant, so `TextureLoader` is not used there; test and staging builds take `?texpath=image|bitmap`. The bitmap path sets `flipY = false` on the texture (the bitmap is decoded flipped) and closes the bitmap in `onUpdate` after the upload.
5. **Critical chunks.** `boot.ts` imports only `COPY_LD` (the loader strings, now their own export of `config/copy.ts`) and `scroll/reset.ts` (the rider reset split out of `scroll/ride.ts`), so the critical chunk carries no other copy and no scroll maths. The glitch's two values live in `config/glitch.ts` (`LOGO_IDLE` 0, `LOGO_SPLIT` 0.4), which `params.ts` reads, so the SiteLogo script no longer pulls the 66-key params table into the critical path.
6. **Hooks.** One hook added for AC6.4: `__skreedBlockColours()` returns each block's glow colour as an sRGB hex. Add it to the `guards.mjs` list (step 13). `__skreedDead` is defined by `boot.ts` (hooks builds), so it exists before the island loads. `__skreedStall(m)` holds before b1 to b10, `scene`, c1 to c6 and `compile`.
7. **Stopping the island.** The IntersectionObserver is attached at step 18 but starts and stops the loop only after `compile`; the loop starts at step 21 only if the track is in view.
8. **Harness.** `tests/harness/compare.py` (from `compare2.py`; thresholds as arguments, x8 diff map, exit 1 on a miss) with `compare.ts`; `settle.ts` gains `freezeBeforeLoad`, `waitReady`, `moreFrames`, `freeze`, `settleScroll`; `island.ts` holds a page's island (`holdIsland`: the poster's `decode()` never settles, so boot.ts never requests an island byte) or the prototype's loader (`holdPrototypeLoader`: `__heroStarted` set, so its noHero listener is inert without three.js). The prototype is served with three 0.165.0 from `node_modules`, the locked values and `logoIdle=0` (`PROTO_QUERY`). Playwright runs here share `test-results/` with other workflows; every parity run takes its own `--output`.
9. **Settling.** Scroll positions are compared only once the second follower has settled on the target to 1e-9 (`|sb - target| < 1e-9`), because at 4 decimals the camera moves by about 12 x the follower's residue.
10. **Parallax series (AC6.5).** SwiftShader frames arrive with irregular gaps, so per-frame `th` and `ph` values cannot match across two pages. The spec compares the series of settled angles through the same script, at 4 decimals: four mouse positions in a 400 x 250 mouse window, and two held touches and their releases through dispatched `PointerEvent`s in a 260 x 563 touch phone. The angles depend only on the pointer in normalised coordinates and on the pointer type; at 1280 x 800 SwiftShader on this machine could not draw the 85 or so frames a settle needs within 10 minutes. Settled means unchanged by less than 1e-7 across at least 3 rendered frames (`__skreedFrame`), never across two polls alone.
11. **Ghost sweep timing (AC6.3).** Measured on the page by a requestAnimationFrame trace of the pointer follower after a tap: it heads back toward its rest sentinel until the sweep resumes, and the first frame that turns back must be at least 2.4 s after the tap (frame-time slack on the 2.5 s rule).
12. **Favicon.** The browser's own `/favicon.ico` request 404s (no favicon yet; site essentials, hero.md section 8) and logs a console error that is not a page request. The island spec ignores that one console line and catches every failing page request through the response listener.
13. **Tests that changed with boot.ts.** `loader.spec.ts`: the soft-poster case uses the loader's offline rule (`fail('')` is the Gate's module load-error path, a hard failure once boot.ts runs). `tiers.spec.ts`: the Gate's decision is read at `readystatechange` 'interactive' (before any module runs), and a new case checks that in headless Chromium without the override boot.ts finds SwiftShader and lands on the poster with no island request and only the expected warning.
14. **Canvas captures paint one background.** At dsf 1.25 a 390 px canvas is 487.5 device pixels, so the 488 px screenshot's last column is the page background, which differs by design (D24: Urban Slate on the prototype, night on the port). `canvas.ts` and the wipe spec inject `html, body { background: #000 }` on both pages; before that the only differing pixels at 390 were exactly that column.
15. **The 1280 wipe settles small.** During the wipe both composers render, and at 1920 x 1200 SwiftShader here drew too few frames for the follower to settle within 15 minutes. Both pages settle at 320 x 200 (the same 1.6 aspect and dsf), freeze (frame ratio 0, so the followers hold exactly), then take 1280 x 800 for the ride and the frame.
16. **The 3D-path overlay and the cue.** AC1.3 on the 3D path (both pages lifted, canvas hidden) differed only in the cue's ball, by D20: the port's cue rests after three bounces, so its animation has finished and cannot be paused at 0. The spec restarts the port's bounce through its own `.cue.is-off` rule before pausing both pages at 0.
17. **Budgets seen at step 6 (graded at step 13).** Production build, gzip 9: hero chunk 141.6 KB, about 1 KB over the island line of 140.6 KB (levers for step 13: the GLSL comments, which the byte-for-byte rule keeps today, and shared config that could move out of the island); boot chunk 3.0 KB after the trims of note 5 (4.0 KB before); SiteLogo 1.8 KB plus its shared params chunk 1.9 KB and motion 0.2 KB. With the 4.2 KB of inline scripts the critical JS is about 11.1 KB gz against the hero's 8 KB line.

## 18. Risks

1. **Lighthouse C4.** The graded run is the poster tier (D23). If Sam declines E-C4, the 3D path needs the levers of section 16, which change timing and need the weights re-measured; the worker lever also needs its own parity pass.
2. **Visible-sky assumption.** The crops assume the hero camera covers every view of the sky dome (section 11.2 check). The rotation interim shows night at the sides of the sky until the wide crop arrives.
3. **Masters.** The lossless PNGs move into the working tree in step 1 but are gitignored. Until Sam picks Git LFS or Dropbox, a fresh clone cannot re-encode stage 2.
4. **VRAM and low-memory phones.** The 4096 ground is 85.3 MB of VRAM, and render targets add about 24 MB on a phone. iOS reports no `deviceMemory`, so low-memory iPhones are not gated. Context loss falls back to the poster, but a tab crash would not.
5. **Software-renderer check.** It reads `WEBGL_debug_renderer_info`; a browser that hides the renderer and also passes `failIfMajorPerformanceCaveat` on software GL would get the 3D path. The frame-time probe (out of scope) is the follow-up.
6. **Loader weights.** They must be re-measured after any start-up change (section 7.4). Stale weights make the fill stall or jump, though it never runs ahead.
7. **iOS address bar.** The prototype reads `innerHeight` every frame against a 460svh track, so URL-bar resizes shift `pr` slightly. This keeps parity; the risk is noted for the Sam device check.
8. **Spec conflicts.** The approved hero breaks several written rules (`hero.md` section 10). Until Sam codifies them, an adversarial reviewer may still FAIL them. E-1/21/40, E-A2b, E-C3b, E-C4, E-2.2.2 and E-GSAP are new and pending.
9. **Parallel work.** v10 and template7 are still changing. Renaming any id, class, global or milestone during the port would break both merges, so names are frozen as listed in sections 4.2 and 7.2.
10. **JS headroom.** The hero leaves 101.4 KB gz of the 250 KB gz page budget. GSAP with ScrollTrigger is 42.9 KB gz, SplitText and Flip add 11.2 KB gz, Lenis is 5.2 KB gz, and PostHog is about 50 KB. Those later sections must share what is left.
11. **First-view headroom.** The WebP-only desktop class has 87,711 B left under 1,500,000 B. Any texture re-encode or a larger poster must re-run `budget.mjs`.
