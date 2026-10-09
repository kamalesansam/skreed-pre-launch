/* Gate (hero-architecture.md 8): picks the tier before first paint. CFG is prepended by Gate.astro from config/hero.ts. */
(function () {
  var H = document.documentElement, c = H.classList; c.add('js');
  var t = window.__skreedTierOverride ? window.__skreedTierOverride() : '';
  if (!t) {
    var n = navigator, k = n.connection || {}, rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    t = !('WebGL2RenderingContext' in window) || !('DecompressionStream' in window) || k.saveData === true ||
        CFG.slowTypes.indexOf(k.effectiveType) >= 0 || (n.deviceMemory !== undefined && n.deviceMemory <= CFG.minMemory) ||
        (rm && CFG.reducedTier === 'poster') ? 'poster' : rm ? 'still3d' : 'hero3d';
  }
  if (t === 'poster') c.add('poster'); else { c.add('hero3d', 'loading'); if (t === 'still3d') c.add('still3d'); }
  addEventListener('error', function (e) {
    var s = e.target; if (s && s.tagName === 'SCRIPT' && s.type === 'module' && !window.__heroStarted && window.__skreedLoader) window.__skreedLoader.fail('');
  }, true);
})();
