"""Build prototype pages that differ from the shipped v9.9 index.html only in the sky and ground textures.
python3 -I variants.py <index.html> <land dir> <out dir>"""
import base64, io, json, sys
from PIL import Image
src, L, OUT = sys.argv[1:4]
html = open(src, encoding='utf-8').read()
i = html.index('const MOON = ') + len('const MOON = '); moon, end = json.JSONDecoder().raw_decode(html, i)
sky0, gr0 = moon['sky'], moon['ground']
sky = Image.open(f'{L}/sky.png').convert('RGB'); gr = Image.open(f'{L}/ground_bake.png').convert('RGB')
def enc(im, size, fmt, q):
    if size and size != im.size: im = im.resize(size, Image.LANCZOS)
    b = io.BytesIO(); im.save(b, fmt, quality=q, **({'speed': 6} if fmt == 'AVIF' else {'method': 6}))
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())
V = {
    's2048': [('sky', (2048, 1024), 'WEBP', 84)], 's1024': [('sky', (1024, 512), 'WEBP', 84)],
    'g2048': [('ground', (2048, 2048), 'WEBP', 82)], 'g1024': [('ground', (1024, 1024), 'WEBP', 82)],
    'both2048': [('sky', (2048, 1024), 'WEBP', 84), ('ground', (2048, 2048), 'WEBP', 82)],
    'avif': [('sky', None, 'AVIF', 50), ('ground', None, 'AVIF', 60)],
    'avif2048': [('sky', (2048, 1024), 'AVIF', 50), ('ground', (2048, 2048), 'AVIF', 60)],
}
for name, subs in V.items():
    h = html; info = []
    for which, size, fmt, q in subs:
        url, n = enc(sky if which == 'sky' else gr, size, fmt, q)
        h = h.replace(sky0 if which == 'sky' else gr0, url, 1); info.append(f'{which} {size} {fmt} q{q} {n} B')
    open(f'{OUT}/v_{name}.html', 'w', encoding='utf-8').write(h); print(name, '; '.join(info), flush=True)
