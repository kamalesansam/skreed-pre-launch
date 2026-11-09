// Section 4's guards, two of them.
// 1. The references (docs/specs/section-4.md AC9; docs/specs/section-4-flux.md AC9): nothing of the references the hall
//    was measured from, or the scenes were read from, ships. Their own asset and script file names, and the names that
//    identify them (the cruciform hall's, fluxtheory's, and the reference's scene file names), must not appear as files or
//    in the text of public/ and src/ (the measurements and the evidence live in docs/, which do not ship). Runs in npm run
//    test:unit.
// 2. The build (docs/specs/section-4-flux.md 5 "Build modes", AC7, AC8; post-build, run by npm run build and
//    build:staging after scripts/csp.mjs): a build whose landing page mounts section 4 ships exactly the ten scene
//    loops, named (cove|grove|ember|palace|dawn)-(wide|portrait).<hash>.mp4; any other .mp4, any land, park or garden
//    asset, and any asset of the hall (docs/specs/section-4-no-hall.md AC1), fails it in every mode, and dist/_headers
//    must carry media-src 'self'.
//    Changed 2026-11-09 (docs/specs/redesign.md D17 and criterion 9): the rule follows the page. Until then every
//    build had to ship the ten loops; the redesigned landing page mounts no section 4 (the old landing's code stays on
//    disk, unmounted, D2), so a build whose dist/index.html has no <section id="room"> must ship no .mp4 at all, no
//    scene still or picture, no products.bin, and no land, park, garden, clip or hall asset. Nothing is loosened for a
//    page that does mount the section: there the ten loops are asked for exactly as before. media-src 'self' is asked
//    of every build, with or without the section (scripts/csp.mjs writes it in every mode).
//    Added the same day, as the page changed under its own review (spec D18, D19 and D20), for a landing page that is the
//    redesign (main.rd) and the jars' own page: no id said twice in a built page (criterion 4); one sign-up form at most,
//    the jars' #suForm (D19: "remove that signup section"; the quiz's offer #qzForm is the quiz's, kept as built by D11);
//    and no picture in the build that no page names. pictures.ts's glob ships every file of the git-ignored
//    src/assets/redesign/, so a picture that has left the page (the sign-up's photograph, D19) would otherwise stay in
//    every build from a machine that still has its file, with nothing to show for it.
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
/** an asset of the hall (its model, lightmap and stills), gone since 2026-11-02 (section-4-no-hall.md AC1); the archive branch keeps them */
export const isHallAsset = (name) => /^hall[.-]/.test(name) && !/\.(?:js|map)$/.test(name);
/** the landing page mounts section 4: the built page carries its element, <section id="room"> (src/components/room/Room.astro) */
export const mountsRoom = (html) => /<section\b[^>]*\bid="room"/.test(html);
/** a scene's still or picture, in any image format (the same stems as the loops); section 4's alone */
export const isSceneAsset = (name) => /^(?:cove|grove|ember|palace|dawn)-(?:wide|portrait)\.[A-Za-z0-9_-]+\.(?:avif|webp|jpe?g|png|gif)$/i.test(name);
/** section 4's product models, products.<hash>.bin */
export const isProductsBin = (name) => /^products\.[A-Za-z0-9_-]+\.bin$/.test(name);
/** the landing page is the redesign: main.rd in the built page (src/pages/index.astro) */
export const isRedesign = (html) => /<main\b[^>]*\bclass="(?:[^"]*\s)?rd(?:\s[^"]*)?"/.test(html);
/** a built page's markup, the text of its scripts and styles taken out: what a browser parses into elements */
const markupOf = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
/** every id a built page says more than once */
export function idsSaidTwice(html) {
  const seen = new Set(), twice = new Set();
  for (const m of markupOf(html).matchAll(/<[a-z][^<>]*?\sid="([^"]+)"/gi)) (seen.has(m[1]) ? twice : seen).add(m[1]);
  return [...twice];
}
/** the forms of a built page, by id ('' for one with none) */
export const formIds = (html) => [...markupOf(html).matchAll(/<form\b[^>]*>/gi)].map((m) => m[0].match(/\sid="([^"]*)"/)?.[1] ?? '');
/** the quiz's own offer (components/quiz/Quiz.astro, behind PUBLIC_LEADS): the quiz is kept as built (docs/specs/redesign.md D11) */
const QUIZ_FORM = 'qzForm';
/** the page's sign-up, section 5's (components/signup/Signup.astro, behind PUBLIC_LEADS) */
const SIGNUP_FORM = 'suForm';
/** the pictures in dist/_astro whose names no page, script or stylesheet of the build says */
function unnamedPictures(dist) {
  const named = new Set();
  for (const p of walk(dist)) if (/\.(?:html|js|css)$/i.test(p)) for (const m of readFileSync(p, 'utf8').matchAll(/[\w.-]+\.(?:avif|webp)\b/gi)) named.add(m[0]);
  const astro = join(dist, '_astro');
  return existsSync(astro) ? [...walk(astro)].filter((p) => /\.(?:avif|webp)$/i.test(p) && !named.has(basename(p))) : [];
}

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

/**
 * the post-build guard on a built dist (the module comment, 2). With section 4 on the landing page: any file the build
 * may not ship, a loop missing, and a media-src that is not 'self'. Without it (2026-11-09, docs/specs/redesign.md D17):
 * any video at all and anything of the scenes, and the same media-src.
 */
export function postBuild(dist, { mode }) {
  const hits = [], loops = new Set();
  if (!existsSync(join(dist, 'index.html'))) return [`${dist}: no index.html (build first)`];
  const landing = readFileSync(join(dist, 'index.html'), 'utf8');
  const room = mountsRoom(landing);
  for (const p of walk(dist)) {
    const name = basename(p), at = relative(dist, p);
    if (/\.mp4$/i.test(name)) {
      const m = LOOP_NAME.exec(name);
      if (!room) hits.push(`${at}: a video in a build whose landing page mounts no section 4 (docs/specs/redesign.md D17: no .mp4 at all)`);
      else if (!m) hits.push(`${at}: a video that is not one of the ten scene loops ((cove|grove|ember|palace|dawn)-(wide|portrait).<hash>.mp4)`);
      else loops.add(`${m[1]}-${m[2]}`);
    }
    if (!room && isSceneAsset(name)) hits.push(`${at}: a still or picture of section 4's scenes in a build whose landing page mounts no section 4 (docs/specs/redesign.md D17)`);
    if (!room && isProductsBin(name)) hits.push(`${at}: section 4's product models in a build whose landing page mounts no section 4 (docs/specs/redesign.md D17)`);
    if (isLandAsset(name)) hits.push(`${at}: an asset of the lands, the park, the garden or the clips, which left with part two (X-11)`);
    if (isHallAsset(name)) hits.push(`${at}: an asset of the hall, which left on 2026-11-02 (section-4-no-hall.md AC1)`);
  }
  if (room) for (const id of SCENE_IDS) for (const cls of CLASSES) if (!loops.has(`${id}-${cls}`)) hits.push(`no loop ${id}-${cls}.<hash>.mp4 in the ${MODE_NAMES[mode]} (a build with section 4 on the landing page ships the ten)`);
  // the redesigned landing and the jars' own page (the module comment, 2)
  if (isRedesign(landing)) {
    const jars = join(dist, 'jars', 'index.html');
    for (const [at, html] of [['index.html', landing], ...(existsSync(jars) ? [['jars/index.html', readFileSync(jars, 'utf8')]] : [])]) {
      for (const id of idsSaidTwice(html)) hits.push(`${at}: the id "${id}" is said twice (docs/specs/redesign.md criterion 4)`);
      const signup = formIds(html).filter((id) => id !== QUIZ_FORM);
      if (signup.length > 1 || (signup.length === 1 && signup[0] !== SIGNUP_FORM)) hits.push(`${at}: its sign-up forms are ${signup.map((id) => `#${id || '(no id)'}`).join(', ')}; the page has one, #${SIGNUP_FORM} (docs/specs/redesign.md D19)`);
    }
    for (const p of unnamedPictures(dist)) hits.push(`${relative(dist, p)}: a picture no page of this build names (pictures.ts ships every file of src/assets/redesign/: delete what has left the page and run scripts/redesign/encode-pictures.mjs)`);
  }
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
    const landing = readFileSync(join(dist, 'index.html'), 'utf8');
    console.log(mountsRoom(landing) ? `section 4 build guard (${MODE_NAMES[mode]}): the ten loops and nothing else, media-src 'self'`
      : `section 4 build guard (${MODE_NAMES[mode]}): no section 4 on the landing page, so no video and nothing of the scenes, the lands or the hall; media-src 'self'`);
    if (isRedesign(landing)) console.log(`redesign build guard (${MODE_NAMES[mode]}): no id said twice, one sign-up form at most, no picture that no page names`);
  } else {
    const hits = scan();
    if (hits.length) { console.error(`section 4 guard: ${hits.length} hit(s)\n${hits.join('\n')}`); process.exit(1); }
    console.log('section 4 guard: nothing of the references in public/ or src/');
  }
}
