# Open work as of 2026-11-03 (taken back on this Mac)

What happened after the hand-off of 2026-11-02, and what stopped part-way. Finish these later; each one in its own worktree and branch, landed by the standing recipe.

## Landed on the default since 7e256a4 (default now e5a263e, 433 files, +17540 / -4052)

In order: the CLAUDE.md reservation (9e6c907), the merge map and its script (21f1480), the hero's halved scroll and the ten blocks leaving together (ec7d5a3, 95efdc5), the cue's words "Scroll to see more" (b2d629e), the quiz result redesign (3959d89), section 4 without the grey hall (3dabb60; `git revert aa1ef2c` brings it back, the hall kept on `archive/section-4-grey-room`), the About page and its ring (2244582, d8eff41), section 2 round 5, half the world's travel (bb104ab, ebb7e66), the merge map's record (7444d38), family pages round 6 (cab2d6d, 693c0eb), section 5 as Sam's four-jar picture (e5a263e).

The default is production on Vercel (skreed-pre-launch.vercel.app): every landing there is a deploy.

## Stopped part-way

1. `claude/quiz-paint-relief` (8 ahead, merges clean): our own paint relief, the result's reveal and scroll-out. The e2e run stopped on the weekly limit and the review workflow never reported. Needs: the quiz e2e suite on a fresh `build:test`, the review, then Sam's word to land.
2. `claude/about-nav-desktop` (6 ahead, merges clean): About in the section index, the index in Work Sans Light capitals, the About page on one laptop screen, its round 2 review log. The last step (correcting five overstated records, rerunning two unit tests) stopped on the limit. Open finding: on phones the drawer stays open after Back from /about/ (needs a script change Sam approves).
3. Family pages: review iteration 3 FAILED on two records (criterion 7's beat 1 colour on laptops; DESIGN.md's light bullet). Fixes and re-measures are in `docs/handoff/2026-11-03/family-pages.md`. Sam's five case-type questions (24.7) open.
4. Section 5: Sam's verdict on the cut and the glue is still out; open questions in `docs/handoff/2026-11-03/section-5.md`. The last round's e2e and review never reported.
5. The cue's records quote stale screen figures (3.0, 3.78, 4.85, 5.25; the map now puts them at 3.5, 3.9, 5.1, 5.5), and the cue's browser suites have not run on the landed default.
6. Section 2 round 5: nothing open.
7. Section 4 without the hall: `main` not cut and the archive not moved (Sam's word); review iteration 3 not run.
8. Housekeeping: the main checkout's local default is behind origin; 23 stale `s4/*` worktrees; `npm audit` 5 advisories; two Inter files (About's and section 5's) could become one; `docs/specs/screenshots/section-5-reference.webp` is Sam's upload committed on 2026-10-28, against his rule (raise with Sam).
9. Domains: SITE_URL, the canonical, the sitemap, the countdown's zero-state link and the 404 copy still name skreed.in / skreed.com, while the teaser now goes on skreed.shop.
10. Vercel serves no security headers (it does not read `public/_headers`).

## Session names (renamed 2026-11-03)

Quiz result redesign: Canva swatch, result frames, e2e spec. Section 4 without the grey hall. Section 5 sign-up: the four glass jars. Family pages round 6: case models and the depth.fyi takeover. Scroll cue: "Scroll to see more" and the chevrons (landed). About page and its link in the section index. Merge map hub: landing queue and no-conflict protocol. Hero scroll halved, the ten blocks leaving together (landed). Hand-off takeover: default proven, six work sessions started. Two untouched fork copies could be archived.
