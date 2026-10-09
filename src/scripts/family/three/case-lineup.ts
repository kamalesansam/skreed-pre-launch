// 24 cases from one model (docs/specs/case-model-class.md 7 to 9): per part, a `row` InstancedMesh at LOD1 with one
// instance per slot in catalog order, and a `front` InstancedMesh at LOD0 with two instances for the two slots nearest
// the selection. Colour per instance, one shared material per finish, at most 2 draw calls per part.
import { Color, Group, InstancedMesh, Matrix4, Vector3, type BufferGeometry, type Camera, type Material, type Raycaster, type Scene, type WebGLRenderer } from 'three';
import type { CaseAsset, CasePart } from './case-asset.ts';
import { getFinishMaterial, type Tier } from './finish-materials.ts';
import type { Finish } from '../bus.ts';

export interface LineupShade { readonly hex: string }
export type PoseFn = (slot: number, out: Matrix4) => void;

const PARK = new Matrix4().makeScale(1e-4, 1e-4, 1e-4);

interface PartMeshes { part: CasePart; row: InstancedMesh; front: InstancedMesh }

export class CaseLineup {
  readonly object = new Group();
  readonly count: number;
  private parts: PartMeshes[];
  private finish: Finish = 'matte';
  private tier: Tier;
  private colors: Color[] = [];
  private frontSlots: [number, number] = [-1, -1];
  private m = new Matrix4();
  private t = new Matrix4();

  constructor(asset: CaseAsset, count = 24, opts: { tier: Tier } = { tier: 'high' }) {
    this.count = count;
    this.tier = opts.tier;
    const [lod0, lod1] = asset.lods;
    this.parts = lod1.map((p1, k) => {
      const p0 = opts.tier === 'high' ? lod0[k] : p1;          // the low tier keeps the front case at LOD1
      const mat = this.materialFor(p1);
      const row = new InstancedMesh(p1.geometry, mat, count);
      const front = new InstancedMesh(p0.geometry, mat, 2);
      for (const im of [row, front]) { im.frustumCulled = false; im.name = `${p1.name}:${im === row ? 'row' : 'front'}`; im.userData.part = p1.name; this.object.add(im); }
      front.userData.base = p0.base;
      row.userData.base = p1.base;
      return { part: p1, row, front };
    });
  }

  private materialFor(p: CasePart): Material {
    return p.followsShade && p.name === 'body' ? getFinishMaterial(this.finish, this.tier) : (p.material ?? getFinishMaterial('matte', this.tier));
  }

  /** The family's 24 shades in catalog order; written only when the family is set (colours are linear-sRGB via setStyle). */
  setShades(shades: readonly LineupShade[]): void {
    this.colors = shades.map((s) => new Color().setStyle(s.hex));
    for (const pm of this.parts) {
      if (!pm.part.followsShade) continue;
      this.colors.forEach((c, i) => pm.row.setColorAt(i, c));
      pm.row.instanceColor!.needsUpdate = true;
    }
    this.writeFrontColors();
  }

  /** Swaps the body material on both body meshes in one frame. */
  setFinish(finish: Finish): void {
    this.finish = finish;
    for (const pm of this.parts) if (pm.part.followsShade && pm.part.name === 'body') { const m = this.materialFor(pm.part); pm.row.material = m; pm.front.material = m; }
  }
  getFinish(): Finish { return this.finish; }

  /**
   * Writes every instance matrix: pose(slot) x base(part). The row instance of a slot the front mesh draws is parked
   * (same place, scale 1e-4). Clears the cached bounding spheres so picking follows the moved instances.
   */
  setPoses(pose: PoseFn, front: [number, number]): void {
    const valid = (s: number) => s >= 0 && s < this.count;
    const f: [number, number] = [valid(front[0]) ? front[0] : -1, valid(front[1]) && front[1] !== front[0] ? front[1] : -1];
    if (f[0] !== this.frontSlots[0] || f[1] !== this.frontSlots[1]) { this.frontSlots = f; this.writeFrontColors(); }
    for (let i = 0; i < this.count; i++) {
      pose(i, this.m);
      const parked = i === f[0] || i === f[1];
      for (const pm of this.parts) {
        this.t.copy(this.m);
        if (parked) this.t.multiply(PARK);
        pm.row.setMatrixAt(i, this.t.multiply(pm.row.userData.base as Matrix4));
      }
      const fi = i === f[0] ? 0 : i === f[1] ? 1 : -1;
      if (fi >= 0) for (const pm of this.parts) pm.front.setMatrixAt(fi, this.t.copy(this.m).multiply(pm.front.userData.base as Matrix4));
    }
    for (let fi = 0; fi < 2; fi++) if (f[fi] < 0) for (const pm of this.parts) pm.front.setMatrixAt(fi, this.t.copy(PARK));
    for (const pm of this.parts) for (const im of [pm.row, pm.front]) { im.instanceMatrix.needsUpdate = true; im.boundingSphere = null; im.boundingBox = null; }
  }

  private writeFrontColors(): void {
    if (!this.colors.length) return;
    for (const pm of this.parts) {
      if (!pm.part.followsShade) continue;
      this.frontSlots.forEach((s, fi) => pm.front.setColorAt(fi, this.colors[s >= 0 ? s : 0]));
      pm.front.instanceColor!.needsUpdate = true;
    }
  }

  /** The slot under the ray: every part of the front pair first, then the row; the nearest hit wins. */
  pick(raycaster: Raycaster): number | null {
    const meshes = this.parts.flatMap((pm) => [pm.front, pm.row]);
    const hits = raycaster.intersectObjects(meshes, false);
    for (const h of hits) {
      const im = h.object as InstancedMesh;
      if (h.instanceId === undefined) continue;
      const isFront = this.parts.some((pm) => pm.front === im);
      const slot = isFront ? this.frontSlots[h.instanceId] : h.instanceId;
      if (slot !== undefined && slot >= 0) return slot;
    }
    return null;
  }

  /**
   * Compiles the other finish's program before anyone presses it (case-model-class.md 7 "Warm-up"): a hidden instanced
   * mesh with the body's LOD1 geometry, an instance colour and the other material, compiled in the live scene.
   */
  async warmUp(renderer: WebGLRenderer, scene: Scene, camera: Camera): Promise<number> {
    const body = this.parts.find((pm) => pm.part.followsShade && pm.part.name === 'body');
    if (body) {
      const other = getFinishMaterial(this.finish === 'matte' ? 'gloss' : 'matte', this.tier);
      const probe = new InstancedMesh(body.row.geometry as BufferGeometry, other, 1);
      probe.setColorAt(0, new Color(1, 1, 1));
      probe.setMatrixAt(0, new Matrix4().makeScale(0, 0, 0));
      probe.frustumCulled = false;
      scene.add(probe);
      await renderer.compileAsync(scene, camera);
      scene.remove(probe);
      probe.dispose();
    }
    return renderer.info.programs?.length ?? 0;
  }

  /** The world position of a slot's case centre (for DOM boxes and tests). */
  slotCentre(slot: number, pose: PoseFn, out = new Vector3()): Vector3 {
    pose(slot, this.m);
    return out.setFromMatrixPosition(this.m);
  }

  dispose(): void {
    for (const pm of this.parts) for (const im of [pm.row, pm.front]) { this.object.remove(im); im.dispose(); }
  }
}
