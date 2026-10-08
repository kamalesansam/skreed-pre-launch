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
import sys, os, json, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
LUT_FILE = os.path.join(HERE, 'ff', 'lut.json')
DEFAULT = dict(BP=0.244, WP=0.987, GAMMA=1.22, SHOULDER=-0.40)          # floor_b's hand fit, used until 'fit' runs
KNEE = 0.04
HAZE_RGB = np.array([float(v) for v in os.environ.get('FF_HAZE_RGB', '0.42,0.45,0.52').split(',')])   # dark blue-grey, never darker than the near floor's shade
HAZE_START, HAZE_K, HAZE_MAX = 25.0, float(os.environ.get('FF_HAZE_K', '0.012')), float(os.environ.get('FF_HAZE_MAX', '0.80'))
REG = (300, 600, 700, 800)
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

def lut(Y, p=None):
    p = p or params()
    f = soft_clamp((Y - p['BP']) / (p['WP'] - p['BP'])) ** p['GAMMA']
    return np.clip(f + p['SHOULDER'] * f * f * (1 - f), 0, 1)

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

def region_luma(c, d=None):
    x0, y0, x1, y1 = REG
    Y = (c[y0:y1, x0:x1] * W709).sum(-1)
    if d is not None: Y = Y[np.isfinite(d[y0:y1, x0:x1])]
    return Y.ravel()

def fit(src):
    from scipy.optimize import least_squares
    c, d = load(src)
    q_ours = np.percentile(region_luma(c, d), QS)
    q_ig = np.mean([np.percentile(region_luma(np.asarray(Image.open(SH + f + '.png').convert('RGB')).astype(np.float64) / 255), QS) for f in IGL], 0)
    def resid(v):
        p = dict(BP=v[0], WP=v[1], GAMMA=v[2], SHOULDER=v[3])
        return lut(q_ours, p) - q_ig
    r = least_squares(resid, [0.25, 0.98, 1.2, -0.3], bounds=([0.0, 0.6, 0.5, -2.0], [0.6, 2.0, 3.0, 1.0]))
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
        o = np.where(np.isfinite(d)[..., None], o, 0.0)
    Image.fromarray(np.round(np.clip(o, 0, 1) * 255).astype(np.uint8)).save(dst)
    print('post ->', dst)
