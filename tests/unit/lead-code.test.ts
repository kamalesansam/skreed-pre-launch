// The email code on the two lead forms (Sam, 2026-11-03): the answers of a save and a check read as the forms act on them
// (server/lib/lead.php's statuses), the code cleaned of spaces and dashes, the lines in the brand's rules, the two forms
// carrying the code field, and the PHP routing /api/verify.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CODE_LENGTH, RESEND_GAP_S, cleanCode, cleanName, codeComplete, readCheck, readSave, validName } from '../../src/scripts/lead/code.ts';
import { LEAD_CODE_COPY as K, codeLine, waitLine, wrongLine } from '../../src/config/lead-code.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const res = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('a save: 202 asks for the code with the server\'s gap, and every other status maps to its own state', async () => {
  assert.deepEqual(await readSave(res(202, { ok: true, verify: true, gap: 30 })), { kind: 'code', gap: 30 });
  assert.deepEqual(await readSave(res(202)), { kind: 'code', gap: RESEND_GAP_S });
  assert.deepEqual(await readSave(res(409)), { kind: 'dup' });
  assert.deepEqual(await readSave(res(422)), { kind: 'invalid' });
  assert.deepEqual(await readSave(res(422, { error: 'name' })), { kind: 'name' });
  assert.deepEqual(await readSave(res(429, { wait: 12.2 })), { kind: 'wait', wait: 13 });
  assert.deepEqual(await readSave(res(429)), { kind: 'wait', wait: RESEND_GAP_S });
  assert.deepEqual(await readSave(res(502)), { kind: 'mail' });
  assert.deepEqual(await readSave(res(500)), { kind: 'error', status: 500 });
  assert.deepEqual(await readSave(res(403)), { kind: 'error', status: 403 });
});

test('a check: 200 verified, 422 wrong (with the tries left) or malformed, 410 expired', async () => {
  assert.deepEqual(await readCheck(res(200, { ok: true })), { kind: 'ok' });
  assert.deepEqual(await readCheck(res(422, { left: 3 })), { kind: 'wrong', left: 3 });
  assert.deepEqual(await readCheck(res(422, { error: 'format' })), { kind: 'format' });
  assert.deepEqual(await readCheck(res(410)), { kind: 'expired' });
  assert.deepEqual(await readCheck(res(410, { error: 'tries' })), { kind: 'expired' });
  assert.deepEqual(await readCheck(res(500)), { kind: 'error', status: 500 });
});

test('the code: digits only, at most six, spaces and dashes from a paste dropped', () => {
  assert.equal(CODE_LENGTH, 6);
  assert.equal(cleanCode(' 123 456 '), '123456');
  assert.equal(cleanCode('123-4567'), '123456');
  assert.equal(cleanCode('ab12'), '12');
  assert.ok(codeComplete('012 345'));
  assert.ok(!codeComplete('12345'));
});

test('the lines: filled, singular at one try, minutes past a minute and a half, no dash or emoji', () => {
  assert.equal(codeLine(K.sent, { email: 'a@b.in' }), 'We sent a code to a@b.in.');
  assert.equal(wrongLine(1), 'That code isn’t right. 1 try left.');
  assert.equal(wrongLine(3), 'That code isn’t right. 3 tries left.');
  assert.equal(waitLine(20), 'Try again in 20 seconds.');
  assert.equal(waitLine(1800), 'Too many codes for now. Try again in 30 minutes.');
  for (const [k, v] of Object.entries(K)) {
    assert.doesNotMatch(v, /[–—]/, `${k}: no em or en dash`);
    assert.doesNotMatch(v, /\p{Extended_Pictographic}/u, `${k}: no emoji`);
    assert.doesNotMatch(v, /'/, `${k}: the curly apostrophe`);
  }
});

test('both forms carry the code field (one-time-code, numeric) and its two links; the server routes /api/verify', () => {
  // the quiz's in its markup; section 5's made by its form chunk, so the first view carries neither
  const quiz = read('src/components/quiz/Quiz.astro'), form = read('src/scripts/signup/form.ts');
  assert.match(quiz, /autocomplete="one-time-code"/);
  assert.match(quiz, /inputmode="numeric"/);
  assert.match(form, /autocomplete: 'one-time-code'/);
  assert.match(form, /inputmode: 'numeric'/);
  for (const s of [quiz, form]) { assert.match(s, /K\.resend/); assert.match(s, /K\.other/); }
  assert.doesNotMatch(read('src/components/signup/Signup.astro'), /suCode/, 'section 5\'s first view without the code field');
  assert.match(read('src/scripts/signup/signup.ts'), /import\('\.\/form\.ts'\)/, 'section 5\'s form fetched as its own chunk');
  assert.match(read('scripts/deploy/htaccess.mjs'), /api\/verify\/\?\$ api\/verify\.php/);
  assert.match(read('server/public/api/verify.php'), /lead_verify\(\)/);
  const lib = read('server/lib/lead.php');
  assert.match(lib, /hash_equals\(\$row\['code_hash'\]/, 'the code compared in constant time');
  assert.match(lib, /random_int\(0, 999999\)/, 'the code from the CSPRNG');
  assert.doesNotMatch(lib, /code(_plain)? = \?.*\$code\b/, 'the code itself never stored');
});

test('the first name (required, 2026-11-03): trimmed and folded, 1 to 60 characters, nothing link-like', () => {
  assert.equal(cleanName('  Anu   Priya \n'), 'Anu Priya');
  assert.ok(validName('Sam'));
  assert.ok(validName('Zoë-Anne O’Neil'));
  assert.ok(!validName('   '));
  assert.ok(!validName('x'.repeat(61)));
  for (const bad of ['win at evil.com', 'http://x', 'www.x', 'a@b', '<b>', 'a/b']) assert.ok(!validName(bad), bad);
  const lib = read('server/lib/lead.php');
  assert.match(lib, /function lead_name\(/, 'the server checks it too');
  assert.match(lib, /'Hi ' \. lead_md\(\$name\)/, 'the sign-up email opens with it');
  assert.match(lib, /'Hey ' \. lead_md\(\$name\)/, 'the quiz email opens with it');
});

test('the wallpapers: 239 of the 240 shades, each once; six per quiz email, three plain then three patterned; never in git', () => {
  const { names } = JSON.parse(read('scripts/quiz/wallpaper-names.json')) as { names: Record<string, string> };
  const ids = Object.values(names);
  assert.equal(ids.length, 239);
  assert.equal(new Set(ids).size, 239);
  for (const id of ids) assert.match(id, /^[a-z]+(-[a-z]+)*-\d{2}$/);
  assert.ok(!ids.includes('vivid-violet-20'), 'Midnight has no wallpaper');
  const lib = read('server/lib/lead.php');
  assert.match(lib, /array_slice\(\$ids, 0, 6\)/);
  assert.match(lib, /\$kind = \$i < 3 \? 'plain' : 'pattern';/);
  assert.match(read('.gitignore'), /^\/server\/wallpapers\/$/m);
  assert.doesNotMatch(lib, /SIGNATURE|FACEBOOK5|INSTAGRAM10|YOUTUBE5/, 'the discount codes live in the server config only');
});
