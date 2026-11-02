// Section 5, the sign-up (docs/specs/section-5.md 7; docs/specs/section-5-liquid.md 8: AC3, AC6, AC8, AC10, AC11, AC12):
// the config (the three follows, their worth, families, family names and shades, the addresses on record, the sixteen
// still keys, the descriptions, the copy's brand rules with the discount words kept out), the jar bin byte for byte
// against the packer with its manifest and read back by the island's parser, the maths (the placement with the view
// from above, the liquid's body inside the bin's interior, the fall, the schedule with the quarter switches, its
// extension and queue, the ramp, the stream's span and radius, the ripple's and the dimple's weights, the slopes, the
// bands, the dye twins, the tube), the shaders' rules (no LIQ or JAR literal, every uniform in its object, the body
// opaque, the stream blended with no depth written, the glass byte for byte, every varying assigned), the section as
// plain text (signup.css and Signup.astro: no fill, no border but the field's line and the focus ring, no shadow, no
// radius, the quiz's type, the one-column grid and the laptop's areas), the markup, the wiring and the stills' files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { FOLLOW_COUNT, SIGNUP_COPY, SIGNUP_CREDIT, SIGNUP_FOLLOWS, SIGNUP_JARS, SIGNUP_KEYS, SIGNUP_LEAD_ENDPOINT, WORTH_TOTAL, fill, followWord, jarLevel, levelWord, stillAlt, stillKey, yoursLevel, yoursState } from '../../src/config/signup.ts';
import { liquidColours } from '../../src/config/signup-colours.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { PEARL_WHISPER } from '../../src/config/tokens.ts';
import { GAMMA, JAR, LIQ, PEARL_LINEAR, bandColour, capPath, chord, dimpleHeight, dimpleSlope, dimpleWeight, extendPour, fallAge, fallTime, fallY, halfHeight, hexOf, layerBands, levelY, linearOf, liquidBody, lum, meniscusSlope, parcelShade, placeJar, pourLevel, pourSchedule, profileR, quarterSwitches, ramp, rippleSlope, rippleWeight, scatter, seen, smoothstep, streamRadius, streamSpan, tiltFactor, transmit, tubeGeometry, type Rgb } from '../../src/scripts/hero/section5/jars-math.ts';
import { parseProductsBin } from '../../src/scripts/hero/section4/products-bin.ts';
import { BIN_PATH, CREDIT, GLB_PATH, LINE_KB, MANIFEST_PATH, jarBin } from '../../scripts/signup/jar-bin.mjs';
import MANIFEST from '../../src/data/signup-jar-bin.json' with { type: 'json' };

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const css = read('src/styles/signup.css'), astro = read('src/components/signup/Signup.astro'), config = read('src/config/signup.ts');
const chunk = read('src/scripts/hero/section5/jars.ts'), maths = read('src/scripts/hero/section5/jars-math.ts'), dom = read('src/scripts/signup/signup.ts');
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
const SHADERS = ['LIQ_VERT', 'LIQ_FRAG', 'STREAM_VERT', 'STREAM_FRAG'];
/** the follows' worth and shades by id, for the chained schedules */
const F = (id: string) => SIGNUP_FOLLOWS.find((x) => x.id === id)!;
const BB = 'blissful-blue-10', RR = 'roaring-red-06', VV = 'vivid-violet-07', PP = 'playful-pink-20';
const near = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} against ${b}`);

test('the follows (section-5-liquid.md 3): Sam\'s order, the worth a quarter, a quarter, a half, the families in pouring order with their site names, one catalog shade per quarter of worth, the addresses on record, no fourth row', () => {
  assert.deepEqual(SIGNUP_JARS.map((j) => j.id), ['facebook', 'youtube', 'instagram']);
  assert.deepEqual(SIGNUP_FOLLOWS, SIGNUP_JARS, 'the follows are the three rows');
  assert.equal(FOLLOW_COUNT, 3); assert.equal(WORTH_TOTAL, 4);
  assert.deepEqual(SIGNUP_FOLLOWS.map(jarLevel), [0.25, 0.25, 0.5]);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.families), [['blissful-blue'], ['roaring-red'], ['vivid-violet', 'playful-pink']], 'Instagram\'s violet under its pink, as Sam\'s picture stacks them');
  // the family names are the catalog's site names in the singular (CLAUDE.md), pinned to the family ids
  const siteName: Record<string, string> = { 'blissful-blue': 'Blissful Blue', 'roaring-red': 'Roaring Red', 'playful-pink': 'Playful Pink', 'vivid-violet': 'Vivid Violet' };
  for (const j of SIGNUP_FOLLOWS) {
    assert.equal(j.familyNames, j.families.map((f) => siteName[f]).join(' and '), `${j.id}: the families' site names`);
    assert.match(j.url, /^https:\/\//, `${j.id}: plain https, never an app scheme (B3)`);
    assert.doesNotMatch(j.url, /instagram:\/\/|fb:\/\/|youtube:\/\//);
    for (const f of j.families) assert.equal(SHADES.filter((s) => s.family === f).length, 24, `${f}: a catalog family`);
    // the shades: one catalog id per quarter of worth, each of one of the follow's families, in the families' order
    assert.equal(j.shades.length, j.worth, `${j.id}: one shade per quarter of worth`);
    j.shades.forEach((id, k) => { const s = SHADES.find((x) => x.id === id); assert.ok(s, `${id}: a catalog shade`); assert.equal(s!.family, j.families[Math.min(k, j.families.length - 1)], `${id}: of the follow's family in pouring order`); });
  }
  assert.equal(SIGNUP_FOLLOWS[2].familyNames, 'Vivid Violet and Playful Pink');
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => [...j.shades]), [[BB], [RR], [VV, PP]]);
  assert.deepEqual(SIGNUP_FOLLOWS.flatMap((j) => j.shades.map((id) => SHADES.find((s) => s.id === id)!.name)), ['Azure', 'Classic', 'Amethyst', 'Bright Pink']);
  assert.match(config, /read from the\s+\* footer of https:\/\/www\.skreed\.com\/ on 2026-10-26/);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.url), ['https://facebook.com/skreedofficial', 'https://www.youtube.com/@skreedofficial', 'https://www.instagram.com/skreedofficial/']);
  // the links' colours: the table's hexes of the config's ids, in order (A2); an unknown id fails the build
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => liquidColours(j.shades).join(',')), ['#007dd3', '#ef1123', '#8554d1,#fe0094']);
  for (const j of SIGNUP_FOLLOWS) liquidColours(j.shades).forEach((hex, k) => assert.equal(hex, SHADES.find((s) => s.id === j.shades[k])!.hex));
  assert.throws(() => liquidColours(['nobody-99']));
  // the shade table stays out of the client chunks (section-5.md 6): the hexes are joined at build and ride each link's markup
  assert.doesNotMatch(config, /shades\.gen/, 'config/signup.ts imports no shade table');
  assert.doesNotMatch(chunk, /shades\.gen|signup-colours/, 'nor the jar chunk');
  assert.doesNotMatch(maths, /shades\.gen|signup-colours/, 'nor its maths');
  assert.doesNotMatch(dom, /shades\.gen|signup-colours/, 'nor the DOM script');
  assert.match(astro, /import \{ liquidColours \} from '\.\.\/\.\.\/config\/signup-colours\.ts';/);
  assert.match(astro, /colours: liquidColours\(j\.shades\)\.join\(','\)/, 'the link carries its shades\' hexes');
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

/** the sixteen descriptions (section-5-liquid.md 3) */
const DESCRIPTIONS: Record<string, string> = {
  '0': 'An empty glass jar.',
  f: 'A glass jar a quarter full of colour, from the bottom: Blissful Blue.',
  y: 'A glass jar a quarter full of colour, from the bottom: Roaring Red.',
  i: 'A glass jar half full of colour, from the bottom: Vivid Violet and Playful Pink.',
  fy: 'A glass jar half full of colour, from the bottom: Blissful Blue, then Roaring Red.',
  fi: 'A glass jar three quarters full of colour, from the bottom: Blissful Blue, then Vivid Violet and Playful Pink.',
  yf: 'A glass jar half full of colour, from the bottom: Roaring Red, then Blissful Blue.',
  yi: 'A glass jar three quarters full of colour, from the bottom: Roaring Red, then Vivid Violet and Playful Pink.',
  if: 'A glass jar three quarters full of colour, from the bottom: Vivid Violet and Playful Pink, then Blissful Blue.',
  iy: 'A glass jar three quarters full of colour, from the bottom: Vivid Violet and Playful Pink, then Roaring Red.',
  fyi: 'A glass jar full of colour, from the bottom: Blissful Blue, then Roaring Red, then Vivid Violet and Playful Pink.',
  fiy: 'A glass jar full of colour, from the bottom: Blissful Blue, then Vivid Violet and Playful Pink, then Roaring Red.',
  yfi: 'A glass jar full of colour, from the bottom: Roaring Red, then Blissful Blue, then Vivid Violet and Playful Pink.',
  yif: 'A glass jar full of colour, from the bottom: Roaring Red, then Vivid Violet and Playful Pink, then Blissful Blue.',
  ify: 'A glass jar full of colour, from the bottom: Vivid Violet and Playful Pink, then Blissful Blue, then Roaring Red.',
  iyf: 'A glass jar full of colour, from the bottom: Vivid Violet and Playful Pink, then Roaring Red, then Blissful Blue.',
};

test('the still keys and the descriptions (section-5-liquid.md 3): sixteen keys, one per order, and one sentence each from the bands in press order, "colour" once after a follow', () => {
  assert.equal(ORDERS.length, 16);
  const keys = ORDERS.map(stillKey);
  assert.equal(new Set(keys).size, 16, 'every order its own key');
  assert.deepEqual(keys.sort(), ['0', 'f', 'fi', 'fiy', 'fy', 'fyi', 'i', 'if', 'ify', 'iy', 'iyf', 'y', 'yf', 'yfi', 'yi', 'yif'].sort());
  assert.equal(stillKey([]), '0'); assert.equal(stillKey(['instagram', 'facebook']), 'if'); assert.equal(stillKey(['nobody', 'youtube']), 'y');
  assert.equal(stillAlt([]), 'An empty glass jar.');
  assert.equal(stillAlt(['facebook']), 'A glass jar a quarter full of colour, from the bottom: Blissful Blue.');
  assert.equal(stillAlt(['instagram']), 'A glass jar half full of colour, from the bottom: Vivid Violet and Playful Pink.');
  assert.equal(stillAlt(['instagram', 'facebook']), 'A glass jar three quarters full of colour, from the bottom: Vivid Violet and Playful Pink, then Blissful Blue.');
  assert.equal(stillAlt(['facebook', 'youtube', 'instagram']), 'A glass jar full of colour, from the bottom: Blissful Blue, then Roaring Red, then Vivid Violet and Playful Pink.');
  assert.equal(stillAlt(['facebook', 'youtube']), 'A glass jar half full of colour, from the bottom: Blissful Blue, then Roaring Red.');
  assert.deepEqual([levelWord(0.25), levelWord(0.5), levelWord(0.75), levelWord(1)], ['a quarter full', 'half full', 'three quarters full', 'full']);
  for (const o of ORDERS) {
    const d = stillAlt(o);
    assert.equal(d, DESCRIPTIONS[stillKey(o)], `the description of ${stillKey(o)}`);
    assert.match(d, /^[A-Z][^.]+\.$/, `one sentence: ${d}`);
    assert.equal((d.match(/\bcolour\b/g) ?? []).length, o.length ? 1 : 0, `"colour" once after a follow: ${d}`);
  }
  assert.equal(SIGNUP_COPY.jarLayers, 'A glass jar {level} of colour, from the bottom: {layers}.');
  assert.equal(SIGNUP_COPY.followsAria, 'The three follows that fill your jar');
  assert.equal(SIGNUP_COPY.jarAria, 'Your jar');
  assert.doesNotMatch(astro, />\{C\.jarAria\}</, '"Your jar" is printed nowhere (the slot\'s name alone)');
  assert.doesNotMatch(astro, /su-word/);
});

test('copy (A4, section-5-liquid.md 3 and AC10): sentence case, no em or en dash, no emoji, no buzzwords, none of the picture\'s discount or verification words, and the sand gone from every string, description and comment of the section\'s files', () => {
  const strings = [...allStrings(), ...ORDERS.map(stillAlt), ...SIGNUP_FOLLOWS.map((j) => j.familyNames)];
  for (const s of strings) {
    assert.doesNotMatch(s, /[–—]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|elevate|unleash|next-level|revolutionary)\b/i, s);
    assert.doesNotMatch(s, /\b(discount|discounts|off|save up|code|codes|free|price|savings|verify|verified|verifies)\b|%/i, `a discount, price or verification word: ${s}`);
    assert.doesNotMatch(s, /\bpssst\b/i, s);
    assert.doesNotMatch(s, /\bcolor\b/i, `colour with a u: ${s}`);
    assert.doesNotMatch(s, /\bsand\b/i, `the sand is withdrawn: ${s}`);
  }
  for (const [name, src] of [['signup.css', css], ['Signup.astro', astro], ['config/signup.ts', config], ['jars.ts', chunk], ['jars-math.ts', maths], ['signup.ts', dom]] as const) assert.doesNotMatch(src, /\bsand\b/i, `${name}: the word sand in a comment or a string`);
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

test('the body (section-5-liquid.md 4, "The body"): a lathe of the jar\'s interior inside the bin\'s inward rings at every height, the floor above the inside floor, flat outward normals, the cap +y, the counts', () => {
  const rings = interiorRings();
  // the measured interior (recorded in jars-math.ts): the inside floor at 0.068 and r 0.310, the ledge at 0.105 out to 0.373, the wall to 0.765
  const at = (h: number, r: number) => rings.find((x) => Math.abs(x[0] - h) < 0.002 && Math.abs(x[1] - r) < 0.002);
  assert.ok(at(0.068, 0.310) && at(0.105, 0.310) && at(0.105, 0.373) && at(0.765, 0.373) && at(0.802, 0.357) && at(0.857, 0.231), `the rings: ${JSON.stringify(rings.map((r) => [+r[0].toFixed(3), +r[1].toFixed(3)]))}`);
  const b = liquidBody();
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
  // the stream's tube: 16 rings by 8 sides, s from 0 at the top end to 1 at the head end, each ring's xz on the unit circle, every index in range
  const t = tubeGeometry();
  assert.equal(t.position.length / 3, LIQ.rings * LIQ.sides); assert.equal(t.position.length / 3, 128); assert.equal(t.index.length, 720);
  for (let i = 0; i < t.index.length; i++) assert.ok(t.index[i] < 128, `tube index ${i}`);
  for (let v = 0; v < 128; v++) { const s = t.position[v * 3 + 1]; assert.ok(Math.abs(s - Math.floor(v / 8) / 15) < 1e-6, `ring ${v}`); assert.ok(Math.abs(Math.hypot(t.position[v * 3], t.position[v * 3 + 2]) - 1) < 1e-6); }
  assert.equal(t.position[1], 0); assert.equal(t.position[127 * 3 + 1], 1);
});

test('the placement (AC2) with the tilt: the box 0.9 of the slot\'s height and inside it, the model 0.9 at 0 degrees, the slot\'s centre at the jar\'s position; the slots of the build as composed on 2026-11-02 (152 x 190 at 390 x 844, 281.6 x 352 at 1280 x 800)', () => {
  // the slot as signup.css lays it out at 390 x 844 since the one-screen composition (Sam, 2026-11-02): beside the follows' 21-glyph column, 152 x 190 at (222, 250)
  const view = { w: 390, h: 844 }, slot = { x: 222, y: 250, w: 152, h: 190 };
  const p = placeJar(slot, view);
  assert.equal(p.tilt, JAR.tiltDeg);
  assert.ok(Math.abs(tiltFactor(10) - 1.1235) < 5e-4);
  assert.ok(Math.abs(p.box.h - JAR.fill * slot.h) < 1e-9, 'the box 0.9 of the slot\'s height');
  assert.ok(Math.abs(p.px - 152.2) < 0.1, 'the model 152.2 px tall at 390');
  assert.ok(Math.abs(p.box.w - 121.6) < 0.1 && Math.abs(p.box.h - 171) < 1e-9, 'its box 121.6 x 171 at 390: the height decides');
  assert.ok(p.box.x >= slot.x && p.box.y >= slot.y && p.box.x + p.box.w <= slot.x + slot.w + 1e-9 && p.box.y + p.box.h <= slot.y + slot.h + 1e-9, 'the box inside the slot');
  assert.ok(Math.abs(p.box.x + p.box.w / 2 - (slot.x + slot.w / 2)) < 1e-9 && Math.abs(p.box.y + p.box.h / 2 - (slot.y + slot.h / 2)) < 1e-9, 'centred on the slot');
  const p0 = placeJar(slot, view, 0);
  assert.ok(Math.abs(p0.px - JAR.fill * slot.h) < 1e-9 && Math.abs(p0.box.h - p0.px) < 1e-9, 'at 0 degrees the model is 0.9 of the slot and the box is the model');
  assert.ok(Math.abs((p.scale / (2 * halfHeight())) * view.h - p.px) < 1e-6, 'the scale projects to that height');
  const hh = halfHeight(), cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
  assert.ok(Math.abs(p.x - ((cx / view.w) * 2 - 1) * hh * (view.w / view.h)) < 1e-9);
  assert.ok(Math.abs(p.y - (1 - (cy / view.h) * 2) * hh) < 1e-9);
  // the laptop's slot at 1280 x 800 (the follows' group, then the slot at 48svh, at most 27.5vw: width-bound there)
  const lap = placeJar({ x: 455.8, y: 296, w: 281.6, h: 352 }, { w: 1280, h: 800 });
  assert.ok(Math.abs(lap.px - 282) < 0.1 && Math.abs(lap.box.h - 316.8) < 1e-9 && Math.abs(lap.box.w - 225.2) < 0.1, 'at 1280 the model 282 px, the box 225.2 x 316.8');
  const wide = placeJar({ x: 0, y: 0, w: 100, h: 400 }, view);
  assert.ok(Math.abs(wide.px - 100 / JAR.width) < 1e-9, 'a narrow slot: the width decides');
});

test('the fall and the stream (section-5-liquid.md 4): fallAge the inverse of fallY, fallTime against fallY within 1e-9 and its five values within 5 ms, the radius by mass conservation under the neck along the whole fall', () => {
  for (const a of [0, 0.1, 0.3, 0.5127]) assert.ok(Math.abs(fallAge(fallY(a)) - a) < 1e-9, `fallAge(fallY(${a}))`);
  for (const L of [0, 0.25, 0.5, 0.75, 1]) assert.ok(Math.abs(fallY(fallTime(L)) - levelY(L)) < 1e-9, `fallTime(${L}) against fallY`);
  for (const [L, t] of [[0, 0.5127], [0.25, 0.462], [0.5, 0.406], [0.75, 0.3427], [1, 0.2683]] as const) near(fallTime(L), t, 0.005, `fallTime(${L})`);
  assert.ok(Math.abs(levelY(0) + 0.425) < 1e-9 && Math.abs(levelY(1) - 0.27) < 1e-9);
  assert.equal(streamRadius(LIQ.srcY), LIQ.r0);
  near(streamRadius(levelY(0)) / LIQ.r0, 0.374, 0.001, 'the radius at the floor over r0');
  near(streamRadius(0.5) * 2 * 152.2, 5.7, 0.1, 'the stream 5.7 px wide at the lip at 390 (the model 152.2 px tall in the 152 x 190 slot, 2026-11-02)');
  let prev = LIQ.r0 + 1e-9;
  for (let y = LIQ.srcY; y >= levelY(0); y -= 0.005) { const r = streamRadius(y); assert.ok(r <= prev + 1e-12, `narrowing at ${y.toFixed(3)}`); assert.ok(r < JAR.neckR, 'inside the neck'); prev = r; }
  assert.equal(LIQ.rings * LIQ.sides, 128);
});

test('the schedule (AC4, AC6): a quarter and a half from empty with the quarter switch, the extension continuous at the same pace and null past emit, the switches one fewer than the shades on every chain, the queue\'s wait, the longest chained stream under 5 s', () => {
  const q = pourSchedule(1, 0, [BB]), h = pourSchedule(2, 0, [VV, PP]);
  near(q.lead, 0.5127, 0.005, 'the lead'); assert.equal(q.pour, 0.9); near(q.total, 2.0127, 0.005, 'a quarter\'s total'); near(q.emit, 0.9507, 0.005, 'a quarter\'s emit');
  assert.deepEqual([q.switches, q.shades, q.easeIn, q.lead0], [[], [BB], true, q.lead]);
  near(h.lead, 0.5127, 0.005, 'the lead'); assert.ok(Math.abs(h.pour - 1.8) < 1e-9); near(h.total, 2.9127, 0.005, 'the half\'s total'); near(h.emit, 1.9067, 0.005, 'the half\'s emit'); near(h.landEnd, 2.3127, 0.005, 'the landing\'s end');
  assert.deepEqual([h.from, h.to, h.shades, h.lead0, h.easeIn], [0, 0.5, [VV, PP], h.lead, true]);
  assert.equal(h.switches.length, 1); near(h.switches[0], 0.9507, 0.005, 'the quarter switch: the parcel that lands as the level crosses a quarter');
  near(h.switches[0], h.lead + 0.9 - fallTime(0.25), 1e-9, 'the switch from the formula');
  assert.ok(Math.abs(h.landEnd - (h.lead + h.pour)) < 1e-12);
  const half = pourSchedule(1, 0.5, [BB]);
  near(half.total, 1.906, 0.005, 'a quarter on a half-full jar'); near(half.lead, 0.406, 0.005, 'its lead'); near(half.emit, 0.9633, 0.005, 'its emit'); assert.deepEqual(half.switches, []);
  near(pourSchedule(1, 0.75, [RR]).total, 1.8427, 0.005, 'the last quarter');
  const ih = pourSchedule(2, 0.5, [VV, PP]);
  near(ih.total, 2.806, 0.005, 'Instagram on a half-full jar'); assert.equal(ih.switches.length, 1); near(ih.switches[0], 0.9633, 0.005, 'its switch');
  assert.deepEqual(quarterSwitches(0.5, 1, half.lead), [ih.switches[0]]); assert.deepEqual(quarterSwitches(0, 0.25, q.lead), []); assert.deepEqual(quarterSwitches(0, 1, 0).length, 3);
  const clamped = pourSchedule(2, 0.75, [VV, PP]);
  assert.equal(clamped.to, 1, 'a half on three quarters is clamped at full'); assert.deepEqual([clamped.switches, clamped.shades], [[], [VV]], 'and pours one quarter of one shade');
  // the spec's example: Facebook on an empty jar, YouTube 0.8 s later
  const f = pourSchedule(1, 0, [BB]), e = extendPour(f, 1, [RR], 0.8)!;
  assert.ok(e, 'a press while emitting extends');
  near(pourLevel(f, 0.8, false), 0.0708, 0.003, 'the level at 0.8 s');
  assert.ok(Math.abs(e.from - pourLevel(f, 0.8, false)) < 1e-12 && e.to === 0.5 && e.lead === 0.8, 'rebased at the press');
  near(e.pour, 1.5453, 0.005, 'pour'); near(e.emit, 1.9393, 0.005, 'emit'); near(e.total, 2.9453, 0.005, 'total');
  assert.deepEqual([e.switches, e.shades, e.easeIn, e.lead0], [[f.emit], [BB, RR], false, f.lead]);
  // continuity: the level before and after the press within 1e-9; the slope changes by under a fifth
  assert.ok(Math.abs(pourLevel(e, 0.8, false) - pourLevel(f, 0.8, false)) < 1e-9);
  const slope = (s: ReturnType<typeof pourSchedule>, t: number) => (pourLevel(s, t + 0.005, false) - pourLevel(s, t - 0.005, false)) / 0.01;
  assert.ok(Math.abs(slope(e, 0.81) / slope(f, 0.79) - 1) < 0.2, `the pace ${slope(f, 0.79).toFixed(3)} to ${slope(e, 0.81).toFixed(3)}`);
  assert.ok(Math.abs(slope(e, 1.2) - 0.25 / 0.9 / (1 - LIQ.ease / 2 / e.pour)) < 0.02, 'the same pace a quarter per 0.9 s on the flat');
  // the frames' example: the jar at a half, Facebook pressed and YouTube at 0.3 s, inside Facebook's lead: rebased at the lead with the ease kept
  const x = extendPour(half, 1, [RR], 0.3)!;
  assert.ok(x.lead === half.lead && x.easeIn && x.from === 0.5 && x.to === 1 && x.lead0 === half.lead);
  near(x.pour, 1.8, 1e-9, 'pour'); near(x.emit, 1.9377, 0.005, 'emit'); near(x.total, 2.806, 0.005, 'total');
  assert.deepEqual([x.switches, x.shades], [[half.emit], [BB, RR]]);
  // a press before the lead keeps the lead and the start ease; one at or past emit is queued; Instagram's own quarter switch rides along
  const early = extendPour(f, 2, [VV, PP], 0.1)!;
  assert.ok(early.lead === f.lead && early.easeIn && early.from === 0 && early.to === 0.75);
  assert.deepEqual(early.shades, [BB, VV, PP]); assert.equal(early.switches.length, 2); assert.equal(early.switches[0], f.emit);
  near(early.switches[1], f.lead + (0.5 - 0) * 3.6 - fallTime(0.5), 1e-9, 'the new press\'s quarter switch at the half');
  assert.equal(extendPour(f, 1, [RR], f.emit), null); assert.equal(extendPour(f, 1, [RR], f.emit + 0.1), null);
  near(fallTime(0.75) + LIQ.tail, 0.9427, 0.005, 'the queue\'s longest wait'); assert.ok(fallTime(0.75) + LIQ.tail < 1);
  // every chain of three presses, each at the last emitting moment: the invariant, at most three switches and four shades, the total under 5 s
  let longest = 0;
  for (const o of ORDERS.filter((x) => x.length === 3)) {
    let s = pourSchedule(F(o[0]).worth, 0, F(o[0]).shades);
    for (const id of o.slice(1)) { s = extendPour(s, F(id).worth, F(id).shades, s.emit - 1e-6)!; assert.ok(s); assert.equal(s.switches.length, s.shades.length - 1, `the invariant after ${id}`); for (let k = 1; k < s.switches.length; k++) assert.ok(s.switches[k] > s.switches[k - 1], 'the switches ascend'); }
    assert.equal(s.switches.length, 3); assert.equal(s.shades.length, 4); assert.equal(s.to, 1);
    assert.deepEqual(s.shades, o.flatMap((id) => [...F(id).shades]));
    assert.ok(s.total < 5, `the longest chained stream under 5 s (WCAG 2.2.2): ${s.total.toFixed(2)} s for ${o.join(', ')}`);
    longest = Math.max(longest, s.total);
  }
  assert.ok(longest > 4.5 && longest < 5, `the longest chain ${longest.toFixed(3)} s`);
  for (const o of ORDERS) { let s: ReturnType<typeof pourSchedule> | null = null; for (const id of o) s = s ? extendPour(s, F(id).worth, F(id).shades, 0.05) : pourSchedule(F(id).worth, 0, F(id).shades); if (s) assert.equal(s.switches.length, s.shades.length - 1, `the invariant for ${o.join(', ')} pressed at once`); }
});

test('the ramp, the level and the parcels (AC4, AC8): monotonic with 0.5 at the middle, the mean pace exact, reduced instant; parcelShade over the switch chains', () => {
  const len = 0.9, e = LIQ.ease;
  assert.equal(ramp(0, len, e), 0); assert.equal(ramp(len, len, e), 1); assert.equal(ramp(-1, len, e), 0); assert.equal(ramp(2, len, e), 1);
  assert.ok(Math.abs(ramp(len / 2, len, e) - 0.5) < 1e-12, 'the middle');
  let prev = 0;
  for (let t = 0; t <= len; t += 0.001) { const v = ramp(t, len, e); assert.ok(v >= prev - 1e-12, `monotonic at ${t}`); prev = v; }
  const flat = (ramp(0.5, len, e) - ramp(0.4, len, e)) / 0.1;
  assert.ok(Math.abs(flat - 1 / (len - e)) < 1e-9, 'linear between the eases at the flat\'s pace');
  assert.ok(ramp(0.3, len, e, false) > ramp(0.3, len, e), 'without the start ease the line is ahead');
  assert.ok(Math.abs((ramp(0.2, len, e, false) - ramp(0.1, len, e, false)) / 0.1 - 1 / (len - e / 2)) < 1e-9);
  const s = pourSchedule(2, 0, [VV, PP]);
  assert.equal(pourLevel(s, 0, false), 0); assert.equal(pourLevel(s, s.lead, false), 0); assert.equal(pourLevel(s, s.lead + s.pour, false), 0.5); assert.equal(pourLevel(s, 0, true), 0.5);
  assert.ok(Math.abs(pourLevel(s, s.lead + 0.9, false) - 0.25) < 1e-9, 'a quarter at lead + 0.9');
  assert.ok(Math.abs(pourLevel(s, s.lead + s.pour / 2, false) - 0.25) < 1e-9, 'the mean of from and to at the middle');
  near(pourLevel(s, 1.4, false), 0.246, 0.001, 'the level at the 1.40 s frame');
  near(pourLevel(pourSchedule(1, 0.5, [BB]), 1.0, false), 0.673, 0.001, 'the level at the second press\'s 1.0 s frame');
  assert.deepEqual([parcelShade(0.5, [], [VV]), parcelShade(0.5, [0.951], [BB, RR]), parcelShade(1.2, [0.951], [BB, RR]), parcelShade(2.5, [0.951, 1.939], [BB, RR, VV])], [VV, BB, RR, VV]);
  assert.deepEqual([parcelShade(0.3, s.switches, s.shades), parcelShade(1.0, s.switches, s.shades)], [VV, PP], 'Instagram\'s parcels violet then pink');
  assert.deepEqual([parcelShade(1, [0.95, 1.9, 2.8], [BB, RR, VV, PP]), parcelShade(3, [0.95, 1.9, 2.8], [BB, RR, VV, PP])], [RR, PP]);
});

test('the span and the envelopes (AC3, AC4, AC11): the head at 0.15 s within the mouth, at the surface from the landing, the top at the source until emit then falling, null from the landing\'s end; the ripple\'s and the dimple\'s weights 0 before the lead and at the total, 1 while the stream lands, the one rebound', () => {
  const s = pourSchedule(2, 0, [VV, PP]);
  const a = streamSpan(0.15, s)!;
  assert.ok(a); assert.equal(a.top, LIQ.srcY); near(a.head, 0.4775, 1e-9, 'the head at 0.15 s'); assert.equal(a.topTip, 0); assert.equal(a.headTip, LIQ.tip);
  assert.ok(streamSpan(0.13, s)!.head > 0.5 && streamSpan(0.14, s)!.head < 0.5, 'the head at the lip at about 0.13 s');
  const b = streamSpan(0.55, s)!;
  near(b.head, levelY(pourLevel(s, 0.55, false)) - LIQ.sink, 1e-9, 'the head sunk under the surface once landed'); assert.equal(b.headTip, 0); assert.equal(b.top, LIQ.srcY); assert.equal(b.topTip, 0);
  const c = streamSpan(s.emit + 0.2, s)!;
  near(c.top, fallY(0.2), 1e-9, 'the top falling from emit'); assert.equal(c.topTip, LIQ.tip); assert.ok(c.top < LIQ.srcY);
  const d = streamSpan(s.landEnd - 1e-3, s)!;
  assert.ok(d && d.top > d.head && d.top - d.head < 0.03, 'the last of the column just over the surface');
  assert.equal(streamSpan(s.landEnd, s), null); assert.equal(streamSpan(s.total, s), null); assert.equal(streamSpan(-0.1, s), null);
  assert.deepEqual(streamSpan(0, s), { top: LIQ.srcY, head: LIQ.srcY, topTip: 0, headTip: LIQ.tip }, 'a zero-length span at the press (the warm-up\'s shape)');
  for (let t = 0.01; t < s.landEnd; t += 0.01) { const sp = streamSpan(t, s); assert.ok(sp && sp.top > sp.head && sp.top <= LIQ.srcY, `the span at ${t.toFixed(2)}`); }
  // the weights
  for (const t of [0, 0.3, s.lead]) { assert.equal(rippleWeight(t, s), 0); assert.equal(dimpleWeight(t, s), 0); }
  near(rippleWeight(s.lead + LIQ.rippleIn / 2, s), 0.5, 1e-9, 'rising');
  assert.equal(rippleWeight(s.lead + LIQ.rippleIn, s), 1); assert.equal(dimpleWeight(s.lead + LIQ.rippleIn, s), 1);
  assert.equal(rippleWeight(s.lead + 0.9, s), 1); assert.equal(dimpleWeight(s.lead + 0.9, s), 1); assert.equal(rippleWeight(s.landEnd, s), 1);
  near(rippleWeight(s.landEnd + LIQ.tail / 2, s), 0.5, 1e-9, 'falling over the tail');
  for (const t of [s.total, s.total + 0.1, s.total + 5]) { assert.equal(rippleWeight(t, s), 0); assert.equal(dimpleWeight(t, s), 0); }
  assert.ok(rippleWeight(s.total - 1e-6, s) > 0 && rippleWeight(s.total - 1e-6, s) < 1e-6, 'exactly 0 at the total, not before');
  // the rebound: a damped cosine from the landing's end, crossing 0 within 0.13 s, a bump at 0.25 s, under 0.05 of the depth by the tail's end
  assert.ok(dimpleWeight(s.landEnd + 0.12, s) > 0 && dimpleWeight(s.landEnd + 0.13, s) < 0, 'crossing 0 at a quarter period');
  assert.ok(dimpleWeight(s.landEnd + 0.25, s) < -0.1, 'the bump');
  near(dimpleWeight(s.landEnd + 0.25, s), -Math.exp(-0.25 / LIQ.reboundDecay) * rippleWeight(s.landEnd + 0.25, s), 1e-9, 'the cosine at half a period');
  assert.ok(Math.abs(dimpleWeight(s.total - 0.001, s)) < 0.05 && Math.abs(dimpleWeight(s.landEnd + 0.5, s)) < 0.05, 'under 0.05 by the tail\'s end');
  let prev = 1;
  for (let t = s.landEnd; t <= s.total; t += 0.01) { const w = rippleWeight(t, s); assert.ok(w <= prev + 1e-12, 'the ripple falls through the tail'); prev = w; }
  // a press that rebased the stream keeps the first landing: the ripple runs from lead0
  const x = extendPour(pourSchedule(1, 0, [BB]), 1, [RR], 0.8)!;
  assert.equal(rippleWeight(0.8, x), 1); assert.equal(rippleWeight(x.lead0 + 0.05, x), rippleWeight(x.lead0 + 0.05, pourSchedule(1, 0, [BB])));
});

test('the slopes and the dye (AC11): the dimple\'s slope the derivative of its well by finite differences, the rings 13 percent at the wall and periodic, the meniscus over the outer 0.02, the chord and the cap\'s path, transmit giving each shade back at the reference chord, the table of section 3 over the fog and over night, the scatter', () => {
  // the dimple: a well of dimpleDepth at the centre with a raised rim, its slope the derivative
  near(dimpleHeight(0), -LIQ.dimpleDepth, 1e-12, 'the well\'s depth'); assert.equal(dimpleSlope(0), 0);
  assert.ok(dimpleHeight(LIQ.dimpleR * 1.5) > 0, 'the rim rises');
  for (const rho of [0.005, 0.01, 0.02, 0.035, 0.05, 0.08]) near(dimpleSlope(rho), (dimpleHeight(rho + 1e-6) - dimpleHeight(rho - 1e-6)) / 2e-6, 1e-5, `the slope at ${rho}`);
  near(dimpleSlope(LIQ.dimpleR), (2 * LIQ.dimpleDepth / LIQ.dimpleR) * Math.exp(-1), 1e-12, 'the slope at the radius (1 + c - c)');
  // the rings: the slope bounded by the decay, 13 percent at the wall, one period every rippleLen / rippleSpeed seconds
  for (const [rho, t] of [[0.05, 0.3], [0.2, 1], [0.371, 2.2]] as const) assert.ok(Math.abs(rippleSlope(rho, t)) <= LIQ.rippleSlope * Math.exp(-LIQ.rippleDecay * rho) + 1e-12);
  near(Math.exp(-LIQ.rippleDecay * JAR.innerR), 0.13, 0.002, '13 percent at the wall');
  const period = LIQ.rippleLen / LIQ.rippleSpeed;
  near(period, 0.257, 0.001, 'a ring every 0.257 s');
  near(rippleSlope(0.1, 0.4), rippleSlope(0.1, 0.4 + period), 1e-9, 'periodic in time'); near(rippleSlope(0.1, 0.4), rippleSlope(0.1 + LIQ.rippleLen, 0.4) / Math.exp(-LIQ.rippleDecay * LIQ.rippleLen), 1e-9, 'periodic along the radius');
  // the meniscus: 0 inside, the tilt at the glass
  assert.equal(meniscusSlope(0.2, 0.371), 0); assert.equal(meniscusSlope(0.371 - LIQ.meniscus[0], 0.371), 0); near(meniscusSlope(0.371, 0.371), LIQ.meniscus[1], 1e-12, 'at the glass'); near(meniscusSlope(0.371 - LIQ.meniscus[0] / 2, 0.371), LIQ.meniscus[1] / 2, 1e-12, 'half way');
  assert.equal(smoothstep(0, 1, 0.5), 0.5); assert.equal(smoothstep(0, 1, -1), 0); assert.equal(smoothstep(0, 1, 2), 1);
  // the chord and the cap's path
  near(LIQ.d0, 2 * JAR.innerR, 1e-12, 'the reference chord is the jar\'s width inside'); near(chord(1, JAR.innerR), LIQ.d0, 1e-12, 'the centre of the front wall');
  assert.equal(chord(0, JAR.innerR), 0);
  near(capPath(0.695 * 0.25, 0.19), 0.257, 0.001, 'a quarter\'s surface at the view\'s geometry'); assert.equal(capPath(10, 1), LIQ.d0); near(capPath(0.3, 1), 0.3, 1e-12, 'face on, the height itself');
  // transmit: the reference chord gives the shade back within 1 of 255 (the floor 1e-6 encodes a zero channel to 0), 0 gives the background, the rim lighter than the centre
  const hexOfId = (id: string) => SHADES.find((s) => s.id === id)!.hex;
  for (const id of [BB, RR, VV, PP, 'blissful-blue-11', 'vivid-violet-11']) {
    const hex = hexOfId(id), c = linearOf(hex), back = hexOf(transmit(c, LIQ.d0));
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(parseInt(back.slice(1 + 2 * k, 3 + 2 * k), 16) - parseInt(hex.slice(1 + 2 * k, 3 + 2 * k), 16)) <= 1, `${id}: ${back} against ${hex}`);
    assert.deepEqual(transmit(c, 0), [1, 1, 1]);
    assert.ok(lum(transmit(c, 0.2 * LIQ.d0)) > lum(transmit(c, LIQ.d0)), 'thinner, lighter');
    for (const x of c) assert.ok(x >= LIQ.floor, 'floored');
  }
  near(linearOf('#ffffff')[0], 1, 1e-12, 'white'); assert.equal(linearOf('#000000')[0], LIQ.floor); assert.equal(hexOf([0, 0, 0]), '#000000'); assert.equal(hexOf([1, 1, 1]), '#ffffff'); assert.equal(GAMMA, 2.2);
  assert.deepEqual(PEARL_LINEAR, linearOf(PEARL_WHISPER));
  // the table of section 3 at the centre chord over the measured fog (the mean of the two widths) and over --night, the twin end to end within 2 of 255;
  // on a shade's own zero channel the floor decides the number (1e-6 here, D11; the table's 1e-4 reads 3), so there the twin reads under the table
  const fog = [166, 171, 184].map((v) => Math.pow(v / 255, GAMMA)) as Rgb, night = [5, 5, 6].map((v) => Math.pow(v / 255, GAMMA)) as Rgb;
  const TABLE: [string, string, string, string][] = [[BB, '#035498', '#0377cf', '#005a96'], [RR, '#9b0b19', '#e21022', '#ad0c19'], [VV, '#573896', '#7f51cf', '#623e97'], [PP, '#a5036b', '#ec038f', '#b30067'], ['blissful-blue-11', '#0a2b91', '#103fcc', '#0c3199'], ['vivid-violet-11', '#5e0b8a', '#8c10c0', '#6d0c8f']];
  const ch = (hex: string, k: number) => parseInt(hex.slice(1 + 2 * k, 3 + 2 * k), 16);
  for (const [id, alone, shown, overNight] of TABLE) {
    const hex = hexOfId(id), c = linearOf(hex), T = transmit(c, LIQ.d0);
    const got = [hexOf(fog.map((b, i) => b * T[i]) as Rgb), hexOf(seen(fog, c, LIQ.d0)), hexOf(seen(night, c, LIQ.d0))];
    [alone, shown, overNight].forEach((want, col) => { for (let k = 0; k < 3; k++) { const zero = ch(hex, k) === 0, dv = ch(got[col], k) - ch(want, k); assert.ok(zero ? dv <= 0 && dv >= -4 : Math.abs(dv) <= 2, `${id} column ${col}: ${got[col]} against ${want}`); } });
  }
  // the scatter: the shade under the light, weighted by what the chord took; nothing at d 0 (T 1), the body over night
  assert.deepEqual(scatter([0.5, 0.5, 0.5], [1, 1, 1]), [0, 0, 0]);
  const azure = linearOf(hexOfId(BB)), S = scatter(azure, transmit(azure, LIQ.d0));
  near(S[2], azure[2] * (1 - lum(transmit(azure, LIQ.d0))) * LIQ.scatter * PEARL_LINEAR[2], 1e-12, 'the scatter\'s blue');
  assert.ok(lum(seen(night, azure, LIQ.d0)) > 0.05, 'a body over night');
  near(seen(fog, azure, 0)[1], fog[1] + 0, 1e-12, 'at the silhouette the fog');
});

test('the bands (AC8, D7): layerBands over the sixteen orders, one band per quarter of worth padded with 1 and the last shade, bandColour exactly a band away from a top and the midpoint mix at one', () => {
  assert.deepEqual(layerBands(['instagram']), { tops: [0.25, 0.5, 1, 1], shades: [VV, PP, PP, PP] });
  assert.deepEqual(layerBands(['facebook', 'youtube', 'instagram']), { tops: [0.25, 0.5, 0.75, 1], shades: [BB, RR, VV, PP] });
  assert.deepEqual(layerBands(['instagram', 'facebook']), { tops: [0.25, 0.5, 0.75, 1], shades: [VV, PP, BB, BB] });
  assert.deepEqual(layerBands(['instagram', 'facebook', 'youtube']), { tops: [0.25, 0.5, 0.75, 1], shades: [VV, PP, BB, RR] });
  assert.deepEqual(layerBands([]), { tops: [1, 1, 1, 1], shades: [BB, BB, BB, BB] });
  assert.deepEqual(layerBands(['nobody', 'youtube']), { tops: [0.25, 1, 1, 1], shades: [RR, RR, RR, RR] });
  for (const o of ORDERS) {
    const { tops, shades } = layerBands(o), want = o.flatMap((id) => [...F(id).shades]);
    let acc = 0;
    want.forEach((id, k) => { acc += 1 / WORTH_TOTAL; assert.ok(Math.abs(tops[k] - acc) < 1e-12); assert.equal(shades[k], id); });
    assert.equal(tops[3], 1);
  }
  const i = layerBands(['instagram']), cols: Rgb[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0]];
  assert.deepEqual(bandColour(0.1, i.tops, cols), [1, 0, 0]); assert.deepEqual(bandColour(0.25 - 0.03, i.tops, cols), [1, 0, 0]); assert.deepEqual(bandColour(0.25 + 0.03, i.tops, cols), [0, 1, 0]);
  assert.deepEqual(bandColour(0.25, i.tops, cols), [0.5, 0.5, 0]); assert.deepEqual(bandColour(0.5, i.tops, cols), [0, 0.5, 0.5]);
  assert.deepEqual(bandColour(0.7, i.tops, cols), [0, 0, 1]); assert.deepEqual(bandColour(1, i.tops, cols), [0.5, 0.5, 0.5], 'the padded top at 1 mixes the last two at the very top alone');
  const all = layerBands(['facebook', 'youtube', 'instagram']);
  assert.deepEqual([bandColour(0.27, all.tops, cols), bandColour(0.6, all.tops, cols), bandColour(0.98, all.tops, cols)], [[0, 1, 0], [0, 0, 1], [1, 1, 0]], 'four bands, each exactly its colour inside');
  assert.deepEqual(bandColour(0.75, all.tops, cols), [0.5, 0.5, 0.5]); assert.deepEqual(bandColour(0.74, all.tops, cols), [0, 0, 1]); assert.deepEqual(bandColour(0.76, all.tops, cols), [1, 1, 0]);
  assert.equal(LIQ.seam, 0.01);
  near(LIQ.seam * 2 * 0.695 * 152.2, 2.12, 0.05, 'the seam 2.1 px tall at 390 (the model 152.2 px tall in the 152 x 190 slot, 2026-11-02)');
});

test('the shaders (AC11): no numeric literal of a LIQ or JAR value, every uniform in its object, the body opaque writing depth and the stream blended writing none, their render orders, no culling, the fog\'s objects shared, every varying assigned, no clock read at rest, the glass byte for byte', () => {
  const values = new Set<number>();
  for (const o of [LIQ, JAR]) for (const v of Object.values(o)) { if (typeof v === 'number') values.add(v); else if (Array.isArray(v)) for (const x of (v as readonly (number | readonly number[])[]).flat()) values.add(x as number); }
  for (const x of [0, 0.5, 1, 2]) values.delete(x);   // the structural numbers (halves, doubles) a shader cannot do without
  assert.ok(values.has(0.62) && values.has(0.371) && values.has(0.9) && values.has(6) && values.has(0.742) && values.has(0.04) && values.has(0.35) && values.has(64) && values.has(0.2));
  for (const name of SHADERS) {
    const s = glsl(name);
    for (const m of s.matchAll(/(?<![\w.])(\d+\.?\d*(?:e-?\d+)?)(?![\w.])/g)) assert.ok(!values.has(parseFloat(m[1])), `${name}: the literal ${m[1]} is a LIQ or JAR value`);
    for (const m of s.matchAll(/uniform\s+\w+\s+([^;]+);/g)) for (const u of m[1].split(',').map((x) => x.trim())) assert.match(chunk, new RegExp(`\\b${u}: (\\{|col\\()`), `${name}: the uniform ${u} in a uniforms object`);
    const varyings = [...s.matchAll(/varying\s+\w+\s+([^;]+);/g)].flatMap((m) => m[1].split(',').map((x) => x.trim()));
    assert.ok(varyings.length >= 4, `${name}'s varyings: ${varyings.join(', ')}`);
    if (name.endsWith('VERT')) for (const v of varyings) assert.match(s, new RegExp(`\\b${v}\\s*=\\s*`), `${name}: ${v} assigned`);
    assert.doesNotMatch(s, /\/\/|\/\*/, `${name}: no comment inside the string (the strip reads them, the budget pays for them)`);
  }
  const frag = glsl('LIQ_FRAG'), vert = glsl('LIQ_VERT'), sv = glsl('STREAM_VERT'), sf = glsl('STREAM_FRAG');
  assert.match(frag, /texture2D\(tMap,gl_FragCoord\.xy\/uRes-n\.xy\*uRf\.xy\*\(1\.0-ndv\*uRf\.z\)\)/, 'the fog sampled behind the fragment, bent by the liquid\'s own refraction');
  assert.match(chunk, /liqU\.uRf\.value\[0\] = \(LIQ\.refract \* px\) \/ w; liqU\.uRf\.value\[1\] = \(LIQ\.refract \* px\) \/ h;/, 'the offset from the placement as the glass\'s');
  assert.match(frag, /mix\(texture2D\(tMap[^;]*,uFlat,uUseFlat\)/, 'the still\'s flat night as the quad\'s');
  assert.match(frag, /pow\(c,vec3\(d\/uD0\)\)/, 'the transmission along the chord');
  assert.match(frag, /2\.0\*rho\*ndv/, 'the wall\'s chord'); assert.match(frag, /uEta\)/, 'the cap\'s refracted path');
  assert.match(frag, /uSc\*uW/, 'the scatter'); assert.match(frag, /smoothstep\(uB\.x-uE,uB\.x\+uE,hf\)/, 'the soft seam');
  assert.doesNotMatch(frag, /uDeep|deepen/, 'no vertical darkening (D3)');
  assert.match(frag, /uRw\*uRp\.x\*sin\(uRp\.y\*rho-uRp\.z\*uT\)\*exp\(-uRp\.w\*rho\)/, 'the rings as a slope'); assert.match(frag, /uDw\*uDm\.x\*u\*exp\(-u\*u\)/, 'the dimple as a slope'); assert.match(frag, /uMn\.y/, 'the meniscus');
  assert.match(frag, /reflect\(-v,n\)/, 'the studio reflection'); assert.match(frag, /pow\(max\(dot\(n,h\),0\.0\),uSp\.x\)\*uSp\.y/, 'the highlight'); assert.match(frag, /F\*uSn/, 'the sheen');
  assert.match(vert, /p\.y=yl/, 'the clamp at the level'); assert.match(vert, /min\(1\.0,uC\/r\)/, 'the cap inside the interior\'s radius');
  assert.doesNotMatch(vert + frag, /uTk|uN\b|uLand|uDn/, 'no world-level plane, tangent, fall direction or landing offset (D1)');
  assert.match(sv, /mix\(uSpan\.x,uSpan\.y,s\)/, 'the span'); assert.match(sv, /uH\.w\*sqrt\(uH\.y\/v\)/, 'the radius by mass conservation'); assert.match(sv, /smoothstep\(0\.0,uFd,uH\.z-y\)/, 'the fade-in');
  assert.match(sv, /te<uSw\.x\?uS0:te<uSw\.y\?uS1:te<uSw\.z\?uS2:uS3/, 'the shade chain'); assert.doesNotMatch(sv, /sin\(|wob|rope|sway/i, 'no sway, no wobble (D5)');
  assert.match(sf, /pow\(max\(dot\(n,h\),0\.0\),uSt\.x\)\*uSt\.y/, 'the streak'); assert.match(sf, /uAl\.x\*vA\*smoothstep\(0\.0,uAl\.y,/, 'the silhouette fade');
  assert.doesNotMatch(chunk, /\bPoints\b|DataTexture|texelFetch|AdditiveBlending|setDrawRange|glslVersion/, 'no particles, no palette, no additive blending, three\'s own prefix');
  assert.match(chunk, /new ShaderMaterial\(\{ uniforms: liqU, vertexShader: LIQ_VERT, fragmentShader: LIQ_FRAG, transparent: false, depthTest: true, depthWrite: true, side: FrontSide \}\)/, 'the body opaque, writing depth');
  assert.match(chunk, /new ShaderMaterial\(\{ uniforms: tubeU, vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG, transparent: true, depthTest: true, depthWrite: false \}\)/, 'the stream blended, writing no depth');
  assert.match(chunk, /liquid\.frustumCulled = false; liquid\.visible = false; liquid\.renderOrder = 0;/); assert.match(chunk, /tube\.frustumCulled = false; tube\.visible = false; tube\.renderOrder = 1;/);
  assert.match(chunk, /tMap: copyU\.tMap, uRes: copyU\.uRes, uFlat: copyU\.uFlat, uUseFlat: copyU\.uUseFlat/, 'the copy material\'s own objects');
  assert.match(chunk, /uSpan: \{ value: new Float32Array\(\[LIQ\.srcY, LIQ\.srcY\]\) \}/, 'the tube compiled at a zero-length span');
  assert.match(chunk, /liquid\.visible = true; tube\.visible = true; glass\.visible = true;\n\s*await compile/, 'the warm-up with the tube visible');
  // no clock at rest: advance() returns before any read of the loop's time when there is no stream, and uT is written there alone
  assert.match(chunk, /function advance\(\) \{\n\s*const s = stream;\n\s*if \(!s\) return;\n\s*const t = clock\(s\)/);
  assert.equal((chunk.match(/uT\.value = /g) ?? []).length, 1); assert.match(chunk, /light\.uT\.value = t;/);
  assert.match(chunk, /setRipple\(rippleWeight\(t, sc\), dimpleWeight\(t, sc\)\)/); assert.match(chunk, /setLevel\(s\.sched\.to\); setRipple\(0, 0\);/, 'exactly 0 at the total');
  for (const w of ['linearOf(hexOf(id))', 'const hexOf = (id: string): string => hexes.get(id) ?? NIGHT;']) assert.ok(chunk.includes(w), `${w}: the colours from the links, in linear light, floored`);
  assert.doesNotMatch(chunk, /pointermove|mousemove|pointerenter|mouseenter/, 'nothing on the jar answers the pointer (rule 48)');
  assert.doesNotMatch(dom, /pointermove|mousemove|pointerenter|mouseenter/);
  for (const [name, sha] of [['GLASS_VERT', 'c4c983c587bea52d935097f3f6c35f78f0a36d19689a00e02b881467391b2a84'], ['GLASS_FRAG', '87c9dde45b3c97612cfc2736520d36052c4ee3d982d857fe6dc6e849ba937f0e']]) assert.equal(createHash('sha256').update(glsl(name)).digest('hex'), sha, `${name} byte for byte as committed on 2026-10-28`);
  assert.doesNotMatch(chunk, /MeshPhysicalMaterial|transmission/, 'our own glass, no transmission pass (D10)');
  assert.doesNotMatch(chunk, /InstancedBufferGeometry|SphereGeometry|packBeads|grainSeeds|moundAt|DUST\b|POUR\b/, 'the beads, the grains, the heap and the dust are gone');
  assert.doesNotMatch(maths, /grainY|grainOwner|layerTops|layerOwner|conePeak|restMound|moundAt|seeded|grainSeeds|cells\(|DUST|POUR/, 'the pure functions of the grains are gone');
});

test('plain text (AC10; rules 5, 6, 11, 25, 39): signup.css carries no fill but none, transparent, --night or --skeleton, no border but the field\'s line and the focus ring, no shadow or filter, no radius, the quiz\'s type, nothing animated, hover on the links alone; the one-screen composition (Sam, 2026-11-02): the body never a fixed height or a clip, the jar beside the follows on a phone, the form in one cell, the short phone with the form on its floors, the tablet\'s and the laptop\'s grids', () => {
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
  // the body (Sam, 2026-11-02: everything on one screen): never a fixed height or a clip, at least the dynamic viewport
  // tall, its content centred under the logotype's band; two sizes derived from the quiz's (the headings held to one line
  // of the headline on a phone, the credit and the message line to one line of 40 glyphs, never under 13 px)
  assert.match(css, /\.su-body \{\n {2}--su-gap: var\(--s3\);\n {2}--su-fs-h: min\(var\(--su-fs-q\), calc\(\(100vw - 2 \* var\(--inset\)\) \/ 14\.6\)\);\n {2}--su-fs-s: max\(13px, min\(var\(--su-fs\), calc\(\(100vw - 2 \* var\(--inset\)\) \/ 24\.6\)\)\);/);
  assert.match(css, /align-content: center; gap: var\(--su-gap\);/);
  assert.match(css, /min-height: 100vh; min-height: 100dvh;/);
  for (const { sel, body } of rules) if (/\.su-body\b/.test(sel)) assert.doesNotMatch(body, /(^|[;\s])(height|max-height|overflow(-x|-y)?)\s*:/, `the body never a fixed height or a clip: ${sel}`);
  // the jar block on a phone: the label across, the follows and the count line in a 21-glyph column beside the slot at
  // 4 : 5 (152 x 190 at 390 x 844), each state under its word inside the word's 44 px row, the count line at the slot's foot
  assert.match(css, /\.su-jar \{ display: grid; grid-template-columns: calc\(21ch \+ 1px\) minmax\(0, 1fr\); grid-template-areas: "jh jh" "follows slot" "count slot"; column-gap: var\(--s3\); row-gap: var\(--s1\); width: 100%; \}/);
  assert.match(css, /\.su-collect \{ display: contents; \}/);
  assert.match(css, /\.su-follows \{ grid-area: follows; list-style: none; padding: 0; display: grid; gap: var\(--s1\); align-self: start; \}/);
  assert.match(css, /\.su-count \{ grid-area: count; align-self: end; \}/);
  assert.match(css, /\.su-slot \{ grid-area: slot; position: relative; width: 100%; aspect-ratio: 4 \/ 5; align-self: start; \}/);
  assert.match(css, /\.su-follow-row \{ display: grid; min-height: 44px; \}/);
  assert.match(css, /\.su-follow-row > \.su-state \{ align-self: end; pointer-events: none; \}/);
  assert.match(css, /\.su-count, \.su-state \{ font-variant-numeric: tabular-nums; \}/);
  // the form keeps one height: the fields and the done line in one cell, the three messages on one reserved line; the
  // field and "Save my colours" on one row
  assert.match(css, /\.su-form > \.su-fields, \.su-form > \.su-done \{ grid-area: 1 \/ 1; align-self: start; \}/);
  assert.match(css, /\.su-form > \.su-fields\[hidden\], \.su-form > \.su-done\[hidden\] \{ display: grid; visibility: hidden; \}/);
  assert.match(css, /grid-template-areas: "label label" "input send" "check check" "msg msg" "fine fine";/);
  assert.match(css, /\.su-fields > \.su-err, \.su-fields > \.su-msg \{ grid-area: msg; min-height: 1\.45em; font-size: var\(--su-fs-s\); \}/);
  // a short phone with the form (data-leads), under 780 px tall: the label on the field's row, the rows touching, the
  // slot as tall as the follows and the count line, the band 34 px, the type by the height on its floors (13 px the
  // lines, 20 px the headings; the field keeps its 16 px); every rule behind the form's marker, so production is untouched
  const g1 = css.slice(css.indexOf('@media (max-width: 719px) and (max-height: 779px) {'), css.indexOf('@media (min-width: 720px) {'));
  assert.ok(css.includes('@media (max-width: 719px) and (max-height: 779px) {') && g1.length > 200, 'the short phone with the form');
  assert.match(g1, /\.signup\[data-leads\] \.su-body \{\n\s*--su-fs-l: clamp\(13px, 1\.95svh, var\(--su-fs\)\);\n\s*--su-fs-h: clamp\(20px, 3\.2svh, min\(var\(--su-fs-q\), calc\(\(100vw - 2 \* var\(--inset\)\) \/ 14\.6\)\)\);\n\s*--su-fs-s: max\(13px, min\(var\(--su-fs-l\), calc\(\(100vw - 2 \* var\(--inset\)\) \/ 24\.6\)\)\);\n\s*font-size: var\(--su-fs-l\);/);
  assert.match(g1, /padding-top: calc\(var\(--inset\) \+ 34px \+ env\(safe-area-inset-top, 0px\)\);/);
  assert.match(g1, /\.signup\[data-leads\] \.su-follows \{ gap: 0; \}/);
  assert.match(g1, /\.signup\[data-leads\] \.su-follow-row > \.su-state \{ align-self: start; margin-top: 1\.45em; \}/);
  assert.match(g1, /\.signup\[data-leads\] \.su-slot \{ width: min\(100%, calc\(\(3 \* 44px \+ var\(--s1\) \+ 1\.45em\) \* 0\.8\)\); justify-self: end; \}/);
  assert.match(g1, /grid-template-areas: "label input send" "check check check" "msg msg msg" "fine fine fine";/);
  const g1rules = [...g1.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => m[1].trim());
  assert.ok(g1rules.length >= 6);
  for (const sel of g1rules) assert.match(sel, /^\.signup\[data-leads\] /, `only with the form: ${sel}`);
  assert.match(css, /\.su-input \{[^}]*font-size: 16px;/, 'the field keeps 16 px');
  // from 720 px the follows left of the jar (the state's box nine glyphs wide), the slot by the height; from 1180 px the
  // head across, the jar group beside the save block, the foot as one row
  assert.match(css, /@media \(min-width: 720px\) \{\n\s*\.su-body \{ --su-gap: var\(--s4\); --su-slot-h: clamp\(240px, 36svh, 400px\);/);
  assert.match(css, /\.su-jar \{ grid-template-columns: max-content calc\(var\(--su-slot-h\) \* 0\.8\); grid-template-areas: "collect slot";/);
  assert.match(css, /\.su-slot \{ width: calc\(var\(--su-slot-h\) \* 0\.8\); \}/);
  assert.match(css, /\.su-follow-row \{ display: flex; justify-content: space-between; align-items: center; gap: var\(--s3\); \}/);
  assert.match(css, /\.su-follow-row > \.su-state \{ align-self: auto; pointer-events: auto; min-width: calc\(9ch \+ 1px\); \}/);
  assert.match(css, /@media \(min-width: 1180px\) \{\n\s*\.su-body \{ --su-slot-h: clamp\(240px, min\(48svh, 27\.5vw\), 520px\); max-width: calc\(1440px \+ 2 \* var\(--inset\)\); grid-template-columns: max-content minmax\(0, 32em\); grid-template-areas: "head head" "jar save" "foot foot";/);
  assert.match(css, /\.su-head, \.su-foot \{ contain: inline-size; \}/);
  assert.doesNotMatch(css, /su-jars \{|su-word|repeat\(4/, 'the four-jar grid is gone');
});

test('the markup (AC1, AC9, AC10): one slot named for assistive technology, the empty jar\'s picture alone with a decorative image, three rows whose links carry their shades\' hexes, every line through the decode, the credit, the form, no style attribute, no emoji', () => {
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
  assert.match(chunk, /if \(reduced\) \{ setLevel\(yoursLevel\(order\)\); poured\(id\); return; \}/, 'reduced motion: the level at once, no stream');
  assert.match(dom, /if \(follows\.length\) window\.dispatchEvent\(new CustomEvent\('skreed:signup', \{ detail: \{ id: '', follows: \[\.\.\.follows\] \} \}\)\);/, 'the mount tells the island its saved follows');
  assert.doesNotMatch(dom, /ms: /, 'the island owns the timing');
  // the hooks fold (D10): still, scrub, tilt and hooks inside one block the production build drops
  const at = chunk.indexOf("if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {");
  assert.ok(at > 0, 'the hooks block');
  for (const w of ['readRenderTargetPixels', 'api.still = ', 'api.scrub = ', 'api.tilt = ', 'api.hooks = ']) { const i = chunk.indexOf(w); assert.ok(i > at, `${w} inside the hooks block`); assert.equal(chunk.indexOf(w, i + 1), -1, `${w} once`); }
  assert.doesNotMatch(chunk.slice(0, at), /readRenderTargetPixels|api\.still|api\.scrub|api\.tilt|api\.hooks/);
  for (const w of ['surface: { ripple: liqU.uRw.value, dimple: liqU.uDw.value, span: span ? { ...span } : null }', 'tops: [...lb2.tops], colours: lb2.shades.map(hexOf)', 'landEnd: sc.landEnd, total: sc.total, switches: [...sc.switches], colours: sc.shades.map(hexOf)']) assert.ok(chunk.includes(w), `the hooks' shape: ${w}`);
  assert.doesNotMatch(chunk, /mound|owners|grains|dust/, 'the sand\'s hooks are gone');
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
