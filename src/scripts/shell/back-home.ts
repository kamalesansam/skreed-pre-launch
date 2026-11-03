// The way back to the landing page (2026-11-03: "make sure the caching is done properly so everytime a user visits a
// page from the main section, when they come back, the main section is already loaded and cached, so it just takes them
// back to whichever section they were in, instead of loading the whole site from the start all over again"). The landing
// page is kept whole by the browser's back-forward cache when the visitor leaves it (nothing on it blocks the cache: no
// unload handler, no no-store, measured in Chrome on the poster and 3D tiers, 2026-11-03), so going Back restores it at
// the section they left with nothing loaded again. A link to the landing page is a new navigation, which loads it from
// the start; so a link marked data-home, pressed on a page the visitor reached from the landing page, travels back
// through the history to the landing page's own entry instead (the Navigation API's traverseTo, which also reaches past
// a family switch; the referrer and one step Back where the browser has no Navigation API). Elsewhere (a visit that
// started on this page, a new tab) the link navigates as it is. A modifier press opens a new tab, as a link does.

type NavEntry = { url: string | null; key: string; index: number };
type Nav = { currentEntry: NavEntry | null; entries(): NavEntry[]; traverseTo(key: string): { committed: Promise<unknown> } };

const isLanding = (url: string | null) => {
  try { const u = new URL(url ?? '', location.href); return u.origin === location.origin && u.pathname === '/'; } catch { return false; }
};

/** Back through the history to the landing page's nearest entry; false where there is none to go back to. */
export function traverseToLanding(): boolean {
  const nav = (window as unknown as { navigation?: Nav }).navigation;
  try {
    if (nav?.currentEntry) {
      const entries = nav.entries();
      for (let i = nav.currentEntry.index - 1; i >= 0; i--) if (isLanding(entries[i].url)) { nav.traverseTo(entries[i].key); return true; }
      return false;
    }
    if (document.referrer && isLanding(document.referrer) && history.length > 1) { history.back(); return true; }
  } catch { /* fall through to the link */ }
  return false;
}

if (location.pathname !== '/') {
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-home]')) {
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (traverseToLanding()) e.preventDefault();
    });
  }
}
