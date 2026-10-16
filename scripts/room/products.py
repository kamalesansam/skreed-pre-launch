# Section 4's products beside the case (Sam, 2026-10-16: "for the skreed room, this is all the products that are
# supposed to be phone case, airpods case, magsafe wallet, and lenskin"): his FBX files cleaned in Blender 5.2 headless
# into one GLB each, life size in metres, standing on y = 0 with the front toward +z (the camera), split into named parts
# that the island colours itself (no materials, no textures). scripts/room/pack.mjs then quantises and meshopt-encodes them.
#   Blender -b --factory-startup --python scripts/room/products.py -- <which> <file.fbx> <outdir>
#   which: wallet | airpods | lenskin
# What each keeps (docs/specs/section-4.md 12):
#   wallet   the sleeve's faces as "shell" (the main faces, and the face that carried a missing image), its edge with the
#            thumb notch as "edge", the pull tab and the magnets inside as "trim", the Skreed S as "logo"; the file is drawn
#            at about half size, so it is scaled to a 93.8 mm tall sleeve (the card it carries is 85.6 mm)
#   airpods  the Skreed shell only, its bottom as "shell" and its open lid as "lid", with the small front plate as "trim";
#            Apple's charging case and earbuds are dropped (the rule for the cases: the case only, never the device)
#   lenskin  the camera-plateau plate as "shell", drawn in millimetres lying flat, stood upright facing the camera
import bpy, bmesh, sys, os, math, json
from mathutils import Vector, Matrix

a = sys.argv[sys.argv.index('--') + 1:]
WHICH, FBX, OUT = a[0], a[1], a[2]
os.makedirs(OUT, exist_ok=True)
SHARP_DEG = 40.0

# material slot name -> part; parts not listed are dropped. tris: the target per part after the collapse
PLANS = {
    'wallet': {'parts': {'lambert3': 'shell', 'lambert25': 'shell', 'lambert2': 'edge', 'standardSurface2': 'trim', 'lambert24': 'logo'},
               'tris': {'shell': 2400, 'edge': 700, 'trim': 600, 'logo': 68}, 'height_m': 0.0938, 'axis': 'z'},
    'airpods': {'parts': {'lambert37': 'shell', 'lambert38': 'lid', 'lambert33': 'trim'},
                'tris': {'shell': 2800, 'lid': 2200, 'trim': 68}, 'unit': 1.0, 'axis': 'z'},
    'lenskin': {'parts': {'Case_TPU_Dark': 'shell'}, 'tris': {'shell': 1400}, 'unit': 0.001, 'stand': True, 'axis': 'z'},
}
plan = PLANS[WHICH]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX, use_image_search=False)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert len(meshes) == 1, [o.name for o in meshes]
src = meshes[0]
mw = src.matrix_world.copy(); src.parent = None; src.matrix_world = mw
for ob in list(bpy.context.scene.objects):
    if ob is not src: bpy.data.objects.remove(ob)
bpy.ops.object.select_all(action='DESELECT'); src.select_set(True); bpy.context.view_layer.objects.active = src
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# one object per part, from the material slots
slot_part = {i: plan['parts'].get(m.name) if m else None for i, m in enumerate(src.data.materials)}
parts = {}
for part in sorted(set(p for p in slot_part.values() if p)):
    bm = bmesh.new(); bm.from_mesh(src.data)
    drop = [f for f in bm.faces if slot_part.get(f.material_index) != part]
    bmesh.ops.delete(bm, geom=drop, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    me = bpy.data.meshes.new(part); bm.to_mesh(me); bm.free()
    me.materials.clear()
    for l in list(me.uv_layers): me.uv_layers.remove(l)
    ob = bpy.data.objects.new(part, me); bpy.context.scene.collection.objects.link(ob)
    parts[part] = ob
bpy.data.objects.remove(src)

# the frame: life size in metres, the front toward Blender -y (glTF +z after the exporter's Y-up turn), standing on z = 0
lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
for ob in parts.values():
    for v in ob.data.vertices: lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
M = Matrix.Identity(4)
if plan.get('stand'):
    # the plate lies in the xy plane: turn it about x so it stands on its long edge with its face toward -y
    M = Matrix.Rotation(math.radians(90), 4, 'X') @ M
scale = plan.get('unit', 1.0)
if 'height_m' in plan: scale = plan['height_m'] / (hi.z - lo.z)
M = Matrix.Scale(scale, 4) @ M
for ob in parts.values(): ob.data.transform(M)
lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
for ob in parts.values():
    for v in ob.data.vertices: lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
T = Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)))
for ob in parts.values(): ob.data.transform(T)
size = hi - lo

# simplify each part to its target, then smooth normals with sharp edges above 40 degrees
report = {'which': WHICH, 'size_mm': [round(v * 1000, 2) for v in size], 'parts': {}}
for name, ob in parts.items():
    before = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.object.mode_set(mode='OBJECT')
    target = plan['tris'].get(name, before)
    if before > target * 1.05:
        mod = ob.modifiers.new('decimate', 'DECIMATE'); mod.decimate_type = 'COLLAPSE'; mod.ratio = target / before; mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(SHARP_DEG))
    after = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    report['parts'][name] = {'tris_in': before, 'tris': after}
report['tris'] = sum(p['tris'] for p in report['parts'].values())

bpy.ops.object.select_all(action='SELECT')
glb = os.path.join(OUT, f'{WHICH}-raw.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_materials='NONE', export_apply=True, export_yup=True, export_normals=True, export_texcoords=False)
# a look render from the front and three quarters, for the review
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 480, 480
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.9, 0.9, 1)
grey = bpy.data.materials.new('g'); grey.use_nodes = True; grey.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.35, 0.5, 0.8, 1)
for ob in parts.values(): ob.data.materials.append(grey)
cam = bpy.data.cameras.new('c'); cam.lens = 85
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
d = max(size) * 4.2
for nm, az, el in (('front', 0, 8), ('three-quarter', 35, 18)):
    t = Vector((0, 0, size.z / 2))
    co.location = t + Vector((math.sin(math.radians(az)) * math.cos(math.radians(el)), -math.cos(math.radians(az)) * math.cos(math.radians(el)), math.sin(math.radians(el)))) * d
    co.rotation_euler = (t - co.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, f'{WHICH}-{nm}.png'); bpy.ops.render.render(write_still=True)
report['glb_bytes'] = os.path.getsize(glb)
json.dump(report, open(os.path.join(OUT, f'{WHICH}-report.json'), 'w'), indent=1)
print('PRODUCT ' + json.dumps(report))
