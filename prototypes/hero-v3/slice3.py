# Equal-area slicing of the logomark into N blocks along the isometric grid (30, 150, 90 degrees).
import json, math, sys, random
from svgpathtools import svg2paths
from shapely.geometry import Polygon, LineString, MultiPolygon
from shapely.ops import split
from PIL import Image, ImageDraw
N = int(sys.argv[1]) if len(sys.argv) > 1 else 30
paths, _ = svg2paths('logomark.svg')
W, H = 1207.63, 1312.81
halves = []
for p in paths:
    pts = []
    for seg in p:
        n = max(2, int(seg.length() / 4))
        for i in range(n):
            z = seg.point(i / n); pts.append((z.real, z.imag))
    halves.append(Polygon(pts).buffer(0))
DIRS = [30, 150, 90]
def cut(poly, ang, frac):
    th = math.radians(ang); d = (math.cos(th), math.sin(th)); nrm = (-d[1], d[0])
    us = [x * nrm[0] + y * nrm[1] for x, y in poly.exterior.coords]
    lo, hi = min(us), max(us)
    def halfplane(u):
        c = (nrm[0] * u, nrm[1] * u)
        big = 5000
        a = (c[0] - d[0] * big, c[1] - d[1] * big); b = (c[0] + d[0] * big, c[1] + d[1] * big)
        return Polygon([a, b, (b[0] - nrm[0] * big, b[1] - nrm[1] * big), (a[0] - nrm[0] * big, a[1] - nrm[1] * big)])
    target = poly.area * frac
    a_, b_ = lo, hi
    for _ in range(60):
        m = (a_ + b_) / 2
        if poly.intersection(halfplane(m)).area < target: a_ = m
        else: b_ = m
    hp = halfplane((a_ + b_) / 2)
    return poly.intersection(hp), poly.difference(hp)
def compact(g):
    if g.geom_type != 'Polygon': return 1e9
    return g.length ** 2 / g.area
def slice_(poly, n, depth=0):
    if n == 1: return [poly]
    k = n // 2
    best = None
    for ang in DIRS:
        for kk in range(max(1, n // 3), n - max(1, n // 3) + 1):
            A, B = cut(poly, ang, kk / n)
            if A.geom_type != 'Polygon' or B.geom_type != 'Polygon': continue
            s = max(compact(A) / (kk ** 0.35), compact(B) / ((n - kk) ** 0.35))
            if best is None or s < best[0]: best = (s, A, B, kk)
    if best is None:
        raise SystemExit(f'no connected cut for n={n}')
    _, A, B, kk = best
    return slice_(A, kk, depth + 1) + slice_(B, n - kk, depth + 1)
per = [N // 2, N - N // 2]
pieces = []
from shapely import affinity
for g in slice_(halves[0], N // 2):
    pieces.append((0, g)); pieces.append((1, affinity.rotate(g, 180, origin=(W / 2, H / 2))))
print('mirror check', round(affinity.rotate(halves[0], 180, origin=(W/2, H/2)).symmetric_difference(halves[1]).area))
areas = [g.area for _, g in pieces]
print('pieces', len(pieces), 'min', int(min(areas)), 'max', int(max(areas)), 'spread %.3f' % (max(areas) / min(areas)))
# 10 colour areas: k-means on centroids, 3 blocks each, ordered clockwise from the top
cs = [(g.centroid.x, g.centroid.y) for _, g in pieces]
random.seed(3)
cx, cy = W / 2, H / 2
cent = sorted(cs, key=lambda c: math.atan2(c[0] - cx, -(c[1] - cy)))[::3][:10]
for it in range(50):
    groups = [[] for _ in cent]
    for c in cs:
        groups[min(range(len(cent)), key=lambda i: (c[0] - cent[i][0]) ** 2 + (c[1] - cent[i][1]) ** 2)].append(c)
    cent = [(sum(x for x, _ in g) / len(g), sum(y for _, y in g) / len(g)) if g else cent[i] for i, g in enumerate(groups)]
cent.sort(key=lambda c: math.atan2(c[0] - cx, -(c[1] - cy)) % (2 * math.pi))
img = Image.new('RGB', (int(W / 2), int(H / 2)), (247, 246, 243)); d = ImageDraw.Draw(img); random.seed(5)
for h, g in pieces:
    c = tuple(random.randint(70, 210) for _ in range(3))
    d.polygon([(x / 2, y / 2) for x, y in g.exterior.coords], fill=c, outline=(20, 20, 20))
for i, (x, y) in enumerate(cent):
    d.ellipse([x / 2 - 6, y / 2 - 6, x / 2 + 6, y / 2 + 6], fill=(255, 0, 0)); d.text((x / 2 + 8, y / 2 - 6), str(i), fill=(0, 0, 0))
img.save(f'slice3_{N}.png')
json.dump({'viewBox': [W, H], 'anchors': [[round(x, 1), round(y, 1)] for x, y in cent],
           'pieces': [{'half': h, 'pts': [[round(x, 2), round(y, 2)] for x, y in g.simplify(0.8).exterior.coords[:-1]]} for h, g in pieces]},
          open(f'pieces3_{N}.json', 'w'), separators=(',', ':'))
