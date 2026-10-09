// The family pages' data (docs/specs/family-page.md 2.1). Build time only: the Astro route and the unit tests import it;
// nothing here ships to the browser except what a page inlines. Every number is derived from docs/data/shades-240.json
// and src/data/family-keys.json (the section 2 key shades), never typed by hand.
import raw from '../../../docs/data/shades-240.json' with { type: 'json' };
import keysRaw from '../../data/family-keys.json' with { type: 'json' };
import { PEARL_WHISPER, URBAN_SLATE } from '../../config/tokens.ts';

export interface RawShade { readonly id: string; readonly index: number; readonly name: string; readonly hex: string }
export interface RawFamily { readonly id: string; readonly name: string; readonly shades: readonly RawShade[] }
export interface RawData { readonly families: readonly RawFamily[] }
export interface RawKey { readonly family: string; readonly familyName: string; readonly shade: string; readonly name: string; readonly hex: string; readonly index: number; readonly n: number }

export type Neutral = 'pearl' | 'slate';

export interface FamShade {
  readonly id: string;        // frosty-whites-07
  readonly index: number;     // 1 to 24, in the family
  readonly name: string;
  readonly hex: string;
  readonly n: number;         // catalog number, 1 to 240
  readonly nnn: string;       // "007"
  readonly low: boolean;      // WCAG contrast against the page neutral under 1.5:1 (gets a 1 px ring, spec 2.6)
}

export interface Family {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly ordinal: number;   // 1 to 10, catalog order
  readonly first: number;     // catalog number of index 1
  readonly shades: readonly FamShade[];
  readonly key: FamShade;     // the section 2 rock's shade, the default selection
  readonly neutral: Neutral;  // the stage neutral (spec 2.1): the higher median contrast against the 24 hexes
}

export const FAMILY_COUNT = 10;
export const PER_FAMILY = 24;
const SLUG = /^[a-z]+(-[a-z]+)*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Three digits, the format the section 2 labels and the reserve link use: 32 to "032". */
export const nnn = (n: number): string => String(n).padStart(3, '0');

/** WCAG 2 relative luminance of an sRGB hex. */
export function luminance(hex: string): number {
  const v = parseInt(hex.slice(1), 16);
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG 2 contrast ratio of two hexes. */
export function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const median = (xs: number[]): number => { const s = [...xs].sort((p, q) => p - q); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export const NEUTRAL_HEX: Record<Neutral, string> = { pearl: PEARL_WHISPER, slate: URBAN_SLATE };
/** Swatches under this contrast against the page neutral get a 1 px ring in the page foreground (spec 2.6). */
export const LOW_CONTRAST = 1.5;

/**
 * Validates the data and derives the ten families. Throws (so `astro build` fails) when there are not exactly 10
 * families, a family has other than 24 shades, a shade name repeats inside a family, an id is not URL-safe, a hex is
 * malformed, or the key shades of section 2 disagree with the data.
 */
export function buildFamilies(data: RawData, keys: readonly RawKey[]): Family[] {
  const fail = (msg: string): never => { throw new Error(`family pages: ${msg}`); };
  if (!Array.isArray(data.families) || data.families.length !== FAMILY_COUNT) fail(`expected ${FAMILY_COUNT} families, found ${data.families?.length}`);
  if (!Array.isArray(keys) || keys.length !== FAMILY_COUNT) fail(`expected ${FAMILY_COUNT} key shades in src/data/family-keys.json`);
  const slugs = new Set<string>();
  return data.families.map((f, fi) => {
    if (!SLUG.test(f.id)) fail(`family id is not URL-safe: ${f.id}`);
    if (slugs.has(f.id)) fail(`family id repeats: ${f.id}`);
    slugs.add(f.id);
    if (!f.name || typeof f.name !== 'string') fail(`${f.id} has no display name`);
    if (!Array.isArray(f.shades) || f.shades.length !== PER_FAMILY) fail(`${f.id} has ${f.shades?.length} shades, not ${PER_FAMILY}`);
    const names = new Set<string>();
    const pre = f.shades.map((s, si) => {
      if (s.index !== si + 1) fail(`${s.id} is out of catalog order`);
      if (s.id !== `${f.id}-${String(si + 1).padStart(2, '0')}`) fail(`unexpected shade id ${s.id}`);
      if (!HEX.test(s.hex)) fail(`${s.id} hex is not #rrggbb: ${s.hex}`);
      if (!s.name) fail(`${s.id} has no name`);
      if (names.has(s.name)) fail(`the name ${s.name} repeats inside ${f.id}`);
      names.add(s.name);
      return { id: s.id, index: s.index, name: s.name, hex: s.hex.toLowerCase(), n: fi * PER_FAMILY + s.index };
    });
    const mp = median(pre.map((s) => contrast(s.hex, PEARL_WHISPER)));
    const ms = median(pre.map((s) => contrast(s.hex, URBAN_SLATE)));
    const neutral: Neutral = mp >= ms ? 'pearl' : 'slate';
    const bg = NEUTRAL_HEX[neutral];
    const shades: FamShade[] = pre.map((s) => ({ ...s, nnn: nnn(s.n), low: contrast(s.hex, bg) < LOW_CONTRAST }));
    const k = keys[fi];
    if (k.family !== f.id) fail(`key shade ${fi + 1} belongs to ${k.family}, expected ${f.id}`);
    const key = shades.find((s) => s.id === k.shade);
    if (!key) return fail(`key shade ${k.shade} is not in ${f.id}`);
    if (key.name !== k.name || key.hex !== k.hex.toLowerCase() || key.n !== k.n || key.index !== k.index) fail(`key shade ${k.shade} disagrees with the data; run npm run gen:shades`);
    if (k.familyName !== f.name) fail(`key shade family name ${k.familyName} is not ${f.name}`);
    return { id: f.id, slug: f.id, name: f.name, ordinal: fi + 1, first: fi * PER_FAMILY + 1, shades, key, neutral };
  });
}

export const FAMILIES: readonly Family[] = buildFamilies(raw as RawData, keysRaw as RawKey[]);

/** The CSS custom property of a shade, from src/styles/shades.gen.css (DESIGN.md: --shade-<id>). */
export const shadeVar = (s: { id: string }): string => `var(--shade-${s.id})`;

/** The family a catalog number belongs to (1 to 240). */
export const familyOf = (n: number): Family => FAMILIES[Math.floor((n - 1) / PER_FAMILY)];

/** The selection link a rock or the switcher uses: /shades/{slug}/?shade={NNN}. */
export const familyHref = (f: Family, withShade = false): string => `/shades/${f.slug}/${withShade ? `?shade=${f.key.nnn}` : ''}`;

/** "02" for the eyebrow. */
export const ordinal2 = (f: Family): string => String(f.ordinal).padStart(2, '0');

/**
 * The page's own stylesheet (spec 2.1, 2.6, 5 "First paint"): the page neutral, one colour rule per swatch the page
 * shows (its 24 plus the switcher's 10 key shades), and the selection rules keyed on html[data-shade], so every
 * selected marker is right at first paint, deep link included, before any module runs. No hex is written: every
 * colour is a token from shades.gen.css or tokens.css. Emitted as one inline <style> per page (hashed by csp.mjs).
 */
export function pageCss(f: Family, all: readonly Family[] = FAMILIES): string {
  const slate = f.neutral === 'slate';
  const out: string[] = [];
  // html:root outranks the :root rules of tokens.css, which the bundle emits after this <style>
  out.push(`html:root{color-scheme:${slate ? 'dark' : 'light'};--bg:var(${slate ? '--urban-slate' : '--pearl-whisper'});--fg:var(${slate ? '--pearl-whisper' : '--urban-slate'});` +
    (slate ? '--skeleton:color-mix(in srgb,var(--pearl-whisper) 12%,var(--urban-slate));' : '') +
    `--k:${f.key.index - 1};--shade:${shadeVar(f.key)};--ring:${f.key.low ? 'var(--fg)' : 'transparent'}}`);
  const seen = new Set<string>();
  const sw = (s: FamShade) => { if (seen.has(s.nnn)) return; seen.add(s.nnn); out.push(`[data-s="${s.nnn}"]{--sw:${shadeVar(s)}${s.low ? ';--swr:var(--fg)' : ''}}`); };
  f.shades.forEach(sw);
  all.forEach((g) => sw({ ...g.key, low: contrast(g.key.hex, NEUTRAL_HEX[f.neutral]) < LOW_CONTRAST }));
  f.shades.forEach((s, i) => out.push(`html[data-shade="${s.nnn}"]{--k:${i};--shade:${shadeVar(s)};--ring:${s.low ? 'var(--fg)' : 'transparent'}}`));
  // the selected grid swatch: the key shade when no script ran, otherwise html[data-shade]
  const sel = [`html:not([data-shade]) .gsw[data-s="${f.key.nnn}"]`, ...f.shades.map((s) => `html[data-shade="${s.nnn}"] .gsw[data-s="${s.nnn}"]`)];
  out.push(`${sel.join(',')}{--on:var(--fg)}`);
  return out.join('\n');
}
