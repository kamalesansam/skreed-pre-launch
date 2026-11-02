// The case-type takeover in Node (docs/specs/family-page.md 24.4 criterion 3; 24.2 D4, D5, D9, D10): the controller's
// rules in fake time (depth.fyi's, measured: the eased progress over 1,350 ms, the reversal at the same rate, the queue
// that finishes a run within 240 ms, the ignored request, the snap, the last of two queued targets), dir (D5), the seed
// and the sweep's range, the shader spliced into three r165's own physical shader (every anchor and every variable it
// leans on), the front material's defines, and the guard that nothing of depth.fyi's code is in the repository's site.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshPhysicalMaterial, ShaderChunk, ShaderLib } from 'three';
import { TAKEOVER, easeTakeover, takeoverP } from '../../src/config/takeover.ts';
import { createTakeover, sweepRange, takeoverSeed } from '../../src/scripts/family/three/takeover.ts';
import { TAKEOVER_PROGRAM, createRunUniforms, createSideUniforms, injectTakeover, withTakeover } from '../../src/scripts/family/three/takeover-material.ts';
import { CASE_TYPES, type CaseType } from '../../src/scripts/family/three/pose.ts';

const D = TAKEOVER.durationMs;
const make = (from: CaseType = 'tough') => createTakeover<CaseType>(from, { order: CASE_TYPES });
/** ticks the controller at 60 Hz for ms milliseconds (the last tick shorter), as the stage's frame loop does */
function run(c: ReturnType<typeof make>, ms: number, step = 1000 / 60): void {
  for (let t = 0; t < ms - 1e-9; t += step) c.update(Math.min(step, ms - t));
}
const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

test('the measured constants: 1,350 ms, -0.12 to 1.12, the noise, the band, the seed, the 240 ms finish', () => {
  assert.equal(D, 1350);
  assert.deepEqual([TAKEOVER.pFrom, TAKEOVER.pTo], [-0.12, 1.12]);
  assert.deepEqual([TAKEOVER.majorScale, TAKEOVER.majorStrength, TAKEOVER.detailScale, TAKEOVER.detailStrength], [2.4, 0.14, 8, 0.025]);
  assert.deepEqual([TAKEOVER.feather, TAKEOVER.edgeWidth, TAKEOVER.bandMix], [0.018, 0.03, 0.82]);
  assert.deepEqual([TAKEOVER.band.base, TAKEOVER.band.specular], [0xd5f6f3, 0xb7c1ff]);
  assert.deepEqual([TAKEOVER.band.roughness, TAKEOVER.band.clearcoat, TAKEOVER.band.clearcoatRoughness, TAKEOVER.band.iridescence], [0.16, 0.9, 0.08, 0.2]);
  assert.deepEqual([TAKEOVER.relief, TAKEOVER.reliefFreq, TAKEOVER.coatFollow], [0.07, 1.37, 0.65]);
  assert.deepEqual([TAKEOVER.seed, TAKEOVER.finishWithinMs], [27027, 240]);
  assert.ok(close(TAKEOVER.firstAmp * (1 + 0.5 + 0.25 + 0.125), 1), 'the four octaves sum to 1');
  assert.equal(TAKEOVER.bandLight, 1);
});

test('the eased progress: linear raw over 1,350 ms, the in-out cubic, p from -0.12 to 1.12; the run promotes at its end', () => {
  const c = make();
  assert.equal(c.request('magtough'), true);
  let s = c.snapshot();
  assert.deepEqual([s.phase, s.current, s.incoming, s.raw, s.p], ['running', 'tough', 'magtough', 0, -0.12]);
  for (const ms of [100, 337.5, 675, 1012.5, 1300]) {
    const k = make();
    k.request('magtough');
    run(k, ms);
    const t = k.snapshot(), raw = ms / D, e = raw < 0.5 ? 4 * raw ** 3 : 1 - (2 - 2 * raw) ** 3 / 2;
    assert.ok(close(t.raw, raw, 1e-9), `raw at ${ms} ms: ${t.raw}`);
    assert.ok(close(t.eased, e, 1e-9) && close(t.p, -0.12 + 1.24 * e, 1e-9), `eased and p at ${ms} ms`);
    assert.equal(t.phase, 'running');
  }
  assert.ok(close(easeTakeover(0.5), 0.5) && close(takeoverP(1), 1.12) && close(takeoverP(0), -0.12));
  run(c, D - 1);
  assert.equal(c.snapshot().phase, 'running', 'not over at 1,349 ms');
  run(c, 1);
  s = c.snapshot();
  assert.deepEqual([s.phase, s.current, s.incoming, s.raw, s.eased], ['idle', 'magtough', 'magtough', 0, 0]);
  // the recording's band: it reaches the case's right end at about 29 percent and leaves its left end at about 71
  assert.ok(Math.abs(takeoverP(easeTakeover(0.29))) < 0.01 && Math.abs(takeoverP(easeTakeover(0.71)) - 1) < 0.01);
});

test('a reversal at 500 ms runs back at the same rate and is at rest on the case it came from by 1,000 ms', () => {
  const c = make();
  c.request('magtough');
  run(c, 500);
  const at = c.snapshot().raw;
  assert.ok(close(at, 500 / D));
  assert.equal(c.request('tough'), true);
  assert.equal(c.snapshot().phase, 'reversing');
  assert.equal(c.snapshot().dir, 1, 'the run keeps its direction: the same sweep plays back');
  run(c, 250);
  assert.ok(close(c.snapshot().raw, 250 / D, 1e-9), 'back at the same rate');
  run(c, 249);
  assert.equal(c.snapshot().phase, 'reversing');
  run(c, 1);
  const s = c.snapshot();
  assert.deepEqual([s.phase, s.current, s.incoming, s.raw], ['idle', 'tough', 'tough', 0]);
  // and forward again mid-reversal: the run resumes toward the case it was going to
  const d = make();
  d.request('magtough'); run(d, 600); d.request('tough'); run(d, 100);
  assert.equal(d.request('magtough'), true);
  assert.equal(d.snapshot().phase, 'running');
  assert.ok(close(d.snapshot().raw, 500 / D, 1e-9));
});

test('a third target during a run: the run finishes within 240 ms, then the queued one runs for 1,350 ms', () => {
  const c = make();
  c.request('magtough');
  run(c, 300);
  assert.equal(c.request('snap'), true);
  let s = c.snapshot();
  assert.deepEqual([s.phase, s.queued], ['finishing', 'snap']);
  run(c, 239);
  assert.equal(c.snapshot().incoming, 'magtough', 'still finishing at 239 ms');
  run(c, 1);
  s = c.snapshot();
  assert.deepEqual([s.phase, s.current, s.incoming, s.queued, s.dir], ['running', 'magtough', 'snap', null, 1], 'promoted, and the queued run under way');
  run(c, D - 1);
  assert.equal(c.snapshot().phase, 'running');
  run(c, 1);
  s = c.snapshot();
  assert.deepEqual([s.phase, s.current], ['idle', 'snap']);
  // near its end a run finishes at its own pace: 50 ms left is 50 ms, not 240
  const n = make();
  n.request('magtough'); run(n, D - 50); n.request('snap');
  run(n, 49);
  assert.equal(n.snapshot().incoming, 'magtough');
  run(n, 1);
  assert.deepEqual([n.snapshot().current, n.snapshot().incoming], ['magtough', 'snap']);
  // a reversal under way finishes back the same way before the queued run
  const r = make();
  r.request('magtough'); run(r, 600); r.request('tough'); run(r, 100); r.request('armor');
  assert.equal(r.snapshot().phase, 'finishing');
  run(r, 240);
  s = r.snapshot();
  assert.deepEqual([s.current, s.incoming, s.phase], ['tough', 'armor', 'running'], 'settled on the Tough, then on to the Armor');
});

test('a request for the target already coming is ignored; reduced motion snaps; the last of two queued targets wins', () => {
  const c = make();
  assert.equal(c.request('tough'), false, 'idle on the Tough: the Tough again is nothing');
  c.request('magtough');
  run(c, 200);
  assert.equal(c.request('magtough'), false, 'the run already goes there');
  assert.equal(c.snapshot().phase, 'running');
  // the snap (D8): at once, no run
  const r = make();
  assert.equal(r.snapTo('snap'), true);
  let s = r.snapshot();
  assert.deepEqual([s.phase, s.current, s.incoming, s.raw], ['idle', 'snap', 'snap', 0]);
  assert.equal(r.snapTo('snap'), false);
  r.request('armor'); run(r, 100);
  r.snapTo('tough');
  s = r.snapshot();
  assert.deepEqual([s.phase, s.current, s.queued], ['idle', 'tough', null], 'a snap mid-run lands at once');
  // two targets in a row while a run is under way: only the last is kept
  const q = make();
  q.request('magtough'); run(q, 400);
  q.request('snap');
  assert.equal(q.request('snap'), false, 'the same queued target again is nothing');
  q.request('armor');
  assert.equal(q.snapshot().queued, 'armor');
  run(q, 239);
  assert.equal(q.snapshot().phase, 'finishing', 'the second change does not restart the finish');
  run(q, 1.001);   // 240 ms, and a microsecond for the frames' float sums
  s = q.snapshot();
  assert.deepEqual([s.current, s.incoming], ['magtough', 'armor']);
  // the target the run heads for, while a third is queued, takes the queue away (the run still finishes fast)
  const h = make();
  h.request('magtough'); run(h, 400); h.request('snap');
  assert.equal(h.request('magtough'), true);
  assert.deepEqual([h.snapshot().queued, h.snapshot().phase], [null, 'finishing']);
});

test('dir (D5): +1 to a later case type, -1 to an earlier one; a suspended run holds; time that is not a step is nothing', () => {
  const c = make('snap');
  c.request('magtough');
  assert.equal(c.snapshot().dir, -1);
  run(c, D);
  c.request('armor');
  assert.equal(c.snapshot().dir, 1);
  assert.equal(c.suspend(true), true);
  run(c, 500);
  assert.equal(c.snapshot().raw, 0, 'suspended: no progress');
  assert.equal(c.snapshot().suspended, true);
  c.suspend(false);
  for (const dt of [0, -16, Number.NaN, Number.POSITIVE_INFINITY]) assert.equal(c.update(dt), false);
  run(c, 100);
  assert.ok(c.snapshot().raw > 0);
});

test('the seed: the same pair always the same three values in 0 to 37, another pair others; the range spans the points on the axis', () => {
  const a = takeoverSeed('tough', 'magtough'), b = takeoverSeed('tough', 'magtough'), c = takeoverSeed('magtough', 'tough');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  for (const v of [...a, ...c]) assert.ok(v >= 0 && v < 37, String(v));
  const pts = new Float32Array([0.2, 0, 0, -0.3, 0.5, 0.1, 0.1, -0.5, -0.05]);
  assert.deepEqual(sweepRange([1, 0, 0], pts).map((x) => +x.toFixed(6)), [-0.3, 0.2]);
  assert.deepEqual(sweepRange([-1, 0, 0], pts, new Float32Array([0.4, 0, 0])).map((x) => +x.toFixed(6)), [-0.4, 0.3]);
  const flat = sweepRange([0, 0, 1], new Float32Array([1, 2, 0.5, 3, 4, 0.5]));
  assert.ok(flat[1] - flat[0] > 0 && flat[1] - flat[0] < 2e-5, 'a flat set still has a range');
});

test("the shader: spliced into three r165's physical shader at its own anchors, with every variable it leans on in three's chunks", () => {
  const sh = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader };
  injectTakeover(sh);
  const v = sh.vertexShader, f = sh.fragmentShader;
  assert.match(v, /varying vec3 vTkPos;[\s\S]*#include <project_vertex>[\s\S]*vTkPos = \( uTkCaseInv \* tkP \)\.xyz;/);
  assert.match(v, /tkP = instanceMatrix \* tkP;/);
  const order = ['varying vec3 vTkPos;', '#include <clipping_planes_fragment>', 'discard;', '#include <color_fragment>', 'diffuseColor.rgb = mix( diffuseColor.rgb', '#include <roughnessmap_fragment>',
    'roughnessFactor = mix(', '#include <normal_fragment_maps>', 'normal = tkBump(', '#include <clearcoat_normal_fragment_maps>', 'clearcoatNormal = normalize( mix(',
    '#include <lights_physical_fragment>', 'material.clearcoat = mix(', '#include <lights_fragment_maps>', 'iblIrradiance *= tkL;'];
  let at = -1;
  for (const s of order) { const i = f.indexOf(s, at + 1); assert.ok(i > at, `"${s}" in order`); at = i; }
  // the band goes in after the shade's instance colour (color_fragment), so the shade never tints it
  assert.ok(f.indexOf('mix( diffuseColor.rgb') > f.indexOf('#include <color_fragment>'));
  // derivatives outside any branch, the discard after them
  const field = f.slice(f.indexOf('#include <clipping_planes_fragment>'), f.indexOf('#include <logdepthbuf_fragment>'));
  assert.ok(field.indexOf('dFdx( tkH )') < field.indexOf('discard;') && field.indexOf('dFdx( - vViewPosition )') < field.indexOf('discard;'));
  // what the splices lean on is three's own, in r165's chunks
  const has = (chunk: string, ...names: string[]) => { for (const n of names) assert.ok((ShaderChunk as unknown as Record<string, string>)[chunk].includes(n), `${chunk} has ${n}`); };
  has('lights_physical_fragment', 'specularColorFactor', 'specularIntensityFactor', 'geometryRoughness', 'material.clearcoatRoughness', 'material.iridescence');
  has('lights_fragment_begin', 'vec3 iblIrradiance', 'vec3 radiance', 'vec3 clearcoatRadiance');
  has('clearcoat_normal_fragment_begin', 'vec3 clearcoatNormal');
  has('normal_fragment_begin', 'float faceDirection', 'vec3 normal');
  has('roughnessmap_fragment', 'float roughnessFactor');
  has('metalnessmap_fragment', 'float metalnessFactor');
  has('lights_physical_pars_fragment', 'vec3 iridescenceFresnel;', 'vec3 iridescenceF0;');
  assert.throws(() => injectTakeover({ vertexShader: '#include <common>', fragmentShader: '' }), /anchor/);
});

test('a front material: the band\'s clearcoat and iridescence paths by define where the finish has none, one program key, the two uniform sets', () => {
  const runU = createRunUniforms(), side = createSideUniforms();
  const matte = withTakeover(new MeshPhysicalMaterial({ roughness: 0.62 }), runU, side);
  assert.deepEqual(Object.keys(matte.defines!).sort(), ['PHYSICAL', 'STANDARD', 'USE_CLEARCOAT', 'USE_IRIDESCENCE']);
  assert.equal(matte.clearcoat, 0, 'the case\'s own clearcoat stays 0 per fragment');
  const gloss = withTakeover(new MeshPhysicalMaterial({ clearcoat: 1 }), runU, createSideUniforms());
  assert.deepEqual(Object.keys(gloss.defines!).sort(), ['PHYSICAL', 'STANDARD', 'USE_IRIDESCENCE'], 'three defines its own clearcoat');
  assert.equal(matte.customProgramCacheKey(), TAKEOVER_PROGRAM);
  const sh = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader, uniforms: {} as Record<string, unknown> };
  (matte.onBeforeCompile as (s: typeof sh) => void)(sh);
  assert.equal(sh.uniforms.uTkP, runU.uTkP, 'the run\'s values are shared objects');
  assert.equal(sh.uniforms.uTkOn, side.uTkOn);
  assert.equal(side.uTkOn.value, 0, 'off at rest');
  assert.match(sh.fragmentShader, /if \( uTkOn > 0\.5 && \( uTkSide > 0\.0 \? tkD < 0\.0 : tkD >= 0\.0 \) \) discard;/);
});

test("nothing of depth.fyi's code or files is in the site's source or its public files", () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const banned = /depthHash31|depthValueNoise|depthFbm|depthPerturbNormal|uDepth[A-Z]|vDepthLocalPosition|material-takeover-v2|JourneyExperience|takeoverUniforms|neutral-metal027/;
  const hits: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (/JourneyExperience|forms\.glb|wooden_studio|depth-[A-Za-z0-9_-]{8}\.glb/.test(n)) hits.push(p);
      else if (/\.(ts|js|mjs|astro|css|json|html|glsl|md)$/.test(n) && banned.test(readFileSync(p, 'utf8'))) hits.push(p);
    }
  };
  walk(join(root, 'src'));
  walk(join(root, 'public'));
  assert.deepEqual(hits, []);
});
