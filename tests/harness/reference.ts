// The stage 1 reference: the approved prototype v9.10, pinned in tests/fixtures/hero-v9.10/ (see its README.md).
// Every test, harness and script that compares the port against the prototype reads it from here, never from
// prototypes/hero-v9/, which later prototype builds (v10 and on) replace in place. Each read checks the file's SHA-256
// against the v9.10 hash below, so a changed reference fails loudly instead of silently moving the target.
// (hero.md section 7, hero-architecture.md 13.1)
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The git commit the reference was taken from (prototypes/hero-v9/ at v9.10). */
export const REF_COMMIT = 'ccce3fb7c94816a15d191d297be3c079ee1f3ba5';
export const REF_VERSION = 'v9.10';

/** tests/fixtures/hero-v9.10/, with a trailing slash. */
export const REF_DIR = fileURLToPath(new URL('../fixtures/hero-v9.10/', import.meta.url));

/** SHA-256 of the two pinned files, as at REF_COMMIT. */
export const REF_SHA256 = {
  'index.html': '29daf8815578061b7ea23450e7e08277a6c20a6e6ef5e3b3aa9ec3a45b956416',
  'template.html': '9b31a19a6594a64774ea0877e940db16fbadb71154c89975cffbcdc00b9d19b4',
} as const;
export type RefFile = keyof typeof REF_SHA256;

export const sha256 = (b: Buffer | string): string => createHash('sha256').update(b).digest('hex');

const cache = new Map<RefFile, Buffer>();

/** The bytes of one pinned file, checked against its v9.10 hash (throws on any difference). */
export function readReference(name: RefFile): Buffer {
  let b = cache.get(name);
  if (!b) {
    b = readFileSync(REF_DIR + name);
    const got = sha256(b);
    if (got !== REF_SHA256[name]) {
      throw new Error(`stage 1 reference ${REF_DIR}${name} is not prototype ${REF_VERSION} (sha256 ${got.slice(0, 12)}, want ${REF_SHA256[name].slice(0, 12)}); restore it with: git show ${REF_COMMIT.slice(0, 7)}:prototypes/hero-v9/${name}`);
    }
    cache.set(name, b);
  }
  return b;
}

/** The pinned file as UTF-8 text. */
export const readReferenceText = (name: RefFile): string => readReference(name).toString('utf8');

/** The v9.10 asset manifest (assets/* and pieces.json), as `hash  name` lines in the order of src/assets/hero/SHA256SUMS. */
export function referenceAssetSums(): { hash: string; name: string }[] {
  return readFileSync(REF_DIR + 'assets.SHA256SUMS', 'utf8').trim().split('\n').map((l) => {
    const [hash, name] = l.split('  ');
    return { hash, name };
  });
}
