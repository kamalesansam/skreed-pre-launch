// Hero configuration (hero-architecture.md 3, 5.5, 8). Plain data, read by the Astro components at build time and by the
// island at runtime. Inline scripts receive what they need as JSON prepended by their component (architecture 4.3).

/** The hero camera pose, shared by the loader's projection and the scene (window.SKREED_POSE). */
export const POSE = { cam: [0, -2.5, 24], tgt: [0, -1, 0], fov: 30, lw: 5.6, z: 0.475 } as const;

/** The pulled-back pose at the end of the pull-back, and the moon world's fog range. */
export const MOON_POSE = { cam: [0, 3.2, 36], tgt: [0, -1.2, -6], fogNear: 60, fogFar: 430, background: '#050506' } as const;

export interface ScrollSegment { readonly name: string; readonly screens: number }
/** The scroll map in screens: the pull-back, then the wipe. Section 2 appends its own segments (architecture 11.2). */
export const SCROLL_MAP: readonly ScrollSegment[] = [{ name: 'pull', screens: 1.5 }, { name: 'wipe', screens: 1.0 }];

/** Height of the scroll track on the 3D path, in svh (v9.9). The poster path collapses it to 100. */
export const TRACK_SVH = 460;

/** Below this aspect (width / height) the hero frames for portrait: camera zoom, sky crop class, poster class, swatch columns. */
export const PORTRAIT_ASPECT = 0.9;

/** Canvas pixel-ratio caps. */
export const DPR_CAP = { touch: 1.25, fine: 1.5 } as const;

export type Tier = 'poster' | 'still3d' | 'hero3d';

/**
 * What prefers-reduced-motion gets (hero spec D2). 'poster' is the default and downloads no island; 'still3d' is the
 * prototype's own frozen 3D. Pending Sam's choice; the default ships until he decides.
 */
export const REDUCED_MOTION_TIER: 'poster' | 'still3d' = 'poster';

/** The head Gate's rules (architecture 8), serialised into the inline script as CFG. */
export const GATE = { reducedTier: REDUCED_MOTION_TIER, minMemory: 2, slowTypes: ['slow-2g', '2g'] } as const;

/** A WebGL renderer string that names a software rasteriser sends boot.ts to the poster (spec D3). */
export const SOFTWARE_GL = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i;

/** The poster's aspect classes (architecture 4.5): wide is aspect 0.9 or more, portrait is the complement. */
export const POSTER_MEDIA = { wide: '(min-aspect-ratio: 9/10)', portrait: 'not all and (min-aspect-ratio: 9/10)' } as const;

/**
 * How the island decodes its textures (spec D8): 'bitmap' (ImageBitmapLoader, off the main thread) is kept only if the
 * stage 1 rest frames are identical to 'image' (the prototype's TextureLoader). Decided in build step 8; test and
 * staging builds can force either with ?texpath=image|bitmap.
 */
export const TEXTURE_PATH: 'bitmap' | 'image' = 'bitmap';
