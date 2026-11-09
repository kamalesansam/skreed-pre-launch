// The quiz's way in on the redesigned landing page (docs/specs/redesign.md D11 and the "quiz CTA" row of section 6;
// Sam, 2026-11-09: "for the quiz results keep our same current results page as well" and "add good scroll animations
// from gsap for those header"). Two jobs.
//
// The press. "Let’s find it" opens the quiz under the --night veil every jump on this page happens under
// (shell/veil.ts): the host is shown, the quiz's section is put at the top of the screen and its own "Click to begin"
// is pressed, so the visitor lands on question 1. The quiz is the site's own, left exactly as it is: its loader queues a
// press made before its chunk has mounted, and it moves focus to the question itself. A press once the quiz is past
// its intro only goes back to it. The page has grown by a screen, so the scroll triggers are measured again and the
// tone script is told (skreed:rd-layout); the same again whenever the quiz changes its height (the result, Try again).
//
// The motion (E-RD-motion). The frame draws itself: the top line and the two sides with the scroll as the box comes
// up, the foot once as it arrives. DON’T BE rises out of its mask letter by letter; WHELMED. rises under it out of
// its own; OVER falls in from above, letter by letter, bounces, and each letter comes to rest a degree or two off
// straight; the paragraph fades up after them. Under the words of the button the pill wipes in from the left, then
// the ring rolls in from the right. Every hidden start is given here, by GSAP, only once it has loaded, and only to
// what is still below the screen: without this file the section is complete and still. Nothing captures the scroll.
import { veiled } from '../shell/veil.ts';
import { type Kit, motionKit, onMotion, seen } from './motion.ts';

const sec = document.getElementById('quiz');
const host = document.getElementById('quizHost');
const cta = document.getElementById('rdQuizCta');

// ---- the press ----

/** the triggers below the host are measured again and the tone script reads the page again */
function moved(): void {
  dispatchEvent(new Event('skreed:rd-layout'));
  void motionKit().then((k) => k.ScrollTrigger.refresh(), () => {});   // no kit, no triggers to measure
}

/** an element that can take focus now: in the layout, not inside a hidden or inert part (the quiz keeps a hidden
 *  card's box), as the section index asks before it moves focus into the quiz (shell/site-nav.ts) */
const focusable = (e: HTMLElement) => e.getClientRects().length > 0 && !e.closest('[inert], [hidden]') && getComputedStyle(e).visibility !== 'hidden';

function open(): void {
  if (!host) return;
  void veiled(() => {
    const find = document.getElementById('find');
    const begin = document.getElementById('qzBegin');
    host.hidden = false;
    find?.scrollIntoView({ block: 'start', behavior: 'instant' });
    if (find?.dataset.state === 'intro') {
      // the quiz's own first press: it wipes the intro out and puts question 1 up, and moves focus to it then. Until
      // it does, focus waits on its button, inside the quiz, rather than on ours, now a screen above
      begin?.focus({ preventScroll: true });
      begin?.click();
    } else {
      // already begun on an earlier press: back to it, focus on the question or the result's name as the quiz has them
      const at = [find?.querySelector<HTMLElement>('.qz-card.is-top'), ...(find?.querySelectorAll<HTMLElement>('.qz-shade') ?? [])];
      at.find((e): e is HTMLElement => !!e && focusable(e))?.focus({ preventScroll: true });
    }
    moved();
  });
}

if (cta && host) {
  cta.addEventListener('click', open);
  // the quiz changes its own height as it goes (a question taller than the screen on a small phone, the result's one
  // screen): whatever lies below it has moved, so its triggers are measured again, once the change has settled
  if ('ResizeObserver' in window) {
    let h = 0, t = 0;
    new ResizeObserver(() => {
      const now = host.offsetHeight;
      if (Math.abs(now - h) < 2) return;
      const first = h === 0;
      h = now;
      if (first) return;   // the opening itself: open() has measured
      clearTimeout(t);
      t = window.setTimeout(moved, 200);
    }).observe(host);
  }
}

// ---- the motion ----

/** how far each letter of OVER rests off straight, in degrees, and the turn it falls in with */
const REST = [-1.75, 1.25, -1, 2];
const SPIN = [-34, 24, -20, 30];
/** one setup at a time: a second call while the first stands would play every entrance twice over the same boxes */
let live = false;

function motion(kit: Kit): (() => void) | void {
  if (!sec || live) return;
  const { gsap } = kit;
  const box = sec.querySelector<HTMLElement>('.rd-quiz-box');
  const h = sec.querySelector<HTMLElement>('.rd-quiz-h');
  const body = sec.querySelector<HTMLElement>('.rd-quiz-body');
  if (!box || !h || !body) return;
  live = true;
  const side = (s: string) => box.querySelector<HTMLElement>(`.rd-quiz-side[data-side="${s}"]`);
  const marked: Element[] = [];
  const unmark = () => { for (const el of marked.splice(0)) el.removeAttribute('data-mask'); };
  /** still below the screen: its entrance has not been seen, so it may be hidden and played */
  const fresh = (el: Element, margin = 0.18) => !seen(el, innerHeight * margin);

  // the frame, drawn by the scroll: a pen runs along the top from the left corner while a second comes down the left
  // side; the right side comes down from the corner the first pen reaches. All three follow the scroll with half a
  // second's ease behind it (a jump straight to the section draws them in that half second). They are whole as the
  // box's foot comes into the screen, or, where the box is nearly as tall as the screen or taller, before its top
  // nears the screen's top, so a box that fills the screen is complete. The foot is drawn once, as it comes in, from
  // the corner the second pen has reached to the corner the button sits in
  const top = side('top'), right = side('right'), bottom = side('bottom'), left = side('left');
  if (top && left && right) {
    const end = () => (box.offsetHeight > innerHeight * 0.77 ? 'top 22%' : 'bottom 99%');
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: box, start: 'top 85%', end, scrub: 0.5 } })
      .fromTo(top, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power1.inOut' }, 0)
      .fromTo(left, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0)
      .fromTo(right, { scaleY: 0 }, { scaleY: 1, duration: 0.7 }, 0.3);
  }
  if (bottom && fresh(bottom, 0.02)) gsap.fromTo(bottom, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut', clearProps: 'transform', scrollTrigger: { trigger: bottom, start: 'top 98%', once: true } });

  // the headline, once both its lines are in the screen (its top a quarter of the way up), so the fall is seen and
  // the frame does not stand empty for long; the paragraph comes up after it on the same clock
  const up = { opacity: 1, y: 0, duration: 1, ease: 'power3.out', clearProps: 'opacity,transform' };
  if (fresh(h, 0.26)) {
    const lns = [...h.querySelectorAll<HTMLElement>('.rd-ln')];
    const over = [...h.querySelectorAll<HTMLElement>('.rd-acc--lavender .rd-c')];
    const whelmed = lns[1]?.querySelector<HTMLElement>('.rd-w:not(.rd-acc)') ?? null;
    const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 74%', once: true }, onComplete: unmark });
    /** a line or a word as a mask, its letters up from behind its foot one after another */
    const rise = (el: HTMLElement, at: number, each: number) => {
      el.setAttribute('data-mask', ''); marked.push(el);
      tl.fromTo(el.querySelectorAll('.rd-c'), { yPercent: 125 }, { yPercent: 0, duration: 0.85, ease: 'power4.out', stagger: each, clearProps: 'transform' }, at);
    };
    if (lns[0]) rise(lns[0], 0, 0.035);
    if (whelmed) rise(whelmed, 0.3, 0.04);
    // OVER: each letter from above the headline, turning as it falls, a bounce on the line, then its own small tilt
    const drop = () => -1.45 * parseFloat(getComputedStyle(h).fontSize);
    over.forEach((c, i) => {
      const at = 0.5 + i * 0.11;
      tl.fromTo(c, { y: drop, rotation: SPIN[i % SPIN.length] }, { y: 0, rotation: REST[i % REST.length], duration: 1.05, ease: 'bounce.out' }, at);
      tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.14, ease: 'none', clearProps: 'opacity' }, at);
    });
    tl.fromTo(body, { opacity: 0, y: 28 }, up, 0.45);
  } else if (fresh(body)) {
    gsap.fromTo(body, { opacity: 0, y: 28 }, { ...up, scrollTrigger: { trigger: body, start: 'top 86%', once: true } });
  }

  // the button: its words come up, the pill wipes in behind "s find it", the ring rolls in from the right
  const btn = sec.querySelector<HTMLElement>('.rd-quiz-cta');
  const label = btn?.querySelector<HTMLElement>('.rd-quiz-cta-label');
  const fill = btn?.querySelector<HTMLElement>('.rd-quiz-cta-bg .rd-quiz-cta-fill');
  const ring = btn?.querySelector<HTMLElement>('.rd-quiz-cta-ring');
  if (btn && label && fill && ring && fresh(btn, 0.15)) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: btn, start: 'top 85%', once: true } });
    tl.fromTo(label, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power3.out', clearProps: 'opacity,transform' }, 0)
      .fromTo(fill, { xPercent: -101 }, { xPercent: 0, duration: 0.75, ease: 'power3.inOut', clearProps: 'transform' }, 0.2)
      // a roll, from just inside the frame's line: the turn is the distance over the radius (1.1 widths is 2.2
      // radii, 126 degrees)
      .fromTo(ring, { x: () => ring.offsetWidth * 1.1, rotation: 126 }, { x: 0, rotation: 0, duration: 1, ease: 'power3.out', clearProps: 'transform' }, 0.5)
      .fromTo(ring, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none', clearProps: 'opacity' }, 0.5);
  }

  return () => { live = false; unmark(); };
}

onMotion(motion);
