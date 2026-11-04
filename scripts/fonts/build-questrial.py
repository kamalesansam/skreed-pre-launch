#!/usr/bin/env python3
"""Build section 4's font file, Questrial (Sam, 2026-11-04: "change the font over there as well, use any font from this
pdf"; his "Skreed Pre-Launch" design sets its body copy and its small capitals labels in Questrial; exception
E-S4-font, amended, docs/specs/section-4-pictures.md).

Like build-inter.py, it loads build.py for its recipe (build_one(), metrics(), avg_advance(), SAMPLE, LATIN, FEATS) and
never calls its main(), so no other file in public/fonts/ or docs/brand/fonts/ is written.

Source: Questrial-Regular.ttf, version 2.000 from googlefonts/questrial (SIL Open Font License 1.1, its name records 0,
13 and 14 say so), the copy already on the build machine in Sam's label renderer, given by path and checked against the
sha256 below before anything is built. Nothing is fetched.

Outputs, byte-identical in both places, plus the licence and the manifest section:
  public/fonts/questrial-400-latin.woff2      served at /fonts/, declared in src/styles/fonts.css
  docs/brand/fonts/questrial-400-latin.woff2  next to the other faces' docs copies
  docs/brand/fonts/questrial-OFL.txt          the licence (the OFL travels with a modified version): the OFL 1.1 text
                                              of inter-OFL.txt under Questrial's own copyright line
  scripts/fonts/manifest-questrial.txt        the record, a file of its own (manifest.txt's sections are pinned by
                                              tests/unit/about.test.ts, and build-inter.py rewrites its end)

Run from the repo root:  python3 -I scripts/fonts/build-questrial.py "<path to Questrial-Regular.ttf>"
"""
import hashlib, importlib.util, io, os, sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("skreed_fonts_build", os.path.join(HERE, "build.py"))
B = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(B)

from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = B.ROOT
NAME = "questrial-400-latin.woff2"
LICENCE = "questrial-OFL.txt"
CAP = 40_000
DIGEST = "0ee7f2debabb13773fd38468b31820e11fca202a8f98c4d80b6ffcb796899b6f"
COPYRIGHT = "Copyright 2011 The Questrial Project Authors (https://github.com/googlefonts/questrial)"
HEAD = ("== SECTION 4 (the scenes' lines in Questrial, Sam 2026-11-04; exception E-S4-font, amended; outside the 120,000 "
        "byte cap of the three brand faces)")
# the characters the section draws: printable ASCII, the no-break space, the curly quotes and the ellipsis
NEED = [*range(0x20, 0x7F), 0xA0, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026]
ARIAL = ["/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf",
         "C:/Windows/Fonts/arial.ttf"]

out = io.StringIO()
def log(*a):
    print(*a); print(*a, file=out)

def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, "/")

def check(data):
    f = TTFont(io.BytesIO(data), recalcTimestamp=False)
    latin = set(subset.parse_unicodes(B.LATIN)); cmap = set(f.getBestCmap())
    gsub = sorted({r.FeatureTag for r in f["GSUB"].table.FeatureList.FeatureRecord}) if "GSUB" in f else []
    gpos = sorted({r.FeatureTag for r in f["GPOS"].table.FeatureList.FeatureRecord}) if "GPOS" in f else []
    names = sorted({n.nameID for n in f["name"].names})
    problems = []
    if "fvar" in f: problems.append("a variable font")
    if not cmap <= latin: problems.append(f"code points outside LATIN: {sorted(cmap - latin)[:12]}")
    miss = [c for c in NEED if c not in cmap]
    if miss: problems.append(f"missing code points {[hex(c) for c in miss]}")
    extra = [t for t in gsub + gpos if t not in B.FEATS]
    if extra: problems.append(f"features outside FEATS: {extra}")
    if not {0, 13, 14} <= set(names): problems.append(f"name records {names} lack 0, 13 or 14")
    if f["head"].macStyle & 2 or f["OS/2"].fsSelection & 1: problems.append("an italic bit is set")
    if problems: sys.exit("questrial: " + "; ".join(problems) + "; nothing was written")
    return dict(cmap=cmap, gsub=gsub, gpos=gpos, names=names)

def main():
    if len(sys.argv) < 2: sys.exit('usage: python3 -I scripts/fonts/build-questrial.py "<path to Questrial-Regular.ttf>"')
    src = sys.argv[1]
    got = B.sha256(src)
    if got != DIGEST: sys.exit(f"questrial: {src} has sha256 {got}, not {DIGEST}; nothing was written")
    clone = next((p for p in ARIAL if os.path.exists(p)), None)
    if not clone: sys.exit("questrial: no metric clone of Arial (Liberation Sans or Arial); nothing was written")

    log(HEAD)
    log(f"fontTools {__import__('fontTools').version}")
    log(f"source  Questrial-Regular.ttf  {os.path.getsize(src)} bytes  sha256 {DIGEST}  googlefonts/questrial v2.000 "
        f"(OFL 1.1 by its name records 0, 13 and 14), the copy in Sam's label renderer, not fetched")
    data = B.build_one(src, None)
    if len(data) > CAP: sys.exit(f"questrial: {len(data)} bytes, over the {CAP:,} byte line; nothing was written")
    facts = check(data)
    with open(os.path.join(B.OUTS[1], "inter-OFL.txt"), encoding="utf-8", newline="") as f: ofl = f.read()
    first, rest = ofl.split("\n", 1)
    if not first.startswith("Copyright"): sys.exit("questrial: inter-OFL.txt does not open with its copyright line")
    for d in B.OUTS:
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, NAME), "wb") as f: f.write(data)
    with open(os.path.join(B.OUTS[1], LICENCE), "w", encoding="utf-8", newline="") as f: f.write(COPYRIGHT + "\n" + rest)

    n = len(data)
    log("build.py's build_one: WOFF2, LATIN, FEATS, every name record, no hinting, the notdef outline, the source's head.modified")
    log(f"{'file':42s} {'bytes':>7s} {'KB':>7s} {'KiB':>7s}  sha256")
    log(f"{NAME:42s} {n:7d} {n/1000:7.1f} {n/1024:7.1f}  {hashlib.sha256(data).hexdigest()}")
    log(f"line {CAP:,} bytes: ok ({n/CAP*100:.1f}%); written to public/fonts/ and docs/brand/fonts/, byte-identical; "
        f"the licence {LICENCE}: inter-OFL.txt's OFL 1.1 text under \"{COPYRIGHT}\"")
    m = B.metrics(os.path.join(B.OUTS[0], NAME))
    log(f"{NAME}: glyphs {m['glyphs']}, upm {m['upm']}, x-height {m['xh']:.3f}, cap {m['cap']:.3f}, "
        f"useTypo {m['useTypo']}, typo asc/desc/gap {m['typo'][0]:.3f}/{m['typo'][1]:.3f}/{m['typo'][2]:.3f}, "
        f"digit advances {m['digits']}, features {','.join(m['feats'])}")
    log(f"checks: cmap {len(facts['cmap'])} code points, all in LATIN; GSUB {','.join(facts['gsub']) or 'none'}; "
        f"GPOS {','.join(facts['gpos']) or 'none'}; name IDs {','.join(map(str, facts['names']))}; italic bits off")
    asc, desc, gap = m["typo"] if m["useTypo"] else m["hhea"]
    sa = B.avg_advance(os.path.join(B.OUTS[0], NAME), B.SAMPLE) / B.avg_advance(clone, B.SAMPLE)
    log(f"Questrial Fallback 400: size-adjust {sa*100:.2f}%; ascent-override {asc/sa*100:.2f}%; "
        f"descent-override {abs(desc)/sa*100:.2f}%; line-gap-override {gap/sa*100:.2f}%")
    log(f"clone  {clone}, on build.py's SAMPLE (Liberation Sans matches Arial's advance widths by design)")
    log('via python3 -I scripts/fonts/build-questrial.py "<path to Questrial-Regular.ttf>", fontTools and brotli')

    path = os.path.join(HERE, "manifest-questrial.txt")
    with open(path, "w", encoding="utf-8", newline="\n") as f: f.write(out.getvalue())
    print(f"\nwrote {rel(os.path.join(B.OUTS[0], NAME))}, {rel(os.path.join(B.OUTS[1], NAME))}, "
          f"{rel(os.path.join(B.OUTS[1], LICENCE))} and {rel(path)}")

if __name__ == "__main__":
    main()
