// Section 4's guards, two of them.
// 1. The reference (docs/specs/section-4.md AC9): nothing of the reference the hall was measured from ships. The
//    reference's own asset and script file names, and the names that identify it, must not appear as files or in the text
//    of public/ and src/ (the measurements live in docs/, which do not ship). Runs in npm run test:unit.
// 2. The build modes (docs/specs/section-4-world.md 5 "Build modes", AC13; post-build, run by npm run build and
//    build:staging after scripts/csp.mjs): a build ships only the travel option PUBLIC_PARK_TRAVEL picks (A, B or C,
//    default A). In a build with Tune off (build, build:test) any .mp4 fails unless the pick is C, any park asset unless
//    it is B, and any chunk of an option that is not the pick (astro.config.mjs resolves those to travel-stub.ts, so one
//    here means the alias missed); with Tune on (build:staging) all three options and their files are in. In every mode
//    dist/_headers must carry the media-src the mode needs: 'self' on staging and for a C build, 'none' otherwise.
// Each exits 1 with every hit.
//   node scripts/room/guards.mjs                                              the reference, in public/ and src/
//   node scripts/room/guards.mjs --post-build [--dist <dir>] [--mode build|test|staging] [--pick A|B|C]
// The mode and the pick come from the flags, else from the environment (PUBLIC_PARK_TRAVEL; PUBLIC_TUNE '1' is staging,
// PUBLIC_HERO_HOOKS '1' the test build), else build and A. scripts/hero/budget.mjs and astro.config.mjs read them here too.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** the reference's files (its asset and script names) and the strings that would mark its code or its assets */
export const NAMES = ['baked_4096.jpg', 'spec_4096.jpg', 'norm_4096.jpg', 'orb-norm.png', 'orb.obj', 'hall.obj', 'displacement.jpg', 'track.mp3', 'headphones.svg', 'storyboard.js', 'timeline.js', 'Wagner.js', 'Wagner.base.js', 'ShaderLoader.js', 'bleach-fs.glsl', 'vignette2-fs.glsl', 'dof-fs.glsl', 'bokeh-poison-dof-fs.glsl'];
export const STRINGS = [/clicktorelease/i, /cruciform/i, /\bWAGNER\b/, /baked_4096|spec_4096|norm_4096/, /orb-norm/];
const TEXT = new Set(['.ts', '.js', '.mjs', '.astro', '.css', '.json', '.html', '.svg', '.txt', '.md', '.glsl']);

/**
 * the travel options (section-4-world.md 2): the pick, and the module in src/scripts/hero/section4/ that carries it
 * @type {readonly ('A' | 'B' | 'C')[]}
 */
export const PICKS = Object.freeze(['A', 'B', 'C']);
export const TRAVEL = Object.freeze({ A: 'travel-depth', B: 'travel-park', C: 'travel-video' });
/** the npm scripts a dist comes from: build (production), build:test (hooks on), build:staging (Tune on, all three options) */
export const MODES = Object.freeze(['build', 'test', 'staging']);
export const MODE_NAMES = Object.freeze({ build: 'production build', test: 'test build', staging: 'staging build' });

const flag = (argv, name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
/**
 * the pick: --pick, else PUBLIC_PARK_TRAVEL, else A; anything but A, B or C throws, so a typo never ships the default
 * @param {readonly string[]} [argv] @param {Record<string, string | undefined>} [env] @returns {'A' | 'B' | 'C'}
 */
export function readPick(argv = process.argv, env = process.env) {
  const pick = flag(argv, '--pick') ?? (env.PUBLIC_PARK_TRAVEL || 'A');
  if (!PICKS.includes(pick)) throw new Error(`PUBLIC_PARK_TRAVEL (or --pick) must be A, B or C, not ${JSON.stringify(pick)}`);
  return pick;
}
/**
 * the mode: --mode, else the environment the npm script set, else build
 * @param {readonly string[]} [argv] @param {Record<string, string | undefined>} [env] @returns {'build' | 'test' | 'staging'}
 */
export function readMode(argv = process.argv, env = process.env) {
  const mode = flag(argv, '--mode') ?? (env.PUBLIC_TUNE === '1' ? 'staging' : env.PUBLIC_HERO_HOOKS === '1' ? 'test' : 'build');
  if (!MODES.includes(mode)) throw new Error(`--mode must be one of ${MODES.join(', ')}, not ${JSON.stringify(mode)}`);
  return mode;
}

/** option B's files (section-4-world.md 3, "Option B's park"): every file named park.* or park-* (the model, its lightmap, the skyline card) */
export const isParkAsset = (name) => /^park[.-]/.test(name) && !/\.(?:js|map)$/.test(name);
/** a travel option's own chunk, by the name Vite gives a dynamic import's chunk: travel-depth.<hash>.js; the option, or null */
export const travelChunkOption = (name) => {
  const m = /^(travel-[a-z]+)\.[A-Za-z0-9_-]+\.js$/.exec(name);
  return m ? (PICKS.find((k) => TRAVEL[k] === m[1]) ?? null) : null;
};

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name), st = statSync(p);
    if (st.isDirectory()) yield* walk(p); else yield p;
  }
}

export function scan(roots = ['public', 'src']) {
  const hits = [];
  for (const root of roots) for (const p of walk(root)) {
    if (NAMES.includes(basename(p))) hits.push(`${p}: the reference's file name`);
    if (!TEXT.has(extname(p))) continue;
    const text = readFileSync(p, 'utf8');
    for (const re of STRINGS) if (re.test(text)) hits.push(`${p}: matches ${re}`);
    for (const n of NAMES) if (text.includes(n) && !/\.(test|spec)\./.test(p)) hits.push(`${p}: names the reference's ${n}`);
  }
  return hits;
}

/** the post-build guard on a built dist (the module comment, 2): every file the mode and the pick do not allow, and a media-src that does not match */
export function postBuild(dist, { mode, pick }) {
  const tune = mode === 'staging', hits = [];
  if (!existsSync(join(dist, 'index.html'))) return [`${dist}: no index.html (build first)`];
  for (const p of walk(dist)) {
    const name = basename(p), at = relative(dist, p);
    if (/\.mp4$/i.test(name) && !tune && pick !== 'C') hits.push(`${at}: a clip in a ${MODE_NAMES[mode]} whose pick is ${pick} (clips ship only with C, or on staging)`);
    if (isParkAsset(name) && !tune && pick !== 'B') hits.push(`${at}: a park asset in a ${MODE_NAMES[mode]} whose pick is ${pick} (the park ships only with B, or on staging)`);
    const opt = travelChunkOption(name);
    if (opt && opt !== pick && !tune) hits.push(`${at}: option ${opt}'s chunk in a ${MODE_NAMES[mode]} whose pick is ${pick} (astro.config.mjs should have resolved it to travel-stub.ts)`);
  }
  const want = tune || pick === 'C' ? "'self'" : "'none'";
  const headers = existsSync(join(dist, '_headers')) ? readFileSync(join(dist, '_headers'), 'utf8') : '';
  const csp = headers.split('\n').find((l) => /^\s+Content-Security-Policy(?:-Report-Only)?:/.test(l));
  const media = csp?.match(/media-src ([^;]+)/)?.[1].trim();
  if (!csp) hits.push('_headers: no Content-Security-Policy line (run scripts/csp.mjs first)');
  else if (media !== want) hits.push(`_headers: media-src ${media ?? '(absent)'}, a ${MODE_NAMES[mode]} with pick ${pick} needs ${want} (scripts/csp.mjs --media)`);
  return hits;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (process.argv.includes('--post-build')) {
    let mode, pick;
    try { mode = readMode(); pick = readPick(); } catch (e) { console.error(`section 4 build guard: ${e.message}`); process.exit(1); }
    const dist = resolve(flag(process.argv, '--dist') ?? 'dist');
    const hits = postBuild(dist, { mode, pick });
    if (hits.length) { console.error(`section 4 build guard (${MODE_NAMES[mode]}, pick ${pick}): ${hits.length} hit(s)\n${hits.join('\n')}`); process.exit(1); }
    console.log(`section 4 build guard (${MODE_NAMES[mode]}, pick ${pick}): only what the mode allows ships, media-src matches`);
  } else {
    const hits = scan();
    if (hits.length) { console.error(`section 4 guard: ${hits.length} hit(s)\n${hits.join('\n')}`); process.exit(1); }
    console.log('section 4 guard: nothing of the reference in public/ or src/');
  }
}
