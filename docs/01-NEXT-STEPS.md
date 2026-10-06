# What is left before the build starts, and what Sam has to supply

Status on 2026-10-05. Ideation is complete: plan (`00-IDEATION.md`), ten research reports, the 240-shade dataset, the brand extract, the type system (`brand/type-system.md`), the 50 rules, the checklist (A to H), and the plan/build/review loop. Nothing is built yet, as agreed.

## 1. Decisions only the team can make (answer in one line each)

| # | Decision | Default if no answer |
|---|---|---|
| D1 | Scope freeze: the eight-section spine as written, including the spiral ribbon, ring picker, hero hotspots, image-sequence turntable. | Yes, freeze on build day 3. |
| D2 | What reserving gets you. The plan says priority access plus free shipping for 48 hours, no discount language. Prem to confirm. | As written. |
| D3 | Phone number required, no OTP, email optional. | Yes. |
| D4 | Counters shown only once a shade passes 10 real reservations. | Yes. |
| D5 | Name-the-241st-shade contest: run it or not. If yes, the prize and the judging criteria. | Not at launch. |
| D6 | Sound tick on the Wall: ship behind a muted-by-default toggle, or drop. | Ship muted, toggle in nav. |
| D7 | Physics tumble of swatches on the reserve confirmation (1.2 s, once). | Off. |
| D8 | Teaser go-live date. The build plan is 15 working days; from Oct 6 that lands on Oct 21, leaving ten days of live teaser before the Oct 31 cutover. Earlier means cutting scope. | Oct 21. |
| D9 | 3D tooling: one month of Morflax Pro ($15) or endlesstools PRO ($20) for the mosaic hero and stills, or neither. | Morflax, only if the mosaic hero is approved. |
| D10 | Animaster Lib Premium ($8) for scroll patterns. | Buy. |

## 2. Access and accounts (I cannot create these)

| # | Item | Why | Owner |
|---|---|---|---|
| A1 | Cloudflare account with skreed.in added, and the nameservers at the registrar pointed to it. | Hosting, Workers, Turnstile, the Nov 1 redirect, analytics. | Prem (domain owner) |
| A2 | A Cloudflare API token (Workers + Pages deploy, Turnstile) stored as a secret in this environment, never in the repo. | Deploys from the build loop. | Sam |
| A3 | Supabase: the connected org "Skreed" already has two projects (Skreed Sales Analytics in Tokyo, The Daily Edit in Seoul). Confirm one of: a new `skreed-prelaunch` project in Mumbai (ap-south-1), which needs the Pro plan if the org is on Free (two active projects is the Free limit), or a `prelaunch` schema with its own RLS inside Skreed Sales Analytics. | Lead storage. | Sam |
| A4 | Shopify: confirm I may create customers tagged `prelaunch-in` on zeosmobile-com via the connector. | Shopify mirror of leads. | Sam |
| A5 | PostHog project and key (free tier is enough). | Funnel events. | Sam |
| A6 | WhatsApp BSP: choose AiSensy or Interakt, open the account, submit the launch-day and reminder templates by Oct 22. | Nov 1 message is the verification. | Sam |
| A7 | Instagram broadcast channel on @skreedofficial and its join link. | The real follow driver. | Sam |
| A8 | Rotate the Composio API key that was pasted in chat. | It is exposed. | Sam |
| A9 | Allow the Day-1 tool installs in Claude Code (impeccable or taste-skill, web-design-guidelines, designer-skills plugins, 21st.dev MCP, Playwright, Lighthouse, Context7, Graphify, UnitOneAI SecuritySkills, animate, Matt Pocock skills). These need permission prompts approved once. | The loop depends on them. | Sam |

## 3. Assets and facts I need

| # | Item | Notes |
|---|---|---|
| F1 | Logo as SVG (wordmark, mark, mono, reversed). | Only PNGs exist. Ask whoever made the 2024 logo, or approve vectorising the Shopify PNG. Everything (favicon, OG, share card) waits on this. |
| F2 | Royal vs Midnight hex (Vivid Violets). | Shopify has one value for both. |
| F3 | Download the pixelsurplus Vintage Grit pack and the Creatoom iPhone 17 Pro and phone-case mockups, and put them in Dropbox under `Product Images Folder/teaser/`. | Both sites are blocked from this sandbox. |
| F4 | Ten family hero photos: approve the Firefly-composite approach, or shoot them. | Real case render on a generated set; the generator never draws the case. |
| F5 | A real team photo (Sam, Prem, Jyotika). | Founders' note, checklist G25. |
| F6 | Founders' note, first draft (120 words), and the ten family blurbs. I can draft; Jyotika and Prem review voice. | Copy deck. |
| F7 | Legal facts for the privacy page: legal entity name, registered address, grievance officer name and email, and whether a CIN or GST number should appear. | DPDP-shaped notice. |
| F8 | Confirm hero devices: iPhone 17 Pro, Galaxy S26 Ultra, Pixel 10 Pro. | Renders exist for all 21 devices. |
| F9 | Finish decision on the turntable: a 36-frame render pass per case type is needed for the scroll-scrub; confirm who renders it, or the turntable drops to a two-angle crossfade. | Section 1/3. |
| F10 | The exact ramp hexes from the brand guideline deck (Shade Set 3.3) if the share card should use them. | Optional. |

## 4. On my side, in order, once D1 and A1 are answered

1. Scaffold Astro 7 on Cloudflare, tokens from `DESIGN.md` (palette, 240 shades, type scale), fonts self-hosted, CI with Lighthouse.
2. `/ship-section` for the hero, then the Wall, then Reserve (with the Worker, Turnstile, Supabase, Shopify mirror), then Find your shade, Share, Stories, Manifesto, Footer and the legal pages.
3. Security pass against the 20-check list, QA matrix, cutover rehearsal with a 302.

## 5. Already decided, so nobody has to re-ask

Stack (Astro + Cloudflare + GSAP + Supabase + Shopify mirror + PostHog), no WebGL in the spine, phone-first, the 50 rules, the brand palette, Poppins Bold sentence-case headlines, Inter banned, the texture and tooling verdicts in `research/10`, the per-section user states in `CHECKLIST.md` section H.
