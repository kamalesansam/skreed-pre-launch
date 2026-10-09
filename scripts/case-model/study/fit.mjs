// Projection solver for the family-page lineup (spec stage, computation only, no rendering).
// Pose v2: conveyor (selected slot at stage centre, line slides, no clamp), fanned deck, small depth recession,
// camera below the line looking up, yawed so the right end recedes, rolled so a level line rises to the right.
import * as THREE from 'three';
const D2R = Math.PI / 180;
const P = JSON.parse(process.argv[2] || '{}');
const prm = Object.assign({
  w: 77 / 163, d: 12.3 / 163, fan: 62, yawFront: -15, leanFront: 3, lift: 0.3, S: 1.4, kz: 0.1, pitchK: 0.9,
  fov: 20, phi: 4, psi: 4, rho: -8, pxuPhone: 170, frontFrac: 0.385, frontMin: 240, frontMax: 340,
}, P);
const { w, d } = prm;
const strip = w * Math.cos(prm.fan * D2R) + d * Math.sin(prm.fan * D2R);       // fanned case, projected width
const frontW = w * Math.cos(prm.yawFront * D2R) + d * Math.sin(Math.abs(prm.yawFront) * D2R);
const pitch = prm.pitchK * strip;
const gap = 0.5 * (prm.S * frontW + strip) - pitch + 0.02;                       // front case clear of +-1, plus 0.02 air
function pose(i, s, G, out) {
  const x = i - s, ax = Math.abs(x);
  const p = G * Math.max(0, 1 - ax), c = Math.max(-1, Math.min(1, x));
  const X = x * pitch + c * gap * G;
  const Z = prm.lift * p - G * prm.kz * Math.min(ax, 3);
  const yaw = (-prm.fan * c * (1 - p) + prm.yawFront * p) * D2R;
  const lean = prm.leanFront * p * D2R;
  const sc = 1 + (prm.S - 1) * p;
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, lean, 'YXZ'));
  out.compose(new THREE.Vector3(X, 0, Z), q, new THREE.Vector3(sc, sc, sc));
  return { p };
}
const corners = [];
for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push(new THREE.Vector3(sx * w / 2, sy * 0.5, sz * d / 2));
function camFor(W, H, D, roll) {
  const cam = new THREE.PerspectiveCamera(prm.fov, W / H, 0.01, 100);
  const phi = prm.phi * D2R, psi = prm.psi * D2R;
  cam.position.set(-D * Math.cos(phi) * Math.sin(psi), -D * Math.sin(phi), D * Math.cos(phi) * Math.cos(psi));
  cam.lookAt(0, 0, 0);
  if (roll) cam.rotateZ(prm.rho * D2R);
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  return cam;
}
function boxes(cam, W, H, s, G, shiftY = 0) {
  const m = new THREE.Matrix4(), v = new THREE.Vector3(), res = [];
  for (let i = 0; i < 24; i++) {
    const { p } = pose(i, s, G, m);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const c of corners) { v.copy(c).applyMatrix4(m).project(cam); const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H + shiftY; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
    res.push({ i, p, x0, x1, y0, y1, h: y1 - y0, wpx: x1 - x0, cx: (x0 + x1) / 2 });
  }
  return res;
}
// px per unit at the target (world origin) for a camera at distance D
const pxuAt = (H, D) => (H / 2) / (D * Math.tan(prm.fov / 2 * D2R));
function solve(vw, vh, cls) {
  let W, H, gut, hudBand;
  if (cls === 'phone') { gut = 16; W = vw; H = Math.min(Math.min(520, Math.max(320, vh - 394)), Math.max(220, vh - 128)); hudBand = 0; }
  else { gut = 48; W = vw; H = Math.min(900, Math.max(480, vh - 72)); hudBand = prm.hudBand ?? 224; }
  // scale: phone fixed px per unit; wide: front case height = frontFrac x stage height (clamped)
  let D;
  if (cls === 'phone') {
    // constant scale, reduced only when the case column (measured at that scale) would not fit the stage height minus 24 px
    let pxu = prm.pxuPhone; D = (H / 2) / (pxu * Math.tan(prm.fov / 2 * D2R));
    let lo = 1e9, hi = -1e9; const c0 = camFor(W, H, D, true);
    for (let s = 0; s <= 23; s += 0.5) for (const b of boxes(c0, W, H, s, 1)) if (b.x1 > 0 && b.x0 < W) { lo = Math.min(lo, b.y0); hi = Math.max(hi, b.y1); }
    for (let it = 0; it < 6; it++) { // landscape: shrink until the case column fits the stage height minus 24 px
      let lo2 = 1e9, hi2 = -1e9; const c1 = camFor(W, H, D, true);
      for (let s = 0; s <= 23; s += 0.5) for (const b of boxes(c1, W, H, s, 1)) if (b.x1 > 0 && b.x0 < W) { lo2 = Math.min(lo2, b.y0); hi2 = Math.max(hi2, b.y1); }
      const col = hi2 - lo2; if (col <= H - 24 + 0.5) break;
      pxu = pxu * (H - 24) / col; D = (H / 2) / (pxu * Math.tan(prm.fov / 2 * D2R));
    }
  }
  else {
    const target = Math.min(prm.frontMax, Math.max(prm.frontMin, prm.frontFrac * H));
    let lo = 1, hi = 60; // bisection on D for the front case height (selection 11, live)
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; const b = boxes(camFor(W, H, mid, true), W, H, 11, 1)[11]; if (b.h > target) lo = mid; else hi = mid; }
    D = (lo + hi) / 2;
  }
  const cam = camFor(W, H, D, true);
  // vertical framing: lowest case pixel over all selections (live) sits 12 px above (stage bottom - hudBand)
  let lowest = -1e9, highest = 1e9;
  for (let s = 0; s <= 23; s += 0.5) for (const b of boxes(cam, W, H, s, 1)) if (b.x1 > 0 && b.x0 < W) { lowest = Math.max(lowest, b.y1); highest = Math.min(highest, b.y0); }
  const shiftY = cls === 'phone' ? (H / 2 - (lowest + highest) / 2) : (H - hudBand - 16) - lowest;
  const out = { vw, vh, cls, stage: [W, H], D: +D.toFixed(3), pxu: +pxuAt(H, D).toFixed(1), stripPx: +(pitch * pxuAt(H, D)).toFixed(1), shiftY: +shiftY.toFixed(1), caseTop: +(highest + shiftY).toFixed(1), caseBottom: +(lowest + shiftY).toFixed(1) };
  for (const s of [0, 3, 7, 11, 23]) {
    const bs = boxes(cam, W, H, s, 1, shiftY);
    const inFrame = bs.filter((b) => b.x1 > 0 && b.x0 < W);
    const full = bs.filter((b) => b.x0 >= gut && b.x1 <= W - gut);
    const f = bs[s];
    const n = (k) => bs[s + k] ? Math.round(bs[s + k].wpx) : null;
    out['sel' + (s + 1)] = { inFrame: inFrame.length, fullyIn: full.length, front: [Math.round(f.wpx), Math.round(f.h)], frontCx: Math.round(f.cx), rowH: [Math.round(Math.min(...inFrame.filter((b) => b.i !== s).map((b) => b.h))), Math.round(Math.max(...inFrame.filter((b) => b.i !== s).map((b) => b.h)))], stripsPx: [n(-3), n(-2), n(-1), n(1), n(2), n(3)], fullEachSide: [full.filter((b) => b.i < s).length, full.filter((b) => b.i > s).length] };
  }
  // per-selection summary: slots in frame, fully inside the gutters on each side
  out.perSel = [];
  for (let s = 0; s < 24; s++) { const bs = boxes(cam, W, H, s, 1, shiftY); const inF = bs.filter((b) => b.x1 > 0 && b.x0 < W).length; const full = bs.filter((b) => b.x0 >= gut && b.x1 <= W - gut); out.perSel.push([s + 1, inF, full.filter((b) => b.i < s).length, full.filter((b) => b.i > s).length]); }
  // overlap check without roll (roll is a 2D rotation): front case x-range vs neighbours at selection 11 and 11.5
  const camNR = camFor(W, H, D, false);
  for (const s of [11, 11.5]) {
    const bs = boxes(camNR, W, H, s, 1); const f = bs[Math.round(s)];
    out['overlapPx@' + s] = [Math.round(bs[Math.round(s) - 1].x1 - f.x0), Math.round(f.x1 - bs[Math.round(s) + 1].x0)];
  }
  // poster pose (G 0, s 11.5)
  const pb = boxes(cam, W, H, 11.5, 0, shiftY).filter((b) => b.x1 > 0 && b.x0 < W);
  out.poster = { inFrame: pb.length, h: [Math.round(Math.min(...pb.map((b) => b.h))), Math.round(Math.max(...pb.map((b) => b.h)))] };
  return out;
}
console.log(JSON.stringify({ pitch: +pitch.toFixed(4), gap: +gap.toFixed(4), strip: +strip.toFixed(4) }));
for (const [vw, vh, cls] of [[360, 780, 'phone'], [390, 844, 'phone'], [430, 932, 'phone'], [375, 667, 'phone'], [844, 390, 'phone'], [768, 1024, 'phone'], [1280, 800, 'wide'], [1366, 768, 'wide'], [1440, 900, 'wide'], [1920, 1080, 'wide'], [1024, 768, 'wide']]) console.log(JSON.stringify(solve(vw, vh, cls)));
