// Option B's review (docs/specs/section-4-world.md 2 "Option B", 6 "Frame cost", AC1, AC5): the park's travels between
// the lands, from a staging build (Tune on, every option loaded on demand) served with a server up, driven by the
// review hooks (__s4.travel(i, j, p) holds a travel at p) with Tune's parkTravel set to B before the press, in
// Playwright's Chromium. Three parts, each by its flag:
//   node scripts/room/park-review.mjs <base> <out> --frames   the travel 1 to 2 at 0, 25, 50, 75 and 100 percent, 2 to 3
//                                                             and 3 to 4 at half, back 2 to 1 at half, at 390 x 844 and
//                                                             1280 x 800, and a sheet of them (sheet.png)
//   node scripts/room/park-review.mjs <base> <out> --cost     each travel at half timed at DPR 1.25 with the family page's
//                                                             probe (family-page.md 2.5: the display's period P from 10
//                                                             frames of an idle page, then 20 frames of the travel held at
//                                                             half; pass at a median of 1.25 P or less), under Chrome's
//                                                             4x CPU throttle; the land at rest beside it for scale
//   node scripts/room/park-review.mjs <base> <out> --flash    AC5's sweep: each travel at 60 steps a second of its time,
//                                                             at 390 x 844 and 1280 x 800 in CSS px: no 341 x 256 region
//                                                             with more than three flashes of 25 percent of its area in
//                                                             any one second (general and saturated red; the method is
//                                                             at the sweep below)
//   node scripts/room/park-review.mjs <base> <out> --fail     the park's model, then its lightmap, refused by the network:
//                                                             the travel is the 300 ms cross-fade, the land's line reads
//                                                             Park blocked (a Tune build), and nothing throws
// SKREED_GL=swiftshader runs WebGL on SwiftShader (the test harness's flags), otherwise the Mac's GPU through ANGLE's
// Metal. Every console error, page error and CSP violation is reported; results go to <out>/review.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:5317/';
const out = args.find((a) => !/^(https?:|--)/.test(a)) ?? 'park-review';
const want = (f) => args.includes(f);
const SWIFT = process.env.SKREED_GL === 'swiftshader';
const GL = SWIFT ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
const SETUPS = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 },
};
const report = { base, gl: SWIFT ? 'swiftshader' : 'metal', renderer: {}, frames: [], cost: [], flash: [], problems: [] };
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: GL });

/** a page on the 3D path with Tune's parkTravel at B, entered and at land 1 with option B loaded */
async function open(name, setup, refuse = null) {
  const ctx = await browser.newContext(setup);
  if (refuse) await ctx.route(refuse, (r) => r.abort('failed'));
  await ctx.addInitScript(() => {
    window.__cspViolations = [];
    addEventListener('securitypolicyviolation', (e) => window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.problems.push(`[${name}] page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || /option B|park/i.test(m.text())) report.problems.push(`[${name}] console ${m.type()}: ${m.text()}`); });
  await page.goto(new URL('/?tier=hero3d&tune', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => window.__skreedIntro.skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading') && !!window.__skreedTune?.room, null, { timeout: 300_000, polling: 500 });
  // Tune's panel out of the frames, through the CSSOM (the CSP has no inline styles)
  await page.evaluate(() => { for (const el of document.querySelectorAll('#tune, astro-dev-toolbar')) el.style.display = 'none'; });
  await page.evaluate(() => { window.__skreedTune.room.params.parkTravel = 1; });
  report.renderer[name] = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const x = c?.getExtension('WEBGL_debug_renderer_info'); return x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  console.log(`[${name}] ${report.renderer[name]}`);
  // the station, the world and land 1 in, then straight to land 1 (the press: B's chunk, model and lightmap load now)
  await page.evaluate(() => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + 9.5 * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(9.5); });
  await page.waitForFunction(() => window.__s4?.ready && window.__s4.state()?.worldReady, null, { timeout: 600_000, polling: 500 });
  await page.evaluate(() => window.__s4.land(0));
  await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 60_000 });
  if (refuse) return { ctx, page };
  // B is ready once a held travel plays as B rather than as the cross-fade
  const t0 = Date.now();
  for (;;) {
    await rest(page, 0);
    await page.waitForFunction(() => window.__s4.state().resident.some((r) => r.i === 1 && r.ready), null, { timeout: 120_000 });
    await page.evaluate(() => window.__s4.travel(0, 1, 0.5));
    const o = await page.evaluate(() => window.__s4.state().travel?.option);
    if (o === 'B') break;
    if (Date.now() - t0 > 180_000) throw new Error(`[${name}] option B never became ready (the travel plays as ${o})`);
    await page.waitForTimeout(500);
  }
  report.renderer[`${name} B ready after`] = `${((Date.now() - t0) / 1000).toFixed(1)} s from land 1 (approximate, polled)`;
  return { ctx, page };
}
/** land i at rest, its neighbours resident */
async function rest(page, i) {
  await page.evaluate((j) => window.__s4.land(j), i);
  await page.waitForFunction((j) => { const s = window.__s4.state(); return s.sub !== 'travel' && [j - 1, j, j + 1].filter((k) => k >= 0 && k < s.lands).every((k) => s.resident.some((r) => r.i === k && r.ready)); }, i, { timeout: 120_000 });
}
/** the travel from i to j held at p, two frames drawn */
async function hold(page, i, j, p, expectB = true) {
  const s = await page.evaluate((a) => { window.__s4.travel(a[0], a[1], a[2]); return window.__s4.state(); }, [i, j, p]);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  if (expectB && s.travel?.option !== 'B') report.problems.push(`travel ${i + 1} to ${j + 1} at ${p} played as ${s.travel?.option ?? 'nothing'}, not B`);
  return s;
}
const finish = async (page, name) => {
  const v = await page.evaluate(() => window.__cspViolations);
  if (v.length) report.problems.push(`[${name}] CSP violations: ${v.join('; ')}`);
};

// ---- the frames and the sheet
if (want('--frames')) {
  const shots = [];
  for (const [name, setup] of Object.entries(SETUPS)) {
    const { ctx, page } = await open(name, setup);
    const W = setup.viewport.width, f = (s) => join(out, `park-${W}-${s}.png`);
    const plan = [[0, 1, 0], [0, 1, 0.25], [0, 1, 0.5], [0, 1, 0.75], [0, 1, 1], [1, 2, 0.5], [2, 3, 0.5], [1, 0, 0.5]];
    let at = -1;
    for (const [i, j, p] of plan) {
      if (at !== i) { await rest(page, i); at = i; }
      await hold(page, i, j, p);
      await page.waitForTimeout(250);
      const file = f(`${i + 1}-${j + 1}-${String(Math.round(p * 100)).padStart(3, '0')}`);
      await page.screenshot({ path: file });
      shots.push({ name, W, i, j, p, file });
      report.frames.push(file);
      console.log('  ', file);
    }
    // Tune switching options disposes B, and switching back loads it again (spec 5, "Build modes")
    await rest(page, 0);
    const before = await page.evaluate(() => window.__skreedPrograms?.() ?? -1);
    await page.evaluate(() => { window.__skreedTune.room.params.parkTravel = 0; });
    await page.waitForFunction(() => window.__s4.state().option === 'A', null, { timeout: 30_000 });
    await page.evaluate(() => { window.__skreedTune.room.params.parkTravel = 1; });
    await page.waitForFunction(() => window.__s4.state().option === 'B', null, { timeout: 30_000 });
    let again = 'cross-fade';
    for (let k = 0; k < 60 && again !== 'B'; k++) { await page.waitForTimeout(500); await rest(page, 0); again = (await hold(page, 0, 1, 0.5, false)).travel?.option; }
    report.renderer[`${name} switch`] = `B to A to B: the travel plays as ${again} again; programs ${before} before, ${await page.evaluate(() => window.__skreedPrograms?.() ?? -1)} after`;
    await finish(page, name);
    await ctx.close();
  }
  // the sheet: a row per size, each frame at half its device size, labelled
  const rows = [];
  for (const name of Object.keys(SETUPS)) {
    const list = shots.filter((s) => s.name === name);
    const tiles = await Promise.all(list.map(async (s) => {
      const img = sharp(s.file), m = await img.metadata(), w = Math.round(m.width / (name === 'phone' ? 4 : 3)), h = Math.round(m.height / (name === 'phone' ? 4 : 3));
      const label = `${s.W}: ${s.i + 1} to ${s.j + 1} at ${Math.round(s.p * 100)}%`;
      const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="24"><rect width="100%" height="100%" fill="#383F43"/><text x="6" y="17" font-family="Menlo, monospace" font-size="13" fill="#F7F6F3">${label}</text></svg>`);
      const buf = await img.resize(w, h).png().toBuffer();
      return { w, h: h + 24, buf: await sharp({ create: { width: w, height: h + 24, channels: 3, background: '#383F43' } }).composite([{ input: svg, top: 0, left: 0 }, { input: buf, top: 24, left: 0 }]).png().toBuffer() };
    }));
    const W = tiles.reduce((a, t) => a + t.w + 8, 8), H = Math.max(...tiles.map((t) => t.h)) + 16;
    let x = 8;
    const comp = tiles.map((t) => { const c = { input: t.buf, top: 8, left: x }; x += t.w + 8; return c; });
    rows.push({ W, H, buf: await sharp({ create: { width: W, height: H, channels: 3, background: '#F7F6F3' } }).composite(comp).png().toBuffer() });
  }
  const SW = Math.max(...rows.map((r) => r.W)), SH = rows.reduce((a, r) => a + r.H, 0);
  let y = 0;
  await sharp({ create: { width: SW, height: SH, channels: 3, background: '#F7F6F3' } }).composite(rows.map((r) => { const c = { input: r.buf, top: y, left: 0 }; y += r.H; return c; })).png().toFile(join(out, 'sheet.png'));
  console.log('  ', join(out, 'sheet.png'));
}

// ---- the frame cost (family-page.md 2.5's probe), DPR 1.25, 4x CPU throttle
if (want('--cost')) {
  const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
  const intervals = (page, n) => page.evaluate((k) => new Promise((r) => { const t = []; const f = (now) => { t.push(now); if (t.length > k) r(t.slice(1).map((v, i) => v - t[i])); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
  for (const [name, vp] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.25, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.25 }]]) {
    const { ctx, page } = await open(`${name} 1.25`, vp);
    const cdp = await ctx.newCDPSession(page);
    // P: 10 animation frames of an idle page in the same browser and throttle (the island draws every frame here)
    const idle = await ctx.newPage(); await idle.goto('about:blank');
    const icdp = await ctx.newCDPSession(idle); await icdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await idle.bringToFront();
    const P = Math.min(...(await intervals(idle, 10)));
    await idle.close();
    await page.bringToFront();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const row = { setup: `${vp.viewport.width} x ${vp.viewport.height} at DPR 1.25`, gl: report.gl, renderer: report.renderer[`${name} 1.25`], throttle: '4x CPU', P: +P.toFixed(2), states: [] };
    const time = async (label) => { await intervals(page, 10); const d = await intervals(page, 20); const m = median(d); row.states.push({ state: label, medianMs: +m.toFixed(2), worstMs: +Math.max(...d).toFixed(2), ratio: +(m / P).toFixed(2), pass: m <= 1.25 * P }); };
    for (const [i, j] of [[0, 1], [1, 2], [2, 3]]) {
      await rest(page, i);
      await time(`land ${i + 1} at rest`);
      await hold(page, i, j, 0.5);
      await time(`travel ${i + 1} to ${j + 1} at half`);
    }
    // for scale, two states of the entry the world also draws every frame: back to the top (the hall again), the garden
    // decoded again during the walk, then the clock held at the second ring pass and at the morph's half
    await page.evaluate(() => window.__skreedTop());
    await page.evaluate(() => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + 9.5 * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(9.5); });
    await page.waitForFunction(() => { const s = window.__s4.state(); return s.state === 'hall' && s.worldReady && s.world?.garden === 4; }, null, { timeout: 600_000, polling: 500 });
    const tl = await page.evaluate(() => window.__s4.state().world);
    for (const [label, t] of [['the glide at the second ring pass (for scale)', tl.passes[1]], ['the morph at half (for scale)', tl.arrive - 1.2 - 0.9]]) {
      await page.evaluate((x) => window.__s4.seek(x), t);
      await page.waitForTimeout(300);
      await time(label);
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    report.cost.push(row);
    console.log(JSON.stringify(row));
    await finish(page, name);
    await ctx.close();
  }
}

// ---- AC5's flash sweep
// WCAG 2.3.1's general flash and red flash thresholds as the Harding method reads them: a pixel's transition is a swing
// in relative luminance of 0.1 or more from its last extreme, the darker side below 0.8 (red: a swing of 20 in
// (R - G - B) x 320 where R / (R + G + B) is 0.8 or more); a region transitions when the pixels that swing one way
// together (within 3 frames, 50 ms) outnumber those that swing the other way by 25 percent or more of its 341 x 256 CSS
// px; a flash is a pair of opposing transitions, so a region fails with more than six transitions (three flashes) in any
// one second. A moving edge brightens some pixels as it darkens their neighbours, so motion alone does not add up to a
// region's transition, while a cut, a strobe or a band of light sweeping over the region does. Each row also gives the
// per-pixel count over time (any pixel that swings seven times in a second, flagged for good), far stricter than the
// concurrent area and printed for reference only.
if (want('--flash')) {
  const REGION = { w: 341, h: 256 }, STEP = 16, FPS = 60, WIN = 3;
  for (const [name, vp] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }]]) {
    const { ctx, page } = await open(`${name} flash`, vp);
    const { width: W, height: H } = vp.viewport, N = W * H, rw = Math.min(REGION.w, W), rh = Math.min(REGION.h, H);
    const regions = [];
    for (let y = 0; y + rh <= H; y += STEP) for (let x = 0; x + rw <= W; x += STEP) regions.push([x, y]);
    const integral = (mask) => {
      const I = new Float64Array((W + 1) * (H + 1));
      for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += mask[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
      return I;
    };
    const area = (I, x, y) => I[(y + rh) * (W + 1) + x + rw] - I[y * (W + 1) + x + rw] - I[(y + rh) * (W + 1) + x] + I[y * (W + 1) + x];
    for (const [i, j] of [[0, 1], [1, 2], [2, 3]]) {
      await rest(page, i);
      const s = await hold(page, i, j, 0);
      const ms = s.travel?.ms ?? 2600, frames = Math.round((ms / 1000) * FPS);
      // per pixel: each kind's state machine (its last extreme and the way it last swung), the frame's events, and the
      // per-pixel reference count (the last four swings' frames)
      const mk = () => ({ ref: new Float32Array(N), dir: new Int8Array(N), up: new Uint8Array(N), down: new Uint8Array(N), last: new Int32Array(N * 7).fill(-1e6), flagged: new Uint8Array(N), hist: [], reg: regions.map(() => ({ dir: 0, turns: [] })), worstShare: 0, worstTurns: 0 });
      const kinds = { general: mk(), red: mk() };
      const swing = (st, k, idx, v, thr, darkCap) => {
        const r = st.ref[idx], d = st.dir[idx], ok = darkCap === null || Math.min(r, v) < darkCap;
        st.up[idx] = 0; st.down[idx] = 0;
        const turn = () => { const b = idx * 7; st.last.copyWithin(b, b + 1, b + 7); st.last[b + 6] = k; if (k - st.last[b] < FPS) st.flagged[idx] = 1; };
        if (ok && v - r >= thr) {
          if (d !== 1) turn();
          st.dir[idx] = 1; st.ref[idx] = v; st.up[idx] = 1;
        } else if (ok && r - v >= thr) {
          if (d !== -1) turn();
          st.dir[idx] = -1; st.ref[idx] = v; st.down[idx] = 1;
        } else if ((d === 1 && v > r) || (d === -1 && v < r)) st.ref[idx] = v;   // the peak or the trough so far of this swing
      };
      const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      const LUT = Float64Array.from({ length: 256 }, (_, c) => lin(c / 255));
      for (let k = 0; k <= frames; k++) {
        await hold(page, i, j, k / frames);
        const png = await page.screenshot({ scale: 'css' });
        const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        if (info.width !== W || info.height !== H) throw new Error(`screenshot ${info.width} x ${info.height}, not ${W} x ${H}`);
        for (let idx = 0; idx < N; idx++) {
          const r8 = data[idx * 3], g8 = data[idx * 3 + 1], b8 = data[idx * 3 + 2], R = r8 / 255, G = g8 / 255, B = b8 / 255;
          const L = 0.2126 * LUT[r8] + 0.7152 * LUT[g8] + 0.0722 * LUT[b8];
          const sat = R + G + B > 0 && R / (R + G + B) >= 0.8 ? Math.max(0, (R - G - B) * 320) : 0;
          if (k === 0) { kinds.general.ref[idx] = L; kinds.red.ref[idx] = sat; continue; }
          swing(kinds.general, k, idx, L, 0.1, 0.8); swing(kinds.red, k, idx, sat, 20, null);
        }
        if (k === 0) continue;
        for (const st of Object.values(kinds)) {
          st.hist.push([integral(st.up), integral(st.down)]);
          if (st.hist.length > WIN) st.hist.shift();
          regions.forEach(([x, y], n) => {
            const u = st.hist.reduce((a, h) => a + area(h[0], x, y), 0) / (rw * rh), d = st.hist.reduce((a, h) => a + area(h[1], x, y), 0) / (rw * rh);
            st.worstShare = Math.max(st.worstShare, Math.abs(u - d));
            const way = u - d >= 0.25 ? 1 : d - u >= 0.25 ? -1 : 0, R = st.reg[n];
            if (way && way !== R.dir) {
              R.turns.push(k); while (R.turns.length && k - R.turns[0] >= FPS) R.turns.shift(); st.worstTurns = Math.max(st.worstTurns, R.turns.length);
              R.dir = way;
            }
          });
        }
      }
      const perPixel = (st) => { const I = integral(st.flagged); return regions.reduce((m, [x, y]) => Math.max(m, area(I, x, y) / (rw * rh)), 0); };
      const g = kinds.general, r = kinds.red;
      const row = {
        setup: `${W} x ${H}`, travel: `${i + 1} to ${j + 1}`, ms, frames: frames + 1,
        general: { worstNetConcurrentShare: +g.worstShare.toFixed(3), worstTransitionsInASecond: g.worstTurns, flashes: Math.floor(g.worstTurns / 2) },
        red: { worstNetConcurrentShare: +r.worstShare.toFixed(3), worstTransitionsInASecond: r.worstTurns, flashes: Math.floor(r.worstTurns / 2) },
        pass: g.worstTurns <= 6 && r.worstTurns <= 6,
        perPixelReference: { general: +perPixel(g).toFixed(3), red: +perPixel(r).toFixed(3) },
      };
      report.flash.push(row);
      console.log(JSON.stringify(row));
    }
    await finish(page, `${name} flash`);
    await ctx.close();
  }
}

// ---- a refused park: the cross-fade, the visible line on a Tune build, no error
if (want('--fail')) {
  report.fail = [];
  for (const [what, pattern] of [['the model', '**/park.*.glb'], ['the lightmap', '**/park-lightmap.*']]) {
    const before = report.problems.length;
    const { ctx, page } = await open(`refused ${what}`, SETUPS.laptop, pattern);
    await page.waitForTimeout(3000);
    await rest(page, 0);
    await page.waitForFunction(() => !document.querySelector('.rm-land[data-i="0"] .rm-land-more')?.hidden, null, { timeout: 30_000 }).catch(() => {});
    const line = await page.evaluate(() => document.querySelector('.rm-land[data-i="0"] .rm-land-more')?.textContent ?? '');
    const s = await hold(page, 0, 1, 0.5, false);
    const row = { refused: what, travel: s.travel?.option, ms: s.travel?.ms, line, pass: s.travel?.option === 'fade' && s.travel?.ms === 300 && /park blocked/i.test(line) };
    // the warning the module gives is expected here; anything else is a problem
    const extra = report.problems.splice(before).filter((p) => !/option B's park did not load|Failed to load resource|net::ERR_FAILED/.test(p));
    report.problems.push(...extra);
    report.fail.push(row);
    console.log(JSON.stringify(row));
    await ctx.close();
  }
}

await browser.close();
writeFileSync(join(out, 'review.json'), JSON.stringify(report, null, 1) + '\n');
console.log(report.problems.length ? `problems:\n${report.problems.join('\n')}` : 'no problems: no page errors, no console errors, no CSP violations, every held travel played as B');
