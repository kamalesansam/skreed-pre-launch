// Section 5's ground under the hero island (Sam's picture of 2026-11-02; docs/specs/section-5.md as amended that day):
// the flat SIGNUP_GROUND that the fourth wipe cuts onto from scene 5 and that the island holds under section#signup while
// the section is in view, in place of the jar of sand over section 2's fog. The colour is one 1 x 1 texture of its sRGB
// bytes with no colour space, so the composite samples the bytes as stored and writes them as they are (its cut and its
// rest copy a texel: no tone mapping, fog, grain or dither reaches it). The section's layout is read from the DOM alone
// (its document top and height, and .su-body's end), at most twice a second and afresh after a resize or the quiz's
// unlock, so a frame reads scrollY and nothing else: the exit seam's trigger (the body's end at the viewport's bottom;
// the body is one screen tall, so that is its top) and the wrap's landing (the section's rest) come from it. While the
// island draws the ground under the section it marks it data-ground="island" (the page then leaves its own ground to the
// canvas); the mark goes when it stops, when the island falls to the poster and when it tears down. The section is
// ready for the wrap's cover-out once the page has set data-ready="1" (the jar pictures and the fonts decoded).
import { DataTexture, RGBAFormat, UnsignedByteType, type Texture } from 'three';
import { SIGNUP_GROUND } from '../../../config/signup-ground.ts';

/** a #rrggbb colour as the texel's four bytes, opaque */
export function groundBytes(hex: string): Uint8Array<ArrayBuffer> {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`section5/ground: ${hex} is not a #rrggbb colour`);
  return new Uint8Array([parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 255]);
}

/** the section in document px: its top and height, and .su-body's end (its bottom edge) */
export interface SignupLayout { top: number; height: number; bodyBottom: number }

/** the exit seam's trigger for a viewport height: the body's end at the viewport's bottom */
export const exitOf = (l: SignupLayout, vh: number): number => l.bodyBottom - vh;
/**
 * the section's rest: the trigger, or the section's top when that is lower down the page (a body shorter than the
 * screen), and never past the page's last position, `last` (a phone's viewport taller than 100svh once its toolbar
 * hides: the page ends at the body's end and stops short of the section's top)
 */
export const restOf = (l: SignupLayout, vh: number, last = Infinity): number => Math.min(Math.max(l.top, exitOf(l, vh)), last);
/** any of the section inside the viewport at scroll y */
export const inViewOf = (l: SignupLayout, y: number, vh: number): boolean => l.top < y + vh && l.top + l.height > y;

/**
 * What the island draws of section 5 this frame. 'wipe': section 4 is on screen and the fourth wipe has begun, so the
 * ground is the cut's far side (the whole frame once the cut is done). 'whole': section 4 is off the screen and the
 * section is in view, so the ground is the whole frame. 'off': nothing of it.
 */
export type GroundMode = 'off' | 'wipe' | 'whole';
export function groundMode(o: { inView: boolean; roomOn: boolean; wipeOut: number }): GroundMode {
  // the cut done (wipeOut 1) is the whole frame even while a sub-pixel of section 4 is still on screen: on the halved
  // track of 2026-11-03 the rest is fractional (19032.2 at 390 x 844) and the browser scrolls to whole pixels, so 0.2 px
  // of the room stays on screen at the rest and the ground would hold 'wipe' there, drawing every frame
  if (o.roomOn && o.wipeOut < 1) return o.wipeOut > 0 ? 'wipe' : 'off';
  return o.inView ? 'whole' : 'off';
}
/** the island's ground lies under the section (the mark): the whole frame, or the cut finished, with the section in view */
export const underGround = (mode: GroundMode, inView: boolean, wipeOut: number): boolean => inView && (mode === 'whole' || (mode === 'wipe' && wipeOut >= 1));
/**
 * The composite need not draw this frame: the ground is the whole frame with no cloud over it, and the canvas already
 * shows that frame at its present size (a resize clears the drawing buffer, and a restarted loop draws once anyway).
 */
export const holds = (o: { mode: GroundMode; cover: number; drawnAt: string | null; size: string }): boolean => o.mode === 'whole' && o.cover <= 0 && o.drawnAt === o.size;

export interface SignupGround {
  /** the colour's texel: sRGB bytes, no colour space, so the composite copies it as it is */
  readonly tex: Texture;
  /** the reading (cached up to 500 ms; afresh after invalidate()); null while the section has no box (locked behind the quiz) */
  layout(): SignupLayout | null;
  /** document px; NaN before a reading */
  exitY(): number;
  restY(): number;
  inView(): boolean;
  /** the section is ready for the wrap's cover-out: its data-ready="1" (C3) */
  ready(): boolean;
  /** the island draws its ground under the section (true) or has stopped (false): data-ground="island" set or removed, on a change only */
  mark(on: boolean): void;
  /** the next reading is taken afresh (a resize, the quiz's unlock) */
  invalidate(): void;
  /** the loop's record: the frames the composite drew with the ground in them, the frames it held, this frame's mode */
  readonly stats: { draws: number; held: number; mode: GroundMode };
  /** hooks builds: a pixel probe the loop answers after its next draw (it draws that frame, held or not) */
  probe: { pts: readonly (readonly [number, number])[]; done(px: number[][]): void } | null;
  dispose(): void;
}

/** a reading is kept this long (ms), as the old signupDom kept it: two forced layouts a second at most */
const MAX_AGE = 500;

export function createSignupGround(root: HTMLElement): SignupGround {
  const tex = new DataTexture(groundBytes(SIGNUP_GROUND), 1, 1, RGBAFormat, UnsignedByteType);
  tex.needsUpdate = true;
  const body = root.querySelector<HTMLElement>('.su-body');
  let at = -Infinity, cached: SignupLayout | null = null, end = Infinity, marked = false;
  /** the section's rect and the body's, read now, and the page's height with them; no box (hidden behind the quiz gate) reads null */
  const read = (): SignupLayout | null => {
    if (!root.getClientRects().length) return null;
    const s = root.getBoundingClientRect(), b = (body && body.getClientRects().length ? body : root).getBoundingClientRect(), y = scrollY;
    end = typeof document === 'undefined' ? Infinity : document.documentElement.scrollHeight;
    return { top: s.top + y, height: Math.max(1, s.height), bodyBottom: b.bottom + y };
  };
  const layout = (): SignupLayout | null => {
    const now = performance.now();
    if (now - at >= MAX_AGE) { cached = read(); at = now; }
    return cached;
  };
  const mark = (on: boolean) => {
    if (on === marked) return;
    marked = on;
    if (on) root.dataset.ground = 'island'; else delete root.dataset.ground;
  };
  return {
    tex,
    layout,
    exitY() { const l = layout(); return l ? exitOf(l, innerHeight) : NaN; },
    restY() { const l = layout(); return l ? restOf(l, innerHeight, end - innerHeight) : NaN; },
    inView() { const l = layout(); return !!l && inViewOf(l, scrollY, innerHeight); },
    ready: () => root.dataset.ready === '1',
    mark,
    invalidate() { at = -Infinity; },
    stats: { draws: 0, held: 0, mode: 'off' },
    probe: null,
    dispose() { mark(false); tex.dispose(); },
  };
}

declare global {
  interface Window {
    /** hooks builds: section 5's ground as the island holds it (section5/ground.ts), and the composite's bytes at canvas points (device px, from the bottom left) after its next draw */
    __skreedGround?: { state(): Record<string, unknown>; sample(pts: readonly (readonly [number, number])[]): Promise<number[][]> };
  }
}
