// node run.mjs <three dir> <assets dir> -> JSON per viewport
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const { chromium } = createRequire('/opt/node-tools/node_modules/')('playwright');
const [threeDir, dataDir] = process.argv.slice(2); const here = path.dirname(url.fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await b.newPage({ viewport: { width: 64, height: 64 } });
await page.route('**/*', r => { const u = new URL(r.request().url());
  if (u.hostname !== 'local.test') return r.abort();
  if (u.pathname === '/') return r.fulfill({ body: fs.readFileSync(path.join(here, 'page.html')), headers: { 'content-type': 'text/html' } });
  if (u.pathname.startsWith('/three/')) return r.fulfill({ body: fs.readFileSync(path.join(threeDir, u.pathname.slice(7))), headers: { 'content-type': 'text/javascript' } });
  if (u.pathname.startsWith('/data/')) return r.fulfill({ body: fs.readFileSync(path.join(dataDir, u.pathname.slice(6))), headers: { 'content-type': 'application/octet-stream' } });
  return r.abort(); });
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('https://local.test/'); await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
const vps = [[390, 844, 1.25], [844, 390, 1.25], [1280, 800, 1.5], [1920, 1080, 1], [2560, 1440, 1]];
for (const [w, h, d] of vps) { const t = Date.now(); const r = await page.evaluate(([w, h, d]) => window.probe(w, h, d), [w, h, d]); r.ms = Date.now() - t; console.log(JSON.stringify(r)); }
if (errs.length) console.log('ERRORS', errs.slice(0, 5));
await b.close();
