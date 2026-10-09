/* Test and staging builds only (Gate.astro concatenates it when PUBLIC_HERO_HOOKS is '1'): ?tier=poster|hero3d|still3d forces a tier. */
window.__skreedTierOverride = function () { var m = /[?&]tier=(poster|hero3d|still3d)(?:&|$)/.exec(location.search); return m ? m[1] : ''; };
