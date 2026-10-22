// Section 4's lightmaps, models and garden into src/assets/room/ (docs/specs/section-4.md 6, section-4-world.md 6): a
// bake's PNG becomes a 1024 AVIF (q50) with a WebP (q82) fallback through sharp, the GLB is copied as it is (the
// exporter's float32 attributes), and the hall's is written again as hall.bin (scripts/room/hall-bin.mjs), the file
// that ships, so the island needs no glTF loader. Run after scripts/room/hall.py, universe.py or garden.py:
//   node scripts/room/encode.mjs scripts/room/out          (the hall: hall.glb, hall-lightmap.png, report.json)
//   node scripts/room/encode.mjs scripts/room/out room     (the universe: room.glb, room-lightmap.png, room-report.json)
//   node scripts/room/encode.mjs scripts/room/out/garden garden   (the garden: garden-plate.png, garden-card-{1,2,3}.png,
//                                                                   garden-report.json, into src/assets/room/garden/,
//                                                                   or into the folder a fourth argument names)
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { hallBin } from './hall-bin.mjs';

const src = process.argv[2] ?? 'scripts/room/out';
const mode = process.argv[3] === 'room' ? 'room' : process.argv[3] === 'garden' ? 'garden' : 'hall';
if (mode === 'garden') await garden(src, process.argv[4] ?? 'src/assets/room/garden');
else await lightmap(src, mode);

async function lightmap(src, which) {
  const dst = 'src/assets/room';
  mkdirSync(dst, { recursive: true });
  const png = join(src, `${which}-lightmap.png`);
  const avif = await sharp(png).avif({ quality: 50, effort: 6 }).toBuffer();
  const webp = await sharp(png).webp({ quality: 82, effort: 6 }).toBuffer();
  writeFileSync(join(dst, `${which}-lightmap.avif`), avif);
  writeFileSync(join(dst, `${which}-lightmap.webp`), webp);
  copyFileSync(join(src, `${which}.glb`), join(dst, `${which}.glb`));
  if (which === 'hall') writeFileSync(join(dst, 'hall.bin'), hallBin(readFileSync(join(dst, 'hall.glb'))));
  const report = JSON.parse(readFileSync(join(src, which === 'room' ? 'room-report.json' : 'report.json'), 'utf8'));
  const meta = { scale: report.scale, faces: report.faces, samples: report.samples, bakeSize: report.size, lightmap: report.out, bakeSeconds: report.bake_s };
  if (which === 'room') Object.assign(meta, { median: report.median, radius: report.radius, height: report.height, doorX: report.door_x, pedestals: report.pedestals, ceiling: report.ceiling });
  writeFileSync(join(dst, `${which}.json`), JSON.stringify(meta, null, 1) + '\n');
  console.log(`${which}: lightmap avif ${avif.length} B, webp ${webp.length} B; glb ${statSync(join(dst, `${which}.glb`)).size} B; exposure scale ${report.scale.toFixed(3)}`);
}

/**
 * The garden (section-4-world.md 3 "The garden", 6): the far plate and the three depth cards, each AVIF with a WebP
 * fallback, at the spec's lines, KB being 1024 B: the plate 110 KB AVIF and 180 KB WebP; the three cards together
 * 60 KB AVIF and 100 KB WebP. Each format starts at the house quality (AVIF 50, WebP 82) and steps down until it fits;
 * only past the quality floor does it shrink the pixels, and both are reported in garden.json. The cards keep straight
 * alpha, with their clear pixels' colour filled from the nearest content (a push-pull pyramid) so the GPU's filtering
 * and mipmaps never pull a dark fringe in from a transparent black, and so the clear area costs next to no bytes.
 * Before encoding, the plate is checked for pure white (rule 23: the sky never clips to #ffffff) and each card's
 * margin for content (a card's edge must never cut through its content, or the cut shows once the camera moves). The
 * lawn's shadow catcher leaves a faint darkening (under a tenth) out to the card's edge, where the objects keep sky
 * from the grass; the alpha is feathered to zero across the margin so that ends softly, never on a line.
 */
async function garden(src, dst) {
  const KB = 1024;
  const LINES = { plate: { avif: 110 * KB, webp: 180 * KB }, cards: { avif: 60 * KB, webp: 100 * KB } };
  const FLOOR = { avif: 20, webp: 30 }, START = { avif: 50, webp: 82 }, STEP = { avif: 2, webp: 4 };
  mkdirSync(dst, { recursive: true });
  const rep = JSON.parse(readFileSync(join(src, 'garden-report.json'), 'utf8'));

  // the plate: 8-bit RGB as the visitor gets it, checked for clipping row by row
  const plate = await sharp(join(src, 'garden-plate.png')).removeAlpha().toColourspace('srgb').raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
  const pw = plate.info.width, ph = plate.info.height;
  let white = 0, skyMax = 0;
  for (let i = 0; i < pw * ph; i++) {
    const r = plate.data[i * 3], g = plate.data[i * 3 + 1], b = plate.data[i * 3 + 2];
    if (r === 255 && g === 255 && b === 255) white++;
    if (i < pw * (ph >> 1)) skyMax = Math.max(skyMax, r, g, b);   // the upper half: the sky and the far trees
  }
  if (white) throw new Error(`garden: the plate has ${white} pure white pixels (rule 23)`);

  const cards = [];
  for (const c of rep.cards) {
    const img = await sharp(join(src, `garden-card-${c.n}.png`)).ensureAlpha().toColourspace('srgb').raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = img.info;
    const margin = Math.max(2, Math.round(((rep.cardMargin ?? 16) * w) / c.px[0]));
    let border = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = Math.min(x, y, w - 1 - x, h - 1 - y), i = (y * w + x) * 4 + 3;
      if (d >= margin) continue;
      if (d < margin / 2) border = Math.max(border, img.data[i]);
      const t = (d + 0.5) / margin; img.data[i] = Math.round(img.data[i] * t * t * (3 - 2 * t));
    }
    if (border >= 128) throw new Error(`garden: card ${c.n} (${c.id}) has content in its margin (alpha ${border} of 255)`);
    cards.push({ ...c, w, h, rgba: bleed(img.data, w, h), border });
  }

  // the plate, each format on its own; then the three cards at one shared quality per format, against their joint line
  const enc = (fmt, buf, w, h, ch, q, size) => {
    let s = sharp(buf, { raw: { width: w, height: h, channels: ch } });
    if (size < 1) s = s.resize(Math.round(w * size), Math.round(h * size), { kernel: 'lanczos3' });
    return fmt === 'avif' ? s.avif({ quality: q, effort: 7, chromaSubsampling: '4:2:0' }).toBuffer() : s.webp({ quality: q, alphaQuality: 70, effort: 6, smartSubsample: true }).toBuffer();
  };
  async function fit(fmt, items, line) {
    for (let size = 1; size > 0.5; size = Math.round((size - 0.1) * 10) / 10) {
      for (let q = START[fmt]; q >= FLOOR[fmt]; q -= STEP[fmt]) {
        const out = await Promise.all(items.map((it) => enc(fmt, it.buf, it.w, it.h, it.ch, q, size)));
        const total = out.reduce((a, b) => a + b.length, 0);
        if (total <= line) return { q, size, out, total };
      }
    }
    throw new Error(`garden: ${fmt} cannot meet ${line} B`);
  }
  const plateItem = [{ buf: plate.data, w: pw, h: ph, ch: 3 }];
  const cardItems = cards.map((c) => ({ buf: c.rgba, w: c.w, h: c.h, ch: 4 }));
  const result = {};
  for (const fmt of ['avif', 'webp']) {
    const p = await fit(fmt, plateItem, LINES.plate[fmt]);
    writeFileSync(join(dst, `garden-plate.${fmt}`), p.out[0]);
    const k = await fit(fmt, cardItems, LINES.cards[fmt]);
    k.out.forEach((b, i) => writeFileSync(join(dst, `garden-card-${i + 1}.${fmt}`), b));
    result[fmt] = { plate: p, cards: k };
  }

  const fmtMeta = (r, i) => ({ quality: r.q, scale: r.size, bytes: i === undefined ? r.out[0].length : r.out[i].length });
  const meta = {
    about: 'section 4 part two, the garden behind the ring tunnel: scripts/room/garden.py, then scripts/room/encode.mjs garden',
    units: 'island units; S, the ring spacing, is 2.5 units (docs/specs/section-4-world.md 2); 1 unit is 1 m of the Blender scene',
    axis: 'the flight runs along the island\'s -z (Blender +y), level, x right and y up; every position here is relative to the flight axis',
    S: rep.S, eye: rep.eye,
    eyeNote: 'the flight axis stands this high above the lawn',
    camera: {
      pose: 'the glide\'s end: plate and cards are rendered from here and register exactly here',
      pastLastRingS: rep.endPastLastS, startBeforeFirstS: rep.startBeforeFirstS, glide: rep.glide, fovDeg: rep.plate.fovDeg, aspect: 1,
    },
    sun: { direction: rep.sun.island, elevationDeg: rep.sun.elevationDeg, offBehindDeg: rep.sun.offBehindDeg, toward: rep.sun.toward, note: 'direction points toward the sun, island frame' },
    colour: 'display values (sRGB through the Standard view), untagged; alpha straight, not premultiplied, clear pixels filled with nearby colour',
    plate: {
      file: 'garden-plate', width: Math.round(pw * result.avif.plate.size), height: Math.round(ph * result.avif.plate.size), fovDeg: rep.plate.fovDeg,
      // a flat (rectilinear) image is densest at its edges: the average across, and the least, at the centre
      pxPerDeg: Math.round(((pw * result.avif.plate.size) / rep.plate.fovDeg) * 10) / 10,
      pxPerDegCentre: Math.round(((pw * result.avif.plate.size) / (2 * Math.tan((rep.plate.fovDeg * Math.PI) / 360))) * (Math.PI / 180) * 10) / 10,
      draw: 'at infinity, locked to the camera\'s position: it turns with the roll and scales with the FOV; the lawn\'s stripes run along the flight, so a still plate stays right as the camera moves',
      avif: fmtMeta(result.avif.plate), webp: fmtMeta(result.webp.plate),
    },
    cards: cards.map((c, i) => ({
      file: `garden-card-${c.n}`, id: c.id, pastLastRingS: c.pastLastRingS,
      distance: c.distance, distanceNote: 'from the render pose along the flight; the card is a plane square to the axis there',
      width: Math.round(c.w * result.avif.cards.size), height: Math.round(c.h * result.avif.cards.size),
      pxPerDegCentre: Math.round(c.pxPerDeg * result.avif.cards.size * 10) / 10,
      world: c.world, worldNote: 'island units at the card\'s distance: its width and height, and its centre from the flight axis (x right, y up)',
      tan: c.tan,
      avif: fmtMeta(result.avif.cards, i), webp: fmtMeta(result.webp.cards, i),
    })),
    totals: { plate: { avif: result.avif.plate.total, webp: result.webp.plate.total }, cards: { avif: result.avif.cards.total, webp: result.webp.cards.total } },
    lines: LINES,
    render: { samples: rep.samples, seconds: rep.renderSeconds, faces: rep.faces, sky: rep.sky.model, shades: rep.shades },
    checks: { plateWhitePixels: white, plateUpperHalfMax: skyMax, cardMarginAlphaMax: cards.map((c) => c.border), cardMarginPx: rep.cardMargin },
  };
  writeFileSync(join(dst, 'garden.json'), JSON.stringify(meta, null, 1) + '\n');
  const kb = (b) => (b / KB).toFixed(1);
  console.log(`garden plate ${pw} x ${ph}: avif q${result.avif.plate.q} x${result.avif.plate.size} ${kb(result.avif.plate.total)} KB, webp q${result.webp.plate.q} x${result.webp.plate.size} ${kb(result.webp.plate.total)} KB; upper-half max ${skyMax}, white ${white}`);
  console.log(`garden cards ${cards.map((c) => `${c.w}x${c.h}`).join(', ')}: avif q${result.avif.cards.q} x${result.avif.cards.size} ${kb(result.avif.cards.total)} KB (${result.avif.cards.out.map((b) => kb(b.length)).join(' + ')}), webp q${result.webp.cards.q} x${result.webp.cards.size} ${kb(result.webp.cards.total)} KB (${result.webp.cards.out.map((b) => kb(b.length)).join(' + ')})`);
}

/**
 * Fills the colour of every fully clear pixel from the content around it: premultiplied averages down a pyramid to one
 * texel, then back up, each level composited over the next coarser one's bilinear fill. Pixels with any alpha keep their
 * own colour, so nothing the visitor sees changes; only what filtering can reach does.
 */
function bleed(data, w, h) {
  const levels = [];
  let lw = w, lh = h, c = new Float32Array(w * h * 3), a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const al = data[i * 4 + 3] / 255;
    a[i] = al; for (let k = 0; k < 3; k++) c[i * 3 + k] = (data[i * 4 + k] / 255) * al;
  }
  levels.push({ w: lw, h: lh, c, a });
  while (lw > 1 || lh > 1) {
    const nw = Math.max(1, Math.ceil(lw / 2)), nh = Math.max(1, Math.ceil(lh / 2));
    const nc = new Float32Array(nw * nh * 3), na = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
      let sa = 0, n = 0; const sc = [0, 0, 0];
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const sx = Math.min(lw - 1, x * 2 + dx), sy = Math.min(lh - 1, y * 2 + dy), j = sy * lw + sx;
        sa += a[j]; n++; for (let k = 0; k < 3; k++) sc[k] += c[j * 3 + k];
      }
      const o = y * nw + x; na[o] = sa / n; for (let k = 0; k < 3; k++) nc[o * 3 + k] = sc[k] / n;
    }
    lw = nw; lh = nh; c = nc; a = na; levels.push({ w: lw, h: lh, c, a });
  }
  // the coarsest level's fill is its average colour; each finer level is its own premultiplied colour over the fill
  let top = levels[levels.length - 1], fill = new Float32Array(3);
  for (let k = 0; k < 3; k++) fill[k] = top.a[0] > 0 ? top.c[k] / top.a[0] : 0.5;
  for (let L = levels.length - 2; L >= 0; L--) {
    const { w: fw, h: fh, c: fc, a: fa } = levels[L], up = levels[L + 1], out = new Float32Array(fw * fh * 3);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      // bilinear from the coarser fill, texel centres aligned
      const ux = Math.min(up.w - 1, Math.max(0, (x + 0.5) / 2 - 0.5)), uy = Math.min(up.h - 1, Math.max(0, (y + 0.5) / 2 - 0.5));
      const x0 = Math.floor(ux), y0 = Math.floor(uy), x1 = Math.min(up.w - 1, x0 + 1), y1 = Math.min(up.h - 1, y0 + 1), tx = ux - x0, ty = uy - y0;
      const o = y * fw + x;
      for (let k = 0; k < 3; k++) {
        const f = (fill[(y0 * up.w + x0) * 3 + k] * (1 - tx) + fill[(y0 * up.w + x1) * 3 + k] * tx) * (1 - ty) + (fill[(y1 * up.w + x0) * 3 + k] * (1 - tx) + fill[(y1 * up.w + x1) * 3 + k] * tx) * ty;
        out[o * 3 + k] = fc[o * 3 + k] + (1 - fa[o]) * f;
      }
    }
    fill = out;
  }
  const res = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] !== 0) continue;
    for (let k = 0; k < 3; k++) res[i * 4 + k] = Math.max(0, Math.min(255, Math.round(fill[i * 3 + k] * 255)));
  }
  return res;
}
