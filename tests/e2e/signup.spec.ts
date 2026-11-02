// Section 5, the sign-up (docs/specs/section-5-liquid.md 8): AC2 the jar's placement (its projected box inside its slot
// at 0.9 of the slot's height, at rest and after a scroll), AC3 nothing moving at rest (two stills 1.5 s apart
// byte-equal, the level, the ripple and the stream unchanged), AC4 the pour's schedule (the Instagram press on the empty
// jar held by the stream's clock at 0.15 s, its lead, a quarter, a half, past its landing and its total, with its
// quarter switch and its two colours; data-pouring and the poured event), AC5 a second press on the same word pours
// nothing, AC6 the extension (YouTube pressed while Facebook's stream emits: one stream, the switch at the old
// emission's end, the level continuous) and the queue (pressed after the emission has ended: its own stream after the
// first's total), AC7 the reload within the visit, a new session and a throwing sessionStorage, AC8 the bands' order
// in the jar's description and the hooks, AC9 the poster tier (the still of the state swapped on a press, one request
// each, a saved follow's still first) and the still3d tier (everything set at once); and, as built, the
// follow words (https links to a new tab with noopener), the live region and the form's states against a stub. The 3D
// path runs on SwiftShader here (?tier=hero3d), the glue off (?glue=0) and section 4 open (?room=open), as room.spec
// does; the exit seam and the wrap onto section 5 are room.spec's cases. The test build (PUBLIC_HERO_HOOKS 1) renders
// the form (PUBLIC_LEADS unset is on there).
import { test, expect, type Page } from '@playwright/test';

type Box = { x: number; y: number; w: number; h: number };
type Pour = { id: string; ids: string[]; t: number; phase: string; lead: number; pour: number; emit: number; landEnd: number; total: number; switches: number[]; colours: string[] };
type S5 = { ready: boolean; failed: boolean; order: string[]; level: number; target: number; pour: Pour | null; queue: string[]; layers: { id: string; from: number; to: number; hexes: string[] }[]; surface: { ripple: number; dimple: number; span: { top: number; head: number } | null }; tops: number[]; colours: string[]; slot: Box | null; placed: { px: number; box: Box; tilt: number } | null };
type Poured = { id: string; level: number };
const s5 = (page: Page): Promise<S5 | null> => page.evaluate(() => (window.__s5?.state() ?? null) as S5 | null);
const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string }[] }).__skreedEvents ?? []).map((e) => e.name));
const poured = (page: Page): Promise<Poured[]> => page.evaluate(() => (window as unknown as { __poured?: Poured[] }).__poured ?? []);
const said = (page: Page, sel: string) => page.locator(`${sel} .sr-only`).first().textContent({ timeout: 5_000 }).catch(() => '');
/** the stream held at t seconds of its clock (two frames drawn), or let run from where it stands (null) */
const scrub = async (page: Page, t: number | null) => { await page.evaluate((t) => window.__s5?.scrub(t), t); await page.waitForTimeout(160); };
/** a still's bytes folded to a hash (FNV-1a over the pixels), taken in the page */
const stillHash = (page: Page, order: string[]) => page.evaluate(async (order) => {
  const s = await window.__s5!.still(order);
  if (!s) return null;
  let h = 2166136261;
  for (let i = 0; i < s.data.length; i++) { h ^= s.data[i]; h = Math.imul(h, 16777619) >>> 0; }
  return `${s.width}x${s.height}:${h}`;
}, order);

async function open3d(page: Page, baseURL: string | undefined, extra = ''): Promise<void> {
  await page.addInitScript(() => { const w = window as unknown as { __poured: Poured[] }; w.__poured = []; addEventListener('skreed:signup-poured', (e) => { w.__poured.push((e as CustomEvent<Poured>).detail); }); });
  await page.goto(new URL('/?tier=hero3d&glue=0&room=open' + extra, baseURL).href);
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 500 });
}
/** section 5's top at the viewport's top, the followers snapped, its chunk in */
async function atSignup(page: Page): Promise<void> {
  await page.evaluate(() => { const el = document.getElementById('signup')!, y = el.getBoundingClientRect().top + scrollY; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); });
  await page.evaluate(() => window.__s5?.load());
  await page.waitForFunction(() => !!window.__s5?.ready || !!(window.__s5?.state() as { failed?: boolean } | null)?.failed, null, { timeout: 180_000, polling: 500 });
  await page.waitForTimeout(600);
}
/** a press on a follow word that stays on the page (the link's new tab is not followed here) */
async function press(page: Page, id: string): Promise<void> {
  await page.evaluate((id) => { const a = document.querySelector<HTMLAnchorElement>(`a.su-follow[data-id="${id}"]`)!; a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); }, id);
}
/** the running stream let run until it has settled and the queue is empty */
async function settled(page: Page, timeout = 12_000): Promise<void> {
  await scrub(page, null);
  await page.waitForFunction(() => { const s = window.__s5?.state() as S5 | null; return !!s && s.pour === null && s.queue.length === 0; }, null, { timeout, polling: 100 });
  await page.waitForTimeout(150);
}
const inside = (b: Box, s: Box) => b.x >= s.x - 1 && b.y >= s.y - 1 && b.x + b.w <= s.x + s.w + 1 && b.y + b.h <= s.y + s.h + 1;

test('section 5 at 390 x 844: the follow words, the placement, nothing at rest, the pour by its clock, the second press, the extension, the bands, the visit\'s memory (AC2 to AC8)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await open3d(page, baseURL);
  await atSignup(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // the three follow words: https links to a new tab with noopener, named for assistive technology with the new tab
  const links = page.locator('a.su-follow');
  await expect(links).toHaveCount(3);
  for (const [id, href, name] of [['facebook', 'https://facebook.com/skreedofficial', 'Follow on Facebook. Opens in a new tab.'], ['youtube', 'https://www.youtube.com/@skreedofficial', 'Subscribe on YouTube. Opens in a new tab.'], ['instagram', 'https://www.instagram.com/skreedofficial/', 'Follow on Instagram. Opens in a new tab.']]) {
    const a = page.locator(`a.su-follow[data-id="${id}"]`);
    await expect(a).toHaveAttribute('href', href);
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', 'noopener');
    await expect(a).toHaveAttribute('aria-label', name);
    const box = await a.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  // AC2: the one slot 218 x 273, the jar's projected box inside it at 0.9 of its height, at rest and after a scroll of 120 px
  const s0 = (await s5(page))!;
  expect(s0.ready).toBe(true);
  expect(s0.slot && Math.round(s0.slot.w)).toBe(218); expect(s0.slot && Math.round(s0.slot.h)).toBe(273);
  expect(s0.placed!.tilt).toBe(10);
  expect(inside(s0.placed!.box, s0.slot!)).toBe(true);
  expect(Math.abs(s0.placed!.box.h - 0.9 * s0.slot!.h)).toBeLessThan(3);
  await page.evaluate(() => { scrollTo({ top: scrollY + 120, behavior: 'instant' }); window.__skreedSnap?.(scrollY / innerHeight); });
  await page.waitForTimeout(400);
  const s1 = (await s5(page))!;
  expect(inside(s1.placed!.box, s1.slot!)).toBe(true);
  expect(Math.abs(s1.placed!.box.h - 0.9 * s1.slot!.h)).toBeLessThan(3);
  expect(s1.slot!.y - s0.slot!.y).toBeCloseTo(-120, 0);
  await page.evaluate(() => { scrollTo({ top: scrollY - 120, behavior: 'instant' }); window.__skreedSnap?.(scrollY / innerHeight); });
  await page.waitForTimeout(400);
  await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('aria-label', 'An empty glass jar.');
  // AC3: nothing moves at rest: two stills 1.5 s apart byte-equal, the level, the ripple and the stream unchanged
  expect(s0.level).toBe(0); expect(s0.pour).toBeNull(); expect(s0.queue).toEqual([]);
  expect(s0.surface.ripple).toBe(0); expect(s0.surface.dimple).toBe(0); expect(s0.surface.span).toBeNull();
  const h1 = await stillHash(page, ['instagram']);
  await page.waitForTimeout(1500);
  const h2 = await stillHash(page, ['instagram']);
  expect(h1).not.toBeNull(); expect(h2).toBe(h1);
  expect((await s5(page))!.level).toBe(0); expect((await s5(page))!.pour).toBeNull(); expect((await s5(page))!.surface.ripple).toBe(0);
  // AC4: the Instagram press: the stream within 100 ms, its schedule with the quarter switch, the head at 0.15 s, the level by its clock, the ripple while it lands, settled past its total
  await press(page, 'instagram');
  await page.waitForTimeout(100);
  const p0 = (await s5(page))!;
  expect(p0.pour?.id).toBe('instagram');
  await expect(page.locator('#signup')).toHaveAttribute('data-pouring', 'instagram');
  expect(Math.abs(p0.pour!.lead - 0.5127)).toBeLessThan(0.005);
  expect(p0.pour!.pour).toBeCloseTo(1.8, 6);
  expect(Math.abs(p0.pour!.emit - 1.9067)).toBeLessThan(0.005);
  expect(Math.abs(p0.pour!.total - 2.9127)).toBeLessThan(0.005);
  expect(p0.pour!.switches.length).toBe(1); expect(Math.abs(p0.pour!.switches[0] - 0.9507)).toBeLessThan(0.005);
  expect(p0.pour!.colours).toEqual(['#8554d1', '#fe0094']);
  await scrub(page, 0.15);
  const ph = (await s5(page))!;
  expect(ph.pour!.phase).toBe('lead'); expect(ph.level).toBe(0);
  expect(ph.surface.span!.top).toBeCloseTo(0.62, 6); expect(Math.abs(ph.surface.span!.head - 0.4775)).toBeLessThan(0.005);
  await scrub(page, 0.2);
  const pa = (await s5(page))!;
  expect(pa.pour!.phase).toBe('lead'); expect(pa.level).toBe(0); expect(pa.pour!.t).toBe(0.2); expect(pa.surface.ripple).toBe(0);
  await scrub(page, p0.pour!.lead + 0.9);
  const pq = (await s5(page))!;
  expect(Math.abs(pq.level - 0.25)).toBeLessThan(0.02);
  expect(pq.surface.ripple).toBeGreaterThan(0.9); expect(pq.surface.dimple).toBeGreaterThan(0.9);
  expect(pq.pour!.phase).toBe('pour'); expect(pq.surface.span).not.toBeNull(); expect(pq.surface.span!.top).toBeCloseTo(0.62, 6);
  await scrub(page, p0.pour!.lead + 1.8);
  expect((await s5(page))!.level).toBe(0.5);
  await scrub(page, p0.pour!.landEnd + 0.05);
  const pl = (await s5(page))!;
  expect(pl.surface.span).toBeNull(); expect(pl.pour!.phase).toBe('tail');
  await scrub(page, p0.pour!.total + 0.05);
  const pe = (await s5(page))!;
  expect(pe.level).toBe(0.5); expect(pe.pour).toBeNull(); expect(pe.surface.ripple).toBe(0); expect(pe.surface.dimple).toBe(0); expect(pe.surface.span).toBeNull();
  await scrub(page, null);
  await page.waitForTimeout(400);
  await expect(page.locator('#signup')).not.toHaveAttribute('data-pouring');
  expect(await poured(page)).toEqual([{ id: 'instagram', level: 0.5 }]);
  // the state lines and the live region as built; the jar's description reads the bands
  await expect(page.locator('li.su-follow-row[data-id="instagram"]')).toHaveAttribute('data-collected', '1');
  await expect(page.locator('.su-jar')).toHaveAttribute('data-n', '1');
  await expect(page.locator('.su-jar')).toHaveAttribute('data-level', '0.500');
  await expect(page.locator('#suLive')).toHaveText('Instagram collected. Your jar: 1 of 3.');
  await expect.poll(() => said(page, 'li.su-follow-row[data-id="instagram"] .su-state'), { timeout: 5_000 }).toBe('Collected');
  await expect.poll(() => said(page, '.su-count'), { timeout: 5_000 }).toBe('1 of 3 collected');
  await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('aria-label', 'A glass jar half full of colour, from the bottom: Vivid Violet and Playful Pink.');
  expect(await events(page)).toContain('follow_click');
  // AC5: a second press on the same word opens the page and pours nothing
  await press(page, 'instagram');
  await page.waitForTimeout(600);
  expect((await s5(page))!.level).toBe(0.5); expect((await s5(page))!.pour).toBeNull();
  expect((await s5(page))!.order).toEqual(['instagram']);
  await expect(page.locator('a.su-follow[data-id="instagram"]')).toHaveAttribute('href', 'https://www.instagram.com/skreedofficial/');
  await expect(page.locator('#suLive')).toHaveText('Instagram collected. Your jar: 1 of 3.');
  expect((await poured(page)).length).toBe(1);
  // AC6: the extension: Facebook pressed on the half-full jar, YouTube pressed while its stream emits (at 0.3 s of its clock, inside Facebook's 0.4060 s lead)
  await press(page, 'facebook');
  await page.waitForTimeout(60);
  await scrub(page, 0.3);
  const f0 = (await s5(page))!;
  expect(f0.pour!.ids).toEqual(['facebook']);
  expect(f0.pour!.t).toBe(0.3); expect(0.3).toBeLessThan(f0.pour!.emit);
  await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('aria-label', 'A glass jar three quarters full of colour, from the bottom: Vivid Violet and Playful Pink, then Blissful Blue.');
  await press(page, 'youtube');
  await page.waitForTimeout(160);
  const f1 = (await s5(page))!;
  expect(f1.pour!.ids).toEqual(['facebook', 'youtube']);
  expect(f1.pour!.switches.length).toBe(1); expect(Math.abs(f1.pour!.switches[0] - f0.pour!.emit)).toBeLessThan(1e-6); expect(Math.abs(f1.pour!.switches[0] - 0.9633)).toBeLessThan(0.005);
  expect(f1.pour!.colours).toEqual(['#007dd3', '#ef1123']);
  expect(f1.queue).toEqual([]);
  expect(Math.abs(f1.level - f0.level)).toBeLessThan(0.005);
  // the level is rebased at the press, or at the lead when the press comes before the head lands (0.3 s is inside Facebook's 0.4060 s lead here)
  expect(f1.pour!.lead).toBeCloseTo(Math.max(0.3, f0.pour!.lead), 6); expect(Math.abs(f1.pour!.lead - 0.406)).toBeLessThan(0.005);
  expect(Math.abs(f1.pour!.total - (f1.pour!.lead + (1 - 0.5) * 3.6 + 0.6))).toBeLessThan(1e-6);
  expect(Math.abs(f1.pour!.total - 2.806)).toBeLessThan(0.005);
  await settled(page);
  const f2 = (await s5(page))!;
  expect(f2.level).toBe(1); expect(f2.pour).toBeNull();
  expect(f2.layers).toEqual([{ id: 'instagram', from: 0, to: 0.5, hexes: ['#8554d1', '#fe0094'] }, { id: 'facebook', from: 0.5, to: 0.75, hexes: ['#007dd3'] }, { id: 'youtube', from: 0.75, to: 1, hexes: ['#ef1123'] }]);
  expect(f2.tops).toEqual([0.25, 0.5, 0.75, 1]); expect(f2.colours).toEqual(['#8554d1', '#fe0094', '#007dd3', '#ef1123']);
  expect(f2.surface.ripple).toBe(0); expect(f2.surface.dimple).toBe(0); expect(f2.surface.span).toBeNull();
  expect(await events(page)).toContain('jar_full');
  expect(await poured(page)).toEqual([{ id: 'instagram', level: 0.5 }, { id: 'youtube', level: 1 }]);
  await expect(page.locator('#suLive')).toHaveText('YouTube collected. Your jar is full.');
  await expect.poll(() => said(page, '.su-count'), { timeout: 5_000 }).toBe('Full');
  await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('aria-label', 'A glass jar full of colour, from the bottom: Vivid Violet and Playful Pink, then Blissful Blue, then Roaring Red.');
  expect((await s5(page))!.order).toEqual(['instagram', 'facebook', 'youtube']);
  // AC7: remembered for the visit: the follows stand after a reload, in order, with no stream and no poured event
  await page.reload();
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 500 });
  await atSignup(page);
  await expect(page.locator('.su-jar')).toHaveAttribute('data-n', '3');
  const r = (await s5(page))!;
  expect(r.order).toEqual(['instagram', 'facebook', 'youtube']);
  expect(r.level).toBe(1); expect(r.pour).toBeNull();
  expect(await poured(page)).toEqual([]);
  expect(errors).toEqual([]);
  await ctx.close();
  // gone in a new session
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p2 = await fresh.newPage();
  await p2.goto(new URL('/?tier=poster&room=open', baseURL).href);
  await expect(p2.locator('.su-jar')).toHaveAttribute('data-n', '0');
  await fresh.close();
});

test('section 5 at 390 x 844: the queue (YouTube pressed after Facebook\'s emission has ended), and the follows with sessionStorage throwing (AC6, AC7)', async ({ browser, baseURL }) => {
  test.setTimeout(600_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await open3d(page, baseURL);
  await atSignup(page);
  await press(page, 'instagram');
  await settled(page);
  expect((await s5(page))!.level).toBe(0.5);
  await press(page, 'facebook');
  await page.waitForTimeout(60);
  await scrub(page, 1.0);
  const f = (await s5(page))!;
  expect(f.pour!.ids).toEqual(['facebook']);
  expect(1.0).toBeGreaterThan(f.pour!.emit);
  await press(page, 'youtube');
  await page.waitForTimeout(160);
  const q = (await s5(page))!;
  expect(q.pour!.ids).toEqual(['facebook']); expect(q.queue).toEqual(['youtube']);
  await scrub(page, null);
  // the second stream begins at the first's total with its own lead, from three quarters
  await page.waitForFunction(() => (window.__s5?.state() as S5 | null)?.pour?.id === 'youtube', null, { timeout: 8_000, polling: 50 });
  const y = (await s5(page))!;
  expect(y.queue).toEqual([]); expect(y.pour!.switches).toEqual([]); expect(y.pour!.colours).toEqual(['#ef1123']);
  expect(Math.abs(y.pour!.lead - 0.3427)).toBeLessThan(0.005);
  await expect(page.locator('#signup')).toHaveAttribute('data-pouring', 'youtube');
  await page.waitForFunction(() => { const s = window.__s5?.state() as S5 | null; return !!s && s.level === 1 && s.pour === null; }, null, { timeout: 8_000, polling: 100 });
  expect(await poured(page)).toEqual([{ id: 'instagram', level: 0.5 }, { id: 'facebook', level: 0.75 }, { id: 'youtube', level: 1 }]);
  await ctx.close();
  // with sessionStorage throwing the follows hold for the page's life and a reload starts empty
  const noStore = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p3 = await noStore.newPage();
  await p3.addInitScript(() => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('no storage'); } }); });
  await p3.goto(new URL('/?tier=poster&room=open', baseURL).href);
  await p3.locator('#signup').scrollIntoViewIfNeeded();
  await p3.waitForTimeout(800);
  await press(p3, 'facebook');
  await expect(p3.locator('.su-jar')).toHaveAttribute('data-n', '1');
  await p3.reload();
  await p3.locator('#signup').scrollIntoViewIfNeeded();
  await expect(p3.locator('.su-jar')).toHaveAttribute('data-n', '0');
  await noStore.close();
});

test('section 5 at 390 x 844 on the poster tier: the text on night, the still of the state, the count in words, no island, a saved follow\'s still first, and the form\'s states against a stub (AC9, the form as built)', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const calls: Record<string, string>[] = [], stills: string[] = [];
  let answer: { status: number } = { status: 500 }, offline = false;
  page.on('request', (r) => { if (/\/jar-[0fyi]{1,3}-(1x|2x)\./.test(r.url())) stills.push(r.url()); });
  // the stub answers as the Worker would; while the context is offline it fails the request as the network would (a route
  // fulfils before the offline emulation, so the stub has to refuse on its own)
  // the page opened with the quiz gate's override (?room=open, hooks builds): section 5 is locked with section 4 until the quiz
  await page.route('**/api/signup', async (route) => { if (offline) { await route.abort('internetdisconnected'); return; } calls.push(JSON.parse(route.request().postData() ?? '{}')); await route.fulfill({ status: answer.status, contentType: 'application/json', body: '{}' }); });
  await page.goto(new URL('/?tier=poster&room=open', baseURL).href);
  const root = page.locator('#signup');
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => !!window.__s5?.state?.())).toBe(false);
  await expect(root).toHaveCSS('background-color', 'rgb(5, 5, 6)');
  await expect(page.locator('#signup .su-jar')).toHaveCount(1);
  await expect(page.locator('#signup li.su-follow-row')).toHaveCount(3);
  await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('role', 'img');
  await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('aria-label', 'An empty glass jar.');
  // the still comes in on this tier (the build carries them: absent files render no picture, and the words stand)
  const pics = await page.locator('#signup picture.su-still').count();
  if (pics) {
    await expect(page.locator('#signup picture.su-still')).toHaveCount(1);
    await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('data-still', '0');
    await expect(page.locator('#signup picture.su-still img')).toHaveJSProperty('complete', true);
    await expect(page.locator('#signup picture.su-still img')).toHaveAttribute('alt', '');
    expect(await page.locator('#signup picture.su-still[data-lazy]').count()).toBe(0);
    expect(stills.length).toBe(1); expect(stills[0]).toMatch(/jar-0-(1x|2x)\./);
  }
  // a press counts in words and swaps the still of the state, one request
  await page.evaluate(() => { const a = document.querySelector<HTMLAnchorElement>('a.su-follow[data-id="facebook"]')!; a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
  await expect(page.locator('.su-jar')).toHaveAttribute('data-n', '1');
  await expect.poll(() => said(page, '.su-count'), { timeout: 5_000 }).toBe('1 of 3 collected');
  await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('aria-label', 'A glass jar a quarter full of colour, from the bottom: Blissful Blue.');
  await expect(root).not.toHaveAttribute('data-pouring');
  if (pics) {
    await expect(page.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('data-still', 'f');
    await expect.poll(() => page.locator('#signup picture.su-still img').evaluate((img: HTMLImageElement) => (img.complete ? img.currentSrc : '')), { timeout: 10_000 }).toMatch(/jar-f-(1x|2x)\./);
    expect(stills.filter((u) => /jar-f-/.test(u)).length).toBe(1);
    expect(stills.length).toBe(2);
  }
  // the form: validation on blur and submit, never per keystroke
  const email = page.locator('#suEmail'), consent = page.locator('#suConsent'), send = page.locator('#suSend');
  await email.fill('not-an-address');
  await expect(page.locator('#suErrEmail')).toHaveText('');
  await email.blur();
  await expect(page.locator('#suErrEmail .sr-only')).toHaveText('That doesn’t look like an email address.');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await email.fill('sam@example.com'); await email.blur();
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  await send.click();
  await expect(page.locator('#suErrConsent .sr-only')).toHaveText('Tick the box so we can email you.');
  expect(calls.length).toBe(0);
  await consent.check();
  // a 5xx: the address kept, the error line, the send word back
  await send.click();
  await expect(page.locator('#suMsg .sr-only')).toHaveText('That didn’t go through. Try again.', { timeout: 10_000 });
  await expect(email).toHaveValue('sam@example.com');
  expect(calls.length).toBe(1);
  expect(calls[0]).toEqual({ email: 'sam@example.com', consent: 'yes', follows: 'facebook', source: 'signup' });
  await expect(send.locator('.sr-only')).toHaveText('Save my colours');
  // a 422: the field marked
  answer = { status: 422 };
  await send.click();
  await expect(email).toHaveAttribute('aria-invalid', 'true', { timeout: 10_000 });
  await expect(page.locator('#suErrEmail .sr-only')).toHaveText('That doesn’t look like an email address.');
  // a 409 reads as success; "Not you?" puts the fields back
  answer = { status: 409 };
  await send.click();
  await expect(page.locator('#suDone')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#suDone .su-done-text .sr-only')).toHaveText('Done. Your colours are saved to sam@example.com.');
  await expect(page.locator('#suDone .su-done-text')).toBeFocused();
  await page.locator('.su-notyou').click();
  await expect(page.locator('#suDone')).toBeHidden();
  await expect(email).toHaveValue('');
  await expect(email).toBeFocused();
  // offline: queued, the line says so, sent on `online`
  await email.fill('sam@example.com'); await consent.check();
  offline = true; await page.context().setOffline(true);
  await send.click();
  await expect(page.locator('#suDone .su-done-text .sr-only')).toHaveText('You’re offline. We’ll send it when you’re back.', { timeout: 10_000 });
  expect(await events(page)).toContain('signup_offline');
  answer = { status: 200 };
  const before = calls.length;
  offline = false; await page.context().setOffline(false);
  await page.evaluate(() => dispatchEvent(new Event('online')));
  await expect.poll(() => calls.length, { timeout: 10_000 }).toBeGreaterThan(before);
  await expect(page.locator('#suDone .su-done-text .sr-only')).toHaveText('Done. Your colours are saved to sam@example.com.', { timeout: 10_000 });
  expect(await events(page)).toContain('signup_success');
  // the request carries no cookie
  expect(await page.evaluate(() => document.cookie)).toBe('');
  await ctx.close();
  // a mount with saved follows requests the right state's still first, never the empty jar's
  if (pics) {
    const saved = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const p2 = await saved.newPage();
    const got: string[] = [];
    p2.on('request', (r) => { if (/\/jar-[0fyi]{1,3}-(1x|2x)\./.test(r.url())) got.push(r.url()); });
    await p2.addInitScript(() => { try { sessionStorage.setItem('skreed:signup-follows', '["instagram"]'); } catch { /* none */ } });
    await p2.goto(new URL('/?tier=poster&room=open', baseURL).href);
    await p2.locator('#signup').scrollIntoViewIfNeeded();
    await expect(p2.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('data-still', 'i');
    await expect.poll(() => p2.locator('#signup picture.su-still img').evaluate((img: HTMLImageElement) => (img.complete ? img.currentSrc : '')), { timeout: 10_000 }).toMatch(/jar-i-(1x|2x)\./);
    expect(got.length).toBe(1); expect(got[0]).toMatch(/jar-i-/);
    await expect(p2.locator('.su-slot[data-slot="yours"]')).toHaveAttribute('aria-label', 'A glass jar half full of colour, from the bottom: Vivid Violet and Playful Pink.');
    await saved.close();
  }
});

test('section 5 at 390 x 844 under reduced motion (still3d): the jar drawn, the level set at once, no stream, the poured event at once (AC9)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await open3d(page, baseURL, '&tier=still3d');
  await atSignup(page);
  const s = await s5(page);
  if (s && s.ready) {
    let pouring = false;
    await page.exposeFunction('__pouringSeen', () => { pouring = true; });
    await page.evaluate(() => { new MutationObserver(() => { if (document.getElementById('signup')!.hasAttribute('data-pouring')) (window as unknown as { __pouringSeen(): void }).__pouringSeen(); }).observe(document.getElementById('signup')!, { attributes: true, attributeFilter: ['data-pouring'] }); });
    await press(page, 'instagram');
    await page.waitForTimeout(80);
    const after = (await s5(page))!;
    expect(after.level).toBe(0.5); expect(after.pour).toBeNull(); expect(after.queue).toEqual([]);
    expect(after.surface.ripple).toBe(0); expect(after.surface.dimple).toBe(0); expect(after.surface.span).toBeNull();
    expect(after.tops).toEqual([0.25, 0.5, 1, 1]); expect(after.colours).toEqual(['#8554d1', '#fe0094', '#fe0094', '#fe0094']);
    expect(await poured(page)).toEqual([{ id: 'instagram', level: 0.5 }]);
    await page.waitForTimeout(400);
    expect(pouring).toBe(false);
    await expect(page.locator('#signup')).not.toHaveAttribute('data-pouring');
  }
  await ctx.close();
});
