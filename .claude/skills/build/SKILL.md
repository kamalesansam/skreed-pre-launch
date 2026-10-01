---
name: build
description: Implement a Skreed teaser section from its spec in docs/specs, phone first, and produce screenshots for review. Use after plan and before review.
---
# Build a section

Input: the spec path (`docs/specs/<slug>.md`) and, on later iterations, the reviewer's FAIL list.

Rules: `CLAUDE.md` is binding. Stack is fixed (Astro, GSAP, tokens). Use the taste layer and 21st.dev MCP for primitives but restyle everything to the tokens.

Steps:
1. Read the spec. On a fix iteration, read the FAIL list and address every item; do not touch anything else.
2. Implement at 390 px first. Only then the 1280 px layout.
3. Run the dev server. With Playwright, screenshot the section at 390 px and 1280 px, light and dark if the page supports both, and save to `docs/specs/screenshots/<slug>-<width>.png`.
4. Run `/web-design-guidelines` on the files you changed and fix what it reports.
5. Measure: bundle size delta for the page, Lighthouse mobile performance score.
6. Hand off to review with: files changed, screenshot paths, bundle delta, Lighthouse score, and a line per acceptance criterion saying how it is met.

Never mark your own work as passing. That is the reviewer's job.
