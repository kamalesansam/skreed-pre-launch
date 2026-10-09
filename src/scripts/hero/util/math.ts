// Frame-rate independent helpers and hashes (prototype template.html lines 313 to 318, 343 to 346, 1260, 1261).
// The arithmetic is the prototype's, operation for operation, so the port computes the same doubles.

/** igloo's damp: moves a toward b by k per 60 Hz frame; ratio is dt / (1 / 60), capped at 5 by the loop. */
export const lerpFPS = (a: number, b: number, k: number, ratio: number): number => a + (b - a) * (1 - Math.pow(1 - k, ratio));
export const smoothstep = (a: number, b: number, x: number): number => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const fit = (x: number, a: number, b: number, c: number, d: number): number => c + (d - c) * Math.min(1, Math.max(0, (x - a) / (b - a)));
export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
/** ease-in-out cubic, the pull-back's curve */
export const easeInOutCubic = (x: number): number => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
/** the camera shake's three-sine noise */
export const sineNoise = (a: number, b: number, c: number): number =>
  (Math.sin(a * 1.5 + b * 3.4598 + c * 1.234) + Math.sin(a * 3.12 - b * 3.234 + c * 4.221) + Math.sin(a * 0.355 + b * 2.3 - c * 1.375)) / 3;
export const hash2 = (x: number, y: number): number => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
export const vnoise2 = (x: number, y: number): number => {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return (hash2(xi, yi) * (1 - u) + hash2(xi + 1, yi) * u) * (1 - v) + (hash2(xi, yi + 1) * (1 - u) + hash2(xi + 1, yi + 1) * u) * v;
};
/** Park-Miller minimal standard generator (multiplier 16807, modulus 2^31 - 1), as the prototype's rnd(). */
export function parkMiller(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
