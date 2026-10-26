// The quiz gate (docs/specs/quiz-gate.md AC7; Sam, 2026-10-26: "it shouldnt scroll past the quiz untill someone takes
// the quiz, section 4 should be locked ... the moment they click on skip quiz, it should go to section 4 automatically,
// with the transition included"). (a) Room.astro renders section#room hidden and data-locked, with the inline step right
// after it assembled by inlineScript() from QUIZ_GATE.key and its ?room=open part only under PUBLIC_HERO_HOOKS, and
// room.css shows a locked section without JavaScript; (b) Quiz.astro's Skip quiz after Begin in the intro, in two copies,
// and one in each footer after the Back conditional, none in the results or the gift, with quiz.css's footer grid and
// no-JS rule, and deck.ts's wiring; (c) the ride's maths in gate.ts: RIDE_MS, the ease against scroll-math.ts's
// easeStandard and tokens.css's --ease-standard, rideY and rideTarget; (d) hero.ts's docTop (NaN for an element with no
// box), canWrap carrying the lock, the unlock's listener and the hall hook, with the hall's loading kept lock or no lock
// (the spec's D5 as amended at build: the hall must be ready when Skip quiz is pressed), and director.ts's layout read,
// begin() and wrap() while locked; (e) gate.ts importing only config/quiz.ts and track.ts, and the copy rules over the
// new files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIZ_COPY, QUIZ_GATE } from '../../src/config/quiz.ts';
import { EASE, HALL_WAIT_MS, RIDE_DRIFT_PX, RIDE_GUARD_MS, RIDE_MS, ease, rideTarget, rideY } from '../../src/scripts/quiz/gate.ts';
import { EASE_STANDARD, easeStandard } from '../../src/scripts/hero/section4/scroll-math.ts';
import { inlineScript } from '../../src/components/shell/inlineScript.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const room = read('src/components/room/Room.astro'), roomCss = read('src/styles/room.css');
const quiz = read('src/components/quiz/Quiz.astro'), quizCss = read('src/styles/quiz.css'), deck = read('src/scripts/quiz/deck.ts');
const gate = read('src/scripts/quiz/gate.ts'), inline = read('src/inline/room-gate.inline.js'), hooksPart = read('src/inline/room-gate.hooks.inline.js');
const hero = read('src/scripts/hero/hero.ts'), director = read('src/scripts/hero/section4/director.ts');
const dashes = new RegExp(`[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]`);
/** a source without its comments */
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');

test('(a) the lock: section#room hidden and data-locked, the inline step right after it from QUIZ_GATE.key, its ?room=open part in hooks builds only, the visit event, and the no-JS rule', () => {
  assert.equal(QUIZ_GATE.key, 'skreed:quiz-done');
  assert.match(room, /<section class="room" id="room" aria-label=\{R\.aria\} data-state="hall" hidden data-locked>/, 'rendered locked on every tier');
  assert.match(room, /<\/section>\n<script is:inline set:html=\{gateCode\}><\/script>\n<script>/, 'the inline step right after the closing tag, before the module script');
  assert.match(room, /import gate from '\.\.\/\.\.\/inline\/room-gate\.inline\.js\?raw';\nimport gateHooks from '\.\.\/\.\.\/inline\/room-gate\.hooks\.inline\.js\?raw';/);
  assert.match(room, /const hooks = import\.meta\.env\.PUBLIC_HERO_HOOKS === '1';\nconst gateCode = inlineScript\('room-gate\.js', \{ KEY: QUIZ_GATE\.key \}, hooks \? gateHooks : '', gate\);/, 'assembled as the head Gate is, the key prepended');
  assert.match(room, /if \(root\.dataset\.open === 'visit'\) track\('room_unlock', \{ by: 'visit' \}\);/, "the visit's unlock tracked by the module script");
  // the step itself: the flag read in try and catch, the three attributes, the override's write before the read
  assert.match(inline, /try \{ v = sessionStorage\.getItem\(KEY\); \} catch \(e\)/);
  assert.match(inline, /if \(o\) \{ try \{ sessionStorage\.setItem\(KEY, '1'\); \} catch \(e\)/, 'the override writes the flag before the read');
  assert.match(inline, /if \(v === '1' \|\| o\) \{ r\.removeAttribute\('hidden'\); r\.removeAttribute\('data-locked'\); r\.setAttribute\('data-open', 'visit'\); \}/, 'and opens the section itself where storage throws');
  assert.doesNotMatch(code(inline), /room=open|hero3d|poster|matchMedia/, 'nothing of the override, the tier or motion in the production step');
  assert.match(hooksPart, /window\.__skreedRoomOverride = function \(\) \{ return \/\[\?&\]room=open\(\?:&\|\$\)\/\.test\(location\.search\); \};/);
  // assembled: the production step carries the key and no override; the hooks step carries both
  const prod = inlineScript('room-gate.js', { KEY: QUIZ_GATE.key }, '', inline), test = inlineScript('room-gate.js', { KEY: QUIZ_GATE.key }, hooksPart, inline);
  assert.ok(prod.includes('skreed:quiz-done') && !prod.includes('room=open'), 'production: the key, no room=open');
  assert.ok(test.includes('skreed:quiz-done') && test.includes('room=open'), 'hooks builds: the key and the override');
  assert.ok(prod.length < 400, `the step is small (${prod.length} characters minified)`);
  assert.match(roomCss, /html:not\(\.js\) \.room\[data-locked\] \{ display: block; \}/, 'without JavaScript nothing is locked');
  assert.doesNotMatch(roomCss, /\.room \{[^}]*display:/, 'room.css sets no display on .room itself, so nothing fights hidden but the no-JS rule');
});

test('(b) Skip quiz: after Begin in the intro in two copies, one in every footer after the Back conditional, none in the results or the gift; the footer grid and the no-JS rule; the loader and deck.ts treat it as Begin', () => {
  assert.equal(QUIZ_COPY.skip, 'Skip quiz');
  const begin = quiz.indexOf('id="qzBegin"'), skip = quiz.indexOf('id="qzSkip"'), noscript = quiz.indexOf('<noscript>');
  assert.ok(begin > 0 && skip > begin && skip < noscript, "the intro's fourth row, after Begin and before the no-JS line");
  assert.match(quiz, /<button type="button" class="qz-link qz-skip" id="qzSkip" data-label=\{Q\.skip\} data-loading=\{Q\.loading\} data-dc><span class="sr-only">\{Q\.skip\}<\/span><span aria-hidden="true">\{Q\.skip\}<\/span><\/button>/, 'split at build as Begin is');
  assert.match(quiz, /<div class="qz-foot">\s*\{i > 0 && <button type="button" class="qz-link qz-back" data-dc>\{Q\.back\}<\/button>\}\s*<button type="button" class="qz-link qz-skip" data-dc>\{Q\.skip\}<\/button>\s*<\/div>/, 'every footer, after Back where there is one');
  assert.equal((quiz.match(/qz-skip/g) ?? []).length, 2, 'the intro and the footer template, nowhere else');
  const results = quiz.slice(quiz.indexOf('id="qzResults"'), quiz.indexOf('</section>'));
  assert.doesNotMatch(results, /qz-skip|Q\.skip/, 'never on the result or the gift');
  assert.match(quizCss, /\.qz-foot \{ display: grid; grid-template-columns: auto auto; justify-content: space-between; min-height: 44px; \}\n\.qz-foot \.qz-skip \{ grid-column: 2; \}/, 'Back at the left, Skip quiz at the right, alone on question 1');
  assert.match(quizCss, /html:not\(\.js\) \.qz-begin \{ display: none; \}[^\n]*\nhtml:not\(\.js\) \.qz-skip \{ display: none; \}/, "the no-JS rule beside Begin's");
  // the loader: both buttons pending alike, a press on the other while one is pending dropped, the pending one given its label back
  assert.match(quiz, /const buttons = \[begin, skip\];/);
  assert.match(quiz, /for \(const b of buttons\) b\.addEventListener\('click', \(\) => \{\s*if \(mounted \|\| pending\(\)\) return;/);
  assert.match(quiz, /for \(const b of buttons\) \{ if \(!b\.dataset\.pending\) continue; b\.removeAttribute\('aria-disabled'\); b\.removeAttribute\('aria-busy'\); delete b\.dataset\.pending; say\(b, b\.dataset\.label \?\? ''\); \}/);
  // deck.ts: prepared as Begin is, taken when Back's press would be and not while a ride runs, quiz_skip then the unlock, the result's unlock, the pending press replayed
  assert.match(deck, /import \{ ride, riding, unlock \} from '\.\/gate\.ts';/);
  assert.match(deck, /dc\.prepare\(begin, Q\.begin, true\); dc\.prepare\(skip, Q\.skip, true\);/);
  assert.match(deck, /if \(busy \|\| early\(\) \|\| riding\(\) \|\| state !== \(q \? 'quiz' : 'intro'\)\) return;\n\s*track\('quiz_skip', \{ q \}\);\n\s*unlock\('skip'\);/);
  assert.match(deck, /await ride\(control, \{ reduced: reduced\(\), keyboard: control\.matches\(':focus-visible'\), label: \(t\) => dc\.set\(control, t \?\? Q\.skip\), announce \}\);/);
  assert.match(deck, /setState\('result'\);\n\s*unlock\('result'\);/, 'the result opens section 4');
  assert.match(deck, /skipHere\?\.addEventListener\('click', \(\) => \{ if \(card\.classList\.contains\('is-top'\)\) void skipQuiz\(skipHere, Number\(card\.dataset\.i\) \+ 1\); \}\);/, "a footer's press counts its question as quiz_back does");
  assert.match(deck, /if \(skip\.dataset\.pending === '1'\) \{ delete skip\.dataset\.pending; void skipQuiz\(skip, 0\); \}/, 'a press before mount replayed');
  const retry = deck.match(/async function retry\(\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(retry, 'retry() found');
  assert.doesNotMatch(retry!, /unlock|data-locked|'room'/, 'Try again never touches the gate: nothing re-locks');
});

test("(c) the ride's maths: 1200 ms from QUIZ_GATE, the ease equal to easeStandard and to --ease-standard, rideY exact at its ends and never decreasing, the spec's shares at 120, 240 and 420 ms, rideTarget by tier, rounded and clamped", () => {
  assert.equal(RIDE_MS, 1200); assert.equal(RIDE_MS, QUIZ_GATE.rideMs);
  assert.deepEqual([...EASE], [...EASE_STANDARD]);
  const token = read('src/styles/tokens.css').match(/--ease-standard: cubic-bezier\(([^)]+)\);/);
  assert.ok(token, 'tokens.css has --ease-standard');
  assert.deepEqual(token![1].split(',').map((s) => Number(s.trim())), [...EASE], "the ease's control points are the token's");
  for (let i = 0; i <= 100; i++) assert.ok(Math.abs(ease(i / 100) - easeStandard(i / 100)) < 1e-6, `at ${i / 100}`);
  assert.equal(rideY(14531, 16219, 0), 14531); assert.equal(rideY(14531, 16219, 1), 16219);
  assert.equal(rideY(14531, 16219, -0.5), 14531); assert.equal(rideY(14531, 16219, 1.5), 16219);
  let prev = -Infinity;
  for (let ms = 0; ms <= RIDE_MS; ms += 4) { const y = rideY(0, 1688, ms / RIDE_MS); assert.ok(y >= prev, `${ms} ms: ${y} under ${prev}`); prev = y; }
  const share = (ms: number) => rideY(0, 1, ms / RIDE_MS);
  for (const [ms, want] of [[120, 0.1562], [240, 0.5], [420, 0.7514]] as const) assert.ok(Math.abs(share(ms) - want) < 0.001, `${ms} ms: ${share(ms).toFixed(4)} against ${want}`);
  // the 3D path lands at q 1 (the top plus one 100svh), the poster tier at the top; rounded, clamped to the scroll range
  assert.equal(rideTarget({ top: 14531.6, one: 844, poster: false, max: 30000 }), 15376);
  assert.equal(rideTarget({ top: 14531.6, one: 844, poster: true, max: 30000 }), 14532);
  assert.equal(rideTarget({ top: 14531.6, one: 844, poster: false, max: 15000 }), 15000, 'a collapsed track: the page\'s end');
  assert.equal(rideTarget({ top: -5, one: 844, poster: true, max: 100 }), 0);
  assert.equal(rideTarget({ top: 50, one: 10, poster: false, max: -3 }), 0, 'a page with no scroll range');
  assert.deepEqual([RIDE_GUARD_MS, RIDE_DRIFT_PX, HALL_WAIT_MS], [350, 1.5, 1500]);
  assert.match(deck, /const GUARD = 350, GUARD_REDUCED = 150;/, "the ride's guard is the quiz's");
  assert.match(read('src/scripts/hero/section4/scroll.ts'), /Math\.abs\(scrollY - wrote\) <= 1\.5/, "the drift test is scroll.ts's own");
});

test("(d) hero.ts: docTop NaN for an element with no box, canWrap carrying the lock, the unlock's listener and the hall hook, the loading kept lock or no lock; director.ts: the layout read null, begin() off and wrap() false while locked", () => {
  const docTopSrc = hero.match(/const docTop = (\(id: string\) => \{ .*? \});/)?.[1];
  assert.ok(docTopSrc, 'docTop found');
  const docTop = new Function('document', 'scrollY', `return ${docTopSrc!.replace('(id: string)', '(id)')};`)({
    getElementById: (id: string) => id === 'room' ? { getClientRects: () => [], getBoundingClientRect: () => ({ top: 0 }) } : id === 'find' ? { getClientRects: () => [{}], getBoundingClientRect: () => ({ top: 100.5 }) } : null,
  }, 1234) as (id: string) => number;
  assert.ok(Number.isNaN(docTop('room')), 'a hidden section (no client rects) reads NaN, not the scroll position');
  assert.equal(docTop('find'), 1334.5);
  assert.ok(Number.isNaN(docTop('nothing')));
  assert.match(hero, /\.filter\(\(x\) => Number\.isFinite\(x\.start\) && Number\.isFinite\(x\.end\)\)/, 'the span filter drops it');
  assert.match(hero, /const roomLocked = \(\) => !!roomEl\?\.hasAttribute\('data-locked'\);/);
  assert.match(hero, /canWrap: \(\) => loop\.state\.introDone && !ctx\.room\?\.lock\(\) && !roomLocked\(\),/, 'no wrap from the top while locked');
  assert.match(hero, /const onUnlock = \(\) => \{ pageScroll\?\.notify\(\); void loadHall\(\); \};\n\s*addEventListener\('skreed:quiz-unlock', onUnlock\);\n\s*life\.onKill\(\(\) => removeEventListener\('skreed:quiz-unlock', onUnlock\)\);/, "the unlock's listener");
  assert.match(hero, /window\.__skreedHall = \{ get ready\(\) \{ return !!ctx\.room\?\.hall\.ready; \}, load: \(\) => loadHall\(\) \};/, "the hall hook the ride waits on (__s4.ready's source)");
  // amendment 1 (the spec's Built paragraph): the hall and the director chunk load as they always did, so the hall is ready for a press
  assert.match(hero, /if \(e\.isIntersecting && e\.target !== trackEl\) void loadHall\(\);/, 'the stage observer loads the hall, lock or no lock');
  assert.match(hero, /const afterIntro = \(\) => \{ if \(introOver\) return; introOver = true; void startScroll\(\); idle\(\(\) => \{ if \(!life\.dead\) void loadDirector\(\)\.then\(\(r\) => r\?\.warmCloud\(\)\); \}\); \};/, "afterIntro's idle import, lock or no lock");
  assert.doesNotMatch(hero, /roomLocked\(\)\) (?:void )?loadHall|roomLocked\(\)\) return;\s*idle/, 'no lock check on the loading');
  // the director's layout read: null while locked, the rect otherwise
  const readSrc = director.match(/read: (\(\) => \{ if \(!root \|\| root\.hasAttribute\('data-locked'\)\) return null; .*? \}),/)?.[1];
  assert.ok(readSrc, "the director's layout read found");
  const readOf = (locked: boolean) => (new Function('root', 'scrollY', `return ${readSrc};`)({ hasAttribute: (n: string) => n === 'data-locked' && locked, getBoundingClientRect: () => ({ top: 10, height: 1580 }) }, 5) as () => unknown)();
  assert.equal(readOf(true), null, 'locked: no reading');
  assert.deepEqual(readOf(false), { top: 15, height: 1580 });
  assert.match(director, /if \(!measured\) \{ inRoom = false; q = qAll = qRaw = prevRaw = 0; return; \}/, 'begin() keeps the section off screen while it has no reading');
  assert.match(director, /if \(seam \|\| pendingEnter \|\| root\?\.hasAttribute\('data-locked'\)\) return false;/, 'wrap() false while locked');
  assert.match(director, /if \(state !== 'world' \|\| !measured\) return false;/, 'inRange() waits for a reading, as built');
});

test('(e) gate.ts imports only config/quiz.ts and track.ts, touches the DOM inside its functions only, writes the state and the events the spec names; the new files keep the copy rules', () => {
  const froms = [...gate.matchAll(/^import .* from '([^']+)';/gm)].map((m) => m[1]);
  assert.deepEqual(froms, ['../../config/quiz.ts', './track.ts']);
  assert.doesNotMatch(code(gate), /import\(|motion\.ts|scroll-math|section4|decode\.ts|matchMedia/, 'no path to the glue, the island or matchMedia at load');
  // this test imported it under node with no window: nothing touches the DOM as it loads
  for (const line of gate.split('\n').filter((l) => /^(const|let|export const|export let) /.test(l) && !/=>/.test(l))) assert.doesNotMatch(line, /\b(document|window|scrollY|innerHeight|addEventListener|sessionStorage)\b/, `a top-level DOM read: ${line}`);
  assert.match(gate, /r\.removeAttribute\('hidden'\); r\.removeAttribute\('data-locked'\); r\.dataset\.open = by;/, 'the unlock');
  assert.match(gate, /track\('room_unlock', \{ by \}\);\n\s*dispatchEvent\(new CustomEvent\('skreed:quiz-unlock', \{ detail: \{ by \} \}\)\);/);
  assert.match(gate, /sessionStorage\.setItem\(QUIZ_GATE\.key, '1'\); \} catch/, 'the flag in try and catch');
  assert.match(gate, /r\.toggleAttribute\('data-ride', true\);[\s\S]*r\.removeAttribute\('data-ride'\);/, 'data-ride while riding');
  assert.match(gate, /scrollTo\(\{ top: wrote, behavior: 'instant' \}\);/, 'an instant scrollTo a frame, no CSS property animated (CHECKLIST C3)');
  assert.match(gate, /\['wheel', input, \{ passive: true \}\], \['touchstart', input, \{ passive: true \}\], \['keydown', input, \{\}\], \['scroll', onScroll, \{ passive: true \}\]/, 'what ends the ride');
  assert.match(gate, /if \(!\(e as KeyboardEvent\)\.repeat && performance\.now\(\) - pressAt >= RIDE_GUARD_MS\) ended = true;/);
  assert.match(gate, /Math\.abs\(scrollY - wrote\) > RIDE_DRIFT_PX\) ended = true;/);
  assert.match(gate, /await Promise\.race\(\[hall\.load\(\), wait\(HALL_WAIT_MS\)\]\);/, 'the hall awaited, at most 1.5 s');
  assert.match(gate, /o\.label\(Q\.loading\);[\s\S]*o\.label\(null\);/, '"Loading..." meanwhile, Begin\'s pattern');
  assert.match(gate, /document\.getElementById\(isPoster \? 'rmEnter' : 'rmPad'\)/, 'the pad on the 3D path, the prompt on the poster tier');
  assert.match(gate, /dest\?\.focus\(\{ preventScroll: true \}\);/);
  assert.match(gate, /control\.blur\(\); o\.announce\(\(isPoster \? r : dest\)\?\.getAttribute\('aria-label'\) \?\? ''\);/, "a pointer press: the destination's own name, once");
  assert.doesNotMatch(code(gate), /\.animate\(|transition|transform/, 'nothing animated but the scroll position');
  for (const [name, text] of [['gate.ts', gate], ['room-gate.inline.js', inline], ['room-gate.hooks.inline.js', hooksPart], ['Quiz.astro', quiz], ['Room.astro', room], ['quiz.css', quizCss], ['room.css', roomCss], ['deck.ts', deck]] as const) {
    assert.doesNotMatch(text, dashes, `${name}: an em or en dash`);
    assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${name}: an emoji`);
    assert.doesNotMatch(text, /\bTODO\b|\bFIXME\b|lorem ipsum/i, `${name}: a placeholder`);
  }
  assert.doesNotMatch(QUIZ_COPY.skip, dashes);
  assert.equal(QUIZ_COPY.skip, QUIZ_COPY.skip[0].toUpperCase() + QUIZ_COPY.skip.slice(1).toLowerCase(), 'sentence case');
});
