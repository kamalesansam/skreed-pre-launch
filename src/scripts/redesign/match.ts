// MATCH ESSENTIALS, section "match": its scroll motion (docs/specs/redesign.md section 6, the "match" row, D16 and
// E-RD-motion; Sam, 2026-11-09: "add a lot of animations for the main head text ... it shouldnt look dead, add good
// scroll animations from gsap for those header" and "have that parallax effect or any other scroll effect forthe
// images"). Three things, all scrubbed by the page's own scroll:
//   1. The words meet. MATCH comes in from the left and ESSENTIALS from the right, each letter on its own way: the
//      letters nearest the join lead and the far ends trail, so a word arrives stretched and closes up as it lands.
//      The run starts as the heading's row reaches the foot of the screen and ends, every letter home at once, as the
//      band's middle reaches the screen's middle: the H on the E's back, as the PDF has them. They hold there.
//   2. The photograph travels its spare height as the band crosses the screen (the foundation's parallax).
//   3. The photograph settles from 1.1 to 1 over the band's way in, so the frame at rest is the PDF's crop.
// Only transforms move. Nothing is hidden in the CSS: without this module, or before the kit arrives, the words stand
// where the PDF has them. No scroll is captured: wheel, touch and keys stay the browser's.
import { onMotion, parallax } from './motion.ts';

/** how much farther each letter starts than its neighbour nearer the join, as a share of the word's own way in */
const SPREAD_A = 0.3;
const SPREAD_B = 0.14;
/** room past the band's edge, in px, so a waiting letter is wholly out of sight */
const PAD = 24;
/** the photograph's scale as the band enters; it is 1 by the middle of the screen */
const ZOOM = 1.1;

// One build at a time. The loader can hand a setup to two matchMedia lists in the same breath (its start() runs twice
// before the kit has arrived); one set of tweens is enough.
let built = false;

onMotion((kit) => {
  const sec = document.getElementById('match');
  const head = sec?.querySelector<HTMLElement>('.rd-match-h');
  if (!sec || !head || built) return;
  built = true;
  const { gsap } = kit;
  const wordA = head.querySelector<HTMLElement>('.rd-match-w--a');
  const wordB = head.querySelector<HTMLElement>('.rd-match-w--b');
  const img = sec.querySelector<HTMLElement>('.rd-match-img');

  if (wordA && wordB) {
    const a = [...wordA.querySelectorAll<HTMLElement>('.rd-match-c')];
    const b = [...wordB.querySelectorAll<HTMLElement>('.rd-match-c')];
    // the words' own boxes never move (only their letters do), so they measure true at every refresh: MATCH has to
    // clear the screen's left edge, ESSENTIALS its right
    const wayA = () => wordA.getBoundingClientRect().right + PAD;
    const wayB = () => document.documentElement.clientWidth - wordB.getBoundingClientRect().left + PAD;
    gsap.timeline({
      defaults: { ease: 'power2.out', duration: 1 },
      scrollTrigger: { trigger: head, start: 'top bottom', endTrigger: sec, end: 'center center', scrub: 0.5, invalidateOnRefresh: true },
    })
      .fromTo(a, { x: (i: number) => -wayA() * (1 + SPREAD_A * (a.length - 1 - i)) }, { x: 0 }, 0)
      .fromTo(b, { x: (i: number) => wayB() * (1 + SPREAD_B * i) }, { x: 0 }, 0);
  }

  if (img) {
    gsap.fromTo(img, { scale: ZOOM }, { scale: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'center center', scrub: true } });
  }
  parallax(kit, sec, 8);

  return () => { built = false; };
});
