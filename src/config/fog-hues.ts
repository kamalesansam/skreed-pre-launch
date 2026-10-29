// The fog's shade hues (E-fog-hue; Sam, 2026-10-26: "can we add different types of hues which are the ones that we have
// for skreed? ... mild hues here and there, instead of just having grey and silver, likethey jsut appear and then goes
// back to grey, and then like that in different areas diferent hues appear and dissappear, smoothly, softl fading";
// 2026-10-29, for section 2's fog too: "yes, and all the other section where the same backround is used"). Patches of
// the fog take a shade's hue at the fog's own lightness (OKLab), so the text on it keeps its contrast. Plain data and
// pure functions, read by section2/hues.ts at runtime (both instances of the background shader) and by Tune's
// "Sections 2 and 3" group (PUBLIC_TUNE builds); the unit tests import it under Node.
import { BLOCK_SHADES } from './shades.gen.ts';   // already in the island (section 2's gems); SHADES, all 240, is not

/**
 * The hues: the gems' key shades without the two neutrals, Snow and Silver, so the fog under the quiz echoes the gems
 * above it. Derived, so a change of a family's key shade flows through. The sources are none of the neon or pastel shades
 * rules 49 and 50 name; the tints they make in the fog are pale.
 */
export const FOG_HUES = BLOCK_SHADES.filter((s) => !/^(frosty-white|stormy-grey)-/.test(s.id));

/** Families whose hues never share the screen: no purple-to-blue (rule 1) */
const APART: readonly (readonly [string, string])[] = [['blissful-blue', 'vivid-violet']];

/** OKLab a and b of a hex colour (Ottosson 2020, sRGB D65): the hue a patch takes, at the fog's own lightness */
export function oklabAB(hex: string): [number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

/** The hues' OKLab a and b, in FOG_HUES order */
export const FOG_HUE_AB: readonly (readonly [number, number])[] = FOG_HUES.map((s) => oklabAB(s.hex));

/** The tunable parameters (Tune, "Sections 2 and 3"): numbers only, as ROOM_PARAMS, bound the same way with the prefix f- */
export const FOG_HUE_PARAMS = Object.freeze({
  hueOn: 1,        // 1 the hues in the fog, 0 the plain grey fog
  hueAmt: 0.25,    // how far a patch at its peak goes toward its shade's hue (OKLab a and b; 1 is the shade's own chroma)
  hueCycle: 12,    // seconds from a patch's first trace of colour to its return to grey; three patches, a third of a cycle apart
  hueSize: 1,      // the patches against the fog's clouds: 1 the clouds' own scale, higher is smaller
  hueCover: 0.5,   // how much of the fog a patch tints at its peak: 0 a little, 1 most of it
});

/** Tune's ranges (min, max, step): fog-hues.test.ts holds Tune.astro to them. hueSize stops at 1.4, where one noise tile still spans a 21:9 screen */
export const FOG_HUE_RANGES = Object.freeze({
  hueOn: [0, 1, 1], hueAmt: [0, 1, 0.01], hueCycle: [4, 30, 0.5], hueSize: [0.4, 1.4, 0.05], hueCover: [0, 1, 0.01],
} as const satisfies Record<keyof typeof FOG_HUE_PARAMS, readonly [number, number, number]>);

export type FogHueParams = { -readonly [K in keyof typeof FOG_HUE_PARAMS]: number };
export type FogHueParamKey = keyof typeof FOG_HUE_PARAMS;
export function fogHueParams(): FogHueParams { return { ...FOG_HUE_PARAMS }; }

const DEFAULTS: FogHueParams = fogHueParams();
/** The parameters in use: Tune's live copy when its panel is open (dev and staging), else the defaults. */
export function liveFogHues(): FogHueParams {
  const t = typeof window !== 'undefined' ? window.__skreedTune?.fog?.params : undefined;
  return t ?? DEFAULTS;
}

/** The noise threshold a patch starts at, from hueCover (the fog's noise sits at 0.5 with a standard deviation of 0.137) */
export const hueLo = (cover: number) => 0.68 - 0.24 * cover;

/**
 * The three patches for the shader, once per frame (no per-pixel hashing). phase counts cycles; patch j lives from
 * phase j / 3 to j / 3 + 1 in slot j mod 3, rising and falling on sin^2, so three live at once and a slot changes its
 * place and shade only at the zero of its envelope. Each patch's shade is drawn from a seeded order, skipping the shades
 * of the two patches alive beside it and any family kept APART from theirs. Writes slots (vec4[3]: the noise offset,
 * the envelope, 0) and ab (vec2[3]).
 */
export function createHueSlots(ab0: readonly (readonly [number, number])[] = FOG_HUE_AB, ids: readonly string[] = FOG_HUES.map((s) => s.id)) {
  const fam = ids.map((id) => id.replace(/-\d+$/, ''));
  const apart = (a: number, b: number) => a === b || APART.some(([x, y]) => (fam[a] === x && fam[b] === y) || (fam[a] === y && fam[b] === x));
  const rnd = (j: number, k: number) => { let s = (Math.imul(j + 1, 0x9e3779b1) ^ Math.imul(k + 7, 0x85ebca77)) >>> 0; s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) >>> 0; s = Math.imul(s ^ (s >>> 12), 0x297a2d39) >>> 0; return ((s ^ (s >>> 15)) >>> 0) / 4294967296; };
  const picks: number[] = [];
  const pick = (j: number): number => {
    while (picks.length <= j) {
      const i = picks.length, n = ab0.length, start = Math.floor(rnd(i, 0) * n);
      let c = start;
      for (let step = 0; step < n; step++) { c = (start + step) % n; if (!(i >= 1 && apart(c, picks[i - 1])) && !(i >= 2 && apart(c, picks[i - 2]))) break; }
      picks.push(c);
    }
    return picks[j];
  };
  return function write(phase: number, slots: Float32Array, ab: Float32Array) {
    const top = Math.floor(3 * phase);
    for (let j = top - 2; j <= top; j++) {
      const k = ((j % 3) + 3) % 3, e = j < 0 ? 0 : Math.sin(Math.PI * (phase - j / 3)) ** 2;
      if (j < 0 || ab0.length === 0) { slots.set([0, 0, 0, 0], 4 * k); ab.set([0, 0], 2 * k); continue; }
      slots.set([rnd(j, 1), rnd(j, 2), e, 0], 4 * k);
      ab.set(ab0[pick(j)], 2 * k);
    }
  };
}
