// The loader bridge (hero-architecture.md 7.2): milestones to the inline loader, and the loader's cut back to the hero.
// Once the island is dead, report and __introDone are no-ops (7.3), whatever phase the loader is in.
import WT from '../../../config/loader-weights.json';
import type { Life } from './life.ts';

/** The 23 milestone names, in the order the loader expects them (the keys of loader-weights.json). */
export type Milestone = keyof typeof WT;
export const MILESTONES = Object.keys(WT) as Milestone[];

export interface LoaderBridge {
  report(m: Milestone): void;
  /** installs window.__introDone; it runs life.recover() first and does nothing once the island is dead */
  onIntroDone(cb: () => void): void;
}

export function createLoaderBridge(life: Life): LoaderBridge {
  return {
    report(m) {
      if (life.dead) return;
      if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {
        const times = (window.__skreedMilestoneTimes ||= {});
        if (!(m in times)) times[m] = performance.now();
      }
      window.__skreedLoaderReport?.(m);
    },
    onIntroDone(cb) {
      window.__introDone = () => {
        if (life.dead) return;
        if (import.meta.env.PUBLIC_HERO_HOOKS === '1') window.__skreedIntroDoneCalls = (window.__skreedIntroDoneCalls || 0) + 1;
        life.recover();
        cb();
      };
    },
  };
}
