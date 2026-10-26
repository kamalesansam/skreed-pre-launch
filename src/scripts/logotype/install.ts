// The SiteLogo script (D25): installs the glitch on the corner logotype, exposes it as window.__skreedLogo, drains any
// calls the hero queued before it existed (window.__skreedLogoQ), and handles the logotype's click.
// On the 3D path the hero calls intro(0.25) at the loader's cut. With no loader on the page (the poster tier the Gate
// chose) the intro runs 0.75 s after install, the prototype's no-loader timing. A page whose loader already went to its
// poster state (offline at load) gets no extra burst.
// On / it installs the same glitch on the countdown's four numeral pairs (E-CD-glitch), exposed as window.__skreedCount:
// one burst breaks all four at once, the intro bursts it with the logotype, and its idle twitch runs on its own timer.
import { createLogoGlitch, type LogoGlitch } from './glitch.ts';
import { LOGO_IDLE, LOGO_SPLIT, IDLE_EVERY, COUNT_TARGET } from '../../config/glitch.ts';
import { reducedMQ } from '../motion.ts';

type QueuedCall = [method: 'burst' | 'intro' | 'setTone', ...args: unknown[]];
const w = window as unknown as {
  __skreedLogo?: LogoGlitch;
  __skreedCount?: LogoGlitch;
  __skreedLogoQ?: QueuedCall[];
  __skreedLoader?: unknown;
};

const link = document.getElementById('siteLogo');
if (link instanceof HTMLAnchorElement && !w.__skreedLogo) {
  const logo = createLogoGlitch(link, { split: LOGO_SPLIT, idle: LOGO_IDLE, every: IDLE_EVERY });
  const count = document.getElementById('count');
  if (count && !w.__skreedCount) {
    const pairs = Array.from(count.querySelectorAll<HTMLElement>(':scope > div')).map((g, i) =>
      createLogoGlitch(g, { split: LOGO_SPLIT, idle: 0, interactive: false, target: { ...COUNT_TARGET, href: '#cdg-' + 'dhms'[i], prefix: 'cg' + i + '-' } }));
    const all = (f: (g: LogoGlitch) => void) => pairs.forEach(f);
    // the four pairs burst as one; the idle timer lives here so one draw covers them all
    const cfg = { idle: LOGO_IDLE, every: IDLE_EVERY as readonly [number, number] };
    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      if (!cfg.idle) return;
      const [lo, hi] = cfg.every;
      timer = window.setTimeout(() => { if (cfg.idle) all((g) => g.burst(0.25)); schedule(); }, (lo + Math.random() * (hi - lo)) * 1000);
    };
    schedule();
    w.__skreedCount = {
      burst: (d, delay) => all((g) => g.burst(d, delay)),
      intro: (delay) => all((g) => g.intro(delay)),
      setTone: (light) => { count.dataset.tone = light ? 'light' : 'dark'; },
      configure: (o) => { if (o.idle !== undefined) cfg.idle = o.idle; if (o.every) cfg.every = o.every; if (o.split !== undefined) all((g) => g.configure({ split: o.split })); schedule(); },
    };
  }
  w.__skreedLogo = {
    burst: logo.burst,
    intro: (delay) => { logo.intro(delay); w.__skreedCount?.intro(delay); },
    setTone: logo.setTone,
    configure: (o) => { logo.configure(o); w.__skreedCount?.configure(o); },
  };
  for (const [m, ...a] of w.__skreedLogoQ?.splice(0) ?? []) (w.__skreedLogo[m] as (...x: unknown[]) => void)(...a);
  if (!w.__skreedLoader) w.__skreedLogo.intro(0.75);
  // home: on / the click scrolls to the top (instant under reduced motion); elsewhere the link navigates (D12)
  link.addEventListener('click', (e) => {
    if (location.pathname !== '/' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    scrollTo({ top: 0, behavior: reducedMQ.matches ? 'auto' : 'smooth' });
  });
}
