// Section 5's measuring pass, the files (docs/specs/section-5-picture.md section 16, items 4 and 5): jars.json as
// delivered (the jar's box, the sixteen tops in order of level, the extra seam field, the share of the inner height a
// quarter fills, no provisional files) and the jar pictures (each file's bytes against the budget's caps, and the
// largest difference between a state and its prefix state below the prefix's seam and below its top, per format, in the
// decoded pixels of the files that ship). Prints Markdown.
//   node scripts/signup/measure-files.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = fileURLToPath(new URL('../../src/assets/signup/jars/', import.meta.url));
const J = JSON.parse(readFileSync(join(DIR, 'jars.json'), 'utf8'));
const STATES = ['0', 'f', 'y', 'i', 'fy', 'fi', 'yf', 'yi', 'if', 'iy', 'fyi', 'fiy', 'yfi', 'yif', 'ify', 'iyf'];
const CAP = { avif: 45, webp: 60 };   // KB at 2x (scripts/hero/budget.mjs JAR_PIC)
const KB = (b) => (b / 1024).toFixed(1);

console.log('## jars.json as delivered\n');
console.log(`- frame ${J.frame.w} x ${J.frame.h}; the jar's box x ${J.jar.x0} to ${J.jar.x1} (the outer diameter ${((J.jar.x1 - J.jar.x0) * J.frame.w).toFixed(0)} px, ${((J.jar.x1 - J.jar.x0)).toFixed(2)} of the width), y ${J.jar.y0} to ${J.jar.y1} (the rim's top at ${(J.jar.y0 * J.frame.h).toFixed(1)} px, the base's bottom at ${(J.jar.y1 * J.frame.h).toFixed(1)} px); axisFloor ${J.notes?.axisFloor ?? 'absent'}.`);
const extra = new Set(); for (const s of Object.values(J.states)) for (const k of Object.keys(s)) if (k !== 'top') extra.add(k);
console.log(`- fields beyond C2's top: ${[...extra].join(', ') || 'none'}; top-level keys: ${Object.keys(J).join(', ')}; "provisional": ${JSON.stringify(J).includes('provisional') ? 'present' : 'absent'}.`);
const level = (s) => (s === '0' ? 0 : [...s].reduce((a, l) => a + (l === 'i' ? 2 : 1), 0));
const rows = STATES.map((s) => ({ s, level: level(s), top: J.states[s].top, seam: J.states[s].seam }));
console.log('\n| State | Level (quarters) | top | seam |\n|---|---|---|---|');
for (const r of [...rows].sort((a, b) => a.level - b.level || a.s.localeCompare(b.s))) console.log(`| ${r.s} | ${r.level} | ${r.top} | ${r.seam ?? ''} |`);
// ordered by level: every top of a higher level is smaller (higher in the frame) than every top of a lower level; within a level within 0.01
let ordered = true, within = 0;
for (const a of rows) for (const b of rows) {
  if (a.level < b.level && !(a.top > b.top)) ordered = false;
  if (a.level === b.level) within = Math.max(within, Math.abs(a.top - b.top));
}
console.log(`\n- the tops ordered by level: ${ordered ? 'yes' : 'NO'}; within one level the tops differ by at most ${within.toFixed(4)} (0.01 allowed).`);
// a quarter's share: the fill's height for f and y over the inner height (the inner floor at the axis, axisFloor, to the lip's top, the jar's y0 plus the rim seen from 9 degrees above; the README's own figure is 0.235)
const floor = J.notes?.axisFloor ?? J.jar.y1, inner = floor - J.jar.y0;
for (const s of ['f', 'y', 'i']) console.log(`- ${s}: the fill's top ${J.states[s].top}, ${((floor - J.states[s].top) / inner).toFixed(3)} of the axis floor to the rim's far edge (${inner.toFixed(4)} of the frame); the picture's quarters 0.230 and 0.243, its half 0.463; the README's quarter 0.235 of the inner height.`);
console.log("- the mixed lot's pink to purple ratio: about 2 to 3 by grain count, even through the layer (scripts/signup/jars/README.md); not measurable from the files.");

console.log('\n## the jar pictures\n');
const files = readdirSync(DIR).filter((n) => /\.(avif|webp)$/.test(n)).sort();
console.log(`${files.length} files for 64 names; ${STATES.flatMap((s) => ['1x', '2x'].flatMap((z) => ['avif', 'webp'].map((f) => `jar-${s}-${z}.${f}`))).filter((n) => !files.includes(n)).join(', ') || 'none missing'}.`);
let maxAvif2 = 0, maxWebp2 = 0, total = 0;
for (const n of files) { const b = statSync(join(DIR, n)).size; total += b; if (n.includes('-2x.avif')) maxAvif2 = Math.max(maxAvif2, b); if (n.includes('-2x.webp')) maxWebp2 = Math.max(maxWebp2, b); }
console.log(`Together ${KB(total)} KB stored. The largest 2x: AVIF ${KB(maxAvif2)} KB of the ${CAP.avif} KB cap, WebP ${KB(maxWebp2)} KB of ${CAP.webp} KB.`);
console.log('\n| File | Bytes |\n|---|---|');
for (const n of files) console.log(`| ${n} | ${statSync(join(DIR, n)).size} |`);

const raw = async (n) => { const { data, info } = await sharp(join(DIR, n)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
const diffBelow = (a, b, fromRow) => { let m = 0, n = 0; for (let y = fromRow; y < a.h; y++) for (let x = 0; x < a.w; x++) { const i = (y * a.w + x) * 4; for (let c = 0; c < 4; c++) { const d = Math.abs(a.data[i + c] - b.data[i + c]); if (d > m) m = d; if (d > 2) n++; } } return { max: m, over2: n }; };
console.log('\n### each state against its prefix state (the state less its last letter), 2x, in the decoded pixels\n');
console.log('| State | Prefix | Format | Largest difference below the prefix\'s seam (0 to 255) | Channels over 2 below the seam | Largest difference below the prefix\'s top | Size check |\n|---|---|---|---|---|---|---|');
const summary = { avif: { seam: 0, top: 0 }, webp: { seam: 0, top: 0 } };
for (const s of STATES) {
  if (s.length < 2) continue;
  const p = s.slice(0, -1);
  for (const fmt of ['avif', 'webp']) {
    const [A, B] = await Promise.all([raw(`jar-${s}-2x.${fmt}`), raw(`jar-${p}-2x.${fmt}`)]);
    const seamRow = Math.ceil((J.states[p].seam ?? J.states[p].top) * A.h), topRow = Math.ceil(J.states[p].top * A.h);
    const ds = diffBelow(A, B, seamRow), dt = diffBelow(A, B, topRow);
    summary[fmt].seam = Math.max(summary[fmt].seam, ds.max); summary[fmt].top = Math.max(summary[fmt].top, dt.max);
    console.log(`| ${s} | ${p} | ${fmt} | ${ds.max} | ${ds.over2} | ${dt.max} | ${A.w} x ${A.h}, ${A.w === 400 && A.h === 480 ? 'ok' : 'NOT 400 x 480'} |`);
  }
}
console.log(`\nThe encoder's error below the prefix's seam: AVIF at most ${summary.avif.seam}, WebP at most ${summary.webp.seam} of 255. Below the prefix's top (which includes the band the next layer's grains lay over the prefix's surface, seam to top): AVIF ${summary.avif.top}, WebP ${summary.webp.top}.`);
const one = await raw('jar-0-1x.webp');
console.log(`The 1x files: ${one.w} x ${one.h} (jar-0-1x.webp); every file carries an alpha channel (decoded with four channels).`);
