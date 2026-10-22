import { defineConfig } from 'astro/config';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRAVEL, readPick } from './scripts/room/guards.mjs';

// real paths, because Vite resolves an import to the real path of its file (a symlinked folder would otherwise never match)
const ROOT = realpathSync(fileURLToPath(new URL('.', import.meta.url)));
const SECTION4 = resolve(ROOT, 'src/scripts/hero/section4');
export const TRAVEL_STUB = resolve(SECTION4, 'travel-stub.ts');

/**
 * Section 4's build modes (docs/specs/section-4-world.md 5, "Build modes"; W9). PUBLIC_PARK_TRAVEL (A, B or C, default A)
 * picks the travel between the lands: A travel-depth.ts, B travel-park.ts, C travel-video.ts, each in section4/. With
 * Tune off (build, build:test) the two that are not the pick resolve to travel-stub.ts, so neither their code nor their
 * ?url assets (the park's model and lightmap, the clips) enter the module graph: Vite emits a ?url asset as soon as its
 * importer is in the graph, even behind an import() that never runs. With Tune on (dev, build:staging) all three are in,
 * each its own lazy chunk. This is the alias as a resolveId hook rather than a resolve.alias entry, because an entry
 * matches the import's text and this matches the file the import resolves to (this.resolve, the other resolvers):
 * './travel-park.ts', './travel-park', './travel-park.js' and '/src/scripts/hero/section4/travel-park.ts' are the same
 * module, and a travel-park.ts anywhere else is not. An option not written yet resolves to nothing; its path is then read
 * from the import (no extension, or .js, means .ts), so the build passes while the other options do not exist. What the
 * stub allows, and the two rules that follow from it, are in travel-stub.ts. tests/unit/build-modes.test.ts builds a
 * real graph through it. dir is section4/ but for the tests.
 * @param {'A' | 'B' | 'C'} pick
 * @param {boolean} tune
 * @param {string} [dir]
 * @returns {import('vite').Plugin}
 */
export function parkTravelAlias(pick, tune, dir = SECTION4) {
  const at = realpathSync(dir);
  const off = new Set(tune ? [] : Object.entries(TRAVEL).filter(([k]) => k !== pick).map(([, name]) => resolve(at, `${name}.ts`)));
  let root = ROOT;
  /** the file an import of a module that does not exist yet names: relative to its importer, or to Vite's root @param {string} source @param {string} importer */
  const unwritten = (source, importer) => {
    const path = source.split('?')[0];
    const file = path.startsWith('.') ? resolve(dirname(importer.split('?')[0]), path) : path.startsWith('/') ? (path.startsWith(root) ? path : resolve(root, `.${path}`)) : null;
    return file && `${file.replace(/\.[jt]s$/, '')}.ts`;
  };
  return {
    name: 'skreed:park-travel',
    enforce: 'pre',
    configResolved(config) { root = realpathSync(config.root); },
    async resolveId(source, importer, options) {
      // only an import whose text names a travel option is resolved twice; every other import passes untouched
      if (!off.size || !importer || !/travel-(?:depth|park|video)/.test(source)) return null;
      const hit = await this.resolve(source, importer, { ...options, skipSelf: true });
      const file = hit ? (hit.external ? null : hit.id.split('?')[0]) : unwritten(source, importer);
      return file && off.has(file) ? TRAVEL_STUB : null;
    },
  };
}

// the pick, checked here first so a typo fails the build before anything is bundled; written back so the client reads the
// same pick as import.meta.env.PUBLIC_PARK_TRAVEL when the variable was not set at all (ROOM_PARAMS.parkTravel defaults
// from it)
const PICK = readPick([], process.env);
process.env.PUBLIC_PARK_TRAVEL = PICK;

export default defineConfig({
  site: 'https://skreed.in',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  vite: {
    build: { assetsInlineLimit: 0 },
    plugins: [parkTravelAlias(PICK, process.env.PUBLIC_TUNE === '1')],
    // every three.js entry the islands import, pre-bundled up front: Vite otherwise discovers them one lazy chunk at a
    // time, re-optimises, and answers open tabs with "504 Outdated Optimize Dep" until a reload (seen 2026-10-16).
    // RoomEnvironment left with universe.ts, its only importer; tests/unit/build-modes.test.ts holds the list to what
    // src/ imports
    optimizeDeps: { include: ['three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/utils/BufferGeometryUtils.js', 'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js', 'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/SavePass.js', 'three/addons/postprocessing/UnrealBloomPass.js', 'three/addons/postprocessing/OutputPass.js'] },
  },
});
