// Playwright for the family pages on the machine's own GPU (docs/specs/family-page.md 24.8): the installed Chrome through
// its channel with no software-renderer flags, so the stage runs at the display's rate and the rows timed by frames (the
// stage's lag behind the page, the takeover riding the stage's scroll, the loader's count) read what a visitor's machine gives. On
// the Mac of 2026-11-02 the harness's SwiftShader (playwright.config.ts) ticked frames at a crawl under load, and those
// rows timed out there on any build. The one row that needs the software renderer, "software rendering without
// ?render=force lands in swatch grid mode" (case3d.spec.ts), skips itself here: the gate finds a real GPU by design.
//   npm run build (PUBLIC_FAMILY_3D=on, hooks on), npx wrangler dev --port 8795 --assets ./dist, then
//   BASE_URL=http://127.0.0.1:8795/ npx playwright test -c tests/family/playwright.gpu.config.ts --workers 1
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'specs',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list']],
  outputDir: '../../test-results/family-gpu',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8790/',
    channel: 'chrome',
    launchOptions: { args: ['--ignore-gpu-blocklist'] },
    trace: 'off',
  },
});
