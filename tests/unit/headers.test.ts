// Caching (Sam, 2026-10-19: "enable caching"; public/_headers): the hashed files are immutable for a year, the fonts,
// icons and manifest cached with a background revalidation, and the pages always revalidated (a deploy removes old
// hashed files, so a page served stale could name files that are gone). Nothing is no-store, so the back-forward cache
// can keep the pages and the back-to-top control returns to the landing page without a reload.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
const rules = new Map<string, string>();
{
  let at = '';
  for (const line of headers.split('\n')) {
    if (/^\S/.test(line)) at = line.trim();
    else if (at && /Cache-Control:/i.test(line)) rules.set(at, line.split(':').slice(1).join(':').trim());
  }
}

test('caching: hashed files immutable, fonts and icons revalidated in the background, pages always revalidated', () => {
  for (const p of ['/_astro/*', '/models/*']) assert.equal(rules.get(p), 'public, max-age=31536000, immutable', p);
  for (const p of ['/fonts/*', '/favicon.ico', '/icon.svg', '/apple-touch-icon.png', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']) assert.match(rules.get(p) ?? '', /^public, max-age=\d+, stale-while-revalidate=\d+$/, p);
  for (const p of ['/', '/shades/*']) assert.match(rules.get(p) ?? '', /max-age=0\b/, p);
  assert.doesNotMatch(headers, /no-store/i, 'no-store keeps a page out of the back-forward cache');
});
