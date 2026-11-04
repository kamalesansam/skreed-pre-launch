// Back to top (src/components/shell/BackToTop.astro), on every family page: a press scrolls the page to its own top, the
// carousel of the family's 24 cases (Sam, 2026-11-04: "the back to top button in product page is supposed to take the
// same page top section where all sahde 3d models are there, not back to the main page hero section"), smoothly, at once
// under reduced motion; a keyboard press moves the focus to the top too. Until 2026-11-04 it stepped back through the
// history to the landing page's section 1, a flag in sessionStorage telling the restored page to jump there; the flag,
// its reader on the landing page, the loader's and the family links' went with it. On the landing page the section
// index's Home makes the jump to section 1 (site-nav.ts), so the landing page draws no control and this does nothing there.
import { track } from '../quiz/track.ts';
import { reducedMQ } from '../motion.ts';

const btn = document.getElementById('toTop');
if (btn instanceof HTMLAnchorElement) {
  btn.hidden = false;
  btn.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab or window opens the page's top as a link does
    e.preventDefault();
    track('to_top', { from: location.pathname });
    const keyboard = e.detail === 0;   // Enter on the link: no pointer, so the focus follows the page to its top
    // the case types' steps (family/steps.ts) let this scroll pass: the tap that pressed it is no swipe to hold on Armor
    dispatchEvent(new CustomEvent('skreed:jump'));
    scrollTo({ top: 0, behavior: reducedMQ.matches ? 'instant' : 'smooth' });
    const h1 = document.querySelector<HTMLElement>('h1');
    if (keyboard && h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  });
}
