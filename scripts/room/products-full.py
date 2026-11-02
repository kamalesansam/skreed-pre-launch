# Section 4's products at full detail (Sam, 2026-10-26: "look how perfectly the phone case model is rendering, just do the
# same with airpods and the lenskin ... for the airpods only case is visible, entire airpods is dissappeared, and even in
# the case the logo is not visible, and lenskin just smooth out every area, it should look clean, just place the actual
# 3d model"): his FBX files cleaned in Blender 5.2 headless into one GLB each, as scripts/room/products.py did on
# 2026-10-16, but keeping the file's own smoothing (its custom split normals; nothing is re-smoothed by angle), keeping
# every triangle unless a part is over its budget, and keeping the device the case holds (E-S4-device, by his words
# above; products.py dropped Apple's case and earbuds under the rule "the case only, never the device"). The parts carry
# the roles the island colours: shell, lid, edge (the shade), logo (the shade's inlay), trim (the fixed dark), device
# (Apple's light plastic or aluminium) and device-dark (grilles, cloth, cushions). scripts/room/pack.mjs then quantises
# and meshopt-encodes the GLB and scripts/room/products-bin.mjs packs it into products.bin.
#   "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python scripts/room/products-full.py -- <which> <file.fbx> <outdir> [--tris <n>]
#   which: airpods | lenskin | airpods-max | wallet
#   --tris: a triangle budget per part (default none: every triangle of the file ships); a part over it is collapsed
#           to it with Blender's decimate, which keeps the custom normals it can
#   --smooth <deg>: drop the file's custom split normals and sharp marks and shade smooth by this angle instead (the
#           plan's smooth_deg by default). The AirPods Max file carries a custom normal per face corner with 49,390
#           edges marked sharp, which the exporter honours by splitting 17,054 vertices into 58,779 (9 B each in
#           products.bin, and near the u16 index limit); smoothed by angle it exports near its own count and looks the same
# What each keeps (docs/specs/section-4-flux.md 3, "Size and pose"):
#   airpods      Skreed's shell (lambert37) and open lid (lambert38) as the shade; lambert33 is the Skreed S on the
#                front (68 triangles, the same inlay as the phone case's and the wallet's logo parts), so it is "logo",
#                not products.py's "trim"; every other slot is Apple's charging case and earbuds as "device", the
#                earbuds' grilles and the case's dark details as "device-dark" where the slot name says so
#   lenskin      the plate (Case_TPU_Dark) as "shell", stood upright facing the camera; its own normals, no decimation
#   airpods-max  Sam's AirPods Max model (2026-10-26): the two cup covers as "shell": each cup's flat outer face with
#                its rounded edge (lambert7, both cups in one slot; the Skreed S sits on it, so it is the cover, as the
#                review of 2026-10-26 found when it was roled device and the cups read grey with a lilac ring) and the
#                cups' side bands (Pod1, Pod2); the Skreed S on the right cup (lambert24) as "logo"; the headband frame
#                and arms (head) as "device"; the headband's canopy (clothhead), the cushions (lambert25) and the cushion
#                mesh (Pods_Cloth) as "device-dark"; the file is drawn at 1,189 mm tall and is scaled to Apple's 187.3 mm.
#                The Digital Crown (1,861 faces, 62 by 61 by 53 mm in the file's frame), the noise button (192 faces, 22 by
#                63 by 26) and the crown's cap (14 faces, 43 by 41 by 29) are islands inside the right band's slot (Pod1),
#                beside the band (386 by 493 by 562), the inner lip (236 by 382 by 444) and the faces (over 300 each way), so
#                every island of a shell slot under carve_small_mm (70) in all three dimensions is cut out as "device"
#                (Sam, 2026-10-26: "no dont", to the crown and the button taking the shade)
#   wallet       as products.py's plan, for a re-export at full detail when the FBX is to hand
import bpy, sys, os, math, json
from mathutils import Vector, Matrix

a = sys.argv[sys.argv.index('--') + 1:]
WHICH, FBX, OUT = a[0], a[1], a[2]
TRIS = int(a[a.index('--tris') + 1]) if '--tris' in a else None
SMOOTH = float(a[a.index('--smooth') + 1]) if '--smooth' in a else None
os.makedirs(OUT, exist_ok=True)

# material slot name -> role; 'default' is the role of every slot not listed ('drop' leaves it out)
PLANS = {
    'airpods': {'roles': {'lambert37': 'shell', 'lambert38': 'lid', 'lambert33': 'logo'}, 'default': 'device',
                'dark_if': ('grill', 'grille', 'mesh', 'dark', 'black'), 'unit': 1.0, 'stand': False,
                'source': "Sam's airpods FBX (2026-10-16), cleaned at full detail by scripts/room/products-full.py (the device kept, E-S4-device)"},
    'lenskin': {'roles': {'Case_TPU_Dark': 'shell'}, 'default': 'drop', 'unit': 0.001, 'stand': True,
                'source': "Sam's lenskin FBX (2026-10-16), cleaned at full detail by scripts/room/products-full.py"},
    'airpods-max': {'roles': {'Pod1': 'shell', 'Pod2': 'shell', 'lambert7': 'shell', 'lambert24': 'logo', 'head': 'device',
                              'clothhead': 'device-dark', 'lambert25': 'device-dark', 'Pods_Cloth': 'device-dark'},
                    'default': 'device', 'height_m': 0.1873, 'stand': False, 'smooth_deg': 30.0, 'carve_small_mm': 70.0,
                    'source': "Sam's AirPods Max FBX (2026-10-26), cleaned at full detail by scripts/room/products-full.py (the device kept, E-S4-device)"},
    'wallet': {'roles': {'lambert3': 'shell', 'lambert25': 'shell', 'lambert2': 'edge', 'standardSurface2': 'trim', 'lambert24': 'logo'},
               'default': 'drop', 'height_m': 0.0938, 'stand': False,
               'source': "Sam's wallet FBX (2026-10-16), cleaned at full detail by scripts/room/products-full.py"},
}
plan = PLANS[WHICH]
if SMOOTH is None: SMOOTH = plan.get('smooth_deg')
ROLE_ORDER = ['shell', 'lid', 'edge', 'logo', 'trim', 'device', 'device-dark']

def role_of(name):
    if name in plan['roles']: return plan['roles'][name]
    d = plan['default']
    if d == 'device' and any(k in name.lower() for k in plan.get('dark_if', ())): return 'device-dark'
    return d

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX, use_image_search=False)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert meshes, 'no mesh in the FBX'
for o in meshes:
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
for ob in list(bpy.context.scene.objects):
    if ob.type != 'MESH': bpy.data.objects.remove(ob)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# the slots' names before anything is split, per object, and the triangles in
slots_in = {}
for o in meshes:
    for i, m in enumerate(o.data.materials):
        n = m.name if m else f'slot{i}'
        slots_in[n] = slots_in.get(n, 0) + sum(len(p.vertices) - 2 for p in o.data.polygons if p.material_index == i)

# split every object by material in edit mode (custom normals survive separate and join, which bmesh round trips lose)
for o in meshes:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    if len(o.data.materials) > 1:
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')
pieces = [o for o in bpy.context.scene.objects if o.type == 'MESH']
by_role = {}
carved = []
def island_size_mm(ob):
    vs = ob.data.vertices
    return [round((max(v.co[i] for v in vs) - min(v.co[i] for v in vs)) * 1000, 1) for i in range(3)]
for o in pieces:
    used = {p.material_index for p in o.data.polygons}
    names = [(o.data.materials[i].name if o.data.materials[i] else f'slot{i}') for i in used if i < len(o.data.materials)]
    name = names[0] if names else 'slot0'
    r = role_of(name)
    if r == 'drop': bpy.data.objects.remove(o); continue
    if r == 'shell' and plan.get('carve_small_mm'):
        # the slot's mesh islands apart: the small ones (the crown, the button, the cap) are the device, the rest the cover
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
        for isl in [x for x in bpy.context.selected_objects if x.type == 'MESH']:
            size = island_size_mm(isl)
            small = max(size) < plan['carve_small_mm']
            if small: carved.append({'slot': name, 'faces': len(isl.data.polygons), 'size_mm_file': size})
            by_role.setdefault('device' if small else 'shell', []).append(isl)
        continue
    by_role.setdefault(r, []).append(o)
parts = {}
for r, objs in by_role.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = r; ob.data.name = r
    ob.data.materials.clear()
    for l in list(ob.data.uv_layers): ob.data.uv_layers.remove(l)
    parts[r] = ob

# the frame: life size in metres, standing on z = 0, the front toward Blender -y (glTF +z after the exporter's turn)
lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
for ob in parts.values():
    for v in ob.data.vertices: lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
M = Matrix.Identity(4)
if plan.get('stand'): M = Matrix.Rotation(math.radians(90), 4, 'X') @ M
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

# triangulate (quads_convert_to_tris keeps custom normals), and only over the budget, collapse to it
report = {'which': WHICH, 'size_mm': [round(v * 1000, 2) for v in size], 'parts': {}, 'slots_in': slots_in, 'source': plan['source'], 'tris_budget': TRIS, 'carved': carved}
for name in ROLE_ORDER:
    if name not in parts: continue
    ob = parts[name]
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    before = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.object.mode_set(mode='OBJECT')
    if SMOOTH is not None:
        # the file's smoothing replaced by one angle: the custom normals and the sharp marks go, then shade smooth by angle
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
        except Exception: pass
        bpy.ops.mesh.mark_sharp(clear=True); bpy.ops.object.mode_set(mode='OBJECT')
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(SMOOTH))
    if TRIS and before > TRIS * 1.05:
        mod = ob.modifiers.new('decimate', 'DECIMATE'); mod.decimate_type = 'COLLAPSE'; mod.ratio = TRIS / before; mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    after = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    report['parts'][name] = {'tris_in': before, 'tris': after, 'verts': len(ob.data.vertices), 'custom_normals': bool(getattr(ob.data, 'has_custom_normals', False)), 'smooth_deg': SMOOTH}
report['tris'] = sum(p['tris'] for p in report['parts'].values())

bpy.ops.object.select_all(action='SELECT')
glb = os.path.join(OUT, f'{WHICH}-raw.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_materials='NONE', export_apply=True, export_yup=True, export_normals=True, export_texcoords=False)
# a look render from the front and three quarters, for the review: the shade on the body parts, the device in its greys
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 640, 640
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.9, 0.9, 1)
def mat(name, rgb, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; return m
LOOK = {'shell': mat('body', (0.35, 0.5, 0.8), 0.6), 'lid': mat('body2', (0.35, 0.5, 0.8), 0.6), 'edge': mat('body3', (0.35, 0.5, 0.8), 0.6),
        'logo': mat('logo', (0.28, 0.42, 0.7), 0.6), 'trim': mat('trim', (0.07, 0.077, 0.077), 0.55),
        'device': mat('device', (0.80, 0.80, 0.79), 0.22), 'device-dark': mat('device-dark', (0.02, 0.02, 0.022), 0.5)}
for name, ob in parts.items(): ob.data.materials.append(LOOK[name])
cam = bpy.data.cameras.new('c'); cam.lens = 85
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
d = max(size) * 4.2
for nm, az, el in (('front', 0, 8), ('three-quarter', 35, 18), ('back', 180, 12)):
    t = Vector((0, 0, size.z / 2))
    co.location = t + Vector((math.sin(math.radians(az)) * math.cos(math.radians(el)), -math.cos(math.radians(az)) * math.cos(math.radians(el)), math.sin(math.radians(el)))) * d
    co.rotation_euler = (t - co.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, f'{WHICH}-{nm}.png'); bpy.ops.render.render(write_still=True)
report['glb_bytes'] = os.path.getsize(glb)
json.dump(report, open(os.path.join(OUT, f'{WHICH}-report.json'), 'w'), indent=1)
print('PRODUCT ' + json.dumps(report))
