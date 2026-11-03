// The quiz result's colours (docs/specs/quiz.md, the result screen of 2026-11-02; E-S3-result). Sam, 2026-11-02, with his
// reference: "make it look something like this for the results ... which will look dynamic to all the colors that we
// got"; asked what the result should stand on, "Shade's deep tone, flat". Every tone is the drawn shade's own, moved in
// OKLab (the family pages' maths, scripts/family/tint.ts) at build: Quiz.astro writes each shade's tones into its chip's
// data attributes and deck.ts copies the drawn shade's onto the section as custom properties, so each of the 240 shades
// gives its own ground, band and name layer, and nothing is computed in the browser (the paint is recoloured by the
// shade itself, quiz.css .qz-rub; the SVG stroke's edge and ridge tones went with it on 2026-11-03).
import { hexToOklab, oklabToHex } from '../scripts/family/tint.ts';
import { luminance } from './quiz.ts';

export interface ResultTones {
  /** the ground the result stands on: the shade at OKLab lightness 0.27 (lower for a dark shade, 0.14 under it), its chroma at most 0.06 */
  deep: string;
  /** the offer's band along the bottom, a step lighter than the ground */
  band: string;
  /** the shade name's offset layer (the reference's darker copy behind the letters) */
  mid: string;
}

/** inside sRGB before rounding (oklabToHex clips, which would shift the hue and the lightness) */
const inGamut = (L: number, a: number, b: number): boolean => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
};
/** the shade's hue at lightness L and chroma C, the chroma eased down until the colour is inside sRGB */
const at = (o: [number, number, number], L: number, C: number): string => {
  const h = Math.atan2(o[2], o[1]);
  let c = C;
  while (c > 1e-4 && !inGamut(L, c * Math.cos(h), c * Math.sin(h))) c *= 0.95;
  return oklabToHex(L, c * Math.cos(h), c * Math.sin(h));
};

export function resultTones(hex: string): ResultTones {
  const o = hexToOklab(hex), C = Math.hypot(o[1], o[2]);
  const L = Math.min(0.27, Math.max(0.11, o[0] - 0.14)), Cd = Math.min(C * 0.7, 0.06);
  return {
    deep: at(o, L, Cd),
    band: at(o, L + 0.045, Cd),
    mid: at(o, Math.min(0.55, Math.max(0.42, L + 0.2)), Math.min(C, 0.09)),
  };
}

const ratio = (a: string, b: string) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/** A chip's name, on the chip as Sam's reference sets it: --night or Pearl Whisper, whichever reads better on the chip's
 *  shade (4.4:1 or better on every quiz shade; Fuchsia and Teal are the two under 4.5) */
export function chipInk(hex: string): 'night' | 'pearl' {
  return ratio(hex, '#050506') >= ratio(hex, '#f7f6f3') ? 'night' : 'pearl';
}

/** A chip that would sink into the ground (under 1.5:1 against the lightest ground, a neutral at OKLab 0.27) carries a
 *  Pearl Whisper hairline, as the swatches do on the night ground (needsRingNight). */
export function chipRim(hex: string): boolean {
  return ratio(hex, oklabToHex(0.27, 0, 0)) < 1.5;
}
