// Section 4 part two, option B's park (docs/specs/section-4-world.md 2 "Option B", 3 "Option B's park", 6; scripts/room/park.py
// and pack.mjs park): the shipped files are under their lines and decode through three's GLTFLoader with the vendored
// pure-JS meshopt decoder; the four poses are the products' in catalog order, each with its FOV and near distance (option
// A's too: they live in park.json until ROOM_LANDS exists in config/room.ts, and are pinned equal to it once it does); the
// flights, flown here with three's own curves and the site's easeInOutCubic exactly as park.json says travel-park.ts flies
// them, never turn the view faster than 90 degrees a second at 2600 ms and never roll; the exposures and their keys are
// whole; and the trees are at most four species.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { CatmullRomCurve3, Vector3, type Mesh, type InstancedMesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../src/scripts/family/three/vendor/meshopt-decoder-reference.js';
import * as ROOM from '../../src/config/room.ts';
import { easeInOutCubic } from '../../src/scripts/hero/util/math.ts';
import PARK from '../../src/assets/room/park/park.json' with { type: 'json' };

type V3 = [number, number, number];
type Pose = { id: string; position: V3; target: V3; fov: number; near: number; exposure: number; skyExposure: number };
type Flight = { from: number; to: number; points: V3[]; look: V3[]; exposure: number[]; skyExposure: number[]; fov: number[] };
const park = PARK as unknown as { poses: Pose[]; flights: Flight[]; travel: { ms: number; msMax: number; ease: string; keys: number; rateMaxDegPerS: number }; checks: { pass: boolean }; glb: { draws: number; trianglesDrawn: number } };
const asset = (n: string) => new URL(`../../src/assets/room/park/${n}`, import.meta.url);
const V = (a: V3) => new Vector3(...a);

test('the files are under their lines (section 6) and park.py\'s checks passed', () => {
  assert.ok(statSync(asset('park.glb')).size <= 300 * 1024, 'park.glb');
  assert.ok(statSync(asset('park-lightmap.avif')).size <= 120 * 1024, 'the AVIF lightmap');
  assert.ok(statSync(asset('park-lightmap.webp')).size <= 190 * 1024, 'the WebP lightmap');
  assert.ok(park.glb.draws <= 40 && park.glb.trianglesDrawn <= 33000, `${park.glb.draws} draws, ${park.glb.trianglesDrawn} triangles`);
  assert.equal(park.checks.pass, true);
});

test('it decodes to the draws park.json names, with at most four tree species (section 3: three or four)', async () => {
  await MeshoptDecoder.ready;
  const buf = readFileSync(asset('park.glb'));
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length), '');
  let draws = 0, tris = 0; const lights = new Set<string>(), protos: string[] = [];
  gltf.scene.traverse((o) => {
    const m = o as Mesh; if (!m.isMesh) return;
    draws++; tris += ((m.geometry.index?.count ?? 0) / 3) * ((o as InstancedMesh).isInstancedMesh ? (o as InstancedMesh).count : 1);
    const light = (m.material as { userData: { light?: string } }).userData.light ?? ''; lights.add(light);
    if ((o as InstancedMesh).isInstancedMesh) protos.push(m.name);
  });
  assert.equal(draws, park.glb.draws); assert.equal(tris, park.glb.trianglesDrawn);
  assert.deepEqual([...lights].sort(), ['baked', 'lightmap', 'unlit']);
  const species = new Set(protos.filter((n) => !['bench', 'lamp'].includes(n)).map((n) => n.replace(/[A-Z]$/, '')));
  assert.ok(species.size <= 4, `tree species: ${[...species].join(', ')}`);
});

test('the poses are the products\' in catalog order, each with its FOV and near distance (option A\'s too)', () => {
  assert.deepEqual(park.poses.map((p) => p.id), ROOM.ROOM_PRODUCTS.map((p) => p.id));
  for (const p of park.poses) {
    assert.ok(p.fov >= 20 && p.fov <= 60 && p.near > 0, p.id);
    assert.ok(new Vector3(...p.target).distanceTo(new Vector3(...p.position)) > 0.5, `${p.id}: the pose looks somewhere`);
  }
  // the integrator moves fov and near into config (section 2, "Each land carries a vertical FOV and a near distance in
  // config, shared with B"); until then they live here, and once ROOM_LANDS exists the two must agree
  const lands = (ROOM as Record<string, unknown>).ROOM_LANDS as { id: string; fov: number; near: number }[] | undefined;
  if (lands) for (const l of lands) {
    const p = park.poses.find((q) => q.id === l.id);
    if (p) { assert.equal(l.fov, p.fov, `${l.id}: fov`); assert.equal(l.near, p.near, `${l.id}: near`); }
  }
});

test('each flight, flown as park.json says, turns the view at most 90 degrees a second at 2600 ms and never rolls', () => {
  assert.equal(park.travel.ease, 'easeInOutCubic'); assert.equal(park.travel.ms, 2600); assert.equal(park.travel.rateMaxDegPerS, 90);
  for (const f of park.flights) {
    assert.equal(f.look.length, park.travel.keys); assert.equal(f.exposure.length, park.travel.keys);
    assert.equal(f.skyExposure.length, park.travel.keys); assert.equal(f.fov.length, park.travel.keys);
    const P = new CatmullRomCurve3(f.points.map(V), false, 'centripetal'), L = new CatmullRomCurve3(f.look.map(V), false, 'centripetal');
    assert.ok(P.getPointAt(0).distanceTo(V(park.poses[f.from].position)) < 1e-3 && P.getPointAt(1).distanceTo(V(park.poses[f.to].position)) < 1e-3, 'it flies from pose to pose');
    for (const ms of [park.travel.ms, park.travel.msMax]) {
      const n = Math.round((ms / 1000) * 60); let prev: Vector3 | null = null, peak = 0;
      for (let k = 0; k <= n; k++) {
        const tau = k / n, p = P.getPointAt(easeInOutCubic(tau)), d = L.getPoint(tau).sub(p).normalize();
        assert.ok(Math.abs(d.y) < Math.sin((60 * Math.PI) / 180), 'lookAt stays well off the vertical, so the camera never rolls');
        if (prev) peak = Math.max(peak, (Math.acos(Math.min(1, d.dot(prev))) * 180) / Math.PI * 60);
        prev = d;
      }
      assert.ok(peak <= park.travel.rateMaxDegPerS * (park.travel.ms / ms), `flight ${f.from + 1} to ${f.to + 1} at ${ms} ms: ${peak.toFixed(1)} degrees a second`);
    }
  }
});

test('the exposures: each pose\'s and each key\'s within bounds, the sky\'s never above the scene\'s, the keys meeting the poses', () => {
  for (const p of park.poses) assert.ok(p.exposure >= 0.8 && p.exposure <= 2.4 && p.skyExposure > 0 && p.skyExposure <= p.exposure + 1e-9, p.id);
  for (const f of park.flights) {
    const a = park.poses[f.from], b = park.poses[f.to];
    assert.ok(Math.abs(f.exposure[0] - a.exposure) < 1e-3 && Math.abs(f.exposure.at(-1)! - b.exposure) < 1e-3, 'the scene\'s keys end at the poses\'');
    assert.ok(Math.abs(f.skyExposure[0] - a.skyExposure) < 1e-3 && Math.abs(f.skyExposure.at(-1)! - b.skyExposure) < 1e-3, 'the sky\'s keys end at the poses\'');
    f.exposure.forEach((e, k) => assert.ok(e >= 0.8 && e <= 2.4 && f.skyExposure[k] <= e + 1e-3, `key ${k}`));
  }
});
