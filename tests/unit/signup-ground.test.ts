// Section 5's ground under the hero island (Sam's picture of 2026-11-02; src/scripts/hero/section5/ground.ts, C1, C3,
// C6, D10): SIGNUP_GROUND as C1 writes it and the page's --su-ground equal to it; the texel's bytes, sampled raw, through
// the composite's cut and rest unchanged (its five spectral taps of one colour normalise back to that colour, its final
// write with the intro over and no cloud is the sample itself, nothing tone maps or encodes it); the modes, the mark and
// the hold as functions; the section's trigger, rest and view from the DOM, cached for 500 ms and read afresh on
// invalidate(); the mark written on a change only and taken off on dispose; the readiness from data-ready; and the loop's,
// hero.ts's and the director's wiring.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NearestFilter, NoColorSpace, RGBAFormat, UnsignedByteType } from 'three';
import { SIGNUP_GROUND } from '../../src/config/signup-ground.ts';
import { createSignupGround, exitOf, groundBytes, groundMode, holds, inViewOf, restOf, underGround, type SignupLayout } from '../../src/scripts/hero/section5/ground.ts';
import { COMPOSITE_FRAG_V11, COMPOSITE_FRAG_V11_COVER } from '../../src/scripts/hero/v11/glsl.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('C1: SIGNUP_GROUND is #F2EAE1, the file exactly its three lines; the page\'s --su-ground is the same colour', () => {
  assert.equal(SIGNUP_GROUND, '#F2EAE1');
  assert.equal(read('src/config/signup-ground.ts'), [
    '// Section 5\'s ground, measured from Sam\'s picture of 2026-11-02 (its top band; the bottom third is 0.7 L* lighter, too little to draw).',
    '// The page (--su-ground in src/styles/signup.css) and the hero island\'s flat ground for the fourth wipe use it; a unit test keeps them equal.',
    'export const SIGNUP_GROUND = \'#F2EAE1\';',
    '',
  ].join('\n'));
  const css = read('src/styles/signup.css');
  const m = /--su-ground:\s*(#[0-9a-fA-F]{6})\b/.exec(css);
  assert.ok(m, 'signup.css defines --su-ground');
  assert.equal(m![1].toUpperCase(), SIGNUP_GROUND, '--su-ground equals SIGNUP_GROUND');
});

test('the texel: the colour\'s sRGB bytes, opaque, a 1 x 1 RGBA8 texture with no colour space (sampled raw, never decoded), nearest, no mipmaps', () => {
  assert.deepEqual([...groundBytes(SIGNUP_GROUND)], [0xf2, 0xea, 0xe1, 0xff]);
  assert.deepEqual([...groundBytes('#000000')], [0, 0, 0, 255]);
  for (const bad of ['F2EAE1', '#F2EAE', '#F2EAE1F', 'rgb(242, 234, 225)']) assert.throws(() => groundBytes(bad), /not a #rrggbb colour/, bad);
  const root = fakeSection({ top: 0, height: 844, bodyBottom: 844 });
  const g = createSignupGround(root.el);
  const t = g.tex as unknown as { image: { data: Uint8Array; width: number; height: number }; format: number; type: number; colorSpace: string; magFilter: number; minFilter: number; generateMipmaps: boolean; flipY: boolean; version: number };
  assert.deepEqual([...t.image.data], [242, 234, 225, 255]);
  assert.equal(t.image.width, 1); assert.equal(t.image.height, 1);
  assert.equal(t.format, RGBAFormat); assert.equal(t.type, UnsignedByteType);
  assert.equal(t.colorSpace, NoColorSpace, 'no colour space: three uploads RGBA8, not SRGB8_ALPHA8, so the sample is the byte over 255');
  assert.equal(t.magFilter, NearestFilter); assert.equal(t.minFilter, NearestFilter);
  assert.equal(t.generateMipmaps, false); assert.equal(t.flipY, false);
  assert.ok(t.version > 0, 'flagged for upload');
  g.dispose();
});

/** the composite's spectrum() (src/scripts/hero/v11/glsl.ts), in doubles */
function spectrum(t: number): number[] {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const lo = t <= 0.5 ? 1 : 0, hi = 1 - lo, w = clamp(1 - Math.abs(2 * clamp((t - 1 / 6) / (4 / 6)) - 1));
  return [lo * (1 - w), w, hi * (1 - w), 1].map((v) => Math.pow(v, 1 / 2.2));
}

test('the composite copies the texel: at rest and once the cut is done a sample written as it is; mid-cut the five spectral taps of one colour normalise back to it; nothing tone maps or encodes the result', () => {
  const frag = COMPOSITE_FRAG_V11_COVER;
  assert.match(frag, /if \(uProgress <= 0\.0\) return texture2D\(tA, vUv\)\.rgb;\s*if \(uProgress >= 1\.0\) return texture2D\(tB, vUv\)\.rgb;/, 'rest (tA) and the cut done (tB): the sample as it is');
  assert.match(frag, /vec3 fin = mix\(uFlat, col, uIntro\); if \(uCover > 0\.0\) \{/, 'the intro over (uIntro 1) and no cloud: fin is col');
  assert.match(frag, /gl_FragColor = vec4\(fin, 1\.0\); \}/);
  assert.match(frag, /for \(int i = 0; i < 5; i\+\+\) \{ float k = float\(i\) \/ 5\.0; vec4 w = spectrum\(k\); sw \+= w; sum \+= w \* texture2D\(t, barrel\(uv, bend \* maxd \* k\)\); \}\s*return \(sum \/ sw\)\.rgb;/, 'the taps normalised per channel');
  for (const f of [frag, COMPOSITE_FRAG_V11]) assert.doesNotMatch(f, /#include|tonemapping_fragment|colorspace_fragment|dithering_fragment|linearToOutputTexel|toneMapping\(/, 'no tone mapping, colour space encode or dithering chunk');
  // the cut's noise (ign) only jitters where the taps sample, never the colour: with one texel every tap reads the same
  assert.match(frag, /s2 = ca\(tB, vUv \+ vec2\(0\.0, parallaxY \* cubicIn\(1\.0 - uProgress\) \+ disp \* \(1\.0 - cutDisp\)\), modulator, \(1\.0 - blurDiag\) \* n\.y\);/);
  // a flat colour through the taps: every tap reads the one texel (a 1 x 1 texture clamps any coordinate to it)
  const c = [...groundBytes(SIGNUP_GROUND)].slice(0, 3).map((b) => b / 255);
  const sum = [0, 0, 0], sw = [0, 0, 0];
  for (let i = 0; i < 5; i++) { const w = spectrum(i / 5); for (let k = 0; k < 3; k++) { sw[k] += w[k]; sum[k] += w[k] * c[k]; } }
  const out = sum.map((s, k) => Math.round(Math.min(1, Math.max(0, s / sw[k])) * 255));
  assert.deepEqual(out, [242, 234, 225], 'the cut\'s far side is the ground\'s bytes wherever it shows');
  // and the mix of the two sides where the cut is soft: the ground against itself is the ground
  const mixd = c.map((v) => v * (1 - 0.37) + v * 0.37).map((v) => Math.round(v * 255));
  assert.deepEqual(mixd, [242, 234, 225]);
});

test('the modes: the wipe\'s far side while section 4 is on and the cut has begun, the whole frame with section 4 off and the section in view, else off', () => {
  assert.equal(groundMode({ inView: false, roomOn: true, wipeOut: 0 }), 'off', 'scene 5 before the cut');
  assert.equal(groundMode({ inView: false, roomOn: true, wipeOut: 0.4 }), 'wipe', 'the cut under way');
  assert.equal(groundMode({ inView: true, roomOn: true, wipeOut: 1 }), 'whole', 'the cut done with the section in view: the whole frame, even while a sub-pixel of the stage is still on screen (the halved track\'s fractional rest, 2026-11-03)');
  assert.equal(groundMode({ inView: true, roomOn: true, wipeOut: 0.999 }), 'wipe', 'the cut not quite done: still the cut');
  assert.equal(groundMode({ inView: true, roomOn: false, wipeOut: 0 }), 'whole', 'section 4 gone: the ground is the frame');
  assert.equal(groundMode({ inView: true, roomOn: false, wipeOut: 1 }), 'whole');
  assert.equal(groundMode({ inView: false, roomOn: false, wipeOut: 0 }), 'off', 'the hero after the exit\'s jump');
  // the mark: the island's ground under the section in view
  assert.equal(underGround('whole', true, 0), true);
  assert.equal(underGround('wipe', true, 1), true, 'the cut done with the section rising');
  assert.equal(underGround('wipe', true, 0.6), false, 'a cut half way never has the section in view, and is not its ground if it had');
  assert.equal(underGround('wipe', false, 1), false, 'the cut done before the section rises: nothing to mark');
  assert.equal(underGround('off', true, 0), false);
  assert.equal(underGround('whole', false, 0), false);
});

test('the hold: no draw while the ground is the whole frame with no cloud and the canvas already shows it at this size; any cloud, a new size, a restart or another mode draws', () => {
  const size = '1920x1200';
  assert.equal(holds({ mode: 'whole', cover: 0, drawnAt: size, size }), true);
  assert.equal(holds({ mode: 'whole', cover: 0, drawnAt: null, size }), false, 'not drawn yet (the loop\'s start, or another frame since)');
  assert.equal(holds({ mode: 'whole', cover: 0, drawnAt: '1280x800', size }), false, 'a resize cleared the drawing buffer');
  assert.equal(holds({ mode: 'whole', cover: 0.01, drawnAt: size, size }), false, 'a seam\'s cloud moves over it');
  assert.equal(holds({ mode: 'wipe', cover: 0, drawnAt: size, size }), false, 'the cut');
  assert.equal(holds({ mode: 'off', cover: 0, drawnAt: size, size }), false);
});

test('the trigger, the rest and the view (document px): the body\'s end at the viewport\'s bottom; the rest that, or the section\'s top when lower; any of the section on screen', () => {
  const vh = 844;
  const one: SignupLayout = { top: 30_000, height: 844, bodyBottom: 30_844 };   // a one-screen body, C6: its exit is its top
  assert.equal(exitOf(one, vh), 30_000); assert.equal(restOf(one, vh), 30_000);
  const short: SignupLayout = { top: 30_000, height: 844, bodyBottom: 30_700 };   // a body short of the screen: the rest at the top
  assert.equal(exitOf(short, vh), 29_856); assert.equal(restOf(short, vh), 30_000);
  const land: SignupLayout = { top: 20_000, height: 890, bodyBottom: 20_890 };   // a landscape phone at 844 x 390: the rest at the body's end
  assert.equal(exitOf(land, 390), 20_500); assert.equal(restOf(land, 390), 20_500);
  assert.equal(inViewOf(one, 30_000 - vh, vh), false, 'its top at the viewport\'s bottom edge: not yet');
  assert.equal(inViewOf(one, 30_000 - vh + 1, vh), true, 'a pixel in');
  assert.equal(inViewOf(one, 30_000, vh), true);
  assert.equal(inViewOf(one, 30_844 - 1, vh), true);
  assert.equal(inViewOf(one, 30_844, vh), false, 'scrolled past its end');
  assert.equal(inViewOf(one, 0, vh), false, 'the hero');
});

interface FakeSection { el: HTMLElement; reads: number; writes: string[]; box: { top: number; height: number; bodyBottom: number } | null; body: boolean }
/** section#signup with .su-body, its rects in viewport px at the globals' scrollY; box null is the section hidden behind the quiz gate */
function fakeSection(box: { top: number; height: number; bodyBottom: number } | null): FakeSection {
  const f: FakeSection = { el: null as unknown as HTMLElement, reads: 0, writes: [], box, body: true };
  const dataset = new Proxy({} as Record<string, string>, {
    set(o, k, v) { f.writes.push(`set ${String(k)}=${v}`); o[String(k)] = v; return true; },
    deleteProperty(o, k) { f.writes.push(`delete ${String(k)}`); delete o[String(k)]; return true; },
  });
  const y = () => (globalThis as unknown as { scrollY: number }).scrollY;
  const body = { getClientRects: () => (f.box && f.body ? [1] : []), getBoundingClientRect: () => ({ top: f.box!.bodyBottom - 844 - y(), bottom: f.box!.bodyBottom - y() }) };
  f.el = {
    dataset,
    querySelector: (s: string) => (s === '.su-body' ? body : null),
    getClientRects: () => (f.box ? [1] : []),
    getBoundingClientRect: () => { f.reads++; return { top: f.box!.top - y(), bottom: f.box!.top + f.box!.height - y(), height: f.box!.height }; },
  } as unknown as HTMLElement;
  return f;
}
/** the window's scroll and height for a test, put back after */
function withWindow<T>(w: { scrollY: number; innerHeight: number }, fn: () => T): T {
  const g = globalThis as unknown as Record<string, unknown>;
  const saved = { scrollY: g.scrollY, innerHeight: g.innerHeight };
  Object.assign(g, w);
  try { return fn(); } finally { Object.assign(g, saved); }
}

test('createSignupGround: the section\'s layout from the DOM, kept for 500 ms and read afresh on invalidate(); hidden behind the gate it reads nothing (NaN, not in view)', () => {
  const w = { scrollY: 29_500, innerHeight: 844 };
  withWindow(w, () => {
    const s = fakeSection({ top: 30_000, height: 1_688, bodyBottom: 30_844 });
    const g = createSignupGround(s.el);
    assert.deepEqual(g.layout(), { top: 30_000, height: 1_688, bodyBottom: 30_844 }, 'document px whatever the scroll');
    assert.equal(g.exitY(), 30_000); assert.equal(g.restY(), 30_000);
    assert.equal(g.inView(), true, '500 px of it on screen');
    const n = s.reads;
    w.scrollY = 0; Object.assign(globalThis, w);
    assert.equal(g.inView(), false, 'scroll 0: the view from scrollY against the cached reading');
    assert.equal(s.reads, n, 'no layout read within 500 ms');
    s.box = { top: 31_000, height: 1_688, bodyBottom: 31_844 };   // the document grew above it
    assert.equal(g.restY(), 30_000, 'still the cached reading');
    g.invalidate();
    assert.equal(g.restY(), 31_000, 'read afresh after invalidate()');
    assert.equal(s.reads, n + 1);
    s.body = false; g.invalidate();
    assert.equal(g.exitY(), 31_000 + 1_688 - 844, 'no .su-body box: the section\'s own end');
    s.box = null; g.invalidate();
    assert.equal(g.layout(), null, 'hidden behind the quiz gate: no box');
    assert.ok(Number.isNaN(g.exitY()) && Number.isNaN(g.restY()));
    assert.equal(g.inView(), false);
    g.dispose();
  });
});

test('the mark (C3): data-ground="island" set and removed on a change only, removed on dispose; the readiness is data-ready="1"', () => {
  const s = fakeSection({ top: 0, height: 844, bodyBottom: 844 });
  const g = createSignupGround(s.el);
  g.mark(false);
  assert.deepEqual(s.writes, [], 'nothing to remove at first');
  g.mark(true); g.mark(true); g.mark(true);
  assert.deepEqual(s.writes, ['set ground=island'], 'one write for many frames');
  assert.equal(s.el.dataset.ground, 'island');
  g.mark(false); g.mark(false);
  assert.deepEqual(s.writes, ['set ground=island', 'delete ground']);
  assert.equal(s.el.dataset.ground, undefined);
  g.mark(true); g.dispose();
  assert.equal(s.el.dataset.ground, undefined, 'the island torn down or fallen to the poster: the page paints its own ground');
  assert.equal(g.ready(), false);
  s.el.dataset.ready = '1';
  assert.equal(g.ready(), true);
  s.el.dataset.ready = '0';
  assert.equal(g.ready(), false);
});

test('the wiring: the loop cuts onto the texel and rests on it, renders no fog under section 5, holds the draw, marks the section and takes the mark off when it stops; hero.ts makes the ground and disposes it; the director draws no carousel off screen at rest', () => {
  const loop = read('src/scripts/hero/loop.ts');
  assert.match(loop, /const G = ctx\.signup, s5in = !!G && G\.inView\(\), s5 = G \? groundMode\(\{ inView: s5in, roomOn, wipeOut \}\) : 'off';/);
  assert.match(loop, /&& !\(roomOn && !plan!\.groundNeeded\) && s5 !== 'whole';/, 'no fog rendered while the ground is the whole frame');
  assert.match(loop, /if \(roomOn && wipeOut > 0\) \{ C\.tA\.value = plan!\.tex; C\.tB\.value = G \? G\.tex : groundTex; C\.uProgress\.value = wipeOut; C\.uParA\.value = 0; \}/, 'the fourth wipe\'s far side is the texel');
  assert.match(loop, /else if \(s5 === 'whole'\) \{ C\.tA\.value = G!\.tex; C\.tB\.value = G!\.tex; C\.uProgress\.value = 0; C\.uParA\.value = 0; \}/, 'the rest: the texel copied');
  assert.match(loop, /if \(G && !probe && holds\(\{ mode: s5, cover, drawnAt: flatAt, size \}\)\) G\.stats\.held\+\+;/, 'held: no draw');
  assert.match(loop, /flatAt = s5 === 'whole' && cover <= 0 \? size : null;/);
  assert.match(loop, /if \(G\) \{ G\.stats\.mode = s5; G\.mark\(underGround\(s5, s5in, wipeOut\)\); \}/);
  assert.match(loop, /start\(\) \{ if \(running\) return; running = true; flatAt = null;/, 'a restarted loop draws');
  assert.match(loop, /stop\(\) \{ running = false; cancelAnimationFrame\(raf\); ctx\.signup\?\.mark\(false\); \}/, 'a stopped loop draws no ground');
  assert.doesNotMatch(loop, /S5\.step|s5want|p5/, 'the jar\'s frame is gone');
  const hero = read('src/scripts/hero/hero.ts');
  assert.match(hero, /if \(signup\) life\.onKill\(\(\) => \{ signup\.dispose\(\); window\.__skreedSignupFrame\?\.\(\{ on: false, cover: 0, wipe: 0, pour: null \}\); \}\);/, 'the mark goes with the island, and the page is told so (a cut\'s mask or a seam\'s cover cleared)');
  const director = read('src/scripts/hero/section4/director.ts');
  assert.match(director, /const want = on \|\| !!seam;\n\s*if \(want !== drawn\) \{ drawn = want; syncMotion\(\); \}/, 'drawn while the section is on screen or a seam runs over it (the hall-less director, 2026-11-03)');
  assert.match(director, /if \(drawn\) \{\n\s*const live = state === 'world';\n\s*carousel\.look\(live \? lookX : 0, live \? lookY : 0, live && aimed\);\n\s*carousel\.update\(f\.t, f\.dt, curW, curH\); tex = carousel\.out; toneDark = sceneTone\(\);/);
});
