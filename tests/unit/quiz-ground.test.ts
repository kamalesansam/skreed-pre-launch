// Section 3's ground since 2026-11-06 (docs/specs/quiz.md 11, E-S3-ground; the site review of 2026-11-05, forwarded by
// Sam): one flat texel of --night under the quiz and as the second wipe's far side, in place of section 2's fog; the
// logotype's tone back to Pearl Whisper over it. Read from the source, as the other record tests are.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIZ_GROUND } from '../../src/config/quiz-ground.ts';
import { groundBytes } from '../../src/scripts/hero/section5/ground.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

test('the colour is the page\'s --night, exact sRGB, as tokens.css sets it', () => {
  assert.equal(QUIZ_GROUND, '#050506');
  assert.match(read('src/styles/tokens.css'), /--night: #050506;/);
  assert.deepEqual([...groundBytes(QUIZ_GROUND)], [5, 5, 6, 255]);
});

test('the ground is one texel with no pass of its own: no fog shader, no hues, no size, nothing read from the DOM', () => {
  const ground = read('src/scripts/hero/section3/ground.ts');
  assert.match(ground, /import \{ QUIZ_GROUND \} from '\.\.\/\.\.\/\.\.\/config\/quiz-ground\.ts';/);
  assert.match(ground, /new DataTexture\(groundBytes\(QUIZ_GROUND\), 1, 1, RGBAFormat, UnsignedByteType\)/);
  assert.match(ground, /export function createQuizGround\(\): GroundScene/);
  assert.doesNotMatch(ground, /createBackground|ShaderMaterial|WebGLRenderTarget|writeHues|hueFrame|uScroll|getElementById|colorSpace/);
  assert.match(read('src/scripts/hero/hero.ts'), /const fogGround = createQuizGround\(\);/);
  for (const f of ['src/scripts/hero/loop.ts', 'src/scripts/hero/warmup.ts', 'src/scripts/hero/stage/resize.ts']) assert.doesNotMatch(read(f), /fogGround\.(render|update|resize)\(/, `${f}: nothing to draw or size`);
  // the composite still takes it as the second wipe's far side, the whole frame under the quiz and the third wipe's near side
  const loop = read('src/scripts/hero/loop.ts');
  assert.match(loop, /const groundTex = fogGround\.out;/);
  assert.match(loop, /if \(tp2 > 0\) \{ C\.tA\.value = S2!\.out; C\.tB\.value = groundTex; C\.uProgress\.value = tp2;/);
  assert.match(loop, /room\.step\(\{ t, dt, fog: fogGround\.out \}\)/);
});

test('the logotype and the cue\'s words: Urban Slate over the fog, Pearl Whisper again over the quiz\'s night, Urban Slate over section 5\'s cream', () => {
  assert.match(read('src/scripts/hero/loop.ts'), /rideCopy\(els, tp, innerWidth \/ innerHeight, !!S2 && S2\.ready, tp > 0\.5 && \(tp2 < 0\.5 \|\| s5 !== 'off'\)\);/);
  const ride = read('src/scripts/hero/scroll/ride.ts');
  assert.match(ride, /export function rideCopy\(els: RideEls, tp: number, asp: number, s2ready = false, light = tp > 0\.5\): void \{\n  window\.__skreedLogo\?\.setTone\(light\);/);
  assert.match(ride, /if \(els\.more\) cueWords\(els\.more, els\.cue, tp, s2ready, light\);/);
  assert.doesNotMatch(ride, /const light = tp > 0\.5;/);
});

test('the quiz\'s own CSS keeps --night as the ground before a result and the result\'s tones over it', () => {
  const css = read('src/styles/quiz.css');
  assert.match(css, /\.qz-ground \{ position: absolute; inset: 0; z-index: -1; display: none; background: var\(--qz-deep, var\(--night\)\);/);
});
