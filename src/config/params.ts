// The hero's 66 render parameters (hero-architecture.md 5.5), in the prototype's key order (template.html line 305).
// Every value is the v9.10 prototype's, which already carries Sam's locked values of 2026-10-09 (hero.md section 0),
// except logoIdle: 0 here, 1 in the prototype. The idle twitch is off in production for WCAG 2.2.2 (spec D20).
// tests/unit/params.test.ts asserts the locked values, logoIdle and every other key against the prototype.

import { LOGO_IDLE, LOGO_SPLIT } from './glitch.ts';

export const HERO_PARAMS = Object.freeze({
  // hover (igloo's own numbers)
  push: 0.5, wob: 0.3, r0: 1, r1: 3, follow: 0.06, mouse: 0.05, breath: 0.3, lift: 1.6,
  // look
  glow: 2.4, rest: 0.06, tint: 0.035, grad: 0.7,
  // logotype glitch
  logoIdle: LOGO_IDLE, logoSplit: LOGO_SPLIT,
  clear: 0.2,
  // sky
  skyGain: 1, hue: 0.8, hueScale: 2.2,
  // terrain (locked)
  crumb: 0.53, crumbSize: 0.07, gExp: 0.2, gGamma: 0.87, gNear: 0.54, gToe: 0.02, mist: 0.2, mistSpeed: 0.55,
  // fog (locked)
  fog: 1, fogBright: 0.4, fogSpeed: 0.15, fogSize: 1, fogHug: 1.6,
  // look
  tex: 1.5, relief: 0.01, key: 2.0,
  // post
  bloom: 0.5,
  // logo light (rimAz and rimEl are unused by the GLSL; kept for parity of the table)
  rim: 2.4, spec: 0.8, rough: 0.55, bounce: 1.0, amb: 1, rimAz: 35, rimEl: 40, bevel: 0.05, bevelAng: 50, alb: 0.017, wrap: 0.25,
  // key light
  keyX: -6, keyY: 7, keyZ: 10, keyRad: 3.5,
  // kicker and counter kicker
  rimX: -4, rimY: 9, rimZ: -3, rimRad: 4.5, rim2: 0.75, rim2X: 9, rim2Y: 7, rim2Z: -3, rim2Rad: 4,
  // environment
  floor: 0.24, hz: 0.06, sky: 0.008, ktemp: 1, wear: 0.3, occ: 0.3, knee: 0.55,
} as const);

export type HeroParams = { -readonly [K in keyof typeof HERO_PARAMS]: number };
export type HeroParamKey = keyof typeof HERO_PARAMS;

/** Sam's locked values (2026-10-09; docs/specs/evidence/LOCKED_VALUES.md). Fog first, then terrain. */
export const LOCKED = Object.freeze({
  fog: 1, fogBright: 0.4, fogSpeed: 0.15, fogSize: 1, fogHug: 1.6,
  gExp: 0.2, gGamma: 0.87, gNear: 0.54, gToe: 0.02, crumb: 0.53, crumbSize: 0.07, mist: 0.2, mistSpeed: 0.55,
} as const);

/** The runtime parameters: a mutable copy, with breath 0 under reduced motion (prototype line 304). */
export function heroParams(reduced: boolean): HeroParams {
  const p: HeroParams = { ...HERO_PARAMS };
  if (reduced) p.breath = 0;
  return p;
}
