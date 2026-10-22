// Section 4 part two, option B's travel (docs/specs/section-4-world.md 2 "Option B", 5 "Build modes"; travel-park.ts and
// park-flight.ts): the lands map onto park.json's poses by product id and a travel has a flight only between neighbouring
// poses (else the cross-fade); park-flight.ts flies park.json's flights exactly as its travel.how says; at every
// landTravelMs Tune offers, forward and back, with the lands' rest pushes, the view turns at most 90 degrees a second and
// the camera never rolls; its speed is park.json's own and the baked light's blur (AC5) follows it, none at the poses;
// the two cross-fades last 0.4 s and the ends of a travel are the lands at rest; the park is framed cover-fit as world.ts
// frames the pictures; and the park's files are imported by travel-park.ts alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from 'three';
import { ROOM_PRODUCTS } from '../../src/config/room.ts';
import { easeInOutCubic } from '../../src/scripts/hero/util/math.ts';
import { BLUR_S, PARK_FADE_S, blurAt, coverFov, createFlight, fadesAt, flown, keyAt, legOf, parkMs, posesOfLands, type ParkFlightJson, type ParkPoseJson, type ParkTravelJson } from '../../src/scripts/hero/section4/park-flight.ts';
import { landCamera } from '../../src/scripts/hero/section4/world.ts';
import PARK from '../../src/assets/room/park/park.json' with { type: 'json' };

const park = PARK as unknown as { poses: ParkPoseJson[]; flights: ParkFlightJson[]; travel: ParkTravelJson };
const V = (a: readonly number[]) => new Vector3(a[0], a[1], a[2]);
const REST_PUSH = 0.15 * 1.6;   // world.ts ENTRY.pushRest x the lands' near distance (config/room.ts LAND_COPY)
const TUNE = { min: 2600, max: 4500, step: 100 };   // Tune.astro's landTravelMs range

test('the lands map onto the poses by product id; a travel has a flight only between neighbouring poses, flown back the other way', () => {
  const all = posesOfLands(ROOM_PRODUCTS, park.poses);
  assert.deepEqual(all, [0, 1, 2, 3], 'the four products, in catalog order, are the four poses');
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(legOf(all, park.flights, i, i + 1), { flight: i, reverse: false }, `${i + 1} to ${i + 2}`);
    assert.deepEqual(legOf(all, park.flights, i + 1, i), { flight: i, reverse: true }, `${i + 2} to ${i + 1}`);
  }
  assert.equal(legOf(all, park.flights, 0, 2), null, 'no flight between lands that are not neighbours: the cross-fade');
  assert.equal(legOf(all, park.flights, 1, 1), null);
  // a land not approved (the wallet): lands 1 and 2 are the case and the Lenskin, poses 0 and 2, with no flight between
  const some = posesOfLands(ROOM_PRODUCTS.filter((p) => p.id !== 'wallet'), park.poses);
  assert.deepEqual(some, [0, 2, 3]);
  assert.equal(legOf(some, park.flights, 0, 1), null);
  assert.deepEqual(legOf(some, park.flights, 1, 2), { flight: 2, reverse: false });
  assert.equal(legOf(posesOfLands([{ id: 'nowhere' }, { id: 'case' }], park.poses), park.flights, 0, 1), null);
});

test("park-flight.ts flies park.json's travel.how exactly: from pose to pose, the path at the ease, the look at the time, the keys linear", () => {
  for (const f of park.flights) {
    const P = new CatmullRomCurve3(f.points.map(V), false, 'centripetal'), L = new CatmullRomCurve3(f.look.map(V), false, 'centripetal');
    const fl = createFlight(f), o = flown();
    for (let k = 0; k <= 40; k++) {
      const tau = k / 40;
      fl.at(tau, o);
      assert.ok(o.position.distanceTo(P.getPointAt(easeInOutCubic(tau))) < 1e-9, `position at ${tau}`);
      assert.ok(o.look.distanceTo(L.getPoint(tau)) < 1e-9, `look at ${tau}`);
      const x = tau * (f.fov.length - 1), i = Math.min(f.fov.length - 2, Math.floor(x));
      assert.ok(Math.abs(o.fov - (f.fov[i] + (f.fov[i + 1] - f.fov[i]) * (x - i))) < 1e-9, `fov at ${tau}`);
    }
    const a = park.poses[f.from], b = park.poses[f.to];
    fl.at(0, o); assert.ok(o.position.distanceTo(V(a.position)) < 1e-3 && Math.abs(o.exposure - a.exposure) < 1e-3 && Math.abs(o.sky - a.skyExposure) < 1e-3 && o.fov === a.fov, `flight ${f.from + 1} to ${f.to + 1} starts at its pose`);
    fl.at(1, o); assert.ok(o.position.distanceTo(V(b.position)) < 1e-3 && Math.abs(o.exposure - b.exposure) < 1e-3 && Math.abs(o.sky - b.skyExposure) < 1e-3 && o.fov === b.fov, `and ends at the next`);
    // the rest push: ahead along the view at either end, the view's direction untouched
    const plain = flown(), pushed = flown();
    for (const tau of [0, 0.3, 0.5, 1]) {
      fl.at(tau, plain); fl.at(tau, pushed, REST_PUSH, REST_PUSH);
      const d0 = plain.look.clone().sub(plain.position).normalize(), d1 = pushed.look.clone().sub(pushed.position).normalize();
      assert.ok(Math.abs(pushed.position.distanceTo(plain.position) - REST_PUSH) < 1e-9 && d0.angleTo(d1) < 1e-9, `pushed ${REST_PUSH} m along the view at ${tau}`);
    }
  }
  assert.equal(keyAt([2, 4, 8], 0.75), 6); assert.equal(keyAt([2, 4, 8], 1), 8); assert.equal(keyAt([5], 0.4), 5);
});

test("at every landTravelMs Tune offers, forward and back, with the rest pushes, the view turns at most 90 degrees a second and never rolls", () => {
  const cam = new PerspectiveCamera(), dir = new Vector3(), right = new Vector3(), o = flown();
  let worst = 0;
  for (const f of park.flights) {
    const fl = createFlight(f);
    for (let ms = TUNE.min; ms <= TUNE.max; ms += TUNE.step) {
      const used = parkMs(ms, park.travel), n = Math.round((used / 1000) * 60);
      for (const back of [false, true]) {
        let prev: Vector3 | null = null, peak = 0;
        for (let k = 0; k <= n; k++) {
          const p = k / n;
          fl.at(back ? 1 - p : p, o, REST_PUSH, REST_PUSH);
          cam.position.copy(o.position); cam.up.set(0, 1, 0); cam.lookAt(o.look); cam.updateMatrixWorld();
          cam.getWorldDirection(dir); right.setFromMatrixColumn(cam.matrixWorld, 0);
          assert.ok(Math.abs(right.y) < 1e-9, `flight ${f.from + 1}-${f.to + 1}${back ? ' back' : ''} at ${ms} ms: no roll at p ${p.toFixed(3)}`);
          if (prev) peak = Math.max(peak, (prev.angleTo(dir) * 180) / Math.PI * 60);
          prev = dir.clone();
        }
        worst = Math.max(worst, peak);
        assert.ok(peak <= park.travel.rateMaxDegPerS, `flight ${f.from + 1}-${f.to + 1}${back ? ' back' : ''} at ${ms} ms: ${peak.toFixed(1)} degrees a second`);
      }
    }
  }
  assert.ok(worst > 60, `the check measured something (${worst.toFixed(1)} degrees a second at worst)`);
  // the length is Tune's, held to the flights' design range
  assert.equal(parkMs(1200, park.travel), park.travel.ms); assert.equal(parkMs(3100, park.travel), 3100); assert.equal(parkMs(9000, park.travel), park.travel.msMax);
});

test("the camera's speed is park.json's own, and the baked light's blur follows it: none at either pose, the ground covered in 0.1 s at speed", () => {
  const checks = (PARK as unknown as { checks: { flights: { from: number; peakSpeedMps: number }[] } }).checks.flights;
  assert.equal(BLUR_S, 0.1);
  for (const f of park.flights) {
    const fl = createFlight(f), want = checks.find((c) => c.from === f.from)!.peakSpeedMps;
    let peak = 0;
    for (let k = 0; k <= 400; k++) peak = Math.max(peak, fl.speed(k / 400, park.travel.ms));
    assert.ok(Math.abs(peak - want) / want < 0.03, `flight ${f.from + 1} to ${f.to + 1}: peak ${peak.toFixed(1)} m/s, park.json ${want}`);
    for (const tau of [0, 1]) assert.ok(blurAt(fl.speed(tau, park.travel.ms)) < 0.05, `flight ${f.from + 1}: the pose at ${tau} is drawn as baked`);
    assert.ok(Math.abs(fl.speed(0.5, park.travel.msMax) / fl.speed(0.5, park.travel.ms) - park.travel.ms / park.travel.msMax) < 1e-6, 'a longer travel is slower in proportion');
  }
  assert.equal(blurAt(-3), 0); assert.ok(Math.abs(blurAt(70) - 7) < 1e-9);
});

test('the cross-fades: 0.4 s each; the travel starts on the departing land at rest and ends on the arriving one', () => {
  for (const ms of [TUNE.min, 3000, TUNE.max]) {
    const f = (PARK_FADE_S * 1000) / ms;
    assert.deepEqual(fadesAt(0, ms), [1, 0], `${ms}: p 0 is the departing land whole`);
    assert.deepEqual(fadesAt(1, ms), [0, 1], `${ms}: p 1 is the arriving land whole`);
    assert.deepEqual(fadesAt(f, ms), [0, 0], `${ms}: the departing picture gone at 0.4 s`);
    assert.deepEqual(fadesAt(1 - f, ms), [0, 0], `${ms}: the arriving one starts 0.4 s before the end`);
    assert.deepEqual(fadesAt(0.5, ms), [0, 0], `${ms}: half way is the park alone`);
    const [a] = fadesAt(f / 2, ms), [, b] = fadesAt(1 - f / 2, ms);
    assert.ok(Math.abs(a - 0.5) < 1e-9 && Math.abs(b - 0.5) < 1e-9, `${ms}: half faded half way through each fade`);
    // monotonic, with no jolt at either end (smoothstep: the slope is 0 there)
    let last = 1;
    for (let k = 0; k <= 100; k++) { const [x] = fadesAt((k / 100) * f, ms); assert.ok(x <= last + 1e-12); last = x; }
    assert.ok(1 - fadesAt(f * 0.01, ms)[0] < 1e-3 && fadesAt(1 - f * 0.01, ms)[1] > 1 - 1e-3);
  }
});

test("the park is framed cover-fit as world.ts frames the pictures: the same vertical FOV on a phone, a laptop and a landscape phone", () => {
  const c = new PerspectiveCamera();
  for (const [pic, aspect] of [[720 / 1280, 390 / 844], [1920 / 1200, 1280 / 800], [1920 / 1200, 844 / 390], [720 / 1280, 1280 / 800], [1920 / 1200, 360 / 780]] as const) {
    for (const fov of [32, 34]) {
      landCamera(c, { fov, aspect: pic }, aspect, 0);
      assert.ok(Math.abs(coverFov(fov, pic, aspect) - c.fov) < 1e-9, `picture ${pic.toFixed(3)} on a frame ${aspect.toFixed(3)} at ${fov} degrees`);
    }
  }
});

test("the park's files are imported by travel-park.ts alone (travel-stub.ts's second rule); its decoder is the vendored pure-JS one; its materials write display values", () => {
  const root = new URL('../../', import.meta.url).pathname, src = join(root, 'src');
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  // an import of a park file in any form: a static import, an import(), or a glob that names the folder
  const reach = /(?:from\s*|import\s*\(\s*|import\.meta\.glob\w*\s*\(\s*\[?\s*)['"`][^'"`]*assets\/room\/park\b/;
  const importers = walk(src).filter((p) => /\.(?:ts|js|mjs|astro)$/.test(p) && reach.test(readFileSync(p, 'utf8'))).map((p) => relative(root, p));
  assert.deepEqual(importers, ['src/scripts/hero/section4/travel-park.ts']);
  const code = readFileSync(join(src, 'scripts/hero/section4/travel-park.ts'), 'utf8');
  for (const f of ['park.glb?url', 'park-lightmap.avif?url', 'park-lightmap.webp?url', 'park.json']) assert.ok(code.includes(`assets/room/park/${f}`), f);
  assert.ok(code.includes("from '../../family/three/vendor/meshopt-decoder-reference.js'"), 'the vendored decoder');
  assert.ok(!/meshopt_decoder|libs\/meshopt/.test(code), "never three's WebAssembly decoder");
  assert.ok(/gl_FragColor = vec4\(toSrgb\(/.test(code), 'display values, by hand');
  // only import() reaches a travel module (travel-stub.ts's first rule): nothing in src/ names travel-park statically
  const statics = walk(src).filter((p) => /\.(?:ts|js|astro)$/.test(p) && /^\s*import\s+(?!type\b)[^;]*from\s*['"][^'"]*travel-park/m.test(readFileSync(p, 'utf8')));
  assert.deepEqual(statics, []);
});
