#!/usr/bin/env python3
"""Build the About page's one font file, Inter (exception E-About-font, docs/specs/about.md sections 11 and 12).

Inter is built on its own, never by re-running build.py: build.py's main() rewrites manifest.txt from scratch (it would
drop the two IBM Plex Mono sections) and rewrites the four brand files. This script loads build.py for its recipe (the
google/fonts commit, RAW, sha256(), build_one(), metrics(), avg_advance(), SAMPLE, LATIN, FEATS) and never calls its
main(), so the six existing files in public/fonts/ and the four in docs/brand/fonts/ are never written.

Source: google/fonts at the commit build.py pins (9710da1), ofl/inter/Inter[opsz,wght].ttf and ofl/inter/OFL.txt,
fetched from raw.githubusercontent.com as build.py fetches, cached in scripts/fonts/src/ (git-ignored) and checked
against the sha256 below before anything is built. A cached file that does not match stops the build; it is never
fetched over silently. (When the digests were pinned, 2026-11-02, the bytes matched the commit's git blob ids, which the
manifest section records.)

Outputs, byte-identical in both places, plus the licence and the manifest section:
  public/fonts/inter-400-700-latin.woff2      served at /fonts/, preloaded by src/pages/about.astro
  docs/brand/fonts/inter-400-700-latin.woff2  next to the brand faces' docs copies
  docs/brand/fonts/inter-OFL.txt              the licence, byte for byte (the OFL travels with a modified version)
  scripts/fonts/manifest.txt                  only its own section, "== ABOUT PAGE" (a later section, SECTION INDEX, is kept)

Run from the repo root:  python3 scripts/fonts/build-inter.py   (python on Windows). Needs fontTools 4.66.1 and brotli,
as build.py (pip install fonttools==4.66.1 brotli). Two runs write the same bytes.
"""
import hashlib, importlib.util, io, os, sys, urllib.request

sys.dont_write_bytecode = True                   # loading build.py must leave no __pycache__ in the repository
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("skreed_fonts_build", os.path.join(HERE, "build.py"))
B = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(B)   # loaded by path, so python -I works too

from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = B.ROOT
NAME = "inter-400-700-latin.woff2"
LICENCE = "inter-OFL.txt"
CAP = 50_000                                     # docs/specs/about.md section 6: the Inter file, at most 50,000 bytes
LOC = {"wght": (400, 700), "opsz": 14}           # 400 to 700 kept, the text optical size pinned (its minimum)
SOURCES = {
    # cache name: (path in google/fonts, sha256, git blob id at the commit)
    "Inter[opsz,wght].ttf": ("ofl/inter/Inter%5Bopsz,wght%5D.ttf",
        "29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031", "047c92f6e2212473dc436020afed689527076d44"),
    "Inter-OFL.txt": ("ofl/inter/OFL.txt",
        "5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57", "21f6aff961064c2e429f570995e446bcdd555422"),
}
HEAD = ("== ABOUT PAGE (the brief, 2026-11-02; exception E-About-font; outside the 120,000 byte cap of the three brand "
        "faces)")
# the characters the page must draw: printable ASCII, the no-break space, the curly quotes and the ellipsis
NEED = [*range(0x20, 0x7F), 0xA0, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026]
# the fallback's local() face and its metric clone: Liberation Sans where it is installed (build.py's LIB), else Arial
# itself, whose advance widths Liberation Sans matches by design, so the ratios are the same
WIN = "C:/Windows/Fonts/"
FALLBACKS = [("Inter Fallback", 400, False), ("Inter Fallback", 600, True), ("Inter Fallback", 700, True)]

out = io.StringIO()
def log(*a):
    print(*a); print(*a, file=out)

def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, "/")

def fetch():
    os.makedirs(B.SRC, exist_ok=True)
    paths = {}
    for name, (path_in_repo, digest, _blob) in SOURCES.items():
        path = os.path.join(B.SRC, name)
        if not os.path.exists(path):
            req = urllib.request.Request(B.RAW + path_in_repo, headers={"User-Agent": "Mozilla/5.0 Chrome/120"})
            with urllib.request.urlopen(req, timeout=120) as r: data = r.read()
            with open(path + ".part", "wb") as f: f.write(data)
            os.replace(path + ".part", path)
        got = B.sha256(path)
        if got != digest:
            sys.exit(f"{name}: sha256 {got} does not match google/fonts@{B.SHA[:7]} {path_in_repo} ({digest}); "
                     f"nothing was written. Delete {rel(path)} to fetch it again.")
        paths[name] = path
    return paths

def clone(bold):
    if os.path.isdir(B.LIB):
        return B.LIB + ("LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf")
    p = WIN + ("arialbd.ttf" if bold else "arial.ttf")
    return p if os.path.exists(p) else None

def ranges(cps):
    """[(lo, hi)] of the sorted code points, for the manifest"""
    out_, start = [], None
    for c in sorted(cps):
        if start is None: start = prev = c; continue
        if c == prev + 1: prev = c; continue
        out_.append((start, prev)); start = prev = c
    if start is not None: out_.append((start, prev))
    return out_

def check(data):
    """the file's own facts, read back with fontTools (docs/specs/about.md AC3); exits before anything is written"""
    f = TTFont(io.BytesIO(data), recalcTimestamp=False)
    latin = set(subset.parse_unicodes(B.LATIN))
    cmap = set(f.getBestCmap())
    axes = [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in f["fvar"].axes] if "fvar" in f else None
    gsub = sorted({r.FeatureTag for r in f["GSUB"].table.FeatureList.FeatureRecord}) if "GSUB" in f else []
    gpos = sorted({r.FeatureTag for r in f["GPOS"].table.FeatureList.FeatureRecord}) if "GPOS" in f else []
    names = sorted({n.nameID for n in f["name"].names})
    problems = []
    if axes != [("wght", 400.0, 400.0, 700.0)]: problems.append(f"axes {axes}, not wght 400 to 700 alone")
    if not cmap <= latin: problems.append(f"code points outside LATIN: {sorted(cmap - latin)[:12]}")
    miss = [c for c in NEED if c not in cmap]
    if miss: problems.append(f"missing code points {[hex(c) for c in miss]}")
    extra = [t for t in gsub + gpos if t not in B.FEATS]
    if extra: problems.append(f"features outside FEATS: {extra}")
    if not {0, 13, 14} <= set(names): problems.append(f"name records {names} lack 0, 13 or 14")
    if f["head"].macStyle & 2 or f["OS/2"].fsSelection & 1: problems.append("an italic bit is set")
    if problems: sys.exit("inter: " + "; ".join(problems) + "; nothing was written")
    return dict(cmap=cmap, gsub=gsub, gpos=gpos, names=names)

def main():
    log(HEAD)
    log(f"fontTools {__import__('fontTools').version}; google/fonts {B.SHA}")
    src = fetch()
    for name, (path_in_repo, digest, blob) in SOURCES.items():
        n = os.path.getsize(src[name]); shown = path_in_repo.replace("%5B", "[").replace("%5D", "]")
        kind = "licence" if name.endswith(".txt") else "source "
        tail = f", copied byte for byte to docs/brand/fonts/{LICENCE}" if kind == "licence" else ""
        log(f"{kind} {name:22s} {n:7d} bytes  sha256 {digest}  google/fonts@{B.SHA[:7]} {shown} (git blob {blob}){tail}")
    clones = {bold: clone(bold) for bold in (False, True)}
    if None in clones.values():
        sys.exit("inter: no metric clone of Arial (Liberation Sans in /usr/share/fonts/truetype/liberation/, or "
                 "C:/Windows/Fonts/arial.ttf and arialbd.ttf); nothing was written")

    data = B.build_one(src["Inter[opsz,wght].ttf"], LOC)
    if len(data) > CAP: sys.exit(f"inter: {len(data)} bytes, over the {CAP:,} byte line; nothing was written")
    facts = check(data)
    with open(src["Inter-OFL.txt"], "rb") as f: licence = f.read()
    for d in B.OUTS:
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, NAME), "wb") as f: f.write(data)
    with open(os.path.join(B.OUTS[1], LICENCE), "wb") as f: f.write(licence)

    log(f"instance {LOC} (wght 400 to 700 kept, default 400; opsz pinned at 14, the text optical size), then build.py's "
        f"build_one: WOFF2, LATIN, FEATS, every name record, no hinting, the notdef outline, the source's head.modified")
    log(f"{'file':42s} {'bytes':>7s} {'KB':>7s} {'KiB':>7s}  sha256")
    n = len(data)
    log(f"{NAME:42s} {n:7d} {n/1000:7.1f} {n/1024:7.1f}  {hashlib.sha256(data).hexdigest()}")
    log(f"line {CAP:,} bytes: ok ({n/CAP*100:.1f}%); written to public/fonts/ and docs/brand/fonts/, byte-identical")
    m = B.metrics(os.path.join(B.OUTS[0], NAME))
    log(f"{NAME}: glyphs {m['glyphs']}, upm {m['upm']}, x-height {m['xh']:.3f}, cap {m['cap']:.3f}, "
        f"useTypo {m['useTypo']}, typo asc/desc/gap {m['typo'][0]:.3f}/{m['typo'][1]:.3f}/{m['typo'][2]:.3f}, "
        f"digit advances {m['digits']}, axes {m['axes']}, features {','.join(m['feats'])}")
    cps = ", ".join(f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in ranges(facts["cmap"]))
    log(f"checks: cmap {len(facts['cmap'])} code points, all in LATIN ({cps}); GSUB {','.join(facts['gsub'])}; "
        f"GPOS {','.join(facts['gpos'])}; name IDs {','.join(map(str, facts['names']))}; head.macStyle and "
        f"OS/2.fsSelection italic bits off")

    path = os.path.join(B.OUTS[0], NAME)
    asc, desc, gap = m["typo"] if m["useTypo"] else m["hhea"]
    for fam, wght, bold in FALLBACKS:
        sa = B.avg_advance(path, B.SAMPLE, {"wght": wght}) / B.avg_advance(clones[bold], B.SAMPLE)
        log(f"{fam} {wght}: size-adjust {sa*100:.2f}%; ascent-override {asc/sa*100:.2f}%; "
            f"descent-override {abs(desc)/sa*100:.2f}%; line-gap-override {gap/sa*100:.2f}%")
    if os.path.isdir(B.LIB):
        log("clone  Liberation Sans Regular (400) and Bold (600, 700), on build.py's SAMPLE; the local() faces are "
            "Arial and Arial Bold, whose advance widths Liberation Sans matches")
    else:
        log(f"clone  Arial ({clones[False]} for 400, {clones[True]} for 600 and 700), on build.py's SAMPLE: Liberation "
            f"Sans is not installed here, and it matches Arial's advance widths by design, so the ratios are the same")
    log("via python3 scripts/fonts/build-inter.py (python on Windows), fontTools 4.66.1 and brotli")

    with open(B.MANIFEST, encoding="utf-8", newline="") as f: text = f.read()
    at = text.find(HEAD)
    keep = (text[:at] if at >= 0 else text).rstrip("\n") + "\n"
    nxt = text.find("\n== ", at + 1) if at >= 0 else -1   # a section after this one (SECTION INDEX, nav-fallback.py) stays
    tail = ("\n" + text[nxt + 1:]) if nxt >= 0 else ""
    with open(B.MANIFEST, "w", encoding="utf-8", newline="\n") as f: f.write(keep + "\n" + out.getvalue() + tail)
    print(f"\nwrote {rel(os.path.join(B.OUTS[0], NAME))}, {rel(os.path.join(B.OUTS[1], NAME))}, "
          f"{rel(os.path.join(B.OUTS[1], LICENCE))} and the ABOUT PAGE section of {rel(B.MANIFEST)}")

if __name__ == "__main__":
    main()
