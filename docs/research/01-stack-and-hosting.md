# Tech Stack & Hosting (research agent output, 2026-10-01)

## 1. Framework choice (animation-heavy single-page teaser)

| Option | Baseline JS shipped | GSAP / Three.js / Motion fit | Static export | DX with Claude Code |
|---|---|---|---|---|
| **Astro 7.3.5** | ~0 KB for static HTML; JS only for opted-in islands | GSAP in plain `<script>`; Three.js in one `client:visible` island; Motion via `@astrojs/react` | Static by default; `@astrojs/cloudflare` 14.3.3 / `@astrojs/vercel` 11.0.11 for the one function | Excellent: file-based, HTML-first; Vite 8 underneath |
| Next.js 16.3.8 (App Router) | ~70–85 KB gz hello world | Best for Motion + react-three-fiber; GSAP needs `useGSAP`/`"use client"` ceremony | `output: 'export'` disallows non-GET route handlers, Server Actions, default image loader → signup endpoint must live elsewhere or run SSR on Vercel | Good but heaviest config surface for a one-pager |
| Vite 8.3.2 + React 19.3 | ~45 KB gz React runtime | Native for Motion 13.4.6 and r3f 9.8.1 / drei 10.7.9 | Pure SPA; no SSG unless added → hurts LCP/SEO | Very simple; no server story |
| SvelteKit 2.70.3 (Svelte 5.57.1) | ~15–18 KB gz | GSAP via actions; Three via Threlte; no Motion-for-React | `adapter-static` prerenders | Smaller training corpus for Svelte 5 runes → more hallucinated-API risk |
| Plain Vite vanilla | ~0 KB | GSAP + Three.js framework-agnostic; ideal for creative-dev effects | Multi-page build input; no component model | Gets messy past 1 page + form + 3D |

Sources: devradar-dev.github.io Astro notes; dev.to framework comparisons 2026; pkgpulse Next vs SvelteKit 2026; nextjs.org static-exports guide.

**Recommendation: Astro 7 (static) + vanilla GSAP for DOM/scroll motion + one lazily-hydrated Three.js (or `<model-viewer>`) island + React only if you want Motion.** Zero-JS baseline is the only way to keep Indian mid-range Android LCP under 2.5 s while layering heavy interactivity progressively; `client:visible` / `client:idle` are built-in lazy-loading; the signup endpoint is one Astro API route (`src/pages/api/signup.ts`) or a Cloudflare Worker. GSAP 3.15 is 100% free including ScrollTrigger/SplitText/MorphSVG since v3.13 (Apr 2025, Webflow-owned) (css-tricks; gsap.com/blog/3-13). Three.js r186 (`three@0.186.1`) ~150 KB gz tree-shaken; `@google/model-viewer` 4.3.1 bundles its own three.js, so don't use both.

## 2. Hosting

| | Vercel Hobby | Cloudflare Workers Static Assets / Pages (Free) | Netlify Free | GitHub Pages |
|---|---|---|---|---|
| Bandwidth | 100 GB/mo | **Unlimited** static requests/bandwidth | 300 credits/mo ≈ 15 GB; hard pause when exhausted | 100 GB/mo soft, 1 GB site |
| Serverless | 1M invocations, 4 CPU-h | 100k Worker requests/day, 10 ms CPU | 125k invocations | None |
| India edge | 126 PoPs; compute region `bom1` Mumbai | 22 Indian data centres of 312; Workers run in every PoP | CDN partners; no India compute on free | Fastly CDN |
| Custom domain | A `76.76.21.21` apex + CNAME `cname.vercel-dns.com` | CNAME at apex via flattening if zone on Cloudflare; auto-SSL | CNAME/ALIAS, auto-SSL | CNAME + 4 A records |
| Analytics | Vercel Web Analytics 2,500 events/mo on Hobby | Cloudflare Web Analytics: free, cookieless, 7-day window, no custom events | Paid add-on | None |
| **Blocker** | **Hobby is non-commercial only; a company's lead-gen site is commercial → Pro $20/mo** | Pages is maintenance-mode; Cloudflare says start new projects on Workers + Static Assets | Credit pause risk mid-campaign | No endpoint |

Sources: deploywise.dev Vercel free-tier limits 2026; developers.cloudflare.com static-assets billing & workers pricing; netli.fyi; docs.github.com pages limits; vercel.com/docs/regions; getdeploying.com India datacentres; justinmckelvey.com "is Vercel free"; blog.cloudflare.com full-stack Workers; mecanik.dev Pages vs Workers 2026.

**Recommendation: Cloudflare Workers + Static Assets, with skreed.in's DNS zone moved to Cloudflare (free).** Unlimited static bandwidth matters because 240-shade imagery + hero video + GLB can push a viral IG day past 100 GB; 22 Indian PoPs; 100k req/day free is ample for a form; Turnstile, Redirect Rules and Web Analytics live in the same dashboard, which makes the Nov 1 flip trivial. Fallback: Vercel Pro ($20/mo for one month). Do not run this on Vercel Hobby.

## 3. Domain forwarding mechanics for skreed.in

- **Serve the site directly on skreed.in (CNAME/A to host); do not registrar-forward.** Registrar forwarders default to 302 and most don't terminate HTTPS, so `https://skreed.in` shows a cert error before redirecting (domain-forward.com; domainee.dev). Search engines only see the HTTP redirect, not the DNS record type.
- **Setup now:** move nameservers to Cloudflare (free zone). `CNAME @ → <worker>.workers.dev` (proxied, apex auto-flattened) + `CNAME www → same`. Enable "Always Use HTTPS". TTL 300 s / Auto.
- **Nov 1 flip (minutes, no DNS change):** add a Cloudflare Single Redirect rule `skreed.in/* → https://skreed.com/$1` with 302 while testing, then 301. Takes effect at the edge in seconds; the microsite stays deployed for rollback. Alternative: add skreed.in as a secondary domain in Shopify (A `23.227.38.65`, CNAME `shops.myshopify.com`), which auto-redirects to the primary, but that is a DNS change with propagation lag.
- **SEO:** 302 for any temporary redirect during the teaser; 301 on Nov 1 so link equity consolidates on skreed.com. Keep `<link rel="canonical">` to skreed.in and allow indexing unless you'd rather the teaser not be cached by Google. Never test the flip with 301 (browsers cache it aggressively).

## 4. Performance budget for Indian mobile

- Context: Android = 92.8% of Indian mobile OS (statcounter); the $100–200 tier is ~40% of shipments (IDC). Design for 4G at 10–20 Mbps and 100+ ms RTT.
- Targets at p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Self-imposed: critical JS ≤ 60 KB gz; total JS incl. lazy Three.js ≤ 250 KB gz (median mobile page ships 632 KB, be far under); hero image ≤ 120 KB; hero video ≤ 1.5 MB for a 6–8 s loop; ≤ 2 subset WOFF2 files.
- Images: AVIF ~95% coverage (Chrome 85+, Safari 16+), 20–40% smaller than WebP. `<picture>` AVIF → WebP → JPEG via Astro `<Image>` / sharp 0.35.5. For the 240-shade picker do NOT ship 240 images: one base render + CSS tint / canvas, or 10 family images + per-shade CSS variables.
- Video: `autoplay muted playsinline loop` required on iOS Safari and Android Chrome. Codec ladder: AV1 (`codecs=av01`, hardware only on A17 Pro/M3+) → VP9 WebM (iOS 14+) → H.264 MP4 baseline. Skip HEVC. Always `poster` (AVIF) + `preload="metadata"`.
- 3D: load Three.js only via dynamic `import()` on IntersectionObserver / `client:visible`; GLB with Draco/meshopt (70–90% smaller); `setPixelRatio(Math.min(dpr, 1.5))`, ≤ 1 shadow light, KTX2 textures ≤ 1024 px.
- Reduced motion: wrap all GSAP in `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)`; Lenis 1.3.26 auto-disables under reduce.
- Low-end detection: `navigator.deviceMemory` (≤2 GB = low, Chromium only; undefined = mid), `hardwareConcurrency` ≤4, `connection.saveData` / `effectiveType` 2g/3g. Low tier: static AVIF hero, CSS-only picker, no WebGL; mid: video + 2D canvas; high: Three.js. Add a WebGL context check and a 3-second frame-time probe (drop to 2D under 30 fps). Instagram's in-app browser strips Referer and lacks autofill; test inside it.

## 5. Analytics & observability

| Tool | Free tier | Custom events | Notes |
|---|---|---|---|
| GA4 | Free, 10M events/mo, 14-month retention | Yes | Consent banner; heaviest script; needed if Meta/Google ads run |
| Plausible | Paid only ($9/mo for 10k pageviews) | Yes (goals) | <1 KB, cookieless |
| Vercel Web Analytics | 2,500 events/mo on Hobby | Pro only | Too small |
| PostHog | 1M events + 5k replays/mo free | Yes + replay, funnels | ~50 KB; load `posthog-js` 1.435.6 lazily after LCP |
| Cloudflare Web Analytics | Free unlimited, cookieless, 7-day view | No | Free CWV field data |

**Recommendation:** PostHog (events: `signup_submitted`, `signup_success`, `ig_follow_click`, `shade_selected{family,shade,finish}`, `video_played`, `3d_loaded`, `device_tier`) + Cloudflare Web Analytics for RUM. GA4 only if paid IG ads run. **UTM scheme:** `utm_source=instagram|whatsapp|twitter`, `utm_medium=bio|story|reel|dm|share`, `utm_campaign=prelaunch-oct26`, `utm_content=<creative-id>`. Instagram preserves query params but strips Referer, so UTMs are mandatory. In-site WhatsApp share: `https://wa.me/?text=<url?utm_source=whatsapp&utm_medium=share>`.

## 6. Signup backend (email + phone)

| Path | Pros | Cons |
|---|---|---|
| **Supabase table + Edge Function** (free: 500 MB DB, 500k invocations) | Official Turnstile verification example; full data ownership; easy export to Shopify on Nov 1 | Free projects pause after 7 idle days (add a daily cron ping); write RLS (insert via service role only) |
| Shopify Admin `customerCreate` with `tags:["prelaunch-in"]`, `emailMarketingConsent{SUBSCRIBED, SINGLE_OPT_IN}`, `smsMarketingConsent` | Contacts land where they're used; Shopify Email sends Nov 1 | Admin token must stay server-side; 422 on duplicates; API-created customers skip double opt-in |
| Shopify Forms app | Zero code, tags + segments | Lives on skreed.com theme, not embeddable in Astro without iframe hacks |
| Klaviyo / Mailchimp | Flows, SMS | Free tiers now 250 contacts / 500 emails, will cap in days |
| Google Sheets via Composio | Trivial | ~70% of public form posts are spam; no dedupe |

- **Spam:** Cloudflare Turnstile (free, invisible, verify at `challenges.cloudflare.com/turnstile/v0/siteverify`) + honeypot + Cloudflare Rate Limiting rule on `/api/signup` + Postgres `UNIQUE(lower(email))`, `UNIQUE(phone_e164)`.
- **Consent (DPDP):** Rules notified 14 Nov 2025; obligations phase in to May 2027, but adopt now: plain-language notice (email, phone; purpose "launch updates & offers"), unticked checkbox, withdrawal link. Store `consent_text_version`, `consented_at`, `ip`, `user_agent`.
- **OTP cost (India):** MSG91 ₹0.15–0.25/SMS, DLT-registered; Twilio Verify ≈ ₹11+ per verification; Firebase Phone Auth 10k free then $0.07, needs Blaze. DLT sender-ID/template registration takes days. **Recommend no OTP for a teaser**; validate E.164 with `libphonenumber-js`, mark `unverified`.
- **WhatsApp opt-in:** cheapest = `wa.me/<number>?text=JOIN` click-to-chat (no API cost). Business API marketing ≈ ₹0.88/conversation + BSP fee (Interakt from ₹3,499/quarter).

**Simplest robust path:** Astro form → Cloudflare Worker (or Supabase Edge Function) that (1) verifies Turnstile, (2) validates/normalises email + phone, (3) upserts into Supabase `prelaunch_signups` via service-role key, (4) fire-and-forget `customerCreate` to Shopify with tag `prelaunch-in` (idempotent on 422). Supabase is the source of truth; Shopify gets a mirror so launch-day email goes out from Shopify Email free.

## 7. Proposed starter stack & repo structure

Astro 7 static site on Cloudflare Workers Static Assets with a single `/api/signup` Worker route; GSAP + ScrollTrigger for all DOM/scroll motion; Lenis desktop-only; one `client:visible` React island running react-three-fiber for the hero case (gated by device tier, otherwise 2D canvas tint); AVIF/WebP via Astro `<Image>`; PostHog after `load`; Turnstile on the form; Supabase store with Shopify sync.

Packages (npm latest, 2026-10-01): `astro@7.3.5`, `@astrojs/cloudflare@14.3.3` (or `@astrojs/vercel@11.0.11`), `@astrojs/react@7.0.0`, `react@19.3.0`, `react-dom@19.3.0`, `vite@8.3.2` (bundled), `gsap@3.15.0`, `lenis@1.3.26`, `three@0.186.1`, `@react-three/fiber@9.8.1`, `@react-three/drei@10.7.9` (or `@google/model-viewer@4.3.1` instead), `motion@13.4.6` (optional), `sharp@0.35.5`, `libphonenumber-js`, `zod`, `@supabase/supabase-js@2.117.2`, `posthog-js@1.435.6`, `wrangler@4.145.0`, `@cloudflare/workers-types`; dev: `typescript`, `prettier`, `@playwright/test`, `@lhci/cli`.

```
/
├─ astro.config.mjs          # output:'static', adapter cloudflare, image service sharp
├─ wrangler.toml             # assets dir, routes skreed.in/*, secrets via wrangler secret
├─ public/
│  ├─ video/hero.av1.mp4 | hero.vp9.webm | hero.h264.mp4 | hero.poster.avif
│  ├─ models/case.glb (draco/meshopt)
│  └─ fonts/*.woff2
├─ src/
│  ├─ pages/index.astro       # single page; sections as components
│  ├─ pages/api/signup.ts     # Astro server endpoint → runs as Worker
│  ├─ layouts/Base.astro      # meta, OG, canonical, preloads, noindex toggle
│  ├─ components/ Hero.astro ShadeWall.astro Story.astro Signup.astro Footer.astro three/CaseScene.tsx
│  ├─ scripts/ motion.ts device-tier.ts analytics.ts
│  ├─ data/shades.json
│  └─ styles/global.css
├─ supabase/ migrations/0001_signups.sql  functions/shopify-sync/
├─ scripts/encode-media.sh    # ffmpeg AV1/VP9/H264 ladder, sharp AVIF batch
├─ tests/ (playwright mobile viewports, lhci budgets)
└─ .github/workflows/deploy.yml  # build → wrangler deploy; lhci assert on PR
```

Key calendar: now → move skreed.in NS to Cloudflare; ~Oct 8 → deploy, Turnstile + rate-limit rule; Oct 31 23:59 IST → Single Redirect `skreed.in/* → skreed.com/$1` (302 for 10 min test, then 301); Nov 2 → export Supabase CSV, confirm Shopify customers tagged `prelaunch-in`, pause the Worker.
