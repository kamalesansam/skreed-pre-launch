# Assets & Creative Production Tooling (research agent output, 2026-10-01)

Note: the logo was located after this report was written. Shopify Files holds `skreed_logo_1200_628.png`, `Logo_skreed-4_20240711_charcoal.png`, `skreed_logo_300a.png`, `Logo_skreed-3_20240711.png` (all raster). The Shopify "brand" metaobject points at MediaImage 28417972011208 as the SKREED logo. Vectorize one of these for SVG.

## 1. Asset inventory checklist

| Asset | Spec | Status / source |
|---|---|---|
| Logo: wordmark SVG, monogram SVG, mono + reversed | Vector; run `image_vectorize` (Adobe MCP) on the Shopify PNG | Raster found on Shopify CDN; SVG missing |
| Favicon set | favicon.ico (16/32/48), icon.svg (dark-mode aware), apple-touch-icon 180×180, icon-192/512 | Generate from monogram |
| OG / Twitter card | 1200×630 ≤300 KB; per-shade variants at build time (@vercel/og / Satori) | Generate |
| Hero visual | Signature image or canvas (§2–3) | Build |
| 3D case model(s) | 5 case types × device bodies (§2) | Build/buy |
| Shade dataset | 240 rows: id, name, hex, family, finish, OKLCH, device availability | Shopify color-pattern metaobjects → docs/data/shades.json |
| Product renders | Transparent PNG per shade per device → AVIF+WebP | Shopify CDN + Dropbox Amazon renders |
| Lifestyle photography | Hands, desks, outfits; real render on generated background (§5) | Generate |
| Short loops | 3–6 s, 1080×1080 + 1080×1920, H.264 + AV1/WebM, muted, ≤2 MB | §7 |
| Sound (optional) | One ~1 s UI "snap" SFX, licensed or synthesized | Optional |
| Copy deck | Headline, sub, CTA, confirmation, error, footer, 10 family blurbs, 240 one-liners | §8 |
| Legal | Privacy, T&C, consent text (India DPDP Act 2023), cookie notice | Template + counsel |
| Social preview per shade | 1080×1080, 1080×1920, 1200×630 | Remotion/Satori batch |

## 2. Getting a 3D phone case, ranked by effort

**(a) Procedural mesh in Three.js. Lowest effort, recommended for a color-first teaser.** `RoundedBoxGeometry` with a CSG-subtracted inner slab and camera-island cutout (`three-bvh-csg`). `MeshPhysicalMaterial`: gloss = roughness 0.08–0.15, clearcoat 1, clearcoatRoughness 0.05; matte = roughness 0.6–0.75, clearcoat 0. Zero licence issues, ~150 KB gz with R3F + drei, instant colour swap via `material.color.set(hex)`. 1–2 days. Refs: threejs.org MeshPhysicalMaterial docs; discourse.threejs.org round-edged box thread.

**(b) Buy a glTF model.** Sketchfab free CC-BY iPhone case models exist (attribution awkward on a brand site; prefer Standard-licensed paid, $5–40). CGTrader free "iPhone 14 Pro Clear Case with MagSafe" glTF; subscriptions from $9.99/mo. TurboSquid royalty-free perpetual licence, e.g. "Apple iPhone 14 All Models and Cases", typically $29–149. Optimise with `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp` to ≤500 KB.

**(c) Blender.** Cube → Bevel (8 segments, ~3 mm) → Solidify (1.5–3 mm per case type) → Boolean for camera island/port → Subdivision → UV → glTF 2.0 with Draco (9.1 MB → 0.4 MB in a documented case). 2–4 h per case type, 1–2 days for the set.

**(d) Spline.** Free tier watermarks web exports; exports to vanilla/React/Next/Three/R3F code; runtime ~1 MB+ JS, proprietary `.splinecode`. Paid ~$12–24/mo for production.

**(e) Photogrammetry.** Glossy featureless surfaces defeat most scanners; KIRI Engine "Featureless Object Scan" exports GLB/USDZ; Polycam struggles with small shiny objects. Only for a textured Armor/Ultra hero.

**(f) AI 3D (Tripo, Meshy, Rodin, Hunyuan3D 2.1).** Soft edges, non-watertight, baked textures; licensing gated behind paid tiers. Not recommended for a hard-surface product.

**Recommendation:** procedural R3F case now, parametrised per case type and device family, finish presets, drei `<Environment preset="studio">`, colour from the shade manifest. Upgrade hero to a Blender Draco GLB later if needed. $0, 1–2 days.

## 3. Turning existing PNG renders into "fake 3D"

- **Scroll image sequence (Apple AirPods technique):** canvas in a sticky container, preloaded frames, `drawImage` indexed to scroll progress (CSS-Tricks article; GSAP ScrollTrigger forum variant; CSS scroll-timeline variant at geyer.dev). 24 fps floor. A 48-frame shade-cycle at 1200 px ≈ 1.5–2.5 MB AVIF.
- **Hover-tilt with depth maps:** Depth Anything V2/V3 locally or Immersity AI; quad with UV displacement tied to pointer/gyro (Codrops depth relighting, Aug 2026). Combine with a specular sweep for gloss.
- **Sprite sheets:** 24 shades of a family in one 6×4 AVIF/WebP sheet (600 px each); swap `background-position`. One request per family.
- **Lottie/Rive from renders:** Rive runtime ≈28 KB JS + ~250 KB WASM vs lottie-web ≈52 KB gz. Only for interactive micro-moments; raster-in-Lottie has no size advantage over sprites.
- **Compression:** `sharp` `.webp({quality:80})`, `.avif({quality:50, effort:6})`; CLI `cwebp -q 80`, `avifenc -q 55 --speed 6`. AVIF for ≥800 px, WebP for thumbnails/swatches, `<picture>` with both. Targets: hero 1600 px ≤120 KB AVIF; grid tile 600 px ≤25 KB; swatch 96 px WebP ≤2 KB; OG JPEG ≤150 KB; initial page ≤1.5 MB.
- **Splitting diagonal composites:** `sharp().extract()` + SVG polygon mask; or pull the per-finish Amazon files from Dropbox instead.

## 4. Colour data (240 shades)

- Hex values already exist in Shopify `shopify--color-pattern` metaobjects (exported to docs/data/shades.json). For verification against renders: `sharp(input).extract(flat region).resize(1,1).raw()` on the matte half.
- **Perceptual sorting:** `culori` → OKLCH; sort within family by L then C, across families by hue. Store `l,c,h` for CSS `oklch()` and even gradients.
- **Spacing check:** target ΔE(OK) 0.02–0.04 between consecutive shades; flag duplicates <0.01 (Royal and Midnight share #492376 in Shopify).
- **Material params:** matte → roughness 0.65, clearcoat 0, sheen 0.2; gloss → roughness 0.12, clearcoat 1, clearcoatRoughness 0.04. In 2D, gloss = diagonal white→transparent overlay at 25–35% alpha.
- **Naming:** stable IDs `{family}-{nn}` separate from marketing names.

## 5. Generative tools for hero & lifestyle imagery

Principle: never let a generator draw the case. Composite real renders (bg removed via Adobe MCP `image_remove_background`) onto generated scenes; `image_generative_expand` / `image_fill_area` for set extension and shadows.

- **Adobe Firefly:** commercially safe, IP indemnification on paid CC plans for standard output. Default for backgrounds, textures, hands.
- **Midjourney v7:** commercial rights on paid tiers; Pro ($60/mo) if revenue >$1M. Best for colour-drenched editorial. No API.
- **Flux 1.1 Pro / Flux 2:** API ~$0.001–0.03/image, no usage restrictions. Batch backgrounds.
- **Ideogram 3:** best text rendering; paid plan for commercial. Typographic frames only.
- **Recraft V3:** vector output, $12/mo Pro. Icons/patterns/monogram explorations.
- **Krea:** free 100 units/day; Basic $9/mo adds commercial licence; 4K–22K upscale.
- **Video loops:** Kling 3.0 ~$0.50 per 5 s; Veo 3.1 ~$1.25, native audio, 8 s max; Runway Gen-4 5–10 s. Image-to-video from a composite; mask the case region and re-composite the static render on top.

Prompt pattern: `[scene] monochrome set, every surface in {shade name} ({hex}) with tonal variations, soft studio daylight, 85mm, shallow depth, empty space center-right for product, no phone, no text, matte paper textures, fashion editorial, Kodak Portra palette`.

## 6. Typography & iconography

- Self-host Poppins 700 and Inter variable (latin subset, WOFF2, `font-display: swap`, preload). Next.js `next/font/local` handles hashing and fallback metrics. Inter var latin ≈100 KB; Poppins Bold ≈20 KB.
- Pairings: Instrument Serif Italic (OFL) for shade names; Fontshare Clash Display / Satoshi / General Sans (free commercial, ITF licence, no redistribution). Suggested: Clash Display Semibold (hero), Instrument Serif Italic (shade names), Inter (UI), Poppins Bold (wordmark continuity).
- Icons: Lucide (ISC) for UI; Phosphor (MIT, 6 weights) for duotone accents.
- India nod: Tiro Devanagari Hindi (OFL) or Baloo 2 for a bilingual tagline; Yatra One for one accent word. Better vehicle: Hindi/regional colour words as shade names (Gulabi, Haldi, Neel, Kesar, Mehendi).

## 7. Video / motion production

- **Remotion:** free for companies ≤3 employees, else $100/mo. Programmatic shade-cycle loops from the manifest, `npx remotion render --codec=h264` and `--codec=vp9`. A remotion skill is available in this session.
- **After Effects → Lottie** via Bodymovin / LottieFiles (dotLottie). AE 2026 v26.0 has a gradient-to-grayscale export bug.
- **Rive:** state machines for the "snap" micro-interaction; free tier, $9/seat paid.
- **Jitter:** Figma import, MP4/GIF/Lottie to 4K/120 fps; ~$10–19/mo. Fastest for social teasers.
- **Adobe MCP:** `animate_design`, `video_render`, `video_resize`.
- Export: hero loop 1920×1080 or 1440×1440 H.264 CRF 23 ≤2 MB + AV1/WebM; IG feed 1080×1080, Reels 1080×1920, 30 fps, ≤15 MB.

## 8. Copywriting & naming

- Teaser principles: specific over vague, single-field form, insider language, early-access incentive (Shopify, Moosend, Viral Loops guides).
- Example microcopy: Headline `240 shades. One of them is yours.` / Sub `Phone cases in matte and gloss, built for every iPhone, Galaxy and Pixel.` / CTA `Get first pick` / Placeholder `you@email` / Success `You're in. We'll write once, when the doors open.` / Error `That email looks off.` / Footer `Skreed — made for colour.` / Shade line `Haldi 07 · matte · Yellow family`.
- Shade-name rulebook: 1–2 words, no trademarks, no device names, family-consistent register; names carry finish, undertone and mood.

## 9. Organisation, naming, manifest

```
/public/assets/
  brand/      logo-wordmark.svg logo-mark.svg logo-mono.svg
  icons/      favicon.ico icon.svg apple-touch-icon.png icon-192.png icon-512.png
  og/         og-default.jpg shades/{shadeId}.jpg
  renders/    {device}/{caseType}/{shadeId}-{finish}-{w}.{avif|webp|png}
  sprites/    {family}-{finish}-{device}.avif
  sequences/  {family}/frame-{000}.avif
  models/     case-{caseType}.glb env-studio.hdr
  lifestyle/  {scene}-{family}-{w}.avif
  video/      hero-loop.mp4 hero-loop.webm social/{family}-1080.mp4
  fonts/      inter-var-latin.woff2 poppins-700-latin.woff2 clash-display-600.woff2 instrument-serif-italic.woff2
  data/       shades.json renders.json families.json
```

IDs: lowercase kebab, `{family}-{nn}`; finish `m|g`; device `ip17pm`, `s26u`, `px11`, `app2`; case `snap|tough|magtough|armor|ultra`; width suffix in px.

`shades.json` schema:
```json
{ "$schema": "skreed/shades@1",
  "families": [{ "id": "playful-pink", "name": "Playful Pink", "hue": 348, "order": 1 }],
  "shades": [{
    "id": "playful-pink-01", "name": "Gumball", "family": "playful-pink", "index": 1,
    "hex": "#ff5fff", "oklch": { "l": 0.74, "c": 0.15, "h": 356 },
    "finishes": ["matte", "gloss"],
    "material": { "matte": { "roughness": 0.65, "clearcoat": 0 },
                  "gloss":  { "roughness": 0.12, "clearcoat": 1, "clearcoatRoughness": 0.04 } },
    "sourceRender": "shopify://files/Gumball_A1.png",
    "devices": ["ip17pm", "s26u"], "caseTypes": ["snap", "tough", "magtough"],
    "textOn": "#111111", "story": "First-bite pink." }] }
```

**Bottom line:** procedural R3F case driven by shades.json for the hero; real Shopify/Dropbox renders (bg-removed, AVIF/WebP, sprite-sheeted) for the grid and scroll sequence; Firefly for safe backgrounds; Remotion for shade-cycle loops; self-hosted Inter + Poppins with Clash Display / Instrument Serif accents; vectorise the Shopify logo PNG first since favicon, OG and social depend on it.
