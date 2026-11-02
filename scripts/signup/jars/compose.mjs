// Compose section 5's jar frames from the Cycles renders (render.py) and encode them for the page.
//   node scripts/signup/jars/compose.mjs [--raw scripts/signup/jars/work/raw] [--masters scripts/signup/jars/work/final]
//                                        [--install src/assets/signup/jars] [--compare <dir>]
//
// For every state (a press order such as fy: Facebook's quarter of blue, then YouTube's quarter of red):
// - the jar is the empty jar's render above the state's fill top, the state's own render in the band its last press
//   added, and the prefix state's finished frame below the prefix's seam (a few rows feathered above the seam), so the
//   lower layers' pixels never change and a reveal from the old top never jumps;
// - under it, drawn in 2D and the same for every state: the soft shadow wedge to the right and the glossy floor's
//   reflection of the jar's foot (the fill's colour under a filled jar, a faint pale base under the empty one).
// Writes the 8-bit masters, jar-<state>-<1x|2x>.<avif|webp> and jars.json (the jar's box and each state's surface top),
// checks that each state equals its prefix below the prefix's seam, and (with --compare) the comparison images.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const require = createRequire(path.join(ROOT, 'package.json'));
const sharp = require('sharp');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const RAW = path.resolve(opt('--raw', path.join(HERE, 'work/raw')));
const MASTERS = path.resolve(opt('--masters', path.join(HERE, 'work/final')));
const INSTALL = opt('--install', '') && path.resolve(opt('--install'));
const COMPARE = opt('--compare', '') && path.resolve(opt('--compare'));
const PICTURE = opt('--picture', '');

const STATES = ['0', 'f', 'y', 'i', 'fy', 'yf', 'fi', 'yi', 'if', 'iy', 'fyi', 'yfi', 'fiy', 'yif', 'ify', 'iyf'];
const W = 400, H = 480;
const GROUND = [0xf2, 0xea, 0xe1];          // SIGNUP_GROUND, for the comparison images only
const FEATHER = 4;                           // rows above a seam where the state's own band blends into the prefix

// the floor, in this frame's px (the picture's measures times 200 / 151.1, its body width)
const SHADOW = { rgb: [78, 54, 33], core: 0.25, full: 42, gone: 102, h0: 32, h1: 8, lift: 26, blur: 3.2 };
const REFLECT = { a0: 0.25, d0: 30, cut0: 30, cut1: 46, blurY: 3.0, blurX: 1.2 };

async function loadRaw(file) {
  const { data, info } = await sharp(file).toColourspace('rgb16').ensureAlpha().raw({ depth: 'ushort' }).toBuffer({ resolveWithObject: true });
  if (info.width !== W || info.height !== H) throw new Error(`${file}: ${info.width}x${info.height}, expected ${W}x${H}`);
  const u = new Uint16Array(data.buffer, data.byteOffset, data.length / 2);
  const f = new Float32Array(u.length);
  for (let i = 0; i < u.length; i++) f[i] = u[i] / 65535;
  return f;
}

const meta = {}, raw = {};
for (const s of STATES) {
  raw[s] = await loadRaw(path.join(RAW, `${s}.png`));
  meta[s] = JSON.parse(fs.readFileSync(path.join(RAW, `${s}.json`), 'utf8'));
}
const prefix = (s) => (s.length > 1 ? s.slice(0, -1) : '0');
const diff = (A, B, i) => Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]), Math.abs(A[i + 3] - B[i + 3]));

// --- the jar layer of every state ---------------------------------------------------------------------------
const jar = { '0': raw['0'] };
const rows = {};
const seamRow = (s) => Math.ceil(meta[s].seam);           // render.py: the prefix's seam, measured where s is rendered
for (const s of STATES.slice(1)) {
  const P = prefix(s), R = raw[s], J0 = raw['0'], JP = jar[P];
  const [y0, y1] = meta[s].rows;
  // the fill's top: the first row (from the top of the band) where the state's own render differs from the empty jar
  let top = -1;
  for (let y = Math.max(Math.ceil(y0) + 1, Math.floor(meta[s].top_est - 26)); y < Math.floor(y1) && top < 0; y++) {
    let n = 0;
    for (let x = 108; x < 292; x++) if (diff(R, J0, (y * W + x) * 4) > 0.06) n++;
    if (n >= 3) top = y;
  }
  if (top < 0) throw new Error(`${s}: no fill found in its band`);
  if (top - 2 < y0 + 4) console.warn(`WARN ${s}: the fill top ${top} is within 6 rows of the band's top ${y0}`);
  const cut = top - 2;
  const seam = P === '0' ? H : Math.ceil(meta[s].seam);
  const out = new Float32Array(W * H * 4);
  const x0 = Math.ceil(meta[s].cols[0] * W) + 2, x1 = Math.floor(meta[s].cols[1] * W) - 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let src;
      if (y < cut || x < x0 || x >= x1) src = y < cut ? J0 : (y >= seam ? JP : J0);
      else if (y >= seam) src = JP;
      else src = R;
      if (src === R && y >= seam - FEATHER) {
        const w = (y - (seam - FEATHER) + 0.5) / FEATHER;
        for (let k = 0; k < 4; k++) out[i + k] = R[i + k] * (1 - w) + JP[i + k] * w;
      } else for (let k = 0; k < 4; k++) out[i + k] = src[i + k];
    }
  }
  jar[s] = out;
  rows[s] = { top, cut, seam };
}

// --- the floor: one shadow for every state, and each state's reflection --------------------------------------
// the jar's silhouette from the empty render
let silTop = H, silBot = -1, silL = W, silR = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (raw['0'][(y * W + x) * 4 + 3] > 0.5) { silTop = Math.min(silTop, y); silBot = Math.max(silBot, y); }
const midRow = Math.round((silTop + silBot) * 0.55);
for (let x = 0; x < W; x++) if (raw['0'][(midRow * W + x) * 4 + 3] > 0.5) { silL = Math.min(silL, x); silR = Math.max(silR, x); }
console.log(`jar silhouette: rows ${silTop}-${silBot}, body ${silL}-${silR} (${silR - silL + 1} px) at row ${midRow}`);

function blur(buf, w, h, ch, sx, sy) {
  const k = (s) => { const r = Math.max(1, Math.ceil(s * 3)); const a = []; let t = 0; for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * s * s)); a.push(v); t += v; } return { r, a: a.map((v) => v / t) }; };
  const tmp = new Float32Array(buf.length);
  if (sx > 0) { const { r, a } = k(sx); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < ch; c++) { let v = 0; for (let j = -r; j <= r; j++) { const xx = Math.min(w - 1, Math.max(0, x + j)); v += buf[(y * w + xx) * ch + c] * a[j + r]; } tmp[(y * w + x) * ch + c] = v; } } else tmp.set(buf);
  const out = new Float32Array(buf.length);
  if (sy > 0) { const { r, a } = k(sy); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < ch; c++) { let v = 0; for (let j = -r; j <= r; j++) { const yy = Math.min(h - 1, Math.max(0, y + j)); v += tmp[(yy * w + x) * ch + c] * a[j + r]; } out[(y * w + x) * ch + c] = v; } } else out.set(tmp);
  return out;
}
const smooth = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// the shadow wedge (alpha), from the right wall: full depth to SHADOW.full px, gone by SHADOW.gone, tapering in height
const shadowA = new Float32Array(W * H);
const wall = silR + 1, cy = silBot - SHADOW.lift;
for (let y = 0; y < H; y++) for (let x = wall - 12; x < W; x++) {
  const d = x - wall;
  const len = d <= SHADOW.full ? 1 : Math.max(0, 1 - (d - SHADOW.full) / (SHADOW.gone - SHADOW.full));
  const hh = SHADOW.h0 + (SHADOW.h1 - SHADOW.h0) * Math.min(1, Math.max(0, d / SHADOW.gone));
  const v = Math.abs(y - cy) <= hh / 2 ? 1 : 0;
  shadowA[y * W + x] = v * len * SHADOW.core;
}
const shadowBl = blur(shadowA, W, H, 1, 1.5, SHADOW.blur);

function floorAndJar(J) {
  // reflection: the jar mirrored about its foot, premultiplied, faded with distance and blurred (a glossy floor)
  const ref = new Float32Array(W * H * 4);
  for (let d = 1; d < H - silBot; d++) {
    const yd = silBot + d, ys = silBot - d + 1;
    if (ys < 0) break;
    const f = REFLECT.a0 * Math.exp(-d / REFLECT.d0) * (1 - smooth(REFLECT.cut0, REFLECT.cut1, d));
    for (let x = 0; x < W; x++) {
      const i = (ys * W + x) * 4, o = (yd * W + x) * 4, al = J[i + 3] * f;
      ref[o] = J[i] * al; ref[o + 1] = J[i + 1] * al; ref[o + 2] = J[i + 2] * al; ref[o + 3] = al;
    }
  }
  const rb = blur(ref, W, H, 4, REFLECT.blurX, REFLECT.blurY);
  const out = new Float32Array(W * H * 4);
  const sc = SHADOW.rgb.map((v) => v / 255);
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    // shadow, then the reflection over it, then the jar: straight-alpha "over" in sRGB values, as a browser blends
    let a = shadowBl[p], r = sc[0] * a, g = sc[1] * a, b = sc[2] * a;            // premultiplied
    const ra = rb[i + 3];
    r = rb[i] + r * (1 - ra); g = rb[i + 1] + g * (1 - ra); b = rb[i + 2] + b * (1 - ra); a = ra + a * (1 - ra);
    const ja = J[i + 3];
    r = J[i] * ja + r * (1 - ja); g = J[i + 1] * ja + g * (1 - ja); b = J[i + 2] * ja + b * (1 - ja); a = ja + a * (1 - ja);
    if (a > 1e-6) { out[i] = r / a; out[i + 1] = g / a; out[i + 2] = b / a; }
    out[i + 3] = a;
  }
  return out;
}

const to8 = (F) => { const b = Buffer.alloc(F.length); for (let i = 0; i < F.length; i++) b[i] = Math.max(0, Math.min(255, Math.round(F[i] * 255))); return b; };
const final = {};
for (const s of STATES) final[s] = to8(floorAndJar(jar[s]));
// the alpha of a pixel that is fully transparent carries no colour: zero it so the masters compare cleanly
for (const s of STATES) { const b = final[s]; for (let i = 0; i < b.length; i += 4) if (b[i + 3] === 0) b[i] = b[i + 1] = b[i + 2] = 0; }

// --- the seam check: each state equals its prefix below the prefix's seam ---------------------------------------
const report = [];
for (const s of STATES.slice(1)) {
  const P = prefix(s);
  if (P === '0') continue;
  const seam = rows[s].seam;
  let max = 0, n = 0;
  for (let y = seam; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; for (let k = 0; k < 4; k++) { const d = Math.abs(final[s][i + k] - final[P][i + k]); if (d) n++; max = Math.max(max, d); } }
  report.push({ state: s, prefix: P, seamRow: seam, maxDiffBelow: max, differingValues: n });
}
// the empty jar's own "top": the lowest row any first press changes (its foot, its reflection), so the first reveal
// starts below everything it adds
let low = -1;
for (const s of ['f', 'y', 'i']) for (let y = H - 1; y >= 0 && y > low; y--) { let ch = false; for (let x = 0; x < W && !ch; x++) { const i = (y * W + x) * 4; for (let k = 0; k < 4; k++) if (final[s][i + k] !== final['0'][i + k]) { ch = true; break; } } if (ch) low = y; }
// each state's surface top: the first row from the top that differs from the empty jar
const tops = { '0': Math.min(H, low + 1) };
for (const s of STATES.slice(1)) {
  let t = -1;
  for (let y = 0; y < H && t < 0; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; let d = 0; for (let k = 0; k < 4; k++) d = Math.max(d, Math.abs(final[s][i + k] - final['0'][i + k])); if (d > 2) { t = y; break; } }
  tops[s] = t;
}
// the seam each state hands on: below it, every state built on this one is identical to it
const seams = { '0': tops['0'] };
for (const s of STATES.slice(1)) { const kid = STATES.find((k) => k.length === s.length + 1 && k.startsWith(s)); seams[s] = kid ? rows[kid].seam : tops[s]; }

fs.mkdirSync(MASTERS, { recursive: true });
for (const s of STATES) await sharp(final[s], { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(MASTERS, `jar-${s}-2x.png`));

// --- the jar's box and jars.json -------------------------------------------------------------------------------
const f4 = (v) => +v.toFixed(4);
const json = {
  frame: { w: W, h: H },
  jar: { x0: f4(silL / W), x1: f4((silR + 1) / W), y0: f4(silTop / H), y1: f4((silBot + 1) / H) },
  states: Object.fromEntries(STATES.map((s) => [s, { top: f4(tops[s] / H), seam: f4(seams[s] / H) }])),
  notes: {
    top: "the first row (from the top) where the state differs from the empty jar: its fill's topmost grain, or for 0 the lowest row the first press changes (the foot's tint and its reflection)",
    seam: "below this row every state built on this one is pixel-identical to it in the PNG masters; a reveal of the next state that starts here never jumps (the next state's band between seam and top covers this state's top surface, as grains landing on it would)",
    axisFloor: 0.87,
    order: 'f Facebook (a quarter of blue), y YouTube (a quarter of red), i Instagram (a half of one mixed lot of pink and purple), bottom layer first',
  },
};

if (INSTALL) {
  fs.mkdirSync(INSTALL, { recursive: true });
  const sizes = [];
  for (const s of STATES) {
    const png2 = await sharp(final[s], { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    const png1 = await sharp(png2).resize(W / 2, H / 2, { kernel: 'lanczos3' }).png().toBuffer();
    for (const [scale, buf] of [['2x', png2], ['1x', png1]]) {
      const avif = await sharp(buf).avif({ quality: 64, effort: 7, chromaSubsampling: '4:4:4' }).toBuffer();
      const webp = await sharp(buf).webp({ quality: 88, alphaQuality: 95, effort: 6, smartSubsample: true }).toBuffer();
      fs.writeFileSync(path.join(INSTALL, `jar-${s}-${scale}.avif`), avif);
      fs.writeFileSync(path.join(INSTALL, `jar-${s}-${scale}.webp`), webp);
      sizes.push({ s, scale, avif: avif.length, webp: webp.length });
    }
  }
  fs.writeFileSync(path.join(INSTALL, 'jars.json'), JSON.stringify(json, null, 2) + '\n');
  const max2 = sizes.filter((z) => z.scale === '2x');
  console.log('SIZES 2x avif max', Math.max(...max2.map((z) => z.avif)), 'webp max', Math.max(...max2.map((z) => z.webp)),
    '| 1x avif max', Math.max(...sizes.filter((z) => z.scale === '1x').map((z) => z.avif)), 'webp max', Math.max(...sizes.filter((z) => z.scale === '1x').map((z) => z.webp)),
    '| all files', sizes.reduce((t, z) => t + z.avif + z.webp, 0));
  fs.writeFileSync(path.join(MASTERS, 'sizes.json'), JSON.stringify(sizes, null, 1));
}
fs.writeFileSync(path.join(MASTERS, 'jars.json'), JSON.stringify(json, null, 2) + '\n');
fs.writeFileSync(path.join(MASTERS, 'seam-check.json'), JSON.stringify({ rows, report }, null, 1));
console.log('SEAMS', JSON.stringify(report.map((r) => [r.state, r.seamRow, r.maxDiffBelow])));
console.log('JARS', JSON.stringify(json.jar), JSON.stringify(json.states));

// --- comparison images -------------------------------------------------------------------------------------
if (COMPARE && PICTURE) {
  fs.mkdirSync(COMPARE, { recursive: true });
  const bodyW = silR - silL + 1;
  // the picture's jars, traced: body left/right columns, lip top row
  const PJ = { 1: { l: 70, r: 221, t: 596 }, 2: { l: 310, r: 461, t: 596 }, 3: { l: 556, r: 707, t: 596 }, 4: { l: 802, r: 954, t: 595 } };
  const meta0 = await sharp(PICTURE).metadata();
  async function picPanel(n) {
    const J = PJ[n], s = bodyW / (J.r - J.l + 1);
    const x0 = J.l - silL / s, y0 = J.t - silTop / s, w = W / s, h = H / s;
    const ix0 = Math.max(0, Math.ceil(x0)), iy0 = Math.max(0, Math.ceil(y0));
    const ix1 = Math.min(meta0.width, Math.ceil(x0 + w)), iy1 = Math.min(meta0.height, Math.ceil(y0 + h));
    const cw = Math.round((ix1 - ix0) * s), ch = Math.round((iy1 - iy0) * s);
    const crop = await sharp(PICTURE).extract({ left: ix0, top: iy0, width: ix1 - ix0, height: iy1 - iy0 }).resize(cw, ch, { kernel: 'lanczos3' }).png().toBuffer();
    const ox = Math.round((ix0 - x0) * s), oy = Math.round((iy0 - y0) * s);
    const c2 = await sharp(crop).extract({ left: 0, top: 0, width: Math.min(cw, W - ox), height: Math.min(ch, H - oy) }).png().toBuffer();
    return sharp({ create: { width: W, height: H, channels: 3, background: { r: GROUND[0], g: GROUND[1], b: GROUND[2] } } }).composite([{ input: c2, left: ox, top: oy }]).png().toBuffer();
  }
  const onGround = (s) => sharp({ create: { width: W, height: H, channels: 3, background: { r: GROUND[0], g: GROUND[1], b: GROUND[2] } } })
    .composite([{ input: final[s], raw: { width: W, height: H, channels: 4 }, left: 0, top: 0 }]).png().toBuffer();
  async function sheet(panels, file, cols) {
    const gap = 10, lab = 30, n = panels.length, c = cols || n, r = Math.ceil(n / c);
    const comps = [];
    for (let i = 0; i < n; i++) {
      const x = gap + (i % c) * (W + gap), y = gap + Math.floor(i / c) * (H + lab + gap);
      comps.push({ input: panels[i].b, left: x, top: y });
      comps.push({ input: Buffer.from(`<svg width="${W}" height="${lab}" xmlns="http://www.w3.org/2000/svg"><text x="${W / 2}" y="21" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#333" text-anchor="middle">${panels[i].label}</text></svg>`), left: x, top: y + H });
    }
    await sharp({ create: { width: gap + c * (W + gap), height: gap + r * (H + lab + gap), channels: 3, background: { r: 255, g: 255, b: 255 } } }).composite(comps).png().toFile(file);
    console.log('wrote', file);
  }
  const P = async (n, label) => ({ b: await picPanel(n), label });
  const O = async (s, label) => ({ b: await onGround(s), label });
  await sheet([await P(1, 'picture, jar 1'), await O('f', 'render f'), await P(2, 'picture, jar 2'), await O('y', 'render y'),
    await P(3, 'picture, jar 3'), await O('i', 'render i'), await P(4, 'picture, jar 4'), await O('0', 'render 0')], path.join(COMPARE, 'compare-jars.png'), 4);
  await sheet([await P(4, 'picture, jar 4'), await O('fy', 'jar 4: fy'), await O('fyi', 'jar 4: fyi'), await O('iyf', 'jar 4: iyf')], path.join(COMPARE, 'compare-jar4.png'), 4);
  await sheet(await Promise.all(STATES.map((s) => O(s, s))), path.join(COMPARE, 'strip-16.png'), 8);
}
