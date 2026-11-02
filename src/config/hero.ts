// Hero configuration (hero-architecture.md 3, 5.5, 8; round 3: the v11.4 scroll map; round 4, 2026-11-02: that map halved and
// the stagger gone, section-2.md 14). Plain data, read by the Astro
// components at build time and by the island at runtime. Inline scripts receive what they need as JSON prepended by
// their component (architecture 4.3).

/** The hero camera pose, shared by the loader's projection and the scene (window.SKREED_POSE). */
export const POSE = { cam: [0, -2.5, 24], tgt: [0, -1, 0], fov: 30, lw: 5.6, z: 0.475 } as const;

/** The pulled-back pose of the v9.9 straight pull-back (kept for reduced motion), and the moon world's fog range. */
export const MOON_POSE = { cam: [0, 3.2, 36], tgt: [0, -1.2, -6], fogNear: 60, fogFar: 430, background: '#050506' } as const;

/** The igloo intro's start pose (hero-intro/spec.md 0, as built in v10: 28.5 from the target, 46 degrees down). */
export const INTRO_POSE = { cam: [0, 20.5, 19.8], tgt: [0, 0, 0] } as const;

export interface ScrollSegment { readonly name: string; readonly screens: number }
/**
 * The scroll map in screens: the pull-back, then the wipe into section 2. The pull-back is half of v11.2's 5 since
 * 2026-11-02 (Sam: "remove half of the scroll from the hero section, that's just too much scrolling"; section-2.md 14,
 * hero.md 12.8) and since 2026-11-03 covers half the camera's road at the prototype's rate (CAM_TRAVEL below; Sam: "cut
 * down the travelling of the 3d world itself into half, the scroll speed remains the same"; section-2.md 15). The wipe is
 * the prototype's one screen again (half a screen on 2026-11-02 only, which doubled its speed).
 */
export const SCROLL_MAP: readonly ScrollSegment[] = [{ name: 'pull', screens: 2.5 }, { name: 'wipe', screens: 1 }];

/**
 * Section 2's timings in screens (round 4, Sam, 2026-11-02: "all the blocks from the logo will disperse and align itself in
 * one single go at a time, at the same time"): from mid-wipe (CAS0) every block leaves the logo at once and lands FLY
 * screens later (LAND); a short rest; then the wipe to section 3 (W2 to W2END). The v11.4 prototype's stagger (a block
 * every GAP 0.8 screens, the last landing 7.2 screens after the first) is gone, not set to zero: there is no GAP.
 */
export const S2T = (() => {
  const PULL = SCROLL_MAP[0].screens, WIPE = SCROLL_MAP[1].screens, CAS0 = PULL + WIPE / 2, FLY = 1.8;
  const LAND = CAS0 + FLY, W2 = LAND + 0.7;
  return { PULL, WIPE, CAS0, FLY, W1END: PULL + WIPE, LAND, W2, W2END: W2 + WIPE } as const;
})();

/** The pinned v11.4 prototype's map (tests/fixtures/hero-v11.4/template.html: PULL 5, S2T.LAND 14.5), whose rates per screen the world keeps. */
export const PROTO_MAP = { PULL: 5, LAND: 14.5 } as const;

/**
 * The camera's road (CAMX, camCurve) runs in a parameter v: 0..1 over the prototype's pull-back and 1..2 over its drift
 * after it, through the wipe and the flights. Since 2026-11-03 the port's pull-back covers CAM_TRAVEL of the road (0.5:
 * half the travel, at the prototype's rate of a fifth of the road per screen) and the drift after it goes on at the
 * prototype's rate for the screens it has (CAM_DRIFT = (LAND - PULL) / 9.5), so v = CAM_TRAVEL x s + CAM_DRIFT x u2
 * (camera/rig.ts). Sam, 2026-11-03: "cut down the travelling of the 3d world itself into half, the scroll speed remains
 * the same" (section-2.md 15). On 2026-11-02 the whole road ran over the halved scroll, twice as fast.
 */
export const CAM_TRAVEL = S2T.PULL / PROTO_MAP.PULL;
export const CAM_DRIFT = (S2T.LAND - S2T.PULL) / (PROTO_MAP.LAND - PROTO_MAP.PULL);

/**
 * The pull-back path (Sam, 2026-10-11): straight back, weaving like a road, 6 units left, 6 right, then slowly back
 * left; v runs 0..1 over the prototype's pull-back and 1..2 after it (the port's pull-back reaches CAM_TRAVEL, 0.5: left
 * to -6 and back across to +4.26, camX(0.5) on the quintic ease between the keys at 0.25 and 0.6). [v, x] pairs, smoothstep between them (camera/rig.ts camX).
 */
export const CAMX: readonly (readonly [number, number])[] = [[0, 0], [0.25, -6], [0.6, 6], [1.0, -3], [1.5, -5.25], [2.0, -1.5]];

/**
 * Height of the scroll track on the 3D path, in svh: the second wipe's end plus the one screen in which section 3 rises
 * (docs/specs/quiz.md D8: the quiz rises the moment the second wipe has crossed the screen). 750 since 2026-11-03 (675 on
 * 2026-11-02, 1720 from section 3, 1820 in v11.2). The poster path collapses it to 100; shell.css carries the literal, kept equal by unit test.
 */
export const TRACK_SVH = Math.round((S2T.W2END + 1) * 100);

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
