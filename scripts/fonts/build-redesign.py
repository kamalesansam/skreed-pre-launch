#!/usr/bin/env python3
"""Build the redesign's four display faces (Sam, 2026-11-09, on the paid faces of his "Skreed Pre-Launch" design:
"Free look-alikes", the option that read "I download three free open-licence fonts from github.com/google/fonts (one
TTF each, under 1 MB) and host cut-down copies: Rubik Glitch (the PDF's own font for DIFFERENT), Krona One for MATCH
ESSENTIALS, and a thin script for grey, blue, brown"; exception E-RD-font, docs/specs/redesign.md).

  Rubik         the hero's "DIFFERENT" at rest, in the Black weight           capitals and the space
  Rubik Glitch  the design's own face for the same word, drawn only while it glitches    capitals and the space
  Krona One     stands in for Monument Extended in "MATCH ESSENTIALS"      capitals and the space
  WindSong      stands in for Westonia on the three blobs                  lower case and the space

Rubik came last, the same day. Sam, of the word: "use that same font which was think and different for the word
DIFFERENT, which was there earlier, just without the distorted part", and asked to fetch it, "Yes, download". Rubik
Glitch is Rubik Black cut into slices, with the same advances letter for letter, so the plain word stands exactly where
the torn one does. Rubik is a variable font in the source: its wght axis is pinned at 900 here (PINS).

Each is cut to the letters its one place draws, so the four weigh a few KB together. Sources: google/fonts at the
commit build.py pins, fetched once into scripts/fonts/src/ (git-ignored) and checked against the sha256 below before
anything is built. Like build-inter.py and build-questrial.py this script never calls build.py's main().

Krona One's licence reserves the names "Krona" and "Krona One" for the original, so its cut-down copy is renamed in
its own name table ("Skreed Wide") and declared under that name; the other three declare no reserved name.

Outputs, byte-identical in both places, plus the licences and the manifest:
  public/fonts/{rubik-glitch-400-caps,skreed-wide-400-caps,windsong-400-lower}.woff2   served at /fonts/
  docs/brand/fonts/ the same three, and rubik-glitch-OFL.txt, krona-one-OFL.txt, windsong-OFL.txt
  scripts/fonts/manifest-redesign.txt   bytes, sha256, metrics and the advance widths the page's layout is set from

Run from the repo root:  python3 -I scripts/fonts/build-redesign.py
"""
import hashlib, importlib.util, io, os, shutil, sys, urllib.request

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("skreed_fonts_build", os.path.join(HERE, "build.py"))
B = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(B)

from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer

ROOT = B.ROOT
CAPS = [0x20, *range(0x41, 0x5B)]
LOWER = [0x20, *range(0x61, 0x7B)]
HEAD = ("== THE REDESIGN (four display faces cut to their letters, Sam 2026-11-09; exception E-RD-font; outside the "
        "120,000 byte cap of the three brand faces)")
# output, source, its path in google/fonts, sha256, code points, features kept, cap in bytes, new family name or None,
# licence source and licence output, words whose advance the manifest records
FACES = [
    ("rubik-900-caps.woff2", "Rubik[wght].ttf", "ofl/rubik/Rubik%5Bwght%5D.ttf",
     "1b3a7437ba2af80e465e773ed60c5036d1ba6ace492d89046dbcf18fb31e4e88", CAPS, ["kern"], 12_000, None,
     ("ofl/rubik/OFL.txt", "Rubik-OFL.txt", "rubik-OFL.txt"), ["DIFFERENT"]),
    ("rubik-glitch-400-caps.woff2", "RubikGlitch-Regular.ttf", "ofl/rubikglitch/RubikGlitch-Regular.ttf",
     "260245012483d56956269100ebece747aa95b4b67e5a9411a81a36e91f55e653", CAPS, ["kern"], 30_000, None,
     ("ofl/rubikglitch/OFL.txt", "RubikGlitch-OFL.txt", "rubik-glitch-OFL.txt"), ["DIFFERENT"]),
    ("skreed-wide-400-caps.woff2", "KronaOne-Regular.ttf", "ofl/kronaone/KronaOne-Regular.ttf",
     "273463916f96a4707e697e3013d955cde8154b4e6d635a55132e7a12f276534c", CAPS, ["kern"], 12_000, "Skreed Wide",
     ("ofl/kronaone/OFL.txt", "KronaOne-OFL.txt", "krona-one-OFL.txt"), ["MATCH", "ESSENTIALS"]),
    ("windsong-400-lower.woff2", "WindSong-Regular.ttf", "ofl/windsong/WindSong-Regular.ttf",
     "44bea4f8cdb818e9df6eef5334c63915acb7f1877b239debb373277d16b0aac2", LOWER, ["kern", "liga", "calt"], 16_000, None,
     ("ofl/windsong/OFL.txt", "WindSong-OFL.txt", "windsong-OFL.txt"), ["grey", "blue", "brown"]),
]

# a variable source's axes, pinned before the cut
PINS = {"Rubik[wght].ttf": {"wght": 900}}

out = io.StringIO()
def log(*a):
    print(*a); print(*a, file=out)


def fetch(rel, name):
    path = os.path.join(B.SRC, name)
    if not os.path.exists(path):
        os.makedirs(B.SRC, exist_ok=True)
        req = urllib.request.Request(B.RAW + rel, headers={"User-Agent": "Mozilla/5.0 Chrome/120"})
        with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f: f.write(r.read())
    return path


def cut(src, points, feats, family):
    f = TTFont(src, recalcTimestamp=False)
    pin = PINS.get(os.path.basename(src))
    if pin: f = instancer.instantiateVariableFont(f, pin, updateFontNames=True)
    o = subset.Options()
    o.layout_features = feats
    o.hinting = False
    o.desubroutinize = True
    o.notdef_outline = True
    o.name_IDs = ["*"]
    o.name_languages = ["*"]
    o.flavor = "woff2"
    s = subset.Subsetter(o)
    s.populate(unicodes=points)
    s.subset(f)
    if family:
        # the licence's reserved names stay with the original: the modified copy carries its own
        ps = family.replace(" ", "")
        for n in f["name"].names:
            if n.nameID in (1, 16): n.string = family
            elif n.nameID == 4: n.string = family + " Regular"
            elif n.nameID == 6: n.string = ps + "-Regular"
            elif n.nameID == 3: n.string = ps + "-Regular;cut from Krona One for skreed.shop"
    f.flavor = "woff2"
    buf = io.BytesIO(); f.save(buf)
    return buf.getvalue()


def facts(data, words):
    f = TTFont(io.BytesIO(data), recalcTimestamp=False)
    upm = f["head"].unitsPerEm; cmap = f.getBestCmap(); hmtx = f["hmtx"]; os2 = f["OS/2"]
    adv = {w: sum(hmtx[cmap[ord(c)]][0] for c in w) / upm for w in words}
    names = {n.nameID: n.toUnicode() for n in f["name"].names if n.nameID in (1, 4, 6)}
    return dict(glyphs=len(f.getGlyphOrder()), upm=upm, cap=getattr(os2, "sCapHeight", 0) / upm, xh=getattr(os2, "sxHeight", 0) / upm,
                asc=os2.sTypoAscender / upm, desc=os2.sTypoDescender / upm, hasc=f["hhea"].ascent / upm, hdesc=f["hhea"].descent / upm,
                adv=adv, names=names, points=sorted(cmap))


def main():
    log(HEAD)
    log(f"fontTools {__import__('fontTools').version}; sources google/fonts@{B.SHA[:7]} (the commit build.py pins), OFL 1.1")
    rows = []
    for name, src_name, rel, digest, points, feats, cap, family, (lic_rel, lic_src, lic_out), words in FACES:
        src = fetch(rel, src_name)
        got = B.sha256(src)
        if got != digest: sys.exit(f"redesign fonts: {src_name} has sha256 {got}, not {digest}; nothing was written")
        data = cut(src, points, feats, family)
        if len(data) > cap: sys.exit(f"redesign fonts: {name} is {len(data)} bytes, over its {cap:,} byte line; nothing was written")
        fx = facts(data, words)
        if set(fx["points"]) != set(points): sys.exit(f"redesign fonts: {name} holds {fx['points']}, not the letters asked for")
        lic = fetch(lic_rel, lic_src)
        rows.append((name, src_name, os.path.getsize(src), digest, data, fx, family, lic, lic_out, feats))
    for name, src_name, size, digest, data, fx, family, lic, lic_out, feats in rows:
        for d in B.OUTS:
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name), "wb") as f: f.write(data)
        shutil.copyfile(lic, os.path.join(B.OUTS[1], lic_out))
        n = len(data)
        log(f"source  {src_name}  {size} bytes  sha256 {digest}")
        log(f"{name:32s} {n:6d} bytes {n/1000:5.1f} KB  sha256 {hashlib.sha256(data).hexdigest()}")
        log(f"  glyphs {fx['glyphs']}, upm {fx['upm']}, cap {fx['cap']:.3f}, x-height {fx['xh']:.3f}, typo asc/desc {fx['asc']:.3f}/{fx['desc']:.3f}, "
            f"hhea asc/desc {fx['hasc']:.3f}/{fx['hdesc']:.3f}, features {','.join(feats)}, names {fx['names']}"
            + (f", renamed to \"{family}\" (the licence reserves the original's names)" if family else ""))
        log("  advances, in em: " + ", ".join(f"{w} {a:.4f}" for w, a in fx["adv"].items()) + f"; licence {lic_out}")
    total = sum(len(r[4]) for r in rows)
    log(f"{len(rows)} files, {total} bytes ({total/1000:.1f} KB); written to public/fonts/ and docs/brand/fonts/, byte-identical")
    log("via python3 -I scripts/fonts/build-redesign.py, fontTools and brotli")
    path = os.path.join(HERE, "manifest-redesign.txt")
    with open(path, "w", encoding="utf-8", newline="\n") as f: f.write(out.getvalue())


if __name__ == "__main__":
    main()
