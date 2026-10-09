#!/usr/bin/env bash
# One-command intake for the phone case model the user will upload.
#   bash intake.sh <path to the zip|glb|folder> [family id, default blissful-blues] [lod1 triangles, default 4000]
# 1. verify-case.mjs: safety, inventory, contract checks, shipped-size estimate, writes LOD0/LOD1 (meshopt)
# 2. renders: three views + the 24-up grid in one family, matte and gloss, at 390 px (DPR 2) and 1280 px,
#    for the raw model and the LOD1, plus a calibration grid under Neutral tone mapping
# Output goes to a fresh folder next to this script: intake-<timestamp>/. Nothing in the zip is executed.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
IN="$(realpath "$1")"; FAM="${2:-blissful-blues}"; LOD1="${3:-4000}"
OUT="$ROOT/intake-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$OUT/files" "$OUT/renders"
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
cd "$ROOT"
set +e
node "$HERE/verify-case.mjs" "$IN" --work "$OUT/verify" --optimise --lod1 "$LOD1" | tee "$OUT/verify.txt"
VERDICT=${PIPESTATUS[0]}
set -e
cp "$ROOT/files/shades-240.json" "$OUT/files/"
# pick the first model found (the verifier lists them); prefer the original over the LOD outputs
SRC=$(python3 -I -c "import json,sys; r=json.load(open(sys.argv[1]))['report']; print(r['models'][0]['file'] if r and r['models'] else '')" "$OUT/verify/report.json")
if [ -z "$SRC" ]; then echo "no loadable model; see $OUT/verify.txt"; exit 1; fi
cp "$SRC" "$OUT/files/model$(echo "$SRC" | grep -o '\.[a-z]*$')"
[ -d "$OUT/verify/out" ] && cp "$OUT"/verify/out/*.glb "$OUT/files/" 2>/dev/null || true
export LOCALFILES="$OUT/files"
render () { # name model query vp dpr
  node "$HERE/run-page.mjs" case-lineup.html "model=https://local.test/files/$2&shades=https://local.test/files/shades-240.json&family=$FAM&$3" "$OUT/renders/$1.png" --vp "$4" --dpr "$5" --json "$OUT/renders/$1.json" | cut -c1-300
}
M=$(ls "$OUT/files" | grep -E '^model\.glb$' | head -1 || true)
[ -z "$M" ] && M=$(ls "$OUT/files" | grep -E '\.lod0\.glb$' | head -1)  # a .gltf with external files: render the self-contained LOD0
L1=$(ls "$OUT/files" | grep -E '\.lod1\.glb$' | head -1 || true)
render views-matte "$M" "layout=views&finish=matte" 1200x520 1
render views-gloss "$M" "layout=views&finish=gloss" 1200x520 1
render grid-matte-390 "$M" "layout=grid&finish=matte" 390x844 2
render grid-gloss-390 "$M" "layout=grid&finish=gloss" 390x844 2
render row-gloss-1280 "$M" "layout=row&finish=gloss" 1280x800 1
render calib-neutral "$M" "layout=calib&finish=matte&tone=neutral" 1280x800 1
[ -n "$L1" ] && render grid-matte-390-lod1 "$L1" "layout=grid&finish=matte" 390x844 2
echo "verdict exit=$VERDICT  outputs: $OUT"
