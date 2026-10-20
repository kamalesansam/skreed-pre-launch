# Section 4, part two: the accessories for the four lands (docs/specs/section-4-world.md 3, "How each master is made",
# step 2; W11 "the real case stays real"). Sam's own models drawn in their shade and finish on a transparent film, posed
# and lit to match one listing photo, so scripts/room/lands.py can composite them onto it locally: the generator never
# draws a product. Blender 5.2 headless, Cycles on the Metal GPU, the Standard view as hall.py:
#   /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python scripts/room/render-products.py -- <spec.json>
# lands.py writes the spec (one per land); every number in it is in metres and in the photo's own camera axes (OpenCV's:
# x right, y down, z forward, the camera at the origin), so a pose solved against the photo goes straight in:
#   which      wallet | lenskin | airpods (the shipped GLBs in public/models/, meshopt and quantisation decoded by
#              Blender's own importer) | airpods-ref (Sam's source FBX with Apple's case and earbuds kept: the land 4
#              reference only, E-S4-device; it is rendered here and composited, and never becomes a model the site loads)
#   model      the GLB (or, for airpods-ref, the FBX)
#   shades     docs/data/shades-240.json; shade the id (the hex is read from it by id, never typed) and finish
#              matte | gloss | metallic (the universe's calibration: matte roughness 0.62 with a fifth of a plastic's
#              specular, gloss the same under a clearcoat at 0.03, metallic matte metal at 0.38)
#   out        the beauty PNG (RGBA 16-bit, straight alpha); beside it <out>-neutral.png (every surface a white Lambertian,
#              for the colour check against the hex under the same light) and <out>-mask.png (the body parts white, the
#              logo grey, the rest black: which pixels the check reads)
#   width, height, samples
#   camera     {"type": "persp", "f_px", "cx", "cy"} the photo's intrinsics, or {"type": "ortho", "px_per_m"} face-on
#   object     4 x 4, row major: the model's frame (Blender's: x across, z up, the front toward -y) into the camera's
#   catcher    {"matrix": 4 x 4 (a plane's frame, its face toward its own -z, into the camera's), "size": [w, h]} or null:
#              a Cycles shadow catcher where the product rests, so the contact shadow arrives in the film's alpha
#   lights     [{"dir": [x, y, z] toward the light from the product, "dist", "size", "watts", "rgb"}], area lights aimed
#              at the product's centre, discs unless "shape": "RECTANGLE" with "size_y" and "roll" (degrees about the
#              light's own axis): a window, or a strip whose reflection is a streak; world {"rgb", "strength"} the ambient
#              fill (the film stays transparent)
#   env        optional, in place of the flat fill: a soft park sky for the metal and the clearcoat to reflect,
#              {"up": [x, y, z] the sky's zenith in the camera's axes, "horizon": the horizon's height (the sine of its
#              elevation, from the product), "strength", "zenith", "sky", "trees", "lawn", "nadir": linear rgb}; an
#              overcast sky brighter toward its zenith over a line of trees, and the lawn below
#   rough      optional roughness in place of the finish's own; bevel_m optional, the edges' bevel in metres (the
#              Lenskin's cut edge, where the fresnel lights its rim)
import bpy, sys, os, json, math
from mathutils import Matrix, Vector

S = json.load(open(sys.argv[sys.argv.index('--') + 1]))
W, H = int(S['width']), int(S['height'])
os.makedirs(os.path.dirname(os.path.abspath(S['out'])), exist_ok=True)

def shade_hex(path, sid):
    for fam in json.load(open(path))['families']:
        for s in fam['shades']:
            if s['id'] == sid: return s['hex']
    raise SystemExit(f'no shade {sid} in {path}')

def to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

HEX = shade_hex(S['shades'], S['shade'])
LIN = tuple(to_lin(int(HEX[i:i + 2], 16) / 255.0) for i in (1, 3, 5))
LOGO_TINT = 0.8468                      # the universe's logo inlay, a share of the shade (universe.ts)
TRIM_LIN = (0.073, 0.077, 0.077)        # the universe's fixed trim (universe.ts)
print('shade', S['shade'], HEX, 'linear', tuple(round(v, 4) for v in LIN))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = int(S.get('samples', 256))
# Cycles on the Metal GPU, as hall.py; the CPU only if Metal is refused
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for d in prefs.devices: d.use = (d.type == 'METAL')
    sc.cycles.device = 'GPU'
except Exception as e:
    print('GPU setup failed, CPU render:', e); sc.cycles.device = 'CPU'
sc.cycles.use_denoising = True
sc.cycles.use_auto_tile = True; sc.cycles.tile_size = 512   # small tiles: a 2500 px frame fits a GPU other sessions share
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.view_settings.exposure = float(S.get('exposure', 0.0))
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.color_depth = '16'

world = bpy.data.worlds.new('fill'); sc.world = world; world.use_nodes = True
wb = world.node_tree.nodes['Background']
wb.inputs[0].default_value = (*S['world']['rgb'], 1); wb.inputs[1].default_value = S['world']['strength']
if S.get('env'):
    # the park sky: the direction's height above the horizon (dot with the zenith, in Blender's axes) through a ramp
    E = S['env']; wt = world.node_tree
    up = Vector((E['up'][0], -E['up'][1], -E['up'][2])).normalized()
    tc = wt.nodes.new('ShaderNodeTexCoord')
    dot = wt.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = up
    wt.links.new(tc.outputs['Generated'], dot.inputs[0])
    mr = wt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -1.0; mr.inputs['From Max'].default_value = 1.0
    wt.links.new(dot.outputs['Value'], mr.inputs['Value'])
    ramp = wt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp; cr.interpolation = 'LINEAR'
    h = float(E.get('horizon', 0.0)); at = lambda u: min(max((u + 1) / 2, 0.0), 1.0)
    stops = [(at(-1.0), E['nadir']), (at(h - 0.03), E['lawn']), (at(h - 0.012), E['trees']), (at(h + 0.05), E['trees']),
             (at(h + 0.09), E['sky']), (at(1.0), E['zenith'])]
    cr.elements[0].position, cr.elements[0].color = stops[0][0], (*stops[0][1], 1)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], (*stops[-1][1], 1)
    for pos, rgb in stops[1:-1]:
        el = cr.elements.new(pos); el.color = (*rgb, 1)
    wt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])
    wt.links.new(ramp.outputs['Color'], wb.inputs[0]); wb.inputs[1].default_value = E.get('strength', 1.0)

# ---- the materials (the universe's finishes, so the land and the site's own renders agree)
# spec is Blender's Specular IOR Level, where 0.5 is a plain plastic's F0 and the level scales it linearly: three's
# specularIntensity 0.2 (the calibration's "a fifth of a plastic's") is 0.1 here
def principled(name, rgb, rough, spec=0.1, metal=0.0, coat=0.0, coat_rough=0.03):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Specular IOR Level'].default_value = spec if metal == 0 else 0.5
    p.inputs['Coat Weight'].default_value = coat; p.inputs['Coat Roughness'].default_value = coat_rough
    return m

def body_mat(rgb, finish, name):
    if finish == 'gloss': return principled(name, rgb, S.get('rough', 0.62), coat=1.0)
    if finish == 'metallic': return principled(name, rgb, S.get('rough', 0.38), metal=1.0)
    return principled(name, rgb, S.get('rough', 0.62))

FIN = S.get('finish', 'matte')
BODY = body_mat(LIN, FIN, 'body')
LOGO = body_mat(tuple(v * LOGO_TINT for v in LIN), FIN, 'logo')
TRIM = principled('trim', TRIM_LIN, 0.55)
# Apple's parts in the reference variant: the earbuds and the charging case's white plastic, the grilles dark
WHITE = principled('apple-white', (0.80, 0.80, 0.79), 0.22, spec=0.5)
DARK = principled('apple-dark', (0.02, 0.02, 0.022), 0.5)

# ---- the model
which = S['which']
parts = []   # (object, role) with role body | logo | trim | apple
if which == 'airpods-ref':
    bpy.ops.import_scene.fbx(filepath=S['model'], use_image_search=False)
    meshes = [o for o in sc.objects if o.type == 'MESH']
    assert len(meshes) == 1, [o.name for o in meshes]
    src = meshes[0]
    for o in list(sc.objects):
        if o is not src: bpy.data.objects.remove(o)
    mw = src.matrix_world.copy(); src.parent = None; src.matrix_world = mw
    bpy.ops.object.select_all(action='DESELECT'); src.select_set(True); bpy.context.view_layer.objects.active = src
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # the source's frame to the shipped GLB's (products.py recentres the Skreed shell and lid: x centred, y centred,
    # standing on z = 0), measured from both files: the shell and lid span y -0.0106 to 0.0256 and start at z 0.002
    src.data.transform(Matrix.Translation(Vector((0.0, -0.0075, -0.002))))
    # products.py's slots for the Skreed shell (lambert37), its open lid (lambert38) and the front plate (lambert33);
    # every other slot is Apple's charging case or an earbud, kept for this reference; the earbuds' grilles and the
    # case's inner pads read dark
    SKREED = {'lambert37': 'body', 'lambert38': 'body', 'lambert33': 'trim'}
    DARK_SLOTS = {'gjhfmCDBraSHRBA', 'idoSsFSyyQnsPkg', 'JPteNVbNSTfouNy', 'oaGvYLXguzqNzaM'}
    # the source poses the earbuds lifted a centimetre or more clear of their wells (z 45.6 to 75.6 mm against the
    # shell's rim at 33.9); the land shows them seated, so their faces drop by earbuds_drop_m (spec, default 0.031)
    EARBUD_SLOTS = {'rNiWHVMmyWBgLOM', 'LKPKlGuaQqDKAgD', 'DOKNnabUPtzADnX.001', 'gjhfmCDBraSHRBA', 'idoSsFSyyQnsPkg',
                    'gXUGKuBtWFBsjkI', 'NdoKemMVSCtZbst.001', 'LpOJztpvefacILm.001'}
    import bmesh
    bm = bmesh.new(); bm.from_mesh(src.data)
    ear = {i for i, m in enumerate(src.data.materials) if m and m.name in EARBUD_SLOTS}
    verts = {v for f in bm.faces if f.material_index in ear for v in f.verts}
    drop = float(S.get('earbuds_drop_m', 0.031))
    for v in verts: v.co.z -= drop
    bm.to_mesh(src.data); bm.free()
    print('earbuds', len(verts), 'vertices dropped', drop, 'm')
    mats = src.data.materials
    for i, m in enumerate(mats):
        name = m.name if m else ''
        role = SKREED.get(name, 'apple')
        mats[i] = BODY if role == 'body' else TRIM if role == 'trim' else (DARK if name in DARK_SLOTS else WHITE)
    parts.append((src, 'mixed'))
else:
    bpy.ops.import_scene.gltf(filepath=S['model'])
    for o in list(sc.objects):
        if o.type != 'MESH': continue
        role = 'trim' if o.name.startswith('trim') else 'logo' if o.name.startswith('logo') else 'body'
        o.data.materials.clear(); o.data.materials.append(BODY if role == 'body' else LOGO if role == 'logo' else TRIM)
        for poly in o.data.polygons: poly.use_smooth = True
        if S.get('bevel_m'):
            # the cut edge's small bevel, on the sharp edges only (the plate's faces against its walls, not the walls' facets)
            bv = o.modifiers.new('bevel', 'BEVEL'); bv.width = float(S['bevel_m']); bv.segments = 3
            bv.limit_method = 'ANGLE'; bv.angle_limit = math.radians(40); bv.harden_normals = True
        parts.append((o, role))

FLIP = Matrix(((1, 0, 0, 0), (0, -1, 0, 0), (0, 0, -1, 0), (0, 0, 0, 1)))   # the photo's camera axes to Blender's world
def mat4(rows): return Matrix([tuple(r) for r in rows])

root = bpy.data.objects.new('product', None); sc.collection.objects.link(root)
for o, _ in parts: o.parent = root
root.matrix_world = FLIP @ mat4(S['object'])
bpy.context.view_layer.update()
lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
for o, _ in parts:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
centre = (lo + hi) / 2

# ---- the camera: at the origin, looking down Blender's -z (the photo's +z), up its +y
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
C = S['camera']
cd.clip_start, cd.clip_end = 0.001, 100.0
if C['type'] == 'persp':
    cd.sensor_fit = 'HORIZONTAL' if W >= H else 'VERTICAL'
    cd.sensor_width = cd.sensor_height = 36.0
    cd.lens = C['f_px'] * 36.0 / max(W, H)
    cd.shift_x = -(C['cx'] - W / 2) / max(W, H); cd.shift_y = (C['cy'] - H / 2) / max(W, H)
else:
    cd.type = 'ORTHO'; cd.ortho_scale = max(W, H) / C['px_per_m']

# ---- the shadow catcher where the product rests
if S.get('catcher'):
    w, h = S['catcher']['size']
    bpy.ops.mesh.primitive_plane_add(size=1.0)
    pl = bpy.context.active_object; pl.name = 'catcher'
    pl.data.transform(Matrix.Diagonal((w, h, 1.0, 1.0)))
    pl.matrix_world = FLIP @ mat4(S['catcher']['matrix'])
    pl.is_shadow_catcher = True
    pl.data.materials.append(principled('catcher', (0.5, 0.5, 0.5), 0.8))

# ---- the lights: soft area lights aimed at the product, as the photo's window or sun
for i, L in enumerate(S['lights']):
    ld = bpy.data.lights.new(f'L{i}', 'AREA'); ld.shape = L.get('shape', 'DISK'); ld.size = L['size']
    if ld.shape == 'RECTANGLE': ld.size_y = L['size_y']
    ld.energy = L['watts']; ld.color = L.get('rgb', (1, 1, 1))
    lo_ = bpy.data.objects.new(f'L{i}', ld); sc.collection.objects.link(lo_); lo_.visible_camera = False
    d = Vector(L['dir']).normalized(); d = Vector((d.x, -d.y, -d.z))
    lo_.location = centre + d * L['dist']
    q = (-d).to_track_quat('-Z', 'Y')
    if L.get('roll'): q = q @ Matrix.Rotation(math.radians(L['roll']), 4, 'Z').to_quaternion()
    lo_.rotation_euler = q.to_euler()

def render(path):
    sc.render.filepath = path
    try: bpy.ops.render.render(write_still=True)
    except RuntimeError as e:
        # the GPU is shared with whatever else runs on this Mac: on an out-of-memory the same frame goes to the CPU
        print('GPU render failed, retrying on the CPU:', str(e).splitlines()[0]); sc.cycles.device = 'CPU'
        bpy.ops.render.render(write_still=True)

out = os.path.abspath(S['out']); stem = out[:-4] if out.endswith('.png') else out
render(stem + '.png')

# the neutral pass: every surface a white Lambertian under the same light, so lands.py reads the shade's albedo back as
# beauty / neutral per pixel and compares it with the catalog hex
neutral = bpy.data.materials.new('neutral'); neutral.use_nodes = True
nt = neutral.node_tree; nt.nodes.clear()
dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
mo = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(dif.outputs[0], mo.inputs['Surface'])
sc.view_layers[0].material_override = neutral
render(stem + '-neutral.png')
sc.view_layers[0].material_override = None

# the mask pass: emission only, so it is exact at a handful of samples; the catcher and the lights go
def emit(name, v):
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = m.node_tree; t.nodes.clear()
    e = t.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (v, v, v, 1); e.inputs['Strength'].default_value = 1.0
    o_ = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(e.outputs[0], o_.inputs['Surface'])
    return m
MB, ML, MO = emit('m-body', 1.0), emit('m-logo', 0.5), emit('m-other', 0.0)
for o, role in parts:
    for i, m in enumerate(o.data.materials):
        o.data.materials[i] = MB if m in (BODY,) else ML if m in (LOGO,) else MO
if bpy.data.objects.get('catcher'): bpy.data.objects.remove(bpy.data.objects['catcher'])
for o in list(sc.objects):
    if o.type == 'LIGHT': bpy.data.objects.remove(o)
wb.inputs[1].default_value = 0.0
sc.cycles.samples = 8; sc.cycles.use_denoising = False; sc.view_settings.exposure = 0.0
render(stem + '-mask.png')

json.dump({'which': which, 'shade': S['shade'], 'hex': HEX, 'linear': LIN, 'finish': FIN, 'out': stem + '.png',
           'bbox_cam_m': [list(lo), list(hi)], 'device': sc.cycles.device}, open(stem + '-report.json', 'w'), indent=1)
print('DONE', stem)
