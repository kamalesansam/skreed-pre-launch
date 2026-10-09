// AC6 hover push, labels, ghost sweep, block glows and parallax, on the prototype and the port side by side.
// SwiftShader frames are slow and irregular, so timing-dependent series are compared where they are deterministic:
// the parallax angles once they have settled on each scripted input (the follower converges on theta = 0.07 x pi/2 x x and
// phi = -0.025 x pi/2 x y), step by step through the same script on both pages.
import { test, expect, type Browser, type BrowserContextOptions, type Page } from '@playwright/test';
import { launch } from '../harness/browser.ts';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { BLOCK_SHADES } from '../../src/config/shades.gen.ts';

let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

async function open(url: string, proto: boolean, opts: BrowserContextOptions): Promise<Page> {
  const ctx = await gl.newContext(opts);
  if (proto) await servePrototype(ctx);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 300_000 });
  await page.waitForFunction(() => !document.getElementById('intro') && typeof window.__skreedState === 'function', null, { timeout: 900_000, polling: 500 });
  return page;
}
const port = (base: string, q = 'hero3d') => new URL(`/?tier=${q}`, base).href;
const DESK: BrowserContextOptions = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const PHONE: BrowserContextOptions = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

/** The prototype's hover routine (prototypes/hero-v9/shot.mjs): 40 moves 120 ms apart around 0.55 W and 0.32 H. */
async function hoverRoutine(page: Page, W: number, H: number, onStep?: () => Promise<void>) {
  for (let k = 0; k < 40; k++) {
    await page.mouse.move(W * 0.55 + Math.sin(k / 4) * 60, H * 0.32 + Math.cos(k / 5) * 40);
    await page.waitForTimeout(120);
    if (onStep) await onStep();
  }
}

test('AC6.1 and AC6.2 push, floor clearance and labels on both pages (desktop mouse)', async ({ baseURL }) => {
  test.setTimeout(3_000_000);
  const pages = await Promise.all([open(PROTO_URL, true, DESK), open(port(baseURL!), false, DESK)]);
  // the push and the labels scale with live, which takes 2 s of scene time (24 frames or more at the 1/12 s cap)
  await Promise.all(pages.map((p) => p.waitForFunction(() => window.__skreedState!().live >= 1, null, { timeout: 900_000, polling: 500 })));
  for (const [i, page] of pages.entries()) {
    const who = i ? 'port' : 'prototype';
    let maxLabels = 0; const readouts = new Set<string>();
    const sample = async () => {
      const r = await page.evaluate(() => [...document.querySelectorAll('#labels .lab')].map((l) => (l.lastChild as HTMLElement).textContent || ''));
      maxLabels = Math.max(maxLabels, r.length); r.forEach((x) => readouts.add(x));
    };
    await hoverRoutine(page, 1280, 800, sample);
    // SwiftShader draws a few frames a second here: let the followers run 30 frames with the pointer at its last spot
    const f0 = await page.evaluate(() => window.__skreedFrame ?? 0);
    while ((await page.evaluate(() => window.__skreedFrame ?? 0)) < f0 + 30) { await sample(); await page.waitForTimeout(250); }
    const d = await page.evaluate(() => window.__skreedState!().d);
    expect(d.some((x) => x > 0.1), `${who}: a block pushed past 0.1`).toBe(true);
    const fc = await page.evaluate(() => window.__skreedFloorCheck!());
    expect(Math.max(...fc.map((x) => x.penetration)), `${who}: no block below the floor or the stones`).toBeLessThanOrEqual(0);
    expect(maxLabels, `${who}: labels at most 5`).toBeLessThanOrEqual(5);
    expect(maxLabels, `${who}: labels appear`).toBeGreaterThan(0);
    for (const x of readouts) expect(x, `${who}: two-digit readout`).toMatch(/^\d\d$/);
    // the pointer leaves the document: labels go
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerleave')));
    await page.waitForFunction(() => document.querySelectorAll('#labels .lab').length === 0, null, { timeout: 120_000, polling: 250 });
    // tp above 0: the labels layer hides
    await page.evaluate(() => scrollTo(0, innerHeight * 1.75));
    await page.waitForFunction(() => window.__skreedState!().sb > 1.51, null, { timeout: 600_000, polling: 300 });
    await page.waitForFunction(() => document.getElementById('labels')!.style.visibility === 'hidden', null, { timeout: 120_000 });
    console.log(`[AC6.1 ${who}] pushed ${d.filter((x) => x > 0.1).length}, max penetration ${Math.max(...fc.map((x) => x.penetration))}, labels max ${maxLabels}, readouts ${[...readouts].join(' ')}`);
  }
  for (const p of pages) await p.context().close();
});

test('AC6.4 block glows: each block carries its cool-order shade by id; __skreedSolo isolates and restores', async ({ baseURL }) => {
  test.setTimeout(1_200_000);
  const page = await open(port(baseURL!), false, { viewport: { width: 400, height: 400 } });
  expect(await page.evaluate(() => window.__skreedBlockColours!())).toEqual(BLOCK_SHADES.map((s) => s.hex.toLowerCase()));
  expect(BLOCK_SHADES.map((s) => s.id)).toEqual(['blushing-corals-04', 'stormy-greys-05', 'frosty-whites-07', 'blissful-blues-08', 'earthy-browns-07', 'vivid-violets-07', 'mellow-yellows-01', 'playful-pinks-14', 'go-green-12', 'roaring-reds-07']);
  await page.evaluate(() => window.__skreedSolo!(3));
  const solo = await page.evaluate(() => window.__skreedBlockColours!());
  expect(solo).toEqual(solo.map((_c, i) => (i === 3 ? '#ffffff' : '#000000')));
  await page.evaluate(() => window.__skreedSolo!(-1));
  expect(await page.evaluate(() => window.__skreedBlockColours!())).toEqual(BLOCK_SHADES.map((s) => s.hex.toLowerCase()));
  await page.context().close();
});

/** Waits until theta and phi stop moving across rendered frames (at least 3 new frames between equal samples). */
async function settledAngles(page: Page): Promise<[number, number]> {
  let prev = [NaN, NaN, -1];
  for (let i = 0; i < 8000; i++) {
    const s = await page.evaluate(() => { const x = window.__skreedState!(); return [x.th, x.ph, window.__skreedFrame ?? 0]; });
    if (s[2] >= prev[2] + 3) {
      if (Math.abs(s[0] - prev[0]) < 1e-7 && Math.abs(s[1] - prev[1]) < 1e-7) return [s[0], s[1]];   // residue under 3e-7, far below the 4-decimal comparison
      prev = s;
    }
    await page.waitForTimeout(150);
  }
  throw new Error('angles never settled');
}

// The angles depend only on the pointer in normalised device coordinates and on the pointer type, so the scripts run in a
// small mouse window and a small touch phone: SwiftShader needs about 85 frames per settle (follower 0.035 at ratio 5).
const PDESK: BrowserContextOptions = { viewport: { width: 400, height: 250 }, deviceScaleFactor: 1 };
const PPHONE: BrowserContextOptions = { viewport: { width: 260, height: 563 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

test('AC6.5 parallax: the settled theta and phi series equal the prototype for mouse moves (desktop) and a held touch (phone)', async ({ baseURL }, info) => {
  test.setTimeout(3_000_000);
  const SCRIPT: [number, number][] = [[0.15, 0.2], [0.85, 0.7], [0.5, 0.95], [0.05, 0.05]];
  const rows: string[] = [];
  // desktop: real mouse moves; the camera turns toward the pointer anywhere in the viewport
  {
    const pages = await Promise.all([open(PROTO_URL, true, PDESK), open(port(baseURL!), false, PDESK)]);
    await Promise.all(pages.map((p) => p.waitForFunction(() => window.__skreedState!().live >= 1, null, { timeout: 600_000 })));
    for (const [fx, fy] of SCRIPT) {
      const got = await Promise.all(pages.map(async (p) => { await p.mouse.move(400 * fx, 250 * fy); return settledAngles(p); }));
      rows.push(`mouse ${fx},${fy}: proto ${got[0].map((v) => v.toFixed(4))} port ${got[1].map((v) => v.toFixed(4))}`); console.log('[AC6.5] ' + rows[rows.length - 1]);
      expect(got[1].map((v) => v.toFixed(4))).toEqual(got[0].map((v) => v.toFixed(4)));
    }
    for (const p of pages) await p.context().close();
  }
  // phone: a held touch turns the camera while the finger is down, and it returns when the finger lifts
  {
    const pages = await Promise.all([open(PROTO_URL, true, PPHONE), open(port(baseURL!), false, PPHONE)]);
    await Promise.all(pages.map((p) => p.waitForFunction(() => window.__skreedState!().live >= 1, null, { timeout: 600_000 })));
    for (const [fx, fy] of SCRIPT.slice(0, 2)) {
      const down = await Promise.all(pages.map(async (p) => {
        await p.evaluate(([x, y]) => dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, pointerType: 'touch', isPrimary: true })), [260 * fx, 563 * fy]);
        return settledAngles(p);
      }));
      const up = await Promise.all(pages.map(async (p) => {
        await p.evaluate(() => dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', isPrimary: true })));
        return settledAngles(p);
      }));
      rows.push(`touch ${fx},${fy} held: proto ${down[0].map((v) => v.toFixed(4))} port ${down[1].map((v) => v.toFixed(4))}; lifted: proto ${up[0].map((v) => v.toFixed(4))} port ${up[1].map((v) => v.toFixed(4))}`); console.log('[AC6.5] ' + rows[rows.length - 1]);
      expect(down[1].map((v) => v.toFixed(4))).toEqual(down[0].map((v) => v.toFixed(4)));
      expect(Math.abs(down[1][0])).toBeGreaterThan(0);
      expect(up[1].map((v) => v.toFixed(4))).toEqual(up[0].map((v) => v.toFixed(4)));
      expect(up[1].every((v) => Math.abs(v) < 5e-5), 'the camera returns when the finger lifts').toBe(true);   // -0 and 0 both
    }
    for (const p of pages) await p.context().close();
  }
  console.log('[AC6.5] ' + rows.join(' | '));
  info.annotations.push({ type: 'parallax', description: rows.join(' | ') });
});

test('AC6.3 ghost sweep: on touch it starts when live reaches 1 with no input; never on a mouse device or under reduced motion', async ({ baseURL }) => {
  test.setTimeout(3_000_000);
  // touch, no input since load: the sweep target pulls the follower off its rest sentinel (99) once live is 1
  const phone = await open(port(baseURL!), false, PHONE);
  const before = await phone.evaluate(() => window.__skreedState!());
  if (before.live < 1) expect(before.mx).toBeGreaterThan(98.99);
  await phone.waitForFunction(() => window.__skreedState!().live >= 1, null, { timeout: 600_000 });
  await phone.waitForFunction(() => window.__skreedState!().mx < 90, null, { timeout: 600_000, polling: 300 });
  // after an input the sweep waits 2.5 s: record the follower against time after a short tap
  const trace = await phone.evaluate(async () => {
    dispatchEvent(new PointerEvent('pointerdown', { clientX: 5, clientY: 5, pointerType: 'touch', isPrimary: true }));
    dispatchEvent(new PointerEvent('pointerup', { clientX: 5, clientY: 5, pointerType: 'touch', isPrimary: true }));
    const t0 = performance.now(), out: [number, number][] = [];
    await new Promise<void>((done) => { const f = () => { out.push([performance.now() - t0, window.__skreedState!().mx]); if (performance.now() - t0 < 6000) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
    return out;
  });
  // the ghost target is inside the mark (|x| < 2); while it is off, the follower heads back toward 99
  const firstBack = trace.find(([, mx], i) => i > 0 && mx < trace[i - 1][1] - 1e-6);
  expect(firstBack, 'the sweep resumes').toBeTruthy();
  expect(firstBack![0], 'not before 2.5 s after the input').toBeGreaterThanOrEqual(2400);
  await phone.context().close();
  // a mouse device: no sweep
  const desk = await open(port(baseURL!), false, { viewport: { width: 640, height: 400 } });
  await desk.waitForFunction(() => window.__skreedState!().live >= 1, null, { timeout: 600_000 });
  await desk.waitForTimeout(4000);
  expect(await desk.evaluate(() => window.__skreedState!().mx)).toBeGreaterThan(98.99);
  await desk.context().close();
  // reduced motion (still3d) on touch: no sweep
  const still = await open(port(baseURL!, 'still3d'), false, { ...PHONE, reducedMotion: 'reduce' });
  await still.waitForFunction(() => window.__skreedState!().live >= 1, null, { timeout: 600_000 });
  await still.waitForTimeout(4000);
  expect(await still.evaluate(() => window.__skreedState!().mx)).toBeGreaterThan(98.99);
  await still.context().close();
});
