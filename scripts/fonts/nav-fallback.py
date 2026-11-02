#!/usr/bin/env python3
"""The section index's fallback face: "Work Sans Fallback" 300, metric-matched to the quiz result's Work Sans file
(exception E-NAV-font, docs/specs/navbar.md section 10, 2026-11-03: the index set in Work Sans Light capitals, one of the
faces added for the quiz result on 2026-11-02). The file itself is not built here: work-sans-300-latin.woff2 is the
result's file as it stands (src/styles/fonts.css, docs/specs/quiz.md section 10, item 20). This script only computes the
four overrides the way build.py computes them for the brand faces (size-adjust = the mean advance of the shipped file
over the clone's on build.py's SAMPLE; the overrides = the file's typo metrics divided by size-adjust) and writes its
own section of scripts/fonts/manifest.txt, "== SECTION INDEX", at the end of the file; nothing above it changes, and
build-inter.py keeps it when it rewrites the ABOUT PAGE section. The numbers in src/styles/fonts.css are quoted from
the manifest, never typed by hand (tests/unit/site-nav.test.ts holds them equal).

Clones: Liberation Sans Regular where /usr/share/fonts/truetype/liberation/ exists; else Arial (C:/Windows/Fonts/arial.ttf
on Windows, /System/Library/Fonts/Supplemental/Arial.ttf on macOS), whose advance widths Liberation Sans matches by
design, so the ratios are the same. The local() face is Arial either way.

Run from the repo root:  python3 -I scripts/fonts/nav-fallback.py   (python on Windows). Needs fontTools, as build.py.
"""
import importlib.util, io, os, sys

sys.dont_write_bytecode = True                   # loading build.py must leave no __pycache__ in the repository
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("skreed_fonts_build", os.path.join(HERE, "build.py"))
B = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(B)   # loaded by path, so python -I works too

NAME = "work-sans-300-latin.woff2"
HEAD = "== SECTION INDEX (the navbar's face, 2026-11-03; exception E-NAV-font; the quiz result's Work Sans file, preloaded on / and /about/)"
CLONES = [B.LIB + "LiberationSans-Regular.ttf", "C:/Windows/Fonts/arial.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"]

def main():
    path = os.path.join(B.OUTS[0], NAME)
    if not os.path.exists(path): sys.exit(f"nav-fallback: {path} is missing; nothing was written")
    clone = next((c for c in CLONES if os.path.exists(c)), None)
    if clone is None: sys.exit("nav-fallback: no metric clone of Arial found; nothing was written")
    out = io.StringIO()
    def log(s): print(s); out.write(s + "\n")
    log(HEAD)
    with open(path, "rb") as f: data = f.read()
    import hashlib
    n = len(data)
    log(f"{'file':42s} {'bytes':>7s} {'KB':>7s} {'KiB':>7s}  sha256")
    log(f"{NAME:42s} {n:7d} {n/1000:7.1f} {n/1024:7.1f}  {hashlib.sha256(data).hexdigest()}")
    m = B.metrics(path)
    log(f"{NAME}: glyphs {m['glyphs']}, upm {m['upm']}, x-height {m['xh']:.3f}, cap {m['cap']:.3f}, useTypo {m['useTypo']}, "
        f"typo asc/desc/gap {m['typo'][0]:.3f}/{m['typo'][1]:.3f}/{m['typo'][2]:.3f}, hhea asc/desc/gap "
        f"{m['hhea'][0]:.3f}/{m['hhea'][1]:.3f}/{m['hhea'][2]:.3f}, digit advances {m['digits']}, axes {m['axes']}, features {','.join(m['feats'])}")
    asc, desc, gap = m["typo"] if m["useTypo"] else m["hhea"]
    sa = B.avg_advance(path, B.SAMPLE) / B.avg_advance(clone, B.SAMPLE)
    log(f"Work Sans Fallback 300: size-adjust {sa*100:.2f}%; ascent-override {asc/sa*100:.2f}%; "
        f"descent-override {abs(desc)/sa*100:.2f}%; line-gap-override {gap/sa*100:.2f}%")
    which = "Liberation Sans Regular" if clone.startswith(B.LIB) else f"Arial ({clone})"
    log(f"clone  {which}, on build.py's SAMPLE; the local() face is Arial, whose advance widths Liberation Sans matches by design, so the ratios are the same")
    log("via python3 -I scripts/fonts/nav-fallback.py (python on Windows) and fontTools")
    with open(B.MANIFEST, encoding="utf-8", newline="") as f: text = f.read()
    at = text.find(HEAD)
    keep = (text[:at] if at >= 0 else text).rstrip("\n") + "\n"
    with open(B.MANIFEST, "w", encoding="utf-8", newline="\n") as f: f.write(keep + "\n" + out.getvalue())
    print(f"\nwrote the SECTION INDEX section of {os.path.relpath(B.MANIFEST, B.ROOT)}")

if __name__ == "__main__":
    main()
