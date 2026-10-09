// T1 to T3 (case-model-class.md 14), in Node without WebGL: normalisation as a matrix on fixtures in m, mm, cm, inch and
// Z-up; part identification; the colour pipeline; and the stand-in's shape, parts and triangle counts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Box3, BoxGeometry, Color, ColorManagement, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Texture, Vector3, type BufferGeometry } from 'three';
import { normaliseParts, findParts, CONTRACT_PARTS, type RawPart } from '../../src/scripts/family/three/case-asset.ts';
import { buildStandInAsset } from '../../src/scripts/family/three/stand-in-case.ts';

// a case-shaped fixture: a body box and a camera ring box proud of the back (+Z), at a given unit scale
function fixture(unit: number, zUp = false): RawPart[] {
  const body = new BoxGeometry(0.077, 0.163, 0.0123);
  const ring = new BoxGeometry(0.044, 0.044, 0.0012).translate(-0.016, 0.0525, 0.0068);   // proud of the back by 1.3 mm
  const node = new Matrix4().makeScale(unit, unit, unit).premultiply(new Matrix4().makeTranslation(5 * unit, -2 * unit, 1 * unit));
  if (zUp) node.premultiply(new Matrix4().makeRotationX(Math.PI / 2));   // long axis to +Z, back to -Y
  return [
    { name: 'body', geometry: body, nodeWorld: node.clone(), followsShade: true },
    { name: 'accent', geometry: ring, nodeWorld: node.clone(), followsShade: false },
  ];
}
function normalisedBox(parts: ReturnType<typeof normaliseParts>['parts']) {
  const b = new Box3(), t = new Box3();
  for (const p of parts) { (p.geometry as BufferGeometry).computeBoundingBox(); t.copy(p.geometry.boundingBox!).applyMatrix4(p.base); b.union(t); }
  return b;
}

test('T1: height 1, centre at the origin and the camera side on +Z for m, mm, cm, inch and Z-up fixtures', () => {
  const cases: [string, number, boolean, Quaternion | undefined][] = [
    ['metres', 1, false, undefined], ['millimetres', 1000, false, undefined], ['centimetres', 100, false, undefined],
    ['inches', 1 / 0.0254, false, undefined], ['Z-up', 1, true, new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)],
  ];
  for (const [name, unit, zUp, orient] of cases) {
    const n = normaliseParts(fixture(unit, zUp), orient);
    const b = normalisedBox(n.parts);
    const size = b.getSize(new Vector3()), c = b.getCenter(new Vector3());
    assert.ok(Math.abs(size.y - 1) < 1e-6, `${name}: height ${size.y}`);
    assert.ok(c.length() < 1e-6, `${name}: centre ${c.toArray()}`);
    assert.ok(Math.abs(n.dims.w - 0.077 / 0.163) < 1e-6 && Math.abs(n.dims.d - (0.0123 / 2 + 0.0068 + 0.0006) / 0.163) < 1e-6, `${name}: dims ${JSON.stringify(n.dims)}`);
    const ring = n.parts[1];
    ring.geometry.computeBoundingBox();
    const rb = ring.geometry.boundingBox!.clone().applyMatrix4(ring.base);
    assert.ok(rb.getCenter(new Vector3()).z > 0, `${name}: the camera ring is on +Z`);
    // the geometry itself is never rewritten
    assert.equal(fixture(unit, zUp)[0].geometry.getAttribute('position').getX(0), n.parts[0].geometry.getAttribute('position').getX(0));
  }
});

test('T2: parts from the manifest names; development fallback picks the largest untextured mesh; a baked body throws', () => {
  const root = new Group();
  const body = new Mesh(new BoxGeometry(77, 163, 12), new MeshStandardMaterial({ name: 'Shade', color: 0xffffff }));
  body.name = 'Case_Body';
  const acc = new Mesh(new BoxGeometry(44, 44, 1), new MeshStandardMaterial({ name: 'Accent', color: 0x383f43 }));
  acc.name = 'Case_Accent';
  root.add(body, acc);
  const parts = findParts(root, CONTRACT_PARTS);
  assert.deepEqual(parts.map((p) => p.name), ['body', 'accent']);
  assert.equal(parts[0].geometry, body.geometry);
  body.name = ''; acc.name = '';
  const warnings: string[] = [];
  const dev = findParts(root, undefined, (m) => warnings.push(m));
  assert.equal(dev[0].geometry, body.geometry);
  assert.match(warnings[0], /largest untextured surface/);
  (body.material as MeshStandardMaterial).map = new Texture();
  assert.throws(() => findParts(root, CONTRACT_PARTS), /base colour texture/);
  (body.material as MeshStandardMaterial).map = null;
  (body.material as MeshStandardMaterial).color.set(0xff0000);
  assert.throws(() => findParts(root, CONTRACT_PARTS), /base colour other than white/);
});

test('T3: one sRGB to linear conversion: #ffffff is 1, #0040c1 follows the transfer function, no second conversion in the code', () => {
  assert.equal(ColorManagement.enabled, true);
  const w = new Color().setStyle('#ffffff');
  assert.deepEqual([w.r, w.g, w.b], [1, 1, 1]);
  const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const b = new Color().setStyle('#0040c1');
  for (const [got, want] of [[b.r, lin(0)], [b.g, lin(0x40)], [b.b, lin(0xc1)]]) assert.ok(Math.abs(got - want) < 1e-6, `${got} vs ${want}`);
  const dir = new URL('../../src/scripts/family/three/', import.meta.url);
  for (const f of readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name)) assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /convertSRGBToLinear|SRGBToLinear\(/, f);
});

test('the stand-in: body and accent only, contract size, both LODs normalised alike, triangle counts', () => {
  const t0 = performance.now();
  const a = buildStandInAsset();
  const ms = performance.now() - t0;
  assert.equal(a.source, 'standin');
  assert.deepEqual(a.lods.map((l) => l.map((p) => p.name)), [['body', 'accent'], ['body', 'accent']]);
  assert.ok(Math.abs(a.sizeMm[0] - 77) < 0.01 && Math.abs(a.sizeMm[1] - 163) < 0.01, `size ${a.sizeMm}`);
  assert.ok(a.sizeMm[2] > 11 && a.sizeMm[2] < 13.5, `thickness ${a.sizeMm[2]}`);
  assert.ok(Math.abs(a.dims.w - 77 / 163) < 1e-4);
  assert.ok(a.lods[0][0].base.equals(a.lods[1][0].base), 'one normalisation for both LODs');
  const tris = (g: BufferGeometry) => (g.index ? g.index.count : g.getAttribute('position').count) / 3;
  const t = a.lods.map((l) => l.reduce((s, p) => s + tris(p.geometry), 0));
  assert.ok(t[0] > t[1], `LOD0 ${t[0]} > LOD1 ${t[1]}`);
  assert.ok(t[1] >= 1500 && t[1] <= 3800, `LOD1 ${t[1]} triangles (contract 2,500 to 3,800 for the real model)`);
  for (const l of a.lods) for (const p of l) { assert.ok(p.geometry.getAttribute('normal')); assert.equal(p.geometry.getAttribute('uv'), undefined); assert.equal(p.geometry.getAttribute('color'), undefined); }
  console.log(`stand-in: LOD0 ${t[0]} triangles, LOD1 ${t[1]}, built in ${ms.toFixed(0)} ms, dims ${JSON.stringify(a.dims)}`);
  a.dispose();
});
