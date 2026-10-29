// Section 5, the sign-up (docs/specs/section-5.md 7; docs/specs/section-5-sand.md 8: AC3, AC8, AC10, AC11, AC12): the
// config (the three follows, their worth, families and family names, the addresses on record, the sixteen still keys,
// the descriptions, the copy's brand rules with the discount words kept out), the jar bin byte for byte against the
// packer with its manifest and read back by the island's parser, the maths (the placement with the tilt, the sand body
// inside the bin's interior, the seeds, the fall, the schedule with its extension and queue, the ramp, the heap, the
// layers, the cells, the buffers above the chained bounds), the shaders' rules (no POUR or JAR literal, every uniform in
// its object, the glass byte for byte, every varying assigned on the culled path, the points' draw range), the section
// as plain text (signup.css and Signup.astro: no fill, no border but the field's line and the focus ring, no shadow, no
// radius, the quiz's type, the one-column grid and the laptop's areas), the markup, the wiring and the stills' files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { FOLLOW_COUNT, SIGNUP_COPY, SIGNUP_CREDIT, SIGNUP_FOLLOWS, SIGNUP_JARS, SIGNUP_KEYS, SIGNUP_LEAD_ENDPOINT, WORTH_TOTAL, fill, followWord, jarLevel, levelWord, stillAlt, stillKey, yoursLevel, yoursState } from '../../src/config/signup.ts';
import { beadColours } from '../../src/config/signup-colours.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { DPR_CAP } from '../../src/config/hero.ts';
import { DUST, JAR, POUR, cells, conePeak, extendPour, fallTime, grainOwner, grainSeeds, grainY, halfHeight, layerOwner, layerTops, levelY, moundAt, placeJar, pourLevel, pourSchedule, profileR, ramp, restMound, sandBody, seeded, tiltFactor } from '../../src/scripts/hero/section5/jars-math.ts';
import { parseProductsBin } from '../../src/scripts/hero/section4/products-bin.ts';
import { BIN_PATH, CREDIT, GLB_PATH, LINE_KB, MANIFEST_PATH, jarBin } from '../../scripts/signup/jar-bin.mjs';
import MANIFEST from '../../src/data/signup-jar-bin.json' with { type: 'json' };

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const css = read('src/styles/signup.css'), astro = read('src/components/signup/Signup.astro'), config = read('src/config/signup.ts');
const chunk = read('src/scripts/hero/section5/jars.ts'), dom = read('src/scripts/signup/signup.ts');
const allStrings = (): string[] => Object.values(SIGNUP_COPY);
/** every order the follows can come in: 16 */
const ORDERS: string[][] = (() => {
  const ids = SIGNUP_FOLLOWS.map((f) => f.id), out: string[][] = [[]];
  const grow = (prefix: string[]) => { for (const id of ids) if (!prefix.includes(id)) { const next = [...prefix, id]; out.push(next); grow(next); } };
  grow([]);
  return out;
})();
/** a GLSL string of jars.ts by its const name (the template has no substitutions) */
const glsl = (name: string): string => { const head = `const ${name} = /* glsl */\``, at = chunk.indexOf(head); assert.ok(at >= 0, `${name} in jars.ts`); const s = at + head.length; return chunk.slice(s, chunk.indexOf('`', s)); };
const SHADERS = ['SAND_VERT', 'SAND_FRAG', 'POUR_VERT', 'POUR_FRAG'];

test('the follows (section-5-sand.md 3): Sam\'s order, the worth a quarter, a quarter, a half, the families with 24 catalog shades each and their site names, the addresses on record, no fourth row', () => {
  assert.deepEqual(SIGNUP_JARS.map((j) => j.id), ['facebook', 'youtube', 'instagram']);
  assert.deepEqual(SIGNUP_FOLLOWS, SIGNUP_JARS, 'the follows are the three rows');
  assert.equal(FOLLOW_COUNT, 3); assert.equal(WORTH_TOTAL, 4);
  assert.deepEqual(SIGNUP_FOLLOWS.map(jarLevel), [0.25, 0.25, 0.5]);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.families), [['blissful-blue'], ['roaring-red'], ['playful-pink', 'vivid-violet']]);
  // the family names are the catalog's site names in the singular (CLAUDE.md), pinned to the family ids
  const siteName: Record<string, string> = { 'blissful-blue': 'Blissful Blue', 'roaring-red': 'Roaring Red', 'playful-pink': 'Playful Pink', 'vivid-violet': 'Vivid Violet' };
  for (const j of SIGNUP_FOLLOWS) {
    assert.equal(j.familyNames, j.families.map((f) => siteName[f]).join(' and '), `${j.id}: the families' site names`);
    assert.match(j.url, /^https:\/\//, `${j.id}: plain https, never an app scheme (B3)`);
    assert.doesNotMatch(j.url, /instagram:\/\/|fb:\/\/|youtube:\/\//);
    for (const f of j.families) assert.equal(SHADES.filter((s) => s.family === f).length, 24, `${f}: a catalog family`);
  }
  assert.match(config, /read from the\s+\* footer of https:\/\/www\.skreed\.com\/ on 2026-10-26/);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.url), ['https://facebook.com/skreedofficial', 'https://www.youtube.com/@skreedofficial', 'https://www.instagram.com/skreedofficial/']);
  assert.deepEqual([beadColours(['blissful-blue']).length, beadColours(['playful-pink', 'vivid-violet']).length], [24, 48]);
  for (const j of SIGNUP_FOLLOWS) for (const hex of beadColours(j.families)) assert.ok(SHADES.some((s) => s.hex === hex && j.families.includes(s.family)), `${hex}: a catalog hex of ${j.id}'s family (A2)`);
  // the shade table stays out of the client chunks (section-5.md 6): the hexes are joined at build and ride each link's markup
  assert.doesNotMatch(config, /shades\.gen/, 'config/signup.ts imports no shade table');
  assert.doesNotMatch(chunk, /shades\.gen|signup-colours/, 'nor the jar chunk');
  assert.doesNotMatch(dom, /shades\.gen|signup-colours/, 'nor the DOM script');
  assert.match(astro, /import \{ beadColours \} from '\.\.\/\.\.\/config\/signup-colours\.ts';/);
  assert.equal(followWord(SIGNUP_FOLLOWS[0]), 'Follow on Facebook'); assert.equal(followWord(SIGNUP_FOLLOWS[1]), 'Subscribe on YouTube'); assert.equal(followWord(SIGNUP_FOLLOWS[2]), 'Follow on Instagram');
  assert.deepEqual([yoursLevel([]), yoursLevel(['instagram']), yoursLevel(['facebook', 'youtube']), yoursLevel(['facebook', 'youtube', 'instagram']), yoursLevel(['instagram', 'instagram'])], [0, 0.5, 0.5, 1, 1]);
  assert.deepEqual([yoursState(0), yoursState(1), yoursState(2), yoursState(3)], ['Nothing collected yet', '1 of 3 collected', '2 of 3 collected', 'Full']);
  assert.equal(SIGNUP_LEAD_ENDPOINT, '/api/signup');
  assert.deepEqual({ ...SIGNUP_KEYS }, { follows: 'skreed:signup-follows', queue: 'skreed:signup-queue' });
  assert.equal(fill(SIGNUP_COPY.live, { platform: 'Instagram', n: 1, N: 3 }), 'Instagram collected. Your jar: 1 of 3.');
  assert.equal(fill(SIGNUP_COPY.done, { email: 'a@b.co' }), 'Done. Your colours are saved to a@b.co.');
  // gone with the four jars: the fill's length, the four alt strings and the 'yours' row
  assert.doesNotMatch(config, /FILL_MS|pellets\.|'yours'|yours:/);
  assert.ok(!('alt' in SIGNUP_JARS[0]));
});

test('the still keys and the descriptions (section-5-sand.md 3): sixteen keys, one per order, and one sentence each from the layers in press order', () => {
  assert.equal(ORDERS.length, 16);
  const keys = ORDERS.map(stillKey);
  assert.equal(new Set(keys).size, 16, 'every order its own key');
  assert.deepEqual(keys.sort(), ['0', 'f', 'fi', 'fiy', 'fy', 'fyi', 'i', 'if', 'ify', 'iy', 'iyf', 'y', 'yf', 'yfi', 'yi', 'yif'].sort());
  assert.equal(stillKey([]), '0'); assert.equal(stillKey(['instagram', 'facebook']), 'if'); assert.equal(stillKey(['nobody', 'youtube']), 'y');
  assert.equal(stillAlt([]), 'An empty glass jar.');
  assert.equal(stillAlt(['facebook']), 'A glass jar a quarter full of sand, from the bottom: Blissful Blue.');
  assert.equal(stillAlt(['instagram', 'facebook']), 'A glass jar three quarters full of sand, from the bottom: Playful Pink and Vivid Violet, then Blissful Blue.');
  assert.equal(stillAlt(['facebook', 'youtube', 'instagram']), 'A glass jar full of sand, from the bottom: Blissful Blue, then Roaring Red, then Playful Pink and Vivid Violet.');
  assert.equal(stillAlt(['facebook', 'youtube']), 'A glass jar half full of sand, from the bottom: Blissful Blue, then Roaring Red.');
  assert.deepEqual([levelWord(0.25), levelWord(0.5), levelWord(0.75), levelWord(1)], ['a quarter full', 'half full', 'three quarters full', 'full']);
  for (const o of ORDERS) { const d = stillAlt(o); assert.match(d, /^[A-Z][^.]+\.$/, `one sentence: ${d}`); assert.equal((d.match(/\bsand\b/g) ?? []).length, o.length ? 1 : 0); }
  assert.equal(SIGNUP_COPY.followsAria, 'The three follows that fill your jar');
  assert.equal(SIGNUP_COPY.jarAria, 'Your jar');
  assert.doesNotMatch(astro, />\{C\.jarAria\}</, '"Your jar" is printed nowhere (the slot\'s name alone)');
  assert.doesNotMatch(astro, /su-word/);
});

test('copy (A4, section-5-sand.md 3 and AC10): sentence case, no em or en dash, no emoji, no buzzwords, and none of the picture\'s discount or verification words, the descriptions included', () => {
  const strings = [...allStrings(), ...ORDERS.map(stillAlt), ...SIGNUP_FOLLOWS.map((j) => j.familyNames)];
  for (const s of strings) {
    assert.doesNotMatch(s, /[–—]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|elevate|unleash|next-level|revolutionary)\b/i, s);
    assert.doesNotMatch(s, /\b(discount|discounts|off|save up|code|codes|free|price|savings|verify|verified|verifies)\b|%/i, `a discount, price or verification word: ${s}`);
    assert.doesNotMatch(s, /\bpssst\b/i, s);
    assert.doesNotMatch(s, /\bcolor\b/i, `colour with a u: ${s}`);
  }
  for (const h of [SIGNUP_COPY.h, SIGNUP_COPY.got, SIGNUP_COPY.jars]) { assert.notEqual(h, h.toUpperCase(), `all caps: ${h}`); assert.equal(h[0], h[0].toUpperCase(), h); }
  assert.doesNotMatch(SIGNUP_COPY.h, /\d/);
  assert.equal(SIGNUP_COPY.h, 'You’ve made it this far.');
  assert.equal(SIGNUP_COPY.got, 'Got your colours?');
  assert.equal(SIGNUP_COPY.jars, 'Every follow fills the jar');
  assert.equal(SIGNUP_COPY.send, 'Save my colours'); assert.equal(SIGNUP_COPY.keep, 'Keep following to keep your colours.');
});

test('the jar bin (section-5.md 3, "The jar"): the committed bin and its manifest are the packer\'s output from the GLB byte for byte, the parser reads the jar back 1 m tall and centred, under the 20 KB line', () => {
  const glb = readFileSync(new URL(GLB_PATH, root));
  const { bin, manifest } = jarBin(glb);
  const committed = readFileSync(new URL(BIN_PATH, root));
  assert.ok(bin.equals(committed), 'src/assets/signup/jar.bin is the packer\'s output (run node scripts/signup/jar-bin.mjs)');
  assert.deepEqual(MANIFEST, JSON.parse(JSON.stringify(manifest)), `${MANIFEST_PATH} is the packer's manifest`);
  assert.equal(MANIFEST.bin.sha256, createHash('sha256').update(committed).digest('hex'));
  assert.equal(MANIFEST.jar.sha256, createHash('sha256').update(glb).digest('hex'));
  assert.ok(committed.length <= LINE_KB * 1024, `under ${LINE_KB} KB`);
  const [jar] = parseProductsBin(committed.buffer.slice(committed.byteOffset, committed.byteOffset + committed.length));
  assert.equal(jar.name, 'jar'); assert.equal(jar.parts.length, 1); assert.equal(jar.parts[0].name, 'jar');
  const g = jar.parts[0].geometry, pos = g.getAttribute('position'), nrm = g.getAttribute('normal');
  assert.equal(pos.count, 1024); assert.equal(g.getIndex()!.count / 3, 1340);
  assert.ok(Math.abs(jar.size[1] - 1) < 1e-6, 'the jar is 1 m tall');
  assert.ok(Math.abs(jar.size[0] - JAR.width) < 1e-4 && Math.abs(jar.size[2] - JAR.width) < 1e-4, 'its width as jars-math.ts has it');
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.count; i++) for (let c = 0; c < 3; c++) { const v = pos.array[i * 3 + c]; min[c] = Math.min(min[c], v); max[c] = Math.max(max[c], v); }
  for (let c = 0; c < 3; c++) assert.ok(Math.abs(min[c] + max[c]) < 1e-4, `centred on axis ${c}`);
  for (let i = 0; i < nrm.count; i++) { const l = Math.hypot(nrm.array[i * 3], nrm.array[i * 3 + 1], nrm.array[i * 3 + 2]); assert.ok(Math.abs(l - 1) < 0.01, `normal ${i}`); }
  assert.deepEqual({ ...SIGNUP_CREDIT }, { author: CREDIT.author, source: CREDIT.source, licence: CREDIT.licence, licenceUrl: CREDIT.licenceUrl }, 'the credit the section prints is the packer\'s record');
  assert.equal(MANIFEST.jar.author, 'Pentristo'); assert.equal(MANIFEST.jar.licence, 'CC BY 4.0');
  assert.doesNotMatch(chunk, /GLTFLoader|meshopt/i, 'no glTF loader in the chunk (X-7)');
  assert.ok(gzipSync(read('src/scripts/hero/section4/products-bin.ts')).length < 2048);
});

/** the bin's inward-facing rings (h from the bottom, r), sorted by height then radius: the interior the body must keep inside */
function interiorRings(): [number, number][] {
  const committed = readFileSync(new URL(BIN_PATH, root));
  const [jar] = parseProductsBin(committed.buffer.slice(committed.byteOffset, committed.byteOffset + committed.length));
  const g = jar.parts[0].geometry, pos = g.getAttribute('position').array as Float32Array, nrm = g.getAttribute('normal').array as Float32Array;
  const rings = new Map<string, [number, number]>();
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2], r = Math.hypot(x, z);
    const nr = r > 1e-6 ? (nrm[i] * x + nrm[i + 2] * z) / r : 0;
    if (nr < -0.5) { const h = y + 0.5, k = `${h.toFixed(3)}/${r.toFixed(3)}`; if (!rings.has(k)) rings.set(k, [h, r]); }
  }
  return [...rings.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
/** the interior's radius at a height: linear between the bracketing rings (a ledge's two rings at one height make the step) */
const interiorR = (rings: [number, number][], h: number): number => {
  let lo = rings[0], hi = rings[rings.length - 1];
  for (const r of rings) { if (r[0] <= h) lo = r; else { hi = r; break; } }
  return hi[0] > lo[0] ? lo[1] + ((h - lo[0]) / (hi[0] - lo[0])) * (hi[1] - lo[1]) : lo[1];
};

test('the body (section-5-sand.md 4, "The body"): a lathe of the jar\'s interior inside the bin\'s inward rings at every height, the floor above the inside floor, flat outward normals, the cap +y, the counts', () => {
  const rings = interiorRings();
  // the measured interior (recorded in jars-math.ts): the inside floor at 0.068 and r 0.310, the ledge at 0.105 out to 0.373, the wall to 0.765
  const at = (h: number, r: number) => rings.find((x) => Math.abs(x[0] - h) < 0.002 && Math.abs(x[1] - r) < 0.002);
  assert.ok(at(0.068, 0.310) && at(0.105, 0.310) && at(0.105, 0.373) && at(0.765, 0.373) && at(0.802, 0.357) && at(0.857, 0.231), `the rings: ${JSON.stringify(rings.map((r) => [+r[0].toFixed(3), +r[1].toFixed(3)]))}`);
  const b = sandBody();
  assert.equal(b.position.length / 3, 482); assert.equal(b.normal.length, b.position.length); assert.equal(b.index.length, 1728);
  assert.equal(b.capStart, 337);
  for (let i = 0; i < b.index.length; i++) assert.ok(b.index[i] < b.position.length / 3, `index ${i} in range`);
  const floorH = rings[0][0];
  for (let i = 0; i < b.position.length; i += 3) {
    const x = b.position[i], y = b.position[i + 1], z = b.position[i + 2], h = y + 0.5, r = Math.hypot(x, z);
    assert.ok(h >= floorH + 0.001 && h <= JAR.shoulder, `vertex ${i / 3} between the inside floor and the shoulder (h ${h.toFixed(4)})`);
    assert.ok(r <= interiorR(rings, h) - 0.001, `vertex ${i / 3} inside the interior at h ${h.toFixed(4)}: r ${r.toFixed(4)} against ${interiorR(rings, h).toFixed(4)}`);
    assert.ok(r <= JAR.innerR + 1e-6);
    const l = Math.hypot(b.normal[i], b.normal[i + 1], b.normal[i + 2]);
    assert.ok(Math.abs(l - 1) < 1e-6, `normal ${i / 3} unit`);
  }
  // the cap's normals +y; the wall strip's radial; the floor's down
  for (let v = b.capStart; v < b.position.length / 3; v++) assert.deepEqual([b.normal[v * 3], b.normal[v * 3 + 1], b.normal[v * 3 + 2]], [0, 1, 0]);
  const wallStart = b.capStart - 96;
  for (let v = wallStart; v < b.capStart; v++) { const x = b.position[v * 3], z = b.position[v * 3 + 2], r = Math.hypot(x, z); assert.ok(Math.abs(b.normal[v * 3 + 1]) < 1e-6 && Math.abs(b.normal[v * 3] - x / r) < 1e-6 && Math.abs(b.normal[v * 3 + 2] - z / r) < 1e-6, `wall vertex ${v} radial`); }
  assert.deepEqual([b.normal[0], b.normal[1], b.normal[2]], [0, -1, 0], 'the floor fan faces down');
  // the cap's rings lie at the profile's top, the wall's radius first
  assert.ok(Math.abs(b.position[b.capStart * 3 + 1] + 0.5 - JAR.inner[JAR.inner.length - 1][0]) < 1e-6);
  assert.ok(Math.abs(Math.hypot(b.position[b.capStart * 3], b.position[b.capStart * 3 + 2]) - JAR.innerR) < 1e-6);
  // the clamp's profile: the interior's radius at the level, 0 under the floor, the ledge's step, the shoulder past the wall
  assert.equal(profileR(-0.5), 0);
  assert.ok(Math.abs(profileR(levelY(0)) - 0.308) < 1e-9, 'at the fill\'s floor the step\'s radius');
  assert.ok(Math.abs(profileR(levelY(0.1)) - JAR.innerR) < 1e-9, 'on the wall');
  assert.ok(profileR(levelY(1)) < JAR.innerR && profileR(levelY(1)) > 0.36, 'at the shoulder, a little in');
  for (const [h, r] of JAR.profile) assert.ok(r <= interiorR(rings, h + (r > interiorR(rings, h - 1e-4) ? 1e-4 : -1e-4)) - 0.001, `profile point ${h} inside the measured ring`);
  assert.equal(JAR.neckR, 0.231);
});

test('the placement (AC2) with the tilt: the box 0.9 of the slot\'s height and inside it, the model 0.9 at 0 degrees, the slot\'s centre at the jar\'s position', () => {
  const view = { w: 390, h: 844 }, slot = { x: 16, y: 300, w: 218, h: 273 };
  const p = placeJar(slot, view);
  assert.equal(p.tilt, JAR.tiltDeg);
  assert.ok(Math.abs(tiltFactor(10) - 1.1235) < 5e-4);
  assert.ok(Math.abs(p.box.h - JAR.fill * slot.h) < 1e-9, 'the box 0.9 of the slot\'s height');
  assert.ok(Math.abs(p.px - 218.7) < 0.1, 'the model 218.7 px tall at 390');
  assert.ok(p.box.x >= slot.x && p.box.y >= slot.y && p.box.x + p.box.w <= slot.x + slot.w + 1e-9 && p.box.y + p.box.h <= slot.y + slot.h + 1e-9, 'the box inside the slot');
  assert.ok(Math.abs(p.box.x + p.box.w / 2 - (slot.x + slot.w / 2)) < 1e-9 && Math.abs(p.box.y + p.box.h / 2 - (slot.y + slot.h / 2)) < 1e-9, 'centred on the slot');
  const p0 = placeJar(slot, view, 0);
  assert.ok(Math.abs(p0.px - JAR.fill * slot.h) < 1e-9 && Math.abs(p0.box.h - p0.px) < 1e-9, 'at 0 degrees the model is 0.9 of the slot and the box is the model');
  assert.ok(Math.abs((p.scale / (2 * halfHeight())) * view.h - p.px) < 1e-6, 'the scale projects to that height');
  const hh = halfHeight(), cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
  assert.ok(Math.abs(p.x - ((cx / view.w) * 2 - 1) * hh * (view.w / view.h)) < 1e-9);
  assert.ok(Math.abs(p.y - (1 - (cy / view.h) * 2) * hh) < 1e-9);
  const lap = placeJar({ x: 496, y: 200, w: 240, h: 300 }, { w: 1280, h: 800 });
  assert.ok(Math.abs(lap.px - 240.3) < 0.1 && Math.abs(lap.box.h - 270) < 1e-9, 'at 1280 the model 240.3 px, the box 270');
  const wide = placeJar({ x: 0, y: 0, w: 100, h: 400 }, view);
  assert.ok(Math.abs(wide.px - 100 / JAR.width) < 1e-9, 'a narrow slot: the width decides');
});

test('the seeds and the fall (section-5-sand.md 4): the seeds the same twice and different by seed, grainY and fallTime twins, the four fall times within 5 ms', () => {
  const a = grainSeeds(64, 29), b = grainSeeds(64, 29), c = grainSeeds(64, 30);
  assert.equal(a.length, 256); assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  const r = seeded(7); const x = r(), y = r(); assert.ok(x >= 0 && x < 1 && y >= 0 && y < 1 && x !== y);
  for (const L of [0, 0.25, 0.5, 0.75, 1]) assert.ok(Math.abs(grainY(fallTime(L)) - (levelY(L) + POUR.grainR)) < 1e-9, `fallTime(${L}) against grainY`);
  for (const [L, t] of [[0, 0.512], [0.25, 0.461], [0.5, 0.405], [0.75, 0.341]] as const) assert.ok(Math.abs(fallTime(L) - t) < 0.005, `fallTime(${L}) ${fallTime(L).toFixed(4)} against ${t}`);
  assert.ok(Math.abs(conePeak() - 0.079) < 0.001);
  assert.ok(Math.abs(levelY(0) + 0.425) < 1e-9 && Math.abs(levelY(1) - 0.27) < 1e-9);
  // the stream never touches the neck: its radius at the source plus the spread over the longest fall stays under the neck's inner radius
  assert.ok(POUR.streamR + POUR.spread * fallTime(0) * 0.5 < JAR.neckR);
});

test('the schedule (AC4, AC6): a quarter and a half from empty, the extension continuous at the same pace, null past emit, the queue\'s wait, the buffers above the chained bounds', () => {
  const q = pourSchedule(1, 0, 0), h = pourSchedule(2, 0, 2);
  assert.ok(Math.abs(q.lead - 0.512) < 0.005 && q.pour === 0.9 && Math.abs(q.total - 2.012) < 0.005 && q.emit < q.lead + q.pour && Math.abs(q.emit - 0.951) < 0.005);
  assert.ok(Math.abs(h.lead - 0.512) < 0.005 && Math.abs(h.pour - 1.8) < 1e-9 && Math.abs(h.total - 2.912) < 0.005 && Math.abs(h.emit - 1.907) < 0.005);
  assert.deepEqual([h.from, h.to, h.switches, h.owners, h.lead0, h.easeIn], [0, 0.5, [], [2], h.lead, true]);
  assert.ok(Math.abs(h.landEnd - (h.lead + h.pour)) < 1e-12);
  const half = pourSchedule(1, 0.5, 0);
  assert.ok(Math.abs(half.total - 1.905) < 0.005 && Math.abs(half.lead - 0.405) < 0.005, 'a quarter on a half-full jar');
  assert.ok(Math.abs(pourSchedule(1, 0.75, 1).total - 1.841) < 0.005, 'the last quarter');
  assert.equal(pourSchedule(2, 0.75, 2).to, 1, 'a half on three quarters is clamped at full');
  // the spec's example: Facebook on an empty jar, YouTube 0.8 s later
  const f = pourSchedule(1, 0, 0), e = extendPour(f, 1, 1, 0.8)!;
  assert.ok(e, 'a press while emitting extends');
  assert.ok(Math.abs(pourLevel(f, 0.8, false) - 0.071) < 0.003, 'the level at 0.8 s');
  assert.ok(Math.abs(e.from - pourLevel(f, 0.8, false)) < 1e-12 && e.to === 0.5 && e.lead === 0.8, 'rebased at the press');
  assert.ok(Math.abs(e.pour - 1.544) < 0.005 && Math.abs(e.emit - 1.939) < 0.005 && Math.abs(e.total - 2.944) < 0.005, `pour ${e.pour.toFixed(3)} emit ${e.emit.toFixed(3)} total ${e.total.toFixed(3)}`);
  assert.deepEqual([e.switches, e.owners, e.easeIn, e.lead0], [[f.emit], [0, 1], false, f.lead]);
  // continuity: the level before and after the press within 1e-9; the slope changes by under a fifth
  assert.ok(Math.abs(pourLevel(e, 0.8, false) - pourLevel(f, 0.8, false)) < 1e-9);
  const slope = (s: ReturnType<typeof pourSchedule>, t: number) => (pourLevel(s, t + 0.005, false) - pourLevel(s, t - 0.005, false)) / 0.01;
  assert.ok(Math.abs(slope(e, 0.81) / slope(f, 0.79) - 1) < 0.2, `the pace ${slope(f, 0.79).toFixed(3)} to ${slope(e, 0.81).toFixed(3)}`);
  assert.ok(Math.abs(slope(e, 1.2) - 0.25 / 0.9 / (1 - POUR.ease / 2 / e.pour)) < 0.02, 'the same pace a quarter per 0.9 s on the flat');
  // a press before the lead keeps the lead and the start ease; one at or past emit is queued
  const early = extendPour(f, 2, 2, 0.1)!;
  assert.ok(early.lead === f.lead && early.easeIn && early.from === 0 && early.to === 0.75);
  assert.equal(extendPour(f, 1, 1, f.emit), null); assert.equal(extendPour(f, 1, 1, f.emit + 0.1), null);
  assert.ok(fallTime(0.75) + POUR.tail < 1.1, 'the queue\'s longest wait');
  // the buffers: the longest one stream, three presses each at the last emitting moment, over every order
  const rate = POUR.streamPerQuarter / POUR.perQuarter;
  let maxS = 0, maxD = 0;
  for (const o of ORDERS.filter((x) => x.length === 3)) {
    const w = (id: string) => SIGNUP_FOLLOWS.find((x) => x.id === id)!.worth, ow = (id: string) => SIGNUP_FOLLOWS.findIndex((x) => x.id === id);
    let s = pourSchedule(w(o[0]), 0, ow(o[0]));
    s = extendPour(s, w(o[1]), ow(o[1]), s.emit - 1e-6)!; s = extendPour(s, w(o[2]), ow(o[2]), s.emit - 1e-6)!;
    maxS = Math.max(maxS, Math.ceil(s.emit * rate)); maxD = Math.max(maxD, Math.ceil((s.landEnd - s.lead0) * POUR.dustRate));
    assert.ok(s.total < 5, `the longest chained stream under 5 s (WCAG 2.2.2): ${s.total.toFixed(2)} s for ${o.join(', ')}`);
  }
  assert.ok(POUR.stream >= maxS, `the stream's buffer ${POUR.stream} above the chained bound ${maxS}`);
  assert.ok(POUR.dust >= maxD, `the dust's buffer ${POUR.dust} above the chained bound ${maxD}`);
  assert.ok(Math.abs(rate - 1706.67) < 0.01 && Math.abs(POUR.dustRate - 379.26) < 0.01);
});

test('the ramp, the level and the heap (AC4, AC12): monotonic with 0.5 at the middle, the mean pace exact, reduced instant; the cone 0 before the lead on an empty jar, its peak at lead + 0.25, the resting dome after the tail', () => {
  const len = 0.9, e = POUR.ease;
  assert.equal(ramp(0, len, e), 0); assert.equal(ramp(len, len, e), 1); assert.equal(ramp(-1, len, e), 0); assert.equal(ramp(2, len, e), 1);
  assert.ok(Math.abs(ramp(len / 2, len, e) - 0.5) < 1e-12, 'the middle');
  let prev = 0;
  for (let t = 0; t <= len; t += 0.001) { const v = ramp(t, len, e); assert.ok(v >= prev - 1e-12, `monotonic at ${t}`); prev = v; }
  const flat = (ramp(0.5, len, e) - ramp(0.4, len, e)) / 0.1;
  assert.ok(Math.abs(flat - 1 / (len - e)) < 1e-9, 'linear between the eases at the flat\'s pace');
  assert.ok(ramp(0.3, len, e, false) > ramp(0.3, len, e), 'without the start ease the line is ahead');
  assert.ok(Math.abs((ramp(0.2, len, e, false) - ramp(0.1, len, e, false)) / 0.1 - 1 / (len - e / 2)) < 1e-9);
  const s = pourSchedule(2, 0, 2);
  assert.equal(pourLevel(s, 0, false), 0); assert.equal(pourLevel(s, s.lead, false), 0); assert.equal(pourLevel(s, s.lead + s.pour, false), 0.5); assert.equal(pourLevel(s, 0, true), 0.5);
  assert.ok(Math.abs(pourLevel(s, s.lead + 0.9, false) - 0.25) < 1e-9, 'a quarter at lead + 0.9');
  assert.ok(Math.abs(pourLevel(s, s.lead + s.pour / 2, false) - 0.25) < 1e-9, 'the mean of from and to at the middle');
  assert.deepEqual(moundAt(0.1, s), { cone: 0, dome: 0 }, 'nothing before the lead on an empty jar');
  const peak = moundAt(s.lead + POUR.moundRise, s);
  assert.ok(Math.abs(peak.cone - conePeak()) < 1e-9 && peak.dome === 0, 'the cone\'s peak at lead + 0.25');
  assert.ok(Math.abs(moundAt(s.lead + 0.125, s).cone - conePeak() / 2) < 1e-9, 'rising');
  const held = moundAt(s.lead + 1, s); assert.ok(Math.abs(held.cone - conePeak()) < 1e-9, 'held while the stream lands');
  const rest = moundAt(s.total + 0.01, s); assert.ok(rest.cone === 0 && Math.abs(rest.dome - POUR.moundRest) < 1e-9, 'the resting dome after the tail');
  const mid = moundAt(s.landEnd + POUR.moundSettle / 2, s); assert.ok(mid.cone > 0 && mid.cone < conePeak() && mid.dome > 0 && mid.dome < POUR.moundRest, 'settling');
  assert.deepEqual(restMound(0), { cone: 0, dome: 0 }); assert.ok(Math.abs(restMound(0.5).dome - POUR.moundRest) < 1e-9);
  const half = pourSchedule(1, 0.5, 0);
  assert.ok(Math.abs(moundAt(0.1, half).dome - POUR.moundRest) < 1e-9, 'the resting dome before the lead when there was sand');
  const full = pourSchedule(1, 0.75, 1);
  assert.ok(moundAt(full.lead + 0.5, full).cone > conePeak() * 0.9, 'the heap whole while the level is more than its peak under the shoulder');
  assert.ok(moundAt(full.lead + 0.85, full).cone < conePeak() * 0.5, 'the heap scaled down in the last of the fill near the shoulder');
  assert.equal(moundAt(full.total + 1, full).dome, 0, 'no dome over a full jar');
});

test('the layers and the cells (AC8, D4): layerTops over the sixteen orders, layerOwner\'s chain, grainOwner by the switches, the cell 2.2 device px at the island\'s pixel ratio', () => {
  assert.deepEqual(layerTops(['instagram']), { bands: [0.5, 1, 1, 1], owners: [2, 2, 2, 2] });
  assert.deepEqual(layerTops(['facebook', 'youtube', 'instagram']), { bands: [0.25, 0.5, 1, 1], owners: [0, 1, 2, 2] });
  assert.deepEqual(layerTops(['instagram', 'facebook']), { bands: [0.5, 0.75, 1, 1], owners: [2, 0, 0, 0] });
  assert.deepEqual(layerTops([]), { bands: [1, 1, 1, 1], owners: [0, 0, 0, 0] });
  assert.deepEqual(layerTops(['nobody', 'youtube']), { bands: [0.25, 1, 1, 1], owners: [1, 1, 1, 1] });
  for (const o of ORDERS) { const { bands, owners } = layerTops(o); let acc = 0; o.forEach((id, k) => { acc += jarLevel(SIGNUP_FOLLOWS.find((f) => f.id === id)!); assert.ok(Math.abs(bands[k] - acc) < 1e-12); assert.equal(owners[k], SIGNUP_FOLLOWS.findIndex((f) => f.id === id)); }); }
  // the old bandOwner cases: Instagram first owns the bottom half; Facebook then Instagram; the full jar's top edge is the last band's
  const i = layerTops(['instagram']), fi = layerTops(['facebook', 'instagram']), all = layerTops(['facebook', 'youtube', 'instagram']);
  assert.deepEqual([layerOwner(0.1, i.bands, i.owners), layerOwner(0.49, i.bands, i.owners)], [2, 2]);
  assert.deepEqual([layerOwner(0.2, fi.bands, fi.owners), layerOwner(0.3, fi.bands, fi.owners), layerOwner(0.74, fi.bands, fi.owners)], [0, 2, 2]);
  assert.deepEqual([layerOwner(0.99, all.bands, all.owners), layerOwner(1, all.bands, all.owners), layerOwner(0.26, all.bands, all.owners)], [2, 2, 1]);
  assert.deepEqual([grainOwner(0.5, [], [2]), grainOwner(0.5, [0.951], [0, 1]), grainOwner(1.2, [0.951], [0, 1]), grainOwner(2.5, [0.951, 1.939], [0, 1, 2])], [2, 0, 1, 2]);
  const phone = placeJar({ x: 16, y: 300, w: 218, h: 273 }, { w: 390, h: 844 }), laptop = placeJar({ x: 496, y: 200, w: 240, h: 300 }, { w: 1280, h: 800 });
  assert.ok(Math.abs(cells(phone.px, DPR_CAP.touch) - 124) < 1, `about 124 cells at 390 on touch: ${cells(phone.px, DPR_CAP.touch).toFixed(1)}`);
  assert.ok(Math.abs(cells(laptop.px, DPR_CAP.fine) - 164) < 1, `about 164 at 1280 on fine: ${cells(laptop.px, DPR_CAP.fine).toFixed(1)}`);
  assert.ok(Math.abs(cells(placeJar({ x: 16, y: 300, w: 218, h: 273 }, { w: 390, h: 844 }, 0).px, DPR_CAP.touch) - 140) < 1, '140 at 0 degrees');
  // the grains' point size: 2.2 device px at 390 on touch, 2.9 at 1280 on fine, inside the clamp
  assert.ok(Math.abs(2 * POUR.grainR * phone.px * DPR_CAP.touch - 2.2) < 0.05 && Math.abs(2 * POUR.grainR * laptop.px * DPR_CAP.fine - 2.9) < 0.05);
  assert.deepEqual([...POUR.grainPx], [1, 6]); assert.deepEqual([...POUR.dustPx], [1.2, 0.8]);
  assert.equal(DPR_CAP.touch, 1.25); assert.equal(DPR_CAP.fine, 1.5);
});

test('the shaders (AC11): no numeric literal of a POUR or JAR value, every uniform in its object, texelFetch and an integer hash in the body\'s fragment, every varying assigned on the culled path, the points\' draw range and no culling, the glass byte for byte', () => {
  const values = new Set<number>();
  for (const o of [POUR, JAR]) for (const v of Object.values(o)) { if (typeof v === 'number') values.add(v); else if (Array.isArray(v)) for (const x of (v as readonly (number | readonly number[])[]).flat()) values.add(x as number); }
  for (const x of [0, 0.5, 1, 2]) values.delete(x);   // the structural numbers (halves, doubles) a shader cannot do without
  assert.ok(values.has(0.62) && values.has(0.371) && values.has(1536) && values.has(0.9) && values.has(6) && values.has(2.2));
  for (const name of SHADERS) {
    const s = glsl(name);
    for (const m of s.matchAll(/(?<![\w.])(\d+\.?\d*(?:e-?\d+)?)(?![\w.])/g)) assert.ok(!values.has(parseFloat(m[1])), `${name}: the literal ${m[1]} is a POUR or JAR value`);
    for (const m of s.matchAll(/uniform\s+\w+\s+([^;]+);/g)) for (const u of m[1].split(',').map((x) => x.trim())) assert.match(chunk, new RegExp(`\\b${u}: \\{`), `${name}: the uniform ${u} in a uniforms object`);
  }
  const frag = glsl('SAND_FRAG'), vert = glsl('POUR_VERT');
  assert.match(frag, /texelFetch\(tP/); assert.match(frag, /uvec3|uint /, 'an integer hash');
  assert.doesNotMatch(frag, /texture2D|texture\(/, 'the palette by texel, not by sampling');
  assert.doesNotMatch(chunk, /glslVersion/, 'three\'s own 300 es prefix on WebGL2');
  const varyings = [...vert.matchAll(/varying\s+\w+\s+([^;]+);/g)].flatMap((m) => m[1].split(',').map((x) => x.trim()));
  assert.ok(varyings.length >= 3, `the pour's varyings: ${varyings.join(', ')}`);
  const at = vert.search(/gl_Position\s*=\s*vec4\(2\.0,\s*2\.0,\s*2\.0,\s*1\.0\)/);
  assert.ok(at > 0, 'the culled path writes a point outside the clip volume');
  const branch = vert.slice(at, vert.indexOf('}', at));
  for (const v of varyings) assert.match(branch, new RegExp(`\\b${v}\\s*=\\s*`), `${v} assigned on the culled path`);
  assert.match(branch, /gl_PointSize\s*=\s*0\.0;/);
  assert.match(chunk, /setDrawRange\(0, /, 'the position-less points draw only a set range');
  assert.match(chunk, /points\.frustumCulled = false/); assert.match(chunk, /sand\.frustumCulled = false/);
  assert.match(chunk, /depthWrite: false/, 'the pour writes no depth');
  assert.doesNotMatch(chunk, /pointermove|mousemove|pointerenter|mouseenter/, 'nothing on the jar answers the pointer (rule 48)');
  assert.doesNotMatch(dom, /pointermove|mousemove|pointerenter|mouseenter/);
  for (const [name, sha] of [['GLASS_VERT', 'c4c983c587bea52d935097f3f6c35f78f0a36d19689a00e02b881467391b2a84'], ['GLASS_FRAG', '87c9dde45b3c97612cfc2736520d36052c4ee3d982d857fe6dc6e849ba937f0e']]) assert.equal(createHash('sha256').update(glsl(name)).digest('hex'), sha, `${name} byte for byte as committed on 2026-10-28`);
  assert.doesNotMatch(chunk, /MeshPhysicalMaterial|transmission/, 'our own glass, no transmission pass (D10)');
  assert.doesNotMatch(chunk, /InstancedBufferGeometry|SphereGeometry|packBeads/, 'the beads are gone');
  assert.equal(DUST.radial.length, 4); assert.equal(DUST.rise.length, 4);
});

test('plain text (AC10; rules 5, 6, 11, 25, 39): signup.css carries no fill but none, transparent, --night or --skeleton, no border but the field\'s line and the focus ring, no shadow or filter, no radius, the quiz\'s type, one column then the laptop\'s areas, the slot\'s clamp, nothing animated, hover on the links alone', () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
  assert.ok(rules.length > 30);
  for (const { sel, body } of rules) {
    for (const d of body.split(';').map((x) => x.trim()).filter(Boolean)) {
      const [prop, ...rest] = d.split(':'), val = rest.join(':').trim();
      assert.doesNotMatch(prop, /box-shadow|text-shadow|backdrop-filter|^filter/, `${sel}: ${d}`);
      if (/border-radius/.test(prop)) assert.equal(val, '0', `${sel}: ${d}`);
      if (/^background/.test(prop.trim())) assert.match(val, /^(none|transparent|var\(--(night|skeleton)\))$/, `${sel}: ${d}`);
      if (/^border(-bottom|-top|-left|-right)?$/.test(prop.trim()) && val !== '0') assert.match(sel + d, /su-input|focus-visible/, `a border in signup.css: ${sel}: ${d}`);
    }
    if (/:hover/.test(sel)) { assert.match(sel, /su-link|su-credit|su-noscript/, `hover on the links alone: ${sel}`); for (const d of body.split(';').map((x) => x.trim()).filter(Boolean)) assert.match(d, /^text-decoration-thickness:/, `${sel}: ${d}`); }
  }
  assert.doesNotMatch(bare, /pill|btn|panel|card/, 'no pill, button, panel or card class');
  const quiz = read('src/styles/quiz.css');
  const token = (src: string, name: string) => src.match(new RegExp(`${name}: (clamp\\([^;]+\\));`))?.[1];
  assert.equal(token(css, '--su-fs'), token(quiz, '--qz-fs'), 'the body size is the quiz\'s');
  assert.equal(token(css, '--su-fs-q'), token(quiz, '--qz-fs-q'), 'the heading size is the quiz\'s');
  assert.match(css, /\.signup \{[^}]*font: 500 var\(--su-fs\) \/ 1\.45 var\(--su-font\); text-transform: uppercase; letter-spacing: 0; font-synthesis: none;/);
  assert.match(css, /--su-font: "IBM Plex Mono", ui-monospace, monospace/);
  assert.match(css, /\.signup \.sr-only \{ text-transform: none; \}/, 'sentence case for assistive technology');
  assert.doesNotMatch(css, /animation|transition:(?! background-color 0s 86400s)/, 'nothing moves on its own in the stylesheet (the autofill hold is no motion)');
  // the jar block: one column with a 12 px gap; from 720 px the follows left of the jar, the count under it
  assert.match(css, /\.su-jar \{ display: grid; grid-template-columns: minmax\(0, 1fr\); gap: var\(--s2\);/);
  assert.match(css, /\.su-slot \{ position: relative; width: clamp\(176px, 56vw, 240px\); aspect-ratio: 4 \/ 5; \}/);
  assert.match(css, /@media \(min-width: 720px\) \{\n\s*\.su-jar \{ grid-template-columns: minmax\(0, 1fr\) 240px; column-gap: var\(--s4\); grid-template-areas: "follows slot" "follows count"; \}/);
  assert.match(css, /\.su-follows \{ grid-area: follows; align-self: center; \}/);
  assert.match(css, /\.su-slot \{ grid-area: slot; width: 240px; \}/); assert.match(css, /\.su-count \{ grid-area: count; \}/);
  assert.match(css, /\.su-follow-row \{ display: flex; justify-content: space-between; align-items: center; gap: var\(--s2\); min-height: 44px; \}/);
  assert.match(css, /\.su-count, \.su-state \{ font-variant-numeric: tabular-nums; \}/);
  assert.doesNotMatch(css, /su-jars \{|su-word|repeat\(4/, 'the four-jar grid is gone');
});

test('the markup (AC1, AC9, AC10): one slot named for assistive technology, the empty jar\'s picture alone with a decorative image, three rows whose links carry their families\' hexes, every line through the decode, the credit, the form, no style attribute, no emoji', () => {
  assert.doesNotMatch(astro, /\sstyle=/, 'no style attribute (the CSP)');
  assert.doesNotMatch(astro, /[–—]|[\u{1F300}-\u{1FAFF}]/u);
  assert.match(astro, /<div class="su-jar" data-n="0" data-level="0\.000">/);
  assert.match(astro, /<div class="su-slot" data-slot="yours" role="img" aria-label=\{C\.jarAria\}>/, 'the one slot, named');
  assert.doesNotMatch(astro, /su-slot" data-slot=\{|data-slot="facebook|data-colours=\{j\.colours\}>\n\s*\{j\.still/, 'no platform slot, no hexes on the slot');
  assert.match(astro, /<picture class="su-still" data-lazy>/, 'the poster tier\'s still, lazy');
  assert.match(astro, /<source data-srcset=\{still\.avif\} type="image\/avif" sizes="\(min-width: 720px\) 240px, 56vw" \/>/);
  assert.match(astro, /<img data-src=\{still\.src\} alt="" width="160" height="200" loading="lazy" decoding="async" \/>/, 'decorative inside the named slot');
  assert.match(astro, /const still = file\('0'\);/, 'the empty jar\'s picture alone');
  assert.match(astro, /<p class="su-count" data-dc>\{C\.yoursEmpty\}<\/p>/);
  assert.match(astro, /<ol class="su-follows" aria-label=\{C\.followsAria\}>/);
  assert.match(astro, /<li class="su-follow-row" data-id=\{j\.id\}>/);
  assert.match(astro, /<a class="su-link su-follow" href=\{j\.url\} target="_blank" rel="noopener" data-id=\{j\.id\} data-colours=\{j\.colours\} aria-label=\{`\$\{j\.word\}\. \$\{C\.newTab\}\.`\} data-dc>\{j\.word\}<\/a>/, 'the link carries its hexes');
  assert.match(astro, /<p class="su-state" data-dc>\{C\.notYet\}<\/p>/);
  assert.match(astro, /<span data-dc>\{C\.creditLead\}<\/span>\{' '\}<a href=\{SIGNUP_CREDIT\.source\} rel="noopener" data-dc>\{SIGNUP_CREDIT\.author\}<\/a>\{C\.creditJoin\}<a href=\{SIGNUP_CREDIT\.licenceUrl\} rel="noopener" data-dc>\{SIGNUP_CREDIT\.licence\}<\/a>\{C\.creditEnd\}/, 'the credit: the words decode, the spaces and punctuation stand between them');
  assert.equal(SIGNUP_COPY.creditLead, 'Glass jar model by'); assert.equal(SIGNUP_COPY.creditJoin, ', '); assert.equal(SIGNUP_COPY.creditEnd, '.');
  for (const id of ['su-h', 'su-sub', 'su-jars-h', 'su-count', 'su-got', 'su-got-sub', 'su-keep', 'su-fine', 'su-state']) assert.match(astro, new RegExp(`class="${id}"[^>]*data-dc`), `${id} decodes`);
  assert.match(astro, /<input class="su-input" id="suEmail" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" required aria-describedby="suErrEmail">/);
  assert.match(astro, /<button type="submit" class="su-link" id="suSend" data-dc>\{C\.send\}<\/button>/);
  assert.match(astro, /\{LEADS && \(/, 'the form only with PUBLIC_LEADS on');
  assert.match(astro, /<div class="su-loopend" id="suLoopEnd" aria-hidden="true"><\/div>/, 'the loop end under the body');
  assert.match(astro, /<p class="sr-only" id="suLive" aria-live="polite"><\/p>/);
  assert.match(dom, /sessionStorage/, 'the follows for the visit');
  assert.doesNotMatch(dom, /localStorage/, 'never localStorage (B3)');
  assert.match(dom, /credentials: 'omit'/, 'the request carries no cookie');
  assert.match(dom, /email\.addEventListener\('blur'/, 'validation on blur');
  assert.doesNotMatch(dom, /addEventListener\('input'|addEventListener\('keyup'/, 'never per keystroke (H4)');
  assert.match(dom, /import\.meta\.glob<string>\('\.\.\/\.\.\/assets\/signup\/stills\/\*\.\{avif,webp\}'/, 'the stills\' map in the DOM script');
  assert.match(dom, /stillKey\(follows\)/); assert.match(dom, /stillAlt\(follows\)/);
  assert.match(dom, /dataset\.pouring/, 'data-pouring from the frame callback');
});

test('the wiring (AC1, AC4, AC11): hero.ts imports the chunk at idle and when the section nears, the loop composes the fourth wipe and section 5\'s frame, the chunk\'s marker, the frame with pour, the poured event, the hooks block guarded by the constant', () => {
  const hero = read('src/scripts/hero/hero.ts'), loop = read('src/scripts/hero/loop.ts');
  assert.match(hero, /import\('\.\/section5\/jars\.ts'\)/);
  assert.match(hero, /rootMargin: '200% 0px' \}\);\n\s*near\.observe\(signupEl\);/, 'within two screens');
  assert.match(hero, /\.then\(\(r\) => r\?\.warmCloud\(\)\)\.then\(\(\) => \{ if \(!life\.dead\) void loadSignup\(\); \}\)/, 'at idle after the cloud');
  assert.match(hero, /exitY: \(\) => \{ const v = ctx\.signup \? ctx\.signup\.exitY\(\) : NaN; return Number\.isFinite\(v\) \? v : signupDom\(\)\.exit; \}/);
  assert.match(hero, /signupReady: \(\) => !signupEl \|\| !ctx\.signup \|\| ctx\.signup\.ready \|\| ctx\.signup\.failed/);
  assert.match(hero, /document\.getElementById\('room'\), signupEl\]\.filter/, 'the island runs while section 5 is in view');
  assert.match(hero, /still: \(order, level\) => ctx\.signup\?\.still\?\.\(order, level\) \?\? Promise\.resolve\(null\)/, '__s5.still by order, optional');
  assert.match(hero, /scrub: \(t\) => ctx\.signup\?\.scrub\?\.\(t\)/); assert.match(hero, /tilt: \(deg\) => ctx\.signup\?\.tilt\?\.\(deg\)/);
  assert.match(loop, /const S5 = ctx\.signup, s5want = !!S5 && \(wipeOut > 0 \|\| S5\.inView\(\)\);/);
  assert.match(loop, /if \(roomOn && wipeOut > 0\) \{ C\.tA\.value = plan!\.tex; C\.tB\.value = s5on \? p5!\.tex : groundTex; C\.uProgress\.value = wipeOut; C\.uParA\.value = 0; \}/, 'the cut as the first wipe\'s, the near side held');
  assert.match(loop, /else if \(s5on && !roomOn\) \{ C\.tA\.value = p5!\.tex; C\.tB\.value = p5!\.tex; C\.uProgress\.value = 0; C\.uParA\.value = 0; \}/, 'section 5\'s frame whole');
  assert.match(chunk, /export const SIGNUP_MARK = 'skreed:signup';/, 'the budget\'s marker');
  assert.match(chunk, /window\.__skreedSignupFrame\?\.\(\{ on, cover: f\.cover, wipe: f\.wipe, pour: /, 'the frame to the DOM, with the pour');
  assert.match(chunk, /addEventListener\('skreed:signup', onSignup\)/, 'the press heard');
  assert.match(chunk, /new CustomEvent\('skreed:signup-poured', \{ detail: \{ id, level: /, 'the poured event');
  assert.match(chunk, /order = domFollows\(\);\s+\/\/ the DOM as it stands now/, 'the DOM read again once the jar is built');
  assert.match(dom, /if \(follows\.length\) window\.dispatchEvent\(new CustomEvent\('skreed:signup', \{ detail: \{ id: '', follows: \[\.\.\.follows\] \} \}\)\);/, 'the mount tells the island its saved follows');
  assert.doesNotMatch(dom, /ms: /, 'the island owns the timing');
  // the hooks fold (D12): still, scrub, tilt and hooks inside one block the production build drops
  const at = chunk.indexOf("if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {");
  assert.ok(at > 0, 'the hooks block');
  for (const w of ['readRenderTargetPixels', 'api.still = ', 'api.scrub = ', 'api.tilt = ', 'api.hooks = ']) { const i = chunk.indexOf(w); assert.ok(i > at, `${w} inside the hooks block`); assert.equal(chunk.indexOf(w, i + 1), -1, `${w} once`); }
  assert.doesNotMatch(chunk.slice(0, at), /readRenderTargetPixels|api\.still|api\.scrub|api\.tilt|api\.hooks/);
});

test('the stills (AC12): when present, exactly 64 files named by the sixteen keys at 1x and 2x in AVIF and WebP, each under its cap', (t) => {
  const dir = new URL('src/assets/signup/stills/', root);
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(avif|webp)$/.test(f)) : [];
  if (!files.length) { t.skip('no stills in this checkout (scripts/signup/render-stills.mjs makes them)'); return; }
  const CAPS: Record<string, Record<string, number>> = { '1x': { avif: 10, webp: 16 }, '2x': { avif: 24, webp: 40 } };
  const want = ORDERS.flatMap((o) => ['1x', '2x'].flatMap((s) => ['avif', 'webp'].map((f) => `jar-${stillKey(o)}-${s}.${f}`)));
  assert.deepEqual(files.sort(), want.sort());
  for (const f of files) { const m = /-(1x|2x)\.(avif|webp)$/.exec(f)!, size = statSync(new URL(f, dir)).size; assert.ok(size <= CAPS[m[1]][m[2]] * 1024, `${f}: ${size} B over ${CAPS[m[1]][m[2]]} KB`); assert.ok(size > 200, `${f}: a picture`); }
});

test('(8) the lock (quiz-gate.md D9): section 5 rendered hidden and data-locked with section 4, its inline step after the markup from QUIZ_GATE.key, opened by the same unlock, and the no-JS rule', () => {
  const inline = read('src/inline/signup-gate.inline.js'), gate = read('src/scripts/quiz/gate.ts');
  assert.match(astro, /<section class="signup" id="signup" aria-label=\{C\.aria\} data-state="rest" data-follows=\{FOLLOW_COUNT\} hidden data-locked>/, 'rendered locked on every tier');
  assert.match(astro, /const gateCode = inlineScript\('signup-gate\.js', \{ KEY: QUIZ_GATE\.key \}, gate\);/, 'the step assembled from the key, no hooks part of its own');
  assert.match(astro, /<\/section>\n<script is:inline set:html=\{gateCode\}><\/script>/, 'the step right after the section');
  assert.match(inline, /var s = document\.getElementById\('signup'\), o = window\.__skreedRoomOverride \? window\.__skreedRoomOverride\(\) : false, v = '';/, 'the override read where the hooks part defined it');
  assert.match(inline, /try \{ v = sessionStorage\.getItem\(KEY\); \} catch \(e\) \{/, 'the flag read in try and catch');
  assert.match(inline, /if \(v === '1' \|\| o\) \{ s\.removeAttribute\('hidden'\); s\.removeAttribute\('data-locked'\); s\.setAttribute\('data-open', 'visit'\); \}/, 'opened for a visit that opened the room');
  assert.doesNotMatch(inline.replace(/\/\*[\s\S]*?\*\//g, ''), /setItem|room=open|hero3d|poster|matchMedia/, 'nothing written, nothing of the override, the tier or motion in the code (its comment names them)');
  assert.match(gate, /const s = document\.getElementById\('signup'\);\n\s*if \(s\) \{ s\.removeAttribute\('hidden'\); s\.removeAttribute\('data-locked'\); s\.dataset\.open = by; \}\n\s*flag\(\);/, 'the unlock opens section 5 with the room');
  assert.match(css, /html:not\(\.js\) \.signup\[data-locked\] \{ display: block; \}/, 'without JavaScript nothing is locked');
  assert.doesNotMatch(css, /\.signup \{[^}]*display:/, 'signup.css sets no display on .signup itself');
});
