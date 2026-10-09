// Test hooks (hero-architecture.md 10), compiled only into dev, test and staging builds: every call site sits behind
// import.meta.env.PUBLIC_HERO_HOOKS === '1', which Vite folds away in production (scripts/guards.mjs checks dist/).
// The prototype's names are kept for the harness (template.html lines 1240 to 1256).
import { Quaternion, Vector3 } from 'three';
import { assignBlockColours } from '../logo/uniforms.ts';
import type { HeroContext } from '../types.ts';
import type { Loop } from '../loop.ts';
import type { Milestone } from './loader.ts';

let stallAt: string | null = null;

/** Holds the warm-up before the given milestone while __skreedStall(milestone) is set; __skreedStall(null) releases. */
export async function stallGate(m: Milestone): Promise<void> {
  while (stallAt === m) await new Promise((r) => setTimeout(r, 50));
}

export function installStall(): void {
  window.__skreedStall = (m: string | null) => { stallAt = m; };
}

export function installHooks(ctx: HeroContext, loop: Loop, extra: { skyClass: () => string }): void {
  const { blocks, U, logo, camA, frame, rig } = ctx;
  const st = loop.state;
  window.__skreedState = () => ({ t: st.t, ratio: st.ratio, live: +st.live.toFixed(4), cam: camA.position.toArray().map((v) => +v.toFixed(4)), th: rig.state.theta, ph: rig.state.phi, sb: st.scroll.b, mx: st.mouse.x, my: st.mouse.y, d: blocks.map((b) => +b.d.toFixed(4)) });
  window.__skreedSolo = (i: number) => { if (i < 0) return assignBlockColours(blocks, U); blocks.forEach((_b, j) => U.uBlockCol.value[j].set(j === i ? 0xffffff : 0x000000)); };
  window.__skreedFloorCheck = () => blocks.map((b, i) => {
    const off = U.uOff.value[i], q = new Quaternion(U.uQ.value[i].x, U.uQ.value[i].y, U.uQ.value[i].z, U.uQ.value[i].w);
    let minY = Infinity, worst = -Infinity;
    for (const hp of b.hull) { const v = hp.clone().applyQuaternion(q); const x = b.c.x + off.x + v.x, z = off.z + v.z, y = logo.position.y + b.c.y + off.y + v.y;
      minY = Math.min(minY, y); worst = Math.max(worst, Math.max(ctx.groundAt(x, z), ctx.stoneTopAt(x, z)) - y); }
    return { i, d: +b.d.toFixed(3), minY: +minY.toFixed(3), penetration: +worst.toFixed(3) };
  });
  window.__skreedProject = (i: number, px: number, py: number, back?: boolean) => {   // a viewBox point of block i through the module's own geometry and camera, in CSS px
    const c = blocks[i].c, l = frame.toLocal(px, py);
    const v = new Vector3(c.x + (l.x - c.x) * 0.992, c.y + (l.y - c.y) * 0.992, back ? -frame.DEPTH / 2 : frame.DEPTH / 2).applyMatrix4(logo.matrixWorld).project(camA);
    return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight];
  };
  window.__skreedParams = () => ({ ...ctx.params });
  window.__skreedLoseContext = () => { ctx.renderer.getContext().getExtension('WEBGL_lose_context')?.loseContext(); };
  window.__skreedSkyClass = extra.skyClass;
  // AC6.4: each block's glow colour as an sRGB hex (three's Color converts from the linear working space)
  window.__skreedBlockColours = () => blocks.map((_b, i) => '#' + U.uBlockCol.value[i].getHexString());
}
