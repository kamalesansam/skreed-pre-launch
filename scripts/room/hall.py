# Section 4, the entrance hall (docs/specs/section-4.md 2, 6; the numbers from docs/specs/evidence/section-4-measurements.md).
# Our own geometry, light and bake, built by measurement: nothing of the reference is read or shipped. Blender 5.2 headless:
#   /Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/room/hall.py -- scripts/room/out [size=2048] [samples=128]
# writes out/hall.glb (Y up, no materials: the island assigns them), out/hall-lightmap.png (1024, sRGB, the brightest 20
# percent through a soft knee), out/report.json and three look renders; scripts/room/encode.mjs then makes the shipped
# AVIF and WebP and copies the GLB into src/assets/room/. Blender is Z up here (x along the hall, y across, z up; the floor at 0).
import bpy, bmesh, math, sys, os, time, json
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/hall'
SIZE = int(argv[1]) if len(argv) > 1 else 2048
SAMPLES = int(argv[2]) if len(argv) > 2 else 96
os.makedirs(OUT, exist_ok=True)
t0 = time.time()

# ---- the measured frame (scene metres; geometry.md section 11, with the floor moved to z = 0)
XW, XE = -5.95, 5.93            # base end walls (west, east)
YS, YN = -1.575, 1.574          # base side walls (south, north)
H = 3.99                        # ceiling underside
SLOT_X = (-2.92, -2.27)         # the transept slot through both side walls, open at its ends
SLOT_Y = 2.088                  # how far the slot reaches (open to white beyond)
PANEL_LIFT, PANEL_TOP = 0.165, H - 0.09
EAST_PANEL = (-1.97, 5.63, 0.110)   # x0, x1, proud
WEST_PANEL = (-5.82, -3.06, 0.052)
END_PANEL = (1.50, 0.12)            # half width, proud (y -1.5..1.5)
FLOOR_SLOT = (0.16, 0.094)          # under each end wall: depth past the base wall, height
FIXTURES = [-5.88, -3.53, 0.07, 3.20, 5.79]   # x centres; 0.216 x 1.66 m plan, 0.055 m drop, y -0.75..0.92
FIX_W, FIX_L, FIX_D, FIX_Y = 0.216, 1.66, 0.055, (-0.75, 0.92)
FLOOR_LIGHTS_N = [-1.47, -0.49, 0.49, 1.48, 2.53, 3.53, 4.56, 5.58]
FLOOR_LIGHTS_S = [-1.44, -0.44, 0.55, 1.55, 2.56, 3.57, 4.59, 5.56]
DOOR_W, DOOR_H, DOOR_D = 1.6, 2.6, 0.18     # our addition at the west end, centred on y = 0
LEAF_T, LEAF_GAP = 0.06, 0.006
EYE = 1.0

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = SAMPLES
# Cycles on the Metal GPU (the pipeline report measured a 1K 64-sample bake at 2.8 s on it against minutes on the CPU)
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
bgn.inputs[0].default_value = (1, 1, 1, 1); bgn.inputs[1].default_value = 0.12   # white beyond the transept ends (the demo clears to white)

def mat(name, rgb, emit=0.0, rough=0.85):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough
    if emit > 0:
        p.inputs['Emission Color'].default_value = (*rgb, 1); p.inputs['Emission Strength'].default_value = emit
    return m

GREY = mat('concrete', (0.5, 0.5, 0.5))
FIX = mat('fixture', (0.84, 0.89, 0.93), emit=6.0)      # cool white, about 7400 K (light.md 3.1)
SPOT = mat('spot', (0.72, 0.65, 0.51), emit=25.0)        # warm, about 4500 K (light.md 3.2)
LEAF = mat('leaf', (0.12, 0.12, 0.13), rough=0.6)
SEAMLIGHT = mat('seam', (1.0, 1.0, 1.0), emit=6.0)

# ---- a face builder; the winding is fixed afterwards toward a target point per face
faces = []   # (list of 4 points, target point the normal must face)
def rect(p0, p1, p2, p3, target): faces.append(([p0, p1, p2, p3], target))
def rx(x, y0, y1, z0, z1, target): rect((x, y0, z0), (x, y1, z0), (x, y1, z1), (x, y0, z1), target)   # plane x = const
def ry(y, x0, x1, z0, z1, target): rect((x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1), target)   # plane y = const
def rz(z, x0, x1, y0, y1, target): rect((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z), target)   # plane z = const
AX = lambda x: (x, 0.0, H / 2)   # a point on the hall's axis at that x (the room side of the shell)

# the floor (with the end slots and the transept patches) and the ceiling
rz(0, XW - FLOOR_SLOT[0], XE + FLOOR_SLOT[0], YS, YN, (0, 0, H / 2))
rz(0, SLOT_X[0], SLOT_X[1], YN, SLOT_Y, (-2.6, 1.8, H / 2)); rz(0, SLOT_X[0], SLOT_X[1], -SLOT_Y, YS, (-2.6, -1.8, H / 2))
rz(H, XW, XE, YS, YN, (0, 0, H / 2))
rz(H, SLOT_X[0], SLOT_X[1], YN, SLOT_Y, (-2.6, 1.8, H / 2)); rz(H, SLOT_X[0], SLOT_X[1], -SLOT_Y, YS, (-2.6, -1.8, H / 2))
# the end slots: ceiling of the slot and its back face; the base end wall starts above the slot
for xw, dx in ((XW, -FLOOR_SLOT[0]), (XE, FLOOR_SLOT[0])):
    xb = xw + dx
    rz(FLOOR_SLOT[1], min(xw, xb), max(xw, xb), YS, YN, (0, 0, 0))
    rx(xb, YS, YN, 0, FLOOR_SLOT[1], AX(0))
    # the slot's two ends, where it meets the side walls (open, they showed the white clear colour at the floor's corners)
    for y_end, ty in ((YS, 0.5), (YN, -0.5)):
        ry(y_end, min(xw, xb), max(xw, xb), 0, FLOOR_SLOT[1], ((xw + xb) / 2, ty, FLOOR_SLOT[1] / 2))
# the side base walls, in three runs around the transept slot (full height; the slot is full height)
for y, tgt_y in ((YS, 0.0), (YN, 0.0)):
    ry(y, XW, SLOT_X[0], 0, H, (0, tgt_y, H / 2)); ry(y, SLOT_X[1], XE, 0, H, (0, tgt_y, H / 2))
# the transept slot's walls (its ends stay open)
for y0, y1, ty in ((YN, SLOT_Y, 1.8), (-SLOT_Y, YS, -1.8)):
    rx(SLOT_X[0], y0, y1, 0, H, (-2.6, ty, H / 2)); rx(SLOT_X[1], y0, y1, 0, H, (-2.6, ty, H / 2))
# the east base end wall above its slot; the west one as a frame around the door opening
rx(XE, YS, YN, FLOOR_SLOT[1], H, AX(0))
dw = DOOR_W / 2
rx(XW, YS, -dw, FLOOR_SLOT[1], H, AX(0)); rx(XW, dw, YN, FLOOR_SLOT[1], H, AX(0)); rx(XW, -dw, dw, DOOR_H, H, AX(0))
# raised side panels: a box each side, its back on the base wall (the room sees its face, top, bottom and ends)
def panel_box(x0, x1, y_back, y_face, z0, z1, name_target):
    c = ((x0 + x1) / 2, (y_back + y_face) / 2, (z0 + z1) / 2)
    away = lambda p: (2 * p[0] - c[0], 2 * p[1] - c[1], 2 * p[2] - c[2])   # a target on the far side of the box centre
    ry(y_face, x0, x1, z0, z1, (c[0], 0.0, c[2]))
    rz(z1, x0, x1, min(y_back, y_face), max(y_back, y_face), (c[0], c[1], H))
    rz(z0, x0, x1, min(y_back, y_face), max(y_back, y_face), (c[0], c[1], -1.0))
    rx(x0, min(y_back, y_face), max(y_back, y_face), z0, z1, (x0 - 1.0, c[1], c[2]))
    rx(x1, min(y_back, y_face), max(y_back, y_face), z0, z1, (x1 + 1.0, c[1], c[2]))
for (x0, x1, proud) in (EAST_PANEL, WEST_PANEL):
    panel_box(x0, x1, YS, YS + proud, PANEL_LIFT, PANEL_TOP, 's'); panel_box(x0, x1, YN, YN - proud, PANEL_LIFT, PANEL_TOP, 'n')
# raised end panels: the east one whole, the west one as a frame around the door (its face, top, bottom, sides, and the door's reveal)
hw, proud = END_PANEL
def end_panel(xw, xf, with_door):
    c = ((xw + xf) / 2, 0.0, (PANEL_LIFT + PANEL_TOP) / 2)
    if not with_door:
        rx(xf, -hw, hw, PANEL_LIFT, PANEL_TOP, AX(0))
    else:
        rx(xf, -hw, -dw, PANEL_LIFT, PANEL_TOP, AX(0)); rx(xf, dw, hw, PANEL_LIFT, PANEL_TOP, AX(0)); rx(xf, -dw, dw, DOOR_H, PANEL_TOP, AX(0))
    rz(PANEL_TOP, min(xw, xf), max(xw, xf), -hw, hw, (c[0], 0, H)); rz(PANEL_LIFT, min(xw, xf), max(xw, xf), -hw, hw, (c[0], 0, -1))
    ry(-hw, min(xw, xf), max(xw, xf), PANEL_LIFT, PANEL_TOP, (c[0], -3, c[2])); ry(hw, min(xw, xf), max(xw, xf), PANEL_LIFT, PANEL_TOP, (c[0], 3, c[2]))
end_panel(XE, XE - proud, False)
end_panel(XW, XW + proud, True)
# the door reveal: from the panel face back through the base wall to the leaves (0.18 m deep from the base wall)
xf, xb = XW + proud, XW - DOOR_D
ry(-dw, xb, xf, 0, DOOR_H, (xf, 0, DOOR_H / 2)); ry(dw, xb, xf, 0, DOOR_H, (xf, 0, DOOR_H / 2))
rz(DOOR_H, xb, xf, -dw, dw, (xf, 0, 0)); rz(0, xb, xf, -dw, dw, (xf, 0, DOOR_H))   # the slot stops at the jambs: the reveal floor is level
# (the floor slot under the west wall is interrupted by the reveal; the slot faces above still run full width behind the panel, hidden)

bm = bmesh.new()
for pts, target in faces:
    vs = [bm.verts.new(Vector(p)) for p in pts]
    f = bm.faces.new(vs)
    f.normal_update()
    if f.normal.dot(Vector(target) - f.calc_center_median()) < 0: f.normal_flip()
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.normal_update()
me = bpy.data.meshes.new('hall'); bm.to_mesh(me); bm.free()
hall = bpy.data.objects.new('hall', me); hall.data.materials.append(GREY); sc.collection.objects.link(hall)

def box(name, lo, hi, m):
    b2 = bmesh.new()
    verts = [b2.verts.new((x, y, z)) for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])]
    for f in [(0,1,3,2), (4,6,7,5), (0,4,5,1), (2,3,7,6), (0,2,6,4), (1,5,7,3)]: b2.faces.new([verts[i] for i in f])
    bmesh.ops.recalc_face_normals(b2, faces=b2.faces)
    m2 = bpy.data.meshes.new(name); b2.to_mesh(m2); b2.free()
    ob = bpy.data.objects.new(name, m2); ob.data.materials.append(m); sc.collection.objects.link(ob); return ob

# the leaves and the seam of light between them, at the back of the reveal
box('leaf_left', (xb, -dw + 0.01, 0.01), (xb + LEAF_T, -LEAF_GAP / 2, DOOR_H - 0.01), LEAF)
box('leaf_right', (xb, LEAF_GAP / 2, 0.01), (xb + LEAF_T, dw - 0.01, DOOR_H - 0.01), LEAF)
box('seam', (xb - 0.02, -LEAF_GAP / 2, 0.01), (xb - 0.005, LEAF_GAP / 2, DOOR_H - 0.01), SEAMLIGHT)
# five ceiling fixtures hanging under the ceiling
for cx in FIXTURES:
    box('fixture', (cx - FIX_L / 2, FIX_Y[0], H - FIX_D), (cx + FIX_L / 2, FIX_Y[1], H - 0.001), FIX)
# sixteen floor-edge lights in the gap under the side panels: small emitters on the base wall at floor level
for xs, y, s in ((FLOOR_LIGHTS_N, YN, -1), (FLOOR_LIGHTS_S, YS, 1)):
    for x in xs:
        box('spot', (x - 0.11, min(y, y + s * 0.03), 0.01), (x + 0.11, max(y, y + s * 0.03), 0.09), SPOT)

# unwrap and bake the hall's diffuse light
bpy.ops.object.select_all(action='DESELECT'); hall.select_set(True); bpy.context.view_layer.objects.active = hall
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.012, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
img = bpy.data.images.new('lightmap', SIZE, SIZE, float_buffer=True)
nt = GREY.node_tree; tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; nt.nodes.active = tex
sc.cycles.bake_type = 'DIFFUSE'
b = sc.render.bake; b.use_pass_direct = True; b.use_pass_indirect = True; b.use_pass_color = False; b.margin = 8
t1 = time.time(); bpy.ops.object.bake(type='DIFFUSE'); t2 = time.time()
OUT_SIZE = min(SIZE, 1024)
if SIZE > OUT_SIZE: img.scale(OUT_SIZE, OUT_SIZE)
px = list(img.pixels); n = len(px) // 4
lum = [px[i*4] * 0.2126 + px[i*4+1] * 0.7152 + px[i*4+2] * 0.0722 for i in range(0, n, 53)]
lit = sorted(v for v in lum if v > 0.002)
# exposure: the median lit texel lands at 0.30 (the reference's walls sit around a third of the way up the range);
# a soft knee above 0.8 keeps the fixtures' surrounds from clipping flat
med = lit[len(lit) // 2] if lit else 1.0; SCALE = max(0.05, med / 0.30)
def knee(v):
    v = v / SCALE
    return v if v < 0.8 else 0.8 + 0.2 * (1.0 - math.exp(-(v - 0.8) / 0.2))
# note: these bytes are the knee'd linear values, which the GPU then decodes as sRGB (assets.ts); the hall's look (the
# median at 0.30, the shader's exposure and grey, the output pass) was matched to the reference on screen through that
# decode, so it stays as it is; scripts/room/universe.py encodes its map instead
out = bpy.data.images.new('lightmap8', OUT_SIZE, OUT_SIZE)
out.pixels = [min(1.0, knee(v)) if (i % 4) != 3 else 1.0 for i, v in enumerate(px)]
out.filepath_raw = os.path.join(OUT, 'hall-lightmap.png'); out.file_format = 'PNG'; out.save()

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'hall.glb'), export_format='GLB', use_selection=True, export_materials='NONE', export_apply=True, export_yup=True, export_normals=True, export_texcoords=True)

cam = bpy.data.cameras.new('cam'); cam.lens_unit = 'FOV'; cam.angle = math.radians(60)
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
sc.render.resolution_x, sc.render.resolution_y = 640, 480; sc.cycles.samples = max(16, SAMPLES // 3)
for name, loc, rz_ in (('look-start', (XE - 0.6, 0, EYE), 90), ('look-transept', (-1.2, 0, EYE), 90), ('look-door', (XW + 1.6, 0, EYE), 90), ('look-side', (2.0, -0.9, EYE), 0)):
    co.location = loc; co.rotation_euler = (math.radians(90), 0, math.radians(rz_))
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
t3 = time.time()
rep = {'size': SIZE, 'out': OUT_SIZE, 'samples': SAMPLES, 'scale': SCALE, 'bake_s': round(t2 - t1, 1), 'total_s': round(t3 - t0, 1), 'faces': len(me.polygons),
       'glb_bytes': os.path.getsize(os.path.join(OUT, 'hall.glb')), 'png_bytes': os.path.getsize(os.path.join(OUT, 'hall-lightmap.png'))}
json.dump(rep, open(os.path.join(OUT, 'report.json'), 'w'), indent=1); print('DONE', rep)
