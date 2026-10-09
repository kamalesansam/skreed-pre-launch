// The finish materials (docs/specs/case-model-class.md 7): one shared material per finish and tier, used by every
// shade, white, so the diffuse colour is exactly the instance colour. The supplier model's logo inlay gets the same
// material at its tint (0.8468 of the shade, amendment 3), drawn with a polygon offset because it sits 0.05 to 0.1 mm
// proud of the shell. The accent (camera surround, buttons, liner) is fixed Urban Slate (section 6). Roughness and the
// light levels come from calibration.json, written by scripts/case-model/calibrate.mjs, never by hand.
import { MeshPhysicalMaterial, MeshStandardMaterial, type Material } from 'three';
import type { Finish } from '../bus.ts';
import { URBAN_SLATE } from '../../../config/tokens.ts';
import CAL from './calibration.json' with { type: 'json' };

export type Tier = 'high' | 'low';
export const FINISH_VALUES = {
  matte: { roughness: CAL.matte.roughness, metalness: 0 },
  glossLow: { roughness: CAL.glossLow.roughness, metalness: 0 },
  glossHigh: { roughness: CAL.glossHigh.roughness, metalness: 0, clearcoat: 1, clearcoatRoughness: CAL.glossHigh.clearcoatRoughness },
  accent: { color: URBAN_SLATE, roughness: 0.35, metalness: 0.6 },
} as const;

const cache = new Map<string, Material>();
/** The finish material for a part that follows the shade; tint < 1 is the logo's variant (same program, own colour). */
export function getFinishMaterial(finish: Finish, tier: Tier, tint = 1): Material {
  const key = `${finish === 'matte' ? 'matte' : `gloss:${tier}`}:${tint}`;
  let m = cache.get(key);
  if (!m) {
    const name = `${finish === 'matte' ? 'matte' : `gloss-${tier}`}${tint !== 1 ? '-logo' : ''}`;
    m = finish === 'matte' ? new MeshStandardMaterial({ name, color: 0xffffff, ...FINISH_VALUES.matte })
      : tier === 'high' ? new MeshPhysicalMaterial({ name, color: 0xffffff, ...FINISH_VALUES.glossHigh })
      : new MeshStandardMaterial({ name, color: 0xffffff, ...FINISH_VALUES.glossLow });
    if (tint !== 1) {
      (m as MeshStandardMaterial).color.setScalar(tint);   // a linear factor, as the file's baseColorFactor is
      m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -1;
    }
    cache.set(key, m);
  }
  return m;
}
/** The accent part's one fixed material (Urban Slate, section 6). */
export function getAccentMaterial(): Material {
  let m = cache.get('accent');
  if (!m) { m = new MeshStandardMaterial({ name: 'accent', ...FINISH_VALUES.accent }); cache.set('accent', m); }
  return m;
}
export function disposeFinishMaterials(): void {
  cache.forEach((m) => m.dispose());
  cache.clear();
}
