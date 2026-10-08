# Per-block on-screen glow, from the solo captures: sum of luminance gain over the all-black baseline.
import numpy as np, json, sys
from PIL import Image
out = {}
for dev in ['d', 'm']:
    res = {}
    for pose in ['rest', 'center', 'left', 'right', 'top', 'bottom']:
        import os
        if not all(os.path.exists(f'pal/vis_{dev}/{pose}_{i}.png') for i in list(range(10)) + ['base']): continue
        try: base = np.asarray(Image.open(f'pal/vis_{dev}/{pose}_base.png').convert('RGB'), float)
        except FileNotFoundError: continue
        v = []
        for i in range(10):
            im = np.asarray(Image.open(f'pal/vis_{dev}/{pose}_{i}.png').convert('RGB'), float)
            d = np.clip((im - base).mean(2), 0, None); d[d < 4] = 0
            ys, xs = np.nonzero(d)
            v.append([float(d.sum() / 1e4), float(xs.mean()) if len(xs) else 0, float(ys.mean()) if len(ys) else 0])
        res[pose] = v
    out[dev] = res
json.dump(out, open('pal/vis.json', 'w'))
for dev, res in out.items():
    print(dev)
    for pose, v in res.items(): print(f'  {pose:7s}', ' '.join(f'{x[0]:6.1f}' for x in v))
