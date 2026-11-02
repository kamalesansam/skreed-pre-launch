// Lighthouse (CHECKLIST C4; hero.md D23's run) through a Playwright-launched headless Chrome: chrome-launcher hangs on
// the Windows machine (2026-10-26, no output in ten minutes), so the browser is launched here with a debugging port and
// the Lighthouse CLI connects to it. Three mobile runs (the mobile preset: simulated throttling, the mobile screen)
// against a served production build, the scores and the metrics printed, and the median. The poster tier is what
// headless Chrome gets (SwiftShader fails the hero's performance caveat), as hero.md D23 records.
//   node scripts/signup/lighthouse.mjs [url=http://127.0.0.1:8790/] [--out <dir>] [--runs 3]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:8790/';
const oi = args.indexOf('--out'), out = oi >= 0 ? args[oi + 1] : 'test-results/lighthouse';
const ri = args.indexOf('--runs'), runs = ri >= 0 ? Number(args[ri + 1]) : 3;
const repo = fileURLToPath(new URL('../../', import.meta.url));
const port = 9333;
mkdirSync(out, { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: [`--remote-debugging-port=${port}`, '--no-sandbox', '--disable-gpu'] }); console.log('browser: the installed Chrome'); }
catch { browser = await chromium.launch({ headless: true, args: [`--remote-debugging-port=${port}`, '--no-sandbox', '--disable-gpu'] }); console.log("browser: Playwright's Chromium"); }
const rows = [];
for (let i = 1; i <= runs; i++) {
  const file = join(out, `run${i}.json`);
  const r = spawnSync(process.execPath, [join(repo, 'node_modules/lighthouse/cli/index.js'), url, `--port=${port}`, '--only-categories=performance', '--form-factor=mobile', '--throttling-method=simulate', '--output=json', `--output-path=${file}`, '--quiet'], { encoding: 'utf8', timeout: 240_000, cwd: repo });
  if (r.status !== 0 || !existsSync(file)) { console.log(`run ${i}: lighthouse exited ${r.status} ${r.signal ?? ''}\n${(r.stderr || r.stdout || '').slice(-600)}`); continue; }
  const j = JSON.parse(readFileSync(file, 'utf8')), a = j.audits;
  const lcpItem = a['largest-contentful-paint-element']?.details?.items?.[0];
  const row = { run: i, perf: Math.round(j.categories.performance.score * 100), lcp: a['largest-contentful-paint'].displayValue, fcp: a['first-contentful-paint'].displayValue, tbt: a['total-blocking-time'].displayValue, si: a['speed-index'].displayValue, cls: a['cumulative-layout-shift'].displayValue, lcpEl: lcpItem?.items?.[0]?.node?.selector ?? lcpItem?.node?.selector ?? '' };
  rows.push(row);
  console.log(`run ${i}: performance ${row.perf}, LCP ${row.lcp}, FCP ${row.fcp}, TBT ${row.tbt}, SI ${row.si}, CLS ${row.cls}, LCP element ${row.lcpEl}`);
}
await browser.close();
if (rows.length) { const perf = rows.map((r) => r.perf).sort((a, b) => a - b); console.log(`median performance of ${rows.length}: ${perf[Math.floor(perf.length / 2)]} (lighthouse ${JSON.parse(readFileSync(join(repo, 'node_modules/lighthouse/package.json'), 'utf8')).version})`); }
