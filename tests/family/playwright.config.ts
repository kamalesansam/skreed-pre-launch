// Playwright for the family pages (docs/specs/family-page.md 7). Runs against a built site served by wrangler dev:
//   npm run build (or PUBLIC_FAMILY_3D=dev npm run build:test), npx wrangler dev --port 8790, then
//   BASE_URL=http://127.0.0.1:8790/ npx playwright test -c tests/family/playwright.config.ts
// The grid-mode specs run on any build; the 3D specs (specs/case3d.spec.ts) need a PUBLIC_FAMILY_3D=dev test build.
//
// Parked on 2026-11-09 (docs/specs/redesign.md D17): the rows of this folder that drive the old landing page. The
// family pages themselves did not move, and every row that stays on them runs as it did. But the way in and the way
// back went through the old landing: the gems and the ten links of nav#families, the loader on the way back, the poster
// path's centring. On this branch the landing is the redesign: ten swatches in section#families, no loader, the way
// back by the browser alone (tests/family/return-path.test.ts reads that from the sources). Those rows have no page to
// run against here, so they are left out by their titles. No spec file is deleted or edited: they run as they are on
// the ref archive/site-before-redesign-2026-11-09, where this list is absent.
import { defineConfig } from '@playwright/test';
import { CHROME_PATH, GL_ARGS } from '../harness/browser.ts';

/**
 * The landing rows, by the title Playwright greps (the file, its describe, the test). entry.spec.ts is the old
 * landing from end to end (both of its describes). back.spec.ts keeps every row of the control on the family page,
 * the press among them (it leaves for /#families and asks nothing of the page it lands on), and parks the six that
 * follow it onto the old landing: the loader on arrival, the fall to the poster, the held load, the missed cache.
 * Exported so the GPU run (playwright.gpu.config.ts) can leave the same rows out.
 */
export const LANDING_ROWS = [
  /entry\.spec\.ts 2\. entry from the landing, /,
  /back\.spec\.ts 22\. the press \(acceptance 5\) (?:the landing[ ,]|the same held load on the fall path |the poster tier proper \(reduced motion\), the browser's Back from a family page )/,
];

export default defineConfig({
  testDir: 'specs',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [['list']],
  outputDir: '../../test-results/family',
  grepInvert: LANDING_ROWS,
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8790/',
    launchOptions: { executablePath: CHROME_PATH, args: GL_ARGS },
    trace: 'off',
  },
});
