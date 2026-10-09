// The procedural stand-in case (docs/specs/case-model-class.md 13): the study's fixture recipe
// (scripts/case-model/study/gen-standin.html) built at runtime, with the same parts, normalisation and dims contract
// as the supplier model, so every class and test runs unchanged when the real model replaces it. Body and accent only
// (Sam, 2026-10-09: the case only, the camera window shows the page through). Development and test builds only:
// PUBLIC_FAMILY_3D=dev. The stand-in is not the product (CLAUDE.md rule 38) and never ships (decision 15).
import { ExtrudeGeometry, MathUtils, Matrix4, MeshStandardMaterial, Path, Shape, type BufferGeometry } from 'three';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { normalising, type CaseAsset, type CasePart, type RawPart } from './case-asset.ts';
import { URBAN_SLATE } from '../../../config/tokens.ts';

// millimetres: a generic large-phone case
const W = 77, H = 163, D = 11.2, R = 12, WALL = 1.6, BACK = 1.3;
const CAM = { x: -W / 2 + 7, y: H / 2 - 7, w: 40, h: 40, r: 10 }; // the cut-out, top left seen from the back (+Z)

type P = Shape | Path;
function roundRect<T extends P>(path: T, x: number, y: number, w: number, h: number, r: number): T {
  path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x + w, y + h - r); path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  path.lineTo(x + r, y + h); path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r); path.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
  return path;
}
const camRect = (grow: number): [number, number, number, number, number] => [CAM.x - grow, CAM.y - CAM.h - grow, CAM.w + 2 * grow, CAM.h + 2 * grow, CAM.r + grow];

function creased(g: BufferGeometry): BufferGeometry {
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const flat = g.index ? g.toNonIndexed() : g;   // ExtrudeGeometry is already non-indexed
  return mergeVertices(toCreasedNormals(flat, MathUtils.degToRad(35)), 1e-4);
}

/** Body (back plate with the cut-out, side walls with a lip) and accent (camera ring) for one level of detail. */
export function standInGeometry(curveSegments: number, bevelSegments: number): { body: BufferGeometry; accent: BufferGeometry } {
  const backShape = roundRect(new Shape(), -W / 2, -H / 2, W, H, R);
  backShape.holes.push(roundRect(new Path(), ...camRect(0)));
  const back = new ExtrudeGeometry(backShape, { depth: BACK - 1.2, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelOffset: -0.6, bevelSegments, curveSegments });
  back.translate(0, 0, D / 2 - BACK + 0.6);
  const wallShape = roundRect(new Shape(), -W / 2, -H / 2, W, H, R);
  wallShape.holes.push(roundRect(new Path(), -W / 2 + WALL, -H / 2 + WALL, W - 2 * WALL, H - 2 * WALL, R - WALL));
  const wall = new ExtrudeGeometry(wallShape, { depth: D - 1.6, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.6, bevelOffset: -0.6, bevelSegments, curveSegments });
  wall.translate(0, 0, -D / 2 + 0.8);
  const ringShape = roundRect(new Shape(), ...camRect(1.6));
  ringShape.holes.push(roundRect(new Path(), ...camRect(0)));
  const ring = new ExtrudeGeometry(ringShape, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelOffset: -0.3, bevelSegments: Math.min(2, bevelSegments), curveSegments });
  ring.translate(0, 0, D / 2 - 0.4);
  const merged = mergeGeometries([back, wall]);
  back.dispose(); wall.dispose();
  const body = creased(merged);
  const accent = creased(ring);
  merged.dispose(); ring.dispose();
  body.computeBoundingBox(); accent.computeBoundingBox();
  return { body, accent };
}

/** The stand-in as a CaseAsset: LOD0 (10 curve segments, 3 bevel segments), LOD1 (4 and 1). */
export function buildStandInAsset(): CaseAsset {
  const shade = new MeshStandardMaterial({ name: 'Shade', color: 0xffffff, roughness: 0.62, metalness: 0 });
  const accentMat = new MeshStandardMaterial({ name: 'Accent', color: URBAN_SLATE, roughness: 0.35, metalness: 0.6 });
  const raw = (seg: number, bev: number): RawPart[] => {
    const g = standInGeometry(seg, bev);
    return [
      { name: 'body', geometry: g.body, nodeWorld: new Matrix4(), material: shade, followsShade: true },
      { name: 'accent', geometry: g.accent, nodeWorld: new Matrix4(), material: accentMat, followsShade: false },
    ];
  };
  const r0 = raw(10, 3), r1 = raw(4, 1);
  // one normalisation for both levels (from LOD0), so the front case swaps LOD without any change in size or position
  const n = normalising(r0);
  const parts = (r: RawPart[]): CasePart[] => r.map((p) => ({ name: p.name, geometry: p.geometry, base: n.matrix.clone().multiply(p.nodeWorld), material: p.material, followsShade: p.followsShade }));
  const s = n.size;
  return {
    source: 'standin',
    lods: [parts(r0), parts(r1)],
    dims: n.dims,
    sizeMm: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)],
    maps: {},
    dispose() {
      for (const p of [...r0, ...r1]) p.geometry.dispose();
      shade.dispose(); accentMat.dispose();
    },
  };
}
