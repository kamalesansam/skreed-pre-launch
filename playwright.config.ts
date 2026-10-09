// Playwright: the port's test build under wrangler dev (hero-architecture.md 13). `npm run build:test` first.
// BASE_URL points the specs at a deployed host instead (section 15) and skips the local server.
import { defineConfig } from '@playwright/test';
import { CHROME_PATH, GL_ARGS, PORT_URL } from './tests/harness/browser.ts';

export default defineConfig({
  testDir: 'tests',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [['list']],
  outputDir: 'test-results',
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
    command: 'npx wrangler dev --port 8787 --ip 127.0.0.1',
    url: 'http://127.0.0.1:8787/',
    reuseExistingServer: true,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
});
