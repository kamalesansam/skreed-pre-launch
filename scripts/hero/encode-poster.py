"""Encodes the hero posters from the rest-frame renders (hero-architecture.md 6.4, spec D10).
Usage: python3 -I scripts/hero/encode-poster.py [render dir] [out dir]
  defaults: assets-src/hero/poster  src/assets/hero/poster
Phone: render-phone.png (488 x 1055) resized to 488 x 1056, AVIF q60 and WebP q80 -> portrait.avif, portrait.webp
Desktop: render-desktop.png (1920 x 1200), AVIF q50 and WebP q70 -> wide.avif, wide.webp
AVIF speed 4, WebP method 6, as in the probe (scripts/hero/probes/poster.py). Fails if a file is over 120,000 B."""
import io, os, sys
import numpy as np
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else 'assets-src/hero/poster'
out = sys.argv[2] if len(sys.argv) > 2 else 'src/assets/hero/poster'
LIMIT = 120_000

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

JOBS = [('render-phone.png', (488, 1056), 'portrait', [('AVIF', 60), ('WEBP', 80)]),
        ('render-desktop.png', (1920, 1200), 'wide', [('AVIF', 50), ('WEBP', 70)])]
os.makedirs(out, exist_ok=True)
bad = False
print('| file | size | format | q | bytes | PSNR dB | SSIM |\n|---|---|---|---:|---:|---:|---:|')
for name, size, cls, encs in JOBS:
    im = Image.open(os.path.join(src, name)).convert('RGB')
    if im.size != size: im = im.resize(size, Image.LANCZOS)
    R = np.asarray(im)
    for fmt, q in encs:
        b = io.BytesIO(); im.save(b, fmt, quality=q, **({'speed': 4} if fmt == 'AVIF' else {'method': 6})); data = b.getvalue()
        path = os.path.join(out, f'{cls}.{fmt.lower()}')
        open(path, 'wb').write(data)
        D = np.asarray(Image.open(io.BytesIO(data)).convert('RGB'))
        print('| %s | %dx%d | %s | %d | %d | %.2f | %.4f |' % (path, im.width, im.height, fmt, q, len(data), psnr(R, D), ssim(R, D)), flush=True)
        if len(data) > LIMIT: print(f'FAIL {path} is {len(data)} B, over {LIMIT} B'); bad = True
sys.exit(1 if bad else 0)
