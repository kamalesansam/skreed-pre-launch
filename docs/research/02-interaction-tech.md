# Interactive / Visual Tech & Libraries (research agent output, 2026-10-01)

Legend: C = cost/effort, W = wow on phone. Target: mid-range Android (Chrome/Samsung Internet) + iOS Safari; laptop secondary. Hard budget: ≤1.5 MB JS gz total, ≤4 MB first-view media, no WebGL on tier-0/1 GPUs.

## 1. Animation libraries (2026)

- **GSAP 3.13+ (free, all former Club plugins).** Webflow acquired GreenSock Oct 2024; since v3.13 (May 2025) ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG, ScrambleText, Flip, Observer are free for commercial use (gsap.com/blog/3-13; webflow.com/blog/gsap-becomes-free; Codrops May 2025). Only restriction: no products competing with Webflow. Core ~23 KB gz, ScrollTrigger ~13 KB, SplitText ~8 KB. iOS pinning address-bar jump: use `ScrollTrigger.normalizeScroll(true)`, `ignoreMobileResize: true`, `svh` instead of `vh`; skip ScrollSmoother on mobile. Best: scroll storytelling, pinned image sequence, SplitText reveals, Flip for wall → detail, `matchMedia()` per breakpoint. **C low–med, W high.**
- **Motion (ex-Framer Motion) v12/13.** `useAnimate` mini 2.3 KB; `LazyMotion` + `m` ≈ 4.6 KB (+15/25 KB features); full ~34 KB. `scroll()` rides native ScrollTimeline. WAAPI-accelerated transform/opacity. Best: React micro-interactions, layout animations for the grid, AnimatePresence. **C low, W med.**
- **Lenis.** ~3–4 KB; `syncTouch: false` default leaves native momentum on phones. Pair with ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`. Desktop-only feel upgrade. **C low, W low (phone) / med (laptop).**
- **Theatre.js.** ~30 KB runtime; maintenance risk. Only for cinematic R3F sequences with a motion designer. **C high, W med.**
- **anime.js v4.** 24.5 KB full, modular (Timer 5.6, Scroll +4.3, Draggable +6.4, Spring 0.5); MIT; three.js adapter. Weaker pinning. **C low, W med.**
- **CSS scroll-driven animations.** Chrome 115+, Safari 26.0+ (Sept 2025), Firefox 132+; ~84% global; failure mode is "no animation" so safe with `@supports`. Off-main-thread, zero JS. Pre-26 iOS gets nothing. **C low, W med.**
- **View Transitions API.** Same-document Baseline Oct 2025; cross-document Chrome 126+/Safari 18.2+. Use for swatch → shade-detail morph. **C low, W med.**

## 2. 3D & WebGL

- **Three.js + R3F + drei.** three ~185 KB gz full, less tree-shaken; R3F/drei +40–60 KB. Babylon (~1.8 MB) and PlayCanvas overkill for one hero object. Needle Pro from ~€49/user/mo. **Spline:** Free watermarked; Starter ~$12–15/mo removes watermark; Pro ~$25–30/mo code export; runtime often 1–3 MB+, limited material control at 240 shades. Author in Blender, export glTF, render with R3F. **R3F C med–high, W high; Spline C low, W med.**
- **`<model-viewer>` for "see it on your desk".** AR via Scene Viewer (ARCore Android) and AR Quick Look (iOS 12+); needs `.glb` + `ios-src` `.usdz`. Gate the CTA on `canActivateAR`. Generate USDZ per shade as a build step. **C low–med, W high (phone-specific).**
- **Asset pipeline.** gltf-transform `dedup → prune → weld → simplify → meshopt or draco → KTX2`. Draco 50–80% geometry reduction but ~100 KB decoder and slow decode; meshopt 30–60% with <30 KB decoder and 5–10× faster decode → prefer meshopt on mobile. KTX2 stays compressed in VRAM. Budgets: case ≤ 20–30k triangles, ≤ 1 material per finish, textures ≤ 1024², GLB < 2 MB, < 100 draw calls. `dpr={[1, 1.5]}`, `frameloop="demand"` when idle, no post-processing on mobile.
- **Matte vs gloss PBR.** `MeshPhysicalMaterial`: matte = roughness 0.6–0.85, clearcoat 0, optional sheen; gloss = roughness 0.15–0.3, clearcoat 1, clearcoatRoughness 0.05–0.15. Lighting via `RoomEnvironment` + PMREM (zero download) or a 1k HDR (HDRJPG ~100–300 KB).
- **Swapping 240 shades.** Do NOT ship 240 textures. Drive `material.color` (sRGB → linear) and tween in OKLCH. For a wall of 3D cases use `InstancedMesh` + `setColorAt` (one draw call). Texture atlas only if printed patterns are added.
- **Fallbacks.** Tier via `detect-gpu` (drei `useDetectGPU`): tier ≤1 or reduced-motion → pre-rendered WebP/AVIF turntable (36–48 frames) sprite, or 6–10 s muted MP4/WebM per hero shade. Pre-render with Blender once per shade × finish and automate.
- **Image-sequence scroll (Apple AirPods style).** Canvas `drawImage` of pre-decoded frames tied to ScrollTrigger `scrub`. 65 PNGs ≈ 15 MB vs ~1.7 MB WebP. Mobile spec: 60–90 frames, 960×1200 WebP q75 ≈ 2–4 MB; preload first 10, then `createImageBitmap` in idle time; decode is the bottleneck. Alternative: pure-CSS scroll-timeline sprite stepping. **C med, W high.**

## 3. Shader / visual effects feasible on mobile

- **Mesh/fluid gradients:** `@paper-design/shaders` (Apache-2.0, React + vanilla; mesh gradient, grain, liquid metal, dithering); `@mesh-gradient/react` (pauses off-screen, `isStatic` for weak devices); Stripe-style `gradient-stripe`; shadergradient.co. Render at 0.5× DPR on a half-res canvas; one fullscreen pass max on mobile. Brand fit: slow OKLCH drift through the 10 families. **C low, W high.**
- **Liquid distortion / hover displacement:** OGL (~29 KB) flowmap effect or Curtains.js; touch twin via drag or tilt. **C med, W med.**
- **Grain / chromatic aberration:** SVG `feTurbulence` or a 256² noise PNG with `mix-blend-mode: overlay` (cheap); avoid postprocessing passes. **C low, W med.**
- **Cursor trails / magnetic buttons (desktop only):** GSAP `quickTo`; gate with `@media (hover: hover) and (pointer: fine)`. Touch parity: press-scale 0.96 + spring release. **C low.**
- **Text reveal / scramble / kinetic type:** SplitText (with `mask`) + ScrambleText cycling shade names ("Aquamarine → Mauve → Bellini"). ≤ 60 chars split on mobile; transform/opacity only. **C low, W high.**
- **Marquee:** CSS keyframes on a duplicated track; pause on reduced motion. **C low, W med.**
- **Parallax:** CSS `animation-timeline: view()` or GSAP scrub; never scroll listener + layout reads. **C low, W med.**
- **Sticky storytelling / pinned horizontal scroll:** `position: sticky` + scroll-timeline for simple cases; ScrollTrigger pin for sequencing; on phone prefer native horizontal `scroll-snap` carousels. **C med, W med/high.**
- **Colour wall with spring physics:** 240 DOM swatches with Motion `layout` + spring or react-spring; fine if only transform/opacity change and `contain: strict`; stagger ≤ 15 ms; on phone show 10 families then expand one into 24 (Flip); `view-transition-name` per swatch. **C med, W high (the USP moment).**

## 4. Colour-specific interactions

- **Pickers:** react-colorful ~3 KB (no wheel); iro.js ~9 KB (wheel). More on-brand: a custom 10-family hue ring (SVG conic segments) → 24-shade lightness strip. **C low–med, W high.**
- **Photo → nearest shade:** capture via `<input type="file" accept="image/*" capture="environment">` (no permission dialog, works in in-app browsers) or `getUserMedia({video:{facingMode:'environment'}})` for live preview (gesture + HTTPS; iOS 14.3+). Downscale to ≤ 256 px offscreen before quantising. Extract with `node-vibrant` (~20 KB) or color-thief; match with `culori` `nearest(palette, differenceCiede2000())` or `differenceOk` against the 240 OKLCH values; show top-3 and "closest in matte / in gloss". Let the user tap a region (9×9 average). EyeDropper API = Chromium desktop only. Prefer the file-capture path by default in India (Instagram in-app browser). **C med, W high.**
- **OKLCH everywhere:** store the 240 as OKLCH so steps are perceptually even; CSS `oklch()` is Baseline; gradients `in oklch` avoid grey mid-points. "Build your palette": pick 3 shades → OKLCH hue rotation → share card.

## 5. Micro-interactions, haptics, sound

- **Vibration API:** Chrome/Edge/Samsung/Android yes; all iOS browsers no; ~77% global. `navigator.vibrate?.(8)` on swatch snap on Android; iOS hack via `<input type="checkbox" switch>` (17.4+) is fragile. **C low, W med (Android).**
- **Sound:** AudioContext must be created inside `touchend`/`click` on iOS; mute by default with a toggle; <10 KB total. **C low, W low–med.**
- **Lottie / dotLottie / Rive:** lottie-web ~60–75 KB gz; dotlottie-web ~12 KB JS + ~500 KB WASM; Rive `@rive-app/canvas-lite` smallest. Rive state machines ideal for a "case flips, finish toggles matte↔gloss" mascot at a few KB; verify current Rive pricing on rive.app. Lottie: keep JSON < 100 KB, avoid masks/mattes. **Rive C med, W high; Lottie C low, W med.**

## 6. Social / sharing

- **Instagram:** `instagram://user?username=skreedofficial` on iOS/Android; Android Chrome robust form `intent://user?username=skreedofficial#Intent;package=com.instagram.android;scheme=instagram;S.browser_fallback_url=https%3A%2F%2Finstagram.com%2Fskreedofficial;end`; always pair with the https fallback after ~800 ms. Most traffic arrives inside Instagram's in-app browser (bio link) where schemes/intents are blocked; detect UA `Instagram` and show a plain "Follow @skreedofficial" link. Follows cannot be automated; the share image is the lever.
- **Web Share API:** Chrome Android, Samsung Internet, Safari iOS 12.2+ (files from iOS 15); `navigator.canShare({files})`; opens the system sheet incl. WhatsApp / Instagram Stories. Desktop fallback: copy link + download PNG.
- **Client-side share card:** don't rasterise DOM (html2canvas slow; html-to-image hits font/CORS edge cases on iOS). Draw directly with Canvas 2D at 1080×1920 and 1080×1080 (iOS canvas cap ~5 MP, safe); `document.fonts.load` for Poppins; `toBlob('image/png')` → `File` → `navigator.share`. **C low–med, W high.**
- **OG images:** `@vercel/og` (Satori + resvg) per-shade `/og/aquamarine-matte.png`; pre-generate 240 at build time.
- **WhatsApp:** `https://wa.me/?text=<encoded>`; `<input type="tel" inputmode="numeric" autocomplete="tel">` with +91 default; WhatsApp opt-in as primary over email.

## 7. Mobile-first considerations

- Touch/hover parity: `@media (hover: hover)`, `pointer: coarse`; `touch-action: pan-y` on draggable swatches; 44 px targets; `-webkit-tap-highlight-color: transparent`.
- Viewport: `100svh` for hero, `100dvh` for sticky bottom CTA (iOS 15.4+), `100vh` fallback first; don't animate anything sized in dvh.
- iOS Safari: no vibrate, no `deviceMemory`, `hardwareConcurrency` capped at 2, `requestIdleCallback` behind a flag (polyfill with setTimeout); WebGL context loss on tab switch (listen for `webglcontextlost`).
- `prefers-reduced-motion`: honour globally; swap sequences for static key frames; still allow colour changes.
- Battery/thermal: no API; use an FPS watchdog (drei `<PerformanceMonitor>`), drop DPR and pause the shader background under 40 fps; pause on `visibilitychange` / off-screen; one WebGL canvas max.
- Capability flag `quality = 'lite'|'standard'|'rich'` from deviceMemory, saveData/effectiveType, detect-gpu tier, hover support; decide before hydration, store in a cookie. Typical India mid-range (Helio G85 / Snapdragon 6xx, Mali-G52) = tier 1–2: shader gradient at half res + DOM wall, 3D behind a "View in 3D/AR" tap.
- Loading: JS ≤ 150 KB gz first view; 3D and sequences lazy on intent; Poppins Bold + Inter subset ≈ 40 KB; `fetchpriority="high"` on hero media; AVIF with WebP fallback; India edge PoPs.

## 8. Summary ratings (phone-first)

| Technique | Cost | Wow on phone |
|---|---|---|
| GSAP ScrollTrigger + SplitText storytelling | low–med | high |
| CSS scroll-driven parallax/fades | low | med |
| View Transitions swatch morph | low | med |
| Shader mesh gradient background | low | high |
| DOM 240-swatch wall with spring + Flip | med | high |
| Shade-name scramble / kinetic type | low | high |
| Image-sequence scroll hero | med | high |
| R3F PBR case with live colour + matte/gloss | med–high | high (tier ≥2) |
| model-viewer AR "on your desk" | low–med | high |
| Spline embed | low | med |
| Photo → nearest shade (vibrant + culori ΔE) | med | high |
| Custom hue ring picker | low–med | high |
| Rive state-machine mascot | med | high |
| Lottie illustration | low | med |
| Canvas share card + Web Share | low–med | high |
| Instagram deep link + fallback | low | med |
| WhatsApp wa.me share / opt-in | low | med |
| Vibration on swatch snap (Android) | low | med |
| UI sound | low | low |
| Liquid distortion hover (OGL) | med | med |
| Magnetic buttons / cursor trail | low | n/a (desktop) |
| Lenis smooth scroll | low | low (phone) |
| Theatre.js cinematic sequence | high | med |

**Recommended stack:** Astro (or Next) + GSAP (ScrollTrigger, SplitText, Flip) + Motion mini for React micro-interactions + `@paper-design/shaders` gradient + DOM colour wall (OKLCH data) + culori/node-vibrant match flow + Canvas share card + Web Share / wa.me; R3F + meshopt/KTX2 GLB and `<model-viewer>` AR loaded on tap and gated by detect-gpu; pre-rendered WebP sequences as tier-1 fallback. Verify GSAP licence clause and Rive/Spline prices on primary pages (blocked during research).
