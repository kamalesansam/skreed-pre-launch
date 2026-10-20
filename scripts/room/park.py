# Section 4 part two, option B's park (docs/specs/section-4-world.md 2 "Option B", 3 "Option B's park", 6): our own
# stylised, compressed Central Park in metres, built and baked here in Blender 5.2 headless from general knowledge of the
# park (no map data is read): the Mall under its elms, Bethesda Terrace with its arcade under the drive and the fountain
# on the lower terrace, Sheep Meadow with the skyline as far cards, and Bow Bridge over the Lake, about 60 m apart in the
# catalog order of the lands (the phone case, the MagSafe wallet, the Lenskin, the AirPods case).
#   /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python scripts/room/park.py -- scripts/room/out/park [size=2048] [samples=256] [looks=0]
# writes out/park-raw.glb (float positions, the lightmap UV as TEXCOORD_0, COLOR_0 where a mesh carries colours, Y up, one
# node per mesh and the instanced prototypes once each at the origin), out/park-lightmap.png (size, sRGB-encoded, irradiance
# only: the static meshes' albedo stays per material, so the map is smooth and small), out/park-report.json (the materials
# and their light, the instances, the four land poses, the flights between them and their checks) and, with looks=1, four
# Cycles look renders. scripts/room/pack.mjs park then quantises and meshopt-encodes the GLB, encodes the lightmap at 1024
# and writes src/assets/room/park/park.json. Blender is Z up here (x east, y north, z up; the Mall's level at z = 0).
#
# How it is lit (the units are Cycles' DIFFUSE bake, irradiance over pi, which is the radiance of a white Lambertian):
#   static meshes   one Cycles bake of direct and indirect light, no colour, into one atlas; stored as E / E_open x UNIT,
#                   where E_open is open, sunlit level ground (a calibration quad baked alone), so the runtime's albedo x
#                   map / UNIT is the albedo in full sun
#   instanced props the trees, benches and lamps are instanced (EXT_mesh_gpu_instancing), so they cannot share the atlas:
#                   each prototype's faces are shaded here analytically in the same units (the sun with self-shadow by ray
#                   cast, leaves letting LEAF_T of it through, the same sky by 48 cosine-weighted rays, the ground's bounce)
#                   and stored lit as COLOR_0, flat per face; each instance then carries one shade for what its neighbours
#                   hide of the sun and the sky (_COLOR_0). The analytic open ground matches the bake's to 0.1 percent.
#   in place        the bridge's railing (hundreds of slivers, too fine for the atlas): shaded per face against the whole
#                   park in the same way, stored lit as COLOR_0
#   unlit           the sky dome, the skyline cards and the far ground carry their final colour as COLOR_0
# Each land pose carries two exposures: the scene's (the view's mean luminance brought toward a photograph's, 1 to 2.4,
# but never so far that more than 1 percent of its frame clips) and the sky's (the unlit meshes', held under 0.92 on the
# brightest channel in view); each flight carries both on its look keys. The flights are designed in time under the
# runtime's own ease and curves (see "The flights" below), and checked: their view's turn rate at 2600 and 4500 ms, their
# height over the surface, clearance and headroom, and the share of their frames that clip. The run exits 1 when a check
# fails, so pack.mjs never packs such a park (it refuses the report too).
import bpy, bmesh, math, sys, os, time, json, random, bisect
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else 'scripts/room/out/park'
SIZE = int(argv[1]) if len(argv) > 1 else 2048
SAMPLES = int(argv[2]) if len(argv) > 2 else 256
LOOKS = int(argv[3]) if len(argv) > 3 else 0
os.makedirs(OUT, exist_ok=True)
t0 = time.time()

def lin(h):
    """an sRGB hex as linear rgb"""
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)
def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)
def lum(c): return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def mul(c, k): return tuple(v * k for v in c)

# ---- the frame (metres; the levels of the real park, compressed)
UPPER, LOWER, WATER = 0.0, -4.5, -5.0      # the Mall and the drive; the lower terrace and the lakeside; the Lake
DRIVE = (-1.0, 7.0)                        # the drive (Terrace Drive) crosses the park from west to east at z = 0
BANK_END = 20.0                            # north of the drive the bank falls to the lakeside level by here
TERRACE = (-16.0, 16.0, 7.0, 26.0)         # the lower terrace: x0, x1, y0, y1 (its north edge is the Lake)
ARC_X, ARC_Y, ARC_CEIL = 11.0, (0.0, 6.0), -0.7   # the arcade's hall: x -11..11, y 0..6 under the drive, 3.8 m high
FACADE = (6.0, 7.0)                        # the arcade's north wall with its five arches onto the terrace
SPRING, ARCH_R = -2.6, 1.7                 # the arches spring 1.9 m above the floor and rise 1.7 m
CUTS = [(-3.5, 3.5)]                       # the Mall's stair cut down from the plaza (y -10 to -1), straight north
CUT_Y = (-10.0, -1.0)
# the two side stairs leave the arcade's ends on the diagonal, rising away from it (the west one toward Sheep Meadow, so
# the second flight climbs it head on): each its foot's outer corner on the vestibule's outer wall, its heading up the
# flight, its width; 26 steps over 9 m, as the Mall's stair
SIDE_FOOT, SIDE_H, SIDE_W, SIDE_RUN = (-16.0, -0.5), 235.0, 4.0, 9.0
WALL_T = 0.4                               # balustrade and cheek walls
BAL_H = 1.0
PLAZA = (-26.0, 26.0, -12.0, -1.3)         # the paved plaza round the three stair heads, up to the drive's curb
FOUNTAIN = (0.0, 16.5)
MEADOW = ((-66.0, -48.0), (32.0, 26.0))    # Sheep Meadow: an ellipse kept level and free of trees
BRIDGE = dict(x=-40.0, y0=29.0, y1=50.8, w=3.4, z_end=-4.40, z_mid=-3.05, chord_end=-5.1, chord_mid=-3.55)
LAKE_X = (-102.0, 50.0)
EYE = 1.5                                  # the lifestyle pictures' camera: a person's eye level
# one sun for the four lands (section-4-world.md 3, the lands' light): low and warm from just south of east, so land 1,
# facing north up the Mall, is lit low from frame right as its photo is (its person stands where the sun's line threads
# both east rows of elms between their trunks); lands 2 and 4 stand in open shade (the arcade,
# and a tree on the bank between the bridge pose and the sun); land 3 cannot be overcast under one sun and stands in a
# ring tree's shade instead (the gap is recorded for Sam in the report)
SUN_AZ, SUN_EL = 100.0, 22.0
SUN_RGB, SUN_W = (1.0, 0.88, 0.72), 4.6    # its colour and strength (W/m2, Cycles)
SKY_W = 0.95                               # the world's strength (the shade-to-sun ratio on open ground lands near a third)
UNIT = 0.70                                # the stored lightmap value of open, sunlit level ground
L_SUN = Vector((math.sin(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_EL)), math.cos(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_EL)), math.sin(math.radians(SUN_EL))))

def side_plan(east):
    """a side stair in plan: its head's and foot's corners (W on the vestibule's side, E toward the Mall), the directions
    up the flight (U) and across it from W to E (V), the runs from the head at which the walls' inner and outer lines
    meet the drive's south edge (the E line runs on past the foot as the court's wall and meets the arcade's south wall
    at C), and the footprint the plaza is cut round (convex: the flight, its walls and the court, up to the drive)"""
    h = math.radians(SIDE_H); U = Vector((math.sin(h), math.cos(h))); V = Vector((-U.y, U.x))
    W0 = Vector(SIDE_FOOT); E0 = W0 + V * SIDE_W; W1 = W0 + U * SIDE_RUN; E1 = E0 + U * SIDE_RUN
    at = lambda A, y0: (A.y - y0) / U.y
    P = dict(r_wi=at(W1, DRIVE[0]), r_ei=at(E1, DRIVE[0]), r_e0=at(E1, ARC_Y[0]), r_wo=at(W1 - V * WALL_T, DRIVE[0]), r_eo=at(E1 + V * WALL_T, DRIVE[0]))
    P.update(U=U, V=V, W0=W0, E0=E0, W1=W1, E1=E1)
    if east:
        for k in ('U', 'V', 'W0', 'E0', 'W1', 'E1'): P[k] = Vector((-P[k].x, P[k].y))
    U, V, W1, E1 = P['U'], P['V'], P['W1'], P['E1']
    P['C'] = E1 - U * P['r_e0']
    P['foot'] = [W1 - U * P['r_wo'] - V * WALL_T, W1 - V * WALL_T, E1 + V * WALL_T, E1 - U * P['r_eo'] + V * WALL_T]
    P['landing'] = [P['W0'], P['E0'], P['C'], Vector((P['W0'].x, ARC_Y[0]))]
    return P
SIDES = [side_plan(False), side_plan(True)]
def cross2(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
def orient(poly): return 1.0 if sum(cross2(poly[0], poly[i], poly[i + 1]) for i in range(1, len(poly) - 1)) > 0 else -1.0
def in_poly(p, poly):
    s = orient(poly)
    return all(cross2(poly[i], poly[(i + 1) % len(poly)], p) * s >= -1e-9 for i in range(len(poly)))
def clip_half(poly, a, b, keep_left):
    """Sutherland-Hodgman: the part of a convex polygon (2D tuples) on the left (or right) of the line a to b"""
    out = []
    side = lambda p: cross2(a, b, p) if keep_left else -cross2(a, b, p)
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]; sp, sq = side(p), side(q)
        if sp >= 0: out.append(p)
        if (sp >= 0) != (sq >= 0):
            t = sp / (sp - sq); out.append((p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t))
    return out if len(out) >= 3 else []
def minus(poly, hole):
    """a convex polygon less a convex hole, as convex pieces: for each of the hole's edges, the part outside it and
    inside the edges before it"""
    hole = [tuple(p) for p in hole]; s = orient(hole) > 0; pieces = []
    for i in range(len(hole)):
        a, b = hole[i], hole[(i + 1) % len(hole)]
        piece = clip_half(poly, a, b, not s)
        for j in range(i):
            if not piece: break
            piece = clip_half(piece, hole[j], hole[(j + 1) % len(hole)], s)
        if piece: pieces.append(piece)
    return pieces
def rect_meets(x0, x1, y0, y1, poly):
    """whether an axis-aligned rectangle overlaps a convex polygon (by separating axes)"""
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    if max(xs) <= x0 or min(xs) >= x1 or max(ys) <= y0 or min(ys) >= y1: return False
    s = orient(poly); cs = ((x0, y0), (x1, y0), (x1, y1), (x0, y1))
    for i in range(len(poly)):
        if all(cross2(poly[i], poly[(i + 1) % len(poly)], c) * s <= 1e-9 for c in cs): return False
    return True

# the albedos (linear; image content, not palette colours: E-S4-garden's reading for the park's scene colours)
ALB = {
    'lawn': lin('#6f9a3e'), 'meadow': lin('#7aa444'), 'forest': lin('#56702f'), 'mud': lin('#77794f'),
    'promenade': lin('#c8beae'), 'path': lin('#86817a'), 'drive': lin('#696764'), 'granite': lin('#a19d95'),
    'stone': lin('#c2ae8d'), 'water': lin('#5a8784'), 'iron': lin('#ddd5c0'), 'deck': lin('#7d6650'),
    'bark': lin('#5b4c3e'), 'elm': lin('#4f7d2c'), 'plane': lin('#5b8533'), 'willow': lin('#7f9f3f'), 'round': lin('#6c923d'),
    'far': lin('#4a7232'), 'wood': lin('#7a6448'), 'ironwork': lin('#2e3631'), 'glass': lin('#ece6d6'),
}
TILE = [lin('#c98b4a'), lin('#e3d3b0'), lin('#3f7d7a'), lin('#9b4a3a')]   # the arcade's ceiling tiles: ochre, cream, teal, deep red

# ---- the Lake and the ground
def shores(x):
    """the Lake's south and north shore at x (equal where there is no water)"""
    if x <= LAKE_X[0] or x >= LAKE_X[1]: return 0.0, 0.0
    if x < 0: ys = 26.0 + smooth(-16, -22, x) * (0.4 + 1.2 * math.sin(x / 7.3) + 2.6 * math.exp(-((x + 40) / 6) ** 2))
    else: ys = 26.0 + smooth(16, 22, x) * (-0.6 + 0.9 * math.sin(x / 6))
    yn = 63.0 + 3.0 * math.sin(x / 11 + 1) - 11.5 * math.exp(-((x + 40) / 7) ** 2)
    env = smooth(LAKE_X[0], LAKE_X[0] + 14, x) * (1 - smooth(LAKE_X[1] - 14, LAKE_X[1], x))
    mid = (ys + yn) / 2
    return mid + (ys - mid) * env, mid + (yn - mid) * env

def in_meadow(x, y, k=1.0):
    (cx, cy), (a, b) = MEADOW
    return ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 < k * k
def roll(x, y):
    """the upper level's gentle knolls, level on the drive, the plaza, the Mall's band and the meadow"""
    f = smooth(-13.0, -20.0, y) * smooth(13.0, 20.0, abs(x))
    (cx, cy), (a, b) = MEADOW
    f *= smooth(1.05, 1.35, math.sqrt(((x - cx) / a) ** 2 + ((y - cy) / b) ** 2))
    return f * (0.55 * math.sin(x / 13 + 0.7) * math.sin(y / 11 + 0.3) + 0.22 * math.sin(x / 5.3 + y / 7.1))
def z_field(x, y):
    if y <= DRIVE[1]: return UPPER + roll(x, y)
    z = UPPER + (LOWER - UPPER) * smooth(DRIVE[1], BANK_END, y)
    ys, yn = shores(x)
    if yn - ys > 0.5: z -= 0.95 * smooth(-1.2, 2.5, min(y - ys, yn - y))
    hill = yn if yn - ys > 0.5 else 62.0
    if y > hill:
        z += 6.5 * smooth(hill + 2, hill + 32, y) + 0.7 * smooth(hill + 4, hill + 12, y) * math.sin(x / 9.0 + 0.4) * math.sin(y / 7.0)
    return z

def grid_lines(lo, hi, core, step, extra):
    vs = set(round(v, 3) for v in extra)
    v = lo
    while v < hi + 1e-6:
        vs.add(round(v, 3)); v += step if core[0] <= v < core[1] else 2 * step
    vs.add(hi)
    out = sorted(vs)
    return [v for i, v in enumerate(out) if i == 0 or v - out[i - 1] > 0.35]   # no sliver cells
XS = grid_lines(-124.0, 68.0, (-104.0, 44.0), 4.0, [-16.4, -16.0, -3.9, 3.9, 16.0, 16.4])
YS = grid_lines(-96.0, 88.0, (-92.0, 64.0), 4.0, [CUT_Y[0], DRIVE[0], DRIVE[1], BANK_END, TERRACE[3]])
ZG = [[z_field(x, y) for y in YS] for x in XS]

def zmesh(x, y):
    """the terrain as triangulated (each cell split along its (i, j)-(i+1, j+1) diagonal), so things sit on what is drawn"""
    i = max(0, min(len(XS) - 2, bisect.bisect_right(XS, x) - 1)); j = max(0, min(len(YS) - 2, bisect.bisect_right(YS, y) - 1))
    s = (x - XS[i]) / (XS[i + 1] - XS[i]); t = (y - YS[j]) / (YS[j + 1] - YS[j])
    z00, z10, z01, z11 = ZG[i][j], ZG[i + 1][j], ZG[i][j + 1], ZG[i + 1][j + 1]
    return z00 + s * (z10 - z00) + t * (z11 - z10) if s >= t else z00 + t * (z01 - z00) + s * (z11 - z01)

# ---- a face soup per material, with the winding fixed toward a hint direction (Newell's normal)
class Geo:
    def __init__(self): self.faces = []; self.leaf = set()   # (points, colour or None); the indices of leaf faces (they let light through)
    def face(self, pts, n=None, col=None):
        pts = [Vector(p) for p in pts]
        if n is not None:
            nn = Vector((0.0, 0.0, 0.0))
            for i in range(len(pts)):
                a, b = pts[i], pts[(i + 1) % len(pts)]
                nn.x += (a.y - b.y) * (a.z + b.z); nn.y += (a.z - b.z) * (a.x + b.x); nn.z += (a.x - b.x) * (a.y + b.y)
            if nn.dot(Vector(n)) < 0: pts.reverse()
        self.faces.append((pts, col))
    def tris(self): return sum(len(p) - 2 for p, _ in self.faces)
G = {}
def geo(name):
    if name not in G: G[name] = Geo()
    return G[name]

def box(g, lo, hi, col=None, skip=()):
    (x0, y0, z0), (x1, y1, z1) = lo, hi
    F = {'-z': ([(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)], (0, 0, -1)), '+z': ([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], (0, 0, 1)),
         '-y': ([(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], (0, -1, 0)), '+y': ([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], (0, 1, 0)),
         '-x': ([(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)], (-1, 0, 0)), '+x': ([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], (1, 0, 0))}
    for k, (pts, n) in F.items():
        if k not in skip: g.face(pts, n, col)
def obox(g, c, ax, col=None, skip=()):
    """an oriented box: c its centre, ax its three half-axis vectors"""
    c = Vector(c); a, b, d = (Vector(v) for v in ax)
    for s, u, v, w, k in ((1, a, b, d, '+a'), (-1, a, b, d, '-a'), (1, b, a, d, '+b'), (-1, b, a, d, '-b'), (1, d, a, b, '+c'), (-1, d, a, b, '-c')):
        if k in skip: continue
        f = c + u * s
        g.face([f - v - w, f + v - w, f + v + w, f - v + w], u * s, col)
def frustum(g, a, b, r0, r1, n, col=None, cap=True, rot=0.0):
    a, b = Vector(a), Vector(b); ax = (b - a).normalized()
    u = ax.orthogonal().normalized(); w = ax.cross(u)
    ring = lambda c, r: [c + (u * math.cos(rot + 2 * math.pi * k / n) + w * math.sin(rot + 2 * math.pi * k / n)) * r for k in range(n)]
    A, B = ring(a, r0), ring(b, r1); m = (a + b) / 2
    for k in range(n):
        k1 = (k + 1) % n
        if r1 <= 1e-6: g.face([A[k], A[k1], b], (A[k] + A[k1]) / 2 - m, col)
        else: g.face([A[k], A[k1], B[k1], B[k]], (A[k] + A[k1] + B[k] + B[k1]) / 4 - m, col)
    if cap and r1 > 1e-6: g.face(B, ax, col)

PHI = (1 + 5 ** 0.5) / 2
ICO_V = [(-1, PHI, 0), (1, PHI, 0), (-1, -PHI, 0), (1, -PHI, 0), (0, -1, PHI), (0, 1, PHI), (0, -1, -PHI), (0, 1, -PHI), (PHI, 0, -1), (PHI, 0, 1), (-PHI, 0, -1), (-PHI, 0, 1)]
ICO_F = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
def blob(g, c, s, rng, base, jit=0.16, var=0.12, flat=0.55):
    """a faceted canopy cluster: a jittered icosahedron, its underside flattened, each face its own shade of the leaf"""
    c = Vector(c); k0 = (1 + PHI * PHI) ** 0.5
    rot = Matrix.Rotation(rng.uniform(0, 2 * math.pi), 3, 'Z') @ Matrix.Rotation(rng.uniform(-0.25, 0.25), 3, 'X')
    vs = []
    for v in ICO_V:
        k = 1 + rng.uniform(-jit, jit)
        p = rot @ Vector((v[0] / k0 * k, v[1] / k0 * k, v[2] / k0 * k))
        p.z = max(p.z, -flat)
        vs.append(c + Vector((p.x * s[0], p.y * s[1], p.z * s[2])))
    for f in ICO_F:
        pts = [vs[i] for i in f]; ctr = (pts[0] + pts[1] + pts[2]) / 3
        sh = 1 + rng.uniform(-var, var)
        g.leaf.add(len(g.faces)); g.face(pts, ctr - c, tuple(min(1.0, x * sh) for x in base))

# ---- the terrain: the lawns, cut around the stairs and the terrace, and left out under the water
def cell_skipped(x0, x1, y0, y1, zs):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if CUT_Y[0] < cy < CUT_Y[1] and any(a - WALL_T < cx < b + WALL_T for a, b in CUTS): return True
    if any(rect_meets(x0, x1, y0, y1, S['foot']) for S in SIDES): return True   # (the plaza's paving covers the rest of the cell)
    if TERRACE[0] < cx < TERRACE[1] and TERRACE[2] < cy < TERRACE[3]: return True
    return max(zs) < WATER - 0.25
def lawn_col(x, y):
    ys, yn = shores(x)
    hill = yn if yn - ys > 0.5 else 62.0
    base = ALB['meadow'] if in_meadow(x, y, 1.03) else ALB['lawn']
    f = smooth(hill + 2, hill + 10, y) if y > DRIVE[1] else 0.0
    base = tuple(base[i] * (1 - f) + ALB['forest'][i] * f for i in range(3))
    if y > DRIVE[1] and yn - ys > 0.5 and ys - 0.4 < y < yn + 0.4: base = ALB['mud']
    n = 1 + 0.07 * math.sin(x / 4.7 + 1.3) * math.sin(y / 5.9) + 0.05 * math.sin((x + y) / 2.3)
    return mul(base, n)
CORE = (-92.0, 30.0, -92.0, 62.0)
for i in range(len(XS) - 1):
    for j in range(len(YS) - 1):
        x0, x1, y0, y1 = XS[i], XS[i + 1], YS[j], YS[j + 1]
        zs = [ZG[i][j], ZG[i + 1][j], ZG[i + 1][j + 1], ZG[i][j + 1]]
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        if cell_skipped(x0, x1, y0, y1, zs): continue
        g = geo('lawn' if CORE[0] <= cx <= CORE[1] and CORE[2] <= cy <= CORE[3] else 'lawn_outer')
        p00, p10, p11, p01 = (x0, y0, zs[0]), (x1, y0, zs[1]), (x1, y1, zs[2]), (x0, y1, zs[3])
        for tri in ((p00, p10, p11), (p00, p11, p01)):
            g.face(tri, (0, 0, 1), [lawn_col(p[0], p[1]) for p in tri])

# ---- the Lake: one surface, reaching under the banks (the banks hide its edge)
def water_strip():
    g = geo('water'); xs = [LAKE_X[0] + 1 + k * 3.0 for k in range(int((LAKE_X[1] - LAKE_X[0] - 2) / 3.0) + 1)]
    prev = None
    for x in xs:
        ys, yn = shores(x)
        if yn - ys < 1.2: prev = None; continue
        lo, hi = (ys - 1.0 if not (TERRACE[0] - 1 < x < TERRACE[1] + 1) else TERRACE[3] - 0.6), yn + 1.0
        if prev: g.face([(prev[0], prev[1], WATER), (x, lo, WATER), (x, hi, WATER), (prev[0], prev[2], WATER)], (0, 0, 1))
        prev = (x, lo, hi)
water_strip()

# ---- paths: strips laid on the terrain, each at its own height so crossings never fight
def cr(pts, step=1.6):
    """a uniform Catmull-Rom through 2D points, resampled about every step metres"""
    if len(pts) == 2:
        (ax, ay), (bx, by) = pts; n = max(1, int(math.hypot(bx - ax, by - ay) / step))
        return [(ax + (bx - ax) * k / n, ay + (by - ay) * k / n) for k in range(n + 1)]
    P = [pts[0]] + list(pts) + [pts[-1]]; out = []
    for k in range(1, len(P) - 2):
        p0, p1, p2, p3 = (Vector((*P[k + d], 0)) for d in (-1, 0, 1, 2))
        n = max(2, int((p2 - p1).length / step))
        for s in range(n):
            t = s / n
            q = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
            out.append((q.x, q.y))
    out.append(pts[-1]); return out
def strip(g, pts, width, h, closed=False, zf=None):
    zf = zf or (lambda x, y: zmesh(x, y))
    n = len(pts); L, Rr = [], []
    for k in range(n):
        a = pts[(k - 1) % n] if (closed or k > 0) else pts[k]; b = pts[(k + 1) % n] if (closed or k < n - 1) else pts[k]
        dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / d, dx / d; w = width / 2
        L.append((pts[k][0] + nx * w, pts[k][1] + ny * w)); Rr.append((pts[k][0] - nx * w, pts[k][1] - ny * w))
    for k in range(n if closed else n - 1):
        k1 = (k + 1) % n
        q = [Rr[k], Rr[k1], L[k1], L[k]]
        g.face([(x, y, zf(x, y) + h) for x, y in q], (0, 0, 1))
def ellipse(c, a, b, n=72): return [(c[0] + a * math.cos(2 * math.pi * k / n), c[1] + b * math.sin(2 * math.pi * k / n)) for k in range(n)]
(MCX, MCY), (MA, MB) = MEADOW
PATHS = [   # name, material, width, height above the terrain, centreline, closed
    ('mall', 'promenade', 10.0, 0.050, [(0.0, -94.0), (0.0, -12.0)], False),
    ('meadow-link', 'path', 3.2, 0.040, [(-26.0, -11.0), (-29.5, -15.0), (-33.5, -20.5), (-41.5, -27.8), (-42.4, -28.3)], False),
    ('meadow-loop', 'path', 3.2, 0.043, ellipse((MCX, MCY), MA + 2.6, MB + 2.6), True),
    ('meadow-north', 'path', 3.0, 0.046, [(-67.0, -19.2), (-67.0, -10.0), (-67.0, -1.4)], False),
    ('mall-west', 'path', 3.0, 0.049, [(-5.0, -72.0), (-14.0, -71.0), (-24.0, -67.5), (-34.6, -60.1), (-35.5, -59.7)], False),
    ('mall-east', 'path', 3.0, 0.040, [(5.0, -52.0), (14.0, -54.0), (24.0, -58.0), (36.0, -63.0), (50.0, -66.0), (68.0, -68.0)], False),
    ('south-cross', 'path', 3.0, 0.044, [(-124.0, -89.0), (-60.0, -88.0), (-5.0, -89.5)], False),
    ('south-cross-e', 'path', 3.0, 0.044, [(5.0, -89.5), (40.0, -88.5), (68.0, -89.0)], False),
    ('bank-west', 'path', 3.0, 0.040, [(-67.0, 7.4), (-64.5, 12.5), (-60.6, 17.4), (-57.2, 21.0)], False),
    ('lakeside-west', 'path', 3.2, 0.045, [(-16.4, 22.6), (-26.0, 22.4), (-36.0, 22.7), (-46.0, 22.3), (-56.0, 22.2), (-70.0, 22.8), (-86.0, 22.1), (-100.0, 22.5), (-124.0, 23.0)], False),
    ('bridge-south', 'path', 3.2, 0.049, [(-40.0, 23.0), (-40.0, 27.4)], False),
    ('lakeside-east', 'path', 3.2, 0.045, [(16.4, 22.0), (28.0, 21.6), (40.0, 21.0), (52.0, 20.9), (68.0, 21.4)], False),
    ('ramble-1', 'path', 2.6, 0.040, [(-40.0, 52.6), (-41.5, 57.0), (-46.0, 61.5), (-54.0, 66.5), (-60.0, 74.0), (-62.0, 88.0)], False),
    ('ramble-2', 'path', 2.6, 0.044, [(-40.6, 57.0), (-33.0, 60.5), (-24.0, 63.5), (-14.0, 68.0), (-6.0, 76.0), (-2.0, 88.0)], False),
    ('drive', 'drive', 8.0, 0.030, [(-124.0, 3.0), (68.0, 3.0)], False),
]
PATH_LINES = []
for name, mat, w, h, ctl, closed in PATHS:
    pts = cr(ctl, 2.0) if not closed else ctl
    strip(geo(mat), pts, w, h, closed)
    PATH_LINES.append((name, w, pts + ([pts[0]] if closed else [])))

# the curbs of the drive (granite), broken where the stair openings' balustrades meet it
def curb(y0, y1, x0, x1):
    g = geo('granite'); n = max(1, int((x1 - x0) / 6))
    for k in range(n):
        a, b = x0 + (x1 - x0) * k / n, x0 + (x1 - x0) * (k + 1) / n
        za, zb = zmesh(a, (y0 + y1) / 2), zmesh(b, (y0 + y1) / 2)
        g.face([(a, y0, za + 0.15), (b, y0, zb + 0.15), (b, y1, zb + 0.15), (a, y1, za + 0.15)], (0, 0, 1))
        g.face([(a, y0, za - 0.05), (b, y0, zb - 0.05), (b, y0, zb + 0.15), (a, y0, za + 0.15)], (0, -1, 0))
        g.face([(a, y1, za - 0.05), (b, y1, zb - 0.05), (b, y1, zb + 0.15), (a, y1, za + 0.15)], (0, 1, 0))
def band_x(poly, y0, y1):
    """the x extent of a convex polygon between y0 and y1"""
    q = clip_half(clip_half([tuple(p) for p in poly], (0.0, y0), (1.0, y0), True), (0.0, y1), (1.0, y1), False)
    return (min(p[0] for p in q), max(p[0] for p in q))
south_gaps = sorted([(a - WALL_T, b + WALL_T) for a, b in CUTS] + [band_x(S['foot'], DRIVE[0] - 0.3, DRIVE[0]) for S in SIDES])
xa = -124.0
for a, b in south_gaps: curb(DRIVE[0] - 0.3, DRIVE[0], xa, a); xa = b
curb(DRIVE[0] - 0.3, DRIVE[0], xa, 68.0)
curb(DRIVE[1], DRIVE[1] + 0.3, -124.0, TERRACE[0] - WALL_T); curb(DRIVE[1], DRIVE[1] + 0.3, TERRACE[1] + WALL_T, 68.0)

# ---- Bethesda: the plaza at the Mall's end, the three stairs down under the drive, the arcade, the terrace, the fountain
PZ = 0.05
pv = geo('promenade')
def flat(g, x0, x1, y0, y1, z, n=(0, 0, 1), col=None): g.face([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], n, col)
# the plaza: one rectangle up to the drive's curb, less the three stairs' footprints, in convex pieces
holes = [[(a - WALL_T, CUT_Y[0]), (b + WALL_T, CUT_Y[0]), (b + WALL_T, DRIVE[0]), (a - WALL_T, DRIVE[0])] for a, b in CUTS] + [S['foot'] for S in SIDES]
pieces = [[(PLAZA[0], PLAZA[2]), (PLAZA[1], PLAZA[2]), (PLAZA[1], PLAZA[3]), (PLAZA[0], PLAZA[3])]]
for hole in holes: pieces = [q for p_ in pieces for q in minus(p_, hole)]
for p_ in pieces: pv.face([(x, y, PZ) for x, y in p_], (0, 0, 1))

st = geo('stone')
NSTEP = 26
RISE, RUN = (UPPER - LOWER) / NSTEP, (CUT_Y[1] - CUT_Y[0]) / NSTEP
def stair_z(y):
    """the tread under y in a stair cut (descending north)"""
    k = max(0, min(NSTEP - 1, int((y - CUT_Y[0]) / RUN)))
    return UPPER - (k + 1) * RISE if y > CUT_Y[0] else UPPER
for a, b in CUTS:
    for k in range(NSTEP):
        yk, yk1 = CUT_Y[0] + k * RUN, CUT_Y[0] + (k + 1) * RUN
        ztop, z = UPPER - k * RISE, UPPER - (k + 1) * RISE
        geo("steps").face([(a, yk, z), (b, yk, z), (b, yk, ztop), (a, yk, ztop)], (0, 1, 0))     # the riser
        flat(geo("steps"), a, b, yk, yk1, z)                                                  # the tread
    # the cheek walls: inner faces from the line through the steps' inner corners, a cap and an outer face
    zline = lambda y: UPPER - RISE - (y - CUT_Y[0]) * (RISE / RUN)
    for xw, s in ((a, 1), (b, -1)):
        xo = xw - s * WALL_T
        st.face([(xw, CUT_Y[0], zline(CUT_Y[0])), (xw, CUT_Y[1], zline(CUT_Y[1])), (xw, CUT_Y[1], BAL_H), (xw, CUT_Y[0], BAL_H)], (s, 0, 0))
        flat(st, min(xw, xo), max(xw, xo), CUT_Y[0], DRIVE[0], BAL_H)
        st.face([(xo, CUT_Y[0], -0.05), (xo, DRIVE[0], -0.05), (xo, DRIVE[0], BAL_H), (xo, CUT_Y[0], BAL_H)], (-s, 0, 0))
        st.face([(min(xw, xo), CUT_Y[0], -0.05), (max(xw, xo), CUT_Y[0], -0.05), (max(xw, xo), CUT_Y[0], BAL_H), (min(xw, xo), CUT_Y[0], BAL_H)], (0, -1, 0))
        st.face([(xo, DRIVE[0], 0.0), (xo, DRIVE[0] + WALL_T, 0.0), (xo, DRIVE[0] + WALL_T, BAL_H), (xo, DRIVE[0], BAL_H)], (-s, 0, 0))
    # the balustrade across the opening's top, on the drive side, with the deck's edge below it
    st.face([(a, DRIVE[0], ARC_CEIL), (b, DRIVE[0], ARC_CEIL), (b, DRIVE[0], BAL_H), (a, DRIVE[0], BAL_H)], (0, -1, 0))
    flat(st, a - WALL_T, b + WALL_T, DRIVE[0], DRIVE[0] + WALL_T, BAL_H)
    st.face([(a - WALL_T, DRIVE[0] + WALL_T, 0.0), (b + WALL_T, DRIVE[0] + WALL_T, 0.0), (b + WALL_T, DRIVE[0] + WALL_T, BAL_H), (a - WALL_T, DRIVE[0] + WALL_T, BAL_H)], (0, 1, 0))
    # under the drive: the stair's foot (y -1 to 0) between the walls carried down to the floor, with its ceiling
    for xw, s in ((a, 1), (b, -1)):
        st.face([(xw, DRIVE[0], LOWER), (xw, ARC_Y[0], LOWER), (xw, ARC_Y[0], ARC_CEIL), (xw, DRIVE[0], ARC_CEIL)], (s, 0, 0))
    flat(pv, a, b, DRIVE[0], ARC_Y[0], LOWER)
    flat(st, a, b, DRIVE[0], ARC_Y[0], ARC_CEIL, (0, 0, -1))
# the side stairs on the diagonal (SIDES; run r measured down the flight from its head): treads and risers; the cheek walls,
# their inner faces from the line through the steps' inner corners up to the balustrade in the open and to the deck's
# underside beneath the drive, the E wall running on past the foot as the court's wall to the arcade's south wall; the
# court and the landing at the floor's level; the drive's balustrade across the opening; the deck's underside over it
for i_s, S in enumerate(SIDES):
    U, V, W1, E1, W0 = S['U'], S['V'], S['W1'], S['E1'], S['W0']
    sg = geo(('steps_w', 'steps_e')[i_s])
    Wl = lambda r, W1=W1, U=U: W1 - U * r
    El = lambda r, E1=E1, U=U: E1 - U * r
    v3 = lambda v: (v.x, v.y, 0.0)
    zl = lambda r: UPPER - RISE - r * (RISE / RUN)
    for k in range(NSTEP):
        r0, r1 = k * RUN, (k + 1) * RUN; ztop, z = UPPER - k * RISE, UPPER - (k + 1) * RISE
        sg.face([(*Wl(r0), z), (*El(r0), z), (*El(r0), ztop), (*Wl(r0), ztop)], v3(-U))   # the riser
        sg.face([(*Wl(r0), z), (*El(r0), z), (*El(r1), z), (*Wl(r1), z)], (0, 0, 1))      # the tread
    def wall(line, r0, r1, bot, top, n):
        st.face([(*line(r0), bot(r0)), (*line(r1), bot(r1)), (*line(r1), top), (*line(r0), top)], n)
    floor_ = lambda r: LOWER - 0.05
    wall(Wl, 0.0, S['r_wi'], zl, BAL_H, v3(V)); wall(Wl, S['r_wi'], SIDE_RUN, zl, ARC_CEIL, v3(V))
    wall(El, 0.0, SIDE_RUN, zl, BAL_H, v3(-V)); wall(El, SIDE_RUN, S['r_ei'], floor_, BAL_H, v3(-V)); wall(El, S['r_ei'], S['r_e0'], floor_, ARC_CEIL, v3(-V))
    Wo = lambda r: Wl(r) - V * WALL_T
    Eo = lambda r: El(r) + V * WALL_T
    st.face([(*Wl(0.0), BAL_H), (*Wl(S['r_wi']), BAL_H), (*Wo(S['r_wo']), BAL_H), (*Wo(0.0), BAL_H)], (0, 0, 1))     # the caps
    st.face([(*El(0.0), BAL_H), (*El(S['r_ei']), BAL_H), (*Eo(S['r_eo']), BAL_H), (*Eo(0.0), BAL_H)], (0, 0, 1))
    wall(Wo, 0.0, S['r_wo'], lambda r: -0.05, BAL_H, v3(-V)); wall(Eo, 0.0, S['r_eo'], lambda r: -0.05, BAL_H, v3(V))   # the outer faces
    for a_, b_ in ((Wl(0.0), Wo(0.0)), (El(0.0), Eo(0.0))):                                                     # the walls' ends at the head
        st.face([(*a_, -0.05), (*b_, -0.05), (*b_, BAL_H), (*a_, BAL_H)], v3(U))
    pv.face([(p_.x, p_.y, LOWER) for p_ in S['landing']], (0, 0, 1))                                             # the court and the landing
    # the drive's balustrade across the opening, the deck's edge below it, and the deck's underside (two convex pieces)
    xi = sorted((Wl(S['r_wi']).x, El(S['r_ei']).x)); xo_ = sorted((S['foot'][0].x, S['foot'][3].x))
    st.face([(xi[0], DRIVE[0], ARC_CEIL), (xi[1], DRIVE[0], ARC_CEIL), (xi[1], DRIVE[0], BAL_H), (xi[0], DRIVE[0], BAL_H)], (0, -1, 0))
    flat(st, xo_[0], xo_[1], DRIVE[0], DRIVE[0] + WALL_T, BAL_H)
    st.face([(xo_[0], DRIVE[0] + WALL_T, 0.0), (xo_[1], DRIVE[0] + WALL_T, 0.0), (xo_[1], DRIVE[0] + WALL_T, BAL_H), (xo_[0], DRIVE[0] + WALL_T, BAL_H)], (0, 1, 0))
    for xe_, nx in ((xo_[0], -1), (xo_[1], 1)):
        st.face([(xe_, DRIVE[0], 0.0), (xe_, DRIVE[0] + WALL_T, 0.0), (xe_, DRIVE[0] + WALL_T, BAL_H), (xe_, DRIVE[0], BAL_H)], (nx, 0, 0))
    A_, B_, C_, D_ = Wl(S['r_wi']), El(S['r_ei']), S['C'], Vector((W0.x, ARC_Y[0]))
    st.face([(p_.x, p_.y, ARC_CEIL) for p_ in (A_, B_, W0)], (0, 0, -1))
    st.face([(p_.x, p_.y, ARC_CEIL) for p_ in (W0, B_, C_, D_)], (0, 0, -1))

# the arcade's floor and the arches' floor
flat(pv, -ARC_X, ARC_X, ARC_Y[0], ARC_Y[1], LOWER)
OPEN = [(-ARC_X + 4.4 * k + 0.5, -ARC_X + 4.4 * (k + 1) - 0.5) for k in range(5)]
for a, b in OPEN: flat(pv, a, b, FACADE[0], FACADE[1], LOWER)
# the coffered ceiling: five bays, each a stone frame round a recessed panel of tiles in a pattern
tl = geo('tile')
for k in range(5):
    x0, x1 = -ARC_X + 4.4 * k, -ARC_X + 4.4 * (k + 1)
    fx0, fx1, fy0, fy1, zr = x0 + 0.45, x1 - 0.45, ARC_Y[0] + 0.45, ARC_Y[1] - 0.45, ARC_CEIL + 0.3
    D = (0, 0, -1)
    st.face([(x0, ARC_Y[0], ARC_CEIL), (x1, ARC_Y[0], ARC_CEIL), (fx1, fy0, ARC_CEIL), (fx0, fy0, ARC_CEIL)], D)
    st.face([(x1, ARC_Y[0], ARC_CEIL), (x1, ARC_Y[1], ARC_CEIL), (fx1, fy1, ARC_CEIL), (fx1, fy0, ARC_CEIL)], D)
    st.face([(x1, ARC_Y[1], ARC_CEIL), (x0, ARC_Y[1], ARC_CEIL), (fx0, fy1, ARC_CEIL), (fx1, fy1, ARC_CEIL)], D)
    st.face([(x0, ARC_Y[1], ARC_CEIL), (x0, ARC_Y[0], ARC_CEIL), (fx0, fy0, ARC_CEIL), (fx0, fy1, ARC_CEIL)], D)
    st.face([(fx0, fy0, ARC_CEIL), (fx1, fy0, ARC_CEIL), (fx1, fy0, zr), (fx0, fy0, zr)], (0, 1, 0))
    st.face([(fx0, fy1, ARC_CEIL), (fx1, fy1, ARC_CEIL), (fx1, fy1, zr), (fx0, fy1, zr)], (0, -1, 0))
    st.face([(fx0, fy0, ARC_CEIL), (fx0, fy1, ARC_CEIL), (fx0, fy1, zr), (fx0, fy0, zr)], (1, 0, 0))
    st.face([(fx1, fy0, ARC_CEIL), (fx1, fy1, ARC_CEIL), (fx1, fy1, zr), (fx1, fy0, zr)], (-1, 0, 0))
    NI, NJ = 4, 6
    for i in range(NI):
        for j in range(NJ):
            ring = min(i, j, NI - 1 - i, NJ - 1 - j)
            c = TILE[2] if ring == 0 else (TILE[0] if (i + j) % 2 == 0 else TILE[1])
            if ring > 0 and (i, j) in ((1, 2), (2, 3)): c = TILE[3]
            ax0, ax1 = fx0 + (fx1 - fx0) * i / NI, fx0 + (fx1 - fx0) * (i + 1) / NI
            ay0, ay1 = fy0 + (fy1 - fy0) * j / NJ, fy0 + (fy1 - fy0) * (j + 1) / NJ
            flat(tl, ax0, ax1, ay0, ay1, zr, (0, 0, -1), c)
# the south wall's inner face, from each side stair's landing to the Mall's stair opening; the end walls; the vestibules
for xa_, xb_ in ((SIDES[0]['C'].x, -3.5), (3.5, SIDES[1]['C'].x)):
    st.face([(xa_, ARC_Y[0], LOWER), (xb_, ARC_Y[0], LOWER), (xb_, ARC_Y[0], ARC_CEIL), (xa_, ARC_Y[0], ARC_CEIL)], (0, 1, 0))
for s in (-1, 1):   # (the side stairs' landings, south of y 0, came with the stairs above)
    xe = s * ARC_X
    st.face([(xe, 4.5, LOWER), (xe, ARC_Y[1], LOWER), (xe, ARC_Y[1], ARC_CEIL), (xe, 4.5, ARC_CEIL)], (-s, 0, 0))
    xo = s * 16.0
    st.face([(xo, SIDE_FOOT[1], LOWER), (xo, 4.5, LOWER), (xo, 4.5, ARC_CEIL), (xo, SIDE_FOOT[1], ARC_CEIL)], (-s, 0, 0))   # the vestibule's outer wall
    st.face([(xo, 4.5, LOWER), (xe, 4.5, LOWER), (xe, 4.5, ARC_CEIL), (xo, 4.5, ARC_CEIL)], (0, -1, 0))             # its north wall
    flat(pv, min(xo, xe), max(xo, xe), ARC_Y[0], 4.5, LOWER)
    flat(st, min(xo, xe), max(xo, xe), ARC_Y[0], 4.5, ARC_CEIL, (0, 0, -1))
# the north wall: five round arches between six piers, its outer face carried up as the drive's balustrade
def arc_pts(xc, n=10): return [(xc + ARCH_R * math.cos(math.pi * (1 - i / n)), SPRING + ARCH_R * math.sin(math.pi * (1 - i / n))) for i in range(n + 1)]
for a, b in OPEN:
    xc = (a + b) / 2; P = arc_pts(xc)
    for i in range(len(P) - 1):
        (xa1, za1), (xb1, zb1) = P[i], P[i + 1]
        st.face([(xa1, FACADE[0], za1), (xb1, FACADE[0], zb1), (xb1, FACADE[1], zb1), (xa1, FACADE[1], za1)], (xc - (xa1 + xb1) / 2, 0, SPRING - (za1 + zb1) / 2))
        st.face([(xa1, FACADE[1], za1), (xb1, FACADE[1], zb1), (xb1, FACADE[1], BAL_H), (xa1, FACADE[1], BAL_H)], (0, 1, 0))
        st.face([(xa1, FACADE[0], za1), (xb1, FACADE[0], zb1), (xb1, FACADE[0], ARC_CEIL), (xa1, FACADE[0], ARC_CEIL)], (0, -1, 0))
    for xj, s in ((a, 1), (b, -1)):   # the jambs
        st.face([(xj, FACADE[0], LOWER), (xj, FACADE[1], LOWER), (xj, FACADE[1], SPRING), (xj, FACADE[0], SPRING)], (s, 0, 0))
piers = [(-16.0, OPEN[0][0])] + [(OPEN[k][1], OPEN[k + 1][0]) for k in range(4)] + [(OPEN[4][1], 16.0)]
for a, b in piers:
    st.face([(a, FACADE[1], LOWER), (b, FACADE[1], LOWER), (b, FACADE[1], BAL_H), (a, FACADE[1], BAL_H)], (0, 1, 0))
    ia, ib = max(a, -ARC_X), min(b, ARC_X)
    if ib > ia: st.face([(ia, FACADE[0], LOWER), (ib, FACADE[0], LOWER), (ib, FACADE[0], ARC_CEIL), (ia, FACADE[0], ARC_CEIL)], (0, -1, 0))
flat(st, -16.0, 16.0, DRIVE[1] - 0.3, DRIVE[1] + 0.0, BAL_H)
st.face([(-16.0, DRIVE[1] - 0.3, 0.0), (16.0, DRIVE[1] - 0.3, 0.0), (16.0, DRIVE[1] - 0.3, BAL_H), (-16.0, DRIVE[1] - 0.3, BAL_H)], (0, -1, 0))
box(st, (-16.0, FACADE[1], -0.45), (16.0, FACADE[1] + 0.22, -0.18), skip=('-y', '-x', '+x'))   # a string course along the north wall
# the terrace: its paving, its retaining walls against the bank, its edge on the Lake with a low balustrade
flat(pv, TERRACE[0], TERRACE[1], TERRACE[2], TERRACE[3] - 0.4, LOWER)
for s in (-1, 1):
    xi, xo = s * 16.0, s * (16.0 + WALL_T)
    ys_ = [TERRACE[2] + k for k in range(int(TERRACE[3] - TERRACE[2]) + 1)]
    top = lambda y: max(z_field(xo + s * 0.5, y), LOWER) + BAL_H
    for y0, y1 in zip(ys_, ys_[1:]):
        st.face([(xi, y0, LOWER), (xi, y1, LOWER), (xi, y1, top(y1)), (xi, y0, top(y0))], (-s, 0, 0))
        st.face([(xi, y0, top(y0)), (xi, y1, top(y1)), (xo, y1, top(y1)), (xo, y0, top(y0))], (0, 0, 1))
        st.face([(xo, y0, zmesh(xo, y0) - 0.1), (xo, y1, zmesh(xo, y1) - 0.1), (xo, y1, top(y1)), (xo, y0, top(y0))], (s, 0, 0))
    st.face([(xi, TERRACE[3], WATER - 0.5), (xo, TERRACE[3], WATER - 0.5), (xo, TERRACE[3], top(TERRACE[3])), (xi, TERRACE[3], top(TERRACE[3]))], (0, 1, 0))
st.face([(-16.0, TERRACE[3], WATER - 0.5), (16.0, TERRACE[3], WATER - 0.5), (16.0, TERRACE[3], LOWER + 0.9), (-16.0, TERRACE[3], LOWER + 0.9)], (0, 1, 0))
flat(st, -16.0, 16.0, TERRACE[3] - 0.4, TERRACE[3], LOWER + 0.9)
st.face([(-16.0, TERRACE[3] - 0.4, LOWER), (16.0, TERRACE[3] - 0.4, LOWER), (16.0, TERRACE[3] - 0.4, LOWER + 0.9), (-16.0, TERRACE[3] - 0.4, LOWER + 0.9)], (0, -1, 0))
# the fountain: a round basin, a stepped pedestal, two basins and a finial (no figure)
fx, fy = FOUNTAIN
def ring_wall(g, c, r0, r1, z0, z1, n=28):
    for k in range(n):
        a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        p = lambda r, a, z: (c[0] + r * math.cos(a), c[1] + r * math.sin(a), z)
        g.face([p(r1, a0, z0), p(r1, a1, z0), p(r1, a1, z1), p(r1, a0, z1)], (math.cos(a0 + math.pi / n), math.sin(a0 + math.pi / n), 0))
        g.face([p(r0, a0, z1), p(r1, a0, z1), p(r1, a1, z1), p(r0, a1, z1)], (0, 0, 1))
        g.face([p(r0, a0, z0), p(r0, a1, z0), p(r0, a1, z1), p(r0, a0, z1)], (-math.cos(a0 + math.pi / n), -math.sin(a0 + math.pi / n), 0))
ring_wall(st, FOUNTAIN, 5.6, 6.0, LOWER, LOWER + 0.55)
geo('water').face([(fx + 5.6 * math.cos(2 * math.pi * k / 28), fy + 5.6 * math.sin(2 * math.pi * k / 28), LOWER + 0.32) for k in range(28)], (0, 0, 1))
frustum(st, (fx, fy, LOWER + 0.2), (fx, fy, LOWER + 1.0), 1.3, 1.05, 8)
frustum(st, (fx, fy, LOWER + 1.0), (fx, fy, LOWER + 2.0), 0.5, 0.42, 8, cap=False)
frustum(st, (fx, fy, LOWER + 1.85), (fx, fy, LOWER + 2.25), 0.6, 2.3, 10, cap=False)
ring_wall(st, FOUNTAIN, 2.08, 2.3, LOWER + 2.25, LOWER + 2.33, 14)
geo('water').face([(fx + 2.08 * math.cos(2 * math.pi * k / 14), fy + 2.08 * math.sin(2 * math.pi * k / 14), LOWER + 2.2) for k in range(14)], (0, 0, 1))
frustum(st, (fx, fy, LOWER + 2.2), (fx, fy, LOWER + 3.2), 0.28, 0.22, 6, cap=False)
frustum(st, (fx, fy, LOWER + 3.15), (fx, fy, LOWER + 3.4), 0.3, 0.9, 8)
frustum(st, (fx, fy, LOWER + 3.4), (fx, fy, LOWER + 4.1), 0.14, 0.1, 6, cap=False)
frustum(st, (fx, fy, LOWER + 4.1), (fx, fy, LOWER + 4.55), 0.22, 0.0, 6)

# ---- Bow Bridge: a gently arched deck on two cream iron girders with a lower chord, a lattice railing, urns at the ends
B = BRIDGE; bx, bw = B['x'], B['w']; L_ = B['y1'] - B['y0']; yc = (B['y0'] + B['y1']) / 2
def deck_z(y): u = (y - yc) / (L_ / 2); return B['z_end'] + (B['z_mid'] - B['z_end']) * (1 - u * u)
def chord_z(y): u = (y - yc) / (L_ / 2); return B['chord_end'] + (B['chord_mid'] - B['chord_end']) * (1 - u * u)
NB = 16
YB = [B['y0'] + L_ * k / NB for k in range(NB + 1)]
dk, ir, gr, rl = geo("deck"), geo("iron"), geo("granite"), geo("railing")
for y0, y1 in zip(YB, YB[1:]):
    dk.face([(bx - bw / 2, y0, deck_z(y0)), (bx + bw / 2, y0, deck_z(y0)), (bx + bw / 2, y1, deck_z(y1)), (bx - bw / 2, y1, deck_z(y1))], (0, 0, 1))
    ir.face([(bx - bw / 2, y0, deck_z(y0) - 0.22), (bx + bw / 2, y0, deck_z(y0) - 0.22), (bx + bw / 2, y1, deck_z(y1) - 0.22), (bx - bw / 2, y1, deck_z(y1) - 0.22)], (0, 0, -1))
    for s in (-1, 1):
        xo, xi = bx + s * (bw / 2 + 0.05), bx + s * (bw / 2 - 0.1)
        zt0, zt1 = deck_z(y0) + 0.06, deck_z(y1) + 0.06
        ir.face([(xo, y0, chord_z(y0)), (xo, y1, chord_z(y1)), (xo, y1, zt1), (xo, y0, zt0)], (s, 0, 0))
        ir.face([(xi, y0, chord_z(y0)), (xi, y1, chord_z(y1)), (xi, y1, deck_z(y1) - 0.22), (xi, y0, deck_z(y0) - 0.22)], (-s, 0, 0))
        ir.face([(xi, y0, chord_z(y0)), (xo, y0, chord_z(y0)), (xo, y1, chord_z(y1)), (xi, y1, chord_z(y1))], (0, 0, -1))
        ir.face([(xi, y0, zt0), (xo, y0, zt0), (xo, y1, zt1), (xi, y1, zt1)], (0, 0, 1))
        # the railing: a top rail, a bottom rail and a crossed lattice in each bay
        xr = bx + s * (bw / 2 - 0.02)
        for zo, hh in ((0.98, 0.08), (0.16, 0.05)):
            for xx, nn in ((xr - 0.04, -1), (xr + 0.04, 1)):
                rl.face([(xx, y0, deck_z(y0) + zo - hh), (xx, y1, deck_z(y1) + zo - hh), (xx, y1, deck_z(y1) + zo), (xx, y0, deck_z(y0) + zo)], (nn, 0, 0))
            rl.face([(xr - 0.04, y0, deck_z(y0) + zo), (xr + 0.04, y0, deck_z(y0) + zo), (xr + 0.04, y1, deck_z(y1) + zo), (xr - 0.04, y1, deck_z(y1) + zo)], (0, 0, 1))
        for (ya, za), (yb, zb) in (((y0, 0.16), (y1, 0.9)), ((y0, 0.9), (y1, 0.16))):
            for nn in (-1, 1):
                xx = xr + nn * 0.012
                rl.face([(xx, ya, deck_z(ya) + za - 0.03), (xx, yb, deck_z(yb) + zb - 0.03), (xx, yb, deck_z(yb) + zb + 0.03), (xx, ya, deck_z(ya) + za + 0.03)], (nn, 0, 0))
for y in YB:
    for s in (-1, 1):
        xr = bx + s * (bw / 2 - 0.02)
        box(rl, (xr - 0.045, y - 0.045, deck_z(y) + 0.06), (xr + 0.045, y + 0.045, deck_z(y) + 1.02), skip=('-z',))
for ya, yb in ((B['y0'] - 2.6, B['y0'] + 0.6), (B['y1'] - 0.6, B['y1'] + 2.6)):   # the abutments
    box(gr, (bx - bw / 2 - 0.9, ya, WATER - 0.8), (bx + bw / 2 + 0.9, yb, B['z_end'] - 0.02), skip=('-z',))
for ye in (B['y0'] - 1.6, B['y1'] + 1.6):   # the plinths and their urns
    for s in (-1, 1):
        px = bx + s * (bw / 2 + 0.55)
        box(gr, (px - 0.32, ye - 0.32, B['z_end'] - 0.02), (px + 0.32, ye + 0.32, B['z_end'] + 0.85), skip=('-z',))
        frustum(rl, (px, ye, B['z_end'] + 0.85), (px, ye, B['z_end'] + 1.0), 0.14, 0.12, 8, cap=False)
        frustum(rl, (px, ye, B['z_end'] + 1.0), (px, ye, B['z_end'] + 1.4), 0.12, 0.34, 8)

# ---- the skyline: far cards of our own blocks (no real building, no sign), in haze, sized by the angle they rise to above
# the eye (the real towers stand a kilometre or two off; here they stand 800 to 950 m off at the heights that give the same
# band over the park's tree line, about 9 to 14 degrees, and the slender ones higher)
def skyline(g, axis, at, a0, a1, deg, haze, rng, slender=0.0, twins=0.0, wide=(18, 42)):
    """a card at x = at (axis 'x') or y = at (axis 'y'), blocks along the other axis from a0 to a1, facing the park"""
    pos = a0; D = abs(at)
    H = lambda d: D * math.tan(math.radians(d)) + EYE
    toward = (-1 if at > 0 else 1, 0, 0) if axis == 'x' else (0, -1 if at > 0 else 1, 0)
    def q(u0, u1, z0, z1, col):
        P = [(at, u0, z0), (at, u1, z0), (at, u1, z1), (at, u0, z1)] if axis == 'x' else [(u0, at, z0), (u1, at, z0), (u1, at, z1), (u0, at, z1)]
        g.face(P, toward, [col] * 4)
    def tri(u0, u1, z0, z1, col):
        um = (u0 + u1) / 2
        P = [(at, u0, z0), (at, u1, z0), (at, um, z1)] if axis == 'x' else [(u0, at, z0), (u1, at, z0), (um, at, z1)]
        g.face(P, toward, [col] * 3)
    while pos < a1:
        w = rng.uniform(*wide); col = mul(haze, rng.uniform(0.92, 1.06))
        kind = rng.random()
        if kind < slender:
            w = rng.uniform(12, 18); h = H(rng.uniform(deg[1] + 1.0, deg[1] + 3.0))
            q(pos, pos + w, -40, h, col)
            if rng.random() < 0.5: tri(pos + w * 0.3, pos + w * 0.7, h, h + rng.uniform(12, 30), col)
        elif kind < slender + twins:
            hb = H(rng.uniform(deg[0], deg[0] + 1.2)); q(pos, pos + w * 1.4, -40, hb, col); tw = w * 0.36
            ht = hb + rng.uniform(25, 45); top = mul(col, 1.04)
            q(pos + w * 0.05, pos + w * 0.05 + tw, hb, ht, top); q(pos + w * 1.35 - tw, pos + w * 1.35, hb, ht, top)
            tri(pos + w * 0.05, pos + w * 0.05 + tw, ht, ht + 8, top); tri(pos + w * 1.35 - tw, pos + w * 1.35, ht, ht + 8, top)
            w *= 1.4
        else:
            h = H(rng.uniform(*deg)); q(pos, pos + w, -40, h, col)
            if rng.random() < 0.4:
                sw = w * rng.uniform(0.45, 0.7); s0 = pos + (w - sw) * rng.uniform(0.2, 0.8)
                q(s0, s0 + sw, h, h + rng.uniform(10, 35), mul(col, 1.03))
        pos += w + rng.uniform(0, 9)
rs = random.Random(7)
sk = geo('skyline')
skyline(sk, 'x', -800.0, -760.0, 760.0, (8.5, 11.5), lin('#a3b6c8'), rs, twins=0.12)           # the west side's towers
skyline(sk, 'x', -950.0, -900.0, 900.0, (9.5, 12.5), lin('#bccbd8'), rs, wide=(28, 64))
skyline(sk, 'y', -850.0, -800.0, 760.0, (9.0, 12.0), lin('#a7b9ca'), rs, slender=0.14)         # the south, taller and slender
skyline(sk, 'y', -1000.0, -950.0, 900.0, (10.0, 13.5), lin('#bfcdd9'), rs, slender=0.08, wide=(28, 64))
skyline(sk, 'y', 900.0, -850.0, 850.0, (3.5, 6.5), lin('#c0ccd7'), rs, wide=(30, 70))          # the north, low and far
skyline(sk, 'x', 800.0, -760.0, 860.0, (6.5, 9.5), lin('#c6c2b8'), rs, wide=(26, 60))          # the east, lit from the south-west

# ---- the sky dome and the far ground (unlit, their final colours)
SKY_STOPS = [(-1.0, lin('#3c4a38')), (-0.02, lin('#7c8f86')), (0.0, lin('#d9e6ef')), (0.12, lin('#b7d1ea')), (0.35, lin('#8fb7e3')), (1.0, lin('#5b93d9'))]
# the bake's sky is the dome's with 40 percent of its colour taken out: a photograph balanced for the shade, so the shade
# under the elms and in the arcade reads warm grey rather than slate blue
SKY_BAKE = [(z, tuple(c[i] * 0.6 + lum(c) * 0.4 for i in range(3))) for z, c in SKY_STOPS]
def sky_rgb(z, stops=SKY_STOPS):
    """the sky's radiance by the sine of elevation (the dome's colour; SKY_BAKE the world's in the bake): pale at the horizon, blue above"""
    for (z0, c0), (z1, c1) in zip(stops, stops[1:]):
        if z <= z1:
            t = (z - z0) / (z1 - z0) if z1 > z0 else 0.0
            return tuple(c0[i] + (c1[i] - c0[i]) * max(0.0, min(1.0, t)) for i in range(3))
    return stops[-1][1]
dome = geo('sky'); RD = 1400.0
ELS = [-14, -2, 0, 5, 12, 24, 42, 64, 90]
for e0, e1 in zip(ELS, ELS[1:]):
    for k in range(14):
        a0, a1 = 2 * math.pi * k / 14, 2 * math.pi * (k + 1) / 14
        def P(e, a): ce = math.cos(math.radians(e)); return (RD * ce * math.sin(a), RD * ce * math.cos(a), RD * math.sin(math.radians(e)) - 40)
        def C(e, a):
            c = sky_rgb(math.sin(math.radians(e)))
            warm = max(0.0, math.cos(a - math.radians(SUN_AZ))) ** 3 * (1 - smooth(0, 30, e)) * 0.18   # the horizon warms toward the sun
            return (c[0] * (1 + warm), c[1] * (1 + warm * 0.6), c[2])
        pts = [P(e0, a0), P(e0, a1), P(e1, a1)] + ([P(e1, a0)] if e1 < 90 else [])
        cols = [C(e0, a0), C(e0, a1), C(e1, a1)] + ([C(e1, a0)] if e1 < 90 else [])
        dome.face(pts, tuple(-v for v in ((pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2, 0)), cols)
fg = geo('farground'); FG = lin('#6d8a62')
gx0, gx1, gy0, gy1 = XS[0], XS[-1], YS[0], YS[-1]
FR = 1200.0
for P_ in ([(-FR, -FR), (FR, -FR), (gx1, gy0), (gx0, gy0)], [(FR, -FR), (FR, FR), (gx1, gy1), (gx1, gy0)], [(FR, FR), (-FR, FR), (gx0, gy1), (gx1, gy1)], [(-FR, FR), (-FR, -FR), (gx0, gy0), (gx0, gy1)]):
    fg.face([(x, y, -0.6) for x, y in P_], (0, 0, 1), [FG] * 4)

# ---- the instanced prototypes (each built at its own origin, standing on z = 0)
PROTO = {}
def proto_tree(name, seed, kind):
    rng = random.Random(seed); g = Geo(); bark = ALB['bark']
    if kind == 'elm':      # the Mall's American elms: a stout trunk forking into a vase of limbs under a wide canopy that arches over the walk
        frustum(g, (0, 0, -0.3), (0, 0, 3.0), 0.55, 0.42, 5, bark, cap=False)
        n = 3 + seed % 2; leaf = ALB['elm']
        for k in range(n):
            a = 2 * math.pi * k / n + rng.uniform(-0.3, 0.3); r = rng.uniform(2.2, 2.8)
            frustum(g, (0, 0, 2.6), (r * math.cos(a), r * math.sin(a), rng.uniform(6.6, 7.2)), 0.34, 0.18, 4, bark, cap=False)
        for k in range(5):   # clusters with gaps between them, so the afternoon sun falls through in flecks
            a = 2 * math.pi * k / 5 + rng.uniform(-0.25, 0.25) + seed; r = rng.uniform(3.8, 4.6)
            blob(g, (r * math.cos(a), r * math.sin(a), rng.uniform(8.6, 9.8)), (rng.uniform(2.6, 3.1), rng.uniform(2.6, 3.1), rng.uniform(1.9, 2.3)), rng, leaf, jit=0.2)
        blob(g, (rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), 10.9), (3.0, 3.0, 1.6), rng, leaf, jit=0.2)
    elif kind == 'plane':  # London planes round the meadow and the lawns: a broad dome on a short trunk
        frustum(g, (0, 0, -0.3), (0, 0, 3.6), 0.38, 0.30, 5, bark, cap=False); leaf = ALB['plane']
        for k in range(2):
            a = rng.uniform(0, 2 * math.pi)
            frustum(g, (0, 0, 3.3), (1.8 * math.cos(a), 1.8 * math.sin(a), 6.0), 0.2, 0.1, 4, bark, cap=False)
        blob(g, (0, 0, 8.3), (3.6, 3.6, 2.8), rng, leaf)
        for k in range(3 + seed % 2):
            a = 2 * math.pi * k / (3 + seed % 2) + rng.uniform(-0.4, 0.4)
            blob(g, (2.5 * math.cos(a), 2.5 * math.sin(a), rng.uniform(6.8, 7.8)), (2.7, 2.7, 2.2), rng, leaf)
    elif kind == 'willow': # by the Lake: a leaning trunk under a tall mound of hanging leaves that falls nearly to the ground
        top = Vector((0.6, 0.3, 3.6)); frustum(g, (0, 0, -0.3), top, 0.42, 0.30, 5, bark, cap=False); leaf = ALB['willow']
        blob(g, top + Vector((0, 0, 1.1)), (4.1, 4.1, 3.5), rng, leaf, jit=0.18, flat=0.95)
        blob(g, top + Vector((0.4, -0.3, 3.7)), (3.0, 3.0, 1.7), rng, leaf, jit=0.2)
        a = rng.uniform(0, 2 * math.pi); blob(g, top + Vector((2.2 * math.cos(a), 2.2 * math.sin(a), 0.3)), (2.6, 2.6, 2.6), rng, leaf, jit=0.2, flat=0.95)
    elif kind == 'round':  # one cluster on a trunk: the belts at the park's edges and the Ramble's hill, and, at about half
        # the size, the small ornamental trees (Cherry Hill's, the terrace's banks); the belts take their darker leaf from
        # their instance colour (ROUND_TINT), so one prototype serves both and the park keeps four species
        frustum(g, (0, 0, -0.3), (0, 0, 3.2), 0.35, 0.25, 3, bark, cap=False)
        blob(g, (0, 0, 7.2), (4.0, 4.0, 4.4), rng, ALB['round'], flat=0.7)
    PROTO[name] = g
def proto_bench():
    g = Geo(); wd, ic = ALB['wood'], ALB['ironwork']
    box(g, (-0.9, -0.22, 0.42), (0.9, 0.2, 0.48), wd, skip=('-z',))
    t = math.radians(15)
    obox(g, (0, 0.24, 0.73), ((0.9, 0, 0), (0, 0.025 * math.cos(t), -0.025 * math.sin(t)), (0, 0.24 * math.sin(t), 0.24 * math.cos(t))), wd, skip=('-c',))
    for s in (-1, 1): box(g, (s * 0.86 - 0.03, -0.26, 0.0), (s * 0.86 + 0.03, 0.26, 0.66), ic, skip=('-z',))
    PROTO['bench'] = g
def proto_lamp():
    g = Geo(); ic, gl = ALB['ironwork'], ALB['glass']
    frustum(g, (0, 0, 0), (0, 0, 0.55), 0.17, 0.1, 5, ic, cap=False)
    frustum(g, (0, 0, 0.55), (0, 0, 3.1), 0.065, 0.05, 5, ic, cap=False)
    frustum(g, (0, 0, 3.1), (0, 0, 3.42), 0.1, 0.23, 5, gl, cap=False)
    frustum(g, (0, 0, 3.42), (0, 0, 3.6), 0.23, 0.12, 5, gl, cap=False)
    frustum(g, (0, 0, 3.58), (0, 0, 3.8), 0.17, 0.0, 5, ic)
    PROTO['lamp'] = g
for nm, sd, kd in (('elmA', 11, 'elm'), ('elmB', 12, 'elm'), ('planeA', 21, 'plane'), ('planeB', 22, 'plane'), ('willow', 31, 'willow'), ('round', 51, 'round')):
    proto_tree(nm, sd, kd)
ROUND_TINT = tuple(ALB['far'][i] / ALB['round'][i] for i in range(3))   # the belts' leaf against the small trees' (each channel under 1)
proto_bench(); proto_lamp()
DOUBLE = set()   # (no prototype is open underneath: every canopy is a closed cluster)

# ---- the props, shaded here in the bake's units (a white Lambertian's radiance), one shade per face, normalised by open
# level ground in full sun: the stored colour is then the albedo as full sun shows it, like the lightmap's albedo x map / UNIT
dome_dirs = []
for k in range(48):   # a fixed cosine-weighted set about +z (turned onto each face's normal)
    u1 = (k + 0.5) / 48; r_ = math.sqrt(u1); ph = 2 * math.pi * (k * 0.618034 % 1.0)
    dome_dirs.append(Vector((r_ * math.cos(ph), r_ * math.sin(ph), math.sqrt(max(0.0, 1 - u1)))))
def to_normal(d, n): return Vector((0, 0, 1)).rotation_difference(n) @ d
SUN_E = Vector(SUN_RGB) * SUN_W / math.pi     # a sun-facing white Lambertian's radiance (the DIFFUSE bake's unit, measured)
SKY_L = lambda d: Vector(sky_rgb(d.z, SKY_BAKE)) * SKY_W
E_OPEN_A = SUN_E * L_SUN.z + sum((SKY_L(d) for d in dome_dirs), Vector()) / len(dome_dirs)
EL_A = lum(E_OPEN_A)
GROUND_L = Vector(ALB['lawn']) * EL_A         # open lawn's radiance under the same light (the bounce from below)
LEAF_T = 0.28                                 # the share of sunlight a canopy lets through to its shaded side (the bake's leaves match it)
def sun_dirs(name):
    """the sun as each prototype is shaded: the real sun for the trees (their instances turn at most 20 degrees), and eight
    azimuths averaged for the bench (it faces every way, so it takes no side)"""
    if name != 'bench': return [L_SUN]
    return [Matrix.Rotation(2 * math.pi * k / 8, 3, 'Z') @ L_SUN for k in range(8)]
PROTO_LIGHT = {}
for name, g in PROTO.items():
    verts, polys = [], []
    for pts, col in g.faces:
        i0 = len(verts); verts.extend(pts); polys.append(list(range(i0, i0 + len(pts))))
    bvh = BVHTree.FromPolygons(verts, polys, all_triangles=False, epsilon=0.0)
    cols, sky_sum, sun_sum, samples, SD = [], 0.0, 0.0, [], sun_dirs(name)
    for fi, (pts, col) in enumerate(g.faces):
        a, b_, c = pts[0], pts[1], pts[2]; n = (b_ - a).cross(c - a)
        area = n.length / 2 * (len(pts) - 2); n.normalize()
        ctr = sum(pts, Vector()) / len(pts); o = ctr + n * 0.02
        e_sun = Vector((0, 0, 0))
        for L in SD:
            if n.dot(L) > 0 and bvh.ray_cast(o, L)[0] is None: e_sun += SUN_E * n.dot(L)
            elif fi in g.leaf and n.dot(L) < 0: e_sun += SUN_E * (-n.dot(L)) * LEAF_T   # a leaf lit from behind glows through
        e_sun /= len(SD)
        e_sky = Vector((0, 0, 0))
        for d in dome_dirs:
            dd = to_normal(d, n); hit = bvh.ray_cast(o, dd)
            if hit[0] is not None: e_sky += Vector(col or (0.3, 0.3, 0.3)) * EL_A * 0.3   # a canopy's own leaves, part lit
            elif dd.z < 0: e_sky += GROUND_L
            else: e_sky += SKY_L(dd)
        e_sky /= len(dome_dirs)
        e = (e_sun + e_sky) / EL_A; alb = Vector(col or (1, 1, 1))
        lit = [alb[i] * e[i] for i in range(3)]
        cols.append(tuple(x if x < 0.85 else 0.85 + 0.15 * (1 - math.exp(-(x - 0.85) / 0.15)) for x in lit))
        sky_sum += lum(alb) * lum(e_sky) / EL_A * area; sun_sum += lum(alb) * lum(e_sun) / EL_A * area
        samples.append((ctr, n, area))
    PROTO_LIGHT[name] = {'cols': cols, 'sky': sky_sum, 'sun': sun_sum, 'samples': sorted(samples, key=lambda s: -s[2])}

# ---- the four land poses (catalog order) and the flights between them, in Blender's frame
def side_at(x, y):
    """(the side stair, the run from its head, the distance across from its W line) for a point on a side stair's flight,
    or the stair and None on its court or landing, or None"""
    p = Vector((x, y))
    for S in SIDES:
        r, v = (S['W1'] - p).dot(S['U']), (p - S['W1']).dot(S['V'])
        if 0.0 <= r <= SIDE_RUN and 0.0 <= v <= SIDE_W: return S, r, v
        if in_poly(p, S['landing']): return S, None, None
    return None
def floor_at(x, y):
    """the walking surface under (x, y): the stairs, the arcade and its vestibules, the terrace, the bridge, else the ground and its path"""
    for a, b in CUTS:
        if a < x < b and CUT_Y[0] < y < CUT_Y[1]: return stair_z(y)
    sd = side_at(x, y)
    if sd: return LOWER if sd[1] is None else UPPER - (min(NSTEP - 1, int(sd[1] / RUN)) + 1) * RISE
    if -16.0 < x < 16.0 and DRIVE[0] < y < FACADE[1]: return LOWER
    if TERRACE[0] < x < TERRACE[1] and TERRACE[2] <= y < TERRACE[3]: return LOWER
    if abs(x - BRIDGE['x']) < BRIDGE['w'] / 2 and BRIDGE['y0'] <= y <= BRIDGE['y1']: return deck_z(y)
    return zmesh(x, y) + 0.05
def walk_z(x, y):
    """the surface a flight follows: the floor, but on a stair the line through its nosings (so the curve does not bob step by step)"""
    for a, b in CUTS:
        if a < x < b and CUT_Y[0] < y < CUT_Y[1]: return UPPER - (y - CUT_Y[0]) / RUN * RISE
    sd = side_at(x, y)
    if sd and sd[1] is not None: return UPPER - sd[1] / RUN * RISE
    return floor_at(x, y)
def bearing(b, pitch=0.0):
    b, p = math.radians(b), math.radians(pitch)
    return Vector((math.sin(b) * math.cos(p), math.cos(b) * math.cos(p), math.sin(p)))
NEAR = 1.6     # the subject's distance in the pictures (a medium shot of a person holding the product)
SW_ = SIDES[0]; SFC = (SW_['W0'] + SW_['E0']) / 2   # the west side stair's foot on its axis (the second flight climbs the axis)
P3 = SFC + SW_['U'] * 44.0                          # the meadow's pose stands on that axis carried on, inside the meadow's north-east edge
POSES = [   # id (ROOM_PRODUCTS), place, (x, y), compass bearing, pitch, vertical FOV, the light the land's picture has (section 3)
    ('case', 'the Mall, under the elms', (0.0, -61.4), 0.0, 2.0, 32.0, 'sun'),
    ('wallet', "Bethesda Terrace's arcade", (1.0, 3.0), 300.0, 6.0, 34.0, 'shade'),
    ('lenskin', 'Sheep Meadow, the skyline beyond', (P3.x, P3.y), 275.0, 3.0, 32.0, 'overcast'),
    ('airpods', 'Bow Bridge over the Lake', (-55.0, 23.0), 40.0, 2.0, 32.0, 'shade'),
]
POSE = []
for pid, place, (x, y), b, p, fov, light in POSES:
    pos = Vector((x, y, floor_at(x, y) + EYE))
    POSE.append({'id': pid, 'place': place, 'pos': pos, 'target': pos + bearing(b, p) * NEAR, 'fov': fov, 'bearing': b, 'pitch': p, 'light': light})
FLIGHT_H = 1.65   # the camera's height over the surface between the places

def cr3(P, t):
    """three's CatmullRomCurve3 'centripetal' getPoint(t), ported, so the checks fly the runtime's curve"""
    l = len(P); p = (l - 1) * t; ip = int(math.floor(p)); w = p - ip
    if w == 0 and ip == l - 1: ip = l - 2; w = 1
    p0 = P[ip - 1] if ip > 0 else P[0] + (P[0] - P[1]); p1 = P[ip]; p2 = P[ip + 1]
    p3 = P[ip + 2] if ip + 2 < l else P[l - 1] + (P[l - 1] - P[l - 2])
    d0, d1, d2 = ((p0 - p1).length_squared ** 0.25), ((p1 - p2).length_squared ** 0.25), ((p2 - p3).length_squared ** 0.25)
    if d1 < 1e-4: d1 = 1.0
    if d0 < 1e-4: d0 = d1
    if d2 < 1e-4: d2 = d1
    out = Vector((0.0, 0.0, 0.0))
    for c in range(3):
        x0, x1, x2, x3 = p0[c], p1[c], p2[c], p3[c]
        t1 = ((x1 - x0) / d0 - (x2 - x0) / (d0 + d1) + (x2 - x1) / d1) * d1
        t2 = ((x2 - x1) / d1 - (x3 - x1) / (d1 + d2) + (x3 - x2) / d2) * d1
        c0, c1_, c2, c3 = x1, t1, -3 * x1 + 3 * x2 - 2 * t1 - t2, 2 * x1 - 2 * x2 + t1 + t2
        out[c] = c0 + c1_ * w + c2 * w * w + c3 * w * w * w
    return out
class Curve:
    """a CatmullRomCurve3 with three's arc-length table (Curve.getLengths, 200 divisions) and getUtoTmapping, ported"""
    def __init__(self, pts):
        self.P = [Vector(p) for p in pts]; self.L = [0.0]; last = self.at(0.0)
        for k in range(1, 201):
            cur = self.at(k / 200); self.L.append(self.L[-1] + (cur - last).length); last = cur
    def at(self, t): return cr3(self.P, t)
    def u2t(self, u):
        A = self.L; il = len(A); tgt = u * A[-1]; lo, hi = 0, il - 1; i = 0
        while lo <= hi:
            i = (lo + hi) // 2; c = A[i] - tgt
            if c < 0: lo = i + 1
            elif c > 0: hi = i - 1
            else: hi = i; break
        i = hi
        if A[i] == tgt: return i / (il - 1)
        return (i + (tgt - A[i]) / (A[i + 1] - A[i])) / (il - 1)
    def at_u(self, u): return self.at(self.u2t(u))   # getPointAt(u)

# The flights (section-4-world.md 2 "Option B", 'landTravelMs' 2600 ms by default, 4500 at most). How travel-park.ts flies
# one, and what the checks below fly: at the travel's normalised time tau (0 to 1), the camera stands at
# points.getPointAt(easeInOutCubic(tau)) on the control points' curve, and looks at look.getPoint(tau) through the look
# keys, one every 1/26 of the travel, far out (so the camera's own motion does not turn the view); back is tau run from 1
# to 0. The keys come from the look designed here in time: toward the curve 7 m ahead, held to the poses' views at the
# ends, smoothed (least squares against the second difference, weighted by the camera's speed so it keeps to the
# direction of travel where it moves fast) just enough that the view never turns faster than 82 degrees a second at
# 2600 ms; the check's line is 90. The camera never rolls (lookAt with the world's up).
TRAVEL_MS, TRAVEL_MS_MAX, KEYS, LOOK_FAR, LOOK_AHEAD, LOOK_PITCH, HOLD, RATE_DESIGN, RATE_MAX = 2600, 4500, 27, 120.0, 7.0, 0.35, 0.10, 82.0, 90.0
def ease(x): return 4 * x * x * x if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2   # easeInOutCubic (src/scripts/hero/util/math.ts)
def smoothv(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def lsq(yd, w, lam, ya, yb):
    M = len(yd); D2 = np.zeros((M - 2, M))
    for k in range(M - 2): D2[k, k:k + 3] = (1.0, -2.0, 1.0)
    A = np.diag(w) + lam * (D2.T @ D2); b = w * yd
    for k, v in ((0, ya), (1, ya), (M - 2, yb), (M - 1, yb)): A[k, k] += 1e9; b[k] += 1e9 * v
    return np.linalg.solve(A, b)
def design_look(C, A, B):
    M = 261; tau = np.linspace(0.0, 1.0, M); Ltot = C.L[-1]
    u = np.array([ease(t) for t in tau]); pos = [C.at_u(x) for x in u]
    dB = bearing(B['bearing'], B['pitch']); yd, pd = [], []
    for k in range(M):
        sa = u[k] * Ltot + LOOK_AHEAD
        ahead = C.at_u(sa / Ltot) if sa <= Ltot else pos[-1] + dB * (sa - Ltot)
        d = ahead - pos[k]; d.z *= LOOK_PITCH
        yd.append(math.degrees(math.atan2(d.x, d.y))); pd.append(math.degrees(math.atan2(d.z, math.hypot(d.x, d.y))))
    yaw = np.degrees(np.unwrap(np.radians([A['bearing']] + yd + [B['bearing']]))); ya, yb = yaw[0], yaw[-1]; yaw = yaw[1:-1]
    wa, wb = 1 - smoothv(0, HOLD, tau), smoothv(1 - HOLD, 1, tau)
    yd = yaw * (1 - wa - wb) + ya * wa + yb * wb; pd = np.array(pd) * (1 - wa - wb) + A['pitch'] * wa + B['pitch'] * wb
    sp = np.gradient(u * Ltot, tau); w = (sp / sp.max()) ** 2 + 0.04; dt = TRAVEL_MS / 1000 / (M - 1)
    lo, hi = 1e-6, 1e9
    for _ in range(60):
        lam = math.sqrt(lo * hi); y = lsq(yd, w, lam, ya, yb); p = lsq(pd, w, lam, A['pitch'], B['pitch'])
        if np.max(np.hypot(np.diff(y), np.diff(p)) / dt) > RATE_DESIGN: lo = lam
        else: hi = lam
    y = lsq(yd, w, hi, ya, yb); p = lsq(pd, w, hi, A['pitch'], B['pitch'])
    idx = [round(k * (M - 1) / (KEYS - 1)) for k in range(KEYS)]
    kpos = [pos[i] for i in idx]
    return {'kpos': kpos, 'kyaw': [float(y[i]) for i in idx], 'kpitch': [float(p[i]) for i in idx], 'keys': [kpos[j] + bearing(float(y[i]), float(p[i])) * LOOK_FAR for j, i in enumerate(idx)]}
def fly(f, ms, fps=60):
    """the runtime's frames: (tau, position, view direction) at fps over ms"""
    n = round(ms / 1000 * fps); L = f['keys']; out = []
    for k in range(n + 1):
        tau = k / n; p = f['curve'].at_u(ease(tau)); d = (cr3(L, tau) - p).normalized(); out.append((tau, p, d))
    return out
def lifted(x, y): return Vector((x, y, walk_z(x, y) + FLIGHT_H))
# the control points between the poses (lifted to FLIGHT_H over the surface): the Mall, down its stair into the arcade;
# west along the arcade and round to the west side stair's axis, up it and on along it to the meadow; north from the
# meadow over the drive and down the bank to the lakeside under Bow Bridge
def arc_onto_axis(y0, R, axis_p, U):
    """from heading west at y0, a left arc of radius R that ends on the axis through axis_p along U, heading along U"""
    a = math.radians(270.0 - SIDE_H)
    best = None
    for k in range(400):
        xs = -1.0 - k * 0.025; e = Vector((xs - R * math.sin(a), y0 - R * (1 - math.cos(a))))
        c = abs(cross2(axis_p, axis_p + U, e))
        if best is None or c < best[0]: best = (c, xs)
    xs = best[1]
    return [(xs - R * math.sin(a * k / 3), y0 - R * (1 - math.cos(a * k / 3))) for k in range(4)]
F2_ARC = arc_onto_axis(2.8, 12.0, SFC, SW_['U'])
FLIGHTS = [
    [(0.0, -48.0), (0.0, -32.0), (0.0, -17.0), (0.0, -10.6), (0.0, -6.5), (0.0, -2.4), (0.5, 0.9)],
    [(-1.5, 2.8)] + F2_ARC + [tuple(SFC + SW_['U'] * r) for r in (0.0, 4.5, 9.0, 14.0, 20.0, 26.0, 32.0, 38.0)],
    [(-53.8, -21.8), (-56.0, -13.5), (-57.6, -4.5), (-58.8, 4.5), (-59.0, 12.0), (-58.0, 18.0)],
]
FL = []
for i, ctl in enumerate(FLIGHTS):
    a, b = POSE[i], POSE[i + 1]
    pts = [a['pos'].copy()] + [lifted(x, y) for x, y in ctl] + [b['pos'].copy()]
    C = Curve(pts); f = {'from': i, 'to': i + 1, 'pts': pts, 'curve': C}
    f.update(design_look(C, a, b))
    f['samples'] = [C.at_u(k / 600) for k in range(601)]
    FL.append(f)

# ---- the instances: where each tree, bench and lamp stands
INST, KIND = [], []   # (proto, x, y, yaw, s, sz) and what kind of tree, bench or lamp it is
TREES = {'small': 'round', 'far': 'round'}            # the kinds the round prototype serves
def put(k, x, y, yaw, s=1.0, sz=1.0):
    if k == 'small': s, sz = s * 0.52, sz * 0.52      # (a small tree is the round one at about half its size)
    INST.append((TREES.get(k, k), x, y, yaw, s, sz)); KIND.append(k)
R = random.Random(20261020)
CLEAR = {'elmA': 2.0, 'elmB': 2.0, 'planeA': 2.4, 'planeB': 2.4, 'willow': 5.5, 'small': 3.6, 'far': 3.0}
SPACE = {'elmA': 6.5, 'elmB': 6.5, 'planeA': 8.0, 'planeB': 8.0, 'willow': 8.0, 'small': 5.0, 'far': 6.2}
def seg_d(px, py, ax, ay, bx_, by_):
    dx, dy = bx_ - ax, by_ - ay; L2 = dx * dx + dy * dy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
FLY2D = [(p.x, p.y) for f in FL for p in f['samples'][::4]] + [(P_['pos'].x, P_['pos'].y) for P_ in POSE]
SUBJ = [P_['pos'] + bearing(P_['bearing']) * NEAR for P_ in POSE]   # where each picture's person stands
SUN2 = Vector((L_SUN.x, L_SUN.y)).normalized()
# land 1's photo is in direct sun: no tree on the sun's line from its person until the line is above the trees
SUN_LANE = [(Vector((SUBJ[k].x, SUBJ[k].y)), Vector((SUBJ[k].x, SUBJ[k].y)) + SUN2 * 40.0) for k, P_ in enumerate(POSE) if P_['light'] == 'sun']
def free(p, x, y):
    if any(seg_d(x, y, *a, *b_) < w / 2 + CLEAR[p] * 0.8 for _, w, pts in PATH_LINES for a, b_ in zip(pts, pts[1:])): return False
    if any(math.hypot(x - fx_, y - fy_) < CLEAR[p] + 1.2 for fx_, fy_ in FLY2D): return False
    if any(seg_d(x, y, a.x, a.y, b_.x, b_.y) < 7.0 for a, b_ in SUN_LANE): return False
    if in_meadow(x, y, 1.08): return False
    if PLAZA[0] - 2 < x < PLAZA[1] + 2 and -14.0 < y < 30.0: return False      # the plaza, the arcade's block and the terrace
    if DRIVE[0] - 2.0 < y < DRIVE[1] + 2.0: return False
    ys, yn = shores(x)
    if yn - ys > 0.5 and ys - (1.5 if p == 'willow' else 3.0) < y < yn + (1.5 if p == 'willow' else 3.0): return False
    if abs(x - BRIDGE['x']) < 7.0 and BRIDGE['y0'] - 5 < y < BRIDGE['y1'] + 5: return False
    if not (XS[0] + 2 < x < XS[-1] - 2 and YS[0] + 2 < y < YS[-1] - 2): return False
    for q, (_, qx, qy, *_r) in zip(KIND, INST):
        lim = (SPACE[q] + SPACE[p]) / 2 if q in SPACE else 1.2
        if math.hypot(x - qx, y - qy) < lim: return False
    return True
# the Mall's four rows of elms
for k in range(11):
    y = -14.0 - 7.2 * k
    for i, x in enumerate((-11.5, -6.5, 6.5, 11.5)):
        put('elmA' if (k + i) % 2 == 0 else 'elmB', x + R.uniform(-0.25, 0.25), y + R.uniform(-0.3, 0.3), R.uniform(-0.3, 0.3), R.uniform(0.94, 1.06), R.uniform(0.95, 1.06))
# willows at the water's edge, placed by hand: flanking Bow Bridge's far end in the fourth land's view, and along the shores
for x, y in ((-30.0, 27.6), (-67.0, 25.6), (-47.5, 54.2), (-32.5, 53.8), (24.0, 26.6), (40.0, 26.0), (-88.0, 27.0)):
    put('willow', x, y, R.uniform(-0.35, 0.35), R.uniform(0.92, 1.08), R.uniform(0.95, 1.05))
# the shade the lands' pictures stand in (section 3's light): a plane on the sun's side of each person, about where its
# canopy crosses the low sun's line, for land 4 on the bank and for land 3 in the meadow's ring (the open shade an
# overcast picture comes closest to under one sun); placed by hand, clear of the flights
SHADE_AT = {}
for k, P_ in enumerate(POSE):
    if P_['light'] not in ('shade', 'overcast') or P_['id'] == 'wallet': continue   # (the arcade is open shade already)
    o = Vector((SUBJ[k].x, SUBJ[k].y)) + SUN2 * 15.0
    put('planeA', o.x, o.y, R.uniform(-0.2, 0.2), 1.08, 1.08); SHADE_AT[P_['id']] = (round(o.x, 2), round(o.y, 2))
def scatter(region, kinds, n, tries=4000):
    placed = 0
    for _ in range(tries):
        if placed >= n: break
        x, y = region()
        p = R.choices([k for k, _ in kinds], [w for _, w in kinds])[0]
        # at most 20 degrees of turn: each prototype carries the sun baked on its sunward side
        if free(p, x, y): put(p, x, y, R.uniform(-0.35, 0.35), R.uniform(0.88, 1.12), R.uniform(0.9, 1.12)); placed += 1
    return placed
U = lambda a, b: R.uniform(a, b)
counts = {}
counts['mall flanks'] = scatter(lambda: (R.choice((-1, 1)) * U(16, 32), U(-90, -16)), [('planeA', 3), ('planeB', 3), ('small', 2)], 22)
def ring(k0, k1):
    def f():
        a = U(0, 2 * math.pi); k = U(k0, k1); return MCX + (MA + 2.6) * k * math.cos(a), MCY + (MB + 2.6) * k * math.sin(a)
    return f
counts['meadow ring'] = scatter(ring(1.1, 1.32), [('planeA', 3), ('planeB', 3), ('small', 1)], 28)
counts['meadow belt'] = scatter(ring(1.32, 1.75), [('far', 4), ('planeA', 1)], 34)
counts['west belt'] = scatter(lambda: (U(-122, -100), U(-94, 20)), [('far', 1)], 24)
counts['south belt'] = scatter(lambda: (U(-122, 66), U(-95, -91)), [('far', 1)], 20)
counts['east'] = scatter(lambda: (U(30, 66), U(-94, -5)), [('far', 3), ('planeA', 1), ('planeB', 1)], 25)
counts['bank'] = scatter(lambda: (R.choice((U(-110, -26), U(26, 66))), U(9.5, 19.0)), [('small', 3), ('planeB', 1)], 12)
counts['lakeside'] = scatter(lambda: (U(-110, 66), U(19.5, 30.0)), [('willow', 2), ('planeA', 1)], 8)
counts['north shore'] = scatter(lambda: (U(-110, 66), U(46, 70)), [('willow', 1), ('planeA', 2), ('planeB', 2)], 16)
counts['ramble'] = scatter(lambda: (U(-122, 66), U(62, 86)), [('far', 1)], 50)
# benches along the Mall facing the walk, round the meadow facing in, along the lakeside facing the water; lamps along the walks
for k in range(10):
    y = -14.0 - 7.2 * k - 3.6
    if abs(y - POSE[0]['pos'].y) < 2.5: continue
    put('bench', -5.45, y, math.radians(90)); put('bench', 5.45, y, math.radians(-90))
    yl = -14.0 - 7.2 * k - 1.2
    if k % 2 == 0: put('lamp', -5.75 if k % 4 == 0 else 5.75, yl, 0.0)
for k in range(9):
    a = 2 * math.pi * (k + 0.5) / 9; ex, ey = MCX + (MA + 4.8) * math.cos(a), MCY + (MB + 4.8) * math.sin(a)
    if any(math.hypot(ex - fx_, ey - fy_) < 3.0 for fx_, fy_ in FLY2D): continue
    put('bench', ex, ey, math.atan2(MCX - ex, -(MCY - ey)))
for x in (-30.0, -50.0, -64.0, -80.0, 30.0, 44.0):
    if any(math.hypot(x - fx_, 24.3 - fy_) < 3.0 for fx_, fy_ in FLY2D): continue
    put('bench', x, 24.4 if x < 0 else 23.8, math.radians(180))   # facing north, over the water
for x, y in ((-20.0, -11.0), (20.0, -11.0), (-21.0, 21.2), (21.0, 20.6), (-44.0, 21.0), (-36.0, 24.6), (-62.0, -16.0), (-37.5, -27.0), (-11.0, -26.0)):
    if any(math.hypot(x - fx_, y - fy_) < 2.0 for fx_, fy_ in FLY2D): continue
    put('lamp', x, y, 0.0)

# ---- Blender: scene, light, materials, objects
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = SAMPLES
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for d in prefs.devices: d.use = (d.type == 'METAL')
    sc.cycles.device = 'GPU'
except Exception as e:
    print('GPU setup failed, CPU bake:', e); sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.world = bpy.data.worlds.new('world'); sc.world.use_nodes = True
wn = sc.world.node_tree.nodes; wl = sc.world.node_tree.links
tc = wn.new('ShaderNodeTexCoord'); sep = wn.new('ShaderNodeSeparateXYZ'); mr = wn.new('ShaderNodeMapRange'); ramp = wn.new('ShaderNodeValToRGB')
wl.new(tc.outputs['Generated'], sep.inputs[0]); wl.new(sep.outputs['Z'], mr.inputs['Value'])
mr.inputs['From Min'].default_value = -1.0; mr.inputs['From Max'].default_value = 1.0; mr.clamp = True
wl.new(mr.outputs['Result'], ramp.inputs['Fac'])
els = ramp.color_ramp.elements
while len(els) > 1: els.remove(els[-1])
for k, (z, c) in enumerate(SKY_BAKE):
    e = els[0] if k == 0 else els.new((z + 1) / 2)
    e.position = (z + 1) / 2; e.color = (*c, 1)
bgn = wn['Background']; wl.new(ramp.outputs['Color'], bgn.inputs['Color']); bgn.inputs['Strength'].default_value = SKY_W
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = SUN_W; sun.color = SUN_RGB; sun.angle = math.radians(2.0)
sun_ob = bpy.data.objects.new('sun', sun); sc.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (-L_SUN).to_track_quat('-Z', 'Y').to_euler()

MATS = {}
def material(name, rgb, attr=None, leafy=False):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = 1.0
    if 'Specular IOR Level' in p.inputs: p.inputs['Specular IOR Level'].default_value = 0.0
    if attr:
        an = m.node_tree.nodes.new('ShaderNodeAttribute'); an.attribute_name = attr; an.attribute_type = 'GEOMETRY'
        m.node_tree.links.new(an.outputs['Color'], p.inputs['Base Color'])
        if leafy:   # the bake's leaves let LEAF_T of the light through (green faces only; the bark stays opaque)
            nt = m.node_tree; L_ = nt.links
            sp = nt.nodes.new('ShaderNodeSeparateColor'); L_.new(an.outputs['Color'], sp.inputs['Color'])
            d = nt.nodes.new('ShaderNodeMath'); d.operation = 'SUBTRACT'; L_.new(sp.outputs['Green'], d.inputs[0]); L_.new(sp.outputs['Red'], d.inputs[1])
            gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.01; L_.new(d.outputs[0], gt.inputs[0])
            k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = LEAF_T; L_.new(gt.outputs[0], k.inputs[0])
            tr = nt.nodes.new('ShaderNodeBsdfTranslucent'); L_.new(an.outputs['Color'], tr.inputs['Color'])
            mx = nt.nodes.new('ShaderNodeMixShader'); L_.new(k.outputs[0], mx.inputs['Fac']); L_.new(p.outputs['BSDF'], mx.inputs[1]); L_.new(tr.outputs['BSDF'], mx.inputs[2])
            L_.new(mx.outputs['Shader'], nt.nodes['Material Output'].inputs['Surface'])
    MATS[name] = m; return m
def build(name, g, mat, layer=None, uv=None, weld=True, obj_name=None, lit=None):
    """a mesh from a face soup: the soup's colours as a corner layer, and lit (one colour per face) as 'Col' when given"""
    bm = bmesh.new()
    lay = bm.loops.layers.float_color.new(layer) if layer else None
    lay2 = bm.loops.layers.float_color.new('Col') if lit is not None else None
    for fi, (pts, col) in enumerate(g.faces):
        vs = [bm.verts.new(p) for p in pts]
        try: f = bm.faces.new(vs)
        except ValueError: continue
        if lay:
            cs = col if isinstance(col, list) else [col] * len(pts)
            for l_, c in zip(f.loops, cs): l_[lay] = (*(c or (1, 1, 1)), 1.0)
        if lay2:
            for l_ in f.loops: l_[lay2] = (*lit[fi], 1.0)
    if weld: bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    if uv == 'planar':   # a top projection, cut into 32 m blocks so the packer can fill the atlas round the Lake and the cuts
        ul = bm.loops.layers.uv.new('lightmap')
        for f in bm.faces:
            c = f.calc_center_median(); ox, oy = math.floor(c.x / 32) * 1000.0, math.floor(c.y / 32) * 1000.0
            for l_ in f.loops: l_[ul].uv = (l_.vert.co.x + ox, l_.vert.co.y + oy)
    elif uv == 'diag' or isinstance(uv, tuple):   # a stair: projected along its flight's diagonal (the Mall's runs down to the
        # north; a side stair's up along its U), so each stair's treads and risers are one island
        ax = uv[1] if isinstance(uv, tuple) else Vector((0.0, -1.0))
        ul = bm.loops.layers.uv.new('lightmap')
        for f in bm.faces:
            for l_ in f.loops:
                c = l_.vert.co; l_[ul].uv = (c.x * -ax.y + c.y * ax.x, (-(c.x * ax.x + c.y * ax.y) - c.z) * 0.7071)
    elif uv: bm.loops.layers.uv.new('lightmap')
    me = bpy.data.meshes.new(obj_name or name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(obj_name or name, me); ob.data.materials.append(mat); sc.collection.objects.link(ob)
    return ob

# the lightmapped static meshes: material, how the lightmap UV is made, and the texel weight in the atlas
LM = {   # name: (albedo, colour layer, uv, weight)
    'lawn': ((1, 1, 1), 'Col', 'planar', 1.0), 'lawn_outer': ((1, 1, 1), 'Col', 'planar', 0.32),
    'promenade': (ALB['promenade'], None, 'planar', 1.9), 'path': (ALB['path'], None, 'planar', 1.25), 'drive': (ALB['drive'], None, 'planar', 0.7),
    'granite': (ALB['granite'], None, 'smart', 1.2), 'stone': (ALB['stone'], None, 'smart', 2.1), 'steps': (ALB['stone'], None, 'diag', 2.1),
    'steps_w': (ALB['stone'], None, ('axis', SIDES[0]['U']), 2.1), 'steps_e': (ALB['stone'], None, ('axis', SIDES[1]['U']), 2.1), 'tile': ((1, 1, 1), 'Col', 'smart', 1.6),
    'water': (ALB['water'], None, 'planar', 0.42), 'iron': (ALB['iron'], None, 'smart', 2.6), 'deck': (ALB['deck'], None, 'smart', 2.3),
}
MAT_OF = {'lawn_outer': 'lawn', 'steps': 'stone', 'steps_w': 'stone', 'steps_e': 'stone'}
OBJ = {}
material('lawn', (1, 1, 1), 'Col')
for name, (rgb, layer, uv, w) in LM.items():
    m = MATS.get(MAT_OF.get(name, name)) or material(MAT_OF.get(name, name), rgb, layer)
    OBJ[name] = build(name, G[name], m, layer, uv)
# the bridge's railing, rails, lattice and urns: too fine for the atlas (hundreds of slivers), so shaded in place per face
# like the props, against the whole park, after the bake (unwelded, so its polygons keep the face soup's order)
IN_PLACE = {'railing': ALB['iron']}
for name, rgb in IN_PLACE.items():
    OBJ[name] = build(name, G[name], material(name, rgb), None, None, weld=False, lit=[(1, 1, 1)] * len(G[name].faces))
# the paved strips lie a few centimetres over the lawn: kept out of the shadow rays, so the lawn under their edges is not
# darkened and bleeds no dark fringe out from under them (they still bounce light, and nothing else stands under them)
for name in ('path', 'drive', 'promenade'): OBJ[name].visible_shadow = False
UNLIT = {'sky': 'Col', 'skyline': 'Col', 'farground': 'Col'}
for name in UNLIT: OBJ[name] = build(name, G[name], material(name, (1, 1, 1), 'Col'), 'Col', None, weld=True)
PROTO_OB = {}
for name, g in PROTO.items():
    PROTO_OB[name] = build(name, g, material(name, (1, 1, 1), 'albedo', leafy=bool(g.leaf)), 'albedo', None, lit=PROTO_LIGHT[name]['cols'])
    PROTO_OB[name].data.color_attributes.active_color = PROTO_OB[name].data.color_attributes['Col']
# the instances as linked duplicates, for the bake's shadows and bounce and for the checks
INST_OB = []
for k, (p, x, y, yaw, s, sz) in enumerate(INST):
    ob = bpy.data.objects.new(f'{p}.{k:03d}', PROTO_OB[p].data); sc.collection.objects.link(ob)
    z = floor_at(x, y) - (0.05 if p not in ('bench', 'lamp') else 0.02)
    ob.location = (x, y, z); ob.rotation_euler = (0, 0, yaw); ob.scale = (s, s, sz)
    INST_OB.append(ob)
for ob in PROTO_OB.values(): ob.location = (-4000, -4000, -500)   # out of the way while the park bakes

# ---- the lightmap UVs: one island per planar mesh, smart islands for the built parts, scaled by weight, packed together
def uv_area(me):
    a = 0.0; uvl = me.uv_layers['lightmap'].data
    for p in me.polygons:
        pts = [uvl[li].uv for li in p.loop_indices]
        for i in range(1, len(pts) - 1):
            a += abs((pts[i].x - pts[0].x) * (pts[i + 1].y - pts[0].y) - (pts[i + 1].x - pts[0].x) * (pts[i].y - pts[0].y)) / 2
    return a
for name, (rgb, layer, uv, w) in LM.items():
    ob = OBJ[name]
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    if uv == 'smart':
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, scale_to_bounds=False)
        bpy.ops.object.mode_set(mode='OBJECT')
    me = ob.data; a3 = sum(p.area for p in me.polygons); au = uv_area(me)
    k = math.sqrt(a3 / max(au, 1e-9)) * w
    for d in me.uv_layers['lightmap'].data: d.uv = (d.uv.x * k, d.uv.y * k)
sc.tool_settings.use_uv_select_sync = True
bpy.ops.object.select_all(action='DESELECT')
for name in LM: OBJ[name].select_set(True)
bpy.context.view_layer.objects.active = OBJ['stone']
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.pack_islands(rotate=True, scale=True, margin_method='FRACTION', margin=0.0025, shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
DENS = {}
for name, (rgb, layer, uv, w) in LM.items():
    me = OBJ[name].data; a3 = sum(p.area for p in me.polygons); au = uv_area(me)
    DENS[name] = {'area_m2': round(a3, 1), 'uv_share': round(au, 4), 'texels_per_m': round(math.sqrt(au * 1024 * 1024 / max(a3, 1e-9)), 2), 'weight': w}
print('DENSITY', json.dumps(DENS))

# ---- the bake: a calibration quad alone (open level ground, sun on and off), then the park into the atlas
def bake_selected(objs, image):
    for ob in objs:
        for m in ob.data.materials:
            nt = m.node_tree
            t = nt.nodes.get('lm') or nt.nodes.new('ShaderNodeTexImage'); t.name = 'lm'; t.image = image; nt.nodes.active = t
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objs: ob.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.bake(type='DIFFUSE')
sc.cycles.bake_type = 'DIFFUSE'
bk = sc.render.bake; bk.use_pass_direct = True; bk.use_pass_indirect = True; bk.use_pass_color = False; bk.margin = 16; bk.target = 'IMAGE_TEXTURES'
for name in UNLIT: OBJ[name].hide_render = True
cal_me = bpy.data.meshes.new('calib'); cal_me.from_pydata([(-3000.5, -3000.5, 0.02), (-2999.5, -3000.5, 0.02), (-2999.5, -2999.5, 0.02), (-3000.5, -2999.5, 0.02)], [], [(0, 1, 2, 3)])
cuv = cal_me.uv_layers.new(name='lightmap')
for i, uvv in enumerate([(0.1, 0.1), (0.9, 0.1), (0.9, 0.9), (0.1, 0.9)]): cuv.data[i].uv = uvv
cal = bpy.data.objects.new('calib', cal_me); sc.collection.objects.link(cal); cal.data.materials.append(material('calib', (1, 1, 1)))
gnd_me = bpy.data.meshes.new('studio'); gnd_me.from_pydata([(-4500, -4500, 0), (-1500, -4500, 0), (-1500, -1500, 0), (-4500, -1500, 0)], [], [(0, 1, 2, 3)])
gnd = bpy.data.objects.new('studio', gnd_me); sc.collection.objects.link(gnd); gnd.data.materials.append(material('studio', ALB['lawn']))
cimg = bpy.data.images.new('calib', 16, 16, float_buffer=True)
E_OPEN = {}
for tag, energy in (('all', SUN_W), ('sky', 0.0)):
    sun.energy = energy
    bake_selected([cal], cimg)
    a = np.array(cimg.pixels[:], dtype=np.float32).reshape(16, 16, 4)
    E_OPEN[tag] = [float(v) for v in a[6:10, 6:10, :3].reshape(-1, 3).mean(axis=0)]
sun.energy = SUN_W
EL = lum(E_OPEN['all'])
print('CALIB', E_OPEN, 'shade ratio', round(lum(E_OPEN['sky']) / EL, 3), '; the props\' analytic open ground', [round(v, 4) for v in E_OPEN_A], 'ratio to the bake', round(EL_A / EL, 4))
gnd.hide_render = True; cal.hide_render = True
img = bpy.data.images.new('lightmap', SIZE, SIZE, float_buffer=True)
t1 = time.time(); bake_selected([OBJ[n] for n in LM], img); t2 = time.time()
px = np.array(img.pixels[:], dtype=np.float32).reshape(SIZE, SIZE, 4)
LMV = px[:, :, :3] / EL * UNIT
LMV = np.where(LMV < 0.8, LMV, 0.8 + 0.2 * (1 - np.exp(-(LMV - 0.8) / 0.2)))
enc = np.where(LMV <= 0.0031308, 12.92 * LMV, 1.055 * np.power(np.clip(LMV, 0.0031308, None), 1 / 2.4) - 0.055)
out = np.concatenate([np.clip(enc, 0, 1), np.ones((SIZE, SIZE, 1), np.float32)], axis=2)
lmimg = bpy.data.images.new('lightmap8', SIZE, SIZE)
lmimg.pixels.foreach_set(out.ravel()); lmimg.filepath_raw = os.path.join(OUT, 'park-lightmap.png'); lmimg.file_format = 'PNG'; lmimg.save()
lit_texels = LMV.reshape(-1, 3)[(px[:, :, 3].ravel() > 0) & (LMV.reshape(-1, 3).sum(axis=1) > 0.01)]
print('LIGHTMAP', SIZE, 'bake', round(t2 - t1, 1), 's; stored median', float(np.median(lum(lit_texels.T))) if len(lit_texels) else None)

# ---- each instance's shade: what its neighbours hide of the sun and the sky (the whole park as one BVH, each triangle
# tagged by its owner, -1 for the static meshes; the same BVH flies the checks below)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
WV, WP, WO, TUV, TCOL = [], [], [], [], []   # per triangle: corners, owner, lightmap UVs, and the albedo (static) or lit colour (props)
def add_world(ob, owner, albedo=None):
    me = ob.evaluated_get(dg).to_mesh(); mw = ob.matrix_world; i0 = len(WV)
    WV.extend(mw @ v.co for v in me.vertices); me.calc_loop_triangles()
    uvl = me.uv_layers.get('lightmap'); cl = me.color_attributes.get('Col')
    for t in me.loop_triangles:
        WP.append([i0 + t.vertices[0], i0 + t.vertices[1], i0 + t.vertices[2]]); WO.append(owner)
        TUV.append([tuple(uvl.data[l].uv) for l in t.loops] if uvl else None)
        TCOL.append([tuple(cl.data[l].color)[:3] for l in t.loops] if cl else [albedo] * 3)
    ob.evaluated_get(dg).to_mesh_clear()
for name, (rgb, layer, uv, w) in LM.items(): add_world(OBJ[name], -3 if name.startswith('steps') else -1, rgb)   # (-3: a stair's treads and risers)
for name in IN_PLACE: add_world(OBJ[name], -2)
for k, ob in enumerate(INST_OB): add_world(ob, k)
PARK = BVHTree.FromPolygons(WV, WP, all_triangles=True, epsilon=0.0)
# the unlit far meshes (the sky dome, the skyline cards, the far ground) on their own, for what a view shows past the park
FV, FP, FCOL = [], [], []
for name in UNLIT:
    me = OBJ[name].data; me.calc_loop_triangles(); cl = me.color_attributes['Col']; i0 = len(FV)
    FV.extend(OBJ[name].matrix_world @ v.co for v in me.vertices)
    for t in me.loop_triangles: FP.append([i0 + v for v in t.vertices]); FCOL.append([tuple(cl.data[l].color)[:3] for l in t.loops])
FAR = BVHTree.FromPolygons(FV, FP, all_triangles=True, epsilon=0.0)
# the in-place meshes' faces: the sun by ray, the sky by the same 48 rays (what they meet bounces a little light back)
for name, rgb in IN_PLACE.items():
    me = OBJ[name].data; ca = me.color_attributes['Col']; alb = Vector(rgb)
    assert len(me.polygons) == len(G[name].faces), name
    for p in me.polygons:
        n = p.normal.copy(); o = p.center + n * 0.012
        e = SUN_E * n.dot(L_SUN) if n.dot(L_SUN) > 0 and PARK.ray_cast(o, L_SUN, 400.0)[0] is None else Vector((0, 0, 0))
        sky = Vector((0, 0, 0))
        for d in dome_dirs:
            dd = to_normal(d, n)
            if PARK.ray_cast(o, dd, 200.0)[0] is not None: sky += Vector(ALB['lawn']) * EL_A * 0.6
            elif dd.z < 0: sky += GROUND_L
            else: sky += SKY_L(dd)
        lit = [alb[i] * (e[i] + sky[i] / len(dome_dirs)) / EL_A for i in range(3)]
        lit = [x if x < 0.85 else 0.85 + 0.15 * (1 - math.exp(-(x - 0.85) / 0.15)) for x in lit]
        for li in p.loop_indices: ca.data[li].color = (*lit, 1.0)
    i0 = WO.index(-2)   # and the BVH's colours for those faces, for the exposure below
    me.calc_loop_triangles()
    for k_, t in enumerate(me.loop_triangles): TCOL[i0 + k_] = [tuple(ca.data[l].color)[:3] for l in t.loops]
def cast(o, d, own, far=400.0):
    """the first hit along d that is not the instance own, or None"""
    p = o.copy()
    for _ in range(6):
        hit, nrm, idx, dist = PARK.ray_cast(p, d, far)
        if hit is None: return None
        if WO[idx] != own: return hit
        p = hit + d * 0.02
    return None
SHADE = []
for k, (p, x, y, yaw, s, sz) in enumerate(INST):
    info = PROTO_LIGHT[p]; mw = INST_OB[k].matrix_world; m3 = mw.to_3x3()
    picks = info['samples'][:14]
    sun_ok, sky_ok, sky_n = 0, 0, 0
    for ctr, n, area in picks:
        o = mw @ ctr; nn = (m3 @ n).normalized(); o = o + nn * 0.05
        if cast(o, L_SUN, k) is None: sun_ok += 1
        for d in dome_dirs[::4]:
            dd = to_normal(d, nn) if nn.z > -0.3 else d
            if dd.z <= 0.02: continue
            sky_n += 1
            if cast(o, dd, k, 150.0) is None: sky_ok += 1
    fs, fk = sun_ok / max(1, len(picks)), sky_ok / max(1, sky_n)
    tot = info['sky'] + info['sun']
    f = (info['sky'] * fk + info['sun'] * fs) / tot if tot > 0 else 1.0
    tint = 1.0 + R.uniform(-0.07, 0.07)
    hue = (1.0 + R.uniform(-0.04, 0.04), 1.0, 1.0 + R.uniform(-0.05, 0.03)) if p not in ('bench', 'lamp') else (1, 1, 1)
    tk = ROUND_TINT if KIND[k] == 'far' else (1.0, 1.0, 1.0)   # the belts' darker leaf (the round prototype carries the small trees')
    SHADE.append([round(min(1.0, max(0.22, f * tint * h)) * tk[i], 4) for i, h in enumerate(hue)])

# ---- exposure, as the runtime draws it: each lightmapped or baked colour x the scene's exposure, each unlit one (the sky,
# the skyline, the far ground) x the sky's own. A view is metered through a 16:10 frame of rays: the scene's exposure
# brings the mean displayed luminance off the sky toward a photograph's (EXPO_TARGET, at most EXPO_MAX, for the shaded
# places to read as the pictures will), but never so far that more than CLIP_AIM of the frame clips (any channel at CLIP_AT
# or over: 8-bit output shows 0.9955 as 255, and the lightmap's 8-bit, lossy encoding moves a bright texel by up to about
# 2 percent, so a wall the bake puts at 0.99 can show as 255), in
# the 16:10 frame or the phone's 390 x 844 one at the same vertical FOV; the sky's is the scene's, held under 0.92 on the
# brightest unlit channel in view, so the sky never clips
def bary(V_, P_, i, hit):
    a, b_, c = (V_[j] for j in P_[i])
    v0, v1, v2 = b_ - a, c - a, hit - a
    d00, d01, d11, d20, d21 = v0.dot(v0), v0.dot(v1), v1.dot(v1), v2.dot(v0), v2.dot(v1)
    den = d00 * d11 - d01 * d01 or 1e-12
    wb = (d11 * d20 - d01 * d21) / den; wc = (d00 * d21 - d01 * d20) / den
    return 1 - wb - wc, wb, wc
def shade_at(hit, idx):
    wa, wb, wc = bary(WV, WP, idx, hit)
    col = [TCOL[idx][0][i] * wa + TCOL[idx][1][i] * wb + TCOL[idx][2][i] * wc for i in range(3)]
    if WO[idx] == -2: return col
    if WO[idx] >= 0: return [col[i] * SHADE[WO[idx]][i] for i in range(3)]
    uv = [TUV[idx][0][i] * wa + TUV[idx][1][i] * wb + TUV[idx][2][i] * wc for i in range(2)]
    px_ = LMV[min(SIZE - 1, max(0, int(uv[1] * SIZE))), min(SIZE - 1, max(0, int(uv[0] * SIZE)))]
    return [col[i] * float(px_[i]) / UNIT for i in range(3)]
def far_at(hit, idx):
    wa, wb, wc = bary(FV, FP, idx, hit)
    return [FCOL[idx][0][i] * wa + FCOL[idx][1][i] * wb + FCOL[idx][2][i] * wc for i in range(3)]
EXPO_TARGET, EXPO_MAX, EXPO_MIN, CLIP_AIM, CLIP_MAX, CLIP_AT, SKY_TOP, PHONE = 0.14, 2.4, 0.8, 0.01, 0.02, 0.97, 0.92, 390 / 844
def frame(pos, fwd, fov, nx=48, ny=30, aspect=1.6):
    """a frame's rays from pos along fwd (16:10 unless told): the scene's colours (unexposed) and the unlit ones"""
    right = fwd.cross(Vector((0, 0, 1))).normalized(); up = right.cross(fwd); th = math.tan(math.radians(fov) / 2)
    scene, far = [], []
    for i in range(nx):
        for j in range(ny):
            d = (fwd + right * ((i + 0.5) / nx * 2 - 1) * th * aspect + up * ((j + 0.5) / ny * 2 - 1) * th).normalized()
            h = PARK.ray_cast(pos, d, 1500.0)
            if h[0] is not None: scene.append(shade_at(h[0], h[2])); continue
            h = FAR.ray_cast(pos, d, 4000.0)
            far.append(far_at(h[0], h[2]) if h[0] is not None else [0.0, 0.0, 0.0])
    return scene, far
def clip_limit(scene, far):
    """the most exposure the frame takes before more than CLIP_AIM of it clips"""
    top = sorted((max(c) for c in scene), reverse=True); allow = int(CLIP_AIM * (len(scene) + len(far)))
    return 0.999 * CLIP_AT / top[allow] if allow < len(top) and top[allow] > 0 else EXPO_MAX
def frames(pos, fwd, fov, nx, ny):
    """the 16:10 frame and the phone's portrait one (at about the same ray density)"""
    return frame(pos, fwd, fov, nx, ny), frame(pos, fwd, fov, max(8, round(nx * PHONE / 1.6 * 2)), ny * 2, PHONE)
def meter(views):
    """(the scene's exposure, the sky's, the mean) for a view's frames: toward EXPO_TARGET on the wide frame, never under 1
    on that count (a sunlit land shows as baked), under 1 only so far as the frames need to stay unclipped"""
    scene = views[0][0]; mean = sum(lum(c) for c in scene) / max(1, len(scene))
    e = max(EXPO_MIN, min(max(1.0, min(EXPO_MAX, EXPO_TARGET / max(mean, 1e-4))), *(clip_limit(sc_, fa_) for sc_, fa_ in views)))
    fmax = max((max(c) for _, fa_ in views for c in fa_), default=0.0)
    return e, (min(e, SKY_TOP / fmax) if fmax > 0 else e), mean
def clipped(scene, far, e, es):
    n = len(scene) + len(far)
    return (sum(1 for c in scene if max(c) * e >= CLIP_AT) + sum(1 for c in far if max(c) * es >= CLIP_AT)) / max(1, n)
for P_ in POSE:
    vw = frames(P_['pos'], (P_['target'] - P_['pos']).normalized(), P_['fov'], 64, 40)
    P_['exposure'], P_['sky_exposure'], P_['mean_lum'] = meter(vw)
    sc_, fa_ = vw[0]; P_['sky_share'] = len(fa_) / (len(sc_) + len(fa_))
    P_['clip'], P_['clip_phone'] = (clipped(a_, b_, P_['exposure'], P_['sky_exposure']) for a_, b_ in vw)
print('EXPOSURE', [(P_['id'], round(P_['mean_lum'], 4), round(P_['exposure'], 3), round(P_['sky_exposure'], 3), round(P_['clip'], 4)) for P_ in POSE])
# the flights' exposures, one per look key: the two lands' exposures carried across (in stops), lowered only where a
# key's own view would clip, the dips eased (a three-key minimum, then two passes of a 1-2-1 blur, which stay under the
# limits) so the frame does not pump; the sky's held under its limit the same way
for f in FL:
    a, b = POSE[f['from']], POSE[f['to']]
    f['kfov'] = [a['fov'] + (b['fov'] - a['fov']) * k / (KEYS - 1) for k in range(KEYS)]
    lim, slim = [], []
    for k in range(KEYS):
        vw = frames(f['kpos'][k], (f['keys'][k] - f['kpos'][k]).normalized(), f['kfov'][k], 40, 25)
        fmax = max((max(c) for _, fa_ in vw for c in fa_), default=0.0); lim.append(min(clip_limit(a_, b_) for a_, b_ in vw)); slim.append(SKY_TOP / fmax if fmax > 0 else EXPO_MAX)
    def ease_down(base, cap_):
        lg = np.minimum(np.log2(base), np.log2(cap_)); want = lg.copy()
        lg[1:-1] = np.minimum(np.minimum(lg[:-2], lg[1:-1]), lg[2:])
        for _ in range(2): lg[1:-1] = (lg[:-2] + 2 * lg[1:-1] + lg[2:]) / 4
        return [2 ** float(v) for v in np.minimum(lg, want)]
    t_ = np.arange(KEYS) / (KEYS - 1)
    base = 2 ** (np.log2(a['exposure']) * (1 - t_) + np.log2(b['exposure']) * t_)
    f['kexp'] = ease_down(base, np.array(lim)); f['kexp'][0], f['kexp'][-1] = a['exposure'], b['exposure']
    sbase = 2 ** (np.log2(a['sky_exposure']) * (1 - t_) + np.log2(b['sky_exposure']) * t_)
    f['ksky'] = ease_down(np.minimum(sbase, f['kexp']), np.array(slim)); f['ksky'][0], f['ksky'][-1] = a['sky_exposure'], b['sky_exposure']
print('FLIGHT EXPOSURE', [[round(v, 2) for v in f['kexp']] for f in FL])

# ---- the checks. Each flight, at 2600 ms (the default) and 4500 ms (the most): the view's peak turn rate at 60 fps
# (the line is RATE_MAX, roll none), its pitch, how far the look strays from the direction of travel while the camera
# moves fast and how much room the view has ahead then, the camera's height over the surface, clearance and headroom, and
# the share of its 16:10 frames that clip under the keys' exposures; each pose, the same frame and the light on the
# picture's person against the land's table (sun, or shade; an overcast picture can only be matched by shade)
def nearest(p):
    r = PARK.find_nearest(p, 50.0); return r[3] if r[0] is not None else 50.0
def lerp_keys(vals, tau): x = tau * (KEYS - 1); i = min(KEYS - 2, int(x)); return vals[i] + (vals[i + 1] - vals[i]) * (x - i)
FAILS = []
CHECK = []
for f in FL:
    name = f"flight {f['from'] + 1} to {f['to'] + 1}"
    S = f['samples']; hmin, hmax, cmin, ceil_min = 9, 0, 9, 9; length = f['curve'].L[-1]
    for p in S:
        hit = PARK.ray_cast(p, Vector((0, 0, -1)), 30.0)
        h = (p - hit[0]).length if hit[0] is not None else 9
        hmin, hmax = min(hmin, h), max(hmax, h)
        up = PARK.ray_cast(p, Vector((0, 0, 1)), 30.0)
        if up[0] is not None: ceil_min = min(ceil_min, (up[0] - p).length)
        cmin = min(cmin, nearest(p))
    rate = {}
    for ms in (TRAVEL_MS, TRAVEL_MS_MAX):
        F = fly(f, ms); peak, at = 0.0, 0.0
        for k in range(1, len(F)):
            r = math.degrees(math.acos(max(-1.0, min(1.0, F[k][2].dot(F[k - 1][2]))))) * 60
            if r > peak: peak, at = r, F[k][0]
        rate[str(ms)] = {'peakDegPerS': round(peak, 1), 'atTau': round(at, 3)}
    F = fly(f, TRAVEL_MS); sp = [((F[k + 1][1] - F[k][1]).length * 60) for k in range(len(F) - 1)] + [0.0]; vmax = max(sp)
    pitch = max(abs(math.degrees(math.asin(max(-1.0, min(1.0, d.z))))) for _, _, d in F)
    stray, room, room_at, clip_max, clip_at, clip_phone = 0.0, 1e9, 0.0, 0.0, 0.0, 0.0
    hlow = min(((p - PARK.ray_cast(p, Vector((0, 0, -1)), 30.0)[0]).length, tau) for tau, p, _ in F if PARK.ray_cast(p, Vector((0, 0, -1)), 30.0)[0] is not None)
    for k in range(len(F) - 1):
        tau, p, d = F[k]; mv = F[k + 1][1] - p
        if sp[k] > 0.5 * vmax and mv.length > 1e-6:
            h2, m2 = Vector((d.x, d.y)).normalized(), Vector((mv.x, mv.y)).normalized()
            stray = max(stray, math.degrees(math.acos(max(-1.0, min(1.0, h2.dot(m2))))))
        if sp[k] > 0.25 * vmax:   # (a stair the camera climbs or descends is the view ahead, not a wall in its way)
            h = PARK.ray_cast(p, d, 400.0); rm = (h[0] - p).length if h[0] is not None else 400.0
            if rm < room and not (h[0] is not None and WO[h[2]] == -3): room, room_at = rm, tau
        if k % 2 == 0:
            vw = frames(p, d, lerp_keys(f['kfov'], tau), 40, 25)
            c, cp = (clipped(a_, b_, lerp_keys(f['kexp'], tau), lerp_keys(f['ksky'], tau)) for a_, b_ in vw)
            if c > clip_max: clip_max, clip_at = c, tau
            clip_phone = max(clip_phone, cp)
    row = {'from': f['from'], 'to': f['to'], 'length_m': round(length, 1), 'eye_over_surface_m': [round(hmin, 2), round(hmax, 2)], 'clearance_m': round(cmin, 2),
           'headroom_m': round(ceil_min, 2) if ceil_min < 9 else None, 'viewRate': rate, 'rollDeg': 0, 'pitchMaxDeg': round(pitch, 1),
           'peakSpeedMps': round(vmax, 1), 'lookStrayFastDeg': round(stray, 1), 'roomAheadFastM': round(room, 2), 'roomAtTau': round(room_at, 3), 'eyeLowAtTau': round(hlow[1], 3), 'clipMax': round(clip_max, 4), 'clipAtTau': round(clip_at, 3), 'clipMaxPhone': round(clip_phone, 4)}
    CHECK.append(row)
    if rate[str(TRAVEL_MS)]['peakDegPerS'] > RATE_MAX: FAILS.append(f"{name}: the view turns {rate[str(TRAVEL_MS)]['peakDegPerS']} degrees a second at {TRAVEL_MS} ms, over {RATE_MAX}")
    if clip_max > CLIP_MAX: FAILS.append(f'{name}: {clip_max:.1%} of a 16:10 frame clips at tau {clip_at:.2f}, over {CLIP_MAX:.0%}')
    if clip_phone > CLIP_MAX: FAILS.append(f"{name}: {clip_phone:.1%} of a phone's frame clips, over {CLIP_MAX:.0%}")
    if cmin < 1.0 or hmin < 1.0: FAILS.append(f'{name}: clearance {cmin:.2f} m, eye over the surface {hmin:.2f} m')
    if room < 3.0: FAILS.append(f'{name}: the view has {room:.1f} m of room ahead while the camera moves fast')
POSE_CHECK = []
for k, P_ in enumerate(POSE):
    d = (P_['target'] - P_['pos']).normalized(); hit = PARK.ray_cast(P_['pos'], d, 400.0)
    fl = floor_at(SUBJ[k].x, SUBJ[k].y)
    hits = [PARK.ray_cast(Vector((SUBJ[k].x, SUBJ[k].y, fl + hgt)), L_SUN, 400.0) for hgt in (1.0, 1.5)]
    lit = [h[0] is None for h in hits]
    got = 'sun' if all(lit) else ('shade' if not any(lit) else 'part sun')
    by = sorted(set(('the park' if WO[h[2]] < 0 else INST[WO[h[2]]][0]) + f' at {round((h[0] - SUBJ[k].to_3d()).length, 1)} m' for h in hits if h[0] is not None))
    want = 'shade' if P_['light'] == 'overcast' else P_['light']
    POSE_CHECK.append({'id': P_['id'], 'free_ahead_m': round((hit[0] - P_['pos']).length, 2) if hit[0] is not None else None, 'clearance_m': round(nearest(P_['pos']), 2),
                       'eye_over_floor_m': round(P_['pos'].z - floor_at(P_['pos'].x, P_['pos'].y), 2), 'clip': round(P_['clip'], 4), 'clipPhone': round(P_['clip_phone'], 4),
                       'light': {'picture': P_['light'], 'person': got, 'shadedBy': by, **({'gap': 'an overcast picture under the one sun: the person stands in a tree\'s open shade, the view beyond in sun'} if P_['light'] == 'overcast' else {})}})
    if max(P_['clip'], P_['clip_phone']) > CLIP_MAX: FAILS.append(f"pose {P_['id']}: {max(P_['clip'], P_['clip_phone']):.1%} of a frame clips, over {CLIP_MAX:.0%}")
    if got != want: FAILS.append(f"pose {P_['id']}: the picture's person is in {got}, the land's light is {P_['light']}")
print('CHECKS', json.dumps(CHECK), json.dumps(POSE_CHECK))
print('FAILS', FAILS if FAILS else 'none')

# ---- optional Cycles look renders from the four poses (the path-traced reference for the runtime's look)
if LOOKS:
    cam = bpy.data.cameras.new('cam'); cam.lens_unit = 'FOV'; cam.sensor_fit = 'VERTICAL'
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    sc.render.resolution_x, sc.render.resolution_y = 640, 400; sc.cycles.samples = 48
    OBJ['skyline'].hide_render = False; OBJ['farground'].hide_render = False
    for P_ in POSE:
        cam.angle = math.radians(P_['fov']); co.location = P_['pos']
        co.rotation_euler = (P_['target'] - P_['pos']).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(OUT, f"look-{P_['id']}.png"); bpy.ops.render.render(write_still=True)

# ---- export: the static and unlit meshes in place, each prototype once at the origin
for name in UNLIT: OBJ[name].hide_render = False
for ob in PROTO_OB.values(): ob.location = (0, 0, 0)
bpy.ops.object.select_all(action='DESELECT')
for ob in list(OBJ.values()) + list(PROTO_OB.values()): ob.select_set(True)
bpy.context.view_layer.objects.active = OBJ['lawn']
glb = os.path.join(OUT, 'park-raw.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_materials='EXPORT', export_apply=False, export_yup=True,
                          export_normals=False, export_texcoords=True, export_vertex_color='NAME', export_vertex_color_name='Col', export_all_vertex_colors=False)
Y = lambda v: [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]   # Blender's frame to glTF's (Y up; Blender's y is glTF's -z)
objects = {}
for name, (rgb, layer, uv, w) in LM.items():
    objects[name] = {'material': MAT_OF.get(name, name), 'light': 'lightmap', 'albedo': [round(c, 5) for c in rgb], 'tris': G[name].tris(), 'density': DENS[name]}
for name in UNLIT: objects[name] = {'material': name, 'light': 'unlit', 'albedo': [1, 1, 1], 'tris': G[name].tris()}
for name in IN_PLACE: objects[name] = {'material': name, 'light': 'baked', 'albedo': [1, 1, 1], 'tris': G[name].tris(), 'instanced': False}
for name, g in PROTO.items(): objects[name] = {'material': name, 'light': 'baked', 'albedo': [1, 1, 1], 'tris': g.tris(), 'doubleSided': name in DOUBLE, 'instanced': True}
instances = {}
for k, (p, x, y, yaw, s, sz) in enumerate(INST):
    z = INST_OB[k].location.z
    instances.setdefault(p, []).append({'t': Y((x, y, z)), 'r': [0.0, round(math.sin(yaw / 2), 6), 0.0, round(math.cos(yaw / 2), 6)], 's': [round(s, 4), round(sz, 4), round(s, 4)], 'c': SHADE[k]})
R4 = lambda v: round(float(v), 4)
report = {
    'size': SIZE, 'samples': SAMPLES, 'bake_s': round(t2 - t1, 1), 'total_s': round(time.time() - t0, 1),
    'light': {'unit': UNIT, 'eOpen': E_OPEN, 'eOpenProps': [round(c, 5) for c in E_OPEN_A], 'shadeRatio': round(lum(E_OPEN['sky']) / EL, 3), 'sun': {'dir': Y(L_SUN), 'azimuth': SUN_AZ, 'elevation': SUN_EL, 'rgb': SUN_RGB,
                      'note': "for Sam: section 3's table gives land 1 direct afternoon sun, and its photo is lit low from frame right; with land 1 facing north up the Mall toward Bethesda, light from frame right is an eastern sun, so the park's one sun is a low morning sun in its own frame (the picture cannot show the hour); land 3's overcast is matched by a tree's open shade"},
              'exposure': {'target': EXPO_TARGET, 'max': EXPO_MAX, 'min': EXPO_MIN, 'clipAim': CLIP_AIM, 'clipMax': CLIP_MAX, 'clipAt': CLIP_AT, 'skyTop': SKY_TOP,
                           'measured': {P_['id']: {'meanLum': R4(P_['mean_lum']), 'skyShare': R4(P_['sky_share'])} for P_ in POSE}}},
    'objects': objects, 'instances': instances, 'scatter': counts, 'shadeTrees': SHADE_AT,
    'poses': [{'id': P_['id'], 'place': P_['place'], 'position': Y(P_['pos']), 'target': Y(P_['target']), 'fov': P_['fov'], 'near': NEAR,
               'exposure': round(P_['exposure'], 3), 'skyExposure': round(P_['sky_exposure'], 3), 'light': P_['light']} for P_ in POSE],
    'travel': {'ms': TRAVEL_MS, 'msMax': TRAVEL_MS_MAX, 'ease': 'easeInOutCubic', 'keys': KEYS, 'rateMaxDegPerS': RATE_MAX, 'rateDesignDegPerS': RATE_DESIGN},
    'flights': [{'from': f['from'], 'to': f['to'], 'points': [Y(p) for p in f['pts']], 'look': [Y(p) for p in f['keys']],
                 'exposure': [round(v, 3) for v in f['kexp']], 'skyExposure': [round(v, 3) for v in f['ksky']], 'fov': [round(v, 2) for v in f['kfov']]} for f in FL],
    'checks': {'pass': not FAILS, 'failures': FAILS, 'flights': CHECK, 'poses': POSE_CHECK},
    'glb_bytes': os.path.getsize(glb),
}
json.dump(report, open(os.path.join(OUT, 'park-report.json'), 'w'), indent=1)
print('DONE', json.dumps({k: report[k] for k in ('size', 'samples', 'bake_s', 'total_s', 'glb_bytes')}), 'instances', {k: len(v) for k, v in instances.items()})
if FAILS:   # the report is written either way; the run fails, so pack.mjs is not run on a park that fails its checks
    print('CHECKS FAILED:\n  ' + '\n  '.join(FAILS)); sys.exit(1)
