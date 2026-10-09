// T5 (case-model-class.md 14; family-page.md 2.5): the page's pose and camera rule equal the study's reference
// (scripts/case-model/study/fit.mjs, baseline tests/case-model/baseline/lineup-fit-standin.jsonl), and no two cases'
// oriented boxes intersect for selections 0, 7, 7.5 and 23 and through one move in steps of 0.05.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Matrix4, Vector3 } from 'three';
import { LINEUP, derive, pose, solveFraming, stageFor, cameraAt, screenBoxes } from '../../src/scripts/family/three/pose.ts';

const lines = readFileSync(new URL('./baseline/lineup-fit-standin.jsonl', import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const head = lines[0] as { pitch: number; gap: number; strip: number };
const rows = lines.slice(1) as { vw: number; vh: number; cls: 'phone' | 'wide'; stage: [number, number]; D: number; pxu: number; stripPx: number; shiftY: number; caseTop: number; caseBottom: number; perSel: number[][]; poster: { inFrame: number } }[];

test('derived constants equal the baseline: pitch 0.2596, gap 0.2377, strip 0.2884', () => {
  const k = derive(LINEUP);
  assert.equal(+k.pitch.toFixed(4), head.pitch);
  assert.equal(+k.gap.toFixed(4), head.gap);
  assert.equal(+k.strip.toFixed(4), head.strip);
});

for (const r of rows) {
  test(`framing at ${r.vw} x ${r.vh} (${r.cls}) equals the baseline`, () => {
    const st = stageFor(r.vw, r.vh);
    assert.deepEqual([st.W, st.H], r.stage);
    assert.equal(st.layout, r.cls);
    const f = solveFraming(st.W, st.H, st.layout);
    assert.ok(Math.abs(f.D - r.D) < 0.002, `D ${f.D} vs ${r.D}`);
    assert.ok(Math.abs(f.pxu - r.pxu) < 0.1, `pxu ${f.pxu} vs ${r.pxu}`);
    assert.ok(Math.abs(f.shiftY - r.shiftY) < 0.1, `shiftY ${f.shiftY} vs ${r.shiftY}`);
    assert.ok(Math.abs(f.caseTop - r.caseTop) < 0.1);
    assert.ok(Math.abs(f.caseBottom - r.caseBottom) < 0.1);
    // per selection: cases in frame and fully inside the gutters on each side
    const k = derive(LINEUP), cam = cameraAt(st.W, st.H, f.D, LINEUP), gut = st.layout === 'phone' ? LINEUP.gutPhone : LINEUP.gutWide;
    for (const [sel1, inF, left, right] of r.perSel) {
      const bs = screenBoxes(cam, st.W, st.H, sel1 - 1, 1, LINEUP, k, f.shiftY);
      const full = bs.filter((b) => b.x0 >= gut && b.x1 <= st.W - gut);
      assert.deepEqual([bs.filter((b) => b.x1 > 0 && b.x0 < st.W).length, full.filter((b) => b.i < sel1 - 1).length, full.filter((b) => b.i > sel1 - 1).length], [inF, left, right], `selection ${sel1}`);
    }
  });
}

// --- oriented boxes: separating axis test in 3D ---
function obb(m: Matrix4) {
  const c = new Vector3().setFromMatrixPosition(m);
  const ax = [new Vector3(), new Vector3(), new Vector3()];
  m.extractBasis(ax[0], ax[1], ax[2]);
  const half = [LINEUP.w / 2, 0.5, LINEUP.d / 2].map((h, i) => h * ax[i].length());
  ax.forEach((a) => a.normalize());
  return { c, ax, half };
}
function intersects(A: ReturnType<typeof obb>, B: ReturnType<typeof obb>): boolean {
  const axes = [...A.ax, ...B.ax];
  for (const a of A.ax) for (const b of B.ax) { const x = new Vector3().crossVectors(a, b); if (x.lengthSq() > 1e-10) axes.push(x.normalize()); }
  const t = new Vector3().subVectors(B.c, A.c);
  for (const L of axes) {
    const ra = A.ax.reduce((s, a, i) => s + A.half[i] * Math.abs(a.dot(L)), 0);
    const rb = B.ax.reduce((s, b, i) => s + B.half[i] * Math.abs(b.dot(L)), 0);
    if (Math.abs(t.dot(L)) > ra + rb) return false;
  }
  return true;
}
test('T5: no two cases intersect at selections 0, 7, 7.5, 23 and through a move in steps of 0.05; the front case is clear', () => {
  const k = derive(LINEUP);
  const sels = [0, 7, 7.5, 23];
  for (let s = 7; s <= 8.0001; s += 0.05) sels.push(+s.toFixed(2));
  for (const s of sels) {
    const boxes = Array.from({ length: 24 }, (_, i) => { const m = new Matrix4(); pose(i, s, 1, LINEUP, k, m); return obb(m); });
    for (let i = 0; i < 24; i++) for (let j = i + 1; j < 24; j++) assert.ok(!intersects(boxes[i], boxes[j]), `cases ${i + 1} and ${j + 1} intersect at s ${s}`);
  }
});
