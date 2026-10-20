// Back to top (src/components/shell/BackToTop.astro). On the landing page: shown once the visitor has left the first
// screen (on a family page, always); a press fades a --night veil in for 250 ms, jumps to section 1 in place (the hero's own jump when the island
// runs: scroll 0, its followers snapped, section 4 reset, the same path the page's loop uses; a plain scroll on the
// poster tier), and lifts the veil; no reload and no smooth scroll back through every section. Reduced motion: the cut
// with no veil. Keyboard focus moves to the logotype, the first control of section 1.
// On a family page: a press steps back through the history to the landing page (the Navigation API's entries, or the
// referrer and history.back()), which the browser restores from its back-forward cache without a reload; a flag in
// sessionStorage tells the restored page to jump to section 1 under the veil. With no landing page behind it, the link
// navigates to / (its files from the cache: the hashed assets are immutable, public/_headers).
import { reducedMQ } from '../motion.ts';
import { track } from '../quiz/track.ts';

const FLAG = 'skreed:to-top', VEIL_MS = 250;
const btn = document.getElementById('toTop');
const veil = document.getElementById('toTopVeil');
const home = location.pathname === '/';
const flag = {
  get: () => { try { return sessionStorage.getItem(FLAG) === '1'; } catch { return false; } },
  set: () => { try { sessionStorage.setItem(FLAG, '1'); } catch { /* private mode: the restored page simply stays where it was */ } },
  clear: () => { try { sessionStorage.removeItem(FLAG); } catch { /* nothing to clear */ } },
};

type NavEntry = { url: string | null; key: string; index: number };
type Nav = { currentEntry: NavEntry | null; entries(): NavEntry[]; traverseTo(key: string): { committed: Promise<unknown> } };

if (btn instanceof HTMLAnchorElement) {
  // the landing page: hidden in its first screen (section 1 is where it leads); a family page: always, since it leads to another page
  const update = () => { btn.hidden = home && scrollY < innerHeight * 0.9; };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
  // the landing page: the logotype's colour, which turns Urban Slate over the light fog (glitch.ts setTone, from the
  // scroll and the loop); a family page keeps Pearl Whisper on its dark ground
  const logo = home ? document.getElementById('siteLogo') : null;
  if (logo) {
    const tone = () => { if (logo.dataset.tone) btn.dataset.tone = logo.dataset.tone; else delete btn.dataset.tone; };
    new MutationObserver(tone).observe(logo, { attributes: true, attributeFilter: ['data-tone'] });
    tone();
  }

  /** section 1 at once: the hero's jump when its island runs, else a plain instant scroll */
  const jump = () => { if (window.__skreedTop) window.__skreedTop(); else scrollTo({ top: 0, behavior: 'instant' }); update(); };
  const frames = (n: number) => new Promise<void>((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const lift = async () => {
    if (!veil) return;
    await frames(2);   // the hero draws its rest frame under the veil first
    await veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: VEIL_MS, easing: 'linear', fill: 'forwards' }).finished.catch(() => {});
    veil.hidden = true; veil.getAnimations().forEach((a) => a.cancel()); veil.style.opacity = '';
  };
  const veiled = async (run: () => void) => {
    if (!veil || reducedMQ.matches) { run(); return; }
    veil.hidden = false;
    await veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: VEIL_MS, easing: 'linear', fill: 'forwards' }).finished.catch(() => {});
    run();
    await lift();
  };

  function backHome() {
    flag.set();
    const nav = (window as unknown as { navigation?: Nav }).navigation;
    try {
      if (nav?.currentEntry) {
        const entries = nav.entries();
        for (let i = nav.currentEntry.index - 1; i >= 0; i--) {
          const u = new URL(entries[i].url ?? '', location.href);
          if (u.origin === location.origin && u.pathname === '/') { nav.traverseTo(entries[i].key); return; }
        }
      } else {
        const r = document.referrer ? new URL(document.referrer) : null;
        if (r && r.origin === location.origin && r.pathname === '/' && history.length > 1) { history.back(); return; }
      }
    } catch { /* fall through to the link */ }
    location.assign('/');
  }

  btn.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab or window opens the home page as a link does
    e.preventDefault();
    track('to_top', { from: location.pathname });
    if (!home) { backHome(); return; }
    const keyboard = btn.matches(':focus-visible');
    void veiled(() => {
      jump();
      if (keyboard && logo) logo.focus({ preventScroll: true }); else btn.blur();
    });
  });

  if (home) {
    // a family page's press brought the visitor back: restored from the back-forward cache, the page is where they left it,
    // so it jumps to section 1 under the veil; a fresh load starts at the top anyway (loader.inline.js)
    // this module runs only on a fresh load (a restore resumes the page as it was), and a fresh load starts at the top
    flag.clear();
    addEventListener('pageshow', (e) => {
      if (!flag.get()) return;
      flag.clear();
      if (!e.persisted) return;
      if (veil && !reducedMQ.matches) { veil.hidden = false; veil.style.opacity = '1'; }
      jump();
      void lift();
    });
  }
}
