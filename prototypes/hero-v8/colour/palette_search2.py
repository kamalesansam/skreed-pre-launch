# Second pass: colour harmony weighted by what each block actually shows, plus colour-vision, CTA and balance terms.
import json, itertools, numpy as np, sys
O = json.load(open('oklch10.json')); names = list(O)
HEX = json.load(open('pal/hexes.json'))
E = [(0,2,1),(0,4,1),(1,3,1),(1,5,1),(4,6,1),(5,7,1),(6,8,1),(7,9,1),(3,2,.5),(9,0,.5),(1,8,.5),(9,2,.5),(3,8,.5)]
S_PATH = [9,7,5,1,3,2,0,4,6,8]
VIS = json.load(open('pal/vis.json'))
def norm(a): a = np.array(a, float); return a / a.max()
hov = lambda dev: np.mean([norm([x[0] for x in VIS[dev][p]]) for p in VIS[dev] if p != 'rest'], 0)
rest = lambda dev: norm([x[0] for x in VIS[dev]['rest']])
v_rest = 0.6 * rest('d') + 0.4 * rest('m'); v_hov = 0.6 * hov('d') + 0.4 * hov('m')
vis = norm(0.45 * v_rest + 0.55 * v_hov)
cen = np.array([[x[1], x[2]] for x in VIS['d']['center']])   # screen centroid of each block's glow (desktop, centre pose)
def lin(h): c = np.array([int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]); return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def oklab(l):
    M1 = np.array([[0.4122214708,0.5363325363,0.0514459929],[0.2119034982,0.6806995451,0.1073969566],[0.0883024619,0.2817188376,0.6299787005]])
    M2 = np.array([[0.2104542553,0.7936177850,-0.0040720468],[1.9779984951,-2.4285922050,0.4505937099],[0.0259040371,0.7827717662,-0.8086757660]])
    return M2 @ np.cbrt(M1 @ l)
DEU = np.array([[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]])
PRO = np.array([[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]])
LAB = {n: oklab(lin(HEX[n])) for n in names}
LABD = {n: oklab(np.clip(DEU @ lin(HEX[n]), 0, 1)) for n in names}
LABP = {n: oklab(np.clip(PRO @ lin(HEX[n]), 0, 1)) for n in names}
def pair(a, b):
    La, Ca, ha = O[a]; Lb, Cb, hb = O[b]
    na, nb = Ca < 0.02, Cb < 0.02
    if na and nb: return 0.8
    if na or nb: return 0.3
    dh = abs(ha - hb); dh = min(dh, 360 - dh)
    c = (dh / 60) ** 2 if dh <= 60 else (1 + (dh - 60) / 60 * 1.5 if dh <= 120 else 2.5 - (dh - 120) / 60 * 0.5)
    if abs(La - Lb) < 0.06 and min(Ca, Cb) > 0.12: c += 0.3
    return c
def cvd(a, b):
    p = 0
    for L in (LABD, LABP):
        d = np.linalg.norm(L[a] - L[b]); p += max(0, 0.10 - d) / 0.10
    return p
PM = {(a, b): pair(a, b) for a in names for b in names}
CM = {(a, b): cvd(a, b) for a in names for b in names}
EMBER = oklab(lin('#FF9900'))
ember_near = {n: max(0, 0.2 - np.linalg.norm(LAB[n] - EMBER)) / 0.2 for n in names}   # Mango ~0.88, Cinnamon ~0.2
def hue_run(order):
    run = best = 0; prev = None
    for b in S_PATH:
        n = order[b]; L, C, h = O[n]
        if C < 0.02: run = 0; prev = None; continue
        if prev is not None:
            d = (h - prev + 540) % 360 - 180
            run = run + 1 if (abs(d) < 90 and (run == 0 or np.sign(d) == sgn)) else (1 if abs(d) < 90 else 0)
            sgn = np.sign(d)
        prev = h; best = max(best, run)
    return best
def cost(order, W):
    s = 0
    for i, j, w in E:
        ve = 0.35 + 0.65 * np.sqrt(vis[i] * vis[j])
        s += w * ve * (PM[order[i], order[j]] + W['cvd'] * CM[order[i], order[j]])
    s += W['ember'] * sum(vis[b] * ember_near[order[b]] for b in range(10))
    s += W['neutral'] * sum(vis[b] for b in range(10) if O[order[b]][1] < 0.02)
    Lw = np.array([O[order[b]][0] * vis[b] for b in range(10)])
    off = np.linalg.norm((Lw[:, None] * cen).sum(0) / Lw.sum() - (vis[:, None] * cen).sum(0) / vis.sum())
    s += W['balance'] * off / 50
    s += W['rainbow'] * max(0, hue_run(order) - 3)
    return s
def vec_costs(P, W):
    """P: (n,10) int array of name indices by block. Everything but the rainbow term, vectorised."""
    n = len(P); s = np.zeros(n)
    A = np.array([[PM[a, b] + W['cvd'] * CM[a, b] for b in names] for a in names])
    for i, j, w in E: s += w * (0.35 + 0.65 * np.sqrt(vis[i] * vis[j])) * A[P[:, i], P[:, j]]
    em = np.array([ember_near[nm] for nm in names]); neu = np.array([1.0 if O[nm][1] < 0.02 else 0 for nm in names])
    s += W['ember'] * (em[P] * vis).sum(1) + W['neutral'] * (neu[P] * vis).sum(1)
    Ls = np.array([O[nm][0] for nm in names]); Lw = Ls[P] * vis
    c0 = (vis[:, None] * cen).sum(0) / vis.sum()
    off = np.linalg.norm(Lw @ cen / Lw.sum(1, keepdims=True) - c0, axis=1)
    return s + W['balance'] * off / 50
if __name__ == '__main__':
    print('visibility', np.round(vis, 2))
    print('ember_near', {k: round(v, 2) for k, v in ember_near.items() if v > 0})
    WS = {'base': dict(cvd=1, ember=2, neutral=0.4, balance=1, rainbow=0.5),
          'strict_cta': dict(cvd=1, ember=4, neutral=0.4, balance=1, rainbow=0.5),
          'cvd_heavy': dict(cvd=2, ember=2, neutral=0.4, balance=1, rainbow=0.5),
          'no_neutral_pen': dict(cvd=1, ember=2, neutral=0, balance=1, rainbow=0.5)}
    P = np.array(list(itertools.permutations(range(10))), dtype=np.int8)
    res = {}
    for k, W in WS.items():
        c = vec_costs(P, W); top = np.argsort(c)[:3000]
        sc = sorted(((cost([names[x] for x in P[t]], W), [names[x] for x in P[t]]) for t in top), key=lambda x: x[0])[:8]
        res[k] = [(round(cc, 3), pp) for cc, pp in sc]
        print('==', k); [print(' ', r) for r in res[k]]
    C = json.load(open('palette_candidates.json'))
    for key, order in C.items(): print(key, {k: round(cost(order, W), 3) for k, W in WS.items()})
    json.dump(res, open('pal/search2.json', 'w'))
