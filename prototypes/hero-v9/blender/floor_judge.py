# Judge harness for floor_final: every number from the two rounds of feedback, measured the same way on igloo's
# four shots (reference) and on our post-processed hero preview (candidate, floor mask from <name>_depth.npy).
# usage: python3 judge.py cand_post.png            (reads cand_depth.npy next to cand.png when present)
import sys, os, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, label

SH = '/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/refsites/work/shots/'
IGL = ['igloo-hero-1280', 'igloo-hero-defaultpointer-1280', 'igloo-scrollout-1280', 'igloo-intro-7s-1280']
W709 = np.array([0.2126, 0.7152, 0.0722])
BANDS = [(2, 6), (6, 15), (15, 40), (40, 120)]
BANDS2 = [(2, 4), (4, 8), (8, 16), (16, 33), (33, 100)]

def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float64) / 255
def luma(c): return (c * W709).sum(-1)

def band_vars(L, bands):
    """variance of the FFT band-pass (wavelength in px) of a region, Hann-windowed, mean removed"""
    h, w = L.shape; a = L - L.mean()
    win = np.outer(np.hanning(h), np.hanning(w)); a = a * win
    F = np.fft.fft2(a); fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.fftfreq(w)[None, :]
    fr = np.sqrt(fx * fx + fy * fy); lam = np.where(fr > 0, 1 / np.maximum(fr, 1e-9), 1e9)
    P = np.abs(F) ** 2 / (a.size * (win ** 2).mean())
    out = []
    for lo, hi in bands:
        m = (lam >= lo) & (lam < hi); out.append(P[m].sum() / a.size)
    return np.array(out)

def band_shares(L, bands=BANDS):
    v = band_vars(L, bands); return v / v.sum(), v

def aniso(L, box):
    x0, y0, x1, y1 = box
    h3 = L - gaussian_filter(L, 3.0)
    gx = np.diff(h3, axis=1)[y0:y1, x0:x1 - 1]; gy = np.diff(h3, axis=0)[y0:y1 - 1, x0:x1]
    return (gy ** 2).mean() / (gx ** 2).mean()

def coherence(L, box, s_lo=1.0, s_hi=3.0, win=6.0):
    x0, y0, x1, y1 = box
    b = gaussian_filter(L, s_lo) - gaussian_filter(L, s_hi)
    gy, gx = np.gradient(b)
    Jxx = gaussian_filter(gx * gx, win); Jyy = gaussian_filter(gy * gy, win); Jxy = gaussian_filter(gx * gy, win)
    tr = Jxx + Jyy; det = Jxx * Jyy - Jxy * Jxy
    disc = np.sqrt(np.maximum(tr * tr / 4 - det, 0)); l1 = tr / 2 + disc; l2 = tr / 2 - disc
    coh = (l1 - l2) / np.maximum(l1 + l2, 1e-12)
    return coh[y0:y1, x0:x1].mean()

def hf(L, box, r=2.0, mask=None):
    x0, y0, x1, y1 = box
    if mask is None: d = (L - gaussian_filter(L, r))[y0:y1, x0:x1]
    else:
        m = mask.astype(float); g = gaussian_filter(L * m, r) / np.maximum(gaussian_filter(m, r), 1e-6)   # blur inside the floor only
        d = (L - g)[y0:y1, x0:x1][mask[y0:y1, x0:x1]]
    return d.std() * 255

def silhouette(mask):
    """first floor row per column (sky above): swings of the sigma-6 smoothed silhouette"""
    h, w = mask.shape; top = np.array([np.argmax(mask[:, c]) if mask[:, c].any() else h for c in range(w)]).astype(float)
    s = gaussian_filter(top, 6.0)
    d = np.diff(s); sgn = np.sign(d); ext = [0]
    for i in range(1, len(d)):
        if sgn[i] != 0 and sgn[i] != sgn[ext[-1]] and sgn[ext[-1]] != 0: ext.append(i)
        elif sgn[ext[-1]] == 0: ext[-1] = i
    ext.append(len(s) - 1)
    sw = np.abs(np.diff(s[ext]))
    return top, s, int((sw >= 3).sum()), int((sw >= 8).sum())

def dark_blobs(L, mask, thr=90 / 255, minpx=20):
    lab, n = label((L < thr) & mask); out = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(ys) < minpx: continue
        out.append((int(xs.mean()), int(ys.mean()), len(ys), float(L[ys, xs].min() * 255)))
    return out

DEPTH = None
def report(name, c, mask, is_ref=False):
    L = luma(c); R = {}
    fl = mask.copy()
    # A. near window
    x0, y0, x1, y1 = (300, 600, 700, 800); win = L[y0:y1, x0:x1]; cw = c[y0:y1, x0:x1].reshape(-1, 3); Lw = win.ravel()
    p10, p50 = np.percentile(Lw, [10, 50]); lit = cw[Lw > p50].mean(0); dk = cw[Lw < p10].mean(0)
    g2 = gaussian_filter(L, 2.0); g16 = gaussian_filter(L, 16.0)
    hp2 = (L - g2)[y0:y1, x0:x1].std() / win.mean(); mid = (g2 - g16)[y0:y1, x0:x1].std() / win.mean()
    h3 = (L - gaussian_filter(L, 3.0))[y0:y1, x0:x1]; sk = ((h3 - h3.mean()) ** 3).mean() / h3.std() ** 3
    R['near'] = 'mean %.3f/%.3f/%.3f p1/50/99 %.3f/%.3f/%.3f litB/R %.3f darkB/R %.3f hp2 %.4f mid %.4f skew %+.2f aniso %.2f' % (
        *cw.mean(0), *np.percentile(Lw, [1, 50, 99]), lit[2] / lit[0], dk[2] / dk[0], hp2, mid, sk, aniso(L, (300, 600, 700, 800)))
    # B. right bank and floor highlights
    rb = L[520:760, 1100:1280][fl[520:760, 1100:1280]] * 255
    flo = L[fl] * 255
    R['rbank'] = 'right bank (1100-1280,520-760) mean %.0f p90 %.0f p99 %.0f | floor p99 %.0f (<=185)' % (rb.mean(), np.percentile(rb, 90), np.percentile(rb, 99), np.percentile(flo, 99))
    # D. highlight hue
    cf = c[fl]; Lf = luma(cf); t = cf[Lf >= np.percentile(Lf, 95)].mean(0) * 255; m = cf[(Lf > np.percentile(Lf, 40)) & (Lf < np.percentile(Lf, 60))].mean(0) * 255
    R['hue'] = 'top5%% rgb %.0f,%.0f,%.0f G-R %+.1f B-R %+.1f | mid rgb G-R %+.1f B-R %+.1f' % (*t, t[1] - t[0], t[2] - t[0], m[1] - m[0], m[2] - m[0])
    # E. shadow grain
    R['lbank'] = 'left bank (0-300,560-700) HF2 %.1f (5.5-6.0) mean %.0f' % (hf(L, (0, 300, 560, 700), 2.0, fl), L[560:700, 0:300].mean() * 255)
    # F. mid band shares
    mb = (440, 560) if is_ref else (520, 640)
    sh, _ = band_shares(L[mb[0]:mb[1], 0:1280]); shL, _ = band_shares(L[mb[0]:mb[1], 0:440]); shR, _ = band_shares(L[mb[0]:mb[1], 840:1280])
    R['midband'] = 'mid band y%d-%d shares 2-6 %.3f 6-15 %.3f 15-40 %.3f 40-120 %.3f (L %.3f/%.3f R %.3f/%.3f) [2-6<=0.08, 40-120>=0.35]' % (*mb, *sh, shL[0], shL[3], shR[0], shR[3])
    # G/H. foreground streaks
    sf, vf = band_shares(L[620:800, 0:1280]); sf2 = band_shares(L[620:800, 0:1280], BANDS2)[0]
    R['fg'] = 'fg y620-800 shares 2-6 %.3f 6-15 %.3f 15-40 %.3f 40-120 %.3f [0.25-0.30, -, <=0.18] | coh fg %.2f (>=0.6) right swell %.2f' % (
        *sf, coherence(L, (100, 620, 1180, 800)), coherence(L, (900, 440, 1280, 620) if is_ref else (900, 520, 1280, 700)))
    # I. silhouette
    if not is_ref:
        top, s, n3, n8 = silhouette(fl)
        R['sil'] = 'silhouette swings >=3px %d, >=8px %d (<=4) ; horizon row min/mean %.0f/%.0f' % (n3, n8, s.min(), s.mean())
        # J. far ridge: the 40 rows under the silhouette
        far = np.zeros_like(fl); cols = np.arange(1280)
        for cc in cols:
            t_ = int(top[cc]);
            if t_ < 800: far[t_ + 4:min(t_ + 44, 800), cc] = True
        far &= fl & (DEPTH > 60); Lf8 = L[far] * 255; hff = (L - g2)[far].std() * 255
        ext = [(int(i), int(s[i])) for i in range(1, 1279) if (s[i] - s[i - 1]) * (s[i + 1] - s[i]) < 0]
        R['silx'] = 'silhouette extrema (x,row): ' + ' '.join('%d:%d' % e for e in ext[:30])
        ee = [0] + [e[0] for e in ext] + [1279]; R['silx'] += ' | swings>=8: ' + ' '.join('%d-%d:%.0f' % (ee[i], ee[i + 1], abs(s[ee[i + 1]] - s[ee[i]])) for i in range(len(ee) - 1) if abs(s[ee[i + 1]] - s[ee[i]]) >= 8)
        R['far'] = 'far ridge band mean %.0f (>=116) std %.1f (~14) HF2 %.2f (<=1.8-3) | crest x900-1280 y420-500 HF2 %.2f (<=3)' % (
            Lf8.mean(), Lf8.std(), hff, hf(L, (900, 420, 1280, 500), 2.0, fl))
        R['blobs'] = 'dark blobs (<90, >=20px): ' + ', '.join('(%d,%d) %dpx min %.0f' % b for b in dark_blobs(L, fl)[:12])
    else:
        far = np.zeros_like(fl); far[180:300, 0:380] = True; Lf8 = L[far] * 255
        R['far'] = 'far hills (0-380,180-300) mean %.0f std %.1f HF2 %.2f' % (Lf8.mean(), Lf8.std(), (L - g2)[far].std() * 255)
    # L. anisotropy per row band
    R['aniso'] = 'aniso rows 500/600/700: %.2f %.2f %.2f  near-window %.2f  bottom x200-500 %.2f  (3.6-4.2)' % (
        aniso(L, (0, 500, 1280, 600)), aniso(L, (0, 600, 1280, 700)), aniso(L, (0, 700, 1280, 800)), aniso(L, (300, 600, 700, 800)), aniso(L, (200, 700, 500, 800)))
    # M. mid field tiles rows 470-600
    tiles = [L[470:600, x:x + 100][fl[470:600, x:x + 100]].mean() if fl[470:600, x:x + 100].any() else np.nan for x in range(0, 1280, 100)]
    R['tiles'] = 'tiles y470-600 means: ' + ' '.join('%.2f' % t for t in tiles) + ' | left x0-300 p50 %.3f (0.42) right x1100-1280 mean %.3f (0.51-0.55) p99 x950-1250 %.3f (<=0.73) max tile %.2f (<=0.57)' % (
        np.median(L[470:600, 40:370]), L[470:600, 1100:1280].mean(), np.percentile(L[470:600, 950:1250], 99), np.nanmax(tiles))
    # left slope detail
    R['lslope'] = 'left slope x0-300 y470-600 hp2rel %.4f (0.060) mid(8-33) share %.3f' % ((L - g2)[470:600, 0:300].std() / L[470:600, 0:300].mean(), band_shares(L[470:600, 0:300], BANDS2)[0][3])
    # N. near strip east
    Le = L[600:800, 700:1050]; ce = c[600:800, 700:1050].reshape(-1, 3); Lev = Le.ravel(); dk = ce[Lev < np.percentile(Lev, 10)].mean(0)
    v2 = band_vars(Le, BANDS2)
    R['east'] = 'east strip x700-1050 y600-800 mean %.3f/%.3f/%.3f p1 %.3f darkB/R %.3f | band vars 16-33 %.2e 33-100 %.2e (2-4 %.2e)' % (*ce.mean(0), np.percentile(Lev, 1), dk[2] / dk[0], v2[3], v2[4], v2[0])
    # O. bottom 100 px grain
    R['bottom'] = 'bottom y700-800 hp2rel %.4f (0.0564) right corner x1100-1280 %.4f' % ((L - g2)[700:800].std() / L[700:800].mean(), (L - g2)[700:800, 1100:1280].std() / L[700:800, 1100:1280].mean())
    # P. mid-centre around the pad
    mc = L[480:600, 400:900] if not is_ref else L[440:560, 0:380]
    v = band_vars(mc, BANDS2)
    R['midc'] = '%s band vars 2-4 %.2e (ref flanks 0.7-1.0e-4) 16-33 %.2e 33-100 %.2e' % ('mid-centre x400-900 y480-600' if not is_ref else 'ref flank x0-380 y440-560', v[0], v[3], v[4])
    print('=== %s' % name)
    for k in R: print('  %-8s %s' % (k, R[k]))
    return R

if __name__ == '__main__':
    if '--ref' in sys.argv or len(sys.argv) == 1:
        for f in IGL:
            c = load(SH + f + '.png'); m = np.ones(c.shape[:2], bool); m[:380] = False; m[150:560, 380:900] = False
            report(f, c, m, True)
    for p in sys.argv[1:]:
        if p.startswith('--'): continue
        c = load(p); base = p.replace('_post.png', '.png'); dp = os.path.splitext(base)[0] + '_depth.npy'
        DEPTH = np.load(dp) if os.path.exists(dp) else np.full(c.shape[:2], 1e9)
        m = np.isfinite(DEPTH)
        m[150:530, 460:820] = False
        report(os.path.basename(p), c, m, False)
