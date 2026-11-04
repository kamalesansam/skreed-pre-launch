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
// the argument screen's "Back to main page" (section 22, exception E-F5): the wait, then the fade in and out, whose CSS
// twins are --dur-fade and --dur-out in src/styles/tokens.css (the timing test keeps them equal)
export const BACK_DELAY_MS = 2500;                           // the argument screen on, then the control
export const BACK_IN_MS = 400;                               // its fade in (--dur-fade)
export const BACK_OUT_MS = 200;                              // its fade out (--dur-out)
// the cue's words (docs/specs/family-page.md 25, docs/specs/scroll-cue.md): the rest before they come back, the landing's CUE.stillMs
// (src/config/cue.ts), written here so swatch grid mode's module pulls in no chunk it shares with the hero's island
// (tests/unit/scroll-cue.test.ts keeps the two equal)
export const CUE_STILL_MS = 1500;
// the case types' steps (docs/specs/family-page.md 26, docs/specs/scroll-steps.md 3; Sam, 2026-11-04): one gesture, one
// case type. The ride from one type's rest to the next, a screen of scroll, carries its whole turn and its sweep on
// --ease-turn; a jump of more than one (the beat nav) adds CASE_STEP_MS a screen up to CASE_STEP_MAX_MS. The pause after
// a ride swallows gestures as the scenes' cooldown does; a page carried into the types by its own scroll is held on the
// type it entered at until it has been still for CASE_HOLD_STILL_MS, at most CASE_HOLD_MAX_MS (the scenes' arrival hold)
export const CASE_STEP_MS = 1400;
export const CASE_STEP_MAX_MS = 2800;
export const CASE_STEP_COOLDOWN_MS = 150;
export const CASE_HOLD_STILL_MS = 150;
export const CASE_HOLD_MAX_MS = 1200;
