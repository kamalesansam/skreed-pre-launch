// AC1.1 at the source: the shipped defaults carry Sam's 13 locked values and logoIdle 0 (hero.md section 0, D20).
// The runtime check of the built hero (__skreedParams) is tests/e2e/locked-values.spec.ts (build step 8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TEMPLATE } from './proto-source.ts';
import { HERO_PARAMS, LOCKED, heroParams } from '../../src/config/params.ts';

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

test('logoIdle is 0 (no idle twitch in production, D20); every other key equals the prototype', () => {
  const P = prototypeP();
  assert.equal(HERO_PARAMS.logoIdle, 0);
  for (const [k, v] of Object.entries(P)) if (k !== 'logoIdle') assert.equal(HERO_PARAMS[k as keyof typeof HERO_PARAMS], v, k);
});

test('reduced motion zeroes breath only, and HERO_PARAMS is frozen', () => {
  const a = heroParams(false), b = heroParams(true);
  assert.equal(a.breath, 0.3);
  assert.equal(b.breath, 0);
  assert.deepEqual({ ...b, breath: 0.3 }, a);
  assert.ok(Object.isFrozen(HERO_PARAMS));
});
