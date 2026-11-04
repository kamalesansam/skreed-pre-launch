// The 3D's hard failures since 2026-11-04 (E-3D-only, Sam: "make sure to force load or run only the actual version of the
// site"): never the poster page or swatch grid mode. A failure reloads the page once (a passing network or GPU hiccup),
// offline it waits for the connection and reloads then, and only a second failure in the same visit shows the site note
// (SiteNote.astro). loadedOk clears the count once the 3D is up, so a later failure gets its reload too.
const KEY = 'skreed-3d-retry';
const H = document.documentElement;

export type NoteKind = 'unsupported' | 'failed' | 'offline';

export function showNote(kind: NoteKind): void {
  window.__skreedLoader?.abort();
  H.classList.add('nogl');
  H.dataset.note = kind;
}

export function failHard(): void {
  if (navigator.onLine === false) {
    showNote('offline');
    addEventListener('online', () => location.reload(), { once: true });
    return;
  }
  let n = 0;
  try { n = Number(sessionStorage.getItem(KEY) ?? 0) || 0; sessionStorage.setItem(KEY, String(n + 1)); } catch { n = 1; }   // no storage: no reload, so never a loop
  if (n < 1) location.reload(); else showNote('failed');
}

export function loadedOk(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
