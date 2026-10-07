import base64, io, json, sys
from PIL import Image
def webp(path, maxw, q):
    im = Image.open(path).convert('RGB')
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())
src = sys.argv[1] if len(sys.argv) > 1 else '../land/moon_final'
plates = {}
for k in ('canyon', 'dunes'):
    plates[k], n = webp(f'../land/final_{k}.png', 2600, 80)
plates['spires'] = plates['canyon']
sky, n1 = webp(f'{src}/sky.png', 4200, 82)
gr, n2 = webp(f'{src}/ground_bake.png', 4096, 80)
glb = open(f'{src}/moon.glb', 'rb').read()
print('sky', n1 // 1024, 'KB; ground', n2 // 1024, 'KB; glb', len(glb) // 1024, 'KB')
moon = {'sky': sky, 'ground': gr, 'glb': 'data:model/gltf-binary;base64,' + base64.b64encode(glb).decode()}
t = open('template5.html').read()
t = t.replace('/*PIECES*/null', open('pieces_all.json').read()).replace('/*SHADES*/null', open('shades.min.json').read())
t = t.replace('/*PLATES*/null', json.dumps(plates)).replace('/*MOON*/null', json.dumps(moon))
open('skreed-hero-prototype.html', 'w').write(t)
