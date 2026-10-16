# Section 4, the Skreed universe (docs/specs/section-4.md 2 "The universe", 6): a round room 11 m across under an emissive
# ceiling disc, with the arc of six pedestals, built and baked here in Blender 5.2 headless, our own geometry and light:
#   /Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/room/universe.py -- scripts/room/out [size=2048] [samples=128] [median=0.5]
# Four pedestals since Sam's list of 2026-10-16 (the phone case, the AirPods case, the MagSafe wallet and the Lenskin).
# writes out/room.glb (Y up, no materials: the island colours the bays, the floor and the pedestals in its shader by
# position), out/room-lightmap.png (1024, sRGB, irradiance only: the bake has no albedo, so the shades multiply it at
# runtime), out/room-report.json and two look renders. scripts/room/encode.mjs room encodes the AVIF and WebP.
# Blender is Z up here (the floor at 0); the glTF exporter turns it Y up. The camera stands in the doorway at x = -5.
import bpy, bmesh, math, sys, os, time, json
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/room'
SIZE = int(argv[1]) if len(argv) > 1 else 2048
SAMPLES = int(argv[2]) if len(argv) > 2 else 128
MEDIAN = float(argv[3]) if len(argv) > 3 else 0.5     # the median lit texel lands here (the hall's 0.30 reads as concrete; the room is brighter)
os.makedirs(OUT, exist_ok=True)
t0 = time.time()

R, H = 5.5, 3.99                   # the room's radius and the hall's height (config/room.ts UNIVERSE)
DOOR_X, EYE = -5.0, 1.0            # the camera's place in the doorway, looking +x
ARC_R, ARC_SPAN = 3.2, 60          # the pedestals: 3.2 m from the camera, 60 degrees either side
HEIGHTS = [0.6, 0.9, 1.0, 0.8]      # the phone case, the wallet, the Lenskin, the AirPods case (config/room.ts PEDESTAL_HEIGHTS)
PED_R, PED_SEG, WALL_SEG = 0.25, 24, 80
CEIL_R, CEIL_EMIT = 4.6, 3.0       # the emissive disc under the ceiling, the room's one light

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
bgn = sc.world.node_tree.nodes['Background']
bgn.inputs[0].default_value = (0, 0, 0, 1); bgn.inputs[1].default_value = 0.0   # a closed room: no world light

def mat(name, rgb, emit=0.0, rough=0.85):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough
    if emit > 0:
        p.inputs['Emission Color'].default_value = (*rgb, 1); p.inputs['Emission Strength'].default_value = emit
    return m

WHITE = mat('room', (0.7, 0.7, 0.7))        # one neutral albedo for the bake; the shades are applied at runtime
LAMP = mat('ceiling', (1.0, 1.0, 1.0), emit=CEIL_EMIT)

faces = []   # (points, a target point the normal must face)
def poly(pts, target): faces.append((pts, target))
# the wall: a ring of quads facing the axis
for i in range(WALL_SEG):
    a0, a1 = 2 * math.pi * i / WALL_SEG, 2 * math.pi * (i + 1) / WALL_SEG
    p0, p1 = (R * math.cos(a0), R * math.sin(a0)), (R * math.cos(a1), R * math.sin(a1))
    poly([(p0[0], p0[1], 0), (p1[0], p1[1], 0), (p1[0], p1[1], H), (p0[0], p0[1], H)], (0, 0, H / 2))
# the floor and the ceiling (the plaster around the lamp): discs facing the room
ring = [(R * math.cos(2 * math.pi * i / WALL_SEG), R * math.sin(2 * math.pi * i / WALL_SEG)) for i in range(WALL_SEG)]
poly([(x, y, 0) for x, y in ring], (0, 0, H / 2))
poly([(x, y, H) for x, y in ring], (0, 0, H / 2))
# six pedestals on the arc in front of the doorway: a cylinder each (sides and top)
PEDS = []
for i, h in enumerate(HEIGHTS):
    th = math.radians(-ARC_SPAN + 2 * ARC_SPAN * i / (len(HEIGHTS) - 1))
    cx, cy = DOOR_X + ARC_R * math.cos(th), -ARC_R * math.sin(th)    # Blender's y is three's -z: the leftmost pedestal (-60) sits at -z in the island
    PEDS.append({'x': round(cx, 4), 'y': round(cy, 4), 'h': h, 'deg': round(math.degrees(th), 2)})
    rim = [(cx + PED_R * math.cos(2 * math.pi * k / PED_SEG), cy + PED_R * math.sin(2 * math.pi * k / PED_SEG)) for k in range(PED_SEG)]
    for k in range(PED_SEG):
        q0, q1 = rim[k], rim[(k + 1) % PED_SEG]
        poly([(q0[0], q0[1], 0), (q1[0], q1[1], 0), (q1[0], q1[1], h), (q0[0], q0[1], h)], (cx + 2 * (q0[0] - cx), cy + 2 * (q0[1] - cy), h / 2))
    poly([(x, y, h) for x, y in rim], (cx, cy, h + 1))

bm = bmesh.new()
for pts, target in faces:
    vs = [bm.verts.new(Vector(p)) for p in pts]
    f = bm.faces.new(vs); f.normal_update()
    if f.normal.dot(Vector(target) - f.calc_center_median()) < 0: f.normal_flip()
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.normal_update()
me = bpy.data.meshes.new('room'); bm.to_mesh(me); bm.free()
room = bpy.data.objects.new('room', me); room.data.materials.append(WHITE); sc.collection.objects.link(room)

# the lamp: a disc just under the ceiling, facing down
b2 = bmesh.new()
disc = [b2.verts.new((CEIL_R * math.cos(2 * math.pi * i / WALL_SEG), CEIL_R * math.sin(2 * math.pi * i / WALL_SEG), H - 0.02)) for i in range(WALL_SEG)]
f = b2.faces.new(disc); f.normal_update()
if f.normal.z > 0: f.normal_flip()
m2 = bpy.data.meshes.new('ceiling'); b2.to_mesh(m2); b2.free()
lamp = bpy.data.objects.new('ceiling', m2); lamp.data.materials.append(LAMP); sc.collection.objects.link(lamp)

# unwrap and bake the room's irradiance (direct and indirect, no colour)
bpy.ops.object.select_all(action='DESELECT'); room.select_set(True); bpy.context.view_layer.objects.active = room
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.010, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
img = bpy.data.images.new('lightmap', SIZE, SIZE, float_buffer=True)
nt = WHITE.node_tree; tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; nt.nodes.active = tex
sc.cycles.bake_type = 'DIFFUSE'
b = sc.render.bake; b.use_pass_direct = True; b.use_pass_indirect = True; b.use_pass_color = False; b.margin = 8
t1 = time.time(); bpy.ops.object.bake(type='DIFFUSE'); t2 = time.time()
OUT_SIZE = min(SIZE, 1024)
if SIZE > OUT_SIZE: img.scale(OUT_SIZE, OUT_SIZE)
px = list(img.pixels); n = len(px) // 4
lum = [px[i*4] * 0.2126 + px[i*4+1] * 0.7152 + px[i*4+2] * 0.0722 for i in range(0, n, 53)]
lit = sorted(v for v in lum if v > 0.002)
med = lit[len(lit) // 2] if lit else 1.0; SCALE = max(0.05, med / MEDIAN)
def knee(v):
    v = v / SCALE
    return v if v < 0.8 else 0.8 + 0.2 * (1.0 - math.exp(-(v - 0.8) / 0.2))
# the PNG is read as sRGB on the GPU (assets.ts loadLightmap tags it SRGBColorSpace), so the linear irradiance is encoded
# here: a byte image's pixels are written as given, and an unencoded map would sample at about 43 percent of its light
enc = lambda v: 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055
out = bpy.data.images.new('lightmap8', OUT_SIZE, OUT_SIZE)
out.pixels = [enc(min(1.0, knee(v))) if (i % 4) != 3 else 1.0 for i, v in enumerate(px)]
out.filepath_raw = os.path.join(OUT, 'room-lightmap.png'); out.file_format = 'PNG'; out.save()

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'room.glb'), export_format='GLB', use_selection=True, export_materials='NONE', export_apply=True, export_yup=True, export_normals=True, export_texcoords=True)

cam = bpy.data.cameras.new('cam'); cam.lens_unit = 'FOV'; cam.angle = math.radians(60)
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
sc.render.resolution_x, sc.render.resolution_y = 640, 480; sc.cycles.samples = max(16, SAMPLES // 3)
for name, rz_ in (('room-look-centre', -90), ('room-look-left', -30), ('room-look-right', -150)):   # (90, 0, -90) looks +x; left is toward +y here (three's -z)
    co.location = (DOOR_X, 0, EYE); co.rotation_euler = (math.radians(90), 0, math.radians(rz_))
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
t3 = time.time()
rep = {'size': SIZE, 'out': OUT_SIZE, 'samples': SAMPLES, 'median': MEDIAN, 'scale': SCALE, 'bake_s': round(t2 - t1, 1), 'total_s': round(t3 - t0, 1), 'faces': len(me.polygons),
       'radius': R, 'height': H, 'door_x': DOOR_X, 'eye': EYE, 'pedestals': PEDS, 'ceiling': {'radius': CEIL_R, 'emit': CEIL_EMIT},
       'glb_bytes': os.path.getsize(os.path.join(OUT, 'room.glb')), 'png_bytes': os.path.getsize(os.path.join(OUT, 'room-lightmap.png'))}
json.dump(rep, open(os.path.join(OUT, 'room-report.json'), 'w'), indent=1); print('DONE', rep)
