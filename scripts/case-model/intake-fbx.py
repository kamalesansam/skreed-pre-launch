# Sam's case-type models into the site (docs/specs/family-page.md 24, D1): one headless Blender script for his MagTough,
# Snap and Armor files (2026-11-02). Each file is one mesh with its materials as slots, the long axis on Blender's Z with
# the camera window at the top, the back facing +Y, in metres. The script
#   1. imports the FBX, bakes the object's transform, removes the Maya empties and turns the mesh half a turn about Z,
#      so the back faces -Y (the glTF exporter maps Blender (x, y, z) to glTF (x, z, -y): the back's outward normal ends
#      on glTF +Z, the window on +Y, the contract's space; a rotation, so the camera cluster keeps its side);
#   2. gives every face a role from the model's table below (decided from isolated renders of each material and from
#      where its faces sit): shell (the case's own colour, follows the shade), trim (the dark accents in the Cobalt's
#      trim grey), logo (the Skreed mark on the back, the Cobalt's tint), ring (a magnetic ring that is its own
#      material), or mark (the supplier's hexagon and lettering on the inside of the back, which never ship: an island
#      of them that stands proud of the surface behind it is deleted, one cut into it takes that surface's role);
#   3. splits the faces by role, welds coincident vertices inside each part and drops degenerate, duplicate and loose
#      geometry;
#   4. centres the case on its bounding box and scales its height to 1, as the Cobalt's files are; where the table asks,
#      removes the faces no view from outside reaches (between two nested solids); then checks the space: the logo on the
#      back facing -Y, the see-through holes of the camera window in the upper part only, and the lens cluster's side;
#   5. per LOD, dissolves coplanar faces, triangulates, collapses each part to its triangle target (the quadric collapse
#      spends the triangles where the shape bends: the silhouette, the window's rim, the ring, the buttons), shades smooth
#      with sharp edges above 40 degrees, each vertex normal weighted by its faces' areas (so a flat face stays flat
#      beside a fillet's thin triangles), and exports a raw GLB (float positions and normals, one mesh per part, named by
#      role, the Cobalt's materials); neither LOD is back-only, because the beats' half turn shows the sides.
# Writes <outdir>/<model>-lod0-raw.glb, <model>-lod1-raw.glb and <model>-report.json (the roles, what was removed, the
# triangles per part, the size and the scene extras). scripts/case-model/pack-case.mjs quantises and meshopt-encodes the
# raw files, and scripts/case-model/intake.mjs --model <model> checks C1 to C10 and installs them.
#
#   blender -b --factory-startup --python scripts/case-model/intake-fbx.py -- <magtough|snap|armor> <in.fbx> <outdir>
import bpy, bmesh, sys, os, json, math, hashlib
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROUGH = 0.553                       # the Cobalt's roughness, every part
TRIM_RGB = (0.073, 0.077, 0.077)    # the Cobalt's trim base colour (linear)
LOGO_TINT = 0.8468                  # the Cobalt's logo: a fraction of the shade
SHARP_DEG = 40.0
WELD_M = 1e-6                       # coincident vertices inside a part, in metres (the files' unit)
PROUD_MM = 0.02                     # a mark whose surface lies at least this far behind it stands proud of it

# Per model: each material of Sam's file and its role ('logo|mark': faces facing the back are the logo, the rest the
# mark), whether the faces no view reaches are removed before the collapse (where two solids nest), the side of the lens
# cluster seen from the back where the window is not centred (-1 left), the planar dissolve's angle (coplanar faces only:
# a wider angle bends the flat back) and the triangle target of each part per LOD (None keeps the part as the file has
# it; the byte caps of C9 set the rest).
MODELS = {
    'magtough': {
        'file': 'magsafe case.fbx',
        'roles': {
            'lambert28': 'shell',                       # the light back with the MagSafe ring's relief, and the outer sides
            'pro__max_top_case_12:lambert6': 'trim',    # the dark liner: the camera window's rim, the buttons, the inside
            'lambert24': 'logo',                        # the mark on the back, a decal 0.13 to 0.15 mm proud
            'lambert27': 'mark',                        # the supplier's hexagon and lettering on the inside
        },
        'enclosed': True,
        'lens_side': 0,
        'dissolve_deg': 0.05,
        'lods': {'lod0': {'shell': 11300, 'trim': 12100, 'logo': None},
                 'lod1': {'shell': 4600, 'trim': 4500, 'logo': None}},
    },
    'snap': {
        'file': 'snap 3 (1).fbx',
        'roles': {
            'Case_OliveMatte': 'shell',                 # the case's own colour: the back, the sides and the rims
            'lambert2': 'shell',                        # the inside of the same one-piece shell, painted light
            'lambert27': 'logo|mark',                   # the mark on the back, and the supplier's mark on the inside
        },
        'enclosed': False,
        'lens_side': 0,
        'dissolve_deg': 0.05,
        'lods': {'lod0': {'shell': None, 'logo': None},
                 'lod1': {'shell': None, 'logo': None}},
    },
    'armor': {
        'file': 'Armor 5.fbx',
        'roles': {
            'standardSurface2': 'shell',                # the light back plate
            'Case_Bumper_TPU': 'trim',                  # the dark bumper: the camera plate, the sides, the inside
            'lambert2': 'trim',                         # the four dark corner caps
            'lambert24': 'logo',                        # the mark on the back, a decal 0.19 to 0.21 mm proud
            'lambert27': 'mark',                        # the supplier's hexagon and lettering on the inside
        },
        'enclosed': False,
        'lens_side': -1,
        'dissolve_deg': 0.05,
        'lods': {'lod0': {'shell': None, 'trim': None, 'logo': None},
                 'lod1': {'shell': None, 'trim': 9300, 'logo': None}},
    },
}
PARTS = ('shell', 'trim', 'logo', 'ring')


def log(*a):
    print('[intake-fbx]', *a, flush=True)


def bvh_of(bm, keep):
    """A BVH over the faces of bm for which keep(face) holds, and the face behind each of its polygons."""
    verts, polys, back, vmap = [], [], [], {}
    for f in bm.faces:
        if not keep(f):
            continue
        ids = []
        for v in f.verts:
            i = vmap.get(v.index)
            if i is None:
                i = vmap[v.index] = len(verts)
                verts.append(v.co.copy())
            ids.append(i)
        polys.append(ids)
        back.append(f)
    return BVHTree.FromPolygons(verts, polys, all_triangles=False), back


def islands(faces):
    inside, seen, out = set(faces), set(), []
    for f in faces:
        if f in seen:
            continue
        seen.add(f)
        stack, comp = [f], []
        while stack:
            g = stack.pop()
            comp.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h in inside and h not in seen:
                        seen.add(h)
                        stack.append(h)
        out.append(comp)
    return out


def import_fbx(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if hasattr(bpy.ops.wm, 'fbx_import'):
        bpy.ops.wm.fbx_import(filepath=path)
    else:
        bpy.ops.import_scene.fbx(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    assert len(meshes) == 1, f'expected one mesh, found {[o.name for o in meshes]}'
    src = meshes[0]
    # the file's transform (a quarter turn about X and 0.01) and a half turn about Z: the back from +Y to -Y
    src.data.transform(Matrix.Rotation(math.pi, 4, 'Z') @ src.matrix_world)
    src.parent = None
    src.matrix_world = Matrix.Identity(4)
    for o in [o for o in bpy.data.objects if o is not src]:
        bpy.data.objects.remove(o)
    return src


def assign_roles(src, cfg, rep):
    """The role of every face (by index), the marks resolved: deleted where they stand proud, else the surface's role."""
    names = [s.material.name if s.material else '' for s in src.material_slots]
    unknown = [n for n in names if n not in cfg['roles']]
    assert not unknown, f'materials not in the table: {unknown}'
    bm = bmesh.new()
    bm.from_mesh(src.data)
    bm.normal_update()
    bm.faces.ensure_lookup_table()
    bm.faces.index_update()
    role = [None] * len(bm.faces)
    mats = {}
    for f in bm.faces:
        name = names[f.material_index]
        r = cfg['roles'][name]
        if r == 'logo|mark':
            r = 'logo' if f.normal.y < 0 else 'mark'
        role[f.index] = r
        m = mats.setdefault(name, {'role': cfg['roles'][name], 'triangles': 0, 'by_role': {}})
        m['triangles'] += len(f.verts) - 2
        m['by_role'][r] = m['by_role'].get(r, 0) + len(f.verts) - 2
    for i, s in enumerate(src.material_slots):
        node = s.material.node_tree.nodes.get('Principled BSDF') if s.material and s.material.node_tree else None
        if node and names[i] in mats:
            mats[names[i]]['base'] = [round(v, 4) for v in list(node.inputs['Base Color'].default_value)[:3]]
    rep['materials'] = mats
    marks = [f for f in bm.faces if role[f.index] == 'mark']
    tree, back = bvh_of(bm, lambda f: role[f.index] != 'mark')
    out = {'islands': 0, 'deleted_faces': 0, 'deleted_triangles': 0, 'reassigned_faces': 0,
           'proud_mm': [], 'cut_mm': []}
    doomed = set()
    for comp in islands(marks):
        out['islands'] += 1
        joined = any(role[g.index] != 'mark' for f in comp for v in f.verts for g in v.link_faces)
        dist, under = [], []
        for f in comp:
            c, n = f.calc_center_median(), f.normal
            hit = tree.ray_cast(c + n * 1e-7, -n, 0.005) if n.length > 0.5 else (None, None, None, None)
            if hit[0] is not None:
                dist.append(hit[3] * 1000)
                under.append(role[back[hit[2]].index])
            else:
                near = tree.find_nearest(c)
                under.append(role[back[near[2]].index] if near[0] is not None else 'shell')
        med = sorted(dist)[len(dist) // 2] if dist else 0.0
        if not joined and med >= PROUD_MM:
            doomed.update(f.index for f in comp)
            out['deleted_triangles'] += sum(len(f.verts) - 2 for f in comp)
            out['proud_mm'].append(round(med, 3))
        else:
            # cut into the surface: the mark takes the role of what lies behind it, so it vanishes into it
            under_role = max(set(under), key=under.count)
            for f in comp:
                role[f.index] = under_role
            out['reassigned_faces'] += len(comp)
            out['cut_mm'].append(round(med, 3))
    out['deleted_faces'] = len(doomed)
    rep['mark'] = out
    log('mark islands', out['islands'], 'deleted faces', out['deleted_faces'], 'reassigned', out['reassigned_faces'],
        'proud mm', out['proud_mm'])
    return bm, role, doomed


def split_parts(bm, role, doomed, rep):
    """One bmesh per role: welded, without degenerate, duplicate or loose geometry."""
    part_of = [-1 if f.index in doomed else PARTS.index(role[f.index]) for f in bm.faces]
    lay = bm.faces.layers.int.new('part')
    for f, k in zip(bm.faces, part_of):
        f[lay] = k
    parts = {}
    rep['clean'] = {}
    for k, part in enumerate(PARTS):
        if k not in part_of:
            continue
        b = bm.copy()
        bl = b.faces.layers.int['part']
        bmesh.ops.delete(b, geom=[f for f in b.faces if f[bl] != k], context='FACES')
        b.faces.layers.int.remove(bl)
        bmesh.ops.delete(b, geom=[v for v in b.verts if not v.link_faces], context='VERTS')
        v0 = len(b.verts)
        bmesh.ops.remove_doubles(b, verts=list(b.verts), dist=WELD_M)
        welded = v0 - len(b.verts)
        bmesh.ops.dissolve_degenerate(b, dist=1e-9, edges=list(b.edges))
        b.verts.index_update()
        seen, dup = set(), []
        for f in b.faces:
            # the same vertices in the same winding: two faces back to back are a thin wall's two sides and stay
            loop = [v.index for v in f.verts]
            i = loop.index(min(loop))
            key = tuple(loop[i:] + loop[:i])
            if key in seen:
                dup.append(f)
            seen.add(key)
        if dup:
            bmesh.ops.delete(b, geom=dup, context='FACES_ONLY')
        bmesh.ops.delete(b, geom=[e for e in b.edges if not e.link_faces], context='EDGES')
        bmesh.ops.delete(b, geom=[v for v in b.verts if not v.link_faces], context='VERTS')
        b.normal_update()
        parts[part] = b
        rep['clean'][part] = {'welded_vertices': welded, 'duplicate_faces': len(dup),
                              'triangles': sum(len(f.verts) - 2 for f in b.faces)}
    return parts


def normalise(parts, rep):
    """Centres the case on its bounding box and scales its height (Blender Z) to 1, as the Cobalt's files are."""
    co = [v.co for b in parts.values() for v in b.verts]
    lo = Vector([min(c[i] for c in co) for i in range(3)])
    hi = Vector([max(c[i] for c in co) for i in range(3)])
    ext = hi - lo
    assert ext.z > ext.x > ext.y, f'not a case standing on Z: {ext}'
    centre = (lo + hi) / 2
    m = Matrix.Scale(1.0 / ext.z, 4) @ Matrix.Translation(-centre)
    for b in parts.values():
        bmesh.ops.transform(b, matrix=m, verts=list(b.verts))
        b.normal_update()
    # the size in the contract's axes: width (Blender x), height (z), thickness (y), in millimetres
    rep['size_mm'] = [round(ext.x * 1000, 2), round(ext.z * 1000, 2), round(ext.y * 1000, 2)]
    # the box centre in the imported file's coordinates (before the half turn), in millimetres
    rep['pivot_fbx_mm'] = [round(-centre.x * 1000, 3), round(-centre.y * 1000, 3), round(centre.z * 1000, 3)]
    return ext.z


def hemisphere(n):
    """33 directions over the hemisphere about n: n itself and rings of 6, 10 and 16 at 30, 55 and 80 degrees."""
    t = n.orthogonal().normalized()
    b = n.cross(t)
    out = [n.copy()]
    for tilt, k, turn in ((30.0, 6, 0.0), (55.0, 10, 0.5), (80.0, 16, 0.0)):
        s, c = math.sin(math.radians(tilt)), math.cos(math.radians(tilt))
        for i in range(k):
            a = 2 * math.pi * (i + turn) / k
            out.append((n * c + (t * math.cos(a) + b * math.sin(a)) * s).normalized())
    return out


def drop_enclosed(parts, rep):
    """Deletes the faces of one solid part that lie against another: every ray over the face's hemisphere meets the case,
    and the first along its normal meets a different part. In the MagSafe file the light shell and the dark liner are two
    solids, one inside the other, so the shell's inner face and the liner's back lie between them; left in, they take a
    quarter of the triangles. A face covered by its own part (the back plate under the ring, an island of the same shell)
    stays, so no hole opens where the two are collapsed apart. Run on triangles (a bent quad can occlude itself); the logo
    is no occluder, so the back under it stays."""
    solid = [p for p in ('shell', 'trim', 'ring') if p in parts]
    verts, polys, owner, offset = [], [], [], 0
    for p in solid:
        b = parts[p]
        bmesh.ops.triangulate(b, faces=list(b.faces), quad_method='BEAUTY', ngon_method='BEAUTY')
        b.normal_update()
        b.verts.index_update()
        verts.extend(v.co.copy() for v in b.verts)
        polys.extend([offset + v.index for v in f.verts] for f in b.faces)
        owner.extend(p for _ in b.faces)
        offset += len(b.verts)
    tree = BVHTree.FromPolygons(verts, polys)
    rep['enclosed'] = {}
    for p in solid:
        b = parts[p]
        gone = []
        for f in b.faces:
            n = f.normal
            if n.length < 0.5:
                continue
            c = f.calc_center_median() + n * 2e-5       # 0.003 mm off the face, in the normalised space
            first = tree.ray_cast(c, n, 2.0)
            if first[0] is None or owner[first[2]] == p:
                continue
            if all(tree.ray_cast(c, d, 2.0)[0] is not None for d in hemisphere(n)[1:]):
                gone.append(f)
        bmesh.ops.delete(b, geom=gone, context='FACES')
        bmesh.ops.delete(b, geom=[v for v in b.verts if not v.link_faces], context='VERTS')
        rep['enclosed'][p] = {'triangles': len(gone), 'left': len(b.faces)}
        log('enclosed', p, len(gone), 'triangles removed,', len(b.faces), 'left')


def check_space(parts, side, rep):
    """The contract's space, before export (Blender axes; glTF +Z is Blender -Y)."""
    out = {}
    logo = parts.get('logo')
    assert logo is not None, 'no logo part'
    area = sum(f.calc_area() for f in logo.faces)
    ny = sum(f.normal.y * f.calc_area() for f in logo.faces) / area
    cy = sum(f.calc_center_median().y * f.calc_area() for f in logo.faces) / area
    cz = sum(f.calc_center_median().z * f.calc_area() for f in logo.faces) / area
    ys = [v.co.y for b in parts.values() for v in b.verts]
    out['logo_normal_y'] = round(ny, 4)
    out['logo_centre'] = {'y': round(cy, 4), 'z': round(cz, 4), 'y_min': round(min(ys), 4), 'y_max': round(max(ys), 4)}
    assert ny < -0.98 and cy < 0, f'the logo is not on the back facing -Y: normal y {ny}, centre y {cy}'
    # see-through points of the back, sampled along Y on a grid inside the outline
    allp = list(parts.values())
    verts, polys, offset = [], [], 0
    for b in allp:
        b.verts.index_update()
        verts.extend(v.co.copy() for v in b.verts)
        polys.extend([offset + v.index for v in f.verts] for f in b.faces)
        offset += len(b.verts)
    tree = BVHTree.FromPolygons(verts, polys, all_triangles=False)
    xs = [v[0] for v in verts]
    x0, x1 = min(xs), max(xs)
    w = x1 - x0
    holes = []
    NX, NZ = 48, 120
    for i in range(NX):
        x = x0 + w * (0.1 + 0.8 * (i + 0.5) / NX)
        for j in range(NZ):
            z = -0.5 + (0.04 + 0.92 * (j + 0.5) / NZ)
            if tree.ray_cast(Vector((x, min(ys) - 0.05, z)), Vector((0, 1, 0)), 1.0)[0] is None:
                holes.append((x, z))
    top = [h for h in holes if h[1] > 0]
    rest = [h for h in holes if h[1] <= 0]
    out['see_through'] = {'upper_half': len(top), 'lower_half': len(rest), 'samples': NX * NZ}
    out['window_x_centroid'] = round(sum(h[0] for h in top) / len(top), 4) if top else None
    out['window_z_range'] = [round(min(h[1] for h in top), 4), round(max(h[1] for h in top), 4)] if top else None
    assert top and not rest and out['window_z_range'][0] > 0.15, f'the camera window is not at the top: {out}'
    if side:
        # Sam's back render shows the lenses on the left seen from the back: glTF -X, Blender -X after the half turn
        assert out['window_x_centroid'] * side > 0, f'the lens cluster is on the wrong side: {out["window_x_centroid"]}'
    rep['space'] = out
    log('space', json.dumps(out))


def to_object(b, name):
    me = bpy.data.meshes.new(name)
    b.to_mesh(me)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def activate(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def make_material(part):
    m = bpy.data.materials.new(part)
    if m.node_tree is None:
        m.use_nodes = True
    m.use_backface_culling = True       # doubleSided false, as the Cobalt
    p = m.node_tree.nodes['Principled BSDF']
    rgb = {'trim': TRIM_RGB, 'logo': (LOGO_TINT,) * 3}.get(part, (1.0, 1.0, 1.0))
    p.inputs['Base Color'].default_value = (*rgb, 1.0)
    p.inputs['Roughness'].default_value = ROUGH
    p.inputs['Metallic'].default_value = 0.0
    return m


def lod_part(base, part, target, dissolve_deg, mat):
    """One part at one LOD: planar dissolve, triangulate, collapse to the target, smooth with sharp edges, normals
    weighted by face area."""
    b = base.copy()
    if dissolve_deg and target is not None:
        bmesh.ops.dissolve_limit(b, angle_limit=math.radians(dissolve_deg), use_dissolve_boundaries=False,
                                 verts=list(b.verts), edges=list(b.edges), delimit=set())
    bmesh.ops.triangulate(b, faces=list(b.faces), quad_method='BEAUTY', ngon_method='BEAUTY')
    ob = to_object(b, part)
    b.free()
    n = len(ob.data.polygons)
    if target is not None and target < n:
        activate([ob])
        mod = ob.modifiers.new('collapse', 'DECIMATE')
        mod.decimate_type = 'COLLAPSE'
        mod.ratio = target / n
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    me = ob.data
    me.materials.clear()
    me.materials.append(mat)
    for l in list(me.uv_layers):
        me.uv_layers.remove(l)
    activate([ob])
    try:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()    # the file's normals do not survive the collapse
    except RuntimeError:
        pass
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.dissolve_degenerate(bm, dist=1e-9, edges=list(bm.edges))
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 3])
    bm.normal_update()
    lim = math.radians(SHARP_DEG)
    for f in bm.faces:
        f.smooth = True
        f.material_index = 0
    for e in bm.edges:
        e.smooth = not (len(e.link_faces) == 2 and e.calc_face_angle(0.0) > lim)
    bm.to_mesh(me)
    bm.free()
    activate([ob])
    wn = ob.modifiers.new('weighted', 'WEIGHTED_NORMAL')
    wn.mode = 'FACE_AREA'
    wn.weight = 50
    wn.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=wn.name)
    return ob, len(me.polygons)


def export(objs, path):
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
              export_normals=True, export_texcoords=False, export_tangents=False,
              export_materials='EXPORT', export_image_format='NONE', export_vertex_color='NONE',
              export_attributes=False, export_animations=False, export_skins=False, export_morph=False,
              export_lights=False, export_cameras=False, export_extras=False, export_yup=True,
              export_draco_mesh_compression_enable=False)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    activate(objs)
    bpy.ops.export_scene.gltf(**{k: v for k, v in kw.items() if k in props})


def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    model, fbx, outdir = argv[0], argv[1], argv[2]
    cfg = MODELS[model]
    os.makedirs(outdir, exist_ok=True)
    with open(fbx, 'rb') as fh:
        digest = hashlib.sha256(fh.read()).hexdigest()
    rep = {'model': model, 'file': cfg['file'], 'source_sha256': digest, 'blender': bpy.app.version_string}
    src = import_fbx(fbx)
    src.data.calc_loop_triangles()
    rep['source_triangles'] = len(src.data.loop_triangles)
    bm, role, doomed = assign_roles(src, cfg, rep)
    parts = split_parts(bm, role, doomed, rep)
    bm.free()
    unit = normalise(parts, rep)
    if cfg['enclosed']:
        drop_enclosed(parts, rep)
    check_space(parts, cfg['lens_side'], rep)
    mats = {p: make_material(p) for p in parts}
    rep['lods'] = {}
    for lod, targets in cfg['lods'].items():
        objs, tris = [], {}
        for part in PARTS:
            if part not in parts:
                continue
            ob, n = lod_part(parts[part], part, targets.get(part), cfg['dissolve_deg'], mats[part])
            objs.append(ob)
            tris[part] = n
        path = os.path.join(outdir, f'{model}-{lod}-raw.glb')
        export(objs, path)
        rep['lods'][lod] = {'triangles': tris, 'total': sum(tris.values()), 'raw': os.path.basename(path)}
        log(lod, tris, 'total', sum(tris.values()), '->', path)
        for o in objs:
            me = o.data
            bpy.data.objects.remove(o)
            bpy.data.meshes.remove(me)
    rep['extras'] = {
        'unitMM': round(unit * 1000, 2),
        'axes': 'X = width (blender -x), Y = height (blender z, up), Z = back normal (blender y); back faces +Z',
        'logoTint': LOGO_TINT,
        'shadeColour': 'shell base colour is white and logo is white x logoTint (shade-neutral); multiply by the shade hex per instance; the trim keeps its own grey',
        'source': f"{cfg['file']} (Sam, 2026-11-02), cleaned and simplified by scripts/case-model/intake-fbx.py in Blender {bpy.app.version_string}",
        'backOnly': False,
    }
    for b in parts.values():
        b.free()
    with open(os.path.join(outdir, f'{model}-report.json'), 'w') as fh:
        json.dump(rep, fh, indent=1)
    log('DONE', model)


if __name__ == '__main__':
    main()
