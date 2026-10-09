"""Proposal variants: sky cropped (centred on the dome's centre column, bottom rows kept) at native density with the dome
geometry narrowed to match, plus AVIF ground. Only the textures and the two sky-extent constants differ from index.html.
python3 -I variants_prop.py <index.html> <land dir> <out dir>"""
import base64, io, json, sys
from PIL import Image
src, L, OUT = sys.argv[1:4]
html = open(src, encoding='utf-8').read()
i = html.index('const MOON = ') + len('const MOON = '); moon, _ = json.JSONDecoder().raw_decode(html, i)
sky0, gr0 = moon['sky'], moon['ground']
LINE = 'const skyLon = THREE.MathUtils.degToRad(140), SKY_TOP = 60, SKY_BOT = -10;'
assert html.count(LINE) == 1
sky = Image.open(f'{L}/sky.png').convert('RGB'); gr = Image.open(f'{L}/ground_bake.png').convert('RGB')
def enc(im, fmt, q):
    b = io.BytesIO(); im.save(b, fmt, quality=q, **({'speed': 6} if fmt == 'AVIF' else {'method': 6})); d = b.getvalue()
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(d).decode(), d
def crop(halfw, rows):   # 4200 px = 140 deg, 2100 rows = 70 deg; the dome is centred on column 2100
    c = sky.crop((2100 - halfw, 2100 - rows, 2100 + halfw, 2100)); lon = 2 * halfw / 4200 * 140; top = -10 + rows / 2100 * 70
    return c, lon, top
for name, halfw, gsize, gq in [('prop_phone', 649, 4096, 50), ('prop_phone_lowmem', 649, 2048, 60), ('prop_desk', 1604, 4096, 50)]:
    c, lon, top = crop(halfw, 1388)
    surl, sd = enc(c, 'AVIF', 50)
    g = gr if gsize == 4096 else gr.resize((gsize, gsize), Image.LANCZOS)
    gurl, gd = enc(g, 'AVIF', gq)
    open(f'{OUT}/{name}_sky_{c.width}x{c.height}_q50.avif', 'wb').write(sd); open(f'{OUT}/{name}_ground_{gsize}_q{gq}.avif', 'wb').write(gd)
    h = html.replace(sky0, surl, 1).replace(gr0, gurl, 1).replace(LINE, f'const skyLon = THREE.MathUtils.degToRad({lon:.6f}), SKY_TOP = {top:.6f}, SKY_BOT = -10;')
    open(f'{OUT}/v_{name}.html', 'w', encoding='utf-8').write(h)
    print(name, f'sky {c.width}x{c.height} AVIF q50 {len(sd)} B, lon {lon:.4f} top {top:.4f}; ground {gsize} AVIF q{gq} {len(gd)} B', flush=True)
