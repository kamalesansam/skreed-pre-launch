# Post step for floor_final: the page LUT for the snow floor (b's luma-quantile fit), c's soft toe and shoulder,
# then b's depth haze toward a dark blue-grey (the second review: the far band must stay at or above the mid-field
# mean, never a pale stripe and never darker than the foreground; the page adds its own fog on top).
# Order (all on display sRGB values):
#   1. luma Y = 0.2126 R + 0.7152 G + 0.0722 B;  f(Y) = softclamp((Y - BP) / (WP - BP), KNEE) ** GAMMA,
#      f += SHOULDER * f * f * (1 - f);  rgb_out = rgb * f(Y) / Y   (chroma ratios kept: lit and shadowed snow keep
#      their own blue/red balance, so the crevices never go violet)
#   2. haze by camera distance d (world units): h = HAZE_MAX * (1 - exp(-max(d - HAZE_START, 0) * HAZE_K)),
#      rgb = mix(rgb, HAZE_RGB, h); pixels with no geometry (the sky) stay black
# The LUT constants are fitted by least squares so the near-ground luma quantiles (rows 600-800, x 300-700) of a raw
# hero render match igloo's four screenshots:  python3 floor_final_post.py fit raw.png   -> writes ff/lut.json
# usage: python3 floor_final_post.py raw.png out.png        (reads raw_depth.npy next to raw.png when present)
import sys, os, json, math, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
LUT_FILE = os.path.join(HERE, 'ff', 'lut.json')
DEFAULT = dict(BP=0.244, WP=0.987, GAMMA=1.22, SHOULDER=-0.40)          # floor_b's hand fit, used until 'fit' runs
KNEE = 0.04
HAZE_RGB = np.array([float(v) for v in os.environ.get('FF_HAZE_RGB', '0.76,0.78,0.82').split(',')])   # v4: a light cool grey (luma ~199): the rim keeps 70 % of its own shading (~140), the mid ridge 55 % (~152), the far mass is 65 % haze (~175)
HAZE_START, HAZE_K, HAZE_MAX = 25.0, float(os.environ.get('FF_HAZE_K', '0.0055')), float(os.environ.get('FF_HAZE_MAX', '0.90'))   # v4: half the rate, a continuous ramp over the three planes
# v4 highlight shoulder on the LUT output: nothing on the floor passes ~0.845 (215) before the page curve
SH_A, SH_M = float(os.environ.get('FF_SH_A', '0.66')), float(os.environ.get('FF_SH_M', '0.845'))
# v4 page pre-compensation (bake only): the page fogs the ground linearly in view depth from 60 to 430 units toward
# #050506, which turns the far planes near-black; the bake divides that out (in linear light, through the page's
# 0.45 * c^0.7 curve) so the page shows the Blender look, with the gain capped so the far mass keeps its shading
PAGE_FOG = (60.0, 430.0); PAGE_EXP, PAGE_GAMMA = 0.45, 0.7; PAGE_GAIN_MAX = float(os.environ.get('FF_PAGE_GAIN', '2.4'))
REG = (100, 600, 700, 800)                                                       # v3: the wider near region for the fit (x 100-700)
# v5 lateral tone over the far masses (world x, y): the left mass (x < -2, feathered to -7) takes LAT_L extra haze toward
# the haze colour (igloo's is a uniformly hazy bright mass; ours had the camera-facing dune fronts in the key's shade), the
# right mass (x > 2) a gain of 1 - LAT_R (its key-lit flank was 35 percent over on the page); y 2..8 feathered in, 45..90 out
LAT_L, LAT_R = float(os.environ.get('FF_LAT_L', '0.50')), float(os.environ.get('FF_LAT_R', '0.62'))   # v6: 0.62 (far R 0.80 on the page)   # v5b: set through the page (far L 1.04, far R 0.85)
# v5 page calibration (bake only, after the LUT): the page's luminance tracks the texture with an exponent near 1.8, and
# its own curve was tuned on an earlier bake, so the LUT's igloo quantiles alone land the near field off on the page; a
# gain per depth band (near < 25 units, mid 25..60, far beyond), set from a quick bake measured through the real page
PAGE_GAIN = [float(v) for v in os.environ.get('FF_PAGE_GAINS', '0.97,1.0,1.0').split(',')]   # v6: set through the page
CAM = np.array([0.0, -24.0, -2.5])
def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def lateral(rgb, x, y):
    wy = sstep(2.0, 8.0, y) * (1 - sstep(45.0, 90.0, y))
    mL = (sstep(-2.0, -7.0, x) * wy * LAT_L)[..., None]; mR = (sstep(2.0, 7.0, x) * wy * LAT_R)[..., None]
    rgb = rgb * (1 - mL) + HAZE_RGB * mL
    return rgb * (1 - mR)
# v5b page calibration of the left dome (world x < -2.5, y -20..10; the mid-L box and the dome top in the far-L box): a
# gain, because the LUT refit on the near plain left the dome 15 percent dark on the page; and a band-pass relief boost
# on the right swell (world x > 2.5, y -14..7), igloo's mid-right low-frequency contrast
LEFT_G = float(os.environ.get('FF_LEFT_G', '1.05')); MIDR_K = float(os.environ.get('FF_MIDR_K', '1.6')); MIDR_G = float(os.environ.get('FF_MIDR_G', '-0.05'))   # v6: set through the page   # v5b: set through the page (mid R 1.10 -> ~1.0 with a 5 percent gain)
def left_gain(rgb, x, y):
    m = sstep(-2.0, -3.5, x) * sstep(-22.0, -18.0, y) * (1 - sstep(6.0, 14.0, y))
    return rgb * (1 + (LEFT_G - 1) * m)[..., None]
def _gauss(a, sigma):
    """numpy-only separable gaussian, edge padded (Blender's python has no scipy); sigma may be (sr, sc)"""
    sr, sc = (sigma, sigma) if np.isscalar(sigma) else sigma
    out = a.astype(np.float64)
    for ax, sg in ((0, sr), (1, sc)):
        if sg <= 0: continue
        r = int(math.ceil(3 * sg)); k = np.exp(-0.5 * (np.arange(-r, r + 1) / sg) ** 2); k /= k.sum()
        pw = [(0, 0), (0, 0)]; pw[ax] = (r, r); p_ = np.pad(out, pw, mode='edge'); n = out.shape[ax]
        out = sum(k[i] * (p_[i:i + n] if ax == 0 else p_[:, i:i + n]) for i in range(2 * r + 1))
    return out
def _gauss_big(a, sigma, f=8):
    """a large blur through an f-times box downsample (sigma in full-res texels)"""
    H, W = a.shape; s_ = a[:H // f * f, :W // f * f].reshape(H // f, f, W // f, f).mean((1, 3))
    s_ = _gauss(s_, sigma / f)
    yi = (np.arange(H) + 0.5) / f - 0.5; xi = (np.arange(W) + 0.5) / f - 0.5
    y0 = np.clip(np.floor(yi).astype(int), 0, s_.shape[0] - 2); x0 = np.clip(np.floor(xi).astype(int), 0, s_.shape[1] - 2)
    ay = np.clip(yi - y0, 0, 1)[:, None]; ax = np.clip(xi - x0, 0, 1)[None, :]
    return (s_[y0][:, x0] * (1 - ax) + s_[y0][:, x0 + 1] * ax) * (1 - ay) + (s_[y0 + 1][:, x0] * (1 - ax) + s_[y0 + 1][:, x0 + 1] * ax) * ay
def relief_band(tex):
    Y = (tex * W709).sum(-1); return _gauss(Y, 4.0) - _gauss_big(Y, 40.0)
MIDR_KS = float(os.environ.get('FF_MIDR_KS', '0.0'))      # v6: the shaded side takes a smaller boost (the v5 lee of the right swell went near black)
def relief_boost(rgb, band, x, y):
    if not MIDR_K: return rgb
    m = sstep(2.0, 3.5, x) * sstep(-15.0, -11.0, y) * (1 - sstep(4.0, 10.0, y))   # the mid-right box only (y -13..1), not the far right mass
    Yb = np.maximum((rgb * W709).sum(-1), 1e-3)
    k = np.where(band > 0, MIDR_K, MIDR_KS)                                         # v6: 0.65 on lit faces, 0.30 in shade
    f = np.maximum(1 + MIDR_G * m + k * m * band / Yb, 1 - 0.20 * m)                # v6: never more than 20 percent darker
    if LEFT_K:                                                                       # v6: the left dome's lit relief (its p98 was 25 under igloo's)
        mL = sstep(-2.0, -3.5, x) * sstep(-22.0, -18.0, y) * (1 - sstep(6.0, 14.0, y))
        f = f * (1 + LEFT_K * mL * np.maximum(band, 0) / Yb)
    return np.clip(rgb * f[..., None], 0, 1)
LEFT_K = float(os.environ.get('FF_LEFT_K', '1.5'))
def cap215(rgb):
    """v5b: after the boost and the left gain, roll luma above 0.79 smoothly into 0.84 (214): the LUT's ceiling holds"""
    Y = np.maximum((rgb * W709).sum(-1), 1e-4)
    Yc = np.where(Y > 0.79, 0.79 + 0.05 * np.tanh((Y - 0.79) / 0.05), Y)
    return rgb * (Yc / Y)[..., None]
# ------------------------------------------------------------------ v6 additions
# far haze: the far terrain (camera distance FAR_D0..FAR_D1, the page's far L/R boxes sit at 22-60 units) is blended FAR_F toward
# a fog tone at the band's own mean (computed per bake in a pre-pass), so its low-frequency spread halves (page lfstd 30 vs igloo 15)
FAR_F = float(os.environ.get('FF_FAR_F', '0.47')); FAR_D0, FAR_D1 = float(os.environ.get('FF_FAR_D0', '22')), float(os.environ.get('FF_FAR_D1', '40'))
# the crest and horizon rows (screen y <= HOR_Y0, ramp to HOR_Y1) brighten HOR_G in linear light (igloo's rows 380-410 are its brightest)
HOR_G = float(os.environ.get('FF_HOR_G', '0.40')); HOR_Y0, HOR_Y1 = float(os.environ.get('FF_HOR_Y0', '402')), float(os.environ.get('FF_HOR_Y1', '430'))
# cooler snow: lit B/R on the page was 1.05-1.09 (igloo 1.10-1.17); a red-down blue-up on the lit tones, luma kept
COOL = np.array([float(v) for v in os.environ.get('FF_COOL', '0.965,1.0,1.055').split(',')])
# a soft toe on the display luma: Y -> 0.5 (Y + sqrt(Y^2 + 4 t^2)) blended in by TOE_W, so no texel is a black hole on the page
TOE_T = float(os.environ.get('FF_TOE', '0.15'))
def screen_y(x, y, z):
    """projected 1280x800 hero-camera row of a world point"""
    f = np.array([0.0, 24.0, 1.5]); f /= np.linalg.norm(f); u = np.cross(np.array([1.0, 0, 0]), f)
    vx, vy, vz = x - CAM[0], y - CAM[1], z - CAM[2]; d = vx * f[0] + vy * f[1] + vz * f[2]
    return 400 - (vx * u[0] + vy * u[1] + vz * u[2]) / (np.maximum(d, 0.1) * math.tan(math.radians(15))) * 400
def far_fog(rgb, d, tone):
    w = (FAR_F * sstep(FAR_D0, FAR_D1, d))[..., None]
    return rgb * (1 - w) + tone[None, None, :] * w
def horizon(rgb, sy, d):
    w = (1 - sstep(HOR_Y0, HOR_Y1, sy)) * sstep(20.0, 28.0, d)
    return lin_to_srgb(np.clip(srgb_to_lin(rgb) * (1 + HOR_G * w)[..., None], 0, 1))
def cool(rgb):
    Y = np.maximum((rgb * W709).sum(-1), 1e-4); w = sstep(0.22, 0.50, Y)[..., None]
    o = rgb * (1 + (COOL[None, None, :] - 1) * w); Yo = np.maximum((o * W709).sum(-1), 1e-4)
    return np.clip(o * (Y / Yo)[..., None], 0, 1)
def toe(rgb):
    if TOE_T <= 0: return rgb
    Y = np.maximum((rgb * W709).sum(-1), 1e-4); Yt = 0.5 * (Y + np.sqrt(Y * Y + 4 * TOE_T * TOE_T)) - (0.5 * (1 + math.sqrt(1 + 4 * TOE_T * TOE_T)) - 1) * Y   # 1 stays 1
    return np.clip(rgb * (Yt / Y)[..., None], 0, 1)
def post_block(t, wx, wy, hz, dcam, dz, band, tone, precomp=True):
    """the whole bake post on one block of texels (display sRGB after the LUT): the v5 chain plus the v6 far fog, horizon,
    cooling and toe. tone=None skips the far fog (the pre-pass that measures the band mean)."""
    if band is not None: t = relief_boost(t, band, wx, wy)
    t = haze(t, dcam)
    t = lateral(t, wx, wy)
    t = cap215(left_gain(t, wx, wy))
    if tone is None: return t
    t = far_fog(t, dcam, tone)
    t = horizon(t, screen_y(wx, wy, hz), dcam)
    t = toe(cool(t))
    t = cap215(t)
    t = page_gain(t, dcam)
    if precomp and os.environ.get('FF_PAGEFOG', '1') == '1':
        t = page_precomp(t, (dz * 24.0 + (hz - CAM[2]) * 1.5) / 24.047)
    return t
def post_texture(tex, PX, PY, hgt, NP=1024, log=print):
    """tex: display sRGB (TEX x TEX x 3) after the LUT, row 0 = grid row 0 (far). In place, in 512-row blocks."""
    TEX = tex.shape[0]
    ri = np.linspace(0, NP - 1, TEX); r0 = np.floor(ri).astype(int); r1 = np.minimum(r0 + 1, NP - 1); fr = (ri - r0)[:, None]
    ci = np.linspace(0, NP - 1, TEX); c0 = np.floor(ci).astype(int); c1 = np.minimum(c0 + 1, NP - 1); fc = (ci - c0)[None, :]
    band = relief_band(tex) if MIDR_K else None
    def geo(sl, cs=slice(None)):
        rr0, rr1, ffr = r0[sl], r1[sl], fr[sl]; cc0, cc1, ffc = c0[cs], c1[cs], fc[:, cs]
        S_ = lambda A: (A[rr0][:, cc0] * (1 - ffc) + A[rr0][:, cc1] * ffc) * (1 - ffr) + (A[rr1][:, cc0] * (1 - ffc) + A[rr1][:, cc1] * ffc) * ffr
        wx, wy, hz = S_(PX), S_(PY), S_(hgt); dx, dy, dzz = wx - CAM[0], wy - CAM[1], hz - CAM[2]
        return wx, wy, hz, np.sqrt(dx * dx + dy * dy + dzz * dzz), dy
    # pre-pass on every 8th texel: the far band's mean after the v5 chain, over the texels in the hero frame
    ss = slice(0, TEX, 8); wx, wy, hz, dcam, dy = geo(ss, ss)
    tb = post_block(tex[ss, ss].copy(), wx, wy, hz, dcam, dy, band[ss, ss] if band is not None else None, None)
    sel = (sstep(FAR_D0, FAR_D1, dcam) > 0.5) & (dcam < 140) & (np.abs(wx) < 0.42 * (wy + 24)) & (screen_y(wx, wy, hz) < 560)
    tone = tb[sel].mean(0) if sel.any() else HAZE_RGB
    log('v6 far fog tone %s (luma %.3f) from %d texels' % (np.round(tone, 3), float((tone * W709).sum()), int(sel.sum())))
    for i0 in range(0, TEX, 512):
        sl = slice(i0, i0 + 512); wx, wy, hz, dcam, dy = geo(sl)
        tex[sl] = post_block(tex[sl], wx, wy, hz, dcam, dy, band[sl] if band is not None else None, tone)
    return tex

# v6 page mesh: the 1024 heightfield is low-passed (sigma about half a page cell) before it is sampled at 400 x 320, so the
# coarse mesh never folds along a row over a feature it cannot carry (the straight seams at y 591 / 679 / 707 on the page)
PAGE_SIG = [float(v) for v in os.environ.get('FF_PAGE_SIG', '1.1,1.4').split(',')]
def page_mesh(hgt, NR=400, NC=320):
    NP = hgt.shape[0]; h = _gauss(hgt, PAGE_SIG)
    ri = np.linspace(0, NP - 1, NR); ci = np.linspace(0, NP - 1, NC)
    r0 = np.floor(ri).astype(int); c0 = np.floor(ci).astype(int); r1 = np.minimum(r0 + 1, NP - 1); c1 = np.minimum(c0 + 1, NP - 1)
    fr = (ri - r0)[:, None]; fc = (ci - c0)[None, :]
    Z = (h[r0][:, c0] * (1 - fc) + h[r0][:, c1] * fc) * (1 - fr) + (h[r1][:, c0] * (1 - fc) + h[r1][:, c1] * fc) * fr
    return Z + page_crest(NR, NC)

# v6: skyline lumps on the left dome in the page mesh itself. The 1024 heightfield's 0.5-0.9-unit crest lumps are under two
# page cells (0.43 x 0.36 units here, ~40 px on screen) and alias away at 400 x 320, so the shipped mesh adds its own, sized to
# what it can carry: lump trains of 1.1 and 0.8-unit period (two to three cells, 80-120 px along the skyline), up to PAGE_CREST high, in a 0.8-unit
# band around the dome's camera-facing tangent line (world (-6.2,-12.0)..(-2.9,-9.6))
PAGE_CREST = float(os.environ.get('FF_PAGE_CREST', '0.10'))
def page_crest(NR, NC):
    if PAGE_CREST <= 0: return 0.0
    tt = np.linspace(1, 0, NR)[:, None]; uu = np.linspace(-1, 1, NC)[None, :]
    y = np.repeat(-30 + 450 * tt ** 2.2, NC, 1); x = uu * (34 + 1.25 * (y + 30))
    ax, ay, bx, by = -6.2, -12.0, -2.9, -9.6; dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
    t = np.clip(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1); dseg = np.hypot(x - ax - t * dx, y - ay - t * dy)
    band = np.exp(-(dseg / 0.8) ** 2) * sstep(0.0, 0.1, t) * sstep(1.0, 0.9, t)
    s_ = t * math.sqrt(L2)                                                       # arc length along the crest (units)
    n = np.sin(s_ / 0.55 * math.pi + 0.6) * 0.6 + np.sin(s_ / 0.40 * math.pi + 2.1) * 0.4    # two incommensurate lump trains (periods 1.1 and 0.8 units)
    return PAGE_CREST * band * np.maximum(n, -0.3)

def ground_fine(hgt, x, y):
    NP = hgt.shape[0]; t_ = np.clip((y + 30) / 450, 0, 1) ** (1 / 2.2); r = np.clip((1 - t_) * (NP - 1), 0, NP - 1.001)
    c = np.clip((x / (34 + 1.25 * (y + 30)) + 1) / 2 * (NP - 1), 0, NP - 1.001); r0 = r.astype(int); c0 = c.astype(int); a = r - r0; b = c - c0
    return (hgt[r0, c0] * (1 - b) + hgt[r0, c0 + 1] * b) * (1 - a) + (hgt[r0 + 1, c0] * (1 - b) + hgt[r0 + 1, c0 + 1] * b) * a

STONE_FLOOR = float(os.environ.get('FF_STONE_FLOOR', '0.17'))
def fix_stones(pw, srgb, tri, hgt):
    """pw: stone vertices in Blender world coords (n x 3); srgb: baked colours (n x 3, display). A vertex that sat under the
    1024 ground in Blender baked black; the page's coarser mesh can expose it (the black half-disc at 899-917 x 608-616), so
    it takes the median colour of its stone's exposed vertices; every vertex is floored at luma STONE_FLOOR (near-black grey)."""
    n = len(pw); par = np.arange(n)
    def f(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for t in tri:
        a = f(int(t[0]))
        for b in t[1:]: par[f(int(b))] = a
    roots = np.array([f(i) for i in range(n)])
    buried = pw[:, 2] < ground_fine(hgt, pw[:, 0], pw[:, 1]) + 0.004
    out = srgb.copy(); nfix = 0
    for rt in np.unique(roots):
        sel = roots == rt; ex = sel & ~buried
        ref = np.median(srgb[ex], 0) if ex.sum() >= 3 else None
        if ref is None or (ref * W709).sum() < STONE_FLOOR: ref = np.array([STONE_FLOOR * 0.97, STONE_FLOOR * 1.0, STONE_FLOOR * 1.06])
        bs = sel & buried; out[bs] = ref; nfix += int(bs.sum())
    Y = np.maximum((out * W709).sum(-1), 1e-4); lo = Y < STONE_FLOOR
    out[lo] = out[lo] * (STONE_FLOOR / Y[lo])[:, None] if lo.any() else out[lo]
    out[lo] = np.where((out[lo] * W709).sum(-1, keepdims=True) < STONE_FLOOR * 0.9, np.array([STONE_FLOOR * 0.97, STONE_FLOOR, STONE_FLOOR * 1.06]), out[lo])
    return np.clip(out, 0, 1), nfix, int(lo.sum())

def page_ground(Z, x, y):
    """the page mesh height (NR x NC, from page_mesh) at world (x, y), bilinear like the page's own moonGroundAt"""
    nr, nc = Z.shape; PY = np.maximum(-30, y); rr = np.clip((1 - ((PY + 30) / 450) ** (1 / 2.2)) * (nr - 1), 0, nr - 1.001)
    cc = np.clip((x / (34 + 1.25 * (PY + 30)) + 1) / 2 * (nc - 1), 0, nc - 1.001); r0 = rr.astype(int); c0 = cc.astype(int); a = rr - r0; b = cc - c0
    return (Z[r0, c0] * (1 - b) + Z[r0, c0 + 1] * b) * (1 - a) + (Z[r0 + 1, c0] * (1 - b) + Z[r0 + 1, c0 + 1] * b) * a
FG_PITS = [(-0.9, -12.7, 1.0), (2.7, -9.1, 0.72), (1.9, -16.7, 0.55)]   # floor_final.SCARPS[:3] (x, y, R)
def drop_exposed_stones(pw, tri, hgt, Zpage, k=3, pits=FG_PITS):
    """v6: a stone with k or more vertices that the 1024 ground buried in Blender (so they baked black) but the page mesh leaves
    above ground shows its unlit underside on the page (the half-disc at 899-917 x 608-616, the specks at (764,626), (105,378),
    (838,578)): its triangles are dropped. Returns the kept triangles and the dropped stones' centres."""
    n = len(pw); par = np.arange(n)
    def f(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for t in tri:
        a = f(int(t[0]))
        for b in t[1:]: par[f(int(b))] = a
    roots = np.array([f(i) for i in range(n)])
    bad = (pw[:, 2] < ground_fine(hgt, pw[:, 0], pw[:, 1]) + 0.004) & (pw[:, 2] > page_ground(Zpage, pw[:, 0], pw[:, 1]))
    sy = screen_y(pw[:, 0], pw[:, 1], pw[:, 2])
    f_ = np.array([0.0, 24.0, 1.5]); f_ /= np.linalg.norm(f_); dd = (pw[:, 1] - CAM[1]) * f_[1] + (pw[:, 2] - CAM[2]) * f_[2]
    sx = 640 + (pw[:, 0] - CAM[0]) / (np.maximum(dd, 0.1) * math.tan(math.radians(15)) * 1.6) * 640
    def in_pit(rt):
        c = pw[roots == rt].mean(0); return any(math.hypot(c[0] - px, c[1] - py) < 0.6 * pr for px, py, pr in pits)
    # also any stone inside a foreground pit away from its lip (the page mesh cannot carry the pit floor, the stone shows as a dark half-disc)
    drop = [rt for rt in np.unique(roots) if (bad[roots == rt].sum() >= max(k, 0.2 * (roots == rt).sum()) or in_pit(rt))
            and np.any((sx[roots == rt] >= 0) & (sx[roots == rt] < 1280) & (sy[roots == rt] >= 0) & (sy[roots == rt] < 800))]
    keep = ~np.isin(roots[tri[:, 0]], drop)
    return tri[keep], [tuple(np.round(pw[roots == rt].mean(0)[:2], 2)) for rt in drop]

def page_gain(rgb, d):
    # the two steps are smoothed over 8 units so no band shows
    g = PAGE_GAIN[0] + (PAGE_GAIN[1] - PAGE_GAIN[0]) * sstep(21.0, 29.0, np.nan_to_num(d, posinf=1e4, nan=1e4)) + (PAGE_GAIN[2] - PAGE_GAIN[1]) * sstep(56.0, 64.0, np.nan_to_num(d, posinf=1e4, nan=1e4))
    return rgb * g[..., None]
def world_from_depth(d):
    """hero camera: pixel rays through the view distance d -> world x, y per pixel (inf where there is no geometry)"""
    H, W = d.shape
    f = np.array([0.0, 24.0, 1.5]); f /= np.linalg.norm(f); r = np.array([1.0, 0.0, 0.0]); u = np.cross(r, f)
    t = math.tan(math.radians(15.0))
    nx = (np.arange(W) + 0.5 - W / 2) / (W / 2) * t * (W / H); ny = (H / 2 - (np.arange(H) + 0.5)) / (H / 2) * t
    dirs = f[None, None, :] + r[None, None, :] * nx[None, :, None] + u[None, None, :] * ny[:, None, None]
    dirs /= np.linalg.norm(dirs, axis=-1, keepdims=True)
    dd = np.nan_to_num(d, posinf=0.0, nan=0.0)[..., None]
    p = CAM + dirs * dd
    return p[..., 0], p[..., 1]
W709 = np.array([0.2126, 0.7152, 0.0722])
SH = '/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/refsites/work/shots/'
IGL = ['igloo-hero-1280', 'igloo-hero-defaultpointer-1280', 'igloo-scrollout-1280', 'igloo-intro-7s-1280']
QS = np.arange(1, 100)

def params():
    if os.path.exists(LUT_FILE):
        return json.load(open(LUT_FILE))
    return dict(DEFAULT)

def soft_clamp(o, k=KNEE):
    lo = np.where(o < k, k * np.exp((np.minimum(o, k) - k) / k), o)                          # toe
    return np.where(lo > 1 - k, 1 - k * np.exp(-(np.maximum(lo, 1 - k) - (1 - k)) / k), lo)  # shoulder

def shoulder(f, a=None, m=None):
    """v4: above a, roll off smoothly toward the ceiling m (tanh), so lit lips and crests never clip"""
    a = SH_A if a is None else a; m = SH_M if m is None else m
    return np.where(f > a, a + (m - a) * np.tanh((f - a) / (m - a)), f)

def lut(Y, p=None, cap=True):
    p = p or params()
    f = soft_clamp((Y - p['BP']) / (p['WP'] - p['BP'])) ** p['GAMMA']
    f = np.clip(f + p['SHOULDER'] * f * f * (1 - f), 0, 1)
    return shoulder(f) if cap else f

def srgb_to_lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lin_to_srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)

def page_precomp(rgb, dz):
    """rgb: display sRGB after the LUT and the haze; dz: view-axis depth per texel. Returns the sRGB the bake must hold so
    the page's fog (linear in depth, 60..430, toward near-black) is divided out through its 0.45 * c^0.7 curve."""
    f = np.clip((dz - PAGE_FOG[0]) / (PAGE_FOG[1] - PAGE_FOG[0]), 0, 1)
    gain = np.minimum((1 - f) ** (-1 / PAGE_GAMMA), PAGE_GAIN_MAX)[..., None]
    return lin_to_srgb(np.clip(srgb_to_lin(rgb) * gain, 0, 1))

def apply_lut(rgb, p=None):
    """rgb: (..., 3) display sRGB in 0..1. Chroma-preserving luma LUT."""
    Y = (rgb * W709).sum(-1, keepdims=True)
    return np.clip(rgb * lut(Y, p) / np.maximum(Y, 1e-4), 0, 1)

def haze(rgb, d):
    """d: camera distance per pixel (inf or nan where there is no geometry)."""
    h = HAZE_MAX * (1 - np.exp(-np.maximum(np.nan_to_num(d, posinf=0.0, nan=0.0) - HAZE_START, 0) * HAZE_K))
    h = np.where(np.isfinite(d), h, 0.0)[..., None]
    return rgb * (1 - h) + HAZE_RGB * h

def load(src):
    c = np.asarray(Image.open(src).convert('RGB')).astype(np.float64) / 255
    dp = os.path.splitext(src)[0] + '_depth.npy'
    d = np.load(dp).astype(np.float64) if os.path.exists(dp) else None
    return c, d

UI_BOX = (100, 680, 170, 760)                                                    # igloo's white UI text at the bottom-left, kept out of the fit
def region_luma(c, d=None, ref=False):
    x0, y0, x1, y1 = REG
    Y = (c[y0:y1, x0:x1] * W709).sum(-1)
    keep = np.ones(Y.shape, bool)
    if d is not None: keep &= np.isfinite(d[y0:y1, x0:x1])
    if ref:
        ux0, uy0, ux1, uy1 = UI_BOX; keep[max(uy0 - y0, 0):uy1 - y0, max(ux0 - x0, 0):ux1 - x0] = False
    return Y[keep].ravel()

def fit(src):
    from scipy.optimize import least_squares
    c, d = load(src)
    q_ours = np.percentile(region_luma(c, d), QS)
    q_ig = np.mean([np.percentile(region_luma(np.asarray(Image.open(SH + f + '.png').convert('RGB')).astype(np.float64) / 255, ref=True), QS) for f in IGL], 0)
    def resid(v):
        p = dict(BP=v[0], WP=v[1], GAMMA=v[2], SHOULDER=v[3])
        return lut(q_ours, p, cap=False) - q_ig
    # v3 bounds: BP >= 0.12 and GAMMA <= 2.2 keep a real toe and a sane top end (an unbounded fit on a flat raw render runs
    # to BP 0, GAMMA 3 and blows every lit rim above the near p99 to white); SHOULDER >= -1 for the same reason
    r = least_squares(resid, [0.25, 0.98, 1.2, -0.3], bounds=([0.12, 0.6, 0.5, -1.0], [0.6, 2.0, 2.2, 1.0]))
    p = dict(BP=float(r.x[0]), WP=float(r.x[1]), GAMMA=float(r.x[2]), SHOULDER=float(r.x[3]))
    os.makedirs(os.path.dirname(LUT_FILE), exist_ok=True); json.dump(p, open(LUT_FILE, 'w'))
    print('fit:', json.dumps({k: round(v, 4) for k, v in p.items()}), ' rms quantile error %.4f' % np.sqrt((r.fun ** 2).mean()))
    print('   ours raw p1/10/50/90/99 %s' % np.round(np.percentile(q_ours, [1, 10, 50, 90, 99]), 3), ' igloo %s' % np.round(q_ig[[0, 9, 49, 89, 98]], 3))
    return p

if __name__ == '__main__':
    if sys.argv[1] == 'fit':
        fit(sys.argv[2]); sys.exit(0)
    src, dst = sys.argv[1], sys.argv[2]
    c, d = load(src)
    o = apply_lut(c)
    if d is not None:
        o = haze(o, d)
        wx, wy = world_from_depth(d)
        o = lateral(o, wx, wy)
        o = np.where(np.isfinite(d)[..., None], o, 0.0)
    Image.fromarray(np.round(np.clip(o, 0, 1) * 255).astype(np.uint8)).save(dst)
    print('post ->', dst)
