// Section 4's guard (docs/specs/section-4.md AC9): nothing of the reference the hall was measured from ships. The
// reference's own asset and script file names, and the names that identify it, must not appear as files or in the text
// of public/ and src/ (the measurements live in docs/, which do not ship). Exits 1 with each hit.
//   node scripts/room/guards.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

/** the reference's files (its asset and script names) and the strings that would mark its code or its assets */
export const NAMES = ['baked_4096.jpg', 'spec_4096.jpg', 'norm_4096.jpg', 'orb-norm.png', 'orb.obj', 'hall.obj', 'displacement.jpg', 'track.mp3', 'headphones.svg', 'storyboard.js', 'timeline.js', 'Wagner.js', 'Wagner.base.js', 'ShaderLoader.js', 'bleach-fs.glsl', 'vignette2-fs.glsl', 'dof-fs.glsl', 'bokeh-poison-dof-fs.glsl'];
export const STRINGS = [/clicktorelease/i, /cruciform/i, /\bWAGNER\b/, /baked_4096|spec_4096|norm_4096/, /orb-norm/];
const TEXT = new Set(['.ts', '.js', '.mjs', '.astro', '.css', '.json', '.html', '.svg', '.txt', '.md', '.glsl']);

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const hits = scan();
  if (hits.length) { console.error(`section 4 guard: ${hits.length} hit(s)\n${hits.join('\n')}`); process.exit(1); }
  console.log('section 4 guard: nothing of the reference in public/ or src/');
}
