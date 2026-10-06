# Interactive Concept Catalog (research agent output, 2026-10-01)

Store opens Nov 1. Festival framing was dropped on 2026-10-06; concept 21 became "One day, five shades".

Scoring: P = phone wow, L = laptop wow, LC = lead capture, S = shareability (each /5). Effort = dev-days, one dev + Claude Code.

## A. The 240 (core spectacle)
1. **The Wall** — all 240 shades as one living grid; tap/hover a tile → name + family + Reserve chip; scroll pulls it into a ribbon nav. CSS grid + GSAP stagger, no images. 2 days. P4 L5 LC3 S3. Risk: 240 nodes on low-end Android; transform/opacity only.
2. **Shade Wave** — swipe-to-scrub a full-bleed gradient fabric across all 240; release snaps to a shade. WebGL plane or CSS gradient fallback. 2–3 days. P5 L4 LC2 S3.
3. **Shade Roulette** — shake phone (DeviceMotion) → random shade + haptic; spacebar on laptop. 1 day. P5 L2 LC3 S4. iOS needs gesture permission.
4. **Tilt Gloss/Matte** — gyroscope drives a specular highlight on a case render; toggle finish; "I'm Matte / I'm Gloss" micro-vote. 1.5 days. P5 L3 LC2 S3.
5. **Scroll Morph** — sticky case re-colours through the families as you scroll. GSAP ScrollTrigger + tinted greyscale render. 2 days. P4 L5 LC1 S2.

## B. Find your shade (personalisation)
6. **Outfit Match (camera)** — getUserMedia, tap a point, ΔE2000 nearest of 240. 2 days. P5 L2 LC4 S5. Camera-permission drop-off 30–50%; lead with upload.
7. **Pick-from-Photo** — upload a photo, k-means 5 clusters → 5 nearest shades → pick hero → reserve. 1.5 days. P4 L4 LC4 S5. Recommended default entry.
8. **Shade Personality Quiz** — 6 swipe cards ("Beige or Rouge?") → family + shade + blurb → email to save. 1.5 days. P5 L4 LC5 S5. Highest-conversion mechanic in the list.
9. **Mood Slider** — Calm↔Loud, Warm↔Cool; case re-colours live. 0.5 day. P4 L4 LC2 S2. Fold into #8 as refiner.
10. **City Shade** — "Hyderabad at 6:12pm" shade by city × daypart. 1 day. P4 L3 LC2 S4.
11. **Shade of the Day / Horoscope** — birth month + date hash → today's shade; daily opt-in. 1–2 days. P4 L3 LC4 S4.

## C. Reserve / waitlist
12. **Reserve Your Shade** — per-shade live counter, email + device + finish; "Mauve 07 is yours. First dibs Nov 1." Supabase realtime + Turnstile. 2 days. P4 L4 LC5 S3. Real counts only.
13. **Shade Twin (referral)** — invite a friend; both unlock a complementary pair shade + priority tier. 1.5 days. P4 L4 LC5 S5. Non-chance reward keeps it outside the Prize Competitions Act.
14. **Name the 241st Shade** — judged (skill) naming contest, winner announced Nov 1. 1.5 days. P3 L4 LC4 S4. Publish T&Cs; modest prize; exclude stricter states.
15. **Case Wardrobe Planner** — Mon–Sun strip, assign shades, email the plan (7 reservations). 1.5 days. P3 L4 LC4 S3.

## D. Share & Instagram
16. **Share Card Generator** — 1080×1920 story PNG via canvas + Web Share API files. 1 day. P5 L3 LC2 S5. Every result concept ends here.
17. **Hidden 241st Shade (follow-gated)** — greyed tile, "Follow to reveal", honour-system "I followed". 0.5 day. P4 L3 LC2 S3. Include Meta's "not sponsored by Instagram" release.
18. **Broadcast Channel Drops** — reveals land first in the IG broadcast channel; site unlocks next morning. 0.5 day + ops. P3 L3 LC1 S3.
19. **Shade Twin Duet** — UGC prompt for pairs; moderated wall. 1 day. P3 L3 LC1 S5.

## E. Storytelling
20. **Countdown in Colour** — 34 days → 34 shades; site re-tints daily. 1 day. P4 L4 LC3 S3.
21. **One day, five shades** — five moments of a day, five shade stories, "Reserve for two". 1 day. P4 L4 LC3 S3. Colour + type only, no clipart.
22. **Basic vs Beyond Basic** — clip-path drag slider: the black case everyone has vs your shade. 0.5 day. P5 L5 LC1 S4. Cheapest big-impact concept.
23. **Typographic Manifesto** — pinned kinetic type, each word fills with a family colour. 1 day. P4 L5 LC1 S2.
24. **Founders' Note** — 120 words, signature, reply field. 0.25 day. P2 L3 LC3 S1.
25. **Sound-Reactive Shade** — mic → hue. 1 day. P4 L3 LC1 S3. Laptop easter egg only.
26. **AR On-Desk** — model-viewer + USDZ/GLB. 2–3 days + assets. P4 L2 LC1 S3. Skip for teaser.
27. **Drag-to-Mix Finish** — blend two renders by drag %. 0.5 day. Fold into #4.

## (a) Recommended spine
#22 Basic vs Beyond Basic → #1 The Wall → #8 Quiz (+#7 photo) → #12 Reserve → #16 Share Card, with #20 Countdown as ambient skin and #17 as the IG hook.

Page outline (single page, phone-first, each section ≈ 100vh):
1. Hero / Basic vs Beyond Basic — "Go Beyond Basic." / "240 shades. Store opens Nov 1." Day counter tinted by today's shade.
2. The Wall — 240 tiles; family tabs on phone, full grid on laptop; greyed 241st tile.
3. Find your shade — tabs: Quiz (default) | From a photo | Live camera (flagged). Result: shade card + tilt gloss/matte.
4. Reserve — email, device, finish; live per-shade counter; "Find your twin" after submit.
5. Share — card generator + "Tag @skreedofficial".
6. Day-in-shades stories — case-wardrobe angle, "Reserve for two".
7. Manifesto strip + Founders' note.
8. Footer — Nov 1, IG link, legal.

Narrative: Basic is over → here's the 240 → which one is you → claim it → tell someone → see it in a day → who we are.

## (b) 15-day build plan
D1 repo + shade JSON + Vercel + skreed.in forward test · D2 tokens/type/layout + today's-shade theming · D3 hero slider + tint pipeline · D4 The Wall + low-end perf pass · D5 Supabase schema, Turnstile, Reserve sheet · D6 realtime counters, confirmation email · D7 Quiz · D8 Photo palette · D9 Share card + OG per shade · D10 Tilt gloss/matte · D11 Shade Twin + hidden tile + IG links · D12 day-in-shades stories, manifesto, founders' note, copy pass · D13 camera behind flag + analytics events · D14 QA matrix (iPhone 13/15/17, Pixel/Samsung, Redmi-class, Jio 4G throttle, Lighthouse ≥90, reduced motion) · D15 cutover test, seed counters, legal pages, buffer.

## (c) Decisions (recommended default)
1. Spine, not kitchen sink. 2. Email primary, WhatsApp number optional. 3. Priority access + free shipping first 48h, no discount language. 4. No fake scarcity; show counts only above 10. 5. Photo upload at launch, camera week 2. 6. Naming contest: judged, prize ≤ ₹1,000 or product, T&Cs. 7. Greyscale master render tinted via CSS for all 240; 10 hero photos for stories. 8. Single shades.json, later synced to Shopify metafields. 9. Next.js on Vercel + Supabase + Resend + Turnstile. 10. Nov 1 cutover via edge middleware date flag; reserved shades pre-tagged as Shopify customer tags. 11. Plausible + custom events. 12. Zero emojis.

## (d) Risks & mitigations
Mobile perf (transform/opacity only, content-visibility, no WebGL in spine, AVIF ≤60KB, Redmi test, LCP <2.5s on Jio 4G) · camera permission drop-off (upload first, "processed on your phone") · iOS motion permission (tap-to-enable chip) · giveaway legality (Prize Competitions Act 1955: skill-based or non-prize rewards only, T&Cs, named judge, no "lucky draw", exclude Tamil Nadu etc.) · IG compliance (cannot verify follows; Meta release text; no automation) · DPDP Act 2023 consent (checkbox, purpose, unsubscribe, RLS, no selfie storage) · scarcity honesty · scope freeze by D3 · cutover rehearsal a week early, keep /teaser alive for referral links.

Sources: Wikipedia Diwali; Jovi India 2026 calendar; Airalo; Awwwards color exploration collection; Mondaq & Lex Counsel on India prize competitions; Gleam no-purchase-necessary guide.
