// The hero's byte budget (CLAUDE.md "Always do", hero.md 6, hero-architecture.md 6.6): gzip sizes of what / loads.
// Reads dist/ (run after a build): the page, its inline scripts and styles, the module scripts and their static
// imports (critical JS), the island chunk and its data (the 3D path), the lazy quiz chunk (section 3's deck, fetched
// once the section is within a screen), the fonts and the posters. First view per class: poster tier = page + Open Sans
// + the class's AVIF poster; 3D tier = poster tier + every JS chunk + the island's data. The hero's lines are printed.
// Section 4 (docs/specs/section-4-flux.md 6 and AC8) has its own groups: its lazy chunks (the director's and the walk
// script's, by their markers), the page scroll chunk (section4/scroll.ts, by its marker skreed:scroll), the ten scene
// loops ((cove|grove|ember|palace|dawn)-(wide|portrait).<hash>.mp4), the twenty poster stills (the same stems in AVIF and
// WebP) and products.bin (the hall's model, lightmap and stills left on 2026-11-02, docs/specs/section-4-no-hall.md 6;
// one in a dist is a stray and stops the build). Every byte line of its section 6 is a threshold: scripts count at gzip,
// everything else as stored (the bytes a visitor fetches when the edge does not compress them), gzip printed beside it
// for reference. AC8's formats are checked too: each picture in AVIF with its WebP twin and in no other format (a scene
// still in JPEG, PNG or GIF is found by its name all the same, and stops the build), each scene's <img> with width and
// height. Any line broken or check failed exits 1 after the whole report. A
// line Sam has still to rule on prints "over, pending Sam" past his figure and stops the build only past the spec's hard
// figure. What it cannot read from a dist (pixel sizes, the loops' tracks, GPU memory) is printed as such. The mode
// (build, test, staging: which npm script made the dist) comes from --mode, else from the environment
// (scripts/room/guards.mjs); npm run build and build:staging pass it. Section 5 (rebuilt to Sam's picture on 2026-11-02)
// has its page script (by the event it alone dispatches, skreed:signup-filled), its two type faces (Inter and Jost in
// dist/fonts) and its jar pictures (the sixty-four names of C2: sixteen states at 1x and 2x, AVIF and WebP); the island
// holds a flat ground under it and ships nothing of its own for the section.
// The redesigned landing (docs/specs/redesign.md D17 and section 8; added 2026-11-09). When dist/index.html holds
// main.rd the page is the redesign: ordinary sections, no island, no posters. The hero's summary (posters, tiers) and
// the old landing's total are then left out, because they measure nothing there, and the page's own lines are printed,
// each a threshold: critical JS (the inline scripts, the module scripts and their static imports) at most 60 KB gzip;
// total JS at most 250 KB gzip over every chunk the page can reach, by a static import or by import() (GSAP,
// ScrollTrigger, the section modules, the quiz's deck, the form), read by a walk that follows both kinds and a bare
// import "./x.js" too, which the hero's walk never did; the first screen's picture, the hero's largest AVIF, at most
// 120 KB; the first view (the page, its critical JS, the fonts it preloads, that picture) at most 1,500 KB. Its
// formats are checked: every <picture> an AVIF source with its WebP twin at the same widths and an <img> with width
// and height, sizes wherever a srcset is by width, no other raster format, every <img> after the first lazy and the
// first one not, and no chunk the page can reach that reads as the old island's (three.js, by the text WebGLRenderer).
// Each of its four display faces (D7, D20) has a line of its own, as stored, and what the first view asks for of them
// is checked: Rubik Black, DIFFERENT at rest, is preloaded wherever the page draws that word (D20), and Rubik Glitch,
// the same word torn, never is, being drawn only inside a burst (D19). The picture count follows the page: the sign-up's
// photograph left with the two steps (D19) and the swatches and the blobs came as pictures (D19, D21), all read by the
// same formats check; a picture left over in the folder, which no page names, is the post-build guard's to refuse.
// Sections 4 and 5 keep their lines: section 4's measure nothing while no page mounts it, and say so; section 5 has a
// page of its own since that day (/jars/, spec D1) and closes the landing page as well (D18), so its lines are read on
// every page that mounts it (a <section id="signup"> of class signup, src/components/signup/Signup.astro), its first
// view once a page, and where dist/jars/index.html exists that page gets the two script lines and the island check of
// its own.
//   node scripts/hero/budget.mjs [dist] [--mode build|test|staging]
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, basename, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLASSES, LOOP_NAME, MODE_NAMES, SCENE_IDS, isHallAsset, isLandAsset, readMode } from '../room/guards.mjs';

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

// ---- the redesigned landing and the jars' own page (docs/specs/redesign.md D1, D17 and section 8; 2026-11-09) ----
/** the landing page is the redesign: main.rd in the built page (src/pages/index.astro) */
const REDESIGN = /<main\b[^>]*\bclass="(?:[^"]*\s)?rd(?:\s[^"]*)?"/.test(html);
/** section 5 on a page of its own (spec D1): the jars' page, where the build has it */
const JARS = existsSync(join(dist, 'jars', 'index.html'));
const jarsHtml = JARS ? readFileSync(join(dist, 'jars', 'index.html'), 'utf8') : '';
/** section 5 as built, wherever a page mounts it (src/components/signup/Signup.astro: <section class="signup"
 *  id="signup">). The class is asked for with the id so that nothing else is ever read as section 5, whatever it is
 *  called: for part of a day the redesigned landing's two steps were a section#signup of their own (spec D18), before
 *  they left the page (D19), and they weighed 30 KB */
const SECTION5 = /<section\b(?=[^>]*\bid="signup")(?=[^>]*\bclass="(?:[^"]*\s)?signup(?:\s[^"]*)?")[^>]*>/;
/** the pages that mount section 5: the landing page (the old one, and the redesigned one since D18) and the jars' own */
const pages5 = [{ at: '/', page: html }, { at: '/jars/', page: jarsHtml }].filter((p) => SECTION5.test(p.page));
// A page's script graph, read exactly. The hero's walk below (jsRefs) knows from "./x.js" and import("./x.js") and
// takes any quoted /_astro/ path for a static import; it misses a bare import "./x.js" and reads an import() of an
// absolute path as static. The redesign's lines count every chunk the page can reach, so this reader takes each form
// for what it is: static (import ... from, a bare import, export ... from) or by import().
const EXEC = new Set(['', 'module', 'text/javascript', 'application/javascript']);
const STATIC_IMPORT = /(?<![\w$.])(?:import|export)\s*(?:[^"'`()]*?\bfrom\s*)?["'`]([^"'`\n]+?\.js)(?:[?#][^"'`\n]*)?["'`]/g;
const DYNAMIC_IMPORT = /(?<![\w$.])import\(\s*["'`]([^"'`\n]+?\.js)(?:[?#][^"'`\n]*)?["'`]\s*\)/g;
/** a specifier as a path in dist, from the file that names it; null for another origin */
const resolveRef = (spec, from) => (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(spec) ? null : posix.normalize(spec.startsWith('/') ? spec : posix.join(posix.dirname(from), spec)));
/** what a script's text imports, as dist paths */
function importsOf(src, from) {
  const stat = new Set(), dyn = new Set();
  for (const m of src.matchAll(DYNAMIC_IMPORT)) { const r = resolveRef(m[1], from); if (r) dyn.add(r); }
  for (const m of src.matchAll(STATIC_IMPORT)) { const r = resolveRef(m[1], from); if (r) stat.add(r); }
  return { stat: [...stat], dyn: [...dyn] };
}
/** a page's scripts: the ones it names (src=, a modulepreload link) and the text of the ones it carries, executable
 *  types only, as scripts/csp.mjs reads them (a JSON-LD block is data, not script) */
function pageScripts(page) {
  const srcs = [], inline = [];
  for (const m of page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const type = (m[1].match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? '').toLowerCase();
    if (!EXEC.has(type)) continue;
    const src = m[1].match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i)?.[1];
    if (src) srcs.push(src); else inline.push(m[2]);
  }
  for (const m of page.matchAll(/<link\b[^>]*>/gi)) if (/\brel\s*=\s*["']?modulepreload\b/i.test(m[0])) { const h = m[0].match(/\bhref\s*=\s*["']?([^"'\s>]+)/i)?.[1]; if (h) srcs.push(h); }
  return { srcs, inline };
}
/**
 * A page's script graph. critical: the page's own scripts and everything they import statically, the bytes the first
 * view waits for. all: critical and every chunk an import() reaches from there, with those chunks' own imports of
 * either kind. lazy: every import() target. missing: a chunk the page names that the build does not hold (its bytes
 * cannot be counted, so it is a fault). inline: the page's inline scripts' text.
 */
function graphOf(page, path) {
  const { srcs, inline } = pageScripts(page);
  const edges = new Map(), missing = new Set();
  const read = (c) => {
    if (!edges.has(c)) { const f = join(dist, c); if (existsSync(f)) edges.set(c, importsOf(readFileSync(f, 'utf8'), c)); else { edges.set(c, { stat: [], dyn: [] }); missing.add(c); } }
    return edges.get(c);
  };
  const roots = new Set(), lazy = new Set();
  for (const src of srcs) { const r = resolveRef(src.replace(/[?#].*$/, ''), path); if (r) roots.add(r); }
  for (const text of inline) { const r = importsOf(text, path); for (const c of r.stat) roots.add(c); for (const c of r.dyn) lazy.add(c); }
  const critical = new Set(), all = new Set();
  for (const q = [...roots]; q.length;) { const c = q.pop(); if (critical.has(c)) continue; critical.add(c); q.push(...read(c).stat); }
  for (const q = [...roots, ...lazy]; q.length;) { const c = q.pop(); if (all.has(c)) continue; all.add(c); const r = read(c); for (const d of r.dyn) lazy.add(d); q.push(...r.stat, ...r.dyn); }
  for (const c of missing) { critical.delete(c); all.delete(c); lazy.delete(c); }
  const inlineGz = inline.reduce((a, t) => a + gzipSync(t, { level: 9 }).length, 0);
  const sumGz = (set) => [...set].reduce((a, c) => a + gz(join(dist, c)), 0);
  return { critical, all, lazy, missing, inline, inlineGz, criticalGz: inlineGz + sumGz(critical), totalGz: inlineGz + sumGz(all) };
}
const rd = REDESIGN ? graphOf(html, '/index.html') : null;
const jars = JARS ? graphOf(jarsHtml, '/jars/index.html') : null;

// module scripts and their static imports. A script's references: static (the page's src=, a quoted /_astro/ path, from "./x.js")
// and dynamic (import("./x.js")); the walk follows the static ones and notes the dynamic ones (the island chunk, the lazy section chunks).
const seen = new Set(), dynamic = new Set();
const isHero = (p) => /hero\.[A-Za-z0-9_-]+\.js$/.test(p);
const jsRefs = (src) => { const stat = [], dyn = []; for (const m of src.matchAll(/["'`](\/_astro\/[^"'`]+\.js)["'`]|from\s*["'`](\.\/[^"'`]+\.js)["'`]|import\(\s*["'`](\.\/[^"'`]+\.js)["'`]\s*\)/g)) { if (m[3]) dyn.push('/_astro/' + m[3].slice(2)); else stat.push(m[1] || '/_astro/' + m[2].slice(2)); } return { stat, dyn }; };
const walk = (p, group) => { if (seen.has(p)) return; seen.add(p); const f = join(dist, p); if (!existsSync(f)) return; add(group, p, f); const { stat, dyn } = jsRefs(readFileSync(f, 'utf8')); for (const r of dyn) dynamic.add(r); for (const r of stat) if (!isHero(r)) walk(r, group); };
// (2026-11-09, docs/specs/redesign.md D17) on the redesigned landing the hero's walk does not start: the page's own
// scripts and their static imports come from the exact graph above, and every import() it can reach feeds the lazy
// groups below (the quiz's deck, section 5's chunks), which are found by their markers as before
if (rd) { for (const c of [...rd.critical].sort()) { seen.add(c); add('critical js', c, join(dist, c)); } for (const c of rd.lazy) dynamic.add(c); }
else for (const r of jsRefs(html).stat) walk(r, 'critical js');
// the jars' own page (spec D1): what it loads at once is that page's, never section 5's lazy script, as the landing's
// critical walk made it on the old landing; its import()s are where section 5's chunks are found
if (jars) { for (const c of [...jars.critical].sort()) if (!seen.has(c)) { seen.add(c); add('jars js', c, join(dist, c)); } for (const c of jars.lazy) dynamic.add(c); }
// the island chunk (dynamic import from the HeroStage chunk) and its data
const heroChunk = rd ? [] : [...new Set(rows.filter((r) => r.group === 'critical js').flatMap((r) => { const { stat, dyn } = jsRefs(readFileSync(join(dist, r.name), 'utf8')); return [...stat, ...dyn]; }).filter(isHero))];
// the island chunk and its own static imports (the bundler may split what the island shares with the section chunks it
// loads, three among it, into a chunk of its own that the island imports: it loads with the island, so it is the island's)
// (the island's static graph may carry a component's hoisted script with it, as config/room.ts carries Room.astro's and
// Signup.astro's since 2026-10-26: their import()s of the walk and the sign-up scripts are the page's, so they are noted too)
const walkIsland = (p) => { if (seen.has(p)) return; seen.add(p); const f = join(dist, p); if (!existsSync(f)) return; add('island js', p, f); const refs = jsRefs(readFileSync(f, 'utf8')); for (const r of refs.dyn) dynamic.add(r); for (const r of refs.stat) walkIsland(r); };
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
// (section 5's page script listens for 'skreed:room-state', so its chunk matches isRoom by that string alone; it is section
// 5's, by the event it alone dispatches, 'skreed:signup-filled', C4)
const SIGNUP_DOM_MARK = /skreed:signup-filled/;
const isSignupDom = (p) => SIGNUP_DOM_MARK.test(readFileSync(join(dist, p), 'utf8'));
const roomRoots = [...new Set([...islandDyn, ...dynamic])].filter((p) => usable(p) && isRoom(p) && !isSignupDom(p));
const pageRoots = roomRoots.filter((p) => dynamic.has(p) && !islandDyn.has(p));
const astroFiles = existsSync(join(dist, '_astro')) ? readdirSync(join(dist, '_astro')) : [];
const graph = new Map(), scrollGraph = new Map();
const grow = (roots, into, skip = new Set()) => { for (const q = [...roots]; q.length;) { const p = q.shift(); if (into.has(p) || skip.has(p) || !usable(p)) continue; const refs = jsRefs(readFileSync(join(dist, p), 'utf8')); into.set(p, refs); q.push(...refs.stat, ...refs.dyn); } };
grow(scrollRoots, scrollGraph);
grow(roomRoots, graph, new Set(scrollGraph.keys()));
// section 5's page script (section-5.md 5 and 6, as rebuilt on 2026-11-02): the page's import() of
// scripts/signup/signup.ts, named by its event (skreed:signup-filled), with what it alone imports; counted on its own line
// and in the total, never in section 4's script. The island has no section 5 chunk since that day: its jar went, and the
// flat ground it holds under the section (section5/ground.ts) is part of the island chunk
const signupDomGraph = new Map();
// section 5's email form (scripts/signup/form.ts, marker suCodePill): its own chunk since the email code of 2026-11-03,
// fetched by the page script only where the build renders the form (PUBLIC_LEADS on), so it has its own line beside the
// page script's and is in the total
const SIGNUP_FORM_MARK = /suCodePill/;
const signupFormRoots = astroFiles.filter((n) => n.endsWith('.js') && SIGNUP_FORM_MARK.test(readFileSync(join(dist, '_astro', n), 'utf8'))).map((n) => '/_astro/' + n);
grow([...dynamic].filter((p) => usable(p) && isSignupDom(p)), signupDomGraph, new Set([...scrollGraph.keys(), ...graph.keys(), ...signupFormRoots]));
const signupFormGraph = new Map();
grow(signupFormRoots, signupFormGraph, new Set([...scrollGraph.keys(), ...graph.keys(), ...signupDomGraph.keys()]));
for (const p of scrollGraph.keys()) add('scroll js (lazy)', p, join(dist, p));
for (const p of graph.keys()) add('room js (lazy)', p, join(dist, p));
for (const p of signupDomGraph.keys()) add('signup dom js (lazy)', p, join(dist, p));
for (const p of signupFormGraph.keys()) add('signup form js (lazy)', p, join(dist, p));
// the rest of what the redesigned landing and the jars' page can reach by import() (GSAP, ScrollTrigger, any chunk no
// group above has named), each file listed once
const listed = (name) => rows.some((r) => r.name === name);
if (rd) for (const c of [...rd.all].sort()) if (!listed(c)) add('lazy js', c, join(dist, c));
if (jars) for (const c of [...jars.all].sort()) if (!listed(c)) add('jars js (lazy)', c, join(dist, c));
// the page script bundled into another chunk instead (no lazy chunk of its own): named on its line, counted where it is
const signupDomElsewhere = signupDomGraph.size ? [] : astroFiles.filter((n) => n.endsWith('.js') && SIGNUP_DOM_MARK.test(readFileSync(join(dist, '_astro', n), 'utf8'))).map((n) => '/_astro/' + n);

// section 4's files. By name in dist/_astro: the scene loops and stills (the ten stems of section 3) and products.bin;
// an asset of the lands or of the hall is a stray. A picture is found by its name in any image format (IMG), so one in a
// format AC8 does not allow is counted and refused rather than missed. The rest of what the section's chunks name stays
// "room data".
const H = '[A-Za-z0-9_-]+', IMG = 'avif|webp|jpe?g|png|gif';
const SCENE = new RegExp(`^(${SCENE_IDS.join('|')})-(${CLASSES.join('|')})\\.${H}\\.(${IMG})$`);
const PRODUCTS = new RegExp(`^products\\.${H}\\.bin$`);
// section 5's jar pictures (C2: src/assets/signup/jars/, rendered by scripts/signup/jars/): sixteen states by the
// follows' order (0, or the platforms' letters f, y, i in press order, bottom layer first) at 1x and 2x, AVIF and WebP
const JAR_IMG = new RegExp(`^jar-(0|[fyi]{1,3})-(1x|2x)\\.${H}\\.(${IMG})$`);
const JAR_STATES = ['0', 'f', 'y', 'i', 'fy', 'fi', 'yf', 'yi', 'if', 'iy', 'fyi', 'fiy', 'yfi', 'yif', 'ify', 'iyf'];
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
  else if (PRODUCTS.test(n)) addFile('room data', p, { products: true });
  else if ((m = JAR_IMG.exec(n))) addFile('signup jar', p, { id: m[1], size: m[2], fmt: fmtOf(m[3]) });
  else if (isLandAsset(n) || isHallAsset(n)) addFile('room stray', p, { stray: true });
}
// a video anywhere else in dist, or a stray asset: counted so the guard's hit shows here too
for (const p of files(dist).filter((f) => /\.mp4$/i.test(f) && !LOOP_NAME.test(basename(f)))) addFile('room stray', p, { stray: true });
// the rest of what the section's chunks name (counted as stored)
for (const p of graph.keys()) {
  const src = readFileSync(join(dist, p), 'utf8');
  for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:bin|glb|avif|webp)\b/g)].map((m) => m[0]))) if (existsSync(join(dist, '_astro', d)) && !rows.some((x) => x.name.endsWith('/' + d))) add('room data', '/_astro/' + d, join(dist, '_astro', d));
}

const dataSeen = new Set();
// (not on the redesigned landing, which has no island: a picture one of its scripts names is not island data)
if (!rd) for (const r of rows.filter((r) => r.group === 'critical js' || r.group === 'island js')) { const src = readFileSync(join(dist, r.name), 'utf8'); for (const d of new Set([...src.matchAll(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:webp|bin|json)\b/g)].map((m) => m[0]))) if (!dataSeen.has(d) && !/^(wide|portrait)\./.test(d) && existsSync(join(dist, '_astro', d))) { dataSeen.add(d); add('island data', '/_astro/' + d, join(dist, '_astro', d)); } }
for (const f of [...new Set([...html.matchAll(/href="(\/fonts\/[^"]+)"/g)].map((m) => m[1]))]) add('font', f, join(dist, f));
// the hero's posters only, wide.<hash> and portrait.<hash> in AVIF and WebP: never a land (land-<id>-portrait.*), a
// scene's still (cove-portrait.*) or anything else with the word in its name
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
if (rd) {
  // (2026-11-09) the hero's summary measures the old landing: the island chunk, the two posters, the two tiers. The
  // redesigned page has none of them, so it is not printed there; the page's own lines follow section 4's and 5's
  console.log('the landing page is the redesign (main.rd): no island, no poster and no tier to sum; its own lines are below, under "the redesigned landing"');
  console.log(`quiz JS (lazy chunk, fetched within a screen of the quiz):          ${fmt(quizJs)}`);
} else {
  console.log(`critical JS (inline scripts + module scripts + static imports): ${fmt(critical)}`);
  console.log(`quiz JS (lazy chunk, fetched within a screen of section 3):     ${fmt(quizJs)}`);
  console.log(`total JS (critical + island chunk + lazy quiz chunk):           ${fmt(totalJs)}`);
  for (const cls of ['portrait', 'wide']) {
    console.log(`poster ${cls} (AVIF, raw):                                     ${fmt(poster(cls))}`);
    console.log(`first view, poster tier, ${cls}: page + Open Sans + poster:    ${fmt(page + openSans + poster(cls))}`);
    console.log(`first view, 3D tier, ${cls}: + all JS + island data:           ${fmt(page + openSans + poster(cls) + totalJs + island)}`);
  }
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
const productsBin = storedOf((f) => f.products);
const loop = (id, cls) => maxOf((f) => f.group === 'room loop' && f.id === id && f.cls === cls);
const pic = (id, cls, fmt) => maxOf((f) => f.group === 'room scene' && f.id === id && f.cls === cls && f.fmt === fmt);
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
line("section 4's script (director, carousel, video, walk, lazy; gzip)", roomScript, 38, { pendingKB: 30, note: "Sam's 30 KB line, pending him (spec 11, item 1); the build stops above the spec's 38 KB" });
line('scroll.ts (its own chunk, marker skreed:scroll; gzip)', scrollScript, 4, { note: 'counted in total JS, not critical JS' });
// section 5's lines (section-5.md 6, as rebuilt to Sam's picture on 2026-11-02)
const signupDomScript = gzOf(signupDomGraph);
// 7 KB since 2026-11-03 (section-5-picture.md 9, 16.6 and 18): the sixteen states' picture URLs and tops ride this chunk
// (scripts/signup/jar-srcs.ts), not the first view's markup, and the loop's trigger at the page's end came on 2026-11-03;
// 6.4 KB measured on 2026-11-03 against the 6.5 KB line set from the measure of 2026-11-02 (6 KB was the old page's)
// (2026-11-09) section 5 has its own page since the redesign and may be on the landing page too: PAGE5 says where
// these lines found it (nothing is added for the site before the redesign, whose one section 5 is the landing's)
const PAGE5 = rd || JARS ? `; section 5 is on ${pages5.map((p) => p.at).join(' and ') || 'no page of this build'}` : '';
line("section 5's page script (scripts/signup/signup.ts, marker skreed:signup-filled; gzip)", signupDomScript, 7, { note: (signupDomScript ? 'lazy, within a screen; the states\' URLs ride it' : signupDomElsewhere.length ? `bundled into ${signupDomElsewhere.join(', ')}, counted there` : 'not in this build') + PAGE5 });
const signupFormScript = gzOf(signupFormGraph);
line("section 5's email form (scripts/signup/form.ts with the email code, marker suCodePill; gzip)", signupFormScript, 4, { note: signupFormScript ? 'lazy, fetched by the page script where the form is rendered' : 'not in this build (PUBLIC_LEADS off)' });
// (2026-11-09, docs/specs/redesign.md D17) this total is the old landing's, summed over the hero's walk: on the
// redesigned landing that walk does not run, and the page's whole graph has its own 250 KB line below, which counts
// every chunk this one counted and the ones it never followed
if (!rd) line('total JS with sections 4 and 5 and scroll.ts (gzip)', totalJs + roomScript + scrollScript + signupDomScript + signupFormScript, 250, { enforced: !tune, note: tune ? "production's line; this staging build carries Tune" : 'production' });
// the section's two type faces (D3: Inter and Jost, variable, latin, the Google Fonts files shipped unchanged), as stored
// (woff2 is compressed already); fetched only once the section's lines render, so never in the first view
const S5_FONTS = ['inter-opsz-wght-latin.woff2', 'jost-wght-latin.woff2'];
const s5Fonts = S5_FONTS.filter((n) => existsSync(join(dist, 'fonts', n)));
for (const n of s5Fonts) add('signup font', `/fonts/${n}`, join(dist, 'fonts', n));
line("section 5's fonts, Inter and Jost together (woff2, stored)", s5Fonts.reduce((a, n) => a + raw(join(dist, 'fonts', n)), 0), 100, { note: s5Fonts.length === S5_FONTS.length ? S5_FONTS.join(' + ') : `${s5Fonts.length} of ${S5_FONTS.length} in this build${s5Fonts.length ? `: ${s5Fonts.join(', ')}` : ''}` });
// the jar pictures (C2): each at 2x under its line (AVIF 45 KB, WebP 60 KB), the 1x printed beside them, and every one
// of the sixty-four names in the build
const JAR_PIC = { avif: 45, webp: 60 };
const jarPics = room.filter((x) => x.group === 'signup jar' && SHIPS.has(x.fmt));
for (const f of jarPics.filter((x) => x.size === '2x')) line(`jar ${f.id} at 2x, ${FMT[f.fmt]}`, f.stored, JAR_PIC[f.fmt], { note: f.name });
for (const fmt of ['avif', 'webp']) { const one = jarPics.filter((x) => x.size === '1x' && x.fmt === fmt); if (one.length) line(`the jar pictures at 1x, ${FMT[fmt]} (the largest of ${one.length})`, Math.max(...one.map((x) => x.stored)), JAR_PIC[fmt], { enforced: false, note: 'no line of their own: read against the 2x line' }); }
// the names are read in the source folder: the build emits byte-identical files once (Rollup's asset dedupe), and the
// page's URLs for such states then share the one file, so dist may carry fewer than sixty-four. A page with no
// section#signup (the unit tests' small dists) needs none
const JAR_SRC = join(ROOT, 'src/assets/signup/jars'), jarSrc = new Set(existsSync(JAR_SRC) ? readdirSync(JAR_SRC) : []);
const jarNames = JAR_STATES.flatMap((id) => ['1x', '2x'].flatMap((size) => ['avif', 'webp'].map((fmt) => `jar-${id}-${size}.${fmt}`)));
const jarMissing = jarNames.filter((n) => !jarSrc.has(n));
// (2026-11-09) on any page that mounts section 5, not the landing page alone
const hasSignup = pages5.length > 0;
if (hasSignup && jarMissing.length) faults.push(`section 5's jar pictures: ${jarMissing.length} of ${jarNames.length} C2 names missing from src/assets/signup/jars (${jarMissing.slice(0, 8).join(', ')}${jarMissing.length > 8 ? ', ...' : ''})`);
if (hasSignup && !jarMissing.length && !jarPics.length) faults.push("section 5's jar pictures: none in the build (the page imports src/assets/signup/jars)");
if (jarPics.length) line("section 5's jar pictures in dist, every size and format (stored)", jarPics.reduce((a, x) => a + x.stored, 0), jarNames.length * JAR_PIC.webp, { enforced: false, note: `${jarPics.length} file(s) for the ${jarNames.length} names, all ${jarNames.length - jarMissing.length} in the source folder; byte-identical renders are emitted once` });
line('section 4 on the poster tier: its script (gzip)', posterScript, 8.5);
// each loop, each still, products.bin
const PIC = { wide: { avif: 110, webp: 176 }, portrait: { avif: 80, webp: 128 } };
for (const id of scenes) for (const cls of CLASSES) line(`loop ${id}, ${cls} (${cls === 'wide' ? '1328 x 692' : '720 x 1280'}, 5.0 s)`, loop(id, cls), 1200, { note: loop(id, cls) ? '' : 'not in this build' });
for (const f of room.filter((x) => x.group === 'room scene' && SHIPS.has(x.fmt))) line(`still ${f.id}: ${f.cls}, ${FMT[f.fmt]}`, f.stored, PIC[f.cls][f.fmt], { note: f.name });
line('products.bin', productsBin, 1000, { note: productsBin ? 'u16 positions, i8 normals, u16 indices; the AirPods Max at full detail since 2026-10-26' : 'not in this build' });
// to scene 1 (script excluded; the press's line until the hall left): products.bin, scene 1's loop and still, per class and format
for (const fmt of ['avif', 'webp']) for (const cls of CLASSES) {
  line(`to scene 1, ${cls}, ${fmt === 'avif' ? 'AVIF' : 'WebP-only browsers'} (script excluded)`, productsBin + loop(scene1, cls) + pic(scene1, cls, fmt), 2500, { note: `scene 1 is ${scene1}; products.bin carries the AirPods Max at full detail` });
}
// the whole section in dist: the ten loops, the twenty stills, products.bin
line('the whole section in dist', storedOf((f) => f.group === 'room loop' || f.group === 'room scene' || !!f.products), 15800, { note: `${room.filter((f) => f.group === 'room loop').length} loop(s), ${room.filter((f) => f.group === 'room scene').length} still(s)` });
// one visit, per class and format: the class's five loops and five stills, products.bin
for (const fmt of ['avif', 'webp']) for (const cls of CLASSES) {
  const bytes = scenes.reduce((a, id) => a + loop(id, cls) + pic(id, cls, fmt), 0) + productsBin;
  line(`one visit, ${cls}, ${FMT[fmt]}`, bytes, 8100);
}
// the poster tier: the five scene stills, one class, one format
const POSTER = { avif: { portrait: 420, wide: 570 }, webp: { portrait: 660, wide: 900 } };
for (const fmt of ['avif', 'webp']) for (const cls of CLASSES) line(`the poster tier, ${cls}, ${FMT[fmt]}: the five scenes`, scenes.reduce((a, id) => a + pic(id, cls, fmt), 0), POSTER[fmt][cls]);
// AC8's formats. Each picture of the section, a scene still, ships as AVIF with its WebP twin, by the name before the
// hash. Each <img> in the page that names a scene still (its own src or srcset, or a <source> of its <picture>) carries
// width and height.
const stemOf = (name) => basename(name).replace(new RegExp(`\\.${H}\\.(?:${IMG})$`, 'i'), '');
const pics = room.filter((f) => ['room scene', 'signup jar'].includes(f.group));
const byStem = new Map();
for (const f of pics) {
  // a picture in any other format is refused, and kept out of the lines and the twin check (AC8: AVIF with WebP only)
  if (!SHIPS.has(f.fmt)) { faults.push(`${basename(f.name)}: ${FMT[f.fmt] ?? f.fmt} is not a format the section ships (AC8: each picture AVIF with its WebP twin)`); continue; }
  byStem.set(stemOf(f.name), new Set([...(byStem.get(stemOf(f.name)) ?? []), f.fmt]));
}
for (const [stem, fmts] of byStem) for (const [has, lacks] of [['avif', 'webp'], ['webp', 'avif']]) if (fmts.has(has) && !fmts.has(lacks)) faults.push(`${stem}: ${FMT[has]} without its ${FMT[lacks]} twin (AC8: the pictures are AVIF with WebP)`);
for (const f of room.filter((x) => x.stray)) faults.push(`${basename(f.name)}: not a file the section ships (the ten loops, their stills and products.bin)`);
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
// section 5's first view: its markup and signup.css, the same way
// (2026-11-09) once for each page that mounts section 5 (pages5): the landing page, the jars' own, or both. The site
// before the redesign has the one line it always had, under the name it always had
/** a section's markup from its opening tag at `at` to its own closing tag */
const sectionAt = (page, at) => { const re = /<\/?section\b[^>]*>/g; re.lastIndex = at; let d = 0; for (let m; (m = re.exec(page));) { d += m[0][1] === '/' ? -1 : 1; if (!d) return page.slice(at, re.lastIndex); } return ''; };
const css5Path = join(ROOT, 'src/styles/signup.css');
const css5 = existsSync(css5Path) ? readFileSync(css5Path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}') : '';
// 6 KB since 2026-11-06 (section-5-picture.md 22): the Followed ticks' three labels and their rules took the page from 5,568 B
// to 5,782 B against the 5.5 KB line of 2026-11-03 (section-5-picture.md 9, 16.6 and 18: the picture's page with the four inline
// marks, the joined field and button, the pictures' sources and jar 4's two layers; 5.0 KB measured on 2026-11-03, 45 B under
// the 5 KB line set from the measure of 2026-11-02; 4 KB was the old page's)
for (const p of pages5.length ? pages5 : [{ at: '/', page: '' }]) {
  const at5 = p.page.search(SECTION5), markup5 = at5 >= 0 ? sectionAt(p.page, at5) : '';
  line(`the first view: section 5's markup and signup.css (gzip)${rd || JARS ? (pages5.length ? `, on ${p.at}` : ', on no page of this build') : ''}`, gzipSync(markup5 + css5, { level: 9 }).length, 6, { note: `markup ${markup5.length} B, signup.css about ${css5.length} B` });
}

// ---- the redesigned landing's own lines (docs/specs/redesign.md section 8 and D17; added 2026-11-09), each a threshold ----
const rdLines = [], rdFaults = [];
let rdFormats = '';
if (rd || jars) {
  const rline = (name, bytes, limitKB, { enforced = true, note = '' } = {}) => rdLines.push({ name, bytes, limit: limitKB * KB, pending: 0, enforced, note });
  /** a chunk that reads as the old island's: three.js keeps its renderer's name in the messages it logs, whatever the minifier does */
  const OLD_ISLAND = /WebGLRenderer/;
  const lazyNote = (g) => { const n = [...g.all].filter((c) => !g.critical.has(c)); return `${g.all.size} chunk(s), ${n.length} of them by import()${n.length ? `: ${n.map((c) => basename(c).replace(/\.[A-Za-z0-9_-]+\.js$/, '')).sort().join(', ')}` : ''}`; };
  const graphFaults = (g, where) => {
    for (const c of [...g.missing].sort()) rdFaults.push(`${c}: ${where} names this chunk and the build does not hold it, so its bytes cannot be counted`);
    for (const c of [...g.all].sort()) if (OLD_ISLAND.test(readFileSync(join(dist, c), 'utf8'))) rdFaults.push(`${c}: reads as the old island's (three.js, by the text WebGLRenderer) and ${where} can reach it (docs/specs/redesign.md D2 and criterion 9)`);
  };
  if (rd) {
    rline('critical JS: the page\'s inline scripts, its module scripts and their static imports (gzip)', rd.criticalGz, 60, { note: `${rd.inline.length} inline, ${rd.critical.size} chunk(s)` });
    rline('total JS: every chunk the page can reach, by a static import or by import() (gzip)', rd.totalGz, 250, { note: lazyNote(rd) });
    graphFaults(rd, 'the landing page');

    // the pictures. A candidate is one entry of a srcset (or the <img>'s own src): its file and its descriptor
    const attrOf = (tag, name) => tag?.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v !== undefined);
    const candidates = (srcset) => (srcset ?? '').split(',').map((c) => c.trim()).filter(Boolean).map((c) => { const [url, d = ''] = c.split(/\s+/); return { url, d }; });
    const extOf = (url) => url.replace(/[?#].*$/, '').match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase() ?? '';
    const RASTER = { jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', gif: 'GIF' };   // AC8 and CHECKLIST C2: AVIF with WebP, no other raster format
    const fileOf = (url) => (url.startsWith('/') ? join(dist, url.replace(/[?#].*$/, '')) : null);
    const storedAt = (url) => { const f = fileOf(url); return f && existsSync(f) ? raw(f) : 0; };
    const widths = (list) => [...new Set(list.map((c) => c.d).filter((d) => /^\d+w$/.test(d)))].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const blocks = [...html.matchAll(/<picture\b[\s\S]*?<\/picture>/gi)].map((m) => ({ at: m.index, end: m.index + m[0].length, text: m[0] }));
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ at: m.index, tag: m[0] }));
    const ofImg = (tag) => [...candidates(attrOf(tag, 'srcset')), ...(attrOf(tag, 'src') ? [{ url: attrOf(tag, 'src'), d: '' }] : [])];
    const label = (list, fallback) => (list[0] ? basename(list[0].url.replace(/[?#].*$/, '')) : fallback);
    const read = (b) => {
      const sources = [...b.text.matchAll(/<source\b[^>]*>/gi)].map((m) => m[0]);
      const img = b.text.match(/<img\b[^>]*>/i)?.[0] ?? null;
      const typed = (type) => sources.filter((t) => (attrOf(t, 'type') ?? '').toLowerCase() === type).flatMap((t) => candidates(attrOf(t, 'srcset')));
      const all = [...sources.flatMap((t) => candidates(attrOf(t, 'srcset'))), ...(img ? ofImg(img) : [])];
      // the WebP twin is a <source type="image/webp"> (RdPicture.astro) or the <img>'s own WebP (the quiz's pictures)
      const webpSource = typed('image/webp');
      return { sources, img, all, avif: typed('image/avif'), webp: webpSource.length ? webpSource : (img ? ofImg(img) : []).filter((c) => extOf(c.url) === 'webp') };
    };
    // A <picture> or an <img> that names no file is a shell a script fills (jar 4's second layer in section 5, which
    // closes the page since D18): it fetches nothing as built, so it has no format and no laziness to check, only its box
    for (const b of blocks) {
      const pic = read(b), name = label(pic.all, 'with no file');
      if (!pic.all.length) continue;
      if (!pic.avif.length) rdFaults.push(`a <picture> of ${name}: no <source type="image/avif"> (CHECKLIST C2: AVIF with its WebP twin)`);
      for (const c of pic.avif) if (extOf(c.url) !== 'avif') rdFaults.push(`a <picture> of ${name}: its AVIF source lists ${basename(c.url)}, which is not an AVIF`);
      if (!pic.webp.length) rdFaults.push(`a <picture> of ${name}: no WebP twin, neither a <source type="image/webp"> nor the <img>'s own (CHECKLIST C2)`);
      const [wa, ww] = [widths(pic.avif), widths(pic.webp)];
      if (pic.avif.length && pic.webp.length && wa.join() !== ww.join()) rdFaults.push(`a <picture> of ${name}: AVIF at ${wa.join(', ') || 'no width'} but WebP at ${ww.join(', ') || 'no width'} (each width has its twin)`);
      if (!pic.img) rdFaults.push(`a <picture> of ${name}: no <img>`);
      for (const t of [...pic.sources, ...(pic.img ? [pic.img] : [])]) if (widths(candidates(attrOf(t, 'srcset'))).length && !attrOf(t, 'sizes')) rdFaults.push(`a <picture> of ${name}: a srcset by width with no sizes (CHECKLIST C2: sizes set)`);
    }
    const inPicture = (i) => blocks.some((b) => i.at >= b.at && i.at < b.end);
    const fetched = imgs.filter((i) => ofImg(i.tag).length);   // the <img>s that name a file, in the page's order
    for (const i of imgs) {
      const mine = ofImg(i.tag), name = label(mine, 'with no file');
      if (!(/\swidth\s*=/.test(i.tag) && /\sheight\s*=/.test(i.tag))) rdFaults.push(`an <img> of ${name}: no width and height (CHECKLIST C2; nothing may move when it arrives)`);
      if (!mine.length) continue;
      const lazy = (attrOf(i.tag, 'loading') ?? '').toLowerCase() === 'lazy';
      if (i === fetched[0] && lazy) rdFaults.push(`the first <img> of the page (${name}) is lazy: the first screen's picture loads at once (docs/specs/redesign.md D9)`);
      if (i !== fetched[0] && !lazy) rdFaults.push(`an <img> of ${name}: not loading="lazy", and it is not the first of the page (CHECKLIST C2: lazy below the first screen)`);
      if (!inPicture(i) && widths(mine).length && !attrOf(i.tag, 'sizes')) rdFaults.push(`an <img> of ${name}: a srcset by width with no sizes (CHECKLIST C2: sizes set)`);
    }
    // every file a <picture> or an <img> names: in the build, and never a JPEG, PNG or GIF
    const named = new Map();
    for (const c of [...blocks.flatMap((b) => read(b).all), ...imgs.flatMap((i) => ofImg(i.tag))]) named.set(c.url.replace(/[?#].*$/, ''), c);
    for (const url of [...named.keys()].sort()) {
      if (RASTER[extOf(url)]) rdFaults.push(`${basename(url)}: ${RASTER[extOf(url)]} is not a format the page ships (CHECKLIST C2: each picture AVIF with its WebP twin)`);
      const f = fileOf(url);
      if (f && !existsSync(f)) rdFaults.push(`${url}: the page names this picture and the build does not hold it`);
    }

    // the first screen's picture: the <picture> the page's first <img> sits in (the hero's). Its largest AVIF is the
    // line (CLAUDE.md: hero image under 120 KB); its largest WebP is printed beside it, read against the same figure
    const first = fetched[0] ? blocks.find((b) => fetched[0].at >= b.at && fetched[0].at < b.end) : undefined;
    const firstPic = first ? read(first) : null;
    const largest = (list) => list.reduce((a, c) => (storedAt(c.url) > storedAt(a.url) ? c : a), list[0]);
    const heroAvif = firstPic?.avif.length ? largest(firstPic.avif) : null, heroWebp = firstPic?.webp.length ? largest(firstPic.webp) : null;
    if (!heroAvif) rdFaults.push('the first screen: the page\'s first <img> is in no <picture> with an AVIF source, so there is no hero picture to hold to 120 KB');
    rline('the first screen\'s picture: the hero\'s largest AVIF (stored)', heroAvif ? storedAt(heroAvif.url) : 0, 120, { note: heroAvif ? `${heroAvif.url}${heroAvif.d ? `, ${heroAvif.d}` : ''}` : 'none found' });
    if (heroWebp) rline('the first screen\'s picture: its largest WebP, for a browser without AVIF (stored)', storedAt(heroWebp.url), 120, { enforced: false, note: `${heroWebp.url}${heroWebp.d ? `, ${heroWebp.d}` : ''}; no line of its own: read against the AVIF's` });
    // a picture the page preloads is the one the first screen draws, or it is fetched for nothing
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      if (!/\brel\s*=\s*["']?preload\b/i.test(m[0]) || (attrOf(m[0], 'as') ?? '').toLowerCase() !== 'image') continue;
      const drawn = new Set((firstPic?.all ?? []).map((c) => c.url));
      for (const c of [...candidates(attrOf(m[0], 'imagesrcset')), ...(attrOf(m[0], 'href') ? [{ url: attrOf(m[0], 'href'), d: '' }] : [])]) if (!drawn.has(c.url)) rdFaults.push(`${c.url}: preloaded, and the first screen's picture does not draw it (docs/specs/redesign.md D9)`);
    }
    // the first view (CLAUDE.md: under 1.5 MB; spec 8 aims under 400 KB): the page with its inline CSS and scripts,
    // its critical chunks, the fonts it preloads and the first screen's picture at its largest
    const fontsStored = rows.filter((r) => r.group === 'font').reduce((a, r) => a + r.raw, 0);
    const fontNames = rows.filter((r) => r.group === 'font').map((r) => basename(r.name).replace(/\.woff2$/, ''));
    rline('the first view: the page, its critical JS, the fonts it preloads and the first screen\'s picture at its largest', rows[0].gz + (rd.criticalGz - rd.inlineGz) + fontsStored + (heroAvif ? storedAt(heroAvif.url) : 0), 1500,
      { note: `page ${fmt(rows[0].gz).trim()} gzip, chunks ${fmt(rd.criticalGz - rd.inlineGz).trim()} gzip, ${fontNames.length} font(s) ${fmt(fontsStored).trim()}${fontNames.length ? ` (${fontNames.join(', ')})` : ''}; spec 8 aims under 400 KB` });
    // the four display faces (spec D7, D20 and section 8), each at the cap scripts/fonts/build-redesign.py cuts it to, and what
    // the first view asks for of them. A face no page of this build carries reads 0, as section 4's lines do
    const fontsPreloaded = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((t) => /\brel\s*=\s*["']?preload\b/i.test(t) && (attrOf(t, 'as') ?? '').toLowerCase() === 'font').map((t) => attrOf(t, 'href'));
    for (const { file, what, capKB, when } of [
      { file: 'rubik-900-caps.woff2', what: 'Rubik Black, DIFFERENT at rest', capKB: 12, when: 'its words are in the first screen' },
      { file: 'rubik-glitch-400-caps.woff2', what: 'Rubik Glitch, DIFFERENT inside a burst', capKB: 30, when: 'fetched after the first paint, for the first burst' },
      { file: 'skreed-wide-400-caps.woff2', what: 'Skreed Wide, MATCH ESSENTIALS', capKB: 12, when: 'fetched when its words near' },
      { file: 'windsong-400-lower.woff2', what: 'WindSong, the three blobs\' words', capKB: 16, when: 'fetched when its words near' },
    ]) {
      const at = join(dist, 'fonts', file);
      rline(`a display face: ${what} (woff2, stored)`, existsSync(at) ? raw(at) : 0, capKB, { note: !existsSync(at) ? 'not in this build' : fontsPreloaded.includes(`/fonts/${file}`) ? 'preloaded, in the first view' : when });
    }
    // D20: "use that same font ... just without the distorted part": the word stands in the first screen, so its face comes with it
    if (/\bclass="rd-hero-word"/.test(html) && !fontsPreloaded.includes('/fonts/rubik-900-caps.woff2')) rdFaults.push('/fonts/rubik-900-caps.woff2: DIFFERENT is drawn in the first screen and its face is not preloaded (docs/specs/redesign.md D20)');
    // D19: "only when it glitches it should have that distorted effect": hero.ts fetches the torn face after the first paint
    if (fontsPreloaded.includes('/fonts/rubik-glitch-400-caps.woff2')) rdFaults.push('/fonts/rubik-glitch-400-caps.woff2: preloaded, and the torn face is drawn only inside a burst, no part of the first paint (docs/specs/redesign.md D19)');
    const shells = imgs.length - fetched.length;
    rdFormats = `${blocks.length} <picture>(s), each an AVIF source with its WebP twin at the same widths; ${imgs.length} <img>, each with width and height, the first loaded at once and every other lazy${shells ? ` (${shells} a shell that names no file until a script fills it)` : ''}; none of the ${rd.all.size} chunk(s) the page can reach reads as the old island's`;
  }
  if (jars) {
    // the jars' own page (spec D1): the site's two script lines, read on its own graph
    rline('/jars/: critical JS, its inline scripts, module scripts and their static imports (gzip)', jars.criticalGz, 60, { note: `${jars.inline.length} inline, ${jars.critical.size} chunk(s)` });
    rline('/jars/: total JS, every chunk the page can reach (gzip)', jars.totalGz, 250, { note: lazyNote(jars) });
    graphFaults(jars, "the jars' page");
    if (!rd) rdFormats = `none of the ${jars.all.size} chunk(s) the jars' page can reach reads as the old island's`;
  }
}

console.log(`\nsections 4 and 5 (section-4-flux.md 6, section-5.md 6; the ${BUILD}; scripts at gzip, everything else as stored; KB = 1024 B)`);
// (2026-11-09) said once, so a column of zeros is not read as a section that weighs nothing
if (!/<section\b[^>]*\bid="room"/.test(html)) console.log('  section 4 is on no page of this build (the landing page has no section#room): its lines read 0 here and stand for a build that mounts it');
const PENDING = 'over, pending Sam';
const printLines = (list) => {
  for (const l of list) {
    const over = l.bytes > l.limit, waits = !over && l.pending > 0 && l.bytes > l.pending;
    const status = over ? (l.enforced ? 'OVER' : 'over') : waits ? PENDING : 'ok';
    const tail = [l.note, over && !l.enforced ? 'not enforced here' : ''].filter(Boolean).join('; ');
    console.log(`  ${status.padEnd(PENDING.length)} ${fmt(l.bytes)} of ${fmt(over ? l.limit : l.pending || l.limit)}  ${l.name}${tail ? `  (${tail})` : ''}`);
  }
};
printLines(lines);
console.log(`  ${(faults.length ? 'FAIL' : 'ok').padEnd(PENDING.length)} formats: ${byStem.size} picture(s) by name, AVIF with WebP; ${sceneImgs} scene <img> in the page, with width and height`);
for (const f of faults) console.log(`  ${''.padEnd(PENDING.length)} ${f}`);
console.log("  not measured here: the pixel sizes (the loops 1328 x 692 and 720 x 1280, the stills 1280 x 666 and 720 x 1280), the loops' length (5.0 s), frames (120), codec (H.264 High) and missing audio track (tests/unit/room-flux.test.ts reads them), the GPU memory (the review reads __s4.state().memory), the frame cost (the probe), the Higgsfield credits (the ledger), the cloud (generated, 0 B)");
if (rd || jars) {
  console.log(`\n${rd ? `the redesigned landing${jars ? " and the jars' own page" : ''}` : "the jars' own page"} (docs/specs/redesign.md 8 and D17; the ${BUILD}; scripts and the page at gzip, fonts and pictures as stored; KB = 1024 B)`);
  printLines(rdLines);
  console.log(`  ${(rdFaults.length ? 'FAIL' : 'ok').padEnd(PENDING.length)} formats: ${rdFormats}`);
  for (const f of rdFaults) console.log(`  ${''.padEnd(PENDING.length)} ${f}`);
  console.log('  not measured here: LCP and the Lighthouse score (CHECKLIST C4: run Lighthouse on the served build), each picture\'s pixels against the box it is drawn in, the faces a first screen draws without a preload, the family pages (scripts/case-model/budget.mjs)');
}
const all = [...lines, ...rdLines], allFaults = [...faults, ...rdFaults];
const broken = all.filter((l) => l.enforced && l.bytes > l.limit), waiting = all.filter((l) => l.bytes <= l.limit && l.pending > 0 && l.bytes > l.pending);
const pendingNote = waiting.length ? `; ${waiting.length} over Sam's figure, pending him: ${waiting.map((l) => `${l.name} at ${fmt(l.bytes).trim()} against his ${fmt(l.pending).trim()}`).join(', ')}` : '';
// (2026-11-09) the two closing lines name the redesign's section 8 beside section-4-flux.md 6 where its lines were read
const RULES = rd || jars ? "section-4-flux.md 6, AC8 and docs/specs/redesign.md 8" : 'section-4-flux.md 6 and AC8';
if (broken.length || allFaults.length) {
  console.error(`\nbudget: ${RULES} do not hold:\n${[...broken.map((l) => `  ${l.name}: ${fmt(l.bytes).trim()} over ${fmt(l.limit).trim()}`), ...allFaults.map((f) => `  ${f}`)].join('\n')}${pendingNote ? `\n(and${pendingNote.slice(1)})` : ''}`);
  process.exit(1);
}
console.log(`\nbudget: every enforced line of section-4-flux.md 6${rd || jars ? ' and of docs/specs/redesign.md 8' : ''} holds (${all.filter((l) => l.enforced).length} enforced) and ${rd || jars ? "the formats check, AC8's and the redesign's" : "AC8's formats check"}${pendingNote}`);
