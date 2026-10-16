// The hero's byte budget (CLAUDE.md "Always do", hero.md 6, hero-architecture.md 6.6): gzip sizes of what / loads.
// Reads dist/ (run after a build): the page, its inline scripts and styles, the module scripts and their static
// imports (critical JS), the island chunk and its data (the 3D path), the lazy quiz chunk (section 3's deck, fetched
// once the section is within a screen), the fonts and the posters. First view per class: poster tier = page + Open Sans
// + the class's AVIF poster; 3D tier = poster tier + every JS chunk + the island's data.
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
// module scripts and their static imports. A script's references: static (the page's src=, a quoted /_astro/ path, from "./x.js")
// and dynamic (import("./x.js")); the walk follows the static ones and notes the dynamic ones (the island chunk, the lazy section chunks).
const seen = new Set(), dynamic = new Set();
const isHero = (p) => /hero\.[A-Za-z0-9_-]+\.js$/.test(p);
const jsRefs = (src) => { const stat = [], dyn = []; for (const m of src.matchAll(/["'`](\/_astro\/[^"'`]+\.js)["'`]|from\s*["'`](\.\/[^"'`]+\.js)["'`]|import\(\s*["'`](\.\/[^"'`]+\.js)["'`]\s*\)/g)) { if (m[3]) dyn.push('/_astro/' + m[3].slice(2)); else stat.push(m[1] || '/_astro/' + m[2].slice(2)); } return { stat, dyn }; };
const walk = (p, group) => { if (seen.has(p)) return; seen.add(p); const f = join(dist, p); if (!existsSync(f)) return; add(group, p, f); const { stat, dyn } = jsRefs(readFileSync(f, 'utf8')); for (const r of dyn) dynamic.add(r); for (const r of stat) if (!isHero(r)) walk(r, group); };
for (const r of jsRefs(html).stat) walk(r, 'critical js');
// the island chunk (dynamic import from the HeroStage chunk) and its data
const heroChunk = [...new Set(rows.filter((r) => r.group === 'critical js').flatMap((r) => { const { stat, dyn } = jsRefs(readFileSync(join(dist, r.name), 'utf8')); return [...stat, ...dyn]; }).filter(isHero))];
// the island's data: every hashed file name the chunk carries (Vite emits ?url imports as /_astro/<name>.<hash>.<ext> or as a name resolved against import.meta.url)
for (const h of heroChunk) add('island js', h, join(dist, h));
// the lazy quiz chunk (quiz.md 6): reached only through an import() from the page's module scripts, never statically and never
// the island; the deck chunk by name, or any such chunk that imports config/quiz. Its own static imports not already counted follow it.
for (const p of [...dynamic].filter((p) => !seen.has(p) && !isHero(p) && existsSync(join(dist, p)))) if (/deck/.test(p) || /config\/quiz/.test(readFileSync(join(dist, p), 'utf8'))) walk(p, 'quiz js (lazy)');
// section 4's lazy chunks (section-4.md 6): the island's own import() of the section's director (it imports the universe
// in turn) and the walk script (an import() from the page's module scripts); their static imports not already counted
// follow them. A chunk is the section's when it carries the section's bridge names, which survive minification.
const isRoom = (p) => /skreed:room|__skreedRoom|__skreedRoomFrame/.test(readFileSync(join(dist, p), 'utf8'));
// the entry chunks must carry the names; what they import in turn (the universe, the case loader) is the section's too
const roomQueue = [...heroChunk.flatMap((h) => jsRefs(readFileSync(join(dist, h), 'utf8')).dyn), ...dynamic].map((p) => ({ p, entry: true }));
while (roomQueue.length) {
  const { p, entry } = roomQueue.shift();
  if (seen.has(p) || isHero(p) || !existsSync(join(dist, p)) || (entry && !isRoom(p))) continue;
  const before = rows.length; walk(p, 'room js (lazy)');
  for (const r of rows.slice(before)) roomQueue.push(...jsRefs(readFileSync(join(dist, r.name), 'utf8')).dyn.map((d) => ({ p: d, entry: false })));
}
// the section's data: the models and the lightmaps its chunks name (one lightmap format is fetched: AVIF where it decodes,
// so the WebP twins are listed but not summed), and the family page's case model it shares (public/models)
for (const r of rows.filter((x) => x.group === 'room js (lazy)')) {
  const src = readFileSync(join(dist, r.name), 'utf8');
  for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:glb|avif|webp)\b/g)].map((m) => m[0]))) if (existsSync(join(dist, '_astro', d)) && !rows.some((x) => x.name.endsWith(d))) add(d.endsWith('.webp') ? 'room data (webp, unsummed)' : 'room data', '/_astro/' + d, join(dist, '_astro', d));
  for (const d of new Set([...src.matchAll(/\/models\/(?:case\.lod1|wallet|airpods|lenskin)\.[a-f0-9]+\.glb/g)].map((m) => m[0]))) if (existsSync(join(dist, d)) && !rows.some((x) => x.name === d)) rows.push({ group: 'room data', name: d, raw: raw(join(dist, d)), gz: raw(join(dist, d)) });
}
const dataSeen = new Set();
for (const r of rows.filter((r) => r.group === 'critical js' || r.group === 'island js')) { const src = readFileSync(join(dist, r.name), 'utf8'); for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:webp|bin|json)\b/g)].map((m) => m[0]))) if (!dataSeen.has(d) && !/^(wide|portrait)\./.test(d) && existsSync(join(dist, '_astro', d))) { dataSeen.add(d); add('island data', '/_astro/' + d, join(dist, '_astro', d)); } }
for (const f of [...new Set([...html.matchAll(/href="(\/fonts\/[^"]+)"/g)].map((m) => m[1]))]) add('font', f, join(dist, f));
for (const p of [...new Set([...html.matchAll(/(\/_astro\/(?:wide|portrait)[^"\s,]+)/g)].map((m) => m[1]))]) add('poster', p, join(dist, p));
const sum = (pred) => rows.filter(pred).reduce((a, r) => a + r.gz, 0);
const fmt = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
console.log('group            gz        raw      file');
for (const r of rows) console.log(r.group.padEnd(14), fmt(r.gz), fmt(r.raw), r.name);
const critical = sum((r) => r.group === 'critical js' || r.name.startsWith('inline scripts'));
const quizJs = sum((r) => r.group === 'quiz js (lazy)');
const totalJs = sum((r) => r.group === 'critical js' || r.group === 'island js' || r.group === 'quiz js (lazy)' || r.name.startsWith('inline scripts'));
const page = rows[0].gz, openSans = sum((r) => r.group === 'font' && /open-sans/.test(r.name));
const poster = (cls) => sum((r) => r.group === 'poster' && r.name.includes(cls) && r.name.endsWith('.avif'));
const island = sum((r) => r.group === 'island data');
const roomJs = sum((r) => r.group === 'room js (lazy)'), roomData = sum((r) => r.group === 'room data');
console.log('\nbudget (gzip unless noted; CLAUDE.md: critical JS under 60 KB, total JS under 250 KB, hero image under 120 KB, first view under 1.5 MB)');
console.log(`critical JS (inline scripts + module scripts + static imports): ${fmt(critical)}`);
console.log(`quiz JS (lazy chunk, fetched within a screen of section 3):     ${fmt(quizJs)}`);
console.log(`total JS (critical + island chunk + lazy quiz chunk):           ${fmt(totalJs)}`);
console.log(`room JS (section 4's lazy chunks; its line is 30 KB):             ${fmt(roomJs)}`);
console.log(`room data (models as stored, AVIF lightmaps, the case model):    ${fmt(roomData)}`);
console.log(`section 4 on the 3D tier, lazy (its line is 275 KB):             ${fmt(roomJs + roomData)}`);
console.log(`total JS with section 4:                                         ${fmt(totalJs + roomJs)}`);
for (const cls of ['portrait', 'wide']) {
  console.log(`poster ${cls} (AVIF, raw):                                     ${fmt(poster(cls))}`);
  console.log(`first view, poster tier, ${cls}: page + Open Sans + poster:    ${fmt(page + openSans + poster(cls))}`);
  console.log(`first view, 3D tier, ${cls}: + all JS + island data:           ${fmt(page + openSans + poster(cls) + totalJs + island)}`);
}
