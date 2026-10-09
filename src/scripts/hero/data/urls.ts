// Hashed URLs of the island's data (hero-architecture.md 6.3). Every file is imported with ?url, so Vite emits it under
// /_astro/ with a content hash, and vite.build.assetsInlineLimit 0 keeps it out of the JS as a data: URI.
// Stage 1: the prototype's files, byte-identical (src/assets/hero/SHA256SUMS). Stage 2 adds the class variants here.
import piecesUrl from '../../../assets/hero/pieces.json?url';
import groundHUrl from '../../../assets/hero/ground_h.bin?url';
import stonesPUrl from '../../../assets/hero/stones_p.bin?url';
import stonesCUrl from '../../../assets/hero/stones_c.bin?url';
import stonesIUrl from '../../../assets/hero/stones_i.bin?url';
import skyUrl from '../../../assets/hero/sky.webp?url';
import groundUrl from '../../../assets/hero/ground_bake.webp?url';

export type SkyClass = 'portrait' | 'wide';

export const URLS = { pieces: piecesUrl, groundH: groundHUrl, stonesP: stonesPUrl, stonesC: stonesCUrl, stonesI: stonesIUrl } as const;

/** The textures for a class. Stage 1 has one sky and one ground for every class and codec. */
export function textureUrls(_cls: SkyClass, _avif: boolean): { sky: string; ground: string } {
  return { sky: skyUrl, ground: groundUrl };
}
