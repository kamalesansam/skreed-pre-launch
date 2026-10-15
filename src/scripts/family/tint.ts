// The per-shade background pair (exception E-F2, docs/specs/family-page.md 20): ciao's radial wash in the selected shade
// and a lighter, softer tint of it. OKLab maths, no dependency; the page module and the argument screen's smoke use it.

export function hexToOklab(hex: string): [number, number, number] {
  const c = [1, 3, 5].map((k) => { const v = parseInt(hex.slice(k, k + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  const l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
  const m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
  const s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

export function oklabToHex(L: number, a: number, b: number): string {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + rgb.map((v) => { v = Math.max(0, Math.min(1, v)); v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return ('0' + Math.round(v * 255).toString(16)).slice(-2); }).join('');
}

/** [dark, light]: the shade held under lightness 0.38 and chroma 0.12 for the wash's body, and its light tint (lightness at least 0.62, chroma x 0.9). */
export function tintOf(hex: string): [string, string] {
  const o = hexToOklab(hex), C = Math.hypot(o[1], o[2]), h = Math.atan2(o[2], o[1]);
  const L1 = Math.min(o[0], 0.38), C1 = Math.min(C, 0.12), L2 = Math.max(o[0], 0.62), C2 = C * 0.9;
  return [oklabToHex(L1, C1 * Math.cos(h), C1 * Math.sin(h)), oklabToHex(L2, C2 * Math.cos(h), C2 * Math.sin(h))];
}

export const hexRgb = (h: string): [number, number, number] => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)) as [number, number, number];
