// Section 4's build modes (docs/specs/section-4-flux.md 5 "Build modes", AC7 and AC8). scripts/csp.mjs writes media-src
// 'self' in every mode, run on a tiny dist in a temporary folder, both on its own and through package.json's own script
// text with astro build left out; astro.config.mjs carries no pick, no alias and no stub (gone with the lands, X-11), and
// optimizeDeps carries RoomEnvironment because the carousel imports it; the post-build guard wants exactly the ten scene
// loops and refuses any other video, any land, park, garden or clip asset and a media-src that is not 'self';
// scripts/hero/budget.mjs exits 1 on a broken line or a failed format check, prints Sam's pending line as such, counts
// scroll.ts by its marker on its own line, and keeps a scene still out of the hero's posters.
// Since 2026-11-09 (docs/specs/redesign.md D17) both gates follow the page, and the rows at the foot of this file hold
// that: a build whose landing page mounts no section 4 ships no video and nothing of the scenes (the rows above keep the
// ten loops for a page that does mount it, every one of them as it was); a landing page that is the redesign (main.rd)
// is held to its own lines, critical JS, the total over every chunk it can reach, the first screen's picture and its
// formats; and section 5's lines are read on every page that mounts it, the jars' own page (D1) and the landing page
// where the jars close it (D18). What D19 and D20 changed of the page has rows of its own there too: its four display
// faces and what the first view asks for of them, no id said twice in a built page, one sign-up form at most, and no
// picture in the build that no page names.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../../astro.config.mjs';
import { CLASSES, LOOP_NAME, SCENE_IDS, formIds, idsSaidTwice, isHallAsset, isLandAsset, isProductsBin, isRedesign, isSceneAsset, mountsRoom, readMode } from '../../scripts/room/guards.mjs';
import * as guards from '../../scripts/room/guards.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string>; '//build-modes'?: string };
// the children never inherit a Tune flag or a hooks flag from the shell that runs the tests
const BASE: Record<string, string> = Object.fromEntries(Object.entries(process.env).filter((e): e is [string, string] => e[1] !== undefined && !/^PUBLIC_(PARK_TRAVEL|TUNE|HERO_HOOKS|STAGING)$/.test(e[0])));
const temps: string[] = [];
after(() => { for (const d of temps) rmSync(d, { recursive: true, force: true }); });

const CSP_NONE = "  Content-Security-Policy: default-src 'self'; media-src 'none'; object-src 'none'";
const CSP_SELF = "  Content-Security-Policy: default-src 'self'; media-src 'self'; object-src 'none'";
/** a built dist in miniature: a page with an inline script and style, section 4's element (left out with room: false, for a landing page that mounts no section 4; 2026-11-09), the /* rule, and any files given */
function fixture(files: Record<string, string | Buffer> = {}, csp?: string, page = '', { room = true }: { room?: boolean } = {}): string {
  const dist = mkdtempSync(join(tmpdir(), 'skreed-modes-'));
  temps.push(dist);
  mkdirSync(join(dist, '_astro'));
  writeFileSync(join(dist, 'index.html'), `<!doctype html><html><head><style>p{margin:0}</style></head><body><script>window.x=1</script>${room ? '<section class="room" id="room"><p>Phone case</p></section>' : ''}${page}</body></html>`);
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
  const envs: Record<string, string>[] = [{}, { PUBLIC_TUNE: '1' }, { PUBLIC_HERO_HOOKS: '1' }, { PUBLIC_PARK_TRAVEL: 'A' }];
  for (const env of envs) {
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
  assert.match(pkg.scripts.build, /^PUBLIC_HERO_HOOKS=0 PUBLIC_TUNE=0 PUBLIC_STAGING=0 PUBLIC_FAMILY_3D=on astro build && node scripts\/csp\.mjs && node scripts\/hero\/budget\.mjs dist --mode build && node scripts\/room\/guards\.mjs --post-build --mode build$/);
  assert.match(pkg.scripts['build:test'], /^PUBLIC_HERO_HOOKS=1 PUBLIC_TUNE=0 PUBLIC_STAGING=0 astro build && node scripts\/csp\.mjs$/);
  assert.match(pkg.scripts['build:staging'], /^PUBLIC_HERO_HOOKS=1 PUBLIC_TUNE=1 PUBLIC_STAGING=1 PUBLIC_FAMILY_3D=on astro build && node scripts\/csp\.mjs && node scripts\/hero\/budget\.mjs dist --mode staging && node scripts\/room\/guards\.mjs --post-build --mode staging$/);
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
  // the hall's model, lightmap and stills (section-4-no-hall.md AC1); never a chunk, a scene's file or products.bin
  for (const n of ['hall.Ab3_x9Zq.bin', 'hall.Ab3_x9Zq.glb', 'hall-lightmap.Ab3_x9Zq.avif', 'hall-portrait.Ab3_x9Zq.webp', 'hall-wide.Ab3_x9Zq.avif']) assert.ok(isHallAsset(n), n);
  for (const n of ['hall.Ab3_x9Zq.js', 'cove-wide.Ab3_x9Zq.avif', 'director.Ab3_x9Zq.js', 'products.Ab3_x9Zq.bin', 'challenge.Ab3_x9Zq.svg']) assert.ok(!isHallAsset(n), n);
});

// (the title names the page since 2026-11-09, docs/specs/redesign.md D17: every fixture of this row mounts section 4,
// and the rule for a page that does not is the first row under the line at the foot of this file; no assertion changed)
test('the post-build guard on a build whose landing page mounts section 4: exactly the ten loops in every mode, no other video, no land, park, garden, clip or hall asset, media-src self', () => {
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
    [{ ...ten, '_astro/hall.Ab3_x9Zq.bin': kb(1) }, CSP_SELF, 'build', 1, /hall\.Ab3_x9Zq\.bin: an asset of the hall/],
    [{ ...ten, '_astro/hall-portrait.Ab3_x9Zq.webp': kb(1) }, CSP_SELF, 'staging', 1, /hall-portrait\.Ab3_x9Zq\.webp: an asset of the hall/],
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
  broken({ '_astro/products.Ab3_x9Zq.bin': kb(1001) }, ['--mode', 'build'], /products\.bin/);   // the line is 1,000 KB since 2026-10-26 (the AirPods Max at full detail)
  broken({ '_astro/park.Ab3_x9Zq.glb': kb(1) }, ['--mode', 'build'], /park\.Ab3_x9Zq\.glb: not a file the section ships/);
  broken({ 'media/extra.mp4': kb(1) }, ['--mode', 'build'], /extra\.mp4: not a file the section ships/);
  // at the lines, everything passes, and every loop and still has its row
  const ok = budget(fixture({ ...loops(1200), ...SCENE_IDS.flatMap((id) => [twin(id, 'wide', 110, 176), twin(id, 'portrait', 80, 128)]).reduce((a, b) => ({ ...a, ...b }), {}), '_astro/products.Ab3_x9Zq.bin': kb(1000) }), '--mode', 'build');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  for (const id of SCENE_IDS) for (const cls of CLASSES) assert.match(ok.stdout, new RegExp(`^ {2}ok +1200\\.0 KB of +1200\\.0 KB {2}loop ${id}, ${cls}`, 'm'));
  assert.match(ok.stdout, /^ {2}ok +1000\.0 KB of +1000\.0 KB {2}products\.bin/m);
  assert.match(ok.stdout, /the whole section in dist/);
  assert.match(ok.stdout, /one visit, portrait, AVIF/);
  assert.match(ok.stdout, /to scene 1, wide, AVIF/, "the press's line, to scene 1 since the hall left");
  assert.doesNotMatch(ok.stdout, /to the press|the hall's still/);
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
  fails({ '_astro/hall-lightmap.Bc4_y0Zr.webp': kb(4) }, '', /hall-lightmap\.Bc4_y0Zr\.webp: not a file the section ships/);
  fails(twin('cove', 'portrait', 10, 16), sized.replace(/ width="720" height="1280"/, ''), /a <picture> of cove-portrait\.Ab3_x9Zq\.avif: its <img> has no width and height/);
  fails(twin('cove', 'portrait', 10, 16), '<noscript><img src="/_astro/cove-portrait.Bc4_y0Zr.webp" width="720" alt=""></noscript>', /an <img> of cove-portrait\.Bc4_y0Zr\.webp has no width and height/);
  // a picture in any other format is found by its name all the same, refused, and its <img> held to width and height
  const jpg = budget(fixture({ ...twin('cove', 'portrait', 10, 16), '_astro/grove-wide.Cd5_z1Zs.jpg': kb(293), '_astro/dawn-portrait.Ef7_b3Zu.jpeg': kb(4) }, undefined, `${sized}<noscript><img src="/_astro/grove-wide.Cd5_z1Zs.jpg" alt=""></noscript>`), '--mode', 'build');
  assert.equal(jpg.status, 1, jpg.stdout);
  assert.match(jpg.stderr, /grove-wide\.Cd5_z1Zs\.jpg: JPEG is not a format the section ships/);
  assert.match(jpg.stderr, /dawn-portrait\.Ef7_b3Zu\.jpeg: JPEG is not a format/);
  assert.match(jpg.stderr, /an <img> of grove-wide\.Cd5_z1Zs\.jpg has no width and height/);
  assert.doesNotMatch(jpg.stdout, /still grove: wide, JPEG/, 'no line is measured for a format that does not ship');
});

// ---- since 2026-11-09 (docs/specs/redesign.md D17, D1 and section 8): the two gates follow the page ----

/** the redesigned landing in miniature: main.rd around a body, and no section 4 */
const rdPage = (body = '') => `<main class="rd" id="main">${body}</main>`;
const rdFixture = (files: Record<string, string | Buffer> = {}, body = '', csp?: string, head = '') => fixture(files, csp, `${head}${rdPage(body)}`, { room: false });
/** n KB that gzip cannot shrink, so a chunk's gzip size is its size */
const rnd = (n: number) => randomBytes(Math.round(n * 1024));
/** a chunk: what it imports, as a bundler writes it, then n KB of weight */
const chunk = (code: string, n = 0) => Buffer.concat([Buffer.from(`${code};/*`), rnd(n)]);
/** the first screen's picture as RdPicture.astro writes it, and its four files (the largest AVIF `avif` bytes) */
const heroPic = (img = 'loading="eager" fetchpriority="high"', wh = 'width="1639" height="1639"') => `<picture><source type="image/avif" srcset="/_astro/hero-640.Ab3_x9Zq.avif 640w, /_astro/hero-1639.Ab3_x9Zq.avif 1639w" sizes="100vw"><source type="image/webp" srcset="/_astro/hero-640.Bc4_y0Zr.webp 640w, /_astro/hero-1639.Bc4_y0Zr.webp 1639w" sizes="100vw"><img src="/_astro/hero-1639.Bc4_y0Zr.webp" alt="" ${wh} ${img}></picture>`;
const heroFiles = (avif = 40 * 1024) => ({ '_astro/hero-640.Ab3_x9Zq.avif': kb(10), '_astro/hero-1639.Ab3_x9Zq.avif': Buffer.alloc(avif, 1), '_astro/hero-640.Bc4_y0Zr.webp': kb(12), '_astro/hero-1639.Bc4_y0Zr.webp': kb(50) });

test('the post-build guard follows the page (2026-11-09, docs/specs/redesign.md D17): with no section 4 on the landing page a build ships no video at all and nothing of the scenes, the lands or the hall; media-src self all the same', () => {
  const guard = (dist: string, mode = 'build') => run(['scripts/room/guards.mjs', '--post-build', '--dist', dist, '--mode', mode]);
  // the redesign's own files pass, in every mode
  // (each picture named by the page, since the guard refuses one that no page names: its own row, below)
  const own = { ...heroFiles(), '_astro/product-case-311.Ab3_x9Zq.webp': kb(1), '_astro/gsap.Ab3_x9Zq.js': 'x', '_astro/deck.Ab3_x9Zq.js': 'x', '_astro/jar-0-2x.Ab3_x9Zq.avif': kb(1) };
  const ownBody = `${heroPic()}<img src="/_astro/product-case-311.Ab3_x9Zq.webp" width="1" height="1" alt="" loading="lazy"><img src="/_astro/jar-0-2x.Ab3_x9Zq.avif" width="1" height="1" alt="" loading="lazy">`;
  for (const mode of ['build', 'test', 'staging']) {
    const ok = guard(rdFixture(own, ownBody, CSP_SELF), mode);
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /no section 4 on the landing page, so no video and nothing of the scenes, the lands or the hall; media-src 'self'/);
    assert.doesNotMatch(ok.stdout, /the ten loops and nothing else/);
  }
  const cases: [Record<string, Buffer | string>, string, RegExp][] = [
    [loops(), CSP_SELF, /cove-wide\.Ab3_x9Zq\.mp4: a video in a build whose landing page mounts no section 4/],
    [{ 'media/extra.mp4': kb(1) }, CSP_SELF, /extra\.mp4: a video in a build whose landing page mounts no section 4/],
    [{ '_astro/clip-case-wallet-wide.Ab3_x9Zq.mp4': kb(1) }, CSP_SELF, /clip-case-wallet-wide\.Ab3_x9Zq\.mp4: a video in a build whose landing page mounts no section 4/],
    [{ '_astro/cove-wide.Ab3_x9Zq.avif': kb(1) }, CSP_SELF, /cove-wide\.Ab3_x9Zq\.avif: a still or picture of section 4's scenes/],
    [{ '_astro/dawn-portrait.Ab3_x9Zq.jpg': kb(1) }, CSP_SELF, /dawn-portrait\.Ab3_x9Zq\.jpg: a still or picture of section 4's scenes/],
    [{ '_astro/products.Ab3_x9Zq.bin': kb(1) }, CSP_SELF, /products\.Ab3_x9Zq\.bin: section 4's product models/],
    [{ '_astro/hall.Ab3_x9Zq.bin': kb(1) }, CSP_SELF, /hall\.Ab3_x9Zq\.bin: an asset of the hall/],
    [{ '_astro/park.Ab3_x9Zq.glb': kb(1) }, CSP_SELF, /park\.Ab3_x9Zq\.glb: an asset of the lands/],
    [{}, CSP_NONE, /media-src 'none', every build needs 'self'/],
    [{}, '', /no Content-Security-Policy line/],
  ];
  for (const [files, csp, msg] of cases) {
    const r = guard(rdFixture(files, '', csp || undefined));
    assert.equal(r.status, 1, `${Object.keys(files).join(', ') || csp || 'no CSP line'}: ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, msg);
    assert.doesNotMatch(r.stderr, /no loop /, 'no loop is asked of a page without the section');
  }
  // the ten loops with no section to play them are ten hits
  assert.equal((guard(rdFixture(loops(), '', CSP_SELF)).stderr.match(/a video in a build whose landing page mounts no section 4/g) ?? []).length, 10);
  // the page decides and nothing else does: the same files under a page that mounts the section are the rule of the rows above
  assert.equal(guard(fixture(loops(), CSP_SELF)).status, 0);
  assert.match(guard(fixture({}, CSP_SELF)).stderr, /no loop cove-wide\.<hash>\.mp4 in the production build/);
  assert.match(guard(fixture({ ...loops(), '_astro/cove-wide.Ab3_x9Zq.avif': kb(1), '_astro/products.Ab3_x9Zq.bin': kb(1) }, CSP_SELF)).stdout, /the ten loops and nothing else/, 'the stills and products.bin belong to a build that mounts the section');
  // the rule's own reading of a page and of a file name
  assert.equal(mountsRoom('<main id="main"><section class="room" id="room" aria-label="x"></section></main>'), true);
  assert.equal(mountsRoom('<main class="rd" id="main"><section class="rd-sec" id="products"></section><div id="room"></div></main>'), false, 'a section, by its id');
  for (const n of ['cove-wide.Ab3_x9Zq.avif', 'grove-portrait.Ab3_x9Zq.webp', 'ember-wide.Ab3_x9Zq.jpg', 'palace-portrait.Ab3_x9Zq.png']) assert.ok(isSceneAsset(n), n);
  for (const n of ['cove-wide.Ab3_x9Zq.mp4', 'hero-1639.Ab3_x9Zq.avif', 'case-grey-1-433.Ab3_x9Zq.webp', 'cove.Ab3_x9Zq.avif', 'tile-pastel-769.Ab3_x9Zq.avif', 'cove-wide.Ab3_x9Zq.js']) assert.ok(!isSceneAsset(n), n);
  assert.ok(isProductsBin('products.Ab3_x9Zq.bin'));
  for (const n of ['products.Ab3_x9Zq.js', 'product-case-311.Ab3_x9Zq.avif', 'products.bin']) assert.ok(!isProductsBin(n), n);
});

test('the post-build guard on the redesigned page as it now stands (2026-11-09, docs/specs/redesign.md D18, D19 and D20): no id said twice on / or /jars/, one sign-up form at most, the jars\' #suForm, and no picture that no page names', () => {
  const guard = (dist: string) => run(['scripts/room/guards.mjs', '--post-build', '--dist', dist, '--mode', 'build']);
  const passes = (dist: string, why: string) => { const r = guard(dist); assert.equal(r.status, 0, `${why}: ${r.stdout}${r.stderr}`); return r; };
  const refused = (dist: string, msg: RegExp) => { const r = guard(dist); assert.equal(r.status, 1, `${msg}: ${r.stdout}`); assert.match(r.stderr, msg); };
  const clean = passes(rdFixture(heroFiles(), heroPic(), CSP_SELF), 'the page as it should be');
  assert.match(clean.stdout, /^redesign build guard \(production build\): no id said twice, one sign-up form at most, no picture that no page names$/m);

  // a picture no page names: the sign-up's photograph (D19), left in the git-ignored folder that pictures.ts's glob ships whole
  refused(rdFixture({ ...heroFiles(), '_astro/signup-640.Ab3_x9Zq.avif': kb(1), '_astro/signup-640.Bc4_y0Zr.webp': kb(1) }, heroPic(), CSP_SELF), /_astro\/signup-640\.Ab3_x9Zq\.avif: a picture no page of this build names/);
  // named anywhere the browser can get it from counts: a page, a script (the quiz's paint, the jars' states) or a stylesheet
  passes(rdFixture({ ...heroFiles(), '_astro/smear.Ab3_x9Zq.webp': kb(1), '_astro/deck.Ab3_x9Zq.js': 'const a="/_astro/smear.Ab3_x9Zq.webp"' }, heroPic(), CSP_SELF), 'named by a chunk');
  passes(rdFixture({ ...heroFiles(), '_astro/grain.Ab3_x9Zq.avif': kb(1), '_astro/page.Ab3_x9Zq.css': '.x{background:url(./grain.Ab3_x9Zq.avif)}' }, heroPic(), CSP_SELF), 'named by a stylesheet');
  passes(rdFixture({ ...heroFiles(), '_astro/jar-0-2x.Ab3_x9Zq.avif': kb(1), 'jars/index.html': '<main class="rd-jars"><img src="/_astro/jar-0-2x.Ab3_x9Zq.avif" alt=""></main>' }, heroPic(), CSP_SELF), 'named by another page');

  // an id said twice, on either page; the words of a script are no id, and each page counts its own
  refused(rdFixture(heroFiles(), `${heroPic()}<div id="suLive"></div><p data-x="1" id="suLive"></p>`, CSP_SELF), /index\.html: the id "suLive" is said twice/);
  refused(rdFixture({ ...heroFiles(), 'jars/index.html': '<main><p id="a"></p><p id="a"></p></main>' }, heroPic(), CSP_SELF), /jars\/index\.html: the id "a" is said twice/);
  passes(rdFixture(heroFiles(), `${heroPic()}<div id="a"></div><script>const s='<p id="a"></p>'</script><style>p[id="a"]{margin:0}</style>`, CSP_SELF), 'the words of a script or a style');
  passes(rdFixture({ ...heroFiles(), 'jars/index.html': '<main id="main"></main>' }, heroPic(), CSP_SELF), 'the landing\'s main and the jars\' each have the id main');

  // the forms: none (PUBLIC_LEADS off), the jars' alone, or the jars' with the quiz's offer, which the quiz keeps (D11); and never another
  passes(rdFixture(heroFiles(), `${heroPic()}<form class="su-form" id="suForm"></form>`, CSP_SELF), 'the jars\' form');
  passes(rdFixture(heroFiles(), `${heroPic()}<form class="qz-form" id="qzForm" novalidate></form><form class="su-form" id="suForm" novalidate></form>`, CSP_SELF), 'the quiz\'s offer beside it');
  refused(rdFixture(heroFiles(), `${heroPic()}<form id="rsForm"></form><form id="suForm"></form>`, CSP_SELF), /index\.html: its sign-up forms are #rsForm, #suForm; the page has one, #suForm/);
  refused(rdFixture(heroFiles(), `${heroPic()}<form></form>`, CSP_SELF), /index\.html: its sign-up forms are #\(no id\)/);
  refused(rdFixture({ ...heroFiles(), 'jars/index.html': '<main><form id="rsForm"></form></main>' }, heroPic(), CSP_SELF), /jars\/index\.html: its sign-up forms are #rsForm/);

  // none of this asks anything of a landing page that is not the redesign: the rows above are as they were
  assert.equal(guard(fixture({ ...loops(), '_astro/stray.Ab3_x9Zq.avif': kb(1) }, CSP_SELF, '<p id="z"></p><p id="z"></p><form></form><form></form>')).status, 0);
  // the rule's own reading of a page
  assert.equal(isRedesign('<main class="rd" id="main"></main>'), true);
  assert.equal(isRedesign('<main class="x rd y"></main>'), true);
  assert.equal(isRedesign('<main class="rd-jars" id="main"></main>'), false, 'the jars\' own page is not the redesigned landing');
  assert.deepEqual(idsSaidTwice('<a id="x"></a><b id="y"></b><i id="x"></i><u id="x"></u>'), ['x']);
  assert.deepEqual(idsSaidTwice('<svg id="x"></svg><use href="#x"></use><label for="x"></label>'), []);
  assert.deepEqual(formIds('<form id="qzForm"></form><p></p><form class="a" id="suForm" novalidate></form><form></form>'), ['qzForm', 'suForm', '']);
});

test("budget.mjs on the redesigned landing (2026-11-09, docs/specs/redesign.md D17 and 8): critical JS is the page's scripts with their static imports, total JS adds every chunk an import() reaches; the hero's summary and the old landing's total are left out", () => {
  // the page: one module script by src, one inline module that imports one chunk statically and one by import(), and a
  // JSON-LD block of 90 KB, which is data and no part of any script line
  const head = `<script type="module" src="/_astro/entry.Ab3_x9Zq.js"></script><script type="module">import"/_astro/inline-static.Ab3_x9Zq.js";import("/_astro/inline-lazy.Ab3_x9Zq.js")</script><script type="application/ld+json">{"x":"${randomBytes(90 * 1024).toString('base64')}"}</script>`;
  // entry imports a (bare), b (named) and c (re-exported) statically and lazy by import(); lazy imports lazy-dep; the
  // family pages' island sits in the build and no script of this page names it
  const graph = (a: number, lazy: number): Record<string, string | Buffer> => ({
    '_astro/entry.Ab3_x9Zq.js': 'import"./a.Ab3_x9Zq.js";import{x}from"./b.Ab3_x9Zq.js";export{y}from"./c.Ab3_x9Zq.js";const l=()=>import(`./lazy.Ab3_x9Zq.js`);',
    '_astro/a.Ab3_x9Zq.js': rnd(a), '_astro/b.Ab3_x9Zq.js': 'export const x=1;', '_astro/c.Ab3_x9Zq.js': 'export const y=1;',
    '_astro/lazy.Ab3_x9Zq.js': chunk('import"./lazy-dep.Ab3_x9Zq.js"', lazy), '_astro/lazy-dep.Ab3_x9Zq.js': 'export const z=1;',
    '_astro/inline-static.Ab3_x9Zq.js': 'export const s=1;', '_astro/inline-lazy.Ab3_x9Zq.js': 'export const i=1;',
    '_astro/island.Ab3_x9Zq.js': chunk('console.warn("THREE.WebGLRenderer: Context Lost.")', 300),
    ...heroFiles(),
  });
  const on = (files: Record<string, string | Buffer>, mode = 'build') => budget(rdFixture(files, heroPic(), undefined, head), '--mode', mode);

  const ok = on(graph(58, 180));
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /^ {2}ok +58\.\d KB of +60\.0 KB {2}critical JS: the page's inline scripts, its module scripts and their static imports \(gzip\) {2}\(2 inline, 5 chunk\(s\)\)$/m);
  assert.match(ok.stdout, /^ {2}ok +23[89]\.\d KB of +250\.0 KB {2}total JS: every chunk the page can reach, by a static import or by import\(\) \(gzip\) {2}\(8 chunk\(s\), 3 of them by import\(\): inline-lazy, lazy, lazy-dep\)$/m);
  for (const n of ['entry', 'a', 'b', 'c', 'inline-static']) assert.match(ok.stdout, new RegExp(`^critical js .*/_astro/${n}\\.Ab3_x9Zq\\.js$`, 'm'), n);
  for (const n of ['lazy', 'lazy-dep', 'inline-lazy']) assert.match(ok.stdout, new RegExp(`^lazy js .*/_astro/${n}\\.Ab3_x9Zq\\.js$`, 'm'), n);
  assert.doesNotMatch(ok.stdout, /island\.Ab3_x9Zq\.js/, 'a chunk no script of the page names is not the page\'s');
  // what measured the old landing is not printed for this one, and says so
  assert.match(ok.stdout, /^the landing page is the redesign \(main\.rd\): no island, no poster and no tier to sum/m);
  assert.doesNotMatch(ok.stdout, /total JS with sections 4 and 5 and scroll\.ts|first view, poster tier|^island js |^island data /m);
  assert.match(ok.stdout, /^ {2}section 4 is on no page of this build \(the landing page has no section#room\)/m);
  assert.match(ok.stdout, /^ {2}ok +\d+\.\d KB of +1500\.0 KB {2}the first view: the page, its critical JS, the fonts it preloads and the first screen's picture at its largest/m);
  assert.match(ok.stdout, /^budget: every enforced line of section-4-flux\.md 6 and of docs\/specs\/redesign\.md 8 holds \(\d+ enforced\) and the formats check, AC8's and the redesign's$/m);
  // a face a build does not carry reads as such (this fixture has no fonts): its line stands for the build that does
  assert.match(ok.stdout, /^ {2}ok +0\.0 KB of +12\.0 KB {2}a display face: Rubik Black, DIFFERENT at rest \(woff2, stored\) {2}\(not in this build\)$/m);

  // each line is a threshold, in a staging build as in production (the redesigned page carries no Tune)
  const crit = on(graph(61, 10));
  assert.equal(crit.status, 1, crit.stdout);
  assert.match(crit.stdout, /^ {2}OVER +61\.\d KB of +60\.0 KB {2}critical JS: /m);
  assert.match(crit.stderr, /budget: section-4-flux\.md 6, AC8 and docs\/specs\/redesign\.md 8 do not hold:\n {2}critical JS: .*: 61\.\d KB over 60\.0 KB/);
  for (const mode of ['build', 'staging']) {
    const total = on(graph(40, 215), mode);
    assert.equal(total.status, 1, `${mode}: ${total.stdout}`);
    assert.match(total.stdout, /^ {2}ok +40\.\d KB of +60\.0 KB {2}critical JS: /m);
    assert.match(total.stderr, /total JS: every chunk the page can reach.*: 255\.\d KB over 250\.0 KB/);
  }
  // the old island within reach of the page, at any depth, stops the build; so does a chunk the page names and the build lacks
  const island = on({ ...graph(10, 10), '_astro/lazy-dep.Ab3_x9Zq.js': 'console.warn("THREE.WebGLRenderer: Context Lost.")' });
  assert.equal(island.status, 1, island.stdout);
  assert.match(island.stderr, /\/_astro\/lazy-dep\.Ab3_x9Zq\.js: reads as the old island's \(three\.js, by the text WebGLRenderer\) and the landing page can reach it/);
  assert.match(island.stdout, /^ {2}FAIL +formats: /m);
  const { '_astro/c.Ab3_x9Zq.js': _gone, ...lacking } = graph(10, 10);
  const lacks = on(lacking);
  assert.equal(lacks.status, 1, lacks.stdout);
  assert.match(lacks.stderr, /\/_astro\/c\.Ab3_x9Zq\.js: the landing page names this chunk and the build does not hold it/);
  // a page that is not the redesign is measured as it always was: none of these lines, and its own total
  const old = budget(fixture(), '--mode', 'build');
  assert.equal(old.status, 0, old.stdout + old.stderr);
  assert.doesNotMatch(old.stdout, /the redesigned landing|the landing page is the redesign|section 4 is on no page/);
  assert.match(old.stdout, /^ {2}ok +\d+\.\d KB of +250\.0 KB {2}total JS with sections 4 and 5 and scroll\.ts \(gzip\)/m);
  assert.match(old.stdout, /^budget: every enforced line of section-4-flux\.md 6 holds \(\d+ enforced\) and AC8's formats check$/m);
});

test("budget.mjs on the redesigned landing: the first screen's picture at most 120 KB; every <picture> an AVIF source with its WebP twin at the same widths; width and height, sizes, lazy after the first, no JPEG, PNG or GIF, every file in the build", () => {
  // the quiz's pictures carry their WebP on the <img> itself; its paint is a lone WebP <img>, in no <picture>
  const quizPic = (img = 'loading="lazy"') => `<picture class="qz-pic"><source type="image/avif" srcset="/_astro/q0-main-640.Ab3_x9Zq.avif 640w, /_astro/q0-main-1100.Ab3_x9Zq.avif 1100w" sizes="30vw"><img src="/_astro/q0-main-1100.Bc4_y0Zr.webp" srcset="/_astro/q0-main-640.Bc4_y0Zr.webp 640w, /_astro/q0-main-1100.Bc4_y0Zr.webp 1100w" sizes="30vw" width="1400" height="933" alt="" ${img}></picture>`;
  const rub = '<img class="qz-rub-img" src="/_astro/smear.Ab3_x9Zq.webp" width="256" height="624" alt="" loading="lazy">';
  const preload = (set = '/_astro/hero-640.Ab3_x9Zq.avif 640w, /_astro/hero-1639.Ab3_x9Zq.avif 1639w') => `<link rel="preload" as="image" type="image/avif" imagesrcset="${set}" imagesizes="100vw" fetchpriority="high">`;
  const quizFiles = { '_astro/q0-main-640.Ab3_x9Zq.avif': kb(8), '_astro/q0-main-1100.Ab3_x9Zq.avif': kb(20), '_astro/q0-main-640.Bc4_y0Zr.webp': kb(14), '_astro/q0-main-1100.Bc4_y0Zr.webp': kb(33), '_astro/smear.Ab3_x9Zq.webp': kb(6) };
  const on = (body: string, files: Record<string, string | Buffer>, head = preload()) => budget(rdFixture(files, body, undefined, head), '--mode', 'build');

  // at the line it passes, one byte over it does not
  const good = on(heroPic() + quizPic() + rub, { ...heroFiles(120 * 1024), ...quizFiles });
  assert.equal(good.status, 0, good.stdout + good.stderr);
  assert.match(good.stdout, /^ {2}ok +120\.0 KB of +120\.0 KB {2}the first screen's picture: the hero's largest AVIF \(stored\) {2}\(\/_astro\/hero-1639\.Ab3_x9Zq\.avif, 1639w\)$/m);
  assert.match(good.stdout, /^ {2}ok +50\.0 KB of +120\.0 KB {2}the first screen's picture: its largest WebP, for a browser without AVIF \(stored\)/m);
  assert.match(good.stdout, /^ {2}ok +formats: 2 <picture>\(s\), each an AVIF source with its WebP twin at the same widths; 3 <img>, each with width and height, the first loaded at once and every other lazy; none of the 0 chunk\(s\) the page can reach reads as the old island's$/m);
  const over = on(heroPic() + quizPic() + rub, { ...heroFiles(120 * 1024 + 1), ...quizFiles });
  assert.equal(over.status, 1, over.stdout);
  assert.match(over.stderr, /the first screen's picture: the hero's largest AVIF \(stored\): 120\.0 KB over 120\.0 KB/);
  assert.match(over.stdout, /^ {2}ok +formats: /m, 'the formats still check');

  const fails = (body: string, files: Record<string, string | Buffer>, want: RegExp, head?: string) => {
    const r = on(body, files, head);
    assert.equal(r.status, 1, `${want}: ${r.stdout}`);
    assert.match(r.stderr, want);
    assert.match(r.stdout, /^ {2}FAIL +formats: /m);
  };
  const all = { ...heroFiles(), ...quizFiles };
  const tile = (sources: string, img: string) => `<picture>${sources}<img ${img} width="480" height="480" alt="" loading="lazy"></picture>`;
  const AV = '<source type="image/avif" srcset="/_astro/tile-480.Ab3_x9Zq.avif 480w, /_astro/tile-864.Ab3_x9Zq.avif 864w" sizes="50vw">';
  const tiles = { '_astro/tile-480.Ab3_x9Zq.avif': kb(4), '_astro/tile-864.Ab3_x9Zq.avif': kb(7), '_astro/tile-480.Bc4_y0Zr.webp': kb(5), '_astro/tile-864.Bc4_y0Zr.webp': kb(10) };
  fails(heroPic() + tile(AV, 'src="/_astro/tile-864.Ab3_x9Zq.avif"'), { ...all, ...tiles }, /a <picture> of tile-480\.Ab3_x9Zq\.avif: no WebP twin, neither a <source type="image\/webp"> nor the <img>'s own/);
  fails(heroPic() + tile('<source type="image/webp" srcset="/_astro/tile-480.Bc4_y0Zr.webp 480w, /_astro/tile-864.Bc4_y0Zr.webp 864w" sizes="50vw">', 'src="/_astro/tile-864.Bc4_y0Zr.webp"'), { ...all, ...tiles }, /a <picture> of tile-480\.Bc4_y0Zr\.webp: no <source type="image\/avif">/);
  fails(heroPic() + tile(`${AV}<source type="image/webp" srcset="/_astro/tile-480.Bc4_y0Zr.webp 480w" sizes="50vw">`, 'src="/_astro/tile-480.Bc4_y0Zr.webp"'), { ...all, ...tiles }, /a <picture> of tile-480\.Ab3_x9Zq\.avif: AVIF at 480w, 864w but WebP at 480w \(each width has its twin\)/);
  fails(heroPic() + tile(AV.replace(' sizes="50vw"', ''), 'src="/_astro/tile-864.Bc4_y0Zr.webp" srcset="/_astro/tile-480.Bc4_y0Zr.webp 480w, /_astro/tile-864.Bc4_y0Zr.webp 864w" sizes="50vw"'), { ...all, ...tiles }, /a <picture> of tile-480\.Ab3_x9Zq\.avif: a srcset by width with no sizes/);
  fails(heroPic(undefined, 'width="1639"') + quizPic() + rub, all, /an <img> of hero-1639\.Bc4_y0Zr\.webp: no width and height/);
  fails(heroPic() + quizPic('') + rub, all, /an <img> of q0-main-640\.Bc4_y0Zr\.webp: not loading="lazy", and it is not the first of the page/);
  fails(heroPic('loading="lazy"') + quizPic() + rub, all, /the first <img> of the page \(hero-1639\.Bc4_y0Zr\.webp\) is lazy: the first screen's picture loads at once/);
  fails(heroPic() + '<img src="/_astro/photo.Ab3_x9Zq.jpg" width="10" height="10" alt="" loading="lazy">', { ...all, '_astro/photo.Ab3_x9Zq.jpg': kb(3) }, /photo\.Ab3_x9Zq\.jpg: JPEG is not a format the page ships/);
  const { '_astro/q0-main-640.Ab3_x9Zq.avif': _gone, ...lacking } = all;
  fails(heroPic() + quizPic() + rub, lacking, /\/_astro\/q0-main-640\.Ab3_x9Zq\.avif: the page names this picture and the build does not hold it/);
  fails(heroPic() + quizPic() + rub, all, /\/_astro\/other-640\.Ab3_x9Zq\.avif: preloaded, and the first screen's picture does not draw it/, preload('/_astro/other-640.Ab3_x9Zq.avif 640w'));
  fails(rub, all, /the first screen: the page's first <img> is in no <picture> with an AVIF source, so there is no hero picture to hold to 120 KB/, '');
  fails('', all, /there is no hero picture to hold to 120 KB/, '');
});

test("budget.mjs on the redesigned landing, its faces (2026-11-09, docs/specs/redesign.md D7, D19, D20 and 8): the four display faces each under its cap, Rubik Black preloaded wherever the page draws DIFFERENT and counted in the first view, Rubik Glitch never preloaded", () => {
  const word = '<span class="rd-hero-word" aria-hidden="true">DIFFERENT</span>';
  const preload = (...files: string[]) => files.map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/${f}">`).join('');
  const FONTS = (black = 2.7, torn = 12.1, wide = 2.2, song = 10.6): Record<string, Buffer> => ({ 'fonts/rubik-900-caps.woff2': kb(black), 'fonts/rubik-glitch-400-caps.woff2': kb(torn), 'fonts/skreed-wide-400-caps.woff2': kb(wide), 'fonts/windsong-400-lower.woff2': kb(song), 'fonts/inter-opsz-wght-latin.woff2': kb(70) });
  const on = (fonts: Record<string, Buffer>, head: string, body = word) => budget(rdFixture({ ...heroFiles(), ...fonts }, heroPic() + body, undefined, head), '--mode', 'build');

  const ok = on(FONTS(), preload('inter-opsz-wght-latin.woff2', 'rubik-900-caps.woff2'));
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /^ {2}ok +2\.\d KB of +12\.0 KB {2}a display face: Rubik Black, DIFFERENT at rest \(woff2, stored\) {2}\(preloaded, in the first view\)$/m);
  assert.match(ok.stdout, /^ {2}ok +12\.\d KB of +30\.0 KB {2}a display face: Rubik Glitch, DIFFERENT inside a burst \(woff2, stored\) {2}\(fetched after the first paint, for the first burst\)$/m);
  assert.match(ok.stdout, /^ {2}ok +2\.\d KB of +12\.0 KB {2}a display face: Skreed Wide, MATCH ESSENTIALS \(woff2, stored\)/m);
  assert.match(ok.stdout, /^ {2}ok +10\.\d KB of +16\.0 KB {2}a display face: WindSong, the three blobs' words \(woff2, stored\)/m);
  // the preloaded fonts are the first view's, by name, and Rubik Black's bytes are among them
  assert.match(ok.stdout, /the first view: the page, its critical JS, the fonts it preloads and the first screen's picture at its largest {2}\(page [^)]*, 2 font\(s\) 72\.\d KB \(inter-opsz-wght-latin, rubik-900-caps\); spec 8 aims under 400 KB\)$/m);

  // the word on the first screen with its face left out of the preloads: the slab of Arial D20 was there to end
  const late = on(FONTS(), preload('inter-opsz-wght-latin.woff2'));
  assert.equal(late.status, 1, late.stdout);
  assert.match(late.stderr, /\/fonts\/rubik-900-caps\.woff2: DIFFERENT is drawn in the first screen and its face is not preloaded/);
  assert.match(late.stdout, /^ {2}FAIL +formats: /m);
  // the same head with no such word on the page asks for nothing
  assert.equal(on(FONTS(), preload('inter-opsz-wght-latin.woff2'), '').status, 0);

  // the torn face preloaded: it is no part of the first paint (D19)
  const torn = on(FONTS(), preload('rubik-900-caps.woff2', 'rubik-glitch-400-caps.woff2'));
  assert.equal(torn.status, 1, torn.stdout);
  assert.match(torn.stderr, /\/fonts\/rubik-glitch-400-caps\.woff2: preloaded, and the torn face is drawn only inside a burst/);

  // each face at its cap, one over it stops the build
  for (const [args, name] of [[[12.1], 'Rubik Black, DIFFERENT at rest'], [[2.7, 30.1], 'Rubik Glitch, DIFFERENT inside a burst'], [[2.7, 12.1, 12.1], 'Skreed Wide, MATCH ESSENTIALS'], [[2.7, 12.1, 2.2, 16.1], "WindSong, the three blobs' words"]] as [number[], string][]) {
    const fat = on(FONTS(...args), preload('rubik-900-caps.woff2'));
    assert.equal(fat.status, 1, `${name}: ${fat.stdout}`);
    assert.match(fat.stderr, new RegExp(`a display face: ${name} \\(woff2, stored\\): [\\d.]+ KB over [\\d.]+ KB`));
  }
});

test("budget.mjs: section 5's lines are read on every page that mounts it (2026-11-09, docs/specs/redesign.md D1 and D18): the jars' own page, which has the two script lines and the island check of its own, and the landing page where the jars close it; a section#signup of another class is never section 5, nor a chunk of the page's own that names the form's ids", () => {
  const PAGE = 'astro_astro_type_script_index_0_lang.Ab3_x9Zq.js';   // a page script's chunk, as Astro names it
  // section 5 as built: its section, a jar's picture, and the second layer of jar 4, a shell that names no file until the script fills it
  const jar = '<picture class="su-pic"><source type="image/avif" srcset="/_astro/jar-0-1x.Ab3_x9Zq.avif 200w, /_astro/jar-0-2x.Ab3_x9Zq.avif 400w" sizes="36vw"><source type="image/webp" srcset="/_astro/jar-0-1x.Bc4_y0Zr.webp 200w, /_astro/jar-0-2x.Bc4_y0Zr.webp 400w" sizes="36vw"><img src="/_astro/jar-0-1x.Bc4_y0Zr.webp" alt="" width="200" height="240" loading="lazy" decoding="async"></picture>';
  const shell = '<picture class="su-pic" data-layer="next" hidden><source type="image/avif" sizes="36vw"><source type="image/webp" sizes="36vw"><img alt="" width="200" height="240" decoding="async"></picture>';
  const section5 = `<section class="signup" id="signup" aria-label="Section 5: the sign-up" data-state="rest"><p>EVERY FOLLOW FILLS THE JAR</p>${jar}${shell}</section>`;
  // another section of the landing page, 30 KB of it, under any id, section 5's own among them. The PDF's two steps were
  // one such for part of a day, first as section#signup and then, after D18, as section#steps; they left with D19, and
  // this row holds the reading they called for against whatever stands there next
  const other = (id: string) => `<section class="rd-sec rd-${id}" id="${id}"><p>${randomBytes(30 * 1024).toString('base64')}</p></section>`;
  const jarsPage = `<!doctype html><html><head><script>document.documentElement.classList.add("js")</script></head><body><script type="module" src="/_astro/Signup.${PAGE}"></script><main class="rd-jars" id="main">${section5}</main></body></html>`;
  // a script of the landing page's own that names the form's ids and fetches the form by import(), as section 5's page
  // script does (the two steps' did, until D19): the page's script, never section 5's form
  const head = `<script type="module" src="/_astro/Own.${PAGE}"></script>`;
  const files = (dom = 5, form = 2, formCode = 'document.getElementById("suCodePill")'): Record<string, string | Buffer> => ({
    ...heroFiles(),
    [`_astro/Own.${PAGE}`]: chunk('document.getElementById("suCodePill");import("./form.Ab3_x9Zq.js")', 3),
    [`_astro/Signup.${PAGE}`]: 'import{t}from"./preload.Ab3_x9Zq.js";import(`./signup.Ab3_x9Zq.js`)',
    '_astro/preload.Ab3_x9Zq.js': 'export const t=1;',
    '_astro/signup.Ab3_x9Zq.js': chunk('dispatchEvent(new CustomEvent("skreed:signup-filled"));import("./form.Ab3_x9Zq.js")', dom),
    '_astro/form.Ab3_x9Zq.js': chunk(formCode, form),
    '_astro/jar-0-1x.Ab3_x9Zq.avif': kb(3), '_astro/jar-0-1x.Bc4_y0Zr.webp': kb(6), '_astro/jar-0-2x.Ab3_x9Zq.avif': kb(5), '_astro/jar-0-2x.Bc4_y0Zr.webp': kb(10),
  });
  /** the redesigned landing with this body after the hero's picture, and the jars' own page beside it or not */
  const on = (f: Record<string, string | Buffer>, body: string, jars = true, landingHead = head) => budget(rdFixture({ ...f, ...(jars ? { 'jars/index.html': jarsPage } : {}) }, heroPic() + body, undefined, landingHead), '--mode', 'build');
  const FIRST = (where: string) => new RegExp(`^ {2}ok +\\d\\.\\d KB of +6\\.0 KB {2}the first view: section 5's markup and signup\\.css \\(gzip\\)${where} {2}\\(markup (\\d+) B, signup\\.css about \\d+ B\\)$`, 'm');

  // the jars on their own page only (spec D1): another section, under either id, is not section 5
  for (const id of ['range', 'signup']) {
    const ok = on(files(), other(id));
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.equal(ok.stdout.match(FIRST(', on /jars/'))?.[1], String(section5.length), `the jars' own markup, not the 30 KB section#${id}`);
    assert.doesNotMatch(ok.stdout, /the first view: section 5's markup and signup\.css \(gzip\), on \/ /);
    assert.match(ok.stdout, /^ {2}ok +5\.\d KB of +7\.0 KB {2}section 5's page script .*; section 5 is on \/jars\/\)$/m);
    assert.match(ok.stdout, /^ {2}ok +2\.\d KB of +4\.0 KB {2}section 5's email form /m, 'the form alone: the landing\'s own script names the same ids and is the landing\'s');
    assert.match(ok.stdout, /^critical js .*\/_astro\/Own\.astro_astro_type_script_index_0_lang\.Ab3_x9Zq\.js$/m);
    assert.match(ok.stdout, /^jars js .*\/_astro\/Signup\.astro_astro_type_script_index_0_lang\.Ab3_x9Zq\.js$/m);
    assert.match(ok.stdout, /^jars js .*\/_astro\/preload\.Ab3_x9Zq\.js$/m);
    assert.match(ok.stdout, /^signup dom js \(lazy\) .*\/_astro\/signup\.Ab3_x9Zq\.js$/m);
    assert.match(ok.stdout, /^signup form js \(lazy\) .*\/_astro\/form\.Ab3_x9Zq\.js$/m);
    assert.equal((ok.stdout.match(/\/_astro\/form\.Ab3_x9Zq\.js$/gm) ?? []).length, 1, 'a chunk two pages reach is listed once');
    // the page's own two script lines
    assert.match(ok.stdout, /^ {2}ok +0\.\d KB of +60\.0 KB {2}\/jars\/: critical JS, its inline scripts, module scripts and their static imports \(gzip\) {2}\(1 inline, 2 chunk\(s\)\)$/m);
    assert.match(ok.stdout, /^ {2}ok +7\.\d KB of +250\.0 KB {2}\/jars\/: total JS, every chunk the page can reach \(gzip\) {2}\(4 chunk\(s\), 2 of them by import\(\): form, signup\)$/m);
    assert.match(ok.stdout, /^the redesigned landing and the jars' own page \(docs\/specs\/redesign\.md 8 and D17; the production build;/m);
  }

  // and closing the landing page as well (spec D18): both pages mount it, each has its first view, and the landing's
  // format checks pass over jar 4's second layer, which names no file
  const both = on(files(), other('range') + `<div class="rd-jarsec" data-tone="light">${section5}</div>`, true, `${head}<script type="module" src="/_astro/Signup.${PAGE}"></script>`);
  assert.equal(both.status, 0, both.stdout + both.stderr);
  for (const where of [', on /', ', on /jars/']) assert.equal(both.stdout.match(FIRST(where))?.[1], String(section5.length), where);
  assert.match(both.stdout, /^ {2}ok +5\.\d KB of +7\.0 KB {2}section 5's page script .*; section 5 is on \/ and \/jars\/\)$/m);
  assert.match(both.stdout, /^ {2}ok +formats: 3 <picture>\(s\), each an AVIF source with its WebP twin at the same widths; 3 <img>, each with width and height, the first loaded at once and every other lazy \(1 a shell that names no file until a script fills it\); none of the 5 chunk\(s\) the page can reach reads as the old island's$/m);
  assert.match(both.stdout, /^ {2}ok +10\.\d KB of +250\.0 KB {2}total JS: every chunk the page can reach, by a static import or by import\(\) \(gzip\) {2}\(5 chunk\(s\), 2 of them by import\(\): form, signup\)$/m, 'section 5\'s chunks are in the landing page\'s total where it mounts the section');
  // a shell is excused its laziness and its format, never its box
  const boxless = on(files(), `<div class="rd-jarsec">${section5.replace(' width="200" height="240" decoding="async"></picture></section>', ' decoding="async"></picture></section>')}</div>`);
  assert.equal(boxless.status, 1, boxless.stdout);
  assert.match(boxless.stderr, /an <img> of with no file: no width and height/);

  // its lines hold on the jars' page as they did on the landing
  const dom = on(files(8), other('range'));
  assert.equal(dom.status, 1, dom.stdout);
  assert.match(dom.stderr, /section 5's page script .*: 8\.\d KB over 7\.0 KB/);
  const form = on(files(2, 5), other('range'));
  assert.equal(form.status, 1, form.stdout);
  assert.match(form.stderr, /section 5's email form .*: 5\.\d KB over 4\.0 KB/);
  const fat = budget(rdFixture({ ...files(), 'jars/index.html': jarsPage.replace('<p>EVERY FOLLOW FILLS THE JAR</p>', `<p>${randomBytes(6 * 1024).toString('base64')}</p>`) }, heroPic() + other('range'), undefined, head), '--mode', 'build');
  assert.equal(fat.status, 1, fat.stdout);
  assert.match(fat.stderr, /the first view: section 5's markup and signup\.css \(gzip\), on \/jars\/: \d+\.\d KB over 6\.0 KB/);
  // the old island within the jars' page's reach
  const island = on(files(5, 2, 'document.getElementById("suCodePill");console.warn("THREE.WebGLRenderer: Context Lost.")'), other('range'));
  assert.equal(island.status, 1, island.stdout);
  assert.match(island.stderr, /\/_astro\/form\.Ab3_x9Zq\.js: reads as the old island's \(three\.js, by the text WebGLRenderer\) and the jars' page can reach it/);

  // with section 5 on no page, no other section is measured as it, whatever its id
  for (const id of ['range', 'signup']) {
    const alone = on(files(), other(id), false);
    assert.equal(alone.status, 0, alone.stdout + alone.stderr);
    assert.equal(alone.stdout.match(FIRST(', on no page of this build'))?.[1], '0', id);
    assert.doesNotMatch(alone.stdout, /^ {2}\S+ +[\d.]+ KB of +[\d.]+ KB {2}\/jars\/: /m);
  }
  // and a landing that carries section 5 itself with no redesign about it (the site before 2026-11-09) is read where
  // it always was, under the line's old name
  const before = budget(fixture({ '_astro/jar-0-2x.Ab3_x9Zq.avif': kb(5), '_astro/jar-0-2x.Bc4_y0Zr.webp': kb(10) }, undefined, '<section class="signup" id="signup"><p>EVERY FOLLOW FILLS THE JAR</p></section>'), '--mode', 'build');
  assert.equal(before.status, 0, before.stdout + before.stderr);
  assert.equal(before.stdout.match(FIRST(''))?.[1], '79');
  assert.doesNotMatch(before.stdout, /section 5 is on /);
});

test('package.json: each build script as written also passes on a build of the redesigned landing, which ships no loop (2026-11-09, docs/specs/redesign.md D17)', () => {
  // the same chain as the package.json row above (astro build left out, the dist pointed at a fixture), on a page with
  // main.rd and no section 4: the guard asks for no loop there and the budget reads the page's own lines
  const chain = (name: string, dist: string) => pkg.scripts[name].replace(/\bastro build\b/, 'true')
    .replace('scripts/csp.mjs', `scripts/csp.mjs --dist '${dist}'`).replace(/budget\.mjs dist\b/, `budget.mjs '${dist}'`).replace('--post-build', `--post-build --dist '${dist}'`);
  for (const name of ['build', 'build:test', 'build:staging']) {
    const dist = rdFixture(heroFiles(), heroPic());
    const r = spawnSync('sh', ['-c', chain(name, dist)], { cwd: ROOT, env: { ...BASE, PATH: `${join(ROOT, 'node_modules/.bin')}:${BASE.PATH ?? ''}` }, encoding: 'utf8' });
    assert.equal(r.status, 0, `${name}: ${r.stdout}${r.stderr}`);
    assert.equal(mediaSrc(dist), "'self'", name);
    if (name === 'build:test') continue;   // the test build runs neither the budget nor the guard
    assert.match(r.stdout, /^the redesigned landing \(docs\/specs\/redesign\.md 8 and D17; the (production|staging) build;/m, name);
    assert.match(r.stdout, /^section 4 build guard \((production|staging) build\): no section 4 on the landing page, so no video and nothing of the scenes, the lands or the hall; media-src 'self'$/m, name);
  }
});
