import base64, io, json, sys
from PIL import Image
def webp(path, maxw, q):
    im = Image.open(path).convert('RGB')
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())
src = sys.argv[1] if len(sys.argv) > 1 else '../land/moon_final2'
plates = {}
for k in ('canyon', 'dunes'):
    plates[k], n = webp(f'../land/final_{k}.png', 2600, 80)
plates['spires'] = ''          # the moon draws its own sky and ground
sky, n1 = webp(f'{src}/sky.png', 4200, 84)
gr, n2 = webp(f'{src}/ground_bake.png', 4096, 82)
raw = lambda f: base64.b64encode(open(f'{src}/{f}', 'rb').read()).decode()
moon = {'sky': sky, 'ground': gr, 'meta': json.load(open(f'{src}/moon_meta.json')),
        'groundH': raw('ground_h.bin'), 'stonesP': raw('stones_p.bin'), 'stonesC': raw('stones_c.bin'), 'stonesI': raw('stones_i.bin')}
print('sky', n1 // 1024, 'KB; ground tex', n2 // 1024, 'KB; geometry', sum(len(moon[k]) for k in ('groundH', 'stonesP', 'stonesC', 'stonesI')) * 3 // 4 // 1024, 'KB')
t = open('template7.html').read()
t = t.replace('/*PIECES*/null', open('pieces_10.json').read()).replace('/*SHADES*/null', open('shades.min.json').read())
t = t.replace('/*PLATES*/null', json.dumps(plates)).replace('/*MOON*/null', json.dumps(moon))
open('skreed-hero-prototype.html', 'w').write(t)
