// The family page's geometry, pure (no three.js): ciao's opening carousel (docs/specs/family-page.md 19), the scroll map
// after it (section 20: the zoom, the four case types, the argument screen; section 21: the phone pose; section 24: the
// case type each beat asks for), the projection the skeleton and the HUD use, and the view fit per layout. Shared by the build (the
// skeleton in Poster.astro), the page module (the skeleton at runtime, the scroll map) and the stage (the poses).
// Every value was measured from ciao's module (research/ciao-landing, ciao-3d-params.json, keyframes-desk.json) and
// re-created here; nothing of ciao's ships.
import { TAKEOVER, easeTakeover } from '../../../config/takeover.ts';

export type Layout = 'phone' | 'wide';
export const WIDE_MQ = '(min-width: 900px) and (min-height: 600px)';
export const DEG = Math.PI / 180;
export interface Dims { readonly w: number; readonly d: number }
/** The supplier case's normalised width and thickness (height 1): 104.7 and 26.6 of 196.7 mm (src/data/case-model.json). */
export const DIMS_DEFAULT: Dims = { w: 0.5322, d: 0.1352 };

/**
 * ciao's carousel, in its world units: one slot every 3.5 units; slot x sits at (x, sin(x x wave), -|x| - 0.2) with
 * wave = 0.25 x clamp(1440 / width, 1, 2.4); every item is tipped back 20 degrees, turned (x x 0.5 rad - 20 degrees) and
 * leaned 11.25 degrees (Euler XYZ); the camera at z 29, FOV 20, unrotated. The can is 4.07 units tall at scale 1.2, so
 * the case (height 1) is scaled to 4.884 (163 mm against the can's 168). A can's turn only spins its label; a flat case
 * would show its edge or its inside, so each case spins about its own long axis against its slot's turn (face 1).
 * slotPx: ciao's 175 px of drag per slot. phoneTop and phoneBottom: on phones the scene is lifted so the front case sits
 * between the title and the controls. turn: the 10 degree tap turn; tiltYaw and tiltPitch: the pointer's tilt in degrees.
 * rate: the lag of the line in per second (50% at 63 ms); gRate: the entrance's light, twice as fast. spot: ciao's 50 cd.
 * wideBack and wideDrift (section 24, Sam, 2026-11-03: "make sure that the entire phone case is fully visible for all 4 case
 * types, not keep going down the case"): on the wide layout the beats' camera stands back by wideBack as the phone's does
 * (ciao's beats camera cut the case at the top or the bottom of an 800 px screen) and the beats' vertical drift (CY) is
 * damped to wideDrift of ciao's, so every beat's case sits whole inside the screen; the argument screen's camera is untouched.
 * envRot: the studio turned -40 degrees about y (section 20). phoneBack and phoneCentre (section 21, D8): on phones the
 * zoomed and argument cameras stand 1.75 times further back and the case is centred at 36% of the screen height, in
 * the band above the text.
 */
export const CFG = {
  sp: 3.5, cs: 4.884, camZ: 29, fov: 20, rx: -20, ry: -20, rz: 11.25, face: 1, slotPx: 175, phoneTop: 132, phoneBottom: 262,
  tiltYaw: 5, tiltPitch: 3, turn: 10, rate: 10.94, gRate: 2, spot: 50, envRot: -40, phoneBack: 1.75, phoneCentre: 0.36, wideBack: 1.6, wideDrift: 0.4,
} as const;

export interface Pose { p: number; X: number; Y: number; Z: number; rx: number; ry: number; rz: number; spin: number; sc: number }
export interface Fx { yaw: number; tilt: number }

/** The carousel pose of slot i when the line is at s (fractional), for a viewport vw wide; fx adds the pointer's tilt to the front case. */
export function poseOf(i: number, s: number, vw: number, fx?: Fx | null): Pose {
  const x = (i - s) * CFG.sp, p = Math.max(0, 1 - Math.abs(x) / CFG.sp), wave = Math.max(1, Math.min(2.4, 1440 / vw)) * 0.25;
  return {
    p, X: x, Y: Math.sin(x * wave), Z: -Math.abs(x) - 0.2,
    rx: (CFG.rx + (fx ? fx.tilt * p : 0)) * DEG, ry: x * 0.5 + (CFG.ry + (fx ? fx.yaw * p : 0)) * DEG, rz: CFG.rz * DEG,
    spin: -CFG.face * x * 0.5, sc: CFG.cs,
  };
}

/** A local point through the pose: scale, the spin about the long axis, then Euler XYZ (z, y, x), then the move. */
export function xform(o: Pose, v: readonly [number, number, number]): [number, number, number] {
  let x = v[0] * o.sc, y = v[1] * o.sc, z = v[2] * o.sc, c: number, s: number, t: number;
  c = Math.cos(o.spin); s = Math.sin(o.spin); t = x * c + z * s; z = -x * s + z * c; x = t;
  c = Math.cos(o.rz); s = Math.sin(o.rz); t = x * c - y * s; y = x * s + y * c; x = t;
  c = Math.cos(o.ry); s = Math.sin(o.ry); t = x * c + z * s; z = -x * s + z * c; x = t;
  c = Math.cos(o.rx); s = Math.sin(o.rx); t = y * c - z * s; z = y * s + z * c; y = t;
  return [x + o.X, y + o.Y, z + o.Z];
}

/** ciao's camera (at z camZ, unrotated, FOV 20, the aspect W / H): a world point to CSS px in a W x H stage, shifted by shift. */
export function project(pt: readonly [number, number, number], W: number, H: number, shift: number): [number, number] {
  const zc = pt[2] - CFG.camZ, f = 1 / Math.tan(CFG.fov / 2 * DEG);
  return [(f / (W / H) * pt[0] / -zc + 1) / 2 * W, (1 - f * pt[1] / -zc) / 2 * H + shift];
}

export const corners = (dims: Dims): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) out.push([a * dims.w / 2, b * 0.5, c * dims.d / 2]);
  return out;
};

export interface Box { x0: number; x1: number; y0: number; y1: number; h: number }
/** The screen box of slot i's case at line position s. */
export function caseBox(W: number, H: number, i: number, s: number, shift: number, dims: Dims): Box {
  const o = poseOf(i, s, W);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const c of corners(dims)) {
    const q = project(xform(o, c), W, H, shift);
    if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
  }
  return { x0, x1, y0, y1, h: y1 - y0 };
}

export interface Fit { W: number; H: number; cls: Layout; D: number; shiftY: number; pxu: number; stripPx: number; caseTop: number; caseBottom: number; caseY: number; caseHW: number }
/**
 * ciao's camera never reframes; on the phone layout the scene moves up (a view offset) so the front case sits between
 * the title and the controls, which ciao's single column does not have to fit.
 */
export function solve(W: number, H: number, cls: Layout, dims: Dims = DIMS_DEFAULT): Fit {
  const b = caseBox(W, H, 0, 0, 0, dims);
  const shift = cls === 'phone' ? Math.min(0, (CFG.phoneTop + (H - CFG.phoneBottom)) / 2 - (b.y0 + b.y1) / 2) : 0;
  const f = 1 / Math.tan(CFG.fov / 2 * DEG), pxu = (H / 2) * f / CFG.camZ;
  return { W, H, cls, D: CFG.camZ, shiftY: shift, pxu, stripPx: CFG.slotPx, caseTop: b.y0 + shift, caseBottom: b.y1 + shift, caseY: (b.y0 + b.y1) / 2 + shift, caseHW: (b.x1 - b.x0) / 2 };
}

function hull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** The skeleton (rule 41): the convex hull of each case in frame at line position s0, as SVG polygon point lists in CSS px. */
export function skeletonPolys(W: number, H: number, cls: Layout, dims: Dims = DIMS_DEFAULT, s0 = 0): string[] {
  const fit = solve(W, H, cls, dims), cs = corners(dims), out: string[] = [];
  for (let i = 0; i < 24; i++) {
    const o = poseOf(i, s0, W);
    const pts = cs.map((c) => project(xform(o, c), W, H, fit.shiftY));
    if (Math.max(...pts.map((p) => p[0])) < -20 || Math.min(...pts.map((p) => p[0])) > W + 20) continue;
    out.push(hull(pts).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '));
  }
  return out;
}

/* ---------------------------------------------------------------- the scroll map (section 20, 21): seven screens */
/**
 * In screens of scroll: 0 to 1 the carousel, 1 to 2 the zoom (no text), 2 to 6 the four case types, 6 to 7 ciao's
 * argument screen. The HUD leaves at 0.5; the tint runs 1.1 to 5.6; the beats' text and nav 1.6 to 5.6; the argument
 * from 5.6. Nothing but the family's name shows on the first screen (D9); Tough and its description come with beat 1.
 * Each next type's text comes in at its sweep's half (2.9, 3.9, 4.9), as the wave's band crosses the case's middle (Sam,
 * 2026-11-04, with the turn gone; at the hand-overs 2.8, 3.8 and 4.8 from 2026-11-03, and 2.6, 3.6 and 4.6 before).
 */
export const SV = { hudOff: 0.5, tintOn: 1.1, beatsOn: 1.6, beatsOff: 5.6, argOn: 5.6, screens: 7 } as const;
export type Beat = 'none' | 'z' | '1' | '2' | '3' | '4';
/** instant: the stage changes the case at the hand-over with no sweep (reduced motion), so the text does too */
export function activeBeat(sv: number, instant = false): Beat {
  if (sv <= 0.6) return 'none';
  if (sv < SV.beatsOn) return 'z';
  if (sv >= SV.beatsOff) return 'none';
  // each next type's text at its sweep's half, where the wave's band crosses the middle of the case (Sam, 2026-11-04: "the
  // title and text of each case type is not synced with the wave"); at the hand-over, the turn's end, until then
  let n = 1;
  for (const t of TURNS.slice(1)) if (sv >= turnEnd(t) + (instant ? 0 : SWEEP_LEN / 2)) n++;
  return String(n) as Beat;
}
export function scrollClasses(sv: number): { hudOff: boolean; beatsOn: boolean; tintOn: boolean; argOn: boolean } {
  return { hudOff: sv > SV.hudOff, beatsOn: sv > SV.beatsOn && sv < SV.beatsOff, tintOn: sv > SV.tintOn && sv < SV.beatsOff, argOn: sv > SV.argOn };
}

/**
 * ciao's keyframes after the carousel (keyframes-desk.json, scaled by 1.2 where they are in can heights): the zoom over
 * 1 to 2 (camera z 29 to 12, y 0 to -2.4, pitched 10 degrees and rolled -10, the case down to -0.96 and scaled 1 / 1.2),
 * the four beats at 2 to 6 (the case rising to -0.58, 0.02, 0.6; the roll alternating -10 and +5 degrees), then over
 * 5 to 6 ciao's argument pose (its row 5000 to 6000: camera at z 8, level, FOV 45; the case at the centre, z -0.5,
 * tipped back 20 degrees and rolled -5, facing the camera; the two carousel spots back at 45 of 50), held over 6 to 7
 * with the pointer's influence and a slow bob. Between beats the values ease with ciao's power1.inOut (a smoothstep).
 * No turn since 2026-11-04 (Sam: "just remove the rotation animation for case types, just keep the wave"): beatPose's
 * yaw is 0 and the takeover's sweep alone changes the case; what follows is the turn as it was built.
 * The turn (section 24 D15; Sam, 2026-11-03: "rotate 360 degrees completely, even the backside of the phone should be
 * visible, and after the rotation only comes the transition effect"): over each feature transition the case on screen
 * makes one whole turn about its vertical axis, its back coming round at the half, and no model changes during it (the
 * half turn of section 21 D3, re-posed at its edge-on frame, ends here). The turn into Tough runs 1.6 to 2 and changes
 * no model; each hand-over's turn (2.4 to 2.8, 3.4 to 3.8, 4.4 to 4.8) ends facing the camera at its hand-over (2.8,
 * 3.8, 4.8), where the next type is asked for, and the sweep (three/takeover.ts) runs from there to the beat's rest
 * (SWEEP_LEN), its progress the stage's scroll (D6).
 */
export const sm = (t: number): number => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// CY: every beat's case at beat 1's height since Sam, 2026-11-04 ("after going to each case type, the model is moving
// upwards to the top of the screen, make sure it stays in the center"); ciao's rise to -0.58, 0.02 and 0.6 until then
export const RZ = [0, -0.1745, 0.0873, -0.1745, 0.0873, 0, 0] as const, CY = [0, -0.96, -0.96, -0.96, -0.96, 0, 0] as const;
export const TURNS = [2, 3, 4, 5] as const, TURN_LEN = 0.4, SWEEP_LEN = 0.2;
/** Where the turn into beat n ends: the turn into Tough at its beat, each hand-over's SWEEP_LEN before it, so the sweep follows the turn. */
export const turnEnd = (n: number): number => (n === TURNS[0] ? n : n - SWEEP_LEN);
/** the sweep's eased progress (the band's place across the case, takeover.ts) where the band meets the case and where it has left it */
export const WAVE_EDGES: readonly [number, number] = [(0 - TAKEOVER.pFrom) / (TAKEOVER.pTo - TAKEOVER.pFrom), (1 - TAKEOVER.pFrom) / (TAKEOVER.pTo - TAKEOVER.pFrom)];
/** smootherstep: no speed and no acceleration at either end */
const smoother = (x: number): number => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (6 * x - 15) + 10); };
/**
 * The roll's share between two case types at sv: while the wave's band crosses the case, on a smootherstep of the band's
 * place, so the case tilts with the wave and settles without a jolt (Sam, 2026-11-04: "the case turns left and right
 * very sharply, smoothen it and end of the turn should look smoother"); over the whole screen until then, which a step's
 * quick lead to the hand-over played in a quarter second.
 */
export function rollShare(sv: number, j: number): number {
  const raw = (sv - (j + 1 - SWEEP_LEN)) / SWEEP_LEN;
  if (raw <= 0) return 0;
  if (raw >= 1) return 1;
  return smoother((easeTakeover(raw) - WAVE_EDGES[0]) / (WAVE_EDGES[1] - WAVE_EDGES[0]));
}
export interface BeatPose { k: number; rz: number; cy: number; A: number; yaw: number }
export function beatPose(sv: number): BeatPose {
  const k = sm(sv - 1);
  const j = Math.max(1, Math.min(6, Math.floor(sv))), t = sm(sv - j);
  // between two case types (screens 2 to 5) the roll rides the wave; into Tough (the zoom) and out of Armor (the argument) the screen's smoothstep as before
  const tr = j >= 2 && j <= 4 ? rollShare(sv, j) : t;
  const rz = RZ[j - 1] + (RZ[j] - RZ[j - 1]) * tr, cy = CY[j - 1] + (CY[j] - CY[j - 1]) * t;
  const A = sm(sv - 5);
  // no turn since Sam, 2026-11-04 ("just remove the rotation animation for case types, just keep the wave"): the case
  // faces the camera through every hand-over and the takeover's sweep alone changes it (TURNS keep the hand-overs' places)
  return { k, rz, cy, A, yaw: 0 };
}

/**
 * ciao's profile light rides with the zoomed case (section 24 D13; Sam, 2026-11-03: "it should be the same as tough case
 * for all other case types"). The light and its target are lifted by how far the case stands above the place ciao's can
 * held under that light: through the zoom (sv under 2) ciao's own path, so on phones the zoom is lit as before and on the
 * wide layout the damped drift (wideDrift) is made up; from beat 1 on, beat 1's place (CY[1]), so the case's rise
 * through beats 2 to 4 no longer carries its top out of the pool. drift is the layout's (1 on phones, CFG.wideDrift wide).
 */
export function profileLightOffset(sv: number, drift: number): number {
  const B = beatPose(sv);
  return sv < 2 ? B.cy * B.k * (drift - 1) : B.cy * drift - CY[1];
}

/** The four case types in beat order (section 20: Tough, MagTough, Snap, Armor at beats 1 to 4). */
export const CASE_TYPES = ['tough', 'magtough', 'snap', 'armor'] as const;
export type CaseType = (typeof CASE_TYPES)[number];
/** The screen each type rests at: its beat, where the turn's yaw is 0 and its sweep has ended. */
export const CASE_REST: Readonly<Record<CaseType, number>> = { tough: 2, magtough: 3, snap: 4, armor: 5 };
/** The hand-overs: the ends of the whole turns into beats 2 to 4, the case facing the camera again (TURNS[i] - SWEEP_LEN: 2.8, 3.8, 4.8). */
export const HANDOVERS = TURNS.slice(1).map(turnEnd) as readonly number[];
/**
 * The case type a frame asks for (section 24 D3): Tough below 2.8 and whenever the zoom is at 0 (the carousel),
 * MagTough from 2.8, Snap from 3.8, Armor from 4.8 through the argument screen.
 */
export function caseTargetAt(sv: number): CaseType {
  if (!(beatPose(sv).k > 0)) return 'tough';
  let i = 0;
  while (i < HANDOVERS.length && sv >= HANDOVERS[i]) i++;
  return CASE_TYPES[i];
}
