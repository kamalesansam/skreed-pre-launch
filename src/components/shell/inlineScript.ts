// Assembles an inline script at build time: config JSON prepended inside one function scope (no globals leak), then
// minified with Vite's own minifier (oxc), so the critical inline JS stays inside the hero's budget (hero.md section 6).
// scripts/csp.mjs hashes the emitted string after the build, so the hash always matches what ships.
import { minifySync } from 'vite';

export function inlineScript(name: string, prelude: Record<string, unknown>, ...bodies: string[]): string {
  const vars = Object.entries(prelude).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(',');
  const code = `(function(){${vars ? 'var ' + vars + ';' : ''}\n${bodies.join('\n')}\n})();`;
  const out = minifySync(name, code, { compress: true, mangle: true });
  if (out.errors?.length) throw new Error(`${name}: ${out.errors.map((e) => e.message).join('; ')}`);
  return out.code.trim();
}
