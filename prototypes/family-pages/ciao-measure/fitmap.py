import numpy as np, math, sys, json
L = np.load('hdr_L.npy')
def build(BANDS, CAP, cap0, umb, Hm=128, Wm=256):
    def lt(t, v):
        if v <= t[0][0]: return t[0][1]
        for i in range(1, len(t)):
            if v <= t[i][0]: a, x = t[i-1]; b, y = t[i]; return x + (y - x) * (v - a) / (b - a)
        return t[-1][1]
    sm = lambda a, b, x: (lambda t: t*t*(3-2*t))(min(1, max(0, (x - a) / (b - a))))
    D = math.pi/180; uLat, uLon = cfg['uc'][0]*D, cfg['uc'][1]*D; u = (math.cos(uLat)*math.cos(uLon), math.sin(uLat), math.cos(uLat)*math.sin(uLon))
    M = np.zeros((Hm, Wm))
    for y in range(Hm):
        lat = 90 - (y + 0.5) / Hm * 180; cl, sl = math.cos(lat*D), math.sin(lat*D)
        for x in range(Wm):
            lon = (x + 0.5) / Wm * 360 - 180; Lv = lt(BANDS, min(lat, cap0))
            le = lat + cfg['sh'] * math.cos(lon*D)**2 * (cfg['shp'] if math.cos(lon*D) > 0 else cfg['shn']) * min(1, (90 - lat) / 30)
            if le > cap0:
                seamLon = abs(((lon % 18) + 18) % 18 - 9) > 8.2; seamLat = lat < 86 and abs(((lat - 66) % 6 + 6) % 6 - 3) > 2.6
                Lv = max(Lv, lt(CAP, le) * sm(cap0, cap0 + 4, le) * (0.04 if (seamLon or seamLat) else 1))
            d = math.acos(min(1, cl*math.cos(lon*D)*u[0] + sl*u[1] + cl*math.sin(lon*D)*u[2])) / D
            if d < umb[1]: Lv += umb[0] * sm(umb[1], umb[1] - 4, d) + umb[2] * sm(umb[3], umb[3] - 3, d) + 40 * math.exp(-(d/1.1)**2)
            M[y, x] = Lv
    return M
def bandstats(A):
    h, w = A.shape; lat = 90 - (np.arange(h) + 0.5) / h * 180; wts = np.cos(np.radians(lat)); out = []
    for a in range(-90, 90, 10):
        m = (lat >= a) & (lat < a + 10); out.append(round(float((A[m] * wts[m, None]).sum() / (wts[m].sum() * w)), 3))
    return out
def irr(A, n):
    h, w = A.shape; lat = np.radians(90 - (np.arange(h) + 0.5) / h * 180); lon = np.radians((np.arange(w) + 0.5) / w * 360 - 180)
    LA, LO = np.meshgrid(lat, lon, indexing='ij'); d = np.stack([np.cos(LA)*np.cos(LO), np.sin(LA), np.cos(LA)*np.sin(LO)], -1)
    c = np.clip(d @ np.array(n), 0, None); dw = np.cos(LA) * (math.pi / h) * (2 * math.pi / w); return round(float((A * c * dw).sum()), 3)
cfg = json.loads(sys.argv[1]); M = build(cfg['B'], cfg['C'], cfg['c0'], cfg['u'])
print('measured', bandstats(L)[9:]); print('ours    ', bandstats(M)[9:])
for n in ([0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,0.34,0.94],[0.7,0,0.7],[-0.7,0,0.7]):
    a, b = irr(L, n), irr(M, n); print('E', n, a, b, f'{b/a:.2f}')
