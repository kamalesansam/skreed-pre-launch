import json, re, sys, base64, gzip, hashlib, os, subprocess
src = sys.argv[1]; out = sys.argv[2]
html = open(src, encoding='utf-8').read()
dec = json.JSONDecoder()
def grab(prefix):
    i = html.index(prefix) + len(prefix)
    obj, end = dec.raw_decode(html, i)
    return obj, i, end
res = {}
for name, pref in [('pieces', 'const PIECES = '), ('shades', 'const FAMILIES = '), ('plates', 'const PLATES = '), ('moon', 'const MOON = '), ('wt', 'var WT=')]:
    if name == 'wt':
        i = html.index(pref) + len(pref); j = html.index(';', i); txt = html[i:j]
        txt2 = re.sub(r'(?<=[:,\[])\.', '0.', txt); obj = json.loads(txt2); end = j
    else:
        obj, i, end = grab(pref)
    res[name] = (obj, i, end)
    print(name, 'inline chars', end - i)
def wb(path, data):
    open(os.path.join(out, path), 'wb').write(data)
def durl(s):
    h, b = s.split(',', 1); return base64.b64decode(b)
moon = res['moon'][0]
wb('sky.webp', durl(moon['sky']))
wb('ground_bake.webp', durl(moon['ground']))
wb('moon_meta.json', json.dumps(moon['meta']).encode())
for k, f in [('groundH', 'ground_h.bin'), ('stonesP', 'stones_p.bin'), ('stonesC', 'stones_c.bin'), ('stonesI', 'stones_i.bin')]:
    wb(f, base64.b64decode(moon[k]))
plates = res['plates'][0]
for k, v in plates.items():
    if v: wb(f'plate_{k}.webp', durl(v))
    else: print('plate', k, 'empty')
wb('pieces.json', json.dumps(res['pieces'][0], separators=(',', ':')).encode())
wb('shades.json', json.dumps(res['shades'][0], separators=(',', ':')).encode())
wb('wt.json', json.dumps(res['wt'][0], separators=(',', ':')).encode())
# the remaining page with data removed
spans = sorted([(res[k][1], res[k][2]) for k in ('pieces','shades','plates','moon')])
rest = ''; p = 0
for a, b in spans: rest += html[p:a] + 'null'; p = b
rest += html[p:]
open(os.path.join(out, 'page_without_data.html'), 'w').write(rest)
