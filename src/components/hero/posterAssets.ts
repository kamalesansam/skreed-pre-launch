// The four poster files (hero-architecture.md 4.5 and 6.4), imported with ?url so Vite emits them hashed under /_astro/.
// Shared by HeroPoster (the <picture>) and HeroPosterPreload (the two AVIF preloads), so the URLs can never differ.
import wideAvif from '../../assets/hero/poster/wide.avif?url';
import wideWebp from '../../assets/hero/poster/wide.webp?url';
import portraitAvif from '../../assets/hero/poster/portrait.avif?url';
import portraitWebp from '../../assets/hero/poster/portrait.webp?url';
import { POSTER_MEDIA } from '../../config/hero.ts';

export const POSTER = {
  wide: { avif: wideAvif, webp: wideWebp, width: 1920, height: 1200, media: POSTER_MEDIA.wide },
  portrait: { avif: portraitAvif, webp: portraitWebp, width: 488, height: 1056, media: POSTER_MEDIA.portrait },
} as const;
