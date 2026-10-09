// WCAG contrast from screenshots (AC4.6, AC5.3): luminance statistics of boxes, computed by pixels.py.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export interface BoxStats { max: number; p95: number; median: number; rgb_median: number[]; n: number }
export type Box = [x: number, y: number, w: number, h: number];

const PY = fileURLToPath(new URL('./pixels.py', import.meta.url));

export function boxStats(png: string, boxes: Box[]): BoxStats[] {
  return JSON.parse(execFileSync('python3', ['-I', PY, png, JSON.stringify(boxes)]).toString());
}

export function luminanceOfHex(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
