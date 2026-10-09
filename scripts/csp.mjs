// Post-build CSP (hero-architecture.md 12.3): hashes every inline <script> and <style> that ships in dist/**/*.html and
// appends the Content-Security-Policy line to the /* rule of dist/_headers. Runs after every astro build, because any
// byte change to an inline script changes its hash.
//   node scripts/csp.mjs                 enforcing header
//   node scripts/csp.mjs --report-only   Content-Security-Policy-Report-Only (the first production deploy, section 15)
// Fails the build when: a markup style="" attribute appears (it would need style-src-attr), the CSP line is longer than
// 1900 characters (wrangler drops _headers lines over 2000 silently), or dist/_headers has no /* rule.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const reportOnly = process.argv.includes('--report-only');
const MAX_LINE = 1900;

const fail = (msg) => { console.error('csp: ' + msg); process.exit(1); };
const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const htmlFiles = walk(DIST).filter((p) => p.endsWith('.html'));
if (!htmlFiles.length) fail('no HTML in dist/');

const sha = (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;
const EXEC_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript']);
const scripts = new Set(), styles = new Set();
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs)) continue;
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? '').toLowerCase();
    if (!EXEC_TYPES.has(type)) continue;   // data blocks such as application/ld+json are not executed
    scripts.add(sha(m[2]));
  }
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) styles.add(sha(m[1]));
  // markup style attributes, outside script and style text
  const tags = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const bad = tags.match(/<[a-z][^>]*\sstyle\s*=/i);
  if (bad) fail(`${relative(ROOT, file)} has a style attribute: ${bad[0].slice(0, 120)}`);
}

const policy = [
  "default-src 'self'",
  ["script-src 'self'", ...[...scripts].sort()].join(' '),
  ["style-src 'self'", ...[...styles].sort()].join(' '),
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'none'", "object-src 'none'", "frame-src 'none'", "worker-src 'none'", "manifest-src 'self'",
  "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
const name = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
const line = `  ${name}: ${policy}`;
if (line.length > MAX_LINE) fail(`the CSP line is ${line.length} characters, over ${MAX_LINE}`);

const headersPath = join(DIST, '_headers');
const lines = readFileSync(headersPath, 'utf8').split('\n').filter((l) => !/^\s+Content-Security-Policy(-Report-Only)?:/.test(l));
const at = lines.indexOf('/*');
if (at < 0) fail('dist/_headers has no /* rule');
let end = at + 1;
while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
lines.splice(end, 0, line);
writeFileSync(headersPath, lines.join('\n'));
console.log(`csp: ${htmlFiles.length} page(s), ${scripts.size} inline script hash(es), ${styles.size} inline style hash(es), line ${line.length} chars${reportOnly ? ' (report-only)' : ''}`);
