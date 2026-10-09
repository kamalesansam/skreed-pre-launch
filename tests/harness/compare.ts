// Runs tests/harness/compare.py on two PNG files and returns its JSON (hero-architecture.md 13.1).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./compare.py', import.meta.url));

export interface CompareResult {
  size: [number, number];
  psnr: number; ssim: number;
  sky_psnr: number; sky_ssim: number;
  ground_psnr: number; ground_ssim: number;
  diff_px: number; max_diff: number; bbox: [number, number, number, number] | null;
  diff_map?: string;
  pass: boolean; misses?: string[];
  error?: string;
}

export interface Thresholds { psnr?: number; ssim?: number; skySsim?: number; groundSsim?: number }

export function compare(a: string, b: string, t: Thresholds = {}, diff?: string): CompareResult {
  const args = ['-I', SCRIPT, a, b];
  if (t.psnr !== undefined) args.push('--psnr', String(t.psnr));
  if (t.ssim !== undefined) args.push('--ssim', String(t.ssim));
  if (t.skySsim !== undefined) args.push('--sky-ssim', String(t.skySsim));
  if (t.groundSsim !== undefined) args.push('--ground-ssim', String(t.groundSsim));
  if (diff) args.push('--diff', diff);
  const r = spawnSync('python3', args, { encoding: 'utf8' });
  const line = r.stdout.trim().split('\n').pop() || '{}';
  const out = JSON.parse(line) as CompareResult;
  if (r.status === 2) out.pass = false;
  return out;
}
