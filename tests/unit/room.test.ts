// Section 4 (docs/specs/section-4.md AC2, AC3, AC9, AC10, AC12): the scroll map and the track's height agree with the
// stylesheet, the pedestals are where the bake put them, every shade is the catalog's by id, the sweep descends in
// luminance, every Tune control exists and holds its default, and the copy keeps the brand rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HALL, PAN_START, RENDER_COLOURS, PEDESTAL_HEIGHTS, ROOM_BAYS, ROOM_COPY, ROOM_HEIGHT, ROOM_HEIGHT_ENTERED, ROOM_PARAMS, ROOM_PRODUCTS, ROOM_SCREENS, SWEEP_BANDS, TRANSITION, UNIVERSE, loopStart, pedestalAt, pedestalQ, relLuminance } from '../../src/config/room.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { URBAN_SLATE } from '../../src/config/tokens.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const byId = new Map(SHADES.map((s) => [s.id, s]));

test('the scroll map: 13 screens in the hall, 15 once entered, and the stylesheet carries the same literals', () => {
  assert.equal(ROOM_HEIGHT, 13);
  assert.equal(ROOM_HEIGHT_ENTERED, 15);
  assert.equal(PAN_START, ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station);
  assert.equal(loopStart(false), 10);
  assert.equal(loopStart(true), 12);
  const css = read('src/styles/room.css');
  assert.ok(css.includes(`.room .rm-track { height: ${ROOM_HEIGHT * 100}svh; }`), 'room.css: the hall track height');
  assert.ok(css.includes(`.room[data-state="universe"] .rm-track { height: ${ROOM_HEIGHT_ENTERED * 100}svh; }`), 'room.css: the entered track height');
  // the stage is pinned through the loop screen and the tail: the jump's screen ends inside the document
  assert.ok(loopStart(false) + ROOM_SCREENS.loop + ROOM_SCREENS.tail <= ROOM_HEIGHT - 1);
  assert.ok(loopStart(true) + ROOM_SCREENS.loop + ROOM_SCREENS.tail <= ROOM_HEIGHT_ENTERED - 1);
});

test('the hall: the stations against the measured frame (evidence file section 1)', () => {
  assert.equal(HALL.xWest, -5.95); assert.equal(HALL.xEast, 5.93); assert.equal(HALL.height, 3.99);
  assert.ok(Math.abs(HALL.start - (HALL.xEast - 0.6)) < 1e-9, 'the start station is 0.6 m inside the east wall');
  assert.ok(Math.abs(HALL.end - (HALL.door.face + ROOM_PARAMS.stationDist)) < 1e-9, 'the door station is stationDist short of the door');
  assert.ok(Math.abs(HALL.door.face - (HALL.xWest + HALL.panelProud)) < 1e-9, 'the door sits behind the end panel');
  assert.equal(ROOM_PARAMS.stationDist, 2.0);
  assert.equal(HALL.promptFrom, 2.8);
  assert.ok(ROOM_PARAMS.stationDist < HALL.promptFrom, 'the prompt shows before the station');
  assert.equal(ROOM_PARAMS.eye, 0.9);
  assert.equal(ROOM_PARAMS.fov, 60);
});

test('the universe: six pedestals on the arc, where the bake put them (src/assets/room/room.json)', () => {
  const baked = JSON.parse(read('src/assets/room/room.json')) as { radius: number; doorX: number; pedestals: { x: number; y: number; h: number; deg: number }[] };
  assert.equal(baked.radius, UNIVERSE.radius);
  assert.equal(baked.doorX, UNIVERSE.doorX);
  assert.equal(baked.pedestals.length, UNIVERSE.pedestals);
  baked.pedestals.forEach((b, i) => {
    const p = pedestalAt(i);
    assert.ok(Math.abs(p.x - b.x) < 1e-3 && Math.abs(p.z - -b.y) < 1e-3, `pedestal ${i} place (Blender y is three's -z)`);
    assert.equal(p.height, b.h); assert.equal(p.deg, b.deg);
    assert.ok(Math.hypot(p.x, p.z) < UNIVERSE.radius - 0.5, `pedestal ${i} inside the room`);
  });
  assert.deepEqual([...PEDESTAL_HEIGHTS], [0.6, 0.9, 1.0, 0.8]);
  assert.equal(new Set(PEDESTAL_HEIGHTS).size, PEDESTAL_HEIGHTS.length, 'every pedestal a different height');
  assert.equal(pedestalQ(0), PAN_START);
  assert.equal(pedestalQ(UNIVERSE.pedestals - 1), PAN_START + ROOM_SCREENS.pan);
});

test('the shades by id: the ten bays are the families\' key shades, the products\' shades are the catalog\'s', () => {
  assert.deepEqual(ROOM_BAYS.map((b) => b.shade), ['frosty-white-07', 'blissful-blue-08', 'playful-pink-14', 'vivid-violet-07', 'mellow-yellow-01', 'basic-brown-07', 'blushing-coral-04', 'stormy-grey-05', 'go-green-12', 'roaring-red-07']);
  for (const b of ROOM_BAYS) { const s = byId.get(b.shade); assert.ok(s, b.shade); assert.equal(b.hex.toLowerCase(), s!.hex.toLowerCase(), b.shade); assert.equal(b.name, s!.name, b.shade); }
  for (const p of ROOM_PRODUCTS) { const s = byId.get(p.shade); assert.ok(s, p.shade); assert.equal(p.hex.toLowerCase(), s!.hex.toLowerCase(), `${p.id} ${p.shade}`); }
});

test('the products: Sam\'s four (2026-10-16), one per pedestal, each on its own model', () => {
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.id), ['case', 'wallet', 'lenskin', 'airpods']);
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.model), ['cobalt', 'wallet', 'lenskin', 'airpods']);
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.height), [...PEDESTAL_HEIGHTS]);
  assert.equal(ROOM_PRODUCTS.length, UNIVERSE.pedestals);
  const models = JSON.parse(read('src/data/room-products.json')) as Record<string, unknown>;
  for (const p of ROOM_PRODUCTS.filter((x) => x.model !== 'cobalt')) assert.ok(models[p.model], `${p.id}: no model in src/data/room-products.json`);
  for (const p of ROOM_PRODUCTS) assert.ok(p.exhibit >= 1 && p.exhibit <= 3, p.id);
});

test('the sweep: the ten key shades from the brightest to the darkest (WCAG 2.3.1, spec 2)', () => {
  assert.deepEqual(SWEEP_BANDS.map((b) => b.name), ['Snow', 'Sunbeam', 'Mango', 'Sky', 'Silver', 'Rouge', 'Lawn', 'Cinnamon', 'Amethyst', 'Crimson']);
  for (let i = 1; i < SWEEP_BANDS.length; i++) assert.ok(relLuminance(SWEEP_BANDS[i - 1].hex) >= relLuminance(SWEEP_BANDS[i].hex));
  // the beats stay inside the transition and in order
  assert.ok(TRANSITION.whiteIn[0] < TRANSITION.whiteIn[1] && TRANSITION.whiteIn[1] <= TRANSITION.sweep[0] && TRANSITION.sweep[1] < 1 && TRANSITION.toIn[1] === 1);
  // at the default speed the ribbon crosses in about 0.9 s of the 2.4 s
  const crossMs = ((1 + 10 * ROOM_PARAMS.sweepWidth + 0.08) / ROOM_PARAMS.sweepSpeed) * 1000;
  assert.ok(Math.abs(crossMs - 900) < 80, `${crossMs} ms`);
});

test('Tune: every section 4 parameter has its control, and every default sits inside the control\'s range', () => {
  const tune = read('src/components/dev/Tune.astro');
  for (const [k, v] of Object.entries(ROOM_PARAMS)) {
    const m = tune.match(new RegExp(`<input id="r-${k}" type="range" min="([-\\d.]+)" max="([-\\d.]+)" step="([\\d.]+)">`));
    assert.ok(m, `Tune has no control for ${k}`);
    assert.ok(v >= +m![1] && v <= +m![2], `${k} = ${v} outside ${m![1]} to ${m![2]}`);
    assert.ok(tune.includes(`<output id="o-r-${k}">`), `Tune has no readout for ${k}`);
  }
});

test('copy: sentence case, no em or en dash, no emoji, no banned words (CLAUDE.md 3, 4, 16, 17)', () => {
  const strings = [...Object.values(ROOM_COPY), ...ROOM_PRODUCTS.flatMap((p) => [p.name, p.line])];
  for (const p of ROOM_PRODUCTS) assert.notEqual(p.line, p.lineCatalog, `${p.id}: the trimmed line differs from the catalog's`);
  for (const s of strings) {
    assert.doesNotMatch(s, /[–—]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|seamlessly|elevate|unleash|next-level|revolutionary)\b/i, s);
    if (s.length > 1) assert.notEqual(s, s.toUpperCase(), `all caps: ${s}`);
  }
  for (const p of ROOM_PRODUCTS) assert.equal(p.name[0], p.name[0].toUpperCase(), p.name);
  assert.doesNotMatch(ROOM_PRODUCTS.find((p) => p.id === 'lenskin')!.line, /240/, 'the catalog gives the Lenskin no shade count');
});

test('render colours (AC3, E-S4-light): the scenes draw only the named render colours, the tokens and the shades', () => {
  const slate = [1, 3, 5].map((i) => parseInt(URBAN_SLATE.slice(i, i + 2), 16) / 255);
  RENDER_COLOURS.leaf.forEach((v, i) => assert.ok(Math.abs(v - slate[i]) < 1e-9, 'the leaves are Urban Slate'));
  for (const v of [...RENDER_COLOURS.fixture, ...RENDER_COLOURS.floorLight, ...RENDER_COLOURS.roomCeiling]) assert.ok(v > 0.5 && v <= 1.2);
  // every Color made in the scene files is white, a named render colour, a token, a shade's hex or the case's own trim
  const allowed = /^(|1, 1, 1|\.\.\.RENDER_COLOURS\.\w+|RENDER_COLOURS\.leaf\[0\], RENDER_COLOURS\.leaf\[1\], RENDER_COLOURS\.leaf\[2\]|TRIM_RGB\[0\], TRIM_RGB\[1\], TRIM_RGB\[2\]|hex|b\.hex)$/;
  for (const f of ['hall', 'universe', 'transition', 'post']) {
    const src = read(`src/scripts/hero/section4/${f}.ts`);
    for (const m of src.matchAll(/new Color\(([^()]*)\)/g)) assert.match(m[1].trim(), allowed, `${f}.ts: new Color(${m[1]})`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{6}\b|0x[0-9a-fA-F]{6}\b/, `${f}.ts carries a raw hex colour`);
  }
});
