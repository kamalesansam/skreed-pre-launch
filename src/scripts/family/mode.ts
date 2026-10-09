// FAMILY_3D (the environment variable PUBLIC_FAMILY_3D, so Vite can fold it), the family pages' build mode (docs/specs/family-page.md decision 15, case-model-class.md 13 and 16):
//   off  swatch grid mode only. No island, no model manifest, no posters. The default for `astro build` until the
//        supplier model is through the intake, so the production bundle never carries the 3D or the stand-in.
//   dev  the 3D lineup with the procedural stand-in case, for development and test builds only (the default under
//        `astro dev`). Never deployed: the stand-in is not the product (rule 38).
//   on   the 3D lineup with the supplier model. Fails the build unless src/data/case-model.json names a supplier
//        model, so a stand-in can never ship.
import { existsSync, readFileSync } from 'node:fs';

export type Family3D = 'off' | 'dev' | 'on';
export const MANIFEST = new URL('../../data/case-model.json', import.meta.url);

export function family3dMode(env: string | undefined = import.meta.env?.PUBLIC_FAMILY_3D ?? process.env.PUBLIC_FAMILY_3D, isDev: boolean = import.meta.env?.DEV === true): Family3D {
  const v = (env ?? (isDev ? 'dev' : 'off')).trim().toLowerCase();
  if (v !== 'off' && v !== 'dev' && v !== 'on') throw new Error(`PUBLIC_FAMILY_3D must be off, dev or on, not "${env}"`);
  if (v === 'on') {
    if (!existsSync(MANIFEST)) throw new Error('PUBLIC_FAMILY_3D=on needs the supplier case model: run the intake (docs/specs/case-model-class.md 3) to write src/data/case-model.json');
    const m = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { source?: string };
    if (m.source !== 'supplier') throw new Error(`PUBLIC_FAMILY_3D=on: src/data/case-model.json names source "${m.source}"; the stand-in never ships (decision 15)`);
  }
  return v;
}
