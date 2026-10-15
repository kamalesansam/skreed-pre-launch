# Desert model intake (Blender 4.x/5.x python, run with -I). The stand-in for MagTough, Snap and Armor (Sam, 2026-10-15)
# until their own files come; written over assets/magtough-lod0.glb and magtough-lod1.glb (the names the page reads).
# Usage: SC/bl/bin/python -I tools/intake-desert.py -- <Desert.fbx> <outdir>
# A copy of intake-magtough.py adapted to Desert's slots. Probed (round3/fam/probe.log, probe2.py): one mesh, three
# material slots: lambert26 (diffuse sand 0.49/0.40/0.26, 64,288 triangles) is the outer shell, its back plate the
# +X-facing surface at x 0.0093 to 0.0103 m; pro__max_top_case_12:lambert6 (diffuse 0.073/0.077/0.077, the liner
# material Umber's file used, 83,594 triangles) is the liner, the front lip and the camera island (the faces past the
# back plate, x > 0.012, sit only in the top three length deciles); lambert24 (68 triangles) is a flat 1 x 1 cm plate
# on the back below the middle, proud of the plate by 0.4 mm: the logo plate, taken as the 'ring' part (it takes the
# shade like the shell, as Umber's REGING4 plate did). Split: shell (lambert26), ring (lambert24), trim (lambert6).
# Source extents 26.6 x 104.7 x 196.7 mm (thin x, wide y, long z): width 0.5322 and depth 0.1350 of the height, the
# Cobalt's own proportions to four places.
#
# Orientation. The FBX lands in Blender with the long axis along +Z (camera island at +Z) and the back facing +X
# (Umber's faced -Y). The pieces are turned -90 degrees about Z (x, y -> y, -x) so the back faces -Y; the glTF
# exporter's Y-up conversion maps Blender (x, y, z) to glTF (x, z, -y), so the window ends up at glTF +Y and the
# back's outward normal along glTF +Z, the Cobalt convention. The script verifies the back, the island and the open
# front after the turn and aborts if they do not hold. Normals, centring, LOD targets, materials and export as the
# MagTough intake; quantisation by SC/mt/quant.mjs afterwards (KHR_mesh_quantization only).
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
FBX, OUTDIR = argv[0], argv[1]
SHARP_DEG = 40.0
# Cobalt materials (read from case-lod1-r3.glb): roughness 0.553, metallic 0, trim base colour (linear).
ROUGH = 0.553
TRIM_RGB = (0.073, 0.077, 0.077)
WHITE = (1.0, 1.0, 1.0)
# Triangle targets per part, the MagTough intake's. Source: shell 64,288, liner 83,594, ring 68.
LODS = {
    'lod0': {'shell': 14000, 'liner': 3500, 'ring': 1.0},
    'lod1': {'shell': 6500, 'liner': 1400, 'ring': 1.0},
}

bpy.ops.wm.read_factory_settings(use_empty=True)
if hasattr(bpy.ops.wm, 'fbx_import'):
    bpy.ops.wm.fbx_import(filepath=FBX)
else:
    bpy.ops.import_scene.fbx(filepath=FBX)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
assert len(meshes) == 1, meshes
src = meshes[0]

def activate(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]

activate([src])
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)

# Split by material slot.
activate([src])
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='MATERIAL')
bpy.ops.object.mode_set(mode='OBJECT')

def role_of(obj):
    mat = obj.material_slots[obj.data.polygons[0].material_index].material
    n = mat.name
    if n == 'lambert26':
        return 'shell'
    if n == 'lambert24':
        return 'ring'
    assert 'lambert6' in n, n
    return 'liner'

pieces = {}
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    activate([o])
    bpy.ops.object.material_slot_remove_unused()
    pieces.setdefault(role_of(o), []).append(o)
    o.data.calc_loop_triangles()
    print('piece', role_of(o), o.name, 'tris', len(o.data.loop_triangles))
assert set(pieces) == {'shell', 'ring', 'liner'}, pieces.keys()
assert len(pieces['shell']) == 1 and len(pieces['ring']) == 1 and len(pieces['liner']) == 1

# Turn -90 degrees about Z: the back (+X) comes to -Y, the width to X; then centre on the bounding box of every piece
# and scale the height (Blender Z) to 1.
turn = Matrix.Rotation(-math.pi / 2, 4, 'Z')
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.data.transform(turn)
allv = [o.matrix_world @ v.co for o in bpy.data.objects if o.type == 'MESH' for v in o.data.vertices]
mn = Vector((min(v.x for v in allv), min(v.y for v in allv), min(v.z for v in allv)))
mx = Vector((max(v.x for v in allv), max(v.y for v in allv), max(v.z for v in allv)))
ext = mx - mn
assert ext.z > ext.x > ext.y, ext
centre = (mn + mx) / 2
norm = Matrix.Scale(1.0 / ext.z, 4) @ Matrix.Translation(-centre)
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.data.transform(norm)
        o.matrix_world = Matrix.Identity(4)
print('source extents mm', [round(v * 1000, 1) for v in ext], 'normalised w d', round(ext.x / ext.z, 4), round(ext.y / ext.z, 4))

# Orientation checks (Blender axes: long +Z, back -Y). The logo plate must sit on the back below centre, flush with the
# shell's back plate (measured away from the island, in the lower half); the island (the trim beyond the back plate)
# must sit only in the top 35 percent; the front (y max) must be open: no shell faces near the centre line within a
# tenth of the depth of the front in the middle of the length.
ring = pieces['ring'][0]
rc = sum((v.co for v in ring.data.vertices), Vector()) / len(ring.data.vertices)
shell = pieces['shell'][0]
liner = pieces['liner'][0]
back_y = min(v.co.y for v in shell.data.vertices if v.co.z < 0)
depth = max(v.co.y for v in shell.data.vertices) - back_y
assert rc.z < -0.3 and abs(rc.y - back_y) < 0.02, ('ring not on the back below centre', rc, back_y)
island = [v.co.z for v in liner.data.vertices if v.co.y < back_y - 0.015]
assert island and min(island) > 0.15, ('island not at the top of the back', len(island), min(island) if island else None)
front_y = max(v.co.y for v in shell.data.vertices)
centre_front = [v for v in shell.data.vertices if v.co.y > front_y - 0.1 * depth and abs(v.co.z) < 0.15 and abs(v.co.x) < 0.25 * ext.x / ext.z]
assert len(centre_front) == 0, ('front not open', len(centre_front))
bins = [0] * 10
for v in shell.data.vertices:
    if v.co.y < back_y + 0.15 * depth:
        bins[min(9, int((v.co.z + 0.5) * 10))] += 1
print('shell back-plate vertices by height decile (bottom to top)', bins, 'island verts', len(island), 'from z', round(min(island), 3))

def material(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.use_backface_culling = True  # exports doubleSided false, like the Cobalt
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1.0)
    b.inputs['Roughness'].default_value = ROUGH
    b.inputs['Metallic'].default_value = 0.0
    return m

MATS = {'shell': material('shell', WHITE), 'ring': material('ring', WHITE), 'trim': material('trim', TRIM_RGB)}

def decimate(obj, target):
    obj.data.calc_loop_triangles()
    n = len(obj.data.loop_triangles)
    ratio = target if isinstance(target, float) else min(1.0, target / n)
    if ratio >= 1.0:
        return
    activate([obj])
    m = obj.modifiers.new('dec', 'DECIMATE')
    m.decimate_type = 'COLLAPSE'
    m.ratio = ratio
    m.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=m.name)

def finish(obj, name, mat):
    obj.name = name
    obj.data.name = name
    me = obj.data
    me.materials.clear()
    me.materials.append(mat)
    for p in me.polygons:
        p.material_index = 0
        p.use_smooth = True
    activate([obj])
    try:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    except RuntimeError:
        pass
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.normal_update()
    lim = math.radians(SHARP_DEG)
    for e in bm.edges:
        e.smooth = not (len(e.link_faces) == 2 and e.calc_face_angle(0.0) > lim)
    bm.to_mesh(me)
    bm.free()
    me.calc_loop_triangles()
    return len(me.loop_triangles)

def duplicate(obj):
    d = obj.copy()
    d.data = obj.data.copy()
    bpy.context.collection.objects.link(d)
    return d

def export(objs, path):
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
              export_normals=True, export_texcoords=False, export_tangents=False,
              export_materials='EXPORT', export_image_format='NONE', export_vertex_color='NONE',
              export_animations=False, export_skins=False, export_morph=False,
              export_lights=False, export_cameras=False, export_extras=False, export_yup=True,
              export_draco_mesh_compression_enable=False)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kw = {k: v for k, v in kw.items() if k in props}
    activate(objs)
    bpy.ops.export_scene.gltf(**kw)

os.makedirs(OUTDIR, exist_ok=True)
for lod, t in LODS.items():
    sh = duplicate(pieces['shell'][0]); decimate(sh, t['shell'])
    rg = duplicate(pieces['ring'][0]); decimate(rg, t['ring'])
    tr = duplicate(pieces['liner'][0]); decimate(tr, t['liner'])
    counts = {'shell': finish(sh, 'shell', MATS['shell']), 'ring': finish(rg, 'ring', MATS['ring']), 'trim': finish(tr, 'trim', MATS['trim'])}
    path = os.path.join(OUTDIR, f'magtough-{lod}-raw.glb')
    export([sh, rg, tr], path)
    print(lod, 'tris', counts, 'total', sum(counts.values()), '->', path)
    for o in (sh, rg, tr):
        me = o.data
        bpy.data.objects.remove(o)
        bpy.data.meshes.remove(me)
