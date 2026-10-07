# Blender (bpy) scene: eroded terrain + physical sky + haze + a planet, rendered as an equirectangular plate
# from the hero camera position. Coordinates: Blender X = three x, Blender Y = -three z, Blender Z = three y.
import bpy, numpy as np, math, sys, os
kind = sys.argv[1]; W = int(sys.argv[2]); H = int(sys.argv[3]); SAMPLES = int(sys.argv[4]); OUT = sys.argv[5]
CFG = {
  'canyon': dict(exposure=0.2, bg=1.0, stars=0.6, key=dict(el=9, rot=-75, e=3.6, c=(1.0, 0.6, 0.4)), fill=dict(el=30, rot=120, e=0.25, c=(0.55, 0.65, 1.0)), hmax=80, sun_el=-5, sun_rot=-8, air=1.0, aerosol=2.0, ozone=1.0, fog=0.0018, fogc=(0.85, 0.62, 0.48),
                 rock=[(0.0, (0.20, 0.07, 0.035)), (0.35, (0.36, 0.13, 0.06)), (0.55, (0.52, 0.25, 0.12)), (0.75, (0.30, 0.10, 0.05)), (1.0, (0.58, 0.36, 0.22))],
                 sand=(0.55, 0.30, 0.16), planet=dict(dir=(0.2532, 0.9448, 0.2079), r=62, dist=900, col=(0.80, 0.70, 0.62), ring=True)),
  'spires': dict(exposure=0.4, bg=0.6, airless=True, stars=1.0, key=dict(el=12, rot=-70, e=4.0, c=(1.0, 1.0, 1.0)), fill=dict(el=30, rot=150, e=0.12, c=(1.0, 1.0, 1.0)), noplanet=True, monolith=True, hmax=70, sun_el=-9, sun_rot=12, air=1.0, aerosol=1.0, ozone=2.0, fog=0.003, fogc=(0.62, 0.70, 0.82),
                 rock=[(0.0, (0.035, 0.035, 0.038)), (0.5, (0.07, 0.07, 0.075)), (1.0, (0.12, 0.12, 0.125))],
                 sand=(0.78, 0.78, 0.80), snow=True, planet=dict(dir=(-0.2375, 0.9525, 0.1908), r=80, dist=900, col=(0.80, 0.84, 0.92), ring=False)),
  'dunes': dict(exposure=0.0, bg=1.0, stars=0.5, key=dict(el=5, rot=-48, e=4.0, c=(1.0, 0.55, 0.32)), fill=dict(el=35, rot=110, e=0.2, c=(0.55, 0.62, 1.0)), hmax=45, sun_el=-4.5, sun_rot=-45, air=0.9, aerosol=1.5, ozone=1.0, fog=0.0015, fogc=(0.95, 0.80, 0.62),
                 rock=[(0.0, (0.28, 0.17, 0.10)), (0.6, (0.42, 0.28, 0.17)), (1.0, (0.62, 0.48, 0.34))],
                 sand=(0.80, 0.58, 0.38), planet=dict(dir=(0.2686, 0.9366, 0.2250), r=50, dist=900, col=(0.90, 0.86, 0.80), ring=True), twin=True),
}[kind]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception as e: print('denoiser', e)
sc.cycles.max_bounces = 4; sc.cycles.volume_bounces = 0
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'None'

# terrain mesh from the eroded heightmap
h = np.load(f'h_{kind}.npy').astype(np.float64)
N = 512; h = h[::h.shape[0] // N, ::h.shape[1] // N][:N, :N]
SIZE = 420.0; X0, Y0 = -SIZE / 2, -40.0           # near edge 40 units in front of the logo
GROUND = -5.6
xs = np.linspace(X0, X0 + SIZE, N); ys = np.linspace(Y0 + SIZE, Y0, N)   # row 0 is the far edge
gx, gy = np.meshgrid(xs, ys)
# a valley floor around the viewpoint; the land rises with distance and to the sides
dd = np.sqrt((gx / 1.6) ** 2 + (np.maximum(gy - 10, 0)) ** 2 + np.minimum(gy - 10, 0) ** 2 * 4)
mask = np.clip((dd - 30) / 120, 0, 1); mask = mask * mask * (3 - 2 * mask)
gz = GROUND - 1.5 + h * CFG['hmax'] * (0.16 + 0.84 * mask)
if CFG.get('monolith'):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import terrain as T0
    roll = T0.fbm(512, 2, 4, 401); roll = (roll - roll.min()) / (roll.max() - roll.min())
    far_ = np.clip((gy - 40) / 260, 0, 1)
    side = np.clip((np.abs(gx) - 25) / 140, 0, 1) ** 1.4
    gz = -4.35 + roll * (1.5 + 9 * far_ ** 1.3) + side * 10 * (0.5 + roll) + h * 1.5 * far_   # a wide valley: soft hills rising on both sides and towards the horizon
    gz_open = gz.copy()
verts = np.stack([gx.ravel(), gy.ravel(), gz.ravel()], 1)
ii = np.arange(N * N).reshape(N, N)
quads = np.stack([ii[:-1, :-1].ravel(), ii[1:, :-1].ravel(), ii[1:, 1:].ravel(), ii[:-1, 1:].ravel()], 1)
me = bpy.data.meshes.new('terrain')
me.vertices.add(len(verts)); me.vertices.foreach_set('co', verts.ravel().astype(np.float32))
me.loops.add(quads.size); me.loops.foreach_set('vertex_index', quads.ravel().astype(np.int32))
me.polygons.add(len(quads)); me.polygons.foreach_set('loop_start', (np.arange(len(quads)) * 4).astype(np.int32))
me.update(calc_edges=True); me.validate()
me.polygons.foreach_set('use_smooth', np.ones(len(quads), dtype=bool))
ob = bpy.data.objects.new('terrain', me); sc.collection.objects.link(ob)
# foreground undulation: low dunes and swales so the valley floor is never a flat plane
tx = bpy.data.textures.new('und', 'CLOUDS'); tx.noise_scale = 9.0; tx.noise_depth = 3
md = ob.modifiers.new('und', 'DISPLACE'); md.texture = tx; md.strength = 0.6 if CFG.get('monolith') else 2.2; md.mid_level = 0.5; md.direction = 'Z'; md.texture_coords = 'GLOBAL'

# terrain material: strata by height, sand on the flats, rock on the slopes, two scales of bump
m = bpy.data.materials.new('ground'); m.use_nodes = True; nt = m.node_tree; nd = nt.nodes; ln = nt.links
bsdf = nd['Principled BSDF']; bsdf.inputs['Roughness'].default_value = 0.95
geo = nd.new('ShaderNodeNewGeometry'); sep = nd.new('ShaderNodeSeparateXYZ'); ln.new(geo.outputs['Position'], sep.inputs[0])
noise = nd.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 0.08; noise.inputs['Detail'].default_value = 6
mr = nd.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = GROUND - 1.5; mr.inputs['From Max'].default_value = GROUND - 1.5 + CFG['hmax'] * 0.8
add = nd.new('ShaderNodeMath'); add.operation = 'ADD'
mul = nd.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.12
ln.new(sep.outputs['Z'], mr.inputs['Value']); ln.new(noise.outputs['Fac'], mul.inputs[0]); ln.new(mr.outputs['Result'], add.inputs[0]); ln.new(mul.outputs[0], add.inputs[1])
ramp = nd.new('ShaderNodeValToRGB'); ln.new(add.outputs[0], ramp.inputs['Fac'])
els = ramp.color_ramp.elements
for i, (p, c) in enumerate(CFG['rock']):
    e = els[i] if i < len(els) else els.new(p); e.position = p; e.color = (*c, 1)
# slope mask from the normal: flat ground takes sand (or snow)
nsep = nd.new('ShaderNodeSeparateXYZ'); ln.new(geo.outputs['Normal'], nsep.inputs[0])
sm = nd.new('ShaderNodeMapRange'); sm.inputs['From Min'].default_value = 0.80; sm.inputs['From Max'].default_value = 0.93; ln.new(nsep.outputs['Z'], sm.inputs['Value'])
mix = nd.new('ShaderNodeMix'); mix.data_type = 'RGBA'
ln.new(sm.outputs['Result'], mix.inputs['Factor']); ln.new(ramp.outputs['Color'], mix.inputs[6]); mix.inputs[7].default_value = (*CFG['sand'], 1)
ln.new(mix.outputs[2], bsdf.inputs['Base Color'])
b1 = nd.new('ShaderNodeTexNoise'); b1.inputs['Scale'].default_value = 1.6; b1.inputs['Detail'].default_value = 8
bump = nd.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.5; bump.inputs['Distance'].default_value = 0.25
# wind ripples on the flats, rock grain on the slopes
rip = nd.new('ShaderNodeTexWave'); rip.inputs['Scale'].default_value = 0.9; rip.inputs['Distortion'].default_value = 4.0; rip.inputs['Detail'].default_value = 3
rip.inputs['Detail Scale'].default_value = 1.5
mixb = nd.new('ShaderNodeMix'); mixb.data_type = 'FLOAT'
ln.new(sm.outputs['Result'], mixb.inputs['Factor']); ln.new(b1.outputs['Fac'], mixb.inputs[2]); ln.new(rip.outputs['Fac'], mixb.inputs[3])
ln.new(mixb.outputs[0], bump.inputs['Height']); ln.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
ob.data.materials.append(m)

if CFG.get('monolith'):
    # the near ground, in detail (0.16 units per vertex): wind-cut snow (sastrugi), drifts, and rock breaking through here and there
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import terrain as T
    # one continuous ground to the horizon: rows packed densely near the camera, sparse far away; width grows with distance
    NP = 1024
    tt = np.linspace(1, 0, NP)[:, None]                              # row 0 = far
    PYr = -30 + 450 * tt ** 2.2
    uu = np.linspace(-1, 1, NP)[None, :]
    PX = uu * (34 + 1.25 * (PYr + 30)); PY = np.repeat(PYr, NP, 1)
    # the valley's large shape, sampled from the far terrain grid
    fx = (PX - X0) / SIZE * (N - 1); fy = (Y0 + SIZE - PY) / SIZE * (N - 1)
    fx = np.clip(fx, 0, N - 1.001); fy = np.clip(fy, 0, N - 1.001)
    x0_ = np.floor(fx).astype(int); y0_ = np.floor(fy).astype(int); ax_ = fx - x0_; ay_ = fy - y0_
    G_ = gz_open
    base_h = (G_[y0_, x0_] * (1 - ax_) + G_[y0_, x0_ + 1] * ax_) * (1 - ay_) + (G_[y0_ + 1, x0_] * (1 - ax_) + G_[y0_ + 1, x0_ + 1] * ax_) * ay_
    drift = T.fbm(NP, 4, 5, 303)
    lumps = T.fbm(NP, 32, 4, 307)
    grit = T.fbm(NP, 256, 2, 308)
    cover = T.fbm(NP, 8, 7, 304); cover = (cover - cover.min()) / (cover.max() - cover.min())
    rockmask = np.clip((cover - 0.66) / 0.04, 0, 1)
    rk = np.abs(T.fbm(NP, 64, 4, 305)) * 2
    keep = np.clip((np.hypot(PX / 1.4, (PY - 18) / 1.0) - 8) / 10, 0, 1)
    rockmask *= keep
    hgt = base_h + (drift * 0.8 + lumps * 0.18 + grit * 0.035) * np.clip(1 - (PY - 60) / 300, 0.3, 1) + rockmask * (0.2 + rk * 0.8)
    V2 = np.stack([PX.ravel(), PY.ravel(), hgt.ravel()], 1)
    I2 = np.arange(NP * NP).reshape(NP, NP)
    Q2 = np.stack([I2[:-1, :-1].ravel(), I2[1:, :-1].ravel(), I2[1:, 1:].ravel(), I2[:-1, 1:].ravel()], 1)
    m2 = bpy.data.meshes.new('near')
    m2.vertices.add(len(V2)); m2.vertices.foreach_set('co', V2.ravel().astype(np.float32))
    m2.loops.add(Q2.size); m2.loops.foreach_set('vertex_index', Q2.ravel().astype(np.int32))
    m2.polygons.add(len(Q2)); m2.polygons.foreach_set('loop_start', (np.arange(len(Q2)) * 4).astype(np.int32))
    m2.update(calc_edges=True); m2.validate()
    m2.polygons.foreach_set('use_smooth', np.ones(len(Q2), dtype=bool))
    at = m2.attributes.new('rock', 'FLOAT', 'POINT'); at.data.foreach_set('value', rockmask.ravel().astype(np.float32))
    on = bpy.data.objects.new('near', m2); sc.collection.objects.link(on)
    # snow and rock material: crisp matte snow with fine grain, dark wet-looking rock where it breaks through
    sm_ = bpy.data.materials.new('snowrock'); sm_.use_nodes = True; sn = sm_.node_tree.nodes; sk = sm_.node_tree.links
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
    sk.new(cm.outputs[2], tm.inputs[6]); sk.new(tr_.outputs['Result'], tm.inputs[7])
    sk.new(tm.outputs[2], sb.inputs['Base Color'])
    gr = sn.new('ShaderNodeTexNoise'); gr.inputs['Scale'].default_value = 140.0; gr.inputs['Detail'].default_value = 6; gr.inputs['Roughness'].default_value = 0.75
    gr2 = sn.new('ShaderNodeTexVoronoi'); gr2.inputs['Scale'].default_value = 26.0
    ad2 = sn.new('ShaderNodeMath'); ad2.operation = 'ADD'; sk.new(gr.outputs['Fac'], ad2.inputs[0]); sk.new(gr2.outputs['Distance'], ad2.inputs[1])
    bp = sn.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 1.0; bp.inputs['Distance'].default_value = 0.03
    sk.new(ad2.outputs[0], bp.inputs['Height']); sk.new(bp.outputs['Normal'], sb.inputs['Normal'])
    on.data.materials.append(sm_)
    # the far snow takes the same look
    for i_ in range(len(ob.material_slots)): ob.material_slots[i_].material = sm_
    ob.hide_render = True                                            # the detailed ground replaces it

    srng2 = np.random.default_rng(21)
    bases = []
    for k_ in range(3):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.0, location=(0, 0, -900 - k_ * 5)); bo = bpy.context.active_object
        tv = bpy.data.textures.new('st%d' % k_, 'VORONOI'); tv.noise_scale = 0.6 + k_ * 0.2
        dm_ = bo.modifiers.new('d', 'DISPLACE'); dm_.texture = tv; dm_.strength = 0.5
        bpy.ops.object.modifier_apply(modifier='d'); bo.data.materials.append(sm_)
        for p_ in bo.data.polygons: p_.use_smooth = False
        bases.append(bo)
    def ground_near(x, y):
        t_ = ((y + 30) / 450) ** (1 / 2.2); r_ = int(round((1 - t_) * (NP - 1)))
        w_ = 34 + 1.25 * (y + 30); c_ = int(round((x / w_ + 1) / 2 * (NP - 1)))
        if 0 <= r_ < NP and 0 <= c_ < NP: return hgt[r_, c_]
        return None
    ns = 0
    for _ in range(3600):
        y = -12 + srng2.random() ** 2.0 * 110; x = (srng2.random() - 0.5) * 2 * (20 + 1.1 * (y + 30))
        if abs(x) < 3 and 8 < y < 28: continue
        z = ground_near(x, y)
        if z is None: continue
        sz = 0.03 + srng2.random() ** 5 * 0.9
        o = bases[ns % 3].copy(); o.data = bases[ns % 3].data; sc.collection.objects.link(o)
        o.location = (x, y, z - sz * 0.35); o.scale = (sz * (0.7 + srng2.random() * 0.6), sz * (0.7 + srng2.random() * 0.6), sz * (0.45 + srng2.random() * 0.35))
        o.rotation_euler = (srng2.random() * 0.5, srng2.random() * 0.5, srng2.random() * 6.28); ns += 1
    print('stones', ns)
    print('near patch', len(V2))

# sky: physical sky with a low sun
wd = bpy.data.worlds.new('world'); sc.world = wd; wd.use_nodes = True
wn = wd.node_tree.nodes; wl = wd.node_tree.links
sky = wn.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'
for k, v in dict(sun_elevation=math.radians(CFG['sun_el']), sun_rotation=math.radians(CFG['sun_rot']), air_density=CFG['air'],
                 aerosol_density=CFG['aerosol'], dust_density=CFG['aerosol'], ozone_density=CFG['ozone'], altitude=200.0, sun_intensity=1.0).items():
    if hasattr(sky, k): setattr(sky, k, v)
tcw = wn.new('ShaderNodeTexCoord'); vor = wn.new('ShaderNodeTexVoronoi'); vor.inputs["Scale"].default_value = 300.0 if CFG.get("monolith") else 420.0
wl.new(tcw.outputs['Generated'], vor.inputs['Vector'])
st = wn.new('ShaderNodeMapRange'); st.inputs['From Min'].default_value = 0.0; st.inputs['From Max'].default_value = 0.035 if CFG.get('monolith') else 0.05; st.inputs['To Min'].default_value = 1.0; st.inputs['To Max'].default_value = 0.0
wl.new(vor.outputs['Distance'], st.inputs['Value'])
pw = wn.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 8.0; wl.new(st.outputs['Result'], pw.inputs[0])
br = wn.new('ShaderNodeSeparateColor'); wl.new(vor.outputs['Color'], br.inputs[0])
m1_ = wn.new('ShaderNodeMath'); m1_.operation = 'MULTIPLY'; wl.new(pw.outputs[0], m1_.inputs[0]); wl.new(br.outputs[0], m1_.inputs[1])
sepd = wn.new('ShaderNodeSeparateXYZ'); wl.new(tcw.outputs['Generated'], sepd.inputs[0])
hz_ = wn.new('ShaderNodeMapRange'); hz_.inputs['From Min'].default_value = 0.02; hz_.inputs['From Max'].default_value = 0.35; wl.new(sepd.outputs['Z'], hz_.inputs['Value'])
m2_ = wn.new('ShaderNodeMath'); m2_.operation = 'MULTIPLY'; wl.new(m1_.outputs[0], m2_.inputs[0]); wl.new(hz_.outputs['Result'], m2_.inputs[1])
m3_ = wn.new('ShaderNodeMath'); m3_.operation = 'MULTIPLY'; m3_.inputs[1].default_value = CFG['stars'] * (0.6 if CFG.get('monolith') else 0.08); wl.new(m2_.outputs[0], m3_.inputs[0])
addc = wn.new('ShaderNodeMix'); addc.data_type = 'RGBA'; addc.blend_type = 'ADD'; addc.inputs['Factor'].default_value = 1.0
wl.new(sky.outputs['Color'], addc.inputs[6])
if CFG.get('airless'):
    blk = wn.new('ShaderNodeRGB'); blk.outputs[0].default_value = (0.0006, 0.0006, 0.0007, 1); wl.new(blk.outputs[0], addc.inputs[6])
wl.new(m3_.outputs[0], addc.inputs[7])
wl.new(addc.outputs[2], wn['Background'].inputs['Color']); wn['Background'].inputs['Strength'].default_value = CFG['bg']

if CFG.get('monolith'):
    # the Milky Way: a tilted band of cloudy light with dark dust lanes, many faint stars inside it
    nrm = wn.new('ShaderNodeVectorMath'); nrm.operation = 'DOT_PRODUCT'; nrm.inputs[1].default_value = (0.62, -0.25, 0.74)
    wl.new(tcw.outputs['Generated'], nrm.inputs[0])
    sq = wn.new('ShaderNodeMath'); sq.operation = 'MULTIPLY'; wl.new(nrm.outputs['Value'], sq.inputs[0]); wl.new(nrm.outputs['Value'], sq.inputs[1])
    bandw = wn.new('ShaderNodeMath'); bandw.operation = 'MULTIPLY'; bandw.inputs[1].default_value = -55.0; wl.new(sq.outputs[0], bandw.inputs[0])
    band = wn.new('ShaderNodeMath'); band.operation = 'EXPONENT'; wl.new(bandw.outputs[0], band.inputs[0])
    cloud = wn.new('ShaderNodeTexNoise'); cloud.inputs['Scale'].default_value = 7.0; cloud.inputs['Detail'].default_value = 12; cloud.inputs['Roughness'].default_value = 0.62
    wl.new(tcw.outputs['Generated'], cloud.inputs['Vector'])
    dust = wn.new('ShaderNodeTexNoise'); dust.inputs['Scale'].default_value = 11.0; dust.inputs['Detail'].default_value = 10
    wl.new(tcw.outputs['Generated'], dust.inputs['Vector'])
    dl = wn.new('ShaderNodeMapRange'); dl.inputs['From Min'].default_value = 0.45; dl.inputs['From Max'].default_value = 0.62; dl.inputs['To Min'].default_value = 1.0; dl.inputs['To Max'].default_value = 0.15
    wl.new(dust.outputs['Fac'], dl.inputs['Value'])
    cc = wn.new('ShaderNodeMapRange'); cc.inputs['From Min'].default_value = 0.35; cc.inputs['From Max'].default_value = 0.75; wl.new(cloud.outputs['Fac'], cc.inputs['Value'])
    g1 = wn.new('ShaderNodeMath'); g1.operation = 'MULTIPLY'; wl.new(band.outputs[0], g1.inputs[0]); wl.new(cc.outputs['Result'], g1.inputs[1])
    g2 = wn.new('ShaderNodeMath'); g2.operation = 'MULTIPLY'; wl.new(g1.outputs[0], g2.inputs[0]); wl.new(dl.outputs['Result'], g2.inputs[1])
    g3 = wn.new('ShaderNodeMath'); g3.operation = 'MULTIPLY'; g3.inputs[1].default_value = 0.06; wl.new(g2.outputs[0], g3.inputs[0])
    vb2 = wn.new('ShaderNodeTexVoronoi'); vb2.inputs['Scale'].default_value = 900.0; wl.new(tcw.outputs['Generated'], vb2.inputs['Vector'])
    s2 = wn.new('ShaderNodeMapRange'); s2.inputs['From Max'].default_value = 0.06; s2.inputs['To Min'].default_value = 1.0; s2.inputs['To Max'].default_value = 0.0
    wl.new(vb2.outputs['Distance'], s2.inputs['Value'])
    p2 = wn.new('ShaderNodeMath'); p2.operation = 'POWER'; p2.inputs[1].default_value = 10.0; wl.new(s2.outputs['Result'], p2.inputs[0])
    p3 = wn.new('ShaderNodeMath'); p3.operation = 'MULTIPLY'; wl.new(p2.outputs[0], p3.inputs[0]); wl.new(g1.outputs[0], p3.inputs[1])
    p4 = wn.new('ShaderNodeMath'); p4.operation = 'MULTIPLY'; p4.inputs[1].default_value = 0.6; wl.new(p3.outputs[0], p4.inputs[0])
    tot = wn.new('ShaderNodeMath'); tot.operation = 'ADD'; wl.new(g3.outputs[0], tot.inputs[0]); wl.new(p4.outputs[0], tot.inputs[1])
    hz2 = wn.new('ShaderNodeMath'); hz2.operation = 'MULTIPLY'; wl.new(tot.outputs[0], hz2.inputs[0]); wl.new(hz_.outputs['Result'], hz2.inputs[1])
    # colour: blue-violet edges, rose and warm gold towards the core, varied by a slow noise
    hue = wn.new('ShaderNodeTexNoise'); hue.inputs['Scale'].default_value = 2.2; hue.inputs['Detail'].default_value = 4
    wl.new(tcw.outputs['Generated'], hue.inputs['Vector'])
    core = wn.new('ShaderNodeMath'); core.operation = 'MULTIPLY'; wl.new(band.outputs[0], core.inputs[0]); wl.new(hue.outputs['Fac'], core.inputs[1])
    cr = wn.new('ShaderNodeValToRGB'); wl.new(core.outputs[0], cr.inputs['Fac'])
    E_ = cr.color_ramp.elements
    E_[0].position, E_[0].color = 0.0, (0.30, 0.42, 1.0, 1)
    E_[1].position, E_[1].color = 1.0, (1.0, 0.92, 0.78, 1)
    for p_, c_ in [(0.22, (0.55, 0.40, 1.0)), (0.42, (1.0, 0.45, 0.75)), (0.62, (1.0, 0.70, 0.45))]:
        e_ = E_.new(p_); e_.color = (*c_, 1)
    tint = wn.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'; tint.inputs['Factor'].default_value = 1.0
    wl.new(cr.outputs['Color'], tint.inputs[6]); wl.new(hz2.outputs[0], tint.inputs[7])
    boost = wn.new('ShaderNodeMix'); boost.data_type = 'RGBA'; boost.blend_type = 'MULTIPLY'; boost.inputs['Factor'].default_value = 1.0
    boost.inputs[7].default_value = (2.2, 2.2, 2.2, 1); wl.new(tint.outputs[2], boost.inputs[6])
    add2 = wn.new('ShaderNodeMix'); add2.data_type = 'RGBA'; add2.blend_type = 'ADD'; add2.inputs['Factor'].default_value = 1.0
    wl.new(addc.outputs[2], add2.inputs[6]); wl.new(boost.outputs[2], add2.inputs[7])
    wl.new(add2.outputs[2], wn['Background'].inputs['Color'])
from mathutils import Vector
def lamp(name, spec, angle=1.5):
    ld = bpy.data.lights.new(name, 'SUN'); ld.energy = spec['e']; ld.color = spec['c']; ld.angle = math.radians(angle)
    lo = bpy.data.objects.new(name, ld); sc.collection.objects.link(lo); lo.rotation_mode = 'QUATERNION'
    e_, r_ = math.radians(spec['el']), math.radians(spec['rot'])
    d_ = (math.sin(r_) * math.cos(e_), math.cos(r_) * math.cos(e_), math.sin(e_))
    lo.rotation_quaternion = Vector((-d_[0], -d_[1], -d_[2])).to_track_quat('-Z', 'Y')
lamp('key', CFG['key']); lamp('fill', CFG['fill'], 8)
sc.view_settings.exposure = CFG['exposure']
# the planet (and rings), lit by the same sun
pc = CFG['planet']; dv = Vector(pc['dir']).normalized() * pc['dist']
if CFG.get('noplanet'): dv = Vector((0, 0, -5000))   # parked far below the ground, never seen
bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=pc['r'], location=dv)
pl = bpy.context.active_object; bpy.ops.object.shade_smooth()
pm = bpy.data.materials.new('planet'); pm.use_nodes = True; pn = pm.node_tree.nodes; pk = pm.node_tree.links
pb = pn['Principled BSDF']; pb.inputs['Roughness'].default_value = 1.0
bands = pn.new('ShaderNodeTexWave'); bands.wave_type = 'BANDS'; bands.bands_direction = 'Z'; bands.inputs['Scale'].default_value = 1.4; bands.inputs['Distortion'].default_value = 6; bands.inputs['Detail'].default_value = 6
pr = pn.new('ShaderNodeValToRGB'); pk.new(bands.outputs['Fac'], pr.inputs['Fac'])
c = pc['col']; pr.color_ramp.elements[0].color = (c[0] * 0.55, c[1] * 0.55, c[2] * 0.55, 1); pr.color_ramp.elements[1].color = (*c, 1)
pk.new(pr.outputs['Color'], pb.inputs['Base Color']); pk.new(pr.outputs['Color'], pb.inputs['Emission Color']); pb.inputs['Emission Strength'].default_value = 0.12   # faint glow so it reads against a night sky
pl.data.materials.append(pm)
pl.rotation_euler = (math.radians(18), math.radians(-12), 0)
if pc['ring']:
    bpy.ops.mesh.primitive_circle_add(vertices=256, radius=pc['r'] * 2.3, fill_type='NGON', location=dv)
    rg = bpy.context.active_object; rg.rotation_euler = (math.radians(74), math.radians(-14), 0)
    rm = bpy.data.materials.new('ring'); rm.use_nodes = True; rn = rm.node_tree.nodes; rk = rm.node_tree.links
    out = rn['Material Output']; rb = rn['Principled BSDF']; rb.inputs['Base Color'].default_value = (*[x * 0.9 for x in c], 1)
    tc = rn.new('ShaderNodeTexCoord'); vl = rn.new('ShaderNodeVectorMath'); vl.operation = 'LENGTH'; rk.new(tc.outputs['Object'], vl.inputs[0])
    rr = rn.new('ShaderNodeValToRGB'); rk.new(vl.outputs['Value'], rr.inputs['Fac'])
    R = pc['r'] * 2.3; E = rr.color_ramp.elements
    stops = [(0.0, 0), (1.35 / 2.3, 0), (1.42 / 2.3, 0.55), (1.7 / 2.3, 0.35), (1.76 / 2.3, 0.05), (1.84 / 2.3, 0.5), (2.2 / 2.3, 0.25), (1.0, 0)]
    E[0].position, E[0].color = 0, (0, 0, 0, 1)
    E[1].position, E[1].color = 1, (0, 0, 0, 1)
    for p, a in stops[1:-1]: e = E.new(p); e.color = (a, a, a, 1)
    mapr = rn.new('ShaderNodeMath'); mapr.operation = 'DIVIDE'; mapr.inputs[1].default_value = R
    rk.new(vl.outputs['Value'], mapr.inputs[0]); rk.new(mapr.outputs[0], rr.inputs['Fac'])
    mixs = rn.new('ShaderNodeMixShader'); tr = rn.new('ShaderNodeBsdfTransparent')
    rk.new(rr.outputs['Color'], mixs.inputs['Fac']); rk.new(tr.outputs[0], mixs.inputs[1]); rk.new(rb.outputs[0], mixs.inputs[2])
    rk.new(mixs.outputs[0], out.inputs['Surface']); rg.data.materials.append(rm)

# boulders scattered over the valley floor and the lower slopes
rng = np.random.default_rng({'canyon': 1, 'spires': 2, 'dunes': 3}[kind])
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1.0, location=(0, 0, -500))
base = bpy.context.active_object
t1 = bpy.data.textures.new('rk', 'VORONOI'); t1.noise_scale = 0.55
m1 = base.modifiers.new('d1', 'DISPLACE'); m1.texture = t1; m1.strength = 0.6
t2 = bpy.data.textures.new('rk2', 'CLOUDS'); t2.noise_scale = 0.3
m2 = base.modifiers.new('d2', 'DISPLACE'); m2.texture = t2; m2.strength = 0.25
bpy.ops.object.modifier_apply(modifier='d1'); bpy.ops.object.modifier_apply(modifier='d2')
base.data.materials.append(m)
def ground_at(x, y):
    j = int(round((x - X0) / SIZE * (N - 1))); i = int(round((Y0 + SIZE - y) / SIZE * (N - 1)))
    if 0 <= i < N and 0 <= j < N: return gz[i, j]
    return None
count = 0
for _ in range(0 if CFG.get('monolith') else 700):
    y = -8 + rng.random() ** 1.3 * 150; x = (rng.random() - 0.5) * (60 + y * 1.8)
    if abs(x) < 4 and y < 30: continue                      # keep the space right under the logo clear
    z = ground_at(x, y)
    if z is None: continue
    s_ = (0.08 + rng.random() ** 4 * 1.4) * (1 + y / 90)
    o = base.copy(); o.data = base.data; sc.collection.objects.link(o)
    o.location = (x, y, z + s_ * 0.2); o.scale = (s_ * (0.8 + rng.random() * 0.6), s_ * (0.8 + rng.random() * 0.6), s_ * (0.5 + rng.random() * 0.4))
    o.rotation_euler = (rng.random() * 0.4, rng.random() * 0.4, rng.random() * 6.28); count += 1
print('boulders', count)
if CFG.get('monolith'):
    # sculpted spires: fluted, tapering, leaning towers of rock, layered into the distance
    srng = np.random.default_rng(11)
    def spire(x, y, base_z, H, R, lean, seed):
        r_ = np.random.default_rng(seed); RINGS, SEG = 48, 9
        th = np.linspace(0, 2 * np.pi, SEG, endpoint=False)
        ph = r_.random(6) * 6.28; fr = r_.integers(3, 9, 6)
        vs = []
        for i in range(RINGS + 1):
            t = i / RINGS
            taper = (1 - t) ** 1.4 * (1 - 0.22 * np.sin(t * 7 + ph[0])) * (1.3 - 0.3 * t) + 0.01
            flute = 1 + 0.25 * r_.random(SEG) + 0.15 * np.sin(th * fr[0] + ph[1] + t * 3)   # broken, angular cross-section
            ledge = 1 + 0.12 * (np.sin(t * 40 + ph[4]) > 0.75)                       # strata ledges
            rr = R * taper * flute * ledge
            cx_ = x + lean[0] * t * t * H; cy_ = y + lean[1] * t * t * H
            tw = t * (1.2 + ph[5] * 0.2)                                              # a slow twist up the spire
            for k_ in range(SEG): vs.append((cx_ + rr[k_] * np.cos(th[k_] + tw), cy_ + rr[k_] * np.sin(th[k_] + tw), base_z + t * H))
        faces = []
        for i in range(RINGS):
            for k_ in range(SEG): a_ = i * SEG + k_; b_ = i * SEG + (k_ + 1) % SEG; faces.append((a_, b_, b_ + SEG, a_ + SEG))
        me_ = bpy.data.meshes.new('spire'); me_.from_pydata(vs, [], faces); me_.update()
        for p_ in me_.polygons: p_.use_smooth = False   # faceted, crystalline faces
        o_ = bpy.data.objects.new('spire', me_); sc.collection.objects.link(o_)
        t1_ = bpy.data.textures.new('sv', 'VORONOI'); t1_.noise_scale = R * 0.35
        d1_ = o_.modifiers.new('d', 'DISPLACE'); d1_.texture = t1_; d1_.strength = R * 0.18; d1_.texture_coords = 'GLOBAL'
        t2_ = bpy.data.textures.new('sc', 'CLOUDS'); t2_.noise_scale = R * 0.12
        d2_ = o_.modifiers.new('d2', 'DISPLACE'); d2_.texture = t2_; d2_.strength = R * 0.12; d2_.texture_coords = 'GLOBAL'
        o_.data.materials.append(m)
    placed = []
    # two giants framing the logo, then bands receding into the distance
    for (x, y, H, R) in [(-44, 75, 200, 5.0), (50, 105, 240, 5.6), (-48, 190, 170, 3.8), (62, 230, 210, 4.4)]:
        placed.append((x, y, H, R))
    for _ in range(46):
        y = 140 + srng.random() ** 0.7 * 280; x = (srng.random() - 0.5) * (y * 1.9)
        if abs(x) < 0.32 * y: H *= 0.32 if False else 1.0
        if abs(x) < 0.30 * y: continue                              # an open sky window behind the logo
        H = 70 + srng.random() ** 1.3 * 200 * (0.6 + y / 500); R = 1.8 + srng.random() * 3.0 * (0.6 + y / 600)
        placed.append((x, y, H, R))
    placed = []                                                       # no spires: open land
    for i_, (x, y, H, R) in enumerate(placed):
        z = ground_at(x, y); z = -6 if z is None else z
        spire(x, y, z - 4, H, R, ((srng.random() - 0.5) * 0.12, (srng.random() - 0.5) * 0.08), 100 + i_)
    print('spires', len(placed))


# camera: hero position, equirectangular plate covering 100 x 60 degrees
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -19.25, 0); cam.rotation_euler = (math.radians(90), 0, 0)
cd.type = 'PANO'
for tgt in (cd, getattr(cd, 'cycles', None)):
    if tgt is None: continue
    for k, v in dict(panorama_type='EQUIRECTANGULAR', longitude_min=math.radians(-50), longitude_max=math.radians(50),
                     latitude_min=math.radians(-32), latitude_max=math.radians(28)).items():
        if hasattr(tgt, k):
            try: setattr(tgt, k, v)
            except Exception as e: print('cam', k, e)
cd.clip_end = 5000
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('wrote', OUT)
dm = bpy.data.materials.new('depth'); dm.use_nodes = True; dn = dm.node_tree.nodes; dk = dm.node_tree.links
dn.remove(dn['Principled BSDF']); cdn = dn.new('ShaderNodeCameraData'); em = dn.new('ShaderNodeEmission'); dv_ = dn.new('ShaderNodeMath'); dv_.operation = 'DIVIDE'; dv_.inputs[1].default_value = 1000.0
dk.new(cdn.outputs['View Distance'], dv_.inputs[0]); dk.new(dv_.outputs[0], em.inputs['Color']); dk.new(em.outputs[0], dn['Material Output'].inputs['Surface'])
for o in sc.objects:
    if o.type == 'MESH' and o.data.materials:
        for i in range(len(o.material_slots)): o.material_slots[i].link = 'OBJECT'; o.material_slots[i].material = dm
wn['Background'].inputs['Strength'].default_value = 0.0; wl.new(sky.outputs['Color'], wn['Background'].inputs['Color'])
bg = wn.new('ShaderNodeRGB'); bg.outputs[0].default_value = (1, 1, 1, 1); wl.new(bg.outputs[0], wn['Background'].inputs['Color']); wn['Background'].inputs['Strength'].default_value = 1.0
for l in [o for o in sc.objects if o.type == 'LIGHT']: l.hide_render = True
sc.cycles.samples = 1; sc.cycles.use_denoising = False; sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 0.0
sc.render.image_settings.color_depth = '16'; sc.render.filter_size = 0.01
sc.render.filepath = OUT.replace('.png', '_depth.png')
bpy.ops.render.render(write_still=True)
print('wrote depth')
hm = bpy.data.materials.new('height'); hm.use_nodes = True; hn = hm.node_tree.nodes; hk = hm.node_tree.links
hn.remove(hn['Principled BSDF']); gg = hn.new('ShaderNodeNewGeometry'); sz = hn.new('ShaderNodeSeparateXYZ'); hk.new(gg.outputs['Position'], sz.inputs[0])
ma = hn.new('ShaderNodeMapRange'); ma.inputs['From Min'].default_value = -20; ma.inputs['From Max'].default_value = 180; hk.new(sz.outputs['Z'], ma.inputs['Value'])
he = hn.new('ShaderNodeEmission'); hk.new(ma.outputs['Result'], he.inputs['Color']); hk.new(he.outputs[0], hn['Material Output'].inputs['Surface'])
for o in sc.objects:
    if o.type == 'MESH':
        for i in range(len(o.material_slots)): o.material_slots[i].link = 'OBJECT'; o.material_slots[i].material = hm
bg.outputs[0].default_value = (0, 0, 0, 1)
sc.render.filepath = OUT.replace('.png', '_height.png')
bpy.ops.render.render(write_still=True)
print('wrote height')
