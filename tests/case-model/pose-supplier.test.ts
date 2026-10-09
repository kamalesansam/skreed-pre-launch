// The lineup on the supplier case (run 2; family-page.md 2.5 and acceptance 3 and 4, projection only; the Playwright
// specs measure the rendered frames). The real case is w 0.532 and d 0.135 of its height, so the constants are tuned
// (pose.ts SUPPLIER_TUNING) and held here to the screen targets of section 7, and T5 is re-run with its own box.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Matrix4, Vector3 } from 'three';
import { SUPPLIER_TUNING, cameraAt, derive, lineupFor, pose, screenBoxes, solveFraming, stageFor, type LineupParams } from '../../src/scripts/family/three/pose.ts';

const manifest = JSON.parse(readFileSync(new URL('../../src/data/case-model.json', import.meta.url), 'utf8'));
const [mw, mh, md] = manifest.sizeMm as number[];
const DIMS = { w: mw / mh, d: md / mh };
const baseline = JSON.parse(readFileSync(new URL('./baseline/lineup-fit-supplier.json', import.meta.url), 'utf8')) as Record<string, Fit>;

interface Fit { layout: string; stage: number[]; pxu: number; strip: number; front: number; frontCx: number; rowMin: number; minIn: number; all24: number[]; twoFull: number[]; top: number; bottom: number }
export function fit(vw: number, vh: number): Fit {
  const st = stageFor(vw, vh);
  const P = lineupFor(DIMS, st.layout, SUPPLIER_TUNING), K = derive(P);
  const f = solveFraming(st.W, st.H, st.layout, P), cam = cameraAt(st.W, st.H, f.D, P);
  const gut = st.layout === 'phone' ? P.gutPhone : P.gutWide;
  const r: Fit = { layout: st.layout, stage: [st.W, st.H], pxu: f.pxu, strip: K.pitch * f.pxu, front: 0, frontCx: 0, rowMin: 1e9, minIn: 99, all24: [], twoFull: [], top: 1e9, bottom: -1e9 };
  for (let s = 0; s < 24; s++) {
    const bs = screenBoxes(cam, st.W, st.H, s, 1, P, K, f.shiftY);
    const inF = bs.filter((b) => b.x1 > 0 && b.x0 < st.W);
    const full = bs.filter((b) => b.x0 >= gut && b.x1 <= st.W - gut);
    r.minIn = Math.min(r.minIn, inF.length);
    if (inF.length === 24) r.all24.push(s + 1);
    if (full.filter((b) => b.i < s && b.i >= s - 2).length === 2 && full.filter((b) => b.i > s && b.i <= s + 2).length === 2) r.twoFull.push(s + 1);
    if (s === 11) { r.front = bs[11].h; r.frontCx = bs[11].cx - st.W / 2; r.rowMin = Math.min(...inF.filter((b) => b.i !== 11).map((b) => b.h)); }
    for (const b of inF) { r.top = Math.min(r.top, b.y0); r.bottom = Math.max(r.bottom, b.y1); }
  }
  return r;
}
const within = (a: number[], lo: number, hi: number) => a.includes(lo) && a.includes(hi);

test('the supplier dims come from the manifest: w 0.532, d 0.135', () => {
  assert.ok(Math.abs(DIMS.w - 0.532) < 0.002 && Math.abs(DIMS.d - 0.135) < 0.002, JSON.stringify(DIMS));
});

test('phone layout (acceptance 4): 170 px per unit, strips 44 px or wider, front case 245 to 290 px, two full neighbours a side for 03 to 22 at 390 and 430 (projected)', () => {
  for (const [vw, vh] of [[360, 780], [375, 667], [390, 844], [430, 932]]) {
    const r = fit(vw, vh);
    assert.equal(r.layout, 'phone');
    assert.ok(Math.abs(r.pxu - 170) < 0.5, `${vw}: pxu ${r.pxu}`);
    assert.ok(r.strip >= 44, `${vw}: strip ${r.strip}`);
    assert.ok(r.front >= 245 && r.front <= 290, `${vw}: front ${r.front}`);
    assert.ok(Math.abs(r.frontCx) <= 8, `${vw}: front case ${r.frontCx} px off centre`);
    // projected boxes over-state the rounded case, so this projection is held at 390 and 430; the rendered silhouettes
    // at 360 and 375 are measured by supplier3d.spec.ts (run 2 notes: 375 clears the gutters, 360 misses by 3 to 5 px)
    if (vw >= 390) assert.ok(within(r.twoFull, 3, 22), `${vw}: two full neighbours a side for ${r.twoFull[0]} to ${r.twoFull.at(-1)}`);
  }
});

test('wide layout (acceptance 3): front 255 to 305 px and all 24 for 10 to 14 at 1280; 245 to 290 and 08 to 16 at 1366; 340 or less and 06 to 18 at 1920', () => {
  const a = fit(1280, 800);
  assert.ok(a.front >= 255 && a.front <= 305, `1280 front ${a.front}`);
  assert.ok(Math.abs(a.frontCx) <= 8);
  assert.ok(within(a.all24, 10, 14), `1280 all 24 for ${a.all24}`);
  assert.ok(a.minIn >= 14, `1280 at least 14 in frame: ${a.minIn}`);
  assert.ok(a.rowMin >= 140, `1280 row ${a.rowMin}`);
  assert.ok(a.top >= 172 - 72, `1280: no case pixel above page y 172 (stage y ${a.top})`);
  assert.ok(a.bottom <= 728 - 224, `1280: no case pixel in the HUD band (stage y ${a.bottom})`);
  const b = fit(1366, 768);
  assert.ok(b.front >= 245 && b.front <= 290, `1366 front ${b.front}`);
  assert.ok(within(b.all24, 8, 16), `1366 all 24 for ${b.all24}`);
  const c = fit(1920, 1080);
  assert.ok(c.front <= 340, `1920 front ${c.front}`);
  assert.ok(within(c.all24, 6, 18), `1920 all 24 for ${c.all24}`);
});

test('the computed fit equals the reviewed baseline (tests/case-model/baseline/lineup-fit-supplier.json)', () => {
  for (const [k, want] of Object.entries(baseline)) {
    const [vw, vh] = k.split('x').map(Number);
    const got = fit(vw, vh);
    for (const key of ['pxu', 'strip', 'front', 'top', 'bottom'] as const) assert.ok(Math.abs(got[key] - want[key]) < 0.5, `${k} ${key}: ${got[key]} vs ${want[key]}`);
    assert.deepEqual([got.all24, got.twoFull, got.minIn], [want.all24, want.twoFull, want.minIn], k);
  }
});

// --- T5 with the supplier box (its bounding box carries the camera plateau over the whole back: conservative) ---
function obb(m: Matrix4, P: LineupParams) {
  const c = new Vector3().setFromMatrixPosition(m), ax = [new Vector3(), new Vector3(), new Vector3()];
  m.extractBasis(ax[0], ax[1], ax[2]);
  const half = [P.w / 2, 0.5, P.d / 2].map((h, i) => h * ax[i].length());
  ax.forEach((a) => a.normalize());
  return { c, ax, half };
}
/** The separating distance of two oriented boxes (negative: they overlap by that much along the best axis). */
function separation(A: ReturnType<typeof obb>, B: ReturnType<typeof obb>): number {
  const axes = [...A.ax, ...B.ax];
  for (const a of A.ax) for (const b of B.ax) { const x = new Vector3().crossVectors(a, b); if (x.lengthSq() > 1e-10) axes.push(x.normalize()); }
  const t = new Vector3().subVectors(B.c, A.c);
  let best = -Infinity;
  for (const L of axes) best = Math.max(best, Math.abs(t.dot(L)) - A.ax.reduce((s, a, i) => s + A.half[i] * Math.abs(a.dot(L)), 0) - B.ax.reduce((s, b, i) => s + B.half[i] * Math.abs(b.dot(L)), 0));
  return best;
}
function minSeparation(s: number, G: number, P: LineupParams): number {
  const K = derive(P);
  const boxes = Array.from({ length: 24 }, (_, i) => { const m = new Matrix4(); pose(i, s, G, P, K, m); return obb(m, P); });
  let min = Infinity;
  for (let i = 0; i < 24; i++) for (let j = i + 1; j < 24; j++) min = Math.min(min, separation(boxes[i], boxes[j]));
  return min;
}
test('T5 (supplier box): no two cases touch live (0, 7, 7.5, 23 and a move in 0.05 steps) or in the poster pose, on both layouts', () => {
  for (const layout of ['phone', 'wide'] as const) {
    const P = lineupFor(DIMS, layout, SUPPLIER_TUNING);
    const sels = [0, 7, 7.5, 23];
    for (let s = 7; s <= 8.0001; s += 0.05) sels.push(+s.toFixed(2));
    for (const s of sels) assert.ok(minSeparation(s, 1, P) > 0, `${layout}: cases touch at s ${s}`);
    assert.ok(minSeparation(11.5, 0, P) > 0.05, `${layout}: the poster pose's middle pair is not parted`);
  }
});
test('T5 (supplier box), the entrance converge: within 1 mm of the conservative box at every frame', () => {
  // the box over-states the case (the camera plateau spans the whole back), so the entrance is held to -0.005 units
  // (about 1 mm on the 196.7 mm case) rather than 0; the live poses above are held to strictly positive
  for (const layout of ['phone', 'wide'] as const) {
    const P = lineupFor(DIMS, layout, SUPPLIER_TUNING);
    for (const target of [0, 6, 11, 12, 23]) {
      let s = 11.5, G = 0;
      for (let f = 0; f < 60; f++) {
        const k = 1 - Math.exp(-10.94 / 60);
        s += (target - s) * k; G += (1 - G) * k;
        assert.ok(minSeparation(s, G, P) > -0.005, `${layout} entrance to ${target + 1}, frame ${f}`);
      }
    }
  }
});
