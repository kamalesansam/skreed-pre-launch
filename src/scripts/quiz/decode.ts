// Section 3's decode (docs/specs/quiz.md 4; Sam, 2026-10-19: "keep the same font animation as how it is on the main
// section 2, the decoding animation, for each question and option"). Section 2's label animation (src/scripts/hero/
// section2/labels.ts, measured on igloo), applied to the quiz's text. Reveal: a left-to-right alpha wipe over 0.4 s while
// each glyph counts down through the five glyphs after it in its 8-glyph block, settled at 0.75 s. Hide: a right-to-left
// alpha wipe over 0.2 s. Reduced motion: a 0.2 s fade, no roll. The constants and the roll are labels.ts's; the unit test
// (tests/unit/quiz-decode.test.ts) reads both files and fails if they part.
//
// prepare(el) splits an element's text, once, into a visually hidden copy (what assistive technology reads, in Sam's
// case) and an aria-hidden row of one span per character, upper-cased as section 2 prints its labels. Only printable
// ASCII rolls: the font has no U+201B or U+201F, so a curly quote, the no-break space and anything else outside ASCII
// fades in without rolling, and no glyph ever falls back to another font mid-roll (the line would change width).

export const REVEAL_ALPHA = 0.4, REVEAL_ROLL = 0.75, ROLL_STEPS = 5.753, HIDE = 0.2, REDUCED = 0.2;
/** labels.ts's roll, limited to printable ASCII (see above) */
export const roll = (ch: string, k: number): string => { const c = ch.charCodeAt(0); if (c <= 32 || c > 126 || !k) return ch; const b = c & ~7; return String.fromCharCode(b + ((c - b + k) % 8)); };
const clamp = (v: number) => Math.max(0, Math.min(1, v));

interface Glyph { s: HTMLSpanElement; ch: string; shown: string; a: number; a0: number }
interface Run { el: HTMLElement; text: string; glyphs: Glyph[]; on: boolean; t0: number; settled: boolean; hidden: boolean; wait: (() => void)[] }

export interface Decoder {
  /** split the element's text (or `text`) into glyphs, hidden (or `visible`, settled as it stands); a second call with the same text keeps the glyphs */
  prepare(el: HTMLElement, text?: string, visible?: boolean): void;
  /** the decode in, after `delay` seconds; resolves when settled */
  show(el: HTMLElement, delay?: number): Promise<void>;
  /** the wipe out; resolves when every glyph is gone */
  hide(el: HTMLElement, delay?: number): Promise<void>;
  /** the decode in for a list, one after another at `step` seconds (the step shrinks so the last starts within 0.6 s) */
  showAll(els: readonly HTMLElement[], step?: number): Promise<void>;
  hideAll(els: readonly HTMLElement[]): Promise<void>;
  /** new text, shown at once with no animation (a button's sending state) */
  set(el: HTMLElement, text: string): void;
  /** straight to hidden, no animation (text left visible by set() before its part decodes in again) */
  conceal(el: HTMLElement): void;
}

export function createDecoder(reduced: () => boolean, onBusy: (busy: boolean) => void = () => {}): Decoder {
  const runs = new WeakMap<HTMLElement, Run>(), active = new Set<Run>();
  let raf = 0;
  const put = (g: Glyph, a: number) => { if (Math.abs(a - g.a) > 1e-3 || a === 0 || a === 1) { g.a = a; g.s.style.opacity = a >= 1 ? '' : a.toFixed(3); } };
  const glyph = (g: Glyph, ch: string) => { if (ch !== g.shown) { g.shown = ch; g.s.textContent = ch; } };

  function build(el: HTMLElement, text: string, visible: boolean): Run {
    el.textContent = '';
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const row = document.createElement('span'); row.className = 'dc'; row.setAttribute('aria-hidden', 'true');
    const glyphs: Glyph[] = [];
    // every character gets a span, spaces too (labels.ts does the same): a link's underline is drawn per span, so a bare
    // space would show its piece of underline before the words have decoded
    for (const ch of text.toUpperCase()) { const s = document.createElement('span'); s.textContent = ch; if (!visible) s.style.opacity = '0'; row.append(s); glyphs.push({ s, ch, shown: ch, a: visible ? 1 : 0, a0: 0 }); }
    el.append(sr, row);
    const r: Run = { el, text, glyphs, on: visible, t0: 0, settled: true, hidden: !visible, wait: [] };
    runs.set(el, r); return r;
  }
  function prepare(el: HTMLElement, text?: string, visible = false): Run {
    const r = runs.get(el);
    // collapse the markup's own whitespace only: \s would also take the no-break space in "11 p.m." (Sam's config keeps it)
    // markup the server split already (Quiz.astro: a sentence-case .sr-only copy beside an aria-hidden one) gives its copy
    const src = el.querySelector(':scope > .sr-only')?.textContent ?? el.textContent ?? '';
    const t = text ?? r?.text ?? src.replace(/[ \t\n\r\f]+/g, ' ').replace(/^ | $/g, '');
    if (r && r.text === t) return r;
    if (r) { active.delete(r); done(r); }
    return build(el, t, visible);
  }
  function done(r: Run) { const w = r.wait; r.wait = []; for (const f of w) f(); }
  function step(r: Run, now: number, instant: boolean) {
    const t = instant ? 1e3 : Math.max(0, (now - r.t0) / 1000), n = r.glyphs.length, xs = (i: number) => (n > 1 ? i / (n - 1) : 0);
    if (r.on) {
      if (reduced()) { const a = Math.min(1, t / REDUCED); for (const g of r.glyphs) { put(g, a); glyph(g, g.ch); } if (a >= 1) r.settled = true; return; }
      const u = Math.min(1, t / REVEAL_ALPHA), v = Math.min(1, t / REVEAL_ROLL);
      r.glyphs.forEach((g, i) => { const x = xs(i); put(g, clamp(11 * u - 10 * x)); glyph(g, roll(g.ch, Math.floor((1 - clamp(2 * v - x)) * ROLL_STEPS) % 8)); });
      if (t >= REVEAL_ROLL) r.settled = true;
    } else {
      const u = Math.min(1, t / HIDE);
      r.glyphs.forEach((g, i) => { put(g, Math.min(g.a0, reduced() ? 1 - u : clamp(11 * (1 - u) - 10 * xs(i)))); glyph(g, g.ch); });
      if (u >= 1) r.hidden = true;
    }
  }
  function frame(now: number) {
    raf = 0;
    const instant = document.visibilityState === 'hidden';
    for (const r of [...active]) { step(r, now, instant); if (r.on ? r.settled : r.hidden) { active.delete(r); done(r); } }
    if (active.size) raf = requestAnimationFrame(frame); else onBusy(false);
  }
  function start(r: Run, on: boolean, delay: number): Promise<void> {
    if (r.on === on && (on ? r.settled : r.hidden)) return Promise.resolve();
    // the same way while it is under way: join it, as labels.ts's setOn() does (restarting would flash the glyphs back)
    if (r.on === on && active.has(r)) return new Promise<void>((res) => r.wait.push(res));
    if (r.on !== on) { r.on = on; if (!on) for (const g of r.glyphs) g.a0 = g.a; }
    r.t0 = performance.now() + delay * 1000; r.settled = false; r.hidden = false;
    const p = new Promise<void>((res) => r.wait.push(res));
    active.add(r); onBusy(true);
    // a hidden page draws no frames: the text goes straight to its end state, so a background tab never stalls the quiz
    if (document.visibilityState === 'hidden') { step(r, 0, true); active.delete(r); done(r); if (!active.size) onBusy(false); }
    else if (!raf) raf = requestAnimationFrame(frame);
    return p;
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && active.size) { cancelAnimationFrame(raf); frame(performance.now()); } });

  return {
    prepare(el, text, visible) { prepare(el, text, visible); },
    show: (el, delay = 0) => start(prepare(el), true, delay),
    hide: (el, delay = 0) => start(prepare(el), false, delay),
    showAll(els, step = 0.05) { const s = els.length > 1 ? Math.min(step, 0.6 / (els.length - 1)) : 0; return Promise.all(els.map((el, i) => start(prepare(el), true, i * s))).then(() => {}); },
    hideAll(els) { return Promise.all(els.map((el) => start(prepare(el), false, 0))).then(() => {}); },
    set(el, text) { const r = prepare(el, text); active.delete(r); r.on = true; r.settled = true; r.hidden = false; for (const g of r.glyphs) { put(g, 1); glyph(g, g.ch); } done(r); },
    conceal(el) { const r = prepare(el); active.delete(r); r.on = false; r.settled = true; r.hidden = true; for (const g of r.glyphs) { put(g, 0); glyph(g, g.ch); } done(r); },
  };
}
