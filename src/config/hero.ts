// Hero configuration (hero-architecture.md 3, 5.5, 8; round 3: the v11.4 scroll map). Plain data, read by the Astro
// components at build time and by the island at runtime. Inline scripts receive what they need as JSON prepended by
// their component (architecture 4.3).

/** The hero camera pose, shared by the loader's projection and the scene (window.SKREED_POSE). */
export const POSE = { cam: [0, -2.5, 24], tgt: [0, -1, 0], fov: 30, lw: 5.6, z: 0.475 } as const;

/** The pulled-back pose of the v9.9 straight pull-back (kept for reduced motion), and the moon world's fog range. */
export const MOON_POSE = { cam: [0, 3.2, 36], tgt: [0, -1.2, -6], fogNear: 60, fogFar: 430, background: '#050506' } as const;

/** The igloo intro's start pose (hero-intro/spec.md 0, as built in v10: 28.5 from the target, 46 degrees down). */
export const INTRO_POSE = { cam: [0, 20.5, 19.8], tgt: [0, 0, 0] } as const;

export interface ScrollSegment { readonly name: string; readonly screens: number }
/** The scroll map in screens (v11.2, section-2.md 13): the pull-back, then the wipe into section 2. */
export const SCROLL_MAP: readonly ScrollSegment[] = [{ name: 'pull', screens: 5.0 }, { name: 'wipe', screens: 1.0 }];

/**
 * Section 2's timings in screens (prototype template.html v11.4, `S2T`): from mid-wipe a block leaves the logo every GAP
 * screens and lands FLY screens later; a short rest; then the wipe to the Wall (W2 to W2 + WIPE).
 */
export const S2T = (() => {
  const PULL = SCROLL_MAP[0].screens, WIPE = SCROLL_MAP[1].screens, CAS0 = PULL + 0.5, GAP = 0.8, FLY = 1.8;
  const LAND = CAS0 + 9 * GAP + FLY;
  return { PULL, WIPE, CAS0, GAP, FLY, W1END: PULL + WIPE, LAND, W2: LAND + 0.7 } as const;
})();

/**
 * The pull-back path (Sam, 2026-10-11): straight back, weaving like a road, 6 units left, 6 right, then slowly back
 * left; v runs 0..1 over the pull-back and 1..2 after it. [v, x] pairs, smoothstep between them (camera/rig.ts camX).
 */
export const CAMX: readonly (readonly [number, number])[] = [[0, 0], [0.25, -6], [0.6, 6], [1.0, -3], [1.5, -5.25], [2.0, -1.5]];

/** Height of the scroll track on the 3D path, in svh (v11.2: 1820). The poster path collapses it to 100. */
export const TRACK_SVH = 1820;

/** Below this aspect (width / height) the hero frames for portrait: camera zoom, sky crop class, poster class, gem layout. */
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
