# Band-by-band linear luminance of a page render (or any 1280x800 shot) against the igloo hero shot.
# usage: python3 bands.py cand.png [cand2.png ...]   (--rows prints the row-mean profile y380-800 every 20 rows)
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
SH = '/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/refsites/work/shots/igloo-hero-1280.png'
BOX = [('far L', (0, 440, 420, 500)), ('far R', (900, 430, 1280, 500)), ('mid L', (0, 520, 380, 640)), ('mid R', (900, 520, 1280, 640)),
       ('near C', (300, 620, 700, 800)), ('near R', (700, 620, 1280, 800))]
W709 = np.array([0.2126, 0.7152, 0.0722])
def lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float64) / 255
def lumlin(c): return (lin(c) * W709).sum(-1)
def stats(c):
    Y = lumlin(c); Ys = (c * W709).sum(-1); out = {}
    for nm, (x0, y0, x1, y1) in BOX:
        r = Y[y0:y1, x0:x1]; k = (r > 0.02) & (r < 0.9)
        lf = gaussian_filter(Ys[y0:y1, x0:x1], 6.0)
        out[nm] = (r[k].mean() if k.any() else np.nan, lf[k].std() * 255 if k.any() else np.nan)
    return out, Y, Ys
ref, Yr, Ysr = stats(load(SH))
print('%-8s %8s %8s %8s %8s' % ('box', 'igloo', 'ours', 'ig/ours', 'lfstd ig/ours'))
for p in [a for a in sys.argv[1:] if not a.startswith('--')]:
    c = load(p); o, Y, Ys = stats(c)
    print('==', p)
    for nm, _ in BOX:
        print('%-8s %8.4f %8.4f %8.3f   %5.1f / %5.1f' % (nm, ref[nm][0], o[nm][0], ref[nm][0] / o[nm][0], ref[nm][1], o[nm][1]))
    fl = (Ys > 0.02)
    print('pixels > 230 (sRGB luma) on the floor y380-800:', int(((Ys[380:] * 255 > 230) & fl[380:]).sum()), ' > 215:', int(((Ys[380:] * 255 > 215) & fl[380:]).sum()))
    if '--rows' in sys.argv:
        print('row-mean sRGB luma (sky/UI excluded), ours vs igloo, y380..800 step 20')
        for y in range(380, 800, 20):
            a = Ys[y:y + 20]; m = (a > 0.02) & (a < 0.9); b = Ysr[y:y + 20]; mb = (b > 0.02) & (b < 0.9)
            print('  y%3d  ours %5.1f  igloo %5.1f' % (y, a[m].mean() * 255 if m.any() else -1, b[mb].mean() * 255))
