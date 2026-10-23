// Section 3's answer pictures (Sam, 2026-10-20: "for any question that is visual, open envato and pick pictures relating
// to that specific option, get it and put it next to the question"). One Envato Elements stock photograph per answer of
// the five visual questions, listed in src/config/quiz-pictures.ts with its title, author and item id. The picture decodes
// in as the text does, so picture.ts keeps decode.ts's constants and formulas, read here from both sources. The licence
// does not allow the files to be shared and the repository is public, so git ignores their folder and tracks none of them.
// The type scale Sam asked for the same day ("the text is soo small") is three clamp() tokens in quiz.css.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { QUIZ_PICTURES } from '../../src/config/quiz-pictures.ts';
import { QUIZ_QUESTIONS } from '../../src/config/quiz.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

test('one picture per answer of each visual question (q<index>-<personality>), 35 in all, and no other key', () => {
  const visual = QUIZ_QUESTIONS.flatMap((q, i) => (q.visual ? [i] : []));
  assert.deepEqual(visual, [0, 2, 4, 7, 8], 'the five visual questions');
  const want = visual.flatMap((i) => QUIZ_QUESTIONS[i].answers.map((a) => `q${i}-${a.persona}`)).sort();
  const keys = QUIZ_PICTURES.map((p) => p.key);
  assert.equal(new Set(keys).size, keys.length, `a key twice: ${keys.filter((k, n) => keys.indexOf(k) !== n).join(', ')}`);
  assert.deepEqual([...keys].sort(), want);
  assert.equal(keys.length, 35);
  // the key spells what encode-pictures.mjs reads from the masters' file names
  for (const k of keys) assert.match(k, /^q\d+-[a-z]+$/, k);
});

test('each picture names its Envato item: a unique item id, a title and an author', () => {
  const ids = QUIZ_PICTURES.map((p) => p.envatoId);
  assert.equal(new Set(ids).size, ids.length, `an Envato item twice: ${ids.filter((id, n) => ids.indexOf(id) !== n).join(', ')}`);
  for (const p of QUIZ_PICTURES) {
    assert.match(p.envatoId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, `${p.key}: an Envato item id`);
    assert.ok(p.title.trim().length > 0, `${p.key}: a title`);
    assert.ok(p.author.trim().length > 0, `${p.key}: an author`);
  }
});

test('picture.ts decodes a picture in as decode.ts decodes text: the same constants, imported, and the same alpha wipe, roll and hide over 12 strips', () => {
  const pic = read('src/scripts/quiz/picture.ts'), decode = read('src/scripts/quiz/decode.ts');
  // the constants come from decode.ts, so the two cannot part; none is copied in as a number
  assert.match(pic, /^import \{ HIDE, REDUCED, REVEAL_ALPHA, REVEAL_ROLL, ROLL_STEPS \} from '\.\/decode\.ts';$/m);
  assert.match(decode, /^export const REVEAL_ALPHA = 0\.4, REVEAL_ROLL = 0\.75, ROLL_STEPS = 5\.753, HIDE = 0\.2, REDUCED = 0\.2;$/m);
  const code = pic.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /\b(0\.4|0\.75|5\.753|0\.2)\b/, 'a timing written as a number in picture.ts');
  assert.match(pic, /^export const STRIPS = 12, SCALE_FROM = 1\.03;$/m);
  // the reveal: u over REVEAL_ALPHA and v over REVEAL_ROLL, as decode.ts times them
  assert.match(decode, /const u = Math\.min\(1, t \/ REVEAL_ALPHA\), v = Math\.min\(1, t \/ REVEAL_ROLL\);/);
  assert.match(pic, /const u = Math\.min\(1, t \/ REVEAL_ALPHA\), v = Math\.min\(1, t \/ REVEAL_ROLL\);/);
  // strip i at x = i / 11, its opacity decode.ts's left-to-right wipe
  assert.match(pic, /xs = \(i: number\) => i \/ \(STRIPS - 1\)/);
  assert.match(decode, /clamp\(11 \* u - 10 \* x\)/);
  assert.match(pic, /put\(i, clamp\(11 \* u - 10 \* x\)\)/);
  // the roll: decode.ts counts a glyph down through the glyphs after it; strip i shows the slice of strip (i + k) % 12
  const k = 'Math.floor((1 - clamp(2 * v - x)) * ROLL_STEPS) % 8';
  assert.ok(decode.includes(k), 'decode.ts rolls by k');
  assert.ok(pic.includes(`slice(s, i, (i + (${k})) % STRIPS)`), 'picture.ts shows the slice of strip (i + k) % STRIPS');
  // settled at REVEAL_ROLL, as the text
  assert.match(decode, /if \(t >= REVEAL_ROLL\) r\.settled = true;/);
  assert.match(pic, /if \(t >= REVEAL_ROLL\) s\.settled = true;/);
  // the hide: right to left over HIDE from where each strip stood, every strip on its own slice
  assert.match(decode, /const u = Math\.min\(1, t \/ HIDE\);/);
  assert.match(pic, /const u = Math\.min\(1, t \/ HIDE\);/);
  assert.match(decode, /Math\.min\(g\.a0, reduced\(\) \? 1 - u : clamp\(11 \* \(1 - u\) - 10 \* xs\(i\)\)\)/);
  assert.match(pic, /Math\.min\(s\.a0\[i\], reduced\(\) \? 1 - u : clamp\(11 \* \(1 - u\) - 10 \* xs\(i\)\)\)\); slice\(s, i, i\);/);
  // reduced motion: a fade over REDUCED on every strip's own slice, no transform
  assert.match(decode, /if \(reduced\(\)\) \{ const a = Math\.min\(1, t \/ REDUCED\);/);
  assert.match(pic, /if \(reduced\(\)\) \{ const a = Math\.min\(1, t \/ REDUCED\); for \(let i = 0; i < STRIPS; i\+\+\) \{ put\(i, a\); slice\(s, i, i\); \} s\.layer\.style\.transform = '';/);
});

/** a file of one of the listed pictures under any folder: a master (q0-main.jpg), an encoded file (q0-main-640.avif) or
 *  the build's copy of one, which carries a content hash (dist-s3/_astro/q0-main-640.DzXu45ct.avif) */
const LICENSED = /(?:^|\/)(q\d+-[a-z]+)(?:-\d+)?(?:\.[\w-]+)?\.(?:jpe?g|png|avif|webp)$/i;

test('the licensed file pattern takes a master, an encoded file and a build\'s hashed copy, and nothing else', () => {
  for (const f of ['src/assets/quiz/pics/q0-main.jpg', 'src/assets/quiz/pics/q8-strategist-1100.webp', 'dist-s3/_astro/q0-curator-640.DzXu45ct.avif', 'dist/_astro/q4-spark-1100.CaduJ-iZ.webp', 'q2-rebel.png']) {
    assert.ok(LICENSED.test(f), f);
  }
  for (const f of ['docs/specs/screenshots/quiz-1280x800-card.png', 'src/assets/room/q0.glb', 'src/config/quiz-pictures.ts', 'src/assets/quiz/pics/index.json']) {
    assert.ok(!LICENSED.test(f), f);
  }
});

test('the pictures stay out of git: .gitignore names src/assets/quiz/pics/ and every build folder, git ignores a file there and neither tracks one nor would add one, anywhere', () => {
  // Sam's word, 2026-10-23: the pictures ride in git for the move to a new account (src/assets/quiz/pics/TRACKED.md says so)
  // and come out again afterwards; while that note exists this whole check stands down (git check-ignore itself exits 1 for a tracked file)
  if (existsSync('src/assets/quiz/pics/TRACKED.md')) return;
  const ignore = read('.gitignore').split('\n');
  assert.ok(ignore.includes('src/assets/quiz/pics/'), '.gitignore has src/assets/quiz/pics/');
  for (const f of ['q0-main.jpg', 'q0-main-640.avif', 'q8-strategist-1100.webp', 'index.json']) {
    assert.match(git('check-ignore', '-v', `src/assets/quiz/pics/${f}`), /^\.gitignore:\d+:src\/assets\/quiz\/pics\/\t/, `git ignores ${f}`);
  }
  // a build written with astro build --outDir copies every picture into its _astro folder: each such folder is ignored
  for (const d of ['dist', 'dist-s3', 'dist-s3t', 'dist-anything']) {
    assert.match(git('check-ignore', '-v', `${d}/_astro/q0-main-640.DzXu45ct.avif`), /^\.gitignore:\d+:\S+\t/, `git ignores a build in ${d}/`);
  }
  assert.equal(git('ls-files', '--', 'src/assets/quiz/pics').trim(), '', 'git tracks a file in src/assets/quiz/pics/');
  // and no picture of the list under another name or folder, tracked or untracked and not ignored (so `git add -A` would
  // take it): a master, an encoded file, or a build's hashed copy
  const keys = new Set(QUIZ_PICTURES.map((p) => p.key));
  const licensed = (out: string) => out.split('\0').filter((f) => { const m = LICENSED.exec(f); return !!m && keys.has(m[1]); });
  assert.deepEqual(licensed(git('ls-files', '-z')), [], 'a licensed picture tracked by git');
  assert.deepEqual(licensed(git('ls-files', '-z', '--others', '--exclude-standard')), [], 'a licensed picture git would add (untracked and not ignored)');
});

test('the type scale: quiz.css sets the three sizes as clamp() tokens once, with no portrait override; the laptop query is the same in the CSS, deck.ts and the pictures\' sizes', () => {
  const css = read('src/styles/quiz.css');
  const tokens = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(tokens, /--qz-fs: clamp\(15px, min\(calc\(0\.6rem \+ 0\.95vw\), 2\.6vh\), 22px\);/);
  assert.match(tokens, /--qz-fs-q: clamp\(24px, min\(calc\(1rem \+ 2\.3vw\), 5vh\), 52px\);/);
  assert.match(tokens, /--qz-fs-big: clamp\(36px, min\(calc\(1rem \+ 4\.6vw\), 10vh\), 88px\);/);
  for (const t of ['--qz-fs', '--qz-fs-q', '--qz-fs-big']) assert.equal(tokens.split(`${t}:`).length - 1, 1, `${t} set once`);
  assert.doesNotMatch(tokens, /max-aspect-ratio/, 'no portrait size');
  const wide = '(min-width: 900px) and (min-height: 600px)';
  assert.ok(css.includes(`@media ${wide} {`), 'quiz.css');
  assert.ok(read('src/scripts/quiz/deck.ts').includes(`matchMedia('${wide}')`), 'deck.ts');
  assert.ok(read('src/components/quiz/Quiz.astro').includes(`const PIC_SIZES = '${wide} min(30vw, 440px), calc(100vw - 32px)';`), 'Quiz.astro');
  // the picture's column on a laptop is the width the sizes attribute names
  assert.match(tokens, /--qz-pic-w: clamp\(260px, 30vw, 440px\)/);
});
