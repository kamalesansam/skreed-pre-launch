// The jars' entrance on the landing page (docs/specs/redesign.md D18 and section 6's row "jars"; E-RD-motion; Jars.astro).
// The section is the current site's section 5, complete and still without this file, and what it does on its own (the
// visitor's jar filling and draining with the Followed ticks, its form) is scripts/signup/'s, untouched. Here it only
// arrives, once: the headline's two lines rise one after the other and the sub-line follows; the label comes up, then
// the four jar columns left to right, as if set down one by one, and the ticks under them; the form's heading, the
// form and the last line rise as the page reaches them. Every start state is given by GSAP, never by a stylesheet, and
// cleared when its tween ends, so nothing is left on an element the section's own script animates later; a part
// already on screen when the kit arrives is left as it is (enter()). No scroll is captured and nothing moves at rest.
import { enter, onMotion } from './motion.ts';

const root = document.querySelector<HTMLElement>('.rd-jarsec .signup');
if (root) {
  onMotion((kit, { phone }) => {
    const one = (sel: string) => root.querySelector<HTMLElement>(sel);
    const all = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
    const clear = 'transform,opacity';

    // the headline and the sub-line
    const top = one('.su-top');
    if (top) {
      enter(kit, top, all('.su-h > span'), { yPercent: 60, opacity: 0, duration: 1, stagger: 0.14, clearProps: clear });
      const sub = one('.su-sub');
      if (sub) enter(kit, top, sub, { y: phone ? 12 : 18, opacity: 0, duration: 0.9, delay: 0.4, clearProps: clear });
    }

    // the label, the four columns, the ticks
    const row = one('.su-row');
    if (row) {
      const label = one('.su-every');
      if (label) enter(kit, row, label, { y: phone ? 10 : 14, opacity: 0, duration: 0.8, clearProps: clear }, 'top 88%');
      enter(kit, row, all('.su-col'), { y: phone ? 28 : 44, opacity: 0, duration: 0.95, ease: 'back.out(1.3)', stagger: 0.11, delay: 0.1, clearProps: clear }, 'top 88%');
      enter(kit, row, all('.su-tick'), { y: 8, opacity: 0, duration: 0.6, stagger: 0.11, delay: 0.55, clearProps: clear }, 'top 88%');
    }

    // the form's heading between its hairlines, the form, the last line: one after the other from the moment the first
    // of them shows at the foot of the screen. One trigger for the three, because the section is one screen tall: with
    // the section at rest the last line stands in the screen's last twentieth, under any line a trigger of its own
    // could wait for, and it would stay hidden until the page moved again
    const tail = ['.su-got', '.su-form', '.su-keep'].map(one).filter((el): el is HTMLElement => !!el);
    if (tail.length) enter(kit, tail[0], tail, { y: phone ? 16 : 24, opacity: 0, duration: 0.85, stagger: 0.12, clearProps: clear }, 'top bottom');
  });
}
