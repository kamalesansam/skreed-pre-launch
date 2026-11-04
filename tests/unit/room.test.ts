// Section 4 (docs/specs/section-4-flux.md 5, 7 and 9 for the scenes: AC2, AC8, AC10, AC13, AC15, X-13; docs/specs/
// section-4-no-hall.md 5 and 7 since the hall left on 2026-11-02: AC1, AC5): the scroll map and the 680svh track with
// the pinned-screen invariant, the five scenes with their products, catalog shades by id, finishes, key lights, alts
// and files, every Tune control with its default inside its range and the ranges of X-13, the section as plain text (no
// panels, fills, borders but the focus ring's, or shadows; the bottom shade in the carousel's shader; the quiz's type at
// the quiz's sizes), the DOM of section 5, the copy's brand rules over ROOM_COPY and ROOM_SCENES, the colours the scene
// files make, the hall's and the world's modules gone, and the composite's cover input.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import * as ROOM from '../../src/config/room.ts';
import { ROOM_COPY, ROOM_HEIGHT, ROOM_PARAMS, ROOM_PRODUCTS, ROOM_RANGES, ROOM_SCENES, ROOM_SCREENS, SCENE_COUNT, SCENE_SIZE, SCENES_END, WIPE4_START, WORLD_START, fill, productById, sceneQ, shadeLine } from '../../src/config/room.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { STEP } from '../../src/scripts/hero/section4/carousel-math.ts';
import { COMPOSITE_FRAG_V11, COMPOSITE_FRAG_V11_COVER } from '../../src/scripts/hero/v11/glsl.ts';
import { withCover } from '../../src/scripts/hero/post/shaders.ts';
import { ROOM_CATALOG_LINES } from '../fixtures/room-catalog.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const exists = (p: string) => existsSync(new URL(`../../${p}`, import.meta.url));
const byId = new Map(SHADES.map((s) => [s.id, s]));
const css = read('src/styles/room.css'), astro = read('src/components/room/Room.astro');

test('the scroll map (section-4-no-hall.md 5; section-5.md 5): the third wipe, then the scenes at a step of 0.5 from 1, the hold to 3.8, the fourth wipe to 4.8, 4.8 screens, the stage unpinned as the cut begins', () => {
  assert.deepEqual({ ...ROOM_SCREENS }, { wipe: 1, step: 0.5, hold: 0.8, out: 1 });
  assert.equal(WORLD_START, 1, "scene 1 at the third wipe's end");
  assert.equal(SCENE_COUNT, 5);
  assert.deepEqual(Array.from({ length: SCENE_COUNT }, (_, i) => sceneQ(i)), [1, 1.5, 2, 2.5, 3]);
  assert.equal(SCENES_END, 3);
  assert.ok(Math.abs(WIPE4_START - 3.8) < 1e-9, 'the fourth wipe at 3.8');
  assert.ok(Math.abs(ROOM_HEIGHT - 4.8) < 1e-9, '4.8 screens');
  assert.ok(css.includes(`.room .rm-track { height: ${Math.round(ROOM_HEIGHT * 100)}svh; }`), 'room.css: the track at 480svh');
  assert.doesNotMatch(css, /data-lands|1480svh|1580svh|680svh|580svh|1300svh|1400svh|1600svh|1800svh|2000svh/, "no per-N heights, and neither the hall's track, the loop screen's nor the pinned screen's: the track is the same in every state");
  // the stage unpins exactly as the cut begins (section-5-picture.md 18, 2026-11-03): section 5 rises under the cut
  assert.ok(Math.abs(WIPE4_START - (ROOM_HEIGHT - 1)) < 1e-9, 'the stage unpins where the cut begins');
  assert.ok(Math.abs(SCENES_END + ROOM_SCREENS.hold - WIPE4_START) < 1e-9, 'the hold ends at the cut');
  // no exit seam anywhere since 2026-11-03 (section-5-picture.md 18): no LOOP_START, no loop screen, no tail, no loop end in the DOM
  assert.doesNotMatch(read('src/config/room.ts') + read('src/config/room-map.ts'), /LOOP_START|ROOM_SCREENS\.loop\b|ROOM_SCREENS\.tail\b/, 'LOOP_START, the loop screen and the tail are gone');
  // the map on its own (config/room-map.ts), so the hero island's static read of the fourth wipe's span (hero.ts) carries no copy, scene or file
  assert.match(read('src/scripts/hero/hero.ts'), /from '\.\.\/\.\.\/config\/room-map\.ts';/);
  assert.doesNotMatch(read('src/scripts/hero/hero.ts'), /from '\.\.\/\.\.\/config\/room\.ts'/, 'hero.ts imports nothing from config/room.ts itself');
  assert.doesNotMatch(read('src/config/room-map.ts'), /import /, 'room-map.ts imports nothing');
  assert.doesNotMatch(css, /rm-loopend|rm-fade/, 'the loop end and the fade left room.css');
  assert.doesNotMatch(astro, /rm-loopend|rm-fade/, 'and Room.astro');
  const director = read('src/scripts/hero/section4/director.ts');
  assert.doesNotMatch(director, /startExit\(|LOOP_START|exitGuard/, 'no exit seam and no guard for one: the page ends at section 5');
  assert.match(director, /const end = Number\.isFinite\(rest\) \? Math\.max\(WIPE4_START \+ ROOM_SCREENS\.out \/ 2, Math\.min\(nominal, \(rest - top\) \/ screenPx\(\)\)\) : nominal;/, 'the fourth wipe from WIPE4_START over one screen, or to section 5\'s rest when that comes first (a phone\'s taller viewport, 2026-11-03)');
  assert.match(director, /wipeOut = qRaw >= end - eps \? 1 : clamp01\(\(qRaw - WIPE4_START\) \/ \(end - WIPE4_START\)\);/, 'done within 2 px of its end (2026-11-03)');
  assert.match(director, /const on = showable && inRoom && qRaw > 0 && wipeOut < 1;/, 'section 4\'s frame off once the cut is done: the ground the island\'s alone at section 5\'s rest');
  assert.doesNotMatch(director, /signupReady|landWrap|seamFrame|wrap\(\) \{|warmCloud/, 'no wrap from the top since 2026-11-04 (docs/specs/scroll-steps.md 2): no seam, no cloud, no landing on section 5');
});

test('the five scenes (section-4-flux.md 3): the rooms in order, the products, the catalog shades by id, the finishes, the key lights, the alts, the files', () => {
  assert.deepEqual(ROOM_SCENES.map((s) => s.id), ['cove', 'grove', 'ember', 'palace', 'dawn']);
  assert.deepEqual(ROOM_SCENES.map((s) => s.i), [0, 1, 2, 3, 4]);
  assert.deepEqual(ROOM_SCENES.map((s) => s.order), [1, 2, 3, 4, 5]);
  assert.deepEqual(ROOM_SCENES.map((s) => s.product), ['case', 'airpods', 'wallet', 'lenskin', 'airpods-max'], 'scene 5 shows the AirPods Max case since 2026-10-26 (X-8)');
  assert.deepEqual(ROOM_SCENES.map((s) => s.shade), ['vivid-violet-05', 'go-green-09', 'basic-brown-04', 'playful-pink-06', 'vivid-violet-04']);
  assert.deepEqual(ROOM_SCENES.map((s) => s.finish), ['matte', 'gloss', 'matte', 'metallic', 'matte']);
  assert.deepEqual(ROOM_SCENES.map((s) => s.keyLight), ['#ffa6c8', '#a8ffe0', '#ffa171', '#ffc9a3', '#cbb0ff'], "the reference's per-scene tints, mapped by its scene order");
  for (const s of ROOM_SCENES) {
    const c = byId.get(s.shade);
    assert.ok(c, s.shade);
    assert.equal(s.hex.toLowerCase(), c!.hex.toLowerCase(), `${s.id}: the shade's hex is the catalog's`);
    assert.equal(s.shadeName, c!.name, `${s.id}: the shade's name is the catalog's`);
    assert.equal(s.family, c!.family.replace(/-/g, ' '), `${s.id}: the family in lower case words`);
    assert.match(s.alt, /^[A-Z][^.]+\.$/, `${s.id}: one sentence`);
    assert.doesNotMatch(s.alt, /\b(case|wallet|lenskin|airpods|phone)\b/i, `${s.id}: no product in the still`);
    assert.doesNotMatch(s.alt, /bath|shower|tub|shampoo/i, `${s.id}: nothing of a bathroom`);
    assert.ok(Number.isFinite(s.baseYaw)); assert.ok(Number.isFinite(s.basePitch));
    assert.equal(typeof s.toneDark, 'boolean', `${s.id}: the logotype's tone over the scene`);
    assert.ok(productById(s.product));
    for (const cls of ['wide', 'portrait'] as const) for (const k of ['loop', 'avif', 'webp'] as const) assert.equal(typeof s.files[cls][k], 'string', `${s.id} ${cls} ${k}: a URL string (empty under Node, the build's glob fills it)`);
  }
  // the logotype's tone over each scene (D5): scripts/room/scene-tone.mjs on 2026-10-23 measured Pearl Whisper at 5.0 to 18.6:1
  // and Urban Slate at 1.05 to 1.98:1 under the logotype's and the control's boxes at both viewports, so every scene keeps Pearl;
  // re-measured on 2026-11-02 with the section index's boxes in the control's place: Pearl 5.0 to 18.7:1, the picks unchanged
  assert.deepEqual(ROOM_SCENES.map((s) => s.toneDark), [false, false, false, false, false]);
  const director = read('src/scripts/hero/section4/director.ts');
  assert.match(director, /const sceneTone = \(\) => ROOM_SCENES\[carousel\.front\(\)\]\?\.toneDark \?\? false;/, 'the director takes the front scene\'s tone');
  assert.match(director, /tex = carousel\.out; toneDark = sceneTone\(\);/, 'over the scenes, from the third wipe on');
  assert.doesNotMatch(director, /toneDark = true;/, 'never Urban Slate by state alone');
  // no seam's cloud since the wrap left (2026-11-04): the plan's cover is 0; the frame still applies the plan's tone under
  // any cover, should a seam come back
  assert.match(director, /groundNeeded, cover: 0, cloud: null, toneDark \};/, 'no cover');
  assert.match(director, /toneDark \|\|= wipeOut >= 0\.5;/, 'and from half the fourth wipe, over section 5\'s fog (section-5.md 4)');
  assert.match(read('src/scripts/hero/loop.ts'), /if \(plan && \(cover > 0 \|\| \(roomOn && plan\.wipeIn >= 0\.5\)\)\) window\.__skreedLogo\?\.setTone\(plan\.toneDark\);/, "the plan's tone applied under any cover");
  assert.deepEqual(SCENE_SIZE, { wide: { width: 1280, height: 666 }, portrait: { width: 720, height: 1280 } });
  assert.equal(shadeLine(ROOM_SCENES[0]), 'Lilac, vivid violet');
  assert.equal(fill(ROOM_COPY.count, { n: 2, N: 5 }), '2 / 5');
  assert.equal(fill(ROOM_COPY.sceneLive, { n: 1, N: 5, name: 'Phone case', shade: 'Lilac, vivid violet' }), '1 of 5. Phone case. Lilac, vivid violet.');
  // the encoded files are in the repo (fcd9f9e): the ten loops, the twenty stills and products.bin
  for (const s of ROOM_SCENES) for (const cls of ['wide', 'portrait']) for (const ext of ['mp' + '4', 'avif', 'webp']) assert.ok(exists(`src/assets/room/flux/${s.id}-${cls}.${ext}`), `${s.id}-${cls}.${ext}`);
  assert.ok(exists('src/assets/room/flux/products.bin'));
});

test('the products: the five by id in catalog order (the AirPods Max case after the AirPods case it belongs with), with their names and trimmed lines', () => {
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.id), ['case', 'wallet', 'lenskin', 'airpods', 'airpods-max']);
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.name), ['Phone case', 'MagSafe wallet', 'Lenskin', 'AirPods case', 'AirPods Max case']);
  for (const p of ROOM_PRODUCTS) assert.notEqual(p.line, ROOM_CATALOG_LINES[p.id], `${p.id}: the trimmed line differs from the catalog's`);
  for (const p of ROOM_PRODUCTS) assert.ok(!('lineCatalog' in p) && !('shade' in p), `${p.id}: no catalog line, no shade of its own (the scenes carry the shades)`);
  assert.doesNotMatch(ROOM_PRODUCTS.find((p) => p.id === 'lenskin')!.line, /240/, 'the catalog gives the Lenskin no shade count');
});

test('no hall (section-4-no-hall.md AC1): its model, lightmap, stills, modules, build scripts and tests are gone, and the section names none of them', () => {
  for (const k of ['HALL', 'PRESS', 'RENDER_COLOURS', 'STATION_Q']) assert.ok(!(k in ROOM), `config/room.ts no longer exports ${k}`);
  for (const f of ['src/assets/room/hall.bin', 'src/assets/room/hall.glb', 'src/assets/room/hall.json', 'src/assets/room/hall-lightmap.avif', 'src/assets/room/hall-lightmap.webp', 'src/assets/room/stills',
    'src/scripts/hero/section4/hall.ts', 'src/scripts/hero/section4/assets.ts', 'src/scripts/hero/section4/post.ts', 'scripts/room/hall.py', 'scripts/room/hall-bin.mjs', 'scripts/room/encode.mjs',
    'tests/unit/hall-bin.test.ts', 'tests/unit/room-bubble.test.ts', 'tests/unit/room-prompt.test.ts']) assert.ok(!exists(f), `${f} is gone`);
  const director = read('src/scripts/hero/section4/director.ts'), walk = read('src/scripts/room/walk.ts'), trans = read('src/scripts/hero/section4/transition.ts');
  for (const [name, src] of [['director.ts', director], ['walk.ts', walk], ['Room.astro', astro], ['room.css', css]] as const) {
    assert.doesNotMatch(src, /createHall|hall\.ready|hall\.out|rmEnter|rmSkip|rmHint|rm-enter|rm-skip|rm-still|stillHallAlt|STATION_Q|bubbleAt|__skreedHall|__skreedRoomLook/, `${name}: nothing of the hall, the prompt, Skip or the bubble`);
  }
  assert.doesNotMatch(trans, /bubble\(|dissolve\(|BUBBLE/, "transition.ts keeps the fade hand-off's straight mix alone");
  assert.match(trans, /plain\(from, to, p\)/);
  assert.doesNotMatch(read('src/scripts/hero/section4/carousel.ts'), /scissor/, "the carousel's scissor went with the bubble");
  assert.doesNotMatch(read('src/scripts/hero/section4/carousel-math.ts'), /frameSource|RoomStateName/, 'one frame source: the carousel');
});

test("straight into the scenes (section-4-no-hall.md 2 and D3): the arrival at scene 1, its hold against a fling, the edges the page's, the poster column at once", () => {
  const director = read('src/scripts/hero/section4/director.ts'), walk = read('src/scripts/room/walk.ts'), scroll = read('src/scripts/hero/section4/scroll.ts');
  assert.match(director, /let state: RoomState = 'approach'/, 'the section starts in its approach');
  assert.match(director, /if \(state === 'approach' && inRoom && qRaw >= at && drawable0\(\) && !lay\.layout\?\.intro\) \{/, "the arrival at scene 1's q, once scene 1 can be drawn, never on a layout reading taken under the intro");
  assert.match(director, /const HOLD = \{ stillS: 0\.15, maxS: 1\.2 \};/, 'the hold: still 150 ms, at most 1.2 s');
  assert.match(director, /if \(scrollY > hold\.y \+ 0\.5\) \{ scrollTo\(\{ top: hold\.y, behavior: 'instant' \}\);/, 'only a page run past scene 1 is put back: a ride or a settle landing on it never is');
  assert.match(director, /const LET_GO_EVENTS = \['touchstart', 'pointerdown', 'keydown', 'wheel'\] as const;/);
  assert.match(director, /if \(e\.type === 'keydown' && \(e as KeyboardEvent\)\.repeat\) \{ if \(hold\) hold\.renew = true; return; \}/, "a held key's repeat is the key that carried the page in, never the new key that lets go: it renews the hold (AC3)");
  assert.match(director, /if \(e\.type === 'wheel' && \(e as WheelEvent\)\.deltaY >= 0\) \{ if \(hold\) hold\.renew = true; return; \}/, 'a downward wheel during the hold renews it: the input that carried the page in');
  assert.match(director, /if \(hold\.renew\) \{ hold\.renew = false; hold\.t0 = t; \}\n\s*if \(t - hold\.last >= HOLD\.stillS \|\| t - hold\.t0 >= HOLD\.maxS\) endHold\(\);/, "maxS counted from the carrying wheel's latest event");
  assert.match(director, /holdFrame\(f\.t\); arrival\(f\.t, eps\);\n\s*prevRaw = qRaw;\n\s*\/\/ the fourth wipe/, "the hold and the arrival before the frame's position is read for the fourth wipe (no exit trigger since 2026-11-03)");
  assert.match(director, /edge\(dir\) \{ const i = scene\(\); return dir > 0 \? i >= N - 1 : i <= 0; \}/, "both edges are the page's");
  assert.doesNotMatch(scroll, /room\.back\(\)|kind === 'back'/, 'no way back');
  assert.match(walk, /edge\(prevB, i <= 0\); edge\(nextB, i >= N - 1\);/, '"Previous scene" disabled at scene 1, "Next scene" at scene 5');
  assert.match(walk, /if \(f\.state === 'world' && !f\.stepping && shownScene === -1 && f\.scene >= 0\) arrive\(f\.scene\);/, 'a chunk that mounts after the arrival\'s event arrives at the scene on its first frame, so scene 1 never stands without its lines');
  assert.match(walk, /root\.dataset\.state === 'approach'\) island\(\)\?\.snap\(WORLD_START\)/, 'a Tab onto the pad during the approach puts the page on scene 1');
  assert.match(walk, /const toScenes = \(\) => \{ if \(!selfFocus && pad\.matches\(':focus-visible'\) && root\.dataset\.state === 'approach'\)/, 'a keyboard focus only: a click or a tap on the stage moves nothing (D4)');
  // the arrival is always at scene 1, the hold at once or at the finger's release; under a hold no re-sync and no exit;
  // the exit from the scenes only (never from the approach while scene 1 loads)
  assert.match(director, /setState\('world'\); under = 'world';\n\s*if \(scene\(\) !== 0\) setScene\(0, true\);\n\s*if \(root\) root\.dataset\.scene = '0';\n\s*if \(fingers > 0\) pendingHold = true; else startHold\(t, yAt\(WORLD_START\)\);/, 'the arrival lands on scene 1, whatever scroll carried the page');
  assert.match(director, /pendingHold = false; current\(\); holdAt = yAt\(WORLD_START\);/, "a finger's release puts the page back on scene 1");
  assert.match(director, /if \(!carousel\.busy\(\) && stepTo < 0 && !holding\(\) && qRaw >= WORLD_START - eps/, 'no re-sync under a hold');
  // the loading: scene 1's still alone in phase 1; every loop after the arrival, the nearest first
  assert.match(director, /carousel\.prepare\(0, false\); await carousel\.warm\(\);/, "phase 1 fetches scene 1's still alone");
  assert.match(director, /queueLoops\(Array\.from\(\{ length: N \}, \(_, k\) => k\)\.sort\(\(a, b\) => Math\.abs\(a - i\) - Math\.abs\(b - i\) \|\| b - a\)\)/, 'every loop queued, the nearest first');
  assert.match(director, /stillChain = stillChain\.catch\(\(\) => null\)\.then\(\(\) => decodeStill\(url, ac\.signal\)\)/, 'a still that timed out on a slow network never fails the stills queued after it');
  // a wheel burst running as the capture attaches in range is the page's (the fling's tail never steps)
  assert.match(scroll, /inherited = room\.inRange\(\) && quiet <= BURST\.carriedMs \? \(o\.twoWay \? lastDir : 1\) : 0;/, 'forward for the scenes, entered from above alone');
  assert.match(scroll, /if \(!e\.cancelable && !e\.ctrlKey && wd !== 0 && \(wd > 0 \|\| o\.twoWay\) && room\.inRange\(\) && !room\.edge\(wd\)\) \{ burstFeed\(burst, e\.deltaY, now\(\), true\); burstConsume\(burst\); room\.carried\(wd\); return; \}/, 'a latched forward gesture never steps');
  assert.match(director, /carried\(\) \{\n\s*if \(state !== 'world' \|\| stepTo >= 0\) return;\n\s*if \(hold\) hold\.renew = true;\n\s*else if \(holdAt === null && !pendingHold\) \{ current\(\); holdAt = yAt\(sceneQ\(scene\(\)\)\); \}/, "and the page is held on the scene's q while it comes");
  assert.match(scroll, /if \(wd === inherited && !e\.ctrlKey && now\(\) - burst\.last <= BURST\.carriedMs\)/);
  assert.match(scroll, /const against = wd === -inherited;\n\s*inherited = 0;\n\s*if \(against\) burstReset\(burst\);/, "a wheel event against the carried input begins a burst of its own: at scene 1 it is the page's at once (AC4)");
  // the poster tier shows the column at once, by no state
  assert.match(css, /:is\(html:not\(\.hero3d\), html\.poster\) \.rm-scenes, \.room\[data-tier="poster"\] \.rm-scenes, html:not\(\.js\) \.rm-scenes-static \{ display: grid; \}/);
  assert.doesNotMatch(css, /data-state="world"\] \.rm-scenes/, 'the column waits for no press');
});

test("Tune (X-13): every section 4 parameter has its control with its default inside, the scenes' ranges are ROOM_RANGES, the hall's, the bubble's, the world's and the travels' keys are gone", () => {
  const tune = read('src/components/dev/Tune.astro');
  const range = (k: string) => { const m = tune.match(new RegExp(`<input id="r-${k}" type="range" min="([-\\d.]+)" max="([-\\d.]+)" step="([\\d.]+)">`)); return m ? [+m[1], +m[2], +m[3]] as const : null; };
  for (const [k, v] of Object.entries(ROOM_PARAMS)) {
    const r = range(k);
    assert.ok(r, `Tune has no control for ${k}`);
    assert.ok(v >= r![0] && v <= r![1], `${k} = ${v} outside ${r![0]} to ${r![1]}`);
    assert.ok(tune.includes(`<output id="o-r-${k}">`), `Tune has no readout for ${k}`);
  }
  for (const [k, [a, b, s]] of Object.entries(ROOM_RANGES)) assert.deepEqual(range(k), [a, b, s], `${k}: Tune's range is ROOM_RANGES'`);
  // the defaults of X-13, and carousel-math.ts's constants the same
  assert.deepEqual({ stepMs: ROOM_PARAMS.stepMs, sweepDeg: ROOM_PARAMS.sweepDeg, sweepDegPortrait: ROOM_PARAMS.sweepDegPortrait, fovStep: ROOM_PARAMS.fovStep, fovReturnAt: ROOM_PARAMS.fovReturnAt, lightStart: ROOM_PARAMS.lightStart, lightSoft: ROOM_PARAMS.lightSoft, lightBoost: ROOM_PARAMS.lightBoost, keyLightMs: ROOM_PARAMS.keyLightMs, snapMs: ROOM_PARAMS.snapMs },
    { stepMs: 770, sweepDeg: 80, sweepDegPortrait: 22, fovStep: 42, fovReturnAt: 0.65, lightStart: 0.5, lightSoft: 0.64, lightBoost: 0.17, keyLightMs: 1100, snapMs: 500 });
  assert.equal(STEP.ms, ROOM_PARAMS.stepMs); assert.equal(STEP.sweepDeg, ROOM_PARAMS.sweepDeg); assert.equal(STEP.sweepDegPortrait, ROOM_PARAMS.sweepDegPortrait); assert.equal(STEP.fovStep, ROOM_PARAMS.fovStep); assert.equal(STEP.fovReturnAt, ROOM_PARAMS.fovReturnAt); assert.equal(STEP.keyLightMs, ROOM_PARAMS.keyLightMs);
  assert.deepEqual(ROOM_RANGES.stepMs, [400, 1200, 10]); assert.deepEqual(ROOM_RANGES.sweepDegPortrait, [12, 80, 1]); assert.deepEqual(ROOM_RANGES.snapMs, [200, 900, 10]);
  for (const k of ['eye', 'fov', 'lookYaw', 'lookPitch', 'keySpeed', 'mouseLook', 'exposure', 'albedo', 'seams', 'grain', 'vignette', 'corners', 'bleach', 'split', 'noise', 'gloss', 'bloom', 'stationDist', 'door', 'seamGlow', 'promptChip', 'bubbleMs', 'lapReset', 'travelMs', 'ringCount', 'travelRoll', 'morphMs', 'enterPushMs', 'worldBloom', 'landTravelMs', 'parkTravel', 'sweepSpeed', 'sweepAngle', 'sweepWidth', 'transitionMs', 'wallsColour', 'catalogWords', 'productScale', 'roomPitch', 'roomExposure', 'roomVignette', 'roomCorners', 'roomBleach', 'productLight', 'labelFloat']) {
    assert.ok(!(k in ROOM_PARAMS), `${k} is gone`); assert.ok(!tune.includes(`r-${k}"`), `Tune's ${k} is gone`);
  }
  assert.ok('handoff' in ROOM_PARAMS, 'the hand-off from the fog stays');
  assert.ok(!('bubbleMs' in ROOM_RANGES), "the bubble's range is gone");
});

test('AC10, plain text: room.css and Room.astro carry no panel, fill, border but the focus ring, or shadow; the bottom shade lives in the carousel\'s shader', () => {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
  assert.ok(rules.length > 30);
  for (const { sel, body } of rules) {
    for (const d of body.split(';').map((x) => x.trim()).filter(Boolean)) {
      const [prop, ...rest] = d.split(':'), val = rest.join(':').trim();
      assert.doesNotMatch(prop, /box-shadow|backdrop-filter|filter/, `${sel}: ${d}`);
      if (/border-radius/.test(prop)) assert.equal(val, '0', `${sel}: ${d}`);   // a control's UA corner taken off, nothing rounded
      // the poster column and the loop's fade stand on --night, each picture on a --skeleton box until it decodes (H1)
      // (and a control's UA fill and border taken off: none and 0)
      if (/^background/.test(prop.trim())) assert.match(val, /^(none|var\(--(night|skeleton)\))$/, `${sel}: ${d}`);
      if (/^border(?!-radius)/.test(prop.trim()) && !/^(0|none)$/.test(val)) assert.match(sel, /:focus-visible/, `${sel}: a border outside the focus ring (${d})`);
    }
  }
  assert.doesNotMatch(css, /gradient/, 'no gradient in the DOM: the bottom shade is the carousel\'s (AC10, AC12)');
  assert.match(read('src/scripts/hero/section4/carousel.ts'), /uShade/, 'the bottom shade in the plane\'s shader');
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

test("E-S4-font, amended: Questrial in capitals (Sam, 2026-11-04), at the quiz's own sizes; the words with the 44 px hit area", () => {
  const quiz = read('src/styles/quiz.css');
  const qv = (name: string) => quiz.match(new RegExp(`--qz-${name}: ([^;]+);`))?.[1], rv = (name: string) => css.match(new RegExp(`--rm-${name}: ([^;]+);`))?.[1];
  for (const n of ['fs', 'fs-q']) { assert.ok(qv(n)); assert.equal(rv(n), qv(n), `--rm-${n} equals the quiz's --qz-${n}`); }
  assert.match(css, /--rm-font: "Questrial", "Questrial Fallback", sans-serif;/);
  assert.match(css, /\.room \{[^}]*font: 400 var\(--rm-fs\) \/ 1\.45 var\(--rm-font\); text-transform: uppercase; letter-spacing: 0;/);
  assert.match(read('src/styles/fonts.css'), /font-family: "Questrial"; font-weight: 400;[^}]*url\(\/fonts\/questrial-400-latin\.woff2\)/);
  // a proportional face: every line takes the decode's proportional mode, the rolled glyph drawn over the face's own
  assert.match(read('src/scripts/room/walk.ts'), /el\.dataset\.dc = 'prop'; dec\.prepare\(el\);/);
  assert.match(css, /\.room \.dc > span\[data-r\]::after \{ content: attr\(data-r\); position: absolute;/);
  assert.match(css, /\.room \.sr-only \{ text-transform: none; \}/, 'assistive technology keeps the sentence case');
  assert.match(css, /\.rm-scene-name \{ font-size: var\(--rm-fs-q\)/);
  // the controls are words: the quiz's link pattern, 44 px to tap; the previous and next words bottom right in the scenes
  assert.match(css, /\.room \.rm-link \{[^}]*min-height: 44px; min-width: 44px;[^}]*text-decoration-line: underline; text-decoration-thickness: 1px; text-underline-offset: 0\.4em;/);
  assert.match(css, /\.room \.rm-nav \{ position: absolute; right: var\(--inset\); bottom: var\(--rm-bottom\);/);
  assert.match(css, /\.room:not\(\[data-state="world"\]\) \.rm-nav \{ display: none; \}/);
  // the scene hint is a row of scene 1's text grid under the count (D6), on both classes: no position of its own, no portrait rule
  assert.doesNotMatch(css, /rm-scene-hint \{ bottom/, 'the hint has no bottom of its own');
  assert.doesNotMatch(css, /orientation: portrait\) \{ \.room \.rm-scene-hint/, 'no portrait rule for the hint');
  assert.match(css, /\.rm-scene :is\(\.rm-scene-hint, \.rm-scene-more\)\[hidden\] \{ display: none; \}/);
  // the 2.2.2 control (spec 3 and 5): bottom right one row above the previous and next words, its text swapping between pause and play, no aria-pressed, hidden until data-pause is set, never in the approach
  assert.match(css, /\.room \.rm-pause \{ right: var\(--inset\); bottom: calc\(var\(--rm-bottom\) \+ 44px \+ var\(--s2\)\); \}/, 'the pause control bottom right, one row above the words');
  assert.doesNotMatch(css, /\.rm-pause \{ left:/, 'no longer top left');
  assert.match(css, /\.room:not\(\[data-pause="1"\]\) \.rm-pause, \.room:is\(\[data-state="approach"\]\) \.rm-pause \{ display: none; \}/, 'the pause control hidden unless the director shows it, and never in the approach');
  const walkSrc = read('src/scripts/room/walk.ts');
  assert.match(walkSrc, /dec\.set\(pause, motionOn \? R\.pause : R\.play\)/, 'the text swaps between pause and play');
  for (const src of [astro, walkSrc, css]) assert.doesNotMatch(src, /aria-pressed/, 'no aria-pressed');
  assert.match(walkSrc, /root\.dataset\.pause === '1' && f\.state !== 'approach'/, 'shown only once data-pause is set, never in the approach');
  for (const id of ['rmPrev', 'rmNext', 'rmPause']) assert.match(astro, new RegExp(`class="rm-[a-z]+ rm-link" id="${id}"`));
});

test('the DOM (section-4-flux.md 5, section-4-no-hall.md 5): the pad, the loading line, the scenes list, the words, the pause control, the live region, noscript', () => {
  // open at rest: the quiz gate that held it hidden and data-locked left on 2026-11-04 (Sam: "unlock everything")
  assert.match(astro, /<section class="room" id="room" aria-label=\{R\.aria\} data-state="approach">/);
  assert.match(astro, /<div class="rm-pad" id="rmPad" tabindex="0" role="group" aria-label=\{R\.worldAria\}><\/div>/, "the pad, the section's first tab stop");
  assert.match(astro, /<p class="rm-line rm-loading" id="rmLoading" role="status" hidden>/);
  assert.match(astro, /<p class="rm-scene-line">\{s\.line\}<\/p>\s*\{\/\*[^*]*\*\/\}\s*\{s\.i === 0 && <p class="rm-scene-hint" id="rmSceneHint" hidden>\{R\.sceneHintTouch\}<\/p>\}\s*<p class="rm-scene-count">\{s\.count\}<\/p>\s*<p class="rm-scene-more" aria-hidden="true" hidden><\/p>/, 'the scene hint a row of scene 1\'s lines above the count (the words share the count\'s row at 390), the loading line under it');
  assert.doesNotMatch(astro, /rm-line rm-scene-hint/, 'the hint is no bottom-centre line');
  assert.match(read('src/scripts/room/walk.ts'), /if \(sceneHint && !sceneHint\.hidden && i !== 0\) setLine\(sceneHint, ''\);/, 'the hint goes when the scene changes without a step');
  assert.match(astro, /<h2 class="sr-only">\{R\.scenesTitle\}<\/h2>/);
  assert.match(astro, /<ol class="rm-scenes" id="rmScenes" aria-label=\{R\.scenesAria\}>/);
  assert.match(astro, /<li class="rm-scene" data-id=\{s\.id\} data-i=\{s\.i\}>/);
  assert.match(astro, /<h3 class="rm-scene-name" id=\{`rmName-\$\{s\.id\}`\} tabindex="-1">\{s\.name\}<\/h3>/);
  for (const c of ['rm-scene-shade', 'rm-scene-line', 'rm-scene-count']) assert.ok(astro.includes(`<p class="${c}">`), c);
  assert.match(astro, /<p class="rm-scene-more" aria-hidden="true" hidden><\/p>/, 'the loading line is no status: one announcement per arrival (AC13)');
  assert.match(astro, /<p class="sr-only rm-scene-alt" id=\{`rmAlt-\$\{s\.id\}`\}>\{s\.alt\}<\/p>/);
  assert.match(astro, /<div class="rm-nav" id="rmNav">\s*<button type="button" class="rm-prev rm-link" id="rmPrev">\{R\.prev\}<\/button>\s*<button type="button" class="rm-next rm-link" id="rmNext">\{R\.next\}<\/button>\s*<\/div>/);
  assert.match(astro, /<button type="button" class="rm-pause rm-link" id="rmPause" hidden>\{R\.pause\}<\/button>/);
  assert.match(astro, /<p class="sr-only" id="rmLive" aria-live="polite"><\/p>/);
  assert.doesNotMatch(astro, /rm-noscript|R\.noscript/, 'the noscript column speaks for itself');
  // every scene still with its formats and its size, lazily on the 3D path (data-srcset) and in the noscript column
  assert.equal((astro.match(/data-srcset=\{s\.files\.(portrait|wide)\.(avif|webp)\}/g) ?? []).length, 3);
  assert.match(astro, /<img data-src=\{s\.files\.wide\.webp\} alt=\{s\.alt\} width=\{Wd\.width\} height=\{Wd\.height\} loading="lazy"/);
  assert.match(astro, /<img src=\{s\.files\.wide\.webp\} alt=\{s\.alt\} width=\{Wd\.width\} height=\{Wd\.height\} loading="lazy"/);
  for (const gone of ['data-lands', 'rm-land', 'rmLands', 'landsTitle', 'landsAria', 'rmProducts', 'rmLabel', 'universe']) assert.ok(!astro.includes(gone), `${gone} is gone`);
  // the words are wired to the island's step; the keys of the scenes are scroll.ts's alone (walk.ts has none)
  const walk = read('src/scripts/room/walk.ts');
  assert.match(walk, /prevB\?\.addEventListener\('click'/); assert.match(walk, /nextB\?\.addEventListener\('click'/);
  assert.match(walk, /island\(\)\?\.step\(-1\)/); assert.match(walk, /island\(\)\?\.step\(1\)/);
  assert.doesNotMatch(walk, /addEventListener\('keydown', \(e\)|WALK_KEYS|FORWARD|BACK\.has/, 'no key of its own');
  assert.match(read('src/scripts/hero/section4/scroll.ts'), /keyDir\(e\)/, 'scroll.ts owns the keys');
});

test('copy: sentence case, no em or en dash, no emoji, no banned words (CLAUDE.md 3, 4, 16, 17); the ids of section 3', () => {
  const lines = [...Object.values(ROOM_COPY), ...ROOM_PRODUCTS.flatMap((p) => [p.name, p.line]), ...ROOM_SCENES.flatMap((s) => [s.alt, s.shadeName, s.family, shadeLine(s)])];
  assert.doesNotMatch(read('src/config/room.ts'), /\b(seamless|seamlessly|elevate)\b/i, 'room.ts carries none of rule 17\'s words');
  for (const s of lines) {
    assert.doesNotMatch(s, /[\u2013\u2014]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|seamlessly|elevate|unleash|next-level|revolutionary)\b/i, s);
    if (s.length > 1) assert.notEqual(s, s.toUpperCase(), `all caps: ${s}`);
  }
  for (const k of ['aria', 'loading', 'still', 'clipBlocked', 'worldAria', 'sceneHintTouch', 'sceneHintWheel', 'sceneHintKeys', 'loadingScene', 'next', 'prev', 'pause', 'play', 'scenesTitle', 'scenesAria', 'sceneLive', 'count']) assert.ok(k in ROOM_COPY, k);
  for (const k of ['landHintTouch', 'landHintKeys', 'loadingLand', 'landsTitle', 'landsAria', 'landLive', 'stageAria', 'hintTouch', 'hintKeys', 'enter', 'key', 'loadingRoom', 'skip', 'stillHallAlt', 'noscript']) assert.ok(!(k in ROOM_COPY), `${k} is dropped`);
  assert.equal(ROOM_COPY.aria, 'Section 4: the five scenes');
  assert.equal(ROOM_COPY.loading, 'Loading the scenes...');
  assert.equal(ROOM_COPY.worldAria, 'The five scenes. Use Down and Up to move between them.');
  assert.equal(ROOM_COPY.next, 'Next scene'); assert.equal(ROOM_COPY.prev, 'Previous scene');
  assert.equal(ROOM_COPY.pause, 'Pause motion'); assert.equal(ROOM_COPY.play, 'Play motion');
});

test('render colours (AC3): the scene files make no colour of their own; the carousel draws only named colours, tokens and shades', () => {
  // every Color made in these scene files is white or a hex from config by name; none carries a raw hex (the carousel's
  // hexes are the scenes' catalog shades and the reference's tints from config, by name)
  const allowed = /^(|1, 1, 1|hex)$/;
  for (const f of ['transition', 'director']) {
    const src = read(`src/scripts/hero/section4/${f}.ts`);
    for (const m of src.matchAll(/new Color\(([^()]*)\)/g)) assert.match(m[1].trim(), allowed, `${f}.ts: new Color(${m[1]})`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{6}\b|0x[0-9a-fA-F]{6}\b/, `${f}.ts carries a raw hex colour`);
  }
});

test("the world's modules, assets, data, scripts and tests are gone (X-11); the director keeps the budget's markers and the states of section 5", () => {
  for (const f of ['world', 'rings', 'blend', 'cloud', 'stream', 'depth', 'garden', 'park-flight', 'travel', 'travel-stub', 'travel-depth', 'travel-park', 'travel-video', 'universe']) assert.ok(!exists(`src/scripts/hero/section4/${f}.ts`), `${f}.ts is gone`);
  for (const d of ['src/assets/room/lands', 'src/assets/room/park', 'src/assets/room/garden', 'src/assets/room/clips']) assert.ok(!exists(d), `${d} is gone`);
  for (const f of ['src/data/room-lands.json', 'src/data/room-clips.json', 'src/data/room-lands.ledger.json', 'scripts/room/lands.py', 'scripts/room/park.py', 'scripts/room/garden.py', 'scripts/room/encode-lands.mjs', 'scripts/room/encode-clips.mjs', 'scripts/room/clip-flash.py', 'scripts/room/park-review.mjs']) assert.ok(!exists(f), `${f} is gone`);
  for (const f of ['room-world', 'room-lands', 'room-park', 'room-travel-park', 'room-video']) assert.ok(!exists(`tests/unit/${f}.test.ts`), `${f}.test.ts is gone`);
  for (const f of ['scripts/room/pack.mjs', 'scripts/room/products.py', 'scripts/room/render-products.py', 'scripts/room/products-bin.mjs', 'scripts/room/encode-flux.mjs', 'scripts/room/render-stills.mjs', 'scripts/room/contrast.mjs']) assert.ok(exists(f), `${f} stays`);
  const director = read('src/scripts/hero/section4/director.ts');
  for (const m of ['skreed:room', '__skreedRoom', '__skreedRoomFrame']) assert.ok(director.includes(m), `the director carries the marker ${m}`);
  assert.doesNotMatch(director, /world\.ts|travel|garden|ROOM_LANDS|landQ/, 'nothing of the lands in the director');
  for (const st of ["'approach'", "'world'"]) assert.ok(director.includes(`setState(${st})`), `the director enters ${st}`);
  for (const st of ["'hall'", "'entering'", "'back'", "'seam'"]) assert.ok(!director.includes(`setState(${st})`), `no ${st} state`);
  assert.match(read('src/config/room.ts'), /export type RoomState = 'approach' \| 'world';/, 'no seam state since the wrap left (2026-11-04)');
});

test("the composite's cover input (section-4-flux.md 5, X-15): the v11 literal is the prototype's, its cover variant blends the cloud, the island draws with it", () => {
  assert.equal(withCover(COMPOSITE_FRAG_V11), COMPOSITE_FRAG_V11_COVER);
  assert.notEqual(COMPOSITE_FRAG_V11_COVER, COMPOSITE_FRAG_V11);
  assert.doesNotMatch(COMPOSITE_FRAG_V11, /tCloud|uCover/, 'the literal untouched');
  assert.match(COMPOSITE_FRAG_V11_COVER, /uniform sampler2D tCloud; uniform float uCover;/);
  assert.match(COMPOSITE_FRAG_V11_COVER, /if \(uCover > 0\.0\) \{ vec4 cl = texture2D\(tCloud, vUv\); fin = fin \* \(1\.0 - cl\.a\) \+ cl\.rgb; \}/, 'premultiplied over the result');
  assert.match(read('src/scripts/hero/intro/igloo.ts'), /composite: \{ full: COMPOSITE_FRAG_V11_COVER \}/);
  const loop = read('src/scripts/hero/loop.ts');
  assert.match(loop, /C\.uCover\.value = cover; C\.tCloud\.value = cover > 0 \? plan!\.cloud : null;/);
  assert.doesNotMatch(loop, /rideLoop|inLoop|plan!\.loop/, 'the fourth wipe is retired');
  assert.match(read('src/scripts/hero/post/composite.ts'), /tCloud: \{ value: null as Texture \| null \}, uCover: \{ value: 0 \}/);
});

test("the two versions of the scenes' backgrounds (Sam, 2026-11-04; docs/specs/section-4-pictures.md): his pictures by default, the loops kept", () => {
  assert.equal(ROOM.ROOM_BACKDROP_DEFAULT, 'pictures', 'the pictures version is the default');
  // under Node the build's glob is empty, so no picture is in: every request draws the loops, the old version
  assert.equal(ROOM.roomBackdrop(''), 'loops');
  assert.equal(ROOM.roomBackdrop('?scenes=pictures'), 'loops', 'the pictures only where every file is in the build');
  assert.equal(ROOM.roomBackdrop('?scenes=loops'), 'loops');
  assert.equal(ROOM.ROOM_LOOPS, true);
  const cfg = read('src/config/room.ts');
  assert.match(cfg, /import\.meta\.glob<string>\('\.\.\/assets\/room\/pictures\/\*\.\{avif,webp\}'/, 'the pictures from their own folder');
  assert.match(cfg, /\/\(\?:\^\|\[\?&\]\)scenes=\(pictures\|loops\)\(\?:&\|\$\)\/\.exec\(search\)/, '?scenes= picks the version for a visit');
  assert.match(cfg, /\{ loop: '', avif: pictureUrl\(`\$\{id\}-\$\{cls\}\.avif`\), webp: pictureUrl\(`\$\{id\}-\$\{cls\}\.webp`\) \}/, 'the pictures version names no loop');
  assert.match(read('src/scripts/hero/section4/director.ts'), /const video: VideoPool \| null = ROOM_LOOPS && !reduced && allowed\(\) \? createPool\(N\) : null;/, 'no loop elements in the pictures version');
  // his upload stays out of the public repository; the script that makes the files is committed
  assert.match(read('.gitignore'), /^src\/assets\/room\/pictures\/$/m);
  assert.ok(exists('scripts/room/prepare-pictures.mjs'));
  // the pictures' own alts and logotype tones: scripts/room/scene-tone.mjs --pictures on 2026-11-04 measured Urban Slate
  // at 3.11 to 7.73:1 over the first four (ember's worst 2.93:1, flagged, Pearl's 2.15) and Pearl at 5.08 to 5.72:1 over the green room
  assert.deepEqual(ROOM.PICTURE_ROWS.map((r) => r.id), ROOM_SCENES.map((s) => s.id));
  assert.deepEqual(ROOM.PICTURE_ROWS.map((r) => r.toneDark), [true, true, true, true, false]);
  for (const r of ROOM.PICTURE_ROWS) {
    assert.match(r.alt, /^[A-Z][^.]+\.$/, `${r.id}: one sentence`);
    assert.doesNotMatch(r.alt, /\b(case|wallet|lenskin|airpods|phone)\b/i, `${r.id}: no product in the picture`);
  }
});
