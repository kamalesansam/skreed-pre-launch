// The finish materials (docs/specs/case-model-class.md 7): one shared material per finish and tier, used by every
// shade, white, so the diffuse colour is exactly the instance colour. Values are the study's starting points until
// calibration B and Sam's daylight check freeze them in calibration.json (run 2).
import { MeshPhysicalMaterial, MeshStandardMaterial, type Material } from 'three';
import type { Finish } from '../bus.ts';

export type Tier = 'high' | 'low';
export const FINISH_VALUES = {
  matte: { roughness: 0.62, metalness: 0 },
  glossLow: { roughness: 0.16, metalness: 0 },
  glossHigh: { roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 },
} as const;

const cache = new Map<string, Material>();
export function getFinishMaterial(finish: Finish, tier: Tier): Material {
  const key = finish === 'matte' ? 'matte' : `gloss:${tier}`;
  let m = cache.get(key);
  if (!m) {
    m = finish === 'matte' ? new MeshStandardMaterial({ name: 'matte', color: 0xffffff, ...FINISH_VALUES.matte })
      : tier === 'high' ? new MeshPhysicalMaterial({ name: 'gloss-high', color: 0xffffff, ...FINISH_VALUES.glossHigh })
      : new MeshStandardMaterial({ name: 'gloss-low', color: 0xffffff, ...FINISH_VALUES.glossLow });
    cache.set(key, m);
  }
  return m;
}
export function disposeFinishMaterials(): void {
  cache.forEach((m) => m.dispose());
  cache.clear();
}
