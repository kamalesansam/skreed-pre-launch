---
name: section-4-frame-review-gotchas
description: "What to tell frame reviewers of section 4's carousel so they do not report the design as defects (the swap is at eased 0.5, about 160 ms in; the product is lit by its own key light; the dev toolbar leaks into captures), learned 2026-10-26"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4aecc83b-f76d-4b5d-8424-81f04f311ea5
  modified: 2026-10-29T06:50:04.605Z
---

When briefing reviewers (or reading step frames yourself) for section 4's carousel, state the timing in frames: the step eases with power2.out (e = 1 - (1 - t)^3), so the edge-on product swap at eased t 0.5 lands at 0.206 of the 0.77 s step, about 160 ms, frame 3 to 4 of 18 at 24 fps, and the room swing is 86 percent done by frame 9. A brief that says "the swap is mid-step, around frames 9 to 12" makes every reviewer report a blocker swap-pop that is the spec's own timing (2026-10-26: all eight step reviewers did). Also known and not defects: the product keeps its own key light while the room's lights are down (it floats lit over a dark room mid-step), and the Lenskin's metallic finish reads about 60 percent of its shade's brightness.

Captures from the dev server pick up Astro's dev toolbar when the mouse is near the bottom edge (hover-south frames); hide it with `page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' })` before the frames, or capture from a build.

The scratchpad capture scripts cannot resolve `@playwright/test` from outside the project; import it by file URL from the worktree's node_modules. A review workflow's verifier agents ran out of model allowance after about 60 agents on 2026-10-26; keep the verify fan-out small (one or two refuters) or verify the few real findings by hand with sharp.

**Why:** Three hours of a 186-agent review were spent on a mis-stated expectation and on dev-only artefacts.

**How to apply:** Put the eased timing, the own-light note and the toolbar hide in any section 4 review brief or capture script; verify by pixel measurement before changing the step's timing.
