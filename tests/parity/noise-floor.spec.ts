// Build step 7 exit (hero-architecture.md 17): the prototype against itself, through this harness, gives PSNR 99 (identical
// frames) at both viewports. That is the noise floor AC1.2's stage 1 threshold names. Settings as AC1.2: __skreedFreeze
// before load, at least 3 frames after the loader's ready, overlays and poster hidden, canvas only.
import { test, expect, type Browser } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { SETUPS, launch } from '../harness/browser.ts';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { freezeBeforeLoad } from '../harness/settle.ts';
import { captureStage } from '../harness/canvas.ts';
import { compare } from '../harness/compare.ts';

let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

async function protoFrame(setup: (typeof SETUPS)['phoneCanvas'], path: string) {
  const ctx = await gl.newContext({ ...setup, bypassCSP: true });
  await freezeBeforeLoad(ctx);
  await servePrototype(ctx);
  const page = await ctx.newPage();
  await page.goto(PROTO_URL, { waitUntil: 'load', timeout: 300_000 });
  await captureStage(page, path);
  await ctx.close();
}

for (const [name, setup] of [['390', SETUPS.phoneCanvas], ['1280', SETUPS.desktop]] as const) {
  test(`noise floor: the prototype against itself at ${name} gives PSNR 99`, async ({}, info) => {
    test.setTimeout(1_200_000);
    const dir = info.outputPath(); mkdirSync(dir, { recursive: true });
    await protoFrame(setup, `${dir}/proto-a.png`);
    await protoFrame(setup, `${dir}/proto-b.png`);
    const r = compare(`${dir}/proto-a.png`, `${dir}/proto-b.png`, { psnr: 99 }, `${dir}/diff.png`);
    console.log(`[noise floor ${name}] ` + JSON.stringify(r));
    info.annotations.push({ type: 'compare', description: JSON.stringify(r) });
    expect(r.psnr).toBe(99);
  });
}
