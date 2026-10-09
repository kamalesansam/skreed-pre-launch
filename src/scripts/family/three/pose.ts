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
}

/** The spec constants; w and d come from the model's normalised box (the contract case: 77 x 163 x 12.3 mm). */
export const LINEUP: LineupParams = {
  w: 77 / 163, d: 12.3 / 163, fan: 62, yawFront: -15, leanFront: 3, lift: 0.3, S: 1.4, kz: 0.1, pitchK: 0.9,
  fov: 20, phi: 4, psi: 4, rho: -8, pxuPhone: 170, frontFrac: 0.385, frontMin: 240, frontMax: 340, hudBand: 224, gutPhone: 16, gutWide: 48,
};

export interface Derived { strip: number; frontW: number; pitch: number; gap: number }
/** pitch = 0.9 (w cos fan + d sin fan); gap keeps the promoted front case clear of its neighbours plus 0.02 air. */
export function derive(p: LineupParams): Derived {
  const strip = p.w * Math.cos(p.fan * D2R) + p.d * Math.sin(p.fan * D2R);
  const frontW = p.w * Math.cos(p.yawFront * D2R) + p.d * Math.sin(Math.abs(p.yawFront) * D2R);
  const pitch = p.pitchK * strip;
  const gap = 0.5 * (p.S * frontW + strip) - pitch + 0.02;
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
  const pr = G * Math.max(0, 1 - ax), c = Math.max(-1, Math.min(1, 2 * x));
  const X = x * k.pitch + c * k.gap * G;
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
