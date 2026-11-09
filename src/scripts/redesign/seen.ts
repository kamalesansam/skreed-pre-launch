// Seen's script, section "seen" (docs/specs/redesign.md D10, D19 item 3, section 6 and D16, E-RD-motion; Sam,
// 2026-11-09, of the clip his PDF holds one frame of: "Live animations", the option that read "the cases fan out as
// you scroll").
// The one pinned scene of the page. The pin itself is CSS: the stage is sticky inside a section 1.2 screens taller
// than it (1.7 on a phone, where the row also has to cross the screen; rd-seen.css), so the page has its full length
// from the first paint and nothing moves when this module arrives. A page opened at /#families, the way back from a
// family page, stays where the browser put it; with ScrollTrigger's own pin its spacer arrived with the kit and pushed
// that view down by the pin's length. ScrollTrigger only reads the scroll here and scrubs:
//   1. While the section comes up the screen the fans rise into their places, each from a little lower than the last.
//   2. While the stage is held, each fan opens from its front case: the three behind it slide out from under it to
//      one, two and three steps to its right, each with a small turn that settles; grey first, then blue, then brown.
//      On a phone the row pans from the grey fan to the brown one and each opens as it reaches the middle.
//   3. Then "is about to change" comes up word by word, and turns from the PDF's grey to black.
// The markup and the stylesheet are the scene at rest, which is its end, the fans open: this closes them.
// Every case is solid from the first frame to the last (Sam, 2026-11-09, of the first build, whose back cases faded
// to part opacities as they slid out and stayed there: "in the end of the scroll the phone cases are supposed to be
// fully visible, not translucent, and they're all in equal spaces"). So nothing here touches an opacity on a case or
// a fan: a back case is hidden only by standing behind the front one, the same cut-out in another colour, and what
// the scrub moves is its place. Transform only on the cases; the one opacity is the second line's black copy.
// Nothing is listened to: wheel, touch and keys stay the browser's. A page already past the scene finds it open.
import { onMotion } from './motion.ts';

/** the turn each back case makes on its way out, nearest first, in degrees; it is back to none as the case arrives.
 *  The last case of a fan swings furthest: a little past half way out its box reaches 25.8u beyond the fan's right
 *  edge at rest (measured at 1280 by 800), 6.6u above the row and 8.1u below it. Every fan has 34.575u of ground at its
 *  right or more, so a turning case meets neither the next fan nor the screen's edge; a wider turn or a narrower
 *  space would have to be measured again */
const TURN = [2.5, 4, 5.5] as const;
/** where each fan starts to open and how long it takes, as shares of the scrub (grey, blue, brown), and where the
 *  second line starts; on a phone the two pans sit between the fans */
const WIDE = { fans: [0.02, 0.23, 0.44], span: 0.26, line: 0.7 } as const;
const PHONE = { fans: [0.02, 0.32, 0.62], span: 0.2, pans: [0.17, 0.47], pan: 0.2, line: 0.8 } as const;

const sec = document.getElementById('seen');
/** true while one setup's tweens stand. The loader has been seen to run every setup twice (motion.ts starts twice when
 *  this module is evaluated before DOMContentLoaded), and a second from() on the same cases would start from the first
 *  one's closed state and end there, leaving the fans shut */
let live = false;

onMotion((kit, layout) => {
  if (!sec || live) return;
  const { gsap, ScrollTrigger } = kit;
  const view = sec.querySelector<HTMLElement>('.rd-seen-view');
  const row = sec.querySelector<HTMLElement>('.rd-seen-row');
  const fans = [...sec.querySelectorAll<HTMLElement>('.rd-seen-fan')];
  if (!view || !row || fans.length === 0) return;
  live = true;
  const rise = [...sec.querySelectorAll<HTMLElement>('.rd-seen-w-in')];
  const inks = [...sec.querySelectorAll<HTMLElement>('.rd-seen-w-ink')];
  const plan = layout.phone ? PHONE : WIDE;

  // the cut-outs are small and lazy: fetch them all two screens ahead, so no fan opens onto an empty case, and on a
  // phone none waits for the pan to bring it near
  ScrollTrigger.create({ trigger: sec, start: 'top 300%', once: true, onEnter: () => { for (const img of sec.querySelectorAll('img')) img.loading = 'eager'; } });

  // 1. the approach: the fans rise into place as the section climbs the screen, and are home as the stage sticks.
  // Each from a share of its own height (the row as one on a phone), so nothing is measured that a resize would change
  if (layout.phone) {
    // the script pans the row from here on: it is clipped and no longer scrolls by itself (rd-seen.css)
    sec.dataset.pan = '';
    view.scrollLeft = 0;
  }
  gsap.from(layout.phone ? view : fans, { yPercent: layout.phone ? 26 : (i: number) => 12 + 14 * i, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } });

  // 2 and 3. the scrub, over the scroll the stage is held for: from the section's top at the top of the screen to its
  // foot at the foot. Every value on it is a share of its element, an opacity or a bare number, so nothing on it is
  // measured and a refresh has nothing to put back: it is never invalidated (invalidateOnRefresh on a scrub that
  // stood at its end left the families' letters a line too high, GSAP having read their start back from the screen
  // in pixels)
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
  // the scrub's length is one whatever is on it
  tl.to({}, { duration: 1 }, 0);

  // the step from a case to the one behind it, as a share of a case's width: the stylesheet's two numbers, 42 units
  // of 169.4, a quarter
  const look = getComputedStyle(sec);
  const unit = parseFloat(look.getPropertyValue('--rd-seen-cu')) || 169.4;
  const step = (parseFloat(look.getPropertyValue('--rd-seen-step')) || 42) / unit;
  fans.forEach((fan, f) => {
    const at = plan.fans[f] ?? 0;
    [2, 3, 4].forEach((n, i) => {
      const el = fan.querySelector<HTMLElement>(`.rd-seen-case--${n}`);
      if (!el) return;
      // closed: straight behind the front case, back by the one, two or three steps it stands out at rest, so the fan
      // is one case. It slides home solid; the stylesheet's place is where it ends, the same step apart in every fan
      const t = at + i * plan.span * 0.17, d = plan.span * 0.66;
      tl.from(el, { xPercent: -100 * (n - 1) * step, duration: d, ease: 'power3.out' }, t);
      tl.to(el, { keyframes: { rotation: [0, TURN[i] ?? 0, 0], easeEach: 'sine.inOut' }, duration: d }, t);
    });
  });

  // the second line: its words up through their masks, then the black copies over the grey, a tween a word
  rise.forEach((w, i) => { tl.from(w, { yPercent: 118, duration: 0.07, ease: 'power3.out' }, plan.line + i * 0.026); });
  inks.forEach((w, i) => { tl.to(w, { opacity: 1, duration: 0.05 }, plan.line + 0.075 + i * 0.022); });

  if (layout.phone) {
    // the pan: grey to blue, then blue to brown, each fan's middle to the screen's. The script only counts the two
    // steps from 0 to 1 (--p1, --p2); the stylesheet turns them into the row's shift in the scene's own unit, a fan
    // and a space a step, so the distance is right at any width with nothing measured here
    PHONE.pans.forEach((at, i) => { tl.to(row, { [`--p${i + 1}`]: 1, duration: PHONE.pan, ease: 'power2.inOut' }, at); });
  }

  return () => { live = false; delete sec.dataset.pan; };
});
