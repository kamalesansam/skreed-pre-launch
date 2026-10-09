// Playwright for the family pages (docs/specs/family-page.md 7). Runs against a built site served by wrangler dev:
//   npm run build (or PUBLIC_FAMILY_3D=dev npm run build:test), npx wrangler dev --port 8790, then
//   BASE_URL=http://127.0.0.1:8790/ npx playwright test -c tests/family/playwright.config.ts
// The grid-mode specs run on any build; the 3D specs (specs/case3d.spec.ts) need a PUBLIC_FAMILY_3D=dev test build.
import { defineConfig } from '@playwright/test';
import { CHROME_PATH, GL_ARGS } from '../harness/browser.ts';

export default defineConfig({
  testDir: 'specs',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [['list']],
  outputDir: '../../test-results/family',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8790/',
    launchOptions: { executablePath: CHROME_PATH, args: GL_ARGS },
    trace: 'off',
  },
});
