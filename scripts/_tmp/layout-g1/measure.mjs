// throwaway (layout builder, G1): section 5's fit at its rest on the dev server, poster tier (layout only) or 3D path
//   node scripts/_tmp/layout-g1/measure.mjs [--3d] [--shots <dir>] [--sizes 390x844,390x664] [--off]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const base = 'http://127.0.0.1:4321/';
const is3d = args.includes('--3d');
const si = args.indexOf('--shots'), shots = si >= 0 ? args[si + 1] : null;
const zi = args.indexOf('--sizes');
const SIZES = (zi >= 0 ? args[zi + 1] : '390x844,360x780,390x664,375x667,1280x800,1366x657,1536x730,1920x970,768x1024').split(',').map((s) => s.split('x').map(Number));
const off = args.includes('--off');   // the form off: drop it from the DOM and the marker (production's markup)
// --g1max N: the short phone's rules injected again under max-height N px (a what-if, the file untouched)
const gi = args.indexOf('--g1max'), g1max = gi >= 0 ? Number(args[gi + 1]) : 0;
import { readFileSync } from 'node:fs';
const g1css = (() => { const s = readFileSync(new URL('../../../src/styles/signup.css', import.meta.url), 'utf8'); const a = s.indexOf('@media (max-width: 719px) and (max-height: 779px) {'); const b = s.indexOf('\n}\n', a); return s.slice(a, b + 3).replace('max-height: 700px', `max-height: ${g1max}px`); })();
if (shots) mkdirSync(shots, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist', '--enable-gpu'] });

async function measure(page) {
  return page.evaluate(() => {
    const root = document.getElementById('signup'), body = root.querySelector('.su-body');
    const s4 = window.__s4?.state?.();
    const top = root.getBoundingClientRect().top + scrollY, exit = body.getBoundingClientRect().bottom + scrollY - innerHeight;
    const rest = Number.isFinite(s4?.restY) ? s4.restY : Math.max(top, exit);
    scrollTo({ top: rest, behavior: 'instant' }); window.__skreedSnap?.(rest / innerHeight);
    const r = (el) => el.getBoundingClientRect();
    const q = (s) => root.querySelector(s);
    const band = Math.max(...['.site-logo', '#toTop'].map((s) => { const e = document.querySelector(s); if (!e) return 0; const b = r(e); return b.height ? b.bottom : 0; }));
    const toTop = document.querySelector('#toTop'), tt = toTop && r(toTop);
    // every visible piece of text: the decode's rows and the field
    const texts = [...root.querySelectorAll('.su-body [data-dc], .su-body .su-credit, .su-input, .su-done-text')].filter((e) => { const b = r(e); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'); });
    const fonts = texts.map((e) => parseFloat(getComputedStyle(e).fontSize));
    const tops = texts.map((e) => r(e).top), bottoms = texts.map((e) => r(e).bottom);
    const controls = [...root.querySelectorAll('a.su-follow, #suSend, .su-input, .su-check, .su-notyou')].filter((e) => r(e).height > 0 && !e.closest('[hidden]')).map((e) => ({ k: e.className || e.id, h: +r(e).height.toFixed(1), w: +r(e).width.toFixed(1) }));
    const slot = r(q('.su-slot'));
    const f = (x) => +x.toFixed(1);
    const font = (s) => { const e = q(s); return e ? f(parseFloat(getComputedStyle(e).fontSize)) : null; };
    return {
      vw: innerWidth, vh: innerHeight, rest: f(rest), top: f(top), exit: f(exit), scrollY: f(scrollY),
      bodyH: f(r(body).height), band: f(band), toTop: tt ? f(tt.bottom) : null,
      head: f(r(q('.su-h')).top), credit: f(r(q('.su-credit')).bottom),
      minTop: f(Math.min(...tops)), maxBottom: f(Math.max(...bottoms)),
      minFont: f(Math.min(...fonts)), fonts: { line: font('.su-sub'), head: font('.su-h'), credit: font('.su-credit'), msg: font('#suMsg'), field: font('.su-input') },
      controls: controls.reduce((m, c) => Math.min(m, c.h), 1e9), controlList: controls,
      hScroll: document.documentElement.scrollWidth > innerWidth,
      slot: { x: f(slot.x), y: f(slot.y), w: f(slot.width), h: f(slot.height) },
      placed: window.__s5?.state?.()?.placed ? (({ box, px }) => ({ px: f(px), box: { x: f(box.x), y: f(box.y), w: f(box.w), h: f(box.h) } }))(window.__s5.state().placed) : null,
      s5slot: window.__s5?.state?.()?.slot ?? null,
      lines: { sub: Math.round(r(q('.su-sub')).height / (parseFloat(getComputedStyle(q('.su-sub')).fontSize) * 1.45)), gotSub: Math.round(r(q('.su-got-sub')).height / (parseFloat(getComputedStyle(q('.su-got-sub')).fontSize) * 1.45)), h: Math.round(r(q('.su-h')).height / (parseFloat(getComputedStyle(q('.su-h')).fontSize) * 1.25)) },
      leads: root.hasAttribute('data-leads'), form: !!q('#suForm'),
    };
  });
}

for (const [w, h] of SIZES) {
  const phone = w < 720;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${w}x${h}] page error:`, e.message));
  try {
    await page.goto(new URL(is3d ? '/?tier=hero3d&glue=0&room=open' : '/?tier=poster&room=open', base).href, { waitUntil: 'load', timeout: 120_000 });
    if (is3d) {
      await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 300_000 });
      await page.evaluate(() => window.__skreedIntro?.skip?.());
      await page.evaluate(() => window.__s5?.load());
      await page.waitForFunction(() => !!window.__s5?.ready || !!window.__s5?.state?.()?.failed, null, { timeout: 120_000 }).catch(() => console.warn('the jar did not come in'));
    }
    await page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 20_000 });
    await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.style.setProperty('display', 'none', 'important'));
    if (off) await page.evaluate(() => { document.getElementById('suForm')?.remove(); document.getElementById('signup').removeAttribute('data-leads'); });
    if (g1max) await page.addStyleTag({ content: g1css });
    await page.evaluate(() => { const el = document.getElementById('signup'); scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }); window.__skreedSnap?.(scrollY / innerHeight); });
    await page.evaluate(() => document.fonts.ready);
    await sleep(is3d ? 1500 : 900);
    await measure(page);
    await sleep(is3d ? 1200 : 300);
    const m = await measure(page);
    const fits = m.head >= m.band && m.credit <= m.vh && m.minTop >= m.band && m.maxBottom <= m.vh;
    console.log(`${w}x${h} ${off ? 'off' : 'on'} fits=${fits} head ${m.head} (band ${m.band}) credit ${m.credit} of ${m.vh} | body ${m.bodyH} rest ${m.rest} top ${m.top} | fonts ${JSON.stringify(m.fonts)} min ${m.minFont} | controls min ${m.controls} | hScroll ${m.hScroll} | slot ${JSON.stringify(m.slot)} | lines ${JSON.stringify(m.lines)} | leads ${m.leads}${m.placed ? ` | placed ${JSON.stringify(m.placed)}` : ''}`);
    if (shots) await page.screenshot({ path: join(shots, `${w}x${h}-${off ? 'off' : 'on'}${is3d ? '-3d' : ''}.png`) });
  } catch (e) { console.warn(`[${w}x${h}] failed:`, String(e.message ?? e).split('\n')[0]); }
  await ctx.close();
}
await browser.close();
