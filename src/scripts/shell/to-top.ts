// Back to top (src/components/shell/BackToTop.astro), on every family page. On the landing page the section index's
// Home makes the jump Back to top made there (site-nav.ts; docs/specs/navbar.md, 2026-11-02, the index at the top right
// where this control sat), so the landing page draws no control: only the veil and this module, for the way back below.
// On a family page: a press steps back through the history to the landing page (the Navigation API's entries, or the
// referrer and history.back()), which the browser restores from its back-forward cache without a reload; a flag in
// sessionStorage tells the restored page to jump to section 1 under the veil (the hero's own jump when the island runs:
// scroll 0, its followers snapped, section 4 reset; a plain scroll on the poster tier). Reduced motion: the cut with no
// veil. With no landing page behind it, the link navigates to / (its files from the cache: the hashed assets are
// immutable, public/_headers).
import { track } from '../quiz/track.ts';
import { veiled } from './veil.ts';

const FLAG = 'skreed:to-top';
const btn = document.getElementById('toTop');
const home = location.pathname === '/';
const flag = {
  get: () => { try { return sessionStorage.getItem(FLAG) === '1'; } catch { return false; } },
  set: () => { try { sessionStorage.setItem(FLAG, '1'); } catch { /* private mode: the restored page simply stays where it was */ } },
  clear: () => { try { sessionStorage.removeItem(FLAG); } catch { /* nothing to clear */ } },
};

type NavEntry = { url: string | null; key: string; index: number };
type Nav = { currentEntry: NavEntry | null; entries(): NavEntry[]; traverseTo(key: string): { committed: Promise<unknown> } };

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

if (btn instanceof HTMLAnchorElement) {
  btn.hidden = false;   // always shown on a family page, since it leads to another page
  btn.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab or window opens the home page as a link does
    e.preventDefault();
    track('to_top', { from: location.pathname });
    backHome();
  });
}

if (home) {
  // a family page's press brought the visitor back: restored from the back-forward cache, the page is where they left it,
  // so it jumps to section 1 under the veil; this module runs only on a fresh load (a restore resumes the page as it was),
  // and a fresh load starts at the top anyway (loader.inline.js)
  flag.clear();
  addEventListener('pageshow', (e) => {
    if (!flag.get()) return;
    flag.clear();
    if (!e.persisted) return;
    void veiled(() => { if (window.__skreedTop) window.__skreedTop(); else scrollTo({ top: 0, behavior: 'instant' }); }, { covered: true });
  });
}
