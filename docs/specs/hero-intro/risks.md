RISKS, DEVIATIONS AND OPEN POINTS
1. Status of the current preloader: "Plot, scan, cut" is complete as a build (milestones, weights, poster, reduced motion), but it is a different mechanism from igloo's.
   - It shows a progress count and an outline plot, and cuts with a wipe.
   - Igloo shows a progress-less tape until everything is compiled and warm, then dissolves grey into grey while the intro plays.
   - This spec replaces it wholesale. Nothing of the plot loader is kept except the milestone bridge name.
2. The stray lines Sam reported are a separate bug in the current build and must be fixed before the intro is judged.
   - The likely suspect is the MSAA composer change that PENDING_MERGE.txt says caused stray lines on real GPUs; a composite hairline is next.
   - This intro adds 1px GL lines on purpose, but every one of them is hidden by 5.1 s and disposed by 8.2 s. T8 enforces that.
   - Do not re-enable MSAA composer targets to smooth the cage.
3. Deliberate deviations from igloo:
   - Pearl and Slate instead of igloo's blue-grey palette (brand).
   - No audio (igloo's is muted by default anyway).
   - No text glow on the tape (rule 25).
   - Open Sans cells instead of a monospace tape.
   - DOM plate reveal instead of MSDF text.
   - No diagonal colour-correction gradient.
   - A bloom-threshold ramp, added because the scene is dark.
   - Lattice yawed 45° and upper cage layers redistributed for a tall mark.
   - Height-normalised sweeps.
   - A far-floor fade standing in for igloo's mountains mesh.
   - No snow particles.
   - Each is noted where it applies. Sam may want to review the colour choice.
4. Line weight on a dark field: the cage gain is contrast-matched to igloo (about 0.3 of Pearl). Lines are 1 device px, so 0.67 CSS px at DPR 1.5 against igloo's 0.87 at 1.15, aliased like igloo's. On real GPUs this may read thinner or weaker than Sam remembers. Tune slider plus a real-GPU check before sign-off.
5. Transparent floor: moving the ground and stones into the transparent list (renderOrder -1) could change sorting against the fog cards and alter the approved hero. T7 guards this.
   - Fallback: keep them opaque, warm both program variants (three adds the OPAQUE define when not transparent) during the gate, and switch at 8.2.
6. Dynamic import: static imports fetch three before any guard runs. Without the switch to dynamic import, data-saver and no-WebGL visitors still download three.
7. A sync gate against LCP: igloo makes visitors wait for 19 MB (8 s here). Our prototype embeds about 3.5 MB of plates, so on throttled 4G the slate and tape can stay up well past CLAUDE.md's 2.5 s LCP.
   - The production Astro build must ship smaller plates (KTX2/AVIF, progressive).
   - The 20 s poster cut-off is the floor. Flag to Sam: the sync loader trades LCP for a stutter-free intro.
8. Compositor tape: steps() transform animations composite in Chromium, WebKit and Gecko. If a browser falls back to the main thread, the tape stalls during compileAsync, exactly as igloo's does. T5 measures it.
9. compileAsync without KHR_parallel_shader_compile (Firefox) blocks per program. The warm-up yields between groups, and the tape is not affected.
10. Fonts: the number atlas needs Open Sans 600. A slow Google Fonts response falls back to Arial after 3 s and is reported; the self-hosted WOFF2 in Astro removes this.
11. Scroll lock from 0 to 5 s copies igloo but may frustrate a returning visitor. Skip rules cover hash links and restored scroll.
    - Open point for Sam: should Escape or a scroll attempt jump to the 5.0 s UI state?
12. Number glyphs reuse igloo's arbitrary 20-value sequence as decorative glyphs, not a count claim.
    - Alternative with Skreed meaning: 012..240 in steps of 12 (the 240 shades). That needs 3-digit glyphs and 40px cells. Sam to choose.
13. Reduced motion skips the 8.2 s shot entirely (igloo has no reduced-motion path). The poster path also needs the poster image, which the prototype does not have yet; generate it from the rest frame in this build.
14. Phone: the identical timeline means the cage fills the portrait frame and numbers are 8.4 CSS px. This is faithful but dense; check the 390 capture against m390 sheets 01s-03s.
15. "Use igloo's exact code": the deliverable is our own code and our own geometry, generated from pieces_10.json and a seed. Igloo's maths is re-expressed; no igloo code, models, textures or strings ship.