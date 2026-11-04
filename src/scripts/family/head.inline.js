/* Family page head script (docs/specs/family-page.md 2.7 and 5 "First paint"). Identical bytes on all ten pages (one
   CSP hash): the page's own facts come from <meta name="skreed-family" content="{slug} {first NNN} {key NNN}">, which
   precedes this script. CFG is prepended by FamilyHeadFirst.astro: { slugs, has3d, hooks }.
   Sets, before first paint: html.js; html.grid (with data-why; ?mode=grid gives "query") or html.m3d plus html.loading; data-first; data-shade (the key shade, or a
   valid ?shade= of this family, which also sets data-deeplink); data-finish from ?finish=. A ?shade= of another family
   replaces the location with that family's page; anything else is removed from the URL. */
var H = document.documentElement, c = H.classList, m = document.querySelector('meta[name="skreed-family"]');
var p = (m ? m.content : '').split(' '), first = +p[1], key = p[2];
c.add('js');
H.setAttribute('data-first', p[1]);
H.setAttribute('data-shade', key);
var q = new URLSearchParams(location.search), s = q.get('shade'), f = q.get('finish'), dirty = false;
/* every visitor gets the 3D (Sam, 2026-11-04, E-3D-only): data saver, a slow connection, little memory and Reduce motion no
   longer pick swatch grid mode. A browser with no WebGL2 gets the site note's one line (SiteNote.astro) over the grid, which
   is never shown; ?mode=grid asks for the grid in test and staging builds only (D7) */
var why = !CFG.has3d ? 'off' : CFG.hooks && q.get('mode') === 'grid' ? 'query' : !('WebGL2RenderingContext' in window) ? 'webgl' : '';
/* 3D mode: the loader covers the page from first paint (section 20) */
if (why) { c.add('grid'); H.setAttribute('data-why', why); if (why === 'webgl') { c.add('nogl'); H.setAttribute('data-note', 'unsupported'); } } else c.add('m3d', 'loading');
if (s !== null) {
  if (/^\d{3}$/.test(s) && +s >= 1 && +s <= 240) {
    if (+s < first || +s >= first + 24) { c.add('leaving'); location.replace('/shades/' + CFG.slugs[(s - 1) / 24 | 0] + '/' + location.search + location.hash); return; }
    if (s !== key) { H.setAttribute('data-shade', s); H.setAttribute('data-deeplink', ''); }
  } else { q.delete('shade'); dirty = true; }
}
if (f === 'matte' || f === 'gloss') H.setAttribute('data-finish', f); else if (f !== null) { q.delete('finish'); dirty = true; }
if (dirty) { var t = q.toString(); history.replaceState(history.state, '', location.pathname + (t ? '?' + t : '') + location.hash); }
