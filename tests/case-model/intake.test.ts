// The intake of the case models (case-model-class.md 3, 15 and amendment 1; T16's build half; family-page.md 21 D1): the
// shipped files of both models pass every contract check and match the manifest; files that need WebAssembly, embed
// images, carry a device or bake a colour into the body fail; the vendored decoder is the pinned, WebAssembly-free
// reference decoder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkLod, checkPair, readGlb } from '../../scripts/case-model/intake.mjs';

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
  const listed = [manifest.lod0, manifest.lod1, ...(manifest.magtough ? [manifest.magtough.lod0, manifest.magtough.lod1] : [])];
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

test('no second model: one model is every case type (Sam, 2026-10-16), so the manifest carries no magtough entry and no stand-in path', () => {
  assert.equal(manifest.magtough, undefined);
  assert.equal(manifest.source, 'supplier');
});
