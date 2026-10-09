// Colour arithmetic for the calibration (case-model-class.md 10): sRGB hex to CIELAB (D65), CIEDE2000, and three.js
// r165's Neutral tone mapping followed by the sRGB transfer function and 8-bit rounding, as the canvas outputs it.
export const hexToRgb = (h) => { const x = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)); };
const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const oetf = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToLab(rgb) {
  const [r, g, b] = rgb.map(lin);
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

/** CIEDE2000 between two sRGB 8-bit triples. */
export function de2000(rgb1, rgb2) {
  const [L1, a1, b1] = rgbToLab(rgb1), [L2, a2, b2] = rgbToLab(rgb2);
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = ((Math.atan2(b1, a1p) * deg) + 360) % 360, h2p = ((Math.atan2(b2, a2p) * deg) + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = h2p - h1p; if (dhp > 180) dhp -= 360; if (dhp < -180) dhp += 360; if (C1p * C2p === 0) dhp = 0;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2; if (C1p * C2p === 0) hbp = h1p + h2p;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dth = 30 * Math.exp(-(((hbp - 275) / 25) ** 2)), Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dth * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

/** three r165 NeutralToneMapping (exposure 1), then the sRGB OETF, then 8-bit rounding: linear radiance to canvas RGB. */
export function neutralToSrgb8(rgbLinear) {
  let c = [...rgbLinear];
  const start = 0.8 - 0.04, desat = 0.15;
  const x = Math.min(...c), offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c = c.map((v) => v - offset);
  const peak = Math.max(...c);
  if (peak >= start) {
    const d = 1 - start, newPeak = 1 - (d * d) / (peak + d - start);
    c = c.map((v) => (v * newPeak) / peak);
    const g = 1 - 1 / (desat * (peak - newPeak) + 1);
    c = c.map((v) => v * (1 - g) + newPeak * g);
  }
  return c.map((v) => Math.round(Math.min(1, Math.max(0, oetf(Math.min(1, Math.max(0, v))))) * 255));
}
