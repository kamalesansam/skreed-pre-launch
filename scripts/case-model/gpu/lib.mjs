// Shared by the round 6 measurement scripts (docs/specs/family-page.md 24.8; kept here since the hand-off of 2026-11-03): the installed Chrome, headless, on this Mac's own GPU (ANGLE Metal, measured on
// 2026-11-02), never the harness's SwiftShader flags; the worktree's packages by createRequire.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
export const WT = fileURLToPath(new URL('../../../', import.meta.url)).replace(/\/$/, '');   // the repository's root
const require = createRequire(WT + '/package.json');
export const { chromium } = require('@playwright/test');
export const sharp = require('sharp');
export const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8795/').replace(/\/$/, '');
export const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
export const WIDE = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
export const launch = (extra = []) => chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist', ...extra] });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** the family page live on the 3D path (hooks on), the loader gone, the canvas on */
export async function openFamily(page, slug = 'blissful-blue', q = '') {
  await page.goto(`${BASE}/shades/${slug}/?render=force&tier=high${q}`);
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading') && document.querySelector('#st3d canvas.on'), null, { timeout: 180_000, polling: 200 });
  const gpu = await page.evaluate(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  return gpu;
}
export const st = (page) => page.evaluate(() => window.__famStage.state());
export const types = (page) => page.evaluate(() => window.__famStage.types());
export const toScreen = (page, s) => page.evaluate((v) => scrollTo({ top: Math.round(v * innerHeight), behavior: 'instant' }), s);
export const rest = (page, s) => page.waitForFunction((v) => { const x = window.__famStage.state(); return Math.abs(x.sv - v) < 0.005 && x.takeover.phase === 'idle' && !x.busy; }, s, { timeout: 60_000, polling: 100 });
export const settledTypes = (page) => page.waitForFunction(() => { const t = window.__famStage.types(); return t.loaded.length + Object.keys(t.failed).length >= t.listed.length; }, null, { timeout: 120_000, polling: 250 });
/** two frames drawn */
export const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const step = () => (k-- > 0 ? requestAnimationFrame(step) : r()); requestAnimationFrame(step); }), n);
