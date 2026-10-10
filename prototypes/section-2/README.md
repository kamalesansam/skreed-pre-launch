# Section 2 prototype: the gem field (2026-10-10)

Live: https://claude.ai/artifact/ArbU2rDdfmjuFMBVbmAWfn (round 1). Spec: `docs/specs/section-2.md`.

The ten gems in the **Gem C** look Sam picked (`gem-looks.html` is the four-look comparison, live at https://claude.ai/artifact/DfDgwjkrx5TQ4krsyW1NSB), standing still in their final slots, with:
- **igloo's labels** (Sam: "add the same text and font"): three per gem in IBM Plex Mono Medium, uppercase, Pearl Whisper. `FAMILY_nn` over the family on every gem; on the active gem (pointer or keyboard focus) the key shade with its catalog number and hex, and `24 SHADES` over `CLICK TO EXPLORE`. igloo's reveal: leader 0.2 s, alpha wipe 0.4 s, glyph roll 0.75 s; hide 0.2 s.
- **igloo's plexus** on the active gem.
- **igloo's hover**: a frost buffer per gem stepped at 60 Hz (flow advect, 4-neighbour dilation, capsule splat sized by pointer speed, decay 0.985), drawn as a rim in igloo's #83a1c5 plus our own triangle lattice, so the crackle, the spreading rings and the triangle web follow the pointer and fade within about 4 s. Pointer parallax turns each gem in place.
- **Links**: each gem is a real link (`#/shades/<family>/` here; `/shades/<family>/` on the site), keyboard reachable with an Ember focus ring.

Not in this round: the cascade from the logo, the scroll pinning and the hand-off from the hero; those come next, on the hero template.

Build: `assemble.py <dir>` patches `gem-looks.html` (Gem C only, labels, hover, plexus, links) with `tail.js`; it expects `gemlooks/gem-looks.html` and `s2gems/tail.js` under `<dir>`. Test: `test.mjs <file> <w> <h> <mobile> <outDir> [quick]` serves the page under the artifact's strict CSP with the fonts cached locally, on a virtual clock (`?capture&vclock`), and captures the label reveal, a hover sweep, its decay and keyboard focus.

Checked (SwiftShader, strict CSP): no console errors; IBM Plex Mono loaded; label reveal frames; hover and decay at 1280; phone layout at 390 (zig-zag, labels on the inner side). Shots: `shot-1280.png`, `shot-390.png`, `shot-hover-1280.png`, `shot-reveal-1280.png`.

Open for Sam: label contrast (igloo's white on the fog is about 2.5:1, below AA; dark plates behind the labels pass AA but read as grey boxes) and the label content mapping.
