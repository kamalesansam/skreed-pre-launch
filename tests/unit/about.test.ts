// The About page (docs/specs/about.md): its words held character for character (AC4), the launch line against LAUNCH_ISO,
// the sitemap entry (D16), the source rules of the page and its stylesheet (AC2, AC10), and the Inter file with its
// records (AC3). The file is read here directly, its WOFF2 tables decompressed with node:zlib's Brotli, so its axes,
// characters, features, names and style bits are checked without fontTools and without trusting the build script.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { ABOUT_COPY as C } from '../../src/config/about.ts';
import { LAUNCH_ISO } from '../../src/config/site.ts';
import { GET } from '../../src/pages/sitemap.xml.ts';
import { FAMILIES } from '../../src/scripts/family/data.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const bytes = (p: string) => readFileSync(new URL(p, root));
const sha = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex');
const R = '’', NBSP = ' ';
const FONT = 'inter-400-700-latin.woff2';

// section 3 of the spec, as rendered
const EXPECTED = {
  h1: 'About Skreed',
  p1: 'Skreed started with a simple idea: colour is personal.',
  p2: `We${R}ve always believed that the things we carry every day should feel a little more like us. That${R}s why we went looking beyond the usual handful of colours and built a world of our own: a spectrum of over 240 shades across an ecosystem of premium tech accessories, each designed to feel every bit as unique as the person using them.`,
  p3: 'And while colour is at the heart of what we do, thoughtful design is what brings it all together. Backed by a team recognised with multiple CES Innovation Awards, Red Dot Design Awards, and New York Design Awards, Skreed brings a premium, considered approach to personal tech.',
  p4: `And now we${R}re bringing it all to India.`,
  p5: ['Welcome to Skreed. We hope you find something here that makes you stop scrolling for a second and think, ', `that${R}s the one`, '.'],
  sign: 'Your perfect shade.',
  launch: ['Launching ', `November${NBSP}15`, '.'],
  title: 'About Skreed',
  description: `Skreed started with a simple idea: colour is personal. And now we${R}re bringing it all to India. Launching November 15.`,
};
const strings = (): string[] => Object.values(C).flatMap((v) => (typeof v === 'string' ? [v] : [...v]));

test('the copy is section 3, character for character', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(C)), EXPECTED);
  for (const w of [`We${R}ve`, `That${R}s`]) assert.ok(C.p2.includes(w), w);
  assert.ok(C.p4.includes(`we${R}re`)); assert.equal(C.p5[1], `that${R}s the one`); assert.ok(C.description.includes(`we${R}re`));
  assert.equal(C.launch.join(''), `Launching November${NBSP}15.`);
  // the description is three of the copy's own sentences, in order, with a plain space before "15"
  assert.equal(C.description, `${C.p1} ${C.p4} ${C.launch.join('').replace(NBSP, ' ')}`);
});

test('the copy: no straight apostrophe, em or en dash, emoji or buzzword; the brief\'s words kept', () => {
  for (const s of strings()) {
    assert.doesNotMatch(s, /['—–]/, s);
    assert.doesNotMatch(s, /\p{Extended_Pictographic}/u, s);
    assert.doesNotMatch(s, /seamless|elevate|unleash|next-level|revolutionary/i, s);
  }
  assert.doesNotMatch(C.h1, /\d/, 'no digit in the h1 (A3)');
  for (const w of ['over 240 shades', 'recognised', 'CES Innovation Awards, Red Dot Design Awards, and New York Design Awards']) assert.ok(strings().join(' ').includes(w), w);
});

test('the launch line is LAUNCH_ISO\'s date, and the page gives the <time> that datetime', () => {
  const [y, m, d] = LAUNCH_ISO.slice(0, 10).split('-').map(Number);
  assert.equal(y, 2026);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  assert.equal(C.launch[1], `${months[m - 1]}${NBSP}${d}`);
  assert.ok(C.description.endsWith(`Launching ${months[m - 1]} ${d}.`));
  assert.match(read('src/pages/about.astro'), /<time datetime=\{LAUNCH_ISO\}>\{c\.launch\[1\]\}<\/time>/);
});

test('the sitemap lists the landing, then /about/, then the ten family pages', async () => {
  const res = await GET({} as never);
  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
  assert.deepEqual(locs, ['https://skreed.in/', 'https://skreed.in/about/', ...FAMILIES.map((f) => `https://skreed.in/shades/${f.slug}/`)]);
});

test('about.astro: no script but the JSON-LD block, no script-carrying component, no client: directive, no style attribute', () => {
  const page = read('src/pages/about.astro');
  const imports = [...page.matchAll(/^import\s+[^'"]*?['"]([^'"]+)['"]/gm)].map((x) => x[1]);
  assert.ok(imports.length >= 8);
  assert.ok(!imports.some((p) => /SiteLogo|BackToTop/.test(p)), 'SiteLogo.astro and BackToTop.astro carry scripts');
  for (const p of imports.filter((x) => x.endsWith('.astro'))) {
    assert.doesNotMatch(readFileSync(new URL(p, new URL('src/pages/', root)), 'utf8'), /<script\b/i, `${p} carries a script`);
  }
  assert.deepEqual([...page.matchAll(/<script\b[^>]*>/gi)].map((x) => x[0]), ['<script type="application/ld+json" is:inline set:html={ld}>']);
  assert.doesNotMatch(page, /\bclient:/);
  assert.doesNotMatch(page, /\sstyle=/);
  assert.match(page, /preloadFonts=\{\['\/fonts\/inter-400-700-latin\.woff2'\]\}/);
});

// build.py's recipe, read from its source: the LATIN range and the FEATS list
const buildPy = read('scripts/fonts/build.py');
const LATIN = [...buildPy.match(/^LATIN = \(([\s\S]*?)\)$/m)![1].matchAll(/"([^"]*)"/g)].map((x) => x[1]).join('');
const FEATS = [...buildPy.match(/^FEATS = \[([^\]]*)\]/m)![1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
const latinSet = new Set<number>();
for (const r of LATIN.split(',')) { const [a, b] = r.slice(2).split('-').map((h) => parseInt(h, 16)); for (let c = a; c <= (b ?? a); c++) latinSet.add(c); }

test('about.css: Inter and its fallbacks only, swap, LATIN, nothing italic, the em upright at 600', () => {
  const css = read('src/styles/about.css');
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((x) => x[1]);
  assert.deepEqual(faces.map((f) => f.match(/font-family:\s*"([^"]+)"/)![1]), ['Inter', 'Inter Fallback', 'Inter Fallback', 'Inter Fallback']);
  const inter = faces[0];
  assert.match(inter, /font-display:\s*swap/);
  assert.match(inter, /font-weight:\s*400 700/);
  assert.match(inter, /src:\s*url\(\/fonts\/inter-400-700-latin\.woff2\) format\("woff2"\) tech\("variations"\),\s*url\(\/fonts\/inter-400-700-latin\.woff2\) format\("woff2"\);/);
  assert.equal(inter.match(/unicode-range:\s*([^;]+);/)![1].replace(/\s+/g, ''), LATIN);
  assert.doesNotMatch(css, /italic|oblique|woff2-variations/i);
  for (const f of faces) assert.match(f, /font-style:\s*normal/);
  assert.match(css, /\.ab em \{ font-style: normal; font-weight: 600; \}/);
  assert.match(css, /--font-about: "Inter", "Inter Fallback", Arial, sans-serif;/);
  // the source rules of A1 and A2: tokens only, none of the banned devices
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix\(|--shade-|--skeleton|--night|gradient|box-shadow|backdrop-filter|\bfilter:|blur\(|border-radius|background-image/i);
  assert.doesNotMatch(read('src/pages/about.astro'), /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix\(|--shade-|<img\b|<picture\b|<canvas\b|<video\b/i);
});

test('under src/, Inter is named only by about.css, the page\'s preload and comments in about.ts', () => {
  const walk = (dir: URL): URL[] => readdirSync(dir).flatMap((n) => { const u = new URL(n, dir); return statSync(u).isDirectory() ? walk(new URL(`${n}/`, dir)) : [u]; });
  const hits = walk(new URL('src/', root)).filter((u) => /\.(ts|js|mjs|astro|css|json|svg|md|txt|html)$/.test(u.pathname))
    .filter((u) => /\bInter\b|inter-400-700/.test(readFileSync(u, 'utf8'))).map((u) => u.href.slice(root.href.length)).sort();
  assert.deepEqual(hits, ['src/config/about.ts', 'src/pages/about.astro', 'src/styles/about.css']);
  const page = read('src/pages/about.astro').split('\n').filter((l) => /\bInter\b|inter-400-700/.test(l));
  assert.equal(page.length, 1); assert.match(page[0], /preloadFonts=/);
  const code = read('src/config/about.ts').replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /\bInter\b|inter-400-700/);
});

test('no unfinished-work markers or placeholder text in the new files', () => {
  const marker = new RegExp(['TO' + 'DO', 'FIX' + 'ME', 'lorem', 'ipsum', 'placeholder', 'XXX'].join('|'), 'i');
  for (const f of ['src/config/about.ts', 'src/styles/about.css', 'src/pages/about.astro', 'scripts/fonts/build-inter.py']) assert.doesNotMatch(read(f), marker, f);
});

// --- the Inter file (AC3) ---

/** the tables of a WOFF2 file (W3C WOFF2 5.1 and 5.2): the directory, then one Brotli stream of the tables in order */
function woff2(buf: Buffer): Map<string, Buffer> {
  const KNOWN = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
  assert.equal(buf.toString('latin1', 0, 4), 'wOF2');
  assert.notEqual(buf.toString('latin1', 4, 8), 'ttcf');
  const numTables = buf.readUInt16BE(12), compressed = buf.readUInt32BE(20);
  let p = 48;
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[p++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; } throw new Error('UIntBase128 too long'); };
  const dir: { tag: string; len: number }[] = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++];
    const tag = (flags & 0x3f) === 0x3f ? buf.toString('latin1', p, (p += 4)) : KNOWN[flags & 0x3f];
    const orig = base128(), version = flags >> 6;
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    dir.push({ tag, len: transformed ? base128() : orig });
  }
  const data = brotliDecompressSync(buf.subarray(p, p + compressed));
  const out = new Map<string, Buffer>();
  let q = 0;
  for (const t of dir) { out.set(t.tag, data.subarray(q, q + t.len)); q += t.len; }
  assert.equal(q, data.length, 'the stream holds exactly the tables');
  return out;
}

/** the code points a cmap maps to a glyph other than .notdef: its format 12 subtable if it has one, else format 4 */
function cmapPoints(t: Buffer): Set<number> {
  const subs = Array.from({ length: t.readUInt16BE(2) }, (_, i) => t.readUInt32BE(4 + i * 8 + 4));
  const pick = subs.find((o) => t.readUInt16BE(o) === 12) ?? subs.find((o) => t.readUInt16BE(o) === 4);
  assert.ok(pick !== undefined, 'a format 12 or 4 cmap subtable');
  const s = new Set<number>();
  if (t.readUInt16BE(pick) === 12) {
    for (let g = 0, n = t.readUInt32BE(pick + 12); g < n; g++) {
      const at = pick + 16 + g * 12, a = t.readUInt32BE(at), b = t.readUInt32BE(at + 4), gid = t.readUInt32BE(at + 8);
      for (let c = a; c <= b; c++) if (gid + (c - a) !== 0) s.add(c);
    }
    return s;
  }
  const segX2 = t.readUInt16BE(pick + 6), ends = pick + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
  for (let i = 0; i < segX2 / 2; i++) {
    const end = t.readUInt16BE(ends + 2 * i), start = t.readUInt16BE(starts + 2 * i), delta = t.readInt16BE(deltas + 2 * i), ro = t.readUInt16BE(ranges + 2 * i);
    for (let c = start; c <= end && c !== 0xffff; c++) {
      const g = ro === 0 ? (c + delta) & 0xffff : t.readUInt16BE(ranges + 2 * i + ro + 2 * (c - start));
      const gid = ro === 0 ? g : g === 0 ? 0 : (g + delta) & 0xffff;
      if (gid !== 0) s.add(c);
    }
  }
  return s;
}

const featureTags = (t: Buffer | undefined): string[] => {
  if (!t) return [];
  const fl = t.readUInt16BE(6);
  return Array.from({ length: t.readUInt16BE(fl) }, (_, i) => t.toString('latin1', fl + 2 + i * 6, fl + 6 + i * 6));
};

const pub = bytes(`public/fonts/${FONT}`);
const tables = woff2(pub);

test('the Inter file: one copy in public/fonts and docs/brand/fonts, byte for byte, at most 50,000 bytes', () => {
  assert.ok(pub.equals(bytes(`docs/brand/fonts/${FONT}`)), 'the two copies differ');
  assert.ok(pub.length <= 50_000, `${pub.length} bytes`);
});

test('the Inter file: wght 400 to 700 its one axis, the page\'s characters in LATIN, FEATS only, names 0, 13 and 14, no italic bit', () => {
  const fvar = tables.get('fvar')!;
  const axes = Array.from({ length: fvar.readUInt16BE(8) }, (_, i) => {
    const at = fvar.readUInt16BE(4) + i * fvar.readUInt16BE(10);
    return [fvar.toString('latin1', at, at + 4), fvar.readInt32BE(at + 4) / 65536, fvar.readInt32BE(at + 8) / 65536, fvar.readInt32BE(at + 12) / 65536];
  });
  assert.deepEqual(axes, [['wght', 400, 400, 700]]);
  const cps = cmapPoints(tables.get('cmap')!);
  for (const c of cps) assert.ok(latinSet.has(c), `U+${c.toString(16).toUpperCase()} is outside LATIN`);
  const text = strings().join('');
  for (const ch of new Set(text)) assert.ok(cps.has(ch.codePointAt(0)!), `the file cannot draw ${JSON.stringify(ch)}`);
  assert.ok(cps.has(0x2019) && cps.has(0x00a0));
  const tags = [...featureTags(tables.get('GSUB')), ...featureTags(tables.get('GPOS'))];
  assert.ok(tags.length > 0);
  for (const tag of tags) assert.ok(FEATS.includes(tag), `feature ${tag} is not in build.py's FEATS`);
  const name = tables.get('name')!;
  const ids = new Set(Array.from({ length: name.readUInt16BE(2) }, (_, i) => name.readUInt16BE(6 + i * 12 + 6)));
  for (const id of [0, 13, 14]) assert.ok(ids.has(id), `name record ${id}`);
  assert.equal(tables.get('head')!.readUInt16BE(44) & 2, 0, 'head.macStyle italic');
  assert.equal(tables.get('OS/2')!.readUInt16BE(62) & 1, 0, 'OS/2.fsSelection italic');
  // the build script's own report of the same file agrees on the count
  assert.match(read('scripts/fonts/manifest.txt'), new RegExp(`checks: cmap ${cps.size} code points, all in LATIN`));
});

test('the manifest: lines 1 to 37 as at 71678ed, then one ABOUT PAGE section that names this file, its source and its licence', () => {
  const m = read('scripts/fonts/manifest.txt');
  const lines = m.split('\n');
  assert.equal(sha(lines.slice(0, 37).join('\n') + '\n'), 'fdca742668f77ba77ba9bc5159b8eb54bcc7e5ea4d8db4abf209800f809f5c01', 'lines 1 to 37 moved');
  assert.equal(lines[37], '');
  assert.match(lines[38], /^== ABOUT PAGE \(the brief, 2026-11-02; exception E-About-font; outside the 120,000 byte cap of the three brand faces\)$/);
  assert.equal(m.split('\n== ').length - 1, 6, 'BYTES, METRICS, FALLBACK OVERRIDES, SECTION 2, SECTION 3 and ABOUT PAGE');
  const section = lines.slice(38).join('\n');
  const file = section.match(new RegExp(`^${FONT.replace(/\./g, '\\.')}\\s+(\\d+)\\s+[\\d.]+\\s+[\\d.]+\\s+([0-9a-f]{64})$`, 'm'))!;
  assert.ok(file, 'the file line');
  assert.equal(Number(file[1]), pub.length);
  assert.equal(file[2], sha(pub));
  // the source, pinned in the script and recorded here
  const script = read('scripts/fonts/build-inter.py');
  const src = section.match(/^source\s+Inter\[opsz,wght\]\.ttf\s+(\d+) bytes\s+sha256 ([0-9a-f]{64})\s+google\/fonts@9710da1 ofl\/inter\/Inter\[opsz,wght\]\.ttf/m)!;
  assert.ok(src, 'the source line');
  assert.ok(script.includes(`"${src[2]}"`), 'the script pins the recorded sha256');
  assert.match(script, /if got != digest:\s*\n\s*sys\.exit\(/, 'a mismatch stops the build');
  assert.match(script, /B\.SHA|9710da1eacb3be272583c3224dcb70f9da6eadbb/);
  assert.doesNotMatch(script, /\bB\.main\(|build\.main\(/, 'build.py\'s main() never runs');
  // the licence: byte for byte, named by its sha256, and no Reserved Font Name
  const ofl = bytes('docs/brand/fonts/inter-OFL.txt');
  const lic = section.match(/^licence\s+\S+\s+(\d+) bytes\s+sha256 ([0-9a-f]{64})\s+google\/fonts@9710da1 ofl\/inter\/OFL\.txt/m)!;
  assert.ok(lic, 'the licence line');
  assert.equal(Number(lic[1]), ofl.length); assert.equal(lic[2], sha(ofl));
  assert.ok(script.includes(`"${lic[2]}"`));
  const head = ofl.toString('utf8').split('This Font Software is licensed')[0];
  assert.match(head, /^Copyright 2020 The Inter Project Authors \(https:\/\/github\.com\/rsms\/inter\)/);
  assert.doesNotMatch(head, /Reserved Font Name/i);
});

test('the three Inter Fallback faces in about.css carry the manifest\'s numbers', () => {
  const m = read('scripts/fonts/manifest.txt');
  const css = read('src/styles/about.css');
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((x) => x[1]).filter((f) => /"Inter Fallback"/.test(f));
  assert.equal(faces.length, 3);
  const num = (s: string, k: string) => Number(s.match(new RegExp(`${k}[:\\s]+([\\d.]+)%`))![1]);
  for (const w of [400, 600, 700]) {
    const line = m.match(new RegExp(`^Inter Fallback ${w}: (.+)$`, 'm'))![1];
    const face = faces.find((f) => new RegExp(`font-weight:\\s*${w};`).test(f))!;
    assert.ok(face, `the ${w} face`);
    for (const k of ['size-adjust', 'ascent-override', 'descent-override', 'line-gap-override']) assert.equal(num(face, k), num(line, k), `${w} ${k}`);
    assert.match(face, w === 400 ? /src:\s*local\("Arial"\), local\("ArialMT"\);/ : /src:\s*local\("Arial Bold"\), local\("Arial-BoldMT"\);/);
  }
});
