#!/bin/bash
# render_missing.sh <W> <H> <dsf> <tag> <variant...>: renders only the listed variants (base2 = second run of the shipped page)
P=/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/port; T=$P/bundle-probe/three-0.165.0/node_modules/three; R=$P/tex-probe/renders
cd $P/scripts; W=$1; H=$2; D=$3; TAG=$4; shift 4
for v in "$@"; do
  if [ $v = base2 ]; then node render.mjs /home/user/skreed-pre-launch/prototypes/hero-v9/index.html $T $W $H $D $R/base2_$TAG.png
  else node render.mjs $P/tex-probe/variants/v_$v.html $T $W $H $D $R/${v}_$TAG.png; fi
done
echo BATCH DONE $TAG
