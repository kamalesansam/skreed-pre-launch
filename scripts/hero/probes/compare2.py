"""Compare texture-variant renders of the hero canvas against the base render (same viewport): PSNR and SSIM overall,
in the sky band (top 40 percent of the frame) and in the ground band (bottom 35 percent). Usage: python3 -I compare.py <renders dir>"""
import glob, os, sys
import numpy as np
from PIL import Image
d = sys.argv[1]
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
print('| viewport | variant (sky px / ground px) | PSNR all | SSIM all | PSNR sky band | SSIM sky band | PSNR ground band | SSIM ground band |')
print('|---|---|---:|---:|---:|---:|---:|---:|')
LAB = {'base2': 'shipped page, second run (noise floor)', 'skycrop': 'sky cropped to visible region at native density (4200-equivalent) / ground 4096', 's2800': 'sky 2800x1400 / ground 4096', 's2048': 'sky 2048x1024 / ground 4096', 's1024': 'sky 1024x512 / ground 4096', 'g2048': 'sky 4200 / ground 2048', 'g1024': 'sky 4200 / ground 1024', 'both2048': 'sky 2048 / ground 2048 (WebP)', 'both1024': 'sky 1024 / ground 1024', 'avif': 'sky 4200 AVIF q50 / ground 4096 AVIF q60', 'avif2048': 'sky 2048 AVIF q50 / ground 2048 AVIF q60', 'prop_phone': 'PROPOSAL phone: sky portrait crop 1298x1388 AVIF q50 / ground 4096 AVIF q50', 'prop_phone_lowmem': 'PROPOSAL phone low-memory: sky portrait crop AVIF q50 / ground 2048 AVIF q60', 'prop_desk': 'PROPOSAL desktop: sky wide crop 3208x1388 AVIF q50 / ground 4096 AVIF q50'}
for vp in ('phone', 'desk', 'uw'):
    bp = os.path.join(d, f'base_{vp}.png')
    if not os.path.exists(bp): continue
    B = np.asarray(Image.open(bp).convert('RGB')); H = B.shape[0]
    for k, lab in LAB.items():
        p = os.path.join(d, f'{k}_{vp}.png')
        if not os.path.exists(p): continue
        V = np.asarray(Image.open(p).convert('RGB'))
        if V.shape != B.shape: print('shape mismatch', p, V.shape, B.shape); continue
        sky = slice(0, int(H * 0.40)); gr = slice(int(H * 0.65), H)
        print('| %s %dx%d | %s | %.2f | %.4f | %.2f | %.4f | %.2f | %.4f |' % (vp, B.shape[1], B.shape[0], lab, psnr(B, V), ssim(B, V), psnr(B[sky], V[sky]), ssim(B[sky], V[sky]), psnr(B[gr], V[gr]), ssim(B[gr], V[gr])))
