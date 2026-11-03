#!/usr/bin/env python3
"""The quiz result's paint, drawn by us (E-S3-result; Sam, 2026-11-03: the built stroke "doesn't look right, it's supposed
to look similar to the white one", his reference's paint swatch, a Canva element that stays out of the public repository).

This writes a paint smear of our own in the format the page already recolours (scripts/quiz/prepare-rub.mjs, quiz.css
.qz-rub): a 256 x 624 RGBA image whose alpha is the paint's outline and whose grey is its relief for a hard-light blend
over a fill of the drawn shade (0.5 leaves the shade as it is, under it darkens, over it lightens). Nothing of the
reference's pixels is used: its silhouette was measured (the paint's width at 25 heights, where it is widest, its
margins, the slight lean of its centre line) and its relief read by numbers (a flat matte body; a rolled lip along the
upper right, where the paint rolled over as the knife lifted, its inner flank a dark slot and its outer flank lit; a
thin raised rim down the lower right with a shadow band inside it; a broad lit ridge along the left; the tail a torn
wedge in shadow), and the smear below is modelled from those numbers: a height field (a rounded bead along the outline,
a gentle cylinder across the body, a low dollop over the top, the raised lip and rims, faint brush streaks along the
stroke, our own torn tail) lit by a key light from the upper right and a fill
from the left, with a broad sheen and a crisp highlight that only ever add light, rendered at four times the size and
averaged down. The shading reads an outline blurred along the rows, so the torn tail tears the edge without terracing
the body, and the bead keeps one width all the way round (wandering a little along each side), so no row kinks it.

    python3 -I scripts/quiz/make-smear.py                       # writes src/assets/quiz/smear/{smear.png,smear.webp,index.json}
    python3 -I scripts/quiz/make-smear.py --set azimuth=30 --preview out.png --colour "#b5121b" --ground "#2a0b0b"
    python3 -I scripts/quiz/make-smear.py --preview out.png --reference src/assets/quiz/rub/rub.png   # the reference drawn the same way, beside ours, for a local look only

Needs numpy, Pillow and scipy (the pictures' prepare script already needs Pillow).
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "assets" / "quiz" / "smear"
W, H = 256, 624

# Measured on the reference's swatch on 2026-11-03 (its processed copy, by numbers): the paint's width at each height as a
# share of its widest row, its first and last rows as shares of the box, the widest row's span.
PROFILE = [(0.00, 0.06), (0.005, 0.225), (0.01, 0.292), (0.02, 0.409), (0.05, 0.646), (0.10, 0.831), (0.15, 0.941),
           (0.20, 0.987), (0.25, 0.996), (0.30, 0.987), (0.35, 0.949), (0.40, 0.886), (0.45, 0.831), (0.50, 0.789),
           (0.55, 0.734), (0.60, 0.700), (0.65, 0.650), (0.70, 0.603), (0.75, 0.515), (0.80, 0.371), (0.85, 0.316),
           (0.90, 0.219), (0.95, 0.127), (0.98, 0.093), (1.00, 0.013)]
MAX_W = 237 / 256
TOP, BOT = 9 / 624, 617 / 624
CENTRE = 0.493

# The look's parameters (every one a --set key=value). Lengths are shares of the box's width unless said otherwise. Chosen
# on 2026-11-03 by a judged sweep against the reference (three readers, each lens its own, and a skeptic who measured each
# region's relief against the reference's: this set's mean absolute error over the stroke is 0.039 of the grey, from 0.104
# for the first sweep's defaults).
DEFAULTS = dict(
    ss=4,              # supersampling
    rim_px=7.0,        # the edge bead's width in px at 256 x 624, the same all round ...
    rim_wander=0.3,    # ... wandering by this share along each side, each its own way
    bead=0.35,         # the bead's height as a share of its width (1 = a quarter circle)
    body_blur=10.0,    # the outline the shading reads is blurred along the rows by this many px (at 256 x 624)
    dome=0.02,         # the body's curvature across the stroke: its crown's height as a share of the half width
    cap=0.03,          # the dollop: the paint is thickest at the top, a mound this high (share of the box's width) ...
    cap_to=0.4,        # ... that thins out by this height
    rfold=-1.2,         # the right fold: the paint rolled over where the knife lifted, a rolled lip this high (negative
                       # raises a lip, whose inner flank falls into the reference's dark slot; positive cuts a crease;
                       # share of the box's width, times 0.1) ...
    rfold_w=0.03,     # ... this wide (sigma) ...
    rfold_top=0.13,    # ... sweeping from this far in from the right edge at the top's shoulder ...
    rfold_bottom=0.065, # ... to this far in ...
    rfold_from=0.01,   # ... from this height ...
    rfold_to=0.38,     # ... to this one
    spine=0.0,        # a ridge down the tail's middle this high (share of the box's width, times 0.1; off: the measured
                       # set fits the reference's tail better without it) ...
    spine_w=0.05,      # ... this wide (sigma) ...
    spine_from=0.7,    # ... rising from this height ...
    spine_ramp=0.18,   # ... over this much of it (a short rise faces the key light and catches a hotspot), to the tip
    fold=-0.12,          # the left side: a broad low lit ridge (negative; positive cuts a crease), as a share of the
                       # box's width, times 0.1 ...
    fold_w=0.07,       # ... its width (sigma) ...
    fold_top=0.11,     # ... how far in from the left edge it starts at the shoulder ...
    fold_bottom=0.025, # ... and how far in it runs by two thirds down
    fold_from=0.05,    # the fold runs from this height ...
    fold_to=0.78,      # ... to this one
    edge=-0.38,         # the lower right edge: a thin raised rim (negative) whose inner flank is the reference's shadow
                       # band (share of the box's width, times 0.1) ...
    edge_at=0.05,      # ... centred this far in from the right edge ...
    edge_w=0.05,       # ... this wide
    vary=0.35,         # how much the folds come and go along their run (0 = even all the way)
    streak=0.002,      # brush streaks along the stroke: their height as a share of the box's width, times 0.01
    seed=7,            # the streaks' pattern
    azimuth=50.0,      # the key light: degrees from the top, positive toward the right ...
    elevation=44.0,    # ... and above the surface
    fill=0.15,         # a fill light from the opposite side, as a share of the key
    kd=0.35,           # how much the diffuse shading moves the grey from 0.5
    ks=0.35,           # the broad sheen's strength (it only adds light) ...
    shine=12.0,        # ... and exponent (lower is broader)
    ks2=0.5,           # the crisp highlight's strength (it only adds light) ...
    shine2=40.0,       # ... and exponent
    ao=0.0,           # how much a crease's floor darkens (none: with the folds raised, the slots take their dark from the light)
    tail_dark=0.15,    # the thin tail darkens by this much at its thinnest ...
    tail_w=0.30,       # ... from where the paint is narrower than this share of the box
    ragged=0.006,      # the tail's edges wander by this share of the box's width at the tip
    notch=0.6,         # the torn notches' depth, 1 = as first drawn
    flake=0.01,        # the tip's torn flakes, their reach
    lean=0.012,        # the centre line's lean to the left toward the tail
    smooth=0.0,        # the distance to the outline smoothed by this many px (at 256 x 624)
)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def edges(P, Ws, Hs):
    """the outline's left and right x at every row (float, supersampled px); NaN where there is no paint"""
    y = (np.arange(Hs) + 0.5) / Hs
    t = (y - TOP) / (BOT - TOP)
    inside = (t >= 0) & (t <= 1)
    tt = np.clip(t, 0, 1)
    width = PchipInterpolator([p[0] for p in PROFILE], [p[1] for p in PROFILE])(tt) * MAX_W   # share of the box
    centre = CENTRE - P["lean"] * smoothstep(0.6, 0.9, tt)
    l = (centre - width / 2) * Ws
    r = (centre + width / 2) * Ws
    # our own ragged tail: the edges wander a little below 0.7 of the height, more toward the tip
    amp = P["ragged"] * Ws * smoothstep(0.7, 1.0, tt)
    l = l + amp * (np.sin(2 * math.pi * 9 * tt + 0.7) + 0.5 * np.sin(2 * math.pi * 23 * tt + 1.9))
    r = r + amp * (np.sin(2 * math.pi * 8 * tt + 2.3) + 0.5 * np.sin(2 * math.pi * 19 * tt + 0.4))
    # three torn notches (a soft bite each) and two flakes at the tip (a sharp spike each), our own placement
    for t0, side, depth, height in [(0.775, "L", 0.022, 0.05), (0.850, "R", 0.016, 0.04), (0.925, "L", 0.014, 0.03)]:
        k = np.clip((tt - t0) / height, 0, 1)
        bite = P["notch"] * depth * Ws * 0.5 * (1 - np.cos(2 * math.pi * k)) * ((tt >= t0) & (tt <= t0 + height))
        if side == "L":
            l = l + bite
        else:
            r = r - bite
    for t0, side, height in [(0.865, "R", 0.028), (0.935, "L", 0.022)]:
        k = np.clip((tt - t0) / height, 0, 1)
        spike = P["flake"] * Ws * (1 - np.abs(2 * k - 1)) ** 0.6 * ((tt >= t0) & (tt <= t0 + height))
        if side == "L":
            l = l - spike
        else:
            r = r + spike
    r = np.maximum(r, l + 2)
    l[~inside] = np.nan
    r[~inside] = np.nan
    return l, r, tt, inside


def fill_ends(a):
    """the rows above and below the paint take its first and last row's value, so a blur along the rows keeps its ends"""
    idx = np.where(~np.isnan(a))[0]
    out = a.copy()
    out[:idx[0]] = a[idx[0]]
    out[idx[-1] + 1:] = a[idx[-1]]
    return out


def light(az, el):
    a, e = math.radians(az), math.radians(el)
    return np.array([math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)])


def render(P):
    SS = int(P["ss"])
    Ws, Hs = W * SS, H * SS
    l, r, t, inside = edges(P, Ws, Hs)
    xs = np.arange(Ws)[None, :] + 0.5
    L = np.where(inside, l, 1e9)[:, None]
    R = np.where(inside, r, -1e9)[:, None]
    mask = (xs >= L) & (xs <= R)
    d = ndimage.distance_transform_edt(mask)                     # px to the nearest outside pixel (the torn edge itself)
    if P["smooth"] > 0:
        d = ndimage.gaussian_filter(d, P["smooth"] * SS) * mask
    # the outline the body's shading reads: blurred along the rows, so a notch or a flake tears the edge (the bead
    # follows it through d) without stepping the dome, the folds or the tail's shadow from one row to the next
    sig = P["body_blur"] * SS
    ls = ndimage.gaussian_filter1d(fill_ends(l), sig)[:, None]
    rs = ndimage.gaussian_filter1d(fill_ends(r), sig)[:, None]
    half = np.maximum((rs - ls) / 2, 1.0)
    centre = (rs + ls) / 2
    tcol = t[:, None]
    q = np.clip((xs - centre) / half, -1, 1)
    across = np.sqrt(np.clip(1 - q * q, 0, 1))
    # 1. the bead along the edge: one width all round, so no row kinks it, wandering along the run, each side its own
    #    way, the two blended across the width so the apex and the tip carry no seam
    wl = 1 + P["rim_wander"] * np.sin(2 * math.pi * 2.3 * tcol + 0.4)
    wr = 1 + P["rim_wander"] * np.sin(2 * math.pi * 1.8 * tcol + 2.1)
    s = np.clip((q + 1) / 2, 0, 1)
    rim = P["rim_px"] * SS * (wl + (wr - wl) * s)
    u = np.clip(d / rim, 0, 1)
    h = P["bead"] * rim * np.sqrt(np.clip(1 - (1 - u) ** 2, 0, 1))
    # 2. the body: a gentle cylinder across the stroke, and the dollop, thickest at the top and thinning down the stroke
    h = h + P["dome"] * half * across
    h = h + P["cap"] * Ws * ((1 - smoothstep(0.0, P["cap_to"], tcol)) ** 2) * across
    # 3. the left fold: a crease running from the shoulder down the left third, closer to the edge as it goes, its depth
    #    rising and falling along the run; and the right edge's shallow shadow band
    wave_l = 1 - P["vary"] * 0.5 * (1 + np.sin(2 * math.pi * 1.9 * tcol + 0.8))
    wave_r = 1 - P["vary"] * 0.5 * (1 + np.sin(2 * math.pi * 1.5 * tcol + 2.4))
    run_l = smoothstep(P["fold_from"], P["fold_from"] + 0.1, tcol) * (1 - smoothstep(P["fold_to"] - 0.12, P["fold_to"], tcol))
    off = (P["fold_top"] - (P["fold_top"] - P["fold_bottom"]) * smoothstep(0.1, 0.66, tcol)) * Ws
    crease = np.exp(-((xs - (ls + off)) ** 2) / (2 * (P["fold_w"] * Ws) ** 2))
    h = h - P["fold"] * Ws * 0.1 * run_l * wave_l * crease
    run_r = smoothstep(0.08, 0.2, tcol) * (1 - smoothstep(0.7, 0.82, tcol))
    band = np.exp(-((xs - (rs - P["edge_at"] * Ws)) ** 2) / (2 * (P["edge_w"] * Ws) ** 2))
    h = h - P["edge"] * Ws * 0.1 * run_r * wave_r * band
    # 3b. the right fold, the deepest crease: from the top's right shoulder down the right side, nearer the edge as it
    #     goes, its lip (between the crease and the bead) facing the key light
    run_rf = smoothstep(P["rfold_from"], P["rfold_from"] + 0.04, tcol) * (1 - smoothstep(P["rfold_to"] - 0.15, P["rfold_to"], tcol))
    off_r = (P["rfold_top"] - (P["rfold_top"] - P["rfold_bottom"]) * smoothstep(0.03, P["rfold_to"], tcol)) * Ws
    rcrease = np.exp(-((xs - (rs - off_r)) ** 2) / (2 * (P["rfold_w"] * Ws) ** 2))
    h = h - P["rfold"] * Ws * 0.1 * run_rf * rcrease
    # 3c. the tail drawn to a point: a ridge down its middle, so its two flanks fall away from it
    run_sp = smoothstep(P["spine_from"], P["spine_from"] + P["spine_ramp"], tcol)
    h = h + P["spine"] * Ws * 0.1 * run_sp * np.exp(-((xs - centre) ** 2) / (2 * (P["spine_w"] * Ws) ** 2))
    # 4. brush streaks along the stroke: long, soft, faint
    rng = np.random.default_rng(int(P["seed"]))
    noise = ndimage.gaussian_filter(rng.standard_normal((Hs, Ws)).astype(np.float32), (14 * SS, 1.6 * SS))
    noise /= max(1e-6, noise.std())
    h = h + P["streak"] * 0.01 * Ws * noise * np.clip(d / (6 * SS), 0, 1)
    h = np.where(mask, h, 0.0)
    gy, gx = np.gradient(h)
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    key, fillv = light(P["azimuth"], P["elevation"]), light(P["azimuth"] + 180, 60)
    diffuse = np.clip(n @ key, 0, 1) + P["fill"] * np.clip(n @ fillv, 0, 1)
    flat = key[2] + P["fill"] * fillv[2]
    g = 0.5 + P["kd"] * (diffuse - flat) / flat
    hv = key + np.array([0.0, 0.0, 1.0])
    hv /= np.linalg.norm(hv)
    for ks, shine in [(P["ks"], P["shine"]), (P["ks2"], P["shine2"])]:
        # a highlight only adds light: what faces away from it is left to the diffuse term (a negative specular drew
        # the away-facing bead as an inked outline)
        g = g + ks * np.clip(np.clip(n @ hv, 0, 1) ** shine - hv[2] ** shine, 0, None)
    g = g - P["ao"] * (run_l * wave_l * crease + run_rf * rcrease)            # the creases' floors in shadow
    narrow = np.clip(((rs - ls)[:, 0] / Ws) / P["tail_w"], 0, 1)
    g = g - P["tail_dark"] * (1 - np.where(inside, narrow, 1.0))[:, None]
    g = np.where(mask, np.clip(g, 0.02, 0.98), 0.5)
    grey = g.reshape(H, SS, W, SS).mean(axis=(1, 3))
    alpha = mask.astype(np.float32).reshape(H, SS, W, SS).mean(axis=(1, 3))
    return grey, alpha


def to_image(grey, alpha):
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = np.round(grey * 255).astype(np.uint8)
    rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def hex_rgb(s):
    s = s.lstrip("#")
    return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def composite(grey, alpha, colour, ground):
    """the page's drawing: the shade under a hard-light relief, inside the outline, over the ground"""
    c = hex_rgb(colour)[None, None, :]
    g = grey[..., None]
    paint = np.where(g <= 0.5, 2 * g * c, 1 - 2 * (1 - g) * (1 - c))
    out = hex_rgb(ground)[None, None, :] * (1 - alpha[..., None]) + paint * alpha[..., None]
    return Image.fromarray(np.round(np.clip(out, 0, 1) * 255).astype(np.uint8), "RGB")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--set", action="append", default=[], metavar="KEY=VALUE", help="override a parameter")
    ap.add_argument("--out", default=str(OUT), help="the asset folder (default src/assets/quiz/smear)")
    ap.add_argument("--no-asset", action="store_true", help="write no asset, only the preview")
    ap.add_argument("--preview", help="write the paint composited in a colour over a ground to this PNG")
    ap.add_argument("--colour", default="#b5121b")
    ap.add_argument("--ground", default="#2a0b0b")
    ap.add_argument("--scale", type=int, default=1, help="the preview's magnification")
    ap.add_argument("--reference", help="an RGBA relief in the same format, drawn beside ours in the preview (a local look only)")
    args = ap.parse_args()
    P = dict(DEFAULTS)
    for kv in args.set:
        k, v = kv.split("=", 1)
        if k not in P:
            raise SystemExit(f"unknown parameter {k}; known: {', '.join(P)}")
        P[k] = float(v)
    grey, alpha = render(P)
    if not args.no_asset:
        out = Path(args.out)
        out.mkdir(parents=True, exist_ok=True)
        img = to_image(grey, alpha)
        img.save(out / "smear.png", optimize=True)
        img.save(out / "smear.webp", quality=92, method=6, exact=True)
        (out / "index.json").write_text(json.dumps({
            "width": W, "height": H,
            "source": "our own relief, scripts/quiz/make-smear.py (the reference's silhouette and shading measured by numbers, nothing of its pixels)",
            "params": P,
        }, indent=2) + "\n", encoding="utf-8")
        print(f"smear: {W} x {H} -> {out}")
    if args.preview:
        ours = composite(grey, alpha, args.colour, args.ground)
        panels = [ours]
        if args.reference:
            ref = np.asarray(Image.open(args.reference).convert("RGBA")).astype(np.float32) / 255
            panels.append(composite(ref[..., 0], ref[..., 3], args.colour, args.ground))
        gap = 24
        sheet = Image.new("RGB", (sum(p.width for p in panels) + gap * (len(panels) - 1), H), tuple(int(v * 255) for v in hex_rgb(args.ground)))
        x = 0
        for p in panels:
            sheet.paste(p, (x, 0))
            x += p.width + gap
        if args.scale > 1:
            sheet = sheet.resize((sheet.width * args.scale, sheet.height * args.scale), Image.LANCZOS)
        sheet.save(args.preview)
        print(f"preview -> {args.preview}")


if __name__ == "__main__":
    main()
