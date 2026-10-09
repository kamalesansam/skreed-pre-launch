// Per-frame block motion (prototype lines 1297 to 1330; frame step F8): igloo's breath and push, two followers, a move
// along the centroid vector, a small three-axis spin, and the floor clearance against the snow and the stones.
// groundAt and stoneTopAt arrive as functions, so this module imports nothing of the world (no cycle).
import { Quaternion, Vector3 } from 'three';
import { fit, lerpFPS, smoothstep } from '../util/math.ts';
import type { HeroParams } from '../../../config/params.ts';
import type { Block } from './geometry.ts';
import type { LogoUniforms } from './uniforms.ts';

export interface BlockFrame {
  t: number; ratio: number; live: number; heroOn: number;
  mouse: { x: number; y: number };
  logoY: number;
  /** the moon world is shown and its floor is known: clear the blocks above it */
  floor: boolean;
  groundAt: (x: number, z: number) => number;
  stoneTopAt: (x: number, z: number) => number;
}

const tmpQ = new Quaternion(), ax = [new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0)];
const dir = new Vector3(), _hv = new Vector3();

export function updateBlocks(blocks: Block[], U: LogoUniforms, P: HeroParams, f: BlockFrame): void {
  const { t, ratio, live, heroOn, mouse } = f;
  blocks.forEach((b, i) => {
    let l = 0.4;
    l *= Math.sin(-t * 2 + b.c.x) * 0.5 + 0.5;
    l *= Math.cos(-t) * 0.5 + 0.5;
    l *= 0.5 + 1.5 * b.rand.z;
    l *= 0.5 * P.breath * live;
    const c = Math.sin(t + b.rand.x * 12.342) * b.rand.y;
    const dist = Math.hypot(b.c.x - mouse.x, b.c.y - mouse.y);
    const h = fit(smoothstep(P.r0, P.r1, dist), 0, 1, P.push + P.wob * c, 0);
    l = Math.max(0, Math.max(l, h * heroOn * live));
    b.t1 = l; b.t2 = lerpFPS(b.t2, b.t1, P.follow, ratio); b.d = lerpFPS(b.d, b.t2, P.follow, ratio);
    dir.set(b.c.x, b.c.y, P.lift);
    U.uOff.value[i].copy(dir).multiplyScalar(b.d);
    b.q.identity();
    b.q.multiply(tmpQ.setFromAxisAngle(ax[0], Math.cos(b.d * 2 + b.rand.z * 30) * b.d * 0.5));
    b.q.multiply(tmpQ.setFromAxisAngle(ax[1], Math.cos(b.d * 2 + b.rand.x * 30) * b.d * 0.5));
    b.q.multiply(tmpQ.setFromAxisAngle(ax[2], Math.cos(b.d * 2 + b.rand.y * 30) * b.d * 0.5));
    // keep every block above the ground: if its lowest corner would dip below the floor (plus a little clearance),
    // lift it back up and send the lost downward motion towards the camera instead, so the push still reads
    if (f.floor) {
      const off = U.uOff.value[i]; let minY = Infinity, lx = 0, lz = 0;
      for (const hp of b.hull) {
        _hv.copy(hp).applyQuaternion(b.q);
        const y = f.logoY + b.c.y + off.y + _hv.y;
        if (y < minY) { minY = y; lx = b.c.x + off.x + _hv.x; lz = off.z + _hv.z; }
      }
      let floor = Math.max(f.groundAt(lx, lz), f.groundAt(b.c.x + off.x, off.z));
      for (const hp of b.hull) { _hv.copy(hp).applyQuaternion(b.q); floor = Math.max(floor, f.stoneTopAt(b.c.x + off.x + _hv.x, off.z + _hv.z)); }
      floor += P.clear;
      if (minY < floor) { const dy = floor - minY; off.y += dy; off.z += dy * 0.6; }
    }
    U.uQ.value[i].set(b.q.x, b.q.y, b.q.z, b.q.w); U.uD.value[i] = b.d;
  });
}
