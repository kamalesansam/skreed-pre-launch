// Intake of the supplier case model into the site (docs/specs/case-model-class.md 3 and 15, amendments 1 to 3;
// docs/specs/case-asset-contract.json). Dependency free: it reads each GLB's JSON chunk and the accessor bounds, never
// executes or decodes anything from the file, and only copies the verified files.
//
//   node scripts/case-model/intake.mjs <lod0.glb> <lod1.glb> [--dry]
//
// Checks (FAIL stops the intake, WARN is reported):
//   C1  a binary glTF 2.0 file (magic, version, a JSON chunk first, at most one BIN chunk, lengths consistent)
//   C2  required extensions: KHR_mesh_quantization and EXT_meshopt_compression only. Draco (KHR_draco_mesh_compression)
//       and Basis (KHR_texture_basisu) fail: they need WebAssembly, which the site CSP blocks. meshopt is decoded by the
//       vendored pure-JS reference decoder (amendment 1)
//   C3  no images, textures, samplers, animations, skins, cameras, lights or morph targets (the CSP blocks embedded
//       images, which GLTFLoader turns into blob: URLs)
//   C4  the parts: a "shell" (or Case_Body) node is required; "trim" (or Case_Accent) and "logo" are optional; nothing
//       else, and never a Device (Sam, 2026-10-09: the case only). One triangle-list primitive each
//   C5  the body material is plain: base colour white (or absent), no texture, no vertex colours, opaque, metallic 0;
//       the logo's base colour is a grey (its tint over the shade), the trim's is fixed
//   C6  node transforms: translation and a uniform positive scale only (the dequantising transform), no rotation
//   C7  space: +Y the long axis, the thickness on Z; with the scene's unitMM extra, a case-sized height (100 to 250 mm)
//   C8  triangles: LOD0 at most 24,000 (amendment 1: about 20k for the close-up), LOD1 at most 12,000
//   C9  bytes: LOD0 at most 150,000 raw, LOD1 at most 60,000 raw (family-page.md 6)
//   C10 the two LODs carry the same parts in the same order
// Then it writes public/models/case.lod0.<sha8>.glb and case.lod1.<sha8>.glb (content-hashed, immutable), removes older
// case.*.glb files there, and writes src/data/case-model.json, the manifest the island imports at build.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const LIMITS = { lod0Bytes: 150_000, lod1Bytes: 60_000, lod0Tris: 24_000, lod1Tris: 12_000, heightMm: [100, 250] };
const ALLOWED_REQUIRED = new Set(['KHR_mesh_quantization', 'EXT_meshopt_compression']);
const BANNED = ['KHR_draco_mesh_compression', 'KHR_texture_basisu', 'KHR_lights_punctual', 'EXT_texture_webp', 'KHR_texture_transform'];
const PART_NAMES = { body: ['shell', 'Case_Body'], accent: ['trim', 'Case_Accent'], logo: ['logo', 'Case_Logo'] };
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };

/** Parses a GLB's header and JSON chunk. Throws on a malformed file. */
export function readGlb(buf) {
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a binary glTF file (bad magic)');
  if (buf.readUInt32LE(4) !== 2) throw new Error(`glTF version ${buf.readUInt32LE(4)}, not 2`);
  if (buf.readUInt32LE(8) !== buf.length) throw new Error(`header length ${buf.readUInt32LE(8)} does not match the file (${buf.length} B)`);
  const chunks = [];
  for (let at = 12; at < buf.length;) {
    const len = buf.readUInt32LE(at), type = buf.readUInt32LE(at + 4);
    if (at + 8 + len > buf.length) throw new Error('a chunk runs past the end of the file');
    chunks.push({ type, start: at + 8, len });
    at += 8 + len;
  }
  if (!chunks.length || chunks[0].type !== 0x4e4f534a) throw new Error('the first chunk is not JSON');
  if (chunks.filter((c) => c.type === 0x004e4942).length > 1) throw new Error('more than one BIN chunk');
  const json = JSON.parse(buf.subarray(chunks[0].start, chunks[0].start + chunks[0].len).toString('utf8'));
  return { json, binBytes: chunks.find((c) => c.type === 0x004e4942)?.len ?? 0 };
}

/** Every contract check on one LOD. Returns { rows, parts, stats }. Pure: no file system access. */
export function checkLod(buf, lod) {
  const rows = [];
  const add = (id, status, what, detail = '') => rows.push({ id, status, what, detail });
  let json;
  try { ({ json } = readGlb(buf)); add('C1', 'PASS', 'binary glTF 2.0'); } catch (e) { add('C1', 'FAIL', 'binary glTF 2.0', String(e.message)); return { rows, parts: [], stats: {} }; }
  const req = json.extensionsRequired ?? [], used = json.extensionsUsed ?? [];
  const badReq = req.filter((x) => !ALLOWED_REQUIRED.has(x)), banned = used.filter((x) => BANNED.includes(x));
  add('C2', badReq.length || banned.length ? 'FAIL' : 'PASS', 'extensions decodable under the site CSP', `required ${req.join(', ') || 'none'}${badReq.length ? `; not allowed: ${badReq.join(', ')}` : ''}${banned.length ? `; banned: ${banned.join(', ')}` : ''}`);
  const extra = ['images', 'textures', 'samplers', 'animations', 'skins', 'cameras'].filter((k) => (json[k] ?? []).length);
  const morphs = (json.meshes ?? []).some((m) => m.primitives.some((p) => (p.targets ?? []).length));
  add('C3', extra.length || morphs ? 'FAIL' : 'PASS', 'no images, textures, animations, skins, cameras or morph targets', extra.length || morphs ? [...extra, ...(morphs ? ['morph targets'] : [])].join(', ') : '');
  const nodes = (json.nodes ?? []).filter((n) => n.mesh !== undefined);
  const findNode = (names) => nodes.find((n) => names.includes(n.name));
  const body = findNode(PART_NAMES.body), accent = findNode(PART_NAMES.accent), logo = findNode(PART_NAMES.logo);
  const known = new Set([body, accent, logo].filter(Boolean));
  const unknown = nodes.filter((n) => !known.has(n)).map((n) => n.name || '(unnamed)');
  const device = (json.nodes ?? []).some((n) => /device|phone|glass|lens/i.test(n.name ?? ''));
  const prims = [body, accent, logo].filter(Boolean).map((n) => json.meshes[n.mesh].primitives);
  const onePrim = prims.every((p) => p.length === 1 && (p[0].mode ?? 4) === 4 && p[0].indices !== undefined);
  add('C4', !body || unknown.length || device || !onePrim ? 'FAIL' : 'PASS', 'parts: shell (required), trim and logo (optional), one indexed triangle list each, no device',
    `${[body, accent, logo].filter(Boolean).map((n) => n.name).join(', ')}${unknown.length ? `; unknown: ${unknown.join(', ')}` : ''}${device ? '; a device, glass or lens node' : ''}${onePrim ? '' : '; a part is not one indexed triangle list'}`);
  if (!body) return { rows, parts: [], stats: {} };
  const mat = (n) => json.materials?.[json.meshes[n.mesh].primitives[0].material] ?? {};
  const bm = mat(body), pbr = bm.pbrMetallicRoughness ?? {};
  const white = (pbr.baseColorFactor ?? [1, 1, 1, 1]).slice(0, 3).every((v) => Math.abs(v - 1) < 1e-3);
  const colours = [body, accent, logo].filter(Boolean).some((n) => 'COLOR_0' in json.meshes[n.mesh].primitives[0].attributes);
  const plain = white && !pbr.baseColorTexture && !colours && (bm.alphaMode ?? 'OPAQUE') === 'OPAQUE' && (pbr.metallicFactor ?? 1) === 0;
  const logoGrey = !logo || (() => { const c = mat(logo).pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1]; return Math.abs(c[0] - c[1]) < 1e-3 && Math.abs(c[1] - c[2]) < 1e-3; })();
  add('C5', plain && logoGrey ? 'PASS' : 'FAIL', 'body material plain (white, untextured, opaque, metallic 0, no vertex colours); logo tint a grey',
    `body base ${JSON.stringify(pbr.baseColorFactor ?? 'default')}, metallic ${pbr.metallicFactor ?? 1}, alpha ${bm.alphaMode ?? 'OPAQUE'}${colours ? ', vertex colours' : ''}${logo ? `; logo ${JSON.stringify(mat(logo).pbrMetallicRoughness?.baseColorFactor)}` : ''}`);
  const tfOk = [body, accent, logo].filter(Boolean).every((n) => !n.matrix && (!n.rotation || n.rotation.every((v, i) => Math.abs(v - (i === 3 ? 1 : 0)) < 1e-6))
    && (!n.scale || (n.scale[0] > 0 && Math.abs(n.scale[0] - n.scale[1]) < 1e-9 && Math.abs(n.scale[1] - n.scale[2]) < 1e-9)));
  add('C6', tfOk ? 'PASS' : 'FAIL', 'node transforms: translation and a uniform positive scale only');
  // C7 the space, from the POSITION accessor bounds through the node transform
  const box = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  let tris = 0;
  const partStats = [];
  for (const [name, n] of [['body', body], ['accent', accent], ['logo', logo]]) {
    if (!n) continue;
    const p = json.meshes[n.mesh].primitives[0];
    const a = json.accessors[p.attributes.POSITION];
    const k = a.normalized ? 1 / NORM[a.componentType] : 1;
    const s = n.scale?.[0] ?? 1, t = n.translation ?? [0, 0, 0];
    for (let i = 0; i < 3; i++) { box.min[i] = Math.min(box.min[i], a.min[i] * k * s + t[i]); box.max[i] = Math.max(box.max[i], a.max[i] * k * s + t[i]); }
    const pt = json.accessors[p.indices].count / 3;
    tris += pt;
    const m = json.materials?.[p.material] ?? {};
    partStats.push({ name, node: n.name, material: m.name ?? '', triangles: pt, baseColor: (m.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1]).slice(0, 3), roughness: m.pbrMetallicRoughness?.roughnessFactor ?? 1 });
  }
  const size = box.max.map((v, i) => v - box.min[i]);
  const unitMM = json.scenes?.[json.scene ?? 0]?.extras?.unitMM;
  const mm = size.map((v) => v * (unitMM ?? 1000));
  const axesOk = size[1] > size[0] && size[0] > size[2];
  const tall = mm[1] >= LIMITS.heightMm[0] && mm[1] <= LIMITS.heightMm[1];
  add('C7', axesOk && tall ? 'PASS' : 'FAIL', '+Y the long axis, thickness on Z, case-sized', `${mm.map((v) => v.toFixed(1)).join(' x ')} mm (${unitMM ? `unitMM ${unitMM}` : 'metres'})`);
  const triMax = lod === 0 ? LIMITS.lod0Tris : LIMITS.lod1Tris;
  add('C8', tris <= triMax ? 'PASS' : 'FAIL', `triangles at most ${triMax.toLocaleString('en')}`, `${tris.toLocaleString('en')} (${partStats.map((q) => `${q.name} ${q.triangles}`).join(', ')})`);
  const byteMax = lod === 0 ? LIMITS.lod0Bytes : LIMITS.lod1Bytes;
  add('C9', buf.length <= byteMax ? 'PASS' : 'FAIL', `at most ${byteMax.toLocaleString('en')} B raw`, `${buf.length.toLocaleString('en')} B`);
  return { rows, parts: partStats, stats: { triangles: tris, bytes: buf.length, size, mm, unitMM: unitMM ?? null, extras: json.scenes?.[json.scene ?? 0]?.extras ?? {}, required: req } };
}

/** Both LODs, plus C10. */
export function checkPair(buf0, buf1) {
  const a = checkLod(buf0, 0), b = checkLod(buf1, 1);
  const same = a.parts.map((p) => p.name).join() === b.parts.map((p) => p.name).join() && a.parts.length > 0;
  const rows = [...a.rows.map((r) => ({ ...r, lod: 0 })), ...b.rows.map((r) => ({ ...r, lod: 1 })), { id: 'C10', lod: '-', status: same ? 'PASS' : 'FAIL', what: 'the same parts in the same order at both LODs', detail: `${a.parts.map((p) => p.name).join(', ')} / ${b.parts.map((p) => p.name).join(', ')}` }];
  return { rows, lod0: a, lod1: b, ok: rows.every((r) => r.status !== 'FAIL') };
}

/** The manifest the island imports at build (case-model-class.md 3, amended: three parts, no device). */
export function manifestFor(r, files) {
  const part = (name, followsShade) => { const p = r.lod0.parts.find((q) => q.name === name); return p && { node: p.node, material: p.material, followsShade, ...(name === 'logo' ? { tint: +p.baseColor[0].toFixed(4) } : {}), ...(name === 'accent' ? { roughness: +p.roughness.toFixed(3) } : {}) }; };
  const s = r.lod0.stats;
  return {
    source: 'supplier',
    model: 'Cobalt.fbx, cleaned and simplified (scratchpad case/out, 2026-10-09)',
    lod0: `/models/${files.lod0}`,
    lod1: `/models/${files.lod1}`,
    sha256: { lod0: files.sha0, lod1: files.sha1 },
    decoder: 'meshopt-reference-0.22.0',
    orient: [0, 0, 0, 1],
    sizeMm: s.mm.map((v) => +v.toFixed(1)),
    parts: Object.fromEntries([['body', part('body', true)], ['accent', part('accent', false)], ['logo', part('logo', true)]].filter(([, v]) => v)),
    triangles: { lod0: r.lod0.stats.triangles, lod1: r.lod1.stats.triangles },
    bytes: { lod0: r.lod0.stats.bytes, lod1: r.lod1.stats.bytes },
    lod1BackOnly: !!r.lod1.stats.extras.backOnly,
    maps: { orm: null, normal: null },
    instancing: true,
    caseType: '',
    device: '',
  };
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dry = process.argv.includes('--dry');
  if (args.length !== 2) { console.error('usage: node scripts/case-model/intake.mjs <lod0.glb> <lod1.glb> [--dry]'); process.exit(2); }
  const [p0, p1] = args.map((a) => resolve(a));
  const b0 = readFileSync(p0), b1 = readFileSync(p1);
  const r = checkPair(b0, b1);
  console.log('| LOD | check | status | what | detail |\n|---|---|---|---|---|');
  for (const x of r.rows) console.log(`| ${x.lod} | ${x.id} | ${x.status} | ${x.what} | ${x.detail} |`);
  if (!r.ok) { console.error('intake: FAIL, nothing copied'); process.exit(1); }
  const sha = (b) => createHash('sha256').update(b).digest('hex');
  const sha0 = sha(b0), sha1 = sha(b1);
  const files = { lod0: `case.lod0.${sha0.slice(0, 8)}.glb`, lod1: `case.lod1.${sha1.slice(0, 8)}.glb`, sha0, sha1 };
  const manifest = manifestFor(r, files);
  if (dry) { console.log(JSON.stringify(manifest, null, 2)); return; }
  const dir = join(ROOT, 'public', 'models');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (/^case\.lod[01]\.[0-9a-f]{8}\.glb$/.test(f) && f !== files.lod0 && f !== files.lod1) rmSync(join(dir, f));
  copyFileSync(p0, join(dir, files.lod0));
  copyFileSync(p1, join(dir, files.lod1));
  writeFileSync(join(ROOT, 'src', 'data', 'case-model.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`intake: PASS. ${basename(p0)} -> public/models/${files.lod0}, ${basename(p1)} -> public/models/${files.lod1}, manifest src/data/case-model.json`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
