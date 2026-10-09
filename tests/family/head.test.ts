// The family head script (docs/specs/family-page.md 2.7 and 5 "First paint"; acceptance 6, 9 "?shade=" rows).
// Runs the built script string (CFG prepended and minified exactly as FamilyHeadFirst.astro does) in a vm with a
// stub document, location and history.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { inlineScript } from '../../src/components/shell/inlineScript.ts';
import { headCfg } from '../../src/scripts/family/head.ts';
import { FAMILIES } from '../../src/scripts/family/data.ts';

const SRC = readFileSync(new URL('../../src/scripts/family/head.inline.js', import.meta.url), 'utf8');
const build = (has3d: boolean) => inlineScript('family-head.js', { CFG: headCfg(has3d) }, SRC);

interface Env { url?: string; slug?: string; has3d?: boolean; webgl2?: boolean; saveData?: boolean; effectiveType?: string; deviceMemory?: number; reduced?: boolean }
function run(env: Env) {
  const slug = env.slug ?? 'blissful-blues';
  const fam = FAMILIES.find((f) => f.slug === slug)!;
  const url = new URL(env.url ?? `https://skreed.in/shades/${slug}/`);
  const attrs = new Map<string, string>();
  const classes = new Set<string>();
  const calls: { replace?: string; replaceState?: string } = {};
  const html = {
    classList: { add: (...c: string[]) => c.forEach((x) => classes.add(x)), contains: (c: string) => classes.has(c) },
    setAttribute: (k: string, v: string) => attrs.set(k, v),
  };
  const meta = { content: `${fam.slug} ${String(fam.first).padStart(3, '0')} ${fam.key.nnn}` };
  const ctx: Record<string, unknown> = {
    document: { documentElement: html, querySelector: (q: string) => (q.includes('skreed-family') ? meta : null) },
    location: { search: url.search, hash: url.hash, pathname: url.pathname, replace: (u: string) => { calls.replace = u; } },
    history: { state: null, replaceState: (_s: unknown, _t: string, u: string) => { calls.replaceState = u; } },
    navigator: { connection: { saveData: env.saveData ?? false, effectiveType: env.effectiveType ?? '4g' }, deviceMemory: env.deviceMemory },
    matchMedia: (q: string) => ({ matches: q.includes('reduce') ? !!env.reduced : false }),
    URLSearchParams,
  };
  if (env.webgl2 !== false) ctx.WebGL2RenderingContext = function WebGL2RenderingContext() {};
  ctx.window = ctx;
  vm.runInNewContext(build(env.has3d ?? false), ctx);
  return { attrs, classes, calls };
}

test('identical bytes on all ten pages within a build (one CSP hash), under 1.5 KB', () => {
  const a = build(false), b = build(false);
  assert.equal(a, b);
  assert.ok(!/blissful|frosty/.test(a.replace(/slugs:\[[^\]]*\]/, '')), 'no page-specific value outside the slug list');
  const kb = Buffer.byteLength(a);
  assert.ok(kb <= 1536, `head script ${kb} B`);
  assert.ok(gzipSync(a).length < 900);
  assert.notEqual(createHash('sha256').update(a).digest('base64'), createHash('sha256').update(build(true)).digest('base64'), 'a 3D build has its own hash');
});

test('no ?shade: the key shade, no deep link, no URL change', () => {
  const r = run({});
  assert.equal(r.attrs.get('data-shade'), '032');
  assert.equal(r.attrs.get('data-first'), '025');
  assert.ok(!r.attrs.has('data-deeplink'));
  assert.equal(r.calls.replaceState, undefined);
  assert.equal(r.calls.replace, undefined);
  assert.ok(r.classes.has('js'));
});

test('a valid ?shade of this family selects it and marks the deep link; the key shade itself is not a deep link', () => {
  const r = run({ url: 'https://skreed.in/shades/blissful-blues/?shade=025' });
  assert.equal(r.attrs.get('data-shade'), '025');
  assert.equal(r.attrs.get('data-deeplink'), '');
  const k = run({ url: 'https://skreed.in/shades/blissful-blues/?shade=032' });
  assert.equal(k.attrs.get('data-shade'), '032');
  assert.ok(!k.attrs.has('data-deeplink'));
  const end = run({ url: 'https://skreed.in/shades/blissful-blues/?shade=048' });
  assert.equal(end.attrs.get('data-shade'), '048');
});

test('a ?shade of another family replaces the location with that family, same parameters', () => {
  const r = run({ url: 'https://skreed.in/shades/vivid-violets/?shade=032', slug: 'vivid-violets' });
  assert.equal(r.calls.replace, '/shades/blissful-blues/?shade=032');
  assert.ok(r.classes.has('leaving'));
  assert.equal(run({ url: 'https://skreed.in/shades/blissful-blues/?shade=001&finish=gloss' }).calls.replace, '/shades/frosty-whites/?shade=001&finish=gloss');
  assert.equal(run({ url: 'https://skreed.in/shades/blissful-blues/?shade=240' }).calls.replace, '/shades/roaring-reds/?shade=240');
});

test('anything else is removed with replaceState and the key shade stays', () => {
  for (const bad of ['999', '000', '32', 'abc', '', '0320', '-01']) {
    const r = run({ url: `https://skreed.in/shades/blissful-blues/?shade=${bad}&x=1#families` });
    assert.equal(r.attrs.get('data-shade'), '032', bad);
    assert.equal(r.calls.replaceState, '/shades/blissful-blues/?x=1#families', bad);
    assert.equal(r.calls.replace, undefined);
  }
  const only = run({ url: 'https://skreed.in/shades/blissful-blues/?shade=999' });
  assert.equal(only.calls.replaceState, '/shades/blissful-blues/');
});

test('?finish=gloss or matte is kept on html; anything else is removed', () => {
  assert.equal(run({ url: 'https://skreed.in/shades/blissful-blues/?finish=gloss' }).attrs.get('data-finish'), 'gloss');
  const r = run({ url: 'https://skreed.in/shades/blissful-blues/?shade=030&finish=shiny' });
  assert.equal(r.attrs.get('data-shade'), '030');
  assert.equal(r.calls.replaceState, '/shades/blissful-blues/?shade=030');
});

test('mode: an off build is always swatch grid mode', () => {
  const r = run({ has3d: false });
  assert.ok(r.classes.has('grid'));
  assert.equal(r.attrs.get('data-why'), 'off');
});

test('mode in a 3D build: the hero gate signals send the page to swatch grid mode, otherwise 3D', () => {
  const cases: [Env, string][] = [
    [{ webgl2: false }, 'webgl'], [{ saveData: true }, 'savedata'], [{ effectiveType: '2g' }, 'slow'], [{ effectiveType: 'slow-2g' }, 'slow'],
    [{ deviceMemory: 2 }, 'memory'], [{ deviceMemory: 1 }, 'memory'], [{ reduced: true }, 'reduced'],
  ];
  for (const [env, why] of cases) {
    const r = run({ ...env, has3d: true });
    assert.ok(r.classes.has('grid'), why);
    assert.equal(r.attrs.get('data-why'), why);
  }
  const ok = run({ has3d: true, deviceMemory: 4 });
  assert.ok(ok.classes.has('m3d'));
  assert.ok(!ok.classes.has('grid'));
});
