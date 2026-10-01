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

## F. Done means
F1. The acceptance criteria written in the plan for this section are each met, quoted back with evidence.
F2. No TODOs, placeholders, lorem ipsum or commented-out code left in the section.
