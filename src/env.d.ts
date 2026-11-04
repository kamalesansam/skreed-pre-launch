/// <reference types="astro/client" />
// Typed window globals: the prod contract (hero-architecture.md 7.2) and the test hooks (section 10).

interface ImportMetaEnv {
  readonly PUBLIC_HERO_HOOKS?: string;
  readonly PUBLIC_TUNE?: string;
  readonly PUBLIC_STAGING?: string;
  /** section 3's gift form: on, off, or unset (on in dev, test and staging builds, off in production until its Worker exists) */
  readonly PUBLIC_LEADS?: string;
}

interface SkreedLoaderState { phase: string; mode: string; p: number; tl: number; n: number; ready: boolean; note: string; next: string | undefined }

interface SkreedLoader {
  setProgress(v: number): void;
  ready(): void;
  cut(): void;
  skip(): void;
  fail(msg: string): void;
  seek(t: number): void;
  state(): SkreedLoaderState;
  abort(): void;
  inert(on: boolean): void;
}

interface Window {
  SKREED_POSE?: { cam: readonly number[]; tgt: readonly number[]; fov: number; lw: number; z: number };
  __skreedLoaderReport?: (milestone: string) => void;
  __skreedLoader?: SkreedLoader;
  __skreedOnPoster?: (kind: 'stall' | 'offline' | 'fail', msg: string) => void;
  __introDone?: () => void;
  __heroStarted?: boolean;
  __skreedLogo?: import('./scripts/logotype/glitch.ts').LogoGlitch;
  /** the countdown's glitch on / (E-CD-glitch): its four numeral pairs as one */
  __skreedCount?: import('./scripts/logotype/glitch.ts').LogoGlitch;
  __skreedLogoQ?: [string, ...unknown[]][];
  __skreedCountV?: string[];
  __skreedTierOverride?: () => string;
  /** dev and staging: Tune's live copy of the params (src/scripts/dev/tune.ts) */
  __skreedTune?: {
    params: import('./config/params.ts').HeroParams;
    subscribe(fn: (p: import('./config/params.ts').HeroParams, key: string | null) => void): () => unknown;
    /** section 4's parameters (Tune's "Section 4" group) */
    room?: { params: import('./config/room.ts').RoomParams; subscribe(fn: (p: import('./config/room.ts').RoomParams, key: string | null) => void): () => unknown };
    /** the fog's shade hues (Tune's "Sections 2 and 3" group; config/fog-hues.ts), read live every frame */
    fog?: { params: import('./config/fog-hues.ts').FogHueParams };
  };
  /** section 4: the island hands the walk script a frame each step */
  __skreedRoomFrame?: (f: import('./config/room.ts').RoomFrame) => void;
  /** the landing page's jump to section 1 in place (scroll 0, the hero's followers snapped, section 4 reset), installed by the island; the section index's Home and a family page's Back to top (restoring the landing page) call it */
  __skreedTop?: () => void;
  /** the landing page's jump to a section in place (the page at y, the hero's followers snapped, section 4 reset, its own followers snapped too for a landing inside it), installed by the island; the section index calls it */
  __skreedJump?: (y: number) => void;
  /** section 4: the island's side of the bridge, installed with the section's director */
  __skreedRoom?: import('./config/room.ts').RoomIsland;
  /** the quiz gate (quiz-gate.md D4, amended; section-4-no-hall.md 5): whether the scenes are in (scene 1 drawable or failed, products.bin settled), and their load, installed by the island; the quiz's ride waits on it, at most 1.5 s */
  __skreedScenes?: { readonly ready: boolean; load(): Promise<unknown> };
  /** section 5 (section-5.md 5): the island's side of the bridge, installed with its jar chunk, and the frame it hands the DOM script each step */
  __skreedSignup?: import('./config/signup.ts').SignupIsland;
  __skreedSignupFrame?: (f: import('./config/signup.ts').SignupFrame) => void;
  /** hooks builds: section 4's state, a scene at rest, one step, the glue on or off, the lights and the shade (section-4-flux.md 5, "Build modes") */
  __s4?: { state(): unknown; scene(i: number): boolean; step(dir: 1 | -1): boolean; glue(on: boolean): void; lights(o: Partial<import('./scripts/hero/section4/carousel.ts').LightSetting>): import('./scripts/hero/section4/carousel.ts').LightSetting | null; shade(dark: number, height?: number, solid?: number): void; readonly ready: boolean };
  // test hooks (test and staging builds only; hero-architecture.md 10)
  __skreedFreeze?: boolean;
  /** hooks builds: while frozen, the next frame advances the clock by this many seconds once, then clears it (the flash check's step capture, one frame at a time) */
  __skreedTick?: number;
  __skreedFrame?: number;
  __skreedMilestoneTimes?: Record<string, number>;
  __skreedIntroDoneCalls?: number;
  readonly __skreedDead?: boolean;
  __skreedStall?: (milestone: string | null) => void;
  __skreedState?: () => { t: number; ratio: number; live: number; cam: number[]; th: number; ph: number; sb: number; mx: number; my: number; d: number[] };
  __skreedSolo?: (i: number) => void;
  __skreedFloorCheck?: () => { i: number; d: number; minY: number; penetration: number }[];
  __skreedProject?: (i: number, px: number, py: number, back?: boolean) => number[];
  __skreedParams?: () => Record<string, number>;
  __skreedLoseContext?: () => void;
  __skreedSkyClass?: () => string;
  __skreedBlockColours?: () => string[];
  /** v11: both scroll followers at once */
  __skreedSnap?: (v: number) => void;
  __skreedPrograms?: () => number;
  __skreedGpu?: () => { geometries: number; textures: number; programs: number };
  /** section 2's state (ready, failed, live, S, L per gem, active, labels shown) */
  __s2?: () => unknown;
  /** the intro: seek(x, t0?) pins the shot at x seconds and renders that frame; play() resumes; replay() runs it again */
  __skreedIntro?: { state(): { t: number } & Record<string, unknown>; seek(x: number, t0?: number): Record<string, unknown>; play(): void; replay(): void; skip(): void };
}
