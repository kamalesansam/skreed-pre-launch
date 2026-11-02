#!/usr/bin/env bash
# Rebuild section 5's jar frames: pack the pile, render every fill state, compose and encode them.
#   bash scripts/signup/jars/run.sh [all|pack|render|compose]
# BLENDER overrides the Blender 5.2 executable; SAMPLES the Cycles samples (64). Intermediates go to
# scripts/signup/jars/work/ (git-ignored); the shipped files to src/assets/signup/jars/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
B="${BLENDER:-C:/Program Files/Blender Foundation/Blender 5.2/blender.exe}"
WORK="$HERE/work"
STEP="${1:-all}"
mkdir -p "$WORK/raw"
if [[ $STEP == all || $STEP == pack ]]; then
  "$B" -b --factory-startup --python "$HERE/pack.py" -- --out "$WORK/pile.json" --top 3.80 --seed 11 2>&1 | grep -E "^PACK|Error|Traceback"
fi
if [[ $STEP == all || $STEP == render ]]; then
  "$B" -b --factory-startup --python "$HERE/render.py" -- --pile "$WORK/pile.json" --out "$WORK/raw" --samples "${SAMPLES:-64}" 2>&1 | grep -E "^(BUILD|CAMERA|RENDER|ALL)|Error|Traceback"
fi
if [[ $STEP == all || $STEP == compose ]]; then
  node "$HERE/compose.mjs" --raw "$WORK/raw" --masters "$WORK/final" --install "$ROOT/src/assets/signup/jars"
fi
