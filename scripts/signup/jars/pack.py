"""Fill the whole jar once with pellets by a seeded deposition on a height field (no physics engine).

  blender -b --factory-startup --python pack.py -- --out pile.json --top 3.80 --seed 11

Every fill state is cut from this one pile (render.py keeps the pellets whose centres lie below the state's level), so
every follow order shares the same grains and a lower layer never moves when a new one lands on it.

Each pellet gets a random size and stretch (chips, flakes and short rods, as the picture mixes them) and M random
orientations biased towards lying flat, then is tried at K random spots inside the jar and dropped where it comes to
rest lowest: it falls straight down until its underside touches the pile's height field, which is how a pour fills the
low spots first and leaves a level, bumpy top. A spot near the glass leans the pellet on it, face along the glass, so
the front reads as a mosaic of faces. It is then rocked --rattle times, keeping any pose that rests lower. The fill
stops when the median surface height near the axis reaches --top. Same seed, same pile, on any machine (numpy only).
"""
import sys, os, json, math, time, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import bpy
from mathutils import Quaternion, Vector
import jarlib as J

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True)
ap.add_argument('--top', type=float, default=3.80, help='median surface height to stop at (jar units; the full jar is cut at 3.711)')
ap.add_argument('--seed', type=int, default=11)
ap.add_argument('--k', type=int, default=12, help='candidate spots per pellet')
ap.add_argument('--m', type=int, default=3, help='free orientations tried per pellet')
ap.add_argument('--cell', type=float, default=0.006)
ap.add_argument('--smin', type=float, default=0.85)
ap.add_argument('--smax', type=float, default=1.15)
ap.add_argument('--stretch', type=float, default=0.45, help='a pellet is stretched along one axis by up to this (rods, ovals)')
ap.add_argument('--tilt', type=float, default=0.5, help='|cos tilt| = 1 - tilt * u^1.5: 0 lies flat, 1 allows on edge')
ap.add_argument('--wallband', type=float, default=0.09)
ap.add_argument('--rattle', type=int, default=2)
ap.add_argument('--rattle_deg', type=float, default=30.0)
ap.add_argument('--wtilt', type=float, default=35.0)
ap.add_argument('--max', type=int, default=40000)
a = ap.parse_args(argv)
t0 = time.time()

pm = J.pellet_mesh('pellet_pts', u=40, v=20)
LP = np.array([v.co[:] for v in pm.vertices], dtype=np.float64)
bpy.data.meshes.remove(pm)

c = a.cell
N = int(round(2.0 / c)) + 1
half = (N - 1) / 2
gx = (np.arange(N) - half) * c
RR = np.hypot(gx[None, :], gx[:, None])
FLOOR = J.JAR['floor_h']
WALL = 1.0 - J.JAR['wall']
H = np.where(RR < WALL, FLOOR, 99.0)
rng = np.random.default_rng(a.seed)


def footprint(q, sc):
    M = np.array(q.to_matrix()) @ np.diag(sc)
    P = LP @ M.T
    ix = np.round(P[:, 0] / c).astype(int)
    iy = np.round(P[:, 1] / c).astype(int)
    m = max(np.abs(ix).max(), np.abs(iy).max()) + 1
    w = 2 * m + 1
    under = np.full((w, w), np.inf)
    top = np.full((w, w), -np.inf)
    np.minimum.at(under, (iy + m, ix + m), P[:, 2])
    np.maximum.at(top, (iy + m, ix + m), P[:, 2])
    cov = np.isfinite(under)
    pad_u = np.pad(under, 1, constant_values=np.inf)
    pad_t = np.pad(top, 1, constant_values=-np.inf)
    nb_u = np.min([pad_u[1 + dy:1 + dy + w, 1 + dx:1 + dx + w] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], axis=0)
    nb_t = np.max([pad_t[1 + dy:1 + dy + w, 1 + dx:1 + dx + w] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], axis=0)
    nbcount = sum(np.roll(np.roll(cov, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dx or dy))
    hole = (~cov) & (nbcount >= 5)
    under[hole] = nb_u[hole]
    top[hole] = nb_t[hole]
    cov = np.isfinite(under)
    oy, ox = np.nonzero(cov)
    return under, top, cov, m, float(P[:, 2].min()), float(P[:, 2].max()), (ox - m, oy - m)


def rand_orient():
    u = rng.random()
    ct = 1.0 - a.tilt * u ** 1.5
    tilt = math.acos(max(-1.0, min(1.0, ct)))
    q = (Quaternion((0, 0, 1), rng.random() * 2 * math.pi) @ Quaternion((1, 0, 0), tilt)
         @ Quaternion((0, 0, 1), rng.random() * 2 * math.pi) @ Quaternion((1, 0, 0), math.pi if rng.random() < 0.5 else 0.0))
    return q


def wall_orient(th):
    n = Vector((math.cos(th), math.sin(th), 0.0))
    if rng.random() < 0.5:
        n = -n
    ax = n.cross(Vector((0, 0, 1))).normalized()
    tilt = math.radians(a.wtilt) * math.sqrt(rng.random())
    n = Quaternion(n.cross(ax).normalized() if rng.random() < 0.5 else ax, tilt) @ n
    return Vector((0, 0, 1)).rotation_difference(n) @ Quaternion((0, 0, 1), rng.random() * 2 * math.pi)


def level():
    return float(np.median(H[RR < 0.6]))


def place_score(fp, ix0, iy0):
    under, top, cov, m, zmin, zmax, (ox, oy) = fp
    if iy0 - m < 0 or ix0 - m < 0 or iy0 + m >= N or ix0 + m >= N:
        return None
    sl = (slice(iy0 - m, iy0 + m + 1), slice(ix0 - m, ix0 + m + 1))
    z = float(np.max(H[sl][cov] - under[cov])) + 0.0005
    rad = np.hypot((ix0 + ox - half) * c, (iy0 + oy - half) * c).max()
    if rad > J.inner_radius_at(z + zmax) - 0.003:
        return None
    return z, sl


pel = []
lev = level()
nwall = 0
t1 = time.time()
rin = J.inner_radius_at(lev + 0.1)
while lev < a.top and len(pel) < a.max:
    s = float(rng.uniform(a.smin, a.smax))
    e = float(rng.uniform(0.0, a.stretch)) ** 1.5 / a.stretch ** 0.5 if a.stretch > 0 else 0.0
    sc = (s * (1 + e), s / math.sqrt(1 + e), s)
    free = [footprint(q, sc) + (q,) for q in (rand_orient() for _ in range(a.m))]
    best = None
    for _ in range(a.k):
        rr = (rin - 0.02) * math.sqrt(rng.random())
        th = rng.random() * 2 * math.pi
        ix0 = int(round(rr * math.cos(th) / c + half))
        iy0 = int(round(rr * math.sin(th) / c + half))
        if rin - rr < a.wallband:
            q = wall_orient(th)
            cands = [footprint(q, sc) + (q,)]
            wall = True
        else:
            cands = free
            wall = False
        for fp in cands:
            r = place_score(fp[:7], ix0, iy0)
            if r is None:
                continue
            z, sl = r
            key = z + fp[4]
            if best is None or key < best[0]:
                best = (key, z, ix0, iy0, sl, fp, wall)
    if best is None:
        continue
    key, z, ix0, iy0, sl, fp, wall = best
    for _ in range(a.rattle):
        q0 = fp[7]
        ax = Vector((rng.normal(), rng.normal(), rng.normal())).normalized()
        q1 = Quaternion(ax, math.radians(a.rattle_deg) * rng.random()) @ q0
        f1 = footprint(q1, sc) + (q1,)
        jx, jy = ix0 + int(rng.integers(-1, 2)), iy0 + int(rng.integers(-1, 2))
        r1 = place_score(f1[:7], jx, jy)
        if r1 is not None and r1[0] < z - 1e-4:
            z, sl = r1
            ix0, iy0, fp = jx, jy, f1
    under, top, cov = fp[0], fp[1], fp[2]
    q = fp[7]
    sub = H[sl]
    sub[cov] = np.maximum(sub[cov], z + top[cov])
    x, y = (ix0 - half) * c, (iy0 - half) * c
    nwall += wall
    pel.append([round(x, 6), round(y, 6), round(z, 6), round(q.w, 8), round(q.x, 8), round(q.y, 8), round(q.z, 8),
                round(sc[0], 6), round(sc[1], 6), round(sc[2], 6)])
    if len(pel) % 100 == 0:
        lev = level()
        rin = J.inner_radius_at(lev + 0.1)
    if len(pel) % 1000 == 0:
        print(f'PACK {len(pel)} pellets, level {lev:.3f}, {time.time() - t1:.0f}s', flush=True)
lev = level()
out = {'method': 'heightfield deposition', 'seed': a.seed, 'k': a.k, 'm': a.m, 'rattle': a.rattle, 'cell': c, 'top': a.top,
       'level': round(lev, 4), 'pellet': J.PELLET, 'count': len(pel), 'wall': nwall, 'seconds': round(time.time() - t1, 1),
       'pellets': pel}
with open(a.out, 'w') as f:
    json.dump(out, f)
print(f'PACK done: {len(pel)} pellets ({nwall} leaning on the glass), median surface {lev:.3f} (target {a.top}), {time.time() - t1:.1f}s', flush=True)
