# Measure ciao's studio HDRI (read-only, for numbers): band luminance and the bright fixtures, in three's equirect frame.
import numpy as np, sys, json
def read_hdr(p):
    b = open(p, 'rb').read(); i = 0
    while True:
        j = b.index(b'\n', i); line = b[i:j]; i = j + 1
        if line.startswith(b'-Y') or line.startswith(b'+Y'): dims = line.split(); break
    H, W = int(dims[1]), int(dims[3]); img = np.zeros((H, W, 4), np.uint8); d = np.frombuffer(b, np.uint8, offset=i); k = 0
    for y in range(H):
        assert d[k] == 2 and d[k + 1] == 2; k += 4
        for c in range(4):
            x = 0
            while x < W:
                n = int(d[k]); k += 1
                if n > 128: n -= 128; img[y, x:x + n, c] = d[k]; k += 1
                else: img[y, x:x + n, c] = d[k:k + n]; k += n
                x += n
    e = img[..., 3].astype(np.int32); f = np.where(e > 0, np.ldexp(1.0, e - 136), 0.0)
    return img[..., :3] * f[..., None]
im = read_hdr(sys.argv[1]); H, W, _ = im.shape
L = im @ np.array([0.2126, 0.7152, 0.0722])
lat = 90 - (np.arange(H) + 0.5) / H * 180            # row 0 = up
lon = (np.arange(W) + 0.5) / W * 360 - 180            # u = 0.5 + lon/360 ; three dir = (cos lon, ., sin lon)
wts = np.cos(np.radians(lat))
out = {'size': [W, H]}
bands = []
for a in range(-90, 90, 10):
    m = (lat >= a) & (lat < a + 10)
    bands.append([a, round(float(np.median(L[m])), 4), round(float((L[m] * 1).mean()), 4)])
out['bands_median_mean'] = bands
# bright fixtures: connected regions over thresholds
from collections import deque
def regions(th):
    mask = L > th; seen = np.zeros_like(mask); res = []
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not seen[y, x]:
                q = deque([(y, x)]); seen[y, x] = 1; pts = []
                while q:
                    yy, xx = q.popleft(); pts.append((yy, xx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = yy + dy, (xx + dx) % W
                        if 0 <= ny < H and mask[ny, nx] and not seen[ny, nx]: seen[ny, nx] = 1; q.append((ny, nx))
                if len(pts) < 20: continue
                ys = np.array([p[0] for p in pts]); xs = np.array([p[1] for p in pts]); v = L[ys, xs]; w = wts[ys]
                sa = float((w * (np.pi / H) * (2 * np.pi / W)).sum())
                res.append({'n': len(pts), 'lat': [round(float(lat[ys].min()), 1), round(float(lat[ys].max()), 1)], 'lon': [round(float(lon[xs].min()), 1), round(float(lon[xs].max()), 1)],
                            'meanL': round(float(v.mean()), 2), 'maxL': round(float(v.max()), 2), 'solidAngle_sr': round(sa, 4), 'power': round(float((v * w).sum() * (np.pi / H) * (2 * np.pi / W)), 3),
                            'rgb': [round(float(x), 3) for x in (im[ys, xs].mean(0) / max(1e-6, v.mean()))]})
    return sorted(res, key=lambda r: -r['power'])[:8]
out['over2'] = regions(2.0)
tot = float((L * wts[:, None]).sum() * (np.pi / H) * (2 * np.pi / W)); out['total_power'] = round(tot, 3)
# what the backs see: the region around three dir +Z (lon +90) within +-40 deg lon, -20..40 lat
m = (np.abs(lon[None, :] - 90) < 40) & (lat[:, None] > -20) & (lat[:, None] < 40)
out['behind_camera_mean'] = round(float(L[m].mean()), 4)
json.dump(out, open('hdr-measure.json', 'w'), indent=1); print(json.dumps(out, indent=1)[:4000])
np.save('hdr_L.npy', L.astype(np.float32))
