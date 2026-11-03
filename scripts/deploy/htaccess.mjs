// dist/_headers (Cloudflare's format, the CSP appended by scripts/csp.mjs) written again as dist/.htaccess for
// Hostinger's LiteSpeed: the /* rule for every response, each path rule by SetEnvIf on the request path, the lead
// endpoints and the code check routed to their PHP files, HTTPS forced and the 404 page served. Run after the build, before the upload.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const rules = [];
for (const line of readFileSync(join(dist, '_headers'), 'utf8').split('\n')) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  if (!/^\s/.test(line)) rules.push({ path: line.trim(), headers: [] });
  else { const at = line.indexOf(':'); rules.at(-1).headers.push([line.slice(0, at).trim(), line.slice(at + 1).trim()]); }
}
const quote = (v) => `"${v.replace(/"/g, '\\"')}"`;
const out = [
  'Options -Indexes',
  'ErrorDocument 404 /404.html',
  'RewriteEngine On',
  'RewriteCond %{HTTPS} !=on',
  'RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
  'RewriteRule ^api/signup/?$ api/signup.php [L]',
  'RewriteRule ^api/quiz-lead/?$ api/quiz-lead.php [L]',
  'RewriteRule ^api/verify/?$ api/verify.php [L]',
  'RewriteRule ^api/leads/?$ api/leads.php [L]',
  '<IfModule mod_headers.c>',
];
rules.forEach((r, i) => {
  if (r.path === '/*') { for (const [k, v] of r.headers) out.push(`  Header always set ${k} ${quote(v)}`); return; }
  const re = '^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*$/, '') + (r.path.endsWith('*') ? '' : '$');
  out.push(`  SetEnvIf Request_URI ${quote(re)} SKREED_H${i}`);
  for (const [k, v] of r.headers) out.push(`  Header set ${k} ${quote(v)} env=SKREED_H${i}`);
});
out.push('</IfModule>', '<FilesMatch "^_headers$">', '  Require all denied', '</FilesMatch>', '');
writeFileSync(join(dist, '.htaccess'), out.join('\n'));
console.log(`htaccess: ${rules.length} rules from _headers`);
