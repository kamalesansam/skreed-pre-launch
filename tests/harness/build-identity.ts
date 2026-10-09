// Playwright global setup (playwright.config.ts): asserts which build the specs talk to, at the start of the run and
// again at its end (the returned teardown). The served `/` must be byte-identical to the build the run expects: the
// local `dist/index.html`, or `$SKREED_DIST/index.html` when the build was written elsewhere with astro build --outDir.
// Workflows on this machine share ports, and a server swapped under a running job would otherwise turn a pass into a
// comparison against the wrong site. With BASE_URL (a deployed host) and no SKREED_DIST, only the start and end hashes
// are compared with each other. (hero-architecture.md 13.1)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig } from '@playwright/test';
import { PORT_URL } from './browser.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const sha = (b: Buffer | Uint8Array) => createHash('sha256').update(b).digest('hex');

/** The SHA-256 of `/` as served at PORT_URL. */
export async function servedHash(): Promise<string> {
  const r = await fetch(PORT_URL, { cache: 'no-store', redirect: 'follow' });
  if (!r.ok) throw new Error(`build identity: ${PORT_URL} answered ${r.status}`);
  return sha(new Uint8Array(await r.arrayBuffer()));
}

/** The SHA-256 of the index.html the run expects, or null when there is no local build to compare with. */
export function expectedHash(): { hash: string; file: string } | null {
  const dir = process.env.SKREED_DIST ? resolve(process.env.SKREED_DIST) : process.env.BASE_URL ? null : resolve(ROOT, 'dist');
  if (!dir) return null;
  const file = resolve(dir, 'index.html');
  if (!existsSync(file)) throw new Error(`build identity: ${file} is missing; build first (npm run build:test, or astro build --outDir with SKREED_DIST)`);
  return { hash: sha(readFileSync(file)), file };
}

export default async function buildIdentity(_config: FullConfig): Promise<() => Promise<void>> {
  if (process.env.SKREED_SKIP_BUILD_ID === '1') {
    console.warn('[build identity] skipped (SKREED_SKIP_BUILD_ID=1)');
    return async () => {};
  }
  const want = expectedHash();
  const start = await servedHash();
  if (want && start !== want.hash) {
    throw new Error(`build identity: ${PORT_URL} serves / with sha256 ${start.slice(0, 16)}, but ${want.file} is ${want.hash.slice(0, 16)}. Another server holds this port, or the build changed; use your own SKREED_PORT.`);
  }
  console.log(`[build identity] start: ${PORT_URL} / sha256 ${start.slice(0, 16)}${want ? ` = ${want.file}` : ''}`);
  return async () => {
    const end = await servedHash();
    const wantEnd = expectedHash();
    if (end !== start || (wantEnd && end !== wantEnd.hash)) {
      const what = end !== start ? 'the served build changed during the run' : `${wantEnd!.file} changed during the run`;
      throw new Error(`build identity: ${what} (served at start ${start.slice(0, 16)}, at end ${end.slice(0, 16)}${wantEnd ? `; ${wantEnd.file} now ${wantEnd.hash.slice(0, 16)}` : ''}). Every result of this run is suspect; re-run on a port nobody else uses.`);
    }
    console.log(`[build identity] end: unchanged (${end.slice(0, 16)})`);
  };
}
