#!/usr/bin/env python3
"""The quiz result's paint, drawn by us (E-S3-result; Sam, 2026-11-03: the built stroke "doesn't look right, it's supposed
to look similar to the white one", his reference's paint swatch, a Canva element that stays out of the public repository).

This writes a paint smear of our own in the format the page already recolours (scripts/quiz/prepare-rub.mjs, quiz.css
.qz-rub): a 256 x 624 RGBA image whose alpha is the paint's outline and whose grey is its relief for a hard-light blend
over a fill of the drawn shade (0.5 leaves the shade as it is, under it darkens, over it lightens). Nothing of the
reference's pixels is used: its silhouette was measured (the width of the paint at 23 heights, where it is widest, its
margins, the slight lean of its centre line) and its relief read by numbers (a flat body; a fold running down the left
third from the shoulder, lit on its lip and dark in its crease; a thin lit rim and a soft shadow band along the right
edge; a broad sheen over the dome's top right; the thin tail in shadow), and the smear below is modelled from those
numbers: a height field (a rounded bead along the outline, a gentle cylinder across the body, the two folds, brush
streaks along the stroke, our own torn tail) lit by a key light from the upper right, a fill from the left and two
speculars, rendered at four times the size and averaged down.

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

# Measured on the reference's swatch on 2026-11-03 (scratch script measure-rub.py over its processed copy): the paint's
# width at each height as a share of its widest row, its first and last rows as shares of the box, the widest row's span.
PROFILE = [(0.00, 0.025), (0.02, 0.409), (0.05, 0.646), (0.10, 0.831), (0.15, 0.941), (0.20, 0.987), (0.25, 0.996),
           (0.30, 0.987), (0.35, 0.949), (0.40, 0.886), (0.45, 0.831), (0.50, 0.789), (0.55, 0.734), (0.60, 0.700),
           (0.65, 0.650), (0.70, 0.603), (0.75, 0.515), (0.80, 0.371), (0.85, 0.316), (0.90, 0.219), (0.95, 0.127),
           (0.98, 0.093), (1.00, 0.013)]
MAX_W = 237 / 256
TOP, BOT = 9 / 624, 617 / 624
CENTRE = 0.493

# The look's parameters (every one a --set key=value). Lengths are shares of the box's width unless said otherwise.
DEFAULTS = dict(
    ss=4,              # supersampling
    rim=0.14,          # the edge bead's width as a share of the row's half width ...
    rim_min=5.0,       # ... at least this many px (at 256 x 624) ...
    rim_max=12.0,      # ... and at most this many
    bead=0.6,          # the bead's height as a share of its width (1 = a quarter circle)
    dome=0.06,         # the body's curvature across the stroke: its crown's height as a share of the half width
    cap=0.05,          # the dollop: the paint is thickest at the top, a mound this high (share of the box's width) ...
    cap_to=0.4,        # ... that thins out by this height
    fold=0.5,          # the left fold: the crease's depth, as a share of the box's width, times 0.1 ...
    fold_w=0.02,       # ... its width (sigma) ...
    fold_top=0.11,     # ... how far in from the left edge it starts at the shoulder ...
    fold_bottom=0.025, # ... and how far in it runs by two thirds down
    fold_from=0.05,    # the fold runs from this height ...
    fold_to=0.78,      # ... to this one
    edge=0.22,         # the right edge's shadow band: a shallow valley this deep (share of the box's width, times 0.1) ...
    edge_at=0.05,      # ... centred this far in from the right edge ...
    edge_w=0.03,       # ... this wide
    vary=0.35,         # how much the folds come and go along their run (0 = even all the way)
    streak=0.01,       # brush streaks along the stroke: their height as a share of the box's width, times 0.01
    seed=7,            # the streaks' pattern
    azimuth=38.0,      # the key light: degrees from the top, positive toward the right ...
    elevation=44.0,    # ... and above the surface
    fill=0.45,         # a fill light from the opposite side, as a share of the key
    kd=0.35,           # how much the diffuse shading moves the grey from 0.5
    ks=0.5,            # the broad sheen's strength ...
    shine=7.0,         # ... and exponent (lower is broader)
    ks2=0.3,           # the crisp highlight's strength ...
    shine2=60.0,       # ... and exponent
    ao=0.08,           # how much the fold's floor darkens
    tail_dark=0.08,    # the thin tail darkens by this much at its thinnest ...
    tail_w=0.30,       # ... from where the paint is narrower than this share of the box
    ragged=0.010,      # the tail's edges wander by this share of the box's width at the tip
    notch=1.0,         # the torn notches' depth, 1 = as designed
    flake=0.018,       # the tip's torn flakes, their reach
    lean=0.012,        # the centre line's lean to the left toward the tail
    smooth=2.5,        # the relief follows an outline smoothed by this many px (at 256 x 624), so a tear casts no ridge
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
    # the distance to the outline, smoothed so a tear in the edge is a tear, not a ridge (the alpha keeps the exact outline)
    d = ndimage.distance_transform_edt(mask)                     # px to the nearest outside pixel
    if P["smooth"] > 0:
        d = ndimage.gaussian_filter(d, P["smooth"] * SS) * mask
    half = np.where(inside, (r - l) / 2, 1.0)[:, None]
    centre = np.where(inside, (r + l) / 2, 0.0)[:, None]
    tcol = t[:, None]
    # 1. the bead along the edge: a rounded lip, steep at the outline, flat within a short way
    rim = np.clip(P["rim"] * half, P["rim_min"] * SS, P["rim_max"] * SS)
    u = np.clip(d / rim, 0, 1)
    h = P["bead"] * rim * np.sqrt(np.clip(1 - (1 - u) ** 2, 0, 1))
    # 2. the body: a gentle cylinder across the stroke (its crown a small share of the half width)
    q = np.clip((xs - centre) / np.maximum(half, 1), -1, 1)
    across = np.sqrt(np.clip(1 - q * q, 0, 1))
    h = h + P["dome"] * half * across
    # 2b. the dollop: the paint is thickest at the top and thins down the stroke, a mound over the top whose shoulders
    #     slope away on every side (the sheen sits on its upper right)
    h = h + P["cap"] * Ws * ((1 - smoothstep(0.0, P["cap_to"], tcol)) ** 2) * across
    # 3. the left fold: a crease running from the shoulder down the left third, closer to the edge as it goes, its
    #    depth rising and falling along the run; and the right edge's shallow shadow band
    wave_l = 1 - P["vary"] * 0.5 * (1 + np.sin(2 * math.pi * 1.9 * tcol + 0.8))
    wave_r = 1 - P["vary"] * 0.5 * (1 + np.sin(2 * math.pi * 1.5 * tcol + 2.4))
    run_l = smoothstep(P["fold_from"], P["fold_from"] + 0.1, tcol) * (1 - smoothstep(P["fold_to"] - 0.12, P["fold_to"], tcol))
    off = (P["fold_top"] - (P["fold_top"] - P["fold_bottom"]) * smoothstep(0.1, 0.66, tcol)) * Ws
    crease = np.exp(-((xs - (L + off)) ** 2) / (2 * (P["fold_w"] * Ws) ** 2))
    h = h - P["fold"] * Ws * 0.1 * run_l * wave_l * crease
    run_r = smoothstep(0.08, 0.2, tcol) * (1 - smoothstep(0.7, 0.82, tcol))
    band = np.exp(-((xs - (R - P["edge_at"] * Ws)) ** 2) / (2 * (P["edge_w"] * Ws) ** 2))
    h = h - P["edge"] * Ws * 0.1 * run_r * wave_r * band
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
    view = np.array([0.0, 0.0, 1.0])
    for ks, shine in [(P["ks"], P["shine"]), (P["ks2"], P["shine2"])]:
        hv = key + view
        hv /= np.linalg.norm(hv)
        g = g + ks * (np.clip(n @ hv, 0, 1) ** shine - hv[2] ** shine)     # the flat body stays at 0.5
    g = g - P["ao"] * run_l * wave_l * crease                                 # the crease floor in shadow
    narrow = np.clip(((r - l) / Ws) / P["tail_w"], 0, 1)
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
