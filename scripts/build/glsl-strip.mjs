// The shader strip: a Vite step that takes the comments and the indentation out of the site's own GLSL at build time,
// so the chunks ship the shaders the GPU compiles and nothing of their prose. Measured 2026-10-29 on the section 5 sand
// build (docs/specs/section-5-sand.md 7): about 3.3 KB gzip off the hero chunk and 0.7 KB off section 4's, the saving
// that keeps the enforced total under CLAUDE.md's 250 KB with the pour's stream and dust in. It rewrites the template
// literals tagged /* glsl */ in any module, and every GLSL-like literal in the shader-only modules astro.config.mjs
// names (the logo, the post pass, the v11 intro and the world, whose strings are untagged because they are copied from
// the prototypes verbatim and tests/unit/glsl-v11.test.ts reads them whole from the source, which this never touches).
// Only comments and whitespace change: tests/unit/glsl-strip.test.ts tokenises every shader in the tree before and after
// and holds the two token streams equal, so no two tokens can merge (the spaces around operators stay; only those beside
// braces, brackets, semicolons and commas go), and every preprocessor line keeps its own line. The newlines a literal
// loses are put back after its closing backtick, where they are plain whitespace in TypeScript, so the file keeps its
// line count and the dev server's errors still name the right lines. The literals are found with TypeScript's own parser,
// never a regular expression over the module, so a backtick in a comment or a string is never mistaken for one.
import ts from 'typescript';

/** what a GLSL literal looks like: a statement and one of the language's own words */
const GLSL_LIKE = /\b(?:gl_FragColor|gl_Position|gl_FragCoord|gl_PointSize|precision\s+(?:highp|mediump|lowp)\b|uniform\s|varying\s|void\s+main\s*\(|vec[234]\b|mat[234]\b|float\b|sampler2D\b|texture2D\s*\(|texture\s*\()/;
const looksGlsl = (text) => text.length > 24 && text.includes(';') && GLSL_LIKE.test(text);

/** the GLSL with its comments gone: a block comment becomes one space, a line comment goes to the end of its line */
export function stripGlslComments(src) {
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; i--; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 1; out += ' '; continue; }
    out += c;
  }
  return out;
}

/** the comments gone, every line trimmed, runs of whitespace one space, the preprocessor lines each on their own, the
 *  spaces beside braces, brackets, semicolons and commas gone (never beside an operator, so no two can merge) */
export function stripGlslText(src) {
  const lines = stripGlslComments(src).split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = [];
  let run = [];
  const flush = () => { if (run.length) { out.push(run.join(' ').replace(/ ?([{}();,[\]]) ?/g, '$1')); run = []; } };
  for (const line of lines) {
    if (line.startsWith('#')) { flush(); out.push(line); } else run.push(line);
  }
  flush();
  return out.join('\n');
}

/** the whitespace to keep where a static part meets a ${} expression: a newline if there was one (a preprocessor line
 *  must end there), else one space if there was any (so the expression's first token never joins the last), else none */
const edge = (ws) => (ws.includes('\n') ? '\n' : ws ? ' ' : '');

/** the tokens of a shader, the comments and the whitespace left out, each preprocessor line one token */
export function glslTokens(src) {
  const re = /\s+|#[^\n]*|<<=|>>=|<<|>>|<=|>=|==|!=|&&|\|\||\^\^|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|[A-Za-z_][A-Za-z0-9_]*|(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?[uUfF]?|./g;
  const toks = [];
  for (const m of stripGlslComments(src).matchAll(re)) {
    const t = m[0];
    if (/^\s+$/.test(t)) continue;
    toks.push(t.startsWith('#') ? t.replace(/\s+/g, ' ').trim() : t);
  }
  return toks;
}

const kind = (file) => (/\.(mjs|cjs|js)$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS);

/** the static parts of a template literal node, each with the range of its raw text inside the delimiters */
function partsOf(node, sf) {
  const parts = ts.isTemplateExpression(node) ? [node.head, ...node.templateSpans.map((s) => s.literal)] : [node];
  return parts.map((p) => {
    const start = p.getStart(sf) + 1; // after ` or }
    const before = ts.isTemplateHead(p) || ts.isTemplateMiddle(p); // an expression follows
    const end = p.getEnd() - (before ? 2 : 1); // before ${ or `
    return { start, end, after: ts.isTemplateMiddle(p) || ts.isTemplateTail(p), before };
  });
}

/** rewrites the GLSL template literals of one module: the /* glsl *\/ ones, or every GLSL-like one with all set
 *  @param {string} code
 *  @param {string} [fileName]
 *  @param {{ all?: boolean }} [options]
 *  @returns {{ code: string, literals: number, saved: number }} */
export function stripGlslSource(code, fileName = 'module.ts', { all = false } = {}) {
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, kind(fileName));
  const edits = [];
  let literals = 0, saved = 0;
  const visit = (node) => {
    if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const lead = code.slice(node.getFullStart(), node.getStart(sf));
      const parts = partsOf(node, sf);
      const text = parts.map((r) => code.slice(r.start, r.end)).join('');
      if (/\/\*\s*glsl\s*\*\/\s*$/.test(lead) || (all && looksGlsl(text))) {
        let removed = 0, changed = false;
        for (const r of parts) {
          const raw = code.slice(r.start, r.end);
          const out = (r.after ? edge(raw.match(/^\s*/)[0]) : '') + stripGlslText(raw) + (r.before ? edge(raw.match(/\s*$/)[0]) : '');
          if (out === raw) continue;
          changed = true; saved += raw.length - out.length;
          removed += (raw.match(/\n/g) ?? []).length - (out.match(/\n/g) ?? []).length;
          edits.push({ start: r.start, end: r.end, text: out });
        }
        if (changed) literals++;
        // the lost newlines go back after the closing backtick, where the next token is one a newline cannot join
        const end = node.getEnd();
        if (removed > 0 && /^\s*(?:[,;)\]}]|$)/.test(code.slice(end, end + 2))) edits.push({ start: end, end, text: '\n'.repeat(removed) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  edits.sort((a, b) => b.start - a.start);
  let out = code;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return { code: out, literals, saved };
}

/** the Vite plugin: files are the shader-only modules (paths from the project root) whose every GLSL literal is stripped
 *  @param {{ files?: string[] }} [options]
 *  @returns {{ name: string, enforce: 'pre', transform: (code: string, id: string) => { code: string, map: null } | null }} */
export function glslStrip({ files = [] } = {}) {
  const suffixes = files.map((f) => '/' + f.replace(/\\/g, '/').replace(/^\.?\//, ''));
  return {
    name: 'skreed:glsl-strip',
    enforce: 'pre',
    transform(code, id) {
      const path = id.replace(/\\/g, '/');
      // a module only: never a ?raw text, a query of any kind, or a dependency
      if (!/\.(ts|mts|js|mjs)$/.test(path) || path.includes('/node_modules/')) return null;
      const all = suffixes.some((s) => path.endsWith(s));
      if (!all && !code.includes('/* glsl */')) return null;
      const out = stripGlslSource(code, path, { all });
      return out.literals ? { code: out.code, map: null } : null;
    },
  };
}

/** the shader-only modules, for astro.config.mjs and the unit test
 *  @type {string[]} */
export const GLSL_MODULES = ['src/scripts/hero/logo/shaders.ts', 'src/scripts/hero/post/shaders.ts', 'src/scripts/hero/v11/glsl.ts', 'src/scripts/hero/world/shaders.ts'];
