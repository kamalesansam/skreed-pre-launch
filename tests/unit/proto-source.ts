// Reads source fragments out of the approved prototype (prototypes/hero-v9/template.html, read-only) for the parity unit
// tests: the raw text of every GLSL string literal the hero uses, and the source of makeScrollTexture. The port must
// produce the same strings and the same wipe texture (hero-architecture.md 5.1, "Port rules that keep pixels identical").
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TEMPLATE = readFileSync(fileURLToPath(new URL('../../prototypes/hero-v9/template.html', import.meta.url)), 'utf8');

/** Reads one JS string or template literal starting at src[i] (a quote or backtick). Returns its raw source text. */
export function readLiteral(src: string, i: number): string {
  const q = src[i];
  if (q !== '`' && q !== "'" && q !== '"') throw new Error(`no literal at ${i}: ${src.slice(i, i + 20)}`);
  let j = i + 1, depth = 0;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (q === '`' && c === '$' && src[j + 1] === '{') { depth++; j += 2; continue; }
    if (depth > 0 && c === '}') { depth--; j++; continue; }
    if (depth === 0 && c === q) return src.slice(i, j + 1);
    j++;
  }
  throw new Error('unterminated literal at ' + i);
}

/** The literal that follows `key` after `anchor` (skipping whitespace and a GLSL tag comment). */
export function literalAfter(anchor: string, key: string, from = 0): { raw: string; end: number } {
  const a = TEMPLATE.indexOf(anchor, from);
  if (a < 0) throw new Error('anchor not found: ' + anchor);
  const k = TEMPLATE.indexOf(key, a);
  if (k < 0) throw new Error('key not found after anchor: ' + key);
  let i = k + key.length;
  for (;;) {
    while (/\s/.test(TEMPLATE[i])) i++;
    if (TEMPLATE.startsWith('/* glsl */', i)) { i += '/* glsl */'.length; continue; }
    break;
  }
  const raw = readLiteral(TEMPLATE, i);
  return { raw, end: i + raw.length };
}

/** Evaluates a raw literal's text into its string value; MAXB is the only interpolated name in the hero's GLSL. */
export function evalLiteral(raw: string, MAXB = 30): string {
  return new Function('MAXB', 'return ' + raw)(MAXB) as string;
}

/** Every GLSL literal of the hero, by the port's name for it. */
export function prototypeShaders(): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (name: string, r: { raw: string }) => { out[name] = r.raw; };
  const lv = literalAfter('const logoMat = new THREE.ShaderMaterial({', 'vertexShader:'); put('logoVert', lv);
  put('logoFrag', literalAfter('const logoMat = new THREE.ShaderMaterial({', 'fragmentShader:'));
  const skyA = 'const skyDome = new THREE.Mesh(';
  put('skyVert', literalAfter(skyA, 'vertexShader:'));
  put('skyFrag', literalAfter(skyA, 'fragmentShader:'));
  put('groundVertCommon', literalAfter("sh.vertexShader = sh.vertexShader.replace('#include <common>',", ','));
  put('groundVertProject', literalAfter(".replace('#include <project_vertex>',", ','));
  put('groundFragCommon', literalAfter("sh.fragmentShader = sh.fragmentShader.replace('#include <common>',", ','));
  put('groundFragMap', literalAfter(".replace('#include <map_fragment>',", ','));
  const windA = 'const bake = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({';
  put('windVert', literalAfter(windA, 'vertexShader:'));
  put('windFrag', literalAfter(windA, 'fragmentShader:'));
  const fogA = 'uniforms: { ...FOG, uTile:';
  put('fogVert', literalAfter(fogA, 'vertexShader:'));
  put('fogFrag', literalAfter(fogA, 'fragmentShader:'));
  const resA = 'uniforms: { tDiffuse: { value: null }, tClean: { value: null } },';
  put('restoreVert', literalAfter(resA, 'vertexShader:'));
  put('restoreFrag', literalAfter(resA, 'fragmentShader:'));
  const compA = 'uniforms: C, depthTest: false, depthWrite: false,';
  put('compositeVert', literalAfter(compA, 'vertexShader:'));
  put('compositeFrag', literalAfter(compA, 'fragmentShader:'));
  return out;
}

/** The source text of a top-level function of the prototype's module, by brace matching from its declaration. */
export function functionSource(decl: string): string {
  const a = TEMPLATE.indexOf(decl);
  if (a < 0) throw new Error('function not found: ' + decl);
  let i = TEMPLATE.indexOf('{', a), depth = 0;
  for (; i < TEMPLATE.length; i++) {
    const c = TEMPLATE[i];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return TEMPLATE.slice(a, i + 1);
  }
  throw new Error('unbalanced: ' + decl);
}
