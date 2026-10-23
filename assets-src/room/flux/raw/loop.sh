#!/bin/zsh
# usage: loop.sh <name> <still.png> <16:9|9:16> "<prompt>"  (uploads the still, runs Kling first=last frame 5 s std, saves ../edited/<name>.mp4)
set -e; name=$1; still=$2; ar=$3; prompt=$4; cd "$(dirname "$0")/../edited"
IU=$(higgsfield upload create "$still" --json | python3 -I -c "import json,sys; print(json.load(sys.stdin)['id'])")
higgsfield generate create kling_o3_flf --prompt "$prompt" --start-image "$IU" --end-image "$IU" --duration 5 --mode std --multi_shots false --aspect_ratio "$ar" --sound off --wait --wait-timeout 15m --json > "$name-job.json" 2>&1 || true
python3 -I - "$name" <<'PY'
import json,sys; n=sys.argv[1]; raw=open(f'{n}-job.json').read()
try: d=json.loads(raw[raw.find('['):]); d=d[0] if isinstance(d,list) else d
except Exception: print(n,'NO JSON:',raw[:300]); sys.exit(1)
print(n, d.get('status'), d.get('id')); open(f'{n}.url','w').write(d.get('result_url') or '')
PY
u=$(cat "$name.url"); [ -n "$u" ] && curl -s -L -o "$name.mp4" "$u" && echo "$name saved $(stat -f%z "$name.mp4") B"
