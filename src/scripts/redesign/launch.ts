// Launch: the countdown's entrance (docs/specs/redesign.md section 6, row "launch"; E-RD-motion). Once, as the row of
// digits comes over the foot of the screen, the four pairs rise in a stagger and each unit's label follows its pair.
// Nothing else moves here: the ticking is the plain inline script's and the glitch is the logotype's (E-CD-glitch).
// The rise is put on each group, never on a pair's own SVG: the glitch writes that SVG's opacity during a burst and
// clears it after, which would undo a hidden start. A countdown already on screen when the kit arrives, or one hidden
// at zero, is left as it is (enter() skips it).
// Since D19 a colon stands between each pair and the next (Sam, 2026-11-09: "add dots for the countdown timer"). The
// colons belong to the row, so they rise with it, each between its two neighbours: the row's seven parts go left to
// right half a step apart, which leaves the four pairs exactly where they were in time (0, 0.09, 0.18 and 0.27 s) and
// puts each colon midway. That is all a colon ever does: it does not blink and takes no part in the glitch, so the
// rise can sit on its own SVG, which nothing else writes.
// Since D20 the PDF's COMING SOON mark stands over the digits (Sam, 2026-11-09: "take that coming soon and put it in the
// place of "launch in""), and it loads with the scroll as it did on its own band: the bar that stands for the I fills
// from its left edge and a round knob crosses the pill's counter, from behind its left wall to behind its right one. Both
// ride one scrubbed timeline that starts once the whole mark is over the foot of the screen and is done as the mark
// nears the middle, so the visitor sees it load from empty and it is whole, the PDF's, for the rest of its way up;
// scrolled back, it unloads. Transforms only; without this file the markup's bar is full and its pill empty.
import { onMotion, enter } from './motion.ts';

/** the knob's road in the mark's own units: from left of the counter (166) to its place right of it (425), a radius and a hair clear at each end */
const ROAD = 315;

// built once at a time: a second call while the first build stands is skipped, because a second from() on the same
// groups would take the first one's hidden start for its end and leave the digits hidden
let built = false;

onMotion((kit) => {
  if (built) return;
  const count = document.querySelector<HTMLElement>('#launch #count');
  if (!count || count.hidden) return;
  built = true;
  const groups = [...count.querySelectorAll<HTMLElement>(':scope > div')];
  const labels = groups.map((g) => g.querySelector<HTMLElement>('.l')).filter((l): l is HTMLElement => l !== null);
  // the row as it stands, left to right: pair, colon, pair, colon, pair, colon, pair. From one pair to the next is
  // 0.09 s, as it was before the colons, so with a colon between them each part follows the last by half of that
  const row = [...count.querySelectorAll<HTMLElement | SVGSVGElement>(':scope > div, :scope > .colon')];
  enter(kit, count, row, { y: () => count.offsetHeight * 0.45, opacity: 0, duration: 1, stagger: row.length > groups.length ? 0.045 : 0.09 });
  enter(kit, count, labels, { y: 14, opacity: 0, duration: 0.7, delay: 0.3, stagger: 0.09 });
  const mark = document.querySelector('#launch .rd-launch-mark');
  const fill = mark?.querySelector('.rd-launch-fill');
  const knob = mark?.querySelector('.rd-launch-knob');
  if (mark && fill && knob) {
    kit.gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: mark, start: 'bottom bottom', end: 'center 52%', scrub: 0.6 } })
      .fromTo(fill, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%', duration: 0.8 }, 0)
      .fromTo(knob, { x: -ROAD }, { x: 0, duration: 0.8 }, 0.2);
  }
  return () => { built = false; };
});
