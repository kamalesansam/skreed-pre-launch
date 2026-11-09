// The hero's script, section "top" (docs/specs/redesign.md section 6, D15, D16, D19, E-RD-motion; Sam, 2026-11-09: "add
// a lot of animations for the main head text ... it shouldnt look dead" and "for the logo have the same glitch effect").
// Three jobs, none of which the first paint waits for (the entrance is CSS, src/styles/rd-hero.css):
//   1. DIFFERENT glitches, and is plain Rubik Black the rest of the time (D19, item 1, and D20; Sam, the same day: "the
//      font should look normal when not glitching, only when it glitches it should have that distorted effect"). The logotype's engine
//      (scripts/logotype/glitch.ts, which the corner mark and the countdown run on) cuts the word's glitch layer into
//      shifted slabs with its shade-pair ghosts for the length of a burst: one as the word lands, one every 3 to 7 s
//      while the hero is on screen, and one in answer to the scroll, as the page leaves the top and as the hero passes
//      a third of its way out. For exactly that long the plain letters are hidden.
//   2. The cue leaves once the page has scrolled 8 px and returns at the top; its chevrons rest while it is away.
//   3. With GSAP, scrubbed while the hero scrolls away: the three lines drift up at three speeds and come apart, the
//      photograph travels its spare height (parallax) and the veil deepens.
// The scroll listener only reads: wheel, touch and keys stay the browser's.
import { createLogoGlitch } from '../logotype/glitch.ts';
import { LOGO_SPLIT, IDLE_EVERY } from '../../config/glitch.ts';
import { onMotion, parallax } from './motion.ts';

/** the scroll, in px, past which the cue is hidden (spec D15) */
const CUE_OFF = 8;
/** the cue's fade, in ms (rd-hero.css's 0.5 s): its chevrons rest once it has run */
const CUE_FADE = 500;
/** the share of the hero's height at which the word glitches once more, on the way out and on the way back */
const BEAT = 0.35;
/** a burst's length, in seconds. The engine shows three slab patterns a burst, so each stands 0.2 s as the word
 * lands and about 0.13 s after that: long enough to be read as the word torn, and with a burst started every 3 to 7 s
 * the word is plain for nine tenths of the time (0.4 s of 5 on average, 0.4 s of 3 at the most) */
const BURST = { land: 0.6, scroll: 0.35, idle: 0.4 } as const;
/** the glitch face, as document.fonts knows it (redesign.css declares it; no page preloads it) */
const FACE = '400 1em "Rubik Glitch"';
/** how long the face's request waits, in ms, to be told of the first paint in a browser that reports none, and for
 * the first screen's photograph where it never answers: by then the entrance is nearly over and the paint long made */
const PAINT_WAIT = 1500;
/** how long the first burst waits for that face once it has been asked for, in ms, before it runs on the plain letters */
const FACE_WAIT = 3000;
/** the veil's strength once the hero has scrolled away; it starts at the PDF's 0.60, read from the CSS, so the
 * photograph leaves at half the light it opened with */
const VEIL_END = 0.8;
/** how far each line has drifted up when the hero has gone, in per cent of its own height: line 1, line 2, DIFFERENT.
 * The nearer the top a line stands the faster it leaves, so the gaps between the three open as the page scrolls:
 * by about 45 px each on a laptop as line 2 reaches the top, by about 30 px on a phone, where a line is 38 px */
const DRIFT = [-230, -140, -60] as const;

const sec = document.getElementById('top');
const word = sec?.querySelector<HTMLElement>('.rd-hero-word') ?? null;
const svg = word?.querySelector<SVGSVGElement>('.rd-hero-glitch') ?? null;
const cue = sec?.querySelector<HTMLElement>('.rd-hero-cue') ?? null;

// 1. the glitch. The layer over the word holds the word twice as SVG text in one group, the plain letters and the
// Rubik Glitch drawing on top of them, and the engine redraws that group as slabs. Seven rows of five slabs across the
// capitals; a kick is at most 1.25% of the word's width.
/** one burst of the word's glitch, in seconds: nothing until the word has landed and its face is settled */
let fire: (seconds: number) => void = () => {};
if (sec && word && svg) {
  const layer = svg.querySelector('.gl-tiles');
  const plain = svg.querySelector('[data-g="plain"]');
  const face = svg.querySelector('[data-g="face"]');
  const box = svg.viewBox.baseVal;
  const g = createLogoGlitch(svg, { split: LOGO_SPLIT, idle: 0, interactive: false,
    target: { href: '#rd-different', w: box.width, h: box.height, amp: 0.0125, rows: 7, segs: 5, prefix: 'rdd-' } });

  // The swap hangs on the engine's own switch. It shows its tiles group when a burst's first frame is drawn and hides
  // it when the burst ends; the observer copies that onto the word before the same frame is painted (its callback is
  // a microtask of the engine's animation frame), and the stylesheet hides the plain letters under is-glitch. So the
  // letters and the slabs can never both be on screen, and never both be away.
  if (layer) new MutationObserver(() => word.classList.toggle('is-glitch', layer.getAttribute('display') !== 'none')).observe(layer, { attributes: true, attributeFilter: ['display'] });

  // The glitch face is no part of the first paint (D19): it is asked for once the browser has reported that paint and
  // the first screen's photograph is in (each at most PAINT_WAIT, for a browser that reports none and a photograph
  // that hangs), so it takes nothing from either, and no burst runs until it has come, failed, or kept the word
  // waiting FACE_WAIT. Once it is here the slabs draw its <text> in place of the plain one, whenever that is; if it
  // never comes, the bursts run on the plain letters with the slabs alone.
  const painted = new Promise<void>((done) => {
    window.setTimeout(done, PAINT_WAIT);
    try {
      if (!PerformanceObserver.supportedEntryTypes.includes('paint')) return;
      if (performance.getEntriesByType('paint').length > 0) { done(); return; }
      const paint = new PerformanceObserver(() => { paint.disconnect(); done(); });
      paint.observe({ type: 'paint', buffered: true });
    } catch { /* no paint timing here: the timer stands */ }
  });
  const pictured = new Promise<void>((done) => {
    const img = sec.querySelector('img');
    if (!img || img.complete) { done(); return; }
    img.addEventListener('load', () => done(), { once: true });
    img.addEventListener('error', () => done(), { once: true });
    window.setTimeout(done, PAINT_WAIT);   // a photograph that hangs must not keep the word from ever glitching
  });
  const faced = Promise.all([painted, pictured]).then(() => new Promise<void>((done) => {
    const wait = window.setTimeout(done, FACE_WAIT);
    const asked: Promise<FontFace[]> = document.fonts?.load(FACE, face?.textContent ?? '') ?? Promise.resolve([]);
    asked.then((faces) => {
      if (!faces.some((f) => f.status === 'loaded')) return;
      face?.removeAttribute('display');
      plain?.setAttribute('display', 'none');
    }, () => {}).then(() => { clearTimeout(wait); done(); });
  }));

  // the word has landed when its last letter's entrance has ended (at once, if this module arrived after it)
  const landed = new Promise<void>((done) => {
    const last = word.querySelector<HTMLElement>('.rd-c:last-child');
    if (!last || last.getAnimations().length === 0) { done(); return; }
    last.addEventListener('animationend', () => done(), { once: true });
    last.addEventListener('animationcancel', () => done(), { once: true });
  });

  // the bursts: the first as the word lands, then the idle twitch, which waits afresh after every burst and rests
  // while the hero is off screen (the engine's own idle is off: its burst is a fixed quarter second). The first waits
  // for the observer's first word as well, so a hero that is on screen is never taken for one that is not
  let armed = false, shown = false, idle = 0;
  const rest = () => {
    clearTimeout(idle);
    if (armed && shown) idle = window.setTimeout(() => fire(BURST.idle), (IDLE_EVERY[0] + Math.random() * (IDLE_EVERY[1] - IDLE_EVERY[0])) * 1000);
  };
  fire = (seconds) => {
    if (!armed || !shown) return;
    g.burst(seconds);
    rest();
  };
  const seen = new Promise<void>((done) => {
    new IntersectionObserver((entries) => {
      for (const e of entries) shown = e.isIntersecting;
      done();
      rest();
    }).observe(sec);
  });
  void Promise.all([landed, faced, seen]).then(() => { armed = true; fire(BURST.land); });
}

// 2. the cue, and the word's answer to the scroll. One passive listener compares this scroll with the last: a page
// opened or restored part of the way down sets the cue without a burst.
if (sec) {
  let last = scrollY;
  let span = sec.offsetHeight;
  let still = 0;
  const crossed = (at: number, y: number) => (last > at) !== (y > at);
  /** the chevrons' cycle rests once the cue has faded out and goes on as it returns (D19, item 2: they move "for as
   * long as the cue shows") */
  const chevrons = (off: boolean) => {
    clearTimeout(still);
    if (off) still = window.setTimeout(() => cue?.classList.add('is-still'), CUE_FADE);
    else cue?.classList.remove('is-still');
  };
  cue?.classList.toggle('is-off', last > CUE_OFF);
  chevrons(last > CUE_OFF);
  addEventListener('resize', () => { span = sec.offsetHeight; }, { passive: true });
  addEventListener('scroll', () => {
    const y = scrollY;
    if (crossed(CUE_OFF, y)) {
      cue?.classList.toggle('is-off', y > CUE_OFF);
      chevrons(y > CUE_OFF);
      if (y > CUE_OFF) fire(BURST.scroll);
    }
    if (crossed(span * BEAT, y)) fire(BURST.scroll);
    last = y;
  }, { passive: true });
}

// 3. the scroll motion
onMotion((kit) => {
  if (!sec) return;
  const { gsap } = kit;
  const lines = [...sec.querySelectorAll<HTMLElement>('.rd-split .rd-ln')];
  const veil = parseFloat(getComputedStyle(sec).getPropertyValue('--veil')) || 0.6;
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: 0.6 } });
  [lines[0], lines[1], word].forEach((el, i) => { if (el) tl.to(el, { yPercent: DRIFT[i] }, 0); });
  tl.fromTo(sec, { '--veil': veil }, { '--veil': VEIL_END }, 0);
  parallax(kit, sec, 8);
});
