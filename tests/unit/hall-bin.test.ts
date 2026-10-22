// The hall's model as shipped (docs/specs/section-4-world.md 6; scripts/room/hall-bin.mjs): src/assets/room/hall.bin is
// hall-bin.mjs's output from hall.glb byte for byte (so a re-export of the hall cannot leave a stale binary), the island's
// parser reads back every part hall.ts names with the GLB's own triangles, normals and lightmap UVs, and no section 4
// module imports a glTF loader (the director's chunk ships without one; option B's own chunk may).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { HALL_PARTS, hallBin } from '../../scripts/room/hall-bin.mjs';
import { parseHallBin } from '../../src/scripts/hero/section4/assets.ts';

const root = new URL('../../', import.meta.url);
const glb = readFileSync(new URL('src/assets/room/hall.glb', root)), bin = readFileSync(new URL('src/assets/room/hall.bin', root));
const ab = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) as ArrayBuffer;

/** the GLB's nodes as triangles of [x, y, z, nx, ny, nz, u, v], per node name */
function glbTriangles(): Map<string, number[][]> {
  const jlen = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jlen).toString('utf8')), data = glb.subarray(28 + jlen);
  const acc = (i: number) => {
    const a = json.accessors[i], v = json.bufferViews[a.bufferView], n = ({ SCALAR: 1, VEC2: 2, VEC3: 3 } as Record<string, number>)[a.type], f = a.componentType === 5126;
    const off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    return Array.from({ length: a.count * n }, (_, k) => (f ? data.readFloatLE(off + k * 4) : data.readUInt16LE(off + k * 2)));
  };
  const out = new Map<string, number[][]>();
  for (const node of json.nodes) {
    const p = json.meshes[node.mesh].primitives[0], pos = acc(p.attributes.POSITION), nrm = acc(p.attributes.NORMAL), uv = p.attributes.TEXCOORD_0 === undefined ? null : acc(p.attributes.TEXCOORD_0);
    const tris = acc(p.indices).map((k) => [...pos.slice(k * 3, k * 3 + 3), ...nrm.slice(k * 3, k * 3 + 3), ...(uv ? uv.slice(k * 2, k * 2 + 2) : [0, 0])]);
    out.set(node.name, tris);
  }
  return out;
}

test('hall.bin is hall-bin.mjs output from hall.glb, byte for byte, and less than half its size', () => {
  assert.ok(hallBin(glb).equals(bin), 'src/assets/room/hall.bin is stale: run node scripts/room/hall-bin.mjs');
  assert.ok(bin.length < glb.length / 2, `${bin.length} B against the GLB's ${glb.length} B`);
});

test('parseHallBin reads every part hall.ts names, with the GLB triangles, normals and lightmap UVs of its nodes', () => {
  const parts = parseHallBin(ab(bin)), want = glbTriangles();
  assert.deepEqual(parts.map((p) => p.name), HALL_PARTS.map(([n]) => n));
  for (const [name, re] of HALL_PARTS) {
    const p = parts.find((x) => x.name === name)!;
    assert.equal(p.uv !== null, name === 'hall', `${name}: the shell alone carries the lightmap's UVs`);
    const got = Array.from(p.index, (k) => [...p.position.slice(k * 3, k * 3 + 3), ...Array.from(p.normal.slice(k * 3, k * 3 + 3), (v) => v / 127), ...(p.uv ? p.uv.slice(k * 2, k * 2 + 2) : [0, 0])]);
    const ref = [...want].filter(([n]) => (re as RegExp).test(n)).flatMap(([, t]) => t);
    assert.equal(got.length, ref.length, `${name}: the corner count`);
    got.forEach((c, k) => c.forEach((v, j) => assert.ok(Math.abs(v - ref[k][j]) < 1e-6, `${name} corner ${k} value ${j}: ${v} against ${ref[k][j]}`)));
  }
  assert.throws(() => parseHallBin(new ArrayBuffer(64)), /not hall\.bin/);
});

test('no section 4 module imports a glTF loader: the hall reads hall.bin', () => {
  const dir = new URL('src/scripts/hero/section4/', root);
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts') && n !== 'travel-park.ts')) assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /from '[^']*loaders\/GLTFLoader|\.glb\?url'/, f);
  assert.match(readFileSync(new URL('hall.ts', dir), 'utf8'), /import hallUrl from '\.\.\/\.\.\/\.\.\/assets\/room\/hall\.bin\?url';/);
});
