# v6 repost: re-apply the bake post (floor_final_post.post_texture, the same chain the bake runs) to a saved raw bake.
# usage: python3 repost6.py raw.png bakedir        (reads bakedir/moon_hgt.npy; env as floor_final_post)
import sys, os, numpy as np, time
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import floor_final_post as FP
Image.MAX_IMAGE_PIXELS = None
raw, out = sys.argv[1], sys.argv[2]; t0 = time.time()
NP = 1024
tt = np.linspace(1, 0, NP)[:, None]; uu = np.linspace(-1, 1, NP)[None, :]
PYr = -30 + 450 * tt ** 2.2; PX = uu * (34 + 1.25 * (PYr + 30)); PY = np.repeat(PYr, NP, 1)
hgt = np.load(os.path.join(out, 'moon_hgt.npy')).astype(np.float64)
tex = np.asarray(Image.open(raw).convert('RGB')).astype(np.float64) / 255
tex = FP.post_texture(FP.apply_lut(tex), PX, PY, hgt, NP)
Image.fromarray(np.round(np.clip(tex, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'ground_bake.png'))
print('repost6 ->', os.path.join(out, 'ground_bake.png'), '%.0fs' % (time.time() - t0), 'gains', FP.PAGE_GAIN, 'midrK', FP.MIDR_K, FP.MIDR_KS, 'far', FP.FAR_F, 'hor', FP.HOR_G, 'toe', FP.TOE_T, 'cool', FP.COOL)
