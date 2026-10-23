#!/bin/zsh
# usage: inpaint.sh <scene> "<prompt>"   (uploads the 2k still and mask, runs the masked inpaint, saves <scene>-edit.png)
set -e; n=$1; prompt=$2; cd "$(dirname "$0")"
MU=$(higgsfield upload create "$PWD/$n-mask-in.png" --json | python3 -I -c "import json,sys; d=json.load(sys.stdin); print(json.dumps({'id':d['id'],'type':'media_input','url':d['url']}))"); echo "$MU" > "$n.mask.json"
IU=$(higgsfield upload create "$PWD/$n-in.png" --json | python3 -I -c "import json,sys; print(json.load(sys.stdin)['id'])")
higgsfield generate create nano_banana_2_1 --prompt "$prompt" --is_inpaint true --mask "@$PWD/$n.mask.json" --resolution 2k --aspect_ratio 9:16 --image "$IU" --wait --wait-timeout 10m --json > "$n-job.json" 2>&1 || true
python3 -I - "$n" <<'PY'
import json,sys; n=sys.argv[1]; raw=open(f'{n}-job.json').read()
try: d=json.loads(raw[raw.find('['):]); d=d[0] if isinstance(d,list) else d
except Exception: print(n, 'NO JSON:', raw[:300]); sys.exit(1)
print(n, d.get('status'), d.get('id')); open(f'{n}-edit.url','w').write(d.get('result_url') or '')
PY
u=$(cat "$n-edit.url"); [ -n "$u" ] && curl -s -L -o "$n-edit.png" "$u" && echo "$n saved $(stat -f%z "$n-edit.png") B"
