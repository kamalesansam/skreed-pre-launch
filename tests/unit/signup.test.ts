// Section 5, the sign-up (docs/specs/section-5.md 7: AC2, AC4, AC8, AC11, AC12): the config (the jars, their worth and
// families, the addresses on record, the copy's brand rules and the discount words kept out), the jar bin byte for byte
// against the packer with its manifest and read back by the island's parser, the maths (the placement, the packing, the
// fill's curve, the bands), the section as plain text (signup.css and Signup.astro: no fill, no border but the field's
// line and the focus ring, no shadow, no radius, the quiz's type at the quiz's sizes), the markup's links (https, a new
// tab, noopener; the credit's two links), and the wiring in hero.ts and loop.ts (the chunk, the frame, the composite).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { FILL_MS, FOLLOW_COUNT, SIGNUP_COPY, SIGNUP_CREDIT, SIGNUP_FOLLOWS, SIGNUP_JARS, SIGNUP_KEYS, SIGNUP_LEAD_ENDPOINT, WORTH_TOTAL, fill, followWord, jarLevel, yoursLevel, yoursState } from '../../src/config/signup.ts';
import { beadColours } from '../../src/config/signup-colours.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import { JAR, bandOwner, beadHex, easeFill, halfHeight, levelAt, packBeads, placeJar, seeded } from '../../src/scripts/hero/section5/jars-math.ts';
import { parseProductsBin } from '../../src/scripts/hero/section4/products-bin.ts';
import { BIN_PATH, CREDIT, GLB_PATH, LINE_KB, MANIFEST_PATH, jarBin } from '../../scripts/signup/jar-bin.mjs';
import MANIFEST from '../../src/data/signup-jar-bin.json' with { type: 'json' };

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const css = read('src/styles/signup.css'), astro = read('src/components/signup/Signup.astro'), config = read('src/config/signup.ts');
const allStrings = (): string[] => Object.values(SIGNUP_COPY);

test('the jars (section-5.md 3): Sam\'s order, the worth a quarter, a quarter, a half, the families with 24 catalog shades each, the addresses on record', () => {
  assert.deepEqual(SIGNUP_JARS.map((j) => j.id), ['facebook', 'youtube', 'instagram', 'yours']);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.id), ['facebook', 'youtube', 'instagram']);
  assert.equal(FOLLOW_COUNT, 3); assert.equal(WORTH_TOTAL, 4);
  assert.deepEqual(SIGNUP_FOLLOWS.map(jarLevel), [0.25, 0.25, 0.5]);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.families), [['blissful-blue'], ['roaring-red'], ['playful-pink', 'vivid-violet']]);
  for (const j of SIGNUP_FOLLOWS) {
    assert.match(j.url, /^https:\/\//, `${j.id}: plain https, never an app scheme (B3)`);
    assert.doesNotMatch(j.url, /instagram:\/\/|fb:\/\/|youtube:\/\//);
    for (const f of j.families) assert.equal(SHADES.filter((s) => s.family === f).length, 24, `${f}: a catalog family`);
    assert.match(j.alt, /^[A-Z][^.]+\.$/, `${j.id}: one sentence`);
  }
  // the addresses are the store's own (the footer of skreed.com, read 2026-10-26) and the record's: each noted in the config with its source
  assert.match(config, /read from the\s+\* footer of https:\/\/www\.skreed\.com\/ on 2026-10-26/);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.url), ['https://facebook.com/skreedofficial', 'https://www.youtube.com/@skreedofficial', 'https://www.instagram.com/skreedofficial/']);
  assert.equal(SIGNUP_JARS[3].url, ''); assert.equal(SIGNUP_JARS[3].verb, null);
  assert.deepEqual([beadColours(['blissful-blue']).length, beadColours(['playful-pink', 'vivid-violet']).length], [24, 48]);
  for (const hex of beadColours(['blissful-blue', 'roaring-red', 'playful-pink', 'vivid-violet'])) assert.ok(SHADES.some((s) => s.hex === hex), `${hex}: a catalog hex (A2)`);
  // the shade table stays out of the client chunks (section-5.md 6): the hexes are joined at build and ride each slot's markup
  assert.doesNotMatch(config, /shades\.gen/, 'config/signup.ts imports no shade table');
  assert.doesNotMatch(read('src/scripts/hero/section5/jars.ts'), /shades\.gen|signup-colours/, 'nor the jar chunk');
  assert.doesNotMatch(read('src/scripts/signup/signup.ts'), /shades\.gen|signup-colours/, 'nor the DOM script');
  assert.match(astro, /import \{ beadColours \} from '\.\.\/\.\.\/config\/signup-colours\.ts';/);
  assert.match(astro, /<div class="su-slot" data-slot=\{j\.id\} data-colours=\{j\.colours\}>/, 'each slot carries its hexes');
  assert.equal(followWord(SIGNUP_FOLLOWS[0]), 'Follow on Facebook'); assert.equal(followWord(SIGNUP_FOLLOWS[1]), 'Subscribe on YouTube'); assert.equal(followWord(SIGNUP_FOLLOWS[2]), 'Follow on Instagram');
  assert.deepEqual([yoursLevel([]), yoursLevel(['instagram']), yoursLevel(['facebook', 'youtube']), yoursLevel(['facebook', 'youtube', 'instagram']), yoursLevel(['instagram', 'instagram'])], [0, 0.5, 0.5, 1, 1]);
  assert.deepEqual([yoursState(0), yoursState(1), yoursState(2), yoursState(3)], ['Nothing collected yet', '1 of 3 collected', '2 of 3 collected', 'Full']);
  assert.equal(FILL_MS, 900);
  assert.equal(SIGNUP_LEAD_ENDPOINT, '/api/signup');
  assert.deepEqual({ ...SIGNUP_KEYS }, { follows: 'skreed:signup-follows', queue: 'skreed:signup-queue' });
  assert.equal(fill(SIGNUP_COPY.live, { platform: 'Instagram', n: 1, N: 3 }), 'Instagram collected. Your jar: 1 of 3.');
  assert.equal(fill(SIGNUP_COPY.done, { email: 'a@b.co' }), 'Done. Your colours are saved to a@b.co.');
});

test('copy (A4, section-5.md 3 and AC8): sentence case, no em or en dash, no emoji, no buzzwords, and none of the picture\'s discount words', () => {
  for (const s of allStrings()) {
    assert.doesNotMatch(s, /[–—]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|elevate|unleash|next-level|revolutionary)\b/i, s);
    assert.doesNotMatch(s, /\b(discount|discounts|off|save up|code|codes|free|price|savings|verify)\b|%/i, `a discount, price or verification word: ${s}`);
    assert.doesNotMatch(s, /\bpssst\b/i, s);
  }
  for (const h of [SIGNUP_COPY.h, SIGNUP_COPY.got, SIGNUP_COPY.jars]) { assert.notEqual(h, h.toUpperCase(), `all caps: ${h}`); assert.equal(h[0], h[0].toUpperCase(), h); }
  assert.doesNotMatch(SIGNUP_COPY.h, /\d/);
  assert.equal(SIGNUP_COPY.h, 'You’ve made it this far.');
  assert.equal(SIGNUP_COPY.got, 'Got your colours?');
  assert.equal(SIGNUP_COPY.jars, 'Every follow fills the jar');
  for (const s of allStrings()) assert.doesNotMatch(s, /\bcolor\b/i, `colour with a u: ${s}`);
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
  const chunk = read('src/scripts/hero/section5/jars.ts');
  assert.doesNotMatch(chunk, /GLTFLoader|meshopt/i, 'no glTF loader in the chunk (X-7)');
  assert.ok(gzipSync(read('src/scripts/hero/section4/products-bin.ts')).length < 2048);
});

test('the maths (section-5.md 3): the placement fills 0.9 of the slot, the packing stays inside the jar lowest first and is the same every time, the fill eases to its end, the bands follow the follows', () => {
  const view = { w: 390, h: 844 }, slot = { x: 16, y: 300, w: 171, h: 214 };
  const p = placeJar(slot, view);
  assert.ok(Math.abs(p.px - JAR.fill * slot.h) < 1e-9, 'the jar 0.9 of the slot\'s height');
  assert.ok(Math.abs((p.scale / (2 * halfHeight())) * view.h - p.px) < 1e-6, 'the scale projects to that height');
  // the slot's centre projects to the jar's position: NDC from the centre at the plane's half-height
  const hh = halfHeight(), cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
  assert.ok(Math.abs(p.x - ((cx / view.w) * 2 - 1) * hh * (view.w / view.h)) < 1e-9);
  assert.ok(Math.abs(p.y - (1 - (cy / view.h) * 2) * hh) < 1e-9);
  const wide = placeJar({ x: 0, y: 0, w: 100, h: 400 }, view);
  assert.ok(Math.abs(wide.px - 100 / JAR.width) < 1e-9, 'a narrow slot: the width decides');
  const beads = packBeads(), again = packBeads();
  assert.equal(beads.length, JAR.perJar);
  assert.deepEqual(beads, again, 'the same packing every time (seeded)');
  assert.notDeepEqual(packBeads(JAR.perJar, 2), beads, 'another seed, another packing');
  const R = (JAR.width / 2) * JAR.innerR;
  for (const b of beads) {
    assert.ok(Math.hypot(b.x, b.z) <= R + 1e-9, 'inside the inner radius');
    assert.ok(b.h >= 0 && b.h <= 1);
    assert.ok(b.y >= -0.5 + JAR.floor && b.y <= -0.5 + JAR.shoulder, 'between the floor and the shoulder');
  }
  for (let i = 1; i < beads.length; i++) assert.ok(beads[i].h >= beads[i - 1].h, 'lowest first');
  assert.ok(beads[beads.length - 1].h > 0.9, 'a full jar is full to its shoulder');
  assert.equal(easeFill(0), 0); assert.equal(easeFill(1), 1); assert.ok(easeFill(0.3) > 0.6, 'power2.out: fast at first');
  assert.equal(levelAt(0, 0.5, 10, 10, FILL_MS, false), 0); assert.equal(levelAt(0, 0.5, 10, 10.9, FILL_MS, false), 0.5); assert.equal(levelAt(0, 0.5, 10, 10, FILL_MS, true), 0.5, 'instant under reduced motion');
  assert.ok(levelAt(0.25, 0.75, 10, 10.45, FILL_MS, false) > 0.6);
  assert.deepEqual([bandOwner(0.1, [2], 4), bandOwner(0.49, [2], 4), bandOwner(0.5, [2], 4), bandOwner(0.9, [2], 4)], [0, 0, -1, -1], 'Instagram first: the bottom half');
  assert.deepEqual([bandOwner(0.2, [1, 2], 4), bandOwner(0.3, [1, 2], 4), bandOwner(0.74, [1, 2], 4), bandOwner(0.76, [1, 2], 4)], [0, 1, 1, -1]);
  assert.deepEqual([bandOwner(0.99, [1, 1, 2], 4), bandOwner(1, [1, 1, 2], 4), bandOwner(0.5, [], 4), bandOwner(0.5, [1], 0)], [2, 2, -1, -1]);
  assert.equal(beadHex(25, ['#a', '#b', '#c']), '#b'); assert.equal(beadHex(0, []), '#000000');
  const r = seeded(7); const a = r(), b = r(); assert.ok(a >= 0 && a < 1 && b >= 0 && b < 1 && a !== b);
});

test('plain text (AC4; rules 5, 6, 11, 25, 39): signup.css carries no fill but none, transparent, --night or --skeleton, no border but the field\'s line and the focus ring, no shadow or filter, no radius, the quiz\'s type at the quiz\'s sizes', () => {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
  assert.ok(rules.length > 30);
  for (const { sel, body } of rules) {
    for (const d of body.split(';').map((x) => x.trim()).filter(Boolean)) {
      const [prop, ...rest] = d.split(':'), val = rest.join(':').trim();
      assert.doesNotMatch(prop, /box-shadow|text-shadow|backdrop-filter|^filter/, `${sel}: ${d}`);
      if (/border-radius/.test(prop)) assert.equal(val, '0', `${sel}: ${d}`);
      if (/^background/.test(prop.trim())) assert.match(val, /^(none|transparent|var\(--(night|skeleton)\))$/, `${sel}: ${d}`);
      if (/^border(-bottom|-top|-left|-right)?$/.test(prop.trim()) && val !== '0') assert.match(sel + d, /su-input|focus-visible/, `a border in signup.css: ${sel}: ${d}`);
    }
  }
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /pill|btn|panel|card/, 'no pill, button, panel or card class');
  const quiz = read('src/styles/quiz.css');
  const token = (src: string, name: string) => src.match(new RegExp(`${name}: (clamp\\([^;]+\\));`))?.[1];
  assert.equal(token(css, '--su-fs'), token(quiz, '--qz-fs'), 'the body size is the quiz\'s');
  assert.equal(token(css, '--su-fs-q'), token(quiz, '--qz-fs-q'), 'the heading size is the quiz\'s');
  assert.match(css, /\.signup \{[^}]*font: 500 var\(--su-fs\) \/ 1\.45 var\(--su-font\); text-transform: uppercase; letter-spacing: 0; font-synthesis: none;/);
  assert.match(css, /--su-font: "IBM Plex Mono", ui-monospace, monospace/);
  assert.match(css, /\.signup \.sr-only \{ text-transform: none; \}/, 'sentence case for assistive technology');
  assert.doesNotMatch(css, /animation|transition:(?! background-color 0s 86400s)/, 'nothing moves on its own in the stylesheet (the autofill hold is no motion)');
});

test('the markup (AC3, AC8, AC9): every line through the decode, the follow words https links to a new tab with noopener, the credit\'s two links, the form the quiz\'s, no style attribute, no emoji', () => {
  assert.doesNotMatch(astro, /\sstyle=/, 'no style attribute (the CSP)');
  assert.doesNotMatch(astro, /[–—]|[\u{1F300}-\u{1FAFF}]/u);
  assert.match(astro, /<a class="su-link su-follow" href=\{j\.url\} target="_blank" rel="noopener" data-id=\{j\.id\} aria-label=\{`\$\{j\.word\}\. \$\{C\.newTab\}\.`\} data-dc>/);
  assert.match(astro, /<span data-dc>\{C\.creditLead\}<\/span>\{' '\}<a href=\{SIGNUP_CREDIT\.source\} rel="noopener" data-dc>\{SIGNUP_CREDIT\.author\}<\/a>\{C\.creditJoin\}<a href=\{SIGNUP_CREDIT\.licenceUrl\} rel="noopener" data-dc>\{SIGNUP_CREDIT\.licence\}<\/a>\{C\.creditEnd\}/, 'the credit: the words decode, the spaces and punctuation stand between them');
  assert.equal(SIGNUP_COPY.creditLead, 'Glass jar model by'); assert.equal(SIGNUP_COPY.creditJoin, ', '); assert.equal(SIGNUP_COPY.creditEnd, '.');
  for (const id of ['su-h', 'su-sub', 'su-jars-h', 'su-got', 'su-got-sub', 'su-keep', 'su-fine', 'su-state']) assert.match(astro, new RegExp(`class="${id}"[^>]*data-dc`), `${id} decodes`);
  assert.match(astro, /<input class="su-input" id="suEmail" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" required aria-describedby="suErrEmail">/);
  assert.match(astro, /<button type="submit" class="su-link" id="suSend" data-dc>\{C\.send\}<\/button>/);
  assert.match(astro, /\{LEADS && \(/, 'the form only with PUBLIC_LEADS on');
  assert.match(astro, /<div class="su-loopend" id="suLoopEnd" aria-hidden="true"><\/div>/, 'the loop end under the body');
  assert.match(astro, /<p class="sr-only" id="suLive" aria-live="polite"><\/p>/);
  assert.match(astro, /<picture class="su-still" data-lazy>/, 'the poster tier\'s still, lazy');
  const script = read('src/scripts/signup/signup.ts');
  assert.match(script, /sessionStorage/, 'the follows for the visit');
  assert.doesNotMatch(script, /localStorage/, 'never localStorage (B3)');
  assert.match(script, /credentials: 'omit'/, 'the request carries no cookie');
  assert.match(script, /email\.addEventListener\('blur'/, 'validation on blur');
  assert.doesNotMatch(script, /addEventListener\('input'|addEventListener\('keyup'/, 'never per keystroke (H4)');
});

test('the wiring (AC1, AC6, AC10, AC11): hero.ts imports the chunk at idle and when the section nears, the loop composes the fourth wipe and section 5\'s frame, the director takes the exit and the rest from section 5', () => {
  const hero = read('src/scripts/hero/hero.ts'), loop = read('src/scripts/hero/loop.ts');
  assert.match(hero, /import\('\.\/section5\/jars\.ts'\)/);
  assert.match(hero, /rootMargin: '200% 0px' \}\);\n\s*near\.observe\(signupEl\);/, 'within two screens');
  assert.match(hero, /\.then\(\(r\) => r\?\.warmCloud\(\)\)\.then\(\(\) => \{ if \(!life\.dead\) void loadSignup\(\); \}\)/, 'at idle after the cloud');
  assert.match(hero, /exitY: \(\) => \{ const v = ctx\.signup \? ctx\.signup\.exitY\(\) : NaN; return Number\.isFinite\(v\) \? v : signupDom\(\)\.exit; \}/);
  assert.match(hero, /signupReady: \(\) => !signupEl \|\| !ctx\.signup \|\| ctx\.signup\.ready \|\| ctx\.signup\.failed/);
  assert.match(hero, /document\.getElementById\('room'\), signupEl\]\.filter/, 'the island runs while section 5 is in view');
  assert.match(loop, /const S5 = ctx\.signup, s5want = !!S5 && \(wipeOut > 0 \|\| S5\.inView\(\)\);/);
  assert.match(loop, /if \(roomOn && wipeOut > 0\) \{ C\.tA\.value = plan!\.tex; C\.tB\.value = s5on \? p5!\.tex : groundTex; C\.uProgress\.value = wipeOut; C\.uParA\.value = 0; \}/, 'the cut as the first wipe\'s, the near side held');
  assert.match(loop, /else if \(s5on && !roomOn\) \{ C\.tA\.value = p5!\.tex; C\.tB\.value = p5!\.tex; C\.uProgress\.value = 0; C\.uParA\.value = 0; \}/, 'section 5\'s frame whole');
  const chunk = read('src/scripts/hero/section5/jars.ts');
  assert.match(chunk, /export const SIGNUP_MARK = 'skreed:signup';/, 'the budget\'s marker');
  assert.match(chunk, /window\.__skreedSignupFrame\?\.\(\{ on, cover: f\.cover, wipe: f\.wipe \}/, 'the frame to the DOM');
  assert.match(chunk, /addEventListener\('skreed:signup', onSignup\)/, 'the press heard');
  assert.match(chunk, /if \(!d\.id\) \{ y\.level = y\.from = y\.to = yoursLevelOf\(order\); y\.t0 = -1;/, 'saved follows set the jar at once');
  assert.match(chunk, /order = domFollows\(\);\s+\/\/ the DOM as it stands now/, 'the DOM read again once the jars are built');
  assert.match(read('src/scripts/signup/signup.ts'), /if \(follows\.length\) window\.dispatchEvent\(new CustomEvent\('skreed:signup', \{ detail: \{ id: '', follows: \[\.\.\.follows\], ms: 0 \} \}\)\);/, 'the mount tells the island its saved follows');
  assert.doesNotMatch(chunk, /MeshPhysicalMaterial|transmission/, 'our own glass, no transmission pass (D10)');
});

test('(8) the lock (quiz-gate.md D9): section 5 rendered hidden and data-locked with section 4, its inline step after the markup from QUIZ_GATE.key, opened by the same unlock, and the no-JS rule', () => {
  const astro = read('src/components/signup/Signup.astro'), inline = read('src/inline/signup-gate.inline.js'), gate = read('src/scripts/quiz/gate.ts'), css = read('src/styles/signup.css');
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
