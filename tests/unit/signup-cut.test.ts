// The fourth wipe's clear line (src/scripts/signup/cut.ts; docs/specs/section-5-picture.md 18; Sam, 2026-11-03: "i could
// see that box"): below the line every pixel of the island's cut is the incoming frame whatever its texels, a few px above
// it the worst texel is not yet; the line's numbers are the shader's own (both copies of wipe()); the mask's first stop
// lies on the line, as CSS places a linear gradient's stops on an element.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CUT, clearLine, clearMask } from '../../src/scripts/signup/cut.ts';

// wipe() in hero/v11/glsl.ts and hero/post/shaders.ts, ported: the share of a pixel that is the incoming frame
const linstep = (a: number, b: number, x: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const falloff = (x: number, start: number, end: number, margin: number, progress: number) => {
  const m = margin * Math.sign(end - start), p = start - m + (end - (start - m)) * progress;
  return linstep(p + m, p, x);
};
function cutAt(u: number, v: number, prog: number, aspect: number, r: number, b: number): number {
  if (prog <= 0) return 0;
  if (prog >= 1) return 1;
  const slopeDisp = (b * 2 - 1) * 0.4, slope = -0.2 * aspect, incl = u + slopeDisp, incP = prog * (1 + Math.abs(slope));
  const sweep = v + incl * Math.abs(slope);
  return falloff(r, 0, 1, 2.0, falloff(sweep, 0, 1, 0.2, incP));
}
const VIEWS: [number, number][] = [[1512, 827], [1280, 800], [1280, 500], [1920, 1080], [390, 844], [360, 780], [844, 390]];
const TEXELS = [0, 0.25, 0.5, 0.75, 1];

test('below the clear line every pixel is the incoming frame for any texel; 2 px above it the worst texel is not', () => {
  for (const [cw, ch] of VIEWS) {
    const a = cw / ch;
    for (let w = 0.05; w < 1; w += 0.1) {
      const { c, k } = clearLine(w, cw, ch, a);
      for (let x = 0; x <= cw; x += cw / 24) {
        const yl = c + k * x;
        for (let y = Math.max(0, Math.ceil(yl)); y <= ch; y += 7) {
          for (const r of TEXELS) for (const b of TEXELS) assert.ok(cutAt(x / cw, 1 - y / ch, w, a, r, b) >= 1 - 1e-9, `${cw}x${ch} w ${w.toFixed(2)} at (${x.toFixed(0)}, ${y})`);
        }
        if (yl - 2 >= 0 && yl - 2 <= ch) assert.ok(cutAt(x / cw, 1 - (yl - 2) / ch, w, a, 1, 1) < 1, `${cw}x${ch} w ${w.toFixed(2)}: the line is the boundary at x ${x.toFixed(0)}`);
      }
    }
  }
});

test('the line falls 0.2 px per px to the right, starts under the foot at the cut\'s start and clears the frame by its end', () => {
  for (const [cw, ch] of VIEWS) {
    const a = cw / ch;
    assert.ok(Math.abs(clearLine(0.5, cw, ch, a).k - CUT.slope) < 1e-12);
    assert.ok(clearLine(0, cw, ch, a).c > ch, 'nothing clear before the cut starts');
    const end = clearLine(1, cw, ch, a);
    assert.ok(end.c + end.k * cw <= 0.05 * cw + 1e-9, 'at the end the line has left all but the top corner\'s worst texels');
  }
});

test('the clear line\'s numbers are both copies of wipe()\'s', () => {
  for (const f of ['src/scripts/hero/v11/glsl.ts', 'src/scripts/hero/post/shaders.ts']) {
    const src = readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
    for (const line of [
      'float m = margin * sign(end - start); float p = mix(start - m, end, progress); return linstep(p + m, p, x);',
      `float slopeDisp = (st.b * 2.0 - 1.0) * ${CUT.disp.toFixed(1)};`,
      `float slope = -${CUT.slope.toFixed(1)} * uAspect;`,
      'float incP = uProgress * (1.0 + abs(slope));',
      'float sweep = vUv.y + incl * abs(slope);',
      `float cutDiag = falloff(sweep, 0.0, 1.0, ${CUT.margin.toFixed(1)}, incP);`,
      'float cut = falloff(st.r, 0.0, 1.0, 2.0, cutDiag);',
    ]) assert.ok(src.includes(line), `${f}: ${line}`);
  }
});

test('the mask\'s first stop lies on the clear line, the lead past it, in the element\'s own px', () => {
  const pos = (W: number, Hh: number, deg: number, x: number, y: number) => {
    // CSS Images 3: the gradient line through the centre at the angle, its length |W sin| + |H cos|; a point's position on it
    const th = (deg * Math.PI) / 180, dx = Math.sin(th), dy = -Math.cos(th), L = Math.abs(W * dx) + Math.abs(Hh * dy);
    return L / 2 + (x - W / 2) * dx + (y - Hh / 2) * dy;
  };
  for (const [cw, ch] of VIEWS) {
    const canvas = { left: 0, top: 0, width: cw, height: ch }, a = cw / ch;
    for (const el of [{ left: 0, top: 0.4 * ch, width: cw, height: ch }, { left: 0, top: -0.3 * ch, width: cw, height: 1.6 * ch }, { left: 12, top: 0.9 * ch, width: cw - 24, height: ch }]) {
      for (const w of [0.2, 0.5, 0.8]) {
        const m = clearMask(w, canvas, a, el, 7, 30);
        const [, deg, t0, t1] = m.match(/^linear-gradient\(([\d.]+)deg, transparent ([-\d.]+)px, #000 ([-\d.]+)px\)$/)!.map(Number);
        assert.ok(Math.abs(t1 - t0 - 30) < 0.11);
        const { c, k } = clearLine(w, cw, ch, a);
        for (const X of [el.left, el.left + el.width / 2, el.left + el.width]) {
          const Y = c + k * X;   // on the clear line, in the viewport (the canvas at the origin)
          assert.ok(Math.abs(pos(el.width, el.height, deg, X - el.left, Y - el.top) - (t0 - 7)) < 0.1, `${cw}x${ch} w ${w} at X ${X}`);
        }
      }
    }
  }
});
