// Browser setup shared by the Playwright specs and the scripts (hero-architecture.md 13.1).
import { chromium, type Browser, type BrowserContextOptions } from '@playwright/test';

/** Playwright's own Chromium (chromium-1194, Chromium 141 here); CHROME_PATH overrides. */
export const CHROME_PATH = process.env.CHROME_PATH || chromium.executablePath();

/** WebGL in headless Chromium is SwiftShader; these flags let the 3D path run there (test builds force the tier). */
export const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

/** The three rendering setups of hero.md section 7. */
export const SETUPS = {
  /** phone canvas captures: drawing buffer 487 x 1055, element screenshot 488 x 1055 */
  phoneCanvas: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.25 },
  /** phone behaviour tests */
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  /** desktop: drawing buffer and screenshot 1920 x 1200 */
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 },
} satisfies Record<string, BrowserContextOptions>;

export function launch(extraArgs: string[] = []): Promise<Browser> {
  return chromium.launch({ executablePath: CHROME_PATH, args: [...GL_ARGS, ...extraArgs] });
}

/** The port: the test build served by wrangler dev (playwright.config.ts starts it). */
export const PORT_URL = process.env.BASE_URL || 'http://127.0.0.1:8787/';
