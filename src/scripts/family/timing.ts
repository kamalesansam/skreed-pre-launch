// Family page timings (docs/specs/family-page.md 2.5, 4; registered in DESIGN.md "Family pages"). The CSS twins of
// SWAP_MS, SWAP_EASE and SHADE_MS are --dur-swap, --ease-swap and --dur-shade in family.css; tests/family/data.test.ts keeps them equal.
export const SWAP_MS = 400;                                  // name and number swap
export const SWAP_EASE = 'cubic-bezier(0.25, 1, 0.5, 1)';    // power3.out in CSS form
export const SHADE_MS = 600;                                 // the sticky bar swatch's cross-fade (--dur-shade)
export const URL_DEBOUNCE_MS = 300;                          // ?shade= rewrite with replaceState
export const SETTLE_MS = 600;                                // shade_selected once the selection is stable
export const DRAG_HUD_MS = 150;                              // HUD refresh while a finger is down
export const LIVE_MS = 400;                                  // live region: one announcement per settled change
export const LINEUP_RATE = 10.94;                            // per second: 50% at 63 ms, 90% at 210 ms, 99% at 421 ms
export const TURN_MS = 600;                                  // the front case's turn
export const TURN_EASE = [0.45, 0, 0.55, 1] as const;        // --ease-turn
export const CANVAS_FADE_MS = 200;                           // poster to canvas
