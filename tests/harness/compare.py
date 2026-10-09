"""Frame comparison for the parity specs (hero-architecture.md 13.1), ported from scripts/hero/probes/compare2.py.

PSNR and SSIM (8 px box, luma) overall, in the sky band (top 40 percent of the frame) and in the ground band (bottom
35 percent), plus the count and bounding box of differing pixels. Writes an x8 difference map when asked. Exits 1 when
any given threshold is missed, 2 on a size mismatch.

Usage:
  python3 -I tests/harness/compare.py A.png B.png [--psnr 99] [--ssim 0.976] [--sky-ssim 0.967] [--ground-ssim 0.979]
                                     [--diff out.png]
Prints one JSON object. PSNR is 99 for identical frames (the noise floor the spec names)."""
import json, sys
import numpy as np
from PIL import Image


def luma(a):
    return (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]).astype(np.float64)


def box(x, r=4):
    c = np.cumsum(np.cumsum(np.pad(x, ((1, 0), (1, 0))), 0), 1)
    k = 2 * r
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)


def ssim(a, b):
    a, b = luma(a), luma(b)
    if a.shape[0] <= 8 or a.shape[1] <= 8:
        return 1.0 if np.array_equal(a, b) else 0.0
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    ma, mb = box(a), box(b)
    va = box(a * a) - ma * ma
    vb = box(b * b) - mb * mb
    cov = box(a * b) - ma * mb
    return float(np.mean(((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))))


def psnr(a, b):
    m = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return float(10 * np.log10(255 ** 2 / m)) if m else 99.0


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    pa, pb = argv[0], argv[1]
    opts = {}
    i = 2
    while i < len(argv):
        k = argv[i].lstrip('-')
        opts[k] = argv[i + 1]
        i += 2
    A = np.asarray(Image.open(pa).convert('RGB'))
    B = np.asarray(Image.open(pb).convert('RGB'))
    if A.shape != B.shape:
        print(json.dumps({'error': 'shape', 'a': list(A.shape), 'b': list(B.shape)}))
        return 2
    H = A.shape[0]
    sky, gr = slice(0, int(H * 0.40)), slice(int(H * 0.65), H)
    d = np.abs(A.astype(int) - B.astype(int)).max(axis=2)
    ys, xs = np.nonzero(d)
    out = {
        'size': [int(A.shape[1]), int(A.shape[0])],
        'psnr': round(psnr(A, B), 3), 'ssim': round(ssim(A, B), 5),
        'sky_psnr': round(psnr(A[sky], B[sky]), 3), 'sky_ssim': round(ssim(A[sky], B[sky]), 5),
        'ground_psnr': round(psnr(A[gr], B[gr]), 3), 'ground_ssim': round(ssim(A[gr], B[gr]), 5),
        'diff_px': int(len(ys)), 'max_diff': int(d.max()) if len(ys) else 0,
        'bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(ys) else None,
    }
    if 'diff' in opts:
        Image.fromarray(np.clip(np.abs(A.astype(int) - B.astype(int)) * 8, 0, 255).astype(np.uint8)).save(opts['diff'])
        out['diff_map'] = opts['diff']
    misses = []
    for key, field in (('psnr', 'psnr'), ('ssim', 'ssim'), ('sky-ssim', 'sky_ssim'), ('ground-ssim', 'ground_ssim')):
        if key in opts and out[field] < float(opts[key]):
            misses.append(f'{field} {out[field]} < {opts[key]}')
    out['pass'] = not misses
    if misses:
        out['misses'] = misses
    print(json.dumps(out))
    return 0 if not misses else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
