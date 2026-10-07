# Aerial perspective in post: haze by distance (and a little by height), from the beauty render and its depth render.
import numpy as np, sys
from PIL import Image
src, out, hz = sys.argv[1], sys.argv[2], [float(v) for v in sys.argv[3].split(',')]   # haze r,g,b (0..1), density
col = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
d = np.asarray(Image.open(src.replace('.png', '_depth.png'))).astype(np.float32)
d = (d[..., 0] if d.ndim == 3 else d) / (65535 if d.max() > 255 else 255) * 1000
sky = d > 800
k = 1 - np.exp(-np.maximum(d - 15, 0) * hz[3])
k[sky] = 0
haze = np.array(hz[:3], np.float32)
res = col * (1 - k[..., None]) + haze * k[..., None]
Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8)).save(out)
