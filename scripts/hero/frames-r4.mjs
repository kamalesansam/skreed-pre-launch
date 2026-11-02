// Round 4's review frames (docs/specs/section-2.md 14.7, criterion 6): the hero's halved scroll map with the ten blocks
// leaving together, at 390x844 and 1280x800, from a served hooks build on the forced 3D tier. At each position the page is
// scrolled there and the followers snapped (`__skreedSnap`), the labels' reveal given its 0.75 s, and the viewport taken:
// pull-end (PULL), wipe-mid (CAS0, the ten about to leave), flight (CAS0 + FLY / 2, every block in the air), rest (LAND
// + 0.45, ten gems and ten labels), wipe2-mid (W2 + WIPE / 2) and quiz (TRACK_SVH / 100, the intro at rest). The flight
// progress of the ten (`__s2().L`) is printed at every position as the evidence for criterion 2 (ten equal values).
// Writes docs/specs/screenshots/hero-r4-<w>-<state>.png.
// Serve a hooks build first (PUBLIC_HERO_HOOKS=1 astro build --outDir dist-r4, node scripts/csp.mjs --dist dist-r4, then
// wrangler dev --assets dist-r4 --port 8811), then: node scripts/hero/frames-r4.mjs http://127.0.0.1:8811/?tier=hero3d
// The installed Chrome with its GPU (channel 'chrome', --ignore-gpu-blocklist) draws the island at real speed on a Mac;
// --swiftshader forces the harness's software path instead.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { S2T, TRACK_SVH } from '../../src/config/hero.ts';

const ARGS = process.argv.slice(2);
const BASE = ARGS.find((a) => !a.startsWith('--')) || 'http://127.0.0.1:8811/?tier=hero3d';
const SWIFT = ARGS.includes('--swiftshader');
const OUT = fileURLToPath(new URL('../../docs/specs/screenshots', import.meta.url));
mkdirSync(OUT, { recursive: true });
const r2 = (k) => +k.toFixed(3);
/** state name and position in screens, from the map */
const FRAMES = [
  ['pull-end', r2(S2T.PULL)], ['wipe-mid', r2(S2T.CAS0)], ['flight', r2(S2T.CAS0 + S2T.FLY / 2)], ['rest', r2(S2T.LAND + 0.45)],
  ['wipe2-mid', r2(S2T.W2 + S2T.WIPE / 2)], ['quiz', r2(TRACK_SVH / 100)],
];
const SETUPS = [
  { name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 },
  { name: '1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const launch = SWIFT
  ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }
  : { channel: 'chrome', args: ['--ignore-gpu-blocklist', '--enable-gpu'] };
const browser = await chromium.launch(launch);
const rows = [];
for (const s of SETUPS) {
  const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(s.name, 'pageerror', e.message));
  await page.goto(BASE, { waitUntil: 'load' });
  const t0 = Date.now();
  const ready = await page.waitForFunction(() => window.__s2 && window.__s2() && window.__s2().ready && !document.documentElement.classList.contains('intro'), null, { timeout: 420_000 }).then(() => true).catch(() => false);
  console.log(s.name, 'section 2 ready and the intro over:', ready, 'after', Math.round((Date.now() - t0) / 1000), 's');
  for (const [state, k] of FRAMES) {
    await page.evaluate((k) => { scrollTo(0, Math.round(k * innerHeight)); if (window.__skreedSnap) window.__skreedSnap(k); }, k);
    await sleep(1400);   // the labels' reveal (0.2 s leader, 0.4 s wipe, 0.75 s roll) and the glue's 0.5 s settle, where it applies
    const st = await page.evaluate(() => ({ sb: window.__skreedState ? window.__skreedState().sb : null, L: window.__s2 ? window.__s2().L : null, labels: window.__s2 ? window.__s2().labels : null, scrollY: scrollY / innerHeight }));
    const path = `${OUT}/hero-r4-${s.name}-${state}.png`;
    await page.screenshot({ path });
    const L = st.L || [], same = L.length === 10 && L.every((x) => x === L[0]);
    rows.push({ vp: s.name, state, screens: k, sb: st.sb, scrollY: r2(st.scrollY), L0: L[0], allEqual: same, labelsOn: (st.labels || []).filter(Boolean).length, file: path.replace(OUT + '/', '') });
    console.log(s.name, state, k, 'sb', st.sb, 'L', JSON.stringify(L), 'equal', same, 'labels on', (st.labels || []).filter(Boolean).length);
  }
  await ctx.close();
}
await browser.close();
console.table(rows);
