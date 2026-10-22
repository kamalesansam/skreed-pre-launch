// Section 4's build modes (docs/specs/section-4-flux.md 5 "Build modes", AC7 and AC8). scripts/csp.mjs writes media-src
// 'self' in every mode, run on a tiny dist in a temporary folder, both on its own and through package.json's own script
// text with astro build left out; astro.config.mjs carries no pick, no alias and no stub (gone with the lands, X-11), and
// optimizeDeps carries RoomEnvironment because the carousel imports it; the post-build guard wants exactly the ten scene
// loops and refuses any other video, any land, park, garden or clip asset and a media-src that is not 'self';
// scripts/hero/budget.mjs exits 1 on a broken line or a failed format check, prints Sam's pending line as such, counts
// scroll.ts by its marker on its own line, and keeps a scene still out of the hero's posters.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../../astro.config.mjs';
import { CLASSES, LOOP_NAME, SCENE_IDS, isLandAsset, readMode } from '../../scripts/room/guards.mjs';
import * as guards from '../../scripts/room/guards.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string>; '//build-modes'?: string };
// the children never inherit a Tune flag or a hooks flag from the shell that runs the tests
const BASE: Record<string, string> = Object.fromEntries(Object.entries(process.env).filter((e): e is [string, string] => e[1] !== undefined && !/^PUBLIC_(PARK_TRAVEL|TUNE|HERO_HOOKS|STAGING)$/.test(e[0])));
const temps: string[] = [];
after(() => { for (const d of temps) rmSync(d, { recursive: true, force: true }); });

const CSP_NONE = "  Content-Security-Policy: default-src 'self'; media-src 'none'; object-src 'none'";
const CSP_SELF = "  Content-Security-Policy: default-src 'self'; media-src 'self'; object-src 'none'";
/** a built dist in miniature: a page with an inline script and style, section 4's element, the /* rule, and any files given */
function fixture(files: Record<string, string | Buffer> = {}, csp?: string, page = ''): string {
  const dist = mkdtempSync(join(tmpdir(), 'skreed-modes-'));
  temps.push(dist);
  mkdirSync(join(dist, '_astro'));
  writeFileSync(join(dist, 'index.html'), `<!doctype html><html><head><style>p{margin:0}</style></head><body><script>window.x=1</script><section class="room" id="room"><p>Enter Skreed universe</p></section>${page}</body></html>`);
  writeFileSync(join(dist, '_headers'), ['/*', '  X-Content-Type-Options: nosniff', ...(csp ? [csp] : []), '/_astro/*', '  Cache-Control: public, max-age=31536000, immutable', ''].join('\n'));
  for (const [p, body] of Object.entries(files)) { mkdirSync(dirname(join(dist, p)), { recursive: true }); writeFileSync(join(dist, p), body); }
  return dist;
}
const run = (args: string[], env: Record<string, string> = {}) => spawnSync(process.execPath, args, { cwd: ROOT, env: { ...BASE, ...env }, encoding: 'utf8' });
const mediaSrc = (dist: string) => readFileSync(join(dist, '_headers'), 'utf8').match(/media-src ([^;]+);/)?.[1];
const kb = (n: number) => Buffer.alloc(n * 1024, 1);
/** the ten loops as a build names them, each n KB */
const loops = (n = 2) => Object.fromEntries(SCENE_IDS.flatMap((id) => CLASSES.map((cls) => [`_astro/${id}-${cls}.Ab3_x9Zq.mp4`, kb(n)])));

test("csp.mjs: media-src 'self' in every mode, with no flag and whatever the environment; a second run replaces its line", () => {
  for (const env of [{}, { PUBLIC_TUNE: '1' }, { PUBLIC_HERO_HOOKS: '1' }, { PUBLIC_PARK_TRAVEL: 'A' }]) {
    const dist = fixture();
    const r = run(['scripts/csp.mjs', '--dist', dist], env);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(mediaSrc(dist), "'self'", JSON.stringify(env));
    const headers = readFileSync(join(dist, '_headers'), 'utf8');
    assert.match(headers, /object-src 'none'; frame-src 'none'; worker-src 'none'/);
    assert.doesNotMatch(headers, /blob:/, 'the loops stream from their URL, never a blob');
    assert.equal(run(['scripts/csp.mjs', '--dist', dist], env).status, 0);
    assert.equal(readFileSync(join(dist, '_headers'), 'utf8').match(/Content-Security-Policy:/g)?.length, 1);
  }
  assert.doesNotMatch(readFileSync(join(ROOT, 'scripts/csp.mjs'), 'utf8'), /--media|PUBLIC_PARK_TRAVEL/, 'no media flag, no pick');
});

test('package.json: one build, no pick; build and build:staging run the budget and the guard, every mode gets media-src self', () => {
  for (const name of ['build', 'build:test', 'build:staging']) assert.doesNotMatch(pkg.scripts[name], /PUBLIC_PARK_TRAVEL|--media/, name);
  assert.match(pkg.scripts.build, /^PUBLIC_HERO_HOOKS=0 PUBLIC_TUNE=0 PUBLIC_STAGING=0 astro build && node scripts\/csp\.mjs && node scripts\/hero\/budget\.mjs dist --mode build && node scripts\/room\/guards\.mjs --post-build --mode build$/);
  assert.match(pkg.scripts['build:test'], /^PUBLIC_HERO_HOOKS=1 PUBLIC_TUNE=0 PUBLIC_STAGING=0 astro build && node scripts\/csp\.mjs$/);
  assert.match(pkg.scripts['build:staging'], /^PUBLIC_HERO_HOOKS=1 PUBLIC_TUNE=1 PUBLIC_STAGING=1 astro build && node scripts\/csp\.mjs && node scripts\/hero\/budget\.mjs dist --mode staging && node scripts\/room\/guards\.mjs --post-build --mode staging$/);
  // the note sits beside the scripts, not among them, so npm run cannot run it
  assert.ok(!Object.keys(pkg.scripts).some((k) => k.startsWith('//')), 'no note among the scripts');
  assert.match(pkg['//build-modes'] ?? '', /one build in every mode/);
  assert.doesNotMatch(pkg['//build-modes'] ?? '', /PUBLIC_PARK_TRAVEL|pick/);
  // each script as written, with astro build left out and the dist pointed at a fixture: media-src 'self' in every mode
  const chain = (name: string, dist: string) => pkg.scripts[name].replace(/\bastro build\b/, 'true')
    .replace('scripts/csp.mjs', `scripts/csp.mjs --dist '${dist}'`).replace(/budget\.mjs dist\b/, `budget.mjs '${dist}'`).replace('--post-build', `--post-build --dist '${dist}'`);
  for (const name of ['build', 'build:test', 'build:staging']) {
    const dist = fixture(loops());
    const r = spawnSync('sh', ['-c', chain(name, dist)], { cwd: ROOT, env: { ...BASE, PATH: `${join(ROOT, 'node_modules/.bin')}:${BASE.PATH ?? ''}` }, encoding: 'utf8' });
    assert.equal(r.status, 0, `${name}: ${r.stdout}${r.stderr}`);
    assert.equal(mediaSrc(dist), "'self'", name);
  }
});

test('astro.config.mjs: no pick, no alias and no stub; RoomEnvironment in optimizeDeps because carousel.ts alone imports it', () => {
  const plugins = (config.vite?.plugins ?? []) as unknown as { name?: string }[];
  assert.ok(!plugins.some((p) => p?.name === 'skreed:park-travel'), 'the alias is gone');
  assert.doesNotMatch(readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8'), /PUBLIC_PARK_TRAVEL|readPick|travel-stub/);
  assert.doesNotMatch(readFileSync(join(ROOT, 'src/env.d.ts'), 'utf8'), /PUBLIC_PARK_TRAVEL/);
  assert.ok(!('readPick' in guards) && !('PICKS' in guards) && !('travelChunkOption' in guards) && !('isParkAsset' in guards), 'the pick tables are gone from guards.mjs');
  for (const gone of ['universe.ts', 'travel-stub.ts', 'travel-depth.ts', 'travel-park.ts', 'travel-video.ts', 'travel.ts', 'world.ts']) assert.ok(!existsSync(join(ROOT, 'src/scripts/hero/section4', gone)), `${gone} is gone`);
  // section 4 part three's carousel.ts imports RoomEnvironment (its products under a PMREM of it, section-4-flux.md 3), so it is
  // pre-bundled: with an importer in src/ and the addon out of the list, dev discovers it at request time, re-optimises, and
  // answers open tabs with "504 Outdated Optimize Dep" until a reload. The list follows what src/ imports
  const ENV = 'three/addons/environments/RoomEnvironment.js';
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);
  const imports = new RegExp(`^\\s*import\\s+(?!type\\b)[^;]*?from\\s*['"]${ENV.replace(/[./]/g, '\\$&')}['"]`, 'm');
  const importers = walk(join(ROOT, 'src')).filter((f) => /\.(?:ts|js|mjs|astro)$/.test(f) && imports.test(readFileSync(f, 'utf8'))).map((f) => basename(f));
  assert.deepEqual(importers, ['carousel.ts'], 'carousel.ts alone imports RoomEnvironment');
  assert.equal((config.vite?.optimizeDeps?.include ?? []).includes(ENV), true, 'RoomEnvironment is in optimizeDeps while src/ imports it');
});

test('the mode: the flag first, then the environment, then build; anything else throws', () => {
  assert.equal(readMode([], {}), 'build');
  assert.equal(readMode([], { PUBLIC_HERO_HOOKS: '1' }), 'test');
  assert.equal(readMode([], { PUBLIC_TUNE: '1', PUBLIC_HERO_HOOKS: '1' }), 'staging');
  assert.equal(readMode(['--mode', 'test'], { PUBLIC_TUNE: '1' }), 'test');
  assert.throws(() => readMode(['--mode', 'production'], {}), /--mode must be one of/);
  assert.match('cove-wide.Ab3_x9Zq.mp4', LOOP_NAME); assert.match('dawn-portrait.x.mp4', LOOP_NAME);
  assert.doesNotMatch('cove-wide.mp4', LOOP_NAME); assert.doesNotMatch('clip-case-wallet-wide.Ab3_x9Zq.mp4', LOOP_NAME); assert.doesNotMatch('cove-wide.Ab3_x9Zq.webm', LOOP_NAME);
  for (const n of ['land-case-wide.Ab3_x9Zq.avif', 'park.Ab3_x9Zq.glb', 'park-lightmap.Ab3_x9Zq.avif', 'garden-plate.Ab3_x9Zq.avif', 'clip-case-wallet-wide.Ab3_x9Zq.mp4']) assert.ok(isLandAsset(n), n);
  for (const n of ['cove-wide.Ab3_x9Zq.avif', 'hall.Ab3_x9Zq.bin', 'director.Ab3_x9Zq.js', 'products.Ab3_x9Zq.bin']) assert.ok(!isLandAsset(n), n);
});

test('the post-build guard: exactly the ten loops in every mode, no other video, no land, park, garden or clip asset, media-src self', () => {
  const guard = (dist: string, mode: string) => run(['scripts/room/guards.mjs', '--post-build', '--dist', dist, '--mode', mode]);
  const ten = loops();
  const cases: [Record<string, Buffer | string>, string, string, number, RegExp?][] = [
    [ten, CSP_SELF, 'build', 0],
    [ten, CSP_SELF, 'test', 0],
    [ten, CSP_SELF, 'staging', 0],
    [{}, CSP_SELF, 'build', 1, /no loop cove-wide\.<hash>\.mp4 in the production build/],
    [Object.fromEntries(Object.entries(ten).slice(1)), CSP_SELF, 'build', 1, /no loop cove-wide/],
    [{ ...ten, '_astro/clip-case-wallet-wide.Ab3_x9Zq.mp4': kb(1) }, CSP_SELF, 'build', 1, /clip-case-wallet-wide.*not one of the ten scene loops/],
    [{ ...ten, 'media/extra.mp4': kb(1) }, CSP_SELF, 'staging', 1, /extra\.mp4: a video that is not one of the ten/],
    [{ ...ten, '_astro/park.Ab3_x9Zq.glb': kb(1) }, CSP_SELF, 'build', 1, /park\.Ab3_x9Zq\.glb: an asset of the lands/],
    [{ ...ten, '_astro/land-case-wide.Ab3_x9Zq.avif': kb(1) }, CSP_SELF, 'test', 1, /land-case-wide/],
    [{ ...ten, '_astro/garden-plate.Ab3_x9Zq.avif': kb(1) }, CSP_SELF, 'build', 1, /garden-plate/],
    [ten, CSP_NONE, 'build', 1, /media-src 'none', every build needs 'self'/],
    [ten, '', 'build', 1, /no Content-Security-Policy line/],
  ];
  for (const [files, csp, mode, status, msg] of cases) {
    const r = guard(fixture(files, csp || undefined), mode);
    assert.equal(r.status, status, `${mode} ${Object.keys(files).length} file(s): ${r.stdout}${r.stderr}`);
    if (msg) assert.match(r.stderr, msg);
  }
  // the reference scan is still the default mode, and it bans fluxtheory's names
  const r = run(['scripts/room/guards.mjs']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /nothing of the references/);
  assert.ok(guards.STRINGS.some((re) => re.test('fluxtheory')), 'fluxtheory is banned');
  for (const n of ['bathroom-1-c', 'bathroom-2', 'bathroom-5', 'lover-loop', 'lover-intro', 'dreamer-loop', 'dreamer-intro', 'dreamer-outro']) assert.ok(guards.NAMES.includes(n), n);
  for (const n of ['lover', 'dreamer']) assert.ok(!guards.NAMES.includes(n) && !guards.STRINGS.some((re) => re.test(n)), `${n} alone is English`);
});

const budget = (dist: string, ...flags: string[]) => run(['scripts/hero/budget.mjs', dist, ...flags]);
const twin = (id: string, cls: string, a: number, w: number) => ({ [`_astro/${id}-${cls}.Ab3_x9Zq.avif`]: kb(a), [`_astro/${id}-${cls}.Bc4_y0Zr.webp`]: kb(w) });
const pic = (id: string, cls: string) => `<picture><source data-srcset="/_astro/${id}-${cls}.Ab3_x9Zq.avif" type="image/avif"><img src="/_astro/${id}-${cls}.Bc4_y0Zr.webp" width="${cls === 'wide' ? 1280 : 720}" height="${cls === 'wide' ? 666 : 1280}" alt=""></picture>`;

test("budget.mjs: section 6's lines exit 1 when broken (a still, a loop, products.bin), and a scene still is never the hero's poster", () => {
  const page = `${pic('cove', 'portrait')}<picture><img src="/_astro/portrait.Pq7_k2Lm.avif" width="720" height="1280" alt=""></picture>`;
  // at the line passes, one byte over breaks it
  for (const [bytes, status] of [[80 * 1024, 0], [80 * 1024 + 1, 1]] as const) {
    const r = budget(fixture({ '_astro/cove-portrait.Ab3_x9Zq.avif': Buffer.alloc(bytes, 1), '_astro/cove-portrait.Bc4_y0Zr.webp': kb(20), '_astro/portrait.Pq7_k2Lm.avif': kb(30) }, undefined, page), '--mode', 'build');
    assert.equal(r.status, status, r.stdout + r.stderr);
    const posters = r.stdout.split('\n').filter((l) => /^poster {4,}/.test(l));   // the table's rows, not the summary's lines
    assert.equal(posters.length, 1);
    assert.match(posters[0], /\/_astro\/portrait\.Pq7_k2Lm\.avif$/);
    assert.match(r.stdout, /^room scene .*cove-portrait/m);
    if (status) assert.match(r.stderr, /still cove: portrait, AVIF/);
  }
  const broken = (files: Record<string, Buffer | string>, flags: string[], want: RegExp) => {
    const r = budget(fixture(files), ...flags);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, want);
  };
  broken({ ...twin('grove', 'wide', 10, 177) }, ['--mode', 'build'], /still grove: wide, WebP/);
  broken({ '_astro/ember-wide.Ab3_x9Zq.mp4': kb(1201) }, ['--mode', 'staging'], /loop ember, wide/);
  broken({ '_astro/products.Ab3_x9Zq.bin': kb(271) }, ['--mode', 'build'], /products\.bin/);
  broken({ '_astro/park.Ab3_x9Zq.glb': kb(1) }, ['--mode', 'build'], /park\.Ab3_x9Zq\.glb: not a file the section ships/);
  broken({ 'media/extra.mp4': kb(1) }, ['--mode', 'build'], /extra\.mp4: not a file the section ships/);
  // at the lines, everything passes, and every loop and still has its row
  const ok = budget(fixture({ ...loops(1200), ...SCENE_IDS.flatMap((id) => [twin(id, 'wide', 110, 176), twin(id, 'portrait', 80, 128)]).reduce((a, b) => ({ ...a, ...b }), {}), '_astro/products.Ab3_x9Zq.bin': kb(270) }), '--mode', 'build');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  for (const id of SCENE_IDS) for (const cls of CLASSES) assert.match(ok.stdout, new RegExp(`^ {2}ok +1200\\.0 KB of +1200\\.0 KB {2}loop ${id}, ${cls}`, 'm'));
  assert.match(ok.stdout, /^ {2}ok +270\.0 KB of +270\.0 KB {2}products\.bin/m);
  assert.match(ok.stdout, /the whole section in dist/);
  assert.match(ok.stdout, /one visit, portrait, AVIF/);
  assert.match(ok.stdout, /to the press, wide, AVIF/);
  assert.match(ok.stdout, /the poster tier, portrait, WebP/);
  assert.equal(budget(fixture(), '--mode', 'production').status, 1, 'an unknown mode stops the script');
});

test("budget.mjs: the section's script reads 'over, pending Sam' past his 30 KB and stops the build only past the spec's 38 KB; scroll.ts by its marker on its own line", () => {
  // the page's module import()s the island, and the island import()s section 4's director and the page scroll chunk
  // (known by their markers); random bytes, so the gzip size is the size
  const page = '<script type="module" src="/_astro/page.Ab3_x9Zq.js"></script>';
  const room = (n: number, scroll = 2) => ({ '_astro/page.Ab3_x9Zq.js': 'import("./hero.Bc4_y0Zr.js")', '_astro/hero.Bc4_y0Zr.js': 'import("./director.Cd5_z1Zs.js"); import("./scroll.De6_a2Zt.js")', '_astro/director.Cd5_z1Zs.js': Buffer.concat([Buffer.from('/*skreed:room*/'), randomBytes(n * 1024)]), '_astro/scroll.De6_a2Zt.js': Buffer.concat([Buffer.from('/*skreed:scroll*/'), randomBytes(scroll * 1024)]) });
  const row = (status: string) => new RegExp(`^ {2}${status} +[\\d.]+ KB of +${status === 'OVER' ? '38' : '30'}\\.0 KB {2}section 4's script`, 'm');
  for (const [n, status, code] of [[20, 'ok', 0], [33, 'over, pending Sam', 0], [39, 'OVER', 1]] as const) {
    const r = budget(fixture(room(n), undefined, page), '--mode', 'build');
    assert.equal(r.status, code, r.stdout + r.stderr);
    assert.match(r.stdout, row(status), `${n} KB`);
    assert.match(r.stdout, /^scroll js \(lazy\) .*scroll\.De6_a2Zt\.js$/m, 'scroll.ts in its own group');
    assert.doesNotMatch(r.stdout, /^room js \(lazy\) .*scroll\.De6_a2Zt\.js$/m, 'never in the section\'s');
    assert.match(r.stdout, /^ {2}ok +2\.\d KB of +4\.0 KB {2}scroll\.ts/m);
    if (status === 'over, pending Sam') assert.match(r.stdout, /holds .* 1 over Sam's figure, pending him: section 4's script .* at 33\.\d KB against his 30\.0 KB/);
    if (code) assert.match(r.stderr, /section 4's script .*: 39\.\d KB over 38\.0 KB/);
  }
  const big = budget(fixture(room(20, 5), undefined, page), '--mode', 'build');
  assert.equal(big.status, 1, 'scroll.ts over 4 KB stops the build');
  assert.match(big.stderr, /scroll\.ts .*: 5\.\d KB over 4\.0 KB/);
});

test("budget.mjs: AC8's formats, each picture AVIF with its WebP twin and each scene's <img> with width and height", () => {
  const sized = pic('cove', 'portrait');
  const ok = budget(fixture(twin('cove', 'portrait', 10, 16), undefined, sized), '--mode', 'build');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /^ {2}ok +formats: 1 picture\(s\) by name, AVIF with WebP; 1 scene <img> in the page/m);
  const fails = (files: Record<string, Buffer | string>, page: string, want: RegExp) => {
    const r = budget(fixture(files, undefined, page), '--mode', 'build');
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, want);
    assert.match(r.stdout, /^ {2}FAIL +formats:/m);
  };
  fails({ '_astro/cove-portrait.Ab3_x9Zq.avif': kb(10) }, sized, /cove-portrait: AVIF without its WebP twin/);
  fails({ '_astro/hall-lightmap.Bc4_y0Zr.webp': kb(4) }, '', /hall-lightmap: WebP without its AVIF twin/);
  fails(twin('cove', 'portrait', 10, 16), sized.replace(/ width="720" height="1280"/, ''), /a <picture> of cove-portrait\.Ab3_x9Zq\.avif: its <img> has no width and height/);
  fails(twin('cove', 'portrait', 10, 16), '<noscript><img src="/_astro/cove-portrait.Bc4_y0Zr.webp" width="720" alt=""></noscript>', /an <img> of cove-portrait\.Bc4_y0Zr\.webp has no width and height/);
  // a picture in any other format is found by its name all the same, refused, and its <img> held to width and height
  const jpg = budget(fixture({ ...twin('cove', 'portrait', 10, 16), '_astro/grove-wide.Cd5_z1Zs.jpg': kb(293), '_astro/hall-portrait.Ef7_b3Zu.jpeg': kb(4) }, undefined, `${sized}<noscript><img src="/_astro/grove-wide.Cd5_z1Zs.jpg" alt=""></noscript>`), '--mode', 'build');
  assert.equal(jpg.status, 1, jpg.stdout);
  assert.match(jpg.stderr, /grove-wide\.Cd5_z1Zs\.jpg: JPEG is not a format the section ships/);
  assert.match(jpg.stderr, /hall-portrait\.Ef7_b3Zu\.jpeg: JPEG is not a format/);
  assert.match(jpg.stderr, /an <img> of grove-wide\.Cd5_z1Zs\.jpg has no width and height/);
  assert.doesNotMatch(jpg.stdout, /still grove: wide, JPEG/, 'no line is measured for a format that does not ship');
});
