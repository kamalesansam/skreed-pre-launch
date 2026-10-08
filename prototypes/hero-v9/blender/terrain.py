# Heightmaps for the hero landscape: domain-warped fractal noise, then droplet hydraulic erosion (numba).
import numpy as np, numba, sys
rng = np.random.default_rng(7)

def perlin(shape, res, seed):
    r = np.random.default_rng(seed)
    d = (shape[0] // res[0], shape[1] // res[1])
    ang = 2 * np.pi * r.random((res[0] + 1, res[1] + 1))
    g = np.dstack((np.cos(ang), np.sin(ang)))
    gy, gx = np.mgrid[0:res[0]:complex(0, shape[0]), 0:res[1]:complex(0, shape[1])]
    gy = gy % 1; gx = gx % 1
    gy = gy[:shape[0], :shape[1]]; gx = gx[:shape[0], :shape[1]]
    G = lambda a, b: g[a:a + res[0] or None, b:b + res[1] or None].repeat(d[0], 0).repeat(d[1], 1)
    g00, g10, g01, g11 = G(0, 0), G(1, 0) if False else g[1:, :-1].repeat(d[0], 0).repeat(d[1], 1), g[:-1, 1:].repeat(d[0], 0).repeat(d[1], 1), g[1:, 1:].repeat(d[0], 0).repeat(d[1], 1)
    g00 = g[:-1, :-1].repeat(d[0], 0).repeat(d[1], 1)
    n00 = gy * g00[..., 0] + gx * g00[..., 1]
    n10 = (gy - 1) * g10[..., 0] + gx * g10[..., 1]
    n01 = gy * g01[..., 0] + (gx - 1) * g01[..., 1]
    n11 = (gy - 1) * g11[..., 0] + (gx - 1) * g11[..., 1]
    f = lambda t: 6 * t**5 - 15 * t**4 + 10 * t**3
    ty, tx = f(gy), f(gx)
    return np.sqrt(2) * ((n00 * (1 - ty) + ty * n10) * (1 - tx) + tx * (n01 * (1 - ty) + ty * n11))

def fbm(N, base, octaves, seed, ridged=False, gain=0.5):
    out = np.zeros((N, N)); amp = 1; tot = 0; res = base
    for o in range(octaves):
        if N % res: break
        n = perlin((N, N), (res, res), seed + o)
        if ridged: n = 1 - np.abs(n); n = n * n
        out += amp * n; tot += amp; amp *= gain; res *= 2
    return out / tot

def warp(h, wx, wy, k):
    N = h.shape[0]; yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    x = np.clip(xx + wx * k, 0, N - 1); y = np.clip(yy + wy * k, 0, N - 1)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); x1 = np.minimum(x0 + 1, N - 1); y1 = np.minimum(y0 + 1, N - 1)
    fx = x - x0; fy = y - y0
    return (h[y0, x0] * (1 - fx) + h[y0, x1] * fx) * (1 - fy) + (h[y1, x0] * (1 - fx) + h[y1, x1] * fx) * fy

@numba.njit(cache=True)
def erode(h, n, seed, inertia=0.05, cap=4.0, minslope=0.01, erosion=0.3, deposit=0.3, evap=0.01, grav=4.0, life=40, radius=3):
    np.random.seed(seed); N = h.shape[0]
    for _ in range(n):
        x = np.random.random() * (N - 2); y = np.random.random() * (N - 2)
        dx = 0.0; dy = 0.0; speed = 1.0; water = 1.0; sed = 0.0
        for _s in range(life):
            xi = int(x); yi = int(y); fx = x - xi; fy = y - yi
            h00 = h[yi, xi]; h10 = h[yi, xi + 1]; h01 = h[yi + 1, xi]; h11 = h[yi + 1, xi + 1]
            gx = (h10 - h00) * (1 - fy) + (h11 - h01) * fy
            gy = (h01 - h00) * (1 - fx) + (h11 - h10) * fx
            hh = h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy
            dx = dx * inertia - gx * (1 - inertia); dy = dy * inertia - gy * (1 - inertia)
            l = np.sqrt(dx * dx + dy * dy)
            if l < 1e-9: break
            dx /= l; dy /= l
            nx = x + dx; ny = y + dy
            if nx < 1 or ny < 1 or nx >= N - 2 or ny >= N - 2: break
            nxi = int(nx); nyi = int(ny); nfx = nx - nxi; nfy = ny - nyi
            nh = h[nyi, nxi] * (1 - nfx) * (1 - nfy) + h[nyi, nxi + 1] * nfx * (1 - nfy) + h[nyi + 1, nxi] * (1 - nfx) * nfy + h[nyi + 1, nxi + 1] * nfx * nfy
            dh = nh - hh
            c = max(-dh, minslope) * speed * water * cap
            if sed > c or dh > 0:
                amt = min(dh, sed) if dh > 0 else (sed - c) * deposit
                sed -= amt
                h[yi, xi] += amt * (1 - fx) * (1 - fy); h[yi, xi + 1] += amt * fx * (1 - fy)
                h[yi + 1, xi] += amt * (1 - fx) * fy; h[yi + 1, xi + 1] += amt * fx * fy
            else:
                amt = min((c - sed) * erosion, -dh)
                wsum = 0.0
                for oy in range(-radius, radius + 1):
                    for ox in range(-radius, radius + 1):
                        d = np.sqrt(ox * ox + oy * oy)
                        if d <= radius: wsum += radius - d
                for oy in range(-radius, radius + 1):
                    for ox in range(-radius, radius + 1):
                        d = np.sqrt(ox * ox + oy * oy)
                        if d <= radius:
                            px = min(max(xi + ox, 0), N - 1); py = min(max(yi + oy, 0), N - 1)
                            w = (radius - d) / wsum
                            h[py, px] -= amt * w
                sed += amt
            speed = np.sqrt(max(speed * speed + dh * grav, 0.0))
            water *= 1 - evap
            x = nx; y = ny
    return h

def make(kind, N=1024, drops=350000):
    yy, xx = np.mgrid[0:N, 0:N] / N          # yy: 0 = far edge, 1 = near edge (towards the camera)
    if kind == 'canyon':
        base = fbm(N, 4, 7, 11)
        w1, w2 = fbm(N, 4, 4, 41), fbm(N, 4, 4, 42)
        h = warp(base, w1, w2, 60)
        h = (h - h.min()) / (h.max() - h.min())
        strata = np.floor(h * 7) / 7; h = h * 0.35 + strata * 0.65 + 0.03 * fbm(N, 64, 3, 5)   # sedimentary terraces: mesas and buttes
    elif kind == 'spires':
        r = fbm(N, 8, 7, 21, ridged=True, gain=0.55)
        w1, w2 = fbm(N, 4, 4, 51), fbm(N, 4, 4, 52)
        h = warp(r, w1, w2, 55) ** 1.5 * (0.55 + 0.45 * fbm(N, 2, 3, 77))
    else:  # dunes and ridges: wind-shaped plain with a distant range
        d = fbm(N, 8, 6, 31)
        dunes = np.abs(np.sin((xx * 22 + yy * 9 + d * 3.0) * np.pi)) ** 1.5 * 0.08
        m_ = np.clip((0.55 - yy) / 0.35, 0, 1); m_ = m_ * m_ * (3 - 2 * m_)
        rng_ = fbm(N, 4, 7, 61, ridged=True) ** 1.8 * m_
        h = dunes + rng_ * 1.2 + 0.1 * d
    h = (h - h.min()) / (h.max() - h.min())
    # a basin under the logo: the camera sits near the near edge, centre column
    cx, cy = 0.5, 0.86
    dist = np.sqrt(((xx - cx) * 1.0) ** 2 + ((yy - cy) * 1.4) ** 2)
    basin = np.clip((dist - 0.06) / 0.22, 0, 1); basin = basin * basin * (3 - 2 * basin)
    h = h * (0.12 + 0.88 * basin)
    h = erode(h.astype(np.float64).copy(), drops, 3)
    np.save(f'h_{kind}.npy', h.astype(np.float32))
    # quick hillshade preview
    gy, gx = np.gradient(h * 60)
    shade = np.clip((-gx * 0.6 + gy * 0.6 + 1) / np.sqrt(gx * gx + gy * gy + 1) * 0.6, 0, 1)
    from PIL import Image
    Image.fromarray((shade * 255).astype(np.uint8)).resize((512, 512)).save(f'hs_{kind}.png')
    print(kind, 'done')

if __name__ == '__main__':
    for k in sys.argv[1:]: make(k)
