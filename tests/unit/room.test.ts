// Section 4 (docs/specs/section-4.md 7 for the hall; docs/specs/section-4-flux.md 5, 7 and 9 for the scenes: AC2, AC8,
// AC10, AC13, AC15, X-13): the scroll map and the 1580svh track with the pinned-screen invariant, the five scenes with
// their products, catalog shades by id, finishes, key lights, alts and files, every Tune control with its default inside
// its range and the ranges of X-13 (bubbleMs's from transition.ts), the section as plain text (no panels, fills, borders
// but the focus ring's, or shadows; the bottom shade in the carousel's shader; the quiz's type at the quiz's sizes), the
// DOM of section 5, the copy's brand rules over ROOM_COPY and ROOM_SCENES, the render colours, the world's modules gone,
// and the composite's cover input.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { HALL, LOOP_START, PRESS, RENDER_COLOURS, ROOM_COPY, ROOM_HEIGHT, ROOM_PARAMS, ROOM_PRODUCTS, ROOM_RANGES, ROOM_SCENES, ROOM_SCREENS, SCENE_COUNT, SCENE_SIZE, SCENES_END, STATION_Q, WORLD_START, fill, productById, sceneQ, shadeLine } from '../../src/config/room.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { URBAN_SLATE } from '../../src/config/tokens.ts';
import { BUBBLE } from '../../src/scripts/hero/section4/transition.ts';
import { STEP } from '../../src/scripts/hero/section4/carousel-math.ts';
import { COMPOSITE_FRAG_V11, COMPOSITE_FRAG_V11_COVER } from '../../src/scripts/hero/v11/glsl.ts';
import { withCover } from '../../src/scripts/hero/post/shaders.ts';
import { ROOM_CATALOG_LINES } from '../fixtures/room-catalog.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const exists = (p: string) => existsSync(new URL(`../../${p}`, import.meta.url));
const byId = new Map(SHADES.map((s) => [s.id, s]));
const css = read('src/styles/room.css'), astro = read('src/components/room/Room.astro');

test('the scroll map (section-4-flux.md 5): the scenes at a step of 0.5 from 10, the hold to 12.8, the loop screen and the tail, 15.8 screens in every state', () => {
  assert.deepEqual({ ...ROOM_SCREENS }, { wipe: 1, walk: 8, station: 1, step: 0.5, hold: 0.8, loop: 1, tail: 1 });
  assert.equal(STATION_Q, 9.5);
  assert.equal(WORLD_START, 10);
  assert.equal(SCENE_COUNT, 5);
  assert.deepEqual(Array.from({ length: SCENE_COUNT }, (_, i) => sceneQ(i)), [10, 10.5, 11, 11.5, 12]);
  assert.equal(SCENES_END, 12);
  assert.equal(LOOP_START, 12.8);
  assert.equal(ROOM_HEIGHT, 15.8);
  assert.ok(css.includes(`.room .rm-track { height: ${ROOM_HEIGHT * 100}svh; }`), 'room.css: the track at 1580svh');
  assert.doesNotMatch(css, /data-lands|1300svh|1400svh|1600svh|1800svh|2000svh/, 'no per-N heights: the track is the same in every state');
  // the stage is pinned through the loop screen and the tail: the seam's trigger and the jump's screen end inside the document
  assert.ok(LOOP_START + ROOM_SCREENS.loop + ROOM_SCREENS.tail <= ROOM_HEIGHT - 1, 'the loop and the tail inside the pinned track');
  assert.ok(SCENES_END + ROOM_SCREENS.hold === LOOP_START, 'the hold ends at the seam');
});

test('the five scenes (section-4-flux.md 3): the rooms in order, the products, the catalog shades by id, the finishes, the key lights, the alts, the files', () => {
  assert.deepEqual(ROOM_SCENES.map((s) => s.id), ['cove', 'grove', 'ember', 'palace', 'dawn']);
  assert.deepEqual(ROOM_SCENES.map((s) => s.i), [0, 1, 2, 3, 4]);
  assert.deepEqual(ROOM_SCENES.map((s) => s.order), [1, 2, 3, 4, 5]);
  assert.deepEqual(ROOM_SCENES.map((s) => s.product), ['case', 'airpods', 'wallet', 'lenskin', 'case'], 'scene 5 shows the phone case until the lanyard model lands (X-8)');
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
    assert.ok(Number.isFinite(s.baseYaw));
    assert.equal(typeof s.toneDark, 'boolean', `${s.id}: the logotype's tone over the scene`);
    assert.ok(productById(s.product));
    for (const cls of ['wide', 'portrait'] as const) for (const k of ['loop', 'avif', 'webp'] as const) assert.equal(typeof s.files[cls][k], 'string', `${s.id} ${cls} ${k}: a URL string (empty under Node, the build's glob fills it)`);
  }
  // the logotype's tone over each scene (D5): scripts/room/scene-tone.mjs on 2026-10-23 measured Pearl Whisper at 5.0 to 18.6:1
  // and Urban Slate at 1.05 to 1.98:1 under the logotype's and the control's boxes at both viewports, so every scene keeps Pearl
  assert.deepEqual(ROOM_SCENES.map((s) => s.toneDark), [false, false, false, false, false]);
  const director = read('src/scripts/hero/section4/director.ts');
  assert.match(director, /const sceneTone = \(\) => ROOM_SCENES\[carousel\.front\(\)\]\?\.toneDark \?\? false;/, 'the director takes the front scene\'s tone');
  assert.match(director, /tex = carousel\.out; toneDark = sceneTone\(\);/, 'over the scenes');
  assert.match(director, /toneDark = b\.done && sceneTone\(\);/, 'once the bubble is done');
  assert.doesNotMatch(director, /toneDark = true;/, 'never Urban Slate by state alone');
  // under a seam's cloud (Pearl Whisper where it is thickest) the logotype and the control turn Urban Slate from half cover,
  // and the frame applies the plan's tone under any cover, after the exit's jump too (the checker's finding on D5's first fix)
  assert.match(director, /toneDark \|\|= cover >= 0\.5;/, 'Urban Slate from half cover');
  assert.match(read('src/scripts/hero/loop.ts'), /if \(plan && \(cover > 0 \|\| \(roomOn && plan\.wipeIn >= 0\.5\)\)\) window\.__skreedLogo\?\.setTone\(plan\.toneDark\);/, "the plan's tone applied under any cover");
  assert.deepEqual(SCENE_SIZE, { wide: { width: 1280, height: 666 }, portrait: { width: 720, height: 1280 } });
  assert.equal(shadeLine(ROOM_SCENES[0]), 'Lilac, vivid violet');
  assert.equal(fill(ROOM_COPY.count, { n: 2, N: 5 }), '2 / 5');
  assert.equal(fill(ROOM_COPY.sceneLive, { n: 1, N: 5, name: 'Phone case', shade: 'Lilac, vivid violet' }), '1 of 5. Phone case. Lilac, vivid violet.');
  assert.equal(fill(ROOM_COPY.wrapLive, { n: 5, N: 5, name: 'Phone case', shade: 'Pastel, vivid violet' }), 'Round to the five scenes. 5 of 5. Phone case. Pastel, vivid violet.');
  // the encoded files are in the repo (fcd9f9e): the ten loops, the twenty stills and products.bin
  for (const s of ROOM_SCENES) for (const cls of ['wide', 'portrait']) for (const ext of ['mp' + '4', 'avif', 'webp']) assert.ok(exists(`src/assets/room/flux/${s.id}-${cls}.${ext}`), `${s.id}-${cls}.${ext}`);
  assert.ok(exists('src/assets/room/flux/products.bin'));
});

test('the products: the four by id in catalog order, with their names and trimmed lines', () => {
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.id), ['case', 'wallet', 'lenskin', 'airpods']);
  assert.deepEqual(ROOM_PRODUCTS.map((p) => p.name), ['Phone case', 'MagSafe wallet', 'Lenskin', 'AirPods case']);
  for (const p of ROOM_PRODUCTS) assert.notEqual(p.line, ROOM_CATALOG_LINES[p.id], `${p.id}: the trimmed line differs from the catalog's`);
  for (const p of ROOM_PRODUCTS) assert.ok(!('lineCatalog' in p) && !('shade' in p), `${p.id}: no catalog line, no shade of its own (the scenes carry the shades)`);
  assert.doesNotMatch(ROOM_PRODUCTS.find((p) => p.id === 'lenskin')!.line, /240/, 'the catalog gives the Lenskin no shade count');
});

test('the hall and the press: the stations against the measured frame, and the press as built', () => {
  assert.equal(HALL.xWest, -5.95); assert.equal(HALL.xEast, 5.93); assert.equal(HALL.height, 3.99);
  assert.ok(Math.abs(HALL.start - (HALL.xEast - 0.6)) < 1e-9, 'the start station is 0.6 m inside the east wall');
  assert.ok(Math.abs(HALL.end - (HALL.door.face + ROOM_PARAMS.stationDist)) < 1e-9, 'the door station is stationDist short of the door');
  assert.ok(ROOM_PARAMS.stationDist < HALL.promptFrom, 'the prompt shows before the station');
  assert.deepEqual({ ...PRESS }, { swing: 0.9, glideFrom: 0.3, glide: 0.9, dolly: 1.6, freeze: 1.2 });
  assert.equal(PRESS.glideFrom + PRESS.glide, PRESS.freeze, 'the hall freezes as its glide ends');
});

test("Tune (X-13): every section 4 parameter has its control with its default inside, the scenes' ranges are ROOM_RANGES, bubbleMs's is the bubble's, the world's and the travels' keys are gone", () => {
  const tune = read('src/components/dev/Tune.astro');
  const range = (k: string) => { const m = tune.match(new RegExp(`<input id="r-${k}" type="range" min="([-\\d.]+)" max="([-\\d.]+)" step="([\\d.]+)">`)); return m ? [+m[1], +m[2], +m[3]] as const : null; };
  for (const [k, v] of Object.entries(ROOM_PARAMS)) {
    const r = range(k);
    assert.ok(r, `Tune has no control for ${k}`);
    assert.ok(v >= r![0] && v <= r![1], `${k} = ${v} outside ${r![0]} to ${r![1]}`);
    assert.ok(tune.includes(`<output id="o-r-${k}">`), `Tune has no readout for ${k}`);
  }
  for (const [k, [a, b, s]] of Object.entries(ROOM_RANGES)) assert.deepEqual(range(k), [a, b, s], `${k}: Tune's range is ROOM_RANGES'`);
  assert.deepEqual([...ROOM_RANGES.bubbleMs.slice(0, 2)], [...BUBBLE.msRange], "bubbleMs's range is transition.ts's msRange");
  assert.equal(ROOM_PARAMS.bubbleMs, BUBBLE.ms);
  // the defaults of X-13, and carousel-math.ts's constants the same
  assert.deepEqual({ stepMs: ROOM_PARAMS.stepMs, sweepDeg: ROOM_PARAMS.sweepDeg, sweepDegPortrait: ROOM_PARAMS.sweepDegPortrait, fovStep: ROOM_PARAMS.fovStep, fovReturnAt: ROOM_PARAMS.fovReturnAt, lightStart: ROOM_PARAMS.lightStart, lightSoft: ROOM_PARAMS.lightSoft, lightBoost: ROOM_PARAMS.lightBoost, keyLightMs: ROOM_PARAMS.keyLightMs, snapMs: ROOM_PARAMS.snapMs },
    { stepMs: 770, sweepDeg: 80, sweepDegPortrait: 22, fovStep: 42, fovReturnAt: 0.65, lightStart: 0.5, lightSoft: 0.64, lightBoost: 0.17, keyLightMs: 1100, snapMs: 500 });
  assert.equal(STEP.ms, ROOM_PARAMS.stepMs); assert.equal(STEP.sweepDeg, ROOM_PARAMS.sweepDeg); assert.equal(STEP.sweepDegPortrait, ROOM_PARAMS.sweepDegPortrait); assert.equal(STEP.fovStep, ROOM_PARAMS.fovStep); assert.equal(STEP.fovReturnAt, ROOM_PARAMS.fovReturnAt); assert.equal(STEP.keyLightMs, ROOM_PARAMS.keyLightMs);
  assert.deepEqual(ROOM_RANGES.stepMs, [400, 1200, 10]); assert.deepEqual(ROOM_RANGES.sweepDegPortrait, [12, 80, 1]); assert.deepEqual(ROOM_RANGES.snapMs, [200, 900, 10]);
  for (const k of ['travelMs', 'ringCount', 'travelRoll', 'morphMs', 'enterPushMs', 'worldBloom', 'landTravelMs', 'parkTravel', 'sweepSpeed', 'sweepAngle', 'sweepWidth', 'transitionMs', 'wallsColour', 'catalogWords', 'productScale', 'roomPitch', 'roomExposure', 'roomVignette', 'roomCorners', 'roomBleach', 'productLight', 'labelFloat']) {
    assert.ok(!(k in ROOM_PARAMS), `${k} is gone`); assert.ok(!tune.includes(`r-${k}"`), `Tune's ${k} is gone`);
  }
  assert.ok('mouseLook' in ROOM_PARAMS && 'lapReset' in ROOM_PARAMS && 'handoff' in ROOM_PARAMS && 'stationDist' in ROOM_PARAMS && 'door' in ROOM_PARAMS);
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

test("E-S4-font: section 2's label type, IBM Plex Mono Medium in capitals, at the quiz's own sizes; the words with the 44 px hit area", () => {
  const quiz = read('src/styles/quiz.css');
  const qv = (name: string) => quiz.match(new RegExp(`--qz-${name}: ([^;]+);`))?.[1], rv = (name: string) => css.match(new RegExp(`--rm-${name}: ([^;]+);`))?.[1];
  for (const n of ['fs', 'fs-q']) { assert.ok(qv(n)); assert.equal(rv(n), qv(n), `--rm-${n} equals the quiz's --qz-${n}`); }
  assert.match(css, /--rm-font: "IBM Plex Mono", ui-monospace, monospace;/);
  assert.match(css, /\.room \{[^}]*font: 500 var\(--rm-fs\) \/ 1\.45 var\(--rm-font\); text-transform: uppercase; letter-spacing: 0;/);
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
  // the 2.2.2 control (spec 3 and 5): bottom right one row above the previous and next words, its text swapping between pause and play, no aria-pressed, hidden until data-pause is set, never in the hall
  assert.match(css, /\.room \.rm-pause \{ right: var\(--inset\); bottom: calc\(var\(--rm-bottom\) \+ 44px \+ var\(--s2\)\); \}/, 'the pause control bottom right, one row above the words');
  assert.doesNotMatch(css, /\.rm-pause \{ left:/, 'no longer top left');
  assert.match(css, /\.room:not\(\[data-pause="1"\]\) \.rm-pause, \.room:is\(\[data-state="hall"\]\) \.rm-pause \{ display: none; \}/, 'the pause control hidden unless the director shows it, and never in the hall');
  const walkSrc = read('src/scripts/room/walk.ts');
  assert.match(walkSrc, /dec\.set\(pause, motionOn \? R\.pause : R\.play\)/, 'the text swaps between pause and play');
  for (const src of [astro, walkSrc, css]) assert.doesNotMatch(src, /aria-pressed/, 'no aria-pressed');
  assert.match(walkSrc, /root\.dataset\.pause === '1' && f\.state !== 'hall'/, 'shown only once data-pause is set, never in the hall');
  for (const id of ['rmEnter', 'rmSkip', 'rmPrev', 'rmNext', 'rmPause']) assert.match(astro, new RegExp(`class="rm-[a-z]+ rm-link" id="${id}"`));
});

test('the DOM (section-4-flux.md 5): the prompt, the pad, Skip, the lines, the scenes list, the words, the pause control, the live region, noscript', () => {
  // rendered hidden and data-locked behind the quiz until the result or Skip quiz (quiz-gate.md D1; tests/unit/quiz-gate.test.ts has the gate)
  assert.match(astro, /<section class="room" id="room" aria-label=\{R\.aria\} data-state="hall" hidden data-locked>/);
  assert.match(astro, /<button type="button" class="rm-enter rm-link" id="rmEnter" aria-keyshortcuts="E"><span class="rm-key" aria-hidden="true">\{R\.key\}<\/span><span class="rm-enter-text">\{R\.enter\}<\/span><\/button>/, 'the prompt is never hidden: there are always five scenes');
  assert.match(astro, /<div class="rm-pad" id="rmPad" tabindex="0" role="group" aria-label=\{R\.stageAria\}><\/div>/);
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
  assert.match(astro, /<p class="rm-line rm-noscript">\{R\.noscript\}<\/p>/);
  // every scene still with its formats and its size, lazily on the 3D path (data-srcset) and in the noscript column
  assert.equal((astro.match(/data-srcset=\{s\.files\.(portrait|wide)\.(avif|webp)\}/g) ?? []).length, 3);
  assert.match(astro, /<img data-src=\{s\.files\.wide\.webp\} alt=\{s\.alt\} width=\{Wd\.width\} height=\{Wd\.height\} loading="lazy"/);
  assert.match(astro, /<img src=\{s\.files\.wide\.webp\} alt=\{s\.alt\} width=\{Wd\.width\} height=\{Wd\.height\} loading="lazy"/);
  for (const gone of ['data-lands', 'rm-land', 'rmLands', 'landsTitle', 'landsAria', 'rmProducts', 'rmLabel', 'universe']) assert.ok(!astro.includes(gone), `${gone} is gone`);
  // the words are wired to the island's step and the way back; the keys of the scenes are scroll.ts's alone
  const walk = read('src/scripts/room/walk.ts');
  assert.match(walk, /prevB\?\.addEventListener\('click'/); assert.match(walk, /nextB\?\.addEventListener\('click'/);
  assert.match(walk, /isl\.back\(\)/); assert.match(walk, /isl\.step\(-1\)/); assert.match(walk, /step\(1\)/);
  assert.match(walk, /if \(state !== 'hall'\) return;/, 'no world key branch');
  assert.doesNotMatch(walk, /FORWARD|BACK\.has/);
  assert.match(walk, /if \(dir > 0 && lastQRaw >= STATION_Q\) dir = 0;/, 'the pad\'s walk ends at the station');
  assert.match(read('src/scripts/hero/section4/scroll.ts'), /keyDir\(e\)/, 'scroll.ts owns the keys');
});

test('copy: sentence case, no em or en dash, no emoji, no banned words (CLAUDE.md 3, 4, 16, 17); the ids of section 3', () => {
  const lines = [...Object.entries(ROOM_COPY).filter(([k]) => k !== 'key').map(([, v]) => v), ...ROOM_PRODUCTS.flatMap((p) => [p.name, p.line]), ...ROOM_SCENES.flatMap((s) => [s.alt, s.shadeName, s.family, shadeLine(s)])];
  assert.doesNotMatch(read('src/config/room.ts'), /\b(seamless|seamlessly|elevate)\b/i, 'room.ts carries none of rule 17\'s words');
  for (const s of lines) {
    assert.doesNotMatch(s, /[\u2013\u2014]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|seamlessly|elevate|unleash|next-level|revolutionary)\b/i, s);
    if (s.length > 1) assert.notEqual(s, s.toUpperCase(), `all caps: ${s}`);
  }
  assert.equal(ROOM_COPY.key, '[E]');
  assert.equal(ROOM_COPY.enter, 'Enter Skreed universe');
  for (const k of ['aria', 'stageAria', 'hintTouch', 'hintKeys', 'loading', 'still', 'enter', 'key', 'loadingRoom', 'skip', 'stillHallAlt', 'clipBlocked', 'worldAria', 'sceneHintTouch', 'sceneHintWheel', 'sceneHintKeys', 'loadingScene', 'next', 'prev', 'pause', 'play', 'scenesTitle', 'scenesAria', 'sceneLive', 'wrapLive', 'count', 'noscript']) assert.ok(k in ROOM_COPY, k);
  for (const k of ['landHintTouch', 'landHintKeys', 'loadingLand', 'landsTitle', 'landsAria', 'landLive']) assert.ok(!(k in ROOM_COPY), `${k} is dropped`);
  assert.equal(ROOM_COPY.worldAria, 'The five scenes. Use Down and Up to move between them.');
  assert.equal(ROOM_COPY.next, 'Next scene'); assert.equal(ROOM_COPY.prev, 'Previous scene');
  assert.equal(ROOM_COPY.pause, 'Pause motion'); assert.equal(ROOM_COPY.play, 'Play motion');
  assert.equal(ROOM_COPY.noscript, 'The entrance needs JavaScript. The scenes are below.');
});

test('render colours (AC3, E-S4-light): the hall clears to Urban Slate from the press; the scenes draw only named colours, tokens and shades', () => {
  const slate = [1, 3, 5].map((i) => parseInt(URBAN_SLATE.slice(i, i + 2), 16) / 255);
  RENDER_COLOURS.leaf.forEach((v, i) => assert.ok(Math.abs(v - slate[i]) < 1e-9, 'the leaves are Urban Slate'));
  RENDER_COLOURS.hallEntering.forEach((v, i) => assert.ok(Math.abs(v - slate[i]) < 1e-9, 'the clear colour while entering is Urban Slate'));
  assert.deepEqual([...RENDER_COLOURS.hallClear], [1, 1, 1]);
  for (const v of [...RENDER_COLOURS.fixture, ...RENDER_COLOURS.floorLight]) assert.ok(v > 0.5 && v <= 1.2);
  // every Color made in these scene files is white, a named render colour or a token; none carries a raw hex (the carousel's
  // hexes are the scenes' catalog shades and the reference's tints from config, by name)
  const allowed = /^(|1, 1, 1|\.\.\.RENDER_COLOURS\.\w+|RENDER_COLOURS\.leaf\[0\], RENDER_COLOURS\.leaf\[1\], RENDER_COLOURS\.leaf\[2\]|hex)$/;
  for (const f of ['hall', 'transition', 'post', 'director']) {
    const src = read(`src/scripts/hero/section4/${f}.ts`);
    for (const m of src.matchAll(/new Color\(([^()]*)\)/g)) assert.match(m[1].trim(), allowed, `${f}.ts: new Color(${m[1]})`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{6}\b|0x[0-9a-fA-F]{6}\b/, `${f}.ts carries a raw hex colour`);
  }
  assert.match(read('src/scripts/hero/section4/hall.ts'), /entering\(on\) \{ clear = on \? CLEAR_ENTERING : CLEAR;/);
});

test("the world's modules, assets, data, scripts and tests are gone (X-11); the director keeps the budget's markers and the states of section 5", () => {
  for (const f of ['world', 'rings', 'blend', 'cloud', 'stream', 'depth', 'garden', 'park-flight', 'travel', 'travel-stub', 'travel-depth', 'travel-park', 'travel-video', 'universe']) assert.ok(!exists(`src/scripts/hero/section4/${f}.ts`), `${f}.ts is gone`);
  for (const d of ['src/assets/room/lands', 'src/assets/room/park', 'src/assets/room/garden', 'src/assets/room/clips']) assert.ok(!exists(d), `${d} is gone`);
  for (const f of ['src/data/room-lands.json', 'src/data/room-clips.json', 'src/data/room-lands.ledger.json', 'scripts/room/lands.py', 'scripts/room/park.py', 'scripts/room/garden.py', 'scripts/room/encode-lands.mjs', 'scripts/room/encode-clips.mjs', 'scripts/room/clip-flash.py', 'scripts/room/park-review.mjs']) assert.ok(!exists(f), `${f} is gone`);
  for (const f of ['room-world', 'room-lands', 'room-park', 'room-travel-park', 'room-video']) assert.ok(!exists(`tests/unit/${f}.test.ts`), `${f}.test.ts is gone`);
  for (const f of ['src/assets/room/hall.bin', 'src/assets/room/hall-lightmap.avif', 'scripts/room/pack.mjs', 'scripts/room/products.py', 'scripts/room/render-products.py', 'scripts/room/hall.py', 'scripts/room/hall-bin.mjs', 'scripts/room/products-bin.mjs', 'scripts/room/encode-flux.mjs', 'scripts/room/render-stills.mjs', 'scripts/room/contrast.mjs']) assert.ok(exists(f), `${f} stays`);
  const director = read('src/scripts/hero/section4/director.ts');
  for (const m of ['skreed:room', '__skreedRoom', '__skreedRoomFrame']) assert.ok(director.includes(m), `the director carries the marker ${m}`);
  assert.doesNotMatch(director, /world\.ts|travel|garden|ROOM_LANDS|landQ/, 'nothing of the lands in the director');
  for (const st of ["'entering'", "'world'", "'back'", "'seam'"]) assert.ok(director.includes(`setState(${st})`), `the director enters ${st}`);
  assert.match(read('src/config/room.ts'), /export type RoomState = 'hall' \| 'entering' \| 'world' \| 'back' \| 'seam';/);
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
