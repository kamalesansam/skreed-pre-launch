# React Bits, texture packs, endlesstools.io, and the kaya.dsgn components

Catalogued 2026-10-01 through Composio's remote browser (the sandbox proxy blocks every one of these domains). Judged against the Skreed stack (Astro static + GSAP, React only in islands) and rules 1–50 in `CLAUDE.md`.

## 1. React Bits (reactbits.dev), from post 149

**Facts.** Open source, MIT + Commons Clause (free for personal and commercial use, cannot be resold as a library), 48.4k GitHub stars, by DavidHDev. Every component ships in four variants: JS or TS, plain CSS or Tailwind. Install by copy-paste, `npx jsrepo`, or the shadcn CLI; there is an MCP route for agents (add `@react-bits` to `components.json` registries and use the shadcn MCP server), plus a community MCP package. Motion comes from Motion/Framer Motion, GSAP, and for the WebGL items Three.js or OGL. A "React Bits Pro" tier exists (150+ components, 280+ blocks, 300+ app UI, 15+ templates); not needed.

**Fit.** Everything is React, so it lives only inside an island. The plain-CSS variant keeps bundle weight down. Best use: read the source for patterns and port the three or four that fit into the GSAP build; drop one or two in as islands where React is already present (quiz, share).

### Keep (fits the spine and the rules)

| Component | Where it fits | Notes |
|---|---|---|
| **Split Text** | Manifesto, hero headline | GSAP SplitText already does this; use React Bits' version only as a reference for stagger timing. |
| **Counter** | Per-shade reservation counters | Island or GSAP tween; either is fine. |
| **Tilted Card** | Shade card tilt on desktop | Pointer-driven 3D tilt; pair with DeviceOrientation on phone. |
| **Elastic Slider** | Finish toggle (matte ↔ gloss) | Rubber-band slider feel for the finish mix. |
| **Circular Gallery** / **Circular Carousel** | Family picker on laptop | 360° ring of the ten families; reduced-motion fallback to tabs. |
| **Scroll Stack** | day-in-shades stories | Cards stacking on scroll; works with native scroll-snap on phone. |
| **Stepper** | Quiz progress | Six-step indicator for the swipe cards. |
| **Masonry** / **Drift Wall** | Reference for the Wall only | The Wall stays a plain CSS grid; these show how to stagger reveal without jank. |
| **Model Viewer** | 3D upgrade path | Same embed pattern as Vengeance; pair with img2threejs. |
| **Rotating Text** / **Text Loop** | Shade-name cycling in the hero sub | "Mauve → Bellini → Aquamarine" is on-brand if restrained to one line. |
| **Curved Loop** | Maybe: a single curved marquee of shade names | Only if it reads as type, not decoration; one use max. |

### Banned by the rulebook (do not use)

Text: Glitch Text, Fuzzy Text, Shiny Text, Gradient Text, Decrypted Text, Tech Text, Scrambled Text, ASCII Text, Particle Text, Echo Text, Text Cursor (rules 2, 21, 24, 13).
Animations: Magnet, Splash Cursor, Blob Cursor, Follow Cursor, Trail Cursor, Pixel Trail, Click Spark, Crosshair, Spotlight, Star Border, Noise, Threads (rules 13, 20, 42, 44, 48).
Components: Fluid Glass, Glass Surface, Glass Icons, Reflective Card, Spotlight Card, Border Glow, Chroma Grid, Gooey Nav, Pixel Card, Decay Card, Magic Bento, Dock, Pill Nav, Lanyard, Specular Button, Bubble Menu (rules 6, 9, 11, 22, 28, 33, 42, 48).
Backgrounds: all of them (Aurora, Waves, Particles, Nebula, Hyperspace, Liquid Chrome, Orb, Net, Ball Pit, Grid Motion, Dots, Squares, Starfield, Shape Blur, Grid Distort) (rules 21, 42, 43, and no WebGL in the spine).

Net: about a dozen usable, roughly fifty banned. That ratio is the point of the rulebook.

## 2. Texture packs, from post 147

Four URLs from the kalypsodesigns carousel. Details per pack are in section 2a once the browser agents report; the usage rule is the same for all:

- Rule 20: a texture may sit only on a flat colour, subtle, and never under text. The one legitimate home is a faint matte grit on the charcoal sections, echoing the matte finish.
- Light leaks and VHS textures do not fit a clean, colour-led lifestyle brand. They are not used on the site. If anyone wants them, they belong to the Instagram reel pipeline.
- Scribble textures have no place in the catalog look.

### 2a. Pack details (visited)

| Pack | Site | What you get | Licence | Verdict |
|---|---|---|---|---|
| Vintage Grit textures | pixelsurplus.com | 3 textures as AI, EPS and PNG, 4000×6000 px. "Free" through a Shopify checkout that asks for an email. | "Free for unlimited use in personal and commercial projects"; no redistribution. | **Take.** The one pack we use: a 2–4% opacity grit on the charcoal sections, exported as a tiled 512 px WebP, never under text. |
| Light Leak textures | resourceboy.com | 250+ JPG, 8K. Direct download, no account. | resourceboy.com/license, "You Can" section: personal and commercial use allowed, no resale as-is. | Not on the site. Reel pipeline only, if the content team wants it. |
| Scribble textures | resourceboy.com | 500+ PNG with transparency, 4K. | Same licence. | No. Off the catalog look. |
| VHS textures | resourceboy.com | 100 JPG, 4K. | Same licence. | No. Retro-tech reads against "lifestyle, not tech". |

Practical note: the pixelsurplus checkout and both resourceboy downloads are blocked from this sandbox. Sam downloads the vintage grit pack once and commits the derived 512 px tile (not the 4000×6000 source) under `public/textures/`.

## 3. endlesstools.io, from post 148 and Sam's screenshot

No-code 3D and effects tool in the browser. The screenshot Sam sent shows its brick-mosaic effect on a portrait. Details per the browser report in section 3a.

**The one Skreed-specific idea it enables:** a photo (a hero portrait, or the case itself) rebuilt as a mosaic of tiles, where each tile is one of the 240 shades. That is the Wall and a face at once, and it is a share-card idea with real pull. It stays a produced image (exported PNG/MP4 for social or the hero), never a runtime WebGL effect in the spine.

### 3a. Features, exports, pricing, licence (visited)

- **What it does.** Browser-based 3D scene builder with materials, lighting, and post-effects (brick mosaic, halftone, dither, pixel, outline, glass). Text and uploaded images or logos become 3D objects. Scenes export as images, video, and USDZ, and can be embedded as interactive views.
- **Exports.** Up to 8K stills, video, USDZ for AR Quick Look. AI credits for generation features on paid tiers.
- **Pricing.** Free plan is for non-commercial evaluation only. PRO is about $20/month or $249/year and is the first tier that allows commercial use.
- **Licence.** Anything that ships on skreed.in or in a paid campaign needs PRO. The free plan is fine for a day of exploration.
- **Access.** The editor requires a login, so nothing could be exercised from the remote browser beyond the marketing pages.

**Decision.** One PRO month ($20) in build week 2 if the brick-mosaic hero or the 240-tile portrait share card gets green-lit. Otherwise skip. It never ships as a runtime effect; it produces images and clips.

## 4. The latest React Bits screenshots (nextgen.ai00, "Powerful websites part 1056")

Sam sent eight component screenshots from the reel: Magnet Lines, Lightfall, Border Glow, Flowing Menu, Circular Gallery, Magic Bento, Galaxy, Cubes. The reel's hero shows the new "Strands" background. All of these are already judged by the split in section 1:

| Component | Verdict | Why |
|---|---|---|
| Circular Gallery | Keep (laptop only) | Family picker; reduced-motion fallback to tabs. |
| Flowing Menu | Maybe | A hover-marquee nav row. Only if the footer family list wants it; one use, type-only, no decoration. |
| Magnet Lines | No | Cursor-follow field (rule 13). |
| Lightfall, Galaxy, Strands | No | WebGL backgrounds (rules 42, 43; no WebGL in the spine). |
| Border Glow | No | Glowing borders (rule 22). |
| Magic Bento | No | Bento grid with spotlight and glow (rules 9, 28, 48). |
| Cubes | No | Decorative 3D grid with no content job. |

## 5. kaya.dsgn components, from post 146

The reel names four effects with no URLs (links are comment-gated). Verdict by name:

| Effect | Verdict |
|---|---|
| Text distortion | No. Distorted or glitchy type is rule 21/24 territory and off-voice. |
| Gravity particles | No. Particle fields are banned (rules 42, 44) and are WebGL in a spine section. |
| 3D carousel | Maybe, laptop only. Same role as React Bits Circular Carousel for the family picker. |
| Orbit preloader | No. The site has no preloader; it is static and must paint instantly (checklist C1–C4, D1). |

## 6. Post 145 sites, visited one by one

| Site | What it is | Pricing / licence | Use for Skreed |
|---|---|---|---|
| **Creatoom** (creatoom.com) | Mockup marketplace. iPhone 17 Pro V5 front mockup and iPhone 16 Pro isometric set are free; many phone-case and packaging-box mockups. PSD + JPG, about 3500×4600 at 300 DPI. No Samsung, Pixel, or Figma files found. | Free items need a name and email. Royalty-free for personal and commercial use; no resale of source files; attribution not required. | **Yes, for one job.** The iPhone 17 Pro front and the case mockups give the share card and day-in-shades stories a device frame we do not have in Dropbox (our renders cover 21 devices but no lifestyle angles). Sam downloads with the collab@ email. |
| **Craftwork Design** (craftwork.design) | UI kits, illustrations, mockups, icons, 3D, plus an "Inspiration" gallery (Websites → Agency, Portfolio, E-commerce, Startup...). E-commerce shows Utopia Tokyo, Notom, Giellygreen, Agronomy Work, Scotchpos. | Free plan: browse gallery, free packs. Pro $149/year ($49 quarterly, $449 lifetime). Commercial licence on all purchases and freebies, up to 20 people; no resale, no physical products without Extended. | **Reference only.** Browse the e-commerce gallery once during plan week. Nothing to buy; the kits are the generic look the rulebook bans. |
| **Internet Gems** (ilovecreatives.com/internet-gems) | Curated gallery, 40+ categories and 19 platforms, "Site of the Week" cadence (about 250 entries). | Free. | **Reference, and the best of the five.** Pull the Shopify entries into the inspiration pass: The Salad Project, Dimwit, Huey Lightshop, Bink (water bottles, an accessory brand), Matcha Cartel; plus Klimt Wine and KŌSA for colour-led lifestyle. Decathlon Yestalgia is a campaign/teaser page worth one look. Added to `03-references-competitors-playbooks.md` as a follow-up. |
| **Morflax Studio** (studio.morflax.com) | No-code 3D: Abstract and Shape generators, Vector to 3D, Device Mockups (iPhone 11 Pro to 16), Object Upload (GLB), Scene Builder, effects (bricks, dither, pixel, outline, glass). Exports PNG/JPG/WebP and video to 4K; GLB download on Pro Max. | Free has limits and a watermark. Pro $15/month ($108/year): 4K, no watermark, commercial licence, transparent background. Pro Max $29/month adds GLB. "You can use downloaded assets for your personal and commercial projects." | **Maybe, as the cheaper endlesstools.** Same job (hero stills, brick-mosaic portrait, social clips), $15 instead of $20, and it imports our own GLB. No phone-case model, so the case itself still comes from Dropbox renders. Pick one of the two, not both. |
| **Start UX Design** | A UX course/portfolio-help site. | n/a | Skip. Not a resource for this build. |
| **App Motion** (appmotion.design) | Curated gallery of mobile app motion clips tagged by interaction (#signup, #success, #loading, #morph, #card, #sheet, #onboarding...). Clips are embedded video, view only, no Lottie or AE source. | Free. **The live site is offline**; the browser agent read the May 2024 archive. | **Reference for the islands.** Three archived clips map to our spine: Lapse and 222 onboarding steppers (quiz progress), Cash App card swipe (quiz cards), Linear and Asana success micro-animations (the reserve confirmation). Use web.archive.org. |

## 7. coursewallah_learning reel: "Your website doesn't need a redesign"

Five "must try" patterns, each shown on a real site. No URLs in the reel. Verdict per pattern:

| Pattern | Shown on | Verdict | Where it lands in the spine |
|---|---|---|---|
| Horizontal scroll | A green "vault of money magic" page with a pinned horizontal strip | **Yes, laptop only.** Already planned: the Wall's horizontal ribbon of families on desktop, GSAP ScrollTrigger pin + x-translate. On phone it stays a vertical grid; hijacking vertical scroll on a phone is a rule-of-thumb failure. | Section 2, The Wall |
| 3D illustrations | Planetoño: a flat yellow page with a single glossy red 3D blob | **Yes, as a produced asset.** One rendered 3D case or swatch blob on a flat shade background is exactly the catalog look. Rendered in Morflax or endlesstools, shipped as WebP/AVIF, never as live WebGL. | Section 1 hero, day-in-shades stories |
| Physics animations | A "money museum" page with coloured coins drifting under gravity | **No for the spine, maybe for one moment.** Falling swatches is the kind of thing the vibecoded list bans (rules 42, 44) and it is Matter.js weight. The only version that survives review: on the reserve confirmation, a dozen circle swatches of the reserved family tumble once for 1.2 s. Flagged for the review loop; default is off. | Section 4, confirmation state only |
| 3D product scroll | A red drinks page where the bottle rotates as you scroll | **Yes, via image sequence, not 3D.** Dropbox has every shade on 21 devices but single angles; a turntable needs a render pass. Plan: 36-frame sequence per case type (not per shade; shade is a CSS tint layer), scrubbed by ScrollTrigger, canvas-drawn, with a static fallback. This is the "finish reveal" in the plan. | Section 1 or 3 |
| Smooth loaders | Farm Minerals "CropTab" with a soft gradient and a 3D product | **No loader.** The site is static and must paint in under a second; a loader hides a problem we will not have (checklist C1–C4, D1). What to borrow instead: the soft two-tone gradient behind a product, which fits rule 20's "flat colour, subtle". | n/a |

Net from this reel: horizontal ribbon and image-sequence scroll were already in the plan; 3D illustration confirms the Morflax/endlesstools decision; physics goes to a single gated moment; loaders stay out.

## 8. avi_vashishta29 "Cool Devs Don't Gatekeep Pt. 08 (Portfolio Edition)": four sites, visited

Sam's call: "these are definitely cool, we should use these." All four are real sites and the remote browser went to each one. What they actually are, measured, and what we take:

| Site | What it does | Measured | What Skreed takes |
|---|---|---|---|
| **Pacôme Pertant** (pacomepertant.com) "Crazy carousels with sound effects" | Projects on a 3D spiral, WebGL canvas with shader texture-warping; `spiral / list` toggle; sounds on hover (`hover.ogg`), on scroll (`tick.ogg`), on toggle. Spiral survives at 390 px. | Nuxt. First load about 3.15 MB. Font: Indivisible (Typekit). | **The spiral, as the Wall's laptop ribbon.** 240 tiles on a helix you scroll through, with the `spiral / grid` toggle borrowed verbatim. Built as DOM tiles on CSS 3D transforms driven by GSAP ScrollTrigger, not WebGL, so phones get the plain grid and the spine stays WebGL-free. **The sounds, opt-in.** One soft tick per tile at low volume, muted by default, a single speaker toggle in the nav. Audio never autoplays (browsers block it anyway). Budget: the whole site must stay under 1 MB on first load, a third of this reference. |
| **Kenichi Aikawa** (aikawakenichi.com) "More carousels with hover effects" | A ring of image segments (blue, orange, pink) on white; hover a segment to bring it forward, drag or scroll to rotate; WebGL canvas plus GSAP. | About 0.9 MB. Fonts: Neue Montreal, Editorial Old. | **The ring, as the family picker.** Ten arcs on one ring, each arc filled with its family's 24 shades as a conic gradient; hover or tap an arc to open that family in the Wall. This is the catalog's circle-swatch language in motion, and it is doable with `conic-gradient` + one rotating element, no canvas. Works on phone with touch-rotate. This replaces the React Bits Circular Gallery idea in section 1. |
| **Podium** (podium.global) "Scroll based animations" | Dark page; a shoe, a rock, an eye drift at different speeds as you scroll (per-layer parallax translate, no pin), behind a percentage preloader (52%, 93%). | Next.js + Lenis; animation library not exposed, likely Motion. Fonts: Futura, Univers Condensed. Preloader hides a heavy first load. | **The drift, for the day-in-shades stories.** Lifestyle photos (we have 218) at three parallax speeds on the charcoal section, translate only, CSS scroll-driven animations with a GSAP fallback. **Not the preloader** (checklist C, D1, H1). |
| **Hiroto Sato** (hirotos.com) "Interactive 3D models with CTAs" | A Three.js street-sign scene: plates are clickable routes (Projects archive), traffic light is the pointer target; `model.glb` is 862 KB; a 6.7 MB video also loads; a "LOADING..." screen with a scramble message first. | Three.js, GLB. Total well over 7 MB. | **The idea of clickable parts of a 3D object, deferred to the upgrade path.** For the teaser: the case render with three hotspots (camera bump, finish, shade name) that open the quiz, the finish toggle and the reserve form. Hotspots are HTML buttons positioned over the WebP, so it reads as "interactive 3D with CTAs" at 60 KB. The real GLB case (img2threejs, Vengeance Model Viewer pattern) is a week-3 add behind a user tap, laptop only, with the WebP as the fallback. |

What this changes in the plan: the Wall gets a spiral ribbon and a `spiral / grid` toggle on laptop; the family picker becomes the ring; sound is a feature flag, default off; the 3D hotspot card joins the hero. Nothing here adds WebGL to the spine; the budget stays 1 MB first load, Lighthouse 90+ on a mid-range Android.

## 9. kevin.snippet "6 website animations that instantly upgrade your site" (all Framer demos)

Sam's call: "should definitely try these as well." Each one is a Framer-made demo, so the names are patterns, not code. Verdict and placement:

| Animation | What the demo shows | Verdict | Skreed version |
|---|---|---|---|
| Entrance reveal | "Pixel reveal made simple": a block of tiles flips in to reveal text | **Yes, once.** | The 240-tile Wall is the pixel grid. On first view, tiles flip in from the centre outward over 600 ms (GSAP stagger from "center"), then never again. Reduced-motion: no flip. |
| 3D motion | A grainy sphere that spins on scroll and drag ("Scroll & Drag") | **Yes, as the case turntable.** | The image-sequence scrub from section 7 (36 frames per case type), plus drag-to-rotate on the same frames. No sphere, no particles. |
| Smooth loader | "BEYOND THE OR..." text typing in on black | **No loader.** The site paints in under a second (C1–C4, H1). | The text-in idea moves to the hero: "Basic." resolves into "Beyond Basic." once, as the splitter's first state. |
| Hover effects | A fanned stack of colour cards that spreads on hover | **Yes.** | The family picker's phone fallback and the share-card preview: a fan of six shade cards that spreads on hover (laptop) or on first tap (phone). Pure CSS transforms. |
| Parallax effect | A product card floating over a branch with moss, layers moving at different speeds | **Yes, subtle.** | Same as Podium's drift in section 8: three layers, small offsets, translate only. No cursor-parallax on text (rule 13). |
| Micro interaction | Fullstack studio: a row of project cards that tilt and lift as the cursor passes | **Yes.** | Tile hover on the Wall (lift 4 px, shadow from the shade's own hue at 20%), button press states, the counter tick, the consent checkbox. Choreographed once (D4). |

Also in the reel: **Mondragon** (digital agency) with a helix of images across the hero. Same family as the Pacôme spiral; one spiral on the site is enough, and it lives in the Wall.

Across sections 7, 8 and 9 the same five ideas keep appearing: horizontal or spiral scroll, a 3D product that turns, parallax drift, a hover fan, and a pixel reveal. They are all in the plan now, each in exactly one place, each with a phone and reduced-motion fallback.
