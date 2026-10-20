// Section 3's answer pictures (Sam, 2026-10-20: "that image should appear only when u hover over that option ... have
// some sort of animation when the text is appearing dont just straight up blankly slap the image on the screen on hover").
// The picture decodes in as the text does (decode.ts, section 2's label timings): the frame is cut into vertical strips,
// each strip fades in left to right over 0.4 s while it shows the slice of a neighbouring strip, counting down to its
// own by 0.75 s, the way each glyph rolls through the glyphs after it; the frame settles from 1.03 to 1 on transform.
// Hide: the strips wipe out right to left over 0.2 s. Reduced motion: a 0.2 s fade, no roll, no scale.
// Each answer's <picture> (Quiz.astro) only loads the right source; the strips draw it as a background of the chosen
// source, sized as object-fit: cover would, through the CSSOM (the CSP takes no style attributes).
import { HIDE, REDUCED, REVEAL_ALPHA, REVEAL_ROLL, ROLL_STEPS } from './decode.ts';

export const STRIPS = 12, SCALE_FROM = 1.03;
const clamp = (v: number) => Math.max(0, Math.min(1, v));

interface Shot { key: string; img: HTMLImageElement; layer: HTMLDivElement; strips: HTMLSpanElement[]; a: number[]; a0: number[]; shown: number[]; on: boolean; t0: number; settled: boolean; hidden: boolean; wait: (() => void)[]; w: number; h: number; cw: number; ch: number; ox: number; oy: number; scale: number; scale0: number }

export interface Pictures {
  has(key: string): boolean;
  show(key: string): Promise<void>;
  hide(key: string): Promise<void>;
  /** every picture off at once, no animation (the card leaves) */
  clear(): void;
  /** recompute the cover geometry (the frame changed size) */
  layout(): void;
  /** whether the frame is drawn at all (a hidden card, or a phone with no room for it, draws none) */
  visible(): boolean;
}

/** One controller per visual card: `frame` holds a <picture class="qz-pic" data-persona> per answer. */
export function createPictures(frame: HTMLElement, reduced: () => boolean, onBusy: (busy: boolean) => void = () => {}): Pictures {
  const shots = new Map<string, Shot>(), active = new Set<Shot>();
  let raf = 0, want: string | null = null;   // the picture last asked for: one still loading when another is asked for (or none) never comes on
  const rendered = () => frame.getClientRects().length > 0;
  for (const pic of frame.querySelectorAll<HTMLElement>('.qz-pic')) {
    const img = pic.querySelector('img'); if (!img || !pic.dataset.persona) continue;
    shots.set(pic.dataset.persona, { key: pic.dataset.persona, img, layer: null as unknown as HTMLDivElement, strips: [], a: [], a0: [], shown: [], on: false, t0: 0, settled: true, hidden: true, wait: [], w: 0, h: 0, cw: 0, ch: 0, ox: 0, oy: 0, scale: 1, scale0: 1 });
  }

  function geometry(s: Shot) {
    const W = frame.clientWidth, H = frame.clientHeight, iw = s.img.naturalWidth || 1, ih = s.img.naturalHeight || 1, k = Math.max(W / iw, H / ih);
    s.w = W; s.h = H; s.cw = iw * k; s.ch = ih * k; s.ox = (W - s.cw) / 2; s.oy = (H - s.ch) / 2;
    const url = `url("${(s.img.currentSrc || s.img.src).replace(/"/g, '%22')}")`;
    s.strips.forEach((st, i) => { st.style.backgroundImage = url; st.style.backgroundSize = `${s.cw}px ${s.ch}px`; slice(s, i, s.shown[i] ?? i, true); });
  }
  /** strip i shows slice j of the covered image */
  function slice(s: Shot, i: number, j: number, force = false) {
    if (!force && s.shown[i] === j) return;
    s.shown[i] = j; s.strips[i].style.backgroundPosition = `${(s.ox - (j * s.w) / STRIPS).toFixed(2)}px ${s.oy.toFixed(2)}px`;
  }
  function build(s: Shot) {
    if (s.layer) return;
    const layer = document.createElement('div'); layer.className = 'qz-shot'; layer.dataset.persona = s.key;
    for (let i = 0; i < STRIPS; i++) {
      const st = document.createElement('span'); st.className = 'qz-strip';
      st.style.left = `${(i * 100) / STRIPS}%`; st.style.width = `calc(${100 / STRIPS}% + 1px)`; st.style.opacity = '0';
      layer.append(st); s.strips.push(st); s.a.push(0); s.a0.push(0); s.shown.push(i);
    }
    frame.append(layer); s.layer = layer; geometry(s);
  }
  const done = (s: Shot) => { const w = s.wait; s.wait = []; for (const f of w) f(); };
  function step(s: Shot, now: number, instant: boolean) {
    const t = instant ? 1e3 : Math.max(0, (now - s.t0) / 1000), xs = (i: number) => i / (STRIPS - 1);
    const put = (i: number, a: number) => { if (Math.abs(a - s.a[i]) > 1e-3 || a === 0 || a === 1) { s.a[i] = a; s.strips[i].style.opacity = a >= 1 ? '' : a.toFixed(3); } };
    if (s.on) {
      if (reduced()) { const a = Math.min(1, t / REDUCED); for (let i = 0; i < STRIPS; i++) { put(i, a); slice(s, i, i); } s.layer.style.transform = ''; if (a >= 1) s.settled = true; return; }
      const u = Math.min(1, t / REVEAL_ALPHA), v = Math.min(1, t / REVEAL_ROLL);
      for (let i = 0; i < STRIPS; i++) { const x = xs(i); put(i, clamp(11 * u - 10 * x)); slice(s, i, (i + (Math.floor((1 - clamp(2 * v - x)) * ROLL_STEPS) % 8)) % STRIPS); }
      const e = 1 - (1 - v) ** 3; s.scale = v >= 1 ? 1 : SCALE_FROM - (SCALE_FROM - 1) * e; s.layer.style.transform = s.scale === 1 ? '' : `scale(${s.scale.toFixed(4)})`;
      if (t >= REVEAL_ROLL) s.settled = true;
    } else {
      const u = Math.min(1, t / HIDE);
      for (let i = 0; i < STRIPS; i++) { put(i, Math.min(s.a0[i], reduced() ? 1 - u : clamp(11 * (1 - u) - 10 * xs(i)))); slice(s, i, i); }
      // a picture wiped out before it settled finishes its scale to 1 over the wipe, so no scale outlasts it
      s.scale = s.scale0 + (1 - s.scale0) * u; s.layer.style.transform = s.scale >= 1 ? '' : `scale(${s.scale.toFixed(4)})`;
      if (u >= 1) { s.hidden = true; s.scale = 1; s.layer.style.visibility = 'hidden'; s.layer.style.transform = ''; }
    }
  }
  function frameLoop(now: number) {
    raf = 0;
    const instant = document.visibilityState === 'hidden';
    for (const s of [...active]) { step(s, now, instant); if (s.on ? s.settled : s.hidden) { active.delete(s); done(s); } }
    if (active.size) raf = requestAnimationFrame(frameLoop); else onBusy(false);
  }
  function start(s: Shot, on: boolean): Promise<void> {
    if (s.on === on && (on ? s.settled : s.hidden)) return Promise.resolve();
    if (s.on === on && active.has(s)) return new Promise((res) => s.wait.push(res));   // under way the same way: join it
    if (s.on !== on) { s.on = on; if (!on) { for (let i = 0; i < STRIPS; i++) s.a0[i] = s.a[i]; s.scale0 = s.scale; } }
    if (on) { s.layer.style.visibility = 'visible'; frame.append(s.layer); }   // the picture coming in is drawn over the one going out
    s.t0 = performance.now(); s.settled = false; s.hidden = false;
    const p = new Promise<void>((res) => s.wait.push(res));
    active.add(s); onBusy(true);
    if (document.visibilityState === 'hidden') { step(s, 0, true); active.delete(s); done(s); if (!active.size) onBusy(false); }
    else if (!raf) raf = requestAnimationFrame(frameLoop);
    return p;
  }
  addEventListener('resize', () => { for (const s of shots.values()) if (s.layer) geometry(s); });

  return {
    has: (key) => shots.has(key),
    async show(key) {
      const s = shots.get(key); if (!s) return;
      want = key;
      if (!rendered()) return;   // no frame drawn: nothing loads, nothing to wait for
      if (!s.img.complete || !s.img.naturalWidth) { try { await s.img.decode(); } catch { return; } }   // a picture that never loads stays off
      if (want !== key || !rendered()) return;   // the pointer left (or the question went) while it loaded
      build(s); geometry(s);
      for (const o of shots.values()) if (o !== s && o.layer && o.on) void start(o, false);
      return start(s, true);
    },
    hide(key) { if (want === key) want = null; const s = shots.get(key); return s?.layer ? start(s, false) : Promise.resolve(); },
    clear() { want = null; for (const s of shots.values()) if (s.layer) { active.delete(s); s.on = false; s.hidden = true; s.settled = true; s.layer.style.visibility = 'hidden'; s.layer.style.transform = ''; s.scale = 1; for (let i = 0; i < STRIPS; i++) { s.a[i] = 0; s.strips[i].style.opacity = '0'; } done(s); } if (!active.size) onBusy(false); },
    layout() { for (const s of shots.values()) if (s.layer) geometry(s); },
    visible: rendered,
  };
}
