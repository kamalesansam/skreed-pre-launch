"""Texture ladder for the hero's sky and ground: encode WebP and AVIF at several sizes from the lossless Blender PNGs that
reproduce the shipped WebPs byte for byte, and score each against the same-size lossless reference (PSNR, SSIM on luma).
python3 -I texladder.py <land dir> <out dir>"""
import io, sys, time, json
import numpy as np
from PIL import Image
L, OUT = sys.argv[1:3]
def luma(a): return (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]).astype(np.float32)
def box(x, r=4):
    c = np.cumsum(np.cumsum(np.pad(x.astype(np.float64), ((1, 0), (1, 0))), 0), 1); k = 2 * r
    return ((c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)).astype(np.float32)
def ssim(a, b):
    a, b = luma(a), luma(b); C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    ma, mb = box(a), box(b); va = box(a * a) - ma * ma; vb = box(b * b) - mb * mb; cov = box(a * b) - ma * mb
    return float(np.mean(((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))))
def psnr(a, b):
    m = np.mean((a.astype(np.float32) - b.astype(np.float32)) ** 2); return float(10 * np.log10(255 ** 2 / m)) if m else 99.0
SKY_CROPS = {  # u0,u1,v0,v1 in texture UV (v from the bottom row), from skyuv.mjs plus a 0.01 margin
    'crop-portrait': (0.345, 0.654, 0.0, 0.661),
    'crop-wide': (0.117, 0.881, 0.0, 0.661),
}
jobs = []
sky = Image.open(f'{L}/sky.png').convert('RGB'); gr = Image.open(f'{L}/ground_bake.png').convert('RGB')
for W in (4200, 4096, 2048, 1024): jobs.append(('sky', f'{W}x{W // 2}', sky if W == 4200 else sky.resize((W, W // 2), Image.LANCZOS), 84))
for name, (u0, u1, v0, v1) in SKY_CROPS.items():
    box_ = (round(u0 * 4200), round((1 - v1) * 2100), round(u1 * 4200), round((1 - v0) * 2100))
    c = sky.crop(box_); jobs.append(('sky', f'{name}-native {c.width}x{c.height}', c, 84))
    for f in (0.75, 0.5):   # same crop at 3150 and 2100 px-wide-equivalent density
        cc = c.resize((round(c.width * f), round(c.height * f)), Image.LANCZOS); jobs.append(('sky', f'{name}-x{f} {cc.width}x{cc.height}', cc, 84))
for W in (4096, 2048, 1024): jobs.append(('ground', f'{W}x{W}', gr if W == 4096 else gr.resize((W, W), Image.LANCZOS), 82))
rows = []
for kind, label, im, wq in jobs:
    R = np.asarray(im)
    for fmt, q in [('WEBP', wq), ('AVIF', 50), ('AVIF', 60), ('AVIF', 70)]:
        t = time.time(); b = io.BytesIO()
        im.save(b, fmt, quality=q, **({'speed': 6} if fmt == 'AVIF' else {'method': 6})); data = b.getvalue(); dt = time.time() - t
        fn = f"{OUT}/{kind}_{label.split()[-1]}_{label.split()[0] if ' ' in label else ''}_{fmt.lower()}{q}.{ 'avif' if fmt == 'AVIF' else 'webp'}".replace('__', '_')
        open(fn, 'wb').write(data)
        D = np.asarray(Image.open(io.BytesIO(data)).convert('RGB'))
        row = dict(kind=kind, label=label, w=im.width, h=im.height, fmt=fmt, q=q, bytes=len(data), psnr=round(psnr(R, D), 2), ssim=round(ssim(R, D), 4),
                   enc_s=round(dt, 1), vram_mb_rgba8_mips=round(im.width * im.height * 4 * 4 / 3 / 2**20, 1))
        rows.append(row); print(json.dumps(row), flush=True)
json.dump(rows, open(f'{OUT}/ladder.json', 'w'), indent=1)
print('DONE')
