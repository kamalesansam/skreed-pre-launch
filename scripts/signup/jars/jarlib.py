"""Shared geometry for section 5's jar renders (Blender 5.2, Cycles): the jar traced from Sam's picture of 2026-11-02 and its pellet.

Units: the jar body's outer radius is 1.0. In Sam's picture (2.webp, 1019 x 1543 px) the body is 152-153 px wide,
so 1 unit = 76.5 px there. Every dimension below was traced from the picture's jar 4 (the empty one, the cleanest
silhouette) and checked against jar 1 and jar 2: per-row outermost non-background pixels (scripts/silhouette.mjs),
heights mapped from rows with the base plane at y 901.6 and 75.76 px per unit (a view about 8 degrees from above).
"""
import math
import bpy
import bmesh
from mathutils import Vector, Quaternion, Matrix

# ---------------------------------------------------------------------------------------------------------------
# the jar, traced
JAR = dict(
    wall=0.05,          # glass wall (the dark edge band is 4-5 px in the picture, refraction widens it)
    floor_h=0.20,       # inner floor height: the thick base (inner floor ellipse at y 877-893 in jar 4)
    punt=0.025,         # the outer bottom is raised this much at the centre (the dimple seen through the base)
    punt_r=0.55,
    foot=0.10,          # outer bottom corner radius (the silhouette narrows from y 889)
    inner_foot=0.10,    # inner floor corner radius
    body_top=3.17,      # the shoulder starts (outer), fitted
    shoulder_a1=0.20,   # shoulder Bezier handles, fitted to 14 traced rows within 0.6 px
    shoulder_a2=0.04,
    neck_r=0.807,       # neck outer radius (123-124 px wide in jar 4)
    neck_bot=3.51,
    bead_c=(0.873, 3.83),  # the rolled lip: an ellipse in (r, h), outer 0.988 (151 px wide), 3.725 to 3.935
    bead_rr=0.115,
    bead_rh=0.105,
)
JAR_TOP = JAR['bead_c'][1] + JAR['bead_rh']   # 3.935


def _bez(p0, p1, p2, p3, t):
    a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
    return (a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1])


def _shoulder(n=24):
    J = JAR
    P0, P1 = (1.0, J['body_top']), (1.0, J['body_top'] + J['shoulder_a1'])
    P2, P3 = (J['neck_r'], J['neck_bot'] - J['shoulder_a2']), (J['neck_r'], J['neck_bot'])
    return [_bez(P0, P1, P2, P3, i / n) for i in range(n + 1)]


def _offset(curve, d):
    """offset a (r, h) polyline that runs upwards by d towards the axis (its left normal when going up)"""
    out = []
    for i, p in enumerate(curve):
        a = curve[max(0, i - 1)]
        b = curve[min(len(curve) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        L = math.hypot(tx, ty) or 1.0
        nx, ny = -ty / L, tx / L          # left normal of an upward tangent points to -r
        out.append((p[0] + nx * d, p[1] + ny * d))
    return out


def _arc(cx, cy, r, a0, a1, n):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def _ell(cx, cy, rr, rh, a0, a1, n):
    return [(cx + rr * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + rh * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def _qbez(p0, p1, p2, n):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]


def _dedup(pts, eps=1e-5):
    out = []
    for p in pts:
        if not out or math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > eps:
            out.append(p)
    return out


def jar_section():
    """The closed cross-section of the glass in (r, h): from the outer bottom centre, out and up the outside, over the
    lip, down the inside to the inner floor centre. Revolved, it is a closed solid shell."""
    J = JAR
    w = J['wall']
    pts = []
    # outer bottom: the punt, then the resting ring, then the foot
    for i in range(9):
        r = J['punt_r'] * i / 8
        pts.append((r, J['punt'] * 0.5 * (1 + math.cos(math.pi * r / J['punt_r']))))
    pts.append((1 - J['foot'], 0.0))
    pts += _arc(1 - J['foot'], J['foot'], J['foot'], -90, 0, 10)[1:]
    # body
    pts += [(1.0, J['foot'] + (J['body_top'] - J['foot']) * i / 12) for i in range(1, 13)]
    # shoulder, neck
    sh = _shoulder(24)
    pts += sh[1:]
    cx, cy = J['bead_c']
    rr, rh = J['bead_rr'], J['bead_rh']
    # where the neck meets the bead's underside
    u = (J['neck_r'] - cx) / rr
    hj = cy - rh * math.sqrt(max(0.0, 1 - u * u))
    phi_j = math.degrees(math.atan2((hj - cy) / rh, u))      # about -125
    pts += [(J['neck_r'], J['neck_bot'] + (hj - 0.025 - J['neck_bot']) * i / 4) for i in range(1, 5)]
    # a small concave blend into the bead
    phi_b = phi_j + 14
    pb = (cx + rr * math.cos(math.radians(phi_b)), cy + rh * math.sin(math.radians(phi_b)))
    pts += _qbez((J['neck_r'], hj - 0.025), (J['neck_r'], hj), pb, 6)[1:]
    # the bead, round to its inner extreme
    pts += _ell(cx, cy, rr, rh, phi_b, 180, 40)[1:]
    # inside: the neck down, the inner shoulder, the inner wall, the inner floor
    rin_neck = J['neck_r'] - w
    pts += [(rin_neck, cy - 0.04 - (cy - 0.04 - J['neck_bot']) * i / 4) for i in range(0, 5)]
    ish = _offset(sh, w)
    pts += list(reversed(ish))[1:]
    rin = 1.0 - w
    fh = J['floor_h'] + J['inner_foot']
    pts += [(rin, J['body_top'] - (J['body_top'] - fh) * i / 12) for i in range(1, 13)]
    pts += _arc(rin - J['inner_foot'], fh, J['inner_foot'], 0, -90, 8)[1:]
    pts += [((rin - J['inner_foot']) * (1 - i / 8), J['floor_h']) for i in range(1, 9)]
    return _dedup(pts)


def inner_radius_at(h):
    """the glass's inner radius at height h (for spawning pellets and checks)"""
    J = JAR
    w = J['wall']
    if h < J['body_top']:
        return 1.0 - w
    if h < J['neck_bot']:
        sh = _offset(_shoulder(48), w)
        best = min(sh, key=lambda p: abs(p[1] - h))
        return best[0]
    return J['neck_r'] - w


def collider_section(top=9.0):
    """the inside only, open at the top, extended up as a tube of the neck's inner radius (for the drop)"""
    J = JAR
    w = J['wall']
    rin = 1.0 - w
    fh = J['floor_h'] + J['inner_foot']
    pts = [(i / 8 * (rin - J['inner_foot']), J['floor_h']) for i in range(0, 9)]
    pts += _arc(rin - J['inner_foot'], fh, J['inner_foot'], -90, 0, 8)[1:]
    pts += [(rin, fh + (J['body_top'] - fh) * i / 12) for i in range(1, 13)]
    pts += _offset(_shoulder(24), w)[1:]
    pts += [(J['neck_r'] - w, J['neck_bot'] + (top - J['neck_bot']) * i / 8) for i in range(1, 9)]
    return _dedup(pts)


def lathe(name, section, segments=128, closed=True):
    """revolve a (r, h) section about z. Points with r == 0 become single axis vertices."""
    bm = bmesh.new()
    rings = []
    for (r, h) in section:
        if r < 1e-6:
            rings.append([bm.verts.new((0.0, 0.0, h))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / segments), r * math.sin(2 * math.pi * k / segments), h)) for k in range(segments)])
    for a, b in zip(rings[:-1], rings[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        if len(a) == 1:
            for k in range(segments):
                bm.faces.new((a[0], b[k], b[(k + 1) % segments]))
        elif len(b) == 1:
            for k in range(segments):
                bm.faces.new((a[k], b[0], a[(k + 1) % segments]))
        else:
            for k in range(segments):
                bm.faces.new((a[k], b[k], b[(k + 1) % segments], a[(k + 1) % segments]))
    if closed:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.update()
    return me


# ---------------------------------------------------------------------------------------------------------------
# the pellet, measured: 8-9 px across in the picture against a 152 px body, flat with soft rounded rims, outlines
# between a rounded triangle and a lentil (the 8x crops of jars 1-3)
PELLET = dict(
    shape='chip',     # 'chip': a rounded triangle with flat faces (the picture's flat, angular plastic chips); 'lentil'
    D=0.095,          # mean diameter: the picture's grains are 16-23 across the inner width (0.045-0.065 of it); 0.095 R is 20
    T=0.042,          # thickness
    round=0.62,       # chip: 0 = a sharp triangle, 1 = a disc (the picture's grains are rounded chips, lentils and short rods)
    tri=0.10, a1=0.045, a2=0.03,   # outline wobble (lentil: tri is the 3-lobe term)
    flat=0.40,        # face profile exponent: lower = flatter faces and a tighter rounded rim
    squash=0.92,
)


def _outline(phi):
    P = PELLET
    a1 = P['a1'] * math.cos(phi + 0.7) + P['a2'] * math.cos(2 * phi + 1.9)
    if P['shape'] == 'lentil':
        return 1 + P['tri'] * math.cos(3 * phi) + a1
    psi = ((phi + math.pi / 3) % (2 * math.pi / 3)) - math.pi / 3
    rt = 0.5 / math.cos(psi)                                 # a triangle of circumradius 1
    r = (1 - P['round']) * rt + P['round'] * 0.72
    mean = (1 - P['round']) * 0.629 + P['round'] * 0.72      # the mean radius of that outline
    return r / mean * (1 + a1)


def pellet_mesh(name, u=24, v=12):
    """one pellet mesh (every pellet is this mesh, rotated and scaled)"""
    P = PELLET
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=1.0)
    for vert in bm.verts:
        x, y, z = vert.co
        rho = math.hypot(x, y)
        phi = math.atan2(y, x)
        s = _outline(phi)
        zz = math.copysign(abs(z) ** P['flat'], z)
        vert.co = Vector((rho * s * math.cos(phi) * P['D'] / 2, rho * s * math.sin(phi) * P['D'] / 2 * P['squash'], zz * P['T'] / 2))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.update()
    return me


# ---------------------------------------------------------------------------------------------------------------
def srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lin3(rgb):
    return tuple(srgb_to_linear(v) for v in rgb)


def clear_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.worlds):
        for b in list(coll):
            coll.remove(b)
