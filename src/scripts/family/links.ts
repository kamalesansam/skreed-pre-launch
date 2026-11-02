// FamilyLinksNav.astro's script (mounted through FamilyLinks.astro): wires nav#families on the page that mounts it (the
// landing's section 2). Runs on every path, poster and 3D; the section 2 island adds the canvas part with installRockNav
// and placeLinkBoxes.
import { installFamilyLinks, isReturnVisit } from './rock-links.ts';

const nav = document.getElementById('families');
if (nav) {
  installFamilyLinks(nav);
  // Back from a family page without the back-forward cache, or /#families, off the 3D path (the poster tier, or a hard
  // fall to it before the load event): bring the visitor back to the links they left from, centred (family-page.md 23,
  // round 5 review, iterations 2 to 4).
  // Not on Back to top's way home: to-top.ts sets skreed:to-top before it steps back, and a cache miss makes that load a
  // back_forward one too, which isReturnVisit() cannot tell apart; read here as the loader's TT reads it, inside a try, and
  // left for BackToTop's module (after this one in the document) to clear. Its load keeps the top, as the loader and
  // toPoster leave it.
  // The browser's own scroll to the fragment starts when the parser ends, after this module has run, and can come again at
  // a layout until the load event, each time putting the links at the top edge: so the centring is held until then. It is
  // made now, for the first frames, again on each scroll the browser makes (the fragment's, or the restoration's, whose
  // scroll event follows it), and once more at the load event, which the fragment scroll never follows. It stops for good
  // at the visitor's first wheel, touch, key or pointer, as the browser's own fragment scroll does, so the page never moves
  // under them; passive listeners, removed once used. The class is read each time, since the fall to the poster (boot.ts
  // toPoster) can come after this module and before load. The 3D path's return is the island's: the loader runs in full
  // and lifts onto section 2 at rest (loader.inline.js RET, hero.ts step 18; spec 2.2 and 23).
  // The browser's own scroll restoration (iteration 4): on the 3D path the loader sets it to manual before anything else
  // runs (loader.inline.js line 10), and a fall to the poster keeps that. On the poster tier proper (reduced motion by
  // default, Save-Data, 2g, low memory) the loader never ran: it returns at its line 7 without html.loading, before line
  // 10, so the entry keeps the browser's own restoration, which on a back_forward load puts the visitor's old place back
  // once more 3 to 19 ms after the load event, after this module has let go. So this is the only place that stops it
  // there: manual, set when the centring is decided (a return visit, the flag not set, off the 3D path), before the load
  // event. Never set on a plain first visit, never on Back to top's way home, never on the 3D path. But the setting is
  // the landing entry's, not this load's (iteration 5), so it holds for every later load of that entry: a reload, a later
  // Back, and Back to top's way home, which then ends at the top with #families kept.
  let toTop = false;
  try { toTop = sessionStorage.getItem('skreed:to-top') === '1'; } catch { /* no storage to read: no flag, so a return visit is centred as on any other */ }
  if (!toTop && isReturnVisit()) {
    if (!document.documentElement.classList.contains('hero3d')) history.scrollRestoration = 'manual';
    const INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    const centre = () => { if (!document.documentElement.classList.contains('hero3d')) nav.scrollIntoView({ block: 'center', behavior: 'instant' }); };
    const stop = () => { removeEventListener('scroll', centre); removeEventListener('load', loaded); for (const e of INPUT) removeEventListener(e, stop); };
    const loaded = () => { centre(); stop(); };
    centre();
    if (document.readyState !== 'complete') {
      addEventListener('scroll', centre, { passive: true });
      addEventListener('load', loaded);
      for (const e of INPUT) addEventListener(e, stop, { passive: true });
    }
  }
}
