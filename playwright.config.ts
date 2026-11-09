// Playwright: the port's test build under wrangler dev (hero-architecture.md 13). `npm run build:test` first.
// BASE_URL points the specs at a deployed host instead (section 15) and skips the local server. SKREED_PORT moves the
// local server off 8787 (one port per workflow); SKREED_DIST names a build written with astro build --outDir. The
// global setup asserts, at the start and at the end of the run, that the served `/` is that build's index.html.
// SKREED_GL=gpu runs the specs in the installed Chrome on the machine's GPU (tests/harness/browser.ts).
//
// Parked on 2026-11-09 (docs/specs/redesign.md D17). On this branch the landing page is the redesign: ordinary
// sections, with no Gate, no loader, no island, no gems and no section 4; the jars are a page of their own (D1) and
// the redesigned page's last section (D18). The suites below were written against the old landing and have no page to
// run against here, so the two projects leave them out.
// No spec file is deleted or edited, and nothing in them is loosened: they run as they are, every row, on the ref
// archive/site-before-redesign-2026-11-09 (the site as it stood that day), where this file has no such lists. Taking a
// name out of a list here brings its suite back the day its page does.
// What still has its page runs: the About page's suite, the family pages' rows of scroll-cue.spec.ts and to-top.spec.ts,
// the CSP header's row, section 5's rows of signup.spec.ts at the landing page's end, and the suite written for the
// redesigned page (tests/e2e/redesign.spec.ts, spec section 13), which this project picks up with the rest.
import { defineConfig } from '@playwright/test';
import { CHANNEL, CHROME_PATH, GL_ARGS, GPU, PORT, PORT_URL } from './tests/harness/browser.ts';

/**
 * tests/e2e, whole files: each drives the old landing from its first line (?tier=, the loader, the island, the gems,
 * the scenes, the old hero's countdown and cue, the section index over the old page's map, the quiz inside the old
 * page's scroll).
 */
const PARKED_E2E = ['a11y-breakpoints', 'countdown', 'cue-logotype', 'hover', 'island', 'loader', 'locked-values', 'quiz', 'room', 'site-nav', 'tiers'];
/**
 * tests/e2e, single rows of files whose other rows still have their page, by the title Playwright greps (the file,
 * its describe, the test). csp.spec.ts keeps its header row and parks the six that load the old tiers and call the
 * loader; scroll-cue.spec.ts keeps the family page's row and parks the two landing describes; to-top.spec.ts keeps
 * its two family rows and parks the three that press Home on the old landing.
 * signup.spec.ts, tried on a served test build on 2026-11-09, runs at the landing page's end, where the section stands as
 * built since D18: its open() asks for the old page's query, which the redesigned page ignores, and finds #signup all the
 * same. Five of its seven rows pass there: the section at both sizes (one screen, the columns, the fill, the visit's
 * memory), the Followed ticks at both sizes, the fill's gate and queue. Their open() waits, on this page only, for the
 * section's entrance (D18) to land before a row reads a box: the Followed ticks row at 390 x 844 read a tick inside its
 * still rising column in 2 runs of 7 before it did. Two are parked, and redesign.spec.ts holds what each still matters
 * for, on the page as it is:
 *   - "the poster tier: the logotype" reads the old page around the section: it scrolls up off the cream and asks for the
 *     dark scenes under the logotype, where the countdown's white slide stands now. (redesign.spec.ts, the D5 row.)
 *   - "the form's states against a stub" was stale before the redesign, on the default branch's own build: it presses Send
 *     with no first name and reads the email's error, and posts no name and no consent, as the form was until the first
 *     name and the code step of 2026-11-03. Nothing of the redesign touches it (form.ts is the archive's, byte for byte).
 *     (redesign.spec.ts, the D18 and D1 rows, walk the form as it is, to its code step and its done line.)
 */
const PARKED_E2E_ROWS = [
  /csp\.spec\.ts AC10\.5 zero CSP violations: /,
  /scroll-cue\.spec\.ts the landing (?:at the top, poster tier|in the pin, 3D path) /,
  /to-top\.spec\.ts landing page (?:at \d+ x \d+|by keyboard): /,
  /signup\.spec\.ts section 5 at 390 x 844, the poster tier: /,
  /signup\.spec\.ts section 5 at 390 x 844: the form's states against a stub /,
];

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
    launchOptions: { ...(GPU ? { channel: CHANNEL } : { executablePath: CHROME_PATH }), args: GL_ARGS },   // SKREED_GL=gpu: the installed Chrome on the GPU
    trace: 'off',
  },
  projects: [
    { name: 'e2e', testMatch: 'e2e/**/*.spec.ts', testIgnore: PARKED_E2E.map((name) => `e2e/${name}.spec.ts`), grepInvert: PARKED_E2E_ROWS },
    // every parity suite compares the old hero, frame by frame, with the prototype it was ported from: all of them are
    // parked, so `npm run test:parity` finds no test on this branch and Playwright says so
    { name: 'parity', testMatch: 'parity/**/*.spec.ts', testIgnore: 'parity/**' },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: `npx wrangler dev --port ${PORT} --ip 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
});
