// The colour tokens: src/config/tokens.ts and src/styles/tokens.css against DESIGN.md (A2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import * as T from '../../src/config/tokens.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const design = read('DESIGN.md');
// the DESIGN.md token block: --name: #HEX;
const designTok = (name: string) => { const m = design.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6});`)); assert.ok(m, name); return m[1]; };

test('tokens.ts equals DESIGN.md', () => {
  assert.equal(T.PEARL_WHISPER, designTok('pearl-whisper'));
  assert.equal(T.URBAN_SLATE, designTok('urban-slate'));
  assert.equal(T.EMBER_LUXE, designTok('ember-luxe'));
  assert.equal(T.NIGHT, designTok('night'));
});

test('tokens.css equals DESIGN.md (every colour token of the DESIGN.md block)', { skip: !existsSync(new URL('src/styles/tokens.css', root)) }, () => {
  const css = read('src/styles/tokens.css');
  for (const name of ['pearl-whisper', 'urban-slate', 'ember-luxe', 'night', 'almond-silk', 'steel-twilight', 'rust-ember']) {
    const m = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
    assert.ok(m, `tokens.css lacks --${name}`);
    assert.equal(m[1].toUpperCase(), designTok(name).toUpperCase(), name);
  }
  assert.match(css, /--skeleton:\s*color-mix\(in srgb, var\(--urban-slate\) 12%, var\(--pearl-whisper\)\)/);
});
