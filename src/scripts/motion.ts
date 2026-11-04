// The one source of the motion flags (hero spec D6). The scene reads them once at start, as the prototype does; the
// logotype glitch reads the live list before every burst. Later sections that load GSAP wrap gsap.matchMedia() here.
// Reduce motion is not honoured since 2026-11-04 (HONOUR_REDUCED_MOTION, E-3D-only): the list is 'not all', which never matches.
import { HONOUR_REDUCED_MOTION } from '../config/hero.ts';

export const reducedMQ: MediaQueryList = matchMedia(HONOUR_REDUCED_MOTION ? '(prefers-reduced-motion: reduce)' : 'not all');
export const hoverNoneMQ: MediaQueryList = matchMedia('(hover: none)');

/** Reduced motion for the scene: the OS setting, or the still3d tier the Gate chose. Read once. */
export function sceneReduced(): boolean {
  return reducedMQ.matches || document.documentElement.classList.contains('still3d');
}
