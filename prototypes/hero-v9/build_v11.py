import base64, io, json, math, re, sys
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

# ---- the loader's outline data, generated from the same pieces the 3D build uses, so the two can never drift ----
pieces = json.load(open('pieces_10.json'))
def rdp(pts, tol):
    # Douglas-Peucker on a closed polygon: split at the two farthest-apart points, simplify both halves
    def seg(p):
        if len(p) < 3: return p
        a, b = p[0], p[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1
        best, bi = -1, 0
        for i in range(1, len(p) - 1):
            dd = abs((p[i][0] - a[0]) * dy - (p[i][1] - a[1]) * dx) / L
            if dd > best: best, bi = dd, i
        if best > tol: return seg(p[:bi + 1])[:-1] + seg(p[bi:])
        return [a, b]
    far = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
    h1 = seg(pts[0:far + 1]); h2 = seg(pts[far:] + [pts[0]])
    return [list(q) for q in h1[:-1] + h2[:-1]]
def on_segment(q, a, b, tol):
    dx, dy = b[0] - a[0], b[1] - a[1]; L2 = dx * dx + dy * dy
    if L2 == 0: return False
    t = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L2
    if t <= 1e-3 or t >= 1 - 1e-3: return False
    return math.hypot(q[0] - (a[0] + t * dx), q[1] - (a[1] + t * dy)) < tol
def plot_data(d):
    V = d['variants']['10']; VW, VH = d['viewBox']
    simp = [rdp(p['v'][:p['nb']], 1.0) for p in V['pieces']]
    # shared seams: a kept vertex of one piece that lies on another piece's simplified edge is inserted there too,
    # so both sides of a cut are drawn through the same points and the two hairlines coincide
    inserted = 0; changed = True
    while changed:
        changed = False
        for i, s in enumerate(simp):
            for j, o in enumerate(simp):
                if i == j: continue
                for q in o:
                    if any(math.hypot(q[0] - v[0], q[1] - v[1]) < 0.5 for v in s): continue
                    for k in range(len(s)):
                        if on_segment(q, s[k], s[(k + 1) % len(s)], 0.6): s.insert(k + 1, list(q)); inserted += 1; changed = True; break
    pc = []; corners = 0
    for s in simp:
        k0 = min(range(len(s)), key=lambda k: (s[k][0], s[k][1]))       # start at the left-most vertex: the cut retracts toward the left
        s = s[k0:] + s[:k0]
        n = len(s)
        for k in range(n):
            a, b, c = s[k - 1], s[k], s[(k + 1) % n]
            ux, uy, vx, vy = b[0] - a[0], b[1] - a[1], c[0] - b[0], c[1] - b[1]
            if abs(math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)) > math.radians(25): corners += 1
        pc.append([int(round(v)) for q in s for v in q])
    cen = []
    for p in V['pieces']:                                                  # polygon centroid of the full boundary, as the module computes it
        v = p['v'][:p['nb']]; a = cx = cy = 0
        for k in range(len(v)):
            P, Q = v[k], v[(k + 1) % len(v)]; c = P[0] * Q[1] - Q[0] * P[1]; a += c; cx += (P[0] + Q[0]) * c; cy += (P[1] + Q[1]) * c
        a *= 0.5; cen.append([int(round(cx / (6 * a))), int(round(cy / (6 * a)))])
    # part numbers are block ids (01 to 10, the index the module and BLOCK_ORDERS use), so each piece takes the anchor inside it.
    # The anchor doubles as the piece's centre for the 0.992 inset (it is the centroid to within one viewBox unit, 0.002 px after the inset).
    anc = [min(([round(x), round(y)] for x, y in V['anchors']), key=lambda a: math.hypot(a[0] - c[0], a[1] - c[1])) for c in cen]
    assert len({tuple(a) for a in anc}) == 10, 'anchor to piece mapping is not one to one'
    assert all(math.hypot(a[0] - c[0], a[1] - c[1]) <= 1.5 for a, c in zip(anc, cen)), 'an anchor is not the centroid'
    # outline data as base-36 triplets (three characters per integer coordinate, 0 to 46655), pieces separated by '|': the loader decodes
    # with parseInt(w.substr(i, 3), 36). Half the bytes of JSON arrays; the values are the same integers.
    assert all(0 <= v < 46656 for q in pc for v in q)
    enc = lambda vals: ''.join(('00' + (lambda n: ''.join('0123456789abcdefghijklmnopqrstuvwxyz'[d] for d in ((n // 1296) % 36, (n // 36) % 36, n % 36)))(v))[-3:] for v in vals)
    out = json.dumps({'vw': VW, 'vh': VH, 's': '|'.join(enc(q) for q in pc), 'a': enc([v for a in anc for v in a])}, separators=(',', ':'))
    assert '</' not in out and '<!' not in out
    print('plot data: %d vertices (%d corners over 25 degrees, %d shared-seam points inserted), %d B' % (sum(len(p) // 2 for p in pc), corners, inserted, len(out)))
    return out
plot = plot_data(pieces)

t = open(sys.argv[2] if len(sys.argv) > 2 else 'template7.html').read()
import os; from jsstrip import strip_page
# SHIP=1: the published build. Test-only code (seek, tune and hold hooks, the clock pin, the program counter) sits between
# /*TEST*/ and /*TEST-END*/ markers in the template and is cut before stripping and minifying.
if os.environ.get('SHIP') == '1':
    n0 = len(t); t, k = re.subn(r'/\*TEST\*/.*?/\*TEST-END\*/', '', t, flags=re.S)
    assert k == 7 and '__skreedHold' not in t and '__skreedIntro' not in t and '__skreedSetT' not in t, k
    print('SHIP: %d test blocks cut (%d B of template source)' % (k, n0 - len(t)))
# LOCKED=1: Sam's locked terrain values (proto/PENDING_MERGE.txt) as the P defaults, for the build that replaces the hero artifact
if os.environ.get('LOCKED') == '1':
    LV = {'gExp': 0.2, 'gGamma': 0.87, 'gNear': 0.54, 'gToe': 0.02, 'crumb': 0.53, 'crumbSize': 0.07, 'mist': 0.2, 'mistSpeed': 0.55}
    i0 = t.index('const P = {'); i1 = t.index('};', i0); line = t[i0:i1]
    for k, v in LV.items():
        line, n = re.subn(r'(?<![\w.])%s: [\d.]+' % k, '%s: %s' % (k, v), line); assert n == 1, k
    t = t[:i0] + line + t[i1:]; print('LOCKED: terrain defaults', LV)
if not os.environ.get('NOSTRIP'):
    n0 = len(t); t = strip_page(t); print('stripped comments and indentation: template %d -> %d B' % (n0, len(t)))
# ---- then the module is minified as build7.py does (terser, module scope, two compress passes) before the data goes in: the
# placeholders become free identifiers that terser leaves alone, then take their JSON. GLSL template strings pass through.
import gzip, subprocess
if os.environ.get('SKREED_MIN', '1') == '1':
    m0 = t.index('<script type="module">') + len('<script type="module">'); m1 = t.index('</script>', m0); body = t[m0:m1]
    if os.environ.get('GLSLSQ', '1') == '1':   # GLSL whitespace squeeze in the module's shader templates (glslsq.py)
        from glslsq import squeeze; n0 = len(body); body = squeeze(body); print('GLSL squeeze: module %d -> %d B' % (n0, len(body)))
    for k in ('PIECES', 'SHADES', 'PLATES', 'MOON'): body = body.replace('/*%s*/null' % k, '__SKREED_%s__' % k)
    terser = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools_min', 'node_modules', '.bin', 'terser')
    r = subprocess.run([terser, '--module', '--compress', 'passes=2', '--mangle', '--format', 'comments=false', '--ecma', '2020'], input=body.encode(), capture_output=True)
    assert r.returncode == 0, r.stderr.decode()[:2000]
    mb = r.stdout.decode()
    for k in ('PIECES', 'SHADES', 'PLATES', 'MOON'): assert ('__SKREED_%s__' % k) in mb, k; mb = mb.replace('__SKREED_%s__' % k, '/*%s*/null' % k)
    print('module: %d B stripped (%d gz) -> minified %d B (%d gz), data excluded' % (len(body), len(gzip.compress(body.encode(), 9)), len(mb), len(gzip.compress(mb.encode(), 9))))
    t = t[:m0] + mb + t[m1:]
t = t.replace('/*PIECES*/null', open('pieces_10.json').read()).replace('/*SHADES*/null', open('shades.min.json').read())
# loader weights: measured milestone cost (research/preloader/impl2/weights.json, written by cost-run.mjs); key order is the pending order
WT = json.load(open('loader_weights_v10.json'))
assert abs(sum(WT.values()) - 1) < 1e-6 and list(WT)[0] == 'import' and list(WT)[-1] == 'frame2', WT
wt = re.sub(r'(?<![\d.])0\.', '.', json.dumps(WT, separators=(',', ':')))   # .07, not 0.07
t = t.replace('/*PLATES*/null', json.dumps(plates)).replace('/*MOON*/null', json.dumps(moon)).replace('/*PLOT*/null', plot).replace('/*WT*/null', wt)
open(sys.argv[3] if len(sys.argv) > 3 else 'skreed-hero-prototype.html', 'w').write(t)
if '/*LOADER-CSS*/' in t:
    # the loader's budget: markup, CSS, script and data together, measured on the built page
    i0 = t.index('/*LOADER-CSS*/'); i1 = t.index('/*LOADER-CSS-END*/') + len('/*LOADER-CSS-END*/')
    j0 = t.index('<div class="intro"'); j1 = t.index('<!--LOADER-END-->') + len('<!--LOADER-END-->')
    n = (i1 - i0) + (j1 - j0)
    print('loader bytes (css %d + markup, script and data %d) = %d raw' % (i1 - i0, j1 - j0, n), '(budget 10000)' if n <= 10000 else 'OVER BUDGET 10000')
