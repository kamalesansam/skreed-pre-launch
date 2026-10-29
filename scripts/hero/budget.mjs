// The hero's byte budget (CLAUDE.md "Always do", hero.md 6, hero-architecture.md 6.6): gzip sizes of what / loads.
// Reads dist/ (run after a build): the page, its inline scripts and styles, the module scripts and their static
// imports (critical JS), the island chunk and its data (the 3D path), the lazy quiz chunk (section 3's deck, fetched
// once the section is within a screen), the fonts and the posters. First view per class: poster tier = page + Open Sans
// + the class's AVIF poster; 3D tier = poster tier + every JS chunk + the island's data. The hero's lines are printed.
// Section 4 (docs/specs/section-4-flux.md 6 and AC8) has its own groups: its lazy chunks (the director's and the walk
// script's, by their markers), the page scroll chunk (section4/scroll.ts, by its marker skreed:scroll), the ten scene
// loops ((cove|grove|ember|palace|dawn)-(wide|portrait).<hash>.mp4), the twenty poster stills (the same stems in AVIF and
// WebP), products.bin, the hall's model, lightmap and stills. Every byte line of its section 6 is a threshold: scripts
// count at gzip, everything else as stored (the bytes a visitor fetches when the edge does not compress them), gzip
// printed beside it for reference. AC8's formats are checked too: each picture in AVIF with its WebP twin and in no other
// format (a scene still, a hall still or a lightmap in JPEG, PNG or GIF is found by its name all the same, and stops the
// build), each scene's <img> with width and height. Any line broken or check failed exits 1 after the whole report. A
// line Sam has still to rule on prints "over, pending Sam" past his figure and stops the build only past the spec's hard
// figure. What it cannot read from a dist (pixel sizes, the loops' tracks, GPU memory) is printed as such. The mode
// (build, test, staging: which npm script made the dist) comes from --mode, else from the environment
// (scripts/room/guards.mjs); npm run build and build:staging pass it.
//   node scripts/hero/budget.mjs [dist] [--mode build|test|staging]
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLASSES, LOOP_NAME, MODE_NAMES, SCENE_IDS, isLandAsset, readMode } from '../room/guards.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const args = process.argv.slice(2);
const dist = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) || 'dist';
let mode;
try { mode = readMode(); } catch (e) { console.error(`budget: ${e.message}`); process.exit(1); }
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
// the island chunk and its own static imports (the bundler may split what the island shares with the section chunks it
// loads, three among it, into a chunk of its own that the island imports: it loads with the island, so it is the island's)
const walkIsland = (p) => { if (seen.has(p)) return; seen.add(p); const f = join(dist, p); if (!existsSync(f)) return; add('island js', p, f); for (const r of jsRefs(readFileSync(f, 'utf8')).stat) walkIsland(r); };
for (const h of heroChunk) walkIsland(h);
// the lazy quiz chunk (quiz.md 6): reached only through an import() from the page's module scripts, never statically and never
// the island; the deck chunk by name, or any such chunk that imports config/quiz. Its own static imports not already counted follow it.
for (const p of [...dynamic].filter((p) => !seen.has(p) && !isHero(p) && existsSync(join(dist, p)))) if (/deck/.test(p) || /config\/quiz/.test(readFileSync(join(dist, p), 'utf8'))) walk(p, 'quiz js (lazy)');

// section 4's lazy chunks (section-4.md 6, section-4-flux.md 5 and 6) as a graph. The entries: the island's own import()
// of the section's director and the page's import() of the walk script, each named the section's by its bridge names
// (they survive minification). Everything they import in turn, statically or by import(), is the section's too unless the
// page, the island or the quiz counted it first. The page scroll chunk is the island's other import(), named by its
// marker skreed:scroll; it is counted on its own line and in the total, never in the section's script.
const isRoom = (p) => /skreed:room|__skreedRoom|__skreedRoomFrame/.test(readFileSync(join(dist, p), 'utf8'));
const isScroll = (p) => /skreed:scroll/.test(readFileSync(join(dist, p), 'utf8'));
const usable = (p) => !seen.has(p) && !isHero(p) && existsSync(join(dist, p));
const islandDyn = new Set(heroChunk.flatMap((h) => jsRefs(readFileSync(join(dist, h), 'utf8')).dyn));
const scrollRoots = [...islandDyn].filter((p) => usable(p) && isScroll(p) && !isRoom(p));
const roomRoots = [...new Set([...islandDyn, ...dynamic])].filter((p) => usable(p) && isRoom(p));
const pageRoots = roomRoots.filter((p) => dynamic.has(p) && !islandDyn.has(p));
const astroFiles = existsSync(join(dist, '_astro')) ? readdirSync(join(dist, '_astro')) : [];
const graph = new Map(), scrollGraph = new Map();
const grow = (roots, into, skip = new Set()) => { for (const q = [...roots]; q.length;) { const p = q.shift(); if (into.has(p) || skip.has(p) || !usable(p)) continue; const refs = jsRefs(readFileSync(join(dist, p), 'utf8')); into.set(p, refs); q.push(...refs.stat, ...refs.dyn); } };
grow(scrollRoots, scrollGraph);
grow(roomRoots, graph, new Set(scrollGraph.keys()));
for (const p of scrollGraph.keys()) add('scroll js (lazy)', p, join(dist, p));
for (const p of graph.keys()) add('room js (lazy)', p, join(dist, p));

// section 4's files. By name in dist/_astro: the scene loops and stills (the ten stems of section 3), products.bin, the
// hall's model, lightmap and stills. A picture is found by its name in any image format (IMG), so one in a format AC8
// does not allow is counted and refused rather than missed. The rest of what the section's chunks name stays "room data".
const H = '[A-Za-z0-9_-]+', IMG = 'avif|webp|jpe?g|png|gif';
const SCENE = new RegExp(`^(${SCENE_IDS.join('|')})-(${CLASSES.join('|')})\\.${H}\\.(${IMG})$`);
const STILL = new RegExp(`^hall-(portrait|wide)\\.${H}\\.(${IMG})$`);
const HALL_MODEL = new RegExp(`^hall\\.${H}\\.(?:bin|glb)$`), HALL_LIGHT = new RegExp(`^hall-lightmap\\.${H}\\.(${IMG})$`), PRODUCTS = new RegExp(`^products\\.${H}\\.bin$`);
/** the formats a picture may ship in (AC8), and a name's extension as the format key (jpg and jpeg alike) */
const SHIPS = new Set(['avif', 'webp']);
const fmtOf = (ext) => ext.toLowerCase().replace(/^jpg$/, 'jpeg');
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? files(join(dir, d.name)) : [join(dir, d.name)]);
const room = [];   // { group, name, stored, kind fields }
const addFile = (group, p, extra) => { const name = '/' + relative(dist, p); add(group, name, p); room.push({ group, name, stored: raw(p), ...extra }); };
for (const n of astroFiles) {
  const p = join(dist, '_astro', n);
  let m;
  if ((m = LOOP_NAME.exec(n))) addFile('room loop', p, { id: m[1], cls: m[2] });
  else if ((m = SCENE.exec(n))) addFile('room scene', p, { id: m[1], cls: m[2], fmt: fmtOf(m[3]) });
  else if ((m = STILL.exec(n))) addFile('room still', p, { cls: m[1], fmt: fmtOf(m[2]) });
  else if (HALL_MODEL.test(n)) addFile('room data', p, { hall: 'model' });
  else if ((m = HALL_LIGHT.exec(n))) addFile('room data', p, { hall: 'light', fmt: fmtOf(m[1]) });
  else if (PRODUCTS.test(n)) addFile('room data', p, { products: true });
  else if (isLandAsset(n)) addFile('room stray', p, { stray: true });
}
// a video anywhere else in dist, or a stray asset: counted so the guard's hit shows here too
for (const p of files(dist).filter((f) => /\.mp4$/i.test(f) && !LOOP_NAME.test(basename(f)))) addFile('room stray', p, { stray: true });
// the rest of what the section's chunks name (counted as stored)
for (const p of graph.keys()) {
  const src = readFileSync(join(dist, p), 'utf8');
  for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:bin|glb|avif|webp)\b/g)].map((m) => m[0]))) if (existsSync(join(dist, '_astro', d)) && !rows.some((x) => x.name.endsWith('/' + d))) add('room data', '/_astro/' + d, join(dist, '_astro', d));
}

const dataSeen = new Set();
for (const r of rows.filter((r) => r.group === 'critical js' || r.group === 'island js')) { const src = readFileSync(join(dist, r.name), 'utf8'); for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:webp|bin|json)\b/g)].map((m) => m[0]))) if (!dataSeen.has(d) && !/^(wide|portrait)\./.test(d) && existsSync(join(dist, '_astro', d))) { dataSeen.add(d); add('island data', '/_astro/' + d, join(dist, '_astro', d)); } }
for (const f of [...new Set([...html.matchAll(/href="(\/fonts\/[^"]+)"/g)].map((m) => m[1]))]) add('font', f, join(dist, f));
// the hero's posters only, wide.<hash> and portrait.<hash> in AVIF and WebP: never a land (land-<id>-portrait.*), a still
// (hall-portrait.*) or anything else with the word in its name
for (const p of [...new Set([...html.matchAll(/(\/_astro\/(?:wide|portrait)\.[A-Za-z0-9_-]+\.(?:avif|webp))\b/g)].map((m) => m[1]))]) add('poster', p, join(dist, p));
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
console.log('\nbudget (gzip unless noted; CLAUDE.md: critical JS under 60 KB, total JS under 250 KB, hero image under 120 KB, first view under 1.5 MB)');
console.log(`critical JS (inline scripts + module scripts + static imports): ${fmt(critical)}`);
console.log(`quiz JS (lazy chunk, fetched within a screen of section 3):     ${fmt(quizJs)}`);
console.log(`total JS (critical + island chunk + lazy quiz chunk):           ${fmt(totalJs)}`);
for (const cls of ['portrait', 'wide']) {
  console.log(`poster ${cls} (AVIF, raw):                                     ${fmt(poster(cls))}`);
  console.log(`first view, poster tier, ${cls}: page + Open Sans + poster:    ${fmt(page + openSans + poster(cls))}`);
  console.log(`first view, 3D tier, ${cls}: + all JS + island data:           ${fmt(page + openSans + poster(cls) + totalJs + island)}`);
}

// ---- section 4's lines (section-4-flux.md 6), each a threshold ----
const KB = 1024, tune = mode === 'staging';
const BUILD = MODE_NAMES[mode];
const gzOf = (map) => rows.filter((r) => map.has(r.name)).reduce((a, r) => a + r.gz, 0);
const reach = (roots, staticOnly) => { const out = new Set(); for (const q = [...roots]; q.length;) { const p = q.shift(); if (out.has(p) || !graph.has(p)) continue; out.add(p); const { stat, dyn } = graph.get(p); q.push(...stat, ...(staticOnly ? [] : dyn)); } return out; };
const roomScript = gzOf(graph), scrollScript = gzOf(scrollGraph);
const posterScript = gzOf(reach(pageRoots, true));
const storedOf = (pred) => room.filter(pred).reduce((a, f) => a + f.stored, 0);
const maxOf = (pred) => room.filter(pred).reduce((a, f) => Math.max(a, f.stored), 0);
const hallModel = storedOf((f) => f.hall === 'model'), hallLight = (fmt) => storedOf((f) => f.hall === 'light' && f.fmt === fmt), productsBin = storedOf((f) => f.products);
const loop = (id, cls) => maxOf((f) => f.group === 'room loop' && f.id === id && f.cls === cls);
const pic = (id, cls, fmt) => maxOf((f) => f.group === 'room scene' && f.id === id && f.cls === cls && f.fmt === fmt);
const still = (cls, fmt) => maxOf((f) => f.group === 'room still' && f.cls === cls && f.fmt === fmt);
// the scenes in the poster column's order (the page names them in ROOM_SCENES' order), scene 1 first; a scene with no
// file in dist stays in the order at 0 bytes, so a missing loop or still reads as such on its line
const htmlOrder = [...new Set([...html.matchAll(new RegExp(`\\b(${SCENE_IDS.join('|')})-(?:portrait|wide)\\.`, 'g'))].map((m) => m[1]))];
const scenes = [...htmlOrder, ...SCENE_IDS.filter((id) => !htmlOrder.includes(id))];
const scene1 = scenes[0];
const FMT = { avif: 'AVIF', webp: 'WebP', jpeg: 'JPEG', png: 'PNG', gif: 'GIF' };

const lines = [], faults = [];
// pendingKB: Sam's figure for a line he has still to rule on; past it the line prints "over, pending Sam", and only past
// limitKB (the spec's hard figure) does it stop the build
const line = (name, bytes, limitKB, { enforced = true, note = '', pendingKB = 0 } = {}) => lines.push({ name, bytes, limit: limitKB * KB, pending: pendingKB * KB, enforced, note });
line("section 4's script (director, carousel, video, assets, walk, lazy; gzip)", roomScript, 38, { pendingKB: 30, note: "Sam's 30 KB line, pending him (spec 11, item 1); the build stops above the spec's 38 KB" });
line('scroll.ts (its own chunk, marker skreed:scroll; gzip)', scrollScript, 4, { note: 'counted in total JS, not critical JS' });
line('total JS with section 4 and scroll.ts (gzip)', totalJs + roomScript + scrollScript, 250, { enforced: !tune, note: tune ? "production's line; this staging build carries Tune" : 'production' });
line('section 4 on the poster tier: its script (gzip)', posterScript, 8.5);
// each loop, each still, products.bin
const PIC = { wide: { avif: 110, webp: 176 }, portrait: { avif: 80, webp: 128 } };
for (const id of scenes) for (const cls of CLASSES) line(`loop ${id}, ${cls} (${cls === 'wide' ? '1328 x 692' : '720 x 1280'}, 5.0 s)`, loop(id, cls), 1200, { note: loop(id, cls) ? '' : 'not in this build' });
for (const f of room.filter((x) => x.group === 'room scene' && SHIPS.has(x.fmt))) line(`still ${f.id}: ${f.cls}, ${FMT[f.fmt]}`, f.stored, PIC[f.cls][f.fmt], { note: f.name });
line('products.bin', productsBin, 1000, { note: productsBin ? 'u16 positions, i8 normals, u16 indices; the AirPods Max at full detail since 2026-10-26' : 'not in this build' });
// to the press (script excluded): products.bin, scene 1's loop and still, hall.bin and its lightmap, per class and format
for (const fmt of ['avif', 'webp']) for (const cls of CLASSES) {
  line(`to the press, ${cls}, ${fmt === 'avif' ? 'AVIF' : 'WebP-only browsers'} (script excluded)`, productsBin + loop(scene1, cls) + pic(scene1, cls, fmt) + hallModel + hallLight(fmt), 2500, { note: `scene 1 is ${scene1}; products.bin carries the AirPods Max at full detail` });
}
// the whole section in dist: the ten loops, the twenty stills, products.bin, the hall (its model, lightmap and stills in both formats)
line('the whole section in dist', storedOf((f) => f.group === 'room loop' || f.group === 'room scene' || f.group === 'room still' || !!f.hall || !!f.products), 15800, { note: `${room.filter((f) => f.group === 'room loop').length} loop(s), ${room.filter((f) => f.group === 'room scene').length} still(s)` });
// one visit, per class and format: the class's five loops and five stills, products.bin, the hall
for (const fmt of ['avif', 'webp']) for (const cls of CLASSES) {
  const bytes = scenes.reduce((a, id) => a + loop(id, cls) + pic(id, cls, fmt), 0) + productsBin + hallModel + hallLight(fmt);
  line(`one visit, ${cls}, ${FMT[fmt]}`, bytes, 8100);
}
// the poster tier: the hall's still and the five scene stills, one class, one format
const POSTER = { avif: { portrait: 420, wide: 570 }, webp: { portrait: 660, wide: 900 } };
for (const fmt of ['avif', 'webp']) for (const cls of CLASSES) line(`the poster tier, ${cls}, ${FMT[fmt]}: the hall's still and the five scenes`, still(cls, fmt) + scenes.reduce((a, id) => a + pic(id, cls, fmt), 0), POSTER[fmt][cls]);
// AC8's formats. Each picture of the section ships as AVIF with its WebP twin, by the name before the hash: the scene
// stills, the hall's stills and its lightmap. Each <img> in the page that names a scene still (its own src or srcset, or a
// <source> of its <picture>) carries width and height.
const stemOf = (name) => basename(name).replace(new RegExp(`\\.${H}\\.(?:${IMG})$`, 'i'), '');
const pics = room.filter((f) => ['room scene', 'room still'].includes(f.group) || f.hall === 'light');
const byStem = new Map();
for (const f of pics) {
  // a picture in any other format is refused, and kept out of the lines and the twin check (AC8: AVIF with WebP only)
  if (!SHIPS.has(f.fmt)) { faults.push(`${basename(f.name)}: ${FMT[f.fmt] ?? f.fmt} is not a format the section ships (AC8: each picture AVIF with its WebP twin)`); continue; }
  byStem.set(stemOf(f.name), new Set([...(byStem.get(stemOf(f.name)) ?? []), f.fmt]));
}
for (const [stem, fmts] of byStem) for (const [has, lacks] of [['avif', 'webp'], ['webp', 'avif']]) if (fmts.has(has) && !fmts.has(lacks)) faults.push(`${stem}: ${FMT[has]} without its ${FMT[lacks]} twin (AC8: the pictures are AVIF with WebP)`);
for (const f of room.filter((x) => x.stray)) faults.push(`${basename(f.name)}: not a file the section ships (the ten loops, their stills, products.bin and the hall)`);
const SCENE_REF = new RegExp(`(?:${SCENE_IDS.join('|')})-(?:portrait|wide)\\.${H}\\.(?:${IMG})`, 'i');
const sized = (img) => /\swidth=/.test(img) && /\sheight=/.test(img);
let sceneImgs = 0;
const pictureBlocks = [...html.matchAll(/<picture\b[\s\S]*?<\/picture>/g)].map((m) => m[0]);
for (const block of pictureBlocks.filter((b) => SCENE_REF.test(b))) {
  const img = block.match(/<img\b[^>]*>/)?.[0];
  sceneImgs++;
  if (!img || !sized(img)) faults.push(`a <picture> of ${block.match(SCENE_REF)[0]}: its <img> has no width and height (AC8)`);
}
for (const img of [...html.replace(/<picture\b[\s\S]*?<\/picture>/g, '').matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((t) => SCENE_REF.test(t))) {
  sceneImgs++;
  if (!sized(img)) faults.push(`an <img> of ${img.match(SCENE_REF)[0]} has no width and height (AC8)`);
}

// the first view: the section's markup as built (its noscript copies included) and room.css, minified from the source here
// because the build inlines it into the one stylesheet with every other section's
const at = html.search(/<section\b[^>]*\bid="room"/);
let markup = '';
if (at >= 0) { const re = /<\/?section\b[^>]*>/g; re.lastIndex = at; let d = 0; for (let m; (m = re.exec(html));) { d += m[0][1] === '/' ? -1 : 1; if (!d) { markup = html.slice(at, re.lastIndex); break; } } }
const cssPath = join(ROOT, 'src/styles/room.css');
const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}') : '';
line("the first view: section 4's markup and room.css (gzip)", gzipSync(markup + css, { level: 9 }).length, 4, { note: `markup ${markup.length} B, room.css about ${css.length} B` });

console.log(`\nsection 4 (section-4-flux.md 6; the ${BUILD}; scripts at gzip, everything else as stored; KB = 1024 B)`);
const PENDING = 'over, pending Sam';
for (const l of lines) {
  const over = l.bytes > l.limit, waits = !over && l.pending > 0 && l.bytes > l.pending;
  const status = over ? (l.enforced ? 'OVER' : 'over') : waits ? PENDING : 'ok';
  const tail = [l.note, over && !l.enforced ? 'not enforced here' : ''].filter(Boolean).join('; ');
  console.log(`  ${status.padEnd(PENDING.length)} ${fmt(l.bytes)} of ${fmt(over ? l.limit : l.pending || l.limit)}  ${l.name}${tail ? `  (${tail})` : ''}`);
}
console.log(`  ${(faults.length ? 'FAIL' : 'ok').padEnd(PENDING.length)} formats: ${byStem.size} picture(s) by name, AVIF with WebP; ${sceneImgs} scene <img> in the page, with width and height`);
for (const f of faults) console.log(`  ${''.padEnd(PENDING.length)} ${f}`);
console.log("  not measured here: the pixel sizes (the loops 1328 x 692 and 720 x 1280, the stills 1280 x 666 and 720 x 1280, the 1024 px lightmap), the loops' length (5.0 s), frames (120), codec (H.264 High) and missing audio track (tests/unit/room-flux.test.ts reads them), the GPU memory (the review reads __s4.state().memory), the frame cost (the probe), the Higgsfield credits (the ledger), the cloud (generated, 0 B)");
const broken = lines.filter((l) => l.enforced && l.bytes > l.limit), waiting = lines.filter((l) => l.bytes <= l.limit && l.pending > 0 && l.bytes > l.pending);
const pendingNote = waiting.length ? `; ${waiting.length} over Sam's figure, pending him: ${waiting.map((l) => `${l.name} at ${fmt(l.bytes).trim()} against his ${fmt(l.pending).trim()}`).join(', ')}` : '';
if (broken.length || faults.length) {
  console.error(`\nbudget: section-4-flux.md 6 and AC8 do not hold:\n${[...broken.map((l) => `  ${l.name}: ${fmt(l.bytes).trim()} over ${fmt(l.limit).trim()}`), ...faults.map((f) => `  ${f}`)].join('\n')}${pendingNote ? `\n(and${pendingNote.slice(1)})` : ''}`);
  process.exit(1);
}
console.log(`\nbudget: every enforced line of section-4-flux.md 6 holds (${lines.filter((l) => l.enforced).length} enforced) and AC8's formats check${pendingNote}`);
