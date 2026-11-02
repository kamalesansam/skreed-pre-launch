// The intake of the case models (case-model-class.md 3, 15 and amendment 1; T16's build half; family-page.md 21 D1 and
// 24 D1): the shipped files of the Tough (the Cobalt) and of each case type's own model (Sam's MagTough, Snap and Armor
// files, round 6) pass every contract check and match the manifest; no name in them is the supplier's or Maya's; files
// that need WebAssembly, embed images, carry a device or bake a colour into the body fail; the vendored decoder is the
// pinned, WebAssembly-free reference decoder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CASE_TYPES, checkLod, checkPair, manifestFor, readGlb } from '../../scripts/case-model/intake.mjs';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('src/data/case-model.json', root), 'utf8'));
const file = (p: string) => readFileSync(new URL(`public${p}`, root));
const lod0 = file(manifest.lod0), lod1 = file(manifest.lod1);
type Row = { id: string; status: string; detail: string };
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

/** A copy of a GLB with its JSON chunk edited (the BIN chunk unchanged). */
function edit(buf: Buffer, fn: (j: Record<string, any>) => void): Buffer {
  const { json } = readGlb(buf);
  fn(json);
  const jlen = buf.readUInt32LE(12);
  const rest = buf.subarray(20 + jlen);
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - (js.length % 4), 0x20)]);
  const head = Buffer.alloc(20);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(20 + js.length + rest.length, 8);
  head.writeUInt32LE(js.length, 12); head.writeUInt32LE(0x4e4f534a, 16);
  return Buffer.concat([head, js, rest]);
}
const status = (rows: Row[], id: string) => rows.find((r) => r.id === id)?.status;
const fails = (r: { rows: Row[] }) => r.rows.filter((x) => x.status === 'FAIL').map((x) => `${x.id} ${x.detail}`).join('; ');

test('the Tough case (Cobalt): both LODs pass every check and match the manifest (hashes, names, bytes, triangles)', () => {
  const r = checkPair(lod0, lod1);
  assert.ok(r.ok, fails(r));
  assert.equal(sha(lod0), manifest.sha256.lod0);
  assert.equal(sha(lod1), manifest.sha256.lod1);
  assert.ok(manifest.lod0.endsWith(`.${manifest.sha256.lod0.slice(0, 8)}.glb`) && manifest.lod1.endsWith(`.${manifest.sha256.lod1.slice(0, 8)}.glb`));
  assert.equal(manifest.source, 'supplier');
  assert.deepEqual(Object.keys(manifest.parts), ['body', 'accent', 'logo']);
  assert.equal(manifest.bytes.lod0, lod0.length);
  assert.equal(manifest.triangles.lod1, r.lod1.stats.triangles);
});


test('exactly the manifest files in public/models, nothing stale', () => {
  const glbs = readdirSync(new URL('public/models/', root)).filter((f) => f.endsWith('.glb')).sort();
  const listed = [manifest.lod0, manifest.lod1, ...CASE_TYPES.flatMap((t: string) => (manifest[t] ? [manifest[t].lod0, manifest[t].lod1] : []))];
  // section 4's product models left public/ for scripts/room/models/ (Blender references only), so the folder is the case's alone
  assert.deepEqual(glbs, listed.map((p) => p.slice(8)).sort());
});

test('a model that needs Draco or Basis fails C2 (WebAssembly under the site CSP); meshopt alone passes', () => {
  const draco = edit(lod1, (j) => { j.extensionsUsed.push('KHR_draco_mesh_compression'); j.extensionsRequired.push('KHR_draco_mesh_compression'); });
  assert.equal(status(checkLod(draco, 1).rows, 'C2'), 'FAIL');
  const basis = edit(lod1, (j) => { j.extensionsUsed.push('KHR_texture_basisu'); });
  assert.equal(status(checkLod(basis, 1).rows, 'C2'), 'FAIL');
  assert.equal(status(checkLod(lod1, 1).rows, 'C2'), 'PASS');
});

test('embedded images fail C3; a device or an unknown part fails C4; a baked body colour or vertex colours fail C5', () => {
  const img = edit(lod1, (j) => { j.images = [{ bufferView: 0, mimeType: 'image/png' }]; });
  assert.equal(status(checkLod(img, 1).rows, 'C3'), 'FAIL');
  const dev = edit(lod1, (j) => { j.nodes.push({ name: 'Device', mesh: 0 }); });
  assert.equal(status(checkLod(dev, 1).rows, 'C4'), 'FAIL');
  const strap = edit(lod1, (j) => { j.nodes.push({ name: 'strap', mesh: 0 }); });
  assert.equal(status(checkLod(strap, 1).rows, 'C4'), 'FAIL');
  const baked = edit(lod1, (j) => { j.materials[0].pbrMetallicRoughness.baseColorFactor = [0.06, 0.25, 0.79, 1]; });
  assert.equal(status(checkLod(baked, 1).rows, 'C5'), 'FAIL');
  const vc = edit(lod1, (j) => { j.meshes[0].primitives[0].attributes.COLOR_0 = 1; });
  assert.equal(status(checkLod(vc, 1).rows, 'C5'), 'FAIL');
  const rot = edit(lod1, (j) => { j.nodes[0].rotation = [0, 0.7071, 0, 0.7071]; });
  assert.equal(status(checkLod(rot, 1).rows, 'C6'), 'FAIL');
  const big = edit(lod1, (j) => { j.scenes[0].extras.unitMM = 1964.3; });     // ten times too tall: not a case
  assert.equal(status(checkLod(big, 1).rows, 'C7'), 'FAIL');
  assert.throws(() => readGlb(Buffer.from('not a glb at all, just text')), /magic/);
});

test('the vendored decoder is meshoptimizer 0.22.0 reference, byte for byte, and compiles no WebAssembly', () => {
  const src = readFileSync(new URL('src/scripts/family/three/vendor/meshopt-decoder-reference.js', root));
  assert.equal(createHash('sha256').update(src).digest('hex'), '66b9856b46d4e3bdaa822c7defb3e6ab0edb2ca372f8460f6ad5742294019616');
  assert.doesNotMatch(src.toString(), /WebAssembly|eval\(|new Function/);
  // no site module imports three's WebAssembly MeshoptDecoder
  const walk = (d: URL): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(new URL(`${e.name}/`, d)) : [fileURLToPath(new URL(e.name, d))]);
  for (const f of walk(new URL('src/', root)).filter((p) => /\.(ts|js|astro|mjs)$/.test(p))) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /libs\/meshopt_decoder|from 'meshoptimizer'|DRACOLoader|KTX2Loader/, f);
  }
});

// Round 6 (family-page.md 24 D1): Sam's files as the case types' own models, made by scripts/case-model/intake-fbx.py and
// pack-case.mjs from his FBX files of 2026-11-02, the roles decided from isolated renders of each material
const TYPE_PARTS: Record<string, string[]> = { magtough: ['body', 'accent', 'logo'], snap: ['body', 'logo'], armor: ['body', 'accent', 'logo'] };
const TYPE_FILES: Record<string, string> = { magtough: 'magsafe case.fbx', snap: 'snap 3 (1).fbx', armor: 'Armor 5.fbx' };

test('the case types\' own models: magtough, snap and armor each with its caseType, both LODs passing C1 to C10 and matching the manifest (hashes, bytes, triangles, size)', () => {
  assert.deepEqual(CASE_TYPES, ['magtough', 'snap', 'armor']);
  for (const t of CASE_TYPES) {
    const m = manifest[t];
    assert.ok(m, `the manifest carries ${t}`);
    assert.equal(m.caseType, t);
    assert.equal(m.standsInFor, undefined, `${t} is its own model, never a stand-in`);
    assert.ok(m.model.startsWith(TYPE_FILES[t]) && m.model.includes('2026-11-02'), m.model);
    const b0 = file(m.lod0), b1 = file(m.lod1);
    const r = checkPair(b0, b1);
    assert.ok(r.ok, `${t}: ${fails(r)}`);
    assert.equal(sha(b0), m.sha256.lod0);
    assert.equal(sha(b1), m.sha256.lod1);
    assert.equal(m.lod0, `/models/${t}.lod0.${m.sha256.lod0.slice(0, 8)}.glb`);
    assert.equal(m.lod1, `/models/${t}.lod1.${m.sha256.lod1.slice(0, 8)}.glb`);
    assert.deepEqual(m.bytes, { lod0: b0.length, lod1: b1.length });
    assert.deepEqual(m.triangles, { lod0: r.lod0.stats.triangles, lod1: r.lod1.stats.triangles });
    assert.deepEqual(m.sizeMm, r.lod0.stats.mm!.map((v: number) => +v.toFixed(1)));
    assert.deepEqual(Object.keys(m.parts), TYPE_PARTS[t]);
    assert.deepEqual(r.lod0.parts.map((p: { name: string }) => p.name), TYPE_PARTS[t]);
    assert.equal(m.parts.body.followsShade, true);
    assert.equal(m.parts.logo.tint, 0.8468, 'the logo at the Cobalt\'s tint over the shade');
    if (m.parts.accent) assert.deepEqual(r.lod0.parts.find((p: { name: string }) => p.name === 'accent')!.baseColor.map((v: number) => +v.toFixed(3)), [0.073, 0.077, 0.077], 'the trim keeps the Cobalt\'s grey');
    // the beats' half turn shows the sides, so neither LOD is back-only
    assert.equal(m.lod1BackOnly, false);
  }
});

test('no node, mesh or material of a type model is named for the supplier or by Maya: the names are the roles', () => {
  for (const t of CASE_TYPES) for (const lod of ['lod0', 'lod1'] as const) {
    const buf = file(manifest[t][lod]);
    const { json } = readGlb(buf);
    for (const k of ['nodes', 'meshes', 'materials'] as const) for (const x of json[k]) assert.ok(['shell', 'trim', 'logo', 'ring'].includes(x.name), `${t} ${lod} ${k}: "${x.name}"`);
    // the whole JSON chunk: no trace of the supplier's mark or of the Maya scene's names
    const text = buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8');
    assert.doesNotMatch(text, /zeos|hexagon|lambert|standardSurface|polySurface|pCube|Bumper|OliveMatte|pro__max/i, `${t} ${lod}`);
  }
});

test('the type models\' scene extras are the Cobalt\'s: unitMM, axes with the back on +Z, the LOD, the logo tint, the source naming Sam\'s file and the intake, backOnly false', () => {
  for (const t of CASE_TYPES) for (const lod of ['lod0', 'lod1'] as const) {
    const { json } = readGlb(file(manifest[t][lod]));
    const x = json.scenes[json.scene ?? 0].extras;
    assert.equal(x.lod, lod);
    assert.equal(x.logoTint, 0.8468);
    assert.equal(x.backOnly, false);
    assert.match(x.axes, /back faces \+Z/);
    assert.ok(x.source.startsWith(TYPE_FILES[t]) && x.source.includes('scripts/case-model/intake-fbx.py'), x.source);
    assert.ok(Math.abs(x.unitMM - manifest[t].sizeMm[1]) < 0.15, `${t}: unitMM ${x.unitMM} is the height`);
  }
});

test('manifestFor: a type\'s entry carries its caseType and its file, never a stand-in list; the Tough keeps its own shape', () => {
  const r = checkPair(file(manifest.snap.lod0), file(manifest.snap.lod1));
  const files = { lod0: 'snap.lod0.00000000.glb', lod1: 'snap.lod1.00000000.glb', sha0: '0'.repeat(64), sha1: '1'.repeat(64) };
  const e = manifestFor(r, files, 'snap');
  assert.deepEqual(Object.keys(e), ['model', 'lod0', 'lod1', 'sha256', 'sizeMm', 'parts', 'triangles', 'bytes', 'lod1BackOnly', 'caseType']);
  assert.equal(e.caseType, 'snap');
  assert.equal(e.lod0, '/models/snap.lod0.00000000.glb');
  const tough = manifestFor(checkPair(lod0, lod1), { ...files, lod0: 'case.lod0.x.glb', lod1: 'case.lod1.x.glb' });
  assert.equal(tough.source, 'supplier');
  assert.equal(tough.caseType, '');
  assert.equal(manifest.allCaseTypes, undefined, 'the note that one model is every case type (2026-10-16) is gone');
});
