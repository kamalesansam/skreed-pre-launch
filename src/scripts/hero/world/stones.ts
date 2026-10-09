// The 70 stones (prototype lines 688 to 710): quantised positions, baked colours (sRGB bytes, converted to linear here),
// and the stone tops around the logo on a 0.15-unit grid (dilated 2 cells), so pushed blocks clear the stones as well.
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial } from 'three';
import type { MoonMeta, ShaderPatch } from './ground.ts';

export interface Stones { mesh: Mesh<BufferGeometry, MeshBasicMaterial>; material: MeshBasicMaterial; stoneTopAt(x: number, z: number): number }

export function createStones(o: { meta: MoonMeta; p: ArrayBuffer; c: ArrayBuffer; i: ArrayBuffer; patches?: ShaderPatch[] }): Stones {
  const S = o.meta.stones, patches = o.patches ?? [];
  const pq = new Int16Array(o.p), cq = new Uint8Array(o.c);
  const iq = S.idx === 'u16' ? new Uint16Array(o.i) : new Uint32Array(o.i);
  const lut = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  const pos = new Float32Array(S.verts * 3), col = new Float32Array(S.verts * 3);
  for (let i = 0; i < S.verts * 3; i++) { const a = i % 3; pos[i] = S.lo[a] + (pq[i] + 32768) / 65535 * (S.hi[a] - S.lo[a]); col[i] = lut[cq[i]]; }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('color', new BufferAttribute(col, 3)); g.setIndex(new BufferAttribute(iq, 1));
  const SG = { x0: -9, z0: -6, n: 120, m: 100, cell: 0.15 }, top = new Float32Array(SG.n * SG.m).fill(-Infinity);
  for (let i = 0; i < S.verts; i++) {
    const gx = Math.floor((pos[i * 3] - SG.x0) / SG.cell), gz = Math.floor((pos[i * 3 + 2] - SG.z0) / SG.cell);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const a = gx + dx, b = gz + dz; if (a < 0 || b < 0 || a >= SG.n || b >= SG.m) continue;
      const k = b * SG.n + a; if (pos[i * 3 + 1] > top[k]) top[k] = pos[i * 3 + 1];
    }
  }
  const stoneTopAt = (x: number, z: number) => { const a = Math.floor((x - SG.x0) / SG.cell), b = Math.floor((z - SG.z0) / SG.cell); return (a < 0 || b < 0 || a >= SG.n || b >= SG.m) ? -Infinity : top[b * SG.n + a]; };
  const material = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, fog: true, toneMapped: false });
  if (patches.length) {
    material.onBeforeCompile = (sh) => { for (const p of patches) p.apply(sh); };
    material.customProgramCacheKey = () => ['skreed-stones', ...patches.map((p) => p.key)].join('|');
  }
  const mesh = new Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh, material, stoneTopAt };
}
