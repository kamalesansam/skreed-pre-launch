// The family page's geometry in Node (docs/specs/family-page.md 19 to 21): ciao's carousel pose and its fit per layout,
// the skeleton, the scroll map (no text on the landing screen, the zoom without text, one beat at a time), the beat
// pose (the half turn at every transition, the hand-over at the edge-on frame) and the one-case-type-per-frame rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CFG, DIMS_DEFAULT, SV, SWAP, TURNS, TURN_LEN, activeBeat, beatPose, caseBox, caseTypeAt, edgeOn, poseOf, project, scrollClasses, skeletonPolys, solve, xform } from '../../src/scripts/family/three/pose.ts';

const manifest = JSON.parse(readFileSync(new URL('../../src/data/case-model.json', import.meta.url), 'utf8'));
const [mw, mh, md] = manifest.sizeMm as number[];
const DIMS = { w: mw / mh, d: md / mh };

test('the default dims are the manifest case: w 0.532, d 0.135 of its height', () => {
  assert.ok(Math.abs(DIMS.w - DIMS_DEFAULT.w) < 0.002 && Math.abs(DIMS.d - DIMS_DEFAULT.d) < 0.002, JSON.stringify(DIMS));
});

test("ciao's carousel: the front slot at the origin's depth, slots 3.5 units apart on a sine wave, 20 degrees back, leaned 11.25, spun against the turn", () => {
  const p0 = poseOf(0, 0, 1280);
  assert.deepEqual([p0.X, p0.Y, p0.Z].map((v) => +v.toFixed(3)), [0, 0, -0.2]);
  assert.equal(+(p0.rx / (Math.PI / 180)).toFixed(2), -20);
  assert.equal(+(p0.rz / (Math.PI / 180)).toFixed(2), 11.25);
  assert.equal(p0.sc, CFG.cs);
  const p1 = poseOf(1, 0, 1280);
  assert.equal(+p1.X.toFixed(3), 3.5);
  assert.equal(+p1.Z.toFixed(3), -3.7);
  assert.equal(+p1.spin.toFixed(4), +(-3.5 * 0.5).toFixed(4));
  // a point on the case's long axis stays on it through the pose
  const top = xform(p0, [0, 0.5, 0]), bottom = xform(p0, [0, -0.5, 0]);
  assert.ok(Math.abs(Math.hypot(top[0] - bottom[0], top[1] - bottom[1], top[2] - bottom[2]) - CFG.cs) < 1e-9);
});

test('the fit: the front case centred, 400 to 480 px tall at 390 (lifted between the title and the controls) and 400 to 440 px at 1280 x 800', () => {
  const phone = solve(390, 844, 'phone', DIMS);
  assert.ok(phone.shiftY < 0, 'the phone scene is lifted');
  const fh = phone.caseBottom - phone.caseTop;
  assert.ok(fh >= 400 && fh <= 480, `front case ${fh} px at 390`);
  assert.ok(phone.caseTop >= CFG.phoneTop - 1, `the case top ${phone.caseTop} is under the title band`);
  assert.ok(phone.caseBottom <= 844 - CFG.phoneBottom + 1, `the case bottom ${phone.caseBottom} is above the controls`);
  const wide = solve(1280, 800, 'wide', DIMS);
  assert.equal(wide.shiftY, 0);
  const wh = wide.caseBottom - wide.caseTop;
  assert.ok(wh >= 400 && wh <= 440, `front case ${wh} px at 1280`);
  assert.ok(Math.abs(wide.caseY - 400) < 12, `centred: ${wide.caseY}`);
  const [cx] = project(xform(poseOf(0, 0, 1280), [0, 0, 0]), 1280, 800, 0);
  assert.ok(Math.abs(cx - 640) < 1);
  assert.equal(wide.stripPx, 175);
  for (const [w, h] of [[360, 780], [430, 932], [375, 667]] as const) {
    const f = solve(w, h, 'phone', DIMS);
    assert.ok(f.caseTop >= CFG.phoneTop - 1 || f.caseBottom - f.caseTop > h - CFG.phoneTop - CFG.phoneBottom, `${w}x${h} top ${f.caseTop}`);
    const [cx] = project(xform(poseOf(0, 0, w), [0, 0, 0]), w, h, f.shiftY);
    assert.ok(Math.abs(cx - w / 2) < 1, `${w}: centred`);
    assert.ok(caseBox(w, h, 0, 0, f.shiftY, DIMS).x0 > 0, `${w}: the front case inside the screen`);
  }
});

test('the skeleton: the silhouettes of the cases in frame, five at 1280 and two at 390, every point inside the stage plus a margin', () => {
  const wide = skeletonPolys(1280, 800, 'wide', DIMS, 0), phone = skeletonPolys(390, 844, 'phone', DIMS, 0);
  assert.ok(wide.length >= 4 && wide.length <= 8, `wide ${wide.length}`);
  assert.ok(phone.length >= 2 && phone.length <= 4, `phone ${phone.length}`);
  for (const poly of wide) for (const pt of poly.split(' ')) { const [x, y] = pt.split(',').map(Number); assert.ok(x > -400 && x < 1680 && y > -200 && y < 1000, pt); }
  assert.notEqual(skeletonPolys(1280, 800, 'wide', DIMS, 5).join(), wide.join(), 'the selection moves the line');
});

test('the scroll map: nothing but the chrome on the landing screen, no text in the zoom, one case type at a time, the argument from 5.6', () => {
  assert.equal(activeBeat(0), 'none');
  assert.equal(activeBeat(0.5), 'none');
  assert.equal(activeBeat(1), 'z');
  assert.equal(activeBeat(1.5), 'z');
  assert.equal(activeBeat(1.7), '1');
  assert.equal(activeBeat(2.5), '1');
  assert.equal(activeBeat(2.7), '2');
  assert.equal(activeBeat(3.5), '2');
  assert.equal(activeBeat(4.5), '3');
  assert.equal(activeBeat(5.5), '4');
  assert.equal(activeBeat(5.7), 'none');
  assert.equal(activeBeat(7), 'none');
  const rest = scrollClasses(0);
  assert.deepEqual(rest, { hudOff: false, beatsOn: false, tintOn: false, argOn: false });
  assert.deepEqual(scrollClasses(1.5), { hudOff: true, beatsOn: false, tintOn: true, argOn: false });
  assert.deepEqual(scrollClasses(3), { hudOff: true, beatsOn: true, tintOn: true, argOn: false });
  assert.deepEqual(scrollClasses(6.5), { hudOff: true, beatsOn: false, tintOn: false, argOn: true });
  assert.equal(SV.screens, 7);
});

test('the beat pose: the zoom blends over 1 to 2, the case rises through the four beats with the alternating roll, the argument pose over 5 to 6', () => {
  assert.equal(beatPose(1).k, 0);
  assert.equal(beatPose(2).k, 1);
  assert.equal(+beatPose(2).cy.toFixed(2), -0.96);
  assert.equal(+beatPose(3).cy.toFixed(2), -0.58);
  assert.equal(+beatPose(4).cy.toFixed(2), 0.02);
  assert.equal(+beatPose(5).cy.toFixed(2), 0.6);
  assert.equal(+beatPose(3).rz.toFixed(4), 0.0873);
  assert.equal(+beatPose(4).rz.toFixed(4), -0.1745);
  assert.equal(beatPose(5).A, 0);
  assert.equal(beatPose(6).A, 1);
  assert.equal(beatPose(6.5).A, 1);
});

test('D3: every feature transition is one half turn about the vertical axis, edge-on at its middle, and nothing turns between them', () => {
  for (const n of TURNS) {
    const start = n - TURN_LEN, mid = n - TURN_LEN / 2;
    assert.equal(beatPose(start - 0.01).yaw, 0, `still before ${n}`);
    assert.ok(edgeOn(beatPose(mid).yaw), `edge-on at ${mid}: yaw ${beatPose(mid).yaw}`);
    assert.equal(beatPose(n + 0.01).yaw, 0, `still after ${n}`);
    // the yaw runs through a quarter turn and back the other way, so the back that comes round is the other side's
    assert.ok(beatPose(mid - 0.05).yaw > 0 && beatPose(mid + 0.05).yaw < 0, `the turn flips at ${mid}`);
  }
  assert.ok(edgeOn(beatPose(SWAP).yaw), 'the hand-over frame is edge-on');
  assert.equal(SWAP, TURNS[1] - TURN_LEN / 2);
});

test('one case type per frame: the Tough case up to the first hand-over, the second model from its edge-on frame, the reverse on the way up', () => {
  for (let sv = 0; sv < 7; sv += 0.01) {
    const t = caseTypeAt(sv);
    assert.equal(t, sv >= SWAP ? 'second' : 'tough', `sv ${sv.toFixed(2)}`);
  }
  assert.equal(caseTypeAt(SWAP - 1e-6), 'tough');
  assert.equal(caseTypeAt(SWAP), 'second');
  assert.equal(caseTypeAt(6.99), 'second');
});
