// The redesign's pictures at build time (docs/specs/redesign.md D9): the index scripts/redesign/encode-pictures.mjs
// writes and the hashed URL of every encoded file. The folder is git-ignored (Sam's design's photographs, out of the
// public repository until he says otherwise), so a checkout without it fails here with the two commands that make it.
interface Entry { width: number; height: number; widths: number[]; alpha: boolean; shade?: string; name?: string; hex?: string }

const indexes = import.meta.glob<{ default: Record<string, Entry> }>('../../assets/redesign/index.json', { eager: true });
const urls = import.meta.glob<string>('../../assets/redesign/*.{avif,webp}', { query: '?url', import: 'default', eager: true });
const index = Object.values(indexes)[0]?.default;
if (!index) {
  throw new Error('The redesign\'s pictures are not on this machine. Run: python3 -I scripts/redesign/extract-pdf.py "<path to Skreed Pre-Launch.pdf>" && node scripts/redesign/encode-pictures.mjs');
}

export interface RdPictureData { avif: string; webp: string; src: string; width: number; height: number; alpha: boolean; entry: Entry }

function url(name: string, w: number, ext: 'avif' | 'webp'): string {
  const u = urls[`../../assets/redesign/${name}-${w}.${ext}`];
  if (!u) throw new Error(`redesign pictures: ${name}-${w}.${ext} is missing; run node scripts/redesign/encode-pictures.mjs`);
  return u;
}

/** the srcsets and the fallback of one picture, by its name in the index */
export function rdPicture(name: string): RdPictureData {
  const e = index![name];
  if (!e) throw new Error(`redesign pictures: no picture named ${name}`);
  const set = (ext: 'avif' | 'webp') => e.widths.map((w) => `${url(name, w, ext)} ${w}w`).join(', ');
  return { avif: set('avif'), webp: set('webp'), src: url(name, e.widths[e.widths.length - 1]!, 'webp'), width: e.width, height: e.height, alpha: e.alpha, entry: e };
}

/** every picture whose name starts with a prefix (the twelve cases, the picker's five), in the index's order */
export function rdPictures(prefix: string): { name: string; data: RdPictureData }[] {
  return Object.keys(index!).filter((n) => n.startsWith(prefix)).map((name) => ({ name, data: rdPicture(name) }));
}
