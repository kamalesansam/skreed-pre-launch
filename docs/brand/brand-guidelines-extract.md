# Skreed brand guidelines, extract (from the Company Context Pack, read 2026-10-05)

Source: Sam's "Skreed — Company Context Pack" artifact (public link in the chat). This file is the part the site build needs. It overrides any earlier typeface guess in this repo.

## Typography
| Role | Face | Weight | Notes |
|---|---|---|---|
| Headlines | **Poppins** | Bold (700) | "Across all brand communications; do not substitute." Sentence case, never all caps. |
| Sub-headlines | Inter (guide) | Medium (500) | **Banned by Sam.** On the site this slot is Source Serif 4 400; see `type-system.md`. |
| Body | **Open Sans** | Regular (400) | Specimen line: "At Skreed, we believe that your phone case should be a true reflection of your individuality." |
| Campaign-only alternates | Century Gothic, Aghita, Lato, Playfair, League Spartan, Montserrat | | Theme-dependent creatives only. Not for the site. |

Leading as printed in the guide: headings about 90%, sub-headings about 65% (treated as a print typo; the site uses 1.0), body about 140%. Rule of thumb: larger type, tighter leading.
Avoid: very tall or tight leading, crashing or very wide tracking, mixed weights or faces inside one headline, all-caps headlines.

The site ships Poppins 700, Source Serif 4 400 (variable, opsz) and 600, and Open Sans 400 to 600 (variable), all OFL, as four self-hosted Latin WOFF2 files, 97.9 KB measured. Build recipe and metrics in `scripts/fonts/` and `type-system.md`.

## Colour
| Role | Name | Hex |
|---|---|---|
| Core | Urban Slate | #383F43 |
| Core | Pearl Whisper | #F7F6F3 |
| Core | Ember Luxe | #FF9900 |
| Primary | Almond Silk | #E9D9CA |
| Primary | Steel Twilight | #577095 |
| Primary | Rust Ember | #CD754E |

Shade set 3.3: light/base/dark ramps derived from these, plus accents (a forest-green ramp is named); exact hexes live in the full guideline deck. Pairings 3.4: only approved pairings, always with contrast.

For the site: Pearl Whisper is the page neutral (replaces the "warm off-white" placeholder), Urban Slate is the charcoal. Ember Luxe is the one accent and is reserved for the primary button and focus rings. The 240 product shades remain swatches only.

## Logo
Logomark "SKRD", minimum 60 px wide on screen. Logotype "SKREED" in bold caps, never re-set. Lockup spacing fixed. Clear space equals the first letter's height and width. Over imagery only in white or black. No outlines, shadows, effects or stretching.

## Voice
Confident yet approachable. First person (we/you), short sentences, active voice, sensory colour words (glow, ignite, blend). Precise about nuance, subtly aspirational, no aggressive sales. Sample lines: "We believe in the power of color." "Color isn't one-size-fits-all." "Two people can love blue and mean entirely different shades."

## What this changes in the repo
- CLAUDE.md rules 4, 18, 19 and 30 are rewritten to the type system. Inter stays banned in every role; Source Serif 4 takes the first-person prose (the one departure from the guide, pending Sam's yes).
- The thin + black caps pairing inferred from the catalog is dropped. Headlines are Poppins Bold in sentence case.
- Page neutrals get their brand names and hexes.
