// Sam's quiz wallpapers (2026-11-03: "the wallpapers and a copy of their quiz result will be sent alongside email #2")
// copied from his folder into server/wallpapers/ under shade ids, for the quiz email's attachments: Set B, plain, as
// <id>-plain.png, Set A, patterned, as <id>-pattern.png, and index.json with each shade's name. The folder is git-ignored
// (his uploads never go into the public repository); `npm run deploy:hostinger` uploads it beside the endpoint.
// Usage: node scripts/quiz/prepare-wallpapers.mjs "<the unzipped Quiz Wallpapers folder>"
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2];
if (!src || !existsSync(join(src, 'Set A')) || !existsSync(join(src, 'Set B'))) {
  console.error('usage: node scripts/quiz/prepare-wallpapers.mjs "<folder holding Set A and Set B>"');
  process.exit(1);
}
const root = new URL('../../', import.meta.url).pathname;
const { names } = JSON.parse(readFileSync(join(root, 'scripts/quiz/wallpaper-names.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(join(root, 'docs/data/shades-240.json'), 'utf8'));
const shadeName = Object.fromEntries(catalog.families.flatMap((f) => f.shades.map((s) => [s.id, s.name])));
const out = join(root, 'server/wallpapers');
mkdirSync(out, { recursive: true });
const index = {}, unknown = [];
for (const [set, kind] of [['Set B', 'plain'], ['Set A', 'pattern']]) {
  for (const f of readdirSync(join(src, set))) {
    if (!f.toLowerCase().endsWith('.png')) continue;
    const id = names[f.slice(0, -4).toLowerCase()];
    if (!id) { unknown.push(`${set}/${f}`); continue; }
    copyFileSync(join(src, set, f), join(out, `${id}-${kind}.png`));
    index[id] = shadeName[id];
  }
}
writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1));
console.log(`wallpapers: ${Object.keys(index).length} shades into server/wallpapers/${unknown.length ? `; not in the table: ${unknown.join(', ')}` : ''}`);
if (unknown.length) process.exit(1);
