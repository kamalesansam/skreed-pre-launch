// Section 4's build modes (docs/specs/section-4-world.md 5 "Build modes", AC8 and AC13). scripts/csp.mjs writes the
// media-src each mode needs, run on a tiny dist in a temporary folder, both on its own and through package.json's own
// script text with astro build left out; astro.config.mjs's alias resolves the travel options that are not the pick to
// travel-stub.ts, by the file an import names, and resolves nothing with Tune on; the post-build guard refuses a clip, a
// park asset or another option's chunk where the mode does not allow it; scripts/hero/budget.mjs exits 1 on a broken line
// and keeps a land picture out of the hero's posters. A real Vite graph is not built here (see the branch's report).
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

test('the alias: the options that are not the pick resolve to travel-stub.ts, by the file an import names; with Tune on none do', () => {
  const s4 = join(ROOT, 'src/scripts/hero/section4'), director = join(s4, 'director.ts');
  for (const pick of PICKS) {
    const alias = parkTravelAlias(pick, false);
    for (const opt of PICKS) assert.equal(alias.resolveId(`./${TRAVEL[opt]}.ts`, director), opt === pick ? null : TRAVEL_STUB, `pick ${pick}, ${TRAVEL[opt]}`);
    const tune = parkTravelAlias(pick, true);
    for (const opt of PICKS) assert.equal(tune.resolveId(`./${TRAVEL[opt]}.ts`, director), null, `Tune on, pick ${pick}, ${TRAVEL[opt]}`);
  }
  const a = parkTravelAlias('A', false);
  assert.equal(a.resolveId('./section4/travel-park.ts', join(ROOT, 'src/scripts/hero/hero.ts')), TRAVEL_STUB, 'from hero/');
  assert.equal(a.resolveId('./travel-video.ts?import', `${join(s4, 'world.ts')}?v=1`), TRAVEL_STUB, 'with queries');
  assert.equal(a.resolveId('/src/scripts/hero/section4/travel-park.ts', join(ROOT, 'src/components/room/Room.astro?astro&type=script&index=0&lang.ts')), TRAVEL_STUB, 'root-relative, from a component script');
  assert.equal(a.resolveId('./travel-park.ts', join(ROOT, 'src/scripts/quiz/deck.ts')), null, 'a travel-park.ts outside section4 is another module');
  assert.equal(a.resolveId('./director.ts', director), null);
  assert.equal(a.resolveId('./travel-park.ts', undefined), null, 'an entry has no importer');
  // the alias never reads what it replaces, so the build passes before the options exist; the stub is there
  assert.ok(existsSync(TRAVEL_STUB));
  assert.match(readFileSync(TRAVEL_STUB, 'utf8'), /^export const TRAVEL_STUB = true;$/m);
});

test("astro.config.mjs: the alias is wired with the environment's pick and Tune, and RoomEnvironment is out of optimizeDeps", () => {
  const plugins = (config.vite?.plugins ?? []) as unknown as { name?: string; resolveId?: (s: string, i?: string) => string | null }[];
  const alias = plugins.find((p) => p?.name === 'skreed:park-travel');
  assert.ok(alias?.resolveId, 'the alias is among the Vite plugins');
  // this test process was started without a pick and without Tune unless the shell set them (the config read it at import)
  const pick = process.env.PUBLIC_PARK_TRAVEL ?? 'A', tune = process.env.PUBLIC_TUNE === '1';
  for (const opt of PICKS) assert.equal(alias.resolveId(`./${TRAVEL[opt]}.ts`, join(ROOT, 'src/scripts/hero/section4/director.ts')), tune || opt === pick ? null : TRAVEL_STUB, TRAVEL[opt]);
  assert.ok(!(config.vite?.optimizeDeps?.include ?? []).some((e) => /RoomEnvironment/.test(e)), 'the universe goes, and its environment with it');
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

test("budget.mjs: section 6's lines exit 1 when broken, and a land picture is never the hero's poster", () => {
  const budget = (dist: string, ...flags: string[]) => run(['scripts/hero/budget.mjs', dist, ...flags]);
  const page = '<picture><source data-srcset="/_astro/land-case-portrait.Ab3_x9Zq.avif"><img src="/_astro/portrait.Pq7_k2Lm.avif" alt=""></picture>';
  // at the line passes, one byte over breaks it
  for (const [bytes, status] of [[80 * 1024, 0], [80 * 1024 + 1, 1]] as const) {
    const r = budget(fixture({ '_astro/land-case-portrait.Ab3_x9Zq.avif': Buffer.alloc(bytes, 1), '_astro/portrait.Pq7_k2Lm.avif': kb(30) }, undefined, page), '--mode', 'build', '--pick', 'A');
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
  broken({ '_astro/land-case-wide-depth.Ab3_x9Zq.avif': kb(13) }, ['--mode', 'build'], /land case: depth map, wide, AVIF/);
  broken({ '_astro/clip-1-2-wide.Ab3_x9Zq.mp4': kb(701) }, ['--mode', 'staging'], /option C: clip/);
  broken({ '_astro/travel-video.Cd5_z1Zs.js': 'export const c=1' }, ['--mode', 'build', '--pick', 'A'], /option C's chunk in a production build whose pick is A/);
  broken({ '_astro/park.Ab3_x9Zq.glb': kb(301) }, ['--mode', 'build', '--pick', 'B'], /option B: the park, GLB/);
  // the park's caps wait for B; another option's chunk is at home on staging; an unknown pick stops the script
  assert.equal(budget(fixture({ '_astro/park.Ab3_x9Zq.glb': kb(301) }), '--mode', 'staging', '--pick', 'A').status, 0);
  assert.equal(budget(fixture({ '_astro/travel-video.Cd5_z1Zs.js': 'export const c=1' }), '--mode', 'staging', '--pick', 'A').status, 0);
  assert.equal(budget(fixture(), '--pick', 'D').status, 1);
});
