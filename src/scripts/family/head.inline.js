/* Family page head script (docs/specs/family-page.md 2.7 and 5 "First paint"). Identical bytes on all ten pages (one
   CSP hash): the page's own facts come from <meta name="skreed-family" content="{slug} {first NNN} {key NNN}">, which
   precedes this script. CFG is prepended by FamilyHeadFirst.astro: { slugs, has3d, reducedTier, minMemory, slowTypes }.
   Sets, before first paint: html.js; html.grid (with data-why; ?mode=grid gives "query") or html.m3d plus html.loading; data-first; data-shade (the key shade, or a
   valid ?shade= of this family, which also sets data-deeplink); data-finish from ?finish=. A ?shade= of another family
   replaces the location with that family's page; anything else is removed from the URL. */
var H = document.documentElement, c = H.classList, m = document.querySelector('meta[name="skreed-family"]');
var p = (m ? m.content : '').split(' '), first = +p[1], key = p[2];
c.add('js');
H.setAttribute('data-first', p[1]);
H.setAttribute('data-shade', key);
var n = navigator, k = n.connection || {}, rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
var q = new URLSearchParams(location.search), s = q.get('shade'), f = q.get('finish'), dirty = false;
var why = !CFG.has3d ? 'off' : q.get('mode') === 'grid' ? 'query' : !('WebGL2RenderingContext' in window) ? 'webgl' : k.saveData === true ? 'savedata'
  : CFG.slowTypes.indexOf(k.effectiveType) >= 0 ? 'slow' : n.deviceMemory !== undefined && n.deviceMemory <= CFG.minMemory ? 'memory'
  : rm && CFG.reducedTier === 'poster' ? 'reduced' : '';
/* 3D mode: the loader covers the page from first paint (section 20); ?mode=grid is the one way to ask for the grid (D7) */
if (why) { c.add('grid'); H.setAttribute('data-why', why); } else { c.add('m3d', 'loading'); if (rm) c.add('still3d'); }
if (s !== null) {
  if (/^\d{3}$/.test(s) && +s >= 1 && +s <= 240) {
    if (+s < first || +s >= first + 24) { c.add('leaving'); location.replace('/shades/' + CFG.slugs[(s - 1) / 24 | 0] + '/' + location.search + location.hash); return; }
    if (s !== key) { H.setAttribute('data-shade', s); H.setAttribute('data-deeplink', ''); }
  } else { q.delete('shade'); dirty = true; }
}
if (f === 'matte' || f === 'gloss') H.setAttribute('data-finish', f); else if (f !== null) { q.delete('finish'); dirty = true; }
if (dirty) { var t = q.toString(); history.replaceState(history.state, '', location.pathname + (t ? '?' + t : '') + location.hash); }
