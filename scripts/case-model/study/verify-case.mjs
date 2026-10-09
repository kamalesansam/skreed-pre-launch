// Quick intake check for the phone case 3D model the user will send (a .zip, a folder, or a .glb/.gltf).
// Read-only on the input. Extracts a zip into a NEW empty directory under --work, never executes anything from it.
// Usage: node verify-case.mjs <input.zip|dir|file.glb> --work <empty work dir> [--optimise] [--lod1 4000]
// Prints a PASS / WARN / FAIL table and writes <work>/report.json. Exit code 1 when any FAIL.
import { NodeIO, getBounds, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, quantize, meshopt, draco, prune, reorder, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const input = path.resolve(process.argv[2] || '');
const opt = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const work = path.resolve(opt('--work', './verify-work'));
const doOptimise = process.argv.includes('--optimise');
const lod1Target = +opt('--lod1', '4000');
const rows = [];
const report = { input, models: [] };
const add = (id, status, what, detail) => rows.push({ id, status, what, detail });

// thresholds (see the guidance doc; change here, not in the checks)
const T = {
  zipMaxBytes: 300e6, zipMaxEntries: 2000,
  heightM: [0.12, 0.2], widthM: [0.06, 0.1], depthM: [0.006, 0.025],
  trisPass: 20000, trisWarn: 60000, primitivesWarn: 4, primitivesFail: 12,
  texMaxPx: 2048, texWarnBytes: 512e3, shippedPass: 200e3, shippedWarn: 400e3,
  allowedRequired: new Set(['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_mesh_quantization', 'KHR_texture_basisu', 'KHR_texture_transform', 'EXT_texture_webp', 'KHR_materials_clearcoat', 'KHR_materials_ior', 'KHR_materials_specular', 'KHR_materials_sheen', 'KHR_materials_emissive_strength']),
};

await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().setLogger(new Logger(Logger.Verbosity.WARN)).registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
});

// ---------- A. package ----------
fs.mkdirSync(work, { recursive: true });
if (fs.readdirSync(work).length) { console.error('work dir must be empty: ' + work); process.exit(2); }
let root = input;
if (/\.zip$/i.test(input)) {
  const zi = execFileSync('unzip', ['-Z', input], { encoding: 'utf8', maxBuffer: 64e6 }).split('\n');
  const entries = zi.filter((l) => /^[-dl?][rwx-]{9}/.test(l));
  const names = execFileSync('unzip', ['-Z1', input], { encoding: 'utf8', maxBuffer: 64e6 }).split('\n').filter(Boolean);
  const total = +(execFileSync('unzip', ['-l', input], { encoding: 'utf8', maxBuffer: 64e6 }).trim().split('\n').pop().trim().split(/\s+/)[0]);
  const bad = names.filter((n) => n.startsWith('/') || n.split(/[\\/]/).includes('..'));
  const links = entries.filter((l) => l.startsWith('l'));
  add('A1', bad.length || links.length ? 'FAIL' : 'PASS', 'zip entries are safe (no absolute paths, no .., no symlinks)', `${names.length} entries; ${bad.length} unsafe paths; ${links.length} symlinks`);
  add('A2', total > T.zipMaxBytes || names.length > T.zipMaxEntries ? 'FAIL' : 'PASS', 'zip size sane (no zip bomb)', `${(total / 1e6).toFixed(1)} MB uncompressed, ${names.length} entries`);
  if (bad.length || links.length || total > T.zipMaxBytes) { finish(); }
  root = path.join(work, 'extracted'); fs.mkdirSync(root);
  execFileSync('unzip', ['-q', '-n', input, '-d', root]);
}
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isSymbolicLink()) continue; if (e.isDirectory()) walk(p); else files.push(p); } };
if (fs.statSync(root).isDirectory()) walk(root); else files.push(root);
const byExt = {}; files.forEach((f) => { const x = path.extname(f).toLowerCase() || '(none)'; (byExt[x] ||= []).push(f); });
add('A3', 'INFO', 'file inventory', Object.entries(byExt).map(([k, v]) => `${k}:${v.length}`).join(' '));
const gl = [...(byExt['.glb'] || []), ...(byExt['.gltf'] || [])];
const convertible = ['.fbx', '.obj', '.blend', '.usdz', '.usd', '.usdc', '.stl', '.step', '.stp', '.3ds', '.dae', '.max', '.c4d', '.3dm', '.ma', '.mb', '.ply', '.skp'].filter((x) => byExt[x]);
if (!gl.length) {
  add('A4', 'FAIL', 'a glTF/GLB is present', convertible.length ? `only ${convertible.join(', ')}: convert first (see guidance: Blender CLI export to glTF 2.0, +Y up, metres, apply transforms)` : 'no 3D file found');
  finish();
}
add('A4', 'PASS', 'a glTF/GLB is present', gl.map((f) => path.relative(root, f) || path.basename(f)).join(', ') + (convertible.length ? ` (also: ${convertible.join(', ')})` : ''));
const extraTextures = ['.png', '.jpg', '.jpeg', '.webp', '.ktx2', '.exr', '.tif', '.tiff', '.psd'].flatMap((x) => byExt[x] || []);
if (extraTextures.length) add('A5', 'INFO', 'loose image files', extraTextures.length + ' files: ' + extraTextures.slice(0, 8).map((f) => path.basename(f) + ' ' + Math.round(fs.statSync(f).size / 1024) + 'KB').join(', '));

// ---------- B. each model ----------
for (const file of gl) {
  const tag = path.basename(file);
  let doc;
  try { doc = await io.read(file); } catch (e) { add('B1', 'FAIL', `${tag}: parses`, String(e.message).slice(0, 200)); continue; }
  const rj = file.endsWith('.glb') ? JSON.parse(fs.readFileSync(file).subarray(20, 20 + fs.readFileSync(file).readUInt32LE(12)).toString()) : JSON.parse(fs.readFileSync(file, 'utf8'));
  const req = rj.extensionsRequired || [];
  const badReq = req.filter((x) => !T.allowedRequired.has(x));
  add('B1', badReq.length ? 'FAIL' : 'PASS', `${tag}: parses; required extensions three.js can load`, `generator "${rj.asset?.generator}"; used [${(rj.extensionsUsed || []).join(', ')}]; required [${req.join(', ')}]`);
  const r = doc.getRoot(); const scene = r.getDefaultScene() || r.listScenes()[0];
  const sb = getBounds(scene); const size = sb.max.map((v, i) => v - sb.min[i]); const ctr = sb.max.map((v, i) => (v + sb.min[i]) / 2);
  // B2 units: try metres, then cm, mm, inches
  const sorted = [...size].sort((a, b) => b - a);
  const fits = (s) => s[0] >= T.heightM[0] && s[0] <= T.heightM[1] && s[1] >= T.widthM[0] && s[1] <= T.widthM[1] && s[2] >= T.depthM[0] && s[2] <= T.depthM[1];
  const unitGuess = [['metres', 1], ['centimetres', 0.01], ['millimetres', 0.001], ['inches', 0.0254], ['decimetres', 0.1]].find(([, k]) => fits(sorted.map((v) => v * k)));
  add('B2', unitGuess?.[1] === 1 ? 'PASS' : unitGuess ? 'WARN' : 'FAIL', `${tag}: real-world size in metres (phone case)`, `bbox ${size.map((v) => v.toFixed(4)).join(' x ')} ` + (unitGuess ? `reads as ${unitGuess[0]}${unitGuess[1] !== 1 ? `; scale by ${unitGuess[1]}` : ''}` : 'does not look like a phone case at any common unit'));
  const ax = ['X', 'Y', 'Z']; const hi = size.indexOf(sorted[0]), lo = size.indexOf(sorted[2]);
  add('B3', hi === 1 && lo === 2 ? 'PASS' : 'WARN', `${tag}: +Y up (height on Y), thickness on Z`, `height axis ${ax[hi]}, thickness axis ${ax[lo]}`);
  const off = Math.max(...ctr.map((c, i) => Math.abs(c) / (size[i] || 1)));
  add('B4', off < 0.05 ? 'PASS' : 'WARN', `${tag}: origin at bbox centre`, `centre ${ctr.map((v) => v.toFixed(4)).join(', ')} (${(off * 100).toFixed(1)}% of size off)`);
  // B5 transforms
  const nodes = r.listNodes(); let negScale = 0, nonUniform = 0, nonIdentity = 0;
  nodes.forEach((n) => { const s = n.getScale(); if (s[0] * s[1] * s[2] < 0) negScale++; if (Math.abs(s[0] - s[1]) > 1e-4 || Math.abs(s[1] - s[2]) > 1e-4) nonUniform++; const t = n.getTranslation(), q = n.getRotation(); if (n.getMesh() && (t.some((v) => Math.abs(v) > 1e-6) || Math.abs(q[3] - 1) > 1e-6 || s.some((v) => Math.abs(v - 1) > 1e-6))) nonIdentity++; });
  add('B5', negScale ? 'FAIL' : nonUniform ? 'WARN' : 'PASS', `${tag}: transforms clean (no negative or non-uniform scale)`, `${nodes.length} nodes; negative scale ${negScale}; non-uniform ${nonUniform}; mesh nodes with unapplied transforms ${nonIdentity}`);
  // B6/B7 parts and triangles
  const prims = []; let tris = 0;
  scene.traverse((n) => { const m = n.getMesh(); if (!m) return; m.listPrimitives().forEach((p) => { const idx = p.getIndices(); const pos = p.getAttribute('POSITION'); const t = p.getMode() === 4 ? (idx ? idx.getCount() : pos.getCount()) / 3 : 0; tris += t; prims.push({ node: n.getName(), mesh: m.getName(), material: p.getMaterial()?.getName() || '(none)', tris: t, verts: pos.getCount(), p, n }); }); });
  prims.sort((a, b) => b.tris - a.tris);
  add('B6', prims.length > T.primitivesFail ? 'FAIL' : prims.length > T.primitivesWarn ? 'WARN' : 'PASS', `${tag}: few parts (each part = one instanced draw call)`, prims.map((x) => `${x.node}/${x.material}: ${x.tris} tris`).join('; '));
  const dev = prims.find((x) => /device|phone|lens|glass/i.test(x.node + x.material));
  add('B6b', dev ? 'PASS' : 'WARN', `${tag}: a Device proxy fills the camera cut-out`, dev ? `${dev.node}/${dev.material}` : 'no part named device/phone/lens/glass: the cut-out will show the page through the case');
  const acc = prims.find((x) => /ring|camera|accent|lens/i.test(x.node + x.material));
  if (acc) { const ab = getBounds(acc.n); const ac = ab.max.map((v, i) => (v + ab.min[i]) / 2);
    add('B3b', ac[2] > ctr[2] && ac[1] > ctr[1] ? 'PASS' : 'WARN', `${tag}: camera side faces +Z, camera at the top`, `${acc.node} centre ${ac.map((v) => v.toFixed(4)).join(', ')} -> ${ac[2] > ctr[2] ? 'back is +Z' : 'back is -Z'}, ${ac[1] > ctr[1] ? 'top' : 'bottom'}-${ac[0] < ctr[0] ? 'left' : 'right'} seen from ${ac[2] > ctr[2] ? '+Z' : '-Z'}`); }
  add('B7', tris <= T.trisPass ? 'PASS' : tris <= T.trisWarn ? 'WARN' : 'FAIL', `${tag}: triangles per case <= ${T.trisPass} (x24 on screen)`, `${tris} triangles, ${prims.reduce((n, x) => n + x.verts, 0)} vertices; x24 = ${tris * 24}`);
  // B8 body material: colour must be a factor, not baked
  const body = prims.find((x) => /body|shell|case|shade/i.test(x.node + x.material)) || prims[0];
  const bm = body.p.getMaterial();
  let colourStatus = 'PASS', colourDetail = 'no baseColorTexture';
  if (bm?.getBaseColorTexture()) {
    const tex = bm.getBaseColorTexture(); colourStatus = 'WARN'; colourDetail = `baseColorTexture ${tex.getMimeType()} ${tex.getSize()?.join('x')}: check it is greyscale detail, not a baked shade`;
  }
  if (body.p.getAttribute('COLOR_0')) { colourStatus = 'WARN'; colourDetail += '; COLOR_0 vertex colours present (they multiply the shade; strip or make white)'; }
  add('B8', colourStatus, `${tag}: body "${body.node}" takes its colour from one parameter`, `${colourDetail}; factor ${bm?.getBaseColorFactor().map((v) => v.toFixed(2)).join(',')}; metallic ${bm?.getMetallicFactor()}; roughness ${bm?.getRoughnessFactor()}; alpha ${bm?.getAlphaMode()}; doubleSided ${bm?.getDoubleSided()}`);
  // B9 UVs on body
  const uv = body.p.getAttribute('TEXCOORD_0');
  if (!uv) add('B9', 'WARN', `${tag}: body has one clean UV set`, 'no TEXCOORD_0 (fine for flat colour; needed for normal/AO/roughness maps)');
  else {
    const mn = uv.getMin([]), mx = uv.getMax([]);
    const inRange = mn[0] >= -1e-3 && mn[1] >= -1e-3 && mx[0] <= 1.001 && mx[1] <= 1.001;
    const { overlap, zeroArea } = uvOverlap(body.p);
    add('B9', inRange && overlap < 0.05 ? 'PASS' : 'WARN', `${tag}: body has one clean UV set`, `range u ${mn[0].toFixed(3)}..${mx[0].toFixed(3)} v ${mn[1].toFixed(3)}..${mx[1].toFixed(3)}; overlapping texels ${(overlap * 100).toFixed(1)}%; zero-area UV tris ${(zeroArea * 100).toFixed(1)}%`);
  }
  // B10/B11 normals, winding, topology per part
  prims.forEach((x, i) => {
    const t = topo(x.p);
    const st = !x.p.getAttribute('NORMAL') || t.windingDisagree > 0.05 ? 'FAIL' : t.boundary > 0 || t.nonManifold > 0 || t.degenerate > 0 ? 'WARN' : 'PASS';
    add('B10.' + i, st, `${tag}: ${x.node} normals and topology`, `normals ${x.p.getAttribute('NORMAL') ? 'yes' : 'NO'}; winding vs normals disagree on ${(t.windingDisagree * 100).toFixed(1)}% of tris; signed volume ${t.volume.toExponential(2)} (${t.volume > 0 ? 'outward' : 'inward or open'}); open edges ${t.boundary}; non-manifold ${t.nonManifold}; degenerate ${t.degenerate}`);
  });
  // B12 textures
  const texs = r.listTextures();
  const tb = texs.reduce((n, t) => n + (t.getImage()?.byteLength || 0), 0);
  const big = texs.filter((t) => { const s = t.getSize(); return s && (s[0] > T.texMaxPx || s[1] > T.texMaxPx); });
  add('B12', big.length ? 'WARN' : tb > T.texWarnBytes ? 'WARN' : 'PASS', `${tag}: textures small (<= ${T.texMaxPx}px, <= ${T.texWarnBytes / 1e3} KB)`, texs.length ? texs.map((t) => `${t.getName() || t.getURI() || 'tex'} ${t.getMimeType()} ${t.getSize()?.join('x')} ${Math.round((t.getImage()?.byteLength || 0) / 1024)}KB`).join('; ') : 'none');
  // B13 extras
  const extras = { animations: r.listAnimations().length, skins: r.listSkins().length, cameras: r.listCameras().length, morphTargets: prims.reduce((n, x) => n + x.p.listTargets().length, 0) };
  add('B13', Object.values(extras).some(Boolean) ? 'WARN' : 'PASS', `${tag}: no animations, skins, cameras or morphs`, JSON.stringify(extras));
  // B14 shipped size estimate
  let raw = fs.statSync(file).size;
  if (file.endsWith('.gltf')) for (const x of [...(rj.buffers || []), ...(rj.images || [])]) { if (x.uri && !x.uri.startsWith('data:')) { const f = path.join(path.dirname(file), decodeURIComponent(x.uri)); if (fs.existsSync(f)) raw += fs.statSync(f).size; } }
  const est = await shippedSize(file);
  add('B14', est.meshopt.br <= T.shippedPass ? 'PASS' : est.meshopt.br <= T.shippedWarn ? 'WARN' : 'FAIL', `${tag}: shipped size (meshopt + quantise, brotli) <= ${T.shippedPass / 1e3} KB`, `raw ${Math.round(raw / 1024)} KB; meshopt ${Math.round(est.meshopt.bytes / 1024)} KB (br ${Math.round(est.meshopt.br / 1024)} KB); draco ${Math.round(est.draco.bytes / 1024)} KB (br ${Math.round(est.draco.br / 1024)} KB)`);
  report.models.push({ file, size, tris, parts: prims.map((x) => ({ node: x.node, material: x.material, tris: x.tris, verts: x.verts })), est });
  if (doOptimise) await optimise(file, path.join(work, 'out'), unitGuess && unitGuess[1] !== 1 ? unitGuess[1] : 1);
}
finish();

// ---------- helpers ----------
function finish() {
  const w = Math.max(...rows.map((r) => r.what.length));
  for (const r of rows) console.log(`${r.status.padEnd(4)} ${r.id.padEnd(6)} ${r.what.padEnd(w)}  ${r.detail}`);
  const fails = rows.filter((r) => r.status === 'FAIL').length, warns = rows.filter((r) => r.status === 'WARN').length;
  console.log(`\n${fails} FAIL, ${warns} WARN, ${rows.filter((r) => r.status === 'PASS').length} PASS`);
  fs.writeFileSync(path.join(work, 'report.json'), JSON.stringify({ rows, report }, null, 1));
  process.exit(fails ? 1 : 0);
}
function topo(p) {
  const P = p.getAttribute('POSITION').getArray(); const N = p.getAttribute('NORMAL')?.getArray();
  const n = P.length / 3; const idx = p.getIndices() ? p.getIndices().getArray() : Uint32Array.from({ length: n }, (_, i) => i);
  const key = new Map(), wid = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = `${P[i * 3].toFixed(6)},${P[i * 3 + 1].toFixed(6)},${P[i * 3 + 2].toFixed(6)}`; if (!key.has(k)) key.set(k, key.size); wid[i] = key.get(k); }
  const edges = new Map(); let degenerate = 0, disagree = 0, volume = 0, counted = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    const A = [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]], B = [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], C = [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]];
    const u = B.map((v, i) => v - A[i]), v = C.map((x, i) => x - A[i]);
    const fn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...fn);
    volume += (A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0])) / 6;
    if (wid[a] === wid[b] || wid[b] === wid[c] || wid[a] === wid[c] || len < 1e-14) { degenerate++; continue; }
    if (N) { const vn = [0, 1, 2].map((k) => N[a * 3 + k] + N[b * 3 + k] + N[c * 3 + k]); if (fn[0] * vn[0] + fn[1] * vn[1] + fn[2] * vn[2] < 0) disagree++; counted++; }
    for (const [x, y] of [[wid[a], wid[b]], [wid[b], wid[c]], [wid[c], wid[a]]]) { const k = x < y ? x * 4294967296 + y : y * 4294967296 + x; edges.set(k, (edges.get(k) || 0) + 1); }
  }
  let boundary = 0, nonManifold = 0; edges.forEach((c) => { if (c === 1) boundary++; else if (c > 2) nonManifold++; });
  return { degenerate, boundary, nonManifold, windingDisagree: counted ? disagree / counted : 0, volume };
}
function uvOverlap(p) {
  const UV = p.getAttribute('TEXCOORD_0').getArray(); const n = UV.length / 2;
  const idx = p.getIndices() ? p.getIndices().getArray() : Uint32Array.from({ length: n }, (_, i) => i);
  const R = 256, grid = new Uint16Array(R * R); let zero = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const pts = [idx[t], idx[t + 1], idx[t + 2]].map((i) => [UV[i * 2] * R, UV[i * 2 + 1] * R]);
    const area = (pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[2][0] - pts[0][0]) * (pts[1][1] - pts[0][1]);
    if (Math.abs(area) < 1e-6) { zero++; continue; }
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map((q) => q[0])))), x1 = Math.min(R - 1, Math.ceil(Math.max(...pts.map((q) => q[0]))));
    const y0 = Math.max(0, Math.floor(Math.min(...pts.map((q) => q[1])))), y1 = Math.min(R - 1, Math.ceil(Math.max(...pts.map((q) => q[1]))));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5; let s = 0;
      for (let k = 0; k < 3; k++) { const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % 3]; const e = (bx - ax) * (py - ay) - (by - ay) * (px - ax); s += Math.sign(e) === Math.sign(area) || e === 0 ? 1 : 0; }
      if (s === 3) grid[y * R + x]++;
    }
  }
  let covered = 0, over = 0; for (const g of grid) { if (g) covered++; if (g > 1) over++; }
  return { overlap: covered ? over / covered : 0, zeroArea: zero / (idx.length / 3) };
}
async function shippedSize(file) {
  const br = (b) => zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  const out = {};
  for (const [name, steps] of [
    ['meshopt', [dedup(), weld(), reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' })]],
    ['draco', [dedup(), weld(), draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })]],
  ]) {
    const d = await io.read(file); await d.transform(prune({ keepAttributes: true }), ...steps);
    const b = await io.writeBinary(d); out[name] = { bytes: b.length, br: br(b) };
  }
  return out;
}
async function optimise(file, outDir, unitScale = 1) {
  // unitScale != 1: the source is in cm/mm/inches; scale the scene's root nodes so the outputs are in metres
  const toMetres = (d) => { if (unitScale === 1) return; const sc = d.getRoot().getDefaultScene() || d.getRoot().listScenes()[0]; sc.listChildren().forEach((n) => { n.setScale(n.getScale().map((v) => v * unitScale)); n.setTranslation(n.getTranslation().map((v) => v * unitScale)); }); };
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(file).replace(/\.(glb|gltf)$/i, '');
  const d0 = await io.read(file); toMetres(d0);
  await d0.transform(prune({ keepAttributes: true }), dedup(), weld(), reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(path.join(outDir, base + '.lod0.glb'), d0);
  const d1 = await io.read(file); toMetres(d1);
  const tris = d1.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + (p.getIndices()?.getCount() || 0) / 3, 0), 0);
  const ratio = Math.min(1, lod1Target / Math.max(1, tris));
  await d1.transform(prune({ keepAttributes: true }), dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0005 }), reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(path.join(outDir, base + '.lod1.glb'), d1);
  const t1 = d1.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + (p.getIndices()?.getCount() || 0) / 3, 0), 0);
  add('C1', 'INFO', 'optimised outputs written', `${outDir}: lod0 ${Math.round(fs.statSync(path.join(outDir, base + '.lod0.glb')).size / 1024)} KB (${tris} tris); lod1 ${Math.round(fs.statSync(path.join(outDir, base + '.lod1.glb')).size / 1024)} KB (${t1} tris, target ${lod1Target}, error cap 0.05% of size)${unitScale !== 1 ? `; scaled x${unitScale} to metres` : ''}`);
}
