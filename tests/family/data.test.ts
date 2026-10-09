// Family pages: data, routes and build asserts (docs/specs/family-page.md 2.1, 2.6, 3; acceptance 1, 6, 10).
//   node --test tests/family/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { FAMILIES, buildFamilies, pageCss, contrast, nnn, familyOf, type RawData, type RawKey } from '../../src/scripts/family/data.ts';
import { FAM_COPY } from '../../src/scripts/family/copy.ts';
import { SWAP_MS, SWAP_EASE, SHADE_MS } from '../../src/scripts/family/timing.ts';
import { family3dMode, familyPagesOn } from '../../src/scripts/family/mode.ts';
import { SITE_COPY } from '../../src/scripts/family/site-copy.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const raw = JSON.parse(read('docs/data/shades-240.json')) as RawData;
const keys = JSON.parse(read('src/data/family-keys.json')) as RawKey[];
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// spec 2.1, the table: slug, key shade, in family, catalog, stage neutral, first to last
const TABLE: [string, string, number, string, 'slate' | 'pearl', string, string][] = [
  ['frosty-whites', 'Snow', 7, '007', 'slate', 'Pearl', 'Oatmeal'],
  ['blissful-blues', 'Sky', 8, '032', 'pearl', 'Electric', 'Midnight'],
  ['playful-pinks', 'Rouge', 14, '062', 'slate', 'Light Pink', 'Fuchsia'],
  ['vivid-violets', 'Amethyst', 7, '079', 'pearl', 'Light Violet', 'Eggplant'],
  ['mellow-yellows', 'Sunbeam', 1, '097', 'slate', 'Sunbeam', 'Dijon'],
  ['earthy-browns', 'Cinnamon', 7, '127', 'pearl', 'Almond', 'Umber'],
  ['blushing-corals', 'Mango', 4, '148', 'slate', 'Bellini', 'Rust'],
  ['stormy-greys', 'Silver', 5, '173', 'pearl', 'Pale Grey', 'Charcoal'],
  ['go-green', 'Lawn', 12, '204', 'slate', 'Light Green', 'Army'],
  ['roaring-reds', 'Crimson', 7, '223', 'pearl', 'Pastel', 'Mahogany'],
];

test('ten families in catalog order, each with the key shade, catalog number and neutral of the spec table', () => {
  assert.equal(FAMILIES.length, 10);
  FAMILIES.forEach((f, i) => {
    const [slug, key, idx, cat, neutral, first, last] = TABLE[i];
    assert.equal(f.slug, slug);
    assert.match(f.slug, /^[a-z]+(-[a-z]+)*$/);
    assert.equal(f.ordinal, i + 1);
    assert.equal(f.key.name, key);
    assert.equal(f.key.index, idx);
    assert.equal(f.key.nnn, cat);
    assert.equal(f.neutral, neutral, `${slug} neutral`);
    assert.equal(f.shades[0].name, first);
    assert.equal(f.shades[23].name, last);
    assert.equal(f.shades.length, 24);
    f.shades.forEach((s, k) => { assert.equal(s.n, i * 24 + k + 1); assert.equal(s.nnn, nnn(s.n)); });
  });
  // the neutrals alternate in catalog order, as the catalog's pages do
  FAMILIES.forEach((f, i) => assert.equal(f.neutral, i % 2 ? 'pearl' : 'slate'));
});

test('swatches under 1.5:1 against their neutral get the ring: Blissful Blues 6, Go Green 5, Vivid Violets 2, Earthy Browns 2, others 0', () => {
  const want: Record<string, number> = { 'blissful-blues': 6, 'go-green': 5, 'vivid-violets': 2, 'earthy-browns': 2 };
  for (const f of FAMILIES) assert.equal(f.shades.filter((s) => s.low).length, want[f.slug] ?? 0, f.slug);
  assert.ok(Math.abs(contrast('#F7F6F3', '#383F43') - 9.9) < 0.1, 'Pearl on Slate is 9.9:1');
});

test('catalog numbers map back to their family (the head script and the reserve link use them)', () => {
  assert.equal(familyOf(1).slug, 'frosty-whites');
  assert.equal(familyOf(24).slug, 'frosty-whites');
  assert.equal(familyOf(25).slug, 'blissful-blues');
  assert.equal(familyOf(240).slug, 'roaring-reds');
});

test('the build fails on bad data: 23 shades, 9 families, a repeated name, an unsafe slug, a bad hex, a stale key', () => {
  const cases: [string, (d: { families: { id: string; name: string; shades: { name: string; hex: string; id: string; index: number }[] }[] }, k: RawKey[]) => void, RegExp][] = [
    ['23 shades', (d) => { d.families[3].shades.pop(); }, /vivid-violets has 23 shades/],
    ['9 families', (d) => { d.families.pop(); }, /expected 10 families/],
    ['repeated name', (d) => { d.families[0].shades[5].name = d.families[0].shades[4].name; }, /repeats inside frosty-whites/],
    ['unsafe slug', (d, k) => { d.families[1].id = 'Blissful Blues'; k[1] = { ...k[1], family: 'Blissful Blues' }; }, /not URL-safe/],
    ['bad hex', (d) => { d.families[2].shades[0].hex = '#ffff'; }, /hex is not #rrggbb/],
    ['stale key', (_d, k) => { k[4] = { ...k[4], name: 'Lemon' }; }, /disagrees with the data/],
  ];
  for (const [name, mutate, re] of cases) {
    const d = clone(raw) as unknown as Parameters<typeof mutate>[0];
    const k = clone(keys);
    mutate(d, k);
    assert.throws(() => buildFamilies(d as unknown as RawData, k), re, name);
  }
  assert.doesNotThrow(() => buildFamilies(clone(raw), clone(keys)));
});

test('the page stylesheet: tokens only (no hex), one rule per swatch shown, the selection rules, inside budget', () => {
  for (const f of FAMILIES) {
    const css = pageCss(f);
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, `${f.slug}: no hex in the page CSS`);
    const swatchRules = new Set([...css.matchAll(/^\[data-s="(\d{3})"\]/gm)].map((m) => m[1]));
    const keysShown = new Set(FAMILIES.map((g) => g.key.nnn));
    const want = new Set([...f.shades.map((s) => s.nnn), ...keysShown]);
    assert.deepEqual([...swatchRules].sort(), [...want].sort(), `${f.slug}: one --sw rule per swatch on the page`);
    assert.equal([...css.matchAll(/^html\[data-shade="\d{3}"\]\{--k:/gm)].length, 24);
    assert.ok(css.includes(`html:not([data-shade]) .gsw[data-s="${f.key.nnn}"]`), 'the key shade is selected without a script');
    assert.ok(gzipSync(css).length < 1200, `${f.slug}: ${gzipSync(css).length} B gzip`);
    if (f.neutral === 'slate') assert.ok(css.includes('--skeleton:color-mix(in srgb,var(--pearl-whisper) 12%,var(--urban-slate))'), 'mirrored skeleton on Slate pages (R7)');
  }
});

test('copy: sentence case strings with no em dash, no emoji, real names; the reserve link carries shade and finish', () => {
  const strings: string[] = [];
  const s0 = { name: 'Sky', index: 8, n: 32, nnn: '032' };
  for (const v of Object.values(FAM_COPY)) {
    if (typeof v === 'string') strings.push(v);
    else strings.push(String((v as (...a: unknown[]) => string)(s0 as never, 'Blissful Blues' as never)));
  }
  for (const s of strings) {
    assert.doesNotMatch(s, /\u2014|\u2013/, `no em or en dash: ${s}`);
    assert.doesNotMatch(s, /\p{Extended_Pictographic}/u, `no emoji: ${s}`);
    assert.doesNotMatch(s, /seamless|elevate|unleash|next-level|revolutionary/i);
  }
  assert.equal(FAM_COPY.reserveHref(s0, 'gloss'), '/?shade=032&finish=gloss#reserve');
  assert.equal(FAM_COPY.title('Blissful Blues'), 'Blissful Blues, all 24 shades. Skreed');
  assert.equal(FAM_COPY.description('Blissful Blues', 'Electric', 'Midnight'), 'All 24 Blissful Blues shades, from Electric to Midnight, on a Skreed case in matte or gloss. Doors open Nov 1.');
  assert.equal(FAM_COPY.live(s0, 'Blissful Blues'), 'Sky. Blissful Blues. Shade 32 of 240.');
  assert.equal(FAM_COPY.scrubberText(s0), 'Sky, 8 of 24');
});

test('motion timings in code equal the CSS tokens (DESIGN.md "Family pages")', () => {
  const css = read('src/styles/family.css');
  assert.equal(css.match(/--dur-swap:\s*(\d+)ms/)?.[1], String(SWAP_MS));
  assert.equal(css.match(/--ease-swap:\s*(cubic-bezier\([^)]*\))/)?.[1], SWAP_EASE);
  assert.equal(css.match(/--dur-shade:\s*(\d+)ms/)?.[1], String(SHADE_MS));
});

test('C3: the family CSS transitions transform, opacity and press colours only, never a custom property or a shade', () => {
  const css = read('src/styles/family.css');
  assert.doesNotMatch(css, /@property/);
  for (const m of css.matchAll(/transition:\s*([^;}]+)/g)) {
    for (const part of m[1].split(',')) {
      const prop = part.trim().split(/\s+/)[0];
      assert.ok(['transform', 'opacity', 'none', 'background-color', 'color'].includes(prop), `transition on ${prop}`);
    }
  }
});

test('rule 15: family CSS gaps and paddings come from the spacing scale, and the wide layout has no raw offsets', () => {
  const css = read('src/styles/family.css');
  for (const m of css.matchAll(/(?:^|[;{\s])(gap|row-gap|column-gap):\s*([^;}]+)/g)) {
    for (const v of m[2].trim().split(/\s+/)) assert.match(v, /^var\(--(s\d|inset)\)$|^0$/, `${m[1]}: ${m[2]}`);
  }
  assert.doesNotMatch(css, /\b(140|134|186)px\b/);
});

test('FAMILY_3D: off by default in a build, dev under astro dev, on refuses a missing or stand-in manifest', () => {
  assert.equal(family3dMode(undefined, false), 'off');
  assert.equal(family3dMode(undefined, true), 'dev');
  assert.equal(family3dMode('off', true), 'off');
  assert.equal(family3dMode('dev', false), 'dev');
  assert.throws(() => family3dMode('on', false), /needs the supplier case model|stand-in never ships/);
  assert.throws(() => family3dMode('maybe', false), /must be off, dev or on/);
});

test('FAMILY_PAGES (G21): off in the production build until Reserve and the Wall exist, on in dev, test and staging builds', () => {
  const prod = { dev: false, staging: false, hooks: false };
  assert.equal(familyPagesOn(undefined, prod), false);
  assert.equal(familyPagesOn(undefined, { ...prod, dev: true }), true);
  assert.equal(familyPagesOn(undefined, { ...prod, hooks: true }), true);
  assert.equal(familyPagesOn(undefined, { ...prod, staging: true }), true);
  assert.equal(familyPagesOn('on', prod), true);
  assert.equal(familyPagesOn('off', { dev: true, staging: true, hooks: true }), false);
  assert.throws(() => familyPagesOn('yes', prod), /must be on or off/);
});

test('FAMILY_PAGES off: the landing mount carries no family-links.css and no script (review iteration 2, item 3)', () => {
  // FamilyLinks.astro is what index.astro imports; it must import neither the stylesheet (with its @view-transition rule)
  // nor links.ts statically, and reach FamilyLinksNav.astro only through a dynamic import under a condition Vite folds.
  // The built proof (production plus the mount: no nav, no rule, no chunk) is in the spec's iteration 3 notes.
  const wrap = read('src/components/family/FamilyLinks.astro').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');   // code only
  const front = wrap.split('---')[1];
  assert.doesNotMatch(wrap, /family-links\.css|links\.ts|<script/);
  assert.doesNotMatch(front, /^import .*FamilyLinksNav/m);
  assert.match(front, /import\.meta\.env\.PUBLIC_FAMILY_PAGES === 'on'[\s\S]*\? \(await import\('\.\/FamilyLinksNav\.astro'\)\)\.default : null/);
  const nav = read('src/components/family/FamilyLinksNav.astro');
  assert.match(nav, /import '\.\.\/\.\.\/styles\/family-links\.css'/);
  assert.match(nav, /<script>import '\.\.\/\.\.\/scripts\/family\/links\.ts';<\/script>/);
});

test('the 404 copy and the structured data facts: no em dash, no emoji, digits only in the h404 headline', () => {
  const c = SITE_COPY.notFound;
  for (const v of [c.title, c.description, c.h1, c.line, c.button, ...Object.values(SITE_COPY.org)]) {
    assert.doesNotMatch(v, /\u2014|\u2013/);
    assert.doesNotMatch(v, /\p{Extended_Pictographic}/u);
  }
  assert.match(c.h1, /^404\. /);
  assert.ok(FAMILIES.some((f) => f.shades.some((s) => s.id === c.swatch)), 'the 404 swatch is a real shade');
  assert.equal(SITE_COPY.org.email, FAM_COPY.email);
  assert.equal(SITE_COPY.org.instagram, FAM_COPY.instagramHref);
});

test('guards on the family sources: no box-shadow, backdrop-filter, gradient, blur( or italic; no em dash; no inline style attribute', () => {
  const files = ['src/styles/family.css', 'src/styles/family-links.css', 'src/scripts/family/page.ts', 'src/scripts/family/copy.ts', 'src/scripts/family/head.inline.js',
    'src/scripts/family/rock-links.ts', 'src/scripts/family/links.ts', 'src/scripts/family/site-copy.ts',
    'src/components/family/FamilyPage.astro', 'src/components/family/SwatchGrid.astro', 'src/components/family/FamilyHeadFirst.astro',
    'src/components/family/FamilyLinks.astro', 'src/components/family/FamilyLinksNav.astro', 'src/pages/shades/[family].astro', 'src/pages/404.astro', 'src/pages/sitemap.xml.ts', 'src/pages/robots.txt.ts'];
  for (const f of files) {
    const s = read(f);
    assert.doesNotMatch(s, /box-shadow|backdrop-filter|gradient|blur\(|italic|font-style:\s*oblique/i, f);
    assert.doesNotMatch(s, /\u2014/, `${f}: em dash`);
    assert.doesNotMatch(s, /\sstyle=["{]/, `${f}: style attribute`);
    assert.doesNotMatch(s, /\b(Inter|Space Grotesk|Geist|Montserrat|Playfair|Instrument Serif)\b/, `${f}: banned face`);
  }
});
