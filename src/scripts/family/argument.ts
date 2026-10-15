// The argument screen (ciao's, measured; docs/specs/family-page.md 21; exception E-F3). ciao's letters: twelve SVG shapes
// in a 1314 x 405 box, two rows (ZERO over BULLSHIT, the short row over the long one, both from the left edge, the long
// row the box's width), caps 184.6 units tall, a 25.2 gap between the rows; the box 80 percent of the width (1400 px at
// most), centred; fill the flavour's light colour at 0.72, drop shadows 80 px in the light colour and 90 px in the dark
// one, screen blend; a backdrop blur of 2rem (28 px at its 14 px root) masked to the letters, faded in 1 s after the
// pop; each letter from alpha 0 and scale 0.6 to 1 in 0.5 s with back.out(2), staggered 0.04 s after a 0.4 s delay when
// the section enters, and out in 0.4 s with power2.in when it leaves. Ours: GO over BEYOND BASIC in Poppins 700 (the
// brand's display face; ciao's is a condensed black slanted face we cannot ship, and the brand bans slanted type), the
// long row the box's width, the caps and the row gap in ciao's proportion to the cap height; one <text> per letter so
// each pops on its own; the blur clipped by a copy of the rows in a clipPath.
import { ARGUMENT } from './copy.ts';
import type { Smoke } from './smoke.ts';

const NS = 'http://www.w3.org/2000/svg';
/** Poppins 700's cap height is 0.705 em; ciao's row gap over its cap height, 25.2 / 184.6. */
export const ARG = { rows: ARGUMENT.rows, W: 1314, gapOverCap: 25.2 / 184.6, cap: 0.705 } as const;

function backOutEase(s: number): string { const pts: number[] = []; const n = 32; for (let i = 0; i <= n; i++) { const u = i / n - 1; pts.push(Math.round(((s + 1) * u * u * u + s * u * u + 1) * 1000) / 1000); } return `linear(${pts.join(', ')})`; }
const EASE_BACK = typeof CSS !== 'undefined' && CSS.supports?.('animation-timing-function', 'linear(0, 1)') ? backOutEase(2) : 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export interface Argument { show(on: boolean): void; layout(): void; scale(): void; shown(): boolean; laid(): boolean }

export function createArgument(svg: SVGSVGElement, clip: SVGClipPathElement, blur: HTMLElement, smoke: Smoke, reduced: () => boolean, track: (e: string, p: Record<string, number>) => void): Argument {
  let letters: SVGTextElement[] = [], clipRows: SVGTextElement[] = [], laid = false, shown = false, anims: Animation[] = [];
  const mkText = (s: string, x: string | number, y: string | number, size: string | number, cls?: string) => { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', String(x)); t.setAttribute('y', String(y)); t.setAttribute('font-size', String(size)); if (cls) t.setAttribute('class', cls); t.textContent = s; return t; };
  function layout(): void {
    if (laid || !document.fonts || document.fonts.status !== 'loaded') return;
    const probe = mkText(ARG.rows[1], 0, 0, 100); probe.setAttribute('visibility', 'hidden'); svg.appendChild(probe);
    const w100 = probe.getComputedTextLength();
    if (!(w100 > 0)) { probe.remove(); return; }   // not laid out yet (hidden by display): again on the next call
    const F = ARG.W / w100 * 100, cap = ARG.cap * F, gap = ARG.gapOverCap * cap, Hh = 2 * cap + gap;
    svg.setAttribute('viewBox', `0 0 ${ARG.W} ${Hh.toFixed(2)}`);
    letters.forEach((t) => t.remove()); letters = []; clip.replaceChildren(); clipRows = [];
    ARG.rows.forEach((row, r) => {
      const y = r === 0 ? cap : Hh;
      probe.textContent = row; probe.setAttribute('font-size', F.toFixed(3));
      for (let i = 0; i < row.length; i++) {
        if (row[i] === ' ') continue;
        const x = probe.getStartPositionOfChar(i).x;
        const t = mkText(row[i], x.toFixed(2), y.toFixed(2), F.toFixed(3), 'arg-t');
        svg.appendChild(t); letters.push(t);
      }
      const c = mkText(row, 0, y.toFixed(2), F.toFixed(3)); clip.appendChild(c); clipRows.push(c);
    });
    probe.remove();
    laid = true;
    scale();
    track('argument_layout', { fontSize: Math.round(F), letters: letters.length });
  }
  // the clip copies the rows in the blur layer's own pixels: scaled by the box's width over the viewBox's
  function scale(): void {
    if (!laid) return;
    const k = svg.getBoundingClientRect().width / ARG.W;
    if (!(k > 0)) return;
    clipRows.forEach((c) => c.setAttribute('transform', `scale(${k.toFixed(5)})`));
  }
  function show(on: boolean): void {
    if (on === shown) return;
    shown = on;
    if (on && !laid) layout();
    const still = reduced();
    anims.forEach((a) => a.cancel()); anims = [];
    letters.forEach((t, i) => {
      if (still || !t.animate) { t.style.opacity = on ? '1' : '0'; t.style.transform = on ? 'none' : 'scale(0.6)'; return; }
      t.style.opacity = ''; t.style.transform = '';
      anims.push(t.animate(on ? [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }] : [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.6)' }],
        on ? { duration: 500, delay: 400 + 40 * i, easing: EASE_BACK, fill: 'both' } : { duration: 400, easing: 'cubic-bezier(0.333, 0, 0.667, 0)', fill: 'both' }));
    });
    if (still || !blur.animate) blur.style.opacity = on ? '1' : '0';
    else { blur.style.opacity = ''; anims.push(blur.animate([{ opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }], on ? { duration: 400, delay: 1000, easing: 'cubic-bezier(0.333, 1, 0.667, 1)', fill: 'both' } : { duration: 400, easing: 'cubic-bezier(0.333, 0, 0.667, 0)', fill: 'both' })); }
    smoke.run(on);
    if (on) track('argument_shown', {});
  }
  document.fonts?.ready.then(() => { if (shown) { layout(); show(false); show(true); } });
  addEventListener('resize', scale);
  return { show, layout, scale, shown: () => shown, laid: () => laid };
}
