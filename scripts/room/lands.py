# Section 4, part two: the four lands' pictures (docs/specs/section-4-world.md 3, "The lands" and "How each master is
# made"; "Option A's depth maps"; section 6, "The credit plan"). The pipeline driver, one stage at a time, so every
# generator call can be looked at before the next is paid for:
#   python3 -I scripts/room/lands.py <stage> --root <dir> [--land case|wallet|lenskin|airpods] [--attempt n] [--cap 100]
# <dir> holds src/ (copies of Sam's listing photos, never the originals: they are untrusted files, read only as pixels),
# work/ (every intermediate, the ledger) and out/ (the masters). Stages, in order:
#   render     the accessory in Blender (scripts/room/render-products.py), posed by the land's measured pose below
#   composite  the accessory onto the base, alpha over with its Cycles contact shadow, behind the fingers that cover it
#   hand       land 4 only: her free hand around the composited AirPods case, by a masked inpaint that never covers the
#              case (--reuse re-blends an attempt already paid for)
#   matte      Higgsfield's image_background_remover on the composite: the person, her hands, the phone and its case
#   bg         the masked background inpaint (nano_banana_2_1 at 2k): the generator fills only what the matte leaves,
#              and the product's pixels are put back exactly afterwards, so the case is never redrawn (W11); blend
#              re-blends an attempt already paid for
#   pick       copies the chosen attempt to out/land-<id>-square.png
#   crops      the 1406 x 2500 portrait from the square; the wide: the square on a 16:9 canvas, the pads alone taken
#              from Higgsfield's outpaint (--pad-model outpaint, the default) or a nano_banana_2_1 masked inpaint
#              (--pad-model nano), registered back onto the canvas, then cropped to 16:10 (4000 x 2500); widen
#              re-makes one from a call already paid for, pickwide copies the chosen one to out/
#   depth      option A's depth maps: depth_anything_video VDA-Small (Apache-2.0), --max_frames 1, greyscale, on a
#              one-frame clip of each crop at its encoded size
#   check      the case diffed against the base in every master, each accessory's colour read back against its hex
#   sheet      the contact sheet; sums  the masters' SHA256SUMS into assets-src/room/lands/; ledger  the call table
# Every Higgsfield call is costed first ('higgsfield generate cost') and refused when the ledger plus its cost would pass
# --cap; each one lands in work/ledger.jsonl with its job id, model, credits, prompt, seed and inputs (a failed job at 0
# credits). What each step measured and every call made for the first candidates: docs/specs/evidence/
# section-4-world-lands.md. Nothing here encodes into src/assets: Sam approves the pictures first (CHECKLIST F2).
import argparse, glob, hashlib, json, math, os, shutil, subprocess, sys, time, urllib.request
import numpy as np, cv2
from PIL import Image, ImageDraw

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender'
RENDER = os.path.join(REPO, 'scripts/room/render-products.py')
SHADES = os.path.join(REPO, 'docs/data/shades-240.json')
MODELS = os.path.join(REPO, 'scripts/room/models')
SIDE = 2500                       # the listing photos are 2500 x 2500
PORTRAIT_W = 1406                 # 9:16 of the square's height
WIDE16x9, WIDE16x10 = 4444, 4000  # at the square's height
UP = 2048                         # what the generator is sent and returns at 2k for a square
PAD_SIZE = (2752, 1548)           # the 16:9 canvas as sent for the pad fill (the 2k long side, 16:9)
# the photos carry no EXIF; 3500 px is a 50 mm lens on a full frame across 2500 px, about what a listing portrait is
# shot with. Every pose below is solved under it, so a wrong guess shifts all of them alike (the planes are near frontal)
F_PX = 3500.0

# The lands in catalog order (W7). case_poly: the phone in its case, measured on the base on a 20 px grid and cut to the
# remover's alpha (case_region; the region the check diffs and the bg stage holds exact). portrait_x: the portrait's left
# edge. wide_left: the square's left edge in the 16:9 canvas for --pad-model nano (the pad mostly left, where the land's
# text sits), wide_crop: the 16:10's left edge in it; the outpaint model centres the square instead (outpaint_land).
LANDS = {
    'case': {
        'n': 1, 'base': 'yellow.png', 'family': 'Mellow Yellow',
        'case_poly': [(1460, 800), (1810, 800), (1805, 1585), (1470, 1590)],
        'portrait_x': 657, 'wide_left': 1300, 'wide_crop': 222, 'seed': 41101,
        'bg': ("Replace only the background with the Mall in Central Park, New York: the wide paved promenade beneath "
               "tall arching American elms, park benches and old lamp posts receding along the walk, direct warm "
               "late-afternoon sun from the right raking through the leaves, long soft shadows on the paving, the "
               "background softly out of focus as with a portrait lens at f/2. She leans against the trunk of a large "
               "elm. Photorealistic, natural colour. Keep the woman, her face, hair, hands, scarf, the phone, the yellow "
               "case and the flowers exactly as they are."),
        'pad': ("Extend the photograph to the left and right: the Mall in Central Park, the promenade and the tall elms "
                "continuing, soft and out of focus, warm late-afternoon sun from the right. Continue her hair, sleeve "
                "and the flowers naturally where they meet the edge. The lower left is darker and quieter: the elms' "
                "shade on the paving, with nothing in it."),
    },
    'wallet': {
        'n': 2, 'base': 'blue.png', 'family': 'Blissful Blue',
        'case_poly': [(1055, 555), (1525, 555), (1490, 1540), (1070, 1540)],
        'portrait_x': 587, 'wide_left': 1300, 'wide_crop': 222, 'seed': 41201, 'key_px': 60, 'key_sat': (40, 80, 180), 'paint_pockets': True,
        'accessory': {'which': 'wallet', 'model': 'wallet.a15a8ebb.glb', 'shade': 'basic-brown-04', 'finish': 'matte'},
        # the case's back, its edges' lines meeting at the rounded corners (TL, TR, BR, BL), and its size in the photo's
        # own proportion: 82 mm across (a 17 Pro Max, 78 mm, in a Tough case), 178 mm tall (the photographed phone is
        # drawn longer than the real 167 mm); the camera window's lower edge at y 850
        'corners': [(1043, 542), (1536, 542), (1497, 1552), (1062, 1552)], 'case_mm': (82.0, 178.0), 'window_y': 850,
        'white': (240, 237, 230),   # the wall, top left: the window light's white in this photo
        # the window at her right (the picture's left), a little above: the lit hand reads 242 against the far one's 203
        'lights': [{'dir': (-0.7, -0.45, -0.55), 'dist': 0.9, 'size': 0.6, 'watts': 40}, {'dir': (0.6, -0.1, -0.8), 'dist': 2.0, 'size': 2.0, 'watts': 14}],
        'world': 0.25, 'grade': 0.9,
        'bg': ("Replace only the background with the arcade under Bethesda Terrace in Central Park, New York: its warm "
               "sandstone arches and the patterned tile ceiling behind her, in soft open shade, the background softly "
               "out of focus as with a portrait lens at f/2. Photorealistic, natural colour. Keep the woman, her hair, "
               "her hands, her sweater, the phone, the blue case and the brown wallet on it exactly as they are."),
        'pad': ("Extend the photograph to the left and right: the Bethesda Terrace arcade in Central Park, its arches "
                "and tiles continuing, soft and out of focus, in open shade. Continue her long hair, shoulders and blue "
                "knit sweater naturally where they meet the edge. The lower left is darker and quieter, in shadow."),
    },
    'lenskin': {
        'n': 3, 'base': 'green.png', 'family': 'Go Green',
        'case_poly': [(410, 640), (1430, 582), (1455, 1020), (420, 1125)],   # 30 px inside the top edge, where the old wall's lime fringes it
        'portrait_x': 250, 'wide_left': 1300, 'wide_crop': 222, 'seed': 41301, 'key_px': 30,
        'accessory': {'which': 'lenskin', 'model': 'lenskin.3831acd1.glb', 'shade': 'roaring-red-07', 'finish': 'metallic'},
        # the six holes of the Lenskin (seen from outside, the phone upright: px across, pz up, mm) against the photo's
        # lenses, flash, microphone and LiDAR (the phone is held landscape, its top to the right). The photographed
        # lenses stand about 11 percent wider apart than the real 17 Pro Max layout the Lenskin is cut for, so the plate
        # is registered on the lenses (a homography, residual under 4 px) and clipped by the plateau, inside the case's rim
        'holes_mm': [(-22.2, 28.3), (-22.2, 11.0), (-6.0, 19.6), (23.5, 28.9), (22.8, 19.6), (23.5, 11.0)],
        'holes_px': [(1360, 655), (1232, 677), (1302, 785), (1365, 947), (1307, 955), (1247, 967)],
        'plateau': [(1170, 612), (1428, 595), (1432, 1012), (1182, 1030)], 'plateau_r': 34, 'plateau_inset': 7,
        'white': (236, 236, 233),   # his white T-shirt, lit by the same light
        # in the plate's upright frame (the photo turned a quarter back): the photo's light from its upper left is the
        # plate's lower right. A small source close to the mirror direction is the sheen: a flat satin plate seen
        # face-on reflects one direction only, so without it the metal reads as a flat fill
        'lights': [{'dir': (0.45, 0.35, -0.8), 'dist': 1.0, 'size': 1.2, 'watts': 50}, {'dir': (-0.5, -0.2, -0.85), 'dist': 1.6, 'size': 1.6, 'watts': 18},
                   {'dir': (0.3, 0.25, -0.92), 'dist': 0.14, 'size': 0.1, 'watts': 0.35}],
        'world': 0.45, 'grade': 0.85, 'exposure': -4.0,
        'bg': ("Replace only the background with Sheep Meadow in Central Park, New York, under a soft overcast sky: the "
               "wide green lawn behind him, a line of trees at its far edge and the Midtown skyline rising beyond, "
               "softly out of focus as with a portrait lens at f/2, cool even light. Photorealistic, natural colour. "
               "Keep the man, his face, his hands, his watch, his clothes, the phone, the green case and the red plate "
               "on its camera exactly as they are."),
        'pad': ("Extend the photograph to the left and right: Sheep Meadow in Central Park under an overcast sky, the "
                "lawn, the trees and the skyline continuing, soft and out of focus. Continue his grey jacket, white "
                "T-shirt and arms naturally where they meet the edge. The lower left is darker and quieter, in shadow."),
    },
    'airpods': {
        'n': 4, 'base': 'violet.png', 'family': 'Vivid Violet',
        'case_poly': [(500, 720), (820, 690), (1000, 1480), (980, 1540), (600, 1540), (520, 1100)],
        'portrait_x': 450, 'wide_left': 1300, 'wide_crop': 222, 'seed': 41401, 'key_px': 30,
        'accessory': {'which': 'airpods-ref', 'model': None, 'shade': 'go-green-09', 'finish': 'gloss'},
        # her free hand is out of the frame (her left arm hangs at the right edge), so the case is posed at her chest,
        # in the portrait's upper 60 percent, its front turned 20 degrees toward the picture's centre and its top 28
        # degrees toward the camera so the earbuds read; 4.1 px per mm, between her face's scale (about 3.7, a face
        # 140 mm across over 516 px) and the phone's (about 4.9, held nearer the camera)
        'pose': {'px': (1725, 1470), 'mm_per_px': 1 / 4.1, 'yaw': 20.0, 'pitch': 28.0},
        # what the hand pass may paint: a band from under the case down to the frame's lower right, where her left
        # forearm rises from the hanging sleeve (the elbow below the frame); no room beside the case, because attempt 1
        # with a wider zone drew a second, generated case in the hand (rejected; evidence doc). The case is cut out of it
        'hand_zone': [(1590, 1530), (1890, 1530), (2060, 1800), (2460, 2500), (1840, 2500), (1610, 1900)],
        'white': (232, 229, 223),   # the wall, lit by the window at the left
        'lights': [{'dir': (-0.8, -0.25, -0.55), 'dist': 1.2, 'size': 1.2, 'watts': 60}, {'dir': (0.5, 0.0, -0.85), 'dist': 2.0, 'size': 2.0, 'watts': 20}],
        'world': 0.35,
        'hand': ("Her left hand rises from the lower right and holds the small open sage green earbuds case that is "
                 "already in the picture from underneath: the case sits on her fingers and palm, her thumb against its "
                 "side. Her forearm in the same black leather jacket sleeve, the same skin tone and soft window light as "
                 "her right hand, a natural relaxed hand with five fingers. Photorealistic. Draw only her hand and "
                 "sleeve: do not draw any other case, earbuds, phone or object, and do not change the case already there."),
        'bg': ("Replace only the background with Bow Bridge over the Lake in Central Park, New York, behind her: the "
               "cast-iron bridge's low graceful arch over calm water, trees along the bank, in soft open shade, the "
               "background softly out of focus as with a portrait lens at f/2. Photorealistic, natural colour. Keep "
               "the woman, her face, hair, hands, jacket, the phone, the violet case and the green earbuds case exactly "
               "as they are."),
        'pad': ("Extend the photograph to the left and right: Bow Bridge and the Lake in Central Park, the water and "
                "the trees continuing, soft and out of focus, in open shade. Continue her hair and black leather jacket "
                "naturally where they meet the edge. The lower left is darker and quieter, in shadow."),
    },
}
ORDER = ['case', 'wallet', 'lenskin', 'airpods']

# ---------------------------------------------------------------------------------------------------------- helpers
def P(root, *a): return os.path.join(root, *a)
def to_lin(u8): x = np.asarray(u8, np.float64) / 255.0; return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)
def to_srgb(lin): x = np.clip(lin, 0, 1); return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055)
def u8(srgb): return np.clip(np.round(srgb * 255.0), 0, 255).astype(np.uint8)
def load_rgb(p): return np.asarray(Image.open(p).convert('RGB'))
def save_rgb(a, p): Image.fromarray(a).save(p, compress_level=6)
def load_rgba16(p):
    a = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if a is None: raise SystemExit(f'cannot read {p}')
    a = a.astype(np.float64) / (65535.0 if a.dtype == np.uint16 else 255.0)
    return a[..., [2, 1, 0]], a[..., 3]   # straight-alpha sRGB from Blender's PNG, alpha
def poly_mask(pts, shape, inset=0, radius=0):
    m = np.zeros(shape, np.uint8); cv2.fillPoly(m, [np.round(np.array(pts)).astype(np.int32)], 255)
    if radius: m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * radius + 1,) * 2))
    if inset: m = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * inset + 1,) * 2))
    return m.astype(np.float64) / 255.0
def feather(m, px): return cv2.GaussianBlur(m.astype(np.float32), (0, 0), px).astype(np.float64) if px > 0 else m
def dilate(m, px): return cv2.dilate(m.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * px + 1,) * 2)) if px > 0 else m
def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()
def shade(sid):
    for fam in json.load(open(SHADES))['families']:
        for s in fam['shades']:
            if s['id'] == sid: return s
    raise SystemExit(f'no shade {sid}')
def hex_rgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float64)
def lab(srgb255):
    x = to_lin(np.asarray(srgb255, np.float64)) @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]])
    x = x / np.array([0.95047, 1.0, 1.08883]); f = np.where(x > 216 / 24389, np.cbrt(x), (24389 / 27 * x + 16) / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])
def de2000(a, b):
    L1, a1, b1 = lab(a); L2, a2, b2 = lab(b)
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cm = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7))); a1p, a2p = a1 * (1 + G), a2 * (1 + G)
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p, h2p = math.degrees(math.atan2(b1, a1p)) % 360, math.degrees(math.atan2(b2, a2p)) % 360
    dL, dC = L2 - L1, C2p - C1p
    dh = 0 if C1p * C2p == 0 else (h2p - h1p if abs(h2p - h1p) <= 180 else h2p - h1p - 360 if h2p > h1p else h2p - h1p + 360)
    dH = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2))
    Lm, Cmp = (L1 + L2) / 2, (C1p + C2p) / 2
    hm = h1p + h2p if C1p * C2p == 0 else ((h1p + h2p) / 2 if abs(h1p - h2p) <= 180 else (h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2)
    T = 1 - 0.17 * math.cos(math.radians(hm - 30)) + 0.24 * math.cos(math.radians(2 * hm)) + 0.32 * math.cos(math.radians(3 * hm + 6)) - 0.20 * math.cos(math.radians(4 * hm - 63))
    SL = 1 + 0.015 * (Lm - 50) ** 2 / math.sqrt(20 + (Lm - 50) ** 2); SC = 1 + 0.045 * Cmp; SH = 1 + 0.015 * Cmp * T
    RT = -2 * math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7)) * math.sin(math.radians(60 * math.exp(-((hm - 275) / 25) ** 2)))
    return math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))

# ------------------------------------------------------------------------------------------------- the Higgsfield CLI
def hf(argv):
    p = subprocess.run(['higgsfield'] + argv + ['--json'], capture_output=True, text=True)
    if p.returncode != 0: raise SystemExit(f'higgsfield {" ".join(argv[:3])} failed ({p.returncode}): {p.stderr.strip() or p.stdout.strip()}')
    out = p.stdout.strip()
    try: return json.loads(out)
    except json.JSONDecodeError:
        i = min([k for k in (out.find('['), out.find('{')) if k >= 0])   # progress lines before the JSON
        return json.loads(out[i:])

def ledger(root): return [json.loads(l) for l in open(P(root, 'work/ledger.jsonl'))] if os.path.exists(P(root, 'work/ledger.jsonl')) else []
def spent(root): return round(sum(e.get('credits', 0) for e in ledger(root)), 3)

def upload(root, path):
    """an upload is free; memoised by the file's hash so a re-run never sends the same bytes twice"""
    memo_p = P(root, 'work/uploads.json'); memo = json.load(open(memo_p)) if os.path.exists(memo_p) else {}
    h = sha256(path)
    if h not in memo:
        u = hf(['upload', 'create', path]); memo[h] = {'id': u['id'], 'url': u['url'], 'type': u.get('type'), 'file': os.path.basename(path)}
        json.dump(memo, open(memo_p, 'w'), indent=1)
    return memo[h]

def generate(root, cap, stage, land, model, params, media, note=''):
    """cost, guard, create and wait, download; one ledger line per paid call"""
    argv = []
    for k, v in params.items(): argv += [f'--{k}', ('true' if v else 'false') if isinstance(v, bool) else str(v)]
    for k, v in media: argv += [f'--{k}', v]
    cost = float(hf(['generate', 'cost', model] + argv)['credits'])
    if spent(root) + cost > cap: raise SystemExit(f'credit cap: {spent(root)} spent, this call {cost}, cap {cap}. Stopping.')
    t0 = time.time()
    p = subprocess.run(['higgsfield', 'generate', 'create', model] + argv + ['--wait', '--wait-timeout', '20m', '--json'], capture_output=True, text=True)
    if p.returncode != 0:
        # a failed job is not charged (the balance said so on 2026-10-20); it still goes on the ledger, at 0 credits
        msg = (p.stderr.strip() or p.stdout.strip())[:400]
        jid = msg.split('job ')[1].split(' ')[0] if 'job ' in msg else None
        with open(P(root, 'work/ledger.jsonl'), 'a') as f:
            f.write(json.dumps({'at': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'stage': stage, 'land': land, 'model': model, 'job': jid, 'credits': 0, 'status': 'failed',
                                'params': {k: v for k, v in params.items() if k != 'mask'}, 'media': dict(media), 'mask': params.get('mask'), 'note': f'{note}; failed: {msg}'}) + '\n')
        raise SystemExit(f'{model} failed: {msg}')
    out = p.stdout.strip(); res = json.loads(out[min(k for k in (out.find('['), out.find('{')) if k >= 0):])
    job = res[0] if isinstance(res, list) else res
    url = job.get('result_url') or (job.get('results') or [{}])[0].get('url')
    if job.get('status') != 'completed' or not url: raise SystemExit(f'{model} job {job.get("id")} ended {job.get("status")}: {json.dumps(job)[:600]}')
    ext = os.path.splitext(url.split('?')[0])[1] or '.bin'
    local = P(root, 'work', f'{stage}-{land}-{job["id"][:8]}{ext}')
    urllib.request.urlretrieve(url, local)
    entry = {'at': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'stage': stage, 'land': land, 'model': model, 'job': job['id'], 'credits': cost,
             'seconds': round(time.time() - t0), 'params': {k: v for k, v in params.items() if k != 'mask'}, 'media': dict(media),
             'mask': params.get('mask'), 'result_url': url, 'file': os.path.basename(local), 'note': note}
    with open(P(root, 'work/ledger.jsonl'), 'a') as f: f.write(json.dumps(entry) + '\n')
    print(f'{stage} {land}: {model} job {job["id"]} {cost} credits, {entry["seconds"]} s -> {local} (spent {spent(root)} of {cap})')
    return local, entry

def mask_ref(root, mask_png):
    """nano_banana_2_1's mask is a media object, not a path: upload the PNG and hand the CLI its {id, type, url}"""
    u = upload(root, mask_png)
    p = mask_png[:-4] + '.mask.json'
    json.dump({'id': u['id'], 'type': 'media_input', 'url': u['url']}, open(p, 'w'))
    return '@' + p, u['id']

def inpaint(root, cap, stage, land, image_u8, edit_mask, prompt, seed, aspect, size, note='', attempt=1):
    """the masked inpaint: white is what the generator may paint (checked on the first call, see the evidence doc);
    image and mask go up at the generator's own 2k size and the result comes back at it"""
    img_p, msk_p = P(root, 'work', f'{stage}-{land}-in-{attempt}.png'), P(root, 'work', f'{stage}-{land}-mask-{attempt}.png')
    Image.fromarray(image_u8).resize(size, Image.LANCZOS).save(img_p)
    Image.fromarray((edit_mask > 0.5).astype(np.uint8) * 255).resize(size, Image.NEAREST).save(msk_p)
    mref, mid = mask_ref(root, msk_p)
    iu = upload(root, img_p)
    params = {'prompt': prompt, 'is_inpaint': True, 'mask': mref, 'resolution': '2k', 'aspect_ratio': aspect, 'seed': seed}
    local, entry = generate(root, cap, stage, land, 'nano_banana_2_1', params, [('image', iu['id'])], note=note)
    return local, entry

# --------------------------------------------------------------------------------------------------------- the poses
def case_pose(L):
    """the phone case's back plane against the photo (OpenCV's IPPE for a planar target): case frame x right, y down,
    z into the case, millimetres; returns R, t (mm) into the camera"""
    w, h = L['case_mm']
    obj = np.array([(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], np.float64)
    K = np.array([[F_PX, 0, SIDE / 2], [0, F_PX, SIDE / 2], [0, 0, 1]])
    ok, r, t = cv2.solvePnP(obj, np.array(L['corners'], np.float64), K, None, flags=cv2.SOLVEPNP_IPPE)
    R, _ = cv2.Rodrigues(r)
    err = np.linalg.norm(cv2.projectPoints(obj, r, t, K, None)[0][:, 0] - np.array(L['corners']), axis=1)
    return R, t.ravel(), err

def M4(R, t):
    M = np.eye(4); M[:3, :3] = R; M[:3, 3] = t; return M

# the models' frame (Blender's, as products.py wrote them: x across, z up, the front toward -y) into a camera-facing
# upright frame (x right, y down, the front toward -z): x -> x, y -> z, z -> -y
R_UPRIGHT = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], np.float64)   # rows: camera x, y, z in the model's terms

def spec_for(root, lid, L, args):
    A = L['accessory']; S = {'which': A['which'], 'shades': SHADES, 'shade': A['shade'], 'finish': A['finish'],
                             'out': P(root, 'work', f'acc-{lid}.png'), 'samples': args.samples,
                             # three stops down, so neither pass clips at 1 in the 16-bit PNG (the gain undoes it)
                             'exposure': L.get('exposure', -3.0),
                             'lights': [dict(l, rgb=(1, 1, 1)) for l in L['lights']], 'world': {'rgb': (1, 1, 1), 'strength': L['world']}}
    if A['which'] == 'wallet':
        S['model'] = os.path.join(MODELS, A['model'])
        R, t, err = case_pose(L)
        w, h = L['case_mm']
        # the wallet centred across, and between the camera window's lower edge and the case's bottom; its back on the
        # case (the model's +y face at the case's z = 0), its front toward the camera
        win_mm = (L['window_y'] - L['corners'][0][1]) / (L['corners'][3][1] - L['corners'][0][1]) * h - h / 2
        y_c = (win_mm + h / 2) / 2 / 1000.0
        mdl = np.eye(4); mdl[:3, :3] = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], np.float64)
        mdl[:3, 3] = (0.0007, y_c + 0.0469, -0.0023)
        cam = M4(R, t / 1000.0)
        S.update({'width': SIDE, 'height': SIDE, 'camera': {'type': 'persp', 'f_px': F_PX, 'cx': SIDE / 2, 'cy': SIDE / 2},
                  'object': (cam @ mdl).tolist(), 'catcher': {'matrix': cam.tolist(), 'size': [w / 1000.0, h / 1000.0]}})
        S['_pose'] = {'pnp_err_px': err.round(2).tolist(), 'case_normal': R[:, 2].round(4).tolist(), 'case_t_mm': t.round(1).tolist(), 'wallet_centre_y_mm': round(y_c * 1000, 1)}
    elif A['which'] == 'lenskin':
        S['model'] = os.path.join(MODELS, A['model'])
        # face-on, orthographic at 20 px per mm, the plate as seen from outside with the phone upright; lands.py then
        # places it by the hole homography (composite). The plate's +y face is the outside (its holes then fall where
        # the 17 Pro Max's lenses are, seen from behind): x -> -x, z -> -y, y -> -z
        mdl = np.eye(4); mdl[:3, :3] = np.array([[-1, 0, 0], [0, 0, -1], [0, -1, 0]], np.float64); mdl[:3, 3] = (0.0, 0.0195, 0.3)
        cat = np.eye(4); cat[:3, 3] = (0.0, 0.0, 0.3013)   # the plateau under the plate
        S.update({'width': 1440, 'height': 880, 'camera': {'type': 'ortho', 'px_per_m': 20000.0},
                  'object': mdl.tolist(), 'catcher': {'matrix': cat.tolist(), 'size': [0.09, 0.06]}})
    else:
        S['which'] = 'airpods-ref'; S['model'] = args.airpods_fbx
        if not S['model'] or not os.path.exists(S['model']): raise SystemExit('land 4 needs --airpods-fbx (Sam\'s source FBX, copied out of "air pods.zip")')
        po = L['pose']; d = F_PX * po['mm_per_px'] / 1000.0   # metres to the case
        X = (po['px'][0] - SIDE / 2) / F_PX * d; Y = (po['px'][1] - SIDE / 2) / F_PX * d
        yaw, pitch = math.radians(po['yaw']), math.radians(po['pitch'])
        Ry = np.array([[math.cos(yaw), 0, math.sin(yaw)], [0, 1, 0], [-math.sin(yaw), 0, math.cos(yaw)]])
        Rx = np.array([[1, 0, 0], [0, math.cos(pitch), -math.sin(pitch)], [0, math.sin(pitch), math.cos(pitch)]])
        R = Rx @ Ry @ R_UPRIGHT
        # the case's centre (the GLB frame: x 0, y 0, z 26.5 mm) on the chosen pixel
        c_model = np.array([0.0, 0.0, 0.0265]); t = np.array([X, Y, d]) - R @ c_model
        obj = M4(R, t)
        S.update({'width': SIDE, 'height': SIDE, 'camera': {'type': 'persp', 'f_px': F_PX, 'cx': SIDE / 2, 'cy': SIDE / 2},
                  'object': obj.tolist(), 'catcher': {'matrix': obj.tolist(), 'size': [0.14, 0.14]}})
    return S

# ------------------------------------------------------------------------------------------------------------ stages
def st_render(root, lid, L, args):
    if 'accessory' not in L: print(f'{lid}: no accessory'); return
    S = spec_for(root, lid, L, args)
    sp = P(root, 'work', f'acc-{lid}.json'); json.dump({k: v for k, v in S.items() if not k.startswith('_')}, open(sp, 'w'), indent=1)
    if '_pose' in S: json.dump(S['_pose'], open(P(root, 'work', f'acc-{lid}-pose.json'), 'w'), indent=1); print(lid, 'pose', S['_pose'])
    t0 = time.time()
    p = subprocess.run([BLENDER, '-b', '--factory-startup', '--python', RENDER, '--', sp], capture_output=True, text=True)
    if 'DONE' not in p.stdout: raise SystemExit(f'render {lid} failed:\n{p.stdout[-3000:]}\n{p.stderr[-2000:]}')
    print(f'{lid}: rendered in {time.time() - t0:.0f} s ->', S['out'], [l for l in p.stdout.splitlines() if l.startswith('shade')])

def accessory_layers(root, lid, L):
    """the render in the base's frame: straight sRGB, the object's coverage, the contact shadow's coverage, and the
    neutral pass and body mask (for the gain and the colour check), all 2500 x 2500"""
    rgb, a = load_rgba16(P(root, 'work', f'acc-{lid}.png'))
    nrgb, _ = load_rgba16(P(root, 'work', f'acc-{lid}-neutral.png'))
    mrgb, ma = load_rgba16(P(root, 'work', f'acc-{lid}-mask.png'))
    if L['accessory']['which'] == 'lenskin':
        Hm, _ = cv2.findHomography(np.array(L['holes_mm'], np.float64), np.array(L['holes_px'], np.float64), 0)
        hr, wr = a.shape
        A = np.array([[1 / 20.0, 0, -wr / 40.0], [0, -1 / 20.0, 19.5 + hr / 40.0], [0, 0, 1]])   # render px -> plate mm
        T = Hm @ A
        warp = lambda x, interp=cv2.INTER_LINEAR: cv2.warpPerspective(x.astype(np.float32), T, (SIDE, SIDE), flags=interp, borderValue=0).astype(np.float64)
        pre = np.dstack([rgb * a[..., None], a])   # warp premultiplied, then back to straight
        pre = np.dstack([warp(pre[..., i]) for i in range(4)]); a = pre[..., 3]
        rgb = np.where(a[..., None] > 1e-4, pre[..., :3] / np.maximum(a[..., None], 1e-4), 0)
        nrgb = np.dstack([warp(nrgb[..., i]) for i in range(3)]); mrgb = np.dstack([warp(mrgb[..., i], cv2.INTER_NEAREST) for i in range(3)]); ma = warp(ma)
        resid = np.linalg.norm(cv2.perspectiveTransform(np.array([L['holes_mm']], np.float64), Hm)[0] - np.array(L['holes_px']), axis=1)
        print(f'{lid}: hole homography residual px', resid.round(1).tolist())
    obj = np.clip(ma, 0, 1)
    shadow = np.clip(a - obj, 0, 1) * (1 - obj)
    return rgb, a, obj, shadow, nrgb, mrgb[..., 0]

def st_composite(root, lid, L, args):
    base = load_rgb(P(root, 'src', L['base']))
    if 'accessory' not in L:
        save_rgb(base, P(root, 'work', f'comp-{lid}.png')); print(f'{lid}: no accessory, the composite is the base'); return
    rgb, a, obj, shadow, nrgb, body = accessory_layers(root, lid, L)
    # the gain: a white Lambertian under the render's light lands at the photo's own white (per channel, so the white
    # balance follows the photo's light too), times a grade set by eye (1 unless noted)
    sel = (body > 0.9) & (obj > 0.99)
    neutral_med = np.median(to_lin(nrgb[sel] * 255.0), axis=0)
    gain = to_lin(np.array(L['white'], np.float64)) / np.maximum(neutral_med, 1e-6) * L.get('grade', 1.0)
    acc_lin = to_lin(rgb * 255.0) * gain
    blin = to_lin(base)
    occ = np.ones(obj.shape)
    if L['accessory']['which'] == 'lenskin':
        # inside the case's rim only, and behind the fingers: skin in the plateau keeps the photo's pixels
        clip = feather(poly_mask(L['plateau'], obj.shape, inset=L['plateau_inset'], radius=L['plateau_r']), 1.2)
        hsv = cv2.cvtColor(base, cv2.COLOR_RGB2HSV).astype(int)
        skin = ((hsv[..., 0] < 22) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 55) & (hsv[..., 2] > 70)
        skin = feather(dilate(skin.astype(np.uint8), 3).astype(np.float64), 1.5)
        occ = clip * (1 - skin)
    so, sh = obj * occ, shadow * occ
    # the photo's own softness and grain on the render, so it sits in the picture rather than on it: the premultiplied
    # layer blurred by 'soft' px (0.7 unless noted), then the base's noise added, measured as the robust spread of a
    # high-pass inside the case (the nearest flat surface in the same light), in sRGB code values per channel
    soft = L.get('soft', 0.7)
    pre = np.dstack([feather(acc_lin[..., i] * so, soft) for i in range(3)]); so = np.clip(feather(so, soft), 0, 1)
    acc_lin = pre / np.maximum(so, 1e-4)[..., None]
    bf = base.astype(np.float64); hp = bf - cv2.GaussianBlur(bf, (0, 0), 1.5)
    flat = (poly_mask(L['case_poly'], obj.shape, inset=12) > 0.5) & (obj < 0.01)
    std = 1.4826 * np.median(np.abs(hp[flat] - np.median(hp[flat], axis=0)), axis=0)
    noise = np.random.default_rng(L['seed']).normal(0.0, 1.0, base.shape) * std
    acc_lin = to_lin(np.clip(to_srgb(acc_lin) * 255.0 + noise, 0, 255))
    out = blin * (1 - sh[..., None])                       # the contact shadow, as Cycles caught it
    if lid == 'airpods':
        # land 4 waits for the hand: the shadow goes on after it (it falls on the palm), so keep the layers apart
        np.save(P(root, 'work', f'layers-{lid}.npy'), {'acc': acc_lin, 'obj': so, 'shadow': sh}, allow_pickle=True)
        out = blin
    out = acc_lin * so[..., None] + out * (1 - so[..., None])
    save_rgb(u8(to_srgb(out)), P(root, 'work', f'comp-{lid}.png'))
    Image.fromarray(u8(np.clip(so, 0, 1))).save(P(root, 'work', f'obj-{lid}.png'))
    Image.fromarray(u8(np.clip(np.maximum(so, sh), 0, 1))).save(P(root, 'work', f'accalpha-{lid}.png'))
    json.dump({'gain': gain.tolist(), 'neutral_median_lin': neutral_med.tolist(), 'white_ref': L['white'], 'grade': L.get('grade', 1.0),
               'soft_px': soft, 'grain_srgb_std': std.tolist()}, open(P(root, 'work', f'comp-{lid}.json'), 'w'), indent=1)
    print(f'{lid}: composite written, gain', gain.round(3).tolist(), 'grain', std.round(2).tolist())

def st_hand(root, lid, L, args):
    if lid != 'airpods': return
    comp = load_rgb(P(root, 'work', f'comp-{lid}.png'))
    lay = np.load(P(root, 'work', f'layers-{lid}.npy'), allow_pickle=True).item()
    zone = poly_mask(L['hand_zone'], comp.shape[:2])
    edit = zone * (1 - (dilate((lay['obj'] > 0.3).astype(np.uint8), 4) > 0))
    if args.reuse:   # re-blend an attempt already paid for
        hits = [e for e in ledger(root) if e['stage'] == 'hand' and e['land'] == lid and e.get('status') != 'failed' and e.get('note', '').startswith(f'attempt {args.attempt}')]
        if not hits: raise SystemExit(f'no paid hand attempt {args.attempt}')
        local = P(root, 'work', hits[-1]['file'])
    else:
        local, entry = inpaint(root, args.cap, 'hand', lid, comp, edit, L['hand'], L['seed'] + args.attempt, '1:1', (UP, UP), note=f'attempt {args.attempt}', attempt=args.attempt)
    gen = np.asarray(Image.open(local).convert('RGB').resize((SIDE, SIDE), Image.LANCZOS))
    # the generator draws the whole hand, its fingertips past the zone (attempt 2), and leaves the rest of the photo
    # within a few code values: so what is taken from it is the zone plus whatever it changed by more than 14 code
    # values within 160 px of the zone (the fingers), never the phone in its case, closed and softened by 4 px
    d = cv2.GaussianBlur(np.abs(gen.astype(np.float32) - comp.astype(np.float32)).mean(axis=2), (0, 0), 3)
    near = dilate((zone > 0.5).astype(np.uint8), 160) > 0
    took = (zone > 0.5) | ((d > 14) & near)
    took = cv2.morphologyEx(took.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0
    took &= poly_mask(L['case_poly'], took.shape) < 0.5
    zs = np.clip(feather(took.astype(np.float64), 4), 0, 1)
    blin = to_lin(comp) * (1 - zs[..., None]) + to_lin(gen) * zs[..., None]
    blin = blin * (1 - lay['shadow'][..., None])           # the contact shadow onto the new palm
    out = lay['acc'] * lay['obj'][..., None] + blin * (1 - lay['obj'][..., None])   # the case's own pixels, exactly
    save_rgb(u8(to_srgb(out)), P(root, 'work', f'hand-{lid}-{args.attempt}.png'))
    print(f'{lid}: hand attempt {args.attempt} -> work/hand-{lid}-{args.attempt}.png')

def stage_input(root, lid, args):
    if lid == 'airpods':
        p = P(root, 'work', f'hand-{lid}-{args.hand}.png')
        if not os.path.exists(p): raise SystemExit(f'no {p}: run the hand stage (and pick it with --hand n)')
        return p
    return P(root, 'work', f'comp-{lid}.png')

def st_matte(root, lid, L, args):
    src = stage_input(root, lid, args)
    iu = upload(root, src)
    local, entry = generate(root, args.cap, 'matte', lid, 'image_background_remover', {}, [('image', iu['id'])], note=os.path.basename(src))
    im = Image.open(local)
    a = np.asarray(im.convert('RGBA'))[..., 3] if im.mode in ('RGBA', 'LA', 'P') else np.asarray(im.convert('L'))
    a = np.asarray(Image.fromarray(a).resize((SIDE, SIDE), Image.LANCZOS))
    Image.fromarray(a).save(P(root, 'work', f'matte-{lid}.png'))
    print(f'{lid}: matte from {os.path.basename(src)}, foreground {np.mean(a > 127):.3f} of the frame')

def case_region(L, raw):
    """the phone in its case: the measured polygon, cut to what the remover calls the person (alpha over 0.2, so the
    case's own antialiased edge stays in), since a straight-sided polygon holds a sliver of wall at the rounded corners
    (land 4's top left, a white sliver before this)"""
    return poly_mask(L['case_poly'], raw.shape) * (dilate((raw > 0.2).astype(np.uint8), 2) > 0)

def protect(root, lid, L, shape):
    """what the generator never paints: the matte (soft), and hard ones over the phone in its case and the accessory;
    returns the protection, the hard part of it, and the remover's own alpha (for the edge's decontamination)"""
    raw = np.asarray(Image.open(P(root, 'work', f'matte-{lid}.png')).convert('L')).astype(np.float64) / 255.0
    # the remover leaves skin a little transparent (land 2's chin and neck read 0.91 to 0.98, which would let 5 percent
    # of the new background into her face) and keeps wall between curls half solid (0.26 at the median): a smoothstep
    # from 0.35 to 0.85 makes the first solid and hands the second to the generator, the hair's fall-off still soft.
    # A hole the person encloses is the person's when it lies more than 'hole_px' (80) from the background that
    # reaches the frame's edge (land 2's open mouth and the shade under her chin, which the remover cut out), and stays
    # background when it is nearer (the wall between land 2's curls)
    t = np.clip((raw - 0.35) / 0.5, 0, 1); matte = t * t * (3 - 2 * t)
    n, lab = cv2.connectedComponents((matte < 0.5).astype(np.uint8))
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    outer = np.isin(lab, edge) & (matte < 0.5)
    d_out = cv2.distanceTransform((~outer).astype(np.uint8), cv2.DIST_L2, 5)
    for k in range(1, n):
        if k in edge: continue
        comp = lab == k
        if d_out[comp].min() > L.get('hole_px', 80): matte[comp] = 1.0
    hard = case_region(L, raw)
    if os.path.exists(P(root, 'work', f'accalpha-{lid}.png')):
        acc = np.asarray(Image.open(P(root, 'work', f'accalpha-{lid}.png')).convert('L')).astype(np.float64) / 255.0
        hard = np.maximum(hard, (dilate((acc > 0.02).astype(np.uint8), 6) > 0).astype(np.float64))
    return np.maximum(matte, hard), hard, raw

def st_bg(root, lid, L, args):
    src = load_rgb(stage_input(root, lid, args))
    A, hard, raw = protect(root, lid, L, src.shape[:2])
    edit = edit_mask(L, src, A, hard, raw)
    local, entry = inpaint(root, args.cap, 'bg', lid, src, edit, L['bg'], L['seed'] + 10 + args.attempt, '1:1', (UP, UP), note=f'attempt {args.attempt}', attempt=args.attempt)
    gen = np.asarray(Image.open(local).convert('RGB').resize((SIDE, SIDE), Image.LANCZOS))
    # the semantics check on every call: the generator should have changed the white and kept the black
    small = lambda x: cv2.resize(x.astype(np.float32), (512, 512), interpolation=cv2.INTER_AREA)
    d = np.abs(small(gen) - small(src)).mean(axis=2); e = small(edit) > 0.5
    print(f'{lid}: mean change {d[e].mean():.1f} inside the edit mask, {d[~e].mean():.1f} outside')
    blend(root, lid, L, args, src, gen, A, hard, raw)

def edge_alpha(L, s_lin, A, hard, raw):
    """the person's alpha at its edge, as the blend uses it (and, with 'paint_pockets', as the edit mask's extra):
    the background where the protection is under a half; across a band of 'edge_px' (12) the remover's own alpha,
    choked over 'choke_px' (2) because the outermost pixels carry the old wall even where the remover calls them solid
    (land 3's lime rim on the finger); and over 'key_px' a colour key: a pixel as near the old wall's colour as the
    wall is to itself is wall, whatever the remover says (land 4's light outline on the hair). The old wall is
    estimated by spreading the wall's own pixels in (a normalised blur)."""
    bgm = (A < 0.5)
    dist = cv2.distanceTransform((~bgm).astype(np.uint8), cv2.DIST_L2, 5)
    band = (~bgm) & (dist <= L.get('edge_px', 12)) & (hard < 0.5)
    wall = (raw < 0.05).astype(np.float32)
    num = np.dstack([cv2.GaussianBlur((s_lin[..., i] * wall).astype(np.float32), (0, 0), 24) for i in range(3)])
    den = cv2.GaussianBlur(wall, (0, 0), 24)[..., None]
    old = np.where(den > 1e-3, num / np.maximum(den, 1e-3), s_lin)
    ch = L.get('choke_px', 2)
    a_c = np.where(band, np.minimum(raw, dist / (ch + 1.0)), A)
    kp = L.get('key_px', 0)
    if kp:
        near = (~bgm) & (dist <= kp) & (hard < 0.5)
        band = band | near
        dcol = np.linalg.norm((to_srgb(s_lin) - to_srgb(old)) * 255.0, axis=2)
        t = np.clip((dcol - 15.0) / 45.0, 0, 1); a_col = t * t * (3 - 2 * t)
        a_c = np.where(near, np.minimum(a_c, a_col), a_c)
        # land 2's wall shows between the curls at 0.83 to 0.92 alpha by the remover, saturation 18 to 36 of 255 and
        # value over 220, where her hair never drops under 94: 'key_sat' (s0, s1, v0) keys light, nearly grey pixels
        if L.get('key_sat'):
            s0, s1, v0 = L['key_sat']
            hsv = cv2.cvtColor(u8(to_srgb(s_lin)), cv2.COLOR_RGB2HSV).astype(np.float64)
            t = np.clip((hsv[..., 1] - s0) / (s1 - s0), 0, 1); a_sat = np.where(hsv[..., 2] > v0, t * t * (3 - 2 * t), 1.0)
            a_c = np.where(near, np.minimum(a_c, a_sat), a_c)
    return bgm, band, old, a_c

def edit_mask(L, src, A, hard, raw):
    """what the generator is asked to paint: the background, 8 px into the edge; with 'paint_pockets' also the wall the
    key finds inside the hair (land 2's curls), so the pockets get the new place rather than a spread of it"""
    bgm, band, old, a_c = edge_alpha(L, to_lin(src), A, hard, raw)
    m = bgm | ((a_c < 0.5) & band) if L.get('paint_pockets') else bgm
    return (dilate(m.astype(np.uint8), 8) > 0).astype(np.float64) * (1 - hard)

def blend(root, lid, L, args, src, gen, A, hard, raw):
    """the person over the new background: inside, the photo's own pixels; outside, the generator's; across the edge
    (edge_alpha), the photo's foreground colour with the old wall taken out by the remover's alpha, over the new
    background by the keyed alpha. The hard regions (the case, the accessory) are the photo's pixels, exactly."""
    s_lin, g_lin = to_lin(src), to_lin(gen)
    bgm, band, old, a_c = edge_alpha(L, s_lin, A, hard, raw)
    # what the generator was asked to paint for this attempt (its own mask file); elsewhere, pockets between curls
    # deeper than the mask's reach get the new background spread in from the painted area, as an out-of-focus one is
    mp = P(root, 'work', f'bg-{lid}-mask-{args.attempt}.png')
    E = (np.asarray(Image.open(mp).convert('L').resize((SIDE, SIDE), Image.NEAREST)) > 127) if os.path.exists(mp) else ((dilate(bgm.astype(np.uint8), 8) > 0) & (hard < 0.5))
    Ef = E.astype(np.float32)
    gnum = np.dstack([cv2.GaussianBlur((g_lin[..., i] * Ef).astype(np.float32), (0, 0), 20) for i in range(3)])
    gden = cv2.GaussianBlur(Ef, (0, 0), 20)[..., None]
    g_new = np.where(E[..., None], g_lin, np.where(gden > 1e-3, gnum / np.maximum(gden, 1e-3), g_lin))
    ar = np.maximum(raw, 0.1)[..., None]
    F = np.clip((s_lin - (1 - raw)[..., None] * old) / ar, 0, 1)   # clipped, so a pixel the key calls wall cannot ring
    F = np.where(band[..., None], F, s_lin)                         # the interior keeps its own pixels
    out = np.where(bgm[..., None], g_lin, a_c[..., None] * F + (1 - a_c)[..., None] * g_new)
    # the boundary itself, 1.5 px soft, so the switch from the generator to the photo leaves no stair
    w = np.clip(feather(bgm.astype(np.float64), 1.5), 0, 1) * (hard < 0.5)
    out = np.clip(out, 0, 1) * (1 - w[..., None]) + g_lin * w[..., None]
    out = np.where((hard > 0.5)[..., None], s_lin, out)
    save_rgb(u8(to_srgb(out)), P(root, 'work', f'bg-{lid}-{args.attempt}.png'))
    print(f'{lid}: bg attempt {args.attempt} -> work/bg-{lid}-{args.attempt}.png')

def st_blend(root, lid, L, args):
    """re-blend an attempt already paid for (its generator output is on the ledger), with no new call"""
    hits = [e for e in ledger(root) if e['stage'] == 'bg' and e['land'] == lid and e.get('status') != 'failed' and e.get('note', '').startswith(f'attempt {args.attempt}')]
    if not hits: raise SystemExit(f'no paid bg attempt {args.attempt} for {lid}')
    src = load_rgb(stage_input(root, lid, args))
    A, hard, raw = protect(root, lid, L, src.shape[:2])
    gen = np.asarray(Image.open(P(root, 'work', hits[-1]['file'])).convert('RGB').resize((SIDE, SIDE), Image.LANCZOS))
    blend(root, lid, L, args, src, gen, A, hard, raw)

def st_pick(root, lid, L, args):
    os.makedirs(P(root, 'out'), exist_ok=True)
    shutil.copyfile(P(root, 'work', f'bg-{lid}-{args.attempt}.png'), P(root, 'out', f'land-{lid}-square.png'))
    json.dump({'bg_attempt': args.attempt, 'hand_attempt': args.hand if lid == 'airpods' else None}, open(P(root, 'work', f'pick-{lid}.json'), 'w'))
    print(f'{lid}: square <- bg attempt {args.attempt}')

def register(gen, ref, ref_mask):
    """the generator may reframe a canvas it was asked to extend (land 1's came back 21:9 for a 16:9 canvas, the woman
    smaller in it): SIFT matches inside the square, a similarity by RANSAC, and the output warped into the canvas"""
    sift = cv2.SIFT_create(6000)
    g = cv2.cvtColor(gen, cv2.COLOR_RGB2GRAY); r = cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY)
    kg, dg = sift.detectAndCompute(g, None); kr, dr = sift.detectAndCompute(r, ref_mask)
    good = [a for a, b in cv2.BFMatcher().knnMatch(dr, dg, k=2) if a.distance < 0.75 * b.distance]
    if len(good) < 20: return None, None, len(good)
    src = np.float32([kg[a.trainIdx].pt for a in good]); dst = np.float32([kr[a.queryIdx].pt for a in good])
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2.5)
    return M, inl, len(good)

def wide_canvas(sq, L):
    """the square on a 16:9 canvas at its full height (no pad above, so never above a cropped face; nothing below, so
    the body is never invented under the frame), the pads alone to be painted, plus a seam band of 48 px each side;
    the pads start as the square's edge columns stretched and blurred, so the generator begins from the right light"""
    Lp = L['wide_left']; band = 48
    canvas = np.zeros((SIDE, WIDE16x9, 3), np.uint8); canvas[:, Lp:Lp + SIDE] = sq
    left = cv2.resize(sq[:, :8], (Lp, SIDE), interpolation=cv2.INTER_LINEAR); right = cv2.resize(sq[:, -8:], (WIDE16x9 - Lp - SIDE, SIDE), interpolation=cv2.INTER_LINEAR)
    canvas[:, :Lp] = cv2.GaussianBlur(left, (0, 0), 40); canvas[:, Lp + SIDE:] = cv2.GaussianBlur(right, (0, 0), 40)
    pad = np.ones((SIDE, WIDE16x9)); pad[:, Lp + band:Lp + SIDE - band] = 0
    return canvas, pad, PAD_SIZE

def outpaint_land(L):
    """Higgsfield's own outpaint model extends to an aspect symmetrically: the square sits centred in the 16:9 (972 px
    each side), and the 16:10 is cut from its left edge, so the left pad (972) is the wider, where the text sits"""
    return dict(L, wide_left=(WIDE16x9 - SIDE) // 2, wide_crop=0)

def st_crops(root, lid, L, args):
    sq = load_rgb(P(root, 'out', f'land-{lid}-square.png'))
    x0 = L['portrait_x']; save_rgb(sq[:, x0:x0 + PORTRAIT_W], P(root, 'out', f'land-{lid}-portrait.png'))
    if args.pad_model == 'outpaint':
        # nano_banana_2_1's masked pad fill (attempt 1 on lands 1 and 2) re-framed the canvas and cut the person off at
        # the square's edges instead of continuing her; the outpaint model continues the picture outward from its edge
        L = outpaint_land(L)
        canvas, pad, size = wide_canvas(sq, L)
        sp = P(root, 'work', f'pad-{lid}-in-{args.attempt}.png'); Image.fromarray(sq).resize((UP, UP), Image.LANCZOS).save(sp)
        local, entry = generate(root, args.cap, 'pad', lid, 'outpaint', {'aspect_ratio': '16:9'}, [('image', upload(root, sp)['id'])], note=f'attempt {args.attempt}')
    else:
        canvas, pad, size = wide_canvas(sq, L)
        local, entry = inpaint(root, args.cap, 'pad', lid, canvas, pad, L['pad'], L['seed'] + 20 + args.attempt, '16:9', size, note=f'attempt {args.attempt}', attempt=args.attempt)
    widen(root, lid, L, args, canvas, local)

def widen(root, lid, L, args, canvas, local):
    Lp = L['wide_left']; band = 48
    raw = np.asarray(Image.open(local).convert('RGB'))
    sent = np.asarray(Image.fromarray(canvas).resize(PAD_SIZE, Image.LANCZOS))
    sx = PAD_SIZE[0] / WIDE16x9
    m = np.zeros(sent.shape[:2], np.uint8); m[:, int((Lp + 200) * sx):int((Lp + SIDE - 200) * sx)] = 255
    M, inl, n = register(raw, sent, m)
    if M is None: raise SystemExit(f'{lid}: the pad output does not register to its canvas ({n} matches)')
    scale = math.hypot(M[0, 0], M[1, 0])
    # into the canvas at full size: the similarity, scaled up from the size the canvas was sent at
    T = (np.diag([1 / sx, 1 / sx, 1.0]) @ np.vstack([M, [0, 0, 1]]))[:2]
    gen = cv2.warpAffine(raw, T, (WIDE16x9, SIDE), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)   # a few rows short at most: their edge, repeated
    cover = cv2.warpAffine(np.full(raw.shape[:2], 255, np.uint8), T, (WIDE16x9, SIDE), flags=cv2.INTER_NEAREST, borderValue=0) > 0
    print(f'{lid}: pad output {raw.shape[1]}x{raw.shape[0]} registered by {int(inl.sum())} of {n} matches, scale {scale:.4f}, '
          f'shift {M[0, 2]:.1f}, {M[1, 2]:.1f}; it covers {cover.mean():.4f} of the canvas')
    # keep the square exact except a seam band at its two edges, where the pad fades in
    ramp = np.ones(WIDE16x9)
    ramp[Lp:Lp + band] = np.linspace(1, 0, band); ramp[Lp + band:Lp + SIDE - band] = 0; ramp[Lp + SIDE - band:Lp + SIDE] = np.linspace(0, 1, band)
    w = np.broadcast_to(ramp[None, :], cover.shape)
    out = to_lin(gen) * w[..., None] + to_lin(canvas) * (1 - w[..., None])
    wide = u8(to_srgb(out)); c0 = L['wide_crop']
    if not cover[:, c0:c0 + WIDE16x10].all(): print(f'{lid}: the registered output leaves {(~cover[:, c0:c0 + WIDE16x10]).mean():.4f} of the 16:10 to its repeated edge')
    save_rgb(wide, P(root, 'work', f'wide169-{lid}-{args.attempt}.png'))
    save_rgb(wide[:, c0:c0 + WIDE16x10], P(root, 'work', f'wide-{lid}-{args.attempt}.png'))
    print(f'{lid}: portrait x {L["portrait_x"]}..{L["portrait_x"] + PORTRAIT_W}; wide attempt {args.attempt} (square at {Lp} of {WIDE16x9}, 16:10 from {c0})')

def st_widen(root, lid, L, args):
    """re-make a wide from a pad call already paid for, with no new call"""
    hits = [e for e in ledger(root) if e['stage'] == 'pad' and e['land'] == lid and e.get('status') != 'failed' and e.get('note', '').startswith(f'attempt {args.attempt}')]
    if not hits: raise SystemExit(f'no paid pad attempt {args.attempt} for {lid}')
    sq = load_rgb(P(root, 'out', f'land-{lid}-square.png'))
    x0 = L['portrait_x']; save_rgb(sq[:, x0:x0 + PORTRAIT_W], P(root, 'out', f'land-{lid}-portrait.png'))
    if hits[-1]['model'] == 'outpaint': L = outpaint_land(L)
    canvas, pad, size = wide_canvas(sq, L)
    widen(root, lid, L, args, canvas, P(root, 'work', hits[-1]['file']))

def st_pickwide(root, lid, L, args):
    shutil.copyfile(P(root, 'work', f'wide-{lid}-{args.attempt}.png'), P(root, 'out', f'land-{lid}-wide.png'))
    pk = P(root, 'work', f'pick-{lid}.json'); d = json.load(open(pk)) if os.path.exists(pk) else {}
    d['pad_attempt'] = args.attempt; json.dump(d, open(pk, 'w')); print(f'{lid}: wide <- pad attempt {args.attempt}')

def st_depth(root, lid, L, args):
    for cls, size in (('portrait', (720, 1280)), ('wide', (1920, 1200))):
        src = P(root, 'out', f'land-{lid}-{cls}.png')
        png = P(root, 'work', f'depth-{lid}-{cls}-in.png'); Image.open(src).convert('RGB').resize(size, Image.LANCZOS).save(png)
        mp4 = png[:-4] + '.mp4'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-i', png, '-t', '1', '-r', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '12', mp4], check=True)
        vu = upload(root, mp4)
        local, entry = generate(root, args.cap, 'depth', f'{lid}-{cls}', 'depth_anything_video',
                                {'variant': 'VDA-Small', 'max_frames': 1, 'colormap': 'grayscale'}, [('video', vu['id'])])
        dst = P(root, 'out', f'land-{lid}-{cls}-depth.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', local, '-frames:v', '1', '-pix_fmt', 'gray', dst], check=True)
        print(f'{lid} {cls}: depth {Image.open(dst).size} -> {dst}')

def st_check(root, lid, L, args):
    base = load_rgb(P(root, 'src', L['base'])).astype(np.float64)
    accp = P(root, 'work', f'accalpha-{lid}.png')
    acc = (np.asarray(Image.open(accp).convert('L')) > 5) if os.path.exists(accp) else np.zeros(base.shape[:2], bool)
    region = case_region(L, np.asarray(Image.open(P(root, 'work', f'matte-{lid}.png')).convert('L')).astype(np.float64) / 255.0) > 0.5
    keep = region & ~(dilate(acc.astype(np.uint8), 3) > 0)
    rep = {'land': lid, 'case_region_px': int(keep.sum())}
    for cls in ('square', 'portrait', 'wide'):
        p = P(root, 'out', f'land-{lid}-{cls}.png')
        if not os.path.exists(p): continue
        m = load_rgb(p).astype(np.float64)
        if cls == 'square': ref, k = base, keep
        elif cls == 'portrait': x0 = L['portrait_x']; ref, k = base[:, x0:x0 + PORTRAIT_W], keep[:, x0:x0 + PORTRAIT_W]
        else:
            # where the square sits in the wide depends on the pad model of the attempt picked
            pk = P(root, 'work', f'pick-{lid}.json'); att = json.load(open(pk)).get('pad_attempt') if os.path.exists(pk) else None
            hit = [e for e in ledger(root) if e['stage'] == 'pad' and e['land'] == lid and e.get('status') != 'failed' and e.get('note', '').startswith(f'attempt {att}')]
            Lw = outpaint_land(L) if hit and hit[-1]['model'] == 'outpaint' else L
            off = Lw['wide_left'] - Lw['wide_crop']; ref = np.zeros_like(m); k = np.zeros(m.shape[:2], bool)
            ref[:, off:off + SIDE] = base; k[:, off:off + SIDE] = keep
        rep[f'{cls}_case_mad'] = round(float(np.abs(m[k] - ref[k]).mean()), 4)
        rep[f'{cls}_case_max'] = int(np.abs(m[k] - ref[k]).max())
    if 'accessory' in L:
        rgb, a, obj, shadow, nrgb, body = accessory_layers(root, lid, L)
        sel = (body > 0.9) & (obj > 0.99)
        sel = cv2.erode(sel.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        alb = np.median(to_lin(rgb[sel] * 255.0) / np.maximum(to_lin(nrgb[sel] * 255.0), 1e-6), axis=0)
        alb_srgb = u8(to_srgb(alb)).astype(np.float64)
        s = shade(L['accessory']['shade']); want = hex_rgb(s['hex'])
        sq = load_rgb(P(root, 'out', f'land-{lid}-square.png')) if os.path.exists(P(root, 'out', f'land-{lid}-square.png')) else load_rgb(P(root, 'work', f'comp-{lid}.png'))
        comp_med = np.median(sq[sel].astype(np.float64), axis=0)
        white = np.array(L['white'], np.float64)
        under_white = u8(to_srgb(to_lin(comp_med) / to_lin(white))).astype(np.float64)
        rep['colour'] = {'shade': s['id'], 'name': s['name'], 'hex': s['hex'], 'finish': L['accessory']['finish'], 'body_px': int(sel.sum()),
                         'albedo_under_neutral_patch': '#%02x%02x%02x' % tuple(int(v) for v in alb_srgb), 'dE2000_albedo': round(de2000(alb_srgb, want), 2),
                         'composite_median_srgb': [round(v, 1) for v in comp_med], 'composite_over_photo_white': '#%02x%02x%02x' % tuple(int(v) for v in under_white),
                         'dE2000_composite_over_white': round(de2000(under_white, want), 2)}
    json.dump(rep, open(P(root, 'work', f'check-{lid}.json'), 'w'), indent=1)
    print(json.dumps(rep))

def st_sheet(root, args):
    rows, H = [], 600
    for lid in ORDER:
        tiles = []
        for cls in ('square', 'portrait', 'wide'):
            p = P(root, 'out', f'land-{lid}-{cls}.png')
            if not os.path.exists(p): tiles.append(Image.new('RGB', ({'square': H, 'portrait': round(H * 1406 / 2500), 'wide': H * 16 // 10}[cls], H), (40, 40, 40))); continue
            im = Image.open(p).convert('RGB'); tiles.append(im.resize((round(im.width * H / im.height), H), Image.LANCZOS))
        rows.append(tiles)
    gap = 16; Wd = max(sum(t.width for t in r) + gap * (len(r) + 1) for r in rows)
    sheet = Image.new('RGB', (Wd, len(rows) * (H + gap + 28) + gap), (24, 26, 28)); d = ImageDraw.Draw(sheet)
    y = gap
    for lid, r in zip(ORDER, rows):
        d.text((gap, y), f"{LANDS[lid]['n']} / 4  {lid}  ({LANDS[lid]['base']})  square, portrait, wide", fill=(235, 235, 230)); y += 24
        x = gap
        for t in r: sheet.paste(t, (x, y)); x += t.width + gap
        y += H + gap
    sheet.save(P(root, 'out', 'sheet.jpg'), quality=88); print('sheet ->', P(root, 'out', 'sheet.jpg'), sheet.size)

def st_sums(root, args):
    dst = os.path.join(REPO, 'assets-src/room/lands'); os.makedirs(dst, exist_ok=True)
    lines = []
    for p in sorted(glob.glob(P(root, 'out', 'land-*.png'))):
        shutil.copyfile(p, os.path.join(dst, os.path.basename(p)))   # the masters beside their sums (gitignored)
        lines.append(f'{sha256(p)}  {os.path.basename(p)}')
    open(os.path.join(dst, 'SHA256SUMS'), 'w').write('\n'.join(lines) + '\n'); print('\n'.join(lines))

def st_ledger(root, args):
    print('| # | stage | land | model | job id | credits | note |\n|---|---|---|---|---|---|---|')
    for i, e in enumerate(ledger(root), 1): print(f"| {i} | {e['stage']} | {e['land']} | `{e['model']}` | `{e['job']}` | {e['credits']} | {e.get('note', '')} |")
    print(f'\ntotal {spent(root)} credits')

STAGES = {'render': st_render, 'composite': st_composite, 'hand': st_hand, 'matte': st_matte, 'bg': st_bg, 'blend': st_blend, 'pick': st_pick,
          'crops': st_crops, 'widen': st_widen, 'pickwide': st_pickwide, 'depth': st_depth, 'check': st_check}
GLOBAL = {'sheet': st_sheet, 'sums': st_sums, 'ledger': st_ledger}

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('stage', choices=list(STAGES) + list(GLOBAL))
    ap.add_argument('--root', required=True)
    ap.add_argument('--land', choices=ORDER, action='append')
    ap.add_argument('--attempt', type=int, default=1)
    ap.add_argument('--hand', type=int, default=1, help='land 4: which hand attempt the matte and bg stages start from')
    ap.add_argument('--cap', type=float, default=100.0, help='credits; a call that would pass it is refused')
    ap.add_argument('--samples', type=int, default=256)
    ap.add_argument('--reuse', action='store_true', help='hand: re-blend the attempt already paid for, with no new call')
    ap.add_argument('--airpods-fbx', default=None)
    ap.add_argument('--pad-model', choices=['outpaint', 'nano'], default='outpaint', help='crops: the wide pad by Higgsfield outpaint (default) or a nano_banana_2_1 masked inpaint')
    a = ap.parse_args()
    root = os.path.abspath(a.root); os.makedirs(P(root, 'work'), exist_ok=True); os.makedirs(P(root, 'out'), exist_ok=True)
    if a.stage in GLOBAL: GLOBAL[a.stage](root, a); sys.exit(0)
    for lid in (a.land or ORDER): STAGES[a.stage](root, lid, LANDS[lid], a)
