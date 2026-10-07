# Spires post: aerial haze by distance, low mist by height, neutral (white) grade.
import numpy as np, sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
col = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
def load(p):
    a = np.asarray(Image.open(p)).astype(np.float32)
    a = a[..., 0] if a.ndim == 3 else a
    return a / (65535 if a.max() > 255 else 255)
d = load(src.replace('.png', '_depth.png')) * 1000
z = load(src.replace('.png', '_height.png')) * 200 - 20
sky = d > 800
haze = 1 - np.exp(-np.maximum(d - 30, 0) * 0.0012)
mist = np.exp(-np.maximum(z + 4, 0) / 14.0) * (1 - np.exp(-np.maximum(d - 70, 0) * 0.006))   # igloo-like: ground fog thickening with distance   # low-lying, thicker further away
haze[sky] = 0; mist[sky] = 0
hc = np.array([0.05, 0.05, 0.055], np.float32); mc = np.array([0.12, 0.12, 0.125], np.float32)
res = col * (1 - haze[..., None]) + hc * haze[..., None]
res = res * (1 - 0.25 * mist[..., None]) + mc * 0.25 * mist[..., None]   # only a breath of ground haze
lum = (res * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
sat = np.where(sky[..., None], 1.15, 0.1)   # the sky keeps its colour, the ground stays neutral grey
res = lum + (res - lum) * sat                       # neutral white light: most of the blue goes
res = res * np.array([1.0, 1.0, 1.02], np.float32)
Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8)).save(out)
