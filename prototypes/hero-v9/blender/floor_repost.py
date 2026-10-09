# Re-apply the bake post (floor_final.py's texel loop) to a saved raw bake, so the page calibration can be iterated
# without re-baking. Env as for floor_final_post (FF_PAGE_GAINS, FF_LAT_L, FF_LAT_R, ...) plus the v5 mid-right relief
# boost: FF_MIDR_K (band-pass gain on the right swell, world x > 3, y -4..30).
# usage: python3 repost.py raw.png bakedir
import sys, os, math, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import floor_final_post as FP
Image.MAX_IMAGE_PIXELS = None
raw, out = sys.argv[1], sys.argv[2]
NP = 1024
def ground_grid(nr, nc):
    tt = np.linspace(1, 0, nr)[:, None]; uu = np.linspace(-1, 1, nc)[None, :]
    PYr = -30 + 450 * tt ** 2.2
    PX = uu * (34 + 1.25 * (PYr + 30)); PY = np.repeat(PYr, nc, 1)
    return PX, PY
PX, PY = ground_grid(NP, NP)
hgt = np.load(os.path.join(out, 'moon_hgt.npy')).astype(np.float64)
CAM = np.array([0.0, -24.0, -2.5])
tex = np.asarray(Image.open(raw).convert('RGB')).astype(np.float64) / 255
TEX = tex.shape[0]
tex = FP.apply_lut(tex)
ri = np.linspace(0, NP - 1, TEX); r0 = np.floor(ri).astype(int); r1 = np.minimum(r0 + 1, NP - 1); fr = (ri - r0)[:, None]
ci = np.linspace(0, NP - 1, TEX); c0 = np.floor(ci).astype(int); c1 = np.minimum(c0 + 1, NP - 1); fc = (ci - c0)[None, :]
band = FP.relief_band(tex) if FP.MIDR_K else None
for i0 in range(0, TEX, 512):
    sl = slice(i0, i0 + 512)
    rr0, rr1, ffr = r0[sl], r1[sl], fr[sl]
    def sampb(A):
        return (A[rr0][:, c0] * (1 - fc) + A[rr0][:, c1] * fc) * (1 - ffr) + (A[rr1][:, c0] * (1 - fc) + A[rr1][:, c1] * fc) * ffr
    wx, wy = sampb(PX), sampb(PY)
    dx = wx - CAM[0]; dy = wy - CAM[1]; dz = sampb(hgt) - CAM[2]
    dcam = np.sqrt(dx * dx + dy * dy + dz * dz)
    t = tex[sl]
    if band is not None: t = FP.relief_boost(t, band[sl], wx, wy)
    t = FP.haze(t, dcam)
    t = FP.lateral(t, wx, wy)
    t = FP.cap215(FP.left_gain(t, wx, wy))
    t = FP.page_gain(t, dcam)
    if os.environ.get('FF_PAGEFOG', '1') == '1':
        t = FP.page_precomp(t, (dy * 24.0 + dz * 1.5) / 24.047)
    tex[sl] = t
Image.fromarray(np.round(np.clip(tex, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'ground_bake.png'))
print('repost ->', os.path.join(out, 'ground_bake.png'), 'gains', FP.PAGE_GAIN, 'lat', FP.LAT_L, FP.LAT_R, 'left', FP.LEFT_G, 'midrK', FP.MIDR_K)
