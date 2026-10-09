import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://skreed.in',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  vite: { build: { assetsInlineLimit: 0 } },
});
