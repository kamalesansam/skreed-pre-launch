#!/usr/bin/env python3
"""AC5's flash check on the five scene loops and the steps (docs/specs/section-4-flux.md 7, AC5; WCAG 2.3.1), the method
of the lands' clip-flash.py.

AC5, as the spec has it: over every loop as drawn, every step, five steps back to back at Tune's shortest stepMs, both
seams, the way back and the wrap, at 390 x 844 and 1280 x 800, "no 341 x 256 CSS px region has more than 25 percent of
its area flash more than three times in any one second, a flash being a pair of opposing changes of at least 10 percent
of the maximum relative luminance where the darker state is below 0.80, the same for saturated red".

Two kinds of input:
- a loop: `<id>-<class>.mp4` from src/assets/room/flux, decoded by ffmpeg at its 24 frames a second and composed as the
  carousel draws it at rest (cover-fitted to the viewport of its class at the planes' 1.01 overscan, the light-up whole,
  the bottom shade in the frame: --shade dark,solid,height as carousel.ts SHADE has them), its first second appended
  after its last frame so the wrap of the loop is checked too;
- a step: a folder of PNG frames captured by scripts/room/step-frames.mjs (the hooks build drawn one 1/24 s tick at a
  time, so the sequence is the step at 24 frames a second whatever the capture's own pace), read as they are.
On each sequence:
- a pixel makes a transition where its relative luminance has moved at least 0.1 from its running extreme and the
  darker of the two is below 0.80 (a flash is a pair of opposing transitions); the saturated red test is the same on
  (R - G - B) x 320 where R / (R + G + B) is 0.8 or more, with changes over 20;
- a 341 x 256 CSS px region (WCAG's 10 degrees at 1024 x 768; every 16 px) flashes where 25 percent or more of its area
  makes a transition the same way within the same frame or the one either side: an area flashing together, which
  water, fog or a slow camera, whose pixels rise and fall at scattered times, is not;
- the sequence fails where any region has more than six such turns (more than three flashes) in any one second.
It prints one Markdown row per sequence: the most transitions any single pixel has in one second (for reference: moving
water gives many), the largest share of a region turning the same way at once, the most turns of a region in one
second, the same two for red, and the verdict; --json writes the rows with their verdicts for src/data/room-flux.json.

usage: python3 -I scripts/room/loop-flash.py [--loops <dir>] [--steps <dir>] [--shade 0.85,0,0.24] [--json <file>] [W x H ...]
  the loops are <id>-<wide|portrait>.mp4; the steps are folders named step-<W>-<from>-<to> of frame-NNN.png
"""
import io, json, re, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

FPS = 24
REGION = (341, 256)
OVERSCAN = 1.01


def frames(path):
    w, h = map(int, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout.strip().split(','))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def cover(img, vw, vh, zoom=OVERSCAN):
    """img (h, w, 3) uint8 cover-fit on vw x vh, magnified by zoom about the centre (the plane's fit at rest)"""
    h, w = img.shape[:2]
    s = max(vw / w, vh / h) * zoom
    cw, ch = vw / s, vh / s
    x0, y0 = (w - cw) / 2, (h - ch) / 2
    return np.asarray(Image.fromarray(img).resize((vw, vh), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch)))


def shade_column(vh, dark, solid, height):
    """the bottom shade's factor per row (top row first), as the plane's shader draws it: solid up to `solid` of the height, clear by `height`"""
    y = (vh - 0.5 - np.arange(vh)) / vh   # each row's height from the bottom edge, 0 to 1
    t = np.clip((y - solid) / max(height - solid, 1e-3), 0, 1)
    return (1 - dark * (1 - t)).astype(np.float32)


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
        lo = np.minimum(lo, v); hi = np.maximum(hi, v)
        first = (d == 0) & (hi - lo >= step) & (np.minimum(hi, lo) < floor if floor is not None else True)
        up_first = first & (v >= hi)
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
    def shares(mask):
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
    sig = np.where(up >= 0.25, 1, 0) - np.where(down >= 0.25, 1, 0)
    last = np.zeros(sig.shape[1:], np.int8); turns = np.zeros(sig.shape, np.int8)
    for t in range(T):
        new = (sig[t] != 0) & (sig[t] != last)
        turns[t] = new; last = np.where(sig[t] != 0, sig[t], last)
    ct = np.concatenate([np.zeros((1,) + turns.shape[1:], np.int32), np.cumsum(turns, 0, dtype=np.int32)])
    region = max(int((ct[min(T, t0 + FPS)] - ct[t0]).max()) for t0 in range(0, max(1, T - FPS + 1)))
    return most, share, region


def analyse(rgb, vw, vh):
    L = lin(rgb)
    lum = 0.2126 * L[..., 0] + 0.7152 * L[..., 1] + 0.0722 * L[..., 2]
    tg = transitions(lum, 0.1, 0.8)
    srgb = rgb.astype(np.float32) / 255
    tot = srgb.sum(-1) + 1e-6
    red = np.where(srgb[..., 0] / tot >= 0.8, np.maximum(0, srgb[..., 0] - srgb[..., 1] - srgb[..., 2]) * 320, 0).astype(np.float32)
    tr = transitions(red, 20.0, None)
    g, r = worst(tg, vw, vh), worst(tr, vw, vh)
    ok = g[2] <= 6 and r[2] <= 6
    return {'frames': int(rgb.shape[0]), 'pixel_most': g[0], 'region_share': round(g[1], 4), 'region_turns': g[2], 'red_share': round(r[1], 4), 'red_turns': r[2], 'verdict': 'pass' if ok else 'FAIL'}


def row(name, vw, vh, a):
    return f"| {name} | {vw} x {vh} | {a['frames']} | {a['pixel_most']} | {a['region_share'] * 100:.1f} | {a['region_turns']} | {a['red_share'] * 100:.1f} | {a['red_turns']} | {a['verdict']} |"


def check_loop(path, vw, vh, shade):
    src = frames(path)
    seq = [cover(f, vw, vh) for f in src]
    seq += seq[:FPS]   # the loop wraps to its first frame: its first second again after the last
    rgb = np.stack(seq)
    sh = shade_column(vh, *shade)[None, :, None, None]
    rgb = np.clip(rgb.astype(np.float32) * sh, 0, 255).astype(np.uint8)
    return analyse(rgb, vw, vh)


def check_step(folder):
    files = sorted(folder.glob('frame-*.png'))
    if not files: return None, 0, 0
    imgs = [np.asarray(Image.open(f).convert('RGB')) for f in files]
    h, w = imgs[0].shape[:2]
    return analyse(np.stack(imgs), w, h), w, h


def main():
    argv = sys.argv[1:]
    def opt(k, default=None):
        return argv[argv.index(k) + 1] if k in argv else default
    loops = opt('--loops'); steps = opt('--steps'); out = opt('--json')
    shade = tuple(map(float, opt('--shade', '0.85,0,0.24').split(',')))
    views = [tuple(map(int, v.lower().split('x'))) for v in argv if re.fullmatch(r'\d+x\d+', v.lower())] or [(390, 844), (1280, 800)]
    print(f'a region turns where 25 percent of it moves the same way at once; it fails with more than 6 turns in a second; the shade {shade[0]} of black, solid to {shade[1]}, clear by {shade[2]} of the height')
    print('| sequence | viewport (CSS px) | frames | most transitions of one pixel in 1 s | largest share of a region turning together, % | most turns of a region in 1 s | red: largest share, % | red: most turns | verdict |')
    print('|---|---|---:|---:|---:|---:|---:|---:|---|')
    results = []
    good = True
    if loops:
        for clip in sorted(Path(loops).glob('*.mp4')):
            m = re.match(r'([a-z]+)-(wide|portrait)\.mp4$', clip.name)
            if not m: continue
            sid, cls = m.groups()
            for vw, vh in views:
                if (vw < vh) != (cls == 'portrait'): continue   # the portrait class plays where the frame is taller than wide
                a = check_loop(clip, vw, vh, shade)
                print(row(clip.name, vw, vh, a), flush=True); good &= a['verdict'] == 'pass'
                results.append({'kind': 'loop', 'id': sid, 'class': cls, 'viewport': f'{vw}x{vh}', **a})
    if steps:
        for folder in sorted(Path(steps).glob('step-*')):
            m = re.match(r'step-(\d+)-(\d+)-(\d+)$', folder.name)
            if not m or not folder.is_dir(): continue
            a, w, h = check_step(folder)
            if a is None: continue
            print(row(folder.name, w, h, a), flush=True); good &= a['verdict'] == 'pass'
            results.append({'kind': 'step', 'from': int(m.group(2)), 'to': int(m.group(3)), 'viewport': f'{w}x{h}', **a})
    if out:
        Path(out).write_text(json.dumps({'shade': shade, 'results': results}, indent=1) + '\n')
    sys.exit(0 if good else 1)


main()
