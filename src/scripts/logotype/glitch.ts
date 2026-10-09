// The logotype glitch (prototype template.html lines 1156 to 1237; igloo's logo glitch re-created in SVG):
// a burst breaks the wordmark into thin horizontal slabs shifted sideways by up to about 1.05% of its width, three slab
// patterns per burst, opacity flicker 0.85 + 0.15 sin(30p + phase), then it snaps clean. Each burst splits the slabs in one
// near-complementary pair of the hero's shades, drawn through var(--shade-<id>) (D30; exception E-24).
// No three.js import: it runs on every page and every tier (D25).
import { GLITCH_PAIRS, GLITCH_LIGHT } from '../../config/shades.gen.ts';
import { reducedMQ } from '../motion.ts';

export interface GlitchOptions {
  /** share of slabs that get the colour split (HERO_PARAMS.logoSplit) */
  split: number;
  /** the idle twitch every 8 to 16 s (HERO_PARAMS.logoIdle); 0 in production (D20) */
  idle: number;
}

export interface LogoGlitch {
  burst(duration: number, delay?: number): void;
  intro(delay: number): void;
  setTone(light: boolean): void;
  /** dev and Tune only: change the split share or switch the idle twitch on */
  configure(opts: Partial<GlitchOptions>): void;
}

const NS = 'http://www.w3.org/2000/svg';
const LVW = 1209.46, LVH = 292.9, AMP = LVW * 0.0105, ROWS = 8, SEGS = 6;

export function createLogoGlitch(link: HTMLAnchorElement, options: GlitchOptions): LogoGlitch {
  const cfg = { ...options };
  const svg = link.querySelector('svg') as SVGSVGElement, defs = svg.querySelector('defs') as SVGDefsElement;
  const base = svg.querySelector('.logo-base') as SVGUseElement, layer = svg.querySelector('.logo-tiles') as SVGGElement;
  const tiles: { r: SVGRectElement; g: SVGGElement; u: SVGUseElement; ua: SVGUseElement; ub: SVGUseElement }[] = [];
  for (let i = 0; i < ROWS * SEGS; i++) {
    const cp = document.createElementNS(NS, 'clipPath'); cp.id = 'lg-c' + i;
    const r = document.createElementNS(NS, 'rect'); r.setAttribute('shape-rendering', 'crispEdges'); cp.append(r); defs.append(cp);
    const g = document.createElementNS(NS, 'g'); g.setAttribute('clip-path', `url(#lg-c${i})`);
    const mk = () => { const e = document.createElementNS(NS, 'use'); e.setAttribute('href', '#skreed-wordmark'); return e; };
    const ua = mk(), ub = mk(), u = mk(); g.append(ua, ub, u); layer.append(g);   // two coloured ghosts behind the Pearl Whisper copy
    tiles.push({ r, g, u, ua, ub });
  }
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const kick = () => { const v = Math.random() * 2 - 1; return Math.sign(v) * Math.sqrt(Math.abs(v)) * AMP; };
  // opacity balanced by lightness, so a pale shade (Sunbeam) and a deep one (Amethyst) read with the same weight
  const ghostAlpha = (id: string) => Math.min(0.9, Math.max(0.5, 0.74 * Math.sqrt(0.72 / GLITCH_LIGHT[id])));
  let pair = GLITCH_PAIRS[0];
  const ghost = (e: SVGUseElement, id: string, dx: number) => {
    e.style.color = `var(--shade-${id})`; e.setAttribute('opacity', ghostAlpha(id).toFixed(2));
    e.setAttribute('transform', `translate(${dx.toFixed(2)} 0)`); e.removeAttribute('display');
  };
  let snap = (v: number) => v;
  function slice() {
    let i = 0, y = 0;
    for (let row = 0; row < ROWS && y < LVH; row++) {
      let h = row === ROWS - 1 ? LVH - y : snap(y + LVH * rand(0.05, 0.24)) - y; if (LVH - (y + h) < LVH * 0.05) h = LVH - y;
      let x = 0;
      for (let k = 0; k < SEGS && x < LVW; k++, i++) {
        let w = k === SEGS - 1 ? LVW - x : snap(x + LVW * rand(0.06, 0.26)) - x; if (LVW - (x + w) < LVW * 0.04) w = LVW - x;
        const left = x === 0 ? -AMP : x, right = x + w >= LVW ? LVW + AMP : x + w, t = tiles[i];
        t.r.setAttribute('x', String(left)); t.r.setAttribute('width', String(right - left)); t.r.setAttribute('y', String(y)); t.r.setAttribute('height', String(h));
        const kx = kick(); t.u.setAttribute('transform', `translate(${kx.toFixed(2)} 0)`); t.g.removeAttribute('display'); x += w;
        if (Math.random() < cfg.split) {   // here and there, not on every slab
          const split = AMP * rand(1.4, 2.6), flip = Math.random() < 0.5;
          ghost(t.ua, pair[flip ? 1 : 0], kx - split); ghost(t.ub, pair[flip ? 0 : 1], kx + split);
        } else { t.ua.setAttribute('display', 'none'); t.ub.setAttribute('display', 'none'); }
      }
      y += h;
    }
    for (; i < tiles.length; i++) tiles[i].g.setAttribute('display', 'none');
  }
  let p = 1, step = -1, phase = 0, dur = 0.25, startAt = 0, raf = 0;
  function render() {
    if (p >= 1) { layer.setAttribute('display', 'none'); base.removeAttribute('display'); svg.style.opacity = ''; step = -1; return; }
    const k = Math.min(2, Math.floor(p * 3));
    if (k !== step) { step = k; slice(); }
    base.setAttribute('display', 'none'); layer.removeAttribute('display');
    svg.style.opacity = (0.85 + 0.15 * Math.sin(p * 30 + phase)).toFixed(3);
  }
  function tick(now: number) {
    if (now < startAt) { raf = requestAnimationFrame(tick); return; }
    p = Math.min(1, (now - startAt) / (dur * 1000)); render();
    if (p < 1) raf = requestAnimationFrame(tick);
  }
  function burst(duration: number, delay = 0) {
    if (reducedMQ.matches) return;   // read live before every burst
    const unit = LVW / Math.max(1, svg.getBoundingClientRect().width * devicePixelRatio);
    snap = (v) => Math.round(v / unit) * unit;            // cut on device pixels, no hairline seams
    phase = Math.random() * 12.4242; step = -1; dur = duration; p = 0;
    pair = GLITCH_PAIRS[Math.floor(Math.random() * GLITCH_PAIRS.length)];
    cancelAnimationFrame(raf); startAt = performance.now() + delay * 1000; raf = requestAnimationFrame(tick);
  }
  link.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') burst(0.25); });
  link.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') burst(0.25); });
  link.addEventListener('focus', () => { if (link.matches(':focus-visible')) burst(0.25); });
  // igloo's intro glitch, split in the pair the mark shows at rest (Sky and Crimson)
  const intro = (delay: number) => { burst(0.5, delay); pair = GLITCH_PAIRS[0]; };
  let idleTimer = 0;
  const scheduleIdle = () => {
    clearTimeout(idleTimer);
    if (!cfg.idle) return;
    idleTimer = window.setTimeout(() => { if (cfg.idle) burst(0.25); scheduleIdle(); }, rand(8000, 16000));
  };
  scheduleIdle();
  return {
    burst, intro,
    setTone: (light) => { link.dataset.tone = light ? 'light' : 'dark'; },
    configure: (o) => { Object.assign(cfg, o); scheduleIdle(); },
  };
}
