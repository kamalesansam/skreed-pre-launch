// The SiteLogo script (D25): installs the glitch on the corner logotype, exposes it as window.__skreedLogo, drains any
// calls the hero queued before it existed (window.__skreedLogoQ), and handles the logotype's click.
// On the 3D path the hero calls intro(0.25) at the loader's cut. With no loader on the page (the poster tier the Gate
// chose) the intro runs 0.75 s after install, the prototype's no-loader timing. A page whose loader already went to its
// poster state (offline at load) gets no extra burst.
import { createLogoGlitch } from './glitch.ts';
import { HERO_PARAMS } from '../../config/params.ts';
import { reducedMQ } from '../motion.ts';

type QueuedCall = [method: 'burst' | 'intro' | 'setTone', ...args: unknown[]];
const w = window as unknown as {
  __skreedLogo?: ReturnType<typeof createLogoGlitch>;
  __skreedLogoQ?: QueuedCall[];
  __skreedLoader?: unknown;
};

const link = document.getElementById('siteLogo');
if (link instanceof HTMLAnchorElement && !w.__skreedLogo) {
  const logo = createLogoGlitch(link, { split: HERO_PARAMS.logoSplit, idle: HERO_PARAMS.logoIdle });
  w.__skreedLogo = logo;
  for (const [m, ...a] of w.__skreedLogoQ?.splice(0) ?? []) (logo[m] as (...x: unknown[]) => void)(...a);
  if (!w.__skreedLoader) logo.intro(0.75);
  // home: on / the click scrolls to the top (instant under reduced motion); elsewhere the link navigates (D12)
  link.addEventListener('click', (e) => {
    if (location.pathname !== '/' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    scrollTo({ top: 0, behavior: reducedMQ.matches ? 'auto' : 'smooth' });
  });
}
