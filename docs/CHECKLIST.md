# Grading checklist (the reviewer scores every section against this)

Each item is PASS or FAIL with a one-line reason. A section ships only when every item passes. No partial credit.

## A. Brand and design (from CLAUDE.md)
A1. Zero violations of rules 1–50 in CLAUDE.md. List any violation by rule number.
   Approved exception (Sam, 2026-10-09; hero only): rule 12 (E-12), rules 13 and 42 (E-13/42), rules 1, 21 and 40 (E-1/21/40), rule 24 (E-24). See `docs/specs/hero.md` section 10.
   Approved exception (Sam, 2026-10-19; section 3 only): rules 1, 12, 20, 21, 42 and 43 for section 2's fog under the quiz (E-S3-bg); rules 4 and 19 for the quiz's IBM Plex Mono (E-S3-font); rule 12's motion list for the quiz's decode (E-S3-motion). See `docs/specs/hero.md` section 10.
   Pending Sam (section 3; `docs/specs/quiz.md` section 10, item 17; default: as built): the answer pictures' reveal, built 2026-10-20 at his request and not covered by his approval of E-S3-motion on 2026-10-19, which was of the text's decode. Rule 12's motion list (the strips' roll and fade and the layer's scale from 1.03 are motion outside it, as the decode is) and rule 48 (an answer's hover state shows its picture beside the control): graded against quiz.md section 10, item 17's default, not as FAIL, until he answers.
   Approved exception (Sam, 2026-10-19, 2026-10-20 and 2026-10-22, by his own words; section 4 only): rules 1, 21, 24 and 42 for the five scenes' own palettes, gradients, glows and fog in the loops, the cloud's shadow tone and the carousel's black clear colour (E-S4-colour, amended; the products wear catalog shades by id); rule 38 in the hall, which shows no product, the bubble opening on the first scene with its product (E-S4-38, amended); rules 12, 21 and 42 for the bubble (E-S4-portal); rules 4 and 19 for its IBM Plex Mono (E-S4-font). See `docs/specs/section-4-flux.md` section 10 and `docs/specs/section-4-world.md` section 10.
   Pending Sam (E-S4-motion, amended; `docs/specs/section-4-flux.md` section 10; default: cuts with a 300 ms cross-fade for every motion and the decode as a 0.2 s fade): rule 12's reserved-motion list for section 4's motions (the door's swing and dolly, the walk's camera, the decodes, the bubble, the step, the product's turn, the lights, the key light's fade, the seams, the way back, the glue and the loops); the rest of rule 12 holds (nothing fades in on scroll; the hall and each scene are whole at rest; every motion has its cut under reduced motion). Ships as built while pending: graded against the default, not as FAIL, until he answers.
   Pending Sam (E-S4-glow, amended; `docs/specs/section-4-flux.md` section 10; default: matte for every product, the hall as built): rules 13 and 42 for the hall's seam glow, fixture halos and laptop bloom, and the gloss and metallic products' highlights under the key light. Ships as built while pending: graded against the default, not as FAIL, until he answers.
   Approved exception (Sam, 2026-10-26, by his own words; the quiz gate, section 4's lock behind the quiz and the ride from Skip quiz): rule 12's "Sections are visible at rest" for section 4 until the result or a press (E-QG-lock), and rule 12's reserved-motion list for the ride (E-QG-ride). See `docs/specs/quiz-gate.md` section 10.
A2. Colours used come only from `docs/data/shades-240.json`, Pearl Whisper, Urban Slate and Ember Luxe, as CSS tokens. No invented greys; the only derived neutral is `--skeleton`.
   Approved exception (Sam, 2026-10-09; hero only): `--night` and Pearl Whisper at alpha as light (E-A2); the scene's light colours as render parameters (E-A2b).
   Approved exception (Sam, 2026-10-19; section 3 only): the colours of section 2's fog under the quiz, render parameters of the hero island (E-S3-bg).
   Approved exception (Sam, 2026-10-22; section 4 only): the five scenes' colours as image content of the ten loops and their stills, with the key light's per-scene tints, the reference's own; the cloud's shadow tone (0.80, 0.84, 0.93) with Pearl Whisper for its light; and the carousel's black clear colour (E-S4-colour, amended). The products wear catalog shades by id and the text stays Pearl Whisper. See `docs/specs/section-4-flux.md` section 10.
A3. Type follows `docs/brand/type-system.md`: Poppins 700 sentence-case headlines, Source Serif 4 roman for first-person prose only, Open Sans for UI, numerals (tabular) and legal prose. Only the four shipped files; no italic; no digits inside h1, h2 or the manifesto; no face under 12 px.
   Approved exception (Sam, 2026-10-09; hero only): the hero's countdown, loader and label sizes (E-A3).
   Approved exception (Sam, 2026-10-19; section 3 only): the quiz is set in section 2's label type, IBM Plex Mono Medium in capitals at 15 to 88 px, scaled to the screen since 2026-10-20, in place of Poppins and Open Sans, from two self-hosted files outside the four (E-S3-font; type-system principle 9).
   Approved exception (Sam, 2026-10-20; section 4 only): every line of section 4 is set in the same type, IBM Plex Mono Medium in capitals at the quiz's sizes, 15 to 52 px, from the same two files, a scene's name an `h3` drawn in capitals (E-S4-font; `docs/specs/section-4-world.md` section 10).
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
   Approved exception (Sam, 2026-10-09; hero only): the hero canvas is the one WebGL island (E-C3); the countdown's clip-path ride and the glitch's SVG attribute animation (E-C3b).
   Approved exception (Sam, 2026-10-19; section 3 only): the hero island keeps rendering section 2's fog under the quiz (E-S3-bg). The quiz's own motion, the decode, uses no transform on the text: it animates each glyph's opacity and, while a glyph rolls, swaps its character for another of the same width. So the second sentence holds there for movement, and the character swap is part of E-S3-motion.
   Pending Sam (section 3; `docs/specs/quiz.md` section 10, item 17; default: as built): an answer picture's reveal, built 2026-10-20 at his request, swaps each strip's slice while it rolls, a `background-position`, outside transform and opacity; graded against quiz.md section 10, item 17's default, not as FAIL, until he answers. Its strips' opacity and its layer's scale, a transform, pass this item on their own.
   Approved exception (Sam, 2026-10-22; section 4 only): the glue settles the page's scroll position by an instant `scrollTo` each frame over 0.5 s, no CSS property animated (E-S4-snap), and the carousel holds the scroll during a step and snaps it to the scene's position at the step's end (E-S4-scroll); in the DOM the prompt alone moves, by a transform, and every other change is opacity. See `docs/specs/section-4-flux.md` section 10.
   Pending Sam (E-S4-webgl, amended; `docs/specs/section-4-flux.md` section 10; default: the poster column for everyone): the hero island draws section 4, the hall, the door, the bubble and the carousel's planes, products and cloud, against this item's first sentence and CLAUDE.md's "No WebGL from section 3 on". Ships as built while pending: graded against the default, not as FAIL, until he answers.
   Pending Sam (E-S4-motion, amended, the decode's swap; `docs/specs/section-4-flux.md` section 10; default: the decode as a 0.2 s fade): section 4's text decodes as the quiz's does, each glyph's opacity and, while it rolls, a same-width character swap, outside transform and opacity as E-S3-motion's swap is. Ships as built while pending: graded against the default, not as FAIL, until he answers.
   Approved exception (Sam, 2026-10-26; the quiz gate): the ride from Skip quiz settles the page's scroll position by an instant `scrollTo` each frame over 1.2 s on `--ease-standard`, no CSS property animated (E-QG-ride), beside E-S4-snap's line. See `docs/specs/quiz-gate.md` section 10.
C4. Lighthouse mobile ≥ 90 performance on the page after this section is added (run it; paste the number).
   Pending Sam (E-C4): the hero's graded run is the poster tier that headless Chromium gets; the 3D path is recorded, and traced on a real phone on staging (hero.md D23, section 11).

## D. Motion and states
D1. Visible at rest: nothing waits at opacity 0 for an observer.
   Approved exception (Sam, 2026-10-09; hero only): the hero's loader on the 3D path (E-H1).
   Section 3 (Sam, 2026-10-19; E-S3-motion): the quiz's text decodes out and in only when a control is pressed (Begin, an answer, Back, Try again), and an answer picture shows only while its answer is under a pointer, in keyboard focus or pressed (one still loading when its answer is left never shows once it arrives: `docs/specs/quiz.md` AC13); the intro is visible at rest, so D1 holds there, and reduced motion makes the decode a 0.2 s fade (D2).
   Section 4 (Sam, 2026-10-19 to 2026-10-22; E-S4-portal, and E-S4-motion pending): the hall's hint decodes in with the hall's first frame, the prompt within 2.8 m of the door and a scene's four lines on its arrival, each driven by the section's state (the walk, the press, a step), never by an observer; the hall and each scene are whole at rest, the scenes not on screen stay in the accessibility tree, clipped, and reduced motion makes the decode a 0.2 s fade (D2). The poster tier shows the hall's still and the five scenes' column at rest.
   Quiz gate (Sam, 2026-10-26; E-QG-lock): section 4 is `hidden` (out of the layout and the accessibility tree, not waiting at opacity 0) until the quiz's result or Skip quiz opens it, and nothing waits for an observer; once open it is visible at rest as built. See `docs/specs/quiz-gate.md` D1.
D2. `prefers-reduced-motion` honoured; the section still makes sense with motion off.
   Approved exception (Sam, 2026-10-09; hero only): the hero honours it through `matchMedia` and CSS because it loads no GSAP (E-GSAP). Pending Sam: which tier reduced motion gets (default: the poster).
D3. Every UI state designed where data or input exists: empty, loading (skeleton), error, offline, no results, permission denied, validation, success.
D4. Hover and press states exist only on interactive elements and are choreographed once.

## E. Quality gates
E1. `/web-design-guidelines` run on the section's files; zero findings left, or each remaining finding justified in one line.
   Pending: if the skill cannot be installed in the build environment, the review records E1 as blocked with the reason, never PASS.
E2. `visual-critique:critique-screen` run on the 390 px screenshot; its findings addressed or justified.
   Pending: as E1.
E3. Accessibility: semantic HTML, labelled controls, visible focus, AA contrast on both neutrals.
   Pending Sam (E-2.2.2): the hero's ambient scene motion and ticking countdown run without a pause control; the OS reduced-motion setting turns both off. If declined, hero.md section 10 specifies the control.
   Approved exception (Sam, 2026-10-19; section 3 only): Pearl Whisper text straight on the fog with no panel, below AA (E-S3-contrast: sampled over seven runs on the 3D tier with the type of 2026-10-20, medians 1.63 to 5.06:1 and 1.52:1 at worst, mostly under 3:1, each line's figure changing from run to run as the fog drifts, so the samples bound nothing (1.47 to 3.27:1 and 1.43:1 in three runs with the smaller type of 2026-10-19); about 19:1 on `--night` on the poster tier and under reduced motion; the figures are back with Sam in `docs/specs/quiz.md` section 10); the fog under the quiz drifts with no pause control (E-S3-bg, WCAG 2.2.2, as E-2.2.2 for the hero).
   Approved exception (Sam, 2026-10-22; section 4 only): inside the carousel's range the wheel, one finger and ArrowDown, PageDown, Space, ArrowUp, PageUp and Shift+Space are captured for whole steps, and at scroll 0 after the intro a touch or a wheel burst runs the wrap (E-S4-scroll); never Ctrl+wheel, more than one finger, a zoomed viewport, a focused button or a typing control, and "Previous scene" and "Next scene" give a visible, 44 px, single-pointer and keyboard path (WCAG 2.5.1). The glue settles the page's three seams on touch too, instant under reduced motion, never after focus, `scrollIntoView` or find-in-page, and never with a typing control focused, the keyboard up or the page zoomed (E-S4-snap). See `docs/specs/section-4-flux.md` section 10.
   Pending Sam (E-S4-contrast, amended; `docs/specs/section-4-flux.md` section 10; default: the bottom shade darkened until every median reads 4.5:1, and the step's text hidden until the lights are up): Pearl Whisper text straight on the hall, the bubble and the five loops, never boxed. What ships: the carousel's bottom shade at 45 percent of black, every scene line 6.0:1 or better at the median and 4.7:1 at the worst over 10 frames of every loop at both viewports, Skip over the bubble 7.3:1 or better; the prompt over the hall's lit door 2.36:1 at 390 x 844 and 2.85:1 at 1280 x 800 (part one's reading; `docs/specs/evidence/section-4-flux-contrast.md`). Graded against the default, not as FAIL, until he answers.
   Pending Sam (E-S4-loops, WCAG 2.2.2; `docs/specs/section-4-flux.md` section 10; default: the "Pause motion" control): the five loops run while a scene is front, with no way to stop them. What ships while pending: no control (it is built in the stylesheet, the markup and `walk.ts`, hidden until the director sets `data-pause`). If he declines: "Pause motion", a plain-text word bottom right one row above the previous and next words, its text swapping to "Play motion", 44 px with the two-tone ring, from the press on the 3D path and never on the poster tier; pressed, every loop pauses and the cloud's time holds while steps, seams and the glue still work; remembered for the visit only. Graded against that default, not as FAIL, until he answers.
E4. For anything that writes data: the relevant rows of `docs/research/08-prelaunch-security-checklist.md` pass.
E5. Database audit (run once the schema exists, re-run after any migration). Each of the five must be answered with evidence from the code, not assumed:
  - N+1 queries: the counters endpoint reads all shade counts in one query (`select shade_id, count from shade_counts`), never one query per tile.
  - Pagination: no endpoint returns an unbounded list. The only list read is the 240-row counts view; any admin export uses `range()` pages of 500.
  - Indexes: `leads(lower(email))` unique, `leads(phone_e164)` unique, `leads(referral_code)` unique, `referrals(referred_by)`, `attempts(ip, created_at)`. Confirm with `\d` or `pg_indexes`.
  - Connection pool: the Worker uses supabase-js over HTTP (PostgREST), so there is no direct Postgres connection to exhaust; if any direct connection is ever added it goes through Supavisor transaction mode, never a direct 5432 connection from the edge.
  - SELECT *: every query names its columns; the signup response and counters response are built from explicit selects (`select('referral_code, position')`).

## G. Real-site essentials (page-level; graded once before launch and re-checked at cutover)
G1. Custom 404 page in the brand (off-white, one line, link back to the Wall).
G2. Primary CTA ("Reserve my shade" or the quiz) visible above the fold at 390 px without scrolling.
   Approved exception (Sam, 2026-10-09; hero only): no CTA on the hero's fold (E-G2); the reserve flow starts in later sections.
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
G20. Nov 15 cutover rehearsed (the launch moved from Nov 1, Sam 2026-10-20): the Cloudflare redirect rule tested with 302 on a staging hostname.
G21. Internal links: every section links to at least one other (Wall → Reserve, Quiz → Wall, Thanks → Share, footer → privacy/terms); no dead ends. The family pages' argument screen, their last screen, links back to the landing's section 2 ("Back to main page", `/#families`; `docs/specs/family-page.md` 22).
   The quiz gate (Sam, 2026-10-26; `docs/specs/quiz-gate.md` D7): section 4 is locked behind the quiz, which links on to it by two controls, the result's flow and Skip quiz, besides "See it on the case" to the family pages and the no-JS line to the families, so the lock is no dead end.
G22. Breadcrumbs: not on a one-page teaser; the sticky section index (01–08) does the same job. Noted as n/a with reason.
G23. Five FAQs in the footer as native `<details>`: when it launches, what reserving means, is it a payment, which phones, how to withdraw consent. Marked up with FAQPage JSON-LD.
G24. Response-time promise next to the contact line: "We reply on WhatsApp within one working day."
G25. Team photo: a real one of Sam, Prem and Jyotika in the founders' note, not a render (rule: no stock faces).
G26. Organization + LocalBusiness JSON-LD (Hyderabad address, collab@skreed.in, Instagram sameAs), and a map link only if the team wants walk-ins; otherwise address text alone.
G27. Case studies and reviews: none exist before launch. Do not fabricate. The honest substitute is the live reservation counter and the first shade-naming entries.

## H. Every user state, per section (from Sam's ten-state checklist; expands D3)

Each row is reviewed by the CHECKER before a section is marked done. "n/a" must be argued, not assumed.

| State | 1 Splitter hero | 2 The Wall | 3 Find your shade | 4 Reserve | 5 Share card | 6 Stories | 8 Footer |
|---|---|---|---|---|---|---|---|
| Empty | n/a (static) | Family tab with 0 matches cannot happen; assert 24 per family at build | Quiz with no answers picked: "Pick one to continue", button disabled | Counters at 0 read "Be the first" not "0 reserved" | No shade chosen: card shows the daily shade | n/a (static) | n/a |
| Loading | None; first paint is HTML | Tiles are inline CSS; no loader. Enlarged render: blurred swatch placeholder until WebP arrives | Photo upload: progress ring on the image itself, not a spinner | Counters: skeleton bar until the Worker responds, then count up. Submit: button text becomes "Reserving..." and stays disabled | Canvas render under 100 ms; if Web Share is slow, button shows "Opening..." | Images lazy with swatch placeholder | n/a |
| Error | n/a | Render 404: tile falls back to the flat swatch, logged | Photo decode fails: "That photo didn't open. Try another, or take the quiz" | Worker 5xx or Turnstile fail: form stays filled, message under the button, retry allowed | Canvas unsupported: fall back to a server-rendered PNG at /card/{shade}.png | Image error: swatch block | n/a |
| No internet | Page already loaded works | Enlarge works (inline swatch); render fetch shows swatch | Quiz works fully offline (static logic) | Submit queues locally with "You're offline. We'll send it when you're back" and retries on `online` | Share works (canvas is local); link copy works | Works | Works |
| Slow network | LCP is text, no block | Renders stream in; no layout shift (aspect-ratio boxes) | Same as loading | Counters skeleton, submit never times out silently: 8 s then "Still trying..." | Same as loading | Lazy below the fold | n/a |
| No results | n/a | Search by shade name: "No shade called X. Closest: Y, Z" with the two nearest by name and hue | Quiz always resolves (deterministic mapping to a family + shade) | n/a | n/a | n/a | n/a |
| Permission denied | n/a | n/a | Camera (if shipped): fall back to upload, then to quiz, with one line, never a dead end. Photo upload needs no permission on the web | Clipboard write denied: show the link in a selectable field | Web Share denied or absent: download PNG + copy caption | n/a | n/a |
| Session expired | n/a (no sessions) | n/a | n/a | Turnstile token expired (5 min): re-run Turnstile silently and resubmit once | Referral link always valid (code, not session) | n/a | n/a |
| Form validation | n/a | n/a | n/a | Phone: +91 and 10 digits, inline, on blur not on keystroke; email optional but checked if present; consent box required; errors in plain words, field keeps its value | n/a | n/a | n/a |
| Success | n/a | Tile tapped: enlarged state with name + family + "Reserve this one" | Result card with the shade, "Reserve" and "Not quite? Try again" | Confirmation: shade, position number, referral link, share card; email/WhatsApp follows; reachable at /thanks | "Shared" or "Copied" for 2 s, then back | n/a | n/a |

Rules that fall out of the table:
- H1. No full-page loaders anywhere. Loading is always local to the thing that is loading.
   Approved exception (Sam, 2026-10-09; hero only): the hero's full-screen loader on the 3D path (E-H1). The "1 Splitter hero" column above predates the decision; `docs/specs/hero.md` section 5 replaces it for the hero.
- H2. Every error keeps the user's input and offers one next action.
- H3. Offline is a first-class state for the reserve form: queue, retry, confirm. Tested with the network throttled to offline in Playwright.
- H4. Validation runs on blur and on submit, never on every keystroke; success states are 2 s and reversible.

## F. Done means
F1. The acceptance criteria written in the plan for this section are each met, quoted back with evidence.
F2. No TODOs, placeholders, lorem ipsum or commented-out code left in the section.
