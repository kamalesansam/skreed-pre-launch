// The moon floor (prototype lines 600 to 687): the bake's grid (rows packed densely near the camera, widening with
// distance), the baked light from Blender, and igloo's surface character in our own shader code: the tone curve with
// Sam's locked terrain values, the crumb grain and the ground mist. groundAt() is the floor height at a world (x, z).
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, type Texture, type WebGLProgramParametersWithUniforms } from 'three';
import { GROUND_FRAG_COMMON, GROUND_FRAG_MAP, GROUND_VERT_COMMON, GROUND_VERT_PROJECT } from './shaders.ts';
import type { FogUniforms } from './fog.ts';
import type { HeroParams } from '../../../config/params.ts';

export interface MoonMeta {
  ground: { nr: number; nc: number; zmin: number; zmax: number };
  stones: { verts: number; tris: number; idx: string; lo: number[]; hi: number[] };
}

/** An onBeforeCompile step a slot adds after the base patch (the v10 intro's colour patch); its key joins the cache key. */
export interface ShaderPatch { key: string; apply(sh: WebGLProgramParametersWithUniforms): void }

export interface Ground { mesh: Mesh<BufferGeometry, MeshBasicMaterial>; material: MeshBasicMaterial; groundAt(x: number, z: number): number }

/** FOG is read when the program compiles (the warm-up): the uniforms are made after the ground, at start-up step 11. */
export function createGround(o: { meta: MoonMeta; heights: ArrayBuffer; tex: Texture; FOG: () => FogUniforms; P: HeroParams; patches?: ShaderPatch[] }): Ground {
  const { nr, nc, zmin, zmax } = o.meta.ground, P = o.P, patches = o.patches ?? [];
  const hq = new Uint16Array(o.heights);
  const pos = new Float32Array(nr * nc * 3), uv = new Float32Array(nr * nc * 2), idx = new Uint32Array((nr - 1) * (nc - 1) * 6);
  for (let r = 0; r < nr; r++) {
    const PY = -30 + 450 * Math.pow(1 - r / (nr - 1), 2.2), halfW = 34 + 1.25 * (PY + 30);
    for (let c = 0; c < nc; c++) {
      const k = r * nc + c;
      pos[k * 3] = (-1 + 2 * c / (nc - 1)) * halfW; pos[k * 3 + 1] = zmin + hq[k] / 65535 * (zmax - zmin); pos[k * 3 + 2] = -PY;
      uv[k * 2] = c / (nc - 1); uv[k * 2 + 1] = 1 - r / (nr - 1);
    }
  }
  let j = 0;
  for (let r = 0; r < nr - 1; r++) for (let c = 0; c < nc - 1; c++) {
    const a = r * nc + c, b = a + nc, d = a + 1, e = b + 1;
    idx[j++] = a; idx[j++] = b; idx[j++] = e; idx[j++] = a; idx[j++] = e; idx[j++] = d;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('uv', new BufferAttribute(uv, 2)); g.setIndex(new BufferAttribute(idx, 1));
  const material = new MeshBasicMaterial({ map: o.tex, side: DoubleSide, fog: true, toneMapped: false });
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, o.FOG(), { uCrumb: { get value() { return P.crumb; } }, uCrumbSize: { get value() { return P.crumbSize; } }, uGExp: { get value() { return P.gExp; } }, uGGamma: { get value() { return P.gGamma; } }, uGNear: { get value() { return P.gNear; } }, uGToe: { get value() { return P.gToe; } } });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', GROUND_VERT_COMMON)
      .replace('#include <project_vertex>', GROUND_VERT_PROJECT);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', GROUND_FRAG_COMMON)
      .replace('#include <map_fragment>', GROUND_FRAG_MAP);
    for (const p of patches) p.apply(sh);
  };
  // three keys programs on onBeforeCompile.toString(), and minified closures can collide: name it (architecture 5.1)
  material.customProgramCacheKey = () => ['skreed-ground', ...patches.map((p) => p.key)].join('|');
  const mesh = new Mesh(g, material);
  mesh.frustumCulled = false;
  // height of the floor at a world (x, z), from the same grid: the blocks use it so they never sink into the ground
  const groundAt = (x: number, z: number) => {
    const PY = Math.max(-30, -z), rr = (1 - Math.pow((PY + 30) / 450, 1 / 2.2)) * (nr - 1);
    const cc = Math.min(nc - 1, Math.max(0, (x / (34 + 1.25 * (PY + 30)) + 1) / 2 * (nc - 1)));
    const r0 = Math.min(nr - 2, Math.floor(rr)), c0 = Math.min(nc - 2, Math.floor(cc)), fr = rr - r0, fc = cc - c0;
    const H = (r: number, c: number) => zmin + hq[r * nc + c] / 65535 * (zmax - zmin);
    return (H(r0, c0) * (1 - fc) + H(r0, c0 + 1) * fc) * (1 - fr) + (H(r0 + 1, c0) * (1 - fc) + H(r0 + 1, c0 + 1) * fc) * fr;
  };
  return { mesh, material, groundAt };
}
