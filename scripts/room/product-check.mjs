// Section 4's product colours against the catalog (docs/specs/section-4-flux.md 3 "Materials and lights", AC2: under
// a white key the lit face of each product samples within dE00 8 of its catalog hex; the build record's D4). Each scene
// at rest through the hooks at 1280 x 800 and at 390 x 844 (the portrait class, where the raised placement shows the
// product from lower down), device pixel ratio 1 (a CSS pixel is a pixel of the shot): the carousel's
// lights set to a white key (the tint off) with the fill and the environment on, the planes, the logo and the trim
// hidden so the body alone is drawn on the carousel's black, the section's text and the logotype hidden through the
// CSSOM, one shot; inside the central region of the product's box (the hooks' placement, the middle 50 percent each
// way) every pixel that is not the black behind the body is read, and the median of each channel is the lit face's
// colour. dE00 (CIEDE2000, D65) of that colour against the scene's catalog hex is printed, with the drawn hex and the
// share of pixels at 255 in a channel. Serve a hooks build (build:test) first:
//   node scripts/room/product-check.mjs [base=http://127.0.0.1:4322/] [--views 1280x800,390x844] [--key k] [--env e] [--metalEnv m] [--fill f] [--tint] [--try "k,e,m,f;..."] [--json <file>]
// --key, --env, --metalEnv and --fill try other intensities live (the build's own are the defaults, LIGHTS in
// carousel.ts; metalEnv is the environment's intensity on the metallic finish, which reflects it rather than gathering
// it, set here for the class in force at the viewport: metalEnvPortrait where the viewport is taller than wide); --try
// runs several settings in one session; --tint keeps the scene's key tint on (the frames' colours, not AC2's reading). The browser is the installed Chrome (channel chrome) when present, else Playwright's Chromium; WebGL
// on the Metal GPU, or SKREED_GL=swiftshader for the test harness's flags.
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { ROOM_SCENES, productById } from '../../src/config/room.ts';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const jsonOut = opt('--json');
const setting = { tint: args.includes('--tint'), bodyOnly: true };
for (const k of ['key', 'env', 'metalEnv', 'fill']) { const v = opt(`--${k}`); if (v !== undefined) setting[k] = Number(v); }
const tries = opt('--try') ? opt('--try').split(';').map((t) => { const [key, env, metalEnv, fill] = t.split(',').map(Number); return { ...setting, key, env, metalEnv, fill }; }) : [setting];
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
/** the viewports (CSS px): the wide class on the laptop, the portrait class on the phone; --views picks others */
const VIEWS = (opt('--views') ?? '1280x800,390x844').split(',').map((v) => { const [width, height] = v.split('x').map(Number); return { width, height }; });
const REGION = 0.5;   // the central share of the product's box read, each way
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- sRGB to Lab (D65) and CIEDE2000
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function lab([r, g, b]) {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047, y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B, z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
/** CIEDE2000 (Sharma, Wu and Dalal 2005), kL = kC = kH = 1 */
export function dE00(rgb1, rgb2) {
  const [L1, a1, b1] = lab(rgb1), [L2, a2, b2] = lab(rgb2), rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G), C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h = (a, b) => (a === 0 && b === 0 ? 0 : ((Math.atan2(b, a) * deg) + 360) % 360);
  const h1p = h(a1p, b1), h2p = h(a2p, b2);
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lmp = (L1 + L2) / 2, Cmp = (C1p + C2p) / 2;
  let hmp = h1p + h2p;
  if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hmp += hmp < 360 ? 360 : -360; hmp /= 2; }
  const T = 1 - 0.17 * Math.cos((hmp - 30) * rad) + 0.24 * Math.cos(2 * hmp * rad) + 0.32 * Math.cos((3 * hmp + 6) * rad) - 0.2 * Math.cos((4 * hmp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hmp - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lmp - 50) ** 2) / Math.sqrt(20 + (Lmp - 50) ** 2), SC = 1 + 0.045 * Cmp, SH = 1 + 0.015 * Cmp * T, RT = -Math.sin(2 * dTheta * rad) * RC;
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH));
}
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };

/** the installed Chrome when Playwright finds it, else its own Chromium */
async function launch(a) {
  try { const b = await chromium.launch({ channel: 'chrome', args: a }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium`); return chromium.launch({ args: a }); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const browser = await launch(GL);
  const runs = [];
  for (const VIEW of VIEWS) {
    const view = `${VIEW.width}x${VIEW.height}`;
    const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.warn(`[${view}] page error:`, e.message));
    await page.goto(new URL('/?tier=hero3d&glue=0', base).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 240_000 });
    await page.evaluate(() => window.__skreedIntro?.skip?.());
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => {});
    console.log(`[${view}] renderer:`, await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const x = c?.getExtension('WEBGL_debug_renderer_info'); return x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; }));
    const go = async (q, settle = 900) => {
      await page.evaluate((qq) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, q);
      await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 120_000 });
      await page.waitForFunction(() => { const s = window.__s4?.state(); return !!s?.layout && !s.layout.intro; }, null, { timeout: 30_000 }).catch(() => {});
      await page.evaluate((qq) => window.__skreedRoom?.snap(qq), q);
      await sleep(settle);
    };
    await go(1, 1200); await go(4, 300); await go(9.5, 1500);
    await page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
    await page.evaluate(() => window.__s4.scene(0));
    await page.waitForFunction(() => window.__s4.state().state === 'world' && window.__s4.state().products === 'in', null, { timeout: 120_000 });
    await page.evaluate(() => { for (const el of [document.getElementById('rmStage'), document.querySelector('.site-logo'), document.getElementById('toTop')]) if (el) el.style.visibility = 'hidden'; });
    for (const one of tries) {
      // the metallic value named applies to the class in force at this viewport
      const forView = (() => { if (VIEW.height <= VIEW.width || one.metalEnv === undefined) return one; const { metalEnv, ...rest } = one; return { ...rest, metalEnvPortrait: metalEnv }; })();
      const inForce = await page.evaluate((s) => window.__s4.lights(s), forView);
      console.log(`[${view}] the lights in force:`, JSON.stringify(inForce));
      const rows = [];
      for (const sc of ROOM_SCENES) {
        await page.evaluate((j) => window.__s4.scene(j), sc.i);
        await page.waitForFunction((j) => { const s = window.__s4.state(); return s.state === 'world' && s.scene === j && !s.busy; }, sc.i, { timeout: 60_000 });
        await sleep(1500);   // the key light's cross-fade is 1.1 s; the body alone is drawn whatever the loop does
        const box = (await page.evaluate(() => window.__s4.state().product))?.box;
        if (!box) { console.warn(`[${view}] scene ${sc.order} ${sc.id}: no product box (products.bin not in?)`); continue; }
        const png = await page.screenshot();
        const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const bx = box.x0 * info.width, by = box.y0 * info.height, bw = (box.x1 - box.x0) * info.width, bh = (box.y1 - box.y0) * info.height;
        const x0 = Math.round(bx + bw * (1 - REGION) / 2), x1 = Math.round(bx + bw * (1 + REGION) / 2), y0 = Math.round(by + bh * (1 - REGION) / 2), y1 = Math.round(by + bh * (1 + REGION) / 2);
        const R = [], Gc = [], B = []; let clipped = 0, all = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const k = (y * info.width + x) * 3, r = data[k], g = data[k + 1], b = data[k + 2];
          all++;
          if (r + g + b < 6) continue;   // the black behind the body (the holes of the Lenskin, the room round a narrow product)
          R.push(r); Gc.push(g); B.push(b);
          if (r === 255 || g === 255 || b === 255) clipped++;
        }
        const drawn = [median(R), median(Gc), median(B)], want = hexRgb(sc.hex);
        const row = { scene: sc.order, id: sc.id, product: productById(sc.product).name, shade: `${sc.shadeName} (${sc.shade})`, finish: sc.finish, catalog: sc.hex, drawn: toHex(drawn), dE00: +dE00(drawn, want).toFixed(2), pixels: R.length, clipped: +(R.length ? clipped / R.length : 0).toFixed(3), region: [x0, y0, x1 - x0, y1 - y0] };
        rows.push(row);
        console.log(`[${view}] scene ${sc.order} ${sc.id}: ${row.product}, ${row.shade}, ${row.finish}: drawn ${row.drawn} against ${row.catalog}, dE00 ${row.dE00} (${row.pixels} of ${all} px read in the region at ${row.region.join(', ')}; ${(row.clipped * 100).toFixed(1)} percent at 255)`);
      }
      runs.push({ view, lights: inForce, rows });
    }
    await ctx.close();
  }
  await browser.close();
  let ok = true;
  for (const { view, lights, rows } of runs) {
    console.log(`\n${view}: key ${lights.key}, environment ${lights.env} (metallic ${lights.metalEnv} on the wide class, ${lights.metalEnvPortrait} on the portrait class), fill ${lights.fill}, the tint ${lights.tint ? 'on' : 'off'}`);
    console.table(rows.map(({ region, ...r }) => r));
    const worst = Math.max(...rows.map((r) => r.dE00)), clipped = Math.max(...rows.map((r) => r.clipped)), pass = rows.length === ROOM_SCENES.length && worst <= 8;
    console.log(`AC2 at ${view}: every product within dE00 8 under the white key: ${pass ? 'yes' : 'NO'} (the worst ${worst.toFixed(2)}; the largest share at 255 ${(clipped * 100).toFixed(1)} percent)`);
    ok &&= pass;
  }
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ base, runs }, null, 1) + '\n');
  process.exit(ok ? 0 : 1);
}
