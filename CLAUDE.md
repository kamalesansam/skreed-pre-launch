# Skreed pre-launch site: rules for Claude Code

This repo is the skreed.in pre-launch teaser (live until Nov 3 2026, then skreed.in redirects to skreed.com). Read `docs/00-IDEATION.md` for the plan and `docs/data/shades-240.json` for the shade system before touching UI.

## Brand facts (from the 2026-27 catalog, `docs/brand/`)
- 240 shades, exactly 24 per family. Families in catalog order: Frosty Whites, Blissful Blues, Playful Pinks, Vivid Violets, Mellow Yellows, Earthy Browns, Blushing Corals, Stormy Greys, Go Green, Roaring Reds. Use the display names in `shades-240.json` (e.g. "Sky", not "Sky Blue").
- Tagline: "Tech Essentials That Go Beyond Basic." Line: "colour is personal."
- Finishes: Matte and Gloss. Case types: Snap, Tough, MagTough, Armor, Ultra (plus Sylvr metallic).
- Voice: confident, minimal, design-led, short sentences. Never discount language. No hype.
- Visual identity: warm off-white pages alternating with charcoal, a thin-weight and black-weight sans pairing in one family for headings, circle swatches in a 6x4 grid, soft lifestyle photography on neutral backdrops. Extend this. Do not invent a new look.

## Never do these (the site must not look vibe-coded)
1. No purple-to-blue gradients. No gradient as a brand device at all; the brand's colour comes from the 240 shades themselves.
2. No gradient-filled hero text.
3. No emojis anywhere in the UI or copy.
4. No Inter. The site uses one family only: **Urbanist** (Google Fonts, self-hosted WOFF2, weights 200, 400, 500, 900), set in the catalog's thin + black pairing for headings. Sam may swap it for Geologica, Bricolage Grotesque or Onest after reviewing the specimen page; whichever is chosen, it is still one family and never Inter.
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
18. No serif italic accents. No Instrument Serif. One sans family does all the work.
19. No Space Grotesk, Instrument Serif, Satoshi, Geist, Manrope, DM Sans, Plus Jakarta Sans or Outfit. See rule 4.
20. No grain or noise texture layered over a gradient. If a matte texture is used it sits on a flat colour, is subtle, and never touches text.

## Always do these
- Phone first. Build and test at 390 px before any desktop layout. Must look as strong on a phone as on a laptop.
- Performance budget: critical JS under 60 KB gz, total JS under 250 KB gz, hero image under 120 KB, first view under 1.5 MB, LCP under 2.5 s on throttled 4G. No WebGL in the five spine sections.
- Honour `prefers-reduced-motion` everywhere via `gsap.matchMedia()`.
- Every UI state designed: empty, loading, error, offline, slow network, no results, permission denied, validation, success.
- Colours only from `shades-240.json` and the two page neutrals (off-white, charcoal). Define them as CSS tokens on `:root`.
- Real content only. Never lorem ipsum, never invented shade names, never fake counts.
- Run `/web-design-guidelines` and the security checklist in `docs/research/08-prelaunch-security-checklist.md` before any push to main.

## Stack (decided; do not swap without asking)
Astro 7 static on Cloudflare Workers + Static Assets. GSAP (ScrollTrigger, SplitText, Flip) for motion; CSS scroll-driven animations where supported; Motion mini only inside React islands; Lenis on desktop only. Supabase for leads via one Worker endpoint with Turnstile; Shopify customer mirror; PostHog + Cloudflare Web Analytics. Details in `docs/research/01-stack-and-hosting.md`.

## Day-1 Claude Code setup (install before writing UI)
1. Taste layer, pick one: `npx skills add https://github.com/pbakaus/impeccable --skill impeccable` or `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend`.
2. Vercel audit: `web-design-guidelines` from `vercel-labs/agent-skills`; run `/web-design-guidelines <file>` before every push.
3. Design-system skill: the `ui-design` plugin from `/plugin marketplace add Owl-Listener/designer-skills` (`color-palette`, `type-system`) to turn `shades-240.json` and the Urbanist scale into tokens. Also install `visual-critique` and `designer-toolkit` from the same marketplace.
4. 21st.dev MCP (`/ui` component search) for polished primitives; never paste a component without restyling it to the tokens (rule 11).
5. Playwright MCP/CLI so Claude screenshots every section at 390 px and 1280 px and reviews its own output before reporting done.
6. Also: `animate` skill, Context7 MCP, Matt Pocock's skills (`claude plugins install mattpocock-skills`) for the signup worker, a security skill (StackHawk or UnitOneAI SecuritySkills), PostHog MCP once live.
