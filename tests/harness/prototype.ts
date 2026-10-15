// Serves the approved prototype, pinned at v9.10 (tests/fixtures/hero-v9.10/index.html, hash-checked by reference.ts),
// to a browser context, with three 0.165.0 from the port's own node_modules and Open Sans from the port's own file, so
// both pages draw with the same bytes. Everything else the prototype asks for is aborted. Stage 1 parity targets v9.10,
// never prototypes/hero-v9/, which later prototype builds replace in place. (hero-architecture.md 13.1, servePrototype)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BrowserContext } from '@playwright/test';
import { readReference, readReference11 } from './reference.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const PROTO_ORIGIN = 'https://proto.test';

/** Sam's locked values and logoIdle=0 as the prototype's URL overrides (hero.md section 0). */
export const PROTO_QUERY = '?gExp=0.2&gGamma=0.87&gNear=0.54&gToe=0.02&crumb=0.53&crumbSize=0.07&mist=0.2&mistSpeed=0.55'
  + '&fog=1&fogBright=0.4&fogSpeed=0.15&fogSize=1&fogHug=1.6&logoIdle=0';
export const PROTO_URL = PROTO_ORIGIN + '/' + PROTO_QUERY;
/** the v11.4 prototype with its intro skipped (the parity frames are taken at rest and on the scroll map, never in the shot) */
export const PROTO11_URL = PROTO_ORIGIN + '/' + PROTO_QUERY + '&intro=0';

const FONT_CSS = `@font-face{font-family:'Open Sans';font-style:normal;font-weight:400 600;font-display:swap;src:url(${PROTO_ORIGIN}/fonts/open-sans-400-600-latin.woff2) format('woff2')}`
  + `@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:500;font-display:swap;src:url(${PROTO_ORIGIN}/fonts/ibm-plex-mono-500-caps.woff2) format('woff2')}`;
const FONT_FILES = ['open-sans-400-600-latin.woff2', 'ibm-plex-mono-500-caps.woff2'];

export interface ServeOptions {
  /** false aborts three.js, so the prototype's module never starts (its loader falls to its poster state). */
  three?: boolean;
  /** which pinned prototype: v9.10 (the stage 1 reference, default) or v11.4 (round 3) */
  version?: 'v9.10' | 'v11.4';
}

export async function servePrototype(ctx: BrowserContext, opts: ServeOptions = {}): Promise<void> {
  const three = opts.three !== false;
  const html = opts.version === 'v11.4' ? readReference11('index.html') : readReference('index.html');
  await ctx.route(() => true, async (route) => {
    const u = new URL(route.request().url());
    if (u.origin === PROTO_ORIGIN && u.pathname === '/') {
      return route.fulfill({ body: html, headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    if (u.origin === PROTO_ORIGIN && u.pathname.startsWith('/fonts/') && FONT_FILES.includes(u.pathname.slice(7))) {
      return route.fulfill({ body: readFileSync(ROOT + 'public' + u.pathname), headers: { 'content-type': 'font/woff2', 'access-control-allow-origin': '*' } });
    }
    if (u.hostname === 'fonts.googleapis.com') return route.fulfill({ body: FONT_CSS, headers: { 'content-type': 'text/css' } });
    if (three && u.hostname === 'cdn.jsdelivr.net' && u.pathname.startsWith('/npm/three@0.165.0/')) {
      const file = ROOT + 'node_modules/three/' + u.pathname.slice('/npm/three@0.165.0/'.length);
      return route.fulfill({ body: readFileSync(file), headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' } });
    }
    return route.abort();
  });
}
