# Blender (bpy) scene: eroded terrain + physical sky + haze + a planet, rendered as an equirectangular plate
# from the hero camera position. Coordinates: Blender X = three x, Blender Y = -three z, Blender Z = three y.
import bpy, numpy as np, math, sys, os
kind = sys.argv[1]; W = int(sys.argv[2]); H = int(sys.argv[3]); SAMPLES = int(sys.argv[4]); OUT = sys.argv[5]
CFG = {
  'canyon': dict(exposure=0.2, bg=1.0, stars=0.6, key=dict(el=9, rot=-75, e=3.6, c=(1.0, 0.6, 0.4)), fill=dict(el=30, rot=120, e=0.25, c=(0.55, 0.65, 1.0)), hmax=80, sun_el=-5, sun_rot=-8, air=1.0, aerosol=2.0, ozone=1.0, fog=0.0018, fogc=(0.85, 0.62, 0.48),
                 rock=[(0.0, (0.20, 0.07, 0.035)), (0.35, (0.36, 0.13, 0.06)), (0.55, (0.52, 0.25, 0.12)), (0.75, (0.30, 0.10, 0.05)), (1.0, (0.58, 0.36, 0.22))],
                 sand=(0.55, 0.30, 0.16), planet=dict(dir=(0.2532, 0.9448, 0.2079), r=62, dist=900, col=(0.80, 0.70, 0.62), ring=True)),
  'spires': dict(exposure=1.6, bg=1.0, stars=1.0, key=dict(el=24, rot=62, e=0.9, c=(0.62, 0.74, 1.0)), fill=dict(el=40, rot=-120, e=0.12, c=(0.5, 0.6, 1.0)), hmax=70, sun_el=-7, sun_rot=20, air=1.0, aerosol=1.0, ozone=2.0, fog=0.003, fogc=(0.62, 0.70, 0.82),
                 rock=[(0.0, (0.05, 0.055, 0.065)), (0.5, (0.11, 0.12, 0.14)), (1.0, (0.20, 0.21, 0.24))],
                 sand=(0.55, 0.60, 0.68), snow=True, planet=dict(dir=(-0.2375, 0.9525, 0.1908), r=80, dist=900, col=(0.80, 0.84, 0.92), ring=False)),
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
md = ob.modifiers.new('und', 'DISPLACE'); md.texture = tx; md.strength = 2.2; md.mid_level = 0.5; md.direction = 'Z'; md.texture_coords = 'GLOBAL'

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

# sky: physical sky with a low sun
wd = bpy.data.worlds.new('world'); sc.world = wd; wd.use_nodes = True
wn = wd.node_tree.nodes; wl = wd.node_tree.links
sky = wn.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'
for k, v in dict(sun_elevation=math.radians(CFG['sun_el']), sun_rotation=math.radians(CFG['sun_rot']), air_density=CFG['air'],
                 aerosol_density=CFG['aerosol'], dust_density=CFG['aerosol'], ozone_density=CFG['ozone'], altitude=200.0, sun_intensity=1.0).items():
    if hasattr(sky, k): setattr(sky, k, v)
tcw = wn.new('ShaderNodeTexCoord'); vor = wn.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 420.0
wl.new(tcw.outputs['Generated'], vor.inputs['Vector'])
st = wn.new('ShaderNodeMapRange'); st.inputs['From Min'].default_value = 0.0; st.inputs['From Max'].default_value = 0.05; st.inputs['To Min'].default_value = 1.0; st.inputs['To Max'].default_value = 0.0
wl.new(vor.outputs['Distance'], st.inputs['Value'])
pw = wn.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 8.0; wl.new(st.outputs['Result'], pw.inputs[0])
br = wn.new('ShaderNodeSeparateColor'); wl.new(vor.outputs['Color'], br.inputs[0])
m1_ = wn.new('ShaderNodeMath'); m1_.operation = 'MULTIPLY'; wl.new(pw.outputs[0], m1_.inputs[0]); wl.new(br.outputs[0], m1_.inputs[1])
sepd = wn.new('ShaderNodeSeparateXYZ'); wl.new(tcw.outputs['Generated'], sepd.inputs[0])
hz_ = wn.new('ShaderNodeMapRange'); hz_.inputs['From Min'].default_value = 0.02; hz_.inputs['From Max'].default_value = 0.35; wl.new(sepd.outputs['Z'], hz_.inputs['Value'])
m2_ = wn.new('ShaderNodeMath'); m2_.operation = 'MULTIPLY'; wl.new(m1_.outputs[0], m2_.inputs[0]); wl.new(hz_.outputs['Result'], m2_.inputs[1])
m3_ = wn.new('ShaderNodeMath'); m3_.operation = 'MULTIPLY'; m3_.inputs[1].default_value = CFG['stars'] * 0.08; wl.new(m2_.outputs[0], m3_.inputs[0])
addc = wn.new('ShaderNodeMix'); addc.data_type = 'RGBA'; addc.blend_type = 'ADD'; addc.inputs['Factor'].default_value = 1.0
wl.new(sky.outputs['Color'], addc.inputs[6]); wl.new(m3_.outputs[0], addc.inputs[7])
wl.new(addc.outputs[2], wn['Background'].inputs['Color']); wn['Background'].inputs['Strength'].default_value = CFG['bg']
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
for _ in range(700):
    y = -8 + rng.random() ** 1.3 * 150; x = (rng.random() - 0.5) * (60 + y * 1.8)
    if abs(x) < 4 and y < 30: continue                      # keep the space right under the logo clear
    z = ground_at(x, y)
    if z is None: continue
    s_ = (0.08 + rng.random() ** 4 * 1.4) * (1 + y / 90)
    o = base.copy(); o.data = base.data; sc.collection.objects.link(o)
    o.location = (x, y, z + s_ * 0.2); o.scale = (s_ * (0.8 + rng.random() * 0.6), s_ * (0.8 + rng.random() * 0.6), s_ * (0.5 + rng.random() * 0.4))
    o.rotation_euler = (rng.random() * 0.4, rng.random() * 0.4, rng.random() * 6.28); count += 1
print('boulders', count)

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
