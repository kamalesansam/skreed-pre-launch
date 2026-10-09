// The lineup's pose function and camera rule (docs/specs/family-page.md 2.5). The reference implementation is
// scripts/case-model/study/fit.mjs; tests/case-model/pose.test.ts holds this module to its output
// (tests/case-model/baseline/lineup-fit-standin.jsonl) so the page and the study never drift apart.
import { Matrix4, PerspectiveCamera, Quaternion, Euler, Vector3 } from 'three';

const D2R = Math.PI / 180;

export interface LineupParams {
  w: number; d: number;                       // case width and thickness in normalised units (height 1)
  fan: number; yawFront: number; leanFront: number; lift: number; S: number; kz: number; pitchK: number;
  fov: number; phi: number; psi: number; rho: number;
  pxuPhone: number; frontFrac: number; frontMin: number; frontMax: number; hudBand: number; gutPhone: number; gutWide: number;
  /** the front case's scale on the phone layout (S is the wide layout's; the spec's single S for the stand-in) */
  Sphone: number;
  /** how far the two halves of the line part in the poster pose (G 0); 0 for the stand-in, whose middle pair clears */
  posterGap: number;
  /** air between the front case and its neighbours, in normalised units (the spec's 0.02) */
  air: number;
}

/** The spec constants; w and d come from the model's normalised box (the contract case: 77 x 163 x 12.3 mm). */
export const LINEUP: LineupParams = {
  w: 77 / 163, d: 12.3 / 163, fan: 62, yawFront: -15, leanFront: 3, lift: 0.3, S: 1.4, kz: 0.1, pitchK: 0.9,
  fov: 20, phi: 4, psi: 4, rho: -8, pxuPhone: 170, frontFrac: 0.385, frontMin: 240, frontMax: 340, hudBand: 224, gutPhone: 16, gutWide: 48,
  Sphone: 1.4, posterGap: 0, air: 0.02,
};

/**
 * The supplier case (Cobalt: w 0.533, d 0.135 of its height, wider and twice as thick as the stand-in), tuned against
 * the screen targets of family-page.md 7 as 2.5 asks (run 2 notes, section 18; tests/case-model/baseline/lineup-fit-supplier.json):
 * fan 72 keeps the phone strips at 44.8 px with pitch 0.9 x strip (62 would make them 56.6 px and push the second
 * neighbours out of a 390 px frame); the front case is scaled 1.33 on the phone layout (measured on the rendered
 * silhouette: 247 to 253 px tall from 375 to 430 px wide, with two full neighbours a side), 1.4 on the wide one;
 * frontMax 330 keeps all 24 in frame at 1920 x 1080 for selections 06 to 18; posterGap parts the poster's two halves.
 */
export const SUPPLIER_TUNING: Partial<LineupParams> = { fan: 72, Sphone: 1.33, frontMax: 330, posterGap: 0.06 };

/** The lineup constants for one model and layout class: the model's w and d, and the layout's front-case scale. */
export function lineupFor(dims: { w: number; d: number }, layout: Layout, tuning: Partial<LineupParams> = {}): LineupParams {
  const p = { ...LINEUP, ...tuning, w: dims.w, d: dims.d };
  return layout === 'phone' ? { ...p, S: p.Sphone } : p;
}

export interface Derived { strip: number; frontW: number; pitch: number; gap: number }
/** pitch = 0.9 (w cos fan + d sin fan); gap keeps the promoted front case clear of its neighbours plus air (0.02). */
export function derive(p: LineupParams): Derived {
  const strip = p.w * Math.cos(p.fan * D2R) + p.d * Math.sin(p.fan * D2R);
  const frontW = p.w * Math.cos(p.yawFront * D2R) + p.d * Math.sin(Math.abs(p.yawFront) * D2R);
  const pitch = p.pitchK * strip;
  const gap = 0.5 * (p.S * frontW + strip) - pitch + p.air;
  return { strip, frontW, pitch, gap };
}

/** Extra rotation of the front case only, multiplied by its centredness p: pointer tilt and the finish turn (degrees). */
export interface FrontFx { yaw: number; tilt: number }
const NO_FX: FrontFx = { yaw: 0, tilt: 0 };

const _q = new Quaternion(), _e = new Euler(), _v = new Vector3(), _s = new Vector3();
/**
 * The pose of slot i (0 to 23) for the eased selection s and promotion G (0 = poster pose, 1 = live). Writes the
 * matrix and returns the slot's centredness p. Lean is applied in the case's own plane, then yaw (Euler 'YXZ').
 */
export function pose(i: number, s: number, G: number, p: LineupParams, k: Derived, out: Matrix4, fx: FrontFx = NO_FX): number {
  const x = i - s, ax = Math.abs(x);
  // c opens the gap around the front case. The spec's clamp(x, -1, 1) let the two half-promoted cases of a move
  // (x = -0.5 and +0.5) intersect in 3D (T5); clamp(2x, -1, 1) opens the gap twice as fast, which is identical at every
  // whole selection and keeps both cases clear through the move.
  // posterGap parts the two halves of the line in the poster pose (G 0), where the two middle cases stand at the full
  // fan angle facing each other; at G 1 it is gone, so every live pose is unchanged.
  // The gap opens ahead of the promotion (Gg = 1 - (1 - G)^2), so no pair touches while the entrance converges.
  const pr = G * Math.max(0, 1 - ax), c = Math.max(-1, Math.min(1, 2 * x)), Gg = 1 - (1 - G) * (1 - G);
  const X = x * k.pitch + c * (k.gap * Gg + p.posterGap * (1 - Gg));
  const Z = p.lift * pr - G * p.kz * Math.min(ax, 3);
  const yaw = (-p.fan * c * (1 - pr) + p.yawFront * pr + fx.yaw * pr) * D2R;
  const lean = p.leanFront * pr * D2R;
  const sc = 1 + (p.S - 1) * pr;
  _e.set(fx.tilt * pr * D2R, yaw, lean, 'YXZ');
  _q.setFromEuler(_e);
  out.compose(_v.set(X, 0, Z), _q, _s.set(sc, sc, sc));
  return pr;
}

/** The page camera at distance D: 4 degrees below and 4 to the left of the line, looking at the front slot, rolled -8. */
export function cameraAt(W: number, H: number, D: number, p: LineupParams, roll = true, cam = new PerspectiveCamera()): PerspectiveCamera {
  cam.fov = p.fov; cam.aspect = W / H; cam.near = 0.01; cam.far = 100;
  const phi = p.phi * D2R, psi = p.psi * D2R;
  cam.position.set(-D * Math.cos(phi) * Math.sin(psi), -D * Math.sin(phi), D * Math.cos(phi) * Math.cos(psi));
  cam.up.set(0, 1, 0);
  cam.rotation.set(0, 0, 0);
  cam.lookAt(0, 0, 0);
  if (roll) cam.rotateZ(p.rho * D2R);
  cam.clearViewOffset();
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}

export interface Box2 { i: number; p: number; x0: number; x1: number; y0: number; y1: number; h: number; wpx: number; cx: number }
const CORNERS = (p: LineupParams) => { const r: Vector3[] = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) r.push(new Vector3(sx * p.w / 2, sy * 0.5, sz * p.d / 2)); return r; };
/** Screen boxes (CSS px, stage coordinates) of the 24 cases' bounding boxes for selection s and promotion G. */
export function screenBoxes(cam: PerspectiveCamera, W: number, H: number, s: number, G: number, p: LineupParams, k: Derived, shiftY = 0): Box2[] {
  const m = new Matrix4(), v = new Vector3(), res: Box2[] = [], corners = CORNERS(p);
  for (let i = 0; i < 24; i++) {
    const pr = pose(i, s, G, p, k, m);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const c of corners) {
      v.copy(c).applyMatrix4(m).project(cam);
      const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H + shiftY;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    res.push({ i, p: pr, x0, x1, y0, y1, h: y1 - y0, wpx: x1 - x0, cx: (x0 + x1) / 2 });
  }
  return res;
}

/** Pixels per world unit at the target (the world origin) for a camera at distance D. */
export const pxuAt = (H: number, D: number, p: LineupParams) => (H / 2) / (D * Math.tan(p.fov / 2 * D2R));

export type Layout = 'phone' | 'wide';
export interface Framing { D: number; pxu: number; shiftY: number; caseTop: number; caseBottom: number }

/**
 * The camera rule by layout class (2.5): the phone keeps 170 px per unit, shrinking only when the case column would not
 * fit the stage height minus 24 px (landscape phones); the wide layout makes the front case 0.385 of the stage height
 * (240 to 340 px). Vertical framing: the column centred on the phone, the lowest case pixel 16 px above the HUD band
 * on the wide layout, over every selection from 01 to 24 in half steps. shiftY goes to camera.setViewOffset.
 */
export function solveFraming(W: number, H: number, layout: Layout, p: LineupParams = LINEUP): Framing {
  const k = derive(p);
  const inView = (b: Box2) => b.x1 > 0 && b.x0 < W;
  const column = (D: number) => {
    const c = cameraAt(W, H, D, p);
    let lo = 1e9, hi = -1e9;
    for (let s = 0; s <= 23; s += 0.5) for (const b of screenBoxes(c, W, H, s, 1, p, k)) if (inView(b)) { lo = Math.min(lo, b.y0); hi = Math.max(hi, b.y1); }
    return { lo, hi };
  };
  let D: number;
  if (layout === 'phone') {
    let pxu = p.pxuPhone;
    D = (H / 2) / (pxu * Math.tan(p.fov / 2 * D2R));
    for (let it = 0; it < 6; it++) {
      const { lo, hi } = column(D);
      const col = hi - lo;
      if (col <= H - 24 + 0.5) break;
      pxu = pxu * (H - 24) / col;
      D = (H / 2) / (pxu * Math.tan(p.fov / 2 * D2R));
    }
  } else {
    const target = Math.min(p.frontMax, Math.max(p.frontMin, p.frontFrac * H));
    let lo = 1, hi = 60;
    for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2; const b = screenBoxes(cameraAt(W, H, mid, p), W, H, 11, 1, p, k)[11]; if (b.h > target) lo = mid; else hi = mid; }
    D = (lo + hi) / 2;
  }
  const { lo: highest, hi: lowest } = column(D);
  const shiftY = layout === 'phone' ? (H / 2 - (lowest + highest) / 2) : (H - p.hudBand - 16) - lowest;
  return { D, pxu: pxuAt(H, D, p), shiftY, caseTop: highest + shiftY, caseBottom: lowest + shiftY };
}

/** The stage size the spec gives a viewport (2.3, 2.4, 2.8); the page measures its real stage box instead. */
export function stageFor(vw: number, vh: number): { W: number; H: number; layout: Layout } {
  if (vw >= 900 && vh >= 600) return { W: vw, H: Math.min(900, Math.max(480, vh - 72)), layout: 'wide' };
  return { W: vw, H: Math.min(Math.min(520, Math.max(320, vh - 394)), Math.max(220, vh - 128)), layout: 'phone' };
}
