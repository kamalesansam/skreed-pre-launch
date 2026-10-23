// The logotype's tone over each scene (docs/specs/section-4-flux.md 5 "The island modules": the plan's toneDark; the
// hero's own rule, hero.md AC: the logotype and the Back to top control turn Urban Slate where the frame under them
// is light, at 3:1 or better; the build record's D5). Each scene's still as the carousel draws it at rest (the loop's
// first frame, cover-fitted to the view at the planes' 1.01 overscan, the light-up whole, the bottom shade in the
// frame as the plane shader draws it, solid to SHADE.solid of the height and clear by SHADE.height) at 390 x 844 (the portrait still) and 1280 x 800 (the wide still), measured under the logotype's box and the
// control's box (read off the served page: the logotype at the gutter, 96 x 23.2 px, 136 x 32.9 from 1024 px wide;
// the control's 44 px row top right): the median luminance under each box, and Pearl Whisper's and Urban Slate's
// contrast against it. The pick per scene is the colour that measures 3:1 or better under every box at both
// viewports, Pearl where the frame is dark, Urban Slate where it is light; where neither does under every box, the
// colour with the higher worst ratio, flagged. The picks go into ROOM_SCENES (config/room.ts, toneDark) by hand and
// tests/unit/room.test.ts holds them to this script's table. No server is needed:
//   node scripts/room/scene-tone.mjs [--json <file>]
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { ROOM_SCENES } from '../../src/config/room.ts';
import { SHADE } from '../../src/scripts/hero/section4/carousel.ts';
import { STEP } from '../../src/scripts/hero/section4/carousel-math.ts';

const args = process.argv.slice(2);
const ji = args.indexOf('--json'), jsonOut = ji >= 0 ? args[ji + 1] : null;
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const PEARL = lum(0xf7, 0xf6, 0xf3), SLATE = lum(0x38, 0x3f, 0x43);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
/** the two boxes per viewport, CSS px, as the served page lays them out (2026-10-23) */
const VIEWS = [
  { w: 390, h: 844, cls: 'portrait', boxes: { logotype: { x: 16, y: 16, w: 96, h: 23.2 }, control: { x: 260, y: 5.6, w: 126, h: 44 } } },
  { w: 1280, h: 800, cls: 'wide', boxes: { logotype: { x: 44.8, y: 44.8, w: 136, h: 32.9 }, control: { x: 1121.2, y: 39.3, w: 126, h: 44 } } },
];

/** the still as drawn at rest: cover-fitted to the view with the overscan, the bottom shade applied (the light-up is whole) */
async function drawn(file, w, h) {
  const img = sharp(file);
  const meta = await img.metadata();
  const s = Math.max(w / meta.width, h / meta.height) * STEP.overscan;
  const sw = Math.round(meta.width * s), sh = Math.round(meta.height * s);
  const { data, info } = await img.resize(sw, sh, { fit: 'fill' }).extract({ left: Math.round((sw - w) / 2), top: Math.round((sh - h) / 2), width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, info };
}
function medianLum({ data, info }, b) {
  const ls = [];
  const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y)), x1 = Math.min(info.width, Math.ceil(b.x + b.w)), y1 = Math.min(info.height, Math.ceil(b.y + b.h));
  for (let y = y0; y < y1; y++) {
    // the plane shader's shade at this row (carousel.ts PLANE_FRAG: solid up to SHADE.solid of the height, clear by SHADE.height; gl_FragCoord.y is the pixel's centre from the bottom)
    const yb = (info.height - y - 0.5) / info.height, sh = 1 - SHADE.dark * (1 - Math.min(1, Math.max(0, (yb - SHADE.solid) / Math.max(SHADE.height - SHADE.solid, 1e-3))));
    for (let x = x0; x < x1; x++) { const k = (y * info.width + x) * 3; ls.push(lum(data[k] * sh, data[k + 1] * sh, data[k + 2] * sh)); }
  }
  ls.sort((a, c) => a - c);
  return ls[Math.floor(ls.length / 2)];
}

const rows = [], picks = {};
for (const sc of ROOM_SCENES) {
  const readings = [];
  for (const v of VIEWS) {
    const frame = await drawn(new URL(`../../src/assets/room/flux/${sc.id}-${v.cls}.webp`, import.meta.url).pathname, v.w, v.h);
    for (const [name, box] of Object.entries(v.boxes)) {
      const L = medianLum(frame, box);
      readings.push({ view: `${v.w}x${v.h}`, box: name, luminance: +L.toFixed(4), pearl: +ratio(PEARL, L).toFixed(2), slate: +ratio(SLATE, L).toFixed(2) });
    }
  }
  const worstPearl = Math.min(...readings.map((r) => r.pearl)), worstSlate = Math.min(...readings.map((r) => r.slate));
  const pearlOk = worstPearl >= 3, slateOk = worstSlate >= 3;
  const toneDark = pearlOk && !slateOk ? false : slateOk && !pearlOk ? true : worstSlate > worstPearl;
  const flagged = !(pearlOk || slateOk) || (pearlOk && slateOk);
  picks[sc.id] = toneDark;
  rows.push({ scene: sc.order, id: sc.id, readings, worstPearl, worstSlate, toneDark, flagged });
  console.log(`scene ${sc.order} ${sc.id}: ${readings.map((r) => `${r.view} ${r.box}: L ${r.luminance}, Pearl ${r.pearl}:1, Slate ${r.slate}:1`).join('; ')}`);
  console.log(`  worst: Pearl ${worstPearl.toFixed(2)}:1, Urban Slate ${worstSlate.toFixed(2)}:1; the logotype ${toneDark ? 'Urban Slate (toneDark true)' : 'Pearl Whisper (toneDark false)'}${flagged ? ' (flagged: ' + (pearlOk && slateOk ? 'both pass' : 'neither reaches 3:1 under every box') + ')' : ''}`);
}
console.log('\n| Scene | 390 logotype: Pearl / Slate | 390 control | 1280 logotype | 1280 control | The pick |');
console.log('|---|---|---|---|---|---|');
for (const r of rows) {
  const cell = (view, box) => { const x = r.readings.find((q) => q.view === view && q.box === box); return `${x.pearl} / ${x.slate}`; };
  console.log(`| ${r.scene} ${r.id} | ${cell('390x844', 'logotype')} | ${cell('390x844', 'control')} | ${cell('1280x800', 'logotype')} | ${cell('1280x800', 'control')} | ${r.toneDark ? 'Urban Slate' : 'Pearl Whisper'}${r.flagged ? ' (flagged)' : ''} |`);
}
const mismatch = ROOM_SCENES.filter((sc) => sc.toneDark !== picks[sc.id]);
console.log(`\nROOM_SCENES: ${mismatch.length ? 'toneDark differs from the picks for ' + mismatch.map((s) => s.id).join(', ') : 'toneDark matches the picks'}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ views: VIEWS, rows }, null, 1) + '\n');
process.exit(mismatch.length ? 1 : 0);
