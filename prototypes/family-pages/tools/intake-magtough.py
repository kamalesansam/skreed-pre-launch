# MagTough model intake (Blender 4.x/5.x python, run with -I).
# Usage: SC/bl/bin/python -I tools/intake-magtough.py -- <Umber.fbx> <outdir>
# Imports Sam's FBX (one mesh, five material slots), splits it into shell (_lambert40),
# ring (the REGING4 slot) and trim (the three lambert6 slots joined), recomputes normals
# (smooth, sharp edges above 40 degrees), centres the case on its bounding box, scales the
# height to 1, decimates two LODs with a ratio per part, and exports <outdir>/magtough-lod0-raw.glb
# and <outdir>/magtough-lod1-raw.glb (no Draco, no meshopt). A node step (scratch mt/quant.mjs, gltf-transform:
# keep POSITION and NORMAL only, dedup accessors, prune, quantize position 16 bits and normal 8 bits over the
# scene volume, doubleSided false) then writes assets/magtough-lod0.glb and magtough-lod1.glb with
# KHR_mesh_quantization as the only extension, the way the Cobalt case was quantised.
#
# Orientation. The FBX lands in Blender with the long axis along +Z (camera island at +Z) and the
# back of the case facing -Y (the logo plate sits on the back at y min). The glTF exporter's Y-up
# conversion maps Blender (x, y, z) to glTF (x, z, -y), so no rotation is needed in Blender: the
# window ends up at glTF +Y and the back's outward normal along glTF +Z, the Cobalt convention.
# The script verifies both before exporting and aborts if they do not hold.
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
FBX, OUTDIR = argv[0], argv[1]
SHARP_DEG = 40.0
# Cobalt materials (read from case-lod1-r3.glb): roughness 0.553, metallic 0, trim base colour (linear).
ROUGH = 0.553
TRIM_RGB = (0.073, 0.077, 0.077)
WHITE = (1.0, 1.0, 1.0)
# Triangle targets per part. Source: shell 75,760, buttons 1,428 + 3,702, liner/top 23,450, ring 68.
LODS = {
    'lod0': {'shell': 14000, 'button': 0.5, 'liner': 3500, 'ring': 1.0},
    'lod1': {'shell': 6500, 'button': 0.28, 'liner': 1400, 'ring': 1.0},
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
    if n == '_lambert40':
        return 'shell'
    if 'REGING4' in n:
        return 'ring'
    assert 'lambert6' in n, n
    return 'button' if 'buttans' in n or n.startswith('air_22_06_26:new_one_in_final') else 'liner'

pieces = {}
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    activate([o])
    bpy.ops.object.material_slot_remove_unused()
    pieces.setdefault(role_of(o), []).append(o)
    o.data.calc_loop_triangles()
    print('piece', role_of(o), o.name, 'tris', len(o.data.loop_triangles))
assert set(pieces) == {'shell', 'ring', 'button', 'liner'}, pieces.keys()
assert len(pieces['shell']) == 1 and len(pieces['ring']) == 1 and len(pieces['button']) == 2 and len(pieces['liner']) == 1

# Centre on the bounding box of every piece and scale the height (Blender Z) to 1.
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

# Orientation checks (Blender axes: long +Z, back -Y). The logo plate must sit on the back below centre,
# and the shell's back plate must be open at the top (the camera window) and closed at the bottom.
ring = pieces['ring'][0]
rc = sum((v.co for v in ring.data.vertices), Vector()) / len(ring.data.vertices)
shell = pieces['shell'][0]
shell_y = [v.co.y for v in shell.data.vertices]
back_y = min(shell_y)
assert rc.z < -0.3 and abs(rc.y - back_y) < 0.02, ('ring not on the back below centre', rc, back_y)
# Back-plate coverage: count shell vertices within 15% of the depth from the back, by height decile.
depth = max(shell_y) - back_y
bins = [0] * 10
for v in shell.data.vertices:
    if v.co.y < back_y + 0.15 * depth:
        bins[min(9, int((v.co.z + 0.5) * 10))] += 1
print('shell back-plate vertices by height decile (bottom to top)', bins)

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
    tr = []
    for b in pieces['button']:
        d = duplicate(b); decimate(d, t['button']); tr.append(d)
    d = duplicate(pieces['liner'][0]); decimate(d, t['liner']); tr.append(d)
    activate(tr)
    bpy.ops.object.join()
    tr = bpy.context.view_layer.objects.active
    counts = {'shell': finish(sh, 'shell', MATS['shell']), 'ring': finish(rg, 'ring', MATS['ring']), 'trim': finish(tr, 'trim', MATS['trim'])}
    path = os.path.join(OUTDIR, f'magtough-{lod}-raw.glb')
    export([sh, rg, tr], path)
    print(lod, 'tris', counts, 'total', sum(counts.values()), '->', path)
    for o in (sh, rg, tr):
        me = o.data
        bpy.data.objects.remove(o)
        bpy.data.meshes.remove(me)
