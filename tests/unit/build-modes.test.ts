// Section 4's build modes (docs/specs/section-4-world.md 5 "Build modes", AC8 and AC13). scripts/csp.mjs writes the
// media-src each mode needs, run on a tiny dist in a temporary folder, both on its own and through package.json's own
// script text with astro build left out; astro.config.mjs's alias, in a real Vite build of a module graph in miniature,
// resolves the travel options that are not the pick to travel-stub.ts by the file an import resolves to (every spelling),
// keeps their ?url files out, and resolves nothing with Tune on; optimizeDeps keeps RoomEnvironment while universe.ts
// needs it; the post-build guard refuses a clip, a park asset or another option's chunk where the mode does not allow it;
// scripts/hero/budget.mjs exits 1 on a broken line or a failed format check, prints Sam's pending line as such, measures
// the garden or stops the build, and keeps a land picture out of the hero's posters.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';
import config, { TRAVEL_STUB, parkTravelAlias } from '../../astro.config.mjs';
import { PICKS, TRAVEL, readMode, readPick } from '../../scripts/room/guards.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
// the children never inherit a pick, a Tune flag or a hooks flag from the shell that runs the tests
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

test('csp.mjs: media-src none by default and for A and B, self for C or with --media self, and --media none wins', () => {
  const cases: [string[], Record<string, string>, string][] = [
    [[], {}, "'none'"],
    [[], { PUBLIC_PARK_TRAVEL: 'A' }, "'none'"],
    [[], { PUBLIC_PARK_TRAVEL: 'B' }, "'none'"],
    [[], { PUBLIC_PARK_TRAVEL: 'C' }, "'self'"],
    [['--media', 'self'], { PUBLIC_PARK_TRAVEL: 'A' }, "'self'"],
    [['--media', 'none'], { PUBLIC_PARK_TRAVEL: 'C' }, "'none'"],
  ];
  for (const [flags, env, want] of cases) {
    const dist = fixture();
    const r = run(['scripts/csp.mjs', '--dist', dist, ...flags], env);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(mediaSrc(dist), want, `${flags.join(' ') || '(no flag)'} ${JSON.stringify(env)}`);
    // the rest of the policy is untouched, and a second run replaces its line rather than adding one
    const headers = readFileSync(join(dist, '_headers'), 'utf8');
    assert.match(headers, /object-src 'none'; frame-src 'none'; worker-src 'none'/);
    assert.doesNotMatch(headers, /blob:/, 'clips stream from their URL, never a blob');
    assert.equal(run(['scripts/csp.mjs', '--dist', dist, ...flags], env).status, 0);
    assert.equal(readFileSync(join(dist, '_headers'), 'utf8').match(/Content-Security-Policy:/g)?.length, 1);
  }
  const r = run(['scripts/csp.mjs', '--dist', fixture(), '--media', "'self' blob:"]);
  assert.equal(r.status, 1, 'only self or none');
  assert.match(r.stderr, /--media takes self or none/);
});

test("package.json: each build sets the pick (default A) for every command; build and build:staging run the budget and the guard", () => {
  for (const name of ['build', 'build:test', 'build:staging']) assert.ok(pkg.scripts[name].startsWith('export PUBLIC_PARK_TRAVEL=${PUBLIC_PARK_TRAVEL:-A} && '), name);
  assert.match(pkg.scripts['build:staging'], /&& node scripts\/csp\.mjs --media self &&/);
  assert.doesNotMatch(pkg.scripts.build, /--media/, 'build takes the media from the pick');
  assert.match(pkg.scripts.build, /&& node scripts\/hero\/budget\.mjs dist --mode build && node scripts\/room\/guards\.mjs --post-build --mode build$/);
  assert.match(pkg.scripts['build:staging'], /&& node scripts\/hero\/budget\.mjs dist --mode staging && node scripts\/room\/guards\.mjs --post-build --mode staging$/);
  assert.match(pkg.scripts['//build-modes'], /^# /, 'the note is a shell comment, so running it does nothing');
  // each script as written, with astro build left out and the dist pointed at a fixture: the media-src per mode and pick
  const chain = (name: string, dist: string) => pkg.scripts[name].replace(/\bastro build\b/, 'true')
    .replace('scripts/csp.mjs', `scripts/csp.mjs --dist '${dist}'`).replace(/budget\.mjs dist\b/, `budget.mjs '${dist}'`).replace('--post-build', `--post-build --dist '${dist}'`);
  const cases: [string, string | undefined, string][] = [
    ['build', undefined, "'none'"], ['build', 'A', "'none'"], ['build', 'B', "'none'"], ['build', 'C', "'self'"],
    ['build:test', undefined, "'none'"], ['build:test', 'C', "'self'"],
    ['build:staging', undefined, "'self'"], ['build:staging', 'B', "'self'"],
  ];
  for (const [name, pick, want] of cases) {
    const dist = fixture();
    const r = spawnSync('sh', ['-c', chain(name, dist)], { cwd: ROOT, env: { ...BASE, PATH: `${join(ROOT, 'node_modules/.bin')}:${BASE.PATH ?? ''}`, ...(pick ? { PUBLIC_PARK_TRAVEL: pick } : {}) }, encoding: 'utf8' });
    assert.equal(r.status, 0, `${name} ${pick ?? '(unset)'}: ${r.stderr}`);
    assert.equal(mediaSrc(dist), want, `${name} with pick ${pick ?? '(unset)'}`);
  }
});

/**
 * a module graph in miniature for the alias: section4/ with the three options (the park's model and a clip imported by
 * ?url, each option with a marker string), a director that reaches each by import() in another spelling (.ts, none,
 * .js), an entry that reaches two again from outside section4/ (relative and root-relative), and a travel-park.ts
 * elsewhere that is another module; missing leaves files unwritten, files adds or replaces them
 */
function graph({ missing = [], files = {} }: { missing?: string[]; files?: Record<string, string | Buffer> } = {}) {
  // the folder as tmpdir() names it: on macOS /var is a link to /private/var, and Vite resolves to the real path
  const root = mkdtempSync(join(tmpdir(), 'skreed-graph-'));
  temps.push(root);
  const all: Record<string, string | Buffer> = {
    'section4/travel-depth.ts': "export const createTravel = (): string => 'depth-marker';",
    'section4/travel-park.ts': "import park from './park.glb?url';\nexport const createTravel = (): string => park + ' park-marker';",
    'section4/park.glb': Buffer.alloc(2048, 7),
    'section4/travel-video.ts': "import clip from './clip-portrait.mp4?url';\nexport const createTravel = (): string => clip + ' video-marker';",
    'section4/clip-portrait.mp4': Buffer.alloc(2048, 9),
    'section4/director.ts': "export const travels = [() => import('./travel-depth.ts'), () => import('./travel-park'), () => import('./travel-video.js')];",
    'other/travel-park.ts': "export const createTravel = (): string => 'elsewhere-marker';",
    'main.ts': "import { travels } from './section4/director.ts';\nconsole.log([...travels, () => import('./section4/travel-park.ts'), () => import('/section4/travel-video.ts'), () => import('./other/travel-park.ts')]);",
    ...files,
  };
  for (const [p, body] of Object.entries(all)) if (!missing.includes(p)) { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), body); }
  return { root, s4: join(root, 'section4') };
}
type Out = { fileName: string; type: string; code?: string };
/** the graph built by Vite through the alias for the pick and Tune: the names it emits, and every chunk's code together */
async function bundle({ root, s4 }: { root: string; s4: string }, pick: 'A' | 'B' | 'C', tune: boolean) {
  const out = (await viteBuild({ root, configFile: false, logLevel: 'silent', cacheDir: join(root, '.vite'), plugins: [parkTravelAlias(pick, tune, s4)], build: { write: false, assetsInlineLimit: 0, rollupOptions: { input: join(root, 'main.ts') } } })) as unknown as { output: Out[] } | { output: Out[] }[];
  const output = (Array.isArray(out) ? out[0] : out).output;
  return { files: output.map((o) => o.fileName).join(' '), code: output.filter((o) => o.type === 'chunk').map((o) => o.code).join('\n') };
}
const MARKER = { A: 'depth-marker', B: 'park-marker', C: 'video-marker' } as const;

test('the alias, in a real Vite build: the options that are not the pick become travel-stub.ts in every spelling and their files stay out; Tune on carries all three', async () => {
  const g = graph();
  for (const pick of PICKS) {
    const { files, code } = await bundle(g, pick, false);
    for (const opt of PICKS) assert.equal(code.includes(MARKER[opt]), opt === pick, `pick ${pick}: ${TRAVEL[opt]}'s code`);
    assert.equal(/\.glb\b/.test(files), pick === 'B', `pick ${pick}: the park's model (${files})`);
    assert.equal(/\.mp4\b/.test(files), pick === 'C', `pick ${pick}: the clip (${files})`);
    assert.match(files, /travel-stub/, `pick ${pick}: the stub stands in`);
    assert.ok(code.includes('elsewhere-marker'), 'a travel-park.ts outside section4/ is another module');
  }
  const { files, code } = await bundle(g, 'A', true);
  for (const opt of PICKS) assert.ok(code.includes(MARKER[opt]), `Tune on: ${TRAVEL[opt]}`);
  assert.match(files, /\.glb\b/);
  assert.match(files, /\.mp4\b/);
  assert.doesNotMatch(files, /travel-stub/, 'Tune on: no stub');
  assert.ok(existsSync(TRAVEL_STUB));
  assert.match(readFileSync(TRAVEL_STUB, 'utf8'), /^export const TRAVEL_STUB = true;$/m);
});

test("the alias: an option not written yet is stubbed unless it is the pick or Tune is on; travel-stub.ts's first rule, a static named import of a stubbed option stops the build", async () => {
  const g = graph({ missing: ['section4/travel-park.ts', 'section4/travel-video.ts'] });
  assert.ok((await bundle(g, 'A', false)).code.includes(MARKER.A), 'the build passes before the other options exist');
  await assert.rejects(bundle(g, 'A', true), 'Tune on: all three must exist');
  await assert.rejects(bundle(g, 'B', false), 'the pick must exist');
  // only import() reaches a travel module: a static named import from shared code holds for its own pick and breaks every other
  const shared = graph({ files: { 'section4/world.ts': "import { createTravel } from './travel-depth.ts';\nexport const push = createTravel;", 'main.ts': "import { push } from './section4/world.ts';\nimport { travels } from './section4/director.ts';\nconsole.log(push(), travels);" } });
  assert.ok((await bundle(shared, 'A', false)).code.includes(MARKER.A));
  await assert.rejects(bundle(shared, 'B', false), /MISSING_EXPORT|createTravel/);
});

test("astro.config.mjs: the alias is wired with the environment's pick and Tune; optimizeDeps carries RoomEnvironment exactly while src/ imports it", async () => {
  type Resolve = (this: unknown, s: string, i?: string, o?: object) => Promise<string | null>;
  const plugins = (config.vite?.plugins ?? []) as unknown as { name?: string; resolveId?: Resolve }[];
  const alias = plugins.find((p) => p?.name === 'skreed:park-travel');
  assert.ok(alias?.resolveId, 'the alias is among the Vite plugins');
  // this test process was started without a pick and without Tune unless the shell set them (the config read it at import);
  // the options are not written yet, so the context's resolver finds nothing and the alias reads the path from the import
  const pick = process.env.PUBLIC_PARK_TRAVEL ?? 'A', tune = process.env.PUBLIC_TUNE === '1';
  const ctx = { resolve: async () => null };
  for (const opt of PICKS) assert.equal(await alias.resolveId.call(ctx, `./${TRAVEL[opt]}`, join(ROOT, 'src/scripts/hero/section4/director.ts'), {}), tune || opt === pick ? null : TRAVEL_STUB, TRAVEL[opt]);
  // universe.ts lights the products with RoomEnvironment: without it pre-bundled, dev re-optimises on the way into the
  // section and answers open tabs with "504 Outdated Optimize Dep". The entry leaves in the change that deletes
  // universe.ts, and this test then asks for that
  const ENV = 'three/addons/environments/RoomEnvironment.js';
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);
  const imports = new RegExp(`^\\s*import\\s+(?!type\\b)[^;]*?from\\s*['"]${ENV.replace(/[./]/g, '\\$&')}['"]`, 'm');
  const importers = walk(join(ROOT, 'src')).filter((f) => /\.(?:ts|js|mjs|astro)$/.test(f) && imports.test(readFileSync(f, 'utf8'))).map((f) => basename(f));
  const included = (config.vite?.optimizeDeps?.include ?? []).includes(ENV);
  assert.equal(included, importers.length > 0, importers.length ? `${importers.join(', ')} imports RoomEnvironment: keep it in optimizeDeps` : 'nothing in src/ imports RoomEnvironment: take it out of optimizeDeps');
});

test('the pick and the mode: flags first, then the environment, then A and build; anything else throws', () => {
  assert.equal(readPick([], {}), 'A');
  assert.equal(readPick([], { PUBLIC_PARK_TRAVEL: '' }), 'A');
  assert.equal(readPick([], { PUBLIC_PARK_TRAVEL: 'C' }), 'C');
  assert.equal(readPick(['--pick', 'B'], { PUBLIC_PARK_TRAVEL: 'C' }), 'B');
  assert.throws(() => readPick([], { PUBLIC_PARK_TRAVEL: 'a' }), /must be A, B or C/);
  assert.equal(readMode([], {}), 'build');
  assert.equal(readMode([], { PUBLIC_HERO_HOOKS: '1' }), 'test');
  assert.equal(readMode([], { PUBLIC_TUNE: '1', PUBLIC_HERO_HOOKS: '1' }), 'staging');
  assert.equal(readMode(['--mode', 'test'], { PUBLIC_TUNE: '1' }), 'test');
  assert.throws(() => readMode(['--mode', 'production'], {}), /--mode must be one of/);
});

test('the post-build guard: a clip only with C, a park asset only with B, another option chunk never with Tune off; staging carries all', () => {
  const clip = { '_astro/clip-1-2-portrait.Ab3_x9Zq.mp4': kb(1) }, park = { '_astro/park.Ab3_x9Zq.glb': kb(1), '_astro/park-lightmap.Ab3_x9Zq.avif': kb(1) };
  const chunks = { '_astro/travel-depth.Ab3_x9Zq.js': 'export const a=1', '_astro/travel-park.Bc4_y0Zr.js': 'export const b=1', '_astro/travel-video.Cd5_z1Zs.js': 'export const c=1' };
  const guard = (dist: string, mode: string, pick: string) => run(['scripts/room/guards.mjs', '--post-build', '--dist', dist, '--mode', mode, '--pick', pick]);
  const cases: [Record<string, Buffer | string>, string, string, string, number, RegExp?][] = [
    [{}, CSP_NONE, 'build', 'A', 0],
    [clip, CSP_NONE, 'build', 'A', 1, /a clip in a production build whose pick is A/],
    [clip, CSP_NONE, 'build', 'B', 1, /a clip/],
    [clip, CSP_SELF, 'build', 'C', 0],
    [park, CSP_NONE, 'build', 'A', 1, /a park asset/],
    [park, CSP_NONE, 'test', 'C', 1, /a park asset in a test build/],
    [park, CSP_NONE, 'build', 'B', 0],
    [{ '_astro/travel-video.Cd5_z1Zs.js': 'export const c=1' }, CSP_NONE, 'build', 'A', 1, /option C's chunk/],
    [{ '_astro/travel-depth.Ab3_x9Zq.js': 'export const a=1', '_astro/travel-stub.Ee6_a2Zt.js': 'export const s=1' }, CSP_NONE, 'build', 'A', 0],
    [{ ...clip, ...park, ...chunks }, CSP_SELF, 'staging', 'A', 0],
    [{}, CSP_SELF, 'build', 'A', 1, /media-src 'self', a production build with pick A needs 'none'/],
    [{}, CSP_NONE, 'build', 'C', 1, /needs 'self'/],
    [{}, CSP_NONE, 'staging', 'A', 1, /needs 'self'/],
    [{}, '', 'build', 'A', 1, /no Content-Security-Policy line/],
  ];
  for (const [files, csp, mode, pick, status, msg] of cases) {
    const r = guard(fixture(files, csp || undefined), mode, pick);
    assert.equal(r.status, status, `${mode} ${pick} ${Object.keys(files).join(', ')}: ${r.stdout}${r.stderr}`);
    if (msg) assert.match(r.stderr, msg);
  }
  // the reference scan is still the default mode
  const r = run(['scripts/room/guards.mjs']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /nothing of the reference/);
});

const budget = (dist: string, ...flags: string[]) => run(['scripts/hero/budget.mjs', dist, ...flags]);

test("budget.mjs: section 6's lines exit 1 when broken, and a land picture is never the hero's poster", () => {
  const page = '<picture><source data-srcset="/_astro/land-case-portrait.Ab3_x9Zq.avif"><img src="/_astro/portrait.Pq7_k2Lm.avif" width="720" height="1280" alt=""></picture>';
  // at the line passes, one byte over breaks it
  for (const [bytes, status] of [[80 * 1024, 0], [80 * 1024 + 1, 1]] as const) {
    const r = budget(fixture({ '_astro/land-case-portrait.Ab3_x9Zq.avif': Buffer.alloc(bytes, 1), '_astro/land-case-portrait.Bc4_y0Zr.webp': kb(20), '_astro/portrait.Pq7_k2Lm.avif': kb(30) }, undefined, page), '--mode', 'build', '--pick', 'A');
    assert.equal(r.status, status, r.stdout + r.stderr);
    const posters = r.stdout.split('\n').filter((l) => /^poster {4,}/.test(l));   // the table's rows, not the summary's lines
    assert.equal(posters.length, 1);
    assert.match(posters[0], /\/_astro\/portrait\.Pq7_k2Lm\.avif$/);
    assert.match(r.stdout, /^room land .*land-case-portrait/m);
    if (status) assert.match(r.stderr, /land case: portrait, AVIF/);
  }
  const broken = (files: Record<string, Buffer | string>, flags: string[], want: RegExp) => {
    const r = budget(fixture(files), ...flags);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, want);
  };
  broken({ '_astro/land-case-wide-depth.Ab3_x9Zq.avif': kb(13), '_astro/land-case-wide-depth.Bc4_y0Zr.webp': kb(13) }, ['--mode', 'build'], /land case: depth map, wide, AVIF/);
  broken({ '_astro/clip-1-2-wide.Ab3_x9Zq.mp4': kb(701) }, ['--mode', 'staging'], /option C: clip/);
  broken({ '_astro/travel-video.Cd5_z1Zs.js': 'export const c=1' }, ['--mode', 'build', '--pick', 'A'], /option C's chunk in a production build whose pick is A/);
  broken({ '_astro/park.Ab3_x9Zq.glb': kb(301) }, ['--mode', 'build', '--pick', 'B'], /option B: the park, GLB/);
  // the park's caps wait for B; another option's chunk is at home on staging; an unknown pick stops the script
  assert.equal(budget(fixture({ '_astro/park.Ab3_x9Zq.glb': kb(301) }), '--mode', 'staging', '--pick', 'A').status, 0);
  assert.equal(budget(fixture({ '_astro/travel-video.Cd5_z1Zs.js': 'export const c=1' }), '--mode', 'staging', '--pick', 'A').status, 0);
  assert.equal(budget(fixture(), '--pick', 'D').status, 1);
});

test("budget.mjs: option A's script reads 'over, pending Sam' past his 30 KB and stops the build only past the spec's 38 KB", () => {
  // the page's module import()s the island, and the island import()s a chunk of section 4 (known by its bridge's name);
  // random bytes, so the gzip size is the size
  const page = '<script type="module" src="/_astro/page.Ab3_x9Zq.js"></script>';
  const room = (n: number) => ({ '_astro/page.Ab3_x9Zq.js': 'import("./hero.Bc4_y0Zr.js")', '_astro/hero.Bc4_y0Zr.js': 'import("./director.Cd5_z1Zs.js")', '_astro/director.Cd5_z1Zs.js': Buffer.concat([Buffer.from('/*skreed:room*/'), randomBytes(n * 1024)]) });
  const row = (status: string) => new RegExp(`^ {2}${status} +[\\d.]+ KB of +${status === 'OVER' ? '38' : '30'}\\.0 KB {2}section 4's script, option A shipped`, 'm');
  for (const [n, status, code] of [[20, 'ok', 0], [33, 'over, pending Sam', 0], [39, 'OVER', 1]] as const) {
    const r = budget(fixture(room(n), undefined, page), '--mode', 'build', '--pick', 'A');
    assert.equal(r.status, code, r.stdout + r.stderr);
    assert.match(r.stdout, row(status), `${n} KB`);
    if (status === 'over, pending Sam') assert.match(r.stdout, /holds .* 1 over Sam's figure, pending him: section 4's script, option A shipped \(gzip\) at 33\.\d KB against his 30\.0 KB/);
    if (code) assert.match(r.stderr, /section 4's script, option A shipped \(gzip\): 39\.\d KB over 38\.0 KB/);
  }
  // B and C have no line of Sam's: their figures are the spec's
  const b = budget(fixture(room(33), undefined, page), '--mode', 'build', '--pick', 'B');
  assert.equal(b.status, 0, b.stderr);
  assert.match(b.stdout, /^ {2}ok +[\d.]+ KB of +45\.0 KB {2}section 4's script, option B shipped/m);
});

test("budget.mjs: AC8's formats, each picture AVIF with its WebP twin and each land's <img> with width and height", () => {
  const twin = { '_astro/land-case-portrait.Ab3_x9Zq.avif': kb(10), '_astro/land-case-portrait.Bc4_y0Zr.webp': kb(16) };
  const sized = '<picture><source data-srcset="/_astro/land-case-portrait.Ab3_x9Zq.avif" type="image/avif"><img src="/_astro/land-case-portrait.Bc4_y0Zr.webp" width="720" height="1280" alt=""></picture>';
  const ok = budget(fixture(twin, undefined, sized), '--mode', 'build');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /^ {2}ok +formats: 1 picture\(s\) by name, AVIF with WebP; 1 land <img> in the page/m);
  const fails = (files: Record<string, Buffer | string>, page: string, want: RegExp) => {
    const r = budget(fixture(files, undefined, page), '--mode', 'build');
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, want);
    assert.match(r.stdout, /^ {2}FAIL +formats:/m);
  };
  fails({ '_astro/land-case-portrait.Ab3_x9Zq.avif': kb(10) }, sized, /land-case-portrait: AVIF without its WebP twin/);
  fails({ '_astro/land-case-wide-depth.Bc4_y0Zr.webp': kb(4) }, '', /land-case-wide-depth: WebP without its AVIF twin/);
  fails(twin, sized.replace(' width="720" height="1280"', ''), /a <picture> of land-case-portrait\.Ab3_x9Zq\.avif: its <img> has no width and height/);
  fails(twin, '<noscript><img src="/_astro/land-case-portrait.Bc4_y0Zr.webp" width="720" alt=""></noscript>', /an <img> of land-case-portrait\.Bc4_y0Zr\.webp has no width and height/);
});

test('budget.mjs: once the world ships, the garden is in dist byte for byte or the build stops, never a garden of 0 KB', () => {
  const dir = join(ROOT, 'src/assets/room/garden');
  const pics = readdirSync(dir).filter((n) => /\.(?:avif|webp)$/.test(n));
  assert.ok(pics.length >= 2, 'the garden is in src/');
  // as shipped: each picture under a hashed name, its bytes unchanged (Vite's ?url)
  const shipped = (rename: (n: string) => string = (n) => n, bytes: (n: string) => Buffer = (n) => readFileSync(join(dir, n))) => Object.fromEntries(pics.map((n) => [`_astro/${rename(n).replace(/\.(avif|webp)$/, '.Gd7_b3Zu.$1')}`, bytes(n)]));
  const world = { '_astro/world.Ab3_x9Zq.js': 'export const w=1' };
  // no world: the garden is not in the build yet, and nothing is asked of it
  assert.equal(budget(fixture(), '--mode', 'build').status, 0);
  const all = budget(fixture({ ...world, ...shipped() }), '--mode', 'build');
  assert.equal(all.status, 0, all.stdout + all.stderr);
  assert.match(all.stdout, new RegExp(`the garden, ${pics.length} of ${pics.length} pictures shipped as they are in src/`));
  assert.match(all.stdout, /^room garden .*garden-plate\.Gd7_b3Zu\.avif/m);
  assert.doesNotMatch(all.stdout, /^ {2}ok +0\.0 KB of +110\.0 KB {2}the garden: far plate, AVIF/m);
  const stops = (files: Record<string, Buffer | string>, want: RegExp) => { const r = budget(fixture(files), '--mode', 'build'); assert.equal(r.status, 1, r.stdout); assert.match(r.stderr, want); };
  stops(world, new RegExp(`the world ships, but none of the ${pics.length} pictures in src/assets/room/garden is in dist byte for byte`));
  stops({ ...world, ...shipped((n) => `world-${n}`) }, /none of the .* pictures/);
  stops({ ...world, ...shipped(undefined, (n) => n === pics[0] ? Buffer.alloc(64, 3) : readFileSync(join(dir, n))) }, new RegExp(`the garden: ${pics[0].replace('.', '\\.')} \\(in dist, but not these bytes\\) not in dist byte for byte`));
  // a garden file in dist under its own name, re-encoded, is enough to know the world ships it, chunk or not
  stops(shipped(undefined, () => Buffer.alloc(64, 3)), /none of the .* pictures/);
});
