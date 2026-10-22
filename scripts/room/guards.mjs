// Section 4's guards, two of them.
// 1. The references (docs/specs/section-4.md AC9; docs/specs/section-4-flux.md AC9): nothing of the references the hall
//    was measured from, or the scenes were read from, ships. Their own asset and script file names, and the names that
//    identify them (the cruciform hall's, fluxtheory's, and the reference's scene file names), must not appear as files or
//    in the text of public/ and src/ (the measurements and the evidence live in docs/, which do not ship). Runs in npm run
//    test:unit.
// 2. The build (docs/specs/section-4-flux.md 5 "Build modes", AC7, AC8; post-build, run by npm run build and
//    build:staging after scripts/csp.mjs): every build ships exactly the ten scene loops, named
//    (cove|grove|ember|palace|dawn)-(wide|portrait).<hash>.mp4; any other .mp4, and any land, park or garden asset,
//    fails it in every mode, and dist/_headers must carry media-src 'self'.
// Each exits 1 with every hit.
//   node scripts/room/guards.mjs                                              the references, in public/ and src/
//   node scripts/room/guards.mjs --post-build [--dist <dir>] [--mode build|test|staging]
// The mode comes from the flag, else from the environment (PUBLIC_TUNE '1' is staging, PUBLIC_HERO_HOOKS '1' the test
// build), else build. scripts/hero/budget.mjs reads it here too.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * the references' files (their asset and script names) and the strings that would mark their code or their assets: the
 * cruciform hall's, and fluxtheory's scene file names (section-4-flux.md 5; never the bare words of its personas, which
 * are English)
 */
export const NAMES = ['baked_4096.jpg', 'spec_4096.jpg', 'norm_4096.jpg', 'orb-norm.png', 'orb.obj', 'hall.obj', 'displacement.jpg', 'track.mp3', 'headphones.svg', 'storyboard.js', 'timeline.js', 'Wagner.js', 'Wagner.base.js', 'ShaderLoader.js', 'bleach-fs.glsl', 'vignette2-fs.glsl', 'dof-fs.glsl', 'bokeh-poison-dof-fs.glsl',
  'bathroom-1-c', 'bathroom-2', 'bathroom-5', 'lover-loop', 'lover-intro', 'dreamer-loop', 'dreamer-intro', 'dreamer-outro'];
export const STRINGS = [/clicktorelease/i, /cruciform/i, /\bWAGNER\b/, /baked_4096|spec_4096|norm_4096/, /orb-norm/, /fluxtheory/i];
const TEXT = new Set(['.ts', '.js', '.mjs', '.astro', '.css', '.json', '.html', '.svg', '.txt', '.md', '.glsl']);

/** the npm scripts a dist comes from: build (production), build:test (hooks on), build:staging (Tune on) */
export const MODES = Object.freeze(['build', 'test', 'staging']);
export const MODE_NAMES = Object.freeze({ build: 'production build', test: 'test build', staging: 'staging build' });
/** the scene ids (config/room.ts ROOM_SCENES) and the loop classes, as the file names carry them */
export const SCENE_IDS = Object.freeze(['cove', 'grove', 'ember', 'palace', 'dawn']);
export const CLASSES = Object.freeze(['wide', 'portrait']);
/** a shipped loop's name in dist/_astro: exactly the ten (section-4-flux.md 5, "Build modes") */
export const LOOP_NAME = /^(cove|grove|ember|palace|dawn)-(wide|portrait)\.[A-Za-z0-9_-]+\.mp4$/;
/** an asset of the lands, the park or the garden, gone with part two (X-11) */
export const isLandAsset = (name) => /^(?:land-|park[.-]|garden-|clip-)/.test(name) && !/\.(?:js|map)$/.test(name);

const flag = (argv, name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
/**
 * the mode: --mode, else the environment the npm script set, else build
 * @param {readonly string[]} [argv] @param {Record<string, string | undefined>} [env] @returns {'build' | 'test' | 'staging'}
 */
export function readMode(argv = process.argv, env = process.env) {
  const mode = flag(argv, '--mode') ?? (env.PUBLIC_TUNE === '1' ? 'staging' : env.PUBLIC_HERO_HOOKS === '1' ? 'test' : 'build');
  if (!MODES.includes(mode)) throw new Error(`--mode must be one of ${MODES.join(', ')}, not ${JSON.stringify(mode)}`);
  return mode;
}

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

/** the post-build guard on a built dist (the module comment, 2): any file the build may not ship, a loop missing, and a media-src that is not 'self' */
export function postBuild(dist, { mode }) {
  const hits = [], loops = new Set();
  if (!existsSync(join(dist, 'index.html'))) return [`${dist}: no index.html (build first)`];
  for (const p of walk(dist)) {
    const name = basename(p), at = relative(dist, p);
    if (/\.mp4$/i.test(name)) {
      const m = LOOP_NAME.exec(name);
      if (!m) hits.push(`${at}: a video that is not one of the ten scene loops ((cove|grove|ember|palace|dawn)-(wide|portrait).<hash>.mp4)`);
      else loops.add(`${m[1]}-${m[2]}`);
    }
    if (isLandAsset(name)) hits.push(`${at}: an asset of the lands, the park, the garden or the clips, which left with part two (X-11)`);
  }
  for (const id of SCENE_IDS) for (const cls of CLASSES) if (!loops.has(`${id}-${cls}`)) hits.push(`no loop ${id}-${cls}.<hash>.mp4 in the ${MODE_NAMES[mode]} (every build ships the ten)`);
  const headers = existsSync(join(dist, '_headers')) ? readFileSync(join(dist, '_headers'), 'utf8') : '';
  const csp = headers.split('\n').find((l) => /^\s+Content-Security-Policy(?:-Report-Only)?:/.test(l));
  const media = csp?.match(/media-src ([^;]+)/)?.[1].trim();
  if (!csp) hits.push('_headers: no Content-Security-Policy line (run scripts/csp.mjs first)');
  else if (media !== "'self'") hits.push(`_headers: media-src ${media ?? '(absent)'}, every build needs 'self' (scripts/csp.mjs)`);
  return hits;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (process.argv.includes('--post-build')) {
    let mode;
    try { mode = readMode(); } catch (e) { console.error(`section 4 build guard: ${e.message}`); process.exit(1); }
    const dist = resolve(flag(process.argv, '--dist') ?? 'dist');
    const hits = postBuild(dist, { mode });
    if (hits.length) { console.error(`section 4 build guard (${MODE_NAMES[mode]}): ${hits.length} hit(s)\n${hits.join('\n')}`); process.exit(1); }
    console.log(`section 4 build guard (${MODE_NAMES[mode]}): the ten loops and nothing else, media-src 'self'`);
  } else {
    const hits = scan();
    if (hits.length) { console.error(`section 4 guard: ${hits.length} hit(s)\n${hits.join('\n')}`); process.exit(1); }
    console.log('section 4 guard: nothing of the references in public/ or src/');
  }
}
