/// <reference types="astro/client" />
// Typed window globals: the prod contract (hero-architecture.md 7.2) and the test hooks (section 10).

interface ImportMetaEnv {
  readonly PUBLIC_HERO_HOOKS?: string;
  readonly PUBLIC_TUNE?: string;
  readonly PUBLIC_STAGING?: string;
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
  __skreedLogoQ?: [string, ...unknown[]][];
  __skreedCountV?: string[];
  __skreedTierOverride?: () => string;
  // test hooks (test and staging builds only)
  __skreedFreeze?: boolean;
  __skreedFrame?: number;
}
