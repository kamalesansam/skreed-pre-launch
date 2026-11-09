// The redesigned landing page's motion, one loader for every section (docs/specs/redesign.md D16, E-RD-motion; Sam,
// 2026-11-09: "add a lot of animations for the main head text ... it shouldnt look dead, add good scroll animations
// from gsap for those header" and "have that parallax effect or any other scroll effect forthe images").
//
// GSAP and ScrollTrigger come by import() after first paint, so they are no part of the critical JS. A section's own
// module calls onMotion(setup): setup runs once the kit is here, inside one gsap.matchMedia(), so every tween it makes
// is reverted and rebuilt when the layout crosses the phone line. Nothing is hidden until then: the page is complete
// without this file, and an element already on screen when the kit arrives keeps its place (enter() skips it).
// Reduce motion: the query comes from scripts/motion.ts, which is 'not all' since E-3D-only, so the motion runs for
// every visitor; were it honoured again, the setups would simply not run.
// No scroll is captured or eased here or in any section: wheel, touch and keys stay the browser's.
import type { gsap as Gsap } from 'gsap';
import type { ScrollTrigger as St } from 'gsap/ScrollTrigger';
import { reducedMQ } from '../motion.ts';

export interface Kit { gsap: typeof Gsap; ScrollTrigger: typeof St }
/** what a setup is told about the layout it is building for */
export interface Layout { phone: boolean }
export type Setup = (kit: Kit, layout: Layout) => void | (() => void);

/** the phone layout's upper bound, the same line as redesign.css */
export const PHONE_MQ = '(max-width: 719px)';
const MOTION_MQ = reducedMQ.media === 'not all' ? 'all' : '(prefers-reduced-motion: no-preference)';

const setups: Setup[] = [];
let kit: Kit | null = null;
let started = false;

async function load(): Promise<Kit> {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  // a phone's address bar changes the height as it hides: the triggers keep their places through it
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
  return { gsap, ScrollTrigger };
}

function run(k: Kit): void {
  const mm = k.gsap.matchMedia();
  mm.add({ motion: MOTION_MQ, phone: PHONE_MQ }, (ctx) => {
    const c = ctx.conditions as { motion: boolean; phone: boolean };
    if (!c.motion) return;
    const undo = setups.map((s) => s(k, { phone: c.phone }));
    return () => { for (const u of undo) u?.(); };
  });
  const refresh = () => k.ScrollTrigger.refresh();
  // the faces change every headline's box; a page restored from the back-forward cache keeps its scroll but not its triggers' places
  void document.fonts?.ready.then(refresh);
  addEventListener('pageshow', (e) => { if (e.persisted) refresh(); });
  addEventListener('load', refresh, { once: true });
  // the page's height changes after load too (a picture's box, the quiz opening under its way in, a form's step): every
  // trigger below the change would keep a stale place, so they are measured again once the height has settled
  if ('ResizeObserver' in window) {
    let h = document.body.offsetHeight, t = 0;
    new ResizeObserver(() => {
      const now = document.body.offsetHeight;
      if (now === h) return;
      h = now;
      clearTimeout(t);
      t = window.setTimeout(refresh, 200);
    }).observe(document.body);
  }
  document.documentElement.classList.add('rd-live');
}

/** Register a section's motion. Safe to call before or after the kit has loaded. */
export function onMotion(setup: Setup): void {
  if (!(kit && started)) { setups.push(setup); return; }
  {
    // a late section (its module arrived after the run): give it its own matchMedia so it is still reverted with the layout
    const k = kit;
    k.gsap.matchMedia().add({ motion: MOTION_MQ, phone: PHONE_MQ }, (ctx) => {
      const c = ctx.conditions as { motion: boolean; phone: boolean };
      if (!c.motion) return;
      const undo = setup(k, { phone: c.phone });
      return () => { undo?.(); };
    });
  }
}

/** The kit, loading it on first call. A section that needs GSAP outside a scroll setup (the picker) awaits this. */
export function motionKit(): Promise<Kit> {
  return (kitPromise ??= load().then((k) => { kit = k; return k; }));
}
let kitPromise: Promise<Kit> | null = null;

/** True when an element's top is already above the foot of the screen: it has been seen, so its entrance is skipped. */
export function seen(el: Element, margin = 0): boolean {
  return el.getBoundingClientRect().top < innerHeight - margin;
}

/** An entrance: `targets` play from `from` once `trigger` crosses 82% of the screen's height. An element already on
 * screen when this runs is left as it is, so a page opened or restored mid-way never blinks. */
export function enter(k: Kit, trigger: Element, targets: gsap.TweenTarget, from: gsap.TweenVars, start = 'top 82%'): gsap.core.Tween | null {
  if (seen(trigger, innerHeight * 0.18)) return null;
  return k.gsap.from(targets, { ...from, scrollTrigger: { trigger, start, once: true } });
}

/** Parallax for a photograph band (.rd-band): its picture box, a fifth taller than the band, travels its spare height
 * as the band crosses the screen. `amount` is the travel in per cent of the picture box. */
export function parallax(k: Kit, band: Element, amount = 8): void {
  const pic = band.querySelector('.rd-band-pic');
  if (!pic) return;
  k.gsap.fromTo(pic, { yPercent: -amount }, { yPercent: amount, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } });
}

/** the split text's handles (RdSplit.astro) inside a headline or any element */
export const lines = (el: Element): HTMLElement[] => [...el.querySelectorAll<HTMLElement>('.rd-ln-in')];
export const words = (el: Element): HTMLElement[] => [...el.querySelectorAll<HTMLElement>('.rd-w')];
export const chars = (el: Element): HTMLElement[] => [...el.querySelectorAll<HTMLElement>('.rd-c')];
/** turn a headline's lines into masks (the letters rise from behind the line's own edge) */
export function mask(el: Element): void {
  for (const ln of el.querySelectorAll('.rd-ln')) ln.setAttribute('data-mask', '');
}

// start once the page has painted: the kit is fetched in the idle time after first paint, never before it
let asked = false;
function start(): void {
  // asked for once: both of the calls below can come before the kit has, and a second run would give every entrance a
  // second tween whose end is the first one's hidden start
  if (asked) return;
  asked = true;
  motionKit().then((k) => { started = true; run(k); }).catch(() => { /* the chunk did not come: the page stands complete without it */ });
}
if (document.readyState === 'complete') start();
else {
  addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(start)), { once: true });
  if (document.readyState === 'interactive') requestAnimationFrame(() => requestAnimationFrame(start));
}
