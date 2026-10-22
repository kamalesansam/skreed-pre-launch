import { defineConfig } from 'astro/config';

// Section 4 ships one build: the five scene loops and their stills are in every mode (docs/specs/section-4-flux.md 5,
// "Build modes"); the travel pick, its alias to a stub and its environment variable went with the lands (X-11).
export default defineConfig({
  site: 'https://skreed.in',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  vite: {
    build: { assetsInlineLimit: 0 },
    // every three.js entry the islands import, pre-bundled up front: Vite otherwise discovers them one lazy chunk at a
    // time, re-optimises, and answers open tabs with "504 Outdated Optimize Dep" until a reload (seen 2026-10-16).
    // RoomEnvironment is here for section 4's carousel.ts, which lights its products under a PMREM of it;
    // tests/unit/build-modes.test.ts holds the list to what src/ imports
    optimizeDeps: { include: ['three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/utils/BufferGeometryUtils.js', 'three/addons/environments/RoomEnvironment.js', 'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js', 'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/SavePass.js', 'three/addons/postprocessing/UnrealBloomPass.js', 'three/addons/postprocessing/OutputPass.js'] },
  },
});
