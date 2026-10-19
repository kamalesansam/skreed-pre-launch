// Section 4's world (docs/specs/section-4-world.md 2 "The ring travel" and "The particle morph", W2 to W4, W8, AC3):
// the ring passes computed from the exported timing fall where the spec puts them; across Tune's ranges every gap is at
// least 0.4 s and the first pass comes after the bubble, or the combination is reported for the integrator's clamp and
// clampEntry makes it pass; the roll is held through the passes and never turns faster than 30 degrees a second; the
// generated rings have the measured proportions, about 2,000 triangles each and the ten key shades in catalog order with
// each ring turned 36 degrees; the landed points stay inside the fill bound; and every scene colour is a key shade by id
// (or Urban Slate, seen only when the garden is withdrawn), with no raw colour in the three scene files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROOM_BAYS } from '../../src/config/room.ts';
import { GLIDE, GLIDE_EASE, S, SCENE_COLOURS, WORLD_DEFAULTS, WORLD_RANGES, WORLD_TUNE_SAFE, clampEntry, cubicBezier, entryProblems, entryTimeline, rollAt, type WorldParams } from '../../src/scripts/hero/section4/world.ts';
import { RING, arcAt, generateRings } from '../../src/scripts/hero/section4/rings.ts';
import { CLOUD, cellGrid, coverScale, landedFill } from '../../src/scripts/hero/section4/cloud.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const P = (o: Partial<WorldParams> = {}): WorldParams => ({ ...WORLD_DEFAULTS, ...o });
const steps = (a: number, b: number, d: number) => { const out: number[] = []; for (let v = a; v <= b + 1e-9; v += d) out.push(+v.toFixed(6)); return out; };
const gaps = (ps: readonly number[]) => ps.slice(1).map((t, k) => t - ps[k]);

test('the ease is igloo\'s cubic-bezier(0.6, 0, 0, 1), and its inverse inverts it', () => {
  assert.deepEqual([...GLIDE.ease], [0.6, 0, 0, 1]);
  for (const u of steps(0, 1, 0.05)) assert.ok(Math.abs(GLIDE_EASE.timeAt(GLIDE_EASE.at(u)) - u) < 1e-6, `${u}`);
  // the evidence's own check (evidence 4): 24 percent of the time covers 10.4 percent of the way, 35 percent 50, 46 percent 78
  assert.ok(Math.abs(GLIDE_EASE.at(0.24) - 0.104) < 0.01 && Math.abs(GLIDE_EASE.at(0.35) - 0.5) < 0.02 && Math.abs(GLIDE_EASE.at(0.46) - 0.78) < 0.02);
  const lin = cubicBezier(0, 0, 1, 1); assert.ok(Math.abs(lin.at(0.3) - 0.3) < 1e-6);
});

test('at the defaults: passes at 2.70, 3.20 and 4.40 s, the morph from 6.35 s at 97 percent of the way, the first land at 9.35 s', () => {
  const tl = entryTimeline(P());
  [2.70, 3.20, 4.40].forEach((t, k) => assert.ok(Math.abs(tl.passes[k] - t) < 0.01, `pass ${k + 1} at ${tl.passes[k]}`));
  assert.ok(gaps(tl.passes).every((g) => g >= 0.5), 'every gap at least 0.5 s at the defaults');
  assert.ok(tl.passes[0] > GLIDE.start + WORLD_DEFAULTS.bubbleMs / 1000, 'the first pass after the bubble has cleared (2.35 s)');
  assert.ok(Math.abs(tl.morph[0] - 6.35) < 1e-9 && Math.abs(GLIDE_EASE.at(GLIDE.morphAt) - 0.973) < 0.002);
  assert.ok(Math.abs(tl.arrive - 9.35) < 1e-9, `${tl.arrive}`);
  assert.deepEqual(entryProblems(P()), []);
  // the path: 0.71 S before ring 1 to 0.5 S past ring 3, the rings S apart, the cloud 2.5 S past the last
  assert.ok(Math.abs(tl.camZ[0] - tl.rings[0] - 0.71 * S) < 1e-9 && Math.abs(tl.rings[2] - tl.camZ[1] - 0.5 * S) < 1e-9);
  assert.ok(gaps(tl.rings).every((d) => Math.abs(d + S) < 1e-9));
  assert.ok(Math.abs(tl.rings[2] - tl.cloudZ - 2.5 * S) < 1e-9);
});

test('the approach pose: ring 1 fills about 116 percent of a laptop frame\'s height, and more than a phone\'s width', () => {
  const half = (fov: number) => Math.tan((fov * Math.PI) / 360);
  const frameH = (zoom: number) => (2 * GLIDE.approach * S * half(GLIDE.fov[0])) / zoom, ring = 2 * RING.outer * S;
  const laptop = ring / frameH(Math.min(1, (1280 / 800) * GLIDE.portrait));
  assert.ok(laptop > 1.1 && laptop < 1.25, `${laptop}`);
  const a = 390 / 844, phoneW = frameH(Math.min(1, a * GLIDE.portrait)) * a;
  assert.ok(ring > phoneW, `${ring} vs ${phoneW}`);
});

test('Tune\'s ranges (bubbleMs 1200 to 3200 at travelMs 8000, ringCount 2 to 5): every gap 0.4 s or more and the first pass after the bubble, or reported and clamped', (t) => {
  const failing: string[] = [];
  for (const ringCount of steps(WORLD_RANGES.ringCount[0], WORLD_RANGES.ringCount[1], 1)) {
    // the spec's line: at the default bubble the first pass is after 0.35 + 2.0 s for every ring count
    assert.ok(entryTimeline(P({ ringCount })).passes[0] > GLIDE.start + 2.0, `ringCount ${ringCount}: first pass before 2.35 s`);
    for (const bubbleMs of steps(WORLD_RANGES.bubbleMs[0], WORLD_RANGES.bubbleMs[1], 10)) {
      const p = P({ ringCount, bubbleMs, travelMs: 8000 }), probs = entryProblems(p).filter((s) => !s.startsWith('roll'));
      if (probs.length) failing.push(`ringCount ${ringCount}, bubbleMs ${bubbleMs}: ${probs.join('; ')}`);
      // whatever fails, clampEntry passes: every gap, the first pass after the bubble, the roll at its rate
      const c = clampEntry(p), tl = entryTimeline(c);
      assert.ok(gaps(tl.passes).every((g) => g >= GLIDE.minGap), `clamped ${JSON.stringify(c)}`);
      assert.ok(tl.passes[0] >= GLIDE.start + c.bubbleMs / 1000, `clamped bubble ${c.bubbleMs}`);
      assert.deepEqual(entryProblems(c), [], JSON.stringify(c));
    }
  }
  // the report for the integrator: the edges of what passes as it stands
  const maxBubble = (n: number) => Math.floor((entryTimeline(P({ ringCount: n })).passes[0] - GLIDE.start) * 100) * 10;
  t.diagnostic(`failing combinations: ${failing.length}; the first per ring count: ${[2, 3, 4, 5].map((n) => failing.find((f) => f.startsWith(`ringCount ${n},`)) ?? `ringCount ${n}: none`).join(' | ')}`);
  t.diagnostic(`bubbleMs passes up to: ${[2, 3, 4, 5].map((n) => `${n} rings ${maxBubble(n)} ms`).join(', ')}; five rings fail the gap at any bubble (${gaps(entryTimeline(P({ ringCount: 5 })).passes).map((g) => g.toFixed(3)).join(', ')} s)`);
  assert.ok(failing.length > 0, 'the spec\'s full ranges hold combinations that fail (the integrator clamps Tune to WORLD_TUNE_SAFE)');
  assert.deepEqual(clampEntry(P()), P(), 'the defaults are untouched by the clamp');
});

test('WORLD_TUNE_SAFE: every combination inside passes as it stands, and one step past each edge fails', () => {
  const [b0, b1] = WORLD_TUNE_SAFE.bubbleMs, [n0, n1] = WORLD_TUNE_SAFE.ringCount, [, r1] = WORLD_TUNE_SAFE.travelRoll;
  for (const ringCount of steps(n0, n1, 1)) for (const bubbleMs of steps(b0, b1, 10)) for (const travelRoll of [0, 15, 30, r1]) assert.deepEqual(entryProblems(P({ ringCount, bubbleMs, travelRoll })), [], `${ringCount} ${bubbleMs} ${travelRoll}`);
  assert.ok(entryProblems(P({ ringCount: n1 + 1 })).some((s) => s.startsWith('gap')), 'one ring more breaks a gap');
  assert.ok(entryProblems(P({ ringCount: n1, bubbleMs: b1 + 10 })).some((s) => s.startsWith('first pass')), 'a longer bubble covers the first pass');
  assert.ok(entryProblems(P({ ringCount: n1, travelRoll: r1 + 1 })).some((s) => s.startsWith('roll')), 'a larger roll cannot come up in time');
  assert.ok(WORLD_DEFAULTS.ringCount >= n0 && WORLD_DEFAULTS.ringCount <= n1 && WORLD_DEFAULTS.bubbleMs >= b0 && WORLD_DEFAULTS.bubbleMs <= b1 && WORLD_DEFAULTS.travelRoll <= r1);
});

test('the glide\'s length (proposed travelMs 6000 to 12000): clampEntry keeps every gap', (t) => {
  const raw: string[] = [];
  for (const travelMs of steps(WORLD_RANGES.travelMs[0], WORLD_RANGES.travelMs[1], 250)) for (const ringCount of [2, 3, 4, 5]) {
    const p = P({ travelMs, ringCount }), g = entryProblems(p).filter((s) => s.startsWith('gap'));
    if (g.length) raw.push(`${travelMs}/${ringCount}`);
    assert.ok(gaps(entryTimeline(clampEntry(p)).passes).every((x) => x >= GLIDE.minGap), `${travelMs} ${ringCount}`);
  }
  t.diagnostic(`travelMs/ringCount failing the gap as they stand: ${raw.join(', ') || 'none'}`);
});

test('the roll: reached before the first pass, held through every pass, unwound after the last, at most 30 degrees a second', () => {
  for (const ringCount of [2, 3, 4, 5]) for (const travelRoll of [0, 10, 30, 45, 90]) {
    const tl = entryTimeline(P({ ringCount, travelRoll })), dt = 0.001;
    assert.ok(Math.abs(tl.roll.max) <= travelRoll + 1e-9);
    let prev = rollAt(0, tl), worst = 0;
    for (let x = dt; x <= tl.arrive; x += dt) { const r = rollAt(x, tl); worst = Math.max(worst, Math.abs(r - prev) / dt); prev = r; }
    assert.ok(worst <= GLIDE.rollRate + 0.05, `${ringCount} rings, ${travelRoll} degrees: ${worst.toFixed(2)} degrees a second`);
    for (const p of tl.passes) assert.ok(Math.abs(rollAt(p, tl) - tl.roll.max) < 1e-9, 'held at a pass');
    assert.ok(Math.abs(rollAt(tl.passes[0] - GLIDE.rollHold, tl) - tl.roll.max) < 1e-9 && Math.abs(rollAt(tl.passes[tl.passes.length - 1] + GLIDE.rollHold, tl) - tl.roll.max) < 1e-9, 'held from just before the first pass to just after the last');
    assert.equal(rollAt(tl.morph[1], tl), 0, 'level by the push');
    assert.equal(rollAt(0, tl), 0);
  }
  assert.equal(entryTimeline(P()).roll.max, 30, 'the default 30 degrees is reached in full');
});

test('the rings (W3): the measured proportions, about 2,000 triangles each, ten arcs in catalog order clockwise, each ring turned 36 degrees, the same for the same seed', () => {
  const zs = entryTimeline(P({ ringCount: 5 })).rings, r = generateRings(20261020, zs, S);
  r.triangles.forEach((n, k) => assert.ok(n >= 1800 && n <= 2400, `ring ${k}: ${n} triangles`));
  assert.deepEqual(generateRings(20261020, zs, S).position, r.position, 'deterministic');
  assert.notDeepEqual(generateRings(7, zs, S).position, r.position, 'the seed matters');
  assert.deepEqual(generateRings(20261020, zs.slice(0, 3), S).triangles, r.triangles.slice(0, 3), 'adding a ring leaves the others as they were');
  // per vertex: the radius and depth inside the proportions, and the shade the one rings.ts's arcAt gives for the angle
  const nv = r.shade.length, seen = zs.map(() => new Set<number>());
  for (let v = 0; v < nv; v++) {
    const x = r.position[v * 3], y = r.position[v * 3 + 1], z = r.position[v * 3 + 2], cz = r.centre[v * 3 + 2], k = zs.findIndex((z0) => Math.abs(z0 - cz) < 1e-5);   // stored as float32
    assert.ok(k >= 0, 'every vertex on a ring');
    const rad = Math.hypot(x, y);
    assert.ok(rad >= RING.inner * S * 0.99 - 1e-6 && rad <= RING.outer * S * 1.025 + 1e-6, `radius ${rad}`);
    assert.ok(Math.abs(z - cz) <= (RING.thickness * S * 1.12) / 2 + 1e-6, 'thickness');
    const cdeg = (Math.atan2(r.centre[v * 3], r.centre[v * 3 + 1]) * 180) / Math.PI;
    assert.equal(r.shade[v], arcAt(k, cdeg), `ring ${k} at ${cdeg.toFixed(1)} degrees`);
    seen[k].add(r.shade[v]);
  }
  seen.forEach((s, k) => assert.equal(s.size, 10, `ring ${k} carries all ten shades`));
  // ring k starts arc 0 (Snow) at 36 k degrees clockwise from the top
  for (let k = 0; k < 5; k++) { assert.equal(arcAt(k, 36 * k + 1), 0); assert.equal(arcAt(k, 36 * k + 37), 1); }
  // most of a ring stays near its place while it is broken (a C-arc of 180 to 240 degrees), the rest is thrown
  const tight = r.fling.filter((_, i) => i % 4 === 0).filter((x) => x < 0.17 * RING.outer * S * 1.4).length / nv;
  assert.ok(tight > 0.4 && tight < 0.75, `${tight}`);
});

test('the points (W8, spec 6): 65,536 and 32,768, landing in a jittered grid of round points whose fill stays under 2.5 screens', () => {
  assert.equal(CLOUD.count, 65536); assert.equal(CLOUD.touchCount, 32768);
  for (const [w, h, dpr, n] of [[390, 844, 1.25, CLOUD.touchCount], [1280, 800, 1.5, CLOUD.count], [844, 390, 1.25, CLOUD.touchCount], [1280, 800, 1, CLOUD.count]] as const) {
    const W = Math.round(w * dpr), H = Math.round(h * dpr), g = cellGrid(n, W, H), fill = landedFill(n, W, H, dpr);
    assert.ok(g.cols * g.rows <= n && g.cols * g.rows > n * 0.97, `${w}: ${g.cols} x ${g.rows}`);
    assert.ok(Math.abs(g.cols / g.rows - W / H) < 0.05 * (W / H), 'square cells');
    assert.ok(fill <= 2.5, `${w} x ${h}: ${fill.toFixed(2)} screens`);
    assert.ok(g.cell * CLOUD.size <= CLOUD.capPx * dpr, 'under the 24 x DPR cap');
  }
  assert.ok(CLOUD.jitter > 0 && CLOUD.jitter < 1, 'jittered inside its cell, never a regular dot grid (rule 43)');
  assert.deepEqual(coverScale(390 / 844, 720 / 1280), [(390 / 844) / (720 / 1280), 1]);
  assert.deepEqual(coverScale(1280 / 800, 1920 / 1200), [1, 1]);
});

test('colours (AC3): every scene colour is a key shade by id, the lattice the next family\'s, and no raw colour in the scene files', () => {
  const ids = ROOM_BAYS.map((b) => b.shade);
  assert.deepEqual(SCENE_COLOURS.rings, ids, 'the rings: the ten key shades in catalog order');
  assert.deepEqual(SCENE_COLOURS.lattice, ids.map((_, i) => ids[(i + 1) % 10]), 'the lattice: the next family\'s');
  assert.deepEqual(SCENE_COLOURS.forcefields, ids); assert.deepEqual(SCENE_COLOURS.cloud, ids);
  // Pearl Whisper is the bubble's and the text's (transition.ts and the DOM); here only Urban Slate, behind a withdrawn garden
  for (const id of Object.values(SCENE_COLOURS).flat()) assert.ok(ids.includes(id) || id === 'urban-slate' || id === 'pearl-whisper', id);
  assert.deepEqual(SCENE_COLOURS.clear, ['urban-slate']);
  for (const f of ['world', 'rings', 'cloud']) {
    const src = read(`src/scripts/hero/section4/${f}.ts`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{6}\b|0x[0-9a-fA-F]{6}\b/, `${f}.ts carries a raw hex colour`);
    for (const m of src.matchAll(/new Color\(([^()]*(?:\([^()]*\))?[^()]*)\)/g)) assert.match(m[1].trim(), /^(|\.\.\.display\(URBAN_SLATE\))$/, `${f}.ts: new Color(${m[1]})`);
    // GLSL: no colour literal (a vector of two or more numbers); broadcast scalars (vec3(2.4) in the sRGB curve) are maths
    for (const m of src.matchAll(/vec[34]\(\s*(-?[\d.]+\s*(?:,\s*-?[\d.]+\s*)+)\)/g)) assert.fail(`${f}.ts: a literal ${m[0]}`);
  }
  // the shades reach the shaders as their hex's own numbers, ROOM_BAYS order (the target is read as sRGB)
  assert.match(read('src/scripts/hero/section4/world.ts'), /new Float32Array\(ROOM_BAYS\.flatMap\(\(b\) => display\(b\.hex\)\)\)/);
});
