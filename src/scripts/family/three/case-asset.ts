// One case model, its parts and its normalisation (docs/specs/case-model-class.md 2 to 6; Sam 2026-10-09: the case
// only, so the parts are body and accent, never a device). The normalisation is a matrix, never a geometry rewrite,
// because quantised attributes cannot take a baked transform (section 5).
import { Box3, BufferGeometry, Matrix4, Mesh, Quaternion, Vector3, type Material, type Object3D, type Texture } from 'three';

export type PartName = 'body' | 'accent';
export interface CasePart {
  readonly name: PartName;
  readonly geometry: BufferGeometry;
  /** normalise x nodeWorld: every instance matrix is pose x base, so poses pivot about the case's centre */
  readonly base: Matrix4;
  readonly material?: Material;
  readonly followsShade: boolean;
}
export interface CaseAsset {
  readonly source: 'supplier' | 'standin';
  /** [LOD0, LOD1], the same parts in the same order */
  readonly lods: [CasePart[], CasePart[]];
  /** the normalised box: height 1, width and thickness as measured */
  readonly dims: { w: number; h: 1; d: number };
  readonly sizeMm: [number, number, number];
  readonly maps: { orm?: Texture; normal?: Texture };
  dispose(): void;
}

/** A part before normalisation: its geometry and the node's world matrix in the file (dequantising transform included). */
export interface RawPart { name: PartName; geometry: BufferGeometry; nodeWorld: Matrix4; material?: Material; followsShade: boolean }

/**
 * The normalising matrix for a set of parts (section 5): the case box is the union of every part's geometry box
 * transformed by its node matrix; orient brings the long axis to +Y and the camera side to +Z (identity for a file that
 * follows the contract); the result is scale(1 / height) x orient x translate(-centre).
 */
export function normalising(parts: readonly RawPart[], orient: Quaternion = new Quaternion()): { matrix: Matrix4; dims: { w: number; h: 1; d: number }; size: Vector3 } {
  const box = new Box3(), tmp = new Box3();
  for (const p of parts) {
    if (!p.geometry.boundingBox) p.geometry.computeBoundingBox();
    tmp.copy(p.geometry.boundingBox!).applyMatrix4(p.nodeWorld);
    box.union(tmp);
  }
  const rot = new Matrix4().makeRotationFromQuaternion(orient);
  const oriented = box.clone().applyMatrix4(rot);
  const size = oriented.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const m = new Matrix4().makeScale(1 / size.y, 1 / size.y, 1 / size.y).multiply(rot).multiply(new Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z));
  return { matrix: m, dims: { w: size.x / size.y, h: 1, d: size.z / size.y }, size };
}

/** Applies the normalisation: each part's base = normalise x nodeWorld. Geometry is never touched. */
export function normaliseParts(parts: readonly RawPart[], orient?: Quaternion): { parts: CasePart[]; dims: { w: number; h: 1; d: number }; size: Vector3 } {
  const n = normalising(parts, orient);
  return { parts: parts.map((p) => ({ name: p.name, geometry: p.geometry, base: n.matrix.clone().multiply(p.nodeWorld), material: p.material, followsShade: p.followsShade })), dims: n.dims, size: n.size };
}

/** The manifest's part naming (section 3): node names first, material names second. */
export interface PartMap { body: { node: string; material: string }; accent?: { node: string; material: string; followsShade?: boolean } }
export const CONTRACT_PARTS: PartMap = { body: { node: 'Case_Body', material: 'Shade' }, accent: { node: 'Case_Accent', material: 'Accent' } };

const area = (g: BufferGeometry) => {
  const pos = g.getAttribute('position'), idx = g.getIndex();
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), ab = new Vector3(), ac = new Vector3();
  let sum = 0;
  const n = idx ? idx.count : pos.count;
  for (let i = 0; i < n; i += 3) {
    const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    sum += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2;
  }
  return sum;
};
type StdMat = Material & { map?: Texture | null; color?: { r: number; g: number; b: number } };
const meshMaterial = (m: Mesh): StdMat => (Array.isArray(m.material) ? m.material[0] : m.material) as StdMat;

/**
 * Finds the parts in a loaded scene (section 6). With a part map (production: the manifest) it reads the named nodes;
 * without one (development only: the stand-in and quick tests of unprepared files) the body is the mesh without a base
 * colour texture whose surface is largest, and a warning names the choice. A body with a base colour texture, a base
 * colour other than white, or vertex colours throws with the part name: anything baked there multiplies every hex.
 */
export function findParts(root: Object3D, map?: PartMap, warn: (msg: string) => void = () => {}): RawPart[] {
  root.updateMatrixWorld(true);
  const meshes: Mesh[] = [];
  root.traverse((o) => { if ((o as Mesh).isMesh) meshes.push(o as Mesh); });
  if (!meshes.length) throw new Error('case model: no meshes');
  const check = (m: Mesh) => {
    const mat = meshMaterial(m);
    if (mat.map) throw new Error(`case model: body part "${m.name}" has a base colour texture`);
    if (mat.color && (Math.abs(mat.color.r - 1) > 1e-3 || Math.abs(mat.color.g - 1) > 1e-3 || Math.abs(mat.color.b - 1) > 1e-3)) throw new Error(`case model: body part "${m.name}" has a base colour other than white`);
    if (m.geometry.getAttribute('color')) throw new Error(`case model: body part "${m.name}" has vertex colours`);
  };
  const raw = (m: Mesh, name: PartName, followsShade: boolean): RawPart => ({ name, geometry: m.geometry, nodeWorld: m.matrixWorld.clone(), material: meshMaterial(m), followsShade });
  if (map) {
    const byName = (node: string, material: string) => meshes.find((m) => m.name === node) ?? meshes.find((m) => meshMaterial(m).name === material);
    const body = byName(map.body.node, map.body.material);
    if (!body) throw new Error(`case model: no ${map.body.node} part`);
    check(body);
    const out = [raw(body, 'body', true)];
    const acc = map.accent && byName(map.accent.node, map.accent.material);
    if (acc && acc !== body) out.push(raw(acc, 'accent', !!map.accent!.followsShade));
    return out;
  }
  const candidates = meshes.filter((m) => !meshMaterial(m).map).map((m) => ({ m, a: area(m.geometry) })).sort((p, q) => q.a - p.a);
  if (!candidates.length) throw new Error('case model: every mesh has a base colour texture');
  const body = candidates[0].m;
  warn(`case model: no part map; using "${body.name || 'unnamed mesh'}" (largest untextured surface) as the body`);
  check(body);
  const rest = meshes.filter((m) => m !== body);
  return [raw(body, 'body', true), ...(rest.length ? [raw(rest.sort((p, q) => area(q.geometry) - area(p.geometry))[0], 'accent', false)] : [])];
}
