// Section 4's world (docs/specs/section-4-world.md 2 "The ring travel", "The particle morph" and "Option A", 3
// "Colours", 6, W2 to W4, W8, W13, AC3): the ring passes computed from the exported timing fall where the spec puts them;
// every combination Tune offers (WORLD_RANGES, step by step) has every gap at least 0.4 s, the first pass after the
// bubble and the roll at its rate as it stands, one step past an edge breaks a rule, and Tune's guard only holds values
// to the ranges; the roll is held through the passes and never turns faster than 30 degrees a second; the rings have the
// measured proportions, about 2,000 triangles each and the ten key shades in catalog order with each ring turned 36
// degrees, each vertex at its own arc coordinate, each shard's value within 6 percent; the shades blend round the ring
// (blend.ts): each arc's middle fifth is its own hex, every other sample a blend of the two neighbouring key shades in
// OKLab that never dips toward grey, the weight half and half at a boundary, and no two neighbouring samples differ by
// more than a set OKLab distance (no hard edge); the landed points fade over the push's first 0.25 s on their own layer;
// the garden is placed from garden.json (the cards on their tangent bounds, the plate's band in the decoded image's own
// rows, the sun) and a file without those numbers fails rather than placing at NaN; the glide's zoom keeps every frame
// inside the plate, ultrawide windows included; the phone's GPU memory, colour plus depth, stays under its line; option
// A's stream, replayed on the CPU from its own uniforms, starts and ends on each land's cells for two lands of different
// FOV and push and stays inside the fill bound across the travel; the landed points stay inside it too; every scene colour
// is a key shade by id or a blend of two neighbouring ones (or Urban Slate, seen only when the garden is withdrawn), with
// no raw colour in the scene files; and the hooks and Tune's guard sit behind their build flags.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DataTexture, PerspectiveCamera, Vector3, type Matrix4, type Vector4 } from 'three';
import { ROOM_BAYS } from '../../src/config/room.ts';
import { ENTRY, GARDEN, GLIDE, GLIDE_EASE, LAND_CLIP, S, SCENE_COLOURS, WORLD_DEFAULTS, WORLD_RANGES, bandRows, clampEntry, cubicBezier, entryProblems, entryTimeline, fovAt, frameReach, gardenLayout, glideZoom, pushLayers, rollAt, type EntryTimeline, type GardenJson, type LandView, type WorldParams } from '../../src/scripts/hero/section4/world.ts';
import { RING, arcAt, arcCoord, generateRings } from '../../src/scripts/hero/section4/rings.ts';
import { BLEND, blendAt, chroma, display, mixLab, ringColour, ringRamp, toOklab, type Lab } from '../../src/scripts/hero/section4/blend.ts';
import { CLOUD, cellGrid, coverScale, landedFill } from '../../src/scripts/hero/section4/cloud.ts';
import { STREAM, createStream } from '../../src/scripts/hero/section4/stream.ts';

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

test('Tune\'s ranges (WORLD_RANGES): every combination Tune offers passes as it stands, and one step past an edge breaks a rule', () => {
  const R = WORLD_RANGES, vals = (k: keyof WorldParams) => steps(R[k][0], R[k][1], R[k][2]);
  const ok = (p: WorldParams) => assert.deepEqual(entryProblems(p), [], JSON.stringify(p));
  // the rules only get harder as the bubble lengthens (the first pass must clear it) and as the roll grows (it must come
  // up in time), so for every glide, ring count and morph Tune offers the longest bubble with the largest roll is the
  // hardest case; every bubble and every roll are also walked at the shortest glide and morph, and a coarse full product
  for (const travelMs of vals('travelMs')) for (const ringCount of vals('ringCount')) for (const morphMs of vals('morphMs')) ok(P({ travelMs, ringCount, morphMs, bubbleMs: R.bubbleMs[1], travelRoll: R.travelRoll[1] }));
  for (const ringCount of vals('ringCount')) for (const bubbleMs of vals('bubbleMs')) for (const travelRoll of vals('travelRoll')) ok(P({ travelMs: R.travelMs[0], morphMs: R.morphMs[0], ringCount, bubbleMs, travelRoll }));
  for (const travelMs of steps(R.travelMs[0], R.travelMs[1], 500)) for (const ringCount of vals('ringCount')) for (const morphMs of steps(R.morphMs[0], R.morphMs[1], 500))
    for (const bubbleMs of steps(R.bubbleMs[0], R.bubbleMs[1], 90)) for (const travelRoll of steps(R.travelRoll[0], R.travelRoll[1], 5)) ok(P({ travelMs, ringCount, morphMs, bubbleMs, travelRoll }));
  // enterPushMs and worldBloom change no rule: the push comes after every pass, the bloom is a look
  for (const enterPushMs of vals('enterPushMs')) ok(P({ enterPushMs, ringCount: 4, bubbleMs: R.bubbleMs[1] }));
  // one step past each edge: a fifth ring, a longer bubble, a shorter glide and a larger roll each break a rule somewhere
  const fails = (p: Partial<WorldParams>, what: string) => assert.ok(entryProblems(P(p)).some((s) => s.startsWith(what)), `${JSON.stringify(p)}: ${what}`);
  fails({ ringCount: R.ringCount[1] + 1 }, 'gap');
  fails({ ringCount: 4, bubbleMs: R.bubbleMs[1] + R.bubbleMs[2] }, 'first pass');
  fails({ ringCount: 4, bubbleMs: R.bubbleMs[1], travelMs: R.travelMs[0] - R.travelMs[2] }, 'first pass');
  fails({ ringCount: 4, travelMs: R.travelMs[0], morphMs: R.morphMs[0], travelRoll: R.travelRoll[1] + R.travelRoll[2] }, 'roll');
  // the defaults are inside, on a step
  for (const k of Object.keys(R) as (keyof WorldParams)[]) { const [a, b, d] = R[k]; assert.ok(WORLD_DEFAULTS[k] >= a && WORLD_DEFAULTS[k] <= b && Math.abs(((WORLD_DEFAULTS[k] - a) / d) % 1) < 1e-9, k); }
});

test('Tune\'s guard (clampEntry, Tune builds only): it leaves Tune\'s values as they are inside the ranges, and only holds the rest to them', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  assert.deepEqual(clampEntry(P()), P(), 'the defaults are untouched');
  for (const ringCount of [2, 3, 4]) for (const travelMs of [8000, 12000]) assert.deepEqual(clampEntry(P({ ringCount, travelMs, bubbleMs: 2190, travelRoll: 33 })), P({ ringCount, travelMs, bubbleMs: 2190, travelRoll: 33 }), 'never a ring dropped or the bubble shortened');
  const R = WORLD_RANGES;
  assert.deepEqual(clampEntry(P({ ringCount: 5.4, bubbleMs: 3200, travelMs: 6000, travelRoll: 90, morphMs: 200 })), P({ ringCount: R.ringCount[1], bubbleMs: R.bubbleMs[1], travelMs: R.travelMs[0], travelRoll: R.travelRoll[1], morphMs: R.morphMs[0] }));
  assert.equal(warn.mock.callCount(), 0, 'held to the ranges, nothing breaks, nothing to warn of');
  // the guard and the hooks ship only in Tune and hooks builds (folded away in production)
  const src = read('src/scripts/hero/section4/world.ts');
  assert.match(src, /if \(import\.meta\.env\.PUBLIC_TUNE === '1'\) \{[^\n]*clampEntry\(p\)/);
  assert.match(src, /if \(import\.meta\.env\.PUBLIC_HERO_HOOKS === '1'\) \{\n(?:[^\n]*\n){0,3}\s*api\.hooks = /);
  assert.equal(src.match(/clampEntry\(/g)?.length, 2, 'declared once and called once, behind the Tune flag');
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

test('the rings (W3, W13): the measured proportions, about 2,000 triangles each, ten arcs in catalog order clockwise, each ring turned 36 degrees, each vertex at its own arc coordinate, each shard within 6 percent in value, the same for the same seed', () => {
  const zs = entryTimeline(P({ ringCount: 5 })).rings, r = generateRings(20261020, zs, S);
  r.triangles.forEach((n, k) => assert.ok(n >= 1800 && n <= 2400, `ring ${k}: ${n} triangles`));
  assert.deepEqual(generateRings(20261020, zs, S).position, r.position, 'deterministic');
  assert.notDeepEqual(generateRings(7, zs, S).position, r.position, 'the seed matters');
  assert.deepEqual(generateRings(20261020, zs.slice(0, 3), S).triangles, r.triangles.slice(0, 3), 'adding a ring leaves the others as they were');
  // per vertex: the radius and depth inside the proportions; its arc coordinate its own angle's, inside the arc rings.ts's
  // arcAt gives for its shard's centre (so the blend follows the vertex, not the shard); its seam distance along the arc;
  // its normal of unit length; its shard's value within 6 percent, one value a shard
  const nv = r.tone.length / 3, seen = zs.map(() => new Set<number>()), values = new Map<string, number>();
  for (let v = 0; v < nv; v++) {
    const x = r.position[v * 3], y = r.position[v * 3 + 1], z = r.position[v * 3 + 2], cz = r.centre[v * 3 + 2], k = zs.findIndex((z0) => Math.abs(z0 - cz) < 1e-5);   // stored as float32
    assert.ok(k >= 0, 'every vertex on a ring');
    const rad = Math.hypot(x, y);
    assert.ok(rad >= RING.inner * S * 0.99 - 1e-6 && rad <= RING.outer * S * 1.025 + 1e-6, `radius ${rad}`);
    assert.ok(Math.abs(z - cz) <= (RING.thickness * S * 1.12) / 2 + 1e-6, 'thickness');
    const cdeg = (Math.atan2(r.centre[v * 3], r.centre[v * 3 + 1]) * 180) / Math.PI, vdeg = (Math.atan2(x, y) * 180) / Math.PI;
    const [arc, seam, value] = [r.tone[v * 3], r.tone[v * 3 + 1], r.tone[v * 3 + 2]], j = arcAt(k, cdeg);
    assert.ok(arc >= j && arc <= j + 1, `ring ${k} at ${cdeg.toFixed(1)} degrees: arc coordinate ${arc} outside arc ${j}`);
    const d = Math.abs(arc - arcCoord(k, vdeg)); assert.ok(Math.min(d, 10 - d) < 2e-4, `ring ${k}: arc coordinate ${arc} for a vertex at ${vdeg.toFixed(2)} degrees`);
    assert.ok(seam >= 0 && seam <= ((RING.arcDeg / 2) * Math.PI * rad) / 180, `seam distance ${seam}`);
    assert.ok(Math.abs(Math.hypot(r.normal[v * 3], r.normal[v * 3 + 1], r.normal[v * 3 + 2]) - 1) < 1e-5, 'unit normal');
    assert.ok(Math.abs(value) <= RING.value + 1e-7, `value ${value}`);
    const key = `${r.centre[v * 3]},${r.centre[v * 3 + 1]},${cz}`; if (values.has(key)) assert.equal(values.get(key), value, 'one value a shard'); else values.set(key, value);
    seen[k].add(j);
  }
  seen.forEach((s, k) => assert.equal(s.size, 10, `ring ${k} carries all ten shades`));
  const vals = [...values.values()]; assert.equal(RING.value, 0.06); assert.ok(Math.min(...vals) < -0.04 && Math.max(...vals) > 0.04, 'the values spread across plus or minus 6 percent');
  // ring k starts arc 0 (Snow) at 36 k degrees clockwise from the top
  for (let k = 0; k < 5; k++) { assert.equal(arcAt(k, 36 * k + 1), 0); assert.equal(arcAt(k, 36 * k + 37), 1); near(arcCoord(k, 36 * k + 18), 0.5, 1e-9, 'mid arc 0'); }
  // most of a ring stays near its place while it is broken (a C-arc of 180 to 240 degrees), the rest is thrown
  const tight = r.fling.filter((_, i) => i % 4 === 0).filter((x) => x < 0.17 * RING.outer * S * 1.4).length / nv;
  assert.ok(tight > 0.4 && tight < 0.75, `${tight}`);
});

const HEX = ROOM_BAYS.map((b) => b.hex), LAB = HEX.map((h) => toOklab(display(h)));
const dE = (p: Lab, q: Lab) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const hueOf = (p: Lab) => Math.atan2(p[2], p[1]);
/** the largest OKLab step between neighbouring samples of a ring's colour, n samples round it */
const worstStep = (at: (a: number) => Lab, n: number) => { let w = 0; for (let k = 0; k < n; k++) w = Math.max(w, dE(at((10 * k) / n), at((10 * ((k + 1) % n)) / n))); return w; };

test('the blend (W13, E-S4-colour): the weight is half and half at each boundary and reaches over the outer 40 percent of each arc either side', () => {
  assert.equal(BLEND.half, 0.4);
  for (let j = 0; j < 10; j++) {
    const at = (x: number) => blendAt(j + 1 + x);   // x arcs from the boundary between arc j and arc j + 1
    assert.deepEqual([at(0).i, at(0).j], [j, (j + 1) % 10]); near(at(0).t, 0.5, 1e-12, `boundary ${j}`);
    near(at(-0.4).t, 0, 1e-12, 'nothing of the next shade 40 percent before the boundary'); near(at(0.4).t, 1, 1e-12, 'nothing of the shade before 40 percent after it');
    let prev = -1; for (let x = -0.4; x <= 0.4 + 1e-9; x += 0.02) { const t = at(x).t; assert.ok(t >= prev - 1e-12, 'rising'); prev = t; }
    for (const x of [-0.5, -0.45, 0.45, 0.499]) { const b = blendAt(j + 1 + x); assert.equal(b.t === 0 ? b.i : b.j, x < 0 ? j : (j + 1) % 10, 'its own shade on the middle fifth'); assert.ok(b.t === 0 || b.t === 1); }
  }
});

test('the ring\'s colours (AC3 with W13): each arc\'s middle fifth is its key shade\'s hex by id, every other sample a blend of the two neighbouring key shades in OKLab, never toward grey', () => {
  // the ramp the scene reads: the texels on each arc's middle fifth are the hex's own bytes
  const ramp = ringRamp(HEX), per = BLEND.perArc;
  assert.equal(ramp.length, 10 * per * 4);
  for (let n = 0; n < 10 * per; n++) {
    const a = (n + 0.5) / per, j = Math.floor(a), f = a - j;
    if (f > 0.4 && f < 0.6) assert.deepEqual([...ramp.slice(n * 4, n * 4 + 3)], display(HEX[j]).map((x) => Math.round(x * 255)), `${ROOM_BAYS[j].shade} at texel ${n}`);
  }
  // elsewhere: lightness between the two neighbours', hue on the short way round from one to the other, chroma never
  // below 0.55 of the straight mix of theirs (less 0.01 near white): a straight line in OKLab from Amethyst to Sunbeam
  // would fall to 0.15 of it, a grey beige
  for (let j = 0; j < 10; j++) {
    const p = LAB[j], q = LAB[(j + 1) % 10], neutral = Math.min(chroma(p), chroma(q)) < BLEND.neutral;
    const dh = ((hueOf(q) - hueOf(p) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    for (let s = 0; s <= 100; s++) {
      const a = j + 0.6 + (0.8 * s) / 100, { i, t } = blendAt(a), c = toOklab(ringColour(HEX, a)), what = `${ROOM_BAYS[j].name} to ${ROOM_BAYS[(j + 1) % 10].name} at ${a.toFixed(3)}`;
      assert.equal(i, j, what);
      assert.ok(c[0] >= Math.min(p[0], q[0]) - 2e-3 && c[0] <= Math.max(p[0], q[0]) + 2e-3, `${what}: lightness ${c[0]}`);
      assert.ok(chroma(c) >= 0.55 * (chroma(p) + (chroma(q) - chroma(p)) * t) - 0.01, `${what}: chroma ${chroma(c).toFixed(3)}, toward grey`);
      if (!neutral && chroma(c) > 0.03) { const off = ((hueOf(c) - hueOf(p) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI; assert.ok(off * Math.sign(dh) >= -0.05 && Math.abs(off) <= Math.abs(dh) + 0.05, `${what}: hue off the short way round`); }
    }
  }
  // why the turn: OKLab's straight line between the two near-opposite neighbours dips to grey, the turned mix does not
  const straight = (p: Lab, q: Lab): Lab => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
  assert.ok(chroma(straight(LAB[3], LAB[4])) < 0.03 && chroma(mixLab(LAB[3], LAB[4], 0.5)) > 0.15, 'Amethyst and Sunbeam');
});

test('no hard edges (W13): no two neighbouring samples round a ring differ by more than a set OKLab distance, where the old hard arcs jumped', () => {
  // the blend itself, a tenth of a degree apart (3,600 round the ring): at most 0.006 (a just-noticeable step is about 0.02)
  const fine = worstStep((a) => toOklab(ringColour(HEX, a)), 3600);
  assert.ok(fine <= 0.006, `${fine.toFixed(4)} between samples 0.1 degrees apart`);
  // the ramp as the GPU reads it, texel to texel (0.5625 degrees apart, linearly filtered between): at most 0.03
  const ramp = ringRamp(HEX), n = 10 * BLEND.perArc, texel = (k: number) => toOklab([0, 1, 2].map((c) => ramp[(((k % n) + n) % n) * 4 + c] / 255) as unknown as Lab);
  let worst = 0; for (let k = 0; k < n; k++) worst = Math.max(worst, dE(texel(k), texel(k + 1)));
  assert.ok(worst <= 0.03, `${worst.toFixed(4)} between neighbouring texels`);
  // the bound bites: the hard 36-degree arcs (arcAt, the old shading) step by at least 0.1 at a boundary
  const hard = worstStep((a) => LAB[Math.floor(a) % 10], 3600);
  assert.ok(hard >= 0.1, `${hard}`);
});

test('the push (check item 1): the landed points fade over its first 0.25 s on their own layer, then only land 1 is drawn', () => {
  const tl = entryTimeline(P()), m1 = tl.morph[1], rest = 0.18;
  const pts = (t: number) => pushLayers(t, tl, rest).find((l) => l.kind === 'points') as { alpha?: number } | undefined;
  near(pts(m1)!.alpha!, 1, 1e-12, 'opaque as they land'); near(pts(m1 + 0.1)!.alpha!, 0.6, 1e-9, 'm1 + 0.1 s'); near(pts(m1 + 0.2)!.alpha!, 0.2, 1e-9, 'm1 + 0.2 s');
  assert.ok(pts(m1 + 0.24)!.alpha! > 0 && pts(m1 + 0.24)!.alpha! < 0.05);
  assert.equal(pts(m1 + ENTRY.pointsFade), undefined, 'gone at 0.25 s'); assert.equal(pushLayers(tl.arrive, tl, rest).length, 1);
  const land = (t: number) => pushLayers(t, tl, rest)[0] as { kind: string; push: number };
  assert.equal(land(m1).kind, 'land'); near(land(m1).push, 0, 1e-12, 'the push starts at the picture'); near(land(tl.arrive).push, rest, 1e-12, 'and ends at the rest pose');
  // entry() hands render these layers as they are, and render sets each points layer's alpha from it
  const src = read('src/scripts/hero/section4/world.ts');
  assert.match(src, /plan = \{ kind: 'layers', list: pushLayers\(t, tl, api\.restPush\(0\)\) \};/);
  assert.match(src, /\} else points\.alpha\(l\.alpha \?\? 1\);/);
  assert.doesNotMatch(src, /\{ kind: 'points' \}/, 'no points layer without its alpha');
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

// garden.json as garden.py and encode.mjs write it, with the fields world.ts does not read but the tests check against
type GardenFile = Omit<GardenJson, 'camera' | 'cards'> & {
  camera: { startBeforeFirstS: number; pastLastRingS: number };
  cards: readonly { id: string; pastLastRingS: number; distance: number; tan: number[]; width: number; height: number; world: { width: number; height: number; x: number; y: number } }[];
};
const garden = JSON.parse(read('src/assets/room/garden/garden.json')) as GardenFile;
const near = (a: number, b: number, e: number, what: string) => assert.ok(Math.abs(a - b) <= e, `${what}: ${a} vs ${b}`);

test('the garden from garden.json: rendered from the glide\'s end, each card on its own tangent bounds, the plate\'s band, the sun as rendered', () => {
  assert.equal(garden.S, S); assert.equal(garden.camera.pastLastRingS, GLIDE.exit); assert.equal(garden.camera.startBeforeFirstS, GLIDE.approach);
  const g = gardenLayout(garden);
  garden.cards.forEach((c, k) => {
    const q = g.cards[k];
    // the card square to the axis at its distance from the render pose, sized and centred as garden.json's world rectangle
    near(q.w, c.world.width, 2e-3, `${c.id} width`); near(q.h, c.world.height, 2e-3, `${c.id} height`);
    near(q.x, c.world.x, 2e-3, `${c.id} x`); near(q.y, c.world.y, 2e-3, `${c.id} y`);
    near(q.z, -c.pastLastRingS * S, 1e-9, `${c.id} z past the last ring`);
  });
  // the hedges, the check's case: 3.21 units across, centred 0.95 below the axis 3.75 units past the render pose (not 4.69 across on the horizon)
  assert.ok(g.cards[0].w < 3.3 && g.cards[0].y < -0.9);
  // the plate: 64 degrees across, its band of rows covering the band about the axis and inside the image
  const [l, r] = g.plateTan, { rows: [y0, y1], tan: [b, t] } = bandRows(g, garden.plate.height), hx = Math.tan((32 * Math.PI) / 180);
  near(r, hx, 1e-9, 'plate right'); near(l, -hx, 1e-9, 'plate left'); near(g.plateTan[2], -hx, 1e-9, 'plate bottom'); near(g.plateTan[3], hx, 1e-9, 'plate top');
  assert.ok(b <= -GARDEN.band && t >= GARDEN.band && b >= -hx && t <= hx, `${b} ${t}`);
  assert.ok(y0 > 0 && y1 < garden.plate.height && Math.abs((t - b) / (2 * hx) - (y1 - y0) / garden.plate.height) < 1e-9, `${y0} ${y1}`);
  near(g.reach[0], hx * GARDEN.edge, 1e-9, 'reach across'); assert.ok(g.reach[1] <= Math.min(t, -b) * GARDEN.edge + 1e-12 && g.reach[1] >= GARDEN.band * GARDEN.edge - 1e-12, 'reach up: inside the rows kept');
  // the band's rows come from the decoded image's own height, so an encode at another scale (garden.json's scale per
  // format) keeps the same band: a half-height WebP covers the band too, its tangents within one of its rows
  for (const h of [garden.plate.height / 2, 1606, 777]) {
    const q = bandRows(g, h), row = (2 * hx) / h;
    assert.ok(q.rows[0] >= 0 && q.rows[1] <= h && q.tan[0] <= -GARDEN.band && q.tan[1] >= GARDEN.band, `${h} rows`);
    near(q.tan[0], b, row, `${h} rows: bottom`); near(q.tan[1], t, row, `${h} rows: top`);
  }
  // the sun: garden.json's direction (another builder may move it), normalised; world.ts reads it from the layout
  const d = garden.sun.direction, n = Math.hypot(d[0], d[1], d[2]);
  g.sun.forEach((x, k) => near(x, d[k] / n, 1e-12, `sun ${k}`));
  const src = read('src/scripts/hero/section4/world.ts');
  assert.match(src, /const SUN = new Vector3\(\.\.\.\(L\?\.sun \?\? SUN_BEHIND\)\)/);
  assert.doesNotMatch(src, /0\.28017|0\.57358|0\.76975/, 'no sun hard-coded from garden.json');
  // the rings are lit by it: the shards' shader takes uSun for the diffuse and for the highlight's half vector
  assert.match(src, /uSun: \{ value: SUN \}/); assert.match(src, /normalize\(uSun \+ v\)/); assert.match(src, /max\(dot\(n, uSun\), 0\.0\)/);
});

test('garden.json\'s format (check item 3): the one garden.py writes is read as it stands; a file without its numbers fails the load instead of placing at NaN', () => {
  // the plate's size and field, each card's distance and tangent bounds, the sun: what world.ts reads, all there
  assert.ok(garden.plate.width > 0 && garden.plate.height > 0 && garden.plate.fovDeg > 0 && garden.cards.every((c) => c.distance > 0 && c.tan.length === 4) && garden.sun.direction.length === 3);
  // a plate whose size moved elsewhere (a per-format block, say), a card without its bounds, no sun: each throws
  const plate = { fovDeg: garden.plate.fovDeg } as unknown as GardenJson['plate'];
  assert.throws(() => gardenLayout({ ...garden, plate }), /garden\.json does not give/);
  assert.throws(() => gardenLayout({ ...garden, cards: [{ distance: 3, tan: [] }] }), /garden\.json does not give/);
  assert.throws(() => gardenLayout({ ...garden, sun: { direction: [0, 0, 0] } }), /garden\.json does not give/);
  assert.throws(() => gardenLayout({ ...garden, sun: {} as GardenJson['sun'] }));
  // createWorld keeps the error and its load fails on it (the poster column stands in, spec 5), never the camera at NaN
  const src = read('src/scripts/hero/section4/world.ts');
  assert.match(src, /if \(o\.garden\) try \{ L = gardenLayout\(o\.garden\.json\); \} catch \(e\) \{ gardenError = e; \}/);
  assert.match(src, /try \{\n\s*if \(gardenError\) throw gardenError;/);
});

test('the plate\'s edge never shows (garden check 5): the glide\'s zoom rises only where a frame would reach past it, ultrawide windows first', (t) => {
  const g = gardenLayout(garden);
  const views = [[390, 844], [360, 780], [360, 840], [844, 390], [932, 430], [1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [3440, 1440], [3840, 1080], [5120, 1440], [300, 1000]] as const;
  const tls = [P(), P({ ringCount: 2, morphMs: 1000 }), P({ ringCount: 4, travelMs: 12000, morphMs: 3000 }), P({ ringCount: 4, morphMs: 3000 }), P({ travelRoll: 0 })].map(entryTimeline);
  const worst = (a: number, tl: EntryTimeline, z: number) => {
    const t0 = tl.glide[0], t1 = Math.max(tl.glide[1], tl.morph[1]); let x = 0, y = 0;
    for (let i = 0; i <= 2000; i++) { const tt = t0 + ((t1 - t0) * i) / 2000, [rx, ry] = frameReach(a, fovAt(tt, tl), z, rollAt(tt, tl)); x = Math.max(x, rx); y = Math.max(y, ry); }
    return [x, y];
  };
  const raised: string[] = [];
  for (const [w, h] of views) for (const tl of tls) {
    const a = w / h, z = glideZoom(a, tl, g.reach), [x, y] = worst(a, tl, z);
    assert.ok(x <= g.reach[0] + 1e-9 && y <= g.reach[1] + 1e-9, `${w} x ${h}: reaches ${x.toFixed(3)}, ${y.toFixed(3)} of ${g.reach.map((v) => v.toFixed(3))}`);
    if (z > Math.min(1, a * GLIDE.portrait) && tl === tls[0]) raised.push(`${w}x${h} ${z.toFixed(3)}`);
  }
  // the check's measurement: 2560 x 1080 at the default 30-degree roll reached 0.648 across, past the plate's 0.625
  near(worst(2560 / 1080, tls[0], 1)[0], 0.648, 0.003, '2560 x 1080 without the raise');
  // the frames that were covered keep the spec's zoom exactly
  for (const [w, h] of [[390, 844], [360, 780], [360, 840], [844, 390], [932, 430], [1280, 800], [1920, 1080]] as const) for (const tl of tls) assert.equal(glideZoom(w / h, tl, g.reach), Math.min(1, (w / h) * GLIDE.portrait), `${w} x ${h}`);
  assert.ok(glideZoom(2560 / 1080, tls[0], g.reach) > 1 && glideZoom(3440 / 1440, tls[0], g.reach) > 1);
  assert.equal(glideZoom(2560 / 1080, tls[0], null), 1, 'no garden, no raise');
  t.diagnostic(`zoom raised at the defaults: ${raised.join(', ')}`);
});

test('GPU memory on a phone (spec 6, colour plus depth): under 48 MiB through the entry and after it, the garden freed once land 1 is in', (t) => {
  const MiB = 1 << 20, g = gardenLayout(garden), W = Math.round(390 * 1.25), H = Math.round(844 * 1.25);
  const target = W * H * (4 + 4);   // RGBA8 colour and a 24-bit depth buffer stored in 4 bytes
  const rows = bandRows(g, garden.plate.height).rows, plate = garden.plate.width * (rows[1] - rows[0]) * 4, plateWhole = garden.plate.width * garden.plate.height * 4;   // magnified only: no mips
  const cards = garden.cards.reduce((s, c) => s + (c.width * c.height * 4 * 4) / 3, 0);
  const picture = (720 * 1280 * 4 * 4) / 3, depth = 180 * 320;
  const entry = target + plate + cards + picture + depth, after = target + 3 * (picture + depth);
  t.diagnostic(`target ${(target / MiB).toFixed(2)} MiB (colour and depth); plate ${(plate / MiB).toFixed(2)} of ${(plateWhole / MiB).toFixed(2)}; cards ${(cards / MiB).toFixed(2)}; the entry ${(entry / MiB).toFixed(2)} MiB, after land 1 ${(after / MiB).toFixed(2)} MiB`);
  assert.ok(entry <= 48 * MiB && after <= 48 * MiB);
  assert.ok(plate <= plateWhole * 0.8, 'the band keeps four fifths of the plate or less');
  // world.ts frees the garden on land 1's arrival (the push's end, still3d's cross-fade, a land at rest)
  assert.equal(read('src/scripts/hero/section4/world.ts').match(/releaseGarden\(\); \}|releaseGarden\(\); \},/g)?.length, 3);
});

// option A's stream vertex shader (stream.ts VERT), replayed on the CPU from the material's own uniforms
const pcg = (v: number) => { const s = (Math.imul(v, 747796405) + 2891336453) >>> 0; const w = Math.imul(((s >>> ((s >>> 28) + 4)) ^ s) >>> 0, 277803737) >>> 0; return ((w >>> 22) ^ w) >>> 0; };
const rnd = (i: number, k: number) => pcg((Math.imul(i, 8) + k) >>> 0) / 4294967296;
const smooth = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
type U = Record<string, { value: unknown }>;
const mul = (m: number[], x: number, y: number, z: number, w: number) => [m[0] * x + m[4] * y + m[8] * z + m[12] * w, m[1] * x + m[5] * y + m[9] * z + m[13] * w, m[2] * x + m[6] * y + m[10] * z + m[14] * w, m[3] * x + m[7] * y + m[11] * z + m[15] * w];
function replayStream(u: U, depth: (x: number, y: number) => number) {
  const num = (k: string) => u[k].value as number, vec = (k: string) => u[k].value as Vector4, mat = (k: string) => (u[k].value as Matrix4).elements;
  const cols = vec('uGrid').x, rows = vec('uGrid').y, jit = num('uJitter'), p = num('uP'), st = num('uStagger'), base = num('uBase');
  const ends = (['A', 'B'] as const).map((k, j) => ({ cover: vec(`uCover${k}`), cap: vec(`uCap${k}`), view: mat(`uView${k}`), proj: mat(`uProj${k}`), has: j ? vec('uHas').y : vec('uHas').x }));
  const land = (e: (typeof ends)[number], sx: number, sy: number) => {
    const px = 0.5 + (sx - 0.5) * e.cover.x, py = 0.5 + (sy - 0.5) * e.cover.y, d = e.has > 0.5 ? depth(px, py) : 1, z = 1 / (1 / e.cap.w + (1 / e.cap.z - 1 / e.cap.w) * d);
    return { v: mul(e.view, (px * 2 - 1) * e.cap.x * z, (py * 2 - 1) * e.cap.y * z, -z, 1), puv: [px, py] };
  };
  return (i: number) => {
    const idx = i % (cols * rows), sx = ((idx % cols) + 0.5 + (rnd(i, 4) - 0.5) * jit) / cols, sy = (Math.floor(idx / cols) + 0.5 + (rnd(i, 5) - 0.5) * jit) / rows;
    const A = land(ends[0], sx, sy), B = land(ends[1], sx, sy), l = Math.min(1, Math.max(0, (p - st * rnd(i, 6)) / (1 - st)));
    let v: number[], clip: number[], z0: number, a = num('uAlpha');
    if (l < 0.5) { const s = 2 * l; v = [A.v[0], A.v[1], A.v[2] + (num('uBehind') - A.v[2]) * s * s * s]; z0 = A.v[2]; clip = mul(ends[0].proj, v[0], v[1], v[2], 1); }
    else { const s = 1 - Math.pow(2 - 2 * l, 3); v = [B.v[0], B.v[1], B.v[2] * num('uFrom') + (B.v[2] - B.v[2] * num('uFrom')) * s]; z0 = B.v[2]; clip = mul(ends[1].proj, v[0], v[1], v[2], 1); a *= smooth(0.5, 0.55, l); }
    a *= smooth(0, num('uNear'), -v[2]);
    const px = Math.max(1, Math.min((base * z0) / Math.min(v[2], -0.001), Math.min(base * num('uGrow'), num('uCap'))));
    const drawn = a >= 0.01 && Math.abs(clip[0]) <= clip[3] && Math.abs(clip[1]) <= clip[3];
    return { ndc: [clip[0] / clip[3], clip[1] / clip[3]], px, drawn, suv: [sx, sy], A, B };
  };
}
const fakeLand = (w: number, h: number, fov: number, nr: number, fr: number): LandView => ({ picture: new DataTexture(null, w, h), depth: new DataTexture(null, w / 4, h / 4), aspect: w / h, fov, near: nr, far: fr });
const depthAt = (x: number, y: number) => 0.5 + 0.45 * Math.sin(x * 7.1) * Math.cos(y * 5.3);
/** where land v's grid draws its vertex at a picture uv (the disparity rule's depth there), through a camera built here from the spec: the land's cover-fit FOV, pushed and swayed */
function gridNdc(v: LandView, aspect: number, push: number, sway: readonly [number, number], puv: readonly number[]) {
  const ty = Math.tan((v.fov * Math.PI) / 360), c = new PerspectiveCamera((2 * Math.atan(aspect < v.aspect ? ty : (ty * v.aspect) / aspect) * 180) / Math.PI, aspect, LAND_CLIP[0], LAND_CLIP[1]);
  c.position.set(0, 0, -push); c.rotation.set((sway[1] * Math.PI) / 180, (sway[0] * Math.PI) / 180, 0); c.updateMatrixWorld();
  const z = 1 / (1 / v.far + (1 / v.near - 1 / v.far) * depthAt(puv[0], puv[1])), q = new Vector3((puv[0] * 2 - 1) * ty * v.aspect * z, (puv[1] * 2 - 1) * ty * z, -z).project(c);
  return [q.x, q.y];
}

test('option A\'s stream (defect 1): it starts on the first land\'s cells and ends on the next land\'s, each through its own camera, for two lands of different FOV and push', () => {
  for (const [w, h, portrait] of [[488, 1055, true], [1920, 1200, false]] as const) {
    const pw = portrait ? 720 : 1920, ph = portrait ? 1280 : 1200, A = fakeLand(pw, ph, 45, 1.2, 6), B = fakeLand(pw, ph, 60, 1.0, 8);
    const n = portrait ? CLOUD.touchCount : CLOUD.count, s = createStream({ count: n, dpr: portrait ? 1.25 : 1.5 }), u = (s.object.material as unknown as { uniforms: U }).uniforms, a = w / h;
    const cases = [
      { p: 0, push: 0, sway: [0, 0] as const, want: 'cell' },
      { p: 0, push: 0.35 * A.near, sway: [0.8, -0.4] as const, want: 'A' },
      { p: 1, push: 0.35 * A.near, sway: [0.8, -0.4] as const, want: 'B' },
    ];
    for (const c of cases) {
      s.update(c.p, { view: A, push: c.push, sway: c.sway }, { view: B, push: 0.15 * B.near }, w, h);
      const at = replayStream(u, depthAt);
      let worst = 0, apart = 0;
      for (let i = 0; i < n; i += 7) {
        const q = at(i), want = c.want === 'cell' ? [q.suv[0] * 2 - 1, q.suv[1] * 2 - 1] : c.want === 'A' ? gridNdc(A, a, c.push, c.sway, q.A.puv) : gridNdc(B, a, 0.15 * B.near, [0, 0], q.B.puv);
        worst = Math.max(worst, Math.hypot(q.ndc[0] - want[0], q.ndc[1] - want[1]));
        assert.ok(Math.abs(q.px - Math.max(1, Math.min(u.uBase.value as number, u.uCap.value as number))) < 1e-6, 'at its landed size at either end');
        // what the old stream drew: the next land through the current land's camera
        if (c.want === 'B') { const old = gridNdc(A, a, c.push, c.sway, q.B.puv); apart = Math.max(apart, Math.hypot(old[0] - want[0], old[1] - want[1])); }
      }
      assert.ok(worst < 1e-4, `${w} x ${h}, p ${c.p} on ${c.want}: off by ${worst} in NDC`);
      if (c.want === 'B') assert.ok(apart > 0.2, 'the two lands\' cameras differ, so the old projection would have missed the cells');
    }
    s.dispose();
  }
  // the shader projects each half through its own end's camera, with the depth test and write on (defect 8)
  const src = read('src/scripts/hero/section4/stream.ts');
  assert.match(src, /gl_Position = uProjA \* vec4\(v, 1\.0\)/); assert.match(src, /gl_Position = uProjB \* vec4\(v, 1\.0\)/);
  assert.match(src, /depthTest: true, depthWrite: true/);
});

test('option A\'s stream (defect 2, spec 6): every point it draws, counted whole, fills at most 2.5 screens at any moment of the travel', (t) => {
  for (const [cw, chh, dpr, n, portrait] of [[390, 844, 1.25, CLOUD.touchCount, true], [1280, 800, 1.5, CLOUD.count, false]] as const) {
    const W = Math.round(cw * dpr), H = Math.round(chh * dpr), pw = portrait ? 720 : 1920, ph = portrait ? 1280 : 1200;
    const A = fakeLand(pw, ph, 45, 1.2, 6), B = fakeLand(pw, ph, 60, 1.0, 8), s = createStream({ count: n, dpr }), u = (s.object.material as unknown as { uniforms: U }).uniforms;
    let worst = 0, at = 0, size = 0;
    for (let k = 0; k <= 50; k++) {
      const p = k / 50, push = 0.35 * A.near * Math.min(1, p / 0.45);
      s.update(p, { view: A, push, sway: [0.8 * Math.sin(3 * p), 0.4 * Math.sin(2 * p)] }, { view: B, push: 0.15 * B.near }, W, H);
      const pt = replayStream(u, depthAt);
      let area = 0;
      for (let i = 0; i < n; i++) { const q = pt(i); if (q.drawn) { area += (Math.PI * q.px * q.px) / 4; size = Math.max(size, q.px / (u.uBase.value as number)); } }
      if (area / (W * H) > worst) { worst = area / (W * H); at = p; }
    }
    t.diagnostic(`${cw} x ${chh}: at most ${worst.toFixed(2)} screens (at p ${at.toFixed(2)}), points at most ${size.toFixed(2)} landed sizes`);
    assert.ok(worst <= 2.5, `${cw} x ${chh}: ${worst.toFixed(2)} screens at p ${at}`);
    assert.ok(size <= STREAM.grow + 1e-9);
    s.dispose();
  }
});

test('colours (AC3): every scene colour is a key shade by id or a blend of two neighbouring ones, the lattice the next family\'s, and no raw colour in the scene files', () => {
  const ids = ROOM_BAYS.map((b) => b.shade);
  assert.deepEqual(SCENE_COLOURS.rings, ids, 'the rings: the ten key shades in catalog order');
  assert.deepEqual(SCENE_COLOURS.lattice, ids.map((_, i) => ids[(i + 1) % 10]), 'the lattice: the next family\'s');
  assert.deepEqual(SCENE_COLOURS.forcefields, ids); assert.deepEqual(SCENE_COLOURS.cloud, ids);
  // Pearl Whisper is the bubble's and the text's (transition.ts and the DOM); here only Urban Slate, behind a withdrawn garden
  for (const id of Object.values(SCENE_COLOURS).flat()) assert.ok(ids.includes(id) || id === 'urban-slate' || id === 'pearl-whisper', id);
  assert.deepEqual(SCENE_COLOURS.clear, ['urban-slate']);
  for (const f of ['world', 'rings', 'cloud', 'stream', 'blend']) {
    const src = read(`src/scripts/hero/section4/${f}.ts`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{6}\b|0x[0-9a-fA-F]{6}\b/, `${f}.ts carries a raw hex colour`);
    for (const m of src.matchAll(/new Color\(([^()]*(?:\([^()]*\))?[^()]*)\)/g)) assert.match(m[1].trim(), /^(|\.\.\.display\(URBAN_SLATE\))$/, `${f}.ts: new Color(${m[1]})`);
    // GLSL: no colour literal (a vector of two or more numbers); broadcast scalars (vec3(2.4) in the sRGB curve) are maths
    for (const m of src.matchAll(/vec[34]\(\s*(-?[\d.]+\s*(?:,\s*-?[\d.]+\s*)+)\)/g)) assert.fail(`${f}.ts: a literal ${m[0]}`);
  }
  // the shades reach the shaders as one ramp made from ROOM_BAYS' hexes (blend.ts, display values: the target is read as
  // sRGB), read at an arc coordinate: the shards at theirs and one arc on for the lattice, the forcefields by their angle,
  // the cloud by its longitude; no shader indexes a shade any more
  const world = read('src/scripts/hero/section4/world.ts'), cloud = read('src/scripts/hero/section4/cloud.ts');
  assert.match(world, /new DataTexture\(ringRamp\(ROOM_BAYS\.map\(\(b\) => b\.hex\)\), 10 \* BLEND\.perArc, 1, RGBAFormat, UnsignedByteType\)/);
  assert.match(world, /ramp\.wrapS = RepeatWrapping; ramp\.minFilter = ramp\.magFilter = LinearFilter;/);
  assert.match(world, /mix\(ramp\(vTone\.x\), ramp\(vTone\.x \+ 1\.0\), /);
  assert.match(world, /texture\(tRamp, vec2\(\(deg \/ 36\.0 - vRing\) \* 0\.1, 0\.5\)\)/);
  assert.match(cloud, /textureLod\(tRamp, vec2\(ph \/ 6\.2831853, 0\.5\), 0\.0\)/);
  for (const src of [world, cloud]) assert.doesNotMatch(src, /uShades/);
});
