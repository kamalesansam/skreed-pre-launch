// The argument screen's smoke (docs/specs/family-page.md 21): our own looping procedural smoke in place of ciao's
// per-flavour video. Tileable value noise (three octaves, the lattice two cells tall over the screen, period 40 s)
// sampled at a low resolution (about 6,000 pixels) and scaled up by the canvas; per frame the lattice values at the
// current depth are precomputed per octave, so a pixel costs twelve lookups. The field drifts up one period and sways
// on a circle through the depth over the loop, so the loop is seamless. Colour: the shade's dark tint for the body of
// the smoke, its light tint for the brightest wisps, over the night. Runs only while the argument screen shows, at 30
// frames a second; reduced motion draws one still frame.
import { hexRgb } from './tint.ts';

export interface Smoke { tint(dark: string, light: string): void; run(on: boolean): void; stats(): { w: number; h: number; frames: number; msPerFrame: number; on: boolean } }

export function createSmoke(cv: HTMLCanvasElement, reduced: () => boolean): Smoke {
  const ctx = cv.getContext('2d', { alpha: false })!;
  let W = 0, H = 0, img: ImageData | null = null, raf = 0, on = false, last = 0, c1: [number, number, number] = [40, 40, 40], c2: [number, number, number] = [120, 120, 120];
  const T = 40, PY = 2, OCT = [1, 2, 4], AMPL = [0.5, 0.25, 0.125];
  const grids: { nx: number; ny: number; v: Float32Array; x0: number; y0: number; f: number }[] = [];
  const stats = { frames: 0, ms: 0 };
  function h3(x: number, y: number, z: number): number { let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791); n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  function size(): void {
    const vw = innerWidth || 1, vh = innerHeight || 1, a = vw / vh, w = Math.max(24, Math.round(Math.sqrt(6000 * a))), h = Math.max(24, Math.round(w / a));
    if (w === W && h === H) return;
    W = w; H = h; cv.width = W; cv.height = H; img = ctx.createImageData(W, H);
  }
  function frame(t: number): void {
    const ph = (t / T) * 2 * Math.PI, sx = 0.7 * Math.cos(ph), sz = 0.7 * Math.sin(ph), sy = (t / T) * PY, CX = PY * W / H, CYc = PY;
    for (let o = 0; o < OCT.length; o++) {
      const f = OCT[o], py = PY * f, zf = sz * f, zi = Math.floor(zf); let fz = zf - zi; fz = fz * fz * (3 - 2 * fz);
      const x0 = Math.floor(sx * f) - 1, x1 = Math.floor((CX + sx) * f) + 2, y0 = Math.floor(sy * f) - 1, y1 = Math.floor((CYc + sy) * f) + 2;
      const nx = x1 - x0 + 1, ny = y1 - y0 + 1;
      let g = grids[o];
      if (!g || g.nx !== nx || g.ny !== ny) g = grids[o] = { nx, ny, v: new Float32Array(nx * ny), x0, y0, f };
      g.x0 = x0; g.y0 = y0; g.f = f;
      for (let j = 0; j < ny; j++) { const ym = (((y0 + j) % py) + py) % py; for (let i = 0; i < nx; i++) { const xm = x0 + i; g.v[j * nx + i] = h3(xm, ym, zi) * (1 - fz) + h3(xm, ym, zi + 1) * fz; } }
    }
    const d = img!.data; let p = 0;
    for (let y = 0; y < H; y++) {
      const vy = (y + 0.5) / H * CYc + sy;
      for (let x = 0; x < W; x++, p += 4) {
        const vx = (x + 0.5) / W * CX + sx; let n = 0;
        for (let o = 0; o < OCT.length; o++) {
          const g = grids[o], fx = vx * g.f, fy = vy * g.f, xi = Math.floor(fx), yi = Math.floor(fy); let tx = fx - xi, ty = fy - yi;
          tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
          const b = (yi - g.y0) * g.nx + (xi - g.x0), v = g.v;
          n += AMPL[o] * ((v[b] * (1 - tx) + v[b + 1] * tx) * (1 - ty) + (v[b + g.nx] * (1 - tx) + v[b + g.nx + 1] * tx) * ty);
        }
        n /= 0.875;
        let lo = Math.min(1, Math.max(0, (n - 0.40) / 0.32)), hi = Math.min(1, Math.max(0, (n - 0.62) / 0.30));
        lo = lo * lo * (3 - 2 * lo); hi = hi * hi * (3 - 2 * hi); hi *= 0.55; lo *= 0.85;
        d[p] = Math.min(255, c1[0] * lo + c2[0] * hi); d[p + 1] = Math.min(255, c1[1] * lo + c2[1] * hi); d[p + 2] = Math.min(255, c1[2] * lo + c2[2] * hi); d[p + 3] = 255;
      }
    }
    ctx.putImageData(img!, 0, 0);
  }
  function draw(now: number): void {
    raf = 0;
    if (!on) return;
    if (now - last >= 31) {
      last = now; const t0 = performance.now(); size(); frame((now / 1000) % T);
      stats.frames++; stats.ms += performance.now() - t0;
    }
    if (!reduced()) raf = requestAnimationFrame(draw);
  }
  return {
    tint(dark, light) { c1 = hexRgb(dark); c2 = hexRgb(light); if (on && reduced()) { size(); frame((performance.now() / 1000) % T); } },
    run(v) { on = !!v; if (on) { if (!raf) raf = requestAnimationFrame(draw); } else { cancelAnimationFrame(raf); raf = 0; } },
    stats: () => ({ w: W, h: H, frames: stats.frames, msPerFrame: stats.frames ? +(stats.ms / stats.frames).toFixed(2) : 0, on }),
  };
}
