// The island's life (hero-architecture.md 5.1, 7.3): one kill switch for every hard failure. kill() runs every disposer
// the island registered, once; check() throws after it, so startHero stops at its next await. recover() runs the
// soft-poster recovery hooks (the loader's poster state lifted into the hero after all).

export class IslandDead extends Error {
  constructor(reason: string) { super('hero island stopped: ' + reason); this.name = 'IslandDead'; }
}

export interface Life {
  readonly dead: boolean;
  readonly reason: string;
  kill(reason: string): void;
  onKill(fn: () => void): void;
  onRecover(fn: () => void): void;
  recover(): void;
  check(): void;
}

export function createLife(): Life {
  let dead = false, reason = '';
  const kills: (() => void)[] = [];
  const recovers: (() => void)[] = [];
  return {
    get dead() { return dead; },
    get reason() { return reason; },
    kill(r) {
      if (dead) return;
      dead = true; reason = r;
      for (const fn of kills.splice(0).reverse()) { try { fn(); } catch (e) { console.warn('[hero] dispose', e); } }
    },
    onKill(fn) { if (dead) fn(); else kills.push(fn); },
    onRecover(fn) { recovers.push(fn); },
    recover() { if (dead) return; for (const fn of recovers.splice(0)) fn(); },
    check() { if (dead) throw new IslandDead(reason); },
  };
}
