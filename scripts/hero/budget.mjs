// The hero's byte budget (CLAUDE.md "Always do", hero.md 6, hero-architecture.md 6.6): gzip sizes of what / loads.
// Reads dist/ (run after a build): the page, its inline scripts and styles, the module scripts and their static
// imports (critical JS), the island chunk and its data (the 3D path), the lazy quiz chunk (section 3's deck, fetched
// once the section is within a screen), the fonts and the posters. First view per class: poster tier = page + Open Sans
// + the class's AVIF poster; 3D tier = poster tier + every JS chunk + the island's data. The hero's lines are printed.
// Section 4 (docs/specs/section-4-world.md 6 and AC8) has its own groups: its lazy chunks, the world chunk, each travel
// option's chunk, the garden (the files of src/assets/room/garden as shipped), the land pictures (land-<id>-portrait.*,
// land-<id>-wide.*), their depth maps (land-<id>-<class>-depth.*), the park (park.*, park-*) and the clips (.mp4). Every
// byte line of its section 6 is a threshold: scripts count at gzip, everything else as stored (the bytes a visitor fetches
// when the edge does not compress them), gzip printed beside it for reference. AC8's formats are checked too: each picture
// in AVIF with its WebP twin, each land's <img> with width and height. Any line broken or check failed exits 1 after the
// whole report. A line Sam has still to rule on prints "over, pending Sam" past his figure and stops the build only past
// the spec's hard figure. What it cannot read from a dist (pixel sizes, the clips' tracks, GPU memory) is printed as such.
// The mode (build, test, staging: which npm script made the dist) and the pick (PUBLIC_PARK_TRAVEL, A, B or C) come from
// --mode and --pick, else from the environment (scripts/room/guards.mjs); npm run build and build:staging pass them.
//   node scripts/hero/budget.mjs [dist] [--mode build|test|staging] [--pick A|B|C]
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODE_NAMES, PICKS, isParkAsset, readMode, readPick, travelChunkOption } from '../room/guards.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const args = process.argv.slice(2);
const dist = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) || 'dist';
let mode, pick;
try { mode = readMode(); pick = readPick(); } catch (e) { console.error(`budget: ${e.message}`); process.exit(1); }
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

// section 4's lazy chunks (section-4.md 6, section-4-world.md 5) as a graph. The entries: the island's own import() of the
// section's director and the page's import() of the walk script, each named the section's by its bridge names (they
// survive minification). Everything they import in turn, statically or by import(), is the section's too (the world, the
// travel options, the stub, the loaders) unless the page, the island or the quiz counted it first. The world and the
// travel chunks are also found by the names Vite gives them (world.<hash>.js, travel-depth.<hash>.js), so an import the
// walk cannot read still lands in its group.
const isRoom = (p) => /skreed:room|__skreedRoom|__skreedRoomFrame/.test(readFileSync(join(dist, p), 'utf8'));
const usable = (p) => !seen.has(p) && !isHero(p) && existsSync(join(dist, p));
const islandDyn = new Set(heroChunk.flatMap((h) => jsRefs(readFileSync(join(dist, h), 'utf8')).dyn));
const roomRoots = [...new Set([...islandDyn, ...dynamic])].filter((p) => usable(p) && isRoom(p));
const pageRoots = roomRoots.filter((p) => dynamic.has(p) && !islandDyn.has(p));
const graph = new Map();
const grow = (roots) => { for (const q = [...roots]; q.length;) { const p = q.shift(); if (graph.has(p) || !usable(p)) continue; const refs = jsRefs(readFileSync(join(dist, p), 'utf8')); graph.set(p, refs); q.push(...refs.stat, ...refs.dyn); } };
grow(roomRoots);
const astroFiles = existsSync(join(dist, '_astro')) ? readdirSync(join(dist, '_astro')) : [];
for (const p of astroFiles.filter((n) => /^(?:world|travel-[a-z]+)\.[A-Za-z0-9_-]+\.js$/.test(n)).map((n) => '/_astro/' + n)) if (!graph.has(p) && usable(p)) { grow([p]); roomRoots.push(p); }
const roomGroup = (p) => { const opt = travelChunkOption(basename(p)); return /^world\./.test(basename(p)) ? 'room world js' : opt ? `room travel ${opt} js` : 'room js (lazy)'; };
for (const p of graph.keys()) add(roomGroup(p), p, join(dist, p));

// section 4's files. By name in dist/_astro: the lands and their depth maps, the park, the hall and its stills; the clips
// anywhere in dist; the garden as the files of src/assets/room/garden that ship byte for byte (a far plate has "plate" in
// its name, every other file there is a depth card). The rest of what the section's chunks name stays "room data".
const H = '[A-Za-z0-9_-]+';
const LAND = new RegExp(`^land-([a-z0-9-]+?)-(portrait|wide)\\.${H}\\.(avif|webp)$`);
const DEPTH = new RegExp(`^land-([a-z0-9-]+?)(?:-(portrait|wide))?-depth\\.${H}\\.(avif|webp)$`);
const STILL = new RegExp(`^hall-(portrait|wide)\\.${H}\\.(avif|webp)$`);
const HALL_GLB = new RegExp(`^hall\\.${H}\\.glb$`), HALL_LIGHT = new RegExp(`^hall-lightmap\\.${H}\\.(avif|webp)$`);
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? files(join(dir, d.name)) : [join(dir, d.name)]);
const room = [];   // { group, name, stored, kind fields }
const addFile = (group, p, extra) => { const name = '/' + relative(dist, p); add(group, name, p); room.push({ group, name, stored: raw(p), ...extra }); };
for (const n of astroFiles) {
  const p = join(dist, '_astro', n);
  let m;
  if ((m = LAND.exec(n))) addFile('room land', p, { id: m[1], cls: m[2], fmt: m[3] });
  else if ((m = DEPTH.exec(n))) addFile('room depth', p, { id: m[1], cls: m[2], fmt: m[3] });
  else if (isParkAsset(n)) addFile('room park', p, { kind: n.endsWith('.glb') ? 'glb' : /lightmap/.test(n) ? 'lightmap' : 'other', fmt: n.split('.').pop() });
  else if ((m = STILL.exec(n))) addFile('room still', p, { cls: m[1], fmt: m[2] });
  else if (HALL_GLB.test(n)) addFile('room data', p, { hall: 'glb' });
  else if ((m = HALL_LIGHT.exec(n))) addFile('room data', p, { hall: 'light', fmt: m[1] });
}
for (const p of files(dist).filter((f) => /\.mp4$/i.test(f))) addFile('room clip', p, { cls: /portrait/.test(basename(p)) ? 'portrait' : /wide/.test(basename(p)) ? 'wide' : null });
const gardenDir = join(ROOT, 'src/assets/room/garden');
// the garden's pictures in src/, each with the dist files that carry its name and whether one of them is its bytes
const gardenPics = [];
if (existsSync(gardenDir)) for (const src of files(gardenDir)) {
  const stem = basename(src).replace(/\.[^.]+$/, ''), ext = src.split('.').pop(), bytes = readFileSync(src);
  const re = new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.${H}\\.${ext}$`);
  const named = astroFiles.filter((f) => re.test(f)), same = named.filter((f) => readFileSync(join(dist, '_astro', f)).equals(bytes));
  for (const n of same) addFile('room garden', join(dist, '_astro', n), { part: /plate/.test(stem) ? 'plate' : 'card', fmt: ext });
  if (/^(?:avif|webp)$/.test(ext)) gardenPics.push({ file: basename(src), named: named.length, matched: same.length > 0 });
}
// the rest of what the section's chunks name: the old universe's scene and models until they go (counted as stored), and
// the family page's case model it shares (public/models)
for (const p of graph.keys()) {
  const src = readFileSync(join(dist, p), 'utf8');
  for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:glb|avif|webp)\b/g)].map((m) => m[0]))) if (existsSync(join(dist, '_astro', d)) && !rows.some((x) => x.name.endsWith('/' + d))) add('room data', '/_astro/' + d, join(dist, '_astro', d));
  for (const d of new Set([...src.matchAll(/\/models\/(?:case\.lod1|wallet|airpods|lenskin)\.[a-f0-9]+\.glb/g)].map((m) => m[0]))) if (existsSync(join(dist, d)) && !rows.some((x) => x.name === d)) rows.push({ group: 'room data', name: d, raw: raw(join(dist, d)), gz: raw(join(dist, d)) });
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

// ---- section 4's lines (section-4-world.md 6), each a threshold ----
const KB = 1024, CLASSES = ['portrait', 'wide'], tune = mode === 'staging';
const BUILD = MODE_NAMES[mode];
// the chunks a build ships: everything the entries reach, less what only the skipped travel chunks reach
const reach = (skip, roots = roomRoots, staticOnly = false) => { const out = new Set(); for (const q = [...roots]; q.length;) { const p = q.shift(); if (out.has(p) || skip.has(p) || !graph.has(p)) continue; out.add(p); const { stat, dyn } = graph.get(p); q.push(...stat, ...(staticOnly ? [] : dyn)); } return out; };
const gzOf = (set) => rows.filter((r) => set.has(r.name) && graph.has(r.name)).reduce((a, r) => a + r.gz, 0);
const chunksOf = (opt) => new Set([...graph.keys()].filter((p) => travelChunkOption(basename(p)) === opt));
const everything = reach(new Set());
const ownOf = (opt) => { const rest = reach(chunksOf(opt)); return gzOf(new Set([...everything].filter((p) => !rest.has(p)))); };
const roomScript = gzOf(reach(new Set(PICKS.filter((o) => o !== pick).flatMap((o) => [...chunksOf(o)]))));
const posterScript = gzOf(reach(new Set(), pageRoots, true));
const storedOf = (pred) => room.filter(pred).reduce((a, f) => a + f.stored, 0);
const maxOf = (pred) => room.filter(pred).reduce((a, f) => Math.max(a, f.stored), 0);
const hallGlb = storedOf((f) => f.hall === 'glb'), hallLight = (fmt) => storedOf((f) => f.hall === 'light' && f.fmt === fmt);
const garden = (fmt, part) => storedOf((f) => f.group === 'room garden' && f.fmt === fmt && (!part || f.part === part));
const pic = (id, cls, fmt) => maxOf((f) => f.group === 'room land' && f.id === id && f.cls === cls && f.fmt === fmt);
const depth = (id, cls, fmt) => maxOf((f) => f.group === 'room depth' && f.id === id && (!f.cls || f.cls === cls) && f.fmt === fmt);
const still = (cls, fmt) => maxOf((f) => f.group === 'room still' && f.cls === cls && f.fmt === fmt);
// the lands, land 1 first: in the order the page names them (ROOM_LANDS' order), else the largest first, so the
// first-land lines are never measured on a smaller land than the real first
const landIds = [...new Set(room.filter((f) => f.group === 'room land').map((f) => f.id))];
const htmlOrder = [...new Set([...html.matchAll(/land-([a-z0-9-]+?)-(?:portrait|wide)\./g)].map((m) => m[1]))].filter((id) => landIds.includes(id));
const lands = [...htmlOrder, ...landIds.filter((id) => !htmlOrder.includes(id)).sort((a, b) => pic(b, 'wide', 'avif') - pic(a, 'wide', 'avif'))];
const land1 = lands[0];

const lines = [], faults = [];
// pendingKB: Sam's figure for a line he has still to rule on; past it the line prints "over, pending Sam", and only past
// limitKB (the spec's hard figure) does it stop the build
const line = (name, bytes, limitKB, { enforced = true, note = '', pendingKB = 0 } = {}) => lines.push({ name, bytes, limit: limitKB * KB, pending: pendingKB * KB, enforced, note });
const SCRIPT = { A: 38, B: 45, C: 40 };
line(`section 4's script, option ${pick} shipped (gzip)`, roomScript, SCRIPT[pick], pick === 'A'
  ? { pendingKB: 30, note: "Sam's 30 KB line, pending him (spec 11, item 1: move it to 38 KB, or replace three's model loader); the build stops above the spec's likely 38 KB" }
  : { note: `the spec's figure for option ${pick}` });
for (const o of PICKS) if (chunksOf(o).size) {
  if (!tune && o !== pick) line(`option ${o}'s chunk in a ${BUILD} whose pick is ${pick} (gzip)`, ownOf(o), 0, { note: 'never in production until picked: astro.config.mjs aliases it to travel-stub.ts' });
  else line(`option ${o}'s own chunks (gzip)`, ownOf(o), 8, { note: 'about 8 KB each' });
}
line('total JS with section 4 (gzip)', totalJs + roomScript, 250, { enforced: !tune, note: tune ? "production's line; this staging build carries Tune" : 'production' });
line('section 4 on the poster tier: its script (gzip)', posterScript, 8.5);
// the world ships once its chunk does, or a file named as a garden picture; before that the garden is not in the build
const worldShips = [...graph.keys()].some((p) => /^world\./.test(basename(p))) || gardenPics.some((g) => g.named);
const gardenNote = worldShips ? '' : 'not in this build yet: no world chunk';
line('the garden: far plate, AVIF', garden('avif', 'plate'), 110, { note: gardenNote });
line('the garden: far plate, WebP', garden('webp', 'plate'), 180, { note: gardenNote });
line('the garden: three depth cards together, AVIF', garden('avif', 'card'), 60, { note: gardenNote });
line('the garden: three depth cards together, WebP', garden('webp', 'card'), 100, { note: gardenNote });
// each land's picture and depth map; "each further land" (92 and 122 KB AVIF, 148 and 196 WebP) is the sum of the two lines
const PIC = { portrait: { avif: 80, webp: 128 }, wide: { avif: 110, webp: 176 } };
for (const f of room.filter((x) => x.group === 'room land')) line(`land ${f.id}: ${f.cls}, ${f.fmt.toUpperCase()}`, f.stored, PIC[f.cls][f.fmt], { note: f.name });
for (const f of room.filter((x) => x.group === 'room depth')) line(`land ${f.id}: depth map${f.cls ? `, ${f.cls}` : ''}, ${f.fmt.toUpperCase()}`, f.stored, f.fmt === 'avif' ? 12 : 20, { note: f.name });
if (!lands.length) console.log('\n(section 4: no land pictures in this build; N = 0)');
// option B's park: its caps apply once B is picked (spec 6); before that they are printed
const parkOn = pick === 'B', parkNote = parkOn ? '' : 'applies once B is picked';
if (room.some((f) => f.group === 'room park')) {
  line('option B: the park, GLB', storedOf((f) => f.group === 'room park' && f.kind === 'glb'), 300, { enforced: parkOn, note: parkNote });
  line('option B: the park, lightmap, AVIF', storedOf((f) => f.group === 'room park' && f.kind === 'lightmap' && f.fmt === 'avif'), 120, { enforced: parkOn, note: parkNote });
  line('option B: the park, lightmap, WebP', storedOf((f) => f.group === 'room park' && f.kind === 'lightmap' && f.fmt === 'webp'), 190, { enforced: parkOn, note: parkNote });
}
for (const f of room.filter((x) => x.group === 'room clip')) line(`option C: clip ${basename(f.name)}`, f.stored, 700);
// to the first land on the 3D tier: the script, the hall (model and lightmap), the garden, land 1 with its depth map
for (const [fmt, limits] of [['avif', { portrait: 355, wide: 385 }], ['webp', { portrait: 560, wide: 610 }]]) for (const cls of CLASSES) {
  const bytes = roomScript + hallGlb + hallLight(fmt) + garden(fmt) + (land1 ? pic(land1, cls, fmt) + depth(land1, cls, fmt) : 0);
  line(`to the first land, 3D tier, ${pick}, ${cls}, ${fmt === 'avif' ? 'AVIF' : 'WebP-only browsers'}`, bytes, limits[cls], { note: land1 ? `land 1 is ${land1}` : 'no land yet' });
}
// the whole section by the pick, AVIF: the first-land row, every land with its depth map (A; B and C keep land 1's only),
// plus the park (B) or the clips of the class (C)
const WHOLE = { A: { portrait: 630, wide: 750 }, B: { portrait: 1020, wide: 1140 }, C: { portrait: 2700, wide: 2820 } };
for (const cls of CLASSES) {
  const depths = (pick === 'A' ? lands : lands.slice(0, 1)).reduce((a, id) => a + depth(id, cls, 'avif'), 0);
  const extra = pick === 'B' ? storedOf((f) => f.group === 'room park' && (f.kind === 'glb' || (f.kind === 'lightmap' && f.fmt === 'avif'))) : pick === 'C' ? storedOf((f) => f.group === 'room clip' && (!f.cls || f.cls === cls)) : 0;
  const bytes = roomScript + hallGlb + hallLight('avif') + garden('avif') + lands.reduce((a, id) => a + pic(id, cls, 'avif'), 0) + depths + extra;
  line(`the whole section, option ${pick}, ${cls}, AVIF`, bytes, WHOLE[pick][cls], { note: `${lands.length} land(s)` });
}
// the poster tier: the hall's still and every land's picture, one class
for (const [fmt, limits] of [['avif', { portrait: 337, wide: 459 }], ['webp', { portrait: 529, wide: 724 }]]) for (const cls of CLASSES) {
  line(`the poster tier, ${cls}, ${fmt === 'avif' ? 'AVIF' : 'WebP'}: the hall's still and the lands`, still(cls, fmt) + lands.reduce((a, id) => a + pic(id, cls, fmt), 0), limits[cls]);
}
// AC8's formats. Each picture of the section ships as AVIF with its WebP twin, by the name before the hash: the lands, their
// depth maps, the garden, the hall's stills and the park's lightmap. Each <img> in the page that names a land picture (its
// own src or srcset, or a <source> of its <picture>) carries width and height.
const stemOf = (name) => basename(name).replace(new RegExp(`\\.${H}\\.(?:avif|webp)$`), '');
const pics = room.filter((f) => ['room land', 'room depth', 'room garden', 'room still'].includes(f.group) || (f.group === 'room park' && f.kind === 'lightmap'));
const byStem = new Map();
for (const f of pics) byStem.set(stemOf(f.name), new Set([...(byStem.get(stemOf(f.name)) ?? []), f.fmt]));
const FMT = { avif: 'AVIF', webp: 'WebP' };
for (const [stem, fmts] of byStem) for (const [has, lacks] of [['avif', 'webp'], ['webp', 'avif']]) if (fmts.has(has) && !fmts.has(lacks)) faults.push(`${stem}: ${FMT[has]} without its ${FMT[lacks]} twin (AC8: the pictures are AVIF with WebP)`);
const LAND_REF = /land-[a-z0-9-]+?-(?:portrait|wide)\.[A-Za-z0-9_-]+\.(?:avif|webp)/;
const sized = (img) => /\swidth=/.test(img) && /\sheight=/.test(img);
let landImgs = 0;
const pictureBlocks = [...html.matchAll(/<picture\b[\s\S]*?<\/picture>/g)].map((m) => m[0]);
for (const block of pictureBlocks.filter((b) => LAND_REF.test(b))) {
  const img = block.match(/<img\b[^>]*>/)?.[0];
  landImgs++;
  if (!img || !sized(img)) faults.push(`a <picture> of ${block.match(LAND_REF)[0]}: its <img> has no width and height (AC8)`);
}
for (const img of [...html.replace(/<picture\b[\s\S]*?<\/picture>/g, '').matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((t) => LAND_REF.test(t))) {
  landImgs++;
  if (!sized(img)) faults.push(`an <img> of ${img.match(LAND_REF)[0]} has no width and height (AC8)`);
}
// the garden is found by its bytes, so a garden that ships re-encoded or renamed would read 0 KB on its four lines and pass.
// Once the world ships, every garden picture in src/ must be in dist as is.
const unmatched = gardenPics.filter((g) => !g.matched);
if (worldShips && unmatched.length) faults.push(unmatched.length === gardenPics.length
  ? `the garden: the world ships, but none of the ${gardenPics.length} pictures in src/assets/room/garden is in dist byte for byte (re-encoded or renamed?), so its lines cannot be measured`
  : `the garden: ${unmatched.map((g) => `${g.file}${g.named ? ' (in dist, but not these bytes)' : ''}`).join(', ')} not in dist byte for byte, so its lines are short`);

// the first view: the section's markup as built (its noscript copies included) and room.css, minified from the source here
// because the build inlines it into the one stylesheet with every other section's
const at = html.search(/<section\b[^>]*\bid="room"/);
let markup = '';
if (at >= 0) { const re = /<\/?section\b[^>]*>/g; re.lastIndex = at; let d = 0; for (let m; (m = re.exec(html));) { d += m[0][1] === '/' ? -1 : 1; if (!d) { markup = html.slice(at, re.lastIndex); break; } } }
const cssPath = join(ROOT, 'src/styles/room.css');
const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}') : '';
line("the first view: section 4's markup and room.css (gzip)", gzipSync(markup + css, { level: 9 }).length, 4, { note: `markup ${markup.length} B, room.css about ${css.length} B` });

console.log(`\nsection 4 (section-4-world.md 6; the ${BUILD}, pick ${pick}; scripts at gzip, everything else as stored; KB = 1024 B)`);
const PENDING = 'over, pending Sam';
for (const l of lines) {
  const over = l.bytes > l.limit, waits = !over && l.pending > 0 && l.bytes > l.pending;
  const status = over ? (l.enforced ? 'OVER' : 'over') : waits ? PENDING : 'ok';
  const tail = [l.note, over && !l.enforced ? 'not enforced here' : ''].filter(Boolean).join('; ');
  console.log(`  ${status.padEnd(PENDING.length)} ${fmt(l.bytes)} of ${fmt(over ? l.limit : l.pending || l.limit)}  ${l.name}${tail ? `  (${tail})` : ''}`);
}
console.log(`  ${(faults.length ? 'FAIL' : 'ok').padEnd(PENDING.length)} formats: ${byStem.size} picture(s) by name, AVIF with WebP; ${landImgs} land <img> in the page, with width and height${worldShips ? `; the garden, ${gardenPics.length - unmatched.length} of ${gardenPics.length} pictures shipped as they are in src/` : ''}`);
for (const f of faults) console.log(`  ${''.padEnd(PENDING.length)} ${f}`);
console.log("  not measured here: the pixel sizes (720 x 1280, 1920 x 1200, the 2048 px plate, the 1024 px lightmap), the clips' count (3 per class), length (3 s), codec (H.264 720p) and missing audio track, the park's triangles and draws, the GPU memory (the review reads renderer.info), the frame cost (the probe), the Higgsfield credits (the ledger), the rings and the cloud (generated, 0 B)");
const broken = lines.filter((l) => l.enforced && l.bytes > l.limit), waiting = lines.filter((l) => l.bytes <= l.limit && l.pending > 0 && l.bytes > l.pending);
const pendingNote = waiting.length ? `; ${waiting.length} over Sam's figure, pending him: ${waiting.map((l) => `${l.name} at ${fmt(l.bytes).trim()} against his ${fmt(l.pending).trim()}`).join(', ')}` : '';
if (broken.length || faults.length) {
  console.error(`\nbudget: section-4-world.md 6 and AC8 do not hold:\n${[...broken.map((l) => `  ${l.name}: ${fmt(l.bytes).trim()} over ${fmt(l.limit).trim()}`), ...faults.map((f) => `  ${f}`)].join('\n')}${pendingNote ? `\n(and${pendingNote.slice(1)})` : ''}`);
  process.exit(1);
}
console.log(`\nbudget: every enforced line of section-4-world.md 6 holds (${lines.filter((l) => l.enforced).length} enforced) and AC8's formats check${pendingNote}`);
