// The case-type takeover in Node (docs/specs/family-page.md 24.4 criterion 3; 24.2 D2, D4, D5, D8, D9, D10): the
// mapping from the stage's scroll to what the front slot shows (Sam, 2026-11-03: the sweep rides the turn's second half,
// so the band crosses the case as it comes round), the constants against their measurements, the seed, the shader
// spliced into three r165's own physical shader (every anchor and every variable it leans on, the field on the screen),
// the front material's defines, and the guard that nothing of depth.fyi's code is in the repository's site.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshPhysicalMaterial, ShaderChunk, ShaderLib } from 'three';
import { TAKEOVER, easeTakeover, takeoverP } from '../../src/config/takeover.ts';
import { SWEEP_END_SLACK, SWEEP_SPAN, availableType, handoverTypes, takeoverAt, takeoverSeed } from '../../src/scripts/family/three/takeover.ts';
import { TAKEOVER_PROGRAM, createRunUniforms, createSideUniforms, injectTakeover, withTakeover } from '../../src/scripts/family/three/takeover-material.ts';
import { CASE_TYPES, HANDOVERS, SWEEP_LEN, TURN_LEN, beatPose, type CaseType } from '../../src/scripts/family/three/pose.ts';

const all = () => true;
const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

test('the measured constants: -0.12 to 1.12, the noise, the band, the relief, the seed; the sweep spans the turn\'s second half', () => {
  assert.deepEqual([TAKEOVER.pFrom, TAKEOVER.pTo], [-0.12, 1.12]);
  assert.deepEqual([TAKEOVER.majorScale, TAKEOVER.majorStrength, TAKEOVER.detailScale, TAKEOVER.detailStrength], [2.4, 0.14, 8, 0.025]);
  assert.deepEqual([TAKEOVER.feather, TAKEOVER.edgeWidth, TAKEOVER.bandMix], [0.018, 0.03, 0.82]);
  assert.deepEqual([TAKEOVER.band.base, TAKEOVER.band.specular], [0xd5f6f3, 0xb7c1ff]);
  assert.deepEqual([TAKEOVER.band.roughness, TAKEOVER.band.clearcoat, TAKEOVER.band.clearcoatRoughness, TAKEOVER.band.iridescence], [0.16, 0.9, 0.08, 0.2]);
  assert.deepEqual([TAKEOVER.relief, TAKEOVER.reliefFreq, TAKEOVER.coatFollow], [0.07, 1.37, 0.65]);
  assert.deepEqual([TAKEOVER.seed, TAKEOVER.seedScale], [27027, 37]);
  assert.ok(close(TAKEOVER.firstAmp * (1 + 0.5 + 0.25 + 0.125), 1), 'the four octaves sum to 1');
  assert.equal(TAKEOVER.bandLight, 1);
  // the clock of 2026-11-02 is gone: no duration, no finish, no mirrored axis
  assert.deepEqual(Object.keys(TAKEOVER).filter((k) => /ms$|mirror/i.test(k)), []);
  assert.ok(close(SWEEP_SPAN, SWEEP_LEN) && close(SWEEP_SPAN, 0.2));
  assert.deepEqual([...HANDOVERS], [2.8, 3.8, 4.8]);
  assert.ok(close(easeTakeover(0.5), 0.5) && close(takeoverP(1), 1.12) && close(takeoverP(0), -0.12));
});

test('the mapping (D3 to D6): one case outside the hand-overs; inside each, the outgoing and the incoming case with the sweep linear in the scroll, the in-out cubic and p from -0.12 to 1.12, after the whole turn', () => {
  for (const sv of [0, 0.5, 1, 1.85, 2, 2.5, 2.799]) assert.deepEqual(takeoverAt(sv, { has: all }), { a: 'tough', b: null, raw: 0, eased: 0, p: -0.12 }, `sv ${sv}`);
  for (const [i, h] of HANDOVERS.entries()) {
    const [from, to] = handoverTypes(i);
    assert.deepEqual([from, to], [CASE_TYPES[i], CASE_TYPES[i + 1]]);
    assert.equal(beatPose(h).yaw, 0, `the hand-over at ${h} is the whole turn's end`);
    // the turn before it is the outgoing case's alone (D15): no sweep while it turns
    for (let t = h - TURN_LEN; t < h - 1e-9; t += 0.01) assert.deepEqual([takeoverAt(t, { has: all }).a, takeoverAt(t, { has: all }).b], [from, null], `the turn at ${t.toFixed(2)}`);
    const start = takeoverAt(h, { has: all });
    assert.deepEqual([start.a, start.b, start.raw, start.eased, start.p], [from, to, 0, 0, -0.12], `at ${h}`);
    for (const k of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const v = takeoverAt(h + k * SWEEP_SPAN, { has: all });
      assert.deepEqual([v.a, v.b], [from, to]);
      assert.ok(close(v.raw, k, 1e-9) && close(v.eased, easeTakeover(k), 1e-9) && close(v.p, -0.12 + 1.24 * easeTakeover(k), 1e-9), `at ${k} of the span`);
    }
    const end = takeoverAt(h + SWEEP_SPAN, { has: all });
    assert.deepEqual([end.a, end.b, end.raw], [to, null, 0], `at the beat's rest the new case alone`);
    // the page scrolls by whole pixels and can rest a hair short of the beat: within the slack the new case stands alone too
    const hair = takeoverAt(h + SWEEP_SPAN - SWEEP_END_SLACK / 2, { has: all });
    assert.deepEqual([hair.a, hair.b], [to, null], 'a hair short of the rest');
    assert.ok(takeoverAt(h + SWEEP_SPAN - SWEEP_END_SLACK * 2, { has: all }).b === to, 'two hairs short is still the sweep');
    assert.equal(SWEEP_END_SLACK, 0.004, 'the browser row of criteria 4 and 7 carries this figure');
    for (const k of [0, 0.5, 1]) assert.equal(beatPose(h + k * SWEEP_SPAN).yaw, 0, 'the case faces the camera through the sweep');
  }
  for (const sv of [3, 3.5, 3.799]) assert.equal(takeoverAt(sv, { has: all }).a, 'magtough');
  for (const sv of [4, 4.5]) assert.equal(takeoverAt(sv, { has: all }).a, 'snap');
  for (const sv of [5, 5.5, 6.5, 7]) assert.equal(takeoverAt(sv, { has: all }).a, 'armor');
  // the way up is the same function: the sweep plays back as the scroll falls (D5)
  const up = [2.99, 2.95, 2.9, 2.81].map((sv) => takeoverAt(sv, { has: all }).raw);
  for (let i = 1; i < up.length; i++) assert.ok(up[i] < up[i - 1], 'raw falls with the scroll');
  assert.equal(takeoverAt(2.79, { has: all }).a, 'tough');
});

test('a model that has not landed keeps the case before it with no sweep (D2); a later type sweeps in from whatever stands; reduced motion changes the type at the hand-over with no sweep (D8)', () => {
  const noSnap = (t: CaseType) => t !== 'snap';
  assert.equal(availableType('snap', noSnap), 'magtough');
  assert.equal(availableType('armor', noSnap), 'armor');
  assert.equal(availableType('tough', () => false), 'tough');
  for (const sv of [3.8, 3.9, 3.99, 4, 4.5]) assert.deepEqual([takeoverAt(sv, { has: noSnap }).a, takeoverAt(sv, { has: noSnap }).b], ['magtough', null], `sv ${sv} without the Snap`);
  const v = takeoverAt(4.9, { has: noSnap });
  assert.deepEqual([v.a, v.b], ['magtough', 'armor'], 'the Armor takes over from the MagTough that stands');
  assert.ok(close(v.raw, 0.5, 1e-9));
  const none = (t: CaseType) => t === 'tough';
  for (const sv of [2.9, 3, 4, 5, 6.5]) assert.deepEqual([takeoverAt(sv, { has: none }).a, takeoverAt(sv, { has: none }).b], ['tough', null]);
  assert.deepEqual([takeoverAt(2.79, { has: all, instant: true }).a, takeoverAt(2.8, { has: all, instant: true }).a, takeoverAt(2.9, { has: all, instant: true }).b], ['tough', 'magtough', null]);
  assert.deepEqual([takeoverAt(4.8, { has: all, instant: true }).a, takeoverAt(4.79, { has: all, instant: true }).a], ['armor', 'snap']);
});

test('the seed: the same pair always the same three values in 0 to 37, another pair others', () => {
  const a = takeoverSeed('tough', 'magtough'), b = takeoverSeed('tough', 'magtough'), c = takeoverSeed('magtough', 'tough');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  for (const v of [...a, ...c]) assert.ok(v >= 0 && v < 37, String(v));
});

test("the shader: spliced into three r165's physical shader at its own anchors, the field on the screen, with every variable it leans on in three's chunks", () => {
  const sh = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader };
  injectTakeover(sh);
  const v = sh.vertexShader, f = sh.fragmentShader;
  assert.match(v, /varying vec3 vTkPos;[\s\S]*#include <project_vertex>[\s\S]*vTkPos = \( uTkCaseInv \* tkP \)\.xyz;/);
  assert.match(v, /tkP = instanceMatrix \* tkP;/);
  const order = ['varying vec3 vTkPos;', 'uniform vec4 uTkRect;', 'uniform float uTkPx;', '#include <clipping_planes_fragment>', 'uTkRect.y - gl_FragCoord.x', 'gl_FragCoord.xy - uTkRect.xz', 'discard;', '#include <color_fragment>', 'diffuseColor.rgb = mix( diffuseColor.rgb', '#include <roughnessmap_fragment>',
    'roughnessFactor = mix(', '#include <normal_fragment_maps>', 'normal = tkBump(', '#include <clearcoat_normal_fragment_maps>', 'clearcoatNormal = normalize( mix(',
    '#include <lights_physical_fragment>', 'material.clearcoat = mix(', '#include <lights_fragment_maps>', 'iblIrradiance *= tkL;'];
  let at = -1;
  for (const s of order) { const i = f.indexOf(s, at + 1); assert.ok(i > at, `"${s}" in order`); at = i; }
  // the field is the screen's, never the case's own space: no axis, no range
  assert.doesNotMatch(f, /uTkAxis|uTkRange/);
  // the relief still samples the case's own space (vTkPos), after the field
  assert.ok(f.indexOf('vTkPos * uTkReliefScale') > f.indexOf('gl_FragCoord.xy - uTkRect.xz'));
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
  assert.deepEqual(Object.keys(runU).sort(), ['uTkBand', 'uTkCaseInv', 'uTkIrid', 'uTkLight', 'uTkP', 'uTkPx', 'uTkRect', 'uTkRelief', 'uTkReliefScale', 'uTkSeed']);
  const matte = withTakeover(new MeshPhysicalMaterial({ roughness: 0.62 }), runU, side);
  assert.deepEqual(Object.keys(matte.defines!).sort(), ['PHYSICAL', 'STANDARD', 'USE_CLEARCOAT', 'USE_IRIDESCENCE']);
  assert.equal(matte.clearcoat, 0, 'the case\'s own clearcoat stays 0 per fragment');
  const gloss = withTakeover(new MeshPhysicalMaterial({ clearcoat: 1 }), runU, createSideUniforms());
  assert.deepEqual(Object.keys(gloss.defines!).sort(), ['PHYSICAL', 'STANDARD', 'USE_IRIDESCENCE'], 'three defines its own clearcoat');
  assert.equal(matte.customProgramCacheKey(), TAKEOVER_PROGRAM);
  const sh = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader, uniforms: {} as Record<string, unknown> };
  (matte.onBeforeCompile as (s: typeof sh) => void)(sh);
  assert.equal(sh.uniforms.uTkP, runU.uTkP, 'the run\'s values are shared objects');
  assert.equal(sh.uniforms.uTkRect, runU.uTkRect);
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
