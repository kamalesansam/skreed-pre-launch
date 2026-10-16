import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://skreed.in',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  vite: {
    build: { assetsInlineLimit: 0 },
    // every three.js entry the islands import, pre-bundled up front: Vite otherwise discovers them one lazy chunk at a
    // time, re-optimises, and answers open tabs with "504 Outdated Optimize Dep" until a reload (seen 2026-10-16)
    optimizeDeps: { include: ['three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/utils/BufferGeometryUtils.js', 'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js', 'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/SavePass.js', 'three/addons/postprocessing/UnrealBloomPass.js', 'three/addons/postprocessing/OutputPass.js', 'three/addons/environments/RoomEnvironment.js'] },
  },
});
