// The exit seam's guard (docs/specs/section-5.md 2 "The exit seam"; Sam's one-screen brief of 2026-11-02): pure, with no
// DOM, so tests/unit/exit-guard.test.ts drives every rule with numbers; director.ts feeds it a frame at a time and acts
// on its verdict. Beside scroll-math.ts and not in it: the director importing scroll-math.ts would put the glue's
// decisions in a chunk shared with scroll.ts (scripts/quiz/gate.ts keeps its own ease for the same reason).
// Section 5's body fills the screen, so its exitY is its rest and its top, and a crossing of it ran the loop on the
// first notch past the section's top: a fling from section 4 carried through the sign-up without a stop. So the exit
// runs only when armed. It arms once the page has rested at section 5's rest (within 1 px of restY, no wheel, touch or
// key input and no movement for 300 ms, no finger down; after a wrap from the top, the same rest once its lock has
// ended), and it disarms when the page leaves upward by more than half a screen. A crossing of the rest while armed
// runs the exit; the page past the rest while not armed is held at it (the director snaps it each frame as the exit's
// own hold does, with no cloud) until the input stops and the rest arms it, so the next deliberate scroll down runs the
// exit as before. Where the page's seams refuse (a text field focused, the on-screen keyboard up, the page zoomed) the
// guard neither holds nor exits, and disarms: the browser's own scroll that lifts a field above the keyboard, or a
// zoomed pan, is never fought and never runs the loop, and the exit after it waits for a rest and a fresh gesture.
// The trigger is the rest, which is exitY whenever the body fills the screen or more (a landscape phone's body runs past
// the screen, and its rest is its end) and the section's top if the body ever falls short of the screen.

/** The guard's numbers: the rest that arms it (ms with no input and no movement), how near the rest counts as there and how far a frame must move to count as movement (px), and how far above the rest disarms it (a share of the viewport). */
export const EXIT_GUARD = { restMs: 300, near: 1, leave: 0.5 } as const;

/** The guard's state from frame to frame: armed, and when the page last moved (ms, on the frame's clock). */
export interface ExitGuard { armed: boolean; movedAt: number }
export const createExitGuard = (): ExitGuard => ({ armed: false, movedAt: -Infinity });

/** One frame's facts: positions in document px, times in ms on one clock. */
export interface ExitFrame {
  /** scrollY now */
  readonly y: number;
  /** where the last frame left the page (after any hold); NaN before the first */
  readonly prevY: number;
  /** section 5's exit trigger (its body's end at the viewport's bottom) and its rest (that, or its top when higher); NaN before a reading */
  readonly exitY: number;
  readonly restY: number;
  /** innerHeight */
  readonly vh: number;
  /** the frame's time, and the last wheel, touch or key input's */
  readonly now: number;
  readonly inputAt: number;
  /** a finger is on the glass */
  readonly touching: boolean;
  /** the page's seams refuse here (refuses, below) */
  readonly refuse: boolean;
  /** the director's state is hall or world (no seam, no entry, no way back) */
  readonly live: boolean;
}

/** 'exit': start the exit seam. 'hold': the page snapped to the rest this frame. null: nothing. */
export type ExitAct = 'exit' | 'hold' | null;

/**
 * One frame of the guard. Mutates g: the movement clock every frame (the first frame, with no last position, and a
 * hold's own snap count as movement, so a rest is always seen whole); armed by the rest; disarmed by a frame that is
 * not live, by a missing reading, by a refusal, by the page more than half a screen above the rest and by the exit
 * itself. The page past the rest (by more than 1 px) runs the exit when it crossed there this frame while armed (a
 * crossing, never an arrival: the wrap lands on the rest), and is held otherwise, armed or not.
 */
export function exitGuard(g: ExitGuard, f: ExitFrame): ExitAct {
  const { restMs, near, leave } = EXIT_GUARD;
  if (!(Math.abs(f.y - f.prevY) <= near)) g.movedAt = f.now;   // a NaN prevY moves too
  const at = Math.max(f.exitY, f.restY);   // the rest (never above exitY); NaN while either is
  if (!f.live || !Number.isFinite(at) || f.refuse || f.y < f.restY - leave * f.vh) { g.armed = false; return null; }
  if (f.y > at + near) {
    if (g.armed && f.prevY <= at + near) { g.armed = false; return 'exit'; }   // a NaN prevY is no crossing
    g.movedAt = f.now;
    return 'hold';
  }
  if (!g.armed && Math.abs(f.y - f.restY) <= near && !f.touching && f.now - f.inputAt >= restMs && f.now - g.movedAt >= restMs) g.armed = true;
  return null;
}

/** what refuses reads of the focused element */
export interface FocusLike { readonly tagName?: unknown; readonly type?: unknown; readonly isContentEditable?: unknown }
/** the input types a press or a pick sets: no typing, so no on-screen keyboard (every other type takes typing) */
const PICKS = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'file', 'range', 'color', 'hidden']);

/**
 * The page's seams refuse here (scroll.ts refuses the glue on the same three): the focused element takes typing (a text
 * input of any type, a textarea, a select or contentEditable; never a checkbox, a radio or a button, which bring up no
 * keyboard, so a tick of the consent box leaves the exit to the next scroll), the visual viewport is shorter than the
 * layout viewport's clientHeight (the on-screen keyboard; clientHeight is the small viewport, which a browser's toolbars
 * never change, so Safari's bars never read as a keyboard), or the page is zoomed.
 */
export function refuses(active: FocusLike | null | undefined, vv: { readonly height: number; readonly scale: number } | null | undefined, clientHeight: number): boolean {
  if (vv && (vv.scale > 1.01 || vv.height < clientHeight - 1)) return true;
  if (!active || typeof active !== 'object') return false;
  if (active.isContentEditable === true) return true;
  const tag = String(active.tagName ?? '').toUpperCase();
  return tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && !PICKS.has(String(active.type ?? 'text').toLowerCase()));
}
