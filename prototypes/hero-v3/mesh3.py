# For each variant (10, 20, 30 equal-area blocks): densified outline + jittered interior points, Delaunay-triangulated cap.
import json, math, random, subprocess
import numpy as np
from scipy.spatial import Delaunay
from shapely.geometry import Polygon, Point
W, H = 1207.63, 1312.81
SP = 17.0   # facet spacing in SVG units (about 0.08 world units)
out = {'viewBox': [W, H], 'variants': {}}
for N in (10, 20, 30):
    subprocess.run(['python3', 'slice3.py', str(N)], check=True, capture_output=True)
    d = json.load(open(f'pieces3_{N}.json'))
    random.seed(N)
    polys = [Polygon(p['pts']) for p in d['pieces']]
    # colour areas: pieces ordered clockwise from the top, grouped into ten runs of equal length
    cx, cy = W / 2, H / 2
    order = sorted(range(N), key=lambda i: math.atan2(polys[i].centroid.x - cx, -(polys[i].centroid.y - cy)) % (2 * math.pi))
    per = N // 10
    anchors = []
    for g in range(10):
        grp = order[g * per:(g + 1) * per]
        anchors.append([round(sum(polys[i].centroid.x for i in grp) / per, 1), round(sum(polys[i].centroid.y for i in grp) / per, 1)])
    pieces = []
    for poly in polys:
        if not poly.exterior.is_ccw: poly = Polygon(list(poly.exterior.coords)[::-1])
        ring = list(poly.exterior.coords)[:-1]
        bnd = []
        for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
            L = math.hypot(x1 - x0, y1 - y0); n = max(1, round(L / 15))
            for k in range(n): bnd.append((x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n))
        inner = []
        minx, miny, maxx, maxy = poly.bounds
        shrunk = poly.buffer(-SP * 0.45)
        y = miny; row = 0
        while y <= maxy:
            x = minx + (SP / 2 if row % 2 else 0)
            while x <= maxx:
                px, py = x + random.uniform(-0.3, 0.3) * SP, y + random.uniform(-0.3, 0.3) * SP
                if shrunk.contains(Point(px, py)): inner.append((px, py))
                x += SP
            y += SP * 0.866; row += 1
        pts = bnd + inner
        tri = Delaunay(np.array(pts))
        tris = []
        test = poly.buffer(0.5)
        for a, b, c in tri.simplices:
            t = Polygon([pts[a], pts[b], pts[c]])
            if t.area < 1e-3 or not test.contains(t): continue
            tris.append([int(a), int(b), int(c)])
        cov = sum(Polygon([pts[a], pts[b], pts[c]]).area for a, b, c in tris) / poly.area
        if abs(cov - 1) > 0.01: print('coverage', N, round(cov, 3))
        pieces.append({'nb': len(bnd), 'v': [[round(x), round(y)] for x, y in pts], 't': [i for t in tris for i in t]})
    out['variants'][N] = {'anchors': anchors, 'pieces': pieces}
    print(N, 'verts', sum(len(p['v']) for p in pieces), 'tris', sum(len(p['t']) // 3 for p in pieces))
json.dump(out, open('pieces_all.json', 'w'), separators=(',', ':'))
import os; print('bytes', os.path.getsize('pieces_all.json'))
