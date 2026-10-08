# The moon world for the Skreed hero, in two parts for the web:
#   sky  : an equirectangular sky dome (stars, a bright coloured Milky Way rising from the horizon, small planets)
#   bake : the lunar ground and stones as real geometry, with Cycles lighting baked in (texture for the ground,
#          vertex colours for the stones), exported as one Draco-compressed glTF
# Blender X = three x, Blender Y = -three z, Blender Z = three y.
import bpy, numpy as np, math, sys, os
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import terrain as T

MODE = sys.argv[1]; OUTDIR = sys.argv[2]
MW_GAIN = float(os.environ.get('MW_GAIN', '0.14'))
SAMPLES = int(sys.argv[3]) if len(sys.argv) > 3 else 16
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES
sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 0.0

KEY = dict(el=12, rot=-70, e=4.0, c=(1.0, 1.0, 1.0)); FILL = dict(el=30, rot=150, e=0.12, c=(1.0, 1.0, 1.0))
def lamp(name, spec, angle=1.0):
    ld = bpy.data.lights.new(name, 'SUN'); ld.energy = spec['e']; ld.color = spec['c']; ld.angle = math.radians(angle)
    lo = bpy.data.objects.new(name, ld); sc.collection.objects.link(lo); lo.rotation_mode = 'QUATERNION'
    e_, r_ = math.radians(spec['el']), math.radians(spec['rot'])
    d_ = (math.sin(r_) * math.cos(e_), math.cos(r_) * math.cos(e_), math.sin(e_))
    lo.rotation_quaternion = Vector((-d_[0], -d_[1], -d_[2])).to_track_quat('-Z', 'Y')
    return lo
lamp('key', KEY); lamp('fill', FILL, 8)
def dirv(lon, lat):
    lo, la = math.radians(lon), math.radians(lat)
    return Vector((math.sin(lo) * math.cos(la), math.cos(lo) * math.cos(la), math.sin(la)))

# ---------------------------------------------------------------- sky
def build_sky():
    wd = bpy.data.worlds.new('sky'); sc.world = wd; wd.use_nodes = True
    N_ = wd.node_tree.nodes; L_ = wd.node_tree.links
    bgn = N_['Background']; bgn.inputs['Strength'].default_value = 1.0
    tc = N_.new('ShaderNodeTexCoord'); D = tc.outputs['Generated']           # world: view direction
    def node(t, **kw):
        n = N_.new(t)
        for k, v in kw.items(): setattr(n, k, v)
        return n
    def math_(op, a, b=None, v=None):
        n = node('ShaderNodeMath', operation=op)
        (L_.new(a, n.inputs[0]) if not isinstance(a, (int, float)) else n.inputs[0].__setattr__('default_value', a))
        if b is not None: (L_.new(b, n.inputs[1]) if not isinstance(b, (int, float)) else n.inputs[1].__setattr__('default_value', b))
        return n.outputs[0]
    def mix(op, a, b):
        n = node('ShaderNodeMix', data_type='RGBA', blend_type=op); n.inputs['Factor'].default_value = 1.0
        for sock, val in ((6, a), (7, b)):
            if isinstance(val, tuple): n.inputs[sock].default_value = val
            else: L_.new(val, n.inputs[sock])
        return n.outputs[2]
    def stars(scale, size, power, gain, temp=True):
        v = node('ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value = scale; L_.new(D, v.inputs['Vector'])
        m = node('ShaderNodeMapRange'); m.inputs['From Min'].default_value = 0.0; m.inputs['From Max'].default_value = size
        m.inputs['To Min'].default_value = 1.0; m.inputs['To Max'].default_value = 0.0; L_.new(v.outputs['Distance'], m.inputs['Value'])
        p = math_('POWER', m.outputs['Result'], power)
        sep = node('ShaderNodeSeparateColor'); L_.new(v.outputs['Color'], sep.inputs[0])
        b = math_('POWER', sep.outputs[0], 3.0)                               # most stars faint, a few bright
        a = math_('MULTIPLY', math_('MULTIPLY', p, b), gain)
        if not temp: return mix('MULTIPLY', (1, 1, 1, 1), a)
        cr = node('ShaderNodeValToRGB'); L_.new(sep.outputs[1], cr.inputs['Fac'])  # star temperature
        E = cr.color_ramp.elements
        E[0].position, E[0].color = 0.0, (0.62, 0.74, 1.0, 1); E[1].position, E[1].color = 1.0, (1.0, 0.72, 0.48, 1)
        for p_, c_ in [(0.35, (0.9, 0.94, 1.0)), (0.6, (1.0, 0.97, 0.9)), (0.82, (1.0, 0.86, 0.66))]: e = E.new(p_); e.color = (*c_, 1)
        return mix('MULTIPLY', cr.outputs['Color'], a)
    # the Milky Way: a great circle from the horizon (right of centre) climbing up and to the left
    A = dirv(14, 0); B = dirv(-40, 62); n = A.cross(B).normalized()
    dot = node('ShaderNodeVectorMath', operation='DOT_PRODUCT'); dot.inputs[1].default_value = n; L_.new(D, dot.inputs[0])
    band = math_('EXPONENT', math_('MULTIPLY', math_('MULTIPLY', dot.outputs['Value'], dot.outputs['Value']), -38.0))
    core_d = node('ShaderNodeVectorMath', operation='DOT_PRODUCT'); core_d.inputs[1].default_value = dirv(10, 6); L_.new(D, core_d.inputs[0])
    core = math_('MULTIPLY', math_('POWER', math_('MAXIMUM', core_d.outputs['Value'], 0.0), 9.0), math_('POWER', band, 2.5))   # the bright core: a swelling of the band at the horizon
    cloud = node('ShaderNodeTexNoise'); cloud.inputs['Scale'].default_value = 8.0; cloud.inputs['Detail'].default_value = 14; cloud.inputs['Roughness'].default_value = 0.66; L_.new(D, cloud.inputs['Vector'])
    fine = node('ShaderNodeTexNoise'); fine.inputs['Scale'].default_value = 45.0; fine.inputs['Detail'].default_value = 10; L_.new(D, fine.inputs['Vector'])
    dust = node('ShaderNodeTexNoise'); dust.inputs['Scale'].default_value = 9.0; dust.inputs['Detail'].default_value = 12; dust.inputs['Roughness'].default_value = 0.7; L_.new(D, dust.inputs['Vector'])
    cc = node('ShaderNodeMapRange'); cc.inputs['From Min'].default_value = 0.38; cc.inputs['From Max'].default_value = 0.78; L_.new(cloud.outputs['Fac'], cc.inputs['Value'])
    ff = node('ShaderNodeMapRange'); ff.inputs['From Min'].default_value = 0.3; ff.inputs['From Max'].default_value = 0.75; ff.inputs['To Min'].default_value = 0.55; ff.inputs['To Max'].default_value = 1.3; L_.new(fine.outputs['Fac'], ff.inputs['Value'])
    dl = node('ShaderNodeMapRange'); dl.inputs['From Min'].default_value = 0.46; dl.inputs['From Max'].default_value = 0.6; dl.inputs['To Min'].default_value = 1.0; dl.inputs['To Max'].default_value = 0.05; L_.new(dust.outputs['Fac'], dl.inputs['Value'])
    glow = math_('MULTIPLY', math_('MULTIPLY', math_('MULTIPLY', band, cc.outputs['Result']), ff.outputs['Result']), dl.outputs['Result'])
    glow = math_('ADD', glow, math_('MULTIPLY', math_('MULTIPLY', core, 0.35), math_('MULTIPLY', ff.outputs['Result'], dl.outputs['Result'])))
    glow = math_('MULTIPLY', glow, MW_GAIN)        # subtle: the band sits well below the logo's brightness
    hue = node('ShaderNodeTexNoise'); hue.inputs['Scale'].default_value = 1.8; hue.inputs['Detail'].default_value = 4; L_.new(D, hue.inputs['Vector'])
    hb = math_('ADD', math_('MULTIPLY', hue.outputs['Fac'], 0.6), math_('MULTIPLY', core, 0.8))
    cr = node('ShaderNodeValToRGB'); L_.new(hb, cr.inputs['Fac'])
    E = cr.color_ramp.elements
    E[0].position, E[0].color = 0.15, (0.28, 0.40, 1.0, 1); E[1].position, E[1].color = 1.0, (1.0, 0.93, 0.80, 1)
    for p_, c_ in [(0.3, (0.52, 0.36, 1.0)), (0.45, (0.95, 0.40, 0.78)), (0.62, (1.0, 0.62, 0.42)), (0.8, (1.0, 0.82, 0.55))]: e = E.new(p_); e.color = (*c_, 1)
    mw = mix('MULTIPLY', cr.outputs['Color'], glow)
    # many faint stars inside the band, sparser outside
    dense = stars(1100.0, 0.45, 5.0, 1.1)
    dense = mix('MULTIPLY', dense, math_('ADD', math_('MULTIPLY', band, 3.0), 0.25))
    sky = mix('ADD', mw, dense)
    sky = mix('ADD', sky, stars(380.0, 0.22, 5.0, 2.6))
    sky = mix('ADD', sky, stars(95.0, 0.11, 5.0, 9.0))                        # a few brighter ones, kept under the bloom threshold
    L_.new(sky, bgn.inputs['Color'])

def planet(lon, lat, ang, col, seed, ring=False):
    dist = 3000; r = dist * math.tan(math.radians(ang) / 2)
    loc = dirv(lon, lat) * dist + Vector((0, -19.25, 0))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=r, location=loc); pl = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new('pl%d' % seed); m.use_nodes = True; N_ = m.node_tree.nodes; L_ = m.node_tree.links
    b = N_['Principled BSDF']; b.inputs['Roughness'].default_value = 1.0
    w = N_.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'Z'; w.inputs['Scale'].default_value = 1.1 + seed * 0.3; w.inputs['Distortion'].default_value = 5 + seed; w.inputs['Detail'].default_value = 6
    nz = N_.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3 + seed; nz.inputs['Detail'].default_value = 8
    mx = N_.new('ShaderNodeMix'); mx.data_type = 'FLOAT'; mx.inputs['Factor'].default_value = 0.5; L_.new(w.outputs['Fac'], mx.inputs[2]); L_.new(nz.outputs['Fac'], mx.inputs[3])
    cr = N_.new('ShaderNodeValToRGB'); L_.new(mx.outputs[0], cr.inputs['Fac'])
    cr.color_ramp.elements[0].color = (col[0] * 0.45, col[1] * 0.45, col[2] * 0.45, 1); cr.color_ramp.elements[1].color = (*col, 1)
    L_.new(cr.outputs['Color'], b.inputs['Base Color']); L_.new(cr.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 0.03
    pl.data.materials.append(m); pl.rotation_euler = (math.radians(15 + seed * 9), math.radians(-10 * seed), 0)
    if ring:
        bpy.ops.mesh.primitive_circle_add(vertices=256, radius=r * 2.2, fill_type='NGON', location=loc); rg = bpy.context.active_object
        rg.rotation_euler = (math.radians(76), math.radians(-18), 0)
        rm = bpy.data.materials.new('ring%d' % seed); rm.use_nodes = True; rn = rm.node_tree.nodes; rk = rm.node_tree.links
        out = rn['Material Output']; rb = rn['Principled BSDF']; rb.inputs['Base Color'].default_value = (*[c * 0.9 for c in col], 1)
        tco = rn.new('ShaderNodeTexCoord'); ln_ = rn.new('ShaderNodeVectorMath'); ln_.operation = 'LENGTH'; rk.new(tco.outputs['Object'], ln_.inputs[0])
        dv = rn.new('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[1].default_value = r * 2.2; rk.new(ln_.outputs['Value'], dv.inputs[0])
        rr = rn.new('ShaderNodeValToRGB'); rk.new(dv.outputs[0], rr.inputs['Fac']); E = rr.color_ramp.elements
        E[0].position, E[0].color = 0, (0, 0, 0, 1); E[1].position, E[1].color = 1, (0, 0, 0, 1)
        for p_, a_ in [(0.6, 0), (0.64, 0.6), (0.78, 0.35), (0.8, 0.05), (0.84, 0.5), (0.97, 0.2), (0.99, 0)]: e = E.new(p_); e.color = (a_, a_, a_, 1)
        ms = rn.new('ShaderNodeMixShader'); tr = rn.new('ShaderNodeBsdfTransparent')
        rk.new(rr.outputs['Color'], ms.inputs['Fac']); rk.new(tr.outputs[0], ms.inputs[1]); rk.new(rb.outputs[0], ms.inputs[2]); rk.new(ms.outputs[0], out.inputs['Surface'])
        rg.data.materials.append(rm)

if MODE == 'sky':
    build_sky()
    # three small worlds, muted, lit by the same hard white light (phases)
    planet(-27, 13, 3.4, (0.62, 0.36, 0.24), 1)              # rust
    planet(34, 17, 2.0, (0.40, 0.55, 0.60), 2)               # slate teal
    planet(-12, 22, 1.4, (0.85, 0.80, 0.70), 3, ring=True)    # pale, ringed
    cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0, -19.25, 0); cam.rotation_euler = (math.radians(90), 0, 0); cd.type = 'PANO'; cd.clip_end = 10000
    cd.panorama_type = 'EQUIRECTANGULAR'
    cd.longitude_min, cd.longitude_max = math.radians(-70), math.radians(70)
    cd.latitude_min, cd.latitude_max = math.radians(-10), math.radians(60)
    W = int(sys.argv[4]) if len(sys.argv) > 4 else 4200
    sc.render.resolution_x = W; sc.render.resolution_y = W // 2; sc.render.resolution_percentage = 100
    sc.cycles.use_denoising = False; sc.render.filter_size = 1.2
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = os.path.join(OUTDIR, 'sky.png')
    bpy.ops.render.render(write_still=True); print('sky done')
    sys.exit(0)

# ---------------------------------------------------------------- ground (bake mode)
h = np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'h_spires.npy')).astype(np.float64)
N = 512; h = h[::h.shape[0] // N, ::h.shape[1] // N][:N, :N]
SIZE = 420.0; X0, Y0 = -SIZE / 2, -40.0
xs = np.linspace(X0, X0 + SIZE, N); ys = np.linspace(Y0 + SIZE, Y0, N); gx, gy = np.meshgrid(xs, ys)
roll = T.fbm(512, 2, 4, 401); roll = (roll - roll.min()) / (roll.max() - roll.min())
far_ = np.clip((gy - 40) / 260, 0, 1); side = np.clip((np.abs(gx) - 25) / 140, 0, 1) ** 1.4
G_ = -4.35 + roll * (1.5 + 9 * far_ ** 1.3) + side * 10 * (0.5 + roll) + h * 1.5 * far_      # gentle valleys, no craters

NP = 1024
def ground_grid(nr, nc):
    tt = np.linspace(1, 0, nr)[:, None]; uu = np.linspace(-1, 1, nc)[None, :]
    PYr = -30 + 450 * tt ** 2.2
    PX = uu * (34 + 1.25 * (PYr + 30)); PY = np.repeat(PYr, nc, 1)
    return PX, PY
PX, PY = ground_grid(NP, NP)
fx = np.clip((PX - X0) / SIZE * (N - 1), 0, N - 1.001); fy = np.clip((Y0 + SIZE - PY) / SIZE * (N - 1), 0, N - 1.001)
x0_ = np.floor(fx).astype(int); y0_ = np.floor(fy).astype(int); ax_ = fx - x0_; ay_ = fy - y0_
base_h = (G_[y0_, x0_] * (1 - ax_) + G_[y0_, x0_ + 1] * ax_) * (1 - ay_) + (G_[y0_ + 1, x0_] * (1 - ax_) + G_[y0_ + 1, x0_ + 1] * ax_) * ay_
drift = T.fbm(NP, 4, 5, 303); lumps = T.fbm(NP, 32, 4, 307); grit = T.fbm(NP, 256, 2, 308)
cover = T.fbm(NP, 8, 7, 304); cover = (cover - cover.min()) / (cover.max() - cover.min())
rockmask = np.clip((cover - 0.66) / 0.04, 0, 1); rk = np.abs(T.fbm(NP, 64, 4, 305)) * 2
rockmask *= np.clip((np.hypot(PX / 1.4, (PY - 18) / 1.0) - 8) / 10, 0, 1)
hgt = base_h + (drift * 0.8 + lumps * 0.18 + grit * 0.035) * np.clip(1 - (PY - 60) / 300, 0.3, 1) + rockmask * (0.2 + rk * 0.8)
np.save(os.path.join(OUTDIR, 'moon_hgt.npy'), hgt.astype(np.float32))

def grid_mesh(name, PX, PY, Z, uvs=True):
    nr, nc = Z.shape
    V = np.stack([PX.ravel(), PY.ravel(), Z.ravel()], 1)
    I = np.arange(nr * nc).reshape(nr, nc)
    Q = np.stack([I[:-1, :-1].ravel(), I[1:, :-1].ravel(), I[1:, 1:].ravel(), I[:-1, 1:].ravel()], 1)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(V)); me.vertices.foreach_set('co', V.ravel().astype(np.float32))
    me.loops.add(Q.size); me.loops.foreach_set('vertex_index', Q.ravel().astype(np.int32))
    me.polygons.add(len(Q)); me.polygons.foreach_set('loop_start', (np.arange(len(Q)) * 4).astype(np.int32))
    me.update(calc_edges=True); me.validate()
    me.polygons.foreach_set('use_smooth', np.ones(len(Q), dtype=bool))
    if uvs:
        uv = me.uv_layers.new(name='UVMap')
        U = (np.arange(nc) / (nc - 1))[None, :].repeat(nr, 0); Vv = (1 - np.arange(nr) / (nr - 1))[:, None].repeat(nc, 1)
        per_vert = np.stack([U.ravel(), Vv.ravel()], 1)
        uv.data.foreach_set('uv', per_vert[Q.ravel()].ravel().astype(np.float32))
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob

ground = grid_mesh('ground', PX, PY, hgt)
at = ground.data.attributes.new('rock', 'FLOAT', 'POINT'); at.data.foreach_set('value', rockmask.ravel().astype(np.float32))

# regolith material (same look as the renders)
sm = bpy.data.materials.new('regolith'); sm.use_nodes = True; sn = sm.node_tree.nodes; sk = sm.node_tree.links
sb = sn['Principled BSDF']; sb.inputs['Roughness'].default_value = 1.0
atn = sn.new('ShaderNodeAttribute'); atn.attribute_name = 'rock'
gm = sn.new('ShaderNodeNewGeometry'); gs = sn.new('ShaderNodeSeparateXYZ'); sk.new(gm.outputs['Normal'], gs.inputs[0])
sl = sn.new('ShaderNodeMapRange'); sl.inputs['From Min'].default_value = 0.93; sl.inputs['From Max'].default_value = 0.70; sk.new(gs.outputs['Z'], sl.inputs['Value'])
mx = sn.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; sk.new(atn.outputs['Fac'], mx.inputs[0]); sk.new(sl.outputs['Result'], mx.inputs[1])
nz = sn.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 10
th_ = sn.new('ShaderNodeMapRange'); th_.inputs['From Min'].default_value = 0.35; th_.inputs['From Max'].default_value = 0.65; sk.new(nz.outputs['Fac'], th_.inputs['Value'])
mu = sn.new('ShaderNodeMath'); mu.operation = 'MULTIPLY'; sk.new(mx.outputs[0], mu.inputs[0]); sk.new(th_.outputs['Result'], mu.inputs[1])
ad = sn.new('ShaderNodeMath'); ad.operation = 'ADD'; sk.new(mu.outputs[0], ad.inputs[0]); sk.new(atn.outputs['Fac'], ad.inputs[1])
cl = sn.new('ShaderNodeClamp'); sk.new(ad.outputs[0], cl.inputs['Value'])
cm = sn.new('ShaderNodeMix'); cm.data_type = 'RGBA'; sk.new(cl.outputs[0], cm.inputs['Factor'])
cm.inputs[6].default_value = (0.20, 0.20, 0.205, 1); cm.inputs[7].default_value = (0.07, 0.07, 0.072, 1)
tone = sn.new('ShaderNodeTexNoise'); tone.inputs['Scale'].default_value = 0.6; tone.inputs['Detail'].default_value = 8
tr_ = sn.new('ShaderNodeMapRange'); tr_.inputs['To Min'].default_value = 0.7; tr_.inputs['To Max'].default_value = 1.25; sk.new(tone.outputs['Fac'], tr_.inputs['Value'])
tm = sn.new('ShaderNodeMix'); tm.data_type = 'RGBA'; tm.blend_type = 'MULTIPLY'; tm.inputs['Factor'].default_value = 1.0
sk.new(cm.outputs[2], tm.inputs[6]); sk.new(tr_.outputs['Result'], tm.inputs[7]); sk.new(tm.outputs[2], sb.inputs['Base Color'])
gr = sn.new('ShaderNodeTexNoise'); gr.inputs['Scale'].default_value = 140.0; gr.inputs['Detail'].default_value = 6; gr.inputs['Roughness'].default_value = 0.75
gr2 = sn.new('ShaderNodeTexVoronoi'); gr2.inputs['Scale'].default_value = 26.0
ad2 = sn.new('ShaderNodeMath'); ad2.operation = 'ADD'; sk.new(gr.outputs['Fac'], ad2.inputs[0]); sk.new(gr2.outputs['Distance'], ad2.inputs[1])
bp = sn.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 1.0; bp.inputs['Distance'].default_value = 0.03
sk.new(ad2.outputs[0], bp.inputs['Height']); sk.new(bp.outputs['Normal'], sb.inputs['Normal'])
ground.data.materials.append(sm)

# stones: low-poly faceted rocks, half buried, joined into one mesh
rng = np.random.default_rng(21)
bases = []
for k in range(6):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2 if k < 3 else 1, radius=1.0, location=(0, 0, -900 - k * 5)); bo = bpy.context.active_object
    tv = bpy.data.textures.new('st%d' % k, 'VORONOI'); tv.noise_scale = 0.6 + (k % 3) * 0.2
    dm = bo.modifiers.new('d', 'DISPLACE'); dm.texture = tv; dm.strength = 0.5
    bpy.ops.object.modifier_apply(modifier='d'); bo.data.materials.append(sm)
    for p in bo.data.polygons: p.use_smooth = False
    bases.append(bo)
def ground_at(x, y):
    t_ = ((y + 30) / 450) ** (1 / 2.2); r_ = int(round((1 - t_) * (NP - 1)))
    w_ = 34 + 1.25 * (y + 30); c_ = int(round((x / w_ + 1) / 2 * (NP - 1)))
    if 0 <= r_ < NP and 0 <= c_ < NP: return hgt[r_, c_]
    return None
stones = []
for _ in range(1900):
    y = -12 + rng.random() ** 2.0 * 110; x = (rng.random() - 0.5) * 2 * (20 + 1.1 * (y + 30))
    if abs(x) < 3 and 8 < y < 28: continue
    z = ground_at(x, y)
    if z is None: continue
    s = 0.04 + rng.random() ** 5 * 0.9
    bi = len(stones) % 3 + (0 if s > 0.22 else 3)          # big stones keep more facets
    o = bases[bi].copy(); o.data = bases[bi].data.copy(); sc.collection.objects.link(o)
    o.location = (x, y, z - s * 0.35); o.scale = (s * (0.7 + rng.random() * 0.6), s * (0.7 + rng.random() * 0.6), s * (0.45 + rng.random() * 0.35))
    o.rotation_euler = (rng.random() * 0.5, rng.random() * 0.5, rng.random() * 6.28); stones.append(o)
for b in bases: bpy.data.objects.remove(b)
bpy.ops.object.select_all(action='DESELECT')
for o in stones: o.select_set(True)
bpy.context.view_layer.objects.active = stones[0]
bpy.ops.object.join(); st = bpy.context.active_object; st.name = 'stones'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print('stones verts', len(st.data.vertices))

# world: black, a whisper of ambient so shadows keep a little form
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True
wd.node_tree.nodes['Background'].inputs['Color'].default_value = (0.012, 0.012, 0.014, 1)

# ---- bake the ground texture (lighting + shadows from the stones + bump detail)
TEX = int(sys.argv[4]) if len(sys.argv) > 4 else 4096
img = bpy.data.images.new('ground_bake', TEX, TEX, alpha=False)
tn = sn.new('ShaderNodeTexImage'); tn.image = img; sn.active = tn
bpy.ops.object.select_all(action='DESELECT'); ground.select_set(True); bpy.context.view_layer.objects.active = ground
sc.cycles.bake_type = 'COMBINED'
sc.render.bake.margin = 4
bpy.ops.object.bake(type='COMBINED')
img.filepath_raw = os.path.join(OUTDIR, 'ground_bake.png'); img.file_format = 'PNG'; img.save()
print('ground baked')
sn.remove(tn)

# ---- bake the stones to vertex colours
ca = st.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT'); st.data.color_attributes.active_color = ca
st.data.attributes.active_color = ca
bpy.ops.object.select_all(action='DESELECT'); st.select_set(True); bpy.context.view_layer.objects.active = st
sc.render.bake.target = 'VERTEX_COLORS'
bpy.ops.object.bake(type='COMBINED')
print('stones baked')

# ---- export: a light ground grid (same UV mapping) + the stones, Draco-compressed
NR, NC = 400, 320
gPX, gPY = ground_grid(NR, NC)
ri = np.linspace(0, NP - 1, NR); ci = np.linspace(0, NP - 1, NC)
r0 = np.floor(ri).astype(int); c0 = np.floor(ci).astype(int); r1 = np.minimum(r0 + 1, NP - 1); c1 = np.minimum(c0 + 1, NP - 1)
fr = (ri - r0)[:, None]; fc = (ci - c0)[None, :]
Z = (hgt[r0][:, c0] * (1 - fc) + hgt[r0][:, c1] * fc) * (1 - fr) + (hgt[r1][:, c0] * (1 - fc) + hgt[r1][:, c1] * fc) * fr
low = grid_mesh('ground_web', gPX, gPY, Z)
# plain arrays in three.js axes (x, z, -y): ground heights as uint16, stones as int16 positions, sRGB uint8 colours, uint16/32 indices
import json
zmin, zmax = float(Z.min()), float(Z.max())
np.round((Z - zmin) / (zmax - zmin) * 65535).astype('<u2').tofile(os.path.join(OUTDIR, 'ground_h.bin'))
me_ = st.data
co = np.zeros(len(me_.vertices) * 3, np.float32); me_.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
p3 = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)
lo_, hi_ = p3.min(0), p3.max(0)
np.round((p3 - lo_) / (hi_ - lo_) * 65535 - 32768).astype('<i2').tofile(os.path.join(OUTDIR, 'stones_p.bin'))
cl_ = np.zeros(len(me_.vertices) * 4, np.float32); ca.data.foreach_get('color', cl_); cl_ = cl_.reshape(-1, 4)[:, :3]
srgb = np.where(cl_ <= 0.0031308, cl_ * 12.92, 1.055 * np.power(np.clip(cl_, 0, None), 1 / 2.4) - 0.055)
np.round(np.clip(srgb, 0, 1) * 255).astype(np.uint8).tofile(os.path.join(OUTDIR, 'stones_c.bin'))
me_.calc_loop_triangles()
tri = np.zeros(len(me_.loop_triangles) * 3, np.int32); me_.loop_triangles.foreach_get('vertices', tri)
tri = tri.reshape(-1, 3)                                     # (x, z, -y) is a rotation, winding is unchanged
idx_t = '<u2' if len(me_.vertices) < 65536 else '<u4'
tri.astype(idx_t).tofile(os.path.join(OUTDIR, 'stones_i.bin'))
json.dump({'ground': {'nr': int(Z.shape[0]), 'nc': int(Z.shape[1]), 'zmin': zmin, 'zmax': zmax},
           'stones': {'verts': int(len(me_.vertices)), 'tris': int(len(tri)), 'idx': 'u16' if idx_t == '<u2' else 'u32',
                      'lo': [float(v) for v in lo_], 'hi': [float(v) for v in hi_]}},
          open(os.path.join(OUTDIR, 'moon_meta.json'), 'w'))
print('exported', len(me_.vertices), 'stone verts', len(tri), 'tris')
