import json, math, sys, random
from svgpathtools import svg2paths
from shapely.geometry import Polygon, box
from shapely import affinity
from PIL import Image, ImageDraw
paths, _ = svg2paths('logomark.svg')
W, H = 1207.63, 1312.81
halves = []
for p in paths:
    pts = []
    for seg in p:
        n = max(2, int(seg.length() / 5))
        for i in range(n):
            z = seg.point(i / n); pts.append((z.real, z.imag))
    halves.append(Polygon(pts).buffer(0))
TARGET = float(sys.argv[1]) if len(sys.argv) > 1 else 230
key = [(517.28,767.45),(621.31,827.24),(813.47,715.89),(965.95,804.2),(690.35,545.36),(586.32,485.57),(394.16,596.92),(241.68,508.61),(0,725.55),(1207.63,587.26),(966,849),(241.68,463.6)]
def u(pt, ang):
    th = math.radians(ang); return -pt[0]*math.sin(th) + pt[1]*math.cos(th)
def cuts(ang):
    allu = [u((x, y), ang) for h in halves for (x, y) in h.exterior.coords]
    lo, hi = min(allu), max(allu)
    ks = sorted(set(round(u(p, ang), 1) for p in key))
    ks = [k for k in ks if lo < k < hi]
    seq = [lo - 1] + ks + [hi + 1]
    out = [seq[0]]
    for a, b in zip(seq, seq[1:]):
        n = max(1, round((b - a) / TARGET))
        for i in range(1, n + 1): out.append(a + (b - a) * i / n)
    # drop cuts closer than 40 units (keeps edge-aligned ones)
    res = [out[0]]
    for c in out[1:]:
        if c - res[-1] > 40: res.append(c)
    return res
def strip(ang, u0, u1):
    return affinity.rotate(box(-4000, u0, 4000, u1), ang, origin=(0, 0))
pieces = []
for ang_a, ang_b in [(30, -30)]:
    CA, CB = cuts(ang_a), cuts(ang_b)
    for hi_, h in enumerate(halves):
        for a0, a1 in zip(CA, CA[1:]):
            ha = h.intersection(strip(ang_a, a0, a1))
            if ha.is_empty: continue
            for b0, b1 in zip(CB, CB[1:]):
                g = ha.intersection(strip(ang_b, b0, b1))
                for gg in (g.geoms if hasattr(g, 'geoms') else [g]):
                    if gg.geom_type == 'Polygon' and not gg.is_empty: pieces.append([hi_, gg])
# merge tiny pieces into their largest touching neighbour in the same half
changed = True
while changed:
    changed = False
    pieces.sort(key=lambda p: p[1].area)
    for i, (h, g) in enumerate(pieces):
        if g.area < 6000:
            best = None
            for j, (h2, g2) in enumerate(pieces):
                if j != i and h2 == h and g.buffer(1).intersects(g2):
                    if best is None or g2.area > pieces[best][1].area: best = j
            if best is not None:
                m = pieces[best][1].union(g.buffer(0.5)).buffer(-0.5)
                if m.geom_type == 'Polygon':
                    pieces[best][1] = m; pieces.pop(i); changed = True; break
areas = sorted(p.area for _, p in pieces)
print('TARGET', TARGET, 'pieces', len(pieces), 'min', int(areas[0]), 'median', int(areas[len(areas)//2]), 'max', int(areas[-1]))
img = Image.new('RGB', (int(W/2), int(H/2)), (247, 246, 243)); d = ImageDraw.Draw(img); random.seed(5)
for h, g in pieces:
    c = tuple(random.randint(70, 210) for _ in range(3))
    d.polygon([(x/2, y/2) for x, y in g.exterior.coords], fill=c, outline=(56, 63, 67))
img.save(f'slice2_{int(TARGET)}.png')
json.dump({'viewBox': [W, H], 'pieces': [{'half': h, 'pts': [[round(x, 2), round(y, 2)] for x, y in g.simplify(1.0).exterior.coords[:-1]]} for h, g in pieces]}, open(f'pieces2_{int(TARGET)}.json', 'w'))
