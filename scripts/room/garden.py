# Section 4, part two: the garden behind the ring tunnel (docs/specs/section-4-world.md 2 "The ring travel", 3 "The
# garden", 6), our own geometry, light and render: no downloaded asset, no add-on. Blender 5.2 headless, Cycles on the
# Metal GPU, the Standard view (no Filmic, no AgX), as scripts/room/hall.py:
#   /Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/room/garden.py -- scripts/room/out/garden [samples=256] [scale=1]
# writes out/garden-plate.png (2048 x 2048, RGB 16-bit: the sky, the far trees, the lawn), out/garden-card-{1,2,3}.png
# (RGBA 16-bit, straight alpha: the clipped hedges, the flower beds, the near trees), out/garden-report.json, and three
# look renders of the whole garden from the glide's start, middle and end (1280 x 800, not shipped). scale < 1 renders
# everything smaller for look-dev. scripts/room/encode.mjs <out> garden then makes the shipped AVIF and WebP and
# src/assets/room/garden/garden.json.
#
# The axis. Blender is Z up here: the flight runs along Blender +y at EYE above the lawn (z = 0), x to the right. The
# island (three, Y up) reads Blender (x, y, z) as (x, z, -y), the glTF convention the hall uses, so the camera looks
# along the island's -z with x right and y up. Every number in the report is relative to the flight axis (x right,
# y up from the axis, distances along the flight), so the island can put the axis wherever its rings are.
#
# The render pose. Plate and cards are rendered from one camera at the glide's end, 0.5 S past the last ring (Blender
# origin, y = 0): there the cards are nearest, so their pixel density is lowest there and higher everywhere else on the
# flight, and the plate and the cards line up exactly where the garden is seen whole, just before the morph. The plate is
# meant to be drawn at infinity (a backdrop locked to the camera's position that turns with the roll and scales with the
# FOV); its lawn is mown in stripes parallel to the flight, and stripes along the direction of travel look the same from
# every point of the flight, so a still plate stays right as the camera moves. Each card is a crop of the same camera's
# projection (lens shift, no rotation), so a card's world rectangle on its plane is its tangent rectangle times its
# distance, and it registers over the plate from the render pose.
import bpy, bmesh, math, sys, os, time, json, random, re
from mathutils import Vector, Matrix, noise

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/garden'
SAMPLES = int(argv[1]) if len(argv) > 1 else 256
SCALE = float(argv[2]) if len(argv) > 2 else 1.0
os.makedirs(OUT, exist_ok=True)
t0 = time.time()

# ---- the flight (spec 2 "The ring travel"): S between rings, the camera from 0.71 S before the first ring to 0.5 S
# past the last, the cards at 2, 4 and 7 S past the last ring, the FOV opening from 22 to 30 degrees over the glide
S = 2.5
RINGS, START_BEFORE, END_PAST = 3, 0.71, 0.5
START_FROM_END = (RINGS - 1 + START_BEFORE + END_PAST) * S     # 8.025: the glide's length along the axis
FOV_START, FOV_END = 22.0, 30.0
EYE = 1.2                # the flight axis above the lawn; 1 unit is 1 m of this scene
CARDS = (('hedges', 2.0), ('flowers', 4.0), ('trees', 7.0))   # id, S past the last ring
dist_of = lambda s_past: (s_past - END_PAST) * S                # from the render pose: 3.75, 8.75, 16.25
PLATE_FOV, PLATE_PX = 64.0, 2048        # 32 px per degree across on average, 28.6 at the centre (spec 3: 25 at 390, 32 at 1280)
CARD_PPT = 2304          # card pixels per unit of tangent: 40.2 px per degree at a card's centre (spec 3: 40 or more)
CARD_MAX_W, CARD_MARGIN = 2048, 24     # clear pixels round each card's content; encode.mjs feathers the alpha across them
# ---- the light (task brief: the sun behind the camera at 35 degrees): 20 degrees off straight behind, to the camera's
# left, so the hedges and the canopies are modelled rather than flat-lit; shadows fall ahead and to the right
SUN_ELEV, SUN_OFF = 35.0, 20.0
SUN_ROT = 180.0 + SUN_OFF            # the sky node's azimuth, measured from +y toward +x (probed: 30 puts it 30 toward +x)
# a white diffuse face square to a Cycles sun of strength E reads E / pi (probed: 0.317 at 1). 2.9 puts a white face
# square to the sun at 0.92 under the Standard view. The sky is seen at SKY_K, its blue away from the sun near
# (0.45, 0.6, 0.8) on screen, but lights the garden at SKY_LIGHT: a sky that bright lighting the scene would give it
# 45 percent of the light where a clear day gives 15 to 20, and turn the gravel grey and every shadow blue
SUN_E, SKY_K, SKY_LIGHT = 2.9, 0.075, 0.03
# the sky's highlight knee, for camera rays: its brightest channel passes unchanged to KNEE and then rolls off toward
# KNEE + KNEE_SPAN, every channel scaled alike so the hue holds; without it the horizon clips to #ffffff (rule 23)
KNEE, KNEE_SPAN = 0.5, 0.36
PATH_HW, STRIPE_W = 0.45, 1.25       # the gravel path along the axis, half its width; the mown stripes either side

# the ten families' key shades by id (src/config/room.ts ROOM_BAYS), read from the config so they cannot drift
ROOM_TS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'config', 'room.ts')
_src = open(ROOM_TS).read()
_block = _src[_src.index('export const ROOM_BAYS'):]
BAYS = re.findall(r"shade: '([a-z]+-[a-z]+-\d\d)', hex: '(#[0-9a-f]{6})'", _block[:_block.index(']);')])
assert len(BAYS) == 10, BAYS
def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = SAMPLES
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for d in prefs.devices: d.use = (d.type == 'METAL')
    sc.cycles.device = 'GPU'
except Exception as e:
    print('GPU setup failed, CPU render:', e); sc.cycles.device = 'CPU'
sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
try: sc.cycles.denoising_use_gpu = True
except Exception: pass
sc.cycles.max_bounces = 8; sc.cycles.adaptive_threshold = 0.01
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_depth = '16'
sc.render.resolution_percentage = 100; sc.render.pixel_aspect_x = sc.render.pixel_aspect_y = 1

# ---- node helpers: sockets by identifier (the Mix node has one A and one B per data type)
def sock(coll, ident): return next(s for s in coll if s.identifier == ident)
def put(nt, s, v):
    if isinstance(v, bpy.types.NodeSocket): nt.links.new(v, s)
    elif isinstance(v, tuple) and len(v) == 3 and s.type == 'RGBA': s.default_value = (*v, 1.0)
    else: s.default_value = v
def math_(nt, op, a, b=0.0):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op; put(nt, n.inputs[0], a); put(nt, n.inputs[1], b); return n.outputs[0]
def mapr(nt, v, f0, f1, t0=0.0, t1=1.0, smooth=True):
    n = nt.nodes.new('ShaderNodeMapRange'); n.interpolation_type = 'SMOOTHSTEP' if smooth else 'LINEAR'; n.clamp = True
    put(nt, n.inputs['Value'], v); n.inputs['From Min'].default_value = f0; n.inputs['From Max'].default_value = f1
    n.inputs['To Min'].default_value = t0; n.inputs['To Max'].default_value = t1; return n.outputs['Result']
def mixc(nt, fac, a, b):
    n = nt.nodes.new('ShaderNodeMix'); n.data_type = 'RGBA'; n.clamp_factor = True
    put(nt, sock(n.inputs, 'Factor_Float'), fac); put(nt, sock(n.inputs, 'A_Color'), a); put(nt, sock(n.inputs, 'B_Color'), b)
    return sock(n.outputs, 'Result_Color')
def scale(nt, v, k):
    n = nt.nodes.new('ShaderNodeVectorMath'); n.operation = 'SCALE'; put(nt, n.inputs[0], v); put(nt, n.inputs['Scale'], k); return n.outputs['Vector']
def noise_tex(nt, vec, s, detail=3.0, rough=0.55):
    n = nt.nodes.new('ShaderNodeTexNoise'); n.noise_dimensions = '3D'; put(nt, n.inputs['Vector'], vec)
    n.inputs['Scale'].default_value = s; n.inputs['Detail'].default_value = detail; n.inputs['Roughness'].default_value = rough
    return n.outputs['Fac']

# ---- the sky: the multiple-scattering sky (Blender 5's successor to Nishita) with its sun disc off, since a sun lamp
# carries the direct light; soft clouds on a layer 1.2 km up, seen by camera rays only (they light nothing), faded
# out toward the horizon where their projection would alias, and kept under 0.9 so the sky never clips (rule 23)
world = bpy.data.worlds.new('garden-sky'); sc.world = world; world.use_nodes = True
wt = world.node_tree; wout = wt.nodes['World Output']; bg_light = wt.nodes['Background']
sky = wt.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'; sky.sun_disc = False; sky.aerosol_density = 0.5
sky.sun_elevation = math.radians(SUN_ELEV); sky.sun_rotation = math.radians(SUN_ROT)
wt.links.new(sky.outputs['Color'], bg_light.inputs['Color']); bg_light.inputs['Strength'].default_value = SKY_LIGHT
d = wt.nodes.new('ShaderNodeTexCoord').outputs['Generated']           # the ray's direction in a world shader
sep = wt.nodes.new('ShaderNodeSeparateXYZ'); wt.links.new(d, sep.inputs[0])
t = math_(wt, 'DIVIDE', 1200.0, math_(wt, 'MAXIMUM', sep.outputs['Z'], 0.04))
p = scale(wt, d, t)
off = wt.nodes.new('ShaderNodeVectorMath'); off.operation = 'ADD'; wt.links.new(p, off.inputs[0]); off.inputs[1].default_value = (5310.0, 870.0, 0.0)
dens = mapr(wt, noise_tex(wt, off.outputs[0], 0.0011, 5.0, 0.55), 0.53, 0.72)
fade = mapr(wt, sep.outputs['Z'], 0.05, 0.2)
cmask = math_(wt, 'MULTIPLY', math_(wt, 'MULTIPLY', dens, fade), 0.92)
shade = mapr(wt, noise_tex(wt, off.outputs[0], 0.0034, 3.0, 0.5), 0.36, 0.64)
cloud = mixc(wt, shade, (0.56, 0.61, 0.70), (0.84, 0.85, 0.85))
sky_k = scale(wt, sky.outputs['Color'], SKY_K)
rgb = wt.nodes.new('ShaderNodeSeparateColor'); wt.links.new(sky_k, rgb.inputs[0])
peak = math_(wt, 'MAXIMUM', math_(wt, 'MAXIMUM', rgb.outputs[0], rgb.outputs[1]), rgb.outputs[2])
over = math_(wt, 'MAXIMUM', math_(wt, 'SUBTRACT', peak, KNEE), 0.0)
rolled = math_(wt, 'ADD', math_(wt, 'MINIMUM', peak, KNEE),
               math_(wt, 'MULTIPLY', KNEE_SPAN, math_(wt, 'SUBTRACT', 1.0, math_(wt, 'EXPONENT', math_(wt, 'DIVIDE', over, -KNEE_SPAN)))))
sky_k = scale(wt, sky_k, math_(wt, 'DIVIDE', rolled, math_(wt, 'MAXIMUM', peak, 1e-4)))
bg_cam = wt.nodes.new('ShaderNodeBackground'); wt.links.new(mixc(wt, cmask, sky_k, cloud), bg_cam.inputs['Color'])
lp = wt.nodes.new('ShaderNodeLightPath')
mixw = wt.nodes.new('ShaderNodeMixShader'); wt.links.new(lp.outputs['Is Camera Ray'], mixw.inputs[0])
wt.links.new(bg_light.outputs[0], mixw.inputs[1]); wt.links.new(bg_cam.outputs[0], mixw.inputs[2])
wt.links.new(mixw.outputs[0], wout.inputs['Surface'])

el, az = math.radians(SUN_ELEV), math.radians(SUN_ROT)
SUN_DIR = Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)))   # toward the sun, Blender
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = SUN_E; sun.angle = math.radians(1.2)
sun_ob = bpy.data.objects.new('sun', sun); sc.collection.objects.link(sun_ob)
sun_ob.rotation_euler = SUN_DIR.to_track_quat('Z', 'Y').to_euler()     # a sun lamp shines down its own -z

# ---- materials. Aerial haze: an emission toward the horizon's colour that grows with distance (none nearer than 25 m),
# so the far trees and the far lawn pale as a real distance does, without a volume
HAZE = (0.40, 0.52, 0.66)
def principled(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree, m.node_tree.nodes['Principled BSDF']
def haze(nt, bsdf, base):
    dist = nt.nodes.new('ShaderNodeCameraData').outputs['View Distance']
    h = mapr(nt, dist, 25.0, 450.0, 0.0, 0.5, smooth=False)
    put(nt, bsdf.inputs['Base Color'], mixc(nt, h, base, (0.0, 0.0, 0.0)))
    put(nt, bsdf.inputs['Emission Color'], HAZE); put(nt, bsdf.inputs['Emission Strength'], h)
def foliage(name, dark, light, s, bump, rough=0.72, macro=0.0):
    """leaf: two greens mixed by noise at the clump's scale s, and with macro > 0 also by a slow noise, so neighbouring
    trees of one merged mesh differ in tone; a finer noise bumps the surface"""
    m, nt, b = principled(name)
    tc = nt.nodes.new('ShaderNodeTexCoord').outputs['Object']           # the meshes are built in world space
    f = mapr(nt, noise_tex(nt, tc, s, 4.0, 0.6), 0.32, 0.68)
    if macro: f = math_(nt, 'MULTIPLY', f, mapr(nt, noise_tex(nt, tc, macro, 1.0, 0.5), 0.3, 0.7, 0.55, 1.25))
    col = mixc(nt, f, dark, light)
    bn = nt.nodes.new('ShaderNodeBump'); bn.inputs['Strength'].default_value = bump; bn.inputs['Distance'].default_value = 0.03
    put(nt, bn.inputs['Height'], noise_tex(nt, tc, s * 3.1, 2.0, 0.5)); put(nt, b.inputs['Normal'], bn.outputs['Normal'])
    b.inputs['Roughness'].default_value = rough; b.inputs['Specular IOR Level'].default_value = 0.35
    haze(nt, b, col); return m
def flat(name, rgb, rough=0.55, spec=0.4):
    m, nt, b = principled(name)
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = spec; return m

def lawn_material():
    m, nt, b = principled('lawn')
    tc = nt.nodes.new('ShaderNodeTexCoord').outputs['Object']
    xyz = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc, xyz.inputs[0])
    ax = math_(nt, 'ABSOLUTE', xyz.outputs['X'])
    path = mapr(nt, ax, PATH_HW - 0.03, PATH_HW + 0.03, 1.0, 0.0)
    # the mown stripes: a soft square wave across x from the path's edge, its contrast fading out beyond 45 m so the
    # stripes never alias into moire toward the horizon
    wave = math_(nt, 'SINE', math_(nt, 'MULTIPLY', math_(nt, 'SUBTRACT', ax, PATH_HW), math.pi / STRIPE_W))
    stripe = mapr(nt, wave, -0.35, 0.35)
    far = mapr(nt, nt.nodes.new('ShaderNodeCameraData').outputs['View Distance'], 45.0, 160.0, 1.0, 0.0)
    stripe = math_(nt, 'ADD', 0.5, math_(nt, 'MULTIPLY', math_(nt, 'SUBTRACT', stripe, 0.5), far))
    grass = mixc(nt, stripe, (0.130, 0.300, 0.050), (0.190, 0.400, 0.070))
    grass = scale(nt, grass, mapr(nt, noise_tex(nt, tc, 0.9, 3.0, 0.5), 0.3, 0.7, 0.9, 1.1))
    gravel = scale(nt, (0.56, 0.47, 0.34), mapr(nt, noise_tex(nt, tc, 7.0, 2.0, 0.5), 0.3, 0.7, 0.93, 1.07))
    haze(nt, b, mixc(nt, path, grass, gravel))
    b.inputs['Roughness'].default_value = 0.92; b.inputs['Specular IOR Level'].default_value = 0.25
    return m

LAWN = lawn_material()
BOX = foliage('box', (0.045, 0.110, 0.025), (0.090, 0.200, 0.040), 9.0, 0.35)
BEDLEAF = foliage('bed-leaf', (0.050, 0.130, 0.028), (0.090, 0.210, 0.042), 11.0, 0.3)
CANOPY = foliage('canopy', (0.050, 0.118, 0.026), (0.165, 0.315, 0.055), 4.0, 0.45, macro=0.12)
FARLEAF = foliage('far-leaf', (0.045, 0.100, 0.030), (0.140, 0.250, 0.055), 0.7, 0.4, macro=0.05)
YEW = foliage('yew', (0.030, 0.070, 0.022), (0.060, 0.130, 0.035), 1.6, 0.3)
BARK = flat('bark', (0.130, 0.110, 0.090), rough=0.85, spec=0.2)
FLOWERS = [flat(f'flower-{shade}', lin(hx), rough=0.5, spec=0.35) for shade, hx in BAYS]

# ---- geometry, built in world space as bmesh primitives merged into one object per group
def cube_grid(bm, n):
    """the six faces of [-1, 1]^3 as n x n grids, welded at their seams, outward normals"""
    vs = []
    for axis in range(3):
        for sgn in (-1, 1):
            g = [[None] * (n + 1) for _ in range(n + 1)]
            for i in range(n + 1):
                for j in range(n + 1):
                    q = [0.0, 0.0, 0.0]; q[axis] = sgn; q[(axis + 1) % 3] = -1 + 2 * i / n; q[(axis + 2) % 3] = -1 + 2 * j / n
                    g[i][j] = bm.verts.new(q); vs.append(g[i][j])
            for i in range(n):
                for j in range(n):
                    f = [g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]]
                    bm.faces.new(f if sgn > 0 else f[::-1])
    bmesh.ops.remove_doubles(bm, verts=vs, dist=1e-6)
    return [v for v in vs if v.is_valid]

def wobble(p, freq, seed):
    o = Vector((seed * 17.3, seed * 5.9, seed * 11.1))
    return noise.noise(p * freq + o) + 0.5 * noise.noise(p * freq * 2.3 + o * 1.7)

def rbox(bm, lo, hi, r, step, amp=0.0, freq=4.0, seed=0):
    """a box with its edges rounded at radius r, gridded every step metres, displaced along its normal by noise"""
    lo, hi = Vector(lo), Vector(hi); c, h = (lo + hi) / 2, (hi - lo) / 2
    inner = Vector([max(v - r, 0.0) for v in h])
    for v in cube_grid(bm, max(2, round(2 * max(h) / step))):
        q = Vector((v.co.x * h.x, v.co.y * h.y, v.co.z * h.z))
        k = Vector([max(-inner[i], min(inner[i], q[i])) for i in range(3)])
        nrm = (q - k).normalized() if (q - k).length > 1e-9 else Vector((0, 0, 1))
        q = k + nrm * r
        v.co = c + q + nrm * (amp * wobble(c + q, freq, seed) if amp else 0.0)

def blob(bm, c, r, sub=3, amp=0.12, seed=0, squash=(1.0, 1.0, 1.0)):
    """a lumpy foliage mass: an icosphere pushed out and in by two octaves of noise"""
    ret = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0, matrix=Matrix.Identity(4), calc_uvs=False)
    c = Vector(c)
    for v in ret['verts']:
        q = Vector((v.co.x * squash[0], v.co.y * squash[1], v.co.z * squash[2])) * r
        v.co = c + q * (1 + amp * wobble(c + q, 2.0 / r, seed))

def revolve(bm, profile, seg, mat, amp=0.0, freq=6.0, seed=0):
    """a surface of revolution about local z from (z, radius) pairs; a last radius of 0 closes it to a tip"""
    rings = []
    for z, r in profile:
        if r <= 0: rings.append([bm.verts.new(mat @ Vector((0, 0, z)))]); continue
        ring = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            local = Vector((r * math.cos(a), r * math.sin(a), z))
            w = 1 + amp * wobble(local, freq, seed) if amp else 1.0
            ring.append(bm.verts.new(mat @ Vector((local.x * w, local.y * w, z))))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        if len(b) == 1:
            for i in range(seg): bm.faces.new((a[i], a[(i + 1) % seg], b[0]))
        else:
            for i in range(seg): bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))

def finish(name, bm, mat, coll):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    ob = bpy.data.objects.new(name, me); ob.data.materials.append(mat); coll.objects.link(ob); return ob

def collection(name):
    c = bpy.data.collections.new(name); sc.collection.children.link(c); return c

rnd = random.Random(20261020)

# the lawn: one plane to 1.5 km, far enough that its edge sits under a pixel below the horizon
COL_GROUND = collection('ground')
bm = bmesh.new()
vs = [bm.verts.new(p) for p in ((-1500, -40, 0), (1500, -40, 0), (1500, 1500, 0), (-1500, 1500, 0))]
bm.faces.new(vs)
ground = finish('lawn', bm, LAWN, COL_GROUND)

# the far trees (in the plate): a woodland edge 92 to 150 m out behind a tall clipped boundary hedge at 86 m, both
# open on the axis for a vista to a lower, hazier line at 230 to 290 m; each tree a trunk and a few lumpy masses hung
# low, the line low enough that the sky shows above it at the glide's end
COL_FAR = collection('far')
bmf, bmb, bmy = bmesh.new(), bmesh.new(), bmesh.new()
for s in (-1, 1):
    rbox(bmy, (min(s * 7.0, s * 120.0), 85.0, -0.2), (max(s * 7.0, s * 120.0), 87.2, 3.0), 0.35, 1.5, amp=0.06, freq=1.5, seed=60 + s)
def far_tree(x, y, h, seed):
    R = h * rnd.uniform(0.34, 0.44)
    zc = h - R * 0.95
    revolve(bmb, [(-0.3, 0.36), (zc, 0.2)], 7, Matrix.Translation((x, y, 0)))
    blob(bmf, (x, y, zc), R * 0.8, 2, 0.14, seed, (1.0, 0.9, 0.85))
    for k in range(rnd.randint(7, 10)):
        a = rnd.uniform(0, 2 * math.pi); e = math.asin(rnd.uniform(-0.65, 1.0))
        u = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e)))
        blob(bmf, (x + u.x * R * 0.62, y + u.y * R * 0.5, zc + u.z * R * 0.6), R * rnd.uniform(0.36, 0.5), 2, 0.18, seed * 7 + k)
far_n = 0
for row, (y0, y1, hmin, hmax, step, gap, xlim) in enumerate(((92, 125, 8.0, 13.5, 5.0, 8.5, 92), (120, 150, 11.0, 16.0, 7.0, 13.0, 100),
                                                          (230, 290, 13.0, 18.0, 9.0, 0.0, 40))):
    x = -xlim
    while x < xlim:
        if abs(x) >= gap:
            far_tree(x + rnd.uniform(-1.5, 1.5), rnd.uniform(y0, y1), rnd.uniform(hmin, hmax), far_n); far_n += 1
        x += step * rnd.uniform(0.75, 1.15)
finish('far-canopy', bmf, FARLEAF, COL_FAR); finish('far-trunks', bmb, BARK, COL_FAR); finish('far-hedge', bmy, YEW, COL_FAR)

# card 1, the clipped hedges (2 S past the last ring, 3.75 from the render pose): either side of the path, a low box
# hedge across the flight with a box ball at its inner end, all within a hand's depth of the card's plane so the card's
# flattening never shows
D1 = dist_of(2.0)
COL_HEDGE = collection('card-hedges')
bmh = bmesh.new()
for s in (-1, 1):
    x_in, x_out = 0.86, 1.5
    lo, hi = (min(s * x_in, s * x_out), D1 - 0.22, -0.12), (max(s * x_in, s * x_out), D1 + 0.22, 0.55)
    rbox(bmh, lo, hi, 0.1, 0.035, amp=0.012, freq=5.0, seed=3 + s)
    blob(bmh, (s * 0.76, D1 - 0.08, 0.27), 0.28, 4, 0.035, 9 + s)
finish('hedges', bmh, BOX, COL_HEDGE)

# card 2, the flower beds (4 S past the last ring, 8.75): a border edged in box either side of the path, each planted
# in five drifts, the ten families' key shades by id in catalog order from the left, on a mound of leaf
D2 = dist_of(4.0)
COL_BEDS = collection('card-flowers')
bme, bml = bmesh.new(), bmesh.new()
bmfl = [bmesh.new() for _ in BAYS]
BED_IN, BED_OUT, BED_Y = 0.56, 3.52, (D2 - 0.5, D2 + 0.5)    # each border from beside the path to its outer end
EDGE_W, EDGE_H = 0.06, 0.1
MOUND_H, MOUND_R = 0.5, 0.2
def head(fb, c, nrm, r):
    """one flower head: a disc r across, flattened along the surface normal it faces out of, half proud of the leaf"""
    ret = bmesh.ops.create_icosphere(fb, subdivisions=1, radius=1.0, matrix=Matrix.Identity(4), calc_uvs=False)
    rot = nrm.to_track_quat('Z', 'Y').to_matrix()
    c = c + nrm * (r * 0.25)
    for v in ret['verts']: v.co = c + rot @ Vector((v.co.x * r, v.co.y * r, v.co.z * r * 0.55))
for side in (-1, 1):
    x0, x1 = sorted((side * BED_IN, side * BED_OUT)); y0, y1 = BED_Y
    for lo, hi in (((x0, y0, -0.05), (x1, y0 + EDGE_W, EDGE_H)), ((x0, y1 - EDGE_W, -0.05), (x1, y1, EDGE_H)),
                   ((x0, y0, -0.05), (x0 + EDGE_W, y1, EDGE_H)), ((x1 - EDGE_W, y0, -0.05), (x1, y1, EDGE_H))):
        rbox(bme, lo, hi, 0.025, 0.03, amp=0.006, freq=8.0, seed=side)
    # the mound of leaf: a rounded box inside the edging, domed across its depth
    mx0, mx1, my0, my1 = x0 + EDGE_W - 0.01, x1 - EDGE_W + 0.01, y0 + EDGE_W - 0.01, y1 - EDGE_W + 0.01
    rbox(bml, (mx0, my0, -0.05), (mx1, my1, MOUND_H), MOUND_R, 0.04, amp=0.02, freq=6.0, seed=40 + side)
    cy, hy = (my0 + my1) / 2, (my1 - my0) / 2
    # the mound's profile across its depth, by arc length from the foot of its front face (just above the edging) over
    # the front rounding and the flat top to the end of the back rounding: what the camera sees of it, so the heads
    # fall evenly over the visible surface, steep or flat
    R, zr, yf, yb = MOUND_R, MOUND_H - MOUND_R, cy - hy + MOUND_R, cy + hy - MOUND_R
    L_face, L_round, L_top = zr - EDGE_H, math.pi * R / 2, yb - yf
    L_all = L_face + 2 * L_round + L_top
    def profile(u):
        """(y, z, normal) at arc length u along the profile"""
        if u < L_face: return my0, EDGE_H + u, Vector((0, -1, 0))
        u -= L_face
        if u < L_round:
            a = u / R; n = Vector((0, -math.cos(a), math.sin(a))); return yf + R * n.y, zr + R * n.z, n
        u -= L_round
        if u < L_top: return yf + u, MOUND_H, Vector((0, 0, 1))
        a = (u - L_top) / R; n = Vector((0, math.sin(a), math.cos(a))); return yb + R * n.y, zr + R * n.z, n
    ilo, ihi = Vector((mx0 + R, my0 + R, -0.05 + R)), Vector((mx1 - R, my1 - R, MOUND_H - R))
    def onto(q):
        """a point onto the mound's rounded surface, with its normal: so the border's rounded ends are planted too"""
        k = Vector([max(ilo[i], min(ihi[i], q[i])) for i in range(3)]); d = q - k
        n = d.normalized() if d.length > 1e-9 else Vector((0, 0, 1)); return k + n * R, n
    def drift(x, y):
        """which of the side's five families a head at (x, y) belongs to: five drifts across the border, in catalog
        order from the left, with wavy boundaries so they read as planting rather than paint"""
        u = (x - mx0) / (mx1 - mx0) * 5 + 0.22 * noise.noise(Vector((x * 2.2, y * 4.0, side * 3.0)))
        return (0 if side < 0 else 5) + max(0, min(4, int(u)))
    # the heads, discs 6 to 12 cm across, about 850 to the square metre of visible mound, a little leaf between
    for _ in range(round(850 * (mx1 - mx0) * L_all)):
        y, z, _ = profile(rnd.uniform(0.0, L_all))
        q, nrm = onto(Vector((rnd.uniform(mx0 + 0.02, mx1 - 0.02), y, z))); x, y, z = q
        lift = 0.025 * noise.noise(Vector((x * 3, y * 3, side))) + rnd.uniform(-0.005, 0.03)
        tilt = Vector((rnd.uniform(-0.25, 0.25), rnd.uniform(-0.25, 0.25), 0.0))
        head(bmfl[drift(x, y)], Vector((x, y, z)) + nrm * lift, (nrm + tilt).normalized(), rnd.uniform(0.032, 0.058))
finish('bed-edging', bme, BOX, COL_BEDS); finish('bed-leaf', bml, BEDLEAF, COL_BEDS)
for i, fb in enumerate(bmfl): finish(f'flowers-{BAYS[i][0]}', fb, FLOWERS[i], COL_BEDS)

# card 3, the near trees (7 S past the last ring, 16.25): two either side, the larger in front, the vista left open;
# each a tapering trunk, four limbs into the crown, and a crown of leaf clusters over a darker core, so its edge breaks
# up as a real canopy's does
D3 = dist_of(7.0)
COL_TREES = collection('card-trees')
bmc, bmt = bmesh.new(), bmesh.new()
TREES = ((-3.75, D3 - 0.2, 6.1, 2.0), (-5.9, D3 + 2.4, 5.2, 1.35), (3.85, D3 - 0.4, 6.4, 2.0), (5.95, D3 + 2.2, 5.0, 1.3))
CROWN = (1.0, 0.85, 0.8)             # the crown's ellipsoid, as fractions of R across, along the flight and up
for n, (x, y, h, R) in enumerate(TREES):
    zc = h - R * CROWN[2] * 1.1
    lean = Matrix.Rotation(math.radians(rnd.uniform(-3, 3)), 4, 'Y')
    revolve(bmt, [(-0.2, 0.27), (0.3, 0.22), (zc - R * 0.6, 0.15), (zc, 0.1)], 12, Matrix.Translation((x, y, 0)) @ lean, amp=0.07, freq=3.0, seed=n)
    for k in range(4):
        a = 2 * math.pi * (k / 4 + rnd.uniform(-0.08, 0.08)); tilt = math.radians(rnd.uniform(35, 55))
        base = Vector((x, y, zc - R * 0.6))
        rot = Vector((math.cos(a) * math.sin(tilt), math.sin(a) * math.sin(tilt), math.cos(tilt))).to_track_quat('Z', 'Y').to_matrix().to_4x4()
        revolve(bmt, [(0.0, 0.1), (R * 0.8, 0.04)], 8, Matrix.Translation(base) @ rot)
    blob(bmc, (x, y, zc), R * 0.78, 3, 0.1, 100 + n, CROWN)
    for k in range(170):
        a = rnd.uniform(0, 2 * math.pi); e = math.asin(rnd.uniform(-0.55, 1.0)); depth = rnd.uniform(0.78, 1.0)
        u = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e)))
        rr = R * rnd.uniform(0.11, 0.19)
        blob(bmc, (x + u.x * R * CROWN[0] * depth, y + u.y * R * CROWN[1] * depth, zc + u.z * R * CROWN[2] * depth), rr, 2, 0.28, 200 + n * 300 + k)
finish('canopy', bmc, CANOPY, COL_TREES); finish('trunks', bmt, BARK, COL_TREES)

GROUPS = {'plate': [COL_FAR], 'hedges': [COL_HEDGE], 'flowers': [COL_BEDS], 'trees': [COL_TREES]}
def show(only, catcher):
    """what a render sees: the lawn always, as itself for the plate or as a shadow catcher for a card"""
    for key, cols in GROUPS.items():
        for c in cols: c.hide_render = key not in only
    ground.is_shadow_catcher = catcher

# ---- the cameras
cam = bpy.data.cameras.new('cam'); cam.lens_unit = 'FOV'; cam.clip_start = 0.05; cam.clip_end = 5000
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
co.rotation_euler = (math.radians(90), 0, 0)           # looking down Blender +y, the island's -z
def place(y=0.0): co.location = (0, y, EYE)

def tan_bounds(cols):
    """the card's content as seen from the render pose, in tangent units (x right, y up), from every vertex and from
    where the sun throws it on the lawn, so a card holds its own shadow"""
    dg = bpy.context.evaluated_depsgraph_get()
    x0 = y0 = 1e9; x1 = y1 = -1e9
    for c in cols:
        for ob in c.objects:
            me = ob.evaluated_get(dg).data; mw = ob.matrix_world
            for v in me.vertices:
                p = mw @ v.co
                p.z = max(p.z, 0.0)                                 # below the lawn is hidden by it
                for q in (p, p - SUN_DIR * (p.z / SUN_DIR.z)):
                    if q.y < 0.5: continue
                    tx, ty = q.x / q.y, (q.z - EYE) / q.y
                    x0, x1, y0, y1 = min(x0, tx), max(x1, tx), min(y0, ty), max(y1, ty)
    return x0, x1, y0, y1

renders = {}
def render(path, w, h, transparent):
    sc.render.resolution_x, sc.render.resolution_y = max(8, round(w * SCALE)), max(8, round(h * SCALE))
    sc.render.film_transparent = transparent
    sc.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    sc.render.filepath = os.path.join(OUT, path)
    t = time.time(); bpy.ops.render.render(write_still=True); renders[path] = round(time.time() - t, 1)
    print('rendered', path, sc.render.resolution_x, sc.render.resolution_y, renders[path], 's')

# (a) the plate: 64 degrees square from the render pose, no near objects
place(0.0)
show({'plate'}, False)
cam.sensor_fit = 'AUTO'; cam.angle = math.radians(PLATE_FOV); cam.shift_x = cam.shift_y = 0.0
render('garden-plate.png', PLATE_PX, PLATE_PX, False)

# (b) the cards: each on its own over a shadow-catching lawn, cropped to its content by lens shift from the same pose
cards = []
for n, (cid, s_past) in enumerate(CARDS, 1):
    x0, x1, y0, y1 = tan_bounds(GROUPS[cid])
    m = CARD_MARGIN / CARD_PPT
    x0, x1, y0, y1 = x0 - m, x1 + m, y0 - m, y1 + m
    ppt = min(CARD_PPT, CARD_MAX_W / (x1 - x0))       # a card wider than 2048 px at 40 px per degree loses density, reported
    w, h = math.ceil((x1 - x0) * ppt), math.ceil((y1 - y0) * ppt)
    x1, y1 = x0 + w / ppt, y0 + h / ppt               # the rectangle the whole pixels cover
    wt_, ht_ = w / ppt, h / ppt
    assert w >= h, (cid, w, h)                         # the shift below is in units of the frame's longer side
    cam.sensor_fit = 'HORIZONTAL'; cam.angle = 2 * math.atan(wt_ / 2)
    cam.shift_x, cam.shift_y = ((x0 + x1) / 2) / wt_, ((y0 + y1) / 2) / wt_
    show({cid}, True)
    render(f'garden-card-{n}.png', w, h, True)
    D = dist_of(s_past)
    cards.append({'id': cid, 'n': n, 'pastLastRingS': s_past, 'distance': D, 'px': [w, h], 'pxPerTan': round(ppt, 2),
                  'pxPerDeg': round(ppt * math.pi / 180, 1), 'tan': [round(v, 6) for v in (x0, x1, y0, y1)],
                  'world': {'width': round(wt_ * D, 4), 'height': round(ht_ * D, 4), 'x': round((x0 + x1) / 2 * D, 4), 'y': round((y0 + y1) / 2 * D, 4)}})
    print('card', cid, w, h, 'px', 'ppt', round(ppt), 'tan', [round(v, 3) for v in (x0, x1, y0, y1)])

# (c) the look renders: the whole garden as one scene from the glide's start, its middle (the second ring) and its end,
# laptop frames at the spec's FOV; scripts compare them with the plate and the cards composited at the same poses
show({'plate', 'hedges', 'flowers', 'trees'}, False)
cam.sensor_fit = 'VERTICAL'; cam.shift_x = cam.shift_y = 0.0
looks = {}
for name, back in (('start', START_FROM_END), ('middle', (1 + END_PAST) * S), ('end', 0.0)):
    fov = FOV_START + (FOV_END - FOV_START) * (1 - back / START_FROM_END)
    place(-back); cam.angle = math.radians(fov)
    sc.cycles.samples = max(32, SAMPLES // 2)
    render(f'look-{name}.png', 1280, 800, False)
    looks[name] = {'back': round(back, 4), 'fovDeg': round(fov, 3)}
sc.cycles.samples = SAMPLES

island = lambda v: [round(v.x, 5), round(v.z, 5), round(-v.y, 5)]
rep = {
    'S': S, 'eye': EYE, 'rings': RINGS, 'startBeforeFirstS': START_BEFORE, 'endPastLastS': END_PAST, 'glide': START_FROM_END,
    'fov': [FOV_START, FOV_END], 'plate': {'px': [PLATE_PX, PLATE_PX], 'fovDeg': PLATE_FOV, 'pxPerDeg': round(PLATE_PX / PLATE_FOV, 2)},
    'cards': cards, 'cardMargin': CARD_MARGIN, 'looks': looks,
    'sun': {'elevationDeg': SUN_ELEV, 'offBehindDeg': SUN_OFF, 'toward': 'the camera\'s left', 'strength': SUN_E, 'angleDeg': 1.2,
            'blender': [round(v, 5) for v in SUN_DIR], 'island': island(SUN_DIR)},
    'sky': {'model': sky.sky_type, 'strength': SKY_K, 'lighting': SKY_LIGHT, 'knee': [KNEE, KNEE_SPAN], 'aerosol': sky.aerosol_density, 'clouds': 'camera rays only, a noise layer 1200 m up'},
    'shades': [s for s, _ in BAYS], 'samples': SAMPLES, 'scale': SCALE, 'renderSeconds': renders, 'totalSeconds': round(time.time() - t0, 1),
    'faces': sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'),
}
json.dump(rep, open(os.path.join(OUT, 'garden-report.json'), 'w'), indent=1)
print('DONE', json.dumps({k: rep[k] for k in ('renderSeconds', 'totalSeconds', 'faces')}))
