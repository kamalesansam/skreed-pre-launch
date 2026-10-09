// The family page's byte budget on its 3D path (docs/specs/family-page.md 6; acceptance 8), measured on a built dist/.
//   node scripts/case-model/budget.mjs [dist dir] [slug]
// Follows the page's module scripts and every chunk they import, statically or dynamically (the island path), sums
// gzip and brotli sizes, adds the model and poster bytes, and checks: page module 12 KB, lazy island 160 KB, total JS
// on the page 250 KB (gzip; PostHog and the beacon are not on the site yet and are listed as headroom), LOD1 60 KB and
// LOD0 150 KB raw, posters 80 KB (phone) and 110 KB (wide), and that "Show in 3D, {size} MB" in the HTML equals the
// measured island plus model bytes, one decimal. Exit 1 on any miss.
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';

const DIST = resolve(process.argv[2] || 'dist');
const slug = process.argv[3] || 'blissful-blues';
const html = readFileSync(join(DIST, 'shades', slug, 'index.html'), 'utf8');
const gz = (b) => gzipSync(b, { level: 9 }).length;
const br = (b) => brotliCompressSync(b, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const entries = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const seen = new Map();
function walk(url, via) {
  if (seen.has(url)) return;
  const file = join(DIST, url);
  if (!existsSync(file)) { console.error(`missing chunk ${url}`); process.exitCode = 1; return; }
  const b = readFileSync(file);
  seen.set(url, { raw: b.length, gz: gz(b), br: br(b), via });
  const src = b.toString('utf8');
  for (const m of src.matchAll(/(?:import\(|from|import)\s*["'`](\.\/[^"'`$]+\.js)["'`]/g)) walk(new URL(m[1], `http://x${url}`).pathname, url);
}
for (const e of entries) walk(e, 'page');
const rows = [...seen.entries()].map(([u, v]) => ({ u, ...v }));
const sum = (f, k = 'gz') => rows.filter(f).reduce((s, r) => s + r[k], 0);
const page = sum((r) => /FamilyPage/.test(r.u));
const islandSet = (r) => !/FamilyPage/.test(r.u) && !/^\/_astro\/(bus|timing|motion)\./.test(r.u);
const island = sum(islandSet);
const total = sum(() => true);
const totalBr = sum(() => true, 'br');
console.log('| chunk | raw B | gzip B | brotli B |\n|---|---:|---:|---:|');
for (const r of rows.sort((a, b) => b.gz - a.gz)) console.log(`| ${r.u} | ${r.raw} | ${r.gz} | ${r.br} |`);
const manifest = JSON.parse(readFileSync(resolve(DIST, '..', 'src/data/case-model.json'), 'utf8'));
const lod = [manifest.lod0, manifest.lod1].map((p) => readFileSync(join(DIST, p)).length);
const posters = [...html.matchAll(/srcset="([^" ]+\.(?:avif|webp))[^"]*"/g)].map((m) => [m[1], readFileSync(join(DIST, m[1])).length]);
const shown = html.match(/Show in 3D, ([\d.]+) MB/)?.[1] ?? null;
const measured = ((island + lod[0] + lod[1]) / 1e6).toFixed(1);
const checks = [
  ['page module (gzip)', page, 12_000],
  ['lazy 3D island, every chunk past the page module (gzip)', island, 160_000],
  ['total JS on the page, 3D path (gzip)', total, 250_000],
  ['LOD1 raw', lod[1], 60_000],
  ['LOD0 raw', lod[0], 150_000],
  ...posters.map(([u, n]) => [`poster ${u}`, n, /phone/.test(u) ? 80_000 : 110_000]),
];
let bad = false;
console.log('\n| budget | measured B | limit B | |\n|---|---:|---:|---|');
for (const [what, n, lim] of checks) { const ok = n <= lim; bad ||= !ok; console.log(`| ${what} | ${n.toLocaleString('en')} | ${lim.toLocaleString('en')} | ${ok ? 'PASS' : 'FAIL'} |`); }
console.log(`\ntotal JS brotli ${totalBr.toLocaleString('en')} B; headroom to 250 KB gzip for PostHog and the beacon: ${(250_000 - total).toLocaleString('en')} B`);
console.log(`"Show in 3D" size: HTML ${shown ?? '(none)'} MB, measured island + LODs ${measured} MB (gzip JS ${island} + LOD0 ${lod[0]} + LOD1 ${lod[1]})`);
if (shown !== null && shown !== measured) { bad = true; console.log('FAIL: update ISLAND_JS_BYTES in src/scripts/family/size3d.ts'); }
const first = total + lod[1] + (posters.find(([u]) => /phone.*avif/.test(u))?.[1] ?? 0);
console.log(`first view, phone (JS gzip + LOD1 + phone AVIF poster, before HTML, CSS and fonts): ${first.toLocaleString('en')} B against 450 KB`);
process.exit(bad || process.exitCode ? 1 : 0);
