// FAMILY_3D (the environment variable PUBLIC_FAMILY_3D, so Vite can fold it), the family pages' build mode (docs/specs/family-page.md decision 15, case-model-class.md 13 and 16):
//   off  swatch grid mode only. No island, no model manifest, no posters. The default for `astro build` until the
//        supplier model is through the intake, so the production bundle never carries the 3D or the stand-in.
//   dev  the 3D lineup with the procedural stand-in case, for development and test builds only (the default under
//        `astro dev`). Never deployed: the stand-in is not the product (rule 38).
//   on   the 3D lineup with the supplier model. Fails the build unless src/data/case-model.json names a supplier
//        model, so a stand-in can never ship.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Family3D = 'off' | 'dev' | 'on';
/** Read at build from the project root (the prerender runs from a bundled chunk, so import.meta.url is no anchor). */
export const MANIFEST = join(process.cwd(), 'src', 'data', 'case-model.json');

export function family3dMode(env: string | undefined = import.meta.env?.PUBLIC_FAMILY_3D ?? process.env.PUBLIC_FAMILY_3D, isDev: boolean = import.meta.env?.DEV === true, manifest: string = MANIFEST): Family3D {
  const v = (env ?? (isDev ? 'dev' : 'off')).trim().toLowerCase();
  if (v !== 'off' && v !== 'dev' && v !== 'on') throw new Error(`PUBLIC_FAMILY_3D must be off, dev or on, not "${env}"`);
  if (v === 'on') {
    if (!existsSync(manifest)) throw new Error('PUBLIC_FAMILY_3D=on needs the supplier case model: run the intake (docs/specs/case-model-class.md 3) to write src/data/case-model.json');
    const m = JSON.parse(readFileSync(manifest, 'utf8')) as { source?: string };
    if (m.source !== 'supplier') throw new Error(`PUBLIC_FAMILY_3D=on: src/data/case-model.json names source "${m.source}"; the stand-in never ships (decision 15)`);
  }
  return v;
}

/**
 * FAMILY_PAGES (the environment variable PUBLIC_FAMILY_PAGES: on or off), whether the build emits /shades/<family>/ and
 * the landing's family links. On in every build, production included (Sam, 2026-10-19, "yeah do it" to quiz.md 10 item
 * 5): the gate was G21's (review iteration 1: no page whose Reserve or "All 240 shades" link dead-ends), and the round 3
 * page has neither link (D4, D7), so nothing on it leads nowhere. PUBLIC_FAMILY_PAGES=off still builds the landing
 * without the pages and the links, for a build that must leave them out.
 */
export function familyPagesOn(env: string | undefined = import.meta.env?.PUBLIC_FAMILY_PAGES ?? process.env.PUBLIC_FAMILY_PAGES): boolean {
  const v = env?.trim().toLowerCase();
  if (v === 'on' || !v) return true;
  if (v === 'off') return false;
  throw new Error(`PUBLIC_FAMILY_PAGES must be on or off, not "${env}"`);
}
