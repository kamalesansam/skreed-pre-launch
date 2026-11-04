// The family page's geometry in Node (docs/specs/family-page.md 19 to 21 and 24): ciao's carousel pose and its fit per
// layout, the skeleton, the scroll map (no text on the landing screen, the zoom without text, one beat at a time), the
// beat pose (the half turn at every transition, unchanged by round 6) and the case type each frame asks for (24 D3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CASE_REST, CASE_TYPES, CFG, RZ, WAVE_EDGES, rollShare, DIMS_DEFAULT, HANDOVERS, SV, SWEEP_LEN, TURNS, TURN_LEN, activeBeat, beatPose, caseBox, caseTargetAt, poseOf, turnEnd, profileLightOffset, project, scrollClasses, skeletonPolys, solve, xform } from '../../src/scripts/family/three/pose.ts';

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

test('the scroll map: nothing but the chrome on the landing screen, no beat text in the zoom (the cue\'s words aside, family-page.md 25), one case type at a time, the argument from 5.6', () => {
  assert.equal(activeBeat(0), 'none');
  assert.equal(activeBeat(0.5), 'none');
  assert.equal(activeBeat(1), 'z');
  assert.equal(activeBeat(1.5), 'z');
  assert.equal(activeBeat(1.7), '1');
  assert.equal(activeBeat(2.5), '1');
  // each next type's text at its sweep's half, as the wave's band crosses the case's middle (2026-11-04; at the hand-over before)
  assert.equal(activeBeat(2.89), '1');
  assert.equal(activeBeat(2.9), '2');
  assert.equal(activeBeat(3.5), '2');
  assert.equal(activeBeat(3.89), '2');
  assert.equal(activeBeat(3.9), '3');
  assert.equal(activeBeat(4.5), '3');
  assert.equal(activeBeat(4.9), '4');
  assert.equal(activeBeat(5.5), '4');
  for (let i = 160; i < 560; i++) { const sv = i / 100, want = sv >= 4.9 ? '4' : sv >= 3.9 ? '3' : sv >= 2.9 ? '2' : '1'; assert.equal(activeBeat(sv), want, `sv ${sv}`); }
  // reduced motion: the stage changes the case at the hand-over with no sweep, so the text changes there too
  assert.equal(activeBeat(2.79, true), '1'); assert.equal(activeBeat(2.8, true), '2'); assert.equal(activeBeat(3.8, true), '3'); assert.equal(activeBeat(4.8, true), '4');
  assert.equal(activeBeat(5.7), 'none');
  assert.equal(activeBeat(7), 'none');
  const rest = scrollClasses(0);
  assert.deepEqual(rest, { hudOff: false, beatsOn: false, tintOn: false, argOn: false });
  assert.deepEqual(scrollClasses(1.5), { hudOff: true, beatsOn: false, tintOn: true, argOn: false });
  assert.deepEqual(scrollClasses(3), { hudOff: true, beatsOn: true, tintOn: true, argOn: false });
  assert.deepEqual(scrollClasses(6.5), { hudOff: true, beatsOn: false, tintOn: false, argOn: true });
  assert.equal(SV.screens, 7);
});

test('the beat pose: the zoom blends over 1 to 2, the case at one height through the four beats (2026-11-04) with the alternating roll, the argument pose over 5 to 6', () => {
  assert.equal(beatPose(1).k, 0);
  assert.equal(beatPose(2).k, 1);
  assert.equal(+beatPose(2).cy.toFixed(2), -0.96);
  // every beat at beat 1's height (Sam, 2026-11-04: "make sure it stays in the center"; ciao's -0.58, 0.02, 0.6 until then)
  for (let sv = 2; sv <= 5.0001; sv += 0.05) assert.equal(+beatPose(sv).cy.toFixed(6), -0.96, `the height at ${sv.toFixed(2)}`);
  assert.equal(+beatPose(3).rz.toFixed(4), 0.0873);
  assert.equal(+beatPose(4).rz.toFixed(4), -0.1745);
  assert.equal(beatPose(5).A, 0);
  assert.equal(beatPose(6).A, 1);
  assert.equal(beatPose(6.5).A, 1);
});

test('no turn since 2026-11-04 ("just remove the rotation animation for case types, just keep the wave"): the case faces the camera through every hand-over; the hand-overs keep their places', () => {
  assert.deepEqual([TURN_LEN, SWEEP_LEN], [0.4, 0.2]);
  assert.deepEqual(TURNS.map(turnEnd), [2, 2.8, 3.8, 4.8], 'the hand-overs, a sweep before each beat');
  for (let sv = 0; sv < 7; sv += 0.01) assert.equal(beatPose(sv).yaw, 0, `no yaw at ${sv.toFixed(2)}`);
});
test('24 D3: the case type each frame asks for, every 0.01 screen: Tough below 2.8 and on the carousel, MagTough from 2.8, Snap from 3.8, Armor from 4.8 through the argument screen', () => {
  assert.deepEqual([...CASE_TYPES], ['tough', 'magtough', 'snap', 'armor']);
  assert.deepEqual([...HANDOVERS], [2.8, 3.8, 4.8]);
  for (let i = 0; i <= 750; i++) {
    const sv = i / 100;
    const want = sv >= 4.8 ? 'armor' : sv >= 3.8 ? 'snap' : sv >= 2.8 ? 'magtough' : 'tough';
    assert.equal(caseTargetAt(sv), want, `sv ${sv.toFixed(2)}`);
  }
  for (const [h, before, after] of [[2.8, 'tough', 'magtough'], [3.8, 'magtough', 'snap'], [4.8, 'snap', 'armor']] as const) {
    assert.equal(caseTargetAt(h - 1e-6), before);
    assert.equal(caseTargetAt(h), after);
    assert.equal(beatPose(h).yaw, 0, `the hand-over at ${h} is the whole turn's end, the case facing the camera`);
    // the whole turn before it shows the outgoing type alone: the turn never changes the model (D15)
    for (let t = h - TURN_LEN; t < h; t += 0.01) assert.equal(caseTargetAt(t), before, `the turn at ${t.toFixed(2)} keeps ${before}`);
  }
  // the zoom at 0 is the carousel, the Tough's alone; the turn into Tough changes no model
  for (const sv of [0, 0.5, 1]) { assert.equal(beatPose(sv).k, 0); assert.equal(caseTargetAt(sv), 'tough'); }
  assert.equal(caseTargetAt(1.85), 'tough');
  assert.equal(caseTargetAt(6.5), 'armor', 'the argument screen shows the last type');
  // each type rests at its beat, where the turn's yaw is 0 and its sweep has ended
  assert.deepEqual(CASE_REST, { tough: 2, magtough: 3, snap: 4, armor: 5 });
  for (const t of CASE_TYPES) { assert.equal(beatPose(CASE_REST[t]).yaw, 0); assert.equal(beatPose(CASE_REST[t]).k, 1); assert.equal(caseTargetAt(CASE_REST[t]), t); }
});

test('the profile light rides with the case (section 24 D13): the zoom lit as ciao\'s on phones, the wide layout\'s damped drift made up, and from beat 1 on every type in the pool as the Tough', () => {
  const caseY = (sv: number, drift: number, poseY: number) => { const B = beatPose(sv); return poseY * (1 - B.k) + B.cy * B.k * drift; };
  const ciaoY = (sv: number, poseY: number) => caseY(sv, 1, poseY);
  for (const drift of [1, CFG.wideDrift]) for (const sv of [0, 0.6, 0.99]) assert.ok(Math.abs(profileLightOffset(sv, drift)) < 1e-12, `the carousel at ${sv}: no lift`);
  for (const sv of [1, 1.25, 1.5, 1.75, 1.99]) assert.ok(Math.abs(profileLightOffset(sv, 1)) < 1e-12, `phones, the zoom at ${sv}: the light where ciao's had it`);
  for (const drift of [1, CFG.wideDrift]) {
    for (const sv of [1, 1.3, 1.6, 1.9]) assert.ok(Math.abs((caseY(sv, drift, 0.7) - profileLightOffset(sv, drift)) - ciaoY(sv, 0.7)) < 1e-12, `the zoom at ${sv}, drift ${drift}: the case under the light as ciao's`);
    for (let sv = 2; sv <= 5.0001; sv += 0.05) assert.ok(Math.abs((caseY(sv, drift, 0.7) - profileLightOffset(sv, drift)) - (-0.96)) < 1e-12, `from beat 1 at ${sv.toFixed(2)}, drift ${drift}: the case under the light as the Tough at beat 1`);
    assert.ok(Math.abs(profileLightOffset(2 - 1e-9, drift) - profileLightOffset(2, drift)) < 1e-6, 'continuous at beat 1');
  }
  assert.ok([3, 4, 5].every((sv) => Math.abs(profileLightOffset(sv, 1)) < 1e-12), 'phones: beats 2 to 4 at beat 1\'s height, so no lift (2026-11-04)');
  assert.ok(Math.abs(profileLightOffset(2, CFG.wideDrift) - 0.96 * (1 - CFG.wideDrift)) < 1e-12, 'wide: beat 1 lifted by what the damped drift left');
});

test('the roll between two case types rides the wave: still until the band meets the case, a smootherstep of the band\'s place across it, settled once it has left (2026-11-04: "smoothen it and end of the turn should look smoother")', () => {
  const [E0, E1] = WAVE_EDGES;
  for (const j of [2, 3, 4]) {
    for (let sv = j; sv <= j + 0.8 + 1e-9; sv += 0.05) assert.equal(rollShare(sv, j), 0, `no roll before the wave at ${sv.toFixed(2)}`);
    assert.equal(beatPose(j + 0.5).rz, RZ[j - 1], `the previous type's roll mid-screen at ${j + 0.5}`);
    assert.equal(rollShare(j + 1, j), 1);
    // in the wave's time (the band's eased place linear in time) the roll's speed is zero at both ends and smooth between
    const at = (u: number) => { const e = E0 + (E1 - E0) * u; let lo = 0, hi = 1; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; const x = m < 0.5 ? 4 * m ** 3 : 1 - (2 - 2 * m) ** 3 / 2; if (x < e) lo = m; else hi = m; } return rollShare(j + 0.8 + 0.2 * (lo + hi) / 2, j); };
    const h = 1e-4;
    assert.ok(Math.abs((at(h) - at(0)) / h) < 1e-2, 'no speed as the band meets the case');
    assert.ok(Math.abs((at(1) - at(1 - h)) / h) < 1e-2, 'no speed as the band leaves it: the end eases in');
    let prev = 0, maxStep = 0;
    for (let i = 1; i <= 100; i++) { const v = at(i / 100); assert.ok(v >= prev - 1e-9, 'one way'); maxStep = Math.max(maxStep, v - prev); prev = v; }
    assert.ok(maxStep < 0.02, `no jump: the largest step in a hundredth of the wave ${maxStep}`);
  }
});
