"""Pixel statistics for contrast checks: relative luminance (WCAG) of the pixels inside boxes of a screenshot.
Usage: python3 -I tests/harness/pixels.py <image.png> '<json list of [x, y, w, h] in image pixels>'
Prints a JSON list of {max, p95, median, rgb_median} per box, luminance in 0..1."""
import json, sys
import numpy as np
from PIL import Image
img = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float64) / 255.0
lin = np.where(img <= 0.04045, img / 12.92, ((img + 0.055) / 1.055) ** 2.4)
L = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
out = []
for x, y, w, h in json.loads(sys.argv[2]):
    x0, y0 = max(0, int(x)), max(0, int(y)); x1, y1 = min(L.shape[1], int(x + w + 0.999)), min(L.shape[0], int(y + h + 0.999))
    patch = L[y0:y1, x0:x1].ravel(); rgb = (img[y0:y1, x0:x1].reshape(-1, 3) * 255)
    out.append({'max': float(patch.max()), 'p95': float(np.percentile(patch, 95)), 'median': float(np.median(patch)),
                'rgb_median': [round(float(v)) for v in np.median(rgb, axis=0)], 'n': int(patch.size)})
print(json.dumps(out))
