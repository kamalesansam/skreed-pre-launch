// The shader strip (scripts/build/glsl-strip.mjs): only comments and whitespace may change, in every shader of the tree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { GLSL_MODULES, glslStrip, glslTokens, stripGlslSource, stripGlslText } from '../../scripts/build/glsl-strip.mjs';

const ROOT = join(import.meta.dirname, '..', '..');

const FIXTURE = `#version 300 es
  precision highp float; // the precision
  #define LIN(x) ((x) * 2.0)
  #ifdef USE_MAP
    uniform sampler2D tMap; /* the map */
  #endif
  uniform vec2 uRes;   uniform float uT;
  float f(float a, float b) {
    return a - -b + LIN(a) /* block
    comment */ * 0.5;
  }
  void main() {
    int i = 0; i++; --i;
    vec3 c = vec3(f(uRes.x, uRes.y), 1.0, 2.0e-3) ;
    if (uT <= 1.0 && uT >= 0.0) { c = c * 0.5; }
    gl_FragColor = vec4(c, 1.0);
  }
`;

test('stripGlslText: the comments gone, the preprocessor lines on their own, no two tokens merged', () => {
  const out = stripGlslText(FIXTURE);
  assert.equal(out, [
    '#version 300 es',
    'precision highp float;',
    '#define LIN(x) ((x) * 2.0)',
    '#ifdef USE_MAP',
    'uniform sampler2D tMap;',
    '#endif',
    'uniform vec2 uRes;uniform float uT;float f(float a,float b){return a - -b + LIN(a)* 0.5;}void main(){int i = 0;i++;--i;vec3 c = vec3(f(uRes.x,uRes.y),1.0,2.0e-3);if(uT <= 1.0 && uT >= 0.0){c = c * 0.5;}gl_FragColor = vec4(c,1.0);}',
  ].join('\n'));
  assert.deepEqual(glslTokens(out), glslTokens(FIXTURE), 'the token streams are equal');
  assert.equal(stripGlslText(out), out, 'idempotent');
  assert.ok(!out.includes('//') && !out.includes('/*'), 'no comment survives');
});

test('stripGlslSource: the tagged literal and the GLSL-like ones, the expressions kept, the line count kept', () => {
  const src = [
    'const NOISE = /* glsl */`',
    '  // a hash',
    '  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    '`;',
    'const FRAG = /* glsl */`precision highp float;',
    '  ${NOISE}',
    '  uniform float uT; // time',
    '  void main() { gl_FragColor = vec4(h(vec2(uT)), 0.0, 0.0, 1.0); }',
    '`;',
    'const UNTAGGED = `',
    '  uniform float uA; // untagged, GLSL-like',
    '  void main() { gl_Position = vec4(uA); }',
    '`;',
    'const msg = `hello ${name}`; // not a shader',
    'const back = "`"; // a backtick in a string is not a literal',
    'const DEF = /* glsl */`#define N ${n}',
    '  uniform float u${name}; void main() { gl_Position = vec4(float(N)); }`;',
    'export { NOISE, FRAG, UNTAGGED, msg, back, DEF };',
    '',
  ].join('\n');
  const tagged = stripGlslSource(src, 'a.ts');
  assert.equal(tagged.literals, 3, 'the three tagged literals');
  assert.equal(tagged.code.split('\n').length, src.split('\n').length, 'the line count is kept');
  assert.ok(tagged.code.includes('const NOISE = /* glsl */`float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))* 43758.5453);}`\n\n\n;'), 'stripped, the newlines after the backtick');
  assert.ok(tagged.code.includes('`precision highp float;\n${NOISE}\nuniform float uT;void main(){gl_FragColor = vec4(h(vec2(uT)),0.0,0.0,1.0);}`\n\n;'), 'the expression kept on its own line, the parts around it stripped');
  assert.ok(tagged.code.includes('`#define N ${n}\nuniform float u${name};void main(){gl_Position = vec4(float(N));}`;'), 'a directive keeps its line end after the expression; a name keeps no space before one');
  assert.ok(tagged.code.includes('const UNTAGGED = `\n  uniform float uA; // untagged, GLSL-like'), 'the untagged literal stands without all');
  assert.ok(tagged.code.includes('const msg = `hello ${name}`;'), 'the message stands');
  const all = stripGlslSource(src, 'a.ts', { all: true });
  assert.equal(all.literals, 4, 'all takes the GLSL-like untagged one too');
  assert.ok(all.code.includes('const UNTAGGED = `uniform float uA;void main(){gl_Position = vec4(uA);}`'), 'stripped');
  assert.ok(all.code.includes('const msg = `hello ${name}`;'), 'and never the message');
  assert.equal(all.code.split('\n').length, src.split('\n').length, 'the line count is kept with all');
});

test('the plugin: pre, the right files, nothing for a module without shaders', () => {
  const p = glslStrip({ files: GLSL_MODULES });
  assert.equal(p.name, 'skreed:glsl-strip');
  assert.equal(p.enforce, 'pre');
  assert.equal(p.transform('export const a = `uniform float u; void main() { gl_Position = vec4(u); }`;', 'C:/x/src/config/signup.ts'), null, 'untagged outside the shader modules');
  assert.equal(p.transform('const a = 1;', 'C:/x/src/scripts/hero/v11/glsl.ts'), null, 'nothing to strip');
  assert.ok(p.transform('export const a = `uniform float u;\n  void main() { gl_Position = vec4(u); }`;', 'C:/x/src/scripts/hero/v11/glsl.ts'), 'a shader module');
  assert.equal(p.transform('export const a = /* glsl */`void main() {\n gl_Position = vec4(1.0); }`;', 'C:/x/node_modules/three/x.js'), null, 'never a dependency');
  assert.equal(p.transform('const a = /* glsl */`void main() {\n gl_Position = vec4(1.0); }`;', 'C:/x/src/a.ts?raw'), null, 'never a raw import');
});

/** every static part of every template literal of a module, in order, with whether an expression comes before or after it */
function literalParts(code: string, file: string): { raw: string; before: boolean; after: boolean }[] {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out: { raw: string; before: boolean; after: boolean }[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isNoSubstitutionTemplateLiteral(n)) out.push({ raw: n.rawText ?? n.text, before: false, after: false });
    else if (ts.isTemplateExpression(n)) {
      out.push({ raw: n.head.rawText ?? n.head.text, before: true, after: false });
      n.templateSpans.forEach((s, i) => out.push({ raw: s.literal.rawText ?? s.literal.text, before: i < n.templateSpans.length - 1, after: true }));
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (/\.ts$/.test(f)) out.push(p); }
  return out;
}

test('every shader in src/scripts keeps its tokens and its preprocessor lines, and every module its line count', () => {
  const p = glslStrip({ files: GLSL_MODULES });
  let modules = 0, literals = 0, saved = 0;
  for (const file of walk(join(ROOT, 'src', 'scripts'))) {
    const code = readFileSync(file, 'utf8');
    const id = file.replace(/\\/g, '/');
    const res = p.transform(code, id);
    if (!res) continue;
    modules++;
    assert.equal(res.code.split('\n').length, code.split('\n').length, `${id}: the line count`);
    const before = literalParts(code, id), after = literalParts(res.code, id);
    assert.equal(after.length, before.length, `${id}: the same literals`);
    for (let i = 0; i < before.length; i++) {
      const b = before[i].raw, a = after[i].raw;
      if (b === a) continue;
      literals++; saved += b.length - a.length;
      assert.deepEqual(glslTokens(a), glslTokens(b), `${id}: literal ${i} keeps its tokens`);
      const pre = (s: string) => s.split('\n').filter((l) => l.trim().startsWith('#')).map((l) => l.trim());
      assert.deepEqual(pre(a), pre(b.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ' ')).map((l) => l.replace(/\s+/g, ' ').trim()), `${id}: literal ${i} keeps its preprocessor lines`);
      assert.ok(!/\/\/|\/\*/.test(a), `${id}: literal ${i} has no comment left`);
      // where a part meets an expression it keeps a space or a newline if it had one, so no token joins the expression's
      if (before[i].before && /\s$/.test(b)) assert.match(a, /\s$/, `${id}: literal ${i} keeps its space before the expression`);
      if (before[i].after && /^\s/.test(b)) assert.match(a, /^\s/, `${id}: literal ${i} keeps its space after the expression`);
      if (before[i].before && /\n\s*$/.test(b.replace(/\/\/[^\n]*/g, ''))) assert.match(a, /\n$/, `${id}: literal ${i} keeps its line end before the expression`);
      if (before[i].after && /^\s*\n/.test(b)) assert.match(a, /^\n/, `${id}: literal ${i} keeps its line end after the expression`);
    }
    // the stripped module still parses as TypeScript with no new diagnostics
    const sf = ts.createSourceFile(id, res.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    assert.equal((sf as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics.length, 0, `${id}: parses`);
  }
  assert.ok(modules >= 12, `the shader modules are found (${modules})`);
  assert.ok(literals >= 40, `the shaders are found (${literals})`);
  assert.ok(saved > 10000, `the strip is worth its step (${saved} B of source)`);
});

test('astro.config.mjs registers the strip with the shader-only modules', async () => {
  const cfg = readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8');
  assert.match(cfg, /import \{ glslStrip, GLSL_MODULES \} from '\.\/scripts\/build\/glsl-strip\.mjs';/);
  assert.match(cfg, /plugins: \[glslStrip\(\{ files: GLSL_MODULES \}\)\]/);
  for (const m of GLSL_MODULES) assert.ok(statSync(join(ROOT, m)).isFile(), m);
  const config = (await import('../../astro.config.mjs')).default as { vite?: { plugins?: { name?: string }[] } };
  assert.ok(config.vite?.plugins?.some((p) => p?.name === 'skreed:glsl-strip'), 'the plugin is in the config');
});
