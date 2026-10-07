import base64, io, json, sys
from PIL import Image
pref = sys.argv[1] if len(sys.argv) > 1 else 'final'
plates = {}
for k in ('canyon', 'spires', 'dunes'):
    im = Image.open((f'../land/test_{k}_p.png' if pref == 'test' else f'blender/plate_{k}.webp')).convert('RGB')
    if im.width > 2600: im = im.resize((2600, round(im.height * 2400 / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=80, method=6)
    plates[k] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
    print(k, len(b.getvalue()) // 1024, 'KB')
t = open('template.html').read()
t = t.replace('/*PIECES*/null', open('pieces.json').read()).replace('/*SHADES*/null', open('../hero-v1/shades.min.json').read()).replace('/*PLATES*/null', json.dumps(plates))
open('index.html', 'w').write(t)
