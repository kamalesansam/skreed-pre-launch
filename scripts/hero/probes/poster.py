"""Encode a hero canvas render as poster candidates (AVIF and WebP at several qualities, optional resize), report bytes and quality.
Usage: python3 -I poster.py <render.png> <out prefix> [target width ...]"""
import io, sys
import numpy as np
from PIL import Image
src, prefix = sys.argv[1:3]; widths = [int(w) for w in sys.argv[3:]] or [None]
def luma(a): return (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]).astype(np.float64)
def box(x, r=4):
    c = np.cumsum(np.cumsum(np.pad(x, ((1, 0), (1, 0))), 0), 1); k = 2 * r
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
def ssim(a, b):
    a, b = luma(a), luma(b); C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    ma, mb = box(a), box(b); va = box(a * a) - ma * ma; vb = box(b * b) - mb * mb; cov = box(a * b) - ma * mb
    return float(np.mean(((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))))
def psnr(a, b):
    m = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2); return float(10 * np.log10(255 ** 2 / m)) if m else 99.0
full = Image.open(src).convert('RGB')
print('| source | size | format | q | bytes | PSNR dB | SSIM |\n|---|---|---|---:|---:|---:|---:|')
for w in widths:
    im = full if not w or w == full.width else full.resize((w, round(full.height * w / full.width)), Image.LANCZOS)
    R = np.asarray(im)
    for fmt, qs in (('AVIF', (40, 50, 60)), ('WEBP', (70, 80))):
        for q in qs:
            b = io.BytesIO(); im.save(b, fmt, quality=q, **({'speed': 4} if fmt == 'AVIF' else {'method': 6})); data = b.getvalue()
            open(f'{prefix}_{im.width}x{im.height}_q{q}.{fmt.lower()}', 'wb').write(data)
            D = np.asarray(Image.open(io.BytesIO(data)).convert('RGB'))
            print('| %s | %dx%d | %s | %d | %d | %.2f | %.4f |' % (src.split('/')[-1], im.width, im.height, fmt, q, len(data), psnr(R, D), ssim(R, D)), flush=True)
