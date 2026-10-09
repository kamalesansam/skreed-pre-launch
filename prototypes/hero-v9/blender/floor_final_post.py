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
LAT_L, LAT_R = float(os.environ.get('FF_LAT_L', '0.50')), float(os.environ.get('FF_LAT_R', '0.36'))   # v5b: set through the page (far L 1.04, far R 0.85)
# v5 page calibration (bake only, after the LUT): the page's luminance tracks the texture with an exponent near 1.8, and
# its own curve was tuned on an earlier bake, so the LUT's igloo quantiles alone land the near field off on the page; a
# gain per depth band (near < 25 units, mid 25..60, far beyond), set from a quick bake measured through the real page
PAGE_GAIN = [float(v) for v in os.environ.get('FF_PAGE_GAINS', '1.0,1.0,1.0').split(',')]
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
LEFT_G = float(os.environ.get('FF_LEFT_G', '1.10')); MIDR_K = float(os.environ.get('FF_MIDR_K', '0.65')); MIDR_G = float(os.environ.get('FF_MIDR_G', '0.05'))   # v5b: set through the page (mid R 1.10 -> ~1.0 with a 5 percent gain)
def left_gain(rgb, x, y):
    m = sstep(-2.0, -3.5, x) * sstep(-22.0, -18.0, y) * (1 - sstep(6.0, 14.0, y))
    return rgb * (1 + (LEFT_G - 1) * m)[..., None]
def relief_band(tex):
    from scipy.ndimage import gaussian_filter
    Y = (tex * W709).sum(-1); return gaussian_filter(Y, 4.0) - gaussian_filter(Y, 40.0)
def relief_boost(rgb, band, x, y):
    if not MIDR_K: return rgb
    m = sstep(2.0, 3.5, x) * sstep(-15.0, -11.0, y) * (1 - sstep(4.0, 10.0, y))   # the mid-right box only (y -13..1), not the far right mass
    Yb = np.maximum((rgb * W709).sum(-1), 1e-3)
    return np.clip(rgb * (1 + MIDR_G * m + MIDR_K * m * band / Yb)[..., None], 0, 1)
def cap215(rgb):
    """v5b: after the boost and the left gain, roll luma above 0.79 smoothly into 0.84 (214): the LUT's ceiling holds"""
    Y = np.maximum((rgb * W709).sum(-1), 1e-4)
    Yc = np.where(Y > 0.79, 0.79 + 0.05 * np.tanh((Y - 0.79) / 0.05), Y)
    return rgb * (Yc / Y)[..., None]
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
