// AC1.1 at the source: the shipped defaults carry Sam's 13 locked values and logoIdle 1 (hero.md section 0; the idle twitch on since 2026-10-26, E-CD-glitch).
// The runtime check of the built hero (__skreedParams) is tests/e2e/locked-values.spec.ts (build step 8). The intro lines
// (not a P key: the constant INTRO_LINES of the intro) are checked against the prose paragraph of LOCKED_VALUES.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TEMPLATE } from './proto-source.ts';
import { HERO_PARAMS, LOCKED, heroParams } from '../../src/config/params.ts';
import { INTRO_LINES } from '../../src/scripts/hero/intro/igloo.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

// The prototype's P table (template.html line 305), evaluated with reduce false.
function prototypeP(): Record<string, number> {
  const src = TEMPLATE;
  const m = src.match(/^const P = (\{[\s\S]*?\});/m);
  assert.ok(m, 'prototype P not found');
  return new Function('reduce', 'return ' + m[1])(false);
}

// The two tables of docs/specs/evidence/LOCKED_VALUES.md: | label | param | value | or | label | param | v9.9 | locked |
function lockedFromEvidence(): Record<string, number> {
  const md = read('docs/specs/evidence/LOCKED_VALUES.md');
  const out: Record<string, number> = {};
  for (const line of md.split('\n')) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3 || !/^[a-zA-Z]+$/.test(cells[1]) || cells[1] === 'param') continue;
    const v = +cells[cells.length - 1];
    if (Number.isFinite(v)) out[cells[1]] = v;
  }
  return out;
}

test('66 keys, in the prototype order', () => {
  const P = prototypeP();
  assert.equal(Object.keys(HERO_PARAMS).length, 66);
  assert.deepEqual(Object.keys(HERO_PARAMS), Object.keys(P));
});

test('the 13 locked values equal LOCKED_VALUES.md and hero.md section 0, and ship as the defaults', () => {
  const ev = lockedFromEvidence();
  assert.equal(Object.keys(ev).length, 13);
  assert.deepEqual(LOCKED, ev);
  for (const [k, v] of Object.entries(ev)) assert.equal(HERO_PARAMS[k as keyof typeof HERO_PARAMS], v, k);
  const md = read('docs/specs/hero.md');
  for (const [k, v] of Object.entries(ev)) {
    const row = md.split('\n').find((l) => l.includes('| `' + k + '` |'));
    assert.ok(row, `hero.md section 0 has no row for ${k}`);
    const last = row.split('|').map((c) => c.trim()).filter(Boolean).pop();
    assert.equal(+String(last), v, `hero.md section 0: ${k}`);
  }
});

test('logoIdle is 1 (the idle twitch on, E-CD-glitch; D20 had it 0); every key equals the prototype', () => {
  const P = prototypeP();
  assert.equal(HERO_PARAMS.logoIdle, 1);
  for (const [k, v] of Object.entries(P)) assert.equal(HERO_PARAMS[k as keyof typeof HERO_PARAMS], v, k);
});

test('reduced motion zeroes breath only, and HERO_PARAMS is frozen', () => {
  const a = heroParams(false), b = heroParams(true);
  assert.equal(a.breath, 0.3);
  assert.equal(b.breath, 0);
  assert.deepEqual({ ...b, breath: 0.3 }, a);
  assert.ok(Object.isFrozen(HERO_PARAMS));
});

test('the intro lines are 1.5 (Sam, 2026-10-16): igloo.ts and the intro lines paragraph of LOCKED_VALUES.md agree', () => {
  assert.equal(INTRO_LINES, 1.5);
  const para = read('docs/specs/evidence/LOCKED_VALUES.md').split('\n').find((l) => l.startsWith('Intro lines (2026-10-16)'));
  assert.ok(para, 'LOCKED_VALUES.md has no intro lines paragraph');
  assert.match(para, /the "Intro lines" slider at 1\.50, its maximum/);
  assert.match(para, /the constant INTRO_LINES in src\/scripts\/hero\/intro\/igloo\.ts/);
});
