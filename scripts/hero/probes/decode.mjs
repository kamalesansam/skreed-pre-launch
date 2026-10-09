// Decode timing in Chromium: createImageBitmap(blob) for each image file, median of N runs. Also WebGL2 texImage2D upload
// time of the decoded bitmap (SwiftShader, so upload numbers are CPU-bound and only comparable to each other).
// node decode.mjs <runs> <file>...
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/opt/node-tools/node_modules/')('playwright');
const [runs, ...files] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await b.newPage();
await page.setContent('<canvas id=c></canvas>');
console.log('| file | bytes | decode median ms | decoded px | upload+mipmap median ms |\n|---|---:|---:|---|---:|');
for (const f of files) {
  const data = fs.readFileSync(f).toString('base64');
  const type = f.endsWith('.avif') ? 'image/avif' : 'image/webp';
  const r = await page.evaluate(async ({ data, type, runs }) => {
    const bin = Uint8Array.from(atob(data), c => c.charCodeAt(0)); const blob = new Blob([bin], { type });
    const gl = document.getElementById('c').getContext('webgl2'); const dec = [], up = []; let bm;
    for (let i = 0; i < runs; i++) {
      const t0 = performance.now(); bm = await createImageBitmap(blob); dec.push(performance.now() - t0);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      const t1 = performance.now(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, bm); gl.generateMipmap(gl.TEXTURE_2D);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); up.push(performance.now() - t1);
      gl.deleteTexture(tex); if (i < runs - 1) bm.close();
    }
    const med = a => a.sort((x, y) => x - y)[a.length >> 1];
    return { dec: med(dec), up: med(up), w: bm.width, h: bm.height };
  }, { data, type, runs: +runs });
  console.log(`| ${f.split('/').pop()} | ${fs.statSync(f).size} | ${r.dec.toFixed(0)} | ${r.w}x${r.h} | ${r.up.toFixed(0)} |`);
}
await b.close();
