# floor_final: the igloo-style snow floor for the Skreed hero. Variant a (shape first) with the grafts the three
# judges agreed on, reworked after the second round of feedback:
#   lighting   overcast look: a soft warm-neutral key from the back-left at 38 deg (faces towards the camera fall into
#              soft shade, as igloo's), a blue-grey sky dome carrying ~55 % of the flat-floor irradiance, no cyan key
#   tone       the page LUT is b's least-squares luma-quantile fit (floor_final_post.py), chroma preserving
#   grain      the fine crumb modulates the ALBEDO (so shaded faces carry the same grain as lit ones) with a small bump,
#              anisotropy from a 1.15x view-axis stretch, plus radial sastrugi streaks (4-16 px thick, 30-60 px long on
#              screen, aligned to the perspective lines) carrying about a third of the fine variance; crumb and streaks
#              fade with distance (x1.25 in the nearest rows, x0.7 by the logo pad, gone by the far field)
#   mid-field  the hummock octaves that land at 10-40 px on screen are damped to ~0.3 by the mid distance; one large
#              foreground dome left of centre with a lee scarp (a crisp crest line concave towards the viewer dropping
#              into shade) replaces the terraced left bank; one broad swell on the right; a's flank knolls stay, lower
#   far ridge  the far heightfield is low-passed with distance (3-4 broad domes, no sawtooth), haze to a dark blue-grey
#   stones     70 stones, smooth-shaded, 5-6 pebbles of 6-20 px inside the frame, the rest specks or outside; none on
#              the lit right bank; albedo lifted so the darkest pixel stays near-black grey
#   scarps     three crescent wind scarps in the foreground plain, each a crisp lip with a dark pit and a small stone
#   shadow     a shadow-only proxy of the floating logo (5.6 x 1.2 x 6.1 box at the origin), invisible to camera rays
# The bake switches the fine crumb (features under 0.1 units) off: the page multiplies in its own procedural crumb.
# Blender X = three x, Blender Y = -three z, Blender Z = three y. Hero camera (0, -24, -2.5) -> (0, 0, -1), vfov 30.
#
# usage:  bl/bin/python floor_final.py preview <out.png> [samples] [W] [H]    hero camera render + <out>_depth.npy
#         bl/bin/python floor_final.py bake <outdir> [samples] [tex]          bake + export (moon_final2 format)
#         bl/bin/python floor_final.py terrain                                heightfield only (cached) + hillshade
# env:    FF_CAM=high (preview from (0, -24, -0.3) -> (0, 0, -1.0)), FF_THREADS, FF_REBUILD=1, FF_CRUMB=0/1 (override),
#         FF_NOPOST=1 (bake without the page LUT), FF_NODEPTH=1, FF_TAG (heightfield cache tag)
import numpy as np, math, sys, os, time, json, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import terrain as T

def gaussian_filter(a, sigma):
    """separable Gaussian blur (numpy only: the Blender python has no scipy)"""
    if sigma <= 0: return a
    r = int(math.ceil(3 * sigma)); k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    pad = np.pad(a, r, mode='edge')
    t = sum(k[i] * pad[i:i + a.shape[0], r:r + a.shape[1]] for i in range(2 * r + 1))
    pad = np.pad(t, ((0, 0), (r, r)), mode='edge')
    return sum(k[i] * pad[:, i:i + a.shape[1]] for i in range(2 * r + 1))

MODE = sys.argv[1] if len(sys.argv) > 1 else 'preview'
CACHE = os.path.join(HERE, 'ff'); os.makedirs(CACHE, exist_ok=True)
t0 = time.time()
def log(*a): print('[%6.1fs]' % (time.time() - t0), *a, flush=True)
def env(k, d): return float(os.environ.get(k, d))

# ------------------------------------------------------------------ parameters (all distances in world units)
P = dict(
    wind=62.0,                                          # wind direction, degrees from +x towards +y: igloo's strokes run diagonally
    drift_amp=0.30, drift_len=9.0, drift_wid=3.0,       # long flowing drifts along the wind
    knoll_amp=env('FF_KNOLL', 1.6), knoll_len=7.5, flank_rise=0.8, far_knoll_amp=env('FF_FARKNOLL', 5.0),
    mid_knoll=0.10,                                     # how much of the knoll field reaches the mid-field centre
    hill_amp=env('FF_HILL', 2.2), hill_len=18.0,        # b's broad irregular hills in the mid field
    scour_amp=0.012, scour_len=2.2, scour_wid=0.55,
    hump_amp=env('FF_HUMP', 0.15), swell_amp=0.42, fg_mound_amp=env('FF_FGM', 0.55),
    erode_drops=int(os.environ.get('FF_DROPS', '220000')), erode_k=1.0,
    far_blur=env('FF_FARBLUR', 12.0),                   # sigma (grid px of 0.82 units) on the far valley
)
# the foreground dome (left of centre) and the broad right swell: (cx, cy, sx_left, sx_right, sy, height)
DOME_L = (env('FF_DLX', -4.2), env('FF_DLY', -12.3), 5.5, 2.4, 4.0, env('FF_DLH', 2.1))
SWELL_R = (env('FF_SRX', 9.5), env('FF_SRY', 3.0), 7.5, 7.5, 6.0, env('FF_SRH', 1.5))
FAR_L = (-15.0, 14.0, 9.0, 9.0, 8.0, 2.4)                                        # a broad far-left hill behind the dome
# crescent wind scarps in the foreground plain: (x, y, radius, facing angle rad, lip height)
SCARPS = [(-0.6, -12.2, 0.85, math.pi / 2 + 0.1, env('FF_SCARP', 0.13)), (2.3, -9.6, 0.95, math.pi / 2 - 0.15, 0.14),
          (1.6, -16.2, 0.7, math.pi / 2 + 0.2, 0.11)]
DOME_SCARP = (DOME_L[0] + 0.3, DOME_L[1] - 2.4, 3.0, math.pi / 2, env('FF_DSCARP', 0.42))     # the dome's lee face

# ------------------------------------------------------------------ noise on arbitrary coordinates (vectorised gradient noise)
_GR = np.stack([np.cos(np.arange(16) * np.pi / 8), np.sin(np.arange(16) * np.pi / 8)], 1)
def _perm(seed):
    p = np.random.default_rng(seed).permutation(256); return np.concatenate([p, p]).astype(np.int64)
def gnoise(x, y, seed):
    p = _perm(seed)
    xf = np.floor(x); yf = np.floor(y); fx = x - xf; fy = y - yf
    xi = xf.astype(np.int64) & 255; yi = yf.astype(np.int64) & 255; xj = (xi + 1) & 255; yj = (yi + 1) & 255
    def g(ix, iy, dx, dy):
        h = p[p[ix] + iy] & 15; return _GR[h, 0] * dx + _GR[h, 1] * dy
    u = fx * fx * fx * (fx * (fx * 6 - 15) + 10); v = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
    a = g(xi, yi, fx, fy); b = g(xj, yi, fx - 1, fy); c = g(xi, yj, fx, fy - 1); d = g(xj, yj, fx - 1, fy - 1)
    return 1.414 * ((a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v)
def fbm(x, y, oct_, seed, gain=0.5, lac=2.03):
    s = np.zeros_like(x); a = 1.0; n = 0.0; ca, sa = math.cos(0.61), math.sin(0.61)
    for o in range(oct_):
        s += a * gnoise(x, y, seed + 17 * o); n += a; a *= gain
        x, y = (x * ca - y * sa) * lac + 3.17, (x * sa + y * ca) * lac + 1.71
    return s / n
def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def softplus(x, k): return np.log1p(np.exp(np.clip(x * k, -60, 60))) / k

# ------------------------------------------------------------------ the far valley (moon.py), silhouette smoothed with distance
h_sp = np.load(os.path.join(HERE, 'h_spires.npy')).astype(np.float64)
N = 512; h_sp = h_sp[::h_sp.shape[0] // N, ::h_sp.shape[1] // N][:N, :N]
h_sp = gaussian_filter(h_sp, P['far_blur'])
SIZE = 420.0; X0, Y0 = -SIZE / 2, -40.0
xs_ = np.linspace(X0, X0 + SIZE, N); ys_ = np.linspace(Y0 + SIZE, Y0, N); gx_, gy_ = np.meshgrid(xs_, ys_)
roll = T.fbm(512, 2, 3, 401); roll = (roll - roll.min()) / (roll.max() - roll.min())
far_ = np.clip((gy_ - 40) / 260, 0, 1); side_ = np.clip((np.abs(gx_) - 25) / 140, 0, 1) ** 1.4
G_ = -4.35 + roll * (1.5 + 9 * far_ ** 1.3) + side_ * 10 * (0.5 + roll) + h_sp * 1.5 * far_
G_far = gaussian_filter(G_, 28.0)                                                 # very smooth copy for the far field
w_far = np.clip((gy_ - 45) / 90, 0, 1); w_far = w_far * w_far * (3 - 2 * w_far)
G_ = G_ * (1 - w_far) + G_far * w_far
def base_at(x, y):
    fx = np.clip((x - X0) / SIZE * (N - 1), 0, N - 1.001); fy = np.clip((Y0 + SIZE - y) / SIZE * (N - 1), 0, N - 1.001)
    x0 = np.floor(fx).astype(int); y0 = np.floor(fy).astype(int); ax = fx - x0; ay = fy - y0
    return (G_[y0, x0] * (1 - ax) + G_[y0, x0 + 1] * ax) * (1 - ay) + (G_[y0 + 1, x0] * (1 - ax) + G_[y0 + 1, x0 + 1] * ax) * ay

NP = 1024
def ground_grid(nr, nc):
    tt = np.linspace(1, 0, nr)[:, None]; uu = np.linspace(-1, 1, nc)[None, :]
    PYr = -30 + 450 * tt ** 2.2
    PX = uu * (34 + 1.25 * (PYr + 30)); PY = np.repeat(PYr, nc, 1)
    return PX, PY

# ------------------------------------------------------------------ wind-sculpted relief (a) with b's hills, the dome and the swell
LOGO_Z = -3.6
def masks(x, y):
    pad = sstep(0.75, 2.9, np.hypot(x / 3.7, (y - 0.4) / 2.7))                 # 0 under the logo, 1 beyond
    w = 0.9 + 3.4 * np.clip((y + 24) / 24, 0, 1)                                # sight wedge camera -> logo
    wedge = np.where(y < 1.5, sstep(0.0, 3.5, np.abs(x) - w), 1.0)
    scr = np.abs(x) / (0.429 * np.maximum(y + 24, 2.0))                          # lateral position in the frame (1 = edge)
    flank = sstep(0.40, 1.05, scr)
    depth = sstep(6.0, 45.0, y)
    near_fine = np.clip(1 - (y - 50) / 60, 0, 1)
    return pad, wedge, flank, depth, near_fine

def dome(x, y, spec):
    cx, cy, sl, sr, sy, h = spec
    sx = np.where(x < cx, sl, sr)
    return h * np.exp(-((x - cx) / sx) ** 2 - ((y - cy) / sy) ** 2)

def relief(x, y):
    wa = math.radians(P['wind']); cw, sw = math.cos(wa), math.sin(wa)
    u = x * cw + y * sw; v = -x * sw + y * cw
    pad, wedge, flank, depth, near_fine = masks(x, y)
    scr = np.abs(x) / (0.429 * np.maximum(y + 24, 2.0))
    calm = np.clip(1 - (y + 8) / 30.0, 0.3, 1.0)                                # small relief calms quickly with distance
    wu = fbm(x / 11.0, y / 11.0, 3, 501); wv = fbm(x / 11.0 + 7.3, y / 11.0 - 2.1, 3, 502)
    uu = u + 3.2 * wu; vv = v + 3.2 * wv
    n1 = fbm(uu / P['drift_len'], vv / P['drift_wid'], 4, 511)
    crest = 1 - np.abs(fbm(uu / (P['drift_len'] * 0.8), vv / (P['drift_wid'] * 0.75), 3, 512)); crest = crest ** 3
    drifts = 0.6 * n1 + 0.55 * (crest - 0.3)
    kn = fbm(uu / P['knoll_len'], vv / (P['knoll_len'] * 0.7), 3, 521, gain=0.45)
    knolls = np.maximum(kn + 0.2, 0) ** 1.4
    hum = fbm(x / 1.4, y / 1.4, 3, 531, gain=0.45)
    sc = fbm(uu / P['scour_len'], vv / P['scour_wid'], 3, 541)
    grooves = -(1 - np.abs(sc)) ** 6 * sstep(0.1, 0.45, fbm(x / 7, y / 7, 2, 542))
    swell = fbm(x / 3.6, y / 3.6, 2, 551)
    # far knolls: two octaves only, so the horizon is 3-4 broad domes and not a saw
    fk = fbm(uu / 44.0, vv / 30.0, 2, 571, gain=0.4)
    far_knolls = np.maximum(fk + 0.15, 0) ** 1.3 * P['far_knoll_amp'] * sstep(8.0, 70.0, y) * (0.55 + 0.45 * sstep(0.1, 0.6, scr))
    # b's broad irregular hills: one or two large forms in the mid field, softplus so they are rounded with flats between
    hl = fbm(x / P['hill_len'] + 0.6 * wu, y / (P['hill_len'] * 0.75), 2, 581, gain=0.5)
    hills = softplus(hl, 3.0) * sstep(4.0, 18.0, y) * np.clip((140 - y) / 60, 0, 1) * (1 - 0.7 * np.exp(-(x / 9.0) ** 2))
    near_knoll = 1 - 0.7 * sstep(4.0, -8.0, y)                                   # the near banks are domes, not knoll fields
    A_k = P['knoll_amp'] * np.maximum(flank, P['mid_knoll'] * depth) * pad * wedge * near_knoll
    A_d = P['drift_amp'] * (0.25 + 0.75 * pad) * (0.45 + 0.55 * wedge) * (1 + 1.2 * depth)
    rise = P['flank_rise'] * flank ** 1.6 * (0.7 + 0.6 * fbm(x / 20, y / 20, 2, 561)) * wedge
    D = drifts * A_d + knolls * A_k + swell * P['swell_amp'] * (0.3 + 0.7 * pad) * (0.75 + 0.25 * wedge) * calm + rise + far_knolls
    D += hills * P['hill_amp']
    D += (hum * P['hump_amp'] * (0.35 + 0.65 * pad) * (0.8 + 0.2 * wedge) + grooves * P['scour_amp'] * pad) * near_fine * calm
    fm = np.maximum(fbm(x / 3.5, y / 3.5, 3, 591) + 0.06, 0) ** 1.2
    D += fm * P['fg_mound_amp'] * sstep(-2.0, -9.0, y) * (0.6 + 0.4 * sstep(0.2, 0.7, scr)) * (1 - 0.6 * sstep(-2.0, -7.0, x))
    dl = dome(x + 0.8 * fbm(x / 6.0, y / 6.0, 2, 603), y + 0.6 * fbm(x / 6.0 + 3.1, y / 6.0, 2, 604), DOME_L); D += dl * (1 + 0.12 * fbm(x / 2.5, y / 2.5, 2, 601))
    D -= (hum * P['hump_amp'] + fm * P['fg_mound_amp'] * 0.5) * sstep(0.3, 0.8, dl / DOME_L[5]) * near_fine   # a rounded dome, not lumps on a dome
    D -= 0.25 * sstep(1.0, -5.0, y) * (1 - pad)                                 # the near plain sits a little under the pad: relief has room under the cap
    D += dome(x, y, SWELL_R) * (1 + 0.15 * fbm(x / 3.0, y / 3.0, 2, 602)) * pad
    D += dome(x, y, FAR_L)
    inw = np.where(y < 0.5, 1 - sstep(0.0, 3.5, np.abs(x) - 2.8 * np.clip((y + 24) / 24, 0, 1) - 0.3), 0.0)
    tt = np.clip((y + 24) / 24, 0, 1)
    cap = (-2.5 - 0.55 * tt) - 0.34 - base_at(x, y)                               # 0.34 under the camera -> logo-bottom sightline, whatever the base
    Dw = D * (1 - 0.25 * inw)                                                     # smaller relief inside the wedge, so it rarely meets the cap
    k = 0.30; Dc = -k * np.logaddexp(-Dw / k, -cap / k)
    return D * (1 - inw) + Dc * inw

def scarp_one(x, y, cx, cy, R, ang, h, lipw=0.08, recover=True, lip=0.15):
    dx = x - cx; dy = y - cy; r = np.hypot(dx, dy); th = np.arctan2(dy, dx)
    da = np.abs((th - ang + np.pi) % (2 * np.pi) - np.pi)
    arc = 1 - sstep(0.35, 0.85, da)                                               # the open side of the crescent faces the camera
    drop = sstep(R + lipw, R - lipw, r)                                           # crisp face at the rim
    floor_ = (0.45 + 0.55 * (r / R) ** 2) if recover else 1.0                    # a shallow bowl, deepest just inside the rim
    rim = np.exp(-((r - R - 1.6 * lipw) / (2.6 * lipw)) ** 2)                    # a small raised lip just outside the crest, catches the key
    return -h * arc * drop * floor_ + lip * h * arc * rim

def scarps(x, y):
    """Crescent wind scarps: a crisp drop at the rim into a shallow pit that recovers towards the centre, with a small lip."""
    z = np.zeros_like(x)
    for cx, cy, R, ang, h in SCARPS: z += scarp_one(x, y, cx, cy, R, ang, h)
    cx, cy, R, ang, h = DOME_SCARP
    # the dome's lee face: the drop does not recover, and it fades out along the horns with the dome's own height
    w = sstep(0.45, 0.80, dome(x, y, DOME_L) / DOME_L[5])                        # only on the dome's body, gone before the sight wedge
    z += scarp_one(x, y, cx, cy, R, ang, h, lipw=0.45, recover=False, lip=0.20) * w
    return z

UX0, UY0, US, UN = -72.0, -32.0, 0.08, 1800
def build_height():
    fn = os.path.join(CACHE, 'hgt_%s.npz' % os.environ.get('FF_TAG', 'v2'))
    if os.path.exists(fn) and not os.environ.get('FF_REBUILD'):
        z = np.load(fn); log('heights from cache', fn); return z['hgt'], z['uni']
    ux = UX0 + np.arange(UN) * US; uy = UY0 + np.arange(UN) * US
    UXg, UYg = np.meshgrid(ux, uy)
    Hb = base_at(UXg, UYg); Dr = relief(UXg, UYg); H0 = Hb + Dr
    log('uniform relief built')
    k = P['erode_k']
    He = T.erode((H0 * k).copy(), P['erode_drops'], 9, inertia=0.25, cap=3.0, erosion=0.25, deposit=0.12, evap=0.02, life=60, radius=2) / k
    dE = He - H0
    padm, *_ = masks(UXg, UYg)
    bx = np.minimum(UXg - UX0, UX0 + UN * US - UXg); by = np.minimum(UYg - UY0, UY0 + UN * US - UYg)
    dE *= sstep(0, 8, np.minimum(bx, by)) * padm * (1 - 0.6 * sstep(-6.0, -14.0, UYg)) * (1 - sstep(0.2, 0.6, dome(UXg, UYg, DOME_L) / DOME_L[5]))   # no benching on the near plain or the dome
    log('eroded: delta range %.3f %.3f' % (dE.min(), dE.max()))
    PX, PY = ground_grid(NP, NP)
    base_h = base_at(PX, PY)
    D = relief(PX, PY)
    fx = np.clip((PX - UX0) / US, 0, UN - 1.001); fy = np.clip((PY - UY0) / US, 0, UN - 1.001)
    x0 = np.floor(fx).astype(int); y0 = np.floor(fy).astype(int); ax = fx - x0; ay = fy - y0
    dEg = (dE[y0, x0] * (1 - ax) + dE[y0, x0 + 1] * ax) * (1 - ay) + (dE[y0 + 1, x0] * (1 - ax) + dE[y0 + 1, x0 + 1] * ax) * ay
    inside = (PX > UX0) & (PX < UX0 + UN * US) & (PY > UY0) & (PY < UY0 + UN * US)
    Dm = D + np.where(inside, dEg, 0)
    wf = sstep(4.0, 25.0, PY); Dm = Dm * (1 - wf) + gaussian_filter(Dm, 3.0) * wf   # no crisp crests past the mid field (3 grid rows ~ 0.6-1.4 units there)
    hgt = base_h + Dm
    pad, *_ = masks(PX, PY)
    sel = pad < 0.05
    off = LOGO_Z - hgt[sel].mean(); hgt += off * (1 - pad)
    log('logo pad mean %.3f -> %.3f (offset %.3f), pad range %.3f..%.3f' % (LOGO_Z - off, hgt[sel].mean(), off, hgt[sel].min(), hgt[sel].max()))
    hgt += scarps(PX, PY)                                                         # after erosion so the lips stay crisp
    uni = (H0 + dE).astype(np.float32)
    np.savez(fn, hgt=hgt.astype(np.float32), uni=uni)
    return hgt, uni

def sightline_check(hgt):
    PX, PY = ground_grid(NP, NP); cam = np.array([0, -24.0, -2.5]); worst = 9
    for lx in np.linspace(-2.8, 2.8, 15):
        for t in np.linspace(0.05, 0.98, 200):
            p = cam + t * (np.array([lx, 0, -3.05]) - cam)
            r_ = int(round((1 - ((p[1] + 30) / 450) ** (1 / 2.2)) * (NP - 1))); c_ = int(round((p[0] / (34 + 1.25 * (p[1] + 30)) + 1) / 2 * (NP - 1)))
            worst = min(worst, p[2] - hgt[r_, c_])
    return worst

def ground_at_grid(hgt, x, y):
    t_ = ((y + 30) / 450) ** (1 / 2.2); r_ = int(round((1 - t_) * (NP - 1)))
    w_ = 34 + 1.25 * (y + 30); c_ = int(round((x / w_ + 1) / 2 * (NP - 1)))
    if 0 <= r_ < NP and 0 <= c_ < NP: return hgt[r_, c_]
    return None

if MODE == 'terrain':
    hgt, uni = build_height()
    gy, gx = np.gradient(uni / US)
    L = np.array([-0.47, 0.67, 0.57]); L /= np.linalg.norm(L)
    nrm = np.stack([-gx, -gy, np.ones_like(gx)], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    sh = np.clip(nrm @ L, 0, 1) * 0.8 + 0.2 * nrm[..., 2]
    from PIL import Image
    Image.fromarray((np.clip(sh[::-1], 0, 1) * 255).astype(np.uint8)).resize((900, 900)).save(os.path.join(CACHE, 'hillshade.png'))
    log('sightline clearance (min, units):', round(sightline_check(hgt), 3))
    sys.exit(0)

# ================================================================== Blender scene
import bpy
from mathutils import Vector
hgt, uni = build_height()
log('sightline clearance (min, units):', round(sightline_check(hgt), 3))
SAMPLES = int(sys.argv[3]) if len(sys.argv) > 3 else 24
CRUMB = os.environ.get('FF_CRUMB', '0' if MODE == 'bake' else '1') == '1'        # fine crumb off in the bake (page adds its own)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 0
sc.cycles.volume_bounces = 0; sc.cycles.transparent_max_bounces = 4
sc.render.threads_mode = 'FIXED'; sc.render.threads = int(os.environ.get('FF_THREADS', '3'))

# lamps: a soft warm-neutral key from the back-left and high, so faces towards the camera fall into soft shade (igloo's
# dome crests are lit lines with the near face in shade); a very weak neutral fill from the camera side keeps the shade
# from going flat
KEY = dict(el=env('FF_KEY_EL', 30), rot=env('FF_KEY_ROT', -46), e=env('FF_KEY_E', 1.3), c=(1.0, 0.97, 0.90), ang=env('FF_KEY_ANG', 7.0))
FILL = dict(el=30, rot=190, e=env('FF_FILL_E', 0.12), c=(0.94, 0.96, 1.0), ang=20)
SKY_FILL = env('FF_SKY', 0.30)
def lamp(name, spec):
    ld = bpy.data.lights.new(name, 'SUN'); ld.energy = spec['e']; ld.color = spec['c']; ld.angle = math.radians(spec['ang'])
    lo = bpy.data.objects.new(name, ld); sc.collection.objects.link(lo); lo.rotation_mode = 'QUATERNION'
    e_, r_ = math.radians(spec['el']), math.radians(spec['rot'])
    d_ = (math.sin(r_) * math.cos(e_), math.cos(r_) * math.cos(e_), math.sin(e_))
    lo.rotation_quaternion = Vector((-d_[0], -d_[1], -d_[2])).to_track_quat('-Z', 'Y')
    return lo
lamp('key', KEY); lamp('fill', FILL)

# world: a blue-grey overcast dome for indirect rays (bluer in the shade, as igloo's), black to the camera
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True; wn = wd.node_tree.nodes; wl = wd.node_tree.links
bgn = wn['Background']
lp = wn.new('ShaderNodeLightPath'); tcw = wn.new('ShaderNodeTexCoord'); sz = wn.new('ShaderNodeSeparateXYZ'); wl.new(tcw.outputs['Generated'], sz.inputs[0])
ramp = wn.new('ShaderNodeValToRGB'); wl.new(sz.outputs['Z'], ramp.inputs['Fac'])
E = ramp.color_ramp.elements
E[0].position, E[0].color = 0.0, (0.50, 0.60, 0.84, 1)
E[1].position, E[1].color = 0.6, (0.40, 0.52, 0.86, 1)
mixw = wn.new('ShaderNodeMix'); mixw.data_type = 'RGBA'; wl.new(lp.outputs['Is Camera Ray'], mixw.inputs['Factor'])
wl.new(ramp.outputs['Color'], mixw.inputs[6]); mixw.inputs[7].default_value = (0, 0, 0, 1)
wl.new(mixw.outputs[2], bgn.inputs['Color']); bgn.inputs['Strength'].default_value = SKY_FILL

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

PX, PY = ground_grid(NP, NP)
ground = grid_mesh('ground', PX, PY, hgt)
log('ground mesh', len(ground.data.vertices))

# ------------------------------------------------------------------ snow material
sm = bpy.data.materials.new('snow'); sm.use_nodes = True; sn = sm.node_tree.nodes; sk = sm.node_tree.links
sb = sn['Principled BSDF']
sb.inputs['Roughness'].default_value = env('FF_ROUGH', 0.55); sb.inputs['Specular IOR Level'].default_value = env('FF_SPEC', 0.35)   # a faint white sheen: igloo's brightest pixels are near neutral
sb.inputs['Diffuse Roughness'].default_value = 0.35
def nd(t, **kw):
    n = sn.new(t)
    for k_, v_ in kw.items(): setattr(n, k_, v_)
    return n
def ln(a, b): sk.new(a, b)
def m_(op, a, b=None, clamp=False):
    n = nd('ShaderNodeMath', operation=op, use_clamp=clamp)
    for i, s in enumerate((a, b)):
        if s is None: continue
        if isinstance(s, (int, float)): n.inputs[i].default_value = s
        else: ln(s, n.inputs[i])
    return n.outputs[0]
def mr(val, a, b, c=0.0, d=1.0, interp='LINEAR'):
    n = nd('ShaderNodeMapRange', interpolation_type=interp)
    n.inputs['From Min'].default_value = a; n.inputs['From Max'].default_value = b
    n.inputs['To Min'].default_value = c; n.inputs['To Max'].default_value = d; ln(val, n.inputs['Value']); return n.outputs['Result']
tc = nd('ShaderNodeTexCoord'); PO = tc.outputs['Object']
sep = nd('ShaderNodeSeparateXYZ'); ln(PO, sep.inputs[0]); OX, OY = sep.outputs['X'], sep.outputs['Y']
rot = nd('ShaderNodeMapping', vector_type='POINT'); rot.inputs['Rotation'].default_value = (0, 0, -math.radians(P['wind'])); ln(PO, rot.inputs['Vector'])
WF = rot.outputs['Vector']
def wind_scaled(sx, sy):
    mp = nd('ShaderNodeMapping', vector_type='POINT'); mp.inputs['Scale'].default_value = (sx, sy, 1.0); ln(WF, mp.inputs['Vector']); return mp.outputs['Vector']
RMAX = 0.45                                                                     # roughness cap on every bump noise
def noise(vec, scale, detail=2.0, rough=0.45, dist=0.0):
    n = nd('ShaderNodeTexNoise', noise_dimensions='3D'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = detail
    n.inputs['Roughness'].default_value = min(rough, RMAX); n.inputs['Distortion'].default_value = dist; ln(vec, n.inputs['Vector']); return n
def voronoi(vec, scale, rand=1.0, feature='F1'):
    n = nd('ShaderNodeTexVoronoi', feature=feature, voronoi_dimensions='3D'); n.inputs['Scale'].default_value = scale
    n.inputs['Randomness'].default_value = rand; ln(vec, n.inputs['Vector']); return n

S = dict(crumb_a=env('FF_CRUMB_A', 0.15), crumb_h=env('FF_CRUMB_H', 0.003), clod_h=env('FF_CLOD_H', 0.012), clod_a=env('FF_CLOD_A', 0.08),
         lump_h=env('FF_LUMP_H', 0.12), streak_a=env('FF_STREAK_A', 0.18), streak_h=env('FF_STREAK_H', 0.004), pit_h=0.03,
         streakc_a=env('FF_STREAKC_A', 0.10), streakc_h=env('FF_STREAKC_H', 0.006), speck_a=env('FF_SPECK_A', 0.12), sparkle=env('FF_SPARK', 0.0))
# distance weights: camera distance ~ Y + 24. Fine grain x1.25 in the nearest rows, x0.7 at the logo pad, gone by the far field
DIST = m_('ADD', OY, 24.0)
near_w = mr(DIST, 9.0, 12.0, 1.25, 1.0)
mid_w = mr(DIST, 12.0, 22.0, 1.0, 0.45)
far_w = mr(DIST, 16.0, 36.0, 1.0, 0.0, 'SMOOTHSTEP')
fine_w = m_('MULTIPLY', m_('MULTIPLY', near_w, mid_w), far_w)
macro_w = mr(DIST, 10.0, 35.0, 1.0, 0.05)                                      # 10-40 px hummocks damped by the mid distance (foreshortening makes them high-frequency there)
geo = nd('ShaderNodeNewGeometry'); gsep = nd('ShaderNodeSeparateXYZ'); ln(geo.outputs['Normal'], gsep.inputs[0])
slope_w = mr(gsep.outputs['Z'], 0.86, 0.98, 0.2, 1.0)                           # streaks and grain are a plain's feature: softer on steep faces
fade_far = mr(OY, 40.0, 160.0, 1.0, 0.2)

# crumb on view-stretched coordinates (along Blender Y): 1.15x (the old 1.5x made the flakes too round on screen)
vst = nd('ShaderNodeMapping', vector_type='POINT'); vst.inputs['Scale'].default_value = (1.0, 1.0 / env('FF_VSTRETCH', 1.25), 1.0); ln(PO, vst.inputs['Vector'])
PV = vst.outputs['Vector']
jit = noise(PV, 14.0, 2.0, 0.45)
jv = nd('ShaderNodeVectorMath', operation='MULTIPLY_ADD'); ln(jit.outputs['Color'], jv.inputs[0])
jv.inputs[1].default_value = (0.03, 0.03, 0.03); ln(PV, jv.inputs[2]); PJ = jv.outputs['Vector']
def domes(vec, scale, k, pw):
    v = voronoi(vec, scale); return m_('POWER', m_('MAXIMUM', m_('SUBTRACT', 1.0, m_('MULTIPLY', v.outputs['Distance'], k)), 0.0), pw), v
G = 28.0
g1, v1 = domes(PJ, G, 1.05, 1.3); g2, v2 = domes(PJ, G * 1.9, 1.15, 1.1)
crumb = m_('ADD', g1, m_('MULTIPLY', g2, 0.55))                                 # 0 .. ~1.5, mean ~0.45
crumb_c = m_('SUBTRACT', crumb, 0.45)
# soft isotropic speckle (2-5 px): a finer noise, blurred by the pixel filter
spk_n = noise(PV, 34.0, 1.0, 0.4)
speck = m_('MULTIPLY', m_('SUBTRACT', spk_n.outputs['Fac'], 0.5), 3.0)
# sastrugi streaks: a fan of radial lines from a point behind the camera (they converge on the vanishing point as igloo's)
DY = m_('ADD', OY, 30.0)
ANG = m_('ARCTAN2', OX, DY)
rad_v = nd('ShaderNodeCombineXYZ'); ln(OX, rad_v.inputs['X']); ln(DY, rad_v.inputs['Y']); rad_v.inputs['Z'].default_value = 0.0
rl = nd('ShaderNodeVectorMath', operation='LENGTH'); ln(rad_v.outputs['Vector'], rl.inputs[0]); RAD = rl.outputs['Value']
wob = noise(PO, 0.25, 2.0, 0.45)
ANGW = m_('ADD', ANG, m_('MULTIPLY', m_('SUBTRACT', wob.outputs['Fac'], 0.5), 0.05))
wsep = nd('ShaderNodeSeparateXYZ'); ln(WF, wsep.inputs[0]); WU, WV = wsep.outputs['X'], wsep.outputs['Y']   # along / across the wind
def streak_field(across, along, seed_off):
    cv = nd('ShaderNodeCombineXYZ'); ln(m_('MULTIPLY', WU, 1.0 / along), cv.inputs['X']); ln(m_('MULTIPLY', m_('ADD', WV, m_('MULTIPLY', m_('SUBTRACT', wob.outputs['Fac'], 0.5), 0.6)), 1.0 / across), cv.inputs['Y'])
    cv.inputs['Z'].default_value = seed_off
    n = noise(cv.outputs['Vector'], 1.0, 2.0, 0.45)
    return m_('MULTIPLY', m_('SUBTRACT', n.outputs['Fac'], 0.5), 3.0)
streak_f = m_('ADD', m_('MULTIPLY', streak_field(0.035, 0.7, 3.7), 0.6), m_('MULTIPLY', streak_field(0.07, 1.0, 5.3), 0.6))   # fine: 4-16 px thick, 20-50 px long on screen (preview only)
streak_c = streak_field(0.18, 1.3, 9.1)                                         # coarse: 0.15-0.3 units thick, kept in the bake
# blotches: soft 0.1-0.3 unit mottling (kept in the bake)
bl_n = noise(PO, 5.5, 2.0, 0.45, 0.0)
clod = m_('MULTIPLY', m_('SUBTRACT', bl_n.outputs['Fac'], 0.5), 4.5)
lu = noise(PO, 1.5, 2.0, 0.45, 0.15)
lump = m_('SUBTRACT', lu.outputs['Fac'], 0.5)
vp = voronoi(PJ, 6.0)                                                           # dimples: 0.1-0.2 unit pits, 10-20 px on screen near the camera (kept in the bake)
pit_shape = mr(vp.outputs['Distance'], 0.0, 0.36, 1.0, 0.0, 'SMOOTHSTEP')
pit_sel = nd('ShaderNodeSeparateColor'); ln(vp.outputs['Color'], pit_sel.inputs[0])
pit = m_('MULTIPLY', m_('MULTIPLY', pit_shape, m_('LESS_THAN', pit_sel.outputs[0], 0.30)), mr(pit_sel.outputs[1], 0.0, 1.0, 0.35, 1.0))
pit = m_('MULTIPLY', pit, mr(DIST, 10.0, 35.0, 1.0, 0.1))
# bump: fine crumb (preview only) + coarse clod + lumps + pits + coarse streaks, macro parts damped with distance
Hfine = m_('MULTIPLY', m_('ADD', m_('MULTIPLY', crumb_c, S['crumb_h'] if CRUMB else 0.0), m_('MULTIPLY', streak_f, S['streak_h'] if CRUMB else 0.0)), fine_w)
Hmac = m_('ADD', m_('ADD', m_('MULTIPLY', lump, S['lump_h']), m_('MULTIPLY', clod, S['clod_h'])), m_('MULTIPLY', streak_c, S['streakc_h']))
Hmac = m_('MULTIPLY', Hmac, macro_w)
Hall = m_('MULTIPLY', m_('ADD', m_('ADD', Hfine, Hmac), m_('MULTIPLY', pit, -S['pit_h'])), fade_far)
bp = nd('ShaderNodeBump'); bp.inputs['Strength'].default_value = 1.0; bp.inputs['Distance'].default_value = 1.0
ln(Hall, bp.inputs['Height']); ln(bp.outputs['Normal'], sb.inputs['Normal'])
# albedo: cool snow, faint broad tone drift, pits a little darker, and the GRAIN (crumb, speckle, streaks) as a multiply
# so shaded faces carry it as much as lit ones. No crevice darkening.
SNOW = (0.82, 0.84, 0.85)
tone = mr(noise(PO, 0.22, 4.0, 0.45).outputs['Fac'], 0.3, 0.7, 0.965, 1.035)
amul = m_('MULTIPLY', tone, mr(pit, 0.0, 1.0, 1.0, 0.86))
amul = m_('MULTIPLY', amul, m_('ADD', 1.0, m_('MULTIPLY', m_('MULTIPLY', clod, S['clod_a'] / 4.5), macro_w)))
amul = m_('MULTIPLY', amul, m_('ADD', 1.0, m_('MULTIPLY', m_('MULTIPLY', m_('MULTIPLY', streak_c, S['streakc_a']), macro_w), slope_w)))
if CRUMB:
    grain = m_('ADD', m_('MULTIPLY', crumb_c, -S['crumb_a']), m_('MULTIPLY', speck, S['speck_a']))
    grain = m_('ADD', grain, m_('MULTIPLY', streak_f, S['streak_a']))
    amul = m_('MULTIPLY', amul, m_('ADD', 1.0, m_('MULTIPLY', m_('MULTIPLY', grain, fine_w), slope_w)))
    # c's sparse soft brightening of the grain tops (balances the dark specks: skew towards igloo's -0.07)
    s1 = nd('ShaderNodeSeparateColor'); ln(v1.outputs['Color'], s1.inputs[0])
    spk = m_('MULTIPLY', mr(g1, 0.45, 1.0, 0.0, 1.0), m_('GREATER_THAN', s1.outputs[1], 0.60))
    amul = m_('MULTIPLY', amul, mr(m_('MULTIPLY', spk, fine_w), 0.0, 1.0, 1.0, 1.0 + S['sparkle']))
cm = nd('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY'); cm.inputs['Factor'].default_value = 1.0
cm.inputs[6].default_value = (*SNOW, 1); cv = nd('ShaderNodeCombineColor'); ln(amul, cv.inputs[0]); ln(amul, cv.inputs[1]); ln(amul, cv.inputs[2])
ln(cv.outputs[0], cm.inputs[7]); ln(cm.outputs[2], sb.inputs['Base Color'])
ground.data.materials.append(sm)
log('material built, crumb', CRUMB)

# ------------------------------------------------------------------ stones (smooth-shaded pebbles, albedo lifted to near-black grey)
STONE_ALB = env('FF_STONE_ALB', 0.26)
stm = bpy.data.materials.new('stone'); stm.use_nodes = True; stn = stm.node_tree.nodes; stl = stm.node_tree.links
stb = stn['Principled BSDF']; stb.inputs['Base Color'].default_value = (STONE_ALB, STONE_ALB * 1.02, STONE_ALB * 1.08, 1); stb.inputs['Roughness'].default_value = 0.85
stb.inputs['Specular IOR Level'].default_value = 0.15
snz = stn.new('ShaderNodeTexNoise'); snz.inputs['Scale'].default_value = 30; snz.inputs['Detail'].default_value = 4
sbp = stn.new('ShaderNodeBump'); sbp.inputs['Distance'].default_value = 0.01; sbp.inputs['Strength'].default_value = 0.3
stl.new(snz.outputs['Fac'], sbp.inputs['Height']); stl.new(sbp.outputs['Normal'], stb.inputs['Normal'])
rng = np.random.default_rng(21)
bases = []
for k in range(4):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0, 0, -900 - k * 5)); bo = bpy.context.active_object
    tv = bpy.data.textures.new('st%d' % k, 'VORONOI'); tv.noise_scale = 0.7 + k * 0.15
    dm = bo.modifiers.new('d', 'DISPLACE'); dm.texture = tv; dm.strength = 0.35
    bpy.ops.object.modifier_apply(modifier='d'); bo.data.materials.append(stm)
    for p in bo.data.polygons: p.use_smooth = True
    bases.append(bo)
stones = []; stone_pos = []
def screen_xy(p, high=False):
    cam = np.array((0, -24, -0.3) if high else (0, -24, -2.5)); f = np.array((0, 0, -1.0)) - cam; f /= np.linalg.norm(f)
    r = np.array((1.0, 0, 0)); u = np.cross(r, f); v = np.asarray(p) - cam; d = v @ f
    if d <= 0.5: return None
    sx = 640 + (v @ r) / (d * math.tan(math.radians(15)) * 1.6) * 640; sy = 400 - (v @ u) / (d * math.tan(math.radians(15))) * 400
    return sx, sy, d
def in_frame(p, high=False):
    s = screen_xy(p, high)
    if s is None: return False
    sx, sy, d = s
    return 0 <= sx < 1280 and 0 <= sy < 800 and not (460 <= sx <= 820 and 150 <= sy <= 530)
def add_stone(x, y, s, sink=0.45):
    z = ground_at_grid(hgt, x, y)
    if z is None: return
    bi = len(stones) % 4
    o = bases[bi].copy(); o.data = bases[bi].data.copy(); sc.collection.objects.link(o)
    o.location = (x, y, z - s * sink); o.scale = (s * (0.8 + rng.random() * 0.6), s * (0.7 + rng.random() * 0.6), s * (0.5 + rng.random() * 0.3))
    o.rotation_euler = (rng.random() * 0.5, rng.random() * 0.5, rng.random() * 6.28); stones.append(o); stone_pos.append((x, y, z, s))
NSTONES = 70; tries = 0; n_vis = 0
while len(stones) < NSTONES and tries < 40000:
    tries += 1
    y = -19 + rng.random() ** 1.5 * 75; x = (rng.random() - 0.5) * 2 * (6 + 0.9 * (y + 24))
    if abs(x) < 4.5 and -3 < y < 3: continue
    d = y + 24
    if y < 12 and x > 0.22 * d: continue                                          # never on the lit right bank
    s = 0.02 + rng.random() ** 3 * (0.07 + 0.004 * max(y, 0))
    z = ground_at_grid(hgt, x, y)
    if z is None: continue
    sz = 2 * s * 1493 / d
    vis = in_frame((x, y, z)) and sz >= 5.0
    if vis and (n_vis >= 6 or sz > 20): continue
    add_stone(x, y, s); n_vis += vis
for cx, cy, R, ang, h in SCARPS:                                                  # a small dark stone at the base of each lip
    rr = R * 0.82
    add_stone(cx + rr * math.cos(ang + 0.2), cy + rr * math.sin(ang + 0.2), 0.035 + 0.015 * rng.random(), sink=0.35)
for b in bases: bpy.data.objects.remove(b)
bpy.ops.object.select_all(action='DESELECT')
for o in stones: o.select_set(True)
bpy.context.view_layer.objects.active = stones[0]
bpy.ops.object.join(); st = bpy.context.active_object; st.name = 'stones'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
log('stones', len(stones), 'verts', len(st.data.vertices))
log('stones inside the hero frame (outside the logo box):', sum(in_frame(p_[:3]) for p_ in stone_pos), 'of', len(stone_pos), '; pebbles >= 5 px:', n_vis)

# ------------------------------------------------------------------ shadow-only proxy of the floating logo
SHADOW_K = env('FF_SHADOW', 0.3)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0)); box = bpy.context.active_object; box.name = 'logo_shadow_proxy'
box.scale = (5.6, 1.2, 6.1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
pm = bpy.data.materials.new('proxy'); pm.use_nodes = True; pn = pm.node_tree.nodes; pl = pm.node_tree.links
pn.remove(pn['Principled BSDF'])
tr = pn.new('ShaderNodeBsdfTransparent'); df = pn.new('ShaderNodeBsdfDiffuse'); df.inputs['Color'].default_value = (0.12, 0.15, 0.22, 1)   # a little blue bounce, so the contact shade is not warm
mx = pn.new('ShaderNodeMixShader'); mx.inputs['Fac'].default_value = SHADOW_K
pl.new(tr.outputs[0], mx.inputs[1]); pl.new(df.outputs[0], mx.inputs[2]); pl.new(mx.outputs[0], pn['Material Output'].inputs['Surface'])
box.data.materials.append(pm)
box.visible_camera = False; box.visible_glossy = False; box.visible_transmission = False; box.visible_volume_scatter = False
box.visible_diffuse = True; box.visible_shadow = False      # no hard sun shadow: it only takes the sky away under the logo (soft contact darkening)
log('shadow proxy placed')

def set_camera(high=False):
    cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
    loc = (0, -24, -0.3) if high else (0, -24, -2.5); tgt = (0, 0, -1.0)
    cam.location = loc; cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y')
    cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(30); cd.clip_start = 0.1; cd.clip_end = 3000
    return cam

# ================================================================== preview: perspective render from the hero camera
if MODE == 'preview':
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'floor_final.png')
    W = int(sys.argv[4]) if len(sys.argv) > 4 else 1280; H = int(sys.argv[5]) if len(sys.argv) > 5 else 800
    set_camera(os.environ.get('FF_CAM') == 'high')
    sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
    sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'; sc.render.filter_size = 1.5
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.02
    if os.environ.get('FF_BORDER'):                                              # diagnostic crop: x0,y0,x1,y1 (0..1, y up)
        b_ = [float(v) for v in os.environ['FF_BORDER'].split(',')]
        sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_min_y, sc.render.border_max_x, sc.render.border_max_y = b_
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_depth = '8'; sc.render.filepath = out
    bpy.ops.render.render(write_still=True); log('render done', out)
    if not os.environ.get('FF_NODEPTH'):
        dm_ = bpy.data.materials.new('depth'); dm_.use_nodes = True; dn = dm_.node_tree.nodes; dl = dm_.node_tree.links
        dn.remove(dn['Principled BSDF']); cdn = dn.new('ShaderNodeCameraData'); em = dn.new('ShaderNodeEmission')
        dl.new(cdn.outputs['View Distance'], em.inputs['Strength']); dl.new(em.outputs[0], dn['Material Output'].inputs['Surface'])
        bpy.context.view_layer.material_override = dm_
        bgn.inputs['Strength'].default_value = 0.0
        for o in bpy.data.objects:
            if o.type == 'LIGHT': o.hide_render = True
        box.hide_render = True
        sc.cycles.samples = 1; sc.cycles.use_denoising = False; sc.render.filter_size = 0.01; sc.cycles.use_adaptive_sampling = False
        sc.view_settings.view_transform = 'Raw' if 'Raw' in [i.identifier for i in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Standard'
        sc.render.image_settings.file_format = 'OPEN_EXR'; sc.render.image_settings.color_depth = '32'
        dpath = os.path.splitext(out)[0] + '_depth.exr'; sc.render.filepath = dpath
        bpy.ops.render.render(write_still=True)
        im = bpy.data.images.load(dpath); buf = np.zeros(W * H * 4, np.float32); im.pixels.foreach_get(buf)
        dep = buf.reshape(H, W, 4)[::-1, :, 0]; dep[dep <= 0] = np.inf
        np.save(os.path.splitext(out)[0] + '_depth.npy', dep.astype(np.float32)); os.remove(dpath)
        log('depth saved')
    sys.exit(0)

# ================================================================== bake + export (moon_final2 format), page LUT applied
OUTDIR = sys.argv[2]; os.makedirs(OUTDIR, exist_ok=True)
np.save(os.path.join(OUTDIR, 'moon_hgt.npy'), hgt.astype(np.float32))
TEX = int(sys.argv[4]) if len(sys.argv) > 4 else 4096
img = bpy.data.images.new('ground_bake', TEX, TEX, alpha=False)
tn = sn.new('ShaderNodeTexImage'); tn.image = img; sn.active = tn
bpy.ops.object.select_all(action='DESELECT'); ground.select_set(True); bpy.context.view_layer.objects.active = ground
sc.cycles.bake_type = 'COMBINED'; sc.render.bake.margin = 4
bpy.ops.object.bake(type='COMBINED')
raw_path = os.path.join(CACHE, 'ground_bake_raw.png')
img.filepath_raw = raw_path; img.file_format = 'PNG'; img.save()
log('ground baked (raw ->', raw_path, ')')
sn.remove(tn)
ca = st.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT'); st.data.color_attributes.active_color = ca
st.data.attributes.active_color = ca
bpy.ops.object.select_all(action='DESELECT'); st.select_set(True); bpy.context.view_layer.objects.active = st
sc.render.bake.target = 'VERTEX_COLORS'
bpy.ops.object.bake(type='COMBINED')
log('stones baked')

# the page LUT (and the depth haze from the hero camera) applied to the bake, texel by texel
import floor_final_post as FP
from PIL import Image
CAM = np.array([0.0, -24.0, -2.5])
Image.MAX_IMAGE_PIXELS = None
tex = np.asarray(Image.open(raw_path).convert('RGB')).astype(np.float64) / 255          # row 0 = v 1 = grid row 0 (far)
if not os.environ.get('FF_NOPOST'):
    tex = FP.apply_lut(tex)
    # camera distance per texel row/column: texel (i, j) -> grid (r, c) = (i / (TEX-1) * (NP-1), j / (TEX-1) * (NP-1))
    ri = np.linspace(0, NP - 1, TEX); r0 = np.floor(ri).astype(int); r1 = np.minimum(r0 + 1, NP - 1); fr = (ri - r0)[:, None]
    ci = np.linspace(0, NP - 1, TEX); c0 = np.floor(ci).astype(int); c1 = np.minimum(c0 + 1, NP - 1); fc = (ci - c0)[None, :]
    for i0 in range(0, TEX, 512):                                                           # in row blocks to bound memory
        sl = slice(i0, i0 + 512)
        rr0, rr1, ffr = r0[sl], r1[sl], fr[sl]
        def sampb(A):
            return (A[rr0][:, c0] * (1 - fc) + A[rr0][:, c1] * fc) * (1 - ffr) + (A[rr1][:, c0] * (1 - fc) + A[rr1][:, c1] * fc) * ffr
        dx = sampb(PX) - CAM[0]; dy = sampb(PY) - CAM[1]; dz = sampb(hgt) - CAM[2]
        tex[sl] = FP.haze(tex[sl], np.sqrt(dx * dx + dy * dy + dz * dz))
Image.fromarray(np.round(np.clip(tex, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUTDIR, 'ground_bake.png'))
log('ground_bake.png written (post applied: %s)' % (not os.environ.get('FF_NOPOST')))

NR, NC = 400, 320
gPX, gPY = ground_grid(NR, NC)
ri = np.linspace(0, NP - 1, NR); ci = np.linspace(0, NP - 1, NC)
r0 = np.floor(ri).astype(int); c0 = np.floor(ci).astype(int); r1 = np.minimum(r0 + 1, NP - 1); c1 = np.minimum(c0 + 1, NP - 1)
fr = (ri - r0)[:, None]; fc = (ci - c0)[None, :]
Z = (hgt[r0][:, c0] * (1 - fc) + hgt[r0][:, c1] * fc) * (1 - fr) + (hgt[r1][:, c0] * (1 - fc) + hgt[r1][:, c1] * fc) * fr
zmin, zmax = float(Z.min()), float(Z.max())
np.round((Z - zmin) / (zmax - zmin) * 65535).astype('<u2').tofile(os.path.join(OUTDIR, 'ground_h.bin'))
me_ = st.data
co = np.zeros(len(me_.vertices) * 3, np.float32); me_.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
p3 = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)
lo_, hi_ = p3.min(0), p3.max(0)
np.round((p3 - lo_) / (hi_ - lo_) * 65535 - 32768).astype('<i2').tofile(os.path.join(OUTDIR, 'stones_p.bin'))
cl_ = np.zeros(len(me_.vertices) * 4, np.float32); ca.data.foreach_get('color', cl_); cl_ = cl_.reshape(-1, 4)[:, :3]
srgb = np.where(cl_ <= 0.0031308, cl_ * 12.92, 1.055 * np.power(np.clip(cl_, 0, None), 1 / 2.4) - 0.055)
srgb = np.clip(srgb, 0, 1)
if not os.environ.get('FF_NOPOST'):
    srgb = FP.apply_lut(srgb)
    srgb = FP.haze(srgb, np.linalg.norm(co - CAM, axis=1))
np.round(np.clip(srgb, 0, 1) * 255).astype(np.uint8).tofile(os.path.join(OUTDIR, 'stones_c.bin'))
me_.calc_loop_triangles()
tri = np.zeros(len(me_.loop_triangles) * 3, np.int32); me_.loop_triangles.foreach_get('vertices', tri)
tri = tri.reshape(-1, 3)
idx_t = '<u2' if len(me_.vertices) < 65536 else '<u4'
tri.astype(idx_t).tofile(os.path.join(OUTDIR, 'stones_i.bin'))
json.dump({'ground': {'nr': int(Z.shape[0]), 'nc': int(Z.shape[1]), 'zmin': zmin, 'zmax': zmax},
           'stones': {'verts': int(len(me_.vertices)), 'tris': int(len(tri)), 'idx': 'u16' if idx_t == '<u2' else 'u32',
                      'lo': [float(v) for v in lo_], 'hi': [float(v) for v in hi_]}},
          open(os.path.join(OUTDIR, 'moon_meta.json'), 'w'))
sky_src = os.path.join(HERE, 'moon_final2', 'sky.png')
if os.path.exists(sky_src): shutil.copyfile(sky_src, os.path.join(OUTDIR, 'sky.png'))
log('exported', len(me_.vertices), 'stone verts', len(tri), 'tris; sky copied', os.path.exists(sky_src))
