// Section 4's garden as the world takes it (docs/specs/section-4-world.md 3 "The garden", 5 "Loading, in phases", 2):
// garden.json's placing (scripts/room/garden.py and encode.mjs write it) and its images' URLs, AVIF or WebP as the
// island picked at boot, the plate first and then the cards in garden.json's order. The director imports this file
// with the world's chunk, once past the third wipe, so neither the JSON nor the URLs sit in the director's chunk.
import { S, camera, cards, plate, sun } from '../../../assets/room/garden/garden.json';
import type { GardenSpec } from './world.ts';

const files = import.meta.glob<string>('../../../assets/room/garden/*.{avif,webp}', { eager: true, query: '?url', import: 'default' });
const url = (stem: string, avif: boolean) => files[`../../../assets/room/garden/${stem}.${avif ? 'avif' : 'webp'}`];

/** the garden for createWorld, or null where an image is missing (the rings then fly over Urban Slate, E-S4-garden's default) */
export function gardenSpec(avif: boolean): GardenSpec | null {
  const p = url(plate.file, avif), c = cards.map((k) => url(k.file, avif));
  if (!p || c.some((x) => !x)) return null;
  return { json: { S, camera, sun, plate, cards }, plate: p, cards: c as string[] };
}
