// The legal pages (docs/specs/legal-pages.md AC1 to AC4): both pages and their copy, the sitemap, and the link beside
// each form's consent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRIVACY, PRIVACY_LINK, TERMS, UNSUB_COPY, type Block, type LegalPage, type Run } from '../../src/config/legal.ts';
import { readUnsubQuery, readUnsubStatus } from '../../src/scripts/legal/unsubscribe.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const runText = (r: Run) => (typeof r === 'string' ? r : r.text);
const blockText = (b: Block) => (Array.isArray(b) ? (b as readonly Run[]).map(runText).join('') : (b as { list: readonly (readonly Run[])[] }).list.map((i) => i.map(runText).join('')).join(' '));
const pageText = (p: LegalPage) => [p.title, p.description, p.h1, p.updated[0], p.intro.map(runText).join(''), ...p.sections.flatMap((s) => [s.h, ...s.blocks.map(blockText)])].join('\n');

test('AC2: the privacy notice covers what, why, who, how long, the rights, withdrawal and complaints', () => {
  const heads = PRIVACY.sections.map((s) => s.h);
  for (const h of ['Who we are', 'What we collect', 'Why we use it', 'Who handles it for us', 'How long we keep it', 'Your rights', 'Questions and complaints']) assert.ok(heads.includes(h), h);
  const t = pageText(PRIVACY);
  for (const w of ['withdraw', 'erase', 'Data Protection Board of India', 'collab@skreed.in', 'Hostinger', 'Zoho', 'no cookies']) assert.ok(t.includes(w), w);
});

test('AC4: no em or en dash and no emoji in either page', () => {
  for (const p of [PRIVACY, TERMS]) {
    const t = pageText(p);
    assert.doesNotMatch(t, /[–—]/, `${p.path}: a dash`);
    assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, `${p.path}: an emoji`);
  }
});

test('AC1: the two routes, their own titles and descriptions, and both in the sitemap', () => {
  assert.deepEqual([PRIVACY.path, TERMS.path], ['/privacy/', '/terms/']);
  assert.notEqual(PRIVACY.title, TERMS.title);
  assert.notEqual(PRIVACY.description, TERMS.description);
  assert.match(read('src/pages/privacy.astro'), /page=\{PRIVACY\}/);
  assert.match(read('src/pages/terms.astro'), /page=\{TERMS\}/);
  const sitemap = read('src/pages/sitemap.xml.ts');
  for (const p of ['/privacy/', '/terms/']) assert.ok(sitemap.includes(`'${p}'`), p);
  // the terms link to the notice
  assert.ok(TERMS.sections.some((s) => s.blocks.some((b) => Array.isArray(b) && (b as readonly Run[]).some((r) => typeof r !== 'string' && r.href === '/privacy/'))));
});

test('AC3: a privacy notice link beside each form\'s consent, outside the label so it never ticks the box', () => {
  assert.equal(PRIVACY_LINK, 'Privacy notice');
  const su = read('src/components/signup/Signup.astro');
  assert.match(su, /<div class="su-consent" id="suConsentRow"><label>.*<\/label><a class="su-privacy" href=\{PRIVACY\.path\}>\{PRIVACY_LINK\}<\/a><\/div>/);
  const qz = read('src/components/quiz/Quiz.astro');
  assert.match(qz, /<p class="qz-fine"><span data-dc="prop">\{Q\.fine\}<\/span>\{' '\}<a class="qz-privacy" href=\{PRIVACY\.path\} data-dc="prop">\{PRIVACY_LINK\}<\/a><\/p>/);
});

test('AC4: the pages load no script', () => {
  assert.doesNotMatch(read('src/components/legal/LegalPage.astro'), /<script/);
});

test('D6: the unsubscribe page reads its query and the server\'s answer', () => {
  const t = 'a'.repeat(32);
  assert.deepEqual(readUnsubQuery(`?e=Sam%40Example.in&t=${t}`), { email: 'sam@example.in', token: t });
  for (const q of ['', '?e=sam%40example.in', `?t=${t}`, `?e=not-an-address&t=${t}`, '?e=sam%40example.in&t=xyz']) assert.equal(readUnsubQuery(q), null, q);
  assert.deepEqual([200, 403, 400, 500, 502, 405].map(readUnsubStatus), ['done', 'broken', 'broken', 'error', 'error', 'error']);
  for (const v of Object.values(UNSUB_COPY)) { assert.doesNotMatch(v, /[\u2013\u2014]/); }
  assert.match(read('src/pages/unsubscribe.astro'), /indexable=\{false\}/);
});

test('D6 and D7: the server sends the unsubscribe line and headers on every list mail, routes the endpoint, and deletes unconfirmed rows after a day', () => {
  const lead = read('server/lib/lead.php'), mailing = read('server/lib/mailing.php'), cli = read('server/mailing.php');
  assert.match(lead, /'List-Unsubscribe: <' \. lead_unsub_api\(\$to\) \. '>', 'List-Unsubscribe-Post: List-Unsubscribe=One-Click'/);
  assert.match(lead, /lead_smtp\(\$email, \$subject, \$text, \$c\['reply_to'\] \?\? null, \$html, \$files, true\)/, 'the welcome');
  assert.match(mailing, /lead_smtp\(\$r\['email'\], \$subject, \$text, \$c\['reply_to'\] \?\? null, \$html, \[\], true\)/, 'the reminder and the launch email');
  assert.match(cli, /lead_smtp\(\$to, \$subject, \$text, lead_config\(\)\['reply_to'\] \?\? null, \$html, \[\], true\)/, 'the test send');
  assert.doesNotMatch(lead, /lead_code_mail\(\$code, \$name\);\n\s*if \(!lead_smtp\([^)]*true\)/, 'no unsubscribe on the code mail');
  assert.match(lead, /const UNCONFIRMED_TTL = 86400;/);
  assert.match(lead, /DELETE FROM leads WHERE verified_at IS NULL AND COALESCE\(code_sent_at, created_at\) < \?/);
  assert.match(lead, /\$db = lead_db\(\);\n\s*lead_purge_unconfirmed\(\$db\);/, 'on every save');
  assert.match(cli, /lead_purge_unconfirmed\(lead_db\(\)\)/, 'on the cron run');
  assert.match(read('server/public/api/unsubscribe.php'), /lead_unsubscribe\(\);/);
  assert.match(read('scripts/deploy/htaccess.mjs'), /RewriteRule \^api\/unsubscribe\/\?\$ api\/unsubscribe\.php \[L\]/);
});
