# Skreed pre-launch site: rules for Claude Code

This repo is the skreed.in pre-launch teaser (live until Oct 31 2026, then skreed.in redirects to skreed.com). Read `docs/00-IDEATION.md` for the plan and `docs/data/shades-240.json` for the shade system before touching UI.

## Brand facts (from the 2026-27 catalog, `docs/brand/`)
- 240 shades, exactly 24 per family. Families in catalog order: Frosty Whites, Blissful Blues, Playful Pinks, Vivid Violets, Mellow Yellows, Earthy Browns, Blushing Corals, Stormy Greys, Go Green, Roaring Reds. Use the display names in `shades-240.json` (e.g. "Sky", not "Sky Blue").
- Tagline: "Tech Essentials That Go Beyond Basic." Line: "colour is personal."
- Finishes: Matte and Gloss. Case types: Snap, Tough, MagTough, Armor, Ultra (plus Sylvr metallic).
- Voice: confident, minimal, design-led, short sentences. Never discount language. No hype.
- Visual identity: Pearl Whisper (#F7F6F3) pages alternating with Urban Slate (#383F43), Ember Luxe (#FF9900) as the single accent for the primary button and focus rings, circle swatches in a 6x4 grid, soft lifestyle photography on neutral backdrops. Extend this. Do not invent a new look.
- Typography (`docs/brand/type-system.md`, decided 2026-10-05): three families, four self-hosted files, 98 KB. **Poppins 700** is the voice: headlines in sentence case, the manifesto, the quiz question, the enlarged tile name, "You are #212", the 404. **Source Serif 4** 400 and 600, roman only, is the letter: hero sub-line, standfirsts, founders' note, day-in-shades stories, confirmation sentence. **Open Sans** 400 to 600 is the fittings: labels, inputs, buttons, family names, every live numeral with tabular figures, eyebrow, footer, legal prose. Never all-caps headlines, never italic, never a live number in Poppins.
- Voice (brand guide): first person, short sentences, active voice, sensory colour words. "We believe in the power of color."


- Section 2 (Sam, 2026-10-09, replaces the "coloured ice rocks" of 2026-10-08): the ten stones are polished, faceted, deformed crystal gems (the look of Marvel's infinity stones), one per family in its shade, never frosted ice or clay. No copy text in the section; only a small family-name label beside each gem, revealed the way igloo reveals its labels, gems spread across the screen at equal spacing. The background is igloo's animated section-2 background, re-created. The blocks leave the logo one at a time while the scroll is pinned, each visibly travelling down into section 2 before it settles as a gem. Hover is igloo's: waves and small geometric lines on the gem. Every gem is a link to its family page (`/shades/<family>/`), by click, tap and keyboard. The gems float in the air exactly like igloo's stones: re-create igloo's idle float (bob amplitude and period, slow rotation, per-stone phase, measured frame by frame). Sam wants the stones as close to igloo's as possible, resized and repositioned; we match them by measurement in our own models and code, never by shipping igloo's files. Look: **Gem C** (Sam, 2026-10-10): a faceted gem that refracts the background, traces inner reflections against its own facets and holds a luminous core, capped so it never clips or glows past the silhouette. Spec: `docs/specs/section-2.md`.
- Family pages (`/shades/<family>/`, 24 cases per family from one model, `docs/specs/family-page.md`): show the case only. Never draw a phone, device body, screen glass or lenses inside or behind a case; the camera window shows the page through (Sam, 2026-10-09).

## Never do these (the site must not look vibe-coded)
1. No purple-to-blue gradients. No gradient as a brand device at all; the brand's colour comes from the 240 shades themselves.
2. No gradient-filled hero text.
3. No emojis anywhere in the UI or copy.
4. No typeface outside `docs/brand/type-system.md`: **Poppins 700** headlines in sentence case, **Source Serif 4** 400/600 roman for first-person prose only, **Open Sans** 400 to 600 for UI, numerals, legal prose and small text. Only the four shipped WOFF2 files; a weight that is not shipped cannot be used. **Inter is banned in every role**, including the sub-headline slot the brand guide gave it.
5. No coloured-border cards.
6. No glassmorphism cards, no `backdrop-filter` blur panels. Gloss is shown with a specular highlight on the case render, not with glass UI.
7. No low-contrast dark mode. Charcoal sections use the catalog's charcoal with near-white text that passes WCAG AA.
8. No "three icon boxes in a row" feature grids.
9. No badge or pill above the headline.
10. No icon set sprinkled everywhere. Icons only where a control needs one; no Lucide-by-default.
11. No untouched shadcn/ui defaults (default radius, default shadows, default muted greys).
12. No fade-in-on-scroll as the default reveal. Sections are visible at rest. Motion is reserved for the hero splitter, the Wall, the tilt card and the manifesto, each choreographed on purpose.
13. No cursor-following beam, spotlight or glow.
14. No buttons that fade opacity on hover. Hover and press states change colour, scale or position with a real easing.
15. No inconsistent spacing. One spacing scale, set as tokens, used everywhere. Flex and grid with `gap`, not per-element margins.
16. No em dashes in copy. Use a full stop or a comma.
17. No generic buzzword copy ("seamless", "elevate", "unleash", "next-level", "revolutionary"). Specific over clever.
18. No serif italic accents and no italic of any face (`font-synthesis: none`). No Instrument Serif. Playfair is a campaign-creative face only. Source Serif 4 is never a headline, never above 28 px in the DOM, never UI chrome.
19. No Inter, Space Grotesk, Instrument Serif, Satoshi, Geist, Geist Mono, Manrope, DM Sans, Plus Jakarta Sans, Outfit, Urbanist, Montserrat, Lato, Playfair, League Spartan, Century Gothic or Aghita on the site. See rule 4.
20. No grain or noise texture layered over a gradient. If a matte texture is used it sits on a flat colour, is subtle, and never touches text.

## Never do these, part two (30 more tells)
21. No harsh gradients of any kind.
22. No Lucide icons (and no other icon set sprinkled as decoration).
23. No pure white (#fff) page background. The page neutral is Pearl Whisper #F7F6F3.
24. No rainbow colouring of UI or text. Precise reading for Skreed: the 240 shades are the product and may appear together in the Wall as swatches, in catalog order. They never colour headings, buttons, borders, backgrounds or icons. UI chrome is off-white and charcoal only.
25. No drop shadows. Depth comes from the renders and from colour, not from `box-shadow`.
26. No three feature cards in a row.
27. No emojis.
28. No liquid glass, no glassmorphism.
29. No em dashes.
30. No Inter, Geist or Space Grotesk, in any role.
31. No coloured left stripe on cards or quotes.
32. No fake testimonials. No testimonials at all before launch; there are no customers in India yet.
33. No bento grids.
34. No terminal or code-window mockups.
35. No "it's not X, it's Y" copy constructions. The tagline "Go Beyond Basic" stands as-is; never extend it into "it's not a case, it's...".
36. No checkmark bullet lists.
37. No three pricing tiers. No pricing at all on the teaser.
38. No section without a real product. Every section shows the actual case, the actual shades or the actual swatches. No abstract illustration standing in for the product.
39. No default soft corner radius everywhere. Radius is a token: either the catalog's large rounded card radius for a single hero panel, or square. Nothing in between, and never `rounded-lg` on every element.
40. No purple-and-black colour scheme.
41. Skeleton loaders are required wherever data loads (the Wall counters, the reserve confirmation). A spinner or a blank is a tell.
42. No radial orbs or blurred glow blobs.
43. No dot-grid backgrounds.
44. No sparkle icons, no "AI" sparkle motifs.
45. No animated arrows.
46. Terms of service page is required.
47. Privacy policy page is required (DPDP-shaped; see the plan).
48. No gratuitous hover animations. Hover and press states exist for controls and the Wall tiles because they are interactions, and each is choreographed once. Nothing else moves on hover.
49. No neon colours in UI chrome. Neon shades in the palette (Neon, Gumball, Psychedelic) appear only as swatches.
50. No "basic pastel" UI colouring. Pastel shades in the palette (Chiffon, Ballerina, Pale Violet) appear only as swatches, never as section backgrounds or card fills.

## Always do these
- Phone first. Build and test at 390 px before any desktop layout. Must look as strong on a phone as on a laptop.
- Performance budget: critical JS under 60 KB gz, total JS under 250 KB gz, hero image under 120 KB, first view under 1.5 MB, LCP under 2.5 s on throttled 4G. One WebGL island only: the pinned hero canvas, which spans section 1 (the logo in glowing blocks, decided 2026-10-07) and section 2 (the ten blocks dispersed one at a time into polished crystal gems on igloo's animated section-2 background, decided 2026-10-08, revised 2026-10-09), lazy-loaded behind a static poster image, with a no-WebGL, data-saver and reduced-motion fallback. No WebGL from section 3 (the Wall) on.
- Honour `prefers-reduced-motion` everywhere via `gsap.matchMedia()`.
- Every UI state designed: empty, loading, error, offline, slow network, no results, permission denied, validation, success.
- Colours only from `shades-240.json`, the two page neutrals (Pearl Whisper, Urban Slate) and the one accent (Ember Luxe). Almond Silk, Steel Twilight and Rust Ember are available for the share card and stories, never for UI chrome. Define them as CSS tokens on `:root`.
- Real content only. Never lorem ipsum, never invented shade names, never fake counts.
- Run `/web-design-guidelines` and the security checklist in `docs/research/08-prelaunch-security-checklist.md` before any push to main.

## Approved exceptions (Sam, 2026-10-09)
Sam approved the hero prototype as built ("I'm good with whatever we've built so far", 2026-10-09). These properties of that hero are exceptions to the rules above and to `docs/CHECKLIST.md`. They apply to the hero (sections 1 and 2's canvas) only. Full wording and reasons: `docs/specs/hero.md` section 10.
- E-H1: the full-screen wordmark loader on the 3D path (CHECKLIST H1, D1); the poster path never shows it.
- E-G2: no CTA on the fold (CHECKLIST G2); reserving starts in later sections.
- E-C3: the hero canvas is the one WebGL island (CHECKLIST C3, "no WebGL in a spine section").
- E-C3b: the countdown's clip-path ride and the logotype glitch's SVG attribute animation (CHECKLIST C3, "transform/opacity only").
- E-12: the hero canvas, the loader, the cue's three bounces and the logotype bursts move on their own (rule 12).
- E-13/42: the block glow under the pointer and the canvas bloom (rules 13 and 42).
- E-1/21/40: the sky's faint galaxy wash in Space, Eggplant, Forest and Wine over the night sky (rules 1, 21 and 40).
- E-24: the logotype glitch splits in shade pairs, and the loader draws a hairline outline of the wordmark (rule 24; the brand guide's "no outlines" on the logo).
- E-A2: `--night` #050506 as the scene and `/` background under the hero, and Pearl Whisper at alpha as light in the hero (CHECKLIST A2).
- E-A2b: the scene's light colours are render parameters, not palette colours (CHECKLIST A2).
- E-A3: the hero's type sizes (countdown numerals, loader percent at 400, eyebrow and labels at 14 px 600; CHECKLIST A3, type-system).
- E-GSAP: the hero honours reduced motion through `matchMedia` and CSS, because it loads no GSAP ("Always do": `gsap.matchMedia()`).

Still pending Sam (the build ships the plan's default and flags it; list in `docs/specs/hero.md` section 11): E-C4 (Lighthouse graded on the poster tier), E-2.2.2 (scene and countdown without a pause control), the reduced-motion tier, the four proposed strings, the `--night` token name, where the texture masters live, and the review tools E1 and E2.

## Stack (decided; do not swap without asking)
Astro 7 static on Cloudflare Workers + Static Assets. GSAP (ScrollTrigger, SplitText, Flip) for motion; CSS scroll-driven animations where supported; Motion mini only inside React islands; Lenis on desktop only. Supabase for leads via one Worker endpoint with Turnstile; Shopify customer mirror; PostHog + Cloudflare Web Analytics. Details in `docs/research/01-stack-and-hosting.md`.

## How work gets done here: the loop
Every section is built by `/ship-section "<brief>"`, which runs the `plan` skill, then `build`, then `review`, and repeats build → review until the reviewer returns PASS against `docs/CHECKLIST.md` (max 5 iterations, then stop and report). The builder never grades its own work. Specs live in `docs/specs/`, review logs next to them. Do not build a section outside this loop.

## Day-1 Claude Code setup (install before writing UI)
1. Taste layer, pick one: `npx skills add https://github.com/pbakaus/impeccable --skill impeccable` or `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend`.
2. Vercel audit: `web-design-guidelines` from `vercel-labs/agent-skills`; run `/web-design-guidelines <file>` before every push.
3. Design-system skill: the `ui-design` plugin from `/plugin marketplace add Owl-Listener/designer-skills` (`color-palette`, `type-system`) to turn `shades-240.json`, the brand palette and the Poppins/Source Serif 4/Open Sans scale into tokens. Also install `visual-critique` and `designer-toolkit` from the same marketplace.
4. 21st.dev MCP (`/ui` component search) for polished primitives; never paste a component without restyling it to the tokens (rule 11).
5. Playwright MCP/CLI so Claude screenshots every section at 390 px and 1280 px and reviews its own output before reporting done.
6. Day 2 writes `DESIGN.md` at the repo root in the awesome-design-md format (tokens for the brand palette, the 240 shades by family, the Poppins/Source Serif 4/Open Sans scale from `docs/brand/type-system.md`, spacing, radius, motion durations). After that, every UI change reads `DESIGN.md` first.
7. 3D upgrade path only (after the five spine sections ship): the `img2threejs` skill (github.com/img2threejs/img2threejs) to rebuild a case from one Dropbox render as procedural Three.js, loaded on tap and gated by GPU tier.
8. The "you need" five, all day 1: 21st.dev MCP (above), Lighthouse (run on every build; score is checklist C4), Context7 MCP (current docs for Astro, GSAP, Supabase), Graphify (`graphify claude install`; run `/graphify` once the repo has more than a handful of files, and re-run after each section), and a security skill. "never-get-hacked" could not be found under that name; use UnitOneAI/SecuritySkills (OWASP/NIST-grounded, works in Claude Code) as the equivalent, and before installing any third-party skill read its raw SKILL.md for curl, wget, eval, base64 or outbound requests.
9. Also: `animate` skill, Matt Pocock's skills (`claude plugins install mattpocock-skills`) for the signup worker, PostHog MCP once live.
