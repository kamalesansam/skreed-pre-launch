// Stage 1 assets (hero-architecture.md 6.1): copy the prototype's asset files byte for byte into src/assets/hero/
// and record their SHA-256 in src/assets/hero/SHA256SUMS. The reference is prototype v9.10: the names and hashes come
// from tests/fixtures/hero-v9.10/assets.SHA256SUMS (git ccce3fb), and a source file under prototypes/hero-v9/ whose bytes
// differ from it is refused, because later prototype builds replace that folder in place. Later runs check the copies
// against the manifest and the reference, and fail on any difference.
// Usage: node scripts/hero/copy-stage1-assets.mjs [--check]
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REF_COMMIT, referenceAssetSums } from '../../tests/harness/reference.ts';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PROTO = join(ROOT, 'prototypes/hero-v9');
const DEST = join(ROOT, 'src/assets/hero');
const MANIFEST = join(DEST, 'SHA256SUMS');
const checkOnly = process.argv.includes('--check');

const REF = referenceAssetSums();
const sources = REF.map(({ name, hash }) => ({ name, hash, from: name === 'pieces.json' ? join(PROTO, 'pieces.json') : join(PROTO, 'assets', name) }));
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const fail = (msg) => { console.error('copy-stage1-assets: ' + msg); process.exit(1); };
const extra = readdirSync(join(PROTO, 'assets')).filter((n) => !REF.some((r) => r.name === n));
if (extra.length) console.warn(`copy-stage1-assets: not in the v9.10 reference, skipped: ${extra.join(', ')}`);
if (!checkOnly) {
  for (const s of sources) {
    if (!existsSync(s.from)) fail(`${s.from} is missing; restore it with git show ${REF_COMMIT.slice(0, 7)}:prototypes/hero-v9/${s.name === 'pieces.json' ? '' : 'assets/'}${s.name}`);
    const got = sha(s.from);
    if (got !== s.hash) fail(`${s.from} is not the v9.10 file (${got.slice(0, 12)} against ${s.hash.slice(0, 12)}); restore it from git ${REF_COMMIT.slice(0, 7)}`);
  }
  mkdirSync(DEST, { recursive: true });
  for (const s of sources) copyFileSync(s.from, join(DEST, s.name));
}
const lines = sources.map((s) => {
  const want = s.hash, dest = join(DEST, s.name);
  if (!existsSync(dest)) fail(`${s.name} is missing from src/assets/hero`);
  const got = sha(dest);
  if (got !== want) fail(`${s.name} differs from prototype v9.10 (${got.slice(0, 12)} against ${want.slice(0, 12)})`);
  return `${want}  ${s.name}`;
});
const text = lines.join('\n') + '\n';
if (existsSync(MANIFEST)) {
  const old = readFileSync(MANIFEST, 'utf8');
  if (old !== text) {
    if (checkOnly) fail('SHA256SUMS does not match the copies');
    console.warn('copy-stage1-assets: SHA256SUMS rewritten to the v9.10 reference');
  }
}
if (!checkOnly) writeFileSync(MANIFEST, text);
console.log(`copy-stage1-assets: ${sources.length} files ${checkOnly ? 'checked' : 'copied and checked'}`);
for (const l of lines) console.log('  ' + l.slice(0, 12) + '  ' + l.split('  ')[1]);
