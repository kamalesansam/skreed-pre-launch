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
# The second round (Sam's review of 2026-10-20) adds retouch, rebg, square2, wide2, darken, final, lenskin, contrast,
# sheet2 and record: see "the second round" below, before the stage table. The shade ids are read from ROOM_PRODUCTS.
# Every Higgsfield call is costed first ('higgsfield generate cost') and refused when the ledger plus its cost would pass
# --cap; each one lands in work/ledger.jsonl with its job id, model, credits, prompt, seed and inputs (a failed job at 0
# credits). What each step measured and every call made for the first candidates: docs/specs/evidence/
# section-4-world-lands.md. Nothing here encodes into src/assets: Sam approves the pictures first (CHECKLIST F2).
import argparse, glob, hashlib, json, math, os, re, shutil, subprocess, sys, time, urllib.request
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender'
RENDER = os.path.join(REPO, 'scripts/room/render-products.py')
SHADES = os.path.join(REPO, 'docs/data/shades-240.json')
ROOM_TS = os.path.join(REPO, 'src/config/room.ts')   # ROOM_PRODUCTS: each accessory's shade id and finish, typed once there
# the shipped GLBs, read where the site serves them; they move to scripts/room/models in the integration that deletes
# universe.ts (the last reader of their public url)
MODELS = os.path.join(REPO, 'public/models')
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
        # the whole left pad, not its lower part: the first call (masked from 0.42 down) cut the elm's trunk off in a
        # straight line over a lawn; here the trunk ends inside the pad and the park in shade shows beyond it
        'darken_top': 0.0,
        'darken': ("Fill only the masked area at the left: the great elm's trunk ends just inside the right side of the "
                   "masked area, its shaded left edge, and beyond it the Mall in Central Park in the deep shade of the elms: "
                   "dark shaded lawn and the edge of the path, darkest and quietest toward the lower left, soft and out of "
                   "focus like the rest of the background, with nothing in it: no people, no benches, no flowers, no bark "
                   "texture up close. Keep the light, colour and focus of the photograph. Change nothing outside the mask."),
        'pad': ("Extend the photograph to the left and right: the Mall in Central Park, the promenade and the tall elms "
                "continuing, soft and out of focus, warm late-afternoon sun from the right. Continue her hair, sleeve "
                "and the flowers naturally where they meet the edge. The lower left is darker and quieter: the elms' "
                "shade on the paving, with nothing in it."),
    },
    'wallet': {
        'n': 2, 'base': 'blue.png', 'family': 'Blissful Blue',
        'case_poly': [(1055, 555), (1525, 555), (1490, 1540), (1070, 1540)],
        'portrait_x': 587, 'wide_left': 1300, 'wide_crop': 222, 'seed': 41201, 'key_px': 60, 'key_sat': (40, 80, 180), 'paint_pockets': True,
        'accessory': {'which': 'wallet', 'model': 'wallet.a15a8ebb.glb'},
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
        # the whole left pad: the first call, masked from 0.42 down, painted a dark wall under a straight edge across the
        # arches; the arcade itself has to recede into the shade
        'darken_top': 0.0,
        'darken': ("Fill only the masked area at the left: the arcade under Bethesda Terrace continuing to the left, its "
                   "sandstone arches and columns receding into deep shade, the openings dim, the floor dark, darkest and "
                   "quietest toward the lower left, soft and out of focus like the rest of the background, with nothing in "
                   "it: no people, no bright tiles, no daylight at the lower left. Keep the light, colour and focus of the "
                   "photograph. Change nothing outside the mask."),
        'pad': ("Extend the photograph to the left and right: the Bethesda Terrace arcade in Central Park, its arches "
                "and tiles continuing, soft and out of focus, in open shade. Continue her long hair, shoulders and blue "
                "knit sweater naturally where they meet the edge. The lower left is darker and quieter, in shadow."),
    },
    'lenskin': {
        'n': 3, 'base': 'green.png', 'family': 'Go Green',
        'case_poly': [(410, 640), (1430, 582), (1455, 1020), (420, 1125)],   # 30 px inside the top edge, where the old wall's lime fringes it
        'portrait_x': 250, 'wide_left': 1300, 'wide_crop': 222, 'seed': 41301, 'key_px': 30,
        'accessory': {'which': 'lenskin', 'model': 'lenskin.3831acd1.glb'},
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
        # the redo (Sam, 2026-10-20: "the lenskin color combination with the phone case and the lenskin doesnt go well,
        # redo that one" and "the Lenskin's sheen"): the plate in perspective, face-on at cam_d (its outside face still 20
        # px per mm, so the hole homography is unchanged), which turns the view about 9 degrees across it, so the soft
        # park sky it reflects (env, the zenith toward the photo's up, the horizon a little under the mirror direction)
        # runs across it as across a real plate; a strip light close to the mirror direction lays a streak along it, and
        # a 0.3 mm bevel on its cut edges is where the metal's fresnel lights its rim. These lights are in the photo's own
        # axes (the soft key above and in front, as on his face and the phone's top edge), turned into the plate's frame
        # by the homography; 'lights' above are the first candidate's, in the plate's frame
        # (roughness 0.24 here against the universe's 0.38: at a hand's length a metallic matte plate shows a soft streak,
        # which 0.38 spread across the whole plate; three stops of headroom more, so the streak does not clip)
        'cam_d': 0.2, 'rough': 0.24, 'bevel_m': 0.0003, 'exposure_v2': -5.0,
        'env': {'horizon': -0.16, 'strength': 0.55, 'zenith': (1.3, 1.34, 1.42), 'sky': (1.0, 1.02, 1.05),
                'trees': (0.035, 0.05, 0.03), 'lawn': (0.1, 0.15, 0.05), 'nadir': (0.06, 0.09, 0.035)},
        'lights_photo': [{'dir': (0.1, -0.55, -0.83), 'dist': 1.0, 'size': 1.2, 'watts': 45}, {'dir': (0.0, 0.45, -0.9), 'dist': 1.6, 'size': 1.6, 'watts': 12},
                         {'dir': (0.14, -0.04, -0.99), 'dist': 0.25, 'shape': 'RECTANGLE', 'size': 0.4, 'size_y': 0.006, 'roll': 18.0, 'watts': 0.7}],
        # the lenses', flash's, microphone's and LiDAR's bezels in the photo (centre x, y and outer radius, px; fitted on
        # a 3x zoom): they stand through the plate's holes, so the photo's own pixels stay on top inside them, and the
        # plate takes a 5 px contact shade round each
        'bezels': [(1232, 677, 52), (1360, 655, 52), (1302, 785, 52), (1365, 947, 20), (1307, 955, 7), (1247, 967, 24)],
        # the old lime wall's faint line along the case's top edge and its wedge between the case's right edge and his
        # finger (the check of 2026-10-20): found by hue within 16 px of the person's outline in this box, and filled
        # from the pixels round it (a local clone, no generator)
        'retouch': {'box': (850, 480, 1500, 700), 'hue': (25, 58), 'sat': 45, 'val': 60, 'g_over': 18, 'band_px': 16},
        # his white T-shirt fills the portrait's foot (the check: every 1406-wide window holds it), so this portrait takes
        # a deeper burn with a stronger shoulder, as the shade of a tree out of the picture; still short of 4.5:1 at its
        # lightest (for Sam: it needs a new composition to do better)
        'burn': {'portrait': {'max': 2.6, 'hl': 1.4, 'rv': 0.7}},
        'bg': ("Replace only the background with Sheep Meadow in Central Park, New York, under a soft overcast sky: the "
               "wide green lawn behind him, a line of trees at its far edge and the Midtown skyline rising beyond, "
               "softly out of focus as with a portrait lens at f/2, cool even light. Photorealistic, natural colour. "
               "Keep the man, his face, his hands, his watch, his clothes, the phone, the green case and the red plate "
               "on its camera exactly as they are."),
        'darken': ("Fill only the masked lower left with Sheep Meadow's lawn in the shade of a large tree just outside the "
                   "picture: dark, quiet, even grass, much darker than the open lawn, soft and out of focus like the rest of the "
                   "background, with nothing in it: no people, no paths, no bright patches. Keep the light, colour and focus of "
                   "the photograph. Change nothing outside the mask."),
        'pad': ("Extend the photograph to the left and right: Sheep Meadow in Central Park under an overcast sky, the "
                "lawn, the trees and the skyline continuing, soft and out of focus. Continue his grey jacket, white "
                "T-shirt and arms naturally where they meet the edge. The lower left is darker and quieter, in shadow."),
    },
    'airpods': {
        'n': 4, 'base': 'violet.png', 'family': 'Vivid Violet',
        'case_poly': [(500, 720), (820, 690), (1000, 1480), (980, 1540), (600, 1540), (520, 1100)],
        'portrait_x': 360, 'wide_left': 1300, 'wide_crop': 222, 'seed': 41401, 'key_px': 30,
        'accessory': {'which': 'airpods-ref', 'model': None},
        # her free hand is out of the frame (her left arm hangs at the right edge), so the case is posed at her chest,
        # its top 28 degrees toward the camera so the earbuds read; 4.1 px per mm, between her face's scale (about 3.7,
        # a face 140 mm across over 516 px) and the phone's (about 4.9, held nearer the camera). The second pose (Sam,
        # 2026-10-20: "fix the AirPods placement"; the first was (1725, 1470), yaw 20, portrait_x 450, and cut the case in
        # half at 390 x 844): at her sternum, higher and nearer the middle, so with the portrait from x 360 the phone's
        # cover-fit window (x 486 to 1641 of the square) holds the whole case with about 60 px to spare and the violet
        # phone's left edge (x 490), and the case's bottom sits inside the upper 60 percent (y 1500)
        'pose': {'px': (1470, 1360), 'mm_per_px': 1 / 4.1, 'yaw': 14.0, 'pitch': 28.0},
        # what the hand pass may paint: a band from under the case down to the frame's foot, where her left forearm
        # rises from below the frame (the elbow under it); no room beside the case, because the first pose's attempt 1
        # with a wider zone drew a second, generated case in the hand (rejected; evidence doc). The case is cut out of it
        'hand_zone': [(1335, 1420), (1635, 1420), (1805, 1690), (2240, 2500), (1620, 2500), (1355, 1790)],
        'white': (232, 229, 223),   # the wall, lit by the window at the left
        # the window at the picture's left as a window, not a disc, so the clearcoat shows its reflection as the gloss
        # finish should (the first render's 1.2 m disc spread it to nothing); the open shade's sky above for the rest
        'lights': [{'dir': (-0.8, -0.25, -0.55), 'dist': 1.2, 'shape': 'RECTANGLE', 'size': 0.28, 'size_y': 0.8, 'watts': 60},
                   {'dir': (0.5, 0.0, -0.85), 'dist': 2.0, 'size': 2.0, 'watts': 20}],
        'world': 0.35,
        'env': {'up': (0.0, -1.0, 0.0), 'horizon': -0.05, 'strength': 0.42, 'zenith': (1.0, 1.04, 1.1), 'sky': (0.85, 0.88, 0.9),
                'trees': (0.07, 0.1, 0.06), 'lawn': (0.12, 0.15, 0.09), 'nadir': (0.08, 0.1, 0.06)},
        # the gloss reads about 3.5 dE darker than the hex under its clearcoat; 1.07 brings the body to it
        'grade': 1.07,
        # where it rests on her fingers (Sam: "and shadow"): on her generated hand, the window's short cast shadow down
        # and right of the case (offset, blur px, strength) and the contact's occlusion (ao); on her top behind it, the
        # same light's softer drop shadow farther off (the case is held a few centimetres in front of her) and 'rest'
        # of the occlusion
        'contact': {'offset': (10, 14), 'blur': 6.0, 'strength': 0.55, 'ao_blur': 3.0, 'ao': 0.5, 'rest': 0.4,
                    'drop_offset': (36, 44), 'drop_blur': 22.0, 'drop': 0.3},
        'hand': ("Her left hand rises from below the picture and holds the small open sage green earbuds case that is "
                 "already in the picture from underneath: the case sits on her fingers and palm, her thumb against its "
                 "side. Her forearm in the same black leather jacket sleeve, the same skin tone and soft window light as "
                 "her right hand, a natural relaxed hand with five fingers. Photorealistic. Draw only her hand and "
                 "sleeve: do not draw any other case, earbuds, phone or object, and do not change the case already there."),
        'bg': ("Replace only the background with Bow Bridge over the Lake in Central Park, New York, behind her: the "
               "cast-iron bridge's low graceful arch over calm water, trees along the bank, in soft open shade, the "
               "background softly out of focus as with a portrait lens at f/2. Photorealistic, natural colour. Keep "
               "the woman, her face, hair, hands, jacket, the phone, the violet case and the green earbuds case exactly "
               "as they are."),
        'darken': ("Fill only the masked lower left with the Lake's dark, still water in the shade of the trees on its bank, "
                   "much darker and quieter than the rest, soft and out of focus like the rest of the background, with nothing "
                   "in it: no railing, no balustrade, no stone, no reflections of the sky. Keep the light, colour and focus of "
                   "the photograph. Change nothing outside the mask."),
        'pad': ("Extend the photograph to the left and right: Bow Bridge and the Lake in Central Park, the water and "
                "the trees continuing, soft and out of focus, in open shade. Continue her hair and black leather jacket "
                "naturally where they meet the edge. The lower left is darker and quieter, in shadow."),
    },
}
ORDER = ['case', 'wallet', 'lenskin', 'airpods']

# The Lenskin's candidate shades for Sam to choose from (the redo; he picks, nothing here does), by id, against the Go
# Green case as photographed: #103f32 at its median, a deep blue-green (hue about 163 degrees, L* about 23). Crimson,
# the first candidate, sits almost opposite on the wheel at full chroma, so the two fight; the four keep their contrast
# in value or in warmth instead, each in metallic matte. Option 0 is the first candidate, kept for comparison.
LENSKIN_OPTIONS = [
    ('roaring-red-07', 'the first candidate, kept for comparison: near the case\'s complement at full chroma'),
    ('frosty-white-10', 'a light neutral: Porcelain, a cool near-white that reads as brushed aluminium; the most contrast in value and none in hue, its faint green cast the case\'s own'),
    ('mellow-yellow-24', 'a warm metal: Dijon, a muted gold about a third of the wheel from the case (a triad, not a complement), the racing green and gold of the classic pairing'),
    ('go-green-09', 'a lighter green: Sage, from the case\'s own family, greyed and far lighter: an analogous, tone-on-tone pairing (and the AirPods case\'s shade in land 4)'),
    ('stormy-grey-23', 'a dark neutral: Graphite, gunmetal; a green darker than the case would vanish on it, so the dark option is a neutral, the quietest of the four'),
]

def room_products():
    """ROOM_PRODUCTS' shade id, hex and finish per product, read from src/config/room.ts, so the shade a land renders is
    the one the site names (spec 3: "The shade rendered is the shade named"); each hex is checked against shades-240"""
    src = open(ROOM_TS).read()
    i = src.index('export const ROOM_PRODUCTS'); j = src.index(']);', i)
    out = {m.group(1): {'shade': m.group(2), 'hex': m.group(3).lower(), 'finish': m.group(4)}
           for m in re.finditer(r"\{ id: '([a-z]+)',.*?shade: '([a-z0-9-]+)', hex: '(#[0-9a-fA-F]{6})', finish: '([a-z]+)'", src[i:j])}
    if sorted(out) != sorted(ORDER): raise SystemExit(f'ROOM_PRODUCTS in {ROOM_TS}: ids {sorted(out)}, want {sorted(ORDER)}')
    return out

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
def bind_products():
    """each land's accessory takes its shade and finish from ROOM_PRODUCTS (never typed here), the hex checked by id"""
    for lid, rp in room_products().items():
        if shade(rp['shade'])['hex'].lower() != rp['hex']: raise SystemExit(f"{lid}: room.ts has {rp['shade']} as {rp['hex']}, shades-240 as {shade(rp['shade'])['hex']}")
        if 'accessory' in LANDS[lid]: LANDS[lid]['accessory'].update(shade=rp['shade'], finish=rp['finish'])
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
def json_tail(out, what):
    """the CLI's JSON after any progress lines; a run that printed none is refused by name, not by an empty min()"""
    try: return json.loads(out)
    except json.JSONDecodeError: pass
    ks = [k for k in (out.find('['), out.find('{')) if k >= 0]
    if not ks: raise SystemExit(f'{what}: no JSON in the output: {out[:400]!r}')
    return json.loads(out[min(ks):])

def hf(argv):
    p = subprocess.run(['higgsfield'] + argv + ['--json'], capture_output=True, text=True)
    if p.returncode != 0: raise SystemExit(f'higgsfield {" ".join(argv[:3])} failed ({p.returncode}): {p.stderr.strip() or p.stdout.strip()}')
    return json_tail(p.stdout.strip(), f'higgsfield {" ".join(argv[:3])}')

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
            f.write(json.dumps({'at': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'round': ROUND, 'stage': stage, 'land': land, 'model': model, 'job': jid, 'credits': 0, 'status': 'failed',
                                'params': {k: v for k, v in params.items() if k != 'mask'}, 'media': dict(media), 'mask': params.get('mask'), 'note': f'{note}; failed: {msg}'}) + '\n')
        raise SystemExit(f'{model} failed: {msg}')
    res = json_tail(p.stdout.strip(), f'{model} create')
    job = res[0] if isinstance(res, list) else res
    url = job.get('result_url') or (job.get('results') or [{}])[0].get('url')
    if job.get('status') != 'completed' or not url: raise SystemExit(f'{model} job {job.get("id")} ended {job.get("status")}: {json.dumps(job)[:600]}')
    ext = os.path.splitext(url.split('?')[0])[1] or '.bin'
    local = P(root, 'work', f'{stage}-{land}-{job["id"][:8]}{ext}')
    urllib.request.urlretrieve(url, local)
    entry = {'at': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'round': ROUND, 'stage': stage, 'land': land, 'model': model, 'job': job['id'], 'credits': cost,
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

PLATE_W, PLATE_H, PLATE_PX_MM = 1440, 880, 20.0   # the Lenskin's face-on render: its outside face at 20 px per mm

def plate_map(L):
    """the Lenskin render's pixels into the photo's: the hole homography (plate mm to photo px, least squares on the six
    holes) after the render's own px to plate mm; and its Jacobian at the plate's centre, which turns a direction in
    the photo into the render's frame"""
    Hm, _ = cv2.findHomography(np.array(L['holes_mm'], np.float64), np.array(L['holes_px'], np.float64), 0)
    A = np.array([[1 / PLATE_PX_MM, 0, -PLATE_W / (2 * PLATE_PX_MM)], [0, -1 / PLATE_PX_MM, 19.5 + PLATE_H / (2 * PLATE_PX_MM)], [0, 0, 1]])
    T = Hm @ A
    def f(p): v = T @ np.array([p[0], p[1], 1.0]); return v[:2] / v[2]
    c = np.array([PLATE_W / 2, PLATE_H / 2])
    J = np.stack([(f(c + [1, 0]) - f(c - [1, 0])) / 2, (f(c + [0, 1]) - f(c - [0, 1])) / 2], axis=1)
    return Hm, A, T, J

def photo_to_plate(J, d):
    """a direction in the photo's camera axes into the Lenskin render's: the in-plane part through the inverse
    Jacobian (the photo's up is the render's left: the phone is held on its side), kept at its length; depth as is"""
    d = np.asarray(d, np.float64); xy = d[:2]
    r = np.linalg.solve(J, xy) if np.linalg.norm(xy) > 1e-9 else xy
    if np.linalg.norm(r) > 1e-9: r = r / np.linalg.norm(r) * np.linalg.norm(xy)
    return [float(r[0]), float(r[1]), float(d[2])]

def spec_for(root, lid, L, args, shade_id=None, stem=None):
    A = L['accessory']; sid = shade_id or A['shade']
    S = {'which': A['which'], 'shades': SHADES, 'shade': sid, 'finish': A['finish'],
         'out': P(root, 'work', f'{stem or "acc-" + lid}.png'), 'samples': args.samples,
         # three stops down, so neither pass clips at 1 in the 16-bit PNG (the gain undoes it)
         'exposure': L.get('exposure', -3.0),
         'lights': [dict(l, rgb=(1, 1, 1)) for l in L['lights']], 'world': {'rgb': (1, 1, 1), 'strength': L['world']}}
    for k in ('rough', 'bevel_m'):
        if k in L and A['which'] == 'lenskin': S[k] = L[k]
    if L.get('env') and A['which'] != 'lenskin': S['env'] = dict(L['env'])
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
        # face-on at 20 px per mm, the plate as seen from outside with the phone upright; lands.py then places it by the
        # hole homography (composite). The plate's +y face is the outside (its holes then fall where the 17 Pro Max's
        # lenses are, seen from behind): x -> -x, z -> -y, y -> -z. In perspective at cam_d (the redo), with f set so the
        # outside face, 1.2 mm in front of the plate's middle, is at 20 px per mm
        d = L['cam_d']
        mdl = np.eye(4); mdl[:3, :3] = np.array([[-1, 0, 0], [0, 0, -1], [0, -1, 0]], np.float64); mdl[:3, 3] = (0.0, 0.0195, d + 0.0012)
        cat = np.eye(4); cat[:3, 3] = (0.0, 0.0, d + 0.0025)   # the plateau under the plate
        _, _, _, J = plate_map(L)
        S['exposure'] = L['exposure_v2']
        S.update({'width': PLATE_W, 'height': PLATE_H, 'camera': {'type': 'persp', 'f_px': PLATE_PX_MM * 1000.0 * d, 'cx': PLATE_W / 2, 'cy': PLATE_H / 2},
                  'object': mdl.tolist(), 'catcher': {'matrix': cat.tolist(), 'size': [0.09, 0.06]},
                  'lights': [dict(l, dir=photo_to_plate(J, l['dir']), rgb=(1, 1, 1)) for l in L['lights_photo']],
                  'env': dict(L['env'], up=photo_to_plate(J, (0.0, -1.0, 0.0)))})
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
def render_one(root, lid, L, args, shade_id=None, stem=None):
    S = spec_for(root, lid, L, args, shade_id, stem)
    sp = S['out'][:-4] + '.json'; json.dump({k: v for k, v in S.items() if not k.startswith('_')}, open(sp, 'w'), indent=1)
    if '_pose' in S: json.dump(S['_pose'], open(S['out'][:-4] + '-pose.json', 'w'), indent=1); print(lid, 'pose', S['_pose'])
    t0 = time.time()
    p = subprocess.run([BLENDER, '-b', '--factory-startup', '--python', RENDER, '--', sp], capture_output=True, text=True)
    if 'DONE' not in p.stdout: raise SystemExit(f'render {lid} failed:\n{p.stdout[-3000:]}\n{p.stderr[-2000:]}')
    print(f'{lid}: rendered in {time.time() - t0:.0f} s ->', S['out'], [l for l in p.stdout.splitlines() if l.startswith('shade')])

def st_render(root, lid, L, args):
    if 'accessory' not in L: print(f'{lid}: no accessory'); return
    if lid == 'lenskin':
        # the redo's candidate shades (option 0's own render, acc-lenskin.png in the plate's frame, stays as it was)
        for k, (sid, _) in enumerate(LENSKIN_OPTIONS):
            if k and (not args.option or k in args.option): render_one(root, lid, L, args, sid, f'acc-lenskin-{sid}')
        return
    render_one(root, lid, L, args)

def accessory_layers(root, lid, L, stem=None):
    """the render in the base's frame: straight sRGB, the object's coverage, the contact shadow's coverage, and the
    neutral pass and body mask (for the gain and the colour check), all 2500 x 2500"""
    stem = stem or f'acc-{lid}'
    rgb, a = load_rgba16(P(root, 'work', f'{stem}.png'))
    nrgb, _ = load_rgba16(P(root, 'work', f'{stem}-neutral.png'))
    mrgb, ma = load_rgba16(P(root, 'work', f'{stem}-mask.png'))
    if L['accessory']['which'] == 'lenskin':
        Hm, _, T, _ = plate_map(L)   # render px -> plate mm -> photo px
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
    C = L.get('contact')
    if not C: blin = blin * (1 - lay['shadow'][..., None])   # the contact shadow onto the new palm
    if C:
        # the catcher is a plane at the case's base: its shadow is right only where her fingers meet that plane, so it is
        # kept within about 12 px of the case (far off, it fell on a plane her chest is not on, as a pale box)
        d_obj = cv2.distanceTransform((lay['obj'] < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
        blin = blin * (1 - (lay['shadow'] * np.exp(-d_obj / 12.0) * (zs + C['rest'] * (1 - zs)))[..., None])
        # where it rests on her fingers: the window's short cast shadow (the case's coverage moved down and right and
        # softened) and the occlusion right at the contact, at full strength on the generated hand and at 'rest' of it
        # on her top and jacket; never on the case
        o = lay['obj'].astype(np.float32)
        shift = lambda off, bl: cv2.GaussianBlur(cv2.warpAffine(o, np.float32([[1, 0, off[0]], [0, 1, off[1]]]), (SIDE, SIDE)), (0, 0), bl)
        ao = cv2.GaussianBlur(o, (0, 0), C['ao_blur'])
        on_hand = np.clip(C['strength'] * shift(C['offset'], C['blur']) + C['ao'] * ao, 0, 0.85) * zs
        on_top = np.clip(C['drop'] * shift(C['drop_offset'], C['drop_blur']) + C['rest'] * C['ao'] * ao, 0, 0.85) * (1 - zs)
        sh2 = (on_hand + on_top) * (1 - lay['obj'])
        blin = blin * (1 - sh2[..., None])
        Image.fromarray(u8(np.clip(sh2, 0, 1))).save(P(root, 'work', f'hand-{lid}-{args.attempt}-contact.png'))
    Image.fromarray(took.astype(np.uint8) * 255).save(P(root, 'work', f'hand-{lid}-{args.attempt}-took.png'))
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

def blend(root, lid, L, args, src, gen, A, hard, raw, out_name=None):
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
    name = out_name or f'bg-{lid}-{args.attempt}.png'
    save_rgb(u8(to_srgb(out)), P(root, 'work', name))
    print(f'{lid}: bg attempt {args.attempt} -> work/{name}')

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
            # where the square sits in the wide: recorded by final (this round), else from the pad model of the attempt
            # picked; a wide with neither on record is refused, never checked at a guessed offset
            pk = P(root, 'work', f'pick-{lid}.json'); pd = json.load(open(pk)) if os.path.exists(pk) else {}
            if 'wide_square_x' in pd: off = pd['wide_square_x']
            else:
                att = pd.get('pad_attempt')
                if att is None: raise SystemExit(f'{lid}: the wide has no pad attempt on record (run pickwide first)')
                hit = [e for e in ledger(root) if e['stage'] == 'pad' and e['land'] == lid and e.get('status') != 'failed' and e.get('note', '').startswith(f'attempt {att}')]
                if not hit: raise SystemExit(f'{lid}: pad attempt {att} is not on the ledger')
                Lw = outpaint_land(L) if hit[-1]['model'] == 'outpaint' else L
                off = Lw['wide_left'] - Lw['wide_crop']
            ref = np.zeros_like(m); k = np.zeros(m.shape[:2], bool)
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
    """the masters copied beside their sums in assets-src/room/lands/ (gitignored), with the Lenskin's candidates in
    lenskin-options/ and the first round's masters in v1/ (copied there before this round began); the run's work/ and
    out/ are copied whole beside them, so the ledger, the masks and the generator outputs outlive the scratch folder"""
    dst = os.path.join(REPO, 'assets-src/room/lands'); os.makedirs(dst, exist_ok=True)
    for p in sorted(glob.glob(P(root, 'out', 'land-*.png'))): shutil.copyfile(p, os.path.join(dst, os.path.basename(p)))
    if os.path.isdir(P(root, 'out', 'lenskin-options')): shutil.copytree(P(root, 'out', 'lenskin-options'), os.path.join(dst, 'lenskin-options'), dirs_exist_ok=True)
    for d in ('work', 'out'): shutil.copytree(P(root, d), os.path.join(dst, d), dirs_exist_ok=True)
    files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(dst, 'land-*.png')))
    files += sorted('lenskin-options/' + os.path.basename(p) for p in glob.glob(os.path.join(dst, 'lenskin-options', 'land-*.png')))
    files += sorted('v1/' + os.path.basename(p) for p in glob.glob(os.path.join(dst, 'v1', 'land-*.png')))
    lines = [f'{sha256(os.path.join(dst, f))}  {f}' for f in files]
    open(os.path.join(dst, 'SHA256SUMS'), 'w').write('\n'.join(lines) + '\n'); print('\n'.join(lines))

def st_ledger(root, args):
    print('| # | stage | land | model | job id | credits | note |\n|---|---|---|---|---|---|---|')
    for i, e in enumerate(ledger(root), 1): print(f"| {i} | {e['stage']} | {e['land']} | `{e['model']}` | `{e['job']}` | {e['credits']} | {e.get('note', '')} |")
    print(f'\ntotal {spent(root)} credits')

# ----------------------------------------------------------------------------------------- the second round (v2)
# Sam's review of the first sheet (2026-10-20): "the lenskin color combination with the phone case and the lenskin
# doesnt go well, redo that one. fix the AirPods placement and shadow, the Lenskin's sheen, and darken the text areas".
# The approved backgrounds and pads stay (their calls are reused, never paid again). After render, composite and hand
# for land 4's second pose:
#   retouch   land 3: the old lime wall's line along the case's top edge, filled from the pixels round it (no credits)
#   rebg      land 4: the second pose's hand composite over the first round's background (bg attempt 1), the first
#             round's matte with the new hand added to it, so Bow Bridge stays as Sam saw it
#   square2   out/land-<id>-square.png for this round: lands 1 and 2 as approved, 3 retouched, 4 from rebg
#   wide2     the 16:9 from the first round's registered outpaint with this round's square put back (its seams as were)
#   darken    the lower-left pad refilled by a masked nano_banana_2_1 inpaint, with a prompt for a darker, quieter lower
#             left (spec 3, "The crops"); 2 credits
#   final     the portrait and the wide, each with a soft burn of its lower left (a shadow, local): as strong as Pearl
#             Whisper's 4.5:1 over the text area needs, never past the land's 'max' stops
#   lenskin   the candidate shades, each composited onto land 3's square and cut and burnt as its crops, and the sheet
#             out/lenskin-options.jpg for Sam to choose from (nothing here picks)
#   contrast  Pearl Whisper over each crop's text area by scripts/quiz/contrast.mjs's method, this round and the first
#   sheet2    out/sheet-v2.jpg; record  src/data/room-lands.json and its ledger, from the ledger and the picks
ROUND = 2
PEARL = (0xF7, 0xF6, 0xF3)
# where a land's text sits (spec 2: bottom left at the inset, at the quiz's sizes; on a phone the catalog line runs most
# of the 358 px column): fractions of the frame as shown, x0, x1, y0, y1; the portrait as a 390 x 844 cover-fit shows it
# (its middle 0.82 of the width), the wide at 1280 x 800 (all of it)
TEXT_AREA = {'portrait': (0.04, 0.92, 0.74, 0.97), 'wide': (0.03, 0.45, 0.68, 0.95)}
PHONE = (390, 844)
# the burn: a raised cosine over an ellipse from the frame's lower-left corner (ru, rv: its reach as fractions of the
# width shown and of the height), 'max' stops at the corner at most, and 'hl' a softer shoulder that holds the brightest
# things down a little more (his white T-shirt), so it reads as shade falling across the corner, not a box
# Every crop takes at least 'min' (Sam: "darken the text areas"), more until the text area's median reaches 4.5:1 and
# its lightest 5 percent 3:1, and never more than 'max'
BURN = {'portrait': {'ru': 1.5, 'rv': 0.62, 'min': 0.6, 'max': 1.6, 'hl': 0.6}, 'wide': {'ru': 0.8, 'rv': 0.65, 'min': 0.5, 'max': 1.4, 'hl': 0.6}}
DARKEN_TOP = 0.42       # the pad's refill starts this far down the frame; above it the outpaint's pad stays
SQ_X = (WIDE16x9 - SIDE) // 2   # the square in the 16:9 (outpaint centres it), and the 16:10 is cut from the 16:9's left

def pick(root, lid):
    pk = P(root, 'work', f'pick-{lid}.json')
    return json.load(open(pk)) if os.path.exists(pk) else {}

def set_pick(root, lid, **kw):
    d = pick(root, lid); d.update(kw); json.dump(d, open(P(root, 'work', f'pick-{lid}.json'), 'w'), indent=1)

def paid(root, stage, land, attempt):
    hits = [e for e in ledger(root) if e['stage'] == stage and e['land'] == land and e.get('status') != 'failed' and e.get('note', '').startswith(f'attempt {attempt}')]
    if not hits: raise SystemExit(f'no paid {stage} attempt {attempt} for {land}')
    return hits[-1]

def visible_x(w, h):
    """the columns of a portrait a 390 x 844 cover-fit shows"""
    keep = min(1.0, (PHONE[0] / PHONE[1]) / (w / h)); return (1 - keep) / 2 * w, (1 + keep) / 2 * w

def text_box(shape, cls):
    h, w = shape[:2]; fx0, fx1, fy0, fy1 = TEXT_AREA[cls]
    x0, x1 = visible_x(w, h) if cls == 'portrait' else (0.0, float(w))
    return int(x0 + fx0 * (x1 - x0)), int(x0 + fx1 * (x1 - x0)), int(fy0 * h), int(fy1 * h)

def wcag_y(u8img): return to_lin(u8img) @ np.array([0.2126, 0.7152, 0.0722])

def pearl_contrast(img, cls):
    """scripts/quiz/contrast.mjs's method: the WCAG luminance of every pixel under the text, sorted, its median and its
    lightest 5 percent (the value at 95 percent), and Pearl Whisper's ratio against each"""
    x0, x1, y0, y1 = text_box(img.shape, cls)
    ls = np.sort(wcag_y(img[y0:y1, x0:x1]).ravel()); n = len(ls)
    yp = float(wcag_y(np.array([PEARL], np.uint8))[0])
    r = lambda l: (yp + 0.05) / (l + 0.05)
    return round(r(ls[n // 2]), 2), round(r(ls[int(n * 0.95)]), 2)

def product_mask(root, lid, L):
    """the phone in its case and the accessory, in the square: what no burn may touch (dilated and feathered 24 px)"""
    mp = P(root, 'work', f'matte-{lid}.png')
    raw = np.asarray(Image.open(mp).convert('L')).astype(np.float64) / 255.0
    m = case_region(L, raw)
    ap = P(root, 'work', f'accalpha-{lid}.png')
    if 'accessory' in L and os.path.exists(ap): m = np.maximum(m, np.asarray(Image.open(ap).convert('L')).astype(np.float64) / 255.0)
    return np.clip(feather((dilate((m > 0.05).astype(np.uint8), 24) > 0).astype(np.float64), 24) * 1.5, 0, 1)

def burn_weight(shape, cls, B):
    h, w = shape[:2]
    x0, x1 = visible_x(w, h) if cls == 'portrait' else (0.0, float(w))
    u = (np.arange(w) - x0) / (x1 - x0); v = 1 - (np.arange(h) + 0.5) / h
    d = np.sqrt((np.clip(u, 0, None)[None, :] / B['ru']) ** 2 + (v[:, None] / B['rv']) ** 2)
    return 0.5 * (1 + np.cos(np.pi * np.clip(d, 0, 1)))

def apply_burn(img, wgt, stops, hl):
    lin = to_lin(img) * (2.0 ** (-stops * wgt))[..., None]
    lin = lin / (1 + hl * wgt[..., None] * lin)   # the shoulder: the brightest things held down most
    return u8(to_srgb(lin))

def tune_burn(img, wgt, cls, B):
    """the least burn from B['min'] (in 0.05 stop steps) that brings the text area's median to 4.5:1 and its lightest
    5 percent to 3:1, or B['max'] if none does"""
    x0, x1, y0, y1 = text_box(img.shape, cls)
    sub, ws = img[y0:y1, x0:x1], wgt[y0:y1, x0:x1]
    for s in np.arange(B['min'], B['max'] + 1e-6, 0.05):
        med, hi = _ratios(apply_burn(sub, ws, s, B['hl']))
        if med >= 4.5 and hi >= 3.0: return round(float(s), 2)
    return B['max']

def _ratios(sub):
    ls = np.sort(wcag_y(sub).ravel()); yp = float(wcag_y(np.array([PEARL], np.uint8))[0])
    return (yp + 0.05) / (ls[len(ls) // 2] + 0.05), (yp + 0.05) / (ls[int(len(ls) * 0.95)] + 0.05)

def st_retouch(root, lid, L, args):
    """land 3: the lime line, found by hue next to the person's outline inside the box, and filled from round it"""
    R = L.get('retouch')
    if not R: print(f'{lid}: nothing to retouch'); return
    sq = load_rgb(P(root, 'out', f'land-{lid}-square.png')) if not os.path.exists(P(root, 'work', f'square1-{lid}.png')) else load_rgb(P(root, 'work', f'square1-{lid}.png'))
    if not os.path.exists(P(root, 'work', f'square1-{lid}.png')): save_rgb(sq, P(root, 'work', f'square1-{lid}.png'))   # the first round's, kept
    mat = np.asarray(Image.open(P(root, 'work', f'matte-{lid}.png')).convert('L'))
    hsv = cv2.cvtColor(sq, cv2.COLOR_RGB2HSV).astype(int); r, g, b = [sq[..., i].astype(int) for i in range(3)]
    person = (mat > 127).astype(np.uint8)
    edge = cv2.morphologyEx(person, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    near = cv2.distanceTransform((~edge).astype(np.uint8), cv2.DIST_L2, 5) < R['band_px']
    x0, y0, x1, y1 = R['box']; box = np.zeros(sq.shape[:2], bool); box[y0:y1, x0:x1] = True
    lime = (hsv[..., 0] >= R['hue'][0]) & (hsv[..., 0] <= R['hue'][1]) & (hsv[..., 1] > R['sat']) & (hsv[..., 2] > R['val']) & (g - (r + b) // 2 > R['g_over'])
    m = lime & box & near
    m = dilate(m.astype(np.uint8), 1) > 0
    # a thin line is filled from both sides (Telea, 4 px), so it becomes the edge it should have been; a wedge taller
    # than 'clone_px' (the wall between the case's right edge and his finger) is the background, cloned up from the
    # rows just under it, so it reads as the place showing through and not a smudge of case and skin
    out = cv2.cvtColor(cv2.inpaint(cv2.cvtColor(sq, cv2.COLOR_RGB2BGR), m.astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    for k in range(1, n):
        if st[k, 3] <= R.get('clone_px', 20): continue
        comp = lab == k; rng = np.random.default_rng(L['seed'])
        for x in np.unique(np.nonzero(comp)[1]):
            ys = np.nonzero(comp[:, x])[0]; yb = ys.max()
            ref = sq[yb + 2:yb + 7, x].astype(np.float64).mean(axis=0)   # the background just under the wedge, carried up
            out[ys, x] = np.clip(ref + rng.normal(0, 1.0, (len(ys), 3)), 0, 255).astype(np.uint8)
        edge = (dilate(comp.astype(np.uint8), 2) > 0) & ~comp
        sm = cv2.GaussianBlur(out, (0, 0), 1.0); out[edge] = sm[edge]
    save_rgb(out, P(root, 'work', f'retouch-{lid}.png')); Image.fromarray(m.astype(np.uint8) * 255).save(P(root, 'work', f'retouch-{lid}-mask.png'))
    print(f'{lid}: retouched {int(m.sum())} px (box {R["box"]}) -> work/retouch-{lid}.png')

def st_rebg(root, lid, L, args):
    """land 4: this round's hand composite blended over the background already paid for (bg attempt 1); the matte is
    the first round's plus this round's hand, so nothing of the background is generated again"""
    if lid != 'airpods': return
    src = load_rgb(stage_input(root, lid, args))
    m1 = np.asarray(Image.open(P(root, 'work', 'v1', 'matte-airpods.png') if os.path.exists(P(root, 'work', 'v1', 'matte-airpods.png')) else P(root, 'work', 'matte-airpods.png')).convert('L'))
    if not os.path.exists(P(root, 'work', 'v1', 'matte-airpods.png')): shutil.copyfile(P(root, 'work', 'matte-airpods.png'), P(root, 'work', 'v1', 'matte-airpods.png'))
    took = np.asarray(Image.open(P(root, 'work', f'hand-{lid}-{args.hand}-took.png')).convert('L'))
    obj = np.asarray(Image.open(P(root, 'work', f'accalpha-{lid}.png')).convert('L'))
    m2 = np.maximum(m1, np.maximum(took, obj))
    Image.fromarray(m2).save(P(root, 'work', f'matte-{lid}.png'))
    A, hard, raw = protect(root, lid, L, src.shape[:2])
    gen = np.asarray(Image.open(P(root, 'work', paid(root, 'bg', lid, 1)['file'])).convert('RGB').resize((SIDE, SIDE), Image.LANCZOS))
    a = argparse.Namespace(**vars(args)); a.attempt = 1
    blend(root, lid, L, a, src, gen, A, hard, raw, out_name=f'bg-{lid}-v2.png')

def st_square2(root, lid, L, args):
    first = P(root, 'work', f'square1-{lid}.png')
    if not os.path.exists(first): shutil.copyfile(P(root, 'out', f'land-{lid}-square.png'), first)   # the first round's
    src = {'lenskin': P(root, 'work', f'retouch-{lid}.png'), 'airpods': P(root, 'work', f'bg-{lid}-v2.png')}.get(lid, first)
    shutil.copyfile(src, P(root, 'out', f'land-{lid}-square.png'))
    set_pick(root, lid, round=ROUND, square_from=os.path.basename(src), hand_attempt=args.hand if lid == 'airpods' else None)
    print(f'{lid}: square <- {os.path.basename(src)}')

def st_wide2(root, lid, L, args):
    att = pick(root, lid).get('pad_attempt')
    if att is None: raise SystemExit(f'{lid}: no pad attempt picked (pickwide)')
    if paid(root, 'pad', lid, att)['model'] != 'outpaint': raise SystemExit(f'{lid}: wide2 expects the outpaint pad')
    w = load_rgb(P(root, 'work', f'wide169-{lid}-{att}.png')).copy()
    sq, sq1 = load_rgb(P(root, 'out', f'land-{lid}-square.png')), load_rgb(P(root, 'work', f'square1-{lid}.png'))
    band = 48
    # the seams were blended against the first round's square: they hold only where the square's edges are unchanged
    # (land 4's new hand leaves 53 px changed in the last 8 rows of its right band, under 0.05 percent: allowed)
    ch = sum(int((np.abs(x.astype(int) - y).max(axis=2) > 2).sum()) for x, y in ((sq[:, :band], sq1[:, :band]), (sq[:, -band:], sq1[:, -band:])))
    if ch > 0.0005 * 2 * band * SIDE: raise SystemExit(f'{lid}: the square changed in {ch} px within {band} px of its edges: the seams need the pad again')
    if ch: print(f'{lid}: {ch} px of the seam bands changed (under 0.05 percent), kept from the first round')
    w[:, SQ_X + band:SQ_X + SIDE - band] = sq[:, band:SIDE - band]
    save_rgb(w, P(root, 'work', f'wide169v2-{lid}.png')); print(f'{lid}: 16:9 with this round\'s square -> work/wide169v2-{lid}.png')

def darken_mask(shape, L):
    m = np.zeros(shape[:2]); m[int(L.get('darken_top', DARKEN_TOP) * shape[0]):, :SQ_X - 24] = 1.0
    return m

def st_darken(root, lid, L, args):
    canvas = load_rgb(P(root, 'work', f'wide169v2-{lid}.png'))
    m = darken_mask(canvas.shape, L)
    local, entry = inpaint(root, args.cap, 'darken', lid, canvas, m, L['darken'], L['seed'] + 30 + args.attempt, '16:9', PAD_SIZE, note=f'attempt {args.attempt}', attempt=args.attempt)
    redarken(root, lid, L, args, canvas, local)

def redarken(root, lid, L, args, canvas, local):
    raw = np.asarray(Image.open(local).convert('RGB'))
    sent = np.asarray(Image.fromarray(canvas).resize(PAD_SIZE, Image.LANCZOS)); sx = PAD_SIZE[0] / WIDE16x9
    rm = np.zeros(sent.shape[:2], np.uint8); rm[:, int((SQ_X + 200) * sx):int((SQ_X + SIDE - 200) * sx)] = 255
    M, inl, n = register(raw, sent, rm)
    if M is None: raise SystemExit(f'{lid}: the darken output does not register ({n} matches)')
    T = (np.diag([1 / sx, 1 / sx, 1.0]) @ np.vstack([M, [0, 0, 1]]))[:2]
    gen = cv2.warpAffine(raw, T, (WIDE16x9, SIDE), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    print(f'{lid}: darken output {raw.shape[1]}x{raw.shape[0]} registered by {int(inl.sum())} of {n} matches, scale {math.hypot(M[0, 0], M[1, 0]):.4f}')
    # what is taken: the mask, its edges drawn 24 px in and feathered over 24, so the seam lies inside what was painted
    m = darken_mask(canvas.shape, L)
    er = cv2.erode(m.astype(np.uint8), np.ones((49, 49), np.uint8), borderType=cv2.BORDER_CONSTANT, borderValue=1)   # the frame's own edges stay
    take = np.clip(cv2.GaussianBlur(er.astype(np.float32), (0, 0), 24, borderType=cv2.BORDER_REPLICATE).astype(np.float64), 0, 1) * m
    out = to_lin(gen) * take[..., None] + to_lin(canvas) * (1 - take[..., None])
    save_rgb(u8(to_srgb(out)), P(root, 'work', f'dark169-{lid}-{args.attempt}.png'))
    print(f'{lid}: darken attempt {args.attempt} -> work/dark169-{lid}-{args.attempt}.png')

def st_redarken(root, lid, L, args):
    """re-make a darkened wide from a darken call already paid for, with no new call"""
    canvas = load_rgb(P(root, 'work', f'wide169v2-{lid}.png'))
    redarken(root, lid, L, args, canvas, P(root, 'work', paid(root, 'darken', lid, args.attempt)['file']))

def finish_crops(root, lid, L, sq, tune=False):
    """the portrait and the wide from a square, with this round's darkened pad and burn: tuned (final, on the master)
    or as the master's (the Lenskin's candidates, so each is burnt alike)"""
    pk = pick(root, lid); burn = None if tune else pk.get('burn')
    if not tune and not burn: raise SystemExit(f'{lid}: no burn on record (run final first)')
    dark = load_rgb(P(root, 'work', f'dark169-{lid}-{pk["darken_attempt"]}.png')).copy()
    band = 48; dark[:, SQ_X + band:SQ_X + SIDE - band] = sq[:, band:SIDE - band]
    x0 = L['portrait_x']; crops = {'portrait': sq[:, x0:x0 + PORTRAIT_W], 'wide': dark[:, :WIDE16x10]}
    pm = product_mask(root, lid, L)
    pms = {'portrait': pm[:, x0:x0 + PORTRAIT_W], 'wide': np.pad(pm, ((0, 0), (SQ_X, WIDE16x9 - SQ_X - SIDE)))[:, :WIDE16x10]}
    out, used = {}, {}
    for cls, img in crops.items():
        B = dict(BURN[cls], **L.get('burn', {}).get(cls, {}))
        wgt = burn_weight(img.shape, cls, B) * (1 - pms[cls])
        s = burn[cls]['stops'] if burn else tune_burn(img, wgt, cls, B)
        out[cls] = apply_burn(img, wgt, s, B['hl']); used[cls] = dict(B, stops=s, product_weight_max=round(float((burn_weight(img.shape, cls, B) * (pms[cls] > 0.5)).max()), 4))
    return out, used

def st_final(root, lid, L, args):
    paid(root, 'darken', lid, args.attempt)   # --attempt names the darken call the wide is made from
    set_pick(root, lid, darken_attempt=args.attempt, wide_square_x=SQ_X)
    sq = load_rgb(P(root, 'out', f'land-{lid}-square.png'))
    out, used = finish_crops(root, lid, L, sq, tune=True)
    for cls, img in out.items(): save_rgb(img, P(root, 'out', f'land-{lid}-{cls}.png'))
    set_pick(root, lid, burn=used, wide_square_x=SQ_X)
    print(f'{lid}: portrait and wide, burn', {k: v['stops'] for k, v in used.items()}, 'contrast', {k: pearl_contrast(v, k) for k, v in out.items()})

def composite_lenskin(root, L, stem, base, grade):
    """a candidate plate over the photo: as the first composite (the gain from the photo's white, the plateau's clip,
    behind his fingers, the photo's softness and grain), and the bezels on top: inside each, the photo's own pixels,
    and round each a 5 px contact shade on the plate"""
    rgb, a, obj, shadow, nrgb, body = accessory_layers(root, 'lenskin', L, stem)
    sel = (body > 0.9) & (obj > 0.99)
    gain = to_lin(np.array(L['white'], np.float64)) / np.maximum(np.median(to_lin(nrgb[sel] * 255.0), axis=0), 1e-6) * grade
    acc_lin = to_lin(rgb * 255.0) * gain
    # a photograph's shoulder on the plate's sheen: above 0.75 of the photo's white, its brightest channel rolls off
    # toward the white instead of clipping (a light metal reflecting the sky would blow out flat), hue kept
    t = (acc_lin / to_lin(np.array(L['white'], np.float64))).max(axis=2)
    t2 = np.where(t <= 0.75, t, 0.75 + 0.25 * (1 - np.exp(-(t - 0.75) / 0.25)))
    acc_lin = acc_lin * (t2 / np.maximum(t, 1e-9))[..., None]
    clip = feather(poly_mask(L['plateau'], obj.shape, inset=L['plateau_inset'], radius=L['plateau_r']), 1.2)
    hsv = cv2.cvtColor(base, cv2.COLOR_RGB2HSV).astype(int)
    skin = ((hsv[..., 0] < 22) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 55) & (hsv[..., 2] > 70)
    skin = feather(dilate(skin.astype(np.uint8), 3).astype(np.float64), 1.5)
    bz = np.zeros(obj.shape, np.uint8)
    for (x, y, r) in L['bezels']: cv2.circle(bz, (x * 4, y * 4), r * 4, 255, -1, lineType=cv2.LINE_AA, shift=2)
    bz = feather(bz.astype(np.float64) / 255.0, 0.7)
    occ = clip * (1 - skin) * (1 - bz)
    d_out = cv2.distanceTransform((bz < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    acc_lin = acc_lin * (1 - 0.4 * np.exp(-d_out / 2.0) * (bz < 0.5))[..., None]
    # where the plate is cut to the plateau (its top, right and bottom), the cut edge keeps the render's rim: a 2.5 px
    # band inside the clip, lit where it faces the photo's up (the sky's fresnel) and shaded where it faces down
    cm = (clip > 0.5).astype(np.uint8)
    d_in = cv2.distanceTransform(cm, cv2.DIST_L2, 5)
    gy = cv2.Sobel(cv2.GaussianBlur(clip.astype(np.float32), (0, 0), 2.0), cv2.CV_32F, 0, 1)
    gx = cv2.Sobel(cv2.GaussianBlur(clip.astype(np.float32), (0, 0), 2.0), cv2.CV_32F, 1, 0)
    up = np.clip((gy / np.maximum(np.hypot(gx, gy), 1e-6) + 1) / 2, 0, 1)   # 1 where the outward normal points up
    band = np.exp(-np.maximum(d_in - 0.5, 0) / 1.2) * (cm > 0)
    acc_lin = acc_lin * (1 + band * (L.get('rim', 0.9) * up - 0.35 * (1 - up)))[..., None]
    so, sh = obj * occ, shadow * occ
    # the plateau left showing inside the plate's clip (the holes' gaps round the smaller bezels, the strip at its left
    # edge) lies under 2.4 mm of metal: it takes the plate's shade ('gap_shade' of its light), not the photo's bare glass
    gap = clip * (1 - skin) * (1 - bz) * (1 - np.clip(feather(obj, 1.0), 0, 1))
    sh = np.maximum(sh, gap * L.get('gap_shade', 0.55))
    soft = L.get('soft', 0.7)
    pre = np.dstack([feather(acc_lin[..., i] * so, soft) for i in range(3)]); so = np.clip(feather(so, soft), 0, 1)
    acc_lin = pre / np.maximum(so, 1e-4)[..., None]
    bf = base.astype(np.float64); hp = bf - cv2.GaussianBlur(bf, (0, 0), 1.5)
    flat = (poly_mask(L['case_poly'], obj.shape, inset=12) > 0.5) & (obj < 0.01)
    std = 1.4826 * np.median(np.abs(hp[flat] - np.median(hp[flat], axis=0)), axis=0)
    acc_lin = to_lin(np.clip(to_srgb(acc_lin) * 255.0 + np.random.default_rng(L['seed']).normal(0.0, 1.0, base.shape) * std, 0, 255))
    out = to_lin(base) * (1 - sh[..., None])
    out = acc_lin * so[..., None] + out * (1 - so[..., None])
    vis = sel & (so > 0.99)
    return u8(to_srgb(out)), vis, gain

def st_lenskin(root, lid, L, args):
    """the candidates: each plate graded so its median over the photo's white is the hex's luminance (the shade rendered
    is the shade named; the sheen runs either side of it), set into the retouched square inside the plateau only, and
    cut and burnt as the masters are; then the sheet for Sam"""
    if lid != 'lenskin': return
    base = load_rgb(P(root, 'src', L['base'])); sq0 = load_rgb(P(root, 'out', f'land-{lid}-square.png'))
    R = dilate((poly_mask(L['plateau'], base.shape[:2]) > 0.5).astype(np.uint8), 3) > 0
    od = P(root, 'out', 'lenskin-options'); os.makedirs(od, exist_ok=True)
    white = to_lin(np.array(L['white'], np.float64)); rep = []
    for k, (sid, why) in enumerate(LENSKIN_OPTIONS):
        if k == 0: sq, grade, vis = sq0, L.get('grade', 1.0), None
        else:
            stem = f'acc-lenskin-{sid}'; want = wcag_y(np.array([hex_rgb(shade(sid)['hex'])], np.uint8))[0]
            grade = 1.0
            for _ in range(3):   # the shoulder moves the median, so the grade is found in a few passes
                comp, vis, _ = composite_lenskin(root, L, stem, base, grade)
                got = float(np.median(wcag_y(comp[vis]) / float(white @ np.array([0.2126, 0.7152, 0.0722]))))
                grade = float(np.clip(grade * want / max(got, 1e-6), 0.5, 2.5))
            comp, vis, _ = composite_lenskin(root, L, stem, base, grade)
            sq = np.where(R[..., None], comp, sq0)
        if vis is None:
            _, _, obj, _, _, body = accessory_layers(root, lid, L); vis = (body > 0.9) & (obj > 0.99)
        med = np.median(sq[vis].astype(np.float64), axis=0)
        over_white = u8(to_srgb(to_lin(med) / white)).astype(np.float64)
        s = shade(sid); de = round(de2000(over_white, hex_rgb(s['hex'])), 2)
        crops, _ = finish_crops(root, lid, L, sq)
        save_rgb(sq, P(od, f'land-lenskin-{k}-square.png'))
        for cls, img in crops.items(): save_rgb(img, P(od, f'land-lenskin-{k}-{cls}.png'))
        rep.append({'option': k, 'shade': sid, 'name': s['name'], 'hex': s['hex'], 'why': why, 'grade': round(grade, 3),
                    'over_photo_white': '#%02x%02x%02x' % tuple(int(v) for v in over_white), 'dE2000': de})
        print(f'lenskin option {k}: {s["name"]} {sid} {s["hex"]}, grade {grade:.3f}, over the white {rep[-1]["over_photo_white"]}, dE {de}')
    json.dump(rep, open(P(root, 'work', 'lenskin-options.json'), 'w'), indent=1)
    lenskin_sheet(root, rep)

def lenskin_sheet(root, rep):
    """five columns, option 0 (the first candidate) to 4: a square around the phone over the full portrait"""
    od = P(root, 'out', 'lenskin-options'); CW, gap = 720, 18
    crop = (335, 250, 1535, 1450)
    cols = []
    for r in rep:
        sq = Image.open(P(od, f'land-lenskin-{r["option"]}-square.png')).convert('RGB').crop(crop).resize((CW, CW), Image.LANCZOS)
        pt = Image.open(P(od, f'land-lenskin-{r["option"]}-portrait.png')).convert('RGB'); pt = pt.resize((CW, round(pt.height * CW / pt.width)), Image.LANCZOS)
        cols.append((r, sq, pt))
    TOP = 120; H = TOP + CW + gap + cols[0][2].height
    f1, f2 = ImageFont.load_default(size=30), ImageFont.load_default(size=22)
    sheet = Image.new('RGB', (gap + len(cols) * (CW + gap), H + 2 * gap), (24, 26, 28)); d = ImageDraw.Draw(sheet)
    for i, (r, sq, pt) in enumerate(cols):
        x = gap + i * (CW + gap)
        role = 'the first candidate, for comparison' if r['option'] == 0 else r['why'].split(':')[0]
        d.text((x, gap), f"{r['option']}  {r['name']}  {r['shade']}  {r['hex']}", fill=(235, 235, 230), font=f1)
        d.text((x, gap + 42), role, fill=(200, 200, 195), font=f2)
        d.text((x, gap + 72), f"metallic matte; over the photo's white {r['over_photo_white']}, dE {r['dE2000']}", fill=(160, 160, 155), font=f2)
        sheet.paste(sq, (x, gap + TOP)); sheet.paste(pt, (x, gap + TOP + CW + gap))
    sheet.save(P(root, 'out', 'lenskin-options.jpg'), quality=90); print('sheet ->', P(root, 'out', 'lenskin-options.jpg'), sheet.size)

def st_contrast(root, args):
    """Pearl Whisper over each crop's text area, this round's masters and the first round's (assets-src/.../v1)"""
    v1 = os.path.join(REPO, 'assets-src/room/lands/v1'); rows = []
    for lid in ORDER:
        for cls in ('portrait', 'wide'):
            row = {'land': lid, 'crop': cls, 'box': text_box((2500, PORTRAIT_W if cls == 'portrait' else WIDE16x10), cls)}
            for tag, d in (('first', v1), ('now', P(root, 'out'))):
                p = os.path.join(d, f'land-{lid}-{cls}.png')
                if os.path.exists(p): row[tag] = pearl_contrast(load_rgb(p), cls)
            row['burn_stops'] = pick(root, lid).get('burn', {}).get(cls, {}).get('stops')
            rows.append(row)
    json.dump(rows, open(P(root, 'work', 'contrast.json'), 'w'), indent=1)
    print('| Land | Crop | First round, median / worst | Now, median / worst | Burn, stops |\n|---|---|---|---|---|')
    for r in rows:
        f = r.get('first', ('-', '-')); n = r.get('now', ('-', '-'))
        print(f"| {LANDS[r['land']]['n']} {r['land']} | {r['crop']} | {f[0]} / {f[1]} | {n[0]} / {n[1]} | {r['burn_stops']} |")

def st_sheet2(root, args):
    """the full sheet of this round: per land the square, the portrait (its phone window marked at the edges) and the
    wide, with Pearl Whisper's contrast over each crop's text area"""
    rows, H = [], 600
    con = {(r['land'], r['crop']): r.get('now') for r in json.load(open(P(root, 'work', 'contrast.json')))} if os.path.exists(P(root, 'work', 'contrast.json')) else {}
    for lid in ORDER:
        tiles = []
        for cls in ('square', 'portrait', 'wide'):
            im = Image.open(P(root, 'out', f'land-{lid}-{cls}.png')).convert('RGB'); t = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
            if cls == 'portrait':
                x0, x1 = visible_x(im.width, im.height); dt = ImageDraw.Draw(t); k = H / im.height
                for xx in (x0 * k, x1 * k): dt.line([(xx, 0), (xx, 12)], fill=(255, 153, 0), width=2); dt.line([(xx, H - 12), (xx, H)], fill=(255, 153, 0), width=2)
            tiles.append(t)
        rows.append(tiles)
    gap = 16; Wd = max(sum(t.width for t in r) + gap * (len(r) + 1) for r in rows)
    sheet = Image.new('RGB', (Wd, len(rows) * (H + gap + 64) + gap), (24, 26, 28)); d = ImageDraw.Draw(sheet); y = gap
    f1, f2 = ImageFont.load_default(size=22), ImageFont.load_default(size=18)
    for lid, r in zip(ORDER, rows):
        L = LANDS[lid]; c = lambda cls: '%s / %s' % tuple(con.get((lid, cls)) or ('-', '-'))
        note = {'case': 'background and pads as approved; the wide pad refilled darker, both crops burnt',
                'wallet': 'as approved; the wide pad refilled darker, both crops burnt',
                'lenskin': 'pending: the plate shown is option 0 (the first candidate); the options are in lenskin-options.jpg. Lime line retouched',
                'airpods': 'second pose: higher, inside the phone window, contact shadow and gloss; graded 1.07'}[lid]
        d.text((gap, y), f"{L['n']} / 4  {lid}  ({L['base']})  square, portrait (phone window marked), wide.  {note}", fill=(235, 235, 230), font=f1); y += 30
        d.text((gap, y), f"Pearl Whisper over the text area, median / lightest 5%: portrait {c('portrait')}, wide {c('wide')}", fill=(180, 180, 175), font=f2); y += 34
        x = gap
        for t in r: sheet.paste(t, (x, y)); x += t.width + gap
        y += H + gap
    sheet.save(P(root, 'out', 'sheet-v2.jpg'), quality=88); print('sheet ->', P(root, 'out', 'sheet-v2.jpg'), sheet.size)

APPROVAL = {'case': 'Sam 2026-10-20, with fixes', 'wallet': 'Sam 2026-10-20, with fixes', 'airpods': 'Sam 2026-10-20, with fixes',
            'lenskin': 'pending the redo'}
FIXES = {'case': ['darken the text areas'], 'wallet': ['darken the text areas'],
         'airpods': ['the AirPods placement and shadow', 'darken the text areas'],
         'lenskin': ['the colour against the case (redo)', "the Lenskin's sheen", 'darken the text areas']}

def st_record(root, args):
    """src/data/room-lands.json (spec 3, "Provenance"): per land and per class, the source file, every Higgsfield job
    that went into it with its model, prompt, seed and mask, the local steps, the accessory's shade id and the approval;
    and src/data/room-lands.ledger.json, every call with its credits (its sidecar, spec 6). Paths are the protected
    copies' in assets-src/room/lands/ (work/ the masks and generator outputs, the masters beside SHA256SUMS)"""
    led = ledger(root)
    def step(e):
        prm = e.get('params', {})
        # the mask as the PNG this attempt wrote (inpaint: <stage>-<land>-mask-<attempt>.png), and its upload id
        mask, att = e.get('mask'), (e.get('note') or '').split(' ')[1] if (e.get('note') or '').startswith('attempt ') else None
        if mask:
            mp = f"{e['stage']}-{e['land']}-mask-{att.rstrip(';')}.png" if att else None
            mask = 'work/' + mp if mp and os.path.exists(P(root, 'work', mp)) else mask
        return {k: v for k, v in {'stage': e['stage'], 'model': e['model'], 'job': e['job'], 'credits': e['credits'], 'round': e.get('round', 1),
                                  'prompt': prm.get('prompt'), 'seed': prm.get('seed'), 'resolution': prm.get('resolution'),
                                  'aspect_ratio': prm.get('aspect_ratio'), 'variant': prm.get('variant'), 'max_frames': prm.get('max_frames'),
                                  'mask': mask, 'output': 'work/' + e['file'] if e.get('file') else None, 'note': e.get('note')}.items() if v is not None}
    def find(stage, land, attempt=None, rnd=None):
        hits = [e for e in led if e['stage'] == stage and e['land'] == land and e.get('status') != 'failed'
                and (attempt is None or e.get('note', '').startswith(f'attempt {attempt}')) and (rnd is None or e.get('round', 1) == rnd)]
        return hits[-1] if hits else None
    lands = []
    sums = {}
    sp = os.path.join(REPO, 'assets-src/room/lands/SHA256SUMS')
    if os.path.exists(sp):
        for line in open(sp):
            h, f = line.split(None, 1); sums[f.strip()] = h
    for lid in ORDER:
        L = LANDS[lid]; pk = pick(root, lid); first = json.load(open(P(root, 'work', 'v1', f'pick-{lid}.json'))) if os.path.exists(P(root, 'work', 'v1', f'pick-{lid}.json')) else {}
        sq_steps = [step(find('matte', lid))] if find('matte', lid) else []
        if lid == 'airpods':
            sq_steps = [step(find('hand', lid, first.get('hand_attempt'), 1)), step(find('matte', lid)), step(find('bg', lid, 1)),
                        step(find('hand', lid, pk.get('hand_attempt'), ROUND)),
                        {'stage': 'rebg', 'local': True, 'round': ROUND, 'note': "the second pose's hand composite over bg attempt 1's background; the matte the first round's with the new hand added"}]
        else:
            sq_steps.append(step(find('bg', lid, first.get('bg_attempt'))))
        if lid == 'lenskin': sq_steps.append({'stage': 'retouch', 'local': True, 'round': ROUND, 'mask': 'work/retouch-lenskin-mask.png', 'note': "the old lime wall's line along the case's top edge, filled from its neighbours (cv2.inpaint, Telea, 4 px)"})
        acc = None
        if 'accessory' in L:
            acc = {'shade': L['accessory']['shade'], 'hex': shade(L['accessory']['shade'])['hex'], 'finish': L['accessory']['finish'],
                   'render': 'scripts/room/render-products.py, Blender 5.2 Cycles on Metal', 'spec': f"work/acc-{lid}.json"}
            if lid == 'lenskin':
                acc['options'] = json.load(open(P(root, 'work', 'lenskin-options.json'))) if os.path.exists(P(root, 'work', 'lenskin-options.json')) else []
                acc['note'] = 'the masters carry option 0 (the first candidate) until Sam picks; out/lenskin-options/ holds each candidate\'s square and crops'
        burn = pk.get('burn', {})
        cls = {'square': {'steps': sq_steps}}
        cls['portrait'] = {'steps': [{'stage': 'crop', 'local': True, 'x': L['portrait_x'], 'width': PORTRAIT_W},
                                     {'stage': 'burn', 'local': True, 'round': ROUND, **{k: burn.get('portrait', {}).get(k) for k in ('stops', 'ru', 'rv', 'hl')}}]}
        cls['wide'] = {'steps': [step(find('pad', lid, first.get('pad_attempt'))), step(find('darken', lid, pk.get('darken_attempt'), ROUND)) if find('darken', lid, pk.get('darken_attempt'), ROUND) else None,
                                 {'stage': 'burn', 'local': True, 'round': ROUND, **{k: burn.get('wide', {}).get(k) for k in ('stops', 'ru', 'rv', 'hl')}}]}
        cls['wide']['steps'] = [s for s in cls['wide']['steps'] if s]
        for c in ('portrait', 'wide'):
            e = find('depth', f'{lid}-{c}')
            cls[f'{c}-depth'] = {'steps': [step(e)] if e else []}
        for c, v in cls.items():
            f = f'land-{lid}-{c}.png'; v['file'] = f; v['sha256'] = sums.get(f); v['source'] = L['base']
        lands.append({'id': lid, 'n': L['n'], 'family': L['family'], 'base': {'file': L['base'], 'from': "Sam's listing photos, ~/Downloads/amazon listing/image listing/lifestyle/17 promax/"},
                      'accessory': acc, 'approval': APPROVAL[lid], 'fixes': FIXES[lid], 'classes': cls})
    doc = {'about': ('Section 4 part two, the four lands (docs/specs/section-4-world.md 3, "Provenance"), written by scripts/room/lands.py record. '
                     'Not in ROOM_LANDS and not encoded until Sam approves each land (CHECKLIST F2).'),
           'masters': 'assets-src/room/lands/ (gitignored; SHA256SUMS committed); work/ there holds every mask and generator output named here',
           'ledger': 'src/data/room-lands.ledger.json', 'credits': spent(root), 'lands': lands}
    json.dump(doc, open(os.path.join(REPO, 'src/data/room-lands.json'), 'w'), indent=1, ensure_ascii=False); open(os.path.join(REPO, 'src/data/room-lands.json'), 'a').write('\n')
    side = [{k: e.get(k) for k in ('at', 'stage', 'land', 'model', 'job', 'credits', 'status', 'note')} | {'round': e.get('round', 1)} for e in led]
    json.dump(side, open(os.path.join(REPO, 'src/data/room-lands.ledger.json'), 'w'), indent=1, ensure_ascii=False); open(os.path.join(REPO, 'src/data/room-lands.ledger.json'), 'a').write('\n')
    print('room-lands.json:', len(lands), 'lands;', len(side), 'calls,', spent(root), 'credits')

STAGES = {'render': st_render, 'composite': st_composite, 'hand': st_hand, 'matte': st_matte, 'bg': st_bg, 'blend': st_blend, 'pick': st_pick,
          'crops': st_crops, 'widen': st_widen, 'pickwide': st_pickwide, 'depth': st_depth, 'check': st_check,
          'retouch': st_retouch, 'rebg': st_rebg, 'square2': st_square2, 'wide2': st_wide2, 'darken': st_darken, 'redarken': st_redarken,
          'final': st_final, 'lenskin': st_lenskin}
GLOBAL = {'sheet': st_sheet, 'sheet2': st_sheet2, 'sums': st_sums, 'ledger': st_ledger, 'contrast': st_contrast, 'record': st_record}

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
    ap.add_argument('--option', type=int, action='append', help='lenskin: which candidate shade(s) to render (1 to 4; all when left out)')
    ap.add_argument('--pad-model', choices=['outpaint', 'nano'], default='outpaint', help='crops: the wide pad by Higgsfield outpaint (default) or a nano_banana_2_1 masked inpaint')
    a = ap.parse_args()
    root = os.path.abspath(a.root); os.makedirs(P(root, 'work'), exist_ok=True); os.makedirs(P(root, 'out'), exist_ok=True)
    bind_products()
    if a.stage in GLOBAL: GLOBAL[a.stage](root, a); sys.exit(0)
    for lid in (a.land or ORDER): STAGES[a.stage](root, lid, LANDS[lid], a)
