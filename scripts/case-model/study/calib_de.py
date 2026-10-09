"""CIEDE2000 between each catalog hex and the rendered pixel, per tone mapper.
Usage: python3 -I calib_de.py <calib dir>"""
import json, sys, glob, os
import numpy as np

def srgb_to_lab(rgb):
    c = np.asarray(rgb, float) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = lin @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > (6 / 29) ** 3, np.cbrt(xyz), xyz / (3 * (6 / 29) ** 2) + 4 / 29)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def de2000(l1, l2):
    L1, a1, b1 = l1[..., 0], l1[..., 1], l1[..., 2]; L2, a2, b2 = l2[..., 0], l2[..., 1], l2[..., 2]
    C1 = np.hypot(a1, b1); C2 = np.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p = (1 + G) * a1; a2p = (1 + G) * a2
    C1p = np.hypot(a1p, b1); C2p = np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360; h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp = L2 - L1; dCp = C2p - C1p
    dhp = h2p - h1p; dhp = np.where(dhp > 180, dhp - 360, dhp); dhp = np.where(dhp < -180, dhp + 360, dhp)
    dhp = np.where(C1p * C2p == 0, 0, dhp)
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dhp / 2))
    Lbp = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hsum = h1p + h2p
    hbp = np.where(np.abs(h1p - h2p) > 180, (hsum + 360) / 2, hsum / 2); hbp = np.where(C1p * C2p == 0, hsum, hbp)
    T = 1 - 0.17 * np.cos(np.radians(hbp - 30)) + 0.24 * np.cos(np.radians(2 * hbp)) + 0.32 * np.cos(np.radians(3 * hbp + 6)) - 0.20 * np.cos(np.radians(4 * hbp - 63))
    dth = 30 * np.exp(-(((hbp - 275) / 25) ** 2)); Rc = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / np.sqrt(20 + (Lbp - 50) ** 2); Sc = 1 + 0.045 * Cbp; Sh = 1 + 0.015 * Cbp * T
    Rt = -np.sin(np.radians(2 * dth)) * Rc
    return np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)), dLp, dhp

d = sys.argv[1]
out = {}
for tone in ('none', 'neutral', 'agx', 'aces'):
    hexes, got, names = [], [], []
    for f in sorted(glob.glob(os.path.join(d, tone + '-*.json'))):
        info = json.load(open(f))['info']
        for s in info['samples']:
            h = s['hex'].lstrip('#'); hexes.append([int(h[i:i + 2], 16) for i in (0, 2, 4)]); got.append(s['rgb']); names.append(info['family'] + '/' + s['name'])
    if not hexes: continue
    L1 = srgb_to_lab(hexes); L2 = srgb_to_lab(got)
    de, dL, dh = de2000(L1, L2)
    chroma = np.hypot(L1[:, 1], L1[:, 2])
    sat = chroma > 20
    worst = np.argsort(-de)[:5]
    out[tone] = {
        'n': len(de), 'dE00_median': round(float(np.median(de)), 2), 'dE00_p90': round(float(np.percentile(de, 90)), 2), 'dE00_max': round(float(de.max()), 2),
        'share_under_2': round(float((de < 2).mean()), 3), 'share_under_5': round(float((de < 5).mean()), 3),
        'dL_median': round(float(np.median(dL)), 2), 'abs_dhue_median_saturated_deg': round(float(np.median(np.abs(dh[sat]))), 2), 'abs_dhue_p90_saturated_deg': round(float(np.percentile(np.abs(dh[sat]), 90)), 2),
        'worst': [(names[i], '#%02x%02x%02x' % tuple(hexes[i]), [round(x) for x in got[i]], round(float(de[i]), 1)) for i in worst],
    }
print(json.dumps(out, indent=1))
json.dump(out, open(os.path.join(d, 'calib-summary.json'), 'w'), indent=1)
