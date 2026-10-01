# Grading checklist (the reviewer scores every section against this)

Each item is PASS or FAIL with a one-line reason. A section ships only when every item passes. No partial credit.

## A. Brand and design (from CLAUDE.md)
A1. Zero violations of rules 1–50 in CLAUDE.md. List any violation by rule number.
A2. Colours used come only from `docs/data/shades-240.json` plus the two neutrals (off-white, charcoal), as CSS tokens.
A3. Typeface is the one chosen family only (Urbanist unless Sam changed it), thin + black pairing for headings.
A4. Copy: Skreed voice (confident, minimal, short sentences), no buzzwords, no em dashes, no emojis, real shade names, no invented facts or counts.
A5. The section shows the real product (case render, shades or swatches), not an abstract stand-in.

## B. Phone first
B1. Rendered and screenshotted at 390 px wide and 1280 px wide (Playwright). Both attached to the review.
B2. No horizontal scroll at 390 px. Side gutters ≥ 16 px. Tap targets ≥ 44 px.
B3. Works inside Instagram's in-app browser assumptions: no app-scheme links without https fallback, no reliance on localStorage.
B4. Uses `svh`/`dvh` correctly; nothing animated in `dvh`.

## C. Performance
C1. Critical JS ≤ 60 KB gz for the page; this section adds no more than its budget line in the plan.
C2. Images: AVIF with WebP fallback, sizes set, lazy below the fold, hero ≤ 120 KB.
C3. No WebGL in a spine section. No layout thrash: animations use transform/opacity only.
C4. Lighthouse mobile ≥ 90 performance on the page after this section is added (run it; paste the number).

## D. Motion and states
D1. Visible at rest: nothing waits at opacity 0 for an observer.
D2. `prefers-reduced-motion` honoured; the section still makes sense with motion off.
D3. Every UI state designed where data or input exists: empty, loading (skeleton), error, offline, no results, permission denied, validation, success.
D4. Hover and press states exist only on interactive elements and are choreographed once.

## E. Quality gates
E1. `/web-design-guidelines` run on the section's files; zero findings left, or each remaining finding justified in one line.
E2. `visual-critique:critique-screen` run on the 390 px screenshot; its findings addressed or justified.
E3. Accessibility: semantic HTML, labelled controls, visible focus, AA contrast on both neutrals.
E4. For anything that writes data: the relevant rows of `docs/research/08-prelaunch-security-checklist.md` pass.

## G. Real-site essentials (page-level; graded once before launch and re-checked at cutover)
G1. Custom 404 page in the brand (off-white, one line, link back to the Wall).
G2. Primary CTA ("Reserve my shade" or the quiz) visible above the fold at 390 px without scrolling.
G3. Unique `<title>` per page (index, /r/<code>, /privacy, /terms, /thanks, 404).
G4. Unique meta description per page.
G5. Open Graph image: default 1200×630 plus the per-shade variants for /r/<code>; verified with a WhatsApp preview.
G6. Favicon set from the Skreed mark: favicon.ico, icon.svg, apple-touch-icon 180, icon-192, icon-512, web manifest.
G7. robots.txt present; allows indexing of the teaser (or disallows, if the team decides), references the sitemap.
G8. sitemap.xml generated at build.
G9. Alt text on every image; swatches named by shade ("Mauve, Vivid Violets").
G10. Mobile breakpoints tested at 360, 390, 430, 768, 1024, 1280.
G11. Sticky mobile CTA: a bottom bar with "Reserve my shade" after the hero, using `env(safe-area-inset-bottom)`.
G12. Loading states: skeletons on the Wall counters and the reserve confirmation.
G13. Form error states for phone, email, shade, device, finish and consent, with plain-language messages.
G14. Thank-you state after reserving (confirmation, referral link, share card), reachable at /thanks for the email link.
G15. Privacy policy page, DPDP-shaped: what is collected, why, how to withdraw, grievance contact.
G16. Terms page (plus contest rules if the naming contest runs).
G17. Cookie notice: only required if non-essential cookies load; with PostHog in cookieless mode and the referral cookie being first-party functional, a one-line notice with no banner is acceptable. Decide and document.
G18. Analytics installed and verified: PostHog events firing (signup_submitted, signup_success, ig_follow_click, shade_selected, share) and Cloudflare Web Analytics on.
G19. Real contact details in the footer: collab@skreed.in, Hyderabad, Telangana (from the catalog), plus the Instagram handle.
G20. Nov 4 cutover rehearsed: the Cloudflare redirect rule tested with 302 on a staging hostname.

## F. Done means
F1. The acceptance criteria written in the plan for this section are each met, quoted back with evidence.
F2. No TODOs, placeholders, lorem ipsum or commented-out code left in the section.
