// Generic headless runner for the study pages in this folder.
// Serves: https://local.test/<file in scripts/>, https://local.test/files/<path under $LOCALFILES>,
// three r165 from the proto node_modules at https://cdn.jsdelivr.net/npm/three@0.165.0/... (repo copy: the reference-site routes were removed).
// Everything else is aborted.
// Usage: node run-page.mjs <page.html> "<query>" <out.png|-> [--vp 390x844] [--dpr 2] [--save-b64 <file>] [--json <file>]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const S = '/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const THREE165 = S + '/proto/node_modules/three';
const [pageFile, query, outPng] = process.argv.slice(2);
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const [vw, vh] = arg('--vp', '1200x520').split('x').map(Number);
const dpr = +arg('--dpr', '1');
const saveB64 = arg('--save-b64', null);
const jsonOut = arg('--json', null);
const LOCALFILES = process.env.LOCALFILES || '';
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.gltf': 'model/gltf+json', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.json': 'application/json' };
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
await ctx.route('**/*', async (r) => {
  const u = new URL(r.request().url());
  let p = null;
  if (u.hostname === 'local.test') p = u.pathname.startsWith('/files/') && LOCALFILES ? path.join(LOCALFILES, decodeURIComponent(u.pathname.slice(7))) : path.join(HERE, u.pathname);
  else if (u.hostname === 'cdn.jsdelivr.net' && u.pathname.startsWith('/npm/three@0.165.0/')) p = path.join(THREE165, u.pathname.replace('/npm/three@0.165.0/', ''));
  if (p && fs.existsSync(p) && fs.statSync(p).isFile()) return r.fulfill({ body: fs.readFileSync(p), headers: { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'access-control-allow-origin': '*' } });
  console.error('blocked', u.href.slice(0, 140));
  return r.abort();
});
const page = await ctx.newPage();
const log = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text().slice(0, 240)); });
page.on('pageerror', (e) => log.push('ERR ' + String(e).slice(0, 240)));
await page.goto(`https://local.test/${pageFile}?${query}`);
await page.waitForFunction(() => window.__status && window.__status !== 'loading', null, { timeout: 300000 });
const res = await page.evaluate(() => ({ status: window.__status, info: window.__info || null }));
if (saveB64) { const b64 = await page.evaluate(() => window.__b64); fs.writeFileSync(saveB64, Buffer.from(b64, 'base64')); res.saved = saveB64; }
if (outPng && outPng !== '-') await page.screenshot({ path: outPng });
res.log = log;
console.log(JSON.stringify(res));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(res, null, 1));
await b.close();
