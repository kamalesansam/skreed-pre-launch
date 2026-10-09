// The one source of the motion flags (hero spec D6). The scene reads them once at start, as the prototype does; the
// logotype glitch reads the live list before every burst. Later sections that load GSAP wrap gsap.matchMedia() here.
export const reducedMQ: MediaQueryList = matchMedia('(prefers-reduced-motion: reduce)');
export const hoverNoneMQ: MediaQueryList = matchMedia('(hover: none)');

/** Reduced motion for the scene: the OS setting, or the still3d tier the Gate chose. Read once. */
export function sceneReduced(): boolean {
  return reducedMQ.matches || document.documentElement.classList.contains('still3d');
}
