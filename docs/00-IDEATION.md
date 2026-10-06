# Skreed Pre-Launch Site: Ideation & Plan

Prepared 2026-10-01. Live window: skreed.in forwards to this site until Oct 31, then to skreed.com on Nov 1. No festival framing anywhere on the site (Sam, 2026-10-06).

Detailed research behind every section lives in `docs/research/` (seven reports, including a digest of Sam's 149 saved Instagram posts) and the data files in `docs/data/`. This document is the synthesis: what we know, what we recommend, and what the team still has to decide.

---

## 1. What we are building and why

**Goal stack (Prem's priority order)**
1. Position Skreed as a lifestyle brand that connects, not a tech brand.
2. Say "this changes everything in the space".
3. Get people to share their details.
4. Get people to follow @skreedofficial.

**Hard constraints**
- Must be as magnetic on a phone as on a laptop. Most traffic will arrive from the Instagram bio link, inside Instagram's in-app browser, on mid-range Android over 4G.
- One developer (Sam + Claude Code), roughly three working weeks.
- Brand voice from the Skreed Brain doc: confident, minimal, design-led, short sentences, no hype, max two emojis, never sound like a discount brand.

**The one idea everything hangs on**
Skreed's real product is *shade*, not a print and not protection. Every competitor in India (DailyObjects, Qrioh, The Case Company, Kalakaar) sells artwork grids; every global one (Casetify, Burga, Dbrand, Mous) sells prints or armour. Nobody sells a colour system. So the teaser should look like a paint brand or Pantone that happens to make cases, not like a case brand. The 240-shade wall is the hero, the shock stat, and the lead magnet at the same time.

**What we found in the company's own data**
- The store already runs: 1,157 active products, 70 orders / $2.9K in September, US-first, AOV ~$44.
- **The 2026-27 product catalog is the source of truth for the shade system:** exactly 240 shades, 24 per family, with short display names (e.g. "Sky", not "Sky Blue"). Family names as the catalog prints them: Frosty Whites, Blissful Blues, Playful Pinks, Vivid Violets, Mellow Yellows, Earthy Browns, Blushing Corals, Stormy Greys, Go Green, Roaring Reds. Every catalog name is matched to a Shopify hex and a Dropbox render in `docs/data/shades-240.json` (and `.csv`). Shopify's raw export (`shades.json`) carries three extra legacy entries that are not in the catalog and should be ignored. One remaining collision: Royal and Midnight (violets) share a hex in Shopify although the catalog shows them as different colours; get the real Royal value from whoever built the catalog.
- **Catalog brand facts to carry into the site:** tagline "Tech Essentials That Go Beyond Basic"; "colour is personal"; "Skreed has redefined colour-first tech personalisation in international markets. Now, we are bringing that innovation to India." Ecosystem: phone cases (Snap, Tough, MagTough, Armor, Ultra, plus Sylvr metallic in 48 shades), AirPods cases (Pro 2, Pro 3, 4, Max), MagSafe wallets (240 shades, four finishes), LenSkin camera accents, MagSocket, Forge-X screen protector, lanyards. Devices: iPhone 15/16/17/18, Galaxy S25/S26, Pixel 10/11. Contact: collab@skreed.in, Hyderabad.
- **Brand guide (decided 2026-10-05, `docs/brand/brand-guidelines-extract.md`):** Poppins Bold headlines in sentence case, Source Serif 4 for first-person prose (hero sub-line, founders' note, stories; the one departure from the guide, Inter being banned), Open Sans for UI, numerals and legal prose. Full spec in `docs/brand/type-system.md`. Palette: Pearl Whisper #F7F6F3 pages, Urban Slate #383F43 charcoal, Ember Luxe #FF9900 accent, plus Almond Silk, Steel Twilight, Rust Ember for creative. Circle swatches in a 6×4 grid per family, soft lifestyle photography on neutral backdrops. The catalog PDF is set in Neue Montreal and all caps; the guide wins, so the site is Poppins and sentence case.
- Finishes in Shopify: gloss, matte, metallic, metallic-matte, metallic-gloss. Case types: snap, tough, magtough, armor, ultra, plus legacy back-cover/shell-cover.
- Renders (full inventory in `docs/data/dropbox-asset-inventory.md`): Dropbox holds 10,080 Amazon hero renders (`{Shade}_A1.png`, ~1.1 MB each) covering exactly 240 shades (24 per family) for 21 devices across iPhone 15/16/17, Galaxy S25/S26 and Pixel 10. Only the "tough" and "magtough" folders are populated and they are byte-identical, so there are 5,040 unique renders. Also 264 tiny swatch PNGs (`{Shade}_SWCH.png`), 218 lifestyle shots (per family × device, 4–9 MB), and finish/compatibility/comparison panels. No logos, videos or source files. Whether the renders have transparent backgrounds could not be checked from the sandbox.
- Shopify Files holds the logo PNGs; no SVG logo exists yet.
- Instagram sits at 59 followers with the content system dark for half of September. The site has to do real follower work, not just link out.

---

## 2. The site: recommended spine

A single page, phone-first, each section roughly one screen tall. Narrative: *Basic is over → here are the 240 → which one is you → claim it → tell someone → see it in a day → who we are.*

| # | Section | What happens | Goal served |
|---|---|---|---|
| 1 | **Hero: Basic vs Beyond Basic** | A thumb-drag divider: left is the black case everyone owns, right is the same phone in a Skreed shade. Headline resolves once from "Basic." to "Beyond Basic." Sub "240 shades. Doors open Nov 1." Three hotspots on the case render (camera bump, finish, shade name) open the quiz, the finish toggle and the reserve form. A day counter in the corner tinted by today's shade. | 2, 1 |
| 2 | **The Wall** | All 240 shades as one living grid; tiles flip in from the centre once on first view. Tap a tile: it swells, shows name + family + a Reserve chip. Family picker is a ring of ten arcs (each arc a conic gradient of its 24 shades), touch-rotate on phone, hover on laptop. Laptop adds a `spiral / grid` toggle: the 240 on a scroll-driven helix (CSS 3D, no WebGL). Optional soft tick per tile, muted by default. One greyed 241st tile: "Follow to reveal." | 1, 2, 4 |
| 3 | **Find your shade** | Tabs: Quiz (six swipe cards, "Beige or Rouge?") as default; From a photo (upload, five-colour palette matched to the 240); Live camera behind a flag for week two. Result: a shade card with tilt-to-see gloss vs matte on phone. | 1, 3 |
| 4 | **Reserve your shade** | Phone number (+91 fixed) as the one required field, email optional after. Device and finish pickers. Live per-shade counter. Confirmation: "Mauve is yours. First dibs Nov 1." Then "Find your twin": a referral link that unlocks a complementary pair shade for both. | 3 |
| 5 | **Share** | Canvas-generated 1080×1920 story card ("My Skreed shade is Mauve") sent through the native share sheet to WhatsApp or Instagram Stories. "Tag @skreedofficial." | 4, 3 |
| 6 | **One day, five shades** | Five moments of an ordinary day, five shades (7 am Sunbeam, 9 am Charcoal, 2 pm Aquamarine, 7 pm Rouge, 11 pm Midnight). Lifestyle photos drift at three parallax speeds on charcoal (translate only). "Reserve for two" with a second name. Colour and type only, no clipart, nothing seasonal. | 1, 3 |
| 7 | **Manifesto + founders' note** | Pinned kinetic type: "Smart. Sleek. Skreed." each word fills with a family colour. Then a 120-word founders' note with a reply field. | 1, 2 |
| 8 | **Footer** | Nov 1, Instagram and broadcast-channel links, privacy and T&Cs. | 4 |

**Why this spine and not the others.** The concept catalog (`06-concept-catalog.md`) scores 27 concepts on phone wow, laptop wow, lead capture and shareability. The five chosen are the ones that score four or five on phone *and* on lead capture or shareability, cost under two days each, and need no WebGL. The splitter hero is the cheapest big-impact concept in the whole list. The quiz is the highest-converting mechanic. The wall is the USP. Reserve and share are the business.

**Reference sites behind these choices** (visited, measured, in `research/10-reactbits-textures-endlesstools.md` §8–9): Pacôme Pertant's spiral and sound (3.15 MB; ours must stay under 1 MB), Kenichi Aikawa's ring (0.9 MB), Podium's drift, Hiroto Sato's clickable 3D plates (7 MB+; ours is hotspots over a WebP, the GLB case is week-3 and tap-to-load).

**Ambient layer.** The site re-tints daily: 34 days, 34 shades, so there is a reason to come back and a different screenshot every day.

**Kept on the bench (ship only if ahead of schedule by day 12):** shake-to-shuffle, Shade of the Day with daily WhatsApp, City Shade ("Hyderabad at 6:12pm"), Case Wardrobe planner, sound-reactive shade, AR on-desk via model-viewer, the "name the 241st shade" contest.

---

## 3. Stack decision

| Layer | Recommendation | Why |
|---|---|---|
| Framework | **Astro 7, static output** | Zero-JS baseline is the only way to hit LCP under 2.5 s on Indian mid-range Android while still layering heavy interactivity as lazy islands. Claude Code works very well with Astro's plain HTML/TS. |
| Motion | **GSAP 3.15 (ScrollTrigger, SplitText, Flip)** | Free for commercial use since v3.13 (Webflow). Best scroll-storytelling toolkit; `matchMedia()` handles reduced-motion and per-breakpoint timelines. |
| Micro-interactions | Motion (mini build) inside any React island; CSS scroll-driven animations where supported | Tiny, hardware-accelerated. |
| Background | Flat off-white and charcoal sections, as in the catalog. Colour comes from the shades, never from a gradient. | Cheapest possible paint; nothing to jank. A gradient background is on the banned list in `CLAUDE.md`. |
| 3D | **None in the spine.** If a 3D hero is wanted later: procedural case in react-three-fiber (rounded box, PBR matte/gloss presets, colour from shades.json), loaded on tap and gated by detect-gpu tier | $0, 1–2 days, no licence issues. Buying or AI-generating a case model costs more and looks worse for a hard-surface product. |
| Hosting | **Cloudflare Workers + Static Assets, DNS zone for skreed.in moved to Cloudflare** | Unlimited static bandwidth, 22 Indian PoPs, Turnstile + redirect rules + analytics in one dashboard. Vercel Hobby is non-commercial and would be a terms breach; Vercel Pro ($20) is the fallback. |
| Domain | Serve the site **directly** on skreed.in (CNAME, proxied). Do not use registrar forwarding (HTTPS breaks). | On Nov 1, add one Cloudflare Single Redirect rule `skreed.in/* → skreed.com/$1`; live in seconds, no DNS change, instant rollback. |
| Lead store | **Supabase** `leads` table as source of truth, insert-only via an edge function | Keeps consent evidence, referral codes, UTM. Mirror to Shopify customers (tag `prelaunch-in`) so Shopify Email can send on Nov 1 for free. |
| Anti-spam | Cloudflare Turnstile (free, invisible) + honeypot + per-IP/phone rate limit + unique indexes | Standard; official Supabase example exists. |
| Email | Shopify Email (10,000/month free) | Klaviyo and Mailchimp free tiers now cap at 250 contacts; Klaviyo has no India SMS. |
| WhatsApp | AiSensy (cheapest broadcasts) or Interakt (Shopify-native). Templates submitted by Oct 22; account verification takes 1–3 days. | WhatsApp is the India launch-day channel: 85–95% open rates. |
| Analytics | PostHog (1M events free) + Cloudflare Web Analytics for Core Web Vitals | Custom events for signup, follow click, shade selected, share. UTMs on every link because Instagram strips Referer. |
| Fonts | **Three families, one job each** (`docs/brand/type-system.md`): Poppins 700 the voice, Source Serif 4 400/600 roman the letter, Open Sans 400 to 600 the fittings. Inter banned. Campaign alternates stay off the site. | All OFL; four self-hosted WOFF2 Latin subsets, 97.9 KB measured, built by `scripts/fonts/build.py`; `font-display: swap`; measured `size-adjust` fallbacks; `font-synthesis: none`. |

Full package list with versions and the repo tree are in `01-stack-and-hosting.md`.

**Claude Code setup for the build (from Sam's saved posts, verified; details in `07-instagram-saved-collections.md`):** one taste layer (`impeccable` or `taste-skill`), Vercel's `web-design-guidelines` audit skill, the `animate` skill, three plugins from Owl-Listener/designer-skills (`ui-design`, `visual-critique`, `designer-toolkit`), Playwright MCP so Claude screenshots and grades its own output, 21st.dev MCP for polished primitives, Context7 MCP for current docs, Matt Pocock's skills for test-first work on the signup function, a security skill plus the vibe-coder checklist (no hard-coded keys, verify webhook signatures, reject non-JSON, rate limit, no public tables), and PostHog MCP once the campaign is live. Reference libraries for motion patterns: Skiper UI and Animaster Lib. endlesstools.io for quick 3D key visuals.

---

**Design rules Claude Code is bound by.** The root `CLAUDE.md` carries the brand facts and a 20-item "never do this" list (no gradients, no gradient text, no emojis, no Inter-by-default, no glass cards, no icon rows, no badge above the headline, no fade-in-on-scroll as the default reveal, no cursor beams, no serif italic accents, no grain over gradients, no em dashes, no buzzword copy, one spacing scale). Several of those overrule earlier suggestions in the research reports (Instrument Serif, Lucide everywhere, grain on a mesh gradient); `CLAUDE.md` wins.

## 4. Decisions the team needs to make

Each has a recommended default so the build can start without a meeting.

| # | Decision | Recommended default |
|---|---|---|
| 1 | Scope: the five-concept spine, or more? | Spine. Freeze by build day 3. Extras only if ahead by day 12. |
| 2 | Required field: phone or email? | Phone (+91) required, email optional on the confirmation screen. No OTP (20–30% abandonment, DLT registration delays). The Nov 1 WhatsApp message is the verification. |
| 3 | What does reserving get you? | Priority access + free shipping for the first 48 hours. No discount language (brand rule). |
| 4 | Show scarcity counters? | Yes, but only real counts, and only once a shade passes 10 reservations. |
| 5 | Camera at launch? | No. Photo upload at launch; live camera in week two. Camera permission prompts lose 30–50% of users. |
| 6 | Run a contest? | Optional: "name the 241st shade", judged on stated criteria (skill, not draw), prize under ₹10,000, T&Cs published, Tamil Nadu excluded from any chance element. Instagram follow can be a bonus entry, never a condition. |
| 7 | Render approach | One greyscale master render per case type, tinted via CSS/canvas for all 240 shades; ten real hero photos (one per family) for the stories. Do not ship 240 images. |
| 8 | Shade data | `docs/data/shades-240.json` (catalog names + Shopify hex) is the single source; resolve the Royal/Midnight hex. |
| 9 | Hosting | Cloudflare. Needs skreed.in nameservers moved (Prem, as domain owner). |
| 10 | Cutover | Cloudflare redirect rule on Oct 31 night, 302 for ten minutes of testing, then 301. Keep the teaser alive at skreed.com/teaser for referral links. |
| 11 | Instagram follow gate | Honour-system only. Meta cannot verify follows and prohibits enforced engagement gates. The broadcast-channel join link is the real follow driver because joining forces a follow. |
| 12 | Emojis | Zero sitewide. |

---

## 5. Assets: what exists, what has to be made

**Exists**
- Canonical shade dataset: `docs/data/shades-240.json` and `.csv` (240 shades, catalog names, Shopify hex, Dropbox render stem per shade).
- 5,040 unique per-shade hero renders on Dropbox (240 shades × 21 devices, Amazon `_A1` angle only), 264 swatch PNGs, 218 lifestyle shots; plus 2500×2500 diagonal-split matte/gloss composites on the Shopify CDN. Recommended teaser picks: `tough/{family}/{17 pro | S26 Ultra | Pixel 10 Pro}/{Shade}_A1.png`, downscaled to AVIF/WebP.
- Logo as PNG on Shopify Files (`skreed_logo_1200_628.png`, `Logo_skreed-4_20240711_charcoal.png`, `skreed_logo_300a.png`).
- Brand fonts and voice rules (Skreed Brain doc).

**Has to be made (owner: Sam unless noted)**
| Asset | How |
|---|---|
| Logo SVG (wordmark, mark, mono, reversed) | Vectorise the Shopify PNG with the Adobe MCP `image_vectorize`, or source the original from whoever made it. Everything else (favicon, OG, share card) depends on this. Do first. |
| Favicon set + OG image | From the mark; per-shade OG images generated at build time with Satori. |
| Greyscale master renders, one per case type | From the Dropbox renders: background removal via Adobe MCP, desaturate, keep the specular layer separate for the gloss overlay. |
| Ten family hero photos | Real render composited on a Firefly-generated colour-drenched set (Firefly is commercially safe). Prompt pattern in `05-assets-and-creative-tooling.md`. Never let a generator draw the case. |
| Share-card template | Drawn in Canvas 2D at runtime, not DOM screenshots (fonts and CORS break on iOS). |
| Copy deck | Headline, sub, CTA, confirmation, error, ten family blurbs, 240 one-line shade stories, founders' note. Jyotika and Prem to review voice. |
| Legal | Privacy notice (DPDP-style: what we collect, why, how to withdraw), T&Cs if a contest runs. |
| WhatsApp templates | Launch-day and reminder templates submitted by Oct 22. |

Target weights: hero image ≤ 120 KB AVIF, grid tile ≤ 25 KB, swatch ≤ 2 KB, first-view page ≤ 1.5 MB, JS ≤ 150 KB gz before any lazy island.

---

## 6. Growth mechanics

- **Reserve your shade** is the capture. Deterministic reward (priority + free shipping), real counters.
- **Shade Twin referral**: unique link per lead; when a friend reserves, both unlock a complementary pair shade and move up the queue. Rewards are earned, not drawn, so no lottery exposure. Count a referral only once the friend's number receives a message (anti-fraud).
- **Referral ladder** (Harry's model, adapted): 3 friends = early access hour, 10 = a free matte case in any shade, 25 = name a shade, 50 = a full family set.
- **Share card** at the end of every flow, through the native share sheet to WhatsApp (India's default) and Instagram Stories.
- **Instagram**: universal-link follow button, `ig.me/m/skreedofficial` DM link for "DM us your shade", and the broadcast-channel invite as the primary post-signup CTA. Hidden 241st shade as an honour-system nudge.
- **Expectancy check on every ask** (Vroom's expectancy × instrumentality × valence; applied in `09-expectancy-theory-applied.md`): show the reward before the action, make it specific (a named shade, a date, a queue position), keep the action to one tap or one field, keep progress toward delayed rewards on screen, and prove the first promise fast with a WhatsApp confirmation within a minute. Two concrete changes: the 241st tile links to the broadcast channel instead of an honour-system "I followed" button, and the share screen shows "1 of 3 friends joined" with the pair shade greyed until unlocked.
- **Launch day (Nov 1)**: 07:00 IST WhatsApp template with early-access link, 07:05 Shopify Email to the `prelaunch` segment, 12:00 broadcast-channel post and story, Nov 2 reminder to non-clickers, Nov 8 "48 hours left".

---

## 7. Build plan (15 working days)

| Day | Work |
|---|---|
| 1 | Astro repo, shades.json wired, Cloudflare deploy, skreed.in DNS move started, Turnstile keys |
| 2 | Design tokens, type, phone and laptop layout skeleton, daily-shade theming |
| 3 | Hero split slider; greyscale render + tint pipeline. **Scope freeze.** |
| 4 | The Wall: grid, stagger, tap sheet, family tabs; perf pass on a Redmi-class device with 4× CPU throttle |
| 5 | Supabase schema (leads, referrals, share_events), edge function with Turnstile + rate limit; Reserve sheet |
| 6 | Live per-shade counters, Shopify customer mirror, confirmation screen |
| 7 | Quiz: cards, scoring, result screen |
| 8 | Photo palette: k-means, OKLCH nearest-shade match, upload UX |
| 9 | Share card: canvas template, Web Share, download fallback, per-shade OG images |
| 10 | Tilt gloss/matte on the shade card; finish toggle; iOS motion-permission flow |
| 11 | Shade Twin referral, hidden 241st tile, Instagram and broadcast-channel links |
| 12 | Day-in-shades stories, manifesto, founders' note, copy pass |
| 13 | Analytics events; camera flow behind a flag |
| 14 | QA matrix: iPhone 13/15/17 Safari, Pixel and Samsung Chrome, Redmi-class Android, Instagram in-app browser, Jio 4G throttle, Lighthouse ≥ 90 mobile, reduced motion. Security pass: the 20-check list in `08-prelaunch-security-checklist.md`, ending with Claude attacking the deployed signup endpoint |
| 15 | Cutover rehearsal, seed counters, legal pages, the 20 real-site essentials in `docs/CHECKLIST.md` section G (404, meta, OG, favicons, robots, sitemap, alt text, sticky mobile CTA, thank-you state, privacy, terms, analytics verified, real contact), buffer |

Parallel, not on the dev path: logo SVG (day 1–2), copy deck (days 3–8), hero photos (days 4–9), WhatsApp BSP account and templates (by Oct 22), nameserver move (Prem, day 1).

---

## 7b. The sixteen layers, each with an owner and a decision

AI writes code; the team still holds every layer below. Each one has an answer for the teaser so nothing is discovered on launch night.

| Layer | Decision for the teaser | Where it is specified |
|---|---|---|
| System design | One static page + one write endpoint + one read endpoint (counters) + one redirect page (`/r/<code>`). Nothing else. | §2 spine, `01-stack-and-hosting.md` §7 |
| System architecture | Astro static on Cloudflare Workers Static Assets; Worker handles `/api/signup`, `/api/counts`, `/r/*`; Supabase Postgres; Shopify mirror fire-and-forget; PostHog + Cloudflare Analytics. | `01-stack-and-hosting.md` |
| Frontend | Astro + GSAP + tokens; React islands only for quiz and share; 50 design rules; review loop per section. | `CLAUDE.md`, `docs/CHECKLIST.md`, `.claude/skills/*` |
| APIs and backend logic | Three routes above. Zod validation, Turnstile verify, E.164 normalisation, `reserve_shade()` Postgres function for the counter, idempotent Shopify `customerCreate`. | `04-signup-virality-social.md` §2, `08-prelaunch-security-checklist.md` |
| Databases and storage | Supabase: `leads`, `referrals`, `share_events`, `attempts`. Unique indexes on lower(email) and phone_e164, index on referral_code. No file storage (photos processed on-device). Daily CSV export in the final week. | `08-prelaunch-security-checklist.md` rows 2, 8, 19 |
| Auth and permissions | No user accounts. RLS deny-all for anon; service-role key only inside the Worker. Referral cookie HttpOnly/Secure/SameSite=Lax. Team dashboard, if any, behind Cloudflare Access. | `08-…` rows 2, 5, 6, 17 |
| Hosting and cloud | Cloudflare (free): Workers, Static Assets, DNS zone for skreed.in, Turnstile, Rate Limiting, Redirect Rules. Fallback Vercel Pro. | `01-stack-and-hosting.md` §2–3 |
| CI/CD and version control | GitHub repo; branch per section; `.github/workflows/deploy.yml` builds and runs `wrangler deploy`; Lighthouse CI asserts the mobile budget on every PR; gitleaks pre-commit. | `01-…` §7, `08-…` row 4 |
| Security | The 20-check list, run on day 14 and again at cutover, ending with Claude attacking the live endpoint. | `08-prelaunch-security-checklist.md` |
| Rate limiting | Cloudflare rule on `/api/signup` per IP (5 per 10 min) + Postgres `attempts` table per phone. | `08-…` row 7 |
| Caching and CDN | Static assets immutable with content hashes; HTML `max-age=0, s-maxage=60`; counters endpoint cached 10 s at the edge; images AVIF/WebP via Astro; 22 Indian PoPs. | `01-…` §4 |
| Error tracking and logs | Worker logs request id + outcome only (no PII); Cloudflare Workers Logs; PostHog captures front-end exceptions; a Slack/email alert if signup error rate exceeds 5% in 10 minutes (Cloudflare notification). | `08-…` row 12 |
| Monitoring and alerts | Cloudflare Web Analytics for Core Web Vitals; PostHog funnel (view → quiz → reserve → share); Cloudflare health check on `/` every 5 min with email alert; Supabase usage alert at 80% of free tier. | `01-…` §5 |
| Testing | Playwright screenshots at 390/1280 per section (review loop); Playwright e2e for the signup happy path and the five error states; Lighthouse CI; the day-14 attack script. | `docs/CHECKLIST.md` B1, E4; `08-…` row 20 |
| Scaling | Static site scales by itself. The only hot path is `/api/signup`: Workers scale horizontally; Supabase free tier handles ~60 inserts/s, far above any plausible teaser peak; counters read from a 10 s edge cache so a viral spike never hits Postgres for reads. | `01-…` §2, §6 |
| And more (ops) | Nov 1 cutover rehearsal with a 302 a week early; Supabase keep-alive ping so the free project never pauses; WhatsApp templates submitted by Oct 22; Composio key rotated. | §7 build plan days 13–15 |

## 8. Risks

| Risk | Mitigation |
|---|---|
| Jank on budget Android (240 animated tiles, scroll scrub) | Transform/opacity only, `content-visibility: auto`, no WebGL in the spine, AVIF ≤ 60 KB tiles, test on a real Redmi, LCP < 2.5 s on throttled 4G |
| Instagram in-app browser | Detect the UA; plain https links instead of app schemes; stateless form; "open in browser" hint |
| Camera permission drop-off | Upload first, camera second, quiz as the zero-permission default; say "processed on your phone", which is true |
| iOS motion permission for tilt | "Tap to enable tilt" chip; pointer fallback on desktop |
| Contest legality | Skill-judged, modest prize, published rules, Tamil Nadu excluded from any chance element |
| Meta rules on follow gating | Honour-system only; include the standard "not sponsored by Instagram" release |
| DPDP consent | Unticked boxes, itemised notice, withdrawal link; store timestamp, IP, text version |
| Fake scarcity would break brand trust | Real counts only |
| Scope creep | Freeze on day 3 |
| Nov 1 cutover | Rehearse the redirect rule a week early with 302; keep `/teaser` alive |

---

## 9. Open items and gaps in this research

- **Sam's Instagram saved collections** ("claude" 91, "devv" 44, "web design" 14) were read in full from the data export and digested in `07-instagram-saved-collections.md`. About a third are comment-gated with no content; the rest converge on the Claude Code setup above. The "skreed " (34) and "marketing" (5) collections in the same export were not requested and are worth a pass.
- **Egress blocks**: skreed.com, instagram.com and most design galleries (Awwwards, Codrops, Spline, GSAP, Rive) were blocked from this sandbox, so a few facts in `03-references-competitors-playbooks.md` are marked as from search snippets or prior knowledge. Confirm GSAP's licence clause and Spline/Rive prices on their sites before budgeting.
- **Logo**: only PNGs exist. Whoever designed the 2024 logo may have the vector.
- **Royal vs Midnight** (Vivid Violets) share one hex in Shopify; the catalog shows two colours. Needs the true value.
- **Nothing was built yet.** The repo contains only this documentation and the data files, as requested.
