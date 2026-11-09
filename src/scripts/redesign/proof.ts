// The motion of the three framed lines over their photograph (docs/specs/redesign.md, the "proof" row of section 6,
// E-RD-motion; Sam, 2026-11-09: "have that parallax effect or any other scroll effect forthe images"). The picture
// travels its spare height as the band crosses the screen (the foundation's parallax). Each frame draws itself in one
// stroke, round from its top left corner; its icon is drawn after it, every path from its start to its end
// (stroke-dashoffset from the path's length to nothing); its line rises under the icon; the step of veil inside the
// frame comes with it. On a wide screen the three go one after another from one trigger; on a phone, where they are
// stacked, each plays as it comes up the screen.
// Every hidden start is given here, by GSAP, only once it has loaded, and only to a frame still below the screen:
// without this file the band is complete and still. Nothing captures the scroll.
import { type Kit, type Layout, onMotion, parallax, seen } from './motion.ts';

const sec = document.getElementById('proof');
/** one setup at a time: a second call while the first stands would play every entrance twice over the same boxes */
let live = false;
/** more than a round cap's reach in an icon's own units (its stroke is 3 at the widest, rd-proof.css) */
const CAP = 4;

function motion(kit: Kit, layout: Layout): (() => void) | void {
  if (!sec || live) return;
  live = true;
  const { gsap } = kit;
  parallax(kit, sec, 8);

  const list = sec.querySelector<HTMLElement>('.rd-proof-list');
  const items = [...sec.querySelectorAll<HTMLElement>('.rd-proof-item')];
  /** one frame's entrance, as a timeline */
  const draw = (item: HTMLElement) => {
    const side = (s: string) => item.querySelector<HTMLElement>(`.rd-proof-side[data-side="${s}"]`);
    const paths = [...item.querySelectorAll<SVGPathElement>('.rd-proof-icon path')];
    const text = item.querySelector<HTMLElement>('.rd-proof-text');
    const tl = gsap.timeline();
    // the frame, one stroke round: along the top, down the right, back along the foot, up the left
    const round: [HTMLElement | null, 'scaleX' | 'scaleY', number, string][] = [
      [side('top'), 'scaleX', 0.3, 'power2.in'], [side('right'), 'scaleY', 0.26, 'none'], [side('bottom'), 'scaleX', 0.22, 'none'], [side('left'), 'scaleY', 0.36, 'power2.out'],
    ];
    let at = 0;
    for (const [el, prop, dur, ease] of round) {
      if (el) tl.fromTo(el, { [prop]: 0 }, { [prop]: 1, duration: dur, ease, clearProps: 'transform' }, at);
      at += dur;
    }
    // the icon: each path drawn from its start. The dash waits a cap's reach before the path's start (CAP), so its
    // round end shows nothing until the drawing begins, and the gap after it is longer than the path
    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      tl.fromTo(p, { strokeDasharray: `${len} ${len + 2 * CAP}`, strokeDashoffset: len + CAP }, { strokeDashoffset: 0, duration: 0.95, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' }, 0.4 + i * 0.09);
    });
    if (text) tl.fromTo(text, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.75);
    // the step of veil inside the frame (rd-proof.css) comes with the frame, not before it: from none to the
    // stylesheet's own figure for this layout, which stands again once the inline value is taken off
    const shade = parseFloat(getComputedStyle(item).getPropertyValue('--rd-proof-shade')) || 0;
    if (shade > 0) tl.fromTo(item, { '--rd-proof-shade': 0 }, { '--rd-proof-shade': shade, duration: 0.9, ease: 'none', onComplete: () => item.style.removeProperty('--rd-proof-shade') }, 0.25);
    return tl;
  };

  // each plays once enough of it is on screen to be watched: a frame's icon and first line on a phone, the upper
  // third of the row on a wide screen
  if (layout.phone) {
    for (const item of items) {
      if (seen(item, innerHeight * 0.22)) continue;
      gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 78%', once: true } }).add(draw(item));
    }
  } else if (list && !seen(list, innerHeight * 0.35)) {
    const all = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 65%', once: true } });
    items.forEach((item, i) => all.add(draw(item), i * 0.3));
  }

  return () => { live = false; };
}

onMotion(motion);
