"""Render the jar's fill states with Cycles on the CPU, one Blender process for all of them.

  blender -b --factory-startup --python render.py -- --pile work/pile.json --out work/raw [--states 0,f,fy] [--full 1]

The frame is section 5's 2x jar frame (400 x 480): the jar's axis at the centre, its body 200 px across (half the
frame), the axis's floor point at 0.87 of the height, a camera 9 degrees above. Transparent film, no floor: the shadow
and the floor reflection are drawn in 2D by compose.mjs, the same for every state.

A state is a press order: f (Facebook, a quarter of blue), y (YouTube, a quarter of red), i (Instagram, a half of one
mixed lot of pink and purple grains, about 2 pink to 3 purple), bottom layer first. Every state is cut from the one pile
(pack.py): the pellets whose centres lie below the state's level, coloured by the band each falls in. Unless --full is
set, a state renders only the band its last press adds (the rows between its fill top and the prefix's seam); compose.mjs
takes everything below the seam from the prefix state and everything above the fill from the empty jar, so a lower
layer's pixels never change.

Writes <out>/<state>.png (16-bit RGBA, sRGB Standard view transform, straight alpha) and <out>/<state>.json (the band
rendered and the rows the composite needs).
"""
import sys, os, json, math, time, argparse, zlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Quaternion, Matrix
from bpy_extras.object_utils import world_to_camera_view
import jarlib as J

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--pile', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--states', default='0,f,y,i,fy,fyi,fi,fiy,yf,yfi,yi,yif,if,ify,iy,iyf', help='the single lots first (a quick check of their colours), then each prefix before its children')
ap.add_argument('--full', type=int, default=0, help='render whole frames (look tests)')
ap.add_argument('--res', default='400x480')
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--adaptive', type=float, default=0.01)
ap.add_argument('--elev', type=float, default=9.0)
ap.add_argument('--lens', type=float, default=150.0)
ap.add_argument('--pxunit', type=float, default=100.0, help='px per jar unit (the body radius) at the jar')
ap.add_argument('--floor_row', type=float, default=0.87, help="the axis's floor point, as a fraction of the height")
# the studio (see world() and the lights below)
ap.add_argument('--back', type=float, default=1.16)
ap.add_argument('--side', type=float, default=0.05)
ap.add_argument('--front', type=float, default=0.03)
ap.add_argument('--top', type=float, default=0.45)
ap.add_argument('--below', type=float, default=1.08)
ap.add_argument('--cone0', type=float, default=0.76, help='the bright backdrop starts at this cosine from straight behind')
ap.add_argument('--cone1', type=float, default=0.93)
ap.add_argument('--fill', type=float, default=0.75)
ap.add_argument('--key', type=float, default=3400.0)
ap.add_argument('--key_az', type=float, default=-28.0)
ap.add_argument('--key_el', type=float, default=55.0)
ap.add_argument('--key_size', type=float, default=6.0)
ap.add_argument('--strip', type=float, default=70.0, help='the two soft bands in the glass (receiver: the glass only)')
ap.add_argument('--strip_az', type=float, default=74.0)
ap.add_argument('--strip_w', type=float, default=3.6)
ap.add_argument('--spec', type=float, default=900.0, help='the tiny white speculars on the bead, shoulder and base')
ap.add_argument('--spec_size', type=float, default=0.25)
ap.add_argument('--spec_az', type=float, default=-22.0)
ap.add_argument('--spec_el', type=float, default=62.0)
ap.add_argument('--shadow_t', type=float, default=0.95)
ap.add_argument('--rough', type=float, default=0.5)
ap.add_argument('--pspec', type=float, default=0.15)
ap.add_argument('--glow', type=float, default=0.1)
ap.add_argument('--var', type=float, default=0.22)
ap.add_argument('--albedo', default='', help='overrides as name=r,g,b (linear) separated by ;')
ap.add_argument('--threads', type=int, default=0)
a = ap.parse_args(argv)
T0 = time.time()
os.makedirs(a.out, exist_ok=True)

PAGE = (239, 232, 223)            # the picture's ground beside the jars (#EFE8DF): what the glass shows through it
PAGE_L = J.lin3(PAGE)
# pellet albedo (linear), calibrated so the rendered medians land on the picture's lots (prep-spec): blue #056AED,
# red #E81617, pink #EC63A5, purple #8E49B0
ALBEDO = {
    'blue': (0.0001, 0.13, 0.66),
    'red': (0.59, 0.0035, 0.0035),
    'pink': (0.80, 0.082, 0.30),
    'purple': (0.138, 0.031, 0.253),
}
for kv in filter(None, a.albedo.split(';')):
    k, v = kv.split('=')
    ALBEDO[k] = tuple(float(x) for x in v.split(','))

# fill levels: fractions of the inner height (the inner floor to the lip's top), a quarter 0.235 and a half 0.47
INNER = J.JAR_TOP - J.JAR['floor_h']
QUARTER = 0.235
WORTH = {'f': 1, 'y': 1, 'i': 2}
LOT = {'f': ['blue'], 'y': ['red'], 'i': ['pink', 'purple']}


def level(quarters):
    return J.JAR['floor_h'] + quarters * QUARTER * INNER


def bands(state):
    """[(lo, hi, letter)] bottom up"""
    out, q = [], 0
    for ch in ('' if state == '0' else state):
        out.append((level(q), level(q + WORTH[ch]), ch))
        q += WORTH[ch]
    return out


J.clear_scene()
sc = bpy.context.scene
coll = sc.collection


def new_mat(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    return m


def glass_mat():
    m = new_mat('glass')
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
    p.inputs['Roughness'].default_value = 0.0
    p.inputs['IOR'].default_value = 1.5
    p.inputs['Transmission Weight'].default_value = 1.0
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    tr.inputs['Color'].default_value = (a.shadow_t, a.shadow_t, a.shadow_t, 1.0)
    lp = nt.nodes.new('ShaderNodeLightPath')
    mx = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Shadow Ray'], mx.inputs['Fac'])
    nt.links.new(p.outputs['BSDF'], mx.inputs[1])
    nt.links.new(tr.outputs['BSDF'], mx.inputs[2])
    nt.links.new(mx.outputs['Shader'], nt.nodes.get('Material Output').inputs['Surface'])
    return m


def pellet_mat():
    """one material for every pellet: its colour is the object's colour (set per state), varied per pellet in value"""
    m = new_mat('pellet')
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Roughness'].default_value = a.rough
    p.inputs['Specular IOR Level'].default_value = a.pspec
    oi = nt.nodes.new('ShaderNodeObjectInfo')
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = 1.0 - a.var * 0.6
    mr.inputs['To Max'].default_value = 1.0 + a.var * 0.4
    hsv = nt.nodes.new('ShaderNodeHueSaturation')
    nt.links.new(oi.outputs['Color'], hsv.inputs['Color'])
    nt.links.new(oi.outputs['Random'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], hsv.inputs['Value'])
    nt.links.new(hsv.outputs['Color'], p.inputs['Base Color'])
    # a little of the pellet's own colour as emission: the picture's gaps are darker saturated versions of the lot,
    # never grey or black
    nt.links.new(hsv.outputs['Color'], p.inputs['Emission Color'])
    p.inputs['Emission Strength'].default_value = a.glow
    return m


def world():
    w = bpy.data.worlds.new('studio')
    sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0])

    def bg(col, s=1.0):
        n = nt.nodes.new('ShaderNodeBackground')
        n.inputs['Color'].default_value = (*col, 1.0)
        n.inputs['Strength'].default_value = s
        return n

    def smooth(src, lo, hi):
        n = nt.nodes.new('ShaderNodeMapRange')
        n.interpolation_type = 'SMOOTHSTEP'
        n.inputs['From Min'].default_value = lo
        n.inputs['From Max'].default_value = hi
        nt.links.new(src, n.inputs['Value'])
        return n.outputs['Result']

    def mix(fac, s1, s2):
        n = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(fac, n.inputs['Fac'])
        nt.links.new(s1, n.inputs[1])
        nt.links.new(s2, n.inputs[2])
        return n.outputs['Shader']

    def neg(src):
        n = nt.nodes.new('ShaderNodeMath')
        n.operation = 'MULTIPLY'
        n.inputs[1].default_value = -1.0
        nt.links.new(src, n.inputs[0])
        return n.outputs['Value']

    # what the glass refracts and reflects: the page colour behind (brightened for the four interfaces' losses so the
    # empty glass reads as the picture's), dark sides (the silhouette's dark edge bands), a dimmer top, the table below
    # the horizon behind the jar, and a dark studio towards the camera (no grey veil over the pellets)
    P = PAGE_L
    back = bg(tuple(v * a.back for v in P))
    side = bg(tuple(v * a.side for v in P))
    front = bg(tuple(v * a.front for v in P))
    top = bg(tuple(v * a.top for v in P))
    below = bg(tuple(v * a.below for v in P))
    # the bright backdrop is a cone straight behind the jar (about 25 degrees): rays the glass bends further, near the
    # silhouette and through the bead and the base, see the dark studio, which gives the picture's dark edge bands
    backish = mix(smooth(neg(sep.outputs['Z']), 0.0, 0.12), back.outputs['Background'], below.outputs['Background'])
    m1 = mix(smooth(sep.outputs['Y'], a.cone0, a.cone1), side.outputs['Background'], backish)
    m2 = mix(smooth(sep.outputs['Z'], 0.5, 0.9), m1, top.outputs['Background'])
    m2c = mix(smooth(neg(sep.outputs['Y']), 0.2, 0.6), m2, front.outputs['Background'])
    fill = bg(P, a.fill)
    lp = nt.nodes.new('ShaderNodeLightPath')
    nt.links.new(mix(lp.outputs['Is Diffuse Ray'], m2c, fill.outputs['Background']), out.inputs['Surface'])


def area(name, az, el, dist, sx, sy, energy, th=1.8):
    L = bpy.data.lights.new(name, 'AREA')
    L.shape = 'RECTANGLE'
    L.size, L.size_y = sx, sy
    L.energy = energy
    ob = bpy.data.objects.new(name, L)
    coll.objects.link(ob)
    azr, elr = math.radians(az), math.radians(el)
    pos = Vector((dist * math.cos(elr) * math.sin(azr), -dist * math.cos(elr) * math.cos(azr), th + dist * math.sin(elr)))
    ob.location = pos
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = (Vector((0, 0, th)) - pos).to_track_quat('-Z', 'Y')
    # seen only in reflections: a ray bent through the glass never meets a lamp (white flares at the silhouette)
    ob.visible_transmission = False
    ob.visible_diffuse = name == 'key'     # the key must still light the pellets' diffuse
    ob.visible_camera = False
    return ob


# --- the scene ---------------------------------------------------------------------------------------------
world()
jar = bpy.data.objects.new('jar', J.lathe('jar', J.jar_section(), segments=160, closed=True))
coll.objects.link(jar)
jar.data.materials.append(glass_mat())
jar.visible_diffuse = False

glass_only = bpy.data.collections.new('glass_only')
glass_only.objects.link(jar)
pellets_c = bpy.data.collections.new('pellets_only')
# the key lights the pellets only and only the pellets block it (no key flare in the thick base)
key = area('key', a.key_az, a.key_el, 10.0, a.key_size, a.key_size, a.key)
key.light_linking.receiver_collection = pellets_c
key.light_linking.blocker_collection = pellets_c
# two tall soft boxes at +-74 degrees from the camera: their reflections are the two soft bands inside the body
# (the picture's -0.72R to -0.49R and +0.47R to +0.69R)
for nm, az in (('left', -a.strip_az), ('right', a.strip_az)):
    L = area(nm, az, 6, 7.0, a.strip_w, 9.0, a.strip, th=2.0)
    L.light_linking.receiver_collection = glass_only
    L.light_linking.blocker_collection = pellets_c
# one small bright lamp above and in front: tiny white speculars where the glass faces up (the bead, the shoulder,
# the base's inner corner), nothing on the straight body
sp = area('spec', a.spec_az, a.spec_el, 9.0, a.spec_size, a.spec_size, a.spec, th=2.0)
sp.light_linking.receiver_collection = glass_only
sp.light_linking.blocker_collection = pellets_c

with open(a.pile) as f:
    pile = json.load(f)
pme = J.pellet_mesh('pellet', u=24, v=12)
pme.materials.append(pellet_mat())
PEL = []
for idx, p in enumerate(pile['pellets']):
    x, y, z, qw, qx, qy, qz, sx, sy, sz = p
    ob = bpy.data.objects.new('p%05d' % idx, pme)
    coll.objects.link(ob)
    ob.matrix_world = Matrix.LocRotScale(Vector((x, y, z)), Quaternion((qw, qx, qy, qz)), Vector((sx, sy, sz)))
    pellets_c.objects.link(ob)
    ob.hide_render = True
    # the mixed lot: a fixed draw per pellet, about 2 pink to 3 purple
    pink = (zlib.crc32(b'mix%d' % idx) % 1000) < 400
    PEL.append((ob, z, pink))
print(f'BUILD {len(PEL)} pellets in {time.time() - T0:.1f}s', flush=True)

# --- camera --------------------------------------------------------------------------------------------------
W, H = (int(v) for v in a.res.split('x'))
cam_d = bpy.data.cameras.new('cam')
cam_d.sensor_fit = 'VERTICAL'
cam_d.sensor_height = 24.0
cam_d.lens = a.lens
V = H / a.pxunit
D = V * a.lens / 24.0
cam = bpy.data.objects.new('cam', cam_d)
coll.objects.link(cam)
el = math.radians(a.elev)
tgt = Vector((0, 0, 1.8))
cam.location = tgt + Vector((0, -D * math.cos(el), D * math.sin(el)))
cam.rotation_mode = 'QUATERNION'
cam.rotation_quaternion = (tgt - cam.location).to_track_quat('-Z', 'Y')
cam_d.clip_start, cam_d.clip_end = 1.0, D * 3
sc.camera = cam
r = sc.render
r.resolution_x, r.resolution_y = W, H
r.resolution_percentage = 100


def row(pt):
    """the image row (0 at the top, in px) of a world point"""
    v = world_to_camera_view(sc, cam, Vector(pt))
    return (1.0 - v.y) * H


# shift the frame so the axis's floor point sits at --floor_row
for _ in range(6):
    bpy.context.view_layer.update()
    err = row((0, 0, 0)) / H - a.floor_row
    cam_d.shift_y -= err * (H / max(W, H))
bpy.context.view_layer.update()
print(f'CAMERA floor point row {row((0, 0, 0)):.2f}, rim top on the axis {row((0, 0, J.JAR_TOP)):.2f}', flush=True)

# --- render settings -----------------------------------------------------------------------------------------
r.engine = 'CYCLES'
r.film_transparent = True
if a.threads:
    r.threads_mode, r.threads = 'FIXED', a.threads
cy = sc.cycles
cy.device = 'CPU'
cy.samples = a.samples
cy.use_adaptive_sampling = a.adaptive > 0
cy.adaptive_threshold = a.adaptive if a.adaptive > 0 else 0.01
cy.use_denoising = True
cy.denoiser = 'OPENIMAGEDENOISE'
try:
    cy.denoising_prefilter = 'ACCURATE'
    cy.denoising_quality = 'HIGH'
    cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
except Exception as e:
    print('denoise option', e)
cy.seed = 0
cy.use_animated_seed = False
cy.max_bounces = 32
cy.transmission_bounces = 32
cy.glossy_bounces = 8
cy.diffuse_bounces = 3
cy.transparent_max_bounces = 16
cy.caustics_reflective = False
cy.caustics_refractive = False
cy.blur_glossy = 1.0
cy.sample_clamp_indirect = 8.0
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.view_settings.exposure = 0.0
sc.view_settings.gamma = 1.0
im = r.image_settings
im.file_format = 'PNG'
im.color_mode = 'RGBA'
im.color_depth = '16'


def inner_r(h):
    return J.inner_radius_at(h)


CUR = {}
GRAIN = 0.085     # how far a grain reaches past its centre (a stretched, large pellet on edge against the glass)

for state in [s for s in a.states.split(',') if s]:
    t1 = time.time()
    bs = bands(state)
    total = bs[-1][1] if bs else J.JAR['floor_h']
    n = 0
    for k, (ob, z, pink) in enumerate(PEL):
        lot = None
        for lo, hi, ch in bs:
            if lo <= z < hi:
                lot = ch
                break
        # touch an object only when it changes: every write tags it for a new sync
        if lot is None:
            if not ob.hide_render:
                ob.hide_render = True
            continue
        if ob.hide_render:
            ob.hide_render = False
        name = LOT[lot][0] if len(LOT[lot]) == 1 else ('pink' if pink else 'purple')
        if CUR.get(k) != name:
            ob.color = (*ALBEDO[name], 1.0)
            CUR[k] = name
        n += 1
    # the rows this state's last press can change: from above its fill's back edge down to the prefix's seam
    top_est = row((0, inner_r(total), total + GRAIN)) if bs else H
    if len(bs) >= 2:
        lp = bs[-2][1]
        seam = row((0, -inner_r(lp), lp - GRAIN))      # below this row the prefix's grains hide everything the press adds
    else:
        seam = H
    if a.full or state == '0' or len(bs) < 2:
        y0, y1 = 0.0, float(H)
    else:
        y0, y1 = max(0.0, top_est - 26), min(float(H), seam + 14)
    r.use_border = not a.full and state != '0'
    r.use_crop_to_border = False
    r.border_min_x, r.border_max_x = (0.18, 0.82)
    r.border_min_y, r.border_max_y = 1.0 - y1 / H, 1.0 - y0 / H
    r.filepath = os.path.join(a.out, state + '.png')
    T1, C1 = time.time(), time.process_time()
    bpy.ops.render.render(write_still=True)
    T2, C2 = time.time(), time.process_time()
    meta = {'state': state, 'pellets': n, 'level': round(total, 4), 'bands': bs, 'top_est': round(top_est, 2),
            'seam': round(seam, 2), 'rows': [round(y0, 1), round(y1, 1)], 'cols': [0.18, 0.82], 'full': bool(a.full or state == '0'),
            'wall_s': round(T2 - T1, 1), 'cpu_s': round(C2 - C1, 1)}
    with open(os.path.join(a.out, state + '.json'), 'w') as f:
        json.dump(meta, f)
    print(f'RENDER {state}: {n} pellets, rows {y0:.0f}-{y1:.0f}, {a.samples} spp, {T2 - T1:.1f}s wall, {C2 - C1:.1f}s CPU, '
          f'state total {time.time() - t1:.1f}s', flush=True)
print(f'ALL DONE {time.time() - T0:.1f}s', flush=True)
