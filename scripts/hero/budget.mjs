// The hero's byte budget (CLAUDE.md "Always do", hero.md 6, hero-architecture.md 6.6): gzip sizes of what / loads.
// Reads dist/ (run after a build): the page, its inline scripts and styles, the module scripts and their static
// imports (critical JS), the island chunk and its data (the 3D path), the fonts and the posters. First view per class:
// poster tier = page + Open Sans + the class's AVIF poster; 3D tier = poster tier + every JS chunk + the island's data.
//   node scripts/hero/budget.mjs [dist]
import { readFileSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dist = process.argv[2] || 'dist';
const gz = (p) => gzipSync(readFileSync(p), { level: 9 }).length;
const raw = (p) => statSync(p).size;
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const rows = [];
const add = (group, name, p) => { rows.push({ group, name, raw: raw(p), gz: gz(p) }); };
const inlineScripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
rows.push({ group: 'page', name: 'index.html (whole, with inline CSS and scripts)', raw: Buffer.byteLength(html), gz: gzipSync(html).length });
rows.push({ group: 'page', name: `inline scripts (${inlineScripts.length})`, raw: inlineScripts.reduce((a, s) => a + s.length, 0), gz: inlineScripts.reduce((a, s) => a + gzipSync(s).length, 0) });
rows.push({ group: 'page', name: `inline styles (${inlineStyles.length})`, raw: inlineStyles.reduce((a, s) => a + s.length, 0), gz: inlineStyles.reduce((a, s) => a + gzipSync(s).length, 0) });
// module scripts and their static imports
const seen = new Set();
const jsRefs = (src) => [...src.matchAll(/["'`](\/_astro\/[^"'`]+\.js)["'`]|from\s*["'`](\.\/[^"'`]+\.js)["'`]|import\(["'`](\.\/[^"'`]+\.js)["'`]\)/g)].map((m) => m[1] || ('/_astro/' + (m[2] || m[3]).slice(2)));
const walk = (p, group) => { if (seen.has(p)) return; seen.add(p); const f = join(dist, p); if (!existsSync(f)) return; add(group, p, f); for (const r of jsRefs(readFileSync(f, 'utf8'))) if (!/hero\.[A-Za-z0-9_-]+\.js$/.test(r)) walk(r, group); };
for (const r of jsRefs(html)) walk(r, 'critical js');
// the island chunk (dynamic import from the HeroStage chunk) and its data
const heroChunk = [...new Set(rows.filter((r) => r.group === 'critical js').flatMap((r) => jsRefs(readFileSync(join(dist, r.name), 'utf8'))).filter((r) => /hero\.[A-Za-z0-9_-]+\.js$/.test(r)))];
// the island's data: every hashed file name the chunk carries (Vite emits ?url imports as /_astro/<name>.<hash>.<ext> or as a name resolved against import.meta.url)
for (const h of heroChunk) add('island js', h, join(dist, h));
const dataSeen = new Set();
for (const r of rows.filter((r) => r.group === 'critical js' || r.group === 'island js')) { const src = readFileSync(join(dist, r.name), 'utf8'); for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:webp|bin|json)\b/g)].map((m) => m[0]))) if (!dataSeen.has(d) && !/^(wide|portrait)\./.test(d) && existsSync(join(dist, '_astro', d))) { dataSeen.add(d); add('island data', '/_astro/' + d, join(dist, '_astro', d)); } }
for (const f of [...new Set([...html.matchAll(/href="(\/fonts\/[^"]+)"/g)].map((m) => m[1]))]) add('font', f, join(dist, f));
for (const p of [...new Set([...html.matchAll(/(\/_astro\/(?:wide|portrait)[^"\s,]+)/g)].map((m) => m[1]))]) add('poster', p, join(dist, p));
const sum = (pred) => rows.filter(pred).reduce((a, r) => a + r.gz, 0);
const fmt = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
console.log('group          gz        raw      file');
for (const r of rows) console.log(r.group.padEnd(12), fmt(r.gz), fmt(r.raw), r.name);
const critical = sum((r) => r.group === 'critical js' || r.name.startsWith('inline scripts'));
const totalJs = sum((r) => r.group === 'critical js' || r.group === 'island js' || r.name.startsWith('inline scripts'));
const page = rows[0].gz, openSans = sum((r) => r.group === 'font' && /open-sans/.test(r.name));
const poster = (cls) => sum((r) => r.group === 'poster' && r.name.includes(cls) && r.name.endsWith('.avif'));
const island = sum((r) => r.group === 'island data');
console.log('\nbudget (gzip unless noted; CLAUDE.md: critical JS under 60 KB, total JS under 250 KB, hero image under 120 KB, first view under 1.5 MB)');
console.log(`critical JS (inline scripts + module scripts + static imports): ${fmt(critical)}`);
console.log(`total JS (critical + island chunk):                             ${fmt(totalJs)}`);
for (const cls of ['portrait', 'wide']) {
  console.log(`poster ${cls} (AVIF, raw):                                     ${fmt(poster(cls))}`);
  console.log(`first view, poster tier, ${cls}: page + Open Sans + poster:    ${fmt(page + openSans + poster(cls))}`);
  console.log(`first view, 3D tier, ${cls}: + all JS + island data:           ${fmt(page + openSans + poster(cls) + totalJs + island)}`);
}
