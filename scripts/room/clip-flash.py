#!/usr/bin/env python3
"""AC5's flash check on option C's clips (docs/specs/section-4-world.md 7, AC5; WCAG 2.3.1), as the travel shows them.

Each clip is composed at a viewport's CSS size as travel-video.ts draws it: the departing land at rest (its picture at
the rest push's zoom), then every frame of the clip cover-fit at that zoom, then the 0.2 s hand-over to the arriving
land's picture, then the arriving land held for 1 s. On that sequence, at the clip's 24 frames a second:
- a pixel makes a transition where its relative luminance has moved at least 0.1 from its running extreme and the darker
  of the two is below 0.80 (a flash is a pair of opposing transitions); the saturated red test is the same on
  (R - G - B) x 320 where R / (R + G + B) is 0.8 or more, with changes over 20;
- a 341 x 256 CSS px region (WCAG's 10 degrees at 1024 x 768; every 16 px) flashes where 25 percent or more of its area
  makes a transition the same way within the same frame or the one either side: an area flashing together, which a
  camera moving over leaves and stone, whose pixels rise and fall at scattered times, is not;
- the clip fails where any region has more than six such turns (more than three flashes) in any one second.
It prints one Markdown row per clip and viewport: the most transitions any single pixel has in one second (for
reference: a moving texture gives many), the largest share of a region turning the same way at once, the most turns
of a region in one second, the same two for red, and the verdict.

usage: python3 -I scripts/room/clip-flash.py <clips dir> <land pictures dir> [W x H ...]
  the clips are clip-<from>-<to>-<class>.mp4; the pictures land-<id>-<class>.png (the masters in assets-src/room/lands/out)
"""
import io, re, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

FPS = 24
HAND_OVER = 0.2          # s: the clip's last frame to the arriving land (travel-video.ts HAND_OVER)
SUBJECT_D = 0.85         # the subject's disparity in the depth maps (travel-video.ts SUBJECT_D)
NEAR, FAR, PUSH = 1.6, 30.0, 0.15   # config/room.ts LAND_COPY's near and far; world.ts ENTRY.pushRest
REGION = (341, 256)


def rest_zoom(near=NEAR, far=FAR):
    z = 1 / ((1 - SUBJECT_D) / far + SUBJECT_D / near)
    return z / (z - PUSH * near)


def frames(path):
    w, h = map(int, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout.strip().split(','))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def cover(img, vw, vh, zoom):
    """img (h, w, 3) uint8 cover-fit on vw x vh, magnified by zoom about the centre"""
    h, w = img.shape[:2]
    s = max(vw / w, vh / h) * zoom
    cw, ch = vw / s, vh / s
    x0, y0 = (w - cw) / 2, (h - ch) / 2
    return np.asarray(Image.fromarray(img).resize((vw, vh), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch)))


def lin(u8):
    c = u8.astype(np.float32) / 255
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def transitions(series, step, floor):
    """series (T, H, W): an int8 (T, H, W), +1 where a pixel makes a rising transition at that frame, -1 a falling one"""
    T = series.shape[0]
    out = np.zeros(series.shape, np.int8)
    anchor = series[0].copy(); lo = series[0].copy(); hi = series[0].copy(); d = np.zeros(series.shape[1:], np.int8)
    for t in range(1, T):
        v = series[t]
        # no direction yet: a first transition once the range seen reaches the step
        lo = np.minimum(lo, v); hi = np.maximum(hi, v)
        first = (d == 0) & (hi - lo >= step) & (np.minimum(hi, lo) < floor if floor is not None else True)
        up_first = first & (v >= hi)
        # a direction: extend the extreme, or turn by the step
        same = ((d > 0) & (v > anchor)) | ((d < 0) & (v < anchor))
        anchor = np.where(same, v, anchor)
        dv = np.abs(v - anchor)
        darker = np.minimum(v, anchor)
        turn = (d != 0) & ~same & (dv >= step) & ((darker < floor) if floor is not None else True)
        d = np.where(first, np.where(up_first, 1, -1), np.where(turn, -d, d)).astype(np.int8)
        out[t] = np.where(first | turn, d, 0)
        anchor = np.where(first | turn, v, anchor)
    return out


def worst(tr, vw, vh, stride=16):
    """the most transitions any pixel has in one second; the largest share of a region turning the same way at once; the
    most turns of a region (alternating directions, each 25 percent of it or more at once) in any one second"""
    T = tr.shape[0]
    c = np.concatenate([np.zeros((1,) + tr.shape[1:], np.int32), np.cumsum(tr != 0, 0, dtype=np.int32)])
    most = max(int((c[min(T, t0 + FPS)] - c[t0]).max()) for t0 in range(0, max(1, T - FPS + 1)))
    rw, rh = min(REGION[0], vw), min(REGION[1], vh)
    def shares(mask):   # per frame, every region's share of pixels in mask (a frame either side counted)
        m = mask.copy(); m[1:] |= mask[:-1]; m[:-1] |= mask[1:]
        out = []
        for t in range(T):
            ii = np.pad(m[t].astype(np.int32).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
            out.append((ii[rh::stride, rw::stride][: (vh - rh) // stride + 1, : (vw - rw) // stride + 1]
                        - ii[:-rh:stride, rw::stride][: (vh - rh) // stride + 1, : (vw - rw) // stride + 1]
                        - ii[rh::stride, :-rw:stride][: (vh - rh) // stride + 1, : (vw - rw) // stride + 1]
                        + ii[:-rh:stride, :-rw:stride][: (vh - rh) // stride + 1, : (vw - rw) // stride + 1]) / (rw * rh))
        return np.stack(out)
    up, down = shares(tr > 0), shares(tr < 0)
    share = float(max(up.max(), down.max()))
    sig = np.where(up >= 0.25, 1, 0) - np.where(down >= 0.25, 1, 0)   # a region's turn this frame, +1, -1 or 0 (both: 0)
    # alternations only: a turn the same way as the region's last one is the same change going on
    last = np.zeros(sig.shape[1:], np.int8); turns = np.zeros(sig.shape, np.int8)
    for t in range(T):
        new = (sig[t] != 0) & (sig[t] != last)
        turns[t] = new; last = np.where(sig[t] != 0, sig[t], last)
    ct = np.concatenate([np.zeros((1,) + turns.shape[1:], np.int32), np.cumsum(turns, 0, dtype=np.int32)])
    region = max(int((ct[min(T, t0 + FPS)] - ct[t0]).max()) for t0 in range(0, max(1, T - FPS + 1)))
    return most, share, region


def check(clip, pics, vw, vh):
    m = re.match(r'clip-([a-z]+)-([a-z]+)-(portrait|wide)\.mp4$', clip.name)
    a, b, cls = m.groups()
    k = rest_zoom()
    src = frames(clip)
    pa = np.asarray(Image.open(pics / f'land-{a}-{cls}.png').convert('RGB'))
    pb = np.asarray(Image.open(pics / f'land-{b}-{cls}.png').convert('RGB'))
    A, B = cover(pa, vw, vh, k).astype(np.float32), cover(pb, vw, vh, k).astype(np.float32)
    seq = [A] + [cover(f, vw, vh, k).astype(np.float32) for f in src]
    last, n = seq[-1], max(1, round(HAND_OVER * FPS))
    seq += [last + (B - last) * ((i + 1) / n) for i in range(n)] + [B] * FPS
    rgb = np.stack([np.clip(s, 0, 255).astype(np.uint8) for s in seq])
    L = lin(rgb)
    lum = 0.2126 * L[..., 0] + 0.7152 * L[..., 1] + 0.0722 * L[..., 2]
    tg = transitions(lum, 0.1, 0.8)
    srgb = rgb.astype(np.float32) / 255
    tot = srgb.sum(-1) + 1e-6
    red = np.where(srgb[..., 0] / tot >= 0.8, np.maximum(0, srgb[..., 0] - srgb[..., 1] - srgb[..., 2]) * 320, 0).astype(np.float32)
    tr = transitions(red, 20.0, None)
    g, r = worst(tg, vw, vh), worst(tr, vw, vh)
    ok = g[2] <= 6 and r[2] <= 6
    return f'| {clip.name} | {vw} x {vh} | {len(seq)} | {g[0]} | {g[1] * 100:.1f} | {g[2]} | {r[1] * 100:.1f} | {r[2]} | {"pass" if ok else "FAIL"} |', ok


def main():
    clips, pics = Path(sys.argv[1]), Path(sys.argv[2])
    views = [tuple(map(int, v.lower().split('x'))) for v in sys.argv[3:]] or [(390, 844), (1280, 800)]
    print(f'zoom at rest {rest_zoom():.4f}; a region turns where 25 percent of it moves the same way at once; it fails with more than 6 turns in a second')
    print('| clip | viewport (CSS px) | frames | most transitions of one pixel in 1 s | largest share of a region turning together, % | most turns of a region in 1 s | red: largest share, % | red: most turns | verdict |')
    print('|---|---|---:|---:|---:|---:|---:|---:|---|')
    good = True
    for clip in sorted(clips.glob('clip-*.mp4')):
        cls = 'portrait' if 'portrait' in clip.name else 'wide'
        for vw, vh in views:
            if (vw < vh) != (cls == 'portrait'): continue   # the portrait class plays where the frame is taller than wide
            row, ok = check(clip, pics, vw, vh)
            print(row, flush=True); good &= ok
    sys.exit(0 if good else 1)


main()
