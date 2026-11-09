// Families' script, section "families" (docs/specs/redesign.md D10, section 6 and D16, E-RD-motion; Sam, 2026-11-09:
// "add a lot of animations for the main head text ... it shouldnt look dead, add good scroll animations from gsap for
// those header", and of the clip his PDF holds one frame of: "Live animations").
// Two jobs.
//   1. The ten swatch links (the first paint does not wait for GSAP for these). A plain left click leaves /#families in
//      the history and then goes (followRock, the gems' own way), so Back from a family page returns to this section;
//      a modified click keeps the browser's behaviour. A family page is prefetched once its swatch is hovered for a
//      moment, focused or touched. A swatch pressed by a finger or a pen keeps its words on show (data-on), there
//      being no hover to show them. The cross-document view transition the old landing's ten links had is kept, and
//      kept to links into /shades/ (family-page.md 2.2). A build with no family pages (PUBLIC_FAMILY_PAGES=off) holds
//      no such link, so none of this meets anything there.
//   2. With GSAP: the three blobs stamp in and their words draw on from the left; the grey line fades up; the
//      headline's letters fall into place from above in a wave, line by line on a scrub, POSSIBLE. landing with an
//      overshoot; the swatches pop in left to right and each breathes once; and the blobs turn slowly while the
//      section crosses the screen. Transform and opacity, and one clip-path for the words' reveal. Entrances leave
//      alone what is already on screen when the kit arrives. Nothing is listened to that could hold the scroll.
import { onMotion, enter, seen, chars } from './motion.ts';
import { followRock, prefetchFamily, installViewTransitionScope, PREFETCH_HOVER_MS, type RockLink } from '../family/rock-links.ts';

/** the letters' fall, in a line's own scrub time: one letter takes 1, and the next starts this much later */
const FALL = 0.11;

const sec = document.getElementById('families');
const nav = sec?.querySelector<HTMLElement>('.rd-families-nav') ?? null;

// 1. the links
// the page's view transition (rd-families.css) is for the way into a family page only: every other destination goes plainly
installViewTransitionScope();
if (nav) {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a.rd-families-sw')];
  const of = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLAnchorElement>('a.rd-families-sw') : null);
  // a swatch as the gems' link code reads it, every word from the swatch itself: its shade is the row's own (RD_COPY.families),
  // where ROCK_LINKS holds the gems' key shades
  const link = (a: HTMLAnchorElement): RockLink => {
    const href = a.getAttribute('href') ?? '';
    return { slug: a.dataset.family ?? '', family: a.querySelector('.rd-families-name')?.textContent ?? '', shade: a.dataset.shade ?? '', nnn: href.slice(-3), href };
  };

  nav.addEventListener('click', (e) => {
    const a = of(e.target);
    const l = a && link(a);
    if (!l || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    followRock(l, 'rock_grid');
  });

  let hover = 0;
  const warm = (a: HTMLAnchorElement | null) => { const l = a && link(a); if (l) prefetchFamily(l.slug); };
  nav.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const a = of(e.target);
    clearTimeout(hover);
    if (a) hover = window.setTimeout(() => warm(a), PREFETCH_HOVER_MS);
  }, { passive: true });
  nav.addEventListener('pointerleave', () => clearTimeout(hover), { passive: true });
  nav.addEventListener('focusin', (e) => warm(of(e.target)));
  nav.addEventListener('pointerdown', (e) => {
    const a = of(e.target);
    if (!a || e.pointerType === 'mouse') return;
    warm(a);
    for (const other of links) other.toggleAttribute('data-on', other === a);
  }, { passive: true });
}

// 2. the motion
/** true while one setup's tweens stand. The loader has been seen to run every setup twice (motion.ts starts twice when
 *  this module is evaluated before DOMContentLoaded), and a second from() on the same targets would start from the
 *  first one's hidden state and end there, leaving them hidden */
let live = false;
onMotion((kit, layout) => {
  if (!sec || live) return;
  live = true;
  const { gsap } = kit;
  const blobs = sec.querySelector<HTMLElement>('.rd-families-blobs');
  const lead = sec.querySelector<HTMLElement>('.rd-families-lead');
  const h2 = sec.querySelector<HTMLElement>('.rd-h');
  const row = sec.querySelector<HTMLElement>('.rd-families-row');

  // the blobs stamp in, a turn undone as each lands, and their words draw on from the left
  if (blobs && !seen(blobs, innerHeight * 0.18)) {
    const stamps = blobs.querySelectorAll('.rd-families-stamp');
    const words = blobs.querySelectorAll('.rd-families-word');
    const tl = gsap.timeline({ scrollTrigger: { trigger: blobs, start: 'top 82%', once: true } });
    tl.from(stamps, { scale: 0, rotation: -80, duration: 0.75, ease: 'back.out(1.7)', stagger: 0.12 }, 0);
    // the script face's swashes reach past its box, so the clip's other three edges stand well clear of it
    tl.fromTo(words, { clipPath: 'inset(-60% 100% -60% -30%)' }, { clipPath: 'inset(-60% -30% -60% -30%)', duration: 0.7, ease: 'power2.inOut', stagger: 0.12, clearProps: 'clipPath' }, 0.4);
  }
  // and turn slowly, the words staying level, while the section crosses the screen
  if (blobs) {
    gsap.fromTo(blobs.querySelectorAll('.rd-families-brush'), { rotation: -14 }, { rotation: 16, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // the grey line fades up
  if (lead) enter(kit, lead, lead, { y: 26, autoAlpha: 0, duration: 0.9 }, 'top 88%');

  // the headline: its letters fall into place from above in a wave, a scrub to a line, each starting as its line comes
  // onto the screen and over when the line is well inside it. A line that shows when the section rests at the top of
  // the screen (the index's jump, the way back from a family page) is always over just before that, so the headline
  // is whole wherever the page comes to rest on this section; a line still under the screen's foot there (a short
  // window) falls as it comes up instead. The last line, POSSIBLE., drops from higher and lands past its place.
  if (h2) {
    const lines = [...h2.querySelectorAll<HTMLElement>('.rd-ln')];
    const at = (el: Element) => el.getBoundingClientRect().top + scrollY;
    lines.forEach((ln, li) => {
      const land = li === lines.length - 1;
      const box = ln.querySelector<HTMLElement>('.rd-ln-in') ?? ln;
      // the end is asked again at every refresh, being a function; the scrub itself is never invalidated on refresh
      // (invalidateOnRefresh on a scrub that stood at its end left the letters a line too high: GSAP read their
      // start back from the screen in pixels, on top of the per cent)
      const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: 'top bottom', scrub: 0.5,
        end: () => {
          const top = at(box), high = box.offsetHeight, rest = at(sec), enters = top - innerHeight;
          // two fifths of the line or more on the screen when the section rests at its top: over by then
          if (top + high * 0.4 - rest < innerHeight) return Math.min(Math.max(enters + 24, Math.min(top + high - innerHeight * 0.78, rest - innerHeight * 0.03)), rest - 2);
          return Math.max(enters + 48, top + high - innerHeight * 0.92);
        } } });
      // how far above its place a letter starts, in per cent of its line: the first line from just under the grey
      // line (so no letter is seen crossing it), the next from over the line above, the last from higher still
      const drop = land ? -175 : li === 0 ? -80 : -115;
      chars(ln).forEach((c, i) => {
        // each letter drops, turning straight as it comes, and is whole a third of the way down
        tl.fromTo(c, { yPercent: drop, rotation: ((i + li) % 2 ? 1 : -1) * (land ? 14 : 9) }, { yPercent: 0, rotation: 0, duration: 1, ease: land ? 'back.out(2.6)' : 'power2.out' }, i * FALL);
        tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, i * FALL);
      });
    });
  }

  // the swatches pop in left to right, then each breathes once; on a phone their names come with them
  if (row && !seen(row, innerHeight * 0.12)) {
    const pops = row.querySelectorAll('.rd-families-pop');
    const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%', once: true } });
    tl.from(pops, { scale: 0, rotation: -40, duration: 0.55, ease: 'back.out(2)', stagger: 0.06 }, 0);
    if (layout.phone) tl.from(row.querySelectorAll('.rd-families-name'), { autoAlpha: 0, y: 8, duration: 0.4, stagger: 0.06 }, 0.2);
    tl.to(pops, { scale: 1.06, duration: 0.24, ease: 'sine.inOut', yoyo: true, repeat: 1, stagger: 0.06 }, 0.6);
    tl.set(pops, { clearProps: 'transform' });
  }
  return () => { live = false; };
});
