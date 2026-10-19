import { defineConfig } from 'astro/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRAVEL, readPick } from './scripts/room/guards.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SECTION4 = resolve(ROOT, 'src/scripts/hero/section4');
export const TRAVEL_STUB = resolve(SECTION4, 'travel-stub.ts');

/**
 * Section 4's build modes (docs/specs/section-4-world.md 5, "Build modes"; W9). PUBLIC_PARK_TRAVEL (A, B or C, default A)
 * picks the travel between the lands: A travel-depth.ts, B travel-park.ts, C travel-video.ts, each in section4/. With
 * Tune off (build, build:test) the two that are not the pick resolve to travel-stub.ts, so neither their code nor their
 * ?url assets (the park's model and lightmap, the clips) enter the module graph: Vite emits a ?url asset as soon as its
 * importer is in the graph, even behind an import() that never runs. With Tune on (dev, build:staging) all three are in,
 * each its own lazy chunk. This is the alias as a resolveId hook rather than a resolve.alias entry, because an entry
 * matches the import's text and this matches the file it names: './travel-park.ts' from section4/ and
 * './section4/travel-park.ts' from hero/ are the same module, and a travel-park.ts anywhere else is not. It never reads
 * the files it replaces, so the build passes while they do not exist yet. tests/unit/build-modes.test.ts drives it.
 * @param {'A' | 'B' | 'C'} pick
 * @param {boolean} tune
 */
export function parkTravelAlias(pick, tune) {
  const off = new Set(tune ? [] : Object.entries(TRAVEL).filter(([k]) => k !== pick).map(([, name]) => resolve(SECTION4, `${name}.ts`)));
  return {
    name: 'skreed:park-travel',
    enforce: /** @type {const} */ ('pre'),
    /** @param {string} source @param {string | undefined} importer */
    resolveId(source, importer) {
      if (!off.size || !importer || !/travel-(?:depth|park|video)\.ts(?:\?|$)/.test(source)) return null;
      const path = source.split('?')[0];
      const file = path.startsWith('.') ? resolve(dirname(importer.split('?')[0]), path) : path.startsWith('/src/') ? resolve(ROOT, path.slice(1)) : path;
      return off.has(file) ? TRAVEL_STUB : null;
    },
  };
}

// the pick, checked here first so a typo fails the build before anything is bundled; written back so the client reads the
// same pick as import.meta.env.PUBLIC_PARK_TRAVEL (ROOM_PARAMS.parkTravel's default) when the variable was not set at all
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
    // time, re-optimises, and answers open tabs with "504 Outdated Optimize Dep" until a reload (seen 2026-10-16)
    optimizeDeps: { include: ['three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/utils/BufferGeometryUtils.js', 'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js', 'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/SavePass.js', 'three/addons/postprocessing/UnrealBloomPass.js', 'three/addons/postprocessing/OutputPass.js'] },
  },
});
