// Playwright: the port's test build under wrangler dev (hero-architecture.md 13). `npm run build:test` first.
// BASE_URL points the specs at a deployed host instead (section 15) and skips the local server. SKREED_PORT moves the
// local server off 8787 (one port per workflow); SKREED_DIST names a build written with astro build --outDir. The
// global setup asserts, at the start and at the end of the run, that the served `/` is that build's index.html.
import { defineConfig } from '@playwright/test';
import { CHROME_PATH, GL_ARGS, PORT, PORT_URL } from './tests/harness/browser.ts';

export default defineConfig({
  testDir: 'tests',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [['list']],
  outputDir: 'test-results',
  globalSetup: './tests/harness/build-identity.ts',
  use: {
    baseURL: PORT_URL,
    launchOptions: { executablePath: CHROME_PATH, args: GL_ARGS },
    trace: 'off',
  },
  projects: [
    { name: 'e2e', testMatch: 'e2e/**/*.spec.ts' },
    { name: 'parity', testMatch: 'parity/**/*.spec.ts' },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: `npx wrangler dev --port ${PORT} --ip 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
});
