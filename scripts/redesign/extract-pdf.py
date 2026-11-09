#!/usr/bin/env python3
"""The redesign's picture masters, cut from Sam's "Skreed Pre-Launch" design (docs/specs/redesign.md, section 6).

Sam, 2026-11-09: "checkout the pdf, and build the exact same thing". The design is a Canva export whose pictures are
embedded in the PDF, so this script reads them out of it and writes one master per picture the landing page shows,
cropped as the PDF frames it. Nothing of the PDF goes into the repository: the PDF stays where Sam keeps it and the
masters land in assets-src/redesign/, which is git-ignored, as are the encoded files (src/assets/redesign/) until Sam
says the pictures may be committed to the public repository.

A picture is found by where the PDF draws it (its rectangle on page 1, in points) and by its pixel size, never by its
object number, so a fresh export of the same design still resolves. The script stops if one is missing.

Also made here, because they are derived pixels of the same frames:
  the twelve case cut-outs of "what you've seen so far" (the front view of each three-view render, with its alpha);
  the shade picker's five pictures (the one frame the PDF holds of the Canva clip, 1280 x 720: the two products drawn
  again from it at three times its size, painted to match the frame's five dots, picker() says how);
  the ten brush swatches of the family row (the one frame the PDF holds of that clip: six of them off its ground as
  they are, the other four the same brush in catalog shades, swatches() says how);
  the three brush blobs over the family row's headline (paint in paths in the PDF, drawn again from those paths on a
  clear sheet, blobs() says how).

Run from the repo root (PyMuPDF, Pillow, numpy and scipy; the Mac's anaconda has all four):
  python3 -I scripts/redesign/extract-pdf.py "<path to Skreed Pre-Launch.pdf>" [out=assets-src/redesign]
then  node scripts/redesign/encode-pictures.mjs
"""
import io, json, os, sys

import numpy as np
import pymupdf
from PIL import Image
from scipy import ndimage, sparse
from scipy.optimize import least_squares
from scipy.sparse.linalg import spsolve

sys.dont_write_bytecode = True
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# name: (pixel size, the top-left of the rectangle the PDF draws it in, the frame that crops it or None for the whole
# picture, the ground an alpha picture is laid on or None)
WHOLE = {
    "hero":           ((1639, 1639), (-16.0, -213.5), None, None),
    "glimpse-band":   ((1600, 1600), (0.0, 2595.4), None, None),
    "match":          ((1639, 1639), (0.0, 4590.0), None, None),
    "proof":          ((1639, 1639), (0.0, 7946.2), None, None),
    "tile-monochrome": ((864, 864), (20.8, 5620.7), None, None),
    "tile-lifestyle": ((1000, 500), (362.0, 5612.5), None, None),
    "tile-peppy":     ((864, 864), (20.8, 5933.3), None, None),
    "tile-pastel":    ((769, 512), (343.3, 5950.6), None, None),
    "tile-corporate": ((648, 648), (689.3, 5887.4), None, None),
    "product-case":      ((592, 432), (-70.5, 4452.4), (17.8, 4453.2, 213.1, 4723.5), None),
    "product-airpods":   ((500, 333), (154.1, 4446.9), (230.1, 4453.2, 402.5, 4654.3), None),
    "product-lenskin":   ((1132, 800), (242.7, 4453.2), (419.6, 4453.2, 604.9, 4654.3), None),
    "product-magsocket": ((538, 717), (630.0, 4451.3), (621.9, 4453.2, 794.3, 4654.3), (255, 255, 255)),
    "product-wallet":    ((1129, 798), (604.9, 4430.8), (811.4, 4453.2, 1006.7, 4723.5), (255, 255, 255)),
    "picker-frame":   ((1280, 720), (0.0, 2286.6), None, None),
    "swatch-frame":   ((1280, 822), (120.9, 2083.2), None, None),
}
# the three fans of "what you've seen so far": front to back, by the left edge of each render's rectangle
CASES = {
    "grey":  (-164.2, -125.1, -79.4, -40.3),
    "blue":  (155.5, 194.6, 240.3, 279.5),
    "brown": (480.3, 528.2, 576.1, 613.0),
}
CASE_SIZE, CASE_Y = (1505, 1064), 925.2
CASE_FRONT = (536, 102, 969, 956)   # the front view inside each three-view render, measured from the alpha
# the picker's five catalog shades (docs/data/shades-240.json), in the order of the frame's five dots. An id is what the
# site calls a picture and its dot; the colours are the frame's own, dots_of() and as_sage() say how
PICKER = ("blissful-blue-22", "blissful-blue-03", "go-green-19", "go-green-05", "go-green-09")
PICKER_OWN = "go-green-09"          # the shade the frame itself shows (spec D10): it keeps the frame's own colour
PICKER_DOTS = (71.71, 68.27, 39.44, 32.17)   # the frame's dots, fitted to their edges: the first's middle, the pitch and the radius, in the frame's pixels
PICKER_ARROW = (4.0, 6.0)           # the frame's arrow lies on the last dot, right of and below this far from its middle
PICKER_BOX = (400, 120, 920, 620)   # the two products with their shadows, in the frame's pixels: the canvas the page lays out
PICKER_PAD = 32                     # how far round that box the frame is read, so nothing is cut off at the canvas's edge
PICKER_S = 3                        # the masters' pixels to the frame's: 1560 x 1500, for 2x screens at the widest the page draws it
PICKER_RING = (668.25, 469.0, 7.0, 13.2)   # the AirPods case's ring, fitted to its outline: its middle and two radii, in the frame's pixels
PICKER_EDGE = 0.7                   # how wide a drawn edge is, in the frame's pixels
PICKER_SHEEN = 0.3                  # how much of the light above the body's own level stays (the frame's glare on the AirPods case's right)
PEARL = (247, 246, 243)             # the section's ground, Pearl Whisper (rd-glimpse.css)
# the swatches: the master's scale over the frame's pixels and its half side in the frame's pixels (the brush reaches
# 62 px from its middle at the most, whichever way it is turned, so a turned swatch stays in its square)
SWATCH_S, SWATCH_R = 3, 64
# how much more a swatch's alpha leans on its own pixels than its contrast alone would ask, and the alpha below which
# the frame's ringing lies and above which a body is whole
SWATCH_OWN, SWATCH_LO, SWATCH_HI = 2.0, 0.05, 0.96
# the four swatches the PDF's frame does not show: the swatch of the frame whose alpha each reuses (by its place in the
# frame), then a turn in degrees and whether it is mirrored first. Chosen by looking at the row, so that no swatch is a
# visible copy of the one beside it, at one row of ten or at two rows of five
SWATCH_TURNS = ((2, 200, True), (1, 75, False), (4, 305, True), (3, 140, False))
# the three blobs: their names, the colour the PDF fills them with and the left of their paths, in points; the top the
# three share. The master is the brush at this many pixels a point, on a canvas with a clear margin of about 0.7 point,
# and it is drawn this many times larger than that before it is taken down to size
BLOBS = {"blob-grey": ("#363636", 209.31), "blob-blue": ("#394e77", 467.42), "blob-brown": ("#522723", 725.84)}
BLOB_TOP, BLOB_SIZE, BLOB_Z, BLOB_SS = 1516.09, (480, 496), 4.75, 4


def find(page, doc, size, origin, tol=3.0, prefer=None):
    """the image object drawn with its top-left at `origin` whose pixels are `size`; with several, the last drawn"""
    hits = []
    for img in page.get_images(full=True):
        xref, smask, w, h = img[0], img[1], img[2], img[3]
        if (w, h) != size:
            continue
        for r in page.get_image_rects(xref):
            if abs(r.x0 - origin[0]) <= tol and abs(r.y0 - origin[1]) <= tol:
                hits.append((xref, smask, r))
    if not hits:
        sys.exit(f"extract-pdf: no {size[0]} x {size[1]} picture at {origin} on page 1; is this the Skreed Pre-Launch design?")
    return hits[prefer if prefer is not None else -1]


def pixels(doc, xref, smask):
    pm = pymupdf.Pixmap(doc, xref)
    if pm.colorspace and pm.colorspace.n > 3:
        pm = pymupdf.Pixmap(pymupdf.csRGB, pm)
    if smask:
        pm = pymupdf.Pixmap(pm, pymupdf.Pixmap(doc, smask))
    return Image.open(io.BytesIO(pm.tobytes("png"))).convert("RGBA" if smask else "RGB")


def lin(c):
    c = np.asarray(c, dtype=np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def unlin(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055) * 255.0


def to_oklab(rgb):
    r, g, b = lin(rgb[..., 0]), lin(rgb[..., 1]), lin(rgb[..., 2])
    l = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return np.stack([0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
                     1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
                     0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s], axis=-1)


def from_oklab(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return np.stack([unlin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
                     unlin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
                     unlin(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)], axis=-1)


def smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def resized(a, size, how):
    return np.asarray(Image.fromarray(a.astype(np.float32), "F").resize(size, how), dtype=np.float64)


def enlarged(a):
    """the frame's pixels at the masters' size by a good resampler, its ringing held inside what the pixels around allow"""
    size = (a.shape[1] * PICKER_S, a.shape[0] * PICKER_S)
    return np.clip(resized(a, size, Image.LANCZOS), resized(ndimage.minimum_filter(a, 3), size, Image.BILINEAR), resized(ndimage.maximum_filter(a, 3), size, Image.BILINEAR))


def spread(a):
    """a smooth field at the masters' size"""
    return resized(a, (a.shape[1] * PICKER_S, a.shape[0] * PICKER_S), Image.BICUBIC)


def solve_light(y, body, other, eps=2e-5):
    """how much of each pixel's light is the body's: known where the seeds say, between them by closed-form matting with
    the luminance as the guide (Levin, Lischinski and Weiss, 2008)"""
    h, w = y.shape
    unknown = ~(body | other)
    ys, xs = np.nonzero(ndimage.binary_dilation(unknown, iterations=1))
    keep = (ys > 0) & (ys < h - 1) & (xs > 0) & (xs < w - 1)
    ys, xs = ys[keep], xs[keep]
    idx = np.stack([(ys + dy) * w + (xs + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)], axis=1)
    v = y.ravel()[idx]
    d = v - v.mean(1, keepdims=True)
    var = (d * d).mean(1, keepdims=True)
    g = np.eye(9)[None] - (1.0 / 9.0) * (1.0 + d[:, :, None] * d[:, None, :] / (var[:, :, None] + eps / 9.0))
    rows, cols = np.repeat(idx[:, :, None], 9, axis=2).ravel(), np.repeat(idx[:, None, :], 9, axis=1).ravel()
    lap = sparse.coo_matrix((g.ravel(), (rows, cols)), shape=(h * w, h * w)).tocsr()
    known = np.where(body, y, 0.0).ravel()
    u, k = np.nonzero(unknown.ravel())[0], np.nonzero(~unknown.ravel())[0]
    known[u] = spsolve((lap[u][:, u] + sparse.identity(len(u)) * 1e-9).tocsc(), -(lap[u][:, k] @ known[k]))
    return np.clip(known.reshape(h, w), 0, y)


def blur_in(values, mask, sigma):
    """a Gaussian blur that takes only the mask's pixels, so nothing from outside it comes in; and how sure it is"""
    weight = mask.astype(np.float64)
    den = ndimage.gaussian_filter(weight, sigma)
    return ndimage.gaussian_filter(values * weight, sigma) / np.maximum(den, 1e-6), den


def carried(values, mask, sigma, rounds=6):
    """values on the mask's pixels; off it the nearest of them, softly, by blurs that double"""
    res = np.where(mask, values, 0.0)
    have = mask.copy()
    for i in range(rounds):
        v, den = blur_in(values, mask, sigma * 2 ** i)
        ok = (den > 1e-3) & ~have
        res[ok] = v[ok]
        have |= ok
    return res


def within(a, mask, sigma_space, sigma_range, radius):
    """a bilateral filter over the mask's pixels: the mottle goes, a drawn mark stays"""
    num, den = np.zeros_like(a), np.zeros_like(a)
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            near = np.exp(-(dx * dx + dy * dy) / (2 * sigma_space ** 2))
            if near < 0.01:
                continue
            b = np.roll(a, (dy, dx), axis=(0, 1))
            weight = near * np.exp(-((b - a) ** 2) / (2 * sigma_range ** 2)) * np.roll(mask, (dy, dx), axis=(0, 1))
            num += weight * b
            den += weight
    return np.where(mask & (den > 0), num / np.maximum(den, 1e-9), a)


def outline_rays(cover, box, inward, n=4096, step=0.25):
    """where the cover crosses a half on n rays from the middle of a box: the outermost crossing, or for a hole the first"""
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    centre = (0.5 * (box[1].start + box[1].stop), 0.5 * (box[0].start + box[0].stop))
    rs = np.arange(0.0, 0.75 * np.hypot(box[1].stop - box[1].start, box[0].stop - box[0].start), step)
    v = ndimage.map_coordinates(cover, [centre[1] + np.outer(np.sin(th), rs), centre[0] + np.outer(np.cos(th), rs)], order=1, mode="constant", cval=0.0)
    above = v >= 0.5
    rho = np.full(n, np.nan)
    j = (above.shape[1] - 1 - np.argmax(above[:, ::-1], axis=1)) if inward else (np.argmax(above, axis=1) - 1)
    ok = above.any(axis=1) & (j + 1 < len(rs)) & (j >= 0)
    i = np.nonzero(ok)[0]
    v0, v1 = v[i, j[i]], v[i, j[i] + 1]
    rho[i] = rs[j[i]] + np.where(v1 != v0, (0.5 - v0) / np.where(v1 != v0, v1 - v0, 1), 0.5) * step
    return th, rho, centre


def round_rect(th, a, b, rx, ry, q):
    """the radius, along each bearing from its middle, of a rectangle of half sides a and b whose corners are quarter
    superellipses of half axes rx and ry and power q (2 is a circle's arc)"""
    c, s = np.abs(np.cos(th)), np.abs(np.sin(th))
    lo, hi = np.zeros_like(th), np.full_like(th, 2.0 * (a + b))
    for _ in range(46):
        t = 0.5 * (lo + hi)
        u, v = t * c, t * s
        corner = (u > a - rx) & (v > b - ry)
        g = np.where(corner, (np.clip(u - (a - rx), 0, None) / rx) ** q + (np.clip(v - (b - ry), 0, None) / ry) ** q - 1.0, np.maximum((u - a) / rx, (v - b) / ry))
        lo, hi = np.where(g < 0, t, lo), np.where(g < 0, hi, t)
    return 0.5 * (lo + hi)


def fitted_shape(th, rho, centre, sharp, label):
    """A product's outline is a rounded rectangle, so it is measured as one. Its four sides first, each the median of
    the edge along the straight part of that side, the edge being where the frame's sharp luminance changes fastest
    within reach of the solved cover: a button, a notch or a stretch where the ground's shadow matches the body cannot
    move a median. Then its corners, the same four, by least squares with a robust loss."""
    s = PICKER_S
    ok = ~np.isnan(rho)
    x, y = centre[0] + rho * np.cos(th), centre[1] + rho * np.sin(th)
    mid_x, mid_y = 0.5 * (np.nanmin(x) + np.nanmax(x)), 0.5 * (np.nanmin(y) + np.nanmax(y))
    half_x, half_y = 0.5 * (np.nanmax(x) - np.nanmin(x)), 0.5 * (np.nanmax(y) - np.nanmin(y))
    corner = 0.32 * min(half_x, half_y)
    sides = []
    for near, nx, ny in ((x < mid_x, -1.0, 0.0), (x > mid_x, 1.0, 0.0), (y < mid_y, 0.0, -1.0), (y > mid_y, 0.0, 1.0)):
        sel = ok & near & (np.abs(y - mid_y) < half_y - corner if nx else np.abs(x - mid_x) < half_x - corner)
        fx, fy = (x[sel] + 0.5) / s - 0.5, (y[sel] + 0.5) / s - 0.5
        ts = np.arange(-5.0, 5.01, 0.25)
        v = ndimage.map_coordinates(sharp, [fy[:, None] + ny * ts, fx[:, None] + nx * ts], order=3, mode="nearest")
        g = np.abs(np.gradient(v, ts, axis=1))
        j = np.argmax(g, axis=1)
        moved = ts[j] * (g[np.arange(len(j)), j] > 0.012)
        sides.append((np.median((fx + nx * moved) if nx else (fy + ny * moved)) + 0.5) * s - 0.5)
    x0, x1, y0, y1 = sides
    mid = (0.5 * (x0 + x1), 0.5 * (y0 + y1))
    a, b = 0.5 * (x1 - x0), 0.5 * (y1 - y0)
    hx, hy = x[ok] - mid[0], y[ok] - mid[1]
    bearing, radius = np.arctan2(hy, hx) % (2 * np.pi), np.hypot(hx, hy)
    at_corner = (np.abs(hx) > a - 1.3 * corner) & (np.abs(hy) > b - 1.3 * corner)
    rx, ry, q = least_squares(lambda p: round_rect(bearing[at_corner], a, b, *p) - radius[at_corner], (0.3 * min(a, b), 0.3 * min(a, b), 2.2), bounds=([2.0, 2.0, 1.5], [a, b, 6.0]), loss="soft_l1", f_scale=1.0).x
    print(f"  {label}: sides {(x0 + .5) / s - .5:.2f} to {(x1 + .5) / s - .5:.2f} across and {(y0 + .5) / s - .5:.2f} to {(y1 + .5) / s - .5:.2f} down, corners {rx / s:.1f} x {ry / s:.1f} at power {q:.2f} (the crop's pixels)")
    return mid, (a, b, rx, ry, q)


def edge_distance(xq, yq, mid, shape, th, rho, drho):
    """how far a point lies inside a shape along the normal, in its own units, and its bearing"""
    t = np.arctan2(yq - mid[1], xq - mid[0]) % (2 * np.pi)
    at = np.interp(t, th, rho, period=2 * np.pi)
    return (at - np.hypot(xq - mid[0], yq - mid[1])) / np.sqrt(1 + (np.interp(t, th, drho, period=2 * np.pi) / np.maximum(at, 1e-6)) ** 2), t


def tabled(shape, n=8192):
    """a shape's radius and its slope on every bearing"""
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    rho = round_rect(th, *shape)
    return th, rho, np.gradient(np.concatenate([rho[-3:], rho, rho[:3]]), th[1] - th[0])[3:-3]


def along_outline(light, mask, xs, ys, xq, yq, mid, shape):
    """The light smoothed along a product's outline and hardly across it, read back at xq, yq. The soft light on a product
    follows its edge (the wall in shade on one side, the wall catching the light on the other), and what crosses it are
    the video's blocks. Depth is binned finely at the edge and coarsely further in; xs, ys are where the frame's pixels
    lie on the masters' grid."""
    th, rho, drho = tabled(shape)
    # the distance along the outline from bearing zero, in the frame's pixels, closed so the last bearing runs on to the first
    arc = np.concatenate([[0.0], np.cumsum(np.hypot(drho, rho) * (th[1] - th[0]) / PICKER_S)])
    n_s, n_d = int(round(arc[-1])), int(12.0 * np.arcsinh(10.0)) + 8

    def place(x, y):
        d, t = edge_distance(x, y, mid, shape, th, rho, drho)
        return np.interp(t, np.append(th, 2 * np.pi), arc), 12.0 * np.arcsinh(np.maximum(d / PICKER_S, 0.0) / 6.0)

    ps, pd = place(xs[mask], ys[mask])
    bins = (np.mod(np.round(ps).astype(int), n_s), np.clip(np.round(pd).astype(int), 0, n_d - 1))
    num, den = np.zeros((n_s, n_d)), np.zeros((n_s, n_d))
    np.add.at(num, bins, light[mask])
    np.add.at(den, bins, 1.0)
    num = ndimage.gaussian_filter(num, (14.0, 3.0), mode=("wrap", "nearest"))
    den = ndimage.gaussian_filter(den, (14.0, 3.0), mode=("wrap", "nearest"))
    field = num / np.maximum(den, 1e-6)
    empty = den <= 1e-4
    if empty.any():
        field = field[tuple(ndimage.distance_transform_edt(empty, return_distances=False, return_indices=True))]
    qs, qd = place(xq, yq)
    return ndimage.map_coordinates(field, [qs, np.clip(qd, 0, n_d - 1)], order=1, mode="grid-wrap")


def dots_of(frame):
    """The five flat colours of the frame's dots, each read off its own disc: what lies inside it, clear of its edge and
    of the next disc, which lies over it, and on the last dot clear of the arrow. The median of those pixels is also the
    commonest colour among them; the video leaves a level or two round the edges and nothing else. A dot that is not flat
    is not this frame, so the script stops."""
    a = np.asarray(frame, dtype=np.float64)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    x0, y0, pitch, r = PICKER_DOTS
    dots = []
    for i in range(len(PICKER)):
        cx = x0 + i * pitch
        clear = np.hypot(xx - cx, yy - y0) < r - 4
        if i + 1 < len(PICKER):
            clear &= np.hypot(xx - cx - pitch, yy - y0) > r + 4
        else:
            clear &= ~((xx > cx + PICKER_ARROW[0]) & (yy > y0 + PICKER_ARROW[1]))
        px = a[clear]
        if (np.percentile(px, 95, axis=0) - np.percentile(px, 5, axis=0)).max() > 12:
            sys.exit(f"extract-pdf: the picker's dot {i + 1} is not one flat colour; is this the frame of the Skreed Pre-Launch design?")
        dots.append(np.median(px, axis=0))
    return np.array(dots)


def as_sage(dot, own_dot, own_body):
    """The colour of the lit body under a dot. In the frame the body is not its dot's colour: the dot is flat and the body
    is a matte thing under the frame's light, a little less chromatic and hardly less light. Sage is the one pair the PDF
    shows, so each other body stands to its dot as Sage's stands to Sage's, in OKLab: the lightness and the chroma by that
    pair's ratios, on the dot's own hue. The pair's hue moves by two degrees, and another of Sam's frames of the clip
    (the second dot, about #8ED8E6, its body about #9CD3DE) moves half a degree the other way, so that is the video and
    not the relation."""
    d, o, b = to_oklab(np.asarray(dot, dtype=np.float64)), to_oklab(own_dot), to_oklab(own_body)
    light, chroma = b[0] / o[0], np.hypot(b[1], b[2]) / np.hypot(o[1], o[2])
    return np.array([d[0] * light, d[1] * chroma, d[2] * chroma])


def picker(frame, shades, out):
    """The two products in five shades, drawn again from the one frame the PDF holds of the clip (docs/specs/redesign.md
    D19, item 6; Sam, 2026-11-09: "the image over there looks broken, doesnt look clean", of a recolour whose edges ran
    in steps). The frame is a still of a video inside a JPEG: its chroma is in blocks of 8 and 16 pixels, its luminance
    is sharp but blocked too, and it says little where the ground's shadow matches a body. No cut-out of it can be clean,
    so what is seen is drawn, and the frame says where and how bright:

    the outlines, each product and the camera island a fitted rounded rectangle (fitted_shape), so there is no step or
    kink for any shade to show; what the case's shape does not hold (the notch in its left side, the port in its foot)
    from the solved cover; the ring by its circle. An edge is the same width everywhere, antialiased at the masters' size.

    the bodies, the body's colour times the light on the body. The colour goes with the dot: the frame's five dots are
    the site's five dots, by Sam's word ("it looks different on the site, use the same ones"; the catalog's nearest shades
    were plainly not them), and each body stands to its dot as the frame's Sage does (as_sage). The light is the frame's:
    smoothed along the outline at the edges and broadly further in (along_outline), so the walls and the soft light stay and the video's blocks and
    mottle go; the logos, the lid's seam and its finger pill laid back on top; the light above the body's own level
    mostly taken out (PICKER_SHEEN), or the glare on the AirPods case's right shows as a grey patch on a dark shade.
    Sage is the frame's own body, measured off the frame, through the same drawing, so the five are one family.

    the camera island: the frame's own pixels, the green the video bled into them taken out.

    the ground: the frame's shadows over its bare ground, smooth, in neutral on Pearl Whisper, fading out before the
    canvas's edge, which cuts the case's left shadow; the buttons, the port and the inside of the notch are the dark
    things on it, the frame's own luminance kept sharp. So a partly covered edge pixel is that part of the new shade over
    that ground, and nothing of the frame's sage or of its own ground is left to fringe it.

    The picture meets the page like this. Where there are products or shadows it is opaque, painted on the section's own
    Pearl Whisper, so the reveal of one shade over another (scripts/redesign/glimpse.ts) wipes the bodies and never
    doubles a shadow. Bare ground is clear, by a long soft fall from there, and the canvas's edge is fully clear, so
    there is no box whatever a codec does to a flat colour."""
    s = PICKER_S
    x0, y0, x1, y1 = PICKER_BOX[0] - PICKER_PAD, PICKER_BOX[1] - PICKER_PAD, PICKER_BOX[2] + PICKER_PAD, PICKER_BOX[3] + PICKER_PAD
    rgb = np.asarray(frame.crop((x0, y0, x1, y1)), dtype=np.float64)
    p = lin(rgb)
    y = p @ np.array([0.2126, 0.7152, 0.0722])
    h, w = y.shape
    yy, xx = np.mgrid[0:h, 0:w]
    ring_x, ring_y, ring_in, ring_out = PICKER_RING[0] - x0, PICKER_RING[1] - y0, PICKER_RING[2], PICKER_RING[3]
    from_ring = np.hypot(xx - ring_x, yy - ring_y)

    # the body's colour and the bare ground's tint, off the frame
    lab = to_oklab(rgb)
    body_srgb = np.median(rgb[ndimage.binary_erosion(np.hypot(lab[..., 1], lab[..., 2]) > 0.04, iterations=8)], axis=0)
    body_lin = lin(body_srgb)
    tint = lin(np.median(rgb[:16].reshape(-1, 3), axis=0))
    tint = tint / (tint @ np.array([0.2126, 0.7152, 0.0722]))
    body_y = body_lin @ np.array([0.2126, 0.7152, 0.0722])
    # how much of each pixel is the body's colour, by unmixing it from the ground's tint; only roughly placed, in blocks
    amount = (p @ np.linalg.pinv(np.stack([body_lin, tint], axis=1)).T)[..., 0]
    share = ndimage.gaussian_filter(amount * body_y, 3.0) / np.maximum(ndimage.gaussian_filter(y, 3.0), 1e-4)
    # so the seeds of body and not-body come from that, and their boundary is put on the luminance's edge by a watershed
    edge = ndimage.gaussian_filter(np.cbrt(y), 0.7)
    gy, gx = np.gradient(edge)
    grad = np.hypot(gx, gy)
    dark = y < 0.10
    seeds = np.zeros((h, w), np.int16)
    seeds[ndimage.binary_erosion(share < 0.22, iterations=4) | dark] = 1
    seeds[ndimage.binary_erosion((share > 0.6) & (y > 0.15), iterations=4)] = 2
    cut = ndimage.watershed_ift(np.clip(grad / grad.max() * 65535, 0, 65535).astype(np.uint16), seeds) == 2
    ring_zone = (from_ring < ring_out + 4.0) & (xx < ring_x + ring_out - 3.0)
    other = ndimage.binary_erosion(~cut, iterations=2) | dark | ring_zone
    light = solve_light(y, ndimage.binary_erosion(cut, iterations=2) & ~other, other)
    whole, none = light / np.maximum(y, 1e-5) > 0.985, light / np.maximum(y, 1e-5) < 0.015
    calm = within(np.cbrt(y), whole, 2.0, 0.012, 5) ** 3
    carry = np.where(whole, calm, np.maximum(carried(calm, whole, 1.0), light))
    cover = np.where(whole, 1.0, np.where(none, 0.0, np.clip(light / np.maximum(np.where(whole, y, carry), 1e-5), 0, 1)))
    holes = ndimage.binary_fill_holes(cut) & ~cut
    labels, n = ndimage.label(holes)
    island = np.isin(labels, [i + 1 for i, area in enumerate(ndimage.sum(holes, labels, range(1, n + 1))) if area > 2000])
    # the frame's own pixels of the island, the green the video bled into them taken out
    kept = p - np.clip(amount, 0, None)[..., None] * (body_lin - body_y * tint)

    # ---- at the masters' size: the solved cover, the fitted shapes
    cover_big = ndimage.gaussian_filter(np.clip(enlarged(cover), 0, 1), s)
    hh, wh = cover_big.shape
    yb, xb = np.mgrid[0:hh, 0:wh].astype(np.float64)
    parts, n = ndimage.label(cover_big > 0.5)
    biggest = np.argsort(ndimage.sum(cover_big > 0.5, parts, range(1, n + 1)))[::-1][:2] + 1
    boxes = ndimage.find_objects(parts)
    fitted = {}
    print("extract-pdf: the picker's outlines")
    for name, part in zip(("case", "airpods"), sorted(biggest, key=lambda i: boxes[i - 1][1].start)):
        th, rho, centre = outline_rays(cover_big * (parts == part), boxes[part - 1], True)
        if name == "airpods":
            # the ring stands in the way on these bearings
            dx, dy = (ring_x + 0.5) * s - 0.5 - centre[0], (ring_y + 0.5) * s - 0.5 - centre[1]
            half = np.arcsin(min(0.99, (ring_out + 5.0) * s / np.hypot(dx, dy)))
            rho[np.abs((th - np.arctan2(dy, dx) + np.pi) % (2 * np.pi) - np.pi) < half] = np.nan
        fitted[name] = fitted_shape(th, rho, centre, np.cbrt(y), name)
    th, rho, centre = outline_rays(cover_big, ndimage.find_objects((enlarged(island.astype(np.float64)) > 0.5).astype(int))[0], False)
    fitted["island"] = fitted_shape(th, rho, centre, np.cbrt(y), "camera island")
    inside = {name: edge_distance(xb, yb, *fitted[name], *tabled(fitted[name][1]))[0] / s for name in fitted}
    drawn = lambda d: smooth(0.5 + d / PICKER_EDGE, 0, 1)
    case, airpods, in_island = drawn(inside["case"]), drawn(inside["airpods"]), drawn(inside["island"])

    # what the case's shape does not hold, where the solved cover is clearly away inside it and something dark is there
    # (the notch in its left side, the port in its foot; a sliver is only the cover's waver)
    away = ndimage.binary_opening((case > 0.5) & (in_island < 0.5) & (cover_big < 0.5), structure=ndimage.generate_binary_structure(2, 1), iterations=int(round(0.8 * s)))
    dark_big = np.repeat(np.repeat(ndimage.binary_dilation(dark, iterations=1), s, axis=0), s, axis=1)
    labels, n = ndimage.label(away)
    cuts = np.zeros_like(away)
    for i, b in enumerate(ndimage.find_objects(labels), 1):
        part = labels[b] == i
        if part.sum() > 40 * s * s and dark_big[b][part].any():
            cuts[b] |= part
    cut_zone = smooth(1.6 * ndimage.gaussian_filter(ndimage.binary_dilation(cuts, iterations=2 * s).astype(np.float64), s), 0, 1)
    solved = smooth(0.5 + (cover_big - 0.5) / (PICKER_EDGE * 0.33), 0, 1)
    from_ring_big = np.hypot((xb + 0.5) / s - 0.5 - ring_x, (yb + 0.5) / s - 0.5 - ring_y)
    ring = drawn(from_ring_big - ring_in) * drawn(ring_out - from_ring_big)
    a_body = np.maximum(np.minimum(case * (1 - cut_zone) + np.minimum(case, solved) * cut_zone, 1 - in_island), airpods)
    a_all = np.maximum(a_body, ring)

    # ---- on the frame's grid: how far each pixel lies inside a product, inside the island
    depth_big = np.maximum(inside["case"], inside["airpods"])
    depth, in_hole, cut_here = depth_big[1::s, 1::s], inside["island"][1::s, 1::s], cut_zone[1::s, 1::s] > 0.5

    # ---- the ground: the frame's, from two pixels clear of the products and anything dark, over its bare ground
    on_ring = (from_ring < ring_out + 1.5) & (from_ring > ring_in - 1.5) & (xx < ring_x + ring_out + 2)
    ground = (depth < -2.0) & ~on_ring & ~ndimage.binary_dilation(y < lin(140.0), iterations=2)
    strip = ground & ((yy < 18) | (xx >= w - 18))
    bare = np.linalg.lstsq(np.stack([np.ones(strip.sum()), xx[strip], yy[strip]], axis=1), y[strip], rcond=None)[0]
    bare = bare[0] + bare[1] * xx + bare[2] * yy
    darkened = unlin(y) / unlin(bare)
    ground_smooth = spread(carried(blur_in(darkened, ground, 1.6)[0], ground, 1.5))
    # something dark on the ground (a button, the inside of the notch, the port) keeps the frame's own pixels, carried in
    # from clear of the bodies so no pale pixel of the frame's own edge lies between it and a dark shade
    clear = ((ndimage.distance_transform_edt(a_all <= 0.5) / s)[1::s, 1::s] > 1.3) | (y < lin(112.0))
    objects = ndimage.binary_dilation((y < lin(112.0)) & (from_ring > ring_out + 8.0) & ((depth < 3.0) | cut_here) & (in_hole < -1.0), iterations=1)
    objects = spread(smooth(2.0 * ndimage.gaussian_filter(objects.astype(np.float64), 0.6), 0, 1))
    shadow = objects * np.clip(enlarged(carried(darkened, clear, 0.7)), 0, 1.1) + (1 - objects) * ground_smooth
    # bare ground is flat: the video's mottle and the shadows' faintest tail come to exactly one
    knee = 0.972
    above = np.clip((shadow - knee) / (1 - knee), 0, 1)
    shadow = np.where(shadow < knee, shadow, knee + (1 - knee) * above * (2 - above))
    canvas = np.minimum.reduce([xb - PICKER_PAD * s, yb - PICKER_PAD * s, (w - PICKER_PAD) * s - 1 - xb, (h - PICKER_PAD) * s - 1 - yb]) / s
    shadow = 1 - (1 - shadow) * smooth(canvas / 22.0, 0, 1)

    # ---- the light on the bodies, in logs over the body's own level
    log_light = np.log(np.maximum(y, 1e-4) / body_y)
    usable = (depth > 1.5) & (in_hole < -3.0) & ~cut_here & ~((from_ring < ring_out + 2.0) & (xx < ring_x + ring_out - 1.0) & (depth < 3.0))
    # what is drawn on a body is thin: a high pass tells it from the soft light, which is broad, and the blocks, which are shallow
    thin = ndimage.gaussian_filter(log_light, 0.5) - blur_in(log_light, usable, 3.0)[0]
    soft_light = usable & ~(ndimage.binary_dilation(np.abs(thin) > 0.06, iterations=2) & (depth > 14.0))
    xf, yf = (xx + 0.5) * s - 0.5, (yy + 0.5) * s - 0.5
    on_case = inside["case"] >= inside["airpods"]
    near = np.empty_like(cover_big)
    for name, sel in (("case", on_case), ("airpods", ~on_case)):
        near[sel] = along_outline(log_light, soft_light & (depth > 2.5) & (on_case[1::s, 1::s] == (name == "case")), xf, yf, xb[sel], yb[sel], *fitted[name])
    broad = spread(carried(blur_in(log_light, soft_light, 24.0)[0], ndimage.binary_dilation(soft_light, iterations=3), 2.0))
    further = smooth((depth_big - 14.0) / 22.0, 0, 1)
    smooth_light = (1 - further) * near + further * broad
    # the marks: the logos and, on one row, the lid's seam; what is thin and well inside, large enough to be a drawn thing
    off = ndimage.gaussian_filter(log_light, 0.5) - smooth_light[1::s, 1::s]
    strong = (np.abs(thin) > 0.07) & (depth > 14.0) & (in_hole < -6.0) & ~cut_here
    labels, n = ndimage.label(ndimage.binary_dilation(strong, iterations=1))
    big_marks = np.isin(labels, [i + 1 for i, area in enumerate(ndimage.sum(strong, labels, range(1, n + 1))) if area >= 20])
    air_inside = inside["airpods"][1::s, 1::s]
    row = int(np.argmin([np.median(off[r][air_inside[r] > 8.0]) if (air_inside[r] > 8.0).sum() > 100 else 0.0 for r in range(h)]))
    # near the seam only the thin is drawn: the seam and the finger pill, dark, and the pill's light end, the one thing there
    # far brighter than what is round it. What else lies round them is the video's, and the high pass itself rings bright
    # beside a dark line by up to 0.12. The logos are broader and pressed in, so there only what stands below the smooth
    # light is drawn; a light patch beside one is the video ringing round it
    near_seam = (np.abs(yy - row) <= 12) & (air_inside > 0.5)
    seam = np.zeros_like(big_marks)
    seam[row - 1:row + 2] = True
    marked = np.maximum(smooth(1.5 * ndimage.gaussian_filter(ndimage.binary_dilation(big_marks, iterations=2).astype(np.float64), 0.7), 0, 1), (seam & near_seam).astype(np.float64))
    marks = np.where(near_seam, np.clip(thin, -1.2, 0.0) * smooth((-thin - 0.03) / 0.05, 0, 1) + np.clip(off, 0.0, 0.15) * smooth((thin - 0.12) / 0.06, 0, 1),
                     np.clip(off, -1.2, 0.0) * smooth((-off - 0.025) / 0.05, 0, 1)) * marked
    # the light above the body's own level mostly out, softly either side of it
    softplus = lambda v: 0.02 * np.logaddexp(0.0, v / 0.02)
    even = lambda v: -softplus(-v) + PICKER_SHEEN * softplus(v)
    on_body = np.exp(even(smooth_light) + enlarged(marks) * spread(smooth((depth - 0.5) / 1.5, 0, 1)))
    # the ring has its own, from its own pixels
    ring_core = (from_ring > ring_in + 1.0) & (from_ring < ring_out - 1.0) & (depth < -0.5)
    on_ring_big = np.exp(even(spread(carried(blur_in(log_light, ring_core, 1.5)[0], ring_core, 1.5))))
    only_ring = smooth(1.0 - airpods, 0, 1) * (ring > 0)
    k = np.cbrt(np.clip(only_ring * on_ring_big + (1 - only_ring) * on_body, 0.02, 2.5))

    # ---- together: the island's pixels under the body's edge, past the hole's own edge; the ground elsewhere
    island_there = smooth((inside["island"] + 3.0) / 1.5, 0, 1)[..., None]
    island_big = np.stack([enlarged(kept[..., i]) for i in range(3)], axis=-1)
    under = island_there * island_big + (1 - island_there) * lin(np.clip(shadow, 0, 1)[..., None] * np.array(PEARL, dtype=np.float64))
    # the alpha: whole where anything is to be seen, clear on bare ground, and nothing at the canvas's edge
    seen = (a_all > 0.001) | (case > 0.001) | (ndimage.gaussian_filter(shadow, 2.0 * s) < 0.99)
    alpha = (1 - smooth(ndimage.distance_transform_edt(~seen) / s / 14.0, 0, 1)) * smooth((canvas - 2.0) / 14.0, 0, 1)
    crop = (slice(PICKER_PAD * s, (h - PICKER_PAD) * s), slice(PICKER_PAD * s, (w - PICKER_PAD) * s))
    names = []
    dots = dots_of(frame)
    own_dot = dots[[sid for sid, _ in shades].index(PICKER_OWN)]
    for (sid, name), dot in zip(shades, dots):
        # Sage is the frame's own, so it takes the frame's colour; each other body stands to its dot as Sage's does
        target = to_oklab(body_srgb) if sid == PICKER_OWN else as_sage(dot, own_dot, body_srgb)
        body = lin(from_oklab(np.stack([target[0] * k, target[1] * k, target[2] * k], axis=-1)))
        mixed = a_all[..., None] * body + (1 - a_all[..., None]) * under
        px = np.dstack([np.round(unlin(mixed[crop])), np.round(alpha[crop] * 255)]).astype(np.uint8)
        Image.fromarray(px, "RGBA").save(os.path.join(out, f"picker-{sid}.png"))
        # the record's hex is the dot's: components/redesign/Glimpse.astro holds it to the config's and the stylesheet's
        names.append({"id": sid, "name": name, "hex": "#%02x%02x%02x" % tuple(int(c) for c in dot), "file": f"picker-{sid}.png"})
        print(f"  {name}: its dot {names[-1]['hex']}, its body {'#%02x%02x%02x' % tuple(int(round(float(c))) for c in from_oklab(target))}")
    print(f"  masters {px.shape[1]} x {px.shape[0]}")
    return names


def swatches(frame, families, out):
    """The ten brush swatches of the row (docs/specs/redesign.md D19, item 4; Sam, 2026-11-09: "look at how the shades
    are looking here, it looks different on the site, use the same ones"). The PDF's frame holds six, one brush in six
    colours on a flat off-white. Each comes off that ground as a flat colour with an alpha, so nothing of the ground is
    left: the edges and the streaks are the alpha and the body is the colour.

    An alpha is read by projecting each pixel on the line from the ground to the body. A swatch close to the ground has
    few levels to read it in (the palest 29, where the grey has 89), and the frame's compression rings around every edge
    by a level or two, which on those few levels is a halo. The six being one brush (their alphas correlate at 0.997 or
    better), each is steadied by the other five in proportion to their contrast, on the swatch's own pixel grid, leaning
    on its own pixels twice as much as its contrast alone would ask.

    Each stands for the family of the catalog shade nearest its colour in OKLab; two in one family, the nearer keeps it
    and the other takes the family of its nearest shade outside those already taken. The four families left get the same
    brush, turned and mirrored, in the shade of that family nearest the span of the six's lightness and chroma."""
    a = np.asarray(frame, dtype=np.float64)
    ground = np.median(a[frame.height // 2:].reshape(-1, 3), axis=0)
    far = np.abs(a - ground).max(axis=-1) > 6
    far[frame.height // 2:] = False
    labels, n = ndimage.label(ndimage.binary_dilation(far, iterations=3))
    boxes = sorted((b for i, b in enumerate(ndimage.find_objects(labels), 1) if (labels[b] == i).sum() > 2000), key=lambda b: b[1].start)
    if len(boxes) != 6:
        sys.exit(f"extract-pdf: {len(boxes)} swatches in the frame where the design has six")

    bodies, reads, middles = [], [], []
    for ys, xs in boxes:
        sub = a[ys, xs]
        dist = np.abs(sub - ground).max(axis=-1)
        rough = np.median(sub[dist > 0.8 * np.percentile(dist, 99)], axis=0)
        core = ndimage.binary_erosion(np.abs(sub - rough).max(axis=-1) < 8, iterations=5)
        body = sub[core].mean(axis=0)
        v = ground - body
        read = ((ground - a) @ v) / (v @ v)
        near = np.zeros(read.shape)
        near[max(ys.start - 12, 0):ys.stop + 12, max(xs.start - 12, 0):xs.stop + 12] = 1
        bodies.append(body)
        reads.append(read)
        middles.append(ndimage.center_of_mass(np.clip(read, 0, 1) * near))
    weight = np.array([((ground - b) ** 2).sum() for b in bodies])

    side = 2 * SWATCH_R * SWATCH_S
    yy, xx = (np.mgrid[0:side, 0:side] - (side - 1) / 2.0) / SWATCH_S
    samples = [ndimage.map_coordinates(r, [yy + m[0], xx + m[1]], order=3, mode="nearest") for r, m in zip(reads, middles)]
    alphas = []
    for i in range(6):
        w = weight.copy()
        w[i] *= SWATCH_OWN
        al = np.clip((sum(wj * sj for wj, sj in zip(w, samples)) / w.sum() - SWATCH_LO) / (SWATCH_HI - SWATCH_LO), 0, 1)
        # what is left beyond the brush is ringing: only what touches something the alpha is sure of stays
        al[~ndimage.binary_dilation(al > 0.25, iterations=2 * SWATCH_S)] = 0
        alphas.append(al)

    # the catalog, in OKLab
    shades = [(f["id"], s) for f in families for s in f["shades"]]
    rgb = np.array([[int(s["hex"][i:i + 2], 16) for i in (1, 3, 5)] for _, s in shades], dtype=np.float64)
    lab = to_oklab(rgb)
    body_lab = to_oklab(np.array(bodies))
    # the nearer first; each takes its nearest shade among the families still free
    gap = np.linalg.norm(lab[None] - body_lab[:, None], axis=-1)
    taken, standing = set(), {}
    for i in np.argsort(gap.min(axis=1)):
        for j in np.argsort(gap[i]):
            if shades[j][0] not in taken:
                taken.add(shades[j][0])
                standing[int(i)] = j
                break
    made = []

    def save(order, family, shade, al, colour, source):
        fill = np.round(colour).astype(np.uint8)
        px = np.empty(al.shape + (4,), np.uint8)
        px[..., :3] = fill
        px[..., 3] = np.round(al * 255).astype(np.uint8)
        name = f"swatch-{family}"
        Image.fromarray(px, "RGBA").save(os.path.join(out, f"{name}.png"))
        made.append({"picture": name, "file": f"{name}.png", "order": order, "family": family, "shade": shade["id"], "name": shade["name"],
                     "hex": "#%02x%02x%02x" % tuple(int(c) for c in fill), "source": source, "width": side, "height": side})

    for i in range(6):
        family, shade = shades[standing[i]]
        save(i + 1, family, shade, alphas[i], bodies[i], "pdf")
    # the register of the six: the span of their lightness and chroma. A shade inside it is at home, whichever it is
    # (the mean would call the palest yellow too light and a vivid one close), so what counts is how far a shade lies
    # outside it, and each family left takes its nearest
    chroma = np.hypot(lab[:, 1], lab[:, 2])
    body_c = np.hypot(body_lab[:, 1], body_lab[:, 2])
    span = (body_lab[:, 0].min(), body_lab[:, 0].max(), body_c.max())
    outside = lambda j: np.hypot(max(span[0] - lab[j, 0], lab[j, 0] - span[1], 0.0), max(chroma[j] - span[2], 0.0))
    left = [f["id"] for f in families if f["id"] not in taken]
    for k, (family, (source, turn, mirror)) in enumerate(zip(left, SWATCH_TURNS)):
        j = min((j for j, (fid, _) in enumerate(shades) if fid == family), key=outside)
        al = alphas[source][:, ::-1] if mirror else alphas[source]
        al = np.clip(ndimage.rotate(al, turn, reshape=False, order=3, mode="constant", cval=0.0), 0, 1)
        save(7 + k, family, shades[j][1], al, rgb[j], "tinted")
    return made


def blobs(page, out):
    """The three brush blobs over "You're used to choosing from what's available." (docs/specs/redesign.md D19; Sam,
    2026-11-09: "it looks different on the site, use the same ones"). In the PDF they are no pictures: each is 412 filled
    paths, one brush in three flat colours, and the words are live text over them, set in a paid face, so nothing of the
    words is baked in and the page lays its own on top. Each brush is drawn again from its own paths, alone on a clear
    sheet, large, and taken down to the master's size, so its alpha is the coverage of the PDF's own edge, its colour is
    the PDF's flat fill in every pixel, and two of its paths leave no seam where they meet. No ground, so no box and no
    halo."""
    w, h = BLOB_SIZE[0] / BLOB_Z, BLOB_SIZE[1] / BLOB_Z
    drawings = page.get_drawings()
    made = {}
    for name, (hexv, left) in BLOBS.items():
        fill = [int(hexv[i:i + 2], 16) for i in (1, 3, 5)]
        near = pymupdf.Rect(left - 1, BLOB_TOP - 1, left + 101, BLOB_TOP + 105)
        paths = [d for d in drawings if d["type"] == "f" and d.get("fill") and near.contains(d["rect"]) and max(abs(c * 255 - f) for c, f in zip(d["fill"], fill)) < 1.5]
        if len(paths) < 100:
            sys.exit(f"extract-pdf: {len(paths)} paths of {name} at x {left}, y {BLOB_TOP} on page 1; is this the Skreed Pre-Launch design?")
        box = pymupdf.Rect(paths[0]["rect"])
        for d in paths[1:]:
            box |= d["rect"]
        x0, y0 = 0.5 * (box.x0 + box.x1 - w), 0.5 * (box.y0 + box.y1 - h)
        sheet = pymupdf.open().new_page(width=w, height=h)
        shape = sheet.new_shape()
        at = lambda p: pymupdf.Point(p.x - x0, p.y - y0)
        for d in paths:
            for item in d["items"]:
                if item[0] == "l":
                    shape.draw_line(at(item[1]), at(item[2]))
                elif item[0] == "c":
                    shape.draw_bezier(at(item[1]), at(item[2]), at(item[3]), at(item[4]))
                else:
                    sys.exit(f"extract-pdf: a {item[0]} in the paths of {name}, where the design has lines and curves")
            shape.finish(fill=(0, 0, 0), color=None, even_odd=d["even_odd"], closePath=d["closePath"])
        shape.commit()
        big = sheet.get_pixmap(matrix=pymupdf.Matrix(BLOB_Z * BLOB_SS, BLOB_Z * BLOB_SS), alpha=True, annots=False)
        cover = np.frombuffer(big.samples, np.uint8).reshape(big.height, big.width, 4)[..., 3].astype(np.float64) / 255.0
        wide, tall = BLOB_SIZE
        cover = cover[:tall * BLOB_SS, :wide * BLOB_SS].reshape(tall, BLOB_SS, wide, BLOB_SS).mean(axis=(1, 3))
        px = np.empty((tall, wide, 4), np.uint8)
        px[..., :3] = fill
        px[..., 3] = np.round(cover * 255).astype(np.uint8)
        Image.fromarray(px, "RGBA").save(os.path.join(out, f"{name}.png"))
        made[name] = {"file": f"{name}.png", "width": wide, "height": tall, "alpha": True, "hex": hexv}
        print(f"  {name}: {len(paths)} paths, the brush {box.width:.2f} x {box.height:.2f} points at x {box.x0:.2f}, y {box.y0:.2f}; its canvas from x {x0:.2f}, y {y0:.2f}")
    return made


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: python3 -I scripts/redesign/extract-pdf.py "<path to Skreed Pre-Launch.pdf>" [out=assets-src/redesign]')
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "assets-src", "redesign")
    os.makedirs(out, exist_ok=True)
    doc = pymupdf.open(sys.argv[1])
    page = doc[0]
    index, frames = {}, {}

    for name, (size, origin, frame, ground) in WHOLE.items():
        xref, smask, r = find(page, doc, size, origin)
        im = pixels(doc, xref, smask)
        sx, sy = im.width / r.width, im.height / r.height
        if frame:
            # the frame's box in the picture's pixels; where the picture is smaller than the frame, the ground fills it
            fx0, fy0, fx1, fy1 = [(frame[0] - r.x0) * sx, (frame[1] - r.y0) * sy, (frame[2] - r.x0) * sx, (frame[3] - r.y0) * sy]
            w, h = round(fx1 - fx0), round(fy1 - fy0)
            canvas = Image.new("RGB", (w, h), ground or (255, 255, 255))
            src = im.convert("RGBA")
            canvas.paste(src, (round(-fx0), round(-fy0)), src)
            im = canvas
        elif im.mode == "RGBA":
            canvas = Image.new("RGB", im.size, ground or (255, 255, 255))
            canvas.paste(im, (0, 0), im)
            im = canvas
        if name.endswith("-frame"):
            frames[name] = im
            continue
        im.save(os.path.join(out, f"{name}.png"))
        index[name] = {"file": f"{name}.png", "width": im.width, "height": im.height}

    for fan, lefts in CASES.items():
        for i, x0 in enumerate(lefts, 1):
            # the blue fan's second and third slots hold two renders each; the last drawn is the one on show
            xref, smask, r = find(page, doc, CASE_SIZE, (x0, CASE_Y))
            im = pixels(doc, xref, smask).crop(CASE_FRONT)
            name = f"case-{fan}-{i}"
            im.save(os.path.join(out, f"{name}.png"))
            index[name] = {"file": f"{name}.png", "width": im.width, "height": im.height, "alpha": True}

    shades = json.load(open(os.path.join(ROOT, "docs", "data", "shades-240.json"), encoding="utf-8"))
    by_id = {s["id"]: (s["id"], s["name"]) for f in shades["families"] for s in f["shades"]}
    for p in picker(frames["picker-frame"], [by_id[i] for i in PICKER], out):
        im = Image.open(os.path.join(out, p["file"]))
        index[f"picker-{p['id']}"] = {"file": p["file"], "width": im.width, "height": im.height, "alpha": True,
                                     "shade": p["id"], "name": p["name"], "hex": p["hex"]}

    for sw in swatches(frames["swatch-frame"], shades["families"], out):
        name = sw.pop("picture")
        index[name] = dict(sw, alpha=True)

    print("extract-pdf: the three blobs")
    index.update(blobs(page, out))

    with open(os.path.join(out, "masters.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(index, f, indent=1)
        f.write("\n")
    # a master this script no longer makes goes, so the encoder and the build stop carrying it
    made = {m["file"] for m in index.values()}
    for f in os.listdir(out):
        if f.endswith(".png") and f not in made:
            os.remove(os.path.join(out, f))
    print(f"extract-pdf: {len(index)} masters in {os.path.relpath(out, ROOT)}")


if __name__ == "__main__":
    main()
