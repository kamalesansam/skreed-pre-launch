// Section 4 (docs/specs/section-4.md for the hall, docs/specs/section-4-world.md for the world; AC1, AC2, AC3, AC6, AC11):
// the scroll map and the track's height per number of lands agree with the stylesheet's literals, the lands are the ones
// whose four picture files exist and carry the spec's copy, every shade is the catalog's by id, every Tune control exists
// with its default inside its range and the entry's ranges are world.ts's, the section is plain text (no panels, fills,
// borders but the focus ring's, or shadows; the quiz's type at the quiz's sizes), and the copy keeps the brand rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { HALL, LAND_COPY, LAND_SIZE, PRESS, RENDER_COLOURS, ROOM_BAYS, ROOM_COPY, ROOM_HEIGHT, ROOM_HEIGHT_WORLD, ROOM_LANDS, ROOM_PARAMS, ROOM_PRODUCTS, ROOM_SCREENS, STATION_Q, WORLD_START, fill, landQ, landsFrom, loopStart, travelOption, worldHeight, type RoomParams } from '../../src/config/room.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { URBAN_SLATE } from '../../src/config/tokens.ts';
import { WORLD_DEFAULTS, WORLD_RANGES } from '../../src/scripts/hero/section4/world.ts';
import PARK from '../../src/assets/room/park/park.json' with { type: 'json' };
import { ROOM_CATALOG_LINES } from '../fixtures/room-catalog.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const byId = new Map(SHADES.map((s) => [s.id, s]));
const LANDS_DIR = new URL('../../src/assets/room/lands/', import.meta.url);
/** every encoded land file as the build's glob would list it (name to a stand-in URL) */
const listing = (names: string[]) => Object.fromEntries(names.map((n) => [`../assets/room/lands/${n}`, `/_astro/${n}`]));
const FOUR = (id: string) => ['portrait', 'wide'].flatMap((c) => ['avif', 'webp'].map((f) => `land-${id}-${c}.${f}`));
const css = read('src/styles/room.css'), astro = read('src/components/room/Room.astro');

test('the scroll map: 13 screens in the hall, 12 + 2N once entered, each land 0.4 screens either side of its station', () => {
  assert.equal(ROOM_HEIGHT, 13);
  assert.equal(STATION_Q, 9.5);
  assert.equal(WORLD_START, 10);
  assert.equal(loopStart(null), 10);
  assert.equal(ROOM_SCREENS.hold, 0.4);
  assert.ok(css.includes(`.room .rm-track { height: ${ROOM_HEIGHT * 100}svh; }`), 'room.css: the hall track height');
  // the stage is pinned through the loop screen and the tail: the jump's screen ends inside the document
  assert.ok(loopStart(null) + ROOM_SCREENS.loop + ROOM_SCREENS.tail <= ROOM_HEIGHT - 1);
  for (let n = 1; n <= ROOM_PRODUCTS.length; n++) {
    assert.equal(worldHeight(n), 12 + 2 * n, `${n} lands`);
    assert.equal(loopStart(n), 9 + 2 * n);
    assert.ok(css.includes(`.room:is([data-state="entering"], [data-state="world"])[data-lands="${n}"] .rm-track { height: ${worldHeight(n) * 100}svh; }`), `room.css: the track for ${n} lands`);
    assert.ok(loopStart(n) + ROOM_SCREENS.loop + ROOM_SCREENS.tail <= worldHeight(n) - 1, `${n} lands: the loop and the tail inside the pinned track`);
    for (let i = 0; i < n; i++) {
      assert.equal(landQ(i), 10 + 2 * i);
      // each hold zone is clear of the next one's, and the last one's of the loop screen
      const end = landQ(i) + ROOM_SCREENS.hold, next = i + 1 < n ? landQ(i + 1) - ROOM_SCREENS.hold : loopStart(n);
      assert.ok(end < next, `land ${i + 1} of ${n}: its hold ends at ${end}, the next begins at ${next}`);
    }
  }
  assert.equal(worldHeight(4) * 100, 2000, 'the spec: 2000svh with four lands');
  assert.equal(ROOM_HEIGHT_WORLD, worldHeight(ROOM_LANDS.length));
});

test('the lands: the products whose four picture files exist, in catalog order, with the encoded files present', () => {
  assert.deepEqual(landsFrom({}), [], 'no files, no lands (production ships N = 0 until Sam approves land 1)');
  const all = landsFrom(listing(ROOM_PRODUCTS.flatMap((p) => FOUR(p.id))));
  assert.deepEqual(all.map((l) => l.id), ['case', 'wallet', 'lenskin', 'airpods']);
  assert.deepEqual(all.map((l) => l.i), [0, 1, 2, 3]);
  assert.ok(all.every((l) => l.depth.portrait === null && l.depth.wide === null), 'the depth maps are optional');
  // a land missing any one of its four pictures is out, and the rest close up in catalog order
  const some = landsFrom(listing([...FOUR('case'), ...FOUR('lenskin').slice(1), ...FOUR('airpods'), 'land-airpods-wide-depth.avif', 'land-airpods-wide-depth.webp', 'land-case-portrait-depth.avif']));
  assert.deepEqual(some.map((l) => [l.id, l.i]), [['case', 0], ['airpods', 1]]);
  assert.deepEqual(some[1].depth.wide, { avif: '/_astro/land-airpods-wide-depth.avif', webp: '/_astro/land-airpods-wide-depth.webp' });
  assert.equal(some[0].depth.portrait, null, 'a depth map needs both formats');
  // the build's lands: what src/assets/room/lands holds (none in git until Sam approves; the glob is the build's, so
  // under Node ROOM_LANDS is empty and the listing stands in), and the stylesheet carries that N's height
  const present = existsSync(LANDS_DIR) ? readdirSync(LANDS_DIR).filter((n) => /^land-.*\.(?:avif|webp)$/.test(n)) : [];
  const n = landsFrom(listing(present)).length;
  assert.ok(n === 0 || css.includes(`[data-lands="${n}"] .rm-track { height: ${worldHeight(n) * 100}svh; }`), `room.css carries ${n} lands' height`);
  assert.deepEqual(LAND_SIZE, { portrait: { width: 720, height: 1280 }, wide: { width: 1920, height: 1200 } });
});

test("the lands' copy (spec 3): the product by name, the case by its family, the accessory by its shade, and an alt that names neither the park nor the person", () => {
  const families = new Set(ROOM_BAYS.map((b) => b.family));
  const want: Record<string, [string, string | null]> = { case: ['Mellow Yellow', null], wallet: ['Blissful Blue', 'basic-brown-04'], lenskin: ['Go Green', 'go-green-09'], airpods: ['Vivid Violet', 'go-green-09'] };
  for (const p of ROOM_PRODUCTS) {
    const c = LAND_COPY[p.id], [family, shade] = want[p.id];
    assert.ok(families.has(family));
    assert.ok(c.family.includes(`${family} case`), `${p.id}: ${c.family}`);
    if (shade) {
      assert.equal(p.shade, shade, `${p.id}: the accessory's shade`);
      assert.ok(c.family.startsWith(byId.get(shade)!.name + ','), `${p.id}: the family line names the accessory's shade first (${c.family})`);
      assert.ok(c.alt.includes(byId.get(shade)!.name) && c.alt.includes(family), `${p.id}: the alt names both colours`);
    }
    assert.doesNotMatch(c.alt, /central park|new york|\bwoman\b|\bman\b|\bgirl\b|\bboy\b|\bher\b|\bhis\b|customer/i, `${p.id}: ${c.alt}`);
    assert.match(c.alt, /^A person /);
  }
  // the logotype's tone per crop class, measured on the approved pictures where it sits (top left): Pearl over the case's
  // dark elms in both crops and the wallet's arcade in the wide, Urban Slate over the light corners elsewhere
  assert.deepEqual(Object.fromEntries(Object.entries(LAND_COPY).map(([id, c]) => [id, c.tone])), {
    case: { portrait: 'pearl', wide: 'pearl' }, wallet: { portrait: 'slate', wide: 'pearl' }, lenskin: { portrait: 'slate', wide: 'slate' }, airpods: { portrait: 'slate', wide: 'slate' },
  });
  assert.match(read('src/scripts/hero/section4/director.ts'), /const landDark = \(i: number\): boolean => ROOM_LANDS\[i\]\?\.tone\[cls\(\)\] !== 'pearl';/, 'the director reads the tone by the crop class in use');
  assert.equal(LAND_COPY.case.family, 'A Mellow Yellow case');
  assert.equal(LAND_COPY.wallet.family, 'Desert, on a Blissful Blue case');
  assert.equal(fill(ROOM_COPY.count, { n: 2, N: 4 }), '2 / 4');
  assert.equal(fill(ROOM_COPY.landLive, { n: 1, N: 4, name: 'Phone case', family: 'A Mellow Yellow case' }), '1 of 4. Phone case. A Mellow Yellow case.');
});

test("each land's capture is option B's pose (shared FOV and near distance, spec 2), with a far distance past it", () => {
  const poses = (PARK as { poses: { id: string; fov: number; near: number }[] }).poses;
  assert.deepEqual(poses.map((p) => p.id), ROOM_PRODUCTS.map((p) => p.id));
  for (const p of poses) {
    const c = LAND_COPY[p.id as keyof typeof LAND_COPY];
    assert.equal(c.fov, p.fov, `${p.id}: fov`); assert.equal(c.near, p.near, `${p.id}: near`);
    assert.ok(c.far > c.near * 4, `${p.id}: far`);
  }
});

test("the shades by id: the ten key shades, and the products' shades the catalog's (the Lenskin in Sage, Sam 2026-10-20)", () => {
  assert.deepEqual(ROOM_BAYS.map((b) => b.shade), ['frosty-white-07', 'blissful-blue-08', 'playful-pink-14', 'vivid-violet-07', 'mellow-yellow-01', 'basic-brown-07', 'blushing-coral-04', 'stormy-grey-05', 'go-green-12', 'roaring-red-07']);
  for (const b of ROOM_BAYS) { const s = byId.get(b.shade); assert.ok(s, b.shade); assert.equal(b.hex.toLowerCase(), s!.hex.toLowerCase(), b.shade); assert.equal(b.name, s!.name, b.shade); }
  for (const p of ROOM_PRODUCTS) { const s = byId.get(p.shade); assert.ok(s, p.shade); assert.equal(p.hex.toLowerCase(), s!.hex.toLowerCase(), `${p.id} ${p.shade}`); }
  const lenskin = ROOM_PRODUCTS.find((p) => p.id === 'lenskin')!;
  assert.deepEqual([lenskin.shade, lenskin.hex, byId.get(lenskin.shade)!.name], ['go-green-09', '#96a880', 'Sage']);
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.id), ['case', 'wallet', 'lenskin', 'airpods']);
  // scripts/room/lands.py reads each product's id, shade, hex and finish from one line of this block
  const src = read('src/config/room.ts'), block = src.slice(src.indexOf('export const ROOM_PRODUCTS'), src.indexOf(']);', src.indexOf('export const ROOM_PRODUCTS')));
  const rows = [...block.matchAll(/\{ id: '([a-z]+)',.*?shade: '([a-z0-9-]+)', hex: '(#[0-9a-fA-F]{6})', finish: '([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(rows, ['case', 'wallet', 'lenskin', 'airpods']);
});

test('the hall and the press: the stations against the measured frame, and the press as built', () => {
  assert.equal(HALL.xWest, -5.95); assert.equal(HALL.xEast, 5.93); assert.equal(HALL.height, 3.99);
  assert.ok(Math.abs(HALL.start - (HALL.xEast - 0.6)) < 1e-9, 'the start station is 0.6 m inside the east wall');
  assert.ok(Math.abs(HALL.end - (HALL.door.face + ROOM_PARAMS.stationDist)) < 1e-9, 'the door station is stationDist short of the door');
  assert.ok(ROOM_PARAMS.stationDist < HALL.promptFrom, 'the prompt shows before the station');
  assert.deepEqual({ ...PRESS }, { swing: 0.9, glideFrom: 0.3, glide: 0.9, dolly: 1.6, freeze: 1.2 });
  assert.equal(PRESS.glideFrom + PRESS.glide, PRESS.freeze, 'the hall freezes as its glide ends');
});

test("Tune: every section 4 parameter has its control with its default inside, the entry's ranges are world.ts's, and the universe's keys are gone", () => {
  const tune = read('src/components/dev/Tune.astro');
  const range = (k: string) => { const m = tune.match(new RegExp(`<input id="r-${k}" type="range" min="([-\\d.]+)" max="([-\\d.]+)" step="([\\d.]+)">`)); return m ? [+m[1], +m[2], +m[3]] as const : null; };
  for (const [k, v] of Object.entries(ROOM_PARAMS)) {
    const r = range(k);
    assert.ok(r, `Tune has no control for ${k}`);
    assert.ok(v >= r![0] && v <= r![1], `${k} = ${v} outside ${r![0]} to ${r![1]}`);
    assert.ok(tune.includes(`<output id="o-r-${k}">`), `Tune has no readout for ${k}`);
  }
  for (const [k, [a, b, s]] of Object.entries(WORLD_RANGES)) {
    assert.deepEqual(range(k), [a, b, s], `${k}: Tune's range is WORLD_RANGES' (inside it every value passes the ring-timing rule)`);
    assert.equal(ROOM_PARAMS[k as keyof typeof ROOM_PARAMS], WORLD_DEFAULTS[k as keyof typeof WORLD_DEFAULTS], `${k}: the default is WORLD_DEFAULTS'`);
  }
  assert.deepEqual(range('landTravelMs'), [2600, 4500, 100], 'a travel between lands: 2600 ms, at most 4500 (the park is checked across that range)');
  assert.equal(ROOM_PARAMS.landTravelMs, 2600);
  assert.deepEqual(range('parkTravel'), [0, 2, 1]);
  assert.equal(ROOM_PARAMS.parkTravel, 0, 'under Node there is no build pick: A');
  assert.equal(travelOption({ ...ROOM_PARAMS, parkTravel: 2 } as RoomParams), 'C');
  for (const k of ['sweepSpeed', 'sweepAngle', 'sweepWidth', 'transitionMs', 'wallsColour', 'catalogWords', 'productScale', 'roomPitch', 'roomExposure', 'roomVignette', 'roomCorners', 'roomBleach', 'productLight', 'labelFloat']) {
    assert.ok(!(k in ROOM_PARAMS), `the universe's ${k} is gone`); assert.ok(!tune.includes(`r-${k}"`), `Tune's ${k} is gone`);
  }
  assert.ok('mouseLook' in ROOM_PARAMS);
});

test('AC11, plain text: room.css and Room.astro carry no panel, fill, border but the focus ring, or shadow', () => {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
  assert.ok(rules.length > 30);
  for (const { sel, body } of rules) {
    for (const d of body.split(';').map((x) => x.trim()).filter(Boolean)) {
      const [prop, ...rest] = d.split(':'), val = rest.join(':').trim();
      assert.doesNotMatch(prop, /box-shadow|backdrop-filter/, `${sel}: ${d}`);
      if (/border-radius/.test(prop)) assert.equal(val, '0', `${sel}: ${d}`);   // a control's UA corner taken off, nothing rounded
      // the poster column and the loop's fade stand on --night, each picture on a --skeleton box until it decodes (H1)
      // (and a control's UA fill and border taken off: none and 0)
      if (/^background/.test(prop.trim())) assert.match(val, /^(none|var\(--(night|skeleton)\))$/, `${sel}: ${d}`);
      if (/^border(?!-radius)/.test(prop.trim()) && !/^(0|none)$/.test(val)) assert.match(sel, /:focus-visible/, `${sel}: a border outside the focus ring (${d})`);
    }
  }
  for (const src of [css, astro]) {
    assert.doesNotMatch(src, /rm-pill/);
    assert.doesNotMatch(src, /class="btn|\bbtn\b/);
    assert.doesNotMatch(src, /txtbtn/);
  }
  assert.doesNotMatch(astro, /\sstyle=/, 'no style attributes (the CSP has no style-src-attr)');
  // the pad's two-tone ring is drawn inside the stage by ::before (and ::after), never a box-shadow
  assert.match(css, /\.rm-pad:focus-visible::before \{[^}]*border: 2px solid var\(--urban-slate\); outline: 2px solid var\(--ember-luxe\); outline-offset: -4px/);
  assert.match(css, /\.rm-pad:focus-visible::after \{[^}]*inset: 4px; border: 2px solid var\(--urban-slate\)/);
});

test("E-S4-font: section 2's label type, IBM Plex Mono Medium in capitals, at the quiz's own sizes", () => {
  const quiz = read('src/styles/quiz.css');
  const qv = (name: string) => quiz.match(new RegExp(`--qz-${name}: ([^;]+);`))?.[1], rv = (name: string) => css.match(new RegExp(`--rm-${name}: ([^;]+);`))?.[1];
  for (const n of ['fs', 'fs-q']) { assert.ok(qv(n)); assert.equal(rv(n), qv(n), `--rm-${n} equals the quiz's --qz-${n}`); }
  assert.match(css, /--rm-font: "IBM Plex Mono", ui-monospace, monospace;/);
  assert.match(css, /\.room \{[^}]*font: 500 var\(--rm-fs\) \/ 1\.45 var\(--rm-font\); text-transform: uppercase; letter-spacing: 0;/);
  assert.match(css, /\.room \.sr-only \{ text-transform: none; \}/, 'assistive technology keeps the sentence case');
  assert.match(css, /\.rm-land-name \{ font-size: var\(--rm-fs-q\)/);
  // the controls are words: the quiz's link pattern, 44 px to tap
  assert.match(css, /\.room \.rm-link \{[^}]*min-height: 44px; min-width: 44px;[^}]*text-decoration-line: underline; text-decoration-thickness: 1px; text-underline-offset: 0\.4em;/);
  for (const id of ['rmEnter', 'rmSkip']) assert.match(astro, new RegExp(`class="rm-[a-z]+ rm-link" id="${id}"`));
});

test('the DOM (spec 5): the prompt, the pad, Skip, the lines, the lands list, the travel buttons and the live region', () => {
  assert.match(astro, /<button type="button" class="rm-enter rm-link" id="rmEnter" aria-keyshortcuts="E" hidden=\{N === 0\}><span class="rm-key" aria-hidden="true">\{R\.key\}<\/span><span class="rm-enter-text">\{R\.enter\}<\/span><\/button>/);
  assert.match(astro, /<div class="rm-pad" id="rmPad" tabindex="0" role="group" aria-label=\{R\.stageAria\}><\/div>/);
  assert.match(astro, /<p class="rm-line rm-loading" id="rmLoading" role="status" hidden>/);
  assert.match(astro, /<h2 class="sr-only">\{R\.landsTitle\}<\/h2>/);
  assert.match(astro, /<ol class="rm-lands" id="rmLands" aria-label=\{R\.landsAria\}/);
  assert.match(astro, /<h3 class="rm-land-name" id=\{`rmName-\$\{l\.id\}`\} tabindex="-1">/);
  for (const c of ['rm-land-family', 'rm-land-line', 'rm-land-count']) assert.ok(astro.includes(`<p class="${c}">`), c);
  assert.match(astro, /<p class="sr-only rm-land-alt" id=\{`rmAlt-\$\{l\.id\}`\}>\{l\.alt\}<\/p>/);
  assert.match(astro, /class="rm-prev" id="rmPrev" hidden>\{R\.prev\}/);
  assert.match(astro, /class="rm-next" id="rmNext" hidden>\{R\.next\}/);
  assert.match(astro, /<p class="sr-only" id="rmLive" aria-live="polite"><\/p>/);
  // one announcement per arrival (AC6): land 1's travel hint is its own line with no live role; the status line under a
  // land's text carries only the Loading wait and the option's note
  assert.match(astro, /<p class="rm-land-more" role="status" hidden><\/p>\s*\{l\.i === 0 && N > 1 && <p class="rm-land-hint" hidden><\/p>\}/);
  const walk = read('src/scripts/room/walk.ts');
  assert.match(walk, /setLine\(l\.hint, hintText\(\)\)/);
  assert.doesNotMatch(walk, /setMore\([^)]*hintText/);
  // every land picture with its formats and its size, lazily on the 3D path (data-srcset) and in the noscript column
  assert.equal((astro.match(/data-srcset=\{l\.pics\.(portrait|wide)\.(avif|webp)\}/g) ?? []).length, 3);
  assert.match(astro, /<img data-src=\{l\.pics\.wide\.webp\} alt=\{l\.alt\} width=\{Wd\.width\} height=\{Wd\.height\} loading="lazy"/);
  assert.match(astro, /<img src=\{l\.pics\.wide\.webp\} alt=\{l\.alt\} width=\{Wd\.width\} height=\{Wd\.height\} loading="lazy"/);
  for (const gone of ['rmProducts', 'rmLabel', 'rmSkipWrap', 'rm-product', 'universe']) assert.ok(!astro.includes(gone), `${gone} is gone`);
});

test('copy: sentence case, no em or en dash, no emoji, no banned words (CLAUDE.md 3, 4, 16, 17)', () => {
  const lines = [...Object.entries(ROOM_COPY).filter(([k]) => k !== 'key').map(([, v]) => v), ...ROOM_PRODUCTS.flatMap((p) => [p.name, p.line]), ...Object.values(LAND_COPY).flatMap((c) => [c.family, c.alt])];
  for (const p of ROOM_PRODUCTS) assert.notEqual(p.line, ROOM_CATALOG_LINES[p.id], `${p.id}: the trimmed line differs from the catalog's`);
  // the catalog's own sentences stay in the test fixture: neither they nor rule 17's words are in the client's config
  for (const p of ROOM_PRODUCTS) assert.ok(!('lineCatalog' in p), `${p.id}: no catalog line in the client`);
  assert.doesNotMatch(read('src/config/room.ts'), /\b(seamless|seamlessly|elevate)\b/i, 'room.ts carries none of rule 17\'s words');
  for (const s of lines) {
    assert.doesNotMatch(s, /[\u2013\u2014]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|seamlessly|elevate|unleash|next-level|revolutionary)\b/i, s);
    if (s.length > 1) assert.notEqual(s, s.toUpperCase(), `all caps: ${s}`);
  }
  assert.equal(ROOM_COPY.key, '[E]');
  assert.equal(ROOM_COPY.enter, 'Enter Skreed universe');
  assert.doesNotMatch(ROOM_PRODUCTS.find((p) => p.id === 'lenskin')!.line, /240/, 'the catalog gives the Lenskin no shade count');
});

test('render colours (AC3, E-S4-light): the hall clears to Urban Slate from the press; the scenes draw only named colours, tokens and shades', () => {
  const slate = [1, 3, 5].map((i) => parseInt(URBAN_SLATE.slice(i, i + 2), 16) / 255);
  RENDER_COLOURS.leaf.forEach((v, i) => assert.ok(Math.abs(v - slate[i]) < 1e-9, 'the leaves are Urban Slate'));
  RENDER_COLOURS.hallEntering.forEach((v, i) => assert.ok(Math.abs(v - slate[i]) < 1e-9, 'the clear colour while entering is Urban Slate'));
  assert.deepEqual([...RENDER_COLOURS.hallClear], [1, 1, 1]);
  for (const v of [...RENDER_COLOURS.fixture, ...RENDER_COLOURS.floorLight]) assert.ok(v > 0.5 && v <= 1.2);
  // every Color made in these scene files is white, a named render colour or a token; none carries a raw hex
  const allowed = /^(|1, 1, 1|\.\.\.RENDER_COLOURS\.\w+|RENDER_COLOURS\.leaf\[0\], RENDER_COLOURS\.leaf\[1\], RENDER_COLOURS\.leaf\[2\]|hex)$/;
  for (const f of ['hall', 'transition', 'post', 'director', 'travel', 'garden']) {
    const src = read(`src/scripts/hero/section4/${f}.ts`);
    for (const m of src.matchAll(/new Color\(([^()]*)\)/g)) assert.match(m[1].trim(), allowed, `${f}.ts: new Color(${m[1]})`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{6}\b|0x[0-9a-fA-F]{6}\b/, `${f}.ts carries a raw hex colour`);
  }
  assert.ok(!existsSync(new URL('../../src/scripts/hero/section4/universe.ts', import.meta.url)), 'universe.ts is gone');
  assert.match(read('src/scripts/hero/section4/hall.ts'), /entering\(on\) \{ clear = on \? CLEAR_ENTERING : CLEAR;/);
});

test('GPU memory (spec 6): land 1 reached by Skip, Escape or a hook frees the garden, as the entry clock does', () => {
  assert.match(read('src/scripts/hero/section4/director.ts'), /function finishEnter\(\) \{[^}]*world\?\.releaseGarden\(\);/);
});
