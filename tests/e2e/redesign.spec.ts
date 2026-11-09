// The redesigned landing page in the browser (docs/specs/redesign.md section 9; Sam, 2026-11-09, with his "Skreed
// Pre-Launch" design: "checkout the pdf, and build the exact same thing, but keep the logo and navbar intact"), as it
// stands after his two reviews of that day (D19, D20): eleven sections, the jars last, no two steps and no white-blazer
// band. The rows it holds, each naming its decision: no sideways scroll at the six widths (criterion 2); nothing against
// the CSP and no console error with the whole page scrolled (criterion 11); the sections in order, one form of the
// page's own and no id said twice (D18, D19, criterion 4); the countdown ticking under the COMING SOON mark with its
// three colons (D13, D19 item 9, D20); the cue's chevrons on their cycle and gone once the page has scrolled (D15, D19
// item 2); DIFFERENT in Rubik Black at rest and torn only inside a burst (D19 item 1, D20); the fans at their end, opaque
// and at equal steps (D19 item 3); the picker answering a hover with nothing pressed (D19 item 5); the five products'
// descriptions on hover, focus and tap (the brief, criterion 6); "Let's find it" played to a result (D11); the section
// index's entries and the gift (D4); the ten swatches and the way back (D10, D19 item 4); the jars at the page's end and on
// /jars/, ticks, tone and form against a mocked endpoint (D1, D18, E-S5-tick); and the page with no script and with the
// motion kit's chunks refused (D16, section 7). The sources' own rows are tests/unit/redesign.test.ts.
//
// A test build (the hooks' flags, which also render the form), served by wrangler dev on a port nobody else has:
//   PUBLIC_HERO_HOOKS=1 PUBLIC_TUNE=0 PUBLIC_STAGING=0 npx astro build --outDir dist-rd && node scripts/csp.mjs --dist dist-rd
//   npx wrangler dev --ip 127.0.0.1 --port <port> --assets dist-rd
//   BASE_URL=http://127.0.0.1:<port>/ SKREED_DIST=dist-rd SKREED_GL=gpu npx playwright test tests/e2e/redesign.spec.ts --project=e2e
// SKREED_GL=gpu runs the installed Chrome on the machine's GPU: under the harness's SwiftShader the page's animation clock
// barely ticks, and the rows that press inside a sliding panel or wait on a Web Animation (the drawer, the veil) crawl.
// The page has no WebGL, so nothing here is a reading of the renderer. Playwright's Chromium has the back-forward cache
// off, so the way back from a family page reloads /#families here; the restore itself is E-way-back's, by hand in Chrome.
import { test, expect, type Browser, type BrowserContext, type BrowserContextOptions, type Locator, type Page } from '@playwright/test';
import { watchCsp, cspViolations } from '../harness/csp.ts';
import { COPY } from '../../src/config/copy.ts';
import { LAUNCH_ISO } from '../../src/config/site.ts';
import { QUIZ_COPY as Q, QUIZ_REVEAL_MS, pickShade, scoreQuiz, shadeHref, type PersonaId } from '../../src/config/quiz.ts';
import { LEAD_CODE_COPY, codeLine, wrongLine } from '../../src/config/lead-code.ts';
import { RD_COPY, RD_GLITCH_WORD, RD_IDS, RD_JARS } from '../../src/config/redesign.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { SIGNUP_COPY, fill } from '../../src/config/signup.ts';

const PHONE: BrowserContextOptions = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const LAPTOP: BrowserContextOptions = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
/** criterion 2's widths; the three phones as phones, where a page that overflows widens the layout viewport itself */
const WIDTHS: (BrowserContextOptions & { viewport: { width: number; height: number } })[] = [
  { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { viewport: { width: 768, height: 1024 } },
  { viewport: { width: 1024, height: 768 } },
  { viewport: { width: 1280, height: 800 } },
];
const SIZES: [string, BrowserContextOptions][] = [['390 x 844', PHONE], ['1280 x 800', LAPTOP]];
const byId = new Map(SHADES.map((s) => [s.id, s]));
const URBAN_SLATE = 'rgb(56, 63, 67)', PEARL_WHISPER = 'rgb(247, 246, 243)';

/** two frames, so what listens to a scroll or a change has read it */
const frames = (page: Page) => page.evaluate(() => new Promise<void>((r) => { requestAnimationFrame(() => requestAnimationFrame(() => r())); }));
/** the motion kit has arrived and every section's setup has run (motion.ts sets the class as it finishes its run), so an entrance from here on is one the page was given */
const live = (page: Page) => page.waitForFunction(() => document.documentElement.classList.contains('rd-live'), null, { timeout: 30_000 });
/** a fresh page at this size, the CSP watched from its first script on (criterion 11: every row closes with done(), so whatever a row presses or plays is held to it too) */
async function open(browser: Browser, baseURL: string | undefined, opts: BrowserContextOptions, path = '/'): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext(opts);
  await watchCsp(ctx);
  const page = await ctx.newPage();
  await page.goto(new URL(path, baseURL).href);
  return { ctx, page };
}
async function done(ctx: BrowserContext, page: Page): Promise<void> {
  expect(await cspViolations(page), 'nothing against the CSP on this page').toEqual([]);
  await ctx.close();
}
/** an instant jump, as a key or the scrollbar makes */
async function go(page: Page, y: number): Promise<void> {
  await page.evaluate((y) => { scrollTo({ top: y, left: 0, behavior: 'instant' }); }, y);
  await frames(page);
}
const topOf = (page: Page, sel: string) => page.evaluate((sel) => document.querySelector(sel)!.getBoundingClientRect().top + scrollY, sel);
const goTo = async (page: Page, sel: string) => go(page, await topOf(page, sel));
/** the whole page from top to bottom, 60% of a screen at a time with a moment at each stop, so every entrance and scrub has run; `at` reads each stop */
async function walk(page: Page, at?: (y: number) => Promise<void>): Promise<void> {
  for (let y = 0; ;) {
    await go(page, y);
    await page.waitForTimeout(140);
    await at?.(y);
    const { max, step } = await page.evaluate(() => ({ max: document.documentElement.scrollHeight - innerHeight, step: Math.round(innerHeight * 0.6) }));
    if (y >= max) break;
    y = Math.min(max, y + step);
  }
}

test.describe('the page as a whole', () => {
  for (const opts of WIDTHS) {
    const { width, height } = opts.viewport;
    test(`criterion 2 at ${width} x ${height}: no sideways scroll at any stop from top to bottom, and no line of the page cut by the screen's edge`, async ({ browser, baseURL }) => {
      const { ctx, page } = await open(browser, baseURL, opts);
      await live(page);
      await walk(page, async (y) => {
        const o = await page.evaluate(() => {
          const before = scrollY;
          scrollBy({ left: 40, top: 0, behavior: 'instant' });
          const moved = scrollX;
          scrollTo({ left: 0, top: before, behavior: 'instant' });
          return { inner: innerWidth, html: document.documentElement.scrollWidth, moved };
        });
        expect(o.inner, `at ${y} px: a phone's layout viewport has not been widened`).toBe(width);
        expect(o.html, `at ${y} px: the document is wider than the screen`).toBeLessThanOrEqual(width);
        expect(o.moved, `at ${y} px: a sideways scroll moved the page`).toBe(0);
      });
      // the body clips sideways (overflow-x: clip), so the document's width alone would hide a line that runs off: read
      // the lines themselves. The phone's fans and the products' row are the two rows that are wider than the screen on
      // purpose, each panned or scrolled inside itself (spec section 5)
      const cut = await page.evaluate(() => {
        const W = document.documentElement.clientWidth, out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('main.rd :is(h1, h2, h3, p, figcaption, label, .su-worth, .l), footer :is(p, a, li, span)')) {
          if (!el.getClientRects().length || el.closest('[hidden], .sr-only, .rd-seen-view, .rd-products-row, noscript')) continue;
          if (getComputedStyle(el).visibility === 'hidden') continue;
          const r = el.getBoundingClientRect();
          if (r.left < -1 || r.right > W + 1) out.push(`${el.tagName}.${el.className}: ${Math.round(r.left)} to ${Math.round(r.right)} of ${W}: ${(el.textContent ?? '').trim().slice(0, 40)}`);
        }
        return out;
      });
      expect(cut).toEqual([]);
      await done(ctx, page);
    });
  }

  for (const [name, opts] of SIZES) {
    test(`criterion 11 at ${name}: the CSP header is on the page and nothing breaks it, no console error, no failed request, with the whole page scrolled and its motion played; every headline stands whole at the end`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext(opts);
      await watchCsp(ctx);
      const page = await ctx.newPage();
      const errors: string[] = [], bad: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
      page.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') bad.push(`failed ${r.url()}`); });   // the page's own change of mind about a picture is no fault
      const res = await page.goto(new URL('/', baseURL).href);
      expect(res!.headers()['content-security-policy'], 'the header is there to be broken').toContain("default-src 'self'");
      await live(page);
      await walk(page);
      await page.waitForTimeout(1500);   // the last entrances land, the jars' section mounts its script and its form
      expect(await cspViolations(page)).toEqual([]);
      expect(errors).toEqual([]);
      expect(bad).toEqual([]);
      // an entrance plays once and leaves nothing hidden (D16): every letter of every split headline, at the end of the walk
      const hidden = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main.rd .rd-h, main.rd .rd-match-h')].flatMap((h) => {
        const c = [...h.querySelectorAll<HTMLElement>('.rd-c, .rd-match-c, .rd-w')], bad = c.filter((e) => { const s = getComputedStyle(e); return parseFloat(s.opacity) < 0.99 || s.visibility !== 'visible'; });
        return bad.length ? [`${h.getAttribute('aria-label')}: ${bad.length} of ${c.length} still hidden`] : [];
      }));
      expect(hidden).toEqual([]);
      await done(ctx, page);
    });
  }

  test('D3 and D19, the page in order: eleven sections against RD_IDS, the jars last with the footer under them, one h1, nothing of what left; the page\'s one sign-up form is #suForm and no id is said twice, at load and with everything mounted', async ({ browser, baseURL }) => {
    const { ctx, page } = await open(browser, baseURL, LAPTOP);
    const shape = () => page.evaluate(() => {
      const all = [...document.querySelectorAll('[id]')].map((e) => e.id);
      return {
        twice: [...new Set(all.filter((id, k) => all.indexOf(id) !== k))], ids: all.length,
        // the quiz's offer is the quiz's (D11, its form behind the same flag, inside the host); every other form is the page's
        forms: [...document.forms].filter((f) => !f.closest('#quizHost')).map((f) => f.id), quiz: [...document.forms].filter((f) => f.closest('#quizHost')).map((f) => f.id),
      };
    });
    const first = await shape();
    expect(first.twice).toEqual([]);
    expect(first.forms).toEqual(['suForm']);
    expect(first.quiz).toEqual(['qzForm']);
    // the sections in the page's order: each RD_ID once, in order, in main.rd; the quiz's own section sits in its host between two of them
    const order = await page.evaluate(() => [...document.querySelectorAll('main.rd section[id]')].map((s) => s.id));
    expect(order.filter((id) => id !== 'find')).toEqual([...RD_IDS]);
    expect(await page.locator('main.rd > .rd-jarsec > section#signup.signup').count(), 'the jars, section 5 as built, in their light part').toBe(1);
    await expect(page.locator('main.rd > .rd-jarsec')).toHaveAttribute('data-tone', 'light');
    // (the scripts the components carry stand between the parts: what closes main is its last part that draws anything)
    expect(await page.evaluate(() => { const m = document.querySelector('main.rd')!, f = document.querySelector('footer.rd-footer')!, parts = [...m.children].filter((e) => !/^(?:SCRIPT|STYLE)$/.test(e.tagName)); return parts.at(-1)?.classList.contains('rd-jarsec') && !!(m.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING); }), 'the jars close main, the footer follows it (D14, D18)').toBe(true);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Things are about to look different');
    // what left: the two steps (D19) and the band (D20), and their words
    for (const gone of ['#steps', '#soon', '#rsForm', '.rd-soon', '.rd-signup']) await expect(page.locator(gone), gone).toHaveCount(0);
    expect(await page.locator('main.rd').textContent()).not.toMatch(/15% off|exclusive discounts|No spam, we promise|A few steps/);
    // with everything mounted: the page scrolled (the sprites, the form's own fields, the section scripts) and the quiz open
    await live(page);
    await walk(page);
    await expect(page.locator('#suName'), 'the form has mounted').toHaveCount(1);
    const walked = await shape();
    expect(walked.twice).toEqual([]);
    expect(walked.forms).toEqual(['suForm']);
    expect(walked.ids, 'the walk added ids (the digits\' sprite, the form\'s fields)').toBeGreaterThan(first.ids);
    await goTo(page, '#quiz');
    await page.locator('#rdQuizCta').click();
    await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz', { timeout: 30_000 });
    const opened = await shape();
    expect(opened.twice).toEqual([]);
    expect(opened.forms).toEqual(['suForm']);
    await done(ctx, page);
  });

  test('D5, the logotype and the index take each ground: Pearl Whisper over the hero, the bands and the open quiz, Urban Slate over the light sections, and the section 5 script\'s own writer stands down over the jars (D18)', async ({ browser, baseURL }) => {
    const { ctx, page } = await open(browser, baseURL, LAPTOP);
    const logo = page.locator('a.site-logo'), nav = page.locator('#siteNav');
    // (the logotype says "light" for Urban Slate; over a dark ground it says "dark", or nothing where no light ground has come yet)
    const TONE: [string, 'dark' | 'light'][] = [['#top', 'dark'], ['#seen', 'light'], ['#families', 'light'], ['#glimpse', 'light'], ['.rd-glimpse-band', 'dark'], ['#products', 'light'], ['#match', 'dark'], ['#everyone', 'light'], ['#quiz', 'light'], ['#proof', 'dark'], ['#launch', 'light'], ['#signup', 'light']];
    for (const [sel, tone] of TONE) {
      // a little inside the part, so its ground is under the whole row
      await go(page, await topOf(page, sel) + 4);
      if (tone === 'light') {
        await expect(logo, sel).toHaveAttribute('data-tone', 'light');
        await expect(nav, `${sel}: the index copies it`).toHaveAttribute('data-tone', 'light');
      } else {
        await expect(logo, sel).not.toHaveAttribute('data-tone', 'light');
        await expect(nav, `${sel}: the index copies it`).not.toHaveAttribute('data-tone', 'light');
      }
      await expect(logo, sel).toHaveCSS('color', tone === 'light' ? URBAN_SLATE : PEARL_WHISPER);
    }
    // down from the countdown onto the jars and back up over the proof, past the point where the section's own script has
    // mounted: its old writer would turn the logotype Pearl Whisper over every light section above it
    await expect(page.locator('#signup')).toHaveAttribute('data-ready', '1', { timeout: 15_000 });
    await go(page, await topOf(page, '#launch') + 4);
    await expect(logo).toHaveAttribute('data-tone', 'light');
    await go(page, await topOf(page, '#proof') + 4);
    await expect(logo).toHaveCSS('color', PEARL_WHISPER);
    await go(page, await topOf(page, '#everyone') + 4);
    await expect(logo).toHaveAttribute('data-tone', 'light');
    await done(ctx, page);
  });
});

test.describe('the hero', () => {
  for (const [name, opts] of SIZES) {
    test(`D15 and D19 item 2 at ${name}: the cue's words and its three chevrons run the old cue's 2.5 s cycle at the top; past 8 px the cue is gone and the chevrons rest; back at the top they go on`, async ({ browser, baseURL }) => {
      const { ctx, page } = await open(browser, baseURL, opts);
      const cue = page.locator('.rd-hero-cue');
      await expect(cue).toBeVisible();
      await expect(cue.locator('.rd-hero-cue-text')).toHaveText(COPY.cue.label);
      await expect(cue).toHaveAttribute('aria-hidden', 'true');
      const chevrons = () => page.evaluate(() => [...document.querySelectorAll('.rd-hero-cue-chev .rd-hero-chev')].map((g) => {
        const a = g.getAnimations().find((x) => x instanceof CSSAnimation) as CSSAnimation | undefined, t = a?.effect?.getComputedTiming();
        return { name: a?.animationName, state: a?.playState, duration: t?.duration, iterations: t?.iterations, time: Number(a?.currentTime ?? 0) };
      }));
      const first = await chevrons();
      expect(first.map((c) => [c.name, c.state, c.duration, c.iterations])).toEqual(['top', 'mid', 'bottom'].map((at) => [`rd-hero-chev-${at}`, 'running', 2500, Infinity]));
      // moving, and not merely playing: the drawing itself changes as the cycle runs
      await expect.poll(async () => (await chevrons())[0].time, { timeout: 5_000, message: 'the cycle advances' }).toBeGreaterThan(first[0].time + 100);
      const looks = new Set<string>();
      await expect.poll(async () => {
        looks.add(await page.evaluate(() => [...document.querySelectorAll('.rd-hero-cue-chev .rd-hero-chev')].map((g) => { const s = getComputedStyle(g); return `${(+s.opacity).toFixed(2)} ${s.transform}`; }).join('|')));
        return looks.size;
      }, { timeout: 8_000, message: 'the chevrons are drawn differently from one moment to the next' }).toBeGreaterThan(2);
      // gone once the page has scrolled (D15), first faded by opacity and then hidden
      await go(page, 30);
      await expect(cue).toHaveClass(/\bis-off\b/);
      await expect(cue).toBeHidden();
      await expect(cue).toHaveCSS('opacity', '0');
      await expect(cue).toHaveClass(/\bis-still\b/);
      expect((await chevrons()).map((c) => c.state)).toEqual(['paused', 'paused', 'paused']);
      // not at 8 px: the edge counts out
      await go(page, 8);
      await expect(cue).toBeVisible();
      await expect(cue).not.toHaveClass(/\bis-off\b/);
      await expect.poll(async () => (await chevrons()).map((c) => c.state)).toEqual(['running', 'running', 'running']);
      await go(page, 9);
      await expect(cue).toHaveClass(/\bis-off\b/);
      await go(page, 0);
      await expect(cue).toBeVisible();
      await expect.poll(async () => (await chevrons()).map((c) => c.state)).toEqual(['running', 'running', 'running']);
      await done(ctx, page);
    });

    test(`D19 item 1 and D20 at ${name}: DIFFERENT is Rubik at weight 900 at rest, the Rubik Glitch drawing shows only inside a burst, never with the plain letters and never leaving neither, and its file is fetched after the first paint`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext(opts);
      await watchCsp(ctx);
      // from before the page's scripts: every frame in which the word's state changed. Sampled once a frame, where the
      // page's observer has already copied the engine's switch onto the word, so a change between the two would show here
      await ctx.addInitScript(() => {
        const log: { t: number; tiles: boolean; glitch: boolean; plain: string; slabs: number }[] = [];
        (window as unknown as { __word: typeof log }).__word = log;
        let last = '';
        const look = () => {
          const word = document.querySelector('.rd-hero-word'), layer = word?.querySelector('.gl-tiles'), ln = word?.querySelector('.rd-ln');
          if (word && layer && ln) {
            const e = { t: performance.now(), tiles: layer.getAttribute('display') !== 'none', glitch: word.classList.contains('is-glitch'), plain: getComputedStyle(ln).visibility, slabs: layer.childElementCount };
            const k = `${e.tiles}${e.glitch}${e.plain}`;
            if (k !== last) { last = k; log.push(e); }
          }
          requestAnimationFrame(look);
        };
        requestAnimationFrame(look);
      });
      const page = await ctx.newPage();
      await page.goto(new URL('/', baseURL).href);
      const word = page.locator('.rd-hero-word');
      const rest = () => page.evaluate(() => {
        const w = document.querySelector('.rd-hero-word')!, c = getComputedStyle(w.querySelector('.rd-c')!), box = w.querySelector('.rd-ln-in')!.getBoundingClientRect();
        return { family: c.fontFamily, weight: c.fontWeight, style: c.fontStyle, spacing: parseFloat(c.letterSpacing), size: parseFloat(c.fontSize), width: box.width, glitch: w.classList.contains('is-glitch') };
      });
      await page.evaluate(() => document.fonts.ready);
      // the faces: Rubik Black loaded and in the first view, and the letters drawn in it
      expect(await page.evaluate(() => [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Rubik').map((f) => `${f.weight} ${f.status}`))).toEqual(['900 loaded']);
      const r = await rest();
      expect(r.family).toMatch(/^"?Rubik"?,/);
      expect(r.family).not.toMatch(/Glitch/);
      expect(r.weight).toBe('900');
      expect(r.style).toBe('normal');
      // the plain word at the PDF's tracking, on the advances the manifest measured: a fallback face would not come to this width
      expect(r.spacing / r.size).toBeCloseTo(RD_GLITCH_WORD.track, 3);
      expect(Math.abs(r.width - r.size * (RD_GLITCH_WORD.advance + RD_GLITCH_WORD.text.length * RD_GLITCH_WORD.track)), 'the word\'s width against Rubik\'s advances').toBeLessThan(r.size * 0.02);
      // the letters as drawn, read at rest in one look: inside a burst the plain letters are hidden (the frame log below
      // holds that), and a hidden letter's innerText is empty. On skreed.shop on 2026-11-09 the arrival's burst came as
      // the row read them and it saw nine empty letters; the letters themselves were never in question
      await expect.poll(() => word.evaluate((w) => (w.classList.contains('is-glitch') ? null : [...w.querySelectorAll<HTMLElement>('.rd-c')].map((c) => c.innerText))), { message: 'the plain letters, read at rest' }).toEqual([...RD_GLITCH_WORD.text]);

      // the arrival's burst, on its own, once the word has landed and the torn face has come or failed
      const bursts = () => page.evaluate(() => (window as unknown as { __word: { tiles: boolean }[] }).__word.filter((e) => e.tiles).length);
      await expect.poll(bursts, { timeout: 15_000, message: 'a burst as the word lands' }).toBeGreaterThan(0);
      // the torn face arrived after the first paint, was never preloaded, and now draws the slabs in place of the plain letters
      const glitch = await page.evaluate(() => {
        const fp = performance.getEntriesByType('paint').find((e) => e.name === 'first-paint')?.startTime ?? Infinity;
        const entry = performance.getEntriesByType('resource').find((e) => /rubik-glitch-400-caps/.test(e.name));
        return { fp, fetched: entry?.startTime ?? -1, preloaded: !!document.querySelector('link[rel="preload"][href*="rubik-glitch"]'), plain: document.querySelector('.rd-hero-glitch [data-g="plain"]')!.getAttribute('display'), face: document.querySelector('.rd-hero-glitch [data-g="face"]')!.getAttribute('display') };
      });
      expect(glitch.preloaded).toBe(false);
      expect(glitch.fetched, 'Rubik Glitch was fetched').toBeGreaterThan(0);
      expect(glitch.fetched, 'after the first paint').toBeGreaterThanOrEqual(glitch.fp);
      expect(glitch.plain).toBe('none');
      expect(glitch.face).toBeNull();
      // and the scroll's answer: past the cue's edge a burst fires, and the page is at rest again after it. The scroll
      // waits for the arrival's burst to end: a burst asked for while one runs starts it again (burst() in
      // scripts/logotype/glitch.ts), so the slabs never leave and the frame log above, which records changes, sees no
      // second burst. Without this wait the row failed 2 runs in 8 on 2026-11-09, each time the scroll landing inside the
      // arrival's 0.6 s and no idle burst coming in the 5 s after it; the assertion itself is as it was
      await expect.poll(async () => (await rest()).glitch, { timeout: 5_000, message: 'the arrival\'s burst is over' }).toBe(false);
      const had = await bursts();
      await go(page, 30);
      await expect.poll(bursts, { timeout: 5_000, message: 'a burst in answer to the scroll' }).toBeGreaterThan(had);
      await expect.poll(async () => (await rest()).glitch, { timeout: 5_000 }).toBe(false);
      await go(page, 0);
      // every frame sampled: the tiles shown and the plain letters hidden are one state, in every frame from the first
      const log = await page.evaluate(() => (window as unknown as { __word: { t: number; tiles: boolean; glitch: boolean; plain: string; slabs: number }[] }).__word);
      expect(log.length, 'at least a burst and its end').toBeGreaterThanOrEqual(3);
      for (const e of log) {
        expect(e.glitch, `at ${Math.round(e.t)} ms: the word's state against the engine's switch`).toBe(e.tiles);
        expect(e.plain, `at ${Math.round(e.t)} ms: the plain letters while the slabs ${e.tiles ? 'are' : 'are not'} on`).toBe(e.tiles ? 'hidden' : 'visible');
        if (e.tiles) expect(e.slabs, 'the slabs are drawn').toBeGreaterThan(0);
      }
      // each burst is short: the word is plain nine tenths of the time
      for (let k = 0; k + 1 < log.length; k++) if (log[k].tiles) expect(log[k + 1].t - log[k].t, 'a burst\'s length').toBeLessThan(1500);
      await done(ctx, page);
    });
  }
});

/** the twelve cases as they stand: each case's box and everything that could make it see-through */
const fans = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#seen .rd-seen-fan')].map((fan) => ({
  id: fan.dataset.fan!,
  cases: [...fan.querySelectorAll<HTMLElement>('.rd-seen-case')].map((c) => {
    const r = c.getBoundingClientRect(), img = c.querySelector('img')!;
    let opacity = parseFloat(getComputedStyle(img).opacity);
    for (let e: HTMLElement | null = c; e && e.id !== 'seen'; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
    return { left: r.left, right: r.right, width: r.width, opacity, rotate: getComputedStyle(c).rotate, transform: getComputedStyle(c).transform, loaded: img.complete && img.naturalWidth > 0 };
  }),
})));
type Fans = Awaited<ReturnType<typeof fans>>;
const keyOf = (f: Fans) => f.flatMap((x) => x.cases.map((c) => c.left.toFixed(1))).join(' ');
const STEP = 42 / 169.4;

test.describe('the three clips, live', () => {
  for (const [name, opts] of SIZES) {
    test(`D10 and D19 item 3 at ${name}: the fans open with the scroll; all twelve are opaque all the way, and at the end every fan stands at three equal steps of a quarter of a case, with equal spaces`, async ({ browser, baseURL }) => {
      const { ctx, page } = await open(browser, baseURL, opts);
      await live(page);
      const { top, end } = await page.evaluate(() => { const s = document.getElementById('seen')!; const t = s.getBoundingClientRect().top + scrollY; return { top: t, end: t + s.offsetHeight - innerHeight }; });
      expect(end - top, 'the scene is held for more than a screen').toBeGreaterThan(await page.evaluate(() => innerHeight));
      // held at the scrub's start the fans are closed: the back cases stand straight behind the front one
      await go(page, top);
      await page.waitForTimeout(900);
      const closed = await fans(page);
      for (const f of closed) expect(f.cases[3].left - f.cases[0].left, `${f.id}: closed at the start`).toBeLessThan(f.cases[0].width * STEP);
      // solid at every stop on the way
      for (let k = 0; k <= 8; k++) {
        await go(page, top + ((end - top) * k) / 8);
        await page.waitForTimeout(160);
        for (const f of await fans(page)) for (const [n, c] of f.cases.entries()) expect(c.opacity, `${f.id} case ${n + 1} at ${k} of 8`).toBe(1);
      }
      // the end: every picture in, and the scrub come to rest
      await go(page, end);
      await expect.poll(async () => (await fans(page)).every((f) => f.cases.every((c) => c.loaded)), { timeout: 15_000, message: 'all twelve pictures are in' }).toBe(true);
      let last = '';
      await expect.poll(async () => { const k = keyOf(await fans(page)); const same = k === last; last = k; return same; }, { timeout: 15_000, intervals: [400], message: 'the scrub has stopped' }).toBe(true);
      const at = await fans(page);
      expect(at.map((f) => f.id)).toEqual(['grey', 'blue', 'brown']);
      for (const f of at) {
        expect(f.cases).toHaveLength(4);
        const width = f.cases[0].width;
        for (let n = 1; n < 4; n++) {
          const step = f.cases[n].left - f.cases[n - 1].left;
          expect(Math.abs(step - width * STEP), `${f.id}: step ${n} of ${step.toFixed(2)} px against a quarter of a case`).toBeLessThanOrEqual(1);
          expect(Math.abs(f.cases[n].width - width), `${f.id}: case ${n + 1} is one size`).toBeLessThanOrEqual(0.5);
        }
        for (const c of f.cases) {
          expect(c.opacity).toBe(1);
          expect(c.rotate === 'none' || c.rotate === '0deg').toBe(true);
          expect(c.transform === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(c.transform), `a case at rest: ${c.transform}`).toBe(true);
        }
      }
      const W = await page.evaluate(() => document.documentElement.clientWidth);
      const between = [at[1].cases[0].left - at[0].cases[3].right, at[2].cases[0].left - at[1].cases[3].right];
      expect(Math.abs(between[0] - between[1]), `the spaces between the fans: ${between.join(', ')}`).toBeLessThanOrEqual(1);
      if (W >= 720) {
        // the wide page: the same space at the left edge, between the fans and at the right edge
        const spaces = [at[0].cases[0].left, ...between, W - at[2].cases[3].right];
        expect(Math.max(...spaces) - Math.min(...spaces), `the four spaces: ${spaces.map((s) => s.toFixed(1)).join(', ')}`).toBeLessThanOrEqual(1);
      } else {
        // a phone's row has panned to its last fan, in the middle of the screen
        expect(Math.abs((at[2].cases[0].left + at[2].cases[3].right) / 2 - W / 2), 'the brown fan in the middle').toBeLessThanOrEqual(1.5);
      }
      await done(ctx, page);
    });
  }

  /** a point on the visible part of this dot, on its disc's middle line, where the hit test answers with its own radio: a later disc lies over an earlier one (D21) */
  const pointOn = (page: Page, id: string) => page.evaluate((id) => {
    const label = document.querySelector(`.rd-glimpse-dot[data-shade="${id}"]`)!, input = label.querySelector('input'), disc = label.querySelector('.rd-glimpse-disc')!.getBoundingClientRect();
    const y = disc.top + disc.height / 2;
    for (let x = disc.left + 2; x < disc.right - 2; x += 2) if (document.elementFromPoint(x, y) === input) return { x, y };
    return null;
  }, id);
  const checked = (page: Page) => page.locator('.rd-glimpse-radio:checked').inputValue();
  /** the dots have landed: their entrance scales each from nothing and takes its transform off as it lands (glimpse.ts), and until then a dot has no room to hover */
  const landed = (page: Page) => expect.poll(() => page.locator('.rd-glimpse-dot').evaluateAll((els) => els.length === 5 && els.every((e) => getComputedStyle(e).transform === 'none')), { timeout: 10_000, message: 'the five dots have landed' }).toBe(true);
  const IDS = RD_COPY.glimpse.shades.map((s) => s.id);
  /** the name, the line and the picture on screen are this shade's: the words as drawn once the change has landed, the alt on its picture alone */
  async function shows(page: Page, id: string): Promise<void> {
    const s = byId.get(id)!, line = RD_COPY.glimpse.shades.find((x) => x.id === id)!.line;
    await expect(page.locator('.rd-glimpse-box')).toHaveAttribute('data-shade', id);
    await expect.poll(() => page.locator('.rd-glimpse-name').textContent(), { message: `${id}: the name` }).toBe(s.name);
    await expect.poll(() => page.locator('.rd-glimpse-line').textContent(), { message: `${id}: the line` }).toBe(line);
    await expect(page.locator(`.rd-glimpse-pic[data-shade="${id}"]`)).toHaveAttribute('data-on', '');
    await expect.poll(() => page.locator('.rd-glimpse-pic').evaluateAll((els) => els.filter((e) => e.querySelector('img')!.alt !== '').map((e) => (e as HTMLElement).dataset.shade))).toEqual([id]);
    expect(await page.locator(`.rd-glimpse-pic[data-shade="${id}"] img`).getAttribute('alt')).toBe(RD_COPY.glimpse.alt.replace('{shade}', s.name));
    await expect.poll(() => page.locator('.rd-glimpse-pics [data-on]').count(), { message: 'one picture left on the stage' }).toBe(1);
  }

  test('D19 item 5 at 1280 x 800: a pointer over a dot changes the shade with nothing pressed; the last shade stays when the pointer leaves; the demo\'s cursor is gone for good, and a click and the arrow keys still work', async ({ browser, baseURL }) => {
    const { ctx, page } = await open(browser, baseURL, LAPTOP);
    await live(page);
    await goTo(page, '#glimpse');
    const dots = page.locator('.rd-glimpse-dots');
    await expect(dots).toBeVisible();
    await expect(dots).toHaveRole('radiogroup');
    await expect(dots).toHaveAccessibleName(RD_COPY.glimpse.aria);
    await page.evaluate(() => {
      const w = window as unknown as { __presses: string[] }; w.__presses = [];
      for (const type of ['pointerdown', 'mousedown', 'click']) document.querySelector('.rd-glimpse-dots')!.addEventListener(type, () => w.__presses.push(type));
    });
    // the demo plays on its own until the visitor arrives: its cursor is shown once the section has been on screen a moment
    await expect(page.locator('.rd-glimpse-cursor')).toBeVisible({ timeout: 10_000 });
    await landed(page);
    // over each dot in turn, from the last to the first: the shade is each one's, at once
    for (const id of [...IDS].reverse()) {
      const p = await pointOn(page, id);
      expect(p, `${id}: some part of the dot answers`).not.toBeNull();
      await page.mouse.move(p!.x, p!.y, { steps: 3 });
      await expect.poll(() => checked(page), { timeout: 3_000, message: `${id}: the radio` }).toBe(id);
      await shows(page, id);
    }
    expect(await page.evaluate(() => (window as unknown as { __presses: string[] }).__presses), 'nothing was pressed').toEqual([]);
    // the cursor left for good on the first dot the pointer came over, and the live region speaks for the visitor again
    await expect(page.locator('.rd-glimpse-cursor')).toBeHidden();
    await expect(page.locator('.rd-glimpse-box [data-say]')).toHaveAttribute('aria-live', 'polite');
    await expect.poll(() => page.locator('.rd-glimpse-box [data-say-name]').textContent()).toBe(byId.get(IDS[0])!.name);
    // away from the dots: the last shade stays
    await page.mouse.move(640, 700, { steps: 3 });
    await page.waitForTimeout(600);
    expect(await checked(page)).toBe(IDS[0]);
    await shows(page, IDS[0]);
    await expect(page.locator('.rd-glimpse-cursor')).toBeHidden();
    // a click is still the radio's own, and from there the browser's arrow keys move it
    const p = await pointOn(page, IDS[2]);
    await page.mouse.click(p!.x, p!.y);
    await expect.poll(() => checked(page)).toBe(IDS[2]);
    await shows(page, IDS[2]);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => checked(page)).toBe(IDS[3]);
    await shows(page, IDS[3]);
    await done(ctx, page);
  });

  test('D19 item 5 at 390 x 844, a finger: a tap on a dot changes the shade, a finger moving over the row does not, and the five dots are 44 px wide to the touch', async ({ browser, baseURL }) => {
    const { ctx, page } = await open(browser, baseURL, PHONE);
    await live(page);
    await goTo(page, '#glimpse');
    await expect(page.locator('.rd-glimpse-dots')).toBeVisible();
    await landed(page);
    for (const id of [IDS[1], IDS[3]]) {
      const p = await pointOn(page, id);
      await page.touchscreen.tap(p!.x, p!.y);
      await expect.poll(() => checked(page), { timeout: 3_000 }).toBe(id);
      await shows(page, id);
    }
    await expect(page.locator('.rd-glimpse-cursor')).toBeHidden();
    // what shows of a dot across its widest is the pitch, the row's whole width but for the last disc's rest
    const pitch = await page.locator('.rd-glimpse-dot').first().evaluate((e) => e.getBoundingClientRect().width);
    expect(pitch).toBeGreaterThanOrEqual(44);
    await done(ctx, page);
  });

  test('D10 and D19 item 4: ten swatches link to ten different families on real catalog shades, the PDF\'s pictures loaded; a press leaves /#families in the history, so the way back lands on the section', async ({ browser, baseURL, request }) => {
    const { ctx, page } = await open(browser, baseURL, LAPTOP);
    await live(page);
    await goTo(page, '#families');
    const links = page.locator('#families nav a.rd-families-sw');
    await expect(links).toHaveCount(10);
    await expect(page.locator('#families nav')).toHaveAccessibleName(RD_COPY.families.aria);
    const rows = await links.evaluateAll((els) => els.map((a) => ({ family: (a as HTMLElement).dataset.family!, shade: (a as HTMLElement).dataset.shade!, href: a.getAttribute('href')!, name: a.querySelector('.rd-families-name')!.textContent!.trim() })));
    expect(rows.map((r) => [r.family, r.shade])).toEqual(RD_COPY.families.swatches.map((s) => [s.family, s.shade]));
    expect(new Set(rows.map((r) => r.family)).size, 'ten different families').toBe(10);
    expect(new Set(rows.map((r) => r.family))).toEqual(new Set(SHADES.map((s) => s.family)));
    for (const r of rows) {
      const s = byId.get(r.shade);
      expect(s?.family, `${r.shade} is a shade of ${r.family}`).toBe(r.family);
      expect(r.href, `${r.family}: its page, on the shade it stands for`).toBe(shadeHref(r.family, s!.n));
      const res = await request.get(r.href);
      expect(res.status(), r.href).toBe(200);
      expect(await res.text(), `${r.href} is that family's page`).toContain(`<link rel="canonical" href="https://skreed.shop/shades/${r.family}/">`);
      await expect(page.getByRole('link', { name: new RegExp(`^${r.name}\\s*,\\s*${RD_COPY.families.count}$`) }), `the link's name: ${r.name}`).toHaveAttribute('href', r.href);
    }
    // the pictures: ten of the row's own, their alt empty because the link's words name them
    await expect.poll(() => links.evaluateAll((els) => els.every((a) => { const i = a.querySelector('img')!; return i.complete && i.naturalWidth > 0 && i.alt === ''; })), { timeout: 15_000, message: 'the ten pictures are in' }).toBe(true);
    // the press and the way back
    const one = rows[3];
    await page.locator(`#families a.rd-families-sw[data-family="${one.family}"]`).click();
    await page.waitForURL((u) => u.pathname === `/shades/${one.family}/` && u.search === new URL(one.href, baseURL).search);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/' && u.hash === '#families');
    // the browser's Back puts the visitor where they pressed, the swatch on screen; the row may stand below the section's first screen
    await expect(page.locator(`#families a.rd-families-sw[data-family="${one.family}"]`)).toBeInViewport({ timeout: 10_000 });
    // and a family page's "Back to main page" is a link to the same address, which lands on the section's top with nothing of ours in the way (spec D1, D10)
    const fresh = await ctx.newPage();
    await fresh.goto(new URL('/#families', baseURL).href);
    await expect.poll(() => fresh.evaluate(() => Math.round(Math.abs(document.getElementById('families')!.getBoundingClientRect().top))), { timeout: 10_000, message: 'the section at the top of the screen' }).toBe(0);
    await done(ctx, page);
  });
});

test.describe('the products', () => {
  /** the panel is up: its transform has come home and it stands over the frame; at rest it is moved a whole panel down, under the frame's foot, inside its clip */
  const panel = (item: Locator) => item.evaluate((it) => {
    const desc = it.querySelector('.rd-products-desc')!, frame = it.querySelector('.rd-products-frame')!.getBoundingClientRect(), d = desc.getBoundingClientRect(), t = getComputedStyle(desc).transform;
    return { up: (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)') && d.top < frame.bottom - 4 };
  });
  const ITEMS = RD_COPY.products.items;

  test('the brief at 1280 x 800, each product picture gives its description on hover and on keyboard focus; down again when they leave; Escape lowers it; every description is in the accessibility tree without either', async ({ browser, baseURL }) => {
    const { ctx, page } = await open(browser, baseURL, LAPTOP);
    await live(page);
    await goTo(page, '.rd-products-row');
    await page.mouse.move(2, 2);
    const item = (id: string) => page.locator(`.rd-products-item[data-p="${id}"]`);
    // at rest, each description down, and already what its button is described by (criterion 6)
    for (const it of ITEMS) {
      await expect.poll(async () => (await panel(item(it.id))).up, { message: `${it.id} at rest` }).toBe(false);
      await expect(item(it.id).locator('button')).toHaveAccessibleDescription(it.text);
      await expect(item(it.id).locator('button')).toHaveAttribute('aria-expanded', 'false');
      await expect(item(it.id).locator('.rd-products-desc')).toHaveText(it.text);
      await expect(item(it.id).locator('button')).toContainText(it.label);
    }
    // hover: up under the pointer, down once it has left for another, one at a time
    for (const it of ITEMS) {
      await item(it.id).locator('.rd-products-frame').hover();
      await expect.poll(async () => (await panel(item(it.id))).up, { timeout: 5_000, message: `${it.id} on hover` }).toBe(true);
      for (const other of ITEMS.filter((x) => x !== it)) await expect.poll(async () => (await panel(item(other.id))).up, { message: `${other.id} while ${it.id} is hovered` }).toBe(false);
    }
    // Escape puts it away under a pointer that has not moved, and a fresh hover raises it again
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await panel(item(ITEMS[4].id))).up, { message: 'after Escape' }).toBe(false);
    await page.mouse.move(2, 2);
    await page.waitForTimeout(100);
    await item(ITEMS[4].id).locator('.rd-products-frame').hover();
    await expect.poll(async () => (await panel(item(ITEMS[4].id))).up, { message: 'a fresh hover' }).toBe(true);
    await page.mouse.move(2, 2);
    await expect.poll(async () => (await panel(item(ITEMS[4].id))).up, { message: 'the pointer gone' }).toBe(false);
    // keyboard focus, along the row by Tab and back by Shift+Tab, from a button given focus by script (the harness: never past a section's edge)
    await item(ITEMS[0].id).locator('button').focus();
    for (const it of ITEMS.slice(1)) {
      await page.keyboard.press('Tab');
      await expect(item(it.id).locator('button')).toBeFocused();
      await expect.poll(async () => (await panel(item(it.id))).up, { timeout: 5_000, message: `${it.id} in keyboard focus` }).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    await expect.poll(async () => (await panel(item(ITEMS[4].id))).up, { message: 'focus gone back' }).toBe(false);
    await expect.poll(async () => (await panel(item(ITEMS[3].id))).up, { message: 'on the one before' }).toBe(true);
    await done(ctx, page);
  });

  test('the brief at 390 x 844, a tap opens the product\'s description and says so on its button; a second tap closes it, a tap on another moves it, and the row scrolls sideways inside itself', async ({ browser, baseURL }) => {
    const { ctx, page } = await open(browser, baseURL, PHONE);
    await live(page);
    await goTo(page, '.rd-products-row');
    const item = (id: string) => page.locator(`.rd-products-item[data-p="${id}"]`);
    for (const it of ITEMS) {
      const b = item(it.id).locator('button');
      await b.tap();
      await expect(b).toHaveAttribute('aria-expanded', 'true');
      await expect.poll(async () => (await panel(item(it.id))).up, { timeout: 5_000, message: `${it.id} on a tap` }).toBe(true);
      await expect(item(it.id).locator('.rd-products-desc')).toBeInViewport();
      for (const other of ITEMS.filter((x) => x !== it)) await expect(item(other.id).locator('button'), `${other.id} while ${it.id} is open`).toHaveAttribute('aria-expanded', 'false');
    }
    const last = item(ITEMS[4].id).locator('button');
    await last.tap();
    await expect(last).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(async () => (await panel(item(ITEMS[4].id))).up, { message: 'a second tap' }).toBe(false);
    expect(await page.locator('.rd-products-row').evaluate((r) => r.scrollWidth > r.clientWidth && r.scrollLeft > 0), 'the row went sideways, by itself').toBe(true);
    expect(await page.evaluate(() => [scrollX, document.documentElement.scrollWidth <= innerWidth]), 'and the page did not').toEqual([0, true]);
    await done(ctx, page);
  });
});

test.describe('the quiz', () => {
  const CURATOR: PersonaId[] = Array<PersonaId>(10).fill('curator');
  for (const [name, opts] of SIZES) {
    test(`D11 at ${name}: "Let's find it" opens the host and question 1 under the veil, and the quiz plays to its own result, which the logotype stands over in Pearl Whisper`, async ({ browser, baseURL }) => {
      const { ctx, page } = await open(browser, baseURL, opts);
      await live(page);
      await goTo(page, '#quiz');
      const host = page.locator('#quizHost'), find = page.locator('#find'), cta = page.locator('#rdQuizCta');
      await expect(host).toBeHidden();
      await expect(host).toHaveAttribute('data-tone', 'dark');
      await expect(cta).toHaveAccessibleName(RD_COPY.quiz.cta);
      await expect(cta).toContainText(RD_COPY.quiz.ctaPill);
      if (opts.hasTouch) await cta.tap(); else await cta.click();
      await expect(host).toBeVisible();
      await expect(find).toHaveAttribute('data-state', 'quiz', { timeout: 30_000 });
      await expect(page.locator('#toTopVeil')).toBeHidden({ timeout: 10_000 });
      await expect(page.locator('.qz-card[data-i="0"]')).toHaveClass(/is-top/);
      await expect(page.locator('.qz-card[data-i="0"]')).toBeFocused();
      await expect.poll(() => page.evaluate(() => Math.abs(Math.round(document.getElementById('find')!.getBoundingClientRect().top))), { message: 'the quiz at the top of the screen' }).toBeLessThanOrEqual(2);
      await expect(page.locator('a.site-logo')).toHaveAttribute('data-tone', 'dark');
      // the ten answers, each past the deck's guard against a double click (350 ms from its question being put up)
      for (let i = 0; i < CURATOR.length; i++) {
        const card = page.locator(`.qz-card[data-i="${i}"]`);
        await expect(card).toHaveClass(/is-top/, { timeout: 15_000 });
        await page.waitForTimeout(420);
        const opt = card.locator(`.qz-opt[data-persona="${CURATOR[i]}"]`);
        if (opts.hasTouch) await opt.tap(); else await opt.click();
      }
      // the reveal, then the result, the quiz's own (D11): the personality the answers give, a shade of its group, its links
      await expect(find).toHaveAttribute('data-state', 'result', { timeout: QUIZ_REVEAL_MS.total + 15_000 });
      const shown = page.locator('.qz-result:not([hidden])');
      await expect(shown).toHaveCount(1);
      const p = scoreQuiz(CURATOR);
      await expect(shown).toHaveAttribute('data-persona', p.id);
      const { shade, others } = pickShade(p, () => 0);
      const drawn = await shown.locator('.qz-mini[hidden]').getAttribute('data-shade');
      expect([shade, ...others], 'the shade drawn is of the personality\'s group').toContain(drawn);
      const s = byId.get(drawn!)!;
      await expect(shown.locator('.qz-see')).toHaveAttribute('href', shadeHref(s.family, s.n));
      await expect(shown.locator('.qz-see')).toContainText(Q.see);
      await expect(shown.locator('.qz-retry')).toContainText(Q.retry);
      await expect(page.locator('html')).toHaveAttribute('data-qz-ground', /.*/);
      await expect(page.locator('a.site-logo')).toHaveCSS('color', PEARL_WHISPER);
      await done(ctx, page);
    });
  }
});

test.describe('the section index', () => {
  const ENTRIES: [string, string][] = [['families', '#families'], ['room', '#products'], ['quiz', '#quiz'], ['top', '#top']];
  for (const [name, opts] of SIZES) {
    test(`D4 at ${name}: each entry jumps in place to its section under the veil and is marked; the two page links leave for /about/ and /jars/`, async ({ browser, baseURL }) => {
      const { ctx, page } = await open(browser, baseURL, opts);
      await live(page);
      const phone = !!opts.isMobile;
      const veil = page.locator('#toTopVeil');
      await expect(veil).toHaveCount(1);
      await expect(page.locator('#toTop'), 'Home is the jump: the page draws no Back to top').toHaveCount(0);
      // a press inside the drawer waits for its panel to stand still
      const press = async (selector: string) => {
        if (phone) {
          await page.locator('#siteNav .snav-menu').tap();
          await expect(page.locator('#site-sections')).toBeVisible();
          await expect.poll(() => page.locator('.snav-in').evaluate((p) => { const r = p.getBoundingClientRect(); return Math.round(r.right - innerWidth); })).toBe(0);
          await page.locator(`#site-sections ${selector}`).tap();
        } else await page.locator(`#siteNav .snav-list ${selector}`).click();
      };
      // start somewhere else, so every jump is a jump, and no reload happens on the way
      await page.evaluate(() => { (window as unknown as { __alive: boolean }).__alive = true; });
      await goTo(page, '#launch');
      for (const [sec, target] of ENTRIES) {
        await press(`a[data-sec="${sec}"]`);
        await expect.poll(() => page.evaluate((t) => Math.round(Math.abs(document.querySelector(t)!.getBoundingClientRect().top)), target), { timeout: 10_000, message: `${sec}: ${target} at the top of the screen` }).toBe(0);
        await expect(veil).toBeHidden({ timeout: 10_000 });
        for (const at of [phone ? '#site-sections' : '#siteNav .snav-list']) await expect(page.locator(`${at} a[data-sec="${sec}"]`), `${sec}: the entry on screen is marked`).toHaveAttribute('aria-current', 'location');
        if (phone) await expect(page.locator('#site-sections'), 'the drawer closed with the press').toBeHidden();
      }
      expect(await page.evaluate(() => scrollY), 'Home is the page\'s top').toBe(0);
      expect(await page.evaluate(() => (window as unknown as { __alive?: boolean }).__alive), 'no reload').toBe(true);
      // the page links: plain navigations, never jumped or marked
      await expect(page.locator('#siteNav [data-page]'), 'About in the bar and the drawer, and the gift').toHaveCount(3);
      await press('a[data-page="about"]');
      await page.waitForURL((u) => u.pathname === '/about/');
      await expect(page.locator('h1')).toBeVisible();
      await page.goBack();
      await page.waitForURL((u) => u.pathname === '/');
      // the gift, at every width, outside the drawer
      const gift = page.locator('#snavGift');
      await expect(gift).toBeVisible();
      await expect(gift).toHaveAttribute('href', '/jars/');
      await expect(gift).toHaveAccessibleName(COPY.nav.gift);
      if (phone) await gift.tap(); else await gift.click();
      await page.waitForURL((u) => u.pathname === '/jars/');
      await expect(page.locator('section#signup.signup')).toBeVisible();
      await expect(page.locator('main.rd')).toHaveCount(0);
      await done(ctx, page);
    });
  }
});

test.describe('the countdown', () => {
  for (const [name, opts] of SIZES) {
    test(`D13, D19 item 9 and D20 at ${name}: the digits tick under the COMING SOON mark with three colons of dots between the four pairs; no "Launch in" and no #soon; the glitch finds no pair in a colon`, async ({ browser, baseURL }) => {
      test.skip(Date.now() >= Date.parse(LAUNCH_ISO), 'the launch has passed: the row at zero holds the page');
      const { ctx, page } = await open(browser, baseURL, opts);
      await live(page);
      await goTo(page, '#launch');
      const count = page.locator('#count');
      await expect(count).toHaveAttribute('data-ready', '');
      await expect(count).toHaveRole('timer');
      await expect(count).toHaveAccessibleName(COPY.cd.aria);
      // the numbers are the launch's, as text for assistive technology and as the two dot digits each pair draws
      const read = () => page.evaluate(() => ['d', 'h', 'm', 's'].map((u) => ({ text: document.getElementById(`cd-${u}`)!.textContent!, drawn: [...document.querySelectorAll(`#cdg-${u} use`)].map((x) => x.getAttribute('href')) })));
      const at = await read();
      const left = Math.floor((Date.parse(LAUNCH_ISO) - Date.now()) / 1000);
      expect(Math.abs(Number(at[0].text) - Math.floor(left / 86400)), 'the days are the launch\'s').toBeLessThanOrEqual(1);
      for (const u of at) expect(u.drawn, 'each pair draws its text').toEqual([`#dg-${u.text[0]}`, `#dg-${u.text[1]}`]);
      await expect.poll(async () => (await read())[3].text, { timeout: 4_000, message: 'the seconds tick' }).not.toBe(at[3].text);
      // the mark over the digits, in the eyebrow's place, named for assistive technology
      const eyebrow = page.locator('#cdEyebrow'), mark = page.locator('#cdEyebrow svg.rd-launch-mark');
      await expect(mark).toBeVisible();
      await expect(page.getByRole('img', { name: RD_COPY.launch.soon })).toHaveCount(1);
      const box = await page.evaluate(() => { const m = document.querySelector('#cdEyebrow svg')!.getBoundingClientRect(), c = document.querySelector('#count .n')!.getBoundingClientRect(), w = document.querySelector('#count')!.getBoundingClientRect(); return { markBottom: m.bottom, digitsTop: c.top, markMid: (m.left + m.right) / 2, rowMid: (w.left + w.right) / 2, vw: innerWidth }; });
      expect(box.markBottom, 'the mark stands over the digits').toBeLessThanOrEqual(box.digitsTop);
      expect(Math.abs(box.markMid - box.rowMid), 'centred over the row').toBeLessThanOrEqual(1.5);
      expect((await eyebrow.textContent())?.trim() ?? '').toBe('');
      // no "Launch in" anywhere on the page, and no band under its old id
      expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/launch in/i);
      await expect(page.locator('#soon')).toHaveCount(0);
      // the row: pair, colon, pair, colon, pair, colon, pair, in that order across the screen
      const row = await count.evaluate((c) => [...c.children].map((k) => { const r = k.getBoundingClientRect(); return { tag: k.tagName.toLowerCase(), cls: k.getAttribute('class') ?? '', left: r.left, right: r.right, top: r.top, height: r.height, hidden: k.getAttribute('aria-hidden'), id: k.id, focusable: k.getAttribute('focusable') }; }));
      expect(row.map((k) => k.tag)).toEqual(['div', 'svg', 'div', 'svg', 'div', 'svg', 'div']);
      for (let k = 1; k < row.length; k++) expect(row[k].left, 'left to right').toBeGreaterThanOrEqual(row[k - 1].right - 1);
      const colons = page.locator('#count > svg.colon');
      await expect(colons).toHaveCount(3);
      for (const c of row.filter((k) => k.tag === 'svg')) {
        expect(c.cls).toBe('colon');
        expect(c.hidden, 'hidden from assistive technology').toBe('true');
        expect(c.focusable).toBe('false');
        expect(c.id, 'no id: nothing that looks for a pair finds one').toBe('');
        expect(c.height).toBeGreaterThan(0);
      }
      await expect(colons.first()).toBeVisible();
      // each colon draws the one path the inline script made for them, in the digits' own dots and colour
      expect(await colons.evaluateAll((els) => els.map((c) => c.querySelector('use')!.getAttribute('href')))).toEqual(['#rd-colon', '#rd-colon', '#rd-colon']);
      expect(await page.evaluate(() => { const p = document.getElementById('rd-colon')!; return [p.parentElement!.parentElement!.getAttribute('aria-hidden'), (p.getAttribute('d')?.match(/M/g) ?? []).length]; }), 'eight dots, two marks of four, in a hidden sprite').toEqual(['true', 8]);
      expect(await page.evaluate(() => [getComputedStyle(document.querySelector('#count .colon')!).color, getComputedStyle(document.querySelector('#count .n')!).color].reduce((a, b) => (a === b ? a : ''))), 'the colons in the digits\' colour').not.toBe('');
      // the words the timer says are the four numbers and their units: nothing of a colon
      expect((await count.textContent())?.trim()).toMatch(/^\d\d\s*days\s*\d\d\s*hours\s*\d\d\s*minutes\s*\d\d\s*seconds$/);
      // a burst: the four groups take the glitch and a colon takes none of it (E-CD-glitch; Launch.astro: a colon is an svg child of #count, the glitch takes its div children)
      await expect.poll(() => colons.evaluateAll((els) => els.every((c) => getComputedStyle(c).opacity === '1')), { message: 'the row\'s entrance has landed' }).toBe(true);
      await page.evaluate(() => (window as unknown as { __skreedCount: { burst(d: number): void } }).__skreedCount.burst(0.8));
      await expect.poll(() => page.locator('#count > div .gl-tiles').evaluateAll((els) => els.filter((e) => e.getAttribute('display') !== 'none').length), { timeout: 3_000, intervals: [30], message: 'the four pairs burst' }).toBe(4);
      expect(await page.locator('#count > svg.colon .gl-tiles, #count > svg.colon .gl-base').count(), 'no tile and no base in a colon').toBe(0);
      expect(await colons.evaluateAll((els) => els.map((c) => [c.childElementCount, getComputedStyle(c).opacity, c.querySelector('use')!.getAttribute('href')]))).toEqual([[1, '1', '#rd-colon'], [1, '1', '#rd-colon'], [1, '1', '#rd-colon']]);
      await done(ctx, page);
    });
  }

  test('D13 and D20: at zero the script writes the live line over the mark and the numerals go with their colons', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext(LAPTOP);
    // the launch has passed: the clock moved on before the page's first script
    const after = Date.parse(LAUNCH_ISO) + 60_000;
    await watchCsp(ctx);
    await ctx.addInitScript((t) => { const was = Date.now; const skew = t - was(); Date.now = () => was() + skew; }, after);
    const page = await ctx.newPage();
    await page.goto(new URL('/', baseURL).href);
    await goTo(page, '#launch');
    await expect(page.locator('#count')).toBeHidden();
    await expect(page.locator('#count > svg.colon').first()).toBeHidden();
    await expect(page.locator('#cdEyebrow svg')).toHaveCount(0);
    await expect(page.locator('#cdEyebrow')).toContainText(COPY.cd.liveLead);
    await expect(page.locator('#cdEyebrow a')).toHaveText(COPY.cd.liveLink);
    await done(ctx, page);
  });
});

test.describe('the jars', () => {
  type Mock = { signup: Record<string, string>[]; verify: Record<string, string>[] };
  /** the two endpoints the form posts to, mocked: a save answers 202, a code is mailed; a check answers 200 for 123456 and 422 for any other */
  async function mock(page: Page): Promise<Mock> {
    const calls: Mock = { signup: [], verify: [] };
    await page.route('**/api/signup', async (r) => { calls.signup.push(JSON.parse(r.request().postData() ?? '{}')); await r.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ verify: true, gap: 30 }) }); });
    await page.route('**/api/verify', async (r) => { const b = JSON.parse(r.request().postData() ?? '{}'); calls.verify.push(b); await r.fulfill({ status: b.code === '123456' ? 200 : 422, contentType: 'application/json', body: JSON.stringify(b.code === '123456' ? { ok: true } : { error: 'wrong', left: 4 }) }); });
    return calls;
  }
  const jar = (page: Page) => page.locator('#suYours');
  /** press a Followed tick through its row, as a visitor does */
  async function tick(page: Page, id: string, touch: boolean): Promise<void> {
    const t = page.locator(`label.su-tick[data-id="${id}"]`);
    if (touch) await t.tap(); else await t.click();
  }
  /** the ticks, the fill and the drain, the visit's memory, and the form to its code step and on to done */
  async function play(page: Page, calls: Mock, touch: boolean): Promise<void> {
    const root = page.locator('#signup');
    await expect(root).toHaveAttribute('data-ready', '1', { timeout: 20_000 });
    await expect(jar(page)).toHaveAttribute('data-state', '0');
    await expect(jar(page)).toHaveAttribute('aria-label', SIGNUP_COPY.jarEmpty);
    // the three columns and their ticks: the column's press opens its page and fills nothing (the tick is the follow, E-S5-tick)
    await expect(page.locator('a.su-follow')).toHaveCount(3);
    await expect(page.locator('.su-tick-box')).toHaveCount(3);
    for (const a of await page.locator('a.su-follow').all()) await expect(a).toHaveAttribute('target', '_blank');
    // fill, in the order ticked
    await tick(page, 'facebook', touch);
    await expect(jar(page)).toHaveAttribute('data-state', 'f', { timeout: 6_000 });
    await expect(page.locator('#suLive')).toHaveText('Blue added to your jar.');
    await tick(page, 'instagram', touch);
    await expect(jar(page)).toHaveAttribute('data-state', 'fi', { timeout: 6_000 });
    expect(await page.evaluate(() => sessionStorage.getItem('skreed:signup-follows'))).toBe('["facebook","instagram"]');
    // drain: the blue goes and the pink and purple stay
    await tick(page, 'facebook', touch);
    await expect(jar(page)).toHaveAttribute('data-state', 'i', { timeout: 6_000 });
    await expect(page.locator('#suLive')).toHaveText('Blue taken out of your jar.');
    await expect(page.locator('#suTick-facebook')).not.toBeChecked();
    await expect(page.locator('#suTick-instagram')).toBeChecked();
    await tick(page, 'instagram', touch);
    await expect(jar(page)).toHaveAttribute('data-state', '0', { timeout: 6_000 });
    await expect(jar(page)).toHaveAttribute('aria-label', SIGNUP_COPY.jarEmpty);
    // the form, its fields mounted by its own chunk (the first name made there, section 5's budget): each way to be refused, then the code
    const form = page.locator('#suForm'), name = page.locator('#suName'), email = page.locator('#suEmail'), send = page.locator('#suSend'), msg = page.locator('#suMsg');
    await expect(form).toBeVisible();
    await expect(name).toBeVisible({ timeout: 10_000 });
    await send.scrollIntoViewIfNeeded();
    await send.click();
    await expect(msg).toHaveText(LEAD_CODE_COPY.errName);
    await name.fill('Sam');
    await send.click();
    await expect(msg).toHaveText(SIGNUP_COPY.errEmail);
    await email.fill('sam@example.com');
    await send.click();
    await expect(msg).toHaveText(SIGNUP_COPY.errConsent);
    expect(calls.signup, 'nothing is sent until all three are in').toEqual([]);
    await page.locator('#suConsentRow label').click();
    await page.locator('label.su-tick[data-id="youtube"]').click();   // a follow, so the post carries it
    await expect(jar(page)).toHaveAttribute('data-state', 'y', { timeout: 6_000 });
    await send.click();
    // the code step in the same place, focus on its field, the body as today's (criterion 8)
    await expect(page.locator('#suCode')).toBeVisible();
    await expect(page.locator('#suCode')).toBeFocused();
    await expect(page.locator('#suCodePill')).toBeVisible();
    await expect(page.locator('#suPill')).toBeHidden();
    await expect(msg).toHaveText(codeLine(LEAD_CODE_COPY.sent, { email: 'sam@example.com' }));
    expect(calls.signup).toEqual([{ email: 'sam@example.com', name: 'Sam', follows: 'youtube', consent: 'yes', source: 'signup' }]);
    // a wrong code, then the right one, which checks itself once it is whole
    await page.locator('#suCode').fill('000000');
    await expect(msg).toHaveText(wrongLine(4));
    await page.locator('#suCode').fill('123456');
    await expect(page.locator('#suDone')).toHaveText(fill(SIGNUP_COPY.done, { email: 'sam@example.com' }));
    await expect(page.locator('#suDone')).toBeFocused();
    expect(calls.verify.map((b) => [b.email, b.source, b.code])).toEqual([['sam@example.com', 'signup', '000000'], ['sam@example.com', 'signup', '123456']]);
  }

  for (const [name, opts] of SIZES) {
    test(`D18 and E-S5-tick at ${name}, at the page's end: the jars' ticks fill and drain jar 4, the logotype is Urban Slate over the cream, and the form reaches its code step and its done line against a mocked endpoint`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext(opts);
      await watchCsp(ctx);
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      const calls = await mock(page);
      await page.goto(new URL('/', baseURL).href);
      await live(page);
      await goTo(page, '#signup');
      await expect(page.locator('a.site-logo')).toHaveAttribute('data-tone', 'light');
      await expect(page.locator('a.site-logo')).toHaveCSS('color', URBAN_SLATE);
      await play(page, calls, !!opts.hasTouch);
      expect(errors).toEqual([]);
      await done(ctx, page);
    });

    test(`D1 at ${name}, /jars/: the same section on a page of its own, its ticks and its form the same, with the logotype and a way back to the landing page; nothing else of the landing page comes with it`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext(opts);
      await watchCsp(ctx);
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error' && !/status of 422/.test(m.text())) errors.push(m.text()); });   // the wrong code's 422 is the mock's answer, which the browser logs
      const calls = await mock(page);
      await page.goto(new URL('/jars/', baseURL).href);
      await expect(page.locator('h1')).toHaveText(RD_JARS.title);
      await expect(page.locator('a.site-logo')).toBeVisible();
      await expect(page.locator('a.rd-jars-home')).toHaveAttribute('href', '/');
      await expect(page.locator('main.rd')).toHaveCount(0);
      await expect(page.locator('#siteNav')).toHaveCount(0);
      expect(await page.evaluate(() => { const all = [...document.querySelectorAll('[id]')].map((e) => e.id); return all.filter((id, k) => all.indexOf(id) !== k); }), 'no id twice').toEqual([]);
      expect(await page.evaluate(() => [...document.forms].map((f) => f.id))).toEqual(['suForm']);
      await play(page, calls, !!opts.hasTouch);
      expect(errors).toEqual([]);
      await done(ctx, page);
    });
  }
});

test.describe('without the motion', () => {
  test('D16 and section 7, no JavaScript: every line and picture stands; the quiz\'s own line is in its open host and its way in hidden; the descriptions are printed; the mark stands over the date', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ ...LAPTOP, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(new URL('/', baseURL).href);
    await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
    for (const sel of ['#top', '#seen', '#families', '#glimpse', '#products', '#match', '#everyone', '#quiz', '#proof', '#launch', '#signup', 'footer.rd-footer']) await expect(page.locator(sel), sel).toBeVisible();
    for (const h of ['Things are about to look different', 'Now choose from what’s possible.', 'This is just a glimpse.', 'We’re not just a phone case brand.', 'There’s something for everyone', 'Don’t be overwhelmed.']) await expect(page.getByRole('heading', { name: h, exact: true }), h).toBeVisible();
    // nothing waits for a script: no letter, picture or section is hidden by anything of the page's own
    const hidden = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main.rd .rd-c, main.rd .rd-match-c, main.rd p, main.rd figcaption')].filter((e) => { if (e.closest('[hidden], .sr-only, noscript, .rd-glimpse-pic')) return false; const s = getComputedStyle(e); return s.display !== 'none' && (s.visibility !== 'visible' || parseFloat(s.opacity) < 1); }).map((e) => e.textContent?.slice(0, 30)));
    expect(hidden).toEqual([]);
    // the picker shows the frame's shade with no dots, the swatches are links all the same, every description is printed
    await expect(page.locator('.rd-glimpse-dots')).toBeHidden();
    await expect(page.locator(`.rd-glimpse-pic[data-shade="${RD_COPY.glimpse.start}"]`)).toBeVisible();
    await expect(page.locator('#families a.rd-families-sw')).toHaveCount(10);
    for (const it of RD_COPY.products.items) {
      const d = page.locator(`.rd-products-item[data-p="${it.id}"] .rd-products-desc`);
      await expect(d).toBeVisible();
      await expect(d).toHaveText(it.text);
      expect(await d.evaluate((e) => getComputedStyle(e).transform), `${it.id}: printed in its place`).toBe('none');
    }
    await expect(page.locator('#rdQuizCta')).toBeHidden();
    await expect(page.locator('#quizHost')).toBeVisible();
    await expect(page.locator('#quizHost .qz-noscript')).toBeVisible();
    await expect(page.locator('#count')).toBeHidden();
    await expect(page.locator('#launch svg.rd-launch-mark')).toBeVisible();
    // (Playwright's text matching skips a noscript, so the date is read from its element)
    await expect(page.locator('#launch noscript time')).toBeVisible();
    expect(await page.locator('#launch noscript time').evaluate((t) => t.textContent)).toBe(COPY.cd.noscriptDate);
    await ctx.close();
  });

  test('D16, the motion kit\'s chunks refused: no error surfaces, nothing is hidden with the page scrolled from top to bottom, and the picker still answers a hover with a cut', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext(LAPTOP);
    await watchCsp(ctx);
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    let refused = 0;
    await page.route(/\/_astro\/(?:gsap|ScrollTrigger)\.[^/]*\.js(?:\?.*)?$/, async (r) => { refused++; await r.abort(); });
    await page.goto(new URL('/', baseURL).href);
    await expect.poll(() => refused, { timeout: 10_000, message: 'the page asked for the kit' }).toBeGreaterThan(0);
    await walk(page);
    expect(await page.evaluate(() => document.documentElement.classList.contains('rd-live')), 'the kit never ran').toBe(false);
    const hidden = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main.rd :is(.rd-c, .rd-match-c, .rd-seen-case, .rd-families-pop, .rd-products-item, .rd-everyone-tile, .su-col)')].filter((e) => { const s = getComputedStyle(e); return s.visibility !== 'visible' || parseFloat(s.opacity) < 0.99; }).map((e) => e.className));
    expect(hidden).toEqual([]);
    expect(errors, 'a chunk that does not come is caught').toEqual([]);
    // the fans stand open, at rest as the stylesheet draws their end
    for (const f of await fans(page)) expect(f.cases[3].left - f.cases[0].left).toBeGreaterThan(f.cases[0].width * 0.7);
    // the picker needs no GSAP: a change is a cut
    await goTo(page, '#glimpse');
    const id = RD_COPY.glimpse.shades[1].id;
    const p = await page.evaluate((id) => { const l = document.querySelector(`.rd-glimpse-dot[data-shade="${id}"]`)!, input = l.querySelector('input'), d = l.querySelector('.rd-glimpse-disc')!.getBoundingClientRect(), y = d.top + d.height / 2; for (let x = d.left + 2; x < d.right - 2; x += 2) if (document.elementFromPoint(x, y) === input) return { x, y }; return null; }, id);
    await page.mouse.move(p!.x, p!.y, { steps: 3 });
    await expect.poll(() => page.locator('.rd-glimpse-radio:checked').inputValue()).toBe(id);
    await expect.poll(() => page.locator('.rd-glimpse-name').textContent()).toBe(byId.get(id)!.name);
    await done(ctx, page);
  });
});
