import io, sys, hashlib
from PIL import Image
L = 'assets-src/hero/masters'
A = 'prototypes/hero-v9/assets'
def webp(path, maxw, q):
    im = Image.open(path); print(path, im.size, im.mode); im = im.convert('RGB')
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return b.getvalue()
for name, mw, q in [('sky', 4200, 84), ('ground_bake', 4096, 82)]:
    d = webp(f'{L}/{name}.png', mw, q)
    ref = open(f'{A}/{name}.webp', 'rb').read()
    print(name, len(d), len(ref), 'IDENTICAL' if d == ref else 'differs', hashlib.sha256(d).hexdigest()[:12], hashlib.sha256(ref).hexdigest()[:12])
