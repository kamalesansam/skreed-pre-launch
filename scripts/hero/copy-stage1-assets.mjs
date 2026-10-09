// Stage 1 assets (hero-architecture.md 6.1): copy the prototype's asset files byte for byte into src/assets/hero/
// and record their SHA-256 in src/assets/hero/SHA256SUMS. Later runs check the copies against the manifest and the
// prototype, and fail on any difference. Usage: node scripts/hero/copy-stage1-assets.mjs [--check]
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PROTO = join(ROOT, 'prototypes/hero-v9');
const DEST = join(ROOT, 'src/assets/hero');
const MANIFEST = join(DEST, 'SHA256SUMS');
const checkOnly = process.argv.includes('--check');

const sources = [
  ...readdirSync(join(PROTO, 'assets')).sort().map((name) => ({ name, from: join(PROTO, 'assets', name) })),
  { name: 'pieces.json', from: join(PROTO, 'pieces.json') },
];
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const fail = (msg) => { console.error('copy-stage1-assets: ' + msg); process.exit(1); };
if (!checkOnly) {
  mkdirSync(DEST, { recursive: true });
  for (const s of sources) copyFileSync(s.from, join(DEST, s.name));
}
const lines = sources.map((s) => {
  const want = sha(s.from), dest = join(DEST, s.name);
  if (!existsSync(dest)) fail(`${s.name} is missing from src/assets/hero`);
  const got = sha(dest);
  if (got !== want) fail(`${s.name} differs from the prototype (${got.slice(0, 12)} against ${want.slice(0, 12)})`);
  return `${want}  ${s.name}`;
});
const text = lines.join('\n') + '\n';
if (existsSync(MANIFEST)) {
  const old = readFileSync(MANIFEST, 'utf8');
  if (old !== text) {
    if (checkOnly) fail('SHA256SUMS does not match the copies');
    console.warn('copy-stage1-assets: SHA256SUMS rewritten (the prototype assets changed)');
  }
}
if (!checkOnly) writeFileSync(MANIFEST, text);
console.log(`copy-stage1-assets: ${sources.length} files ${checkOnly ? 'checked' : 'copied and checked'}`);
for (const l of lines) console.log('  ' + l.slice(0, 12) + '  ' + l.split('  ')[1]);
