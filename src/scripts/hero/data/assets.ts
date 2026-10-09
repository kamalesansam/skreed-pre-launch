// The island's data prefetch (hero-architecture.md 6.3, 7.1): boot.ts starts it once the poster has decoded, in parallel
// with import('./hero/hero.ts'), and startHero awaits the promises where the prototype decoded base64 (start-up steps 1
// and 9). No three.js here, so the boot chunk stays small.
import { URLS, type SkyClass } from './urls.ts';
import { fetchBin, fetchJSON } from './bins.ts';

export interface Piece { nb: number; v: [number, number][]; t: number[] }
export interface Pieces { viewBox: [number, number]; variants: Record<string, { anchors: [number, number][]; pieces: Piece[] }> }

export interface HeroData {
  cls: SkyClass;
  avif: boolean;
  pieces: Promise<Pieces>;
  groundH: Promise<ArrayBuffer>;
  stonesP: Promise<ArrayBuffer>;
  stonesC: Promise<ArrayBuffer>;
  stonesI: Promise<ArrayBuffer>;
}

export function prefetchHeroData(cls: SkyClass, avif: boolean): HeroData {
  return {
    cls, avif,
    pieces: fetchJSON<Pieces>(URLS.pieces),
    groundH: fetchBin(URLS.groundH),
    stonesP: fetchBin(URLS.stonesP),
    stonesC: fetchBin(URLS.stonesC),
    stonesI: fetchBin(URLS.stonesI),
  };
}

/** Every pending fetch of the prefetch, for the boot's failure routing. */
export const dataPromises = (d: HeroData): Promise<unknown>[] => [d.pieces, d.groundH, d.stonesP, d.stonesC, d.stonesI];
