#!/usr/bin/env python3
"""Assemble skreed-shades.html from src/page.html: shade data, shade tokens, the two case LODs as base64.

Usage: python3 -I build.py
"""
import base64, gzip, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = '/home/user/skreed-pre-launch'

data = json.load(open(os.path.join(REPO, 'docs/data/shades-240.json')))
fams = data['families']
assert len(fams) == 10, 'need 10 families'

# key shade per family (family-page.md 2.1, the rock's shade), in catalog order
KEYS = {
    'frosty-whites': ('Snow', 7), 'blissful-blues': ('Sky', 8), 'playful-pinks': ('Rouge', 14),
    'vivid-violets': ('Amethyst', 7), 'mellow-yellows': ('Sunbeam', 1), 'earthy-browns': ('Cinnamon', 7),
    'blushing-corals': ('Mango', 4), 'stormy-greys': ('Silver', 5), 'go-green': ('Lawn', 12), 'roaring-reds': ('Crimson', 7),
}


def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


PEARL, SLATE = '#f7f6f3', '#383f43'
out_fams = []
tokens, rules = [], []
for fi, f in enumerate(fams):
    sh = f['shades']
    assert len(sh) == 24, f['id']
    names = [s['name'] for s in sh]
    assert len(set(names)) == 24, f['id'] + ' repeats a name'
    assert re.fullmatch(r'[a-z-]+', f['id'])
    kname, kidx = KEYS[f['id']]
    assert sh[kidx - 1]['name'] == kname, (f['id'], sh[kidx - 1]['name'], kname)
    med = lambda bg: sorted(contrast(s['hex'], bg) for s in sh)[11:13]
    mp, ms = sum(med(PEARL)) / 2, sum(med(SLATE)) / 2
    neutral = 'pearl' if mp >= ms else 'slate'
    out_fams.append({'id': f['id'], 'name': f['name'], 'key': kidx, 'neutral': neutral,
                     'shades': [[s['name'], s['hex'].lower()] for s in sh]})
    for s in sh:
        n = fi * 24 + s['index']
        tokens.append(f'--shade-{n:03d}:{s["hex"].lower()};')
        rules.append(f'[data-s="{n:03d}"]{{--sw:var(--shade-{n:03d})}}')

expected = ['slate', 'pearl'] * 5
assert [f['neutral'] for f in out_fams] == expected, [f['neutral'] for f in out_fams]

lod1 = open(os.path.join(ROOT, 'assets/case-lod1-r3.glb'), 'rb').read()
lod0 = open(os.path.join(ROOT, 'assets/case-lod0-r3.glb'), 'rb').read()
for b in (lod0, lod1):
    j = json.loads(b[20:20 + int.from_bytes(b[12:16], 'little')])
    assert 'EXT_meshopt_compression' not in j.get('extensionsUsed', []), 'meshopt left in a LOD'

# three from the CDN, as the 3D path downloads it (gzip transfer estimate for the "Show in 3D, {size} MB" line)
T = os.path.join(ROOT, 'node_modules/three')
lib = 0
for p in ['build/three.module.min.js', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/utils/BufferGeometryUtils.js']:
    lib += len(gzip.compress(open(os.path.join(T, p), 'rb').read(), 9))
size_mb = round(lib / 1e6 + 0.05, 1)

D = {'families': out_fams, 'dims': {'w': 0.5322, 'd': 0.1350}, 'libMB': size_mb,
     'lodBytes': [len(lod1), len(lod0)]}

src = open(os.path.join(ROOT, 'src/page.html'), encoding='utf-8').read()
src = src.replace('/*@SHADE_TOKENS@*/', ''.join(tokens))
src = src.replace('/*@SHADE_RULES@*/', ''.join(rules))
src = src.replace('/*@DATA@*/null', json.dumps(D, separators=(',', ':')))
logo = ''.join('<path d="%s"/>' % d for d in open(os.path.join(HERE, 'logo-paths.txt')).read().split('\n') if d)
src = src.replace('@LOGO_PATHS@', logo)
src = src.replace('@LOD1@', base64.b64encode(lod1).decode())
src = src.replace('@LOD0@', base64.b64encode(lod0).decode())
assert '@LOD' not in src and '/*@' not in src

# copy guards (CLAUDE.md): no em dash, no emoji-range characters, no box-shadow, no gradient, no backdrop-filter, no italic
code = re.sub(r'<script type="application/octet-stream"[^>]*>[^<]*</script>', '', src)
for bad in ['—', 'box-shadow', 'gradient', 'backdrop-filter', 'italic', 'Inter,', 'blur(']:
    assert bad not in code, 'guard: ' + repr(bad)
assert not re.search('[\U0001F300-\U0001FAFF☀-➿]', code), 'emoji'

dst = os.path.join(ROOT, 'skreed-shades.html')
open(dst + '.tmp', 'w', encoding='utf-8').write(src)
os.replace(dst + '.tmp', dst)  # atomic: the harness may be reading the file
raw = len(src.encode())
gz = len(gzip.compress(src.encode(), 9))
print(json.dumps({'out': dst, 'bytes': raw, 'gzip': gz, 'lod1': len(lod1), 'lod0': len(lod0), 'libGzip': lib, 'libMB': size_mb,
                  'neutrals': [f['neutral'] for f in out_fams]}))
