#!/usr/bin/env python3
"""Build the four Skreed site font files and print the byte table.

Sources: google/fonts at commit 9710da1eacb3be272583c3224dcb70f9da6eadbb
(refs/heads/main on 2026-10-05, read with `git ls-remote`). The three source
TTFs are fetched from raw.githubusercontent.com at that commit and checked
against the sha256 below before anything is built, so the output is the same
on every machine that runs this script with the same fontTools.

Outputs, byte-identical in both places:
  public/fonts/*.woff2      served by Astro at /fonts/, referenced by the @font-face block
  docs/brand/fonts/*.woff2  served next to docs/brand/type-specimen.html
  scripts/fonts/manifest.txt  the byte table, sha256 of each file, metrics and
                              fallback overrides; the review skill diffs this file.

Run from the repo root:  python3 scripts/fonts/build.py
Needs fontTools 4.66 (pip install fonttools brotli). Measured here with 4.66.1.
"""
import hashlib, io, os, sys, urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

SHA = "9710da1eacb3be272583c3224dcb70f9da6eadbb"
RAW = f"https://raw.githubusercontent.com/google/fonts/{SHA}/"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "fonts", "src")          # gitignored download cache
OUTS = [os.path.join(ROOT, "public", "fonts"), os.path.join(ROOT, "docs", "brand", "fonts")]
MANIFEST = os.path.join(ROOT, "scripts", "fonts", "manifest.txt")

SOURCES = {
    "Poppins-Bold.ttf": ("ofl/poppins/Poppins-Bold.ttf",
        "983676516167748b74de6f4771fb384c664fd913acb8b471122ecacf5da5ea6c"),
    "OpenSans[wdth,wght].ttf": ("ofl/opensans/OpenSans%5Bwdth,wght%5D.ttf",
        "36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878"),
    "SourceSerif4[opsz,wght].ttf": ("ofl/sourceserif4/SourceSerif4%5Bopsz,wght%5D.ttf",
        "97b2d4da6e3cb494b5a1e66ae176914d852ccabef49e0c02c0df25f3e39aca0b"),
}

# Google's Latin range, verbatim from the fonts.googleapis.com css2 response.
LATIN = ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,"
         "U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")
# pyftsubset's default feature set drops tnum and pnum; keeping every feature
# inflates Source Serif 4 to about 76 KB. This list is the middle.
FEATS = ["kern", "liga", "locl", "ccmp", "mark", "mkmk", "tnum", "pnum", "lnum", "calt", "case"]

BUILDS = [
    # output name, source, axis location (None = static source)
    ("poppins-700-latin.woff2", "Poppins-Bold.ttf", None),
    ("open-sans-400-600-latin.woff2", "OpenSans[wdth,wght].ttf", {"wdth": 100, "wght": (400, 600)}),
    ("source-serif-4-400-opsz-latin.woff2", "SourceSerif4[opsz,wght].ttf", {"wght": 400}),
    ("source-serif-4-600-opsz20-latin.woff2", "SourceSerif4[opsz,wght].ttf", {"wght": 600, "opsz": 20}),
]

out = io.StringIO()
def log(*a):
    print(*a); print(*a, file=out)

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""): h.update(chunk)
    return h.hexdigest()

def fetch_sources():
    os.makedirs(SRC, exist_ok=True)
    for name, (rel, digest) in SOURCES.items():
        path = os.path.join(SRC, name)
        if not (os.path.exists(path) and sha256(path) == digest):
            req = urllib.request.Request(RAW + rel, headers={"User-Agent": "Mozilla/5.0 Chrome/120"})
            with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f: f.write(r.read())
        got = sha256(path)
        if got != digest:
            sys.exit(f"{name}: sha256 {got} does not match google/fonts@{SHA[:7]} ({digest})")
        log(f"source  {name:30s} sha256 {got[:16]}  google/fonts@{SHA[:7]}")

def build_one(src_path, loc):
    # recalcTimestamp=False keeps head.modified from the source, so two runs produce the same bytes.
    f = TTFont(src_path, recalcTimestamp=False)
    if loc:
        f = instancer.instantiateVariableFont(f, loc, inplace=False, optimize=True)
        buf = io.BytesIO(); f.save(buf); buf.seek(0); f = TTFont(buf, recalcTimestamp=False)
    o = subset.Options(); o.flavor = "woff2"; o.layout_features = FEATS; o.name_IDs = ["*"]
    o.notdef_outline = True; o.glyph_names = False; o.hinting = False; o.desubroutinize = True
    s = subset.Subsetter(o); s.populate(unicodes=subset.parse_unicodes(LATIN)); s.subset(f)
    f.flavor = "woff2"; buf = io.BytesIO(); f.save(buf); return buf.getvalue()

def metrics(path):
    f = TTFont(path, recalcTimestamp=False); upm = f["head"].unitsPerEm; os2 = f["OS/2"]; hh = f["hhea"]
    cmap = f.getBestCmap(); hm = f["hmtx"]
    feats = sorted({fr.FeatureTag for fr in f["GSUB"].table.FeatureList.FeatureRecord}) if "GSUB" in f else []
    axes = [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in f["fvar"].axes] if "fvar" in f else None
    digits = [hm[cmap[ord(c)]][0] for c in "0123456789"]
    return dict(upm=upm, xh=os2.sxHeight / upm, cap=os2.sCapHeight / upm,
                hhea=(hh.ascent / upm, hh.descent / upm, hh.lineGap / upm),
                typo=(os2.sTypoAscender / upm, os2.sTypoDescender / upm, os2.sTypoLineGap / upm),
                useTypo=bool(os2.fsSelection & (1 << 7)), digits=sorted(set(digits)),
                feats=feats, axes=axes, glyphs=len(f.getGlyphOrder()))

def avg_advance(path, text, loc=None):
    f = TTFont(path)
    if loc: f = instancer.instantiateVariableFont(f, loc, inplace=False)
    upm = f["head"].unitsPerEm; cmap = f.getBestCmap(); hm = f["hmtx"]
    t = [c for c in text if ord(c) in cmap]
    return sum(hm[cmap[ord(c)]][0] for c in t) / len(t) / upm

# The site's own copy, used as the width sample for size-adjust.
SAMPLE = ("Go beyond basic. 240 shades. One of them is yours. We started Skreed with one belief: colour is "
          "personal. Two people can love blue and mean entirely different shades. One wants the blue of a "
          "swimming pool at noon. The other wants the blue of a Hyderabad sky ten minutes after sunset. A black "
          "case says nothing about either of them. So we built a system instead of a print catalogue. Ten "
          "families, twenty-four shades in each, two hundred and forty in all, each one mixed, named and matched "
          "to the case in your hand. Pick the one that feels like yours. Reserve it before the doors open on "
          "November 1. Smart. Sleek. Skreed. Reserve my shade. Phone number. Needs ten digits. Privacy policy. "
          "Terms of service. Vivid Violets. Mauve, Bellini, Aquamarine.")
LIB = "/usr/share/fonts/truetype/liberation/"
FALLBACKS = [
    # fallback family name, weight, shipped file, instance location, Liberation clone of the local() face
    ("Poppins Fallback", 700, "poppins-700-latin.woff2", None, "LiberationSans-Bold.ttf"),
    ("Open Sans Fallback", 400, "open-sans-400-600-latin.woff2", {"wght": 400}, "LiberationSans-Regular.ttf"),
    ("Open Sans Fallback", 600, "open-sans-400-600-latin.woff2", {"wght": 600}, "LiberationSans-Bold.ttf"),
    ("Source Serif 4 Fallback", 400, "source-serif-4-400-opsz-latin.woff2", None, "LiberationSerif-Regular.ttf"),
    ("Source Serif 4 Fallback", 600, "source-serif-4-600-opsz20-latin.woff2", None, "LiberationSerif-Bold.ttf"),
]

def main():
    log(f"fontTools {__import__('fontTools').version}; google/fonts {SHA}")
    fetch_sources()
    for d in OUTS: os.makedirs(d, exist_ok=True)
    built = {}
    for name, src, loc in BUILDS:
        data = build_one(os.path.join(SRC, src), loc)
        for d in OUTS:
            with open(os.path.join(d, name), "wb") as f: f.write(data)
        built[name] = data
    log("\n== BYTES")
    log(f"{'file':42s} {'bytes':>7s} {'KB':>7s} {'KiB':>7s}  sha256")
    total = 0
    for name, data in built.items():
        n = len(data); total += n
        log(f"{name:42s} {n:7d} {n/1000:7.1f} {n/1024:7.1f}  {hashlib.sha256(data).hexdigest()}")
    log(f"{'total':42s} {total:7d} {total/1000:7.1f} {total/1024:7.1f}")
    cap = 120_000
    log(f"cap 120,000 bytes: {'ok' if total <= cap else 'OVER'} ({total/cap*100:.1f}%)")
    if total > cap: sys.exit("font payload over the 120 KB cap")

    log("\n== METRICS (em units; digits = distinct advances in font units)")
    for name in built:
        m = metrics(os.path.join(OUTS[0], name))
        log(f"{name}: glyphs {m['glyphs']}, upm {m['upm']}, x-height {m['xh']:.3f}, cap {m['cap']:.3f}, "
            f"useTypo {m['useTypo']}, typo asc/desc/gap {m['typo'][0]:.3f}/{m['typo'][1]:.3f}/{m['typo'][2]:.3f}, "
            f"digit advances {m['digits']}, axes {m['axes']}, features {','.join(m['feats'])}")

    log("\n== FALLBACK OVERRIDES (size-adjust = mean advance of the shipped file over the Liberation clone, "
        "on the site copy; overrides = typo metrics divided by size-adjust)")
    if not os.path.isdir(LIB):
        log("Liberation fonts not installed; skipped. Install fonts-liberation and re-run.")
    for fam, wght, file, loc, clone in FALLBACKS:
        if not os.path.isdir(LIB): break
        path = os.path.join(OUTS[0], file)
        sa = avg_advance(path, SAMPLE, loc) / avg_advance(LIB + clone, SAMPLE)
        m = metrics(path); asc, desc, gap = m["typo"] if m["useTypo"] else m["hhea"]
        log(f"{fam} {wght}: size-adjust {sa*100:.2f}%; ascent-override {asc/sa*100:.2f}%; "
            f"descent-override {abs(desc)/sa*100:.2f}%; line-gap-override {gap/sa*100:.2f}%")

    with open(MANIFEST, "w") as f: f.write(out.getvalue())
    print(f"\nwrote {os.path.relpath(MANIFEST, ROOT)}")

if __name__ == "__main__":
    main()
