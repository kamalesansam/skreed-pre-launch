// The fog's shade hues (config/fog-hues.ts, section2/hues.ts; E-fog-hue): the hues are the gems' key shades without the
// neutrals, catalog shades by id; the OKLab maths against known values; every Tune control with its default inside its
// range; the patches' schedule (three at once, a slot changes only while grey, no shade twice and no violet beside blue
// on screen); one clock for both instances of the background shader, section 2's own and section 3's ground.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FOG_HUE_AB, FOG_HUES, FOG_HUE_PARAMS, FOG_HUE_RANGES, createHueSlots, hueLo, oklabAB } from '../../src/config/fog-hues.ts';
import { hueFrame, huePhase, writeHues } from '../../src/scripts/hero/section2/hues.ts';
import { BLOCK_SHADES, SHADES } from '../../src/config/shades.gen.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('the hues are the gems\' key shades without Snow and Silver, all catalog shades', () => {
  const ids = SHADES.map((s) => s.id);
  for (const s of FOG_HUES) assert.ok(ids.includes(s.id), `${s.id} is a catalog shade`);
  const gems = BLOCK_SHADES.map((s) => s.id).filter((id) => id !== 'frosty-white-07' && id !== 'stormy-grey-05');
  assert.deepEqual(FOG_HUES.map((s) => s.id).sort(), [...gems].sort());
  assert.equal(FOG_HUES.length, 8);
  assert.equal(FOG_HUE_AB.length, FOG_HUES.length);
});

test('OKLab a and b against known values', () => {
  const close = (got: readonly number[], want: readonly number[]) => got.forEach((v, i) => assert.ok(Math.abs(v - want[i]) < 1e-3, `${got} vs ${want}`));
  close(oklabAB('#ffffff'), [0, 0]);
  close(oklabAB('#808080'), [0, 0]);
  close(oklabAB('#ff0000'), [0.22486, 0.12585]);
  close(oklabAB('#0000ff'), [-0.03246, -0.31153]);
});

test('every Tune control, with its default inside its range', () => {
  const tune = read('src/components/dev/Tune.astro');
  for (const [k, [min, max, step]] of Object.entries(FOG_HUE_RANGES)) {
    const m = tune.match(new RegExp(`<input id="f-${k}" type="range" min="([-\\d.]+)" max="([-\\d.]+)" step="([\\d.]+)">`));
    assert.ok(m, `Tune has f-${k}`);
    assert.deepEqual([+m![1], +m![2], +m![3]], [min, max, step]);
    assert.ok(tune.includes(`<output id="o-f-${k}">`), `Tune has a readout for ${k}`);
    const v = FOG_HUE_PARAMS[k as keyof typeof FOG_HUE_PARAMS];
    assert.ok(v >= min && v <= max, `${k} ${v} inside ${min} to ${max}`);
  }
  assert.deepEqual(Object.keys(FOG_HUE_RANGES).sort(), Object.keys(FOG_HUE_PARAMS).sort());
  // the noise tile (period 1) spans the widest screen at hueSize's top: 0.3 x 21 / 9 x hueSize <= 1
  assert.ok(0.3 * (21 / 9) * FOG_HUE_RANGES.hueSize[1] <= 1);
});

test('the cover maps inside the noise (0.5, sd 0.137)', () => {
  assert.ok(hueLo(0) <= 0.5 + 2 * 0.137 && hueLo(1) >= 0.5 - 2 * 0.137);
  assert.ok(hueLo(0) > hueLo(1));
});

test('the patches: three at once on sin^2, a slot changes only while grey, no shade twice and no violet beside blue', () => {
  const write = createHueSlots(), slots = new Float32Array(12), ab = new Float32Array(6);
  const fam = (i: number) => FOG_HUES[FOG_HUE_AB.findIndex(([a, b]) => Math.abs(a - ab[2 * i]) < 1e-6 && Math.abs(b - ab[2 * i + 1]) < 1e-6)].id.replace(/-\d+$/, '');
  let prev: number[] | null = null;
  for (let phase = 1; phase < 400; phase += 0.004) {
    write(phase, slots, ab);
    let sum = 0;
    for (let k = 0; k < 3; k++) sum += slots[4 * k + 2];
    assert.ok(Math.abs(sum - 1.5) < 1e-4, `envelopes sum to 1.5 at ${phase}: ${sum}`);
    const live = [0, 1, 2].filter((k) => slots[4 * k + 2] > 1e-3), fams = live.map(fam);
    assert.equal(new Set(live.map((k) => `${ab[2 * k]},${ab[2 * k + 1]}`)).size, live.length, `no shade twice at ${phase}`);
    assert.ok(!(fams.includes('blissful-blue') && fams.includes('vivid-violet')), `no violet beside blue at ${phase}`);
    const now = Array.from(slots).concat(Array.from(ab));
    if (prev) for (let k = 0; k < 3; k++) {
      const moved = now[4 * k] !== prev[4 * k] || now[12 + 2 * k] !== prev[12 + 2 * k];
      if (moved) assert.ok(prev[4 * k + 2] < 2e-3 && now[4 * k + 2] < 2e-3, `slot ${k} changed while lit at ${phase}`);
    }
    prev = now;
  }
});

test('one clock for both instances: the same t advances it once, dt is capped at 0.1 s, reduced motion holds it, and the write honours hueOn and the strength', () => {
  const c = FOG_HUE_PARAMS.hueCycle;
  hueFrame(10, false); const p1 = huePhase();                 // the first call sets the clock without advancing it
  hueFrame(10, false); assert.equal(huePhase(), p1);          // the same t again: no advance (the second instance's call)
  hueFrame(10.5, false); assert.ok(Math.abs(huePhase() - (p1 + 0.1 / c)) < 1e-9, 'a 0.5 s jump counts as 0.1 s');
  hueFrame(10.52, false); assert.ok(Math.abs(huePhase() - (p1 + 0.12 / c)) < 1e-9);
  hueFrame(11, true); assert.ok(Math.abs(huePhase() - (p1 + 0.12 / c)) < 1e-9, 'reduced motion holds the phase');
  const U = { uHueAmt: { value: 9 }, uHueSize: { value: 0 }, uHueLo: { value: 0 }, uHueSlot: { value: new Float32Array(12) }, uHueSlotAB: { value: new Float32Array(6) } } as unknown as Parameters<typeof writeHues>[0];
  writeHues(U, FOG_HUE_PARAMS, 1); assert.equal(U.uHueAmt.value, FOG_HUE_PARAMS.hueAmt); assert.equal(U.uHueSize.value, FOG_HUE_PARAMS.hueSize); assert.equal(U.uHueLo.value, hueLo(FOG_HUE_PARAMS.hueCover));
  assert.ok(Math.abs(U.uHueSlot.value[2] + U.uHueSlot.value[6] + U.uHueSlot.value[10] - 1.5) < 1e-4, 'three patches on screen');
  writeHues(U, FOG_HUE_PARAMS, 0.5); assert.ok(Math.abs(U.uHueAmt.value - FOG_HUE_PARAMS.hueAmt * 0.5) < 1e-9);
  writeHues(U, { ...FOG_HUE_PARAMS, hueOn: 0 }, 1); assert.equal(U.uHueAmt.value, 0);
});

test('both instances write the hues from the shared clock, and no build gate remains', () => {
  assert.match(read('src/scripts/hero/section2/background.ts'), /uHueAmt: \{ value: 0 \}/);
  assert.match(read('src/scripts/hero/section2/gems.ts'), /writeHues\(bg\.uniforms, hueFrame\(t, REDUCE\), 1\);/);
  const ground = read('src/scripts/hero/section3/ground.ts');
  assert.match(ground, /writeHues\(U, hueFrame\(t, reduced\), 1\);/);   // at full strength under the quiz's result too (Sam, 2026-10-29: "keep it on")
  assert.doesNotMatch(ground, /dataset\.state|getElementById|toGrey|1 - grey/, 'the ground reads nothing from the DOM: no fade to grey under the result');
  for (const f of ['src/scripts/hero/section3/ground.ts', 'src/env.d.ts', 'package.json']) assert.doesNotMatch(read(f), /PUBLIC_FOG_HUES/, `${f} has no build gate`);
});
