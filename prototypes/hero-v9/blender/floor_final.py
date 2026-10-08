# floor_final: the igloo-style snow floor for the Skreed hero. Variant a (shape first) with the grafts the three
# judges agreed on, reworked after the fourth round of feedback (v4, 2026-10-08; v3 kept as floor_final_v3.py):
#   v4 changes  1 far ridge: three layers in igloo's proportion (rim y70 amp 2.8, mid y140 amp 8 (1.5x on screen), far
#                 mass y245 amp 26 (2.5-3x) with a 0.75 x 80-unit two-octave crest, knobs under 10 %), each with a lobed
#                 front foot and foothill mounds, a steeper back (no lit plateau), two more dunes at y48/62 over the rim's
#                 foot; the post haze is a continuous ramp (k 0.0055 toward luma 199): rim ~140, mid ~152, far ~175
#               2 mid field: continuous crescent fronts (two-octave along-crest, hummocks 0.06, a cusp lee profile p 1.25
#                 so each crest is a lip over a shaded face), D7/D8 on the right bank, the mid scarps' lips 0.3 x wider
#               3 left mass: DOME_L sy 5.2 / h 1.3, the lee scarp 0.22 over 0.85 units, a 0.2 spot fill from the camera's
#                 right aimed at the lee, crust lumps (two F1 sizes, bump 0.18, albedo +0.15) in a 2.5-unit clustered band
#                 over the dome's lip (crest mask B channel, the left mass only)
#               4 pits: three ellipses of different size (2x), aspect, rotation, depth and spacing, two soft hollows, and
#                 wind streaks (4:1 at 140 deg, across the key) on the right-hand foreground only
#               5 highlights: a tanh shoulder in the post (0.66 -> ceiling 0.845), nothing on the floor passes 215
#               bake: the page's own fog (linear 60..430 toward #050506) is divided out of the texture through the page's
#                 0.45 c^0.7 curve (gain capped at 2.4), so the far planes keep the Blender tone on the page
# v3 (2026-10-08):
#   v3 changes  no streak layer at all (every noise layer is isotropic or at most 1.5:1), the far-field smoothing is an
#              isotropic world-space blur on the uniform grid (no grid-space blur), the sightline cap relaxes over
#              y 0.5..4.5 instead of switching at y 1.5 (the terrace seam), four crescent dunes stack the mid field
#              (steep lee face to the camera, soft windward back), eight crescent scarps with 0.2-0.55 lips, three far
#              ridge planes at y 75/135/240 lifted by a lighter haze, the left dome moved left with a gentle right flank,
#              crust chunks on crests and irregular shadow pockets replace the round pock stamp, key swung towards
#              the side and warmed with a less saturated sky (lit B/R towards 1.15)
#   v3 final   (continued session) the lee face and the left mound are NOT under-lit relative to the plain: in raw linear
#              luma the lee box x0-380 y520-640 is 0.85 of the near plain (igloo 0.77-0.80), and measure3 gives igloo's own
#              lee box 0.37-0.40 after display (ours 0.36). A stronger camera-side fill (p8: fill 0.45) or more raw contrast
#              with a refit (p9: sky 0.16, key 1.7, gamma 1.67) leave the post value at 0.36 because the LUT pins the near
#              quantiles to igloo's, so the p7 lighting and LUT stay. The far-ridge "centre 116" was the logo-box mask in
#              measure3 (its silhouette there is the mid field at y530); under the real silhouette the planes read 135/151/165.
# earlier rounds:
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
    wind=62.0,                                          # wind direction, degrees from +x towards +y (only orients the gentle 1.33:1 drift field now)
    drift_amp=0.30, drift_len=6.0, drift_wid=4.5,       # drift mottling, at most 1.33:1 (v3: no threads)
    knoll_amp=env('FF_KNOLL', 1.6), knoll_len=7.5, flank_rise=0.8, far_knoll_amp=env('FF_FARKNOLL', 5.0),
    mid_knoll=env('FF_MIDKNOLL', 0.30),                 # how much of the knoll field reaches the mid-field centre (v3: more, the mid field has relief)
    hill_amp=env('FF_HILL', 2.2), hill_len=18.0,        # b's broad irregular hills in the mid field
    scour_amp=0.0, scour_len=2.2, scour_wid=0.55,       # v3: the 4:1 scour grooves are off
    hump_amp=env('FF_HUMP', 0.15), swell_amp=0.42, fg_mound_amp=env('FF_FGM', 0.55),
    erode_drops=int(os.environ.get('FF_DROPS', '160000')), erode_k=1.0,
    far_blur=env('FF_FARBLUR', 12.0),                   # sigma (grid px of 0.82 units) on the far valley
    mid_blur=env('FF_MIDBLUR', 0.6),                    # v3: isotropic world-space sigma (units) on the noise relief past the mid field
    cap_k=env('FF_CAPK', 0.6),                          # v3: softness (units) of the sightline cap
)
# the foreground dome (left of centre) and the broad right swell: (cx, cy, sx_left, sx_right, sy, height)
# v4: the dome's camera-facing slope is gentler (sy 4 -> 5.2) so the mound catches the sky dome
DOME_L = (env('FF_DLX', -6.0), env('FF_DLY', -12.3), 5.5, env('FF_DLSR', 4.8), env('FF_DLSY', 5.2), env('FF_DLH', 1.3))
SWELL_R = (env('FF_SRX', 9.5), env('FF_SRY', 3.0), 7.5, 7.5, 6.0, env('FF_SRH', 2.0))
FAR_L = (-15.0, 14.0, 9.0, 9.0, 8.0, 2.4)                                        # a broad far-left hill behind the dome
# crescent wind scarps: (x, y, radius, facing angle rad, lip height[, aspect, rotation]). The first three sit in the
# foreground plain (each gets a small stone at its foot) and are v4 ellipses of different size (2x), aspect, orientation,
# depth and spacing; the rest stack the mid field with low lips (v4: 0.3 of the drop, so they never clip)
SCARPS = [(-0.9, -12.7, 1.0, math.pi / 2 + 0.45, env('FF_SCARP', 0.14), 0.62, 0.55), (2.7, -9.1, 0.72, math.pi / 2 - 0.3, 0.27, 0.85, -0.4),
          (1.9, -16.7, 0.55, math.pi / 2 + 0.05, 0.13, 0.7, 0.15),
          (-7.5, -6.5, 1.3, math.pi / 2 + 0.3, 0.30), (6.8, -4.0, 1.4, math.pi / 2 - 0.2, 0.32),
          (-3.2, 6.8, 1.7, math.pi / 2, 0.36), (6.5, 14.5, 2.1, math.pi / 2 - 0.1, 0.42), (-9.5, 16.5, 2.3, math.pi / 2 + 0.2, 0.45)]
N_FG_SCARPS = 3
# v4: two softer hollows in the foreground plain (x, y, sx, sy, rotation, depth): no lip, a gaussian dish
HOLLOWS = [(4.1, -13.6, 1.4, 0.8, 0.35, 0.11), (-2.7, -17.6, 0.95, 0.55, -0.25, 0.07)]
# v4: the dome's lee face is lower and wider (0.42/0.45 -> 0.22/0.85), a slope that catches the sky, not a terrace wall
DOME_SCARP = (DOME_L[0] + 0.3, DOME_L[1] - 2.4, 3.0, math.pi / 2, env('FF_DSCARP', 0.22))
# crescent dunes stacking the mid field: (x0, y0, half-width sx, height, crescent curvature, seed). The crest bows away
# from the camera at the centre and the horns trail towards it (concave downwind face), the lee face is steep.
# v4: the fronts are continuous (two-octave peaks and saddles, a trace of hummocks), 150-400 px wide on screen, and two
# more at y 48 and 62 overlap the near rim's foot so its base is never a straight line
DUNES = [(-6.0, 5.0, 7.0, env('FF_D1', 0.8), -1.2, 701), (5.0, 11.0, 9.0, env('FF_D2', 1.5), -1.6, 702),
         (-4.0, 20.0, 12.0, env('FF_D3', 1.5), -2.2, 703), (9.0, 33.0, 15.0, env('FF_D4', 2.0), -2.8, 704),
         (16.0, 48.0, 11.0, env('FF_D5', 2.0), -2.0, 705), (-12.0, 62.0, 12.0, env('FF_D6', 1.8), -2.4, 706),
         (14.0, 7.0, 6.5, env('FF_D7', 2.6), -0.9, 707), (9.5, -2.5, 4.5, env('FF_D8', 1.3), -0.7, 708)]
DUNE_LEE = env('FF_DLEE', 2.0)
DUNE_CUSP = env('FF_DCUSP', 1.25)                                                # lee profile exponent: under 2 the crest is a cusp (a lip), not a rounded top                                                   # lee face width (units): v4 2.0, the faces catch the sky dome
# far ridge planes: (y0, amplitude, wavelength along x, front-face sigma y, seed, along-crest scale, along-crest amplitude,
# knob amplitude, knob scale, knob octaves). v4: three layers in igloo's proportion. The near rim (y 70) keeps its height,
# the mid ridge (y 140) is 1.5x it on screen, the far mass (y 245) 2.5-3x with a broad rounded profile: its crest noise
# lives at 0.75 x 80 units (300-600 px on screen), two octaves only (nothing under 40 px), knobs under 10 percent
# ... plus (back-slope factor, foot-lobe amplitude): the back is steep enough on the near two that no lit plateau shows over
# the crest, and the front foot of every plane is lobed (its width wanders along the crest) so its base is never a line
RIDGES = [(70.0, env('FF_R1', 2.8), 34.0, 7.0, 801, 0.7, 0.45, 0.12, 0.2, 3, 1.2, 0.35),
          (140.0, env('FF_R2', 8.0), 48.0, 11.0, 802, 0.7, 0.45, 0.08, 0.3, 2, 1.4, 0.3),
          (245.0, env('FF_R3', 26.0), 80.0, 20.0, 803, 0.75, 0.45, 0.07, 0.3, 2, 2.0, 0.25)]
# v4: directional wind streaking, only on the right-hand foreground (x > 2, y < -5): 4:1 grooves along the wind
STREAK = dict(amp=env('FF_STREAK', 0.20), len=5.0, wid=0.8, ang=env('FF_STREAK_ANG', 140.0))   # across the key, so the groove sides differ

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
    wx = sstep(0.0, 3.5, np.abs(x) - w)
    wedge = wx + (1 - wx) * sstep(0.5, 4.5, y)                                  # v3: relaxes over 4 units beyond the logo's near edge, no step at y 1.5
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
    crest = 1 - np.abs(fbm(uu / (P['drift_len'] * 0.8), vv / (P['drift_wid'] * 0.8), 3, 512)); crest = crest ** 2
    drifts = 0.8 * n1 + 0.25 * (crest - 0.4)                                     # v3: soft mottling, the ridged term is a trace
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
    D -= 0.5 * (hum * P['hump_amp'] + fm * P['fg_mound_amp'] * 0.5) * sstep(0.3, 0.8, dl / DOME_L[5]) * near_fine   # a rounded dome with some drift relief left on it (v3: half)
    D -= 0.25 * sstep(1.0, -5.0, y) * (1 - pad)                                 # the near plain sits a little under the pad: relief has room under the cap
    D += dome(x, y, SWELL_R) * (1 + 0.15 * fbm(x / 3.0, y / 3.0, 2, 602)) * pad
    D += dome(x, y, FAR_L)
    D += ridges(x, y)
    inw = (1 - sstep(0.0, 3.5, np.abs(x) - 2.8 * np.clip((y + 24) / 24, 0, 1) - 0.3)) * (1 - sstep(0.5, 4.5, y))   # v3: feathered in y too
    tt = np.clip((y + 24) / 24, 0, 1)
    cap = (-2.5 - 0.55 * tt) - 0.34 - base_at(x, y)                               # 0.34 under the camera -> logo-bottom sightline, whatever the base
    Dw = D * (1 - 0.30 * inw)                                                     # smaller relief inside the wedge, so it rarely meets the cap
    k = P['cap_k']; Dc = -k * np.logaddexp(-Dw / k, -cap / k)
    return D * (1 - inw) + Dc * inw

def ridges(x, y):
    """Far ridge planes at three depths: a steeper front face, a soft back, broad peaks and saddles along the crest.
    v4: the crest height sits at 0.72 +- the along-crest noise (no deep saddles, so the layer reads as one mass), two
    octaves on the mid and far layers, knobs under 10 percent: a rounded profile, not a saw."""
    z = np.zeros_like(x)
    for y0, amp, wl, sy, seed, a_sc, a_amp, k_amp, k_sc, k_oct, back, foot in RIDGES:
        yc = y0 + 0.3 * wl * fbm(x / wl, y / (wl * 3.0), 2, seed)
        s = y - yc
        wf = sy * (1 + 0.5 * fbm(x / (wl * 0.4) + 1.3, y / (wl * 0.4), 2, seed + 6))           # the front face width wanders: a lobed foot
        prof = np.where(s > 0, np.exp(-(s / (sy * back)) ** 2), np.exp(-(s / wf) ** 2))
        along = 0.72 + a_amp * fbm(x / (wl * a_sc) + 0.37 * seed, np.full_like(y, 0.3), 2, seed + 2, gain=0.45)
        lumpy = 1 + k_amp * fbm(x / (wl * k_sc), y / (wl * k_sc), k_oct, seed + 4, gain=0.45)
        z += amp * prof * np.maximum(along, 0.1) ** 1.3 * lumpy
        # foothill lobes in front of the plane (s from -3.5 sy to 0): rounded mounds that overlap and break the base line
        fl = np.maximum(fbm(x / (wl * 0.3) + 0.7, y / (wl * 0.3), 2, seed + 8) + 0.1, 0) ** 1.4
        z += amp * foot * fl * np.exp(-((s + 1.8 * sy) / (1.6 * sy)) ** 2)
    return z

def dunes(x, y):
    """Crescent dunes stacking the mid field: a gentle windward back away from the camera, a steep lee face towards it,
    the crest bowed so the horns trail towards the camera (concave downwind face). v4: continuous fronts, each a lit lip
    over a shaded face: the along-crest variation is two broad octaves and the hummocks are a trace."""
    pad, *_ = masks(x, y)
    z = np.zeros_like(x)
    for x0, y0, sx, h, curv, seed in DUNES:
        xr = x - x0
        yc = y0 + curv * (xr / sx) ** 2 + 0.22 * sx * fbm(x / (0.7 * sx) + seed, y / (0.7 * sx), 2, seed)   # a wandering crest line
        s = y - yc
        lee = DUNE_LEE * (0.75 + 0.5 * np.maximum(fbm(x / 4.0 + seed, y / 4.0, 2, seed + 3), -0.5))          # the lee face steepens and softens along the crest
        prof = np.where(s > 0, np.exp(-(s / (0.35 * sx)) ** 2), np.exp(-(np.abs(s) / lee) ** DUNE_CUSP))     # v4: a cusp at the crest, the lip
        along = 0.72 + 0.45 * fbm(x / (0.6 * sx), y / (0.6 * sx), 2, seed + 1, gain=0.45)                      # broad peaks and saddles along the crest
        lumpy = 1 + 0.06 * fbm(x / 3.5, y / 3.5, 2, seed + 5)                                                  # a trace of hummocks
        envl = np.exp(-(xr / sx) ** 2) * np.maximum(along, 0.3) * lumpy
        z += h * prof * envl
    return z * pad

def scarp_one(x, y, cx, cy, R, ang, h, lipw=0.08, recover=True, lip=0.25, asp=1.0, rot=0.0):
    """A crescent scarp. v4: an ellipse (asp = minor/major) rotated by rot; the facing angle is in the ellipse's frame."""
    dx = x - cx; dy = y - cy
    if rot or asp != 1.0:
        c_, s_ = math.cos(rot), math.sin(rot); ex = dx * c_ + dy * s_; ey = (-dx * s_ + dy * c_) / asp; dx, dy = ex, ey
    r = np.hypot(dx, dy); th = np.arctan2(dy, dx)
    da = np.abs((th - ang + np.pi) % (2 * np.pi) - np.pi)
    arc = 1 - sstep(0.35, 0.85, da)                                               # the open side of the crescent faces the camera
    drop = sstep(R + lipw, R - lipw, r)                                           # crisp face at the rim
    floor_ = (0.45 + 0.55 * (r / R) ** 2) if recover else 1.0                    # a shallow bowl, deepest just inside the rim
    rim = np.exp(-((r - R - 1.6 * lipw) / (2.6 * lipw)) ** 2)                    # a small raised lip just outside the crest, catches the key
    return -h * arc * drop * floor_ + lip * h * arc * rim

def scarps(x, y):
    """Crescent wind scarps: a crisp drop at the rim into a shallow pit that recovers towards the centre, with a small lip."""
    z = np.zeros_like(x)
    for i, spec in enumerate(SCARPS):
        cx, cy, R, ang, h = spec[:5]; asp, rot = (spec[5], spec[6]) if len(spec) > 5 else (1.0, 0.0)
        # the mid-field scarps are seen at a grazing angle: the raised lip (lit top, shaded inner wall) carries them, not the
        # pit; v4 the lip is 0.3 of the drop over a wider lip width, so it rounds off instead of clipping
        fg = i < N_FG_SCARPS
        z += scarp_one(x, y, cx, cy, R, ang, h if fg else 0.6 * h, lipw=0.08 + (0.12 if fg else 0.22) * R, lip=0.25 if fg else 0.3, asp=asp, rot=rot)
    cx, cy, R, ang, h = DOME_SCARP
    # the dome's lee face: the drop does not recover, and it fades out along the horns with the dome's own height
    w = sstep(0.45, 0.80, dome(x, y, DOME_L) / DOME_L[5])                        # only on the dome's body, gone before the sight wedge
    z += scarp_one(x, y, cx, cy, R, ang, h, lipw=0.85, recover=False, lip=0.20) * w
    return z

def hollows(x, y):
    """v4: soft dishes in the foreground plain, no lip."""
    z = np.zeros_like(x)
    for cx, cy, sx, sy, rot, dep in HOLLOWS:
        c_, s_ = math.cos(rot), math.sin(rot); dx = x - cx; dy = y - cy
        ex = dx * c_ + dy * s_; ey = -dx * s_ + dy * c_
        z -= dep * np.exp(-((ex / sx) ** 2 + (ey / sy) ** 2) ** 1.5)
    return z

def streaks(x, y):
    """v4: directional wind streaking on the right-hand foreground only (igloo's reference has it there and nowhere else):
    4:1 grooves along the wind, 0.6 units apart, faded in past x 2 and gone beyond y -5."""
    wa = math.radians(STREAK['ang']); cw, sw = math.cos(wa), math.sin(wa)
    u = x * cw + y * sw; v = -x * sw + y * cw
    n = fbm(u / STREAK['len'] + 11.3, v / STREAK['wid'], 3, 651, gain=0.5)
    n = n - 0.6 * (1 - np.abs(fbm(u / STREAK['len'] + 4.1, v / (STREAK['wid'] * 0.8), 2, 653))) ** 3   # sastrugi: sharp grooves between the rounded ridges
    m = sstep(1.5, 4.5, x) * sstep(-4.0, -8.0, y) * (0.6 + 0.4 * sstep(0.0, 0.5, fbm(x / 3.0, y / 3.0, 2, 652)))
    return STREAK['amp'] * n * m

UX0, UY0, US, UN = -72.0, -32.0, 0.08, 1800
CREST_PNG = os.path.join(CACHE, 'crest_%s.png' % os.environ.get('FF_TAG', 'v4'))
def sample_uni(A, PX, PY):
    fx = np.clip((PX - UX0) / US, 0, UN - 1.001); fy = np.clip((PY - UY0) / US, 0, UN - 1.001)
    x0 = np.floor(fx).astype(int); y0 = np.floor(fy).astype(int); ax = fx - x0; ay = fy - y0
    return (A[y0, x0] * (1 - ax) + A[y0, x0 + 1] * ax) * (1 - ay) + (A[y0 + 1, x0] * (1 - ax) + A[y0 + 1, x0 + 1] * ax) * ay

def build_height():
    fn = os.path.join(CACHE, 'hgt_%s.npz' % os.environ.get('FF_TAG', 'v4'))
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
    # v3: the far-field smoothing is isotropic in world space (sigma mid_blur units on the uniform grid), blended in by y
    Du = Dr + dE
    wfu = sstep(6.0, 30.0, UYg)
    Du = Du * (1 - wfu) + gaussian_filter(Du, P['mid_blur'] / US) * wfu
    Du += dunes(UXg, UYg)                                                         # after the blur and the erosion: crisp lee faces
    log('mid-field blur and dunes applied')
    PX, PY = ground_grid(NP, NP)
    base_h = base_at(PX, PY)
    inside = (PX > UX0) & (PX < UX0 + UN * US) & (PY > UY0) & (PY < UY0 + UN * US)
    Dm = np.where(inside, sample_uni(Du, PX, PY), relief(PX, PY) + dunes(PX, PY))
    hgt = base_h + Dm
    pad, *_ = masks(PX, PY)
    sel = pad < 0.05
    off = LOGO_Z - hgt[sel].mean(); hgt += off * (1 - pad)
    log('logo pad mean %.3f -> %.3f (offset %.3f), pad range %.3f..%.3f' % (LOGO_Z - off, hgt[sel].mean(), off, hgt[sel].min(), hgt[sel].max()))
    hgt += scarps(PX, PY) + hollows(PX, PY) + streaks(PX, PY)                     # after erosion so the lips stay crisp
    uni = (H0 + dE).astype(np.float32)
    # v3 crest mask for the material (crust chunks and shadow pockets live on crests): height above a 0.8-unit neighbourhood
    Hu = Hb + Du + scarps(UXg, UYg) + hollows(UXg, UYg) + streaks(UXg, UYg)
    cr = Hu - gaussian_filter(Hu, 0.8 / US)
    slope = np.hypot(*np.gradient(gaussian_filter(Hu, 0.5 / US), US))
    crest_u = np.clip(cr / 0.22, 0, 1) * sstep(0.03, 0.18, slope)              # R: a crest, and a sloping one (the plain stays clean)
    dcx, dcy, dR, dang, _ = DOME_SCARP                                            # v4: the dome's lee lip is a crest too (its crust chunks)
    ddx = UXg - dcx; ddy = UYg - dcy; dr = np.hypot(ddx, ddy); dth = np.arctan2(ddy, ddx); dda = np.abs((dth - dang + np.pi) % (2 * np.pi) - np.pi)
    # a 2.5-unit band over the crest (centred a little behind the lip), broken into clusters by a 0.6-unit noise so the
    # lumps never line up as a string of beads
    lipband = (1 - sstep(0.7, 1.15, dda)) * np.exp(-((dr - dR - 1.1) / 1.3) ** 2) * sstep(0.35, 0.70, dome(UXg, UYg, DOME_L) / DOME_L[5])
    lipband = lipband * sstep(0.30, 0.62, fbm(UXg / 0.6 + 5.0, UYg / 0.6, 2, 612) + 0.5)
    dome_body = sstep(0.25, 0.6, dome(UXg, UYg, DOME_L) / DOME_L[5])
    crust_u = np.maximum(lipband * (0.7 + 0.3 * fbm(UXg / 1.5, UYg / 1.5, 2, 611)), crest_u * dome_body)   # B: where the crust lumps live (v4: the left mass only)
    flank_u = sstep(0.15, 0.32, slope) * sstep(-15.0, -9.0, UYg)                 # G: sloping flanks (the dome, the knolls, dune backs), not the near plain's mounds: shadow pockets
    crest_g = np.where(inside, sample_uni(crest_u, PX, PY), 0.0); flank_g = np.where(inside, sample_uni(flank_u, PX, PY), 0.0)
    crust_g = np.where(inside, sample_uni(crust_u, PX, PY), 0.0)
    from PIL import Image
    rgb = np.stack([crest_g, flank_g, crust_g], -1)
    Image.fromarray(np.round(np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(CREST_PNG)   # row 0 = grid row 0 = v 1
    log('crest/flank mask written', CREST_PNG, 'coverage crest %.3f flank %.3f' % ((crest_g > 0.3).mean(), (flank_g > 0.5).mean()))
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
KEY = dict(el=env('FF_KEY_EL', 34), rot=env('FF_KEY_ROT', -40), e=env('FF_KEY_E', 1.3), c=(1.0, env('FF_KEY_G', 0.93), env('FF_KEY_B', 0.78)), ang=env('FF_KEY_ANG', 7.0))   # v3: warmer (lit B/R 1.15: 0.865 gave 1.168, 0.84 gave 1.162, 0.78 lands on 1.15; the dark tenth stays ~1.25 from the sky)
FILL = dict(el=env('FF_FILL_EL', 35), rot=190, e=env('FF_FILL_E', 0.18), c=(env('FF_FILL_R', 0.70), env('FF_FILL_G', 0.83), 1.0), ang=20)                      # v3: the camera-facing flanks get a little blue fill; the dark tenth keeps B/R ~1.27
SKY_FILL = env('FF_SKY', 0.27)
def lamp(name, spec):
    ld = bpy.data.lights.new(name, 'SUN'); ld.energy = spec['e']; ld.color = spec['c']; ld.angle = math.radians(spec['ang'])
    lo = bpy.data.objects.new(name, ld); sc.collection.objects.link(lo); lo.rotation_mode = 'QUATERNION'
    e_, r_ = math.radians(spec['el']), math.radians(spec['rot'])
    d_ = (math.sin(r_) * math.cos(e_), math.cos(r_) * math.cos(e_), math.sin(e_))
    lo.rotation_quaternion = Vector((-d_[0], -d_[1], -d_[2])).to_track_quat('-Z', 'Y')
    return lo
lamp('key', KEY); lamp('fill', FILL)
# v4: a weak local fill for the left mass only: a spot from the camera's right, aimed at the dome's lee face, its cone
# ending before the near plain's centre (x > -2), so the LUT fit region x100-700 and the near plain hold
LFILL = dict(e=env('FF_LFILL', 0.2), pos=(7.0, -31.0, 7.0), aim=(-6.0, -13.0, -3.2), size=math.radians(env('FF_LFILL_SIZE', 34)), blend=0.6)
if LFILL['e'] > 0:
    sd = bpy.data.lights.new('lfill', 'SPOT'); sd.spot_size = LFILL['size']; sd.spot_blend = LFILL['blend']; sd.shadow_soft_size = 4.0
    sd.color = (0.80, 0.88, 1.0)
    # a spot's energy is in watts: scale so the irradiance at the aim point (d units away) is LFILL['e'] sun-units
    d_aim = math.dist(LFILL['pos'], LFILL['aim']); sd.energy = LFILL['e'] * 4 * math.pi * d_aim * d_aim
    so = bpy.data.objects.new('lfill', sd); sc.collection.objects.link(so); so.location = LFILL['pos']; so.rotation_mode = 'QUATERNION'
    so.rotation_quaternion = (Vector(LFILL['aim']) - Vector(LFILL['pos'])).to_track_quat('-Z', 'Y')

# world: a blue-grey overcast dome for indirect rays (bluer in the shade, as igloo's), black to the camera
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True; wn = wd.node_tree.nodes; wl = wd.node_tree.links
bgn = wn['Background']
lp = wn.new('ShaderNodeLightPath'); tcw = wn.new('ShaderNodeTexCoord'); sz = wn.new('ShaderNodeSeparateXYZ'); wl.new(tcw.outputs['Generated'], sz.inputs[0])
ramp = wn.new('ShaderNodeValToRGB'); wl.new(sz.outputs['Z'], ramp.inputs['Fac'])
E = ramp.color_ramp.elements
E[0].position, E[0].color = 0.0, (0.48, 0.59, 0.86, 1)
E[1].position, E[1].color = 0.6, (0.38, 0.51, 0.88, 1)
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
sb.inputs['Roughness'].default_value = env('FF_ROUGH', 0.55); sb.inputs['Specular IOR Level'].default_value = env('FF_SPEC', 0.2)   # a faint white sheen: igloo's brightest pixels are near neutral (v3: a little less, the lips were blowing out)
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

S = dict(crumb_a=env('FF_CRUMB_A', 0.15), crumb_h=env('FF_CRUMB_H', 0.003), clod_h=env('FF_CLOD_H', 0.008), clod_a=env('FF_CLOD_A', 0.05),
         blota_a=env('FF_BLOTA_A', 0.07), blota_h=env('FF_BLOTA_H', 0.03),                 # v3 blotches, 0.3-1 unit
         blotb_a=env('FF_BLOTB_A', 0.05), blotb_h=env('FF_BLOTB_H', 0.09),                 # v3 blotches, 1-3 units (the old lumps)
         pocket_a=env('FF_POCKET_A', 0.26), pocket_h=env('FF_POCKET_H', 0.0),              # v3 irregular shadow pockets on flanks and crests (albedo only)
         crust_h=env('FF_CRUST_H', 0.18), crust_a=env('FF_CRUST_A', 0.15),                 # v4 crust lumps on crests: taller, 8-20 px, more of the crest
         speck_a=env('FF_SPECK_A', 0.12), sparkle=env('FF_SPARK', 0.0))
# distance weights: camera distance ~ Y + 24. Fine grain x1.25 in the nearest rows, x0.7 at the logo pad, gone by the far field
DIST = m_('ADD', OY, 24.0)
near_w = mr(DIST, 9.0, 12.0, 1.25, 1.0)
mid_w = mr(DIST, 12.0, 22.0, 1.0, 0.45)
far_w = mr(DIST, 16.0, 36.0, 1.0, 0.0, 'SMOOTHSTEP')
fine_w = m_('MULTIPLY', m_('MULTIPLY', near_w, mid_w), far_w)
macro_w = mr(DIST, 10.0, 35.0, 1.0, 0.05)                                      # 10-40 px hummocks damped by the mid distance (foreshortening makes them high-frequency there)
geo = nd('ShaderNodeNewGeometry'); gsep = nd('ShaderNodeSeparateXYZ'); ln(geo.outputs['Normal'], gsep.inputs[0])
slope_w = mr(gsep.outputs['Z'], 0.86, 0.98, 0.2, 1.0)                           # streaks and grain are a plain's feature: softer on steep faces
fade_far = mr(OY, 40.0, 120.0, 1.0, 0.1)

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
# v3: no streak layer. Every layer below is isotropic in world space.
# blotches at two scales (kept in the bake): A 0.3-1 unit, B 1-3 units, plus a weak 0.25-unit clod in the near field
vsA = nd('ShaderNodeMapping', vector_type='POINT'); vsA.inputs['Scale'].default_value = (1.0, 1.0 / 1.4, 1.0); ln(PO, vsA.inputs['Vector'])   # 1.4:1 along the view axis against the foreshortening
PA = vsA.outputs['Vector']
blA = noise(PA, 2.2, 2.5, 0.45, 0.0); blotA = m_('MULTIPLY', m_('SUBTRACT', blA.outputs['Fac'], 0.5), 4.0)
blB = noise(PA, 0.65, 2.0, 0.45, 0.2); blotB = m_('MULTIPLY', m_('SUBTRACT', blB.outputs['Fac'], 0.5), 3.5)
bl_n = noise(PA, 4.0, 2.0, 0.45, 0.0); clod = m_('MULTIPLY', m_('SUBTRACT', bl_n.outputs['Fac'], 0.5), 4.5)
blot_w = mr(DIST, 12.0, 60.0, 1.0, 0.1)                                         # blotches read into the mid field (igloo's mid field is mottled too), a trace beyond
# crest mask (height above a 0.8-unit neighbourhood, from build_height) through the UV map
crest_img = bpy.data.images.load(CREST_PNG); crest_img.colorspace_settings.name = 'Non-Color'
ctex = nd('ShaderNodeTexImage'); ctex.image = crest_img; ctex.interpolation = 'Cubic'; ln(tc.outputs['UV'], ctex.inputs['Vector'])
csep = nd('ShaderNodeSeparateColor'); ln(ctex.outputs['Color'], csep.inputs[0])
CREST, FLANK, CRUST = csep.outputs[0], csep.outputs[1], csep.outputs[2]
near_crest = m_('MULTIPLY', CREST, mr(DIST, 14.0, 45.0, 1.0, 0.1))
near_flank = m_('MULTIPLY', m_('MAXIMUM', FLANK, CREST), mr(DIST, 14.0, 40.0, 1.0, 0.1))
# irregular shadow pockets (0.2-0.4 units, soft edged: a crisp edge turns into a dark slash under the foreshortening)
# on flanks and crests, a trace on the plain
pk = noise(vsA.outputs['Vector'], 3.2, 3.0, 0.45, 0.6)
pocket = mr(pk.outputs['Fac'], 0.56, 0.74, 0.0, 1.0, 'SMOOTHSTEP')
pocket = m_('MULTIPLY', pocket, m_('ADD', 0.10, m_('MULTIPLY', near_flank, 0.90)))
# crust chunks: irregular rounded lumps 0.08-0.16 units (voronoi F1 on warped coordinates) carried by the bump alone, so
# each has a lit top face and a 1-2 px shadow on its far side; the gaps between lumps a touch darker
cwn = noise(PO, 3.0, 2.0, 0.45)
cwv = nd('ShaderNodeVectorMath', operation='MULTIPLY_ADD'); ln(cwn.outputs['Color'], cwv.inputs[0]); cwv.inputs[1].default_value = (0.12, 0.12, 0.12); ln(PO, cwv.inputs[2])
# v4: broken crust on the left mass's crest: rounded lumps 0.25 units across (16-27 px on the dome crest) from an F1 voronoi
# on warped coordinates, carried by the bump (a lit top, a 1-2 px shadow on the camera side) and a brighter albedo on top
vf = voronoi(cwv.outputs['Vector'], env('FF_CHUNK_SC', 4.0), 1.0, 'F1')
vf2 = voronoi(cwv.outputs['Vector'], env('FF_CHUNK_SC', 4.0) * 1.8, 1.0, 'F1')  # a second, smaller size mixed in: no even pebbles
chunk = m_('MAXIMUM', mr(vf.outputs['Distance'], 0.44, 0.12, 0.0, 1.0, 'SMOOTHSTEP'), m_('MULTIPLY', mr(vf2.outputs['Distance'], 0.40, 0.10, 0.0, 1.0, 'SMOOTHSTEP'), 0.7))
csel = noise(PO, 1.2, 1.0, 0.4)                                                  # denser and sparser patches along the crest
chunk_w = m_('MULTIPLY', m_('MULTIPLY', CRUST, mr(DIST, 10.0, 30.0, 1.0, 0.0)), mr(csel.outputs['Fac'], 0.30, 0.50, 0.5, 1.0, 'SMOOTHSTEP'))
chunk = m_('MULTIPLY', chunk, chunk_w)
# bump: fine crumb (preview only) + blotches + clod + crust - pockets, macro parts damped with distance
Hfine = m_('MULTIPLY', m_('MULTIPLY', crumb_c, S['crumb_h'] if CRUMB else 0.0), fine_w)
Hmac = m_('ADD', m_('MULTIPLY', blotB, S['blotb_h']), m_('MULTIPLY', m_('MULTIPLY', clod, S['clod_h']), macro_w))
Hmac = m_('ADD', m_('MULTIPLY', Hmac, macro_w), m_('MULTIPLY', m_('MULTIPLY', blotA, S['blota_h']), blot_w))
Hmac = m_('ADD', Hmac, m_('MULTIPLY', chunk, S['crust_h']))
Hall = m_('MULTIPLY', m_('ADD', m_('ADD', Hfine, Hmac), m_('MULTIPLY', pocket, -S['pocket_h'])), fade_far)
bp = nd('ShaderNodeBump'); bp.inputs['Strength'].default_value = 1.0; bp.inputs['Distance'].default_value = 1.0
ln(Hall, bp.inputs['Height']); ln(bp.outputs['Normal'], sb.inputs['Normal'])
# albedo: cool snow, faint broad tone drift, blotches, pockets darker, crust tops a little brighter and the gaps between
# chunks darker, and the GRAIN (crumb, speckle) as a multiply so shaded faces carry it as much as lit ones.
SNOW = (0.82, 0.84, 0.85)
tone = mr(noise(PO, 0.22, 4.0, 0.45).outputs['Fac'], 0.3, 0.7, 0.965, 1.035)
amul = m_('MULTIPLY', tone, mr(pocket, 0.0, 1.0, 1.0, 1.0 - S['pocket_a']))
amul = m_('MULTIPLY', amul, m_('ADD', 1.0, m_('MULTIPLY', m_('MULTIPLY', clod, S['clod_a'] / 4.5), macro_w)))
amul = m_('MULTIPLY', amul, m_('ADD', 1.0, m_('MULTIPLY', m_('MULTIPLY', blotA, S['blota_a'] / 4.0), blot_w)))
amul = m_('MULTIPLY', amul, m_('ADD', 1.0, m_('MULTIPLY', blotB, S['blotb_a'] / 3.5)))
amul = m_('MULTIPLY', amul, m_('ADD', 1.0, m_('MULTIPLY', m_('SUBTRACT', m_('MULTIPLY', chunk, 2.0), chunk_w), S['crust_a'])))   # v4: the lump tops +crust_a (bright crust), the gaps -crust_a
if CRUMB:
    grain = m_('ADD', m_('MULTIPLY', crumb_c, -S['crumb_a']), m_('MULTIPLY', speck, S['speck_a']))
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
for spec in SCARPS[:N_FG_SCARPS]:                                                 # a small dark stone at the base of each foreground lip
    cx, cy, R, ang, h = spec[:5]; asp, rot = (spec[5], spec[6]) if len(spec) > 5 else (1.0, 0.0)
    rr = R * 0.82; ex = rr * math.cos(ang + 0.2); ey = rr * math.sin(ang + 0.2) * asp                 # in the ellipse's frame, back to world
    add_stone(cx + ex * math.cos(rot) - ey * math.sin(rot), cy + ex * math.sin(rot) + ey * math.cos(rot), 0.035 + 0.015 * rng.random(), sink=0.35)
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
        if os.environ.get('FF_PAGEFOG', '1') == '1':                                           # v4: divide out the page's own fog (view-axis depth)
            tex[sl] = FP.page_precomp(tex[sl], (dy * 24.0 + dz * 1.5) / 24.047)
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
