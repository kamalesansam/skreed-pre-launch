# Verify the moon_igloo bake directory against the moon_final2 contract (same files, right sizes).
import os, json, sys, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'moon_igloo')
need = ['ground_bake.png', 'ground_h.bin', 'stones_p.bin', 'stones_c.bin', 'stones_i.bin', 'moon_meta.json', 'sky.png']
ok = True
for f in need:
    p = os.path.join(D, f); ex = os.path.exists(p)
    print('%-16s %s %10s bytes' % (f, 'ok ' if ex else 'MISSING', os.path.getsize(p) if ex else '-')); ok &= ex
if not ok: sys.exit(1)
meta = json.load(open(os.path.join(D, 'moon_meta.json'))); print(json.dumps(meta))
g = meta['ground']; nr, nc = g['nr'], g['nc']
h = np.fromfile(os.path.join(D, 'ground_h.bin'), '<u2'); print('ground_h.bin', h.size, 'values, expect', nr * nc, 'ok' if h.size == nr * nc else 'BAD')
z = g['zmin'] + h.astype(float) / 65535 * (g['zmax'] - g['zmin']); print('  heights %.3f..%.3f, logo pad (centre) %.3f' % (z.min(), z.max(), z.reshape(nr, nc)[int((1 - (30 / 450) ** (1 / 2.2)) * (nr - 1)), nc // 2]))
s = meta['stones']; nv, nt = s['verts'], s['tris']
P = np.fromfile(os.path.join(D, 'stones_p.bin'), '<i2'); C = np.fromfile(os.path.join(D, 'stones_c.bin'), np.uint8)
I = np.fromfile(os.path.join(D, 'stones_i.bin'), '<u2' if s['idx'] == 'u16' else '<u4')
print('stones_p %d (expect %d) %s' % (P.size, nv * 3, 'ok' if P.size == nv * 3 else 'BAD'))
print('stones_c %d (expect %d) %s  mean colour %s' % (C.size, nv * 3, 'ok' if C.size == nv * 3 else 'BAD', np.round(C.reshape(-1, 3).mean(0) / 255, 3)))
print('stones_i %d (expect %d) %s  max index %d' % (I.size, nt * 3, 'ok' if I.size == nt * 3 else 'BAD', I.max()))
im = Image.open(os.path.join(D, 'ground_bake.png')); print('ground_bake.png', im.size, im.mode)
a = np.asarray(im.convert('RGB')).astype(float) / 255
rows = a.shape[0]
for name, r0, r1 in [('near (bottom 10%)', int(rows * 0.9), rows), ('mid', int(rows * 0.6), int(rows * 0.7)), ('far (top 10%)', 0, int(rows * 0.1))]:
    m = a[r0:r1].reshape(-1, 3).mean(0); print('  %-18s mean %.3f/%.3f/%.3f' % (name, *m))
sk = Image.open(os.path.join(D, 'sky.png')); print('sky.png', sk.size, sk.mode)
